/**
 * MINIMAL USGS DEM — the smallest honest terrain layer for the three theaters.
 *
 * What this is
 * ------------
 * A *control-point* elevation model. Each theater ships a short list of
 * published spot elevations and sounding depths, a generalised land mask, and
 * an interpolation kernel. `buildGrid()` turns that into a regular lon/lat
 * grid the 4Dwm viewer can mesh, and `sampleDem()` reads it back.
 *
 * What this is NOT
 * ----------------
 * It is not a sample of a USGS raster. None of these three theaters is in
 * 3DEP (which is US-only); the USGS/EROS holdings that *do* cover them are
 * global products you have to fetch and clip:
 *
 *   - SRTM 1 Arc-Second Global (30 m, 2000)  \u2014 EarthExplorer, "Digital
 *     Elevation" \u2192 SRTM. Covers 60\u00b0N\u201356\u00b0S, so all three frames.
 *   - ASTER GDEM v3 (30 m, 2000\u20132013)         \u2014 AppEEARS / EarthExplorer.
 *   - GMTED2010 (250 m / 500 m / 1 km)        \u2014 the coarse global backdrop.
 *   - 3DEP ImageServer `identify`             \u2014 US only; used by this repo's
 *     bluetops app, and deliberately *not* used here, because it would return
 *     nothing over the Persian Gulf or the Solomons and a layer that silently
 *     returns nothing is worse than one that says so.
 *
 * `DEM_META.swapIn` documents the exact drop-in: hand `buildGrid` a
 * `{ nx, ny, bbox, elev: Float32Array }` produced from a real GeoTIFF and
 * every consumer in the viewer keeps working, because they all go through
 * `sampleDem()`.
 *
 * Bathymetry is included because two of the three stories are underwater:
 * negative control values are soundings, and the sign is meaningful.
 */

export const DEM_META = {
  status: "control-point reconstruction",
  vdatum: "approximate MSL / EGM96; the control values are published spot heights, not a levelled survey",
  products: [
    {
      id: "srtm1",
      name: "SRTM 1 Arc-Second Global",
      resolution: "1\u2033 (~30 m)",
      coverage: "60\u00b0N\u201356\u00b0S \u2014 all three theaters",
      access: "https://earthexplorer.usgs.gov/ \u2192 Data Sets \u2192 Digital Elevation \u2192 SRTM",
      formats: ["GeoTIFF", "BIL", "DTED"],
    },
    {
      id: "gdem3",
      name: "ASTER Global DEM v3",
      resolution: "1\u2033 (~30 m)",
      coverage: "83\u00b0N\u201383\u00b0S",
      access: "https://appeears.earthdatacloud.nasa.gov/ (USGS LP DAAC)",
      formats: ["GeoTIFF"],
    },
    {
      id: "gmted2010",
      name: "GMTED2010",
      resolution: "7.5\u2033 / 15\u2033 / 30\u2033 (250 m / 500 m / 1 km)",
      coverage: "global",
      access: "https://earthexplorer.usgs.gov/ \u2192 Digital Elevation \u2192 GMTED2010",
      formats: ["GeoTIFF"],
    },
    {
      id: "3dep",
      name: "USGS 3DEP ImageServer (identify)",
      resolution: "1 m / 1/3\u2033 / 1\u2033",
      coverage: "United States only \u2014 no coverage in any of these frames",
      access: "https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer",
      formats: ["JSON identify", "WCS", "WMS"],
      unusable: true,
    },
  ],
  swapIn:
    "gdal_translate -projwin <W> <N> <E> <S> srtm.tif clip.tif && gdal_translate -of AAIGrid clip.tif clip.asc, " +
    "then post { nx, ny, bbox:[w,s,e,n], elev:[...] } as data/vincennes/dem-<theater>.json and set DEM_GRID_URL.",
  license: "SRTM / GMTED2010 / GDEM are public domain or freely redistributable; see each product page.",
};

/* --------------------------------------------------------------- theaters */

/**
 * Land masks are **generalised outlines** \u2014 a dozen vertices where the real
 * coastline has ten thousand. They exist to put the islands in the right place
 * at the right size, not to be a shoreline.
 */
