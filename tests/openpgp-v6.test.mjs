import assert from "node:assert/strict";
import { before, test } from "node:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as openpgp from "openpgp";
import {
  KEY_COMPATIBILITY_CONFIG as classic, createOpenPgpKeyTools,
  normalizeFingerprint, normalizePublicFingerprint, formatFingerprint,
} from "../apps/openpgp-workbench/keyring.mjs";
import { encryptBackup } from "../scripts/encrypt-openpgp-backup.mjs";

// Synthetic keys only. These tests do not use or publish the owner's key.
const modern = { ...classic, v6Keys: true, aeadProtect: true };
let generated, publicKey, fingerprint, encryptionFingerprint;
before(async () => {
  generated = await openpgp.generateKey({
    type: "curve25519", userIDs: [{ name: "Synthetic v6 compatibility test only" }],
    subkeys: [{ sign: false }, { sign: true }, { sign: false }], config: modern,
  });
  publicKey = await openpgp.readKey({ armoredKey: generated.publicKey });
  fingerprint = publicKey.getFingerprint().toUpperCase();
  encryptionFingerprint = publicKey.subkeys[0].getFingerprint().toUpperCase();
});
const toolsForBoth = async () => [openpgp, await import("../public/apps/openpgp-workbench/vendor/openpgp.min.mjs")]
  .map((library) => ({ library, tools: createOpenPgpKeyTools(library) }));

// Deliberately unsupported algorithm fixtures, NOT valid cryptographic keys.
// Only the explicit subset exporter may discard these PUBLIC subkey blocks.
class UnsupportedPublicSubkey {
  static tag = 14;
  constructor(algorithm = 35) { this.algorithm = algorithm; }
  write() { return Uint8Array.of(6, 0, 0, 0, 1, this.algorithm, 0, 0, 0, 4, 1, 2, 3, 4); }
}
class UnsupportedSignature {
  static tag = 2;
  constructor(type = 24) { this.type = type; }
  write() {
    const raw = Uint8Array.from(publicKey.subkeys[0].bindingSignatures[0].write());
    raw[1] = this.type; raw[2] = 35; // Deliberately invalid/unsupported fixture.
    return raw;
  }
}
class UnknownPacket {
  static tag = 61;
  write() { return new Uint8Array(); }
}
class MalformedSupportedSubkey {
  static tag = 14;
  write() { return Uint8Array.of(6, 0, 0, 0, 1, 25); }
}
const armorPackets = (packets) => openpgp.armor(openpgp.enums.armor.publicKey, packets.write());

async function withUnsupportedSubkeys() {
  const packets = (await openpgp.readKey({ armoredKey: generated.publicKey })).toPacketList();
  for (const algorithm of [35, 30, 36, 31]) packets.push(new UnsupportedPublicSubkey(algorithm), new UnsupportedSignature());
  return armorPackets(packets);
}

test("public v6 fingerprint support is separate from conservative v4 secret export/generation", () => {
  assert.equal(fingerprint.length, 64);
  assert.equal(normalizePublicFingerprint(formatFingerprint(fingerprint.toLowerCase())), fingerprint);
  assert.equal(normalizePublicFingerprint("a".repeat(40)), "A".repeat(40));
  assert.throws(() => normalizeFingerprint(fingerprint), /40-hex/);
  for (const value of ["", null, fingerprint.slice(0, 16), "a".repeat(63), "a".repeat(65), "0x" + fingerprint, "Ａ".repeat(64)]) assert.throws(() => normalizePublicFingerprint(value));
  assert.equal(classic.v6Keys, false); assert.equal(classic.aeadProtect, false);
  assert.equal(classic.ignoreUnsupportedPackets, false); assert.equal(classic.ignoreMalformedPackets, false);
});

test("both shipped distributions import v6 Ed25519/X25519, detect a bound encryption key, preserve all supported roles, and never silently downgrade", async () => {
  for (const { tools } of await toolsForBoth()) {
    const ring = tools.createPublicKeyring();
    const [entry] = await ring.importKeys(generated.publicKey, { expectedFingerprint: formatFingerprint(fingerprint) });
    assert.equal(entry.keyVersion, 6); assert.equal(entry.subkeyCount, 3);
    assert.match(entry.algorithm, /v6 Ed25519 \/ X25519/);
    assert.match(entry.selfCertification, /^valid/);
    assert.equal(entry.encryptionFingerprint.length, 64);
    assert.equal((await openpgp.readKey({ armoredKey: ring.exportCertificate(fingerprint) })).subkeys.length, 3);
    await assert.rejects(tools.readEncryptionRecipient(ring.exportKeys(), fingerprint), /explicit backup profile/);
    const recipient = await tools.readEncryptionRecipient(ring.exportKeys(), fingerprint, { profile: "modern-v6", encryptionFingerprint });
    assert.equal(recipient.encryptionFingerprint, encryptionFingerprint);
    await assert.rejects(tools.readEncryptionRecipient(ring.exportKeys(), fingerprint, { profile: "modern-v6", encryptionFingerprint: publicKey.subkeys[1].getFingerprint() }));
    await assert.rejects(tools.readEncryptionRecipient(ring.exportKeys(), fingerprint, { profile: "modern-v6", encryptionFingerprint: "0".repeat(64) }));
    await assert.rejects(tools.readEncryptionRecipient(ring.exportKeys(), fingerprint, { profile: "automatic" }));
    await assert.rejects(tools.checkedPrivateDownload(generated.privateKey, fingerprint), /40-hex/);
    assert.equal(ring.remove(fingerprint), true); assert.equal(ring.list().length, 0);
  }
});

