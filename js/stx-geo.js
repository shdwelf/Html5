/** Saint Croix, U.S. Virgin Islands — quarters + USGS/NOAA-style DEM.
 *  Outline and landmarks follow the Villa Margarita island maps
 *  (quarters, north-shore Salt River, Point Udall, Buck Island).
 *  Elevation is a physically informed reconstruction of USGS 3DEP /
 *  NOAA NCEI traits (Mount Eagle 355 m, north wall, south shelf).
 */

export const SITE = {
  id: "stx",
  code: "SITE-X",
  title: "SITE-X · ST. CROIX QUARTER CONTROL",
  subtitle: "USGS 3DEP · NOAA NCEI · Danish quarters · UNIX System V · fsn",
  unit: "QUARTER",
  gridLabel: "11 QUARTERS · NODES 15",
  source: "villamargarita.com/st-croix-map",
  boot: [
    "SITE-X  st. croix quarter control  ·  IRIX 5.3",
    "mount  usgs3dep:/usvi/stx  +  noaa ncei bathy",
    "vector layer  DANISH QUARTERS  11 features",
    "overlay  villa margarita road / beach / quarter maps",
    "geocoding  sanctuary + visitor nodes   …  15",
    "arming  containment grid  A1–H8   POINT UDALL datum",
    "fsn  /parkfs/990   ready",
  ],
};

export const BBOX = {
  minLon: -64.92,
  maxLon: -64.54,
  minLat: 17.655,
  maxLat: 17.82,
};

export const WORLD = { w: 58, d: 22, elevScale: 0.022 };

export function project(lon, lat) {
  const x = ((lon - BBOX.minLon) / (BBOX.maxLon - BBOX.minLon) - 0.5) * WORLD.w;
  const z = ((BBOX.maxLat - lat) / (BBOX.maxLat - BBOX.minLat) - 0.5) * WORLD.d;
  return [x, z];
}

export function unproject(x, z) {
  const lon = (x / WORLD.w + 0.5) * (BBOX.maxLon - BBOX.minLon) + BBOX.minLon;
  const lat = BBOX.maxLat - (z / WORLD.d + 0.5) * (BBOX.maxLat - BBOX.minLat);
  return [lon, lat];
}

export function sectorCode(lon, lat) {
  const c = Math.min(7, Math.max(0, Math.floor(((lon - BBOX.minLon) / (BBOX.maxLon - BBOX.minLon)) * 8)));
  const r = Math.min(7, Math.max(0, Math.floor(((BBOX.maxLat - lat) / (BBOX.maxLat - BBOX.minLat)) * 8)));
  return `${"ABCDEFGH"[c]}${r + 1}`;
}

/** Main island ring, lon/lat, CCW. Salt River + Christiansted harbor cut in. */
export const STX_OUTLINE = [
  [-64.898, 17.679], [-64.892, 17.686], [-64.886, 17.698], [-64.883, 17.708],
  [-64.8825, 17.714], [-64.884, 17.722], [-64.887, 17.734], [-64.889, 17.746],
  [-64.886, 17.758], [-64.876, 17.766], [-64.860, 17.770], [-64.846, 17.773],
  [-64.828, 17.775], [-64.812, 17.776], [-64.796, 17.777], [-64.782, 17.780],
  [-64.774, 17.783], [-64.768, 17.784], [-64.762, 17.784], [-64.760, 17.778],
  [-64.758, 17.770], [-64.752, 17.768], [-64.748, 17.776], [-64.750, 17.783],
  [-64.742, 17.782], [-64.730, 17.778], [-64.718, 17.770], [-64.710, 17.758],
  [-64.706, 17.750], [-64.698, 17.748], [-64.688, 17.752], [-64.674, 17.758],
  [-64.656, 17.763], [-64.636, 17.765], [-64.616, 17.764], [-64.596, 17.762],
  [-64.578, 17.759], [-64.566, 17.757], [-64.560, 17.755], [-64.561, 17.748],
  [-64.568, 17.742], [-64.578, 17.737],
  [-64.592, 17.733], [-64.612, 17.728], [-64.634, 17.724], [-64.656, 17.720],
  [-64.678, 17.716], [-64.702, 17.712], [-64.726, 17.708], [-64.750, 17.704],
  [-64.774, 17.701], [-64.798, 17.699], [-64.822, 17.697], [-64.846, 17.694],
  [-64.868, 17.689], [-64.886, 17.683], [-64.898, 17.679],
];

