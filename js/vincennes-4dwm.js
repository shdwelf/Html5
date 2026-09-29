import * as THREE from "../vendor/three.module.min.js";
import { OrbitControls } from "../vendor/OrbitControls.js";
import { initPipWm } from "./project-y-4dwm.js";
import { THEATERS, THEATERS_BY_ID, SOURCES } from "./vincennes-logs-data.js";
import {
  solveTheater, enuFromGeo, distanceNm, initialBearing, destination, nmToM,
  hhmmss, dmPair, FT_M, NM_M,
} from "./vincennes-logmath.js";
import { buildGrid, sampleDem, hypsometric, DEM_META, DEM_CONTROL } from "./vincennes-dem.js";
import { parseDjvu, parseIaDjvuXml, zonesOfKind, dump } from "./vincennes-djvu.js";

/* =========================================================================
   VINCENNES LOGS · 4DWM

   Three ships called Vincennes, three sets of log geometry, one viewer.
   Everything on screen is computed at load time from js/vincennes-logs-data.js
   by js/vincennes-logmath.js; nothing is a stored screen coordinate.

   Scene convention: a local east-north-up tangent plane at the theater
   origin. +X east, +Z south (so north is up-screen in plan view), +Y up.
   One scene unit = one nautical mile on the horizontal. Vertical is
   exaggerated, because 13,500 feet is 2.2 nautical miles and the interesting
   part of the 1988 geometry happens over ten of them.
   ========================================================================= */

const $ = (id) => document.getElementById(id);
const VERT_EXAG = 6;
const FT_NM = FT_M / NM_M; // feet -> nautical miles, before exaggeration

const COL = {
  system: 0x7fd1c4,
  recalled: 0xff6b6b,
  air: 0xffd166,
  ship: 0x6fb3e0,
  enemy: 0xf0669a,
  own: 0xe8a33d,
  derived: 0xb48cff,
  grid: 0x1d3641,
  corridor: 0x2f5d74,
  event: 0xe8a33d,
  plate: 0xe8e0cc,
  check: 0x7fd18a,
  contra: 0xe8a33d,
};

let renderer, scene, camera, controls, raycaster, pointer;
let theater = null;      // raw record
let solved = null;       // solveTheater output
let grid = null;         // DEM grid
let root = null;         // per-theater scene group
let layers = new Map();  // id -> { id, name, color, group, on, count, blurb }
let pickables = [];
let labelEls = [];
let plates = { meta: null, plates: [] };
let platesLoaded = new Map(); // file -> parsed doc
let tNow = 0;
let playing = false;
let speed = 1;
let lastFrame = 0;
let tilted = true;
let wm = null;

/* =======================================================================
   projection
   ======================================================================= */

function xz(p) {
  const { e, n } = enuFromGeo(p, theater.origin);
  return [e / NM_M, -n / NM_M]; // metres -> NM; north is -Z
}
function v3(p, altFt = 0) {
  const [x, z] = xz(p);
  return new THREE.Vector3(x, (altFt || 0) * FT_NM * VERT_EXAG, z);
}
function seaY(lon, lat) {
  if (!grid) return 0;
  const m = sampleDem(grid, lon, lat);
  return (m / NM_M) * VERT_EXAG;
}

/* =======================================================================
   boot
   ======================================================================= */

function initGL() {
  const canvas = $("stage");
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070a0d);
  scene.fog = new THREE.Fog(0x070a0d, 120, 620);

  camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 4000);
  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI * 0.495;

  scene.add(new THREE.AmbientLight(0xbfd4dd, 0.62));
  const key = new THREE.DirectionalLight(0xffeccf, 0.85);
  key.position.set(-40, 80, -30);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x4f7f9a, 0.4);
  rim.position.set(50, 30, 60);
  scene.add(rim);

  raycaster = new THREE.Raycaster();
  raycaster.params.Points = { threshold: 0.55 };
  pointer = new THREE.Vector2();

  addEventListener("resize", onResize);
  canvas.addEventListener("pointermove", onHover);
  canvas.addEventListener("click", onClick);
}

function onResize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
}

/* =======================================================================
   layer helpers
   ======================================================================= */

let currentLayerId = null;

function layer(id, name, color, blurb) {
  const g = new THREE.Group();
  root.add(g);
  const rec = { id, name, color, group: g, on: true, count: 0, blurb };
  layers.set(id, rec);
  currentLayerId = id; // labels created from here on belong to this layer
  return rec;
}

function line(pts, color, { opacity = 0.9, dashed = false, width = 1 } = {}) {
  const g = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = dashed
    ? new THREE.LineDashedMaterial({ color, dashSize: 0.7, gapSize: 0.45, transparent: true, opacity })
    : new THREE.LineBasicMaterial({ color, transparent: true, opacity, linewidth: width });
  const l = new THREE.Line(g, mat);
  if (dashed) l.computeLineDistances();
  return l;
}

function node(pos, color, size, data) {
  const m = new THREE.Mesh(
    new THREE.SphereGeometry(size, 12, 10),
    new THREE.MeshBasicMaterial({ color })
  );
  m.position.copy(pos);
  m.userData = data;
  pickables.push(m);
  return m;
}

function label(text, pos, cls = "") {
  const el = document.createElement("div");
  el.className = `lbl ${cls}`;
  el.textContent = text;
  $("labels").appendChild(el);
  labelEls.push({ el, pos: pos.clone(), layerId: currentLayerId });
  return el;
}

/* =======================================================================
   build the scene for one theater
   ======================================================================= */

function build(id) {
  theater = THEATERS_BY_ID[id];
  solved = solveTheater(theater);
  grid = buildGrid(id, 200, 180);

  if (root) scene.remove(root);
  for (const { el } of labelEls) el.remove();
  labelEls = [];
  pickables = [];
  layers = new Map();
  root = new THREE.Group();
  scene.add(root);

  buildDemLayer();
  buildBoardLayer();
  buildCorridorLayer();
  buildTrackLayers();
  buildAltitudeLayer();
  buildCheckLayer();
  buildLandmarkLayer();
  buildEventLayer();
  buildPlateLayer();

  tNow = solved.span.t1;
  $("subtitle").textContent = `${theater.title} — ${theater.subtitle}`;
  $("timeSlider").value = "1000";
  renderLayerList();
  renderChecks();
  renderJumpList();
  renderPlateList();
  renderProfile();
  for (const p of plates.plates) if (p.theater === id && !platesLoaded.has(p.file)) loadPlate(p);
  frameCamera();
  applyTime();
  status(
    `${Object.keys(solved.tracks).length} tracks · ${solved.checks.filter((c) => c.pass).length}/${solved.checks.length} checks agree`
  );
}

/* ---- DEM ---------------------------------------------------------------- */

