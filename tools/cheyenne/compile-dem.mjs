#!/usr/bin/env node
/**
 * Compile raw USGS 3DEP getSamples responses (tools/cheyenne/raw/*.json) into
 * js/cheyenne-dem-data.js — the control-point DEM shipped with the app.
 *
 * Every elevation below is a real value returned by the USGS 3DEP ImageServer
 * `getSamples` operation (1 m products, NAVD 88) for the exact coordinate
 * shown; nothing here is hand-estimated. The interpolation between control
 * points lives in js/cheyenne-dem.js and is honest about being interpolation.
 *
 *   node tools/cheyenne/compile-dem.mjs
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const rawDir = path.join(root, "tools", "cheyenne", "raw");
const read = async (f) => JSON.parse(await readFile(path.join(rawDir, f), "utf8"));

/* ---------------------------------------------------------------- helpers */
const dens = (pathPts, n) => {
  const segs = [];
  let total = 0;
  for (let i = 0; i < pathPts.length - 1; i++) {
    const L = Math.hypot(pathPts[i + 1][0] - pathPts[i][0], pathPts[i + 1][1] - pathPts[i][1]);
    segs.push(L);
    total += L;
  }
  const pts = [];
  for (let k = 0; k < n; k++) {
    const dTarget = (k / (n - 1)) * total;
    let d = 0;
    for (let i = 0; i < segs.length; i++) {
      if (dTarget <= d + segs[i]) {
        const t = (dTarget - d) / segs[i];
        pts.push([
          +(pathPts[i][0] + (pathPts[i + 1][0] - pathPts[i][0]) * t).toFixed(6),
          +(pathPts[i][1] + (pathPts[i + 1][1] - pathPts[i][1]) * t).toFixed(6),
        ]);
        break;
      }
      d += segs[i];
    }
  }
  return pts;
};

/* ------------------------------------------------- CHEYENNE input layouts */
const cLon = [-105.23, -105.135, -105.04, -104.945, -104.85, -104.755, -104.66];
const cLat = [38.63, 38.72, 38.81, 38.90, 38.99, 39.08];
const cGrid = [];
for (const la of cLat) for (const lo of cLon) cGrid.push([lo, la]);

const cMassifNames = [
  "Pikes Peak", "Devils Playground area", "Almagre Mountain", "Mount Rosa", "Cameron Cone",
  "Mount Garfield", "Mount Arthur", "Mount Cutler", "Mount Buckhorn", "Saint Peters Dome",
  "Sugarloaf Mountain", "Mount Vigil", "Cheyenne Mountain summit", "Cheyenne Mountain west high point",
  "Blodgett Peak", "Mount Manitou", "Pikes Peak east slope", "Pikes Peak west slope",
];
const cMassif = [
  [-105.0449, 38.8406], [-105.0608, 38.8635], [-104.9935, 38.7912], [-104.9480, 38.7542], [-104.9545, 38.8315],
  [-104.9475, 38.8076], [-104.9419, 38.8094], [-104.8775, 38.7878], [-104.9031, 38.8002], [-104.9115, 38.7474],
  [-104.9149, 38.7333], [-104.9221, 38.7267], [-104.8675, 38.7440], [-104.8806, 38.7371], [-104.9071, 38.9588],
  [-104.9637, 38.8646], [-105.0449, 38.8286], [-105.0249, 38.8406],
];

const cPlaceNames = [
  "Cheyenne Mountain Complex (NORAD)", "Cheyenne Mountain State Park", "Garden of the Gods",
  "Manitou Springs", "Colorado Springs downtown", "US Air Force Academy", "Peterson SFB",
  "Fort Carson", "Schriever SFB", "Cripple Creek", "Victor", "Goldfield", "Woodland Park",
  "Green Mountain Falls", "Cascade", "Monument", "Crystal Creek Reservoir", "Rampart Reservoir",
  "Mueller State Park", "Fountain", "Mollie Kathleen mine area",
];
const cPlaces = [
  [-104.8483, 38.7425], [-104.8540, 38.7560], [-104.8792, 38.8603], [-104.9129, 38.8575], [-104.8209, 38.8339],
  [-104.8660, 38.9980], [-104.6981, 38.8352], [-104.7725, 38.7410], [-104.5330, 38.9430], [-105.1850, 38.7466],
  [-105.1419, 38.7087], [-105.1270, 38.7240], [-105.0594, 38.9985], [-105.0238, 38.9344], [-104.9750, 38.9086],
  [-104.8474, 39.0728], [-105.0306, 38.9162], [-104.9700, 38.9808], [-105.1798, 38.9571], [-104.7005, 38.8288],
  [-105.1630, 38.7467],
];

