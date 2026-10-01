import * as THREE from "../vendor/three.module.min.js";
import { OrbitControls } from "../vendor/OrbitControls.js";
import {
  CONSTELLATIONS,
  EARTH_RADIUS_KM,
  LAYERS,
  TIMELINE_EVENTS,
  VIEW_PRESETS,
  constellationDesignCount,
  countAtYear,
  horizonHalfAngleDeg,
  modelDisclaimer,
  oneWayLightTimeMs,
  orbitalPeriodMinutes,
  orbitalSpeedKmS,
  visibleProxyCount,
} from "./satellite-constellations-data.js";

const $ = (id) => document.getElementById(id);
const canvas = $("stage");
const EARTH_VIS_RADIUS = 8;
const KM_TO_UNITS = EARTH_VIS_RADIUS / EARTH_RADIUS_KM;
const GEO_ALT_KM = 35786;
const GEO_RADIUS_VIS = (EARTH_RADIUS_KM + GEO_ALT_KM) * KM_TO_UNITS;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
} catch (error) {
  const fb = document.createElement("div");
  fb.className = "fallback";
  fb.textContent = "WebGL is unavailable in this webview, so the satellite constellation theater cannot render.";
  document.body.append(fb);
  throw error;
}
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x030712);
scene.fog = new THREE.Fog(0x030712, 95, 210);

const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 260);
camera.position.set(...VIEW_PRESETS.overview.pos);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 9;
controls.maxDistance = 150;
controls.target.set(...VIEW_PRESETS.overview.target);

const world = new THREE.Group();
scene.add(world);
scene.add(new THREE.AmbientLight(0x6aa8ff, 0.42));
const sun = new THREE.DirectionalLight(0xffffff, 2.1);
sun.position.set(-55, 18, 38);
scene.add(sun);
const fill = new THREE.DirectionalLight(0x3b82f6, 0.35);
fill.position.set(45, -18, -30);
scene.add(fill);

const groups = {};
for (const layer of LAYERS) {
  const g = new THREE.Group();
  g.name = layer.id;
  groups[layer.id] = g;
  world.add(g);
}

const layerState = new Map(LAYERS.map((l) => [l.id, l.on]));
const PICKABLE = [];
const SATELLITES = [];
const ORBIT_LINES = [];
const labelHost = $("labels");
const labelEls = new Map();
let selected = null;
let selectedColor = null;
let year = Number($("yearSlider")?.value || 2026);
let orbiting = true;
let showShells = true;
let labelsOn = true;
let timelinePlaying = false;
let orbitSpeed = Number($("speedSlider")?.value || 4);
let simMinutes = 0;

function setStatus(text) { const el = $("status"); if (el) el.textContent = text; }
function colorOf(hex) { return new THREE.Color(hex); }
function visualRadius(altKm) { return (EARTH_RADIUS_KM + altKm) * KM_TO_UNITS; }
function fmtCount(n) { return n >= 1000 ? n.toLocaleString() : String(n); }
function fmtPeriod(min) { return min >= 180 ? `${(min / 60).toFixed(2)} h` : `${min.toFixed(1)} min`; }

function makeEarthTexture() {
  const cv = document.createElement("canvas");
  cv.width = 1024; cv.height = 512;
  const g = cv.getContext("2d");
  const grad = g.createLinearGradient(0, 0, 0, cv.height);
  grad.addColorStop(0, "#10233f");
  grad.addColorStop(0.5, "#0a1f33");
  grad.addColorStop(1, "#081827");
  g.fillStyle = grad; g.fillRect(0, 0, cv.width, cv.height);
  g.strokeStyle = "rgba(125,211,252,.22)"; g.lineWidth = 1;
  for (let lon = -180; lon <= 180; lon += 15) {
    const x = ((lon + 180) / 360) * cv.width;
    g.beginPath(); g.moveTo(x, 0); g.lineTo(x, cv.height); g.stroke();
  }
  for (let lat = -75; lat <= 75; lat += 15) {
    const y = ((90 - lat) / 180) * cv.height;
    g.beginPath(); g.moveTo(0, y); g.lineTo(cv.width, y); g.stroke();
  }
  g.fillStyle = "rgba(74,115,78,.72)";
  const blobs = [
    [[190,150],[240,118],[315,142],[350,205],[312,245],[220,232]],
    [[428,120],[510,108],[578,152],[562,225],[480,236],[420,190]],
    [[560,260],[635,260],[680,328],[622,392],[548,352]],
    [[708,126],[792,112],[850,172],[830,234],[748,228]],
    [[820,272],[884,298],[905,364],[850,410],[798,360]],
    [[72,235],[120,220],[150,260],[122,315],[64,302]],
  ];
  for (const blob of blobs) {
    g.beginPath(); blob.forEach(([x,y],i)=> i?g.lineTo(x,y):g.moveTo(x,y)); g.closePath(); g.fill();
  }
  g.strokeStyle = "rgba(255,255,255,.38)"; g.strokeRect(0.5, 0.5, cv.width - 1, cv.height - 1);
  return new THREE.CanvasTexture(cv);
}

