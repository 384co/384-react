// (c) 2023-2024, 384 (tm)
import * as __ from 'lib384v2/dist/384.esm'
import elliptic from 'elliptic'

// bootstraps a valid JWK from a strongpin (or any entropy material)

const DEBUG = true

if (!elliptic || !elliptic.ec) {
    // rely on elliptic having been loaded, presumably downloaded from:
    // https://github.com/indutny/elliptic/blob/master/dist/elliptic.min.js
    throw new Error('Module "elliptic" loaded, but elliptic.ec is not defined');
}
const ec = new elliptic.ec('p384'); // Use P-384 curve

export type VaultOptions = {
    salt?: Uint8Array,
    iterations?: number
}

export type VaultParams = {
    strongpin: string,
    passphrase: string,
    options: VaultOptions
}

export type VaultWithPrivateKey = {
    strongpin: string,
    passphrase: string,
    ownerPrivateKey: __.SBUserPrivateKey,
    options?: VaultOptions
}

// tries to generate a valid JWK; sometimes fails, in which case returns null
async function _vaultFromEntropy(entropy: string, salt: VaultOptions['salt'], iterations: VaultOptions['iterations']): Promise<JsonWebKey | null> {
    // local helpers, we want this file (vault.js) to be self-contained
    function hexToBase64(hexString: string): string {
        const byteArray = new Uint8Array(hexString.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
        return btoa(String.fromCharCode(...byteArray));
    }

    function hexToBase64Url(hexString: string): string {
        return hexToBase64(hexString)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    }

    const hash = "SHA-384";
    const derivedKeyLength = 384 / 8; // For P-384 curve, in bytes
    const entropyBuffer = new TextEncoder().encode(entropy);
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        entropyBuffer,
        { name: "PBKDF2" },
        false,
        ["deriveKey", "deriveBits"]
    );
    const derivedKey = await crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: iterations,
            hash: hash
        },
        keyMaterial,
        {
            name: "HMAC",
            hash: hash,
            length: derivedKeyLength * 8
        },
        true,
        ["sign"]
    );

    // Convert the derived key to hexadecimal format for ec
    const derivedKeyArrayBuffer = await crypto.subtle.exportKey("raw", derivedKey);
    const byteArray = new Uint8Array(derivedKeyArrayBuffer);
    const fixedPrivateKeyHex = Array.from(byteArray).map(byte => byte.toString(16).padStart(2, '0')).join('');
    if (DEBUG) console.log("Derived key: " + fixedPrivateKeyHex);

    // Generate key pair using the d private key
    const keyPair = ec.keyFromPrivate(fixedPrivateKeyHex, 'hex');
    const publicKey = keyPair.getPublic();
    const privateKey = keyPair.getPrivate();

    // Convert key pair to JWK format
    const jwk = {
        kty: "EC",
        crv: "P-384",
        x: hexToBase64Url(publicKey.getX().toString('hex')),
        y: hexToBase64Url(publicKey.getY().toString('hex')),
        d: hexToBase64Url(privateKey.toString('hex')),
        ext: true,
        key_ops: ["deriveKey"] // For ECDH
    };

    const importedKey = await crypto.subtle.importKey("jwk", jwk, {
        name: "ECDH",
        namedCurve: "P-384"
    }, true, ["deriveKey"]).then((key) => {
        if (DEBUG) console.log("Imported test key successfully! Looks good: ", key)
        return key
    }).catch((_err) => {
        return null
    });
    if (!importedKey) {
        if (DEBUG) console.warn(`Could not create a key, will return null`)
        return null
    } else {
        if (DEBUG) {
            console.log("++++ Imported test key successfully! Looks good")
            console.log("Final result in subtle key format: ", importedKey)
        }
        // we return the JWK, not the importedKey, after having verified it works
        return jwk;
    }
}

function validateOptions(options: VaultOptions): VaultOptions {
    if (!options) throw new Error("validateOptions: missing options")
    var { salt, iterations } = options
    // this process requires 16-byte salt, which should be random BUT unique for every
    // application / use case. it's not a "secret", it just hardens re-use of the same
    // passphrases or strongpins across different situations. in many cases ok to just
    // use the default one here
    if (!salt) salt = new Uint8Array([42, 187, 119, 99, 64, 157, 13, 220, 54, 210, 73, 177, 131, 206, 246, 28])
    if (!iterations) iterations = 10000000
    // final version we do 10M iterations... IMPORTANT that production is 10M
    if (iterations < 10000000) console.warn("WARNING - using LESS THAN 10M ITERATIONS - test/dev only!")
    return { salt: salt, iterations: iterations }
}

