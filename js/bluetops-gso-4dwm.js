import * as THREE from "../vendor/three.module.min.js";
import { OrbitControls } from "../vendor/OrbitControls.js";

/* =========================================================================
   BlueTops GSO · 4DWM — winning GSA contracting-office awards on a
   spinning wire-mesh globe.
   Data: FPDS-NG ATOM feed snapshot (contracts), USGS 3DEP (elevations),
   Federal Register API v1 (official register). See data/bluetops/*.json.
   ========================================================================= */

const $ = (id) => document.getElementById(id);

const GLOBE_R = 100;
// vertical exaggeration: real scale would be invisible; 400× on a 6371 km globe
const UNIT_PER_M = (GLOBE_R / 6371000) * 400;

const COLORS = {
  pip: 0x35e0d6,
  pipLive: 0xffffff,
  pop: 0xffc14d,
  arcActive: new THREE.Color(0xa4e869),
  arcIdle: new THREE.Color(0x1e515f),
  column: 0xb48cff,
  curtain: new THREE.Color(0xff7a9e),
};

let renderer, scene, camera, controls, globeGroup, clock;
let spin = true;
let mapMode = false;
let savedCamPos = null;

let AWARDS = [];
let DEM = { points: {}, profiles: {} };
let pipsById = new Map(); // awardId -> sprite
let arcsByAward = new Map(); // awardId -> {line, pts, lift}
let pulsesByAward = new Map();
let pipSprites = [];
let selectedId = null;
let timelineT = 2026.78;
let playing = false;
let liveProfiles = {};
let raycaster = new THREE.Raycaster();
let pointer = new THREE.Vector2();
let downPos = null;
let hovered = null;

/* ---------------- geo helpers ---------------- */

function latLonToVec3(lat, lon, r = GLOBE_R) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

function haversineKm(aLat, aLon, bLat, bLon) {
  const R = 6371, toR = Math.PI / 180;
  const dLat = (bLat - aLat) * toR, dLon = (bLon - aLon) * toR;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aLat * toR) * Math.cos(bLat * toR) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function slerpUnit(a, b, t) {
  const angle = Math.acos(THREE.MathUtils.clamp(a.dot(b), -1, 1));
  if (angle < 1e-6) return a.clone();
  const s = Math.sin(angle);
  return a
    .clone()
    .multiplyScalar(Math.sin((1 - t) * angle) / s)
    .add(b.clone().multiplyScalar(Math.sin(t * angle) / s))
    .normalize();
}

function arcPoints(aLat, aLon, bLat, bLon, segments = 64) {
  const a = latLonToVec3(aLat, aLon, 1);
  const b = latLonToVec3(bLat, bLon, 1);
  const angle = Math.acos(THREE.MathUtils.clamp(a.dot(b), -1, 1));
  const lift = THREE.MathUtils.clamp(4 + angle * 22, 4, 30);
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const dir = slerpUnit(a, b, t);
    const r = GLOBE_R + 0.6 + Math.sin(Math.PI * t) * lift;
    pts.push(dir.multiplyScalar(r));
  }
  return { pts, lift, angle };
}

function hypsometric(m) {
  if (m == null) return new THREE.Color(0x444444);
  if (m < 25) return new THREE.Color(0x1f7a5c);
  if (m < 100) return new THREE.Color(0x3f9d63);
  if (m < 250) return new THREE.Color(0x8fb35a);
  if (m < 600) return new THREE.Color(0xc9b458);
  if (m < 1500) return new THREE.Color(0xd07f3a);
  return new THREE.Color(0xb48cff);
}

const fmtUSD = new Intl.NumberFormat("en-US", {
  style: "currency", currency: "USD", maximumFractionDigits: 0,
});
function yearToDate(y) {
  const yr = Math.floor(y);
  const day = Math.round((y - yr) * 365.25);
  const d = new Date(Date.UTC(yr, 0, 1));
  d.setUTCDate(d.getUTCDate() + day);
  return d;
}
const fmtDate = (y) =>
  yearToDate(y).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric", timeZone: "UTC",
  });
const dateToYear = (iso) => {
  const d = new Date(iso + "T00:00:00Z");
  return d.getUTCFullYear() + (d.getUTCMonth() + (d.getUTCDate() - 1) / 31) / 12;
};

/* ---------------- scene ---------------- */

