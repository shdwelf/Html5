/**
 * SOCAL SUBSURFACE 4Dwm — Southern California basin, underground infrastructure theater.
 *
 * Renders a generalized terrain shell for the SoCal / Mojave / San Joaquin
 * transect and hangs the buried systems under it: aqueducts, refined-product
 * and crude/gas trunk lines, geothermal wellfields, plus the surface rail
 * corridors and the sites that anchor the story.
 *
 * Schematic. Not a survey. Not a dig ticket. Call 811.
 */

import * as THREE from "../vendor/three.module.min.js";
import { OrbitControls } from "../vendor/OrbitControls.js";
import {
  BBOX,
  CENTER,
  COAST,
  CORRIDORS,
  KM_PER_DEG_LAT,
  LAYERS,
  NODES,
  TIER_COLOR,
} from "./socal-subsurface-data.js";
import {
  COS_LAT,
  demInfo,
  depthY,
  elevY,
  elevationAt,
  installDem,
  lonLatFromXZ,
  pathKm,
  project,
  scale,
} from "./socal-geo.js";
import { buildRadio, emitterPath } from "./socal-radio.js";
import { BANDS, EMITTERS, RADIO_SITES, RADIO_SOURCE_URLS, SITE_BY_ID } from "./socal-radio-data.js";
import { fresnelRadiusM, earthBulgeM, serviceThresholdDbu } from "./socal-propagation.js";
import { makeReliefMap } from "./socal-relief.js";
import { buildUtilities } from "./socal-utilities.js";
import { LONGLINES, SUBSTATIONS, TRANSMISSION, UTILITY_SOURCE_URLS } from "./socal-utilities-data.js";
import { ORBITAL_SOURCE_URLS, SATELLITES, SAT_BY_ID, formatHours, nextWindows, trackGeometry } from "./socal-orbital.js";
import { buildOverlays } from "./socal-overlays.js";
import { FIRE_SOURCE_URLS } from "./socal-overlays-data.js";
import { OFF_FRAME } from "./socal-sites-extended.js";
import { GAZ_META, GAZ_ROWS } from "./socal-gazetteer-data.js";
import {
  GAZ_CLASS_META,
  GAZ_FACETS,
  classRollup,
  makeGazetteerIndex,
  searchBox,
  searchName,
} from "./socal-gazetteer.js";

const $ = (id) => document.getElementById(id);

/* ------------------------------------------------------------------ guards */

const canvas = $("stage");
const gl = canvas && (canvas.getContext("webgl2") || canvas.getContext("webgl"));
if (!gl) {
  const fb = document.createElement("div");
  fb.className = "fallback";
  fb.textContent = "WebGL is unavailable in this webview, so the 3D basin cannot render.";
  document.body.append(fb);
  throw new Error("no-webgl");
}

/* --------------------------------------------------------------- the DEM */

/**
 * If a real USGS 3DEP grid has been generated into js/socal-dem-grid.js (see
 * scripts/fetch-3dep-dem.py), install it before anything samples the surface.
 * Terrain mesh, corridors, fire rings, radio propagation and the relief map
 * all go through elevationAt(), so one import swaps the whole theater from a
 * synthetic gaussian field to 1/3 arc-second measured ground.
 *
 * The file is intentionally absent from the repo: it is a large binary asset
 * and this app ships offline. Absent, the catch keeps the synthetic field.
 */
let demStatus = "synthetic relief field (RELIEF gaussians)";
try {
  const mod = await import("./socal-dem-grid.js");
  const grid = mod.DEM ?? mod.default;
  if (grid && installDem({ ...grid, data: grid.data instanceof Int16Array || grid.data instanceof Float32Array ? grid.data : Int16Array.from(grid.data) })) {
    const info = demInfo();
    demStatus = `USGS 3DEP grid ${info.nx}×${info.ny} · ${info.resolution} · cell ≈ ${info.cellKm.toFixed(2)} km · retrieved ${info.retrieved}`;
  }
} catch {
  /* no DEM asset present — the synthetic field stands in, as documented */
}

/* ------------------------------------------------------------- projection */

// Projection, elevation field and vertical-scale state now live in
// js/socal-geo.js so the overlay pack drapes on exactly the same surface.
/* ------------------------------------------------------------------ scene */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05080d);
const FOG = new THREE.Fog(0x05080d, 60, 190);
scene.fog = FOG;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));

const camera = new THREE.PerspectiveCamera(48, 1, 0.5, 800);
camera.position.set(18, 30, 46);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI * 0.495;
controls.minDistance = 3;
controls.maxDistance = 160;
controls.target.set(0, 0, 2);

scene.add(new THREE.HemisphereLight(0x7fb2d9, 0x0a1118, 0.9));
const key = new THREE.DirectionalLight(0xfff0d8, 1.0);
key.position.set(-40, 60, 30);
scene.add(key);

const world = new THREE.Group();
scene.add(world);

const groups = {};
for (const l of LAYERS) {
  const g = new THREE.Group();
  g.name = l.id;
  groups[l.id] = g;
  world.add(g);
}

/* ---------------------------------------------------------------- terrain */

const SEG_X = 190;
const SEG_Y = 150;
const [X0, Z0] = project(BBOX.lon0, BBOX.lat1);
const [X1, Z1] = project(BBOX.lon1, BBOX.lat0);
const W = X1 - X0;
const D = Z1 - Z0;

const terrainGeo = new THREE.PlaneGeometry(W, D, SEG_X, SEG_Y);
terrainGeo.rotateX(-Math.PI / 2);
terrainGeo.translate(X0 + W / 2, 0, Z0 + D / 2);

const posAttr = terrainGeo.attributes.position;
const elevM = new Float32Array(posAttr.count);
const colors = new Float32Array(posAttr.count * 3);
const c = new THREE.Color();

for (let i = 0; i < posAttr.count; i++) {
  const x = posAttr.getX(i);
  const z = posAttr.getZ(i);
  const [lon, lat] = lonLatFromXZ(x, z);
  const e = elevationAt(lon, lat);
  elevM[i] = e;
  posAttr.setY(i, elevY(e));
  // Hypsometric ramp: ocean → basin floor → alluvium → ridge → snowline.
  if (e < 0) c.setHSL(0.58, 0.55, 0.12 + Math.max(-0.08, e / 9000));
  else if (e < 300) c.setHSL(0.33 - e / 4000, 0.3, 0.2 + e / 3000);
  else if (e < 1200) c.setHSL(0.11, 0.35, 0.24 + e / 5200);
  else if (e < 2200) c.setHSL(0.07, 0.22, 0.34 + e / 9000);
  else c.setHSL(0.6, 0.06, 0.62);
  colors[i * 3] = c.r;
  colors[i * 3 + 1] = c.g;
  colors[i * 3 + 2] = c.b;
}
terrainGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
terrainGeo.computeVertexNormals();

const terrainMat = new THREE.MeshStandardMaterial({
  vertexColors: true,
  roughness: 0.96,
  metalness: 0.02,
  flatShading: false,
  transparent: false,
  opacity: 1,
});
const terrain = new THREE.Mesh(terrainGeo, terrainMat);
groups.terrain.add(terrain);

const wire = new THREE.Mesh(
  terrainGeo,
  new THREE.MeshBasicMaterial({ color: 0x1d4a68, wireframe: true, transparent: true, opacity: 0.16 }),
);
wire.visible = false;
groups.terrain.add(wire);

// Sea plane so the shelf reads as water.
const sea = new THREE.Mesh(
  new THREE.PlaneGeometry(W, D).rotateX(-Math.PI / 2).translate(X0 + W / 2, elevY(0), Z0 + D / 2),
  new THREE.MeshStandardMaterial({ color: 0x08283c, transparent: true, opacity: 0.72, roughness: 0.35 }),
);
groups.terrain.add(sea);

// Coastline ribbon.
{
  const pts = COAST.map(([lon, lat]) => {
    const [x, z] = project(lon, lat);
    return new THREE.Vector3(x, elevY(40) + 0.05, z);
  });
  const g = new THREE.BufferGeometry().setFromPoints(pts);
  groups.terrain.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0x4fd0ff, transparent: true, opacity: 0.55 })));
}

// Subsurface reference grid — the "underground" volume the pipes live in.
const subGrid = new THREE.GridHelper(Math.max(W, D), 28, 0x1a3346, 0x11212e);
subGrid.position.y = depthY(-3000);
subGrid.material.transparent = true;
subGrid.material.opacity = 0.35;
groups.terrain.add(subGrid);

/* -------------------------------------------------------------- corridors */

const PICKABLE = [];

function resample(path, step = 0.05) {
  const out = [];
  for (let i = 0; i < path.length - 1; i++) {
    const [aLon, aLat] = path[i];
    const [bLon, bLat] = path[i + 1];
    const d = Math.hypot(bLon - aLon, bLat - aLat);
    const n = Math.max(2, Math.ceil(d / step));
    for (let k = 0; k < n; k++) {
      const t = k / n;
      out.push([aLon + (bLon - aLon) * t, aLat + (bLat - aLat) * t]);
    }
  }
  out.push(path[path.length - 1]);
  return out;
}

