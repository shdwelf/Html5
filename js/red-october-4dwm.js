import * as THREE from "../vendor/three.module.min.js";
import { OrbitControls } from "../vendor/OrbitControls.js";
import { initPipWm } from "./project-y-4dwm.js";
import { BOATS, BOATS_BY_ID, STORYLINE, SOURCES, TIERS } from "./red-october-data.js";
import {
  HULL_FORM,
  hullSurface,
  hullProfile,
  siloGrid,
  pressureHulls,
  compartments,
  sectionAt,
} from "./red-october-geo.js";
import { allChecks } from "./red-october-checks.js";
import { boatToVrml } from "./red-october-vrml.js";

/* =========================================================================
   RED OCTOBER · CUTAWAY 4DWM

   Three hulls, one viewer. Every dimension comes from
   js/red-october-data.js and every mesh from js/red-october-geo.js, so the
   scene, the DK section and the exported .wrl are the same numbers.

   Scene convention: +X toward the bow, +Y up, +Z starboard, one unit = one
   metre. Nothing is scaled to fit the camera; the camera moves to the boat.

   View modes:
     RELIEF    opaque, lit
     SECTION   DK cutaway — a real clip plane at the centreline, port half
               shown, pressure hulls and silos inside
     X-RAY     everything translucent, internals visible through the hull
     WIRE      wireframe over the hull surface
     GHOST     the apparition: emissive translucent hull, no clip, slow bob
   ========================================================================= */

const $ = (id) => document.getElementById(id);
const KN = 0.514444;

const MODES = ["relief", "section", "xray", "wire", "ghost"];

const PALETTE = {
  hull: 0x6d777c,
  hullDark: 0x4a5257,
  pressure: 0xb99a48,
  silo: 0x5c808e,
  compartment: 0x3f7d86,
  sail: 0x78838a,
  fiction: 0xb48cff,
  label: "#e8e0cc",
  ghost: 0x63f5c0,
  ghostAlt: 0x8be9ff,
  sea: 0x08141c,
};

let renderer, scene, camera, controls, raycaster, pointer, clipPlane;
let boatGroup = null;
let boat = BOATS_BY_ID.typhoon;
let mode = "section";
let labelsOn = true;
let t = 1;
let clock = null;
let playing = false;
let pickables = [];
let fpsAcc = { n: 0, t0: 0, fps: 0 };
let wm = null;
let hudTimer = null;

/* ------------------------------------------------------------- materials */

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.62,
    metalness: opts.metalness ?? 0.34,
    transparent: Boolean(opts.transparent),
    opacity: opts.opacity ?? 1,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 1,
    side: opts.side ?? THREE.FrontSide,
    wireframe: Boolean(opts.wireframe),
    depthWrite: opts.depthWrite ?? true,
    clippingPlanes: opts.clip === false ? null : [clipPlane],
    clipShadows: true,
  });
}

