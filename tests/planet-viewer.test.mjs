import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { buildPlates, PLATE_ORDER, bboxKm, elevScaleKm } from "../js/planet-viewer-data.js";
import { runChecks } from "../js/planet-viewer-checks.js";
import { demToVrml } from "../js/vrml-export.js";

/* ======================================================================
   data adapter
   ====================================================================== */

test("every plate normalises to a finite grid with a world size", () => {
  const plates = buildPlates(64, 48);
  for (const id of PLATE_ORDER) {
    const p = plates[id];
    assert.ok(p, `missing plate ${id}`);
    assert.ok(p.grid.nx > 1 && p.grid.ny > 1, `${id}: degenerate grid`);
    assert.equal(p.grid.elev.length, p.grid.nx * p.grid.ny);
    for (const v of p.grid.elev) assert.ok(Number.isFinite(v), `${id}: non-finite elevation`);
    assert.ok(p.grid.max > p.grid.min, `${id}: no relief`);
    assert.ok(p.world.w > 0 && p.world.d > 0, `${id}: no world size`);
    assert.equal(p.grid.bbox.length, 4);
  }
});

test("bboxKm is the right order for a known extent", () => {
  // One degree of latitude ~110.6 km; at the equator longitude ~111.3 km.
  const { wKm, dKm } = bboxKm([-10, 0, -9, 1]);
  assert.ok(Math.abs(dKm - 110.574) < 0.5, `dKm ${dKm}`);
  assert.ok(Math.abs(wKm - 111.32) < 1, `wKm ${wKm}`);
  // At 60N a degree of longitude halves.
  const hi = bboxKm([-10, 60, -9, 61]);
  assert.ok(Math.abs(hi.wKm - 111.32 * 0.5) < 1, `60N wKm ${hi.wKm}`);
});

test("elevScaleKm is true-scale times exaggeration", () => {
  assert.equal(elevScaleKm(1000, 50, 1), 1 / 1000);
  assert.equal(elevScaleKm(1000, 50, 5), 5 / 1000);
});

/* ======================================================================
   cross-checks
   ====================================================================== */

test("all cross-checks run and pass", () => {
  const all = runChecks(buildPlates(96, 72));
  assert.ok(all.length >= 15, `expected a substantial check set, got ${all.length}`);
  for (const c of all) {
    assert.equal(typeof c.ok, "boolean", `${c.id}`);
    assert.ok(c.label && c.actual && c.expected, `${c.id} missing fields`);
  }
  const failing = all.filter((c) => !c.ok);
  assert.deepEqual(failing.map((c) => `${c.id}: ${c.actual}`), [], "all checks must pass");
});

test("control-point reproduction is among the checks and passes", () => {
  const all = runChecks(buildPlates(64, 48));
  const repro = all.filter((c) => c.id.endsWith("/control-repro"));
  assert.equal(repro.length, 2, "chey and ange control checks");
  for (const c of repro) assert.ok(c.ok, `${c.id}: ${c.actual}`);
});

test("lawrence has packed GNIS in its box and the mountain plates do not", () => {
  const all = runChecks(buildPlates(64, 48));
  const gaz = Object.fromEntries(all.filter((c) => c.id.endsWith("/gaz-in-box")).map((c) => [c.plate, c]));
  assert.ok(gaz.lawrence.ok);
  assert.match(gaz.lawrence.actual, /^[1-9]\d* hits/, "lawrence should have hits");
  assert.match(gaz.chey.actual, /^0 hits/, "chey has no packed city");
  assert.match(gaz.ange.actual, /^0 hits/, "ange has no packed city");
});

/* ======================================================================
   VRML export
   ====================================================================== */

