/**
 * Build the SOCAL SUBSURFACE USGS GNIS gazetteer register data pack.
 *
 * Sources (first match wins for a given name+class):
 *   1. data/gnis/socal-gazetteer-seed.csv — canonical curated register:
 *      FEATURE_NAME | FEATURE_CLASS | ADL_FTT | COUNTY | LAT_N | LON_W |
 *      ELEV_M | GNIS_FEATURE_ID | VERIFIED | NOTE
 *   2. data/gnis/DomesticNames_CA.txt — optional official USGS GNIS national-
 *      file extract (same layout the PostGIS loader in
 *      docs/research/04_USGS_GNIS_POSTGIS_INTEGRATION.md ingests). When present
 *      these rows are authoritative: VERIFIED=1 with the true FEATURE_ID, and
 *      they override curated coordinates on name+class collisions.
 *
 * Output: js/socal-gazetteer-data.js — GAZ_META + GAZ_CLASSES + GAZ_ROWS where
 * every row is the ADL GCS ⟨Name Set, Spatial Footprint (point),
 * Classification⟩ triple projected from the GNIS record:
 *
 *   [name, fclass, ftt, county, lat, lon, elevM|null, gnisId|null, verified 0|1, note|null]
 *
 * County carries the state suffix for register fringes outside California
 * ("Clark NV", "Mohave AZ"). VERIFIED=1 rows must carry the confirmed
 * FEATURE_ID; curated (unverified) rows intentionally have gnisId: null —
 * never invent one. USGS GNIS data is a public-domain US government work.
 *
 *   node scripts/build-socal-gazetteer.mjs
 */

import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(root, "data", "gnis");
const BBOX = { lon0: -121.6, lon1: -114.0, lat0: 32.45, lat1: 38.35 };
const STATES = new Set(["CA", "NV", "AZ", "UT"]);

/** GNIS FEATURE_CLASS → ADL FTT path (docs/research/02 §1.3). */
const FTT_FOR_CLASS = {
  Range: "phys.range",
  Summit: "phys.summit",
  Valley: "phys.valley",
  Basin: "phys.basin",
  Flat: "phys.flat",
  Glacier: "phys.glacier",
  Pillar: "phys.pillar",
  Crater: "phys.crater",
  Lava: "phys.lava",
  Cape: "phys.cape",
  Gap: "phys.gap",
  Falls: "hydro.falls",
  Lake: "hydro.lake",
  Reservoir: "hydro.reservoir",
  Spring: "hydro.spring",
  Stream: "hydro.stream",
  Canal: "manmade.canal",
  Mine: "manmade.mine",
  Oilfield: "manmade.oilfield",
  Tunnel: "manmade.tunnel",
  "Populated Place": "pop.ppl",
  Census: "pop.census",
  Locale: "pop.locale",
  Park: "admin.park",
  Reserve: "admin.reserve",
  Military: "admin.military",
  Geocache: "rec.geocache",
};

const inBbox = (lat, lon) => lat >= BBOX.lat0 && lat <= BBOX.lat1 && lon >= BBOX.lon0 && lon <= BBOX.lon1;
const countyFor = (county, state) => (state !== "CA" ? `${county} ${state}` : county);

/** Parse the canonical seed CSV into old-shape records. */
function* seedRows(text) {
  const lines = text.split(/\r?\n/);
  for (let lineno = 1; lineno <= lines.length; lineno++) {
    const raw = lines[lineno - 1];
    const t = raw.trim();
    if (!t || t.startsWith("#")) continue;
    // allow a leading "|" from hand editing
    const line = t.startsWith("|") ? t.slice(1) : raw;
    const p = line.split("|").map((s) => s.trim());
    if (p.length < 10) throw new Error(`seed:${lineno}: ${p.length} columns, want 10`);
    const [name, cls, ftt, county, lat, lon, elevM, gnis, verifiedRaw, note] = p;
    const verified = verifiedRaw === "1";
    if (verified && !/^\d+$/.test(gnis)) {
      throw new Error(`seed:${lineno}: VERIFIED=1 row '${name}' must carry the confirmed FEATURE_ID`);
    }
    if (!name || !cls || !ftt || !county) throw new Error(`seed:${lineno}: missing name/class/ftt/county`);
    const la = Number(lat);
    const lo = Number(lon);
    if (!Number.isFinite(la) || !Number.isFinite(lo)) throw new Error(`seed:${lineno}: bad coordinates for '${name}'`);
    if (!inBbox(la, lo)) continue; // outside the theater — drop, not error
    if (!(cls in FTT_FOR_CLASS)) throw new Error(`seed:${lineno}: unmapped FEATURE_CLASS '${cls}'`);
    if (ftt !== FTT_FOR_CLASS[cls]) throw new Error(`seed:${lineno}: ftt '${ftt}' does not match class '${cls}' → '${FTT_FOR_CLASS[cls]}'`);
    yield {
      name, cls, ftt, county, lat: la, lon: lo,
      elev: elevM === "" ? null : Number(elevM),
      gnis: verified ? gnis : null, verified: verified ? 1 : 0, note: note || null,
    };
  }
}