function corridorPoints(item) {
  return resample(item.path).map(([lon, lat]) => {
    const [x, z] = project(lon, lat);
    const surf = elevY(elevationAt(lon, lat));
    const y = item.depthM === 0 ? surf + 0.06 : surf + depthY(item.depthM);
    return new THREE.Vector3(x, y, z);
  });
}

/** Tube radius by class: aqueducts read heaviest, footpaths lightest. */
function corridorRadius(item) {
  if (item.layer === "water") return 0.16;
  if (item.layer === "rail") return 0.11;
  if (item.layer === "trails") return 0.05;
  if (item.layer === "roads") return 0.07;
  if (item.layer === "offshore") return 0.085;
  return 0.1;
}

const corridorMeshes = [];
const FLOW = [];

for (const item of CORRIDORS) {
  const layer = LAYERS.find((l) => l.id === item.layer);
  const pts = corridorPoints(item);
  const curve = new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.15);
  const radius = corridorRadius(item);
  const geo = new THREE.TubeGeometry(curve, Math.min(600, pts.length * 3), radius, 7, false);
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(layer.color),
    emissive: new THREE.Color(layer.color).multiplyScalar(0.28),
    roughness: 0.4,
    metalness: 0.3,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.userData = { record: item, kind: "corridor" };
  groups[item.layer].add(mesh);
  PICKABLE.push(mesh);
  corridorMeshes.push({ item, mesh, curve });

  // Flow pip: a bead that runs the line in the direction of load. Used on the
  // lines that pump uphill out of the basin through Cajon.
  if (item.flow) {
    const bead = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 2.1, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
    );
    bead.userData = { record: item, kind: "flow" };
    groups[item.layer].add(bead);
    FLOW.push({ item, bead, get curve() { return corridorMeshes.find((c) => c.item === item).curve; } });
  }

  // Hangers: vertical ties from the buried line up to the ground surface, so
  // depth is legible instead of implied.
  if (item.depthM < 0) {
    const tie = [];
    for (let i = 0; i < pts.length; i += Math.max(4, Math.floor(pts.length / 22))) {
      const p = pts[i];
      const [lon, lat] = lonLatFromXZ(p.x, p.z);
      tie.push(p.clone(), new THREE.Vector3(p.x, elevY(elevationAt(lon, lat)), p.z));
    }
    const tg = new THREE.BufferGeometry().setFromPoints(tie);
    const tl = new THREE.LineSegments(
      tg,
      new THREE.LineBasicMaterial({ color: new THREE.Color(layer.color), transparent: true, opacity: 0.28 }),
    );
    groups[item.layer].add(tl);
  }
}

/* ------------------------------------------------------------------ nodes */


function nodeHeadGeometry(kind) {
  switch (kind) {
    case "gazetteer":
      return new THREE.OctahedronGeometry(0.09, 0);
    case "geothermal":
      return new THREE.OctahedronGeometry(0.2);
    case "oil":
      return new THREE.ConeGeometry(0.17, 0.34, 5);
    case "platform":
      return new THREE.CylinderGeometry(0.16, 0.11, 0.42, 4);
    case "airport":
      return new THREE.BoxGeometry(0.42, 0.075, 0.18);
    case "heliport":
      return new THREE.TorusGeometry(0.17, 0.03, 8, 24).rotateX(Math.PI / 2);
    case "harbor":
      return new THREE.TorusKnotGeometry(0.12, 0.035, 40, 6);
    case "factory":
      return new THREE.BoxGeometry(0.26, 0.26, 0.26);
    case "resort":
      return new THREE.IcosahedronGeometry(0.18, 0);
    case "lake":
      return new THREE.SphereGeometry(0.18, 12, 8).scale(1.25, 0.65, 1.25);
    case "base":
      return new THREE.BoxGeometry(0.26, 0.26, 0.26);
    case "first":
      return new THREE.TorusKnotGeometry(0.13, 0.045, 48, 8);
    case "mine":
      return new THREE.TetrahedronGeometry(0.21);
    case "ghost":
      return new THREE.DodecahedronGeometry(0.17);
    case "rcs":
      return new THREE.TorusGeometry(0.16, 0.035, 8, 20).rotateX(Math.PI / 2);
    case "memory":
      return new THREE.OctahedronGeometry(0.16, 0);
    default:
      return new THREE.SphereGeometry(0.17, 14, 10);
  }
}

const nodeMeshes = [];

for (const node of NODES) {
  const layer = LAYERS.find((l) => l.id === node.layer);
  const [x, z] = project(node.lon, node.lat);
  const surf = elevY(elevationAt(node.lon, node.lat));
  const g = new THREE.Group();
  g.position.set(x, surf, z);

  const color = new THREE.Color(node.kind === "gazetteer" ? layer.color : TIER_COLOR[node.tier] || layer.color);
  const isGazetteer = node.kind === "gazetteer";
  const mastHeight = isGazetteer ? 0.24 : 0.9;

  // Mast + head: GNIS controls stay deliberately quiet beside infrastructure.
  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(isGazetteer ? 0.014 : 0.035, isGazetteer ? 0.014 : 0.035, mastHeight, 6),
    new THREE.MeshStandardMaterial({ color, emissive: color.clone().multiplyScalar(0.3), roughness: 0.5 }),
  );
  mast.position.y = mastHeight / 2;
  g.add(mast);

  const headGeo = nodeHeadGeometry(node.kind);
  const head = new THREE.Mesh(
    headGeo,
    new THREE.MeshStandardMaterial({ color, emissive: color.clone().multiplyScalar(0.45), roughness: 0.35, metalness: 0.2 }),
  );
  head.position.y = isGazetteer ? 0.3 : 1.0;
  head.userData = { record: node, kind: "node" };
  g.add(head);
  PICKABLE.push(head);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(isGazetteer ? 0.1 : 0.24, isGazetteer ? 0.14 : 0.32, 28).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.45, side: THREE.DoubleSide }),
  );
  ring.position.y = 0.02;
  g.add(ring);

  // Depth shaft for anything with a subsurface footprint (wells, tunnels).
  if (node.depthM < 0) {
    const y = depthY(node.depthM);
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, Math.abs(y), 5),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5 }),
    );
    shaft.position.y = y / 2;
    g.add(shaft);
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 10, 8),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.75 }),
    );
    bulb.position.y = y;
    g.add(bulb);
  }

  groups[node.layer].add(g);
  nodeMeshes.push({ node, group: g, head });
}

/* -------- USGS GNIS gazetteer register (socal-gazetteer-data build) ------ */

/**
 * ADL GCS entries drawn as a subdued register of place-name markers: small
 * mast + class-swatch pin. Verified FEATURE_ID rows (GNIS ids confirmed via
 * the Wikidata P590 anchor pull, or the official extract when present) render
 * at full brightness; curated seed coordinates render muted — the same
 * official/community evidence-tier split the rest of the theater uses.
 */
const gazIdx = makeGazetteerIndex(GAZ_ROWS);
const gazMeshes = [];
const gazHeadByIdx = new Map();

for (const e of gazIdx.entries) {
  const meta = GAZ_CLASS_META[e.fclass] ?? { swatch: "#9db2d1", short: "GNIS" };
  const color = new THREE.Color(meta.swatch);
  if (!e.verified) color.multiplyScalar(0.5);
  const [x, z] = project(e.lon, e.lat);
  const surf = elevY(elevationAt(e.lon, e.lat));
  const g = new THREE.Group();
  g.position.set(x, surf, z);

  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.016, 0.016, 0.34, 5),
    new THREE.MeshBasicMaterial({ color, transparent: !e.verified, opacity: e.verified ? 1 : 0.72 }),
  );
  mast.position.y = 0.17;
  g.add(mast);

  const head = new THREE.Mesh(
    new THREE.ConeGeometry(0.07, 0.17, 5).rotateX(Math.PI),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: e.verified ? 0.95 : 0.62 }),
  );
  head.position.y = 0.4;
  const record = {
    id: `gaz-${e.i}`,
    name: e.name,
    layer: "gazetteer",
    tier: e.verified ? "official" : "community",
    lon: e.lon,
    lat: e.lat,
    kind: "gaz",
    depthM: 0,
    facts: [
      `GNIS class: ${e.fclass} → ADL FTT facet ${e.ftt}`,
      `county: ${e.county}`,
      e.elev !== null
        ? `elevation ${e.elev.toLocaleString()} m (${Math.round(e.elev * 3.281).toLocaleString()} ft)`
        : "elevation not asserted (awaiting official extract coordinates)",
      e.gnis
        ? `GNIS FEATURE_ID ${e.gnis} — verified via ${GAZ_META.verified > 200 ? "USGS DomesticNames extract" : "Wikidata P590 anchor (CC0)"}`
        : "position from the curated seed register — no verified FEATURE_ID yet",
      ...(e.note ? [e.note] : []),
    ],
    sources: [
      "USGS U.S. Board on Geographic Names / GNIS (17 USC 105)",
      e.gnis ? "Wikidata P590 anchor, Wikimedia CC0, retrieved 2026-10-03" : "data/gnis/socal-gazetteer-seed.csv (curated, this repo)",
    ],
  };
  head.userData = { record, kind: "gaz", gazIdx: e.i };
  g.add(head);
  PICKABLE.push(head);

  groups.gazetteer.add(g);
  gazMeshes.push({ entry: e, group: g, head });
  gazHeadByIdx.set(e.i, head);
}

/* --------------------------------------------------------------- overlays */

