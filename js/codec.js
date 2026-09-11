// Zero-dependency codecs for the wallet stack: hex, Base58(/Check),
// Bech32/Bech32m (BIP-173/350), EIP-55, Stellar strkey, base32.
// Every encoder is exercised in tests/11 (known-answer + round-trip).

import { sha256, hash256, keccak256 } from "./hash.js";

const HEX = "0123456789abcdef";

export function toHex(b) {
  let s = "";
  for (const x of b) s += HEX[x >> 4] + HEX[x & 15];
  return s;
}

export function fromHex(s) {
  if (s.length % 2 !== 0) throw new Error("odd hex length");
  const out = new Uint8Array(s.length / 2);
  for (let i = 0; i < out.length; i++)
    out[i] = parseInt(s.slice(2 * i, 2 * i + 2), 16);
  return out;
}

export function utf8(s) {
  return new TextEncoder().encode(s);
}

// ------------------------------------------------------------------ Base58

export const B58_BTC = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
export const B58_XRP = "rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz";

export function base58Encode(buf, alphabet = B58_BTC) {
  let zeros = 0;
  while (zeros < buf.length && buf[zeros] === 0) zeros++;
  let num = 0n;
  for (const b of buf) num = num * 256n + BigInt(b);
  let out = "";
  while (num > 0n) {
    const r = Number(num % 58n);
    num = num / 58n;
    out = alphabet[r] + out;
  }
  return alphabet[0].repeat(zeros) + out;
}

export function base58Decode(s, alphabet = B58_BTC) {
  const idx = new Map([...alphabet].map((c, i) => [c, i]));
  let zeros = 0;
  while (zeros < s.length && s[zeros] === alphabet[0]) zeros++;
  let num = 0n;
  for (const c of s) {
    if (!idx.has(c)) throw new Error("bad base58 char");
    num = num * 58n + BigInt(idx.get(c));
  }
  const bytes = [];
  while (num > 0n) {
    bytes.unshift(Number(num % 256n));
    num = num / 256n;
  }
  const out = new Uint8Array(zeros + bytes.length);
  out.set(bytes, zeros);
  return out;
}

/** versionBytes: number[] prefix, e.g. [0x00] for BTC P2PKH, [0x1c, 0xb8] for ZEC t1. */
export function base58CheckEncode(payload, versionBytes, alphabet = B58_BTC) {
  const v = new Uint8Array(versionBytes.length + payload.length + 4);
  v.set(versionBytes, 0);
  v.set(payload, versionBytes.length);
  v.set(hash256(v.subarray(0, versionBytes.length + payload.length)).subarray(0, 4),
    versionBytes.length + payload.length);
  return base58Encode(v, alphabet);
}

export function base58CheckDecode(s, alphabet = B58_BTC) {
  const v = base58Decode(s, alphabet);
  if (v.length < 5) throw new Error("base58check too short");
  const body = v.subarray(0, v.length - 4);
  const check = hash256(body).subarray(0, 4);
  for (let i = 0; i < 4; i++)
    if (check[i] !== v[v.length - 4 + i]) throw new Error("base58check mismatch");
  return body;
}

// ---------------------------------------------------------- Bech32(m)

const BECH_ALPHABET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";

function bechPolymod(values) {
  const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  let chk = 1;
  for (const v of values) {
    const b = chk >> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ v;
    for (let i = 0; i < 5; i++)
      if ((b >> i) & 1) chk ^= GEN[i];
  }
  return chk >>> 0;
}

function bechHrpExpand(hrp) {
  const out = [];
  for (const c of hrp) out.push(c.charCodeAt(0) >> 5);
  out.push(0);
  for (const c of hrp) out.push(c.charCodeAt(0) & 31);
  return out;
}

function bechVerifyChecksum(hrp, data) {
  const pm = bechPolymod([...bechHrpExpand(hrp), ...data]);
  if (pm === 1) return "bech32";
  if (pm === 0x2bc830a3) return "bech32m";
  return null;
}

function bechCreateChecksum(hrp, data, spec) {
  const pm = bechPolymod([...bechHrpExpand(hrp), ...data, 0, 0, 0, 0, 0, 0]) ^
    (spec === "bech32m" ? 0x2bc830a3 : 1);
  const out = [];
  for (let i = 0; i < 6; i++) out.push((pm >> (5 * (5 - i))) & 31);
  return out;
}

export function convertBits(data, fromBits, toBits, pad) {
  let acc = 0, bits = 0;
  const out = [];
  const maxv = (1 << toBits) - 1;
  for (const value of data) {
    if (value < 0 || (value >> fromBits) !== 0) throw new Error("convertBits value out of range");
    acc = (acc << fromBits) | value;
    bits += fromBits;
    while (bits >= toBits) {
      bits -= toBits;
      out.push((acc >> bits) & maxv);
    }
  }
  if (pad) {
    if (bits > 0) out.push((acc << (toBits - bits)) & maxv);
  } else if (bits >= fromBits || ((acc << (toBits - bits)) & maxv)) {
    throw new Error("convertBits invalid padding");
  }
  return out;
}

