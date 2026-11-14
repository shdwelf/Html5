/**
 * Real-browser check for PLANET VIEWER · 4DWM.
 *
 * The pure modules are covered by tests/planet-viewer.test.mjs; this proves
 * the thing JSDOM cannot: the viewer boots on real WebGL, draws terrain,
 * survives every plate × mode transition, exports a .wrl, and the scoped
 * [data-mode] selector does not let a stray click reset the view.
 *
 * Skips cleanly when the browser deps are absent:
 *   npm i --no-save puppeteer-core @sparticuz/chromium
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

  await test("mouse-wheel zoom moves the camera in and out on the terrain canvas", async () => {
    await page.click('[data-plate="chey"]');
    await page.waitForFunction(() => Number(document.getElementById("stage")?.dataset.cameraDistance) > 0);
    const before = await page.$eval("#stage", (canvas) => Number(canvas.dataset.cameraDistance));
    const rect = await page.$eval("#stage", (canvas) => {
      const r = canvas.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
    const hitTarget = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.id, rect);
    assert.equal(hitTarget, "stage", "the hidden globe canvas must not intercept terrain gestures");
    await page.mouse.move(rect.x, rect.y);
    await page.mouse.wheel({ deltaY: -350 });
    await page.waitForFunction((distance) => Number(document.getElementById("stage")?.dataset.cameraDistance) < distance - 1, {}, before);
    const closer = await page.$eval("#stage", (canvas) => Number(canvas.dataset.cameraDistance));
    await page.mouse.wheel({ deltaY: 350 });
    await page.waitForFunction((distance) => Number(document.getElementById("stage")?.dataset.cameraDistance) > distance + 1, {}, closer);
    const farther = await page.$eval("#stage", (canvas) => Number(canvas.dataset.cameraDistance));
    assert.ok(closer < before, `wheel up should zoom in: ${before} -> ${closer}`);
    assert.ok(farther > closer, `wheel down should zoom out: ${closer} -> ${farther}`);
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
    assert.equal(cheyenne.grid, lawrence.grid, "all plates use the shared display resolution after DEM resampling");
    assert.equal(cheyenne.grid, "140×100", "the viewer keeps its configured terrain resolution");
  });

  await test("Cheyenne and SoCal place names are searchable on their matching terrain plates", async () => {
    for (const [plate, name] of [["chey", "Pikes Peak"], ["ange", "Mount Wilson"]]) {
      await page.click(`[data-plate="${plate}"]`);
      await page.waitForFunction((id) => document.getElementById("stage")?.dataset.activePlate === id, {}, plate);
      await page.$eval("#searchBox", (input, value) => {
        input.value = value;
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }, name);
      await page.waitForFunction((value) => [...document.querySelectorAll("#searchResults .res")].some((button) => button.textContent.includes(value)), {}, name);
      await page.$eval("#searchResults", (host, value) => {
        [...host.querySelectorAll(".res")].find((button) => button.textContent.includes(value))?.click();
      }, name);
      await page.waitForFunction(() => document.getElementById("stage")?.dataset.gazetteerMarker === "active");
      assert.equal(await page.$eval("#stage", (canvas) => canvas.dataset.activePlate), plate);
      assert.match(await page.evaluate(() => document.getElementById("status").textContent), new RegExp(name));
    }
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

  await test("S5 imports a local-only dated snapshot and lets the globe filter, inspect, and clear it", async () => {
    const externalRequests = [];
    const capture = (request) => {
      if (!request.url().startsWith(base)) externalRequests.push(request.url());
    };
    page.on("request", capture);
    try {
      await page.$eval("#sensorFile", (input) => {
        const now = Date.now();
        const records = [
          { id: "syn-1", kind: "incident", title: '<img src="https://example.invalid/nope">',
            lat: 34.1, lon: -118.2, sourceId: "synthetic-chp", updatedEpochMs: now - 1_000 },
          { id: "syn-2", kind: "lookout", title: "Synthetic lookout", lat: 49, lon: 2,
            sourceId: "synthetic-lookout", updatedEpochMs: now - 1_000 },
          { id: "syn-3", kind: "fire", title: "Stale synthetic fire", lat: 35, lon: -119,
            sourceId: "synthetic-fire", updatedEpochMs: now - 172_800_000 },
          { id: "syn-4", kind: "camera", title: "Invalid synthetic camera", lat: 0, lon: 0,
            sourceId: "synthetic-camera", updatedEpochMs: now - 1_000 },
        ];
        const file = new File([JSON.stringify({ schema: "html5-incident-snapshot-v1",
          capturedAt: new Date(now).toISOString(), records })], "synthetic.json", { type: "application/json" });
        const transfer = new DataTransfer();
        transfer.items.add(file);
        input.files = transfer.files;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      });
      await page.waitForFunction(() => document.getElementById("sensorStatus")?.textContent.includes("2/2 shown"));
      // Prior Gazetteer tests may have rotated the globe. Fix the centre so
      // visibility and click coordinates describe the known hemisphere.
      await page.click("#btnReset");
      const state = await page.evaluate(() => ({
        count: document.querySelectorAll("#sensorResults .sensor-record").length,
        rejected: document.querySelector("#sensorRejects summary").textContent,
        imageNodes: document.querySelectorAll("#sensorResults img").length,
        globe: !document.getElementById("globeStage").hidden,
        visible: Number(document.getElementById("globeStage").dataset.sensorVisible),
      }));
      assert.deepEqual(state, {
        count: 2, rejected: "Rejected records: 2", imageNodes: 0, globe: true, visible: 1,
      }, "no HTML injection or far-side marker should leak into the globe");
      const lookoutPoint = await page.evaluate(async () => {
        const { projectOrthographic } = await import("../js/planet-globe.js");
        const p = projectOrthographic(49, 2, 20, 10);
        return { x: innerWidth / 2 + p.x * Math.min(innerWidth, innerHeight) * 0.42,
          y: innerHeight / 2 - p.y * Math.min(innerWidth, innerHeight) * 0.42 };
      });
      await page.mouse.click(lookoutPoint.x, lookoutPoint.y);
      await page.waitForFunction(() => document.getElementById("infoTitle")?.textContent === "Synthetic lookout");
      assert.match(await page.$eval("#infoBody", (node) => node.textContent), /snapshot captured.*no live status/);
      await page.click("#sensorResults .sensor-record:first-child");
      await page.waitForFunction(() => document.getElementById("infoTitle")?.textContent.includes("<img"));
      assert.equal(await page.$eval("#infoBody", (node) => node.querySelectorAll("img").length), 0);
      await page.select("#sensorKind", "lookout");
      assert.match(await page.$eval("#sensorStatus", (node) => node.textContent), /1\/2 shown/);
      await page.$eval("#sensorFile", (input) => {
        const transfer = new DataTransfer();
        transfer.items.add(new File(["not JSON"], "bad.json", { type: "application/json" }));
        input.files = transfer.files;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      });
      await page.waitForFunction(() => document.getElementById("sensorStatus")?.dataset.error === "true");
      assert.match(await page.$eval("#sensorStatus", (node) => node.textContent), /Previous snapshot kept/);
      assert.equal(await page.$$eval("#sensorResults .sensor-record", (nodes) => nodes.length), 1);
      await page.click("#sensorClear");
      assert.equal(await page.$eval("#sensorStatus", (node) => node.textContent), "No snapshot imported.");
      assert.equal(await page.$eval("#globeStage", (node) => node.dataset.sensorVisible), "0");
      assert.deepEqual(externalRequests, [], "import and inspection must never contact an external host");
    } finally {
      page.off("request", capture);
    }
  });

  await test("the VRML export produces a real download", async () => {
    const { mkdirSync } = await import("node:fs");
    mkdirSync("/tmp/planet-dl", { recursive: true });
    await page.click('[data-plate="chey"]');
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
