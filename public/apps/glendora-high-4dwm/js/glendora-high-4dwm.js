/**
 * GLENDORA HIGH 4Dwm — Class of 2001 campus viewer.
 *
 * The SOCAL SUBSURFACE window-manager treatment of the Glendora High School
 * campus, framed for June 2001 — "now that I am a graduate." Geometry is the
 * OSM extract in js/ghs-data.js (ODbL, Overpass 2026-09-10); Class-of-2001
 * memories ride on top as evidence-tiered pips.
 *
 * Schematic campus theater. Not a survey.
 */

import * as THREE from "../vendor/three.module.min.js";
import { OrbitControls } from "../vendor/OrbitControls.js";
import {
  AREAS,
  BUILDINGS,
  CAMPUS_RING,
  PATHS,
  SITE,
  makeProjector,
  makeTerrain,
  ringBounds,
  ringFromFlat,
} from "./ghs-data.js";

const $ = (id) => document.getElementById(id);
const SCALE = 100; // metres per scene unit
const P = makeProjector();

/* To scene coords: +x east, +z south (north = -z). */
function toScene(lat, lon, zMetres = 0) {
  const { x, y } = P.project(lat, lon);
  return new THREE.Vector3(x / SCALE, zMetres / SCALE, -y / SCALE);
}

/* ------------------------------------------------------------- terrain */

const ringM = CAMPUS_RING ? P.ring(CAMPUS_RING) : null;
const allBounds = (() => {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const grow = (flat) => {
    const b = ringBounds(flat);
    minX = Math.min(minX, b.minX);
    minY = Math.min(minY, b.minY);
    maxX = Math.max(maxX, b.maxX);
    maxY = Math.max(maxY, b.maxY);
  };
  for (const b of BUILDINGS) grow(b.p);
  for (const a of AREAS) grow(a.p);
  if (ringM) grow(ringM);
  return { minX, minY, maxX, maxY };
})();

const PAD = 90; // metres of ground beyond the campus edge
const G_MIN_X = allBounds.minX - PAD, G_MAX_X = allBounds.maxX + PAD;
const G_MIN_Y = allBounds.minY - PAD, G_MAX_Y = allBounds.maxY + PAD;
const GW = G_MAX_X - G_MIN_X;
const GD = G_MAX_Y - G_MIN_Y;

const terrain = makeTerrain([
  { x: 0, y: 0, z: SITE.ele },
  ...BUILDINGS.map((b) => {
    const ring = ringFromFlat(b.p);
    let sx = 0, sy = 0;
    for (const q of ring) {
      const m = P.project(q.lat, q.lon);
      sx += m.x;
      sy += m.y;
    }
    return { x: sx / ring.length, y: sy / ring.length, z: b.ele };
  }),
]);

const canvas = $("stage");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x04070c);
scene.fog = new THREE.Fog(0x04070c, 24, 90);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

const camera = new THREE.PerspectiveCamera(46, 1, 0.05, 300);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI * 0.495;
controls.target.set(0, terrain.at(0, 0) / SCALE, 0);

if (!(canvas.getContext("webgl2") || canvas.getContext("webgl"))) {
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#04070c";
    ctx.fillRect(0, 0, canvas.width || 900, canvas.height || 600);
    ctx.fillStyle = "#cfe8ff";
    ctx.font = "14px ui-monospace, monospace";
    ctx.fillText("WebGL required for the Glendora High 4Dwm viewer", 24, 44);
  }
  throw new Error("WebGL unavailable — campus viewer halted.");
}

scene.add(new THREE.AmbientLight(0x93a8c4, 0.9));
const sun = new THREE.DirectionalLight(0xfff2dc, 1.1);
sun.position.set(6, 9, 4);
scene.add(sun);
const rim = new THREE.DirectionalLight(0x5cd6ff, 0.28);
rim.position.set(-7, 4, -6);
scene.add(rim);

/* Ground: IDW elevation field from the OSM `ele` tags. */
{
  const SEG = 110;
  const gw = GW / SCALE, gd = GD / SCALE;
  const geo = new THREE.PlaneGeometry(gw, gd, SEG, SEG);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const sx = pos.getX(i);
    const sz = pos.getZ(i);
    const mx = G_MIN_X + ((sx + gw / 2) / gw) * GW;
    const my = G_MIN_Y + ((-sz + gd / 2) / gd) * GD;
    pos.setY(i, terrain.at(mx, my) / SCALE);
  }
  geo.computeVertexNormals();
  const c = new THREE.Color();
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    colFor(terrain.at(G_MIN_X + ((pos.getX(i) + gw / 2) / gw) * GW, G_MIN_Y + ((-pos.getZ(i) + gd / 2) / gd) * GD));
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  function colFor(elev) {
    const t = THREE.MathUtils.clamp((elev - 258) / 22, 0, 1);
    c.setHSL(0.23 - 0.03 * t, 0.18, 0.13 + 0.05 * t);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const ground = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.97, metalness: 0.0 })
  );
  ground.userData.pick = { label: "Campus ground", tier: "context", note: "Ground plane interpolated from OSM `ele` tags. Schematic relief." };
  scene.add(ground);
}