function buildDemLayer() {
  const L = layer(
    "dem", "Terrain · minimal USGS DEM", COL.grid,
    "Published spot heights and soundings, interpolated. Not a raster sample — see the inspector."
  );
  const { nx, ny, bbox } = grid;
  const [w, s, e, n] = bbox;
  const pos = new Float32Array(nx * ny * 3);
  const col = new Float32Array(nx * ny * 3);
  const idx = [];
  for (let j = 0; j < ny; j++) {
    const lat = s + ((n - s) * j) / (ny - 1);
    for (let i = 0; i < nx; i++) {
      const lon = w + ((e - w) * i) / (nx - 1);
      const k = j * nx + i;
      const m = grid.elev[k];
      const [x, z] = xz({ lat, lon });
      pos[k * 3] = x;
      pos[k * 3 + 1] = (m / NM_M) * VERT_EXAG;
      pos[k * 3 + 2] = z;
      const c = hypsometric(m);
      col[k * 3] = c[0];
      col[k * 3 + 1] = c[1];
      col[k * 3 + 2] = c[2];
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
  const mesh = new THREE.Mesh(
    g,
    new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 6, transparent: true, opacity: 0.95 })
  );
  mesh.userData = { kind: "dem" };
  pickables.push(mesh);
  L.group.add(mesh);

  // sea surface: the datum everything else is measured from
  const seaGeo = new THREE.PlaneGeometry(
    Math.abs(xz({ lat: s, lon: e })[0] - xz({ lat: s, lon: w })[0]) * 1.1,
    Math.abs(xz({ lat: n, lon: w })[1] - xz({ lat: s, lon: w })[1]) * 1.1
  );
  const sea = new THREE.Mesh(
    seaGeo,
    new THREE.MeshBasicMaterial({ color: 0x0a1a26, transparent: true, opacity: 0.5, depthWrite: false })
  );
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = 0.002;
  L.group.add(sea);

  for (const poly of DEM_CONTROL[theater.id].land) {
    const pts = poly.ring.map(([lon, lat]) => {
      const [x, z] = xz({ lat, lon });
      return new THREE.Vector3(x, seaY(lon, lat) + 0.05, z);
    });
    pts.push(pts[0].clone());
    L.group.add(line(pts, 0x6d7d5e, { opacity: 0.55 }));
    const c = poly.ring.reduce((a, p) => [a[0] + p[0] / poly.ring.length, a[1] + p[1] / poly.ring.length], [0, 0]);
    label(poly.name.toUpperCase(), v3({ lon: c[0], lat: c[1] }, 0), "land");
  }
  L.count = DEM_CONTROL[theater.id].control.length;
}

/* ---- manoeuvring board -------------------------------------------------- */

function buildBoardLayer() {
  const L = layer("board", "Manoeuvring board · range rings", COL.grid, "Range rings and bearing spokes centred on the ownship datum.");
  const span = theater.viewSpanNm;
  const step = span > 400 ? 200 : span > 100 ? 20 : 5;
  for (let r = step; r <= span; r += step) {
    const pts = [];
    for (let a = 0; a <= 360; a += 3) {
      pts.push(v3(destination(theater.origin, a, nmToM(r)), 0));
    }
    L.group.add(line(pts, COL.grid, { opacity: r % (step * 2) === 0 ? 0.42 : 0.2 }));
    L.count++;
  }
  for (let a = 0; a < 360; a += 30) {
    L.group.add(
      line([v3(theater.origin, 0), v3(destination(theater.origin, a, nmToM(span)), 0)], COL.grid, { opacity: 0.16 })
    );
  }
  label(`${step} NM RINGS`, v3(destination(theater.origin, 90, nmToM(span * 0.98)), 0), "land");
}

/* ---- corridors and patrol boxes ---------------------------------------- */

function buildCorridorLayer() {
  const c = theater.corridor;
  const p = theater.patrol;
  if (!c && !p) return;
  const L = layer("corridor", c ? `Airway ${c.name}` : "Patrol box", COL.corridor, c?.note ?? p?.note);

  if (c) {
    const half = nmToM(c.halfWidthNm);
    const a = c.from;
    const b = c.to;
    const brg = initialBearing(a, b);
    for (const side of [-1, 1]) {
      const pts = [
        v3(destination(a, brg + 90 * side, half), 0),
        v3(destination(b, brg + 90 * side, half), 0),
      ];
      L.group.add(line(pts, COL.corridor, { opacity: 0.6 }));
    }
    L.group.add(line([v3(a, 0), v3(b, 0)], COL.corridor, { opacity: 0.5, dashed: true }));
    label(`${c.name.toUpperCase()} \u00b7 ${c.halfWidthNm * 2} NM WIDE`, v3(a, 0), "land");
    L.count = 3;
  }

  if (p && solved.derived.patrolStart) {
    const pts = solved.derived.boxCorners?.map((q) => v3(q, 0)) ?? [];
    if (pts.length) {
      pts.push(pts[0].clone());
      L.group.add(line(pts, COL.corridor, { opacity: 0.55, dashed: true }));
      L.count += 1;
    }
    L.group.add(node(v3(solved.derived.patrolStart, 0), COL.corridor, 0.28, {
      kind: "patrol-start",
      title: "Solved patrol start corner",
    }));
  }
}

/* ---- tracks -------------------------------------------------------------- */

function buildTrackLayers() {
  for (const key of Object.keys(solved.tracks)) {
    const tr = solved.tracks[key];
    if (!tr.track.length) continue;
    const isOwn = key === solved.ownship?.id;
    const color = tr.color
      ? new THREE.Color(tr.color).getHex()
      : isOwn ? COL.own : tr.kind === "air" ? COL.air : tr.kind === "enemy" ? COL.enemy : COL.ship;
    const L = layer(`track:${key}`, tr.name, color, tr.note ?? `${tr.track.length} plotted positions.`);
    L.trackId = key;

    const pts = tr.track.map((s) => v3(s, s.alt ?? 0));
    L.line = line(pts, color, { opacity: 0.92 });
    L.group.add(L.line);
    L.linePts = pts;

    // sea-level shadow, so a 13,000 ft track still reads as a ground track
    if (tr.track.some((s) => (s.alt ?? 0) > 500)) {
      L.shadow = line(tr.track.map((s) => v3(s, 0)), color, { opacity: 0.22, dashed: true });
      L.group.add(L.shadow);
      const drops = new THREE.Group();
      for (const s of tr.track) {
        if (!(s.alt > 500)) continue;
        drops.add(line([v3(s, s.alt), v3(s, 0)], color, { opacity: 0.1 }));
      }
      L.group.add(drops);
    }

    // A dead-reckoned track is a thousand computed points and a handful of
    // real ones. Put a pickable node on the cited fixes and on the course
    // changes; leave the interpolation as line.
    tr.track.forEach((s, i) => {
      const cited = Boolean(s.src) || s.label != null;
      const corner =
        s.legIndex != null && s.legIndex >= 0 &&
        (i === 0 || tr.track[i - 1].legIndex !== s.legIndex);
      if (!cited && !corner) return;
      L.group.add(node(v3(s, s.alt ?? 0), color, cited ? 0.24 : 0.15, {
        kind: "sample", trackId: key, trackName: tr.name, sample: s,
        dr: !cited,
      }));
      L.count += cited ? 1 : 0;
    });

    // the moving marker the time scrub drives
    const mk = new THREE.Mesh(
      new THREE.ConeGeometry(0.42, 1.1, 4),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 })
    );
    mk.rotation.x = Math.PI;
    L.marker = mk;
    L.group.add(mk);
    const lb = label(shortName(tr.name), pts[pts.length - 1]);
    L.labelIdx = labelEls.length - 1;
    L.labelEl = lb;
  }
}

