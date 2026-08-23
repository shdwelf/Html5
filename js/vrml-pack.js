/** Terraink-style auto pipeline: DEM → layered VRML → self-extracting SFX installer. */

import { CATALOG, resolveSite } from "./site-id.js";
import { extractTerrainkLayers } from "./terraink.js";
import { demToVrml, downloadText, defaultLayers, VRML_LAYERS } from "./vrml-export.js";

const $ = (id) => document.getElementById(id);

export { VRML_LAYERS, defaultLayers };

function pathToPairs(path) {
  const segs = [];
  for (let i = 0; i < path.length - 1; i++) segs.push(path[i], path[i + 1]);
  return segs;
}

function drapePairs(geo, dem, pairs) {
  const out = [];
  if (!pairs?.length) return out;
  for (const p of pairs) {
    const lon = p[0];
    const lat = p[1];
    const [x, z] = geo.project(lon, lat);
    const y = geo.sampleDem(dem, lon, lat) * geo.WORLD.elevScale + 0.05;
    out.push(x, y, z);
  }
  return out;
}

function encodeF32(arr) {
  const bytes = new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
  let bin = "";
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + step));
  }
  return btoa(bin);
}

export function readLayers(root = $("sfxLayers")) {
  const layers = defaultLayers();
  if (!root) return layers;
  root.querySelectorAll("[data-layer]").forEach((el) => {
    layers[el.dataset.layer] = !!el.checked;
  });
  return layers;
}

export function writeLayers(layers, root = $("sfxLayers")) {
  if (!root) return;
  root.querySelectorAll("[data-layer]").forEach((el) => {
    el.checked = layers[el.dataset.layer] !== false;
  });
}

export function buildWorldPack({ geo, dem, wx, nodes, layers }) {
  const L = { ...defaultLayers(), ...(layers || {}) };
  const tk = extractTerrainkLayers(dem, geo.BBOX, { levels: 16, hachureEvery: 3, drainSeeds: 80 });
  const contourLines = L.contours
    ? tk.contours.map((c) => ({ level: c.level, segs: drapePairs(geo, dem, c.segs) }))
    : [];
  const hachureLines = L.hachure ? drapePairs(geo, dem, tk.hachures) : [];
  const drainLines = L.drain ? drapePairs(geo, dem, tk.drainage) : [];
  const outlineLines = L.outline ? drapePairs(geo, dem, pathToPairs(geo.LA_OUTLINE || [])) : [];
  let roadLines = [];
  if (L.roads && geo.ROADS) {
    for (const path of Object.values(geo.ROADS)) roadLines = roadLines.concat(drapePairs(geo, dem, pathToPairs(path)));
  }
  const nodePts = (nodes || []).map((n) => {
    const [x, z] = geo.project(n.lon, n.lat);
    const y = Math.max(0, geo.sampleDem(dem, n.lon, n.lat)) * geo.WORLD.elevScale;
    return { x, y, z, name: n.short || n.name };
  });

  const wrl = demToVrml(dem, geo.WORLD, wx, geo.SITE.title, {
    layers: L,
    contourLines,
    hachureLines,
    drainLines,
    outlineLines,
    roadLines,
    nodes: nodePts,
    stepX: 3,
    stepY: 3,
  });

  const elev = new Float32Array(dem.elev);
  return {
    site: geo.SITE.id,
    code: geo.SITE.code,
    title: geo.SITE.title,
    bbox: geo.BBOX,
    world: geo.WORLD,
    nx: dem.nx,
    ny: dem.ny,
    zMin: dem.zMin,
    zMax: dem.zMax,
    elevB64: encodeF32(elev),
    layers: L,
    tk: { lo: tk.lo, hi: tk.hi, step: tk.step, n: tk.levels.length },
    wx: wx
      ? {
          source: wx.source,
          station: wx.station,
          tempF: wx.tempF,
          text: wx.text,
          live: wx.live,
        }
      : null,
    nodes: nodePts.map((n) => ({ x: n.x, z: n.z, y: n.y, name: n.name })),
    outline: geo.LA_OUTLINE || [],
    wrl,
    home: typeof location !== "undefined" ? new URL("./index.html", location.href).href : "./index.html",
    at: new Date().toISOString(),
  };
}

