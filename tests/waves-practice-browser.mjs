/** Built workbench in real Chromium: synthetic paper UI, not chain/device evidence.
 * Run `npm run build:web && node tests/waves-practice-browser.mjs`.
 * Only a local static fixture server is used; all external requests are blocked.
 */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve, join } from "node:path";
import { test } from "node:test";
import { browserDeps, serve, withBrowser, ROOT } from "./lib-browser.mjs";

const deps = await browserDeps();
if (!deps) throw new Error("Waves practice acceptance requires the locked Chromium dependencies; no silent skip.");
const { server, port } = await serve(resolve(ROOT, "dist"));
const base = `http://127.0.0.1:${port}`;
const legacy = JSON.stringify({ marker: "public-synthetic-legacy-sentinel", address: "not-a-real-account" });
const shotDir = process.env.WAVES_SCREENSHOT_DIR;
if (shotDir) await mkdir(shotDir, { recursive: true });

try {
  await withBrowser(deps, async (browser) => {
    for (const width of [1440, 390, 320]) {
      await test(`built Waves practice at ${width}px: keyboard, bounds, reset, no storage/egress and no horizontal overflow`, { timeout: 60_000 }, async () => {
        const page = await browser.newPage();
        const errors = [], external = [], practiceRequests = [];
        let observePractice = false;
        try {
          await page.setViewport({ width, height: 1000, deviceScaleFactor: 1 });
          page.on("pageerror", (error) => errors.push(error.name));
          await page.setRequestInterception(true);
          page.on("request", (request) => {
            const url = request.url();
            if (/^https?:/.test(url) && new URL(url).origin !== base) {
              external.push(new URL(url).origin); void request.abort();
            } else {
              if (observePractice && /^https?:/.test(url)) practiceRequests.push(request.method());
              void request.continue();
            }
          });
          await page.evaluateOnNewDocument((value) => {
            const methods = ["getItem", "setItem", "removeItem", "clear"];
            const original = Object.fromEntries(methods.map((name) => [name, Storage.prototype[name]]));
            if (original.getItem.call(localStorage, "waves_acc_v1") === null) {
              original.setItem.call(localStorage, "waves_acc_v1", value);
            }
            window.__paperStorageCalls = [];
            window.__paperLegacyCalls = [];
            window.__paperLegacyValue = () => original.getItem.call(localStorage, "waves_acc_v1");
            for (const name of methods) Storage.prototype[name] = function (...args) {
              window.__paperStorageCalls.push(name);
              if (name === "clear" || args[0] === "waves_acc_v1") window.__paperLegacyCalls.push(name);
              return Reflect.apply(original[name], this, args);
            };
          }, legacy);

          async function clickButton(name) {
            const handle = await page.evaluateHandle((wanted) => [...document.querySelectorAll("button")].find((node) =>
              node.getAttribute("aria-label") === wanted || node.getAttribute("title") === wanted || node.textContent.trim().endsWith(wanted)), name);
            const element = handle.asElement();
            assert.ok(element, `Button exists: ${name}`);
            await element.click(); await handle.dispose();
          }
          async function openWaves() {
            if (width < 1024) await clickButton("Open menu");
            await clickButton("Waves practice");
            await page.waitForSelector("#waves-practice-title");
          }
          const balance = (symbol) => page.$eval(`[data-testid="paper-balance-${symbol}"]`, (node) => node.textContent.trim());
          const disabled = () => page.$eval("#paper-order button[type=submit]", (node) => node.matches(":disabled"));
          async function setAmount(value) {
            await page.focus("#paper-order input");
            await page.keyboard.down("Control"); await page.keyboard.press("a"); await page.keyboard.up("Control");
            await page.keyboard.press("Backspace"); await page.keyboard.type(value);
          }
          async function checkLayout() {
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), true);
            assert.deepEqual(await page.$$eval('[aria-labelledby="waves-practice-title"] section, #paper-order table', (nodes) =>
              nodes.filter((node) => node.scrollWidth > node.clientWidth + 1).map((node) => node.id || node.tagName)), []);
          }

          await page.goto(`${base}/bip39-haiku-workbench.html#codebase=suite`, { waitUntil: "networkidle0" });
          await openWaves();
          assert.equal(await disabled(), true);
          assert.match(await page.$eval('[aria-labelledby="waves-practice-title"]', (node) => node.textContent), /All prices, charts, balances and book levels here are synthetic/);
          assert.equal(await page.evaluate(() => window.__paperLegacyValue()), legacy);
          assert.deepEqual(await page.evaluate(() => window.__paperLegacyCalls), [], "the mount must not access the legacy record");
          await page.evaluate(() => { window.__paperStorageCalls = []; });
          observePractice = true;

          await page.focus('a[href="#paper-order"]');
          await page.keyboard.press("Enter");
          assert.equal(await page.evaluate(() => document.activeElement.id), "paper-order");
          assert.equal(new URL(page.url()).hash, "#codebase=suite");

          const start = await page.evaluateHandle(() => [...document.querySelectorAll("button")].find((node) => node.textContent.trim() === "Start paper portfolio"));
          await start.asElement().focus(); await page.keyboard.press("Enter"); await start.dispose();
          await page.waitForSelector('[data-testid="paper-balance-CREDITS"]');
          assert.equal(await disabled(), false);
          await clickButton("Simulate buy WAVES");
          assert.equal(await balance("CREDITS"), "4990"); assert.equal(await balance("WAVES"), "110");
          assert.match(await page.$eval('[role="status"]', (node) => node.textContent), /Nothing was submitted/);

          for (const value of ["Infinity", "-1", "0", "999999", "0.000000001"]) {
            await setAmount(value);
            assert.equal(await disabled(), true, `invalid or unaffordable amount refused: ${value}`);
            assert.equal(await page.$eval("#paper-order input", (node) => node.getAttribute("aria-invalid")), "true");
            assert.equal(await balance("CREDITS"), "4990");
          }
          await setAmount("10"); await clickButton("Practice sell"); await clickButton("Simulate sell WAVES");
          assert.equal(await balance("CREDITS"), "5000"); assert.equal(await balance("WAVES"), "100");
          await checkLayout();
          if (shotDir) await page.screenshot({ path: join(shotDir, `waves-${width}.png`), fullPage: true });
          await clickButton("Reset paper balances");
          assert.equal(await balance("CREDITS"), "5000");
          await clickButton("End practice session");
          assert.equal(await page.$('[data-testid="paper-balance-CREDITS"]'), null);
          assert.equal(await disabled(), true);
          assert.deepEqual(await page.evaluate(() => window.__paperStorageCalls), []);
          assert.deepEqual(practiceRequests, []);
          assert.equal(await page.evaluate(() => window.__paperLegacyValue()), legacy);
          assert.equal(await page.evaluate(() => document.body.textContent.includes("public-synthetic-legacy-sentinel")), false);

          // Leaving the tool and reloading must not retain a paper portfolio.
          await clickButton("Start paper portfolio");
          observePractice = false;
          if (width < 1024) await clickButton("Open menu");
          await clickButton("Inspector"); await openWaves();
          assert.equal(await disabled(), true);
          await clickButton("Start paper portfolio");
          await page.reload({ waitUntil: "networkidle0" }); await openWaves();
          assert.equal(await disabled(), true);
          assert.equal(await page.evaluate(() => window.__paperLegacyValue()), legacy);
          assert.deepEqual(await page.evaluate(() => window.__paperLegacyCalls), []);
          await checkLayout();
          assert.deepEqual(errors, []); assert.deepEqual(external, []);
        } finally { await page.close(); }
      });
    }
  });
} finally {
  await new Promise((done, reject) => server.close((error) => error ? reject(error) : done()));
}
