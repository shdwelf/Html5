/**
 * Sync the GNIS gazetteer registers of the SOCAL SUBSURFACE and
 * CHEYENNE / ANGELES theaters over their shared ground: the Angeles
 * National Forest plate (ange) sits inside the socal-subsurface bbox, so the
 * two apps carry overlapping name registers that can drift apart.
 *
 * Reconciliation policy (documented in docs/gazetteer-sync-2026-10-04.md):
 *   1. Names are matched on a folded key (case/diacritics/punctuation and
 *      parentheticals stripped) inside the ange plate envelope (+0.03°).
 *   2. Coordinate conflicts beyond CONFLICT_DEG (~1.3 km):
 *        - a VERIFIED socal row (confirmed GNIS FEATURE_ID) is authoritative
 *          → the cheyenne row takes the verified coordinates;
 *        - when NEITHER side is verified, nothing moves: both values are
 *          curated-tier and overwriting one guess with another would only
 *          launder uncertainty. The divergence is flagged in the run record
 *          for a future DomesticNames-extract check.
 *   3. Cheyenne-only names are appended to the socal register as curated
 *      (VERIFIED=0, gnisId null — never invented) rows with a sync note.
 *   4. Socal-only names inside the envelope are appended to the cheyenne
 *      ange register, except manmade classes the cheyenne theater plots as
 *      dedicated layers (Mine, Oilfield, Tunnel, Canal).
 *
 *   node scripts/sync-gazetteer.mjs            # report only (stdout)
 *   node scripts/sync-gazetteer.mjs --write    # apply to both data packs
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOCAL_PACK = path.join(root, "js", "socal-gazetteer-data.js");
const CHEY_PACK = path.join(root, "js", "cheyenne-data.js");
const SYNC_DATE = "2026-10-04";
const CONFLICT_DEG = 0.012; // ~1.3 km latitude
const PAD_DEG = 0.03;
const WRITE = process.argv.includes("--write");

const { GAZ_META, GAZ_CLASSES, GAZ_ROWS } = await import("../js/socal-gazetteer-data.js");
const { GAZETTEER } = await import("../js/cheyenne-data.js");

/* ----------------------------------------------------------- helpers -- */

const foldKey = (name) =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\([^)]*\)/g, " ")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const FTT_FOR_CLASS = {
  Range: "phys.range", Ridge: "phys.ridge", Summit: "phys.summit", Valley: "phys.valley",
  Basin: "phys.basin", Flat: "phys.flat", Glacier: "phys.glacier", Pillar: "phys.pillar",
  Crater: "phys.crater", Lava: "phys.lava", Cape: "phys.cape", Gap: "phys.gap",
  Falls: "hydro.falls", Lake: "hydro.lake", Reservoir: "hydro.reservoir",
  Spring: "hydro.spring", Stream: "hydro.stream", Canal: "manmade.canal",
  Mine: "manmade.mine", Oilfield: "manmade.oilfield", Tunnel: "manmade.tunnel",
  "Populated Place": "pop.ppl", Census: "pop.census", Locale: "pop.locale",
  Park: "admin.park", Reserve: "admin.reserve", Military: "admin.military",
};
const EXCLUDE_TO_CHEY = new Set(["Mine", "Oilfield", "Tunnel", "Canal"]);

/* ange plate envelope from the cheyenne register itself */
const ange = GAZETTEER.ange.map(([name, lon, lat, cls]) => ({ name, lon, lat, cls, key: foldKey(name) }));
const env = {
  lon0: Math.min(...ange.map((e) => e.lon)) - PAD_DEG,
  lon1: Math.max(...ange.map((e) => e.lon)) + PAD_DEG,
  lat0: Math.min(...ange.map((e) => e.lat)) - PAD_DEG,
  lat1: Math.max(...ange.map((e) => e.lat)) + PAD_DEG,
};
const inEnv = (lat, lon) => lat >= env.lat0 && lat <= env.lat1 && lon >= env.lon0 && lon <= env.lon1;

/* socal rows: [name, fclass, ftt, county, lat, lon, elevM, gnisId, verified, note] */
const socal = GAZ_ROWS.map((r, i) => ({ r: [...r], i, key: foldKey(r[0]) }));
const socalInWin = socal.filter((e) => inEnv(e.r[4], e.r[5]));
const socalByKey = new Map(socalInWin.map((e) => [e.key, e]));
const angeByKey = new Map(ange.map((e) => [e.key, e]));

/* ------------------------------------------------------------ compare -- */

const agreed = [];
const conflicts = [];
const toSocal = [];
const toChey = [];

