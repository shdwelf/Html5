#!/usr/bin/env node
/**
 * Bounded ingestion adapter for measured DEM elevations into the BFV/SSE demo.
 *
 * Example: node tools/fhe-dem-sse-real-dem.mjs
 *          node tools/he-bfv-dem-sse-demo.mjs /tmp/lawrence-dem-sse-input.json
 *
 * The default public fixture uses two neighboring rows from the sparse USGS
 * 3DEP Lawrence control grid. They are different locations, NOT aligned
 * same-cell DEMs. This only exercises real elevation-value ingestion and
 * encrypted integer arithmetic; its SSE is not a terrain-accuracy metric.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DEM_SSE_BOUNDS, validateDemSseInput } from "./fhe-dem-sse-contract.mjs";

export function prepareRealDemSseInput(source, { rowA = 0, rowB = 1, count = 8 } = {}) {
  if (!source || typeof source !== "object" || !source.meta || !source.grid) throw new TypeError("expected a DEM anchor document with meta and grid");
  const { grid, meta } = source;
  const { nx, ny, values, units } = grid;
  if (!Number.isInteger(nx) || !Number.isInteger(ny) || nx < 1 || ny < 1 || !Array.isArray(values) || values.length !== nx * ny) {
    throw new TypeError("DEM grid dimensions must match its row-major values");
  }
  if (units !== "meters" || meta.verticalDatum !== "North American Vertical Datum of 1988 (NAVD 88), reported for checked source rasters") {
    throw new TypeError("expected documented meter values and the checked NAVD 88 source datum");
  }
  if (!Number.isInteger(count) || count < 1 || count > DEM_SSE_BOUNDS.maxSamples) throw new RangeError(`count must be 1–${DEM_SSE_BOUNDS.maxSamples}`);
  if (!Number.isInteger(rowA) || !Number.isInteger(rowB) || rowA < 0 || rowB < 0 || rowA >= ny || rowB >= ny || rowA === rowB) {
    throw new RangeError("choose two distinct rows inside the DEM grid");
  }
  if (count > nx) throw new RangeError("count cannot exceed the DEM grid width");

  const a = values.slice(rowA * nx, rowA * nx + count);
  const b = values.slice(rowB * nx, rowB * nx + count);
  if (![...a, ...b].every(Number.isFinite)) throw new TypeError("DEM values must be finite; handle nodata before encryption");
  const offsetMeters = Math.floor(Math.min(...a, ...b));
  const encode = (v) => Math.round(v - offsetMeters);
  const input = validateDemSseInput({ schema: 1, samples: a.map(encode), reference: b.map(encode) });
  return {
    input,
    provenance: {
      source: meta.source,
      sourceUrl: meta.sourceUrl,
      retrieved: meta.retrieved,
      sourceProduct: meta.sourceProduct,
      sourceRasterResolutionMeters: meta.sourceRasterResolutionMeters,
      verticalDatum: meta.verticalDatum,
      grid: { lon0: grid.lon0, lat0: grid.lat0, lon1: grid.lon1, lat1: grid.lat1, nx, ny, rowOrder: grid.rowOrder },
      selectedRows: [rowA, rowB],
      sampleCount: count,
      commonOffsetMeters: offsetMeters,
      quantization: "nearest whole metre after subtracting a common offset; SSE preserved to integer-metre inputs",
      interpretation: "SSE between equal-column-index samples from two different neighboring grid rows. Coordinates are not co-located; this is not a same-cell DEM comparison, residual map, accuracy estimate, or terrain-quality metric.",
    },
  };
}

async function main() {
  const args = process.argv.slice(2);
  const inputPath = args[0] || "data/lawrence/dem-anchors.json";
  const outputPath = args[1];
  const result = prepareRealDemSseInput(JSON.parse(readFileSync(inputPath, "utf8")));
  if (outputPath) writeFileSync(outputPath, JSON.stringify(result.input, null, 2) + "\n");
  console.log(JSON.stringify({ ...result.provenance, boundedInput: result.input }, null, 2));
  if (!outputPath) console.error("Use the input with: node tools/he-bfv-dem-sse-demo.mjs /path/to/input.json");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
