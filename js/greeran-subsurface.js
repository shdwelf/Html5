/**
 * GREERAN SUBSURFACE 4Dwm — the biography deep-dive theater.
 *
 * The SOCAL SUBSURFACE engine, re-aimed at a life: the Glendora → Goleta
 * transect as terrain, the 2001 turning point as strata, evidence tiers as
 * color, and a time scrubber as the fourth dimension. The master timeline
 * keeps events in order; the tier system keeps memory separate from record.
 *
 * Schematic biography theater. Not a survey.
 */

import * as THREE from "../vendor/three.module.min.js";
import { OrbitControls } from "../vendor/OrbitControls.js";
import {
  BBOX,
  CENTER,
  COAST,
  CORRIDORS,
  DEFAULT_TIME,
  LAND_BASE_M,
  LAYERS,
  NODES,
  RELIEF,
  TIME_MAX,
  TIME_MIN,
  TIMELINE,
  TIER_COLOR,
  TIER_LABEL,
  VIEWS,
  lonLatFromXZ,
  project,
} from "./greeran-subsurface-data.js";

const $ = (id) => document.getElementById(id);

/* ------------------------------------------------------------- geo field */

const VERT_EXAG = 0.09; // metres -> scene units (≈ 1:0.9 at 10 km/unit)

function reliefAt(lon, lat) {
  let z = 0;
  for (const g of RELIEF) {
    const dx = (lon - g.lon) * Math.cos((lat * Math.PI) / 180);
    const dy = lat - g.lat;
    z += g.h * Math.exp(-(dx * dx + dy * dy) / (g.s * g.s));
  }
  return z;
}

export function elevationAt(lon, lat) {
  return reliefAt(lon, lat) + LAND_BASE_M;
}

function dist2ToSeg(lon, lat, a, b) {
  const k = Math.cos((lat * Math.PI) / 180);
  const ax = a[0] * k, ay = a[1];
  const bx = b[0] * k, by = b[1];
  const px = lon * k, py = lat;
  const abx = bx - ax, aby = by - ay;
  const ab2 = abx * abx + aby * aby || 1e-12;
  const t = Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / ab2));
  const dx = px - ax - abx * t;
  const dy = py - ay - aby * t;
  return dx * dx + dy * dy;
}

/** Schematic ocean test: inside the coast+bbox-edge polygon. */
const ISLANDS = [
  { lon0: -119.92, lon1: -119.5, lat0: 33.88, lat1: 34.06 }, // Santa Cruz Island
  { lon0: -120.25, lon1: -119.95, lat0: 33.87, lat1: 34.03 }, // Santa Rosa Island
  { lon0: -119.46, lon1: -119.34, lat0: 33.97, lat1: 34.03 }, // Anacapa
];
export function inOcean(lon, lat) {
  // Coast runs SE (bottom edge) to NW (left edge). A point is ocean when it
  // lies south-west of the polyline: cast east and count crossings.
  for (const isl of ISLANDS) {
    if (lon >= isl.lon0 && lon <= isl.lon1 && lat >= isl.lat0 && lat <= isl.lat1) return false;
  }
  let crossings = 0;
  for (let i = 0; i < COAST.length - 1; i++) {
    const a = COAST[i];
    const b = COAST[i + 1];
    if (a[1] === b[1]) continue;
    const yMin = Math.min(a[1], b[1]);
    const yMax = Math.max(a[1], b[1]);
    if (lat < yMin || lat >= yMax) continue;
    const t = (lat - a[1]) / (b[1] - a[1]);
    const xHit = a[0] + (b[0] - a[0]) * t;
    if (xHit > lon) crossings++;
  }
  return crossings % 2 === 1;
}

/* ------------------------------------------------------------ scene shell */

const canvas = $("stage");
function webglAvailable() {
  try {
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x04070c);
scene.fog = new THREE.Fog(0x04070c, 30, 140);

if (!webglAvailable()) {
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#04070c";
    ctx.fillRect(0, 0, canvas.width || 900, canvas.height || 600);
    ctx.fillStyle = "#cfe8ff";
    ctx.font = "14px ui-monospace, monospace";
    ctx.fillText("WebGL required for the Greeran Subsurface 4Dwm theater", 24, 44);
  }
  throw new Error("WebGL unavailable — biography theater halted.");
}

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 900);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.maxPolarAngle = Math.PI * 0.495;