export const DEM_CONTROL = {
  "hormuz-1988": {
    bbox: [55.55, 26.15, 56.75, 27.45],
    seaFloorM: -70,
    shelfDeg: 0.10,  // broad, shallow, sandy — the Gulf shoals slowly
    note:
      "Strait of Hormuz. Channel depths are 60\u201380 m; the deep-water lanes north of the Musandam peninsula run to ~90 m.",
    land: [
      {
        id: "qeshm-east",
        name: "Qeshm Island (eastern half)",
        ring: [
          [55.62, 26.79], [55.78, 26.83], [55.95, 26.87], [56.09, 26.92],
          [56.22, 26.96], [56.29, 26.95], [56.27, 26.89], [56.14, 26.85],
          [56.00, 26.78], [55.92, 26.70], [55.80, 26.66], [55.68, 26.69],
          [55.62, 26.74],
        ],
      },
      {
        id: "hengam",
        name: "Hengam Island",
        ring: [[55.83, 26.68], [55.91, 26.69], [55.94, 26.65], [55.90, 26.62], [55.83, 26.63]],
      },
      {
        id: "larak",
        name: "Larak Island",
        ring: [[56.33, 26.90], [56.40, 26.91], [56.42, 26.85], [56.37, 26.83], [56.32, 26.86]],
      },
      {
        id: "hormuz",
        name: "Hormuz Island",
        ring: [[56.42, 27.09], [56.50, 27.10], [56.52, 27.04], [56.47, 27.00], [56.41, 27.03]],
      },
      {
        id: "iran-coast",
        name: "Iranian mainland, Bandar Abbas",
        ring: [
          [55.55, 27.45], [56.75, 27.45], [56.75, 27.15], [56.60, 27.12],
          [56.42, 27.18], [56.24, 27.16], [56.05, 27.22], [55.85, 27.20],
          [55.66, 27.25], [55.55, 27.27],
        ],
      },
      {
        id: "musandam",
        name: "Musandam peninsula (Oman)",
        ring: [
          [56.28, 26.15], [56.75, 26.15], [56.75, 26.32], [56.60, 26.38],
          [56.50, 26.39], [56.42, 26.33], [56.32, 26.26],
        ],
      },
    ],
    control: [
      { lon: 56.05, lat: 26.86, elev: 370, name: "Bukhun, Qeshm Island", src: "UNESCO tentative list \u2014 highest point of Qeshm, 370 m" },
      { lon: 55.72, lat: 26.76, elev: 120, name: "Qeshm interior, west of Suza", src: "generalised from the 35 m island mean / 290\u2013370 m maximum" },
      { lon: 56.24, lat: 26.93, elev: 60, name: "Qeshm eastern tip", src: "generalised" },
      { lon: 55.88, lat: 26.655, elev: 106, name: "Hengam Island summit", src: "published island maximum, 106 m" },
      { lon: 56.37, lat: 26.87, elev: 125, name: "Larak Island", src: "generalised island maximum" },
      { lon: 56.46, lat: 27.05, elev: 186, name: "Hormuz Island (salt dome)", src: "generalised island maximum" },
      { lon: 56.37, lat: 27.22, elev: 20, name: "Bandar Abbas shore plain", src: "OIKB aerodrome elevation 22 ft / 7 m; coastal plain" },
      { lon: 56.20, lat: 27.42, elev: 1400, name: "Zagros front, north of Bandar Abbas", src: "Geno massif reaches 2,347 m ~25 km inland; frame edge value" },
      { lon: 56.55, lat: 26.28, elev: 900, name: "Musandam, Ru\u2019us al-Jibal", src: "Jebel Harim 2,087 m lies south of the frame; edge value" },
      { lon: 56.05, lat: 26.55, elev: -58, name: "Strait channel sounding", src: "published strait depths 60\u201380 m", sea: true },
      { lon: 56.30, lat: 26.60, elev: -80, name: "Inbound traffic lane", src: "published strait depths 60\u201380 m", sea: true },
      { lon: 56.02, lat: 27.05, elev: -18, name: "Clarence Strait (Khuran)", src: "shallow channel between Qeshm and the mainland", sea: true },
      { lon: 56.64, lat: 26.80, elev: -90, name: "Gulf of Oman approach", src: "deep-water approach", sea: true },
    ],
  },

  "savo-1942": {
    bbox: [159.55, -9.55, 160.25, -8.85],
    seaFloorM: -900,
    shelfDeg: 0.018, // a volcanic cone in a 1,000 m sound has almost no shelf
    note:
      "Iron Bottom Sound. The 2015 Allen survey reported wreck depths of 600\u20131,350 m; Vincennes lies in ~1,020 m.",
    land: [
      {
        id: "savo",
        name: "Savo Island",
        ring: [
          [159.785, -9.108], [159.812, -9.098], [159.845, -9.108], [159.858, -9.133],
          [159.848, -9.160], [159.818, -9.172], [159.790, -9.163], [159.776, -9.136],
        ],
      },
      {
        id: "guadalcanal",
        name: "Guadalcanal north coast",
        ring: [
          [159.55, -9.55], [160.25, -9.55], [160.25, -9.42], [160.08, -9.40],
          [159.92, -9.37], [159.80, -9.31], [159.73, -9.235], [159.68, -9.245],
          [159.64, -9.30], [159.55, -9.36],
        ],
      },
      {
        id: "florida",
        name: "Florida Island (Nggela Sule), western end",
        ring: [
          [160.02, -9.05], [160.25, -9.02], [160.25, -8.85], [160.06, -8.87],
          [159.99, -8.95],
        ],
      },
    ],
    control: [
      { lon: 159.818, lat: -9.135, elev: 485, name: "Savo Island summit", src: "volcanic cone, published summit ~485 m" },
      { lon: 159.790, lat: -9.118, elev: 180, name: "Savo NW flank", src: "generalised cone profile" },
      { lon: 159.845, lat: -9.155, elev: 150, name: "Savo SE flank", src: "generalised cone profile" },
      { lon: 159.705, lat: -9.258, elev: 40, name: "Cape Esperance", src: "low coastal point" },
      { lon: 159.90, lat: -9.47, elev: 900, name: "Guadalcanal coastal range", src: "range rises steeply inland; Popomanaseu 2,335 m is well south of the frame" },
      { lon: 160.15, lat: -8.95, elev: 380, name: "Florida Island interior", src: "generalised island maximum ~430 m" },
      { lon: 159.90, lat: -9.16, elev: -780, name: "Iron Bottom Sound, west", src: "2015 survey depth band 600\u20131,350 m", sea: true },
      { lon: 159.87, lat: -9.17, elev: -1020, name: "Vincennes (CA-44) wreck", src: "located 16 Jan 2015; ~1,020 m", sea: true },
      { lon: 160.02, lat: -9.20, elev: -1100, name: "Sound centre", src: "2015 survey depth band", sea: true },
      { lon: 159.72, lat: -9.10, elev: -600, name: "North-west approach", src: "Mikawa's approach; shallower shelf", sea: true },
    ],
  },

  "leyte-1944": {
    bbox: [120.0, 9.0, 134.0, 34.0],
    seaFloorM: -4500,
    shelfDeg: 0.45,
    note:
      "Philippine Sea scale. At this frame the DEM is a backdrop: the Philippine Trench is the only feature with any vertical authority, and it is drawn at GMTED/GEBCO generalisation, not from a sounding set.",
    land: [
      {
        id: "luzon",
        name: "Luzon",
        ring: [
          [119.9, 16.4], [120.6, 18.6], [121.6, 18.6], [122.3, 18.3], [122.4, 17.0],
          [122.1, 15.9], [121.9, 14.8], [121.2, 14.2], [120.6, 14.4], [120.3, 15.5],
        ],
      },
      {
        id: "samar-leyte",
        name: "Samar / Leyte",
        ring: [
          [124.3, 12.6], [125.4, 12.6], [125.7, 11.9], [125.5, 11.2], [125.2, 10.3],
          [124.9, 10.0], [124.4, 10.3], [124.3, 11.2], [124.1, 12.0],
        ],
      },
      {
        id: "formosa",
        name: "Formosa (Taiwan)",
        ring: [
          [120.1, 22.6], [120.1, 24.6], [121.0, 25.3], [121.9, 25.1], [121.6, 24.0],
          [121.0, 22.8], [120.7, 22.0],
        ],
      },
      {
        id: "kyushu",
        name: "Ky\u016bsh\u016b",
        ring: [
          [129.6, 31.0], [129.5, 33.6], [131.0, 33.9], [132.0, 33.3], [131.6, 32.0],
          [130.9, 31.0], [130.2, 30.9],
        ],
      },
    ],
    control: [
      { lon: 120.95, lat: 23.47, elev: 3952, name: "Yu Shan, Formosa", src: "island high point" },
      { lon: 121.05, lat: 16.6, elev: 2900, name: "Cordillera Central, Luzon", src: "generalised" },
      { lon: 125.1, lat: 11.1, elev: 800, name: "Samar interior", src: "generalised" },
      { lon: 131.1, lat: 32.6, elev: 1750, name: "Ky\u016bsh\u016b interior", src: "generalised" },
      { lon: 127.0, lat: 12.5, elev: -9000, name: "Philippine Trench", src: "generalised trench axis", sea: true },
      { lon: 130.0, lat: 24.0, elev: -4200, name: "Philippine Sea basin", src: "generalised", sea: true },
      { lon: 126.0, lat: 20.0, elev: -5200, name: "West Philippine Basin", src: "generalised", sea: true },
    ],
  },
};

