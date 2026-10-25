// T11.1: wallet crypto-card — strict BIP-39 in, public verification data out.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createWalletCard, renderWalletCard, parseWalletCard } from "../js/wallet-card.js";

const VECTOR = Array(11).fill("abandon").concat("about").join(" ");

test("canonical test mnemonic yields the published card values", async () => {
  const card = await createWalletCard({ mnemonic: VECTOR });
  assert.equal(card.masterFingerprint, "73c5da0a");
  assert.equal(card.firstAddress, "bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu");
  assert.equal(
    card.accountPublic,
    "zpub6rFR7y4Q2AijBEqTUquhVz398htDFrtymD9xYYfG1m4wAcvPhXNfE3EfH1r1ADqtfSdVCToUG868RvUUkgDKf31mGDtKsAYz2oz2AGutZYs",
  );
  assert.equal(card.entropyBits, 128);
  assert.equal(card.checksumBits, 4);
});

test("the rendered card carries public checks only — no private material", async () => {
  const card = await createWalletCard({ mnemonic: VECTOR, passphrase: "TREZOR" });
  const text = renderWalletCard(card);
  assert.match(card.masterFingerprint, /^[0-9a-f]{8}$/);
  assert.notEqual(card.masterFingerprint, "73c5da0a"); // a passphrase is a different seed, hence a different card
  assert.match(text, /passphrase: IN USE \(not printed/);
  assert.ok(!text.includes("TREZOR"), "passphrase must never be printed");
  assert.ok(!/xprv|zprv|[LK][123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{50,}/.test(text.replace(card.accountPublic, "")),
    "no extended private key or WIF-shaped string may appear");
  assert.ok(!text.includes(card.words.join(" ").replaceAll("abandon ", "abandon\n")), "sanity: renderer is a grid, not a phrase dump");
});

test("render -> parse round-trips to the same validated card", async () => {
  const card = await createWalletCard({ mnemonic: VECTOR });
  const back = await parseWalletCard(renderWalletCard(card));
  assert.deepEqual(back.words, card.words);
  assert.equal(back.masterFingerprint, card.masterFingerprint);
  assert.equal(back.firstAddress, card.firstAddress);
});

test("fail closed: tampered phrase, unknown words, numbering gaps, haiku input", async () => {
  const tampered = VECTOR.replace(/about$/, "zoo"); // valid word, wrong checksum position
  await assert.rejects(() => createWalletCard({ mnemonic: tampered }), /refused/);
  await assert.rejects(() => createWalletCard({ mnemonic: "abandon abandon notaword" }), /refused/);
  await assert.rejects(
    () => createWalletCard({ mnemonic: "old pond frog jumps in sound of water" }), // a haiku is not entropy
    /refused/,
  );
  const card = await createWalletCard({ mnemonic: VECTOR });
  const gapped = renderWalletCard(card).replace("12. about", "13. about");
  await assert.rejects(() => parseWalletCard(gapped), /numbering gap/);
});
