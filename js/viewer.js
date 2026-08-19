import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { loadEngine } from "./engine.js";
import {
  WORDLIST,
  parsePhrase,
  mnemonicToEntropy,
  randomMnemonic,
  wordCountToEntropyBits,
  keyspaceDecimal,
  indicesOf,
} from "./bip39.js";

const $ = (id) => document.getElementById(id);

const state = {
  engine: null,
  words: [],
  analysis: null,
};

let scene, camera, renderer, controls;
let wordCloud, fieldPts, pathLine, pathGlow;

function initThree() {
  const canvas = $("stage");
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.setClearColor(0x07080d, 1);

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x07080d, 0.045);

  camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.05, 80);
  camera.position.set(4.2, 2.4, 5.6);

  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.35;

  scene.add(new THREE.AmbientLight(0x6ec8ff, 0.35));
  const key = new THREE.PointLight(0x5ce1ff, 2.2, 30);
  key.position.set(3, 4, 2);
  scene.add(key);
  const rim = new THREE.PointLight(0xff5d6c, 1.1, 24);
  rim.position.set(-4, -1, -3);
  scene.add(rim);

  const grid = new THREE.PolarGridHelper(5.2, 16, 8, 64, 0x163246, 0x0d1c28);
  grid.position.y = -3.2;
  scene.add(grid);

  window.addEventListener("resize", () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight, false);
  });

  const tick = () => {
    controls.update();
    if (wordCloud) wordCloud.rotation.y += 0.0004;
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  };
  tick();
}

function makeCloud(positions) {
  if (wordCloud) scene.remove(wordCloud);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.028,
    color: 0x7ecbff,
    transparent: true,
    opacity: 0.55,
    sizeAttenuation: true,
  });
  wordCloud = new THREE.Points(geo, mat);
  wordCloud.scale.setScalar(3.1);
  scene.add(wordCloud);
}

function makeField(positions) {
  if (fieldPts) scene.remove(fieldPts);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.035,
    color: 0xffb020,
    transparent: true,
    opacity: 0.22,
  });
  fieldPts = new THREE.Points(geo, mat);
  scene.add(fieldPts);
}

function makePath(positions) {
  if (pathLine) scene.remove(pathLine);
  if (pathGlow) scene.remove(pathGlow);
  if (!positions.length) return;

  const scaled = positions.map((v) => v * 3.1);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(scaled, 3));
  pathLine = new THREE.Line(
    geo,
    new THREE.LineBasicMaterial({ color: 0x3dffb0, transparent: true, opacity: 0.9 })
  );
  scene.add(pathLine);

  const dots = new THREE.BufferGeometry();
  dots.setAttribute("position", new THREE.Float32BufferAttribute(scaled, 3));
  pathGlow = new THREE.Points(
    dots,
    new THREE.PointsMaterial({ size: 0.12, color: 0x3dffb0 })
  );
  scene.add(pathGlow);
}

function hex(bytes) {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function bitString(bytes) {
  return [...bytes].map((b) => b.toString(2).padStart(8, "0")).join(" ");
}

function renderAnalysis(words, analysis) {
  $("chips").innerHTML = words
    .map((w, i) => {
      const last = i === words.length - 1;
      return `<span class="chip ${last ? "cs" : ""}">${String(i + 1).padStart(2, "0")} ${w}</span>`;
    })
    .join("");

  const status = $("status");
  if (!analysis) {
    status.className = "status warn";
    status.textContent = "No phrase loaded";
    return;
  }
  status.className = "status " + (analysis.ok ? "ok" : "bad");
  status.textContent = analysis.reason;

  if (analysis.entropy) {
    const bits = analysis.entropyBits;
    $("entBits").textContent = `${bits} bits`;
    $("csBits").textContent = `${analysis.checksumBits} checksum bits`;
    $("space").textContent = `2^${bits} ≈ ${keyspaceDecimal(bits)}`;
    $("hex").textContent = hex(analysis.entropy);
    $("bin").textContent = bitString(analysis.entropy);
    $("model").textContent = `${words.length} × 11-bit symbols on a 2048-word manifold · WASM scatter + SHA-256 checksum`;
  }
}

async function applyPhrase(text) {
  const words = parsePhrase(text);
  $("phrase").value = words.join(" ");
  state.words = words;
  if (!words.length) {
    state.analysis = null;
    renderAnalysis([], null);
    makePath([]);
    return;
  }
  const analysis = await mnemonicToEntropy(words);
  state.analysis = analysis;
  renderAnalysis(words, analysis);

  const idxs = indicesOf(words).map((i) => (i < 0 ? 0 : i));
  const path = state.engine.phrasePath(idxs);
  makePath(path);

  const seed = analysis.entropy ?? new TextEncoder().encode(words.join(" "));
  makeField(state.engine.entropyField(seed, 5000));
}

async function generate() {
  const n = Number($("wc").value);
  const { words } = await randomMnemonic(n);
  await applyPhrase(words.join(" "));
}

async function main() {
  initThree();
  $("wl").textContent = `${WORDLIST.length} symbols`;
  $("wcNote").textContent = `12 words → ${wordCountToEntropyBits(12)} bits`;

  state.engine = await loadEngine();
  makeCloud(state.engine.scatterWords(2048));

  $("apply").onclick = () => applyPhrase($("phrase").value);
  $("gen").onclick = generate;
  $("wc").onchange = () => {
    $("wcNote").textContent = `${$("wc").value} words → ${wordCountToEntropyBits(Number($("wc").value))} bits`;
  };

  await generate();
}

main().catch((err) => {
  $("status").className = "status bad";
  $("status").textContent = err.message || String(err);
  console.error(err);
});
