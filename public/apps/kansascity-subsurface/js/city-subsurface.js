/**
 * CITY SUBSURFACE 4Dwm — parametric city theater.
 *
 * Same shape as the SoCal Subsurface engine, reduced to what a city frame
 * needs: a generalized terrain shell, the full layer list, buried corridors,
 * city nodes, an offline ADL/GNIS gazetteer, a separate Geocache class, and a
 * plan-view minimap. The city is selected by `<body data-city="...">`; data
 * modules are loaded dynamically so each Webxdc can ship exactly one city.
 *
 * Schematic. Not a survey. Not a dig ticket. Call 811 before you touch dirt.
 */

import * as THREE from "../vendor/three.module.min.js";
import { OrbitControls } from "../vendor/OrbitControls.js";
import {
  GAZ_CLASS_META,
  GAZ_FACETS,
  appendGazetteerRows,
  classRollup,
  makeGazetteerIndex,
  searchBox,
  searchName,
} from "./city-gazetteer.js";
import {
  MAX_GPX_FILE_BYTES,
  cacheToGazetteerRow,
  createGpxPreservationBag,
  parseGeomateGpx,
  safeGpxFilename,
} from "./gpx-geocache.js";

const $ = (id) => document.getElementById(id);
const CITY_ID = document.body.dataset.city || "lawrence";

const DATA_LOADERS = {
  lawrence: () => import("./city-subsurface-data-lawrence.js"),
  atlanta: () => import("./city-subsurface-data-atlanta.js"),
  kansascity: () => import("./city-subsurface-data-kansascity.js"),
  buffalo: () => import("./city-subsurface-data-buffalo.js"),
  toronto: () => import("./city-subsurface-data-toronto.js"),
};
const GAZ_LOADERS = {
  lawrence: () => import("./city-gazetteer-data-lawrence.js"),
  atlanta: () => import("./city-gazetteer-data-atlanta.js"),
  kansascity: () => import("./city-gazetteer-data-kansascity.js"),
  buffalo: () => import("./city-gazetteer-data-buffalo.js"),
  toronto: () => import("./city-gazetteer-data-toronto.js"),
};
const DEM_LOADERS = {
  lawrence: async () => {
    try {
      return await import("./city-dem-grid-lawrence-highres.js");
    } catch {
      return import("./city-dem-grid-lawrence.js");
    }
  },
  atlanta: () => import("./city-dem-grid-atlanta.js"),
  kansascity: () => import("./city-dem-grid-kansascity.js"),
  buffalo: () => import("./city-dem-grid-buffalo.js"),
  toronto: () => import("./city-dem-grid-toronto.js"),
};

if (!DATA_LOADERS[CITY_ID] || !GAZ_LOADERS[CITY_ID]) {
  throw new Error(`unknown city: ${CITY_ID}`);
}

const data = await DATA_LOADERS[CITY_ID]();
const gazPack = await GAZ_LOADERS[CITY_ID]();
const {
  CITY,
  BBOX,
  CENTER,
  COAST,
  CORRIDORS,
  KM_PER_DEG_LAT,
  LAYERS,
  NODES,
  RELIEF,
  TIER_COLOR,
  UNITS_PER_KM,
  VIEWS,
} = data;
const GAZ_META = gazPack.GAZ_META;
const GAZ_ROWS = gazPack.GAZ_ROWS;

/* ------------------------------------------------------------------ guards */

const canvas = $("stage");
const gl = canvas && (canvas.getContext("webgl2") || canvas.getContext("webgl"));
if (!gl) {
  const fb = document.createElement("div");
  fb.className = "fallback";
  fb.textContent = "WebGL is unavailable in this webview, so the 3D city cannot render.";
  document.body.append(fb);
  throw new Error("no-webgl");
}

/* ------------------------------------------------------------- projection */

const COS_LAT = Math.cos((CENTER.lat * Math.PI) / 180);
const scale = { vert: 6, depth: 14 };

function project(lon, lat) {
  const x = (lon - CENTER.lon) * KM_PER_DEG_LAT * COS_LAT * UNITS_PER_KM;
  const z = -(lat - CENTER.lat) * KM_PER_DEG_LAT * UNITS_PER_KM;
  return [x, z];
}

function lonLatFromXZ(x, z) {
  const lat = CENTER.lat - z / (KM_PER_DEG_LAT * UNITS_PER_KM);
  const lon = CENTER.lon + x / (KM_PER_DEG_LAT * COS_LAT * UNITS_PER_KM);
  return [lon, lat];
}

const elevY = (m) => (m / 1000) * UNITS_PER_KM * 10 * scale.vert * 0.1;

function depthY(m) {
  if (!m) return 0;
  const mag = 0.35 + 0.45 * Math.log10(1 + Math.abs(m));
  return -mag * (scale.depth / 10);
}

function pathKm(path) {
  let km = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const dx = (path[i + 1][0] - path[i][0]) * KM_PER_DEG_LAT * COS_LAT;
    const dy = (path[i + 1][1] - path[i][1]) * KM_PER_DEG_LAT;
    km += Math.hypot(dx, dy);
  }
  return km;
}

/* ------------------------------------------------------------- DEM hook */

