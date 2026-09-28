import * as THREE from "../vendor/three.module.min.js";
import { OrbitControls } from "../vendor/OrbitControls.js";
import {
  sieve, isPrime, formatFactorization, primeStatistics, ulamCoordinate,
} from "./primes.js";

const $ = (id) => document.getElementById(id);
const state = { limit: 10000, view: "atlas", chart: "gaps", focus: 97, data: null, stats: null };
let scene, camera, renderer, controls, universe, stars, primePoints, marker;
const positionsByPrime = new Map();
const RESIDUES = [1, 7, 11, 13, 17, 19, 23, 29];

function initScene() {
  renderer = new THREE.WebGLRenderer({ canvas: $("primeStage"), antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setClearColor(0x02040b, 1);
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x02040b, 0.018);
  camera = new THREE.PerspectiveCamera(52, 1, 0.05, 300);
  camera.position.set(9, 8, 12);
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.18;
  controls.minDistance = 2;
  controls.maxDistance = 80;
  controls.addEventListener("start", () => { controls.autoRotate = false; });
  scene.add(new THREE.AmbientLight(0x8adfff, 0.45));
  const light = new THREE.PointLight(0x7de7ff, 2.3, 80);
  light.position.set(3, 8, 5);
  scene.add(light);
  addStars();
  marker = new THREE.Mesh(new THREE.SphereGeometry(.15, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffcb6b }));
  marker.visible = false;
  scene.add(marker);
  resize();
  addEventListener("resize", resize);
  renderer.domElement.addEventListener("click", pickPrime);
  const loop = () => {
    controls.update();
    if (universe && state.view === "solar") universe.rotation.y += .00035;
    if (stars) stars.rotation.y -= .00004;
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  };
  loop();
}

function resize() {
  const vv = visualViewport;
  const w = Math.max(1, Math.floor(vv?.width || innerWidth));
  const h = Math.max(1, Math.floor(vv?.height || innerHeight));
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}

function addStars() {
  let seed = 0x51a7c0de;
  const rand = () => ((seed = Math.imul(seed ^ seed >>> 15, 2246822519) ^ Math.imul(seed ^ seed >>> 13, 3266489917)) >>> 0) / 4294967296;
  const pos = [];
  for (let i = 0; i < 2400; i++) {
    const r = 45 + rand() * 70, a = rand() * Math.PI * 2, z = rand() * 2 - 1, q = Math.sqrt(1 - z * z);
    pos.push(Math.cos(a) * q * r, z * r, Math.sin(a) * q * r);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  stars = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x6f98bb, size: .08, transparent: true, opacity: .55 }));
  scene.add(stars);
}

function clearUniverse() {
  if (!universe) return;
  scene.remove(universe);
  universe.traverse((object) => {
    object.geometry?.dispose?.();
    if (Array.isArray(object.material)) object.material.forEach((m) => m.dispose?.());
    else object.material?.dispose?.();
  });
  universe = null;
  primePoints = null;
  positionsByPrime.clear();
}

function pointCloud(positions, colors, size = .075) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  if (colors) geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({ size, vertexColors: Boolean(colors), color: colors ? 0xffffff : 0x5ce1ff, transparent: true, opacity: .9, sizeAttenuation: true }));
}

function colorPush(colors, color) { colors.push(color.r, color.g, color.b); }
function remember(prime, x, y, z, index) { positionsByPrime.set(prime, { x, y, z, index }); }

function buildAtlas(group, primes) {
  const pos = [], colors = [], normal = new THREE.Color(0x5ce1ff), hot = new THREE.Color(0xa98bff);
  const scale = 11 / Math.max(8, Math.sqrt(state.limit));
  primes.forEach((p, i) => {
    const [x, z] = ulamCoordinate(p);
    const y = Math.sin(p * .137) * .08 + ((p % 6) - 2.5) * .014;
    pos.push(x * scale, y, z * scale);
    colorPush(colors, p % 6 === 1 ? hot : normal);
    remember(p, x * scale, y, z * scale, i);
  });
  primePoints = pointCloud(pos, colors, .085);
  group.add(primePoints);
  const grid = new THREE.GridHelper(24, 48, 0x17425a, 0x091a27);
  grid.position.y = -.12;
  group.add(grid);
}

