/**
 * Real-browser check for PLANET VIEWER · 4DWM.
 *
 * The pure modules are covered by tests/planet-viewer.test.mjs; this proves
 * the thing JSDOM cannot: the viewer boots on real WebGL, draws terrain,
 * survives every plate × mode transition, exports a .wrl, and the scoped
 * [data-mode] selector does not let a stray click reset the view.
 *
 * Skips cleanly when the browser deps are absent:
 *   npm i --no-save puppeteer-core @sparticized/chromium
 */
import test from "node:test";
import assert from "node:assert/strict";
import { browserDeps, serve, unpackLibs } from "./lib-browser.mjs";

const deps = await browserDeps();
if (!deps) {
  console.log("planet-viewer browser: SKIPPED (npm i --no-save puppeteer-core @sparticized/chromium)");
  process.exit(0);
}
unpackLibs();

const { server, port } = await serve();
const base = `http://127.0.0.1:${port}`;
const errors = [];
const browser = await deps.puppeteer.launch({
  executablePath: await deps.chromium.executablePath(),
  headless: "new",
  env: { ...process.env, LD_LIBRARY_PATH: `${unpackLibs()}:${process.env.LD_LIBRARY_PATH ?? ""}` },
  args: [
    "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu-sandbox",
    "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
  ],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1500, height: 950 });
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console.error: ${m.text()}`);
  });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("requestfailed", (r) => errors.push(`requestfailed: ${r.url()} ${r.failure()?.errorText ?? ""}`));

  await page.goto(`${base}/planet-viewer-4dwm.html`, { waitUntil: "networkidle2", timeout: 90000 });
  await page.waitForFunction(() => /boot/.test(document.getElementById("status")?.textContent || ""), { timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1200));

  await test("the viewer boots on real WebGL with no console errors", () => {
    assert.deepEqual(errors, [], errors.join("\n"));
  });

  await test("WebGL is live and the terrain draws", async () => {
    const info = await page.evaluate(() => {
      const c = document.getElementById("stage");
      const gl = c.getContext("webgl2") || c.getContext("webgl");
      return { hasGl: Boolean(gl), width: c.width, height: c.height, status: document.getElementById("status").textContent };
    });
    assert.ok(info.hasGl);
    assert.ok(info.width > 100 && info.height > 100);
    const shot = await page.screenshot({ encoding: "base64", clip: { x: 400, y: 250, width: 800, height: 500 } });
    assert.ok(shot.length > 2000, "screenshot suspiciously small");
  });

  await test("every plate loads and every mode renders without a page error", async () => {
    for (const plate of ["chey", "ange", "lawrence"]) {
      await page.click(`[data-plate="${plate}"]`);
      await new Promise((r) => setTimeout(r, 400));
      for (const mode of ["relief", "wire", "xray"]) {
        await page.click(`.mode-switch [data-mode="${mode}"]`);
        await new Promise((r) => setTimeout(r, 200));
        assert.equal(await page.evaluate(() => document.body.dataset.mode), mode);
      }
      assert.match(await page.evaluate(() => document.getElementById("statPlate").textContent), /plate: /);
    }
    assert.deepEqual(errors, [], errors.join("\n"));
  });

  await test("a stray click outside the mode switch does not reset the view", async () => {
    await page.click('.mode-switch [data-mode="xray"]');
    await new Promise((r) => setTimeout(r, 250));
    await page.click("#btnLabels");
    await new Promise((r) => setTimeout(r, 250));
    assert.equal(await page.evaluate(() => document.body.dataset.mode), "xray");
    const extra = await page.evaluate(() => document.querySelectorAll("[data-mode]").length - document.querySelectorAll(".mode-switch [data-mode]").length);
    assert.equal(extra, 1, "only the body should carry data-mode outside the switch");
  });

  await test("panels are populated from the data", async () => {
    await page.click('[data-plate="chey"]');
    await new Promise((r) => setTimeout(r, 400));
    const panel = await page.evaluate(() => ({
      layers: document.querySelectorAll("#layerList .legend-row").length,
      checks: document.querySelectorAll("#checkList .check").length,
      checksOk: document.querySelectorAll("#checkList .check.ok").length,
      cards: document.querySelectorAll("#cardList .card").length,
    }));
    assert.ok(panel.layers >= 4);
    assert.ok(panel.checks >= 5);
    assert.equal(panel.checksOk, panel.checks, "a rendered check is failing in the browser");
    assert.ok(panel.cards >= 5);
  });

  await test("switching plates really changes the terrain on screen", async () => {
    const sig = async (plate) => {
      await page.click(`[data-plate="${plate}"]`);
      await new Promise((r) => setTimeout(r, 500));
      return page.screenshot({ encoding: "base64", clip: { x: 400, y: 250, width: 800, height: 500 } });
    };
    const a = await sig("chey");
    const b = await sig("lawrence");
    assert.notEqual(a, b);
  });

  await test("the gazetteer finds Lawrence on the Lawrence plate", async () => {
    await page.click('[data-plate="lawrence"]');
    await new Promise((r) => setTimeout(r, 400));
    await page.type("#searchBox", "Lawrence");
    await new Promise((r) => setTimeout(r, 400));
    const results = await page.evaluate(() => document.querySelectorAll("#searchResults .res").length);
    assert.ok(results >= 1, "search should find Lawrence");
  });

  await test("the VRML export produces a real download", async () => {
    const client = await page.createCDPSession();
    await client.send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: "/tmp/planet-dl" });
    await page.click("#btnVrml");
    await new Promise((r) => setTimeout(r, 1500));
    const { readFileSync, readdirSync } = await import("node:fs");
    const files = readdirSync("/tmp/planet-dl").filter((f) => f.endsWith(".wrl"));
    assert.ok(files.length >= 1, "no .wrl downloaded");
    const wrl = readFileSync(`/tmp/planet-dl/${files[files.length - 1]}`, "utf8");
    assert.match(wrl, /^#VRML V2\.0 utf8/);
    assert.match(wrl, /IndexedFaceSet/);
    assert.match(await page.evaluate(() => document.getElementById("status").textContent), /wrote .*\.wrl/);
  });
} finally {
  await browser.close();
  server.close();
}
