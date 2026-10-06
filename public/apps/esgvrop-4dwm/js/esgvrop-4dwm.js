/**
 * ESGVROP 4Dwm — the two campuses of the first boss, as a deep-dive viewer.
 *
 * East San Gabriel Valley ROP & Technical Center: the Del Norte Campus in
 * West Covina and the Sunflower Campus in Glendora, built as schematic
 * dioramas from the archived record (esgvrop.org via the Wayback Machine),
 * with the people of the 2001–03 register as evidence-tiered pips.
 *
 * Addresses and staff are from the archived key-contacts page
 * (20031218202338) and the 2002–03 class schedule (20030318004815);
 * footprints are schematic, not surveys.
 */

import * as THREE from "../vendor/three.module.min.js";
import { OrbitControls } from "../vendor/OrbitControls.js";

const $ = (id) => document.getElementById(id);

/* ------------------------------------------------------------------ stage */

const canvas = $("stage");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x04070c);
scene.fog = new THREE.Fog(0x04070c, 30, 110);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

const camera = new THREE.PerspectiveCamera(46, 1, 0.05, 400);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI * 0.495;

if (!(canvas.getContext("webgl2") || canvas.getContext("webgl"))) {
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#04070c";
    ctx.fillRect(0, 0, canvas.width || 900, canvas.height || 600);
    ctx.fillStyle = "#cfe8ff";
    ctx.font = "14px ui-monospace, monospace";
    ctx.fillText("WebGL required for the ESGVROP 4Dwm viewer", 24, 44);
  }
  throw new Error("WebGL unavailable — ESGVROP viewer halted.");
}

/* Stage floor — the map table the two dioramas sit on. */
{
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(34, 22).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x081019, roughness: 0.98 })
  );
  floor.position.y = -0.03;
  scene.add(floor);
  const grid = new THREE.GridHelper(34, 17, 0x14222f, 0x0e1822);
  grid.position.y = -0.02;
  grid.scale.z = 22 / 34;
  scene.add(grid);
}

scene.add(new THREE.AmbientLight(0x93a8c4, 0.92));
const sun = new THREE.DirectionalLight(0xfff2dc, 1.1);
sun.position.set(7, 10, 5);
scene.add(sun);
const rim = new THREE.DirectionalLight(0x5cd6ff, 0.3);
rim.position.set(-8, 5, -7);
scene.add(rim);

/* -------------------------------------------------------------- constants */

const TIER_COLOR = { official: "#ffb020", community: "#5cd6ff", context: "#b48cff", memory: "#ff6ec7" };

const M_PER_UNIT = 50; // diorama scale

/** Diorama placement on the shared stage (scene units). */
const SITES = {
  delnorte: { center: new THREE.Vector3(-6.2, 0, 1.2), label: "DEL NORTE CAMPUS · WEST COVINA" },
  sunflower: { center: new THREE.Vector3(5.6, 0, -1.4), label: "SUNFLOWER CAMPUS · GLENDORA" },
};

const PICKABLE = [];
const labelHost = $("labels");
const labelEls = new Map();

function addLabel(id, text, tier, pos) {
  let el = labelEls.get(id);
  if (!el) {
    el = document.createElement("span");
    el.className = `label tier-${tier}`;
    el.textContent = text;
    labelHost.appendChild(el);
    labelEls.set(id, el);
  }
  el._pos = pos.clone();
}

/* ------------------------------------------------------------ dioramas */

function groundPlate(site, wMetres, dMetres) {
  const geo = new THREE.PlaneGeometry(wMetres / M_PER_UNIT, dMetres / M_PER_UNIT);
  geo.rotateX(-Math.PI / 2);
  const plate = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ color: 0x101a24, roughness: 0.95 })
  );
  plate.position.copy(site.center);
  plate.position.y = -0.01;
  scene.add(plate);
  const edge = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.PlaneGeometry(wMetres / M_PER_UNIT, dMetres / M_PER_UNIT).rotateX(-Math.PI / 2)),
    new THREE.LineBasicMaterial({ color: 0x2b4258 })
  );
  edge.position.copy(plate.position);
  edge.position.y = 0.002;
  scene.add(edge);
}