export function paintIso(canvas, pack, layers) {
  if (!canvas || !pack) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.fillStyle = "#07110a";
  ctx.fillRect(0, 0, w, h);
  const elev = pack.elev || decodeF32(pack.elevB64);
  if (!elev) return;
  const nx = pack.nx;
  const ny = pack.ny;
  const world = pack.world;
  const L = layers || pack.layers || defaultLayers();
  const step = Math.max(1, Math.floor(Math.max(nx, ny) / 64));
  const scale = Math.min(w, h) / (world.w * 1.15);
  const cx = w * 0.5;
  const cy = h * 0.62;
  const iso = (x, y, z) => {
    return [cx + (x - z) * 0.82 * scale, cy - (y * 1.15 + (x + z) * 0.42) * scale];
  };
  const sample = (i, j) => {
    const x = (i / (nx - 1) - 0.5) * world.w;
    const z = (j / (ny - 1) - 0.5) * world.d;
    const y = elev[j * nx + i] * world.elevScale;
    return [x, y, z];
  };
  const hyp = (z) => {
    const t = (z - pack.zMin) / Math.max(1e-3, pack.zMax - pack.zMin);
    if (t < 0.2) return [20, 70, 40];
    if (t < 0.45) return [40, 110, 45];
    if (t < 0.7) return [90, 120, 40];
    if (t < 0.88) return [140, 130, 70];
    return [210, 210, 200];
  };
  if (L.terrain !== false) {
    for (let j = 0; j < ny - step; j += step) {
      for (let i = 0; i < nx - step; i += step) {
        const a = sample(i, j);
        const b = sample(i + step, j);
        const c = sample(Math.min(nx - 1, i + step), Math.min(ny - 1, j + step));
        const pa = iso(a[0], a[1], a[2]);
        const pb = iso(b[0], b[1], b[2]);
        const pc = iso(c[0], c[1], c[2]);
        const rgb = hyp((a[1] + b[1] + c[1]) / 3 / world.elevScale);
        ctx.fillStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
        ctx.beginPath();
        ctx.moveTo(pa[0], pa[1]);
        ctx.lineTo(pb[0], pb[1]);
        ctx.lineTo(pc[0], pc[1]);
        ctx.closePath();
        ctx.fill();
      }
    }
  }
  ctx.strokeStyle = "#c45a18";
  ctx.lineWidth = 1.2;
  if (L.outline !== false && pack.outline?.length) {
    ctx.beginPath();
    pack.outline.forEach((p, i) => {
      const u = (p[0] - pack.bbox.minLon) / (pack.bbox.maxLon - pack.bbox.minLon);
      const v = (pack.bbox.maxLat - p[1]) / (pack.bbox.maxLat - pack.bbox.minLat);
      const x = (u - 0.5) * world.w;
      const z = (v - 0.5) * world.d;
      const ii = Math.round(u * (nx - 1));
      const jj = Math.round(v * (ny - 1));
      const y = elev[jj * nx + ii] * world.elevScale;
      const q = iso(x, y, z);
      if (i) ctx.lineTo(q[0], q[1]);
      else ctx.moveTo(q[0], q[1]);
    });
    ctx.stroke();
  }
  ctx.fillStyle = "#ffb020";
  (pack.nodes || []).forEach((n) => {
    if (L.nodes === false) return;
    const q = iso(n.x, n.y, n.z);
    ctx.fillRect(q[0] - 1.5, q[1] - 1.5, 3, 3);
  });
}

function decodeF32(b64) {
  if (!b64) return null;
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Float32Array(bytes.buffer);
}