function makeGlowTexture(inner = "rgba(255,255,255,1)") {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(32, 32, 2, 32, 32, 30);
  grad.addColorStop(0, inner);
  grad.addColorStop(0.35, "rgba(255,255,255,0.85)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

function initScene() {
  renderer = new THREE.WebGLRenderer({ canvas: $("stage"), antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x04070a, 1);

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x04070a, 0.0011);

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
  camera.position.set(0, 90, 250);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 130;
  controls.maxDistance = 600;
  controls.addEventListener("start", () => (spin = false, syncSpinBtn()));
  controls.addEventListener("end", () => {});

  clock = new THREE.Clock();
  globeGroup = new THREE.Group();
  scene.add(globeGroup);

  // dark inner sphere so the wireframe reads as a mesh shell
  const inner = new THREE.Mesh(
    new THREE.SphereGeometry(GLOBE_R - 0.8, 48, 32),
    new THREE.MeshBasicMaterial({ color: 0x050c10, transparent: true, opacity: 0.94 })
  );
  globeGroup.add(inner);

  // the wire mesh globe
  const wire = new THREE.Mesh(
    new THREE.SphereGeometry(GLOBE_R, 36, 24),
    new THREE.MeshBasicMaterial({ color: 0x0f4c5c, wireframe: true, transparent: true, opacity: 0.5 })
  );
  globeGroup.add(wire);

  // atmosphere halo
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(GLOBE_R + 6, 48, 32),
    new THREE.MeshBasicMaterial({ color: 0x123c49, transparent: true, opacity: 0.07, side: THREE.BackSide })
  );
  globeGroup.add(halo);

  // equator + prime meridian accents
  const ring = (rot) => {
    const pts = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * (GLOBE_R + 0.2), 0, Math.sin(a) * (GLOBE_R + 0.2)));
    }
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0x2a7f8f, transparent: true, opacity: 0.7 }));
    if (rot) l.rotation.z = Math.PI / 2;
    return l;
  };
  globeGroup.add(ring(false), ring(true));

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

async function loadCoastlines() {
  try {
    const geo =
      (window.__BLUETOPS_DATA__ && window.__BLUETOPS_DATA__.coastlines) ||
      (await (await fetch("./vendor/world/countries.geo.json")).json());
    const pos = [];
    const pushRing = (ringPts) => {
      for (let i = 0; i < ringPts.length - 1; i++) {
        const a = latLonToVec3(ringPts[i][1], ringPts[i][0], GLOBE_R + 0.4);
        const b = latLonToVec3(ringPts[i + 1][1], ringPts[i + 1][0], GLOBE_R + 0.4);
        pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
      }
    };
    for (const f of geo.features) {
      const g = f.geometry;
      if (!g) continue;
      if (g.type === "Polygon") g.coordinates.forEach(pushRing);
      else if (g.type === "MultiPolygon") g.coordinates.forEach((p) => p.forEach(pushRing));
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    const lines = new THREE.LineSegments(
      geom,
      new THREE.LineBasicMaterial({ color: 0x1d5c6b, transparent: true, opacity: 0.85 })
    );
    globeGroup.add(lines);
    setStatus("coastlines rendered");
  } catch (e) {
    setStatus("coastline layer unavailable");
  }
}

/* ---------------- data ---------------- */

async function loadData() {
  let awards, dem, register;
  const embedded = window.__BLUETOPS_DATA__; // webxdc builds bake data in
  if (embedded) {
    awards = embedded.awards;
    dem = embedded.dem;
    register = embedded.register;
  } else {
    [awards, dem, register] = await Promise.all([
      fetch("./data/bluetops/awards.json").then((r) => r.json()),
      fetch("./data/bluetops/dem.json").then((r) => r.json()),
      fetch("./data/bluetops/register.json").then((r) => r.json()).catch(() => null),
    ]);
  }
  AWARDS = awards.awards;
  DEM = dem;
  renderRegister(register ? register.results : [], "snapshot 2026-09-11");
  $("statDem").textContent =
    `USGS DEM samples: ${Object.values(dem.points).filter((p) => p.elev != null).length}`;
}

/* ---------------- build globe layers ---------------- */

function buildLayers() {
  const glowTex = makeGlowTexture();

  // aggregate per origin point
  const byOrigin = new Map();
  for (const a of AWARDS) {
    const key = a.origin.pid;
    if (!byOrigin.has(key)) byOrigin.set(key, { total: 0, awards: [] });
    const e = byOrigin.get(key);
    e.total += a.totalObligated;
    e.awards.push(a);
  }

  // vendor pips
  for (const [pid, agg] of byOrigin) {
    const pt = DEM.points[pid];
    if (!pt) continue;
    const p = latLonToVec3(pt.lat, pt.lon, GLOBE_R + 0.9);
    const size = THREE.MathUtils.clamp(2.6 + Math.log10(Math.max(agg.total, 1)) * 0.75, 3, 9);
    const mat = new THREE.SpriteMaterial({
      map: glowTex, color: COLORS.pip, transparent: true, opacity: 0.95,
      depthWrite: false,
    });
    const s = new THREE.Sprite(mat);
    s.position.copy(p);
    s.scale.set(size, size, 1);
    s.userData = { kind: "origin", pid, awards: agg.awards, baseScale: size };
    globeGroup.add(s);
    pipSprites.push(s);

    // USGS DEM elevation column
    if (pt.elev != null && pt.elev > 0) {
      const h = Math.max(pt.elev * UNIT_PER_M, 0.8);
      const col = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.5, h, 6),
        new THREE.MeshBasicMaterial({
          color: hypsometric(pt.elev), transparent: true, opacity: 0.85,
        })
      );
      const normal = p.clone().normalize();
      col.position.copy(normal.clone().multiplyScalar(GLOBE_R + h / 2));
      col.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
      globeGroup.add(col);
    }
  }

  // POP markers
  const popSeen = new Set();
  for (const a of AWARDS) {
    const pid = a.pop.pid;
    if (popSeen.has(pid)) continue;
    popSeen.add(pid);
    const pt = DEM.points[pid];
    if (!pt) continue;
    const p = latLonToVec3(pt.lat, pt.lon, GLOBE_R + 0.7);
    const mat = new THREE.SpriteMaterial({
      map: glowTex, color: COLORS.pop, transparent: true, opacity: 0.9, depthWrite: false,
    });
    const s = new THREE.Sprite(mat);
    s.position.copy(p);
    s.scale.set(3.4, 3.4, 1);
    s.userData = { kind: "pop", pid };
    globeGroup.add(s);
    pipSprites.push(s);
  }

  // logistics arcs + pulses
  for (const a of AWARDS) {
    const o = DEM.points[a.origin.pid];
    const d = DEM.points[a.pop.pid];
    if (!o || !d) continue;
    const { pts } = arcPoints(o.lat, o.lon, d.lat, d.lon, 72);
    const positions = [];
    const colors = [];
    const cFrom = hypsometric(o.elev ?? 0).lerp(COLORS.arcActive, 0.5);
    const cTo = new THREE.Color(COLORS.pop);
    for (let i = 0; i < pts.length; i++) {
      positions.push(pts[i].x, pts[i].y, pts[i].z);
      const c = cFrom.clone().lerp(cTo, i / (pts.length - 1));
      colors.push(c.r, c.g, c.b);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    const line = new THREE.Line(
      g,
      new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.28 })
    );
    globeGroup.add(line);
    arcsByAward.set(a.id, { line, pts });

    const pulse = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: glowTex, color: 0xffe9b0, transparent: true, opacity: 0, depthWrite: false })
    );
    pulse.scale.set(1.8, 1.8, 1);
    globeGroup.add(pulse);
    pulsesByAward.set(a.id, { sprite: pulse, phase: Math.random() });
    pipsById.set(a.id, { originPid: a.origin.pid });
  }

  // DEM terrain curtains for baked USGS profiles
  for (const [key, prof] of Object.entries(DEM.profiles)) {
    buildCurtain(prof);
  }

  updateStats();
  buildJumpList();
}

