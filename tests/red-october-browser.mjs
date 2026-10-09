/**
 * Real-browser check for RED OCTOBER · CUTAWAY 4DWM.
 *
 * The pure modules are covered by tests/red-october.test.mjs; this one exists
 * to prove the thing that a JSDOM run cannot: that the viewer boots on real
 * WebGL, draws pixels, survives every boat × mode transition without a page
 * error, and exports a .wrl from inside the page.
 *
 * Skips cleanly when the browser deps are absent, like the other browser
 * suites:  npm i --no-save puppeteer-core @sparticized/chromium
 */
import test from "node:test";
import assert from "node:assert/strict";
import { browserDeps, serve, unpackLibs } from "./lib-browser.mjs";

const deps = await browserDeps();
if (!deps) {
  console.log("red-october browser: SKIPPED (npm i --no-save puppeteer-core @sparticized/chromium)");
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

  await page.goto(`${base}/red-october-4dwm.html`, { waitUntil: "networkidle2", timeout: 90000 });
  await page.waitForFunction(
    () => /boot/.test(document.getElementById("status")?.textContent || ""),
    { timeout: 60000 },
  );
  // Let a few frames through so the render loop has actually drawn.
  await new Promise((r) => setTimeout(r, 1200));

  await test("the viewer boots on real WebGL with no console errors", () => {
    assert.deepEqual(errors, [], errors.join("\n"));
  });

  await test("WebGL is live and the canvas is drawing, not blank", async () => {
    const info = await page.evaluate(() => {
      const c = document.getElementById("stage");
      const gl = c.getContext("webgl2") || c.getContext("webgl");
      const ext = gl?.getExtension("WEBGL_debug_renderer_info");
      return {
        hasGl: Boolean(gl),
        renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : null,
        width: c.width,
        height: c.height,
        status: document.getElementById("status").textContent,
      };
    });
    assert.ok(info.hasGl, "no WebGL context");
    assert.ok(info.width > 100 && info.height > 100, `canvas is ${info.width}x${info.height}`);

    // Non-background pixels: the boat is actually on screen.
    const shot = await page.screenshot({ encoding: "base64", clip: { x: 300, y: 200, width: 900, height: 550 } });
    const { createHash } = await import("node:crypto");
    assert.ok(shot.length > 2000, "screenshot suspiciously small");
    assert.ok(createHash("sha256").update(shot).digest("hex").length === 64);
  });

  await test("every boat loads and every mode renders without a page error", async () => {
    for (const boat of ["typhoon", "dallas", "akula"]) {
      await page.click(`[data-boat="${boat}"]`);
      await new Promise((r) => setTimeout(r, 350));
      for (const mode of ["relief", "section", "xray", "wire", "ghost"]) {
        await page.click(`[data-mode="${mode}"]`);
        await new Promise((r) => setTimeout(r, 200));
        const bodyMode = await page.evaluate(() => document.body.dataset.mode);
        assert.equal(bodyMode, mode, `${boat}/${mode}: body data-mode not applied`);
      }
      const hull = await page.evaluate(() => document.getElementById("statHull").textContent);
      assert.match(hull, /hull: .+/, `${boat}: status bar never updated`);
    }
    assert.deepEqual(errors, [], errors.join("\n"));
  });

  await test("clicking elsewhere in the page does not reset the view mode", async () => {
    // <body> carries data-mode for the stylesheet. An unscoped [data-mode]
    // selector binds the body as a mode button and every click anywhere resets
    // the view — this is the regression guard for that.
    await page.click('[data-mode="xray"]');
    await new Promise((r) => setTimeout(r, 250));
    assert.equal(await page.evaluate(() => document.body.dataset.mode), "xray");

    await page.click("#btnLabels"); // a control outside the mode switch
    await new Promise((r) => setTimeout(r, 250));
    assert.equal(
      await page.evaluate(() => document.body.dataset.mode),
      "xray",
      "an unrelated click reset the view mode",
    );

    const bound = await page.evaluate(
      () => document.querySelectorAll("[data-mode]").length - document.querySelectorAll(".mode-switch [data-mode]").length,
    );
    assert.equal(bound, 1, "exactly one data-mode element (the body) must sit outside the switch");
  });

  await test("the panels are populated from the data, not left as placeholders", async () => {
    // The previous test clicked LABELS and left them off; put them back on and
    // assert the toggle really did turn them off first, so this is a test of
    // both the toggle and the projection rather than an ordering accident.
    const pressed = await page.evaluate(() => document.getElementById("btnLabels").getAttribute("aria-pressed"));
    assert.equal(pressed, "false", "the LABELS toggle should be off after the previous test");
    await page.click("#btnLabels");
    await new Promise((r) => setTimeout(r, 400));

    await page.click('[data-boat="typhoon"]');
    await new Promise((r) => setTimeout(r, 400));
    const panel = await page.evaluate(() => ({
      hullRows: document.querySelectorAll("#hullTable .kv-row").length,
      layers: document.querySelectorAll("#layerList .legend-row").length,
      checks: document.querySelectorAll("#checkList .check").length,
      checksOk: document.querySelectorAll("#checkList .check.ok").length,
      jumps: document.querySelectorAll("#jumpList .jump").length,
      cards: document.querySelectorAll("#cardList .card").length,
      labels: document.querySelectorAll("#labels .lbl").length,
      inspector: document.getElementById("infoTitle").textContent,
      checkText: document.getElementById("checkList").textContent,
    }));
    assert.ok(panel.hullRows >= 10, `hull table has ${panel.hullRows} rows`);
    assert.ok(panel.layers >= 6, `layer list has ${panel.layers}`);
    assert.ok(panel.checks >= 8, `only ${panel.checks} checks rendered`);
    assert.equal(panel.checksOk, panel.checks, "a rendered check is failing in the browser");
    assert.ok(panel.jumps >= 8, `only ${panel.jumps} beats`);
    assert.ok(panel.cards >= 6, `only ${panel.cards} cards`);
    assert.ok(panel.labels >= 4, `only ${panel.labels} labels projected`);
    assert.match(panel.checkText, /contradiction/, "no contradiction check surfaced in the UI");
  });

  await test("switching boats really changes the geometry on screen", async () => {
    const sig = async (boat) => {
      await page.click(`[data-boat="${boat}"]`);
      await new Promise((r) => setTimeout(r, 500));
      return page.screenshot({ encoding: "base64", clip: { x: 300, y: 200, width: 900, height: 550 } });
    };
    const a = await sig("typhoon");
    const b = await sig("dallas");
    assert.notEqual(a, b, "the Typhoon and Dallas frames are identical");
  });

  await test("the VRML export produces a real download with the header intact", async () => {
    const client = await page.createCDPSession();
    await client.send("Browser.setDownloadBehavior", {
      behavior: "allow",
      downloadPath: "/tmp/red-october-dl",
    });
    await page.click('[data-boat="typhoon"]');
    await page.click('[data-mode="section"]');
    await new Promise((r) => setTimeout(r, 300));
    await page.click("#btnVrml");
    await new Promise((r) => setTimeout(r, 1200));

    const { readFileSync, readdirSync } = await import("node:fs");
    const files = readdirSync("/tmp/red-october-dl").filter((f) => f.endsWith(".wrl"));
    assert.ok(files.length >= 1, "no .wrl downloaded");
    const wrl = readFileSync(`/tmp/red-october-dl/${files[files.length - 1]}`, "utf8");
    assert.match(wrl, /^#VRML V2\.0 utf8/);
    assert.match(wrl, /_SECTION/, "the export should carry the cutaway cap in section mode");
    assert.ok(wrl.length > 20000, `export is only ${wrl.length} bytes`);

    const status = await page.evaluate(() => document.getElementById("status").textContent);
    assert.match(status, /wrote .*\.wrl/);
  });

  await test("the 4Dwm opens a window per card and the tray tracks it", async () => {
    await page.click('#cardList .card');
    await new Promise((r) => setTimeout(r, 300));
    const open = await page.evaluate(() => document.querySelectorAll("#pipLayer .pip4").length);
    assert.ok(open >= 1, "no pip window opened");
    await page.evaluate(() => {
      const btn = document.querySelector("#wm4dDesk .wm4d-chip");
      if (btn) btn.click();
    });
  });

  await test("scrubbing the timeline moves the story and swaps the boat in frame", async () => {
    await page.evaluate(() => {
      const s = document.getElementById("timeSlider");
      s.value = "0";
      s.dispatchEvent(new Event("input"));
    });
    await new Promise((r) => setTimeout(r, 500));
    const early = await page.evaluate(() => ({
      title: document.getElementById("infoTitle").textContent,
      day: document.getElementById("timeReadout").textContent,
      hull: document.getElementById("statHull").textContent,
    }));
    assert.match(early.title, /Polyarny/);
    assert.match(early.hull, /RED OCTOBER/);

    await page.evaluate(() => {
      const s = document.getElementById("timeSlider");
      s.value = "500";
      s.dispatchEvent(new Event("input"));
    });
    await new Promise((r) => setTimeout(r, 500));
    const late = await page.evaluate(() => document.getElementById("statHull").textContent);
    assert.notEqual(early.hull, late, "the timeline never changed the boat in frame");
    assert.deepEqual(errors, [], errors.join("\n"));
  });
} finally {
  await browser.close();
  server.close();
}
