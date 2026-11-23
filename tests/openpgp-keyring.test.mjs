import assert from "node:assert/strict";
import { before, test } from "node:test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import * as openpgp from "openpgp";
import {
  KEY_COMPATIBILITY_CONFIG as config, MAX_KEYRING_BYTES, MAX_PUBLIC_KEYS,
  RSA_BITS, createOpenPgpKeyTools, generateCompatibilityKey,
  checkedPrivateDownload, createPublicKeyring, normalizeFingerprint, formatFingerprint,
} from "../apps/openpgp-workbench/keyring.mjs";

const passphrase = "synthetic test passphrase — never use";
let alice, bob;
before(async () => {
  [alice, bob] = await Promise.all(["A", "B"].map((name) => generateCompatibilityKey({
    name: `Synthetic test ${name} — do not use`, email: `${name.toLowerCase()}@example.invalid`,
    passphrase, expiryDays: 30,
  })));
});
const readPublic = (armored) => openpgp.readKey({ armoredKey: armored });
const concatenate = (arrays) => {
  const out = new Uint8Array(arrays.reduce((sum, array) => sum + array.length, 0));
  let offset = 0;
  for (const array of arrays) { out.set(array, offset); offset += array.length; }
  return out;
};
async function combinedBlock(...armors) {
  const keys = await Promise.all(armors.map(readPublic));
  return openpgp.armor(openpgp.enums.armor.publicKey, concatenate(keys.map((key) => key.write())));
}

test("key generation is explicitly v4 RSA-3072 with protected primary and encryption subkey", async () => {
  assert.equal(config.v6Keys, false); assert.equal(config.aeadProtect, false);
  assert.equal(config.s2kType, openpgp.enums.s2k.iterated);
  assert.equal(config.s2kIterationCountByte, 0xff);
  assert.equal(config.ignoreMalformedPackets, false); assert.equal(config.ignoreUnsupportedPackets, false);
  assert.equal(RSA_BITS, 3072);
  const privateKey = await openpgp.readPrivateKey({ armoredKey: alice.privateKey });
  const publicKey = await readPublic(alice.publicKey);
  assert.equal(privateKey.isDecrypted(), false);
  assert.equal(privateKey.getKeys().length, 2);
  for (const { keyPacket } of privateKey.getKeys()) {
    assert.equal(keyPacket.version, 4);
    assert.equal(keyPacket.getAlgorithmInfo().bits, 3072);
    assert.equal(keyPacket.s2kUsage, 254);
    assert.equal(keyPacket.symmetric, openpgp.enums.symmetric.aes256);
    assert.equal(keyPacket.s2k.type, "iterated");
    assert.equal(keyPacket.s2k.algorithm, openpgp.enums.hash.sha256);
    assert.equal(keyPacket.s2k.c, 0xff);
    assert.equal(keyPacket.s2k.getCount(), 65011712);
    assert.equal(keyPacket.privateParams, null);
  }
  assert.equal(publicKey.isPrivate(), false);
  assert.equal(publicKey.getFingerprint().toUpperCase(), alice.fingerprint);
  assert.equal(new Date(alice.expires) - new Date(alice.created), 30 * 86400000);
  assert.deepEqual(publicKey.getUserIDs(), ["Synthetic test A — do not use <a@example.invalid>"]);
  const selfCertification = publicKey.users[0].selfCertifications[0];
  assert.equal(selfCertification.hashAlgorithm, openpgp.enums.hash.sha256);
  assert.deepEqual(selfCertification.preferredHashAlgorithms, [openpgp.enums.hash.sha256, openpgp.enums.hash.sha384, openpgp.enums.hash.sha512]);
  assert.deepEqual(selfCertification.preferredSymmetricAlgorithms, [openpgp.enums.symmetric.aes256, openpgp.enums.symmetric.aes128]);
  assert.deepEqual(selfCertification.preferredCompressionAlgorithms, [openpgp.enums.compression.uncompressed]);
  assert.deepEqual(selfCertification.features, [openpgp.enums.features.modificationDetection]);
  await publicKey.verifyPrimaryKey(); // fresh serialized signatures, not the generator's cache
  assert.ok(await publicKey.getSigningKey());
  assert.ok(await publicKey.getEncryptionKey());
  assert.equal(publicKey.revocationSignatures.length, 0, "revocation is a separate sensitive export");
  assert.ok(Object.isFrozen(alice));
  assert.ok(!JSON.stringify(alice).includes(passphrase));
});

