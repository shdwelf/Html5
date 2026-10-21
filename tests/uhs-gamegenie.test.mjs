// Known-answer tests for tools/verify_uhs_gamegenie.mjs — see
// docs/uhs-gamegenie-recipe-cards-2026-10-21.md for the recipe cards these pin.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  decrypt88a, encrypt88a,
  generateKey, decryptNest, encryptNest, decryptTextHunk, encryptTextHunk,
  decodeGG, encodeGG,
  decodeSNES, encodeSNES, decodeGEN, encodeGEN, decodeGB, encodeGB,
  decodeGGG, encodeGGG,
  UHS88A_VECTORS, UHS_TITLE, UHS_KEY, UHS_NEST_VECTORS, UHS_TEXT_VECTORS,
  GG_VECTORS, GG_ENCODE_VECTOR, GG_CROSS_VECTOR,
  SNES_VECTORS, GEN_VECTORS, GB_VECTORS, GGG_VECTORS,
  runChecks,
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

test("NES cross-vector ATVATGSL = 60:0466?B5 (ggencoder-java README)", () => {
  const x = GG_CROSS_VECTOR;
  const got = decodeGG(x.code);
  assert.equal(got.value, x.value);
  assert.equal(got.address, x.address);
  assert.equal(got.key, x.key);
  assert.equal(encodeGG(x.address, x.value, x.key), x.code);
});

test("SNES Game Genie upstream-generated vectors round-trip", () => {
  for (const [code, address, value] of SNES_VECTORS) {
    assert.equal(encodeSNES(address, value), code);
    assert.deepEqual(decodeSNES(code), { address, value });
  }
});

test("Genesis Game Genie upstream-generated vectors round-trip", () => {
  for (const [code, address, value] of GEN_VECTORS) {
    assert.equal(encodeGEN(address, value), code);
    assert.deepEqual(decodeGEN(code), { address, value });
  }
});

test("Game Boy Game Genie vectors round-trip, keyed and unkeyed", () => {
  for (const [code, address, value, key] of GB_VECTORS) {
    assert.equal(encodeGB(address, value, key ?? undefined), code);
    const got = decodeGB(code);
    assert.equal(got.address, address);
    assert.equal(got.value, value);
    if (key === null) assert.equal(got.key, false);
    else assert.equal(got.key, key);
  }
});

test("Sega Game Gear Game Genie published codes round-trip (SMSPower format)", () => {
  for (const [code, address, value, reference] of GGG_VECTORS) {
    assert.equal(encodeGGG(value, address, reference), code);
    const got = decodeGGG(code);
    assert.equal(got.address, address);
    assert.equal(got.value, value);
    assert.equal(got.reference, reference);
    assert.equal(got.cloak, 8, "cloak is 8 in every published code");
  }
  // home-made short form: two groups only (no cloak/reference), per SMSPower
  const short = encodeGGG("00", "5701", null);
  assert.equal(short, "007-01A");
  assert.deepEqual(decodeGGG(short), { value: "00", address: "5701", cloak: null, reference: null });
  // the 1/5/9-lives family is the same patch address with only DD changed
  assert.equal(decodeGGG("053-7DE-E66").address, decodeGGG("013-7DE-E66").address);
  assert.equal(decodeGGG("053-7DE-E66").address, decodeGGG("093-7DE-E66").address);
});

test("full report passes", () => {
  const { ok, failures } = runChecks(() => {});
  assert.ok(ok, `failures: ${failures.join(", ")}`);
});