/* ------------------------------------------------------------- geometry */

export function pointInRing(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi + 1e-12) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/** Distance from (lon,lat) to the nearest edge of `ring`, in degrees. */
export function distToRing(lon, lat, ring, kx = 1) {
  let best = Infinity;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const ax = ring[j][0];
    const ay = ring[j][1];
    const bx = ring[i][0];
    const by = ring[i][1];
    const abx = (bx - ax) * kx;
    const aby = by - ay;
    const apx = (lon - ax) * kx;
    const apy = lat - ay;
    const ab2 = abx * abx + aby * aby || 1e-12;
    const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / ab2));
    const dx = apx - abx * t;
    const dy = apy - aby * t;
    best = Math.min(best, Math.hypot(dx, dy));
  }
  return best;
}

/** Which named land polygon, if any, contains this point. */
export function landAt(theaterId, lon, lat) {
  const t = DEM_CONTROL[theaterId];
  if (!t) return null;
  for (const poly of t.land) if (pointInRing(lon, lat, poly.ring)) return poly;
  return null;
}

/* ---------------------------------------------------------- interpolation */

/**
 * Shepard inverse-distance interpolation with a land mask and a coastal
 * taper. `power` 2.4 and a 0.06\u00b0 coastal ramp were chosen so that a 485 m
 * cone on a 3 km island still reads as a cone at 1 km grid spacing.
 */