const c7c8c9Names = [
  "North Cheyenne Canyon mouth", "North Cheyenne Canyon", "North Cheyenne Canyon head",
  "South Cheyenne Canyon divide", "South Cheyenne Canyon", "South Cheyenne Canyon mid", "South Cheyenne Canyon mouth",
  "Ute Pass (Manitou)", "Ute Pass (Cascade)", "Ute Pass (Green Mountain Falls)", "Ute Pass (Woodland Park)",
  "Cripple Creek town", "Victor town", "Goldfield", "Mollie Kathleen area", "Copper Mountain",
];
const c7c8c9 = [
  [-104.8643, 38.7907], [-104.890, 38.792], [-104.9145, 38.7867], [-104.9045, 38.778], [-104.8992, 38.766],
  [-104.880, 38.772], [-104.8638, 38.7905], [-104.9129, 38.8575], [-104.975, 38.909], [-105.0238, 38.9344],
  [-105.0594, 38.9985], [-105.185, 38.7466], [-105.1419, 38.7087], [-105.127, 38.724], [-105.163, 38.756], [-105.1836, 38.7795],
];
const cFountain = [
  [-104.847, 39.073], [-104.821, 38.98], [-104.821, 38.89], [-104.821, 38.834], [-104.75, 38.79], [-104.70, 38.75], [-104.70, 38.70],
];

/* -------------------------------------------------- ANGELES input layouts */
const aLon = [-118.33, -118.2033, -118.0767, -117.95, -117.8233, -117.6967, -117.57];
const aLat = [33.97, 34.0633, 34.1567, 34.25, 34.3433, 34.4367, 34.53];
const aGrid = [];
for (const la of aLat) for (const lo of aLon) aGrid.push([lo, la]);

const aCrestNames = [
  "Mount Wilson", "San Gabriel Peak", "Mount Disappointment", "Occidental Peak", "Strawberry Peak",
  "Josephine Peak", "Red Box Gap", "Vetter Mountain", "Pacifico Mountain", "Mill Creek Summit",
  "Monrovia Peak", "Crystal Lake", "Islip Saddle", "Mount Islip", "Throop Peak",
  "Mount Hawkins", "Mount Burnham", "Mount Baden-Powell", "Vincent Gap", "Ross Mountain",
  "Iron Mountain", "Pine Mountain", "Dawson Peak", "Mount San Antonio (Baldy)", "Mount Harwood",
  "Cucamonga Peak", "Three Points area", "Mount Gleason",
];
const aCrest = [
  [-118.0616, 34.2237], [-118.0985, 34.2433], [-118.1048, 34.2467], [-118.0836, 34.2350], [-118.1204, 34.2834],
  [-118.1538, 34.2856], [-118.1051, 34.2586], [-118.0286, 34.2971], [-118.0345, 34.3818], [-118.0809, 34.3917],
  [-117.9695, 34.2132], [-117.8471, 34.3188], [-117.8506, 34.3569], [-117.8399, 34.3450], [-117.7991, 34.3505],
  [-117.8056, 34.3412], [-117.7814, 34.3592], [-117.7646, 34.3586], [-117.7523, 34.3736], [-117.7565, 34.3247],
  [-117.7133, 34.2883], [-117.6442, 34.3136], [-117.6359, 34.3032], [-117.6461, 34.2891], [-117.6330, 34.2863],
  [-117.5853, 34.2227], [-118.0209, 34.3717], [-118.1781, 34.3866],
];

