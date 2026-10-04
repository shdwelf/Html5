/**
 * js/four-corners.js — FOUR CORNERS 4Dwm viewer.
 *
 * Single-plate Three.js theater modeled after socal-subsurface: local
 * equirectangular projection (1 scene unit = 10 km), curated control-point
 * relief, layer toggles, gazetteer search, dossier picking, minimap.
 */

import * as THREE from "../vendor/three.module.min.js";
import { OrbitControls } from "../vendor/OrbitControls.js";
import {
  META, LAYERS, BORDERS, SAN_JUAN_RIVER, GAZETTEER, SITES,
  TERRAIN_POINTS, VIEWS, CREDITS,
} from "./four-corners-data.js";

const $ = (id) => document.getElementById(id);
const canvas = $("stage");

/* ---------------------------------------------------------- projection -- */

const KM_PER_DEG_LAT = 111.32;
const U = META.unitsPerKm; // 0.1 → 1 unit = 10 km
const cosLat = Math.cos((META.center.lat * Math.PI) / 180);
const kmPerDegLon = KM_PER_DEG_LAT * cosLat;
const px = (lon) => (lon - META.center.lon) * kmPerDegLon * U;
const pz = (lat) => -(lat - META.center.lat) * KM_PER_DEG_LAT * U;
const lonFromX = (x) => META.center.lon + x / (kmPerDegLon * U);
const latFromZ = (z) => META.center.lat - z / (KM_PER_DEG_LAT * U);

let exag = 6;
const yFor = (elevM) => ((elevM || 1500) / 1000) * U * exag;

/* IDW elevation sample (km distances, power 2.4) */
function elevAt(lon, lat) {
  let num = 0, den = 0;
  for (const [plon, plat, pel] of TERRAIN_POINTS) {
    const dx = (lon - plon) * kmPerDegLon;
    const dy = (lat - plat) * KM_PER_DEG_LAT;
    const d2 = dx * dx + dy * dy;
    if (d2 < 0.25) return pel;
    const w = 1 / Math.pow(d2, 1.2);
    num += w * pel;
    den += w;
  }
  return num / den;
}

/* ------------------------------------------------------------ renderer -- */

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
} catch (error) {
  const fb = document.createElement("div");
  fb.className = "fallback";
  fb.textContent = "WebGL is unavailable in this webview, so the Four Corners theater cannot render.";
  document.body.append(fb);
  throw error;
}
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0d10);
scene.fog = new THREE.Fog(0x0a0d10, 60, 160);

const camera = new THREE.PerspectiveCamera(55, 1, 0.05, 500);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI * 0.49;
controls.minDistance = 1.2;
controls.maxDistance = 80;

scene.add(new THREE.AmbientLight(0x8d97a5, 0.75));
const sun = new THREE.DirectionalLight(0xfff3dd, 1.15);
sun.position.set(-18, 30, -12);
scene.add(sun);

/* -------------------------------------------------------------- terrain -- */

const GRID_X = 120, GRID_Z = 96;
const x0 = px(META.bbox.lon0), x1 = px(META.bbox.lon1);
const z0 = pz(META.bbox.lat1), z1 = pz(META.bbox.lat0); // lat1 is north → smaller z
const baseElev = new Float32Array((GRID_X + 1) * (GRID_Z + 1));

const stateTints = {
  az: new THREE.Color("#5b4337"), nm: new THREE.Color("#5e5138"),
  co: new THREE.Color("#44523f"), ut: new THREE.Color("#63463b"),
};
const highTint = new THREE.Color("#c9bfa8");

let terrainMesh;
function buildTerrain() {
  const pos = [], col = [], idx = [];
  const c = new THREE.Color();
  for (let j = 0; j <= GRID_Z; j++) {
    for (let i = 0; i <= GRID_X; i++) {
      const x = x0 + ((x1 - x0) * i) / GRID_X;
      const z = z0 + ((z1 - z0) * j) / GRID_Z;
      const lon = lonFromX(x), lat = latFromZ(z);
      const e = elevAt(lon, lat);
      baseElev[j * (GRID_X + 1) + i] = e;
      pos.push(x, yFor(e), z);
      const base = lon < BORDERS.quadLon
        ? (lat < BORDERS.quadLat ? stateTints.az : stateTints.ut)
        : (lat < BORDERS.quadLat ? stateTints.nm : stateTints.co);
      const t = Math.min(1, Math.max(0, (e - 1250) / 2300));
      c.copy(base).lerp(highTint, t * t * 0.9 + t * 0.2);
      col.push(c.r, c.g, c.b);
    }
  }
  for (let j = 0; j < GRID_Z; j++) {
    for (let i = 0; i < GRID_X; i++) {
      const a = j * (GRID_X + 1) + i, b = a + 1, d = a + GRID_X + 1, e2 = d + 1;
      idx.push(a, d, b, b, d, e2);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: false });
  terrainMesh = new THREE.Mesh(geo, mat);
  terrainMesh.userData = { kind: "terrain" };
  scene.add(terrainMesh);
}
buildTerrain();

