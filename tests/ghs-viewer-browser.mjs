/** Real-browser regressions for the shared VRML renderer (not Sanborn's renderers). */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { browserDeps, serve, withBrowser } from "./lib-browser.mjs";

const deps = await browserDeps();
if (!deps) {
  console.log("ghs-viewer browser: SKIPPED (install puppeteer-core and @sparticuz/chromium)");
  process.exit(0);
}

const { server, port } = await serve();
const errors = [];
try {
  await withBrowser(deps, async (browser) => {
    const page = await browser.newPage();
    await page.setViewport({ width: 900, height: 650 });
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(`console.error: ${message.text()}`);
    });
    page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
    await page.goto(`http://127.0.0.1:${port}/tests/fixtures/ghs-viewer-browser.html`, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });
    await page.waitForFunction(() => Boolean(window.viewer && document.querySelector("#vrmlHost canvas")));
    await new Promise((resolve) => setTimeout(resolve, 500));

    await test("the parsed VRML scene keeps its initial surface and camera interaction", async () => {
      const initial = await page.evaluate(() => ({
        mode: window.viewer.mode,
        meshes: window.viewer.meshes,
        canvasMode: document.querySelector("#vrmlHost canvas").dataset.mode,
        hit: (() => {
          const canvas = document.querySelector("#vrmlHost canvas");
          const rect = canvas.getBoundingClientRect();
          return document.elementFromPoint(rect.width / 2, rect.height / 2) === canvas;
        })(),
      }));
      assert.equal(initial.mode, "surface");
      assert.equal(initial.canvasMode, "surface");
      assert.equal(initial.meshes, 2);
      assert.equal(initial.hit, true, "the canvas should own the center camera gesture area");

      await page.click('[title="Toggle automatic model rotation"]');
      const beforeZoom = await page.$eval("#vrmlHost canvas", (canvas) => Number(canvas.dataset.cameraDistance));
      await page.mouse.move(450, 300);
      await page.mouse.wheel({ deltaY: -300 });
      await page.waitForFunction((distance) => Number(document.querySelector("#vrmlHost canvas")?.dataset.cameraDistance) < distance, {}, beforeZoom);
      const beforeDrag = await page.evaluate(() => window.viewer.camera.position.toArray());
      await page.mouse.move(450, 300);
      await page.mouse.down();
      await page.mouse.move(560, 350, { steps: 5 });
      await page.mouse.up();
      await page.waitForFunction((before) => {
        const now = window.viewer.camera.position.toArray();
        return now.some((value, index) => Math.abs(value - before[index]) > 0.1);
      }, {}, beforeDrag);
      assert.deepEqual(errors, [], errors.join("\n"));
    });

    await test("wireframe and blueprint modes change the renderer and restore the source materials", async () => {
      const surfaceColor = await page.evaluate(() => window.viewer.scene.children.find((o) => o.isMesh)?.material.color.getHexString());
      await page.click('[data-vrml-mode="wireframe"]');
      assert.equal(await page.$eval("#vrmlHost canvas", (canvas) => canvas.dataset.mode), "wireframe");
      assert.equal(await page.evaluate(() => window.viewer.scene.children.find((o) => o.isMesh)?.material.wireframe), true);

      const canvasRect = { x: 250, y: 70, width: 400, height: 400 };
      const imageHash = async () => createHash("sha256").update(await page.screenshot({ encoding: "binary", clip: canvasRect })).digest("hex");
      const wireHash = await imageHash();
      await page.click('[data-vrml-mode="blueprint"]');
      const blueprint = await page.evaluate(() => ({
        mode: window.viewer.mode,
        bg: window.viewer.scene.background.getHexString(),
        gridVisible: window.viewer.scene.children.some((o) => o.name === "ghs-vrml-blueprint-grid" && o.visible),
        pressed: document.querySelector('[data-vrml-mode="blueprint"]').getAttribute("aria-pressed"),
        wireframe: window.viewer.scene.children.find((o) => o.isMesh)?.material.wireframe,
      }));
      assert.equal(blueprint.mode, "blueprint");
      assert.equal(blueprint.bg, "06172d");
      assert.equal(blueprint.gridVisible, true);
      assert.equal(blueprint.pressed, "true");
      assert.equal(blueprint.wireframe, true);
      assert.notEqual(await imageHash(), wireHash, "blueprint should visibly differ from ordinary wireframe");

      await page.click('[data-vrml-mode="surface"]');
      assert.equal(await page.$eval("#vrmlHost canvas", (canvas) => canvas.dataset.mode), "surface");
      assert.equal(await page.evaluate(() => window.viewer.scene.children.find((o) => o.isMesh)?.material.wireframe), false);
      assert.equal(await page.evaluate(() => window.viewer.scene.children.find((o) => o.isMesh)?.material.color.getHexString()), surfaceColor);
      assert.deepEqual(errors, [], errors.join("\n"));
    });

    await test("the renderer-side live light toggles and produces a visible scene change", async () => {
      await page.evaluate(() => { window.viewer.auto = false; });
      const canvasRect = { x: 250, y: 70, width: 400, height: 400 };
      const sceneHash = async () => createHash("sha256").update(await page.screenshot({ encoding: "binary", clip: canvasRect })).digest("hex");
      const before = await sceneHash();
      await page.click('[title="Toggle the moving renderer-side point light"]');
      await page.waitForFunction(() => document.querySelector("#vrmlHost canvas")?.dataset.lightOn === "true");
      await new Promise((resolve) => setTimeout(resolve, 500));
      const after = await sceneHash();
      assert.equal(await page.$eval('[title="Toggle the moving renderer-side point light"]', (button) => button.getAttribute("aria-pressed")), "true");
      assert.notEqual(after, before, "the light should alter rendered pixels outside the toolbar");
      assert.deepEqual(errors, [], errors.join("\n"));
    });

    await page.evaluate(() => window.viewer.dispose());
  });
} finally {
  server.close();
}
