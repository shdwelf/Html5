#!/usr/bin/env node
/**
 * Build the parametric CITY SUBSURFACE apps from resources/city-subsurface/cities.json.
 *
 *   node scripts/build-city-subsurface.mjs                 # all cities
 *   node scripts/build-city-subsurface.mjs --city lawrence  # one city
 *
 * Outputs per city:
 *   <city>-subsurface.html                 root page
 *   js/city-subsurface-data-<city>.js      terrain / layers / corridors / nodes
 *   js/city-gazetteer-data-<city>.js       ADL GCS gazetteer rows + geocaches
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const configPath = path.join(root, "resources", "city-subsurface", "cities.json");
const templatePath = path.join(root, "resources", "city-subsurface-template.html");
const config = JSON.parse(await readFile(configPath, "utf8"));
const template = await readFile(templatePath, "utf8");

const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
};
const onlyCity = arg("--city");

const LAYERS = [
  { id: "terrain", name: "Terrain / city shell", color: "#3c5a70", kind: "surface", on: true },
  { id: "gazetteer", name: "Gazetteer · named features", color: "#b8c7d1", kind: "node", on: true },
  { id: "geocaches", name: "Geocaches · community source tier", color: "#f472b6", kind: "node", on: true },
  { id: "water", name: "Rivers / canals / shoreline", color: "#38bdf8", kind: "line", on: true },
  { id: "products", name: "Refined-product pipelines", color: "#f59e0b", kind: "line", on: true },
  { id: "crude", name: "Crude + gas trunk lines", color: "#ef4444", kind: "line", on: true },
  { id: "rail", name: "Rail corridors", color: "#a78bfa", kind: "line", on: true },
  { id: "power", name: "Power / utility nodes", color: "#22c55e", kind: "node", on: true },
  { id: "sites", name: "Sites + landmarks", color: "#f472b6", kind: "node", on: true },
  { id: "bases", name: "Federal / civic facilities", color: "#94a3b8", kind: "node", on: true },
  { id: "trails", name: "Trails / greenways", color: "#86efac", kind: "line", on: true },
  { id: "roads", name: "Roads / streetcar context", color: "#f97316", kind: "line", on: true },
  { id: "aviation", name: "Airports + heliports", color: "#fde047", kind: "node", on: true },
  { id: "harbors", name: "Harbors + marine terminals", color: "#0ea5e9", kind: "node", on: true },
  { id: "offshore", name: "Offshore / lake structures", color: "#fb7185", kind: "line", on: true },
  { id: "industry", name: "Industry / utilities", color: "#c084fc", kind: "node", on: true },
  { id: "underground", name: "Underground / tunnels / PATH", color: "#cbd5e1", kind: "line", on: true },
];

const TIER_COLOR = {
  official: "#ffb020",
  community: "#5cd6ff",
  context: "#ff6ec7",
  memory: "#ff6ec7",
};

function project(city, lon, lat) {
  const cosLat = Math.cos((city.center.lat * Math.PI) / 180);
  const x = (lon - city.center.lon) * 111.32 * cosLat * 0.1;
  const z = -(lat - city.center.lat) * 111.32 * 0.1;
  return [x, z];
}

function viewsFor(city) {
  const [x0, z0] = project(city, city.bbox.lon0, city.bbox.lat1);
  const [x1, z1] = project(city, city.bbox.lon1, city.bbox.lat0);
  const w = x1 - x0;
  const d = z1 - z0;
  return [
    { id: "overview", label: "VIEW · OVERVIEW", position: [0, 20, 32], target: [0, 0, 0] },
    { id: "downtown", label: "VIEW · DOWNTOWN", position: [0, 7, 10], target: [0, 0, 0] },
    { id: "underground", label: "VIEW · UNDERGROUND", position: [0, 4, 20], target: [0, -5, 0] },
    { id: "waterfront", label: "VIEW · WATERFRONT", position: [w * 0.22, 10, d * 0.22], target: [w * 0.22, 0, d * 0.22] },
  ];
}

function validateRows(cityId, city, rows) {
  const seen = new Set();
  rows.forEach((row, i) => {
    if (!Array.isArray(row) || row.length !== 10) {
      throw new Error(`${cityId}: gazetteer row ${i} must have 10 columns, got ${Array.isArray(row) ? row.length : typeof row}`);
    }
    const [name, fclass, ftt, county, lat, lon, elev, gnis, verified, note] = row;
    if (!name || !fclass || !ftt || !county) throw new Error(`${cityId}: row ${i} missing name/class/ftt/county`);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error(`${cityId}: row ${i} bad coordinates`);
    if (lat < city.bbox.lat0 || lat > city.bbox.lat1 || lon < city.bbox.lon0 || lon > city.bbox.lon1) {
      throw new Error(`${cityId}: row ${i} (${name}) is outside the city bbox`);
    }
    if (verified === 1 && !/^\d+$/.test(String(gnis))) {
      throw new Error(`${cityId}: row ${i} (${name}) is verified but has no numeric GNIS id`);
    }
    if (verified !== 1 && gnis !== null) {
      throw new Error(`${cityId}: row ${i} (${name}) is unverified but carries a GNIS id`);
    }
    const key = `${name.toLowerCase()}|${fclass}`;
    if (seen.has(key)) throw new Error(`${cityId}: duplicate gazetteer row ${key}`);
    seen.add(key);
    void elev;
    void note;
  });
}

for (const [cityId, city] of Object.entries(config.cities)) {
  if (onlyCity && cityId !== onlyCity) continue;
  validateRows(cityId, city, city.gazetteerRows);

  const views = viewsFor(city);
  const dataModule = `/**
 * CITY SUBSURFACE — ${city.title} data pack.
 *
 * Generated by scripts/build-city-subsurface.mjs from
 * resources/city-subsurface/cities.json. Schematic city frame: corridors are
 * generalized context, not alignments; nodes are scene anchors, not surveyed
 * points. Call 811 before you touch dirt.
 */

