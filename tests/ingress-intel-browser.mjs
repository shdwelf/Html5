/**
 * INGRESS INTEL 4Dwm — real-browser check (Blink + SwiftShader, via the shared
 * harness in tests/lib-browser.mjs).
 *
 *   npm i --no-save puppeteer-core @sparticuz/chromium
 *   node tests/ingress-intel-browser.mjs [url]
 *
 * With no argument it serves the repo root itself; with a URL it drives that page
 * instead, which is how the same checks are run against the vite dev server (the
 * optional DEM import is only interesting when a bundler is in the loop).
 *
 * This is the only place the app is proven to *draw*, because the whole point of
 * it is a WebGL stage plus a network ladder, and neither exists under bare node.
 * Everything asserted here is about honesty rather than pixels: the ladder must
 * reach a verdict on all three network rungs, the frame must be labelled SIM
 * when nothing live came back, and a pasted payload must render through the same
 * code path the live feed uses. Screenshots land in /tmp for a human to look at.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { join, resolve } from "node:path";
import { ROOT, browserDeps, pngLitPixels, withBrowser } from "./lib-browser.mjs";

/**
 * A static server of our own, rather than tests/lib-browser.mjs's `serve()`.
 *
 * That helper maps the extensions it happens to need and falls back to
 * `application/octet-stream`, and Blink *refuses* a stylesheet served that way —
 * the page then renders with zero CSS, which makes every screenshot here a
 * wall of unstyled text and every layout assertion meaningless. A standalone
 * page in this repo is served with real content types, so this is too.
 */
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript", ".mjs": "text/javascript",
  ".css": "text/css", ".json": "application/json", ".map": "application/json",
  ".wasm": "application/wasm", ".svg": "image/svg+xml", ".png": "image/png",
};
function serveWithMime(root) {
  const server = createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "") || "index.html";
    const file = resolve(root, rel);
    if (!file.startsWith(resolve(root))) { res.writeHead(404).end("nope\n"); return; }
    let body;
    try { body = readFileSync(file); } catch { res.writeHead(404, { "content-type": "text/plain" }).end("not found\n"); return; }
    res.writeHead(200, { "content-type": MIME[rel.slice(rel.lastIndexOf("."))] || "application/octet-stream", "cache-control": "no-store" });
    res.end(body);
  });
  return new Promise((done) => server.listen(0, "127.0.0.1", () => done({ server, port: server.address().port })));
}

const deps = await browserDeps();
if (!deps) {
  console.log("ingress-intel · browser: SKIPPED (npm i --no-save puppeteer-core @sparticuz/chromium)");
  process.exit(0);
}

const checks = [];
const check = (name, ok, note = "") => checks.push({ name, ok, note });

/** A minimal but real getEntities body, shaped like the reference client's. */
function syntheticPayload() {
  const p = (guid, ts, team, latE6, lngE6, level, health, title) => [guid, ts, ["p", team, latE6, lngE6, level, health, 8, "", title, null, null, null, null, ts, [], [[null, level, level * 1000], [null, level, level * 900], [null, level, level * 800], [null, level, level * 700], [null, level, level * 600], [null, level, level * 500], [null, level - 1, level * 400], [null, level - 1, level * 300]], "agent", null, 0]];
  const g1 = "0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a.16";
  const g2 = "0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b.16";
  const g3 = "0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c.16";
  return JSON.stringify({
    result: {
      timestamp: Date.now(),
      map: {
        "15_9836_12688_6_8_100": {
          deletedGameEntityGuids: [],
          gameEntities: [
            p(g1, Date.now(), "R", 340522330, -1182436850, 8, 96, "CAPTURED PIKE & 7TH"),
            p(g2, Date.now(), "E", 340611110, -1182522220, 7, 62, "CAPTURED ECHO PARK LAKE"),
            p(g3, Date.now(), "R", 340700000, -1182400000, 6, 40, "CAPTURED LOS ANGELES CITY HALL"),
            [`${"0d".repeat(16)}.b`, Date.now(), ["l", "R", g1, 340522330, -1182436850, g3, 340700000, -1182400000]],
            [`${"0e".repeat(16)}.b`, Date.now(), ["l", "R", g2, 340611110, -1182522220, g3, 340700000, -1182400000]],
            [`${"0f".repeat(16)}.c`, Date.now(), ["c", "R", [[g1, 340522330, -1182436850], [g2, 340611110, -1182522220], [g3, 340700000, -1182400000]]]],
          ],
        },
      },
    },
  });
}

