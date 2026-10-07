/**
 * INGRESS INTEL 4Dwm — the viewer.
 *
 * Two stages, one frame. A planet (geodesic links, spherical fields, a real
 * day/night terminator) and a Los Angeles basin plate that reuses the SoCal
 * theater's projection, relief field and optional 3DEP grid — so the same
 * captured getEntities payload draws identically on both.
 *
 * The frame arrives from one of six places, ranked in js/ingress-intel-data.js:
 * same-origin against the intel map, a relay you run, a public CORS proxy (which
 * cannot carry a session and is shown failing for that reason), a payload you
 * paste or drop, a webxdc broadcast from another agent, or the offline register
 * this repo generates over USGS gazetteer coordinates. The app boots by walking
 * that ladder for real and printing what happened, because the honest answer to
 * "can you connect to Ingress?" is a status table, not a claim.
 *
 * Nothing drawn here is a survey, a scout report, or a statement about who holds
 * what. Portal state that is not live is synthetic and says so in its dossier.
 */

import * as THREE from "../vendor/three.module.min.js";
import { OrbitControls } from "../vendor/OrbitControls.js";
import {
  BUILD_PROBE,
  DEFAULT_THEATER,
  FACTIONS,
  LADDER,
  LAYERS,
  LEVEL_COLORS,
  RULES,
  SOURCE_URLS,
  THEATERS,
} from "./ingress-intel-data.js";
import {
  ageText,
  buildIntelPermalink,
  contactFront,
  fieldMu,
  parseIntelPermalink,
  scoreFrame,
  sphericalTriangleKm2,
  tileParams,
  toCSV,
  toGeoJSON,
  toKML,
} from "./ingress-intel-proto.js";
import { createFeed } from "./ingress-intel-feed.js";
import { SIM_NOTICE, SIM_SOURCES, buildGlobalSimFrame, buildSimFrame } from "./ingress-intel-sim.js";
import { buildStars, createGlobe, lonLatToVec3, subdivideTriangle, vec3ToLonLat } from "./ingress-intel-globe.js";
import { GAZ_ROWS } from "./socal-gazetteer-data.js";
import { makeGazetteerIndex, searchName, searchPoint } from "./socal-gazetteer.js";
import { demInfo, elevationAt, elevY, installDem, lonLatFromXZ, project, scale } from "./socal-geo.js";

const $ = (id) => document.getElementById(id);

/* ------------------------------------------------------------------ guards */

const canvas = $("stage");
const gl = canvas && (canvas.getContext("webgl2") || canvas.getContext("webgl"));
if (!gl) {
  const fb = document.createElement("div");
  fb.className = "fallback";
  fb.textContent = "WebGL is unavailable in this webview, so the intel theater cannot render. The FEED panel's readers still work in a browser with WebGL.";
  document.body.append(fb);
  throw new Error("no-webgl");
}

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* --------------------------------------------------------------- the DEM */

/**
 * Same optional asset as SOCAL SUBSURFACE: if scripts/fetch-3dep-dem.py has
 * generated js/socal-dem-grid.js, both theaters switch from the synthetic
 * relief field to measured ground, because both sample elevation through
 * socal-geo.elevationAt(). Absent, the catch keeps the synthetic field and the
 * HUD says which one is in use.
 */
let demStatus = "synthetic relief field (inherited from the SoCal theater)";
// The specifier is a variable, not a literal, and carries @vite-ignore: a bundler
// that resolves imports statically would fail the whole module over an asset that
// is *meant* to be absent. Left dynamic, the miss is just a rejected promise and
// the catch below does what the catch is for.
const DEM_ASSET = "./socal-dem-grid.js";
try {
  const mod = await import(/* @vite-ignore */ DEM_ASSET);
  const grid = mod.DEM ?? mod.default;
  if (grid && installDem({ ...grid, data: grid.data instanceof Int16Array || grid.data instanceof Float32Array ? grid.data : Int16Array.from(grid.data) })) {
    const info = demInfo();
    demStatus = `USGS 3DEP grid ${info.nx}×${info.ny} · ${info.resolution} · retrieved ${info.retrieved}`;
  }
} catch {
  /* no DEM asset present — the synthetic field stands in, as documented */
}

/* ------------------------------------------------------------- state */

const state = {
  view: DEFAULT_THEATER,
  xray: false,
  showLabels: true,
  linkFilterKm: 160,
  lift: 1,
  frame: null,
  own: [],
  peers: [],
  hover: null,
  selected: null,
  tileParamsUsed: null,
  feedSummary: { rung: "sim", live: false, detail: "offline register", age: null, tiles: 0, requests: 0 },
};

let theater = THEATERS[state.view];

function setStatus(text) {
  const el = $("status");
  if (el) el.textContent = text;
}
function setSys(text) {
  const el = $("sysline");
  if (el) el.textContent = text;
}

/* --------------------------------------------------------------- scene */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x04070c);
const FOG = new THREE.Fog(0x04070c, 60, 220);
scene.fog = FOG;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));

const camera = new THREE.PerspectiveCamera(48, 1, 0.5, 900);
camera.position.set(14, 22, 34);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 3;
controls.maxDistance = 140;
controls.target.set(0, 0, 2);

scene.add(new THREE.HemisphereLight(0x8fc4ff, 0x0a1118, 0.85));
const key = new THREE.DirectionalLight(0xfff2dd, 1.05);
key.position.set(-50, 70, 40);
scene.add(key);
const rim = new THREE.DirectionalLight(0x4aa3ff, 0.5);
rim.position.set(60, -20, -50);
scene.add(rim);

const basinWorld = new THREE.Group();
const globeWorld = new THREE.Group();
scene.add(basinWorld, globeWorld);

/** Intel layer groups exist per stage; only the active stage holds records. */
const groups = { basin: {}, globe: {} };
for (const stageKey of ["basin", "globe"]) {
  const host = stageKey === "basin" ? basinWorld : globeWorld;
  for (const l of LAYERS) {
    const g = new THREE.Group();
    g.name = `${stageKey}:${l.id}`;
    groups[stageKey][l.id] = g;
    host.add(g);
  }
}

/* --------------------------------------------------------------- stages */

const PICKABLE = [];