const earth = new THREE.Mesh(
  new THREE.SphereGeometry(EARTH_VIS_RADIUS, 96, 48),
  new THREE.MeshStandardMaterial({ map: makeEarthTexture(), roughness: 0.88, metalness: 0.02 }),
);
groups.reference.add(earth);

const atmosphere = new THREE.Mesh(
  new THREE.SphereGeometry(EARTH_VIS_RADIUS * 1.035, 96, 48),
  new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.08, side: THREE.BackSide }),
);
groups.reference.add(atmosphere);

function makeRing(radius, color, opacity = 0.35, segments = 192) {
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const a = i / segments * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
  }
  const g = new THREE.BufferGeometry().setFromPoints(pts);
  return new THREE.Line(g, new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
}

const equator = makeRing(EARTH_VIS_RADIUS * 1.01, 0x7dd3fc, 0.55);
groups.reference.add(equator);
const leoBoundary = makeRing(visualRadius(2000), 0x5eead4, 0.18);
groups.reference.add(leoBoundary);
const geoBelt = makeRing(GEO_RADIUS_VIS, 0x93c5fd, 0.35);
groups.reference.add(geoBelt);

function orbitalPoint(shell, plane, slot, slots, minutes = 0) {
  const r = visualRadius(shell.altitudeKm);
  const inc = THREE.MathUtils.degToRad(shell.inclinationDeg);
  const raan = (plane / Math.max(1, shell.planes)) * Math.PI * 2 + (shell.raanOffset || 0);
  const period = orbitalPeriodMinutes(shell.altitudeKm);
  const animateTerm = shell.longitudeLocked && shell.inclinationDeg < 1 ? 0 : (minutes / period) * Math.PI * 2;
  const phase = (slot / Math.max(1, slots)) * Math.PI * 2 + (plane * (shell.phasing || 0) / Math.max(1, slots)) * Math.PI * 2;
  const u = phase + animateTerm;
  const cu = Math.cos(u), su = Math.sin(u), cO = Math.cos(raan), sO = Math.sin(raan), ci = Math.cos(inc), si = Math.sin(inc);
  return new THREE.Vector3(
    r * (cO * cu - sO * su * ci),
    r * (su * si),
    r * (sO * cu + cO * su * ci),
  );
}

function makeOrbitLine(c, shell, plane) {
  const pts = [];
  for (let i = 0; i <= 240; i++) pts.push(orbitalPoint(shell, plane, i, 240, 0));
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({ color: c.color, transparent: true, opacity: 0.34 });
  const line = new THREE.Line(geo, mat);
  line.userData = { record: c, shell, kind: "orbit", plane };
  groups[c.layer].add(line);
  PICKABLE.push(line);
  ORBIT_LINES.push({ line, c, shell, plane });
}

function satelliteSize(c, shell) {
  if (c.id === "starlink") return 0.055;
  if (c.id === "oneweb") return 0.065;
  if (shell.altitudeKm > 30000) return 0.12;
  if (shell.altitudeKm > 5000) return 0.095;
  return 0.08;
}

for (const c of CONSTELLATIONS) {
  const label = document.createElement("div");
  label.className = `lbl t-${c.layer}`;
  label.textContent = c.short;
  labelHost.append(label);
  labelEls.set(c.id, label);

  for (const shell of c.shells) {
    for (let p = 0; p < shell.planes; p++) makeOrbitLine(c, shell, p);
    const perPlane = Math.max(1, Math.round(shell.renderSatellites / shell.planes));
    for (let i = 0; i < shell.renderSatellites; i++) {
      const plane = Math.min(shell.planes - 1, Math.floor(i / perPlane));
      const slot = i % perPlane;
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(satelliteSize(c, shell), 10, 8),
        new THREE.MeshStandardMaterial({ color: c.color, emissive: colorOf(c.color).multiplyScalar(0.45), roughness: 0.4, metalness: 0.15 }),
      );
      mesh.userData = { record: c, shell, kind: "satellite", plane, slot, slots: perPlane, proxyIndex: i, proxyRepresents: Math.max(1, Math.round((shell.satellites || shell.renderSatellites) / shell.renderSatellites)) };
      groups[c.layer].add(mesh);
      PICKABLE.push(mesh);
      SATELLITES.push({ mesh, c, shell, plane, slot, slots: perPlane, proxyIndex: i });
    }
  }
}