/**
 * Building block on a diorama. `local` = {x, z} in metres from the diorama
 * center (+x east, +z south), `w`/`d`/`h` in metres.
 */
function block(site, local, w, d, h, color, record) {
  const geo = new THREE.BoxGeometry(w / M_PER_UNIT, h / M_PER_UNIT, d / M_PER_UNIT);
  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.04 })
  );
  mesh.position.set(
    site.center.x + local.x / M_PER_UNIT,
    (h / M_PER_UNIT) / 2,
    site.center.z + local.z / M_PER_UNIT
  );
  mesh.userData.pick = record;
  scene.add(mesh);
  PICKABLE.push(mesh);
  return mesh;
}

function flatPad(site, local, w, d, color, record) {
  const geo = new THREE.PlaneGeometry(w / M_PER_UNIT, d / M_PER_UNIT);
  geo.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ color, roughness: 0.96, side: THREE.DoubleSide })
  );
  mesh.position.set(site.center.x + local.x / M_PER_UNIT, 0.015, site.center.z + local.z / M_PER_UNIT);
  mesh.userData.pick = record;
  scene.add(mesh);
  PICKABLE.push(mesh);
}

function streetLine(site, pointsLocal, label) {
  const pts = pointsLocal.map(
    (p) => new THREE.Vector3(site.center.x + p[0] / M_PER_UNIT, 0.02, site.center.z + p[1] / M_PER_UNIT)
  );
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color: 0x44586c })
  );
  line.userData.pick = { label, tier: "context", note: "Schematic street trace." };
  scene.add(line);
  PICKABLE.push(line);
  return line;
}

const SAND = 0xc7a06a, SAND2 = 0xb08a58, WARM = 0xd9b96c, SLATE = 0x39424e, GREEN = 0x2f4a3a;

/* ---------------- Del Norte Campus, 1501 W. Del Norte Ave, West Covina ---- */

groundPlate(SITES.delnorte, 240, 200);

block(SITES.delnorte, { x: -10, z: -8 }, 120, 30, 7, SAND, {
  label: "Main Instructional Building — rooms 6 · 8 · 9 · 10 · 14 · 21",
  tier: "official",
  note:
    "The 2002–03 archived class schedule routes classes through Del Norte rooms 6, 8, 9, 10, 14 and 21. Footprint schematic; room numbering per the archived schedule (20030318004815).",
});
block(SITES.delnorte, { x: 58, z: -8 }, 22, 16, 4.5, WARM, {
  label: "Marketing Classroom",
  tier: "official",
  note: "Listed separately on the 2002–03 schedule alongside the numbered rooms.",
});
block(SITES.delnorte, { x: -10, z: 30 }, 46, 18, 5.5, SAND2, {
  label: "Administration / Central Office",
  tier: "official",
  note:
    "1501 W. Del Norte Ave, West Covina 91790 · (626) 962-5080. Dr. Laurel Adler, Superintendent; Donna Schwan, Del Norte site supervisor — per the archived key-contacts page (Dec 2003 capture).",
});
block(SITES.delnorte, { x: -52, z: 22 }, 26, 16, 4.5, SAND2, {
  label: "Annex wing",
  tier: "context",
  note:
    "Schematic annex. The archived register lists Ryan Quesenberry as Project Facilitator-Technology, rquesenberry@esgvrop.org — the technology post of the summer-2001 job.",
});
flatPad(SITES.delnorte, { x: -10, z: 62 }, 130, 34, SLATE, {
  label: "Staff & visitor parking",
  tier: "context",
  note: "Schematic pad off W. Del Norte Avenue.",
});
streetLine(SITES.delnorte, [[-130, 92], [130, 92]], "W. Del Norte Avenue");
addLabel("delnorte-title", "DEL NORTE CAMPUS", "official", SITES.delnorte.center.clone().add(new THREE.Vector3(0, 0.9, 1.9)));

/* ---------------- Sunflower Campus, 1505 S. Sunflower Ave, Glendora ------ */

