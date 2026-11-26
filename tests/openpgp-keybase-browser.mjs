/** Real Chromium/CORS/local parser controls; all remote responses are synthetic, never live Keybase keys. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { join } from "node:path";
import * as pgp from "openpgp";
import { browserDeps, serve, withBrowser, ROOT } from "./lib-browser.mjs";

const deps = await browserDeps();
if (!deps && process.env.REQUIRE_OPENPGP_BROWSER === "1") throw new Error("Required Keybase Chromium runner is unavailable.");
if (!deps) { console.log("Keybase browser: SKIPPED (optional Chromium dependencies unavailable)"); process.exit(0); }
const [alice, bob] = await Promise.all([
  pgp.generateKey({ type: "ecc", curve: "curve25519Legacy", userIDs: [{ name: "Synthetic Alice Keybase browser only" }], config: { v6Keys: false } }),
  pgp.generateKey({ type: "curve25519", userIDs: [{ name: "Synthetic Bob Keybase browser only" }], config: { v6Keys: true } }),
]);
const fingerprint = (await pgp.readKey({ armoredKey: bob.publicKey })).getFingerprint().toUpperCase();
const { server, port } = await serve(join(ROOT, "public")), base = `http://127.0.0.1:${port}`;
try {
  await withBrowser(deps, async (browser) => {
    const page = await browser.newPage();
    await page.setViewport({ width: 1100, height: 900 });
    const external = [], requests = [], errors = [], interceptionErrors = [];
    let mode = "success";
    page.on("pageerror", (error) => errors.push(error.message));
    const session = await page.createCDPSession();
    const cookie = await session.send("Network.setCookie", { url: "https://keybase.io/", name: "synthetic_keybase_session", value: "must-not-send", secure: true, sameSite: "None" });
    assert.equal(cookie.success, true);
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      void (async () => {
        const url = request.url();
        if (url.startsWith("https://keybase.io/")) {
          requests.push({ url, method: request.method(), headers: request.headers(), body: request.postData() });
          if (mode === "pending") return; // The test cancels, then tries a late reply.
          const headers = mode === "cors-error" ? {} : { "Access-Control-Allow-Origin": "*" };
          if (mode === "redirect") await request.respond({ status: 302, headers: { ...headers, Location: "https://unexpected.invalid/rogue.asc" } });
          else await request.respond({ status: mode === "not-found" ? 404 : 200, contentType: "text/plain; charset=utf-8", headers, body: mode === "malformed" ? `${alice.publicKey}\n-----BEGIN PGP PUBLIC KEY BLOCK-----\n` : alice.publicKey + bob.publicKey });
        } else if (/^https?:/.test(url) && new URL(url).origin !== base) {
          external.push(url); await request.abort();
        } else await request.continue();
      })().catch((error) => interceptionErrors.push(error.message));
    });
    const field = (id, value) => page.$eval(`#${id}`, (element, text) => { element.value = text; element.dispatchEvent(new Event("input", { bubbles: true })); }, value);
    const text = (id) => page.$eval(`#${id}`, (element) => element.textContent);
    const value = (id) => page.$eval(`#${id}`, (element) => element.value);
    const status = async (id, kind) => {
      await page.waitForFunction((target, expected) => document.getElementById(target).dataset.kind === expected || (expected === "success" && document.getElementById(target).dataset.kind === "error"), { timeout: 10000 }, id, kind);
      assert.equal(await page.$eval(`#${id}`, (element) => element.dataset.kind), kind, await text(id));
    };
    const openLookup = async () => { await page.click("#keyring-tab"); await page.$eval("#keybase-discovery", (element) => { element.open = true; }); };
    const consent = async () => { if (!(await page.$eval("#keybase-network-ack", (element) => element.checked))) await page.click("#keybase-network-ack"); };
    const lateReply = async (request) => { try { await request.respond({ status: 200, contentType: "text/plain", headers: { "Access-Control-Allow-Origin": "*" }, body: alice.publicKey }); } catch { /* Chromium already discarded its canceled interception. */ } };

    await test("Chromium loads the shipped local modules without any Keybase request or inferred identity", async () => {
      await page.goto(`${base}/apps/openpgp-workbench/index.html`, { waitUntil: "networkidle0" });
      assert.equal(await page.evaluate(() => isSecureContext && Boolean(crypto.subtle)), true);
      await openLookup(); await field("keybase-username", "alice");
      assert.equal(await page.$eval("#keybase-network-ack", (element) => element.checked), false);
      await page.click("#keybase-lookup"); await status("keybase-status", "error");
      assert.match(await text("keybase-status"), /Acknowledge/); assert.deepEqual(requests, []);
      await consent(); assert.deepEqual(requests, [], "checkbox does not launch a request");
      await field("keybase-username", "@alice"); await page.click("#keybase-lookup"); await status("keybase-status", "error");
      assert.deepEqual(requests, []); assert.deepEqual(external, []);
    });
    await test("an explicit CORS GET previews all locally parsed v4/v6 public certificates without importing or disclosing workspace secrets", async () => {
      await field("public-key-input", "keep local public input"); await field("expected-fingerprint", "0".repeat(40));
      await field("plaintext", "synthetic private message must stay local"); await field("recovery-hint", "synthetic private hint must stay local");
      await field("keybase-username", "ALICE"); await page.click("#keybase-lookup"); await status("keybase-status", "success");
      assert.equal(requests.length, 1); assert.equal(requests[0].url, "https://keybase.io/alice/pgp_keys.asc"); assert.equal(requests[0].method, "GET");
      assert.equal(requests[0].body, undefined); assert.equal(requests[0].headers.cookie, undefined); assert.equal(requests[0].headers.referer ?? "", "", "no referrer value is disclosed (CDP may report an empty header)");
      assert.doesNotMatch(JSON.stringify(requests), /synthetic private|must-not-send/);
      assert.equal(await page.$$eval("#keybase-results li", (nodes) => nodes.length), 2);
      assert.match((await text("keybase-results")).replaceAll(" ", ""), new RegExp(fingerprint));
      assert.match(await text("keybase-source"), /proofs have NOT been verified/);
      assert.equal(await value("public-key-input"), "keep local public input"); assert.equal(await value("expected-fingerprint"), "0".repeat(40));
      assert.equal(await value("keyring-output"), ""); assert.equal(await page.evaluate(() => localStorage.length), 0);
    });
    await test("a chosen result only stages public armor; exact independent fingerprint gates and local fuzzy search remain intact", async () => {
      const stages = await page.$$("#keybase-results button"); await stages[1].click();
      assert.equal(await value("expected-fingerprint"), "0".repeat(40)); assert.equal(await value("keyring-output"), "");
      assert.equal((await pgp.readKey({ armoredKey: await value("public-key-input") })).getFingerprint().toUpperCase(), fingerprint);
      await page.click("#import-public-keys"); await status("keyring-status", "error"); assert.match(await text("keyring-status"), /Fingerprint mismatch/);
      assert.equal(await value("keyring-output"), "");
      await field("expected-fingerprint", fingerprint); await page.click("#import-public-keys"); await status("keyring-status", "success");
      assert.match(await text("keyring-list"), /unverified claims/);
      const exported = await value("keyring-output"); await field("keyring-search", "bbo");
      assert.equal(await page.$$eval("#keyring-list li", (nodes) => nodes.length), 1);
      assert.equal(await page.$eval("#keyring-list li", (node) => node.dataset.searchMatch), "fuzzy");
      assert.equal(await value("keyring-output"), exported); assert.equal(requests.length, 1);
    });
    await test("Keybase public review fits a narrow mobile viewport without overflowing full v6 fingerprints", async () => {
      await page.setViewport({ width: 390, height: 844 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      assert.equal(await page.$eval("#keybase-result", (element) => element.hidden), false);
      await page.setViewport({ width: 1100, height: 900 });
    });
    await test("Cancel aborts a real browser fetch and a late synthetic response cannot replace local input or the keyring", async () => {
      const original = await value("public-key-input"), exported = await value("keyring-output");
      mode = "pending"; await field("keybase-username", "alice");
      const requested = page.waitForRequest((request) => request.url() === "https://keybase.io/alice/pgp_keys.asc");
      await page.click("#keybase-lookup"); const request = await requested;
      await page.click("#keybase-cancel"); const message = await text("keybase-status");
      await lateReply(request);
      assert.equal(await page.$eval("#keybase-result", (element) => element.hidden), true);
      assert.equal(await text("keybase-status"), message); assert.equal(await value("public-key-input"), original); assert.equal(await value("keyring-output"), exported);
    });
    for (const [behavior, message] of [["redirect", /lookup failed|unexpected response/], ["cors-error", /CORS\/privacy/], ["not-found", /No published OpenPGP/], ["malformed", /entire Keybase file could not be validated/]]) {
      await test(`real browser ${behavior} failure preserves the local ring without a proxy, redirect follow or retry`, async () => {
        mode = behavior; const count = requests.length, exported = await value("keyring-output");
        await field("keybase-username", "alice"); await page.click("#keybase-lookup"); await status("keybase-status", "error");
        assert.match(await text("keybase-status"), message); assert.equal(requests.length, count + 1);
        assert.equal(await value("keyring-output"), exported); assert.equal(await page.$eval("#keybase-result", (element) => element.hidden), true);
        assert.deepEqual(external, []);
      });
    }
    await test("navigation clears consent/username/preview and never automatically restores a pending lookup", async () => {
      await page.click("#clear-all"); await openLookup(); await field("keybase-username", "alice"); await consent();
      mode = "pending"; const requested = page.waitForRequest((request) => request.url() === "https://keybase.io/alice/pgp_keys.asc");
      await page.click("#keybase-lookup"); const request = await requested, count = requests.length;
      await page.reload({ waitUntil: "domcontentloaded" }); await lateReply(request);
      assert.equal(await value("keybase-username"), ""); assert.equal(await page.$eval("#keybase-network-ack", (element) => element.checked), false);
      assert.equal(await page.$eval("#keybase-result", (element) => element.hidden), true); assert.equal(requests.length, count);
    });
    await test("offline Android UA disables lookup without a probe; network UA enables only the unchecked opt-in", async () => {
      const agent = await page.evaluate(() => navigator.userAgent), count = requests.length; mode = "success";
      await page.setUserAgent(`${agent} Html5Library/1.1.0`); await page.reload({ waitUntil: "domcontentloaded" }); await openLookup();
      assert.equal(await page.$eval("#keybase-lookup", (element) => element.disabled), true); assert.match(await text("keybase-status"), /offline Android build/);
      await page.click("#keybase-clear"); assert.equal(await page.$eval("#keybase-lookup", (element) => element.disabled), true);
      await page.setUserAgent(`${agent} Html5Library/1.1.0-network`); await page.reload({ waitUntil: "domcontentloaded" });
      assert.equal(await page.$eval("#keybase-lookup", (element) => element.disabled), false); assert.equal(await page.$eval("#keybase-network-ack", (element) => element.checked), false);
      assert.equal(requests.length, count); assert.deepEqual(external, []); assert.deepEqual(errors, []); assert.deepEqual(interceptionErrors, []);
    });
    await page.close();
  });
} finally { await new Promise((resolve) => server.close(resolve)); }
