// Known-answer tests for tools/verify_uhs_gamegenie.mjs — see
// docs/uhs-gamegenie-recipe-cards-2026-10-21.md for the recipe cards these pin.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  decrypt88a, encrypt88a,
  generateKey, decryptNest, encryptNest, decryptTextHunk, encryptTextHunk,
  decodeGG, encodeGG,
  UHS88A_VECTORS, UHS_TITLE, UHS_KEY, UHS_NEST_VECTORS, UHS_TEXT_VECTORS,
  GG_VECTORS, GG_ENCODE_VECTOR, runChecks,
} from "../tools/verify_uhs_gamegenie.mjs";

test("UHS 88a published primer pairs decrypt and re-encrypt", () => {
  for (const [cipher, plain] of UHS88A_VECTORS) {
    assert.equal(decrypt88a(cipher), plain);
    assert.equal(encrypt88a(plain), cipher);
  }
});

test("UHS generateKey matches upstream my-uhs for the primer title", () => {
  assert.deepEqual(generateKey(UHS_TITLE), UHS_KEY);
});

test("UHS nest-keyed vectors round-trip", () => {
  for (const [cipher, plain] of UHS_NEST_VECTORS) {
    assert.equal(decryptNest(cipher, UHS_KEY), plain);
    assert.equal(encryptNest(plain, UHS_KEY), cipher);
  }
});

test("UHS text-hunk vectors round-trip and diverge from nest beyond key length", () => {
  for (const [cipher, plain] of UHS_TEXT_VECTORS) {
    assert.equal(decryptTextHunk(cipher, UHS_KEY), plain);
    assert.equal(encryptTextHunk(plain, UHS_KEY), cipher);
  }
  // The second text vector is longer than the 13-byte key; its tail must differ
  // from the nest-keyed form (co=i%klen vs i in the XOR offset).
  const [nestCipher] = UHS_NEST_VECTORS[1];
  const [textCipher] = UHS_TEXT_VECTORS[1];
  assert.notEqual(nestCipher, textCipher);
});

test("NES Game Genie README vectors decode and encode", () => {
  for (const v of GG_VECTORS) {
    assert.deepEqual(decodeGG(v.code), {
      value: v.value, address: v.address, wantskey: v.wantskey, key: v.key,
    });
    assert.equal(encodeGG(v.address, v.value, v.key, v.wantskey), v.code);
  }
  const e = GG_ENCODE_VECTOR;
  assert.equal(encodeGG(e.address, e.value, e.key), e.code);
});

test("full report passes", () => {
  const { ok, failures } = runChecks(() => {});
  assert.ok(ok, `failures: ${failures.join(", ")}`);
});
