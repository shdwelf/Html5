/** GOD'S EYE VIEW — HTML5 / webxdc conversion
 *  ============================================================
 *  Original: https://github.com/bilawalsidhu/gods-eye-view (MIT)
 *  A spy-satellite console for planet Earth, rebuilt as a static,
 *  keyless, offline-first HTML5 page that also speaks webxdc.
 *
 *  Live public feeds (no API keys):
 *    · satellites  — Celestrak GP (TLE) + satellite.js SGP4
 *    · aircraft    — adsb.lol v2 (regional + military)
 *    · earthquakes — USGS GeoJSON feeds
 *    · ships       — SIMULATED lanes (AIS needs a key; labeled as such)
 *  Basemap: Natural Earth vector landmass drawn to a canvas texture,
 *  with an optional remote NASA Blue Marble imagery upgrade.
 */
import * as THREE from "../vendor/three.module.min.js";
import { OrbitControls } from "../vendor/OrbitControls.js";
import * as sat from "../vendor/satellite/index.js";

/* ------------------------------------------------------------------ */
/* constants                                                           */
/* ------------------------------------------------------------------ */
const R = 100;                     // globe radius, three.js units
const KM = R / 6371;               // units per kilometre
const MAX_SATS = 512;
const MAX_AIR = 4096;
const MAX_MIL = 1024;
const MAX_QUAKE = 1200;
const SHIP_COUNT = 148;

const $ = (id) => document.getElementById(id);

const STYLES = ["standard", "crt", "nvg", "flir", "noir", "snow"];

const SAT_GROUPS = [
  { id: "stations", label: "STATIONS", color: new THREE.Color(0x7dffb0), cap: 64 },
  { id: "gps-ops", label: "GPS", color: new THREE.Color(0xffc861), cap: 48 },
  { id: "weather", label: "WEATHER", color: new THREE.Color(0x5cd6ff), cap: 140 },
];
const CELESTRAK = [
  (g) => `https://celestrak.org/NORAD/elements/gp.php?GROUP=${g}&FORMAT=tle`,
  (g) => `https://celestrak.com/NORAD/elements/gp.php?GROUP=${g}&FORMAT=tle`,
];

/* ------------------------------------------------------------------ */
/* tiny helpers                                                        */
/* ------------------------------------------------------------------ */
const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const utc = (d = new Date()) =>
  d.toISOString().slice(11, 19) + "Z";