/** Re-apply the current view mode to every material in the scene. */
function applyMode() {
  if (!boatGroup) return;
  const isSection = mode === "section";
  const isXray = mode === "xray";
  const isWire = mode === "wire";
  const isGhost = mode === "ghost";

  boatGroup.traverse((o) => {
    if (!o.isMesh || !o.material) return;
    const m = o.material;
    const role = o.userData.role || "hull";

    m.wireframe = isWire && role === "hull";
    m.clippingPlanes = isSection && o.userData.cuttable ? [clipPlane] : null;

    if (isGhost) {
      m.transparent = true;
      m.opacity = role === "hull" ? 0.22 : 0.85;
      m.emissive = new THREE.Color(role === "hull" ? PALETTE.ghost : PALETTE.ghostAlt);
      m.emissiveIntensity = role === "hull" ? 0.5 : 0.9;
      m.depthWrite = false;
    } else if (isXray) {
      m.transparent = true;
      m.opacity = role === "hull" ? 0.28 : role === "compartment" ? 0.16 : 0.9;
      m.emissive = new THREE.Color(role === "hull" ? 0x16323c : 0x000000);
      m.emissiveIntensity = 1;
      m.depthWrite = role !== "hull";
    } else if (isWire) {
      m.transparent = true;
      m.opacity = role === "hull" ? 0.9 : 0.35;
      m.emissive = new THREE.Color(0x000000);
      m.depthWrite = true;
    } else {
      // relief and section
      m.transparent = isSection && role === "hull";
      // In section the far hull wall is see-through so the pressure hull, silos
      // and compartments read against it; in relief the hull is solid.
      m.opacity = isSection && role === "hull" ? 0.42 : 1;
      m.emissive = new THREE.Color(0x000000);
      m.depthWrite = !(isSection && role === "hull");
    }
    m.needsUpdate = true;
  });

  // Re-frame so each mode presents its intended view (section side-on, relief
  // three-quarter). The user can still orbit freely afterwards.
  frameBoat();

  document.body.dataset.mode = mode;
  // Scoped to the mode switch: <body> itself carries data-mode for the CSS,
  // so an unscoped [data-mode] selector also binds the body as a button and
  // every click in the page silently resets the view mode.
  for (const b of document.querySelectorAll(".mode-switch [data-mode]")) {
    b.classList.toggle("active", b.dataset.mode === mode);
    b.setAttribute("aria-pressed", String(b.dataset.mode === mode));
  }
  announce(`${mode.toUpperCase()} · ${boat.name}`);
}

/* ------------------------------------------------------------ geometry */