function shortName(n) {
  const m = n.match(/\(([A-Z]{2,4}-\d+)\)/);
  if (m) return m[1];
  return n.split("\u00b7")[0].trim().slice(0, 22).toUpperCase();
}

/* ---- altitude: the divergence layer ------------------------------------- */

function buildAltitudeLayer() {
  const pr = solved.derived.profile;
  if (!pr) return;
  const obs = theater.origin;

  const L = layer(
    "recalled", "Recalled altitudes · CIC", COL.recalled,
    "What the Combat Information Center reported, plotted at the same slant ranges as the tape. Where the two surfaces separate, the room and the recorder disagreed."
  );

  // Place each recalled datum on the bearing the system held at that range,
  // so the two sets are directly comparable in three dimensions.
  const sys = solved.derived.altitudeSystem;
  const bearingAtRange = (r) => {
    let best = sys[0];
    let bd = Infinity;
    for (const s of sys) {
      if (!Number.isFinite(s.bearing)) continue;
      const d = Math.abs(s.rangeNm - r);
      if (d < bd) { bd = d; best = s; }
    }
    return best?.bearing ?? 0;
  };

  const recPts = [];
  for (const s of solved.derived.altitudeRecalled) {
    const p = destination(obs, bearingAtRange(s.rangeNm), nmToM(s.rangeNm));
    const pos = v3(p, s.alt);
    recPts.push({ pos, s });
    const n = node(pos, s.agrees ? COL.system : COL.recalled, 0.26, {
      kind: "recalled", sample: s,
    });
    L.group.add(n);
    L.group.add(line([pos, v3(p, 0)], s.agrees ? COL.system : COL.recalled, { opacity: 0.16 }));
    L.count++;
  }

  // the two fitted lines, drawn as 3-D rays out along the mean bearing
  const F = layer(
    "fit", "Fitted gradients · tape vs. recollection", COL.derived,
    `Least squares through each set. Tape ${pr.system.perNm.toFixed(0)} ft/NM (R² ${pr.system.perNmR2.toFixed(3)}); recollection ${pr.recalled.perNm.toFixed(0)} ft/NM (R² ${pr.recalled.perNmR2.toFixed(3)}).`
  );
  const meanBrg = bearingAtRange(20);
  const rayFor = (fit, color) => {
    const a = destination(obs, meanBrg, nmToM(4));
    const b = destination(obs, meanBrg, nmToM(48));
    const ya = fit.fitRange.b + fit.perNm * 4;
    const yb = fit.fitRange.b + fit.perNm * 48;
    return line([v3(a, ya), v3(b, yb)], color, { opacity: 0.75, dashed: true });
  };
  F.group.add(rayFor(pr.system, COL.system));
  F.group.add(rayFor(pr.recalled, COL.recalled));
  F.count = 2;

  if (Number.isFinite(pr.crossRangeNm)) {
    const p = destination(obs, meanBrg, nmToM(pr.crossRangeNm));
    F.group.add(node(v3(p, pr.crossAltFt), COL.derived, 0.34, {
      kind: "crossing",
      title: "Where the two fitted gradients cross",
    }));
    label(
      `FITS CROSS ${pr.crossRangeNm.toFixed(1)} NM / ${Math.round(pr.crossAltFt).toLocaleString()} FT`,
      v3(p, pr.crossAltFt),
      "ev"
    );
  }
}

/* ---- checks -------------------------------------------------------------- */

function buildCheckLayer() {
  const L = layer("checks", "Cross-check residuals", COL.check, "Each segment joins two positions that reached this model down independent paths. Its length is the disagreement.");
  for (const c of solved.checks) {
    if (!c.modeled || !c.stated) continue;
    const a = v3(c.modeled, 0);
    const b = v3(c.stated, 0);
    L.group.add(line([a, b], c.pass ? COL.check : 0xff8a6b, { opacity: 0.85 }));
    L.group.add(node(a, COL.derived, 0.18, { kind: "check", check: c, which: "modeled" }));
    L.group.add(node(b, c.pass ? COL.check : 0xff8a6b, 0.18, { kind: "check", check: c, which: "stated" }));
    if (c.deltaNm != null) {
      label(`Δ${c.deltaNm.toFixed(2)} NM`, a.clone().lerp(b, 0.5), "ev");
    }
    L.count++;
  }
  if (!L.count) L.on = false;
}

/* ---- landmarks ----------------------------------------------------------- */

function buildLandmarkLayer() {
  if (!theater.landmarks?.length) return;
  const L = layer("landmarks", "Landmarks", 0x9fb08a, "Fixed geographic points the log entries are measured against.");
  for (const m of theater.landmarks) {
    const base = v3(m, 0);
    base.y = seaY(m.lon, m.lat);
    const ring = [];
    for (let a = 0; a <= 360; a += 15) ring.push(v3(destination(m, a, nmToM(0.45)), 0).setY(base.y + 0.05));
    L.group.add(line(ring, 0x9fb08a, { opacity: 0.6 }));
    L.group.add(node(base, 0x9fb08a, 0.2, { kind: "landmark", landmark: m, title: `${m.name} — ${m.note ?? ""}` }));
    label(m.name.toUpperCase(), base.clone().setY(base.y + 0.9), "land");
    L.count++;
  }
}

/* ---- events -------------------------------------------------------------- */

function buildEventLayer() {
  const L = layer("events", "Events", COL.event, "Log entries and findings, placed on the ownship track at their recorded time.");
  const own = solved.tracks[solved.ownship?.id]?.track ?? [];
  for (const ev of solved.events) {
    let p = null;
    if (ev.lat != null) p = { lat: ev.lat, lon: ev.lon };
    else if (ev.trackId && solved.tracks[ev.trackId]) p = sampleAt(solved.tracks[ev.trackId].track, ev.t);
    else if (own.length) p = sampleAt(own, ev.t);
    if (!p) continue;
    const h = 2 + (L.count % 5) * 1.6;
    const base = v3(p, 0);
    const top = base.clone();
    top.y += h;
    L.group.add(line([base, top], COL.event, { opacity: 0.45 }));
    const m = node(top, COL.event, 0.2, { kind: "event", event: ev });
    L.group.add(m);
    ev._pos = top;
    L.count++;
  }
}

function sampleAt(track, t) {
  if (!track.length) return null;
  if (t <= track[0].t) return track[0];
  if (t >= track[track.length - 1].t) return track[track.length - 1];
  for (let i = 1; i < track.length; i++) {
    if (track[i].t >= t) {
      const a = track[i - 1];
      const b = track[i];
      const f = (t - a.t) / (b.t - a.t || 1);
      return { lat: a.lat + (b.lat - a.lat) * f, lon: a.lon + (b.lon - a.lon) * f, alt: (a.alt ?? 0) + ((b.alt ?? 0) - (a.alt ?? 0)) * f };
    }
  }
  return track[track.length - 1];
}