let DEM = null;
let demDisclosure = "";
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
function installDem(grid) {
  if (!grid || !Number.isInteger(grid.nx) || !Number.isInteger(grid.ny) || grid.nx < 2 || grid.ny < 2) return false;
  if (![grid.lon0, grid.lon1, grid.lat0, grid.lat1].every(Number.isFinite) || !(grid.lon0 < grid.lon1 && grid.lat0 < grid.lat1)) return false;
  if (!grid.data || grid.data.length !== grid.nx * grid.ny) return false;
  if (grid.lon1 < BBOX.lon0 || grid.lon0 > BBOX.lon1 || grid.lat1 < BBOX.lat0 || grid.lat0 > BBOX.lat1) return false;
  const samples = grid.data instanceof Int16Array || grid.data instanceof Float32Array ? grid.data : Float32Array.from(grid.data);
  if (Array.from(samples).some((value) => !Number.isFinite(value))) return false;
  DEM = { ...grid, data: samples };
  return true;
}
function demInfo() {
  if (!DEM) return null;
  return {
    nx: DEM.nx,
    ny: DEM.ny,
    bbox: { lon0: DEM.lon0, lat0: DEM.lat0, lon1: DEM.lon1, lat1: DEM.lat1 },
    source: DEM.source || "USGS 3DEP",
    resolution: DEM.resolution || `${DEM.nx}×${DEM.ny} point samples (not a full-resolution raster)`,
    sampleSpacing: DEM.sampleSpacing || "spacing not stated",
    sourceRasterResolutionMeters: DEM.sourceRasterResolutionMeters ?? null,
    verticalDatum: DEM.verticalDatum || "vertical datum not stated",
    retrieved: DEM.retrieved || "retrieval date unstated",
    disclosure: DEM.disclosure || "Sparse samples are interpolated for display, not survey control.",
  };
}
function demSample(lon, lat) {
  if (!DEM || lon < BBOX.lon0 || lon > BBOX.lon1 || lat < BBOX.lat0 || lat > BBOX.lat1) return null;
  const { lon0, lon1, lat0, lat1, nx, ny, data } = DEM;
  // Sparse grids stop just inside the frame. Clamp only that narrow rim to
  // the nearest sample; never extrapolate the surface outside the city frame.
  const fx = clamp(((lon - lon0) / (lon1 - lon0)) * (nx - 1), 0, nx - 1);
  const fy = clamp(((lat1 - lat) / (lat1 - lat0)) * (ny - 1), 0, ny - 1);
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const x1 = Math.min(x0 + 1, nx - 1);
  const y1 = Math.min(y0 + 1, ny - 1);
  const tx = fx - x0;
  const ty = fy - y0;
  const a = data[y0 * nx + x0];
  const b = data[y0 * nx + x1];
  const c = data[y1 * nx + x0];
  const d = data[y1 * nx + x1];
  return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty;
}
function elevationAt(lon, lat) {
  if (DEM) {
    const s = demSample(lon, lat);
    if (s !== null) return s;
  }
  let e = CITY.baseElevationM ?? 220;
  for (const f of RELIEF) {
    const dx = lon - f.lon;
    const dy = lat - f.lat;
    const c = Math.cos(f.rot || 0);
    const s = Math.sin(f.rot || 0);
    const u = (dx * c + dy * s) / f.rx;
    const v = (-dx * s + dy * c) / f.ry;
    e += f.amp * Math.exp(-(u * u + v * v) * 1.5);
  }
  e += (CITY.roughnessM ?? 25) * (Math.sin(lon * 21.3 + lat * 13.7) + Math.sin(lon * 9.1 - lat * 31.4)) * 0.5;
  return e;
}

let demStatus = "synthetic relief field (RELIEF gaussians)";
try {
  const demMod = await DEM_LOADERS[CITY_ID]();
  const grid = demMod.DEM ?? demMod.default;
  if (!grid || !installDem(grid)) throw new Error(`${CITY_ID} DEM grid is missing or invalid`);
  const info = demInfo();
  const sourcePixels = info.sourceRasterResolutionMeters == null
    ? "source pixel resolution unstated"
    : `${info.sourceRasterResolutionMeters} m source pixels (not grid spacing)`;
  demStatus = `${info.source} · ${info.nx}×${info.ny} point samples · ${info.sampleSpacing} · ${sourcePixels} · ${info.verticalDatum} · ${info.retrieved}`;
  demDisclosure = info.disclosure;
} catch (error) {
  if (CITY.requiresDem) throw new Error(`${CITY.title} requires a bundled, valid USGS DEM grid; refusing synthetic relief`, { cause: error });
  /* Cities without a checked-in DEM remain explicitly labelled as synthetic. */
  demDisclosure = "Synthetic RELIEF field; not USGS terrain.";
}
if (CITY.requiresDem && !DEM) throw new Error(`${CITY.title} requires a bundled DEM; refusing synthetic relief`);

/* ------------------------------------------------------------------ scene */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05080d);
const FOG = new THREE.Fog(0x05080d, 45, 130);
scene.fog = FOG;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));

const camera = new THREE.PerspectiveCamera(48, 1, 0.5, 500);
camera.position.set(8, 18, 28);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI * 0.495;
controls.minDistance = 1.5;
controls.maxDistance = 90;
controls.target.set(0, 0, 0);