scene.add(new THREE.AmbientLight(0x8fa8c8, 0.85));
const sun = new THREE.DirectionalLight(0xfff0d8, 1.05);
sun.position.set(24, 34, 14);
scene.add(sun);
const rim = new THREE.DirectionalLight(0x5cd6ff, 0.3);
rim.position.set(-20, 10, -26);
scene.add(rim);

/* Stage extents in scene units. */
const [X0, Z0] = project(BBOX.lon0, BBOX.lat1);
const [X1, Z1] = project(BBOX.lon1, BBOX.lat0);
const W = X1 - X0;
const D = Z1 - Z0;

/* ------------------------------------------------------------------ groups */

const groups = {};
for (const layer of LAYERS) groups[layer.id] = new THREE.Group();
const terrainGroup = new THREE.Group();
scene.add(terrainGroup, ...Object.values(groups));

/* ------------------------------------------------------------------ terrain */

const SEG_X = 210;
const SEG_Y = 160;

const terrainGeo = new THREE.PlaneGeometry(W, D, SEG_X, SEG_Y);
terrainGeo.rotateX(-Math.PI / 2);
const posAttr = terrainGeo.attributes.position;

const c = new THREE.Color();
function landColor(elev) {
  // Sea level green to alpine gray-lavender, subdued.
  if (elev < 60) return c.setHSL(0.24, 0.16, 0.16).clone();
  if (elev < 400) return c.setHSL(0.22, 0.14, 0.2).clone();
  if (elev < 1100) return c.setHSL(0.16, 0.12, 0.26).clone();
  if (elev < 2000) return c.setHSL(0.09, 0.1, 0.32).clone();
  return c.setHSL(0.08, 0.06, 0.42).clone();
}

const colors = new Float32Array(posAttr.count * 3);
for (let i = 0; i < posAttr.count; i++) {
  const x = posAttr.getX(i) - W / 2; // PlaneGeometry is centered; recenter to X0..X1
  const z = posAttr.getZ(i) - D / 2;
  const [lon, lat] = lonLatFromXZ(x, z);
  const ocean = inOcean(lon, lat);
  const e = ocean ? 0 : elevationAt(lon, lat);
  posAttr.setX(i, x);
  posAttr.setZ(i, z);
  posAttr.setY(i, e * VERT_EXAG);
  const col = ocean ? c.setHSL(0.58, 0.5, 0.1).clone() : landColor(e);
  colors[i * 3] = col.r;
  colors[i * 3 + 1] = col.g;
  colors[i * 3 + 2] = col.b;
}
terrainGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
terrainGeo.computeVertexNormals();

const terrain = new THREE.Mesh(
  terrainGeo,
  new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.96, metalness: 0.02, flatShading: false })
);
terrain.userData.pick = true;
terrainGroup.add(terrain);

const wire = new THREE.Mesh(
  terrainGeo,
  new THREE.MeshBasicMaterial({ color: 0x3d7a8a, wireframe: true, transparent: true, opacity: 0.05 })
);
wire.visible = false;
terrainGroup.add(wire);

/* Sea: translucent sheet over the ocean polygon (coast + bbox corners). */
{
  const shapePts = COAST.map(([lon, lat]) => {
    const [x, z] = project(lon, lat);
    return new THREE.Vector2(x, -z);
  });
  shapePts.push(new THREE.Vector2(...(() => {
    const [x, z] = project(BBOX.lon0, BBOX.lat0);
    return [x, -z];
  })()));
  const seaShape = new THREE.Shape(shapePts);
  const seaGeo = new THREE.ShapeGeometry(seaShape);
  seaGeo.rotateX(-Math.PI / 2);
  const sea = new THREE.Mesh(
    seaGeo,
    new THREE.MeshStandardMaterial({
      color: 0x0d2f4a,
      transparent: true,
      opacity: 0.78,
      roughness: 0.25,
      metalness: 0.55,
    })
  );
  sea.position.y = 0.12;
  sea.userData.pick = true;
  terrainGroup.add(sea);
}