function ring(radius, color = 0x17425a, opacity = .42) {
  const pts = [];
  for (let i = 0; i <= 128; i++) {
    const a = i / 128 * Math.PI * 2;
    pts.push(Math.cos(a) * radius, 0, Math.sin(a) * radius);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  return new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
}

function buildSolar(group, primes) {
  const pos = [], colors = [], palette = [0x5ce1ff,0xa98bff,0x5fffc1,0xffcb6b,0xff6685,0x7bb8ff,0xc7f9ff,0xc79cff].map((c) => new THREE.Color(c));
  const maxLog = Math.log(state.limit);
  RESIDUES.forEach((_, i) => {
    const orbit = ring(1.3 + i * .68, palette[i].getHex(), .22);
    orbit.rotation.x = (i - 3.5) * .035;
    group.add(orbit);
  });
  const sun = new THREE.Mesh(new THREE.SphereGeometry(.34, 24, 16), new THREE.MeshBasicMaterial({ color: 0xffcb6b }));
  group.add(sun);
  primes.forEach((p, i) => {
    const ri = p <= 5 ? p - 2 : Math.max(0, RESIDUES.indexOf(p % 30));
    const radius = 1.3 + ri * .68 + Math.log(p) / maxLog * .34;
    const a = i * 2.399963229728653 + p * .0021;
    const tilt = (ri - 3.5) * .035;
    const x = Math.cos(a) * radius, z0 = Math.sin(a) * radius;
    const y = Math.sin(a) * radius * Math.sin(tilt) + (Math.log(p) / maxLog - .5) * .5;
    const z = z0 * Math.cos(tilt);
    pos.push(x, y, z); colorPush(colors, palette[ri]); remember(p, x, y, z, i);
  });
  primePoints = pointCloud(pos, colors, .072);
  group.add(primePoints);
}

function fibonacciPosition(i, n, radius = 6.5) {
  const y = 1 - (i / Math.max(1, n - 1)) * 2;
  const r = Math.sqrt(Math.max(0, 1 - y * y));
  const a = i * Math.PI * (3 - Math.sqrt(5));
  return [Math.cos(a) * r * radius, y * radius, Math.sin(a) * r * radius];
}

function connectionLines(pairs, color, maxLines = 2600) {
  const arr = [];
  for (let i = 0; i < pairs.length && i < maxLines; i++) {
    const a = positionsByPrime.get(pairs[i][0]), b = positionsByPrime.get(pairs[i][pairs[i].length - 1]);
    if (a && b) arr.push(a.x, a.y, a.z, b.x, b.y, b.z);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3));
  return new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: .26 }));
}

function buildConstellations(group, primes, stats) {
  const pos = [], colors = [], twinSet = new Set(stats.twins.flat());
  const normal = new THREE.Color(0x5ce1ff), twin = new THREE.Color(0xff6685);
  primes.forEach((p, i) => {
    const [x, y, z] = fibonacciPosition(i, primes.length);
    const pulse = 1 + (p % 30) / 600;
    pos.push(x * pulse, y * pulse, z * pulse);
    colorPush(colors, twinSet.has(p) ? twin : normal);
    remember(p, x * pulse, y * pulse, z * pulse, i);
  });
  primePoints = pointCloud(pos, colors, .075);
  group.add(primePoints);
  group.add(connectionLines(stats.twins, 0xff6685));
  group.add(connectionLines(stats.cousins, 0xa98bff, 1800));
  group.add(connectionLines(stats.sexy, 0x5fffc1, 1800));
  group.add(new THREE.Mesh(new THREE.SphereGeometry(6.5, 24, 16), new THREE.MeshBasicMaterial({ color: 0x123044, wireframe: true, transparent: true, opacity: .12 })));
}

function buildUniverse({ preserveCamera = false } = {}) {
  state.limit = Number($("limit").value);
  $("limitLabel").textContent = state.limit.toLocaleString();
  clearUniverse();
  state.data = sieve(state.limit);
  state.stats = primeStatistics(state.data.primes, state.limit);
  universe = new THREE.Group();
  if (state.view === "atlas") buildAtlas(universe, state.data.primes);
  else if (state.view === "solar") buildSolar(universe, state.data.primes);
  else buildConstellations(universe, state.data.primes, state.stats);
  scene.add(universe);
  $("renderCount").textContent = state.data.primes.length.toLocaleString();
  renderStats();
  renderChart();
  updateFocus(false);
  if (!preserveCamera) resetCamera();
}

function resetCamera() {
  const poses = {
    atlas: [[8.5, 10.5, 10.5], [0, 0, 0]],
    solar: [[10.5, 7.5, 12], [0, 0, 0]],
    constellation: [[10, 7, 12], [0, 0, 0]],
  };
  camera.position.set(...poses[state.view][0]);
  controls.target.set(...poses[state.view][1]);
  controls.autoRotate = true;
  controls.update();
}