function isVisible(obj) {
  let o = obj;
  while (o) { if (o.visible === false) return false; o = o.parent; }
  return true;
}

function updateVisibilityAndPositions() {
  for (const layer of LAYERS) groups[layer.id].visible = !!layerState.get(layer.id);
  for (const entry of ORBIT_LINES) entry.line.visible = showShells && countAtYear(entry.c, year) > 0;
  for (const entry of SATELLITES) {
    const n = visibleProxyCount(entry.c, entry.shell, year);
    entry.mesh.visible = entry.proxyIndex < n;
    if (entry.mesh.visible) entry.mesh.position.copy(orbitalPoint(entry.shell, entry.plane, entry.slot, entry.slots, simMinutes));
  }
  refreshHud();
}

function renderDetail(record, shell = null, kind = "constellation") {
  const body = $("detailBody");
  body.textContent = "";
  if (!record) {
    const p = document.createElement("p");
    p.className = "hint";
    p.textContent = "Click any satellite marker or orbit shell. This viewer draws circularized public constellation summaries; it does not fetch TLEs or predict real satellite positions.";
    body.append(p);
    return;
  }
  const h = document.createElement("h3");
  h.className = "detail-title";
  h.textContent = record.name;
  const tier = document.createElement("span");
  tier.className = `tier ${record.layer}`;
  tier.textContent = `${kind.toUpperCase()} · ${record.short}`;
  const dl = document.createElement("dl");
  dl.className = "kv";
  const rows = [
    ["operator", record.operator],
    ["purpose", record.purpose],
    ["shown in", String(year)],
    ["timeline count", fmtCount(countAtYear(record, year))],
    ["design/current", fmtCount(record.currentSatellites || constellationDesignCount(record))],
  ];
  if (shell) {
    const period = orbitalPeriodMinutes(shell.altitudeKm);
    rows.push(["shell", `${shell.altitudeKm.toLocaleString()} km · ${shell.inclinationDeg}°`]);
    rows.push(["planes", `${shell.planes} × ${shell.satsPerPlane || Math.round(shell.renderSatellites / shell.planes)} slots`]);
    rows.push(["period", fmtPeriod(period)]);
    rows.push(["speed", `${orbitalSpeedKmS(shell.altitudeKm).toFixed(2)} km/s`]);
    rows.push(["horizon", `${horizonHalfAngleDeg(shell.altitudeKm).toFixed(1)}° Earth-central`]);
    rows.push(["light time", `${oneWayLightTimeMs(shell.altitudeKm).toFixed(1)} ms straight up`]);
  } else {
    rows.push(["shells", String(record.shells.length)]);
  }
  for (const [k, v] of rows) {
    const dt = document.createElement("dt"); dt.textContent = k;
    const dd = document.createElement("dd"); dd.textContent = v;
    dl.append(dt, dd);
  }
  const ul = document.createElement("ul"); ul.className = "facts";
  for (const f of record.facts) { const li = document.createElement("li"); li.textContent = f; ul.append(li); }
  const src = document.createElement("ul"); src.className = "srcs";
  for (const [label, url] of record.sources || []) {
    const li = document.createElement("li");
    const a = document.createElement("a"); a.href = url; a.target = "_blank"; a.rel = "noopener"; a.textContent = label;
    li.append(a); src.append(li);
  }
  const caveat = document.createElement("p"); caveat.className = "hint"; caveat.textContent = modelDisclaimer;
  body.append(h, tier, dl, ul, caveat);
  if (src.childElementCount) { const sh = document.createElement("p"); sh.className = "hint"; sh.textContent = "sources"; body.append(sh, src); }
}

renderDetail(null);

