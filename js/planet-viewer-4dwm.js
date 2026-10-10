import * as THREE from "../vendor/three.module.min.js";
import { OrbitControls } from "../vendor/OrbitControls.js";
import { initPipWm } from "./project-y-4dwm.js";
import { hypsometric, sampleDem } from "./cheyenne-dem.js";
import { makeGazetteerIndex, searchName, searchBox } from "./city-gazetteer.js";
import { GAZ_ROWS as atl } from "./city-gazetteer-data-atlanta.js";
import { GAZ_ROWS as buf } from "./city-gazetteer-data-buffalo.js";
import { GAZ_ROWS as ksc } from "./city-gazetteer-data-kansascity.js";
import { GAZ_ROWS as law } from "./city-gazetteer-data-lawrence.js";
import { GAZ_ROWS as tor } from "./city-gazetteer-data-toronto.js";
import { demToVrml, downloadText } from "./vrml-export.js";
import { buildPlates, PLATE_ORDER } from "./planet-viewer-data.js";
import { runChecks } from "./planet-viewer-checks.js";

/* =========================================================================
   PLANET VIEWER · 4DWM

   USGS 3DEP terrain, drawn three ways, over an offline USGS GNIS gazetteer.
   One scene unit = one kilometre horizontally; vertical is the same scale
   times the exaggeration slider, so relief is never faked by a hidden scale.

   Modes:
     RELIEF  hypsometric vertex-coloured surface, lit
     WIRE    wireframe over the same grid
     XRAY    translucent surface + contour lattice so the terrain reads as
             structure, like an x-ray plate
   Labels project the packed GNIS points that fall inside the plate bbox.
   VRML export goes through js/vrml-export.js (the terrarium writer).
   ========================================================================= */

const $ = (id) => document.getElementById(id);

let renderer, scene, camera, controls, raycaster, pointer;
let plates = null;
let plate = null;
let terrainGroup = null;
let labelMarkers = [];
let mode = "relief";
let labelsOn = true;
let exag = 3;
let wm = null;
let gazIndex = null;
let fpsAcc = { n: 0, t0: 0, fps: 0 };

const COL = { sky: 0x0a1016, contour: 0x5cd6ff, marker: 0xffb020 };

/* -------------------------------------------------------------- terrain */

function buildTerrain(p) {
  const g = new THREE.Group();
  const { nx, ny, elev, min } = p.grid;
  const { w, d } = p.world;
  const scale = exag / 1000;

  const pos = new Float32Array(nx * ny * 3);
  const col = new Float32Array(nx * ny * 3);
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const k = j * nx + i;
      const m = elev[k];
      pos[k * 3] = (i / (nx - 1) - 0.5) * w;
      pos[k * 3 + 1] = (m - min) * scale;
      pos[k * 3 + 2] = (j / (ny - 1) - 0.5) * d;
      const c = hypsometric(m);
      col[k * 3] = c[0];
      col[k * 3 + 1] = c[1];
      col[k * 3 + 2] = c[2];
    }
  }
  const index = [];
  for (let j = 0; j < ny - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const a = j * nx + i;
      const b = a + 1;
      const c = a + nx;
      const dd = c + 1;
      index.push(a, c, b, b, c, dd);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  geo.setIndex(index);
  geo.computeVertexNormals();

  const surface = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0.02, side: THREE.DoubleSide }),
  );
  surface.userData.role = "surface";
  g.add(surface);

  const wire = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x2b4a5a, wireframe: true, transparent: true, opacity: 0.5 }));
  wire.userData.role = "wire";
  wire.visible = false;
  g.add(wire);

  const contours = buildContours(p, scale);
  contours.userData.role = "contour";
  contours.visible = false;
  g.add(contours);

  // GNIS markers in the plate bbox.
  labelMarkers = [];
  const [bw, bs, be, bn] = p.grid.bbox;
  const inBox = searchBox(gazIndex, { lat0: bs, lat1: bn, lon0: bw, lon1: be }, { limit: 60 });
  for (const r of inBox) {
    const m = sampleDem(p.grid, r.lon, r.lat);
    const x = ((r.lon - bw) / (be - bw) - 0.5) * w;
    const z = ((r.lat - bs) / (bn - bs) - 0.5) * d;
    const y = (m - min) * scale;
    const mg = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.6, 4), new THREE.MeshBasicMaterial({ color: COL.marker }));
    mg.position.set(x, y + 0.8, z);
    mg.userData.pick = { kind: "gnis", label: r.name, detail: `${r.fclass} · ${r.lat.toFixed(4)}, ${r.lon.toFixed(4)}` };
    g.add(mg);
    labelMarkers.push({ el: null, v: new THREE.Vector3(x, y + 1.9, z), text: r.name });
  }

  return g;
}

