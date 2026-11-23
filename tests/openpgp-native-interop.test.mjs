/** Native GnuPG controls, not a gpgv substitute or a Kleopatra/mobile GUI test.
 * Only fresh synthetic keys enter private temporary homes; no real user ring,
 * passphrase argv/environment, keyserver, fixture artifact or persistent key.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as openpgp from "openpgp";
import { encryptBackup } from "../scripts/encrypt-openpgp-backup.mjs";
import { generateCompatibilityKey, createPublicKeyring, KEY_COMPATIBILITY_CONFIG as config } from "../apps/openpgp-workbench/keyring.mjs";

const gpg = process.env.OPENPGP_GPG || "gpg";
const gpgconf = process.env.OPENPGP_GPGCONF || "gpgconf";
const probe = (command) => spawnSync(command, ["--version"], { encoding: "utf8", timeout: 10000, maxBuffer: 65536 });
const gpgVersion = probe(gpg), confVersion = probe(gpgconf);
const available = gpgVersion.status === 0 && confVersion.status === 0;
const required = process.env.REQUIRE_OPENPGP_NATIVE_INTEROP === "1";
const options = { skip: !available && !required ? "full gpg and gpgconf unavailable; gpgv is verification-only" : false };
const passphrase = "Synthetic GnuPG control only — never use this key";
const wrongPassphrase = "A deliberately wrong synthetic passphrase";
const plaintext = "Native GnuPG synthetic control only.\r\nUnicode: café 🔐.\nExact final bytes.\n";
let bundlePromise, secondPromise;
const bundle = () => bundlePromise ||= generateCompatibilityKey({ name: "Synthetic native interop — do not use", email: "native@example.invalid", passphrase, expiryDays: 30 });
const second = () => secondPromise ||= generateCompatibilityKey({ name: "Second synthetic native interop — do not use", passphrase, expiryDays: 30 });

function requireTools(t) {
  assert.ok(available, "Native controls require real gpg AND gpgconf; this mandatory run must not silently skip them");
  assert.match(gpgVersion.stdout, /^gpg \(GnuPG\) /);
  t.diagnostic(gpgVersion.stdout.split("\n")[0]);
}

function home() {
  const directory = mkdtempSync(join(tmpdir(), "html5-synthetic-native-pgp-"));
  const env = { ...process.env, GNUPGHOME: directory, LC_ALL: "C.UTF-8" };
  delete env.GPG_AGENT_INFO; delete env.GPG_TTY;
  writeFileSync(join(directory, "gpg-agent.conf"), "allow-loopback-pinentry\ndefault-cache-ttl 0\nmax-cache-ttl 0\n", { mode: 0o600 });
  const file = (name, value) => { const path = join(directory, name); writeFileSync(path, value, { mode: 0o600 }); return path; };
  const path = (name) => join(directory, name);
  const killAgent = () => {
    const result = spawnSync(gpgconf, ["--homedir", directory, "--kill", "gpg-agent"], { env, encoding: "utf8", timeout: 10000, maxBuffer: 65536 });
    assert.equal(result.status, 0, "The isolated GnuPG agent must be stopped, not a default user agent");
  };
  const run = (args, { secret, failure = false } = {}) => {
    const result = spawnSync(gpg, [
      "--no-options", "--homedir", directory, "--batch", "--no-tty",
      "--no-auto-key-retrieve", "--auto-key-locate", "clear", "--status-fd", "1",
      "--pinentry-mode", "loopback", ...(secret === undefined ? [] : ["--passphrase-fd", "0"]), ...args,
    ], { env, input: secret === undefined ? "" : `${secret}\n`, encoding: "utf8", timeout: 20000, maxBuffer: 1_048_576 });
    // Diagnostics never include argv stdin, a private file's contents or
    // generated key armor. All outputs are bounded; crypto bytes go to files.
    assert.equal(result.error, undefined, result.error?.message);
    if (!failure) assert.equal(result.status, 0, `GnuPG operation failed: ${result.stderr.slice(0, 1800)}`);
    return result;
  };
  return {
    file, path, run, killAgent,
    close() { try { killAgent(); } finally { rmSync(directory, { recursive: true, force: true }); } },
  };
}

function parts(colonOutput) {
  const result = [];
  let current;
  for (const line of colonOutput.split("\n")) {
    const fields = line.split(":");
    if (["pub", "sub", "sec", "ssb"].includes(fields[0])) {
      current = { type: fields[0], validity: fields[1], bits: Number(fields[2]), algorithm: Number(fields[3]) };
    } else if (fields[0] === "fpr" && current) {
      result.push({ ...current, fingerprint: fields[9] }); current = null;
    }
  }
  return result;
}

async function controls() {
  const key = await bundle();
  const privateKey = await openpgp.decryptKey({ privateKey: await openpgp.readPrivateKey({ armoredKey: key.privateKey }), passphrase, config });
  try {
    const message = await openpgp.createMessage({ binary: new TextEncoder().encode(plaintext) });
    return {
      ...key,
      signature: await openpgp.sign({ message, signingKeys: privateKey, detached: true, config }),
      encrypted: await openpgp.encrypt({ message, encryptionKeys: await openpgp.readKey({ armoredKey: key.publicKey }), config }),
      partFingerprints: privateKey.getKeys().map((part) => part.getFingerprint().toUpperCase()),
    };
  } finally { privateKey.clearPrivateParams(); }
}

test("native GnuPG imports both protected RSA packets, refuses wrong passphrases and cross-encrypts/signs in both directions", options, async (t) => {
  requireTools(t);
  const key = await controls(), context = home();
  try {
    const privateFile = context.file("synthetic-private.asc", key.privateKey);
    const messageFile = context.file("message.bin", plaintext);
    const signatureFile = context.file("from-js.sig.asc", key.signature);
    const encryptedFile = context.file("from-js.asc", key.encrypted);
    context.run(["--import", privateFile], { secret: passphrase });
    const imported = parts(context.run(["--with-colons", "--fingerprint", "--fingerprint", "--list-secret-keys", key.fingerprint]).stdout);
    assert.deepEqual(imported.map((part) => part.type), ["sec", "ssb"]);
    assert.deepEqual(imported.map((part) => part.fingerprint), key.partFingerprints);
    assert.ok(imported.every((part) => part.bits === 3072 && part.algorithm === 1));

    // Kill the dedicated agent before each wrong-passphrase operation so a
    // cached successful unlock cannot turn a negative control into a false pass.
    context.killAgent();
    const wrongDecrypt = context.run(["--output", context.path("wrong-plaintext"), "--decrypt", encryptedFile], { secret: wrongPassphrase, failure: true });
    assert.notEqual(wrongDecrypt.status, 0); assert.doesNotMatch(wrongDecrypt.stdout, /\[GNUPG:\] DECRYPTION_OKAY/);
    assert.ok(!existsSync(context.path("wrong-plaintext")) || readFileSync(context.path("wrong-plaintext")).length === 0);
    context.killAgent();
    const wrongSign = context.run(["--armor", "--output", context.path("wrong.sig"), "--local-user", key.fingerprint, "--detach-sign", messageFile], { secret: wrongPassphrase, failure: true });
    assert.notEqual(wrongSign.status, 0); assert.doesNotMatch(wrongSign.stdout, /\[GNUPG:\] SIG_CREATED/);
    context.killAgent();

    const decrypted = context.run(["--output", context.path("decrypted.bin"), "--decrypt", encryptedFile], { secret: passphrase });
    assert.match(decrypted.stdout, /\[GNUPG:\] DECRYPTION_OKAY/);
    assert.match(decrypted.stdout, /\[GNUPG:\] GOODMDC/);
    assert.equal(readFileSync(context.path("decrypted.bin"), "utf8"), plaintext);
    const verified = context.run(["--verify", signatureFile, messageFile]);
    assert.ok(verified.stdout.includes(`[GNUPG:] VALIDSIG ${key.fingerprint} `));
    const bad = context.run(["--verify", signatureFile, context.file("modified.bin", plaintext + "modified")], { failure: true });
    assert.notEqual(bad.status, 0); assert.doesNotMatch(bad.stdout, /\[GNUPG:\] VALIDSIG/);

    context.run(["--armor", "--rfc4880", "--cipher-algo", "AES256", "--compress-algo", "none", "--trust-model", "always", "--recipient", key.fingerprint, "--output", context.path("from-gpg.asc"), "--encrypt", messageFile]);
    const encryptedByGpg = await openpgp.readMessage({ armoredMessage: readFileSync(context.path("from-gpg.asc"), "utf8"), config });
    assert.equal(encryptedByGpg.packets.at(-1).version, 1, "GnuPG emits classic SEIPDv1, not AEAD in this control");
    context.run(["--armor", "--digest-algo", "SHA256", "--local-user", key.fingerprint, "--output", context.path("from-gpg.sig.asc"), "--detach-sign", messageFile], { secret: passphrase });
    const privateKey = await openpgp.decryptKey({ privateKey: await openpgp.readPrivateKey({ armoredKey: key.privateKey }), passphrase, config });
    try {
      const result = await openpgp.decrypt({ message: encryptedByGpg, decryptionKeys: privateKey, format: "binary", config });
      assert.equal(new TextDecoder().decode(result.data), plaintext);
    } finally { privateKey.clearPrivateParams(); }
    const verification = await openpgp.verify({
      message: await openpgp.createMessage({ binary: new TextEncoder().encode(plaintext) }),
      signature: await openpgp.readSignature({ armoredSignature: readFileSync(context.path("from-gpg.sig.asc"), "utf8") }),
      verificationKeys: await openpgp.readKey({ armoredKey: key.publicKey }), config,
    });
    assert.equal(verification.signatures.length, 1); await verification.signatures[0].verified;

    // A GnuPG re-export is read only by this independent test. The app still
    // has no secret-key import feature and its strict generated-download
    // protection checker is not weakened to accept arbitrary GnuPG settings.
    context.run(["--armor", "--output", context.path("reexport-private.asc"), "--export-secret-keys", key.fingerprint], { secret: passphrase });
    const protectedAgain = await openpgp.readPrivateKey({ armoredKey: readFileSync(context.path("reexport-private.asc"), "utf8") });
    assert.equal(protectedAgain.isDecrypted(), false);
    const unlockedAgain = await openpgp.decryptKey({ privateKey: protectedAgain, passphrase, config });
    try { assert.ok(unlockedAgain.getKeys().every((part) => part.keyPacket.isDecrypted())); assert.equal(unlockedAgain.getFingerprint().toUpperCase(), key.fingerprint); }
    finally { unlockedAgain.clearPrivateParams(); }
  } finally { context.close(); }
});

test("native GnuPG and the public-only keyring preserve both certificates in single-block and concatenated public exports", options, async (t) => {
  requireTools(t);
  const keys = await Promise.all([bundle(), second()]);
  const packets = new openpgp.PacketList();
  for (const key of keys) packets.push(...(await openpgp.readKey({ armoredKey: key.publicKey })).toPacketList());
  const singleBlock = openpgp.armor(openpgp.enums.armor.publicKey, packets.write());
  const expected = keys.map((key) => key.fingerprint).sort();
  for (const armored of [singleBlock, keys.map((key) => key.publicKey).join("\n")]) {
    const context = home();
    try {
      context.run(["--import", context.file("public.asc", armored)]);
      const listed = parts(context.run(["--with-colons", "--fingerprint", "--fingerprint", "--list-keys"]).stdout);
      assert.deepEqual(listed.filter((part) => part.type === "pub").map((part) => part.fingerprint).sort(), expected);
      assert.equal(listed.filter((part) => part.type === "sub").length, 2);
      context.run(["--armor", "--output", context.path("public-export.asc"), "--export"]);
      const exported = readFileSync(context.path("public-export.asc"), "utf8");
      assert.doesNotMatch(exported, /BEGIN PGP PRIVATE KEY BLOCK/);
      assert.equal((exported.match(/BEGIN PGP PUBLIC KEY BLOCK/g) || []).length, 1);
      const ring = createPublicKeyring();
      assert.deepEqual((await ring.importKeys(exported)).map((key) => key.fingerprint).sort(), expected);
      assert.equal((ring.exportKeys().match(/BEGIN PGP PUBLIC KEY BLOCK/g) || []).length, 2);
    } finally { context.close(); }
  }
});

test("native GnuPG applies the separate synthetic revocation and exports an archival-only certificate", options, async (t) => {
  requireTools(t);
  const key = await bundle(), context = home();
  try {
    context.run(["--import", context.file("public.asc", key.publicKey)]);
    context.run(["--import", context.file("revocation.asc", key.revocationCertificate)]);
    const listed = parts(context.run(["--with-colons", "--fingerprint", "--list-keys", key.fingerprint]).stdout);
    assert.equal(listed[0].fingerprint, key.fingerprint); assert.equal(listed[0].validity, "r");
    context.run(["--armor", "--output", context.path("revoked-public.asc"), "--export", key.fingerprint]);
    const revoked = readFileSync(context.path("revoked-public.asc"), "utf8");
    assert.equal(await (await openpgp.readKey({ armoredKey: revoked })).isRevoked(), true);
    const ring = createPublicKeyring(); await ring.importKeys(key.publicKey);
    await assert.rejects(ring.importKeys(revoked), /different data/);
    ring.remove(key.fingerprint);
    const [archival] = await ring.importKeys(revoked);
    assert.match(archival.selfCertification, /unusable: revoked.*archival export only/);
  } finally { context.close(); }
});


test("native GnuPG decrypts the streaming release tool's legacy Ed25519/Curve25519 backup with its exact bound recipient", options, async (t) => {
  requireTools(t);
  const generated = await openpgp.generateKey({
    type: "ecc", curve: "curve25519Legacy", passphrase,
    userIDs: [{ name: "Synthetic ECC native backup — do not use", email: "ecc@example.invalid" }],
    subkeys: [{ curve: "curve25519Legacy", sign: false }, { curve: "curve25519Legacy", sign: true }], config,
  });
  const key = await openpgp.readKey({ armoredKey: generated.publicKey });
  const context = home();
  try {
    const input = context.file("synthetic.bin", Buffer.from(plaintext + "\0binary"));
    const receipt = await encryptBackup({
      inputPath: input, outputPath: context.path("synthetic.bin.gpg"),
      recipientFile: context.file("public.asc", generated.publicKey),
      expectedFingerprint: key.getFingerprint(), sourceRevision: "a".repeat(40),
    });
    assert.equal(receipt.encryptionFingerprint, key.subkeys[0].getFingerprint().toUpperCase());
    context.run(["--import", context.file("synthetic-private.asc", generated.privateKey)], { secret: passphrase });
    const decrypted = context.run(["--output", context.path("decrypted.bin"), "--decrypt", context.path("synthetic.bin.gpg")], { secret: passphrase });
    assert.match(decrypted.stdout, /\[GNUPG:\] DECRYPTION_OKAY/);
    assert.match(decrypted.stdout, /\[GNUPG:\] GOODMDC/);
    assert.deepEqual(readFileSync(context.path("decrypted.bin")), readFileSync(input));
    context.run(["--armor", "--output", context.path("reexport-public.asc"), "--export", key.getFingerprint()]);
    const ring = createPublicKeyring();
    await ring.importKeys(readFileSync(context.path("reexport-public.asc"), "utf8"), { expectedFingerprint: key.getFingerprint() });
    assert.equal((await openpgp.readKey({ armoredKey: ring.exportKeys() })).getKeys().length, 3);
  } finally { context.close(); }
});