/* Base frame. */
const frame = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(W, 0.02, D)),
  new THREE.LineBasicMaterial({ color: 0x1d3a52, transparent: true, opacity: 0.8 })
);
frame.position.y = -0.02;
terrainGroup.add(frame);

/* -------------------------------------------------------------- corridors */

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

const PICKABLE = [];
const corridorMeshes = [];

for (const item of CORRIDORS) {
  const layer = LAYERS.find((l) => l.id === item.layer);
  const pts = resample(item.path).map(([lon, lat]) => {
    const [x, z] = project(lon, lat);
    const y = elevationAt(lon, lat) * VERT_EXAG + 0.16;
    return new THREE.Vector3(x, y, z);
  });
  const curve = new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.12);
  const geo = new THREE.TubeGeometry(curve, Math.min(500, pts.length * 2), 0.075, 6, false);
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(layer.color),
    emissive: new THREE.Color(layer.color).multiplyScalar(0.3),
    roughness: 0.45,
    metalness: 0.25,
    transparent: true,
    opacity: 0.92,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.userData = { record: item, kind: "corridor" };
  groups[item.layer].add(mesh);
  PICKABLE.push(mesh);
  corridorMeshes.push({ item, mesh, layer });
}

/* ------------------------------------------------------------------ nodes */

function nodeHeadGeometry(kind) {
  switch (kind) {
    case "campus":
      return new THREE.OctahedronGeometry(0.3);
    case "school":
      return new THREE.BoxGeometry(0.42, 0.12, 0.28);
    case "dorm":
      return new THREE.BoxGeometry(0.26, 0.4, 0.26);
    case "library":
      return new THREE.BoxGeometry(0.4, 0.14, 0.3);
    case "dining":
      return new THREE.CylinderGeometry(0.2, 0.24, 0.14, 10);
    case "tv":
      return new THREE.BoxGeometry(0.4, 0.28, 0.06);
    case "radio":
      return new THREE.TorusGeometry(0.2, 0.05, 8, 20).rotateX(Math.PI / 2);
    case "press":
      return new THREE.BoxGeometry(0.34, 0.22, 0.05);
    case "platform":
      return new THREE.CylinderGeometry(0.18, 0.14, 0.5, 6);
    case "seep":
      return new THREE.SphereGeometry(0.2, 10, 8);
    case "peak":
      return new THREE.ConeGeometry(0.26, 0.42, 5);
    case "lake":
      return new THREE.SphereGeometry(0.22, 12, 8).scale(1.4, 0.5, 1);
    case "cinema":
      return new THREE.TetrahedronGeometry(0.26);
    case "theater":
      return new THREE.CylinderGeometry(0.24, 0.3, 0.3, 8);
    case "bus":
      return new THREE.BoxGeometry(0.46, 0.18, 0.2);
    case "tavern":
      return new THREE.BoxGeometry(0.26, 0.26, 0.26);
    case "rock":
      return new THREE.TetrahedronGeometry(0.3);
    case "ruin":
      return new THREE.TorusKnotGeometry(0.14, 0.045, 42, 6);
    case "tent":
      return new THREE.ConeGeometry(0.26, 0.36, 6);
    case "grove":
      return new THREE.ConeGeometry(0.22, 0.42, 7);
    case "flag":
      return new THREE.BoxGeometry(0.05, 0.5, 0.26);
    case "house":
      return new THREE.BoxGeometry(0.3, 0.22, 0.3);
    case "terminal":
      return new THREE.BoxGeometry(0.34, 0.26, 0.26);
    case "systems":
      return new THREE.TorusKnotGeometry(0.16, 0.05, 46, 8);
    case "book":
      return new THREE.BoxGeometry(0.3, 0.09, 0.22);
    case "shop":
      return new THREE.BoxGeometry(0.24, 0.24, 0.24);
    case "org":
      return new THREE.IcosahedronGeometry(0.24, 0);
    case "memory":
      return new THREE.OctahedronGeometry(0.17, 0);
    default:
      return new THREE.SphereGeometry(0.2, 12, 10);
  }
}

const nodeMeshes = [];

