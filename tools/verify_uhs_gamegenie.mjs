/**
 * verify_uhs_gamegenie.mjs — reference implementations + known-answer vectors
 * for the Universal Hint System encodings and the NES Game Genie code cipher.
 *
 * House pattern (see js/lecture-ciphers.js and docs/GHIDRA_COOKBOOK.md): every
 * computable recipe claim is reproduced by an independent implementation and
 * checked against published or upstream-generated vectors — not asserted from
 * a web page.
 *
 * Provenance:
 *   1. UHS decode variants — ported from Tormen/my-uhs `my-uhs.py`
 *      (master @ 84ba2c907c26ebc1e2e4d80be58905cc9de1f774), the decryption
 *      section, matching its Latin-1 byte==char math and ±96 wrap. The 88a
 *      vector is the published pair from Stefan Wolff's UHS2HTML primer
 *      (https://www.swolff.dk/uhs/); the nest/text-hunk vectors were generated
 *      by running the upstream functions themselves and are re-derived here.
 *   2. NES Game Genie — ported from satoshinm/nes-game-genie `gg.js`
 *      (master @ 7eedc28b52db222710593e16d21acbca441aa16a, npm
 *      `nes-game-genie` 2.0.0), validated against that package's README
 *      vectors (SLXPLOVS / SXIOPO / encodeGG(0x1123, 0xbd, 0xde)).
 *
 * Educational/historical use only. UHS obfuscation exists to hide spoilers
 * until asked; Game Genie codes are ROM-patch notation. Neither encrypts
 * anything with consequences. No dependencies, no DOM, no network.
 */

/* ---------------------------------------------------------------- UHS key */

const KEY_SEED = [0x6b, 0x65, 0x79]; // "key"

/** my-uhs generate_key: per-title key array for the nest/text-hunk variants. */
export function generateKey(title) {
  const out = [];
  for (let i = 0; i < title.length; i++) {
    let v = title.charCodeAt(i) + (KEY_SEED[i % 3] ^ (i + 40));
    while (v > 127) v -= 96;
    out.push(v);
  }
  return out;
}

/* ------------------------------------------------------------- UHS decode */

/** 88a content and standalone hint hunks (no key): c*2-32 / c*2-127 split at 80. */
export function decrypt88a(s) {
  let buf = "";
  for (const ch of s) {
    let c = ch.charCodeAt(0);
    if (c < 32) continue;
    c = c < 80 ? c * 2 - 32 : c * 2 - 127;
    buf += String.fromCharCode(c);
  }
  return buf;
}

/** Inverse of decrypt88a (authoring/round-trip): even plains take the -32 arm. */
export function encrypt88a(s) {
  let buf = "";
  for (const ch of s) {
    const p = ch.charCodeAt(0);
    buf += String.fromCharCode(p % 2 === 0 ? (p + 32) / 2 : (p + 127) / 2);
  }
  return buf;
}

/** Nest-keyed (nesthint/incentive) variant: subtract key[i%klen]^(i+40), wrap +96. */
export function decryptNest(s, key) {
  const klen = key.length;
  let buf = "";
  for (let i = 0; i < s.length; i++) {
    let c = s.charCodeAt(i) - (key[i % klen] ^ (i + 40));
    while (c < 32) c += 96;
    buf += String.fromCharCode(c);
  }
  return buf;
}

export function encryptNest(s, key) {
  const klen = key.length;
  let buf = "";
  for (let i = 0; i < s.length; i++) {
    let c = s.charCodeAt(i) + (key[i % klen] ^ (i + 40));
    while (c > 127) c -= 96;
    buf += String.fromCharCode(c);
  }
  return buf;
}

/** Text-hunk variant: key indexed by co=i%klen in BOTH the key and the XOR offset. */
export function decryptTextHunk(s, key) {
  const klen = key.length;
  let buf = "";
  for (let i = 0; i < s.length; i++) {
    const co = i % klen;
    let c = s.charCodeAt(i) - (key[co] ^ (co + 40));
    while (c < 32) c += 96;
    buf += String.fromCharCode(c);
  }
  return buf;
}

export function encryptTextHunk(s, key) {
  const klen = key.length;
  let buf = "";
  for (let i = 0; i < s.length; i++) {
    const co = i % klen;
    let c = s.charCodeAt(i) + (key[co] ^ (co + 40));
    while (c > 127) c -= 96;
    buf += String.fromCharCode(c);
  }
  return buf;
}