groundPlate(SITES.sunflower, 220, 180);

block(SITES.sunflower, { x: -34, z: -14 }, 36, 16, 5, SAND, {
  label: "Wing A — Room A2",
  tier: "official",
  note: "Sunflower rooms A2, E2 and H2 carry the 2002–03 schedule classes (Medical Assistant, Retail, Health Information tracks).",
});
block(SITES.sunflower, { x: -34, z: 14 }, 36, 16, 5, SAND, {
  label: "Wing E — Room E2",
  tier: "official",
  note: "Sunflower rooms A2, E2 and H2 per the archived 2002–03 class schedule.",
});
block(SITES.sunflower, { x: 18, z: -14 }, 36, 16, 5, SAND, {
  label: "Wing H — Room H2",
  tier: "official",
  note: "Sunflower rooms A2, E2 and H2 per the archived 2002–03 class schedule.",
});
block(SITES.sunflower, { x: 18, z: 14 }, 28, 15, 4.5, SAND2, {
  label: "Site Office — Colleen Crawford",
  tier: "official",
  note:
    "1505 S. Sunflower Ave, Glendora 91740 · (626) 335-5350. Colleen Crawford, Sunflower site supervisor — per the archived key-contacts page (Dec 2003 capture).",
});
flatPad(SITES.sunflower, { x: -8, z: 44 }, 100, 28, SLATE, {
  label: "Parking",
  tier: "context",
  note: "Schematic pad off S. Sunflower Avenue.",
});
streetLine(SITES.sunflower, [[-108, -80], [-108, 80]], "S. Sunflower Avenue");
addLabel("sunflower-title", "SUNFLOWER CAMPUS", "official", SITES.sunflower.center.clone().add(new THREE.Vector3(0, 0.9, 1.75)));

/* ---------------- The commute corridor between the campuses ------------- */

{
  const a = SITES.delnorte.center.clone().add(new THREE.Vector3(1.4, 0.03, 0));
  const b = SITES.sunflower.center.clone().add(new THREE.Vector3(-1.4, 0.03, 0));
  const mid = a.clone().lerp(b, 0.5);
  const corridor = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([a, b]),
    new THREE.LineDashedMaterial({ color: 0x5cd6ff, dashSize: 0.22, gapSize: 0.14 })
  );
  corridor.computeLineDistances();
  corridor.userData.pick = {
    label: "The summer commute — Del Norte ↔ Sunflower ↔ Glendora",
    tier: "memory",
    note:
      "Geocodes put the campuses ≈9.3 km apart across the San Gabriel Valley floor (34.0766, -117.9372 → 34.1133, -117.8465). The route itself — and the library-lunch runs with the first boss — is private recollection.",
  };
  scene.add(corridor);
  PICKABLE.push(corridor);
  addLabel("commute", "≈9.3 KM COMMUTE", "community", mid);
}

/* ---------------- Satellite pins ---------------------------------------- */

function pin(id, short, tier, pos, record) {
  const g = new THREE.Group();
  g.position.copy(pos);
  const color = new THREE.Color(TIER_COLOR[tier]);
  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 1.15, 6),
    new THREE.MeshStandardMaterial({ color, emissive: color.clone().multiplyScalar(0.3) })
  );
  mast.position.y = 0.57;
  g.add(mast);
  const head = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.17),
    new THREE.MeshStandardMaterial({ color, emissive: color.clone().multiplyScalar(0.55) })
  );
  head.position.y = 1.22;
  head.userData.pick = record;
  g.add(head);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.26, 0.34, 28).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.45, side: THREE.DoubleSide })
  );
  ring.position.y = 0.01;
  g.add(ring);
  scene.add(g);
  PICKABLE.push(head);
  addLabel(id, short, tier, pos.clone().add(new THREE.Vector3(0, 1.5, 0)));
}