function select(obj) {
  if (selected?.material?.color && selectedColor) selected.material.color.copy(selectedColor);
  selected = obj || null; selectedColor = null;
  if (!obj) { renderDetail(null); setStatus("no selection"); return; }
  if (obj.material?.color) { selectedColor = obj.material.color.clone(); obj.material.color.set(0xffffff); }
  const rec = obj.userData.record;
  renderDetail(rec, obj.userData.shell, obj.userData.kind);
  setStatus(`selected · ${rec.name} · ${obj.userData.kind}`);
  const pip = $("pipDetail"); if (pip) pip.classList.remove("min");
}

const raycaster = new THREE.Raycaster();
raycaster.params.Line = { threshold: 0.4 };
const pointer = new THREE.Vector2();
let downAt = null;
renderer.domElement.addEventListener("pointerdown", (e) => { downAt = { x: e.clientX, y: e.clientY }; });
renderer.domElement.addEventListener("pointerup", (e) => {
  if (!downAt) return;
  const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y); downAt = null;
  if (moved > 6) return;
  const r = renderer.domElement.getBoundingClientRect();
  pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
  pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(PICKABLE.filter(isVisible), false);
  select(hits.length ? hits[0].object : null);
});

function buildLayerPanel() {
  const host = $("layerList"); if (!host) return;
  host.textContent = "";
  for (const l of LAYERS) {
    const row = document.createElement("label"); row.className = "layer-row";
    const cb = document.createElement("input"); cb.type = "checkbox"; cb.checked = layerState.get(l.id);
    cb.addEventListener("change", () => { layerState.set(l.id, cb.checked); updateVisibilityAndPositions(); drawChart(); });
    const sw = document.createElement("span"); sw.className = "swatch"; sw.style.background = l.color;
    const txt = document.createElement("span"); txt.textContent = l.name;
    row.append(cb, sw, txt); host.append(row);
  }
  const hr = document.createElement("p"); hr.className = "hint"; hr.textContent = "constellations"; host.append(hr);
  for (const c of CONSTELLATIONS) {
    const btn = document.createElement("button"); btn.type = "button"; btn.className = "constellation-row";
    btn.innerHTML = `<span class="swatch" style="background:${c.color}"></span><span>${c.short} · ${c.name}</span>`;
    btn.addEventListener("click", () => { renderDetail(c, c.shells[0], "constellation"); flyTo(c.layer === "broadband" || c.layer === "mobile" || c.layer === "earthobs" ? "leo" : "meo"); });
    host.append(btn);
  }
}

function buildTimeline() {
  const host = $("eventList"); if (!host) return;
  host.textContent = "";
  for (const ev of TIMELINE_EVENTS) {
    const btn = document.createElement("button"); btn.type = "button"; btn.dataset.year = ev.year;
    btn.innerHTML = `<b>${ev.year}</b> · ${ev.label}<br><span class="hint">${ev.note || (ev.constellation ? CONSTELLATIONS.find(c=>c.id===ev.constellation)?.name || "" : "")}</span>`;
    btn.addEventListener("click", () => { setYear(ev.year); if (ev.constellation) { const c = CONSTELLATIONS.find(c=>c.id===ev.constellation); if (c) renderDetail(c, c.shells[0], "event"); } });
    host.append(btn);
  }
}

function setYear(next) {
  year = Math.max(1957, Math.min(2032, Math.round(next)));
  if ($("yearSlider")) $("yearSlider").value = String(year);
  if ($("yearVal")) $("yearVal").value = String(year), $("yearVal").textContent = String(year);
  document.querySelectorAll("#eventList button").forEach(b => b.classList.toggle("active", Number(b.dataset.year) <= year && Number(b.dataset.year) > year - 3));
  updateVisibilityAndPositions(); drawChart(); drawMiniMap();
}

function refreshHud() {
  const active = CONSTELLATIONS.filter(c => countAtYear(c, year) > 0 && layerState.get(c.layer));
  const proxy = SATELLITES.filter(s => s.mesh.visible && isVisible(s.mesh)).length;
  if ($("hudYear")) $("hudYear").textContent = String(year);
  if ($("hudActive")) $("hudActive").textContent = `${active.length}/${CONSTELLATIONS.length}`;
  if ($("hudProxy")) $("hudProxy").textContent = `${proxy} drawn`;
  if ($("hudObjects")) $("hudObjects").textContent = String(PICKABLE.filter(isVisible).length);
}