/* ------------------------------------------------------- NES Game Genie */

const GG_LETTERS = "APZLGITYEOXUKSVN";

/** Decode a 6- or 8-letter NES Game Genie code to address/value/[compare]. */
export function decodeGG(code) {
  const d = code.toUpperCase().split("").map((c) => GG_LETTERS.indexOf(c));
  if (d.some((x) => x < 0)) throw new Error(`not a Game Genie code: ${code}`);
  let value = ((d[0] & 8) << 4) + ((d[1] & 7) << 4) + (d[0] & 7);
  const address =
    ((d[3] & 7) << 12) + ((d[4] & 8) << 8) + ((d[5] & 7) << 8) +
    ((d[1] & 8) << 4) + ((d[2] & 7) << 4) + (d[3] & 8) + (d[4] & 7);
  let key;
  if (d.length === 8) {
    value += d[7] & 8;
    key = ((d[6] & 8) << 4) + ((d[7] & 7) << 4) + (d[5] & 8) + (d[6] & 7);
  } else {
    value += d[5] & 8;
  }
  const wantskey = !!(d[2] >> 3);
  return { value, address, wantskey, key };
}

/** Encode address/value/[compare] back to a Game Genie code. */
export function encodeGG(address, value, key, wantskey) {
  const d = new Array(6);
  d[0] = (value & 7) + ((value >> 4) & 8);
  d[1] = ((value >> 4) & 7) + ((address >> 4) & 8);
  d[2] = (address >> 4) & 7;
  d[3] = (address >> 12) + (address & 8);
  d[4] = (address & 7) + ((address >> 8) & 8);
  d[5] = (address >> 8) & 7;
  if (key === undefined) {
    d[5] += value & 8;
    if (wantskey) d[2] += 8;
  } else {
    d[2] += 8;
    d[5] += key & 8;
    d[6] = (key & 7) + ((key >> 4) & 8);
    d[7] = ((key >> 4) & 7) + (value & 8);
  }
  return d.map((x) => GG_LETTERS[x]).join("");
}

/* ------------------------------------------- console variants (SNES/GEN/GB) */

// Ports from gjbianco/game-genie (master @ ded70b9d79e47ba0837039f0994c7b5ddd3cda29),
// lib/snes.js, lib/genesis.js, lib/gb.js. The repository ships tests only for its
// NES module, so the vectors below were generated by executing the upstream
// encode functions and are re-derived by these ports (same treatment as the UHS
// nest/text-hunk vectors). Game Gear shares the Game Boy format ("gbgg" in
// jdratlif/ggencoder-java).

const pad4 = (s) => s.padStart(4, "0");
const bitsOf = (s, width) => s.split("").map((c) => {
  const j = parseInt(c, 16);
  return j.toString(2).padStart(width, "0");
}).join("");
const xorStr = (a, b) => a.split("").map((c, i) => (c === b[i] ? "0" : "1")).join("");
const notStr = (a) => a.split("").slice(0, 4).map((c) => (c === "1" ? "0" : "1")).join("");

const SNES_CHARS = "DF4709156BC8A23E";

/** SNES: 8 code symbols over a 16-letter alphabet (rendered XXXX-XXXX);
 *  fields are 24-bit address + 8-bit value, both hex strings. */
export function decodeSNES(code) {
  if (code.length !== 9) return false;
  const c = code.slice(0, 4).toUpperCase() + code.slice(5).toUpperCase();
  if (c.replace(new RegExp(`[${SNES_CHARS}]`, "gi"), "").length !== 0) return false;
  let bits = "";
  for (const ch of c) bits += SNES_CHARS.indexOf(ch).toString(2).padStart(4, "0");
  const nibs = [
    bits.slice(18, 22), bits.slice(26, 30), bits.slice(8, 12),
    bits.slice(30, 32) + bits.slice(16, 18),
    bits.slice(12, 16), bits.slice(22, 26), bits.slice(0, 4), bits.slice(4, 8),
  ];
  const hex = nibs.map((n) => parseInt(n, 2).toString(16).toUpperCase()).join("");
  return { address: hex.slice(0, 6), value: hex.slice(6, 8) };
}