function buildBoat(b) {
  const g = new THREE.Group();
  g.name = b.id;
  const form = HULL_FORM[b.id] || HULL_FORM.dallas;

  /* Light hull ---------------------------------------------------------- */
  const { positions, index } = hullSurface(b, 65, 40, form);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(index);
  geo.computeVertexNormals();
  const hull = new THREE.Mesh(geo, mat(PALETTE.hull, { side: THREE.DoubleSide }));
  hull.userData = { role: "hull", cuttable: true, pick: { kind: "hull", boat: b.id, label: `${b.name} — light hull` } };
  g.add(hull);

  /* Pressure hulls ------------------------------------------------------ */
  const ph = pressureHulls(b);
  const pr = b.dim.hullDiameter / 2;
  for (const h of ph) {
    const len = b.dim.loa * 0.9;
    const cg = new THREE.CylinderGeometry(pr, pr, len, 28, 1, true);
    const m = new THREE.Mesh(cg, mat(PALETTE.pressure, { side: THREE.DoubleSide }));
    m.rotation.z = Math.PI / 2;
    m.position.set(b.dim.loa / 2, 0, h.cx);
    m.userData = { role: "pressure", cuttable: true, pick: { kind: "pressure", label: `Pressure hull · Ø${b.dim.hullDiameter} m` } };
    g.add(m);
  }

  /* Missile silos ------------------------------------------------------- */
  const grid = siloGrid(b);
  if (grid.length) {
    const y = pr + 2.0;
    for (const s of grid) {
      const cg = new THREE.CylinderGeometry(s.r, s.r, 9, 20, 1, false);
      const m = new THREE.Mesh(cg, mat(PALETTE.silo));
      m.position.set(s.x, y, s.z);
      m.userData = { role: "silo", cuttable: true, pick: { kind: "silo", label: `Silo ${s.n} · R-39 · file ${s.row}` } };
      g.add(m);
    }
  }

  /* Compartments -------------------------------------------------------- */
  for (const c of compartments(b)) {
    const w = Math.max(0.05, c.x1 - c.x0);
    const h = Math.max(0.05, c.yTop - c.yBottom);
    if (c.tall) {
      // Sail: a faired block above the hull.
      const sg = new THREE.BoxGeometry(w, h * 0.55, b.dim.beam * 0.28);
      const sm = new THREE.Mesh(sg, mat(PALETTE.sail));
      sm.position.set((c.x0 + c.x1) / 2, pr + h * 0.28, 0);
      sm.userData = { role: "sail", cuttable: true, pick: { kind: "compartment", label: c.label, detail: `station ${(c.from * 100).toFixed(0)}–${(c.to * 100).toFixed(0)}% LOA` } };
      g.add(sm);
    } else {
      const bg = new THREE.BoxGeometry(w, h, b.dim.beam * 0.86);
      const bm = new THREE.Mesh(bg, mat(PALETTE.compartment, { transparent: true, opacity: 0.18, depthWrite: false }));
      bm.position.set((c.x0 + c.x1) / 2, (c.yTop + c.yBottom) / 2, 0);
      bm.userData = { role: "compartment", cuttable: false, pick: { kind: "compartment", label: c.label, detail: `${c.x0.toFixed(0)}–${c.x1.toFixed(0)} m from stern` } };
      g.add(bm);
    }
  }

  /* Fictional fit, drawn and labelled as fiction ------------------------ */
  for (const f of b.fiction || []) {
    const fg = new THREE.TorusGeometry(pr * 0.85, pr * 0.22, 12, 28);
    const fm = new THREE.Mesh(fg, mat(PALETTE.fiction, { emissive: PALETTE.fiction, emissiveIntensity: 0.6 }));
    fm.position.set(f.at * b.dim.loa, 0, 0);
    fm.rotation.y = Math.PI / 2;
    fm.userData = { role: "fiction", cuttable: true, pick: { kind: "fiction", label: f.label, detail: "Fiction — from the novel; no Project 941 boat carried this." } };
    g.add(fm);
  }

  /* Shafts and screws --------------------------------------------------- */
  const shafts = b.propulsion.shafts;
  for (let i = 0; i < shafts; i++) {
    const z = shafts === 1 ? 0 : (i === 0 ? -1 : 1) * b.dim.beam * 0.18;
    const sg = new THREE.CylinderGeometry(0.55, 0.55, b.dim.loa * 0.14, 12);
    const sm = new THREE.Mesh(sg, mat(0x8d9499));
    sm.rotation.z = Math.PI / 2;
    sm.position.set(b.dim.loa * 0.97, -pr * 0.5, z);
    sm.userData = { role: "shaft", cuttable: false };
    g.add(sm);

    const blades = 7;
    for (let k = 0; k < blades; k++) {
      const bg = new THREE.BoxGeometry(0.25, pr * 0.62, pr * 0.2);
      const bm = new THREE.Mesh(bg, mat(0xa9b1b6, { metalness: 0.7 }));
      const ang = (k / blades) * Math.PI * 2;
      bm.position.set(
        b.dim.loa * 1.03,
        -pr * 0.5 + Math.cos(ang) * pr * 0.55,
        z + Math.sin(ang) * pr * 0.55,
      );
      bm.rotation.x = ang;
      bm.rotation.z = 0.45;
      bm.userData = { role: "screw", cuttable: false, pick: { kind: "screw", label: `7-blade skewed screw · shaft ${i + 1}` } };
      g.add(bm);
    }
  }

  /* Centre the boat on the origin so orbiting feels like orbiting it ------ */
  g.position.x = -b.dim.loa / 2;

  return g;
}

function frameBoat() {
  const lo = boat.dim.loa;
  const sideOn = mode === "section" || mode === "xray";
  if (sideOn) {
    // The clip keeps the port half (z <= 0), so look down into the open half
    // from the starboard side: high enough to see the pressure hull, silo grid
    // and compartment boxes in the cavity, far enough to hold the whole boat.
    camera.position.set(lo * 0.5, lo * 0.3, lo * 0.5);
  } else {
    camera.position.set(lo * 0.58, boat.dim.beam * 1.5, lo * 0.62);
  }
  controls.target.set(0, 0, 0);
  camera.near = Math.max(0.5, lo / 400);
  camera.far = lo * 40;
  camera.updateProjectionMatrix();
  controls.update();
}