const basinStage = {
  key: "basin",
  host: basinWorld,
  groups: groups.basin,
  terrain: null,
  wire: null,
  build(bbox) {
    const SEG_X = 150;
    const SEG_Y = 120;
    const [x0, z0] = project(bbox.lon0, bbox.lat1);
    const [x1, z1] = project(bbox.lon1, bbox.lat0);
    const W = x1 - x0;
    const D = z1 - z0;
    const geo = new THREE.PlaneGeometry(W, D, SEG_X, SEG_Y);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    const elevM = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) {
      const lon = bbox.lon0 + ((pos.getX(i) - x0) / W) * (bbox.lon1 - bbox.lon0);
      const lat = bbox.lat1 - ((pos.getZ(i) - z0) / D) * (bbox.lat1 - bbox.lat0);
      const m = elevationAt(lon, lat);
      elevM[i] = m;
      pos.setY(i, elevY(m));
      const t = Math.max(0, Math.min(1, (m + 200) / 2600));
      c.setHSL(0.58 - t * 0.13, 0.24 + t * 0.16, 0.13 + t * 0.3);
      colors.set([c.r, c.g, c.b], i * 3);
    }
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    geo.userData.elevM = elevM;
    geo.userData.bbox = bbox;
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0.02, transparent: true, opacity: 1 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = "plate";
    const wire = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x2c4a60, wireframe: true, transparent: true, opacity: 0.16 }));
    wire.name = "plate-wire";
    wire.visible = false;
    this.terrain = mesh;
    this.wire = wire;
    this.groups.terrain.add(mesh, wire);
    // Depth cue grid under the plate, same idiom as the SoCal theater.
    const grid = new THREE.GridHelper(Math.max(W, D), 24, 0x1a3346, 0x101d28);
    grid.position.y = -1.2;
    grid.name = "subgrid";
    this.groups.terrain.add(grid);
    this.bbox = bbox;
    this.size = [W, D];
  },
  place(lon, lat, lift = 0) {
    const [x, z] = project(lon, lat);
    return new THREE.Vector3(x, elevY(elevationAt(lon, lat)) + lift * 0.16, z);
  },
  arc(a, b, lift) {
    // A shallow parabola above the terrain line — the intel map's links are
    // straight on a globe, so on a flat plate they are drawn as the sag-free
    // curve the operators actually picture.
    const p0 = this.place(a.lon, a.lat, 0);
    const p1 = this.place(b.lon, b.lat, 0);
    const n = 22;
    const out = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const v = p0.clone().lerp(p1, t);
      const ground = elevY(elevationAt(lerpLon(a, b, t), lerpLat(a, b, t)));
      v.y = Math.max(v.y, ground) + lift * 0.3 * Math.sin(Math.PI * t);
      out.push(v);
    }
    return out;
  },
  triangle(corners) {
    // Drape: the triangle is subdivided on the ground plane and every interior
    // vertex is lifted onto the relief field, so a field reads as paint on the
    // terrain rather than a flat sheet floating over the hills.
    const verts = subdivideTriangle(corners, 7, (lon, lat) => {
      const [x, z] = project(lon, lat);
      return [x, elevY(elevationAt(lon, lat)) + 0.05, z];
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    geo.computeVertexNormals();
    return geo;
  },
  cameraFraming() {
    const [W, D] = this.size;
    const span = Math.max(W, D);
    // Frame the *theater*, not a corner of it: at fov 48° a distance of ~1.3
    // spans puts the whole plate plus margin on screen. Marker sizes are tuned
    // against this distance, so a portal reads at roughly the size the intel map
    // draws its icon instead of becoming a boulder on a small bbox.
    controls.maxDistance = span * 4;
    controls.minDistance = span * 0.06;
    controls.maxPolarAngle = Math.PI * 0.49;
    camera.far = span * 14;
    camera.updateProjectionMatrix();
    camera.position.set(W * 0.05, span * 0.8, D * 1.02);
    controls.target.set(0, 0, 2);
    scene.fog = FOG;
  },
  cursor(x, z) {
    const [lon, lat] = lonLatFromXZ(x, z);
    return { lon, lat, elev: elevationAt(lon, lat) };
  },
};

function lerpLon(a, b, t) { return a.lon + (b.lon - a.lon) * t; }
function lerpLat(a, b, t) { return a.lat + (b.lat - a.lat) * t; }

const globe = createGlobe({ THREE, radius: THEATERS.globe.radius });
globeWorld.add(globe.root);
globeWorld.add(buildStars(THREE, 900, 300));
const globeStage = {
  key: "globe",
  host: globeWorld,
  groups: groups.globe,
  built: false,
  async build() {
    if (this.built) return;
    try {
      const res = await fetch("./vendor/world/countries.geo.json");
      if (res.ok) globe.setCountries(await res.json());
    } catch {
      /* the outline layer is decoration; its absence must not stop the app */
    }
    this.built = true;
  },
  place(lon, lat, lift = 0) {
    const v = lonLatToVec3(lon, lat, THEATERS.globe.radius + lift * 0.06);
    return new THREE.Vector3(v[0], v[1], v[2]);
  },
  arc(a, b, lift) {
    const path = globe.geodesicPath ? globe.geodesicPath(a, b, 40) : [];
    const pts = [];
    for (const p of path) {
      const t = path.indexOf(p) / Math.max(1, path.length - 1);
      pts.push(this.place(p.lon, p.lat, lift * 0.6 * Math.sin(Math.PI * t)));
    }
    return pts;
  },
  triangle(corners) {
    return globe.triangle(corners, { lift: 1.002, sub: 6 });
  },
  cameraFraming() {
    controls.maxDistance = THEATERS.globe.radius * 9;
    controls.minDistance = THEATERS.globe.radius * 1.25;
    controls.maxPolarAngle = Math.PI;
    camera.far = 1200;
    camera.position.set(0, 14, 52);
    controls.target.set(0, 0, 0);
    scene.fog = null;
  },
  cursor(v) {
    const { lat, lon } = vec3ToLonLat(v);
    return { lon, lat, elev: null };
  },
};

const stages = { basin: basinStage, globe: globeStage };
const activeStage = () => stages[state.view === "globe" ? "globe" : "basin"];

/* --------------------------------------------------------- view plumbing */

function viewBBox() {
  return state.view === "globe"
    ? { lon0: -180, lon1: 180, lat0: -85, lat1: 85 }
    : theater.bbox;
}

async function setView(key, { fly = true } = {}) {
  if (!THEATERS[key]) key = DEFAULT_THEATER;
  state.view = key;
  theater = THEATERS[key];
  const g = state.view === "globe" ? globeStage : basinStage;
  if (state.view === "globe") {
    await globeStage.build();
    globeStage.cameraFraming();
    globe.setGraticule(layerState.get("graticule") ?? false);
  } else {
    basinWorld.traverse((o) => { if (o.name === "plate" || o.name === "plate-wire" || o.name === "subgrid") { o.geometry?.dispose?.(); o.parent?.remove(o); } });
    basinStage.build(theater.bbox);
    applyXray();
    basinStage.cameraFraming();
  }
  basinWorld.visible = state.view !== "globe";
  globeWorld.visible = state.view === "globe";
  if (state.frame) drawFrame(state.frame);
  if (fly) refreshForView();
  $("viewSelect").value = key;
  $("hudStage").textContent = theater.name;
  $("linkState").textContent = `${state.feedSummary.live ? "LIVE" : "SIM"} · ${state.feedSummary.rung}`;
  $("linkState").className = `chip ${state.feedSummary.live ? "live" : "sim"}`;
  $("watermark").textContent = state.feedSummary.live ? "LIVE FEED" : state.frame?.source === "capture" ? "CAPTURE" : "SIM";
  $("watermark").className = `watermark ${state.feedSummary.live ? "live" : ""}`;
  saveHash();
}

function refreshForView() {
  if (!state.frame) return;
  const zoom = Number(feed.cfg.zoom) || 12;
  state.tileParamsUsed = tileParams(zoom);
  $("hudTiles").textContent = `${state.frame.tiles.length} keys · zoom ${zoom} · ${state.tileParamsUsed.tilesPerEdge} tiles/edge${state.frame.sim ? " · sim, nothing fetched" : ""}`;
}

function applyXray() {
  const mesh = basinStage.terrain;
  if (!mesh) return;
  mesh.material.opacity = state.xray ? 0.24 : 1;
  mesh.material.transparent = true;
  mesh.material.depthWrite = !state.xray;
  if (basinStage.wire) basinStage.wire.visible = state.xray || layerState.get("graticule") === true;
}

/* --------------------------------------------------------------- layers */

const layerState = new Map(LAYERS.map((l) => [l.id, l.on]));
const layerHost = $("layerList");

function renderLayerList() {
  layerHost.innerHTML = "";
  for (const l of LAYERS) {
    const inView = !l.views || l.views.includes(state.view);
    const row = document.createElement("label");
    row.className = "layer-row";
    row.innerHTML = `<input type="checkbox" ${layerState.get(l.id) ? "checked" : ""}><i class="swatch" style="background:${l.color}"></i><span>${l.name}</span>${inView ? "" : "<em class='dim'> · other stage</em>"}`;
    const box = row.querySelector("input");
    box.addEventListener("change", () => {
      layerState.set(l.id, box.checked);
      applyLayerVisibility();
      if (l.id === "graticule") globe.setGraticule(box.checked);
      refreshCounts();
    });
    layerHost.append(row);
  }
  applyLayerVisibility();
}

function applyLayerVisibility() {
  for (const stage of Object.values(groups)) {
    for (const [id, g] of Object.entries(stage)) {
      const def = LAYERS.find((l) => l.id === id);
      const inView = !def.views || def.views.includes(state.view);
      g.visible = inView && (layerState.get(id) ?? def.on);
    }
  }
  if (state.selected) highlight(state.selected);
}

/* ---------------------------------------------------------- frame render */

function clearIntel() {
  for (const stage of Object.values(groups)) {
    for (const g of Object.values(stage)) {
      for (const child of [...g.children]) {
        if (child.name === "plate" || child.name === "plate-wire" || child.name === "subgrid" || child.name === "countries" || child.name === "night") continue;
        child.geometry?.dispose?.();
        if (child.material) (Array.isArray(child.material) ? child.material : [child.material]).forEach((m) => m.dispose?.());
        g.remove(child);
      }
    }
  }
  PICKABLE.length = 0;
  labelEls.forEach((el) => el.remove());
  labelEls.length = 0;
  labelTargets.length = 0;
}

/**
 * drawFrame(frame) — the only place geometry is created from data. Feed rung,
 * paste, drop, peer broadcast and the offline register all funnel through it, so
 * a live payload and a synthetic one are drawn by identical code and differ only
 * in the provenance the dossier prints.
 */
function drawFrame(frame) {
  const stage = activeStage();
  clearIntel();
  if (!frame) return;
  const G = stage.groups;

  /* portals: instanced cores + level rings, both cheap enough for 2 k */
  const portals = frame.portals || [];
  if (portals.length) {
    const coreGeo = new THREE.SphereGeometry(0.1, 12, 9);
    const coreMat = new THREE.MeshStandardMaterial({ roughness: 0.42, metalness: 0.15 });
    const inst = new THREE.InstancedMesh(coreGeo, coreMat, portals.length);
    inst.name = "portal-cores";
    const m = new THREE.Matrix4();
    const col = new THREE.Color();
    for (let i = 0; i < portals.length; i++) {
      const p = portals[i];
      const lift = state.view === "globe" ? 0.6 : 0.9;
      const v = stage.place(p.lon, p.lat, lift);
      const s = 0.62 + (p.level || 0) * 0.13;
      m.makeTranslation(v.x, v.y, v.z).scale(new THREE.Vector3(s, s, s));
      inst.setMatrixAt(i, m);
      col.set(p.color || "#ff6600");
      inst.setColorAt(i, col);
    }
    inst.instanceMatrix.needsUpdate = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    G.portals.add(inst);

    // Level ring + pick proxy, one LineLoop each is too many objects at 2 k;
    // build one LineSegments for all rings and one invisible pickable sphere set.
    const ringPos = [];
    const ringCol = [];
    const seg = 14;
    const c2 = new THREE.Color();
    for (const p of portals) {
      const v = stage.place(p.lon, p.lat, state.view === "globe" ? 0.55 : 0.5);
      const rad = 0.22 + (p.level || 0) * 0.055;
      c2.set(LEVEL_COLORS[Math.max(0, Math.min(8, p.level ?? 0))] || "#7f95ab");
      for (let i = 0; i < seg; i++) {
        const t0 = (i / seg) * Math.PI * 2;
        const t1 = ((i + 1) / seg) * Math.PI * 2;
        const a = stage.place(p.lon + Math.cos(t0) * rad * ringDeg(state.view), p.lat + Math.sin(t0) * rad * ringDeg(state.view), state.view === "globe" ? 0.55 : 0.5);
        const b = stage.place(p.lon + Math.cos(t1) * rad * ringDeg(state.view), p.lat + Math.sin(t1) * rad * ringDeg(state.view), state.view === "globe" ? 0.55 : 0.5);
        ringPos.push(v.x, v.y, v.z, v.x, v.y, v.z, a.x, a.y, a.z, b.x, b.y, b.z);
        // (kept simple: a spoke per segment reads as a level dial)
        ringCol.push(c2.r, c2.g, c2.b, c2.r, c2.g, c2.b, c2.r, c2.g, c2.b, c2.r, c2.g, c2.b);
      }
    }
    const ringGeo = new THREE.BufferGeometry();
    ringGeo.setAttribute("position", new THREE.Float32BufferAttribute(ringPos, 3));
    ringGeo.setAttribute("color", new THREE.Float32BufferAttribute(ringCol, 3));
    const rings = new THREE.LineSegments(ringGeo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.55 }));
    rings.name = "portal-rings";
    G.portals.add(rings);

    for (let i = 0; i < portals.length; i++) {
      const p = portals[i];
      const v = stage.place(p.lon, p.lat, state.view === "globe" ? 0.6 : 0.9);
      const proxy = new THREE.Mesh(new THREE.SphereGeometry(0.42, 6, 5), new THREE.MeshBasicMaterial({ visible: false }));
      proxy.position.copy(v);
      proxy.userData = { record: p, kind: "portal" };
      G.portals.add(proxy);
      PICKABLE.push(proxy);
    }
  }

  /* links */
  const links = (frame.links || []).filter((l) => (l.lengthKm ?? 0) <= state.linkFilterKm + 1e-6);
  if (links.length) {
    const pos = [];
    const col = [];
    const c3 = new THREE.Color();
    for (const l of links) {
      const pts = stage.arc(l.from, l.to, state.lift);
      c3.set(l.color || "#7dd3fc");
      for (let i = 0; i < pts.length - 1; i++) {
        pos.push(pts[i].x, pts[i].y, pts[i].z, pts[i + 1].x, pts[i + 1].y, pts[i + 1].z);
        col.push(c3.r, c3.g, c3.b, c3.r, c3.g, c3.b);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    G.links.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.72 })));
    for (const l of links.slice(0, 600)) {
      const pts = stage.arc(l.from, l.to, state.lift);
      const mid = pts[Math.floor(pts.length / 2)];
      const proxy = new THREE.Mesh(new THREE.SphereGeometry(0.3, 5, 4), new THREE.MeshBasicMaterial({ visible: false }));
      proxy.position.copy(mid);
      proxy.userData = { record: l, kind: "link" };
      G.links.add(proxy);
      PICKABLE.push(proxy);
    }
  }

  /* fields */
  for (const f of frame.fields || []) {
    const geo = stage.triangle(f.corners);
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      color: new THREE.Color(f.color || "#a3e635"),
      transparent: true,
      opacity: 0.13,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }));
    mesh.userData = { record: f, kind: "field" };
    G.fields.add(mesh);
    PICKABLE.push(mesh);
    // outline so a field still reads when additive wash is off
    const outline = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(f.corners.map((c) => stage.place(c.lon, c.lat, 0.08))),
      new THREE.LineBasicMaterial({ color: new THREE.Color(f.color || "#a3e635"), transparent: true, opacity: 0.5 }),
    );
    G.fields.add(outline);
  }

  /* activity heat: one additive Points pass over the 24 h comms */
  const px = (frame.plexts || []).filter((p) => p.geo);
  if (px.length) {
    const pArr = new Float32Array(px.length * 3);
    const cArr = new Float32Array(px.length * 3);
    const c4 = new THREE.Color();
    for (let i = 0; i < px.length; i++) {
      const v = stage.place(px[i].lon, px[i].lat, state.view === "globe" ? 0.3 : 0.3);
      pArr[i * 3] = v.x; pArr[i * 3 + 1] = v.y; pArr[i * 3 + 2] = v.z;
      c4.set(px[i].color || "#fb923c");
      cArr[i * 3] = c4.r; cArr[i * 3 + 1] = c4.g; cArr[i * 3 + 2] = c4.b;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pArr, 3));
    g.setAttribute("color", new THREE.BufferAttribute(cArr, 3));
    G.heat.add(new THREE.Points(g, new THREE.PointsMaterial({ size: state.view === "globe" ? 1.5 : 1.1, vertexColors: true, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true })));
  }

  /* mind shields · active window, when the frame carries timestamps */
  const nowish = frame.anchor ?? Date.now();
  for (const p of portals) {
    if (!p.timestamp) continue;
    const ageH = (nowish - p.timestamp) / 3600000;
    if (ageH > 1 || ageH < 0) continue;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.5, 0.58, 24).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.5 * (1 - ageH), side: THREE.DoubleSide }),
    );
    ring.position.copy(stage.place(p.lon, p.lat, 0.12));
    G.shield.add(ring);
  }

  /* comms picks */
  px.slice(0, 240).forEach((p, i) => {
    const mk = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), new THREE.MeshBasicMaterial({ color: 0xf9a8d4, transparent: true, opacity: 0.85 }));
    mk.position.copy(stage.place(p.lon, p.lat, 1.6));
    mk.userData = { record: p, kind: "plext" };
    G.plext.add(mk);
    PICKABLE.push(mk);
    if (i === 0) G.plext.userData = { newest: p.time };
  });

  /* contact front */
  const front = contactFront(frame);
  if (front) {
    const pts = stage.arc({ lat: front.a.lat, lon: front.a.lon }, { lat: front.b.lat, lon: front.b.lon }, state.lift * 0.4);
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    G.front.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.9 })));
    frame.front = front;
  }

  drawOwnDrops();
  applyLayerVisibility();
  buildLabels(frame);
  $("hudPortals").textContent = `${portals.length}${frame.sim ? " · sim" : ""}`;
  $("hudLF").textContent = `${links.length} / ${(frame.fields || []).length}`;
  $("hudObjects").textContent = `${PICKABLE.length}`;
  renderScore(frame);
  renderTimeline(frame);
  drawMinimap(frame);
}