for (const node of NODES) {
  const [x, z] = project(node.lon, node.lat);
  const surf = elevationAt(node.lon, node.lat) * VERT_EXAG;
  const g = new THREE.Group();
  g.position.set(x, surf, z);
  const color = new THREE.Color(TIER_COLOR[node.tier]);

  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 1.0, 6),
    new THREE.MeshStandardMaterial({ color, emissive: color.clone().multiplyScalar(0.3), roughness: 0.5 })
  );
  mast.position.y = 0.5;
  g.add(mast);

  const head = new THREE.Mesh(
    nodeHeadGeometry(node.kind),
    new THREE.MeshStandardMaterial({ color, emissive: color.clone().multiplyScalar(0.5), roughness: 0.35, metalness: 0.2 })
  );
  head.position.y = 1.1;
  head.userData = { record: node, kind: "node" };
  g.add(head);
  PICKABLE.push(head);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.26, 0.34, 28).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.45, side: THREE.DoubleSide })
  );
  ring.position.y = 0.02;
  g.add(ring);

  groups[node.layer].add(g);
  nodeMeshes.push({ node, group: g, head, ring, layer: LAYERS.find((l) => l.id === node.layer) });
}

/* ------------------------------------------------------------------ labels */

const labelHost = $("labels");
const labelEls = new Map();

function ensureLabel(id, text, tier) {
  let el = labelEls.get(id);
  if (!el) {
    el = document.createElement("span");
    el.className = `label tier-${tier}`;
    el.textContent = text;
    labelHost.appendChild(el);
    labelEls.set(id, el);
  }
  return el;
}

/* ----------------------------------------------------------- time machine */

let time = DEFAULT_TIME;
let showAllEras = false;

