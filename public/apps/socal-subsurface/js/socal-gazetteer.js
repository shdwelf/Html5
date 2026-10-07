/**
 * SOCAL SUBSURFACE — USGS GNIS gazetteer query engine (socal-gazetteer)
 *
 * Client-side "GazBean" (docs/research/03_GAZBEAN_ARCHITECTURE.md port):
 * ADL GSP-flavoured ops (getCapabilities / searchBox / searchPoint /
 * searchName / describe) running entirely offline over GAZ_ROWS, with the
 * pg_trgm similarity model reimplemented in JS:
 *   similarity(s1, s2) = |T(s1) ∩ T(s2)| / |T(s1) ∪ T(s2)|  ≥ τ
 * over space-padded character trigrams, plus prefix/substring boosts used by
 * the docker demo fuzzy-matcher. Facet filtering walks the ADL FTT prefix
 * tree (phys.* / hydro.* / pop.* / admin.* / manmade.* / vegetation.*), so
 * facet "phys" matches phys.range, facet "phys.range" matches exactly that.
 *
 * Coordinates EPSG:4326, lon/lat order per ADL convention; six-decimal input
 * is accepted though seed rows carry three-to-six decimals. No dependencies —
 * this module runs in vitest under plain node.
 */

import { GAZ_CLASSES as DEFAULT_CLASSES, GAZ_ROWS as DEFAULT_ROWS } from "./socal-gazetteer-data.js";

/** UI metadata per GNIS FEATURE_CLASS (label, marker swatch, facet branch). */
export const GAZ_CLASS_META = {
  Range: { label: "Ranges", short: "RNG", swatch: "#ffb020" },
  Summit: { label: "Summits", short: "PK", swatch: "#ffc55c" },
  Valley: { label: "Valleys", short: "VLY", swatch: "#7fd8a0" },
  Flat: { label: "Flats", short: "FLT", swatch: "#7fd8a0" },
  Basin: { label: "Basins", short: "BSN", swatch: "#5cd6ff" },
  Gap: { label: "Passes / gaps", short: "GAP", swatch: "#ff9d6c" },
  Falls: { label: "Falls", short: "FLS", swatch: "#8ce0ff" },
  Glacier: { label: "Glaciers", short: "GLC", swatch: "#d6f4ff" },
  Lake: { label: "Lakes", short: "LK", swatch: "#5c9fff" },
  Reservoir: { label: "Reservoirs", short: "RSV", swatch: "#4c7fd6" },
  Spring: { label: "Springs", short: "SPR", swatch: "#54e0c7" },
  Stream: { label: "Streams", short: "STM", swatch: "#9db2e8" },
  Mine: { label: "Mines", short: "MNE", swatch: "#e0876c" },
  Oilfield: { label: "Oil fields", short: "OIL", swatch: "#c7894f" },
  Tunnel: { label: "Tunnels", short: "TUN", swatch: "#b9a08e" },
  Crater: { label: "Craters", short: "CRT", swatch: "#ff6ec7" },
  Lava: { label: "Lava fields", short: "LVA", swatch: "#ff8b94" },
  Pillar: { label: "Pillars", short: "PLR", swatch: "#d4b28c" },
  Park: { label: "Parks", short: "PRK", swatch: "#8ce29d" },
  Reserve: { label: "Preserves", short: "RSV", swatch: "#8ce29d" },
  Locale: { label: "Locales", short: "LCL", swatch: "#b8c4d6" },
  Canal: { label: "Canals", short: "CNL", swatch: "#56c8f5" },
  Cape: { label: "Capes", short: "CPE", swatch: "#eab68b" },
  Census: { label: "Census/CDPs", short: "CDP", swatch: "#f0e6c8" },
  Military: { label: "Military", short: "MIL", swatch: "#9fb6a3" },
  "Populated Place": { label: "Populated places", short: "PPL", swatch: "#f8fafc" },
  Geocache: { label: "Geocaches", short: "GC", swatch: "#34d399" },
};

/** FTT prefix → human label, for the facet dropdown. */
export const GAZ_FACETS = [
  { fac: "", label: "all feature types" },
  { fac: "phys", label: "physiographic (phys.*)" },
  { fac: "hydro", label: "hydrographic (hydro.*)" },
  { fac: "manmade", label: "manmade (manmade.*)" },
  { fac: "pop", label: "populated (pop.*)" },
  { fac: "admin", label: "administrative (admin.*)" },
  { fac: "rec", label: "recreational (rec.*)" },
];

export const normalizeName = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const PAD = "  ";
const trigrams = (s) => {
  const p = PAD + s + PAD;
  const set = new Set();
  for (let i = 0; i + 3 <= p.length; i += 1) set.add(p.slice(i, i + 3));
  return set;
};

/** Exported for tests/debug: padding-aware trigram set of a string. */
export const trigramsFor = trigrams;

export const similarity = (normA, setB) => {
  if (!normA || !setB || setB.size === 0) return 0;
  let inter = 0;
  const setA = trigrams(normA);
  for (const t of setA) if (setB.has(t)) inter += 1;
  return inter / (setA.size + setB.size - inter);
};

export const haversineKm = (lat0, lon0, lat1, lon1) => {
  const R = 6371.0088;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat1 - lat0);
  const dLon = toRad(lon1 - lon0);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat0)) * Math.cos(toRad(lat1)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
};