/** Contour lattice for X-RAY: segments where each elevation band crosses. */
function buildContours(p, scale) {
  const { nx, ny, elev, min, max } = p.grid;
  const { w, d } = p.world;
  const bands = 6;
  const pts = [];
  for (let b = 1; b < bands; b++) {
    const level = min + ((max - min) * b) / bands;
    for (let j = 0; j < ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        const e00 = elev[j * nx + i];
        const e10 = elev[j * nx + i + 1];
        const e01 = elev[(j + 1) * nx + i];
        const crosses = (e00 - level) * (e10 - level) < 0 || (e00 - level) * (e01 - level) < 0;
        if (!crosses) continue;
        pts.push(
          (i / (nx - 1) - 0.5) * w, (level - min) * scale, (j / (ny - 1) - 0.5) * d,
          ((i + 1) / (nx - 1) - 0.5) * w, (level - min) * scale, ((j + 1) / (ny - 1) - 0.5) * d,
        );
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pts), 3));
  return new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: COL.contour, transparent: true, opacity: 0.7 }));
}

function applyMode() {
  if (!terrainGroup) return;
  terrainGroup.traverse((o) => {
    if (!o.userData.role) return;
    if (o.userData.role === "surface") {
      o.visible = true;
      o.material.wireframe = mode === "wire";
      o.material.transparent = mode === "xray";
      o.material.opacity = mode === "xray" ? 0.35 : 1;
      o.material.vertexColors = mode !== "wire";
      o.material.color.set(mode === "wire" ? 0x3f7d86 : 0xffffff);
      o.material.depthWrite = mode !== "xray";
      o.material.needsUpdate = true;
    } else if (o.userData.role === "wire") {
      o.visible = mode !== "relief";
    } else if (o.userData.role === "contour") {
      o.visible = mode === "xray";
    }
  });
  document.body.dataset.mode = mode;
  for (const b of document.querySelectorAll(".mode-switch [data-mode]")) {
    b.classList.toggle("active", b.dataset.mode === mode);
    b.setAttribute("aria-pressed", String(b.dataset.mode === mode));
  }
  announce(`${mode.toUpperCase()} · ${plate.name}`);
}

function selectPlate(id) {
  const next = plates[id];
  if (!next) return;
  plate = next;
  if (terrainGroup) {
    scene.remove(terrainGroup);
    terrainGroup.traverse((o) => {
      if (o.isMesh || o.isLineSegments) {
        o.geometry?.dispose();
        if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
        else o.material?.dispose();
      }
    });
  }
  terrainGroup = buildTerrain(plate);
  scene.add(terrainGroup);
  frame();
  applyMode();
  renderChecks();
  renderLayers();
  const sh = $("statPlate");
  if (sh) sh.textContent = `plate: ${plate.id}`;
  announce(`loaded ${plate.name} · ${plate.grid.nx}×${plate.grid.ny} · relief ${(plate.grid.max - plate.grid.min).toFixed(0)} m`);
}

function frame() {
  const { w, d } = plate.world;
  camera.position.set(w * 0.5, w * 0.55, d * 0.85);
  controls.target.set(0, 0, 0);
  camera.near = 0.1;
  camera.far = w * 40;
  camera.updateProjectionMatrix();
  controls.update();
}

/* --------------------------------------------------------------- panels */

function announce(msg) {
  const s = $("status");
  if (s) s.textContent = msg;
}
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function renderChecks() {
  const host = $("checkList");
  if (!host) return;
  const list = runChecks(plates).filter((c) => c.plate === null || c.plate === plate.id);
  host.innerHTML = list
    .map(
      (c) => `<div class="check ${c.ok ? "ok" : "bad"}"><span class="dot"></span><div>
      <b>${esc(c.label)}</b>${c.kind === "contradiction" ? " <em>contradiction</em>" : ""}
      <div class="tiny">${esc(c.actual)}</div>
      <div class="tiny dim">expects ${esc(c.expected)}</div></div></div>`,
    )
    .join("");
  const pass = list.filter((c) => c.ok).length;
  $("statChecks").textContent = `checks: ${pass}/${list.length}`;
}