pin("pin-delnorte", "DEL NORTE 1501", "official", SITES.delnorte.center.clone().add(new THREE.Vector3(-1.2, 0, -1.15)), {
  label: "ESGVROP Del Norte Campus — the main campus",
  tier: "official",
  note:
    "1501 W. Del Norte Ave, West Covina 91790 · (626) 962-5080 · hours M–F 7:30–5. East San Gabriel Valley ROP & Technical Center — a JPA of seven unified districts (Azusa, Baldwin Park, Charter Oak, Covina, Glendora, Walnut, West Covina). Summer-2001 workplace, per recollection.",
});
pin("pin-sunflower", "SUNFLOWER 1505", "official", SITES.sunflower.center.clone().add(new THREE.Vector3(-1.2, 0, -1.15)), {
  label: "ESGVROP Sunflower Campus",
  tier: "official",
  note:
    "1505 S. Sunflower Ave, Glendora 91740 · (626) 335-5350. The Glendora-side campus, minutes from Glendora High — the 'sunflower campus' of the biography file.",
});
pin(
  "pin-quesenberry",
  "RQ · FIRST BOSS",
  "official",
  SITES.delnorte.center.clone().add(new THREE.Vector3(-52 / M_PER_UNIT, 0, 22 / M_PER_UNIT - 0.5)),
  {
    label: "Ryan Quesenberry — Project Facilitator-Technology",
    tier: "official",
    note:
      "Public record (archived ESGVROP key contacts): Ryan Quesenberry, Project Facilitator-Technology, rquesenberry@esgvrop.org, (626) 962-5080. Private memory, kept separate: he was the first boss — formerly the computer-lab teacher at the Glendora library — and the two of them went out to lunch together.",
  }
);
pin("pin-ghs-sites", "GHS CLASS SITES", "official", new THREE.Vector3(9.6, 0, -3.6), {
  label: "Glendora High School — ROP class sites",
  tier: "official",
  note:
    "The archived 2002–03 schedule lists Glendora HS rooms 135, 215, 221, 222 and 435 among ESGVROP's class sites, alongside classrooms across the member districts' high schools. The 2002–03 schedule is the archived record; the summer-2001 offerings themselves are not archived.",
});
pin("pin-current", "CURRENT OFFICE", "official", new THREE.Vector3(-9.8, 0, 4.2), {
  label: "ESGVROP today — 1134 S. Barranca Ave, West Covina",
  tier: "official",
  note:
    "The program's current West Covina address on the S. Barranca corridor. Pin placed schematically along the corridor (house-number geocode not in OSM); see the bibliography for the source.",
});

/* Dashed connector Sunflower → GHS sites (not to scale). */
{
  const a = SITES.sunflower.center.clone().add(new THREE.Vector3(1.6, 0.03, -1.0));
  const b = new THREE.Vector3(8.7, 0.03, -3.3);
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([a, b]),
    new THREE.LineDashedMaterial({ color: 0xb48cff, dashSize: 0.16, gapSize: 0.12 })
  );
  line.computeLineDistances();
  line.userData.pick = {
    label: "Sunflower campus → Glendora HS",
    tier: "context",
    note: "Schematic connector, not to scale — GHS sits ≈2.6 km northeast of the Sunflower campus.",
  };
  scene.add(line);
  PICKABLE.push(line);
}

/* ------------------------------------------------------------------ views */

const VIEWS = [
  {
    label: "OVERVIEW · both campuses",
    desc: "Del Norte and Sunflower — the two ESGVROP campuses of the first-boss summer, as schematic dioramas.",
    target: new THREE.Vector3(-0.4, 0, 0),
    pos: [7.5, 7.5, 11],
  },
  {
    label: "DEL NORTE CAMPUS",
    desc: "1501 W. Del Norte Ave, West Covina — the main campus and central office.",
    target: SITES.delnorte.center.clone().setY(0.3),
    pos: [2.6, 2.4, 3.6],
  },
  {
    label: "SUNFLOWER CAMPUS",
    desc: "1505 S. Sunflower Ave, Glendora — wings A, E and H, minutes from Glendora High.",
    target: SITES.sunflower.center.clone().setY(0.3),
    pos: [2.4, 2.3, 3.4],
  },
  {
    label: "THE COMMUTE",
    desc: "≈9.3 km across the valley floor between the two campuses.",
    target: new THREE.Vector3(-0.4, 0.2, 0),
    pos: [1.2, 2.6, 7.5],
  },
  {
    label: "GHS CLASS SITES",
    desc: "Glendora High rooms 135, 215, 221, 222, 435 — the 2002–03 archived schedule.",
    target: new THREE.Vector3(9.2, 0.2, -3.4),
    pos: [2.2, 1.8, 2.6],
  },
  {
    label: "CURRENT OFFICE",
    desc: "1134 S. Barranca Ave, West Covina — ESGVROP today (schematic pin).",
    target: new THREE.Vector3(-9.6, 0.2, 4.0),
    pos: [2.0, 1.8, 2.6],
  },
];

