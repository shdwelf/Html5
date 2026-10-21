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
