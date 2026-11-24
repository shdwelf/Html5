import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as openpgp from "openpgp";
import { browserDeps, serve, withBrowser, ROOT } from "./lib-browser.mjs";

const deps = await browserDeps();
if (!deps) throw new Error("The required v6 browser runner is unavailable.");
const generated = await openpgp.generateKey({
  type: "curve25519", userIDs: [{ name: "Synthetic v6 Chromium test only" }],
  subkeys: [{ sign: false }, { sign: true }, { sign: false }], config: { v6Keys: true, aeadProtect: true },
});
const key = await openpgp.readKey({ armoredKey: generated.publicKey });
const fingerprint = key.getFingerprint().toUpperCase();
const packets = key.toPacketList();
// A deliberately unsupported PUBLIC-only fixture, not a usable added key.
packets.push({ constructor: { tag: 14 }, write: () => Uint8Array.of(6, 0, 0, 0, 1, 35, 0, 0, 0, 4, 1, 2, 3, 4) }, key.subkeys[0].bindingSignatures[0]);
const original = openpgp.armor(openpgp.enums.armor.publicKey, packets.write());
const directory = await mkdtemp(join(tmpdir(), "html5-v6-browser-synthetic-"));
const { server, port } = await serve(join(ROOT, "public"));
const base = `http://127.0.0.1:${port}`;
try {
  await withBrowser(deps, async (browser) => {
    const page = await browser.newPage();
    await page.setViewport({ width: 1100, height: 900 });
    const errors = [], external = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== base) { external.push(request.url()); void request.abort(); }
      else void request.continue();
    });
    const session = await page.createCDPSession();
    await session.send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: directory });
    const downloaded = (name) => page.waitForFunction(async (target, filename) => {
      // Browser completion itself is checked by Node below; this wait only
      // verifies that the app has completed its explicit export operation.
      return !document.getElementById(target).disabled && document.getElementById("keyring-status").dataset.kind === "success";
    }, { timeout: 15000 }, "export-reduced-public-input", name).then(() => readFile(join(directory, name), "utf8"));
    const status = async (kind) => {
      await page.waitForFunction((expected) => document.getElementById("keyring-status").dataset.kind === expected, { timeout: 15000 }, kind);
    };
    const field = (id, value) => page.$eval(`#${id}`, (element, text) => { element.value = text; element.dispatchEvent(new Event("input", { bubbles: true })); }, value);
    let reduced;
    await test("real Chromium rejects unsupported subkeys without silently importing or stripping them", async () => {
      await page.goto(`${base}/apps/openpgp-workbench/index.html`, { waitUntil: "networkidle0" });
      await page.click("#keyring-tab");
      await field("public-key-input", original); await field("expected-fingerprint", fingerprint);
      await page.click("#import-public-keys"); await status("error");
      assert.match(await page.$eval("#keyring-status", (element) => element.textContent), /[Uu]nsupported/);
      assert.equal(await page.$$eval("#keyring-list li", (items) => items.length), 0);
    });
    await test("real Chromium exports a byte-preserved full original and a separately checked one-X25519 public subset", async () => {
      for (const [id, suffix] of [["export-full-public-input", "full-original"], ["export-reduced-public-input", "one-encryption-subkey"]]) {
        const filename = `public-${fingerprint}-${suffix}.asc`;
        const completed = new Promise((resolve, reject) => {
          const timeout = setTimeout(() => { session.off("Browser.downloadProgress", listener); reject(new Error("Synthetic public download did not complete")); }, 15000);
          const listener = (event) => { if (event.state === "completed") { clearTimeout(timeout); session.off("Browser.downloadProgress", listener); resolve(); } };
          session.on("Browser.downloadProgress", listener);
        });
        await session.send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: directory, eventsEnabled: true });
        await page.click(`#${id}`); await completed;
        const armor = await downloaded(filename);
        if (suffix === "full-original") assert.equal(armor, original);
        else {
          reduced = armor;
          const parsed = await openpgp.readKey({ armoredKey: armor });
          assert.equal(parsed.keyPacket.version, 6); assert.equal(parsed.subkeys.length, 1);
          assert.equal(parsed.getFingerprint().toUpperCase(), fingerprint);
          await parsed.verifyPrimaryKey(); await parsed.getEncryptionKey();
        }
        assert.equal(await page.$eval("#public-key-input", (element) => element.value), original);
      }
      assert.equal(await page.$$eval("#keyring-list li", (items) => items.length), 0, "exports must not imply import or trust");
    });
    if (reduced) {
      await test("real Chromium imports, detects and remembers the checked v6 public subset across reload, then explicitly forgets it", async () => {
        await field("public-key-input", reduced); await page.click("#import-public-keys"); await status("success");
        assert.match(await page.$eval("#keyring-list", (element) => element.textContent), /Usable bound encryption key detected/);
        await page.click("#remember-public-keyring");
        const saved = await page.evaluate(() => localStorage.getItem("openpgp-workbench.public-keyring.v1"));
        assert.doesNotMatch(saved, /PRIVATE KEY|passphrase/);
        await page.reload({ waitUntil: "networkidle0" }); await status("success");
        assert.match(await page.$eval("#keyring-status", (element) => element.textContent), /revalidation/);
        assert.equal(await page.$$eval("#keyring-list li", (items) => items.length), 1);
        assert.match(await page.$eval("#keyring-list", (element) => element.textContent), /v6 Ed25519 \/ X25519/);
        assert.equal(await page.$eval("#key-passphrase", (element) => element.value), "");
        await page.click("#clear-all");
        assert.equal(await page.evaluate(() => localStorage.length), 0);
      });
      await test("actual browser Web Crypto encrypts and decrypts a synthetic v6 recipient with v6 PKESK and SEIPDv2", async () => {
        const result = await page.evaluate(async (publicArmor, privateArmor) => {
          const pgp = await import("openpgp");
          const encryptionKeys = await pgp.readKey({ armoredKey: publicArmor });
          const ciphertext = await pgp.encrypt({ message: await pgp.createMessage({ text: "Synthetic browser v6 bytes — café 🔐" }), encryptionKeys, format: "binary", config: { v6Keys: true, aeadProtect: true } });
          const message = await pgp.readMessage({ binaryMessage: ciphertext });
          const versions = message.packets.map((packet) => packet.version);
          const recovered = await pgp.decrypt({ message, decryptionKeys: await pgp.readPrivateKey({ armoredKey: privateArmor }) });
          return { versions: [...versions], recovered: recovered.data };
        }, reduced, generated.privateKey);
        assert.deepEqual(result, { versions: [6, 2], recovered: "Synthetic browser v6 bytes — café 🔐" });
      });
    }
    await test("the v6 browser workflow produces no uncaught errors or external requests", () => {
      assert.deepEqual(errors, []); assert.deepEqual(external, []);
    });
    await page.close();
  });
} finally {
  await new Promise((resolve) => server.close(resolve));
  await rm(directory, { recursive: true, force: true });
}
