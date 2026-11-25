/** Exercise the exact test-APK fixture against real Chromium workers before Android CI. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { browserDeps, serve, withBrowser, ROOT } from "./lib-browser.mjs";

const deps = await browserDeps();
if (!deps && process.env.REQUIRE_OPENPGP_BROWSER === "1") throw new Error("Required recovery-fixture Chromium unavailable; refusing a silent skip.");
if (!deps) { console.log("Android recovery fixture Chromium: SKIPPED (optional local browser unavailable)"); process.exit(0); }
const fixture = await readFile(join(ROOT, "apps/html5-offline-launcher/app/src/androidTest/assets/openpgp-recovery-smoke.js"), "utf8");
const { server, port } = await serve(join(ROOT, "public")), base = `http://127.0.0.1:${port}`;
try {
  await withBrowser(deps, async (browser) => {
    async function setup(mode) {
      const page = await browser.newPage(), errors = [], external = [], workers = [], destroyed = new Set(), downloads = [];
      page.on("pageerror", (error) => errors.push(error.name));
      page.on("workercreated", (worker) => workers.push(worker));
      page.on("workerdestroyed", (worker) => destroyed.add(worker));
      await page.setRequestInterception(true);
      page.on("request", (request) => {
        if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== base) { external.push(request.url()); void request.abort(); }
        else void request.continue();
      });
      const session = await page.createCDPSession();
      await session.send("Browser.setDownloadBehavior", { behavior: "deny", eventsEnabled: true });
      session.on("Browser.downloadWillBegin", () => downloads.push(true));
      await page.goto(`${base}/apps/openpgp-workbench/index.html`, { waitUntil: "networkidle0" });
      await page.click("#clear-all"); await page.click("#recovery-tab");
      await page.evaluate(fixture);
      await page.evaluate((kind) => { void __androidRecoverySmoke.create(kind); }, mode);
      await page.waitForFunction(() => __androidRecoverySmoke.snapshot().ready || __androidRecoverySmoke.snapshot().failed, { timeout: 30000 });
      const snapshot = () => page.evaluate(() => __androidRecoverySmoke.snapshot());
      const initial = await snapshot();
      assert.equal(initial.failed, false, "synthetic fixture generation must succeed");
      assert.equal(initial.secure, true); assert.deepEqual(initial.records, []);
      const status = () => page.$eval("#recovery-status", (node) => node.textContent);
      async function preview(kind = "success") {
        await page.click("#recovery-preview");
        await page.waitForFunction((wanted) => !document.getElementById("recovery-preview").disabled && document.getElementById("recovery-status").dataset.kind === wanted, { timeout: 20000 }, kind);
      }
      async function text(expected) {
        await page.waitForFunction((wanted) => document.getElementById("recovery-status").textContent.includes(wanted), { timeout: 30000 }, expected);
      }
      async function load(name, mode = "exact") {
        await page.click("#recovery-clear");
        await page.evaluate((profile, kind) => __androidRecoverySmoke.load(profile, kind), name, mode);
      }
      async function start() {
        await page.evaluate(() => __androidRecoverySmoke.confirmFingerprint());
        await page.click("#recovery-owner-ack"); await page.click("#recovery-start");
      }
      async function checkWorkers() {
        const state = await snapshot();
        assert.equal(state.live, 0);
        for (const record of state.records) {
          assert.equal(record.url, `${base}/apps/openpgp-workbench/recovery-worker.mjs`);
          assert.equal(record.type, "module"); assert.equal(record.terminated, true);
        }
        // Native termination is asynchronous. Await the actual browser events,
        // not an arbitrary short sleep or the fixture's terminate-call flag.
        await new Promise((resolve, reject) => {
          const settled = () => workers.length === state.records.length && workers.every((worker) => destroyed.has(worker));
          const cleanup = () => { clearTimeout(timer); page.off("workercreated", changed); page.off("workerdestroyed", changed); };
          const changed = () => { if (settled()) { cleanup(); resolve(); } };
          const timer = setTimeout(() => { cleanup(); reject(new Error("Every actual recovery worker must be destroyed within 10 seconds")); }, 10000);
          page.on("workercreated", changed); page.on("workerdestroyed", changed); changed();
        });
        assert.equal(workers.length, state.records.length, "every observation must correspond to a real browser worker");
        assert.ok(workers.every((worker) => destroyed.has(worker)), "every actual worker must be destroyed");
      }
      async function checkBoundaries() {
        const state = await snapshot();
        assert.equal(state.noPersistence, true); assert.equal(state.noKeyringImport, true);
        assert.deepEqual(errors, []); assert.deepEqual(external, []); assert.deepEqual(downloads, []);
      }
      return { page, snapshot, status, preview, text, load, start, checkWorkers, checkBoundaries };
    }

    await test("the exact Android fixture runs real v4/v6 inspect/recovery workers, fingerprint refusal and explicit reveal without persistence", async () => {
      const context = await setup("fast"), { page, snapshot, preview, text, load, checkWorkers, checkBoundaries } = context;
      try {
        for (const profile of ["v4", "v6"]) {
          await load(profile); const before = (await snapshot()).records.length;
          assert.equal((await snapshot()).startDisabled, true);
          await preview(); const planned = await snapshot();
          assert.equal(planned.identityMatches, true); assert.equal(planned.fingerprintLength, profile === "v4" ? 40 : 64);
          assert.equal(planned.previewCount, 2); assert.equal(planned.previewHidesValues, true); assert.equal(planned.startDisabled, true);
          assert.equal(planned.attempts, 0); assert.equal(planned.records.length, before + 1);
          assert.equal(planned.records.at(-1).operation, "inspect"); await checkWorkers();
          await page.evaluate(() => __androidRecoverySmoke.confirmFingerprint(true));
          await page.click("#recovery-owner-ack"); await page.click("#recovery-start"); await text("exact full");
          assert.equal((await snapshot()).records.length, before + 1);
          await page.evaluate(() => __androidRecoverySmoke.confirmFingerprint());
          await page.click("#recovery-start"); await text("Exact candidate #2 unlocked and validated all 2");
          const result = await snapshot();
          assert.equal(result.attempts, 2); assert.equal(result.inputsCleared, true); assert.equal(result.matchEmpty, true);
          assert.equal(result.matchHidden, true); assert.equal(result.revealHidden, false); assert.equal(result.records.length, before + 2);
          await page.click("#recovery-reveal-match"); assert.equal(await page.evaluate(() => __androidRecoverySmoke.revealedMatchIsExact()), true);
          await page.click("#recovery-reveal-match"); assert.equal((await snapshot()).matchEmpty, true);
          await checkWorkers(); await checkBoundaries();
        }
      } finally { await page.close(); }
    });
    await test("the same fixture refuses public/unprotected/Argon2 inputs and never labels bounded case-mismatched exhaustion a success", async () => {
      const context = await setup("fast"), { page, snapshot, preview, text, load, start, checkWorkers, checkBoundaries } = context;
      try {
        for (const [profile, reason] of [["public", "PRIVATE key"], ["unprotected", "Every secret packet must be protected"], ["argon2", "Argon2-protected keys"]]) {
          await load(profile, "no-match"); await preview("error"); await text(reason);
          const refused = await snapshot();
          assert.equal(refused.attempts, 0); assert.equal(refused.startDisabled, true); assert.equal(refused.revealHidden, true);
          assert.ok(refused.records.every((record) => record.operation === "inspect"));
          await checkWorkers(); await checkBoundaries();
        }
        assert.ok((await snapshot()).records.length >= 2);
        await load("v4", "no-match"); await preview(); await start(); await text("bounded plan is exhausted, not all possible passphrases");
        const result = await snapshot(); assert.equal(result.attempts, 1); assert.equal(result.matchEmpty, true); assert.equal(result.revealHidden, true);
        assert.notEqual(await page.$eval("#recovery-status", (node) => node.dataset.kind), "success");
        await checkWorkers(); await checkBoundaries();
      } finally { await page.close(); }
    });
    await test("all three real Stop/Clear actions destroy actual expensive-S2K workers after progress and suppress late matches", async () => {
      const context = await setup("slow"), { page, snapshot, preview, text, load, start, checkWorkers, checkBoundaries } = context;
      try {
        for (const action of ["recovery-stop", "recovery-clear", "clear-all"]) {
          await load("slow", "slow"); await preview(); await start();
          await page.waitForFunction(() => __androidRecoverySmoke.snapshot().attempts >= 1 && __androidRecoverySmoke.snapshot().live === 1, { timeout: 30000 });
          const running = await snapshot();
          assert.equal(running.records.at(-1).operation, "recover");
          assert.equal(running.records.at(-1).total, 256);
          assert.equal(running.records.at(-1).terminated, false);
          assert.equal(await page.evaluate(() => 6 * 7), 42);
          await page.click(`#${action}`); await text(action === "recovery-stop" ? "not a completed/exhausted search" : "cleared; any worker terminated");
          const stopped = await snapshot();
          for (const key of ["matchEmpty", "revealHidden", "startDisabled", "stopDisabled"]) assert.equal(stopped[key], true);
          await checkWorkers(); await checkBoundaries(); await delay(350);
          assert.equal((await snapshot()).attempts, stopped.attempts); assert.equal((await snapshot()).matchEmpty, true); assert.equal((await snapshot()).revealHidden, true);
        }
        assert.equal((await snapshot()).records.length, 6);
      } finally { await page.close(); }
    });
  });
} finally { server.close(); }
