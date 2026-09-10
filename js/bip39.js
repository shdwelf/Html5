import { WORDLIST } from "./bip39-en.js";

const INDEX = new Map(WORDLIST.map((w, i) => [w, i]));

export function wordCountToEntropyBits(n) {
  const map = { 12: 128, 15: 160, 18: 192, 21: 224, 24: 256 };
  return map[n] ?? null;
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
  if (![128, 160, 192, 224, 256].includes(ent)) {
    throw new Error("Entropy must be 128–256 bits in 32-bit steps");
  }
  const cs = ent / 32;
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
  const bits = wordCountToEntropyBits(wordCount);
  if (!bits) throw new Error("Use 12, 15, 18, 21, or 24 words");
  const entropy = new Uint8Array(bits / 8);
  crypto.getRandomValues(entropy);
  const words = await entropyToMnemonic(entropy);
  return { words, entropy };
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
  const ent = wordCountToEntropyBits(n);
  if (!ent) return { ok: false, reason: "Word count must be 12, 15, 18, 21, or 24" };
  const idxs = indicesOf(words);
  if (idxs.some((i) => i < 0)) {
    const bad = words.filter((w) => !INDEX.has(w));
    return { ok: false, reason: `Unknown word(s): ${bad.join(", ")}` };
  }
  const bits = [];
  for (const idx of idxs) {
    for (let j = 10; j >= 0; j--) bits.push((idx >> j) & 1);
  }
  const cs = checksumBits(ent);
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
    reason: match ? "Checksum valid" : "Checksum mismatch — phrase is not a well-formed BIP-39 encoding",
    entropy,
    indices: idxs,
    entropyBits: ent,
    checksumBits: cs,
    checksumObserved: csBits,
    checksumExpected: expect,
  };
}

export { WORDLIST, INDEX };