function renderLayers() {
  const host = $("layerList");
  if (!host) return;
  const [bw, bs, be, bn] = plate.grid.bbox;
  const inBox = searchBox(gazIndex, { lat0: bs, lat1: bn, lon0: bw, lon1: be }, { limit: 60 });
  const rows = [
    ["surface", "Hypsometric surface", `${plate.grid.nx}×${plate.grid.ny}`],
    ["wire", "Wireframe lattice", mode === "wire" ? "on" : "off"],
    ["contour", "Contour bands (x-ray)", "6"],
    ["gnis", "GNIS markers", String(inBox.length)],
  ];
  host.innerHTML = rows
    .map(
      ([k, label, val]) =>
        `<li class="legend-row" data-layer="${k}"><span class="swatch s-${k}"></span><span class="lname">${esc(label)}</span><span class="lval">${esc(val)}</span></li>`,
    )
    .join("");
}

/* ------------------------------------------------------------- VRML out */

function exportVrml() {
  const wrl = demToVrml(plate.grid, { w: plate.world.w, d: plate.world.d, elevScale: exag / 1000 }, null, `Planet viewer — ${plate.name}`, {
    layers: { weather: false, glass: false },
  });
  downloadText(`${plate.id}-planet.wrl`, wrl);
  announce(`wrote ${plate.id}-planet.wrl · ${wrl.length.toLocaleString()} bytes`);
}

/* ------------------------------------------------------------- labels */