test("unsupported public algorithms are never silently imported; explicit full/reduced exports keep the original and only one validated encryption subkey", async () => {
  const original = "\n" + await withUnsupportedSubkeys() + "\n";
  for (const { tools } of await toolsForBoth()) {
    const ring = tools.createPublicKeyring();
    await assert.rejects(ring.importKeys(original), /[Uu]nsupported/);
    assert.equal(ring.list().length, 0);
    const variants = await tools.publicCertificateVariants(original, fingerprint, { profile: "modern-v6", encryptionFingerprint });
    assert.equal(variants.full, original, "full export must not rearmor via a parser that discards unknown subkeys");
    assert.deepEqual(variants.unsupportedSubkeys.map((item) => item.algorithm), [35, 30, 36, 31]);
    assert.equal(variants.removedSubkeyFingerprints.length, 2);
    assert.equal(variants.keyVersion, 6);
    assert.equal(variants.fingerprint, fingerprint);
    assert.equal(variants.encryptionFingerprint, encryptionFingerprint);
    assert.doesNotMatch(variants.reduced, /PRIVATE KEY/);
    const reduced = await openpgp.readKey({ armoredKey: variants.reduced, config: modern });
    assert.equal(reduced.keyPacket.version, 6);
    assert.equal(reduced.subkeys.length, 1);
    assert.deepEqual(reduced.keyPacket.write(), publicKey.keyPacket.write());
    assert.deepEqual(reduced.subkeys[0].keyPacket.write(), publicKey.subkeys[0].keyPacket.write());
    assert.deepEqual(reduced.subkeys[0].bindingSignatures.map((sig) => sig.write()), publicKey.subkeys[0].bindingSignatures.map((sig) => sig.write()));
    assert.equal((await ring.importKeys(variants.reduced, { expectedFingerprint: fingerprint }))[0].encryptionFingerprint, encryptionFingerprint);
    await assert.rejects(tools.publicCertificateVariants(original, "0".repeat(64), { profile: "modern-v6" }));
    await assert.rejects(tools.publicCertificateVariants(original, fingerprint), /explicit backup profile/);
  }
});

test("explicit reduction refuses secret/mixed/bundled/malformed material and unsupported packets outside an omitted public subkey block", async () => {
  const { tools } = (await toolsForBoth())[0];
  const secret = await openpgp.readPrivateKey({ armoredKey: generated.privateKey });
  const inputs = [
    generated.privateKey, generated.privateKey.replaceAll("PRIVATE KEY BLOCK", "PUBLIC KEY BLOCK"),
    generated.publicKey + generated.privateKey, generated.publicKey + generated.publicKey,
    "preface " + generated.publicKey, generated.publicKey.replace("-----END PGP PUBLIC KEY BLOCK-----", ""),
  ];
  for (const extra of [secret.subkeys[0].keyPacket, new UnknownPacket(), new MalformedSupportedSubkey()]) {
    const packets = (await openpgp.readKey({ armoredKey: generated.publicKey })).toPacketList();
    packets.push(new UnsupportedPublicSubkey(), new UnsupportedSignature(), extra);
    inputs.push(armorPackets(packets));
  }
  const hiddenGlobal = (await openpgp.readKey({ armoredKey: generated.publicKey })).toPacketList();
  hiddenGlobal.push(new UnsupportedPublicSubkey(), new UnsupportedSignature(32)); inputs.push(armorPackets(hiddenGlobal));
  const unsupportedSignature = (await openpgp.readKey({ armoredKey: generated.publicKey })).toPacketList();
  unsupportedSignature.push(new UnsupportedSignature()); inputs.push(armorPackets(unsupportedSignature));
  const bundle = new openpgp.PacketList(); bundle.push(...publicKey.toPacketList(), ...publicKey.toPacketList()); inputs.push(armorPackets(bundle));
  for (const input of inputs) await assert.rejects(tools.publicCertificateVariants(input, fingerprint, { profile: "modern-v6" }));
});