/* --------------------------------------------------------------- surfaces */

const KIND_COLORS = {
  classroom: 0xc7a06a,
  admin: 0xd9b96c,
  hall: 0xb0765a,
  gym: 0x9a5f4e,
  annex: 0x8d7a6a,
  portable: 0x9fb2c4,
  cafeteria: 0xc98f5f,
  shed: 0x76858f,
  canopy: 0x86c4d8,
  amphitheater: 0x7f9a8a,
  court: 0x4b6f8f,
  field: 0x3f6b46,
  track: 0x9a5f46,
  parking: 0x39424e,
  path: 0x6a7686,
  road: 0x59636e,
  aisle: 0x4d5761,
  runway: 0x8a929c,
};

function shapeFromFlat(flat) {
  const pts = [];
  for (let i = 0; i + 1 < flat.length; i += 2) {
    const { x, y } = P.project(flat[i], flat[i + 1]);
    pts.push(new THREE.Vector2(x / SCALE, y / SCALE));
  }
  return new THREE.Shape(pts);
}

const PICKABLE = [];

const VERT_EXAG = 4; // readable massing at campus scale, flagged in the inspector

for (const b of BUILDINGS) {
  const shape = shapeFromFlat(b.p);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: (b.h / SCALE) * VERT_EXAG, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshStandardMaterial({
    color: KIND_COLORS[b.kind] ?? 0x9aa8b8,
    roughness: 0.82,
    metalness: 0.05,
    transparent: b.kind === "canopy",
    opacity: b.kind === "canopy" ? 0.55 : 1,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = (b.ele ?? SITE.ele) / SCALE;
  mesh.userData.pick = {
    label: b.name,
    tier: "official",
    note: `OSM way ${b.id} · height ${b.h} m · kind: ${b.kind}. Extracted from OpenStreetMap (ODbL) via Overpass, 2026-09-10.`,
  };
  scene.add(mesh);
  PICKABLE.push(mesh);
}

for (const a of AREAS) {
  const shape = shapeFromFlat(a.p);
  const geo = new THREE.ShapeGeometry(shape);
  geo.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ color: KIND_COLORS[a.kind] ?? 0x55606c, roughness: 0.95, side: THREE.DoubleSide })
  );
  mesh.position.y = terrain.at(0, 0) / SCALE + 0.012;
  // Drape each area at its centroid elevation.
  const ring = ringFromFlat(a.p);
  let sx = 0, sy = 0;
  for (const q of ring) {
    const m = P.project(q.lat, q.lon);
    sx += m.x;
    sy += m.y;
  }
  mesh.position.y = terrain.at(sx / ring.length, sy / ring.length) / SCALE + 0.012;
  mesh.userData.pick = {
    label: a.name,
    tier: "official",
    note: `Open ground · kind: ${a.kind}. OSM way ${a.id} (ODbL).`,
  };
  scene.add(mesh);
  PICKABLE.push(mesh);
}

for (const p of PATHS) {
  const pts = [];
  for (let i = 0; i + 1 < p.p.length; i += 2) {
    const { x, y } = P.project(p.p[i], p.p[i + 1]);
    pts.push(new THREE.Vector3(x / SCALE, terrain.at(x, y) / SCALE + 0.02, -y / SCALE));
  }
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color: KIND_COLORS[p.kind] ?? 0x6a7686, transparent: true, opacity: 0.9 })
  );
  line.userData.pick = {
    label: `${p.kind} path`,
    tier: "official",
    note: `OSM way ${p.id} · centre line, ${p.kind}.`,
  };
  scene.add(line);
  PICKABLE.push(line);
}

/* ------------------------------------------------------------------ nodes */

