/**
 * Lawrence local projection and the single elevation sampler used by every
 * terrain pin, line, and terrain mesh. The committed 8x8 sample grid is from
 * USGS 3DEP; optional generated raster (scripts/fetch-lawrence-dem.py) wins
 * when present in the xdc.
 */
import { DEM_GRID, DEM_META } from "./lawrence-dem-data.js";

export const BBOX = Object.freeze({ lon0: -95.31, lat0: 38.88, lon1: -95.15, lat1: 39.04 });
export const CENTER = Object.freeze({ lon: (BBOX.lon0 + BBOX.lon1) / 2, lat: (BBOX.lat0 + BBOX.lat1) / 2 });
export const KM_PER_DEG_LAT = 111.32;
export const COS_LAT = Math.cos((CENTER.lat * Math.PI) / 180);
export const KM_PER_DEG_LON = KM_PER_DEG_LAT * COS_LAT;
export const BASE_ELEVATION_M = 245;

let activeGrid = DEM_GRID;
let activeMeta = DEM_META;

const validGrid = (grid) =>
  grid && Number.isInteger(grid.nx) && Number.isInteger(grid.ny) &&
  grid.nx >= 2 && grid.ny >= 2 && grid.data?.length === grid.nx * grid.ny &&
  Number.isFinite(grid.lon0) && Number.isFinite(grid.lon1) &&
  Number.isFinite(grid.lat0) && Number.isFinite(grid.lat1) &&
  grid.lon0 < grid.lon1 && grid.lat0 < grid.lat1;

/**
 * Load the optional locally-generated resampled GeoTIFF module. The bundled
 * coarse grid remains the offline fallback; the viewer makes no remote-service
 * request (only a same-origin asset import when the optional file is present).
 */
export async function loadHighResolutionDem() {
  try {
    const optionalModulePath = "./" + "lawrence-dem-grid.js";
    const { DEM } = await import(/* @vite-ignore */ optionalModulePath);
    if (!validGrid(DEM)) throw new Error("optional Lawrence DEM module has invalid dimensions");
    activeGrid = DEM;
    activeMeta = {
      source: DEM.source ?? "USGS 3DEP ImageServer GeoTIFF",
      retrieved: DEM.retrieved ?? "not stated",
      resolution: DEM.resolution ?? "resampled grid",
      verticalDatum: DEM.verticalDatum ?? "NAVD88 (verify source metadata)",
      nx: DEM.nx,
      ny: DEM.ny,
      spacing: "resampled 3DEP ImageServer export",
      disclosure: "Locally generated raster resample; see data-generation recipe.",
      sourcePixelResolutionMeters: null,
    };
    return true;
  } catch {
    activeGrid = DEM_GRID;
    activeMeta = DEM_META;
    return false;
  }
}

export function demInfo() {
  return { ...activeMeta, nx: activeGrid.nx, ny: activeGrid.ny };
}

/**
 * Bilinear sampling. The committed samples are north-to-south row-major;
 * optional generated rasters use the same orientation.
 */
export function elevationAt(lon, lat) {
  if (lon < BBOX.lon0 || lon > BBOX.lon1 || lat < BBOX.lat0 || lat > BBOX.lat1) return null;
  const { lon0, lat0, lon1, lat1, nx, ny, data } = activeGrid;
  // The 8x8 sparse controls stop just inside the display frame. Clamp only the
  // narrow rim; the full-raster swap-in covers the frame directly.
  const fx = Math.max(0, Math.min(nx - 1, ((lon - lon0) / (lon1 - lon0)) * (nx - 1)));
  const fy = Math.max(0, Math.min(ny - 1, ((lat1 - lat) / (lat1 - lat0)) * (ny - 1)));
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const x1 = Math.min(nx - 1, x0 + 1);
  const y1 = Math.min(ny - 1, y0 + 1);
  const tx = fx - x0;
  const ty = fy - y0;
  const a = data[y0 * nx + x0] * (1 - tx) + data[y0 * nx + x1] * tx;
  const b = data[y1 * nx + x0] * (1 - tx) + data[y1 * nx + x1] * tx;
  return a * (1 - ty) + b * ty;
}

/** WGS84-ish local equirectangular projection; one scene unit is one kilometre. */
export function project(lon, lat, y = 0) {
  return [(lon - CENTER.lon) * KM_PER_DEG_LON, y, (CENTER.lat - lat) * KM_PER_DEG_LAT];
}

export function lonLatFromXZ(x, z) {
  return [CENTER.lon + x / KM_PER_DEG_LON, CENTER.lat - z / KM_PER_DEG_LAT];
}

export function surfaceY(elevM, verticalExaggeration = 18) {
  return ((elevM - BASE_ELEVATION_M) / 1000) * verticalExaggeration;
}

export function insideFrame(lon, lat) {
  return lon >= BBOX.lon0 && lon <= BBOX.lon1 && lat >= BBOX.lat0 && lat <= BBOX.lat1;
}

export function frameSizeKm() {
  return {
    width: (BBOX.lon1 - BBOX.lon0) * KM_PER_DEG_LON,
    height: (BBOX.lat1 - BBOX.lat0) * KM_PER_DEG_LAT,
  };
}
