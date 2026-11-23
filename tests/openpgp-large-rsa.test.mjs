/** Expensive real-key controls are isolated and mandatory in their own CI lane. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as openpgp from "openpgp";
import { generateLargeRsaKey } from "../apps/openpgp-workbench/large-rsa.mjs";
import {
  RSA_BITS, MAX_RSA_BITS, RSA_GENERATION_SIZES, checkedRsaBits,
  KEY_COMPATIBILITY_CONFIG as config, createOpenPgpKeyTools,
  generateCompatibilityKey, checkedPrivateDownload, createPublicKeyring,
} from "../apps/openpgp-workbench/keyring.mjs";

const passphrase = "Synthetic large RSA control only — never use";
const runSlow = process.env.RUN_OPENPGP_LARGE_RSA === "1";
const requireNative = process.env.REQUIRE_OPENPGP_NATIVE_INTEROP === "1";

test("large RSA sizes are explicit, bounded and never coerced; the default remains 3072", async () => {
  assert.equal(RSA_BITS, 3072); assert.equal(MAX_RSA_BITS, 16384);
  assert.deepEqual(RSA_GENERATION_SIZES, [3072, 4096, 6144, 8192, 12288, 16384]);
  assert.ok(Object.isFrozen(RSA_GENERATION_SIZES));
  let calls = 0;
  const sentinel = new Error("synthetic generator intercepted before expensive work");
  const tools = createOpenPgpKeyTools({ ...openpgp, generateKey(options) {
    calls++;
    assert.equal(options.rsaBits, options.subkeys[0].rsaBits);
    assert.equal(options.subkeys[0].sign, false);
    throw sentinel;
  } });
  const valid = { name: "Synthetic size policy control", passphrase, expiryDays: 30 };
  for (const rsaBits of RSA_GENERATION_SIZES) {
    assert.equal(checkedRsaBits(rsaBits), rsaBits);
    await assert.rejects(tools.generateCompatibilityKey({ ...valid, rsaBits }), (error) => error === sentinel);
  }
  assert.equal(calls, RSA_GENERATION_SIZES.length);
  for (const rsaBits of [2048, 4095, 4097, 8193, 16385, 32768, -8192, 0, 8192.5, null, NaN, Infinity, "8192", "16384"]) {
    assert.throws(() => checkedRsaBits(rsaBits), /explicit supported RSA size/);
    await assert.rejects(tools.generateCompatibilityKey({ ...valid, rsaBits }), /explicit supported RSA size/);
  }
  assert.equal(calls, RSA_GENERATION_SIZES.length, "invalid sizes must never start key generation");
});

test("the UI and shipped mirror expose above-8192 sizes, a separate opt-in warning and unchanged private-export consent", () => {
  const source = readFileSync(new URL("../apps/openpgp-workbench/index.html", import.meta.url), "utf8");
  for (const bits of RSA_GENERATION_SIZES) assert.match(source, new RegExp(`<option value="${bits}"`));
  assert.match(source, /value="3072" selected/);
  for (const id of ["large-rsa-warning", "key-large-ack", "key-backup-ack", "backup-fingerprint"]) assert.ok(source.includes(`id="${id}"`));
  assert.match(source, /2048–16384 bits/);
  assert.match(source, /cannot be stopped once started/);
  assert.match(source, /dispatch patch/);
  assert.match(source, /16384 bits — experimental browser generation/);
  assert.match(source, /not verified successful browser generation/);
});

for (const rsaBits of [8192, 16384]) {
  test(`real RSA-${rsaBits} generation, protected exports, public import, signatures and exact recovery in Node/browser distributions and available independent readers`, {
    skip: !runSlow && "expensive synthetic generation runs in the mandatory large-rsa CI lane; set RUN_OPENPGP_LARGE_RSA=1 locally",
    timeout: 25 * 60 * 1000,
  }, async (t) => {
    const started = performance.now();
    t.diagnostic(`Starting two synthetic RSA-${rsaBits} packets; no production identity, private fixture or key cache.`);
    const bundle = await generateCompatibilityKey({ name: `Synthetic RSA-${rsaBits} — do not use`, passphrase, expiryDays: 30, rsaBits });
    t.diagnostic(`RSA-${rsaBits} generation/protection completed after ${Math.round((performance.now() - started) / 1000)} seconds.`);
    assert.equal(bundle.rsaBits, rsaBits);
    if (rsaBits > 8192) {
      // Test the main-thread reply validator against a real large protected
      // bundle without running a second expensive prime search.
      let terminated = 0;
      class ReplyWorker {
        postMessage() { queueMicrotask(() => this.onmessage?.({ data: { bundle } })); }
        terminate() { terminated++; }
      }
      const checked = await generateLargeRsaKey({ name: "Synthetic reply validation", passphrase, expiryDays: 30, rsaBits }, { WorkerClass: ReplyWorker });
      assert.equal(checked.privateKey, bundle.privateKey); assert.equal(terminated, 1); assert.ok(Object.isFrozen(checked));
    }
    const publicKey = await openpgp.readKey({ armoredKey: bundle.publicKey });
    const protectedKey = await openpgp.readPrivateKey({ armoredKey: bundle.privateKey });
    assert.equal(protectedKey.getKeys().length, 2);
    for (const { keyPacket } of protectedKey.getKeys()) {
      assert.equal(keyPacket.getAlgorithmInfo().bits, rsaBits);
      assert.equal(keyPacket.version, 4); assert.equal(keyPacket.s2kUsage, 254);
      assert.equal(keyPacket.symmetric, openpgp.enums.symmetric.aes256);
      assert.equal(keyPacket.s2k.c, 0xff); assert.equal(keyPacket.isDecrypted(), false);
      assert.equal(keyPacket.privateParams, null);
    }
    await assert.rejects(checkedPrivateDownload(bundle.privateKey, bundle.fingerprint), /selected size/);
    await assert.rejects(checkedPrivateDownload(bundle.privateKey, bundle.fingerprint, { rsaBits: rsaBits === 8192 ? 16384 : 8192 }), /selected size/);
    const browser = await import("../public/apps/openpgp-workbench/vendor/openpgp.min.mjs");
    const browserTools = createOpenPgpKeyTools(browser);
    for (const tools of [createOpenPgpKeyTools(openpgp), browserTools]) {
      assert.equal(await tools.checkedPrivateDownload(bundle.privateKey, bundle.fingerprint, { rsaBits }), bundle.privateKey);
      const ring = tools.createPublicKeyring();
      const [entry] = await ring.importKeys(bundle.publicKey, { expectedFingerprint: bundle.fingerprint });
      assert.equal(entry.algorithm, `v4 RSA-${rsaBits}`); assert.match(entry.selfCertification, /^valid at import time/);
      const recipient = await tools.readEncryptionRecipient(ring.exportKeys(), bundle.fingerprint);
      assert.equal(recipient.encryptionFingerprint, publicKey.subkeys[0].getFingerprint().toUpperCase());
    }
    const plaintext = new TextEncoder().encode(`Synthetic exact RSA-${rsaBits} binary control.\0café 🔐\r\n`);
    const unlocked = await openpgp.decryptKey({ privateKey: protectedKey, passphrase, config });
    let signature, ciphertext;
    try {
      await assert.rejects(checkedPrivateDownload(unlocked.armor(), bundle.fingerprint, { rsaBits }), /Refusing a private download/);
      const message = await openpgp.createMessage({ binary: plaintext });
      signature = await openpgp.sign({ message, signingKeys: unlocked, detached: true, config });
      ciphertext = await openpgp.encrypt({ message, encryptionKeys: publicKey, config });
      const decrypted = await openpgp.decrypt({ message: await openpgp.readMessage({ armoredMessage: ciphertext }), decryptionKeys: unlocked, format: "binary", config });
      assert.deepEqual(decrypted.data, plaintext);
      const verification = await browser.verify({
        message: await browser.createMessage({ binary: plaintext }),
        signature: await browser.readSignature({ armoredSignature: signature }),
        verificationKeys: await browser.readKey({ armoredKey: bundle.publicKey }), config: browserTools.config,
      });
      await verification.signatures[0].verified;
    } finally { unlocked.clearPrivateParams(); }

    const directory = mkdtempSync(join(tmpdir(), "html5-synthetic-large-rsa-"));
    const file = (name, contents) => { const path = join(directory, name); writeFileSync(path, contents, { mode: 0o600 }); return path; };
    const env = { ...process.env, GNUPGHOME: directory, LC_ALL: "C.UTF-8" };
    delete env.GPG_AGENT_INFO; delete env.GPG_TTY;
    let native = false;
    try {
      const publicFile = file("public.gpg", publicKey.write()), dataFile = file("synthetic.bin", plaintext), signatureFile = file("signature.asc", signature);
      const verified = spawnSync("gpgv", ["--homedir", directory, "--status-fd", "1", "--keyring", publicFile, signatureFile, dataFile], { env, encoding: "utf8", timeout: 120000 });
      assert.equal(verified.status, 0, verified.stderr);
      assert.ok(verified.stdout.includes(`[GNUPG:] VALIDSIG ${bundle.fingerprint}`));
      native = ["gpg", "gpgconf"].every((command) => spawnSync(command, ["--version"], { encoding: "utf8", timeout: 10000 }).status === 0);
      if (requireNative) assert.ok(native, "mandatory large-RSA interop requires full gpg AND gpgconf");
      if (native) {
        const gpg = (args, secret) => {
          const result = spawnSync("gpg", ["--no-options", "--homedir", directory, "--batch", "--no-tty", "--no-auto-key-retrieve", "--auto-key-locate", "clear", "--status-fd", "1", "--pinentry-mode", "loopback", ...(secret ? ["--passphrase-fd", "0"] : []), ...args], { env, input: secret ? `${passphrase}\n` : "", encoding: "utf8", timeout: 120000, maxBuffer: 1_048_576 });
          assert.equal(result.status, 0, result.stderr.slice(0, 1800));
          return result;
        };
        gpg(["--import", file("synthetic-private.asc", bundle.privateKey)], true);
        const recovered = join(directory, "recovered.bin");
        const decrypted = gpg(["--output", recovered, "--decrypt", file("encrypted.asc", ciphertext)], true);
        assert.match(decrypted.stdout, /\[GNUPG:\] DECRYPTION_OKAY/); assert.match(decrypted.stdout, /\[GNUPG:\] GOODMDC/);
        assert.deepEqual(readFileSync(recovered), Buffer.from(plaintext));
        const fromGpg = join(directory, "from-gpg.asc");
        gpg(["--armor", "--rfc4880", "--cipher-algo", "AES256", "--compress-algo", "none", "--trust-model", "always", "--recipient", bundle.fingerprint, "--output", fromGpg, "--encrypt", dataFile]);
        const key = await openpgp.decryptKey({ privateKey: await openpgp.readPrivateKey({ armoredKey: bundle.privateKey }), passphrase, config });
        try {
          const result = await openpgp.decrypt({ message: await openpgp.readMessage({ armoredMessage: readFileSync(fromGpg, "utf8") }), decryptionKeys: key, format: "binary", config });
          assert.deepEqual(result.data, plaintext);
        } finally { key.clearPrivateParams(); }
        t.diagnostic(`Independent full GnuPG cross-encryption and gpgv signature verification passed for RSA-${rsaBits}.`);
      } else {
        t.diagnostic(`Independent gpgv verified RSA-${rsaBits}; full local gpg/gpgconf unavailable, so native cross-decryption is NOT claimed.`);
      }
    } finally {
      try {
        if (native) {
          const stopped = spawnSync("gpgconf", ["--homedir", directory, "--kill", "gpg-agent"], { env, encoding: "utf8", timeout: 10000 });
          assert.equal(stopped.status, 0, "isolated large-RSA agent must stop");
        }
      } finally { rmSync(directory, { recursive: true, force: true }); }
    }
    assert.equal(createPublicKeyring().list().length, 0, "synthetic keys never become app-global state");
    if (rsaBits === 16384 && process.env.OPENPGP_LARGE_RSA_PUBLIC_CONTROL_PATH) {
      // Same-job PUBLIC-only handoff for actual Chromium import. No secret
      // fixture, artifact upload or cross-job cache; isolated homes are gone.
      assert.doesNotMatch(bundle.publicKey, /PRIVATE KEY/);
      writeFileSync(process.env.OPENPGP_LARGE_RSA_PUBLIC_CONTROL_PATH, bundle.publicKey, { mode: 0o600, flag: "wx" });
    }
  });
}