function drawChart() {
  const cv = $("orbitChart"); if (!cv) return;
  const dpr = Math.min(devicePixelRatio || 1, 2), w = cv.clientWidth || 260, h = cv.clientHeight || 170;
  if (cv.width !== Math.round(w*dpr) || cv.height !== Math.round(h*dpr)) { cv.width = Math.round(w*dpr); cv.height = Math.round(h*dpr); }
  const g = cv.getContext("2d"); g.setTransform(dpr,0,0,dpr,0,0); g.clearRect(0,0,w,h);
  g.fillStyle = "rgba(2,6,23,.9)"; g.fillRect(0,0,w,h);
  g.strokeStyle = "rgba(125,211,252,.18)"; g.lineWidth = 1;
  for (let i=1;i<5;i++){g.beginPath();g.moveTo(0,i*h/5);g.lineTo(w,i*h/5);g.stroke();}
  g.font = "10px ui-monospace, monospace";
  g.fillStyle = "#86a0ba"; g.fillText("altitude → period / count", 8, 14); g.fillText(String(year), w-42, 14);
  const active = CONSTELLATIONS.filter(c=>countAtYear(c,year)>0 && layerState.get(c.layer));
  const maxAlt = GEO_ALT_KM, x0=42, y0=h-22, chartW=w-54, chartH=h-44;
  g.strokeStyle = "rgba(220,236,255,.35)"; g.beginPath(); g.moveTo(x0,y0); g.lineTo(w-8,y0); g.stroke();
  active.forEach((c, idx)=>{
    const shell = c.shells[0];
    const x = x0 + Math.sqrt(shell.altitudeKm / maxAlt) * chartW;
    const period = orbitalPeriodMinutes(shell.altitudeKm);
    const count = countAtYear(c, year);
    const bar = Math.min(chartH, Math.log10(count + 1) / Math.log10(7000) * chartH);
    g.strokeStyle = c.color; g.fillStyle = c.color;
    g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y0 - bar); g.stroke();
    g.beginPath(); g.arc(x, y0 - bar, 3, 0, Math.PI*2); g.fill();
    if (idx % 2 === 0) g.fillText(c.short, Math.max(2, x-10), Math.max(26, y0-bar-6));
    if (idx === active.length-1) { g.fillStyle = "#86a0ba"; g.fillText(`${fmtPeriod(period)}`, Math.max(4, x-35), y0+13); }
  });
}

function drawMiniMap() {
  const cv = $("minimap"); if (!cv) return;
  const dpr = Math.min(devicePixelRatio || 1, 2), w = cv.clientWidth || 220, h = cv.clientHeight || 150;
  if (cv.width !== Math.round(w*dpr) || cv.height !== Math.round(h*dpr)) { cv.width = Math.round(w*dpr); cv.height = Math.round(h*dpr); }
  const g = cv.getContext("2d"); g.setTransform(dpr,0,0,dpr,0,0); g.clearRect(0,0,w,h);
  g.fillStyle = "rgba(2,6,23,.92)"; g.fillRect(0,0,w,h);
  const cx=w/2, cy=h/2, s=Math.min(w,h)*0.45/(GEO_RADIUS_VIS*1.05);
  const circle=(r,stroke)=>{g.strokeStyle=stroke;g.beginPath();g.arc(cx,cy,r*s,0,Math.PI*2);g.stroke();};
  circle(EARTH_VIS_RADIUS,"rgba(125,211,252,.7)"); circle(visualRadius(2000),"rgba(94,234,212,.28)"); circle(visualRadius(20200),"rgba(251,191,36,.22)"); circle(GEO_RADIUS_VIS,"rgba(147,197,253,.38)");
  for (const sat of SATELLITES) {
    if (!sat.mesh.visible || !isVisible(sat.mesh)) continue;
    g.fillStyle = sat.c.color;
    g.fillRect(cx + sat.mesh.position.x*s - 1, cy + sat.mesh.position.z*s - 1, 2, 2);
  }
}

function updateLabels() {
  if (!labelsOn) return;
  const w = innerWidth, h = innerHeight;
  const tmp = new THREE.Vector3();
  for (const c of CONSTELLATIONS) {
    const el = labelEls.get(c.id); if (!el) continue;
    const sat = SATELLITES.find(s => s.c === c && s.mesh.visible && isVisible(s.mesh));
    if (!sat) { el.style.display = "none"; continue; }
    sat.mesh.getWorldPosition(tmp);
    const dist = camera.position.distanceTo(tmp);
    tmp.project(camera);
    const on = tmp.z < 1 && Math.abs(tmp.x) < 1.08 && Math.abs(tmp.y) < 1.08 && dist < 125;
    el.style.display = on ? "" : "none";
    if (on) { el.style.left = `${((tmp.x + 1) / 2) * w}px`; el.style.top = `${((1 - tmp.y) / 2) * h - 16}px`; el.style.opacity = String(Math.max(.28, 1 - dist / 130)); }
  }
}