function updateTerrainHeights() {
  const posAttr = terrainMesh.geometry.getAttribute("position");
  for (let k = 0; k < baseElev.length; k++) posAttr.setY(k, yFor(baseElev[k]));
  posAttr.needsUpdate = true;
  terrainMesh.geometry.computeVertexNormals();
}

/* -------------------------------------------------------------- borders -- */

const groupFor = {};
for (const l of LAYERS) {
  groupFor[l.id] = new THREE.Group();
  scene.add(groupFor[l.id]);
}

const LIFT = 0.03;
function groundLine(points, color, width = 1) {
  const verts = [];
  for (const [lon, lat] of points) verts.push(px(lon), yFor(elevAt(lon, lat)) + LIFT, pz(lat));
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  return new THREE.Line(geo, new THREE.LineBasicMaterial({ color, linewidth: width, transparent: true, opacity: 0.9 }));
}

function rebuildLines() {
  for (const id of ["borders", "rivers"]) groupFor[id].clear();
  const ns = [], ew = [];
  for (let lat = META.bbox.lat0; lat <= META.bbox.lat1 + 1e-9; lat += 0.02) ns.push([BORDERS.quadLon, lat]);
  for (let lon = META.bbox.lon0; lon <= META.bbox.lon1 + 1e-9; lon += 0.02) ew.push([lon, BORDERS.quadLat]);
  groupFor.borders.add(groundLine(ns, 0xe8d9a0));
  groupFor.borders.add(groundLine(ew, 0xe8d9a0));
  const beacon = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.16),
    new THREE.MeshBasicMaterial({ color: 0xffe9a8 }),
  );
  beacon.position.set(px(BORDERS.quadLon), yFor(elevAt(BORDERS.quadLon, BORDERS.quadLat)) + 0.35, pz(BORDERS.quadLat));
  beacon.userData = { kind: "quad" };
  groupFor.borders.add(beacon);
  pickables.push(beacon);
  groupFor.rivers.add(groundLine(SAN_JUAN_RIVER, 0x5cb8ff, 2));
}

/* ---------------------------------------------------------------- nodes -- */

const pickables = [];
const labeled = []; // { obj, el, lon, lat, elevM, layer }
const labelsRoot = $("labels");

function addLabel(text, lon, lat, elevM, layer, cls = "") {
  const el = document.createElement("div");
  el.className = `lbl ${cls}`;
  el.textContent = text;
  labelsRoot.append(el);
  labeled.push({ el, lon, lat, elevM, layer });
}

const layerColors = Object.fromEntries(LAYERS.map((l) => [l.id, new THREE.Color(l.color)]));

function markerGeoFor(layer) {
  if (layer === "necks") return new THREE.ConeGeometry(0.11, 0.42, 5);
  if (layer === "gaz") return new THREE.SphereGeometry(0.055, 8, 8);
  return new THREE.OctahedronGeometry(0.1);
}

function buildNodes() {
  for (const site of SITES) {
    const m = new THREE.Mesh(markerGeoFor(site.layer), new THREE.MeshBasicMaterial({ color: layerColors[site.layer] }));
    const e = site.elevM ?? elevAt(site.lon, site.lat);
    m.position.set(px(site.lon), yFor(e) + 0.14, pz(site.lat));
    m.userData = { kind: "site", site, elevM: e };
    groupFor[site.layer].add(m);
    pickables.push(m);
    addLabel(site.name, site.lon, site.lat, e, site.layer, `tier-${site.tier}`);
  }
  for (const row of GAZETTEER) {
    const [name, fclass, , , lat, lon, elevM] = row;
    const m = new THREE.Mesh(markerGeoFor("gaz"), new THREE.MeshBasicMaterial({ color: layerColors.gaz }));
    const e = elevM ?? elevAt(lon, lat);
    m.position.set(px(lon), yFor(e) + 0.07, pz(lat));
    m.userData = { kind: "gaz", row, elevM: e };
    groupFor.gaz.add(m);
    pickables.push(m);
    if (fclass === "Summit" || fclass === "Populated Place" || fclass === "Locale") {
      addLabel(name, lon, lat, e, "gaz", "lbl-gaz");
    }
  }
  for (const st of BORDERS.states) {
    addLabel(st.name, st.labelAt.lon, st.labelAt.lat, elevAt(st.labelAt.lon, st.labelAt.lat), "borders", "lbl-state");
  }
}
rebuildLines();
buildNodes();

