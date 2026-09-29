#!/usr/bin/env node
/**
 * Emit data/vincennes/dem.json \u2014 the elevation control set, its provenance,
 * and a small probe table used to regression-test the interpolator.
 *
 * The grid itself is NOT written out: js/vincennes-dem.js rebuilds it in a
 * few milliseconds from the control points, and a 240\u00d7220 Float32 grid per
 * theater would add ~600 KB of derived data to the repository for no gain.
 * What is written is the input and the expected output \u2014 the two things a
 * reviewer needs in order to disagree with the model.
 *
 *   node tools/make-vincennes-dem.mjs
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DEM_CONTROL, DEM_META, buildGrid, sampleDem, validateControl } from "../js/vincennes-dem.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(root, "data/vincennes");

const PROBES = {
  "hormuz-1988": [
    ["Bukhun, Qeshm", 56.05, 26.86],
    ["Hengam summit", 55.88, 26.655],
    ["Hormuz Island", 56.46, 27.05],
    ["Vincennes launch fix", 56.0158, 26.5131],
    ["IR 655 impact fix", 56.0167, 26.6292],
    ["strait, mid-channel", 56.2, 26.5],
  ],
  "savo-1942": [
    ["Savo Island summit", 159.818, -9.135],
    ["Vincennes (CA-44) wreck", 159.8667, -9.1667],
    ["Iron Bottom Sound, mid", 160.0, -9.2],
    ["Cape Esperance", 159.705, -9.258],
  ],
  "leyte-1944": [
    ["Yu Shan, Formosa", 120.95, 23.47],
    ["Philippine Trench axis", 127.0, 12.5],
    ["Samar interior", 125.1, 11.1],
  ],
};

const out = {
  meta: {
    crs: "EPSG:4326",
    units: "metres",
    vdatum: DEM_META.vdatum,
    elevSource: DEM_META.status,
    generated: "tools/make-vincennes-dem.mjs",
    consumer: "js/vincennes-dem.js",
    disclosure:
      "These are published spot elevations and soundings interpolated onto a grid. They are not a sample of a USGS raster. None of these three theaters is covered by 3DEP; the USGS/EROS products that do cover them are listed under `products`, together with the command that swaps a real clip in.",
    swapIn: DEM_META.swapIn,
    license: DEM_META.license,
  },
  products: DEM_META.products,
  theaters: {},
};

mkdirSync(outDir, { recursive: true });

for (const [id, t] of Object.entries(DEM_CONTROL)) {
  const v = validateControl(id);
  if (!v.ok) {
    console.error(`${id}: control validation FAILED`, v.problems);
    process.exitCode = 1;
  }
  const grid = buildGrid(id, 240, 220);
  const probes = (PROBES[id] ?? []).map(([label, lon, lat]) => ({
    label,
    lon,
    lat,
    elevM: Math.round(sampleDem(grid, lon, lat)),
  }));
  out.theaters[id] = {
    bbox: t.bbox,
    shelfDeg: t.shelfDeg,
    seaFloorM: t.seaFloorM,
    note: t.note,
    landPolygons: t.land.map((p) => ({ id: p.id, name: p.name, vertices: p.ring.length })),
    control: t.control.map((c) => ({
      lon: c.lon,
      lat: c.lat,
      elevM: c.elev,
      kind: c.sea ? "sounding" : "spot-height",
      name: c.name,
      src: c.src,
    })),
    gridProbe: { nx: grid.nx, ny: grid.ny, minM: Math.round(grid.min), maxM: Math.round(grid.max) },
    probes,
  };
  console.log(
    `${id.padEnd(14)} ${t.control.length} control  ${t.land.length} polygons  ` +
      `range ${Math.round(grid.min)}\u2026${Math.round(grid.max)} m  ${probes.length} probes  ${v.ok ? "\u2713" : "\u2717"}`
  );
}

const path = resolve(outDir, "dem.json");
writeFileSync(path, JSON.stringify(out, null, 2) + "\n");
console.log(`\nwrote ${path}`);