scene.add(new THREE.HemisphereLight(0x7fb2d9, 0x0a1118, 0.9));
const key = new THREE.DirectionalLight(0xfff0d8, 1.0);
key.position.set(-30, 50, 25);
scene.add(key);

const world = new THREE.Group();
scene.add(world);

const groups = {};
for (const l of LAYERS) {
  const g = new THREE.Group();
  g.name = l.id;
  g.visible = !!l.on;
  groups[l.id] = g;
  world.add(g);
}

/* ---------------------------------------------------------------- terrain */

const SEG_X = 160;
const SEG_Y = 120;
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
  const [lon, lat] = lonLatFromXZ(posAttr.getX(i), posAttr.getZ(i));
  const e = elevationAt(lon, lat);
  elevM[i] = e;
  posAttr.setY(i, elevY(e));
  if (e < 0) c.setHSL(0.58, 0.55, 0.12 + Math.max(-0.08, e / 9000));
  else if (e < 120) c.setHSL(0.33 - e / 3000, 0.28, 0.18 + e / 2500);
  else if (e < 400) c.setHSL(0.11, 0.32, 0.22 + e / 3800);
  else if (e < 900) c.setHSL(0.07, 0.2, 0.3 + e / 7000);
  else c.setHSL(0.6, 0.06, 0.55);
  colors[i * 3] = c.r;
  colors[i * 3 + 1] = c.g;
  colors[i * 3 + 2] = c.b;
}
terrainGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
terrainGeo.computeVertexNormals();
const terrainMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.96, metalness: 0.02 });
const terrain = new THREE.Mesh(terrainGeo, terrainMat);
groups.terrain.add(terrain);

const wire = new THREE.Mesh(terrainGeo, new THREE.MeshBasicMaterial({ color: 0x1d4a68, wireframe: true, transparent: true, opacity: 0.16 }));
wire.visible = false;
groups.terrain.add(wire);

const sea = new THREE.Mesh(
  new THREE.PlaneGeometry(W, D).rotateX(-Math.PI / 2).translate(X0 + W / 2, elevY(0), Z0 + D / 2),
  new THREE.MeshStandardMaterial({ color: 0x08283c, transparent: true, opacity: 0.72, roughness: 0.35 }),
);
if (CITY.hasWater) groups.terrain.add(sea);

if (COAST && COAST.length > 1) {
  const pts = COAST.map(([lon, lat]) => {
    const [x, z] = project(lon, lat);
    return new THREE.Vector3(x, elevY(Math.max(0, elevationAt(lon, lat))) + 0.05, z);
  });
  groups.terrain.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x4fd0ff, transparent: true, opacity: 0.55 })));
}

const subGrid = new THREE.GridHelper(Math.max(W, D), 24, 0x1a3346, 0x11212e);
subGrid.position.y = depthY(-3000);
subGrid.material.transparent = true;
subGrid.material.opacity = 0.35;
groups.terrain.add(subGrid);

/* -------------------------------------------------------------- corridors */

const PICKABLE = [];

function resample(path, step = 0.04) {
  const out = [];
  for (let i = 0; i < path.length - 1; i++) {
    const [aLon, aLat] = path[i];
    const [bLon, bLat] = path[i + 1];
    const d = Math.hypot(bLon - aLon, bLat - aLat);
    const n = Math.max(2, Math.ceil(d / step));
    for (let k = 0; k < n; k++) out.push([aLon + (bLon - aLon) * (k / n), aLat + (bLat - aLat) * (k / n)]);
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

function corridorRadius(item) {
  if (item.layer === "water") return 0.14;
  if (item.layer === "rail") return 0.1;
  if (item.layer === "underground") return 0.075;
  if (item.layer === "trails" || item.layer === "roads") return 0.05;
  return 0.09;
}

const corridorMeshes = [];
for (const item of CORRIDORS) {
  const layer = LAYERS.find((l) => l.id === item.layer);
  if (!layer) continue;
  const pts = corridorPoints(item);
  const curve = new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.15);
  const radius = corridorRadius(item);
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, Math.min(500, pts.length * 3), radius, 7, false),
    new THREE.MeshStandardMaterial({ color: new THREE.Color(layer.color), emissive: new THREE.Color(layer.color).multiplyScalar(0.28), roughness: 0.4, metalness: 0.25 }),
  );
  mesh.userData = { record: item, kind: "corridor" };
  groups[item.layer].add(mesh);
  PICKABLE.push(mesh);
  corridorMeshes.push({ item, mesh, curve });

  if (item.depthM < 0) {
    const tie = [];
    for (let i = 0; i < pts.length; i += Math.max(4, Math.floor(pts.length / 18))) {
      const p = pts[i];
      const [lon, lat] = lonLatFromXZ(p.x, p.z);
      tie.push(p.clone(), new THREE.Vector3(p.x, elevY(elevationAt(lon, lat)), p.z));
    }
    groups[item.layer].add(new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints(tie),
      new THREE.LineBasicMaterial({ color: new THREE.Color(layer.color), transparent: true, opacity: 0.28 }),
    ));
  }
}

/* ------------------------------------------------------------------ nodes */