function repositionNodes() {
  for (const g of Object.values(groupFor)) {
    g.traverse((o) => {
      if (o.userData && (o.userData.kind === "site" || o.userData.kind === "gaz")) {
        const { site, row, elevM } = o.userData;
        const lon = site ? site.lon : row[5];
        const lat = site ? site.lat : row[4];
        o.position.y = yFor(elevM ?? elevAt(lon, lat)) + (site ? 0.14 : 0.07);
      }
    });
  }
  for (const id of ["borders", "rivers"]) groupFor[id].clear();
  pickables.splice(0, pickables.length, ...pickables.filter((p) => p.userData.kind !== "quad"));
  rebuildLines();
}

/* --------------------------------------------------------------- layers -- */

const layerState = Object.fromEntries(LAYERS.map((l) => [l.id, l.on]));
const layerList = $("layerList");
for (const l of LAYERS) {
  const rowEl = document.createElement("label");
  rowEl.className = "layer-row";
  rowEl.innerHTML = `<input type="checkbox" ${l.on ? "checked" : ""} data-layer="${l.id}" /><span class="swatch" style="background:${l.color}"></span>${l.name}`;
  layerList.append(rowEl);
}
layerList.addEventListener("change", (ev) => {
  const id = ev.target?.dataset?.layer;
  if (!id) return;
  layerState[id] = ev.target.checked;
  if (id === "terrain") terrainMesh.visible = ev.target.checked;
  else groupFor[id].visible = ev.target.checked;
  updateHud();
});

/* -------------------------------------------------------------- dossier -- */

const detailBody = $("detailBody");
function esc(s) {
  return String(s).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}
function showSite(site) {
  const src = (site.sources || [])
    .map(([label, url]) => `<li><a href="${esc(url)}" target="_blank" rel="noopener">${esc(label)}</a></li>`)
    .join("");
  detailBody.innerHTML = `
    <h3>${esc(site.name)}</h3>
    <p class="meta"><span class="tier tier-${esc(site.tier)}">${esc(site.tier)}</span> · ${esc(site.kind || "site")} · ${site.lat.toFixed(4)}, ${site.lon.toFixed(4)}${site.elevM ? ` · ${site.elevM} m` : ""}${site.depthM ? ` · schematic depth ${site.depthM} m` : ""}</p>
    ${(site.story || []).map((s) => `<p>${esc(s)}</p>`).join("")}
    ${src ? `<p class="meta">sources</p><ul class="srcs">${src}</ul>` : ""}`;
}
function showGaz(row) {
  const [name, fclass, ftt, state, lat, lon, elevM, note] = row;
  detailBody.innerHTML = `
    <h3>${esc(name)}</h3>
    <p class="meta">GNIS class ${esc(fclass)} · ADL FTT ${esc(ftt)} · ${esc(state)}</p>
    <p class="meta">${lat.toFixed(4)}, ${lon.toFixed(4)}${elevM ? ` · ${elevM} m` : ""}</p>
    ${note ? `<p>${esc(note)}</p>` : ""}
    <p class="hint">Curated seed register row — position curated, FEATURE_ID not yet pinned (never invented).</p>`;
}
function showQuad() {
  detailBody.innerHTML = `
    <h3>Four Corners quadripoint</h3>
    <p class="meta">36.998976, −109.045172 (NAD83)</p>
    <p>${esc(META.quadripoint.note)}</p>
    <p class="hint">Navajo Nation Parks &amp; Recreation administers the monument.</p>`;
}

/* -------------------------------------------------------------- picking -- */

const ray = new THREE.Raycaster();
ray.params.Points = { threshold: 0.2 };
const ndc = new THREE.Vector2();
let cursorLonLat = null;