function buildCurtain(prof) {
  const chain = [prof.from, ...prof.samples, prof.to];
  const pts = chain.map((pid) => DEM.points[pid]).filter(Boolean);
  if (pts.length < 2) return;
  const { pts: arcPts } = arcPoints(pts[0].lat, pts[0].lon, pts[pts.length - 1].lat, pts[pts.length - 1].lon, 96);
  const n = arcPts.length;
  const positions = [];
  const colors = [];
  const indices = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const segF = t * (pts.length - 1);
    const si = Math.min(Math.floor(segF), pts.length - 2);
    const local = segF - si;
    const elev = THREE.MathUtils.lerp(pts[si].elev ?? 0, pts[si + 1].elev ?? 0, local);
    const top = arcPts[i];
    const normal = top.clone().normalize();
    const bottom = top.clone().sub(normal.clone().multiplyScalar(Math.max(elev * UNIT_PER_M, 0.5) + 0.4));
    positions.push(top.x, top.y, top.z, bottom.x, bottom.y, bottom.z);
    const cTop = COLORS.curtain.clone();
    const cBot = hypsometric(elev);
    colors.push(cTop.r, cTop.g, cTop.b, cBot.r, cBot.g, cBot.b);
    if (i < n - 1) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  g.setIndex(indices);
  const mesh = new THREE.Mesh(
    g,
    new THREE.MeshBasicMaterial({
      vertexColors: true, transparent: true, opacity: 0.5,
      side: THREE.DoubleSide, depthWrite: false,
    })
  );
  globeGroup.add(mesh);
}

/* ---------------- timeline (4th dimension) ---------------- */

function awardActiveAt(a, t) {
  const signed = dateToYear(a.signed);
  const last = dateToYear(a.lastActivity);
  return signed <= t && last >= t - 0.35;
}
function awardVisibleAt(a, t) {
  return dateToYear(a.signed) <= t;
}