test("both generated secret packets unlock only with the test passphrase; downloads recheck protection and fingerprint", async () => {
  const encrypted = await openpgp.readPrivateKey({ armoredKey: alice.privateKey });
  await assert.rejects(openpgp.decryptKey({ privateKey: encrypted, passphrase: "wrong passphrase" }), /passphrase|decrypt/i);
  const unlocked = await openpgp.decryptKey({ privateKey: encrypted, passphrase });
  try {
    assert.ok(unlocked.getKeys().every((part) => part.keyPacket.isDecrypted()));
    assert.equal(await checkedPrivateDownload(alice.privateKey, formatFingerprint(alice.fingerprint)), alice.privateKey);
    await assert.rejects(checkedPrivateDownload(unlocked.armor(), alice.fingerprint), /Refusing a private download/);
    await assert.rejects(checkedPrivateDownload(alice.privateKey, bob.fingerprint), /fingerprint mismatch/);
    await assert.rejects(checkedPrivateDownload(alice.privateKey + bob.privateKey, alice.fingerprint), /exactly one/);
    await assert.rejects(checkedPrivateDownload(alice.publicKey, alice.fingerprint), /exactly one/);
    const appended = concatenate([encrypted.write(), Uint8Array.of(0xfd, 0)]);
    await assert.rejects(checkedPrivateDownload(openpgp.armor(openpgp.enums.armor.privateKey, appended), alice.fingerprint), /unsupported/);
  } finally { unlocked.clearPrivateParams(); }
});

test("only full fingerprints are accepted, with whitespace grouping but no short IDs or lookalike characters", () => {
  assert.equal(normalizeFingerprint(alice.fingerprint.toLowerCase()), alice.fingerprint);
  assert.equal(normalizeFingerprint(formatFingerprint(alice.fingerprint)), alice.fingerprint);
  for (const value of [alice.fingerprint.slice(-16), alice.fingerprint.slice(-8), "0x" + alice.fingerprint, "G".repeat(40), "Ａ".repeat(40), "a".repeat(64), null, "x".repeat(129)]) assert.throws(() => normalizeFingerprint(value));
});

test("generation rejects missing/inferred identity, weak or oversized inputs and unbounded expiry before any generation", async () => {
  let calls = 0;
  const tools = createOpenPgpKeyTools({ ...openpgp, generateKey: () => { calls++; throw new Error("must not generate"); } });
  const valid = { name: "Synthetic alias", passphrase, expiryDays: 730 };
  for (const patch of [
    { name: "" }, { name: "x".repeat(129) }, { name: "new\nuser" }, { name: "<spoof>" }, { name: "left\u202eright" },
    { email: "not-an-address" }, { passphrase: "" }, { passphrase: "short" }, { passphrase: " ".repeat(20) },
    { passphrase: "é".repeat(2049) }, { expiryDays: 0 }, { expiryDays: 29 }, { expiryDays: 3651 }, { expiryDays: 1.5 }, { expiryDays: NaN },
  ]) await assert.rejects(tools.generateCompatibilityKey({ ...valid, ...patch }));
  assert.equal(calls, 0);
});

test("public imports read all certificates in one armor block AND concatenated blocks, never silently just the first", async () => {
  for (const input of [await combinedBlock(alice.publicKey, bob.publicKey), alice.publicKey + "\n" + bob.publicKey]) {
    const ring = createPublicKeyring();
    const entries = await ring.importKeys(input);
    assert.deepEqual(entries.map((entry) => entry.fingerprint), [alice.fingerprint, bob.fingerprint]);
    const exported = ring.exportKeys();
    assert.equal((exported.match(/BEGIN PGP PUBLIC KEY BLOCK/g) || []).length, 2);
    assert.doesNotMatch(exported, /PRIVATE KEY/);
    const roundtrip = createPublicKeyring();
    assert.deepEqual(await roundtrip.importKeys(exported), entries);
    const snapshot = ring.list(); snapshot[0].userIDs[0] = "tampered"; snapshot.pop();
    assert.equal(ring.list().length, 2); assert.notEqual(ring.list()[0].userIDs[0], "tampered");
    assert.equal((await ring.importKeys(alice.publicKey)).length, 2, "identical certificate deduplicates");
    assert.equal(ring.remove(bob.fingerprint), true);
    assert.equal(ring.list().length, 1);
    ring.clear(); assert.equal(ring.list().length, 0); assert.throws(() => ring.exportKeys(), /empty/);
  }
});

