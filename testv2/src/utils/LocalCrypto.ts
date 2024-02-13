// @ts-nocheck
import * as __ from "lib384/dist/384.esm.js";
function str2ab(str) {
    const buf = new ArrayBuffer(str.length)
    const bufView = new Uint8Array(buf)
    for (let i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i)
    }
    return buf
}

function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint8Array(buf))
}

export async function _i_encrypt(data, password): Promise<any> {
    const salt = window.crypto.getRandomValues(new Uint8Array(16))
    const derivedKey = await deriveEncryptionSecretKey(salt, password)

    return _encrypt(data, salt, derivedKey)
}


async function deriveEncryptionSecretKey(salt, jwk) {

    let secretKey = await importSecretKey(jwk)

    return window.crypto.subtle.deriveKey({
        name: 'PBKDF2',
        salt: salt,
        iterations: 1000000,
        hash: {
            name: 'SHA-256'
        },
    },
        secretKey,
        {
            name: 'AES-GCM',
            length: 256,
        },
        true,
        ['encrypt', 'decrypt']
    )
}

async function _encrypt(bytes, salt, derivedKey) {
    if (typeof bytes === 'string') {
        bytes = str2ab(bytes)
    }
    const iv = window.crypto.getRandomValues(new Uint8Array(16))
    const content = new Uint8Array(bytes)
    return window.crypto.subtle.encrypt({
        iv,
        name: 'AES-GCM'
    }, derivedKey, content)
        .then((encrypted) => {
            let encryptedContent = new Uint8Array(encrypted)
            let len = iv.length + salt.length + encryptedContent.length
            let x = new Uint8Array(len)
            x.set(iv)
            x.set(salt, iv.length)
            x.set(encryptedContent, salt.length + iv.length)
            return {
                bytes: x,
                string: () => ab2str(x),
                hex: () => bytesToHex(x)
            }
        })
        .catch((err) => {
            console.error('Unable to encrypt:', err)
            return {}
        })
}

async function importSecretKey(jwk) {
    let privateKey = __.utils.base64ToArrayBuffer(jwk.d)
    return window.crypto.subtle.importKey(
        "raw",
        privateKey,
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    )
}

async function deriveDecryptionSecretKey(salt, jwk) {

    let secretKey = await importSecretKey(jwk)

    return window.crypto.subtle.deriveKey({
        name: 'PBKDF2',
        salt: salt,
        iterations: 1000000,
        hash: {
            name: 'SHA-256'
        },
    },
        secretKey,
        {
            name: 'AES-GCM',
            length: 256,
        },
        true,
        ['encrypt', 'decrypt']
    )
}

function bytesToHex(bytes) {
    bytes = new Uint8Array(bytes)
    let hex = ''
    bytes.forEach((byte) => hex += (byte.toString(16) + '').padStart(2, '0'))
    return hex
}


export async function _i_decrypt(bytes, jwk) {
    if (typeof bytes === 'string') {
        bytes = str2ab(bytes)
    }

    bytes = new Uint8Array(bytes)
    const salt = new Uint8Array(bytes.slice(16, 32))
    const iv = new Uint8Array(bytes.slice(0, 16))
    const content = new Uint8Array(bytes.slice(32))

    const derivedKey = await deriveDecryptionSecretKey(salt, jwk)
    return window.crypto.subtle.decrypt({
        iv,
        name: 'AES-GCM',
        // length: 256,
    }, derivedKey, content)
        .then((decrypted) => {
            return {
                bytes: decrypted,
                string: () => ab2str(decrypted),
                hex: () => bytesToHex(decrypted)
            }
        }).catch((err) => {
            console.error(err)
            return null
        }
        )
}