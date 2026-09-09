import { WORDLIST } from "./bip39-en.js";

const INDEX = new Map(WORDLIST.map((w, i) => [w, i]));

/** BIP-39 proper: ENT ∈ {128,160,192,224,256} ↔ 12/15/18/21/24 words. */
export const STANDARD_ENTROPY = [128, 160, 192, 224, 256];
export const STANDARD_WORDS = [12, 15, 18, 21, 24];
/** UI ceiling: 512 words = 5632-bit entropy. The math itself is unbounded. */
export const MAX_WORDS = 512;

/**
 * Generalised checksum length.
 *
 * BIP-39 fixes CS = ENT/32, which only lands on a whole 11-bit word for the five
 * ladder values above — that is why 25 words is "not an option" in the standard.
 * The rule below reproduces BIP-39 exactly on that ladder and extends it:
 *
 *   CS = the largest c ≤ 11 such that (11·n − c) is a whole number of bytes
 *
 * 12→4 · 15→5 · 18→6 · 21→7 · 24→8 (BIP-39) · 25→11 · 27→9 · 30→10 · 33→11 · 56→8
 */
export function checksumForWords(words) {
  const r = ((11 * words) % 8 + 8) % 8; // 0..7
  const base = r === 0 ? 8 : r; // never allow a 0-bit checksum
  return base + 8 <= 11 ? base + 8 : base;
}

/** Inverse direction: the CS that closes 11n bits for a given ENT byte length. */
export function checksumForEntropyBits(ent) {
  const c = (11 - (ent % 11)) % 11;
  return c === 0 ? 11 : c;
}

export function layoutForWords(words) {
  const n = Number(words);
  if (!Number.isInteger(n) || n < 2 || n > MAX_WORDS) return null;
  const cs = checksumForWords(n);
  const ent = 11 * n - cs;
  return {
    words: n,
    entBits: ent,
    entBytes: ent / 8,
    csBits: cs,
    totalBits: 11 * n,
    standard: STANDARD_WORDS.includes(n),
  };
}

export function layoutForEntropyBits(ent) {
  const e = Number(ent);
  if (!Number.isInteger(e) || e < 8 || e % 8 !== 0) return null;
  const cs = checksumForEntropyBits(e);
  const total = e + cs;
  return {
    words: total / 11,
    entBits: e,
    entBytes: e / 8,
    csBits: cs,
    totalBits: total,
    standard: STANDARD_ENTROPY.includes(e),
  };
}

/** Back-compat name: entropy bits implied by a word count (generalised rule). */
export function wordCountToEntropyBits(n) {
  return layoutForWords(n)?.entBits ?? null;
}

export function checksumBits(entropyBits) {
  return checksumForEntropyBits(entropyBits);
}

export function keyspaceBits(entropyBits) {
  return entropyBits;
}

export function keyspaceDecimal(bits) {
  if (bits <= 53) return String(2 ** bits);
  const exp = bits * Math.LOG10E * Math.LN2;
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
  if (ent % 8 !== 0 || ent < 8) throw new Error("Entropy must be at least 8 bits, byte aligned");
  const cs = checksumForEntropyBits(ent);
  const hash = await sha256(entropy);
  const bits = bytesToBits(entropy).concat(bytesToBits(hash).slice(0, cs));
  const words = [];
  for (let i = 0; i + 11 <= bits.length; i += 11) {
    let idx = 0;
    for (let j = 0; j < 11; j++) idx = (idx << 1) | bits[i + j];
    words.push(WORDLIST[idx]);
  }
  return words;
}

export async function randomMnemonic(wordCount = 12) {
  const layout = layoutForWords(wordCount);
  if (!layout) throw new Error(`Word count must be an integer 2–${MAX_WORDS}`);
  const entropy = new Uint8Array(layout.entBytes);
  crypto.getRandomValues(entropy);
  const words = await entropyToMnemonic(entropy);
  return { words, entropy, layout };
}

/** Random entropy of an exact bit length (byte aligned) — for odd sizes like 56-bit. */
export async function randomEntropyBits(bits) {
  const layout = layoutForEntropyBits(bits);
  if (!layout) throw new Error("Entropy must be a multiple of 8 bits, ≥ 8");
  const entropy = new Uint8Array(layout.entBytes);
  crypto.getRandomValues(entropy);
  return { entropy, layout };
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
    return { ok: false, reason: `Word count must be an integer 2–${MAX_WORDS}` };
  }
  const idxs = indicesOf(words);
  if (idxs.some((i) => i < 0)) {
    const bad = words.filter((w) => !INDEX.has(w));
    return { ok: false, reason: `Unknown word(s): ${bad.slice(0, 6).join(", ")}`, layout };
  }
  const bits = [];
  for (const idx of idxs) {
    for (let j = 10; j >= 0; j--) bits.push((idx >> j) & 1);
  }
  const { entBits: ent, csBits: cs } = layout;
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
  const ratio = `CS ${cs} = ENT/${Math.round(ent / cs)}`;
  return {
    ok: match,
    reason: match
      ? layout.standard
        ? "Checksum valid · BIP-39 standard ladder"
        : `Checksum valid · generalised rule (${ratio}), outside the BIP-39 ladder`
      : `Checksum mismatch — not a well-formed ${n}-word encoding (expected ${ratio})`,
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
