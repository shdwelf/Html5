// Keyspace Viewer lexicon: BIP-39 English wordlist + λ-calculus vocabulary
// + algebra vocabulary.
//
// Indices 0–2047 are the canonical BIP-39 English wordlist — each one is an
// 11-bit symbol in the keyspace, exactly as `js/bip39-en.js` defines it
// (shared with the validator and the studio, which are untouched).
//
// Indices ≥ 2048 are λ-calculus and algebra extras. They are added to the
// keyspace viewer's lexicon so "lambda calculus", the named calculi, and the
// named algebras below are searchable and visible, but they are NOT 11-bit
// symbols: an 11-bit chunk can only reach index 2047, so a phrase that
// contains one is not a BIP-39-encodable phrase.
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

export const ALGEBRA_EXTRAS = [
  "algebra",
  "associative",
  "banach",
  "clifford",
  "commutative",
  "division",
  "enveloping",
  "exterior",
  "frobenius",
  "geometric",
  "heyting",
  "homological",
  "hopf",
  "jordan",
  "kleene",
  "lie",
  "linear",
  "neumann",
  "sigma",
  "star",
  "symmetric",
  "universal",
  "von",
];

/** First index of the algebra extras (right after the λ-extras). */
export const ALGEBRA_START = BIP39_SYMBOLS + LAMBDA_EXTRAS.length;

/** Full viewer lexicon: 2048 BIP-39 symbols, then λ-extras, then algebra. */
export const WORDLIST = [...BIP39, ...LAMBDA_EXTRAS, ...ALGEBRA_EXTRAS];

/** Index map over the full viewer lexicon (extras included). */
export const INDEX = new Map(WORDLIST.map((w, i) => [w, i]));

/** Lookup of λ-extra word → its index (≥ BIP39_SYMBOLS). */
export const LAMBDA_INDEX = new Map(
  LAMBDA_EXTRAS.map((w, i) => [w, BIP39_SYMBOLS + i])
);

/** Lookup of algebra-extra word → its index (≥ ALGEBRA_START). */
export const ALGEBRA_INDEX = new Map(
  ALGEBRA_EXTRAS.map((w, i) => [w, ALGEBRA_START + i])
);
