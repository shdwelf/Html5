import * as THREE from "../vendor/three.module.min.js";
import { OrbitControls } from "../vendor/OrbitControls.js";
import {
  SITE,
  BBOX,
  WORLD,
  ROADS,
  buildDem,
  buildContours,
  hypsometric,
  project,
  sampleDem,
} from "./ca-geo.js";
import { demToVrml, downloadText } from "./vrml-export.js";

const $ = (id) => document.getElementById(id);

const HOUSE_1803 = [-117.8328, 34.15741];

const OFFICIAL_ROUTE = [
  [-117.878, 34.1545],
  [-117.869, 34.1548],
  [-117.862, 34.1572],
  ...ROADS.gmr,
];

const COMMUNITY_ROUTE = [
  [-117.8368, 34.1564],
  [-117.8384, 34.1675],
  [-117.8415, 34.176],
  [-117.845, 34.185],
  [-117.847, 34.194],
  [-117.844, 34.202],
  [-117.836, 34.205],
  [-117.826, 34.205],
  [-117.819, 34.199],
];

const LOCAL_MEMORY_POINTER = [
  HOUSE_1803,
  [-117.834, 34.1605],
  [-117.8388, 34.168],
  [-117.842, 34.1765],
  [-117.8445, 34.186],
];

const BASE_MARKERS = [
  {
    id: "gmr-turn",
    short: "GMR",
    label: "Official race corridor enters GMR",
    kind: "official",
    lon: -117.86,
    lat: 34.16,
    note:
      "Official 2019 AEG route text says riders went through the outskirts of Glendora and turned left onto Glendora Mountain Road toward Mt. Baldy. This pip is a scene anchor for that verified corridor, not a centimeter-accurate broadcast map point.",
  },
  {
    id: "big-dalton-park",
    short: "PARK",
    label: "Big Dalton Wilderness Park",
    kind: "official",
    lon: -117.818,
    lat: 34.168,
    note:
      "Public Big Dalton anchor near the lower canyon facilities. Useful for orienting the remembered house/race staging area against the canyon mouth and the road up toward Little Dalton.",
  },
  {
    id: "big-dalton-dam",
    short: "DAM",
    label: "Big Dalton Dam / 2600 anchor",
    kind: "official",
    lon: -117.808,
    lat: 34.172,
    note:
      "Official/public anchor: Library of Congress HAER names Big Dalton Dam at 2600 Big Dalton Canyon Road, and CEQAnet ties the dam project to parcel 8678-012-902.",
  },
  {
    id: "little-dalton-usgs",
    short: "USGS",
    label: "Little Dalton USGS gage",
    kind: "official",
    lon: -117.8383937,
    lat: 34.1675067,
    note:
      "Official USGS Water Data station 11086500, LITTLE DALTON C NR GLENDORA CA. This gives a clean public point inside the Little Dalton corridor.",
  },
  {
    id: "lower-monroe",
    short: "LMM",
    label: "Lower Monroe / Little Dalton corridor",
    kind: "community",
    lon: -117.8435,
    lat: 34.1845,
    note:
      "Public/community trail context: hike and trail pages describe the Lower Monroe Motorway following the Little Dalton stream bottom and turning south toward Mystic Canyon. This helps place the terrain you were describing, but it is not by itself official Amgen route proof.",
  },
  {
    id: "house-1803",
    short: "1803",
    label: "1803 house-front bike-staging memory",
    kind: "local",
    lon: HOUSE_1803[0],
    lat: HOUSE_1803[1],
    note:
      "Local-only memory pip pinned to the 1803 scene you chose. Public-facing address records align with a 1934, 1,405-square-foot two-bedroom / two-bath house profile at 1803, but the claim that Amgen Tour of California bikes were parked in front of this house remains a private recollection unless separately corroborated.",
  },
  {
    id: "memory-pointer",
    short: "MEM",
    label: "Local-only Monroe/Little Dalton race pointer",
    kind: "local",
    lon: -117.841,
    lat: 34.176,
    note:
      "Local-only memory pointer: your recollection is that race traffic used Monroe Truck Trail through Little Dalton and that bikes were parked in front of the 1803 house a couple of times. I am keeping this as a separate memory layer until I recover public corroboration.",
  },
];