function nodeHeadGeometry(kind) {
  switch (kind) {
    case "geocache":
      return new THREE.OctahedronGeometry(0.13, 0);
    case "airport":
      return new THREE.BoxGeometry(0.42, 0.075, 0.18);
    case "harbor":
      return new THREE.TorusKnotGeometry(0.12, 0.035, 40, 6);
    case "factory":
      return new THREE.BoxGeometry(0.26, 0.26, 0.26);
    case "park":
      return new THREE.IcosahedronGeometry(0.18, 0);
    case "base":
      return new THREE.BoxGeometry(0.26, 0.26, 0.26);
    case "university":
      return new THREE.ConeGeometry(0.18, 0.36, 5);
    case "bunker":
      return new THREE.BoxGeometry(0.28, 0.16, 0.22);
    default:
      return new THREE.SphereGeometry(0.16, 14, 10);
  }
}

const nodeMeshes = [];
for (const node of NODES) {
  const layer = LAYERS.find((l) => l.id === node.layer);
  if (!layer) continue;
  const [x, z] = project(node.lon, node.lat);
  const g = new THREE.Group();
  g.position.set(x, elevY(elevationAt(node.lon, node.lat)), z);
  const color = new THREE.Color(TIER_COLOR[node.tier] || layer.color);
  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.75, 6),
    new THREE.MeshStandardMaterial({ color, emissive: color.clone().multiplyScalar(0.3), roughness: 0.5 }),
  );
  mast.position.y = 0.375;
  g.add(mast);
  const head = new THREE.Mesh(
    nodeHeadGeometry(node.kind),
    new THREE.MeshStandardMaterial({ color, emissive: color.clone().multiplyScalar(0.45), roughness: 0.35, metalness: 0.2 }),
  );
  head.position.y = 0.9;
  head.userData = { record: node, kind: "node" };
  g.add(head);
  PICKABLE.push(head);
  if (node.depthM < 0) {
    const y = depthY(node.depthM);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, Math.abs(y), 5), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5 }));
    shaft.position.y = y / 2;
    g.add(shaft);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.75 }));
    bulb.position.y = y;
    g.add(bulb);
  }
  groups[node.layer].add(g);
  nodeMeshes.push({ node, group: g, head });
}

/* ------------------------------------------------- ADL/GNIS + geocaches */

// Label host first: addGazEntry() creates a callout per register row.
const labelHost = $("labels");
const gazRows = [...GAZ_ROWS];
const gazIdx = makeGazetteerIndex(gazRows);
const gazMeshes = [];
const gazHeadByIdx = new Map();

/**
 * Draw one ADL GCS entry as a pin. Called for the static pack at boot and again
 * for every waypoint a local GPX import adds, so the register stays one code
 * path for GNIS names and community geocaches.
 */
function addGazEntry(e) {
  const meta = GAZ_CLASS_META[e.fclass] ?? { swatch: "#9db2d1", short: "GNIS" };
  const color = new THREE.Color(meta.swatch);
  if (!e.verified) color.multiplyScalar(0.55);
  const [x, z] = project(e.lon, e.lat);
  const g = new THREE.Group();
  g.position.set(x, elevY(elevationAt(e.lon, e.lat)), z);
  const isCache = e.fclass === "Geocache";
  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.014, isCache ? 0.28 : 0.34, 5),
    new THREE.MeshBasicMaterial({ color, transparent: !e.verified, opacity: e.verified ? 1 : 0.72 }),
  );
  mast.position.y = (isCache ? 0.28 : 0.34) / 2;
  g.add(mast);
  const head = new THREE.Mesh(
    isCache
      ? new THREE.OctahedronGeometry(0.085, 0)
      : new THREE.ConeGeometry(0.07, 0.17, 5).rotateX(Math.PI),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: e.verified ? 0.95 : 0.62 }),
  );
  head.position.y = isCache ? 0.34 : 0.4;
  const record = {
    id: isCache ? `geocache-${e.i}` : `gaz-${e.i}`,
    name: e.name,
    layer: isCache ? "geocaches" : "gazetteer",
    tier: e.verified ? "official" : "community",
    lon: e.lon,
    lat: e.lat,
    kind: isCache ? "geocache" : "gaz",
    depthM: 0,
    facts: [
      isCache
        ? `Geocache class → community.geocache (separate source tier; not a GNIS feature)`
        : `GNIS class: ${e.fclass} → ADL FTT facet ${e.ftt}`,
      `county/region: ${e.county}`,
      e.elev !== null
        ? `elevation ${e.elev.toLocaleString()} m (${Math.round(e.elev * 3.281).toLocaleString()} ft)`
        : "elevation not asserted",
      e.gnis
        ? `GNIS FEATURE_ID ${e.gnis} — official USGS record`
        : isCache
          ? "community cache record — coordinate and code from the cited public source"
          : "curated city register row — no verified FEATURE_ID claimed",
      ...(e.note ? [e.note] : []),
    ],
    sources: isCache
      ? [e.note || "public geocache listing", "Geocaching.com cache page"]
      : [
          "USGS U.S. Board on Geographic Names / GNIS (17 USC 105)",
          e.gnis ? `USGS GNIS FEATURE_ID ${e.gnis}` : "curated city gazetteer seed (this repo)",
        ],
  };
  head.userData = { record, kind: record.kind, gazIdx: e.i };
  g.add(head);
  PICKABLE.push(head);
  groups[isCache ? "geocaches" : "gazetteer"].add(g);

  const label = document.createElement("div");
  label.className = `lbl gaz t-${e.verified ? "official" : "community"}`;
  label.textContent = e.name.slice(0, 34);
  labelHost.append(label);

  gazMeshes.push({ entry: e, group: g, head, label });
  gazHeadByIdx.set(e.i, head);
  refreshGazClasses();
}