const aPlaceNames = [
  "Bridge to Nowhere", "East Fork trailhead", "Heaton Flat", "Stanley-Miller Mine (west face Iron Mountain)",
  "Allison Mine (MRDS)", "Big Horn Mine (MRDS)", "Gold Dollar Mine (MRDS)", "Native Son Mine (MRDS)",
  "Acton district mines", "Mount Gleason", "Crystal Lake campground", "Chilao campground",
  "Table Mountain campground", "Manker Flat campground", "Spruce Grove trail camp",
  "Azusa", "San Dimas", "Rancho Cucamonga", "Pasadena", "Acton",
  "Wrightwood", "Sylmar", "Palmdale-side desert floor", "Big Tujunga canyon mid",
];
const aPlaces = [
  [-117.74667, 34.28306], [-117.7650, 34.2370], [-117.7631, 34.2406], [-117.732, 34.290], [-117.7281, 34.2714],
  [-117.7445, 34.3567], [-117.6984, 34.2872], [-117.6912, 34.3397], [-118.2176, 34.4000], [-118.1781, 34.3866],
  [-117.8530, 34.3230], [-118.0260, 34.3260], [-117.6820, 34.3680], [-117.6560, 34.2840], [-117.7710, 34.2460],
  [-117.9076, 34.1283], [-117.8067, 34.1067], [-117.5931, 34.1064], [-118.1445, 34.1478], [-118.1965, 34.4690],
  [-117.5975, 34.3608], [-118.3460, 34.2090], [-117.9300, 34.4100], [-118.1130, 34.3430],
];

const aCrestLine1 = dens([[-118.476, 34.28], [-118.35, 34.265], [-118.25, 34.26], [-118.15, 34.26], [-118.0616, 34.2237], [-118.0985, 34.2433], [-118.1204, 34.2834], [-118.08, 34.32], [-118.0345, 34.3818]], 12);
const aCrestLine2 = dens([[-118.0345, 34.3818], [-118.0, 34.36], [-117.94, 34.36], [-117.8399, 34.345], [-117.7646, 34.3586], [-117.730, 34.380], [-117.63, 34.335], [-117.616, 34.328], [-117.6461, 34.2891], [-117.60, 34.25], [-117.5853, 34.2227]], 14);
const aEastFork = dens([[-117.9076, 34.1283], [-117.88, 34.18], [-117.84, 34.21], [-117.774, 34.228], [-117.7631, 34.2406], [-117.755, 34.26], [-117.74667, 34.28306], [-117.735, 34.29], [-117.725, 34.30]], 11);
const aBigTuj = dens([[-118.30, 34.25], [-118.24, 34.26], [-118.16, 34.27], [-118.09, 34.265], [-118.045, 34.255], [-117.99, 34.255], [-117.955, 34.258], [-117.93, 34.245]], 8);
const aFloors = [
  [-117.90, 34.51], [-117.75, 34.52], [-117.62, 34.51], [-118.10, 34.50], [-117.87, 34.02], [-117.75, 34.03],
  [-117.62, 34.05], [-118.10, 34.04], [-118.20, 34.05], [-118.31, 34.13], [-118.28, 34.34], [-117.60, 34.16],
];

/* -------------------------------------------------------------- assembly */
function byId(raw, points, names, group) {
  const out = [];
  const map = new Map(raw.samples.map((s) => [s.locationId, s.value]));
  points.forEach((p, i) => {
    const v = map.get(i);
    if (v == null) throw new Error(`missing locationId ${i} in batch ${group}`);
    out.push({ lon: p[0], lat: p[1], elev: Math.round(parseFloat(v) * 10) / 10, name: names?.[i] ?? group, group });
  });
  return out;
}
function direct(raw, group) {
  return raw.samples.map((s) => ({ lon: s.lon, lat: s.lat, elev: Math.round(s.value * 10) / 10, name: group, group }));
}

