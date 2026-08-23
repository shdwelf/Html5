export const SITE = {
  id: "la",
  code: "SITE-L",
  title: "SITE-L · PARISH CONTROL",
  subtitle: "USGS 3DEP NED · political / parish · UNIX System V · fsn",
  unit: "PARISH",
  gridLabel: "64 PARISHES · NODES 20",
  source: "TIGER / 3DEP reconstruction",
  boot: [
    "SITE-L  parish control  ·  IRIX 5.3",
    "probing  usgs 3dep / ned 1/3\"  …  reconstructed",
    "loading  TIGER parish vectors  …  64",
    "geocoding  sanctuary nodes   …  20",
    "arming  containment grid  A1–H8",
    "fsn  /parkfs/990   ready",
  ],
};

export const CONTOUR_LEVELS = [0, 5, 10, 20, 40, 70, 110, 150];

/** Louisiana political geography + USGS-style 3DEP reconstruction.
 *  Live NED tiles need a network; this DEM is a physically informed
 *  reconstruction of 3DEP/NED traits (coastal marsh, Mississippi
 *  alluvium, Kisatchie uplands, Driskill 163 m, New Orleans bowl).
 */

export const BBOX = {
  minLon: -94.08,
  maxLon: -88.72,
  minLat: 28.88,
  maxLat: 33.08,
};

export const WORLD = { w: 54, d: 44, elevScale: 0.038 };

export function project(lon, lat) {
  const x = ((lon - BBOX.minLon) / (BBOX.maxLon - BBOX.minLon) - 0.5) * WORLD.w;
  const z = ((BBOX.maxLat - lat) / (BBOX.maxLat - BBOX.minLat) - 0.5) * WORLD.d;
  return [x, z];
}

export function unproject(x, z) {
  const lon = ((x / WORLD.w + 0.5) * (BBOX.maxLon - BBOX.minLon)) + BBOX.minLon;
  const lat = BBOX.maxLat - ((z / WORLD.d + 0.5) * (BBOX.maxLat - BBOX.minLat));
  return [lon, lat];
}

export function sectorCode(lon, lat) {
  const c = Math.min(7, Math.max(0, Math.floor(((lon - BBOX.minLon) / (BBOX.maxLon - BBOX.minLon)) * 8)));
  const r = Math.min(7, Math.max(0, Math.floor(((BBOX.maxLat - lat) / (BBOX.maxLat - BBOX.minLat)) * 8)));
  return `${"ABCDEFGH"[c]}${r + 1}`;
}

/** Simplified Louisiana state ring, lon/lat, CCW. */
export const LA_OUTLINE = [
  [-93.84, 29.70], [-93.55, 29.60], [-93.12, 29.57], [-92.64, 29.52],
  [-92.18, 29.46], [-91.72, 29.28], [-91.38, 29.16], [-91.02, 29.10],
  [-90.62, 29.06], [-90.28, 29.04], [-89.98, 28.94], [-89.62, 28.91],
  [-89.38, 28.93], [-89.20, 29.08], [-89.16, 29.22], [-89.28, 29.38],
  [-89.42, 29.52], [-89.28, 29.58], [-89.08, 29.42], [-88.92, 29.22],
  [-88.82, 29.18], [-88.78, 29.32], [-88.90, 29.55], [-89.05, 29.72],
  [-89.22, 29.86], [-89.40, 29.92], [-89.18, 30.02], [-88.86, 30.08],
  [-88.84, 30.22], [-89.12, 30.20], [-89.42, 30.14], [-89.52, 30.22],
  [-89.48, 30.48], [-89.55, 30.72], [-89.72, 30.96], [-89.80, 31.00],
  [-90.20, 31.00], [-90.70, 31.00], [-91.10, 31.00], [-91.55, 31.00],
  [-91.62, 31.18], [-91.48, 31.42], [-91.28, 31.62], [-91.18, 31.88],
  [-91.12, 32.12], [-91.08, 32.38], [-91.16, 32.62], [-91.12, 32.88],
  [-91.17, 33.02], [-91.65, 33.02], [-92.15, 33.02], [-92.70, 33.02],
  [-93.25, 33.02], [-93.82, 33.02], [-94.04, 33.02], [-94.04, 32.55],
  [-94.04, 32.10], [-94.04, 31.72], [-93.88, 31.42], [-93.72, 31.08],
  [-93.70, 30.72], [-93.72, 30.38], [-93.78, 30.05], [-93.84, 29.70],
];