export const LA_OUTLINE = STX_OUTLINE;

export const BUCK_ISLAND = [
  [-64.628, 17.785], [-64.620, 17.790], [-64.610, 17.791], [-64.604, 17.788],
  [-64.606, 17.783], [-64.614, 17.780], [-64.624, 17.781], [-64.628, 17.785],
];

export const PROTESTANT_CAY = [
  [-64.704, 17.750], [-64.701, 17.752], [-64.698, 17.751], [-64.700, 17.749],
  [-64.704, 17.750],
];

export const RIVERS = {
  saltRiver: [
    [-64.760, 17.783], [-64.761, 17.776], [-64.762, 17.770], [-64.758, 17.766],
  ],
  gut: [
    [-64.812, 17.755], [-64.810, 17.740], [-64.808, 17.720], [-64.806, 17.704],
  ],
};

export const ROADS = {
  centerline: [
    [-64.882, 17.712], [-64.860, 17.718], [-64.830, 17.724], [-64.800, 17.730],
    [-64.770, 17.736], [-64.740, 17.740], [-64.718, 17.742], [-64.705, 17.746],
  ],
  evans: [
    [-64.870, 17.700], [-64.840, 17.700], [-64.810, 17.701], [-64.780, 17.702],
    [-64.750, 17.706], [-64.720, 17.710], [-64.690, 17.716],
  ],
  northshore: [
    [-64.880, 17.760], [-64.850, 17.770], [-64.820, 17.774], [-64.790, 17.776],
    [-64.770, 17.778], [-64.748, 17.780], [-64.730, 17.776],
  ],
  eastend: [
    [-64.690, 17.752], [-64.660, 17.758], [-64.630, 17.762], [-64.600, 17.760],
    [-64.575, 17.757], [-64.566, 17.755],
  ],
};

export const REEFS = {
  northWall: [
    [-64.870, 17.772], [-64.840, 17.778], [-64.810, 17.780], [-64.780, 17.782],
  ],
  buckReef: [
    [-64.632, 17.792], [-64.618, 17.796], [-64.604, 17.794], [-64.598, 17.788],
    [-64.604, 17.780], [-64.618, 17.778], [-64.630, 17.782], [-64.632, 17.792],
  ],
  eastEndMarine: [
    [-64.590, 17.768], [-64.570, 17.762], [-64.560, 17.752],
  ],
};

export const CAYS = [BUCK_ISLAND, PROTESTANT_CAY];

export const BEACHES = [
  { name: "Sandy Point", lon: -64.895, lat: 17.682 },
  { name: "Rainbow", lon: -64.884, lat: 17.724 },
  { name: "Davis Bay", lon: -64.848, lat: 17.772 },
  { name: "Cane Bay", lon: -64.812, lat: 17.775 },
  { name: "Salt River", lon: -64.758, lat: 17.779 },
  { name: "Chenay Bay", lon: -64.668, lat: 17.761 },
  { name: "Cramer Park", lon: -64.592, lat: 17.760 },
  { name: "Isaac's Bay", lon: -64.572, lat: 17.742 },
  { name: "Great Pond", lon: -64.650, lat: 17.722 },
];

