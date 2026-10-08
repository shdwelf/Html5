#!/usr/bin/env node
/**
 * Compile checked-in sparse 3DEP control grids into the shared city-engine format.
 *
 *   node scripts/build-city-dem-data.mjs                 # all registered grids
 *   node scripts/build-city-dem-data.mjs --city lawrence  # one grid
 *
 * Each source register lives at data/<city>/dem-anchors.json. No elevation is
 * interpolated or invented here: the browser receives only the stored sample
 * values and performs the documented bilinear display interpolation.
 */
import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(await readFile(path.join(root, "resources/city-subsurface/cities.json"), "utf8"));
const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
};
const onlyCity = arg("--city");

if (onlyCity && !Object.hasOwn(config.cities, onlyCity)) throw new Error(`unknown city: ${onlyCity}`);

function validate(cityId, source) {
  const meta = source?.meta;
  const grid = source?.grid;
  if (!meta || !grid) throw new Error(`${cityId}: DEM source needs meta and grid objects`);
  if (!meta.source || !meta.sourceUrl || !meta.retrieved || !meta.verticalDatum || !meta.disclosure) {
    throw new Error(`${cityId}: DEM provenance is incomplete`);
  }
  if (!Number.isInteger(grid.nx) || !Number.isInteger(grid.ny) || grid.nx < 2 || grid.ny < 2) {
    throw new Error(`${cityId}: DEM dimensions must be integers >= 2`);
  }
  if (!Array.isArray(grid.values) || grid.values.length !== grid.nx * grid.ny) {
    throw new Error(`${cityId}: expected ${grid.nx * grid.ny} DEM values; got ${grid.values?.length ?? "none"}`);
  }
  if (grid.values.some((value) => !Number.isFinite(value) || value < -500 || value > 10000)) {
    throw new Error(`${cityId}: DEM contains an invalid elevation sample`);
  }
  if (![grid.lon0, grid.lon1, grid.lat0, grid.lat1].every(Number.isFinite) || !(grid.lon0 < grid.lon1 && grid.lat0 < grid.lat1)) {
    throw new Error(`${cityId}: DEM bounds are invalid`);
  }
  if (grid.rowOrder !== "north-to-south, row-major") {
    throw new Error(`${cityId}: DEM rowOrder must be explicitly north-to-south, row-major`);
  }
  const bbox = config.cities[cityId].bbox;
  if (grid.lon0 < bbox.lon0 || grid.lon1 > bbox.lon1 || grid.lat0 < bbox.lat0 || grid.lat1 > bbox.lat1) {
    throw new Error(`${cityId}: DEM sample grid falls outside the configured city frame`);
  }
  if (meta.sourceRasterResolutionMeters != null && !(meta.sourceRasterResolutionMeters > 0)) {
    throw new Error(`${cityId}: source raster resolution must be positive when present`);
  }
}

function moduleText(cityId, { meta, grid }) {
  const moduleGrid = {
    lon0: grid.lon0,
    lat0: grid.lat0,
    lon1: grid.lon1,
    lat1: grid.lat1,
    nx: grid.nx,
    ny: grid.ny,
    units: grid.units ?? "meters",
    rowOrder: grid.rowOrder,
  };
  const metadata = {
    name: meta.name,
    source: meta.source,
    sourceUrl: meta.sourceUrl,
    retrieved: meta.retrieved,
    method: meta.method,
    sourceRasterResolutionMeters: meta.sourceRasterResolutionMeters ?? null,
    sourceRasterIds: meta.sourceRasterIds ?? [],
    sourceProduct: meta.sourceProduct ?? null,
    verticalDatum: meta.verticalDatum,
    horizontalDatum: meta.horizontalDatum ?? "EPSG:4326",
    metadataSpotChecks: meta.metadataSpotChecks ?? [],
    sampleSpacing: meta.gridSpacing,
    disclosure: `${meta.disclosure} The city engine bilinearly interpolates the samples and clamps only the narrow display-frame rim to the nearest sampled edge; this is a visualization grid, not surveyed control.`,
  };
  return `/**\n * GENERATED from data/${cityId}/dem-anchors.json by\n * scripts/build-city-dem-data.mjs — do not edit by hand.\n *\n * Sparse USGS 3DEP point samples, not a full-resolution raster.\n */\nexport const DEM_META = ${JSON.stringify(metadata, null, 2)};\n\nconst GRID = ${JSON.stringify(moduleGrid, null, 2)};\nconst VALUES = ${JSON.stringify(grid.values)};\n\nexport const DEM_GRID = { ...GRID, data: new Float32Array(VALUES) };\nexport const DEM = {\n  ...DEM_GRID,\n  source: DEM_META.source,\n  sourceUrl: DEM_META.sourceUrl,\n  retrieved: DEM_META.retrieved,\n  verticalDatum: DEM_META.verticalDatum,\n  sourceRasterResolutionMeters: DEM_META.sourceRasterResolutionMeters,\n  sampleSpacing: DEM_META.sampleSpacing,\n  disclosure: DEM_META.disclosure,\n};\nexport default DEM;\n`;
}

for (const [cityId, city] of Object.entries(config.cities)) {
  if (onlyCity && cityId !== onlyCity) continue;
  const sourcePath = path.join(root, "data", cityId, "dem-anchors.json");
  const outputPath = path.join(root, "js", `city-dem-grid-${cityId}.js`);
  try {
    await access(sourcePath);
  } catch {
    if (city.demRequired) throw new Error(`${cityId}: required DEM source is missing at ${path.relative(root, sourcePath)}`);
    continue;
  }
  const source = JSON.parse(await readFile(sourcePath, "utf8"));
  validate(cityId, source);
  await writeFile(outputPath, moduleText(cityId, source), "utf8");
  console.log(`Generated ${path.relative(root, outputPath)} from ${path.relative(root, sourcePath)} (${source.grid.nx}×${source.grid.ny}, ${source.grid.values.length} samples).`);
}