function makeDraggable(pip) {
  const head = pip.querySelector(".pip-head"); if (!head) return;
  head.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button")) return;
    const r = pip.getBoundingClientRect();
    const dx = e.clientX - r.left, dy = e.clientY - r.top;
    pip.style.right = "auto"; pip.style.bottom = "auto";
    head.setPointerCapture(e.pointerId);
    const move = (ev) => { pip.style.left = `${Math.min(Math.max(0, ev.clientX - dx), innerWidth - 60)}px`; pip.style.top = `${Math.min(Math.max(0, ev.clientY - dy), innerHeight - 30)}px`; };
    const up = () => { head.removeEventListener("pointermove", move); head.removeEventListener("pointerup", up); head.removeEventListener("pointercancel", up); };
    head.addEventListener("pointermove", move); head.addEventListener("pointerup", up); head.addEventListener("pointercancel", up);
  });
  const min = pip.querySelector("[data-min]");
  if (min) min.addEventListener("click", () => { pip.classList.toggle("min"); min.textContent = pip.classList.contains("min") ? "+" : "–"; });
}

document.querySelectorAll(".pip").forEach(makeDraggable);
buildLayerPanel(); buildTimeline();

function flyTo(name) {
  const v = VIEW_PRESETS[name]; if (!v) return;
  camera.position.set(...v.pos); controls.target.set(...v.target); controls.update(); setStatus(`view · ${name}`);
}
$("viewSelect")?.addEventListener("change", e => flyTo(e.target.value));
$("btnReset")?.addEventListener("click", () => flyTo("overview"));
$("btnAnimate")?.addEventListener("click", () => { orbiting = !orbiting; $("btnAnimate").setAttribute("aria-pressed", String(orbiting)); });
$("btnTrails")?.addEventListener("click", () => { showShells = !showShells; $("btnTrails").setAttribute("aria-pressed", String(showShells)); updateVisibilityAndPositions(); });
$("btnLabels")?.addEventListener("click", () => { labelsOn = !labelsOn; $("btnLabels").setAttribute("aria-pressed", String(labelsOn)); labelHost.style.display = labelsOn ? "" : "none"; });
$("speedSlider")?.addEventListener("input", () => { orbitSpeed = Number($("speedSlider").value); $("speedVal").textContent = `${orbitSpeed}×`; });
$("yearSlider")?.addEventListener("input", () => setYear(Number($("yearSlider").value)));
$("yearBack")?.addEventListener("click", () => setYear(year - 1));
$("yearForward")?.addEventListener("click", () => setYear(year + 1));
$("btnTimelinePlay")?.addEventListener("click", () => { timelinePlaying = !timelinePlaying; $("btnTimelinePlay").setAttribute("aria-pressed", String(timelinePlaying)); });

function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  drawChart(); drawMiniMap();
}
addEventListener("resize", resize); resize(); setYear(year);

const v3 = new THREE.Vector3();
let last = performance.now(), frames = 0, fpsAcc = 0, timelineAcc = 0;
function tick(now) {
  requestAnimationFrame(tick);
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  frames++; fpsAcc += dt; timelineAcc += dt;
  if (fpsAcc > .5) { if ($("hudFps")) $("hudFps").textContent = String(Math.round(frames / fpsAcc)); frames = 0; fpsAcc = 0; }
  if (timelinePlaying && timelineAcc > .35) { timelineAcc = 0; setYear(year >= 2032 ? 1957 : year + 1); }
  if (orbiting) { simMinutes += dt * Math.max(0, orbitSpeed) * 28; earth.rotation.y += dt * 0.025; }
  updateVisibilityAndPositions(); controls.update(); updateLabels();
  if ($("hudCam")) $("hudCam").textContent = `${camera.position.x.toFixed(1)}, ${camera.position.y.toFixed(1)}, ${camera.position.z.toFixed(1)}`;
  renderer.render(scene, camera);
  drawMiniMap();
}

setStatus("ready · circularized public constellation summaries, not live tracking");
requestAnimationFrame(tick);