//
// this is the main function, it takes a salt and a entropy and returns a JWK
// the key can be used for ECDH (deriveKey) and ECDSA (sign).
// the salt is a Uint8Array, the entropy is any string
// for the same salt and entropy, the same key will be generated
//
// not all entropys will generate a valid key, but most will.
// so this function returns 'null' if it cannot use the provided phrase
// (or rather, entropy/key material), in which case you'll need to try again
// with a different entropy
//
// standard usage is strongpin + passphrase, or roughly (76+39) bits of entropy
//
async function vaultFromEntropy(entropy: string,options: VaultOptions = {}): Promise<JsonWebKey | null>{
    console.log("Will try generating a vault from entropy", entropy)
    if (!entropy) throw new Error("vaultFromEntropy: missing entropy")
    const { salt, iterations } = validateOptions(options)
    return _vaultFromEntropy(entropy, salt, iterations)
}

async function privateKeyFromEntropy(entropy: string, options: VaultOptions = {}) {
    if (!entropy) throw new Error("privateKeyFromEntropy: missing entropy")
    const { salt, iterations } = validateOptions(options)
    const jwk = await _vaultFromEntropy(entropy, salt, iterations)
    if (!jwk) return null
    const sb384 = await new __.NewSB.SB384(jwk).ready
    return sb384.userPrivateKey
}

async function generateRandomVault(passphrase: string, options: VaultOptions = {}): Promise<{ strongpin: string, passphrase: string, jwk: JsonWebKey, options: VaultOptions } | null> {
    const { salt, iterations } = validateOptions(options)
    let tries = 0;
    const maxTries = 20; // should be more than enough
    let randomStrongPin;
    let jwkFromStrongPin;
    let entropy;
    // not all phrases/key material will work, so if vaultFromEntropy returns 'null'
    // we generate a new randomStrongPin and call vaultFromEntropy again
    while (tries <= maxTries) {
        // use strongpin, "generate16" is a convenience function,
        // it will return a 4x4 set of strongpins (space separated)
        randomStrongPin = await __.crypto.strongpin.generate16();
        entropy = randomStrongPin + passphrase
        jwkFromStrongPin = await _vaultFromEntropy(entropy, salt, iterations)
        if (jwkFromStrongPin) {
            if (DEBUG) console.log("Generated JWK from strongpin LOOKS GOOD:", jwkFromStrongPin)
            break;
        } else {
            console.warn(`Attempt ${tries}: Generated strongpin (plus passphrase) '${entropy}' but it didn't work, trying again ...`)
            tries++;
        }
    }
    if (tries >= maxTries) {
        console.error(`Failed to generate JWK from strongpin, giving up after ${maxTries} ... something is wrong`)
        return null
    } else {
        if (DEBUG) console.log(`Generated JWK from strongpin in ${tries} tries`)
        if(!randomStrongPin || !jwkFromStrongPin){
            return null;
        }
        return {
            strongpin: randomStrongPin,
            passphrase: passphrase,
            jwk: jwkFromStrongPin,
            options: { salt: salt, iterations: iterations }
        }
    }
}

// exported interface; matches 'vault.d.ts'

async function generateVault(passphrase: string, options: VaultOptions): Promise<VaultWithPrivateKey> {
    const newVault = await generateRandomVault(passphrase, options)
    if (!newVault) throw new Error("[generateVault] failed to generate vault")
    if (options)
        return {
            strongpin: newVault.strongpin,
            passphrase: newVault.passphrase,
            ownerPrivateKey: (await new __.NewSB.SB384(newVault.jwk).ready).userPrivateKey,
            options: newVault.options
        }
    else
        return {
            strongpin: newVault.strongpin,
            passphrase: newVault.passphrase,
            ownerPrivateKey: (await new __.NewSB.SB384(newVault.jwk).ready).userPrivateKey
        }
}

async function recoverVault(vault: VaultParams): Promise<VaultWithPrivateKey> {
    const { strongpin, passphrase, options } = vault
    const jwk = await vaultFromEntropy(strongpin + passphrase, options)
    if (!jwk) throw new Error("[recoverVault] failed to recover vault")
    const sb384 = await new __.NewSB.SB384(jwk).ready
    if (options) {
        return {
            strongpin: strongpin,
            passphrase: passphrase,
            ownerPrivateKey: sb384.userPrivateKey,
            options: options
        }
    } else {
        return {
            strongpin: strongpin,
            passphrase: passphrase,
            ownerPrivateKey: sb384.userPrivateKey
        }
    }
}


module.exports = { generateVault, recoverVault };
