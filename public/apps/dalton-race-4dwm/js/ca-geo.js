/** California theaters: Wrightwood, Big Dalton Canyon (Glendora), Isla Vista.
 *  USGS 3DEP-style reconstruction — peaks, canyons, marine terrace, fault.
 */

import { resolveSite } from "./site-id.js";

const PAD = resolveSite();

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

function peakSum(lat, lon, peaks) {
  let z = 0;
  for (const p of peaks) z += p.h * Math.exp(-dist2(lon, lat, p.lon, p.lat) / (p.s * p.s));
  return z;
}

const WW = {
  site: {
    id: "ww",
    code: "SITE-W",
    title: "SITE-W · WRIGHTWOOD / SWARTHOUT",
    subtitle: "USGS 3DEP · San Andreas · Angeles Crest · UNIX System V",
    unit: "TRACT",
    gridLabel: "10 TRACTS · HIGH DESERT",
    source: "USGS 3DEP / San Bernardino NF",
    boot: [
      "SITE-W  wrightwood theater  ·  IRIX 5.3",
      "mount  usgs3dep:/ca/san-gabriels/wrightwood",
      "vector  SWARTHOUT VALLEY + BIG PINES  10 tracts",
      "fault  SAN ANDREAS  lone pine canyon trace",
      "nodes  mountain churches + ski + fire",
      "arming  containment grid  A1–H8",
    ],
  },
  bbox: { minLon: -117.72, maxLon: -117.52, minLat: 34.28, maxLat: 34.43 },
  world: { w: 50, d: 38, elevScale: 0.0036 },
  outline: [
    [-117.70, 34.30], [-117.62, 34.285], [-117.55, 34.30], [-117.53, 34.34],
    [-117.54, 34.40], [-117.58, 34.42], [-117.66, 34.425], [-117.71, 34.40],
    [-117.715, 34.35], [-117.70, 34.30],
  ],
  rivers: {
    sheepCreek: [[-117.66, 34.41], [-117.655, 34.38], [-117.65, 34.35], [-117.645, 34.31]],
    swarthout: [[-117.64, 34.40], [-117.635, 34.37], [-117.63, 34.345]],
  },
  roads: {
    hwy2: [[-117.70, 34.355], [-117.66, 34.358], [-117.63, 34.362], [-117.60, 34.365], [-117.56, 34.37]],
    hwy138: [[-117.64, 34.31], [-117.635, 34.33], [-117.632, 34.35], [-117.63, 34.36]],
    parkDr: [[-117.634, 34.358], [-117.632, 34.361], [-117.628, 34.364]],
  },
  reefs: {},
  beaches: [
    { name: "Jackson Lake", lon: -117.638, lat: 34.312 },
    { name: "Inspiration Pt", lon: -117.688, lat: 34.372 },
  ],
  contours: [1400, 1600, 1800, 2000, 2200, 2400, 2600],
  parishes: [
    { fips: "WW", name: "Wrightwood", seat: "Park Drive", lon: -117.633, lat: 34.361, pop: 4720, km2: 16, extra: [[-117.628, 34.358]] },
    { fips: "BP", name: "Big Pines", seat: "Table Mountain", lon: -117.688, lat: 34.378, pop: 180, km2: 18, extra: [[-117.695, 34.372]] },
    { fips: "BR", name: "Blue Ridge", seat: "Blue Ridge Camp", lon: -117.68, lat: 34.35, pop: 40, km2: 20, extra: [] },
    { fips: "MH", name: "Mountain High", seat: "East Resort", lon: -117.692, lat: 34.377, pop: 80, km2: 14, extra: [[-117.705, 34.374]] },
    { fips: "LP", name: "Lone Pine Canyon", seat: "Fault Bench", lon: -117.60, lat: 34.34, pop: 90, km2: 22, extra: [[-117.58, 34.33]] },
    { fips: "SV", name: "Swarthout Valley", seat: "Heath Creek", lon: -117.64, lat: 34.348, pop: 620, km2: 12, extra: [] },
    { fips: "TM", name: "Table Mountain", seat: "Observatory Rd", lon: -117.68, lat: 34.382, pop: 30, km2: 10, extra: [] },
    { fips: "SC", name: "Sheep Creek", seat: "Acorn Canyon", lon: -117.655, lat: 34.33, pop: 210, km2: 16, extra: [] },
    { fips: "PH", name: "Phelan Bench", seat: "Phelan", lon: -117.57, lat: 34.305, pop: 14100, km2: 28, extra: [[-117.54, 34.30]] },
    { fips: "AC", name: "Angeles Crest", seat: "Hwy 2", lon: -117.56, lat: 34.39, pop: 20, km2: 24, extra: [[-117.54, 34.41]] },
  ],
  elev(lat, lon) {
    let z = 1780 + (lat - 34.34) * 400;
    z += peakSum(lat, lon, [
      { lon: -117.695, lat: 34.378, h: 780, s: 0.016, name: "Wright Mtn" },
      { lon: -117.71, lat: 34.37, h: 560, s: 0.018, name: "Mountain High" },
      { lon: -117.675, lat: 34.35, h: 320, s: 0.02, name: "Blue Ridge" },
      { lon: -117.68, lat: 34.385, h: 260, s: 0.012, name: "Table Mtn" },
      { lon: -117.55, lat: 34.40, h: 380, s: 0.028, name: "Angeles Crest" },
    ]);
    const dFault = distToPolyline(lon, lat, [[-117.72, 34.32], [-117.64, 34.34], [-117.56, 34.325], [-117.52, 34.31]]);
    z -= 90 * Math.exp(-(dFault * dFault) / 0.00025);
    const dVal = distToPolyline(lon, lat, [[-117.66, 34.38], [-117.635, 34.36], [-117.62, 34.34]]);
    z -= 70 * Math.exp(-(dVal * dVal) / 0.00022);
    if (lat < 34.32) z -= (34.32 - lat) * 2200;
    z += (fbm(lon * 22, lat * 22) - 0.48) * 70;
    z += (fbm(lon * 60, lat * 60, 3) - 0.5) * 22;
    return { z: Math.max(1100, Math.min(2650, z)), water: false, land: true };
  },
};

