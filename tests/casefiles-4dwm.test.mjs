/**
 * CASEFILES · 4DWM — the theater's math, its markup contract, and the archive
 * that ships it.
 *
 *   node --test tests/casefiles-4dwm.test.mjs
 *
 * Three groups:
 *   1. the pure field builders and the timeline filter (no DOM, no canvas);
 *   2. the page contract — ids the controller asks the DOM for must exist, and
 *      the markup must not define an id twice;
 *   3. the boundary of casefiles.xdc itself: a real webxdc ZIP, carrying the
 *      current sources, with the theater inside it and every shipped reference
 *      resolvable without a network.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { existsSync as exists, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { unzipSync } from "../vendor/fflate/index.mjs";

import {
  TIERS, SHELF_LANES, laneFor, inferKind, captureYear, logSize,
  shelfColumns, corpusFor, CASE_CORPORA, buildShelfField, columnsUpTo,
  buildByteField, entropyColor, byteMarkers, fieldToVrml,
} from "../js/casefiles-4dwm.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = (rel) => readFileSync(path.join(root, rel), "utf8");
const decoder = new TextDecoder();

/* ============================================================== 1 · fields */

test("capture timestamps become decimal years, and junk stays null", () => {
  assert.equal(captureYear("19981204015537").toFixed(2), "1998.92", "Dec 4 is day 338 of 365");
  assert.equal(captureYear("19980101000000").toFixed(4), "1998.0000");
  assert.ok(captureYear("19980615120000") > 1998.4 && captureYear("19980615120000") < 1998.5);
  for (const bad of ["", "not-a-ts", "1998", "18990101000000", null, undefined]) {
    assert.equal(captureYear(bad), null, `${String(bad)} must not yield a year`);
  }
});

test("shelf lanes follow the capture kind, and a bare name falls back to its extension", () => {
  assert.equal(laneFor({ kind: "z" }), 0, "archives open the first shelf");
  assert.equal(laneFor({ kind: "!" }), 3, "a late capture moves to the suspect shelf");
  assert.equal(laneFor({ kind: "h" }), 2);
  assert.equal(laneFor({ lane: 4 }), 4, "a row already on the unrecovered shelf stays there");
  assert.equal(inferKind("winnuke.zip"), "z");
  assert.equal(inferKind("INDEX.HTM"), "h");
  assert.equal(inferKind("readme.txt"), "t");
  assert.equal(inferKind("payload"), "t");
  assert.equal(SHELF_LANES.length, 5);
  assert.equal(SHELF_LANES[4].id, "x", "the unrecovered shelf is last");
});