function renderStats() {
  const s = state.stats;
  $("statCount").textContent = s.count.toLocaleString();
  $("statDensity").textContent = `${(s.density * 100).toFixed(2)}%`;
  $("statEstimate").textContent = `${Math.round(s.estimate).toLocaleString()} (${(s.estimateError * 100).toFixed(1)}%)`;
  $("statGap").textContent = `${s.maxGap} after ${s.maxGapAfter}`;
  $("statTwins").textContent = s.twins.length.toLocaleString();
  $("statTriplets").textContent = s.triplets.length.toLocaleString();
}

function chartBase() {
  const cv = $("primeChart"), ctx = cv.getContext("2d"), W = cv.width, H = cv.height;
  ctx.fillStyle = "#030711"; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#143047"; ctx.lineWidth = 1;
  for (let y = 24; y < H; y += 36) { ctx.beginPath(); ctx.moveTo(24, y); ctx.lineTo(W - 10, y); ctx.stroke(); }
  ctx.font = "9px ui-monospace, monospace"; ctx.fillStyle = "#7892a8";
  return { cv, ctx, W, H, pad: 24 };
}

function renderChart() {
  const { ctx, W, H, pad } = chartBase(), s = state.stats;
  if (state.chart === "gaps") {
    const bins = Array(Math.max(1, Math.ceil((s.maxGap + 1) / 2))).fill(0);
    s.gaps.forEach((gap) => { bins[Math.floor(gap / 2)]++; });
    const max = Math.max(1, ...bins), bw = (W - pad - 10) / bins.length;
    bins.forEach((count, i) => {
      const h = count / max * (H - 42); ctx.fillStyle = i === 1 ? "#ff6685" : "#5ce1ff";
      ctx.fillRect(pad + i * bw, H - 20 - h, Math.max(1, bw - 1), h);
    });
    $("chartTitle").textContent = "Prime-gap distribution";
    $("chartMeta").textContent = `mean ${s.meanGap.toFixed(2)} · σ ${s.gapStdDev.toFixed(2)}`;
  } else if (state.chart === "residues") {
    const values = [...s.residues30.entries()], max = Math.max(1, ...values.map((x) => x[1])), bw = (W - pad - 10) / values.length;
    values.forEach(([r, count], i) => {
      const h = count / max * (H - 48); ctx.fillStyle = i % 2 ? "#a98bff" : "#5fffc1";
      ctx.fillRect(pad + i * bw + 5, H - 24 - h, bw - 10, h); ctx.fillStyle = "#7892a8"; ctx.textAlign = "center"; ctx.fillText(String(r), pad + (i + .5) * bw, H - 8);
    });
    $("chartTitle").textContent = "Prime wheel · residues mod 30";
    $("chartMeta").textContent = "p > 5";
  } else {
    const samples = 120, pts = [], primes = state.data.primes; let pi = 0;
    for (let i = 1; i <= samples; i++) {
      const x = Math.max(2, Math.floor(i / samples * state.limit));
      while (pi < primes.length && primes[pi] <= x) pi++;
      pts.push([pad + i / samples * (W - pad - 10), H - 18 - pi / Math.max(1, primes.length) * (H - 38)]);
    }
    ctx.strokeStyle = "#5ce1ff"; ctx.lineWidth = 2; ctx.beginPath(); pts.forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.stroke();
    ctx.strokeStyle = "#ffcb6b88"; ctx.setLineDash([4,4]); ctx.beginPath();
    for (let i = 1; i <= samples; i++) { const x0 = Math.max(2, i / samples * state.limit), y = H - 18 - (x0 / Math.log(x0)) / Math.max(1, primes.length) * (H - 38), x = pad + i / samples * (W - pad - 10); i === 1 ? ctx.moveTo(x,y) : ctx.lineTo(x,y); } ctx.stroke(); ctx.setLineDash([]);
    $("chartTitle").textContent = "Prime-counting staircase π(x)";
    $("chartMeta").textContent = "cyan exact · gold x/ln x";
  }
}