const DALTON = {
  site: {
    id: "dalton",
    code: "SITE-D",
    title: "SITE-D · BIG DALTON CANYON / GLENDORA",
    subtitle: "USGS 3DEP · Big Dalton Dam · GMR · UNIX System V",
    unit: "TRACT",
    gridLabel: "10 TRACTS · FOOTHILL",
    source: "USGS 3DEP / LA County Parks",
    boot: [
      "SITE-D  big dalton canyon  ·  IRIX 5.3",
      "mount  usgs3dep:/ca/san-gabriels/glendora",
      "vector  BIG DALTON + LITTLE DALTON + GMR",
      "structure  BIG DALTON DAM  1929  reservoir pool",
      "nodes  glendora churches + wilderness HQ",
      "arming  debris-flow grid  A1–H8",
    ],
  },
  bbox: { minLon: -117.92, maxLon: -117.72, minLat: 34.10, maxLat: 34.23 },
  world: { w: 52, d: 34, elevScale: 0.0072 },
  outline: [
    [-117.91, 34.105], [-117.78, 34.102], [-117.73, 34.12], [-117.725, 34.18],
    [-117.76, 34.225], [-117.86, 34.228], [-117.915, 34.20], [-117.91, 34.105],
  ],
  rivers: {
    bigDalton: [[-117.80, 34.22], [-117.805, 34.20], [-117.812, 34.185], [-117.82, 34.168], [-117.83, 34.15], [-117.84, 34.13]],
    littleDalton: [[-117.84, 34.215], [-117.845, 34.195], [-117.85, 34.175], [-117.855, 34.155]],
  },
  roads: {
    gmr: [[-117.86, 34.16], [-117.84, 34.175], [-117.82, 34.19], [-117.80, 34.205], [-117.78, 34.218]],
    foothill: [[-117.91, 34.136], [-117.88, 34.136], [-117.85, 34.137], [-117.82, 34.138], [-117.78, 34.14]],
    grand: [[-117.865, 34.12], [-117.865, 34.136], [-117.864, 34.155]],
  },
  reefs: {},
  beaches: [{ name: "Dalton Reservoir", lon: -117.808, lat: 34.172 }],
  contours: [200, 300, 400, 550, 700, 900, 1100],
  parishes: [
    { fips: "GD", name: "Glendora Downtown", seat: "City Hall", lon: -117.865, lat: 34.136, pop: 18000, km2: 8, extra: [[-117.87, 34.13]] },
    { fips: "NG", name: "North Glendora", seat: "Sierra Madre Ave", lon: -117.86, lat: 34.155, pop: 14000, km2: 10, extra: [] },
    { fips: "BD", name: "Big Dalton Canyon", seat: "Wilderness Park", lon: -117.812, lat: 34.178, pop: 80, km2: 14, extra: [[-117.808, 34.19]] },
    { fips: "LD", name: "Little Dalton", seat: "Little Dalton Picnic", lon: -117.848, lat: 34.175, pop: 120, km2: 8, extra: [] },
    { fips: "WP", name: "Wilderness Park", seat: "Park HQ", lon: -117.818, lat: 34.168, pop: 20, km2: 6, extra: [] },
    { fips: "SM", name: "Sierra Madre Ridge", seat: "GMR", lon: -117.80, lat: 34.205, pop: 15, km2: 16, extra: [[-117.78, 34.22]] },
    { fips: "AZ", name: "Azusa Foothills", seat: "San Gabriel Canyon", lon: -117.90, lat: 34.16, pop: 9000, km2: 14, extra: [[-117.91, 34.18]] },
    { fips: "SD", name: "San Dimas Canyon", seat: "San Dimas", lon: -117.75, lat: 34.14, pop: 11000, km2: 12, extra: [[-117.74, 34.13]] },
    { fips: "CO", name: "Charter Oak", seat: "Cienega", lon: -117.845, lat: 34.118, pop: 9300, km2: 8, extra: [] },
    { fips: "FH", name: "Foothill Corridor", seat: "Route 66", lon: -117.83, lat: 34.138, pop: 8000, km2: 7, extra: [] },
  ],
  elev(lat, lon) {
    /* 3DEP-informed: Glendora ~236 m, dam crest ~472 m, Sierra Madre ~1 km.
       Old 280 m carve + Math.min dam cap + floor 180 punched the dam to valley grade. */
    const breakLat = 34.138;
    const downtown = 236 + (lon + 117.865) * 25;
    let z =
      lat < breakLat
        ? downtown + (lat - 34.136) * 400
        : downtown + (breakLat - 34.136) * 400 + (lat - breakLat) * 4800;
    z += peakSum(lat, lon, [
      { lon: -117.788, lat: 34.220, h: 780, s: 0.02, name: "Sierra Madre" },
      { lon: -117.808, lat: 34.202, h: 420, s: 0.015, name: "Dalton Divide" },
      { lon: -117.768, lat: 34.192, h: 460, s: 0.017, name: "Glendora Mtn" },
      { lon: -117.838, lat: 34.212, h: 260, s: 0.02, name: "Little Dalton ridge" },
    ]);
    const dBig = distToPolyline(lon, lat, DALTON.rivers.bigDalton);
    const dLit = distToPolyline(lon, lat, DALTON.rivers.littleDalton);
    const depth = 25 + Math.max(0, lat - 34.155) * 1400;
    z -= depth * Math.exp(-(dBig * dBig) / 0.000028);
    z -= depth * 0.42 * Math.exp(-(dLit * dLit) / 0.000024);

    const damLon = -117.808;
    const damLat = 34.172;
    const dDam = Math.sqrt(dist2(lon, lat, damLon, damLat));
    if (dDam < 0.006) {
      const blend = Math.exp(-(dDam * dDam) / 0.000007);
      z = z * (1 - blend) + 472 * blend;
    }
    const dPark = Math.sqrt(dist2(lon, lat, -117.818, 34.168));
    if (dPark < 0.009) {
      const blend = Math.exp(-(dPark * dPark) / 0.000022);
      z = z * (1 - blend * 0.88) + 458 * (blend * 0.88);
    }
    const inPool =
      lat > 34.173 && lat < 34.184 && lon > -117.812 && lon < -117.803 && dBig < 0.0038;
    if (inPool) {
      const w = Math.exp(-(dBig * dBig) / 0.00002);
      z = z * (1 - w) + 456 * w;
    }
    if (lat < 34.136) {
      const city = 234 + (lon + 117.86) * 30 + (lat - 34.12) * 90;
      const t = Math.min(1, (34.136 - lat) / 0.018);
      z = z * (1 - t) + city * t;
    }
    if (lat < 34.145 && lat > 34.132) z = Math.max(z, 238 + (lat - 34.136) * 500);
    z += (fbm(lon * 28, lat * 28) - 0.48) * 36;
    z += (fbm(lon * 80, lat * 80, 3) - 0.5) * 11;
    const water = inPool && dBig < 0.0028 && z < 468;
    return { z: Math.max(215, Math.min(1400, z)), water, land: true };
  },
};