function gotoView(v) {
  controls.target.copy(v.target);
  camera.position.set(v.target.x + v.pos[0], v.target.y + v.pos[1], v.target.z + v.pos[2]);
  controls.update();
  setStatus(v.desc);
}

function buildJumpList() {
  const host = $("jumpList");
  if (!host) return;
  host.textContent = "";
  for (const v of VIEWS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "jump-row";
    const b = document.createElement("b");
    b.textContent = v.label;
    const s = document.createElement("span");
    s.textContent = v.desc;
    btn.append(b, s);
    btn.addEventListener("click", () => gotoView(v));
    host.appendChild(btn);
  }
}

/* --------------------------------------------------------- archive register */

const ARCHIVE_REGISTER = [
  { date: "Oct 2, 2001", what: "esgvrop.org captured by the Wayback Machine (site live; early capture serves a robots.txt)", tier: "official" },
  { date: "Oct 2001", what: "E-Campus weekly newsletter published (ecampusw_10_2_2001.shtml)", tier: "official" },
  { date: "2002–03", what: "High-school class schedule, classes_hs.pdf — Del Norte rooms 6/8/9/10/14/21, Sunflower A2/E2/H2, Glendora HS rooms 135/215/221/222/435", tier: "official" },
  { date: "Dec 18, 2003", what: "key_contacts.shtml captured — both campuses' addresses and phones, Adler/Schwan/Crawford/Quesenberry", tier: "official" },
  { date: "1970", what: "ESGVROP founded — a joint powers authority of seven unified school districts", tier: "official" },
  { date: "2001", what: "The summer job itself — first boss, lunches, library predecessor — lives on the memory tier", tier: "memory" },
];

function buildArchiveRegister() {
  const host = $("archiveList");
  if (!host) return;
  host.textContent = "";
  for (const row of ARCHIVE_REGISTER) {
    const div = document.createElement("div");
    div.className = "jump-row";
    div.style.cursor = "default";
    const b = document.createElement("b");
    b.textContent = row.date;
    b.style.color = TIER_COLOR[row.tier];
    const s = document.createElement("span");
    s.textContent = row.what;
    div.append(b, s);
    host.appendChild(div);
  }
}

/* ------------------------------------------------------------------- info */

function showInfo(rec) {
  const title = $("infoTitle");
  const body = $("infoBody");
  if (!title || !body) return;
  title.textContent = rec ? rec.label : "Scene notes";
  body.textContent = "";
  const chip = document.createElement("span");
  chip.className = `tier-chip tier-${rec?.tier ?? "context"}`;
  chip.textContent =
    rec?.tier === "official"
      ? "Official — public record"
      : rec?.tier === "community"
        ? "Community — sourced secondary"
        : rec?.tier === "memory"
          ? "Memory — private recollection"
          : "Context — schematic anchor";
  const p = document.createElement("p");
  p.textContent = rec?.note ??
    "Two campuses, one JPA, one first boss. Click any block or pin for its record; the archive register lists the Wayback anchors.";
  body.append(chip, p);
  if (rec?.tier === "memory") {
    const warn = document.createElement("p");
    warn.className = "small";
    warn.textContent = "Local-only tier: private recollection, kept separate from the public record.";
    body.append(warn);
  }
}

function setStatus(text) {
  const el = $("status");
  if (el) el.textContent = text;
}