function setView(view, preserveCamera = false) {
  state.view = view;
  document.querySelectorAll("[data-view]").forEach((b) => b.classList.toggle("on", b.dataset.view === view));
  const copy = {
    atlas: ["Ulam Atlas", "Square-spiral coordinates expose diagonal prime structure across the integer plane."],
    solar: ["Residue Orrery", "Eight orbital families are the numbers coprime to 30; every prime above five must inhabit one."],
    constellation: ["Prime Constellations", "Twin, cousin and sexy-prime separations become bonds on a Fibonacci celestial sphere."],
  }[view];
  $("viewTitle").textContent = copy[0]; $("viewNote").textContent = copy[1];
  buildUniverse({ preserveCamera });
}

function updateFocus(move = true) {
  const prime = state.focus, loc = positionsByPrime.get(prime);
  $("focusReadout").textContent = `FOCUS ${prime.toLocaleString()}`;
  if (!loc) { marker.visible = false; return; }
  marker.position.set(loc.x, loc.y, loc.z); marker.visible = true;
  if (move) {
    controls.target.set(loc.x, loc.y, loc.z);
    camera.position.set(loc.x + 2.4, loc.y + 2, loc.z + 3);
    controls.autoRotate = false; controls.update();
  }
}

function inspect() {
  const n = Math.max(1, Math.min(1e9, Math.floor(Number($("inspectNumber").value) || 1)));
  $("inspectNumber").value = String(n);
  if (isPrime(n)) {
    const ordinal = n <= state.limit ? state.data.primes.indexOf(n) + 1 : null;
    $("inspectResult").textContent = `${n.toLocaleString()} is prime${ordinal ? ` · body #${ordinal.toLocaleString()}` : " · beyond this survey horizon"}`;
    state.focus = n; updateFocus(true);
  } else {
    $("inspectResult").textContent = `${n.toLocaleString()} is composite · ${formatFactorization(n)}`;
  }
}

function pickPrime(event) {
  if (!primePoints) return;
  const rect = renderer.domElement.getBoundingClientRect();
  const mouse = new THREE.Vector2((event.clientX - rect.left) / rect.width * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
  const ray = new THREE.Raycaster(); ray.params.Points.threshold = .14; ray.setFromCamera(mouse, camera);
  const hit = ray.intersectObject(primePoints)[0];
  if (!hit || hit.index == null) return;
  const p = state.data.primes[hit.index];
  if (!p) return;
  state.focus = p; $("inspectNumber").value = p; inspect();
}

async function shareView() {
  const payload = { type: "prime-view", view: state.view, limit: state.limit, focus: state.focus };
  if (window.webxdc?.sendUpdate) window.webxdc.sendUpdate({ payload, info: `Shared prime ${state.focus} in ${state.view} view`, summary: `ℙ ${state.focus} · ${state.view}` }, "prime universe");
}

function bind() {
  $("viewSwitch").addEventListener("click", (event) => { const b = event.target.closest("[data-view]"); if (b) setView(b.dataset.view); });
  $("limit").addEventListener("input", () => { $("limitLabel").textContent = Number($("limit").value).toLocaleString(); });
  $("quickLimits").addEventListener("click", (event) => { const b = event.target.closest("[data-limit]"); if (!b) return; $("limit").value = b.dataset.limit; document.querySelectorAll("[data-limit]").forEach((x) => x.classList.toggle("on", x === b)); buildUniverse(); });
  $("rebuild").onclick = () => buildUniverse();
  $("inspectBtn").onclick = inspect;
  $("inspectNumber").addEventListener("keydown", (event) => { if (event.key === "Enter") inspect(); });
  $("chartTabs").addEventListener("click", (event) => { const b = event.target.closest("[data-chart]"); if (!b) return; state.chart = b.dataset.chart; document.querySelectorAll("[data-chart]").forEach((x) => x.classList.toggle("on", x === b)); renderChart(); });
  $("sharePrime").onclick = shareView;
  $("panelToggle").onclick = () => { const panel = $("primePanel"), open = panel.classList.toggle("open"); $("panelToggle").setAttribute("aria-expanded", String(open)); };
}

async function main() {
  initScene(); bind(); buildUniverse(); inspect();
  if (window.webxdc?.setUpdateListener) await window.webxdc.setUpdateListener((update) => {
    const p = update.payload;
    if (p?.type !== "prime-view" || !["atlas","solar","constellation"].includes(p.view)) return;
    $("limit").value = String(Math.max(100, Math.min(100000, Number(p.limit) || 10000)));
    state.focus = Math.max(2, Number(p.focus) || 2); setView(p.view);
    $("inspectNumber").value = String(state.focus); inspect();
  }, 0);
}

main().catch((error) => {
  $("viewNote").textContent = `Prime universe failed to initialise: ${error.message || error}`;
  console.error(error);
});
