/** Real Chromium boots, Web Audio and actual sound-app exports. No real microphone capture. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { browserDeps, serve, withBrowser, ROOT } from "./lib-browser.mjs";

const deps = await browserDeps();
if (!deps) throw new Error("Sound browser validation requires the locked Chromium harness; refusing a silent skip.");
const { server, port } = await serve(join(ROOT, "public"));
const origin = `http://127.0.0.1:${port}`;
const directory = await mkdtemp(join(tmpdir(), "html5-synthetic-sound-exports-"));
async function clickText(page, text) {
  const element = await page.evaluateHandle((expected) => [...document.querySelectorAll("button")].find((button) => button.textContent.trim() === expected), text);
  assert.ok(element.asElement(), `missing live sound-app control: ${text}`);
  await element.asElement().click(); await element.dispose();
}
async function exported(extension, before) {
  for (let attempt = 0; attempt < 400; attempt++) {
    const files = await readdir(directory);
    const name = files.find((file) => !before.has(file) && file.endsWith(extension));
    if (name && !files.includes(`${name}.crdownload`)) return { name, value: await readFile(join(directory, name), "utf8") };
    await delay(20);
  }
  assert.fail(`No completed sound export: ${extension}`);
}
try {
  await withBrowser(deps, async (browser) => {
    await test("complete browser catalog exposes every approved app and searches Sanctuary/AURA without hidden omissions", async () => {
      const page = await browser.newPage();
      try {
        await page.goto(`${origin}/apps/index.html`, { waitUntil: "networkidle0" });
        await page.waitForFunction(() => document.querySelectorAll("#app-list .card").length === 98);
        await page.type("#app-search", "sanctuary");
        assert.equal(await page.$$eval("#app-list .card", (cards) => cards.length), 1);
        assert.match(await page.$eval("#app-list a", (link) => link.href), /sound-sanctuary\/index\.html$/);
        await page.$eval("#app-search", (input) => { input.value = "aura sound studio"; input.dispatchEvent(new Event("input")); });
        assert.equal(await page.$$eval("#app-list .card", (cards) => cards.length), 1);
        assert.match(await page.$eval("#app-list a", (link) => link.href), /aura-sound-studio\/index\.html$/);
      } finally { await page.close(); }
    });
    for (const snapshot of [
      { path: "sound-sanctuary/index.html", start: "Enter Sanctuary", stop: "Exit Sanctuary", exportOpen: null, exportSave: "Download Self" },
      { path: "aura-sound-studio/index.html", start: "THX Deep Note", exportOpen: "Download Self", exportSave: "Download Self (.html)" },
      { path: "aura-sound-studio/saved-settings.html", start: "THX Deep Note", exportOpen: "Quine Self / Download App", exportSave: "Download Runnable Quine (.html)" },
    ]) {
      await test(`real audio app ${snapshot.path}: offline boot, user-started Web Audio and recoverable self export`, async () => {
        const page = await browser.newPage(), errors = [], external = [];
        try {
          page.on("pageerror", (error) => errors.push(error.message));
          await page.setRequestInterception(true);
          page.on("request", (request) => {
            if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== origin) { external.push(request.url()); void request.abort(); }
            else void request.continue();
          });
          await page.evaluateOnNewDocument(() => {
            window.__soundContexts = []; window.__soundMicrophoneCalls = 0;
            const ActualContext = window.AudioContext;
            window.AudioContext = class extends ActualContext {
              constructor(...args) { super(...args); window.__soundContexts.push(this); }
            };
            if (navigator.mediaDevices) {
              const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
              navigator.mediaDevices.getUserMedia = (...args) => { window.__soundMicrophoneCalls++; return original(...args); };
            }
          });
          const session = await page.createCDPSession();
          await session.send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: directory });
          await page.goto(`${origin}/apps/${snapshot.path}`, { waitUntil: "networkidle0" });
          assert.match(await page.$eval("#sound-snapshot-safety", (element) => element.textContent), /hearing protection/);
          assert.equal(await page.evaluate(() => window.__soundMicrophoneCalls), 0, "loading a snapshot must not request the mic");
          await clickText(page, snapshot.start);
          await page.waitForFunction(() => window.__soundContexts.some((context) => context.state === "running"), { timeout: 15000 });
          assert.equal(await page.evaluate(() => window.__soundMicrophoneCalls), 0, "starting synthesized demo audio does not imply mic consent");
          if (snapshot.stop) {
            await clickText(page, snapshot.stop);
            await page.waitForFunction(() => window.__soundContexts.every((context) => context.state === "closed" || context.state === "suspended"));
          }
          if (snapshot.exportOpen) await clickText(page, snapshot.exportOpen);
          const before = new Set(await readdir(directory));
          await clickText(page, snapshot.exportSave);
          const html = await exported(".html", before);
          assert.ok(html.value.length > 300000);
          assert.match(html.value, /sound-snapshot-safety/);
          assert.match(html.value, /getUserMedia/);
          assert.doesNotMatch(html.value, /fonts\.googleapis\.com|cloudflareinsights\.com/);
          if (snapshot.path.endsWith("saved-settings.html")) {
            const previous = new Set(await readdir(directory));
            await clickText(page, "Export Preset (.json)");
            const preset = await exported(".json", previous), settings = JSON.parse(preset.value);
            assert.equal(settings.eqBands.length, 10);
            assert.equal(typeof settings.masterVolume, "number");
            assert.doesNotMatch(preset.value, /PRIVATE KEY|passphrase|wallet|mnemonic/i);
          }
          assert.deepEqual(errors, []); assert.deepEqual(external, []);
          await page.evaluate(() => Promise.all(window.__soundContexts.filter((context) => context.state !== "closed").map((context) => context.close())));
        } finally { await page.close(); }
      });
    }
  });
} finally { server.close(); await rm(directory, { recursive: true, force: true }); }