// Vector overlay pack: fire perimeters, DEM/quad index frames, SAR swath and
// deformation fringes, CLUI register captions. Same projection, same surface.
const overlays = buildOverlays();
world.add(overlays.root);
PICKABLE.push(...overlays.pickables);

/* ------------------------------------------------------- radio spectrum */

// FCC-registered transmitter sites + licensed emitters, with terrain-aware
// propagation computed against the same elevation field everything else uses.
const radio = buildRadio();
groups.radio.add(radio.root);
PICKABLE.push(...radio.pickables);

/* ------------------------------------ utilities, skyway, orbital windows */

// Bulk power, the AT&T microwave network and satellite swaths. The power and
// microwave groups hang off their own base layers; the orbital track is an
// overlay because it is a schedule, not a structure.
const utilities = buildUtilities();
groups.transmission.add(utilities.groups.power);
groups.longlines.add(utilities.groups.longlines);
world.add(utilities.groups.orbital);
PICKABLE.push(...utilities.pickables);

const OVERLAY_DEFS = [
  { id: "fires", name: "Fire perimeters (WIFIRE / FRAP lineage)", color: "#ea580c", on: true, group: () => overlays.groups.fires },
  { id: "radioCoverage", name: "Radio service contours", color: "#f0abfc", on: true, group: () => radio.groups.coverage },
  { id: "radioWavefront", name: "Propagation wavefront", color: "#c4b5fd", on: true, group: () => radio.groups.wavefront },
  { id: "orbital", name: "Satellite ground track + swath", color: "#22d3ee", on: true, group: () => utilities.groups.orbital },
  { id: "quad", name: "USGS 7.5′ quad graticule", color: "#6b8ba3", on: false, group: () => overlays.groups.frames.getObjectByName("quad") },
  { id: "demTile", name: "1° 3DEP DEM delivery tiles", color: "#2dd4bf", on: true, group: () => overlays.groups.frames.getObjectByName("demTile") },
  { id: "sar", name: "SAR swath + InSAR deformation", color: "#a3e635", on: false, group: () => overlays.groups.sar },
  { id: "clui", name: "CLUI register captions", color: "#e5e7eb", on: false, group: () => overlays.groups.clui },
];
for (const def of OVERLAY_DEFS) {
  const g = def.group();
  if (g) g.visible = def.on;
}

/* ----------------------------------------------------------------- labels */

const labelHost = $("labels");
const labelEls = new Map();
for (const { node } of nodeMeshes) {
  if (node.kind === "gazetteer" && node.labelPriority !== 1) continue;
  const el = document.createElement("div");
  el.className = `lbl t-${node.kind === "gazetteer" ? "gazetteer" : node.tier}`;
  el.textContent = node.name.split("—")[0].trim().slice(0, 40);
  labelHost.append(el);
  labelEls.set(node.id, el);
}

// Gazetteer labels work at register zoom only: the nearest few pins get
// annotated, everything else stays a tick mark until searched or camera-close.
const gazLabelEls = [];
for (const { entry } of gazMeshes) {
  const el = document.createElement("div");
  el.className = `lbl gaz t-${entry.verified ? "official" : "community"}`;
  el.textContent = entry.name.slice(0, 34);
  labelHost.append(el);
  gazLabelEls.push(el);
}
const gazHitIds = new Set(); // search-driven highlights stay labelled

/* ------------------------------------------------------------------- HUD */

const hud = {
  cam: $("hudCam"),
  target: $("hudTarget"),
  lonlat: $("hudLonLat"),
  elev: $("hudElev"),
  layers: $("hudLayers"),
  objects: $("hudObjects"),
  fps: $("hudFps"),
};

function setStatus(text) {
  const el = $("status");
  if (el) el.textContent = text;
}

/* ------------------------------------------------------------ layer panel */

const layerHost = $("layerList");
const layerState = new Map(LAYERS.map((l) => [l.id, l.on]));
const layerInputs = new Map();

for (const l of LAYERS) {
  const row = document.createElement("label");
  row.className = "layer-row";
  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.checked = l.on;
  layerInputs.set(l.id, cb);
  cb.addEventListener("change", () => {
    layerState.set(l.id, cb.checked);
    groups[l.id].visible = cb.checked;
    refreshCounts();
  });
  const sw = document.createElement("span");
  sw.className = "swatch";
  sw.style.background = l.color;
  const txt = document.createElement("span");
  txt.textContent = l.name;
  row.append(cb, sw, txt);
  layerHost.append(row);
}

/* ---------------------------------------------------------- overlay panel */

const overlayHost = $("overlayList");
if (overlayHost) {
  for (const def of OVERLAY_DEFS) {
    const row = document.createElement("label");
    row.className = "layer-row";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = def.on;
    cb.addEventListener("change", () => {
      const g = def.group();
      if (g) g.visible = cb.checked;
      refreshCounts();
    });
    const sw = document.createElement("span");
    sw.className = "swatch";
    sw.style.background = def.color;
    const txt = document.createElement("span");
    txt.textContent = def.name;
    row.append(cb, sw, txt);
    overlayHost.append(row);
  }
}

/* -------------------------------------------------------- spectrum panel */

const radioState = { bands: new Set(Object.keys(BANDS)), current: null, lastReport: null };

const radioBandsHost = $("radioBands");
const radioSelect = $("radioEmitter");
const radioStatsHost = $("radioStats");
const radioProfileCanvas = $("radioProfileCanvas");
const radioProfileNote = $("radioProfileNote");

function fmtFreq(mhz) {
  return mhz >= 1 ? `${mhz} MHz` : `${Math.round(mhz * 1000)} kHz`;
}

function fillRadioSelect() {
  if (!radioSelect) return;
  const keep = radioSelect.value;
  radioSelect.textContent = "";
  for (const site of RADIO_SITES) {
    const ems = EMITTERS.filter((e) => e.site === site.id && radioState.bands.has(e.band));
    if (!ems.length) continue;
    const group = document.createElement("optgroup");
    group.label = site.name;
    for (const em of ems) {
      const opt = document.createElement("option");
      opt.value = em.id;
      opt.textContent = `${em.call} · ${fmtFreq(em.freqMHz)} · ${em.erpKw >= 1 ? `${em.erpKw} kW` : `${Math.round(em.erpKw * 1000)} W`}`;
      group.append(opt);
    }
    radioSelect.append(group);
  }
  if ([...radioSelect.options].some((o) => o.value === keep)) radioSelect.value = keep;
}

if (radioBandsHost) {
  for (const band of Object.values(BANDS)) {
    const row = document.createElement("label");
    row.className = "gaz-chip";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = true;
    cb.addEventListener("change", () => {
      if (cb.checked) radioState.bands.add(band.id);
      else radioState.bands.delete(band.id);
      fillRadioSelect();
    });
    const dot = document.createElement("span");
    dot.className = "swatch";
    dot.style.background = band.color;
    const txt = document.createElement("span");
    txt.textContent = band.id.toUpperCase();
    row.title = band.name;
    row.append(cb, dot, txt);
    radioBandsHost.append(row);
  }
}
fillRadioSelect();

function renderRadioStats(report) {
  if (!radioStatsHost) return;
  radioStatsHost.textContent = "";
  if (!report) return;
  const em = report.emitter;
  const rows = [
    ["facility", `${em.call} · ${em.service}`],
    ["carrier", `${fmtFreq(em.freqMHz)} (${em.channel})`],
    ["ERP", em.erpKw >= 1 ? `${em.erpKw} kW` : `${Math.round(em.erpKw * 1000)} W`],
    ["threshold", `${report.thresholdDbu.toFixed(1)} dBµV/m`],
  ];
  if (report.mode === "terrain") {
    rows.push(
      ["HAAT (computed)", `${Math.round(report.haatM)} m${report.filedHaatM ? ` · filed ${report.filedHaatM} m` : ""}`],
      ["FCC smooth earth", `${report.fccKm.toFixed(0)} km radius`],
      ["terrain march", `${report.terrain.minKm.toFixed(0)} – ${report.terrain.maxKm.toFixed(0)} km (mean ${report.terrain.meanKm.toFixed(0)})`],
      ["area enclosed", `${Math.round(report.terrain.areaKm2).toLocaleString()} km²`],
      ["radio horizon", `${report.horizonKm.toFixed(0)} km`],
    );
  } else {
    rows.push(
      ["groundwave", `${report.fccKm.toFixed(0)} km to contour`],
      ["ground σ", `${report.conductivity} mS/m (assumed)`],
      ["skywave", "not drawn — different model (47 CFR 73.190)"],
    );
  }
  for (const [k, v] of rows) {
    const dt = document.createElement("dt");
    dt.textContent = k;
    const dd = document.createElement("dd");
    dd.textContent = v;
    radioStatsHost.append(dt, dd);
  }
}

