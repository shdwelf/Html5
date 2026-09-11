/**
 * webxdc (.xdc) packer for the Glendora High viewer.
 *
 * Builds a self-contained single-page app (no network, no build step, no
 * external libraries) that renders the campus with a canvas painter's-algorithm
 * renderer, carries the VRML source for download, and zips it into a .xdc.
 *
 * Pure module: no DOM. Uses js/zip.js for the container.
 */

import { zipFiles } from "./zip.js";
import { campusToVrml } from "./ghs-vrml.js";

const round = (n, p = 2) => Math.round(n * 10 ** p) / 10 ** p;

export function packModelData(model) {
  return {
    site: {
      name: model.site.name,
      address: model.site.address,
      lat: model.site.lat,
      lon: model.site.lon,
      ele: model.site.ele,
      source: model.site.source,
    },
    campus: model.campus.map((v) => round(v, 2)),
    buildings: model.buildings.map((b) => ({
      n: b.name,
      k: b.kind,
      h: round(b.h, 2),
      base: round(b.base, 2),
      r: b.ring.map((v) => round(v, 2)),
    })),
    areas: model.areas.map((a) => ({
      n: a.name,
      k: a.kind,
      base: round(a.base, 2),
      r: a.ring.map((v) => round(v, 2)),
    })),
    roads: model.roads
      .filter((r) => r.ribbon.length >= 8)
      .map((r) => ({ k: r.kind, r: r.ribbon.map((v) => round(v, 2)) })),
    trees: model.trees.map((t) => [round(t.x, 1), round(t.y, 1), round(t.base + t.h * 0.5, 1), round(t.r, 1), round(t.h, 1)]),
    stats: model.stats,
  };
}