/** Class-of-2001 anchors. Memory tier unless the record carries it. */
const NODES = [
  {
    id: "diploma",
    short: "DIPLOMA",
    label: "The diploma walk — June 2001",
    tier: "memory",
    lat: 34.1333428,
    lon: -117.8350036,
    note:
      "Class of 2001. Glendora High's commencement date for 2001 is not yet verified from a program or newspaper listing — June 2001 is the remembered frame; the exact program stays on the gaps list.",
  },
  {
    id: "apps",
    short: "APPS",
    label: "The UC applications — sent from the counseling office",
    tier: "memory",
    lat: 34.1357983,
    lon: -117.8361734,
    note:
      "Four campuses, $50 and a life story each (recollection). The counseling and administration wing — Building 1 — is where the paperwork of senior year lived.",
  },
  {
    id: "senior-lot",
    short: "LOT",
    label: "The north lot — senior-year arrivals",
    tier: "context",
    lat: 34.1357534,
    lon: -117.8345579,
    note: "Foothill Boulevard on the north side. Schematic anchor for the remembered daily approach.",
  },
  {
    id: "auditorium",
    short: "AUD",
    label: "Auditorium / Performing Arts",
    tier: "official",
    lat: 34.1335606,
    lon: -117.8362174,
    note: "OSM way 471406918. The assemblies and performances wing of senior year.",
  },
  {
    id: "cafeteria",
    short: "CAFÉ",
    label: "Cafeteria",
    tier: "official",
    lat: 34.1346604,
    lon: -117.8348201,
    note: "OSM way 471407179. The servery by the quad.",
  },
  {
    id: "library-labs",
    short: "LABS",
    label: "Building 6 — Labs",
    tier: "official",
    lat: 34.1340448,
    lon: -117.8348264,
    note: "OSM way 471407158. The computer-and-science wing of the pre-UCSB years.",
  },
];

const TIER_COLOR = { official: "#ffb020", community: "#5cd6ff", context: "#b48cff", memory: "#ff6ec7" };

const labelHost = $("labels");
const labelEls = new Map();

for (const node of NODES) {
  const gp = P.project(node.lat, node.lon);
  const pos = toScene(node.lat, node.lon, terrain.at(gp.x, gp.y) + 26);
  const g = new THREE.Group();
  g.position.copy(pos);
  const color = new THREE.Color(TIER_COLOR[node.tier]);

  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.014, 0.5, 6),
    new THREE.MeshStandardMaterial({ color, emissive: color.clone().multiplyScalar(0.35) })
  );
  mast.position.y = 0.25;
  g.add(mast);
  const head = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.12),
    new THREE.MeshStandardMaterial({ color, emissive: color.clone().multiplyScalar(0.55) })
  );
  head.position.y = 0.58;
  head.userData.pick = { ...node, tier: node.tier };
  g.add(head);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.16, 0.2, 24).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
  );
  ring.position.y = 0.006;
  g.add(ring);
  scene.add(g);
  PICKABLE.push(head);
}

/* --------------------------------------------------------------- jump list */

function centroidOf(flat) {
  const ring = ringFromFlat(flat);
  let sx = 0, sy = 0;
  for (const q of ring) {
    const m = P.project(q.lat, q.lon);
    sx += m.x;
    sy += m.y;
  }
  return { x: sx / ring.length, y: sy / ring.length };
}

function targetOf(pred, dy = 0.6, dz = 0) {
  const b = BUILDINGS.find(pred);
  const c = b ? centroidOf(b.p) : { x: 0, y: 0 };
  const t = new THREE.Vector3(c.x / SCALE, terrain.at(c.x, c.y) / SCALE + dy, -c.y / SCALE + dz);
  return t;
}