function applyTimeline() {
  for (const a of AWARDS) {
    const vis = awardVisibleAt(a, timelineT);
    const hot = awardActiveAt(a, timelineT) || a.id === selectedId;
    const arc = arcsByAward.get(a.id);
    if (arc) {
      arc.line.material.opacity = !vis ? 0.05 : hot ? 0.95 : 0.3;
    }
    const pulse = pulsesByAward.get(a.id);
    if (pulse) pulse.visible = vis && hot;
  }
  // dim/restore origin sprites by whether any of their awards are visible
  for (const s of pipSprites) {
    if (s.userData.kind !== "origin") continue;
    const anyVis = s.userData.awards.some((a) => awardVisibleAt(a, timelineT));
    s.material.opacity = anyVis ? 0.95 : 0.12;
  }
  $("timeReadout").textContent = fmtDate(timelineT);
}

/* ---------------- UI: stats / jump list / pip card / register ---------------- */

function updateStats() {
  $("statContracts").textContent = `contracts: ${AWARDS.length}`;
  const total = AWARDS.reduce((s, a) => s + a.totalObligated, 0);
  $("statObligated").textContent = `obligated: ${fmtUSD.format(total)}`;
}

function buildJumpList() {
  const list = $("jumpList");
  list.innerHTML = "";
  const sorted = [...AWARDS].sort((a, b) => b.totalObligated - a.totalObligated);
  for (const a of sorted) {
    const row = document.createElement("button");
    row.className = "jump-row";
    row.dataset.id = a.id;
    const dot = document.createElement("span");
    dot.className = "dot";
    dot.style.background = "#" + hypsometric(DEM.points[a.origin.pid]?.elev ?? 0).getHexString();
    const name = document.createElement("span");
    name.textContent = `${a.vendor}`;
    name.style.overflow = "hidden";
    name.style.textOverflow = "ellipsis";
    name.style.whiteSpace = "nowrap";
    const amt = document.createElement("span");
    amt.className = "amt";
    amt.textContent = fmtUSD.format(a.totalObligated);
    row.append(dot, name, amt);
    row.addEventListener("click", () => selectAward(a.id, true));
    list.appendChild(row);
  }
}

function focusGlobeOn(pid) {
  const pt = DEM.points[pid];
  if (!pt) return;
  globeGroup.rotation.y = 0; // focus uses unrotated coordinates
  spin = false;
  syncSpinBtn();
  const target = latLonToVec3(pt.lat, pt.lon, GLOBE_R);
  const dir = target.clone().normalize();
  const dist = THREE.MathUtils.clamp(camera.position.length(), 180, 280);
  camera.position.copy(dir.multiplyScalar(dist));
  controls.target.set(0, 0, 0);
}

function selectAward(id, focus = false) {
  selectedId = id;
  document.querySelectorAll(".jump-row").forEach((r) =>
    r.classList.toggle("sel", r.dataset.id === id)
  );
  const a = AWARDS.find((x) => x.id === id);
  if (!a) return;
  renderPip(a);
  if (focus) focusGlobeOn(a.origin.pid);
  applyTimeline();
}

function renderPip(a) {
  const o = DEM.points[a.origin.pid];
  const d = DEM.points[a.pop.pid];
  const body = $("pipBody");
  const actions = (a.actions || [])
    .map((m) => {
      const cls = m.amount < 0 ? "neg" : "";
      const sign = m.amount < 0 ? "−" : "+";
      return `<li class="${cls}">
        <span>${m.date} · ${m.mod} · ${m.note || ""}</span>
        <span class="amt ${m.amount < 0 ? "neg" : "pos"}">${sign}${fmtUSD.format(Math.abs(m.amount))}</span>
      </li>`;
    })
    .join("");
  body.innerHTML = `
    <h3 class="pip-title">${a.vendor}</h3>
    <dl class="kv">
      <dt>instrument</dt><dd>${a.type} ${a.piid}</dd>
      <dt>office</dt><dd>${a.office} · funding ${a.fundingDept} — ${a.fundingName}</dd>
      <dt>requirement</dt><dd>${a.desc}</dd>
      <dt>PSC / NAICS</dt><dd>${a.psc} / ${a.naics}${a.setAside ? ` · ${a.setAside}` : ""}</dd>
      <dt>signed</dt><dd>${a.signed}</dd>
      <dt>last action</dt><dd>${a.lastActivity}</dd>
      <dt>obligated</dt><dd>${fmtUSD.format(a.totalObligated)}</dd>
      <dt>potential</dt><dd>${fmtUSD.format(a.potentialTotal)}</dd>
      <dt>origin</dt><dd>${a.origin.street}, ${a.origin.city} ${a.origin.state} ${a.origin.zip}${o && o.elev != null ? ` · <span style="color:#b48cff">USGS ${o.elev.toFixed(1)} m</span>` : ""}</dd>
      <dt>destination</dt><dd>${d ? d.label : a.pop.state} ${a.pop.zip}${d && d.elev != null ? ` · <span style="color:#b48cff">USGS ${d.elev.toFixed(1)} m</span>` : ""}</dd>
    </dl>
    ${actions ? `<ul class="actions-list">${actions}</ul>` : ""}
    <canvas id="profileCanvas" width="560" height="260"></canvas>
    <p class="tiny" id="profileNote"></p>
    <button type="button" id="btnSample" style="margin-top:6px">SAMPLE LIVE USGS 3DEP</button>
  `;
  $("btnSample").addEventListener("click", () => sampleRouteLive(a));
  drawProfileFor(a);
}

