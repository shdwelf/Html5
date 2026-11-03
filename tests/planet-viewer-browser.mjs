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
      return {
        hasGl: Boolean(gl), width: c.width, height: c.height,
        drawCalls: Number(c.dataset.drawCalls), triangles: Number(c.dataset.triangles),
        activePlate: c.dataset.activePlate,
        status: document.getElementById("status").textContent,
      };
    });
    assert.ok(info.hasGl);
    assert.ok(info.width > 100 && info.height > 100);
    assert.equal(info.activePlate, "chey");
    assert.ok(info.drawCalls > 0, "Three.js must submit a draw call");
    assert.ok(info.triangles > 0, "Three.js must draw terrain triangles");
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

  await test("switching plates updates the active relief grid and terrain draw counts", async () => {
    await page.click('.mode-switch [data-mode="relief"]');
    const meshState = async (plate) => {
      await page.click(`[data-plate="${plate}"]`);
      await page.waitForFunction((id) => document.getElementById("stage")?.dataset.activePlate === id, {}, plate);
      return page.evaluate(() => ({
        plate: document.getElementById("stage").dataset.activePlate,
        triangles: Number(document.getElementById("stage").dataset.triangles),
        grid: document.querySelector('[data-layer="surface"] .lval')?.textContent,
      }));
    };
    const cheyenne = await meshState("chey");
    const lawrence = await meshState("lawrence");
    assert.equal(cheyenne.plate, "chey");
    assert.equal(lawrence.plate, "lawrence");
    assert.ok(cheyenne.triangles > 0 && lawrence.triangles > 0);
    assert.notEqual(cheyenne.triangles, lawrence.triangles, "different terrain meshes are actually submitted to WebGL");
    assert.notEqual(cheyenne.grid, lawrence.grid, "the surface dimensions follow the selected plate");
  });

  await test("Gazetteer search jumps from a mountain plate to the matching terrain plate", async () => {
    await page.click('[data-plate="chey"]');
    await page.$eval("#searchBox", (input) => {
      input.value = "Lawrence";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await page.waitForSelector("#searchResults .res");
    await page.click("#searchResults .res");
    await page.waitForFunction(() => document.getElementById("statPlate")?.textContent === "plate: lawrence");
    assert.match(await page.evaluate(() => document.getElementById("status").textContent), /Lawrence.*terrain plate/);
    assert.equal(await page.$eval('[data-plate="lawrence"]', (b) => b.getAttribute("aria-pressed")), "true");
    assert.equal(await page.$eval("#stage", (canvas) => canvas.dataset.gazetteerMarker), "active");

    await page.click('[data-plate="chey"]');
    await page.waitForFunction(() => document.getElementById("stage")?.dataset.activePlate === "chey");
    assert.equal(await page.$eval("#stage", (canvas) => canvas.dataset.gazetteerMarker), "none",
      "a selected point outside the active plate must not leave a stale marker");
    await page.click('[data-plate="lawrence"]');
    await page.waitForFunction(() => document.getElementById("stage")?.dataset.activePlate === "lawrence");
    assert.equal(await page.$eval("#stage", (canvas) => canvas.dataset.gazetteerMarker), "active",
      "the selected marker returns when its terrain plate becomes active again");
  });

  await test("Gazetteer results without a terrain plate are highlighted on the globe", async () => {
    await page.$eval("#searchBox", (input) => {
      input.value = "Atlanta";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await page.waitForSelector("#searchResults .res");
    assert.equal(await page.$eval("#stage", (canvas) => canvas.dataset.gazetteerMarker), "none",
      "editing a search clears the previously selected terrain marker");
    await page.click("#searchResults .res");
    await page.waitForFunction(() => document.getElementById("statPlate")?.textContent === "plate: globe");
    const state = await page.evaluate(() => ({
      globeVisible: !document.getElementById("globeStage").hidden,
      selected: document.getElementById("infoTitle").textContent,
      status: document.getElementById("status").textContent,
      marker: document.getElementById("stage").dataset.gazetteerMarker,
    }));
    assert.equal(state.globeVisible, true);
    assert.equal(state.selected, "Atlanta");
    assert.equal(state.marker, "none", "globe mode must remove the terrain-only Three.js marker");
    assert.match(state.status, /no terrain plate.*centered globe/);
  });

  await test("GNIS search remains usable from the PC Globe index overlay", async () => {
    await page.click('[data-plate="pcg"]');
    assert.equal(await page.$eval("#stage", (canvas) => canvas.dataset.gazetteerMarker), "none",
      "the index-only plate must not retain a terrain marker");
    await page.$eval("#searchBox", (input) => {
      input.value = "Lawrence";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await page.waitForSelector("#searchResults .res");
    await page.click("#searchResults .res");
    await page.waitForFunction(() => document.getElementById("statPlate")?.textContent === "plate: lawrence");
    assert.equal(await page.$eval("#pcgPanel", (panel) => panel.hidden), true);
    assert.equal(await page.$eval("#stage", (canvas) => canvas.dataset.gazetteerMarker), "active",
      "leaving the PC Globe overlay restores the selected point marker on terrain");
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