function latLngToVector3(lat, lon, r, out = new THREE.Vector3()) {
  const phi = rad(90 - lat);
  const theta = rad(lon + 180);
  out.set(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
  return out;
}

function vector3ToLatLng(v) {
  const r = v.length();
  const lat = 90 - deg(Math.acos(clamp(v.y / r, -1, 1)));
  let lon = deg(Math.atan2(v.z, -v.x)) - 180;
  if (lon < -180) lon += 360;
  if (lon > 180) lon -= 360;
  return { lat, lon, r };
}

async function fetchJson(url, { timeout = 15000, headers = {} } = {}) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeout);
  try {
    const res = await fetch(url, { signal: ctl.signal, headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchText(url, { timeout = 20000 } = {}) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeout);
  try {
    const res = await fetch(url, { signal: ctl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

function ageText(ms) {
  const s = Math.max(0, ms / 1000);
  if (s < 90) return `${Math.round(s)}s`;
  if (s < 5400) return `${Math.round(s / 60)}m`;
  if (s < 172800) return `${(s / 3600).toFixed(1)}h`;
  return `${Math.round(s / 86400)}d`;
}

/* ------------------------------------------------------------------ */
/* gazetteer (command console)                                         */
/* ------------------------------------------------------------------ */
const PLACES = [
  ["tokyo", 35.68, 139.69], ["delhi", 28.61, 77.21], ["shanghai", 31.23, 121.47],
  ["beijing", 39.9, 116.4], ["sao paulo", -23.55, -46.63], ["rio", -22.91, -43.17],
  ["cairo", 30.04, 31.24], ["lagos", 6.52, 3.38], ["kinshasa", -4.44, 15.27],
  ["nairobi", -1.29, 36.82], ["johannesburg", -26.2, 28.05], ["casablanca", 33.57, -7.59],
  ["mexico city", 19.43, -99.13], ["new york", 40.71, -74.01], ["nyc", 40.71, -74.01],
  ["los angeles", 34.05, -118.24], ["chicago", 41.88, -87.63], ["san francisco", 37.77, -122.42],
  ["seattle", 47.61, -122.33], ["denver", 39.74, -104.99], ["miami", 25.76, -80.19],
  ["atlanta", 33.75, -84.39], ["houston", 29.76, -95.37], ["dallas", 32.78, -96.8],
  ["toronto", 43.65, -79.38], ["vancouver", 49.28, -123.12], ["honolulu", 21.31, -157.86],
  ["anchorage", 61.22, -149.9], ["london", 51.51, -0.13], ["paris", 48.86, 2.35],
  ["berlin", 52.52, 13.4], ["madrid", 40.42, -3.7], ["rome", 41.9, 12.5],
  ["kyiv", 50.45, 30.52], ["moscow", 55.76, 37.62], ["istanbul", 41.01, 28.98],
  ["athens", 37.98, 23.73], ["oslo", 59.91, 10.75], ["reykjavik", 64.15, -21.94],
  ["dubai", 25.2, 55.27], ["tehran", 35.69, 51.39], ["karachi", 24.86, 67.0],
  ["mumbai", 19.08, 72.88], ["kolkata", 22.57, 88.36], ["dhaka", 23.81, 90.41],
  ["bangkok", 13.76, 100.5], ["hanoi", 21.03, 105.85], ["manila", 14.6, 120.98],
  ["jakarta", -6.21, 106.85], ["singapore", 1.35, 103.82], ["seoul", 37.57, 126.98],
  ["taipei", 25.03, 121.57], ["sydney", -33.87, 151.21], ["auckland", -36.85, 174.76],
  ["buenos aires", -34.6, -58.38], ["santiago", -33.45, -70.67], ["lima", -12.05, -77.04],
  ["bogota", 4.71, -74.07], ["havana", 23.11, -82.37], ["anchorage", 61.22, -149.9],
  ["kabul", 34.56, 69.21], ["baghdad", 33.31, 44.36], ["riyadh", 24.71, 46.68],
  ["addis ababa", 9.02, 38.75], ["accra", 5.6, -0.19], ["cape town", -33.92, 18.42],
  ["svalbard", 78.22, 15.63], ["greenwich", 51.48, 0.0],
];
const AIRPORTS = [
  ["lax", 33.94, -118.41], ["jfk", 40.64, -73.78], ["ord", 41.97, -87.91],
  ["lhr", 51.47, -0.45], ["cdg", 49.01, 2.55], ["fra", 50.03, 8.56],
  ["ams", 52.31, 4.76], ["hnd", 35.55, 139.78], ["nrt", 35.77, 140.39],
  ["sin", 1.36, 103.99], ["dxb", 25.25, 55.36], ["hkg", 22.31, 113.91],
  ["icn", 37.46, 126.44], ["syd", -33.95, 151.18], ["gru", -23.43, -46.47],
  ["mex", 19.44, -99.07], ["ist", 41.26, 28.74], ["del", 28.55, 77.1],
  ["pek", 40.08, 116.58], ["sfo", 37.62, -122.38], ["atl", 33.64, -84.43],
  ["dfw", 32.9, -97.04], ["den", 39.86, -104.67], ["sea", 47.45, -122.31],
];

/* major ports for the simulated shipping layer */
const PORTS = [
  ["SIN", 1.26, 103.84], ["RTM", 51.95, 4.14], ["SHA", 31.23, 121.75],
  ["NGB", 29.87, 121.87], ["LAX", 33.72, -118.26], ["NYC", 40.67, -74.04],
  ["HKG", 22.3, 114.18], ["DXB", 25.27, 55.3], ["HAM", 53.54, 9.97],
  ["SSZ", -23.97, -46.3], ["DUR", -29.87, 31.03], ["PUS", 35.1, 129.04],
  ["YOK", 35.44, 139.65], ["PIR", 37.94, 23.62], ["CTG", 22.33, 91.81],
  ["LON", 51.5, 1.0],
];
const LANES = [
  [0, 1], [2, 7], [3, 4], [5, 1], [6, 8], [0, 11], [2, 12], [9, 10],
  [4, 5], [7, 13], [10, 0], [11, 2], [14, 0], [15, 1], [13, 7], [9, 5],
];

/* ------------------------------------------------------------------ */
/* boot log + syslog                                                   */
/* ------------------------------------------------------------------ */
const bootLog = $("bootLog");
const syslogEl = $("syslog");
const bootBar = $("bootBar");
let bootStep = 0;
const BOOT_STEPS = 9;

function log(msg, cls = "") {
  const line = document.createElement("div");
  const t = document.createElement("span");
  t.className = "t";
  t.textContent = utc() + " ";
  line.appendChild(t);
  const m = document.createElement("span");
  if (cls) m.className = cls;
  m.textContent = msg;
  line.appendChild(m);
  syslogEl.prepend(line);
  while (syslogEl.childElementCount > 60) syslogEl.lastChild.remove();
}

function boot(msg) {
  bootStep = Math.min(BOOT_STEPS, bootStep + 1);
  bootBar.style.width = `${(bootStep / BOOT_STEPS) * 100}%`;
  bootLog.textContent += `${utc()} ${msg}\n`;
  bootLog.scrollTop = bootLog.scrollHeight;
  log(msg, "ok");
}

/* ------------------------------------------------------------------ */
/* scene                                                               */
/* ------------------------------------------------------------------ */
const renderer = new THREE.WebGLRenderer({ canvas: $("stage"), antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x010403);

const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.05, 14000);
camera.position.copy(latLngToVector3(24, 12, R * 3.1));

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.rotateSpeed = 0.55;
controls.enablePan = false;
controls.minDistance = R * 1.004;
controls.maxDistance = R * 9;

/* stars */
{
  const n = 2600;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const v = new THREE.Vector3().randomDirection().multiplyScalar(2400 + Math.random() * 900);
    pos.set([v.x, v.y, v.z], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({
    color: 0x9fd8c0, size: 1.4, sizeAttenuation: false, transparent: true, opacity: 0.75, depthWrite: false,
  })));
}

/* atmosphere glow */
{
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(R * 1.16, 48, 48),
    new THREE.ShaderMaterial({
      uniforms: { c: { value: 0.42 }, p: { value: 4.2 }, glowColor: { value: new THREE.Color(0x2f8f6a) } },
      vertexShader: `
        varying float intensity;
        uniform float c; uniform float p;
        void main() {
          vec3 vNormal = normalize(normalMatrix * normal);
          intensity = pow(c - dot(vNormal, vec3(0.0, 0.0, 1.0)), p);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform vec3 glowColor; varying float intensity;
        void main() { gl_FragColor = vec4(glowColor * intensity, intensity); }`,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    })
  );
  scene.add(glow);
}

/* globe */
const globeCanvas = document.createElement("canvas");
globeCanvas.width = 2048;
globeCanvas.height = 1024;
const globeTexture = new THREE.CanvasTexture(globeCanvas);
globeTexture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
globeTexture.colorSpace = THREE.SRGBColorSpace;
const globe = new THREE.Mesh(
  new THREE.SphereGeometry(R, 96, 96),
  new THREE.MeshBasicMaterial({ map: globeTexture })
);
scene.add(globe);

/* ------------------------------------------------------------------ */
/* vector basemap (Natural Earth → canvas)                             */
/* ------------------------------------------------------------------ */
function drawBaseTexture() {
  const ctx = globeCanvas.getContext("2d");
  const w = globeCanvas.width, h = globeCanvas.height;
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "#041018");
  grad.addColorStop(0.5, "#03141d");
  grad.addColorStop(1, "#041018");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  const px = (lon) => ((lon + 180) / 360) * w;
  const py = (lat) => ((90 - lat) / 180) * h;

  if (window.__gevCountries) {
    ctx.fillStyle = "#0a1c12";
    ctx.strokeStyle = "rgba(88, 200, 140, 0.42)";
    ctx.lineWidth = 1;
    const drawRing = (ring) => {
      ctx.beginPath();
      ring.forEach(([lon, lat], i) => {
        const x = px(lon), y = py(lat);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    };
    for (const f of window.__gevCountries.features) {
      const g = f.geometry;
      if (!g) continue;
      if (g.type === "Polygon") g.coordinates.forEach(drawRing);
      else if (g.type === "MultiPolygon") g.coordinates.forEach((poly) => poly.forEach(drawRing));
    }
  }

  /* graticule */
  ctx.strokeStyle = "rgba(92, 214, 255, 0.07)";
  ctx.lineWidth = 1;
  for (let lon = -180; lon <= 180; lon += 15) {
    ctx.beginPath(); ctx.moveTo(px(lon), 0); ctx.lineTo(px(lon), h); ctx.stroke();
  }
  for (let lat = -75; lat <= 75; lat += 15) {
    ctx.beginPath(); ctx.moveTo(0, py(lat)); ctx.lineTo(w, py(lat)); ctx.stroke();
  }
  ctx.strokeStyle = "rgba(92, 214, 255, 0.16)";
  ctx.beginPath(); ctx.moveTo(0, py(0)); ctx.lineTo(w, py(0)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(px(0), 0); ctx.lineTo(px(0), h); ctx.stroke();
  globeTexture.needsUpdate = true;
}

async function loadCountries() {
  try {
    const gj = await fetchJson("./vendor/world/countries.geo.json", { timeout: 12000 });
    window.__gevCountries = gj;
    boot(`basemap: ${gj.features.length} landmass polygons`);
  } catch (err) {
    log(`basemap: vector land unavailable (${err.message || err})`, "warn");
  }
  drawBaseTexture();
}

async function upgradeImagery() {
  const urls = [
    "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg",
    "https://raw.githubusercontent.com/turban/webgl-earth/master/images/2_no_clouds_4096.jpg",
  ];
  for (const url of urls) {
    try {
      const tex = await new Promise((resolve, reject) => {
        new THREE.TextureLoader().load(url, resolve, undefined, reject);
      });
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = globeTexture.anisotropy;
      globe.material.map = tex;
      globe.material.needsUpdate = true;
      $("srcChip").textContent = "IMAGERY · NASA BLUE MARBLE";
      log("basemap: photoreal imagery online", "ok");
      return;
    } catch { /* try next */ }
  }
  log("basemap: imagery offline — vector earth holds", "warn");
}

/* ------------------------------------------------------------------ */
/* layer state                                                         */
/* ------------------------------------------------------------------ */
const LAYERS = {
  sats: { label: "SATELLITES", on: true, status: "SYNC" },
  flights: { label: "AIRCRAFT", on: true, status: "SYNC" },
  mil: { label: "MIL AIR", on: false, status: "SYNC" },
  quakes: { label: "QUAKES", on: true, status: "SYNC" },
  ships: { label: "SHIPS", on: true, status: "SIM" },
};
const counts = { sats: 0, flights: 0, mil: 0, quakes: 0, ships: 0 };

function makePoints(max, size, blending = THREE.NormalBlending) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(max * 3), 3));
  geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(max * 3), 3));
  geo.setDrawRange(0, 0);
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({
    size, vertexColors: true, sizeAttenuation: false, transparent: true, opacity: 0.95,
    depthWrite: false, blending,
  }));
  pts.frustumCulled = false;
  return pts;
}

