/** PLANET VIEWER · 4DWM — data adapter.
 *
 *  Unifies the committed USGS 3DEP surfaces so the viewer, the cross-checks
 *  and the VRML writer all draw the same grid:
 *
 *    chey     Cheyenne / Pikes Peak front range   (js/cheyenne-dem.js)
 *    ange     San Gabriel / Angeles               (js/cheyenne-dem.js)
 *    lawrence Lawrence, Kansas minimal 3DEP grid  (js/city-dem-grid-lawrence.js)
 *
 *  Each plate normalises to `{ id, name, grid, world, meta }` where
 *  `grid` is the `{ nx, ny, bbox, elev, min, max, meta }` shape that
 *  js/vrml-export.js `demToVrml` consumes, and `world` is `{ w, d, elevScale }`
 *  in kilometres (horizontal) with vertical in km too, so one scene unit is
 *  one kilometre and the vertical exaggeration is explicit, not hidden.
 *
 *  No live fetches: this sandbox cannot reach USGS endpoints, and the repo's
 *  own convention is to commit the control points and interpolate locally
 *  (disclosed as texture, not data, in js/cheyenne-dem.js). The source and
 *  datum for every plate travel in its meta block.
 */

import { buildGrid as cheyenneBuildGrid } from "./cheyenne-dem.js";
import { DEM as lawrenceDem, DEM_META as lawrenceMeta } from "./city-dem-grid-lawrence.js";

const KM_LAT = 110.574;
const KM_LON = (midLat) => 111.32 * Math.cos((midLat * Math.PI) / 180);

/** Horizontal size (km) of a lon/lat bbox [w, s, e, n]. */
export function bboxKm(bbox) {
  const [w, s, e, n] = bbox;
  const midLat = (s + n) / 2;
  return { wKm: (e - w) * KM_LON(midLat), dKm: (n - s) * KM_LAT, midLat };
}

/**
 * Vertical scale, km of scene height per metre of elevation, for a target
 * exaggeration. `exag` 1 means true scale; the viewer's slider raises it.
 */
export function elevScaleKm(reliefM, wKm, exag) {
  // True-scale would be 1/1000 km per m. Multiply by exaggeration.
  void reliefM;
  void wKm;
  return exag / 1000;
}

function sampleLawrenceSource(lon, lat) {
  const fx = ((lon - lawrenceDem.lon0) / (lawrenceDem.lon1 - lawrenceDem.lon0)) * (lawrenceDem.nx - 1);
  // The committed source rows are north-to-south; Planet grids are
  // south-to-north (j=0 is the southern edge).
  const fy = ((lawrenceDem.lat1 - lat) / (lawrenceDem.lat1 - lawrenceDem.lat0)) * (lawrenceDem.ny - 1);
  const x = Math.max(0, Math.min(lawrenceDem.nx - 1, fx));
  const y = Math.max(0, Math.min(lawrenceDem.ny - 1, fy));
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(x0 + 1, lawrenceDem.nx - 1);
  const y1 = Math.min(y0 + 1, lawrenceDem.ny - 1);
  const tx = x - x0;
  const ty = y - y0;
  const at = (i, j) => lawrenceDem.data[j * lawrenceDem.nx + i];
  const top = at(x0, y0) * (1 - tx) + at(x1, y0) * tx;
  const bottom = at(x0, y1) * (1 - tx) + at(x1, y1) * tx;
  return top * (1 - ty) + bottom * ty;
}

function normaliseLawrence(nx, ny) {
  const bbox = [lawrenceDem.lon0, lawrenceDem.lat0, lawrenceDem.lon1, lawrenceDem.lat1];
  const elev = new Float32Array(nx * ny);
  let min = Infinity;
  let max = -Infinity;
  for (let j = 0; j < ny; j++) {
    const lat = lawrenceDem.lat0 + ((lawrenceDem.lat1 - lawrenceDem.lat0) * j) / (ny - 1);
    for (let i = 0; i < nx; i++) {
      const lon = lawrenceDem.lon0 + ((lawrenceDem.lon1 - lawrenceDem.lon0) * i) / (nx - 1);
      const value = sampleLawrenceSource(lon, lat);
      elev[j * nx + i] = value;
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
  }
  return {
    nx,
    ny,
    bbox,
    elev,
    min,
    max,
    meta: {
      source: lawrenceMeta.source,
      verticalDatum: lawrenceMeta.verticalDatum,
      note: `Sparse 3DEP source grid (${lawrenceDem.nx}×${lawrenceDem.ny}, north-to-south) bilinearly resampled to ${nx}×${ny} south-to-north display grid; no additional elevation data inferred.`,
      controlCount: lawrenceDem.nx * lawrenceDem.ny,
    },
  };
}

/**
 * Build every plate at the requested grid resolution (chey/ange are
 * interpolated from their control sets; Lawrence is bilinearly resampled from
 * its committed sparse source grid for display). Returns a map id -> plate.
 */
export function buildPlates(nx = 140, ny = 100) {
  if (!Number.isInteger(nx) || !Number.isInteger(ny) || nx < 2 || ny < 2) {
    throw new RangeError("Planet Viewer grid dimensions must be integers >= 2");
  }
  const chey = cheyenneBuildGrid("chey", nx, ny);
  const ange = cheyenneBuildGrid("ange", nx, ny);
  const law = normaliseLawrence(nx, ny);

  const wrap = (id, name, grid, extraMeta) => {
    const { wKm, dKm, midLat } = bboxKm(grid.bbox);
    return {
      id,
      name,
      grid,
      world: { w: wKm, d: dKm, elevScale: elevScaleKm(grid.max - grid.min, wKm, 1), midLat },
      meta: { ...grid.meta, ...extraMeta },
    };
  };

  return {
    chey: wrap("chey", "CHEYENNE · PIKES FRONT RANGE", chey, { plateSource: chey.meta.note }),
    ange: wrap("ange", "SAN GABRIEL · ANGELES", ange, { plateSource: ange.meta.note }),
    lawrence: wrap("lawrence", "LAWRENCE · KANSAS PLAINS", law, { plateSource: lawrenceMeta.source }),
  };
}

export const PLATE_ORDER = ["chey", "ange", "lawrence"];
