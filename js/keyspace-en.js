// Keyspace Viewer lexicon: BIP-39 English wordlist + λ-calculus vocabulary.
//
// Indices 0–2047 are the canonical BIP-39 English wordlist — each one is an
// 11-bit symbol in the keyspace, exactly as `js/bip39-en.js` defines it
// (shared with the validator and the studio, which are untouched).
//
// Indices ≥ 2048 are λ-calculus extras. They are added to the keyspace
// viewer's lexicon so "lambda calculus" and the named calculi below are
// searchable and visible, but they are NOT 11-bit symbols: an 11-bit chunk
// can only reach index 2047, so a phrase that contains one is not a
// BIP-39-encodable phrase.
import { WORDLIST as BIP39 } from "./bip39-en.js";

export const BIP39_SYMBOLS = BIP39.length; // 2048 · the 11-bit symbol space

export const LAMBDA_EXTRAS = [
  "boolean",
  "calculus",
  "differential",
  "duration",
  "event",
  "fractional",
  "influence",
  "integral",
  "ito",
  "lambda",
  "modal",
  "mu",
  "pi",
  "predicate",
  "propositional",
  "relational",
  "ricci",
  "sequent",
  "simply",
  "situation",
  "stochastic",
  "tensor",
  "typed",
  "umbral",
  "untyped",
  "vector",
];

/** Full viewer lexicon: 2048 BIP-39 symbols followed by the λ-extras. */
export const WORDLIST = [...BIP39, ...LAMBDA_EXTRAS];

/** Index map over the full viewer lexicon (extras included). */
export const INDEX = new Map(WORDLIST.map((w, i) => [w, i]));

/** Lookup of λ-extra word → its index (≥ BIP39_SYMBOLS). */
export const LAMBDA_INDEX = new Map(
  LAMBDA_EXTRAS.map((w, i) => [w, BIP39_SYMBOLS + i])
);