const satPoints = makePoints(MAX_SATS, 5);
const issPoint = makePoints(1, 9, THREE.AdditiveBlending);
const airPoints = makePoints(MAX_AIR, 5);
const milPoints = makePoints(MAX_MIL, 6, THREE.AdditiveBlending);
const quakeSmall = makePoints(MAX_QUAKE, 4);
const quakeMid = makePoints(MAX_QUAKE, 7);
const quakeBig = makePoints(MAX_QUAKE, 11, THREE.AdditiveBlending);
const shipPoints = makePoints(SHIP_COUNT, 4);
scene.add(satPoints, issPoint, airPoints, milPoints, quakeSmall, quakeMid, quakeBig, shipPoints);

const pickables = [satPoints, issPoint, airPoints, milPoints, quakeSmall, quakeMid, quakeBig, shipPoints];

/* trail for tracked targets */
const TRAIL_MAX = 220;
const trailGeo = new THREE.BufferGeometry();
trailGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(TRAIL_MAX * 3), 3));
trailGeo.setDrawRange(0, 0);
const trail = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({
  color: 0xffc861, transparent: true, opacity: 0.55, depthWrite: false,
}));
trail.frustumCulled = false;
trail.visible = false;
scene.add(trail);
const trailPts = [];

/* quake pulse sprites */
const pulseTex = (() => {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const x = c.getContext("2d");
  x.strokeStyle = "rgba(255,150,90,0.95)";
  x.lineWidth = 5;
  x.beginPath();
  x.arc(64, 64, 52, 0, Math.PI * 2);
  x.stroke();
  return new THREE.CanvasTexture(c);
})();
let pulses = [];

/* ------------------------------------------------------------------ */
/* SAT layer — Celestrak TLE + SGP4                                    */
/* ------------------------------------------------------------------ */
const satellites = [];   // {name, norad, satrec, group, color, lat, lon, altKm, dead}
let satReady = false;

function parseTLE(text) {
  const lines = text.split(/\r?\n/).map((s) => s.trimEnd()).filter((s) => s.trim().length);
  const out = [];
  let name = null;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^1 /.test(l) && /^2 /.test(lines[i + 1] || "")) {
      out.push({ name: (name || l.slice(2, 12)).trim(), l1: l, l2: lines[i + 1] });
      i++;
    } else {
      name = l;
    }
  }
  return out;
}

async function loadSatGroup(group) {
  let lastErr;
  for (const mk of CELESTRAK) {
    try {
      const text = await fetchText(mk(group.id));
      return parseTLE(text).slice(0, group.cap);
    } catch (err) { lastErr = err; }
  }
  throw lastErr || new Error("no mirror");
}

async function loadSatellites() {
  let loaded = 0;
  for (const group of SAT_GROUPS) {
    try {
      const entries = await loadSatGroup(group);
      for (const e of entries) {
        if (satellites.length >= MAX_SATS) break;
        const satrec = sat.twoline2satrec(e.l1, e.l2);
        if (satrec.error !== 0) continue;
        satellites.push({
          name: e.name,
          norad: e.l1.substring(2, 7).trim(),
          satrec,
          group: group.label,
          color: group.color,
          lat: 0, lon: 0, altKm: 400, dead: false,
        });
        loaded++;
      }
      log(`sats: ${group.label} +${entries.length} TLE`, "ok");
    } catch (err) {
      log(`sats: ${group.label} offline (${err.message || err})`, "err");
      LAYERS.sats.status = "OFFLINE";
    }
  }
  counts.sats = loaded;
  satReady = loaded > 0;
  if (loaded) LAYERS.sats.status = "LIVE";
  renderLayerChips();
}

const _satV = new THREE.Vector3();
function propagateSatellites(now) {
  const d = new Date(now);
  const gmst = sat.gstime(d);
  const pos = satPoints.geometry.attributes.position.array;
  const col = satPoints.geometry.attributes.color.array;
  let n = 0;
  let iss = null;
  for (const s of satellites) {
    const pv = sat.propagate(s.satrec, d);
    if (!pv || !pv.position || !Number.isFinite(pv.position.x)) { s.dead = true; continue; }
    const geo = sat.eciToGeodetic(pv.position, gmst);
    s.lat = sat.degreesLat(geo.latitude);
    s.lon = sat.degreesLong(geo.longitude);
    s.altKm = geo.height;
    s.dead = false;
    if (s.norad === "25544") iss = s;
    if (n < MAX_SATS) {
      latLngToVector3(s.lat, s.lon, R + s.altKm * KM, _satV);
      pos[n * 3] = _satV.x; pos[n * 3 + 1] = _satV.y; pos[n * 3 + 2] = _satV.z;
      col[n * 3] = s.color.r; col[n * 3 + 1] = s.color.g; col[n * 3 + 2] = s.color.b;
      n++;
    }
  }
  satPoints.geometry.setDrawRange(0, n);
  satPoints.geometry.attributes.position.needsUpdate = true;
  satPoints.geometry.attributes.color.needsUpdate = true;

  if (iss) {
    latLngToVector3(iss.lat, iss.lon, R + iss.altKm * KM, _satV);
    const p = issPoint.geometry.attributes.position.array;
    p[0] = _satV.x; p[1] = _satV.y; p[2] = _satV.z;
    const c = issPoint.geometry.attributes.color.array;
    c[0] = 1; c[1] = 0.85; c[2] = 0.4;
    issPoint.geometry.setDrawRange(0, 1);
    issPoint.geometry.attributes.position.needsUpdate = true;
    issPoint.geometry.attributes.color.needsUpdate = true;
  } else {
    issPoint.geometry.setDrawRange(0, 0);
  }
}

