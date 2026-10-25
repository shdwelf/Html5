/**
 * Full sweep: every subsurface viewer boots in a real Chromium over its
 * described area — status reaches `ready`, no page errors, no missing
 * offline resources, no WebGL fallback, layers mounted, and the stage
 * rasterises (screenshot lit-pixel check).
 *
 * Optional like the other Blink suites: skips itself cleanly when
 * puppeteer-core / @sparticuz/chromium are absent (`npm i --no-save …`).
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { ROOT, browserDeps, pngLitPixels, serve, withBrowser } from "./lib-browser.mjs";

const deps = await browserDeps();

const routes = [
  ...readdirSync(ROOT)
    .filter((f) => f.endsWith("-subsurface.html"))
    .sort()
    .map((f) => `/${f}`),
  "/public/apps/Georgia-subsurface/index.html",
  "/public/apps/socal-subsurface/index.html",
  "/public/apps/greeran-subsurface/index.html",
];

test(
  "every subsurface viewer boots, renders, and stays error-free",
  { skip: deps ? false : "Puppeteer/Chromium optional browser dependencies are not installed" },
  async () => {
    assert.ok(routes.length >= 62, `sweep covers the fleet (${routes.length} routes)`);
    const { server, port } = await serve();
    try {
      await withBrowser(deps, async (browser) => {
        const failures = [];
        for (const route of routes) {
          const page = await browser.newPage();
          await page.setViewport({ width: 1365, height: 900 });
          const errors = [];
          const missing = [];
          page.on("pageerror", (e) => errors.push(e.message));
          page.on("response", (r) => {
            const url = r.url();
            // socal's engine probes js/socal-dem-grid.js — an OPTIONAL
            // generated USGS 3DEP grid. Absent it falls back to the shipped
            // synthetic relief (documented in the demSource hint), so the
            // probe 404 is expected, not a broken asset.
            const optionalDemGrid = url.endsWith("/js/socal-dem-grid.js");
            if (r.status() === 404 && !url.endsWith("favicon.ico") && !optionalDemGrid) missing.push(`404 ${url}`);
          });
          page.on("requestfailed", (r) => {
            const url = r.url();
            if (!url.endsWith("favicon.ico") && !url.endsWith("/js/socal-dem-grid.js")) missing.push(`failed ${url} (${r.failure()?.errorText})`);
          });
          try {
            const greeran = route.includes("greeran");
            await page.goto(`http://127.0.0.1:${port}${route}`, {
              waitUntil: "domcontentloaded",
              timeout: 30_000,
            });
            // City/socal frames signal `ready · …`; greeran's boot contract keeps
            // its node-count status line (tests/viewer-boot.test.mjs /nodes · /).
            await page.waitForFunction(
              greeran
                ? () => /nodes · /.test(document.querySelector("#status")?.textContent ?? "")
                : () => document.querySelector("#status")?.textContent.startsWith("ready"),
              { timeout: 30_000 },
            );
            const info = await page.evaluate(() => ({
              status: document.querySelector("#status")?.textContent ?? "",
              canvas: [
                document.querySelector("#stage")?.width ?? 0,
                document.querySelector("#stage")?.height ?? 0,
              ],
              layers: document.querySelector("#layerList")?.children.length ?? 0,
              fallback: !!document.querySelector(".fallback"),
            }));
            const stageEl = await page.$("#stage");
            const shot = stageEl ? await stageEl.screenshot() : null;
            const pix = shot ? pngLitPixels(Buffer.from(shot)) : null;

            const why = [];
            if (errors.length) why.push(`page errors: ${errors.join(" | ").slice(0, 400)}`);
            if (missing.length) why.push(`missing: ${missing.slice(0, 6).join(", ")}`);
            if (info.fallback) why.push("WebGL fallback shown");
            if (!(info.canvas[0] > 0 && info.canvas[1] > 0)) why.push(`canvas ${info.canvas.join("x")}`);
            if (info.layers < 1) why.push(`layers=${info.layers}`);
            const statusOk = greeran ? /nodes · /.test(info.status) : /^ready/.test(info.status);
            if (!statusOk) why.push(`status=${JSON.stringify(info.status.slice(0, 80))}`);
            if (!pix || pix.lit < 200) why.push(`stage not rasterised (lit=${pix ? pix.lit : "none"})`);
            if (why.length) failures.push(`${route}: ${why.join("; ")}`);
          } catch (e) {
            const extra = [...errors, ...missing].slice(0, 6).join(" | ");
            failures.push(`${route}: ${e.message?.slice(0, 300)}${extra ? ` [${extra.slice(0, 300)}]` : ""}`);
          } finally {
            await page.close().catch(() => {});
          }
        }
        assert.deepEqual(failures, [], `subsurface fleet failures:\n${failures.join("\n")}`);
      });
    } finally {
      server.close();
    }
  },
);