/** Terrain path profile with the first Fresnel zone, drawn 2D. */
function drawPathProfile(analysis, em) {
  if (!radioProfileCanvas) return;
  const ctx = radioProfileCanvas.getContext("2d");
  const W = radioProfileCanvas.width;
  const H = radioProfileCanvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#070d14";
  ctx.fillRect(0, 0, W, H);
  if (!analysis || !analysis.profile.distKm.length) return;

  const { distKm, elevM } = analysis.profile;
  const total = analysis.distKm;
  const n = distKm.length;
  // Flatten the earth: add the 4/3 bulge to the ground so the LOS ray is straight.
  const ground = new Float64Array(n);
  for (let i = 0; i < n; i++) ground[i] = elevM[i] + earthBulgeM(distKm[i], total - distKm[i]);
  let max = Math.max(analysis.txAmsl, analysis.rxAmsl);
  let min = Infinity;
  for (let i = 0; i < n; i++) {
    max = Math.max(max, ground[i]);
    min = Math.min(min, ground[i]);
  }
  const pad = (max - min) * 0.18 + 40;
  const lo = min - pad * 0.3;
  const hi = max + pad;
  const X = (d) => 4 + (d / Math.max(total, 0.001)) * (W - 8);
  const Y = (m) => H - 14 - ((m - lo) / (hi - lo)) * (H - 24);

  // Ground profile
  ctx.beginPath();
  ctx.moveTo(X(0), Y(ground[0]));
  for (let i = 1; i < n; i++) ctx.lineTo(X(distKm[i]), Y(ground[i]));
  ctx.lineTo(X(total), H - 14);
  ctx.lineTo(X(0), H - 14);
  ctx.closePath();
  ctx.fillStyle = "rgba(90,110,96,0.75)";
  ctx.fill();
  ctx.strokeStyle = "rgba(190,210,190,0.75)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Line of sight
  ctx.strokeStyle = analysis.lineOfSight ? "#4ade80" : "#f87171";
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(X(0), Y(analysis.txAmsl));
  ctx.lineTo(X(total), Y(analysis.rxAmsl));
  ctx.stroke();
  ctx.setLineDash([]);

  // First Fresnel zone envelope
  ctx.strokeStyle = "rgba(125,211,252,0.6)";
  for (const sign of [-1, 1]) {
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const d1 = distKm[i];
      const d2 = total - d1;
      const ray = analysis.txAmsl + ((analysis.rxAmsl - analysis.txAmsl) * d1) / total;
      const f1 = fresnelRadiusM(em.freqMHz, d1, d2);
      const y = Y(ray + sign * f1);
      if (i === 0) ctx.moveTo(X(d1), y);
      else ctx.lineTo(X(d1), y);
    }
    ctx.stroke();
  }

  // Controlling obstruction
  if (analysis.obstruction.index > 0) {
    const d = analysis.obstruction.distKm;
    ctx.strokeStyle = "#fbbf24";
    ctx.beginPath();
    ctx.moveTo(X(d), 2);
    ctx.lineTo(X(d), H - 14);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(220,235,250,0.85)";
  ctx.font = "9px ui-monospace, monospace";
  ctx.fillText(`${total.toFixed(1)} km`, W - 54, H - 3);
  ctx.fillText(`${Math.round(lo)}–${Math.round(hi)} m`, 6, H - 3);
}

function showCoverageFor(emitterId) {
  if (!emitterId) return null;
  radio.clearCoverage();
  const report = radio.showCoverage(emitterId);
  radioState.current = emitterId;
  radioState.lastReport = report;
  renderRadioStats(report);
  if (report) {
    setStatus(
      report.mode === "terrain"
        ? `coverage · ${report.emitter.call} ${report.thresholdDbu.toFixed(0)} dBµ · terrain ${report.terrain.meanKm.toFixed(0)} km mean vs FCC ${report.fccKm.toFixed(0)} km`
        : `groundwave · ${report.emitter.call} ${report.fccKm.toFixed(0)} km to ${report.thresholdDbu.toFixed(0)} dBµ`,
    );
  }
  drawRelief();
  return report;
}

$("radioShow")?.addEventListener("click", () => showCoverageFor(radioSelect?.value));
$("radioClear")?.addEventListener("click", () => {
  radio.clearCoverage();
  radioState.current = null;
  radioState.lastReport = null;
  renderRadioStats(null);
  if (radioProfileCanvas) radioProfileCanvas.getContext("2d").clearRect(0, 0, radioProfileCanvas.width, radioProfileCanvas.height);
  if (radioProfileNote) radioProfileNote.textContent = "Path profile cleared.";
  drawRelief();
  setStatus("spectrum cleared");
});

$("radioProfile")?.addEventListener("click", () => {
  const em = EMITTERS.find((e) => e.id === (radioSelect?.value || radioState.current));
  if (!em) return;
  const [lon, lat] = lonLatFromXZ(controls.target.x, controls.target.z);
  const analysis = emitterPath(em, lon, lat);
  drawPathProfile(analysis, em);
  const threshold = serviceThresholdDbu(em.band, em.freqMHz);
  if (radioProfileNote) {
    const site = SITE_BY_ID.get(em.site);
    radioProfileNote.textContent =
      `${em.call} (${site.name}) → ${lat.toFixed(3)}N ${Math.abs(lon).toFixed(3)}W · ${analysis.distKm.toFixed(1)} km · ` +
      `${analysis.lineOfSight ? "line of sight" : `obstructed, ${analysis.diffractionDb.toFixed(1)} dB knife-edge loss`} · ` +
      `${analysis.fieldDbu.toFixed(1)} dBµV/m (${analysis.fieldDbu >= threshold ? "above" : "below"} the ${threshold.toFixed(0)} dBµ service threshold)` +
      (analysis.obstruction.index > 0 ? ` · controlling ridge at ${analysis.obstruction.distKm.toFixed(1)} km` : "");
  }
  setStatus(`path · ${em.call} → target · ${analysis.fieldDbu.toFixed(1)} dBµV/m`);
});

const radioSrcHost = $("radioSources");
if (radioSrcHost) {
  for (const url of RADIO_SOURCE_URLS) {
    const li = document.createElement("li");
    li.textContent = url;
    radioSrcHost.append(li);
  }
}

/* ------------------------------------------------------------ relief map */

const reliefCanvas = $("reliefCanvas");
const relief = reliefCanvas ? makeReliefMap(reliefCanvas, { bbox: BBOX, elevAt: elevationAt, cell: 2 }) : null;

function reliefRings() {
  const out = [];
  for (const [, entry] of radio.drawn) {
    const r = entry.report;
    out.push({ ring: r.ring, color: r.band.color, width: 1.2 });
    if (r.fccRing) out.push({ ring: r.fccRing, color: r.band.color, width: 0.7, dash: [3, 3] });
  }
  return out;
}

function drawRelief() {
  if (!relief) return;
  const [lon, lat] = lonLatFromXZ(controls.target.x, controls.target.z);
  relief.draw({
    coast: COAST,
    points: RADIO_SITES.map((s) => ({
      lon: s.lon,
      lat: s.lat,
      color: EMITTERS.some((e) => e.site === s.id && e.band === "am") ? BANDS.am.color : "#fda4af",
      r: 2,
    })),
    rings: reliefRings(),
    cursor: { lon, lat },
  });
}

if (relief) {
  relief.resample();
  drawRelief();
  const srcEl = $("reliefSource");
  if (srcEl) srcEl.textContent = `source · ${demStatus}`;

  const modeBtn = $("reliefMode");
  const modes = [
    ["hypso", "TINT · HYPSO"],
    ["grey", "TINT · SHADE"],
    ["slope", "TINT · SLOPE"],
  ];
  modeBtn?.addEventListener("click", () => {
    const i = modes.findIndex(([m]) => m === relief.state.mode);
    const [mode, label] = modes[(i + 1) % modes.length];
    relief.setMode(mode);
    modeBtn.textContent = label;
    drawRelief();
  });

  const contourBtn = $("reliefContour");
  const steps = [500, 250, 1000, 0];
  contourBtn?.addEventListener("click", () => {
    const i = steps.indexOf(relief.state.contourStepM);
    const next = steps[(i + 1) % steps.length];
    relief.setContourStep(next);
    contourBtn.textContent = next ? `CONTOUR ${next} m` : "CONTOUR OFF";
    drawRelief();
  });

  const sun = $("reliefSun");
  sun?.addEventListener("input", () => {
    relief.setSun(Number(sun.value), relief.state.sunAlt);
    const label = $("reliefSunVal");
    if (label) label.textContent = `${sun.value}°`;
    drawRelief();
  });

  reliefCanvas.addEventListener("click", (e) => {
    const r = reliefCanvas.getBoundingClientRect();
    const [lon, lat] = relief.pxToLonLat(
      ((e.clientX - r.left) / r.width) * reliefCanvas.width,
      ((e.clientY - r.top) / r.height) * reliefCanvas.height,
    );
    const [x, z] = project(lon, lat);
    const y = elevY(elevationAt(lon, lat));
    controls.target.set(x, y, z);
    camera.position.set(x + 5, y + 9, z + 12);
    controls.update();
    setStatus(`relief · ${lat.toFixed(3)}N ${Math.abs(lon).toFixed(3)}W · ${Math.round(elevationAt(lon, lat))} m`);
    drawRelief();
  });
}

/* -------------------------------------------------------- orbital panel */

const orbitalState = { current: null };
const orbitalSelect = $("orbitalSat");
const orbitalStatsHost = $("orbitalStats");
const orbitalWindowsHost = $("orbitalWindows");

if (orbitalSelect) {
  for (const sat of SATELLITES) {
    const opt = document.createElement("option");
    opt.value = sat.id;
    opt.textContent = `${sat.name} · ${sat.kind === "sar" ? "SAR" : "optical"} · ${sat.repeatDays} d`;
    orbitalSelect.append(opt);
  }
}