function satOrbitRing(s, group) {
  const periodMin = (2 * Math.PI) / s.satrec.no;
  const pts = [];
  const d = new Date();
  const gmst0 = sat.gstime(d);
  for (let i = 0; i <= 128; i++) {
    const t = new Date(d.getTime() + (i / 128) * periodMin * 60000);
    const pv = sat.propagate(s.satrec, t);
    if (!pv || !pv.position) continue;
    const gmst = i === 0 ? gmst0 : sat.gstime(t);
    const geo = sat.eciToGeodetic(pv.position, gmst);
    pts.push(latLngToVector3(sat.degreesLat(geo.latitude), sat.degreesLong(geo.longitude), R + geo.height * KM));
  }
  if (pts.length < 8) return;
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const ring = new THREE.Line(geo, new THREE.LineBasicMaterial({
    color: 0xffc861, transparent: true, opacity: 0.4, depthWrite: false,
  }));
  ring.frustumCulled = false;
  group.add(ring);
}

/* ------------------------------------------------------------------ */
/* AIR layer — adsb.lol v2 (keyless, regional + mil)                   */
/* ------------------------------------------------------------------ */
const aircraft = new Map(); // hex → record
let airLastPoll = 0;
let airSource = null;

function airAnchor() {
  if (tracked && tracked.kind === "flight" && tracked.ref) {
    return { lat: tracked.ref.lat, lon: tracked.ref.lon };
  }
  const sub = vector3ToLatLng(camera.position);
  return { lat: sub.lat, lon: sub.lon };
}

function ingestAdsbLol(payload, mil) {
  const list = payload?.ac;
  if (!Array.isArray(list)) throw new Error("bad payload");
  const nowMs = (payload.now || Date.now() / 1000) * 1000;
  let kept = 0;
  for (const ac of list) {
    if (typeof ac.lat !== "number" || typeof ac.lon !== "number") continue;
    const hex = String(ac.hex || "").toLowerCase();
    if (!hex) continue;
    if (mil && !aircraft.has(hex)) {
      if ([...aircraft.values()].filter((a) => a.mil).length >= MAX_MIL) break;
    }
    const prev = aircraft.get(hex);
    aircraft.set(hex, {
      hex,
      mil: !!mil,
      flight: (ac.flight || ac.r || "").trim() || null,
      type: ac.t || ac.type || null,
      lat: ac.lat,
      lon: ac.lon,
      altFt: typeof ac.alt_baro === "number" ? ac.alt_baro : (typeof ac.alt_geom === "number" ? ac.alt_geom : null),
      gs: typeof ac.gs === "number" ? ac.gs : null,
      track: typeof ac.track === "number" ? ac.track : null,
      vs: typeof ac.baro_rate === "number" ? ac.baro_rate : null,
      ts: nowMs - ((ac.seen_pos ?? ac.seen ?? 0) * 1000),
      first: prev ? prev.first : nowMs,
      seen: true,
    });
    kept++;
  }
  return kept;
}

async function pollAircraft() {
  if (!LAYERS.flights.on && !LAYERS.mil.on) return;
  const now = Date.now();
  if (LAYERS.flights.on && now - airLastPoll > 20000) {
    airLastPoll = now;
    const a = airAnchor();
    const url = `https://api.adsb.lol/v2/lat/${a.lat.toFixed(2)}/lon/${a.lon.toFixed(2)}/dist/250`;
    try {
      const kept = ingestAdsbLol(await fetchJson(url, { timeout: 14000 }), false);
      LAYERS.flights.status = "LIVE";
      airSource = "adsb.lol";
      if (!airSourceLogged) { log(`air: adsb.lol regional ${kept} contacts (250 nm)`, "ok"); airSourceLogged = true; }
    } catch (err) {
      LAYERS.flights.status = "OFFLINE";
      log(`air: adsb.lol unreachable (${err.message || err})`, "err");
    }
  }
  if (LAYERS.mil.on && now - milLastPoll > 45000) {
    milLastPoll = now;
    try {
      const kept = ingestAdsbLol(await fetchJson("https://api.adsb.lol/v2/mil", { timeout: 14000 }), true);
      LAYERS.mil.status = "LIVE";
      log(`mil: ${kept} military transponders`, "ok");
    } catch (err) {
      LAYERS.mil.status = "OFFLINE";
      log(`mil: feed unreachable (${err.message || err})`, "err");
    }
  }
  /* expire stale */
  const cutoff = Date.now() - 75000;
  for (const [hex, a] of aircraft) if (a.ts < cutoff) aircraft.delete(hex);
}
let milLastPoll = 0;
let airSourceLogged = false;

function extrapolate(a, now) {
  const dt = clamp((now - a.ts) / 1000, 0, 30);
  if (!a.gs || a.track === null || dt === 0) return { lat: a.lat, lon: a.lon };
  const nm = (a.gs / 3600) * dt;
  const dLat = (nm * Math.cos(rad(a.track))) / 60;
  const dLon = (nm * Math.sin(rad(a.track))) / (60 * Math.max(0.2, Math.cos(rad(a.lat))));
  let lon = a.lon + dLon;
  if (lon > 180) lon -= 360;
  if (lon < -180) lon += 360;
  return { lat: clamp(a.lat + dLat, -88, 88), lon };
}

