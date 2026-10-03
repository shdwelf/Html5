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
  depthY,
  elevY,
  elevationAt,
  lonLatFromXZ,
  pathKm,
  project,
  scale,
} from "./socal-geo.js";
import { buildOverlays } from "./socal-overlays.js";
import { FIRE_SOURCE_URLS } from "./socal-overlays-data.js";
import { OFF_FRAME } from "./socal-sites-extended.js";

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

/* --------------------------------------------------------------- overlays */

// Vector overlay pack: fire perimeters, DEM/quad index frames, SAR swath and
// deformation fringes, CLUI register captions. Same projection, same surface.
const overlays = buildOverlays();
world.add(overlays.root);
PICKABLE.push(...overlays.pickables);

const OVERLAY_DEFS = [
  { id: "fires", name: "Fire perimeters (WIFIRE / FRAP lineage)", color: "#ea580c", on: true, group: () => overlays.groups.fires },
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
  subGrid.position.y = depthY(-3000);
  overlays.rebuild();
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