export function encodeSNES(address, value) {
  if (address.length !== 6 || value.length !== 2) return false;
  const raw = address + value;
  if (raw.replace(/[0-9A-F]/gi, "").length !== 0) return false;
  const nibs = raw.split("").map((ch) => parseInt(ch, 16).toString(2).padStart(4, "0"));
  const temp1 = nibs[3].slice(2) + nibs[0].slice(0, 2) + nibs[0].slice(2);
  const bits = nibs[6] + nibs[7] + nibs[2] + nibs[4] + temp1 + nibs[5] + nibs[1] + nibs[3].slice(0, 2);
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += SNES_CHARS[parseInt(bits.slice(i * 4, i * 4 + 4), 2)];
    if (i === 3) code += "-";
  }
  return code;
}

const GEN_CHARS = "ABCDEFGHJKLMNPRSTVWXYZ0123456789";

/** Genesis/Megadrive: 8 symbols over a 32-letter (5-bit) alphabet (XXXX-XXXX);
 *  fields are 24-bit address + 16-bit value, hex strings. */
export function decodeGEN(code) {
  if (code.length !== 9) return false;
  const c = code.slice(0, 4).toUpperCase() + code.slice(5).toUpperCase();
  if (c.replace(new RegExp(`[${GEN_CHARS}]`, "gi"), "").length !== 0) return false;
  let bits = "";
  for (const ch of c) bits += GEN_CHARS.indexOf(ch).toString(2).padStart(5, "0");
  const nibs = [
    bits.slice(16, 20), bits.slice(20, 24), bits.slice(8, 12), bits.slice(12, 16),
    bits.slice(32, 36), bits.slice(36, 40),
    bits.slice(29, 32) + bits.slice(24, 25), bits.slice(25, 29),
    bits.slice(0, 4), bits.slice(4, 8),
  ];
  const hex = nibs.map((n) => parseInt(n, 2).toString(16).toUpperCase()).join("");
  return { address: hex.slice(0, 6), value: hex.slice(6, 10) };
}

export function encodeGEN(address, value) {
  if (address.length !== 6 || value.length !== 4) return false;
  const raw = address + value;
  if (raw.replace(/[0-9A-F]/gi, "").length !== 0) return false;
  const nibs = raw.split("").map((ch) => parseInt(ch, 16).toString(2).padStart(4, "0"));
  const temp1 = nibs[6].slice(3) + nibs[7].slice(0, 3);
  const temp2 = nibs[7].slice(3) + nibs[6].slice(0, 3);
  const bits = nibs[8] + nibs[9] + nibs[2] + nibs[3] + nibs[0] + nibs[1] + temp1 + temp2 + nibs[4] + nibs[5];
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += GEN_CHARS[parseInt(bits.slice(i * 5, i * 5 + 5), 2)];
    if (i === 3) code += "-";
  }
  return code;
}

const GB_CHARS = "0123456789ABCDEF";

/** Game Boy / Game Gear: hex symbols, XXX-XXX(-X). Address = NOT(high nibble) of
 *  the code's 5th nibble + next 3; optional compare is XOR-10111010 folded with
 *  a 1000 "shadow" nibble (the Codemasters trick). */
export function decodeGB(code) {
  if (code.length !== 7 && code.length !== 11) return false;
  const c = (code.toUpperCase().slice(0, 3) + code.slice(4, 7) +
    (code.length === 11 ? code.slice(8, 9) + code.slice(10, 11) : ""));
  if (c.replace(new RegExp(`[${GB_CHARS}]`, "gi"), "").length !== 0) return false;
  let bits = "";
  for (const ch of c) bits += parseInt(ch, 16).toString(2).padStart(4, "0");
  const nibs = [
    notStr(bits.slice(20, 24)), bits.slice(8, 12), bits.slice(12, 16),
    bits.slice(16, 20), bits.slice(0, 4), bits.slice(4, 8),
  ];
  let keyed = false;
  if (c.length === 8) {
    keyed = true;
    const cbits = xorStr(bits.slice(30, 32) + bits.slice(24, 28) + bits.slice(28, 30), "10111010");
    nibs.push(cbits.slice(0, 4), cbits.slice(4, 8));
  }
  const hex = nibs.map((n) => parseInt(n, 2).toString(16).toUpperCase()).join("");
  return {
    address: hex.slice(0, 4),
    value: hex.slice(4, 6),
    key: keyed ? hex.slice(6, 8) : false,
  };
}