export const RIVERS = {
  mississippi: [
    [-91.17, 33.02], [-91.14, 32.72], [-91.10, 32.40], [-91.16, 32.10],
    [-91.22, 31.78], [-91.40, 31.50], [-91.58, 31.18], [-91.62, 30.92],
    [-91.42, 30.70], [-91.20, 30.48], [-91.10, 30.28], [-90.92, 30.12],
    [-90.62, 30.02], [-90.28, 29.97], [-90.05, 29.94], [-89.92, 29.88],
    [-89.88, 29.72], [-89.70, 29.52], [-89.45, 29.32], [-89.25, 29.15],
  ],
  red: [
    [-93.92, 32.52], [-93.75, 32.48], [-93.55, 32.28], [-93.34, 32.02],
    [-93.12, 31.78], [-92.88, 31.52], [-92.62, 31.36], [-92.45, 31.20],
    [-92.12, 31.08], [-91.82, 31.02], [-91.62, 30.98],
  ],
  atchafalaya: [
    [-91.80, 31.02], [-91.76, 30.72], [-91.70, 30.42], [-91.58, 30.12],
    [-91.48, 29.82], [-91.38, 29.50], [-91.30, 29.22],
  ],
  sabine: [
    [-94.00, 33.00], [-94.02, 32.40], [-93.92, 31.80], [-93.72, 31.20],
    [-93.70, 30.60], [-93.75, 30.10], [-93.84, 29.72],
  ],
  pearl: [
    [-89.80, 31.00], [-89.72, 30.70], [-89.60, 30.40], [-89.52, 30.18],
  ],
  ouachita: [
    [-92.08, 33.00], [-92.12, 32.70], [-92.12, 32.40], [-92.08, 32.10],
    [-92.00, 31.80], [-91.88, 31.55], [-91.72, 31.30],
  ],
};

const PEAKS = [
  { lon: -92.8965, lat: 32.4248, h: 163, s: 0.11, name: "Driskill Mtn" },
  { lon: -93.05, lat: 31.48, h: 92, s: 0.28, name: "Kisatchie" },
  { lon: -93.20, lat: 31.08, h: 78, s: 0.18, name: "Vernon hills" },
  { lon: -91.51, lat: 30.93, h: 88, s: 0.09, name: "Tunica Hills" },
  { lon: -90.15, lat: 30.85, h: 42, s: 0.16, name: "Florida Parishes" },
  { lon: -92.64, lat: 32.53, h: 82, s: 0.10, name: "Ruston" },
  { lon: -93.28, lat: 32.62, h: 77, s: 0.10, name: "Minden" },
  { lon: -93.75, lat: 32.52, h: 62, s: 0.12, name: "Shreveport terrace" },
  { lon: -92.45, lat: 31.75, h: 48, s: 0.14, name: "Winn upland" },
];

const BOWLS = [
  { lon: -90.07, lat: 29.95, h: -6.5, s: 0.13 },
  { lon: -90.18, lat: 30.20, h: -0.4, s: 0.28, water: true }, // Pontchartrain
  { lon: -90.50, lat: 30.25, h: -0.2, s: 0.10, water: true }, // Maurepas
  { lon: -93.33, lat: 30.05, h: 0.1, s: 0.10, water: true },
  { lon: -91.55, lat: 29.75, h: 0.2, s: 0.16, water: true },
  { lon: -91.75, lat: 30.20, h: 0.4, s: 0.14, water: true },
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
  return pointInRing(lon, lat, LA_OUTLINE);
}