const PEAKS = [
  { lon: -64.815, lat: 17.754, h: 355, s: 0.018, name: "Mount Eagle" },
  { lon: -64.838, lat: 17.752, h: 280, s: 0.016, name: "Blue Mountain" },
  { lon: -64.860, lat: 17.748, h: 210, s: 0.014, name: "Maroon Ridge" },
  { lon: -64.790, lat: 17.758, h: 190, s: 0.016, name: "Northside B" },
  { lon: -64.720, lat: 17.748, h: 140, s: 0.014, name: "Recovery Hill" },
  { lon: -64.640, lat: 17.748, h: 165, s: 0.018, name: "East End ridge" },
  { lon: -64.600, lat: 17.746, h: 120, s: 0.012, name: "Point Udall hills" },
];

function hash2(ix, iy) {
  let n = Math.imul(ix, 374761393) + Math.imul(iy, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function vnoise(x, y) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy);
  const b = hash2(ix + 1, iy);
  const c = hash2(ix, iy + 1);
  const d = hash2(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

export function fbm(x, y, oct = 5) {
  let s = 0;
  let a = 0.5;
  let f = 1;
  for (let i = 0; i < oct; i++) {
    s += a * vnoise(x * f, y * f);
    a *= 0.5;
    f *= 2.05;
  }
  return s;
}

function dist2(lon, lat, lon2, lat2) {
  const k = Math.cos((lat * Math.PI) / 180);
  const dx = (lon - lon2) * k;
  const dy = lat - lat2;
  return dx * dx + dy * dy;
}

export function distToPolyline(lon, lat, line) {
  let best = Infinity;
  const k = Math.cos((lat * Math.PI) / 180);
  for (let i = 0; i < line.length - 1; i++) {
    const ax = line[i][0];
    const ay = line[i][1];
    const bx = line[i + 1][0];
    const by = line[i + 1][1];
    const abx = (bx - ax) * k;
    const aby = by - ay;
    const apx = (lon - ax) * k;
    const apy = lat - ay;
    const ab2 = abx * abx + aby * aby || 1e-9;
    const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / ab2));
    const dx = apx - abx * t;
    const dy = apy - aby * t;
    const d = dx * dx + dy * dy;
    if (d < best) best = d;
  }
  return Math.sqrt(best);
}

export function pointInRing(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi + 1e-12) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

export function insideLA(lon, lat) {
  return pointInRing(lon, lat, STX_OUTLINE) || pointInRing(lon, lat, BUCK_ISLAND) || pointInRing(lon, lat, PROTESTANT_CAY);
}

export function elevMeters(lat, lon) {
  const onBuck = pointInRing(lon, lat, BUCK_ISLAND);
  const onCay = pointInRing(lon, lat, PROTESTANT_CAY);
  const onMain = pointInRing(lon, lat, STX_OUTLINE);

  if (onBuck) {
    const z = 8 + 22 * Math.exp(-dist2(lon, lat, -64.616, 17.786) / 0.00004) + (fbm(lon * 40, lat * 40, 3) - 0.5) * 4;
    return { z: Math.max(0.4, z), water: false, land: true };
  }
  if (onCay) return { z: 2.2, water: false, land: true };

  if (!onMain) {
    const dCoast = distToPolyline(lon, lat, STX_OUTLINE);
    const north = lat > 17.74;
    let depth = north ? -6 - dCoast * 900 : -3 - dCoast * 220;
    const dBuck = distToPolyline(lon, lat, BUCK_ISLAND);
    if (dBuck < 0.012) depth = Math.max(depth, -4 + (0.012 - dBuck) * 200);
    depth += (fbm(lon * 18, lat * 18, 3) - 0.5) * 6;
    return { z: Math.max(-180, depth), water: true, land: false };
  }

  let z = 12;
  const ridgeY = 17.752 + Math.sin((lon + 64.75) * 18) * 0.004;
  const dRidge = Math.abs(lat - ridgeY);
  z += 55 * Math.exp(-(dRidge * dRidge) / 0.00028);

  for (const p of PEAKS) {
    z += p.h * Math.exp(-dist2(lon, lat, p.lon, p.lat) / (p.s * p.s));
  }

  const dSalt = distToPolyline(lon, lat, RIVERS.saltRiver);
  z *= 1 - 0.55 * Math.exp(-(dSalt * dSalt) / 0.00008);

  const dCoast = distToPolyline(lon, lat, STX_OUTLINE);
  if (dCoast < 0.006) {
    const t = dCoast / 0.006;
    const shore = 1.6 + t * 18;
    z = z * t * t + shore * (1 - t * t);
  }

  if (lon < -64.87 && lat < 17.72) z *= 0.25;
  if (lat < 17.71) z *= 0.45 + (lat - 17.68) * 4;
  if (lon > -64.62) z = Math.min(z, 140);

  z += (fbm(lon * 28, lat * 28) - 0.48) * 18;
  z += (fbm(lon * 70, lat * 70, 3) - 0.5) * 6;
  z = Math.max(0.2, Math.min(360, z));
  return { z, water: false, land: true };
}

