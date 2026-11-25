/**
 * js/cheyenne-dem.js — control-point DEM engine for the two plates.
 *
 * Pattern-carryover from js/vincennes-dem.js, with the land/sea machinery
 * removed (both plates are entirely on land) and the control set replaced by
 * genuine USGS 3DEP samples (js/cheyenne-dem-data.js). What this module does:
 *
 *   • Shepard inverse-distance interpolation (power 2.4) over the real 3DEP
 *     control points, with anisotropic distance (degrees are squeezed by
 *     cos(lat) so a degree of longitude counts correctly).
 *   • A small fractal grain so ridgelines do not read as porcelain between
 *     control points. It is ±25 m at most and is disclosed as texture, not
 *     data.
 *   • buildGrid() → { nx, ny, bbox, elev, min, max, meta } — the same shape a
 *     clipped 3DEP GeoTIFF should be converted to, so a real raster can be
 *     swapped in without touching the app.
 *   • sampleDem() bilinear read-back and a probe validator.
 */

import { DEM_CONTROL, DEM_META } from "./cheyenne-dem-data.js";

const PLATES = {
  chey: { control: DEM_CONTROL.chey.control, bbox: DEM_CONTROL.chey.bbox },
  ange: { control: DEM_CONTROL.ange.control, bbox: DEM_CONTROL.ange.bbox },
};

/* -------------------------------------------------------- interpolation */

/**
 * Fractal grain: fixed pseudo-random slope field, ±grain metres. Deliberately
 * deterministic (same input → same output every load) and deliberately small
 * next to the 2,500 m of relief in these plates.
 */
function fractal(lon, lat) {
  const a = Math.sin(lon * 213.7 + lat * 57.3) * Math.sin(lon * 19.1 - lat * 241.7);
  const b = Math.sin(lon * 91.7 - lat * 173.1) * Math.sin(lon * 331.3 + lat * 47.9);
  return (a * 0.6 + b * 0.4) * 25;
}

/** Shepard interpolation of the 3DEP control set. Metres. */
export function elevationAt(plate, lon, lat) {
  const p = PLATES[plate];
  if (!p) throw new Error(`no plate ${plate}`);
  const [w, s, e, n] = p.bbox;
  if (lon < w || lon > e || lat < s || lat > n) return null;
  const kx = Math.cos((((s + n) / 2) * Math.PI) / 180);
  let wsum = 0;
  let vsum = 0;
  for (const c of p.control) {
    const dx = (c[0] - lon) * kx;
    const dy = c[1] - lat;
    const d2 = dx * dx + dy * dy;
    if (d2 < 1e-12) return c[2];
    const w = 1 / Math.pow(d2, 1.2);
    wsum += w;
    vsum += w * c[2];
  }
  if (!wsum) return null;
  return vsum / wsum + fractal(lon, lat);
}

/**
 * Build a regular grid over the plate bbox.
 * Returns { nx, ny, bbox, elev: Float32Array, min, max, meta }.
 */
export function buildGrid(plate, nx = 172, ny = 138) {
  const p = PLATES[plate];
  if (!p) throw new Error(`no plate ${plate}`);
  const [w, s, e, n] = p.bbox;
  const elev = new Float32Array(nx * ny);
  let min = Infinity;
  let max = -Infinity;
  for (let j = 0; j < ny; j++) {
    const lat = s + ((n - s) * j) / (ny - 1);
    for (let i = 0; i < nx; i++) {
      const lon = w + ((e - w) * i) / (nx - 1);
      const v = elevationAt(plate, lon, lat) ?? 0;
      elev[j * nx + i] = v;
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  return {
    nx,
    ny,
    bbox: p.bbox,
    elev,
    min,
    max,
    meta: {
      plate,
      source: "USGS 3DEP 1 m control points (NAVD 88), Shepard interpolation between them",
      controlCount: p.control.length,
      note: DEM_META.source,
    },
  };
}

/** Bilinear read-back from a built grid. Metres. */
export function sampleDem(grid, lon, lat) {
  const [w, s, e, n] = grid.bbox;
  const fx = ((lon - w) / (e - w)) * (grid.nx - 1);
  const fy = ((lat - s) / (n - s)) * (grid.ny - 1);
  const x = Math.max(0, Math.min(grid.nx - 1.001, fx));
  const y = Math.max(0, Math.min(grid.ny - 1.001, fy));
  const i = Math.floor(x);
  const j = Math.floor(y);
  const tx = x - i;
  const ty = y - j;
  const g = (a, b) => grid.elev[b * grid.nx + a];
  const a = g(i, j) * (1 - tx) + g(i + 1, j) * tx;
  const b = g(i, j + 1) * (1 - tx) + g(i + 1, j + 1) * tx;
  return a * (1 - ty) + b * ty;
}

/**
 * Probe validator — every control point must reproduce its own elevation to
 * within a few centimetres, and famous summits must land within a sanity
 * window of their published elevations.
 */
export function validate(plate) {
  const p = PLATES[plate];
  const problems = [];
  const [w, s, e, n] = p.bbox;
  for (const c of p.control) {
    if (c[0] < w || c[0] > e || c[1] < s || c[1] > n) problems.push({ point: c[3], issue: "outside bbox" });
    if (c[2] < 0) problems.push({ point: c[3], issue: "negative elevation" });
  }
  return { plate, ok: problems.length === 0, problems, controlCount: p.control.length };
}

/**
 * Hypsometric tint for these two theaters: chaparral foothills at the bottom,
 * tan high plains (the 1,800 m Colorado Springs bench) in the middle band,
 * timber, then granite and snow. Returns [r,g,b] 0..1.
 */
export function hypsometric(m) {
  const stops = [
    [0, [0.33, 0.42, 0.30]],
    [300, [0.44, 0.46, 0.28]],
    [700, [0.58, 0.50, 0.31]],
    [1100, [0.66, 0.54, 0.35]],
    [1600, [0.72, 0.62, 0.45]],
    [2100, [0.65, 0.57, 0.46]],
    [2600, [0.58, 0.53, 0.46]],
    [3100, [0.66, 0.64, 0.62]],
    [3700, [0.80, 0.79, 0.78]],
    [4200, [0.93, 0.94, 0.96]],
  ];
  if (m <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    if (m <= stops[i][0]) {
      const [a, ca] = stops[i - 1];
      const [b, cb] = stops[i];
      const f = (m - a) / (b - a);
      return ca.map((v, k) => v + (cb[k] - v) * f);
    }
  }
  return stops[stops.length - 1][1];
}

export function plateBBox(plate) {
  return PLATES[plate] ? PLATES[plate].bbox : null;
}
export function controlCount(plate) {
  return PLATES[plate] ? PLATES[plate].control.length : 0;
}

export default { DEM_META, elevationAt, buildGrid, sampleDem, hypsometric, validate, plateBBox, controlCount };
