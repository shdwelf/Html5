import assert from "node:assert/strict";
import test from "node:test";
import { browserDeps, serve, withBrowser } from "./lib-browser.mjs";

const deps = await browserDeps();

test("SoCal Subsurface boots and its view selector and draggable PIP bars work", {
  skip: deps ? false : "Puppeteer/Chromium optional browser dependencies are not installed",
}, async () => {
  const { server, port } = await serve();
  try {
    await withBrowser(deps, async (browser) => {
      for (const route of [
        "/socal-subsurface.html",
        "/public/apps/socal-subsurface/index.html",
        "/socal-subsurface-inlined.html",
        "/public/apps/socal-subsurface-inlined/index.html",
      ]) {
        const page = await browser.newPage();
        await page.setViewport({ width: 1365, height: 900 });
        const pageErrors = [];
        page.on("pageerror", (error) => pageErrors.push(error.message));

        await page.goto(`http://127.0.0.1:${port}${route}`, { waitUntil: "domcontentloaded" });
        await page.waitForFunction(
          () => document.querySelector("#status")?.textContent.startsWith("ready"),
          { timeout: 15_000 },
        );
        await page.waitForFunction(
          () => document.querySelector("#hudCam")?.textContent !== "—",
          { timeout: 5_000 },
        );

        const initial = await page.evaluate(() => {
          const canvas = document.querySelector("#stage");
          const pip = document.querySelector("#pipLayers").getBoundingClientRect();
          return {
            status: document.querySelector("#status").textContent,
            canvas: [canvas.width, canvas.height],
            camera: document.querySelector("#hudCam").textContent,
            layerCount: document.querySelectorAll("#layerList .layer-row").length,
            pip: { left: pip.left, top: pip.top },
          };
        });
        assert.match(initial.status, /^ready/);
        assert.deepEqual(initial.canvas, [1365, 900]);
        assert.notEqual(initial.camera, "—");
        assert.ok(initial.layerCount > 10, "the layer controls mounted");

        await page.select("#viewSelect", "transect");
        await page.waitForFunction(
          () => document.querySelector("#hudCam")?.textContent.startsWith("-38.0"),
          { timeout: 5_000 },
        );
        assert.equal(await page.$eval("#status", (element) => element.textContent), "view · transect");

        await page.mouse.move(initial.pip.left + 60, initial.pip.top + 14);
        await page.mouse.down();
        await page.mouse.move(initial.pip.left + 200, initial.pip.top + 100, { steps: 8 });
        await page.mouse.up();
        await page.waitForFunction(
          (before) => {
            const rect = document.querySelector("#pipLayers").getBoundingClientRect();
            return rect.left !== before.left || rect.top !== before.top;
          },
          { timeout: 3_000 },
          initial.pip,
        );
        const moved = await page.$eval("#pipLayers", (element) => {
          const rect = element.getBoundingClientRect();
          return { left: rect.left, top: rect.top };
        });
        assert.ok(moved.left > initial.pip.left, `${route}: layer panel moved horizontally`);
        assert.ok(moved.top > initial.pip.top, `${route}: layer panel moved vertically`);
        assert.deepEqual(pageErrors, [], `${route}: no runtime module or WebGL errors`);
        await page.close();
      }
    });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