/** Parse the official national-file extract (when present) into old-shape records. */
function* nationalRows(text) {
  const lines = text.split(/\r?\n/);
  for (let lineno = 1; lineno <= lines.length; lineno++) {
    const raw = lines[lineno - 1];
    const t = raw.trim();
    if (!t || t.startsWith("#") || t.startsWith("FEATURE_ID")) continue;
    const p = t.split("|").map((s) => s.trim());
    // FEATURE_ID|FEATURE_NAME|FEATURE_CLASS|STATE_ALPHA|STATE_NUMERIC|COUNTY_NAME|COUNTY_NUMERIC|
    // PRIM_LAT_DMS|PRIM_LONG_DMS|PRIM_LAT_DEC|PRIM_LONG_DEC|SOURCE_LAT_DMS|SOURCE_LONG_DMS|
    // SOURCE_LAT_DEC|SOURCE_LONG_DEC|ELEV_IN_M|ELEV_IN_FT|MAP_NAME|DATE_CREATED|DATE_EDITED
    if (p.length < 18) throw new Error(`DomesticNames_CA.txt:${lineno}: ${p.length} columns, want 20`);
    const [fid, name, cls, state, , county] = p;
    if (!STATES.has(state)) continue;
    if (!(cls in FTT_FOR_CLASS)) continue;
    const la = Number(p[9]);
    const lo = Number(p[10]);
    if (!Number.isFinite(la) || !Number.isFinite(lo)) throw new Error(`DomesticNames_CA.txt:${lineno}: bad coordinates`);
    if (!inBbox(la, lo)) continue;
    yield {
      name, cls, ftt: FTT_FOR_CLASS[cls], county: countyFor(county || "Unknown", state), lat: la, lon: lo,
      elev: p[15] === "" ? null : Number(p[15]), gnis: fid, verified: 1,
      note: "Official GNIS national-file row.",
    };
  }
}

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const keyOf = (r) => `${norm(r.name)}|${r.cls}`;

const seed = [...seedRows(await readFile(path.join(dataDir, "socal-gazetteer-seed.csv"), "utf8"))];

let official = [];
const officialPath = path.join(dataDir, "DomesticNames_CA.txt");
if (existsSync(officialPath)) {
  official = [...nationalRows(await readFile(officialPath, "utf8"))];
  console.log(`official extract: ${official.length} in-bbox rows in scope`);
}

const byKey = new Map();
let dupesCollapsed = 0;
for (const rec of [...seed, ...official]) {
  const k = keyOf(rec);
  const prev = byKey.get(k);
  if (!prev) { byKey.set(k, rec); continue; }
  dupesCollapsed += 1;
  if (rec.verified && !prev.verified) byKey.set(k, rec); // official overrides curated
}

const rows = [...byKey.values()]
  .sort((a, b) => a.cls.localeCompare(b.cls) || a.name.localeCompare(b.name))
  .map((r) => [r.name, r.cls, r.ftt, r.county, r.lat, r.lon, r.elev, r.gnis, r.verified, r.note]);

const classes = [...new Set(rows.map((r) => r[1]))].sort();
const verified = rows.filter((r) => r[8] === 1).length;

const out = `/**
 * GENERATED by scripts/build-socal-gazetteer.mjs — do not edit by hand.
 * Inputs: data/gnis/socal-gazetteer-seed.csv (canonical register; the
 * Wikidata P590 anchor set in data/gnis/wikidata-anchors.json was used to
 * bind its VERIFIED FEATURE_IDs)${official.length ? " overridden by DomesticNames_CA.txt (official extract) where colliding" : "; optional DomesticNames_CA.txt (official extract) overrides curated rows when staged"}.
 * ADL GCS entry model: names set + footprint (point) + classification.
 */
export const GAZ_META = {
  title: "USGS GNIS gazetteer — SoCal subsurface theater",
  standard: "ADL Gazetteer Content Standard v1.2 entry model (names/footprint/class)",
  source: "Curated seed register; FEATURE_IDs attached via Wikidata P590 anchors where verified",
  retrieved: ${JSON.stringify(new Date().toISOString().slice(0, 10))},
  bbox: ${JSON.stringify({ lon0: BBOX.lon0, lon1: BBOX.lon1, lat0: BBOX.lat0, lat1: BBOX.lat1 })},
  rowCount: ${rows.length},
  verified: ${verified},
  unverified: ${rows.length - verified},
  license:
    "GNIS/USBGN factual data: USGS, US government work (17 USC 105). Anchor rows: Wikidata CC0. Curated coordinate placements follow the repo evidence-tier discipline.",
  regen: "node scripts/build-socal-gazetteer.mjs (drop DomesticNames_CA.txt into data/gnis/ to upgrade to the official extract)",
};

export const GAZ_CLASSES = ${JSON.stringify(classes, null, 2)};

/** [name, fclass, ftt, county, lat, lon, elevM|null, gnisId|null, verified 0|1, note|null] */
export const GAZ_ROWS = ${JSON.stringify(rows)};
`;

await writeFile(path.join(root, "js", "socal-gazetteer-data.js"), out);
console.log(`wrote js/socal-gazetteer-data.js — ${rows.length} rows (${verified} verified, ${rows.length - verified} curated), ${classes.length} classes, ${dupesCollapsed} dupes collapsed`);
console.log(`  classes: ${classes.join(", ")}`);