/** Date → "YYYY-MM-DD HH:MM UTC". */
function fmtUtc(d) {
  return `${d.toISOString().slice(0, 10)} ${d.toISOString().slice(11, 16)} UTC`;
}

function showOrbitalFor(satId) {
  const sat = SAT_BY_ID.get(satId);
  if (!sat) return null;
  const shown = utilities.showOrbital(satId, { bbox: BBOX, lon: CENTER.lon, lat: CENTER.lat });
  orbitalState.current = satId;
  const geom = trackGeometry(sat, CENTER.lat);

  if (orbitalStatsHost) {
    orbitalStatsHost.textContent = "";
    const rows = [
      ["platform", `${sat.name} · ${sat.agency}`],
      ["instrument", sat.band],
      ["orbit", `${sat.altitudeKm} km · ${sat.inclinationDeg}° · ${sat.periodMin} min`],
      ["repeat", `${sat.repeatDays} days`],
      ["swath", `${sat.swathKm} km · ${sat.resolution}`],
      ["crossing here", `${formatHours(geom.localTime)} local solar, ${geom.pass}`],
      ["track heading", `${geom.heading.toFixed(1)}° from north`],
      ["other node", `${formatHours(geom.opposite.localTime)} local, ${geom.opposite.pass}, ${geom.opposite.heading.toFixed(1)}°`],
    ];
    for (const [k, v] of rows) {
      const dt = document.createElement("dt");
      dt.textContent = k;
      const dd = document.createElement("dd");
      dd.textContent = v;
      orbitalStatsHost.append(dt, dd);
    }
  }

  if (orbitalWindowsHost) {
    orbitalWindowsHost.textContent = "";
    const windows = nextWindows({
      lat: CENTER.lat,
      lon: CENTER.lon,
      perSat: 3,
      satellites: [sat],
    });
    for (const w of windows) {
      const li = document.createElement("li");
      li.textContent = `${fmtUtc(w.utc)} · ${w.localSolarLabel} local · ${w.pass} · hdg ${w.headingDeg.toFixed(0)}°`;
      orbitalWindowsHost.append(li);
    }
    const li = document.createElement("li");
    li.textContent = "dates nominal — anchored on cycleAnchorUtc, not on an observed acquisition";
    orbitalWindowsHost.append(li);
  }

  setStatus(
    `orbital · ${sat.name} · ${sat.swathKm} km swath · ${formatHours(geom.localTime)} local solar, ${geom.pass}`,
  );
  return shown;
}

// Source list for the three registers this panel and its neighbours draw on.
const utilSrcHost = $("orbitalWindowsSources");
if (utilSrcHost) {
  for (const url of [...ORBITAL_SOURCE_URLS, ...UTILITY_SOURCE_URLS]) {
    const li = document.createElement("li");
    li.textContent = url;
    utilSrcHost.append(li);
  }
}

// Boot with the C-band workhorse drawn, so the overlay is not an empty toggle.
showOrbitalFor(SATELLITES[0].id);
if (orbitalSelect) orbitalSelect.value = SATELLITES[0].id;

$("orbitalShow")?.addEventListener("click", () => showOrbitalFor(orbitalSelect?.value || SATELLITES[0].id));
$("orbitalClear")?.addEventListener("click", () => {
  utilities.clearOrbital();
  orbitalState.current = null;
  if (orbitalStatsHost) orbitalStatsHost.textContent = "";
  if (orbitalWindowsHost) orbitalWindowsHost.textContent = "";
  setStatus("orbital track cleared");
});

/* ----------------------------------------------------- gazetteer search */

// ADL GSP ops (offline): search-name / search-box over the seed register.
// ADL GCS describe = the dossier panel. Facets walk the FTT prefix tree.
const gazFacetSel = $("gazFacet");
const gazClassesHost = $("gazClasses");
const gazQuery = $("gazQuery");
const gazHits = $("gazHits");
const gazCaps = $("gazCaps");

const gazState = { facet: "", classes: null }; // null = all
let gazClassToggles = [];

if (gazFacetSel) {
  for (const f of GAZ_FACETS) {
    const opt = document.createElement("option");
    opt.value = f.fac;
    opt.textContent = f.label;
    gazFacetSel.append(opt);
  }
  gazFacetSel.addEventListener("change", () => {
    gazState.facet = gazFacetSel.value;
    runGazSearch();
  });
}

if (gazClassesHost) {
  for (const c of classRollup(GAZ_ROWS)) {
    const row = document.createElement("label");
    row.className = "gaz-chip";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = true;
    cb.addEventListener("change", () => {
      // Sane Set detection: rebuild from the DOM
      const cls = gazClassToggles.filter((t) => t.el.checked).map((t) => t.fclass);
      gazState.classes = cls.length === gazClassToggles.length ? null : new Set(cls);
      runGazSearch();
    });
    const dot = document.createElement("span");
    dot.className = "swatch";
    dot.style.background = c.swatch;
    const txt = document.createElement("span");
    txt.textContent = `${c.label} ${c.count}`;
    row.append(cb, dot, txt);
    gazClassesHost.append(row);
    gazClassToggles.push({ el: cb, fclass: c.fclass });
  }
}

/** Float the camera to a gazetteer entry and select its pin. */
function focusGazEntry(e) {
  const head = gazHeadByIdx.get(e.i);
  const { group } = gazMeshes.find((m) => m.entry.i === e.i) ?? {};
  if (!group) return;
  const [x, z] = project(e.lon, e.lat);
  const y = elevY(elevationAt(e.lon, e.lat));
  const span = Math.max(4, 20);
  camera.position.set(x + 6, y + span * 0.55, z + span * 0.72);
  controls.target.set(x, y, z);
  controls.update();
  if (head) select(head);
  setStatus(`gazetteer · ${e.name} (${e.fclass})`);
}

function renderGazHits(hits, mode) {
  if (!gazHits) return;
  gazHits.textContent = "";
  gazHitIds.clear();
  for (const h of hits.slice(0, 8)) gazHitIds.add(h.i);
  for (const h of gainsCap(hits)) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "gaz-hit" + (h.verified ? " verified" : "");
    const meta = GAZ_CLASS_META[h.fclass] ?? { short: "GNIS", swatch: "#9db2d1" };
    const detail =
      mode === "point"
        ? `${h.distKm.toFixed(1)} km · ${meta.short} · ${h.county}`
        : `${meta.short} · ${h.county}${h.elev != null ? " · " + h.elev + " m" : ""}`;
    btn.innerHTML = `<span class="gaz-hit-name"></span><span class="gaz-hit-meta"></span>`;
    btn.querySelector(".gaz-hit-name").textContent = h.name;
    btn.querySelector(".gaz-hit-meta").textContent = detail;
    btn.style.setProperty("--gaz", meta.swatch);
    btn.addEventListener("click", () => focusGazEntry(h));
    li.append(btn);
    gazHits.append(li);
  }
}

// Cap result rendering so search-box can't flood the DOM with every PPL row.
function gainsCap(hits) {
  return hits.slice(0, 40);
}

function runGazSearch() {
  const q = gazQuery ? gazQuery.value : "";
  if (!q || q.trim().length < 2) {
    renderGazHits([], "name");
    return;
  }
  const hits = searchName(gazIdx, q, {
    facet: gazState.facet,
    classes: gazState.classes,
    limit: 40,
  });
  renderGazHits(hits, "name");
  setStatus(`search-name · ${hits.length} hit${hits.length === 1 ? "" : "s"}`);
}

let gazTimer = 0;
if (gazQuery) {
  gazQuery.addEventListener("input", () => {
    clearTimeout(gazTimer);
    gazTimer = setTimeout(runGazSearch, 90);
  });
}

const gazBoxBtn = $("gazBox");
if (gazBoxBtn) {
  gazBoxBtn.addEventListener("click", () => {
    // Camera view → EPSG:4326 search box at the ground plane.
    const [lonC, latC] = lonLatFromXZ(controls.target.x, controls.target.z);
    const camDist = camera.position.distanceTo(controls.target);
    const spanKm = camDist / 0.1 * 0.5; // half-width ≈ half the camera height in km
    const box = {
      lat0: latC - spanKm / KM_PER_DEG_LAT,
      lat1: latC + spanKm / KM_PER_DEG_LAT,
      lon0: lonC - spanKm / (KM_PER_DEG_LAT * COS_LAT),
      lon1: lonC + spanKm / (KM_PER_DEG_LAT * COS_LAT),
    };
    const hits = searchBox(gazIdx, box, { facet: gazState.facet, classes: gazState.classes });
    renderGazHits(hits, "box");
    setStatus(`search-box · ${hits.length} entries in view`);
  });
}

const gazClearBtn = $("gazClear");
if (gazClearBtn) {
  gazClearBtn.addEventListener("click", () => {
    if (gazQuery) gazQuery.value = "";
    renderGazHits([], "name");
    setStatus("gazetteer cleared");
  });
}

if (gazCaps) {
  const caps = GAZ_META;
  gazCaps.textContent = `${caps.rowCount} names · ${caps.verified} id-verified · EPSG:4326`;
}

