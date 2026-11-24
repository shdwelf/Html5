/** Real Chromium module workers + exact synthetic protected-key checks. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import * as pgp from "openpgp";
import { browserDeps, serve, withBrowser, ROOT } from "./lib-browser.mjs";

const deps = await browserDeps();
if (!deps && process.env.REQUIRE_OPENPGP_BROWSER === "1") throw new Error("Required recovery Chromium runner unavailable; refusing a silent skip.");
if (!deps) { console.log("Recovery Chromium: SKIPPED (optional local browser dependencies unavailable)"); process.exit(0); }
const secret = "Synthetic Café Unlock!", config = { v6Keys: false, s2kIterationCountByte: 96 };
const [v4, v6, slow, plain] = await Promise.all([
  pgp.generateKey({ type: "ecc", curve: "curve25519Legacy", userIDs: [{ name: "Synthetic browser recovery only" }], passphrase: secret, config }),
  pgp.generateKey({ type: "curve25519", userIDs: [{ name: "Synthetic browser v6 recovery only" }], passphrase: secret, config: { ...config, v6Keys: true, aeadProtect: true } }),
  pgp.generateKey({ type: "ecc", curve: "curve25519Legacy", userIDs: [{ name: "Synthetic worker cancellation only" }], passphrase: "Synthetic cancellation key passphrase", config: { ...config, s2kIterationCountByte: 255 } }),
  pgp.generateKey({ type: "ecc", curve: "curve25519Legacy", userIDs: [{ name: "Synthetic unprotected negative only" }], config }),
]);
const fp = async (bundle) => (await pgp.readPrivateKey({ armoredKey: bundle.privateKey })).getFingerprint().toUpperCase();
const v4fp = await fp(v4), v6fp = await fp(v6), slowfp = await fp(slow);
const argonMetadata = await pgp.readPrivateKey({ armoredKey: v6.privateKey });
argonMetadata.keyPacket.s2k = { type: "argon2", write: () => Uint8Array.of(4, ...new Uint8Array(16), 255, 255, 31) };
const argon = argonMetadata.armor(); // Invalid protected metadata only; never derive Argon2.
const { server, port } = await serve(join(ROOT, "public")), base = `http://127.0.0.1:${port}`;
try {
  await withBrowser(deps, async (browser) => {
    const page = await browser.newPage(), errors = [], external = [], workers = [], destroyed = new Set(), downloads = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("workercreated", (worker) => workers.push(worker)); page.on("workerdestroyed", (worker) => destroyed.add(worker));
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== base) { external.push(request.url()); void request.abort(); }
      else void request.continue();
    });
    const session = await page.createCDPSession();
    await session.send("Browser.setDownloadBehavior", { behavior: "deny", eventsEnabled: true }); session.on("Browser.downloadWillBegin", (event) => downloads.push(event));
    const field = (id, value) => page.$eval(`#${id}`, (node, text) => { node.value = text; node.dispatchEvent(new Event("input", { bubbles: true })); }, value);
    const text = (id) => page.$eval(`#${id}`, (node) => node.textContent);
    async function clear() { await page.click("#recovery-clear"); }
    async function load(bundle, wordlist, { hint = "", variants = false } = {}) {
      await clear(); await field("recovery-private-key", bundle.privateKey); await field("recovery-wordlist", wordlist); await field("recovery-hint", hint);
      if (variants) await page.click("#recovery-variants");
    }
    async function preview({ error = false } = {}) {
      await page.click("#recovery-preview");
      await page.waitForFunction(() => !document.getElementById("recovery-preview").disabled, { timeout: 20000 });
      const kind = await page.$eval("#recovery-status", (node) => node.dataset.kind);
      assert.equal(kind, error ? "error" : "success", await text("recovery-status"));
    }
    async function start(expected) { await field("recovery-fingerprint", expected); await page.click("#recovery-owner-ack"); await page.click("#recovery-start"); }
    async function finished(pattern, kind) {
      await page.waitForFunction((source) => new RegExp(source).test(document.getElementById("recovery-status").textContent), { timeout: 20000 }, pattern.source);
      if (kind) assert.equal(await page.$eval("#recovery-status", (node) => node.dataset.kind), kind, await text("recovery-status"));
    }
    function workerEvent(event, predicate) {
      return new Promise((resolve, reject) => {
        const listener = (worker) => { if (!predicate(worker)) return; clearTimeout(timer); page.off(event, listener); resolve(worker); };
        const timer = setTimeout(() => { page.off(event, listener); reject(new Error(`Recovery ${event} event missing`)); }, 10000);
        page.on(event, listener);
      });
    }

    await test("Chromium loads the fresh local recovery UI empty with no worker, secret save or automatic attempt", async () => {
      await page.goto(`${base}/apps/openpgp-workbench/index.html`, { waitUntil: "networkidle0" }); await page.click("#recovery-tab");
      assert.equal(await page.evaluate(() => isSecureContext && Boolean(crypto.subtle)), true);
      for (const id of ["recovery-private-key", "recovery-wordlist", "recovery-hint", "recovery-match"]) assert.equal(await page.$eval(`#${id}`, (node) => node.value), "");
      assert.equal(await page.$eval("#recovery-start", (node) => node.disabled), true); assert.equal(workers.length, 0);
      assert.equal(await page.evaluate(() => localStorage.length + sessionStorage.length), 0);
    });
    await test("a real worker previews folded fuzzy matches but only the exact second candidate unlocks every packet, with explicit reveal only", async () => {
      await load(v4, `${secret.toUpperCase()}\n${secret}`, { hint: secret.toLowerCase() }); await preview();
      assert.match(await text("recovery-key-identity"), new RegExp(v4fp)); assert.match(await text("recovery-summary"), /2 candidates/);
      assert.ok(!(await text("recovery-candidates")).includes(secret)); assert.equal(await page.$eval("#recovery-start", (node) => node.disabled), true);
      const beforeMismatch = workers.length;
      await field("recovery-fingerprint", "B".repeat(40)); await page.click("#recovery-owner-ack"); await page.click("#recovery-start"); await finished(/exact full/, "error");
      assert.equal(workers.length, beforeMismatch, "fingerprint mismatch must not start a recovery worker");
      await field("recovery-fingerprint", v4fp); await page.click("#recovery-start"); await finished(/Exact candidate #2 unlocked/, "success");
      assert.match(await text("recovery-progress-count"), /2 \/ 2/);
      for (const id of ["recovery-private-key", "recovery-wordlist", "recovery-hint", "recovery-match"]) assert.equal(await page.$eval(`#${id}`, (node) => node.value), "");
      await page.click("#recovery-reveal-match"); assert.equal(await page.$eval("#recovery-match", (node) => node.value), secret);
      await page.click("#recovery-reveal-match"); assert.equal(await page.$eval("#recovery-match", (node) => node.value), "");
      assert.equal(await page.$$eval("#keyring-list li", (nodes) => nodes.length), 0); assert.equal(await page.evaluate(() => localStorage.length + sessionStorage.length), 0);
    });
    await test("bounded opt-in adjacent-typo generation really recovers a candidate absent from the wordlist", async () => {
      const chars = Array.from(secret), hint = [chars[1], chars[0], ...chars.slice(2)].join("");
      await load(v4, "", { hint, variants: true }); await preview();
      const total = await page.$eval("#recovery-candidates", (node) => node.children.length); assert.ok(total > 1 && total <= 256);
      await start(v4fp); await finished(/Exact candidate #\d+ unlocked/, "success");
      await page.click("#recovery-reveal-match"); assert.equal(await page.$eval("#recovery-match", (node) => node.value), secret); await clear();
    });
    await test("the actual local worker accepts protected standard-AEAD v6 Ed25519/X25519 only with its exact 64-hex fingerprint", async () => {
      await load(v6, `definitely wrong\n${secret}`); await preview();
      assert.match(await text("recovery-key-identity"), /v6-25519/); assert.equal(v6fp.length, 64);
      await start(v6fp); await finished(/Exact candidate #2 unlocked and validated all 2/, "success"); await clear();
    });
    await test("unprotected/public/Argon2 metadata fail in the actual worker before attempts; bounded no-match never promises impossible recovery", async () => {
      for (const [key, pattern] of [[plain.privateKey, /Every secret packet must be protected/], [v4.publicKey, /PRIVATE key/], [argon, /Argon2-protected keys/]]) {
        await clear(); await field("recovery-private-key", key); await field("recovery-wordlist", "wrong"); await preview({ error: true });
        assert.match(await text("recovery-status"), pattern); assert.match(await text("recovery-progress-count"), /0 \/ 0/);
        assert.equal(await page.$eval("#recovery-start", (node) => node.disabled), true);
      }
      await load(v4, secret.toUpperCase()); await preview(); await start(v4fp); await finished(/bounded plan is exhausted, not all possible/);
      assert.notEqual(await page.$eval("#recovery-status", (node) => node.dataset.kind), "success"); await clear();
    });
    for (const action of ["recovery-stop", "recovery-clear", "clear-all"]) await test(`${action} terminates an actual in-flight expensive-S2K worker; the page stays responsive and no match arrives`, async () => {
      await load(slow, Array.from({ length: 256 }, (_, i) => `synthetic wrong candidate ${i}`).join("\n")); await preview();
      const created = workerEvent("workercreated", (worker) => worker.url().endsWith("/recovery-worker.mjs"));
      await start(slowfp); const worker = await created, stopped = workerEvent("workerdestroyed", (candidate) => candidate === worker);
      await page.waitForFunction(() => Number(document.getElementById("recovery-progress").value) >= 1, { timeout: 10000 });
      assert.equal(await page.evaluate(() => 6 * 7), 42);
      await page.click(`#${action}`); await stopped; await delay(150);
      assert.equal(await page.$eval("#recovery-match", (node) => node.value), ""); assert.equal(await page.$eval("#recovery-reveal-match", (node) => node.hidden), true);
      assert.equal(await page.$eval("#recovery-start", (node) => node.disabled), true);
      assert.equal(await page.$eval("#recovery-stop", (node) => node.disabled), true);
      assert.match(await text("recovery-status"), action === "recovery-stop" ? /Stopped: .*not a completed\/exhausted/ : /cleared; any worker terminated/);
      await clear();
    });
    await test("navigation terminates active recovery and restores no secret input, candidate, result or storage", async () => {
      await load(slow, Array.from({ length: 256 }, (_, i) => `synthetic navigation negative ${i}`).join("\n")); await preview();
      const created = workerEvent("workercreated", (worker) => worker.url().endsWith("/recovery-worker.mjs")); await start(slowfp);
      const worker = await created, stopped = workerEvent("workerdestroyed", (candidate) => candidate === worker);
      const accept = (dialog) => { if (dialog.type() === "beforeunload") void dialog.accept(); else void dialog.dismiss(); };
      page.on("dialog", accept);
      try { await page.reload({ waitUntil: "networkidle0" }); await stopped; } finally { page.off("dialog", accept); }
      for (const id of ["recovery-private-key", "recovery-wordlist", "recovery-hint", "recovery-match"]) assert.equal(await page.$eval(`#${id}`, (node) => node.value), "");
      assert.equal(await page.evaluate(() => localStorage.length + sessionStorage.length), 0); assert.equal(await page.$eval("#recovery-candidates", (node) => node.children.length), 0);
    });
    await test("mobile keyboard navigation and layout include recovery; observed page requests and worker URLs are local, with no download/page errors", async () => {
      await page.setViewport({ width: 360, height: 800 }); await page.focus("#encrypt-tab"); await page.keyboard.press("End");
      assert.equal(await page.$eval("#recovery-tab", (node) => node.getAttribute("aria-selected")), "true");
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await page.keyboard.press("Home"); assert.equal(await page.$eval("#encrypt-tab", (node) => node.getAttribute("aria-selected")), "true");
      assert.ok(workers.length >= 10); assert.ok(workers.every((worker) => worker.url() === `${base}/apps/openpgp-workbench/recovery-worker.mjs`));
      assert.ok(workers.every((worker) => destroyed.has(worker)), "every dedicated recovery worker must finish/terminate");
      assert.deepEqual(external, []); assert.deepEqual(downloads, []); assert.deepEqual(errors, []);
    });
    await page.close();
  });
} finally { server.close(); }