/* -------------------------------------------------------------------- VRML */

function buildVrml() {
  const L = [];
  const fmt = (n) => Number(n).toFixed(2);
  L.push("#VRML V2.0 utf8");
  L.push("# ESGVROP 4Dwm — Del Norte & Sunflower campuses export");
  L.push("# schematic dioramas; addresses per archived esgvrop.org register");
  L.push("NavigationInfo { type [ \"EXAMINE\" \"ANY\" ] }");
  L.push("Viewpoint { position 16 18 24 description \"overview\" }");
  L.push("Background { skyColor [ 0.02 0.03 0.05 ] }");
  let i = 0;
  scene.traverse((obj) => {
    if (obj.isMesh && obj.geometry?.type === "BoxGeometry") {
      const p = obj.position;
      const s = obj.geometry.parameters;
      L.push(`DEF BLOCK_${i++} Transform { translation ${fmt(p.x * 10)} ${fmt(p.y * 10)} ${fmt(p.z * 10)} children [`);
      L.push(`  Shape { geometry Box { size ${fmt(s.width * 10)} ${fmt(s.height * 10)} ${fmt(s.depth * 10)} }`);
      L.push("  appearance Appearance { material Material { diffuseColor 0.78 0.63 0.42 } } } ] }");
    }
  });
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
raycaster.params.Line = { threshold: 0.08 };
const pointer = new THREE.Vector2();

renderer.domElement.addEventListener("click", (ev) => {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(PICKABLE, false)[0];
  if (hit?.object.userData.pick) {
    showInfo(hit.object.userData.pick);
    setStatus(hit.object.userData.pick.label);
  }
});

/* ------------------------------------------------------------------ labels */

function updateLabels() {
  const w = renderer.domElement.clientWidth;
  const h = renderer.domElement.clientHeight;
  const v = new THREE.Vector3();
  for (const [id, el] of labelEls) {
    if (!el._pos) continue;
    v.copy(el._pos);
    v.project(camera);
    if (v.z > 1) {
      el.style.display = "none";
      continue;
    }
    el.style.display = "block";
    el.style.left = `${(v.x * 0.5 + 0.5) * w}px`;
    el.style.top = `${(-v.y * 0.5 + 0.5) * h}px`;
  }
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
  try {
    if (!(canvas.getContext("webgl2") || canvas.getContext("webgl"))) throw new Error("no webgl");
  } catch {
    setStatus("WebGL unavailable — the ESGVROP viewer needs a WebGL-capable browser.");
    return;
  }
  resize();
  buildJumpList();
  buildArchiveRegister();
  showInfo(null);
  gotoView(VIEWS[0]);
  setStatus("ESGVROP deep dive · esgvrop.org via the Wayback Machine · 266 captures indexed · footprints schematic");

  $("btnReset")?.addEventListener("click", () => gotoView(VIEWS[0]));
  let labelsOn = true;
  $("btnLabels")?.addEventListener("click", (e) => {
    labelsOn = !labelsOn;
    labelHost.style.display = labelsOn ? "block" : "none";
    e.currentTarget.setAttribute("aria-pressed", String(labelsOn));
  });
  $("btnVrml")?.addEventListener("click", () => {
    downloadText("esgvrop-4dwm.wrl", buildVrml());
    setStatus("WRL exported");
  });
  document.querySelectorAll("[data-min]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const panel = btn.closest(".pip");
      panel?.classList.toggle("min");
      btn.textContent = panel?.classList.contains("min") ? "+" : "–";
    });
  });
  window.addEventListener("resize", resize, { passive: true });

  let last = performance.now();
  let acc = 0, n = 0;
  function animate(now) {
    requestAnimationFrame(animate);
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    controls.update();
    updateLabels();
    renderer.render(scene, camera);
    acc += dt;
    n++;
    if (acc >= 0.5) {
      const fps = $("hudFps");
      if (fps) fps.textContent = `${Math.round(n / acc)} fps`;
      acc = 0;
      n = 0;
    }
  }
  requestAnimationFrame(animate);
}

boot();