function profileSeriesFor(a) {
  const o = DEM.points[a.origin.pid];
  const d = DEM.points[a.pop.pid];
  // baked USGS profile?
  for (const prof of Object.values(DEM.profiles)) {
    if (prof.award === a.id) {
      const chain = [prof.from, ...prof.samples, prof.to];
      return {
        pts: chain.map((pid) => DEM.points[pid]),
        source: "USGS 3DEP sampled along route (2026-09-11 snapshot)",
      };
    }
  }
  if (liveProfiles[a.id]) return liveProfiles[a.id];
  if (!o || !d) return null;
  return {
    pts: [o, d],
    source: "endpoint interpolation — click SAMPLE LIVE USGS 3DEP for a true route profile",
    interpolated: true,
  };
}

function drawProfileFor(a) {
  const cv = $("profileCanvas");
  if (!cv) return;
  const series = profileSeriesFor(a);
  const note = $("profileNote");
  const g = cv.getContext("2d");
  g.clearRect(0, 0, cv.width, cv.height);
  if (!series || series.pts.length < 2) {
    note.textContent = "No DEM route available.";
    return;
  }
  note.textContent = series.source;

  // cumulative distance
  let dist = [0];
  for (let i = 1; i < series.pts.length; i++) {
    const p0 = series.pts[i - 1], p1 = series.pts[i];
    dist.push(dist[i - 1] + haversineKm(p0.lat, p0.lon, p1.lat, p1.lon));
  }
  const total = dist[dist.length - 1] || 1;
  const elevs = series.pts.map((p) => p.elev ?? 0);
  const maxE = Math.max(...elevs, 1);

  const padL = 46, padR = 10, padT = 14, padB = 24;
  const W = cv.width - padL - padR, H = cv.height - padT - padB;
  const X = (i) => padL + (dist[i] / total) * W;
  const Y = (e) => padT + H - (e / maxE) * H;

  // grid
  g.strokeStyle = "#123743";
  g.fillStyle = "#7fa3ab";
  g.font = "10px monospace";
  g.lineWidth = 1;
  for (let i = 0; i <= 3; i++) {
    const e = (maxE / 3) * i;
    const y = Y(e);
    g.beginPath(); g.moveTo(padL, y); g.lineTo(padL + W, y); g.stroke();
    g.fillText(`${e.toFixed(0)} m`, 4, y + 3);
  }

  // terrain fill
  const grad = g.createLinearGradient(0, padT, 0, padT + H);
  grad.addColorStop(0, "rgba(180,140,255,0.55)");
  grad.addColorStop(1, "rgba(20,60,80,0.25)");
  g.beginPath();
  g.moveTo(X(0), Y(elevs[0]));
  for (let i = 1; i < elevs.length; i++) g.lineTo(X(i), Y(elevs[i]));
  g.lineTo(X(elevs.length - 1), padT + H);
  g.lineTo(X(0), padT + H);
  g.closePath();
  g.fillStyle = grad;
  g.fill();
  g.beginPath();
  g.moveTo(X(0), Y(elevs[0]));
  for (let i = 1; i < elevs.length; i++) g.lineTo(X(i), Y(elevs[i]));
  g.strokeStyle = series.interpolated ? "#3d8ea0" : "#b48cff";
  g.lineWidth = 2;
  g.stroke();

  // endpoints
  g.fillStyle = "#35e0d6";
  g.fillRect(X(0) - 2, Y(elevs[0]) - 2, 4, 4);
  g.fillStyle = "#ffc14d";
  g.fillRect(X(elevs.length - 1) - 2, Y(elevs[elevs.length - 1]) - 2, 4, 4);

  g.fillStyle = "#7fa3ab";
  g.fillText("vendor hub", padL, cv.height - 8);
  const dest = "place of performance";
  g.fillText(dest, padL + W - g.measureText(dest).width, cv.height - 8);
  g.fillText(`${total.toFixed(0)} km`, padL + W / 2 - 20, cv.height - 8);
}