function selectBoat(id, { keepMode = true } = {}) {
  const next = BOATS_BY_ID[id];
  if (!next) return;
  boat = next;
  if (boatGroup) {
    scene.remove(boatGroup);
    boatGroup.traverse((o) => {
      if (o.isMesh) {
        o.geometry?.dispose();
        if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
        else o.material?.dispose();
      }
    });
  }
  boatGroup = buildBoat(boat);
  scene.add(boatGroup);
  pickables = [];
  boatGroup.traverse((o) => {
    if (o.isMesh && o.userData.pick) pickables.push(o);
  });
  if (!keepMode) mode = "section";
  frameBoat();
  applyMode();
  renderChecks();
  renderLayers();
  renderHullTable();
  const sh = $("statHull");
  if (sh) sh.textContent = `hull: ${boat.name}`;
  announce(`loaded ${boat.name} · ${boat.dim.loa} m · ${boat.dim.beam} m beam`);
}

/* --------------------------------------------------------------- labels */

const labelPool = [];
function syncLabels() {
  const host = $("labels");
  if (!host) return;
  if (!labelsOn || !boatGroup) {
    host.innerHTML = "";
    labelPool.length = 0;
    return;
  }
  const comps = compartments(boat);
  while (labelPool.length < comps.length) {
    const el = document.createElement("div");
    el.className = "lbl";
    host.appendChild(el);
    labelPool.push(el);
  }
  while (labelPool.length > comps.length) {
    const el = labelPool.pop();
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  const w = renderer.domElement.clientWidth;
  const h = renderer.domElement.clientHeight;
  const v = new THREE.Vector3();
  comps.forEach((c, i) => {
    const el = labelPool[i];
    v.set((c.x0 + c.x1) / 2 - boat.dim.loa / 2, c.yTop + 3, 0);
    v.project(camera);
    const behind = v.z > 1;
    const x = (v.x * 0.5 + 0.5) * w;
    const y = (-v.y * 0.5 + 0.5) * h;
    if (behind || x < -80 || x > w + 80 || y < -40 || y > h + 40) {
      el.style.display = "none";
      return;
    }
    el.style.display = "";
    el.style.transform = `translate(-50%,-50%) translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;
    el.textContent = c.label;
  });
}

/* --------------------------------------------------------------- panels */

function announce(msg) {
  const s = $("status");
  if (s) s.textContent = msg;
}

function renderChecks() {
  const host = $("checkList");
  if (!host) return;
  const list = allChecks().filter((c) => c.boat === null || c.boat === boat.id);
  host.innerHTML = list
    .map((c) => {
      const cls = c.ok ? "ok" : "bad";
      const kind = c.kind === "contradiction" ? " <em>contradiction</em>" : "";
      return `<div class="check ${cls}">
        <span class="dot"></span>
        <div>
          <b>${esc(c.label)}</b>${kind}
          <div class="tiny">${esc(c.actual)}</div>
          <div class="tiny dim">expects ${esc(c.expected)} · <span class="tier t-${c.tier}">${TIERS[c.tier]?.label || c.tier}</span></div>
        </div>
      </div>`;
    })
    .join("");
  const pass = list.filter((c) => c.ok).length;
  $("statChecks").textContent = `checks: ${pass}/${list.length}`;
}

function renderLayers() {
  const host = $("layerList");
  if (!host) return;
  const rows = [
    ["hull", "Light hull", boat.dim.beam.toFixed(1) + " m beam"],
    ["pressure", `Pressure hull ×${boat.dim.hullCount}`, `Ø${boat.dim.hullDiameter} m`],
    ["silo", "Missile silos", boat.armament.missiles ? `${boat.armament.missiles} × ${boat.armament.missile}` : "—"],
    ["compartment", "Compartments", String(boat.layout.length)],
    ["sail", "Sail", boat.layout.some((c) => c.tall) ? "fitted" : "—"],
    ["shaft", "Shaft line", `${boat.propulsion.shafts} × ${boat.propulsion.reactor}`],
    ["fiction", "Fictional fit", (boat.fiction || []).length ? boat.fiction[0].label : "none"],
  ];
  host.innerHTML = rows
    .map(
      ([k, label, val]) =>
        `<li class="legend-row" data-layer="${k}">
          <span class="swatch s-${k}"></span>
          <span class="lname">${esc(label)}</span>
          <span class="lval">${esc(val)}</span>
        </li>`,
    )
    .join("");
  host.querySelectorAll(".legend-row").forEach((el) => {
    el.addEventListener("click", () => {
      const role = el.dataset.layer;
      const anyHidden = [];
      boatGroup?.traverse((o) => {
        if (o.isMesh && o.userData.role === role) {
          o.visible = !o.visible;
          anyHidden.push(o.visible);
        }
      });
      el.classList.toggle("off", anyHidden.length > 0 && anyHidden.every((v) => !v));
    });
  });
}

function renderHullTable() {
  const host = $("hullTable");
  if (!host) return;
  const d = boat.dim;
  const tier = (k) => TIERS[boat.dimTier?.[k] || "community"]?.label || "community";
  const rows = [
    ["length OA", `${d.loa.toFixed(1)} m`, tier("loa")],
    ["beam", `${d.beam.toFixed(1)} m`, tier("beam")],
    ["draft", `${d.draft.toFixed(1)} m`, "community"],
    ["surfaced", `${d.dispSurfaced.toLocaleString()} t`, "community"],
    ["submerged", `${d.dispSubmerged.toLocaleString()} t`, "community"],
    ["pressure hull Ø", `${d.hullDiameter.toFixed(1)} m × ${d.hullCount}`, tier("hullDiameter")],
    ["test depth", `~${d.testDepth} m`, tier("testDepth")],
    ["plant", `${boat.propulsion.reactors} × ${boat.propulsion.reactor}`, "community"],
    ["shafts / power", `${boat.propulsion.shafts} · ${boat.propulsion.shaftPower.toLocaleString()} shp`, "community"],
    ["speed submerged", `${boat.propulsion.speedSubmerged} kn`, "community"],
    ["crew", boat.crewDetail || String(boat.crew), "community"],
    ["tubes", `${boat.armament.torpedoTubes} × ${boat.armament.torpedoCalibre}`, "community"],
  ];
  host.innerHTML = rows
    .map(([k, v, t]) => `<div class="kv-row"><dt>${esc(k)}</dt><dd>${esc(v)} <span class="tier t-${t}">${t}</span></dd></div>`)
    .join("");
}

function renderTimeline() {
  const host = $("jumpList");
  if (!host) return;
  host.innerHTML = STORYLINE.map(
    (s, i) =>
      `<button type="button" class="jump ${Math.abs(s.t - t) < 0.045 ? "active" : ""}" data-i="${i}">
        <span class="jday">${esc(s.day)}</span>
        <span class="jtitle">${esc(s.title)}</span>
      </button>`,
  ).join("");
  host.querySelectorAll(".jump").forEach((el) =>
    el.addEventListener("click", () => setT(STORYLINE[Number(el.dataset.i)].t)),
  );
}

function setT(v) {
  t = Math.max(0, Math.min(1, v));
  $("timeSlider").value = String(Math.round(t * 1000));
  const s = STORYLINE.reduce((a, b) => (Math.abs(b.t - t) < Math.abs(a.t - t) ? b : a));
  $("timeReadout").textContent = s.day;
  $("infoTitle").textContent = s.title;
  $("infoBody").innerHTML =
    `<p class="small">${esc(s.body)}</p>
     <div class="tiny dim"><span class="tier t-${s.tier}">${TIERS[s.tier]?.label || s.tier}</span>${
       s.boat ? ` · boat in frame: ${esc(BOATS_BY_ID[s.boat]?.name || s.boat)}` : ""
     }</div>
     <div class="tiny dim" style="margin-top:6px">The novel orders these events but dates none of them; days are ordinal from departure, not published dates.</div>`;
  renderTimeline();

  // The boat in frame follows the beat when the beat names one, so scrubbing
  // the timeline actually changes the model, not just the caption.
  if (s.boat && s.boat !== boat.id) selectBoat(s.boat);
  if (boatGroup) boatGroup.userData.beatTier = s.tier;
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ------------------------------------------------------------ VRML out */

function exportVrml() {
  const wrl = boatToVrml(boat, { cut: mode === "section", capStation: 0.5 });
  const blob = new Blob([wrl], { type: "model/vrml" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${boat.id}-dk-section.wrl`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => {
    try {
      URL.revokeObjectURL(a.href);
    } catch (_) {}
  }, 1500);
  announce(`wrote ${a.download} · ${wrl.length.toLocaleString()} bytes · cut=${mode === "section"}`);
}

/* ---------------------------------------------------------------- 4Dwm */

function initWm() {
  const cards = [
    ...BOATS.map((b) => ({ id: `boat:${b.id}`, kind: "boat", ref: b, title: b.name, sub: b.nato })),
    ...SOURCES.map((s) => ({ id: `src:${s.id}`, kind: "source", ref: s, title: s.label, sub: s.tier })),
  ];
  const byId = Object.fromEntries(cards.map((c) => [c.id, c]));

  wm = initPipWm({
    layer: $("pipLayer"),
    desk: $("wm4dDesk"),
    tray: $("wm4dTray"),
    status: $("wm4dStatus"),
    findRecord: (id) => byId[id]?.ref,
    titleFor: (r) => (r.nato ? `${r.name} · NATO ${r.nato}` : r.label),
    chipFor: (r) => ({ top: r.name || r.label, sub: r.nato || r.tier || "PIP" }),
    detailHtml: (r) =>
      r.nato
        ? `<div class="tiny">${esc(r.project)} · ${esc(r.role)}</div>
           <p class="small">${esc(r.notes)}</p>
           <div class="tiny dim">naming: ${esc(r.naming)}</div>`
        : `<div class="tiny"><span class="tier t-${r.tier}">${TIERS[r.tier]?.label || r.tier}</span></div>
           <p class="small">${esc(r.note)}</p>`,
    bindBody: (root, r) => {
      if (!r.nato) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pip-act";
      btn.textContent = "LOAD THIS BOAT";
      btn.addEventListener("click", () => selectBoat(r.id));
      root.appendChild(btn);
    },
    announce,
  });

  const host = $("cardList");
  if (host) {
    host.innerHTML = cards
      .map((c) => `<button type="button" class="card" data-id="${c.id}"><b>${esc(c.title)}</b><span>${esc(c.sub)}</span></button>`)
      .join("");
    host.querySelectorAll(".card").forEach((el) =>
      el.addEventListener("click", () => wm.spawn(el.dataset.id)),
    );
  }
  return wm;
}

/* ---------------------------------------------------------------- boot */

function init() {
  const canvas = $("stage");
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.localClippingEnabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(PALETTE.sea);
  scene.fog = new THREE.Fog(PALETTE.sea, 260, 1400);

  camera = new THREE.PerspectiveCamera(46, 1, 1, 6000);
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;

  // Clip at the centreline, keeping z <= 0 — the port half.
  clipPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);

  scene.add(new THREE.AmbientLight(0x9fb4c0, 0.85));
  const key = new THREE.DirectionalLight(0xffffff, 1.5);
  key.position.set(120, 180, 90);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x5cd6ff, 0.7);
  rim.position.set(-140, 40, -120);
  scene.add(rim);

  // Seabed grid, so the boat has something to sit above.
  const grid = new THREE.GridHelper(1200, 48, 0x1d3641, 0x14242c);
  grid.position.y = -70;
  scene.add(grid);

  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();
  clock = new THREE.Clock();

  selectBoat("typhoon");
  initWm();
  setT(1);
  bind();
  resize();
  renderer.setAnimationLoop(frame);
  $("statHull").textContent = `hull: ${boat.name}`;
  announce("boot · three hulls loaded");
}