const external = process.argv[2] ? process.argv[2].replace(/\/+$/, "") : null;
const served = external ? null : await serveWithMime(ROOT);
const base = external || `http://127.0.0.1:${served.port}`;

try {
  await withBrowser(deps, async (browser) => {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

    const consoleErrors = [];
    const pageErrors = [];
    const netFailures = [];
    page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
    page.on("pageerror", (e) => pageErrors.push(String(e.message || e)));
    page.on("requestfailed", (r) => netFailures.push(`${r.url()} · ${r.failure()?.errorText}`));

    await page.goto(/\.html$/.test(base) ? base : `${base}/ingress-intel.html`, { waitUntil: "domcontentloaded" });

    // Boot means: the debug handle exists and the offline register has drawn.
    await page.waitForFunction("window.__ingressIntel && window.__ingressIntel.state.frame", { timeout: 60000 });
    const booted = await page.evaluate("window.__ingressIntel.summary()");
    check("boots with a frame on the plate", booted.portals > 0, `${booted.portals} portals, source ${booted.source}`);
    check("the booted frame is the offline register", booted.source === "sim", `source=${booted.source}`);

    // The ladder must run for real and reach a verdict on every probed rung.
    await page.waitForFunction("window.__ingressIntel.summary().rows.length >= 3", { timeout: 60000 });
    const ladder = await page.evaluate("window.__ingressIntel.summary()");
    const rows = ladder.rows;
    check("all three network rungs were attempted", rows.length >= 3, rows.map((r) => `${r.rung}:${r.ok ? "ok" : "no"}`).join(" "));
    check("every rung was probed from this origin", rows.map((r) => r.rung).sort().join(",") === "proxy,relay,sameorigin", rows.map((r) => r.rung).join(","));
    check("every verdict is a sentence, not a shrug", rows.every((r) => (r.detail || "").length > 12), rows.map((r) => `${r.rung}:${(r.detail || "").slice(0, 40)}`).join(" | "));
    check("every failed rung says what would fix it", rows.every((r) => r.ok || (r.fix || "").length > 8), rows.filter((r) => !r.ok).map((r) => r.rung).join(",") || "no failures");
    check("no rung is allowed to claim liveness it cannot support", !ladder.rows.some((r) => r.ok) || ladder.ladder.live === true, `live=${ladder.ladder.live} rung=${ladder.ladder.rung}`);
    check("the frame stays SIM while nothing live answered", ladder.source === "sim" || ladder.source === "capture", `source=${ladder.source}`);
    const badge = await page.evaluate(`document.getElementById("linkState").textContent + "||" + document.getElementById("watermark").textContent + "||" + document.getElementById("status").textContent`);
    check("the watermark and statusbar tell the same story", /SIM|CAPTURE/i.test(badge) && /offline register|synthetic|live/i.test(badge), badge.slice(0, 200));

    // The stage must actually rasterise: WebGL under SwiftShader, not a black box.
    // Two settled frames first — a cold bundler can serve the module while the
    // compositor has not yet blitted the canvas, and one rAF is not enough.
    await page.evaluate("new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(res, 400))))");
    const shot = await page.screenshot({ encoding: "base64" });
    const lit = pngLitPixels(Buffer.from(shot, "base64"));
    check("the globe stage rasterises", !!lit && lit.lit > lit.total * 0.08, lit ? `${lit.lit}/${lit.total} lit px` : "png unreadable");

    const hud = await page.evaluate(`({
      stage: document.getElementById("hudStage").textContent,
      source: document.getElementById("hudSource").textContent,
      rungs: document.querySelectorAll("#ladderList .rung").length,
      layers: document.querySelectorAll("#layerList .layer-row").length,
      gaz: document.querySelectorAll("#gazHits li").length,
      score: document.querySelectorAll("#scoreBars .score-row").length,
    })`);
    check("the ladder renders a card per rung, probed or not", hud.rungs === 6, `${hud.rungs} cards of ${6}`);
    check("the layer list is populated", hud.layers >= 10, `${hud.layers} layers`);
    check("the score panel reads off the frame", hud.score >= 3, `${hud.score} faction rows`);
    check("the HUD names the frame source", /sim|offline|register/i.test(hud.source), hud.source);
    check("the HUD names the stage", /basin|globe|plate/i.test(hud.stage), hud.stage);

    // Pasting a payload must go through the shared reader and re-draw.
    const payload = syntheticPayload();
    const after = await page.evaluate(`(async () => {
      // Drive the real UI path: type into the import box, press IMPORT. The
      // console handle is a mirror of this, not a side door.
      const box = document.getElementById("intelPaste");
      box.value = ${JSON.stringify(payload)};
      document.getElementById("btnImport").click();
      await new Promise((res) => setTimeout(res, 300));
      const s = window.__ingressIntel.summary();
      return { ...s, payload: document.querySelector("#pipFeed .payload")?.textContent ?? "", note: document.getElementById("sysline").textContent, status: document.getElementById("status").textContent };
    })()`);
    check("a pasted getEntities payload renders", after.portals === 3 && after.links === 2 && after.fields === 1, JSON.stringify({ portals: after.portals, links: after.links, fields: after.fields, warnings: after.warnings.length }));
    check("the payload path keeps its own provenance", after.source === "capture" || after.source === "import", `source=${after.source} · ${after.note.slice(0, 80)}`);
    check("the feed panel logs what the reader did", /capture\/ok · read/.test(after.note), after.note.slice(0, 90));
    check("the statusbar announces the capture", /CAPTURE|read entities/.test(after.status), after.status.slice(0, 90));
    const decoded = await page.evaluate(`(() => {
      const f = window.__ingressIntel.state.frame;
      return { tier: f.portals[0].tier, prov: f.portals[0].provenance || "", mu: f.portals[0].mu, level: f.portals[0].level, fieldMu: f.fields[0]?.mu ?? null };
    })()`);
    check("imported records carry a provenance string", decoded.prov.length > 8, `${decoded.tier} · ${decoded.prov.slice(0, 70)}`);
    check("MU is summed from resonators, not invented", decoded.mu >= 8 && typeof decoded.level === "number", `mu=${decoded.mu} level=${decoded.level} fieldMu=${decoded.fieldMu}`);
    const csv = await page.evaluate(`(() => {
      const f = window.__ingressIntel.state.frame;
      return f.portals.map((p) => [p.title, p.team, p.level, Math.round(p.mu)].join("|")).join("\\n");
    })()`);
    check("the exported rows are the records on screen", /CAPTURED PIKE/.test(csv) && /ENL|RES/.test(csv), csv.replace(/\n/g, " · ").slice(0, 140));

    // The search box is inside a <form>; Enter must search, not reload the page
    // and throw the imported frame away with it.
    await page.evaluate(`(() => { document.getElementById("searchBox").value = "PIKE"; })()`);
    await page.focus("#searchBox");
    await page.keyboard.press("Enter");
    await new Promise((r) => setTimeout(r, 250));
    const searched = await page.evaluate(`({
      hits: document.querySelectorAll("#searchResults .search-hit").length,
      text: document.getElementById("searchResults").textContent,
      stillGotFrame: !!window.__ingressIntel.state.frame,
    })`);
    check("Enter in the search box searches instead of reloading", searched.hits > 0 && /PIKE/i.test(searched.text) && searched.stillGotFrame, `${searched.hits} hits · frame kept=${searched.stillGotFrame}`);
    await page.evaluate(`(() => { document.getElementById("searchBox").value = ""; window.__ingressIntel.state.lastTileRequest = null; })()`);

    const cam = await page.evaluate(`document.getElementById("hudCam").textContent`);
    check("the HUD reports camera state in reproducible units", /r=[\d.]+.*az \d+°.*z\d+/.test(cam), cam);

    // View switching to the planet must re-point the same frame, not refetch.
    await page.select("#viewSelect", "globe");
    await page.waitForFunction("window.__ingressIntel.state.view === \"globe\"", { timeout: 20000 });
    const globe = await page.evaluate(`(() => {
      const s = window.__ingressIntel.summary();
      return { ...s, canvas: !!document.querySelector("#stage"), labels: document.querySelectorAll("#labels .lbl").length };
    })()`);
    check("the globe view draws the same frame", globe.view === "globe" && globe.portals === 3, JSON.stringify({ view: globe.view, portals: globe.portals, labels: globe.labels }));
    await page.evaluate("new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(res, 400))))");
    const globeShot = await page.screenshot({ encoding: "base64" });
    const globeLit = pngLitPixels(Buffer.from(globeShot, "base64"));
    check("the sphere rasterises", !!globeLit && globeLit.lit > globeLit.total * 0.05, globeLit ? `${globeLit.lit}/${globeLit.total} lit px` : "png unreadable");

    // The tile request panel is the contract a relay author needs; it must be
    // computable with no network at all.
    await page.click("#btnTilesHere");
    const req = await page.evaluate(`document.getElementById("tileRequest").textContent`);
    check("the tile request is spelled out offline", /1\d_\d+_\d+/.test(req) && /tileKeys/.test(req), req.replace(/\s+/g, " ").slice(0, 160));
    const requested = await page.evaluate(`(() => {
      const r = window.__ingressIntel.state.lastTileRequest;
      const printed = document.getElementById("tileRequest").textContent;
      return {
        n: r?.body?.tileKeys.length ?? -1,
        allSameZoom: !!r && r.body.tileKeys.every((k) => k.split("_")[0] === String(r.body.tileKeys[0].split("_")[0])),
        keysInPrinted: (printed.match(/[0-9]+_[0-9]+_[0-9]+/g) || []).length,
        sample: printed.slice(0, 240),
        zoom: r?.zoom,
        url: r?.url || "",
        curl: /curl -sN/.test(printed),
      };
    })()`);
    check("the request body is real JSON with same-zoom tile keys", requested.n > 0 && requested.allSameZoom, `${requested.n} tiles at z${requested.zoom}`);
    check("the panel prints the same keys it built", requested.keysInPrinted >= requested.n, `${requested.keysInPrinted} printed of ${requested.n} :: ${JSON.stringify(requested.sample)}`);
    check("the panel hands over a runnable curl", requested.curl, requested.url);

    // Reduced-motion + fallback guard: a page with no WebGL must say so plainly.
    const noGl = await browser.newPage();
    await noGl.setViewport({ width: 900, height: 600 });
    await noGl.evaluateOnNewDocument(() => {
      const orig = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
        if (String(type).includes("webgl")) return null;
        return orig.call(this, type, ...rest);
      };
    });
    await noGl.goto(/\.html$/.test(base) ? base : `${base}/ingress-intel.html`, { waitUntil: "domcontentloaded" });
    await noGl.waitForSelector(".fallback, #status", { timeout: 15000 }).catch(() => {});
    const fallbackText = await noGl.evaluate(`(document.querySelector(".fallback")?.textContent || document.getElementById("status")?.textContent || "").replace(/\\s+/g," ").slice(0,240)`);
    check("no-WebGL says so instead of a black rectangle", /webgl|not available|unsupported|hardware|gpu/i.test(fallbackText), fallbackText || "(nothing rendered)");
    await noGl.close();

    writeFileSync("/tmp/ingress-intel-basin.png", Buffer.from(shot, "base64"));
    writeFileSync("/tmp/ingress-intel-globe.png", Buffer.from(globeShot, "base64"));
    check("no uncaught page errors", pageErrors.length === 0, pageErrors.join(" | ").slice(0, 300));
    // The network rungs are *supposed* to fail here, and the DEM grid is an
    // optional asset the app imports in a try/catch — both log at the browser
    // level even though the page handles them. Anything else is a real error.
    const benign = /socal-dem-grid|intel\.ingress\.com|allorigins|corsproxy|127\.0\.0\.1:8799|net::ERR_(CONNECTION_CLOSED|NAME_NOT_RESOLVED)|Failed to load resource/i;
    const surprising = [...consoleErrors, ...netFailures.map((l) => `net ${l}`)].filter((m) => !benign.test(m));
    check("no console errors beyond the ones the ladder expects", surprising.length === 0, surprising.join(" | ").slice(0, 300));
    check("the probes really went out and really came back failing", netFailures.length + consoleErrors.length > 0, `${netFailures.length} failed requests, ${consoleErrors.length} console errors`);

    console.log(`\nscreenshots: /tmp/ingress-intel-basin.png /tmp/ingress-intel-globe.png`);
  });
} finally {
  served?.server.close();
}

let failed = 0;
for (const c of checks) {
  if (!c.ok) failed++;
  console.log(`${c.ok ? "PASS" : "FAIL"}  ${c.name}${c.note ? `  —  ${c.note}` : ""}`);
}
console.log(`\ningress-intel · browser: ${checks.length - failed}/${checks.length} checks passed`);
process.exit(failed ? 1 : 0);