/** Elevation in meters (NAVD88-like). Water flagged separately. */
export function elevMeters(lat, lon) {
  if (!insideLA(lon, lat)) return { z: 0, water: true, land: false };

  let z = 2 + Math.max(0, lat - 29.15) * 16;
  if (lat < 30.15) z *= Math.max(0.05, (lat - 28.88) / 1.28);

  const dMS = distToPolyline(lon, lat, RIVERS.mississippi);
  z *= 1 - 0.78 * Math.exp(-(dMS * dMS) / 0.085);
  z += 1.2;

  const dRed = distToPolyline(lon, lat, RIVERS.red);
  z *= 1 - 0.35 * Math.exp(-(dRed * dRed) / 0.04);

  const dAtch = distToPolyline(lon, lat, RIVERS.atchafalaya);
  z *= 1 - 0.55 * Math.exp(-(dAtch * dAtch) / 0.07);

  for (const p of PEAKS) {
    z += p.h * Math.exp(-dist2(lon, lat, p.lon, p.lat) / (p.s * p.s));
  }

  if (lon > -90.2 && lat > 30.45 && lat < 31.02) z += 12;
  if (lon < -93.1 && lat > 31.2) z += 8;

  z += (fbm(lon * 2.8, lat * 2.8) - 0.48) * 16;
  z += (fbm(lon * 8.5, lat * 8.5, 3) - 0.5) * 4.5;

  let water = false;
  for (const b of BOWLS) {
    const w = Math.exp(-dist2(lon, lat, b.lon, b.lat) / (b.s * b.s));
    z += b.h * w;
    if (b.water && w > 0.45) water = true;
  }

  if (lat < 29.45 && lon < -91.5) {
    z = Math.min(z, 1.8 + fbm(lon * 12, lat * 12, 2) * 1.2);
    if (z < 1.2) water = true;
  }
  if (lat < 29.35 && lon > -91.2 && lon < -89.6) {
    z = Math.min(z, 2.4);
  }

  if (water) z = Math.min(z, 0.15);
  z = Math.max(-2.8, Math.min(168, z));
  return { z, water, land: true };
}

