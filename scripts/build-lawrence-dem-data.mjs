#!/usr/bin/env node
/**
 * Compile the versioned Lawrence 3DEP point-sample grid to a browser module.
 *
 *   node scripts/build-lawrence-dem-data.mjs
 *
 * The JSON is the auditable source; the generated module is shipped in the
 * offline xdc. Values are rounded to decimetres in the source register.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(root, "data/lawrence/dem-anchors.json");
const outputPath = path.join(root, "js/lawrence-dem-data.js");
const source = JSON.parse(await readFile(sourcePath, "utf8"));
const { meta, grid } = source;

if (!Number.isInteger(grid.nx) || !Number.isInteger(grid.ny) || grid.nx < 2 || grid.ny < 2) {
  throw new Error("Lawrence DEM grid dimensions must be integers >= 2.");
}
if (!Array.isArray(grid.values) || grid.values.length !== grid.nx * grid.ny) {
  throw new Error(`Expected ${grid.nx * grid.ny} elevation values; got ${grid.values?.length ?? "none"}.`);
}
if (grid.values.some((value) => !Number.isFinite(value) || value < -32000 || value > 32000)) {
  throw new Error("Lawrence DEM contains an invalid elevation value.");
}
if (!(grid.lon0 < grid.lon1 && grid.lat0 < grid.lat1)) {
  throw new Error("Lawrence DEM bounds are invalid.");
}

const moduleText = `/**
 * GENERATED from data/lawrence/dem-anchors.json by
 * scripts/build-lawrence-dem-data.mjs — do not edit by hand.
 *
 * Sparse 8x8 USGS 3DEP control grid, not a full-resolution DEM. The source
 * resolution and interpolation limitations are disclosed in DEM_META.
 */
export const DEM_META = Object.freeze(${JSON.stringify(meta, null, 2)});

export const DEM_GRID = Object.freeze({
  lon0: ${grid.lon0}, lat0: ${grid.lat0},
  lon1: ${grid.lon1}, lat1: ${grid.lat1},
  nx: ${grid.nx}, ny: ${grid.ny},
  units: ${JSON.stringify(grid.units)},
  data: new Float32Array(${JSON.stringify(grid.values)}),
});
`;

await writeFile(outputPath, moduleText, "utf8");
console.log(`Generated ${path.relative(root, outputPath)} from ${path.relative(root, sourcePath)} (${grid.nx}x${grid.ny}, ${grid.values.length} samples).`);