test("the corpus is the pinned index plus the absences, tiered honestly", () => {
  const cols = shelfColumns({});
  assert.ok(cols.length > 150, `expected a full corpus, got ${cols.length}`);
  const byTier = cols.reduce((acc, c) => ((acc[c.tier] = (acc[c.tier] || 0) + 1), acc), {});
  assert.ok(byTier.indexed > 100, "most rows are index-only until something is fetched");
  assert.equal(byTier.verified, undefined, "nothing is verified before the SHA-1 gate runs");
  assert.equal(byTier.claimed, 12, "the twelve never-captured files are claimed");

  // A claimed row has no bytes: height 0, and it sits in the last lane.
  const claimed = cols.filter((c) => c.tier === "claimed");
  assert.ok(claimed.every((c) => c.bytes === 0 && c.captured === false));
  assert.ok(claimed.every((c) => c.lane === 4));

  // Hand the same rows a verified name and only that column changes tier.
  const verified = shelfColumns({ verified: new Set(["winnuke.zip"]) });
  const winnuke = verified.find((c) => c.name === "winnuke.zip");
  assert.equal(winnuke.tier, "verified");
  assert.notEqual(verified.find((c) => c.name === "land.zip").tier, "verified");

  for (const t of TIERS) assert.match(t.color, /^#[0-9a-f]{6}$/, `${t.id} colour is a hex triple`);
  assert.deepEqual(TIERS.map((t) => t.id), ["verified", "indexed", "claimed"]);
});

test("the shelf field is a finite grid whose interpolation is declared", () => {
  const field = buildShelfField(shelfColumns({}), { bins: 24 });
  assert.equal(field.plate, "shelf");
  assert.equal(field.nx, 24);
  assert.equal(field.ny, SHELF_LANES.length);
  assert.equal(field.elev.length, field.nx * field.ny);
  assert.ok(field.interpolated, "binning + 1-2-1 smoothing must be flagged, not hidden");
  for (const v of field.elev) assert.ok(Number.isFinite(v) && v >= 0, "elevations finite and non-negative");
  assert.ok(field.max > 0);
  assert.ok(field.years.min < field.years.max);
  for (const c of field.columns) {
    assert.ok(c.bin >= 0 && c.bin < field.nx, `${c.name} bin inside the grid`);
    assert.ok(c.h >= 0 && c.h <= 1, `${c.name} height in 0..1`);
    assert.ok(c.fx >= 0 && c.fx <= 1 && c.fz >= 0 && c.fz <= 1);
  }
  assert.equal(field.bins.reduce((n, b) => n + b.n, 0), field.columns.length, "every column lands in a bin");
  assert.ok(field.units.floor && field.units.column, "both normalisations are named");
  assert.equal(logSize(0), 0);
  assert.ok(Math.abs(logSize(8 * 1024 * 1024) - 1) < 0.01, "8 MiB is one unit");
  assert.ok(logSize(40 * 1024) < logSize(400 * 1024), "monotone in size");
});

test("the 4th axis filters columns; the aggregate view is the whole corpus", () => {
  const field = buildShelfField(shelfColumns({}), { bins: 24 });
  const all = columnsUpTo(field.columns, null, field.years.max);
  assert.equal(all.length, field.columns.length, "no cursor = all time");
  assert.equal(columnsUpTo(field.columns, field.years.max, field.years.max).length, field.columns.length);
  const mid = (field.years.min + field.years.max) / 2;
  const early = columnsUpTo(field.columns, mid, field.years.max);
  assert.ok(early.length > 0 && early.length < field.columns.length, `partial view is a strict subset (${early.length}/${field.columns.length})`);
  assert.ok(early.every((c) => c.year <= mid + 1e-9), "nothing from the future");
  assert.deepEqual(columnsUpTo(undefined, 1998, 1999), []);
});

test("only cases that ship pinned index rows get a SHELF plate", () => {
  for (const id of Object.keys(CASE_CORPORA)) {
    const corpus = corpusFor(id, {});
    assert.ok(corpus && corpus.columns.length > 0, `${id} has a corpus`);
    assert.ok(corpus.columns.every((c) => Number.isFinite(c.year)));
  }
  for (const id of ["ramrod", "dss", "huunloop", "demo", "local", "nope"]) {
    assert.equal(corpusFor(id, {}), null, `${id} must say it has no corpus instead of drawing one`);
  }
});

test("the bit-plane relief reads the difference between text, code and noise", () => {
  const ascii = new Uint8Array(Buffer.from("The quick brown fox jumps over the lazy dog. ".repeat(64), "latin1"));
  const text = buildByteField(ascii, { bins: 24 });
  assert.equal(text.plate, "bytes");
  assert.equal(text.ny, 8);
  assert.equal(text.elev.length, text.nx * text.ny);
  assert.equal(text.nx, text.rows.length, "no phantom columns past the end of the file");
  assert.ok(text.rows.every((r) => r.entropy >= 0 && r.entropy <= 8));
  // 7-bit ASCII never sets bit 7, so plane 7 is flat — the signature is real.
  assert.equal(text.elev.subarray(0, text.nx).reduce((a, b) => a + b, 0), 0, "bit 7 stays clear in ASCII");
  assert.ok(text.rows.every((r) => r.entropy < 7), `ASCII is not random (${Math.max(...text.rows.map((r) => r.entropy)).toFixed(2)} bits/B)`);

  // Linear congruential noise: bit 7 is busy and entropy is near the ceiling.
  const noise = new Uint8Array(8192);
  let s = 12345;
    // The *high* bits of a Park–Miller-style LCG are the usable ones; the low
  // bit of that generator has period 2, which would make this a noise test that
  // accidentally measures the worst bits.
  for (let i = 0; i < noise.length; i++) { s = (1103515245 * s + 12345) & 0x7fffffff; noise[i] = (s >>> 16) & 0xff; }
  const rnd = buildByteField(noise, { bins: 24 });
  assert.ok(Math.max(...rnd.rows.map((r) => r.entropy)) > 7, "noise reads as high entropy");
  assert.ok(rnd.elev[0] > 0.2, "bit 7 does work on noise");

  for (const row of rnd.rows) for (let i = 0; i < row.len; i++) assert.ok(row.entropy >= 0);
  assert.ok(rnd.window % 8 === 0, "windows are whole bytes");
  assert.ok(text.bytesLen === ascii.length);

  // Degenerate inputs must still produce a drawable, finite grid.
  for (const bytes of [new Uint8Array(0), new Uint8Array([0x4d, 0x5a]), new Uint8Array(64)]) {
    const f = buildByteField(bytes, { bins: 12 });
    assert.ok(f.nx >= 1 && f.elev.length % f.ny === 0);
    for (const v of f.elev) assert.ok(Number.isFinite(v) && v >= 0 && v <= 1);
  }
  assert.match(entropyColor(7.5), /ff5470/);
  assert.match(entropyColor(6.5), /f7d56a/);
  assert.match(entropyColor(3), /4be585/);
});

test("markers point the lab at the addresses it already recovered", () => {
  const bytes = new Uint8Array(4096);
  const artifact = {
    name: "test.exe", bytes, base: 0x100, entry: 0x120,
    meta: { kind: "MZ" },
    techniques: [{ label: "int 21h — file services", note: "DOS calls", addrs: [0x140, 0x190, 0x1a0] }],
    symbols: [{ addr: 0x150, label: "loc_150", ref: { calls: 3, jumps: 1 } }],
  };
  const marks = byteMarkers(artifact, { max: 8 });
  assert.equal(marks[0].kind, "entry");
  assert.equal(marks[0].tier, "verified", "the entry point is declared by the header, so it is the one official marker");
  assert.ok(marks.some((m) => m.label.startsWith("int 21h")), "technique addresses carry over");
  assert.ok(marks.every((m) => m.fx >= 0 && m.fx <= 1), "every marker sits inside the plate");
  assert.ok(marks.every((m) => Number.isFinite(m.off)));
  assert.deepEqual(byteMarkers(null), []);
  assert.deepEqual(byteMarkers({ name: "x", bytes, base: 0, meta: { kind: "TXT" } }), []);
});

test("the VRML writer stays honest about what it is exporting", () => {
  const field = buildShelfField(shelfColumns({}), { bins: 16 });
  const wrl = fieldToVrml(field, { title: "CASEFILES 4DWM · test", provenance: "unit test" });
  assert.ok(wrl.startsWith("#VRML V2.0 utf8"));
  assert.match(wrl, /DEF LAYER_MESH/);
  assert.match(wrl, /DEF LAYER_COLUMNS/);
  assert.match(wrl, /IndexedFaceSet/);
  assert.ok(!/NaN/.test(wrl), "no NaN reaches a VRML coordinate");
  assert.match(wrl, /NOT a survey product/, "the header must disclaim terrain language");
  assert.ok(!/USGS|3DEP/.test(wrl), "this plate is byte statistics, not a DEM — no borrowed provenance");
  assert.equal((wrl.match(/Transform \{ translation/g) || []).length, field.columns.length, "one column node per capture");

  const empty = fieldToVrml(buildByteField(new Uint8Array([0x50, 0x4b, 0x03, 0x04]), { bins: 8 }), {});
  assert.ok(empty.includes("#VRML V2.0 utf8") && empty.includes("IndexedFaceSet"));
  assert.ok(!/LAYER_COLUMNS/.test(empty), "the byte plate has no corpus columns to write");
});

/* ============================================================== 2 · markup */

test("every element the theater asks for exists, and no id is used twice", () => {
  const html = source("casefiles.html");
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  assert.deepEqual(dupes, [], `duplicate ids in casefiles.html: ${dupes.join(", ")}`);
  // Ids the controllers build for themselves count as present, exactly as
  // tools/check-dom-ids.mjs treats them.
  const sources = [source("js/casefiles.js"), source("js/casefiles-4dwm.js")];
  const defined = new Set(ids);
  for (const src of sources) {
    for (const m of src.matchAll(/\bid:\s*"([^"]+)"/g)) defined.add(m[1]);
    for (const m of src.matchAll(/\.id\s*=\s*"([^"]+)"/g)) defined.add(m[1]);
  }
  for (const src of sources) {
    for (const m of src.matchAll(/\$\("([^"]+)"\)/g)) {
      assert.ok(defined.has(m[1]), `${m[1]} is looked up but never defined`);
    }
  }
  for (const [attr, count] of [["data-cf4-plate", 2], ["data-cf4-mode", 3], ["data-wm4d", 3]]) {
    assert.equal((html.match(new RegExp(attr, "g")) || []).length, count, `${attr} controls`);
  }
  assert.match(html, /<canvas id="cf4Canvas"[^>]*>[^<]+/m, "the canvas carries fallback text");
  assert.match(html, /aria-live="polite"/, "the HUD announces");
  assert.match(html, /id="cf4LabelLayer" aria-hidden="true"/, "labels are decorative duplicates of the drawn pips");
});

test("the theater degrades without a 2D context instead of taking the lab with it", () => {
  const js = source("js/casefiles-4dwm.js");
  assert.match(js, /if \(!ctx2d\) \{/, "a null context is handled, not thrown through");
  assert.match(js, /prefers-reduced-motion/, "the auto-spin and easing respect reduced motion");
  assert.doesNotMatch(js, /innerHTML\s*=\s*[^`]*\$\{c\.name/, "no unescaped name reaches innerHTML");
  const controller = source("js/casefiles.js");
  assert.match(controller, /const tellTheater = \(method, \.\.\.args\) => \{\n  try \{/, "the lab's calls into the plate are wrapped");
  assert.match(controller, /if \(id === "theater"\) ensureTheater\(\)\?\.show\?\.\(\);/, "the plate mounts on first use, not at boot");
});

/* ========================================================== 2b · render */

/**
 * A DOM thin enough to run the plate headlessly: the point is not to assert
 * layout, it is to prove the render loop, the plate switch and the pip windows
 * survive real calls with no canvas behind them. tests/lib.mjs's makeCanvas()
 * double flags every non-finite draw argument, which is how a broken projection
 * shows up in a browser: silently, as a polygon that is simply not there.
 */
function fakeEl(tag = "div", id = "") {
  const listeners = {};
  const el = {
    tag, id, hidden: false, textContent: "", innerHTML: "", style: {}, dataset: {},
    children: [],
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    append(...kids) { this.children.push(...kids); },
    prepend(...kids) { this.children.unshift(...kids); },
    appendChild(c) { this.children.push(c); return c; },
    remove() {},
    setAttribute(k, v) { if (k === "id") this.id = v; this[k] = v; },
    getAttribute(k) { return this[k]; },
    addEventListener(name, fn) { (listeners[name] ||= []).push(fn); },
    removeEventListener() {},
    dispatch(name, ev = {}) { for (const fn of listeners[name] || []) fn(ev); },
    querySelector() { return fakeEl("div"); },
    querySelectorAll() { return []; },
    closest() { return null; },
    getBoundingClientRect() { return { left: 0, top: 0, width: 800, height: 480 }; },
    setPointerCapture() {}, releasePointerCapture() {}, focus() {}, click() {},
  };
  return el;
}

test("the plate renders headlessly: no NaN reaches the canvas, and the plates swap without a reload", async () => {
  const { makeCanvas } = await import("./lib.mjs");
  const painted = makeCanvas();        // the canvas double, with its own ctx
  Object.assign(painted._ctx, {
    createLinearGradient: () => ({ addColorStop() {} }),
    clearRect: () => {},   // the double counts draws; a wipe is not one
  });
  const ids = new Map();
  const get = (id) => {
    if (!ids.has(id)) {
      const el = id === "cf4Canvas"
        ? Object.assign(painted, {
            parentElement: fakeEl("div"), id,
            getContext: (k) => (k === "2d" ? painted._ctx : null),
            setAttribute() {}, getAttribute() { return null; },
            addEventListener() {}, removeEventListener() {}, setPointerCapture() {},
          })
        : fakeEl("div", id);
      ids.set(id, el);
    }
    return ids.get(id);
  };
  const plateButtons = ["shelf", "bytes"].map((p) => Object.assign(fakeEl("button"), { dataset: { cf4Plate: p } }));
  const modeButtons = ["relief", "wire", "xray"].map((m) => Object.assign(fakeEl("button"), { dataset: { cf4Mode: m } }));
  const controls = new Map([["[data-cf4-plate]", plateButtons], ["[data-cf4-mode]", modeButtons]]);
  const log = [];
  globalThis.document = {
    getElementById: get,
    querySelectorAll: (sel) => controls.get(sel) || [],
    createElement: (tag) => fakeEl(tag),
    addEventListener() {},
    body: fakeEl("body"),
  };
  globalThis.window = { devicePixelRatio: 1, innerWidth: 1280, innerHeight: 900 };
  globalThis.matchMedia = () => ({ matches: false });
  globalThis.ResizeObserver = class { observe() {} disconnect() {} };
  const queue = [];
  globalThis.requestAnimationFrame = (cb) => (queue.push(cb), queue.length);
  globalThis.cancelAnimationFrame = () => {};

  const mod = await import("../js/casefiles-4dwm.js");
  const state = { caseId: "krome", artifact: null, recovered: new Map(), verified: new Set() };
  const theater = mod.initCasefilesTheater({
    getState: () => state,
    log: (m) => log.push(m),
    recover: () => true,
    openRecovered: () => true,
    inspectAddress: () => true,
  });
  assert.ok(theater, "the plate mounted against the stub DOM");
  const pump = (n = 3) => {
    for (let i = 0; i < n; i++) {
      const cbs = queue.splice(0);
      for (const cb of cbs) cb(16.7 * (i + 1) + n);
    }
  };
  pump();
  assert.ok(painted._ctx.ops.fill > 50, `the SHELF plate painted ${painted._ctx.ops.fill} polygons`);
  assert.deepEqual(painted._ctx.bad, [], "no non-finite draw call");
  assert.equal(get("cf4Empty").hidden, true, "a case with a corpus is not the empty state");
  assert.ok(ids.get("cf4LabelLayer").children.length > 0, "landmark captures got projected labels");

  // Modes and plates must swap without a reload and without poisoning the frame.
  for (const b of modeButtons) b.dispatch("click");
  for (const b of plateButtons) b.dispatch("click");
  pump(2);
  assert.deepEqual(painted._ctx.bad, [], "still finite after a mode/plate sweep");

  // The artifact reaches the plate before the button is pressed, because the
  // handler refuses to switch to BYTES with nothing on the table (and says so).
  state.artifact = {
    name: "test.exe", bytes: new Uint8Array(4096), base: 0x100, entry: 0x120,
    meta: { kind: "MZ" }, techniques: [{ label: "int 21h", note: "DOS", addrs: [0x210] }], symbols: [],
  };
  theater.setArtifact(state.artifact);
  plateButtons[1].dispatch("click");
  pump(2);
  assert.match(get("cf4Hud").textContent, /plate BYTES/, "the HUD names the plate it switched to");
  assert.ok(painted._ctx.ops.fill > 100, "the BIT-PLANE plate paints too");
  assert.ok(painted._ctx.ops.stroke > 0, "sweep line and pip stems are stroked");
  assert.deepEqual(painted._ctx.bad, []);
  const bytesPainted = painted._ctx.ops.fill;

  // And a plate with no bytes refuses instead of drawing an empty relief.
  theater.setArtifact(null);
  state.artifact = null;
  plateButtons[1].dispatch("click");
  assert.match(get("cf4Hud").textContent, /no artifact on the table/, "the refusal is stated, not silently ignored");
  state.artifact = { name: "test.exe", bytes: new Uint8Array(4096), base: 0x100, entry: 0x120, meta: { kind: "MZ" }, techniques: [], symbols: [] };
  theater.setArtifact(state.artifact);
  plateButtons[1].dispatch("click");
  assert.ok(painted._ctx.ops.fill >= bytesPainted);

  // No bytes and no pinned index rows: a message, not a blank canvas. And the
  // plate label follows the field that is actually on screen.
  state.artifact = null;
  theater.setArtifact(null);
  state.caseId = "demo";
  theater.setCase("demo");
  pump(1);
  assert.equal(get("cf4Empty").hidden, false, "the empty state is explained");
  assert.match(get("cf4Empty").textContent, /no pinned capture corpus/);
  state.caseId = "krome";
  theater.setCase("krome");
  pump(1);
  assert.equal(get("cf4Empty").hidden, true, "a case with rows clears the message");
  assert.ok(painted._ctx.ops.fill > 0 && painted._ctx.bad.length === 0);

  // Verification re-tiers the corpus in place; the plate must survive it.
  const before = painted._ctx.ops.fill;
  state.caseId = "krome";
  theater.verificationChanged(new Set(["winnuke.zip", "land.zip"]));
  theater.show();
  pump(2);
  assert.ok(painted._ctx.ops.fill >= before, "a re-tier repaints the plate");
  assert.equal(painted._ctx.bad.length, 0);
  theater.dispose();
});
/* ============================================================= 3 · archive */

test("casefiles.xdc is a real webxdc ZIP with the 4DWM family layout", () => {
  const raw = readFileSync(path.join(root, "casefiles.xdc"));
  assert.equal(raw.slice(0, 2).toString("latin1"), "PK", "a .xdc is a deflated ZIP, not the old NUL-delimited container");
  const files = unzipSync(new Uint8Array(raw));
  const names = Object.keys(files);
  for (const required of [
    "index.html", "manifest.toml", "webxdc.js", "icon.png", "demo.exe",
    "js/casefiles.js", "js/casefiles-4dwm.js", "js/project-y-4dwm.js", "js/vrml-export.js",
    "js/ghidra-wasm.js", "js/x86dis.js", "js/krome-catalog.js", "js/artifacts.js", "js/makint.js",
    "css/casefiles.css", "css/casefiles-4dwm.css", "css/project-y-4dwm.css", "css/validator.css",
    "vendor/fflate/index.mjs", "vendor/fflate/LICENSE",
    "wasm/ghidra/ghidra_decompiler.wasm", "wasm/ghidra/processors.json",
  ]) {
    assert.ok(files[required], `casefiles.xdc is missing ${required}`);
  }
  assert.match(decoder.decode(files["manifest.toml"]), /^name = "CASEFILES/m);
  assert.match(decoder.decode(files["manifest.toml"]), /source_code_url = "https:\/\/github.com\/shdwelf\/Html5"/);
  assert.ok(names.some((n) => /^wasm\/ghidra\/Processors\/x86\/.*x86\.sla$/.test(n)), "the x86 SLEIGH definition ships too");
});

test("the shipped archive carries the current sources, theater included", () => {
  const files = unzipSync(new Uint8Array(readFileSync(path.join(root, "casefiles.xdc"))));
  for (const rel of ["js/casefiles.js", "js/casefiles-4dwm.js", "css/casefiles-4dwm.css", "css/casefiles.css", "js/vrml-export.js", "js/project-y-4dwm.js"]) {
    assert.equal(decoder.decode(files[rel]), source(rel), `${rel} is stale inside casefiles.xdc`);
  }
  const index = decoder.decode(files["index.html"]);
  assert.equal(index, source("casefiles.html")
    .replace('  <script type="module" src="./js/casefiles.js"></script>', '  <script src="./webxdc.js"></script>\n  <script type="module" src="./js/casefiles.js"></script>')
    .replace('  <link rel="manifest" href="./manifest.webmanifest" />\n', "")
    .replace('  <link rel="icon" href="./img/app-192.png" sizes="192x192" />\n', "")
    .replace('  <link rel="apple-touch-icon" href="./img/apple-touch.png" sizes="180x180" />\n', ""),
  "index.html is casefiles.html plus the webxdc shim and nothing else");
  assert.match(index, /THEATER · 4DWM/);
  assert.match(index, /<script src="\.\/webxdc\.js"><\/script>/, "the host shim loads before the module");
  assert.match(index, /id="cf4Canvas"/);
  assert.match(index, /id="cf4Desk"/, "the 4Dwm desk ships with the plate");

  // A host serves the archive from an arbitrary path: no root-absolute URLs.
  assert.ok(!/["']\/(js|css|vendor|wasm|img)\//.test(index), "index.html uses relative references only");
});

test("the bundle resolves on its own: every relative reference is in the archive", () => {
  const files = unzipSync(new Uint8Array(readFileSync(path.join(root, "casefiles.xdc"))));
  const names = new Set(Object.keys(files));
  const broken = [];
  for (const name of names) {
    if (!/\.(js|mjs)$/.test(name)) continue;
    const src = decoder.decode(files[name]);
    const specs = [...src.matchAll(/\b(?:import\s+(?:[^'";]*?\s+from\s*)?|export\s+[^'";]*?\s+from\s*)["']([^"']+)["']/g)].map((m) => m[1]);
    for (const spec of specs) {
      if (!spec.startsWith(".")) { broken.push(`${name}: bare specifier ${spec}`); continue; }
      const target = path.posix.normalize(path.posix.join(path.posix.dirname(name), spec));
      if (!names.has(target)) broken.push(`${name}: ${spec} is not in the archive`);
    }
  }
  assert.deepEqual(broken, []);
  const fflate = decoder.decode(files["vendor/fflate/index.mjs"]);
  assert.ok(!fflate.includes("createRequire"), "the Node-only fflate preamble cannot ship to a browser");
  assert.match(fflate, /var Worker;/, "the worker probe stays, and its try/catch is what now decides the sync path");
});

test("the single-file build and the archive are the same lab, both with a theater", () => {
  const inlined = source("casefiles-inlined.html");
  assert.ok(!/<link rel="stylesheet"/.test(inlined) && !/<script src=/.test(inlined), "the standalone build references nothing external");
  for (const needle of ["initCasefilesTheater", "buildShelfField", "fieldToVrml", "initPipWm", 'data-view="theater"']) {
    assert.ok(inlined.includes(needle), `casefiles-inlined.html lost ${needle}`);
  }
  const files = unzipSync(new Uint8Array(readFileSync(path.join(root, "casefiles.xdc"))));
  assert.ok(inlined.includes("CAPTURE CORPUS") && decoder.decode(files["index.html"]).includes("CAPTURE CORPUS"), "both builds offer the same plate");
});

test("the multi-page SITE-K archive carries the theater as well", () => {
  const files = unzipSync(new Uint8Array(readFileSync(path.join(root, "sitek.xdc"))));
  for (const rel of ["casefiles.html", "js/casefiles.js", "js/casefiles-4dwm.js", "css/casefiles-4dwm.css", "js/book-builder.js", "js/book-builder-retrowave.js", "sw.js", "demo.exe"]) {
    assert.ok(files[rel], `sitek.xdc is missing ${rel}`);
    if (/\.(html|js|css)$/.test(rel)) {
      assert.equal(decoder.decode(files[rel]), source(rel), `sitek.xdc ships a stale ${rel}`);
    }
  }
  assert.match(decoder.decode(files["sw.js"]), /"\.\/js\/casefiles-4dwm\.js"/, "the service worker precaches the plate");
  assert.match(decoder.decode(files["sw.js"]), /"\.\/css\/casefiles-4dwm\.css"/);
  // The pack script that owns this archive must know about the bytes the plate needs.
  assert.match(source("tools/pack_xdc.sh"), /cp manifest\.webmanifest webxdc\.js sw\.js demo\.exe/);
});

test("the page graph closes, and the inliner's flat list covers every module in it", () => {
  // 1. every src/href in the page resolves on disk
  const html = source("casefiles.html");
  for (const m of html.matchAll(/(?:src|href)="\.\/([^"#?]+)/g)) {
    const rel = m[1];
    if (rel === "manifest.webmanifest" || rel.startsWith("img/")) continue; // PWA assets, not app code
    assert.ok(exists(path.join(root, rel)), `casefiles.html references ./${rel}, which does not exist`);
  }

  // 2. walk the real module graph from the page entry
  const seen = new Set();
  const pending = ["js/casefiles.js"];
  while (pending.length) {
    const rel = pending.pop();
    if (seen.has(rel)) continue;
    seen.add(rel);
    for (const m of source(rel).matchAll(/\bfrom\s+["'](\.[^"']+)["']/g)) {
      pending.push(path.posix.normalize(path.posix.join(path.posix.dirname(rel), m[1])));
    }
  }
  assert.ok(seen.has("js/casefiles-4dwm.js"), "the theater is reachable from the controller");
  for (const rel of seen) assert.ok(exists(path.join(root, rel)), `${rel} does not resolve`);

  // 3. the single-file build concatenates a hand-written list, so a module the
  //    graph reaches but the list omits would surface as an undefined name in
  //    the browser, far from the cause. Assert the list is a superset.
  const tool = source("tools/build_casefiles.mjs");
  const bundled = new Set([...tool.matchAll(/\["((?:js|vendor)\/[^"]+)",/g)].map((m) => m[1]));
  for (const rel of seen) {
    const covered = bundled.has(rel) || (rel.startsWith("vendor/fflate") && bundled.has("vendor/fflate"));
    assert.ok(covered, `${rel} is imported by the page but never inlined into casefiles-inlined.html`);
  }
});