export function encodeGB(address, value, key) {
  const len = key ? 9 : 6;
  if (address.length !== 4 || value.length !== 2 || (key && key.length !== 2)) return false;
  const raw = address + value + (key || "");
  if (raw.replace(/[0-9A-F]/gi, "").length !== 0) return false;
  const nibs = raw.split("").map((ch) => parseInt(ch, 16).toString(2).padStart(4, "0"));
  let bits = nibs[4] + nibs[5] + nibs[1] + nibs[2] + nibs[3] + notStr(nibs[0]);
  if (len === 9) {
    const cbits = xorStr(nibs[6] + nibs[7], "10111010");
    const folded = cbits.slice(2, 8) + cbits.slice(0, 2);
    const shadow = xorStr(folded.slice(0, 4), "1000");
    bits += folded.slice(0, 4) + shadow + folded.slice(4, 8);
  }
  let code = "";
  for (let i = 0; i < len; i++) {
    code += GB_CHARS[parseInt(bits.slice(i * 4, i * 4 + 4), 2)];
    if (i === 2 || (i === 5 && len === 9)) code += "-";
  }
  return code;
}

/* ------------------------------------------- Game Gear Game Genie (SMS Power) */
// Sega Game Gear Game Genie (Codemasters/Galoob, 1994) — NOT the Game Boy
// format above. Code = 2 or 3 groups of 3 hex digits, DDA-AAA[-RRR], parsed
// big-endian to a 36-bit value per smspower.org/Development/GameGenie:
//   DD      = patch value (plain)
//   AAAA    = Z80 address; nibbles d2 d3 d4 d5 with the LAST digit moved to
//             the front and bit-inverted:  addr = ((code>>16)&0xfff) |
//             ((code&0xf000)^0xf000)
//   RRR     = optional cloak^reference: cloak = d6^d7 (always 8 in known
//             codes), reference = ror2((d6<<4)|d8)^0xba pins the original
//             byte at the address. Encode is the exact inverse (the RRR
//             triple is uniquely determined given cloak=8).

function ror2(x) { return ((x >>> 2) | ((x & 3) << 6)) & 0xff; }
function rol2(x) { return ((x << 2) | (x >>> 6)) & 0xff; }

export function decodeGGG(code) {
  const c = code.replace(/[^0-9A-Fa-f]/g, "").toUpperCase();
  if (c.length !== 6 && c.length !== 9) return false;
  if (c.replace(/[0-9A-F]/g, "").length !== 0) return false;
  const d = c.split("").map((ch) => parseInt(ch, 16));
  const value = c.slice(0, 2);
  const address = (((~d[5]) & 0xf) << 12 | d[2] << 8 | d[3] << 4 | d[4])
    .toString(16).toUpperCase().padStart(4, "0");
  if (c.length === 6) return { value, address, cloak: null, reference: null };
  const cloak = d[6] ^ d[7];
  const reference = (ror2((d[6] << 4) | d[8]) ^ 0xba)
    .toString(16).toUpperCase().padStart(2, "0");
  return { value, address, cloak, reference };
}

export function encodeGGG(value, address, reference, cloak = 8) {
  const v = String(value).toUpperCase(), a = String(address).toUpperCase();
  const r = reference == null ? null : String(reference).toUpperCase();
  if (v.length !== 2 || a.length !== 4 || (r !== null && r.length !== 2)) return false;
  if ((v + a + (r || "")).replace(/[0-9A-F]/g, "").length !== 0) return false;
  const addr = parseInt(a, 16);
  const d5 = (~(addr >> 12)) & 0xf;
  let out = v + a[1] + a[2] + a[3] + d5.toString(16).toUpperCase();
  if (r !== null) {
    const y = rol2(parseInt(r, 16) ^ 0xba);
    const d6 = y >> 4, d8 = y & 0xf, d7 = d6 ^ (cloak & 0xf);
    out += d6.toString(16).toUpperCase() + d7.toString(16).toUpperCase() +
      d8.toString(16).toUpperCase();
    return out.slice(0, 3) + "-" + out.slice(3, 6) + "-" + out.slice(6, 9);
  }
  return out.slice(0, 3) + "-" + out.slice(3, 6);
}