test("v6 revoked, expired, unbound and signing-only material cannot become a backup recipient or reduced usable export", async () => {
  const { tools } = (await toolsForBoth())[0];
  const expired = await openpgp.generateKey({ type: "curve25519", userIDs: [{ name: "Synthetic expired v6" }], date: new Date("2000-01-01T00:00:00Z"), keyExpirationTime: 3600, config: modern });
  const signing = await openpgp.generateKey({ type: "curve25519", userIDs: [{ name: "Synthetic signing-only v6" }], subkeys: [], config: modern });
  const revoked = await openpgp.revokeKey({ key: publicKey, revocationCertificate: generated.revocationCertificate, config: modern });
  const unbound = await openpgp.readKey({ armoredKey: generated.publicKey });
  unbound.subkeys = unbound.subkeys.filter((part) => part.getAlgorithmInfo().algorithm === "x25519");
  for (const part of unbound.subkeys) part.bindingSignatures = [];
  for (const armor of [expired.publicKey, signing.publicKey, revoked.publicKey, unbound.armor()]) {
    const expected = (await openpgp.readKey({ armoredKey: armor })).getFingerprint();
    await assert.rejects(tools.readEncryptionRecipient(armor, expected, { profile: "modern-v6" }));
    await assert.rejects(tools.publicCertificateVariants(armor, expected, { profile: "modern-v6" }));
  }
  const [entry] = await tools.createPublicKeyring().importKeys(signing.publicKey);
  assert.equal(entry.encryptionFingerprint, null, "signing/authentication is not a decryption keystream");
});

test("a valid primary revocation placed after an unsupported subkey cannot be stripped into a usable certificate", async () => {
  const revoked = await openpgp.revokeKey({ key: publicKey, revocationCertificate: generated.revocationCertificate, config: modern });
  const revocations = (await openpgp.readKey({ armoredKey: revoked.publicKey })).revocationSignatures;
  const packets = (await openpgp.readKey({ armoredKey: generated.publicKey })).toPacketList();
  packets.push(new UnsupportedPublicSubkey(), new UnsupportedSignature(), ...revocations);
  for (const { tools } of await toolsForBoth()) {
    await assert.rejects(tools.publicCertificateVariants(armorPackets(packets), fingerprint, { profile: "modern-v6" }), /revoked/i);
  }
});

test("streamed modern backup uses one full-fingerprint v6 PKESK and SEIPDv2/AEAD; both JS distributions recover exact synthetic bytes and reject tampering", async () => {
  const directory = await mkdtemp(join(tmpdir(), "html5-v6-synthetic-"));
  try {
    const inputPath = join(directory, "synthetic.bin"), outputPath = inputPath + ".gpg", recipientFile = join(directory, "public.asc");
    const plaintext = Buffer.concat([Buffer.from("Synthetic v6 binary backup only\0\xff"), Buffer.alloc(2_100_000, 0xa5)]);
    await writeFile(inputPath, plaintext); await writeFile(recipientFile, generated.publicKey);
    const options = { inputPath, outputPath, recipientFile, expectedFingerprint: fingerprint, sourceRevision: "a".repeat(40) };
    await assert.rejects(encryptBackup(options), /explicit backup profile/);
    const receipt = await encryptBackup({ ...options, profile: "modern-v6" });
    const ciphertext = await readFile(outputPath);
    const message = await openpgp.readMessage({ binaryMessage: ciphertext });
    assert.equal(receipt.profile, "modern-v6");
    assert.equal(receipt.packetProfile.pkeskVersion, 6); assert.equal(receipt.packetProfile.seipdVersion, 2);
    assert.equal(message.packets.length, 2);
    assert.equal(Buffer.from(message.packets[0].publicKeyFingerprint).toString("hex").toUpperCase(), receipt.encryptionFingerprint);
    assert.ok([openpgp.enums.aead.eax, openpgp.enums.aead.ocb, openpgp.enums.aead.gcm].includes(message.packets[1].aeadAlgorithm));
    for (const { library } of await toolsForBoth()) {
      const decryptionKeys = await library.readPrivateKey({ armoredKey: generated.privateKey });
      const recovered = await library.decrypt({ message: await library.readMessage({ binaryMessage: ciphertext }), decryptionKeys, format: "binary" });
      assert.deepEqual(Buffer.from(recovered.data), plaintext); assert.equal(recovered.signatures.length, 0);
      const altered = Buffer.from(ciphertext); altered[altered.length - 12] ^= 1;
      await assert.rejects(library.decrypt({ message: await library.readMessage({ binaryMessage: altered }), decryptionKeys, format: "binary" }));
    }
    await assert.rejects(encryptBackup({ ...options, profile: "modern-v6" }), { code: "EEXIST" });
    assert.deepEqual(await readFile(outputPath), ciphertext);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
