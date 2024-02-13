// @ts-nocheck
// (c) 2023, 384 (tm)
import * as __ from 'lib384/dist/384.esm'
const DEBUG = false;
if (DEBUG) {
    console.log("==== WALLET.js ====")
    console.warn("WARNING - running in DEBUG mode, disable for production")
}

if (!elliptic.ec) {
    // rely on elliptic having been loaded, presumably downloaded from:
    // https://github.com/indutny/elliptic/blob/master/dist/elliptic.min.js
    throw new Error('Module "elliptic" loaded, but elliptic.ec is not defined');
}
const ec = new elliptic.ec('p384'); // Use P-384 curve

// // just for local testing
// function generateWallet() {
//     const key = ec.genKeyPair();
//     const publicKey = key.getPublic('hex');
//     const privateKey = key.getPrivate('hex');
//     return { publicKey, privateKey };
// }

async function _walletFromStrongpin(strongpin, salt, iterations) {
    // local helpers, we want this file (wallet.js) to be self-contained
    function hexToBase64(hexString) {
        const byteArray = new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
        return btoa(String.fromCharCode.apply(null, byteArray));
    }
    function hexToBase64Url(hexString) {
        let base64 = hexToBase64(hexString);
        let base64url = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        return base64url;
    }

    const hash = "SHA-384";
    const derivedKeyLength = 384 / 8; // For P-384 curve, in bytes
    const strongpinBuffer = new TextEncoder().encode(strongpin);
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        strongpinBuffer,
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

    if (DEBUG) console.log("Final result in JWK format:", jwk)

    if (DEBUG) console.log("VERIFICATION: Will try to import key into crypto.subtle")

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
        if (DEBUG) console.warn(`Could not create a key based on ${strongpin}, will return null`)
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

// // see salt comments above
// const strongpinSalt = new Uint8Array([220, 54, 210, 73, 177, 131, 206, 246, 28, 119, 99, 64, 42, 187, 157, 13]);


function validateOptions(options) {
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
// this is the main function, it takes a salt and a strongpin and returns a JWK
// the key can be used for ECDH (deriveKey) and ECDSA (sign).
// the salt is a Uint8Array, the strongpin is any string
// for the same salt and strongpin, the same key will be generated
//
// not all strongpins will generate a valid key, but most will.
// so this function returns 'null' if it cannot use the provided phrase
// (or rather, entropy/key material), in which case you'll need to try again
// with a different strongpin
//
// we default to using strongpins, but this parameter can be any
// entropy material in string form
//
export async function walletFromStrongpin(
    strongpin,
    options = {}
) {
    if (!strongpin) throw new Error("walletFromStrongpin: missing strongpin")
    const { salt, iterations } = validateOptions(options)
    // if (DEBUG) {
    //     console.log("==== walletFromStrongpin ====")
    //     console.log("strongpin (key material): " + strongpin)
    //     console.log("salt: " + salt)
    //     console.log("iterations: " + iterations)
    // }

    return _walletFromStrongpin(strongpin, salt, iterations)
}

export function jwkFromPassphrase(strongphrase, options = {}) {
    return walletFromStrongpin(strongphrase, options)
}

export async function generateRandomWallet(options = {}) {
    const { salt, iterations } = validateOptions(options)
    let tries = 0;
    const maxTries = 20; // should be more than enough
    let randomStrongPin;
    let jwkFromStrongPin
    // not all phrases/key material will work, so if walletFromStrongpin returns 'null'
    // we generate a new randomStrongPin and call walletFromStrongpin again
    while (tries <= maxTries) {
        // use strongpin, "generate16" is a convenience function,
        // it will return a 4x4 set of strongpins (space separated)
        randomStrongPin = await __.crypto.strongpin.generate16();
        jwkFromStrongPin = await _walletFromStrongpin(randomStrongPin, salt, iterations)
        if (jwkFromStrongPin) {
            if (DEBUG) console.log("Generated JWK from strongpin LOOKS GOOD:", jwkFromStrongPin)
            break;
        } else {
            console.warn(`Attempt ${tries}: Generated strongpin '${randomStrongPin}' but it didn't work, trying again ...`)
            tries++;
        }
    }
    if (tries >= maxTries) {
        console.error(`Failed to generate JWK from strongpin, giving up after ${maxTries} ... something is wrong`)
        return null
    } else {
        if (DEBUG) console.log(`Generated JWK from strongpin in ${tries} tries`)
        return { strongpin: randomStrongPin as string, jwk: jwkFromStrongPin as JsonWebKey }
    }

}