function syncLabels() {
  const host = $("labels");
  if (!host) return;
  if (!labelsOn || !terrainGroup) {
    host.innerHTML = "";
    labelMarkers.forEach((m) => (m.el = null));
    return;
  }
  const w = renderer.domElement.clientWidth;
  const h = renderer.domElement.clientHeight;
  for (const m of labelMarkers) {
    if (!m.el) {
      m.el = document.createElement("div");
      m.el.className = "lbl";
      host.appendChild(m.el);
    }
    const v = m.v.clone().project(camera);
    const x = (v.x * 0.5 + 0.5) * w;
    const y = (-v.y * 0.5 + 0.5) * h;
    if (v.z > 1 || x < -60 || x > w + 60 || y < -40 || y > h + 40) {
      m.el.style.display = "none";
      continue;
    }
    m.el.style.display = "";
    m.el.style.transform = `translate(-50%,-50%) translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;
    m.el.textContent = m.text;
  }
}

/* ------------------------------------------------------------- search */

function doSearch(q) {
  const host = $("searchResults");
  if (!q || q.length < 2) {
    host.innerHTML = "";
    return;
  }
  const hits = searchName(gazIndex, q, { limit: 8 });
  host.innerHTML = hits.length
    ? hits.map((r) => `<button type="button" class="res" data-lat="${r.lat}" data-lon="${r.lon}" data-name="${esc(r.name)}">${esc(r.name)} <span>${esc(r.fclass)}</span></button>`).join("")
    : `<div class="tiny dim">no packed GNIS match — the offline subset covers five cities</div>`;
  host.querySelectorAll(".res").forEach((b) =>
    b.addEventListener("click", () => {
      const lat = Number(b.dataset.lat);
      const lon = Number(b.dataset.lon);
      const [bw, bs, be, bn] = plate.grid.bbox;
      if (lat >= bs && lat <= bn && lon >= bw && lon <= be) {
        const { w, d } = plate.world;
        controls.target.set(((lon - bw) / (be - bw) - 0.5) * w, 0, ((lat - bs) / (bn - bs) - 0.5) * d);
      }
      announce(`→ ${b.dataset.name}`);
    }),
  );
}

/* ------------------------------------------------------------- 4Dwm */

function initWm() {
  const cards = [
    ...PLATE_ORDER.map((id) => ({ id: `plate:${id}`, ref: plates[id] })),
    { id: "src-dem", ref: { id: "src-dem", label: "USGS 3DEP control points (NAVD 88)", tier: "official", note: "Committed control sets, Shepard-interpolated; grain between samples is disclosed texture, not data. This sandbox cannot reach USGS endpoints, so no live fetch." } },
    { id: "src-gnis", ref: { id: "src-gnis", label: "USGS GNIS offline subset (5 cities)", tier: "official", note: "ADL GSP-flavoured gazetteer ops reimplemented client-side; trigram similarity. Only packed cities have points — mountain plates legitimately show none." } },
  ];
  const byId = Object.fromEntries(cards.map((c) => [c.id, c.ref]));
  wm = initPipWm({
    layer: $("pipLayer"),
    desk: $("wm4dDesk"),
    tray: $("wm4dTray"),
    status: $("wm4dStatus"),
    findRecord: (id) => byId[id],
    titleFor: (r) => r.name || r.label,
    chipFor: (r) => ({ top: r.name || r.label, sub: r.id || r.tier }),
    detailHtml: (r) =>
      r.grid
        ? `<div class="tiny">${esc(r.meta.plateSource || r.meta.source || "")}</div><p class="small">relief ${(r.grid.max - r.grid.min).toFixed(0)} m · ${r.grid.nx}×${r.grid.ny} · datum ${esc(r.meta.verticalDatum || "NAVD 88")}</p>`
        : `<div class="tiny"><span class="tier t-${r.tier}">${r.tier}</span></div><p class="small">${esc(r.note)}</p>`,
    bindBody: (root, r) => {
      if (!r.grid) return;
      const btn = document.createElement("button");
      btn.className = "pip-act";
      btn.type = "button";
      btn.textContent = "LOAD THIS PLATE";
      btn.addEventListener("click", () => selectPlate(r.id));
      root.appendChild(btn);
    },
    announce,
  });
  const host = $("cardList");
  if (host) {
    host.innerHTML = cards
      .map((c) => `<button type="button" class="card" data-id="${c.id}"><b>${esc(c.ref.name || c.ref.label)}</b><span>${esc(c.ref.id || c.ref.tier)}</span></button>`)
      .join("");
    host.querySelectorAll(".card").forEach((el) => el.addEventListener("click", () => wm.spawn(el.dataset.id)));
  }
}

/* ------------------------------------------------------------- boot */

function bind() {
  addEventListener("resize", () => {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  });

  document.querySelectorAll("[data-plate]").forEach((b) =>
    b.addEventListener("click", () => {
      document.querySelectorAll("[data-plate]").forEach((x) => x.classList.toggle("active", x === b));
      selectPlate(b.dataset.plate);
    }),
  );
  document.querySelectorAll(".mode-switch [data-mode]").forEach((b) =>
    b.addEventListener("click", () => {
      mode = b.dataset.mode;
      applyMode();
    }),
  );
  $("btnLabels")?.addEventListener("click", () => {
    labelsOn = !labelsOn;
    $("btnLabels").classList.toggle("active", labelsOn);
    $("btnLabels").setAttribute("aria-pressed", String(labelsOn));
    syncLabels();
  });
  $("btnReset")?.addEventListener("click", frame);
  $("btnVrml")?.addEventListener("click", exportVrml);
  $("vertExag")?.addEventListener("input", (e) => {
    exag = Number(e.target.value);
    $("vertExagVal").textContent = `${exag}×`;
    selectPlate(plate.id);
  });
  $("searchBox")?.addEventListener("input", (e) => doSearch(e.target.value.trim()));

  renderer.domElement.addEventListener("pointerdown", (ev) => {
    const r = renderer.domElement.getBoundingClientRect();
    pointer.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(terrainGroup.children.filter((o) => o.userData.pick), false)[0];
    if (!hit) return;
    $("infoTitle").textContent = hit.object.userData.pick.label;
    $("infoBody").innerHTML = `<div class="tiny dim">${esc(hit.object.userData.pick.detail)}</div>`;
  });
}

function init() {
  gazIndex = makeGazetteerIndex([...atl, ...buf, ...ksc, ...law, ...tor]);
  plates = buildPlates(140, 100);

  const canvas = $("stage");
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  scene = new THREE.Scene();
  scene.background = new THREE.Color(COL.sky);
  camera = new THREE.PerspectiveCamera(46, 1, 0.1, 6000);
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  scene.add(new THREE.AmbientLight(0xbfd4dd, 0.8));
  const sun = new THREE.DirectionalLight(0xfff2dd, 1.6);
  sun.position.set(80, 140, 40);
  scene.add(sun);

  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();

  selectPlate("chey");
  initWm();
  bind();
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setAnimationLoop(() => {
    controls.update();
    renderer.render(scene, camera);
    syncLabels();
    fpsAcc.n++;
    const now = performance.now();
    if (!fpsAcc.t0) fpsAcc.t0 = now;
    if (now - fpsAcc.t0 >= 1000) {
      fpsAcc.fps = Math.round((fpsAcc.n * 1000) / (now - fpsAcc.t0));
      fpsAcc.n = 0;
      fpsAcc.t0 = now;
      const h = $("hudFps");
      if (h) h.textContent = `${fpsAcc.fps} fps`;
    }
  });
  announce("boot · three USGS 3DEP plates loaded");
}

init();
export { init, selectPlate, applyMode, exportVrml };