function timeLabel(t) {
  const year = Math.floor(t);
  const m = Math.min(11, Math.max(0, Math.round((t - year) * 12) - 1));
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[m]} ${year}`;
}

function nodeActive(node, t) {
  return t >= node.era[0] && t <= node.era[1];
}

function eraOpacity(node, t) {
  const fade = 0.35;
  const [a, b] = node.era;
  if (t >= a && t <= b) return 1;
  if (t > b && t < b + fade) return 1 - (t - b) / fade;
  if (t < a && t > a - fade) return 1 - (a - t) / fade;
  return 0;
}

function applyTime() {
  for (const rec of nodeMeshes) {
    const active = nodeActive(rec.node, time);
    const visible = showAllEras || active || eraOpacity(rec.node, time) > 0.02;
    rec.group.visible = visible;
    const dim = showAllEras && !active ? 0.35 : 1;
    rec.head.material.emissiveIntensity = dim;
    rec.ring.material.opacity = 0.45 * dim;
  }
  for (const rec of corridorMeshes) {
    const [a, b] = rec.layer.era;
    const active = time >= a && time <= b;
    rec.mesh.visible = showAllEras || active;
    rec.mesh.material.opacity = showAllEras && !active ? 0.25 : 0.92;
  }
  const chip = $("timeChip");
  if (chip) chip.textContent = `T ${timeLabel(time)}`;
  const scrub = $("timeScrub");
  if (scrub && Math.abs(Number(scrub.value) - time) > 0.01) scrub.value = String(time);
  const readout = $("timeReadout");
  if (readout) readout.textContent = `${timeLabel(time)} · ${time.toFixed(2)}`;
}

function setTime(t, { clamp = true } = {}) {
  if (clamp) t = Math.min(TIME_MAX, Math.max(TIME_MIN, t));
  time = t;
  applyTime();
}

/* ------------------------------------------------------------------ layers */

const layerState = new Map(LAYERS.map((l) => [l.id, l.on]));

function buildLayerList() {
  const host = $("layerList");
  if (!host) return;
  host.textContent = "";
  for (const layer of LAYERS) {
    const row = document.createElement("label");
    row.className = "layer-row";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = layerState.get(layer.id);
    cb.addEventListener("change", () => {
      layerState.set(layer.id, cb.checked);
      groups[layer.id].visible = cb.checked;
      updateHudCounts();
    });
    const sw = document.createElement("span");
    sw.className = "swatch";
    sw.style.background = layer.color;
    const txt = document.createElement("span");
    txt.textContent = layer.label;
    const era = document.createElement("small");
    era.textContent = eraText(layer.era);
    row.append(cb, sw, txt, era);
    host.appendChild(row);
  }
}

function eraText([a, b]) {
  return `${Math.floor(a)}–${Math.floor(b)}`;
}

/* ----------------------------------------------------------------- search */

function buildSearchIndex() {
  const rows = [];
  for (const n of NODES) rows.push({ type: "node", ref: n, hay: `${n.short} ${n.label} ${n.note}`.toLowerCase() });
  for (const t of TIMELINE) rows.push({ type: "event", ref: t, hay: t.text.toLowerCase() });
  return rows;
}
const searchIndex = buildSearchIndex();

function runSearch(q) {
  const host = $("searchResults");
  if (!host) return;
  host.textContent = "";
  const query = q.trim().toLowerCase();
  if (query.length < 2) return;
  const hits = searchIndex.filter((r) => r.hay.includes(query)).slice(0, 14);
  for (const hit of hits) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `hit tier-${hit.type === "node" ? hit.ref.tier : hit.ref.tier}`;
    const lead = document.createElement("b");
    lead.textContent = hit.type === "node" ? hit.ref.label : hit.ref.date;
    const sub = document.createElement("span");
    sub.textContent = hit.type === "node" ? hit.ref.dateLabel : hit.ref.text;
    btn.append(lead, document.createElement("br"), sub);
    btn.addEventListener("click", () => {
      if (hit.type === "node") {
        flyToNode(hit.ref);
        setTime(hit.ref.era[0] + 0.05);
      } else {
        setTime(hit.ref.sort);
        if (hit.ref.nodeId) {
          const n = NODES.find((x) => x.id === hit.ref.nodeId);
          if (n) flyToNode(n);
        }
      }
    });
    host.appendChild(btn);
  }
}

/* --------------------------------------------------------------- timeline */

function buildTimeline() {
  const host = $("timelineList");
  if (!host) return;
  host.textContent = "";
  const rows = [...TIMELINE].sort((a, b) => a.sort - b.sort);
  for (const entry of rows) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `tl-row tier-${entry.tier}`;
    btn.dataset.sort = String(entry.sort);
    const dot = document.createElement("span");
    dot.className = "dot";
    dot.style.background = TIER_COLOR[entry.tier];
    const date = document.createElement("b");
    date.textContent = entry.date;
    const text = document.createElement("span");
    text.textContent = entry.text;
    btn.append(dot, date, document.createElement("br"), text);
    btn.addEventListener("click", () => {
      setTime(entry.sort);
      if (entry.nodeId) {
        const n = NODES.find((x) => x.id === entry.nodeId);
        if (n) flyToNode(n);
      }
      setStatus(`${entry.date} — ${entry.text}`);
    });
    host.appendChild(btn);
  }
}

function markTimeline() {
  const rows = $("timelineList")?.querySelectorAll(".tl-row") ?? [];
  let lastNear = null;
  for (const r of rows) {
    const s = Number(r.dataset.sort);
    r.classList.toggle("past", s <= time);
    if (s <= time) lastNear = r;
  }
  for (const r of rows) r.classList.toggle("current", r === lastNear);
  lastNear?.scrollIntoView({ block: "nearest" });
}

/* ------------------------------------------------------------------- info */

function showInfo(node) {
  const title = $("infoTitle");
  const body = $("infoBody");
  if (!title || !body) return;
  title.textContent = node ? node.label : "Scene notes";
  body.textContent = "";
  if (node) {
    const chip = document.createElement("span");
    chip.className = `tier-chip tier-${node.tier}`;
    chip.textContent = TIER_LABEL[node.tier] ?? node.tier;
    const era = document.createElement("p");
    era.className = "small";
    era.textContent = node.dateLabel
      ? `${node.dateLabel}${node.era ? ` · era ${eraText(node.era)}` : ""}`
      : node.era
        ? `era ${eraText(node.era)}`
        : "";
    const note = document.createElement("p");
    note.textContent = node.note ?? "";
    body.append(chip, era, note);
  } else {
    const p = document.createElement("p");
    p.textContent =
      "Scrub the timeline to walk 2001 in order: applications, graduation, the ESGVROP summer, the move to UCSB, and on up to the Amgen years on GMR.";
    const p2 = document.createElement("p");
    p2.className = "small";
    p2.textContent = "Node color = evidence tier. Amber official, cyan community, violet context, magenta memory.";
    body.append(p, p2);
  }
}

function setStatus(text) {
  const el = $("status");
  if (el) el.textContent = text;
}

/* ------------------------------------------------------------------ flying */

function flyToNode(node) {
  const [x, z] = project(node.lon, node.lat);
  const y = elevationAt(node.lon, node.lat) * VERT_EXAG;
  controls.target.set(x, y + 0.55, z);
  camera.position.set(x + 2.6, y + 1.15, z + 2.9);
  controls.update();
  showInfo(node);
  setStatus(`${node.short} · ${node.label}`);
}

function anchorPoint(ids) {
  let x = 0, z = 0, y = 0, n = 0;
  for (const id of ids) {
    const node = NODES.find((m) => m.id === id);
    if (!node) continue;
    const [px, pz] = project(node.lon, node.lat);
    x += px;
    z += pz;
    y += elevationAt(node.lon, node.lat) * VERT_EXAG;
    n++;
  }
  if (!n) return new THREE.Vector3(0, 0, 0);
  return new THREE.Vector3(x / n, y / n, z / n);
}

function gotoView(view) {
  const t = anchorPoint(view.anchor);
  controls.target.copy(t);
  camera.position.set(t.x + view.off[0], Math.max(t.y + view.off[1], 0.8), t.z + view.off[2]);
  controls.update();
  setStatus(view.note);
  showInfo(null);
}

/* -------------------------------------------------------------------- VRML */

function fmt(n) {
  return Number(n).toFixed(3);
}

function buildVrml() {
  const L = [];
  L.push("#VRML V2.0 utf8");
  L.push("# GREERAN SUBSURFACE 4Dwm — biography transect export");
  L.push(`# generated ${new Date().toISOString()}`);
  L.push("WorldInfo { title \"Greeran Subsurface 4Dwm - biography transect\" }");
  L.push("NavigationInfo { type [ \"EXAMINE\" \"ANY\" ] }");
  L.push("Viewpoint { position 12 14 16 description \"transect\" }");
  L.push("Background { skyColor [ 0.02 0.03 0.05 ] }");

  // Terrain elevation grid, decimated.
  const stepX = 8;
  const stepY = 6;
  const nx = Math.floor(SEG_X / stepX) + 1;
  const ny = Math.floor(SEG_Y / stepY) + 1;
  const height = [];
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const vi = j * stepY * (SEG_X + 1) + i * stepX;
      height.push(fmt(posAttr.getY(vi) * 10));
    }
  }
  L.push(`DEF TERRAIN Transform { translation 0 0 0 children [ Shape { geometry ElevationGrid {`);
  L.push(`  xDimension ${nx} zDimension ${ny} xSpacing ${fmt((W / (nx - 1)) * 10)} zSpacing ${fmt((D / (ny - 1)) * 10)}`);
  L.push(`  creaseAngle 0.9 height [ ${height.join(" ")} ] }`);
  L.push("  appearance Appearance { material Material { diffuseColor 0.16 0.2 0.17 } } } ] }");

  // Corridors as polylines.
  let ci = 0;
  for (const item of CORRIDORS) {
    const layer = LAYERS.find((l) => l.id === item.layer);
    const col = new THREE.Color(layer.color);
    const pts = resample(item.path, 0.1).map(([lon, lat]) => {
      const [x, z] = project(lon, lat);
      return `${fmt(x * 10)} ${fmt(elevationAt(lon, lat) * VERT_EXAG * 10 + 2)} ${fmt(z * 10)}`;
    });
    L.push(`DEF CORRIDOR_${ci++} Shape { geometry IndexedLineSet { coordIndex [ ${pts.map((_, k) => k).join(", ")} -1 ]`);
    L.push(`  coord Coordinate { point [ ${pts.join(", ")} ] } }`);
    L.push(`  appearance Appearance { material Material { emissiveColor ${fmt(col.r)} ${fmt(col.g)} ${fmt(col.b)} diffuseColor ${fmt(col.r)} ${fmt(col.g)} ${fmt(col.b)} } } }`);
  }

  // Nodes as spheres.
  let ni = 0;
  for (const node of NODES) {
    const [x, z] = project(node.lon, node.lat);
    const y = elevationAt(node.lon, node.lat) * VERT_EXAG;
    const col = new THREE.Color(TIER_COLOR[node.tier]);
    L.push(`DEF NODE_${ni++}_${node.id} Transform { translation ${fmt(x * 10)} ${fmt(y * 10 + 12)} ${fmt(z * 10)} children [`);
    L.push(`  Shape { geometry Sphere { radius 6 } appearance Appearance { material Material { emissiveColor ${fmt(col.r)} ${fmt(col.g)} ${fmt(col.b)} diffuseColor ${fmt(col.r)} ${fmt(col.g)} ${fmt(col.b)} } } }`);
    L.push(`  Billboard { children [ Shape { geometry Text { string [ \"${node.short}\" ] fontStyle FontStyle { size 9 } } appearance Appearance { material Material { emissiveColor 1 1 0.8 } } } ] } ] }`);
  }
  return L.join("\n");
}

