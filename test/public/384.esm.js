var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp(target, key, result);
  return result;
};

// src/utils/b64.ts
var b64lookup = [];
var urlLookup = [];
var revLookup = [];
var CODE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
var CODE_B64 = CODE + "+/";
var CODE_URL = CODE + "-_";
var PAD = "=";
for (let i = 0, len = CODE_B64.length; i < len; ++i) {
  b64lookup[i] = CODE_B64[i];
  urlLookup[i] = CODE_URL[i];
  revLookup[CODE_B64.charCodeAt(i)] = i;
}
revLookup["-".charCodeAt(0)] = 62;
revLookup["_".charCodeAt(0)] = 63;
function getLens(b64) {
  const len = b64.length;
  let validLen = b64.indexOf(PAD);
  if (validLen === -1)
    validLen = len;
  const placeHoldersLen = validLen === len ? 0 : 4 - validLen % 4;
  return [validLen, placeHoldersLen];
}
function base64ToArrayBuffer(str) {
  switch (str.length % 4) {
    case 2:
      str += "==";
      break;
    case 3:
      str += "=";
      break;
  }
  const [validLen, placeHoldersLen] = getLens(str);
  const arr = new Uint8Array((validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen);
  let tmp = 0, curByte = 0, i = 0;
  const len = placeHoldersLen > 0 ? validLen - 4 : validLen;
  for (i = 0; i < len; i += 4) {
    const r0 = revLookup[str.charCodeAt(i)];
    const r1 = revLookup[str.charCodeAt(i + 1)];
    const r2 = revLookup[str.charCodeAt(i + 2)];
    const r3 = revLookup[str.charCodeAt(i + 3)];
    tmp = r0 << 18 | r1 << 12 | r2 << 6 | r3;
    arr[curByte++] = tmp >> 16 & 255;
    arr[curByte++] = tmp >> 8 & 255;
    arr[curByte++] = tmp & 255;
  }
  if (placeHoldersLen === 2) {
    const r0 = revLookup[str.charCodeAt(i)];
    const r1 = revLookup[str.charCodeAt(i + 1)];
    tmp = r0 << 2 | r1 >> 4;
    arr[curByte++] = tmp & 255;
  }
  if (placeHoldersLen === 1) {
    const r0 = revLookup[str.charCodeAt(i)];
    const r1 = revLookup[str.charCodeAt(i + 1)];
    const r2 = revLookup[str.charCodeAt(i + 2)];
    tmp = r0 << 10 | r1 << 4 | r2 >> 2;
    arr[curByte++] = tmp >> 8 & 255;
    arr[curByte++] = tmp & 255;
  }
  return arr;
}
var MAX_CHUNK_LENGTH = 16383;
function tripletToBase64(lookup, num) {
  return lookup[num >> 18 & 63] + lookup[num >> 12 & 63] + lookup[num >> 6 & 63] + lookup[num & 63];
}
function encodeChunk(lookup, view, start, end) {
  let tmp;
  const output = new Array((end - start) / 3);
  for (let i = start, j = 0; i < end; i += 3, j++) {
    tmp = (view.getUint8(i) << 16 & 16711680) + (view.getUint8(i + 1) << 8 & 65280) + (view.getUint8(i + 2) & 255);
    output[j] = tripletToBase64(lookup, tmp);
  }
  return output.join("");
}
var bs2dv = (bs) => bs instanceof ArrayBuffer ? new DataView(bs) : new DataView(bs.buffer, bs.byteOffset, bs.byteLength);
function arrayBufferToBase64(buffer, variant = "url") {
  if (buffer == null)
    throw new Error("arrayBufferToBase64() -> null paramater");
  const view = bs2dv(buffer);
  const len = view.byteLength;
  const extraBytes = len % 3;
  const len2 = len - extraBytes;
  const parts = new Array(
    Math.floor(len2 / MAX_CHUNK_LENGTH) + Math.sign(extraBytes)
  );
  const lookup = variant == "url" ? urlLookup : b64lookup;
  const pad = "";
  let j = 0;
  for (let i = 0; i < len2; i += MAX_CHUNK_LENGTH) {
    parts[j++] = encodeChunk(
      lookup,
      view,
      i,
      i + MAX_CHUNK_LENGTH > len2 ? len2 : i + MAX_CHUNK_LENGTH
    );
  }
  if (extraBytes === 1) {
    const tmp = view.getUint8(len - 1);
    parts[j] = lookup[tmp >> 2] + lookup[tmp << 4 & 63] + pad + pad;
  } else if (extraBytes === 2) {
    const tmp = (view.getUint8(len - 2) << 8) + view.getUint8(len - 1);
    parts[j] = lookup[tmp >> 10] + lookup[tmp >> 4 & 63] + lookup[tmp << 2 & 63] + pad;
  }
  return parts.join("");
}

// ../snackabra-jslib/src/snackabra.ts
var version = "2.0.0-alpha.5 (build 04)";
var NEW_CHANNEL_MINIMUM_BUDGET = 32 * 1024 * 1024;
var DBG = false;
var DBG2 = false;
var currentSBOHVersion = "2";
function SBFetch(input, init) {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  if (url.includes("a32.")) {
    return Promise.reject(new Error("URL contains forbidden substring 'a32.'"));
  }
  return fetch(input, init ?? { method: "GET" });
}
function WrapError(e) {
  if (e instanceof Error)
    return e;
  else
    return new Error(String(e));
}
function _sb_exception(loc, msg) {
  const m = "<< SB lib error (" + loc + ": " + msg + ") >>";
  throw new Error(m);
}
function _sb_assert(val, msg) {
  if (!val) {
    const m = `<< SB assertion error: ${msg} >>`;
    throw new Error(m);
  }
}
async function newChannelData(keys) {
  const owner384 = new SB384(keys);
  await owner384.ready;
  const exportable_pubKey = owner384.exportable_pubKey;
  const exportable_privateKey = owner384.exportable_privateKey;
  const channelId = owner384.hash;
  const encryptionKey = await crypto.subtle.generateKey({
    name: "AES-GCM",
    length: 256
  }, true, ["encrypt", "decrypt"]);
  const exportable_encryptionKey = await crypto.subtle.exportKey("jwk", encryptionKey);
  const signKeyPair = await crypto.subtle.generateKey({
    name: "ECDH",
    namedCurve: "P-384"
  }, true, ["deriveKey"]);
  const exportable_signKey = await crypto.subtle.exportKey("jwk", signKeyPair.privateKey);
  const channelData = {
    roomId: channelId,
    ownerKey: JSON.stringify(exportable_pubKey),
    encryptionKey: JSON.stringify(exportable_encryptionKey),
    signKey: JSON.stringify(exportable_signKey)
  };
  return { channelData, exportable_privateKey };
}
function encryptedContentsMakeBinary(o) {
  try {
    let t;
    let iv;
    if (DBG2) {
      console.log("=+=+=+=+ processing content");
      console.log(o.content.constructor.name);
    }
    if (typeof o.content === "string") {
      try {
        t = base64ToArrayBuffer2(decodeURIComponent(o.content));
      } catch (e) {
        throw new Error("EncryptedContents is string format but not base64 (?)");
      }
    } else {
      const ocn = o.content.constructor.name;
      _sb_assert(ocn === "ArrayBuffer" || ocn === "Uint8Array", "undetermined content type in EncryptedContents object");
      t = o.content;
    }
    if (DBG2)
      console.log("=+=+=+=+ processing nonce");
    if (typeof o.iv === "string") {
      if (DBG2) {
        console.log("got iv as string:");
        console.log(structuredClone(o.iv));
      }
      iv = base64ToArrayBuffer2(decodeURIComponent(o.iv));
      if (DBG2) {
        console.log("this was turned into array:");
        console.log(structuredClone(iv));
      }
    } else if (o.iv.constructor.name === "Uint8Array" || o.iv.constructor.name === "ArrayBuffer") {
      if (DBG2) {
        console.log("it's an array already");
      }
      iv = new Uint8Array(o.iv);
    } else {
      if (DBG2)
        console.log("probably a dictionary");
      try {
        iv = new Uint8Array(Object.values(o.iv));
      } catch (e) {
        if (DBG) {
          console.error("ERROR: cannot figure out format of iv (nonce), here's the input object:");
          console.error(o.iv);
        }
        _sb_assert(false, "undetermined iv (nonce) type, see console");
      }
    }
    if (DBG2) {
      console.log("decided on nonce as:");
      console.log(iv);
    }
    _sb_assert(iv.length == 12, `encryptedContentsMakeBinary(): nonce should be 12 bytes but is not (${iv.length})`);
    return { content: t, iv };
  } catch (e) {
    console.error("encryptedContentsMakeBinary() failed:");
    console.error(e);
    console.trace();
    console.log(e.stack);
    throw e;
  }
}
function getRandomValues(buffer) {
  if (buffer.byteLength < 4096) {
    return crypto.getRandomValues(buffer);
  } else {
    _sb_assert(!(buffer.byteLength % 1024), "getRandomValues(): large requested blocks must be multiple of 1024 in size");
    let i = 0;
    try {
      for (i = 0; i < buffer.byteLength; i += 1024) {
        let t = new Uint8Array(1024);
        crypto.getRandomValues(t);
        buffer.set(t, i);
      }
    } catch (e) {
      console.log(`got an error on index i=${i}`);
      console.log(e);
      console.trace();
    }
    return buffer;
  }
}
var messageIdRegex = /([A-Za-z0-9+/_\-=]{64})([01]{42})/;
var b64_regex = /^([A-Za-z0-9+/_\-=]*)$/;
function _assertBase64(base64) {
  return b64_regex.test(base64);
}
var isBase64Encoded = _assertBase64;
function ensureSafe(base64) {
  const z = b64_regex.exec(base64);
  _sb_assert(z && z[0] === base64, "ensureSafe() tripped: something is not URI safe");
  return base64;
}
function stripA32(value) {
  if (value && value !== "") {
    if (value.startsWith("a32."))
      console.warn("[stripA32] removing 'a32.' prefix, these should be cleaned up by now");
    return value.replace(/^a32\./, "");
  } else {
    console.warn("[stripA32] asked to strip an empty/missing string?");
    return "";
  }
}
var b64lookup2 = [];
var urlLookup2 = [];
var revLookup2 = [];
var CODE2 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
var CODE_B642 = CODE2 + "+/";
var CODE_URL2 = CODE2 + "-_";
var PAD2 = "=";
var MAX_CHUNK_LENGTH2 = 16383;
for (let i = 0, len = CODE_B642.length; i < len; ++i) {
  b64lookup2[i] = CODE_B642[i];
  urlLookup2[i] = CODE_URL2[i];
  revLookup2[CODE_B642.charCodeAt(i)] = i;
}
revLookup2["-".charCodeAt(0)] = 62;
revLookup2["_".charCodeAt(0)] = 63;
function getLens2(b64) {
  const len = b64.length;
  let validLen = b64.indexOf(PAD2);
  if (validLen === -1)
    validLen = len;
  const placeHoldersLen = validLen === len ? 0 : 4 - validLen % 4;
  return [validLen, placeHoldersLen];
}
function _byteLength(validLen, placeHoldersLen) {
  return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
}
function base64ToArrayBuffer2(str) {
  if (!_assertBase64(str))
    throw new Error(`invalid character in string '${str}'`);
  let tmp;
  switch (str.length % 4) {
    case 2:
      str += "==";
      break;
    case 3:
      str += "=";
      break;
  }
  const [validLen, placeHoldersLen] = getLens2(str);
  const arr = new Uint8Array(_byteLength(validLen, placeHoldersLen));
  let curByte = 0;
  const len = placeHoldersLen > 0 ? validLen - 4 : validLen;
  let i;
  for (i = 0; i < len; i += 4) {
    const r0 = revLookup2[str.charCodeAt(i)];
    const r1 = revLookup2[str.charCodeAt(i + 1)];
    const r2 = revLookup2[str.charCodeAt(i + 2)];
    const r3 = revLookup2[str.charCodeAt(i + 3)];
    tmp = r0 << 18 | r1 << 12 | r2 << 6 | r3;
    arr[curByte++] = tmp >> 16 & 255;
    arr[curByte++] = tmp >> 8 & 255;
    arr[curByte++] = tmp & 255;
  }
  if (placeHoldersLen === 2) {
    const r0 = revLookup2[str.charCodeAt(i)];
    const r1 = revLookup2[str.charCodeAt(i + 1)];
    tmp = r0 << 2 | r1 >> 4;
    arr[curByte++] = tmp & 255;
  }
  if (placeHoldersLen === 1) {
    const r0 = revLookup2[str.charCodeAt(i)];
    const r1 = revLookup2[str.charCodeAt(i + 1)];
    const r2 = revLookup2[str.charCodeAt(i + 2)];
    tmp = r0 << 10 | r1 << 4 | r2 >> 2;
    arr[curByte++] = tmp >> 8 & 255;
    arr[curByte++] = tmp & 255;
  }
  return arr;
}
function tripletToBase642(lookup, num) {
  return lookup[num >> 18 & 63] + lookup[num >> 12 & 63] + lookup[num >> 6 & 63] + lookup[num & 63];
}
function encodeChunk2(lookup, view, start, end) {
  let tmp;
  const output = new Array((end - start) / 3);
  for (let i = start, j = 0; i < end; i += 3, j++) {
    tmp = (view.getUint8(i) << 16 & 16711680) + (view.getUint8(i + 1) << 8 & 65280) + (view.getUint8(i + 2) & 255);
    output[j] = tripletToBase642(lookup, tmp);
  }
  return output.join("");
}
var bs2dv2 = (bs) => bs instanceof ArrayBuffer ? new DataView(bs) : new DataView(bs.buffer, bs.byteOffset, bs.byteLength);
function compareBuffers(a, b) {
  if (typeof a != typeof b)
    return false;
  if (a == null || b == null)
    return false;
  const av = bs2dv2(a);
  const bv = bs2dv2(b);
  if (av.byteLength !== bv.byteLength)
    return false;
  for (let i = 0; i < av.byteLength; i++)
    if (av.getUint8(i) !== bv.getUint8(i))
      return false;
  return true;
}
function arrayBufferToBase642(buffer, variant = "url") {
  if (buffer == null) {
    _sb_exception("L509", "arrayBufferToBase64() -> null paramater");
    return "";
  } else {
    const view = bs2dv2(buffer);
    const len = view.byteLength;
    const extraBytes = len % 3;
    const len2 = len - extraBytes;
    const parts = new Array(
      Math.floor(len2 / MAX_CHUNK_LENGTH2) + Math.sign(extraBytes)
    );
    const lookup = variant == "url" ? urlLookup2 : b64lookup2;
    const pad = "";
    let j = 0;
    for (let i = 0; i < len2; i += MAX_CHUNK_LENGTH2) {
      parts[j++] = encodeChunk2(
        lookup,
        view,
        i,
        i + MAX_CHUNK_LENGTH2 > len2 ? len2 : i + MAX_CHUNK_LENGTH2
      );
    }
    if (extraBytes === 1) {
      const tmp = view.getUint8(len - 1);
      parts[j] = lookup[tmp >> 2] + lookup[tmp << 4 & 63] + pad + pad;
    } else if (extraBytes === 2) {
      const tmp = (view.getUint8(len - 2) << 8) + view.getUint8(len - 1);
      parts[j] = lookup[tmp >> 10] + lookup[tmp >> 4 & 63] + lookup[tmp << 2 & 63] + pad;
    }
    return parts.join("");
  }
}
var base62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
var base62Regex = /^(a32\.)?[0-9A-Za-z]{43}$/;
function base62ToArrayBuffer32(s) {
  if (!base62Regex.test(s))
    throw new Error(`base62ToArrayBuffer32: string must match: ${base62Regex}, value provided was ${s}`);
  if (s.startsWith("a32."))
    s = s.slice(4);
  let n = BigInt(0);
  for (let i = 0; i < s.length; i++)
    n = n * 62n + BigInt(base62.indexOf(s[i]));
  if (n > 2n ** 256n - 1n)
    throw new Error(`base62ToArrayBuffer32: value exceeds 256 bits.`);
  const buffer = new ArrayBuffer(32);
  const view = new DataView(buffer);
  for (let i = 0; i < 8; i++, n = n >> 32n)
    view.setUint32((8 - i - 1) * 4, Number(BigInt.asUintN(32, n)));
  return buffer;
}
function arrayBufferToBase62(buffer) {
  if (buffer.byteLength !== 32)
    throw new Error("arrayBufferToBase62: buffer must be exactly 32 bytes (256 bits).");
  let result = "";
  for (let n = BigInt("0x" + Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, "0")).join("")); n > 0n; n = n / 62n)
    result = base62[Number(n % 62n)] + result;
  return result.padStart(43, "0");
}
function arrayBuffer32ToBase62(buffer) {
  return "a32." + arrayBufferToBase62(buffer);
}
function base62ToBase64(s) {
  return arrayBufferToBase642(base62ToArrayBuffer32(s));
}
function base64ToBase62(s) {
  return arrayBufferToBase62(base64ToArrayBuffer2(s));
}
function isBase62Encoded(value) {
  return base62Regex.test(value);
}
function _appendBuffer(buffer1, buffer2) {
  const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
  tmp.set(new Uint8Array(buffer1), 0);
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
  return tmp.buffer;
}
function jsonParseWrapper(str, loc) {
  if (str == null)
    return null;
  try {
    return JSON.parse(str);
  } catch (error) {
    try {
      let s2 = "";
      let s3 = "";
      let str2 = str;
      while (str2 != (s3 = s2, s2 = str2, str2 = str2?.match(/^(['"])(.*)\1$/m)?.[2]))
        return JSON.parse(`'${s3}'`);
    } catch {
      try {
        return JSON.parse(str.slice(1, -1));
      } catch {
        throw new Error(`JSON.parse() error at ${loc} (tried eval and slice)
String was: ${str}`);
      }
    }
  }
}
function extractPayloadV1(payload) {
  try {
    const metadataSize = new Uint32Array(payload.slice(0, 4))[0];
    const decoder = new TextDecoder();
    const metadata = jsonParseWrapper(decoder.decode(payload.slice(4, 4 + metadataSize)), "L476");
    let startIndex = 4 + metadataSize;
    const data = {};
    for (const key in metadata) {
      if (data.key) {
        data[key] = payload.slice(startIndex, startIndex + metadata[key]);
        startIndex += metadata[key];
      }
    }
    return data;
  } catch (e) {
    console.error(e);
    return {};
  }
}
function assemblePayload(data) {
  try {
    const metadata = {};
    metadata["version"] = "002";
    let keyCount = 0;
    let startIndex = 0;
    for (const key in data) {
      keyCount++;
      metadata[keyCount.toString()] = { name: key, start: startIndex, size: data[key].byteLength };
      startIndex += data[key].byteLength;
    }
    const encoder = new TextEncoder();
    const metadataBuffer = encoder.encode(JSON.stringify(metadata));
    const metadataSize = new Uint32Array([metadataBuffer.byteLength]);
    let payload = _appendBuffer(new Uint8Array(metadataSize.buffer), new Uint8Array(metadataBuffer));
    for (const key in data)
      payload = _appendBuffer(new Uint8Array(payload), data[key]);
    return payload;
  } catch (e) {
    console.error(e);
    return null;
  }
}
function extractPayload(payload) {
  try {
    const metadataSize = new Uint32Array(payload.slice(0, 4))[0];
    const decoder = new TextDecoder();
    const _metadata = jsonParseWrapper(decoder.decode(payload.slice(4, 4 + metadataSize)), "L533");
    const startIndex = 4 + metadataSize;
    if (!_metadata.version)
      _metadata["version"] = "001";
    switch (_metadata["version"]) {
      case "001": {
        return extractPayloadV1(payload);
      }
      case "002": {
        const data = [];
        for (let i = 1; i < Object.keys(_metadata).length; i++) {
          const _index = i.toString();
          if (_metadata[_index]) {
            const propertyStartIndex = _metadata[_index]["start"];
            const size = _metadata[_index]["size"];
            const entry = _metadata[_index];
            data[entry["name"]] = payload.slice(startIndex + propertyStartIndex, startIndex + propertyStartIndex + size);
          } else {
            console.log(`found nothing for index ${i}`);
          }
        }
        return data;
      }
      default: {
        throw new Error("Unsupported payload version (" + _metadata["version"] + ") - fatal");
      }
    }
  } catch (e) {
    throw new Error("extractPayload() exception (" + e + ")");
  }
}
function decodeB64Url(input) {
  input = input.replaceAll("-", "+").replaceAll("_", "/");
  const pad = input.length % 4;
  if (pad) {
    if (pad === 1) {
      throw new Error("InvalidLengthError: Input base64url string is the wrong length to determine padding");
    }
    input += new Array(5 - pad).join("=");
  }
  return input;
}
var KeyPrefix = /* @__PURE__ */ ((KeyPrefix2) => {
  KeyPrefix2["SBAES256Key"] = "T881";
  KeyPrefix2["SBPrivateKey"] = "Aj3p";
  KeyPrefix2["SBPublicKey"] = "pNkk";
  return KeyPrefix2;
})(KeyPrefix || {});
function isSBKey(key) {
  return key && Object.values(KeyPrefix).includes(key.prefix);
}
var SBCrypto = class {
  /************************************************************************************/
  #knownKeys = /* @__PURE__ */ new Map();
  /**
   * Converts a SBKey to a JsonWebKey, if the input is already a JsonWebKey
   * then it's returned as is.
   * 
   */
  SBKeyToJWK(key) {
    if (!isSBKey(key))
      return key;
    switch (key.prefix) {
      case "pNkk": {
        return {
          crv: "P-384",
          ext: true,
          key_ops: [],
          kty: "EC",
          x: key.x,
          y: key.y
        };
      }
      case "Aj3p": {
        return {
          crv: "P-384",
          d: key.d,
          ext: true,
          key_ops: ["deriveKey"],
          kty: "EC",
          x: key.x,
          y: key.y
        };
      }
      case "T881": {
        return {
          k: key.k,
          alg: "A256GCM",
          key_ops: ["encrypt", "decrypt"],
          kty: "oct"
        };
      }
      default: {
        throw new Error(`SBKeyToJWK() - unknown key prefix: ${key.prefix}`);
      }
    }
  }
  /**
   * Converts a JsonWebKey to a SBKey, if the input is already a SBKey
   * then it's returned as is. If the input is not well-formed, then
   * we return undefined. 
   */
  JWKToSBKey(key) {
    if (!key)
      return void 0;
    if (key.kty === "oct" && key.alg === "A256GCM" && key.k && key.k.length === 43) {
      return {
        prefix: "T881" /* SBAES256Key */,
        k: base64ToBase62(key.k)
      };
    }
    if (key.kty === "EC" && key.crv === "P-384" && key.x && key.y) {
      if (key.x.length !== 64 || key.y.length !== 64)
        return void 0;
      if (key.d && key.d.length === 64) {
        return {
          prefix: "Aj3p" /* SBPrivateKey */,
          x: key.x,
          y: key.y,
          d: key.d
        };
      }
      return {
        prefix: "pNkk" /* SBPublicKey */,
        x: key.x,
        y: key.y
      };
    }
    return void 0;
  }
  /**
   * Here we convert SBKey to a serialized string, it's a single
   * string that begins with the four-character identifying prefix,
   * and then just a string. The way that string is encoded is as
   * follows:
   * 
   * - AES256 key: it is 43x base64, so 256 bits, so can be base62 encoded straight up
   * 
   * - private key: this is x, y, and d, each are 384 bits, so that's a total 
   *   of 768 bis, which can be encoded as three strings of 43 base62 characters.
   *   BUT we need to convert all of them to BINARY, and then concatenate them
   *   as binary, then split that to three equal-length buffers (32 bytes) and
   *   then convert each to base62.
   * 
   * - public key: this is x and y, each are 384 bits, and we need to figure out a 
   *   way to encode as a32 (base62) - remember we can only encode a32 in chunks of 256 bits.
   *   perhaps we do as above but append 128 "zero" bits to it, for a total of 1280
   *   bits, which we can split into four chunks of 256 bits, and do as above.
   *   
   *
   */
  SBKeyToString(key) {
    const prefix = key.prefix;
    switch (prefix) {
      case "T881" /* SBAES256Key */: {
        const buffer = base64ToArrayBuffer2(key.k);
        return prefix + arrayBufferToBase62(buffer).slice(4);
      }
      case "pNkk" /* SBPublicKey */: {
        const publicKey = key;
        const combined = new Uint8Array(48 * 2);
        combined.set(base64ToArrayBuffer2(publicKey.x), 0);
        combined.set(base64ToArrayBuffer2(publicKey.y), 48);
        return prefix + arrayBufferToBase62(combined.slice(0, 32).buffer).slice(4) + arrayBufferToBase62(combined.slice(32, 64).buffer).slice(4) + arrayBufferToBase62(combined.slice(64, 96).buffer).slice(4);
      }
      case "Aj3p" /* SBPrivateKey */: {
        const privateKey = key;
        const combined = new Uint8Array(3 * 48 + 16);
        combined.set(base64ToArrayBuffer2(privateKey.x).slice(4), 0);
        combined.set(base64ToArrayBuffer2(privateKey.y).slice(4), 48);
        combined.set(base64ToArrayBuffer2(privateKey.d).slice(4), 96);
        return prefix + arrayBufferToBase62(combined.slice(0, 32).buffer).slice(4) + arrayBufferToBase62(combined.slice(32, 64).buffer).slice(4) + arrayBufferToBase62(combined.slice(64, 96).buffer).slice(4) + arrayBufferToBase62(combined.slice(96, 128).buffer).slice(4) + arrayBufferToBase62(combined.slice(128, 160).buffer).slice(4);
      }
      default: {
        throw new Error("Unknown SBKey type.");
      }
    }
  }
  StringToSBKey(input) {
    try {
      if (input.length < 4)
        return void 0;
      const prefix = input.slice(0, 4);
      const data = input.slice(4);
      switch (prefix) {
        case "T881" /* SBAES256Key */: {
          if (data.length !== 43)
            return void 0;
          const k = base62ToArrayBuffer32("a32." + data);
          return {
            prefix: "T881" /* SBAES256Key */,
            k: arrayBufferToBase642(k)
          };
        }
        case "pNkk" /* SBPublicKey */: {
          if (data.length !== 86)
            return void 0;
          const p1 = new Uint8Array(base62ToArrayBuffer32("a32." + data.slice(0, 43)));
          const p2 = new Uint8Array(base62ToArrayBuffer32("a32." + data.slice(43, 86)));
          const p3 = new Uint8Array(base62ToArrayBuffer32("a32." + data.slice(86)));
          const combined = new Uint8Array(48 * 2);
          combined.set(p1, 0);
          combined.set(p2, 32);
          combined.set(p3, 64);
          return {
            prefix: "pNkk" /* SBPublicKey */,
            x: arrayBufferToBase642(combined.slice(0, 48).buffer),
            y: arrayBufferToBase642(combined.slice(48, 96).buffer)
          };
        }
        case "Aj3p" /* SBPrivateKey */: {
          if (data.length !== 215)
            return void 0;
          const p1 = new Uint8Array(base62ToArrayBuffer32("a32." + data.slice(0, 43)));
          const p2 = new Uint8Array(base62ToArrayBuffer32("a32." + data.slice(43, 86)));
          const p3 = new Uint8Array(base62ToArrayBuffer32("a32." + data.slice(86, 129)));
          const p4 = new Uint8Array(base62ToArrayBuffer32("a32." + data.slice(129, 172)));
          const p5 = new Uint8Array(base62ToArrayBuffer32("a32." + data.slice(172, 215)));
          const combined = new Uint8Array(3 * 48 + 16);
          combined.set(p1, 0);
          combined.set(p2, 32);
          combined.set(p3, 64);
          combined.set(p4, 96);
          combined.set(p5, 128);
          return {
            prefix: "Aj3p" /* SBPrivateKey */,
            x: arrayBufferToBase642(combined.slice(0, 48).buffer),
            y: arrayBufferToBase642(combined.slice(48, 96).buffer),
            d: arrayBufferToBase642(combined.slice(96, 144).buffer)
          };
        }
        default: {
          return void 0;
        }
      }
    } catch (e) {
      console.error("StringToSBKey() - malformed input, exception: ", e);
      return void 0;
    }
  }
  /**
   * SBCrypto.addKnownKey()
   * 
   * Adds any key to the list of known keys; if it's known
   * but only as a public key, then it will be 'upgraded'.
   */
  async addKnownKey(key) {
    if (!key)
      return;
    if (isSBKey(key))
      key = await this.SBKeyToJWK(key);
    if (typeof key === "string") {
      const hash = await sbCrypto.sb384Hash(key);
      if (!hash)
        return;
      if (this.#knownKeys.has(hash)) {
        if (DBG)
          console.log(`addKnownKey() - key already known: ${hash}, skipping upgrade check`);
      } else {
        const newInfo = {
          hash,
          // also the map hash
          pubKeyJson: key,
          key: await sbCrypto.importKey("jwk", key, "ECDH", true, ["deriveKey"])
        };
        this.#knownKeys.set(hash, newInfo);
      }
    } else if (key instanceof SB384) {
      await key.ready;
      const hash = key.hash;
      const newInfo = {
        hash,
        // also the map hash
        pubKeyJson: key.exportable_pubKey,
        key: key.privateKey
        // exists iff it's a private key
      };
      this.#knownKeys.set(hash, newInfo);
    } else if (key instanceof CryptoKey) {
      const hash = await this.sb384Hash(key);
      if (!hash)
        return;
      if (!this.#knownKeys.has(hash)) {
        const newInfo = {
          hash,
          // also the map hash
          pubKeyJson: await sbCrypto.exportKey("jwk", key),
          key
          // todo: could be public
        };
        this.#knownKeys.set(hash, newInfo);
      }
    } else {
      throw new Error("addKnownKey() - invalid key type (must be string or SB384-derived)");
    }
  }
  /**
   * SBCrypto.lookupKeyGlobal()
   * 
   * Given any sort of SB384Hash, returns the corresponding known key, if any
   */
  lookupKeyGlobal(hash) {
    return this.#knownKeys.get(hash);
  }
  /**
   * Hashes and splits into two (h1 and h1) signature of data, h1
   * is used to request (salt, iv) pair and then h2 is used for
   * encryption (h2, salt, iv).
   * 
   * Transitioning to internal binary format
   *
   * @param buf blob of data to be stored
   *
   */
  generateIdKey(buf) {
    return new Promise((resolve, reject) => {
      try {
        crypto.subtle.digest("SHA-512", buf).then((digest) => {
          const _id = digest.slice(0, 32);
          const _key = digest.slice(32);
          resolve({
            id_binary: _id,
            key_material: _key
          });
        });
      } catch (e) {
        reject(e);
      }
    });
  }
  /**
   * Extracts (generates) public key from a private key.
   */
  extractPubKey(privateKey) {
    try {
      const pubKey = { ...privateKey };
      delete pubKey.d;
      delete pubKey.dp;
      delete pubKey.dq;
      delete pubKey.q;
      delete pubKey.qi;
      pubKey.key_ops = [];
      return pubKey;
    } catch (e) {
      console.error(e);
      return null;
    }
  }
  /** @private */
  async #generateHash(rawBytes) {
    try {
      const MAX_REHASH_ITERATIONS = 160;
      const b62regex = /^[0-9A-Za-z]+$/;
      let count = 0;
      let hash = arrayBufferToBase642(rawBytes);
      while (!b62regex.test(hash)) {
        if (count++ > MAX_REHASH_ITERATIONS)
          throw new Error(`generateChannelHash() - exceeded ${MAX_REHASH_ITERATIONS} iterations:`);
        rawBytes = await crypto.subtle.digest("SHA-384", rawBytes);
        hash = arrayBufferToBase642(rawBytes);
      }
      return arrayBufferToBase642(rawBytes);
    } catch (e) {
      console.error("sb384Hash() failed", e);
      console.error("tried working from channelBytes:");
      console.error(rawBytes);
      throw new Error(`sb384Hash() exception (${e})`);
    }
  }
  // nota bene this does, and should, permanently be backwards compatible.
  /** @private */
  async #testHash(channelBytes, channel_id) {
    const MAX_REHASH_ITERATIONS = 160;
    let count = 0;
    let hash = arrayBufferToBase642(channelBytes);
    while (hash !== channel_id) {
      if (count++ > MAX_REHASH_ITERATIONS)
        return false;
      channelBytes = await crypto.subtle.digest("SHA-384", channelBytes);
      hash = arrayBufferToBase642(channelBytes);
    }
    return true;
  }
  /**
   * SBCrypto.sb384Hash()
   * 
   * Takes a JsonWebKey and returns a SB384Hash. If there's a problem, returns undefined.
   * 
   */
  async sb384Hash(key) {
    if (key instanceof CryptoKey)
      key = await this.exportKey("jwk", key).catch(() => {
        return void 0;
      });
    if (!key)
      return void 0;
    if (key && key.x && key.y) {
      const xBytes = base64ToArrayBuffer2(decodeB64Url(key.x));
      const yBytes = base64ToArrayBuffer2(decodeB64Url(key.y));
      const channelBytes = _appendBuffer(xBytes, yBytes);
      return await this.#generateHash(channelBytes);
    } else {
      throw new Error("sb384Hash() - invalid JsonWebKey (missing x and/or y)");
    }
  }
  /**
   * SBCrypto.compareHashWithKey()
   * 
   * Checks if an existing SB384Hash is 'compatible' with a given key.
   * 
   * Note that you CAN NOT have a hash, and a key, generate a hash
   * from that key, and then compare the two. The hash generation per
   * se will be deterministic and specific AT ANY POINT IN TIME,
   * but may change over time, and this comparison function will 
   * maintain ability to compare over versions.
   * 
   * For example, this comparison will accept a simple straight
   * b64-encoded hash without iteration or other processing.
   * 
   */
  async compareHashWithKey(hash, key) {
    if (!hash || !key)
      return false;
    let x = key.x;
    let y = key.y;
    if (!(x && y)) {
      try {
        const tryParse = JSON.parse(key);
        if (tryParse.x)
          x = tryParse.x;
        if (tryParse.y)
          y = tryParse.y;
      } catch {
        return false;
      }
    }
    const xBytes = base64ToArrayBuffer2(decodeB64Url(x));
    const yBytes = base64ToArrayBuffer2(decodeB64Url(y));
    const channelBytes = _appendBuffer(xBytes, yBytes);
    return await this.#testHash(channelBytes, hash);
  }
  /**
   * 'Compare' two channel IDs. Note that this is not constant time.
   */
  async verifyChannelId(owner_key, channel_id) {
    return await this.compareHashWithKey(channel_id, owner_key);
  }
  /**
   * SBCrypto.generatekeys()
   *
   * Generates standard ``ECDH`` keys using ``P-384``.
   */
  async generateKeys() {
    try {
      return await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-384" }, true, ["deriveKey"]);
    } catch (e) {
      throw new Error("generateKeys() exception (" + e + ")");
    }
  }
  /**
   * SBCrypto.importKey()
   *
   * Import keys
   */
  async importKey(format, key, type, extractable, keyUsages) {
    try {
      let importedKey;
      const keyAlgorithms = {
        ECDH: { name: "ECDH", namedCurve: "P-384" },
        AES: { name: "AES-GCM" },
        PBKDF2: "PBKDF2"
      };
      if (format === "jwk") {
        const jsonKey = key;
        if (jsonKey.kty === void 0)
          throw new Error("importKey() - invalid JsonWebKey");
        if (jsonKey.alg === "ECDH")
          jsonKey.alg = void 0;
        importedKey = await crypto.subtle.importKey("jwk", jsonKey, keyAlgorithms[type], extractable, keyUsages);
      } else {
        importedKey = await crypto.subtle.importKey(format, key, keyAlgorithms[type], extractable, keyUsages);
      }
      this.addKnownKey(importedKey);
      return importedKey;
    } catch (e) {
      console.error(`... importKey() error: ${e}:`);
      console.log(format);
      console.log(key);
      console.log(type);
      console.log(extractable);
      console.log(keyUsages);
      throw new Error("importKey() exception (" + e + ")");
    }
  }
  /**
   * SBCrypto.exportKey()
   * 
   * Export key; note that if there's an issue, this will return undefined.
   * That can happen normally if for example the key is restricted (and
   * not extractable).
   */
  async exportKey(format, key) {
    return await crypto.subtle.exportKey(format, key).catch(() => {
      if (DBG)
        console.warn(`... exportKey() protested, this just means we treat this as undefined`);
      return void 0;
    });
  }
  /**
   * SBCrypto.deriveKey()
   *
   * Derive key. Takes a private and public key, and returns a Promise to a cryptoKey for 1:1 communication.
   */
  deriveKey(privateKey, publicKey, type, extractable, keyUsages) {
    return new Promise(async (resolve, reject) => {
      const keyAlgorithms = {
        AES: {
          name: "AES-GCM",
          length: 256
        },
        HMAC: {
          name: "HMAC",
          hash: "SHA-256",
          length: 256
        }
      };
      try {
        resolve(await crypto.subtle.deriveKey(
          {
            name: "ECDH",
            public: publicKey
          },
          privateKey,
          keyAlgorithms[type],
          extractable,
          keyUsages
        ));
      } catch (e) {
        console.error(e, privateKey, publicKey, type, extractable, keyUsages);
        reject(e);
      }
    });
  }
  encrypt(data, key, _iv, returnType = "encryptedContents") {
    return new Promise(async (resolve, reject) => {
      try {
        if (data === null)
          reject(new Error("no contents"));
        const iv = !_iv || _iv === null ? crypto.getRandomValues(new Uint8Array(12)) : _iv;
        if (typeof data === "string")
          data = new TextEncoder().encode(data);
        const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
        if (returnType === "encryptedContents") {
          resolve({
            content: ensureSafe(arrayBufferToBase642(encrypted)),
            iv: ensureSafe(arrayBufferToBase642(iv))
          });
        } else {
          resolve(encrypted);
        }
      } catch (e) {
        reject(e);
      }
    });
  }
  wrap(k, b, bodyType) {
    return new Promise((resolve) => {
      let a;
      if (bodyType === "string") {
        a = sbCrypto.str2ab(b);
      } else {
        a = b;
      }
      sbCrypto.encrypt(a, k).then((c) => {
        resolve(c);
      });
    });
  }
  unwrap(k, o, returnType) {
    return new Promise(async (resolve, reject) => {
      try {
        const { content: t, iv } = encryptedContentsMakeBinary(o);
        const d = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, k, t);
        if (returnType === "string")
          resolve(new TextDecoder().decode(d));
        else if (returnType === "arrayBuffer")
          resolve(d);
      } catch (e) {
        console.error(`unwrap(): unknown issue - rejecting: ${e}`);
        console.trace();
        reject(e);
      }
    });
  }
  /**
   * SBCrypto.sign()
   *
   * Sign
   */
  sign(secretKey, contents) {
    return new Promise(async (resolve, reject) => {
      try {
        const encoder = new TextEncoder();
        const encoded = encoder.encode(contents);
        let sign;
        try {
          sign = await crypto.subtle.sign("HMAC", secretKey, encoded);
          resolve(ensureSafe(arrayBufferToBase642(sign)));
        } catch (error) {
          reject(error);
        }
      } catch (error) {
        reject(error);
      }
    });
  }
  /**
   * SBCrypto.verify()
   *
   * Verify signature.
   */
  verify(verifyKey, sign, contents) {
    return new Promise((resolve, reject) => {
      try {
        crypto.subtle.verify(
          "HMAC",
          verifyKey,
          base64ToArrayBuffer2(sign),
          sbCrypto.str2ab(contents)
        ).then((verified) => {
          resolve(verified);
        });
      } catch (e) {
        reject(WrapError(e));
      }
    });
  }
  /**
   * Standardized 'str2ab()' function, string to array buffer.
   * This assumes on byte per character.
   *
   * @param {string} string
   * @return {Uint8Array} buffer
   */
  str2ab(string) {
    return new TextEncoder().encode(string);
  }
  /**
   * Standardized 'ab2str()' function, array buffer to string.
   * This assumes one byte per character.
   *
   * @param {Uint8Array} buffer
   * @return {string} string
   */
  ab2str(buffer) {
    return new TextDecoder("utf-8").decode(buffer);
  }
  /**
   * SBCrypto.compareKeys()
   *
   * Compare JSON keys, true if the 'same', false if different. We consider
   * them "equal" if both have 'x' and 'y' properties and they are the same.
   * (Which means it doesn't care about which or either being public or private)
   */
  compareKeys(key1, key2) {
    if (key1 != null && key2 != null && typeof key1 === "object" && typeof key2 === "object")
      return key1["x"] === key2["x"] && key1["y"] === key2["y"];
    return false;
  }
  /**
   * SBCrypto.lookupKey()
   *
   * Uses compareKeys() to check for presense of a key in a list of keys.
   * Returns index of key if found, -1 if not found.
   * 
   */
  lookupKey(key, array) {
    for (let i = 0; i < array.length; i++)
      if (sbCrypto.compareKeys(key, array[i]))
        return i;
    return -1;
  }
  async channelKeyStringsToCryptoKeys(keyStrings) {
    return new Promise(async (resolve, reject) => {
      let ownerKeyParsed = jsonParseWrapper(keyStrings.ownerKey, "L1513");
      Promise.all([
        sbCrypto.importKey("jwk", ownerKeyParsed, "ECDH", false, []),
        sbCrypto.importKey("jwk", jsonParseWrapper(keyStrings.encryptionKey, "L2250"), "AES", false, ["encrypt", "decrypt"]),
        sbCrypto.importKey("jwk", jsonParseWrapper(keyStrings.signKey, "L2251"), "ECDH", true, ["deriveKey"]),
        sbCrypto.importKey("jwk", sbCrypto.extractPubKey(jsonParseWrapper(keyStrings.signKey, "L2252")), "ECDH", true, [])
        // this.identity!.privateKey // we know we have id by now
      ]).then(async (v) => {
        if (DBG)
          console.log("++++++++ readyPromise() processed first batch of keys");
        const ownerKey = v[0];
        const encryptionKey = v[1];
        const signKey = v[2];
        const publicSignKey = v[3];
        resolve({
          ownerKey,
          ownerPubKeyX: ownerKeyParsed.x,
          encryptionKey,
          signKey,
          // channelSignKey: channelSignKey,
          publicSignKey
        });
      }).catch((e) => {
        console.error(`readyPromise(): failed to import keys: ${e}`);
        reject(e);
      });
    });
  }
};
function Memoize(target, propertyKey, descriptor) {
  if (descriptor && descriptor.get) {
    let get = descriptor.get;
    descriptor.get = function() {
      const prop = `__${target.constructor.name}__${propertyKey}__`;
      if (this.hasOwnProperty(prop)) {
        const returnValue = this[prop];
        return returnValue;
      } else {
        const returnValue = get.call(this);
        Object.defineProperty(this, prop, { configurable: false, enumerable: false, writable: false, value: returnValue });
        return returnValue;
      }
    };
  }
}
function Ready(target, propertyKey, descriptor) {
  if (descriptor && descriptor.get) {
    let get = descriptor.get;
    descriptor.get = function() {
      const obj = target.constructor.name;
      const prop = `${obj}ReadyFlag`;
      if (prop in this) {
        const rf = "readyFlag";
        _sb_assert(this[rf], `${propertyKey} getter accessed but object ${obj} not ready (fatal)`);
      }
      const retValue = get.call(this);
      _sb_assert(retValue != null, `${propertyKey} getter accessed in object type ${obj} but returns NULL (fatal)`);
      return retValue;
    };
  }
}
var SB_CLASS_ARRAY = ["SBMessage", "SBObjectHandle"];
var SB_MESSAGE_SYMBOL = Symbol.for("SBMessage");
var SB_OBJECT_HANDLE_SYMBOL = Symbol.for("SBObjectHandle");
function isSBClass(s) {
  return typeof s === "string" && SB_CLASS_ARRAY.includes(s);
}
function SBValidateObject(obj, type) {
  switch (type) {
    case "SBMessage":
      return SB_MESSAGE_SYMBOL in obj;
    case "SBObjectHandle":
      return SB_OBJECT_HANDLE_SYMBOL in obj;
  }
}
function VerifyParameters(_target, _propertyKey, descriptor) {
  if (descriptor && descriptor.value) {
    const operation = descriptor.value;
    descriptor.value = function(...args) {
      for (let x of args) {
        const m = x.constructor.name;
        if (isSBClass(m))
          _sb_assert(SBValidateObject(x, m), `invalid parameter: ${x} (expecting ${m})`);
      }
      return operation.call(this, ...args);
    };
  }
}
function ExceptionReject(target, _propertyKey, descriptor) {
  if (descriptor && descriptor.value) {
    const operation = descriptor.value;
    descriptor.value = function(...args) {
      try {
        return operation.call(this, ...args);
      } catch (e) {
        console.log(`ExceptionReject: ${WrapError(e)}`);
        console.log(target);
        console.log(_propertyKey);
        console.log(descriptor);
        return new Promise((_resolve, reject) => reject(`Reject: ${WrapError(e)}`));
      }
    };
  }
}
var sbCrypto = new SBCrypto();
var SBKnownServers = [
  {
    // local servers
    channel_server: "http://localhost:3845",
    channel_ws: "ws://localhost:3845",
    storage_server: "http://localhost:3843",
    shard_server: "http://localhost:3841"
  },
  {
    // Preview / Development Servers
    channel_server: "https://channel.384.dev",
    channel_ws: "wss://channel.384.dev",
    storage_server: "https://storage.384.dev",
    shard_server: "https://shard.3.8.4.land"
  },
  {
    // This is both "384.chat" (production) and "sn.ac"
    channel_server: "https://r.384co.workers.dev",
    channel_ws: "wss://r.384co.workers.dev",
    storage_server: "https://s.384co.workers.dev"
  }
];
var knownStorageAndShardServers = [
  "http://localhost:3841",
  "http://localhost:3843",
  "https://shard.3.8.4.land",
  "https://storage.384.dev",
  "https://storage.384co.workers.dev",
  "https://shard.384.dev"
];
var SB384 = class {
  ready;
  sb384Ready;
  #SB384ReadyFlag = false;
  // must be named <class>ReadyFlag
  #exportable_pubKey;
  #exportable_privateKey;
  #privateKey;
  #hash;
  // generic 'identifier' in the SB universe
  /**
   * Basic (core) capability object in SB.
   *
   * Note that all the getters below will throw an exception if the
   * corresponding information is not ready.
   *
   * Like most SB classes, SB384 follows the "ready template" design
   * pattern: the object is immediately available upon creation,
   * but isn't "ready" until it says it's ready. See `Channel Class`_
   * example below. Also see Design Note [4]_.
   * 
   * { @link https://snackabra.io/jslib.html#dn-004-the-ready-pattern }
   *
   * @param key a jwk with which to create identity; if not provided,
   * it will 'mint' (generate) them randomly, in other words it will
   * default to creating a new identity ("384").
   *
   */
  constructor(key = null) {
    this.ready = new Promise(async (resolve, reject) => {
      try {
        if (key) {
          if (!key.d) {
            const msg = "ERROR creating SB384 object: invalid key (must be a PRIVATE key)";
            console.error(msg);
            reject(msg);
          }
          this.#exportable_privateKey = key;
          const pk = sbCrypto.extractPubKey(key);
          _sb_assert(pk, "unable to extract public key");
          this.#exportable_pubKey = pk;
          this.#privateKey = await sbCrypto.importKey("jwk", key, "ECDH", true, ["deriveKey"]);
        } else {
          const keyPair = await sbCrypto.generateKeys();
          this.#privateKey = keyPair.privateKey;
          this.#exportable_pubKey = await sbCrypto.exportKey("jwk", keyPair.publicKey);
          this.#exportable_privateKey = await sbCrypto.exportKey("jwk", keyPair.privateKey);
        }
        this.#hash = await sbCrypto.sb384Hash(this.#exportable_pubKey);
        sbCrypto.addKnownKey(this);
        this.#SB384ReadyFlag = true;
        resolve(this);
      } catch (e) {
        reject("ERROR creating SB384 object failed: " + WrapError(e));
      }
    });
    this.sb384Ready = this.ready;
  }
  get readyFlag() {
    return this.#SB384ReadyFlag;
  }
  get exportable_pubKey() {
    return this.#exportable_pubKey;
  }
  get exportable_privateKey() {
    return this.#exportable_privateKey;
  }
  get privateKey() {
    return this.#privateKey;
  }
  get ownerChannelId() {
    return this.hash;
  }
  get hash() {
    return this.#hash;
  }
  get _id() {
    return JSON.stringify(this.exportable_pubKey);
  }
};
__decorateClass([
  Memoize
], SB384.prototype, "readyFlag", 1);
__decorateClass([
  Memoize,
  Ready
], SB384.prototype, "exportable_pubKey", 1);
__decorateClass([
  Memoize,
  Ready
], SB384.prototype, "exportable_privateKey", 1);
__decorateClass([
  Memoize,
  Ready
], SB384.prototype, "privateKey", 1);
__decorateClass([
  Memoize,
  Ready
], SB384.prototype, "ownerChannelId", 1);
__decorateClass([
  Memoize,
  Ready
], SB384.prototype, "hash", 1);
__decorateClass([
  Memoize,
  Ready
], SB384.prototype, "_id", 1);
var SBMessage = class {
  ready;
  channel;
  contents;
  #encryptionKey;
  #sendToPubKey;
  [SB_MESSAGE_SYMBOL] = true;
  MAX_SB_BODY_SIZE = 64 * 1024 * 1.5;
  // allow for base64 overhead plus extra
  /* SBMessage */
  constructor(channel2, bodyParameter = "", sendToJsonWebKey) {
    if (typeof bodyParameter === "string") {
      this.contents = { encrypted: false, isVerfied: false, contents: bodyParameter, sign: "", image: "", imageMetaData: {} };
    } else {
      this.contents = { encrypted: false, isVerfied: false, contents: "", sign: "", image: bodyParameter.image, imageMetaData: bodyParameter.imageMetaData };
    }
    let body = this.contents;
    let bodyJson = JSON.stringify(body);
    if (sendToJsonWebKey)
      this.#sendToPubKey = sbCrypto.extractPubKey(sendToJsonWebKey);
    _sb_assert(
      bodyJson.length < this.MAX_SB_BODY_SIZE,
      `SBMessage(): body must be smaller than ${this.MAX_SB_BODY_SIZE / 1024} KiB (we got ${bodyJson.length / 1024})})`
    );
    this.channel = channel2;
    this.ready = new Promise((resolve) => {
      channel2.channelReady.then(async () => {
        this.contents.sender_pubKey = this.channel.exportable_pubKey;
        if (channel2.userName)
          this.contents.sender_username = channel2.userName;
        const signKey = this.channel.channelSignKey;
        const sign = sbCrypto.sign(signKey, body.contents);
        const image_sign = sbCrypto.sign(signKey, this.contents.image);
        const imageMetadata_sign = sbCrypto.sign(signKey, JSON.stringify(this.contents.imageMetaData));
        if (this.#sendToPubKey) {
          this.#encryptionKey = await sbCrypto.deriveKey(
            this.channel.privateKey,
            await sbCrypto.importKey("jwk", this.#sendToPubKey, "ECDH", true, []),
            "AES",
            false,
            ["encrypt", "decrypt"]
          );
        } else {
          this.#encryptionKey = this.channel.keys.encryptionKey;
        }
        Promise.all([sign, image_sign, imageMetadata_sign]).then((values) => {
          this.contents.sign = values[0];
          this.contents.image_sign = values[1];
          this.contents.imageMetadata_sign = values[2];
          this.contents.imgObjVersion = "2";
          resolve(this);
        });
      });
    });
  }
  get encryptionKey() {
    return this.#encryptionKey;
  }
  get sendToPubKey() {
    return this.#sendToPubKey;
  }
  /**
   * SBMessage.send()
   *
   * @param {SBMessage} message - the message object to send
   */
  send() {
    return new Promise((resolve, reject) => {
      this.ready.then(() => {
        this.channel.send(this).then((result) => {
          if (result === "success") {
            resolve(result);
          } else {
            reject(result);
          }
        });
      });
    });
  }
};
__decorateClass([
  Ready
], SBMessage.prototype, "encryptionKey", 1);
var Channel = class extends SB384 {
  /**
   * Channel Class
   * 
   * This is the main work horse for channels. However, it is ABSTRACT,
   * meaning you need a 'concrete' class to use it.
   * 
   * Currently you have two options:
   * 
   * You can create a ChannelEndpoint object. That can do everything against
   * a channel except send/receive messages synchronously.
   * 
   * The other option is ChannelSocket, which does everything ChannelEndpoint
   * does, but ALSO connects with a web socket.
   * 
   * So unless you're actually connecting with intent on interactive, fast
   * messaging, an endpoint is sufficient. In fact, UNLESS you are going to
   * do send/receive, you should use ChannelEndpoint, not ChannelSocket.
   * 
   * In our current thinking, 'Channel' captures pretty much everything, 
   * except how you want (instant) messaging to be hooked up. So for example, our
   * next class might be 'ChannelP2P', which would be setting up webrtc
   * data channel connections in a mesh.
   * 
   * Note that you don't need to worry about what API calls involve race
   * conditions and which don't, jslib will do that for you.
   * 
   * @param Snackabra - server to join
   * @param JsonWebKey - key to use to join (optional)
   * @param string - the <a href="../glossary.html#term-channel-name">Channel Name</a> to find on that server (optional)
   * 
   */
  // ready: Promise<Channel>
  channelReady;
  #ChannelReadyFlag = false;
  // must be named <class>ReadyFlag
  #sbServer;
  motd = "";
  locked = false;
  owner = false;
  admin = false;
  adminData;
  // TODO: make into getter
  verifiedGuest = false;
  userName = "";
  #channelKeys;
  #channelSignKey;
  #channelId;
  #cursor = "";
  // last (oldest) message key seen
  #channelApi = "";
  #channelServer = "";
  constructor(sbServer, key, channelId) {
    if (DBG2)
      console.log("CONSTRUCTOR new channel");
    _sb_assert(channelId, "Channel(): as of jslib 1.1.x the channelId must be provided");
    super(key);
    this.#sbServer = sbServer;
    this.#channelId = channelId;
    this.#channelApi = sbServer.channel_server + "/api/";
    this.#channelServer = sbServer.channel_server + "/api/room/";
    this.channelReady = new Promise(async (resolve, reject) => {
      await this.sb384Ready;
      if (!this.#channelId) {
        reject("Channel(): no channel ID provided");
      }
      SBFetch(
        this.#sbServer.channel_server + "/api/room/" + stripA32(this.#channelId) + "/getChannelKeys",
        {
          method: "GET",
          headers: { "Content-Type": "application/json" }
        }
      ).then((response) => {
        if (!response.ok)
          reject("ChannelEndpoint(): failed to get channel keys (network response not ok)");
        return response.json();
      }).then(async (data) => {
        if (data.error)
          reject("ChannelEndpoint(): failed to get channel keys (error in response)");
        await this.#loadKeys(data);
        this.#ChannelReadyFlag = true;
        resolve(this);
      }).catch((e) => {
        reject("ChannelApi Error [1]: " + WrapError(e));
      });
    });
  }
  /** @private */
  async #setKeys(k) {
    this.#channelKeys = k;
    if (DBG) {
      console.log("set channelkeys to 'k':");
      console.log(k);
    }
    _sb_assert(this.#channelKeys, "Channel.importKeys: no channel keys (?)");
    _sb_assert(this.#channelKeys.publicSignKey, "Channel.importKeys: no public sign key (?)");
    _sb_assert(this.privateKey, "Channel.importKeys: no private key (?)");
    this.#channelSignKey = await sbCrypto.deriveKey(
      this.privateKey,
      this.#channelKeys.publicSignKey,
      "HMAC",
      false,
      ["sign", "verify"]
    );
  }
  /** @private */
  async #loadKeys(keyStrings) {
    if (DBG) {
      console.log("loading keys:");
      console.log(keyStrings);
    }
    await this.#setKeys(await sbCrypto.channelKeyStringsToCryptoKeys(keyStrings));
  }
  get keys() {
    return this.#channelKeys;
  }
  get sbServer() {
    return this.#sbServer;
  }
  get readyFlag() {
    return this.#ChannelReadyFlag;
  }
  get api() {
    return this;
  }
  get channelId() {
    return this.#channelId;
  }
  get channelSignKey() {
    return this.#channelSignKey;
  }
  // @Memoize @Ready get capacity() { return this.#capacity }
  /**
   * Channel.getLastMessageTimes
   */
  getLastMessageTimes() {
    return new Promise((resolve, reject) => {
      SBFetch(this.#channelApi + "/getLastMessageTimes", {
        method: "POST",
        body: JSON.stringify([this.channelId])
      }).then((response) => {
        if (!response.ok) {
          reject(new Error("Network response was not OK"));
        }
        return response.json();
      }).then((message_times) => {
        resolve(message_times[this.channelId]);
      }).catch((e) => {
        reject(e);
      });
    });
  }
  /**
   * Channel.getOldMessages
   * 
   * Will return most recent messages from the channel.
   * 
   * @param currentMessagesLength - number to fetch (default 100)
   * @param paginate - if true, will paginate from last request (default false)
   *
   */
  getOldMessages(currentMessagesLength = 100, paginate = false) {
    return new Promise(async (resolve, reject) => {
      if (!this.channelId) {
        reject("Channel.getOldMessages: no channel ID (?)");
      }
      if (!this.#ChannelReadyFlag) {
        if (DBG)
          console.log("Channel.getOldMessages: channel not ready (we will wait)");
        await this.channelReady;
        if (!this.#channelKeys)
          reject("Channel.getOldMessages: no channel keys (?) despite waiting");
      }
      let cursorOption = "";
      if (paginate)
        cursorOption = "&cursor=" + this.#cursor;
      SBFetch(this.#channelServer + stripA32(this.channelId) + "/oldMessages?currentMessagesLength=" + currentMessagesLength + cursorOption, {
        method: "GET"
      }).then(async (response) => {
        if (!response.ok)
          reject(new Error("Network response was not OK"));
        return response.json();
      }).then((messages) => {
        if (DBG) {
          console.log("getOldMessages");
          console.log(messages);
        }
        Promise.all(Object.keys(messages).filter((v) => messages[v].hasOwnProperty("encrypted_contents")).map((v) => deCryptChannelMessage(v, messages[v].encrypted_contents, this.#channelKeys))).then((unfilteredDecryptedMessageArray) => unfilteredDecryptedMessageArray.filter((v) => Boolean(v))).then((decryptedMessageArray) => {
          let lastMessage = decryptedMessageArray[decryptedMessageArray.length - 1];
          if (lastMessage)
            this.#cursor = lastMessage._id || lastMessage.id || "";
          if (DBG2)
            console.log(decryptedMessageArray);
          resolve(decryptedMessageArray);
        });
      }).catch((e) => {
        reject(e);
      });
    });
  }
  async #callApi(path, body) {
    if (DBG)
      console.log("#callApi:", path);
    if (!this.#ChannelReadyFlag) {
      console.log("ChannelApi.#callApi: channel not ready (we will wait)");
      await this.channelReady;
    }
    const method = body ? "POST" : "GET";
    return new Promise(async (resolve, reject) => {
      if (!this.channelId)
        reject("ChannelApi.#callApi: no channel ID (?)");
      await this.ready;
      let authString = "";
      const token_data = (/* @__PURE__ */ new Date()).getTime().toString();
      authString = token_data + "." + await sbCrypto.sign(this.channelSignKey, token_data);
      let init = {
        method,
        headers: {
          "Content-Type": "application/json",
          "authorization": authString
        }
      };
      if (body)
        init.body = JSON.stringify(body);
      await this.ready;
      SBFetch(this.#channelServer + stripA32(this.channelId) + path, init).then(async (response) => {
        const retValue = await response.json();
        if (!response.ok || retValue.error) {
          let apiErrorMsg = "Network or Server error on Channel API call";
          if (response.status)
            apiErrorMsg += " [" + response.status + "]";
          if (retValue.error)
            apiErrorMsg += ": " + retValue.error;
          reject(new Error(apiErrorMsg));
        } else {
          resolve(retValue);
        }
      }).catch((e) => {
        reject("ChannelApi (SBFetch) Error [2]: " + WrapError(e));
      });
    });
  }
  updateCapacity(capacity) {
    return this.#callApi("/updateRoomCapacity?capacity=" + capacity);
  }
  getCapacity() {
    return this.#callApi("/getRoomCapacity");
  }
  getStorageLimit() {
    return this.#callApi("/getStorageLimit");
  }
  getMother() {
    return this.#callApi("/getMother");
  }
  getJoinRequests() {
    return this.#callApi("/getJoinRequests");
  }
  isLocked() {
    return new Promise((resolve) => this.#callApi("/roomLocked").then((d) => resolve(d.locked === true)));
  }
  setMOTD(motd) {
    return this.#callApi("/motd", { motd });
  }
  getAdminData() {
    return this.#callApi("/getAdminData");
  }
  downloadData() {
    return new Promise((resolve, reject) => {
      this.#callApi("/downloadData").then((data) => {
        console.log("From downloadData:");
        console.log(data);
        Promise.all(Object.keys(data).filter((v) => {
          const regex = new RegExp(this.channelId);
          if (v.match(regex)) {
            const message = jsonParseWrapper(data[v], "L3318");
            if (message.hasOwnProperty("encrypted_contents")) {
              if (DBG)
                console.log("Received message: ", message);
              return message;
            }
          }
        }).map((v) => {
          const message = jsonParseWrapper(data[v], "L3327");
          if (DBG2)
            console.log(v, message.encrypted_contents, this.keys);
          return deCryptChannelMessage(v, message.encrypted_contents, this.keys);
        })).then((unfilteredDecryptedMessageArray) => unfilteredDecryptedMessageArray.filter((v) => Boolean(v))).then((decryptedMessageArray) => {
          let storage = {};
          decryptedMessageArray.forEach((message) => {
            if (!message.control && message.imageMetaData.imageId) {
              const f_control_msg = decryptedMessageArray.find((ctrl_msg) => ctrl_msg.id && ctrl_msg.id == message.imageMetaData.imageId);
              const p_control_msg = decryptedMessageArray.find((ctrl_msg) => ctrl_msg.id && ctrl_msg.id == message.imageMetaData.previewId);
              storage[`${message.imageMetaData.imageId}.f`] = f_control_msg?.verificationToken;
              storage[`${message.imageMetaData.previewId}.p`] = p_control_msg?.verificationToken;
            }
          });
          resolve({ storage, channel: data });
        });
      }).catch((error) => {
        reject(error);
      });
    });
  }
  uploadChannel(channelData) {
    return this.#callApi("/uploadRoom", channelData);
  }
  authorize(ownerPublicKey, serverSecret) {
    return this.#callApi("/authorizeRoom", { roomId: this.channelId, SERVER_SECRET: serverSecret, ownerKey: ownerPublicKey });
  }
  postPubKey(_exportable_pubKey) {
    throw new Error("postPubKey() deprecated");
  }
  storageRequest(byteLength) {
    return this.#callApi("/storageRequest?size=" + byteLength);
  }
  lock() {
    console.warn("WARNING: lock() on channel api has not been tested/debugged fully ..");
    return new Promise(async (resolve, reject) => {
      if (this.keys.lockedKey == null && this.admin) {
        const _locked_key = await crypto.subtle.generateKey({
          name: "AES-GCM",
          length: 256
        }, true, ["encrypt", "decrypt"]);
        const _exportable_locked_key = await crypto.subtle.exportKey("jwk", _locked_key);
        this.#callApi("/lockRoom").then((data) => {
          if (data.locked) {
            this.acceptVisitor(JSON.stringify(this.exportable_pubKey)).then(() => {
              resolve({ locked: data.locked, lockedKey: _exportable_locked_key });
            });
          }
        }).catch((error) => {
          reject(error);
        });
      } else {
        reject(new Error("no lock key or not admin"));
      }
    });
  }
  acceptVisitor(pubKey) {
    console.warn("WARNING: acceptVisitor() on channel api has not been tested/debugged fully ..");
    return new Promise(async (resolve, reject) => {
      if (!this.privateKey)
        reject(new Error("acceptVisitor(): no private key"));
      const shared_key = await sbCrypto.deriveKey(
        this.privateKey,
        await sbCrypto.importKey("jwk", jsonParseWrapper(pubKey, "L2276"), "ECDH", false, []),
        "AES",
        false,
        ["encrypt", "decrypt"]
      );
      const _encrypted_locked_key = await sbCrypto.encrypt(sbCrypto.str2ab(JSON.stringify(this.keys.lockedKey)), shared_key);
      resolve(this.#callApi(
        "/acceptVisitor",
        {
          pubKey,
          lockedKey: JSON.stringify(_encrypted_locked_key)
        }
      ));
    });
  }
  ownerKeyRotation() {
    throw new Error("ownerKeyRotation() replaced by new budd() approach");
  }
  /**
   * returns a storage token (promise); basic consumption of channel budget
   */
  getStorageToken(size) {
    return new Promise((resolve, reject) => {
      this.#callApi(`/storageRequest?size=${size}`).then((storageTokenReq) => {
        if (storageTokenReq.hasOwnProperty("error"))
          reject(`storage token request error (${storageTokenReq.error})`);
        resolve(JSON.stringify(storageTokenReq));
      }).catch((e) => {
        reject("ChannelApi (getStorageToken) Error [3]: " + WrapError(e));
      });
    });
  }
  budd(options) {
    let { keys, storage, targetChannel } = options ?? {};
    return new Promise(async (resolve, reject) => {
      if (options && options.hasOwnProperty("storage") && options.storage === void 0)
        reject("If you omit 'storage' it defaults to Infinity, but you cannot set 'storage' to undefined");
      try {
        if (!storage)
          storage = Infinity;
        if (targetChannel) {
          if (this.#channelId == targetChannel)
            throw new Error("[budd()]: You can't specify the same channel as targetChannel");
          if (keys)
            throw new Error("[budd()]: You can't specify both a target channel and keys");
          resolve(this.#callApi(`/budd?targetChannel=${targetChannel}&transferBudget=${storage}`));
        } else {
          const { channelData, exportable_privateKey } = await newChannelData(keys ? keys : null);
          let resp = await this.#callApi(`/budd?targetChannel=${channelData.roomId}&transferBudget=${storage}`, channelData);
          if (resp.success) {
            resolve({ channelId: channelData.roomId, key: exportable_privateKey });
          } else {
            reject(JSON.stringify(resp));
          }
        }
      } catch (e) {
        reject(e);
      }
    });
  }
  // // currently not used by webclient, so these are not hooked up
  // notifications() { }
  // getPubKeys() { }
  // ownerUnread() { }
  // registerDevice() { }
};
__decorateClass([
  Memoize,
  Ready
], Channel.prototype, "keys", 1);
__decorateClass([
  Memoize,
  Ready
], Channel.prototype, "sbServer", 1);
__decorateClass([
  Memoize,
  Ready
], Channel.prototype, "readyFlag", 1);
__decorateClass([
  Memoize,
  Ready
], Channel.prototype, "api", 1);
__decorateClass([
  Memoize,
  Ready
], Channel.prototype, "channelId", 1);
__decorateClass([
  Memoize,
  Ready
], Channel.prototype, "channelSignKey", 1);
__decorateClass([
  Ready
], Channel.prototype, "updateCapacity", 1);
__decorateClass([
  Ready
], Channel.prototype, "getCapacity", 1);
__decorateClass([
  Ready
], Channel.prototype, "getStorageLimit", 1);
__decorateClass([
  Ready
], Channel.prototype, "getMother", 1);
__decorateClass([
  Ready
], Channel.prototype, "getJoinRequests", 1);
__decorateClass([
  ExceptionReject
], Channel.prototype, "isLocked", 1);
__decorateClass([
  Ready
], Channel.prototype, "setMOTD", 1);
__decorateClass([
  Ready
], Channel.prototype, "getAdminData", 1);
__decorateClass([
  Ready
], Channel.prototype, "downloadData", 1);
__decorateClass([
  Ready
], Channel.prototype, "uploadChannel", 1);
__decorateClass([
  Ready
], Channel.prototype, "authorize", 1);
__decorateClass([
  Ready
], Channel.prototype, "postPubKey", 1);
__decorateClass([
  Ready
], Channel.prototype, "storageRequest", 1);
__decorateClass([
  Ready
], Channel.prototype, "lock", 1);
__decorateClass([
  Ready
], Channel.prototype, "acceptVisitor", 1);
__decorateClass([
  Ready
], Channel.prototype, "ownerKeyRotation", 1);
__decorateClass([
  Ready
], Channel.prototype, "budd", 1);
function noMessageHandler(_m) {
  _sb_assert(false, "NO MESSAGE HANDLER");
}
var ChannelSocket = class extends Channel {
  ready;
  channelSocketReady;
  #ChannelSocketReadyFlag = false;
  // must be named <class>ReadyFlag
  #ws;
  #sbServer;
  #onMessage = noMessageHandler;
  // the user message handler
  #ack = /* @__PURE__ */ new Map();
  #traceSocket = false;
  // should not be true in production
  #resolveFirstMessage = () => {
    _sb_exception("L2461", "this should never be called");
  };
  #firstMessageEventHandlerReference = (_e) => {
    _sb_exception("L2462", "this should never be called");
  };
  /**
   * 
   * ChannelSocket constructor
   * 
   * This extends Channel. Use this instead of ChannelEndpoint if you
   * are going to be sending/receiving messages.
   * 
   * You send by calling channel.send(msg: SBMessage | string), i.e.
   * you can send a quick string.
   * 
   * You can set your message handler upon creation, or later by using
   * channel.onMessage = (m: ChannelMessage) => { ... }.
   * 
   * This implementation uses websockeds to connect all participating
   * clients through a single servlet (somewhere), with very fast
   * forwarding.
   * 
   * You don't need to worry about managing resources, like closing it,
   * or checking if it's open. It will close based on server behavior,
   * eg it's up to the server to close the connection based on inactivity.
   * The ChannelSocket will re-open if you try to send against a closed
   * connection. You can check status with channelSocket.status if you
   * like, but it shouldn't be necessary.
   * 
   * Messages are delivered as type ChannelMessage. Usually they are
   * simple blobs of data that are encrypted: the ChannelSocket will
   * decrypt them for you. It also handles a simple ack/nack mechanism
   * with the server transparently.
   * 
   * Be aware that if ChannelSocket doesn't know how to handle a certain
   * message, it will generally just forward it to you as-is. 
   * 
   * @param sbServer 
   * @param onMessage 
   * @param key 
   * @param channelId 
   */
  constructor(sbServer, onMessage, key, channelId) {
    super(
      sbServer,
      key,
      channelId
      /*, identity ? identity : new Identity() */
    );
    _sb_assert(sbServer.channel_ws, "ChannelSocket(): no websocket server name provided");
    _sb_assert(onMessage, "ChannelSocket(): no onMessage handler provided");
    const url = sbServer.channel_ws + "/api/room/" + channelId + "/websocket";
    this.#onMessage = onMessage;
    this.#sbServer = sbServer;
    this.#ws = {
      url,
      // websocket: new WebSocket(url),
      ready: false,
      closed: false,
      timeout: 2e3
    };
    this.ready = this.channelSocketReady = this.#channelSocketReadyFactory();
  }
  #channelSocketReadyFactory() {
    if (DBG)
      console.log("++++ CREATING ChannelSocket.readyPromise()");
    return new Promise((resolve, reject) => {
      if (DBG)
        console.log("++++ STARTED ChannelSocket.readyPromise()");
      this.#resolveFirstMessage = resolve;
      const url = this.#ws.url;
      if (DBG) {
        console.log("++++++++ readyPromise() has url:");
        console.log(url);
      }
      if (!this.#ws.websocket)
        this.#ws.websocket = new WebSocket(this.#ws.url);
      if (this.#ws.websocket.readyState === 3) {
        this.#ws.websocket = new WebSocket(url);
      } else if (this.#ws.websocket.readyState === 2) {
        console.warn("STRANGE - trying to use a ChannelSocket that is in the process of closing ...");
        this.#ws.websocket = new WebSocket(url);
      }
      this.#ws.websocket.addEventListener("open", () => {
        this.#ws.closed = false;
        this.channelReady.then(() => {
          _sb_assert(this.exportable_pubKey, "ChannelSocket.readyPromise(): no exportable pub key?");
          this.#ws.init = { name: JSON.stringify(this.exportable_pubKey) };
          if (DBG) {
            console.log("++++++++ readyPromise() constructed init:");
            console.log(this.#ws.init);
          }
          this.#ws.websocket.send(JSON.stringify(this.#ws.init));
        });
      });
      this.#firstMessageEventHandlerReference = this.#firstMessageEventHandler.bind(this);
      this.#ws.websocket.addEventListener("message", this.#firstMessageEventHandlerReference);
      this.#ws.websocket.addEventListener("close", (e) => {
        this.#ws.closed = true;
        if (!e.wasClean) {
          console.log(`ChannelSocket() was closed (and NOT cleanly: ${e.reason} from ${this.#sbServer.channel_server}`);
        } else {
          if (e.reason.includes("does not have an owner"))
            reject(`No such channel on this server (${this.#sbServer.channel_server})`);
          else
            console.log("ChannelSocket() was closed (cleanly): ", e.reason);
        }
        reject("wbSocket() closed before it was opened (?)");
      });
      this.#ws.websocket.addEventListener("error", (e) => {
        this.#ws.closed = true;
        console.log("ChannelSocket() error: ", e);
        reject("ChannelSocket creation error (see log)");
      });
      setTimeout(() => {
        if (!this.#ChannelSocketReadyFlag) {
          console.warn("ChannelSocket() - this socket is not resolving (waited 10s) ...");
          console.log(this);
          reject("ChannelSocket() - this socket is not resolving (waited 10s) ...");
        } else {
          if (DBG) {
            console.log("ChannelSocket() - this socket resolved");
            console.log(this);
          }
        }
      }, 1e4);
    });
  }
  /** @private */
  async #processMessage(msg) {
    let m = msg.data;
    if (this.#traceSocket) {
      console.log("... raw unwrapped message:");
      console.log(structuredClone(m));
    }
    const data = jsonParseWrapper(m, "L1489");
    if (this.#traceSocket) {
      console.log("... json unwrapped version of raw message:");
      console.log(Object.assign({}, data));
    }
    if (typeof this.#onMessage !== "function")
      _sb_exception("ChannelSocket", "received message but there is no handler");
    const message = data;
    try {
      const m01 = Object.entries(message)[0][1];
      if (Object.keys(m01)[0] === "encrypted_contents") {
        if (DBG) {
          console.log("++++++++ #processMessage: received message:");
          console.log(m01.encrypted_contents.content);
        }
        const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(m01.encrypted_contents.content));
        const ack_id = arrayBufferToBase642(hash);
        if (DBG2)
          console.log("Received message with hash:", ack_id);
        const r = this.#ack.get(ack_id);
        if (r) {
          if (this.#traceSocket)
            console.log(`++++++++ #processMessage: found matching ack for id ${ack_id}`);
          this.#ack.delete(ack_id);
          r("success");
        }
        const m00 = Object.entries(data)[0][0];
        const iv_b64 = m01.encrypted_contents.iv;
        if (iv_b64 && _assertBase64(iv_b64) && iv_b64.length == 16) {
          m01.encrypted_contents.iv = base64ToArrayBuffer2(iv_b64);
          try {
            const m2 = await deCryptChannelMessage(m00, m01.encrypted_contents, this.keys);
            if (!m2)
              return;
            if (this.#traceSocket) {
              console.log("++++++++ #processMessage: passing to message handler:");
              console.log(Object.assign({}, m2));
            }
            this.#onMessage(m2);
          } catch {
            console.warn("Error decrypting message, dropping (ignoring) message");
          }
        } else {
          console.error("#processMessage: - iv is malformed, should be 16-char b64 string (ignoring)");
        }
      } else {
        console.warn("++++++++ #processMessage: can't decipher message, passing along unchanged:");
        console.log(Object.assign({}, message));
        this.onMessage(message);
      }
    } catch (e) {
      console.log(`++++++++ #processMessage: caught exception while decyphering (${e}), passing it along unchanged`);
      this.onMessage(message);
    }
  }
  #insideFirstMessageHandler(e) {
    console.warn("WARNING: firstMessageEventHandler() called recursively (?)");
    console.warn(e);
  }
  // we use (bound) message handlers orchestrate who handles first message (and only once)
  #firstMessageEventHandler(e) {
    if (this.#traceSocket)
      console.log("FIRST MESSAGE HANDLER CALLED");
    const blocker = this.#insideFirstMessageHandler.bind(this);
    this.#ws.websocket.addEventListener("message", blocker);
    this.#ws.websocket.removeEventListener("message", this.#firstMessageEventHandlerReference);
    if (DBG) {
      console.log("++++++++ readyPromise() received ChannelKeysMessage:");
      console.log(e);
    }
    const message = jsonParseWrapper(e.data, "L2239");
    if (DBG)
      console.log(message);
    _sb_assert(message.ready, "got roomKeys but channel reports it is not ready (?)");
    this.motd = message.motd;
    this.locked = message.roomLocked;
    const exportable_owner_pubKey = jsonParseWrapper(message.keys.ownerKey, "L2246");
    _sb_assert(this.keys.ownerPubKeyX === exportable_owner_pubKey.x, "ChannelSocket.readyPromise(): owner key mismatch??");
    _sb_assert(this.readyFlag, "#ChannelReadyFlag is false, parent not ready (?)");
    this.owner = sbCrypto.compareKeys(exportable_owner_pubKey, this.exportable_pubKey);
    this.admin = false;
    this.#ws.websocket.addEventListener("message", this.#processMessage.bind(this));
    this.#ws.websocket.removeEventListener("message", blocker);
    if (DBG)
      console.log("++++++++ readyPromise() all done - resolving!");
    this.#ChannelSocketReadyFlag = true;
    this.#resolveFirstMessage(this);
  }
  get status() {
    if (!this.#ws.websocket)
      return "CLOSED";
    else
      switch (this.#ws.websocket.readyState) {
        case 0:
          return "CONNECTING";
        case 1:
          return "OPEN";
        case 2:
          return "CLOSING";
        default:
          return "CLOSED";
      }
  }
  set onMessage(f) {
    this.#onMessage = f;
  }
  get onMessage() {
    return this.#onMessage;
  }
  /** Enables debug output */
  set enableTrace(b) {
    this.#traceSocket = b;
    if (b)
      console.log("==== jslib ChannelSocket: Tracing enabled ====");
  }
  send(msg) {
    let message = typeof msg === "string" ? new SBMessage(this, msg) : msg;
    _sb_assert(this.#ws.websocket, "ChannelSocket.send() called before ready");
    if (this.#ws.closed) {
      if (this.#traceSocket)
        console.info("send() triggered reset of #readyPromise() (normal)");
      this.ready = this.channelSocketReady = this.#channelSocketReadyFactory();
      this.#ChannelSocketReadyFlag = true;
    }
    return new Promise((resolve, reject) => {
      message.ready.then((message2) => {
        this.ready.then(() => {
          if (!this.#ChannelSocketReadyFlag)
            reject("ChannelSocket.send() is confused - ready or not?");
          switch (this.#ws.websocket.readyState) {
            case 1:
              if (this.#traceSocket) {
                console.log("++++++++ ChannelSocket.send(): Wrapping message contents:");
                console.log(Object.assign({}, message2.contents));
              }
              sbCrypto.wrap(message2.encryptionKey, JSON.stringify(message2.contents), "string").then((wrappedMessage) => {
                const m = JSON.stringify({
                  encrypted_contents: wrappedMessage,
                  recipient: message2.sendToPubKey ? message2.sendToPubKey : void 0
                });
                if (this.#traceSocket) {
                  console.log("++++++++ ChannelSocket.send(): sending message:");
                  console.log(wrappedMessage.content.slice(0, 100) + "  ...  " + wrappedMessage.content.slice(-100));
                }
                crypto.subtle.digest("SHA-256", new TextEncoder().encode(wrappedMessage.content)).then((hash) => {
                  const messageHash = arrayBufferToBase642(hash);
                  if (this.#traceSocket) {
                    console.log("++++++++ ChannelSocket.send():Which has hash:");
                    console.log(messageHash);
                  }
                  this.#ack.set(messageHash, resolve);
                  this.#ws.websocket.send(m);
                  setTimeout(() => {
                    if (this.#ack.has(messageHash)) {
                      this.#ack.delete(messageHash);
                      const msg2 = `Websocket request timed out (no ack) after ${this.#ws.timeout}ms (${messageHash})`;
                      console.error(msg2);
                      reject(msg2);
                    } else {
                      if (this.#traceSocket)
                        console.log("++++++++ ChannelSocket.send() completed sending");
                      resolve("success");
                    }
                  }, this.#ws.timeout);
                });
              });
              break;
            case 3:
            case 0:
            case 2:
              const errMsg = "socket not OPEN - either CLOSED or in the state of CONNECTING/CLOSING";
              reject(errMsg);
          }
        });
      });
    });
  }
  get exportable_owner_pubKey() {
    return this.keys.ownerKey;
  }
};
__decorateClass([
  Ready
], ChannelSocket.prototype, "onMessage", 1);
__decorateClass([
  VerifyParameters
], ChannelSocket.prototype, "send", 1);
__decorateClass([
  Memoize,
  Ready
], ChannelSocket.prototype, "exportable_owner_pubKey", 1);
var ChannelEndpoint = class extends Channel {
  constructor(sbServer, key, channelId) {
    super(sbServer, key, channelId);
  }
  send(_m, _messageType) {
    return new Promise((_resolve, reject) => {
      reject("ChannelEndpoint.send(): send outside ChannelSocket not yet implemented");
    });
  }
  set onMessage(_f) {
    _sb_assert(false, "ChannelEndpoint.onMessage: send/receive outside ChannelSocket not yet implemented");
  }
};
async function deCryptChannelMessage(m00, m01, keys) {
  const z = messageIdRegex.exec(m00);
  let encryptionKey = keys.encryptionKey;
  if (z) {
    let m = {
      type: "encrypted",
      channelID: z[1],
      timestampPrefix: z[2],
      _id: z[1] + z[2],
      encrypted_contents: encryptedContentsMakeBinary(m01)
    };
    const unwrapped = await sbCrypto.unwrap(encryptionKey, m.encrypted_contents, "string");
    let m2 = { ...m, ...jsonParseWrapper(unwrapped, "L1977") };
    if (m2.contents) {
      m2.text = m2.contents;
    }
    m2.user = {
      name: m2.sender_username ? m2.sender_username : "Unknown",
      _id: m2.sender_pubKey
    };
    if (m2.verificationToken && !m2.sender_pubKey) {
      console.error("ERROR: message with verification token is lacking sender identity (cannot be verified).");
      return void 0;
    }
    const senderPubKey = await sbCrypto.importKey("jwk", m2.sender_pubKey, "ECDH", true, []);
    const verifyKey = await sbCrypto.deriveKey(keys.signKey, senderPubKey, "HMAC", false, ["sign", "verify"]);
    const v = await sbCrypto.verify(verifyKey, m2.sign, m2.contents);
    if (!v) {
      console.error("***** signature is NOT correct for message (rejecting)");
      console.log("verifyKey:");
      console.log(Object.assign({}, verifyKey));
      console.log("m2.sign");
      console.log(Object.assign({}, m2.sign));
      console.log("m2.contents");
      console.log(structuredClone(m2.contents));
      console.log("Message:");
      console.log(Object.assign({}, m2));
      console.trace();
      return void 0;
    }
    if (m2.whispered === true) {
    }
    return m2;
  } else {
    console.log("++++++++ #processMessage: ERROR - cannot parse channel ID / timestamp, invalid message");
    console.log(Object.assign({}, m00));
    console.log(Object.assign({}, m01));
    return void 0;
  }
}
var SBObjectHandle = class {
  version = currentSBOHVersion;
  #_type = "b";
  // internal: these are 32-byte binary values
  #id_binary;
  #key_binary;
  #verification;
  shardServer;
  iv;
  salt;
  // the rest are conveniences, should probably migrate to SBFileHandle
  fileName;
  dateAndTime;
  fileType;
  lastModified;
  actualSize;
  savedSize;
  constructor(options) {
    const {
      version: version4,
      type,
      id,
      key,
      verification,
      iv,
      salt,
      fileName,
      dateAndTime,
      shardServer,
      fileType,
      lastModified,
      actualSize,
      savedSize
    } = options;
    if (type)
      this.#_type = type;
    if (version4) {
      this.version = version4;
    } else {
      if (key && id) {
        if (isBase62Encoded(key) && isBase62Encoded(id)) {
          this.version = "2";
        } else if (isBase64Encoded(key) && isBase64Encoded(id)) {
          this.version = "1";
        } else {
          throw new Error("Unable to determine version from key and id");
        }
      } else {
        this.version = "2";
      }
    }
    if (id)
      this.id = id;
    if (key)
      this.key = key;
    if (verification)
      this.verification = verification;
    this.iv = iv;
    this.salt = salt;
    this.fileName = fileName;
    this.dateAndTime = dateAndTime;
    this.shardServer = shardServer;
    this.fileType = fileType;
    this.lastModified = lastModified;
    this.actualSize = actualSize;
    this.savedSize = savedSize;
  }
  set id_binary(value) {
    if (!value)
      throw new Error("Invalid id_binary");
    if (value.byteLength !== 32)
      throw new Error("Invalid id_binary length");
    this.#id_binary = value;
    Object.defineProperty(this, "id64", {
      get: () => {
        return arrayBufferToBase642(this.#id_binary);
      },
      enumerable: false,
      // Or false if you don't want it to be serialized
      configurable: false
      // Allows this property to be redefined or deleted
    });
    Object.defineProperty(this, "id32", {
      get: () => {
        return arrayBufferToBase62(this.#id_binary);
      },
      enumerable: false,
      // Or false if you don't want it to be serialized
      configurable: false
      // Allows this property to be redefined or deleted
    });
  }
  // same as above for key_binary
  set key_binary(value) {
    if (!value)
      throw new Error("Invalid key_binary");
    if (value.byteLength !== 32)
      throw new Error("Invalid key_binary length");
    this.#key_binary = value;
    Object.defineProperty(this, "key64", {
      get: () => {
        return arrayBufferToBase642(this.#key_binary);
      },
      enumerable: false,
      // Or false if you don't want it to be serialized
      configurable: false
      // Allows this property to be redefined or deleted
    });
    Object.defineProperty(this, "key32", {
      get: () => {
        return arrayBufferToBase62(this.#key_binary);
      },
      enumerable: false,
      // Or false if you don't want it to be serialized
      configurable: false
      // Allows this property to be redefined or deleted
    });
  }
  set id(value) {
    if (typeof value === "string") {
      if (this.version === "1") {
        if (isBase64Encoded(value)) {
          this.id_binary = base64ToArrayBuffer2(value);
        } else {
          throw new Error("Requested version 1, but id is not b64");
        }
      } else if (this.version === "2") {
        if (isBase62Encoded(value)) {
          this.id_binary = base62ToArrayBuffer32(value);
        } else {
          throw new Error("Requested version 2, but id is not b62");
        }
      }
    } else if (value instanceof ArrayBuffer) {
      if (value.byteLength !== 32)
        throw new Error("Invalid ID length");
      this.id_binary = value;
    } else {
      throw new Error("Invalid ID type");
    }
  }
  // same as above but for key
  set key(value) {
    if (typeof value === "string") {
      if (this.version === "1") {
        if (isBase64Encoded(value)) {
          this.#key_binary = base64ToArrayBuffer2(value);
        } else {
          throw new Error("Requested version 1, but key is not b64");
        }
      } else if (this.version === "2") {
        if (isBase62Encoded(value)) {
          this.#key_binary = base62ToArrayBuffer32(value);
        } else {
          throw new Error("Requested version 2, but key is not b62");
        }
      }
    } else if (value instanceof ArrayBuffer) {
      if (value.byteLength !== 32)
        throw new Error("Invalid key length");
      this.#key_binary = value;
    } else {
      throw new Error("Invalid key type");
    }
  }
  // the getter for id returns based on what version we are
  // we stripA32() because this is also used by JSON.stringify()
  // (unless we want to write a custom serializer ...)
  get id() {
    _sb_assert(this.#id_binary, "object handle id is undefined");
    if (this.version === "1") {
      return arrayBufferToBase642(this.#id_binary);
    } else if (this.version === "2") {
      return arrayBufferToBase62(this.#id_binary);
    } else {
      throw new Error("Invalid or missing version (internal error, should not happen)");
    }
  }
  // same as above but for key
  get key() {
    _sb_assert(this.#key_binary, "object handle key is undefined");
    if (this.version === "1") {
      return arrayBufferToBase642(this.#key_binary);
    } else if (this.version === "2") {
      return arrayBufferToBase62(this.#key_binary);
    } else {
      throw new Error("Invalid or missing version (internal error, should not happen)");
    }
  }
  // convenience getters - these are placeholders for type definitions
  get id64() {
    throw new Error("Invalid id_binary");
  }
  get id32() {
    throw new Error("Invalid id_binary");
  }
  get key64() {
    throw new Error("Invalid key_binary");
  }
  get key32() {
    throw new Error("Invalid key_binary");
  }
  set verification(value) {
    this.#verification = value;
  }
  get verification() {
    _sb_assert(this.#verification, "object handle verification is undefined");
    return this.#verification;
  }
  get type() {
    return this.#_type;
  }
};
var StorageApi = class {
  server;
  channelServer;
  shardServer;
  sbServer;
  // constructor(server: string, channelServer: string, shardServer?: string) {
  constructor(sbServer) {
    const { storage_server, channel_server, shard_server } = sbServer;
    this.server = storage_server + "/api/v1";
    this.channelServer = channel_server + "/api/room/";
    if (shard_server)
      this.shardServer = shard_server + "/api/v1";
    this.sbServer = sbServer;
  }
  /**
   * Pads object up to closest permitted size boundaries;
   * currently that means a minimum of 4KB and a maximum of
   * of 1 MB, after which it rounds up to closest MB.
   *
   * @param buf blob of data to be eventually stored
   */
  /** @private */
  #padBuf(buf) {
    const image_size = buf.byteLength;
    let _target;
    if (image_size + 4 < 4096)
      _target = 4096;
    else if (image_size + 4 < 1048576)
      _target = 2 ** Math.ceil(Math.log2(image_size + 4));
    else
      _target = Math.ceil((image_size + 4) / 1048576) * 1048576;
    let finalArray = _appendBuffer(buf, new Uint8Array(_target - image_size).buffer);
    new DataView(finalArray).setUint32(_target - 4, image_size);
    if (DBG2)
      console.log("#padBuf bytes:", finalArray.slice(-4));
    return finalArray;
  }
  /**
   * The actual size of the object is encoded in the
   * last 4 bytes of the buffer. This function removes
   * all the padding and returns the actual object.
   */
  /** @private */
  #unpadData(data_buffer) {
    const tail = data_buffer.slice(-4);
    var _size = new DataView(tail).getUint32(0);
    const _little_endian = new DataView(tail).getUint32(0, true);
    if (_little_endian < _size) {
      if (DBG2)
        console.warn("#unpadData - size of shard encoded as little endian (fixed upon read)");
      _size = _little_endian;
    }
    if (DBG2) {
      console.log(`#unpadData - size of object is ${_size}`);
    }
    return data_buffer.slice(0, _size);
  }
  /** @private */
  #getObjectKey(fileHashBuffer, _salt) {
    return new Promise((resolve, reject) => {
      try {
        sbCrypto.importKey(
          "raw",
          fileHashBuffer,
          "PBKDF2",
          false,
          ["deriveBits", "deriveKey"]
        ).then((keyMaterial) => {
          crypto.subtle.deriveKey({
            "name": "PBKDF2",
            // salt: crypto.getRandomValues(new Uint8Array(16)),
            "salt": _salt,
            "iterations": 1e5,
            // small is fine, we want it snappy
            "hash": "SHA-256"
          }, keyMaterial, { "name": "AES-GCM", "length": 256 }, true, ["encrypt", "decrypt"]).then((key) => {
            resolve(key);
          });
        });
      } catch (e) {
        reject(e);
      }
    });
  }
  // // returns a storage token (promise); basic consumption of channel budget
  // getStorageToken(roomId: SBChannelId, size: number): Promise<string> {
  //   return new Promise((resolve, reject) => {
  //     SBFetch(this.channelServer + stripA32(roomId) + '/storageRequest?size=' + size)
  //       .then((r) => r.json())
  //       .then((storageTokenReq) => {
  //         if (storageTokenReq.hasOwnProperty('error')) reject(`storage token request error (${storageTokenReq.error})`)
  //         resolve(JSON.stringify(storageTokenReq))
  //       })
  //       .catch((e) => {
  //         const msg = `getStorageToken] storage token request failed: ${e}`
  //         console.error(msg)
  //         reject(msg)
  //       });
  //   });
  // }
  /** @private
   * get "permission" to store in the form of a token
   */
  #_allocateObject(image_id, type) {
    return new Promise((resolve, reject) => {
      SBFetch(this.server + "/storeRequest?name=" + arrayBufferToBase62(image_id) + "&type=" + type).then((r) => {
        return r.arrayBuffer();
      }).then((b) => {
        const par = extractPayload(b);
        resolve({ salt: new Uint8Array(par.salt), iv: new Uint8Array(par.iv) });
      }).catch((e) => {
        console.warn(`**** ERROR: ${e}`);
        reject(e);
      });
    });
  }
  // this returns a promise to the verification string  
  async #_storeObject(image, image_id, keyData, type, budgetChannel, iv, salt) {
    return new Promise(async (resolve, reject) => {
      try {
        const key = await this.#getObjectKey(keyData, salt);
        const data = await sbCrypto.encrypt(image, key, iv, "arrayBuffer");
        const storageToken = await budgetChannel.getStorageToken(data.byteLength);
        const resp_json = await this.storeObject(type, image_id, iv, salt, storageToken, data);
        if (resp_json.error)
          reject(`storeObject() failed: ${resp_json.error}`);
        if (resp_json.image_id != stripA32(image_id))
          reject(`received imageId ${resp_json.image_id} but expected ${image_id}`);
        resolve(resp_json.verification_token);
      } catch (e) {
        const msg = `storeObject() failed: ${e}`;
        console.error(msg);
        reject(msg);
      }
    });
  }
  /**
   * StorageApi.storeData()
   * 
   * Low level of shard uploading - this needs to have all the details. You would
   * generally not call this directly, but rather use storeData().
   */
  storeObject(type, fileId, iv, salt, storageToken, data) {
    return new Promise((resolve, reject) => {
      if (typeof type !== "string") {
        const errMsg = "NEW in 1.2.x - storeData() and storeObject() have switched places, you probably meant to use storeData()";
        console.error(errMsg);
        reject("errMsg");
      }
      SBFetch(this.server + "/storeData?type=" + type + "&key=" + stripA32(fileId), {
        // ToDo: bit of a hack in handling "a32"
        // psm: need to clean up these types
        method: "POST",
        body: assemblePayload({
          iv,
          salt,
          image: data,
          storageToken: new TextEncoder().encode(storageToken),
          vid: crypto.getRandomValues(new Uint8Array(48))
        })
      }).then((response) => {
        if (!response.ok) {
          reject("response from storage server was not OK");
        }
        return response.json();
      }).then((data2) => {
        resolve(data2);
      }).catch((error) => {
        reject(error);
      });
    });
  }
  /**
   * StorageApi.storeData
   * 
   * Main high level work horse: besides buffer and type of data,
   * it only needs the roomId (channel). Assigned meta data is
   * optional.
   * 
   * This will eventually call storeObject().
   * 
   * It is a bit outdated ... it accepts metadata for historical reasons
   */
  storeData(buf, type, roomId, metadata) {
    return new Promise((resolve, reject) => {
      if (typeof buf === "string") {
        const errMsg = "NEW in 1.2.x - storeData() and storeObject() have switched places, you probably meant to use storeObject()";
        console.error(errMsg);
        reject("errMsg");
      }
      if (buf instanceof Uint8Array) {
        if (DBG2)
          console.log("converting Uint8Array to ArrayBuffer");
        buf = new Uint8Array(buf).buffer;
      }
      if (!(buf instanceof ArrayBuffer) && buf.constructor.name != "ArrayBuffer") {
        if (DBG2)
          console.log("buf must be an ArrayBuffer:");
        console.log(buf);
        reject("buf must be an ArrayBuffer");
      }
      const bufSize = buf.byteLength;
      if (metadata) {
        console.warn("storeData() called with metadata - this is deprecated (let us know how/where this is needed)");
        reject("storeData() called with metadata - this is deprecated");
      }
      const channel2 = roomId instanceof ChannelEndpoint ? roomId : new ChannelEndpoint(this.sbServer, void 0, roomId);
      const paddedBuf = this.#padBuf(buf);
      sbCrypto.generateIdKey(paddedBuf).then((fullHash) => {
        this.#_allocateObject(fullHash.id_binary, type).then((p) => {
          const id32 = arrayBufferToBase62(fullHash.id_binary);
          const key32 = arrayBufferToBase62(fullHash.key_material);
          const r = {
            [SB_OBJECT_HANDLE_SYMBOL]: true,
            version: currentSBOHVersion,
            type,
            // id: fullHash.id64,
            // key: fullHash.key64,
            // id: base64ToBase62(fullHash.id32),
            // key: base64ToBase62(fullHash.key32),
            id: id32,
            key: key32,
            iv: p.iv,
            salt: p.salt,
            actualSize: bufSize,
            verification: this.#_storeObject(paddedBuf, id32, fullHash.key_material, type, channel2, p.iv, p.salt)
          };
          resolve(r);
        }).catch((e) => reject(e));
      });
    });
  }
  // for future reference:
  //   StorageApi().storeRequest
  // is now internal-only (#_allocateObject)
  /** @private */
  #processData(payload, h) {
    return new Promise((resolve, reject) => {
      try {
        let j = jsonParseWrapper(sbCrypto.ab2str(new Uint8Array(payload)), "L3062");
        if (j.error)
          reject(`#processData() error: ${j.error}`);
      } catch (e) {
      } finally {
        const data = extractPayload(payload);
        if (DBG) {
          console.log("Payload (#processData) is:");
          console.log(data);
        }
        const iv = new Uint8Array(data.iv);
        const salt = new Uint8Array(data.salt);
        const handleIV = !h.iv ? void 0 : typeof h.iv === "string" ? base64ToArrayBuffer2(h.iv) : h.iv;
        const handleSalt = !h.salt ? void 0 : typeof h.salt === "string" ? base64ToArrayBuffer2(h.salt) : h.salt;
        if (handleIV && !compareBuffers(iv, handleIV)) {
          console.error("WARNING: nonce from server differs from local copy");
          console.log(`object ID: ${h.id}`);
          console.log(` local iv: ${arrayBufferToBase642(handleIV)}`);
          console.log(`server iv: ${arrayBufferToBase642(data.iv)}`);
        }
        if (handleSalt && !compareBuffers(salt, handleSalt)) {
          console.error("WARNING: salt from server differs from local copy (will use server)");
          if (!h.salt) {
            console.log("h.salt is undefined");
          } else if (typeof h.salt === "string") {
            console.log("h.salt is in string form (unprocessed):");
            console.log(h.salt);
          } else {
            console.log("h.salt is in arrayBuffer or Uint8Array");
            console.log("h.salt as b64:");
            console.log(arrayBufferToBase642(h.salt));
            console.log("h.salt unprocessed:");
            console.log(h.salt);
          }
          console.log("handleSalt as b64:");
          console.log(arrayBufferToBase642(handleSalt));
          console.log("handleSalt unprocessed:");
          console.log(handleSalt);
        }
        if (DBG2) {
          console.log("will use nonce and salt of:");
          console.log(`iv: ${arrayBufferToBase642(iv)}`);
          console.log(`salt : ${arrayBufferToBase642(salt)}`);
        }
        var h_key_material;
        if (h.version === "1") {
          h_key_material = base64ToArrayBuffer2(h.key);
        } else if (h.version === "2") {
          h_key_material = base62ToArrayBuffer32(h.key);
        } else {
          throw new Error("Invalid or missing version (internal error, should not happen)");
        }
        this.#getObjectKey(h_key_material, salt).then((image_key) => {
          const encrypted_image = data.image;
          if (DBG2) {
            console.log("data.image:      ");
            console.log(data.image);
            console.log("encrypted_image: ");
            console.log(encrypted_image);
          }
          sbCrypto.unwrap(image_key, { content: encrypted_image, iv }, "arrayBuffer").then((padded_img) => {
            const img = this.#unpadData(padded_img);
            if (DBG) {
              console.log("#processData(), unwrapped img: ");
              console.log(img);
            }
            resolve(img);
          });
        });
      }
    });
  }
  // any failure conditions returns 'null', facilitating trying multiple servers
  async #_fetchData(useServer, url, h, returnType) {
    return new Promise((resolve, _reject) => {
      try {
        const body = { method: "GET" };
        SBFetch(useServer + url, body).then((response) => {
          if (!response.ok)
            return null;
          return response.arrayBuffer();
        }).then((payload) => {
          if (payload === null)
            return null;
          return this.#processData(payload, h);
        }).then((payload) => {
          if (payload === null)
            resolve(null);
          if (returnType === "string")
            resolve(sbCrypto.ab2str(new Uint8Array(payload)));
          else
            resolve(payload);
        }).catch((_error) => {
          resolve(null);
        });
      } catch (e) {
        resolve(null);
      }
    });
  }
  fetchData(handle, returnType = "arrayBuffer") {
    return new Promise(async (resolve, reject) => {
      const h = new SBObjectHandle(handle);
      if (!h)
        reject("SBObjectHandle is null or undefined");
      const verificationToken = await h.verification;
      const useServer = h.shardServer ? h.shardServer + "/api/v1" : this.shardServer ? this.shardServer : this.server;
      if (DBG)
        console.log("fetchData(), fetching from server: " + useServer);
      const queryString = "/fetchData?id=" + h.id + "&type=" + h.type + "&verification_token=" + verificationToken;
      const result = await this.#_fetchData(useServer, queryString, h, returnType);
      if (result)
        resolve(result);
      for (let i = 0; i < knownStorageAndShardServers.length; i++) {
        const tryServer = knownStorageAndShardServers[i] + "/api/v1";
        if (tryServer !== useServer) {
          const result2 = await this.#_fetchData(tryServer, queryString, h, returnType);
          if (result2)
            resolve(result2);
        }
      }
      reject("fetchData() failed - tried all servers");
    });
  }
  /**
   * StorageApi().retrieveData()
   * retrieves an object from storage
   */
  async retrieveImage(imageMetaData, controlMessages, imageId, imageKey, imageType, imgObjVersion) {
    console.trace("retrieveImage()");
    console.log(imageMetaData);
    const id = imageId ? imageId : imageMetaData.previewId;
    const key = imageKey ? imageKey : imageMetaData.previewKey;
    const type = imageType ? imageType : "p";
    const objVersion = imgObjVersion ? imgObjVersion : imageMetaData.imgObjVersion ? imageMetaData.imgObjVersion : "2";
    const control_msg = controlMessages.find((ctrl_msg) => ctrl_msg.id && ctrl_msg.id == id);
    console.log(control_msg);
    if (control_msg) {
      _sb_assert(control_msg.verificationToken, "retrieveImage(): verificationToken missing (?)");
      _sb_assert(control_msg.id, "retrieveImage(): id missing (?)");
      const obj = {
        type,
        version: objVersion,
        id: control_msg.id,
        key,
        verification: new Promise((resolve, reject) => {
          if (control_msg.verificationToken)
            resolve(control_msg.verificationToken);
          else
            reject("retrieveImage(): verificationToken missing (?)");
        })
      };
      const img = await this.fetchData(obj);
      console.log(img);
      return { "url": "data:image/jpeg;base64," + arrayBufferToBase642(img, "b64") };
    } else {
      return { "error": "Failed to fetch data - missing control message for that image" };
    }
  }
  /* Unused Currently
  migrateStorage() {
  }
  fetchDataMigration() {
  }
   */
};
var Snackabra = class {
  #storage;
  #channel;
  #preferredServer;
  #version = version;
  /**
  * @param args - optional object with URLs of preferred servers.
  * 
  * Note that 'new Snackabra()' is guaranteed synchronous. You can optionally call
  * without a parameter in which case SB will ping known servers.
  * 
  *   * @example
  * ```typescript
  *     const sb = new Snackabra({
  *     channel_server: 'http://localhost:3845',
  *     channel_ws: 'ws://localhost:3845',
  *     storage_server: 'http://localhost:3843',
  *     shard_server: 'http://localhost:3841',
  *     })
  * ```
  * 
  * @param DEBUG - optional boolean to enable debug logging
  */
  constructor(sbServer, DEBUG4 = false) {
    console.warn(`==== CREATING Snackabra object generation: ${this.version} ====`);
    if (sbServer) {
      this.#preferredServer = Object.assign({}, sbServer);
      this.#storage = new StorageApi(sbServer);
      if (DEBUG4)
        DBG = true;
      if (DBG)
        console.warn("++++ Snackabra constructor ++++ setting DBG to TRUE ++++");
    }
  }
  /**
   * Connects to :term:`Channel Name` on this SB config.
   * Returns a channel socket promise right away, but it
   * will not be ready until the ``ready`` promise is resolved.
   * 
   * Note that if you have a preferred server then the channel
   * object will be returned right away, but the ``ready`` promise
   * will still be pending. If you do not have a preferred server,
   * then the ``ready`` promise will be resolved when at least
   * one of the known servers is responding and ready.
   * 
   * @param channelName - the name of the channel to connect to
   * @param key - optional key to use for encryption/decryption
   * @param channelId - optional channel id to use for encryption/decryption
   * @returns a channel object
   */
  connect(onMessage, key, channelId) {
    if (DBG) {
      console.log("++++ Snackabra.connect() ++++");
      if (key)
        console.log(key);
      if (channelId)
        console.log(channelId);
    }
    return new Promise(async (resolve) => {
      if (this.#preferredServer)
        resolve(new ChannelSocket(this.#preferredServer, onMessage, key, channelId));
      else
        resolve(Promise.any(SBKnownServers.map((s) => new ChannelSocket(s, onMessage, key, channelId).ready)));
    });
  }
  // if there's a 'preferred' (only) server then we we can return a promise right away
  // return new Promise<ChannelSocket>((resolve, reject) => {
  // else Promise.any(SBKnownServers.map((s) => (new ChannelSocket(s, onMessage, key, channelId))))
  //   .then((c) => { console.log("Got channel:"); console.log(c); resolve(c.ready); })
  //   .catch((e) => { console.log("No known servers responding to channel"); reject(e); })
  // Promise.any(this.#preferredServer
  //   ? [new ChannelSocket(this.#preferredServer!, onMessage, key, channelId)]
  //   : SBKnownServers.map((s) => (new ChannelSocket(s, onMessage, key, channelId))))
  //   .then((c) => { console.log("Got channel:"); console.log(c); resolve(c); })
  //   .catch((e) => { console.log("No known servers responding to channel"); reject(e); })
  /// })
  // }
  /**
   * Creates a new channel. Currently uses trivial authentication.
   * Returns a promise to a ''SBChannelHandle'' object
   * (which includes the :term:`Channel Name`).
   * Note that this method does not connect to the channel,
   * it just creates (authorizes) it.
   * 
   * @param sbServer - the server to use
   * @param serverSecret - the server secret (dev only)
   * @param keys - optional keys to use for encryption/decryption
   * @param budgetChannel - NECESSARY unless local/dev; provides a channel to pay for storage
   * 
   * Note that if you have a full budget channel, you can budd off it (which
   * will take all the storage). Providing a budget channel here will allows
   * you to create new channels when a 'guest' on some channel (for example).
   */
  create(sbServer, serverSecretOrBudgetChannel, keys) {
    return new Promise(async (resolve, reject) => {
      try {
        const { channelData, exportable_privateKey } = await newChannelData(keys ? keys : null);
        if (!channelData.roomId) {
          throw new Error("Unable to determine roomId from key and id (it is empty)");
        }
        const budgetChannel = serverSecretOrBudgetChannel instanceof ChannelEndpoint ? serverSecretOrBudgetChannel : void 0;
        if (serverSecretOrBudgetChannel && typeof serverSecretOrBudgetChannel === "string")
          channelData.SERVER_SECRET = serverSecretOrBudgetChannel;
        if (budgetChannel) {
          const storageToken = await budgetChannel.getStorageToken(NEW_CHANNEL_MINIMUM_BUDGET);
          if (!storageToken)
            reject("[create channel] Failed to get storage token for the provided channel");
          channelData.storageToken = storageToken;
        }
        console.log(channelData);
        const data = new TextEncoder().encode(JSON.stringify(channelData));
        let resp = await SBFetch(sbServer.channel_server + "/api/room/" + stripA32(channelData.roomId) + "/uploadRoom", {
          method: "POST",
          body: data
        });
        resp = await resp.json();
        if (resp.success) {
          resolve({ channelId: channelData.roomId, key: exportable_privateKey, server: sbServer.channel_server });
        } else {
          reject(JSON.stringify(resp));
        }
      } catch (e) {
        const msg = `create() failed: ${e}`;
        console.error(msg);
        reject(msg);
      }
    });
  }
  /**
   * Connects to a channel.
   */
  get channel() {
    return this.#channel;
  }
  /**
   * Returns the storage API.
   */
  get storage() {
    return this.#storage;
  }
  /**
   * Returns the crypto API.
   */
  get crypto() {
    return sbCrypto;
  }
  get version() {
    return this.#version;
  }
};
var SB = {
  Snackabra,
  SBMessage,
  Channel,
  SBCrypto,
  SB384,
  arrayBufferToBase64: arrayBufferToBase642,
  sbCrypto,
  version
};
if (!globalThis.SB)
  globalThis.SB = SB;
console.warn(`==== SNACKABRA jslib loaded ${globalThis.SB.version} ====`);

// src/boot/loadShard.ts
function deCryptShard(data) {
  return new Promise((resolve, reject) => {
    crypto.subtle.importKey("raw", data.shardKey, "PBKDF2", false, ["deriveBits", "deriveKey"]).then((keyMaterial) => {
      crypto.subtle.deriveKey({
        "name": "PBKDF2",
        "salt": data.salt,
        "iterations": 1e5,
        "hash": "SHA-256"
      }, keyMaterial, { "name": "AES-GCM", "length": 256 }, true, ["encrypt", "decrypt"]).then((key) => {
        crypto.subtle.decrypt({ name: "AES-GCM", iv: data.iv }, key, data.image).then((padded) => {
          let actualSize = new DataView(padded.slice(-4)).getUint32(0);
          resolve(padded.slice(0, actualSize));
        }).catch(() => {
          reject("error decrypting shard");
        });
      }).catch(() => {
        reject("unable to derive key");
      });
    }).catch(() => {
      reject("unable to import key");
    });
  });
}
function extractPayload2(payload) {
  const metadataSize = new Uint32Array(payload.slice(0, 4))[0];
  const decoder = new TextDecoder();
  const _metadata = JSON.parse(decoder.decode(payload.slice(4, 4 + metadataSize)));
  const startIndex = 4 + metadataSize;
  const data = {};
  for (let i = 1; i < Object.keys(_metadata).length; i++) {
    const _index = i.toString();
    if (_metadata[_index]) {
      const propertyStartIndex = _metadata[_index]["start"];
      const size = _metadata[_index]["size"];
      const entry = _metadata[_index];
      data[entry["name"]] = payload.slice(startIndex + propertyStartIndex, startIndex + propertyStartIndex + size);
    } else {
      console.log(`found nothing for index ${i}`);
    }
  }
  return data;
}
function loadShard(shard) {
  return new Promise((resolve, reject) => {
    if (!shard.shardServer) {
      console.error("shardServer not found (2.0 change: required)");
      throw new Error("shardServer not found (2.0 change: required)");
    }
    const codeShardFetch = `${shard.shardServer}/api/v1/fetchData?id=${shard.id}&type=p&verification_token=${shard.verification}`;
    fetch(codeShardFetch).then((res) => res.arrayBuffer()).then((payload) => {
      let data = extractPayload2(payload);
      if (shard.version == "1") {
        data.shardKey = base64ToArrayBuffer(shard.key);
      } else if (shard.version == "2") {
        data.shardKey = base62ToArrayBuffer32(shard.key);
      } else {
        reject(`unknown or missing shard version: ${shard}`);
      }
      deCryptShard(data).then((decrypted) => {
        resolve(decrypted);
      }).catch(() => {
        reject("unable to decrypt");
      });
    }).catch((err) => {
      if (`${err}`.match('"ror":"cann"'))
        reject("shard not found");
      else
        reject(`failed to fetch or process shard: ${err}`);
    });
  });
}
function loadLibraryCode(shard) {
  return new Promise((resolve, reject) => {
    loadShard(shard).then((decrypted) => {
      let jslibText = new TextDecoder("utf-8").decode(decrypted);
      const script = document.createElement("script");
      script.textContent = jslibText;
      document.head.append(script);
      console.log("'window.SB' object (library loaded) should be available in the console.");
      resolve();
    }).catch(() => {
      reject("unable to fetch shard");
    });
  });
}
function bootstrapJsLib() {
  const jsLib = window.configuration && window.configuration.jslibShardHandle ? window.configuration.jslibShardHandle : {
    // '2.0.0 (pre) build 03'
    version: "2",
    type: "p",
    id: "6bpz2xOwq9eCG9ZZzF4P0LMoydo89lgJg2TkJFvZvKx",
    key: "GxQ6at56Lv1p8V8AFZqQZur4MEKyiZzEMFpiyPnZYv0",
    actualSize: 247612,
    verification: "8117233191337661625",
    fileName: "384.iife.js",
    shardServer: "https://shard.3.8.4.land",
    lastModified: 1701294057573
    // // '2.0.0 (pre) build 02'
    // "version": "2",
    // "type": "p",
    // "id": "dkB8uvB7Sh49L5unSh81YPALE0j1lAH0FHt1DyCOMf0",
    // "key": "p1HZ2pGJoNZ5kimwGNuAVi9qwniVbipuq1Mvm8eOZTW",
    // "actualSize": 48055,
    // "verification": "2786953871388969929",
    // "fileName": "snackabra.min.js",
    // "dateAndTime": "2023-11-05T04:59:22.006Z",
    // "fileType": "text/javascript",
    // "lastModified": 1699160331210,
    // "shardServer": "https://shard.3.8.4.land"
    // // we need to keep some old copies ... for bootstrap debugging
    // // '1.1.24 build 02'
    // version: "1",
    // type: "p",
    // id: "e_XZgkn6bpmxMXLXd_wn-Xl8ZZzFYrXNDgLTV9Ow4KY",
    // key: "JzII-03YYCf0lu43ySWZ2a4Z8nDuGb_eHN-T9UiUOis",
    // verification: "121034925793945795"
    // "version": "1",
    // "type": "p",
    // "id": "fIyzdNScN7MCv58GS5tTmIJCFcR2g3j4qn6Otw8QqW4",
    // "key": "uZAr9ozF92rhRijlFIci-Aobosh6yMGRVWjrB8osyRw",
    // "actualSize": 40142,
    // "verification": "48906636302226264130",
    // "fileName": "snackabra.min.js",
    // "dateAndTime": "2023-04-24T22:00:25.952Z",
    // "fileType": "text/javascript",
    // "lastModified": 1682373567992
  };
  console.log("[boot.loadshard] ++++ Using the following shard to load the library: ", jsLib);
  return loadLibraryCode(jsLib);
}

// src/boot/tld.ts
var singleTLDs = /* @__PURE__ */ new Set([
  "localhost",
  "io",
  "dev",
  "app",
  "land",
  "ac",
  "lk",
  "cc",
  "com",
  "net",
  "org",
  "jp",
  "de",
  "fr",
  "br",
  "it",
  "ru",
  "es",
  "me",
  "gov",
  "pl",
  "ca",
  "in",
  "nl",
  "edu",
  "eu",
  "ch",
  "id",
  "at",
  "kr",
  "cz",
  "mx",
  "be",
  "se",
  "tr",
  "tw",
  "al",
  "ua",
  "ir",
  "vn",
  "cl",
  "sk",
  "to",
  "no",
  "fi",
  "us",
  "pt",
  "dk",
  "ar",
  "hu",
  "tk",
  "gr",
  "il",
  "sg",
  "ru"
]);
var tldsWithSLDs = {
  "uk": ["co", "ac", "gov", "org", "net"],
  "au": ["com", "net", "org", "edu", "gov"],
  "nz": ["co", "org", "net", "edu", "gov", "ac", "gen", "kiwi", "maori"],
  "br": ["com", "net", "org", "gov", "edu", "mil"],
  "jp": ["co", "ac", "go", "or", "ne"],
  "kr": ["co", "go", "ne", "or", "re"],
  "ar": ["com", "net", "org", "gov", "edu", "mil"],
  "il": ["co", "ac", "org", "net", "gov"],
  "sg": ["com", "net", "org", "gov", "edu", "per"]
};
var ipv4Regex = /^\d{1,3}(\.\d{1,3}){3}$/;
function getDomainDetails(hostname = globalThis.location?.hostname ?? null) {
  const errorResult = { baseDomain: null, subdomain: null, port: null };
  if (!hostname) {
    console.error("[getDomainDeatils] cannot read location");
    return errorResult;
  }
  const parts = hostname.split(".").reverse();
  if (parts.length === 0) {
    console.error("[getDomainDeatils] cannot parse location");
    return errorResult;
  }
  const topLevel = parts[0];
  const port = globalThis.location?.port ?? null;
  if (parts.length === 1) {
    if (topLevel === "localhost") {
      return { baseDomain: hostname, subdomain: null, port };
    } else {
      console.error("[getDomainDeatils] singleton TLD not on allowed list");
      return errorResult;
    }
  }
  if (ipv4Regex.test(parts.slice(0, 4).reverse().join("."))) {
    const baseDomain2 = parts.slice(0, 4).reverse().join(".");
    const subdomain2 = parts.length > 4 ? parts.slice(4).reverse().join(".") : null;
    return { baseDomain: baseDomain2, subdomain: subdomain2, port: port ?? null };
  }
  let baseDomain = null;
  let subdomain = null;
  if (topLevel === "localhost") {
    baseDomain = parts.slice(0, 1).reverse().join(".");
    subdomain = parts.slice(1).reverse().join(".") || null;
  } else if (singleTLDs.has(topLevel)) {
    baseDomain = parts.slice(0, 2).reverse().join(".");
    subdomain = parts.slice(2).reverse().join(".") || null;
  } else {
    if (parts.length < 3) {
      return { baseDomain: null, subdomain: null, port };
    }
    const secondLevel = parts[1];
    const slds = tldsWithSLDs[topLevel];
    if (slds && slds.includes(secondLevel)) {
      baseDomain = parts.slice(0, 3).reverse().join(".");
      subdomain = parts.slice(3).reverse().join(".") || null;
    } else {
      console.error("[getDomainDeatils] unknown TLD");
      return errorResult;
    }
  }
  return { baseDomain, subdomain, port };
}

// src/boot/loaderLoader.ts
var SKIP_OBSERVE = false;
var SKIP_SCAN = false;
if (SKIP_OBSERVE)
  console.warn("==== BootstrapLoader: 1. MutationObserver disabled (make sure this is not production)");
if (SKIP_SCAN)
  console.warn("==== BootstrapLoader: 2. Immediate and repeated scans disabled (make sure this is not production)");
var bootstrapLoaderClass = class {
  DEBUG;
  // enable for detailed countermeasure logging
  baseDomain;
  // the base domain of where we are being served from
  subdomain;
  // the subdomain of the app (if any)
  port;
  // the port of the app
  // "we" are the loader loader; here is current loader:
  loaderShard;
  reportScans = 0;
  // don't report for ever
  // we try to make sure that we ourselves aren't blocked
  securedTimeout = window.setTimeout.bind(window);
  disconnectObserver;
  tagScan = () => {
    if (SKIP_SCAN)
      return;
    const scriptTags = document.querySelectorAll("script");
    for (let i = 0; i < scriptTags.length; i++) {
      if (scriptTags[i].src) {
        if (scriptTags[i].src.startsWith("blob:")) {
          if (this.DEBUG)
            console.log(`==== BootstrapLoader (immediate scan): Allowing (blob) script tag: ${scriptTags[i].src}`);
        } else {
          const url = new URL(scriptTags[i].src);
          if (!url) {
            console.warn(`==== BootstrapLoader (immediate scan): Removing external script tag (failed to parse it). Tried sourcing: ${scriptTags[i].src}`);
            scriptTags[i].remove;
          } else {
            const { baseDomain } = getDomainDetails();
            if (baseDomain === this.baseDomain) {
              if (this.DEBUG)
                console.log(`==== BootstrapLoader (immediate scan): Allowing (hosted) script tag: ${scriptTags[i].src}`);
            } else {
              console.warn(`==== BootstrapLoader (immediate scan): Removing external script tag. Tried sourcing: ${scriptTags[i].src}`);
              scriptTags[i].remove;
            }
          }
        }
      }
    }
  };
  timedScan = () => {
    this.tagScan();
    queueMicrotask(() => this.tagScan());
    this.reportScans++;
    if (this.reportScans < 10)
      this.securedTimeout(this.timedScan, 100);
    else if (this.reportScans < 20)
      this.securedTimeout(this.timedScan, 1e3);
    else if (this.DEBUG)
      console.log("==== BootstrapLoader (scan): Stopping regular scans for external script tags.");
  };
  removeExternalScripts = () => {
    this.securedTimeout(this.timedScan, 0);
    if (SKIP_OBSERVE)
      return () => {
      };
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeName === "SCRIPT" && node instanceof HTMLScriptElement) {
              if (node.src) {
                console.warn(`==== BootstrapLoader (MutationObserver): Removing external script tag. Tried sourcing: ${node.src}`);
                node.remove();
                const newScript = document.createElement("script");
                newScript.setAttribute("sb384counterMeasure", "blocked");
                for (const attr of node.attributes) {
                  if (attr.name !== "src") {
                    newScript.setAttribute(attr.name, attr.value);
                  }
                }
                mutation.target.appendChild(newScript);
              } else if (this.DEBUG) {
                console.log(`==== BootstrapLoader (MutationObserver): Allowing script tag: ${node.innerHTML.slice(0, 300)}...`);
              }
            }
          });
        }
      });
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    return () => observer.disconnect();
  };
  // the third and last line of defense is "monkey patched scorched earth":
  // we know the code in this loader loader employs no timers or event 
  // listeners, so we block anything like that. this does not catch
  // everything, there are obscure corners like performance monitors
  // and web sockets that we don't look for (yet).
  scorchedEarth = () => {
    if (this.DEBUG)
      console.log("==== BootstrapLoader: SCORCHED EARTH");
    class LogAttemptMutationObserver {
      observe(_target, _options) {
        logAttempt("MutationObserver");
      }
      disconnect() {
      }
      takeRecords() {
        return [];
      }
    }
    const originals = {
      addEventListener: window.addEventListener.bind(window),
      setTimeout: window.setTimeout.bind(window),
      setInterval: window.setInterval.bind(window),
      MutationObserver: window.MutationObserver,
      dispatchEvent: window.dispatchEvent.bind(window)
    };
    const logAttempt = (methodName) => {
      console.warn(`==== BootstrapLoader: Attempted to use "${methodName}" during scorched earth period (blocked).`);
      return -1;
    };
    window.addEventListener = () => logAttempt("addEventListener");
    window.setTimeout = () => logAttempt("setTimeout");
    window.setInterval = () => logAttempt("setInterval");
    window.MutationObserver = LogAttemptMutationObserver;
    window.dispatchEvent = function(event) {
      logAttempt("dispatchEvent");
      console.log(event);
      return true;
    };
    let restoreWebApi = () => {
      this.tagScan();
      window.addEventListener = originals.addEventListener;
      window.setTimeout = originals.setTimeout;
      window.setInterval = originals.setInterval;
      window.dispatchEvent = originals.dispatchEvent;
      window.MutationObserver = originals.MutationObserver;
      if (this.DEBUG)
        console.log("==== BootstrapLoader: Original methods restored");
    };
    if (this.DEBUG)
      console.log("==== BootstrapLoader: LOADING the loader");
    loadShard(this.loaderShard).then((decrypted) => {
      if (this.DEBUG)
        console.log("==== [END] BootstrapLoader: LOADING the loader");
      restoreWebApi();
      this.disconnectObserver();
      queueMicrotask(() => this.tagScan());
      document.open();
      document.write(new TextDecoder("utf-8").decode(decrypted));
      document.close();
      console.log("==== [END] BootstrapLoader: done, handing over to loader");
    }).catch(() => {
      document.body.style.visibility = "visible";
    });
  };
  constructor(loaderShard, debug = false) {
    this.DEBUG = debug;
    this.loaderShard = loaderShard;
    const { baseDomain, subdomain, port } = getDomainDetails();
    if (!baseDomain) {
      throw new Error("unable to determine base domain");
    }
    if (this.DEBUG) {
      console.log("==== BootstrapLoader: domain details:");
      console.log({ baseDomain, subdomain, port });
    }
    this.baseDomain = baseDomain;
    this.subdomain = subdomain;
    this.port = port;
    document.body.style.visibility = "hidden";
    console.log("==== [BEGIN] BootstrapLoader: starting");
    if (this.DEBUG)
      console.log("==== BootstrapLoader: 3. Debug logging enabled");
    if (this.DEBUG)
      console.log("==== BootstrapLoader: starting countermeasures");
    this.tagScan();
    queueMicrotask(() => this.tagScan());
    this.disconnectObserver = this.removeExternalScripts();
    this.scorchedEarth();
    if (this.DEBUG)
      console.log("==== ALL DONE ... ");
  }
};

// src/boot/serviceWorker.ts
var DEBUG = true;
var DEBUG2 = true;
var serverPrefix;
if (window.location) {
  serverPrefix = window.location.protocol + "//" + window.location.host;
  if (DEBUG2)
    console.log("[SBServiceWorker] serverPrefix: ", serverPrefix);
} else {
  serverPrefix = void 0;
}
var SBServiceWorker = class {
  sb384cachePromise;
  sbfs;
  serviceWorkerReadyPromise;
  constructor(sbfs) {
    this.sbfs = sbfs;
    this.sb384cachePromise = caches.open("sb384cache");
    this.serviceWorkerReadyPromise = new Promise((resolve, reject) => {
      this.setupServiceWorker().then(() => {
        console.log("[SBServiceWorker] ++++ service worker setup complete");
        resolve();
      }).catch((err) => {
        console.error("[SBServiceWorker] Error setting up service worker: " + err);
        reject(err);
      });
    });
  }
  async setupServiceWorker() {
    console.log("[SBServiceWorker] ++++ setting up file helper service worker");
    try {
      if ("serviceWorker" in navigator) {
        await navigator.serviceWorker.register("service-worker.js");
        if (DEBUG)
          console.log("[SBServiceWorker] ++++ Service Worker registered");
        navigator.serviceWorker.addEventListener("message", function(event) {
          if (DEBUG)
            console.log("[SBServiceWorker] ++++ Service worker event: " + event.data);
        });
      }
    } catch (e) {
      console.log("[SBServiceWorker] Error registering service worker: " + e);
    }
  }
  // ToDo: alternatively we should be messaging the service worker with the
  //       metadata and then have the service worker fetch the data from the
  //       server (and cache it) only upon request. perhaps that should be a
  //       separate interface (eg cacheResourceDeferred());
  async cacheResource(fileName, mimeType, handle) {
    await this.serviceWorkerReadyPromise;
    if (fileName === "/service-worker.js") {
      console.log("[SBServiceWorker] **** special override: self-virtualizing service worker (/service-worker.js)");
      return Promise.resolve();
    }
    if (fileName === "/index.html") {
      console.log("[SBServiceWorker] **** special override: index.html can also be accessed as '/'");
      await this.cacheResource("/", mimeType, handle);
    }
    if (DEBUG)
      console.log(`[SBServiceWorker] Caching resource '${fileName}' mimeType '${mimeType}' with handle '${handle}'`);
    const cache = await this.sb384cachePromise;
    if (!cache) {
      console.error("[SBServiceWorker] cache is null ... cannot cache any resources");
      return Promise.resolve();
    }
    this.sbfs.server.storage.fetchData(handle).then((arrayBuffer) => {
      const response = new Response(arrayBuffer, {
        status: 200,
        // this part seems to be browser/OS dependent
        headers: { "Content-Type": mimeType }
      });
      cache.put(fileName, response);
    }).catch((err) => {
      console.error(`[SBServiceWorker] Error fetching data for handle ${handle}: ${err}`);
    });
  }
  // // older approach, when being tested from inside multifile handler (where a globalbuffer map was available)
  // async cacheResource(fileName: string, uniqueShardId: string, mimeType: string, bufferMap: Map<any, any>): Promise<void> {
  //     if (!serviceWorkerFunctional) {
  //         console.error("service worker is not operational")
  //         return Promise.resolve();
  //     }
  //     if (fileName === "/service-worker.js" /* fileName.endsWith("service-worker.js") */) {
  //         console.log("**** special override: self-virtualizing service worker (/service-worker.js)")
  //         return Promise.resolve();
  //     }
  //     if (fileName === "/index.html") {
  //         console.log("**** special override: index.html can also be accessed as '/'")
  //         await this.cacheResource("/", uniqueShardId, mimeType, bufferMap);
  //     }
  //     if (DEBUG) console.log(`Caching resource '${fileName}' with uniqueShardId '${uniqueShardId}' and mimeType '${mimeType}'`);
  //     const cache = (await this.sb384cachePromise);
  //     let arrayBuffer = bufferMap.get(uniqueShardId);
  //     // Create a Response object with the ArrayBuffer and MIME type
  //     const response = new Response(arrayBuffer, {
  //         status: 200, // this part seems to be browser/OS dependent
  //         headers: { 'Content-Type': mimeType },
  //     });
  //     // Add the Response to the cache using the file name as the key
  //     await cache!.put(fileName, response);
  // }
};

// src/boot/index.ts
var boot = {
  loadShard,
  bootstrapJsLib,
  boostrapLoaderClass: bootstrapLoaderClass,
  getDomainDetails,
  serviceWorker: SBServiceWorker
};

// src/crypto/strongpin.ts
var base62mi05 = "0123456789ADMRTXQjrEyWCLBdHpNufk";
var base622 = base62mi05;
var base62Regex2 = new RegExp(`^[${base622}]{4}$`);
async function generateStrongPin(extraEntropy) {
  if (extraEntropy && extraEntropy.length > 0) {
    throw new Error("Not supported yet");
  }
  const num = Math.floor(Math.random() * Math.pow(2, 19));
  const encoded = encode(num);
  return { num, encoded };
}
async function generateStrongPin16() {
  return (await Promise.all(Array(4).fill(null).map(() => generateStrongPin()))).map((result) => result.encoded).join(" ");
}
function encode(num) {
  const charMap = base622;
  if (num < 0 || num > 524287)
    throw new Error("Input number is out of range. Expected a 19-bit integer.");
  let bitsArr15 = [
    num >> 14 & 31,
    num >> 9 & 31,
    num >> 4 & 31,
    num & 15
  ];
  bitsArr15[3] |= (bitsArr15[0] ^ bitsArr15[1] ^ bitsArr15[2]) & 16;
  return bitsArr15.map((val) => charMap[val]).join("");
}
function process(str) {
  const substitutions = {
    // deliberately overly clear mapping
    "o": "0",
    "O": "0",
    "i": "1",
    "I": "1",
    "l": "1",
    "z": "2",
    "Z": "2",
    "s": "5",
    "S": "5",
    "b": "6",
    "c": "C",
    "m": "M",
    "P": "p",
    "a": "9",
    "g": "9",
    "q": "9",
    "t": "T",
    "V": "u",
    "v": "u",
    "x": "X",
    "J": "j",
    "e": "E",
    "F": "f",
    "Y": "y",
    "w": "W",
    "h": "N",
    "n": "N",
    "G": "6",
    "K": "k",
    "U": "u"
  };
  let processedStr = "";
  for (let char of str)
    processedStr += substitutions[char] || char;
  return processedStr;
}
function decode(encoded) {
  if (!base62Regex2.test(encoded))
    throw new Error(`Input string contains invalid characters (${encoded}).`);
  let bin = Array.from(encoded).map((c) => base622.indexOf(c));
  if (bin.reduce((a, b) => a ^ b) & 16)
    return null;
  return ((bin[0] * 32 + bin[1]) * 32 + bin[2]) * 16 + (bin[3] & 15);
}

// src/crypto/index.ts
var crypto2 = {
  strongpin: {
    encode,
    decode,
    generate: generateStrongPin,
    generate16: generateStrongPin16,
    process
    // font: strongpinFont,
  },
  sbCrypto: new SBCrypto(),
  getRandomValues
};

// src/strongphrase/strongphrase.ts
var DEBUG22 = false;
var SUGGESTED_PHRASE_LENGTH = 3;
var PBKDF2_10M_ITERATIONS = 10 * 1e3 * 1e3;
async function generatePassPhrase(params) {
  let extraEntropy;
  let words;
  const RND_BUFFER_SIZE = 32;
  const MAX_WORDS = 16;
  const WORD_LIST_SIZE_LN2 = 14;
  const WORD_LIST_SIZE = 2 ** WORD_LIST_SIZE_LN2;
  if (typeof params === "string") {
    extraEntropy = params;
  } else if (typeof params === "number") {
    words = params;
  } else if (params) {
    extraEntropy = params.extraEntropy;
    words = params.words;
  }
  if (!words || words < 1)
    words = SUGGESTED_PHRASE_LENGTH;
  if (words > MAX_WORDS)
    throw new Error(`Too many words requested, max is ${MAX_WORDS}.`);
  if (words16K_v03.length !== WORD_LIST_SIZE)
    throw new Error("Word list is not the expected size (16x1024).");
  const randomValues = window.crypto.getRandomValues(new Uint8Array(RND_BUFFER_SIZE));
  let entropySource = randomValues;
  if (extraEntropy) {
    const encoder = new TextEncoder();
    const extraEntropyHash = await window.crypto.subtle.digest("SHA-256", encoder.encode(extraEntropy));
    const combinedEntropySource = new Uint8Array([...randomValues, ...new Uint8Array(extraEntropyHash)]);
    entropySource = new Uint8Array(await window.crypto.subtle.digest("SHA-256", combinedEntropySource));
  }
  const indices = new Uint16Array(entropySource.buffer);
  const passphrase = Array.from(indices, (i) => words16K_v03[i & WORD_LIST_SIZE - 1]).slice(0, words).join(" ");
  return passphrase;
}
async function generateStrongKey(passphrase) {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  if (!passphrase)
    passphrase = await generatePassPhrase(SUGGESTED_PHRASE_LENGTH);
  return await _generateKey(passphrase, salt, PBKDF2_10M_ITERATIONS);
}
async function recreateStrongKey(passphrase, salt, iterations) {
  return await _generateKey(passphrase, salt, iterations);
}
async function _generateKey(passphrase, salt, iterations) {
  const encoder = new TextEncoder();
  const passphraseKey = encoder.encode(passphrase);
  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    passphraseKey,
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
  const strongKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations,
      hash: "SHA-256"
    },
    baseKey,
    // You can define the specifics of your derived key
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  const returnKey = {
    phrase: passphrase,
    key: strongKey,
    salt,
    iterations
  };
  if (DEBUG22) {
    console.log("Strong key generated: ");
    console.log(returnKey);
  }
  return returnKey;
}
var words16K_v03 = [
  "that",
  "this",
  "have",
  "they",
  "what",
  "from",
  "there",
  "about",
  "know",
  "just",
  "said",
  "like",
  "will",
  "when",
  "more",
  "people",
  "right",
  "time",
  "could",
  "into",
  "going",
  "other",
  "then",
  "because",
  "yeah",
  "these",
  "want",
  "good",
  "also",
  "over",
  "only",
  "come",
  "very",
  "even",
  "first",
  "where",
  "most",
  "make",
  "down",
  "much",
  "those",
  "many",
  "okay",
  "take",
  "before",
  "need",
  "such",
  "little",
  "work",
  "still",
  "never",
  "last",
  "year",
  "world",
  "life",
  "around",
  "tell",
  "mean",
  "between",
  "state",
  "thing",
  "both",
  "same",
  "long",
  "another",
  "great",
  "three",
  "again",
  "each",
  "school",
  "home",
  "love",
  "help",
  "away",
  "thought",
  "doing",
  "find",
  "sure",
  "give",
  "used",
  "always",
  "better",
  "since",
  "next",
  "today",
  "night",
  "thank",
  "place",
  "during",
  "kind",
  "maybe",
  "best",
  "anything",
  "found",
  "must",
  "family",
  "point",
  "left",
  "sorry",
  "talk",
  "percent",
  "nothing",
  "head",
  "under",
  "city",
  "feel",
  "keep",
  "public",
  "high",
  "country",
  "social",
  "enough",
  "call",
  "room",
  "believe",
  "mother",
  "until",
  "face",
  "once",
  "hand",
  "please",
  "case",
  "system",
  "million",
  "group",
  "father",
  "course",
  "number",
  "game",
  "real",
  "someone",
  "woman",
  "health",
  "getting",
  "small",
  "water",
  "news",
  "name",
  "second",
  "change",
  "business",
  "power",
  "door",
  "story",
  "often",
  "data",
  "team",
  "company",
  "question",
  "book",
  "among",
  "problem",
  "later",
  "hard",
  "already",
  "wait",
  "making",
  "person",
  "together",
  "young",
  "side",
  "morning",
  "play",
  "example",
  "program",
  "able",
  "become",
  "open",
  "almost",
  "behind",
  "table",
  "live",
  "start",
  "else",
  "human",
  "john",
  "early",
  "five",
  "whole",
  "history",
  "across",
  "remember",
  "idea",
  "mind",
  "process",
  "wrong",
  "season",
  "rather",
  "police",
  "control",
  "although",
  "general",
  "girl",
  "everyone",
  "body",
  "leave",
  "party",
  "line",
  "large",
  "pretty",
  "child",
  "light",
  "office",
  "music",
  "nice",
  "move",
  "level",
  "fine",
  "order",
  "food",
  "front",
  "stay",
  "matter",
  "either",
  "moment",
  "toward",
  "future",
  "local",
  "area",
  "sense",
  "issue",
  "hope",
  "anyone",
  "possible",
  "baby",
  "voice",
  "taking",
  "turn",
  "reason",
  "close",
  "half",
  "deal",
  "student",
  "friend",
  "inside",
  "major",
  "federal",
  "service",
  "gone",
  "street",
  "myself",
  "market",
  "hair",
  "sort",
  "guess",
  "bring",
  "post",
  "gave",
  "provide",
  "figure",
  "security",
  "heart",
  "outside",
  "cause",
  "tonight",
  "bush",
  "wife",
  "hold",
  "model",
  "south",
  "north",
  "report",
  "phone",
  "thus",
  "above",
  "ready",
  "soon",
  "media",
  "special",
  "watch",
  "couple",
  "tried",
  "available",
  "current",
  "evidence",
  "energy",
  "goes",
  "view",
  "happy",
  "science",
  "stuff",
  "field",
  "alone",
  "space",
  "easy",
  "middle",
  "photo",
  "town",
  "hello",
  "month",
  "result",
  "vote",
  "park",
  "answer",
  "present",
  "common",
  "certain",
  "road",
  "west",
  "interest",
  "upon",
  "herself",
  "similar",
  "practice",
  "cost",
  "nature",
  "force",
  "test",
  "sound",
  "short",
  "include",
  "series",
  "brought",
  "congress",
  "language",
  "strong",
  "risk",
  "near",
  "check",
  "agree",
  "list",
  "physical",
  "nation",
  "share",
  "project",
  "video",
  "culture",
  "film",
  "action",
  "private",
  "position",
  "blood",
  "learn",
  "miss",
  "total",
  "floor",
  "economy",
  "industry",
  "earth",
  "record",
  "stand",
  "green",
  "truth",
  "movie",
  "brother",
  "wall",
  "rate",
  "fall",
  "board",
  "increase",
  "husband",
  "forward",
  "ahead",
  "kept",
  "defense",
  "return",
  "price",
  "note",
  "window",
  "effects",
  "response",
  "walk",
  "summer",
  "focus",
  "blue",
  "paper",
  "average",
  "east",
  "type",
  "beyond",
  "quality",
  "daughter",
  "step",
  "design",
  "coach",
  "blog",
  "tomorrow",
  "final",
  "hour",
  "staff",
  "drive",
  "ability",
  "race",
  "simple",
  "section",
  "access",
  "entire",
  "cold",
  "various",
  "century",
  "subject",
  "mouth",
  "chief",
  "begin",
  "page",
  "speak",
  "author",
  "brown",
  "consider",
  "minute",
  "choice",
  "review",
  "write",
  "cool",
  "doctor",
  "anyway",
  "senator",
  "offer",
  "excuse",
  "seven",
  "legal",
  "amount",
  "main",
  "sleep",
  "giving",
  "huge",
  "theory",
  "impact",
  "success",
  "worth",
  "friday",
  "perfect",
  "hurt",
  "onto",
  "range",
  "stopped",
  "online",
  "crazy",
  "sitting",
  "welcome",
  "trade",
  "wish",
  "picture",
  "size",
  "below",
  "eight",
  "sister",
  "shut",
  "sign",
  "piece",
  "june",
  "term",
  "member",
  "allow",
  "follow",
  "cover",
  "image",
  "worry",
  "save",
  "judge",
  "march",
  "source",
  "hospital",
  "trust",
  "effort",
  "heat",
  "original",
  "saturday",
  "kitchen",
  "expect",
  "pass",
  "spend",
  "union",
  "july",
  "forget",
  "smile",
  "safe",
  "build",
  "hate",
  "glass",
  "message",
  "popular",
  "river",
  "account",
  "anybody",
  "skin",
  "debate",
  "honey",
  "trouble",
  "dinner",
  "send",
  "address",
  "daily",
  "ball",
  "credit",
  "region",
  "caught",
  "goal",
  "afraid",
  "october",
  "army",
  "budget",
  "club",
  "text",
  "search",
  "anymore",
  "visit",
  "senior",
  "unless",
  "peace",
  "primary",
  "female",
  "version",
  "civil",
  "leader",
  "sample",
  "drink",
  "scene",
  "funny",
  "april",
  "income",
  "fish",
  "chair",
  "shown",
  "material",
  "favorite",
  "monday",
  "brain",
  "network",
  "explain",
  "property",
  "nuclear",
  "degree",
  "song",
  "tuesday",
  "freedom",
  "marriage",
  "basic",
  "wonder",
  "stage",
  "lady",
  "scale",
  "develop",
  "base",
  "rich",
  "spring",
  "fresh",
  "coffee",
  "clean",
  "september",
  "opinion",
  "bottom",
  "stock",
  "hundred",
  "title",
  "choose",
  "radio",
  "claim",
  "survey",
  "rule",
  "negative",
  "rose",
  "capital",
  "normal",
  "island",
  "easily",
  "letter",
  "dream",
  "surface",
  "wide",
  "trial",
  "purpose",
  "suggest",
  "sell",
  "direct",
  "protect",
  "weekend",
  "yesterday",
  "pull",
  "measure",
  "mass",
  "thursday",
  "remain",
  "seat",
  "appear",
  "labor",
  "amazing",
  "camera",
  "museum",
  "method",
  "tree",
  "alive",
  "trip",
  "patient",
  "plus",
  "shoulder",
  "grow",
  "secret",
  "firm",
  "style",
  "avoid",
  "strategy",
  "edge",
  "gold",
  "heavy",
  "quick",
  "charge",
  "neither",
  "travel",
  "enjoy",
  "produce",
  "captain",
  "gender",
  "hotel",
  "task",
  "round",
  "sweet",
  "track",
  "apple",
  "afternoon",
  "require",
  "truly",
  "correct",
  "hill",
  "actual",
  "ship",
  "catch",
  "annual",
  "screen",
  "moral",
  "vice",
  "lake",
  "benefit",
  "drop",
  "glad",
  "quiet",
  "beach",
  "filled",
  "empty",
  "memory",
  "ride",
  "card",
  "january",
  "tiny",
  "release",
  "google",
  "reform",
  "warm",
  "dance",
  "garden",
  "reduce",
  "speed",
  "rise",
  "grew",
  "neck",
  "improve",
  "slow",
  "raise",
  "prison",
  "winter",
  "extra",
  "battle",
  "august",
  "receive",
  "salt",
  "spot",
  "ended",
  "foot",
  "worst",
  "library",
  "spirit",
  "code",
  "mountain",
  "distance",
  "exercise",
  "regular",
  "broken",
  "join",
  "throw",
  "machine",
  "carry",
  "stone",
  "chest",
  "desk",
  "aware",
  "demand",
  "camp",
  "wear",
  "identify",
  "crowd",
  "magazine",
  "artist",
  "target",
  "paying",
  "novel",
  "decide",
  "gotten",
  "notice",
  "link",
  "smart",
  "cook",
  "path",
  "advice",
  "surprise",
  "cash",
  "email",
  "twice",
  "guard",
  "snow",
  "solution",
  "spread",
  "unique",
  "bright",
  "faculty",
  "train",
  "urban",
  "dress",
  "uncle",
  "lucky",
  "eating",
  "truck",
  "dude",
  "evil",
  "planet",
  "weather",
  "square",
  "decade",
  "wild",
  "damage",
  "supreme",
  "prevent",
  "mention",
  "host",
  "animal",
  "teach",
  "obvious",
  "master",
  "december",
  "push",
  "balance",
  "useful",
  "file",
  "agent",
  "exist",
  "initial",
  "soft",
  "finish",
  "victory",
  "rain",
  "tired",
  "birth",
  "youth",
  "nose",
  "wine",
  "digital",
  "moon",
  "shop",
  "suit",
  "option",
  "sugar",
  "valley",
  "border",
  "exchange",
  "lunch",
  "core",
  "clip",
  "jury",
  "domestic",
  "lying",
  "forest",
  "unit",
  "equal",
  "boat",
  "plenty",
  "yellow",
  "apart",
  "owner",
  "democracy",
  "stick",
  "wake",
  "double",
  "tall",
  "visual",
  "traffic",
  "coast",
  "proud",
  "soul",
  "busy",
  "weird",
  "famous",
  "mistake",
  "wood",
  "village",
  "cross",
  "guide",
  "self",
  "flight",
  "quarter",
  "aside",
  "ring",
  "chicken",
  "voting",
  "till",
  "shirt",
  "ladies",
  "waste",
  "horse",
  "theater",
  "laugh",
  "universe",
  "ensure",
  "gain",
  "smoke",
  "barely",
  "plastic",
  "sport",
  "pair",
  "february",
  "sight",
  "taste",
  "remove",
  "stuck",
  "reference",
  "match",
  "gift",
  "supply",
  "farm",
  "blame",
  "boss",
  "pattern",
  "super",
  "fuel",
  "object",
  "wedding",
  "fault",
  "carefully",
  "silver",
  "indicate",
  "mama",
  "reaction",
  "seek",
  "feature",
  "metal",
  "enter",
  "twenty",
  "user",
  "ought",
  "usual",
  "describe",
  "buddy",
  "parent",
  "argue",
  "beauty",
  "magic",
  "click",
  "twitter",
  "device",
  "shift",
  "bunch",
  "golf",
  "assume",
  "finger",
  "achieve",
  "drew",
  "draw",
  "bridge",
  "calm",
  "silent",
  "ancient",
  "kiss",
  "tool",
  "flat",
  "drove",
  "typical",
  "occur",
  "quote",
  "rising",
  "display",
  "print",
  "meat",
  "orange",
  "admit",
  "rural",
  "accident",
  "pepper",
  "pool",
  "length",
  "grace",
  "solar",
  "vehicle",
  "giant",
  "fashion",
  "crew",
  "estate",
  "treat",
  "tape",
  "amendment",
  "jump",
  "faster",
  "struggle",
  "suspect",
  "cream",
  "reflect",
  "rice",
  "rare",
  "jimmy",
  "afford",
  "cheese",
  "album",
  "topic",
  "milk",
  "hurry",
  "cognitive",
  "ocean",
  "grant",
  "aunt",
  "mirror",
  "solid",
  "limit",
  "copy",
  "episode",
  "outcome",
  "chapter",
  "bird",
  "acts",
  "transfer",
  "affected",
  "facing",
  "numerous",
  "airport",
  "promote",
  "loud",
  "awesome",
  "flying",
  "attitude",
  "darkness",
  "vast",
  "conduct",
  "upper",
  "frame",
  "danger",
  "strike",
  "pink",
  "upset",
  "stadium",
  "panel",
  "brand",
  "relief",
  "emphasis",
  "category",
  "injury",
  "diet",
  "jersey",
  "gulf",
  "dust",
  "client",
  "joke",
  "escape",
  "wealth",
  "coat",
  "alright",
  "grass",
  "santa",
  "brief",
  "mobile",
  "circle",
  "encourage",
  "alcohol",
  "feed",
  "noise",
  "wave",
  "stairs",
  "advance",
  "engine",
  "plate",
  "document",
  "purchase",
  "sudden",
  "zone",
  "crying",
  "draft",
  "resource",
  "unable",
  "quit",
  "engage",
  "anger",
  "tone",
  "festival",
  "element",
  "latter",
  "motion",
  "gore",
  "decline",
  "chosen",
  "deeply",
  "pregnant",
  "talent",
  "hidden",
  "express",
  "armed",
  "stomach",
  "spokesman",
  "session",
  "winner",
  "landscape",
  "sauce",
  "narrow",
  "duty",
  "error",
  "bike",
  "capable",
  "fruit",
  "grab",
  "actor",
  "rush",
  "lesson",
  "bread",
  "sing",
  "journey",
  "avenue",
  "butter",
  "steel",
  "kick",
  "route",
  "volume",
  "turkey",
  "minimum",
  "cycle",
  "electric",
  "yard",
  "detail",
  "gaze",
  "holiday",
  "trend",
  "theme",
  "cheap",
  "mixture",
  "roof",
  "junior",
  "cute",
  "relax",
  "asleep",
  "witness",
  "iron",
  "jacket",
  "prepare",
  "carbon",
  "skill",
  "mixed",
  "sand",
  "sentence",
  "shadow",
  "fifth",
  "manage",
  "dean",
  "disagree",
  "unusual",
  "hero",
  "hungry",
  "replace",
  "anxiety",
  "height",
  "prefer",
  "zero",
  "creek",
  "smooth",
  "proof",
  "iphone",
  "innocent",
  "mail",
  "juice",
  "item",
  "split",
  "aspect",
  "crucial",
  "cable",
  "arrest",
  "attend",
  "aids",
  "recall",
  "swear",
  "fiction",
  "ticket",
  "pacific",
  "update",
  "index",
  "shock",
  "desert",
  "profit",
  "nurse",
  "thirty",
  "math",
  "minor",
  "substance",
  "dirt",
  "loan",
  "monitor",
  "entry",
  "cloud",
  "hence",
  "savings",
  "ending",
  "awful",
  "angle",
  "reveal",
  "boots",
  "comfort",
  "ongoing",
  "gate",
  "fiscal",
  "sheriff",
  "ordinary",
  "stir",
  "deliver",
  "bone",
  "solve",
  "fiber",
  "license",
  "olympic",
  "portion",
  "cried",
  "random",
  "navy",
  "cake",
  "select",
  "shame",
  "lift",
  "ignore",
  "exact",
  "garlic",
  "pilot",
  "marine",
  "ultimate",
  "shaking",
  "veteran",
  "gallery",
  "sake",
  "wheel",
  "define",
  "citizen",
  "hunt",
  "inner",
  "maximum",
  "liberty",
  "lock",
  "fool",
  "swing",
  "unknown",
  "rough",
  "switch",
  "foster",
  "upstairs",
  "royal",
  "illness",
  "logic",
  "wisdom",
  "column",
  "corn",
  "repeat",
  "prayer",
  "plot",
  "sheet",
  "riding",
  "clock",
  "efficient",
  "drama",
  "stable",
  "suffer",
  "ceiling",
  "pride",
  "mystery",
  "obtain",
  "brilliant",
  "knee",
  "couch",
  "oven",
  "curious",
  "deputy",
  "earn",
  "belt",
  "expand",
  "palm",
  "frozen",
  "analyst",
  "dating",
  "champion",
  "phrase",
  "slept",
  "menu",
  "sequence",
  "dynamic",
  "cousin",
  "knock",
  "essay",
  "gear",
  "discover",
  "elite",
  "rescue",
  "load",
  "silly",
  "ugly",
  "flash",
  "wash",
  "scope",
  "deck",
  "olive",
  "kingdom",
  "dawn",
  "muscle",
  "domain",
  "priority",
  "divorce",
  "twelve",
  "evaluate",
  "soldier",
  "dining",
  "depth",
  "ethics",
  "involve",
  "vital",
  "rapid",
  "motor",
  "tower",
  "virus",
  "burden",
  "hire",
  "deer",
  "flag",
  "tank",
  "rely",
  "chase",
  "combine",
  "trick",
  "prize",
  "fame",
  "wing",
  "baking",
  "monster",
  "lawsuit",
  "wolf",
  "retail",
  "salad",
  "remind",
  "connect",
  "pitch",
  "atlantic",
  "alien",
  "payment",
  "wire",
  "colonial",
  "layer",
  "forum",
  "concert",
  "whoever",
  "wise",
  "fence",
  "enhance",
  "recipe",
  "tissue",
  "bench",
  "dish",
  "dole",
  "soccer",
  "badly",
  "wound",
  "pause",
  "darling",
  "uniform",
  "glance",
  "settle",
  "chef",
  "empirical",
  "brush",
  "broadcast",
  "ghost",
  "chronic",
  "pentagon",
  "valid",
  "fantasy",
  "garage",
  "lemon",
  "frequent",
  "disorder",
  "mutual",
  "rent",
  "humor",
  "climb",
  "liquid",
  "auto",
  "arrive",
  "affair",
  "seed",
  "diabetes",
  "convince",
  "powder",
  "fitness",
  "penalty",
  "label",
  "heritage",
  "candy",
  "deny",
  "stole",
  "yield",
  "collect",
  "fortune",
  "pope",
  "extend",
  "jeans",
  "mortality",
  "tail",
  "duke",
  "stem",
  "decrease",
  "implement",
  "virtual",
  "inquiry",
  "jazz",
  "soup",
  "delay",
  "assist",
  "awake",
  "abstract",
  "pizza",
  "galaxy",
  "predict",
  "sixth",
  "boost",
  "midnight",
  "burst",
  "gospel",
  "cabin",
  "android",
  "shell",
  "craft",
  "gradually",
  "poem",
  "spatial",
  "racing",
  "ipad",
  "opera",
  "onion",
  "actress",
  "cotton",
  "slip",
  "lyrics",
  "utility",
  "rookie",
  "depend",
  "ideology",
  "eliminate",
  "bacteria",
  "inch",
  "gather",
  "coping",
  "input",
  "tobacco",
  "exit",
  "judicial",
  "refuse",
  "horror",
  "sacred",
  "robin",
  "differ",
  "scheme",
  "anchor",
  "lawn",
  "slide",
  "backed",
  "arena",
  "invest",
  "trash",
  "failing",
  "output",
  "wage",
  "clay",
  "dried",
  "exhibit",
  "genius",
  "acid",
  "beef",
  "bullet",
  "flavor",
  "enable",
  "eager",
  "abroad",
  "biology",
  "clinic",
  "panic",
  "mask",
  "aging",
  "script",
  "embrace",
  "permit",
  "sword",
  "elevator",
  "lily",
  "grip",
  "nominee",
  "lonely",
  "tennis",
  "slight",
  "eligible",
  "gentle",
  "ranch",
  "globe",
  "tube",
  "glory",
  "chip",
  "banking",
  "insane",
  "blade",
  "essence",
  "venture",
  "spin",
  "boring",
  "outdoor",
  "density",
  "fancy",
  "timing",
  "carol",
  "brave",
  "rally",
  "cliff",
  "repair",
  "fabric",
  "saint",
  "flower",
  "tackle",
  "habit",
  "amid",
  "endless",
  "symbol",
  "spell",
  "spare",
  "immune",
  "alert",
  "ridge",
  "rope",
  "garbage",
  "harbor",
  "guilt",
  "piano",
  "guitar",
  "myth",
  "alpha",
  "shed",
  "genuine",
  "observe",
  "excess",
  "alarm",
  "segment",
  "faint",
  "ritual",
  "gravity",
  "width",
  "blanket",
  "manual",
  "drank",
  "oxygen",
  "bitter",
  "pound",
  "oxford",
  "mouse",
  "cruise",
  "attract",
  "chaos",
  "tent",
  "rail",
  "crystal",
  "duration",
  "chemicals",
  "luxury",
  "cure",
  "trigger",
  "comic",
  "wrap",
  "praise",
  "ranked",
  "upcoming",
  "mandate",
  "breeze",
  "emerge",
  "purse",
  "punch",
  "twin",
  "cave",
  "swept",
  "salmon",
  "canyon",
  "feminist",
  "gesture",
  "cloth",
  "reward",
  "phoenix",
  "monetary",
  "castle",
  "swung",
  "rifle",
  "regret",
  "silk",
  "swim",
  "rage",
  "hockey",
  "precise",
  "outer",
  "buffalo",
  "submit",
  "grocery",
  "divide",
  "emotion",
  "invite",
  "skirt",
  "census",
  "tiger",
  "wrist",
  "grill",
  "spray",
  "miracle",
  "patch",
  "resist",
  "tunnel",
  "brick",
  "tactics",
  "poet",
  "confirm",
  "palace",
  "shoe",
  "crop",
  "custom",
  "glow",
  "caring",
  "bath",
  "thumb",
  "rival",
  "sadly",
  "pipe",
  "grief",
  "hood",
  "neutral",
  "liability",
  "pension",
  "genre",
  "install",
  "margin",
  "barn",
  "legend",
  "clause",
  "outlook",
  "stimulus",
  "bless",
  "awkward",
  "harsh",
  "carpet",
  "dragon",
  "jealous",
  "lens",
  "folk",
  "alike",
  "diamond",
  "romance",
  "patrol",
  "adjust",
  "mercy",
  "tribe",
  "curve",
  "parade",
  "tightly",
  "cluster",
  "cattle",
  "critic",
  "skull",
  "nerve",
  "whisper",
  "fluid",
  "alley",
  "trap",
  "casual",
  "rocket",
  "rubber",
  "snake",
  "usage",
  "duck",
  "toss",
  "useless",
  "gorgeous",
  "pork",
  "basket",
  "detect",
  "vertical",
  "scare",
  "hint",
  "blast",
  "clever",
  "pastor",
  "bubble",
  "twist",
  "athlete",
  "rhythm",
  "snap",
  "penny",
  "premium",
  "syndrome",
  "eaten",
  "delta",
  "tomato",
  "dutch",
  "tshirt",
  "slice",
  "unfair",
  "pole",
  "dose",
  "fork",
  "dignity",
  "elegant",
  "grain",
  "lazy",
  "medal",
  "skiing",
  "geography",
  "harvest",
  "ruined",
  "orbit",
  "arise",
  "canvas",
  "blend",
  "inform",
  "aged",
  "urge",
  "leaf",
  "negotiate",
  "eternal",
  "cage",
  "upgrade",
  "damp",
  "aluminum",
  "tragic",
  "alter",
  "barrel",
  "acquire",
  "liar",
  "bonus",
  "verdict",
  "envelope",
  "ecosystem",
  "blinked",
  "viable",
  "chat",
  "disk",
  "spoon",
  "pulse",
  "filter",
  "molecular",
  "laptop",
  "laundry",
  "fever",
  "toast",
  "stunned",
  "shallow",
  "boil",
  "pardon",
  "potato",
  "elaborate",
  "monkey",
  "ambitious",
  "roster",
  "atop",
  "hatred",
  "elbow",
  "varying",
  "municipal",
  "fossil",
  "ashamed",
  "ecology",
  "lecture",
  "salvation",
  "flip",
  "fled",
  "filing",
  "oppose",
  "quantum",
  "wagon",
  "robot",
  "nail",
  "loop",
  "upward",
  "lion",
  "lamp",
  "doll",
  "rude",
  "cart",
  "impose",
  "infant",
  "merry",
  "pond",
  "noble",
  "hammer",
  "purely",
  "cruel",
  "retention",
  "shrimp",
  "soap",
  "vocal",
  "bulk",
  "reluctant",
  "vessel",
  "borrow",
  "waving",
  "sunny",
  "clerk",
  "retreat",
  "curled",
  "matrix",
  "junk",
  "rack",
  "uncertain",
  "notable",
  "absent",
  "fraction",
  "drill",
  "wheat",
  "asset",
  "helmet",
  "ninth",
  "cherry",
  "tray",
  "sunset",
  "stack",
  "stove",
  "spouse",
  "buzz",
  "autism",
  "shine",
  "surge",
  "theft",
  "poison",
  "squeeze",
  "bacon",
  "soda",
  "abruptly",
  "sustain",
  "grid",
  "jungle",
  "tide",
  "loyal",
  "nest",
  "denial",
  "approve",
  "aisle",
  "ginger",
  "glimpse",
  "diagram",
  "gaming",
  "hybrid",
  "amber",
  "lung",
  "eagle",
  "cape",
  "shield",
  "semester",
  "epic",
  "exotic",
  "educate",
  "ruby",
  "ladder",
  "scout",
  "curse",
  "parish",
  "plaza",
  "radar",
  "emperor",
  "thee",
  "fatal",
  "casino",
  "outfit",
  "crisp",
  "warfare",
  "fabulous",
  "rabbit",
  "employ",
  "curtain",
  "robust",
  "imperial",
  "unhappy",
  "vague",
  "absurd",
  "ankle",
  "astronomy",
  "enforce",
  "intact",
  "warrior",
  "gambling",
  "flame",
  "debris",
  "pledge",
  "retire",
  "petition",
  "taxi",
  "announce",
  "trim",
  "wipe",
  "bucket",
  "hydrogen",
  "trembling",
  "behave",
  "apology",
  "scan",
  "grove",
  "crush",
  "puzzle",
  "auction",
  "cope",
  "abandon",
  "fold",
  "hollow",
  "adapt",
  "waking",
  "satisfy",
  "tourist",
  "vacuum",
  "yoga",
  "sculpture",
  "sphere",
  "illusion",
  "cargo",
  "juvenile",
  "dock",
  "canal",
  "vintage",
  "bean",
  "arrange",
  "silicon",
  "copper",
  "ambulance",
  "harmful",
  "bust",
  "brass",
  "blah",
  "arctic",
  "pending",
  "autumn",
  "icon",
  "caution",
  "slim",
  "epidemic",
  "fragile",
  "mankind",
  "calcium",
  "merit",
  "pencil",
  "dilemma",
  "moisture",
  "steak",
  "elder",
  "swift",
  "despair",
  "whale",
  "lance",
  "tweet",
  "aide",
  "humble",
  "thunder",
  "bicycle",
  "payroll",
  "algorithm",
  "marathon",
  "bargain",
  "unlimited",
  "twilight",
  "inspire",
  "dioxide",
  "wool",
  "tuition",
  "herbs",
  "rebel",
  "subway",
  "halt",
  "upright",
  "organ",
  "sadness",
  "pill",
  "plug",
  "marble",
  "coke",
  "sierra",
  "buyer",
  "mansion",
  "audit",
  "echo",
  "triumph",
  "bronze",
  "hawk",
  "onset",
  "pouring",
  "boxing",
  "clarify",
  "robe",
  "rebuild",
  "timothy",
  "widow",
  "fatigue",
  "diary",
  "cosmic",
  "coin",
  "sank",
  "expose",
  "setup",
  "outrage",
  "fade",
  "synthesis",
  "edit",
  "spike",
  "dairy",
  "upside",
  "gown",
  "sponsor",
  "float",
  "maid",
  "baked",
  "arrow",
  "seldom",
  "crane",
  "catalog",
  "sneak",
  "neatly",
  "lounge",
  "elephant",
  "drift",
  "grinning",
  "bachelor",
  "dusk",
  "empathy",
  "pumpkin",
  "guts",
  "urging",
  "goat",
  "cancel",
  "antique",
  "cinema",
  "donate",
  "petty",
  "trophy",
  "punk",
  "neglect",
  "tooth",
  "roast",
  "outbreak",
  "peanut",
  "whip",
  "plausible",
  "drained",
  "veto",
  "monument",
  "yogurt",
  "armor",
  "kidney",
  "hull",
  "drum",
  "asthma",
  "balcony",
  "obscure",
  "slot",
  "daylight",
  "slender",
  "shaft",
  "shaping",
  "parsley",
  "unaware",
  "donor",
  "awhile",
  "aviation",
  "timber",
  "dismiss",
  "utter",
  "pioneer",
  "tattoo",
  "velocity",
  "limb",
  "immense",
  "absorb",
  "naive",
  "misery",
  "peculiar",
  "dodge",
  "clown",
  "arbitrary",
  "parole",
  "majesty",
  "runner",
  "evolve",
  "glue",
  "frost",
  "ozone",
  "lining",
  "syrup",
  "gossip",
  "melt",
  "sage",
  "cane",
  "rigid",
  "impulse",
  "erosion",
  "ferry",
  "maple",
  "picnic",
  "void",
  "dash",
  "glove",
  "burger",
  "crawl",
  "skies",
  "vivid",
  "trio",
  "cinnamon",
  "oval",
  "velvet",
  "banana",
  "axis",
  "indoor",
  "fury",
  "enduring",
  "barbecue",
  "glare",
  "prone",
  "eats",
  "wikipedia",
  "slate",
  "cement",
  "blouse",
  "salon",
  "lure",
  "snack",
  "knelt",
  "puppy",
  "caucus",
  "feast",
  "gratitude",
  "dial",
  "turtle",
  "mold",
  "wizard",
  "lend",
  "visa",
  "yahoo",
  "proximity",
  "bartender",
  "bolt",
  "viral",
  "slam",
  "thigh",
  "stamp",
  "drone",
  "cathedral",
  "venue",
  "sketch",
  "garnish",
  "coherent",
  "stool",
  "foil",
  "gazing",
  "delete",
  "bounce",
  "aggregate",
  "lunar",
  "dubbed",
  "chop",
  "zombie",
  "thrive",
  "sanctuary",
  "dislike",
  "nephew",
  "modify",
  "eclipse",
  "polar",
  "badge",
  "foam",
  "arose",
  "monopoly",
  "panama",
  "amused",
  "banner",
  "shone",
  "fading",
  "petroleum",
  "runway",
  "fidelity",
  "verify",
  "maturity",
  "unwilling",
  "ashes",
  "spider",
  "rumor",
  "navigate",
  "blunt",
  "preacher",
  "gleaming",
  "attach",
  "refined",
  "bunny",
  "cedar",
  "tapping",
  "ample",
  "nickname",
  "daisy",
  "vista",
  "coral",
  "ribbon",
  "reunion",
  "jeep",
  "tipped",
  "outward",
  "exile",
  "chunk",
  "resemble",
  "envy",
  "umbrella",
  "unrelated",
  "cough",
  "flock",
  "vacant",
  "parlor",
  "masculine",
  "uranium",
  "obstacle",
  "ditch",
  "stubborn",
  "poker",
  "naming",
  "coconut",
  "unstable",
  "exclude",
  "affiliate",
  "module",
  "reps",
  "semantic",
  "crept",
  "chewing",
  "bats",
  "cannon",
  "psychic",
  "hazard",
  "unwanted",
  "ethanol",
  "ragged",
  "prolonged",
  "sturdy",
  "ivory",
  "trinity",
  "factual",
  "ipod",
  "dime",
  "bundle",
  "riot",
  "apostle",
  "diner",
  "culinary",
  "lucrative",
  "emission",
  "turf",
  "nebula",
  "ramp",
  "juror",
  "demise",
  "shrug",
  "unsure",
  "ninja",
  "turmoil",
  "rotten",
  "stellar",
  "imminent",
  "cozy",
  "disbelief",
  "vowed",
  "scrap",
  "rehab",
  "vigorous",
  "tile",
  "uneasy",
  "dentist",
  "endorse",
  "dove",
  "symptom",
  "fringe",
  "amnesty",
  "scoop",
  "cilantro",
  "xbox",
  "altitude",
  "batch",
  "vest",
  "volatile",
  "liking",
  "itunes",
  "apron",
  "raven",
  "shove",
  "fetch",
  "napkin",
  "heap",
  "nanny",
  "jelly",
  "dwarf",
  "suburb",
  "quilt",
  "scam",
  "clash",
  "regain",
  "cache",
  "humming",
  "abnormal",
  "frantic",
  "dizzy",
  "nineteen",
  "exemption",
  "popcorn",
  "cloak",
  "bulb",
  "unison",
  "herald",
  "laurel",
  "paycheck",
  "elusive",
  "celery",
  "cabbage",
  "thickness",
  "kinship",
  "stereo",
  "vegan",
  "onstage",
  "dictator",
  "angrily",
  "anyhow",
  "dipped",
  "reckless",
  "seminar",
  "darn",
  "niece",
  "frown",
  "trilogy",
  "daunting",
  "hesitate",
  "salsa",
  "trivial",
  "boxer",
  "swell",
  "ounce",
  "surround",
  "pony",
  "unseen",
  "rogue",
  "saga",
  "pyramid",
  "marvelous",
  "tying",
  "wrath",
  "voyage",
  "rover",
  "gigantic",
  "scotch",
  "sesame",
  "friction",
  "hypocrisy",
  "baggage",
  "diminish",
  "curator",
  "affluent",
  "coma",
  "stew",
  "rinse",
  "zoning",
  "ebay",
  "upscale",
  "exhaust",
  "vendor",
  "jaws",
  "woven",
  "violin",
  "oops",
  "daytime",
  "citation",
  "glucose",
  "drown",
  "geometry",
  "agony",
  "rebound",
  "alto",
  "carnival",
  "obedience",
  "hush",
  "pulmonary",
  "cavalry",
  "purity",
  "unhealthy",
  "refrain",
  "awoke",
  "anatomy",
  "unpopular",
  "estrogen",
  "java",
  "lumber",
  "lavender",
  "poking",
  "perennial",
  "clutch",
  "uninsured",
  "neon",
  "skeleton",
  "shack",
  "parmesan",
  "dumping",
  "chevy",
  "splendid",
  "reproduce",
  "avid",
  "geek",
  "pueblo",
  "dice",
  "scroll",
  "sedan",
  "tilt",
  "sway",
  "mule",
  "hamlet",
  "grape",
  "jasmine",
  "tavern",
  "raging",
  "deed",
  "upheld",
  "cube",
  "disregard",
  "cone",
  "nutrient",
  "oppressed",
  "suing",
  "crimson",
  "humility",
  "choking",
  "walnut",
  "rash",
  "foyer",
  "oyster",
  "swan",
  "perpetual",
  "query",
  "font",
  "zoom",
  "slogan",
  "frenzy",
  "yeast",
  "vascular",
  "derby",
  "harness",
  "upload",
  "pajamas",
  "trunks",
  "phantom",
  "carving",
  "drastic",
  "staple",
  "uneven",
  "flap",
  "unchanged",
  "anthem",
  "mushroom",
  "gluten",
  "exquisite",
  "drizzle",
  "asparagus",
  "irregular",
  "bleak",
  "proactive",
  "sloppy",
  "cortex",
  "spur",
  "womb",
  "exodus",
  "lent",
  "obsolete",
  "grazing",
  "almighty",
  "lantern",
  "salute",
  "atom",
  "hefty",
  "bony",
  "polo",
  "floral",
  "glacier",
  "raft",
  "deploy",
  "guru",
  "enroll",
  "kosher",
  "mutation",
  "sibling",
  "revolt",
  "ouch",
  "brewing",
  "alibi",
  "amino",
  "blazing",
  "falcon",
  "hacking",
  "flint",
  "baton",
  "depict",
  "gamma",
  "aspirin",
  "nylon",
  "pediatric",
  "broom",
  "acre",
  "sabbath",
  "glamorous",
  "turbine",
  "extinct",
  "unsafe",
  "quake",
  "bamboo",
  "bolster",
  "groom",
  "flick",
  "mantra",
  "hastily",
  "graffiti",
  "pavilion",
  "rust",
  "mundane",
  "bluff",
  "uphill",
  "sediment",
  "enzyme",
  "sermon",
  "coronary",
  "blizzard",
  "uncover",
  "bash",
  "ebook",
  "avalanche",
  "slapping",
  "cadillac",
  "perjury",
  "unpaid",
  "dazzling",
  "cavity",
  "freight",
  "capsule",
  "disgrace",
  "crib",
  "unfold",
  "empower",
  "blush",
  "clone",
  "motto",
  "sizable",
  "uphold",
  "plywood",
  "tidy",
  "tidal",
  "cider",
  "disdain",
  "bonding",
  "dominion",
  "gothic",
  "envision",
  "nerd",
  "splashed",
  "ominous",
  "manor",
  "unlawful",
  "dotted",
  "subgroup",
  "taps",
  "outing",
  "mosaic",
  "eccentric",
  "nurture",
  "cupped",
  "sitcom",
  "mashed",
  "immortal",
  "demeanor",
  "abide",
  "sushi",
  "rethink",
  "sinister",
  "stench",
  "brethren",
  "unnatural",
  "multiply",
  "pagan",
  "cylinder",
  "karma",
  "bogus",
  "unequal",
  "halves",
  "rumble",
  "claw",
  "paced",
  "monastery",
  "expire",
  "outgoing",
  "garment",
  "stumble",
  "await",
  "deacon",
  "morbidity",
  "mummy",
  "ceramics",
  "citrus",
  "untouched",
  "evoke",
  "stout",
  "pesticide",
  "duplicate",
  "frying",
  "cradle",
  "lavish",
  "siren",
  "crescent",
  "frail",
  "dagger",
  "mute",
  "vineyard",
  "pupil",
  "pulp",
  "corporal",
  "latitude",
  "voltage",
  "abdominal",
  "junction",
  "rearview",
  "diaper",
  "moaning",
  "skype",
  "stash",
  "paddle",
  "putt",
  "fetal",
  "eggplant",
  "diploma",
  "pouch",
  "evacuate",
  "haunt",
  "slab",
  "deity",
  "thud",
  "slacks",
  "upbeat",
  "varsity",
  "lizard",
  "skipping",
  "mating",
  "dart",
  "kitten",
  "elastic",
  "debtor",
  "catfish",
  "vanish",
  "kudos",
  "immature",
  "smashing",
  "luminous",
  "maverick",
  "hamburger",
  "sarcasm",
  "shudder",
  "poppy",
  "goofy",
  "murky",
  "dwelling",
  "usable",
  "taco",
  "diocese",
  "slit",
  "mahogany",
  "sublime",
  "ascertain",
  "licking",
  "wiring",
  "nicotine",
  "brittle",
  "aroma",
  "swarm",
  "subtly",
  "unnoticed",
  "enlarged",
  "brunch",
  "sniff",
  "duct",
  "rhyme",
  "skyline",
  "snoring",
  "smuggling",
  "mango",
  "sludge",
  "onboard",
  "cascade",
  "botanical",
  "vantage",
  "safari",
  "fascism",
  "hurdle",
  "grunt",
  "cucumber",
  "armchair",
  "avatar",
  "wrought",
  "skewed",
  "unethical",
  "chlorine",
  "casket",
  "usher",
  "angular",
  "mural",
  "sulfur",
  "prenatal",
  "enrich",
  "latch",
  "tainted",
  "parcel",
  "hash",
  "tutor",
  "hulk",
  "apache",
  "stiffness",
  "colt",
  "untrue",
  "plural",
  "bobbing",
  "algebra",
  "tanned",
  "clad",
  "capped",
  "slashed",
  "wifi",
  "setback",
  "kettle",
  "ludicrous",
  "grit",
  "calorie",
  "tumble",
  "ultra",
  "entail",
  "pang",
  "obnoxious",
  "goggles",
  "mulch",
  "delusion",
  "giggle",
  "sagging",
  "unspoken",
  "utmost",
  "caliber",
  "sprung",
  "morse",
  "cricket",
  "slain",
  "jolt",
  "embody",
  "dugout",
  "payday",
  "sabotage",
  "thorn",
  "ignition",
  "defy",
  "shabby",
  "crook",
  "culprit",
  "dimly",
  "skeptic",
  "antarctic",
  "omega",
  "subdued",
  "swirl",
  "reopen",
  "palpable",
  "rewrite",
  "cactus",
  "bloated",
  "craving",
  "guise",
  "panther",
  "wrench",
  "jogging",
  "ripple",
  "getaway",
  "jolly",
  "finch",
  "reclaim",
  "shuffle",
  "dolphin",
  "fanning",
  "uptown",
  "voucher",
  "rosy",
  "rift",
  "ebony",
  "rigor",
  "espionage",
  "brim",
  "nutmeg",
  "caravan",
  "coauthor",
  "gloss",
  "omission",
  "hurled",
  "giddy",
  "manned",
  "payer",
  "whiff",
  "helium",
  "bribe",
  "manifesto",
  "uncanny",
  "geology",
  "janitor",
  "ridden",
  "hazy",
  "envoy",
  "jockey",
  "comrade",
  "cheddar",
  "imitate",
  "robbing",
  "afloat",
  "elves",
  "anew",
  "oasis",
  "prowess",
  "agile",
  "augmented",
  "onward",
  "kung",
  "blatantly",
  "flanked",
  "erratic",
  "cubicle",
  "muzzle",
  "seismic",
  "groin",
  "sullen",
  "hassle",
  "utopia",
  "shawl",
  "eloquent",
  "freckles",
  "trolling",
  "serpent",
  "siding",
  "glitter",
  "grueling",
  "wand",
  "dwindling",
  "kite",
  "diligence",
  "rake",
  "polymer",
  "annex",
  "feeble",
  "banish",
  "icing",
  "reuse",
  "denote",
  "emit",
  "payback",
  "curfew",
  "parrot",
  "blitz",
  "relocate",
  "mower",
  "cassette",
  "cork",
  "slug",
  "stitch",
  "uptake",
  "linoleum",
  "unbiased",
  "sinner",
  "huddle",
  "plutonium",
  "enclosure",
  "wiry",
  "acorn",
  "flyer",
  "chubby",
  "smirk",
  "reputable",
  "myspace",
  "edgy",
  "plow",
  "lucid",
  "espresso",
  "roaming",
  "dosage",
  "dill",
  "swipe",
  "rectangle",
  "yarn",
  "saline",
  "lagoon",
  "balsamic",
  "barley",
  "sled",
  "rejoice",
  "coliseum",
  "gutter",
  "pancake",
  "clatter",
  "frivolous",
  "wavy",
  "enchanted",
  "clamp",
  "borough",
  "remnant",
  "duffel",
  "whomever",
  "gulp",
  "lagged",
  "opium",
  "subprime",
  "idly",
  "bulge",
  "onslaught",
  "tummy",
  "frayed",
  "cadmium",
  "morphine",
  "plethora",
  "ferocious",
  "tweak",
  "rink",
  "rambling",
  "satchel",
  "desolate",
  "pecan",
  "unmarked",
  "arson",
  "esquire",
  "faucet",
  "aptly",
  "coil",
  "perish",
  "yummy",
  "clump",
  "flirt",
  "chute",
  "frighten",
  "crouch",
  "buggy",
  "python",
  "aloft",
  "brute",
  "murmuring",
  "pebble",
  "quail",
  "badass",
  "rupture",
  "manpower",
  "quadrant",
  "jingle",
  "savor",
  "sliver",
  "manly",
  "rebirth",
  "fervor",
  "unruly",
  "expulsion",
  "flop",
  "ravine",
  "fiddle",
  "ditto",
  "engraved",
  "jargon",
  "seizing",
  "muck",
  "manhood",
  "entourage",
  "shrank",
  "panda",
  "nectar",
  "recreate",
  "paternal",
  "spied",
  "veal",
  "acutely",
  "karate",
  "lego",
  "mammal",
  "ploy",
  "atypical",
  "shredder",
  "purge",
  "marlin",
  "exalted",
  "deem",
  "waltz",
  "enamel",
  "dedicate",
  "unwelcome",
  "hangover",
  "cofounder",
  "celtic",
  "aptitude",
  "daycare",
  "deafening",
  "creole",
  "rabid",
  "kinetic",
  "emblem",
  "whoops",
  "mayday",
  "lash",
  "duchess",
  "unlucky",
  "cadet",
  "upfront",
  "deprive",
  "acclaim",
  "nutty",
  "ammonia",
  "conjure",
  "rarity",
  "fondly",
  "jumbo",
  "lanky",
  "joyous",
  "extortion",
  "douche",
  "juggling",
  "simmering",
  "lark",
  "huff",
  "mumbling",
  "enigmatic",
  "rundown",
  "visor",
  "eradicate",
  "paprika",
  "debit",
  "paparazzi",
  "uplifting",
  "canine",
  "tucking",
  "duly",
  "fang",
  "edging",
  "uproar",
  "epiphany",
  "afar",
  "deftly",
  "hunk",
  "maroon",
  "bleep",
  "pungent",
  "embark",
  "staunch",
  "cupcake",
  "pamphlet",
  "cobalt",
  "whimsical",
  "audacity",
  "wreath",
  "evade",
  "wrinkle",
  "dimmed",
  "grimace",
  "cringe",
  "nutshell",
  "wilt",
  "neuron",
  "unsolved",
  "fanatic",
  "macaroni",
  "tinker",
  "gauze",
  "rickety",
  "pesky",
  "wasp",
  "pessimism",
  "slang",
  "veggie",
  "unworthy",
  "phosphate",
  "unquote",
  "ricotta",
  "snagged",
  "elongated",
  "grudge",
  "sprout",
  "fleshy",
  "synopsis",
  "thaw",
  "derail",
  "drab",
  "calamity",
  "skid",
  "sanitary",
  "lazily",
  "xerox",
  "lair",
  "snout",
  "onscreen",
  "yiddish",
  "evasion",
  "smog",
  "porous",
  "shrouded",
  "bagel",
  "sheath",
  "unicorn",
  "secluded",
  "itinerary",
  "coexist",
  "stalemate",
  "astute",
  "sift",
  "pluck",
  "suction",
  "yanking",
  "bruising",
  "esteemed",
  "rebate",
  "dingy",
  "widget",
  "oncoming",
  "exuberant",
  "wobbly",
  "prelude",
  "bonfire",
  "tingling",
  "nape",
  "clover",
  "chug",
  "dyslexia",
  "prozac",
  "mutt",
  "quiver",
  "scuba",
  "jinx",
  "easel",
  "serotonin",
  "endanger",
  "jarring",
  "wharf",
  "waffle",
  "ajar",
  "twig",
  "mace",
  "pelvis",
  "banter",
  "pruning",
  "nimble",
  "anemia",
  "limelight",
  "seduce",
  "ligament",
  "anaerobic",
  "wolverine",
  "cryptic",
  "lurch",
  "kerosene",
  "boasting",
  "panorama",
  "babbling",
  "umpire",
  "creme",
  "fanfare",
  "posh",
  "jukebox",
  "enquirer",
  "limping",
  "unbroken",
  "iodine",
  "deflation",
  "risotto",
  "hazing",
  "idiocy",
  "goliath",
  "unbeaten",
  "zebra",
  "rants",
  "omit",
  "tarmac",
  "dork",
  "dormitory",
  "skimmed",
  "feisty",
  "stoic",
  "arming",
  "crux",
  "oxidation",
  "mournful",
  "swoop",
  "saffron",
  "fender",
  "cola",
  "pried",
  "gimmick",
  "maggot",
  "grumbling",
  "deduct",
  "fedora",
  "sassy",
  "swagger",
  "agnostic",
  "obituary",
  "slum",
  "gong",
  "rind",
  "nemesis",
  "nifty",
  "erupt",
  "gullible",
  "awry",
  "mowing",
  "snitch",
  "woof",
  "sizzling",
  "wince",
  "yelp",
  "broiler",
  "irritable",
  "retorted",
  "alias",
  "bovine",
  "shimmer",
  "scowling",
  "earring",
  "bonnet",
  "molasses",
  "sneeze",
  "ruse",
  "zeppelin",
  "canteen",
  "ether",
  "unskilled",
  "reiterate",
  "spew",
  "hamper",
  "doable",
  "scorpion",
  "almanac",
  "daybreak",
  "legislate",
  "skyward",
  "swivel",
  "earshot",
  "outage",
  "tiring",
  "tulip",
  "jokingly",
  "aloof",
  "donut",
  "wistful",
  "churn",
  "dares",
  "turret",
  "cleft",
  "blot",
  "tantrum",
  "outnumber",
  "epilepsy",
  "baritone",
  "italics",
  "atrium",
  "askew",
  "dandy",
  "hatchet",
  "wannabe",
  "fable",
  "reshape",
  "opal",
  "linguini",
  "viper",
  "uptight",
  "wispy",
  "hypnotic",
  "sash",
  "dorsal",
  "sultry",
  "blob",
  "shun",
  "glaucoma",
  "greyhound",
  "luster",
  "raking",
  "unnerving",
  "unscathed",
  "unmoving",
  "evaporate",
  "quack",
  "flaring",
  "lukewarm",
  "fraternal",
  "smudge",
  "bogged",
  "dilute",
  "banjo",
  "splurge",
  "gauntlet",
  "lilac",
  "awning",
  "nautical",
  "baffling",
  "varnish",
  "kleenex",
  "bonanza",
  "upturned",
  "amigo",
  "scapegoat",
  "snarl",
  "anyplace",
  "otter",
  "lapel",
  "panhandle",
  "whiny",
  "kangaroo",
  "unwrapped",
  "renounce",
  "alkaline",
  "aqua",
  "siberian",
  "omen",
  "etching",
  "bluish",
  "rigging",
  "flier",
  "celibacy",
  "kilometer",
  "saxophone",
  "undress",
  "alfalfa",
  "peddling",
  "dainty",
  "smitten",
  "blip",
  "elated",
  "unplanned",
  "paltry",
  "dribble",
  "geriatric",
  "unholy",
  "unproven",
  "hermit",
  "litmus",
  "synergy",
  "schilling",
  "silt",
  "mutiny",
  "mardi",
  "wimp",
  "drool",
  "peroxide",
  "tint",
  "payable",
  "reggae",
  "unending",
  "clang",
  "floss",
  "atrocious",
  "detonate",
  "malt",
  "rimmed",
  "sizing",
  "hamster",
  "chirping",
  "tabby",
  "roulette",
  "humvee",
  "destitute",
  "unfunded",
  "crock",
  "lard",
  "catwalk",
  "shush",
  "swab",
  "gaffe",
  "scolding",
  "ladle",
  "trifle",
  "unkind",
  "deport",
  "lapping",
  "jigsaw",
  "surname",
  "snuff",
  "fructose",
  "resale",
  "leggings",
  "feline",
  "zealous",
  "jalapeno",
  "cuddle",
  "amiss",
  "kimono",
  "napping",
  "cusp",
  "chump",
  "thong",
  "amiable",
  "isotope",
  "rascal",
  "reptile",
  "clunky",
  "unopened",
  "caddie",
  "unkempt",
  "quirk",
  "wick",
  "romp",
  "surcharge",
  "zodiac",
  "raider",
  "shank",
  "aghast",
  "glazing",
  "kennel",
  "perky",
  "slush",
  "gusto",
  "camcorder",
  "stipend",
  "knapsack",
  "gurgling",
  "reimburse",
  "flaky",
  "preheated",
  "blissful",
  "yonder",
  "roving",
  "reaffirm",
  "amulet",
  "aloha",
  "movable",
  "chowder",
  "untapped",
  "cinch",
  "nugget",
  "groggy",
  "detract",
  "vibes",
  "gills",
  "ablaze",
  "musket",
  "cupid",
  "tycoon",
  "deuce",
  "umbilical",
  "tubular",
  "pout",
  "jittery",
  "truffle",
  "knoll",
  "femur",
  "flaxseed",
  "haphazard",
  "folic",
  "defuse",
  "livable",
  "trespass",
  "ointment",
  "magma",
  "nibble",
  "appointee",
  "frisbee",
  "afoot",
  "pelt",
  "dissuade",
  "deodorant",
  "sphinx",
  "euphemism",
  "affront",
  "pelican",
  "sauna",
  "rudder",
  "vengeful",
  "reappear",
  "chihuahua",
  "reheat",
  "gondola",
  "rewind",
  "flounder",
  "labrador",
  "licorice",
  "abrasive",
  "mossy",
  "smock",
  "abreast",
  "hemlock",
  "tibia",
  "polka",
  "gibberish",
  "drudge",
  "ooze",
  "lurk",
  "volley",
  "outhouse",
  "magenta",
  "velcro",
  "sycamore",
  "irate",
  "crayon",
  "poplar",
  "wafer",
  "cobbler",
  "darwinism",
  "phobia",
  "tiara",
  "barometer",
  "rename",
  "baguette",
  "enslave",
  "wham",
  "rotunda",
  "unshaven",
  "tarot",
  "grub",
  "porridge",
  "galore",
  "docile",
  "lullaby",
  "fidgeting",
  "slaw",
  "coerce",
  "gooey",
  "snugly",
  "skyrocket",
  "lint",
  "guacamole",
  "stupor",
  "frustrate",
  "snooze",
  "unafraid",
  "boxy",
  "thyself",
  "balmy",
  "hertz",
  "aloe",
  "endpoint",
  "geiger",
  "ibuprofen",
  "gory",
  "daydream",
  "kiwi",
  "taunt",
  "judo",
  "exorcism",
  "esophagus",
  "mulberry",
  "joystick",
  "unraveled",
  "froth",
  "undated",
  "snippet",
  "valuables",
  "ruckus",
  "crevice",
  "zipping",
  "dowry",
  "lubricant",
  "prewar",
  "ungodly",
  "petal",
  "scion",
  "raffle",
  "elude",
  "croak",
  "runt",
  "unjustly",
  "eskimo",
  "gush",
  "maimed",
  "clique",
  "unsigned",
  "goon",
  "elixir",
  "silo",
  "kiln",
  "plop",
  "talon",
  "oxymoron",
  "kelp",
  "dexterity",
  "pellet",
  "anvil",
  "corset",
  "scavenger",
  "twirl",
  "jugular",
  "popsicle",
  "purr",
  "fretted",
  "gopher",
  "crudely",
  "oblong",
  "scoff",
  "conical",
  "serrated",
  "tutu",
  "gangly",
  "snide",
  "ritalin",
  "stoke",
  "zips",
  "tartar",
  "duress",
  "doze",
  "dutiful",
  "earpiece",
  "dimness",
  "peso",
  "thrash",
  "jailhouse",
  "opacity",
  "subatomic",
  "imbecile",
  "venomous",
  "obtuse",
  "dimple",
  "smother",
  "viscous",
  "paging",
  "quintet",
  "mocha",
  "clench",
  "gummy",
  "chivalry",
  "dilation",
  "disengage",
  "suave",
  "icky",
  "urchin",
  "talisman",
  "upswing",
  "blighted",
  "tidbit",
  "doodle",
  "savanna",
  "bunt",
  "jubilant",
  "zoology",
  "debunk",
  "jester",
  "vanquish",
  "estimator",
  "baboon",
  "letdown",
  "rasping",
  "hula",
  "devalue",
  "mauve",
  "eject",
  "rerun",
  "rephrase",
  "porcupine",
  "reexamine",
  "ember",
  "rummage",
  "woozy",
  "cytoplasm",
  "facsimile",
  "tabasco",
  "jovial",
  "ferment",
  "wooing",
  "pogo",
  "padlock",
  "gosling",
  "swerve",
  "gleeful",
  "jaunt",
  "unadorned",
  "bungee",
  "undivided",
  "armrest",
  "marmalade",
  "gizmo",
  "lisp",
  "slinky",
  "plexiglas",
  "sinuous",
  "vixen",
  "hypertext",
  "krypton",
  "aqueduct",
  "kerchief",
  "mobster",
  "joyfully",
  "emcee",
  "aeration",
  "whacking",
  "armadillo",
  "reentry",
  "boozy",
  "excavate",
  "ripening",
  "onshore",
  "bobcat",
  "unelected",
  "yapping",
  "pawing",
  "poncho",
  "siamese",
  "albatross",
  "antsy",
  "chitchat",
  "seltzer",
  "muppet",
  "gloating",
  "hazelnut",
  "pliable",
  "onyx",
  "lather",
  "capricorn",
  "uncut",
  "aorta",
  "nastiness",
  "gander",
  "eggnog",
  "excretion",
  "exonerate",
  "cesspool",
  "purveyor",
  "mayflower",
  "busboy",
  "mulled",
  "figment",
  "girdle",
  "lethargic",
  "encrypt",
  "evict",
  "ergonomic",
  "undying",
  "culminate",
  "wriggle",
  "blemish",
  "walrus",
  "tidings",
  "germinate",
  "trowel",
  "suds",
  "ageless",
  "tarnish",
  "dejected",
  "twerp",
  "antler",
  "unguarded",
  "coleslaw",
  "synapse",
  "mongrel",
  "thwarting",
  "aground",
  "scuttle",
  "halogen",
  "ovary",
  "borax",
  "gnarly",
  "snub",
  "nacho",
  "gout",
  "papyrus",
  "iguana",
  "grope",
  "nullify",
  "kilt",
  "vindicate",
  "galvanize",
  "alabaster",
  "panning",
  "wasabi",
  "rework",
  "trombone",
  "tinsel",
  "treble",
  "prancing",
  "exes",
  "hanky",
  "blimp",
  "knickers",
  "thieving",
  "defraud",
  "briar",
  "trident",
  "upwind",
  "slouching",
  "koala",
  "tamper",
  "nuptials",
  "engulf",
  "garter",
  "barman",
  "glisten",
  "frugality",
  "earmark",
  "blubber",
  "ahoy",
  "latrine",
  "puma",
  "sepia",
  "unimpeded",
  "drapery",
  "vivacious",
  "gawk",
  "banshee",
  "nutcase",
  "gruffly",
  "ribcage",
  "rekindle",
  "cesarean",
  "unrivaled",
  "jawline",
  "vaseline",
  "quench",
  "tusk",
  "snazzy",
  "sappy",
  "pedometer",
  "unbounded",
  "tapioca",
  "bobsled",
  "cabana",
  "tubby",
  "sapling",
  "gecko",
  "flaccid",
  "unbuckled",
  "lumping",
  "humpback",
  "haiku",
  "jurist",
  "lasso",
  "urologist",
  "sputter",
  "tinfoil",
  "gutless",
  "encircle",
  "boxcar",
  "impish",
  "kooky",
  "frolic",
  "sasquatch",
  "geranium",
  "flyover",
  "schnapps",
  "cackle",
  "unaltered",
  "prude",
  "falsify",
  "matador",
  "octagon",
  "unpeeled",
  "armful",
  "reroute",
  "unfilled",
  "zesty",
  "payphone",
  "pucker",
  "unzip",
  "litigate",
  "eggshell",
  "hunchback",
  "duvet",
  "powwow",
  "spry",
  "barstool",
  "flail",
  "linseed",
  "legume",
  "mumps",
  "slurp",
  "marshy",
  "dubiously",
  "siesta",
  "unedited",
  "dastardly",
  "ogle",
  "aflame",
  "wrangle",
  "osmosis",
  "dupe",
  "reissue",
  "vagabond",
  "carmaker",
  "flogging",
  "roping",
  "ardently",
  "gnat",
  "oink",
  "sardine",
  "scurvy",
  "sulk",
  "pumice",
  "ellipse",
  "tiptoeing",
  "jiffy",
  "spiffy",
  "spud",
  "tassel",
  "petunia",
  "ashy",
  "tamer",
  "spilt",
  "legwork",
  "getup",
  "poach",
  "uncivil",
  "anaconda",
  "exfoliate",
  "pauper",
  "ramrod",
  "useable",
  "doozy",
  "cahoots",
  "oboe",
  "leotard",
  "boogeyman",
  "yippee",
  "bonsai",
  "chafe",
  "munchkin",
  "varmint",
  "ragweed",
  "sulphate",
  "earful",
  "unfeeling",
  "tamale",
  "hyphen",
  "scuff",
  "egotism",
  "outtakes",
  "abacus",
  "tarantula",
  "smelting",
  "elope",
  "urethane",
  "dayroom",
  "igloo",
  "gristle",
  "caboose",
  "opossum",
  "barcode",
  "amniotic",
  "datebook",
  "clavicle",
  "bazooka",
  "unturned",
  "dweeb",
  "scone",
  "tiling",
  "untying",
  "ritzy",
  "amicably",
  "onlooker",
  "legroom",
  "chomp",
  "spyglass",
  "unroll",
  "levitate",
  "thimble",
  "poser",
  "badness",
  "demystify",
  "pummel",
  "cabdriver",
  "henna",
  "gerbil",
  "senorita",
  "udder",
  "zookeeper",
  "laxative",
  "gigolo",
  "gating",
  "kebab",
  "joyride",
  "eardrum",
  "swaddling",
  "zigzagged",
  "ravage",
  "cussed",
  "talcum",
  "sinless",
  "trodden",
  "absinthe",
  "camisole",
  "duller",
  "daffodil",
  "pectin",
  "ream",
  "reorder",
  "tadpole",
  "omnivore",
  "disinfect",
  "rimless",
  "utensil",
  "stowing",
  "catlike",
  "bodacious",
  "skedaddle",
  "nuzzle",
  "acetone",
  "egging",
  "cubbyhole",
  "lapdog",
  "boondocks",
  "malformed",
  "busload",
  "penknife",
  "shucking",
  "egomaniac",
  "cobweb",
  "anagram",
  "smolder",
  "unexpired",
  "taekwondo",
  "fritter",
  "enrage",
  "runaround",
  "abridge",
  "exhume",
  "reattach",
  "scabby",
  "botch",
  "gargle",
  "lushly",
  "enunciate",
  "plod",
  "doily",
  "hexagon",
  "punisher",
  "tyke",
  "armband",
  "calzone",
  "unashamed",
  "tinderbox",
  "rehydrate",
  "obtrusive",
  "bauble",
  "sixfold",
  "crabbing",
  "moocher",
  "clobber",
  "unbaked",
  "rehire",
  "sudoku",
  "moodiness",
  "dicing",
  "reemerge",
  "gumball",
  "pulverize",
  "hatless",
  "endnote",
  "yodel",
  "cymbal",
  "bagpipe",
  "splotchy",
  "nanometer",
  "mollusk",
  "harpist",
  "mooing",
  "jaywalker",
  "astound",
  "ocelot",
  "hubcap",
  "frill",
  "gonad",
  "rubdown",
  "tigress",
  "denatured",
  "pegboard",
  "dehydrate",
  "gizzard",
  "waggle",
  "kinfolk",
  "unmixed",
  "ensnare",
  "buccaneer",
  "amaretto",
  "felttip",
  "jujitsu",
  "amuck",
  "bunion",
  "skydiver",
  "coeditor",
  "amperage",
  "deface",
  "riptide",
  "hatbox",
  "trekker",
  "jaybird",
  "swizzle",
  "drench",
  "jawed",
  "ditzy",
  "illicitly",
  "preoccupy",
  "vagrancy",
  "carwash",
  "earache",
  "subfloor",
  "armless",
  "ransack",
  "curdle",
  "cozily",
  "unaudited",
  "unblock",
  "catsup",
  "unframed",
  "wielder",
  "dallying",
  "catnap",
  "cosponsor",
  "boxlike",
  "aflutter",
  "wackiness",
  "unviable",
  "husked",
  "babied",
  "eclair",
  "guzzler",
  "giblet",
  "kabob",
  "unhinge",
  "upchuck",
  "coagulant",
  "bagful",
  "batboy",
  "flypaper",
  "gumdrop",
  "disfigure",
  "entwine",
  "oozy",
  "unarmored",
  "cufflink",
  "slobbery",
  "reoccupy",
  "twiddle",
  "ungraded",
  "viselike",
  "carless",
  "stegosaur",
  "coyness",
  "uncross",
  "earwig",
  "ripcord",
  "blabber",
  "retype",
  "unaired",
  "aneurism",
  "antonym",
  "unsnap",
  "eggbeater",
  "untwist",
  "cosigner",
  "racoon",
  "veneering",
  "bobtail",
  "gyration",
  "reanalyze",
  "reabsorb",
  "recharger",
  "unpicked",
  "unsworn",
  "mocker",
  "fernlike",
  "pyromania",
  "opulently",
  "outmost",
  "penpal",
  "flyable",
  "prorate",
  "eatable",
  "skittle",
  "armhole",
  "unvalued",
  "haggler",
  "vexingly",
  "unglue",
  "defog",
  "ecard",
  "dawdler",
  "delouse",
  "disjoin",
  "engorge",
  "finless",
  "lividly",
  "nutlike",
  "reawake",
  "tinwork",
  "unvocal",
  "zipfile",
  "anointer",
  "atonable",
  "cogwheel",
  "undusted",
  "unflawed",
  "unsliced",
  "unsmooth",
  "unthawed",
  "copartner",
  "hemstitch",
  "jeeringly",
  "joylessly",
  "luridness",
  "penholder",
  "subheader",
  "their",
  "would",
  "think",
  "which",
  "after",
  "years",
  "really",
  "should",
  "through",
  "something",
  "being",
  "president",
  "students",
  "while",
  "things",
  "every",
  "house",
  "might",
  "against",
  "children",
  "states",
  "women",
  "money",
  "without",
  "different",
  "though",
  "study",
  "however",
  "actually",
  "research",
  "white",
  "called",
  "looked",
  "national",
  "education",
  "important",
  "times",
  "asked",
  "wanted",
  "united",
  "trying",
  "political",
  "looking",
  "least",
  "having",
  "coming",
  "saying",
  "talking",
  "using",
  "support",
  "within",
  "including",
  "whether",
  "others",
  "community",
  "probably",
  "several",
  "working",
  "makes",
  "happened",
  "heard",
  "along",
  "himself",
  "thanks",
  "center",
  "turned",
  "america",
  "hands",
  "given",
  "started",
  "court",
  "means",
  "according",
  "friends",
  "months",
  "minutes",
  "teachers",
  "former",
  "based",
  "studies",
  "words",
  "seems",
  "comes",
  "results",
  "college",
  "economic",
  "members",
  "looks",
  "parents",
  "likely",
  "instead",
  "policy",
  "groups",
  "problems",
  "hours",
  "began",
  "needs",
  "county",
  "sometimes",
  "military",
  "issues",
  "living",
  "learning",
  "listen",
  "thinking",
  "seemed",
  "perhaps",
  "clear",
  "known",
  "taken",
  "analysis",
  "questions",
  "finally",
  "reading",
  "quite",
  "yourself",
  "clinton",
  "happen",
  "class",
  "exactly",
  "higher",
  "simply",
  "society",
  "everybody",
  "wants",
  "recent",
  "following",
  "companies",
  "programs",
  "officials",
  "campaign",
  "services",
  "personal",
  "director",
  "rights",
  "lives",
  "schools",
  "games",
  "running",
  "article",
  "needed",
  "became",
  "break",
  "building",
  "whatever",
  "itself",
  "knowledge",
  "americans",
  "romney",
  "weeks",
  "third",
  "further",
  "effect",
  "trump",
  "david",
  "reported",
  "whose",
  "longer",
  "points",
  "somebody",
  "worked",
  "single",
  "terms",
  "works",
  "certainly",
  "teacher",
  "takes",
  "chance",
  "value",
  "nearly",
  "ground",
  "press",
  "behavior",
  "continue",
  "areas",
  "changes",
  "attention",
  "countries",
  "cases",
  "knows",
  "comments",
  "stood",
  "players",
  "medical",
  "situation",
  "writing",
  "difficult",
  "approach",
  "george",
  "election",
  "create",
  "levels",
  "books",
  "patients",
  "natural",
  "involved",
  "decision",
  "shows",
  "recently",
  "potential",
  "financial",
  "playing",
  "billion",
  "specific",
  "beautiful",
  "feeling",
  "moved",
  "posted",
  "training",
  "spent",
  "michael",
  "wrote",
  "treatment",
  "teaching",
  "growth",
  "systems",
  "texas",
  "shall",
  "cultural",
  "supposed",
  "skills",
  "usually",
  "foreign",
  "quickly",
  "waiting",
  "earlier",
  "china",
  "democrats",
  "included",
  "related",
  "lower",
  "therefore",
  "despite",
  "workers",
  "provided",
  "district",
  "serious",
  "walked",
  "played",
  "addition",
  "resources",
  "greater",
  "central",
  "miles",
  "decided",
  "meeting",
  "watching",
  "global",
  "positive",
  "factors",
  "career",
  "moving",
  "content",
  "written",
  "expected",
  "created",
  "nobody",
  "religious",
  "sunday",
  "beginning",
  "telling",
  "stories",
  "families",
  "pulled",
  "leaders",
  "changed",
  "increased",
  "clearly",
  "computer",
  "costs",
  "justice",
  "received",
  "events",
  "senate",
  "committee",
  "activity",
  "seeing",
  "necessary",
  "required",
  "added",
  "chicago",
  "suddenly",
  "values",
  "numbers",
  "growing",
  "movement",
  "standing",
  "learned",
  "plans",
  "atlanta",
  "comment",
  "november",
  "developed",
  "calls",
  "james",
  "opened",
  "happens",
  "married",
  "indeed",
  "academic",
  "ideas",
  "effective",
  "politics",
  "event",
  "internet",
  "except",
  "standard",
  "journal",
  "store",
  "forces",
  "passed",
  "majority",
  "efforts",
  "talked",
  "allowed",
  "player",
  "english",
  "league",
  "robert",
  "obviously",
  "sounds",
  "rules",
  "critical",
  "older",
  "rates",
  "character",
  "products",
  "meant",
  "status",
  "reality",
  "species",
  "helped",
  "showed",
  "modern",
  "places",
  "complete",
  "built",
  "reports",
  "starting",
  "followed",
  "straight",
  "loved",
  "reasons",
  "reached",
  "insurance",
  "pressure",
  "limited",
  "executive",
  "compared",
  "influence",
  "leaving",
  "spending",
  "lived",
  "weight",
  "respect",
  "described",
  "agency",
  "western",
  "statement",
  "asking",
  "benefits",
  "previous",
  "governor",
  "francisco",
  "context",
  "worse",
  "generally",
  "smith",
  "watched",
  "continued",
  "designed",
  "dollars",
  "sales",
  "standards",
  "sports",
  "lines",
  "holding",
  "secretary",
  "attorney",
  "closed",
  "published",
  "reach",
  "turns",
  "florida",
  "teams",
  "product",
  "parts",
  "imagine",
  "gives",
  "speech",
  "europe",
  "council",
  "calling",
  "professor",
  "thousands",
  "measures",
  "named",
  "voters",
  "raised",
  "provides",
  "safety",
  "officer",
  "interview",
  "structure",
  "touch",
  "evening",
  "overall",
  "directly",
  "colorado",
  "slowly",
  "items",
  "larger",
  "basis",
  "employees",
  "models",
  "football",
  "denver",
  "serve",
  "complex",
  "voiceover",
  "fingers",
  "scores",
  "windows",
  "tough",
  "findings",
  "practices",
  "multiple",
  "includes",
  "taxes",
  "biggest",
  "challenge",
  "leading",
  "houston",
  "georgia",
  "basically",
  "breath",
  "manager",
  "images",
  "official",
  "walking",
  "meaning",
  "prices",
  "methods",
  "policies",
  "trees",
  "smiled",
  "argument",
  "nodded",
  "contact",
  "highly",
  "happening",
  "steps",
  "johnson",
  "willing",
  "features",
  "classroom",
  "station",
  "putting",
  "editor",
  "powerful",
  "french",
  "speaking",
  "sources",
  "realize",
  "function",
  "identity",
  "doubt",
  "british",
  "nations",
  "spoke",
  "finding",
  "concerned",
  "types",
  "wonderful",
  "offered",
  "plant",
  "wearing",
  "southern",
  "currently",
  "stars",
  "shook",
  "authority",
  "records",
  "corner",
  "appears",
  "drugs",
  "decisions",
  "forms",
  "mostly",
  "wednesday",
  "candidate",
  "peter",
  "returned",
  "noted",
  "christmas",
  "presented",
  "decades",
  "hearing",
  "folks",
  "somewhere",
  "concern",
  "presence",
  "religion",
  "factor",
  "determine",
  "materials",
  "appeared",
  "planning",
  "yards",
  "totally",
  "sidebar",
  "relations",
  "variables",
  "climate",
  "crisis",
  "cells",
  "bought",
  "served",
  "becomes",
  "otherwise",
  "homes",
  "notes",
  "agreement",
  "interests",
  "goals",
  "richard",
  "latest",
  "suggests",
  "leaves",
  "plants",
  "promise",
  "claims",
  "liked",
  "thomas",
  "block",
  "audience",
  "apartment",
  "offers",
  "weapons",
  "clothes",
  "fighting",
  "thinks",
  "citizens",
  "angeles",
  "picked",
  "residents",
  "actions",
  "chris",
  "variety",
  "released",
  "larry",
  "direction",
  "software",
  "regarding",
  "website",
  "realized",
  "officers",
  "native",
  "mission",
  "mental",
  "concerns",
  "institute",
  "largest",
  "forced",
  "finished",
  "active",
  "daddy",
  "driving",
  "details",
  "seriously",
  "names",
  "animals",
  "missing",
  "mentioned",
  "sites",
  "projects",
  "keeping",
  "closer",
  "concept",
  "produced",
  "yours",
  "users",
  "baseball",
  "instance",
  "attempt",
  "feels",
  "fully",
  "setting",
  "troops",
  "opening",
  "covered",
  "mexico",
  "customers",
  "subjects",
  "parties",
  "turning",
  "prior",
  "beside",
  "conflict",
  "continues",
  "agreed",
  "towards",
  "responses",
  "condition",
  "dropped",
  "cities",
  "suggested",
  "vision",
  "jones",
  "facebook",
  "progress",
  "healthy",
  "frank",
  "joining",
  "indian",
  "millions",
  "believed",
  "creating",
  "pictures",
  "accept",
  "hundreds",
  "tells",
  "requires",
  "surprised",
  "knowing",
  "funds",
  "virginia",
  "strange",
  "dangerous",
  "william",
  "caused",
  "threat",
  "broke",
  "russia",
  "chairman",
  "conducted",
  "steve",
  "announced",
  "providing",
  "easier",
  "somehow",
  "mayor",
  "observed",
  "arrived",
  "tests",
  "slightly",
  "thoughts",
  "helping",
  "charles",
  "becoming",
  "handle",
  "grand",
  "readers",
  "indicated",
  "laughed",
  "contract",
  "silence",
  "division",
  "stress",
  "lights",
  "sides",
  "plays",
  "doctors",
  "smaller",
  "pieces",
  "williams",
  "starts",
  "elements",
  "experts",
  "classes",
  "london",
  "minister",
  "changing",
  "worried",
  "writer",
  "walls",
  "showing",
  "scott",
  "separate",
  "focused",
  "extent",
  "movies",
  "views",
  "strength",
  "facts",
  "mmhmm",
  "shape",
  "jackson",
  "donald",
  "seconds",
  "defined",
  "placed",
  "proposed",
  "adults",
  "grade",
  "possibly",
  "japan",
  "score",
  "patterns",
  "noticed",
  "attacks",
  "fourth",
  "stared",
  "contrast",
  "losing",
  "younger",
  "martin",
  "advantage",
  "charges",
  "streets",
  "shared",
  "taught",
  "count",
  "internal",
  "winning",
  "allows",
  "partner",
  "corporate",
  "beneath",
  "behaviors",
  "scared",
  "terrible",
  "listening",
  "smell",
  "processes",
  "prepared",
  "options",
  "regional",
  "tools",
  "thousand",
  "authors",
  "missed",
  "honor",
  "signed",
  "lawyer",
  "harry",
  "anywhere",
  "outcomes",
  "familiar",
  "forever",
  "emotional",
  "plane",
  "kinds",
  "greatest",
  "carolina",
  "soldiers",
  "helps",
  "carried",
  "testing",
  "ourselves",
  "explained",
  "pointed",
  "affect",
  "largely",
  "stepped",
  "driver",
  "prove",
  "pushed",
  "housing",
  "heads",
  "applied",
  "apply",
  "serving",
  "marketing",
  "perceived",
  "painting",
  "relative",
  "essential",
  "boston",
  "markets",
  "artists",
  "extremely",
  "joined",
  "shoes",
  "examples",
  "banks",
  "stands",
  "coverage",
  "medicine",
  "equipment",
  "thick",
  "russian",
  "figures",
  "canada",
  "favor",
  "storm",
  "shoulders",
  "teeth",
  "funding",
  "letters",
  "expensive",
  "northern",
  "signs",
  "pages",
  "photos",
  "victims",
  "fellow",
  "clinical",
  "existing",
  "faces",
  "votes",
  "wondered",
  "aspects",
  "feelings",
  "recognize",
  "entirely",
  "begins",
  "charlie",
  "maintain",
  "selling",
  "relevant",
  "highest",
  "careful",
  "eastern",
  "inches",
  "matters",
  "england",
  "typically",
  "capacity",
  "narrative",
  "pounds",
  "agencies",
  "managed",
  "henry",
  "germany",
  "tradition",
  "emergency",
  "prime",
  "location",
  "represent",
  "doors",
  "longterm",
  "waited",
  "remained",
  "honest",
  "operation",
  "supported",
  "buying",
  "selected",
  "tears",
  "supra",
  "bedroom",
  "objects",
  "stated",
  "believes",
  "bodies",
  "massive",
  "humans",
  "elected",
  "revealed",
  "occurred",
  "houses",
  "michigan",
  "attitudes",
  "persons",
  "guilty",
  "creative",
  "stores",
  "besides",
  "moreover",
  "articles",
  "discuss",
  "respond",
  "educators",
  "excellent",
  "kidding",
  "posts",
  "explains",
  "hoping",
  "unlike",
  "bringing",
  "moments",
  "newspaper",
  "france",
  "reduced",
  "technical",
  "staring",
  "pocket",
  "tight",
  "davis",
  "exposure",
  "completed",
  "grown",
  "manner",
  "adding",
  "owners",
  "committed",
  "opposite",
  "talks",
  "reader",
  "keeps",
  "assistant",
  "belief",
  "suppose",
  "performed",
  "discussed",
  "birthday",
  "remaining",
  "meanwhile",
  "leaned",
  "planned",
  "hardly",
  "brothers",
  "charged",
  "forth",
  "treated",
  "intended",
  "answers",
  "analyses",
  "singing",
  "investors",
  "iraqi",
  "reporting",
  "voted",
  "consumer",
  "anonymous",
  "consumers",
  "leads",
  "revenue",
  "india",
  "golden",
  "drinking",
  "likes",
  "causes",
  "existence",
  "thats",
  "kennedy",
  "stayed",
  "merely",
  "fields",
  "passing",
  "arizona",
  "elections",
  "bathroom",
  "hollywood",
  "accepted",
  "hillary",
  "nearby",
  "creation",
  "clients",
  "choices",
  "expressed",
  "throat",
  "songs",
  "louis",
  "fired",
  "dozen",
  "combined",
  "estimated",
  "lawyers",
  "dealing",
  "somewhat",
  "classic",
  "moves",
  "positions",
  "courses",
  "seeking",
  "sarah",
  "framework",
  "cards",
  "primarily",
  "documents",
  "reporter",
  "trail",
  "dressed",
  "laughing",
  "beliefs",
  "falling",
  "saved",
  "victim",
  "medium",
  "proper",
  "acting",
  "courts",
  "critics",
  "regime",
  "woods",
  "kevin",
  "saddam",
  "increases",
  "fewer",
  "pleasure",
  "request",
  "holds",
  "gentlemen",
  "detroit",
  "entered",
  "removed",
  "sharing",
  "whereas",
  "surgery",
  "glanced",
  "degrees",
  "bottle",
  "musical",
  "writers",
  "headed",
  "accounts",
  "offering",
  "buildings",
  "advanced",
  "obtained",
  "downtown",
  "paint",
  "donaldson",
  "argued",
  "miller",
  "devices",
  "democrat",
  "dreams",
  "powers",
  "studio",
  "korea",
  "selection",
  "wondering",
  "breaking",
  "hanging",
  "parking",
  "sleeping",
  "broad",
  "brian",
  "regard",
  "allowing",
  "answered",
  "perform",
  "excited",
  "brings",
  "spiritual",
  "walks",
  "principle",
  "notion",
  "literally",
  "measured",
  "examined",
  "reagan",
  "birds",
  "agents",
  "operating",
  "sector",
  "flowers",
  "wilson",
  "criteria",
  "dying",
  "films",
  "knees",
  "hopes",
  "diversity",
  "cooking",
  "threw",
  "opposed",
  "phase",
  "samples",
  "purposes",
  "andor",
  "carrying",
  "papers",
  "sharp",
  "offense",
  "improved",
  "paris",
  "loves",
  "variable",
  "examine",
  "foods",
  "colleges",
  "perfectly",
  "practical",
  "centers",
  "jordan",
  "accused",
  "polls",
  "located",
  "formal",
  "figured",
  "bills",
  "limits",
  "external",
  "expert",
  "affairs",
  "sought",
  "billy",
  "similarly",
  "award",
  "barbara",
  "finds",
  "touched",
  "rooms",
  "widely",
  "lifted",
  "awareness",
  "symptoms",
  "colors",
  "graduate",
  "offensive",
  "jerry",
  "struck",
  "maam",
  "ordered",
  "agenda",
  "shopping",
  "susan",
  "fairly",
  "whenever",
  "relation",
  "units",
  "partners",
  "guest",
  "concepts",
  "promised",
  "studied",
  "secondary",
  "collected",
  "arrested",
  "queen",
  "estimates",
  "appeal",
  "campus",
  "breakfast",
  "closely",
  "organized",
  "narrator",
  "roles",
  "survive",
  "daniel",
  "roberts",
  "extreme",
  "whispered",
  "austin",
  "falls",
  "links",
  "constant",
  "chose",
  "strongly",
  "suffering",
  "seasons",
  "nervous",
  "defensive",
  "cutting",
  "childhood",
  "drawn",
  "tickets",
  "rolled",
  "follows",
  "replied",
  "firms",
  "retired",
  "extended",
  "illinois",
  "schedule",
  "detective",
  "smiling",
  "tested",
  "surely",
  "protein",
  "command",
  "severe",
  "kelly",
  "establish",
  "violent",
  "procedure",
  "spanish",
  "criticism",
  "demands",
  "formula",
  "filed",
  "customer",
  "raising",
  "writes",
  "dollar",
  "formed",
  "immediate",
  "pants",
  "meetings",
  "earned",
  "package",
  "athletes",
  "shots",
  "therapy",
  "claimed",
  "attempts",
  "heaven",
  "scholars",
  "sounded",
  "drawing",
  "pulling",
  "evolution",
  "microsoft",
  "diverse",
  "letting",
  "refused",
  "engaged",
  "goods",
  "recovery",
  "warning",
  "pushing",
  "taylor",
  "locked",
  "chemical",
  "reduction",
  "andrew",
  "pulls",
  "coaches",
  "reporters",
  "loose",
  "principal",
  "academy",
  "boyfriend",
  "elsewhere",
  "forgot",
  "recorded",
  "farmers",
  "neighbors",
  "hired",
  "joseph",
  "scored",
  "arguments",
  "absence",
  "mountains",
  "howard",
  "fishing",
  "regions",
  "islamic",
  "settings",
  "connected",
  "begun",
  "facility",
  "barack",
  "sending",
  "tasks",
  "proposal",
  "judgment",
  "faced",
  "hussein",
  "males",
  "contains",
  "equally",
  "laughter",
  "videotape",
  "networks",
  "lessons",
  "literary",
  "risks",
  "miami",
  "functions",
  "counter",
  "grabbed",
  "accurate",
  "carter",
  "valuable",
  "adopted",
  "fixed",
  "owned",
  "lovely",
  "exists",
  "orders",
  "objective",
  "ideal",
  "rarely",
  "elizabeth",
  "opens",
  "chopped",
  "visitors",
  "platform",
  "memories",
  "staying",
  "enjoyed",
  "approved",
  "serves",
  "settled",
  "incident",
  "texts",
  "solutions",
  "speaker",
  "shares",
  "voices",
  "resulting",
  "explore",
  "quietly",
  "edition",
  "mothers",
  "returns",
  "linked",
  "depends",
  "pressed",
  "issued",
  "chain",
  "secure",
  "computers",
  "literacy",
  "launch",
  "highway",
  "virtually",
  "assess",
  "enormous",
  "medicare",
  "universal",
  "directed",
  "frequency",
  "convinced",
  "fallen",
  "danny",
  "females",
  "discourse",
  "genetic",
  "employee",
  "nights",
  "trained",
  "historic",
  "opinions",
  "helpful",
  "viewed",
  "scheduled",
  "anderson",
  "minds",
  "feedback",
  "stocks",
  "disaster",
  "dramatic",
  "component",
  "personnel",
  "reviews",
  "visible",
  "deficit",
  "involving",
  "strategic",
  "channel",
  "commander",
  "receiving",
  "informed",
  "waves",
  "syria",
  "calories",
  "referred",
  "telephone",
  "wooden",
  "nancy",
  "glasses",
  "stops",
  "depending",
  "inspired",
  "guests",
  "bears",
  "destroyed",
  "versus",
  "addressed",
  "defend",
  "suffered",
  "prince",
  "stronger",
  "vietnam",
  "calif",
  "harris",
  "exposed",
  "initially",
  "roger",
  "clark",
  "hills",
  "dallas",
  "repeated",
  "detailed",
  "indicates",
  "bobby",
  "signal",
  "hopefully",
  "britain",
  "bones",
  "checked",
  "technique",
  "republic",
  "roughly",
  "hoped",
  "burning",
  "dependent",
  "seats",
  "cleveland",
  "marry",
  "employed",
  "crossed",
  "contain",
  "files",
  "omitted",
  "deserve",
  "invited",
  "gently",
  "rolling",
  "jason",
  "messages",
  "honestly",
  "simon",
  "loans",
  "cultures",
  "socalled",
  "vehicles",
  "breathing",
  "minnesota",
  "lewis",
  "listed",
  "apparent",
  "passage",
  "survival",
  "seattle",
  "forgotten",
  "baltimore",
  "wanting",
  "describes",
  "driven",
  "hunting",
  "concrete",
  "sawyer",
  "replaced",
  "compare",
  "tries",
  "assets",
  "expansion",
  "involves",
  "reserve",
  "allen",
  "handed",
  "joins",
  "managers",
  "smiles",
  "properly",
  "kansas",
  "declined",
  "simpson",
  "smoking",
  "fought",
  "organic",
  "finance",
  "proved",
  "launched",
  "italian",
  "discovery",
  "plain",
  "button",
  "heavily",
  "islam",
  "confirmed",
  "horrible",
  "divided",
  "resulted",
  "laughs",
  "sandy",
  "bureau",
  "worker",
  "imagined",
  "shrugged",
  "patrick",
  "maryland",
  "storage",
  "delivered",
  "responded",
  "porch",
  "passion",
  "achieved",
  "normally",
  "paused",
  "teaspoon",
  "slipped",
  "nowhere",
  "privacy",
  "screaming",
  "controls",
  "coalition",
  "sciences",
  "warming",
  "dancing",
  "permanent",
  "gathered",
  "intense",
  "household",
  "springs",
  "sensitive",
  "heading",
  "bruce",
  "sighed",
  "scenes",
  "approval",
  "movements",
  "hurricane",
  "exciting",
  "granted",
  "flickr",
  "frankly",
  "chances",
  "lincoln",
  "painted",
  "emerged",
  "precisely",
  "stretch",
  "veterans",
  "cited",
  "assumed",
  "ratio",
  "wrapped",
  "extensive",
  "closing",
  "passes",
  "tommy",
  "unlikely",
  "leather",
  "brinkley",
  "testimony",
  "declared",
  "occurs",
  "machines",
  "returning",
  "egypt",
  "sisters",
  "amounts",
  "indians",
  "naturally",
  "chocolate",
  "denied",
  "visited",
  "columbia",
  "flesh",
  "parks",
  "rachel",
  "trends",
  "paintings",
  "judges",
  "deals",
  "regularly",
  "harvard",
  "supports",
  "topics",
  "jumped",
  "economics",
  "distinct",
  "attended",
  "rocks",
  "injuries",
  "marked",
  "horses",
  "spoken",
  "sessions",
  "distant",
  "delivery",
  "trading",
  "concluded",
  "pakistan",
  "stephen",
  "recommend",
  "reducing",
  "bother",
  "confused",
  "dialogue",
  "theories",
  "anthony",
  "studying",
  "muslims",
  "blocks",
  "reaching",
  "hitting",
  "genes",
  "shake",
  "oregon",
  "profile",
  "infection",
  "combat",
  "dozens",
  "mainly",
  "validity",
  "deeper",
  "losses",
  "waters",
  "rapidly",
  "friendly",
  "listened",
  "fifteen",
  "interior",
  "recalls",
  "fifty",
  "reminded",
  "roads",
  "picking",
  "publicly",
  "absolute",
  "forgive",
  "throwing",
  "sweat",
  "analysts",
  "territory",
  "saudi",
  "presents",
  "admitted",
  "burned",
  "hospitals",
  "shouted",
  "moore",
  "actors",
  "angel",
  "generated",
  "rating",
  "moderate",
  "gifted",
  "dominant",
  "exception",
  "saving",
  "tracks",
  "caller",
  "stability",
  "peers",
  "ratings",
  "assembly",
  "nursing",
  "forehead",
  "deaths",
  "shadows",
  "giants",
  "assigned",
  "pointing",
  "empire",
  "johnny",
  "eddie",
  "offices",
  "clouds",
  "chronicle",
  "memorial",
  "thrown",
  "walter",
  "formation",
  "amazon",
  "mommy",
  "hated",
  "roots",
  "founded",
  "dedicated",
  "mistakes",
  "steady",
  "comedy",
  "counsel",
  "emerging",
  "capitol",
  "contained",
  "stations",
  "instant",
  "reflected",
  "associate",
  "cameras",
  "clothing",
  "traveling",
  "stream",
  "confident",
  "branch",
  "periods",
  "estimate",
  "walker",
  "injured",
  "weekly",
  "threats",
  "grades",
  "speaks",
  "inaudible",
  "terry",
  "hiding",
  "newly",
  "ruling",
  "bonds",
  "orleans",
  "diego",
  "districts",
  "drivers",
  "diane",
  "improving",
  "fantastic",
  "wildlife",
  "metro",
  "humanity",
  "protected",
  "routine",
  "shower",
  "oakland",
  "everyday",
  "covering",
  "linda",
  "abandoned",
  "thread",
  "payments",
  "poetry",
  "churches",
  "summary",
  "causing",
  "breathe",
  "physics",
  "gained",
  "vacation",
  "seeds",
  "creates",
  "mount",
  "annie",
  "australia",
  "compete",
  "pleased",
  "videos",
  "covers",
  "capture",
  "worldwide",
  "producer",
  "tables",
  "origin",
  "oklahoma",
  "awards",
  "profits",
  "ignored",
  "furniture",
  "bound",
  "lifetime",
  "ethical",
  "athletic",
  "generate",
  "climbed",
  "sighs",
  "operate",
  "wisconsin",
  "searching",
  "edward",
  "inflation",
  "alice",
  "barry",
  "bucks",
  "acres",
  "supplies",
  "sanctions",
  "variance",
  "attacked",
  "attached",
  "prominent",
  "mortgage",
  "doctrine",
  "reaches",
  "manhattan",
  "italy",
  "cheek",
  "pollution",
  "centuries",
  "jennifer",
  "copyright",
  "broader",
  "breaks",
  "shortly",
  "sections",
  "protest",
  "decent",
  "kerry",
  "entrance",
  "locations",
  "producing",
  "marks",
  "contrary",
  "gains",
  "earnings",
  "commonly",
  "opponents",
  "scenario",
  "predicted",
  "emissions",
  "loading",
  "wings",
  "goodbye",
  "chairs",
  "reply",
  "superior",
  "baker",
  "founder",
  "packed",
  "ministry",
  "remote",
  "alleged",
  "alliance",
  "theatre",
  "baghdad",
  "softly",
  "allies",
  "phones",
  "visiting",
  "boxes",
  "neighbor",
  "telescope",
  "spots",
  "societies",
  "focusing",
  "collapse",
  "adequate",
  "attempted",
  "helen",
  "temple",
  "steal",
  "diagnosis",
  "announcer",
  "doorway",
  "refer",
  "rejected",
  "accuracy",
  "voter",
  "roman",
  "desperate",
  "emotions",
  "consensus",
  "convicted",
  "singer",
  "disney",
  "guidance",
  "argues",
  "contracts",
  "expanded",
  "warned",
  "recession",
  "hallway",
  "loving",
  "hearts",
  "themes",
  "aircraft",
  "factory",
  "karen",
  "lately",
  "stolen",
  "thompson",
  "resident",
  "laura",
  "engineers",
  "derived",
  "kicked",
  "stages",
  "vegas",
  "recording",
  "taiwan",
  "races",
  "grounds",
  "captured",
  "drives",
  "intent",
  "insisted",
  "trials",
  "proven",
  "waved",
  "commerce",
  "beans",
  "alabama",
  "landing",
  "belong",
  "creature",
  "employers",
  "expecting",
  "targets",
  "divine",
  "happiness",
  "muscles",
  "wished",
  "errors",
  "romantic",
  "missouri",
  "resort",
  "monthly",
  "preferred",
  "format",
  "daughters",
  "variation",
  "conflicts",
  "extension",
  "greek",
  "posting",
  "greatly",
  "wallace",
  "scary",
  "managing",
  "scales",
  "analyzed",
  "pregnancy",
  "ships",
  "peoples",
  "bloody",
  "aimed",
  "wealthy",
  "shore",
  "salary",
  "thereby",
  "pursue",
  "unions",
  "mechanism",
  "refers",
  "kissed",
  "integrity",
  "lists",
  "partly",
  "checking",
  "contest",
  "morgan",
  "designer",
  "youre",
  "lawmakers",
  "preparing",
  "legacy",
  "witnesses",
  "trips",
  "beating",
  "colonel",
  "cheeks",
  "stranger",
  "featured",
  "stare",
  "warren",
  "grateful",
  "temporary",
  "enemies",
  "pretend",
  "civilian",
  "chamber",
  "evident",
  "battery",
  "referring",
  "reflects",
  "assuming",
  "entering",
  "handful",
  "gordon",
  "couples",
  "versions",
  "stewart",
  "drops",
  "scientist",
  "consent",
  "recalled",
  "matthew",
  "painful",
  "cents",
  "moscow",
  "overcome",
  "flour",
  "kinda",
  "defeat",
  "entitled",
  "disorders",
  "courage",
  "priest",
  "encounter",
  "hardware",
  "emily",
  "editorial",
  "advocates",
  "promoting",
  "guarantee",
  "sorts",
  "succeed",
  "tragedy",
  "intensity",
  "isolated",
  "fears",
  "irish",
  "string",
  "database",
  "behalf",
  "stretched",
  "drinks",
  "visits",
  "longtime",
  "tension",
  "sweetie",
  "celebrate",
  "picks",
  "knocked",
  "promises",
  "spain",
  "gifts",
  "arthur",
  "blogs",
  "apologize",
  "korean",
  "acquired",
  "expenses",
  "homeless",
  "reveals",
  "robinson",
  "directors",
  "closet",
  "charlotte",
  "scandal",
  "handsome",
  "chart",
  "belly",
  "lifestyle",
  "kuwait",
  "hunter",
  "cares",
  "gates",
  "viewers",
  "insight",
  "reliable",
  "outta",
  "checks",
  "construct",
  "tomatoes",
  "steven",
  "dishes",
  "lands",
  "liberals",
  "tennessee",
  "guards",
  "purchased",
  "strip",
  "indiana",
  "hispanic",
  "adams",
  "providers",
  "chuck",
  "designs",
  "leaning",
  "shocked",
  "radiation",
  "assessed",
  "perry",
  "volunteer",
  "circuit",
  "summit",
  "airlines",
  "strikes",
  "ownership",
  "register",
  "murdered",
  "potatoes",
  "qualified",
  "watches",
  "ranging",
  "briefly",
  "provision",
  "elderly",
  "counties",
  "biden",
  "gathering",
  "meals",
  "ruled",
  "surveys",
  "swimming",
  "baseline",
  "islands",
  "russell",
  "barriers",
  "dynamics",
  "hampshire",
  "norms",
  "trillion",
  "racism",
  "filling",
  "adoption",
  "reforms",
  "devoted",
  "maria",
  "landed",
  "cleaning",
  "competing",
  "graham",
  "coaching",
  "dennis",
  "walters",
  "buchanan",
  "nurses",
  "survived",
  "shelter",
  "sergeant",
  "rings",
  "employer",
  "nelson",
  "arguing",
  "nixon",
  "artistic",
  "theology",
  "dates",
  "alexander",
  "choosing",
  "abilities",
  "existed",
  "perot",
  "striking",
  "ballot",
  "corps",
  "targeted",
  "sodium",
  "expertise",
  "relatives",
  "wayne",
  "sooner",
  "olympics",
  "seemingly",
  "senators",
  "preserve",
  "princess",
  "rational",
  "stares",
  "snapped",
  "treaty",
  "grandma",
  "towns",
  "followup",
  "parallel",
  "grave",
  "styles",
  "turner",
  "theyre",
  "mitchell",
  "desired",
  "introduce",
  "counts",
  "rhetoric",
  "folded",
  "sacrifice",
  "verbal",
  "commit",
  "margaret",
  "lowest",
  "handling",
  "farther",
  "chuckles",
  "cohen",
  "expense",
  "youtube",
  "brazil",
  "scoring",
  "cleared",
  "jacob",
  "engaging",
  "makeup",
  "sheets",
  "secrets",
  "edwards",
  "bastard",
  "lightly",
  "clubs",
  "confusion",
  "examining",
  "equality",
  "horizon",
  "producers",
  "titles",
  "fathers",
  "powell",
  "correctly",
  "tendency",
  "claiming",
  "stake",
  "michelle",
  "appointed",
  "screening",
  "parental",
  "stones",
  "reverse",
  "playoffs",
  "jonathan",
  "franchise",
  "spaces",
  "raises",
  "traveled",
  "jesse",
  "louisiana",
  "adventure",
  "cokie",
  "classical",
  "wounded",
  "requiring",
  "nonprofit",
  "parker",
  "contexts",
  "copies",
  "stanford",
  "smelled",
  "purple",
  "brooklyn",
  "currency",
  "boards",
  "cambridge",
  "educated",
  "ceremony",
  "reads",
  "precious",
  "aesthetic",
  "modest",
  "campaigns",
  "activists",
  "kentucky",
  "suspected",
  "parked",
  "actively",
  "basement",
  "franklin",
  "branches",
  "wright",
  "julie",
  "attorneys",
  "impressed",
  "ronald",
  "physician",
  "varied",
  "expanding",
  "forty",
  "separated",
  "gardens",
  "carries",
  "edges",
  "debates",
  "lawrence",
  "engineer",
  "unity",
  "wherever",
  "cardinals",
  "satellite",
  "ranks",
  "southwest",
  "refugees",
  "sunlight",
  "wells",
  "playoff",
  "shifted",
  "regarded",
  "creatures",
  "twisted",
  "learners",
  "receiver",
  "touchdown",
  "exclusive",
  "languages",
  "overseas",
  "arabia",
  "stopping",
  "aaron",
  "signals",
  "occasion",
  "reviewed",
  "taliban",
  "marshall",
  "cookies",
  "chips",
  "breasts",
  "intention",
  "broadway",
  "sizes",
  "billions",
  "satisfied",
  "cabinet",
  "adviser",
  "borders",
  "hiring",
  "appeals",
  "collins",
  "jerusalem",
  "default",
  "relate",
  "server",
  "invisible",
  "broncos",
  "immigrant",
  "alongside",
  "douglas",
  "charity",
  "equation",
  "blues",
  "reactions",
  "favorites",
  "linear",
  "dropping",
  "inclusion",
  "bishop",
  "revenues",
  "shade",
  "audio",
  "logical",
  "oldest",
  "poured",
  "demanded",
  "winds",
  "attending",
  "worlds",
  "berkeley",
  "prisoners",
  "healing",
  "wages",
  "theres",
  "counting",
  "taxpayers",
  "shops",
  "complaint",
  "dispute",
  "invasion",
  "resolve",
  "rated",
  "balanced",
  "transport",
  "trucks",
  "libraries",
  "prospect",
  "craig",
  "modified",
  "reasoning",
  "yankees",
  "overnight",
  "feeding",
  "consists",
  "suits",
  "flood",
  "spectrum",
  "northwest",
  "adopt",
  "download",
  "rangers",
  "justify",
  "scream",
  "martha",
  "migration",
  "admission",
  "installed",
  "blond",
  "requests",
  "instances",
  "struggled",
  "focuses",
  "gibson",
  "promising",
  "grabs",
  "displayed",
  "campbell",
  "autonomy",
  "deadly",
  "claire",
  "produces",
  "plates",
  "dimension",
  "crowded",
  "loaded",
  "trace",
  "explicit",
  "morris",
  "tribal",
  "modeling",
  "tossed",
  "cooper",
  "advocate",
  "oclock",
  "portland",
  "evaluated",
  "touching",
  "circles",
  "planes",
  "arrival",
  "nutrition",
  "bradley",
  "remembers",
  "wheels",
  "habits",
  "decreased",
  "motivated",
  "heels",
  "impacts",
  "magnitude",
  "backs",
  "pockets",
  "forcing",
  "maggie",
  "equity",
  "comparing",
  "freshman",
  "suburban",
  "closest",
  "lined",
  "applying",
  "subtle",
  "jefferson",
  "wider",
  "trapped",
  "halfway",
  "nebraska",
  "celebrity",
  "rushed",
  "antonio",
  "pleasant",
  "alaska",
  "featuring",
  "affects",
  "cooked",
  "trauma",
  "servings",
  "proposals",
  "noting",
  "enjoying",
  "seventh",
  "demanding",
  "lobby",
  "justin",
  "array",
  "signing",
  "arkansas",
  "murphy",
  "grinned",
  "likewise",
  "angels",
  "oscar",
  "funded",
  "defending",
  "accessed",
  "julia",
  "portrait",
  "layers",
  "custody",
  "buyers",
  "waist",
  "jackie",
  "lowered",
  "realistic",
  "slavery",
  "rushing",
  "updated",
  "ignorant",
  "passenger",
  "debut",
  "fires",
  "remarks",
  "faded",
  "jennings",
  "makers",
  "observers",
  "katie",
  "forests",
  "duties",
  "tender",
  "identical",
  "camps",
  "talented",
  "hurts",
  "imposed",
  "privilege",
  "printed",
  "corridor",
  "francis",
  "yelled",
  "novels",
  "rivers",
  "hearings",
  "overhead",
  "farms",
  "lover",
  "pitcher",
  "crossing",
  "tends",
  "treasury",
  "goodness",
  "complain",
  "dominated",
  "recipes",
  "meets",
  "disappear",
  "arranged",
  "laden",
  "updates",
  "iranian",
  "electoral",
  "habitat",
  "teens",
  "enhanced",
  "worthy",
  "sanders",
  "instantly",
  "readily",
  "conscious",
  "sliced",
  "peaceful",
  "rolls",
  "rocky",
  "vegetable",
  "protests",
  "shaped",
  "maine",
  "jamie",
  "chill",
  "newshour",
  "courtesy",
  "russians",
  "sidewalk",
  "climbing",
  "dressing",
  "grants",
  "someday",
  "solely",
  "opponent",
  "damaged",
  "strain",
  "nathan",
  "crops",
  "evolved",
  "particles",
  "jokes",
  "websites",
  "libya",
  "violation",
  "profound",
  "cheaper",
  "retrieved",
  "medicaid",
  "tracking",
  "terrific",
  "missile",
  "floating",
  "trunk",
  "virtue",
  "keith",
  "deserves",
  "magazines",
  "crown",
  "removal",
  "donna",
  "shapes",
  "washed",
  "allegedly",
  "nonsense",
  "promotion",
  "worship",
  "secular",
  "heroes",
  "analyze",
  "reminds",
  "stirring",
  "editors",
  "symbolic",
  "boats",
  "wishes",
  "attracted",
  "musicians",
  "spotted",
  "qualities",
  "airline",
  "planets",
  "minimal",
  "paragraph",
  "southeast",
  "handled",
  "paula",
  "fails",
  "delicious",
  "shakes",
  "masters",
  "signature",
  "publisher",
  "charter",
  "audiences",
  "warner",
  "brooks",
  "applies",
  "insights",
  "seniors",
  "bleeding",
  "bottles",
  "ignorance",
  "madison",
  "jeffrey",
  "safer",
  "twins",
  "headlines",
  "generous",
  "fulltime",
  "frowned",
  "annually",
  "toxic",
  "measuring",
  "bands",
  "slaves",
  "socially",
  "wiped",
  "restore",
  "afterward",
  "sustained",
  "aboard",
  "dough",
  "blessed",
  "believing",
  "careers",
  "cheney",
  "homeland",
  "molly",
  "civilians",
  "grows",
  "coastal",
  "suspended",
  "brains",
  "gorbachev",
  "necessity",
  "counted",
  "pressures",
  "scattered",
  "efficacy",
  "victor",
  "expects",
  "iraqis",
  "assessing",
  "traits",
  "ellen",
  "dragged",
  "patience",
  "disabled",
  "occupied",
  "tucked",
  "mason",
  "sometime",
  "rebecca",
  "partial",
  "addresses",
  "legally",
  "hawaii",
  "scent",
  "defendant",
  "survivors",
  "sally",
  "followers",
  "toronto",
  "civic",
  "jessica",
  "transit",
  "automatic",
  "credits",
  "implies",
  "engines",
  "informal",
  "tigers",
  "treating",
  "tended",
  "ireland",
  "acute",
  "freak",
  "sponsored",
  "graph",
  "stanley",
  "enters",
  "admits",
  "inherent",
  "smells",
  "strict",
  "fruits",
  "defining",
  "exploring",
  "composed",
  "nightmare",
  "realm",
  "defeated",
  "placement",
  "nicole",
  "ethnicity",
  "viewing",
  "sampling",
  "channels",
  "blank",
  "freeze",
  "prospects",
  "lebanon",
  "submitted",
  "betty",
  "graphic",
  "speakers",
  "berlin",
  "booth",
  "eleven",
  "monica",
  "firmly",
  "delicate",
  "drain",
  "isolation",
  "entity",
  "quarters",
  "emphasize",
  "cared",
  "origins",
  "flexible",
  "stays",
  "spite",
  "philip",
  "residence",
  "sticks",
  "acted",
  "silently",
  "adapted",
  "graduated",
  "vaccine",
  "slices",
  "quest",
  "corners",
  "gloves",
  "protocol",
  "hotels",
  "adjusted",
  "quoted",
  "spirits",
  "seated",
  "dismissed",
  "steam",
  "innings",
  "tourists",
  "hamilton",
  "episodes",
  "jenny",
  "backup",
  "winners",
  "trailer",
  "sharon",
  "dealt",
  "muttered",
  "workplace",
  "shifts",
  "economies",
  "maker",
  "grams",
  "troubled",
  "rubbed",
  "momentum",
  "eighth",
  "crosstalk",
  "putin",
  "sandwich",
  "diagnosed",
  "poorly",
  "codes",
  "consisted",
  "brands",
  "react",
  "solving",
  "ranged",
  "shouting",
  "rounds",
  "stuffed",
  "courtroom",
  "pursuit",
  "excluded",
  "throws",
  "achieving",
  "petraeus",
  "historian",
  "seeks",
  "bases",
  "attacking",
  "startled",
  "pressing",
  "advocacy",
  "sheep",
  "journals",
  "lightning",
  "recover",
  "sentences",
  "ralph",
  "inning",
  "critique",
  "emails",
  "deadline",
  "strangers",
  "displays",
  "driveway",
  "lakes",
  "morality",
  "rockets",
  "blowing",
  "insist",
  "catching",
  "attribute",
  "yelling",
  "beard",
  "farmer",
  "trusted",
  "phillips",
  "portfolio",
  "arnold",
  "marie",
  "hunters",
  "wives",
  "beloved",
  "answering",
  "flies",
  "brandon",
  "invested",
  "cracked",
  "shorter",
  "halloween",
  "intimate",
  "teenage",
  "counselor",
  "redskins",
  "screamed",
  "twentieth",
  "agrees",
  "beaten",
  "vitamin",
  "namely",
  "damned",
  "mature",
  "trails",
  "heights",
  "advances",
  "blocked",
  "belongs",
  "jumping",
  "gentleman",
  "accepting",
  "souls",
  "enrolled",
  "conclude",
  "meters",
  "onions",
  "requested",
  "projected",
  "incidence",
  "lighting",
  "shifting",
  "provider",
  "stiff",
  "contents",
  "janet",
  "escaped",
  "suite",
  "teaches",
  "tours",
  "median",
  "perceive",
  "diana",
  "openly",
  "exhausted",
  "unclear",
  "permitted",
  "province",
  "patent",
  "meantime",
  "stored",
  "greens",
  "tanks",
  "mueller",
  "anxious",
  "specified",
  "columnist",
  "rises",
  "revealing",
  "designers",
  "mister",
  "exercises",
  "interact",
  "temporal",
  "struggles",
  "northeast",
  "bored",
  "swallowed",
  "benjamin",
  "planted",
  "streak",
  "assured",
  "pitching",
  "calendar",
  "safely",
  "investing",
  "pasta",
  "squad",
  "homework",
  "interface",
  "urged",
  "quotes",
  "grasp",
  "sucks",
  "partially",
  "ignoring",
  "statute",
  "saints",
  "pills",
  "sells",
  "detected",
  "flights",
  "resolved",
  "towel",
  "promoted",
  "wireless",
  "browser",
  "syrian",
  "tyler",
  "stealing",
  "panels",
  "catherine",
  "criterion",
  "mentally",
  "founding",
  "accent",
  "respected",
  "bernie",
  "steep",
  "stance",
  "columbus",
  "missiles",
  "jewelry",
  "draws",
  "suspects",
  "hunger",
  "workout",
  "corrupt",
  "warmth",
  "incidents",
  "placing",
  "eyebrows",
  "teammates",
  "prompted",
  "screams",
  "metaphor",
  "starter",
  "backward",
  "murray",
  "feared",
  "hannah",
  "casey",
  "allstar",
  "mobility",
  "occasions",
  "wendy",
  "inventory",
  "threshold",
  "warrant",
  "deciding",
  "guided",
  "galaxies",
  "financing",
  "writings",
  "shelf",
  "fighters",
  "excessive",
  "tropical",
  "evans",
  "recovered",
  "curiosity",
  "qualify",
  "montana",
  "traded",
  "mining",
  "obesity",
  "screwed",
  "strengths",
  "nevada",
  "belonged",
  "hears",
  "footage",
  "sheer",
  "meanings",
  "blown",
  "bearing",
  "kenny",
  "forrest",
  "proceed",
  "activist",
  "lucas",
  "symbols",
  "carlos",
  "suitable",
  "possess",
  "reserves",
  "highlight",
  "workshop",
  "collar",
  "albert",
  "graduates",
  "chemistry",
  "eagles",
  "infected",
  "reception",
  "vinegar",
  "hansen",
  "vincent",
  "avoided",
  "shuttle",
  "lacking",
  "sectors",
  "lineup",
  "greece",
  "stepping",
  "amanda",
  "shiny",
  "matches",
  "awarded",
  "embassy",
  "incentive",
  "colin",
  "bothered",
  "jurors",
  "voluntary",
  "decides",
  "gasoline",
  "explored",
  "masses",
  "oliver",
  "retain",
  "missions",
  "squeezed",
  "hostile",
  "paradigm",
  "spends",
  "developer",
  "teenagers",
  "spreading",
  "departure",
  "happily",
  "haiti",
  "donations",
  "tales",
  "invented",
  "orchestra",
  "aliens",
  "benghazi",
  "palin",
  "flows",
  "magnetic",
  "holmes",
  "detection",
  "organize",
  "ukraine",
  "removing",
  "barrier",
  "nothin",
  "loyalty",
  "knight",
  "fights",
  "shining",
  "villages",
  "harvey",
  "economist",
  "converted",
  "sticking",
  "relieved",
  "poems",
  "hurting",
  "affecting",
  "hurried",
  "lighter",
  "studios",
  "malcolm",
  "locker",
  "revenge",
  "lungs",
  "tablet",
  "testament",
  "notably",
  "wears",
  "flames",
  "publish",
  "justified",
  "pillow",
  "divorced",
  "relating",
  "export",
  "worries",
  "grandpa",
  "marcus",
  "sharply",
  "hesitated",
  "leonard",
  "entities",
  "polling",
  "desktop",
  "lifting",
  "backyard",
  "inability",
  "norman",
  "authentic",
  "finishing",
  "interpret",
  "companion",
  "depressed",
  "rogers",
  "labeled",
  "contacts",
  "altered",
  "distress",
  "centre",
  "essays",
  "deemed",
  "vessels",
  "pickup",
  "lions",
  "prints",
  "blogging",
  "bosnia",
  "laser",
  "bride",
  "railroad",
  "mercury",
  "relaxed",
  "graphics",
  "testified",
  "dealer",
  "pearl",
  "fleet",
  "regimes",
  "holidays",
  "floors",
  "midst",
  "drawer",
  "banned",
  "addiction",
  "countless",
  "fighter",
  "sends",
  "revised",
  "embedded",
  "liver",
  "vanished",
  "teenager",
  "marines",
  "reserved",
  "rumors",
  "yeltsin",
  "cuban",
  "occurring",
  "zones",
  "transform",
  "stunning",
  "battles",
  "testify",
  "paths",
  "harold",
  "freely",
  "anytime",
  "matching",
  "judgments",
  "collapsed",
  "tolerance",
  "latino",
  "creator",
  "weakness",
  "earning",
  "costly",
  "insists",
  "treasure",
  "marty",
  "carrier",
  "tampa",
  "varieties",
  "partisan",
  "modes",
  "cowboys",
  "boulder",
  "delayed",
  "wallet",
  "pursuing",
  "intensive",
  "pathetic",
  "avoiding",
  "kings",
  "failures",
  "skillet",
  "edited",
  "kicking",
  "regards",
  "reminder",
  "dealers",
  "considers",
  "magical",
  "butler",
  "prayers",
  "starters",
  "polish",
  "proteins",
  "backing",
  "priests",
  "shipping",
  "utterly",
  "rebounds",
  "insects",
  "resume",
  "spinning",
  "glances",
  "faithful",
  "crushed",
  "terrain",
  "quinn",
  "bennett",
  "compound",
  "colorful",
  "digging",
  "accounted",
  "sullivan",
  "laying",
  "imagery",
  "youngest",
  "molecules",
  "skinny",
  "brutal",
  "terrified",
  "resting",
  "favorable",
  "shorts",
  "egyptian",
  "pairs",
  "nails",
  "pilots",
  "posed",
  "intend",
  "desires",
  "tribes",
  "emergence",
  "exports",
  "stating",
  "charming",
  "turkish",
  "wonders",
  "puerto",
  "apples",
  "citing",
  "mounted",
  "applause",
  "governing",
  "slope",
  "advisory",
  "dylan",
  "rebels",
  "fisher",
  "witnessed",
  "forming",
  "socks",
  "strictly",
  "carved",
  "senses",
  "slammed",
  "brushed",
  "initiated",
  "printing",
  "opposing",
  "succeeded",
  "manning",
  "scholar",
  "averaged",
  "tavis",
  "favored",
  "doubled",
  "sliding",
  "tenure",
  "surgeon",
  "mighty",
  "container",
  "lesser",
  "palms",
  "bulls",
  "relevance",
  "destiny",
  "knocking",
  "operated",
  "assure",
  "samsung",
  "dakota",
  "ballots",
  "samuel",
  "angela",
  "loudly",
  "tapes",
  "polite",
  "catches",
  "discount",
  "louder",
  "reverend",
  "novak",
  "bullying",
  "stressed",
  "skilled",
  "colleague",
  "tapped",
  "switched",
  "ripped",
  "rides",
  "sprinkle",
  "rejection",
  "glenn",
  "cleaned",
  "teddy",
  "visitor",
  "chiefs",
  "foolish",
  "scratch",
  "permits",
  "bizarre",
  "tourism",
  "miserable",
  "dreamed",
  "architect",
  "occupy",
  "leans",
  "receives",
  "palestine",
  "blamed",
  "gaining",
  "hometown",
  "formerly",
  "symphony",
  "vanilla",
  "stern",
  "routinely",
  "stark",
  "tensions",
  "derek",
  "youths",
  "bullets",
  "travelers",
  "armstrong",
  "watson",
  "domains",
  "crowds",
  "rodriguez",
  "andrea",
  "jeremy",
  "sympathy",
  "practiced",
  "religions",
  "scrutiny",
  "labels",
  "terribly",
  "cohort",
  "earliest",
  "hosts",
  "ancestors",
  "passive",
  "murders",
  "chasing",
  "batman",
  "prisoner",
  "dusty",
  "medieval",
  "annoying",
  "verse",
  "garcia",
  "bryant",
  "spencer",
  "searched",
  "farming",
  "gasps",
  "cheating",
  "trains",
  "buttons",
  "strongest",
  "observer",
  "matched",
  "weekends",
  "loses",
  "organisms",
  "yields",
  "subsidies",
  "peterson",
  "orlando",
  "abundance",
  "nearest",
  "equipped",
  "suburbs",
  "bridges",
  "wounds",
  "shocking",
  "homer",
  "lasted",
  "wasted",
  "kathy",
  "appealing",
  "patriots",
  "airplane",
  "costume",
  "parenting",
  "richmond",
  "tucson",
  "tumor",
  "surgical",
  "observing",
  "desirable",
  "irony",
  "lawsuits",
  "legendary",
  "theaters",
  "divisions",
  "blessing",
  "skeptical",
  "cheers",
  "warriors",
  "tires",
  "screens",
  "caribbean",
  "adverse",
  "tribune",
  "operator",
  "probe",
  "sentenced",
  "hates",
  "aurora",
  "statue",
  "valued",
  "inmates",
  "mandatory",
  "honored",
  "replacing",
  "imaging",
  "prophet",
  "germans",
  "kissing",
  "jupiter",
  "flashed",
  "enabled",
  "caroline",
  "rewards",
  "realizing",
  "oversight",
  "champagne",
  "dense",
  "workforce",
  "sophomore",
  "rested",
  "straw",
  "museums",
  "donors",
  "continent",
  "optimal",
  "clearing",
  "restored",
  "certified",
  "ounces",
  "vermont",
  "notions",
  "sweeping",
  "downs",
  "hudson",
  "recycling",
  "titled",
  "binding",
  "minimize",
  "sweater",
  "cookie",
  "murmured",
  "solved",
  "heather",
  "confusing",
  "retailers",
  "abraham",
  "somethin",
  "sentiment",
  "ranking",
  "drifted",
  "doubts",
  "clarity",
  "reduces",
  "premise",
  "dated",
  "hierarchy",
  "harrison",
  "histories",
  "cycles",
  "keyboard",
  "operates",
  "shelves",
  "hangs",
  "stevens",
  "casting",
  "tricks",
  "lloyd",
  "scenarios",
  "carrie",
  "seized",
  "severely",
  "pushes",
  "charm",
  "propose",
  "realities",
  "drawings",
  "taxpayer",
  "washing",
  "prevented",
  "convert",
  "cries",
  "speeches",
  "chains",
  "limiting",
  "bailey",
  "guides",
  "hightech",
  "investor",
  "popped",
  "commented",
  "sixteen",
  "randomly",
  "salaries",
  "archives",
  "closes",
  "hiking",
  "milwaukee",
  "violated",
  "blogger",
  "fried",
  "louise",
  "lasting",
  "routes",
  "trout",
  "thrust",
  "analyzing",
  "framed",
  "supper",
  "elevated",
  "freshly",
  "barnes",
  "arriving",
  "limbs",
  "compact",
  "aloud",
  "rotation",
  "lovers",
  "thesis",
  "sequences",
  "triple",
  "quantity",
  "mitch",
  "travis",
  "colony",
  "princeton",
  "bikes",
  "indirect",
  "towers",
  "maintains",
  "melissa",
  "selfish",
  "paradise",
  "shoved",
  "obstacles",
  "castro",
  "crude",
  "tucker",
  "spine",
  "peered",
  "severity",
  "integral",
  "victories",
  "packages",
  "processor",
  "slowed",
  "appearing",
  "surfaces",
  "raymond",
  "ashley",
  "judged",
  "shields",
  "exclusion",
  "threaten",
  "enables",
  "judging",
  "delight",
  "furious",
  "starr",
  "christie",
  "praying",
  "suspicion",
  "frames",
  "releases",
  "boundary",
  "hardest",
  "europeans",
  "risky",
  "dodgers",
  "therapist",
  "publicity",
  "aides",
  "confront",
  "damages",
  "charging",
  "lakers",
  "diameter",
  "poster",
  "targeting",
  "pipeline",
  "painter",
  "notre",
  "rental",
  "static",
  "scripture",
  "dorothy",
  "hatch",
  "regulate",
  "blonde",
  "hughes",
  "amazed",
  "pounding",
  "saturated",
  "speeds",
  "grunts",
  "resigned",
  "shout",
  "gazed",
  "lauren",
  "extract",
  "majors",
  "optional",
  "greta",
  "dangers",
  "glowing",
  "longest",
  "scholarly",
  "workshops",
  "shirts",
  "consumed",
  "storms",
  "hopeful",
  "blows",
  "flowing",
  "declare",
  "dessert",
  "kitty",
  "poland",
  "intel",
  "impaired",
  "normative",
  "declining",
  "tastes",
  "texture",
  "batteries",
  "contacted",
  "victoria",
  "martinez",
  "raiders",
  "shawn",
  "fortunate",
  "drought",
  "amongst",
  "invention",
  "dresses",
  "cameron",
  "deficits",
  "naval",
  "overview",
  "embraced",
  "exhibited",
  "idiots",
  "nitrogen",
  "weigh",
  "credible",
  "clusters",
  "ballet",
  "privately",
  "ellis",
  "stumbled",
  "mentor",
  "delegates",
  "imply",
  "operators",
  "mills",
  "goldman",
  "sensation",
  "utilities",
  "chile",
  "rooted",
  "ethan",
  "disputes",
  "footsteps",
  "fuels",
  "mickey",
  "slides",
  "forecast",
  "theirs",
  "blair",
  "cooling",
  "natalie",
  "arlington",
  "broth",
  "scouts",
  "falcons",
  "headline",
  "notebook",
  "customs",
  "locate",
  "travels",
  "arrives",
  "heated",
  "ensuring",
  "riley",
  "beats",
  "columns",
  "implied",
  "swinging",
  "kenneth",
  "canon",
  "optical",
  "sucked",
  "discharge",
  "sophie",
  "alternate",
  "roses",
  "terminal",
  "accidents",
  "purchases",
  "precision",
  "tribute",
  "cowboy",
  "stems",
  "designing",
  "chapters",
  "quarterly",
  "persian",
  "sealed",
  "recipient",
  "motel",
  "surrender",
  "coupled",
  "tokyo",
  "renewed",
  "centered",
  "dumped",
  "fourteen",
  "troubles",
  "comply",
  "spotlight",
  "defines",
  "chapel",
  "indicator",
  "artifacts",
  "urgent",
  "worrying",
  "dreaming",
  "marginal",
  "compost",
  "viewer",
  "gregory",
  "sweep",
  "servants",
  "harper",
  "judiciary",
  "predictor",
  "bloggers",
  "steadily",
  "chorus",
  "hosted",
  "visually",
  "flipped",
  "harmony",
  "thrilled",
  "siblings",
  "kisses",
  "onethird",
  "fictional",
  "inspector",
  "tense",
  "buses",
  "talkin",
  "albeit",
  "overtime",
  "relied",
  "extending",
  "curtains",
  "midwest",
  "computing",
  "whats",
  "griffin",
  "underwear",
  "moses",
  "finest",
  "charts",
  "editing",
  "proves",
  "idaho",
  "gravel",
  "robbery",
  "backwards",
  "rockies",
  "facial",
  "intake",
  "bloom",
  "depicted",
  "heating",
  "basin",
  "cottage",
  "cousins",
  "grounded",
  "fluency",
  "crews",
  "streams",
  "chick",
  "shades",
  "donated",
  "refuge",
  "flooding",
  "suited",
  "comics",
  "motive",
  "steering",
  "integrate",
  "indonesia",
  "possessed",
  "mushrooms",
  "password",
  "frontier",
  "penalties",
  "needle",
  "nutrients",
  "drilling",
  "pricing",
  "explosive",
  "conceived",
  "analogy",
  "candles",
  "tuned",
  "surveyed",
  "vendors",
  "haven",
  "pelosi",
  "nicely",
  "klein",
  "relates",
  "compounds",
  "carriers",
  "outlined",
  "admire",
  "listing",
  "whispers",
  "profiles",
  "pleaded",
  "interval",
  "competent",
  "finely",
  "motives",
  "intrinsic",
  "suitcase",
  "riders",
  "starring",
  "strains",
  "composite",
  "passages",
  "wasting",
  "broadly",
  "hazardous",
  "readings",
  "breathed",
  "phases",
  "utilized",
  "justices",
  "immunity",
  "factories",
  "subscribe",
  "thief",
  "arguably",
  "coded",
  "stuart",
  "fisheries",
  "slapped",
  "nashville",
  "minced",
  "dominate",
  "crashed",
  "venus",
  "rendered",
  "creepy",
  "finals",
  "convey",
  "lacks",
  "brady",
  "sundays",
  "mixing",
  "renewable",
  "nigeria",
  "platforms",
  "obsessed",
  "nexus",
  "statewide",
  "implicit",
  "sixty",
  "carson",
  "budgets",
  "kinsley",
  "aftermath",
  "breeding",
  "liane",
  "recruited",
  "peppers",
  "ringing",
  "planting",
  "thankful",
  "elites",
  "strips",
  "blocking",
  "smoked",
  "refusing",
  "parttime",
  "portable",
  "zealand",
  "cheer",
  "maternal",
  "serial",
  "blake",
  "selecting",
  "shells",
  "fellas",
  "trevor",
  "rationale",
  "thighs",
  "elders",
  "porter",
  "segments",
  "coding",
  "pursued",
  "ideals",
  "thirteen",
  "atomic",
  "newman",
  "wildly",
  "specialty",
  "warehouse",
  "ellie",
  "genuinely",
  "sleeve",
  "ranges",
  "waitress",
  "melted",
  "elvis",
  "cindy",
  "omaha",
  "lifts",
  "comet",
  "consume",
  "bryan",
  "rivals",
  "leverage",
  "generic",
  "someplace",
  "deserved",
  "wolves",
  "freezing",
  "formally",
  "waits",
  "hostages",
  "risen",
  "selective",
  "wandered",
  "bells",
  "proceeds",
  "canceled",
  "governors",
  "shortage",
  "denying",
  "retained",
  "danced",
  "spill",
  "slower",
  "volumes",
  "mario",
  "morally",
  "wines",
  "ensemble",
  "newest",
  "stakes",
  "simmer",
  "trans",
  "obtaining",
  "astros",
  "bloomberg",
  "byebye",
  "gloria",
  "translate",
  "sweden",
  "fitting",
  "clayton",
  "absorbed",
  "slipping",
  "treats",
  "strings",
  "secondly",
  "greeted",
  "argentina",
  "sensed",
  "certainty",
  "tracy",
  "listeners",
  "champions",
  "pitchers",
  "examines",
  "shotgun",
  "borrowed",
  "illegally",
  "premiere",
  "motors",
  "trainer",
  "holder",
  "curtis",
  "entries",
  "portrayed",
  "outlets",
  "memorable",
  "pitched",
  "boulevard",
  "ironic",
  "peaks",
  "poles",
  "fists",
  "zimmerman",
  "disposal",
  "processed",
  "reviewing",
  "portions",
  "lacked",
  "breakdown",
  "defended",
  "imports",
  "musician",
  "flags",
  "logan",
  "stephanie",
  "surviving",
  "handy",
  "marriages",
  "extends",
  "polished",
  "thrones",
  "peeled",
  "decorated",
  "carroll",
  "intervals",
  "concludes",
  "flawed",
  "allied",
  "loads",
  "survivor",
  "excerpt",
  "unified",
  "lending",
  "bowed",
  "jumps",
  "appendix",
  "communism",
  "cellular",
  "console",
  "connie",
  "patricia",
  "overly",
  "nodding",
  "tubes",
  "comin",
  "enacted",
  "offset",
  "talents",
  "taller",
  "chambers",
  "greed",
  "admiral",
  "regulated",
  "rosie",
  "stats",
  "burke",
  "exploded",
  "drafted",
  "yielded",
  "landmark",
  "albums",
  "christine",
  "linking",
  "mistaken",
  "outright",
  "kindle",
  "founders",
  "dominance",
  "stossel",
  "preserved",
  "offended",
  "swings",
  "packing",
  "wicked",
  "waiter",
  "megan",
  "affection",
  "leslie",
  "glancing",
  "sensors",
  "clues",
  "courtyard",
  "spelling",
  "primitive",
  "sporting",
  "gettin",
  "happier",
  "shark",
  "flavors",
  "favors",
  "licensed",
  "secured",
  "flashing",
  "deborah",
  "sunshine",
  "hugged",
  "smarter",
  "darker",
  "gestured",
  "neurons",
  "outdoors",
  "trait",
  "offerings",
  "guardian",
  "detention",
  "exceed",
  "elect",
  "grunting",
  "plains",
  "notices",
  "patted",
  "sideways",
  "browns",
  "interim",
  "ministers",
  "innocence",
  "crosses",
  "objection",
  "mentality",
  "palmer",
  "kicks",
  "undermine",
  "annoyed",
  "finances",
  "newton",
  "carlson",
  "ricky",
  "fairness",
  "shattered",
  "optimism",
  "causal",
  "monsters",
  "exchanges",
  "thorough",
  "genome",
  "respects",
  "needing",
  "cartoon",
  "manages",
  "rubbing",
  "seasonal",
  "kenya",
  "import",
  "topped",
  "warnings",
  "rented",
  "specimens",
  "preschool",
  "sandra",
  "genesis",
  "wrestling",
  "imported",
  "launching",
  "cooler",
  "withdraw",
  "doctoral",
  "hopkins",
  "corpse",
  "curry",
  "evenly",
  "shooter",
  "singapore",
  "ratios",
  "begging",
  "chickens",
  "groans",
  "systemic",
  "basil",
  "feathers",
  "recruit",
  "posters",
  "damaging",
  "serum",
  "glorious",
  "subjected",
  "husbands",
  "gonzalez",
  "crust",
  "lookin",
  "panthers",
  "offenders",
  "forbes",
  "jerked",
  "diplomacy",
  "stripped",
  "affective",
  "feminine",
  "gestures",
  "curricula",
  "descent",
  "hardy",
  "preheat",
  "hosting",
  "carrots",
  "echoed",
  "refuses",
  "messed",
  "grilled",
  "sydney",
  "cheat",
  "paperwork",
  "robots",
  "alfred",
  "laurie",
  "ducks",
  "relying",
  "relies",
  "mouths",
  "censored",
  "costa",
  "brett",
  "ravens",
  "ranger",
  "breed",
  "phrases",
  "shouts",
  "queens",
  "matthews",
  "stimuli",
  "preceding",
  "candle",
  "supporter",
  "clinics",
  "bowls",
  "fertility",
  "combining",
  "deployed",
  "dragging",
  "tilted",
  "superman",
  "coleman",
  "blaming",
  "whisk",
  "enron",
  "marvel",
  "toyota",
  "delighted",
  "swiss",
  "releasing",
  "cracks",
  "folder",
  "discusses",
  "margins",
  "teaspoons",
  "viruses",
  "fixing",
  "searches",
  "isaac",
  "cardinal",
  "rusty",
  "wishing",
  "squash",
  "persuade",
  "cautious",
  "elbows",
  "outline",
  "sensible",
  "steelers",
  "walmart",
  "runners",
  "educator",
  "chloe",
  "realizes",
  "mustard",
  "prayed",
  "endorsed",
  "praised",
  "supplied",
  "pretended",
  "interrupt",
  "cooperate",
  "joking",
  "joshua",
  "sponsors",
  "proving",
  "surplus",
  "spark",
  "freaking",
  "animated",
  "circus",
  "seventeen",
  "stresses",
  "nerves",
  "fastest",
  "boiling",
  "rounded",
  "cheering",
  "smallest",
  "emerges",
  "busted",
  "wandering",
  "auburn",
  "gabriel",
  "excuses",
  "computed",
  "repeating",
  "closure",
  "holdings",
  "easter",
  "hispanics",
  "floated",
  "roasted",
  "traces",
  "mapping",
  "reinforce",
  "meredith",
  "dietary",
  "lanes",
  "confined",
  "fragments",
  "julian",
  "reliance",
  "lengthy",
  "streaming",
  "varies",
  "wyoming",
  "nicholas",
  "lectures",
  "parkway",
  "meter",
  "enabling",
  "olivia",
  "calculate",
  "crossfire",
  "frankie",
  "fountain",
  "corrected",
  "compiled",
  "prejudice",
  "schemes",
  "demons",
  "deviation",
  "felony",
  "newer",
  "hercules",
  "clara",
  "secretly",
  "violet",
  "thereof",
  "criticize",
  "peninsula",
  "enjoys",
  "tricky",
  "atoms",
  "saturn",
  "piled",
  "dont",
  "walsh",
  "residual",
  "commands",
  "wires",
  "powered",
  "carla",
  "conan",
  "mines",
  "delivers",
  "packs",
  "mattress",
  "mastery",
  "pupils",
  "commodity",
  "nervously",
  "betrayed",
  "spilled",
  "timely",
  "precedent",
  "limbaugh",
  "oddly",
  "refusal",
  "outreach",
  "homemade",
  "repeal",
  "delays",
  "nintendo",
  "sacks",
  "prevalent",
  "poses",
  "delaware",
  "liberties",
  "myers",
  "statutes",
  "premier",
  "grains",
  "biased",
  "livestock",
  "particle",
  "prairie",
  "nobel",
  "elaine",
  "brenda",
  "hawks",
  "portraits",
  "bushes",
  "christina",
  "scotland",
  "flaws",
  "contend",
  "massage",
  "hormone",
  "raced",
  "stamps",
  "vaguely",
  "boeing",
  "stretches",
  "cycling",
  "necklace",
  "bankers",
  "comprised",
  "chili",
  "dancer",
  "meyer",
  "woody",
  "stacked",
  "appetite",
  "singles",
  "revision",
  "luckily",
  "rigorous",
  "markers",
  "visions",
  "revival",
  "learner",
  "tablets",
  "figuring",
  "rainbow",
  "masks",
  "cardboard",
  "slick",
  "fishery",
  "rituals",
  "endure",
  "shepherd",
  "broker",
  "baseman",
  "debbie",
  "promotes",
  "alltime",
  "valentine",
  "gerald",
  "shoots",
  "spiral",
  "testers",
  "literal",
  "healthier",
  "opener",
  "tissues",
  "locks",
  "offseason",
  "throne",
  "lifelong",
  "niche",
  "joyce",
  "thermal",
  "evolving",
  "stirred",
  "condemned",
  "feminism",
  "depths",
  "offshore",
  "resign",
  "puzzled",
  "starving",
  "advise",
  "grammar",
  "basics",
  "handles",
  "successes",
  "surprises",
  "donation",
  "distances",
  "curls",
  "marco",
  "backpack",
  "communal",
  "confess",
  "stained",
  "probable",
  "concerts",
  "balloon",
  "assert",
  "develops",
  "monitors",
  "denise",
  "elliott",
  "colonies",
  "handing",
  "mentions",
  "pools",
  "grabbing",
  "strokes",
  "darwin",
  "saucepan",
  "clarence",
  "tasted",
  "arrests",
  "briefing",
  "flooded",
  "differed",
  "textbooks",
  "debts",
  "plots",
  "whistle",
  "sherman",
  "settling",
  "obsession",
  "lottery",
  "packers",
  "manifest",
  "preseason",
  "maximize",
  "truths",
  "interfere",
  "forbidden",
  "balancing",
  "ontario",
  "saves",
  "tolerate",
  "violate",
  "allison",
  "punished",
  "blankets",
  "chuckled",
  "synthetic",
  "marietta",
  "priced",
  "pavement",
  "turtles",
  "choir",
  "timeline",
  "pierce",
  "angles",
  "cloves",
  "sonny",
  "disclose",
  "switching",
  "doomed",
  "servers",
  "posture",
  "triggered",
  "glared",
  "punish",
  "lester",
  "battered",
  "carpenter",
  "premiums",
  "exhibits",
  "chrysler",
  "comeback",
  "turnout",
  "audrey",
  "crawford",
  "trades",
  "sensor",
  "rocking",
  "reversed",
  "crafts",
  "remedy",
  "neglected",
  "saddle",
  "scarf",
  "troubling",
  "headache",
  "twoyear",
  "altar",
  "dancers",
  "blades",
  "sprint",
  "probation",
  "graves",
  "vicious",
  "deleted",
  "clutching",
  "marital",
  "circular",
  "descended",
  "gasped",
  "consult",
  "lengths",
  "haunted",
  "contempt",
  "calvin",
  "henderson",
  "compelled",
  "memoir",
  "hedge",
  "acids",
  "strangely",
  "uniforms",
  "pipes",
  "netanyahu",
  "planetary",
  "fills",
  "barrels",
  "resistant",
  "imaginary",
  "truman",
  "sammy",
  "capita",
  "showbiz",
  "vaccines",
  "moonlight",
  "mattered",
  "forums",
  "saturdays",
  "subscale",
  "andrews",
  "intimacy",
  "freed",
  "crises",
  "poetic",
  "kindness",
  "gripped",
  "quayle",
  "easiest",
  "prisons",
  "averaging",
  "dolphins",
  "nicky",
  "mornings",
  "parameter",
  "remark",
  "weeds",
  "carriage",
  "calmly",
  "textual",
  "flung",
  "helpless",
  "enhancing",
  "slips",
  "serbs",
  "athens",
  "robertson",
  "downward",
  "peggy",
  "outlet",
  "ambiguous",
  "caption",
  "labour",
  "suppliers",
  "savannah",
  "patty",
  "accord",
  "savage",
  "flushed",
  "colts",
  "licenses",
  "romans",
  "guiding",
  "thailand",
  "coats",
  "patches",
  "preview",
  "rider",
  "machinery",
  "camping",
  "sticky",
  "threads",
  "hayes",
  "bacterial",
  "offspring",
  "tweets",
  "coins",
  "sweating",
  "fishermen",
  "theorists",
  "miniature",
  "schooling",
  "clicking",
  "snakes",
  "galleries",
  "reign",
  "tones",
  "ferguson",
  "cherokee",
  "wholly",
  "nowadays",
  "predators",
  "librarian",
  "mistress",
  "whipped",
  "warmer",
  "losers",
  "directing",
  "myths",
  "artwork",
  "shipped",
  "teachings",
  "batting",
  "prevents",
  "winston",
  "airports",
  "clenched",
  "ruins",
  "spinach",
  "realism",
  "fools",
  "modernity",
  "exclaimed",
  "foremost",
  "nasdaq",
  "pitches",
  "buddies",
  "crawled",
  "enjoyment",
  "piles",
  "replies",
  "observes",
  "swollen",
  "dripping",
  "dental",
  "carolyn",
  "wreck",
  "sinking",
  "santorum",
  "coffin",
  "decreases",
  "patterson",
  "bonnie",
  "katherine",
  "gardening",
  "render",
  "shootings",
  "summers",
  "pathways",
  "campuses",
  "adrian",
  "successor",
  "tearing",
  "muddy",
  "siegel",
  "jenkins",
  "vibrant",
  "explorer",
  "whitney",
  "chooses",
  "chefs",
  "arises",
  "exploit",
  "rankings",
  "vince",
  "teammate",
  "marsh",
  "draped",
  "feasible",
  "scanned",
  "sanchez",
  "breach",
  "lethal",
  "diamonds",
  "casually",
  "benny",
  "gauge",
  "geraldo",
  "narrowed",
  "samantha",
  "nationals",
  "poets",
  "statutory",
  "startup",
  "uncovered",
  "lindsay",
  "perched",
  "wagner",
  "lateral",
  "shrink",
  "poised",
  "programme",
  "lousy",
  "fouryear",
  "gallon",
  "lenses",
  "batter",
  "electron",
  "marker",
  "frederick",
  "ambition",
  "disasters",
  "imagining",
  "cursed",
  "keywords",
  "crashing",
  "rehearsal",
  "radically",
  "singers",
  "cleaner",
  "tackles",
  "fridge",
  "mentoring",
  "deserted",
  "monroe",
  "fiveyear",
  "woodruff",
  "imposing",
  "gases",
  "patrons",
  "curved",
  "mainland",
  "flush",
  "traumatic",
  "halls",
  "morrison",
  "marilyn",
  "traced",
  "licensing",
  "heavier",
  "killers",
  "utilize",
  "oneself",
  "mineral",
  "marched",
  "subscales",
  "defenses",
  "scratched",
  "ankles",
  "curves",
  "froze",
  "readiness",
  "transfers",
  "dateline",
  "leisure",
  "genocide",
  "catcher",
  "rosemary",
  "smoothly",
  "misses",
  "sleeves",
  "proudly",
  "explores",
  "thrill",
  "situated",
  "gangs",
  "seller",
  "panting",
  "momma",
  "robbed",
  "modem",
  "responds",
  "eleanor",
  "mound",
  "notorious",
  "arrogant",
  "lively",
  "defender",
  "bounced",
  "willis",
  "punched",
  "darkened",
  "borrowing",
  "gardner",
  "cornell",
  "schedules",
  "clicked",
  "oceans",
  "layout",
  "trousers",
  "overlap",
  "milky",
  "michel",
  "sincere",
  "shelters",
  "veins",
  "bites",
  "covenant",
  "fueled",
  "anova",
  "minus",
  "perimeter",
  "lowering",
  "freeman",
  "slightest",
  "hitter",
  "remainder",
  "stimulate",
  "becky",
  "perfume",
  "mindset",
  "norway",
  "filters",
  "eased",
  "rests",
  "drifting",
  "ambiguity",
  "swedish",
  "joints",
  "strive",
  "virtues",
  "sudan",
  "manners",
  "displaced",
  "pervasive",
  "triangle",
  "seals",
  "vanessa",
  "marcia",
  "elliot",
  "filthy",
  "heroic",
  "wyatt",
  "exchanged",
  "lipstick",
  "slowing",
  "motions",
  "simpler",
  "aligned",
  "holland",
  "gilbert",
  "passport",
  "tightened",
  "lenders",
  "denies",
  "evidently",
  "repairs",
  "kelley",
  "florence",
  "freedoms",
  "marvin",
  "paste",
  "climbs",
  "phoebe",
  "shoppers",
  "footnote",
  "colombia",
  "mounting",
  "lieberman",
  "michele",
  "costumes",
  "roommate",
  "tactic",
  "asteroid",
  "anonymity",
  "mortgages",
  "exterior",
  "specify",
  "activism",
  "netflix",
  "skywalker",
  "pumps",
  "africans",
  "tracked",
  "scanning",
  "plague",
  "andre",
  "messenger",
  "geneva",
  "hostility",
  "finale",
  "defenders",
  "knicks",
  "shannon",
  "mortal",
  "floyd",
  "folding",
  "noticing",
  "eyebrow",
  "dangling",
  "edgar",
  "restrict",
  "whilst",
  "randall",
  "mutually",
  "rebellion",
  "prose",
  "nascar",
  "mosque",
  "rumsfeld",
  "lydia",
  "govern",
  "vernon",
  "policeman",
  "marching",
  "boasts",
  "kosovo",
  "verge",
  "awaiting",
  "sensory",
  "claude",
  "soaked",
  "continuum",
  "handson",
  "agnes",
  "baylor",
  "wrists",
  "venezuela",
  "johns",
  "doses",
  "worthless",
  "newsweek",
  "stressful",
  "sterling",
  "begged",
  "databases",
  "peering",
  "reactor",
  "methodist",
  "seafood",
  "decisive",
  "equations",
  "endured",
  "sworn",
  "prompt",
  "gallons",
  "insect",
  "wander",
  "alignment",
  "clergy",
  "ramsey",
  "medicines",
  "amended",
  "gradual",
  "cleanup",
  "messy",
  "mentors",
  "shutdown",
  "whereby",
  "receivers",
  "neural",
  "montreal",
  "victorian",
  "evelyn",
  "crouched",
  "phillip",
  "pinch",
  "thinly",
  "formats",
  "auditory",
  "stabbed",
  "primaries",
  "sequel",
  "sunni",
  "eternity",
  "bodily",
  "twisting",
  "bankrupt",
  "norfolk",
  "grated",
  "deposits",
  "simmons",
  "quoting",
  "settlers",
  "beams",
  "diving",
  "acquiring",
  "bully",
  "urgency",
  "hottest",
  "plasma",
  "weary",
  "automated",
  "remarked",
  "chunks",
  "binary",
  "shane",
  "patio",
  "pledged",
  "killings",
  "filming",
  "tugged",
  "flynn",
  "embodied",
  "hiphop",
  "bulletin",
  "illnesses",
  "notified",
  "ports",
  "melting",
  "mcconnell",
  "cease",
  "differing",
  "getty",
  "burton",
  "monitored",
  "archive",
  "pinned",
  "trustees",
  "bailout",
  "planners",
  "feeds",
  "initiate",
  "textbook",
  "tangible",
  "staffers",
  "sailing",
  "nasal",
  "pathway",
  "persuaded",
  "apollo",
  "linux",
  "brightly",
  "diced",
  "greeting",
  "exceeded",
  "sausage",
  "sheila",
  "scrambled",
  "jackets",
  "shiite",
  "sucking",
  "beers",
  "drowned",
  "predicts",
  "staircase",
  "disclosed",
  "sugars",
  "propped",
  "knives",
  "rightly",
  "fella",
  "friedman",
  "iconic",
  "retiring",
  "foliage",
  "minerals",
  "paramount",
  "consuming",
  "sings",
  "disgust",
  "pains",
  "handbook",
  "politely",
  "cochran",
  "accusing",
  "cigar",
  "evenings",
  "melody",
  "yanked",
  "attic",
  "rescued",
  "ventures",
  "modeled",
  "depot",
  "combines",
  "protects",
  "patents",
  "hubble",
  "lettuce",
  "diesel",
  "sparked",
  "avoidance",
  "robbie",
  "jared",
  "believer",
  "skiers",
  "betsy",
  "animation",
  "connor",
  "wordpress",
  "salesman",
  "apparatus",
  "provinces",
  "dared",
  "paranoid",
  "heavens",
  "sellers",
  "frances",
  "squinted",
  "canned",
  "mysteries",
  "anyways",
  "endeavor",
  "forensic",
  "mutant",
  "honda",
  "dwight",
  "consist",
  "genetics",
  "yorker",
  "pumping",
  "blinking",
  "enjoyable",
  "prostate",
  "pauses",
  "generates",
  "miguel",
  "smashed",
  "stein",
  "bubbles",
  "judgement",
  "performs",
  "earnest",
  "disciples",
  "scars",
  "doubles",
  "clips",
  "winding",
  "renewal",
  "explode",
  "crawling",
  "cheryl",
  "governed",
  "bowling",
  "juliet",
  "blended",
  "underway",
  "cooks",
  "greene",
  "decay",
  "warns",
  "righteous",
  "offenses",
  "linen",
  "briefcase",
  "sights",
  "promptly",
  "amusement",
  "sabrina",
  "claws",
  "needles",
  "metals",
  "activated",
  "commons",
  "greedy",
  "postal",
  "brighter",
  "hampton",
  "threatens",
  "nursery",
  "latinos",
  "proceeded",
  "bothering",
  "pragmatic",
  "butterfly",
  "chess",
  "viewpoint",
  "flashes",
  "comedian",
  "fibers",
  "freezer",
  "reuters",
  "bulbs",
  "hobby",
  "chelsea",
  "fries",
  "weaker",
  "attendant",
  "uncommon",
  "stall",
  "sleek",
  "ideally",
  "impress",
  "boomers",
  "palette",
  "stahl",
  "clarke",
  "boarding",
  "freeway",
  "whales",
  "aristotle",
  "postwar",
  "clutched",
  "strained",
  "cosby",
  "littleton",
  "slopes",
  "prototype",
  "vitamins",
  "feminists",
  "coached",
  "gamble",
  "bronx",
  "tweeted",
  "communion",
  "finishes",
  "massacre",
  "jerome",
  "cardiac",
  "plaintiff",
  "showcase",
  "richards",
  "fracture",
  "eventual",
  "fitted",
  "tumors",
  "rewarding",
  "chased",
  "crooked",
  "patriot",
  "mandela",
  "isaiah",
  "wrinkled",
  "softened",
  "unusually",
  "violating",
  "armies",
  "fuller",
  "touring",
  "pastel",
  "tangled",
  "shaken",
  "shirley",
  "intervene",
  "realtime",
  "railing",
  "generals",
  "prefers",
  "declines",
  "trademark",
  "butcher",
  "bosses",
  "slumped",
  "mandated",
  "reggie",
  "swamp",
  "daniels",
  "thanked",
  "reminding",
  "belle",
  "slams",
  "troop",
  "outsiders",
  "dread",
  "antiques",
  "kimberly",
  "schorr",
  "benefited",
  "goddess",
  "taxation",
  "cereal",
  "snorted",
  "cheerful",
  "vastly",
  "metaphors",
  "rodney",
  "shredded",
  "differs",
  "shrugs",
  "pierre",
  "relay",
  "moist",
  "printer",
  "sting",
  "longing",
  "grandson",
  "mammals",
  "lindsey",
  "solomon",
  "mercedes",
  "owens",
  "richer",
  "turnover",
  "sharks",
  "bastards",
  "greet",
  "staged",
  "savvy",
  "rubio",
  "definite",
  "mustache",
  "remotely",
  "composer",
  "scarce",
  "barney",
  "tshirts",
  "betting",
  "steer",
  "jonah",
  "harlem",
  "decatur",
  "traders",
  "credited",
  "strands",
  "artillery",
  "collector",
  "cancers",
  "charities",
  "resembles",
  "hernandez",
  "verizon",
  "spice",
  "sipped",
  "strode",
  "prestige",
  "trailing",
  "marion",
  "stray",
  "bouncing",
  "fearful",
  "specifics",
  "sailor",
  "resisted",
  "clung",
  "creators",
  "hunched",
  "snatched",
  "fines",
  "flown",
  "echoes",
  "wiping",
  "soils",
  "diplomats",
  "freddie",
  "headnote",
  "paired",
  "rewarded",
  "jacobs",
  "openness",
  "homers",
  "equals",
  "listens",
  "persist",
  "confessed",
  "rifles",
  "lowfat",
  "numerical",
  "skirts",
  "devotion",
  "swore",
  "exits",
  "lakewood",
  "brushing",
  "tract",
  "freud",
  "goose",
  "preaching",
  "directory",
  "pastoral",
  "accompany",
  "felix",
  "hazards",
  "wasnt",
  "singular",
  "vancouver",
  "superb",
  "lamps",
  "boris",
  "broccoli",
  "habitats",
  "chargers",
  "proposing",
  "groaned",
  "earrings",
  "declaring",
  "tactical",
  "monkeys",
  "vienna",
  "cheated",
  "manny",
  "americas",
  "hostess",
  "circled",
  "splash",
  "norton",
  "swiftly",
  "herbert",
  "isabel",
  "undergo",
  "piper",
  "impatient",
  "sparks",
  "tenants",
  "improves",
  "discrete",
  "wired",
  "worms",
  "frasier",
  "muscular",
  "sidney",
  "agreeing",
  "messing",
  "storyline",
  "exposing",
  "deepest",
  "graders",
  "performer",
  "preorder",
  "bullpen",
  "startling",
  "pillows",
  "barking",
  "alumni",
  "bending",
  "villain",
  "hints",
  "cites",
  "stupidity",
  "deputies",
  "dances",
  "venues",
  "valerie",
  "ambitions",
  "battling",
  "grapes",
  "chicks",
  "luggage",
  "marrying",
  "employing",
  "diets",
  "sleepy",
  "veronica",
  "granite",
  "beatles",
  "parted",
  "riots",
  "islamist",
  "schwartz",
  "groceries",
  "pursuant",
  "judith",
  "recruits",
  "dolls",
  "cakes",
  "cracking",
  "concealed",
  "shapiro",
  "harmless",
  "tornado",
  "denmark",
  "poked",
  "autopsy",
  "suffers",
  "arthritis",
  "outbreaks",
  "alicia",
  "leaked",
  "protocols",
  "backlash",
  "quicker",
  "freelance",
  "favourite",
  "villagers",
  "referral",
  "taped",
  "clearer",
  "framing",
  "curly",
  "rains",
  "brooke",
  "sebastian",
  "medals",
  "grease",
  "extracted",
  "ropes",
  "garth",
  "lingering",
  "thieves",
  "downhill",
  "dawson",
  "signaling",
  "groaning",
  "recycled",
  "dixon",
  "blink",
  "tossing",
  "roswell",
  "scarcely",
  "protested",
  "restraint",
  "garrett",
  "iranians",
  "verses",
  "herman",
  "kindly",
  "tenth",
  "mumbled",
  "finite",
  "presently",
  "toddler",
  "drake",
  "popping",
  "mediation",
  "dudes",
  "paints",
  "derive",
  "rendering",
  "salient",
  "troll",
  "jenna",
  "thinkers",
  "destined",
  "sweaty",
  "booked",
  "logging",
  "restless",
  "buster",
  "gateway",
  "spoiled",
  "stink",
  "whining",
  "paradox",
  "exposures",
  "debated",
  "dissolve",
  "huddled",
  "archer",
  "accepts",
  "webster",
  "collision",
  "skating",
  "famously",
  "cocked",
  "enforced",
  "natives",
  "drums",
  "crashes",
  "spicy",
  "backdrop",
  "hissed",
  "leaks",
  "ramirez",
  "spouses",
  "bumps",
  "albany",
  "stalin",
  "schmidt",
  "dinners",
  "dissent",
  "pamela",
  "classics",
  "weakened",
  "wetlands",
  "seize",
  "pedagogy",
  "champ",
  "commanded",
  "highways",
  "generator",
  "denny",
  "shivering",
  "globally",
  "thyme",
  "alison",
  "premises",
  "civilized",
  "cockpit",
  "diffusion",
  "perez",
  "presses",
  "daring",
  "pastry",
  "growers",
  "hisher",
  "anita",
  "shrinking",
  "carnegie",
  "trope",
  "holders",
  "goldberg",
  "cavuto",
  "cables",
  "prolife",
  "crater",
  "painters",
  "departed",
  "outraged",
  "seating",
  "youve",
  "pointless",
  "amusing",
  "aiming",
  "genres",
  "confirms",
  "mandates",
  "podcast",
  "folds",
  "bosnian",
  "fantasies",
  "jammed",
  "renowned",
  "metric",
  "snaps",
  "ethic",
  "shivered",
  "proxy",
  "appealed",
  "leftist",
  "sprawling",
  "drones",
  "squares",
  "brokers",
  "milton",
  "chavez",
  "freddy",
  "landlord",
  "blessings",
  "trent",
  "deceased",
  "sincerely",
  "attain",
  "excluding",
  "embargo",
  "wildcats",
  "marina",
  "posttest",
  "obese",
  "nodes",
  "nichols",
  "plunged",
  "poorer",
  "buffy",
  "educating",
  "employs",
  "tryin",
  "gasping",
  "ceramic",
  "depended",
  "coughing",
  "retrieve",
  "overhaul",
  "packaging",
  "wesley",
  "watts",
  "owning",
  "spectacle",
  "naomi",
  "rouge",
  "syracuse",
  "drowning",
  "tunes",
  "erica",
  "alliances",
  "electrons",
  "freshmen",
  "securing",
  "suntimes",
  "starbucks",
  "creep",
  "subtitles",
  "cafeteria",
  "gunshot",
  "tiles",
  "marking",
  "martial",
  "republics",
  "lasts",
  "reallife",
  "lilly",
  "meadow",
  "accuse",
  "dresser",
  "biting",
  "summoned",
  "cubic",
  "superstar",
  "elevation",
  "periodic",
  "durable",
  "organism",
  "hilton",
  "rugged",
  "deeds",
  "gibbs",
  "apologies",
  "sunrise",
  "withdrew",
  "damon",
  "icons",
  "heartbeat",
  "filmmaker",
  "dividing",
  "vanity",
  "fleeing",
  "expresses",
  "assign",
  "hairs",
  "examiner",
  "barber",
  "treaties",
  "mourning",
  "foreman",
  "pounded",
  "wrapping",
  "razor",
  "miners",
  "snapping",
  "stump",
  "augustine",
  "valve",
  "pumped",
  "strap",
  "cellphone",
  "tails",
  "mediated",
  "buffer",
  "booming",
  "populated",
  "wholesale",
  "salvador",
  "detained",
  "rulers",
  "eliot",
  "coward",
  "arsenal",
  "colour",
  "portray",
  "intends",
  "retailer",
  "renee",
  "underwent",
  "prophets",
  "undertake",
  "hopeless",
  "presumed",
  "willow",
  "slack",
  "induce",
  "brightest",
  "roller",
  "sparkling",
  "stella",
  "kurtz",
  "prizes",
  "jessie",
  "captures",
  "capturing",
  "sneakers",
  "wakes",
  "dante",
  "discarded",
  "bookstore",
  "energetic",
  "addicted",
  "rocked",
  "prophecy",
  "banker",
  "ronnie",
  "currents",
  "entertain",
  "tariffs",
  "clubhouse",
  "conrad",
  "bakery",
  "cognition",
  "excel",
  "headaches",
  "stroked",
  "yearly",
  "rattled",
  "compares",
  "chapman",
  "maurice",
  "crumpled",
  "ignores",
  "swelling",
  "nokia",
  "vault",
  "resorts",
  "comey",
  "favour",
  "opted",
  "softball",
  "highend",
  "weiss",
  "takeover",
  "leaped",
  "choked",
  "crunch",
  "utilizing",
  "impacted",
  "drying",
  "exams",
  "fairfax",
  "reservoir",
  "siege",
  "portal",
  "aquatic",
  "proposes",
  "roaring",
  "slippery",
  "traveler",
  "turnovers",
  "dementia",
  "snacks",
  "scottish",
  "contests",
  "nolan",
  "canopy",
  "averages",
  "assemble",
  "harriet",
  "vargas",
  "reset",
  "prevail",
  "exempt",
  "jacques",
  "apartheid",
  "chandler",
  "legends",
  "weber",
  "relieve",
  "shuddered",
  "contends",
  "vines",
  "goodman",
  "conductor",
  "chores",
  "evidenced",
  "sniffed",
  "chewed",
  "spilling",
  "uniquely",
  "embracing",
  "esther",
  "allergic",
  "pensions",
  "hauled",
  "sears",
  "filmed",
  "newcomers",
  "remedies",
  "stain",
  "strand",
  "poultry",
  "reviewers",
  "steroids",
  "widened",
  "mandy",
  "logistic",
  "speeding",
  "shutting",
  "strapped",
  "anaheim",
  "shanghai",
  "connects",
  "betrayal",
  "libby",
  "foley",
  "boycott",
  "maxwell",
  "brennan",
  "sailors",
  "liable",
  "cliffs",
  "melanie",
  "bella",
  "pretest",
  "defects",
  "thriving",
  "malaria",
  "metabolic",
  "tester",
  "restoring",
  "oversees",
  "chaotic",
  "tighter",
  "mulder",
  "greatness",
  "seeming",
  "rubin",
  "doubted",
  "rivera",
  "reese",
  "arising",
  "benign",
  "debating",
  "versatile",
  "haley",
  "stripes",
  "trailed",
  "peasant",
  "wouldbe",
  "immoral",
  "exploited",
  "smash",
  "cathy",
  "belts",
  "condemn",
  "exercised",
  "traps",
  "flowed",
  "graceful",
  "stride",
  "vivian",
  "claudia",
  "levin",
  "treasures",
  "churchill",
  "emanuel",
  "dictate",
  "fallout",
  "devised",
  "faintly",
  "distorted",
  "emerson",
  "tents",
  "teasing",
  "isolates",
  "needless",
  "stigma",
  "dragons",
  "aired",
  "planner",
  "dinosaurs",
  "congo",
  "clinging",
  "aerial",
  "suppress",
  "contested",
  "swirling",
  "bathing",
  "grind",
  "flicked",
  "malaysia",
  "raining",
  "seventy",
  "puppet",
  "relaxing",
  "termed",
  "drawers",
  "savior",
  "tasty",
  "tasting",
  "seahawks",
  "fractures",
  "shovel",
  "oblivious",
  "violently",
  "subset",
  "richest",
  "forge",
  "bonuses",
  "minded",
  "speculate",
  "hoover",
  "scans",
  "rushes",
  "newborn",
  "shelly",
  "peters",
  "shaved",
  "jules",
  "audition",
  "pulitzer",
  "trimmed",
  "baldwin",
  "poisoning",
  "torch",
  "gardeners",
  "depicts",
  "stacks",
  "workouts",
  "cosmos",
  "lunden",
  "tesla",
  "lobster",
  "keller",
  "midway",
  "bounds",
  "wherein",
  "morton",
  "township",
  "arrows",
  "pines",
  "zombies",
  "patiently",
  "doyle",
  "passions",
  "wardrobe",
  "lastly",
  "richie",
  "erupted",
  "consulate",
  "devote",
  "resembled",
  "knights",
  "sonic",
  "bidding",
  "painfully",
  "eyelids",
  "ducked",
  "patriotic",
  "motivate",
  "elephants",
  "conquest",
  "thirsty",
  "claus",
  "barred",
  "eagerly",
  "labeling",
  "farewell",
  "parallels",
  "acoustic",
  "alarming",
  "distract",
  "brendan",
  "pedro",
  "schumer",
  "illicit",
  "elena",
  "aspen",
  "recount",
  "payne",
  "dubious",
  "heavenly",
  "airplanes",
  "obliged",
  "enlisted",
  "madrid",
  "realise",
  "abrams",
  "crafted",
  "contrasts",
  "armored",
  "secrecy",
  "leaps",
  "scandals",
  "tutoring",
  "glowed",
  "receipt",
  "pluralism",
  "spinal",
  "venice",
  "intellect",
  "token",
  "unveiled",
  "probes",
  "forged",
  "chang",
  "growled",
  "schneider",
  "danish",
  "digest",
  "baskets",
  "chrome",
  "versa",
  "messiah",
  "outsider",
  "dolly",
  "scalp",
  "rubble",
  "brent",
  "watergate",
  "moody",
  "sayin",
  "offender",
  "prohibit",
  "marxist",
  "episcopal",
  "layoffs",
  "financed",
  "warmed",
  "paige",
  "bingo",
  "ruler",
  "intricate",
  "conform",
  "guatemala",
  "intensely",
  "energies",
  "roared",
  "locke",
  "wally",
  "spreads",
  "newport",
  "ethiopia",
  "styling",
  "shave",
  "cutter",
  "screws",
  "fooled",
  "sachs",
  "barton",
  "malone",
  "breaths",
  "reacted",
  "disguise",
  "factions",
  "surgeons",
  "declares",
  "diplomat",
  "browned",
  "bricks",
  "benson",
  "appraisal",
  "preach",
  "nailed",
  "monty",
  "arrogance",
  "mutations",
  "guinea",
  "resumed",
  "bleed",
  "butch",
  "shelby",
  "newark",
  "unlocked",
  "therapies",
  "switches",
  "leapt",
  "showers",
  "bedrooms",
  "verified",
  "seasoned",
  "clearance",
  "intrigued",
  "levine",
  "sonya",
  "crushing",
  "moose",
  "dissolved",
  "meadows",
  "pauline",
  "shortstop",
  "geeks",
  "circling",
  "cellar",
  "persona",
  "clint",
  "hungary",
  "carey",
  "biases",
  "allocated",
  "phony",
  "twenties",
  "removes",
  "buddhist",
  "wastes",
  "kabul",
  "pottery",
  "peasants",
  "charcoal",
  "cabinets",
  "famed",
  "arched",
  "trusting",
  "singled",
  "rejecting",
  "deception",
  "yells",
  "predator",
  "shores",
  "nucleus",
  "fertile",
  "cramped",
  "panetta",
  "darcy",
  "rainy",
  "intuitive",
  "disagreed",
  "contender",
  "amazingly",
  "regrets",
  "rivalry",
  "brink",
  "spear",
  "woodward",
  "magnet",
  "austria",
  "banning",
  "endurance",
  "licked",
  "volcano",
  "granting",
  "feather",
  "asians",
  "analogous",
  "clockwise",
  "frowning",
  "validated",
  "sprang",
  "precinct",
  "knocks",
  "tailored",
  "sensing",
  "uprising",
  "strauss",
  "endowment",
  "recorder",
  "rotating",
  "pleading",
  "beatrice",
  "motioned",
  "garner",
  "maritime",
  "devils",
  "winked",
  "stacy",
  "ninety",
  "sophia",
  "chilling",
  "bothers",
  "remedial",
  "halftime",
  "grunted",
  "spins",
  "roberta",
  "pundits",
  "tumbled",
  "celtics",
  "apostles",
  "cruising",
  "retirees",
  "reversal",
  "bolts",
  "sailed",
  "scrub",
  "rodgers",
  "kristen",
  "dayton",
  "directs",
  "judaism",
  "sketches",
  "airborne",
  "villa",
  "schieffer",
  "jarriel",
  "whitman",
  "cocacola",
  "forgiven",
  "bruno",
  "cubes",
  "grouped",
  "renal",
  "corey",
  "dominican",
  "discard",
  "shitty",
  "benedict",
  "prompting",
  "johnston",
  "atlas",
  "paralyzed",
  "condo",
  "knots",
  "defence",
  "shortages",
  "blender",
  "baron",
  "councils",
  "unite",
  "caleb",
  "striped",
  "symposium",
  "psycho",
  "simulated",
  "intently",
  "corpus",
  "irritated",
  "sandals",
  "pharmacy",
  "creditors",
  "coyote",
  "bounty",
  "goats",
  "issuing",
  "dinosaur",
  "barrett",
  "latent",
  "guild",
  "isolate",
  "routines",
  "poorest",
  "thumbs",
  "carlton",
  "prosecute",
  "receptor",
  "patron",
  "graphs",
  "joked",
  "discounts",
  "flipping",
  "spurs",
  "sipping",
  "multitude",
  "colon",
  "hunted",
  "exceeds",
  "downturn",
  "steals",
  "youthful",
  "dividends",
  "panicked",
  "brushes",
  "molecule",
  "smelling",
  "plight",
  "retreated",
  "walton",
  "applicant",
  "booze",
  "specimen",
  "plunge",
  "drainage",
  "hannity",
  "quebec",
  "bumped",
  "intern",
  "grinding",
  "janice",
  "specially",
  "humane",
  "augusta",
  "maureen",
  "plato",
  "doctrines",
  "litter",
  "forecasts",
  "flatow",
  "randolph",
  "metallic",
  "marin",
  "compass",
  "avery",
  "blurred",
  "pathogens",
  "surfing",
  "resonance",
  "narrowly",
  "delia",
  "scouting",
  "pinched",
  "depicting",
  "bumper",
  "narration",
  "matchup",
  "emory",
  "straps",
  "posterior",
  "frogs",
  "outset",
  "granny",
  "copied",
  "emptied",
  "perkins",
  "disrupt",
  "ledge",
  "manuel",
  "squeezing",
  "alpine",
  "oilers",
  "hitters",
  "wales",
  "confuse",
  "stationed",
  "inmate",
  "wolfe",
  "chilly",
  "doubling",
  "bourne",
  "morale",
  "amsterdam",
  "sherry",
  "entails",
  "chatter",
  "consulted",
  "bourgeois",
  "grande",
  "fetus",
  "shrine",
  "asphalt",
  "gazette",
  "costing",
  "candidacy",
  "rainfall",
  "analytics",
  "voiced",
  "downside",
  "brussels",
  "brigade",
  "monuments",
  "shortz",
  "napoleon",
  "paved",
  "condoms",
  "pluto",
  "stunt",
  "carrot",
  "shaky",
  "sleeps",
  "fences",
  "specter",
  "thriller",
  "pedal",
  "stuffing",
  "metrics",
  "analytic",
  "carmen",
  "squat",
  "reactors",
  "catalogue",
  "tractor",
  "deprived",
  "cronbach",
  "chuckling",
  "olson",
  "ensures",
  "fletcher",
  "smoky",
  "flourish",
  "caves",
  "reasoned",
  "skeptics",
  "monsieur",
  "gripping",
  "sixties",
  "minors",
  "supplier",
  "intuition",
  "skipped",
  "boiled",
  "disputed",
  "marlins",
  "worldview",
  "withdrawn",
  "steaming",
  "bedside",
  "spectator",
  "fabrics",
  "scripts",
  "letterman",
  "doris",
  "plump",
  "scrape",
  "mechanic",
  "oneyear",
  "registry",
  "dishonest",
  "maneuver",
  "bunker",
  "attendees",
  "phillies",
  "commute",
  "outlines",
  "clasped",
  "floods",
  "volcanic",
  "rampant",
  "sinatra",
  "simplest",
  "benchmark",
  "gourmet",
  "serena",
  "rafael",
  "rochester",
  "fostering",
  "winters",
  "escaping",
  "coercion",
  "props",
  "awakened",
  "crumbs",
  "gotcha",
  "stylish",
  "edison",
  "courtney",
  "libyan",
  "prepares",
  "catalyst",
  "cartoons",
  "mantle",
  "empowered",
  "wheeler",
  "portugal",
  "finland",
  "daley",
  "hawkins",
  "detainees",
  "greasy",
  "tanner",
  "blindness",
  "posing",
  "vengeance",
  "brook",
  "topping",
  "hugging",
  "scissors",
  "ballpark",
  "environ",
  "stint",
  "healed",
  "caucasian",
  "preceded",
  "guarded",
  "wartime",
  "glaring",
  "extremist",
  "reckon",
  "milosevic",
  "modernist",
  "forbid",
  "pleasures",
  "stevie",
  "reviewer",
  "highland",
  "rhythms",
  "overlook",
  "plead",
  "stroll",
  "podium",
  "oysters",
  "balances",
  "billie",
  "twists",
  "lesions",
  "editions",
  "highrisk",
  "plucked",
  "rallies",
  "applaud",
  "onetime",
  "unrest",
  "replicate",
  "wills",
  "extremes",
  "larvae",
  "fortunes",
  "joanna",
  "sasha",
  "radius",
  "staggered",
  "packet",
  "morals",
  "lenny",
  "allergies",
  "humidity",
  "freaked",
  "cruelty",
  "clare",
  "marge",
  "pertinent",
  "grasped",
  "plaster",
  "clumsy",
  "festivals",
  "hammond",
  "cured",
  "tammy",
  "runoff",
  "glossy",
  "stumbling",
  "marshal",
  "methane",
  "facto",
  "agendas",
  "allan",
  "imitation",
  "canoe",
  "sloan",
  "cruiser",
  "greeks",
  "coarse",
  "buzzing",
  "linkedin",
  "platter",
  "broadband",
  "impending",
  "lowcost",
  "lingered",
  "forearm",
  "disgusted",
  "kneeling",
  "mythology",
  "mikey",
  "porcelain",
  "nuggets",
  "seminary",
  "slamming",
  "blasted",
  "suicidal",
  "flats",
  "detector",
  "fellows",
  "crest",
  "clueless",
  "alarmed",
  "invent",
  "erase",
  "ripping",
  "oversee",
  "pours",
  "norwegian",
  "tattoos",
  "pudding",
  "echoing",
  "stressors",
  "chilled",
  "implying",
  "cookbook",
  "spelled",
  "hateful",
  "sherr",
  "trembled",
  "borrowers",
  "cohesion",
  "buffet",
  "desserts",
  "haircut",
  "attained",
  "marketers",
  "pasture",
  "pasadena",
  "lesbians",
  "disparity",
  "ottoman",
  "salem",
  "vacations",
  "jewel",
  "remnants",
  "flora",
  "dickens",
  "lineage",
  "traction",
  "trench",
  "modules",
  "mildly",
  "signaled",
  "recess",
  "chatting",
  "gracious",
  "jeanne",
  "captive",
  "withstand",
  "lucinda",
  "paces",
  "richness",
  "fragment",
  "blaze",
  "flickered",
  "scarlet",
  "anglers",
  "browse",
  "fargo",
  "noses",
  "woodlands",
  "creeping",
  "bruised",
  "playful",
  "childish",
  "choke",
  "danielle",
  "directive",
  "reside",
  "rails",
  "teased",
  "bedtime",
  "blooms",
  "seminars",
  "customary",
  "blackness",
  "vicki",
  "scalia",
  "wraps",
  "gears",
  "scenic",
  "conceive",
  "battalion",
  "pancakes",
  "johnnie",
  "logically",
  "darren",
  "royals",
  "pacing",
  "scares",
  "checklist",
  "donkey",
  "traitor",
  "hillside",
  "downright",
  "feinstein",
  "croatia",
  "staples",
  "spared",
  "taxed",
  "scenery",
  "hairy",
  "corridors",
  "listener",
  "shines",
  "poisoned",
  "marta",
  "skins",
  "thornton",
  "announces",
  "gramm",
  "messaging",
  "rhythmic",
  "punches",
  "spears",
  "artery",
  "mallory",
  "crowley",
  "surfaced",
  "singh",
  "enclosed",
  "antitrust",
  "mailing",
  "monks",
  "celestial",
  "screened",
  "decidedly",
  "darryl",
  "crystals",
  "hopped",
  "sidewalks",
  "halfhour",
  "tenant",
  "awkwardly",
  "equitable",
  "strides",
  "improper",
  "covert",
  "wisely",
  "notation",
  "reacting",
  "gardener",
  "coughed",
  "roland",
  "aided",
  "clapped",
  "swaying",
  "scraped",
  "statistic",
  "smokers",
  "newsroom",
  "barked",
  "variant",
  "triggers",
  "highs",
  "placebo",
  "slippers",
  "gerry",
  "blatant",
  "starfleet",
  "enact",
  "wouldnt",
  "blitzer",
  "stranded",
  "viability",
  "harvested",
  "borne",
  "andersen",
  "jamaica",
  "longevity",
  "warrants",
  "pinky",
  "recalling",
  "enforcing",
  "bananas",
  "stalled",
  "mystical",
  "shrubs",
  "graphite",
  "preston",
  "spheres",
  "billboard",
  "disturb",
  "splitting",
  "sampled",
  "crumbling",
  "wellness",
  "serbian",
  "browsing",
  "retaining",
  "afforded",
  "donovan",
  "amelia",
  "statues",
  "theodore",
  "squirrel",
  "fridays",
  "abigail",
  "outfits",
  "debra",
  "boone",
  "persisted",
  "routledge",
  "subgroups",
  "roofs",
  "robes",
  "brows",
  "barcelona",
  "chops",
  "screwing",
  "forefront",
  "bengals",
  "casinos",
  "align",
  "thugs",
  "discern",
  "juicy",
  "overt",
  "presume",
  "disparate",
  "ancestral",
  "openings",
  "decree",
  "leaking",
  "awakening",
  "titanic",
  "derrick",
  "brokerage",
  "dreadful",
  "acclaimed",
  "breadth",
  "thinner",
  "recurring",
  "exert",
  "mariners",
  "sneaking",
  "bliss",
  "hikes",
  "reformers",
  "highlands",
  "dispatch",
  "pristine",
  "arbor",
  "dividend",
  "bauer",
  "rabbits",
  "dwell",
  "astronaut",
  "coherence",
  "barefoot",
  "haitian",
  "moriarty",
  "circuits",
  "spices",
  "mccoy",
  "resolving",
  "olives",
  "staging",
  "mediocre",
  "cassie",
  "giggled",
  "conquer",
  "operative",
  "outdated",
  "salads",
  "boredom",
  "artie",
  "rattle",
  "subsidy",
  "blossoms",
  "softer",
  "spells",
  "tumbling",
  "bracket",
  "ahmed",
  "appoint",
  "penguin",
  "shear",
  "lender",
  "marissa",
  "chalk",
  "sheldon",
  "goodnight",
  "tentative",
  "thematic",
  "comprise",
  "mixer",
  "shuffled",
  "veggies",
  "legion",
  "clicks",
  "everett",
  "shiver",
  "gabrielle",
  "nietzsche",
  "watershed",
  "plagued",
  "concede",
  "reconcile",
  "deduction",
  "cannabis",
  "striving",
  "flakes",
  "riverside",
  "locking",
  "fashioned",
  "mitigate",
  "bends",
  "arsenic",
  "enzymes",
  "clintons",
  "theresa",
  "growling",
  "vanguard",
  "herbal",
  "imperfect",
  "warden",
  "emptiness",
  "arousal",
  "unfolding",
  "pleasing",
  "jeremiah",
  "launches",
  "magician",
  "stephens",
  "laborers",
  "curiously",
  "rejects",
  "intraday",
  "geared",
  "sprawled",
  "pence",
  "sticker",
  "sarge",
  "divergent",
  "wrinkles",
  "tosses",
  "rattling",
  "tipping",
  "solemn",
  "activate",
  "menus",
  "purdue",
  "scraping",
  "stale",
  "roadside",
  "jointly",
  "acrylic",
  "plumbing",
  "endlessly",
  "navajo",
  "ticking",
  "mates",
  "grouping",
  "innate",
  "buddha",
  "winced",
  "spaghetti",
  "cushion",
  "gallup",
  "chuckle",
  "opposes",
  "bruises",
  "broadwell",
  "clemens",
  "fragrant",
  "expansive",
  "stabilize",
  "dashed",
  "yorkers",
  "policing",
  "whistling",
  "sorting",
  "royalty",
  "dataset",
  "muted",
  "lowell",
  "renew",
  "liner",
  "revive",
  "hackers",
  "ached",
  "hating",
  "flicker",
  "meltdown",
  "choral",
  "notify",
  "sideline",
  "padded",
  "fiduciary",
  "billing",
  "conveyed",
  "norris",
  "gloom",
  "slots",
  "backstage",
  "tighten",
  "scarcity",
  "reeves",
  "listings",
  "cheered",
  "sarajevo",
  "durham",
  "sized",
  "residency",
  "furiously",
  "balloons",
  "midtown",
  "naughty",
  "stainless",
  "pathology",
  "darted",
  "possesses",
  "avenues",
  "serbia",
  "peyton",
  "hicks",
  "fearing",
  "lineman",
  "rutgers",
  "laptops",
  "summed",
  "cancelled",
  "crackdown",
  "smoothed",
  "watkins",
  "welch",
  "filtered",
  "halted",
  "antibody",
  "moderator",
  "thinkin",
  "juices",
  "pierced",
  "penelope",
  "penetrate",
  "sanity",
  "chester",
  "hides",
  "fossils",
  "martian",
  "variants",
  "scraps",
  "breakup",
  "ponytail",
  "amenities",
  "needy",
  "greenspan",
  "conceal",
  "anterior",
  "flattened",
  "diapers",
  "helena",
  "textile",
  "additions",
  "typed",
  "firefox",
  "bigotry",
  "recurrent",
  "deter",
  "stature",
  "ribbons",
  "vinyl",
  "frazier",
  "bridget",
  "vapor",
  "conceded",
  "keeper",
  "reich",
  "virgil",
  "hurdles",
  "grasses",
  "wipes",
  "divisive",
  "reprinted",
  "therein",
  "defect",
  "sirens",
  "whine",
  "coating",
  "casts",
  "stains",
  "enhances",
  "runaway",
  "lowers",
  "archie",
  "receptive",
  "dropout",
  "correlate",
  "gavin",
  "cocoa",
  "undergone",
  "bolivia",
  "storing",
  "plateau",
  "heroine",
  "emergent",
  "citations",
  "almonds",
  "willingly",
  "outspoken",
  "distrust",
  "damascus",
  "undecided",
  "cosmetic",
  "provoked",
  "modernism",
  "exploding",
  "aspiring",
  "analog",
  "refund",
  "rican",
  "hugely",
  "scifi",
  "cooled",
  "wheeled",
  "orchard",
  "sands",
  "excerpts",
  "galveston",
  "objected",
  "heres",
  "madeleine",
  "leaping",
  "partition",
  "macro",
  "hayden",
  "chanting",
  "dynasty",
  "thursdays",
  "derives",
  "brutality",
  "racially",
  "vansant",
  "ariel",
  "gladly",
  "sinks",
  "kickoff",
  "plaque",
  "urges",
  "anchored",
  "sidelines",
  "dialog",
  "edged",
  "hybrids",
  "longed",
  "endeavors",
  "detached",
  "aching",
  "moons",
  "pratt",
  "hardship",
  "betray",
  "tribunal",
  "enriched",
  "rents",
  "optics",
  "straining",
  "airways",
  "staffing",
  "gravy",
  "copying",
  "nurturing",
  "portrayal",
  "startups",
  "saudis",
  "psyche",
  "spying",
  "brewers",
  "discovers",
  "foucault",
  "farmhouse",
  "slated",
  "gould",
  "duluth",
  "header",
  "alleviate",
  "peeling",
  "bladder",
  "silva",
  "raids",
  "robotic",
  "tongues",
  "cantor",
  "makeshift",
  "unanimous",
  "allergy",
  "tease",
  "whipping",
  "notch",
  "salty",
  "manually",
  "unjust",
  "populist",
  "expands",
  "stung",
  "repeats",
  "kitchens",
  "boarded",
  "bathtub",
  "merge",
  "spielberg",
  "bland",
  "evacuated",
  "earns",
  "affinity",
  "separates",
  "weaken",
  "trayvon",
  "oversized",
  "regimen",
  "coated",
  "fragrance",
  "rapids",
  "canadians",
  "bangs",
  "upgrades",
  "thirties",
  "pastors",
  "invade",
  "morocco",
  "mortar",
  "benches",
  "revisions",
  "pelley",
  "reyes",
  "trainers",
  "ascii",
  "stalking",
  "expired",
  "oneway",
  "swayed",
  "milan",
  "rotting",
  "abrupt",
  "embryos",
  "suites",
  "freestyle",
  "ballroom",
  "plainly",
  "satire",
  "apparel",
  "banged",
  "aerobic",
  "goodwill",
  "ruining",
  "depiction",
  "howling",
  "pinterest",
  "spies",
  "barren",
  "algeria",
  "racks",
  "slung",
  "warranted",
  "crank",
  "bethesda",
  "prompts",
  "archival",
  "impetus",
  "valleys",
  "nausea",
  "expelled",
  "texting",
  "hazel",
  "formative",
  "guitarist",
  "rotate",
  "sadie",
  "cyclists",
  "soften",
  "crackers",
  "perch",
  "celia",
  "folklore",
  "descend",
  "grading",
  "convict",
  "flips",
  "logistics",
  "unlock",
  "tracing",
  "treason",
  "fluids",
  "maura",
  "digits",
  "creed",
  "precincts",
  "famine",
  "algae",
  "hardened",
  "overthrow",
  "meats",
  "decoding",
  "santiago",
  "dispersed",
  "offend",
  "fronts",
  "haunting",
  "suffice",
  "clipped",
  "packaged",
  "implant",
  "trustee",
  "scramble",
  "grins",
  "fisherman",
  "trusts",
  "bates",
  "stylist",
  "converts",
  "submarine",
  "detecting",
  "drafting",
  "ruthless",
  "valuation",
  "careless",
  "aerospace",
  "fungi",
  "elicit",
  "mailed",
  "greenberg",
  "grieving",
  "rosen",
  "superhero",
  "francesca",
  "spurred",
  "transmit",
  "alexis",
  "quitting",
  "malls",
  "doubtful",
  "dawkins",
  "warranty",
  "humorous",
  "amazement",
  "mateo",
  "residuals",
  "hadley",
  "markedly",
  "ponder",
  "selves",
  "doorbell",
  "stamped",
  "deposited",
  "expletive",
  "crammed",
  "cambodia",
  "cursing",
  "windy",
  "quartet",
  "crate",
  "attracts",
  "evils",
  "mosquito",
  "shuts",
  "showdown",
  "nicer",
  "trolls",
  "rebuilt",
  "punitive",
  "counters",
  "expanse",
  "affirmed",
  "lords",
  "altering",
  "ensembles",
  "robbins",
  "wreckage",
  "provoke",
  "remake",
  "punching",
  "glaze",
  "couldnt",
  "entirety",
  "coroner",
  "footing",
  "violates",
  "slump",
  "burnett",
  "dismissal",
  "creations",
  "soaking",
  "subpoena",
  "mileage",
  "twotime",
  "fares",
  "bolted",
  "parasites",
  "anguish",
  "pausing",
  "diners",
  "crusade",
  "hacked",
  "watering",
  "hailed",
  "necks",
  "spoil",
  "numbered",
  "aquinas",
  "delegate",
  "fascist",
  "colder",
  "federally",
  "manure",
  "lexington",
  "daschle",
  "cervical",
  "detectors",
  "vitality",
  "lever",
  "tangle",
  "clout",
  "policemen",
  "satin",
  "shady",
  "caregiver",
  "mimic",
  "aquarium",
  "giggling",
  "calves",
  "thicker",
  "rallied",
  "leftover",
  "pressured",
  "sununu",
  "continual",
  "spacious",
  "allowance",
  "unborn",
  "hideous",
  "referrals",
  "commuter",
  "muster",
  "gregg",
  "alphabet",
  "symbolism",
  "scaling",
  "imbalance",
  "cultivate",
  "skier",
  "reins",
  "flapping",
  "shale",
  "earthly",
  "profanity",
  "linger",
  "seizure",
  "mormons",
  "dolan",
  "unfolded",
  "dealings",
  "diversion",
  "flowering",
  "corpses",
  "lyons",
  "cartel",
  "photoshop",
  "pineapple",
  "overheard",
  "stillness",
  "coworkers",
  "wilder",
  "nicaragua",
  "cleansing",
  "resisting",
  "muttering",
  "sheen",
  "scooped",
  "auntie",
  "ransom",
  "artifact",
  "desks",
  "whichever",
  "vitro",
  "prevailed",
  "lillian",
  "collects",
  "blueprint",
  "payoff",
  "mailbox",
  "detailing",
  "visionary",
  "cutler",
  "mocking",
  "bitterly",
  "ensuing",
  "scoffs",
  "textiles",
  "stringent",
  "disks",
  "handgun",
  "anecdotal",
  "havoc",
  "embarrass",
  "sunscreen",
  "airlock",
  "paperback",
  "bearded",
  "reactive",
  "affidavit",
  "outskirts",
  "sighted",
  "eldest",
  "squinting",
  "forgiving",
  "ashcroft",
  "receipts",
  "transient",
  "luxurious",
  "romania",
  "murdering",
  "starred",
  "erased",
  "perks",
  "fannie",
  "amish",
  "flagship",
  "sixteenth",
  "curling",
  "rigged",
  "validate",
  "liturgy",
  "taxing",
  "kissinger",
  "powerless",
  "prudent",
  "upgraded",
  "backers",
  "shadowy",
  "evergreen",
  "motif",
  "pollen",
  "linkage",
  "fluttered",
  "carve",
  "skate",
  "hauling",
  "uttered",
  "thyroid",
  "gaunt",
  "hemingway",
  "fifties",
  "repay",
  "stairwell",
  "staffer",
  "groan",
  "regiment",
  "familial",
  "nearer",
  "quirky",
  "gaping",
  "logged",
  "geometric",
  "lithuania",
  "revived",
  "appalled",
  "xavier",
  "della",
  "printers",
  "riches",
  "homeowner",
  "spectral",
  "exceeding",
  "harmed",
  "blinding",
  "fallacy",
  "spiders",
  "hearty",
  "cohorts",
  "idiotic",
  "airway",
  "carbo",
  "diagnoses",
  "slows",
  "didnt",
  "competed",
  "fleeting",
  "defiance",
  "browsers",
  "prohibits",
  "attrition",
  "powdered",
  "sighing",
  "rosenberg",
  "denounced",
  "tripped",
  "railway",
  "faction",
  "murmur",
  "moderates",
  "stylistic",
  "subtest",
  "fished",
  "informing",
  "shampoo",
  "carbs",
  "murdoch",
  "dismay",
  "updating",
  "dilemmas",
  "cocktails",
  "collusion",
  "leonardo",
  "formulate",
  "flirting",
  "retains",
  "repaired",
  "bathrooms",
  "flank",
  "golfers",
  "dictated",
  "donny",
  "rinsed",
  "scorer",
  "agitated",
  "tulsa",
  "starling",
  "pillars",
  "islamists",
  "franken",
  "lawful",
  "landfill",
  "galactic",
  "secession",
  "mastered",
  "cerebral",
  "construed",
  "footprint",
  "likert",
  "timeless",
  "chung",
  "hesitant",
  "tuesdays",
  "delhi",
  "radiant",
  "surreal",
  "clauses",
  "ponds",
  "stalks",
  "gamers",
  "reliably",
  "annabelle",
  "upstream",
  "exemplary",
  "conquered",
  "carts",
  "shoving",
  "thirst",
  "punishing",
  "motifs",
  "liars",
  "brisk",
  "marketed",
  "severed",
  "furnished",
  "gendered",
  "escorted",
  "sinners",
  "formulas",
  "drills",
  "summarize",
  "estates",
  "affirm",
  "strolled",
  "opaque",
  "clocks",
  "pecans",
  "phelps",
  "amidst",
  "strung",
  "guardians",
  "abdomen",
  "barnett",
  "devoid",
  "alamo",
  "abdullah",
  "humanist",
  "boast",
  "cutline",
  "arranging",
  "tutorial",
  "avengers",
  "chiles",
  "bullied",
  "diaspora",
  "canton",
  "bathed",
  "morgue",
  "cuffs",
  "obscene",
  "puzzles",
  "scarred",
  "trickle",
  "groove",
  "deserving",
  "fungal",
  "pinpoint",
  "theyve",
  "petals",
  "fined",
  "plurality",
  "critiques",
  "faults",
  "breeds",
  "buckle",
  "obligated",
  "spitting",
  "fostered",
  "ancestry",
  "extras",
  "pillar",
  "settles",
  "cercla",
  "weekdays",
  "hacker",
  "platinum",
  "yielding",
  "gesturing",
  "fastball",
  "fixes",
  "malicious",
  "jerks",
  "bottled",
  "quotas",
  "quotation",
  "taiwanese",
  "mickelson",
  "nestled",
  "buzzed",
  "petitions",
  "asteroids",
  "decency",
  "pronounce",
  "gradient",
  "pantry",
  "billed",
  "favre",
  "resides",
  "wording",
  "blossom",
  "decor",
  "nielsen",
  "milestone",
  "kendall",
  "flare",
  "beeping",
  "audible",
  "mayer",
  "relish",
  "candid",
  "poignant",
  "narcotics",
  "loops",
  "unfairly",
  "edith",
  "dazed",
  "carville",
  "ritter",
  "seeded",
  "vocals",
  "canonical",
  "lurking",
  "blinded",
  "syntax",
  "impulses",
  "harassed",
  "absentee",
  "sectarian",
  "vibration",
  "chimney",
  "brock",
  "helmets",
  "murderers",
  "renting",
  "colonists",
  "linkages",
  "coyotes",
  "thrilling",
  "blinds",
  "glamour",
  "busch",
  "surrogate",
  "arteries",
  "auditors",
  "filings",
  "plugin",
  "lawns",
  "norcross",
  "tattered",
  "easing",
  "combo",
  "patronage",
  "wallpaper",
  "edible",
  "hammered",
  "flared",
  "faulty",
  "dickinson",
  "clashes",
  "moaned",
  "residue",
  "eliza",
  "falsely",
  "depletion",
  "cinemark",
  "cecilia",
  "ryder",
  "haters",
  "littered",
  "grady",
  "visibly",
  "suspend",
  "replaces",
  "tabloid",
  "obscured",
  "toddlers",
  "gallagher",
  "scowled",
  "sharpton",
  "occupying",
  "densities",
  "ancestor",
  "annoyance",
  "thatcher",
  "coarsely",
  "immensely",
  "spawned",
  "coupling",
  "succeeds",
  "steaks",
  "scanner",
  "receptors",
  "renders",
  "jesuit",
  "twoway",
  "supremacy",
  "quantify",
  "ventured",
  "registers",
  "remorse",
  "vested",
  "debacle",
  "surgeries",
  "shameful",
  "vicinity",
  "catering",
  "fixation",
  "snowy",
  "roasting",
  "schultz",
  "blindly",
  "offline",
  "widening",
  "morons",
  "graveyard",
  "fractured",
  "cling",
  "monstrous",
  "salvage",
  "karzai",
  "saunders",
  "threeday",
  "synagogue",
  "smear",
  "withheld",
  "upwards",
  "motorists",
  "parody",
  "upstate",
  "fennel",
  "reformed",
  "yates",
  "avoids",
  "engages",
  "depart",
  "preached",
  "magically",
  "sakes",
  "ballistic",
  "midday",
  "conducive",
  "fairway",
  "yearold",
  "footnotes",
  "sorted",
  "bandwidth",
  "twostory",
  "promoter",
  "swirled",
  "thump",
  "smartest",
  "ambient",
  "boutique",
  "greetings",
  "whistled",
  "spans",
  "compose",
  "diaries",
  "treasurer",
  "divinity",
  "disrupted",
  "carly",
  "masked",
  "muller",
  "populace",
  "disagrees",
  "accessing",
  "grips",
  "whack",
  "lashes",
  "resilient",
  "disguised",
  "barracks",
  "midterm",
  "hustle",
  "ortiz",
  "jamal",
  "stoop",
  "prized",
  "periphery",
  "endemic",
  "summon",
  "bachmann",
  "informs",
  "marriott",
  "stickers",
  "liaison",
  "cheapest",
  "lunches",
  "brutally",
  "sterile",
  "drafts",
  "imagines",
  "alienated",
  "classify",
  "winfrey",
  "blames",
  "mixes",
  "dreaded",
  "docks",
  "carcinoma",
  "whirled",
  "furnace",
  "heath",
  "pests",
  "ambush",
  "expressly",
  "grimaced",
  "rubric",
  "addictive",
  "bottoms",
  "regretted",
  "plugged",
  "menopause",
  "macarthur",
  "lurched",
  "ethos",
  "denim",
  "herein",
  "comprises",
  "rustic",
  "keyword",
  "turbines",
  "interplay",
  "facade",
  "watery",
  "optimum",
  "paranoia",
  "scant",
  "reliever",
  "happiest",
  "coupons",
  "shaving",
  "eyeing",
  "crippled",
  "phoned",
  "handmade",
  "piedmont",
  "plotting",
  "sails",
  "emerald",
  "streaks",
  "wiley",
  "attentive",
  "revise",
  "unarmed",
  "diarrhea",
  "caste",
  "lighten",
  "buckets",
  "resent",
  "winery",
  "risking",
  "tally",
  "margarine",
  "hungarian",
  "italians",
  "riggs",
  "mashable",
  "amounted",
  "dryer",
  "unmarried",
  "predatory",
  "trendy",
  "acquitted",
  "trillions",
  "deference",
  "hesitates",
  "hydraulic",
  "parishes",
  "glued",
  "darkest",
  "peaked",
  "ensign",
  "bitten",
  "makeover",
  "marrow",
  "regan",
  "renovated",
  "albright",
  "dichotomy",
  "shooters",
  "paulo",
  "steamed",
  "briefed",
  "reassure",
  "recounts",
  "peril",
  "memoirs",
  "supplying",
  "pageant",
  "seasoning",
  "cloning",
  "coveted",
  "alarms",
  "rooting",
  "jailed",
  "boise",
  "muffin",
  "plaid",
  "forestry",
  "poisonous",
  "comrades",
  "sprouts",
  "diffuse",
  "boulders",
  "leveled",
  "visas",
  "prolific",
  "anomaly",
  "workings",
  "eclectic",
  "postponed",
  "blending",
  "hitchcock",
  "elegance",
  "starve",
  "entrees",
  "irons",
  "smeared",
  "hallmark",
  "bullies",
  "dismal",
  "twitched",
  "mindful",
  "dominates",
  "clerks",
  "uniformed",
  "deferred",
  "hardcore",
  "unleashed",
  "limestone",
  "beamed",
  "floats",
  "fooling",
  "contours",
  "sponge",
  "englewood",
  "sandusky",
  "destroys",
  "pricey",
  "tedious",
  "countered",
  "margot",
  "folders",
  "router",
  "ranchers",
  "shuffling",
  "paradigms",
  "scaring",
  "newcomer",
  "ensured",
  "primer",
  "explodes",
  "handicap",
  "truthful",
  "villains",
  "mobilize",
  "logos",
  "seventies",
  "composers",
  "mapped",
  "treadmill",
  "tagged",
  "mayors",
  "shipment",
  "kristol",
  "strewn",
  "doctorate",
  "onehalf",
  "alameda",
  "standoff",
  "ellison",
  "bandar",
  "reminders",
  "homestead",
  "tackling",
  "coverup",
  "bryce",
  "snuck",
  "concedes",
  "shoreline",
  "barring",
  "bosch",
  "whoohoo",
  "seekers",
  "highness",
  "regents",
  "reefs",
  "moines",
  "stiffened",
  "uncles",
  "esteem",
  "goldstein",
  "slaps",
  "standings",
  "tugging",
  "grumbled",
  "rooftop",
  "hurrying",
  "seizures",
  "clustered",
  "ridges",
  "attackers",
  "heaved",
  "geese",
  "clutter",
  "dearly",
  "encompass",
  "trumpet",
  "seminal",
  "symmetry",
  "prescribe",
  "taxonomy",
  "enactment",
  "hikers",
  "cherished",
  "realms",
  "ashore",
  "exhaled",
  "inherit",
  "broaden",
  "dipping",
  "baths",
  "dictates",
  "hushed",
  "crumbled",
  "socket",
  "blasting",
  "lured",
  "commenter",
  "garland",
  "shanahan",
  "authorize",
  "aunts",
  "coloring",
  "cupboard",
  "steered",
  "liberated",
  "columbine",
  "gameplay",
  "yearning",
  "lends",
  "commotion",
  "hinted",
  "dogma",
  "humankind",
  "sharia",
  "refine",
  "stockings",
  "plentiful",
  "defeating",
  "cabins",
  "bulky",
  "surged",
  "clamped",
  "cosmetics",
  "grasping",
  "cinematic",
  "dashboard",
  "boosting",
  "plank",
  "distal",
  "farmland",
  "extremism",
  "portrays",
  "vouchers",
  "susteren",
  "overturn",
  "tweeting",
  "hires",
  "gloved",
  "woodstock",
  "deported",
  "standup",
  "fidel",
  "intrusion",
  "benin",
  "specs",
  "override",
  "bashing",
  "macdonald",
  "accents",
  "gordy",
  "rodham",
  "immersed",
  "swelled",
  "disposed",
  "landings",
  "cavaliers",
  "parting",
  "realist",
  "nests",
  "countdown",
  "upsetting",
  "sarcastic",
  "boosted",
  "greenwood",
  "rites",
  "marash",
  "schema",
  "corrosion",
  "battled",
  "knowingly",
  "orphan",
  "antenna",
  "chord",
  "lyric",
  "sprayed",
  "strait",
  "loopholes",
  "helms",
  "bulging",
  "beetles",
  "malware",
  "favoring",
  "composing",
  "filtering",
  "unused",
  "banquet",
  "guarding",
  "congrats",
  "wikileaks",
  "supernova",
  "tunisia",
  "unsalted",
  "sinus",
  "gleamed",
  "stocked",
  "dumpster",
  "avocado",
  "login",
  "laced",
  "abducted",
  "specials",
  "extant",
  "puree",
  "whistles",
  "convoy",
  "sparse",
  "vividly",
  "standout",
  "offending",
  "cutoff",
  "postcard",
  "ebooks",
  "unnamed",
  "moods",
  "worldly",
  "coercive",
  "pandemic",
  "illusions",
  "booths",
  "decorate",
  "alyssa",
  "seedlings",
  "knotted",
  "cushions",
  "webshots",
  "scaled",
  "flurry",
  "chant",
  "blurted",
  "divides",
  "gridlock",
  "profiling",
  "platoon",
  "monarchy",
  "alleging",
  "publishes",
  "fastened",
  "literate",
  "tending",
  "shards",
  "preserves",
  "vitti",
  "cages",
  "clears",
  "audiotape",
  "streaked",
  "hissing",
  "atkins",
  "buddhism",
  "playhouse",
  "caucuses",
  "schadler",
  "intercept",
  "shocks",
  "utopian",
  "squarely",
  "stevenson",
  "packets",
  "lesion",
  "replay",
  "squatted",
  "nuclei",
  "tibet",
  "depleted",
  "stalls",
  "silas",
  "mindless",
  "grimly",
  "creeps",
  "substrate",
  "scarlett",
  "magnesium",
  "confines",
  "turks",
  "discs",
  "wichita",
  "arenas",
  "stairway",
  "embraces",
  "racket",
  "verbally",
  "debuted",
  "hereafter",
  "nearing",
  "revolver",
  "hourly",
  "bouquet",
  "webbased",
  "teamed",
  "elijah",
  "spills",
  "flattered",
  "norah",
  "contended",
  "blushed",
  "brochure",
  "obsessive",
  "peeked",
  "pursed",
  "extrinsic",
  "frontal",
  "tanzania",
  "topical",
  "felicity",
  "appalling",
  "amend",
  "digestive",
  "elian",
  "dialed",
  "realised",
  "watchdog",
  "jongun",
  "airing",
  "parkinson",
  "gracie",
  "priori",
  "defiant",
  "grassy",
  "captivity",
  "headset",
  "landmarks",
  "etched",
  "collapses",
  "harding",
  "govt",
  "favorably",
  "downloads",
  "coupon",
  "mcgee",
  "maher",
  "regained",
  "lockheed",
  "ratified",
  "tandem",
  "constance",
  "giveaway",
  "diagrams",
  "safeguard",
  "glimpsed",
  "informant",
  "turkeys",
  "isabella",
  "attends",
  "racists",
  "weakly",
  "hamstring",
  "polity",
  "fades",
  "selfhelp",
  "grossman",
  "bazaar",
  "grownup",
  "wretched",
  "coaster",
  "hearth",
  "soles",
  "shaded",
  "stinking",
  "suarez",
  "specifies",
  "spruce",
  "whopping",
  "queries",
  "classy",
  "awaits",
  "fruitful",
  "cranberry",
  "watchers",
  "throbbing",
  "absently",
  "parchment",
  "encoding",
  "harbaugh",
  "complains",
  "luncheon",
  "churning",
  "recounted",
  "angled",
  "workin",
  "wrongly",
  "parity",
  "leopold",
  "retrieval",
  "hummed",
  "conducts",
  "genus",
  "drags",
  "cruises",
  "terminate",
  "tragedies",
  "hubbard",
  "handcuffs",
  "simulate",
  "shimano",
  "revisit",
  "proximal",
  "freezes",
  "humid",
  "twohour",
  "waterfall",
  "autistic",
  "stiffly",
  "bounded",
  "photons",
  "submerged",
  "decks",
  "ridicule",
  "lighted",
  "absorbing",
  "angola",
  "oxide",
  "climates",
  "amplified",
  "appellate",
  "sprigs",
  "gritty",
  "booking",
  "splashing",
  "reunited",
  "facets",
  "silvery",
  "forties",
  "survives",
  "flaming",
  "corrupted",
  "clove",
  "requisite",
  "bigtime",
  "turquoise",
  "fernandez",
  "throats",
  "rumbling",
  "faculties",
  "glossary",
  "boils",
  "emitted",
  "persists",
  "manmade",
  "diverted",
  "flair",
  "gergen",
  "recourse",
  "lofty",
  "beckel",
  "serene",
  "doorstep",
  "timetable",
  "throttle",
  "gloomy",
  "pairing",
  "deadlines",
  "mater",
  "rulings",
  "walnuts",
  "starks",
  "slowdown",
  "briskly",
  "auditor",
  "overdue",
  "pursuits",
  "likeness",
  "safest",
  "fastfood",
  "shrill",
  "blackened",
  "sweeps",
  "mounds",
  "sinai",
  "drifts",
  "greer",
  "cautions",
  "landslide",
  "cords",
  "despise",
  "chloride",
  "textures",
  "crates",
  "timed",
  "parasite",
  "stemming",
  "pigment",
  "proclaim",
  "brody",
  "nicklaus",
  "voldemort",
  "folly",
  "guideline",
  "cabrera",
  "maize",
  "tornadoes",
  "quivering",
  "stabbing",
  "discreet",
  "evokes",
  "staten",
  "gentiles",
  "calmed",
  "mediator",
  "garments",
  "dubai",
  "glaciers",
  "explorers",
  "pigeon",
  "wrecked",
  "strangled",
  "autograph",
  "emmett",
  "turbulent",
  "transcend",
  "rained",
  "probing",
  "hereby",
  "greenwich",
  "escapes",
  "silky",
  "laughable",
  "weakening",
  "lagattuta",
  "bearings",
  "hubby",
  "cores",
  "hanks",
  "rumored",
  "growl",
  "prank",
  "argentine",
  "thomson",
  "stitches",
  "cracker",
  "hardwood",
  "surrounds",
  "legit",
  "rocker",
  "thier",
  "priceless",
  "skeletal",
  "sprinkled",
  "scatter",
  "nesting",
  "trenches",
  "mayoral",
  "bedding",
  "pennies",
  "squirrels",
  "uniformly",
  "wagons",
  "notebooks",
  "layered",
  "retina",
  "chipped",
  "paralysis",
  "herds",
  "scrubbed",
  "coolest",
  "radios",
  "clarified",
  "blends",
  "tripled",
  "sanction",
  "revered",
  "mediating",
  "elias",
  "overboard",
  "shoves",
  "trays",
  "boasted",
  "complexes",
  "eyepiece",
  "cessation",
  "coined",
  "euros",
  "psychotic",
  "mediate",
  "spectra",
  "perverse",
  "flannel",
  "cubans",
  "beethoven",
  "flinched",
  "interiors",
  "draining",
  "amplitude",
  "suspense",
  "pigeons",
  "recap",
  "diabetic",
  "ketchup",
  "excused",
  "swallows",
  "diagnose",
  "sheltered",
  "trotted",
  "leftwing",
  "deterrent",
  "occupies",
  "arresting",
  "havent",
  "quiones",
  "cassandra",
  "preface",
  "murderous",
  "badges",
  "hearst",
  "divert",
  "gandhi",
  "reacts",
  "dynamite",
  "awaited",
  "precursor",
  "imposes",
  "cherish",
  "doctrinal",
  "emeritus",
  "beckett",
  "antiquity",
  "flute",
  "nepal",
  "grotesque",
  "bankr",
  "angered",
  "rousseau",
  "leone",
  "relocated",
  "civility",
  "moneyline",
  "stooped",
  "tailor",
  "sluggish",
  "pipelines",
  "lessen",
  "chiefly",
  "alexandra",
  "immersion",
  "embarked",
  "closeness",
  "washes",
  "nominate",
  "sincerity",
  "blockade",
  "referee",
  "festive",
  "surpassed",
  "frigid",
  "risked",
  "patting",
  "primacy",
  "replica",
  "linemen",
  "hopping",
  "neutron",
  "combed",
  "twitch",
  "outfield",
  "schroeder",
  "silverman",
  "smacked",
  "shepard",
  "disliked",
  "seams",
  "finalists",
  "halved",
  "stormed",
  "donating",
  "fixtures",
  "catalogs",
  "bayou",
  "simplify",
  "renamed",
  "runnerup",
  "patsy",
  "blackmail",
  "clooney",
  "quieter",
  "mosques",
  "henri",
  "drilled",
  "alvarez",
  "metadata",
  "dearest",
  "executor",
  "flawless",
  "plotted",
  "patrols",
  "discredit",
  "devise",
  "casualty",
  "raisins",
  "semifinal",
  "anchors",
  "rubbish",
  "elevators",
  "spirited",
  "joyful",
  "quaint",
  "bowen",
  "ferris",
  "colombian",
  "regulars",
  "interns",
  "puppets",
  "lancaster",
  "beaming",
  "knitting",
  "shriek",
  "convened",
  "rustling",
  "grenade",
  "redundant",
  "leftovers",
  "climatic",
  "heaving",
  "shipments",
  "deceptive",
  "tenets",
  "payton",
  "upgrading",
  "rusted",
  "loadings",
  "sweaters",
  "wiser",
  "cones",
  "vocation",
  "eminent",
  "whiteness",
  "commuters",
  "propelled",
  "charred",
  "concerted",
  "tides",
  "opioid",
  "baltic",
  "ascent",
  "blasts",
  "reverence",
  "truce",
  "puffed",
  "majestic",
  "thinker",
  "actresses",
  "barak",
  "rookies",
  "stalked",
  "forks",
  "cautioned",
  "gleam",
  "prognosis",
  "makin",
  "bundled",
  "timer",
  "fixture",
  "vineyards",
  "waged",
  "vents",
  "psych",
  "elicited",
  "gentry",
  "janie",
  "equate",
  "tremble",
  "restart",
  "aristide",
  "chopping",
  "fledgling",
  "syrians",
  "shutters",
  "tread",
  "mondays",
  "bristol",
  "batters",
  "mocked",
  "lifeless",
  "quarry",
  "hitch",
  "garnered",
  "clarice",
  "goodwin",
  "bodyguard",
  "spree",
  "thinning",
  "eruption",
  "forceful",
  "manuals",
  "railroads",
  "moran",
  "boldly",
  "vance",
  "baffled",
  "scratches",
  "reopened",
  "hunch",
  "causality",
  "buckhead",
  "erroneous",
  "workload",
  "ushered",
  "calculus",
  "despised",
  "preclude",
  "handheld",
  "dominic",
  "reeling",
  "nicholson",
  "conserve",
  "airtight",
  "accessory",
  "staining",
  "bustling",
  "stressing",
  "rosenthal",
  "malignant",
  "dangled",
  "emulate",
  "authored",
  "clapping",
  "suitcases",
  "cluttered",
  "squadron",
  "tripp",
  "overdose",
  "recycle",
  "spraying",
  "aspire",
  "reforming",
  "banners",
  "gland",
  "goauld",
  "glide",
  "vowel",
  "widen",
  "attacker",
  "citizenry",
  "plush",
  "puzzling",
  "freeing",
  "giles",
  "modifying",
  "embryonic",
  "harmon",
  "frida",
  "frosting",
  "attire",
  "clumps",
  "walkway",
  "silenced",
  "quota",
  "mclean",
  "shrieked",
  "warsaw",
  "mythical",
  "prophetic",
  "resonate",
  "pitiful",
  "alleges",
  "percy",
  "casimir",
  "reassured",
  "denotes",
  "liquidity",
  "lasers",
  "heirs",
  "grayson",
  "kodak",
  "reelected",
  "illegals",
  "perdue",
  "refining",
  "wilkinson",
  "heartland",
  "sauces",
  "tenor",
  "shortcut",
  "pleas",
  "valves",
  "cortical",
  "fluent",
  "intrusive",
  "qualifies",
  "praising",
  "taxable",
  "finer",
  "gathers",
  "hallways",
  "vigil",
  "exposes",
  "thrift",
  "steinberg",
  "glazed",
  "embryo",
  "evoked",
  "spaceship",
  "compel",
  "vanishing",
  "bumping",
  "barge",
  "agrarian",
  "thanking",
  "chinatown",
  "visualize",
  "annapolis",
  "twoday",
  "wooded",
  "emailed",
  "circa",
  "greenland",
  "rallying",
  "ramon",
  "norma",
  "venerable",
  "anecdotes",
  "inject",
  "walkers",
  "accords",
  "optimize",
  "tracts",
  "newfound",
  "saloon",
  "audubon",
  "devout",
  "axial",
  "barris",
  "antidote",
  "flutter",
  "vigor",
  "crave",
  "swann",
  "canyons",
  "additive",
  "signifies",
  "sensual",
  "gunshots",
  "squid",
  "cummings",
  "concise",
  "residing",
  "bannon",
  "polarized",
  "baggy",
  "marches",
  "outpost",
  "toured",
  "deepened",
  "overgrown",
  "rapists",
  "medically",
  "exploits",
  "enraged",
  "boyle",
  "defective",
  "manafort",
  "cardio",
  "juries",
  "errands",
  "arches",
  "franz",
  "mustang",
  "maternity",
  "macmillan",
  "steroid",
  "abdul",
  "crows",
  "negatives",
  "gorge",
  "resumes",
  "semantics",
  "keynote",
  "colbert",
  "trimmings",
  "downed",
  "elevate",
  "manila",
  "verbs",
  "paypal",
  "pencils",
  "bruise",
  "bundles",
  "beets",
  "prosper",
  "mused",
  "leafy",
  "poetics",
  "delaying",
  "junkie",
  "analyzes",
  "slicing",
  "calhoun",
  "bobbed",
  "feelin",
  "warmly",
  "strife",
  "showered",
  "heartfelt",
  "abduction",
  "envelopes",
  "sculptor",
  "gorilla",
  "tealc",
  "colby",
  "bosom",
  "skipper",
  "harms",
  "creaking",
  "tellin",
  "exhales",
  "rabin",
  "embodies",
  "protector",
  "curses",
  "sweetly",
  "cleaners",
  "curving",
  "coincide",
  "spawning",
  "couture",
  "executing",
  "superiors",
  "gruesome",
  "arcade",
  "endowed",
  "pooled",
  "mckinney",
  "rockville",
  "anime",
  "ebola",
  "budding",
  "starved",
  "offscreen",
  "relegated",
  "anthology",
  "soups",
  "stomped",
  "goodies",
  "harden",
  "nagging",
  "undone",
  "bubbling",
  "stricken",
  "purposely",
  "ticks",
  "starship",
  "raspberry",
  "cersei",
  "applauded",
  "contour",
  "spooky",
  "namespace",
  "dramas",
  "tibetan",
  "wideeyed",
  "elective",
  "vigilant",
  "sheikh",
  "primal",
  "virtuous",
  "millennia",
  "cradled",
  "camden",
  "stalk",
  "idealism",
  "charms",
  "twitching",
  "cashier",
  "hunts",
  "parachute",
  "scooter",
  "hurries",
  "menacing",
  "callers",
  "classmate",
  "volcanoes",
  "fling",
  "cultured",
  "canals",
  "lenin",
  "pulpit",
  "spaced",
  "splits",
  "outweigh",
  "forsyth",
  "dripped",
  "teamwork",
  "solemnly",
  "squared",
  "doesn",
  "tricked",
  "knack",
  "caveat",
  "slogans",
  "pitted",
  "treatise",
  "afterlife",
  "upheaval",
  "olsen",
  "reuben",
  "freakin",
  "wicker",
  "passer",
  "tactile",
  "shalt",
  "townsend",
  "baldemar",
  "matrices",
  "partying",
  "jacobson",
  "pulses",
  "monsanto",
  "gifford",
  "untreated",
  "overtly",
  "tattooed",
  "whitaker",
  "shred",
  "creaked",
  "tallest",
  "fraught",
  "ashtray",
  "bowel",
  "exited",
  "pathogen",
  "genomic",
  "drapes",
  "stripping",
  "furry",
  "cooke",
  "shedding",
  "nicolas",
  "osborne",
  "cohesive",
  "saliva",
  "crafting",
  "massively",
  "arrivals",
  "labored",
  "deepening",
  "sunnis",
  "sharper",
  "waiters",
  "molded",
  "anomalies",
  "forearms",
  "ezekiel",
  "excitedly",
  "macon",
  "cartilage",
  "lecturer",
  "dives",
  "petite",
  "residues",
  "designate",
  "clerical",
  "putnam",
  "pulsing",
  "endorsing",
  "kanye",
  "secede",
  "wrestle",
  "elitist",
  "handler",
  "whores",
  "skeletons",
  "gadget",
  "calming",
  "impartial",
  "fracking",
  "robotics",
  "deficient",
  "stadiums",
  "redesign",
  "macho",
  "downfall",
  "comer",
  "intercom",
  "venera",
  "fencing",
  "hammering",
  "foothills",
  "wormhole",
  "takin",
  "rumbled",
  "momentary",
  "mounts",
  "roommates",
  "withhold",
  "sediments",
  "weasel",
  "politico",
  "kennesaw",
  "departing",
  "enlarge",
  "megyn",
  "mourn",
  "clipboard",
  "medalist",
  "retro",
  "savory",
  "quaid",
  "repent",
  "carney",
  "papal",
  "unheard",
  "blazer",
  "jerking",
  "creasy",
  "kingdoms",
  "instruct",
  "coiled",
  "hotline",
  "signify",
  "lynne",
  "theorem",
  "genotype",
  "tessa",
  "mckenzie",
  "nicknamed",
  "surveying",
  "lange",
  "westbrook",
  "queue",
  "germs",
  "georges",
  "grossly",
  "whips",
  "cheeses",
  "taipei",
  "bribery",
  "basal",
  "wrigley",
  "conveys",
  "casserole",
  "coughs",
  "bentley",
  "darting",
  "carton",
  "brewery",
  "bartlett",
  "lowlevel",
  "eleventh",
  "forensics",
  "handshake",
  "prudence",
  "spanning",
  "musharraf",
  "revolving",
  "genders",
  "cartridge",
  "funerals",
  "pollock",
  "mckay",
  "jobless",
  "oblivion",
  "napkins",
  "degraded",
  "avail",
  "coastline",
  "chilean",
  "ramos",
  "liberia",
  "flashy",
  "restrain",
  "codified",
  "polluted",
  "dormant",
  "shrieking",
  "salted",
  "clothed",
  "heirloom",
  "thumping",
  "marinade",
  "tenet",
  "beltway",
  "jails",
  "dignified",
  "roseanne",
  "humanism",
  "glimpses",
  "lanka",
  "sacrament",
  "spiked",
  "ardent",
  "intro",
  "frowns",
  "erickson",
  "islanders",
  "breakout",
  "tariff",
  "campers",
  "reboot",
  "swanson",
  "chigurh",
  "daria",
  "crackling",
  "customize",
  "promoters",
  "impede",
  "bethlehem",
  "swimmer",
  "brunswick",
  "sheffield",
  "leftists",
  "attest",
  "mackenzie",
  "roars",
  "snarled",
  "darkening",
  "lipid",
  "defends",
  "josephine",
  "stinging",
  "auctions",
  "undue",
  "leach",
  "regal",
  "resultant",
  "frontiers",
  "jaguar",
  "spoiler",
  "coincided",
  "paterno",
  "medicinal",
  "secretive",
  "mamma",
  "doubtless",
  "clinician",
  "energized",
  "fangs",
  "buyout",
  "weekday",
  "playbook",
  "caramel",
  "lapse",
  "whitfield",
  "spotting",
  "carnage",
  "realty",
  "mahmoud",
  "angst",
  "steiner",
  "funnel",
  "polled",
  "purported",
  "diagonal",
  "plummeted",
  "hardships",
  "shortfall",
  "kerrey",
  "flake",
  "lawmaker",
  "subsidize",
  "sterritt",
  "funniest",
  "nacional",
  "brookings",
  "lando",
  "pollster",
  "outcry",
  "senseless",
  "pedals",
  "feral",
  "regulates",
  "spitzer",
  "repealed",
  "lanier",
  "blankly",
  "lancet",
  "melbourne",
  "scents",
  "spacex",
  "dispersal",
  "seamless",
  "wearily",
  "fluke",
  "deceived",
  "squeezes",
  "mutants",
  "howled",
  "stony",
  "tenuous",
  "richly",
  "weakest",
  "cater",
  "trance",
  "marxism",
  "recite",
  "undercut",
  "craters",
  "finnish",
  "guillen",
  "inflict",
  "stockholm",
  "clubhead",
  "cavern",
  "wasteful",
  "melodies",
  "scrimmage",
  "brexit",
  "thirds",
  "shortened",
  "stemmed",
  "convent",
  "legalized",
  "busiest",
  "peruvian",
  "fasting",
  "vacancy",
  "audits",
  "occupants",
  "penchant",
  "royalties",
  "cosmology",
  "hurriedly",
  "mcmahon",
  "reflex",
  "faiths",
  "stumbles",
  "sweetest",
  "endings",
  "cupcakes",
  "plugs",
  "raping",
  "sofia",
  "chords",
  "waning",
  "dartmouth",
  "fallujah",
  "repressed",
  "glint",
  "trophies",
  "buttocks",
  "meyers",
  "spawn",
  "consoles",
  "bathrobe",
  "sprawl",
  "groupings",
  "intrigue",
  "haynes",
  "contra",
  "twelfth",
  "dispose",
  "deceive",
  "averted",
  "afflicted",
  "composure",
  "praises",
  "causation",
  "salazar",
  "haste",
  "boardwalk",
  "adamant",
  "schuster",
  "urgently",
  "corbett",
  "bluetooth",
  "ruben",
  "batted",
  "chore",
  "grounding",
  "narrower",
  "harlan",
  "kneel",
  "exported",
  "vending",
  "embassies",
  "saddened",
  "pained",
  "binge",
  "equator",
  "minimized",
  "polio",
  "patented",
  "jolie",
  "bandage",
  "burying",
  "hover",
  "shutter",
  "exporting",
  "gospels",
  "chained",
  "gilded",
  "unfolds",
  "gazes",
  "cologne",
  "begala",
  "excesses",
  "staffs",
  "escalated",
  "repairing",
  "inhale",
  "blurry",
  "putative",
  "fared",
  "fueling",
  "moans",
  "crossover",
  "skyfall",
  "clientele",
  "piety",
  "doughnuts",
  "compute",
  "aires",
  "courtship",
  "limousine",
  "lonergan",
  "refute",
  "pretense",
  "neared",
  "lures",
  "ankara",
  "trudy",
  "captains",
  "chevron",
  "pastels",
  "sunken",
  "sixmonth",
  "budge",
  "approving",
  "earnhardt",
  "occupancy",
  "selig",
  "justifies",
  "gowns",
  "groves",
  "lowkey",
  "barbed",
  "blooming",
  "mavericks",
  "dreamy",
  "reddit",
  "beginner",
  "restroom",
  "stagnant",
  "plastered",
  "molina",
  "electing",
  "collagen",
  "parcells",
  "scowl",
  "fredricka",
  "algren",
  "amanpour",
  "shallots",
  "unreal",
  "snape",
  "stricter",
  "drenched",
  "oversaw",
  "unifying",
  "cowardly",
  "shrek",
  "morsi",
  "strolling",
  "hypocrite",
  "wetland",
  "chechnya",
  "timid",
  "cartels",
  "hiked",
  "martyr",
  "plunging",
  "narrowing",
  "anchorage",
  "harassing",
  "rembrandt",
  "overload",
  "tworun",
  "smallpox",
  "cesar",
  "bailouts",
  "celsius",
  "crippling",
  "douglass",
  "flask",
  "wakeup",
  "ticked",
  "faraway",
  "condensed",
  "oceanic",
  "winged",
  "schiff",
  "lunchtime",
  "setbacks",
  "whirling",
  "chemist",
  "climbers",
  "rumpled",
  "bluegrass",
  "nathaniel",
  "dialect",
  "iphones",
  "uploaded",
  "chests",
  "surging",
  "melts",
  "obeyed",
  "croatian",
  "nicest",
  "maneuvers",
  "penned",
  "toppled",
  "tripping",
  "planks",
  "allocate",
  "bloodshed",
  "follower",
  "kayak",
  "antics",
  "guthrie",
  "youngster",
  "subtests",
  "flashback",
  "geoff",
  "reversing",
  "hooded",
  "shadowed",
  "rounding",
  "minimally",
  "quilts",
  "sporadic",
  "postcards",
  "everytime",
  "woken",
  "extracts",
  "postpone",
  "nurtured",
  "implanted",
  "disable",
  "comforted",
  "deviant",
  "chatted",
  "monet",
  "confided",
  "pledges",
  "reddish",
  "tensed",
  "anglo",
  "comforts",
  "edinburgh",
  "diluted",
  "tweed",
  "visceral",
  "stubble",
  "recited",
  "drugstore",
  "reared",
  "tabloids",
  "cures",
  "labyrinth",
  "fremont",
  "carcass",
  "troopers",
  "flimsy",
  "postings",
  "recognise",
  "memos",
  "trainees",
  "automaker",
  "dignan",
  "landry",
  "practicum",
  "spores",
  "subsided",
  "isabelle",
  "bailed",
  "warped",
  "cheesy",
  "glands",
  "eyelashes",
  "schindler",
  "crispy",
  "achieves",
  "outlining",
  "datasets",
  "aversion",
  "miner",
  "steed",
  "naples",
  "steward",
  "statesman",
  "grilling",
  "centrist",
  "oversize",
  "cadets",
  "magnolia",
  "crumble",
  "wont",
  "busting",
  "dials",
  "dreamt",
  "annals",
  "hampered",
  "forgets",
  "couric",
  "smoother",
  "dorsey",
  "aback",
  "presided",
  "hurtful",
  "overwhelm",
  "swearing",
  "bellaire",
  "eyeballs",
  "accession",
  "scribbled",
  "splendor",
  "troupe",
  "galley",
  "refresh",
  "nascent",
  "liquids",
  "runnin",
  "cliche",
  "smoothing",
  "hague",
  "perfected",
  "outages",
  "sheds",
  "starboard",
  "tripod",
  "sermons",
  "dialectic",
  "growls",
  "idealized",
  "scorn",
  "kneels",
  "pharma",
  "neary",
  "mccormick",
  "gutierrez",
  "imprint",
  "repayment",
  "auditing",
  "flatly",
  "referees",
  "mixtures",
  "pitfalls",
  "royce",
  "juveniles",
  "lilies",
  "memorized",
  "collier",
  "spacing",
  "swath",
  "katya",
  "georgian",
  "lunged",
  "panelist",
  "chaplain",
  "mobilized",
  "patriarch",
  "congruent",
  "fibrosis",
  "dodging",
  "murmurs",
  "bellevue",
  "wager",
  "altman",
  "highrise",
  "blinks",
  "awaken",
  "bashar",
  "genotypes",
  "rentals",
  "leopard",
  "accorded",
  "foreigner",
  "feldman",
  "woolf",
  "positives",
  "tumblr",
  "ripples",
  "kingston",
  "jerseys",
  "maximal",
  "exerted",
  "conserved",
  "scarves",
  "curing",
  "denis",
  "relic",
  "patterned",
  "tinted",
  "monologue",
  "lament",
  "peeking",
  "perplexed",
  "wilde",
  "securely",
  "mascara",
  "fifteenth",
  "louisa",
  "conferred",
  "commits",
  "beckoned",
  "bandura",
  "appliance",
  "allure",
  "unravel",
  "overcoat",
  "optimized",
  "saviour",
  "undertook",
  "molested",
  "chemo",
  "shrunk",
  "traverse",
  "ipads",
  "twoweek",
  "lamented",
  "brooding",
  "breathes",
  "bulgaria",
  "bungalow",
  "macbook",
  "gliding",
  "regis",
  "removable",
  "exhale",
  "airwaves",
  "anglican",
  "rendition",
  "chaired",
  "accuses",
  "unload",
  "colours",
  "affirms",
  "wacky",
  "swimmers",
  "underdog",
  "moderated",
  "viola",
  "clones",
  "intending",
  "schiller",
  "tonic",
  "pinot",
  "grooming",
  "reckoning",
  "pondered",
  "lumps",
  "absurdity",
  "antiwar",
  "allegheny",
  "fortified",
  "rangel",
  "cranky",
  "plume",
  "digestion",
  "repertory",
  "ballard",
  "davenport",
  "puberty",
  "bonded",
  "pyramids",
  "comedians",
  "serenity",
  "converse",
  "flavored",
  "ignited",
  "georgians",
  "speck",
  "ascribed",
  "pastures",
  "chives",
  "theorist",
  "sculpted",
  "sansa",
  "mcbride",
  "sagged",
  "receding",
  "densely",
  "batches",
  "valet",
  "angelina",
  "crowe",
  "fliers",
  "earners",
  "armey",
  "glimmer",
  "heady",
  "medley",
  "landlords",
  "dumps",
  "gillespie",
  "mosul",
  "chassis",
  "framers",
  "consonant",
  "madeline",
  "deluxe",
  "daryl",
  "markings",
  "odors",
  "aubrey",
  "piers",
  "fonts",
  "amassed",
  "doorknob",
  "twigs",
  "filth",
  "underside",
  "booklet",
  "abiding",
  "encrypted",
  "accuser",
  "cornmeal",
  "avert",
  "saucer",
  "expires",
  "drawbacks",
  "revisited",
  "dwarfs",
  "darts",
  "redefine",
  "carpets",
  "shelton",
  "salinas",
  "rotated",
  "rightful",
  "projector",
  "groomed",
  "sidelined",
  "tacos",
  "pesto",
  "worrisome",
  "rapport",
  "trough",
  "bargains",
  "suicides",
  "cameraman",
  "dries",
  "hartman",
  "spatula",
  "texted",
  "effluent",
  "harshly",
  "paulson",
  "warily",
  "bestowed",
  "foggy",
  "overcame",
  "paleo",
  "resin",
  "parable",
  "converge",
  "crunchy",
  "avian",
  "forwards",
  "princes",
  "minivan",
  "confer",
  "finalist",
  "modesty",
  "bowing",
  "tilting",
  "mullen",
  "mantel",
  "sided",
  "flopped",
  "padding",
  "docking",
  "beginners",
  "grate",
  "atkinson",
  "dialogues",
  "appetizer",
  "connector",
  "underwood",
  "fanned",
  "juniors",
  "glided",
  "loophole",
  "sightings",
  "taping",
  "canons",
  "colossal",
  "spoilers",
  "tackled",
  "thrived",
  "sandstone",
  "aidan",
  "campfire",
  "allright",
  "soybeans",
  "tagging",
  "encoded",
  "usability",
  "melodic",
  "wheaton",
  "sloping",
  "famer",
  "sparkled",
  "checkout",
  "flagged",
  "resented",
  "sharpened",
  "greased",
  "handouts",
  "plowed",
  "parochial",
  "budgetary",
  "retreats",
  "estranged",
  "radon",
  "expos",
  "wilkins",
  "provoking",
  "takers",
  "fullerton",
  "elderman",
  "enlist",
  "stately",
  "borges",
  "attaining",
  "alligator",
  "dismantle",
  "analogies",
  "mouthful",
  "balkans",
  "manifests",
  "bandages",
  "grenades",
  "judah",
  "silicone",
  "barthes",
  "grits",
  "scrubbing",
  "anecdote",
  "briefings",
  "healthful",
  "arisen",
  "shielded",
  "bribes",
  "ashton",
  "roundup",
  "snort",
  "whence",
  "ritchie",
  "defer",
  "straits",
  "veiled",
  "revolves",
  "escalate",
  "destroyer",
  "relics",
  "lugar",
  "coldly",
  "feeny",
  "flares",
  "apathy",
  "tamara",
  "artisans",
  "skates",
  "pendulum",
  "zachary",
  "commuting",
  "ballad",
  "vowels",
  "heroism",
  "presiding",
  "cutbacks",
  "gulped",
  "murals",
  "darla",
  "forging",
  "ovarian",
  "limbo",
  "tutors",
  "flailing",
  "ortega",
  "banished",
  "spits",
  "pedestal",
  "reliant",
  "durant",
  "boosts",
  "friedrich",
  "quark",
  "proxies",
  "shortest",
  "breads",
  "allegory",
  "deserts",
  "shiites",
  "pollsters",
  "watered",
  "jeter",
  "excludes",
  "prada",
  "sixyear",
  "tasked",
  "landuse",
  "streamed",
  "wimbledon",
  "reigning",
  "terminals",
  "grieve",
  "quarrel",
  "drumming",
  "melon",
  "unleash",
  "impeached",
  "widows",
  "overalls",
  "rafters",
  "helper",
  "jamaican",
  "molding",
  "prickly",
  "outputs",
  "hasty",
  "caretaker",
  "closets",
  "noriega",
  "onesided",
  "modestly",
  "coasts",
  "waxed",
  "propel",
  "mingled",
  "palate",
  "cashmere",
  "coals",
  "lizards",
  "lashed",
  "empires",
  "sedentary",
  "cropped",
  "puffs",
  "mistrust",
  "untold",
  "bowers",
  "rapes",
  "sling",
  "perceives",
  "darkly",
  "crowned",
  "pondering",
  "delusions",
  "harmonic",
  "regulator",
  "farthest",
  "lacey",
  "dusted",
  "hawking",
  "redeem",
  "brochures",
  "graded",
  "athena",
  "doorman",
  "schematic",
  "topanga",
  "ledger",
  "clouded",
  "completes",
  "alluded",
  "underage",
  "brigham",
  "rodents",
  "bayesian",
  "stripe",
  "thoreau",
  "acidic",
  "marshes",
  "courier",
  "musicals",
  "warhol",
  "heller",
  "rehnquist",
  "clams",
  "annan",
  "tentacles",
  "baroque",
  "oconnell",
  "thickened",
  "crowding",
  "fullness",
  "aiding",
  "waitin",
  "marshals",
  "fedex",
  "backside",
  "grandeur",
  "longhorns",
  "handbag",
  "dictators",
  "penal",
  "beaumont",
  "outings",
  "swiveled",
  "rhymes",
  "defeats",
  "menhaden",
  "partnered",
  "hermione",
  "shootout",
  "revising",
  "ontology",
  "twinkies",
  "faulkner",
  "grail",
  "rippling",
  "readable",
  "affirming",
  "detergent",
  "purgatory",
  "hattie",
  "cranes",
  "mansfield",
  "ridley",
  "redress",
  "detriment",
  "newsom",
  "entrusted",
  "payers",
  "squatting",
  "westward",
  "syringe",
  "mcguire",
  "errand",
  "bowels",
  "kimble",
  "ethically",
  "bellowed",
  "hangar",
  "gurney",
  "takeoff",
  "brunette",
  "elise",
  "pharaoh",
  "willful",
  "topdown",
  "alaskan",
  "drugged",
  "bandwagon",
  "blanc",
  "deepen",
  "preachers",
  "binds",
  "darden",
  "keepers",
  "alito",
  "humour",
  "rippled",
  "havin",
  "wooten",
  "emirates",
  "clogged",
  "downey",
  "slaying",
  "wrestled",
  "scopes",
  "dutifully",
  "butte",
  "eurozone",
  "crazed",
  "hanged",
  "hardcopy",
  "excerpted",
  "orient",
  "bluntly",
  "severus",
  "trailhead",
  "raptors",
  "crucified",
  "descartes",
  "siberia",
  "bleach",
  "unmanned",
  "flinch",
  "picket",
  "whined",
  "archaic",
  "galleria",
  "alaric",
  "passports",
  "surpass",
  "workable",
  "gravely",
  "wholesome",
  "blackwell",
  "cleric",
  "hayward",
  "stifling",
  "landfills",
  "lyrical",
  "canning",
  "bumpy",
  "soybean",
  "citigroup",
  "disarm",
  "abstracts",
  "playin",
  "proverbs",
  "raided",
  "molten",
  "octopus",
  "charger",
  "vinci",
  "balding",
  "healer",
  "constable",
  "guadalupe",
  "habitual",
  "squeak",
  "pandering",
  "distort",
  "fashions",
  "entailed",
  "wares",
  "bleached",
  "electors",
  "stitched",
  "chiang",
  "mcdowell",
  "midwife",
  "fauna",
  "tubing",
  "mythic",
  "masking",
  "splinter",
  "scarecrow",
  "drains",
  "briefs",
  "tillman",
  "shrewd",
  "legions",
  "excavated",
  "stretcher",
  "shyly",
  "robberies",
  "narrated",
  "tonya",
  "segal",
  "creak",
  "exiled",
  "predation",
  "ferns",
  "jacks",
  "swine",
  "scanners",
  "staffed",
  "mockery",
  "geithner",
  "wishful",
  "curators",
  "andean",
  "derrida",
  "hines",
  "borden",
  "sergei",
  "martyrs",
  "comedies",
  "resists",
  "evanston",
  "buckled",
  "condos",
  "delights",
  "stashed",
  "montage",
  "pretends",
  "trudged",
  "dover",
  "angier",
  "bluray",
  "graphical",
  "marveled",
  "sloane",
  "marcy",
  "waging",
  "comfy",
  "vetoed",
  "levers",
  "gaines",
  "magnets",
  "malik",
  "marquee",
  "darlin",
  "slashing",
  "universes",
  "browne",
  "meteors",
  "quinones",
  "squads",
  "decipher",
  "rowland",
  "miley",
  "allotted",
  "ensued",
  "tabletop",
  "nested",
  "cyclical",
  "supervise",
  "statehood",
  "respite",
  "bathe",
  "elsie",
  "tillotson",
  "dashing",
  "harming",
  "posited",
  "fullest",
  "enslaved",
  "forcibly",
  "unesco",
  "nameless",
  "deploying",
  "shelling",
  "trolley",
  "triad",
  "bordering",
  "finley",
  "thawed",
  "cooker",
  "unsettled",
  "overrun",
  "resonates",
  "operas",
  "facet",
  "markup",
  "proponent",
  "dawned",
  "telltale",
  "alleys",
  "cafes",
  "unfit",
  "creased",
  "summaries",
  "pores",
  "blowout",
  "outfitted",
  "magnified",
  "electrode",
  "wanders",
  "sandler",
  "sprays",
  "menstrual",
  "herrera",
  "visuals",
  "wildfire",
  "fingered",
  "crickets",
  "arrays",
  "glares",
  "maguire",
  "aches",
  "oxidative",
  "durbin",
  "slideshow",
  "manic",
  "crockett",
  "bleachers",
  "sargent",
  "shopper",
  "censure",
  "knockout",
  "mussels",
  "fairs",
  "stamberg",
  "forage",
  "yearbook",
  "virginity",
  "importing",
  "bouts",
  "wondrous",
  "agonizing",
  "colonized",
  "nairobi",
  "impromptu",
  "scripted",
  "postcold",
  "shrub",
  "strangest",
  "allout",
  "homered",
  "gibbons",
  "utterance",
  "moths",
  "posits",
  "nerds",
  "snowfall",
  "travelled",
  "suppl",
  "refinery",
  "imitating",
  "offence",
  "salts",
  "withered",
  "lucia",
  "motivates",
  "crawls",
  "uneasily",
  "deutsche",
  "marquette",
  "breeders",
  "puffing",
  "clawed",
  "unfounded",
  "pointer",
  "variously",
  "screech",
  "necrosis",
  "foresight",
  "equated",
  "obscurity",
  "camped",
  "scoreless",
  "bounces",
  "clutches",
  "nebulae",
  "furrowed",
  "lanterns",
  "crooks",
  "soiled",
  "judas",
  "fillets",
  "ayers",
  "condit",
  "idols",
  "digitally",
  "paychecks",
  "neuronal",
  "digit",
  "dwellers",
  "degrading",
  "bordered",
  "keyboards",
  "bunkers",
  "caviar",
  "boxed",
  "slumber",
  "livin",
  "fractions",
  "summons",
  "proctor",
  "publicist",
  "frankfurt",
  "reeds",
  "whirlwind",
  "stardom",
  "cowards",
  "combating",
  "reinvent",
  "stroller",
  "shreds",
  "tickled",
  "raked",
  "harrowing",
  "crouching",
  "hagel",
  "sockets",
  "dumbbell",
  "faked",
  "thwart",
  "engraving",
  "genomes",
  "crunching",
  "septic",
  "wards",
  "sacked",
  "racked",
  "enticing",
  "manova",
  "harass",
  "memorize",
  "dogged",
  "clippings",
  "cottages",
  "ingram",
  "resided",
  "davey",
  "intifada",
  "weston",
  "bridging",
  "impeach",
  "kenyan",
  "cucumbers",
  "colette",
  "holloway",
  "conveying",
  "grappling",
  "scrawled",
  "affords",
  "pickled",
  "tripoli",
  "clive",
  "sunflower",
  "constrain",
  "downing",
  "meddling",
  "lumia",
  "chimed",
  "pointedly",
  "spaniards",
  "pataki",
  "opting",
  "charters",
  "calendars",
  "foresee",
  "blueberry",
  "crier",
  "knopf",
  "enclave",
  "dreary",
  "vaughan",
  "lumpy",
  "ravaged",
  "engulfed",
  "earthy",
  "spewing",
  "sanjay",
  "capsules",
  "closures",
  "watchful",
  "tendon",
  "wrongs",
  "animosity",
  "beatty",
  "haitians",
  "cultivars",
  "fandom",
  "triumphs",
  "macintosh",
  "prosocial",
  "westeros",
  "clerics",
  "worsening",
  "apostolic",
  "warheads",
  "milling",
  "greeley",
  "larsen",
  "acuity",
  "rebuttal",
  "genie",
  "cholera",
  "commenced",
  "romanian",
  "emile",
  "previews",
  "covariate",
  "tenderly",
  "ethel",
  "underfoot",
  "slimy",
  "legalize",
  "spade",
  "nordic",
  "zipped",
  "handlers",
  "barbour",
  "entangled",
  "tropics",
  "detour",
  "repubs",
  "picky",
  "smirked",
  "swells",
  "humphries",
  "creditor",
  "flaps",
  "staterun",
  "iteration",
  "seduced",
  "rasmussen",
  "fanatics",
  "rescuers",
  "steamy",
  "intensify",
  "streisand",
  "smugglers",
  "bedrock",
  "dukakis",
  "shatter",
  "impulsive",
  "excursion",
  "ringed",
  "shrieks",
  "cripple",
  "perilous",
  "wharton",
  "fateful",
  "compile",
  "donvan",
  "collide",
  "scallions",
  "glacial",
  "ahold",
  "shorty",
  "approves",
  "ridiculed",
  "overrated",
  "playfully",
  "denounce",
  "upholding",
  "disciple",
  "mascot",
  "garza",
  "corral",
  "countess",
  "holyfield",
  "cannes",
  "mormonism",
  "homegrown",
  "damian",
  "mariah",
  "bandit",
  "fullsize",
  "thrashing",
  "selects",
  "crackled",
  "grizzlies",
  "blushing",
  "profane",
  "limitless",
  "middleton",
  "bigoted",
  "cheaply",
  "felon",
  "slanted",
  "moira",
  "minions",
  "graying",
  "sleigh",
  "sanctity",
  "scrooge",
  "reread",
  "bacterium",
  "sufferers",
  "conveyor",
  "sweeter",
  "dinah",
  "defied",
  "gamer",
  "vibrating",
  "agitation",
  "homey",
  "freckled",
  "popup",
  "nineties",
  "epidemics",
  "dismayed",
  "recruiter",
  "molds",
  "reptiles",
  "catchy",
  "threaded",
  "rusher",
  "wildfires",
  "venetian",
  "striding",
  "kelso",
  "mayfield",
  "collage",
  "kellyanne",
  "absorbs",
  "flushing",
  "montaigne",
  "chills",
  "devoured",
  "dulles",
  "creams",
  "giovanni",
  "dialysis",
  "shielding",
  "snatches",
  "caribou",
  "looped",
  "dominique",
  "consumes",
  "margo",
  "fleece",
  "damning",
  "priscilla",
  "enacting",
  "prettier",
  "botched",
  "raged",
  "creeks",
  "snail",
  "eagerness",
  "modular",
  "whitehead",
  "warmup",
  "forwarded",
  "flavorful",
  "knoxville",
  "snapshots",
  "robbers",
  "flapped",
  "raylan",
  "emmanuel",
  "erode",
  "forgo",
  "deceit",
  "altruism",
  "navigator",
  "rearing",
  "redeemed",
  "prodigy",
  "linens",
  "drawback",
  "envied",
  "sketched",
  "tacit",
  "jilly",
  "flicking",
  "cullen",
  "carlisle",
  "neutrinos",
  "corny",
  "lucian",
  "splayed",
  "dusting",
  "matted",
  "outburst",
  "wildcard",
  "envisions",
  "globular",
  "farce",
  "thrusting",
  "issuer",
  "lineages",
  "allege",
  "empress",
  "semblance",
  "shafts",
  "mandarin",
  "veranda",
  "tapestry",
  "courting",
  "dizzying",
  "rooftops",
  "revoked",
  "scrolls",
  "buffs",
  "scolded",
  "anarchist",
  "heaviest",
  "algerian",
  "squealed",
  "ticker",
  "issuance",
  "triangles",
  "bakhtin",
  "underlie",
  "hemmer",
  "delores",
  "immediacy",
  "waller",
  "thwarted",
  "frontline",
  "reston",
  "ignite",
  "medial",
  "worsened",
  "unmet",
  "cornelius",
  "canola",
  "dissident",
  "grapple",
  "esoteric",
  "scams",
  "flatter",
  "innovate",
  "emanating",
  "paving",
  "thrives",
  "oneman",
  "stamina",
  "broadened",
  "sentient",
  "flexed",
  "langley",
  "mediators",
  "jimenez",
  "searing",
  "hitched",
  "obedient",
  "strata",
  "daine",
  "leahy",
  "willed",
  "confronts",
  "scurried",
  "wildest",
  "foraging",
  "patchwork",
  "eaton",
  "excision",
  "variances",
  "pryor",
  "hacks",
  "fours",
  "fondness",
  "dickerson",
  "slider",
  "drummond",
  "droplets",
  "bowden",
  "momentous",
  "trending",
  "refill",
  "callahan",
  "mcintyre",
  "musty",
  "billowing",
  "fountains",
  "gaped",
  "unchecked",
  "centrally",
  "hardline",
  "ascending",
  "sorely",
  "raccoon",
  "boomed",
  "cleanse",
  "valuing",
  "complicit",
  "kimmel",
  "slabs",
  "centres",
  "clearcut",
  "stomping",
  "winslow",
  "putts",
  "snowstorm",
  "moustache",
  "actuality",
  "flooring",
  "shrines",
  "likened",
  "graft",
  "evolves",
  "decaying",
  "mccann",
  "wheeling",
  "inched",
  "windfall",
  "mammalian",
  "walden",
  "overflow",
  "starch",
  "roamed",
  "maude",
  "droid",
  "outlawed",
  "impunity",
  "spatially",
  "maids",
  "exiting",
  "crocodile",
  "entre",
  "knowhow",
  "prism",
  "writhing",
  "agreeable",
  "stirs",
  "bradshaw",
  "contrived",
  "schwab",
  "riparian",
  "bitcoin",
  "distilled",
  "steeped",
  "burgess",
  "plopped",
  "alloy",
  "failings",
  "smuggled",
  "artworks",
  "rustle",
  "unsub",
  "kernels",
  "analysed",
  "shortcuts",
  "brits",
  "clubface",
  "comical",
  "liberate",
  "demonic",
  "impasse",
  "ascension",
  "populous",
  "jumble",
  "craftsman",
  "mania",
  "boyhood",
  "kingwood",
  "recital",
  "buttoned",
  "thumped",
  "armenian",
  "traitors",
  "complied",
  "blaring",
  "cyclist",
  "prescott",
  "talley",
  "noodle",
  "equities",
  "battista",
  "sealing",
  "fainted",
  "negligent",
  "seawater",
  "polyester",
  "polygraph",
  "whacked",
  "conduit",
  "hyperbole",
  "referent",
  "washer",
  "cronies",
  "randi",
  "bronco",
  "ralston",
  "posse",
  "whirl",
  "scented",
  "glassy",
  "combs",
  "tatum",
  "grimy",
  "toobin",
  "circulate",
  "reborn",
  "brighten",
  "unearthed",
  "mayan",
  "antlers",
  "gearing",
  "attuned",
  "entice",
  "mules",
  "diligent",
  "grooves",
  "natalee",
  "conyers",
  "tiananmen",
  "sniffs",
  "effected",
  "grownups",
  "swirls",
  "wield",
  "pedaling",
  "descends",
  "prettiest",
  "litany",
  "matalin",
  "visavis",
  "syntactic",
  "grouse",
  "ejected",
  "surfer",
  "wading",
  "mcdaniel",
  "heresy",
  "floured",
  "geraldine",
  "diversify",
  "radiance",
  "millet",
  "pelvic",
  "savages",
  "succumbed",
  "dearth",
  "gutted",
  "prologue",
  "exertion",
  "glorified",
  "smashes",
  "bolstered",
  "larval",
  "andes",
  "reciting",
  "dieting",
  "camper",
  "stinky",
  "jackpot",
  "islamabad",
  "servaas",
  "glittered",
  "daryn",
  "swamps",
  "keenly",
  "stills",
  "gleaned",
  "amnesia",
  "wellbeing",
  "willfully",
  "rockdale",
  "borrower",
  "premieres",
  "arduous",
  "sighting",
  "finesse",
  "artus",
  "shorten",
  "vases",
  "modelling",
  "grader",
  "legality",
  "sprouted",
  "coulter",
  "melanoma",
  "coups",
  "craze",
  "brownies",
  "melville",
  "ovation",
  "monoxide",
  "kandahar",
  "tombs",
  "elemental",
  "skinned",
  "eastman",
  "suffrage",
  "boyish",
  "headon",
  "eaters",
  "cornered",
  "modality",
  "waterways",
  "lowry",
  "xander",
  "softness",
  "globes",
  "podcasts",
  "revert",
  "ramps",
  "scorched",
  "latte",
  "fonda",
  "stucco",
  "heaps",
  "commend",
  "basing",
  "cradling",
  "leakage",
  "murtaugh",
  "coupe",
  "macvicar",
  "spiraling",
  "stifled",
  "halting",
  "trapping",
  "skillful",
  "stables",
  "degrade",
  "squint",
  "panelists",
  "greets",
  "wrenched",
  "pellets",
  "juncture",
  "roused",
  "portman",
  "furnish",
  "shutout",
  "lilburn",
  "sprained",
  "remarried",
  "boosters",
  "trimming",
  "loudoun",
  "alters",
  "lambs",
  "studs",
  "tractors",
  "replete",
  "lifespan",
  "subtypes",
  "wrongful",
  "karaoke",
  "compliant",
  "glows",
  "rancho",
  "bourdieu",
  "genealogy",
  "atonement",
  "namesake",
  "whoopi",
  "slums",
  "janeiro",
  "stair",
  "youll",
  "poole",
  "crowns",
  "aerobics",
  "stallion",
  "cylinders",
  "frosted",
  "upton",
  "revamped",
  "jayz",
  "shingles",
  "fetched",
  "twofold",
  "senegal",
  "gulls",
  "foregoing",
  "throng",
  "thorns",
  "analyse",
  "dodged",
  "tinkering",
  "alexa",
  "marla",
  "chanted",
  "gorlen",
  "morphin",
  "propriety",
  "widowed",
  "tremor",
  "signified",
  "gnarled",
  "warms",
  "fringes",
  "intl",
  "spooked",
  "collided",
  "elspeth",
  "lasagna",
  "reith",
  "garnett",
  "coils",
  "disarray",
  "tailback",
  "frosty",
  "tillerson",
  "elisabeth",
  "thine",
  "leeks",
  "groping",
  "stocky",
  "righty",
  "finalized",
  "unease",
  "exclaims",
  "lauer",
  "snowden",
  "casing",
  "peptide",
  "cavernous",
  "caress",
  "matured",
  "streep",
  "rehearsed",
  "hardcover",
  "coolly",
  "robby",
  "brunt",
  "geniuses",
  "footwear",
  "swarming",
  "clashed",
  "elegantly",
  "leveraged",
  "mastering",
  "dulaney",
  "flowered",
  "relapse",
  "rodent",
  "acreage",
  "glinting",
  "sleepless",
  "encased",
  "peregrine",
  "illogical",
  "tacky",
  "attaching",
  "farrakhan",
  "evocative",
  "parades",
  "musically",
  "quart",
  "improvise",
  "umpires",
  "couches",
  "wolff",
  "grimes",
  "trumps",
  "haunts",
  "commence",
  "wrapper",
  "earmarks",
  "spherical",
  "micah",
  "juniper",
  "allegra",
  "lowly",
  "margarita",
  "whatnot",
  "petersen",
  "patched",
  "coerced",
  "shellfish",
  "crossings",
  "antigen",
  "pinning",
  "bared",
  "conroe",
  "prevails",
  "doorways",
  "stirfry",
  "collars",
  "gritted",
  "augment",
  "clair",
  "kendrick",
  "felons",
  "settler",
  "fasten",
  "unloaded",
  "reverie",
  "hanoi",
  "purified",
  "pretext",
  "lightest",
  "chipotle",
  "carlyle",
  "hayek",
  "mcintosh",
  "postage",
  "hodges",
  "superfund",
  "cruisers",
  "eternally",
  "platte",
  "swooped",
  "tendrils",
  "complying",
  "leadoff",
  "chernobyl",
  "rossi",
  "matisse",
  "rehearse",
  "flustered",
  "undressed",
  "clasp",
  "handguns",
  "chartered",
  "squeal",
  "friggin",
  "formality",
  "ramsay",
  "bugging",
  "estonia",
  "affleck",
  "espoused",
  "unitary",
  "lifetimes",
  "hitherto",
  "moret",
  "whooping",
  "radial",
  "reigns",
  "donahue",
  "treasured",
  "hubris",
  "newborns",
  "hamid",
  "elisa",
  "dryly",
  "circadian",
  "raincoat",
  "squirmed",
  "marbles",
  "ducking",
  "dumbbells",
  "strives",
  "russo",
  "sonar",
  "parka",
  "subverted",
  "doubly",
  "grainy",
  "stools",
  "fairfield",
  "ranches",
  "falwell",
  "addison",
  "abramson",
  "skied",
  "mingle",
  "moroccan",
  "roomy",
  "ascended",
  "reckoned",
  "netting",
  "symbolize",
  "gusts",
  "backups",
  "bookcase",
  "movin",
  "thicket",
  "cadre",
  "waffles",
  "sitter",
  "federer",
  "jabbed",
  "newscast",
  "precepts",
  "seeped",
  "taxfree",
  "forested",
  "licks",
  "nicki",
  "sputtered",
  "curtail",
  "aromatic",
  "canvases",
  "hathaway",
  "wrenching",
  "reeve",
  "guerrero",
  "drinkers",
  "intercut",
  "pleases",
  "bubbly",
  "skewers",
  "mined",
  "gracias",
  "grazed",
  "likable",
  "untie",
  "perished",
  "boutiques",
  "spotify",
  "glistened",
  "eruptions",
  "riddled",
  "frenchman",
  "mobil",
  "youii",
  "bellies",
  "distaste",
  "grandkids",
  "usaid",
  "lauded",
  "oneday",
  "laidback",
  "arterial",
  "barbaric",
  "blossomed",
  "budgeting",
  "sneaked",
  "basins",
  "redshirt",
  "streetcar",
  "goldwater",
  "cascades",
  "exogenous",
  "garry",
  "mccall",
  "wavering",
  "deadliest",
  "kayla",
  "confesses",
  "shrapnel",
  "antelope",
  "yellowed",
  "foxes",
  "allusion",
  "langdon",
  "pickups",
  "worded",
  "condone",
  "primates",
  "cleavage",
  "eater",
  "networked",
  "darfur",
  "chimes",
  "syndicate",
  "annoy",
  "delve",
  "critters",
  "dogmatic",
  "retiree",
  "brianna",
  "mourners",
  "harbors",
  "slalom",
  "lefties",
  "sittin",
  "tacked",
  "maris",
  "alfonso",
  "pastries",
  "chimps",
  "privy",
  "starched",
  "cello",
  "harkin",
  "lentils",
  "carefree",
  "coffers",
  "blazed",
  "tweaks",
  "pedigree",
  "veritable",
  "chats",
  "dazzle",
  "reviving",
  "matheny",
  "sheppard",
  "billings",
  "prius",
  "woodson",
  "plissken",
  "spokane",
  "kepler",
  "rescuing",
  "hermann",
  "marquez",
  "glitch",
  "pretrial",
  "disperse",
  "tristan",
  "scallops",
  "pavel",
  "scrawny",
  "selma",
  "plantings",
  "blight",
  "heron",
  "apologise",
  "keynes",
  "latency",
  "radiator",
  "textured",
  "annabel",
  "cleverly",
  "coworker",
  "foray",
  "tutorials",
  "genitals",
  "heaped",
  "showcases",
  "annotated",
  "storied",
  "protons",
  "pigments",
  "peels",
  "hatched",
  "slurs",
  "sisko",
  "dozed",
  "entrances",
  "greener",
  "trappings",
  "remington",
  "slander",
  "trashed",
  "rancher",
  "isolating",
  "bigots",
  "heartless",
  "beasley",
  "carousel",
  "shuttered",
  "styled",
  "credence",
  "deranged",
  "realtors",
  "enveloped",
  "primers",
  "hastert",
  "walled",
  "mortals",
  "issuers",
  "breezy",
  "dilution",
  "landfall",
  "rivalries",
  "staked",
  "wideopen",
  "sudanese",
  "paisley",
  "pamphlets",
  "colmes",
  "overruled",
  "drooping",
  "shimmered",
  "wallets",
  "defies",
  "parched",
  "pastime",
  "deflect",
  "barlow",
  "gripes",
  "mainline",
  "citadel",
  "notoriety",
  "rationing",
  "laments",
  "jindal",
  "pacey",
  "alienate",
  "euphoria",
  "salinity",
  "haidt",
  "plugins",
  "bidder",
  "strenuous",
  "seeping",
  "wavered",
  "centauri",
  "prolong",
  "sheik",
  "campsite",
  "deluded",
  "slits",
  "angler",
  "conundrum",
  "brood",
  "stoves",
  "dwellings",
  "shrinks",
  "breached",
  "wakefield",
  "impacting",
  "celiac",
  "hendricks",
  "trampled",
  "balked",
  "vistas",
  "mangled",
  "perils",
  "bette",
  "offroad",
  "keyes",
  "whoop",
  "dreamers",
  "midair",
  "profess",
  "taxonomic",
  "shunned",
  "licensure",
  "droughts",
  "succumb",
  "heats",
  "ferrell",
  "macedonia",
  "polishing",
  "opposites",
  "innocuous",
  "bigot",
  "primed",
  "bandits",
  "merritt",
  "menlo",
  "proofs",
  "blurring",
  "topnotch",
  "vignettes",
  "wherefore",
  "sketchy",
  "dearborn",
  "vandalism",
  "parisian",
  "healy",
  "humbled",
  "brandt",
  "sparking",
  "scoffed",
  "hammock",
  "saith",
  "fictions",
  "shorthand",
  "stacking",
  "schiavo",
  "habitable",
  "minuscule",
  "cabaret",
  "cameo",
  "waterway",
  "vigilance",
  "severance",
  "latitudes",
  "professed",
  "proton",
  "conley",
  "sweats",
  "quivered",
  "resection",
  "tropes",
  "brill",
  "raters",
  "appease",
  "geologist",
  "henson",
  "unsteady",
  "sternly",
  "renters",
  "donned",
  "receded",
  "recharge",
  "raffalon",
  "prodded",
  "shameless",
  "impart",
  "hairline",
  "overlooks",
  "barns",
  "ivanka",
  "earnestly",
  "bridal",
  "unloading",
  "voicing",
  "trawl",
  "kennedys",
  "juarez",
  "capers",
  "sprinted",
  "verde",
  "backlog",
  "forte",
  "manicured",
  "pendleton",
  "phonemic",
  "filler",
  "baines",
  "onlookers",
  "palaces",
  "redirect",
  "levees",
  "satisfies",
  "rewritten",
  "fruition",
  "pantheon",
  "agility",
  "childlike",
  "dropouts",
  "seton",
  "albanian",
  "tranquil",
  "blanks",
  "frenzied",
  "salvaged",
  "deletion",
  "jogged",
  "stave",
  "parasitic",
  "cadence",
  "geordi",
  "simms",
  "lifeline",
  "venous",
  "vitals",
  "recapture",
  "whitetail",
  "salience",
  "paine",
  "dropbox",
  "pokes",
  "handset",
  "waterfowl",
  "polenta",
  "vertigo",
  "bunched",
  "masterful",
  "wielding",
  "plumes",
  "werent",
  "garages",
  "ellington",
  "delicacy",
  "pendant",
  "meatballs",
  "heralded",
  "satanic",
  "embattled",
  "bowles",
  "reinhardt",
  "propane",
  "decoys",
  "authorial",
  "conjured",
  "rotted",
  "phased",
  "addie",
  "cannons",
  "quizzes",
  "copeland",
  "stammered",
  "finnegan",
  "spurrier",
  "custard",
  "awarding",
  "rainwater",
  "worldcom",
  "laziness",
  "spinoza",
  "redefined",
  "liasson",
  "wasps",
  "bulldog",
  "mystique",
  "painless",
  "tampering",
  "acronym",
  "essex",
  "taxis",
  "goodell",
  "shroud",
  "reels",
  "padilla",
  "showroom",
  "barnard",
  "snarky",
  "execs",
  "fillmore",
  "ascend",
  "superboy",
  "clans",
  "meteorite",
  "subspace",
  "wayward",
  "expertly",
  "movers",
  "chime",
  "attaches",
  "pregame",
  "resorted",
  "couscous",
  "waded",
  "amman",
  "topple",
  "fourday",
  "sharif",
  "rosary",
  "negation",
  "sharpen",
  "pegged",
  "decoy",
  "dismisses",
  "laureate",
  "midsummer",
  "breyer",
  "stunts",
  "donatello",
  "feeder",
  "rematch",
  "sayer",
  "paddling",
  "diseased",
  "barrow",
  "betraying",
  "hapless",
  "handlebar",
  "feverish",
  "posit",
  "scrolling",
  "skaters",
  "rollers",
  "vests",
  "pollutant",
  "bookshelf",
  "chants",
  "trickled",
  "antivirus",
  "saltwater",
  "lingers",
  "episodic",
  "governs",
  "marcie",
  "marred",
  "worcester",
  "surfers",
  "creases",
  "outliers",
  "auditions",
  "swears",
  "reprints",
  "delacroix",
  "lecturing",
  "bushy",
  "smarts",
  "theyll",
  "harvests",
  "canary",
  "reclaimed",
  "utensils",
  "corollary",
  "subtract",
  "faltered",
  "kellogg",
  "endearing",
  "randal",
  "occupant",
  "starlight",
  "integer",
  "abramoff",
  "scorsese",
  "swarmed",
  "premiered",
  "speckled",
  "howto",
  "gastric",
  "arcane",
  "deleting",
  "winking",
  "menendez",
  "ferdinand",
  "flatten",
  "brokaw",
  "cheery",
  "legacies",
  "thickly",
  "dizziness",
  "guzman",
  "groped",
  "snarling",
  "gradients",
  "kline",
  "ovens",
  "messes",
  "libel",
  "oncology",
  "coincides",
  "configure",
  "rewriting",
  "bullish",
  "phrasing",
  "brimming",
  "seduction",
  "pollard",
  "beeps",
  "whoosh",
  "senor",
  "openair",
  "panes",
  "tonal",
  "presidio",
  "proclaims",
  "craftsmen",
  "archy",
  "vacancies",
  "loudest",
  "sugary",
  "dalai",
  "squeaked",
  "mottled",
  "lunge",
  "flocks",
  "crested",
  "booted",
  "tarnished",
  "dentists",
  "masse",
  "saban",
  "americana",
  "sorta",
  "lattice",
  "hippies",
  "stupidly",
  "paucity",
  "ponies",
  "debtors",
  "innuendo",
  "realtor",
  "nephews",
  "wisps",
  "repaid",
  "rebounded",
  "scrapes",
  "displace",
  "grassley",
  "crutches",
  "fanciful",
  "pointers",
  "jameson",
  "occult",
  "frugal",
  "canister",
  "marketer",
  "verne",
  "snails",
  "candor",
  "mansions",
  "exporters",
  "valentino",
  "barclays",
  "colds",
  "blisters",
  "studded",
  "sprouting",
  "devour",
  "fester",
  "purses",
  "denzel",
  "twirling",
  "takeaway",
  "fiscally",
  "tradeoff",
  "dunlap",
  "forfeit",
  "angling",
  "saleh",
  "mugabe",
  "recoil",
  "revolve",
  "himher",
  "punks",
  "norville",
  "freer",
  "hanover",
  "romances",
  "bloomed",
  "glinted",
  "barbra",
  "fervent",
  "aretha",
  "rowan",
  "clawing",
  "forlorn",
  "partake",
  "takeout",
  "rockfish",
  "demeaning",
  "vacated",
  "dialing",
  "amenable",
  "scoops",
  "tiers",
  "jamming",
  "penalized",
  "cranked",
  "tweaking",
  "helpers",
  "excite",
  "comme",
  "riveting",
  "underlies",
  "overcast",
  "graces",
  "oozing",
  "levee",
  "limped",
  "enlighten",
  "alluring",
  "artistry",
  "mediums",
  "mouthed",
  "pitts",
  "clipping",
  "warring",
  "backpacks",
  "morbid",
  "woolen",
  "northward",
  "dwindled",
  "enrolling",
  "quickest",
  "northside",
  "snipers",
  "saddled",
  "additives",
  "covington",
  "discord",
  "coriander",
  "niches",
  "expectant",
  "depaul",
  "greats",
  "astray",
  "utilizes",
  "mcpherson",
  "donnelly",
  "bloodied",
  "walkin",
  "freedman",
  "strangle",
  "cahill",
  "sweetened",
  "stuffy",
  "entree",
  "deirdre",
  "knobs",
  "rations",
  "lenora",
  "ranting",
  "resonated",
  "optic",
  "nasser",
  "webpage",
  "maddox",
  "thinned",
  "squirming",
  "innocents",
  "creighton",
  "soulful",
  "muses",
  "hedgehog",
  "spines",
  "errant",
  "maples",
  "mutters",
  "interacts",
  "layering",
  "theta",
  "bindings",
  "jayne",
  "manicure",
  "jonbenet",
  "throwback",
  "wounding",
  "tinnitus",
  "apricot",
  "courteous",
  "palatable",
  "stanza",
  "censor",
  "haggard",
  "amplify",
  "scots",
  "debatable",
  "screeched",
  "passover",
  "toned",
  "martyrdom",
  "stomp",
  "tilts",
  "subpoenas",
  "idling",
  "midsize",
  "selfless",
  "defaults",
  "radiated",
  "deities",
  "gangsters",
  "praxis",
  "bassist",
  "humiliate",
  "lockhart",
  "villanova",
  "partisans",
  "breezes",
  "basra",
  "scotia",
  "stalling",
  "cordelia",
  "secretion",
  "farmed",
  "tumour",
  "compiling",
  "concur",
  "throbbed",
  "plaques",
  "meditate",
  "upsets",
  "graze",
  "basque",
  "posturing",
  "frist",
  "cartons",
  "carvings",
  "newsmaker",
  "tully",
  "shivers",
  "cortez",
  "annuity",
  "castiron",
  "lockers",
  "mcmillan",
  "hotly",
  "sheehan",
  "preamble",
  "ramadan",
  "twine",
  "lunges",
  "brees",
  "ladders",
  "darby",
  "polluting",
  "rowdy",
  "crabtree",
  "unveiling",
  "flanagan",
  "cleans",
  "cravings",
  "mathews",
  "emptying",
  "backfire"
];

// src/strongphrase/index.ts
var strongphrase = {
  generate: generatePassPhrase,
  toKey: generateStrongKey,
  recreateKey: recreateStrongKey
};

// src/utils/simpleB64.ts
var reverse = [];
var B64_CODE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
for (let i = 0; i < B64_CODE.length; i++)
  reverse[B64_CODE.charCodeAt(i)] = i;
reverse["-".charCodeAt(0)] = 62;
reverse["_".charCodeAt(0)] = 63;
var simple_b64_regex = /^([A-Za-z0-9+/_\-]{4})*$/;
function simpleBase64ToArrayBuffer(base64) {
  if (!simple_b64_regex.test(base64))
    throw new TypeError(`Invalid ('simple') base64 string - must match '${simple_b64_regex}'`);
  const buffer = new ArrayBuffer(base64.length * 3 / 4 + 1);
  const view = new DataView(buffer);
  for (let i = base64.length - 4, j = buffer.byteLength - 4; i >= 0; i -= 4, j -= 3) {
    const a = reverse[base64.charCodeAt(i)];
    const b = reverse[base64.charCodeAt(i + 1)];
    const c = reverse[base64.charCodeAt(i + 2)];
    const d = reverse[base64.charCodeAt(i + 3)];
    view.setUint32(j, a << 18 | b << 12 | c << 6 | d);
  }
  return new Uint8Array(buffer, 1);
}

// src/utils/index.ts
var utils = {
  simpleBase64ToArrayBuffer,
  base64ToArrayBuffer,
  arrayBufferToBase64,
  base62ToArrayBuffer32,
  arrayBuffer32ToBase62,
  base62ToBase64,
  base64ToBase62,
  isBase62Encoded,
  assemblePayload,
  extractPayload
};

// src/file/system.ts
var SBFileSystem = class {
  server;
  channelList = [];
  constructor(sbConfig) {
    if (typeof sbConfig !== "object") {
      throw new Error("SBFileSystem(): sbConfig is null (must give SBServer config)");
    }
    this.server = new Snackabra(sbConfig);
  }
  // basic upload single buffer
  uploadBuffer(myChannelId, payload, name = "") {
    if (!myChannelId) {
      throw new Error("myChannelId is null");
    }
    return new Promise((resolve) => {
      if (!this.server.storage) {
        console.log("'this.server': ", this.server);
        throw new Error("storage not initialized");
      }
      this.server.storage.storeData(payload, "p", myChannelId).then((res) => {
        res.fileName = name;
        res.dateAndTime = (/* @__PURE__ */ new Date()).toISOString();
        if (this.server.storage.shardServer)
          res.shardServer = this.server.storage.shardServer;
        delete res["iv"];
        delete res["salt"];
        Promise.resolve(res.verification).then((v) => {
          res.verification = v;
          resolve(res);
        });
      });
    });
  }
  uploadBrowserFileList(myChannelId, fileMap, bufferMap) {
    console.info("uploadBrowserFileList() not implemented yet");
    console.log(myChannelId, fileMap, bufferMap);
  }
};

// src/file/index.ts
var file = {
  fs: SBFileSystem
};

// src/browser/files.ts
var SKIP_DIR = true;
var DEBUG3 = false;
var DEBUG23 = false;
var DEBUG32 = false;
var version2 = "0.0.19";
if (DEBUG3)
  console.warn("==== SBFileHelper.ts v" + version2 + " loaded ====");
function getProperties(obj, propertyList2) {
  const properties = {};
  propertyList2.forEach((property) => {
    if (obj.hasOwnProperty(property)) {
      properties[property] = obj[property];
    }
  });
  Object.getOwnPropertyNames(obj).forEach((property) => {
    if (propertyList2.includes(property) && !properties.hasOwnProperty(property)) {
      properties[property] = obj[property];
    }
  });
  for (const property in obj) {
    if (propertyList2.includes(property) && !properties.hasOwnProperty(property)) {
      properties[property] = obj[property];
    }
  }
  return properties;
}
function getMimeType(fileName) {
  const MIME_TYPES = {
    ".aac": "audio/aac",
    // AAC audio
    ".abw": "application/x-abiword",
    // AbiWord document
    ".arc": "application/x-freearc",
    // Archive document (multiple files embedded)
    ".avif": "image/avif",
    // AVIF image
    ".avi": "video/x-msvideo",
    // AVI: Audio Video Interleave
    ".azw": "application/vnd.amazon.ebook",
    // Amazon Kindle eBook format
    ".bin": "application/octet-stream",
    // Any kind of binary data
    ".bmp": "image/bmp",
    // Windows OS/2 Bitmap Graphics
    ".bz": "application/x-bzip",
    // BZip archive
    ".bz2": "application/x-bzip2",
    // BZip2 archive
    ".cda": "application/x-cdf",
    // CD audio
    ".csh": "application/x-csh",
    // C-Shell script
    ".css": "text/css",
    // Cascading Style Sheets (CSS)
    ".csv": "text/csv",
    // Comma-separated values (CSV)
    ".doc": "application/msword",
    // Microsoft Word
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    // Microsoft Word (OpenXML)
    ".eot": "application/vnd.ms-fontobject",
    // MS Embedded OpenType fonts
    ".epub": "application/epub+zip",
    // Electronic publication (EPUB)
    ".gz": "application/gzip",
    // GZip Compressed Archive
    ".gif": "image/gif",
    // Graphics Interchange Format (GIF)
    ".htm": "text/html",
    // HyperText Markup Language (HTML)
    ".html": "text/html",
    // HyperText Markup Language (HTML)
    ".ico": "image/vnd.microsoft.icon",
    // Icon format
    ".ics": "text/calendar",
    // iCalendar format
    ".jar": "application/java-archive",
    // Java Archive (JAR)
    ".jpeg": "image/jpeg",
    // JPEG images
    ".jpg": "image/jpeg",
    // JPEG images
    ".js": "text/javascript\xA0(Specifications:\xA0HTML\xA0and\xA0RFC 9239)",
    // JavaScript
    ".json": "application/json",
    // JSON format
    ".jsonld": "application/ld+json",
    // JSON-LD format
    ".mid": "audio/midi",
    // Musical Instrument Digital Interface (MIDI)
    ".midi": "audio/midi",
    // Musical Instrument Digital Interface (MIDI)
    ".mjs": "text/javascript",
    // JavaScript module
    ".mp3": "audio/mpeg",
    // MP3 audio
    ".mp4": "video/mp4",
    // MP4 video
    ".mpeg": "video/mpeg",
    // MPEG Video
    ".mpkg": "application/vnd.apple.installer+xml",
    // Apple Installer Package
    ".odp": "application/vnd.oasis.opendocument.presentation",
    // OpenDocument presentation document
    ".ods": "application/vnd.oasis.opendocument.spreadsheet",
    // OpenDocument spreadsheet document
    ".odt": "application/vnd.oasis.opendocument.text",
    // OpenDocument text document
    ".oga": "audio/ogg",
    // OGG audio
    ".ogv": "video/ogg",
    // OGG video
    ".ogx": "application/ogg",
    // OGG
    ".opus": "audio/opus",
    // Opus audio
    ".otf": "font/otf",
    // OpenType font
    ".png": "image/png",
    // Portable Network Graphics
    ".pdf": "application/pdf",
    // Adobe Portable Document Format (PDF)
    ".php": "application/x-httpd-php",
    // Hypertext Preprocessor (Personal Home Page)
    ".ppt": "application/vnd.ms-powerpoint",
    // Microsoft PowerPoint
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    // Microsoft PowerPoint (OpenXML)
    ".rar": "application/vnd.rar",
    // RAR archive
    ".rtf": "application/rtf",
    // Rich Text Format (RTF)
    ".sh": "application/x-sh",
    // Bourne shell script
    ".svg": "image/svg+xml",
    // Scalable Vector Graphics (SVG)
    ".tar": "application/x-tar",
    // Tape Archive (TAR)
    ".tif": "image/tiff",
    // Tagged Image File Format (TIFF)
    ".tiff": "image/tiff",
    // Tagged Image File Format (TIFF)
    ".ts": "video/mp2t",
    // MPEG transport stream
    ".ttf": "font/ttf",
    // TrueType Font
    ".txt": "text/plain",
    // Text, (generally ASCII or ISO 8859-n)
    ".vsd": "application/vnd.visio",
    // Microsoft Visio
    ".wav": "audio/wav",
    // Waveform Audio Format
    ".weba": "audio/webm",
    // WEBM audio
    ".webm": "video/webm",
    // WEBM video
    ".webp": "image/webp",
    // WEBP image
    ".woff": "font/woff",
    // Web Open Font Format (WOFF)
    ".woff2": "font/woff2",
    // Web Open Font Format (WOFF)
    ".xhtml": "application/xhtml+xml",
    // XHTML
    ".xls": "application/vnd.ms-excel",
    // Microsoft Excel
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    // Microsoft Excel (OpenXML)
    ".xml": "application/xml",
    // XML
    ".xul": "application/vnd.mozilla.xul+xml",
    // XUL
    ".zip": "application/zip",
    // ZIP archive
    ".7z": "application/x-7z-compressed"
    // 7-zip archive
  };
  const fileExtension = fileName.slice(fileName.lastIndexOf("."));
  return MIME_TYPES[fileExtension];
}
var propertyList = [
  "lastModified",
  "name",
  "type",
  "size",
  "webkitRelativePath",
  "fullPath",
  "isDirectory",
  "isFile",
  "SBitemNumber",
  "SBitemNumberList",
  "fileContentCandidates",
  "fileContents",
  "uniqueShardId",
  "SBparentEntry",
  "SBparentNumber",
  "SBfoundMetaData",
  "SBfullName"
];
window.SBFileHelperReady = new Promise((resolve, reject) => {
  window.SBFileHelperReadyResolve = resolve;
  window.SBFileHelperReadyReject = reject;
});
window.SBFileHelperReadyResolve();
var SBFileHelperReady = window.SBFileHelperReady;
function testToRead(file2, location) {
  try {
    const reader = new FileReader();
    reader.readAsText(file2);
    reader.onload = (e) => {
      if (DEBUG23) {
        console.log("========================================================");
        console.log(`[${location}] was able to readAsText():`);
        console.log(file2);
      }
      if (e.target === null) {
        if (DEBUG3)
          console.log("**** e.target is null ****");
      } else {
        if (DEBUG23)
          console.log(`[${location}] (direct) successfully read file ${file2.name}`);
      }
    };
  } catch (error) {
    try {
      if (file2.file) {
        let originalFile = file2;
        file2.file((file3) => {
          if (DEBUG23) {
            console.log("========================================================");
            console.log(`[${location}] was able to get a file() for object:`);
            console.log(originalFile);
            console.log(file3);
          }
          const reader = new FileReader();
          reader.readAsText(file3);
          reader.onload = (e) => {
            if (e.target === null) {
              console.log("**** e.target is null ****");
            } else {
              if (DEBUG23)
                console.log(`[${location}] (using file()) successfully read file ${file3.name}`);
            }
          };
        });
      }
    } catch (error2) {
      console.log(`[${location}] error reading file ${file2.name}`);
    }
  }
}
var createCounter = () => {
  let counter = 0;
  const inc = async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    counter++;
    return counter - 1;
  };
  return { inc };
};
var printedWarning = false;
function printWarning() {
  if (!printedWarning) {
    console.log("================================================");
    console.log("Warning: you are running in 'local web page' mode");
    console.log("on a browser that has some restrictions.");
    console.log("");
    console.log("So far, looks like this browser will not let you");
    console.log("navigate *into* directories that are drag-and-dropped");
    console.log("Might also be having issues getting meta data,");
    console.log("as well as getting the 'full' path of the file.");
    console.log("============================================");
    printedWarning = true;
  }
  if (window.directoryDropText)
    window.directoryDropText.innerHTML = "Click to choose directories<br />(drag and drop might not work))";
}
var FileHelper = class {
  // server: Snackabra;
  // todo: perhaps from configuration?
  #ignoreFileSet = /* @__PURE__ */ new Set();
  // give any file or item "seen" a unique number (reset on every UI interaction)
  #globalItemNumber = createCounter();
  // if there are items, files will at first be numbered the same (reset on every UI interaction)
  #globalFileItemNumber = createCounter();
  // all of our scanning results go here, unabridged (reset on every UI interaction)
  #globalFileMap = /* @__PURE__ */ new Map();
  // this is the distilled list of files we will add to finalFileList (reset on every UI interaction)
  #currentFileList = /* @__PURE__ */ new Map();
  // this is one accumulative, and used directly for the table (NOT reset)
  finalFileList = /* @__PURE__ */ new Map();
  // track all (unique) array buffers that have been read (NOT reset)
  // TODO: strictly speaking we don't do garbage collection on this
  globalBufferMap = /* @__PURE__ */ new Map();
  constructor() {
    this.#ignoreFileSet.add(".DS_Store");
    this.#ignoreFileSet.add("/.DS_Store");
    this.#ignoreFileSet.add(/.*~$/);
  }
  ignoreFile(fileName) {
    if (this.#ignoreFileSet.has(fileName))
      return true;
    for (let ignoreFile of this.#ignoreFileSet)
      if (ignoreFile instanceof RegExp) {
        if (ignoreFile.test(fileName))
          return true;
      }
    return false;
  }
  //#region SCAN ITEMS AND FILES ****************************************************************************************
  // these are called by the UI code to parse any files or directories that have been selected
  // by the UI, whether through a file input or a drag-and-drop operation
  // returns metadata for a file object whether it is a File or FileEntry
  extractFileMetadata(fileObject) {
    function localResolve(metadata) {
      return metadata;
    }
    return new Promise((resolve) => {
      const metadata = {};
      if (fileObject instanceof File) {
        if (fileObject.name)
          metadata.name = fileObject.name;
        if (fileObject.size)
          metadata.size = fileObject.size;
        if (fileObject.type)
          metadata.type = fileObject.type;
        if (fileObject.lastModified)
          metadata.lastModified = fileObject.lastModified;
        if (fileObject.webkitRelativePath)
          metadata.webkitRelativePath = fileObject.webkitRelativePath;
      }
      if (typeof FileSystemEntry !== "undefined" && fileObject instanceof FileSystemEntry) {
        if (fileObject.name)
          metadata.name = fileObject.name;
        if (fileObject.fullPath)
          metadata.fullPath = fileObject.fullPath;
        if (fileObject.isDirectory !== void 0)
          metadata.isDirectory = fileObject.isDirectory;
        if (fileObject.isFile !== void 0)
          metadata.isFile = fileObject.isFile;
        metadata.noGetMetaData = true;
      }
      if (typeof FileSystemFileEntry !== "undefined" && fileObject instanceof FileSystemFileEntry) {
        if (fileObject.fullPath)
          metadata.fullPath = fileObject.fullPath;
        if (fileObject.isDirectory !== void 0)
          metadata.isDirectory = fileObject.isDirectory;
        if (fileObject.isFile !== void 0)
          metadata.isFile = fileObject.isFile;
        if (fileObject.file)
          metadata.file = fileObject.file;
      }
      if (typeof FileSystemFileEntry !== "undefined" && fileObject instanceof FileSystemFileEntry && fileObject.getMetadata) {
        fileObject.getMetadata((fileMetadata) => {
          metadata.getMetaDataSize = fileMetadata.size;
          metadata.getMetaDataModificationTime = fileMetadata.modificationTime;
          if (fileObject.file)
            fileObject.file((file2) => {
              metadata.getMetaDataFile = file2;
              metadata.getMetaDataType = file2.type;
              resolve(localResolve(metadata));
            }, (error) => {
              metadata.getMetaDataGetFileError = error;
              resolve(localResolve(metadata));
            });
        }, (error) => {
          metadata.getMetaDataError = error;
          resolve(localResolve(metadata));
        });
      } else {
        metadata.noGetMetaData = true;
        resolve(localResolve(metadata));
      }
    });
  }
  async scanFile(file2, fromItem) {
    if (!file2)
      return;
    if (DEBUG23)
      testToRead(file2, "scanFile");
    if (this.ignoreFile(file2.name))
      return;
    let path;
    if (file2 instanceof File) {
      path = file2.webkitRelativePath;
    } else if (file2 instanceof FileSystemEntry) {
      path = file2.fullPath;
    } else if (file2 instanceof FileSystemFileEntry) {
      path = file2.fullPath;
    } else {
      console.warn("**** Unknown file type (should not happen):");
      console.log(file2);
      return;
    }
    let fileNumber = await (fromItem === -1 ? this.#globalFileItemNumber.inc() : fromItem);
    file2.SBitemNumber = fileNumber;
    let fromItemText = fromItem === -1 ? "" : ` (from item ${fromItem})`;
    await this.extractFileMetadata(file2).then((metadata) => {
      if (DEBUG23)
        console.log(`adding ${fileNumber}`);
      file2.SBfoundMetaData = metadata;
      if (path === "") {
        this.#globalFileMap.set(`file ${fileNumber} ${fromItemText} name: '/` + file2.name + "' ", file2);
      } else {
        this.#globalFileMap.set(`file ${fileNumber} ${fromItemText} path: '/` + path + "'", file2);
      }
    }).catch((error) => {
      console.log("Error getting meta data for FILE (should NOT happen):");
      console.log(file2);
      console.log(error);
    });
  }
  scanFileList(files) {
    if (!files)
      return;
    if (DEBUG3)
      console.log(`==== scanFileList called, files.length: ${files.length}`);
    if (files)
      for (let i = 0; i < files.length; i++)
        this.scanFile(files[i], -1);
  }
  async scanItem(item, parent) {
    if (!item)
      return;
    if (this.ignoreFile(item.name))
      return;
    if (DEBUG23)
      testToRead(item, "scanItem");
    let itemNumber = await this.#globalItemNumber.inc();
    if (DEBUG23) {
      console.log(`scanItem ${itemNumber} ${item.name}`);
      console.log(item);
    }
    let parentString = "";
    item.SBitemNumber = itemNumber;
    if (parent !== null) {
      item.SBparentEntry = parent;
      item.SBparentNumber = parent.SBitemNumber;
      parentString = ` (parent ${parent.SBitemNumber}) `;
      if (!parent.SBfullName)
        parent.SBfullName = parent.name;
      item.SBfullName = parent.SBfullName + "/" + item.name;
    }
    await this.extractFileMetadata(item).then((metadata) => {
      item.SBfoundMetaData = metadata;
    }).catch((error) => {
      console.log("Error getting meta data for ITEM (should not happen):");
      console.log(item);
      console.log(error);
    });
    if (item.isDirectory) {
      const myThis = this;
      let directoryReader = item.createReader();
      item.SBdirectoryReader = directoryReader;
      this.#globalFileMap.set(`item ${itemNumber}: '/` + item.name + `' [directory] ${parentString}`, item);
      directoryReader.readEntries(function(entries) {
        entries.forEach(async function(entry) {
          await myThis.scanItem(entry, item);
        });
      }, function(error) {
        printWarning();
        if (DEBUG3)
          console.log(`Browser restriction: Unable to process this item as directory, '${item.name}':`);
        if (DEBUG23)
          console.log(error);
      });
    } else {
      this.#globalFileMap.set(`item ${itemNumber}: '/` + item.name + "' " + parentString, item);
      item.file((file2) => {
        this.scanFile(file2, itemNumber);
      }, function() {
        printWarning();
      });
    }
  }
  scanItemList(items) {
    if (!items)
      return;
    if (DEBUG3)
      console.log(`==== scanItemList called, items.length: ${items.length}`);
    for (let i = 0; i < items.length; i++) {
      let item = items[i].webkitGetAsEntry();
      if (item)
        this.scanItem(item, null);
      else {
        console.log("just FYI, not a file/webkit entry:");
        console.log(items[i]);
      }
    }
  }
  //#endregion SCAN ITEMS OR FILES *******************************************************************************************************
  // called after every user interaction (eg any possible additions of files)
  afterOperation(callback) {
    setTimeout(() => {
      (async () => {
        console.log("-------DONE building globalFileMap---------");
        console.log(this.#globalFileMap);
        let nameToFullPath = /* @__PURE__ */ new Map();
        let candidateFileList = /* @__PURE__ */ new Map();
        this.#globalFileMap.forEach((value, _key) => {
          if (!this.ignoreFile(value.name)) {
            if (DEBUG23) {
              console.log(`[${value.name}] Processing global file map entry: `);
              console.log(value);
            }
            if (value.SBitemNumber !== void 0) {
              let currentInfo = candidateFileList.get(value.SBitemNumber);
              if (currentInfo) {
                let newInfo = getProperties(value, propertyList);
                Object.assign(newInfo, currentInfo);
                if (value.fullPath && (!newInfo.fullPath || value.fullPath.length > newInfo.fullPath.length))
                  newInfo.fullPath = value.fullPath;
                newInfo.fileContentCandidates.push(value);
                candidateFileList.set(value.SBitemNumber, newInfo);
              } else {
                candidateFileList.set(value.SBitemNumber, Object.assign({}, getProperties(value, propertyList)));
                currentInfo = candidateFileList.get(value.SBitemNumber);
                currentInfo.fileContentCandidates = [value];
              }
            } else if (value.fullPath) {
              if (DEBUG23) {
                console.log(`++++ adding path info for '${value.name}':`);
                console.log(value.fullPath);
                console.log(value);
              }
              nameToFullPath.set(value.name, value.fullPath);
            } else {
              if (DEBUG23) {
                console.log(`++++ ignoring file '${value.name}' in first phase (SHOULD NOT HAPPEN)`);
                console.log(value);
              }
            }
          } else {
            if (DEBUG23)
              console.log(`Ignoring file '${value.name}' (based on ignoreFile)`);
          }
        });
        console.log("-------DONE building candidateFileList---------");
        console.log(candidateFileList);
        candidateFileList.forEach((value, key) => {
          if (value.SBfullName !== void 0 && "/" + value.SBfullName !== value.fullPath) {
            console.log("WARNING: SBfullName and fullPath/name do not match");
            console.log(`Name: ${value.name}, fullPath: ${value.fullPath}, SBfullName: ${value.SBfullName}`);
            console.log(value);
          }
          let uniqueName = value.SBfullName || value.webkitRelativePath + "/" + value.name;
          if (uniqueName !== void 0) {
            if (value.isDirectory === true) {
              uniqueName += " [directory]";
            } else if (value.isFile === true) {
              uniqueName += " [file]";
            }
            if (value.size !== void 0 && value.isDirectory != true) {
              uniqueName += ` [${value.size} bytes]`;
            }
            if (value.lastModified !== void 0) {
              uniqueName += ` [${value.lastModified}]`;
            }
            if (DEBUG23) {
              console.log(`processing object ${key} unique name '${uniqueName}':`);
              console.log(value);
            }
            let currentInfo = this.#currentFileList.get(uniqueName);
            if (currentInfo) {
              let altFullPath = currentInfo.fullPath;
              let altFileContentCandidates = currentInfo.fileContentCandidates;
              let altSbItemNumberList = currentInfo.SBitemNumberList;
              Object.assign(currentInfo, getProperties(value, propertyList));
              if (altFullPath && (!currentInfo.fullPath || altFullPath.length > currentInfo.fullPath.length))
                currentInfo.fullPath = altFullPath;
              if (altFileContentCandidates) {
                if (currentInfo.fileContentCandidates === void 0)
                  currentInfo.fileContentCandidates = [];
                currentInfo.fileContentCandidates.push(...altFileContentCandidates);
              }
              altSbItemNumberList.push(value.SBitemNumber);
              currentInfo.SBitemNumberList = altSbItemNumberList;
            } else {
              value.SBitemNumberList = [value.SBitemNumber];
              this.#currentFileList.set(uniqueName, value);
              currentInfo = candidateFileList.get(uniqueName);
            }
            if (DEBUG23) {
              console.log(`... currentInfo for '${uniqueName}' (${uniqueName}):`);
              console.log(currentInfo);
            }
          } else {
            if (DEBUG3) {
              console.log(`++++ ignoring file - it's lacking fullPath (should be rare)`);
              console.log(value);
            }
          }
        });
        console.log("-------DONE building currentFileList---------");
        console.log(this.#currentFileList);
        async function FP(file2) {
          return new Promise(async (resolve) => {
            try {
              const reader = new FileReader();
              reader.onload = (e) => {
                if (e.target === null || e.target.result === null) {
                  if (DEBUG23)
                    console.log(`+++++++ got a null back for '${file2.name}' (??)`);
                  resolve(null);
                } else if (typeof e.target.result === "string") {
                  if (DEBUG23)
                    console.log(`+++++++ got a 'string' back for '${file2.name}' (??)`);
                  resolve(null);
                } else {
                  if (DEBUG23) {
                    console.log(`+++++++ read file '${file2.name}'`);
                    console.log(e.target.result);
                  }
                  resolve(e.target.result);
                }
              };
              reader.onerror = (event) => {
                if (DEBUG23) {
                  console.log(`Could not read: ${file2.name}`);
                  console.log(event);
                }
                resolve(null);
              };
              await new Promise((resolve2) => setTimeout(resolve2, 20));
              reader.readAsArrayBuffer(file2);
            } catch (error) {
              try {
                if (DEBUG23)
                  console.log(`+++++++ got error on '${file2.name}', will try as FileSystemFileEntry`);
                if (file2.file) {
                  file2.file(async (file3) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      if (e.target === null || e.target.result === null)
                        resolve(null);
                      else if (typeof e.target.result === "string")
                        resolve(null);
                      else
                        resolve(e.target.result);
                    };
                    reader.onerror = () => {
                      resolve(null);
                    };
                    await new Promise((resolve2) => setTimeout(resolve2, 20));
                    reader.readAsArrayBuffer(file3);
                  });
                } else {
                  if (DEBUG23)
                    console.log(`... cannot treat as file: ${file2.name}`);
                }
              } catch (error2) {
                if (DEBUG23)
                  console.log(`Could not read: ${file2.name}`);
              }
              resolve(null);
            }
          });
        }
        async function findFirstResolved(fileList) {
          for (let index = 0; index < fileList.length; index++) {
            let result = await FP(fileList[index]);
            if (result !== null)
              return result;
          }
          if (DEBUG3) {
            console.log("findFirstResolved(): found nothing usable from this fileList");
            console.log(fileList);
          }
          return null;
        }
        let listOfFilePromises = [];
        this.#currentFileList.forEach((value, key) => {
          if (value.fileContentCandidates && !value.uniqueShardId) {
            listOfFilePromises.push(
              new Promise(async (resolve) => {
                findFirstResolved(value.fileContentCandidates).then(async (result) => {
                  if (DEBUG32)
                    console.log(`got response for ${value.name}`);
                  if (!result) {
                    if (DEBUG23)
                      console.log(`... contents are empty for item ${key} (probably a directory)`);
                  } else {
                    const { id_binary } = await crypto2.sbCrypto.generateIdKey(result);
                    const id32 = arrayBuffer32ToBase62(id_binary);
                    let alreadyThere = this.globalBufferMap.get(id32);
                    if (alreadyThere) {
                      if (DEBUG23)
                        console.log(`... duplicate file found for ${key}`);
                      result = alreadyThere;
                    } else {
                      this.globalBufferMap.set(id32, result);
                    }
                    if (value.size === void 0) {
                      if (DEBUG23)
                        console.log(`... setting size for ${key} to ${result.byteLength}`);
                      value.size = result.byteLength;
                    } else if (value.size !== result.byteLength) {
                      if (DEBUG3)
                        console.log(`WARNING: file ${value.name} has size ${value.size} but contents are ${result.byteLength} bytes (ignoring)`);
                      resolve();
                    }
                    value.uniqueShardId = id32;
                    if (DEBUG23)
                      console.log(`... found contents for ${key} (${result.byteLength} bytes)`);
                  }
                  resolve();
                }).catch((error) => {
                  if (DEBUG23)
                    console.log(`couldn't read anything for ${key}`, error);
                  resolve();
                });
              })
            );
          } else {
            if (DEBUG3)
              console.log(`skipping ${value.name} (item ${key})`);
          }
        });
        if (DEBUG3)
          console.log("... kicked off all file promises");
        await Promise.all(listOfFilePromises).then((_results) => {
          console.log("-------DONE building globalBufferMap ---------");
          console.log(this.globalBufferMap);
        });
        this.#currentFileList.forEach((value) => {
          if (value.name) {
            let path = "/";
            if (value.SBfullName) {
              path = ("/" + value.SBfullName).substring(0, value.fullPath.lastIndexOf("/") + 1);
            } else if (value.webkitRelativePath) {
              path = ("/" + value.webkitRelativePath).substring(0, value.webkitRelativePath.lastIndexOf("/") + 1);
            } else if (value.fullPath) {
              path = value.fullPath.substring(0, value.fullPath.lastIndexOf("/") + 1);
            } else if (nameToFullPath.has(value.name)) {
              path = nameToFullPath.get(value.name).substring(0, nameToFullPath.get(value.name).lastIndexOf("/") + 1);
            } else {
              if (DEBUG23) {
                console.log(`... no (further) path info for '${value.name}'`);
                console.log(value);
              }
            }
            path = path.endsWith("/") ? path : path.concat("/");
            if (DEBUG23)
              console.log(`... path for '${value.name}' is '${path}'`);
            if (value.isDirectory === true) {
              value.type = "directory";
              value.size = 0;
            }
            let finalFullName = path + value.name;
            let metaDataString = "";
            let lastModifiedString = "";
            if (value.lastModified) {
              lastModifiedString = new Date(value.lastModified).toLocaleString();
              metaDataString += ` [${lastModifiedString}]`;
            }
            if (value.size) {
              metaDataString += ` [${value.size} bytes]`;
            }
            if (value.uniqueShardId) {
              metaDataString += ` [${value.uniqueShardId.substr(0, 12)}]`;
            }
            finalFullName += metaDataString;
            let row = {
              name: value.name,
              size: value.size,
              type: value.type,
              lastModified: lastModifiedString,
              hash: value.uniqueShardId?.substr(0, 12),
              // these are extra / hidden:
              path,
              uniqueShardId: value.uniqueShardId,
              fullName: finalFullName,
              metaDataString,
              SBfullName: value.SBfullName
            };
            let currentRow = this.finalFileList.get(finalFullName);
            if (!currentRow)
              this.finalFileList.set(finalFullName, row);
            else {
              if (DEBUG3)
                console.log(`... overriding some values for ${finalFullName} (this is rare)`);
              if (currentRow.size === void 0)
                currentRow.size = row.size;
              if (currentRow.type === void 0)
                currentRow.type = row.type;
              if (currentRow.lastModified === void 0)
                currentRow.lastModified = row.lastModified;
              if (currentRow.uniqueShardId === void 0)
                currentRow.uniqueShardId = row.uniqueShardId;
            }
            if (DEBUG23) {
              console.log(`File ${value.name} has info`);
              console.log(row);
            }
          }
        });
        console.log("-------DONE building finalFileList ---------");
        console.log(this.finalFileList);
        if (SKIP_DIR) {
          let reverseBufferMap = new Map(
            Array.from(this.globalBufferMap.keys()).map((key) => [key, /* @__PURE__ */ new Map()])
          );
          for (const key of this.finalFileList.keys()) {
            let entry = this.finalFileList.get(key);
            if (entry.type === "directory" || entry.uniqueShardId === void 0) {
              if (DEBUG23)
                console.log(`... removing ${key} from final list (directory)`);
              this.finalFileList.delete(key);
            } else {
              const uniqueShortName = entry.name + entry.metaDataString;
              if (entry.path !== "/") {
                const mapEntry = reverseBufferMap.get(entry.uniqueShardId).get(uniqueShortName);
                if (mapEntry) {
                  if (mapEntry.path.length > entry.path.length) {
                    this.finalFileList.delete(key);
                  } else {
                    this.finalFileList.delete(mapEntry.fullName);
                    reverseBufferMap.get(entry.uniqueShardId).set(uniqueShortName, entry);
                  }
                } else {
                  reverseBufferMap.get(entry.uniqueShardId).set(uniqueShortName, entry);
                }
              }
            }
          }
          if (DEBUG3)
            console.log(reverseBufferMap);
          for (const key of this.finalFileList.keys()) {
            let entry = this.finalFileList.get(key);
            const uniqueShortName = entry.name + entry.metaDataString;
            if (entry.path === "/") {
              const mapEntry = reverseBufferMap.get(entry.uniqueShardId).get(uniqueShortName);
              if (mapEntry) {
                if (DEBUG23)
                  console.log(`... removing ${key} from final list (duplicate short name)`);
                this.finalFileList.delete(key);
              } else {
                if (DEBUG23)
                  console.log(`... leaving ${key} in final list (unique short name)`);
              }
            }
          }
        }
        for (const key of this.finalFileList.keys()) {
          let entry = this.finalFileList.get(key);
          if (entry.type === void 0) {
            if (DEBUG23)
              console.log(`... trying to figure out mime type for ${key}`);
            let mimeType = await getMimeType(entry.uniqueShardId);
            if (mimeType) {
              entry.type = mimeType;
            } else {
              entry.type = "";
            }
          }
        }
        let tableContents = Array.from(this.finalFileList.values()).sort(
          (a, b) => a.path.localeCompare(b.path) || a.name.localeCompare(b.name)
        );
        if (DEBUG3) {
          console.log("Table contents:");
          console.log(tableContents);
        }
        console.log("-------DONE with all file promises (clearing state) ---------");
        this.#globalItemNumber = createCounter();
        this.#globalFileItemNumber = createCounter();
        this.#globalFileMap = /* @__PURE__ */ new Map();
        this.#currentFileList = /* @__PURE__ */ new Map();
        if (callback) {
          callback(tableContents);
        } else {
          console.info("Note: no callback, so no update on tableContents:");
          console.log(tableContents);
        }
      })();
    }, 50);
  }
  //#region UI HOOKS ****************************************************************************************************
  //
  // Here's roughly how you would hook up from an HTML page to this code.
  // It will handle clicks and drops, both "file" and "directory" zones.
  //
  // "handleEvent()" handles all such events. It will call
  // scanItemList() and scanFileList() on all the data, then
  // the above "afteOperation()"
  // const fileDropZone = document.getElementById('fileDropZone');
  // const directoryDropZone = document.getElementById('directoryDropZone');
  // SBFileHelperReady.then(() => {
  //     fileDropZone.addEventListener('drop', SBFileHelper.handleFileDrop);
  //     directoryDropZone.addEventListener('drop', SBFileHelper.handleDirectoryDrop);
  //     fileDropZone.addEventListener('click', SBFileHelper.handleFileClick);
  //     directoryDropZone.addEventListener('click', SBFileHelper.handleDirectoryClick);
  // }
  handleFileDrop(event, callback) {
    event.preventDefault();
    return this.handleEvent(event, callback, "[file drop]");
  }
  handleDirectoryDrop(event, callback) {
    event.preventDefault();
    return this.handleEvent(event, callback, "[directory drop]");
  }
  handleFileClick(event, callback) {
    event.preventDefault();
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.multiple = true;
    fileInput.accept = "*/*";
    fileInput.addEventListener("change", (event2) => {
      this.handleEvent(event2, callback, "[file click]");
    });
    fileInput.click();
  }
  handleDirectoryClick(event, callback) {
    event.preventDefault();
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.multiple = true;
    fileInput.webkitdirectory = true;
    fileInput.accept = "*/*";
    fileInput.addEventListener("change", (event2) => {
      this.handleEvent(event2, callback, "[directory click]");
    });
    fileInput.click();
  }
  // this gets both input type=file and drag and drop
  async handleEvent(event, callback, _context) {
    let files, items;
    if (event.dataTransfer) {
      files = event.dataTransfer.files;
      items = event.dataTransfer.items;
    } else if (event.target) {
      if (event.target.files)
        files = event.target.files;
      if (event.target.items)
        items = event.target.items;
    } else {
      console.log("Unknown event type (should not happen):");
      console.log(event);
      return;
    }
    if (DEBUG32) {
      console.log("Received items (DataTransferItemList):");
      console.log(items);
      console.log("Received files:");
      console.log(files);
    }
    this.scanItemList(items);
    this.scanFileList(files);
    this.afterOperation(callback);
  }
};

// src/browser/images.ts
function readJpegHeader(bytes) {
  console.log("==== loaded SBImageHelper lib version 0.0.10 ====");
  let position = 0;
  if (bytes[position++] != 255)
    return;
  if (bytes[position++] != 216)
    return;
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  while (position + 4 < bytes.byteLength) {
    if (bytes[position++] != 255)
      continue;
    const type = bytes[position++];
    if (bytes[position] == 255)
      continue;
    const length = dv.getUint16(position, false);
    if (position + length > bytes.byteLength)
      return null;
    if (length >= 7 && (type == 192 || type == 194)) {
      const data = {
        progressive: type == 194,
        bitDepth: bytes[position + 2],
        height: dv.getUint16(position + 3, false),
        width: dv.getUint16(position + 5, false),
        components: bytes[position + 7]
      };
      return data;
    }
    position += length;
  }
  return null;
}

// src/browser/fileTable.ts
var FileTable = class {
  SBFileHelper;
  tableRows = /* @__PURE__ */ new Map();
  table;
  // = document.querySelector('#myTable tbody');
  // container: Element; // = document.querySelector(`#${location}`);
  expandAll;
  // = document.getElementById("expandAll")
  collapseAll;
  // = document.getElementById("collapseAll")
  uploadNewSetButton;
  // = document.getElementById("uploadNewSetButton")
  tableFileInfo;
  // = document.getElementById("table-file-info");
  hasChanges = false;
  knownShards;
  // = new Map();
  rowClicked = null;
  previewFile;
  findFileDetails;
  constructor(SBFileHelper, table, expandAll, collapseAll, uploadNewSetButton, tableFileInfo, knownShards, rowClicked, previewFile, findFileDetails) {
    if (!SBFileHelper)
      throw new Error("SBFileHelper is null");
    this.SBFileHelper = SBFileHelper;
    if (!previewFile)
      throw new Error("previewFile is null");
    this.previewFile = previewFile;
    if (!findFileDetails)
      throw new Error("findFileDetails is null");
    this.findFileDetails = findFileDetails;
    if (!tableFileInfo)
      throw new Error("tableFileInfo is null");
    this.tableFileInfo = tableFileInfo;
    if (!uploadNewSetButton)
      throw new Error("uploadNewSetButton is null");
    this.uploadNewSetButton = uploadNewSetButton;
    if (!knownShards)
      throw new Error("knownShards is null");
    this.knownShards = knownShards;
    if (rowClicked)
      this.rowClicked = rowClicked;
    if (!table)
      throw new Error("table is null");
    if (!expandAll)
      throw new Error("expandAll is null");
    if (!collapseAll)
      throw new Error("collapseAll is null");
    this.table = table;
    this.expandAll = expandAll;
    this.collapseAll = collapseAll;
  }
  addRow(lexicalOrder, rowContents, metaData) {
    this.tableRows.set(lexicalOrder, { rowContents, metaData });
    this.tableRows = new Map([...this.tableRows.entries()].sort());
    for (let [_key, value] of this.tableRows) {
      let row = document.createElement("tr");
      let cell = document.createElement("td");
      cell.textContent = value.rowContents;
      if (this.rowClicked) {
        cell.addEventListener("click", () => {
          this.expandAll.style.display = "flex";
          this.collapseAll.style.display = "flex";
          this.rowClicked(value.metaData);
        });
      }
      row.appendChild(cell);
      this.table.appendChild(row);
    }
  }
  // note: 'editable' also doubles as 'omit' when null
  // first column is pretty much hard coded to expect a path
  renderTable(data, headings, editable, location, onSave, actionButtons = true) {
    let originalData = JSON.parse(JSON.stringify(data));
    let numberColumns = headings.length;
    if (numberColumns !== editable.length) {
      console.error("Number of headings and editable columns must match");
      return;
    }
    let slatedForDeletion = [];
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const headingRow = document.createElement("tr");
    const saveBtn = document.createElement("button");
    const cancelBtn = document.createElement("button");
    const container = document.querySelector(`#${location}`);
    i = 0;
    let propertyNames = [];
    headings.forEach((heading) => {
      if (editable[i++] !== null) {
        const headingCell = document.createElement("th");
        headingCell.textContent = heading.label;
        propertyNames.push(heading.key);
        headingRow.appendChild(headingCell);
      }
    });
    thead.appendChild(headingRow);
    table.appendChild(thead);
    const tbody = document.createElement("tbody");
    let lastPath = "";
    data.forEach((row, index) => {
      const PATH_INDENT = 12;
      const depthPad = PATH_INDENT * (2 / 3) + ((row?.path?.match(/\//g) || []).length - 1) * PATH_INDENT;
      if (row.path !== lastPath) {
        lastPath = row.path;
        const tableRow2 = document.createElement("tr");
        const tableData = document.createElement("td");
        tableData.colSpan = numberColumns;
        tableData.textContent = row.path;
        tableData.style.paddingLeft = depthPad + "px";
        tableRow2.appendChild(tableData);
        tableRow2.classList.add("folder");
        tableRow2.dataset.name = row.path;
        tbody.appendChild(tableRow2);
      }
      const tableRow = document.createElement("tr");
      tableRow.classList.add("file");
      tableRow.dataset.filePath = row.path;
      if (numberColumns > Object.keys(row).length) {
        console.error("Not enough columns in table for row: ", index);
        return;
      }
      Object.keys(row).forEach((key, index2) => {
        if (!propertyNames.includes(key))
          return;
        if (editable[index2] !== null) {
          const tableData = document.createElement("td");
          if (index2 == 0) {
            tableData.style.paddingLeft = depthPad + PATH_INDENT + "px";
          }
          if (editable[index2]) {
            const input = document.createElement("input");
            input.type = "text";
            input.value = row[key];
            input.addEventListener("input", () => {
              row[key] = input.value;
            });
            tableData.appendChild(input);
          } else {
            if (editable[index2] !== null)
              if (key === "type" && row[key] !== "") {
                tableData.dataset.hash = row.uniqueShardId;
                tableData.dataset.type = row.type;
                tableData.dataset.path = row.path;
                tableData.dataset.name = row.name;
                tableData.innerHTML += row[key].slice(0, 20) + " <span class='preview-file-icon'>\u{1F50D}\u{1F440}</span>";
              } else {
                tableData.textContent = row[key];
              }
          }
          tableRow.appendChild(tableData);
        }
      });
      if (actionButtons) {
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Remove";
        deleteButton.addEventListener("click", () => {
          this.uploadNewSetButton.setAttribute("disabled", "true");
          tableRow.classList.add("slated-for-deletion");
          this.hasChanges = true;
          saveBtn.removeAttribute("disabled");
          cancelBtn.removeAttribute("disabled");
          deleteButton.setAttribute("disabled", "true");
          console.log("slated for deletion: ", index);
          slatedForDeletion.push(row.uniqueShardId);
        });
        const actionData = document.createElement("td");
        actionData.appendChild(deleteButton);
        tableRow.appendChild(actionData);
        if (tableRow.classList.contains("slated-for-deletion")) {
          tableRow.classList.remove("slated-for-deletion");
        }
      }
      tbody.appendChild(tableRow);
    });
    table.appendChild(tbody);
    if (actionButtons) {
      saveBtn.setAttribute("id", "saveBtn");
      saveBtn.textContent = "Save";
      saveBtn.addEventListener("click", () => {
        this.uploadNewSetButton.removeAttribute("disabled");
        console.log("hit save button. original:");
        console.log(originalData);
        data.forEach((item, index) => {
          if (slatedForDeletion.includes(item.uniqueShardId)) {
            console.log(this.SBFileHelper);
            console.log(this.SBFileHelper.finalFileList);
            console.log(data[index]);
            this.SBFileHelper.finalFileList.delete(data[index].fullName);
            this.SBFileHelper.globalBufferMap.delete(data[index].uniqueShardId);
            console.log("deleting: ", index);
            console.log(data[index]);
            delete data[index];
          }
        });
        console.log("new:");
        console.log(data);
        this.hasChanges = false;
        saveBtn.setAttribute("disabled", "true");
        cancelBtn.setAttribute("disabled", "true");
        this.renderTable(data, headings, editable, location, onSave);
      });
      table.appendChild(saveBtn);
      cancelBtn.setAttribute("id", "cancelBtn");
      cancelBtn.textContent = "Cancel";
      cancelBtn.addEventListener("click", () => {
        this.uploadNewSetButton.removeAttribute("disabled");
        this.hasChanges = false;
        saveBtn.setAttribute("disabled", "true");
        cancelBtn.setAttribute("disabled", "true");
        console.log("hit cancel button. original:", data);
        this.renderTable(originalData, headings, editable, location, onSave);
      });
      if (this.hasChanges) {
        saveBtn.removeAttribute("disabled");
        cancelBtn.removeAttribute("disabled");
      } else {
        saveBtn.setAttribute("disabled", "true");
        cancelBtn.setAttribute("disabled", "true");
      }
      table.appendChild(cancelBtn);
    }
    container.innerHTML = "";
    container.appendChild(table);
    function toggleChildren(path) {
      var children = document.querySelectorAll('tr[data-file-path="' + path + '"]');
      for (var j = 0; j < children.length; j++) {
        children[j].style.display = children[j].style.display == "none" ? "" : "none";
      }
    }
    var nameCells = document.querySelectorAll("tr.folder");
    for (var i = 0; i < nameCells.length; i++) {
      nameCells[i].addEventListener("click", function() {
        if (this.dataset.name) {
          toggleChildren(this.dataset.name);
        } else {
          console.error("this.dataset.name is null");
        }
      });
    }
    document.querySelectorAll(".preview-file-icon").forEach((element) => {
      element.addEventListener("click", (event) => {
        if (!(event.target instanceof HTMLElement))
          throw new Error("event.target is not an HTMLElement");
        const path = event.target.parentElement?.dataset.path;
        const name = event.target.parentElement?.dataset.name;
        const type = event.target.parentElement?.dataset.type;
        const hash = event.target.parentElement?.dataset.hash;
        const file2 = this.findFileDetails(hash);
        console.log("file", file2);
        if (!file2)
          throw new Error("file not found in fileSetMap (?) ... new issue");
        if (this.tableFileInfo) {
          this.tableFileInfo.innerHTML = "";
          const theader = document.createElement("thead");
          const tbody2 = document.createElement("tbody");
          const shard = (
            /* web384.DataRoom. */
            this.knownShards.get(hash)
          );
          const details = {
            name: file2.name,
            size: file2.size,
            type: file2.type,
            lastModified: file2.lastModified,
            SBDetails: null
          };
          if (shard) {
            details.SBDetails = `${shard.id}.${shard.verification}`;
          }
          for (const [key, value] of Object.entries(details)) {
            const tr = document.createElement("tr");
            const th = document.createElement("th");
            th.textContent = key;
            const td = document.createElement("td");
            td.textContent = value;
            tr.appendChild(th);
            tr.appendChild(td);
            tbody2.appendChild(tr);
          }
          this.tableFileInfo.appendChild(theader);
          this.tableFileInfo.appendChild(tbody2);
          this.previewFile(path + name, hash, type);
        }
      });
    });
  }
};

// src/browser/index.ts
var browser = {
  files: FileHelper,
  fileTable: FileTable,
  serviceWorker: SBServiceWorker,
  images: {
    readJpegHeader
  }
};

// src/channel/messageTypes.ts
var MessageType = /* @__PURE__ */ ((MessageType2) => {
  MessageType2["MSG_SIMPLE_CHAT"] = "9WbWE53HnRy6";
  MessageType2["MSG_FILE_SET"] = "FEm4a3EW0cn1";
  MessageType2["MSG_NEW_SHARD"] = "eUp2cR96dH3E";
  MessageType2["MSG_USER_PRIVATE_DATA"] = "R0FR1LWRRddE";
  MessageType2["MSG_NEW_USER_KEY"] = "20m0r6rFedac";
  MessageType2["MSG_CLAIM_PUBLIC_KEY"] = "8pc2FamHdrhW";
  MessageType2["MSG_CONTACT_ANNOUNCEMENT"] = "mEe6d97kEbhR";
  MessageType2["MSG_REQUEST_MAIN"] = "1pE8de4bEWRE";
  MessageType2["MSG_PROVIDE_MAIN"] = "Ea66FnFE9f5F";
  return MessageType2;
})(MessageType || {});
var MessageTypeList = [
  "9WbWE53HnRy6" /* MSG_SIMPLE_CHAT */,
  "FEm4a3EW0cn1" /* MSG_FILE_SET */,
  "eUp2cR96dH3E" /* MSG_NEW_SHARD */,
  "20m0r6rFedac" /* MSG_NEW_USER_KEY */,
  "R0FR1LWRRddE" /* MSG_USER_PRIVATE_DATA */,
  "8pc2FamHdrhW" /* MSG_CLAIM_PUBLIC_KEY */,
  "1pE8de4bEWRE" /* MSG_REQUEST_MAIN */,
  "Ea66FnFE9f5F" /* MSG_PROVIDE_MAIN */,
  "mEe6d97kEbhR" /* MSG_CONTACT_ANNOUNCEMENT */
];

// src/channel/index.ts
var channel = {
  types: MessageType,
  typeList: MessageTypeList
};

// src/snackabra/index.ts
var NewSB = {
  Channel,
  SBMessage,
  Snackabra,
  SBCrypto,
  SB384,
  version,
  ChannelEndpoint,
  ChannelSocket,
  arrayBufferToBase64: arrayBufferToBase642,
  compareBuffers
};

// src/index.ts
var version3 = "2.0.0-alpha.1";
export {
  NewSB,
  Snackabra,
  boot,
  bootstrapLoaderClass,
  browser,
  channel,
  crypto2 as crypto,
  file,
  strongphrase,
  utils,
  version3 as version
};
//# sourceMappingURL=384.esm.js.map
