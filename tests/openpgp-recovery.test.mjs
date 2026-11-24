/** Synthetic, ephemeral owner-recovery controls; never production secrets. */
import assert from "node:assert/strict";
import { before, test } from "node:test";
import { readFileSync } from "node:fs";
import * as pgp from "openpgp";
import { buildRecoveryPlan, checkedRecoveryArmor, checkedRecoveryCandidates, createPrivateKeyRecoveryTools,
  normalizeRecoveryFingerprint, RecoveryError, RECOVERY_LIMITS } from "../apps/openpgp-workbench/recovery.mjs";

const secret = " Synthetic café 🔐 Passphrase ";
// Faster test-only S2K, never the production generation/export configuration.
const config = { v6Keys: false, s2kIterationCountByte: 96 };
let v4, rsa, v6, ae4, plain, fingerprint;
const values = (plan) => plan.candidates.map((candidate) => candidate.value);
const code = (expected) => (error) => error instanceof RecoveryError && error.code === expected;
const armor = (packets) => pgp.armor(pgp.enums.armor.privateKey, packets.write());
const both = async () => [pgp, await import("../public/apps/openpgp-workbench/vendor/openpgp.min.mjs")];
before(async () => {
  [v4, rsa, v6, ae4, plain] = await Promise.all([
    pgp.generateKey({ type: "ecc", curve: "curve25519Legacy", userIDs: [{ name: "Synthetic recovery ECC only" }], passphrase: secret, config }),
    pgp.generateKey({ type: "rsa", rsaBits: 2048, userIDs: [{ name: "Synthetic recovery RSA only" }], passphrase: secret, config }),
    pgp.generateKey({ type: "curve25519", userIDs: [{ name: "Synthetic recovery v6 only" }], passphrase: secret, config: { ...config, v6Keys: true, aeadProtect: true } }),
    pgp.generateKey({ type: "ecc", curve: "curve25519Legacy", userIDs: [{ name: "Synthetic recovery standard AEAD v4 only" }], passphrase: secret, config: { ...config, aeadProtect: true } }),
    pgp.generateKey({ type: "ecc", curve: "curve25519Legacy", userIDs: [{ name: "Synthetic unprotected negative only" }], config }),
  ]);
  fingerprint = (await pgp.readPrivateKey({ armoredKey: v4.privateKey })).getFingerprint().toUpperCase();
});

test("ranking is bounded OSA distance, stable, case/NFC-folded only for comparison; actual candidate bytes never change", () => {
  const wordlist = "cut\ncat\ncta\ncats\ncat\n dog \nCAT\n";
  const plan = buildRecoveryPlan({ wordlist, hint: "cat", maxDistance: 1 });
  assert.deepEqual(values(plan), ["cat", "CAT", "cut", "cta", "cats"]);
  assert.equal(plan.inputEntries, 7); assert.equal(plan.duplicateEntries, 1); assert.equal(plan.matchedEntries, 5); assert.equal(plan.excludedEntries, 1);
  assert.deepEqual(values(buildRecoveryPlan({ wordlist: "\n".repeat(2000) + "a" })), ["a"], "blank lines remain ignored within the byte cap");
  assert.deepEqual(plan.candidates.map((entry) => entry.distance), [0, 0, 1, 1, 1]);
  assert.deepEqual(values(buildRecoveryPlan({ wordlist, hint: "cat", maxDistance: 0 })), ["cat", "CAT"]);
  assert.deepEqual(values(buildRecoveryPlan({ wordlist: " café \ncafe\u0301\ncafé", hint: "CAFÉ", maxDistance: 0 })), ["cafe\u0301", "café"]);
  assert.deepEqual(values(buildRecoveryPlan({ wordlist: " z \r\na\r\n\na\n\ufeffx" })), [" z ", "a", "\ufeffx"]);
  assert.ok(Object.isFrozen(plan) && Object.isFrozen(plan.candidates) && plan.candidates.every(Object.isFrozen));
});

test("one-step typo variants are explicit, deduplicated and previewed; no arbitrary alphabet/range expansion", () => {
  const original = buildRecoveryPlan({ wordlist: "café\ncafé", hint: "cafe", maxDistance: 2 });
  assert.deepEqual(values(original), ["café"]); assert.equal(original.includedVariants, 0);
  const plan = buildRecoveryPlan({ hint: "cat", variants: true });
  for (const candidate of ["cat", "CAT", "Cat", "at", "ct", "ca", "ccat", "caat", "catt", "act", "cta"]) assert.ok(values(plan).includes(candidate));
  for (const candidate of ["cat0", "cats", "bat", "c", "cact", "cat2026"]) assert.ok(!values(plan).includes(candidate));
  assert.equal(plan.total, new Set(values(plan)).size);
  assert.ok(plan.candidates.every((entry) => entry.distance <= 2));
  assert.throws(() => buildRecoveryPlan({ hint: "cat" }), code("EMPTY"), "hint is attempted only with the explicit variant opt-in");
  assert.throws(() => buildRecoveryPlan({ wordlist: "faraway", hint: "cat", maxDistance: 2 }), code("EMPTY"));
});