function downloadText(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: "model/vrml" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/* ------------------------------------------------------------------ picking */

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function pointerToRay(ev) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
}

function pick(ev) {
  pointerToRay(ev);
  const hits = raycaster.intersectObjects(PICKABLE, false);
  const hit = hits.find((h) => h.object.userData?.record);
  if (hit) {
    const rec = hit.object.userData.record;
    if (hit.object.userData.kind === "node") {
      flyToNode(rec);
    } else {
      const layer = LAYERS.find((l) => l.id === rec.layer);
      showInfo({ ...rec, note: rec.note ?? `Corridor layer: ${layer?.label ?? rec.layer}.` });
      setStatus(`${rec.label} (corridor)`);
    }
    return;
  }
  const ground = raycaster.intersectObject(terrain)[0];
  if (ground) {
    const [lon, lat] = lonLatFromXZ(ground.point.x, ground.point.z);
    const el = $("coords");
    if (el) el.textContent = `${lat.toFixed(4)} N · ${Math.abs(lon).toFixed(4)} W · ${elevationAt(lon, lat).toFixed(0)} m`;
  }
}

/* ------------------------------------------------------------------ labels */

function updateLabels() {
  const w = renderer.domElement.clientWidth;
  const h = renderer.domElement.clientHeight;
  const v = new THREE.Vector3();
  for (const rec of nodeMeshes) {
    const el = ensureLabel(rec.node.id, rec.node.offFrame ? `${rec.node.offFrameDir} ${rec.node.short}` : rec.node.short, rec.node.tier);
    if (!rec.group.visible) {
      el.style.display = "none";
      continue;
    }
    rec.head.getWorldPosition(v);
    v.y += 0.35;
    v.project(camera);
    if (v.z > 1 || v.z < -1) {
      el.style.display = "none";
      continue;
    }
    const px = (v.x * 0.5 + 0.5) * w;
    const py = (-v.y * 0.5 + 0.5) * h;
    const hidden = px < -60 || px > w + 60 || py < -60 || py > h + 60;
    el.style.display = hidden ? "none" : "block";
    if (!hidden) {
      el.style.left = `${px}px`;
      el.style.top = `${py}px`;
    }
  }
}

