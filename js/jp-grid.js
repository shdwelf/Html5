import * as THREE from "../vendor/three.module.min.js";
import { OrbitControls } from "../vendor/OrbitControls.js";
import { resolveSite, CATALOG } from "./site-id.js";
import { loadWeather, ecosystemFromWx, wxHudMarkup, wxChipText } from "./wx-live.js";

const SITE_ID = resolveSite();

const PACKS = {
  la: ["./la-geo.js", "./sanctuaries.js", "./br-plot.js"],
  stx: ["./stx-geo.js", "./stx-nodes.js", "./stx-plot.js"],
  ww: ["./ca-geo.js", "./ca-nodes.js", "./ca-plot.js"],
  dalton: ["./ca-geo.js", "./ca-nodes.js", "./ca-plot.js"],
  iv: ["./ca-geo.js", "./ca-nodes.js", "./ca-plot.js"],
};

let BBOX,
  WORLD,
  PARISHES,
  LA_OUTLINE,
  RIVERS,
  ROADS,
  REEFS,
  BEACHES,
  CAYS,
  SITE,
  CONTOUR_LEVELS,
  project,
  unproject,
  buildDem,
  extractBorders,
  buildContours,
  drapeLine,
  sampleDem,
  sampleParish,
  hypsometric,
  parishByName;
let SANCTUARIES, money, findSanctuary, sanctuariesInParish;
let stormRadiusNorm, stormCenter, parishStatus, drainEvents, liveNodes, convoyTarget, gridCellStatus, maxStormSpan;

async function loadSite() {
  const pack = PACKS[SITE_ID] || PACKS.stx;
  const [g, n, p] = await Promise.all([import(pack[0]), import(pack[1]), import(pack[2])]);
  ({
    BBOX,
    WORLD,
    PARISHES,
    LA_OUTLINE,
    RIVERS,
    project,
    unproject,
    buildDem,
    extractBorders,
    buildContours,
    drapeLine,
    sampleDem,
    sampleParish,
    hypsometric,
    parishByName,
  } = g);
  ROADS = g.ROADS || {};
  REEFS = g.REEFS || {};
  BEACHES = g.BEACHES || [];
  CAYS = g.CAYS || [];
  SITE = g.SITE;
  CONTOUR_LEVELS = g.CONTOUR_LEVELS || [0, 5, 10, 20, 40, 70, 110, 150];
  ({ SANCTUARIES, money, findSanctuary, sanctuariesInParish } = n);
  ({
    stormRadiusNorm,
    stormCenter,
    parishStatus,
    drainEvents,
    liveNodes,
    convoyTarget,
    gridCellStatus,
    maxStormSpan,
  } = p);
  state.hoverLon = (BBOX.minLon + BBOX.maxLon) / 2;
  state.hoverLat = (BBOX.minLat + BBOX.maxLat) / 2;
}

const $ = (id) => document.getElementById(id);
const isCoarse = matchMedia("(pointer: coarse)").matches || innerWidth < 860;

const state = {
  t0: performance.now(),
  time: 0,
  paused: false,
  selectedParish: -1,
  selectedNode: null,
  lastEventT: 0,
  hoverLon: -91.1,
  hoverLat: 30.5,
};

let scene, camera, renderer, controls, raycaster, pointer;
let terrain, stormRing, stormFence, stormDisk;
let hqGroup, convoyGroup;
let dem;
let statusAttr;
const hqMeshes = [];