test("the terrarium export of every plate is structurally valid", () => {
  const plates = buildPlates(64, 48);
  for (const id of PLATE_ORDER) {
    const p = plates[id];
    const wrl = demToVrml(p.grid, { w: p.world.w, d: p.world.d, elevScale: 3 / 1000 }, null, `Planet viewer — ${p.name}`, {
      layers: { weather: false, glass: false },
    });
    assert.match(wrl, /^#VRML V2\.0 utf8/);
    assert.match(wrl, /IndexedFaceSet/);
    let depth = 0;
    for (const ch of wrl) {
      if (ch === "{") depth++;
      else if (ch === "}") depth--;
      assert.ok(depth >= 0, "unbalanced braces");
    }
    assert.equal(depth, 0, "unclosed brace");
    assert.ok(!/NaN|Infinity|undefined/.test(wrl), "non-finite value in VRML");
  }
});

/* ======================================================================
   page wiring
   ====================================================================== */

test("the page wires every control the viewer binds", () => {
  const html = readFileSync(new URL("../planet-viewer-4dwm.html", import.meta.url), "utf8");
  assert.match(html, /css\/planet-viewer-4dwm\.css/);
  assert.match(html, /<script type="module" src="\.\/js\/planet-viewer-4dwm\.js"><\/script>/);
  for (const id of ["stage", "globeStage", "labels", "layerList", "checkList", "infoTitle", "infoBody", "cardList", "pipLayer", "wm4dDesk", "wm4dTray", "wm4dStatus", "statPlate", "statChecks", "hudFps", "status", "btnLabels", "btnVrml", "btnReset", "vertExag", "vertExagVal", "searchBox", "searchResults"]) {
    assert.ok(html.includes(`id="${id}"`), `missing #${id}`);
  }
  for (const b of ["chey", "ange", "lawrence", "globe"]) assert.ok(html.includes(`data-plate="${b}"`));
  for (const m of ["relief", "wire", "xray"]) assert.ok(html.includes(`data-mode="${m}"`));
});

test("the viewer reuses the shared modules rather than re-deriving", () => {
  const app = readFileSync(new URL("../js/planet-viewer-4dwm.js", import.meta.url), "utf8");
  for (const sym of ["hypsometric", "sampleDem", "makeGazetteerIndex", "searchBox", "searchName", "demToVrml", "initPipWm", "buildPlates", "runChecks"]) {
    assert.ok(app.includes(sym), `viewer does not use ${sym}`);
  }
  // Metre/kilometre convention is stated and the exaggeration is explicit.
  assert.match(app, /one kilometre/i);
  assert.match(app, /exag \/ 1000/);
});

/* ======================================================================
   globe plate (S4 tail, round 44): the Red October globe, reused
   ====================================================================== */

import { COUNTRIES } from "../js/country-data.js";
import {
  GLOBE_PROVENANCE,
  coastlineRings,
  globeMarkers,
  graticule,
  projectOrthographic,
  projectSegments,
  visibleMarkers,
} from "../js/planet-globe.js";

test("globe reuses the Red October orthographic projection, not a copy", () => {
  const src = readFileSync(new URL("../js/planet-globe.js", import.meta.url), "utf8");
  assert.match(src, /from "\.\.\/apps\/red-october-command-viewer\/core\.js"/);
  assert.ok(GLOBE_PROVENANCE.projection.includes("red-october-command-viewer"));
  const centre = projectOrthographic(20, 10, 20, 10);
  assert.ok(centre.visible && Math.abs(centre.x) < 1e-12 && Math.abs(centre.y) < 1e-12);
  assert.ok(!projectOrthographic(-20, 190, 20, 10).visible, "antipode must be hidden");
  const east = projectOrthographic(0, 90, 0, 0);
  assert.ok(east.visible && Math.abs(east.x - 1) < 1e-9, "limb point projects to disc edge");
});

test("globe markers are the country viewer's capitals, never invented points", () => {
  const { markers, skipped } = globeMarkers(COUNTRIES);
  assert.equal(markers.length + skipped, COUNTRIES.length);
  assert.ok(markers.length >= 230, `expected nearly all 233 capitals, got ${markers.length}`);
  for (const m of markers) {
    assert.ok(Number.isFinite(m.lat) && Number.isFinite(m.lon));
    assert.ok(m.capital.length > 0, `${m.code}: marker carries its capital name`);
  }
  const us = markers.find((m) => m.code === "us");
  assert.ok(us && /Washington/.test(us.capital), "US marker is its Factbook capital");
  const vis = visibleMarkers(markers, 20, 10);
  assert.ok(vis.length > 50 && vis.length < markers.length, "one hemisphere shows a proper subset");
  for (const v of vis) assert.ok(v.z >= 0 && v.x * v.x + v.y * v.y <= 1.000001, "visible markers stay on the disc");
});

test("globe coastlines come from the bundled Natural Earth outlines", () => {
  const geo = JSON.parse(readFileSync(new URL("../vendor/world/countries.geo.json", import.meta.url), "utf8"));
  const rings = coastlineRings(geo);
  assert.ok(rings.length >= 180, `expected rings for 180 features, got ${rings.length}`);
  let pts = 0;
  for (const ring of rings) {
    for (const [lon, lat] of ring) {
      assert.ok(lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90, "coastline coordinate in range");
      pts++;
    }
  }
  assert.ok(pts > 5000, `coastline should be substantial, got ${pts} points`);
  const segs = projectSegments(rings[0], 35, 62);
  for (const seg of segs) for (const p of seg) assert.ok(p.z >= 0, "segment points are visible-side only");
  const grat = graticule(20);
  assert.equal(grat.meridians.length, 18);
  assert.equal(grat.parallels.length, 9);
});

test("globe plate wiring lives in the viewer, with an honest VRML guard", () => {
  const app = readFileSync(new URL("../js/planet-viewer-4dwm.js", import.meta.url), "utf8");
  for (const sym of ["globeMarkers", "visibleMarkers", "coastlineRings", "projectSegments", "drawGlobe", "setGlobe"]) {
    assert.ok(app.includes(sym), `viewer does not use ${sym}`);
  }
  assert.match(app, /VRML export belongs to the terrain plates/);
  assert.match(app, /vendor\/world\/countries\.geo\.json/);
});
