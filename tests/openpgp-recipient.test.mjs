import assert from "node:assert/strict";
import { before, test } from "node:test";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import * as openpgp from "openpgp";
import {
  KEY_COMPATIBILITY_CONFIG as config, createOpenPgpKeyTools, createPublicKeyring,
  readEncryptionRecipient, checkedPrivateDownload,
} from "../apps/openpgp-workbench/keyring.mjs";
import { encryptBackup } from "../scripts/encrypt-openpgp-backup.mjs";

const sourceRevision = "a".repeat(40);
let generated, publicKey, privateKey, fingerprint;
before(async () => {
  generated = await openpgp.generateKey({
    type: "ecc", curve: "curve25519Legacy", userIDs: [{ name: "Synthetic ECC recipient only", email: "test@example.invalid" }],
    subkeys: [{ curve: "curve25519Legacy", sign: false }, { curve: "curve25519Legacy", sign: true }], config,
  });
  publicKey = await openpgp.readKey({ armoredKey: generated.publicKey });
  privateKey = await openpgp.readPrivateKey({ armoredKey: generated.privateKey });
  fingerprint = publicKey.getFingerprint().toUpperCase();
});

async function temporary(callback) {
  const directory = await mkdtemp(join(tmpdir(), "html5-synthetic-backup-"));
  try {
    const inputPath = join(directory, "synthetic.bin"), outputPath = join(directory, "synthetic.bin.gpg"), recipientFile = join(directory, "public.asc");
    const plaintext = Buffer.concat([Buffer.from("Synthetic binary backup — no real user material\0\xff"), Buffer.alloc(2_100_000, 0xa5)]);
    await writeFile(inputPath, plaintext, { mode: 0o600 });
    await writeFile(recipientFile, generated.publicKey, { mode: 0o600 });
    return await callback({ directory, plaintext, options: { inputPath, outputPath, recipientFile, expectedFingerprint: fingerprint, sourceRevision } });
  } finally { await rm(directory, { recursive: true, force: true }); }
}

test("v4 legacy Ed25519/Curve25519 public import preserves an encryption and an additional signing subkey in both distributions", async () => {
  for (const library of [openpgp, await import("../public/apps/openpgp-workbench/vendor/openpgp.min.mjs")]) {
    const tools = createOpenPgpKeyTools(library), ring = tools.createPublicKeyring();
    const [entry] = await ring.importKeys(generated.publicKey, { expectedFingerprint: fingerprint });
    assert.match(entry.algorithm, /v4 Ed25519 \/ Curve25519/);
    assert.match(entry.selfCertification, /^valid at import time/);
    const roundtrip = await openpgp.readKey({ armoredKey: ring.exportKeys() });
    assert.equal(roundtrip.getKeys().length, 3);
    const recipient = await tools.readEncryptionRecipient(ring.exportKeys(), fingerprint);
    assert.equal(recipient.fingerprint, fingerprint);
    assert.equal(recipient.encryptionFingerprint, publicKey.subkeys[0].getFingerprint().toUpperCase());
    assert.equal(recipient.encryptionKeyID, publicKey.subkeys[0].getKeyID().toHex().toUpperCase());
  }
  // Extending public import must not weaken generated-private-download checks.
  await assert.rejects(checkedPrivateDownload(generated.privateKey, fingerprint), /only v4 RSA/);
});

test("backup recipients require a full matching PRIMARY fingerprint and exactly one public certificate", async () => {
  for (const value of [undefined, "", fingerprint.slice(-16), publicKey.subkeys[0].getFingerprint(), "0".repeat(40)]) {
    await assert.rejects(readEncryptionRecipient(generated.publicKey, value));
  }
  const packets = new openpgp.PacketList(); packets.push(...publicKey.toPacketList(), ...publicKey.toPacketList());
  for (const armor of [
    generated.publicKey + generated.publicKey,
    openpgp.armor(openpgp.enums.armor.publicKey, packets.write()),
    generated.privateKey,
    generated.privateKey.replaceAll("PRIVATE KEY BLOCK", "PUBLIC KEY BLOCK"),
    generated.publicKey + generated.privateKey,
  ]) await assert.rejects(readEncryptionRecipient(armor, fingerprint));
});

test("expired, revoked or signing-only ECC certificates cannot be used for backup encryption", async () => {
  const expired = await openpgp.generateKey({ type: "ecc", curve: "curve25519Legacy", userIDs: [{ name: "Synthetic expired" }], date: new Date("2000-01-01T00:00:00Z"), keyExpirationTime: 3600, config });
  const signingOnly = await openpgp.generateKey({ type: "ecc", curve: "curve25519Legacy", userIDs: [{ name: "Synthetic signing only" }], subkeys: [], config });
  const revoked = await openpgp.revokeKey({ key: publicKey, revocationCertificate: generated.revocationCertificate, config });
  for (const armor of [expired.publicKey, signingOnly.publicKey, revoked.publicKey]) {
    const key = await openpgp.readKey({ armoredKey: armor });
    await assert.rejects(readEncryptionRecipient(armor, key.getFingerprint()));
  }
  const unbound = await openpgp.readKey({ armoredKey: generated.publicKey });
  unbound.subkeys[0].bindingSignatures = [];
  await assert.rejects(readEncryptionRecipient(unbound.armor(), fingerprint));
  const ring = createPublicKeyring();
  assert.match((await ring.importKeys(expired.publicKey))[0].selfCertification, /archival export only/);
});