/** ring radius in degrees for the level dial — tiny on a globe, visible on a plate */
function ringDeg(view) { return view === "globe" ? 0.28 : 0.9; }

/* ----------------------------------------------------------- own drops */

function drawOwnDrops() {
  const stage = activeStage();
  const g = stage.groups.own;
  for (const child of [...g.children]) { child.geometry?.dispose?.(); child.material?.dispose?.(); g.remove(child); }
  state.own.forEach((d, i) => {
    const mk = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.7, 4).rotateX(Math.PI), new THREE.MeshBasicMaterial({ color: 0xfde047 }));
    mk.position.copy(stage.place(d.lon, d.lat, 1.4));
    mk.userData = { record: d, kind: "drop" };
    g.add(mk);
    PICKABLE.push(mk);
    const stem = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([stage.place(d.lon, d.lat, 0.1), stage.place(d.lon, d.lat, 1.4)]),
      new THREE.LineDashedMaterial({ color: 0xfde047, dashSize: 0.2, gapSize: 0.14, transparent: true, opacity: 0.7 }),
    );
    stem.computeLineDistances();
    g.add(stem);
    addLabel(stage.place(d.lon, d.lat, 2.1), `#${i + 1} ${d.note || "drop"}`, "own");
  });
  renderShare();
}

/* --------------------------------------------------------------- labels */

const labelHost = $("labels");
const labelEls = [];
const labelTargets = [];

function addLabel(vec3, text, cls = "") {
  const el = document.createElement("div");
  el.className = `lbl ${cls}`.trim();
  el.textContent = text;
  labelHost.append(el);
  labelEls.push(el);
  labelTargets.push(vec3.clone());
}

function buildLabels(frame) {
  const top = [...(frame.portals || [])].sort((a, b) => (b.mu || 0) - (a.mu || 0)).slice(0, reduced ? 12 : 34);
  const stage = activeStage();
  for (const p of top) addLabel(stage.place(p.lon, p.lat, state.view === "globe" ? 1.6 : 2.3), p.title, `t-${p.tier}`);
}

function updateLabels() {
  if (!state.showLabels) { for (const el of labelEls) el.style.display = "none"; return; }
  const w = renderer.domElement.clientWidth;
  const h = renderer.domElement.clientHeight;
  const v = new THREE.Vector3();
  for (let i = 0; i < labelEls.length; i++) {
    const el = labelEls[i];
    v.copy(labelTargets[i]).project(camera);
    const behind = v.z > 1;
    // Globe labels must not print through the planet.
    const occluded = state.view === "globe" && !behind && v.length() > 0 && isBackSide(labelTargets[i]);
    if (behind || occluded || v.x < -1.2 || v.x > 1.2 || v.y < -1.2 || v.y > 1.2) { el.style.display = "none"; continue; }
    el.style.display = "block";
    el.style.left = `${((v.x + 1) / 2) * w}px`;
    el.style.top = `${((-v.y + 1) / 2) * h}px`;
  }
}

const camDir = new THREE.Vector3();
function isBackSide(p) {
  camera.getWorldDirection(camDir);
  const toPoint = p.clone().sub(camera.position);
  return toPoint.dot(camDir) > 0 && p.clone().normalize().dot(camera.position.clone().normalize()) < -0.05;
}

/* ------------------------------------------------------------ selection */

