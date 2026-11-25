/**
 * Real-browser regression check for the Sanborn Restaurant 4Dwm renderer.
 *
 * Exercises the pointer hit-target for the Live Light overlay, the active
 * emitter state, and the actual blueprint display mode. Skips on a bare
 * checkout without puppeteer-core and @sparticuz/chromium.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { browserDeps, serve, withBrowser } from "./lib-browser.mjs";

const deps = await browserDeps();
if (!deps) {
  console.log("sanborn-restaurant browser: SKIPPED (install puppeteer-core and @sparticuz/chromium)");
  process.exit(0);
}

const { server, port } = await serve();
const errors = [];

try {
  await withBrowser(deps, async (browser) => {
    const page = await browser.newPage();
    await page.setViewport({ width: 1500, height: 950 });
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(`console.error: ${message.text()}`);
    });
    page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
    page.on("requestfailed", (request) => errors.push(`requestfailed: ${request.url()}`));

    await page.goto(`http://127.0.0.1:${port}/sanborn-restaurant-4dwm.html`, {
      waitUntil: "networkidle2",
      timeout: 90000,
    });
    await page.waitForFunction(
      () => document.querySelector("#load-state")?.textContent === "READY",
      { timeout: 60000 },
    );
    await new Promise((resolve) => setTimeout(resolve, 500));

    const canvasRect = await page.$eval("#viewport", (canvas) => {
      const { x, y, width, height } = canvas.getBoundingClientRect();
      return { x: Math.round(x), y: Math.round(y), width: Math.round(width), height: Math.round(height) };
    });
    const canvasHash = async () => {
      const image = await page.screenshot({ encoding: "base64", clip: canvasRect });
      return createHash("sha256").update(image).digest("hex");
    };

    await test("WebGL scene boots cleanly and the Live Light control is a real pointer target", async () => {
      assert.deepEqual(errors, [], errors.join("\n"));
      const state = await page.evaluate(() => {
        const button = document.querySelector("#light-btn");
        const rect = button.getBoundingClientRect();
        const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
        return {
          ready: document.querySelector("#load-state").textContent,
          pressed: button.getAttribute("aria-pressed"),
          hitButton: hit === button || button.contains(hit),
          viewMode: document.querySelector("#viewport").dataset.viewMode,
        };
      });
      assert.equal(state.ready, "READY");
      assert.equal(state.pressed, "true");
      assert.equal(state.hitButton, true, "the canvas or a side panel must not intercept the control");
      assert.equal(state.viewMode, "viewport");
    });

    await test("Live Light toggles through a physical click and changes the rendered scene", async () => {
      const lit = await canvasHash();
      await page.click("#light-btn");
      await page.waitForFunction(() => document.querySelector("#light-btn")?.getAttribute("aria-pressed") === "false");
      await new Promise((resolve) => setTimeout(resolve, 400));
      const unlit = await canvasHash();
      const state = await page.evaluate(() => ({
        pressed: document.querySelector("#light-btn").getAttribute("aria-pressed"),
        checkbox: document.querySelector('[data-layer="livelight"]').checked,
        data: document.querySelector("#viewport").dataset.lightOn,
      }));
      assert.equal(state.pressed, "false");
      assert.equal(state.checkbox, false);
      assert.equal(state.data, "false");
      assert.notEqual(unlit, lit, "disabling the point emitters must visibly change the WebGL scene");
      assert.deepEqual(errors, [], errors.join("\n"));
    });

    await test("Blueprint is a distinct linework view and Viewport restores the solid scene", async () => {
      const before = await canvasHash();
      await page.click('[data-mode="blueprint"]');
      await page.waitForFunction(() => document.querySelector("#viewport")?.dataset.viewMode === "blueprint");
      await new Promise((resolve) => setTimeout(resolve, 400));
      const blueprint = await canvasHash();
      const state = await page.evaluate(() => ({
        pressed: document.querySelector('[data-mode="blueprint"]').getAttribute("aria-pressed"),
        camera: document.querySelector("#camera-readout").textContent,
        model: document.querySelector("#viewport").dataset.modelVisible,
        wire: document.querySelector("#viewport").dataset.wireVisible,
        datum: document.querySelector("#viewport").dataset.blueprintVisible,
      }));
      assert.equal(state.pressed, "true");
      assert.equal(state.camera, "PLAN");
      assert.equal(state.model, "false", "blueprint mode hides filled materials");
      assert.equal(state.wire, "true");
      assert.equal(state.datum, "true");
      assert.notEqual(blueprint, before, "blueprint mode must render a different view");

      await page.click('[data-mode="viewport"]');
      await page.waitForFunction(() => document.querySelector("#viewport")?.dataset.viewMode === "viewport");
      assert.equal(await page.$eval("#viewport", (canvas) => canvas.dataset.modelVisible), "true");
      assert.equal(await page.$eval("#camera-readout", (readout) => readout.textContent), "AXON");
      assert.deepEqual(errors, [], errors.join("\n"));
    });
  });
} finally {
  server.close();
}
