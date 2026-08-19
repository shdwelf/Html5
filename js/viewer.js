import * as THREE from "../vendor/three.module.min.js";
import { OrbitControls } from "../vendor/OrbitControls.js";
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
const isCoarse = matchMedia("(pointer: coarse)").matches || innerWidth < 860;

const state = { engine: null, words: [], analysis: null, applyingRemote: false };

let scene, camera, renderer, controls;
let wordCloud, fieldPts, pathLine, pathGlow;

function viewSize() {
  const vv = window.visualViewport;
  return {
    w: Math.max(1, Math.floor(vv?.width ?? innerWidth)),
    h: Math.max(1, Math.floor(vv?.height ?? innerHeight)),
  };
}

function resize() {
  const { w, h } = viewSize();
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}

function initThree() {
  const canvas = $("stage");
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !isCoarse,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, isCoarse ? 1.5 : 2));
  renderer.setClearColor(0x07080d, 1);

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x07080d, 0.045);

  camera = new THREE.PerspectiveCamera(55, 1, 0.05, 80);
  camera.position.set(4.2, 2.4, 5.6);

  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = !isCoarse;
  controls.rotateSpeed = isCoarse ? 0.7 : 1;
  controls.zoomSpeed = isCoarse ? 0.8 : 1;
  controls.minDistance = 2.2;
  controls.maxDistance = 16;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.28;
  controls.addEventListener("start", () => {
    controls.autoRotate = false;
  });

  scene.add(new THREE.AmbientLight(0x6ec8ff, 0.35));
  const key = new THREE.PointLight(0x5ce1ff, 2.2, 30);
  key.position.set(3, 4, 2);
  scene.add(key);
  const rim = new THREE.PointLight(0xff5d6c, 1.1, 24);
  rim.position.set(-4, -1, -3);
  scene.add(rim);

  const grid = new THREE.PolarGridHelper(5.2, 12, 6, 48, 0x163246, 0x0d1c28);
  grid.position.y = -3.2;
  scene.add(grid);

  resize();
  addEventListener("resize", resize);
  visualViewport?.addEventListener("resize", resize);
  visualViewport?.addEventListener("scroll", resize);

  const tick = () => {
    controls.update();
    if (wordCloud) wordCloud.rotation.y += 0.0004;
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  };
  tick();
}

function makeCloud(positions) {
  if (wordCloud) {
    scene.remove(wordCloud);
    wordCloud.geometry.dispose();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  wordCloud = new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      size: isCoarse ? 0.038 : 0.028,
      color: 0x7ecbff,
      transparent: true,
      opacity: 0.55,
      sizeAttenuation: true,
    })
  );
  wordCloud.scale.setScalar(3.1);
  scene.add(wordCloud);
}

function makeField(positions) {
  if (fieldPts) {
    scene.remove(fieldPts);
    fieldPts.geometry.dispose();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  fieldPts = new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      size: 0.035,
      color: 0xffb020,
      transparent: true,
      opacity: 0.22,
    })
  );
  scene.add(fieldPts);
}

function makePath(positions) {
  if (pathLine) {
    scene.remove(pathLine);
    pathLine.geometry.dispose();
  }
  if (pathGlow) {
    scene.remove(pathGlow);
    pathGlow.geometry.dispose();
  }
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
  pathGlow = new THREE.Points(dots, new THREE.PointsMaterial({ size: 0.12, color: 0x3dffb0 }));
  scene.add(pathGlow);
}

function hex(bytes) {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
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
    $("csBits").textContent = `${analysis.checksumBits} bits`;
    $("space").textContent = `2^${bits} ≈ ${keyspaceDecimal(bits)}`;
    $("hex").textContent = hex(analysis.entropy);
    $("model").textContent = `${words.length} × 11-bit symbols · WASM scatter · SHA-256 checksum`;
  }
}

async function applyPhrase(text, { broadcast = false } = {}) {
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
  makePath(state.engine.phrasePath(idxs));

  const seed = analysis.entropy ?? new TextEncoder().encode(words.join(" "));
  const fieldN = isCoarse ? 2200 : 5000;
  makeField(state.engine.entropyField(seed, fieldN));

  if (broadcast && window.webxdc?.sendUpdate) {
    window.webxdc.sendUpdate(
      {
        payload: { type: "phrase", words },
        info: `Projected ${words.length}-word keyspace path`,
        summary: `${words.length} words · ${analysis.entropyBits || "?"} bits`,
      },
      "keyspace phrase"
    );
  }
}

async function generate() {
  const n = Number($("wc").value);
  const { words } = await randomMnemonic(n);
  await applyPhrase(words.join(" "));
}

function bindSheet() {
  const sheet = $("sheet");
  const toggle = $("sheetToggle");
  const setOpen = (open) => {
    sheet.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.textContent = open ? "Hide controls" : "Phrase & entropy";
  };
  toggle.onclick = () => setOpen(!sheet.classList.contains("open"));
  sheet.querySelector(".handle").addEventListener("click", () => {
    setOpen(!sheet.classList.contains("open"));
  });
}

async function shareChat() {
  const text = state.words.join(" ");
  if (!text) return;
  if (window.webxdc?.sendToChat) {
    try {
      await window.webxdc.sendToChat({ text });
      return;
    } catch {
      /* user cancelled */
    }
  }
  await applyPhrase(text, { broadcast: true });
}

async function main() {
  initThree();
  bindSheet();
  $("wl").textContent = `${WORDLIST.length}`;
  $("wcNote").textContent = `12 words → ${wordCountToEntropyBits(12)} bits`;

  state.engine = await loadEngine("./wasm/entropy.wasm");
  makeCloud(state.engine.scatterWords(2048));

  $("apply").onclick = () => applyPhrase($("phrase").value);
  $("gen").onclick = generate;
  $("share").onclick = shareChat;
  $("wc").onchange = () => {
    $("wcNote").textContent = `${$("wc").value} words → ${wordCountToEntropyBits(Number($("wc").value))} bits`;
  };
  $("phrase").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      applyPhrase($("phrase").value);
      $("phrase").blur();
    }
  });

  if (window.webxdc?.setUpdateListener) {
    await window.webxdc.setUpdateListener((update) => {
      const p = update.payload;
      if (p?.type === "phrase" && Array.isArray(p.words)) {
        applyPhrase(p.words.join(" "));
      }
    });
  }

  if (!state.words.length) await generate();
}

main().catch((err) => {
  $("status").className = "status bad";
  $("status").textContent = err.message || String(err);
  console.error(err);
});