function interpolate(theater, lon, lat, kx) {
  const poly = theater.land.find((p) => pointInRing(lon, lat, p.ring)) || null;
  const onLand = Boolean(poly);
  const pool = theater.control.filter((c) => Boolean(c.sea) !== onLand);
  if (!pool.length) return onLand ? 0 : theater.seaFloorM;

  let wsum = 0;
  let vsum = 0;
  for (const c of pool) {
    const dx = (c.lon - lon) * kx;
    const dy = c.lat - lat;
    const d2 = dx * dx + dy * dy;
    if (d2 < 1e-12) return c.elev;
    const w = 1 / Math.pow(d2, 1.2);
    wsum += w;
    vsum += w * c.elev;
  }
  let v = vsum / wsum;

  if (onLand) {
    // Taper to zero at the shoreline so islands do not end in a cliff — but
    // scale the taper to the island. A fixed ramp would flatten Hengam (9 km
    // across) while barely touching Luzon.
    const d = distToRing(lon, lat, poly.ring, kx);
    const ramp = Math.min(1, d / coastRamp(poly, kx));
    v *= ramp * ramp * (3 - 2 * ramp);
  } else {
    // Shelf: shoal toward any nearby coast, at the theater's own shelf width.
    let near = Infinity;
    for (const p of theater.land) near = Math.min(near, distToRing(lon, lat, p.ring, kx));
    const ramp = Math.min(1, near / (theater.shelfDeg ?? 0.12));
    v *= ramp * ramp * (3 - 2 * ramp);
  }
  return v;
}

const rampCache = new WeakMap();
function coastRamp(poly, kx) {
  let r = rampCache.get(poly);
  if (r == null) {
    let w = 0;
    let h = 0;
    let x0 = Infinity;
    let x1 = -Infinity;
    let y0 = Infinity;
    let y1 = -Infinity;
    for (const [x, y] of poly.ring) {
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
    }
    w = (x1 - x0) * kx;
    h = y1 - y0;
    r = Math.max(0.004, Math.min(0.05, 0.3 * Math.min(w, h)));
    rampCache.set(poly, r);
  }
  return r;
}