/** ADL GSP get-capabilities — what this engine answers, offline. */
export const getCapabilities = (rows = DEFAULT_ROWS) => ({
  protocol: "ADL GSP 1.2 (offline subset)",
  operations: ["get-capabilities", "search-name", "search-point", "search-box", "describe"],
  srs: "EPSG:4326",
  features: rows.length,
  classes: [...new Set(rows.map((r) => r[1]))].sort(),
  facets: GAZ_FACETS.map((f) => f.fac || "all"),
});

/**
 * Build a queryable index. Lazily counts trigram sets on first query so the
 * 343-row pack costs near nothing at boot.
 */
export const makeGazetteerIndex = (rows = DEFAULT_ROWS) => {
  const entries = rows.map((r, i) => ({
    i,
    name: r[0],
    fclass: r[1],
    ftt: r[2],
    county: r[3],
    lat: r[4],
    lon: r[5],
    elev: r[6],
    gnis: r[7],
    verified: r[8] === 1,
    note: r[9],
    norm: normalizeName(r[0]),
    countyNorm: normalizeName(r[3]),
    grams: null,
    countyGrams: null,
  }));
  const ensure = (e, field = "grams") => {
    if (!e[field]) e[field] = trigrams(field === "grams" ? e.norm : e.countyNorm);
    return e[field];
  };
  return { entries, ensure };
};

const facetMatch = (e, fac) => {
  if (!fac) return true;
  if (fac.endsWith(".*")) fac = fac.slice(0, -2);
  return e.ftt === fac || e.ftt.startsWith(fac + ".");
};

/**
 * ADL GSP search-name: fuzzy trigram match on name (+county context), with
 * exact/prefix/substring boosts. Returns hits sorted by score desc.
 */
export const searchName = (idx, query, opts = {}) => {
  const { facet = "", classes = null, threshold = 0.26, limit = 12 } = opts;
  const norm = normalizeName(String(query ?? ""));
  if (!norm) return [];
  const g = trigrams(norm);
  const hits = [];
  for (const e of idx.entries) {
    if (!facetMatch(e, facet)) continue;
    if (classes && !classes.has(e.fclass)) continue;
    const nameNorm = e.norm;
    let score = similarity(norm, ensureFields(idx, e));
    if (nameNorm === norm) score = Math.max(score, 1.0);
    else if (nameNorm.startsWith(norm)) score = Math.max(score, 0.85);
    else if (nameNorm.includes(norm)) score = Math.max(score, 0.62);
    // County as a secondary field: only an exact-ish hit boosts, never sinks.
    if (e.countyNorm === norm) score = Math.max(score, 0.5);
    else if (e.countyNorm && similarity(norm, ensureFields(idx, e, "countyGrams")) > 0.8)
      score = Math.max(score, 0.55);
    if (score >= threshold || (score > 0 && norm.length <= 2 && nameNorm.startsWith(norm))) {
      hits.push({ entry: e, score: Math.min(1, score) });
    }
  }
  hits.sort((a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name));
  return hits.slice(0, limit).map((h) => ({ ...h.entry, score: h.score }));
};

const ensureFields = (idx, e) => idx.ensure(e);

/** ADL GSP search-point: radius in km around (lat, lon), nearest first. */
export const searchPoint = (idx, lat, lon, opts = {}) => {
  const { radiusKm = 30, facet = "", classes = null, limit = 12 } = opts;
  const hits = [];
  for (const e of idx.entries) {
    if (!facetMatch(e, facet)) continue;
    if (classes && !classes.has(e.fclass)) continue;
    const d = haversineKm(lat, lon, e.lat, e.lon);
    if (d <= radiusKm) hits.push({ e, d });
  }
  hits.sort((a, b) => a.d - b.d);
  return hits.slice(0, limit).map((h) => ({ ...h.e, distKm: h.d }));
};

/** ADL GSP search-box: EPSG:4326 lon/lat rectangle (six decimals accepted). */
export const searchBox = (idx, box, opts = {}) => {
  const { facet = "", classes = null, limit = 200 } = opts;
  const { lat0, lat1, lon0, lon1 } = box;
  const hits = [];
  for (const e of idx.entries) {
    if (!facetMatch(e, facet)) continue;
    if (classes && !classes.has(e.fclass)) continue;
    if (e.lat >= lat0 && e.lat <= lat1 && e.lon >= lon0 && e.lon <= lon1) hits.push(e);
  }
  hits.sort((a, b) => a.name.localeCompare(b.name));
  return hits.slice(0, limit);
};

/** ADL GSP describe: full entry record by index. */
export const describe = (idx, i) => idx.entries[i] ?? null;

/**
 * Class roll-up for the UI: [{ fclass, label, swatch, count }] sorted by
 * label, rows restricted to the loaded pack.
 */
export const classRollup = (rows = DEFAULT_ROWS) => {
  const counts = new Map();
  for (const r of rows) counts.set(r[1], (counts.get(r[1]) ?? 0) + 1);
  return [...counts.entries()]
    .map(([fclass, count]) => ({
      fclass,
      count,
      label: GAZ_CLASS_META[fclass]?.label ?? fclass,
      swatch: GAZ_CLASS_META[fclass]?.swatch ?? "#9db2d1",
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
};

export const DEFAULT_GAZ_ROWS = DEFAULT_ROWS;
export const DEFAULT_GAZ_CLASSES = DEFAULT_CLASSES;