export const PARISHES = [
  { fips: "WE", name: "West End", seat: "Carlton", lon: -64.872, lat: 17.698, pop: 2800, km2: 28, extra: [[-64.890, 17.684], [-64.875, 17.705]] },
  { fips: "FR", name: "Frederiksted", seat: "Frederiksted", lon: -64.882, lat: 17.713, pop: 3100, km2: 4, extra: [[-64.881, 17.718]] },
  { fips: "NSA", name: "Northside A", seat: "Annaly", lon: -64.858, lat: 17.755, pop: 2200, km2: 22, extra: [[-64.870, 17.760], [-64.845, 17.768]] },
  { fips: "PR", name: "Prince's", seat: "Whim", lon: -64.838, lat: 17.718, pop: 3600, km2: 26, extra: [[-64.850, 17.710], [-64.825, 17.725]] },
  { fips: "NSB", name: "Northside B", seat: "Cane Bay", lon: -64.800, lat: 17.762, pop: 3400, km2: 20, extra: [[-64.812, 17.772], [-64.762, 17.780]] },
  { fips: "KI", name: "King's", seat: "Bethlehem", lon: -64.800, lat: 17.718, pop: 5200, km2: 30, extra: [[-64.810, 17.702], [-64.785, 17.725]] },
  { fips: "QU", name: "Queen's", seat: "Kingshill", lon: -64.768, lat: 17.738, pop: 6100, km2: 24, extra: [[-64.778, 17.732], [-64.755, 17.742]] },
  { fips: "CO", name: "Company's", seat: "Orange Grove", lon: -64.722, lat: 17.740, pop: 5400, km2: 22, extra: [[-64.735, 17.728], [-64.710, 17.748]] },
  { fips: "CH", name: "Christiansted", seat: "Christiansted", lon: -64.705, lat: 17.746, pop: 4400, km2: 5, extra: [[-64.703, 17.748]] },
  { fips: "EEA", name: "East End A", seat: "Southgate", lon: -64.655, lat: 17.742, pop: 2800, km2: 24, extra: [[-64.670, 17.755], [-64.640, 17.730]] },
  { fips: "EEB", name: "East End B", seat: "Point Udall", lon: -64.595, lat: 17.748, pop: 2004, km2: 20, extra: [[-64.615, 17.760], [-64.570, 17.752], [-64.568, 17.742]] },
];

PARISHES.forEach((p, i) => {
  p.index = i;
  p.weight = Math.pow(p.km2, 0.5);
  p.sector = sectorCode(p.lon, p.lat);
  p.attractors = [[p.lon, p.lat], ...p.extra];
});

export function assignParish(lon, lat) {
  if (pointInRing(lon, lat, BUCK_ISLAND)) return 10;
  if (pointInRing(lon, lat, PROTESTANT_CAY)) return 8;
  if (!pointInRing(lon, lat, STX_OUTLINE)) return -1;
  let best = -1;
  let bestS = Infinity;
  for (const p of PARISHES) {
    for (const a of p.attractors) {
      const s = dist2(lon, lat, a[0], a[1]) / p.weight;
      if (s < bestS) {
        bestS = s;
        best = p.index;
      }
    }
  }
  return best;
}