export const PARISHES = [
  { fips: "22001", name: "Acadia", seat: "Crowley", lon: -92.41, lat: 30.29, pop: 57576, km2: 1704, extra: [] },
  { fips: "22003", name: "Allen", seat: "Oberlin", lon: -92.83, lat: 30.65, pop: 22750, km2: 1984, extra: [] },
  { fips: "22005", name: "Ascension", seat: "Donaldsonville", lon: -90.91, lat: 30.20, pop: 126500, km2: 784, extra: [] },
  { fips: "22007", name: "Assumption", seat: "Napoleonville", lon: -91.06, lat: 29.90, pop: 21039, km2: 944, extra: [] },
  { fips: "22009", name: "Avoyelles", seat: "Marksville", lon: -92.00, lat: 31.07, pop: 39693, km2: 2243, extra: [] },
  { fips: "22011", name: "Beauregard", seat: "DeRidder", lon: -93.34, lat: 30.65, pop: 36549, km2: 3009, extra: [] },
  { fips: "22013", name: "Bienville", seat: "Arcadia", lon: -93.06, lat: 32.35, pop: 12981, km2: 2132, extra: [[-92.90, 32.42]] },
  { fips: "22015", name: "Bossier", seat: "Benton", lon: -93.60, lat: 32.68, pop: 128746, km2: 2245, extra: [[-93.66, 32.55]] },
  { fips: "22017", name: "Caddo", seat: "Shreveport", lon: -93.88, lat: 32.58, pop: 237848, km2: 2427, extra: [[-93.95, 32.85], [-93.75, 32.51], [-93.79, 32.45]] },
  { fips: "22019", name: "Calcasieu", seat: "Lake Charles", lon: -93.36, lat: 30.23, pop: 216785, km2: 2834, extra: [[-93.20, 30.35]] },
  { fips: "22021", name: "Caldwell", seat: "Columbia", lon: -92.12, lat: 32.09, pop: 9645, km2: 1404, extra: [] },
  { fips: "22023", name: "Cameron", seat: "Cameron", lon: -93.20, lat: 29.85, pop: 5617, km2: 5003, extra: [[-93.65, 29.78], [-92.78, 29.80]] },
  { fips: "22025", name: "Catahoula", seat: "Harrisonburg", lon: -91.85, lat: 31.67, pop: 8906, km2: 1914, extra: [] },
  { fips: "22027", name: "Claiborne", seat: "Homer", lon: -92.99, lat: 32.82, pop: 14170, km2: 1987, extra: [] },
  { fips: "22029", name: "Concordia", seat: "Vidalia", lon: -91.64, lat: 31.44, pop: 18687, km2: 1935, extra: [[-91.55, 31.15]] },
  { fips: "22031", name: "De Soto", seat: "Mansfield", lon: -93.74, lat: 32.06, pop: 26812, km2: 2321, extra: [] },
  { fips: "22033", name: "East Baton Rouge", seat: "Baton Rouge", lon: -91.09, lat: 30.54, pop: 456781, km2: 1220, extra: [[-91.14, 30.43]] },
  { fips: "22035", name: "East Carroll", seat: "Lake Providence", lon: -91.23, lat: 32.73, pop: 7459, km2: 1153, extra: [] },
  { fips: "22037", name: "East Feliciana", seat: "Clinton", lon: -91.05, lat: 30.85, pop: 19539, km2: 1181, extra: [] },
  { fips: "22039", name: "Evangeline", seat: "Ville Platte", lon: -92.41, lat: 30.73, pop: 32350, km2: 1764, extra: [] },
  { fips: "22041", name: "Franklin", seat: "Winnsboro", lon: -91.67, lat: 32.14, pop: 19774, km2: 1647, extra: [] },
  { fips: "22043", name: "Grant", seat: "Colfax", lon: -92.56, lat: 31.60, pop: 22169, km2: 1723, extra: [] },
  { fips: "22045", name: "Iberia", seat: "New Iberia", lon: -91.78, lat: 29.97, pop: 69929, km2: 2670, extra: [[-91.85, 29.72]] },
  { fips: "22047", name: "Iberville", seat: "Plaquemine", lon: -91.35, lat: 30.26, pop: 30241, km2: 1691, extra: [] },
  { fips: "22049", name: "Jackson", seat: "Jonesboro", lon: -92.56, lat: 32.30, pop: 15031, km2: 1502, extra: [] },
  { fips: "22051", name: "Jefferson", seat: "Gretna", lon: -90.11, lat: 29.80, pop: 440781, km2: 1663, extra: [[-90.18, 29.98], [-90.08, 29.45], [-90.054, 29.915], [-90.16, 30.00], [-90.20, 29.99]] },
  { fips: "22053", name: "Jefferson Davis", seat: "Jennings", lon: -92.81, lat: 30.27, pop: 32250, km2: 1704, extra: [] },
  { fips: "22055", name: "Lafayette", seat: "Lafayette", lon: -92.03, lat: 30.21, pop: 241753, km2: 700, extra: [] },
  { fips: "22057", name: "Lafourche", seat: "Thibodaux", lon: -90.40, lat: 29.55, pop: 97557, km2: 3813, extra: [[-90.52, 29.78], [-90.22, 29.22], [-90.82, 29.795]] },
  { fips: "22059", name: "LaSalle", seat: "Jena", lon: -92.16, lat: 31.68, pop: 14791, km2: 1717, extra: [] },
  { fips: "22061", name: "Lincoln", seat: "Ruston", lon: -92.66, lat: 32.60, pop: 48396, km2: 1225, extra: [] },
  { fips: "22063", name: "Livingston", seat: "Livingston", lon: -90.73, lat: 30.44, pop: 142282, km2: 1820, extra: [] },
  { fips: "22065", name: "Madison", seat: "Tallulah", lon: -91.24, lat: 32.37, pop: 10017, km2: 1686, extra: [] },
  { fips: "22067", name: "Morehouse", seat: "Bastrop", lon: -91.80, lat: 32.82, pop: 25629, km2: 2088, extra: [] },
  { fips: "22069", name: "Natchitoches", seat: "Natchitoches", lon: -93.10, lat: 31.72, pop: 37515, km2: 3365, extra: [[-93.05, 31.95]] },
  { fips: "22071", name: "Orleans", seat: "New Orleans", lon: -89.93, lat: 30.03, pop: 383997, km2: 907, extra: [[-90.07, 29.96]] },
  { fips: "22073", name: "Ouachita", seat: "Monroe", lon: -92.16, lat: 32.48, pop: 160368, km2: 1631, extra: [] },
  { fips: "22075", name: "Plaquemines", seat: "Pointe à la Hache", lon: -89.60, lat: 29.42, pop: 23515, km2: 6290, extra: [[-89.85, 29.68], [-89.50, 29.38], [-89.28, 29.18]] },
  { fips: "22077", name: "Pointe Coupee", seat: "New Roads", lon: -91.60, lat: 30.71, pop: 20758, km2: 1530, extra: [] },
  { fips: "22079", name: "Rapides", seat: "Alexandria", lon: -92.48, lat: 31.20, pop: 130023, km2: 3535, extra: [[-92.55, 31.40]] },
  { fips: "22081", name: "Red River", seat: "Coushatta", lon: -93.33, lat: 32.09, pop: 7620, km2: 1041, extra: [] },
  { fips: "22083", name: "Richland", seat: "Rayville", lon: -91.76, lat: 32.42, pop: 20007, km2: 1463, extra: [] },
  { fips: "22085", name: "Sabine", seat: "Many", lon: -93.56, lat: 31.56, pop: 22155, km2: 2620, extra: [] },
  { fips: "22087", name: "St. Bernard", seat: "Chalmette", lon: -89.62, lat: 29.87, pop: 43764, km2: 5548, extra: [[-89.96, 29.94], [-89.40, 29.82], [-89.70, 29.86]] },
  { fips: "22089", name: "St. Charles", seat: "Hahnville", lon: -90.36, lat: 29.91, pop: 52549, km2: 1062, extra: [] },
  { fips: "22091", name: "St. Helena", seat: "Greensburg", lon: -90.71, lat: 30.82, pop: 10920, km2: 1060, extra: [] },
  { fips: "22093", name: "St. James", seat: "Convent", lon: -90.80, lat: 30.03, pop: 20192, km2: 668, extra: [] },
  { fips: "22095", name: "St. John the Baptist", seat: "Edgard", lon: -90.50, lat: 30.12, pop: 42477, km2: 901, extra: [] },
  { fips: "22097", name: "St. Landry", seat: "Opelousas", lon: -92.00, lat: 30.60, pop: 82440, km2: 2432, extra: [] },
  { fips: "22099", name: "St. Martin", seat: "St. Martinville", lon: -91.61, lat: 30.25, pop: 51767, km2: 2115, extra: [[-91.75, 30.52], [-91.40, 30.00]] },
  { fips: "22101", name: "St. Mary", seat: "Franklin", lon: -91.47, lat: 29.64, pop: 49406, km2: 1631, extra: [] },
  { fips: "22103", name: "St. Tammany", seat: "Covington", lon: -89.96, lat: 30.41, pop: 264570, km2: 2923, extra: [[-89.78, 30.28]] },
  { fips: "22105", name: "Tangipahoa", seat: "Amite City", lon: -90.40, lat: 30.63, pop: 133157, km2: 2132, extra: [[-90.46, 30.38]] },
  { fips: "22107", name: "Tensas", seat: "St. Joseph", lon: -91.33, lat: 32.00, pop: 4147, km2: 1655, extra: [] },
  { fips: "22109", name: "Terrebonne", seat: "Houma", lon: -90.84, lat: 29.40, pop: 109580, km2: 5387, extra: [[-90.72, 29.58], [-90.92, 29.18]] },
  { fips: "22111", name: "Union", seat: "Farmerville", lon: -92.37, lat: 32.83, pop: 21331, km2: 2341, extra: [] },
  { fips: "22113", name: "Vermilion", seat: "Abbeville", lon: -92.31, lat: 29.81, pop: 57359, km2: 3984, extra: [[-92.45, 29.62]] },
  { fips: "22115", name: "Vernon", seat: "Leesville", lon: -93.19, lat: 31.11, pop: 48750, km2: 3474, extra: [] },
  { fips: "22117", name: "Washington", seat: "Franklinton", lon: -90.04, lat: 30.85, pop: 45463, km2: 1761, extra: [] },
  { fips: "22119", name: "Webster", seat: "Minden", lon: -93.33, lat: 32.71, pop: 36967, km2: 1634, extra: [] },
  { fips: "22121", name: "West Baton Rouge", seat: "Port Allen", lon: -91.31, lat: 30.46, pop: 27199, km2: 539, extra: [[-91.21, 30.45], [-91.27, 30.48]] },
  { fips: "22123", name: "West Carroll", seat: "Oak Grove", lon: -91.45, lat: 32.79, pop: 9751, km2: 933, extra: [] },
  { fips: "22125", name: "West Feliciana", seat: "St. Francisville", lon: -91.42, lat: 30.88, pop: 15310, km2: 1116, extra: [] },
  { fips: "22127", name: "Winn", seat: "Winnfield", lon: -92.64, lat: 31.94, pop: 13755, km2: 2479, extra: [] },
];