canvas.addEventListener("pointermove", (ev) => {
  ndc.set((ev.clientX / innerWidth) * 2 - 1, -(ev.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObject(terrainMesh, false)[0];
  cursorLonLat = hit ? { lon: lonFromX(hit.point.x), lat: latFromZ(hit.point.z) } : null;
});

canvas.addEventListener("click", (ev) => {
  ndc.set((ev.clientX / innerWidth) * 2 - 1, -(ev.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const vis = pickables.filter((p) => p.parent?.visible !== false);
  const hit = ray.intersectObjects(vis, false)[0];
  if (!hit) return;
  const u = hit.object.userData;
  if (u.kind === "site") showSite(u.site);
  else if (u.kind === "gaz") showGaz(u.row);
  else if (u.kind === "quad") showQuad();
});

/* ---------------------------------------------------------------- views -- */

const viewSelect = $("viewSelect");
for (const v of VIEWS) {
  const opt = document.createElement("option");
  opt.value = v.id;
  opt.textContent = v.label;
  viewSelect.append(opt);
}
function applyView(id) {
  const v = VIEWS.find((x) => x.id === id) || VIEWS[0];
  const [lon, lat] = v.target;
  const ty = yFor(elevAt(lon, lat));
  const pitch = (v.pitch * Math.PI) / 180;
  controls.target.set(px(lon), ty, pz(lat));
  camera.position.set(px(lon), ty + v.dist * Math.sin(pitch), pz(lat) + v.dist * Math.cos(pitch));
  controls.update();
}
viewSelect.addEventListener("change", () => applyView(viewSelect.value));

function flyTo(lon, lat, dist = 5) {
  const ty = yFor(elevAt(lon, lat));
  controls.target.set(px(lon), ty, pz(lat));
  camera.position.set(px(lon), ty + dist * 0.75, pz(lat) + dist * 0.66);
  controls.update();
}

/* --------------------------------------------------------------- search -- */

const searchBox = $("searchBox");
const searchResults = $("searchResults");
function runSearch(q) {
  searchResults.innerHTML = "";
  if (!q || q.length < 2) return;
  const needle = q.toLowerCase();
  const hits = [];
  for (const row of GAZETTEER) {
    if (row[0].toLowerCase().includes(needle)) hits.push({ label: `${row[0]} — ${row[1]}, ${row[3]}`, lon: row[5], lat: row[4], row });
  }
  for (const site of SITES) {
    if (site.name.toLowerCase().includes(needle)) hits.push({ label: `${site.name} — ${site.kind || site.layer}`, lon: site.lon, lat: site.lat, site });
  }
  for (const h of hits.slice(0, 12)) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = h.label;
    b.addEventListener("click", () => {
      flyTo(h.lon, h.lat);
      if (h.site) showSite(h.site);
      else showGaz(h.row);
      searchResults.innerHTML = "";
      searchBox.value = "";
    });
    searchResults.append(b);
  }
}
searchBox.addEventListener("input", () => runSearch(searchBox.value.trim()));

/* -------------------------------------------------------------- buttons -- */

let labelsOn = true;
$("btnLabels").addEventListener("click", (ev) => {
  labelsOn = !labelsOn;
  ev.currentTarget.setAttribute("aria-pressed", String(labelsOn));
});
let wireOn = false;
$("btnWire").addEventListener("click", (ev) => {
  wireOn = !wireOn;
  terrainMesh.material.wireframe = wireOn;
  ev.currentTarget.setAttribute("aria-pressed", String(wireOn));
});
$("btnReset").addEventListener("click", () => {
  viewSelect.value = "quad";
  applyView("quad");
});

const exagSlider = $("vertExag");
exagSlider.addEventListener("input", () => {
  exag = Number(exagSlider.value);
  $("vertExagVal").textContent = `${exag}×`;
  updateTerrainHeights();
  repositionNodes();
});

/* ---------------------------------------------------------- pip drag/min -- */

for (const pip of document.querySelectorAll(".pip")) {
  const head = pip.querySelector(".pip-head");
  const minBtn = pip.querySelector("[data-min]");
  minBtn?.addEventListener("click", () => pip.classList.toggle("min"));
  let drag = null;
  head.addEventListener("pointerdown", (ev) => {
    if (ev.target === minBtn) return;
    const r = pip.getBoundingClientRect();
    drag = { dx: ev.clientX - r.left, dy: ev.clientY - r.top };
    head.setPointerCapture(ev.pointerId);
  });
  head.addEventListener("pointermove", (ev) => {
    if (!drag) return;
    pip.style.left = `${Math.max(0, ev.clientX - drag.dx)}px`;
    pip.style.top = `${Math.max(0, ev.clientY - drag.dy)}px`;
    pip.style.right = "auto";
    pip.style.bottom = "auto";
  });
  head.addEventListener("pointerup", () => { drag = null; });
}

/* -------------------------------------------------------------- minimap -- */

const minimap = $("minimap");
const mctx = minimap.getContext("2d");
function drawMinimap() {
  const w = minimap.width, h = minimap.height;
  const mx = (lon) => ((lon - META.bbox.lon0) / (META.bbox.lon1 - META.bbox.lon0)) * w;
  const my = (lat) => ((META.bbox.lat1 - lat) / (META.bbox.lat1 - META.bbox.lat0)) * h;
  mctx.clearRect(0, 0, w, h);
  mctx.fillStyle = "#101418";
  mctx.fillRect(0, 0, w, h);
  mctx.strokeStyle = "#e8d9a066";
  mctx.beginPath();
  mctx.moveTo(mx(BORDERS.quadLon), 0); mctx.lineTo(mx(BORDERS.quadLon), h);
  mctx.moveTo(0, my(BORDERS.quadLat)); mctx.lineTo(w, my(BORDERS.quadLat));
  mctx.stroke();
  mctx.strokeStyle = "#5cb8ff88";
  mctx.beginPath();
  SAN_JUAN_RIVER.forEach(([lon, lat], i) => (i ? mctx.lineTo(mx(lon), my(lat)) : mctx.moveTo(mx(lon), my(lat))));
  mctx.stroke();
  for (const site of SITES) {
    if (!layerState[site.layer]) continue;
    mctx.fillStyle = LAYERS.find((l) => l.id === site.layer)?.color || "#fff";
    mctx.fillRect(mx(site.lon) - 1.5, my(site.lat) - 1.5, 3, 3);
  }
  const tLon = lonFromX(controls.target.x), tLat = latFromZ(controls.target.z);
  mctx.strokeStyle = "#ffffffcc";
  mctx.beginPath();
  mctx.arc(mx(tLon), my(tLat), 5, 0, Math.PI * 2);
  mctx.stroke();
}

/* ------------------------------------------------------------------ HUD -- */

const hud = {
  cam: $("hudCam"), target: $("hudTarget"), lonlat: $("hudLonLat"), elev: $("hudElev"),
  layers: $("hudLayers"), objects: $("hudObjects"), fps: $("hudFps"),
};
function updateHud() {
  hud.layers.textContent = LAYERS.filter((l) => layerState[l.id]).map((l) => l.id).join(" ");
  hud.objects.textContent = String(pickables.length);
}
updateHud();
$("status").textContent = `${META.title} · ${SITES.length} sites · ${GAZETTEER.length} gazetteer rows · ${CREDITS[0]}`;

/* ----------------------------------------------------------------- loop -- */

const v3 = new THREE.Vector3();
let frames = 0, lastFps = performance.now();

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
addEventListener("resize", resize);
resize();
applyView("quad");

function tick() {
  requestAnimationFrame(tick);
  controls.update();
  renderer.render(scene, camera);

  for (const L of labeled) {
    const on = labelsOn && layerState[L.layer] !== false;
    if (!on) { L.el.style.display = "none"; continue; }
    v3.set(px(L.lon), yFor(L.elevM ?? 1500) + 0.25, pz(L.lat)).project(camera);
    const dist = camera.position.distanceTo(new THREE.Vector3(px(L.lon), 0, pz(L.lat)));
    if (v3.z > 1 || dist > (L.el.classList.contains("lbl-state") ? 90 : 26)) {
      L.el.style.display = "none";
      continue;
    }
    L.el.style.display = "block";
    L.el.style.transform = `translate(-50%,-100%) translate(${((v3.x + 1) / 2) * innerWidth}px, ${((1 - v3.y) / 2) * innerHeight}px)`;
  }

  hud.cam.textContent = `${camera.position.x.toFixed(1)}, ${camera.position.y.toFixed(1)}, ${camera.position.z.toFixed(1)}`;
  const tLon = lonFromX(controls.target.x), tLat = latFromZ(controls.target.z);
  hud.target.textContent = `${tLat.toFixed(4)}, ${tLon.toFixed(4)}`;
  if (cursorLonLat) {
    hud.lonlat.textContent = `${cursorLonLat.lat.toFixed(4)}, ${cursorLonLat.lon.toFixed(4)}`;
    hud.elev.textContent = `${Math.round(elevAt(cursorLonLat.lon, cursorLonLat.lat))} m (curated IDW)`;
  }
  frames++;
  const now = performance.now();
  if (now - lastFps > 500) {
    hud.fps.textContent = String(Math.round((frames * 1000) / (now - lastFps)));
    frames = 0;
    lastFps = now;
    drawMinimap();
  }
}
tick();