const highlightRing = new THREE.Mesh(
  new THREE.RingGeometry(0.72, 0.86, 36).rotateX(-Math.PI / 2),
  new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, side: THREE.DoubleSide }),
);
highlightRing.visible = false;
scene.add(highlightRing);

function highlight(rec) {
  if (!rec || rec.kind === "link" || rec.kind === "field") { highlightRing.visible = false; return; }
  const stage = activeStage();
  highlightRing.visible = true;
  highlightRing.position.copy(stage.place(rec.lon, rec.lat, 0.2));
}

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let downAt = null;

renderer.domElement.addEventListener("pointerdown", (e) => { downAt = { x: e.clientX, y: e.clientY }; });
renderer.domElement.addEventListener("pointerup", (e) => {
  if (!downAt) return;
  const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
  downAt = null;
  if (moved > 6) return;
  const rec = raycast(e);
  if (rec) selectRecord(rec);
});
renderer.domElement.addEventListener("pointermove", (e) => {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  const rec = raycast(e);
  state.hover = rec;
  renderer.domElement.style.cursor = rec ? "pointer" : "grab";
  const stage = activeStage();
  if (stage.key === "basin") {
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    raycaster.setFromCamera(pointer, camera);
    const hit = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(plane, hit)) {
      const { lon, lat, elev } = basinStage.cursor(hit.x, hit.z);
      $("hudLonLat").textContent = `${lat.toFixed(4)}N ${Math.abs(lon).toFixed(4)}W`;
      $("hudElev").textContent = `${Math.round(elev)} m`;
    }
  }
});

function raycast(e) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(PICKABLE.filter((o) => isVisible(o)), false);
  return hits.length ? hits[0].object.userData.record : null;
}

function isVisible(o) {
  let p = o;
  while (p) { if (!p.visible) return false; p = p.parent; }
  return true;
}

function selectRecord(rec) {
  state.selected = rec;
  highlight(rec);
  $("pipDetail").classList.remove("min");
  renderDossier(rec);
}

/* --------------------------------------------------------------- dossier */

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function tierTag(tier) {
  return `<span class="tier ${esc(tier)}">${esc((tier || "context").toUpperCase())}</span>`;
}

function renderDossier(rec) {
  const host = $("detailBody");
  if (!rec) {
    host.innerHTML = `<p class="hint">Click any portal, link, field, comms pick or drop for its dossier. Drag to orbit, wheel to zoom, right-drag to pan.</p>`;
    return;
  }
  const facts = [];
  if (rec.kind === "portal") {
    facts.push(`team ${rec.team}${rec.raw?.team ? ` (wire token “${rec.raw.team}”)` : ""}${rec.ambiguousTeam ? " — ambiguous legacy team letter, kept raw" : ""}`);
    if (rec.level != null) facts.push(`level ${rec.level} · ${rec.health ?? "?"}% health · ${rec.resCount ?? rec.resonators?.length ?? 0}/8 resonators`);
    if (rec.mu != null) facts.push(`${rec.mu} MU as scored · field value = min of three corners`);
    if (rec.timestamp) facts.push(`entity timestamp ${new Date(rec.timestamp).toISOString()} · age ${ageText(Date.now() - rec.timestamp)}`);
    if (rec.county) facts.push(`gazetteer row: ${esc(rec.gnisClass)} in ${esc(rec.county)} County${rec.gnis ? ` · GNIS ${rec.gnis}` : ""}${rec.verified ? " · verified FEATURE_ID" : " · curated coordinate"}`);
    if (rec.links?.length) facts.push(`${rec.links.length} linked edge(s) in the details payload`);
    for (const r of (rec.resonators || []).slice(0, 8)) facts.push(`slot ${r.slot} · L${r.level ?? "?"} · ${r.energy ?? "?"} LE${r.owner ? ` · ${esc(r.owner)}` : ""}`);
  } else if (rec.kind === "link") {
    facts.push(`${rec.team} link · ${rec.lengthKm?.toFixed(2) ?? "?"} km (base limit ${RULES.find((r) => r.key === "linkMaxKm").value} km)`);
    facts.push(`ends ${esc(rec.oGuid || "?")} → ${esc(rec.dGuid || "?")}`);
    if (rec.timestamp) facts.push(`deployed ${new Date(rec.timestamp).toISOString()}`);
  } else if (rec.kind === "field") {
    const area = sphericalTriangleKm2(rec.corners);
    const mu = state.frame ? fieldMu(state.frame, rec) : rec.mu;
    facts.push(`${rec.team} field · ${mu ?? "?"} MU · ${Math.round(area).toLocaleString()} km² spherical area`);
    facts.push(`corners ${rec.corners.map((c) => esc(c.guid || "unclaimed")).join(" · ")}`);
  } else if (rec.kind === "plext") {
    facts.push(`${rec.team} comms · ${ageText(Date.now() - rec.time)} ago${rec.agent ? ` · ${esc(rec.agent)}` : ""}`);
    facts.push(esc(rec.text));
    facts.push("geo-tagged plext → the only markers here that carry an agent handle");
  } else if (rec.kind === "drop") {
    facts.push(`own drop #${rec.i + 1} · ${new Date(rec.at).toISOString()}`);
    if (rec.note) facts.push(esc(rec.note));
    facts.push("broadcast to peers on request, never automatically");
  } else if (rec.kind === "gaz") {
    facts.push(`USGS GNIS ${esc(rec.fclass)} · ${esc(rec.county)} County`);
    facts.push(`${rec.lat.toFixed(6)}, ${rec.lon.toFixed(6)} · EPSG:4326`);
  }
  const resonatorHtml = rec.kind === "portal" && rec.resonators?.length
    ? `<div class="res-row">${rec.resonators.map((r) => `<i title="slot ${r.slot} · L${r.level}">${r.level}</i>`).join("")}${Array.from({ length: Math.max(0, 8 - rec.resonators.length) }, () => "<i class='empty'>·</i>").join("")}</div>`
    : "";
  host.innerHTML = `
    <h3 class="detail-title">${esc(rec.title || rec.kind || "record")}</h3>
    ${tierTag(rec.tier)}
    <span class="prov">${esc(rec.provenance || "no provenance recorded")}</span>
    ${resonatorHtml}
    <ul class="facts">${facts.map((f) => `<li>${f}</li>`).join("")}</ul>
    ${rec.image ? `<a class="thumb" href="${esc(rec.image)}" target="_blank" rel="noopener noreferrer">portal image ↗</a>` : ""}
    <div class="gaz-ops">
      <button type="button" data-act="fly">FLY</button>
      <button type="button" data-act="intel">INTEL MAP LINK</button>
      <button type="button" data-act="details">GET DETAILS</button>
      <button type="button" data-act="drop">FLAG</button>
    </div>
    <p class="hint">${rec.guid ? `guid ${esc(rec.guid)} · ` : ""}${rec.sim ? "generated · see the SIM note in the FEED panel" : "as received"}</p>
  `;
  host.querySelector('[data-act="fly"]')?.addEventListener("click", () => flyTo({ lat: rec.lat ?? rec.from?.lat, lon: rec.lon ?? rec.from?.lon }, 0.6));
  host.querySelector('[data-act="intel"]')?.addEventListener("click", () => copy(buildIntelPermalink({ lat: state.view === "globe" ? 0 : theater.center.lat, lon: state.view === "globe" ? 0 : theater.center.lon, zoom: feed.cfg.zoom, portalLat: rec.lat, portalLon: rec.lon, pguid: rec.guid }), "intel permalink"));
  host.querySelector('[data-act="details"]')?.addEventListener("click", async () => {
    if (!rec.guid) { setStatus("no guid on this record — nothing to ask for"); return; }
    setStatus("requesting portal details via the active rung…");
    const d = await feed.fetchPortalDetails(rec.guid);
    if (!d) { setStatus("details unavailable on this rung (relay or same-origin only)"); return; }
    renderDossier({ ...rec, ...d, tier: "official", provenance: "wire · getPortal details" });
  });
  host.querySelector('[data-act="drop"]')?.addEventListener("click", () => { dropMarker(`flag · ${rec.title || rec.kind}`); });
}

/* --------------------------------------------------------------- camera */

const flyState = { active: false, from: new THREE.Vector3(), to: new THREE.Vector3(), t0: 0 };

function flyTo({ lat, lon }, zoomish = 1) {
  if (lat == null || lon == null) return;
  const stage = activeStage();
  const target = stage.place(lon, lat, 0);
  controls.target.copy(target);
  const dir = camera.position.clone().sub(target).normalize().multiplyScalar(stage.key === "globe" ? THEATERS.globe.radius * 2.1 : Math.max(6, (stage.size?.[0] || 30) * 0.35 * zoomish));
  camera.position.copy(target.clone().add(dir));
  controls.update();
  saveHash();
}

function flyToView(name) {
  if (name === "globe") { setView("globe"); return; }
  const t = THEATERS[name];
  if (!t) return;
  setView(name).then(() => flyTo({ lat: t.center.lat, lon: t.center.lon }, 1));
}

/* ------------------------------------------------------------ minimap */

const mini = $("minimap");
const mctx = mini ? mini.getContext("2d") : null;