async function sampleRouteLive(a) {
  const note = $("profileNote");
  const o = DEM.points[a.origin.pid];
  const d = DEM.points[a.pop.pid];
  if (!o || !d) return;
  note.textContent = "Sampling USGS 3DEP ImageServer along the route…";
  try {
    const ua = latLonToVec3(o.lat, o.lon, 1);
    const ub = latLonToVec3(d.lat, d.lon, 1);
    const pts = [{ ...o }];
    for (let i = 1; i <= 4; i++) {
      const t = i / 5;
      const v = slerpUnit(ua, ub, t);
      const c = new THREE.Vector3(0, 1, 0);
      const lat = 90 - (Math.acos(THREE.MathUtils.clamp(v.y, -1, 1)) * 180) / Math.PI;
      let lon = ((Math.atan2(v.z, -v.x) * 180) / Math.PI) - 180;
      lon = ((lon + 540) % 360) - 180;
      const geom = encodeURIComponent(
        JSON.stringify({ x: lon, y: lat, spatialReference: { wkid: 4326 } })
      );
      const url =
        "https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/identify" +
        `?geometry=${geom}&geometryType=esriGeometryPoint&returnGeometry=false&returnCatalogItems=false&f=json`;
      const res = await fetch(url);
      const j = await res.json();
      const elev = j.value === "NoData" ? null : parseFloat(j.value);
      pts.push({ lat, lon, elev });
    }
    pts.push({ ...d });
    liveProfiles[a.id] = { pts, source: `USGS 3DEP live identify ×${pts.length} (fetched ${new Date().toISOString().slice(0, 10)})` };
    drawProfileFor(a);
  } catch (e) {
    note.textContent = "Live 3DEP sampling blocked (CORS/network) — showing snapshot/interpolated profile.";
  }
}

function renderRegister(results, tag) {
  const box = $("regList");
  $("regHead").textContent = `Official register · Federal Register (${tag})`;
  if (!results || !results.length) {
    box.innerHTML = '<p class="small">No documents.</p>';
    return;
  }
  box.innerHTML = results
    .map(
      (r) => `
    <div class="reg-item">
      <a href="${r.html_url}" target="_blank" rel="noopener">${r.title}</a>
      <div class="reg-meta">
        <span class="reg-type">${r.type.toUpperCase()}</span> ·
        ${r.publication_date} · ${r.citation || r.document_number}
      </div>
    </div>`
    )
    .join("");
}

/* ---------------- live refresh paths ---------------- */

const FR_URL =
  "https://www.federalregister.gov/api/v1/documents.json?" +
  "conditions%5Bterm%5D=%22General%20Services%20Administration%22" +
  "&conditions%5Bagencies%5D%5B%5D=general-services-administration" +
  "&per_page=12" +
  "&fields%5B%5D=title&fields%5B%5D=type&fields%5B%5D=publication_date" +
  "&fields%5B%5D=document_number&fields%5B%5D=html_url&fields%5B%5D=citation&order=newest";

async function refreshRegister() {
  setStatus("register: contacting federalregister.gov…");
  try {
    const res = await fetch(FR_URL);
    if (!res.ok) throw new Error(res.status);
    const j = await res.json();
    renderRegister(j.results, `live ${new Date().toISOString().slice(0, 10)}`);
    setStatus("register: live refresh OK");
  } catch (e) {
    setStatus("register: live fetch failed — snapshot in use");
  }
}

const STATE_CENTROIDS = {
  AL: [32.7, -86.8], AK: [64.2, -149.5], AZ: [34.2, -111.6], AR: [34.8, -92.2],
  CA: [37.2, -119.3], CO: [39.0, -105.5], CT: [41.6, -72.7], DE: [38.9, -75.5],
  DC: [38.9, -77.03], FL: [28.6, -82.4], GA: [32.6, -83.4], HI: [20.3, -156.4],
  ID: [44.4, -114.6], IL: [40.0, -89.2], IN: [39.9, -86.3], IA: [42.1, -93.5],
  KS: [38.5, -98.4], KY: [37.5, -85.3], LA: [31.0, -92.0], ME: [45.4, -69.2],
  MD: [39.05, -76.8], MA: [42.3, -71.8], MI: [44.3, -85.4], MN: [46.3, -94.3],
  MS: [32.7, -89.7], MO: [38.4, -92.5], MT: [47.0, -109.6], NE: [41.5, -99.8],
  NV: [39.3, -116.6], NH: [43.7, -71.6], NJ: [40.2, -74.7], NM: [34.4, -106.1],
  NY: [42.9, -75.5], NC: [35.5, -79.4], ND: [47.4, -100.5], OH: [40.3, -82.8],
  OK: [35.6, -97.4], OR: [43.9, -120.5], PA: [40.9, -77.8], RI: [41.7, -71.5],
  SC: [33.9, -80.9], SD: [44.4, -100.2], TN: [35.8, -86.4], TX: [31.5, -99.4],
  UT: [39.3, -111.7], VT: [44.1, -72.6], VA: [37.5, -78.8], WA: [47.4, -120.5],
  WV: [38.6, -80.6], WI: [44.6, -89.7], WY: [43.0, -107.5],
};