export function viewerHtml(data, wrlText) {
  const json = JSON.stringify(data);
  const wrlJson = JSON.stringify(wrlText);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${data.site.name} — VRML campus viewer</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #07100c; color: #d8f2e2; font: 12px/1.45 ui-monospace, "SFMono-Regular", Menlo, monospace; overflow: hidden; }
  header { display: flex; align-items: baseline; gap: 12px; padding: 8px 12px; background: linear-gradient(180deg,#0d1f17,#08130e); border-bottom: 1px solid #1d4233; }
  header h1 { font-size: 13px; margin: 0; letter-spacing: .08em; }
  header p { margin: 0; opacity: .7; font-size: 11px; }
  main { display: grid; grid-template-rows: 1fr auto; height: calc(100vh - 34px); }
  canvas { width: 100%; height: 100%; display: block; touch-action: none; cursor: grab; }
  .bar { display: flex; flex-wrap: wrap; gap: 6px; padding: 6px 8px; background: #08130e; border-top: 1px solid #1d4233; }
  button { font: inherit; background: #123125; color: #d8f2e2; border: 1px solid #2a5b45; padding: 4px 8px; cursor: pointer; }
  button:hover { background: #1a4534; }
  button.on { background: #2a7a55; border-color: #63d39c; color: #05130c; }
  .note { padding: 4px 10px 8px; opacity: .7; background: #08130e; }
  #hud { position: absolute; right: 8px; top: 42px; padding: 6px 8px; background: rgba(6,18,12,.8); border: 1px solid #1d4233; font-size: 11px; pointer-events: none; }
</style>
</head>
<body>
<header>
  <h1>${data.site.name.toUpperCase()}</h1>
  <p>${data.site.address} · VRML campus reconstruction</p>
</header>
<main>
  <div style="position:relative">
    <canvas id="c"></canvas>
    <div id="hud"></div>
  </div>
  <div>
    <div class="bar">
      <button id="orbit">AUTO-ORBIT</button>
      <button id="wire">WIREFRAME</button>
      <button id="trees">TREES</button>
      <button id="labels">LABELS</button>
      <button id="top">PLAN VIEW</button>
      <button id="dl">DOWNLOAD .WRL</button>
      <button id="reset">RESET</button>
    </div>
    <div class="note" id="note">drag to orbit · wheel / pinch to zoom</div>
  </div>
</main>
<script>
const DATA = ${json};
const WRL = ${wrlJson};
const cv = document.getElementById("c");
const ctx = cv.getContext("2d");
const hud = document.getElementById("hud");
const note = document.getElementById("note");
let yaw = 0.9, pitch = 0.62, dist = 460, auto = false, wire = false, showTrees = true, showLabels = false;
let cx = 0, cy = 0;
const COLORS = {
  classroom: [222,206,170], admin: [186,98,78], gym: [200,205,212], hall: [170,142,114],
  annex: [206,200,186], portable: [154,170,180], shed: [142,150,156], canopy: [232,232,236],
  amphitheater: [194,180,156], cafeteria: [216,196,142],
};
const FLATS = { yard: [72,110,58], field: [78,128,62], court: [108,94,128], track: [160,88,58], parking: [108,110,112], road: [78,80,82], path: [158,150,132] };

function resize() {
  const r = cv.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = Math.max(320, r.width * dpr);
  cv.height = Math.max(240, r.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener("resize", resize);

function project(p) {
  const cosY = Math.cos(yaw), sinY = Math.sin(yaw);
  const x = p[0] * cosY - p[2] * sinY;
  const z = p[0] * sinY + p[2] * cosY;
  const cosP = Math.cos(pitch), sinP = Math.sin(pitch);
  const y = p[1] * cosP - z * sinP;
  const d = p[1] * sinP + z * cosP + dist;
  if (d < 1) return null;
  const f = 520 / d;
  return [cv.clientWidth / 2 + x * f, cv.clientHeight / 2 - y * f, d];
}

function buildFaces() {
  const faces = [];
  const bounds = DATA.campus.reduce((b, v, i) => {
    if (i % 2 === 0) { b.minX = Math.min(b.minX, v); b.maxX = Math.max(b.maxX, v); }
    else { b.minY = Math.min(b.minY, v); b.maxY = Math.max(b.maxY, v); }
    return b;
  }, { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });
  cx = (bounds.minX + bounds.maxX) / 2;
  cy = (bounds.minY + bounds.maxY) / 2;
  const w = (x) => [x[0] - cx, 0, -(x[1] - cy)];

  // ground
  const g = DATA.campus;
  faces.push({ pts: g.map((v, i) => (i % 2 ? null : [g[i] - cx, 0, -(g[i + 1] - cy)])).filter(Boolean).map((p) => [p[0], 0, p[2]]), color: FLATS.yard, depthBias: 40 });
  for (const a of DATA.areas) {
    const pts = [];
    for (let i = 0; i + 1 < a.r.length; i += 2) pts.push([a.r[i] - cx, 0.05, -(a.r[i + 1] - cy)]);
    faces.push({ pts, color: FLATS[a.k] || FLATS.yard, depthBias: 30 });
  }
  for (const r of DATA.roads) {
    const pts = [];
    for (let i = 0; i + 1 < r.r.length; i += 2) pts.push([r.r[i] - cx, 0.1, -(r.r[i + 1] - cy)]);
    faces.push({ pts, color: FLATS[r.k] || FLATS.road, depthBias: 20 });
  }
  for (const b of DATA.buildings) {
    const n = b.r.length / 2;
    const col = COLORS[b.k] || COLORS.classroom;
    let sx = 0, sy = 0;
    for (let i = 0; i < n; i++) { sx += b.r[i * 2]; sy += b.r[i * 2 + 1]; }
    sx /= n; sy /= n;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const p0 = [b.r[i * 2] - cx, b.base, -(b.r[i * 2 + 1] - cy)];
      const p1 = [b.r[j * 2] - cx, b.base, -(b.r[j * 2 + 1] - cy)];
      const p2 = [b.r[j * 2] - cx, b.base + b.h, -(b.r[j * 2 + 1] - cy)];
      const p3 = [b.r[i * 2] - cx, b.base + b.h, -(b.r[i * 2 + 1] - cy)];
      const nx = (p1[2] - p0[2]);
      const nz = -(p1[0] - p0[0]);
      faces.push({ pts: [p0, p1, p2, p3], color: col, normal: [nx, 0, nz], depthBias: 0 });
    }
    const roof = [];
    for (let i = 0; i < n; i++) roof.push([b.r[i * 2] - cx, b.base + b.h, -(b.r[i + 1 >= n ? 1 : i * 2 + 1] - cy)]);
    faces.push({ pts: roof, color: [col[0] * 0.7, col[1] * 0.7, col[2] * 0.7], normal: [0, 1, 0], label: b.n, labelAt: [sx - cx, b.base + b.h + 2, -(sy - cy)], depthBias: 0 });
  }
  return faces;
}

let FACES = [];

function draw() {
  const w = cv.clientWidth, h = cv.clientHeight;
  ctx.fillStyle = "#08130e";
  ctx.fillRect(0, 0, w, h);
  const list = [];
  for (const f of FACES) {
    const proj = [];
    let ok = true;
    let depth = 0;
    for (const p of f.pts) {
      const q = project(p);
      if (!q) { ok = false; break; }
      proj.push(q);
      depth += q[2];
    }
    if (!ok || proj.length < 3) continue;
    list.push({ f, proj, depth: depth / proj.length + (f.depthBias || 0) });
  }
  list.sort((a, b) => b.depth - a.depth);
  for (const item of list) {
    const { f, proj } = item;
    let shade = 1;
    if (f.normal) {
      const l = [0.4, 0.75, 0.5];
      const n = f.normal;
      const len = Math.hypot(n[0], n[1], n[2]) || 1;
      shade = 0.55 + 0.45 * Math.abs((n[0] * l[0] + n[1] * l[1] + n[2] * l[2]) / len);
    }
    ctx.beginPath();
    ctx.moveTo(proj[0][0], proj[0][1]);
    for (let i = 1; i < proj.length; i++) ctx.lineTo(proj[i][0], proj[i][1]);
    ctx.closePath();
    const c = f.color;
    if (wire) {
      ctx.strokeStyle = "rgba(120,240,180,0.5)";
      ctx.lineWidth = 0.6;
      ctx.stroke();
    } else {
      ctx.fillStyle = "rgb(" + Math.round(c[0] * shade) + "," + Math.round(c[1] * shade) + "," + Math.round(c[2] * shade) + ")";
      ctx.fill();
      ctx.strokeStyle = "rgba(6,20,14,0.55)";
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
    if (showLabels && f.label) {
      const q = project(f.labelAt);
      if (q) {
        ctx.fillStyle = "#9fe8c2";
        ctx.font = "10px ui-monospace, monospace";
        ctx.fillText(f.label, q[0], q[1]);
      }
    }
  }
  if (showTrees) {
    ctx.fillStyle = "rgba(60,150,80,0.85)";
    for (const t of DATA.trees) {
      const q = project([t[0] - cx, t[2], -(t[1] - cy)]);
      if (!q) continue;
      const r = Math.max(1, (520 / q[2]) * t[3] * 0.5);
      ctx.beginPath();
      ctx.arc(q[0], q[1], r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  hud.textContent = "yaw " + (yaw % 6.283).toFixed(2) + "  pitch " + pitch.toFixed(2) + "  dist " + dist.toFixed(0) + " m\\n" +
    DATA.buildings.length + " buildings · " + DATA.areas.length + " fields · " + DATA.trees.length + " trees";
  hud.style.whiteSpace = "pre";
}

function loop() {
  if (auto) yaw += 0.004;
  draw();
  requestAnimationFrame(loop);
}

let drag = null;
cv.addEventListener("pointerdown", (e) => { drag = { x: e.clientX, y: e.clientY }; cv.setPointerCapture(e.pointerId); });
cv.addEventListener("pointermove", (e) => {
  if (!drag) return;
  yaw += (e.clientX - drag.x) * 0.006;
  pitch = Math.max(0.08, Math.min(1.5, pitch + (e.clientY - drag.y) * 0.005));
  drag = { x: e.clientX, y: e.clientY };
});
cv.addEventListener("pointerup", () => { drag = null; });
cv.addEventListener("wheel", (e) => { e.preventDefault(); dist = Math.max(80, Math.min(1400, dist + e.deltaY * 0.6)); }, { passive: false });

const btn = (id, fn) => { const el = document.getElementById(id); el.addEventListener("click", fn); return el; };
const bOrbit = btn("orbit", () => { auto = !auto; bOrbit.classList.toggle("on", auto); });
const bWire = btn("wire", () => { wire = !wire; bWire.classList.toggle("on", wire); });
const bTrees = btn("trees", () => { showTrees = !showTrees; bTrees.classList.toggle("on", showTrees); });
bTrees.classList.add("on");
const bLabels = btn("labels", () => { showLabels = !showLabels; bLabels.classList.toggle("on", showLabels); });
btn("top", () => { pitch = 1.5; yaw = 0; dist = 520; });
btn("reset", () => { yaw = 0.9; pitch = 0.62; dist = 460; });
btn("dl", () => {
  const blob = new Blob([WRL], { type: "model/vrml" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "glendora-high-school.wrl";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
});

resize();
FACES = buildFaces();
note.textContent = DATA.site.source + " · " + Math.round(DATA.stats.campusAreaM2) + " m² campus · drag to orbit";
loop();
</script>
</body>
</html>
`;
}

export function xdcManifest(data) {
  return `name = "GLENDORA HIGH · VRML CAMPUS"
source_code_url = "https://github.com/shdwelf/Html5"
`;
}

export function xdcReadme(data, wrlBytes) {
  return [
    "GLENDORA HIGH SCHOOL — webxdc campus viewer",
    "===========================================",
    "",
    `${data.site.name} · ${data.site.address}`,
    `Geometry: ${data.site.source}`,
    "",
    "WHAT THIS IS",
    "  A self-contained HTML5 viewer for the Glendora High campus, rebuilt from",
    "  OpenStreetMap footprints, packed as a webxdc (.xdc = ZIP archive).",
    "",
    "CONTENTS",
    "  index.html          the viewer (canvas renderer, no dependencies)",
    "  glendora.wrl        VRML 2.0 source for the same model",
    "  manifest.toml       webxdc manifest",
    "  README.md           this file",
    "",
    "INSTALL",
    "  Drop the .xdc into any webxdc host (Delta Chat, webxdc.de, the webxdc",
    "  desktop dev tool). It runs fully offline.",
    "",
    `  ${data.buildings.length} buildings · ${data.areas.length} fields/courts · ${data.trees.length} trees`,
    `  VRML source: ${wrlBytes} bytes`,
    "",
  ].join("\n");
}

/**
 * @param {object} model buildModel() output
 * @param {string} [wrl] pre-generated VRML text (regenerated if omitted)
 */
export function buildXdcBundle(model, wrl) {
  const data = packModelData(model);
  const text = wrl || campusToVrml(model, { grid: 18 });
  const compact = text.replace(/\n\s+/g, "\n");
  const html = viewerHtml(data, compact);
  const files = [
    { name: "index.html", data: html },
    { name: "glendora.wrl", data: text },
    { name: "manifest.toml", data: xdcManifest(data) },
    { name: "README.md", data: xdcReadme(data, new TextEncoder().encode(text).length) },
  ];
  const xdc = zipFiles(files, { deflate: true });
  return { xdc, files, data };
}