for (const c of ange) {
  const s = socalByKey.get(c.key);
  if (!s) {
    toSocal.push(c);
    continue;
  }
  const dLat = Math.abs(s.r[4] - c.lat);
  const dLon = Math.abs(s.r[5] - c.lon);
  if (dLat <= CONFLICT_DEG && dLon <= CONFLICT_DEG) {
    agreed.push({ name: c.name, dKm: ((dLat + dLon) * 111.32) / 2 });
    continue;
  }
  const socalVerified = s.r[8] === 1;
  conflicts.push({
    name: c.name,
    socal: [s.r[4], s.r[5]],
    chey: [c.lat, c.lon],
    winner: socalVerified
      ? "socal (verified FEATURE_ID " + s.r[7] + ") → cheyenne row updated"
      : "none — both curated/unverified; flagged, neither file changed",
  });
  if (socalVerified) {
    c.lat = s.r[4];
    c.lon = s.r[5];
  }
}

for (const e of socalInWin) {
  if (angeByKey.has(e.key)) continue;
  if (EXCLUDE_TO_CHEY.has(e.r[1])) continue;
  toChey.push(e);
}

/* ------------------------------------------------------------- apply -- */

const newSocalRows = toSocal.map((c) => {
  const cls = c.cls;
  const ftt = FTT_FOR_CLASS[cls] || "phys";
  const county = c.lon >= -117.66 ? "San Bernardino" : "Los Angeles";
  return [
    c.name, cls, ftt, county, c.lat, c.lon, null, null, 0,
    `Synced ${SYNC_DATE} from the CHEYENNE/ANGELES plate register (GNIS carto MapServer pull 2026-10-02).`,
  ];
});

const mergedSocal = socal.map((e) => e.r).concat(newSocalRows);
mergedSocal.sort((a, b) => (a[1] === b[1] ? a[0].localeCompare(b[0]) : a[1].localeCompare(b[1])));
const mergedClasses = [...new Set([...GAZ_CLASSES, ...newSocalRows.map((r) => r[1])])].sort();

const mergedAnge = ange
  .map((e) => [e.name, e.lon, e.lat, e.cls])
  .concat(toChey.map((e) => [e.r[0], e.r[5], e.r[4], e.r[1]]));

function report() {
  const L = [];
  L.push(`# Gazetteer sync — socal-subsurface ⇄ cheyenne (ange plate) — ${SYNC_DATE}`);
  L.push("");
  L.push("Generated by `node scripts/sync-gazetteer.mjs --write`. Policy lives in the");
  L.push("script header; this file is the run record.");
  L.push("");
  L.push("## Window");
  L.push("");
  L.push(`Ange plate envelope (+${PAD_DEG}°): lon ${env.lon0.toFixed(4)} … ${env.lon1.toFixed(4)}, lat ${env.lat0.toFixed(4)} … ${env.lat1.toFixed(4)}.`);
  L.push(`Socal rows in window: ${socalInWin.length}. Cheyenne ange rows: ${ange.length}.`);
  L.push("");
  L.push(`## Matched and agreeing (≤ ${CONFLICT_DEG}°): ${agreed.length}`);
  L.push("");
  L.push(agreed.map((a) => a.name).join(" · ") || "—");
  L.push("");
  L.push(`## Coordinate conflicts (> ${CONFLICT_DEG}°): ${conflicts.length}`);
  L.push("");
  L.push("| Name | socal had | cheyenne had | winner |");
  L.push("|---|---|---|---|");
  for (const c of conflicts) {
    L.push(`| ${c.name} | ${c.socal[0].toFixed(4)}, ${c.socal[1].toFixed(4)} | ${c.chey[0].toFixed(4)}, ${c.chey[1].toFixed(4)} | ${c.winner} |`);
  }
  L.push("");
  L.push(`## Added to socal register (from cheyenne): ${toSocal.length}`);
  L.push("");
  L.push("All added as curated rows — VERIFIED=0, gnisId null (never invented), with a sync note.");
  L.push("");
  for (const c of toSocal) L.push(`- ${c.name} (${c.cls}) — ${c.lat.toFixed(4)}, ${c.lon.toFixed(4)}`);
  L.push("");
  L.push(`## Added to cheyenne ange register (from socal): ${toChey.length}`);
  L.push("");
  L.push("Mine/Oilfield/Tunnel/Canal classes excluded (cheyenne plots mines from MRDS, not GNIS).");
  L.push("");
  for (const e of toChey) L.push(`- ${e.r[0]} (${e.r[1]}) — ${e.r[4].toFixed(4)}, ${e.r[5].toFixed(4)}${e.r[8] === 1 ? ` — verified FEATURE_ID ${e.r[7]}` : ""}`);
  L.push("");
  L.push("## Result");
  L.push("");
  L.push(`- js/socal-gazetteer-data.js: ${GAZ_ROWS.length} → ${mergedSocal.length} rows (verified ${mergedSocal.filter((r) => r[8] === 1).length}).`);
  L.push(`- js/cheyenne-data.js GAZETTEER.ange: ${GAZETTEER.ange.length} → ${mergedAnge.length} rows.`);
  L.push("- chey (Colorado) plate untouched — outside the socal theater.");
  L.push("");
  return L.join("\n");
}