PARISHES.forEach((p, i) => {
  p.index = i;
  p.weight = Math.pow(p.km2, 0.62);
  p.sector = sectorCode(p.lon, p.lat);
  p.attractors = [[p.lon, p.lat], ...p.extra];
});

export function assignParish(lon, lat) {
  if (!insideLA(lon, lat)) return -1;
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
  const s = String(q || "").toLowerCase().replace(/^st\s+/, "st. ");
  return PARISHES.find((p) => p.name.toLowerCase() === s || p.seat.toLowerCase() === s || p.fips === q) || null;
}

export function buildDem(nx = 192, ny = 156) {
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
      elev[k] = e.land ? e.z : -4;
      water[k] = e.water || !e.land ? 1 : 0;
      parish[k] = e.land ? assignParish(lon, lat) : -1;
      if (e.land) {
        if (e.z < zMin) zMin = e.z;
        if (e.z > zMax) zMax = e.z;
      }
    }
  }
  return { nx, ny, elev, water, parish, zMin, zMax };
}

export function extractBorders(dem) {
  const { nx, ny, parish, elev, water } = dem;
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
    segs.push(x0, e0 * WORLD.elevScale + 0.04, z0, x1, e1 * WORLD.elevScale + 0.04, z1);
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

/** Marching-squares contour polylines in world XYZ. */
export function buildContours(dem, levels) {
  const { nx, ny, elev } = dem;
  const out = [];
  const lerp = (a, b, va, vb, t) => a + ((t - va) / (vb - va + 1e-9)) * (b - a);
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
        if (e0 < -1 && e1 < -1 && e2 < -1 && e3 < -1) continue;
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
        for (let k = 0; k < pairs.length; k += 2) {
          segs.push(...e[pairs[k]], ...e[pairs[k + 1]]);
        }
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
    const e = Math.max(0, sampleDem(dem, lon, lat));
    arr.push(x, e * WORLD.elevScale + 0.06, z);
  }
  return arr;
}

export function hypsometric(z) {
  if (z < 0.3) return [0.02, 0.12, 0.14];
  if (z < 3) return [0.05, 0.22, 0.14];
  if (z < 10) return [0.08, 0.32, 0.16];
  if (z < 25) return [0.18, 0.42, 0.12];
  if (z < 50) return [0.42, 0.48, 0.10];
  if (z < 90) return [0.55, 0.42, 0.08];
  return [0.78, 0.72, 0.42];
}
