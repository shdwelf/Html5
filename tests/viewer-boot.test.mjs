// Viewer boot regression: every subsurface/country/planet page must
// actually boot in a DOM — status ready, zero runtime errors.
//
// Why this exists: the engine suites import data modules but never ran
// js/city-subsurface.js end-to-end (the Puppeteer browser test skips
// without Chromium), so two real breaks shipped unnoticed:
//   1. a temporal-dead-zone crash — addGazEntry() during boot-time
//      gazetteer population called refreshGazClasses(), which read
//      panel consts declared further down; every city frame died at
//      boot with "Cannot access 'gazClassesHost' before initialization".
//   2. an orphan page — Georgia-subsurface.html (a stale pre-rename
//      duplicate of the georgia frame) had no preload and no loader
//      key, so it died with "unknown city: Georgia".
// This suite boots the real pages in jsdom with a stubbed WebGL/canvas
// surface (only the GL rasteriser is faked; all engine code runs),
// drives basic interactions, and fails on any runtime error.
// Needs jsdom: npm i --no-save --ignore-scripts jsdom (skips without).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
let JSDOM = null;
try { ({ JSDOM } = require("jsdom")); } catch { /* skip below */ }

let currentErrors = null;
process.on("uncaughtException", (e) => {
  if (currentErrors) currentErrors.push("uncaught: " + String(e.message || e).slice(0, 160));
});
process.on("unhandledRejection", (e) => {
  if (currentErrors) currentErrors.push("reject: " + String(e?.message || e).slice(0, 160));
});