function drawMinimap(frame) {
  if (!mctx) return;
  const w = mini.width;
  const h = mini.height;
  mctx.clearRect(0, 0, w, h);
  mctx.fillStyle = "#060c13";
  mctx.fillRect(0, 0, w, h);
  const bbox = viewBBox();
  const px = (lon) => ((lon - bbox.lon0) / (bbox.lon1 - bbox.lon0)) * w;
  const py = (lat) => ((bbox.lat1 - lat) / (bbox.lat1 - bbox.lat0)) * h;
  mctx.strokeStyle = "rgba(90,130,165,0.25)";
  mctx.lineWidth = 1;
  const step = state.view === "globe" ? 30 : 0.25;
  for (let lon = Math.ceil(bbox.lon0 / step) * step; lon <= bbox.lon1; lon += step) { mctx.beginPath(); mctx.moveTo(px(lon), 0); mctx.lineTo(px(lon), h); mctx.stroke(); }
  for (let lat = Math.ceil(bbox.lat0 / step) * step; lat <= bbox.lat1; lat += step) { mctx.beginPath(); mctx.moveTo(0, py(lat)); mctx.lineTo(w, py(lat)); mctx.stroke(); }
  if (!frame) return;
  mctx.globalAlpha = 0.5;
  for (const l of frame.links || []) {
    mctx.strokeStyle = l.color || "#7dd3fc";
    mctx.beginPath(); mctx.moveTo(px(l.from.lon), py(l.from.lat)); mctx.lineTo(px(l.to.lon), py(l.to.lat)); mctx.stroke();
  }
  mctx.globalAlpha = 1;
  for (const p of frame.portals || []) {
    mctx.fillStyle = p.color || "#ff6600";
    const r = 1 + (p.level || 0) * 0.28;
    mctx.beginPath(); mctx.arc(px(p.lon), py(p.lat), r, 0, Math.PI * 2); mctx.fill();
  }
  for (const d of state.own) {
    mctx.fillStyle = "#fde047";
    mctx.beginPath(); mctx.arc(px(d.lon), py(d.lat), 2.6, 0, Math.PI * 2); mctx.fill();
  }
  // camera wedge
  const [clon, clat] = state.view === "globe" ? [0, 0] : lonLatFromXZ(camera.position.x, camera.position.z);
  const tgt = state.view === "globe" ? controls.target : null;
  let tlon = px(clon), tlat = py(clat);
  if (tgt) { const [tl, tt] = lonLatFromXZ(tgt.x, tgt.z); tlon = px(tl); tlat = py(tt); }
  mctx.strokeStyle = "rgba(255,255,255,0.75)";
  mctx.beginPath(); mctx.arc(px(clon), py(clat), 3, 0, Math.PI * 2); mctx.stroke();
  mctx.beginPath(); mctx.moveTo(px(clon), py(clat)); mctx.lineTo(tlon, tlat); mctx.stroke();
}

/* ------------------------------------------------------------- score PIP */

function renderScore(frame) {
  const host = $("scoreBars");
  const stats = $("scoreStats");
  if (!host) return;
  const s = frame?.stats || scoreFrame(frame || { portals: [], links: [], fields: [] });
  const rows = FACTIONS.filter((f) => f.key !== "MAC");
  host.innerHTML = rows.map((f) => {
    const t = s.per[f.key] || {};
    const mu = t.mu || 0;
    const max = Math.max(1, ...rows.map((x) => s.per[x.key]?.mu || 0));
    return `<div class="score-row"><b style="color:${f.color}">${f.key}</b>
      <span class="bar"><i style="width:${Math.round((mu / max) * 100)}%;background:${f.color}"></i></span>
      <em>${mu.toLocaleString()} MU · ${t.portals || 0} p · ${t.links || 0} l · ${t.fields || 0} f</em></div>`;
  }).join("");
  stats.innerHTML = `
    <dt>frame</dt><dd>${esc(frame?.source || "—")} · ${esc(frame?.provenance || "")}</dd>
    <dt>max link</dt><dd>${s.maxLinkKm ? `${s.maxLinkKm.toFixed(1)} km` : "—"}</dd>
    <dt>front</dt><dd>${frame?.front ? `${frame.front.km.toFixed(1)} km · ${esc(frame.front.a.title)} ↔ ${esc(frame.front.b.title)}` : "no opposing pair in frame"}</dd>
    <dt>team tokens</dt><dd>${s.ambiguousTeam ? `${s.ambiguousTeam} ambiguous (legacy letters) — see dossiers` : "unambiguous"}</dd>`;
  $("scoreNote").textContent = frame?.sim
    ? "Mind units are computed with the published rule (portal MU = sum of resonator levels, field MU = weakest corner) — but the network they score is generated. This panel is a shape demo, not a scoreboard."
    : "MU figures are computed from whatever the active rung returned; no scoring authority is claimed.";
}

/* --------------------------------------------------------- timeline PIP */

const tlCanvas = $("timelineCanvas");
const tlCtx = tlCanvas ? tlCanvas.getContext("2d") : null;

function renderTimeline(frame) {
  const list = $("timelineList");
  if (!tlCtx || !list) return;
  const w = tlCanvas.width;
  const h = tlCanvas.height;
  tlCtx.clearRect(0, 0, w, h);
  const events = (frame?.plexts || []).filter((p) => p.time);
  if (!events.length) {
    tlCtx.fillStyle = "#7f95ab";
    tlCtx.font = "10px ui-monospace, monospace";
    tlCtx.fillText("no comms events in this frame", 8, h / 2);
    list.innerHTML = "";
    return;
  }
  const anchor = frame.anchor ?? Date.now();
  const bins = new Array(24).fill(0).map(() => ({ RES: 0, ENL: 0, NEU: 0, MAC: 0 }));
  for (const e of events) {
    const hoursAgo = Math.max(0, Math.min(23.999, (anchor - e.time) / 3600000));
    bins[23 - Math.floor(hoursAgo)][e.team] = (bins[23 - Math.floor(hoursAgo)][e.team] || 0) + 1;
  }
  const max = Math.max(1, ...bins.map((b) => b.RES + b.ENL + b.NEU + b.MAC));
  const bw = w / 24;
  for (let i = 0; i < 24; i++) {
    let y = h - 4;
    for (const [k, color] of [["RES", "#0088ff"], ["ENL", "#03dc03"], ["NEU", "#ff6600"], ["MAC", "#ff0028"]]) {
      const v = bins[i][k] || 0;
      if (!v) continue;
      const bh = (v / max) * (h - 10);
      tlCtx.fillStyle = color;
      tlCtx.fillRect(i * bw + 1, y - bh, bw - 2, bh);
      y -= bh;
    }
  }
  tlCtx.fillStyle = "#5b7286";
  tlCtx.font = "9px ui-monospace, monospace";
  tlCtx.fillText("-24 h", 4, 9);
  tlCtx.fillText("now", w - 22, 9);
  list.innerHTML = events.slice(0, 14).map((e, i) => `<li><button type="button" data-i="${i}"><b style="color:${e.color}">${e.team}</b> ${esc(e.text)} <em>${ageText((anchor - e.time))}</em></button></li>`).join("");
  [...list.querySelectorAll("button")].forEach((b) => {
    b.addEventListener("click", () => {
      const e = events[Number(b.dataset.i)];
      if (e) flyTo(e, 0.4);
    });
  });
}

/* -------------------------------------------------------------- search */

const gazIdx = makeGazetteerIndex(GAZ_ROWS);

function runSearch(q) {
  const host = $("searchResults");
  host.innerHTML = "";
  const query = (q || "").trim();
  if (query.length < 2) return;
  const hits = [];
  const frame = state.frame;
  const isUrl = /^(https?:)?\/\//i.test(query) || /ingress\.com/i.test(query);
  if (isUrl) {
    const link = parseIntelPermalink(query);
    hits.push({ kind: "permalink", name: link.pguid ? `intel permalink · pguid ${link.pguid.slice(0, 12)}…` : "intel permalink", meta: `ll ${link.lat?.toFixed(4) ?? "?"},${link.lon?.toFixed(4) ?? "?"} · z${link.zoom ?? "?"}`, link });
  }
  for (const p of frame?.portals || []) {
    if (p.title.toLowerCase().includes(query.toLowerCase())) hits.push({ kind: "portal", name: p.title, meta: `${p.team} · L${p.level ?? "?"} · ${p.mu ?? 0} MU · ${p.provenance}`, rec: p });
  }
  for (const f of frame?.fields || []) {
    if (f.guid?.toLowerCase().includes(query.toLowerCase())) hits.push({ kind: "field", name: `field ${f.guid}`, meta: `${f.team} · ${f.mu ?? "?"} MU`, rec: f });
  }
  for (const h of searchName(gazIdx, query, { limit: 8 })) {
    hits.push({ kind: "gaz", name: h.name, meta: `${h.fclass} · ${h.county} · ${h.lat.toFixed(3)},${h.lon.toFixed(3)}${h.verified ? " · verified" : ""}`, rec: { ...h, kind: "gaz", title: h.name, tier: h.verified ? "official" : "community", provenance: "USGS GNIS register row" } });
  }
  const isOwnPage = /^(https?:)?\/\//i.test(query) && !/ingress\.com/i.test(query);
  if (isOwnPage) hits.push({ kind: "note", name: "not an intel permalink", meta: "parsed, but the host is not ingress.com — nothing to jump to" });
  hits.slice(0, 24).forEach((h, i) => { const b = mkHit(h, i); host.append(b); });
  if (!hits.length) host.innerHTML = `<p class="hint">nothing matched “${esc(query)}” in this frame or the register.</p>`;
}