function renderAircraft(now) {
  const posA = airPoints.geometry.attributes.position.array;
  const colA = airPoints.geometry.attributes.color.array;
  const posM = milPoints.geometry.attributes.position.array;
  const colM = milPoints.geometry.attributes.color.array;
  let nC = 0, nM = 0;
  const showC = LAYERS.flights.on;
  const showM = LAYERS.mil.on;
  for (const a of aircraft.values()) {
    const p = extrapolate(a, now);
    const altKm = ((a.altFt ?? 0) * 0.0003048);
    latLngToVector3(p.lat, p.lon, R + altKm * KM, _satV);
    if (a.mil) {
      if (showM && nM < MAX_MIL) {
        posM[nM * 3] = _satV.x; posM[nM * 3 + 1] = _satV.y; posM[nM * 3 + 2] = _satV.z;
        colM[nM * 3] = 1; colM[nM * 3 + 1] = 0.42; colM[nM * 3 + 2] = 0.3;
        nM++;
      }
    } else if (showC && nC < MAX_AIR) {
      posA[nC * 3] = _satV.x; posA[nC * 3 + 1] = _satV.y; posA[nC * 3 + 2] = _satV.z;
      colA[nC * 3] = 0.36; colA[nC * 3 + 1] = 0.84; colA[nC * 3 + 2] = 1;
      nC++;
    }
  }
  airPoints.geometry.setDrawRange(0, nC);
  airPoints.geometry.attributes.position.needsUpdate = true;
  airPoints.geometry.attributes.color.needsUpdate = true;
  milPoints.geometry.setDrawRange(0, nM);
  milPoints.geometry.attributes.position.needsUpdate = true;
  milPoints.geometry.attributes.color.needsUpdate = true;
  counts.flights = nC;
  counts.mil = nM;
}

/* ------------------------------------------------------------------ */
/* QUAKE layer — USGS                                                  */
/* ------------------------------------------------------------------ */
let quakes = [];
let quakeLastPoll = 0;

async function pollQuakes() {
  if (!LAYERS.quakes.on) return;
  const now = Date.now();
  if (now - quakeLastPoll < 60000) return;
  quakeLastPoll = now;
  try {
    const gj = await fetchJson("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson", { timeout: 16000 });
    quakes = gj.features
      .map((f) => ({
        mag: f.properties.mag ?? 0,
        place: f.properties.place || "unknown region",
        time: f.properties.time,
        url: f.properties.url,
        lat: f.geometry.coordinates[1],
        lon: f.geometry.coordinates[0],
        depth: f.geometry.coordinates[2],
      }))
      .sort((a, b) => b.mag - a.mag)
      .slice(0, MAX_QUAKE);
    LAYERS.quakes.status = "LIVE";
    counts.quakes = quakes.length;
    if (quakes[0]) log(`quakes: ${quakes.length} / 24h · top M${quakes[0].mag.toFixed(1)} ${quakes[0].place}`, "ok");
    rebuildPulses();
  } catch (err) {
    LAYERS.quakes.status = "OFFLINE";
    log(`quakes: USGS unreachable (${err.message || err})`, "err");
  }
}

function quakeColor(q, out) {
  const m = clamp((q.mag - 2.5) / 4.5, 0, 1);
  out.setRGB(1, 0.72 - m * 0.42, 0.32 - m * 0.18);
}

function renderQuakes() {
  const show = LAYERS.quakes.on;
  const buckets = [quakeSmall, quakeMid, quakeBig];
  const ns = [0, 0, 0];
  if (show) {
    const cols = [new THREE.Color(), new THREE.Color(), new THREE.Color()];
    for (const q of quakes) {
      const b = q.mag >= 6 ? 2 : q.mag >= 4.5 ? 1 : 0;
      const n = ns[b];
      if (n >= MAX_QUAKE) continue;
      latLngToVector3(q.lat, q.lon, R + 0.03, _satV);
      const pts = buckets[b];
      const pos = pts.geometry.attributes.position.array;
      const col = pts.geometry.attributes.color.array;
      pos[n * 3] = _satV.x; pos[n * 3 + 1] = _satV.y; pos[n * 3 + 2] = _satV.z;
      quakeColor(q, cols[b]);
      col[n * 3] = cols[b].r; col[n * 3 + 1] = cols[b].g; col[n * 3 + 2] = cols[b].b;
      q.__bucket = b; q.__index = n;
      ns[b]++;
    }
  }
  buckets.forEach((pts, i) => {
    pts.geometry.setDrawRange(0, ns[i]);
    pts.geometry.attributes.position.needsUpdate = true;
    pts.geometry.attributes.color.needsUpdate = true;
  });
}

function rebuildPulses() {
  for (const p of pulses) scene.remove(p);
  pulses = [];
  const now = Date.now();
  for (const q of quakes) {
    if (q.mag < 5.2 || now - q.time > 6 * 3600e3) continue;
    if (pulses.length >= 12) break;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: pulseTex, transparent: true, depthWrite: false, opacity: 0.8,
    }));
    latLngToVector3(q.lat, q.lon, R + 0.05, sp.position);
    sp.userData = { mag: q.mag, time: q.time };
    scene.add(sp);
    pulses.push(sp);
  }
}

/* ------------------------------------------------------------------ */
/* SHIP layer — modeled lanes (AIS requires a key)                     */
/* ------------------------------------------------------------------ */
const ships = [];
{
  let id = 0;
  while (ships.length < SHIP_COUNT) {
    const lane = LANES[ships.length % LANES.length];
    ships.push({
      id: `SIM-${String(++id).padStart(3, "0")}`,
      lane,
      phase: Math.random(),
      speed: 0.004 + Math.random() * 0.006,   // fraction of lane per hour
      kn: 9 + Math.random() * 13,
      dir: Math.random() < 0.5 ? 1 : -1,
      lat: 0, lon: 0,
    });
  }
}

const _shipA = new THREE.Vector3();
const _shipB = new THREE.Vector3();
function renderShips(tHours) {
  const show = LAYERS.ships.on;
  const pos = shipPoints.geometry.attributes.position.array;
  const col = shipPoints.geometry.attributes.color.array;
  let n = 0;
  if (show) {
    for (const s of ships) {
      const [ai, bi] = s.lane;
      const A = PORTS[ai], B = PORTS[bi];
      let t = (s.phase + tHours * s.speed) % 1;
      if (s.dir < 0) t = 1 - t;
      latLngToVector3(A[1], A[2], 1, _shipA);
      latLngToVector3(B[1], B[2], 1, _shipB);
      _shipA.lerp(_shipB, t).normalize().multiplyScalar(R + 0.02);
      /* great-circle fix: slerp via normalized lerp is fine visually */
      pos[n * 3] = _shipA.x; pos[n * 3 + 1] = _shipA.y; pos[n * 3 + 2] = _shipA.z;
      col[n * 3] = 0.3; col[n * 3 + 1] = 0.9; col[n * 3 + 2] = 0.72;
      s.lat = 90 - deg(Math.acos(clamp(_shipA.y / (R + 0.02), -1, 1)));
      s.lon = deg(Math.atan2(_shipA.z, -_shipA.x)) - 180;
      if (s.lon < -180) s.lon += 360;
      n++;
    }
  }
  shipPoints.geometry.setDrawRange(0, n);
  shipPoints.geometry.attributes.position.needsUpdate = true;
  shipPoints.geometry.attributes.color.needsUpdate = true;
  counts.ships = n;
}