let bootCounter = 0;
async function bootPage(pageFile, tickMs = 600) {
  const html = readFileSync(path.join(root, pageFile), "utf8");
  const dom = new JSDOM(html, { url: "http://localhost/" + pageFile });
  const { window } = dom;
  const errors = [];
  currentErrors = errors;

  const ctx2d = () => new Proxy({
    measureText: (t) => ({ width: String(t).length * 5 }),
    createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }),
    getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }),
    createLinearGradient: () => ({ addColorStop() {} }),
    createRadialGradient: () => ({ addColorStop() {} }),
  }, { get: (t, k) => (k in t ? t[k] : () => {}), set: () => true });

  const fakeGl = (canvas) => {
    const cache = new Map();
    const consts = new Map();
    let versionConst = -1;
    return new Proxy({}, {
      get(t, k) {
        if (k === "canvas") return canvas;
        if (typeof k === "string" && /^[A-Z][A-Z0-9_]+$/.test(k)) {
          if (!consts.has(k)) consts.set(k, 0x1000 + consts.size);
          if (k === "VERSION") versionConst = consts.get(k);
          return consts.get(k);
        }
        if (k === "getParameter") return (p) => (p === versionConst ? "WebGL 1.0 (boot-stub)" : 4096);
        if (k === "getExtension") return () => null;
        if (k === "getShaderPrecisionFormat") return () => ({ rangeMin: 127, rangeMax: 127, precision: 23 });
        if (k === "getError") return () => 0;
        if (k === "getProgramParameter" || k === "getShaderParameter") return () => true;
        if (k === "getAttribLocation") return () => 0;
        if (k === "checkFramebufferStatus") return () => 36053;
        if (/InfoLog$/.test(k) || k === "getShaderSource") return () => "";
        if (k === "getActiveUniform" || k === "getActiveAttrib") return () => ({ name: "uStub", size: 1, type: 5126 });
        if (typeof k === "string") {
          if (!cache.has(k)) cache.set(k, () => ({}));
          return cache.get(k);
        }
        return undefined;
      },
      set: () => true,
    });
  };

  window.HTMLCanvasElement.prototype.getContext = function (kind) {
    return kind === "2d" ? (() => { const c = ctx2d(); c.canvas = this; return c; })() : fakeGl(this);
  };
  window.HTMLCanvasElement.prototype.toDataURL = () => "data:,";
  window.HTMLElement.prototype.scrollIntoView = function () {};
  window.URL.createObjectURL = () => "blob:fake";
  window.URL.revokeObjectURL = () => {};
  let rafN = 0;
  window.requestAnimationFrame = (cb) => (rafN++ > 60 ? 0 : setTimeout(() => cb(Date.now()), 0));
  window.cancelAnimationFrame = (id) => clearTimeout(id);
  window.matchMedia = window.matchMedia || (() => ({ matches: false, addEventListener() {}, addListener() {} }));

  globalThis.window = window;
  globalThis.document = window.document;
  globalThis.requestAnimationFrame = window.requestAnimationFrame;
  globalThis.cancelAnimationFrame = window.cancelAnimationFrame;
  try { Object.defineProperty(globalThis, "navigator", { value: window.navigator, configurable: true }); } catch {}
  for (const k of ["Node", "Element", "HTMLElement", "HTMLCanvasElement", "MouseEvent", "KeyboardEvent", "Event", "CustomEvent"]) {
    globalThis[k] = window[k];
  }
  globalThis.getComputedStyle = window.getComputedStyle.bind(window);
  globalThis.addEventListener = window.addEventListener.bind(window);
  globalThis.removeEventListener = window.removeEventListener.bind(window);
  globalThis.location = window.location;
  globalThis.history = window.history;
  globalThis.localStorage = window.localStorage;
  globalThis.sessionStorage = window.sessionStorage;
  globalThis.self = globalThis;
  globalThis.devicePixelRatio = 1;
  globalThis.innerWidth = 1280;
  globalThis.innerHeight = 900;

  const scripts = [...window.document.querySelectorAll("script")]
    .map((s) => ({ src: s.getAttribute("src"), type: s.getAttribute("type") }))
    .filter((s) => s.src && !s.src.includes("webxdc"));
  for (const s of scripts) {
    const abs = path.join(root, s.src.replace(/^\.\//, ""));
    if (s.type === "module") {
      await import(pathToFileURL(abs).href + `?boot=${++bootCounter}`);
    } else {
      window.eval(readFileSync(abs, "utf8"));
    }
  }
  await new Promise((r) => setTimeout(r, tickMs));
  return { window, document: window.document, errors };
}

const opts = { skip: !JSDOM && "jsdom not installed" };

test("every subsurface page is a configured frame or a known standalone", () => {
  const cities = Object.keys(JSON.parse(readFileSync(path.join(root, "resources/city-subsurface/cities.json"), "utf8")).cities);
  // "Georgia" is the user-mandated legacy alias frame: data-city="georgia" + preload,
  // packaged as Georgia-subsurface.xdc — repaired (not orphaned) in round 52.
  const known = new Set([...cities, "socal", "socal-subsurface-inlined", "greeran", "Georgia"]);
  const pages = readdirSync(root).filter((f) => f.endsWith("-subsurface.html"))
    .map((f) => f.slice(0, -"-subsurface.html".length));
  for (const p of pages) assert.ok(known.has(p), `orphan subsurface page: ${p}-subsurface.html`);
  for (const id of cities) {
    assert.ok(existsSync(path.join(root, `${id}-subsurface.html`)), `${id}: page missing`);
    assert.ok(existsSync(path.join(root, `js/city-frame-preload-${id}.js`)), `${id}: preload missing`);
  }
});

// DEM frame, statewide frame, island/coast frame, the renamed-id frame,
// and the capital-letter-id frame — the boot paths that broke before.
for (const id of ["lawrence", "texas", "hawaii", "georgia", "Kentucky"]) {
  test(`city frame boots clean and answers interactions: ${id}`, opts, async () => {
    const { window, document, errors } = await bootPage(`${id}-subsurface.html`);
    assert.match(document.getElementById("status").textContent, /^ready · /);
    const layerBox = document.querySelector(".layer-row input");
    assert.ok(layerBox, "layer panel rendered");
    layerBox.click();
    layerBox.click();
    const gazQuery = document.getElementById("gazQuery");
    assert.ok(gazQuery, "gazetteer search rendered");
    gazQuery.value = "a";
    gazQuery.dispatchEvent(new window.Event("input", { bubbles: true }));
    const viewSelect = document.getElementById("viewSelect");
    if (viewSelect && viewSelect.options.length > 1) {
      viewSelect.selectedIndex = 1;
      viewSelect.dispatchEvent(new window.Event("change", { bubbles: true }));
    }
    await new Promise((r) => setTimeout(r, 120));
    assert.deepEqual(errors, [], `${id} runtime errors`);
  });
}

test("socal and greeran engines boot clean", opts, async () => {
  const socal = await bootPage("socal-subsurface.html");
  assert.match(socal.document.getElementById("status").textContent, /^ready · /);
  assert.deepEqual(socal.errors, []);
  const greeran = await bootPage("greeran-subsurface.html");
  assert.match(greeran.document.getElementById("status").textContent, /nodes · /);
  assert.deepEqual(greeran.errors, []);
});

test("country viewer renders its register and answers search + selection", opts, async () => {
  const { window, document, errors } = await bootPage("country-viewer.html");
  const buttons = document.querySelectorAll("#countries button");
  // 250 profiles since the batch-3 completion register (233 batch-2 seeds
  // + 17 capital-less profiles seeded verbatim; only the EU profile skips).
  assert.equal(buttons.length, 250);
  buttons[0].click();
  assert.match(document.getElementById("detail").textContent, /Capital/);
  const search = document.getElementById("search");
  search.value = "japan";
  search.dispatchEvent(new window.Event("input", { bubbles: true }));
  const filtered = [...document.querySelectorAll("#countries button")];
  assert.ok(filtered.length >= 1 && filtered.length < 250);
  // A capital-less profile (Hong Kong) renders its honest capital line.
  search.value = "Hong Kong";
  search.dispatchEvent(new window.Event("input", { bubbles: true }));
  const HongKongButtons = [...document.querySelectorAll("#countries button")];
  assert.equal(HongKongButtons.length, 1);
  HongKongButtons[0].click();
  assert.match(document.getElementById("detail").textContent,
    /none published \(source profile lists no capital\)/);
  assert.deepEqual(errors, []);
});

test("planet viewer boots and finishes loading its plates", opts, async () => {
  const { document, errors } = await bootPage("planet-viewer-4dwm.html", 900);
  const status = document.getElementById("status").textContent;
  assert.notEqual(status, "boot…");
  assert.match(status, /plates|plate/i);
  assert.deepEqual(errors, []);
});

test("keyviewer (mathspace) boots and answers interactions", opts, async () => {
  const { window, document, errors } = await bootPage("keyviewer.html");
  // The compendium renders from js/mathspace.js data.
  assert.ok(document.querySelectorAll("#identityCards .card").length >= 35, "identity cards render");
  assert.ok(document.querySelectorAll("#formulaCards .card").length >= 45, "formula cards render");
  assert.equal(document.querySelectorAll("#specialTable tr").length, 17, "special-angle table + header");
  // Unit circle: 90° readout.
  const angleInput = document.getElementById("angleDeg");
  angleInput.value = "90";
  angleInput.dispatchEvent(new window.Event("input", { bubbles: true }));
  assert.match(document.getElementById("circleReadout").textContent, /sinθ = 1/);
  // Search narrows the compendium.
  const search = document.getElementById("compSearch");
  search.value = "heron";
  search.dispatchEvent(new window.Event("input", { bubbles: true }));
  const heronCards = document.querySelectorAll("#formulaCards .card");
  assert.ok(heronCards.length >= 1 && heronCards.length < 10, "search narrows to Heron-mentioning formulas");
  assert.match(heronCards[0].textContent, /Heron/);
  // Solver example produces the 3-4-5 solution.
  document.getElementById("solve345").click();
  assert.match(document.getElementById("solverOut").textContent, /area=6/);
  assert.deepEqual(errors, []);
});