function mkHit(h, i) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "search-hit";
  btn.innerHTML = `${esc(h.name)}<small>${esc(h.kind)} · ${esc(h.meta || "")}</small>`;
  btn.addEventListener("click", () => {
    if (h.kind === "permalink") {
      const l = h.link;
      if (l.zoom && l.zoom < 8) setView("globe");
      else if (l.lat != null) {
        const inside = THEATERS.la.bbox;
        if (l.lat >= inside.lat0 && l.lat <= inside.lat1 && l.lon >= inside.lon0 && l.lon <= inside.lon1) setView("la");
        else setView("socal");
        setTimeout(() => flyTo({ lat: l.portalLat ?? l.lat, lon: l.portalLon ?? l.lon }, 0.3), 60);
      }
      setStatus(`jumped to an intel permalink · ${l.lat?.toFixed(4) ?? "?"}, ${l.lon?.toFixed(4) ?? "?"} · the URL was parsed locally, nothing was fetched`);
      return;
    }
    selectRecord(h.rec);
    flyTo({ lat: h.rec.lat ?? h.rec.from?.lat, lon: h.rec.lon ?? h.rec.from?.lon }, 0.4);
  });
  return btn;
}

$("searchBox").addEventListener("input", (e) => runSearch(e.target.value));
// Enter is how a search is actually submitted, and an unpreventable <form> submit
// would reload the page and lose the frame. The button is for people who point.
$("viewSearch").addEventListener("submit", (e) => {
  e.preventDefault();
  runSearch($("searchBox").value);
});

/* ---------------------------------------------------------- gazetteer PIP */

function runGazBox() {
  const bbox = viewBBox();
  const rows = searchPoint(gazIdx, (bbox.lat0 + bbox.lat1) / 2, (bbox.lon0 + bbox.lon1) / 2, { radiusKm: state.view === "globe" ? 20000 : Math.abs(bbox.lon1 - bbox.lon0) * 55, limit: 12 });
  renderGazHits(rows);
}

function renderGazHits(rows) {
  const host = $("gazHits");
  host.innerHTML = "";
  for (const r of rows) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `gaz-hit${r.verified ? " verified" : ""}`;
    btn.style.setProperty("--gaz", r.verified ? "#ffb020" : "#9db2d1");
    btn.innerHTML = `<span class="gaz-hit-name">${esc(r.name)}</span><span class="gaz-hit-meta">${esc(r.fclass)} · ${esc(r.county)} · ${r.lat.toFixed(4)}, ${r.lon.toFixed(4)}</span>`;
    btn.addEventListener("click", () => {
      const rec = { kind: "gaz", title: r.name, lat: r.lat, lon: r.lon, fclass: r.fclass, county: r.county, gnis: r.gnis, verified: r.verified, tier: r.verified ? "official" : "community", provenance: "USGS GNIS register row (real position, no game state)" };
      selectRecord(rec);
      flyTo(rec, 0.4);
    });
    li.append(btn);
    host.append(li);
  }
  if (!host.children.length) host.innerHTML = `<li class="hint">no register rows here — the offline gazetteer covers the SoCal frame only</li>`;
}

$("gazQuery").addEventListener("input", (e) => {
  const rows = searchName(gazIdx, e.target.value, { limit: 14 });
  renderGazHits(rows);
});
$("gazBox").addEventListener("click", runGazBox);

/* ------------------------------------------------------------ peers PIP */

function renderShare() {
  const host = $("shareStats");
  if (!host) return;
  host.innerHTML = `
    <dt>host</dt><dd>${feed.hasWebxdc ? `webxdc · ${esc(window.webxdc?.selfName || "agent")}` : "plain browser tab · no broadcast channel"}</dd>
    <dt>ours</dt><dd>${state.own.length} drop(s)</dd>
    <dt>inbound</dt><dd>${state.peers.length} peer record(s)</dd>`;
  const list = $("peerList");
  list.innerHTML = [...state.own.map((d, i) => ({ ...d, who: "you", i })), ...state.peers]
    .slice(0, 20)
    .map((d) => `<li><button type="button" data-lat="${d.lat}" data-lon="${d.lon}"><b>${esc(d.who)}</b> ${esc(d.note || "drop")} <em>${d.lat.toFixed(3)}, ${d.lon.toFixed(3)}</em></button></li>`)
    .join("");
  [...list.querySelectorAll("button")].forEach((b) => b.addEventListener("click", () => flyTo({ lat: +b.dataset.lat, lon: +b.dataset.lon }, 0.3)));
}

function dropMarker(note) {
  const tgt = state.view === "globe" ? vec3ToLonLat(controls.target) : (() => { const [lon, lat] = lonLatFromXZ(controls.target.x, controls.target.z); return { lon, lat }; })();
  const d = { kind: "drop", note, lat: tgt.lat, lon: tgt.lon, at: Date.now(), i: state.own.length, tier: "context", title: note, provenance: "our own marker · shared by broadcast on request" };
  state.own.push(d);
  const r = feed.send("intel-drop", { lat: d.lat, lon: d.lon, note, at: d.at }, note);
  setStatus(r.ok ? `drop #${state.own.length} broadcast to the chat` : `drop placed locally · ${r.why}`);
  drawFrame(state.frame);
}

$("btnDrop").addEventListener("click", () => dropMarker(prompt("marker note", "op marker") || "op marker"));
$("btnDropClear").addEventListener("click", () => { state.own = []; drawFrame(state.frame); });
$("btnBroadcast").addEventListener("click", () => {
  if (!state.frame) return;
  const slim = {
    source: state.frame.source,
    fetched: state.frame.fetched,
    portals: state.frame.portals.slice(0, 300).map((p) => ({ guid: p.guid, title: p.title, lat: p.lat, lon: p.lon, team: p.team, level: p.level, health: p.health, mu: p.mu, provenance: p.provenance })),
    links: state.frame.links.slice(0, 400).map((l) => ({ team: l.team, from: l.from, to: l.to, lengthKm: l.lengthKm, provenance: l.provenance })),
    fields: state.frame.fields.slice(0, 200).map((f) => ({ team: f.team, corners: f.corners, mu: f.mu, provenance: f.provenance })),
  };
  const r = feed.send("intel-frame", slim, `intel frame · ${slim.portals.length} portals · ${slim.source}`);
  setStatus(r.ok ? "frame broadcast to the chat" : `cannot broadcast · ${r.why}`);
});

/* -------------------------------------------------------------- the feed */

const feed = createFeed({
  onFrame(frame, meta) {
    // Merge only between two real frames. Synthetic substrate and imported data
    // must never share a layer: a pasted payload replaces the offline register
    // outright, and a register refresh never blends into a capture. Mixing them
    // would be a provenance lie dressed up as a picture.
    const bothReal = state.frame && state.frame.source !== "sim" && frame.source !== "sim";
    state.frame = meta?.merge !== false && bothReal ? mergeInto(state.frame, frame) : frame;
    drawFrame(state.frame);
    refreshForView();
    $("linkState").textContent = `${meta?.live ? "LIVE" : frame.source === "capture" ? "CAPTURE" : "SIM"} · ${meta?.rung ?? frame.source}`;
    $("linkState").className = `chip ${meta?.live ? "live" : "sim"}`;
    $("watermark").textContent = meta?.live ? "LIVE FEED" : frame.source === "capture" ? "CAPTURE" : "SIM";
    $("watermark").className = `watermark ${meta?.live ? "live" : ""}`;
  },
  onLog(row) {
    renderLadder();
    setSys(`${row.rung}/${row.lvl} · ${row.msg.split("\n")[0].slice(0, 110)}`);
  },
  onStatus(s) {
    state.feedSummary = { ...s };
    $("feedRung").textContent = s.rung || "—";
    $("feedLive").textContent = s.live ? "live" : "static";
    $("feedAge").textContent = s.age ? ageText(Date.now() - s.age) : "—";
    $("feedReq").textContent = String(s.requests ?? 0);
    $("hudSource").textContent = `${s.rung} · ${s.detail || ""}`;
  },
  onView() {
    const bbox = viewBBox();
    const zoom = Number($("dataZoom").value) || 12;
    return { bbox, zoom };
  },
});

function mergeInto(base, incoming) {
  // The proto merge keeps guid-keyed newest-wins semantics across refreshes.
  return mergeFrames(base, incoming, { limit: 3000 });
}

/**
 * The whole ladder, always six rows.
 *
 * The three network rungs carry a verdict from the last probe. The other three
 * describe the condition that promotes them, so the table reads the same before
 * and after a probe instead of growing rows out of nowhere — and an agent can
 * see what they would have to do to move the picture up a rung.
 */
