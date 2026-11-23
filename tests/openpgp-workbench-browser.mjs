/** Optional real Chromium + Web Crypto + actual download checks. Synthetic keys only. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { browserDeps, serve, withBrowser, ROOT } from "./lib-browser.mjs";
import { generateCompatibilityKey } from "../apps/openpgp-workbench/keyring.mjs";
import * as openpgp from "openpgp";

const deps = await browserDeps();
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
    const status = (id, kind) => page.waitForFunction((target, expected) => document.getElementById(target).dataset.kind === expected, { timeout: 45000 }, id, kind);

    await test("real Chromium loads the local module/importmap with Web Crypto and no inferred identity", async () => {
      await page.goto(`${base}/apps/openpgp-workbench/index.html`, { waitUntil: "networkidle0" });
      assert.equal(await page.evaluate(() => window.isSecureContext && Boolean(crypto.subtle)), true);
      assert.equal(await page.$eval("#key-name", (element) => element.value), "");
      assert.equal(await page.$eval("#key-email", (element) => element.value), "");
      assert.equal(await page.$eval("#generated-public-output", (element) => element.value), "");
      assert.equal(await page.$eval("#download-private-key", (element) => element.disabled), true);
      assert.deepEqual(external, []);
    });
    await test("real Web Crypto generates the two RSA-3072 keys and displays only the public certificate", async () => {
      await page.click("#keygen-tab");
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
    await test("actual protected/private and revocation downloads require consent plus a matching full fingerprint", async () => {
      await page.click("#download-public-key");
      assert.equal(await downloaded(`${fingerprint}-PUBLIC.asc`), publicArmor);
      await page.click("#key-backup-ack"); await field("backup-fingerprint", "0".repeat(40));
      await page.click("#download-private-key"); await status("keygen-status", "error");
      await assert.rejects(stat(join(directory, `${fingerprint}-SECRET.asc`)), /ENOENT/);
      await field("backup-fingerprint", fingerprint); await page.click("#download-private-key");
      privateArmor = await downloaded(`${fingerprint}-SECRET.asc`);
      const encrypted = await openpgp.readPrivateKey({ armoredKey: privateArmor });
      assert.equal(encrypted.isDecrypted(), false); assert.equal(encrypted.getKeys().length, 2);
      assert.ok(encrypted.getKeys().every(({ keyPacket }) => keyPacket.s2k.c === 0xff && keyPacket.getAlgorithmInfo().bits === 3072));
      const unlocked = await openpgp.decryptKey({ privateKey: encrypted, passphrase });
      try { assert.equal(unlocked.getFingerprint().toUpperCase(), fingerprint); } finally { unlocked.clearPrivateParams(); }
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
    await test("a secret-key paste is refused atomically and clearing drops all generated/ring fields", async () => {
      await field("public-key-input", privateArmor); await page.click("#import-public-keys"); await status("keyring-status", "error");
      assert.equal(await page.$$eval("#keyring-list li", (elements) => elements.length), 2);
      await page.click("#clear-all");
      assert.equal(await page.$$eval("#keyring-list li", (elements) => elements.length), 0);
      for (const id of ["generated-public-output", "public-key-input", "keyring-output", "key-passphrase", "backup-fingerprint"]) assert.equal(await page.$eval(`#${id}`, (element) => element.value), "");
      await page.reload({ waitUntil: "networkidle0" });
      assert.equal(await page.$$eval("#keyring-list li", (elements) => elements.length), 0);
      assert.equal(await page.$eval("#generated-public-output", (element) => element.value), "");
    });
    await test("mobile tabs fit, real keyboard navigation works and no page/external-request errors occurred", async () => {
      await page.setViewport({ width: 360, height: 800 });
      await page.focus("#encrypt-tab"); await page.keyboard.press("End");
      assert.equal(await page.$eval("#keyring-tab", (element) => element.getAttribute("aria-selected")), "true");
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await page.click("#keygen-tab");
      await page.screenshot({ path: join(directory, "workbench-mobile.png"), fullPage: true });
      assert.deepEqual(pageErrors, []); assert.deepEqual(external, []);
    });
  });
} finally { server.close(); await rm(directory, { recursive: true, force: true }); }