export function bech32Encode(hrp, data5, spec = "bech32") {
  const combined = [...data5, ...bechCreateChecksum(hrp, data5, spec)];
  return hrp + "1" + combined.map((v) => BECH_ALPHABET[v]).join("");
}

export function bech32Decode(s) {
  if (s.length < 8 || s.length > 90) throw new Error("bech32 bad length");
  if (s !== s.toLowerCase() && s !== s.toUpperCase()) throw new Error("bech32 mixed case");
  const lower = s.toLowerCase();
  const pos = lower.lastIndexOf("1");
  if (pos < 1 || pos + 7 > lower.length) throw new Error("bech32 bad separator");
  const hrp = lower.slice(0, pos);
  const data = [];
  for (const c of lower.slice(pos + 1)) {
    const v = BECH_ALPHABET.indexOf(c);
    if (v === -1) throw new Error("bech32 bad char");
    data.push(v);
  }
  const spec = bechVerifyChecksum(hrp, data);
  if (!spec) throw new Error("bech32 bad checksum");
  return { hrp, data: data.slice(0, -6), spec };
}

/** SegWit address: hrp + version + program bytes (BIP-173/350 rules). */
export function segwitEncode(hrp, version, program) {
  if (version < 0 || version > 16) throw new Error("bad witness version");
  if (program.length < 2 || program.length > 40) throw new Error("bad program length");
  if (version === 0 && program.length !== 20 && program.length !== 32)
    throw new Error("v0 program must be 20 or 32 bytes");
  const spec = version === 0 ? "bech32" : "bech32m";
  return bech32Encode(hrp, [version, ...convertBits(program, 8, 5, true)], spec);
}

export function segwitDecode(addr) {
  const { hrp, data, spec } = bech32Decode(addr);
  if (data.length < 1) throw new Error("segwit empty");
  const version = data[0];
  const program = convertBits(data.slice(1), 5, 8, false);
  if (version === 0 && spec !== "bech32") throw new Error("v0 must be bech32");
  if (version !== 0 && spec !== "bech32m") throw new Error("v1+ must be bech32m");
  return { hrp, version, program: new Uint8Array(program) };
}

// ------------------------------------------------------------------ EIP-55

export function eip55(hexAddr) {
  const lower = hexAddr.toLowerCase().replace(/^0x/, "");
  if (!/^[0-9a-f]{40}$/.test(lower)) throw new Error("bad eth address hex");
  const hash = toHex(keccak256(utf8(lower)));
  let out = "0x";
  for (let i = 0; i < 40; i++)
    out += parseInt(hash[i], 16) >= 8 ? lower[i].toUpperCase() : lower[i];
  return out;
}

// ------------------------------------------------------------ Stellar/base32

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(buf) {
  const bits = convertBits(buf, 8, 5, true);
  return bits.map((v) => B32[v]).join("");
}

export function base32Decode(s) {
  const idx = new Map([...B32].map((c, i) => [c, i]));
  const upper = s.toUpperCase().replace(/=+$/, "");
  const data5 = [];
  for (const c of upper) {
    if (!idx.has(c)) throw new Error("bad base32 char");
    data5.push(idx.get(c));
  }
  return new Uint8Array(convertBits(data5, 5, 8, false));
}

export function crc16Xmodem(buf) {
  let crc = 0x0000;
  for (const b of buf) {
    crc ^= b << 8;
    for (let i = 0; i < 8; i++)
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc;
}

/** Stellar strkey: version byte + payload + CRC16-XModem, base32, 'G...' for ed25519 pubkeys. */
export function stellarEncode(versionByte, payload) {
  const raw = new Uint8Array(1 + payload.length + 2);
  raw[0] = versionByte;
  raw.set(payload, 1);
  const crc = crc16Xmodem(raw.subarray(0, 1 + payload.length));
  raw[1 + payload.length] = crc & 0xff;
  raw[1 + payload.length + 1] = (crc >> 8) & 0xff;
  return base32Encode(raw);
}

/** Inverse of stellarEncode: returns {version, payload}, throws on CRC mismatch. */
export function stellarDecode(s) {
  const raw = base32Decode(s);
  if (raw.length < 4) throw new Error("strkey too short");
  const body = raw.subarray(0, raw.length - 2);
  const crc = raw[raw.length - 2] | (raw[raw.length - 1] << 8);
  if (crc16Xmodem(body) !== crc) throw new Error("strkey bad checksum");
  return { version: body[0], payload: body.subarray(1) };
}