const IV = {
  site: {
    id: "iv",
    code: "SITE-I",
    title: "SITE-I · ISLA VISTA / UCSB",
    subtitle: "USGS 3DEP · NOAA coast · marine terrace · UNIX System V",
    unit: "BLOCK",
    gridLabel: "10 BLOCKS · BLUFF",
    source: "USGS 3DEP / UCSB / IVCSD",
    boot: [
      "SITE-I  isla vista theater  ·  IRIX 5.3",
      "mount  usgs3dep:/ca/santa-barbara/isla-vista",
      "vector  IV CDP + UCSB + COAL OIL POINT",
      "bluff  CAMINO DEL SUR → DEL PLAYA  12 m drop",
      "nodes  university parish + IVCSD + reserve",
      "arming  king-tide grid  A1–H8",
    ],
  },
  bbox: { minLon: -119.905, maxLon: -119.828, minLat: 34.402, maxLat: 34.425 },
  world: { w: 54, d: 28, elevScale: 0.12 },
  outline: [
    [-119.902, 34.409], [-119.888, 34.4055], [-119.872, 34.4048], [-119.858, 34.405],
    [-119.842, 34.406], [-119.832, 34.408], [-119.830, 34.418], [-119.845, 34.423],
    [-119.870, 34.424], [-119.892, 34.422], [-119.903, 34.417], [-119.902, 34.409],
  ],
  rivers: {
    devereux: [[-119.888, 34.418], [-119.887, 34.414], [-119.885, 34.410], [-119.882, 34.407]],
  },
  roads: {
    elColegio: [[-119.868, 34.412], [-119.858, 34.4125], [-119.848, 34.413], [-119.838, 34.414]],
    pardall: [[-119.858, 34.4125], [-119.857, 34.410], [-119.856, 34.4078]],
    delPlaya: [[-119.875, 34.4062], [-119.865, 34.406], [-119.855, 34.4062], [-119.845, 34.4068]],
    camDelSur: [[-119.870, 34.418], [-119.868, 34.412], [-119.866, 34.407]],
  },
  reefs: {
    kelp: [[-119.890, 34.403], [-119.870, 34.4025], [-119.850, 34.403], [-119.835, 34.404]],
  },
  beaches: [
    { name: "Campus Point", lon: -119.842, lat: 34.4065 },
    { name: "Devereux", lon: -119.884, lat: 34.4075 },
    { name: "Sands", lon: -119.872, lat: 34.4058 },
  ],
  contours: [-8, 0, 5, 10, 15, 22, 30],
  parishes: [
    { fips: "DP", name: "Del Playa", seat: "DP Bluff", lon: -119.858, lat: 34.4065, pop: 3200, km2: 0.6, extra: [[-119.865, 34.406]] },
    { fips: "PD", name: "Pardall Corridor", seat: "Pardall Rd", lon: -119.856, lat: 34.410, pop: 2800, km2: 0.5, extra: [] },
    { fips: "EM", name: "Embarcadero", seat: "Embarcadero Hall", lon: -119.852, lat: 34.412, pop: 2100, km2: 0.5, extra: [] },
    { fips: "UC", name: "UCSB Campus", seat: "Storke Tower", lon: -119.848, lat: 34.414, pop: 24000, km2: 4.0, extra: [[-119.845, 34.416]] },
    { fips: "CP", name: "Campus Point", seat: "Campus Point", lon: -119.842, lat: 34.408, pop: 400, km2: 0.8, extra: [] },
    { fips: "ST", name: "Storke / El Colegio", seat: "Storke Plaza", lon: -119.855, lat: 34.4135, pop: 3500, km2: 0.7, extra: [] },
    { fips: "DV", name: "Devereux / COPR", seat: "Coal Oil Point", lon: -119.878, lat: 34.410, pop: 180, km2: 1.6, extra: [[-119.888, 34.408]] },
    { fips: "PE", name: "Camino Pescadero", seat: "Pescadero", lon: -119.862, lat: 34.409, pop: 2600, km2: 0.5, extra: [] },
    { fips: "GB", name: "Goleta Beach", seat: "Goleta Pier", lon: -119.830, lat: 34.417, pop: 200, km2: 1.2, extra: [[-119.832, 34.42]] },
    { fips: "OB", name: "Ocean Bluffs", seat: "Camino Majorca", lon: -119.870, lat: 34.407, pop: 1900, km2: 0.6, extra: [] },
  ],
  elev(lat, lon) {
    const bluff = 34.4058 + (lon + 119.86) * 0.02;
    if (lat < bluff - 0.0008) {
      const off = bluff - lat;
      return { z: Math.max(-18, -2 - off * 900 + (fbm(lon * 40, lat * 40, 2) - 0.5) * 2), water: true, land: false };
    }
    let z = 12 + (lat - 34.406) * 280;
    const dSlough = distToPolyline(lon, lat, IV.rivers.devereux);
    z -= 10 * Math.exp(-(dSlough * dSlough) / 0.000004);
    if (lon > -119.845 && lat > 34.412) z += 4;
    if (lat < bluff + 0.0015) z = Math.min(z, 8 + (lat - bluff) * 4000);
    z += (fbm(lon * 80, lat * 80, 4) - 0.5) * 2.2;
    return { z: Math.max(1.2, Math.min(38, z)), water: false, land: true };
  },
};

