import { WORDLIST } from "./bip39-en.js";

const INDEX = new Map(WORDLIST.map((w, i) => [w, i]));

/**
 * Generalised BIP-39 layout — the rule the keyspace viewer documents:
 *
 *   CS = the largest c ≤ 11 such that (11·n − c) is a whole number of bytes
 *
 * It reproduces BIP-39 exactly on the 12/15/18/21/24 ladder (where c = ENT/32)
 * and keeps a closed 11·n = ENT + CS identity for every word count from 2 to
 * 512, which is why lengths like 25 words (264 + 11) are representable here even
 * though the standard rejects them. Outside the ladder the checksum is a
 * *smaller* fraction of the entropy, so `standard` is false and the UI has to
 * say which rule produced the phrase.
 */
export const LADDER = { 12: 128, 15: 160, 18: 192, 21: 224, 24: 256 };

/** @returns {{words:number,entBits:number,csBits:number,entBytes:number,totalBits:number,standard:boolean}|null} */
export function layoutForWords(n) {
  const words = n | 0;
  if (!(words >= 2 && words <= 512)) return null;
  const total = 11 * words;
  const r = total & 7;
  // c ≡ 11n (mod 8), 1 ≤ c ≤ 11: the candidates are r and r + 8, and r = 0 must
  // take 8 rather than 0 because a zero-bit checksum would carry no constraint.
  const cs = r === 0 ? 8 : r + 8 <= 11 ? r + 8 : r;
  const entBits = total - cs;
  return {
    words,
    entBits,
    csBits: cs,
    entBytes: entBits / 8,
    totalBits: total,
    standard: LADDER[words] === entBits && cs === entBits / 32,
  };
}

/**
 * Inverse of {@link layoutForWords}: for a byte-aligned ENT length, the word
 * count is the smallest n with 11n ≥ ENT and 1 ≤ 11n − ENT ≤ 11. Both
 * directions agree for every n = 2…60 (asserted in tests/01-layout.mjs).
 */
export function layoutForEntropyBits(entBits) {
  const ent = entBits | 0;
  if (!(ent >= 8) || ent % 8 !== 0) return null;
  let words = Math.ceil(ent / 11);
  let cs = 11 * words - ent;
  if (cs < 1) {
    words += 1;
    cs = 11 * words - ent;
  }
  if (!(cs >= 1 && cs <= 11) || words > 512) return null;
  return {
    words,
    entBits: ent,
    csBits: cs,
    entBytes: ent / 8,
    totalBits: ent + cs,
    standard: LADDER[words] === ent && cs === ent / 32,
  };
}

export function wordCountToEntropyBits(n) {
  return LADDER[n] ?? null;
}

export function checksumBits(entropyBits) {
  return entropyBits / 32;
}

export function keyspaceBits(entropyBits) {
  return entropyBits;
}

export function keyspaceDecimal(bits) {
  if (bits <= 53) return String(2 ** bits);
  const exp = (bits * Math.LOG10E * Math.LN2);
  const e = Math.floor(exp);
  const mant = 10 ** (exp - e);
  return `${mant.toFixed(4)} × 10^${e}`;
}

function bytesToBits(bytes) {
  const bits = [];
  for (const b of bytes) {
    for (let i = 7; i >= 0; i--) bits.push((b >> i) & 1);
  }
  return bits;
}

export async function sha256(bytes) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return new Uint8Array(digest);
}

export async function entropyToMnemonic(entropy) {
  const ent = entropy.length * 8;
  const layout = layoutForEntropyBits(ent);
  if (!layout) {
    throw new Error("Entropy must be a whole number of bytes with 1–11 checksum bits to spare");
  }
  const cs = layout.csBits;
  const hash = await sha256(entropy);
  const bits = bytesToBits(entropy).concat(bytesToBits(hash).slice(0, cs));
  const words = [];
  for (let i = 0; i < bits.length; i += 11) {
    let idx = 0;
    for (let j = 0; j < 11; j++) idx = (idx << 1) | bits[i + j];
    words.push(WORDLIST[idx]);
  }
  return words;
}

export async function randomMnemonic(wordCount = 12) {
  const layout = layoutForWords(wordCount);
  if (!layout) throw new Error(`No ${wordCount}-word layout: use 2…512 words`);
  const entropy = new Uint8Array(layout.entBytes);
  crypto.getRandomValues(entropy);
  const words = await entropyToMnemonic(entropy);
  return { words, entropy, layout };
}

/** Draw entropy of an arbitrary bit length (any multiple of 8) and encode it. */
export async function randomEntropyBits(bitCount) {
  const layout = layoutForEntropyBits(bitCount);
  if (!layout) throw new Error(`Entropy must be a whole number of bytes (got ${bitCount} bits)`);
  const entropy = new Uint8Array(layout.entBytes);
  crypto.getRandomValues(entropy);
  const words = await entropyToMnemonic(entropy);
  return { words, entropy, layout };
}

export function parsePhrase(text) {
  return String(text ?? "")
    .normalize("NFKD")
    .trim()
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(Boolean);
}

export function indicesOf(words) {
  return words.map((w) => {
    if (!INDEX.has(w)) return -1;
    return INDEX.get(w);
  });
}

export async function mnemonicToEntropy(words) {
  const n = words.length;
  const layout = layoutForWords(n);
  if (!layout) {
    return { ok: false, reason: n < 2 || n > 512 ? `Word count ${n} has no 11-bit layout (2…512)` : "Unusable word count" };
  }
  const idxs = indicesOf(words);
  if (idxs.some((i) => i < 0)) {
    const bad = words.filter((w) => !INDEX.has(w));
    return { ok: false, reason: `Unknown word(s): ${bad.join(", ")}`, layout };
  }
  const bits = [];
  for (const idx of idxs) {
    for (let j = 10; j >= 0; j--) bits.push((idx >> j) & 1);
  }
  const ent = layout.entBits;
  const cs = layout.csBits;
  const entBits = bits.slice(0, ent);
  const csBits = bits.slice(ent);
  const entropy = new Uint8Array(ent / 8);
  for (let i = 0; i < entropy.length; i++) {
    let v = 0;
    for (let j = 0; j < 8; j++) v = (v << 1) | entBits[i * 8 + j];
    entropy[i] = v;
  }
  const hash = await sha256(entropy);
  const expect = bytesToBits(hash).slice(0, cs);
  const match = expect.every((b, i) => b === csBits[i]);
  return {
    ok: match,
    reason: match
      ? `Checksum valid${layout.standard ? "" : " (generalised layout, not BIP-39)"}`
      : "Checksum mismatch — phrase is not a well-formed BIP-39 encoding",
    entropy,
    indices: idxs,
    entropyBits: ent,
    checksumBits: cs,
    checksumObserved: csBits,
    checksumExpected: expect,
    layout,
  };
}

export { WORDLIST, INDEX };
