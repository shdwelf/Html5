// Cross-implementation pin for the haiku-vault-v1 wire format.
//
// docs/haiku-vault-format-draft.md documents the format and publishes a fixed
// test vector. This test re-derives that vector with node:crypto only — an
// implementation independent of src/lib/vaultfile.ts (@noble) and of the
// generated WebCrypto decryptor page — so the draft cannot drift from reality.
//
//   haiku-vault-v1. + Base64(0x01 | salt[16] | iv[12] | AES-256-GCM ct+tag)
//   PBKDF2-HMAC-SHA256, 120000 iterations, 32-byte key, UTF-8 passphrase
import { test } from "node:test";
import assert from "node:assert/strict";
import { pbkdf2Sync, createCipheriv, createDecipheriv } from "node:crypto";

const PASS = "correct horse battery staple";
const SALT = Buffer.alloc(16, 0x2a);
const IV = Buffer.alloc(12, 0x2a);
const PT = JSON.stringify({ note: "haiku vault format test vector" }, null, 2);
const KEY_HEX = "65033e57d99c573585534ef016031e62d84710b0a546845a0fadba4b7ca2418d";
const CT_TAG_HEX = "5a6a7e4e6e156a4683b69aac6d0c1f0d6c7382c4b8e9983fe585ce82b02dd514" +
  "ce31af6f30a8a130da54b16605f64d841a6224b841ab79d75722651bd9a7";
const BLOB = "haiku-vault-v1.ASoqKioqKioqKioqKioqKioqKioqKioqKioqKipaan5ObhVqRoO2" +
  "mqxtDB8NbHOCxLjpmD/lhc6CsC3VFM4xr28wqKEw2lSxZgX2TYQaYiS4Qat511ciZRvZpw==";

test("PBKDF2-HMAC-SHA256 (120000) derives the documented key", () => {
  const key = pbkdf2Sync(Buffer.from(PASS, "utf-8"), SALT, 120000, 32, "sha256");
  assert.equal(key.toString("hex"), KEY_HEX);
});

test("AES-256-GCM encrypts the documented plaintext to the documented ct+tag", () => {
  const key = Buffer.from(KEY_HEX, "hex");
  const cipher = createCipheriv("aes-256-gcm", key, IV);
  const ct = Buffer.concat([cipher.update(Buffer.from(PT, "utf-8"), "utf-8"), cipher.final()]);
  const out = Buffer.concat([ct, cipher.getAuthTag()]);
  assert.equal(out.toString("hex"), CT_TAG_HEX);
});

test("the published blob parses as 0x01 | salt | iv | ct+tag and decrypts", () => {
  assert.ok(BLOB.startsWith("haiku-vault-v1."));
  const body = Buffer.from(BLOB.slice("haiku-vault-v1.".length), "base64");
  assert.equal(body[0], 1);
  assert.equal(body.subarray(1, 17).toString("hex"), SALT.toString("hex"));
  assert.equal(body.subarray(17, 29).toString("hex"), IV.toString("hex"));
  assert.equal(body.subarray(29).toString("hex"), CT_TAG_HEX);

  const key = pbkdf2Sync(Buffer.from(PASS, "utf-8"), body.subarray(1, 17), 120000, 32, "sha256");
  const d = createDecipheriv("aes-256-gcm", key, body.subarray(17, 29));
  d.setAuthTag(body.subarray(-16));
  const plain = Buffer.concat([d.update(body.subarray(29, -16)), d.final()]).toString("utf-8");
  assert.equal(plain, PT);
});

test("tampering with the ciphertext is rejected", () => {
  const body = Buffer.from(BLOB.slice("haiku-vault-v1.".length), "base64");
  body[29] ^= 0xff;
  const key = pbkdf2Sync(Buffer.from(PASS, "utf-8"), body.subarray(1, 17), 120000, 32, "sha256");
  const d = createDecipheriv("aes-256-gcm", key, body.subarray(17, 29));
  d.setAuthTag(body.subarray(-16));
  assert.throws(() => {
    const out = Buffer.concat([d.update(body.subarray(29, -16)), d.final()]);
    void out;
  });
});