const fireSrcHost = $("fireSources");
if (fireSrcHost) {
  for (const url of FIRE_SOURCE_URLS) {
    const li = document.createElement("li");
    li.textContent = url;
    fireSrcHost.append(li);
  }
}

// Off-frame register: named sites that fall outside the theater get a text
// entry, never a pin at the wrong place.
const offHost = $("offFrameList");
if (offHost) {
  for (const site of OFF_FRAME) {
    const b = document.createElement("button");
    b.type = "button";
    b.style.cssText = "display:block;width:100%;text-align:left;margin:2px 0";
    b.textContent = `↗ ${site.name}`;
    b.addEventListener("click", () => {
      select(null);
      renderDetail({
        ...site,
        layer: "off-frame",
        tier: "official",
        facts: [...site.facts, `True position ${site.lat.toFixed(3)}°N ${Math.abs(site.lon).toFixed(3)}°W — outside this frame, so it is not drawn.`],
      });
      setStatus(`off-frame · ${site.name}`);
    });
    offHost.append(b);
  }
}

function refreshCounts() {
  const on = [...layerState.values()].filter(Boolean).length;
  if (hud.layers) hud.layers.textContent = `${on}/${LAYERS.length}`;
  const vis = PICKABLE.filter((m) => isVisible(m)).length;
  if (hud.objects) hud.objects.textContent = String(vis);
}

function isVisible(obj) {
  let o = obj;
  while (o) {
    if (o.visible === false) return false;
    o = o.parent;
  }
  return true;
}

/* ----------------------------------------------------------- detail panel */

const detailBody = $("detailBody");

function renderDetail(record) {
  if (!record) {
    detailBody.innerHTML = "";
    const p = document.createElement("p");
    p.className = "hint";
    p.textContent = "Click any pip, pipe, aqueduct or rail corridor for its dossier. Drag to orbit, wheel to zoom, right-drag to pan.";
    detailBody.append(p);
    return;
  }
  detailBody.textContent = "";
  const h = document.createElement("h3");
  h.className = "detail-title";
  h.textContent = record.name;
  const tier = document.createElement("span");
  tier.className = `tier ${record.tier}`;
  tier.textContent = record.tier.toUpperCase();

  const dl = document.createElement("dl");
  dl.className = "kv";
  const layer = LAYERS.find((l) => l.id === record.layer);
  const rows = [["layer", layer ? layer.name : record.layer]];
  if (record.lon !== undefined) rows.push(["position", `${record.lat.toFixed(3)}°N ${Math.abs(record.lon).toFixed(3)}°W`]);
  if (record.featureClass) rows.push(["GNIS class", record.featureClass]);
  if (record.county) rows.push(["county", record.county]);
  if (record.gnisId) rows.push(["GNIS feature ID", String(record.gnisId)]);
  if (record.path) {
    rows.push(["endpoints", `${fmtLL(record.path[0])} → ${fmtLL(record.path[record.path.length - 1])}`]);
    rows.push(["plotted", `${pathKm(record.path).toFixed(0)} km (generalized)`]);
  }
  if (record.depthM) rows.push(["depth class", `${record.depthM < -500 ? (record.depthM / 1000).toFixed(1) + " km" : Math.abs(record.depthM) + " m"} below grade`]);
  if (record.tunnelFraction) rows.push(["tunnelled", `≈${Math.round(record.tunnelFraction * 100)}% of route`]);
  for (const [k, v] of rows) {
    const dt = document.createElement("dt");
    dt.textContent = k;
    const dd = document.createElement("dd");
    dd.textContent = v;
    dl.append(dt, dd);
  }

  // Corridor × fire-perimeter intersection, computed live from the overlay rings.
  let crossBox = null;
  if (record.path) {
    const { hits } = overlays.corridorFireCrossings(record.path);
    if (hits.length) {
      crossBox = document.createElement("div");
      crossBox.className = "crossings";
      const h2 = document.createElement("p");
      h2.className = "hint";
      h2.style.margin = "8px 0 3px";
      h2.textContent = "runs through burned ground";
      crossBox.append(h2);
      const cl = document.createElement("ul");
      cl.className = "facts";
      for (const hit of hits) {
        const li = document.createElement("li");
        li.textContent = `${hit.fire.name} ${hit.fire.year} — ${hit.km.toFixed(0)} km of plotted route inside the perimeter (${hit.fire.acres.toLocaleString()} ac).`;
        cl.append(li);
      }
      crossBox.append(cl);
    }
  }

  const ul = document.createElement("ul");
  ul.className = "facts";
  for (const f of record.facts || []) {
    const li = document.createElement("li");
    li.textContent = f;
    ul.append(li);
  }

  const src = document.createElement("ul");
  src.className = "srcs";
  for (const s of record.sources || []) {
    const li = document.createElement("li");
    li.textContent = s;
    src.append(li);
  }

  detailBody.append(h, tier, dl, ul);
  if (crossBox) detailBody.append(crossBox);
  if (src.childElementCount) {
    const sh = document.createElement("p");
    sh.className = "hint";
    sh.style.margin = "8px 0 0";
    sh.textContent = "sources";
    detailBody.append(sh, src);
  }
}

const fmtLL = ([lon, lat]) => `${lat.toFixed(2)}N ${Math.abs(lon).toFixed(2)}W`;

renderDetail(null);

/* ---------------------------------------------------------------- picking */

const raycaster = new THREE.Raycaster();
raycaster.params.Line = { threshold: 0.3 };
const pointer = new THREE.Vector2();
let selected = null;
let selectedMat = null;
let selectedEmissive = null;

function select(obj) {
  if (selectedMat && selectedEmissive) selectedMat.emissive.copy(selectedEmissive);
  selected = obj || null;
  selectedMat = null;
  selectedEmissive = null;
  if (!obj) {
    renderDetail(null);
    setStatus("no selection");
    return;
  }
  const rec = obj.userData.record;
  if (obj.material && obj.material.emissive) {
    selectedMat = obj.material;
    selectedEmissive = obj.material.emissive.clone();
    obj.material.emissive.setRGB(1, 1, 1).multiplyScalar(0.55);
  }
  renderDetail(rec);
  if (rec.kind === "radio-emitter" && rec.emitterId) showCoverageFor(rec.emitterId);
  setStatus(`selected · ${rec.name}`);
  broadcast(rec);
  const pip = $("pipDetail");
  if (pip) pip.classList.remove("min");
}

/* ---------------------------------------------------- gazetteer search */

const searchInput = $("searchBox");
const searchResults = $("searchResults");
const foldSearch = (value) => value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
const searchIndex = [
  ...NODES.map((record) => ({
    record,
    label: record.name,
    meta: record.kind === "gazetteer"
      ? `USGS GNIS · ${record.featureClass} · ${record.county} County`
      : `theater feature · ${LAYERS.find((l) => l.id === record.layer)?.name || record.layer}`,
  })),
  ...CORRIDORS.map((record) => ({
    record,
    label: record.name,
    meta: `corridor · ${LAYERS.find((l) => l.id === record.layer)?.name || record.layer}`,
  })),
  ...RADIO_SITES.map((site) => ({
    record: { id: `radio-site-${site.id}`, name: site.name, layer: "radio", lon: site.lon, lat: site.lat },
    label: site.name,
    meta: `transmitter site · ${EMITTERS.filter((e) => e.site === site.id).length} registered emitters`,
  })),
  ...SUBSTATIONS.map((st) => ({
    record: { id: `substation-${st.id}`, name: st.name, layer: "transmission", lon: st.lon, lat: st.lat },
    label: st.name,
    meta: `${st.operator}${st.approx ? " · generalized pin" : ""}`,
  })),
  ...TRANSMISSION.map((line) => ({
    record: { id: `transmission-${line.id}`, name: line.name, layer: "transmission", lon: line.path[0][0], lat: line.path[0][1] },
    label: line.name,
    meta: `transmission · ${line.operator}`,
  })),
  ...LONGLINES.map((site) => ({
    record: { id: `longline-${site.id}`, name: site.name, layer: "longlines", lon: site.lon, lat: site.lat },
    label: `${site.name} — Long Lines`,
    meta: `AT&T microwave relay${site.hardened ? " · hardened" : ""} · ${site.status}`,
  })),
  ...EMITTERS.map((em) => ({
    record: {
      id: `radio-${em.id}`,
      name: `${em.call} ${em.channel}`,
      layer: "radio",
      lon: SITE_BY_ID.get(em.site).lon,
      lat: SITE_BY_ID.get(em.site).lat,
      emitterId: em.id,
    },
    label: `${em.call} — ${em.channel}`,
    meta: `${em.service} · ${SITE_BY_ID.get(em.site).name}`,
  })),
].map((item) => ({ ...item, key: foldSearch(`${item.label} ${item.meta}`) }));

function revealLayer(layerId) {
  if (!groups[layerId]) return;
  groups[layerId].visible = true;
  layerState.set(layerId, true);
  const input = layerInputs.get(layerId);
  if (input) input.checked = true;
  refreshCounts();
}