const EXTRA_LABELS = [
  {
    id: "route-label-official",
    short: "RACE",
    label: "Official GMR race corridor",
    kind: "official",
    lon: -117.829,
    lat: 34.182,
    note: "Scene label for the verified GMR corridor.",
    hiddenFromJump: true,
  },
  {
    id: "route-label-community",
    short: "TRAIL",
    label: "Lower Monroe / Little Dalton corridor",
    kind: "community",
    lon: -117.844,
    lat: 34.191,
    note: "Scene label for the public/community trail corridor.",
    hiddenFromJump: true,
  },
];

// Immutable combined list — no mutation of BASE_MARKERS
const MARKERS = [...BASE_MARKERS, ...EXTRA_LABELS];

let renderer;
let scene;
let camera;
let controls;
let terrain;
let terrainWire;
let routeGroup;
let pipGroup;
let raycaster;
let pointer;
let dem;
let selected = null;
let wireOn = true;
let animationId = 0;

const labelCache = new Map();

function size() {
  return { w: window.innerWidth, h: window.innerHeight };
}

function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl") || c.getContext("experimental-webgl") || c.getContext("webgl2"));
  } catch {
    return false;
  }
}

function makeTerrain() {
  const { nx, ny, elev } = dem;
  const pos = new Float32Array(nx * ny * 3);
  const col = new Float32Array(nx * ny * 3);
  const idx = [];

  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const lon = BBOX.minLon + (i / (nx - 1)) * (BBOX.maxLon - BBOX.minLon);
      const lat = BBOX.maxLat - (j / (ny - 1)) * (BBOX.maxLat - BBOX.minLat);
      const [x, z] = project(lon, lat);
      const k = j * nx + i;
      const e = elev[k];
      pos[k * 3] = x;
      pos[k * 3 + 1] = e * WORLD.elevScale;
      pos[k * 3 + 2] = z;
      const rgb = hypsometric(e);
      col[k * 3] = rgb[0];
      col[k * 3 + 1] = rgb[1];
      col[k * 3 + 2] = rgb[2];
    }
  }

  for (let j = 0; j < ny - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const a = j * nx + i;
      idx.push(a, a + nx, a + 1, a + 1, a + nx, a + nx + 1);
    }
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();

  terrain = new THREE.Mesh(
    g,
    new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 18, flatShading: false })
  );
  terrain.userData.pick = true;
  scene.add(terrain);

  terrainWire = new THREE.Mesh(
    g,
    new THREE.MeshBasicMaterial({ color: 0x74ff6b, wireframe: true, transparent: true, opacity: 0.12 })
  );
  scene.add(terrainWire);

  const ctr = buildContours(dem, [250, 350, 450, 550, 700, 900]);
  ctr.forEach((c, i) => {
    if (!c.segs.length) return;
    const cg = new THREE.BufferGeometry();
    cg.setAttribute("position", new THREE.Float32BufferAttribute(c.segs, 3));
    scene.add(
      new THREE.LineSegments(
        cg,
        new THREE.LineBasicMaterial({
          color: i % 2 ? 0x244528 : 0x2d562f,
          transparent: true,
          opacity: 0.26,
        })
      )
    );
  });

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(Math.max(WORLD.w, WORLD.d), 80),
    new THREE.MeshBasicMaterial({ color: 0x040805, transparent: true, opacity: 0.85 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.35;
  scene.add(floor);
}

function polyline(points, color, { dashed = false, yOffset = 0.08 } = {}) {
  const arr = [];
  for (const [lon, lat] of points) {
    const [x, z] = project(lon, lat);
    const y = sampleDem(dem, lon, lat) * WORLD.elevScale + yOffset;
    arr.push(x, y, z);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3));
  const mat = dashed
    ? new THREE.LineDashedMaterial({ color, dashSize: 0.45, gapSize: 0.22, transparent: true, opacity: 0.95 })
    : new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.95 });
  const line = new THREE.Line(g, mat);
  if (dashed) line.computeLineDistances();
  return line;
}