const PACKS = { ww: WW, dalton: DALTON, iv: IV };
const T = PACKS[PAD] || WW;

export const SITE = T.site;
export const BBOX = T.bbox;
export const WORLD = T.world;
export const LA_OUTLINE = T.outline;
export const RIVERS = T.rivers;
export const ROADS = T.roads;
export const REEFS = T.reefs;
export const BEACHES = T.beaches;
export const CAYS = [];
export const CONTOUR_LEVELS = T.contours;
export const PARISHES = T.parishes;

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

PARISHES.forEach((p, i) => {
  p.index = i;
  p.weight = Math.pow(p.km2, 0.5);
  p.sector = sectorCode(p.lon, p.lat);
  p.attractors = [[p.lon, p.lat], ...(p.extra || [])];
});

export function insideLA(lon, lat) {
  return pointInRing(lon, lat, LA_OUTLINE);
}

export function elevMeters(lat, lon) {
  return T.elev(lat, lon);
}

export function assignParish(lon, lat) {
  if (PAD === "iv" && !insideLA(lon, lat) && elevMeters(lat, lon).water) return -1;
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
  const s = String(q || "").toLowerCase();
  return (
    PARISHES.find(
      (p) =>
        p.name.toLowerCase() === s ||
        p.seat.toLowerCase() === s ||
        p.fips.toLowerCase() === s ||
        p.name.toLowerCase().includes(s)
    ) || null
  );
}