test("streaming binary backup has one checked recipient, classic integrity protection and correct digests; synthetic owner recovers exact bytes", async () => {
  await temporary(async ({ plaintext, options }) => {
    const manifest = await encryptBackup(options), ciphertext = await readFile(options.outputPath);
    assert.equal(manifest.ciphertext.bytes, ciphertext.length);
    for (const algorithm of ["sha256", "md5"]) assert.equal(manifest.ciphertext[algorithm], createHash(algorithm).update(ciphertext).digest("hex"));
    assert.deepEqual(JSON.parse(await readFile(`${options.outputPath}.json`)), manifest);
    assert.equal(await readFile(`${options.outputPath}.sha256`, "utf8"), `${manifest.ciphertext.sha256}  synthetic.bin.gpg\n`);
    assert.doesNotMatch(JSON.stringify(manifest), /test@example|Synthetic ECC|PRIVATE KEY/);
    assert.equal(manifest.sourceRevision, sourceRevision);
    for (const path of [options.outputPath, `${options.outputPath}.json`, `${options.outputPath}.sha256`]) assert.equal((await stat(path)).mode & 0o777, 0o600);
    const message = await openpgp.readMessage({ binaryMessage: ciphertext });
    assert.equal(message.packets.length, 2);
    assert.equal(message.packets[0].version, 3);
    assert.equal(message.packets[1].version, 1);
    assert.deepEqual(message.getEncryptionKeyIDs().map((id) => id.toHex().toUpperCase()), [manifest.encryptionKeyID]);
    const [session] = await openpgp.decryptSessionKeys({ message, decryptionKeys: privateKey, config });
    assert.equal(session.algorithm, "aes256");
    // decryptSessionKeys consumes the session packet's encrypted params.
    const decrypted = await openpgp.decrypt({ message: await openpgp.readMessage({ binaryMessage: ciphertext }), decryptionKeys: privateKey, format: "binary", config });
    assert.deepEqual(Buffer.from(decrypted.data), plaintext);
    assert.equal(decrypted.signatures.length, 0, "backup is encrypted, not claimed to be sender-signed");
    const altered = Buffer.from(ciphertext); altered[altered.length - 12] ^= 1;
    await assert.rejects(openpgp.decrypt({ message: await openpgp.readMessage({ binaryMessage: altered }), decryptionKeys: privateKey, format: "binary", config }));
    const other = await openpgp.generateKey({ type: "ecc", curve: "curve25519Legacy", userIDs: [{ name: "Synthetic wrong owner" }], config });
    await assert.rejects(openpgp.decrypt({ message: await openpgp.readMessage({ binaryMessage: ciphertext }), decryptionKeys: await openpgp.readPrivateKey({ armoredKey: other.privateKey }), format: "binary", config }));
  });
});

test("backup CLI rejects ambiguous options, does not overwrite ciphertext and never logs key identity", async () => {
  await temporary(async ({ directory, options }) => {
    const cli = (...args) => spawnSync(process.execPath, ["scripts/encrypt-openpgp-backup.mjs", ...args], { cwd: new URL("..", import.meta.url), encoding: "utf8", timeout: 30000 });
    const args = ["--input", options.inputPath, "--output", options.outputPath, "--recipient-file", options.recipientFile, "--expected-fingerprint", fingerprint, "--source-revision", sourceRevision];
    for (const extra of [[...args, "--unknown", "x"], [...args, "--input", "x"], args.slice(0, -2)]) {
      const result = cli(...extra); assert.equal(result.status, 1); assert.doesNotMatch(result.stdout + result.stderr, /test@example|Synthetic ECC|BEGIN PGP/);
    }
    assert.equal(cli(...args).status, 0);
    const saved = await readFile(options.outputPath);
    assert.equal(cli(...args).status, 1);
    assert.deepEqual(await readFile(options.outputPath), saved);
    const otherOutput = join(directory, "other.gpg");
    await writeFile(`${otherOutput}.json`, "preserve pre-existing sidecar");
    await assert.rejects(encryptBackup({ ...options, outputPath: otherOutput }), { code: "EEXIST" });
    await assert.rejects(stat(otherOutput), { code: "ENOENT" });
    assert.equal(await readFile(`${otherOutput}.json`, "utf8"), "preserve pre-existing sidecar");
    await assert.rejects(encryptBackup({ ...options, outputPath: join(directory, "missing-source.gpg"), sourceRevision: "main" }), /exact 40-hex/);
  });
});

test("6.3.3 loads the declared Node ECDSA dependency for brainpool and explicitly opted-in secp256k1; app policy stays narrow", async () => {
  assert.ok(openpgp.config.rejectCurves.has("secp256k1"), "the upstream default remains blocked");
  for (const curve of ["brainpoolP256r1", "secp256k1"]) {
    const testConfig = { ...config, rejectCurves: new Set([...config.rejectCurves].filter((name) => name !== "secp256k1")) };
    const key = await openpgp.generateKey({ type: "ecc", curve, userIDs: [{ name: "Synthetic dependency regression only" }], config: testConfig });
    const message = await openpgp.createMessage({ text: "Synthetic ECDSA dependency regression only" });
    const signature = await openpgp.sign({ message, signingKeys: await openpgp.readPrivateKey({ armoredKey: key.privateKey, config: testConfig }), detached: true, config: testConfig });
    const result = await openpgp.verify({ message, signature: await openpgp.readSignature({ armoredSignature: signature }), verificationKeys: await openpgp.readKey({ armoredKey: key.publicKey, config: testConfig }), config: testConfig });
    await result.signatures[0].verified;
    await assert.rejects(createPublicKeyring().importKeys(key.publicKey));
  }
});
