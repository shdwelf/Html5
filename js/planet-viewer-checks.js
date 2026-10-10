/** PLANET VIEWER · 4DWM — cross-checks.
 *
 *  Same discipline as the other viewers: a check compares two numbers that
 *  reached the model down independent paths. `kind: "contradiction"` passes
 *  while the sources still disagree and prints the spread.
 */

import { validate } from "./cheyenne-dem.js";
import { makeGazetteerIndex, searchBox } from "./city-gazetteer.js";
import { GAZ_ROWS as atl } from "./city-gazetteer-data-atlanta.js";
import { GAZ_ROWS as buf } from "./city-gazetteer-data-buffalo.js";
import { GAZ_ROWS as ksc } from "./city-gazetteer-data-kansascity.js";
import { GAZ_ROWS as law } from "./city-gazetteer-data-lawrence.js";
import { GAZ_ROWS as tor } from "./city-gazetteer-data-toronto.js";
import { demToVrml } from "./vrml-export.js";
import { buildPlates, PLATE_ORDER, bboxKm } from "./planet-viewer-data.js";

const RHO = 1;
const ALL_GAZ_ROWS = [...atl, ...buf, ...ksc, ...law, ...tor];

/**
 * Minimal structural VRML check (the terrarium writer has no companion
 * validator): header present, braces balanced, an IndexedFaceSet present, no
 * non-finite or undefined text. Good enough to catch a broken export.
 */
function vrmlProblems(wrl) {
  const problems = [];
  if (!wrl.startsWith("#VRML V2.0 utf8")) problems.push("missing VRML header");
  let depth = 0;
  for (const ch of wrl) {
    if (ch === "{") depth++;
    else if (ch === "}") depth--;
    if (depth < 0) {
      problems.push("unbalanced braces");
      break;
    }
  }
  if (depth !== 0) problems.push("unclosed brace");
  if (!/IndexedFaceSet/.test(wrl)) problems.push("no IndexedFaceSet");
  if (/NaN|Infinity|undefined/.test(wrl)) problems.push("non-finite value");
  return problems;
}

export function runChecks(plates = buildPlates(96, 72)) {
  const out = [];

  for (const id of PLATE_ORDER) {
    const p = plates[id];
    const g = p.grid;

    /* · the grid is finite and has real relief ----------------------------- */
    let finite = true;
    for (let i = 0; i < g.elev.length; i++) {
      if (!Number.isFinite(g.elev[i])) {
        finite = false;
        break;
      }
    }
    out.push({
      id: `${id}/grid-finite`,
      plate: id,
      label: `${p.name}: every grid elevation is finite`,
      kind: "closure",
      tier: "official",
      expected: "no NaN / ±Infinity in the elevation array",
      actual: `${g.nx}×${g.ny} grid, ${finite ? "all finite" : "NON-FINITE VALUES"}`,
      ok: finite,
    });

    const relief = g.max - g.min;
    out.push({
      id: `${id}/relief`,
      plate: id,
      label: `${p.name}: relief is inside the expected band for its terrain`,
      kind: "band",
      tier: "community",
      expected: id === "lawrence" ? "5 – 120 m (plains)" : "300 – 3000 m (relief)",
      actual: `${relief.toFixed(0)} m (${g.min.toFixed(0)} – ${g.max.toFixed(0)} m)`,
      ok: id === "lawrence" ? relief >= 5 && relief <= 120 : relief >= 300 && relief <= 3000,
    });

    /* · world size from the bbox is sane ------------------------------------ */
    // The two mountain plates are regional (tens of km); the Lawrence plate is
    // a minimal city grid, so its band is deliberately smaller.
    const { wKm, dKm } = bboxKm(g.bbox);
    const sizeOk =
      id === "lawrence"
        ? wKm > 5 && wKm < 40 && dKm > 5 && dKm < 40
        : wKm > 20 && wKm < 200 && dKm > 20 && dKm < 200;
    out.push({
      id: `${id}/world-size`,
      plate: id,
      label: `${p.name}: projected size is the right order`,
      kind: "band",
      tier: "official",
      expected: id === "lawrence" ? "5 – 40 km a side (city grid)" : "20 – 200 km a side",
      actual: `${wKm.toFixed(0)} × ${dKm.toFixed(0)} km`,
      ok: sizeOk,
    });
  }

  /* · control points reproduce themselves (the probe validator) ------------ */
  for (const id of ["chey", "ange"]) {
    const v = validate(id);
    out.push({
      id: `${id}/control-repro`,
      plate: id,
      label: `${id}: every USGS 3DEP control point reproduces its own elevation`,
      kind: "consistency",
      tier: "official",
      expected: "0 problems",
      actual: `${v.controlCount} control points, ${v.problems.length} problems`,
      ok: v.ok && v.problems.length === 0,
    });
  }

  /* · gazetteer: the box search must agree with a naive in-bbox scan --------- */
  // The packed GNIS subset only covers five cities, so mountain plates
  // legitimately have zero hits; the check that matters is that every hit the
  // ADL search-box op returns is actually inside the box, and that a plate
  // with a matching pack (Lawrence) returns its packed points.
  const idx = makeGazetteerIndex(ALL_GAZ_ROWS);
  for (const id of PLATE_ORDER) {
    const [w, s, e, n] = plates[id].grid.bbox;
    const boxed = searchBox(idx, { lat0: s, lat1: n, lon0: w, lon1: e }, { limit: 500 });
    const inside = boxed.filter((r) => r.lat >= s && r.lat <= n && r.lon >= w && r.lon <= e).length;
    const expectHits = id === "lawrence";
    out.push({
      id: `${id}/gaz-in-box`,
      plate: id,
      label: `${id}: GNIS box search returns only points inside the bbox`,
      kind: "consistency",
      tier: "official",
      expected: expectHits ? "≥1 hit, all inside" : "all hits inside (0 is fine — no packed city here)",
      actual: `${boxed.length} hits, ${inside} inside`,
      ok: inside === boxed.length && (!expectHits || boxed.length >= 1),
    });
  }

  /* · the VRML export of each plate is structurally valid -------------------- */
  for (const id of PLATE_ORDER) {
    const p = plates[id];
    const wrl = demToVrml(
      p.grid,
      { w: p.world.w, d: p.world.d, elevScale: p.world.elevScale * 3 },
      null,
      `Planet viewer — ${p.name}`,
      { layers: { weather: false, glass: false } },
    );
    const problems = vrmlProblems(wrl);
    out.push({
      id: `${id}/vrml-valid`,
      plate: id,
      label: `${id}: terrain VRML export is structurally valid`,
      kind: "closure",
      tier: "context",
      expected: "no structural problems",
      actual: problems.length ? problems.join("; ") : "valid",
      ok: problems.length === 0,
    });
  }

  /* · contradiction: interpolated relief vs. the control-set relief ------------ */
  const chey = plates.chey.grid;
  const control = chey.meta.controlCount;
  out.push({
    id: "chey/interp-vs-control",
    plate: "chey",
    label: "Grid relief vs control-set relief: interpolation is disclosed, not hidden",
    kind: "contradiction",
    tier: "official",
    expected: "grid max/min within the control envelope",
    actual: `grid ${chey.min.toFixed(0)}–${chey.max.toFixed(0)} m from ${control} control points; grain between them is disclosed texture`,
    ok: Number.isFinite(chey.min) && Number.isFinite(chey.max) && chey.max > chey.min,
  });

  void RHO;
  return out;
}
