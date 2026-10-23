/**
 * wallet-card.js — the wallet crypto-card, expressed in house formats (T11.1).
 *
 * A physical wallet crypto-card is a seed-phrase backup: numbered words,
 * a checksum, and just enough *public* data to verify a restore without
 * touching a hot wallet — master fingerprint, account public key, first
 * receive address. This module models exactly that card on the repo's
 * vector-tested BIP-39/BIP-32 stack (js/bip39.js, js/wallet-derivatives.js).
 *
 * Hard rules, enforced below and in the tests:
 *   - strict standard BIP-39 phrases only (12/15/18/21/24 words, checksum
 *     verified through bip39.mnemonicToEntropy — fail closed);
 *   - the card prints the words (that is what a backup card *is*) and
 *     public verification data only: never a WIF key, xprv, or seed hex;
 *   - a BIP-39 passphrase is never printed or stored on the card — only
 *     the fact that one was in use, so a restore knows to ask for it.
 *
 * The bip39-haiku workbench stays what it says it is — entertainment.
 * A haiku is not entropy, and this module refuses non-BIP-39 input
 * rather than let the two lineages blur.
 */

import { parsePhrase, mnemonicToEntropy } from "./bip39.js";
import { mnemonicToSeed } from "./coins.js";
import { secpMaster, secpPub } from "./bip32.js";
import { hash160 } from "./hash.js";
import { deriveBitcoinWallet } from "./wallet-derivatives.js";

const toHex = (bytes) => [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");

/**
 * Build a wallet card from a BIP-39 phrase. Async because phrase
 * validation rides the house (async) BIP-39 verifier.
 */
export async function createWalletCard({ mnemonic, passphrase = "" } = {}) {
  const words = parsePhrase(mnemonic);
  const checked = await mnemonicToEntropy(words);
  if (!checked.ok) throw new Error(`Wallet card refused: ${checked.reason}`);
  if (!checked.layout.standard) {
    throw new Error(`Wallet card refused: ${words.length} words is a generalised layout, not standard BIP-39 (12/15/18/21/24)`);
  }
  const phrase = words.join(" ");
  const seed = mnemonicToSeed(phrase, String(passphrase));
  const fingerprint = toHex(hash160(secpPub(secpMaster(seed))).subarray(0, 4));
  const wallet = deriveBitcoinWallet(phrase, String(passphrase), 1);
  const native = wallet.schemes["84"]; // BIP-84 native segwit is the card default
  return {
    format: "wallet-card-v1",
    words,
    wordCount: words.length,
    entropyBits: checked.entropyBits,
    checksumBits: checked.checksumBits,
    masterFingerprint: fingerprint,
    accountPath: "m/84'/0'/0'",
    accountPublic: native.accountPublic,
    firstAddress: native.rows[0].address,
    passphraseUsed: String(passphrase).length > 0,
  };
}

const CELL = 20;
function wordCell(n, word) {
  return `${String(n).padStart(2, " ")}. ${word}`.padEnd(CELL, " ");
}

/** Render the card as fixed-width text, sized to print and cut out. */
export function renderWalletCard(card) {
  const W = 64;
  const bar = "+" + "-".repeat(W) + "+";
  const line = (s = "") => "|" + s.padEnd(W, " ").slice(0, W) + "|";
  const out = [bar];
  out.push(line(` WALLET CARD ${card.format}   master fingerprint ${card.masterFingerprint}`));
  out.push(line(` ${card.wordCount} words · ${card.entropyBits}-bit entropy · BIP-39 checksum ${card.checksumBits} bit`));
  out.push(line(` passphrase: ${card.passphraseUsed ? "IN USE (not printed - restore will ask)" : "none"}`));
  out.push(bar);
  for (let r = 0; r < card.words.length; r += 3) {
    const cells = [0, 1, 2].map((c) => (r + c < card.words.length ? wordCell(r + c + 1, card.words[r + c]) : ""));
    out.push(line(" " + cells.join("").trimEnd()));
  }
  out.push(bar);
  out.push(line(" VERIFY A RESTORE WITH PUBLIC DATA ONLY:"));
  out.push(line(` account  ${card.accountPath}  ${card.accountPublic.slice(0, 44)}`));
  out.push(line(`          ${card.accountPublic.slice(44)}`));
  out.push(line(` address  ${card.firstAddress}`));
  out.push(bar);
  out.push(line(" Anyone holding this card holds the seed. Store it like cash."));
  out.push(line(" The words above are the wallet; everything else is a check."));
  out.push(bar);
  return out.join("\n");
}

/**
 * Parse a rendered card back to a validated wallet card. Numbered words
 * are extracted in order (1..N, no gaps), then the phrase goes through
 * the same fail-closed validation as createWalletCard.
 */
export async function parseWalletCard(text, { passphrase = "" } = {}) {
  const found = [...String(text).matchAll(/(\d{1,2})\.\s+([a-z]+)/g)]
    .map((m) => ({ n: Number(m[1]), word: m[2] }));
  if (found.length === 0) throw new Error("Wallet card parse failed: no numbered words found");
  found.forEach((f, i) => {
    if (f.n !== i + 1) throw new Error(`Wallet card parse failed: numbering gap at position ${i + 1}`);
  });
  return createWalletCard({ mnemonic: found.map((f) => f.word).join(" "), passphrase });
}
