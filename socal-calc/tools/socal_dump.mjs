/* socal_dump.mjs — read the data pack out of an unpacked socal-subsurface.xdc.
 *
 * The .xdc is a webxdc bundle: a zip of ES modules. Rather than re-typing or
 * regex-scraping the data, xdc2c.py unpacks the zip and runs THIS script, which
 * imports the app's own modules and prints JSON. The corridor lengths and the
 * elevation fixture below are produced by the app's own socal-geo.js functions,
 * so the calculator port is derived from the app, not from a copy of it.
 *
 * Usage:  node socal_dump.mjs <unpacked-xdc-dir>
 */
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { readFileSync } from "node:fs";

const root = resolve(process.argv[2] ?? ".");
const mod = (p) => import(pathToFileURL(resolve(root, p)).href);

const D = await mod("js/socal-subsurface-data.js");
const G = await mod("js/socal-geo.js");
const X = await mod("js/socal-sites-extended.js");

let O = null;
try {
  O = await mod("js/socal-overlays-data.js");
} catch {
  O = null;
}

/* socal-overlays.js owns fireRing(): an organic closed perimeter scaled so its
   planar area equals the published acreage. It pulls in three.js, which does
   import cleanly under node, so the calculator gets the app's real rings
   decimated to RING_STEPS vertices rather than a circle we invented. */
const RING_STEPS = 20;
let fireRing = null;
try {
  fireRing = (await mod("js/socal-overlays.js")).fireRing;
} catch {
  fireRing = null;
}

/* A deterministic lon/lat lattice across the frame, evaluated with the app's
   own elevationAt(). The C port has to reproduce this field with integers
   only; socal-calc/host/tests.c checks it against this fixture. */
function elevationFixture() {
  const out = [];
  const { lon0, lon1, lat0, lat1 } = D.BBOX;
  const NX = 17;
  const NY = 13;
  for (let j = 0; j < NY; j++) {
    for (let i = 0; i < NX; i++) {
      const lon = lon0 + ((lon1 - lon0) * i) / (NX - 1);
      const lat = lat0 + ((lat1 - lat0) * j) / (NY - 1);
      out.push([Number(lon.toFixed(6)), Number(lat.toFixed(6)), Math.round(G.elevationAt(lon, lat))]);
    }
  }
  return out;
}

const payload = {
  generator: "socal_dump.mjs",
  bbox: D.BBOX,
  center: D.CENTER,
  kmPerDegLat: D.KM_PER_DEG_LAT,
  unitsPerKm: D.UNITS_PER_KM,
  cosLat: G.COS_LAT,
  scale: { vert: G.scale.vert, depth: G.scale.depth },
  layers: D.LAYERS.map((l) => ({ id: l.id, name: l.name, kind: l.kind, on: l.on !== false })),
  relief: D.RELIEF.map((r) => ({
    name: r.name, lon: r.lon, lat: r.lat, rx: r.rx, ry: r.ry, amp: r.amp, rot: r.rot || 0,
  })),
  coast: D.COAST,
  corridors: D.CORRIDORS.map((c) => ({
    id: c.id, layer: c.layer, tier: c.tier, name: c.name, short: c.short ?? "",
    depthM: c.depthM ?? 0, tunnelFraction: c.tunnelFraction ?? 0,
    path: c.path, km: G.pathKm(c.path), facts: c.facts ?? [], sources: c.sources ?? [],
  })),
  nodes: D.NODES.map((n) => ({
    id: n.id, layer: n.layer, tier: n.tier, name: n.name, lon: n.lon, lat: n.lat,
    kind: n.kind ?? "site", depthM: n.depthM ?? 0, facts: n.facts ?? [], sources: n.sources ?? [],
  })),
  offFrame: (X.OFF_FRAME ?? []).map((o) => ({ id: o.id, name: o.name, lon: o.lon, lat: o.lat })),
  /* The elevation field's constants live inside a function body, not in an
     export. xdc2c.py lifts them out of this text so the C field stays pinned
     to the bundle instead of to numbers someone once copied by hand. */
  geoSource: readFileSync(resolve(root, "js/socal-geo.js"), "utf8"),
  ringSteps: RING_STEPS,
  ringSource: fireRing ? "socal-overlays.js fireRing()" : "none",
  fires: (O?.FIRES ?? []).map((f) => ({
    id: f.id, name: f.name, year: f.year, acres: f.acres, lon: f.lon, lat: f.lat,
    aspect: f.aspect ?? 1, rot: f.rot ?? 0, agency: f.agency ?? "",
    ring: fireRing ? fireRing(f, RING_STEPS) : [],
  })),
  acreKm2: O?.ACRE_KM2 ?? 0.00404685642,
  deformation: (O?.DEFORMATION ?? []).map((d) => ({
    id: d.id, name: d.name, lon: d.lon, lat: d.lat, radiusKm: d.radiusKm,
  })),
  sarSwaths: (O?.SAR_SWATHS ?? []).map((s) => ({ id: s.id, name: s.name, widthKm: s.widthKm })),
  cluiCaptions: (O?.CLUI_CAPTIONS ?? []).map((c) => ({ id: c.id, title: c.title, lon: c.lon, lat: c.lat })),
  elevationFixture: elevationFixture(),
};

process.stdout.write(JSON.stringify(payload));