/**
 * Build a regular grid over the theater bbox.
 * Returns `{ nx, ny, bbox, elev: Float32Array, min, max, meta }` \u2014 the exact
 * shape a real clipped GeoTIFF should be converted to.
 */
export function buildGrid(theaterId, nx = 140, ny = 120) {
  const theater = DEM_CONTROL[theaterId];
  if (!theater) throw new Error(`no DEM control for theater ${theaterId}`);
  const [w, s, e, n] = theater.bbox;
  const kx = Math.cos(((s + n) / 2) * (Math.PI / 180));
  const elev = new Float32Array(nx * ny);
  let min = Infinity;
  let max = -Infinity;
  for (let j = 0; j < ny; j++) {
    const lat = s + ((n - s) * j) / (ny - 1);
    for (let i = 0; i < nx; i++) {
      const lon = w + ((e - w) * i) / (nx - 1);
      const v = interpolate(theater, lon, lat, kx);
      elev[j * nx + i] = v;
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  return {
    nx,
    ny,
    bbox: theater.bbox,
    elev,
    min,
    max,
    meta: {
      theaterId,
      source: "control-point reconstruction",
      note: theater.note,
      controlCount: theater.control.length,
      landPolygons: theater.land.length,
      products: DEM_META.products.filter((p) => !p.unusable).map((p) => p.id),
    },
  };
}

/** Bilinear read-back. Returns metres; negative is below sea level. */
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

/** Elevation profile along a great-circle-ish straight lon/lat segment. */
export function profile(grid, from, to, samples = 96) {
  const out = [];
  for (let i = 0; i < samples; i++) {
    const f = i / (samples - 1);
    const lon = from.lon + (to.lon - from.lon) * f;
    const lat = from.lat + (to.lat - from.lat) * f;
    out.push({ f, lon, lat, elev: sampleDem(grid, lon, lat) });
  }
  return out;
}

/**
 * Self-test: every land control point must fall inside a land polygon and
 * every sounding outside all of them. A control point on the wrong side of
 * its own coastline is silently excluded from the interpolation pool, which
 * produces a DEM that looks fine and is wrong \u2014 so this is asserted in the
 * test suite rather than trusted.
 */
export function validateControl(theaterId) {
  const t = DEM_CONTROL[theaterId];
  if (!t) throw new Error(`no DEM control for theater ${theaterId}`);
  const problems = [];
  const [w, s, e, n] = t.bbox;
  for (const c of t.control) {
    const inside = Boolean(landAt(theaterId, c.lon, c.lat));
    const wantLand = !c.sea;
    if (inside !== wantLand) {
      problems.push({ name: c.name, expected: wantLand ? "land" : "water", actual: inside ? "land" : "water" });
    }
    if (c.lon < w || c.lon > e || c.lat < s || c.lat > n) {
      problems.push({ name: c.name, expected: "inside bbox", actual: "outside bbox" });
    }
    if (wantLand && c.elev < 0) problems.push({ name: c.name, expected: "elev >= 0", actual: String(c.elev) });
    if (!wantLand && c.elev > 0) problems.push({ name: c.name, expected: "elev <= 0", actual: String(c.elev) });
  }
  return { theaterId, ok: problems.length === 0, problems };
}

/** Hypsometric tint, land above and water below, as [r,g,b] 0..1. */
export function hypsometric(m) {
  if (m <= 0) {
    const d = Math.min(1, -m / 1200);
    return [0.02 + 0.03 * (1 - d), 0.12 + 0.22 * (1 - d), 0.24 + 0.30 * (1 - d)];
  }
  const stops = [
    [0, [0.20, 0.42, 0.25]],
    [120, [0.38, 0.52, 0.26]],
    [400, [0.62, 0.58, 0.30]],
    [900, [0.70, 0.48, 0.28]],
    [2000, [0.62, 0.42, 0.36]],
    [4000, [0.86, 0.86, 0.90]],
  ];
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

export default { DEM_META, DEM_CONTROL, buildGrid, sampleDem, profile, hypsometric, landAt, validateControl };