/* ---------------------------------------------------------------- HUD bits */

function updateHudCounts() {
  const el = $("hudObjects");
  if (!el) return;
  const visible = nodeMeshes.filter((r) => r.group.visible && groups[r.node.layer].visible).length;
  el.textContent = `${visible}/${NODES.length} nodes · ${TIMELINE.length} timeline rows`;
}

function updateCamHud() {
  const el = $("hudCam");
  if (el) el.textContent = `${camera.position.x.toFixed(1)}, ${camera.position.y.toFixed(1)}, ${camera.position.z.toFixed(1)}`;
}

/* --------------------------------------------------------------------- boot */

function resize() {
  const w = canvas.clientWidth || window.innerWidth;
  const h = canvas.clientHeight || window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}

function boot() {
  if (!webglAvailable()) {
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#04070c";
      ctx.fillRect(0, 0, canvas.width || 800, canvas.height || 600);
      ctx.fillStyle = "#cfe8ff";
      ctx.font = "14px ui-monospace, monospace";
      ctx.fillText("WebGL required for the biography 4Dwm", 20, 40);
    }
    setStatus("WebGL unavailable");
    return;
  }

  resize();
  buildLayerList();
  buildTimeline();
  showInfo(null);

  const viewSelect = $("viewSelect");
  if (viewSelect) {
    for (const v of VIEWS) {
      const opt = document.createElement("option");
      opt.value = v.id;
      opt.textContent = v.label;
      viewSelect.appendChild(opt);
    }
    viewSelect.addEventListener("change", () => {
      const v = VIEWS.find((x) => x.id === viewSelect.value);
      if (v) gotoView(v);
    });
  }
  gotoView(VIEWS[0]);

  const scrub = $("timeScrub");
  if (scrub) {
    scrub.min = String(TIME_MIN);
    scrub.max = String(TIME_MAX);
    scrub.step = "0.01";
    scrub.value = String(time);
    scrub.addEventListener("input", () => {
      setTime(Number(scrub.value));
      markTimeline();
      updateHudCounts();
    });
  }
  const play = $("timePlay");
  if (play) {
    play.addEventListener("click", () => {
      if (play.dataset.run === "1") {
        play.dataset.run = "0";
        play.textContent = "▶ PLAY";
        return;
      }
      play.dataset.run = "1";
      play.textContent = "❙❙ PAUSE";
    });
  }
  const allEras = $("allEras");
  if (allEras) {
    allEras.addEventListener("change", () => {
      showAllEras = allEras.checked;
      applyTime();
      updateHudCounts();
    });
  }

  const searchBox = $("searchBox");
  if (searchBox) searchBox.addEventListener("input", () => runSearch(searchBox.value));

  $("btnReset")?.addEventListener("click", () => gotoView(VIEWS[0]));
  $("btnWire")?.addEventListener("click", (e) => {
    wire.visible = !wire.visible;
    e.currentTarget.setAttribute("aria-pressed", String(wire.visible));
  });
  let labelsOn = true;
  $("btnLabels")?.addEventListener("click", (e) => {
    labelsOn = !labelsOn;
    labelHost.style.display = labelsOn ? "block" : "none";
    e.currentTarget.setAttribute("aria-pressed", String(labelsOn));
  });
  let xray = false;
  $("btnXray")?.addEventListener("click", (e) => {
    xray = !xray;
    terrain.material.opacity = xray ? 0.35 : 1;
    terrain.material.transparent = xray;
    terrain.material.needsUpdate = true;
    e.currentTarget.setAttribute("aria-pressed", String(xray));
  });
  $("btnVrml")?.addEventListener("click", () => {
    downloadText("greeran-subsurface.wrl", buildVrml());
    setStatus("WRL exported");
  });

  document.querySelectorAll("[data-min]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const panel = btn.closest(".pip");
      panel?.classList.toggle("min");
      btn.textContent = panel?.classList.contains("min") ? "+" : "–";
    });
  });

  renderer.domElement.addEventListener("click", pick);
  window.addEventListener("resize", resize, { passive: true });

  applyTime();
  markTimeline();
  updateHudCounts();
  setStatus(`${NODES.length} nodes · ${CORRIDORS.length} corridors · ${TIMELINE.length} timeline rows · tier colors = evidence class`);

  let last = performance.now();
  let fpsAcc = 0, fpsN = 0;
  const fpsEl = $("hudFps");

  function animate(now) {
    requestAnimationFrame(animate);
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (play?.dataset.run === "1") {
      setTime(time + dt * 0.35);
      markTimeline();
    }
    const t = now * 0.001;
    for (const rec of nodeMeshes) {
      if (!rec.group.visible) continue;
      rec.ring.scale.setScalar(1 + 0.14 * Math.sin(t * 1.9 + rec.node.lon));
    }
    controls.update();
    updateLabels();
    updateCamHud();
    renderer.render(scene, camera);

    fpsAcc += dt;
    fpsN++;
    if (fpsAcc >= 0.5 && fpsEl) {
      fpsEl.textContent = `${Math.round(fpsN / fpsAcc)} fps`;
      fpsAcc = 0;
      fpsN = 0;
    }
  }
  requestAnimationFrame(animate);
}

boot();

export { time, setTime, NODES, TIMELINE, LAYERS, TIER_COLOR };