const chey = [
  ...byId(await read("C1-grid.json"), cGrid, null, "grid"),
  ...byId(await read("C2-massif.json"), cMassif, cMassifNames, "massif"),
  ...byId(await read("C3-places.json"), cPlaces, cPlaceNames, "places"),
  ...direct(await read("C4-loop.json"), "Pikes massif ridge loop"),
  ...direct(await read("C5-rampart.json"), "Rampart Range crest"),
  ...byId(await read("C6-fountain.json"), cFountain, null, "Fountain Creek corridor"),
  ...byId(await read("C7C8C9.json"), c7c8c9, c7c8c9Names, "canyons"),
];
const ange = [
  ...byId(await read("A1-grid.json"), aGrid, null, "grid"),
  ...byId(await read("A2-crest.json"), aCrest, aCrestNames, "crest"),
  ...byId(await read("A3-places.json"), aPlaces, aPlaceNames, "places"),
  ...byId(await read("A45-crestlines.json"), [...aCrestLine1, ...aCrestLine2], null, "San Gabriel crest"),
  ...byId(await read("A67-canyons.json"), [...aEastFork, ...aBigTuj], null, "East Fork + Big Tujunga canyons"),
  ...byId(await read("A8-floors.json"), aFloors, null, "valley + desert floors"),
];

/* Deduplicate near-identical coordinates (keep the named one). */
function dedupe(list) {
  const seen = new Map();
  for (const c of list) {
    const k = `${c.lon.toFixed(3)},${c.lat.toFixed(3)}`;
    const prev = seen.get(k);
    if (!prev || (prev.name === prev.group && c.name !== c.group)) seen.set(k, c);
  }
  return [...seen.values()];
}
const cheyD = dedupe(chey);
const angeD = dedupe(ange);

const fmt = (list) =>
  list
    .map((c) => `    [${c.lon.toFixed(4)}, ${c.lat.toFixed(4)}, ${c.elev.toFixed(1)}, ${JSON.stringify(c.name)}],`)
    .join("\n");

const out = `/**
 * js/cheyenne-dem-data.js — USGS 3DEP control points for both plates.
 *
 * GENERATED by tools/cheyenne/compile-dem.mjs — do not edit by hand.
 * Every value is a real USGS 3DEP 1-meter elevation (NAVD 88) returned by the
 * National Map's 3DEP ImageServer \`getSamples\` operation for the exact
 * coordinate paired with it (query log: tools/cheyenne/raw/*.json, fetched
 * 2026-10-02). Elevation *between* control points is interpolated in
 * js/cheyenne-dem.js — Shepard inverse-distance with a small fractal grain —
 * and is smooth by construction, not measured.
 *
 * Service: https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/getSamples
 * Products seen in responses include: CO_ArapahoRooseveltPikeNF_D23 (Pikes
 * massif), CA_LosAngeles_B23 (central San Gabriels), plus adjacent 1 m
 * FEMA/USGS projects covering the LA basin fringe and the high desert.
 */

export const DEM_META = {
  source: "USGS 3DEP 1 m DEM via ImageServer getSamples (NAVD 88)",
  method:
    "esriGeometryMultipoint / esriGeometryPolyline queries, returnFirstValueOnly=true, no pixelSize override",
  fetched: "2026-10-02",
  controlCounts: { chey: ${cheyD.length}, ange: ${angeD.length} },
  swapIn:
    "for a true raster DEM, download a 3DEP GeoTIFF and run gdal_translate -projwin W S E N on it, then replace this control set with a full grid",
};

export const DEM_CONTROL = {
  chey: {
    bbox: [-105.25, 38.6, -104.45, 39.1],
    control: [
${fmt(cheyD)}
    ],
  },
  ange: {
    bbox: [-118.50, 33.95, -117.55, 34.55],
    control: [
${fmt(angeD)}
    ],
  },
};

export default { DEM_META, DEM_CONTROL };
`;

await writeFile(path.join(root, "js", "cheyenne-dem-data.js"), out);
console.log(`cheyenne-dem-data.js: chey ${cheyD.length} pts, ange ${angeD.length} pts`);