/* ---- DjVu source plates -------------------------------------------------- */

function buildPlateLayer() {
  const L = layer("plates", "Source plates · DjVu", COL.plate, "Each plate is a real DjVu byte stream. Click to read its chunk structure and hidden-text layer.");
  const mine = plates.plates.filter((p) => p.theater === theater.id);
  const span = theater.viewSpanNm;
  mine.forEach((p, i) => {
    const brg = 300 + i * 40;
    const at = destination(theater.origin, brg, nmToM(span * 0.72));
    const h = span * 0.24;
    const w = h * (p.pageWidth / p.pageHeight);
    const geo = new THREE.PlaneGeometry(w, h);
    const mesh = new THREE.Mesh(
      geo,
      new THREE.MeshBasicMaterial({ color: COL.plate, transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false })
    );
    const pos = v3(at, 0);
    pos.y = h * 0.62;
    mesh.position.copy(pos);
    mesh.lookAt(0, pos.y, 0);
    mesh.userData = { kind: "plate", plate: p };
    pickables.push(mesh);
    L.group.add(mesh);
    const edge = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color: COL.plate, transparent: true, opacity: 0.55 })
    );
    edge.position.copy(mesh.position);
    edge.quaternion.copy(mesh.quaternion);
    L.group.add(edge);
    label(p.title.toUpperCase().slice(0, 42), pos.clone().setY(pos.y + h * 0.58), "ev");
    L.count++;
  });
  if (!L.count) L.on = false;
}

/* =======================================================================
   time
   ======================================================================= */

function applyTime() {
  const { t0, t1 } = solved.span;
  const f = Number($("timeSlider").value) / 1000;
  tNow = t0 + (t1 - t0) * f;
  $("timeReadout").textContent = stamp(tNow);

  for (const L of layers.values()) {
    if (!L.trackId) continue;
    const tr = solved.tracks[L.trackId];
    const pts = L.linePts;
    const drawn = tr.track.filter((s) => s.t <= tNow).length;
    const n = Math.max(2, drawn);
    L.line.geometry.setDrawRange(0, Math.min(n, pts.length));
    if (L.shadow) L.shadow.geometry.setDrawRange(0, Math.min(n, pts.length));
    const p = sampleAt(tr.track, tNow);
    if (p && L.marker) {
      const before = tr.track[0].t;
      const after = tr.track[tr.track.length - 1].t;
      const live = tNow >= before && tNow <= after;
      L.marker.visible = live && L.on;
      L.marker.position.copy(v3(p, p.alt ?? 0));
      L.marker.position.y += 0.7;
      if (labelEls[L.labelIdx]) labelEls[L.labelIdx].pos.copy(L.marker.position);
    }
  }

  $("statTracks").textContent = `tracks: ${[...layers.values()].filter((l) => l.trackId && l.on).length}/${[...layers.values()].filter((l) => l.trackId).length}`;
}

function stamp(t) {
  if (theater.multiDay) {
    const d = Math.floor(t / 86400);
    const ep = theater.epoch ?? { day: 1, month: "" };
    return `${String(ep.day + d).padStart(2, "0")} ${ep.month} ${hhmmss(t - d * 86400).slice(0, 4)}${theater.zone}`;
  }
  return `${hhmmss(t)}${theater.zone}`;
}

/* =======================================================================
   UI panels
   ======================================================================= */

function renderLayerList() {
  const ul = $("layerList");
  ul.innerHTML = "";
  for (const L of layers.values()) {
    const li = document.createElement("li");
    li.className = L.on ? "on" : "";
    li.dataset.layer = L.id;
    const hex = `#${L.color.toString(16).padStart(6, "0")}`;
    li.innerHTML = `<span class="swatch" style="color:${hex}"></span><span class="lname"></span><span class="lcount">${L.count || ""}</span>`;
    li.querySelector(".lname").textContent = L.name;
    li.title = L.blurb ?? "";
    li.addEventListener("click", () => setLayer(L.id, !L.on));
    ul.appendChild(li);
    L.group.visible = L.on;
  }
}

function setLayer(id, on) {
  const L = layers.get(id);
  if (!L) return;
  L.on = on;
  L.group.visible = on;
  const li = document.querySelector(`#layerList li[data-layer="${CSS.escape(id)}"]`);
  if (li) li.classList.toggle("on", on);
  applyTime();
}

function renderChecks() {
  const box = $("checkList");
  box.innerHTML = "";
  if (!solved.checks.length) {
    box.innerHTML = '<p class="small">No cross-checks declared for this theater. The Graybook plot is a set of single positions; there is nothing yet to check one against another.</p>';
  }
  for (const c of solved.checks) {
    const d = document.createElement("div");
    d.className = `check ${c.contradiction ? "contradiction" : c.pass ? "pass" : "fail"}`;
    const verdict = c.contradiction
      ? (c.pass ? "CONTRADICTION STANDS" : "CONTRADICTION RESOLVED")
      : c.pass ? "AGREES" : "DISAGREES";
    let num = "";
    if (c.deltaNm != null) num = `residual ${c.deltaNm.toFixed(2)} NM` + (c.deltaBearingDeg != null ? ` · ${c.deltaBearingDeg.toFixed(1)}° in bearing` : "");
    else if (c.value != null) num = `model ${fmtNum(c.value)} vs. stated ${fmtNum(c.stated)}` + (c.ratio ? ` (×${c.ratio.toFixed(1)})` : "");
    d.innerHTML = `<div class="cverdict"></div><div class="clabel"></div><div class="cnum"></div>`;
    d.querySelector(".cverdict").textContent = verdict;
    d.querySelector(".clabel").textContent = c.label;
    d.querySelector(".cnum").textContent = num;
    d.addEventListener("click", () => openCheck(c));
    box.appendChild(d);
  }
  const ok = solved.checks.filter((c) => c.pass).length;
  $("statChecks").textContent = `checks: ${ok}/${solved.checks.length}`;
  $("statDem").textContent = `DEM: ${DEM_CONTROL[theater.id].control.length} control pts · ${grid.nx}×${grid.ny} · ${Math.round(grid.min)}…${Math.round(grid.max)} m`;
}

function fmtNum(v) {
  if (v == null) return "—";
  const n = Number(v);
  return Math.abs(n) >= 100 ? n.toFixed(0) : n.toFixed(2);
}

function renderJumpList() {
  const box = $("jumpList");
  box.innerHTML = "";
  for (const ev of solved.events) {
    const b = document.createElement("button");
    b.type = "button";
    b.innerHTML = `<span class="jt"></span><span class="jx"></span>`;
    b.querySelector(".jt").textContent = stamp(ev.t);
    b.querySelector(".jx").textContent = ev.label;
    b.addEventListener("click", () => {
      const f = (ev.t - solved.span.t0) / (solved.span.t1 - solved.span.t0 || 1);
      $("timeSlider").value = String(Math.round(f * 1000));
      applyTime();
      openEvent(ev);
    });
    box.appendChild(b);
  }
}