function flyToRecord(record) {
  let lon = record.lon;
  let lat = record.lat;
  if (record.path?.length) {
    const mid = record.path[Math.floor(record.path.length / 2)];
    [lon, lat] = mid;
  }
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return;
  const [x, z] = project(lon, lat);
  const y = elevY(elevationAt(lon, lat));
  controls.target.set(x, y + 0.25, z);
  camera.position.set(x + 3.6, y + 3.0, z + 4.6);
  controls.update();
  revealLayer(record.layer);

  const nodeHit = nodeMeshes.find((entry) => entry.node === record)?.head;
  const corridorHit = corridorMeshes.find((entry) => entry.item === record)?.mesh;
  select(nodeHit || corridorHit || null);
  if (record.emitterId) {
    if (radioSelect) radioSelect.value = record.emitterId;
    showCoverageFor(record.emitterId);
  }
}

function runSearch() {
  if (!searchInput || !searchResults) return;
  const query = foldSearch(searchInput.value.trim());
  searchResults.replaceChildren();
  if (query.length < 2) return;
  const hits = searchIndex
    .filter((item) => item.key.includes(query))
    .sort((a, b) => {
      const ar = foldSearch(a.label).startsWith(query) ? 0 : 1;
      const br = foldSearch(b.label).startsWith(query) ? 0 : 1;
      return ar - br || a.label.localeCompare(b.label);
    })
    .slice(0, 12);

  for (const item of hits) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "search-hit";
    const name = document.createElement("span");
    name.textContent = item.label;
    const meta = document.createElement("small");
    meta.textContent = item.meta;
    button.append(name, meta);
    button.addEventListener("click", () => flyToRecord(item.record));
    searchResults.append(button);
  }
  if (!hits.length) {
    const empty = document.createElement("p");
    empty.className = "hint";
    empty.textContent = "No match in the embedded USGS gazetteer or theater register.";
    searchResults.append(empty);
  }
}
searchInput?.addEventListener("input", runSearch);
$("gazetteerSearch")?.addEventListener("submit", (event) => event.preventDefault());

let downAt = null;
renderer.domElement.addEventListener("pointerdown", (e) => {
  downAt = { x: e.clientX, y: e.clientY };
});
renderer.domElement.addEventListener("pointerup", (e) => {
  if (!downAt) return;
  const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
  downAt = null;
  if (moved > 6) return;
  const r = renderer.domElement.getBoundingClientRect();
  pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
  pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(PICKABLE.filter(isVisible), false);
  select(hits.length ? hits[0].object : null);
});

// Ground readout under the cursor.
const groundHits = [terrain];
renderer.domElement.addEventListener("pointermove", (e) => {
  const r = renderer.domElement.getBoundingClientRect();
  pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
  pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(groundHits, false)[0];
  if (!hit) return;
  const [lon, lat] = lonLatFromXZ(hit.point.x, hit.point.z);
  const e2 = elevationAt(lon, lat);
  if (hud.lonlat) hud.lonlat.textContent = `${lat.toFixed(3)}N ${Math.abs(lon).toFixed(3)}W`;
  if (hud.elev) hud.elev.textContent = `${Math.round(e2)} m (${Math.round(e2 * 3.281)} ft)`;
});

/* ------------------------------------------------------------ PIP windows */

function makeDraggable(pip) {
  const head = pip.querySelector(".pip-head");
  let dx = 0;
  let dy = 0;
  head.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button")) return;
    const r = pip.getBoundingClientRect();
    dx = e.clientX - r.left;
    dy = e.clientY - r.top;
    pip.style.right = "auto";
    pip.style.bottom = "auto";
    head.setPointerCapture(e.pointerId);
    const move = (ev) => {
      const x = Math.min(Math.max(0, ev.clientX - dx), innerWidth - 60);
      const y = Math.min(Math.max(0, ev.clientY - dy), innerHeight - 30);
      pip.style.left = `${x}px`;
      pip.style.top = `${y}px`;
    };
    const up = () => {
      head.removeEventListener("pointermove", move);
      head.removeEventListener("pointerup", up);
    };
    head.addEventListener("pointermove", move);
    head.addEventListener("pointerup", up);
  });
  const min = pip.querySelector("[data-min]");
  if (min) {
    min.addEventListener("click", () => {
      pip.classList.toggle("min");
      min.textContent = pip.classList.contains("min") ? "+" : "–";
    });
  }
}
document.querySelectorAll(".pip").forEach(makeDraggable);

/* ---------------------------------------------------------- minimap (PIP) */

const mini = $("minimap");
let miniRenderer = null;
let miniCam = null;
if (mini) {
  miniRenderer = new THREE.WebGLRenderer({ canvas: mini, antialias: false });
  miniRenderer.setPixelRatio(1);
  miniRenderer.setSize(220, 150, false);
  const aspect = 220 / 150;
  const h = Math.max(D, W / aspect) / 2 + 2;
  miniCam = new THREE.OrthographicCamera(-h * aspect, h * aspect, h, -h, 0.1, 400);
  miniCam.position.set(X0 + W / 2, 120, Z0 + D / 2);
  miniCam.lookAt(X0 + W / 2, 0, Z0 + D / 2);
}

// Camera frustum marker drawn in the minimap pass only.
const camMarker = new THREE.Mesh(
  new THREE.ConeGeometry(1.2, 3, 4),
  new THREE.MeshBasicMaterial({ color: 0xffffff }),
);
camMarker.rotation.x = Math.PI / 2;
camMarker.visible = false;
scene.add(camMarker);

/* --------------------------------------------------------------- controls */

const views = {
  basin: { pos: [2, 22, 34], target: [-1, 0, 6] },
  transect: { pos: [-38, 16, 20], target: [2, 0, 2] },
  mojave: { pos: [-2, 14, 8], target: [-6, 0, -8] },
  salton: { pos: [16, 10, 8], target: [18, 0, 12] },
  kern: { pos: [-16, 12, 2], target: [-11, 0, -10] },
  underground: { pos: [0, 6, 30], target: [0, -6, 0] },
};

function flyTo(name) {
  const v = views[name];
  if (!v) return;
  camera.position.set(...v.pos);
  controls.target.set(...v.target);
  controls.update();
  setStatus(`view · ${name}`);
}

$("btnReset").addEventListener("click", () => flyTo("basin"));
$("viewSelect").addEventListener("change", (e) => flyTo(e.target.value));

const btnWire = $("btnWire");
btnWire.addEventListener("click", () => {
  wire.visible = !wire.visible;
  btnWire.setAttribute("aria-pressed", String(wire.visible));
});

const btnXray = $("btnXray");
let xray = false;
btnXray.addEventListener("click", () => {
  xray = !xray;
  btnXray.setAttribute("aria-pressed", String(xray));
  terrainMat.opacity = xray ? 0.32 : 1;
  terrainMat.transparent = xray;
  terrainMat.depthWrite = !xray;
  terrainMat.needsUpdate = true;
  sea.visible = !xray;
  setStatus(xray ? "x-ray · terrain transparent, buried systems exposed" : "x-ray off");
});

/* --------------------------------------------------- terrain relief modes */

/**
 * Re-tint the terrain mesh. Hypsometric is the default theater read; the two
 * relief modes are the cartographic ones — a Lambertian hillshade computed on
 * the mesh lattice, and a slope ramp. All three read the same elevM array, so
 * they switch instantly and they will all change the moment a real 3DEP grid
 * is installed under elevationAt().
 */
const SHADE_MODES = ["hypso", "hillshade", "slope"];
let shadeMode = "hypso";
const LAT_ROWS = SEG_Y + 1;
const LON_COLS = SEG_X + 1;
const cellXm = ((BBOX.lon1 - BBOX.lon0) / SEG_X) * 111320 * COS_LAT;
const cellYm = ((BBOX.lat1 - BBOX.lat0) / SEG_Y) * 111320;

function applyTerrainShading(mode) {
  shadeMode = mode;
  const colorAttr = terrainGeo.attributes.color;
  const sunAz = ((360 - 315 + 90) % 360) * (Math.PI / 180);
  const zenith = Math.PI / 2 - 45 * (Math.PI / 180);
  const tmp = new THREE.Color();
  for (let row = 0; row < LAT_ROWS; row++) {
    for (let col = 0; col < LON_COLS; col++) {
      const i = row * LON_COLS + col;
      const e = elevM[i];
      const ir = row * LON_COLS + Math.min(col + 1, LON_COLS - 1);
      const il = row * LON_COLS + Math.max(col - 1, 0);
      const iu = Math.max(row - 1, 0) * LON_COLS + col;
      const id = Math.min(row + 1, LAT_ROWS - 1) * LON_COLS + col;
      const dzdx = (elevM[ir] - elevM[il]) / (2 * cellXm);
      const dzdy = (elevM[iu] - elevM[id]) / (2 * cellYm);
      const slope = Math.atan(Math.hypot(dzdx, dzdy) * 3);
      const aspect = Math.atan2(dzdy, -dzdx);
      const shade = Math.max(
        0,
        Math.cos(zenith) * Math.cos(slope) + Math.sin(zenith) * Math.sin(slope) * Math.cos(sunAz - aspect),
      );
      if (mode === "hillshade") {
        const t = Math.max(0, Math.min(1, (e + 500) / 4000));
        const v = (0.22 + 0.72 * t) * (0.4 + 0.85 * shade);
        tmp.setRGB(v, v * 1.01, v * 1.04);
      } else if (mode === "slope") {
        const t = Math.max(0, Math.min(1, (slope * 180) / Math.PI / 45));
        tmp.setRGB(0.2 + 0.78 * t, 0.42 + 0.3 * (1 - t), 0.55 * (1 - t) + 0.12).multiplyScalar(0.45 + 0.8 * shade);
      } else {
        if (e < 0) tmp.setHSL(0.58, 0.55, 0.12 + Math.max(-0.08, e / 9000));
        else if (e < 300) tmp.setHSL(0.33 - e / 4000, 0.3, 0.2 + e / 3000);
        else if (e < 1200) tmp.setHSL(0.11, 0.35, 0.24 + e / 5200);
        else if (e < 2200) tmp.setHSL(0.07, 0.22, 0.34 + e / 9000);
        else tmp.setHSL(0.6, 0.06, 0.62);
      }
      colorAttr.setXYZ(i, tmp.r, tmp.g, tmp.b);
    }
  }
  colorAttr.needsUpdate = true;
}