async function refreshLiveAwards() {
  setStatus("live: POST api.usaspending.gov (GSA awarding agency, contracts)…");
  try {
    const today = new Date();
    const back = new Date(today.getTime() - 90 * 86400000);
    const iso = (d) => d.toISOString().slice(0, 10);
    const body = {
      fields: [
        "Award ID", "Recipient Name", "Recipient Location", "Award Amount",
        "Action Date", "Description", "Award Type", "Awarding Agency Name",
        "Awarding Subtier Name", "NAICS Code", "PSC Code",
      ],
      filters: {
        agencies: [{ type: "awarding", name: "General Services Administration" }],
        award_type_codes: ["A", "B", "C", "D"],
        time_period: [{ start_date: iso(back), end_date: iso(today) }],
      },
      page: 1,
      limit: 100,
      sort: "Award Amount",
      order: "desc",
    };
    const res = await fetch("https://api.usaspending.gov/api/v2/search/spending_by_award/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const j = await res.json();
    const rows = j.results || [];
    addLiveAwards(rows);
    setStatus(`live: +${rows.length} awards merged from USAspending.gov`);
  } catch (e) {
    setStatus("live: USAspending blocked in this browser (CORS/network) — FPDS snapshot in use");
  }
}

function addLiveAwards(rows) {
  const glowTex = makeGlowTexture();
  const hub = DEM.points["dc_pop"];
  let added = 0;
  for (const r of rows) {
    const loc = r["Recipient Location"] || {};
    const st = loc.state_code;
    const c = STATE_CENTROIDS[st];
    if (!c || !r["Award Amount"]) continue;
    const pid = "live_" + st;
    if (!DEM.points[pid]) {
      DEM.points[pid] = { lat: c[0], lon: c[1], elev: null, label: `${st} (live, state centroid)` };
    }
    const id = "live-" + (r["Award ID"] || Math.random());
    const a = {
      id, piid: r["Award ID"] || "—", type: (r["Award Type"] || "CONTRACT").toUpperCase(),
      vendor: r["Recipient Name"] || "Unknown", uei: null,
      office: r["Awarding Subtier Name"] || "GSA", fundingDept: "live",
      fundingName: r["Awarding Agency Name"] || "GSA",
      desc: r["Description"] || "—", psc: r["PSC Code"] || "—", naics: r["NAICS Code"] || "—",
      signed: r["Action Date"] || new Date().toISOString().slice(0, 10),
      lastActivity: r["Action Date"] || new Date().toISOString().slice(0, 10),
      totalObligated: r["Award Amount"], potentialTotal: r["Award Amount"],
      actions: [], live: true,
      origin: { pid, street: "—", city: loc.city_name || st, state: st, zip: loc.zip5 || "—" },
      pop: { pid: "dc_pop", state: "DC", zip: "20405" },
    };
    AWARDS.push(a);
    // pip
    const p = latLonToVec3(c[0], c[1], GLOBE_R + 0.9);
    const size = THREE.MathUtils.clamp(2.6 + Math.log10(Math.max(a.totalObligated, 1)) * 0.75, 3, 9);
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: glowTex, color: COLORS.pipLive, transparent: true, opacity: 0.95, depthWrite: false })
    );
    s.position.copy(p);
    s.scale.set(size, size, 1);
    s.userData = { kind: "origin", pid, awards: [a], baseScale: size };
    globeGroup.add(s);
    pipSprites.push(s);
    // arc
    const { pts } = arcPoints(c[0], c[1], hub.lat, hub.lon, 72);
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    const line = new THREE.Line(
      g, new THREE.LineBasicMaterial({ color: 0x9ff5ee, transparent: true, opacity: 0.35 })
    );
    globeGroup.add(line);
    arcsByAward.set(id, { line, pts });
    added++;
  }
  updateStats();
  buildJumpList();
  applyTimeline();
}

/* ---------------- interaction ---------------- */

function onPointerMove(e) {
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(pipSprites, false);
  const tip = $("tooltip");
  if (hits.length) {
    const s = hits[0].object;
    hovered = s;
    document.body.style.cursor = "pointer";
    const u = s.userData;
    if (u.kind === "origin") {
      const pt = DEM.points[u.pid];
      const names = u.awards.map((a) => a.vendor);
      const uniq = [...new Set(names)];
      tip.innerHTML = `<b>${uniq[0]}</b>${uniq.length > 1 ? ` +${uniq.length - 1} more` : ""}<br/>
        ${u.awards.length} contract(s) · ${fmtUSD.format(u.awards.reduce((t, a) => t + a.totalObligated, 0))}<br/>
        ${pt ? `${pt.lat.toFixed(3)}, ${pt.lon.toFixed(3)} · USGS ${pt.elev != null ? pt.elev.toFixed(1) + " m" : "no DEM"}` : ""}`;
    } else {
      const pt = DEM.points[u.pid];
      tip.innerHTML = `<b>${pt ? pt.label : "POP"}</b><br/>USGS ${pt && pt.elev != null ? pt.elev.toFixed(1) + " m" : "—"}`;
    }
    tip.style.display = "block";
    tip.style.left = Math.min(e.clientX + 14, window.innerWidth - 300) + "px";
    tip.style.top = e.clientY + 14 + "px";
  } else {
    hovered = null;
    tip.style.display = "none";
    document.body.style.cursor = "default";
  }
}