function renderPlateList() {
  const box = $("plateList");
  box.innerHTML = "";
  const mine = plates.plates.filter((p) => p.theater === theater.id);
  for (const p of mine) {
    const b = document.createElement("button");
    b.type = "button";
    b.innerHTML = `<span class="pt"></span><span class="ps"></span>`;
    b.querySelector(".pt").textContent = p.title;
    b.querySelector(".ps").textContent = `${p.bytes} B · ${p.zones} zones · stands for a real scan`;
    b.addEventListener("click", () => openPlate(p));
    box.appendChild(b);
  }
  $("statPlates").textContent = `plates: ${mine.length} DjVu · ${plates.plates.length} total`;
}

/* ---- the altitude chart -------------------------------------------------- */

function renderProfile() {
  const cv = $("profileChart");
  const ctx = cv.getContext("2d");
  const W = cv.width;
  const H = cv.height;
  ctx.clearRect(0, 0, W, H);
  const pr = solved.derived.profile;
  if (!pr) {
    $("profileNote").textContent = "No altitude series in this log set.";
    ctx.fillStyle = "#4a565c";
    ctx.font = "11px monospace";
    ctx.fillText("no vertical data", 12, H / 2);
    return;
  }
  const all = [...solved.derived.altitudeSystem, ...solved.derived.altitudeRecalled, ...(solved.derived.altitudeFall ?? [])];
  const rMax = Math.max(...all.map((s) => s.rangeNm)) * 1.05;
  const aMax = Math.max(...all.map((s) => s.alt)) * 1.12;
  const pad = { l: 34, r: 8, t: 10, b: 20 };
  const px = (r) => pad.l + (1 - r / rMax) * (W - pad.l - pad.r); // range decreases rightwards
  const py = (a) => H - pad.b - (a / aMax) * (H - pad.t - pad.b);

  ctx.strokeStyle = "#1d2b33";
  ctx.lineWidth = 1;
  ctx.font = "8px monospace";
  ctx.fillStyle = "#6d7b82";
  for (let a = 0; a <= aMax; a += 4000) {
    ctx.beginPath();
    ctx.moveTo(pad.l, py(a));
    ctx.lineTo(W - pad.r, py(a));
    ctx.stroke();
    ctx.fillText(`${a / 1000}k`, 4, py(a) + 3);
  }
  for (let r = 0; r <= rMax; r += 10) {
    ctx.beginPath();
    ctx.moveTo(px(r), pad.t);
    ctx.lineTo(px(r), H - pad.b);
    ctx.stroke();
    ctx.fillText(`${r}`, px(r) - 5, H - 7);
  }
  ctx.fillText("NM slant range \u2192 closing", pad.l, H - 0.5);

  const fitLine = (fit, color) => {
    ctx.strokeStyle = color;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(px(rMax), py(fit.fitRange.b + fit.perNm * rMax));
    ctx.lineTo(px(2), py(fit.fitRange.b + fit.perNm * 2));
    ctx.stroke();
    ctx.setLineDash([]);
  };
  fitLine(pr.system, "#3f6f68");
  fitLine(pr.recalled, "#8a3b3b");

  const series = (arr, color, r = 2.6) => {
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.beginPath();
    arr.forEach((s, i) => (i ? ctx.lineTo(px(s.rangeNm), py(s.alt)) : ctx.moveTo(px(s.rangeNm), py(s.alt))));
    ctx.globalAlpha = 0.65;
    ctx.stroke();
    ctx.globalAlpha = 1;
    for (const s of arr) {
      ctx.beginPath();
      ctx.arc(px(s.rangeNm), py(s.alt), r, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  series(solved.derived.altitudeSystem, "#7fd1c4");
  if (solved.derived.altitudeFall?.length) {
    ctx.globalAlpha = 0.4;
    series(solved.derived.altitudeFall, "#5a7f88", 1.8);
    ctx.globalAlpha = 1;
  }
  for (const s of solved.derived.altitudeRecalled) {
    ctx.fillStyle = s.agrees ? "#7fd1c4" : "#ff6b6b";
    ctx.beginPath();
    ctx.arc(px(s.rangeNm), py(s.alt), 3.4, 0, Math.PI * 2);
    ctx.fill();
    if (!s.agrees) {
      ctx.strokeStyle = "#ff6b6b55";
      ctx.beginPath();
      ctx.moveTo(px(s.rangeNm), py(s.alt));
      ctx.lineTo(px(s.rangeNm), py(pr.system.fitRange.b + pr.system.perNm * s.rangeNm));
      ctx.stroke();
    }
  }
  if (Number.isFinite(pr.crossRangeNm) && pr.crossRangeNm < rMax) {
    ctx.strokeStyle = "#b48cff";
    ctx.beginPath();
    ctx.arc(px(pr.crossRangeNm), py(pr.crossAltFt), 5, 0, Math.PI * 2);
    ctx.stroke();
  }

  $("profileNote").textContent =
    `Teal: the data-reduction tape, ${pr.system.perNm.toFixed(0)} ft per NM closed (R² ${pr.system.perNmR2.toFixed(3)}) — a steady climb. ` +
    `Red: altitudes as recalled in CIC, ${pr.recalled.perNm.toFixed(0)} ft/NM. Teal dots in the recalled set are the recollections the tape confirms. ` +
    `The fitted gradients cross at ${pr.crossRangeNm.toFixed(1)} NM.`;
}

/* =======================================================================
   inspector + pip windows
   ======================================================================= */

function srcLine(key) {
  const s = SOURCES[key];
  if (!s) return "";
  const a = s.url ? `<a href="${s.url}" target="_blank" rel="noopener">${esc(s.title)}</a>` : esc(s.title);
  return `<div class="srcline"><div class="small">${a}</div>${s.note ? `<p class="tiny">${esc(s.note)}</p>` : ""}</div>`;
}
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function flags(o) {
  const f = [];
  if (o.derived) f.push('<span class="flag derived">DERIVED</span>');
  if (o.assumed) f.push('<span class="flag assumed">ASSUMED</span>');
  if (o.disputed) f.push('<span class="flag disputed">DISPUTED</span>');
  if (o.bearingInterpolated || o.rangeNmInterpolated) f.push('<span class="flag interp">INTERPOLATED</span>');
  if (o.legIndex != null && o.legIndex >= 0 && !o.src) f.push('<span class="flag derived">DEAD RECKONED</span>');
  if (o.lagT != null) f.push('<span class="flag derived">STATION-KEEPING</span>');
  return f.join("");
}

function inspect(title, html) {
  $("infoTitle").textContent = title;
  $("infoBody").innerHTML = html;
}

function openSample(d) {
  const s = d.sample;
  const rows = [
    ["time", stamp(s.t)],
    ["position", dmPair(s)],
    s.alt ? ["altitude", `${Math.round(s.alt).toLocaleString()} ft`] : null,
    s.rangeNm != null ? ["slant range", `${s.rangeNm} NM from ${solved.ownship?.name ?? "datum"}`] : null,
    s.bearing != null ? ["bearing", `${Math.round(s.bearing).toString().padStart(3, "0")}°`] : null,
    s.speed != null ? ["speed", `${Math.round(s.speed)} kt`] : null,
    s.course != null ? ["course", `${Math.round(s.course).toString().padStart(3, "0")}°`] : null,
    s.groundRangeNm != null ? ["ground range", `${s.groundRangeNm.toFixed(2)} NM (slant corrected)`] : null,
  ].filter(Boolean);
  inspect(
    d.trackName,
    `<p class="small">${esc(s.label ?? "")}</p>${flags(s)}
     <dl>${rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("")}</dl>
     ${srcLine(s.src)}`
  );
}

function openEvent(ev) {
  inspect(
    stamp(ev.t),
    `<p>${esc(ev.label)}</p>${flags(ev)}${srcLine(ev.src)}`
  );
  wm?.spawn(`event:${ev.id}`);
}

function openCheck(c) {
  wm?.spawn(`check:${c.id}`);
}

async function openPlate(p) {
  wm?.spawn(`plate:${p.file}`);
}

/* =======================================================================
   picking
   ======================================================================= */

function pick(e) {
  pointer.x = (e.clientX / innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const vis = pickables.filter((o) => {
    let n = o;
    while (n) { if (n.visible === false) return false; n = n.parent; }
    return true;
  });
  return raycaster.intersectObjects(vis, false)[0] ?? null;
}

let hoverQueued = null;
function onHover(e) {
  if (hoverQueued) return;
  const ev = { clientX: e.clientX, clientY: e.clientY };
  hoverQueued = requestAnimationFrame(() => { hoverQueued = null; doHover(ev); });
}

function doHover(e) {
  const hit = pick(e);
  const tip = $("tooltip");
  if (!hit) { tip.classList.remove("on"); return; }
  const d = hit.object.userData;
  let txt = "";
  if (d.kind === "sample") txt = `${shortName(d.trackName)} · ${stamp(d.sample.t)}${d.sample.alt ? ` · ${Math.round(d.sample.alt).toLocaleString()} ft` : ""}<br>${esc(d.sample.label ?? "")}`;
  else if (d.kind === "event") txt = `${stamp(d.event.t)} · ${esc(d.event.label)}`;
  else if (d.kind === "check") txt = `${esc(d.check.label)} — ${d.which}`;
  else if (d.kind === "plate") txt = `${esc(d.plate.title)}<br><em>click to open the DjVu structure</em>`;
  else if (d.kind === "recalled") txt = `${esc(d.sample.station ?? "CIC")} recalled ${Math.round(d.sample.alt).toLocaleString()} ft at ${d.sample.rangeNm} NM`;
  else if (d.kind === "dem") {
    const pt = hit.point;
    txt = `DEM · ${Math.round((pt.y / VERT_EXAG) * NM_M)} m — control-point reconstruction, not a raster sample`;
  } else if (d.title) txt = esc(d.title);
  if (!txt) { tip.classList.remove("on"); return; }
  tip.innerHTML = txt;
  tip.style.left = `${Math.min(e.clientX + 14, innerWidth - 310)}px`;
  tip.style.top = `${e.clientY + 14}px`;
  tip.classList.add("on");
}

function onClick(e) {
  const hit = pick(e);
  if (!hit) return;
  const d = hit.object.userData;
  if (d.kind === "sample") openSample(d);
  else if (d.kind === "event") openEvent(d.event);
  else if (d.kind === "check") openCheck(d.check);
  else if (d.kind === "plate") openPlate(d.plate);
  else if (d.kind === "recalled") {
    const s = d.sample;
    inspect(
      `${s.station ?? "CIC"} · recalled`,
      `<p class="small">${esc(s.label)}</p>
       <dl><dt>recalled</dt><dd>${Math.round(s.alt).toLocaleString()} ft at ${s.rangeNm} NM</dd>
       <dt>tape</dt><dd>${Math.round(solved.derived.profile.system.fitRange.b + solved.derived.profile.system.perNm * s.rangeNm).toLocaleString()} ft at that range</dd>
       <dt>verdict</dt><dd>${s.agrees ? "the tape confirms this recollection" : "the tape does not support this"}</dd></dl>
       ${srcLine(s.src)}`
    );
  } else if (d.kind === "dem") {
    wm?.spawn("dem:about");
  } else if (d.kind === "crossing") {
    inspect("Where the two gradients cross", crossingHtml());
  }
}

function patrolHtml() {
  const d = solved.derived;
  return `<p>The northern screening force was ordered to patrol <strong>a five-mile square at ten knots, changing course ninety degrees every half hour</strong>. Those two clauses are the same fact stated twice: five miles at ten knots is <strong>${d.legSeconds} seconds</strong> — exactly half an hour.</p>
  <p class="small">Which means the patrol has no free parameters. Given the box centre, the side, the speed, the leg order and the time of the turn onto 045°, the ship's position at every instant of that night is determined. There is nothing left to assume. The start corner solves to <strong>${esc(dmPair(d.patrolStart))}</strong>.</p>
  <p class="small">That is the whole reason this theater is worth plotting: a log that survives only as a described geometry can be integrated back into a track, and the track can then be checked against the one position the record does give — where the ship went down.</p>`;
}

function crossingHtml() {
  const pr = solved.derived.profile;
  return `<p>The least-squares fit through the recorded altitudes and the fit through the recalled ones intersect at <strong>${pr.crossRangeNm.toFixed(1)} NM, ${Math.round(pr.crossAltFt).toLocaleString()} ft</strong>.</p>
  <p class="small">That is inside the band — "between 25 and 20 miles" — where the Combat Information Center first called the contact descending. Before that range the two accounts are close enough to be the same aircraft. After it they separate, and they separate in opposite directions: the tape climbs at ${pr.system.perNm.toFixed(0)} ft per mile closed, the recollections fall at ${Math.abs(pr.recalled.perNm).toFixed(0)}.</p>
  <p class="small">The slope ratio is ${pr.slopeRatio.toFixed(2)}. It is negative, so the sign of the error is real; it is not −1, so this was not a clean mirror image of the truth. Whatever produced it was not a simple inversion.</p>`;
}

/* =======================================================================
   pip window content
   ======================================================================= */

function findRecord(id) {
  const cut = id.indexOf(":");
  const kind = id.slice(0, cut);
  const rest = id.slice(cut + 1);
  let r = null;
  if (kind === "event") {
    const ev = solved.events.find((e) => e.id === rest);
    r = ev && { id, kind, ev };
  } else if (kind === "check") {
    const chk = solved.checks.find((c) => c.id === rest);
    r = chk && { id, kind, chk };
  } else if (kind === "plate") {
    const plate = plates.plates.find((p) => p.file === rest);
    r = plate && { id, kind, plate };
  } else if (kind === "dem") {
    r = { id, kind };
  } else if (kind === "file") {
    r = { id, kind, doc: platesLoaded.get(rest), file: rest };
  }
  if (r) r.name = titleFor(r); // the pip manager labels windows with r.name
  return r;
}

function titleFor(r) {
  if (r.kind === "event") return stamp(r.ev.t);
  if (r.kind === "check") return r.chk.label.slice(0, 40);
  if (r.kind === "plate") return r.plate.title.slice(0, 40);
  if (r.kind === "dem") return "Minimal USGS DEM";
  if (r.kind === "file") return r.file.slice(0, 40);
  return r.id;
}

function chipFor(r) {
  if (r.kind === "event") return { top: stamp(r.ev.t), sub: r.ev.label.slice(0, 26) };
  if (r.kind === "check") return { top: r.chk.pass ? "OK" : "\u2260", sub: r.chk.id };
  if (r.kind === "plate") return { top: "DJVU", sub: r.plate.file.split("/").pop().slice(0, 22) };
  if (r.kind === "dem") return { top: "DEM", sub: "provenance" };
  return { top: "FILE", sub: r.file?.slice(0, 22) ?? "" };
}

function detailHtml(r) {
  if (r.kind === "event") {
    return `<p>${esc(r.ev.label)}</p>${flags(r.ev)}${srcLine(r.ev.src)}`;
  }
  if (r.kind === "check") return checkHtml(r.chk);
  if (r.kind === "plate") return plateHtml(r.plate);
  if (r.kind === "dem") return demHtml();
  if (r.kind === "file") return fileHtml(r.doc, r.file);
  return "";
}

function checkHtml(c) {
  const rows = [];
  if (c.modeled) rows.push(["model says", dmPair(c.modeled)]);
  if (c.stated && c.stated.lat != null) rows.push(["source says", dmPair(c.stated)]);
  if (c.deltaNm != null) rows.push(["residual", `${c.deltaNm.toFixed(3)} NM`]);
  if (c.deltaBearingDeg != null) rows.push(["bearing residual", `${c.deltaBearingDeg.toFixed(2)}°`]);
  if (c.value != null) rows.push(["computed", fmtNum(c.value)]);
  if (c.stated != null && c.stated.lat == null) rows.push(["stated", fmtNum(c.stated)]);
  if (c.ratio) rows.push(["ratio", `×${c.ratio.toFixed(2)}`]);
  return `<p><strong>${c.contradiction ? (c.pass ? "The contradiction stands." : "The contradiction has gone away — check the data.") : c.pass ? "These agree." : "These do not agree."}</strong></p>
  <dl>${rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("")}</dl>
  <p class="small" style="margin-top:8px">${esc(c.note ?? "")}</p>
  ${c.resolution ? `<p class="small"><em>${esc(c.resolution)}</em></p>` : ""}
  ${(c.sources ?? []).map(srcLine).join("")}`;
}

function demHtml() {
  const t = DEM_CONTROL[theater.id];
  return `<p><strong>This terrain is a reconstruction, and the distinction matters.</strong></p>
  <p class="small">${esc(DEM_META.status)}. ${esc(t.note)}</p>
  <p class="small">The elevations are published spot heights and soundings — ${t.control.length} of them for this theater — interpolated onto a ${grid.nx}×${grid.ny} grid with an inverse-distance kernel, a per-island coastal taper and a ${t.shelfDeg}° shelf. It is not a sample of a USGS raster.</p>
  <p class="small">It is not, because none of these three theaters is in 3DEP: 3DEP is the United States. The USGS/EROS products that <em>do</em> cover the Strait of Hormuz and the Solomons are global ones you have to fetch and clip:</p>
  <table>${DEM_META.products.map((p) => `<tr><th>${esc(p.name)}</th><td>${esc(p.resolution)}<br><span class="small">${esc(p.coverage)}</span>${p.unusable ? "<br><em>no coverage here</em>" : ""}</td></tr>`).join("")}</table>
  <p class="small" style="margin-top:8px">Swap a real clip in:</p>
  <pre>${esc(DEM_META.swapIn)}</pre>
  <p class="tiny">Control points for this theater:</p>
  <table>${t.control.map((c) => `<tr><th>${esc(c.name)}</th><td>${c.elev} m<br><span class="tiny">${esc(c.src)}</span></td></tr>`).join("")}</table>`;
}

function plateHtml(p) {
  const doc = platesLoaded.get(p.file);
  if (!doc) {
    loadPlate(p).then(() => {
      // the window is already open; re-render its body in place
      const body = document.querySelector(`.pip4[data-pip="plate:${CSS.escape(p.file)}"] .pip4-body`);
      if (body) body.innerHTML = plateHtml(p);
    });
    return `<p class="small">reading ${esc(p.file)}\u2026</p>`;
  }
  const page = doc.pages[0];
  const txt = page?.text?.[0];
  const lines = zonesOfKind(txt?.zones ?? [], "line");
  return `<p class="small">${esc(p.standsFor)}</p>
  <p class="tiny">This file is a generated fixture: a real DjVu byte stream carrying the transcribed text of the page it stands for, with no image layer. The document itself is at <a href="${p.url}" target="_blank" rel="noopener">the link below</a>. The reader below is the same code path a real scan goes through.</p>
  <dl>
    <dt>page</dt><dd>${page?.info?.width}×${page?.info?.height} px at ${page?.info?.dpi} dpi (${page?.info?.inchesWide?.toFixed(1)}×${page?.info?.inchesHigh?.toFixed(1)} in)</dd>
    <dt>DjVu version</dt><dd>${page?.info?.version}.${page?.info?.versionMinor}</dd>
    <dt>hidden text</dt><dd>${txt?.text?.length ?? 0} chars, ${txt?.zoneCount ?? 0} zones, tree ${esc(txt?.zoneParse ?? "?")}</dd>
  </dl>
  <p class="tiny" style="margin-top:8px">IFF85 chunk structure:</p>
  <pre>${esc(dump(doc))}</pre>
  <p class="tiny">Hidden-text layer, rendered from the zone tree:</p>
  <div class="platepage">${lines.map((z) => esc(z.text)).join("\n")}</div>
  <p class="tiny">Not decoded in this reader: ${doc.capabilities.notDecoded.join(", ")} — ${esc(doc.capabilities.reason)}.</p>
  <div class="srcline"><a href="${p.url}" target="_blank" rel="noopener">${esc(p.title)}</a></div>`;
}

function fileHtml(doc, name) {
  if (!doc) return `<p class="small">could not read ${esc(name)}</p>`;
  if (doc.iaXml) {
    const pg = doc.pages[0];
    return `<p class="small">Internet Archive <code>_djvu.xml</code> derivative — ABBYY word boxes in DjVu page coordinates.</p>
    <dl><dt>pages</dt><dd>${doc.pages.length}</dd><dt>page 1</dt><dd>${pg?.width}×${pg?.height} at ${pg?.dpi} dpi, ${pg?.words.length} words</dd></dl>
    <div class="platepage">${esc((pg?.words ?? []).slice(0, 400).map((w) => w.text).join(" "))}</div>`;
  }
  const page = doc.pages[0];
  const txt = page?.text?.[0];
  return `<p class="small">${doc.bytes.toLocaleString()} bytes · magic ${doc.magic ? "AT&T \u2713" : "missing"} · ${doc.pages.length} page(s)</p>
  ${doc.warnings.length ? `<p class="tiny">${doc.warnings.map(esc).join("<br>")}</p>` : ""}
  <pre>${esc(dump(doc))}</pre>
  ${txt?.text ? `<p class="tiny">hidden text (${txt.text.length} chars, zones ${txt.zoneParse}):</p><div class="platepage">${esc(txt.text.slice(0, 4000))}</div>` : "<p class=\"tiny\">No uncompressed TXTa layer. If this page has TXTz, it is BZZ-compressed and this reader reports it without decoding it — run <code>djvused -e 'print-pure-txt'</code> or fetch the Internet Archive <code>_djvu.xml</code>.</p>"}`;
}

async function loadPlate(p) {
  try {
    const res = await fetch(`./data/vincennes/${p.file}`);
    const buf = new Uint8Array(await res.arrayBuffer());
    platesLoaded.set(p.file, parseDjvu(buf));
  } catch (err) {
    status(`plate read failed: ${err.message}`);
  }
}

/* =======================================================================
   drag and drop a real file
   ======================================================================= */

function initDrop() {
  const hint = document.querySelector(".drop-hint");
  const input = $("djvuFile");
  hint.addEventListener("click", () => input.click());
  input.addEventListener("change", () => input.files[0] && readUserFile(input.files[0]));
  for (const ev of ["dragenter", "dragover"]) {
    addEventListener(ev, (e) => { e.preventDefault(); hint.classList.add("over"); });
  }
  for (const ev of ["dragleave", "drop"]) {
    addEventListener(ev, (e) => { e.preventDefault(); hint.classList.remove("over"); });
  }
  addEventListener("drop", (e) => {
    const f = e.dataTransfer?.files?.[0];
    if (f) readUserFile(f);
  });
}

async function readUserFile(file) {
  const name = file.name;
  try {
    if (/\.xml$/i.test(name)) {
      const doc = parseIaDjvuXml(await file.text());
      doc.iaXml = true;
      platesLoaded.set(name, doc);
      status(`read ${name}: ${doc.pages.length} page(s), ${doc.pages[0]?.words.length ?? 0} word boxes`);
    } else {
      const doc = parseDjvu(new Uint8Array(await file.arrayBuffer()));
      platesLoaded.set(name, doc);
      status(`read ${name}: ${doc.inventory.length} chunks, ${doc.pages.length} page(s)${doc.warnings.length ? `, ${doc.warnings.length} warning(s)` : ""}`);
    }
    wm?.spawn(`file:${name}`);
  } catch (err) {
    status(`could not read ${name}: ${err.message}`);
  }
}

/* =======================================================================
   camera, loop, wiring
   ======================================================================= */

function frameCamera() {
  const s = theater.viewSpanNm;
  controls.target.set(0, s * 0.06, 0);
  setTilt(tilted, s);
}
function setTilt(on, span = theater.viewSpanNm) {
  tilted = on;
  if (on) camera.position.set(span * 0.55, span * 0.62, span * 0.95);
  else camera.position.set(0, span * 1.5, 0.01);
  camera.updateProjectionMatrix();
  controls.update();
  $("btnTilt").classList.toggle("active", on);
}

function updateLabels() {
  const v = new THREE.Vector3();
  for (const { el, pos, layerId } of labelEls) {
    if (layerId && layers.get(layerId)?.on === false) { el.style.display = "none"; continue; }
    v.copy(pos).project(camera);
    const on = v.z < 1 && v.x > -1.2 && v.x < 1.2 && v.y > -1.2 && v.y < 1.2;
    el.style.display = on ? "" : "none";
    if (!on) continue;
    el.style.left = `${((v.x + 1) / 2) * innerWidth}px`;
    el.style.top = `${((1 - v.y) / 2) * innerHeight}px`;
  }
}

function status(m) { $("status").textContent = m; }

function loop(ts) {
  requestAnimationFrame(loop);
  const dt = (ts - lastFrame) / 1000 || 0;
  lastFrame = ts;
  if (playing) {
    const dur = theater.multiDay ? 26 : 18; // seconds of wall clock for the whole span
    const step = (1000 / dur) * dt * speed;
    let v = Number($("timeSlider").value) + step;
    if (v >= 1000) { v = 1000; playing = false; $("btnPlay").textContent = "\u25b6"; }
    $("timeSlider").value = String(v);
    applyTime();
  }
  controls.update();
  updateLabels();
  renderer.render(scene, camera);
}

function wire() {
  for (const b of document.querySelectorAll("[data-theater]")) {
    b.addEventListener("click", () => {
      for (const o of document.querySelectorAll("[data-theater]")) o.classList.toggle("active", o === b);
      wm?.clear();
      build(b.dataset.theater);
    });
  }
  $("btnTilt").addEventListener("click", () => setTilt(!tilted));
  $("btnReset").addEventListener("click", () => frameCamera());
  $("timeSlider").addEventListener("input", applyTime);
  $("btnPlay").addEventListener("click", () => {
    playing = !playing;
    if (playing && Number($("timeSlider").value) >= 1000) $("timeSlider").value = "0";
    $("btnPlay").textContent = playing ? "\u2016" : "\u25b6";
  });
  $("btnSpeed").addEventListener("click", () => {
    speed = speed === 1 ? 2 : speed === 2 ? 4 : speed === 4 ? 0.5 : 1;
    $("btnSpeed").textContent = `${speed}\u00d7`;
  });
  for (const b of document.querySelectorAll("[data-layers]")) {
    b.addEventListener("click", () => {
      const mode = b.dataset.layers;
      for (const L of layers.values()) {
        const on = mode === "all" ? true : mode === "none" ? false : Boolean(L.trackId) || L.id === "events" || L.id === "board";
        setLayer(L.id, on);
      }
    });
  }
  addEventListener("keydown", (e) => {
    if (e.target.matches("input, textarea")) return;
    if (e.key === " ") { e.preventDefault(); $("btnPlay").click(); }
    if (e.key === "t") setTilt(!tilted);
    if (e.key === "r") frameCamera();
  });
}

async function main() {
  initGL();
  wire();
  initDrop();
  wm = initPipWm({
    layer: $("pipLayer"),
    desk: $("wm4dDesk"),
    tray: $("wm4dTray"),
    status: $("wm4dStatus"),
    findRecord,
    titleFor,
    chipFor,
    detailHtml,
  });
  try {
    const res = await fetch("./data/vincennes/plates.json");
    plates = await res.json();
  } catch {
    plates = { meta: null, plates: [] };
  }
  build("hormuz-1988");
  requestAnimationFrame(loop);
}

main();