const VERT = `
attribute vec3 color;
attribute float parish;
varying vec3 vColor;
varying vec3 vWorld;
varying float vParish;
void main() {
  vColor = color;
  vParish = parish;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

const FRAG = `
uniform float uTime;
uniform vec3 uStorm;
uniform float uSelected;
varying vec3 vColor;
varying vec3 vWorld;
varying float vParish;
void main() {
  float gx = abs(fract(vWorld.x * 0.22) - 0.5);
  float gz = abs(fract(vWorld.z * 0.22) - 0.5);
  float grid = smoothstep(0.47, 0.5, max(gx, gz));
  float d = length(vWorld.xz - uStorm.xy);
  float inside = smoothstep(uStorm.z + 0.8, uStorm.z - 1.1, d);
  float ring = 1.0 - smoothstep(0.0, 0.55, abs(d - uStorm.z));
  vec3 col = vColor;
  col = mix(col * 0.16, col, inside);
  col += vec3(0.04, 0.16, 0.07) * grid * inside;
  col += vec3(1.0, 0.52, 0.08) * ring * 0.95;
  if (abs(vParish - uSelected) < 0.5 && vParish >= 0.0) {
    col += vec3(0.22, 0.55, 0.18) * (0.45 + 0.55 * sin(uTime * 5.0));
  }
  col += vec3(0.08, 0.22, 0.10) * (0.04 * sin(vWorld.z * 4.0 - uTime * 2.4));
  gl_FragColor = vec4(col, 1.0);
}
`;

function viewSize() {
  const vv = window.visualViewport;
  return {
    w: Math.max(1, Math.floor(vv?.width ?? innerWidth)),
    h: Math.max(1, Math.floor(vv?.height ?? innerHeight)),
  };
}

function resize() {
  const { w, h } = viewSize();
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}

function lines(arr, color, opacity = 0.85) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3));
  return new THREE.LineSegments(
    geo,
    new THREE.LineBasicMaterial({ color, transparent: true, opacity })
  );
}

function makeTerrain() {
  const nx = dem.nx;
  const ny = dem.ny;
  const pos = new Float32Array(nx * ny * 3);
  const col = new Float32Array(nx * ny * 3);
  const pid = new Float32Array(nx * ny);
  const idx = [];
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const lon = BBOX.minLon + (i / (nx - 1)) * (BBOX.maxLon - BBOX.minLon);
      const lat = BBOX.maxLat - (j / (ny - 1)) * (BBOX.maxLat - BBOX.minLat);
      const [x, z] = project(lon, lat);
      const k = j * nx + i;
      const e = dem.elev[k];
      pos[k * 3] = x;
      pos[k * 3 + 1] = e * WORLD.elevScale;
      pos[k * 3 + 2] = z;
      const rgb = hypsometric(e);
      col[k * 3] = rgb[0];
      col[k * 3 + 1] = rgb[1];
      col[k * 3 + 2] = rgb[2];
      pid[k] = dem.parish[k];
    }
  }
  for (let j = 0; j < ny - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const a = j * nx + i;
      const b = a + 1;
      const c = a + nx;
      const d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  geo.setAttribute("parish", new THREE.BufferAttribute(pid, 1));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      uTime: { value: 0 },
      uStorm: { value: new THREE.Vector3(0, 0, 20) },
      uSelected: { value: -1 },
    },
  });
  terrain = new THREE.Mesh(geo, mat);
  terrain.userData.pick = true;
  scene.add(terrain);

  const wire = new THREE.Mesh(
    geo,
    new THREE.MeshBasicMaterial({
      color: 0x1c4a28,
      wireframe: true,
      transparent: true,
      opacity: 0.11,
    })
  );
  scene.add(wire);

  const borders = extractBorders(dem);
  scene.add(lines(borders, 0x7cff6b, 0.55));

  const outline = drapeLine(dem, LA_OUTLINE);
  const ol = new THREE.BufferGeometry();
  ol.setAttribute("position", new THREE.Float32BufferAttribute(outline, 3));
  scene.add(new THREE.Line(ol, new THREE.LineBasicMaterial({ color: 0xffb020, transparent: true, opacity: 0.9 })));

  for (const [name, path] of Object.entries(RIVERS)) {
    const arr = drapeLine(dem, path);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3));
    scene.add(
      new THREE.Line(
        g,
        new THREE.LineBasicMaterial({
          color: name === "mississippi" ? 0x5ce1ff : 0x2a8a9a,
          transparent: true,
          opacity: 0.85,
        })
      )
    );
  }

  const contours = buildContours(dem, CONTOUR_LEVELS);
  contours.forEach((c, i) => {
    if (!c.segs.length) return;
    const water = c.level < 0;
    scene.add(lines(c.segs, water ? 0x1a4a58 : i % 2 ? 0x3d6a38 : 0x2a4a28, water ? 0.32 : 0.28));
  });

  for (const path of Object.values(ROADS)) {
    const arr = drapeLine(dem, path);
    const rg = new THREE.BufferGeometry();
    rg.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3));
    scene.add(new THREE.Line(rg, new THREE.LineBasicMaterial({ color: 0xffb020, transparent: true, opacity: 0.55 })));
  }
  for (const path of Object.values(REEFS)) {
    const arr = drapeLine(dem, path);
    const rg = new THREE.BufferGeometry();
    rg.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3));
    scene.add(new THREE.Line(rg, new THREE.LineBasicMaterial({ color: 0x3dffb0, transparent: true, opacity: 0.4 })));
  }
  CAYS.forEach((ring) => {
    const arr = drapeLine(dem, ring);
    const cg = new THREE.BufferGeometry();
    cg.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3));
    scene.add(new THREE.Line(cg, new THREE.LineBasicMaterial({ color: 0x7cff6b, transparent: true, opacity: 0.8 })));
  });
  BEACHES.forEach((bch) => {
    const [x, z] = project(bch.lon, bch.lat);
    const y = sampleDem(dem, bch.lon, bch.lat) * WORLD.elevScale + 0.1;
    const m = new THREE.Mesh(
      new THREE.ConeGeometry(0.09, 0.18, 6),
      new THREE.MeshBasicMaterial({ color: 0xffe08a })
    );
    m.position.set(x, y + 0.08, z);
    scene.add(m);
  });

  addSectorGrid();
}

function addSectorGrid() {
  const arr = [];
  for (let i = 0; i <= 8; i++) {
    const u = i / 8;
    const lon = BBOX.minLon + u * (BBOX.maxLon - BBOX.minLon);
    const latA = BBOX.minLat;
    const latB = BBOX.maxLat;
    const a = drapeLine(dem, [
      [lon, latA],
      [lon, (latA + latB) / 2],
      [lon, latB],
    ]);
    arr.push(...a);
    const lat = BBOX.maxLat - u * (BBOX.maxLat - BBOX.minLat);
    const b = drapeLine(dem, [
      [BBOX.minLon, lat],
      [(BBOX.minLon + BBOX.maxLon) / 2, lat],
      [BBOX.maxLon, lat],
    ]);
    arr.push(...b);
  }
  scene.add(lines(arr, 0x245028, 0.22));
}

function hash01(n) {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

function makeHeadquarters() {
  hqGroup = new THREE.Group();
  convoyGroup = new THREE.Group();
  scene.add(hqGroup, convoyGroup);
  SANCTUARIES.forEach((s, si) => {
    const g = new THREE.Group();
    const [x, z] = project(s.lon, s.lat);
    const y = Math.max(0, sampleDem(dem, s.lon, s.lat)) * WORLD.elevScale;
    const last = s.filings[s.filings.length - 1];
    const n = 3 + Math.floor(hash01(si + 2) * 4);
    for (let i = 0; i < n; i++) {
      const h = 0.22 + hash01(si * 9 + i) * 1.15 + Math.log10((last.rev || 0.5) + 1) * 0.18;
      const w = 0.1 + hash01(si * 3 + i) * 0.14;
      const d = 0.1 + hash01(si * 5 + i) * 0.14;
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshBasicMaterial({ color: s.color, transparent: true, opacity: 0.92 })
      );
      mesh.position.set((i - n / 2) * 0.2, h / 2, (hash01(si + i * 7) - 0.5) * 0.16);
      g.add(mesh);
      const edge = new THREE.LineSegments(
        new THREE.EdgesGeometry(mesh.geometry),
        new THREE.LineBasicMaterial({ color: 0xd8ffd0, transparent: true, opacity: 0.7 })
      );
      edge.position.copy(mesh.position);
      g.add(edge);
    }
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.38, 0.03, 12),
      new THREE.MeshBasicMaterial({ color: 0x122016, transparent: true, opacity: 0.8 })
    );
    pad.position.y = 0.02;
    g.add(pad);
    g.position.set(x, y, z);
    g.userData.sanctuary = s;
    hqGroup.add(g);
    hqMeshes.push(g);

    const blip = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 10, 10),
      new THREE.MeshBasicMaterial({ color: s.color })
    );
    blip.userData.sanctuary = s;
    convoyGroup.add(blip);
  });
}

function makeStorm() {
  stormRing = new THREE.Mesh(
    new THREE.RingGeometry(0.96, 1.04, 160),
    new THREE.MeshBasicMaterial({
      color: 0xffb020,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    })
  );
  stormRing.rotation.x = -Math.PI / 2;
  scene.add(stormRing);

  stormDisk = new THREE.Mesh(
    new THREE.CircleGeometry(1, 80),
    new THREE.MeshBasicMaterial({
      color: 0x143018,
      transparent: true,
      opacity: 0.07,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  stormDisk.rotation.x = -Math.PI / 2;
  scene.add(stormDisk);

  stormFence = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, 2.4, 72, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xffb020,
      wireframe: true,
      transparent: true,
      opacity: 0.22,
    })
  );
  scene.add(stormFence);
}

function stormWorld(t) {
  const c = stormCenter(t);
  const { r } = stormRadiusNorm(t);
  const [x, z] = project(c.lon, c.lat);
  const [x2] = project(c.lon + r * maxStormSpan() / Math.cos((c.lat * Math.PI) / 180), c.lat);
  const rad = Math.abs(x2 - x);
  return { x, z, rad, c };
}

function updateStorm(t) {
  const s = stormWorld(t);
  stormRing.position.set(s.x, 0.12, s.z);
  stormRing.scale.set(s.rad, s.rad, 1);
  stormDisk.position.set(s.x, 0.02, s.z);
  stormDisk.scale.set(s.rad, s.rad, 1);
  stormFence.position.set(s.x, 1.2, s.z);
  stormFence.scale.set(s.rad, 1, s.rad);
  if (terrain) {
    terrain.material.uniforms.uStorm.value.set(s.x, s.z, s.rad);
    terrain.material.uniforms.uTime.value = t;
    terrain.material.uniforms.uSelected.value = state.selectedParish;
  }
  convoyGroup.children.forEach((blip) => {
    const sct = blip.userData.sanctuary;
    const tgt = convoyTarget(sct, t);
    const [x, z] = project(tgt.lon, tgt.lat);
    const y = Math.max(0, sampleDem(dem, tgt.lon, tgt.lat)) * WORLD.elevScale + 0.25;
    blip.position.lerp(new THREE.Vector3(x, y, z), 0.08);
    blip.visible = tgt.moving;
    blip.material.opacity = 0.9;
  });
  hqMeshes.forEach((g) => {
    const live = parishStatus(
      { lon: g.userData.sanctuary.lon, lat: g.userData.sanctuary.lat },
      t
    ) !== "OFFLINE";
    g.traverse((o) => {
      if (o.material && o.material.color && o.userData.keep == null) {
        o.material.opacity = live ? 0.92 : 0.18;
      }
    });
  });
}

let audioCtx;
function beep(freq, dur = 0.08, gain = 0.03, type = "square") {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = gain;
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    o.stop(audioCtx.currentTime + dur);
  } catch {
    /* ignore */
  }
}

function clockStr(t) {
  const sec = Math.floor(8 * 3600 + t * 12);
  const h = String(Math.floor(sec / 3600) % 24).padStart(2, "0");
  const m = String(Math.floor(sec / 60) % 60).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function logLine(lvl, msg, t = state.time) {
  const el = $("term");
  const row = document.createElement("div");
  row.className = `ln ${lvl}`;
  row.innerHTML = `<span class="ts">${clockStr(t)}</span>${msg}`;
  el.appendChild(row);
  el.scrollTop = el.scrollHeight;
  while (el.children.length > 80) el.removeChild(el.firstChild);
}

function renderSectors(t) {
  const host = $("sectors");
  if (!host.childElementCount) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const b = document.createElement("b");
        b.dataset.c = String(c);
        b.dataset.r = String(r);
        b.textContent = `${"ABCDEFGH"[c]}${r + 1}`;
        host.appendChild(b);
      }
    }
  }
  let live = 0;
  host.querySelectorAll("b").forEach((b) => {
    const st = gridCellStatus(Number(b.dataset.c), Number(b.dataset.r), t);
    b.className = st;
    if (st === "LIVE") live++;
  });
  $("liveCount").textContent = `${live} LIVE`;
}

function renderMinimap(t) {
  const cv = $("mini");
  const ctx = cv.getContext("2d");
  const w = cv.width;
  const h = cv.height;
  ctx.fillStyle = "#030604";
  ctx.fillRect(0, 0, w, h);
  const step = 3;
  for (let y = 0; y < h; y += step) {
    const lat = BBOX.maxLat - (y / h) * (BBOX.maxLat - BBOX.minLat);
    for (let x = 0; x < w; x += step) {
      const lon = BBOX.minLon + (x / w) * (BBOX.maxLon - BBOX.minLon);
      const id = sampleParish(dem, lon, lat);
      const e = sampleDem(dem, lon, lat);
      const rgb = hypsometric(e);
      if (id < 0) {
        ctx.fillStyle = `rgb(${(rgb[0] * 255) | 0},${(rgb[1] * 255) | 0},${(rgb[2] * 255) | 0})`;
        ctx.fillRect(x, y, step, step);
        continue;
      }
      const p = PARISHES[id];
      const st = parishStatus(p, t);
      let r = rgb[0] * 255;
      let g = rgb[1] * 255;
      let b = rgb[2] * 255;
      if (st === "OFFLINE") {
        r *= 0.25;
        g *= 0.12;
        b *= 0.12;
      } else if (st === "CONTESTED") {
        r = r * 0.6 + 180;
        g = g * 0.5 + 80;
      }
      if (id === state.selectedParish) {
        r = 120;
        g = 255;
        b = 140;
      }
      ctx.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`;
      ctx.fillRect(x, y, step, step);
    }
  }
  const sw = stormWorld(t);
  const sx = ((stormCenter(t).lon - BBOX.minLon) / (BBOX.maxLon - BBOX.minLon)) * w;
  const sy = ((BBOX.maxLat - stormCenter(t).lat) / (BBOX.maxLat - BBOX.minLat)) * h;
  const rx = (sw.rad / WORLD.w) * w * 2;
  const ry = (sw.rad / WORLD.d) * h * 2;
  ctx.strokeStyle = "#ffb020";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(sx, sy, Math.max(4, rx * 0.5), Math.max(4, ry * 0.5), 0, 0, Math.PI * 2);
  ctx.stroke();
  SANCTUARIES.forEach((s) => {
    const x = ((s.lon - BBOX.minLon) / (BBOX.maxLon - BBOX.minLon)) * w;
    const y = ((BBOX.maxLat - s.lat) / (BBOX.maxLat - BBOX.minLat)) * h;
    ctx.fillStyle = parishStatus(s, t) === "OFFLINE" ? "#5a2024" : "#ffb020";
    ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
  });
}