/* ------------------------------------------------------------------ */
/* tracking                                                            */
/* ------------------------------------------------------------------ */
let tracked = null; // {kind:'sat'|'flight'|'quake'|'ship', id, ref}
const trackExtras = new THREE.Group();
scene.add(trackExtras);

function clearTrack() {
  tracked = null;
  trail.visible = false;
  trailGeo.setDrawRange(0, 0);
  trailPts.length = 0;
  trackExtras.clear();
  $("trackPanel").hidden = true;
}

function trackTarget(kind, ref, id) {
  clearTrack();
  tracked = { kind, ref, id };
  trail.visible = true;
  $("trackPanel").hidden = false;
  log(`track: locked ${id}`, "warn");
  const pos = targetWorldPos();
  if (pos) {
    const dist = kind === "sat" ? 14 : kind === "flight" ? 3.2 : kind === "quake" ? 26 : 20;
    flyToVector(pos, dist);
  }
  if (kind === "sat" && ref.satrec) satOrbitRing(ref, trackExtras);
}

function targetWorldPos(out = new THREE.Vector3()) {
  if (!tracked) return null;
  const { kind, ref } = tracked;
  if (kind === "sat") {
    if (ref.dead) return null;
    return latLngToVector3(ref.lat, ref.lon, R + ref.altKm * KM, out);
  }
  if (kind === "flight") {
    const a = aircraft.get(ref.hex);
    if (!a) return null;
    tracked.ref = a;
    const p = extrapolate(a, Date.now());
    const altKm = ((a.altFt ?? 0) * 0.0003048);
    return latLngToVector3(p.lat, p.lon, R + altKm * KM, out);
  }
  if (kind === "quake") return latLngToVector3(ref.lat, ref.lon, R + 0.03, out);
  if (kind === "ship") return latLngToVector3(ref.lat, ref.lon, R + 0.02, out);
  return null;
}

let lastTrailPush = 0;
function updateFollow(now) {
  if (!tracked) return;
  const pos = targetWorldPos();
  if (!pos) {
    if (tracked.kind === "flight") { clearTrack(); log("track: contact dropped", "warn"); }
    return;
  }
  const delta = pos.clone().sub(controls.target);
  controls.target.copy(pos);
  camera.position.add(delta);
  if (now - lastTrailPush > 1500 && (tracked.kind === "sat" || tracked.kind === "flight" || tracked.kind === "ship")) {
    lastTrailPush = now;
    trailPts.push(pos.clone());
    if (trailPts.length > TRAIL_MAX) trailPts.shift();
    const arr = trailGeo.attributes.position.array;
    trailPts.forEach((p, i) => { arr[i * 3] = p.x; arr[i * 3 + 1] = p.y; arr[i * 3 + 2] = p.z; });
    trailGeo.setDrawRange(0, trailPts.length);
    trailGeo.attributes.position.needsUpdate = true;
  }
}