/* ------------------------------------------------------------- vectors */

// 88a — published pairs from Stefan Wolff's UHS2HTML primer file listing.
export const UHS88A_VECTORS = [
  ["gHrGtGs iqrGr", "Opening Scene"],
  ["kIpHHtGs jH JDr apyr", "Wrapping Up the Case"],
  ["kDpJ Bw d Bw tG JDr wCCtqr", "What do I do in the office"],
  ["4w{ Bw d ryqpHr CIwv JDr JDzsy", "How do I escape from the thugs"],
  ["4w{ Bw d pIIryJ 3pIGDpv", "How do I arrest Farnham"],
];

// Key + nest/text-hunk pairs generated by the upstream my-uhs functions
// (title "Borrowed Time") and re-derived by this port.
export const UHS_TITLE = "Borrowed Time";
export const UHS_KEY = [37, 91, 101, 82, 88, 107, 74, 78, 105, 78, 96, 87, 100];
export const UHS_NEST_VECTORS = [
  ["\\\"T'}Tk!L\"WrU", "Opening Scene"],
  ["dzP-4Js!B?Vspy{r~iV1!Zvhz*F8UI", "What do I do in the office? 42"],
];
export const UHS_TEXT_VECTORS = [
  ["\\\"T'}Tk!L\"WrU", "Opening Scene"],
  ["dzP-4Js!B?Vspv o-|K$p_%[gUL2#K", "What do I do in the office? 42"],
];

// NES Game Genie — README vectors of satoshinm/nes-game-genie 2.0.0.
export const GG_VECTORS = [
  { code: "SLXPLOVS", value: 189, address: 4387, wantskey: true, key: 222 },
  { code: "SXIOPO", value: 173, address: 4569, wantskey: false, key: undefined },
];
export const GG_ENCODE_VECTOR = { address: 0x1123, value: 0xbd, key: 0xde, code: "SLXPLOVS" };
// Published cross-implementation vector: jdratlif/ggencoder-java README
// ("ATVATGSL into its raw component parts (60:0466?B5)").
export const GG_CROSS_VECTOR = { code: "ATVATGSL", value: 0x60, address: 0x0466, key: 0xb5 };

// Console variants — upstream-generated by gjbianco/game-genie encode functions
// (master @ ded70b9d) and re-derived by the ports above. [address, value] hex.
export const SNES_VECTORS = [
  ["1DD1-DF6F", "000466", "60"],
  ["F4A3-183E", "ABCDEF", "12"],
  ["DD79-D96B", "123456", "00"],
];
export const GEN_VECTORS = [
  ["NBDA-AADA", "004660", "0060"],
  ["AD99-8AH9", "FFFFFF", "0000"],
  ["3Y4B-E1L0", "123456", "ABCD"],
];
// [code, address, value, compare-or-null]
export const GB_VECTORS = [
  ["604-66F", "0466", "60", null],
  ["12B-CD5", "ABCD", "12", null],
  ["00F-FF0-E6A", "FFFF", "00", "00"],
  ["562-34E-7FC", "1234", "56", "A5"],
];

// Sega Game Gear Game Genie — published codes (gamegenie.com Sonic 1/2 GG
// lists, corroborated by etherealgames.com + consoledatabase.com). Fields are
// [code, address, value, reference]; cloak is 8 in every known code.
export const GGG_VECTORS = [
  ["007-01A-3BE", "5701", "00", "35"], // Sonic 1 GG: infinite lives
  ["013-7DE-E66", "137D", "01", "03"], // Sonic 1 GG: start with 1 life
  ["053-7DE-E66", "137D", "05", "03"], // …start with 5 lives (same address)
  ["093-7DE-E66", "137D", "09", "03"], // …start with 9 lives (same address)
  ["020-54A-E6E", "5054", "02", "01"], // Sonic 1 GG: rings worth 2 points
  ["3A0-21C-2A2", "3021", "3A", "32"], // Sonic 1 GG: never lose rings
  ["003-F8C-3B7", "33F8", "00", "77"], // Sonic 1 GG: stop timer
  ["009-04F-3BE", "0904", "00", "35"], // Sonic 2 GG: infinite lives
];

/* ---------------------------------------------------------------- report */