for (const e of gazIdx.entries) addGazEntry(e);

/* ----------------------------------------------------------------- labels */

const labelEls = new Map();
for (const { node } of nodeMeshes) {
  const el = document.createElement("div");
  el.className = `lbl t-${node.tier}`;
  el.textContent = node.name.split("—")[0].trim().slice(0, 38);
  labelHost.append(el);
  labelEls.set(node.id, el);
}
const gazHitIds = new Set();

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

function isVisible(obj) {
  let o = obj;
  while (o) {
    if (o.visible === false) return false;
    o = o.parent;
  }
  return true;
}

function refreshCounts() {
  const on = LAYERS.filter((l) => groups[l.id].visible).length;
  if (hud.layers) hud.layers.textContent = `${on}/${LAYERS.length}`;
  if (hud.objects) hud.objects.textContent = String(PICKABLE.filter(isVisible).length);
}

/* ------------------------------------------------------------ layer panel */

const layerHost = $("layerList");
for (const l of LAYERS) {
  const row = document.createElement("label");
  row.className = "layer-row";
  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.checked = !!l.on;
  cb.addEventListener("change", () => {
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

/* ------------------------------------------------------- gazetteer panel */

const gazFacetSel = $("gazFacet");
const gazClassesHost = $("gazClasses");
const gazQuery = $("gazQuery");
const gazHits = $("gazHits");
const gazCaps = $("gazCaps");
const gazState = { facet: "", classes: null };
const gazClassToggles = [];

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

/** Rebuild the class chips from whichever rows the register currently holds. */
function refreshGazClasses() {
  if (!gazClassesHost) return;
  gazClassesHost.textContent = "";
  gazClassToggles.length = 0;
  gazState.classes = null;
  for (const cl of classRollup(gazRows)) {
    const row = document.createElement("label");
    row.className = "gaz-chip";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = true;
    cb.addEventListener("change", () => {
      const selected = gazClassToggles.filter((t) => t.el.checked).map((t) => t.fclass);
      gazState.classes = selected.length === gazClassToggles.length ? null : new Set(selected);
      runGazSearch();
    });
    const dot = document.createElement("span");
    dot.className = "swatch";
    dot.style.background = cl.swatch;
    const txt = document.createElement("span");
    txt.textContent = `${cl.label} ${cl.count}`;
    row.append(cb, dot, txt);
    gazClassesHost.append(row);
    gazClassToggles.push({ el: cb, fclass: cl.fclass });
  }
}

function focusGazEntry(e) {
  const head = gazHeadByIdx.get(e.i);
  const found = gazMeshes.find((m) => m.entry.i === e.i);
  if (!found) return;
  const [x, z] = project(e.lon, e.lat);
  const y = elevY(elevationAt(e.lon, e.lat));
  camera.position.set(x + 4, y + 8, z + 6);
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
  for (const h of hits.slice(0, 40)) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "gaz-hit" + (h.verified ? " verified" : "");
    const meta = GAZ_CLASS_META[h.fclass] ?? { short: "GNIS", swatch: "#9db2d1" };
    const detail = mode === "box"
      ? `${meta.short} · ${h.county}`
      : `${h.distKm !== undefined ? `${h.distKm.toFixed(1)} km · ` : ""}${meta.short} · ${h.county}${h.elev != null ? ` · ${h.elev} m` : ""}`;
    btn.innerHTML = `<span class="gaz-hit-name"></span><span class="gaz-hit-meta"></span>`;
    btn.querySelector(".gaz-hit-name").textContent = h.name;
    btn.querySelector(".gaz-hit-meta").textContent = detail;
    btn.style.setProperty("--gaz", meta.swatch);
    btn.addEventListener("click", () => focusGazEntry(h));
    li.append(btn);
    gazHits.append(li);
  }
}

function runGazSearch() {
  const q = gazQuery ? gazQuery.value : "";
  if (!q || q.trim().length < 2) {
    renderGazHits([], "name");
    return;
  }
  const hits = searchName(gazIdx, q, { facet: gazState.facet, classes: gazState.classes, limit: 40 });
  renderGazHits(hits, "name");
  setStatus(`search-name · ${hits.length} hit${hits.length === 1 ? "" : "s"}`);
}

let gazTimer = 0;
gazQuery?.addEventListener("input", () => {
  clearTimeout(gazTimer);
  gazTimer = setTimeout(runGazSearch, 90);
});

$("gazBox")?.addEventListener("click", () => {
  const [lonC, latC] = lonLatFromXZ(controls.target.x, controls.target.z);
  const camDist = camera.position.distanceTo(controls.target);
  const spanKm = (camDist / UNITS_PER_KM) * 0.5;
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

$("gazClear")?.addEventListener("click", () => {
  if (gazQuery) gazQuery.value = "";
  renderGazHits([], "name");
  setStatus("gazetteer cleared");
});

if (gazCaps) {
  gazCaps.textContent = `${GAZ_META.rowCount} names · ${GAZ_META.verified} verified · EPSG:4326`;
}

/* ------------------------------------------ local GPX → geocache register */

const gpxInput = $("gpxFile");
const gpxImportButton = $("gpxImport");
const gpxExportButton = $("gpxExportBag");
const gpxClearButton = $("gpxClear");
const gpxImportStatus = $("gpxImportStatus");
let gpxImport = null;
let importedEntries = [];

function setGpxStatus(message) {
  if (gpxImportStatus) gpxImportStatus.textContent = message;
}

/** Add parsed GPX caches to the live register and draw one pin per cache. */
function addImportedRows(rows) {
  const added = appendGazetteerRows(gazIdx, rows);
  for (let i = 0; i < added.length; i += 1) {
    gazRows.push(rows[i]);
    addGazEntry(added[i]);
    importedEntries.push(added[i]);
  }
  refreshCounts();
}

function clearImportedCaches() {
  if (!importedEntries.length) {
    setGpxStatus("No local GPX import to clear.");
    return;
  }
  const removed = new Set(importedEntries.map((entry) => entry.i));
  for (const entry of importedEntries) {
    const foundIndex = gazMeshes.findIndex((m) => m.entry.i === entry.i);
    if (foundIndex >= 0) {
      const [mesh] = gazMeshes.splice(foundIndex, 1);
      mesh.head.geometry.dispose();
      mesh.head.material.dispose();
      mesh.group.removeFromParent();
      mesh.label.remove();
      const pick = PICKABLE.indexOf(mesh.head);
      if (pick >= 0) PICKABLE.splice(pick, 1);
    }
    gazHeadByIdx.delete(entry.i);
    gazHitIds.delete(entry.i);
  }
  gazIdx.entries = gazIdx.entries.filter((entry) => !removed.has(entry.i));
  gazRows.length = 0;
  gazRows.push(...GAZ_ROWS);
  importedEntries = [];
  gpxImport = null;
  if (gpxInput) gpxInput.value = "";
  if (gpxExportButton) gpxExportButton.disabled = true;
  if (gpxClearButton) gpxClearButton.disabled = true;
  refreshGazClasses();
  renderGazHits([], "name");
  refreshCounts();
  setGpxStatus("Local GPX import cleared. Nothing remains in this session.");
  setStatus("geocache import cleared");
}

if (gpxImportButton) {
  gpxImportButton.addEventListener("click", async () => {
    const file = gpxInput?.files?.[0];
    if (!file) {
      setGpxStatus("Choose a .gpx file first.");
      return;
    }
    if (file.size > MAX_GPX_FILE_BYTES) {
      setGpxStatus(`Import refused: file exceeds ${Math.floor(MAX_GPX_FILE_BYTES / (1024 * 1024))} MiB.`);
      return;
    }
    gpxImportButton.disabled = true;
    setGpxStatus("Parsing GPX locally…");
    try {
      const parsed = parseGeomateGpx(await file.text(), { sourceName: file.name, bounds: BBOX });
      clearImportedCaches();
      addImportedRows(parsed.inFrameCaches.map((cache) => cacheToGazetteerRow(cache, parsed.sourceName)));
      gpxImport = { parsed, sourceFile: file };
      if (gpxExportButton) gpxExportButton.disabled = false;
      if (gpxClearButton) gpxClearButton.disabled = false;
      const { stats } = parsed;
      setGpxStatus(
        `${safeGpxFilename(file.name)} · GPX ${parsed.gpxVersion} · ${stats.cacheWaypoints} cache waypoint(s), ` +
          `${stats.importedToMap} inside this frame, ${stats.outOfFrame} outside` +
          `${stats.duplicates ? `, ${stats.duplicates} duplicate` : ""}` +
          `${stats.invalidCoordinates ? `, ${stats.invalidCoordinates} invalid` : ""}. Held in memory only.`,
      );
      setStatus(`GPX import · ${stats.importedToMap} local cache(s) added to the gazetteer`);
      runGazSearch();
    } catch (error) {
      gpxImport = null;
      if (gpxExportButton) gpxExportButton.disabled = true;
      if (gpxClearButton) gpxClearButton.disabled = true;
      setGpxStatus(`Import failed: ${error.message}`);
    } finally {
      gpxImportButton.disabled = false;
    }
  });
}

if (gpxExportButton) {
  gpxExportButton.addEventListener("click", async () => {
    if (!gpxImport) return;
    gpxExportButton.disabled = true;
    setGpxStatus("Building the preservation bag…");
    try {
      const bag = await createGpxPreservationBag(gpxImport);
      const url = URL.createObjectURL(new Blob([bag.bytes], { type: "application/zip" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = bag.fileName;
      link.rel = "noopener";
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      setGpxStatus(
        `Downloaded ${bag.fileName} · source SHA-256 ${bag.originalSha256} · bag SHA-256 ${bag.zipSha256}` +
          `${bag.complete ? "" : " · normalized rendition is capped; the original is complete"}.`,
      );
    } catch (error) {
      setGpxStatus(`Preservation export failed: ${error.message}`);
    } finally {
      gpxExportButton.disabled = false;
    }
  });
}

if (gpxClearButton) gpxClearButton.addEventListener("click", clearImportedCaches);

/* --------------------------------------------------------- PIP + controls */

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
      pip.style.left = `${Math.min(Math.max(0, ev.clientX - dx), innerWidth - 60)}px`;
      pip.style.top = `${Math.min(Math.max(0, ev.clientY - dy), innerHeight - 30)}px`;
    };
    const up = () => {
      head.removeEventListener("pointermove", move);
      head.removeEventListener("pointerup", up);
    };
    head.addEventListener("pointermove", move);
    head.addEventListener("pointerup", up);
  });
  const min = pip.querySelector("[data-min]");
  min?.addEventListener("click", () => {
    pip.classList.toggle("min");
    min.textContent = pip.classList.contains("min") ? "+" : "–";
  });
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
const camMarker = new THREE.Mesh(new THREE.ConeGeometry(1.2, 3, 4), new THREE.MeshBasicMaterial({ color: 0xffffff }));
camMarker.rotation.x = Math.PI / 2;
camMarker.visible = false;
scene.add(camMarker);

/* --------------------------------------------------------------- controls */

const viewSelect = $("viewSelect");
if (viewSelect) {
  for (const v of VIEWS) {
    const opt = document.createElement("option");
    opt.value = v.id;
    opt.textContent = v.label;
    viewSelect.append(opt);
  }
}

function flyTo(name) {
  const v = VIEWS.find((x) => x.id === name) || VIEWS[0];
  if (!v) return;
  camera.position.set(...v.position);
  controls.target.set(...v.target);
  controls.update();
  setStatus(`view · ${v.id}`);
}

$("btnReset")?.addEventListener("click", () => flyTo(VIEWS[0]?.id));
viewSelect?.addEventListener("change", (e) => flyTo(e.target.value));

const btnWire = $("btnWire");
btnWire?.addEventListener("click", () => {
  wire.visible = !wire.visible;
  btnWire.setAttribute("aria-pressed", String(wire.visible));
});

const btnXray = $("btnXray");
let xray = false;
btnXray?.addEventListener("click", () => {
  xray = !xray;
  btnXray.setAttribute("aria-pressed", String(xray));
  terrainMat.opacity = xray ? 0.32 : 1;
  terrainMat.transparent = xray;
  terrainMat.depthWrite = !xray;
  terrainMat.needsUpdate = true;
  sea.visible = !xray && !!CITY.hasWater;
  setStatus(xray ? "x-ray · terrain transparent, buried systems exposed" : "x-ray off");
});

const btnLabels = $("btnLabels");
let labelsOn = true;
btnLabels?.addEventListener("click", () => {
  labelsOn = !labelsOn;
  btnLabels.setAttribute("aria-pressed", String(labelsOn));
  labelHost.style.display = labelsOn ? "" : "none";
});

$("depthExag")?.addEventListener("input", (e) => {
  scale.depth = Number(e.target.value);
  $("depthExagVal").textContent = `${scale.depth}×`;
  rebuildDepths();
});
$("vertExag")?.addEventListener("input", (e) => {
  scale.vert = Number(e.target.value);
  $("vertExagVal").textContent = `${scale.vert}×`;
  for (let i = 0; i < posAttr.count; i++) posAttr.setY(i, elevY(elevM[i]));
  posAttr.needsUpdate = true;
  terrainGeo.computeVertexNormals();
  sea.position.y = elevY(0);
  rebuildDepths();
});

function rebuildDepths() {
  for (const entry of corridorMeshes) {
    const pts = corridorPoints(entry.item);
    entry.curve = new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.15);
    const old = entry.mesh.geometry;
    entry.mesh.geometry = new THREE.TubeGeometry(entry.curve, Math.min(500, pts.length * 3), corridorRadius(entry.item), 7, false);
    old.dispose();
  }
  for (const { node, group } of nodeMeshes) group.position.y = elevY(elevationAt(node.lon, node.lat));
  for (const { entry, group } of gazMeshes) group.position.y = elevY(elevationAt(entry.lon, entry.lat));
  subGrid.position.y = depthY(-3000);
}

/* ----------------------------------------------------------- detail panel */

const detailBody = $("detailBody");
const fmtLL = ([lon, lat]) => `${lat.toFixed(3)}°N ${Math.abs(lon).toFixed(3)}°W`;

function renderDetail(record) {
  if (!record) {
    detailBody.innerHTML = "";
    const p = document.createElement("p");
    p.className = "hint";
    p.textContent = "Click a corridor, node, gazetteer pin or geocache for its dossier. Drag to orbit, wheel to zoom, right-drag to pan.";
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
  if (record.lon !== undefined) rows.push(["position", fmtLL([record.lon, record.lat])]);
  if (record.path) {
    rows.push(["endpoints", `${fmtLL(record.path[0])} → ${fmtLL(record.path[record.path.length - 1])}`]);
    rows.push(["plotted", `${pathKm(record.path).toFixed(1)} km (generalized)`]);
  }
  if (record.depthM) rows.push(["depth class", `${record.depthM < -500 ? `${(record.depthM / 1000).toFixed(1)} km` : `${Math.abs(record.depthM)} m`} below grade`]);
  for (const [k, v] of rows) {
    const dt = document.createElement("dt");
    dt.textContent = k;
    const dd = document.createElement("dd");
    dd.textContent = v;
    dl.append(dt, dd);
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
  if (src.childElementCount) {
    const sh = document.createElement("p");
    sh.className = "hint";
    sh.style.margin = "8px 0 0";
    sh.textContent = "sources";
    detailBody.append(sh, src);
  }
}

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
  setStatus(`selected · ${rec.name}`);
  broadcast(rec);
  $("pipDetail")?.classList.remove("min");
}

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

renderer.domElement.addEventListener("pointermove", (e) => {
  const r = renderer.domElement.getBoundingClientRect();
  pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
  pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects([terrain], false)[0];
  if (!hit) return;
  const [lon, lat] = lonLatFromXZ(hit.point.x, hit.point.z);
  const e = elevationAt(lon, lat);
  if (hud.lonlat) hud.lonlat.textContent = `${lat.toFixed(3)}N ${Math.abs(lon).toFixed(3)}W`;
  if (hud.elev) hud.elev.textContent = `${Math.round(e)} m (${Math.round(e * 3.281)} ft)`;
});

/* ------------------------------------------------------------ webxdc wire */

const xdc = typeof globalThis !== "undefined" ? globalThis.webxdc : null;
let xdcReady = false;
if (xdc && typeof xdc.setUpdateListener === "function") {
  xdc.setUpdateListener((update) => {
    const p = update.payload;
    if (!p || !p.id || p.from === (xdc.selfAddr || "")) return;
    const el = $("peer");
    if (el) el.textContent = `peer → ${p.name}`;
  }, 0).then(() => {
    xdcReady = true;
    const el = $("peer");
    if (el) el.textContent = "webxdc · shared selections on";
  }).catch(() => {});
}

function broadcast(record) {
  if (!xdc || !xdcReady || !record) return;
  try {
    xdc.sendUpdate(
      { payload: { id: record.id, name: record.name, from: xdc.selfAddr }, info: `${xdc.selfName} looked at ${record.name}`, summary: record.name },
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
    const onScreen = v3.z < 1 && Math.abs(v3.x) < 1.05 && Math.abs(v3.y) < 1.05 && dist < 80;
    el.style.display = onScreen ? "" : "none";
    if (!onScreen) continue;
    el.style.left = `${((v3.x + 1) / 2) * w}px`;
    el.style.top = `${((1 - v3.y) / 2) * h - 16}px`;
    el.style.opacity = String(Math.max(0.25, 1 - dist / 90));
  }
  for (const { label } of gazMeshes) label.style.display = "none";
  const near = [];
  for (let gi = 0; gi < gazMeshes.length; gi += 1) {
    const { entry, head } = gazMeshes[gi];
    if (!isVisible(head)) continue;
    head.getWorldPosition(v3);
    const dist = camera.position.distanceTo(v3);
    if (gazHitIds.has(entry.i)) near.push({ gi, head, dist: 0 });
    else if (dist < 18) near.push({ gi, head, dist });
  }
  near.sort((a, b) => a.dist - b.dist);
  for (const n of near.slice(0, 12)) {
    const el = gazMeshes[n.gi].label;
    n.head.getWorldPosition(v3);
    v3.project(camera);
    if (v3.z >= 1 || Math.abs(v3.x) > 1.05 || Math.abs(v3.y) > 1.05) continue;
    el.style.display = "";
    el.style.left = `${((v3.x + 1) / 2) * w}px`;
    el.style.top = `${((1 - v3.y) / 2) * h + 2}px`;
    el.style.opacity = String(n.dist === 0 ? 1 : Math.max(0.3, 1 - n.dist / 22));
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
  if (hud.cam) hud.cam.textContent = `${camera.position.x.toFixed(1)}, ${camera.position.y.toFixed(1)}, ${camera.position.z.toFixed(1)}`;
  if (hud.target) {
    const [lon, lat] = lonLatFromXZ(controls.target.x, controls.target.z);
    hud.target.textContent = `${lat.toFixed(3)}N ${Math.abs(lon).toFixed(3)}W`;
  }
  renderer.render(scene, camera);
  if (miniRenderer && miniCam) {
    camMarker.visible = true;
    camMarker.position.set(camera.position.x, 40, camera.position.z);
    const dir = new THREE.Vector3().subVectors(controls.target, camera.position).setY(0).normalize();
    camMarker.rotation.z = -Math.atan2(dir.x, -dir.z);
    scene.fog = null;
    miniRenderer.render(scene, miniCam);
    scene.fog = FOG;
    camMarker.visible = false;
  }
}

if ($("demSource")) {
  $("demSource").textContent = `source · ${demStatus}`;
  $("demSource").title = demDisclosure;
}
flyTo(VIEWS[0]?.id);
refreshCounts();
setStatus(`ready · ${CITY.title} — schematic only; not a survey, not a dig ticket, call 811`);
requestAnimationFrame(tick);