async function writeSocal() {
  const meta = {
    ...GAZ_META,
    rowCount: mergedSocal.length,
    verified: mergedSocal.filter((r) => r[8] === 1).length,
    unverified: mergedSocal.filter((r) => r[8] !== 1).length,
    sync: `Cross-checked with js/cheyenne-data.js GAZETTEER (ange plate) by scripts/sync-gazetteer.mjs on ${SYNC_DATE}; see docs/gazetteer-sync-${SYNC_DATE}.md`,
  };
  const head = `/**
 * GENERATED by scripts/build-socal-gazetteer.mjs — do not edit by hand.
 * Inputs: data/gnis/socal-gazetteer-seed.csv (canonical register; the
 * Wikidata P590 anchor set in data/gnis/wikidata-anchors.json was used to
 * bind its VERIFIED FEATURE_IDs); optional DomesticNames_CA.txt (official extract) overrides curated rows when staged.
 * Cross-register sync: scripts/sync-gazetteer.mjs (${SYNC_DATE}) reconciled the
 * ange-plate overlap with js/cheyenne-data.js — see docs/gazetteer-sync-${SYNC_DATE}.md.
 * ADL GCS entry model: names set + footprint (point) + classification.
 */
`;
  const metaSrc = `export const GAZ_META = {
  title: ${JSON.stringify(meta.title)},
  standard: ${JSON.stringify(meta.standard)},
  source: ${JSON.stringify(meta.source)},
  retrieved: ${JSON.stringify(meta.retrieved)},
  sync: ${JSON.stringify(meta.sync)},
  bbox: ${JSON.stringify(meta.bbox)},
  rowCount: ${meta.rowCount},
  verified: ${meta.verified},
  unverified: ${meta.unverified},
  license:
    ${JSON.stringify(meta.license)},
  regen: ${JSON.stringify(meta.regen)},
};
`;
  const classSrc = `export const GAZ_CLASSES = ${JSON.stringify(mergedClasses, null, 2)};
`;
  const rowsSrc =
    "/** [name, fclass, ftt, county, lat, lon, elevM|null, gnisId|null, verified 0|1, note|null] */\n" +
    "export const GAZ_ROWS = [" + mergedSocal.map((r) => JSON.stringify(r)).join(",") + "];\n";
  await writeFile(SOCAL_PACK, `${head}${metaSrc}\n${classSrc}\n${rowsSrc}`);
}

async function writeChey() {
  const src = await readFile(CHEY_PACK, "utf8");
  const serialRow = ([name, lon, lat, cls]) => `    [${JSON.stringify(name)}, ${lon}, ${lat}, ${JSON.stringify(cls)}],`;
  const originals = mergedAnge.slice(0, ange.length);
  const appended = mergedAnge.slice(ange.length);
  const block =
    `export const GAZETTEER = {\n  chey: [\n` +
    GAZETTEER.chey.map(serialRow).join("\n") +
    `\n  ],\n  ange: [\n` +
    originals.map(serialRow).join("\n") +
    (appended.length
      ? `\n    /* rows below were synced from the socal-subsurface register by scripts/sync-gazetteer.mjs on ${SYNC_DATE} */\n` +
        appended.map(serialRow).join("\n")
      : "") +
    `\n  ],\n};`;
  const re = /export const GAZETTEER = \{[\s\S]*?\n\};/;
  if (!re.test(src)) throw new Error("GAZETTEER block not found in cheyenne-data.js");
  await writeFile(CHEY_PACK, src.replace(re, block));
}

const doc = report();
if (WRITE) {
  await writeSocal();
  await writeChey();
  await writeFile(path.join(root, "docs", `gazetteer-sync-${SYNC_DATE}.md`), doc + "\n");
  console.log(`synced: socal ${GAZ_ROWS.length} → ${mergedSocal.length} rows; ange ${GAZETTEER.ange.length} → ${mergedAnge.length} rows; ${conflicts.length} conflicts reconciled.`);
  console.log(`report: docs/gazetteer-sync-${SYNC_DATE}.md`);
} else {
  console.log(doc);
}