export const CITY = ${JSON.stringify({
    id: cityId,
    title: city.title,
    subtitle: city.subtitle,
    state: city.state,
    country: city.country,
    county: city.county,
    baseElevationM: city.baseElevationM,
    roughnessM: city.roughnessM,
    hasWater: city.hasWater,
  }, null, 2)};

export const BBOX = ${JSON.stringify(city.bbox)};
export const CENTER = ${JSON.stringify(city.center)};
export const KM_PER_DEG_LAT = 111.32;
export const UNITS_PER_KM = 0.1;
export const COAST = ${JSON.stringify(city.coast)};
export const RELIEF = ${JSON.stringify(city.relief, null, 2)};
export const LAYERS = ${JSON.stringify(LAYERS, null, 2)};
export const TIER_COLOR = ${JSON.stringify(TIER_COLOR, null, 2)};
export const CORRIDORS = ${JSON.stringify(city.corridors, null, 2)};
export const NODES = ${JSON.stringify(city.nodes, null, 2)};
export const VIEWS = ${JSON.stringify(views, null, 2)};
`;

  const rows = city.gazetteerRows;
  const classes = [...new Set(rows.map((r) => r[1]))].sort();
  const verified = rows.filter((r) => r[8] === 1).length;
  const gazModule = `/**
 * CITY SUBSURFACE — ${city.title} gazetteer pack.
 *
 * Generated by scripts/build-city-subsurface.mjs. Row shape (ADL GCS triple):
 * [name, fclass, ftt, county, lat, lon, elevM|null, gnisId|null, verified 0|1, note|null]
 *
 * USGS GNIS factual data is a US government work (17 USC 105). Geocache rows
 * are community-source records under the repository's community.geocache
 * extension and are never represented as GNIS features.
 */

export const GAZ_META = ${JSON.stringify({
    generated: config.generated,
    source: config.sourceNote,
    crs: "EPSG:4326",
    bbox: city.bbox,
    rowCount: rows.length,
    verified,
    unverified: rows.length - verified,
    license:
      "GNIS/USBGN factual data: USGS, US government work (17 USC 105). Geocaches: public Geocaching.com listing text, community tier. City landmarks: curated public-source coordinates.",
    regen: "node scripts/build-city-subsurface.mjs",
  }, null, 2)};

export const GAZ_CLASSES = ${JSON.stringify(classes)};

/** [name, fclass, ftt, county, lat, lon, elevM|null, gnisId|null, verified 0|1, note|null] */
export const GAZ_ROWS = ${JSON.stringify(rows)};
`;

  const html = template
    .replaceAll("{{TITLE}}", city.title)
    .replaceAll("{{DESCRIPTION}}", `${city.title} — ${city.subtitle}. Schematic city subsurface theater with an offline gazetteer and geocache source tier.`)
    .replaceAll("{{CITY}}", cityId)
    .replaceAll("{{SUBTITLE}}", city.subtitle)
    .replaceAll("{{GAZ_TITLE}}", city.gazTitle)
    .replaceAll("{{GAZ_NOTE}}", city.gazNote);

  await writeFile(path.join(root, `${cityId}-subsurface.html`), html);
  await writeFile(path.join(root, "js", `city-subsurface-data-${cityId}.js`), dataModule);
  await writeFile(path.join(root, "js", `city-gazetteer-data-${cityId}.js`), gazModule);
  console.log(`built ${cityId}: ${rows.length} gazetteer rows (${verified} verified), ${city.corridors.length} corridors, ${city.nodes.length} nodes`);
}