function sparkline(filings) {
  const cv = document.createElement("canvas");
  cv.width = 320;
  cv.height = 36;
  const ctx = cv.getContext("2d");
  ctx.fillStyle = "#07110a";
  ctx.fillRect(0, 0, 320, 36);
  const vals = filings.map((f) => f.rev);
  const max = Math.max(...vals, 0.01);
  ctx.beginPath();
  ctx.strokeStyle = "#7cff6b";
  ctx.lineWidth = 1.5;
  vals.forEach((v, i) => {
    const x = (i / Math.max(1, vals.length - 1)) * 310 + 5;
    const y = 32 - (v / max) * 28;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  return `<img id="spark" alt="990 revenue" src="${cv.toDataURL("image/png")}" />`;
}

function openPip(node) {
  state.selectedNode = node;
  $("rightDock")?.classList.add("open");
  if (!node) {
    $("pipBody").innerHTML =
      '<p class="note">Select a sanctuary node (religious headquarters) to open Form 990 history and contact. Figures are rounded public extracts — not IRS transcripts.</p>';
    return;
  }
  const rows = node.filings
    .map(
      (f) =>
        `<tr><td>${f.y}</td><td>${f.form}</td><td class="num">${money(f.rev)}</td><td class="num">${money(
          f.exp
        )}</td><td class="num">${money(f.ast)}</td><td>${f.status}</td></tr>`
    )
    .join("");
  $("pipBody").innerHTML = `
    <h2>${node.name}</h2>
    <div class="rite">${node.short} · ${node.rite} · ${node.ntee}</div>
    <div class="kv">
      <span>EIN</span><b>${node.ein}</b>
      <span>${SITE.unit}</span><b>${node.parish}</b>
      <span>Pad</span><b>${node.address}</b>
      <span>City</span><b>${node.city}</b>
      <span>Voice</span><b>${node.phone}</b>
      <span>Host</span><b>${node.web}</b>
      <span>Officer</span><b>Principal Officer — see 990 Part VII</b>
    </div>
    ${sparkline(node.filings)}
    <table>
      <thead><tr><th>YEAR</th><th>FORM</th><th>REV</th><th>EXP</th><th>ASSET</th><th>FILE</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p class="note">${node.note} Compiled for ${SITE.code} simulation. Not an IRS transcript.</p>
  `;
  logLine("sys", `open  /990/${node.id}   ${node.short}   EIN ${node.ein}`);
  beep(880, 0.06, 0.025, "triangle");
}

function updateLabels(t) {
  const host = $("labels");
  const { w, h } = viewSize();
  const items = [];
  SANCTUARIES.forEach((s) => {
    const [x, z] = project(s.lon, s.lat);
    const y = Math.max(0, sampleDem(dem, s.lon, s.lat)) * WORLD.elevScale + 1.2;
    const v = new THREE.Vector3(x, y, z).project(camera);
    if (v.z > 1) return;
    const px = (v.x * 0.5 + 0.5) * w;
    const py = (-v.y * 0.5 + 0.5) * h;
    if (px < 40 || px > w - 40 || py < 70 || py > h - 70) return;
    const off = parishStatus(s, t) === "OFFLINE";
    items.push({ px, py, text: s.short, off, hq: true });
  });
  if (state.selectedParish >= 0) {
    const p = PARISHES[state.selectedParish];
    const [x, z] = project(p.lon, p.lat);
    const y = Math.max(0, sampleDem(dem, p.lon, p.lat)) * WORLD.elevScale + 0.6;
    const v = new THREE.Vector3(x, y, z).project(camera);
    const px = (v.x * 0.5 + 0.5) * w;
    const py = (-v.y * 0.5 + 0.5) * h;
    items.push({
      px,
      py,
      text: `${p.name.toUpperCase()} · ${p.sector} · ${parishStatus(p, t)}`,
      off: parishStatus(p, t) === "OFFLINE",
      hq: false,
    });
  }
  host.innerHTML = items
    .map(
      (it) =>
        `<span class="${it.hq ? "hq" : ""} ${it.off ? "off" : ""}" style="left:${it.px}px;top:${it.py}px">${it.text}</span>`
    )
    .join("");
}

function flyTo(lon, lat, dist = 9) {
  const [x, z] = project(lon, lat);
  const y = Math.max(0, sampleDem(dem, lon, lat)) * WORLD.elevScale;
  controls.target.set(x, y, z);
  const off = new THREE.Vector3(dist * 0.45, dist * 0.55, dist * 0.55);
  camera.position.copy(controls.target).add(off);
}

function selectParish(id) {
  state.selectedParish = id;
  if (id < 0) return;
  const p = PARISHES[id];
  const e = sampleDem(dem, p.lon, p.lat);
  const nodes = sanctuariesInParish(p.name);
  $("coords").textContent =
    `${p.lat.toFixed(3)}°N  ${Math.abs(p.lon).toFixed(3)}°W  ·  ELEV ${e.toFixed(1)} m  ·  ${p.name.toUpperCase()} ${SITE.unit}  ·  SEAT ${p.seat}  ·  ${p.sector}  ·  ${parishStatus(p, state.time)}`;
  logLine(
    "ok",
    `select  ${p.name} ${SITE.unit}   ${p.fips}   seat ${p.seat}   pop ${p.pop.toLocaleString()}   ${nodes.length} node(s)`
  );
  if (nodes[0]) openPip(nodes[0]);
}

function pick(ev) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hqHit = raycaster.intersectObjects(hqMeshes, true)[0];
  if (hqHit) {
    let o = hqHit.object;
    while (o && !o.userData.sanctuary) o = o.parent;
    if (o?.userData.sanctuary) {
      const s = o.userData.sanctuary;
      const p = parishByName(s.parish);
      if (p) selectParish(p.index);
      openPip(s);
      flyTo(s.lon, s.lat, 7);
      return;
    }
  }
  const hit = raycaster.intersectObject(terrain)[0];
  if (!hit) return;
  const [lon, lat] = unproject(hit.point.x, hit.point.z);
  state.hoverLon = lon;
  state.hoverLat = lat;
  const id = sampleParish(dem, lon, lat);
  if (id >= 0) selectParish(id);
}

function execCommand(raw) {
  const line = raw.trim();
  if (!line) return;
  const [cmd, ...rest] = line.split(/\s+/);
  const arg = rest.join(" ");
  const c = cmd.toLowerCase();
  logLine("sys", `# ${line}`);
  if (c === "help" || c === "?") {
    logLine(
      "ok",
      `cmds: list · nodes · open <name> · track <org> · fly <tract> · storm · wx · site ww|dalton|iv|stx|la · pause · access security`
    );
  } else if (c === "list") {
    PARISHES.forEach((p) => {
      if (parishStatus(p, state.time) !== "OFFLINE") {
        logLine("ok", `${p.sector}  ${p.name.padEnd(22)}  ${p.seat}`);
      }
    });
  } else if (c === "nodes") {
    liveNodes(state.time).forEach((s) => logLine("ok", `${s.short.padEnd(10)}  ${s.name}  ${s.city}`));
  } else if (c === "open" || c === "fly" || c === "track") {
    const node = findSanctuary(arg);
    const p = parishByName(arg) || (node ? parishByName(node.parish) : null);
    if (node) {
      openPip(node);
      flyTo(node.lon, node.lat, 7);
      if (p) selectParish(p.index);
    } else if (p) {
      selectParish(p.index);
      flyTo(p.lon, p.lat, 10);
    } else logLine("bad", `not in phone book: ${arg}`);
  } else if (c === "wx" || c === "weather") {
    if (arg.toLowerCase() === "refresh") bootWx(true);
    else if (!state.wx) logLine("warn", "wx  still probing NOAA / Open-Meteo / WU");
    else {
      const w = state.wx;
      logLine(
        w.live ? "ok" : "warn",
        `wx  ${w.source}  ${w.station}  ${w.tempF != null ? w.tempF.toFixed(1) : "—"}F  RH ${
          w.rh != null ? w.rh.toFixed(0) : "—"
        }  ${w.windMph != null ? w.windMph.toFixed(0) : "—"} mph  ${w.text}`
      );
    }
  } else if (c === "storm") {
    const { phase, r } = stormRadiusNorm(state.time);
    logLine("warn", `${phase.name}   r=${r.toFixed(2)}   nodes=${liveNodes(state.time).length}`);
  } else if (c === "pause") {
    state.paused = true;
    $("btnPause").textContent = "RESUME";
  } else if (c === "resume" || c === "play") {
    state.paused = false;
    $("btnPause").textContent = "PAUSE";
  } else if (c === "access") {
    logLine("ok", "access security  —  permission granted.  fence map on the board.");
    beep(220, 0.2, 0.04);
  } else if (c === "whte_rbt.obj" || c === "white_rabbit.obj" || c === "nedry") {
    logLine("bad", "ah ah ah — you didn't say the magic word.");
    beep(90, 0.4, 0.05, "sawtooth");
  } else if (c === "unix" || c === "it's") {
    logLine("ok", "it's a UNIX system. I know this. the 990s are the phone book.");
  } else if (c === "site" || c === "pad") {
    const id = (arg || "").toLowerCase();
    const hit = CATALOG.find((x) => x.id === id || x.label.toLowerCase().includes(id));
    if (!hit) logLine("warn", "pads: stx · la · ww · dalton · iv");
    else location.href = hit.href;
  } else {
    logLine("warn", `unknown: ${cmd}   try HELP`);
  }
}

function pumpEvents(prev, now) {
  drainEvents(prev, now).forEach((e) => {
    if (e.type === "log") logLine(e.lvl, e.msg, now);
    if (e.type === "phase") {
      $("phaseChip").textContent = e.name;
      beep(140, 0.18, 0.04);
    }
    if (e.type === "pip") {
      const n = findSanctuary(e.id);
      if (n) openPip(n);
    }
  });
}

function boot() {
  const lines = SITE.boot || ["SITE-X  online"];
  const log = $("bootLog");
  const bar = $("bootBar");
  let i = 0;
  const tick = () => {
    if (i < lines.length) {
      log.textContent += lines[i] + "\n";
      bar.style.width = `${((i + 1) / lines.length) * 100}%`;
      beep(420 + i * 60, 0.05, 0.02);
      i++;
      setTimeout(tick, 280);
    } else {
      setTimeout(() => $("boot").classList.add("hide"), 400);
    }
  };
  tick();
}

function initThree() {
  const canvas = $("stage");
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !isCoarse,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, isCoarse ? 1.25 : 1.75));
  renderer.setClearColor(0x050806, 1);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
  if (SITE.id === "stx") camera.position.set(2, 18, 16);
  else if (SITE.id === "iv") camera.position.set(2, 14, 16);
  else if (SITE.id === "ww" || SITE.id === "dalton") camera.position.set(6, 20, 22);
  else camera.position.set(16, 22, 26);

  scene.fog = new THREE.FogExp2(0x050806, SITE.id === "stx" || SITE.id === "iv" ? 0.012 : 0.016);

  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.minDistance = 4;
  controls.maxDistance = 70;
  controls.maxPolarAngle = Math.PI / 2.08;
  controls.target.set(0, 0.4, 0);
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.18;
  controls.addEventListener("start", () => {
    controls.autoRotate = false;
  });

  scene.add(new THREE.AmbientLight(0x3a6a40, 0.55));
  const key = new THREE.PointLight(0x7cff6b, 1.4, 80);
  key.position.set(8, 18, 6);
  scene.add(key);
  const rim = new THREE.PointLight(0xffb020, 0.7, 70);
  rim.position.set(-12, 10, -8);
  scene.add(rim);

  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();

  makeTerrain();
  makeHeadquarters();
  makeStorm();

  canvas.addEventListener("pointerdown", (e) => {
    if (e.button === 0) pick(e);
  });

  resize();
  addEventListener("resize", resize);
  visualViewport?.addEventListener("resize", resize);
}