const VIEWS = [
  {
    label: "OVERVIEW · the graduate's campus",
    desc: "Glendora High, June 2001 — the whole 60-acre frame.",
    target: new THREE.Vector3(0, terrain.at(0, 0) / SCALE + 0.4, 0),
    pos: [5.4, 4.4, 6.6],
  },
  {
    label: "STADIUM BOWL · the diploma walk",
    desc: "Running track and stadium bowl — Class of 2001 ground.",
    target: targetOf((b) => b.kind === "track", 0.5),
    pos: [0.9, 1.4, 2.2],
  },
  {
    label: "BUILDING 9 · main academic",
    desc: "The main academic wing, senior-year hallway.",
    target: targetOf((b) => /Main Academic/.test(b.name), 0.5),
    pos: [1.2, 1.2, 2.4],
  },
  {
    label: "ADMIN · Building 1",
    desc: "Administration and counseling — where the applications went out.",
    target: targetOf((b) => /Administration/.test(b.name), 0.5),
    pos: [1.3, 1.3, 1.9],
  },
  {
    label: "AUDITORIUM · performing arts",
    desc: "The assembly hall.",
    target: targetOf((b) => /Auditorium/.test(b.name), 0.6),
    pos: [2.0, 1.5, 2.2],
  },
  {
    label: "GYMNASIUM",
    desc: "The gym and locker block.",
    target: targetOf((b) => b.kind === "gym" && /Gymnasium/.test(b.name), 0.6),
    pos: [1.4, 1.4, 2.0],
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
  p.textContent = rec?.note ?? "Drag to orbit · scroll to zoom · click a building or pip for its record.";
  body.append(chip, p);
  if (rec?.tier === "memory") {
    const warn = document.createElement("p");
    warn.className = "small";
    warn.textContent = "Local-only tier: this row is private recollection, kept separate from the public record.";
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
  L.push("# Glendora High 4Dwm — Class of 2001 campus export");
  L.push("# geometry (c) OpenStreetMap contributors, ODbL");
  L.push("NavigationInfo { type [ \"EXAMINE\" \"ANY\" ] }");
  L.push("Viewpoint { position 60 48 72 description \"overview\" }");
  L.push("Background { skyColor [ 0.02 0.03 0.05 ] }");

  let i = 0;
  for (const b of BUILDINGS) {
    const ring = ringFromFlat(b.p);
    const pts = ring.map((q) => {
      const { x, y } = P.project(q.lat, q.lon);
      return `${fmt(x)} ${fmt(b.ele ?? SITE.ele)} ${fmt(-y)}`;
    });
    const idx = ring.map((_, k) => `${k} ${(k + 1) % ring.length} ${ring.length} -1`).join(" ");
    const topPts = [`${fmt(0)} ${fmt((b.ele ?? SITE.ele) + b.h)} ${fmt(0)}`];
    const centroid = centroidOf(b.p);
    topPts[0] = `${fmt(centroid.x)} ${fmt((b.ele ?? SITE.ele) + b.h)} ${fmt(-centroid.y)}`;
    L.push(`DEF BUILDING_${i++} Shape { geometry IndexedFaceSet { coordIndex [ ${idx} ]`);
    L.push(`  coord Coordinate { point [ ${pts.join(", ")}, ${topPts[0]} ] } }`);
    L.push("  appearance Appearance { material Material { diffuseColor 0.78 0.63 0.42 } } }");
  }
  for (const p of PATHS) {
    const pts = [];
    for (let k = 0; k + 1 < p.p.length; k += 2) {
      const { x, y } = P.project(p.p[k], p.p[k + 1]);
      pts.push(`${fmt(x)} ${fmt(terrain.at(x, y))} ${fmt(-y)}`);
    }
    L.push(`Shape { geometry IndexedLineSet { coordIndex [ ${pts.map((_, k) => k).join(", ")} -1 ]`);
    L.push(`  coord Coordinate { point [ ${pts.join(", ")} ] } }`);
    L.push("  appearance Appearance { material Material { emissiveColor 0.4 0.45 0.5 } } }");
  }
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
  for (const node of NODES) {
    let el = labelEls.get(node.id);
    if (!el) {
      el = document.createElement("span");
      el.className = `label tier-${node.tier}`;
      el.textContent = node.short;
      labelHost.appendChild(el);
      labelEls.set(node.id, el);
    }
    const { x, y } = P.project(node.lat, node.lon);
    const v = new THREE.Vector3(x / SCALE, terrain.at(x, y) / SCALE + 0.68, -y / SCALE);
    v.project(camera);
    const w = renderer.domElement.clientWidth;
    const h = renderer.domElement.clientHeight;
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
    setStatus("WebGL unavailable — the campus viewer needs a WebGL-capable browser.");
    return;
  }
  resize();
  buildJumpList();
  showInfo(null);
  gotoView(VIEWS[0]);
  setStatus(`${SITE.name} · Class of 2001 · ${BUILDINGS.length} buildings, ${AREAS.length} grounds, ${PATHS.length} paths (OSM, ODbL)`);

  $("btnReset")?.addEventListener("click", () => gotoView(VIEWS[0]));
  let labelsOn = true;
  $("btnLabels")?.addEventListener("click", (e) => {
    labelsOn = !labelsOn;
    labelHost.style.display = labelsOn ? "block" : "none";
    e.currentTarget.setAttribute("aria-pressed", String(labelsOn));
  });
  $("btnVrml")?.addEventListener("click", () => {
    downloadText("glendora-high-4dwm.wrl", buildVrml());
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

export { SITE, NODES };