export function parishByName(q) {
  const s = String(q || "").toLowerCase().replace(/['’]/g, "");
  return (
    PARISHES.find(
      (p) =>
        p.name.toLowerCase().replace(/['’]/g, "") === s ||
        p.seat.toLowerCase() === s ||
        p.fips.toLowerCase() === s ||
        p.name.toLowerCase().replace(/['’]/g, "").includes(s)
    ) || null
  );
}

export function buildDem(nx = 220, ny = 120) {
  const elev = new Float32Array(nx * ny);
  const water = new Uint8Array(nx * ny);
  const parish = new Int16Array(nx * ny);
  let zMin = Infinity;
  let zMax = -Infinity;
  for (let j = 0; j < ny; j++) {
    const lat = BBOX.maxLat - (j / (ny - 1)) * (BBOX.maxLat - BBOX.minLat);
    for (let i = 0; i < nx; i++) {
      const lon = BBOX.minLon + (i / (nx - 1)) * (BBOX.maxLon - BBOX.minLon);
      const e = elevMeters(lat, lon);
      const k = j * nx + i;
      elev[k] = e.z;
      water[k] = e.water ? 1 : 0;
      parish[k] = e.land ? assignParish(lon, lat) : -1;
      if (e.z < zMin) zMin = e.z;
      if (e.z > zMax) zMax = e.z;
    }
  }
  return { nx, ny, elev, water, parish, zMin, zMax };
}

export function extractBorders(dem) {
  const { nx, ny, parish } = dem;
  const segs = [];
  const push = (i0, j0, i1, j1) => {
    const lon0 = BBOX.minLon + (i0 / (nx - 1)) * (BBOX.maxLon - BBOX.minLon);
    const lat0 = BBOX.maxLat - (j0 / (ny - 1)) * (BBOX.maxLat - BBOX.minLat);
    const lon1 = BBOX.minLon + (i1 / (nx - 1)) * (BBOX.maxLon - BBOX.minLon);
    const lat1 = BBOX.maxLat - (j1 / (ny - 1)) * (BBOX.maxLat - BBOX.minLat);
    const [x0, z0] = project(lon0, lat0);
    const [x1, z1] = project(lon1, lat1);
    const e0 = Math.max(0, sampleDem(dem, lon0, lat0));
    const e1 = Math.max(0, sampleDem(dem, lon1, lat1));
    segs.push(x0, e0 * WORLD.elevScale + 0.05, z0, x1, e1 * WORLD.elevScale + 0.05, z1);
  };
  for (let j = 0; j < ny - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const a = parish[j * nx + i];
      const b = parish[j * nx + i + 1];
      const c = parish[(j + 1) * nx + i];
      if (a !== b && (a >= 0 || b >= 0)) push(i + 0.5, j, i + 0.5, j + 1);
      if (a !== c && (a >= 0 || c >= 0)) push(i, j + 0.5, i + 1, j + 0.5);
    }
  }
  return segs;
}

export function sampleDem(dem, lon, lat) {
  const u = (lon - BBOX.minLon) / (BBOX.maxLon - BBOX.minLon);
  const v = (BBOX.maxLat - lat) / (BBOX.maxLat - BBOX.minLat);
  const x = u * (dem.nx - 1);
  const y = v * (dem.ny - 1);
  const i0 = Math.max(0, Math.min(dem.nx - 2, Math.floor(x)));
  const j0 = Math.max(0, Math.min(dem.ny - 2, Math.floor(y)));
  const tx = x - i0;
  const ty = y - j0;
  const e00 = dem.elev[j0 * dem.nx + i0];
  const e10 = dem.elev[j0 * dem.nx + i0 + 1];
  const e01 = dem.elev[(j0 + 1) * dem.nx + i0];
  const e11 = dem.elev[(j0 + 1) * dem.nx + i0 + 1];
  return e00 * (1 - tx) * (1 - ty) + e10 * tx * (1 - ty) + e01 * (1 - tx) * ty + e11 * tx * ty;
}

export function sampleParish(dem, lon, lat) {
  const u = (lon - BBOX.minLon) / (BBOX.maxLon - BBOX.minLon);
  const v = (BBOX.maxLat - lat) / (BBOX.maxLat - BBOX.minLat);
  const i = Math.max(0, Math.min(dem.nx - 1, Math.round(u * (dem.nx - 1))));
  const j = Math.max(0, Math.min(dem.ny - 1, Math.round(v * (dem.ny - 1))));
  return dem.parish[j * dem.nx + i];
}

export function buildContours(dem, levels) {
  const { nx, ny, elev } = dem;
  const out = [];
  const world = (i, j, e) => {
    const lon = BBOX.minLon + (i / (nx - 1)) * (BBOX.maxLon - BBOX.minLon);
    const lat = BBOX.maxLat - (j / (ny - 1)) * (BBOX.maxLat - BBOX.minLat);
    const [x, z] = project(lon, lat);
    return [x, e * WORLD.elevScale + 0.03, z];
  };
  for (const level of levels) {
    const segs = [];
    for (let j = 0; j < ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        const e0 = elev[j * nx + i];
        const e1 = elev[j * nx + i + 1];
        const e2 = elev[(j + 1) * nx + i + 1];
        const e3 = elev[(j + 1) * nx + i];
        let bits = 0;
        if (e0 >= level) bits |= 1;
        if (e1 >= level) bits |= 2;
        if (e2 >= level) bits |= 4;
        if (e3 >= level) bits |= 8;
        if (bits === 0 || bits === 15) continue;
        const p = (ia, ja, ea, ib, jb, eb) => {
          const t = (level - ea) / (eb - ea + 1e-9);
          return world(ia + (ib - ia) * t, ja + (jb - ja) * t, level);
        };
        const e = [
          p(i, j, e0, i + 1, j, e1),
          p(i + 1, j, e1, i + 1, j + 1, e2),
          p(i + 1, j + 1, e2, i, j + 1, e3),
          p(i, j + 1, e3, i, j, e0),
        ];
        const pairs = {
          1: [0, 3], 2: [0, 1], 3: [3, 1], 4: [1, 2], 5: [0, 1, 3, 2],
          6: [0, 2], 7: [3, 2], 8: [3, 2], 9: [0, 2], 10: [0, 3, 1, 2],
          11: [1, 2], 12: [3, 1], 13: [0, 1], 14: [0, 3],
        }[bits];
        if (!pairs) continue;
        for (let k = 0; k < pairs.length; k += 2) segs.push(...e[pairs[k]], ...e[pairs[k + 1]]);
      }
    }
    out.push({ level, segs });
  }
  return out;
}

export function drapeLine(dem, lonlat) {
  const arr = [];
  for (let i = 0; i < lonlat.length; i++) {
    const [lon, lat] = lonlat[i];
    const [x, z] = project(lon, lat);
    const e = sampleDem(dem, lon, lat);
    arr.push(x, e * WORLD.elevScale + 0.07, z);
  }
  return arr;
}

export function hypsometric(z) {
  if (z < -40) return [0.01, 0.04, 0.10];
  if (z < -12) return [0.02, 0.10, 0.22];
  if (z < -2) return [0.03, 0.22, 0.32];
  if (z < 0.4) return [0.05, 0.38, 0.40];
  if (z < 6) return [0.42, 0.40, 0.22];
  if (z < 30) return [0.10, 0.36, 0.14];
  if (z < 90) return [0.12, 0.42, 0.12];
  if (z < 180) return [0.28, 0.42, 0.10];
  if (z < 280) return [0.48, 0.42, 0.12];
  return [0.78, 0.70, 0.40];
}

export const CONTOUR_LEVELS = [-40, -10, 0, 25, 50, 100, 160, 230, 310];