function bind() {
  addEventListener("resize", resize);

  document.querySelectorAll("[data-boat]").forEach((b) =>
    b.addEventListener("click", () => {
      document.querySelectorAll("[data-boat]").forEach((x) => x.classList.toggle("active", x === b));
      selectBoat(b.dataset.boat);
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

  $("btnReset")?.addEventListener("click", () => frameBoat());
  $("btnVrml")?.addEventListener("click", exportVrml);

  $("timeSlider")?.addEventListener("input", (e) => setT(Number(e.target.value) / 1000));
  $("btnPlay")?.addEventListener("click", () => {
    playing = !playing;
    $("btnPlay").textContent = playing ? "❚❚" : "▶";
  });
  $("btnSpeed")?.addEventListener("click", () => {
    const rates = [0.5, 1, 2, 4];
    const cur = Number($("btnSpeed").dataset.rate || 1);
    const next = rates[(rates.indexOf(cur) + 1) % rates.length];
    $("btnSpeed").dataset.rate = String(next);
    $("btnSpeed").textContent = `${next}×`;
  });

  $("cutSlider")?.addEventListener("input", (e) => {
    // Slide the clip plane across the beam to walk the section along it.
    const v = (Number(e.target.value) - 50) / 50; // -1..1
    clipPlane.constant = v * (boat.dim.beam / 2);
    $("cutVal").textContent = `${(v * (boat.dim.beam / 2)).toFixed(1)} m`;
  });

  renderer.domElement.addEventListener("pointerdown", (ev) => {
    const r = renderer.domElement.getBoundingClientRect();
    pointer.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(pickables, false)[0];
    if (!hit) return;
    const p = hit.object.userData.pick;
    if (!p) return;
    $("infoTitle").textContent = p.label;
    $("infoBody").innerHTML =
      `<div class="tiny dim">${esc(p.detail || "")}</div>
       <div class="tiny dim" style="margin-top:6px">picked at ${hit.point.x.toFixed(1)}, ${hit.point.y.toFixed(1)}, ${hit.point.z.toFixed(1)} m</div>`;
  });
}

function resize() {
  const w = innerWidth;
  const h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

function frame() {
  const dt = clock.getDelta();
  if (playing) {
    const rate = Number($("btnSpeed")?.dataset.rate || 1);
    setT(t + dt * 0.06 * rate);
    if (t >= 0.999) playing = false, ($("btnPlay").textContent = "▶");
  }

  // GHOST: the apparition floats. Everything else holds station.
  if (boatGroup) {
    if (mode === "ghost") {
      const el = clock.elapsedTime;
      boatGroup.position.y = Math.sin(el * 0.6) * 6;
      boatGroup.rotation.z = Math.sin(el * 0.33) * 0.045;
      boatGroup.rotation.y = Math.sin(el * 0.21) * 0.03;
    } else {
      boatGroup.position.y += (0 - boatGroup.position.y) * Math.min(1, dt * 4);
      boatGroup.rotation.z += (0 - boatGroup.rotation.z) * Math.min(1, dt * 4);
      boatGroup.rotation.y += (0 - boatGroup.rotation.y) * Math.min(1, dt * 4);
    }
  }

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
    if (h) h.textContent = `${fpsAcc.fps} fps · ${pickables.length} pickable`;
  }
}

init();

export { init, selectBoat, applyMode, setT, exportVrml, MODES };
