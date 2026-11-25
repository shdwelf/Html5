/** Optional real Chromium + Web Crypto + actual download checks. Synthetic keys only. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { browserDeps, serve, withBrowser, ROOT } from "./lib-browser.mjs";
import { generateCompatibilityKey, RSA_GENERATION_SIZES } from "../apps/openpgp-workbench/keyring.mjs";
import * as openpgp from "openpgp";

const rsaBits = Number(process.env.OPENPGP_BROWSER_RSA_BITS || 3072);
assert.ok(RSA_GENERATION_SIZES.includes(rsaBits), "browser test RSA size must be an explicit supported choice");
const deps = await browserDeps();
if (!deps && process.env.REQUIRE_OPENPGP_BROWSER === "1") throw new Error("Required OpenPGP Chromium runner is unavailable; refusing a silent skip.");
if (!deps) { console.log("OpenPGP browser: SKIPPED (optional puppeteer-core and @sparticuz/chromium unavailable)"); process.exit(0); }
const { server, port } = await serve(join(ROOT, "public"));
const base = `http://127.0.0.1:${port}`;
const directory = await mkdtemp(join(tmpdir(), "html5-browser-synthetic-pgp-"));
const passphrase = "synthetic Chromium passphrase only";
async function downloaded(name) {
  const path = join(directory, name);
  for (let i = 0; i < 1000; i++) {
    try { if ((await stat(path)).size) return await readFile(path, "utf8"); } catch { /* browser download pending */ }
    await delay(10);
  }
  assert.fail(`download not completed: ${name}`);
}
try {
  await withBrowser(deps, async (browser) => {
    const page = await browser.newPage();
    await page.setViewport({ width: 1100, height: 900 });
    const pageErrors = [], external = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      const url = request.url();
      if (/^https?:/.test(url) && new URL(url).origin !== base) { external.push(url); void request.abort(); }
      else void request.continue();
    });
    const session = await page.createCDPSession();
    await session.send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: directory });
    let fingerprint, publicArmor, privateArmor;
    const field = async (id, value) => page.$eval(`#${id}`, (element, text) => { element.value = text; element.dispatchEvent(new Event("input", { bubbles: true })); }, value);
    const status = async (id, kind) => {
      await page.waitForFunction((target, expected) => {
        const state = document.getElementById(target).dataset.kind;
        return state === expected || (expected === "success" && state === "error");
      }, { timeout: id === "keygen-status" && rsaBits > 4096 ? 20 * 60 * 1000 : 45000 }, id, kind);
      const actual = await page.$eval(`#${id}`, (element) => ({ kind: element.dataset.kind, message: element.textContent }));
      assert.equal(actual.kind, kind, actual.message);
    };

    await test("real Chromium loads the local module/importmap with Web Crypto and no inferred identity", async () => {
      await page.goto(`${base}/apps/openpgp-workbench/index.html`, { waitUntil: "networkidle0" });
      assert.equal(await page.evaluate(() => window.isSecureContext && Boolean(crypto.subtle)), true);
      assert.equal(await page.$eval("#key-name", (element) => element.value), "");
      assert.equal(await page.$eval("#key-email", (element) => element.value), "");
      assert.equal(await page.$eval("#generated-public-output", (element) => element.value), "");
      assert.equal(await page.$eval("#download-private-key", (element) => element.disabled), true);
      assert.deepEqual(external, []);
    });
    await test("real Chromium offers above-8192 sizes but refuses expensive generation without its separate opt-in", async () => {
      await page.click("#keygen-tab");
      assert.equal(await page.$eval("#key-rsa-bits", (element) => element.value), "3072");
      await page.select("#key-rsa-bits", "16384");
      assert.equal(await page.$eval("#large-rsa-warning", (element) => element.hidden), false);
      await field("key-name", "Synthetic large-size UI gate only");
      await field("key-passphrase", passphrase); await field("key-confirm", passphrase);
      await page.click("#generate-key"); await status("keygen-status", "error");
      assert.match(await page.$eval("#keygen-status", (element) => element.textContent), /Acknowledge the large-RSA/);
      assert.equal(await page.$eval("#generated-public-output", (element) => element.value), "");
      await page.click("#clear-generated");
      assert.equal(await page.$eval("#key-rsa-bits", (element) => element.value), "3072");
      assert.equal(await page.$eval("#key-large-ack", (element) => element.checked), false);
    });
    await test("Clear terminates an actual experimental 16384-bit worker, keeps the page responsive and retains no key", async () => {
      await page.select("#key-rsa-bits", "16384"); await page.click("#key-large-ack");
      await field("key-name", "Synthetic cancellation control only");
      await field("key-passphrase", passphrase); await field("key-confirm", passphrase);
      const workerEvent = (name, predicate) => new Promise((resolve, reject) => {
        const listener = (worker) => {
          if (!predicate(worker)) return;
          clearTimeout(timer); page.off(name, listener); resolve(worker);
        };
        const timer = setTimeout(() => { page.off(name, listener); reject(new Error(`Large-RSA ${name} event missing`)); }, 10000);
        page.on(name, listener);
      });
      const created = workerEvent("workercreated", (worker) => worker.url().endsWith("/large-rsa-worker.bundle.mjs"));
      try {
        await page.click("#generate-key");
        const worker = await created;
        const terminated = workerEvent("workerdestroyed", (closed) => closed === worker);
        await page.click("#clear-generated"); await terminated;
      } finally { await page.click("#clear-generated"); }
      await page.waitForFunction(() => !document.getElementById("generate-key").disabled);
      assert.equal(await page.$eval("#generated-public-output", (element) => element.value), "");
      assert.equal(await page.$eval("#key-rsa-bits", (element) => element.value), "3072");
      assert.equal(await page.$eval("#download-private-key", (element) => element.disabled), true);
    });
    await test(`real ${rsaBits > 8192 ? "isolated worker" : "Web Crypto"} generates the two RSA-${rsaBits} keys and displays only the public certificate`, async () => {
      await page.click("#keygen-tab");
      await page.select("#key-rsa-bits", String(rsaBits));
      if (rsaBits > 4096) await page.click("#key-large-ack");
      await field("key-name", "Chromium synthetic test — do not use"); await field("key-email", "browser@example.invalid");
      await field("key-passphrase", passphrase); await field("key-confirm", passphrase); await field("key-expiry", "30");
      await page.click("#generate-key"); await status("keygen-status", "success");
      fingerprint = (await page.$eval("#generated-fingerprint", (element) => element.textContent)).replaceAll(" ", "");
      assert.match(fingerprint, /^[A-F0-9]{40}$/);
      publicArmor = await page.$eval("#generated-public-output", (element) => element.value);
      assert.equal((await openpgp.readKey({ armoredKey: publicArmor })).getFingerprint().toUpperCase(), fingerprint);
      assert.equal(await page.$eval("#key-passphrase", (element) => element.value), "");
      assert.equal(await page.$eval("#key-confirm", (element) => element.value), "");
      const fields = await page.$$eval("input,textarea", (elements) => elements.map((element) => element.value).join("\n"));
      assert.doesNotMatch(fields, /BEGIN PGP PRIVATE KEY BLOCK/);
      assert.equal(await page.$eval("#download-private-key", (element) => element.disabled), true);
    });
    if (!fingerprint || !publicArmor) return; // The generation test already failed; do not cascade misleading export failures.
    await test("actual protected/private and revocation downloads require consent/full fingerprint and independently recover exact bytes", async (t) => {
      await page.click("#download-public-key");
      assert.equal(await downloaded(`${fingerprint}-PUBLIC.asc`), publicArmor);
      await page.click("#key-backup-ack"); await field("backup-fingerprint", "0".repeat(40));
      await page.click("#download-private-key"); await status("keygen-status", "error");
      await assert.rejects(stat(join(directory, `${fingerprint}-SECRET.asc`)), /ENOENT/);
      await field("backup-fingerprint", fingerprint); await page.click("#download-private-key");
      privateArmor = await downloaded(`${fingerprint}-SECRET.asc`);
      const encrypted = await openpgp.readPrivateKey({ armoredKey: privateArmor });
      assert.equal(encrypted.isDecrypted(), false); assert.equal(encrypted.getKeys().length, 2);
      assert.ok(encrypted.getKeys().every(({ keyPacket }) => keyPacket.s2k.c === 0xff && keyPacket.getAlgorithmInfo().bits === rsaBits));
      const unlocked = await openpgp.decryptKey({ privateKey: encrypted, passphrase });
      try {
        assert.equal(unlocked.getFingerprint().toUpperCase(), fingerprint);
        const plaintext = new TextEncoder().encode(`Synthetic browser RSA-${rsaBits} exact recovery.\0café 🔐\r\n`);
        const publicKey = await openpgp.readKey({ armoredKey: publicArmor });
        const message = await openpgp.createMessage({ binary: plaintext });
        const ciphertext = await openpgp.encrypt({ message, encryptionKeys: publicKey });
        const recovered = await openpgp.decrypt({ message: await openpgp.readMessage({ armoredMessage: ciphertext }), decryptionKeys: unlocked, format: "binary" });
        assert.deepEqual(recovered.data, plaintext);
        const signature = await openpgp.sign({ message, signingKeys: unlocked, detached: true });
        const publicFile = join(directory, "synthetic-public.gpg"), signatureFile = join(directory, "synthetic-signature.asc"), dataFile = join(directory, "synthetic-data.bin");
        await writeFile(publicFile, publicKey.write(), { mode: 0o600 });
        await writeFile(signatureFile, signature, { mode: 0o600 }); await writeFile(dataFile, plaintext, { mode: 0o600 });
        const verified = spawnSync("gpgv", ["--homedir", directory, "--keyring", publicFile, "--status-fd", "1", signatureFile, dataFile], { encoding: "utf8", timeout: 30000 });
        if (verified.error?.code === "ENOENT" && process.env.REQUIRE_OPENPGP_NATIVE_INTEROP !== "1") {
          t.diagnostic("Independent gpgv is unavailable locally; not claimed. Mandatory large-RSA CI requires it.");
        } else {
          assert.equal(verified.status, 0, verified.stderr);
          assert.ok(verified.stdout.includes(`[GNUPG:] VALIDSIG ${fingerprint}`));
          t.diagnostic(`Independent gpgv verified the actual browser-generated RSA-${rsaBits} signing key.`);
        }
      } finally { unlocked.clearPrivateParams(); }
      await page.click("#download-revocation");
      const revocation = await downloaded(`${fingerprint}-REVOCATION.asc`);
      const revoked = await openpgp.revokeKey({ key: await openpgp.readKey({ armoredKey: publicArmor }), revocationCertificate: revocation });
      assert.equal(await (await openpgp.readKey({ armoredKey: revoked.publicKey })).isRevoked(), true);
    });
    await test("public keyring export downloads only public data and multi-certificate single-block imports keep every key", async () => {
      await page.click("#add-generated-public"); await page.waitForFunction(() => document.querySelectorAll("#keyring-list li").length === 1);
      await page.click("#keyring-tab"); await page.click("#download-keyring");
      const exported = await downloaded("openpgp-PUBLIC-keyring.asc");
      assert.doesNotMatch(exported, /PRIVATE KEY/);
      assert.equal((await openpgp.readKey({ armoredKey: exported })).getFingerprint().toUpperCase(), fingerprint);
      const second = await generateCompatibilityKey({ name: "Second synthetic browser import — do not use", passphrase, expiryDays: 30 });
      const bytes = (await openpgp.readKey({ armoredKey: publicArmor })).write(), extra = (await openpgp.readKey({ armoredKey: second.publicKey })).write();
      const combined = new Uint8Array(bytes.length + extra.length); combined.set(bytes); combined.set(extra, bytes.length);
      await field("public-key-input", openpgp.armor(openpgp.enums.armor.publicKey, combined));
      await page.click("#import-public-keys"); await page.waitForFunction(() => document.querySelectorAll("#keyring-list li").length === 2);
      const output = await page.$eval("#keyring-output", (element) => element.value);
      assert.equal((output.match(/BEGIN PGP PUBLIC KEY BLOCK/g) || []).length, 2);
    });
    await test("the actual browser keyring accepts a synthetic legacy Ed25519/Curve25519 recipient without exposing private packets", async () => {
      const ecc = await openpgp.generateKey({ type: "ecc", curve: "curve25519Legacy", userIDs: [{ name: "Synthetic ECC browser import only" }], config: { v6Keys: false } });
      const expected = (await openpgp.readKey({ armoredKey: ecc.publicKey })).getFingerprint();
      await field("public-key-input", ecc.publicKey); await field("expected-fingerprint", expected);
      await page.click("#import-public-keys"); await status("keyring-status", "success");
      assert.equal(await page.$$eval("#keyring-list li", (elements) => elements.length), 3);
      assert.match(await page.$eval("#keyring-list", (element) => element.textContent), /v4 Ed25519 \/ Curve25519/);
      const exported = await page.$eval("#keyring-output", (element) => element.value);
      assert.doesNotMatch(exported, /PRIVATE KEY/);
      assert.equal((exported.match(/BEGIN PGP PUBLIC KEY BLOCK/g) || []).length, 3);
      await field("expected-fingerprint", "");
    });
    await test("real browser PUBLIC remembering is opt-in, survives reload with revalidation and restores no secrets", async () => {
      assert.equal(await page.evaluate(() => localStorage.length), 0);
      await page.click("#remember-public-keyring");
      const remembered = await page.evaluate(() => localStorage.getItem("openpgp-workbench.public-keyring.v1"));
      assert.doesNotMatch(remembered, /PRIVATE KEY|REVOCATION/);
      assert.ok(!remembered.includes(passphrase));
      assert.equal(Object.keys(JSON.parse(remembered)).length, 2);
      const consent = (dialog) => { if (dialog.type() === "beforeunload") void dialog.accept(); else void dialog.dismiss(); };
      page.on("dialog", consent);
      try { await page.reload({ waitUntil: "networkidle0" }); }
      finally { page.off("dialog", consent); }
      await page.waitForFunction(() => document.querySelectorAll("#keyring-list li").length === 3);
      assert.equal(await page.$eval("#remember-public-keyring", (element) => element.checked), true);
      assert.match(await page.$eval("#keyring-status", (element) => element.textContent), /revalidation/);
      for (const id of ["generated-public-output", "key-passphrase", "backup-fingerprint", "plaintext", "encrypted-output", "decrypted-output"]) assert.equal(await page.$eval(`#${id}`, (element) => element.value), "");
      await page.click("#keyring-tab");
    });
    await test("a secret-key paste is refused atomically and clearing drops all generated/ring fields", async () => {
      await field("public-key-input", privateArmor); await page.click("#import-public-keys"); await status("keyring-status", "error");
      assert.equal(await page.$$eval("#keyring-list li", (elements) => elements.length), 3);
      await page.click("#clear-all");
      assert.equal(await page.evaluate(() => localStorage.getItem("openpgp-workbench.public-keyring.v1")), null);
      assert.equal(await page.$$eval("#keyring-list li", (elements) => elements.length), 0);
      for (const id of ["generated-public-output", "public-key-input", "keyring-output", "key-passphrase", "backup-fingerprint"]) assert.equal(await page.$eval(`#${id}`, (element) => element.value), "");
      await page.reload({ waitUntil: "networkidle0" });
      assert.equal(await page.$$eval("#keyring-list li", (elements) => elements.length), 0);
      assert.equal(await page.$eval("#generated-public-output", (element) => element.value), "");
    });
    await test("actual Chromium imports and exports the fresh native-generated 16384-bit PUBLIC control with valid certification", {
      skip: !process.env.OPENPGP_LARGE_RSA_PUBLIC_CONTROL_PATH && "same-job synthetic public control is required in the large-rsa CI lane; no private fixture is used",
    }, async () => {
      const armor = await readFile(process.env.OPENPGP_LARGE_RSA_PUBLIC_CONTROL_PATH, "utf8");
      assert.doesNotMatch(armor, /PRIVATE KEY/);
      const control = await openpgp.readKey({ armoredKey: armor });
      assert.equal(control.getAlgorithmInfo().bits, 16384); assert.equal(control.getKeys().length, 2);
      assert.ok(control.getKeys().every(({ keyPacket }) => keyPacket.getAlgorithmInfo().bits === 16384));
      await page.click("#keyring-tab");
      await field("public-key-input", armor); await field("expected-fingerprint", control.getFingerprint());
      await page.click("#import-public-keys"); await status("keyring-status", "success");
      const rendered = await page.$eval("#keyring-list", (element) => element.textContent);
      assert.match(rendered, /v4 RSA-16384/); assert.match(rendered, /valid at import time/);
      const output = await page.$eval("#keyring-output", (element) => element.value);
      assert.equal((await openpgp.readKey({ armoredKey: output })).getFingerprint(), control.getFingerprint());
      assert.doesNotMatch(output, /PRIVATE KEY/);
      await page.click("#clear-all");
    });
    await test("mobile tabs fit, real keyboard navigation works and no page/external-request errors occurred", async () => {
      await page.setViewport({ width: 360, height: 800 });
      await page.focus("#encrypt-tab"); await page.keyboard.press("End");
      assert.equal(await page.$eval("#recovery-tab", (element) => element.getAttribute("aria-selected")), "true");
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await page.click("#keygen-tab");
      await page.screenshot({ path: join(directory, "workbench-mobile.png"), fullPage: true });
      assert.deepEqual(pageErrors, []); assert.deepEqual(external, []);
    });
  // Very large RSA can occupy a browser crypto/signing task beyond CDP's
  // default 180-second RPC budget. Keep the same explicit 20-minute bound as
  // this opt-in generation, without changing any other browser suite's default.
  }, rsaBits > 4096 ? { protocolTimeout: 20 * 60 * 1000 } : {});
} finally { server.close(); await rm(directory, { recursive: true, force: true }); }
