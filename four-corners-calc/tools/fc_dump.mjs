/* fc_dump.mjs — read the data pack out of an unpacked four-corners.xdc.
 *
 * The .xdc is a webxdc bundle: a zip of ES modules. Rather than re-typing or
 * regex-scraping the data, xdc2c.py unpacks the zip and runs THIS script, which
 * imports the app's own modules and prints JSON. Gazetteer elevations the data
 * pack leaves null, the corridor lengths and the elevation fixture below are
 * produced by the app's own js/four-corners-geo.js, so the calculator port is
 * derived from the app, not from a copy of it.
 *
 * Usage:  node fc_dump.mjs <unpacked-xdc-dir>
 */
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const root = resolve(process.argv[2] ?? ".");
const mod = (p) => import(pathToFileURL(resolve(root, p)).href);

const D = await mod("js/four-corners-data.js");
const G = await mod("js/four-corners-geo.js");

/* A deterministic lon/lat lattice across the frame, evaluated with the app's
   own elevAt(). The C port has to reproduce this field with integers only;
   four-corners-calc/host/tests.c checks it against this fixture. */
function elevationFixture() {
  const out = [];
  const { lon0, lon1, lat0, lat1 } = D.META.bbox;
  const NX = 17;
  const NY = 13;
  for (let j = 0; j < NY; j++) {
    for (let i = 0; i < NX; i++) {
      const lon = lon0 + ((lon1 - lon0) * i) / (NX - 1);
      const lat = lat0 + ((lat1 - lat0) * j) / (NY - 1);
      out.push([Number(lon.toFixed(6)), Number(lat.toFixed(6)), Math.round(G.elevAt(lon, lat))]);
    }
  }
  return out;
}

/* The two state lines are synthetic corridors: the app drapes them over the
   terrain at 0.02° steps for the 3D scene, but legally they are straight lines
   through the SURVEYED quadripoint, so the calculator keeps exactly that —
   two vertices each, official tier, and the dossier carries the note. */
function borderCorridors() {
  const { lon0, lon1, lat0, lat1 } = D.META.bbox;
  const ns = [[D.BORDERS.quadLon, lat0], [D.BORDERS.quadLon, lat1]];
  const ew = [[lon0, D.BORDERS.quadLat], [lon1, D.BORDERS.quadLat]];
  return [
    { id: "line-ns", layer: "borders", tier: "official", name: "N-S state line thru surveyed quadripoint", path: ns, km: G.pathKm(ns) },
    { id: "line-ew", layer: "borders", tier: "official", name: "E-W state line thru surveyed quadripoint", path: ew, km: G.pathKm(ew) },
  ];
}

const payload = {
  generator: "fc_dump.mjs",
  title: D.META.title,
  subtitle: D.META.subtitle,
  bbox: D.META.bbox,
  center: D.META.center,
  quadripoint: D.META.quadripoint,
  kmPerDegLat: G.KM_PER_DEG_LAT,
  cosLat: G.COS_LAT,
  idwPower: G.IDW_POWER,
  idwSnapKm2: G.IDW_SNAP_KM2,
  layers: D.LAYERS.map((l) => ({ id: l.id, name: l.name, kind: l.kind, on: l.on !== false })),
  corridors: [
    ...borderCorridors(),
    {
      id: "san-juan-river", layer: "rivers", tier: "context",
      name: "San Juan River corridor (Farmington to Lake Powell)",
      path: D.SAN_JUAN_RIVER, km: G.pathKm(D.SAN_JUAN_RIVER),
    },
  ],
  nodes: D.SITES.map((s) => ({
    id: s.id, layer: s.layer, tier: s.tier, name: s.name, lon: s.lon, lat: s.lat,
    kind: s.kind ?? "site", depthM: s.depthM ?? 0, register: 0,
    elevM: s.elevM ?? G.elevAt(s.lon, s.lat), facts: s.story ?? [],
  })),
  register: D.GAZETTEER.map((row) => ({
    id: `gaz-${row[0]}`, layer: "gaz", tier: "community", name: row[0],
    lon: row[5], lat: row[4], kind: row[1], depthM: 0, register: 1,
    state: row[3], ftt: row[2],
    elevM: row[6] ?? G.elevAt(row[5], row[4]),
    facts: row[7] ? [row[7]] : [],
  })),
  terrainPoints: D.TERRAIN_POINTS,
  elevationFixture: elevationFixture(),
};

process.stdout.write(JSON.stringify(payload));