function renderLadder() {
  const host = $("ladderList");
  if (!host) return;
  const probed = new Map(feed.probeRows.map((r) => [r.rung, r]));
  const f = state.frame;
  const standing = {
    capture: f?.source === "capture"
      ? { ok: true, detail: `last import drew ${f.portals.length} portals · ${f.links.length} links · ${f.fields.length} fields` }
      : { ok: null, detail: "paste a getEntities dump, an IITC GeoJSON/KML export or a CSV of portals into the box below and it draws immediately" },
    peer: feed.hasWebxdc
      ? { ok: true, detail: "webxdc host present · broadcasts from another agent's copy of this bundle will land here" }
      : { ok: null, detail: "needs the .xdc build inside a chat host; standalone this page has no peer channel" },
    sim: { ok: null, detail: `offline register always available · ${f?.source === "sim" ? `${f.portals.length} synthetic portals over ${GAZ_ROWS.length} gazetteer rows` : "held in reserve while a real frame is on screen"}` },
  };
  host.innerHTML = LADDER.map((def) => {
    const r = probed.get(def.id);
    const st = standing[def.id];
    const cls = r ? (r.ok ? "ok" : "bad") : st?.ok === true ? "ok" : def.probe ? "pending" : "standing";
    const verdict = r
      ? `${r.ok ? "· ANSWERED" : `· ${esc(r.cls || "NO")}`}${r.ms != null ? ` · ${r.ms} ms` : ""}`
      : st?.ok === true ? "· ACTIVE" : "· STANDING";
    const detail = r ? (r.detail || def.summary) : st?.detail || def.summary;
    const fix = r?.fix || (!r && st?.ok !== true ? def.requires : "");
    return `<div class="rung ${cls}${state.feedSummary.rung === def.id ? " active" : ""}">
      <header><b>${esc(def.name)}</b><span>${verdict}</span></header>
      <p>${esc(detail)}</p>
      ${fix ? `<p class="fix">→ ${esc(fix)}</p>` : ""}
      ${r?.warnings?.length ? `<p class="warn">decode: ${r.warnings.map(esc).join(" · ")}</p>` : ""}
      ${def.docs?.length ? `<p class="docs">${def.docs.map((d) => {
        // Name the source, do not label everything "doc": an agent deciding whether
        // to trust a rung needs to know who says so.
        let label = "doc";
        try { label = new URL(d).hostname.replace(/^www\./, ""); } catch { /* relative doc path, keep the generic word */ }
        return `<a href="${esc(d)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;
      }).join(" ")}</p>` : ""}
    </div>`;
  }).join("");
}

async function probe() {
  setStatus("probing the connection ladder…");
  const res = await feed.probe({ view: { bbox: viewBBox(), zoom: Number($("dataZoom").value) || 12 } });
  renderLadder();
  setStatus(res.winner === "sim" || res.winner === "capture" ? "no live rung answered · offline register in use (see the FEED panel for why)" : `live via ${res.winner}`);
  if (!state.frame) bootSim();
}

/* ------------------------------------------------------------- import UI */

async function importText(text, name) {
  const res = feed.absorb(text, { name });
  if (res.kind === "permalink") {
    const l = res.link;
    setStatus(`permalink parsed · ${l.lat?.toFixed(4) ?? "?"},${l.lon?.toFixed(4) ?? "?"} z${l.zoom ?? "?"}${l.pguid ? ` · pguid ${l.pguid}` : ""}`);
    if (l.lat != null) flyTo({ lat: l.portalLat ?? l.lat, lon: l.portalLon ?? l.lon }, 0.3);
    return;
  }
  if (res.kind === "json-error") setStatus(`payload did not parse · ${res.error}`);
  else if (res.frame) setStatus(`${res.kind} read · ${res.frame.portals.length} portals · drawn as CAPTURE`);
}

$("btnImport").addEventListener("click", () => {
  const t = $("intelPaste").value;
  if (!t.trim()) { setStatus("nothing pasted"); return; }
  importText(t, "pasted");
});
$("intelFile").addEventListener("change", async (e) => {
  const f = e.target.files?.[0];
  if (!f) return;
  importText(await f.text(), f.name);
});
["dragover", "drop"].forEach((ev) => document.addEventListener(ev, (e) => {
  if (ev === "dragover") { e.preventDefault(); return; }
  const f = e.dataTransfer?.files?.[0];
  if (!f) return;
  e.preventDefault();
  f.text().then((t) => importText(t, f.name));
}));

function download(name, text, mime) {
  const blob = new Blob([text], { type: mime });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  setStatus(`${name} written (${blob.size.toLocaleString()} B) · exports carry their provenance strings`);
}

$("btnExportGj").addEventListener("click", () => state.frame && download("ingress-intel.geojson", toGeoJSON(state.frame), "application/geo+json"));
$("btnExportKml").addEventListener("click", () => state.frame && download("ingress-intel.kml", toKML(state.frame), "application/vnd.google-earth.kml+xml"));
$("btnExportCsv").addEventListener("click", () => state.frame && download("ingress-intel.csv", toCSV(state.frame), "text/csv"));

async function copy(text, what) {
  try {
    await navigator.clipboard.writeText(text);
    setStatus(`${what} copied to clipboard`);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.append(ta);
    ta.select();
    document.execCommand?.("copy");
    ta.remove();
    setStatus(`${what} copied via fallback (clipboard API unavailable in this context)`);
  }
}

$("btnTilesHere").addEventListener("click", () => {
  const { keys, req, params } = feed.buildRequestForView({ bbox: viewBBox(), zoom: Number($("dataZoom").value) || 12 });
  const body = { tileKeys: keys, ...(feed.cfg.version ? { v: feed.cfg.version } : {}) };
  state.lastTileRequest = { zoom: params.zoom, tilesPerEdge: params.tilesPerEdge, minLinkKm: params.minLinkKm, hasPortals: params.hasPortals, body, url: req.url, method: req.method };
  const pre = $("tileRequest");
  pre.hidden = false;
  pre.textContent = [
    `# ${keys.length} tile keys for this view · data zoom ${params.zoom} · ${params.tilesPerEdge} tiles/edge · min link ${params.minLinkKm} km · portals ${params.hasPortals ? "yes" : "no at this zoom"}`,
    `# rung ${state.feedSummary.rung}${state.feedSummary.rung === "relay" ? ` → ${feed.cfg.relayBase}${req.url.includes("://") ? "" : "/r/getEntities"}` : " → same-origin path"}`,
    JSON.stringify(body, null, 1),
    `# curl for the relay contract:\n# curl -sN '${req.url}' ${req.method === "POST" ? `-X POST -H 'content-type: application/json' --data '${JSON.stringify({ tileKeys: keys })}'` : "-H 'accept: application/json'}"}`,
  ].join("\n");
  setStatus(`${keys.length} tile keys built · the panel shows the exact call a relay would answer`);
});
$("btnCopyReq").addEventListener("click", () => {
  const { keys } = feed.buildRequestForView({ bbox: viewBBox(), zoom: Number($("dataZoom").value) || 12 });
  copy(JSON.stringify({ tileKeys: keys }, null, 1), "tile request body");
});
$("btnCopyIntel").addEventListener("click", () => {
  const t = theater;
  const [lon, lat] = state.view === "globe" ? [0, 0] : lonLatFromXZ(controls.target.x, controls.target.z);
  copy(buildIntelPermalink({ lat, lon, zoom: Number($("dataZoom").value) || 12, ...(t.id === "globe" ? {} : {}) }), "intel map permalink");
});

/* ------------------------------------------------------------ feed config */

function syncFeedInputs() {
  $("relayBase").value = feed.cfg.relayBase || "";
  $("proxyPreset").value = feed.cfg.proxy || "allorigins";
  $("dataZoom").value = String(feed.cfg.zoom || 12);
  $("refreshS").value = String(feed.cfg.refreshS || 60);
  $("clientVersion").value = feed.cfg.version || "";
  $("btnArm").setAttribute("aria-pressed", String(!!feed.cfg.auto));
}

$("relayBase").addEventListener("change", (e) => { feed.set({ relayBase: e.target.value.trim() }); renderLadder(); });
$("relayKey").addEventListener("change", (e) => { feed.set({ relayKey: e.target.value }); e.target.value = ""; });
$("proxyPreset").addEventListener("change", (e) => feed.set({ proxy: e.target.value }));
$("dataZoom").addEventListener("change", (e) => { feed.set({ zoom: Math.max(1, Math.min(21, Number(e.target.value) || 12)) }); refreshForView(); });
$("refreshS").addEventListener("change", (e) => feed.set({ refreshS: Number(e.target.value) || 60 }));
$("clientVersion").addEventListener("change", (e) => feed.set({ version: e.target.value.trim() }));
$("btnProbeFull").addEventListener("click", probe);
$("btnProbe").addEventListener("click", probe);
$("btnArm").addEventListener("click", () => {
  const on = $("btnArm").getAttribute("aria-pressed") !== "true";
  $("btnArm").setAttribute("aria-pressed", String(on));
  feed.set({ auto: on });
  if (on) feed.arm();
  else feed.disarm();
});
$("btnComms").addEventListener("click", async () => {
  setStatus("asking the active rung for comms…");
  const f = await feed.fetchComms();
  if (!f) { setStatus("comms unavailable on this rung — a relay or the same-origin rung is required"); return; }
  state.frame = { ...(state.frame || {}), plexts: [...(state.frame?.plexts || []), ...f.plexts] };
  drawFrame(state.frame);
});

/* sources list */
$("feedSources").innerHTML = [
  ...SOURCE_URLS.map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)}</a></li>`),
  ...SIM_SOURCES.map((s) => `<li>${esc(s)}</li>`),
  ...BUILD_PROBE.results.map((s) => `<li class="probe-line">${esc(s)}</li>`),
].join("");

/* -------------------------------------------------------------- topbar */

$("viewSelect").addEventListener("change", (e) => setView(e.target.value));
$("timeSelect").addEventListener("change", applyTime);
$("btnXray").addEventListener("click", () => {
  state.xray = !state.xray;
  $("btnXray").setAttribute("aria-pressed", String(state.xray));
  applyXray();
});
$("btnLinks").addEventListener("click", () => toggleLayerButton("links", "btnLinks"));
$("btnFields").addEventListener("click", () => toggleLayerButton("fields", "btnFields"));
$("btnLabels").addEventListener("click", () => {
  state.showLabels = !state.showLabels;
  $("btnLabels").setAttribute("aria-pressed", String(state.showLabels));
});
$("btnReset").addEventListener("click", () => { bootSim(); setView(state.view); setStatus("view reset · frame re-anchored on the offline register"); });

function toggleLayerButton(layer, btn) {
  const on = !layerState.get(layer);
  layerState.set(layer, on);
  $(btn).setAttribute("aria-pressed", String(on));
  applyLayerVisibility();
}

$("exag").addEventListener("input", (e) => {
  scale.vert = Number(e.target.value);
  $("exagVal").textContent = `${scale.vert}×`;
  if (state.view !== "globe") {
    for (const child of [...basinStage.groups.terrain.children]) {
      child.geometry?.dispose?.();
      if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose?.()); else child.material?.dispose?.();
      basinStage.groups.terrain.remove(child);
    }
    basinStage.build(theater.bbox);
    applyXray();
    drawFrame(state.frame);
  }
});
$("lift").addEventListener("input", (e) => { state.lift = Number(e.target.value); $("liftVal").textContent = String(state.lift); drawFrame(state.frame); });
$("linkMax").addEventListener("input", (e) => {
  state.linkFilterKm = Number(e.target.value);
  $("linkMaxVal").textContent = state.linkFilterKm >= 160 ? "160 km" : `${state.linkFilterKm} km`;
  drawFrame(state.frame);
});

document.addEventListener("keydown", (e) => {
  if (e.target.matches("input, textarea, select")) return;
  const k = e.key.toLowerCase();
  const ids = { l: "btnLabels", f: "btnFields", n: "btnLinks", x: "btnXray" };
  if (ids[k]) $(ids[k]).click();
  else if (k === "p") probe();
  else if (k === "r") $("btnReset").click();
  else if (k === "v") {
    const order = Object.keys(THEATERS);
    const next = order[(order.indexOf(state.view) + 1) % order.length];
    $("viewSelect").value = next;
    setView(next);
  } else if (k === "escape") { state.selected = null; highlight(null); }
});

/* -------------------------------------------------------------- PIP move */

function makeDraggable(pip) {
  const head = pip.querySelector(".pip-head");
  if (!head) return;
  let sx = 0, sy = 0, ox = 0, oy = 0, dragging = false;
  head.addEventListener("pointerdown", (e) => {
    if (e.target.tagName === "BUTTON") return;
    dragging = true;
    head.setPointerCapture(e.pointerId);
    const r = pip.getBoundingClientRect();
    sx = e.clientX; sy = e.clientY; ox = r.left; oy = r.top;
    pip.style.right = "auto";
    pip.style.bottom = "auto";
  });
  head.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    pip.style.left = `${Math.max(-160, Math.min(innerWidth - 90, ox + e.clientX - sx))}px`;
    pip.style.top = `${Math.max(4, Math.min(innerHeight - 40, oy + e.clientY - sy))}px`;
  });
  head.addEventListener("pointerup", () => { dragging = false; });
  const min = pip.querySelector("[data-min]");
  min?.addEventListener("click", () => {
    pip.classList.toggle("min");
    min.textContent = pip.classList.contains("min") ? "+" : "–";
  });
}
document.querySelectorAll(".pip").forEach(makeDraggable);

/* ------------------------------------------------------------- app link */

function saveHash() {
  const t = theater;
  let ll = "0,0";
  if (state.view !== "globe") {
    const [lon, lat] = lonLatFromXZ(controls.target.x, controls.target.z);
    ll = `${lat.toFixed(4)},${lon.toFixed(4)}`;
  }
  history.replaceState(null, "", `#view=${state.view}&ll=${ll}&z=${feed.cfg.zoom}`);
}