test("expected-fingerprint mismatch and multiple-certificate ambiguity are atomic failures", async () => {
  const ring = createPublicKeyring();
  await assert.rejects(ring.importKeys(alice.publicKey, { expectedFingerprint: bob.fingerprint }), /Fingerprint mismatch/);
  await assert.rejects(ring.importKeys(await combinedBlock(alice.publicKey, bob.publicKey), { expectedFingerprint: alice.fingerprint }), /multiple certificates/);
  assert.equal(ring.list().length, 0);
  await ring.importKeys(alice.publicKey, { expectedFingerprint: alice.fingerprint });
  const saved = ring.exportKeys();
  await assert.rejects(ring.importKeys(bob.publicKey, { expectedFingerprint: "BAD" }), /full 40/);
  assert.equal(ring.exportKeys(), saved);
});

test("private/mixed/disguised/orphan secret packets, messages and truncated blocks never enter a public keyring", async () => {
  const secret = await openpgp.readPrivateKey({ armoredKey: bob.privateKey });
  const orphan = new openpgp.PacketList(); orphan.push(secret.subkeys[0].keyPacket);
  const message = await openpgp.createMessage({ text: "not a public key" });
  const publicBytes = (await readPublic(bob.publicKey)).write();
  const inputs = [
    bob.privateKey, bob.privateKey.replaceAll("PRIVATE KEY BLOCK", "PUBLIC KEY BLOCK"),
    alice.publicKey + bob.privateKey, "preface " + bob.publicKey, bob.publicKey + " trailer", "",
    openpgp.armor(openpgp.enums.armor.publicKey, concatenate([orphan.write(), publicBytes])),
    openpgp.armor(openpgp.enums.armor.publicKey, concatenate([publicBytes, orphan.write()])),
    openpgp.armor(openpgp.enums.armor.publicKey, concatenate([publicBytes, message.write()])),
    openpgp.armor(openpgp.enums.armor.publicKey, concatenate([publicBytes, Uint8Array.of(0xc6, 0xff)])),
    bob.publicKey.replace("-----END PGP PUBLIC KEY BLOCK-----", ""),
    "-----BEGIN PGP PUBLIC KEY BLOCK-----\n".repeat(5000),
    openpgp.armor(openpgp.enums.armor.publicKey, concatenate([publicBytes, Uint8Array.of(0xfd, 0)])),
  ];
  const ring = createPublicKeyring(); await ring.importKeys(alice.publicKey);
  const saved = ring.exportKeys();
  for (const input of inputs) {
    await assert.rejects(ring.importKeys(input));
    assert.equal(ring.exportKeys(), saved, "failed batch preserves previous public-only state");
  }
});

test("size/key-count/algorithm limits are enforced without changing the ring", async () => {
  const ring = createPublicKeyring();
  await assert.rejects(ring.importKeys("x".repeat(MAX_KEYRING_BYTES + 1)), /1,048,576-byte limit/);
  await assert.rejects(ring.importKeys("é".repeat(MAX_KEYRING_BYTES / 2 + 1)), /limit/);
  await assert.rejects(ring.importKeys(Array(MAX_PUBLIC_KEYS + 1).fill(alice.publicKey).join("\n")), /At most 32/);
  const ecc = await openpgp.generateKey({ type: "ecc", curve: "nistP256", userIDs: [{ name: "Synthetic unsupported key" }] });
  await assert.rejects(ring.importKeys(ecc.publicKey), /only v4 RSA/);
  assert.equal(ring.list().length, 0);
});

test("revocation export revokes the matching public certificate; changed same-fingerprint data requires explicit review", async () => {
  const { publicKey: revoked } = await openpgp.revokeKey({ key: await readPublic(alice.publicKey), revocationCertificate: alice.revocationCertificate });
  assert.equal(await (await readPublic(revoked)).isRevoked(), true);
  const ring = createPublicKeyring(); await ring.importKeys(alice.publicKey);
  const saved = ring.exportKeys();
  await assert.rejects(ring.importKeys(revoked), /different data/);
  assert.equal(ring.exportKeys(), saved, "updates/revocations are not silently lost in a dedupe");
  ring.remove(alice.fingerprint);
  const [entry] = await ring.importKeys(revoked);
  assert.match(entry.selfCertification, /unusable: revoked, expired or invalid/);
  assert.match(entry.selfCertification, /archival export only/);
});