/** Check every vector; returns { ok, failures[] } and prints a GHIDRA_COOKBOOK-style report. */
export function runChecks(log = console.log) {
  const failures = [];
  const check = (name, ok, how) => {
    log(`| ${name} | ${ok ? "PASS" : "FAIL"} | ${how} |`);
    if (!ok) failures.push(name);
  };

  log("### UHS 88a (published primer pairs)");
  for (const [cipher, plain] of UHS88A_VECTORS) {
    check(`88a ${plain}`, decrypt88a(cipher) === plain && encrypt88a(plain) === cipher,
      "decrypt*2-32/-127 split at 80; inverse even/odd");
  }

  const key = generateKey(UHS_TITLE);
  check(`generateKey("${UHS_TITLE}")`, JSON.stringify(key) === JSON.stringify(UHS_KEY),
    `key=${JSON.stringify(key)}`);

  log("### UHS nest-keyed (upstream-generated, title-keyed)");
  for (const [cipher, plain] of UHS_NEST_VECTORS) {
    check(`nest ${plain}`, decryptNest(cipher, key) === plain && encryptNest(plain, key) === cipher,
      "subtract key[i%klen]^(i+40), wrap +96");
  }

  log("### UHS text-hunk (upstream-generated, co=i%klen both sides)");
  for (const [cipher, plain] of UHS_TEXT_VECTORS) {
    check(`text ${plain}`,
      decryptTextHunk(cipher, key) === plain && encryptTextHunk(plain, key) === cipher,
      "subtract key[co]^(co+40), wrap +96");
  }

  log("### NES Game Genie (npm README vectors)");
  for (const v of GG_VECTORS) {
    const got = decodeGG(v.code);
    const ok = got.value === v.value && got.address === v.address &&
      got.wantskey === v.wantskey && got.key === v.key &&
      encodeGG(v.address, v.value, v.key, v.wantskey) === v.code;
    check(`GG ${v.code}`, ok,
      `addr=${v.address} value=${v.value} key=${v.key ?? "-"} wantskey=${v.wantskey}`);
  }
  const e = GG_ENCODE_VECTOR;
  check(`GG encodeGG(${e.address}, ${e.value}, ${e.key})`,
    encodeGG(e.address, e.value, e.key) === e.code, `code=${e.code}`);
  const x = GG_CROSS_VECTOR;
  check(`GG cross ${x.code} (ggencoder-java)`,
    encodeGG(x.address, x.value, x.key) === x.code &&
      decodeGG(x.code).value === x.value && decodeGG(x.code).key === x.key,
    `raw ${x.value.toString(16)}:${x.address.toString(16)}?${x.key.toString(16)}`);

  log("### SNES Game Genie (gjbianco upstream-generated)");
  for (const [code, address, value] of SNES_VECTORS) {
    check(`SNES ${code}`,
      encodeSNES(address, value) === code &&
        decodeSNES(code).address === address && decodeSNES(code).value === value,
      `addr=${address} value=${value}`);
  }

  log("### Genesis Game Genie (gjbianco upstream-generated)");
  for (const [code, address, value] of GEN_VECTORS) {
    check(`GEN ${code}`,
      encodeGEN(address, value) === code &&
        decodeGEN(code).address === address && decodeGEN(code).value === value,
      `addr=${address} value=${value}`);
  }

  log("### Game Boy Game Genie (gjbianco upstream-generated)");
  for (const [code, address, value, key] of GB_VECTORS) {
    const got = decodeGB(code);
    check(`GB ${code}`,
      encodeGB(address, value, key ?? undefined) === code &&
        got.address === address && got.value === value &&
        (key === null ? got.key === false : got.key === key),
      `addr=${address} value=${value} compare=${key ?? "-"}`);
  }

  log("### Sega Game Gear Game Genie (published codes, SMSPower format)");
  for (const [code, address, value, reference] of GGG_VECTORS) {
    const got = decodeGGG(code);
    check(`GGG ${code}`,
      encodeGGG(value, address, reference) === code &&
        got.address === address && got.value === value &&
        got.reference === reference && got.cloak === 8,
      `addr=${address} value=${value} ref=${reference} cloak=8`);
  }

  return { ok: failures.length === 0, failures };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { ok, failures } = runChecks();
  if (!ok) {
    console.error(`FAILED: ${failures.join("; ")}`);
    process.exit(1);
  }
  console.log("all vectors PASS");
}
