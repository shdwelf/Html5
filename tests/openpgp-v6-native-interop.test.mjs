/** Independent Go v6 controls. Fresh synthetic identities only; never read an
 * owner attachment/keyring or upload/cache temporary private material. This is
 * command-line library interop, NOT a PGPony/OpenKeychain/Kleopatra GUI test.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as openpgp from "openpgp";
import * as shipped from "../public/apps/openpgp-workbench/vendor/openpgp.min.mjs";
import { createOpenPgpKeyTools, KEY_COMPATIBILITY_CONFIG as classic } from "../apps/openpgp-workbench/keyring.mjs";
import { encryptBackup } from "../scripts/encrypt-openpgp-backup.mjs";
import { serializeMessage } from "./openpgp-v6-native/packet-bytes.mjs";

const reader = process.env.OPENPGP_V6_GO_READER || "html5-openpgp-v6-interop";
const probe = spawnSync(reader, ["--version"], { encoding: "utf8", timeout: 10000, maxBuffer: 65536 });
const available = probe.status === 0;
const required = process.env.REQUIRE_OPENPGP_V6_NATIVE === "1";
const options = { skip: !available && !required ? "independent Go v6 reader unavailable; same-library JS recovery is not independent interop" : false };
const modern = { ...classic, v6Keys: true, aeadProtect: true, preferredAEADAlgorithm: openpgp.enums.aead.ocb };
const plaintext = Buffer.concat([
  Buffer.from(Array.from({ length: 384 * 1024 }, (_, index) => (index * 73 + 19) % 256)),
  Buffer.from("\u0000Independent v6 native control.\r\nUnicode: café 🔐.\nExact final bytes.\u0000", "utf8"),
]);

function requireReader(t) {
  assert.ok(available, "The independent native v6 control must not silently skip its Go reader when required");
  const version = JSON.parse(probe.stdout);
  assert.equal(version.reader, "ProtonMail/go-crypto/openpgp/v2");
  assert.equal(version.module, "v1.5.2");
  assert.match(version.go, /^go1\.[0-9]+\.[0-9]+$/);
  t.diagnostic(`${version.reader} ${version.module}; ${version.go}; synthetic keys only`);
}

function context() {
  const directory = mkdtempSync(join(tmpdir(), "html5-synthetic-v6-native-"));
  const path = (name) => join(directory, name);
  const file = (name, value) => { const output = path(name); writeFileSync(output, value, { flag: "wx", mode: 0o600 }); return output; };
  const run = (args, { failure = false } = {}) => {
    const result = spawnSync(reader, args, { encoding: "utf8", timeout: 30000, maxBuffer: 131072 });
    assert.equal(result.error, undefined, "native v6 subprocess must finish within its bound");
    assert.equal(result.signal, null);
    if (failure) {
      assert.notEqual(result.status, 0, "negative native control must fail");
      assert.equal(result.stdout, "", "failure must not expose a plaintext prefix or key data");
      assert.equal(result.stderr, "Synthetic v6 reader operation failed.\n");
    } else assert.equal(result.status, 0, `native v6 ${args[0]} operation failed; no private data is logged`);
    return result;
  };
  return { directory, path, file, run, close: () => rmSync(directory, { recursive: true, force: true }) };
}

function nativeKeys(ctx) {
  const identity = JSON.parse(ctx.run(["generate", ctx.directory]).stdout);
  assert.equal(identity.primaryVersion, 6); assert.equal(identity.subkeyVersion, 6);
  assert.equal(identity.primaryAlgorithm, openpgp.enums.publicKey.ed25519);
  assert.equal(identity.subkeyAlgorithm, openpgp.enums.publicKey.x25519);
  assert.equal(identity.subkeys, 1);
  for (const name of ["primaryFingerprint", "encryptionFingerprint"]) assert.match(identity[name], /^[A-F0-9]{64}$/);
  const publicPath = ctx.path("synthetic-public.asc"), privatePath = ctx.path("synthetic-private.asc");
  if (process.platform !== "win32") {
    assert.equal(statSync(ctx.directory).mode & 0o777, 0o700);
    assert.equal(statSync(publicPath).mode & 0o777, 0o600);
    assert.equal(statSync(privatePath).mode & 0o777, 0o600);
  }
  return { ...identity, publicPath, privatePath, publicArmor: readFileSync(publicPath, "utf8") };
}

async function syntheticJsKey(options = {}) {
  const generated = await openpgp.generateKey({
    type: "curve25519", userIDs: [{ name: "Synthetic JS v6 native interop control only" }],
    subkeys: [{ sign: false }], keyExpirationTime: 3600, config: modern, ...options,
  });
  const key = await openpgp.readKey({ armoredKey: generated.publicKey });
  return { ...generated, primaryFingerprint: key.getFingerprint().toUpperCase(), encryptionFingerprint: key.subkeys[0]?.getFingerprint().toUpperCase() };
}

async function assertEnvelope(ciphertext, expected, expectedAEAD = openpgp.enums.aead.ocb) {
  const message = await openpgp.readMessage({ binaryMessage: Uint8Array.from(ciphertext), config: modern });
  assert.equal(message.packets.length, 2);
  const [session, body] = message.packets;
  assert.equal(session.constructor.tag, openpgp.enums.packet.publicKeyEncryptedSessionKey);
  assert.equal(session.version, 6); assert.equal(session.publicKeyVersion, 6);
  assert.equal(Buffer.from(session.publicKeyFingerprint).toString("hex").toUpperCase(), expected);
  assert.equal(body.constructor.tag, openpgp.enums.packet.symEncryptedIntegrityProtectedData);
  assert.equal(body.version, 2); assert.equal(body.cipherAlgorithm, 9); assert.equal(body.aeadAlgorithm, expectedAEAD);
  return message;
}

// Each test enters requireReader BEFORE making a key or temporary directory, so
// local absence is an honest skip and CI absence is a failure, not a fake pass.
test("independent Go-generated v6 keys validate with both app readers and retain both full fingerprints and bindings", options, async (t) => {
  requireReader(t);
  const ctx = context();
  try {
    const key = nativeKeys(ctx);
    const inspected = JSON.parse(ctx.run(["inspect", key.publicPath, key.primaryFingerprint, key.encryptionFingerprint]).stdout);
    assert.equal(inspected.encryptionFingerprint, key.encryptionFingerprint);
    for (const library of [openpgp, shipped]) {
      const tools = createOpenPgpKeyTools(library), ring = tools.createPublicKeyring();
      const [entry] = await ring.importKeys(key.publicArmor, { expectedFingerprint: key.primaryFingerprint });
      assert.equal(entry.keyVersion, 6); assert.equal(entry.subkeyCount, 1);
      assert.match(entry.selfCertification, /^valid/);
      assert.equal(entry.encryptionFingerprint, key.encryptionFingerprint);
      const recipient = await tools.readEncryptionRecipient(ring.exportKeys(), key.primaryFingerprint, { profile: "modern-v6" });
      assert.equal(recipient.encryptionFingerprint, key.encryptionFingerprint);
      const secret = await library.readPrivateKey({ armoredKey: readFileSync(key.privatePath, "utf8") });
      try { assert.equal(secret.getKeys().length, 2); assert.equal(secret.getFingerprint().toUpperCase(), key.primaryFingerprint); }
      finally { secret.clearPrivateParams(); }
    }
    const before = readFileSync(key.privatePath);
    ctx.run(["generate", ctx.directory], { failure: true });
    assert.deepEqual(readFileSync(key.privatePath), before, "native generation cannot overwrite an existing test key");
  } finally { ctx.close(); }
});

test("the actual modern-v6 streaming backup decrypts independently in Go; altered tags/fingerprints, truncation and wrong keys never publish plaintext", options, async (t) => {
  requireReader(t);
  const ctx = context(), other = context();
  try {
    const key = nativeKeys(ctx), wrong = nativeKeys(other);
    const input = ctx.file("synthetic-input.bin", plaintext), outputPath = ctx.path("from-release.gpg");
    const receipt = await encryptBackup({ inputPath: input, outputPath, recipientFile: key.publicPath,
      expectedFingerprint: key.primaryFingerprint, sourceRevision: "b".repeat(40), profile: "modern-v6" });
    assert.deepEqual(receipt.packetProfile, { pkeskVersion: 6, seipdVersion: 2, cipherAlgorithm: 9, aeadAlgorithm: 2 });
    const cipher = readFileSync(outputPath);
    await assertEnvelope(cipher, key.encryptionFingerprint);
    ctx.run(["decrypt", key.privatePath, outputPath, ctx.path("recovered.bin"), key.primaryFingerprint, key.encryptionFingerprint]);
    assert.deepEqual(readFileSync(ctx.path("recovered.bin")), plaintext);
    if (process.platform !== "win32") assert.equal(statSync(ctx.path("recovered.bin")).mode & 0o777, 0o600);

    const mutations = [];
    const modified = Buffer.from(cipher); modified[Math.floor(modified.length / 2)] ^= 1; mutations.push(["body", modified]);
    const finalTag = Buffer.from(cipher); finalTag[finalTag.length - 1] ^= 1; mutations.push(["final-tag", finalTag]);
    mutations.push(["truncated", cipher.subarray(0, cipher.length - 7)]);
    mutations.push(["outer-junk", Buffer.concat([cipher, Buffer.of(0)])]);
    const changedFingerprint = await assertEnvelope(cipher, key.encryptionFingerprint);
    const sameShortId = changedFingerprint.packets[0].publicKeyID.toHex();
    changedFingerprint.packets[0].publicKeyFingerprint[31] ^= 1;
    assert.equal(changedFingerprint.packets[0].publicKeyID.toHex(), sameShortId, "change outside the v6 key ID must still fail full-fingerprint preflight");
    mutations.push(["same-key-id-wrong-full-fingerprint", await serializeMessage(changedFingerprint)]);
    for (const [label, bytes] of mutations) {
      const from = ctx.file(`negative-${label}.gpg`, bytes), to = ctx.path(`negative-${label}.bin`);
      ctx.run(["decrypt", key.privatePath, from, to, key.primaryFingerprint, key.encryptionFingerprint], { failure: true });
      assert.equal(existsSync(to), false, "even a final-tag failure must leave no unauthenticated destination");
    }

    // Retarget BOTH header fields to the other fresh key. Header validation
    // now passes, but its unrelated X25519 secret still cannot unwrap the key.
    const retargeted = await assertEnvelope(cipher, key.encryptionFingerprint);
    const otherPublic = await openpgp.readKey({ armoredKey: wrong.publicArmor });
    const otherEncryption = await otherPublic.getEncryptionKey();
    retargeted.packets[0].publicKeyFingerprint = Uint8Array.from(Buffer.from(wrong.encryptionFingerprint, "hex"));
    retargeted.packets[0].publicKeyID = otherEncryption.getKeyID();
    const retargetedBytes = await serializeMessage(retargeted);
    await assertEnvelope(retargetedBytes, wrong.encryptionFingerprint);
    const wrongInput = ctx.file("wrong-secret-retargeted.gpg", retargetedBytes);
    ctx.run(["decrypt", wrong.privatePath, wrongInput, ctx.path("wrong-secret.bin"), wrong.primaryFingerprint, wrong.encryptionFingerprint], { failure: true });
    assert.equal(existsSync(ctx.path("wrong-secret.bin")), false);
    const sentinel = ctx.file("existing-output.bin", "keep existing synthetic data");
    ctx.run(["decrypt", key.privatePath, outputPath, sentinel, key.primaryFingerprint, key.encryptionFingerprint], { failure: true });
    assert.equal(readFileSync(sentinel, "utf8"), "keep existing synthetic data");
  } finally { ctx.close(); other.close(); }
});

test("Go independently verifies a JS v6 binding and writes negotiated PKESKv6/SEIPDv2 AES-256-GCM that both shipped readers recover exactly", options, async (t) => {
  requireReader(t);
  const ctx = context();
  try {
    const key = await syntheticJsKey(), wrong = await syntheticJsKey();
    const publicFile = ctx.file("from-js-public.asc", key.publicKey), input = ctx.file("input.bin", plaintext), output = ctx.path("from-go.gpg");
    const inspected = JSON.parse(ctx.run(["inspect", publicFile, key.primaryFingerprint, key.encryptionFingerprint]).stdout);
    assert.equal(inspected.primaryFingerprint, key.primaryFingerprint); assert.equal(inspected.encryptionFingerprint, key.encryptionFingerprint);
    ctx.run(["encrypt", publicFile, input, output, key.primaryFingerprint, key.encryptionFingerprint]);
    const cipher = readFileSync(output);
    await assertEnvelope(cipher, key.encryptionFingerprint, openpgp.enums.aead.gcm);
    for (const library of [openpgp, shipped]) {
      const secret = await library.readPrivateKey({ armoredKey: key.privateKey }), wrongSecret = await library.readPrivateKey({ armoredKey: wrong.privateKey });
      const altered = Uint8Array.from(cipher); altered[altered.length - 1] ^= 1;
      try {
        const result = await library.decrypt({ message: await library.readMessage({ binaryMessage: Uint8Array.from(cipher) }), decryptionKeys: secret, format: "binary" });
        assert.deepEqual(Buffer.from(result.data), plaintext); assert.equal(result.signatures.length, 0);
        await assert.rejects(async () => library.decrypt({ message: await library.readMessage({ binaryMessage: altered }), decryptionKeys: secret, format: "binary" }));
        await assert.rejects(async () => library.decrypt({ message: await library.readMessage({ binaryMessage: Uint8Array.from(cipher.subarray(0, cipher.length - 7)) }), decryptionKeys: secret, format: "binary" }));
        await assert.rejects(async () => library.decrypt({ message: await library.readMessage({ binaryMessage: Uint8Array.from(cipher) }), decryptionKeys: wrongSecret, format: "binary" }));
      } finally { secret.clearPrivateParams(); wrongSecret.clearPrivateParams(); }
    }
  } finally { ctx.close(); }
});

test("independent native v6 preflight refuses ambiguous/secret/v4/revoked/expired/unbound/signing-only and short-fingerprint inputs", options, async (t) => {
  requireReader(t);
  const ctx = context();
  try {
    const key = await syntheticJsKey();
    const v4 = await syntheticJsKey({ type: "ecc", curve: "curve25519Legacy", subkeys: [{ sign: false }], config: classic });
    const expired = await syntheticJsKey({ date: new Date("2000-01-01T00:00:00Z") });
    const signing = await syntheticJsKey({ subkeys: [] });
    const revoked = await openpgp.revokeKey({ key: await openpgp.readKey({ armoredKey: key.publicKey }), revocationCertificate: key.revocationCertificate, config: modern });
    const unbound = await openpgp.readKey({ armoredKey: key.publicKey });
    unbound.subkeys[0].bindingSignatures = [];
    const inputs = [key.privateKey, key.privateKey.replaceAll("PRIVATE KEY BLOCK", "PUBLIC KEY BLOCK"), key.publicKey + key.publicKey,
      "preface " + key.publicKey, key.publicKey + "trailing", v4.publicKey, revoked.publicKey, unbound.armor()];
    const bundle = new openpgp.PacketList();
    const original = await openpgp.readKey({ armoredKey: key.publicKey });
    bundle.push(...original.toPacketList(), ...original.toPacketList());
    inputs.push(openpgp.armor(openpgp.enums.armor.publicKey, bundle.write()));
    for (const [index, input] of inputs.entries()) {
      const file = ctx.file(`refused-${index}.asc`, input);
      ctx.run(["inspect", file, key.primaryFingerprint, key.encryptionFingerprint], { failure: true });
    }
    // Use the expired/signing-only certificates' OWN primary fingerprints so
    // fingerprint mismatch cannot mask their actual validity/eligibility gate.
    ctx.run(["inspect", ctx.file("expired-public.asc", expired.publicKey), expired.primaryFingerprint, expired.encryptionFingerprint], { failure: true });
    ctx.run(["inspect", ctx.file("signing-only-public.asc", signing.publicKey), signing.primaryFingerprint, key.encryptionFingerprint], { failure: true });
    const file = ctx.file("valid-public.asc", key.publicKey);
    for (const [primary, encryption] of [[key.primaryFingerprint.slice(0, 16), key.encryptionFingerprint], ["0".repeat(64), key.encryptionFingerprint], [key.primaryFingerprint, key.primaryFingerprint]]) {
      ctx.run(["inspect", file, primary, encryption], { failure: true });
    }
  } finally { ctx.close(); }
});