function tick(now) {
  const dt = 0.016;
  if (!state.paused) {
    const prev = state.time;
    state.time += dt;
    pumpEvents(prev, state.time);
  }
  updateStorm(state.time);
  renderSectors(state.time);
  if ((now / 250) % 1 < 0.5 || !state._miniAt || now - state._miniAt > 400) {
    renderMinimap(state.time);
    state._miniAt = now;
  }
  updateLabels(state.time);
  $("clock").textContent = clockStr(state.time);
  $("phaseChip").textContent = stormRadiusNorm(state.time).phase.name;
  const live = liveNodes(state.time).length;
  if (state.selectedParish < 0) {
    const e = sampleDem(dem, state.hoverLon, state.hoverLat);
    $("coords").textContent =
      `${state.hoverLat.toFixed(3)}°N  ${Math.abs(state.hoverLon).toFixed(3)}°W  ·  ELEV ${e.toFixed(1)} m  ·  NODES ${live}/${SANCTUARIES.length}`;
  }
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

function bindUi() {
  $("cmdForm").addEventListener("submit", (e) => {
    e.preventDefault();
    execCommand($("cmd").value);
    $("cmd").value = "";
  });
  $("btnPause").onclick = () => {
    state.paused = !state.paused;
    $("btnPause").textContent = state.paused ? "RESUME" : "PAUSE";
    logLine("sys", state.paused ? "clock hold" : "clock run");
  };
  $("btnPip").onclick = () => {
    $("rightDock").classList.toggle("open");
  };
  addEventListener("keydown", (e) => {
    if (e.target === $("cmd")) return;
    if (e.code === "Space") {
      e.preventDefault();
      $("btnPause").click();
    }
  });
  $("sectors").addEventListener("click", (e) => {
    const b = e.target.closest("b");
    if (!b) return;
    const c = Number(b.dataset.c);
    const r = Number(b.dataset.r);
    const lon = BBOX.minLon + ((c + 0.5) / 8) * (BBOX.maxLon - BBOX.minLon);
    const lat = BBOX.maxLat - ((r + 0.5) / 8) * (BBOX.maxLat - BBOX.minLat);
    const id = sampleParish(dem, lon, lat);
    flyTo(lon, lat, 12);
    if (id >= 0) selectParish(id);
  });
}

function applyChrome() {
  const h1 = document.querySelector(".topbar h1");
  const sub = document.querySelector(".topbar p");
  const meta = document.querySelector(".topbar .meta");
  if (h1) h1.textContent = SITE.title;
  if (sub) sub.textContent = SITE.subtitle;
  if (meta) meta.innerHTML = `<b id="clock">08:00:00</b>${SITE.gridLabel}`;
  document.title = SITE.title;
  const help = document.querySelector(".help");
  if (help) help.textContent = `drag orbit · wheel zoom · click ${SITE.unit.toLowerCase()} / HQ · type HELP · TERRARIUM`;
  const cmd = $("cmd");
  if (cmd) {
    const ph = {
      stx: "access security  ·  open christiansted  ·  track villa",
      la: "access security  ·  open orleans  ·  track loyola",
      ww: "access security  ·  open wrightwood  ·  track ols",
      dalton: "access security  ·  open dalton  ·  track stdorothy",
      iv: "access security  ·  open del playa  ·  track stmarks",
    };
    cmd.placeholder = ph[SITE.id] || ph.stx;
  }
  const nav = $("siteNav");
  if (nav) {
    nav.innerHTML = CATALOG.map((c) => {
      const q = c.id === "stx" ? "" : `?site=${c.id}`;
      return `<a class="${c.id === SITE.id ? "on" : ""}" href="./index.html${q}#grid">${c.label}</a>`;
    }).join("");
  }
}

function paintGridWx() {
  const panel = $("gridWx");
  const chip = $("wxChip");
  if (panel) panel.innerHTML = wxHudMarkup(state.wx);
  if (chip) chip.textContent = wxChipText(state.wx);
}

function applyWxAtmosphere(wx) {
  if (!wx || !scene) return;
  const eco = ecosystemFromWx(wx);
  if (scene.fog) scene.fog.density = eco.fog ? 0.03 : eco.rain ? 0.022 : SITE.id === "stx" || SITE.id === "iv" ? 0.012 : 0.016;
  if (renderer) renderer.setClearColor(eco.rain ? 0x081018 : 0x050806, 1);
}

async function bootWx(force) {
  const chip = $("wxChip");
  if (chip) chip.textContent = force ? "WX · refresh…" : "WX · probing";
  try {
    state.wx = await loadWeather(SITE_ID);
    paintGridWx();
    applyWxAtmosphere(state.wx);
    const w = state.wx;
    logLine(
      w.live ? "sys" : "warn",
      `wx  ${w.source}  ${w.station}  ${w.tempF != null ? w.tempF.toFixed(1) : "—"}°F`
    );
  } catch (err) {
    if (chip) chip.textContent = "WX · link down";
    logLine("bad", `wx  ${err.message || err}`);
  }
}

async function main() {
  await loadSite();
  applyChrome();
  boot();
  const fine = !isCoarse;
  dem = buildDem(fine ? (SITE.id === "iv" ? 220 : 200) : 140, fine ? (SITE.id === "iv" ? 110 : 140) : 88);
  initThree();
  bindUi();
  logLine("sys", `${SITE.code} control online.  type HELP.  source ${SITE.source}`);
  bootWx(false);
  requestAnimationFrame(tick);
}

export { main as startGrid };

if (document.documentElement.dataset.shell !== "1") {
  main().catch((err) => {
    logLine("bad", err.message || String(err));
    console.error(err);
  });
}