test("the 256-candidate cap preserves every ranked base entry first and reports omitted variants deterministically", () => {
  const entries = Array.from({ length: 256 }, (_, i) => `candidate-${i}`);
  const plan = buildRecoveryPlan({ wordlist: entries.join("\n"), variants: true });
  assert.equal(plan.total, 256); assert.deepEqual(values(plan), entries);
  assert.ok(plan.generatedVariants > 0); assert.equal(plan.includedVariants, 0); assert.equal(plan.omittedVariants, plan.generatedVariants);
  assert.deepEqual(buildRecoveryPlan({ wordlist: entries.join("\n"), variants: true }), plan);
  const unicode = buildRecoveryPlan({ wordlist: "🔐ab", variants: true });
  assert.ok(values(unicode).includes("a🔐b"));
  assert.ok(values(unicode).every((value) => !/[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/u.test(value)));
});

test("input/entry/Unicode/byte/count limits and full fingerprints fail before any attempt; empty candidates are not guessed", () => {
  for (const input of [
    { wordlist: "a".repeat(129) }, { wordlist: "a".repeat(257) }, { wordlist: "🔐".repeat(65) }, { wordlist: "x\u0000y" }, { wordlist: "a\rb" },
    { wordlist: "a\u2028b" }, { wordlist: "a\u2029b" },
    { wordlist: "a\t" }, { wordlist: "\u202e" }, { hint: "\ud800", variants: true },
    { wordlist: "x".repeat(RECOVERY_LIMITS.wordlistBytes + 1) },
    { wordlist: Array.from({ length: 257 }, (_, i) => String(i)).join("\n") }, { wordlist: "a\n".repeat(1025) },
    { wordlist: "x", maxDistance: 3 }, { wordlist: "x", maxDistance: "1" }, { wordlist: "x", variants: "yes" },
  ]) assert.throws(() => buildRecoveryPlan(input), code("INPUT"));
  for (const candidates of [[], Array(257).fill("a"), [""], ["a", "a"], [null], ["a\n"]]) assert.throws(() => checkedRecoveryCandidates(candidates), code("INPUT"));
  assert.deepEqual(checkedRecoveryCandidates([" a ", "a"]), [" a ", "a"]);
  assert.equal(normalizeRecoveryFingerprint("a".repeat(40).match(/.{4}/g).join(" ")), "A".repeat(40));
  assert.equal(normalizeRecoveryFingerprint("b".repeat(64)), "B".repeat(64));
  for (const value of [null, "", "a".repeat(16), "a".repeat(63), "a".repeat(65), "0x" + "a".repeat(40), "Ａ".repeat(40)]) assert.throws(() => normalizeRecoveryFingerprint(value), code("FINGERPRINT"));
});

test("both library distributions inspect without trying guesses and exactly unlock protected v4 RSA/ECC and standard v4/v6 AEAD", async () => {
  for (const library of await both()) for (const [bundle, expectedProfile] of [[rsa, "v4-rsa"], [v4, "v4-25519"], [ae4, "v4-25519"], [v6, "v6-25519"]]) {
    const original = bundle.privateKey, tools = createPrivateKeyRecoveryTools(library), identity = await tools.inspectProtectedKey(original);
    assert.equal(identity.profile, expectedProfile); assert.equal(identity.secretPackets, 2);
    assert.equal(identity.fingerprint.length, identity.version === 4 ? 40 : 64);
    assert.deepEqual(Object.keys(identity).sort(), ["fingerprint", "profile", "secretPackets", "version"]);
    const progress = [], candidates = [secret.trim(), secret.normalize("NFD"), secret];
    const result = await tools.recoverProtectedKey(original, identity.fingerprint.toLowerCase(), candidates, { onProgress: (value) => progress.push(value) });
    assert.deepEqual(result, { status: "matched", index: 2, attempted: 3, total: 3, fingerprint: identity.fingerprint, secretPackets: 2 });
    assert.deepEqual(progress, [1, 2, 3].map((attempted) => ({ attempted, total: 3 })));
    assert.deepEqual(candidates, [secret.trim(), secret.normalize("NFD"), secret], "caller's inputs are not changed");
    const protectedAgain = await library.readPrivateKey({ armoredKey: original });
    assert.ok(protectedAgain.getKeys().every(({ keyPacket }) => !keyPacket.isDecrypted() && keyPacket.privateParams === null));
    assert.equal(original, bundle.privateKey); assert.ok(!JSON.stringify(result).includes(secret));
  }
});

test("near candidates and mixed per-packet passphrases do not report success or partial matches", async () => {
  const tools = createPrivateKeyRecoveryTools(pgp);
  const result = await tools.recoverProtectedKey(v4.privateKey, fingerprint, [secret.trim(), secret.toUpperCase()]);
  assert.deepEqual(result, { status: "not-found", attempted: 2, total: 2, fingerprint, secretPackets: 2 });
  const unlocked = await pgp.decryptKey({ privateKey: await pgp.readPrivateKey({ armoredKey: v4.privateKey }), passphrase: secret });
  let protectedKey;
  try {
    protectedKey = await pgp.encryptKey({ privateKey: unlocked, passphrase: [secret, "Synthetic different subkey passphrase"], config });
    assert.equal((await tools.recoverProtectedKey(protectedKey.armor(), fingerprint, [secret, "Synthetic different subkey passphrase"])).status, "not-found");
  } finally { unlocked.clearPrivateParams(); protectedKey?.clearPrivateParams(); }
});

test("every secret packet is validated, not just the primary; a valid primary plus invalid private subkey never matches", async () => {
  const key = await pgp.decryptKey({ privateKey: await pgp.readPrivateKey({ armoredKey: rsa.privateKey }), passphrase: secret });
  let damaged;
  try {
    const params = key.subkeys[0].keyPacket.privateParams;
    assert.ok(params.d instanceof Uint8Array); params.d[Math.floor(params.d.length / 2)] ^= 1;
    await assert.rejects(key.subkeys[0].keyPacket.validate());
    damaged = await pgp.encryptKey({ privateKey: key, passphrase: secret, config });
    for (const library of await both()) {
      const tools = createPrivateKeyRecoveryTools(library), identity = await tools.inspectProtectedKey(damaged.armor());
      assert.equal((await tools.recoverProtectedKey(damaged.armor(), identity.fingerprint, [secret])).status, "not-found");
    }
  } finally { key.clearPrivateParams(); damaged?.clearPrivateParams(); }
});

test("public armor, bundles, unprotected/mixed keys, dummy/S2K/cipher negatives and hidden unsupported packets are refused without attempts", async () => {
  const bad = [plain.privateKey, v4.publicKey, v4.privateKey + "\n" + v4.privateKey, "junk\n" + v4.privateKey];
  const singleBlock = (await pgp.readPrivateKey({ armoredKey: v4.privateKey })).toPacketList();
  singleBlock.push(...(await pgp.readPrivateKey({ armoredKey: v6.privateKey })).toPacketList()); bad.push(armor(singleBlock));
  for (const mutation of [
    (packet) => { packet.s2kUsage = 255; }, (packet) => { packet.s2k.type = "simple"; },
    (packet) => { packet.s2k.type = "salted"; }, (packet) => { packet.s2k.algorithm = 1; },
    (packet) => { packet.symmetric = 3; }, (packet) => { packet.s2k.type = "gnu-dummy"; },
  ]) {
    const key = await pgp.readPrivateKey({ armoredKey: v4.privateKey }); mutation(key.keyPacket); bad.push(key.armor());
  }
  const mixed = await pgp.decryptKey({ privateKey: await pgp.readPrivateKey({ armoredKey: v4.privateKey }), passphrase: secret });
  try { await mixed.keyPacket.encrypt(secret, { ...pgp.config, ...config }); bad.push(mixed.armor()); }
  finally { mixed.clearPrivateParams(); }
  class UnsupportedSecretSubkey { static tag = 7; write() { return Uint8Array.of(6, 0, 0, 0, 1, 35, 0, 0, 0, 4, 1, 2, 3, 4, 0); } }
  class JunkPacket { static tag = 61; write() { return new Uint8Array(); } }
  for (const packet of [new UnsupportedSecretSubkey(), new JunkPacket(), new pgp.UserAttributePacket()]) {
    const packets = (await pgp.readPrivateKey({ armoredKey: v4.privateKey })).toPacketList(); packets.push(packet); bad.push(armor(packets));
  }
  const overflow = (await pgp.readPrivateKey({ armoredKey: v4.privateKey })).toPacketList();
  for (let i = 0; i < 17; i++) overflow.push(overflow.find((packet) => packet.constructor.tag === 7)); bad.push(armor(overflow));
  for (const library of await both()) {
    const tools = createPrivateKeyRecoveryTools(library);
    for (const input of bad) {
      let attempts = 0;
      await assert.rejects(tools.recoverProtectedKey(input, fingerprint, [secret], { onProgress: () => { attempts++; } }), (error) => error instanceof RecoveryError);
      assert.equal(attempts, 0);
    }
  }
  assert.throws(() => checkedRecoveryArmor(v4.privateKey + "x"), code("KEY"));
  assert.throws(() => checkedRecoveryArmor("x".repeat(RECOVERY_LIMITS.keyBytes + 1)), code("KEY"));
});

test("Argon2 is recognized and rejected during inspection before any expensive derivation; unsupported profiles also fail", async () => {
  const key = await pgp.readPrivateKey({ armoredKey: v6.privateKey });
  key.keyPacket.s2k = { type: "argon2", write: () => Uint8Array.of(4, ...new Uint8Array(16), 255, 255, 31) };
  const argon = key.armor(); // Deliberately invalid protection; metadata-only negative, no Argon2 generation.
  for (const library of await both()) await assert.rejects(createPrivateKeyRecoveryTools(library).inspectProtectedKey(argon), code("ARGON2"));
  const unsupported = await pgp.generateKey({ type: "ecc", curve: "nistP256", userIDs: [{ name: "Synthetic unsupported recovery profile" }], passphrase: secret, config });
  await assert.rejects(createPrivateKeyRecoveryTools(pgp).inspectProtectedKey(unsupported.privateKey), code("PROFILE"));
});

test("full fingerprint mismatch and aborts make no later attempts; cleanup happens after both successful and failed trials", async () => {
  let decryptions = 0, validations = 0, cleanups = 0;
  const tools = createPrivateKeyRecoveryTools({ ...pgp, async readPrivateKeys(options) {
    const keys = await pgp.readPrivateKeys(options);
    for (const key of keys) {
      const clone = key.clone.bind(key);
      key.clone = (...args) => {
        const trial = clone(...args), clear = trial.clearPrivateParams.bind(trial);
        for (const { keyPacket } of trial.getKeys()) {
          const decrypt = keyPacket.decrypt.bind(keyPacket), validate = keyPacket.validate.bind(keyPacket);
          keyPacket.decrypt = async (...params) => { decryptions++; return decrypt(...params); };
          keyPacket.validate = async () => { validations++; return validate(); };
        }
        trial.clearPrivateParams = () => { clear(); cleanups++; assert.ok(trial.getKeys().every(({ keyPacket }) => keyPacket.privateParams === null)); };
        return trial;
      };
    }
    return keys;
  } });
  await tools.inspectProtectedKey(v4.privateKey); assert.equal(decryptions, 0);
  await assert.rejects(tools.recoverProtectedKey(v4.privateKey, "0".repeat(40), [secret]), code("FINGERPRINT"));
  assert.equal(decryptions, 0);
  const controller = new AbortController();
  await assert.rejects(tools.recoverProtectedKey(v4.privateKey, fingerprint, ["wrong", secret], {
    signal: controller.signal, onProgress: () => controller.abort(),
  }), code("ABORTED"));
  assert.equal(decryptions, 1); assert.equal(cleanups, 1); assert.equal(validations, 0);
  await assert.rejects(tools.recoverProtectedKey(v4.privateKey, fingerprint, [secret], { signal: controller.signal }), code("ABORTED"));
  assert.equal(decryptions, 1);
  assert.equal((await tools.recoverProtectedKey(v4.privateKey, fingerprint, [secret])).status, "matched");
  assert.equal(decryptions, 3); assert.equal(validations, 2); assert.equal(cleanups, 2);
});

test("recovery is shipped as readable local modules and does not add a native engine, network or secret store", () => {
  for (const name of ["recovery.mjs", "recovery-ui.mjs", "recovery-worker-client.mjs", "recovery-worker.mjs"]) {
    const source = readFileSync(new URL(`../apps/openpgp-workbench/${name}`, import.meta.url), "utf8");
    assert.equal(readFileSync(new URL(`../public/apps/openpgp-workbench/${name}`, import.meta.url), "utf8"), source, `${name} stale; rebuild`);
    assert.doesNotMatch(source, /\b(?:fetch|XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage|indexedDB|console)\b/);
    assert.doesNotMatch(source, /innerHTML|clipboard\.write|createObjectURL|Html5LocalFiles|generateLargeRsaKey/);
  }
  const worker = readFileSync(new URL("../apps/openpgp-workbench/recovery-worker.mjs", import.meta.url), "utf8");
  assert.match(worker, /from "\.\/vendor\/openpgp\.min\.mjs"/);
  assert.doesNotMatch(worker, /from "openpgp"|from "https?:/);
});