function updateTrackCard() {
  if (!tracked) return;
  const el = $("trackCard");
  const { kind, ref, id } = tracked;
  let html = "";
  if (kind === "sat") {
    const periodMin = (2 * Math.PI) / ref.satrec.no;
    html = `<div class="big">${esc(ref.name)}</div>
      <div><span class="k">CLASS</span>${ref.group}</div>
      <div><span class="k">NORAD</span>${ref.norad}</div>
      <div><span class="k">ALT</span>${ref.altKm.toFixed(0)} km</div>
      <div><span class="k">PERIOD</span>${periodMin.toFixed(1)} min</div>
      <div><span class="k">SUB</span>${ref.lat.toFixed(2)}° ${ref.lon.toFixed(2)}°</div>
      <span class="tag">SGP4 LIVE</span>`;
  } else if (kind === "flight") {
    const a = aircraft.get(ref.hex) || ref;
    html = `<div class="big">${esc(a.flight || a.hex.toUpperCase())}</div>
      <div><span class="k">HEX</span>${a.hex}</div>
      <div><span class="k">TYPE</span>${esc(a.type || "—")}</div>
      <div><span class="k">ALT</span>${a.altFt != null ? Math.round(a.altFt).toLocaleString() + " ft" : "—"}</div>
      <div><span class="k">GS</span>${a.gs != null ? Math.round(a.gs) + " kt" : "—"}</div>
      <div><span class="k">HDG</span>${a.track != null ? Math.round(a.track) + "°" : "—"}</div>
      <div><span class="k">VS</span>${a.vs != null ? Math.round(a.vs) + " fpm" : "—"}</div>
      <span class="tag">${a.mil ? "MIL · adsb.lol" : "LIVE · adsb.lol"}</span>`;
  } else if (kind === "quake") {
    html = `<div class="big">M ${ref.mag.toFixed(1)}</div>
      <div><span class="k">REGION</span>${esc(ref.place)}</div>
      <div><span class="k">DEPTH</span>${ref.depth.toFixed(0)} km</div>
      <div><span class="k">AGE</span>${ageText(Date.now() - ref.time)}</div>
      <div><span class="k">EPICENTER</span>${ref.lat.toFixed(2)}° ${ref.lon.toFixed(2)}°</div>
      <span class="tag">LIVE · USGS</span>`;
  } else if (kind === "ship") {
    const A = PORTS[ref.lane[0]][0], B = PORTS[ref.lane[1]][0];
    html = `<div class="big">${ref.id}</div>
      <div><span class="k">ROUTE</span>${ref.dir > 0 ? A + " → " + B : B + " → " + A}</div>
      <div><span class="k">SPEED</span>${ref.kn.toFixed(1)} kt</div>
      <div><span class="k">POS</span>${ref.lat.toFixed(2)}° ${ref.lon.toFixed(2)}°</div>
      <span class="tag">MODELED · NO AIS KEY</span>`;
  }
  el.innerHTML = html;
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

/* ------------------------------------------------------------------ */
/* camera flight                                                       */
/* ------------------------------------------------------------------ */
let tween = null;

function flyToVector(targetPos, dist) {
  const dir = targetPos.clone().normalize();
  const to = dir.multiplyScalar(targetPos.length() + dist);
  tween = {
    t0: performance.now(),
    dur: 1500,
    fromPos: camera.position.clone(),
    toPos: to,
    fromTarget: controls.target.clone(),
    toTarget: targetPos.clone(),
  };
}

function flyToLatLng(lat, lon, dist) {
  clearTrack();
  const target = latLngToVector3(lat, lon, R);
  flyToVector(target, dist ?? clamp(camera.position.length() - R, 8, 240));
}

function resetGlobe() {
  clearTrack();
  tween = {
    t0: performance.now(),
    dur: 1400,
    fromPos: camera.position.clone(),
    toPos: latLngToVector3(24, 12, R * 3.1),
    fromTarget: controls.target.clone(),
    toTarget: new THREE.Vector3(0, 0, 0),
  };
}

function stepTween(now) {
  if (!tween) return;
  const s = clamp((now - tween.t0) / tween.dur, 0, 1);
  const e = s < 0.5 ? 2 * s * s : 1 - ((-2 * s + 2) ** 2) / 2;
  camera.position.lerpVectors(tween.fromPos, tween.toPos, e);
  controls.target.lerpVectors(tween.fromTarget, tween.toTarget, e);
  if (s >= 1) tween = null;
}

renderer.domElement.addEventListener("pointerdown", () => { tween = null; });

/* ------------------------------------------------------------------ */
/* picking                                                             */
/* ------------------------------------------------------------------ */
const raycaster = new THREE.Raycaster();
const mouseV = new THREE.Vector2();
let downXY = null;

renderer.domElement.addEventListener("pointerdown", (e) => { downXY = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener("pointerup", (e) => {
  if (!downXY) return;
  const moved = Math.hypot(e.clientX - downXY[0], e.clientY - downXY[1]);
  downXY = null;
  if (moved > 6) return;
  pick(e.clientX, e.clientY);
});

function pick(x, y) {
  mouseV.set((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(mouseV, camera);
  const dist = camera.position.distanceTo(controls.target);
  raycaster.params.Points.threshold = clamp(dist * 0.012, 0.4, 4);
  const visible = pickables.filter((p) => p.geometry.drawRange.count > 0);
  const hits = raycaster.intersectObjects(visible, false);
  if (!hits.length) return;
  const hit = hits[0];
  const idx = hit.index;
  const obj = hit.object;

  if (obj === satPoints) {
    const s = satellites.filter((q) => !q.dead)[idx];
    if (s) trackTarget("sat", s, s.name);
  } else if (obj === issPoint) {
    const s = satellites.find((q) => q.norad === "25544");
    if (s) trackTarget("sat", s, "ISS");
  } else if (obj === airPoints) {
    const civ = [...aircraft.values()].filter((a) => !a.mil)[idx];
    if (civ) trackTarget("flight", civ, civ.flight || civ.hex);
  } else if (obj === milPoints) {
    const mil = [...aircraft.values()].filter((a) => a.mil)[idx];
    if (mil) trackTarget("flight", mil, mil.flight || mil.hex);
  } else if (obj === quakeSmall || obj === quakeMid || obj === quakeBig) {
    const q = quakes.find((qq) => qq.__bucket === (obj === quakeBig ? 2 : obj === quakeMid ? 1 : 0) && qq.__index === idx);
    if (q) trackTarget("quake", q, `M${q.mag.toFixed(1)} ${q.place}`);
  } else if (obj === shipPoints) {
    const s = ships[idx];
    if (s) trackTarget("ship", s, s.id);
  }
}

/* ------------------------------------------------------------------ */
/* sensor styles                                                       */
/* ------------------------------------------------------------------ */
let styleIdx = 0;
function setStyle(i) {
  styleIdx = ((i % STYLES.length) + STYLES.length) % STYLES.length;
  const name = STYLES[styleIdx];
  document.body.dataset.style = name;
  $("styleChip").textContent = name.toUpperCase();
  log(`optics: ${name.toUpperCase()}`, "wx");
}

$("btnStyles").addEventListener("click", () => setStyle(styleIdx + 1));
$("btnReset").addEventListener("click", resetGlobe);
$("btnRelease").addEventListener("click", () => { clearTrack(); log("track: released"); });

window.addEventListener("keydown", (e) => {
  if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
  if (e.key >= "1" && e.key <= "6") setStyle(Number(e.key) - 1);
  else if (e.key === "Escape") { clearTrack(); }
  else if (e.key === "r" || e.key === "R") resetGlobe();
});

/* ------------------------------------------------------------------ */
/* layer chips                                                         */
/* ------------------------------------------------------------------ */
function renderLayerChips() {
  const host = $("layerList");
  host.innerHTML = "";
  for (const [key, layer] of Object.entries(LAYERS)) {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "layer-row" + (layer.on ? " on" : "");
    row.innerHTML = `<span class="dot"></span>${layer.label}
      <span class="n" id="cnt-${key}"></span>
      <span class="st" id="st-${key}">${layer.on ? layer.status : "OFF"}</span>`;
    row.addEventListener("click", () => {
      layer.on = !layer.on;
      log(`${layer.label.toLowerCase()}: ${layer.on ? "enabled" : "disabled"}`);
      if (key === "quakes" && layer.on) quakeLastPoll = 0;
      if ((key === "flights" || key === "mil") && layer.on) airLastPoll = 0;
      renderLayerChips();
    });
    host.appendChild(row);
  }
}

function refreshChipCounts() {
  for (const key of Object.keys(LAYERS)) {
    const st = $("st-" + key), cn = $("cnt-" + key);
    if (st) st.textContent = LAYERS[key].on ? LAYERS[key].status : "OFF";
    if (cn) cn.textContent = counts[key] ? `· ${counts[key]}` : "";
  }
}

/* ------------------------------------------------------------------ */
/* command console                                                     */
/* ------------------------------------------------------------------ */
function findPlace(text) {
  const q = text.toLowerCase().trim();
  for (const [name, lat, lon] of [...PLACES, ...AIRPORTS]) {
    if (name === q || q.includes(name) || name.includes(q)) return { name, lat, lon };
  }
  return null;
}

function runCommand(raw) {
  const text = raw.trim();
  if (!text) return;
  log(`cmd: ${text}`, "wx");
  const [verb, ...rest] = text.split(/\s+/);
  const arg = rest.join(" ").trim();
  const v = verb.toLowerCase();

  if (v === "help") {
    log("go/fly <place> · track <ISS|callsign|sat> · release · reset", "ok");
    log("sats|flights|mil|quakes|ships on|off · style crt|nvg|flir|noir|snow", "ok");
    log("share · quake · keys 1-6 optics, R reset, ESC release", "ok");
  } else if (v === "go" || v === "fly") {
    const p = findPlace(arg);
    if (p) { flyToLatLng(p.lat, p.lon, 24); log(`nav: ${p.name.toUpperCase()} ${p.lat.toFixed(2)}° ${p.lon.toFixed(2)}°`, "ok"); }
    else log(`nav: unknown place "${arg}"`, "err");
  } else if (v === "track") {
    const q = arg.toLowerCase();
    if (!q) { log("track: give a target name", "err"); return; }
    const s = satellites.find((x) => x.name.toLowerCase().includes(q)) ||
      (q.includes("iss") ? satellites.find((x) => x.norad === "25544") : null);
    if (s) { trackTarget("sat", s, s.name); return; }
    const ac = [...aircraft.values()].find((a) =>
      (a.flight && a.flight.toLowerCase().includes(q)) || a.hex.includes(q));
    if (ac) { trackTarget("flight", ac, ac.flight || ac.hex); return; }
    log(`track: no match for "${arg}"`, "err");
  } else if (v === "release" || v === "esc") {
    clearTrack();
  } else if (v === "reset" || v === "home") {
    resetGlobe();
  } else if (v === "quake" || v === "quakes" && !arg) {
    const q = quakes[0];
    if (q) trackTarget("quake", q, `M${q.mag.toFixed(1)} ${q.place}`);
    else log("quakes: feed empty", "err");
  } else if (v === "style" || v === "optics") {
    const i = STYLES.indexOf(arg.toLowerCase());
    if (i >= 0) setStyle(i); else log(`optics: ${STYLES.join(" · ")}`, "err");
  } else if (v === "share") {
    shareView();
  } else if (LAYERS[v] || (v === "sats" && LAYERS.sats)) {
    const layer = LAYERS[v];
    const mode = arg.toLowerCase();
    if (mode === "on") layer.on = true;
    else if (mode === "off") layer.on = false;
    else layer.on = !layer.on;
    renderLayerChips();
    log(`${layer.label.toLowerCase()}: ${layer.on ? "on" : "off"}`, "ok");
  } else {
    const p = findPlace(text);
    if (p) { flyToLatLng(p.lat, p.lon, 24); log(`nav: ${p.name.toUpperCase()}`, "ok"); }
    else log(`cmd: unknown "${verb}" — try help`, "err");
  }
}

$("cmdbar").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = $("cmd");
  runCommand(input.value);
  input.value = "";
  input.blur();
});

/* ------------------------------------------------------------------ */
/* webxdc — shared eyes                                                */
/* ------------------------------------------------------------------ */
const eyes = new Map();

function shareView() {
  const sub = vector3ToLatLng(controls.target.lengthSq() > 1 ? controls.target : camera.position);
  const dist = camera.position.distanceTo(controls.target);
  const payload = {
    gev: 1, v: 1,
    name: (window.webxdc?.selfName || "operator").slice(0, 24),
    lat: +sub.lat.toFixed(3),
    lon: +sub.lon.toFixed(3),
    dist: +dist.toFixed(1),
    style: STYLES[styleIdx],
    trk: tracked ? tracked.id : null,
  };
  if (window.webxdc?.sendUpdate) {
    window.webxdc.sendUpdate({ payload, summary: `GEV view: ${payload.lat}°, ${payload.lon}°` });
    log("wx: view broadcast to chat", "wx");
  } else {
    log("wx: no messenger host — preview only", "warn");
  }
}
$("btnShare").addEventListener("click", shareView);

function renderEyes() {
  const host = $("eyesList");
  $("eyesCount").textContent = eyes.size;
  if (!eyes.size) {
    host.innerHTML = '<p class="dim">no shared views yet</p>';
    return;
  }
  host.innerHTML = "";
  for (const u of [...eyes.values()].slice(-24).reverse()) {
    const row = document.createElement("div");
    row.className = "eye-row";
    const what = u.trk ? `TRK ${u.trk}` : `${u.lat}° ${u.lon}°`;
    row.innerHTML = `<span class="who">${esc(u.name)}</span><span class="what">${esc(what)}</span>`;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "JUMP";
    btn.addEventListener("click", () => {
      flyToLatLng(u.lat, u.lon, clamp(u.dist || 30, 4, 400));
      if (u.style && STYLES.includes(u.style)) setStyle(STYLES.indexOf(u.style));
      log(`wx: jumped to ${esc(u.name)}'s eye`, "wx");
      if (u.trk) window.setTimeout(() => runCommand(`track ${u.trk}`), 400);
    });
    row.appendChild(btn);
    host.appendChild(row);
  }
}

async function initWebxdc() {
  if (!window.webxdc?.setUpdateListener) return;
  await window.webxdc.setUpdateListener((update) => {
    const p = update?.payload;
    if (!p || p.gev !== 1) return;
    eyes.set(update.serial || update.maxSerial || Math.random(), {
      name: p.name || "operator",
      lat: p.lat, lon: p.lon, dist: p.dist, style: p.style, trk: p.trk,
    });
    renderEyes();
  });
  log(`wx: linked as ${window.webxdc.selfName || "operator"}`, "wx");
}

/* ------------------------------------------------------------------ */
/* HUD + clock                                                         */
/* ------------------------------------------------------------------ */
function updateHud() {
  const sub = vector3ToLatLng(controls.target.lengthSq() > 1 ? controls.target : camera.position);
  const altKm = Math.max(0, (camera.position.length() - R) / KM);
  $("hudLat").textContent = `LAT ${sub.lat.toFixed(2)}°`;
  $("hudLon").textContent = `LON ${sub.lon.toFixed(2)}°`;
  $("hudAlt").textContent = `ALT ${altKm > 9999 ? Math.round(altKm / 1000) + "k" : Math.round(altKm)} km`;
}

setInterval(() => { $("clock").textContent = utc(); }, 1000);
setInterval(updateHud, 500);
setInterval(updateTrackCard, 400);
setInterval(refreshChipCounts, 2000);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ------------------------------------------------------------------ */
/* main loop                                                           */
/* ------------------------------------------------------------------ */
let lastSatProp = 0;
let lastAircraftPoll = 0;

renderer.setAnimationLoop((now) => {
  stepTween(now);

  if (LAYERS.sats.on && satReady && now - lastSatProp > 500) {
    lastSatProp = now;
    propagateSatellites(Date.now());
  }
  if (now - lastAircraftPoll > 5000) {
    lastAircraftPoll = now;
    pollAircraft();
    pollQuakes();
  }

  renderAircraft(Date.now());
  renderQuakes();
  renderShips(now / 3600000);
  updateFollow(now);

  for (const p of pulses) {
    const age = (Date.now() - p.userData.time) / 1000;
    const cycle = (age % 5) / 5;
    const scale = (1 + cycle * (1.5 + p.userData.mag * 0.4)) * 2.2;
    p.scale.set(scale, scale, 1);
    p.material.opacity = 0.85 * (1 - cycle) * clamp(1 - age / 21600, 0, 1);
  }

  controls.update();
  renderer.render(scene, camera);
});

/* ------------------------------------------------------------------ */
/* boot                                                                */
/* ------------------------------------------------------------------ */
(async function start() {
  boot("god's eye view · html5/webxdc conversion");
  boot("renderer: webgl " + (renderer.capabilities.isWebGL2 ? "2" : "1"));
  await loadCountries();
  renderLayerChips();
  boot("layers armed: SAT AIR QUAKE SHIP(SIM)");
  loadSatellites().catch(() => {});
  pollQuakes();
  pollAircraft();
  upgradeImagery();
  await initWebxdc();
  boot("webxdc: " + (window.webxdc?.setUpdateListener ? "messenger host linked" : "browser preview stub"));
  boot("all systems nominal — eye open");
  setTimeout(() => {
    $("boot").classList.add("done");
    setTimeout(() => $("boot").remove(), 700);
  }, 500);
})();