function onPointerDown(e) {
  downPos = [e.clientX, e.clientY];
}

function onPointerUp(e) {
  if (!downPos) return;
  const dx = e.clientX - downPos[0], dy = e.clientY - downPos[1];
  downPos = null;
  if (dx * dx + dy * dy > 25) return;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(pipSprites, false);
  if (!hits.length) return;
  const s = hits[0].object;
  const u = s.userData;
  if (u.kind === "origin" && u.awards.length) {
    // pick the richest award at this location
    const best = [...u.awards].sort((a, b) => b.totalObligated - a.totalObligated)[0];
    selectAward(best.id, false);
  }
}

/* ---------------- controls wiring ---------------- */

function setStatus(t) {
  $("status").innerHTML = `<b>${t}</b>`;
}
function syncSpinBtn() {
  $("btnSpin").classList.toggle("active", spin);
}

function wireUI() {
  $("btnSpin").addEventListener("click", () => { spin = !spin; syncSpinBtn(); });
  $("btnReset").addEventListener("click", () => {
    camera.position.set(0, 90, 250);
    controls.target.set(0, 0, 0);
    spin = true;
    syncSpinBtn();
  });
  $("btnView").addEventListener("click", () => {
    mapMode = !mapMode;
    $("btnView").textContent = mapMode ? "GLOBE" : "4DWM MAP";
    $("btnView").classList.toggle("active", mapMode);
    if (mapMode) {
      savedCamPos = camera.position.clone();
      camera.position.set(0, 165, 205);
      controls.target.set(0, 0, 0);
      spin = false;
      syncSpinBtn();
    } else if (savedCamPos) {
      camera.position.copy(savedCamPos);
      controls.target.set(0, 0, 0);
    }
  });
  $("btnReg").addEventListener("click", refreshRegister);
  $("btnLive").addEventListener("click", refreshLiveAwards);

  const slider = $("timeSlider");
  slider.addEventListener("input", () => {
    timelineT = parseFloat(slider.value);
    applyTimeline();
  });
  $("btnPlay").addEventListener("click", () => {
    playing = !playing;
    $("btnPlay").textContent = playing ? "❚❚" : "▶";
    if (playing && timelineT >= 2026.7) {
      timelineT = 2019.6;
      slider.value = timelineT;
      applyTimeline();
    }
  });

  renderer.domElement.addEventListener("pointermove", onPointerMove);
  renderer.domElement.addEventListener("pointerdown", onPointerDown);
  renderer.domElement.addEventListener("pointerup", onPointerUp);
}

/* ---------------- animate ---------------- */

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();

  if (playing) {
    timelineT += dt * 0.55; // ~13s for the full history
    if (timelineT >= 2026.78) {
      timelineT = 2026.78;
      playing = false;
      $("btnPlay").textContent = "▶";
    }
    $("timeSlider").value = timelineT;
    applyTimeline();
  }

  if (spin && !mapMode) globeGroup.rotation.y += 0.0016;

  // convoy pulses along active arcs
  const now = clock.elapsedTime;
  for (const [id, rec] of pulsesByAward) {
    if (!rec.sprite.visible) { rec.sprite.material.opacity = 0; continue; }
    const arc = arcsByAward.get(id);
    if (!arc) continue;
    const t = (now * 0.14 + rec.phase) % 1;
    const idx = Math.min(Math.floor(t * (arc.pts.length - 1)), arc.pts.length - 1);
    rec.sprite.position.copy(arc.pts[idx]);
    rec.sprite.material.opacity = 0.9;
  }

  // hover pip breathe
  for (const s of pipSprites) {
    const target = s === hovered ? s.userData.baseScale * 1.5 : s.userData.baseScale;
    const cur = s.scale.x;
    const next = cur + (target - cur) * 0.2;
    s.scale.set(next, next, 1);
  }

  controls.update();
  renderer.render(scene, camera);
}

/* ---------------- boot ---------------- */

async function boot() {
  initScene();
  wireUI();
  setStatus("loading FPDS / USGS / Federal Register snapshot…");
  try {
    await loadData();
  } catch (e) {
    setStatus("data load failed — serve this page over HTTP");
    return;
  }
  buildLayers();
  await loadCoastlines();
  applyTimeline();
  animate();
  setStatus("4DWM pips online · drag to orbit · scroll to zoom");
}

boot();