export function buildDem(nx = 200, ny = 140) {
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
    const e0 = sampleDem(dem, lon0, lat0);
    const e1 = sampleDem(dem, lon1, lat1);
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
  for (const [lon, lat] of lonlat) {
    const [x, z] = project(lon, lat);
    const e = sampleDem(dem, lon, lat);
    arr.push(x, e * WORLD.elevScale + 0.07, z);
  }
  return arr;
}

export function hypsometric(z) {
  if (PAD === "iv") {
    if (z < -6) return [0.02, 0.08, 0.18];
    if (z < 0) return [0.04, 0.22, 0.32];
    if (z < 6) return [0.42, 0.40, 0.22];
    if (z < 16) return [0.18, 0.38, 0.16];
    return [0.32, 0.40, 0.14];
  }
  if (PAD === "ww") {
    if (z < 1300) return [0.28, 0.24, 0.10];
    if (z < 1700) return [0.18, 0.32, 0.12];
    if (z < 2000) return [0.22, 0.38, 0.14];
    if (z < 2300) return [0.42, 0.42, 0.22];
    return [0.82, 0.82, 0.78];
  }
  if (z < 250) return [0.16, 0.28, 0.12];
  if (z < 400) return [0.20, 0.36, 0.12];
  if (z < 650) return [0.28, 0.38, 0.12];
  if (z < 900) return [0.42, 0.40, 0.16];
  return [0.62, 0.55, 0.32];
}