function makeRoutes() {
  routeGroup = new THREE.Group();
  routeGroup.add(polyline(OFFICIAL_ROUTE, 0xffb020, { dashed: false, yOffset: 0.16 }));
  routeGroup.add(polyline(COMMUNITY_ROUTE, 0x5cd6ff, { dashed: true, yOffset: 0.2 }));
  routeGroup.add(polyline(LOCAL_MEMORY_POINTER, 0xff6ec7, { dashed: true, yOffset: 0.27 }));
  scene.add(routeGroup);
}

function pipColor(kind) {
  if (kind === "official") return 0xffb020;
  if (kind === "community") return 0x5cd6ff;
  return 0xff6ec7;
}

function makePips() {
  pipGroup = new THREE.Group();
  const stemGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.55, 8);
  const haloGeo = new THREE.RingGeometry(0.18, 0.24, 24);

  MARKERS.forEach((m) => {
    const [x, z] = project(m.lon, m.lat);
    const ground = sampleDem(dem, m.lon, m.lat) * WORLD.elevScale;
    const g = new THREE.Group();
    const color = pipColor(m.kind);

    const stem = new THREE.Mesh(
      stemGeo,
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.92 })
    );
    stem.position.y = 0.275;

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 14, 14),
      new THREE.MeshBasicMaterial({ color })
    );
    head.position.y = 0.62;

    const halo = new THREE.Mesh(
      haloGeo,
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.5 })
    );
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = 0.05;

    g.add(stem, head, halo);
    g.position.set(x, ground, z);
    g.userData.marker = m;
    pipGroup.add(g);
  });

  scene.add(pipGroup);
}

function ensureLabel(id, text, kind) {
  let el = labelCache.get(id);
  if (!el) {
    el = document.createElement("span");
    el.className = `label ${kind}`;
    el.textContent = text;
    $("labels").appendChild(el);
    labelCache.set(id, el);
  }
  return el;
}

function updateLabels() {
  if (!camera || !MARKERS.length) return;
  const w = window.innerWidth;
  const h = window.innerHeight;
  MARKERS.forEach((m) => {
    const [x, z] = project(m.lon, m.lat);
    const y = sampleDem(dem, m.lon, m.lat) * WORLD.elevScale + 0.95;
    const v = new THREE.Vector3(x, y, z).project(camera);
    const el = ensureLabel(m.id, m.short, m.kind);
    if (v.z > 1 || v.z < -1) {
      el.style.display = "none";
      return;
    }
    const px = (v.x * 0.5 + 0.5) * w;
    const py = (-v.y * 0.5 + 0.5) * h;
    const hidden = px < -50 || px > w + 50 || py < -50 || py > h + 50;
    el.style.display = hidden ? "none" : "block";
    if (!hidden) {
      el.style.left = `${px}px`;
      el.style.top = `${py}px`;
    }
  });
}