export function buildSfxHtml(pack) {
  const payload = JSON.stringify({
    site: pack.site,
    code: pack.code,
    title: pack.title,
    bbox: pack.bbox,
    world: pack.world,
    nx: pack.nx,
    ny: pack.ny,
    zMin: pack.zMin,
    zMax: pack.zMax,
    elevB64: pack.elevB64,
    layers: pack.layers,
    tk: pack.tk,
    wx: pack.wx,
    nodes: pack.nodes,
    outline: pack.outline,
    wrl: pack.wrl,
    home: pack.home,
    at: pack.at,
  });
  const maps = CATALOG.map((c) => ({ id: c.id, label: c.label })).filter((c) => c.id);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>SITE-K SFX · ${pack.code}</title>
<style>
:root { --bg:#050806; --green:#7cff6b; --amber:#ffb020; --muted:#6d8a68; --text:#c8f5c0; --panel:#0a140c; }
html,body { margin:0; background:var(--bg); color:var(--text); font:13px/1.4 ui-monospace,Menlo,Consolas,monospace; }
header { display:flex; justify-content:space-between; align-items:center; padding:10px 14px; border-bottom:1px solid #2c4c30; background:linear-gradient(180deg,#1a3a22,#0d1c12); }
h1 { margin:0; font-size:13px; letter-spacing:.18em; color:var(--amber); }
.sub { color:var(--green); font-size:11px; }
main { display:grid; gap:10px; padding:12px; max-width:960px; margin:0 auto; }
.panel { background:var(--panel); border:1px solid #2c4c30; }
.panel h2 { margin:0; padding:6px 8px; font-size:10px; letter-spacing:.16em; color:var(--green); background:#122016; border-bottom:1px solid #2c4c30; }
.pad { padding:8px; }
.row { display:flex; flex-wrap:wrap; gap:6px; }
button, .btn { appearance:none; background:#122016; color:var(--green); border:1px solid #2c4c30; min-height:36px; padding:0 10px; letter-spacing:.1em; text-transform:uppercase; font:11px ui-monospace,monospace; cursor:pointer; text-decoration:none; display:inline-flex; align-items:center; }
button.hot, .btn.hot { color:var(--amber); border-color:#6a4a18; }
button.on { color:var(--amber); border-color:#6a4a18; background:#1a1408; }
.layers { display:grid; grid-template-columns:repeat(3,1fr); gap:4px; }
.layers label { display:flex; gap:6px; align-items:center; font-size:10px; letter-spacing:.08em; color:var(--muted); }
#view { width:100%; height:280px; display:block; background:#07110a; }
pre { margin:0; padding:8px; font-size:11px; color:var(--green); min-height:5em; white-space:pre-wrap; }
.muted { color:var(--muted); }
</style>
</head>
<body>
<header>
  <div><h1>SITE-K TERRAINK SFX</h1><div class="sub">SELF-EXTRACTING VRML · MAP + LAYER SELECTOR</div></div>
  <div class="sub" id="clock">EXTRACT</div>
</header>
<main>
  <section class="panel">
    <h2>MAP</h2>
    <div class="pad row" id="maps"></div>
  </section>
  <section class="panel">
    <h2>LAYERS</h2>
    <div class="pad layers" id="layers"></div>
  </section>
  <section class="panel">
    <h2>VRML VIEW · AUTOLOAD</h2>
    <canvas id="view" width="900" height="420"></canvas>
  </section>
  <section class="panel">
    <h2>INSTALLER</h2>
    <div class="pad row">
      <button type="button" class="hot" id="btnWrl">EXTRACT .WRL</button>
      <button type="button" id="btnSelf">DOWNLOAD THIS SFX</button>
      <a class="btn" id="btnHome" href="#">OPEN SITE-K</a>
    </div>
    <pre id="log"></pre>
  </section>
</main>
<script>
const PACK = ${payload};
const MAPS = ${JSON.stringify(maps)};
const LAYER_DEFS = ${JSON.stringify(VRML_LAYERS)};
function decodeF32(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Float32Array(bytes.buffer);
}
function log(msg) {
  const el = document.getElementById("log");
  el.textContent += msg + "\\n";
}
function layers() {
  const o = {};
  document.querySelectorAll("#layers [data-layer]").forEach((el) => { o[el.dataset.layer] = el.checked; });
  return o;
}
function paint() {
  const canvas = document.getElementById("view");
  const pack = Object.assign({}, PACK, { elev: decodeF32(PACK.elevB64) });
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  ctx.fillStyle = "#07110a"; ctx.fillRect(0,0,w,h);
  const elev = pack.elev, nx = pack.nx, ny = pack.ny, world = pack.world;
  const L = layers();
  const step = Math.max(1, Math.floor(Math.max(nx, ny) / 64));
  const scale = Math.min(w, h) / (world.w * 1.15);
  const cx = w * 0.5, cy = h * 0.62;
  const iso = (x,y,z) => [cx + (x - z) * 0.82 * scale, cy - (y * 1.15 + (x + z) * 0.42) * scale];
  const sample = (i,j) => {
    const x = (i / (nx - 1) - 0.5) * world.w;
    const z = (j / (ny - 1) - 0.5) * world.d;
    const y = elev[j * nx + i] * world.elevScale;
    return [x,y,z];
  };
  const hyp = (z) => {
    const t = (z - pack.zMin) / Math.max(1e-3, pack.zMax - pack.zMin);
    if (t < 0.2) return [20,70,40];
    if (t < 0.45) return [40,110,45];
    if (t < 0.7) return [90,120,40];
    if (t < 0.88) return [140,130,70];
    return [210,210,200];
  };
  if (L.terrain) {
    for (let j = 0; j < ny - step; j += step) {
      for (let i = 0; i < nx - step; i += step) {
        const a = sample(i,j), b = sample(i+step,j), c = sample(Math.min(nx-1,i+step), Math.min(ny-1,j+step));
        const pa = iso(a[0],a[1],a[2]), pb = iso(b[0],b[1],b[2]), pc = iso(c[0],c[1],c[2]);
        const rgb = hyp((a[1]+b[1]+c[1])/3 / world.elevScale);
        ctx.fillStyle = "rgb("+rgb[0]+","+rgb[1]+","+rgb[2]+")";
        ctx.beginPath(); ctx.moveTo(pa[0],pa[1]); ctx.lineTo(pb[0],pb[1]); ctx.lineTo(pc[0],pc[1]); ctx.closePath(); ctx.fill();
      }
    }
  }
  if (L.outline && pack.outline && pack.outline.length) {
    ctx.strokeStyle = "#c45a18"; ctx.lineWidth = 1.4; ctx.beginPath();
    pack.outline.forEach((p, i) => {
      const u = (p[0] - pack.bbox.minLon) / (pack.bbox.maxLon - pack.bbox.minLon);
      const v = (pack.bbox.maxLat - p[1]) / (pack.bbox.maxLat - pack.bbox.minLat);
      const x = (u - 0.5) * world.w, z = (v - 0.5) * world.d;
      const y = elev[Math.round(v*(ny-1)) * nx + Math.round(u*(nx-1))] * world.elevScale;
      const q = iso(x,y,z);
      if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]);
    });
    ctx.stroke();
  }
  if (L.nodes) {
    ctx.fillStyle = "#ffb020";
    (pack.nodes||[]).forEach((n) => { const q = iso(n.x,n.y,n.z); ctx.fillRect(q[0]-1.5,q[1]-1.5,3,3); });
  }
}
function download(name, text, mime) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: mime }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
function boot() {
  document.getElementById("btnHome").href = PACK.home || "./index.html";
  const maps = document.getElementById("maps");
  MAPS.forEach((m) => {
    const q = m.id === "stx" ? "" : ("?site=" + m.id);
    const a = document.createElement("a");
    a.className = "btn" + (m.id === PACK.site ? " on" : "");
    a.textContent = m.label;
    a.href = (PACK.home || "./index.html") + q + "#terrarium";
    maps.appendChild(a);
  });
  const host = document.getElementById("layers");
  LAYER_DEFS.forEach((l) => {
    const lab = document.createElement("label");
    lab.innerHTML = '<input type="checkbox" data-layer="'+l.id+'" '+(PACK.layers[l.id] !== false ? "checked" : "")+'/> '+l.label;
    host.appendChild(lab);
  });
  host.addEventListener("change", paint);
  document.getElementById("btnWrl").onclick = () => {
    download(PACK.site + "-terrarium.wrl", PACK.wrl, "model/vrml");
    log("wrote  " + PACK.site + "-terrarium.wrl  ·  VRML 2.0");
  };
  document.getElementById("btnSelf").onclick = () => {
    download(PACK.site + "-terraink-sfx.html", document.documentElement.outerHTML, "text/html");
    log("wrote  " + PACK.site + "-terraink-sfx.html  ·  this installer");
  };
  log("SITE-K SFX  extracting VRML…");
  log("mount  " + PACK.code + "  ·  " + PACK.title);
  log("mesh   " + PACK.nx + "×" + PACK.ny + "  " + PACK.zMin.toFixed(0) + "–" + PACK.zMax.toFixed(0) + " m");
  log("terraink  Δ" + (PACK.tk && PACK.tk.step) + "  " + (PACK.tk && PACK.tk.n) + " contours");
  log("weather  " + ((PACK.wx && PACK.wx.source) || "n/a") + "  " + ((PACK.wx && PACK.wx.tempF != null) ? PACK.wx.tempF.toFixed(0) + "°F" : ""));
  log("ready   EXTRACT writes the .wrl  ·  toggle layers redraws the view");
  paint();
}
boot();
</script>
</body>
</html>`;
}

function note(msg) {
  const el = $("sfxNote");
  if (el) el.textContent = msg;
}

let lastPack = null;
let ctx = null;

export function getLastPack() {
  return lastPack;
}

export function autoPack(source, layers) {
  if (!source?.geo || !source.dem) return null;
  lastPack = buildWorldPack({
    geo: source.geo,
    dem: source.dem,
    wx: typeof source.getWx === "function" ? source.getWx() : source.wx,
    nodes: typeof source.getNodes === "function" ? source.getNodes() : source.nodes || [],
    layers: layers || readLayers(),
  });
  lastPack.elev = decodeF32(lastPack.elevB64);
  const cv = $("sfxPrev");
  if (cv) paintIso(cv, lastPack, lastPack.layers);
  note(
    `TERRAINK SFX  ${lastPack.code}  ${lastPack.tk.lo.toFixed(0)}–${lastPack.tk.hi.toFixed(0)} m  Δ${lastPack.tk.step}  VRML ready`
  );
  if (typeof source.onPacked === "function") source.onPacked(lastPack);
  return lastPack;
}

export function downloadWrl(pack = lastPack) {
  if (!pack) return;
  downloadText(`${pack.site}-terrarium.wrl`, pack.wrl, "model/vrml");
}

export function downloadSfx(pack = lastPack) {
  if (!pack) return;
  downloadText(`${pack.site}-terraink-sfx.html`, buildSfxHtml(pack), "text/html");
}

export function bindSfxPanel(source) {
  ctx = source;
  const host = $("sfxMaps");
  if (host && !host.childElementCount) {
    const here = resolveSite();
    const mode = document.body.dataset.mode === "grid" ? "grid" : "terrarium";
    host.innerHTML = CATALOG.map((c) => {
      const q = c.id === "stx" ? "" : `?site=${c.id}`;
      return `<a class="${c.id === here ? "on" : ""}" href="./index.html${q}#${mode}">${c.label}</a>`;
    }).join("");
  }
  const layers = $("sfxLayers");
  if (layers && !layers.childElementCount) {
    layers.innerHTML = VRML_LAYERS.map(
      (l) =>
        `<label><input type="checkbox" data-layer="${l.id}" checked /> ${l.label}</label>`
    ).join("");
    layers.addEventListener("change", () => {
      const L = readLayers();
      if (lastPack) {
        lastPack.layers = L;
        paintIso($("sfxPrev"), lastPack, L);
      }
      source.onLayers?.(L);
      autoPack(source, L);
    });
  }
  $("btnSfxAuto")?.addEventListener("click", () => autoPack(source, readLayers()));
  $("btnSfxWrl")?.addEventListener("click", async () => {
    if (!lastPack) await autoPack(source, readLayers());
    downloadWrl();
    source.onLog?.("sys", `sfx  extract  ${lastPack.site}-terrarium.wrl`);
  });
  $("btnSfxHtml")?.addEventListener("click", async () => {
    if (!lastPack) await autoPack(source, readLayers());
    downloadSfx();
    source.onLog?.("sys", `sfx  installer  ${lastPack.site}-terraink-sfx.html`);
  });
  autoPack(source, readLayers());
}