test("clear, AbortSignal and concurrent mutations cannot silently resurrect a pending import", async () => {
  const ring = createPublicKeyring();
  const controller = new AbortController();
  const pending = ring.importKeys(alice.publicKey, { signal: controller.signal }); controller.abort();
  await assert.rejects(pending, { name: "AbortError" }); assert.equal(ring.list().length, 0);
  const pendingClear = ring.importKeys(bob.publicKey); ring.clear();
  await assert.rejects(pendingClear, /changed while importing/); assert.equal(ring.list().length, 0);
  const outcomes = await Promise.allSettled([ring.importKeys(alice.publicKey), ring.importKeys(bob.publicKey)]);
  assert.equal(outcomes.filter((entry) => entry.status === "fulfilled").length, 1);
  assert.equal(ring.list().length, 1, "the conflicting operation must be retried explicitly");
});

test("the actual vendored browser module implements the same key-generation/export profile", async () => {
  const browserLibrary = await import("../public/apps/openpgp-workbench/vendor/openpgp.min.mjs");
  const tools = createOpenPgpKeyTools(browserLibrary);
  const bundle = await tools.generateCompatibilityKey({ name: "Synthetic browser-module test — do not use", passphrase, expiryDays: 30 });
  assert.equal(await tools.checkedPrivateDownload(bundle.privateKey, bundle.fingerprint), bundle.privateKey);
  const ring = tools.createPublicKeyring();
  assert.equal((await ring.importKeys(alice.publicKey + bundle.publicKey)).length, 2);
  assert.equal((await createPublicKeyring().importKeys(ring.exportKeys())).length, 2);
});

test("pinned source provenance is retained independently of ephemeral caches and the library stays unmodified", () => {
  const manifest = JSON.parse(readFileSync(new URL("../docs/research/openpgp-source-manifest-2026-11-17.json", import.meta.url)));
  assert.equal(manifest.upstreams.length, 9); assert.equal(manifest.files.length, 40);
  const commits = new Map(manifest.upstreams.map((entry) => [entry.repo, entry.commit]));
  for (const file of manifest.files) {
    assert.match(file.commit, /^[0-9a-f]{40}$/); assert.equal(file.commit, commits.get(file.repo));
    assert.match(file.sha256, /^[0-9a-f]{64}$/);
    assert.ok(file.url.includes(`/blob/${file.commit}/${file.path}`));
    assert.ok(file.reviewedSections.length > 0 && file.bytes > 0);
  }
  const lock = JSON.parse(readFileSync(new URL("../package-lock.json", import.meta.url)));
  assert.equal(lock.packages["node_modules/openpgp"].version, manifest.dependency.version);
  assert.equal(lock.packages["node_modules/openpgp"].integrity, manifest.dependency.npmIntegrity);
  const update = JSON.parse(readFileSync(new URL("../docs/research/openpgp-dependency-update-2026-11-17.json", import.meta.url)));
  assert.equal(update.release.commit, "804cf464668fa088e20f7d3fe4501e39aa4cd4e1");
  assert.equal(update.nodeHelper.version, lock.packages["node_modules/eckey-utils"].version);
  assert.equal(update.nodeHelper.integrity, lock.packages["node_modules/eckey-utils"].integrity);
  assert.equal(createHash("sha256").update(readFileSync(new URL("../node_modules/eckey-utils/index.js", import.meta.url))).digest("hex"), update.nodeHelper.installedEntrypoint.sha256);
  for (const file of update.files) {
    assert.equal(file.commit, update.release.commit); assert.match(file.sha256, /^[a-f0-9]{64}$/);
    assert.ok(file.url.includes(`/blob/${file.commit}/${file.path}`) && file.bytes > 0 && file.reviewedSections.length);
  }
  const bytes = readFileSync(new URL("../public/apps/openpgp-workbench/vendor/openpgp.min.mjs", import.meta.url));
  assert.equal(createHash("sha256").update(bytes).digest("hex"), manifest.dependency.browserBundleSha256);
});

test("generated public app mirrors the reviewed modules; no private material or app network/storage API is shipped", () => {
  for (const file of ["index.html", "app.js", "crypto.mjs", "keyring.mjs", "styles.css"]) {
    const source = readFileSync(new URL(`../apps/openpgp-workbench/${file}`, import.meta.url), "utf8");
    assert.equal(readFileSync(new URL(`../public/apps/openpgp-workbench/${file}`, import.meta.url), "utf8"), source, `${file} stale; rebuild`);
    if (file.endsWith(".mjs") || file.endsWith(".js")) assert.doesNotMatch(source, /\b(?:fetch|XMLHttpRequest|WebSocket|localStorage|sessionStorage|indexedDB|sendBeacon)\b/);
  }
});