function readHash() {
  const h = new URLSearchParams(location.hash.replace(/^#/, ""));
  const view = h.get("view");
  const ll = (h.get("ll") || "").split(",").map(Number);
  const z = Number(h.get("z"));
  return { view: view && THEATERS[view] ? view : null, lat: ll[0], lon: ll[1], zoom: Number.isFinite(z) ? z : null };
}

/* ------------------------------------------------------------ time / sun */

function applyTime() {
  const v = $("timeSelect").value;
  const d = new Date();
  if (v !== "now") d.setUTCHours(Number(v), 0, 0, 0);
  const s = globe.setDay(d);
  $("hudSun").textContent = `subsolar ${s.lat.toFixed(2)}°, ${s.lon.toFixed(2)}° · ${d.toISOString().slice(0, 16)}Z`;
}

/* --------------------------------------------------------------- resize */

function resize() {
  const w = innerWidth;
  const h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
addEventListener("resize", resize);

/* ------------------------------------------------------------------ tick */

let last = performance.now();
let frames = 0;
let fpsAcc = 0;
let spin = 0;
let miniClock = 0;

function tick(now) {
  requestAnimationFrame(tick);
  const dt = (now - last) / 1000;
  last = now;
  fpsAcc += dt;
  frames++;
  if (fpsAcc > 0.5) { $("hudFps").textContent = String(Math.round(frames / fpsAcc)); frames = 0; fpsAcc = 0; }
  controls.update();
  {
    // Orbit radius + bearing + the data zoom the frame was fetched at: enough to
    // tell a screenshot from a reproducible request, and what to paste in chat.
    const dx = camera.position.x - controls.target.x;
    const dz = camera.position.z - controls.target.z;
    const r = Math.sqrt(dx * dx + dz * dz + (camera.position.y - controls.target.y) ** 2);
    const az = ((Math.atan2(dx, dz) * 180) / Math.PI + 360) % 360;
    $("hudCam").textContent = state.view === "globe"
      ? `r=${(r / THEATERS.globe.radius).toFixed(2)} R · az ${az.toFixed(0)}° · z${feed.cfg.zoom}`
      : `r=${r.toFixed(1)} · az ${az.toFixed(0)}° · z${feed.cfg.zoom} · ${tileParams(feed.cfg.zoom).tilesPerEdge.toLocaleString()} t/e`;
  }
  if (state.view === "globe" && !reduced && !draggingCamera()) {
    spin += dt * 0.02;
    globe.root.rotation.y = spin;
  }
  updateLabels();
  if (state.selected && state.view === "basin") highlight(state.selected);
  renderer.render(scene, camera);
  miniClock += dt;
  if (miniClock > 0.4 && state.frame) { miniClock = 0; drawMinimap(state.frame); }
}

let lastPointerDown = 0;
renderer.domElement.addEventListener("pointerdown", () => { lastPointerDown = performance.now(); });
function draggingCamera() { return performance.now() - lastPointerDown < 2500; }

/* ----------------------------------------------------------------- boot */

function bootSim() {
  const bbox = viewBBox();
  const frame = state.view === "globe" ? buildGlobalSimFrame({ limit: 140 }) : buildSimFrame({ bbox, limit: bbox === THEATERS.la.bbox ? 110 : 150 });
  state.frame = frame;
  drawFrame(frame);
  refreshForView();
  renderLadder();
}

const initial = readHash();
$("hudElev").textContent = state.view === "globe" ? "n/a on the sphere" : "—";
$("peer").textContent = feed.hasWebxdc ? `webxdc host · broadcasting as ${window.webxdc?.selfName || "agent"}` : "offline · standalone · peer channel needs the .xdc host";
renderLayerList();
syncFeedInputs();
resize();
applyTime();
await setView(initial.view || (initial.lat != null && Math.abs(initial.lat) > 60 ? "globe" : DEFAULT_THEATER), { fly: false });
if (initial.lat != null && Number.isFinite(initial.lat) && initial.view !== "globe") flyTo({ lat: initial.lat, lon: initial.lon }, 0.5);
if (initial.zoom) feed.set({ zoom: initial.zoom });

bootSim();
$("detailBody").innerHTML = `<p class="hint">Click any portal, link, field, comms pick or drop for its dossier.<br><br>The picture below the frame is inherited from <code>socal-subsurface</code>: same projection, same relief field${demStatus.includes("3DEP") ? " (3DEP grid installed)" : " (synthetic)"}, so a captured intel payload drapes on terrain this repo already knows how to draw.</p><p class="hint"><b>${esc(demStatus)}</b></p><p class="hint" style="color:#ff6ec7">${esc(SIM_NOTICE)}</p>`;
renderShare();

requestAnimationFrame(tick);
setStatus("booting · walking the connection ladder…");
setTimeout(async () => {
  await probe();
  setStatus(
    state.feedSummary.live
      ? `live via ${state.feedSummary.rung} · ${state.frame?.portals.length ?? 0} portals drawn`
      : `offline register · ${state.frame?.portals.length ?? 0} synthetic portals over ${GAZ_ROWS.length} gazetteer rows · six rungs probed, see FEED`
  );
}, 120);

/* A handle for the console and for the browser test. Deliberately read-mostly:
   the point is to let an agent inspect what the ladder concluded and paste their
   own payload in, not to open a second control surface nobody documents. */
window.__ingressIntel = {
  state,
  feed,
  probe,
  bootSim,
  setView,
  flyTo,
  readHash,
  viewBBox,
  /** Absorb a pasted payload through the same path the FEED panel's import box uses. */
  ingest: (text) => importText(text, "console"),
  summary: () => ({
    view: state.view,
    source: state.frame?.source ?? null,
    portals: state.frame?.portals.length ?? 0,
    links: state.frame?.links.length ?? 0,
    fields: state.frame?.fields.length ?? 0,
    plexts: state.frame?.plexts.length ?? 0,
    warnings: state.frame?.warnings ?? [],
    ladder: feed.status,
    rows: feed.probeRows.map(({ rung, ok, ms, cls, detail, fix }) => ({ rung, ok, ms, cls: cls || null, detail, fix })),
    entities: state.frame ? { portals: state.frame.portals.length, links: state.frame.links.length, fields: state.frame.fields.length, plexts: state.frame.plexts.length } : null,
  }),
};