function escapeHtmlText(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function updateInfo(marker) {
  selected = marker;
  const titleEl = $("infoTitle");
  const bodyEl = $("infoBody");
  if (!titleEl || !bodyEl) return;
  titleEl.textContent = marker ? marker.label : "Scene notes";
  if (marker) {
    const kindText =
      marker.kind === "official"
        ? "Verified public/official anchor"
        : marker.kind === "community"
          ? "Public/community terrain context"
          : "Local-only memory layer";
    // Use textContent for safety, construct DOM safely
    bodyEl.textContent = "";
    const p1 = document.createElement("p");
    p1.textContent = marker.note;
    const p2 = document.createElement("p");
    p2.className = "small";
    p2.textContent = kindText;
    bodyEl.append(p1, p2);
  } else {
    bodyEl.innerHTML = `<p>Click a pip to inspect what it stands for.</p><p class=\"small\">Orbit to see how Big Dalton, Little Dalton, GMR, and the lower canyon sit relative to each other.</p>`;
  }
}

function makeJumpList() {
  const host = $("jumpList");
  if (!host) return;
  host.textContent = "";
  MARKERS.filter((m) => !m.hiddenFromJump).forEach((m) => {
    const btn = document.createElement("button");
    btn.type = "button";
    // Safe construction: no innerHTML with user data
    const label = document.createElement("span");
    label.textContent = `${m.short} — ${m.label}`;
    const small = document.createElement("small");
    small.textContent = m.kind;
    btn.append(label, document.createElement("br"), small);
    btn.addEventListener("click", () => flyTo(m));
    host.appendChild(btn);
  });
}

function flyTo(marker) {
  if (!marker || !controls || !camera) return;
  const [x, z] = project(marker.lon, marker.lat);
  const y = sampleDem(dem, marker.lon, marker.lat) * WORLD.elevScale;
  controls.target.set(x, y, z);
  // Offset camera but keep above terrain minimum
  const camY = y + 5.3;
  camera.position.set(x + 7.2, Math.max(camY, y + 2.5), z + 7.8);
  controls.update();
  updateInfo(marker);
}

function onResize() {
  if (!camera || !renderer) return;
  const { w, h } = size();
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}

function pointerToRay(ev) {
  if (!renderer || !raycaster || !pointer) return;
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
}

function terrainCoordsFromPoint(point) {
  const lon = BBOX.minLon + ((point.x / WORLD.w) + 0.5) * (BBOX.maxLon - BBOX.minLon);
  const lat = BBOX.maxLat - ((point.z / WORLD.d) + 0.5) * (BBOX.maxLat - BBOX.minLat);
  const elev = sampleDem(dem, lon, lat);
  return { lon, lat, elev };
}

function hover(ev) {
  if (!terrain || !raycaster) return;
  pointerToRay(ev);
  const terrainHit = raycaster.intersectObject(terrain)[0];
  if (!terrainHit) return;
  const { lon, lat, elev } = terrainCoordsFromPoint(terrainHit.point);
  const el = $("coords");
  if (el) el.textContent = `${lat.toFixed(5)} N · ${Math.abs(lon).toFixed(5)} W · elev ${elev.toFixed(1)} m`;
}

function pick(ev) {
  if (!pipGroup || !terrain || !raycaster) return;
  pointerToRay(ev);
  const hits = raycaster.intersectObjects(pipGroup.children, true);
  const hit = hits.find((entry) => {
    let o = entry.object;
    while (o && !o.userData.marker) o = o.parent;
    return o?.userData?.marker;
  });
  if (hit) {
    let o = hit.object;
    while (o && !o.userData.marker) o = o.parent;
    if (o?.userData?.marker) {
      flyTo(o.userData.marker);
      return;
    }
  }
  const terrainHit = raycaster.intersectObject(terrain)[0];
  if (!terrainHit) return;
  const { lon, lat, elev } = terrainCoordsFromPoint(terrainHit.point);
  const el = $("coords");
  if (el) el.textContent = `${lat.toFixed(5)} N · ${Math.abs(lon).toFixed(5)} W · elev ${elev.toFixed(1)} m`;
}

function drapeRouteAsPairs(points, yOffset = 0.1) {
  const out = [];
  for (let i = 0; i < points.length - 1; i++) {
    for (const [lon, lat] of [points[i], points[i + 1]]) {
      const [x, z] = project(lon, lat);
      const y = sampleDem(dem, lon, lat) * WORLD.elevScale + yOffset;
      out.push(x, y, z);
    }
  }
  return out;
}

function makeVrml() {
  const nodePts = MARKERS.map((m) => {
    const [x, z] = project(m.lon, m.lat);
    const y = sampleDem(dem, m.lon, m.lat) * WORLD.elevScale;
    return { x, y, z, name: m.short };
  });
  const roadLines = [
    ...drapeRouteAsPairs(OFFICIAL_ROUTE, 0.16),
    ...drapeRouteAsPairs(COMMUNITY_ROUTE, 0.2),
    ...drapeRouteAsPairs(LOCAL_MEMORY_POINTER, 0.27),
  ];
  const contourLines = buildContours(dem, [250, 350, 450, 550, 700, 900]).map((c) => ({
    level: c.level,
    segs: c.segs,
  }));
  const wrl = demToVrml(
    dem,
    WORLD,
    { source: "research mix", tempF: NaN, text: "Dalton race scene" },
    `${SITE.title} · RACE POINTERS`,
    {
      contourLines,
      hachureLines: [],
      drainLines: [],
      outlineLines: [],
      roadLines,
      nodes: nodePts,
      stepX: 3,
      stepY: 3,
    }
  );
  downloadText("dalton-race-4dwm.wrl", wrl);
}

function bootScene() {
  if (!webglAvailable()) {
    const status = $("status");
    if (status) status.textContent = "WebGL unavailable — cannot render terrain";
    const stage = $("stage");
    if (stage) {
      const ctx = stage.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#050806";
        ctx.fillRect(0, 0, stage.width || 800, stage.height || 600);
        ctx.fillStyle = "#d8f4d4";
        ctx.font = "14px ui-monospace, monospace";
        ctx.fillText("WebGL required for 4Dwm terrain", 20, 40);
      }
    }
    return;
  }

  dem = buildDem(220, 150);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x030604);

  const { w, h } = size();
  camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
  camera.position.set(12, 10, 16);

  renderer = new THREE.WebGLRenderer({ canvas: $("stage"), antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(w, h, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.target.set(0, 2.5, 0);
  controls.minDistance = 5;
  controls.maxDistance = 40;
  controls.maxPolarAngle = Math.PI * 0.49;

  scene.add(new THREE.AmbientLight(0x7fd3a3, 0.7));
  const sun = new THREE.DirectionalLight(0xfff0c5, 1.1);
  sun.position.set(8, 15, 9);
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0x5cd6ff, 0.35);
  rim.position.set(-8, 5, -10);
  scene.add(rim);

  makeTerrain();
  makeRoutes();
  makePips();
  makeJumpList();
  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();
  updateInfo(null);

  window.addEventListener("resize", onResize, { passive: true });
  renderer.domElement.addEventListener("click", pick);
  renderer.domElement.addEventListener("pointermove", hover, { passive: true });

  $("btnReset")?.addEventListener("click", () => {
    if (!camera || !controls) return;
    camera.position.set(12, 10, 16);
    controls.target.set(0, 2.5, 0);
    controls.update();
    updateInfo(null);
  });
  $("btnTerrain")?.addEventListener("click", (e) => {
    wireOn = !wireOn;
    if (terrainWire) terrainWire.visible = wireOn;
    e.currentTarget.classList.toggle("active", wireOn);
  });
  $("btnTerrain")?.classList.add("active");
  $("btnVrml")?.addEventListener("click", makeVrml);

  const status = $("status");
  if (status) status.textContent = `${SITE.code} · ${MARKERS.length} pips · WRL export ready`;
}

function animate() {
  animationId = requestAnimationFrame(animate);
  const t = performance.now() * 0.001;
  if (pipGroup?.children) {
    pipGroup.children.forEach((g, i) => {
      const halo = g.children[2];
      const head = g.children[1];
      if (halo) halo.scale.setScalar(1 + 0.16 * Math.sin(t * 1.8 + i));
      if (head) head.position.y = 0.62 + 0.03 * Math.sin(t * 1.6 + i * 0.7);
    });
  }
  controls?.update();
  updateLabels();
  renderer?.render(scene, camera);
}

function dispose() {
  if (animationId) cancelAnimationFrame(animationId);
  controls?.dispose();
  renderer?.dispose();
  scene?.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
      else obj.material.dispose();
    }
  });
}

window.addEventListener("beforeunload", dispose);

bootScene();
animate();

export { MARKERS, BASE_MARKERS, HOUSE_1803, OFFICIAL_ROUTE, COMMUNITY_ROUTE, LOCAL_MEMORY_POINTER };