const btnRelief = $("btnRelief");
btnRelief?.addEventListener("click", () => {
  const next = SHADE_MODES[(SHADE_MODES.indexOf(shadeMode) + 1) % SHADE_MODES.length];
  applyTerrainShading(next);
  btnRelief.setAttribute("aria-pressed", String(next !== "hypso"));
  btnRelief.textContent = next === "hypso" ? "RELIEF" : next === "hillshade" ? "HILLSHADE" : "SLOPE";
  setStatus(
    next === "hypso"
      ? "terrain · hypsometric tint"
      : next === "hillshade"
        ? "terrain · shaded relief, sun 315° / 45°"
        : "terrain · slope ramp, 0–45°",
  );
});

const btnLabels = $("btnLabels");
let labelsOn = true;
btnLabels.addEventListener("click", () => {
  labelsOn = !labelsOn;
  btnLabels.setAttribute("aria-pressed", String(labelsOn));
  labelHost.style.display = labelsOn ? "" : "none";
});

const depthSlider = $("depthExag");
depthSlider.addEventListener("input", () => {
  scale.depth = Number(depthSlider.value);
  $("depthExagVal").textContent = `${scale.depth}×`;
  rebuildDepths();
});

const vertSlider = $("vertExag");
vertSlider.addEventListener("input", () => {
  scale.vert = Number(vertSlider.value);
  $("vertExagVal").textContent = `${scale.vert}×`;
  for (let i = 0; i < posAttr.count; i++) posAttr.setY(i, elevY(elevM[i]));
  posAttr.needsUpdate = true;
  terrainGeo.computeVertexNormals();
  applyTerrainShading(shadeMode);
  sea.position.y = elevY(0);
  rebuildDepths();
});

/** Re-place corridors and node shafts after an exaggeration change. */
function rebuildDepths() {
  for (const entry of corridorMeshes) {
    const pts = corridorPoints(entry.item);
    const curve = new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.15);
    const radius = corridorRadius(entry.item);
    const geo = new THREE.TubeGeometry(curve, Math.min(600, pts.length * 3), radius, 7, false);
    entry.mesh.geometry.dispose();
    entry.mesh.geometry = geo;
    entry.curve = curve;
  }
  for (const { node, group } of nodeMeshes) {
    group.position.y = elevY(elevationAt(node.lon, node.lat));
  }
  for (const { entry, group } of gazMeshes) {
    group.position.y = elevY(elevationAt(entry.lon, entry.lat));
  }
  subGrid.position.y = depthY(-3000);
  overlays.rebuild();
  radio.rebuild();
  utilities.rebuild();
  if (orbitalState.current) showOrbitalFor(orbitalState.current);
  if (relief) {
    relief.resample();
    drawRelief();
  }
}

/* ------------------------------------------------------------ webxdc wire */

/** Optional: in a Delta Chat / webxdc host, selections are shared with the chat. */
const xdc = typeof globalThis !== "undefined" ? globalThis.webxdc : null;
let xdcReady = false;
if (xdc && typeof xdc.setUpdateListener === "function") {
  xdc
    .setUpdateListener((update) => {
      const p = update.payload;
      if (!p || !p.id || p.from === (xdc.selfAddr || "")) return;
      const el = $("peer");
      if (el) el.textContent = `peer → ${p.name}`;
    }, 0)
    .then(() => {
      xdcReady = true;
      const el = $("peer");
      if (el) el.textContent = "webxdc · shared selections on";
    })
    .catch(() => {});
}

function broadcast(record) {
  if (!xdc || !xdcReady || !record) return;
  try {
    xdc.sendUpdate(
      {
        payload: { id: record.id, name: record.name, from: xdc.selfAddr },
        info: `${xdc.selfName} looked at ${record.name}`,
        summary: record.name,
      },
      `${xdc.selfName}: ${record.name}`,
    );
  } catch {
    /* host rejected the update; the app still works offline */
  }
}

/* ------------------------------------------------------------------- loop */

function resize() {
  const w = innerWidth;
  const h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
addEventListener("resize", resize);
resize();

const v3 = new THREE.Vector3();
let reliefClock = 0;
let last = performance.now();
let frames = 0;
let fpsAcc = 0;

function updateLabels() {
  if (!labelsOn) return;
  const w = innerWidth;
  const h = innerHeight;
  for (const { node, head } of nodeMeshes) {
    const el = labelEls.get(node.id);
    if (!el) continue;
    if (!isVisible(head)) {
      el.style.display = "none";
      continue;
    }
    head.getWorldPosition(v3);
    const dist = camera.position.distanceTo(v3);
    v3.project(camera);
    const onScreen = v3.z < 1 && Math.abs(v3.x) < 1.05 && Math.abs(v3.y) < 1.05 && dist < 120;
    el.style.display = onScreen ? "" : "none";
    if (!onScreen) continue;
    el.style.left = `${((v3.x + 1) / 2) * w}px`;
    el.style.top = `${((1 - v3.y) / 2) * h - 16}px`;
    el.style.opacity = String(Math.max(0.25, 1 - dist / 130));
  }

  // Gazetteer register: label the few pins that matter (close, or last search).
  for (const el of gazLabelEls) el.style.display = "none";
  const near = [];
  for (let gi = 0; gi < gazMeshes.length; gi += 1) {
    const { entry, head } = gazMeshes[gi];
    if (!isVisible(head)) continue;
    head.getWorldPosition(v3);
    const dist = camera.position.distanceTo(v3);
    if (gazHitIds.has(entry.i)) near.push({ gi, head, dist: 0 });
    else if (dist < 26) near.push({ gi, head, dist });
  }
  near.sort((a, b) => a.dist - b.dist);
  for (const n of near.slice(0, 14)) {
    const el = gazLabelEls[n.gi];
    n.head.getWorldPosition(v3);
    v3.project(camera);
    if (v3.z >= 1 || Math.abs(v3.x) > 1.05 || Math.abs(v3.y) > 1.05) continue;
    el.style.display = "";
    el.style.left = `${((v3.x + 1) / 2) * w}px`;
    el.style.top = `${((1 - v3.y) / 2) * h + 2}px`;
    el.style.opacity = String(n.dist === 0 ? 1 : Math.max(0.3, 1 - n.dist / 30));
  }
}

function tick(now) {
  requestAnimationFrame(tick);
  const dt = (now - last) / 1000;
  last = now;
  fpsAcc += dt;
  frames++;
  if (fpsAcc > 0.5) {
    if (hud.fps) hud.fps.textContent = `${Math.round(frames / fpsAcc)}`;
    frames = 0;
    fpsAcc = 0;
  }

  controls.update();
  updateLabels();

  // Spectrum layer: expanding phase fronts and the FAA obstruction beacons.
  if (radio.groups.wavefront.visible) radio.tickWavefront(dt);
  radio.tickBeacons(now);

  // Relief map tracks the camera target, throttled — it is a full resample.
  reliefClock += dt;
  if (relief && reliefClock > 0.5) {
    reliefClock = 0;
    drawRelief();
  }

  // Flow beads: direction of load on the lines that pump uphill through Cajon.
  if (FLOW.length) {
    const t = (now / 9000) % 1;
    for (let i = 0; i < FLOW.length; i++) {
      const f = FLOW[i];
      const u = (t + i * 0.37) % 1;
      f.bead.visible = isVisible(f.bead.parent);
      if (f.bead.visible) f.curve.getPointAt(u, f.bead.position);
    }
  }

  if (hud.cam) hud.cam.textContent = `${camera.position.x.toFixed(1)}, ${camera.position.y.toFixed(1)}, ${camera.position.z.toFixed(1)}`;
  if (hud.target) {
    const [lon, lat] = lonLatFromXZ(controls.target.x, controls.target.z);
    hud.target.textContent = `${lat.toFixed(2)}N ${Math.abs(lon).toFixed(2)}W`;
  }

  renderer.render(scene, camera);

  if (miniRenderer && miniCam) {
    camMarker.visible = true;
    camMarker.position.set(camera.position.x, 40, camera.position.z);
    const dir = new THREE.Vector3().subVectors(controls.target, camera.position).setY(0).normalize();
    camMarker.rotation.z = -Math.atan2(dir.x, -dir.z);
    scene.fog = null; // the plan pass must see the whole theater
    miniRenderer.render(scene, miniCam);
    scene.fog = FOG;
    camMarker.visible = false;
  }
}

flyTo("basin");
refreshCounts();
setStatus("ready · schematic only — not a survey, not a dig ticket, call 811");
requestAnimationFrame(tick);
