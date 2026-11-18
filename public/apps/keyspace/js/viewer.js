import * as THREE from "../vendor/three.module.min.js";
import { OrbitControls } from "../vendor/OrbitControls.js";
import { loadEngine } from "./engine.js";
import {
  WORDLIST,
  parsePhrase,
  mnemonicToEntropy,
  entropyToMnemonic,
  keyspaceDecimal,
  indicesOf,
  layoutForWords,
  layoutForEntropyBits,
  STANDARD_WORDS,
  MIN_WORDS,
  MAX_WORDS,
} from "./bip39.js";
import {
  bytesToBits,
  prefixBits,
  fibonacciSphere,
  polarIndexEmbedding,
  SCALE_MARKS,
  analogForBits,
  lastWordSplit,
  curveTable,
} from "./spacefill.js";
import {
  SOURCES,
  rollsNeeded,
  rollsToEntropy,
  parseRolls,
  shannonBits,
  onesRatio,
} from "./entropy-live.js";
import { INDEX } from "./bip39.js";
import { searchWords, wordFromBits, bitsFromIndex } from "./lexicon.js";
import {
  binaryReflectedGray,
  flipEntropyBit,
  hypercubeLayout,
  indexChanged,
  bitsToInt,
} from "./mathvis.js";
import { buildForm, FORMS } from "./forms3d.js";
import { pathTemplate, PIPELINE } from "./hdtopo.js";
import { greedy575 } from "./syllables.js";
import { drawEnso, encodeEnsoId, hashStr, prettyId, randomSettings } from "./enso-id.js";
import { deriveBitcoinWallet } from "./wallet-derivatives.js";
import { searchCoins } from "./coins.js";
import { networksForCoin, coinOnNetwork, deriveCoinNetwork } from "./coin-networks.js";
import { entropyStatistics } from "./key-stats.js";
import { LENSES, LENS_BY_ID, invertReport, notBytes } from "./formal.js";
import { drawLens } from "./lens-draw.js";
import { buildLensLayer, LENS_3D } from "./lens-3d.js";
import { initGaloisExplorer } from "./galois-view.js";
import { researchedNetworks } from "./coin-research.js";
import { initCoinWorkbench } from "./coin-workbench.js";

const $ = (id) => document.getElementById(id);
const isCoarse = matchMedia("(pointer: coarse)").matches || innerWidth < 860;
const SLICE_ORDER = 7; // 128×128 from top 14 bits
const SLICE_BITS = SLICE_ORDER * 2;

const state = {
  engine: null,
  words: [],
  analysis: null,
  embed: "scatter",
  curve: "hilbert",
  scatterCache: null,
  src: "coin",
  decodeBits: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  cubeN: 5,
  flipBit: 0,
  mathStep: 1,
  form: "hd",
  wallet: null,
  walletScheme: "84",
  walletRevealed: false,
  topCoins: [],
  tokenNetworks: null,
  topCoinEpoch: 0,
  topCoinResult: null,
  statsView: "nibbles",
  statistics: null,
  /* layers: invert keyspace A↔B + formal-system lenses */
  wordsB: [],
  analysisB: null,
  pair: null,
  lens: "inv-subcube",
  layers: new Set(["inv-subcube"]),
  layerObjs: new Map(),
  flips: null,
  flipsKey: null,
  anf: null,
  anfKey: null,
  pathPts: [],
  actions: [],
  timings: [],
  seed: 12345,
};

let formGroup = null;
let lensGroup = null;
let galoisExplorer = null;
let coinWorkbench = null;

let scene, camera, renderer, controls;
let wordCloud, fieldPts, pathLine, pathGlow, sliceMarker;

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

  sliceMarker = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0xffb020 })
  );
  sliceMarker.visible = false;
  scene.add(sliceMarker);

  lensGroup = new THREE.Group();
  lensGroup.name = "lensLayers";
  scene.add(lensGroup);

  resize();
  addEventListener("resize", resize);
  visualViewport?.addEventListener("resize", resize);
  visualViewport?.addEventListener("scroll", resize);

  const tick = () => {
    controls.update();
    if (wordCloud && state.embed === "scatter") wordCloud.rotation.y += 0.0004;
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

function startTicker() {
  const cv = $("ticker");
  if (!cv) return;
  const ctx = cv.getContext("2d");
  const buf = new Uint8Array(48);
  const tick = () => {
    crypto.getRandomValues(buf);
    ctx.fillStyle = "rgba(7,8,13,0.35)";
    ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.font = "11px ui-monospace, monospace";
    ctx.fillStyle = "#5ce1ff";
    for (let row = 0; row < 3; row++) {
      let line = "";
      for (let i = 0; i < 16; i++) line += buf[row * 16 + i].toString(16).padStart(2, "0") + " ";
      ctx.fillText(line, 6, 18 + row * 18);
    }
    requestAnimationFrame(tick);
  };
  tick();
}

function renderHoles(words, indices, checksumBits) {
  const host = $("holes");
  if (!host) return;
  if (!words.length) {
    host.innerHTML = "";
    return;
  }
  host.innerHTML = words
    .map((w, i) => {
      const idx = indices[i] ?? 0;
      const last = i === words.length - 1;
      const pips = [];
      for (let b = 10; b >= 0; b--) {
        const on = (idx >> b) & 1;
        const cs = last && checksumBits && b < checksumBits;
        pips.push(`<i class="pip${on ? " on" : ""}${cs ? " cs" : ""}"></i>`);
      }
      return `<div class="hole-row"><span class="w">${String(i + 1).padStart(2, "0")} ${w}</span><div class="pips">${pips.join("")}</div></div>`;
    })
    .join("");
}

function updateLiveStats(entropy) {
  if (!entropy) {
    $("shan").textContent = "—";
    $("ones").textContent = "—";
    return;
  }
  $("shan").textContent = shannonBits(entropy).toFixed(3);
  $("ones").textContent = `${(onesRatio(entropy) * 100).toFixed(1)}%`;
}

function updateRollNeed() {
  const src = SOURCES[state.src] || SOURCES.coin;
  const bits = currentLayout()?.entBits || 128;
  const need = rollsNeeded(bits, src.bits);
  const have = parseRolls($("rolls").value, state.src).length;
  $("poolBits").textContent = (have * src.bits).toFixed(1);
  $("rollNeed").textContent = `${have}/${need} ${src.label} · ${src.bits.toFixed(3)} bits/event · ${bits}-bit target`;
}

async function commitRolls() {
  const src = SOURCES[state.src];
  if (!src) return;
  const layout = currentLayout();
  const bits = layout?.entBits;
  if (!bits) {
    $("status").className = "status warn";
    $("status").textContent = "Pick a valid length first";
    return;
  }
  const values = parseRolls($("rolls").value, state.src);
  const need = rollsNeeded(bits, src.bits);
  if (values.length < need) {
    $("status").className = "status warn";
    $("status").textContent = `Need ${need - values.length} more ${src.label} events`;
    return;
  }
  const entropy = rollsToEntropy(values.slice(0, need), src.base, bits / 8);
  const words = await entropyToMnemonic(entropy);
  await applyPhrase(words.join(" "));
}

function paintDecode() {
  const host = $("decodePips");
  host.innerHTML = state.decodeBits
    .map((b, i) => `<button type="button" class="pip${b ? " on" : ""}" data-bit="${i}"></button>`)
    .join("");
  const { index, word } = wordFromBits(state.decodeBits);
  $("decodeWord").value = word;
  $("decodeOut").textContent = `${word} · index ${index} · 0x${index.toString(16).padStart(3, "0")} · ${index.toString(2).padStart(11, "0")}`;
}

function setDecodeFromWord(text) {
  const w = text.trim().toLowerCase();
  if (!INDEX.has(w)) {
    $("decodeOut").textContent = w ? `Not in BIP-39 list: ${w}` : "Toggle 11 bits ↔ word.";
    return;
  }
  state.decodeBits = bitsFromIndex(INDEX.get(w));
  paintDecode();
}

function renderLex(q = "") {
  const rows = searchWords(q, 28);
  $("lex").innerHTML = rows
    .map((e) => {
      const near = e.near.length ? ` · near <span class="near">${e.near.join(", ")}</span>` : "";
      return `<div class="lex-item"><b>${e.word}</b> #${e.index} 0x${e.hex} ${e.bin} · ${e.prefix}${near}</div>`;
    })
    .join("");
}

function clearForm() {
  if (!formGroup) return;
  scene.remove(formGroup);
  formGroup.traverse((o) => {
    o.geometry?.dispose?.();
    o.material?.dispose?.();
  });
  formGroup = null;
}

function setCloudVisible(v) {
  if (wordCloud) wordCloud.visible = v;
  if (fieldPts) fieldPts.visible = v;
  if (pathLine) pathLine.visible = v;
  if (pathGlow) pathGlow.visible = v;
}

function applyForm() {
  if (!scene) return;
  clearForm();
  const name = state.form;
  const a = state.analysis;
  formGroup = buildForm(name, {
    entropy: a?.entropy,
    indices: a?.indices || indicesOf(state.words),
    checksumBits: a?.checksumBits,
  });
  scene.add(formGroup);
  setCloudVisible(name === "lattice" || name === "hilbert" ? false : false);
  const label = FORMS.find((f) => f[0] === name)?.[1] || name;
  const extra =
    name === "hd"
      ? ` ${pathTemplate(84, 0)} · ${PIPELINE.join(" → ")}`
      : name === "torus"
        ? " PBKDF2-HMAC-SHA512 ×2048 → 512 bits = IL∥IR (shown as torus, not printed)."
        : name === "curve"
          ? " Real Weierstrass sketch y²=x³+7 — not secp256k1 / Fp."
          : name === "distribution"
            ? " Sixteen measured nibble bins arranged as a skyline; height is observed count."
            : name === "autocorrelation"
              ? " Measured Pearson r for entropy-bit lags 1–32; radius and height encode sign and magnitude."
              : "";
  if ($("formNote")) {
    const measured = name === "distribution" || name === "autocorrelation";
    $("formNote").textContent = `${label}.${extra} ${measured ? "Measured descriptive layer; not a randomness test." : "Art only."}`;
  }
}

function applyEmbedding() {
  let pos;
  if (state.embed === "fibonacci") pos = fibonacciSphere(2048);
  else if (state.embed === "polar") pos = polarIndexEmbedding(2048);
  else pos = state.scatterCache || state.engine.scatterWords(2048);
  state.engine.setWordPositions(pos);
  makeCloud(pos);
  if (state.words.length) {
    const idxs = indicesOf(state.words).map((i) => (i < 0 ? 0 : i));
    makePath(state.engine.phrasePath(idxs));
  }
  const notes = {
    scatter: "Random WASM mixer — nearby indices are not nearby in space.",
    fibonacci: "Even sphere packing in index order — consecutive words walk the spiral.",
    polar: "64×32 lattice of the 11-bit index — adjacent words share a meridian.",
  };
  $("embedNote").textContent = notes[state.embed];
}

function drawSlice(entropy, totalBits) {
  const cv = $("slice");
  const ctx = cv.getContext("2d");
  const w = cv.width;
  const order = SLICE_ORDER;
  const bits = SLICE_BITS;
  const { n, xs, ys } = curveTable(state.curve, order);
  const img = ctx.createImageData(n, n);
  const data = img.data;
  const total = n * n;
  for (let i = 0; i < total; i++) {
    const x = xs[i];
    const y = ys[i];
    const o = (y * n + x) * 4;
    const t = i / total;
    data[o] = 12 + t * 40;
    data[o + 1] = 40 + t * 140;
    data[o + 2] = 60 + t * 160;
    data[o + 3] = 255;
  }

  let mark = { x: 0, y: 0 };
  let idx = 0;
  if (entropy) {
    idx = prefixBits(entropy, bits);
    mark = { x: xs[idx], y: ys[idx] };
    const lo = Math.max(0, idx - 48);
    const hi = Math.min(total - 1, idx + 48);
    for (let i = lo; i <= hi; i++) {
      const o = (ys[i] * n + xs[i]) * 4;
      const near = 1 - Math.abs(i - idx) / 48;
      data[o] = 61;
      data[o + 1] = 255 * near;
      data[o + 2] = 176;
    }
  }

  ctx.imageSmoothingEnabled = false;
  ctx.putImageData(img, 0, 0);
  ctx.drawImage(cv, 0, 0, n, n, 0, 0, w, w);

  if (!entropy) {
    $("sliceNote").textContent = "Load a phrase to mark a cell.";
    sliceMarker.visible = false;
    return;
  }

  const cell = w / n;
  ctx.strokeStyle = "#3dffb0";
  ctx.lineWidth = 2;
  ctx.strokeRect(mark.x * cell - 2, mark.y * cell - 2, cell + 4, cell + 4);

  const remain = Math.max(0, totalBits - bits);
  $("sliceNote").textContent =
    `${state.curve} d=${idx} → (${mark.x},${mark.y}) from top ${bits} bits. ` +
    `Cell still holds 2^${remain} keys — the plane is not the space.`;

  sliceMarker.position.set((mark.x / n) * 6 - 3, -3.05, (mark.y / n) * 6 - 3);
  sliceMarker.visible = true;
}

function drawBitPlane(entropy, csBits, csObserved) {
  const cv = $("bits");
  const ctx = cv.getContext("2d");
  const cols = 16;
  const entBits = entropy ? bytesToBits(entropy) : [];
  const all = entBits.concat(csObserved || []);
  const rows = Math.max(8, Math.ceil(all.length / cols) || 8);
  cv.height = Math.max(64, rows * 16);
  const cw = cv.width / cols;
  const ch = cv.height / rows;
  ctx.fillStyle = "#05070c";
  ctx.fillRect(0, 0, cv.width, cv.height);
  for (let i = 0; i < rows * cols; i++) {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const bit = all[i];
    const isCs = i >= entBits.length && i < all.length;
    if (bit === undefined) ctx.fillStyle = "#0b1018";
    else if (isCs) ctx.fillStyle = bit ? "#ffb020" : "#4a3208";
    else ctx.fillStyle = bit ? "#5ce1ff" : "#163246";
    ctx.fillRect(c * cw + 1, r * ch + 1, cw - 2, ch - 2);
  }
}

function renderTape(words, indices, checksumBits) {
  const split = lastWordSplit(0, checksumBits || 0);
  const rows = words
    .map((w, i) => {
      const idx = indices[i] ?? -1;
      const raw = idx < 0 ? "-----------" : idx.toString(2).padStart(11, "0");
      const cs = i === words.length - 1 && checksumBits;
      let bin = raw;
      if (cs && idx >= 0) {
        const cut = 11 - checksumBits;
        bin = `${raw.slice(0, cut)}<span class="csb">${raw.slice(cut)}</span>`;
      }
      return `<tr class="${cs ? "cs" : ""}"><td>${i + 1}</td><td>${w}</td><td>${
        idx < 0 ? "—" : idx
      }</td><td class="bin">${bin}</td><td>${
        cs ? `${split.leftover} ENT + ${checksumBits} CS` : "ENT"
      }</td></tr>`;
    })
    .join("");
  $("tape").innerHTML =
    `<thead><tr><th>#</th><th>Word</th><th>Index</th><th>11 bits</th><th></th></tr></thead><tbody>${rows}</tbody>`;
}

function setMathStep(n) {
  state.mathStep = Math.min(6, Math.max(1, n));
  document.querySelectorAll(".math-step").forEach((el) => {
    el.classList.toggle("on", Number(el.dataset.math) === state.mathStep);
  });
  $("mathPos").textContent = `${state.mathStep} / 6`;
  $("mathPrev").disabled = state.mathStep <= 1;
  $("mathNext").disabled = state.mathStep >= 6;
  drawMath(state.analysis);
}

function drawParallel(indices, changed = []) {
  const cv = $("parallel");
  if (!cv) return;
  const ctx = cv.getContext("2d");
  const w = cv.width;
  const h = cv.height;
  ctx.fillStyle = "#05070c";
  ctx.fillRect(0, 0, w, h);
  const n = Math.max(1, indices.length);
  const pad = 18;
  const xs = (i) => pad + (i / Math.max(1, n - 1)) * (w - pad * 2);
  ctx.strokeStyle = "#163246";
  ctx.lineWidth = 1;
  // One axis per word up to 64 words; beyond that thin the guides out so a
  // 512-word phrase does not paint the whole plot the axis colour.
  const axisStep = Math.max(1, Math.ceil(n / 64));
  for (let i = 0; i < n; i += axisStep) {
    ctx.beginPath();
    ctx.moveTo(xs(i), 10);
    ctx.lineTo(xs(i), h - 16);
    ctx.stroke();
  }
  if (!indices.length) return;
  ctx.beginPath();
  ctx.strokeStyle = "#3dffb0";
  ctx.lineWidth = 1.5;
  indices.forEach((idx, i) => {
    const y = 10 + (1 - Math.max(0, idx) / 2047) * (h - 28);
    if (i === 0) ctx.moveTo(xs(i), y);
    else ctx.lineTo(xs(i), y);
  });
  ctx.stroke();
  // 512 words share the same width as 12: shrink the markers so the polyline
  // stays readable instead of dissolving into one bar.
  const dot = n > 128 ? 1.2 : n > 48 ? 2.2 : 3.5;
  indices.forEach((idx, i) => {
    const y = 10 + (1 - Math.max(0, idx) / 2047) * (h - 28);
    ctx.fillStyle = changed.includes(i) ? "#ffb020" : "#5ce1ff";
    ctx.beginPath();
    ctx.arc(xs(i), y, changed.includes(i) ? Math.max(dot, 3) : dot, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawFiber(csBits, observed) {
  const cv = $("fiber");
  if (!cv) return;
  const n = Math.max(1, 1 << (csBits || 0));
  const cols = n <= 256 ? Math.min(n, 16) : 32;
  const rows = Math.ceil(n / cols);
  const cell = n <= 256 ? 14 : 4;
  cv.width = 256;
  cv.height = Math.max(64, rows * cell);
  const ctx = cv.getContext("2d");
  ctx.fillStyle = "#05070c";
  ctx.fillRect(0, 0, cv.width, cv.height);
  const cw = cv.width / cols;
  const ch = cv.height / rows;
  const lit = observed && observed.length ? bitsToInt(observed) : -1;
  for (let i = 0; i < n; i++) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    ctx.fillStyle = i === lit ? "#ffb020" : "#163246";
    ctx.fillRect(c * cw + 2, r * ch + 2, cw - 4, ch - 4);
  }
  $("fiberNote").textContent =
    `${n} checksum cells (2^${csBits}). Lit cell = SHA-256(ENT) prefix. Graph of a hash, not a linear subspace.`;
}

function drawGray(indices) {
  const cv = $("gray");
  if (!cv) return;
  const ctx = cv.getContext("2d");
  const w = cv.width;
  const h = cv.height;
  ctx.fillStyle = "#05070c";
  ctx.fillRect(0, 0, w, h);
  const cx = w / 2;
  const cy = h / 2;
  const R = Math.min(w, h) * 0.42;
  ctx.strokeStyle = "#12202c";
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();
  const step = 8;
  ctx.fillStyle = "#163246";
  for (let i = 0; i < 2048; i += step) {
    const g = binaryReflectedGray(i);
    const a = (g / 2048) * Math.PI * 2;
    ctx.fillRect(cx + Math.cos(a) * R - 0.6, cy + Math.sin(a) * R - 0.6, 1.4, 1.4);
  }
  (indices || []).forEach((idx, k) => {
    if (idx < 0) return;
    const a = (binaryReflectedGray(idx) / 2048) * Math.PI * 2;
    ctx.fillStyle = k === indices.length - 1 ? "#ffb020" : "#3dffb0";
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * R, cy + Math.sin(a) * R, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawCube(entropy) {
  const cv = $("cube");
  if (!cv) return;
  const ctx = cv.getContext("2d");
  const { n, pts, edges } = hypercubeLayout(state.cubeN);
  ctx.fillStyle = "#05070c";
  ctx.fillRect(0, 0, cv.width, cv.height);
  const W = cv.width;
  const H = cv.height;
  ctx.strokeStyle = "#1a3040";
  ctx.lineWidth = 1;
  for (const [a, b] of edges) {
    ctx.beginPath();
    ctx.moveTo(pts[a].x * W, pts[a].y * H);
    ctx.lineTo(pts[b].x * W, pts[b].y * H);
    ctx.stroke();
  }
  let here = 0;
  if (entropy) here = prefixBits(entropy, n);
  pts.forEach((p) => {
    ctx.fillStyle = p.i === here ? "#3dffb0" : "#5ce1ff55";
    ctx.beginPath();
    ctx.arc(p.x * W, p.y * H, p.i === here ? 5 : 2.2, 0, Math.PI * 2);
    ctx.fill();
  });
  $("cubeNote").textContent = `Q_${n} face of C (first ${n} ENT bits). Vertex still contains 2^{ENT−${n}} keys.`;
}

function drawStatistics(analysis) {
  const cv = $("statsPlot");
  if (!cv) return;
  const ctx = cv.getContext("2d");
  ctx.fillStyle = "#05070c";
  ctx.fillRect(0, 0, cv.width, cv.height);
  if (!analysis?.entropy) {
    state.statistics = null;
    ["statBalance", "statRuns", "statLongest", "statByteH", "statUnique", "statWordSigma"]
      .forEach((id) => { $(id).textContent = "—"; });
    $("statsNote").textContent = "Load a phrase to measure its entropy bytes.";
    return;
  }

  const stats = entropyStatistics(analysis.entropy, analysis.indices || []);
  state.statistics = stats;
  const W = cv.width, H = cv.height, pad = 24;
  ctx.font = "10px ui-monospace, monospace";
  ctx.textAlign = "center";

  if (state.statsView === "nibbles") {
    const max = Math.max(1, ...stats.nibbleHistogram);
    const bw = (W - pad * 2) / 16;
    stats.nibbleHistogram.forEach((count, i) => {
      const h = (count / max) * (H - 54);
      ctx.fillStyle = i % 2 ? "#3dffb0" : "#5ce1ff";
      ctx.fillRect(pad + i * bw + 2, H - 24 - h, Math.max(2, bw - 4), h);
      ctx.fillStyle = "#7790a5";
      ctx.fillText(i.toString(16).toUpperCase(), pad + (i + 0.5) * bw, H - 8);
    });
    ctx.strokeStyle = "#ffb02088";
    ctx.setLineDash([4, 4]);
    const expectedY = H - 24 - ((analysis.entropy.length * 2 / 16) / max) * (H - 54);
    ctx.beginPath(); ctx.moveTo(pad, expectedY); ctx.lineTo(W - pad, expectedY); ctx.stroke();
    ctx.setLineDash([]);
  } else if (state.statsView === "runs") {
    const cols = 32, cell = (W - pad * 2) / cols;
    stats.bits.forEach((bit, i) => {
      const row = Math.floor(i / cols), col = i % cols;
      const y = 14 + row * 20;
      ctx.fillStyle = bit ? "#5ce1ff" : "#163246";
      ctx.fillRect(pad + col * cell + 1, y, Math.max(2, cell - 2), 13);
      if (i && bit !== stats.bits[i - 1]) {
        ctx.fillStyle = "#ffb020";
        ctx.fillRect(pad + col * cell, y, 1.5, 13);
      }
    });
  } else {
    const values = stats.autocorrelation;
    const bw = (W - pad * 2) / Math.max(1, values.length);
    const mid = H / 2;
    ctx.strokeStyle = "#385066";
    ctx.beginPath(); ctx.moveTo(pad, mid); ctx.lineTo(W - pad, mid); ctx.stroke();
    values.forEach(({ lag, correlation }, i) => {
      const h = correlation * (H * 0.38);
      ctx.fillStyle = correlation >= 0 ? "#3dffb0" : "#ff5d6c";
      ctx.fillRect(pad + i * bw + 1, h >= 0 ? mid - h : mid, Math.max(1, bw - 2), Math.abs(h));
      if (lag === 1 || lag % 8 === 0) {
        ctx.fillStyle = "#7790a5";
        ctx.fillText(String(lag), pad + (i + 0.5) * bw, H - 7);
      }
    });
  }

  $("statBalance").textContent = `${(stats.balance * 100).toFixed(1)}%`;
  $("statRuns").textContent = `${stats.runs} / ${stats.expectedRuns.toFixed(1)}`;
  $("statLongest").textContent = String(stats.longestRun);
  $("statByteH").textContent = `${stats.byteEntropy.toFixed(3)} / 8`;
  $("statUnique").textContent = `${stats.uniqueBytes} / ${analysis.entropy.length}`;
  $("statWordSigma").textContent = stats.wordStdDev.toFixed(1);
  $("statsNote").textContent =
    `Exploratory only: ${stats.bitCount} bits is too short for certification. ` +
    `Monobit p≈${stats.monobitP.toFixed(3)} · runs p≈${stats.runsApplicable ? stats.runsP.toFixed(3) : "n/a (balance gate)"} · ` +
    `nibble χ²=${stats.nibbleChiSquare.toFixed(2)} (15 df) · lag-1 word r=${stats.wordLag1.toFixed(3)}. ` +
    `P-values are descriptive multiple looks, not evidence that a key is safe.`;
}

function drawMath(analysis) {
  const idxs = analysis?.indices || [];
  drawParallel(idxs);
  drawFiber(analysis?.checksumBits || 0, analysis?.checksumExpected);
  drawGray(idxs);
  drawCube(analysis?.entropy);
  drawStatistics(analysis);
  const max = (analysis?.entropyBits || 128) - 1;
  $("flipBit").max = String(max);
}

async function previewAvalanche() {
  const a = state.analysis;
  if (!a?.entropy) return;
  const bit = Number($("flipBit").value);
  state.flipBit = bit;
  const flipped = flipEntropyBit(a.entropy, bit);
  const words = await entropyToMnemonic(flipped);
  const next = indicesOf(words);
  const hit = indexChanged(a.indices, next);
  drawParallel(a.indices, hit);
  const names = hit.map((i) => `${i + 1}:${state.words[i]}→${words[i]}`).join(" · ");
  $("avalancheNote").textContent = `Bit ${bit} flipped. Chunks that jumped: ${names || "none (shouldn't happen)"}. Last word usually moves (checksum avalanche).`;
  logAction("flip", a.ok);
}

function renderScale(bits) {
  const el = $("scale");
  const max = 256;
  const logPos = (b) => (b / max) * 100;
  el.innerHTML =
    `<span class="here" style="left:${logPos(bits || 0)}%"></span>` +
    SCALE_MARKS.map(
      (m) => `<span class="mark" style="left:${logPos(m.bits)}%"><i></i>${m.label}</span>`
    ).join("");
  $("scaleNote").textContent = bits ? analogForBits(bits) : "";
}

function seedFingerprint(entropy) {
  // FNV-1a through the existing ensō module. This only selects art parameters;
  // it is deliberately not presented as a cryptographic identifier.
  return hashStr(hex(entropy));
}

function renderSeedIdentity(words, analysis) {
  const canvas = $("seedEnso");
  const host = $("haiku");
  const id = $("ensoId");
  if (!canvas || !host || !id) return;

  if (!analysis?.ok || !analysis.entropy) {
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#05070c";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    host.innerHTML = ["Load a valid phrase", "to fold its words into", "a seed-linked poem"]
      .map((line) => `<div class="haiku-line"><b>—</b><span>${line}</span></div>`)
      .join("");
    id.textContent = "EN—";
    $("haikuNote").textContent = "A valid checksum is required. Nothing in this section is sent or stored.";
    return;
  }

  const poem = greedy575(words);
  host.innerHTML = poem.lines
    .map((line, i) => `<div class="haiku-line"><b>${poem.counts[i]}</b><span>${line.join(" ") || "—"}</span></div>`)
    .join("");
  const settings = randomSettings(seedFingerprint(analysis.entropy));
  drawEnso(canvas, settings);
  id.textContent = prettyId(encodeEnsoId(settings));
  $("haikuNote").textContent = poem.isHaiku
    ? "Exact 5–7–5 contiguous fold · deterministic entropy-linked ensō · local only."
    : `${poem.counts.join("–")} greedy fold (not a strict 5–7–5 haiku) · deterministic entropy-linked ensō · local only.`;
}

function copyHaiku() {
  const text = [...$("haiku").querySelectorAll(".haiku-line span")]
    .map((line) => line.textContent)
    .join("\n");
  if (!text) return;
  navigator.clipboard?.writeText(text).catch(() => {});
}

function saveEnso() {
  const canvas = $("seedEnso");
  if (!state.analysis?.ok || !canvas?.toDataURL) return;
  const a = document.createElement("a");
  a.download = `keyspace-enso-${$("ensoId").textContent.replace(/[^A-Z0-9]/gi, "").toLowerCase()}.png`;
  a.href = canvas.toDataURL("image/png");
  a.click();
}

function setWalletReveal(revealed) {
  state.walletRevealed = Boolean(revealed && state.wallet);
  $("walletOutput").classList.toggle("wallet-revealed", state.walletRevealed);
  $("revealWallet").setAttribute("aria-pressed", String(state.walletRevealed));
  $("revealWallet").textContent = state.walletRevealed ? "Hide secrets" : "Reveal secrets";
}

function renderWalletScheme() {
  const derived = state.wallet?.schemes[state.walletScheme];
  if (!derived) return;
  $("walletAccountLabel").textContent = `Account ${derived.accountKind}`;
  $("walletAccount").textContent = derived.accountPublic;
  $("walletRows").innerHTML = derived.rows.map((row) =>
    `<tr><td><code>${row.path}</code></td><td><code>${row.address}</code></td>` +
    `<td><code class="wallet-secret">${row.wif}</code></td></tr>`
  ).join("");
}

function clearTopCoin() {
  coinWorkbench?.clearDerived();
  state.topCoinEpoch++;
  state.topCoinResult = null;
  $("topCoinOutput").hidden = true;
  $("topCoinPath").textContent = "—";
  $("topCoinAddress").textContent = "—";
  $("topCoinPublic").textContent = "—";
  if (!state.wallet) $("clearWallet").disabled = true;
}

function selectedTopCoin() {
  return state.topCoins.find((coin) => coin.id === $("topCoin").value) || null;
}

function updateTopCoinNetwork() {
  clearTopCoin();
  const coin = selectedTopCoin();
  $("deriveTopCoin").disabled = !coin?.derive;
  $("topCoinNetworkInfo").textContent = "";
  if (!coin) {
    coinWorkbench?.setSelection(null, null);
    $("topCoinNote").textContent = "No matching asset in the offline snapshot.";
    return;
  }
  const networkId = $("topCoinNetwork").value;
  const network = networksForCoin(state.tokenNetworks, coin).find((item) => item.id === networkId);
  coinWorkbench?.setSelection(coin, network);
  if (!network) {
    $("deriveTopCoin").disabled = true;
    $("topCoinNote").textContent = "Select an explicit network first.";
    return;
  }
  const identity = [network.name, network.standard];
  if (network.chainId !== null) identity.push(`chain ID ${network.chainId}`);
  if (network.contract) identity.push(`Token contract (NOT receive address): ${network.contract}`, `decimals ${network.decimals}`, `fees: ${network.feeAsset}`);
  identity.push(network.warning);
  $("topCoinNetworkInfo").textContent = identity.join(" · ");
  $("topCoinNote").textContent = coin.derive
    ? `#${coin.rank} ${coin.name} · ${coinOnNetwork(state.tokenNetworks, coin, networkId).row.path} · local receive derivation. No signing, transfers, automatic balance checks or bridging. Read-only lookups require separate consent in the investigation tab.`
    : `#${coin.rank} ${coin.name} · unsupported: ${coin.reason}`;
}

function updateTopCoinSelection() {
  const networks = networksForCoin(state.tokenNetworks, selectedTopCoin());
  $("topCoinNetwork").replaceChildren(...networks.map((network) => option(network.name, network.id)));
  $("topCoinNetwork").disabled = !networks.length;
  updateTopCoinNetwork();
}

function filterTopCoins() {
  const select = $("topCoin");
  const previous = select.value;
  const found = searchCoins(state.topCoins, $("topCoinSearch").value, state.topCoins.length);
  const matches = coinWorkbench?.orderedCoins(found) || found;
  coinWorkbench?.renderCosts(found);
  select.replaceChildren(...matches.map((coin) => option(
    `#${coin.rank} · ${coin.symbol} · ${coin.name}${coin.derive ? "" : " · unsupported"}`, coin.id,
  )));
  if (matches.some((coin) => coin.id === previous)) select.value = previous;
  select.disabled = !matches.length;
  updateTopCoinSelection();
}

async function loadTopCoins() {
  try {
    const load = async (url) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
      return response.json();
    };
    const [registry, networks, research] = await Promise.all([
      load("./config/coins-top500.json"), load("./config/token-networks.json"), load("./config/chain-research.json"),
    ]);
    if (!Array.isArray(registry.assets) || networks.schema !== "html5-token-networks-v1" || research.schema !== "html5-chain-research-v1") throw new Error("Invalid offline asset registry");
    state.topCoins = registry.assets;
    state.tokenNetworks = researchedNetworks(registry.assets, networks, research);
    coinWorkbench = initCoinWorkbench(document, {
      coins: state.topCoins, networks: state.tokenNetworks, research,
      getPhrase: currentStandardPhrase, onListChange: filterTopCoins,
      onInspect: (row) => {
        try { currentStandardPhrase(); }
        catch (error) { $("coinInvestigationStatus").textContent = error.message; coinWorkbench?.invalidateAll(); return; }
        $("topCoinSearch").value = ""; $("topCoinGroup").value = "all";
        filterTopCoins(); $("topCoin").value = row.id; updateTopCoinSelection();
        const coin = selectedTopCoin();
        const network = networksForCoin(state.tokenNetworks, coin).find((item) => item.id === row.networkId);
        if (coin && network) showTopCoinResult(coin, { ...row, coin, network });
      },
    });
    $("topCoinSearch").disabled = false;
    filterTopCoins();
  } catch (error) {
    $("topCoin").replaceChildren(option("Registry unavailable", ""));
    $("topCoin").disabled = $("topCoinSearch").disabled = $("topCoinNetwork").disabled = $("deriveTopCoin").disabled = true;
    $("topCoinNote").textContent = `Could not load the offline coin/network registry: ${error.message || error}`;
  }
}

function currentStandardPhrase() {
  if (!state.analysis?.ok || !state.analysis?.layout?.standard || parsePhrase($("phrase").value).join(" ") !== state.words.join(" ")) {
    throw new Error("Apply a checksum-valid standard BIP-39 phrase first; edited/unapplied phrases cannot be derived or queried.");
  }
  return { mnemonic: state.words.join(" "), passphrase: $("walletPass").value };
}

function showTopCoinResult(coin, result) {
  state.topCoinResult = result;
  $("topCoinLabel").textContent = `#${coin.rank} ${coin.symbol} · ${result.network.name} · path`;
  $("topCoinPath").textContent = result.path;
  $("topCoinAddress").textContent = result.address;
  $("topCoinPublic").textContent = result.pubkeyHex;
  $("topCoinOutput").hidden = false;
  $("clearWallet").disabled = false;
  coinWorkbench?.setDerived(result);
  $("topCoinNote").textContent = `Derived a holder receive address on ${result.network.name}, not a token contract. No private material is displayed or shared here. Read-only balance lookup is separate and opt-in; one default leaf cannot establish whole-wallet holdings.`;
}

async function deriveSelectedTopCoin() {
  const coin = selectedTopCoin();
  const networkId = $("topCoinNetwork").value;
  if (!coin?.derive || !networkId) return;
  let phrase;
  try { phrase = currentStandardPhrase(); }
  catch (error) { $("topCoinNote").textContent = error.message; return; }
  clearTopCoin();
  const epoch = state.topCoinEpoch;
  const { mnemonic, passphrase } = phrase;
  const button = $("deriveTopCoin");
  button.disabled = true;
  $("topCoinNote").textContent = `Deriving ${coin.symbol} locally…`;
  await new Promise((resolve) => setTimeout(resolve, 0));
  try {
    if (epoch !== state.topCoinEpoch) return;
    const result = deriveCoinNetwork(state.topCoins, state.tokenNetworks, mnemonic, coin.id, networkId, { passphrase });
    showTopCoinResult(coin, result);
  } catch (error) {
    clearTopCoin();
    $("topCoinNote").textContent = `Derivation failed: ${error.message || error}`;
  } finally {
    button.disabled = !selectedTopCoin()?.derive;
  }
}

function clearWallet(message = "Wallet derivatives cleared.", clearPassphrase = false) {
  coinWorkbench?.invalidateAll();
  state.wallet = null;
  clearTopCoin();
  if (clearPassphrase) $("walletPass").value = "";
  setWalletReveal(false);
  $("walletSeed").textContent = "—";
  $("walletRoot").textContent = "—";
  $("walletAccount").textContent = "—";
  $("walletRows").replaceChildren();
  $("walletOutput").hidden = true;
  $("revealWallet").disabled = true;
  $("clearWallet").disabled = true;
  $("walletStatus").textContent = message;
}

async function deriveWallet() {
  const standard = state.analysis?.layout?.standard;
  if (!state.analysis?.ok || !standard || parsePhrase($("phrase").value).join(" ") !== state.words.join(" ")) {
    clearWallet("Apply a valid standard 12/15/18/21/24-word BIP-39 phrase first.");
    return;
  }
  const button = $("deriveWallet");
  button.disabled = true;
  $("walletStatus").textContent = "Deriving PBKDF2 seed and 15 receive keys locally…";
  await new Promise((resolve) => setTimeout(resolve, 0));
  try {
    state.wallet = deriveBitcoinWallet(state.words.join(" "), $("walletPass").value, 5);
    $("walletSeed").textContent = state.wallet.seedHex;
    $("walletRoot").textContent = state.wallet.rootPrivate;
    $("walletOutput").hidden = false;
    $("revealWallet").disabled = false;
    $("clearWallet").disabled = false;
    setWalletReveal(false);
    renderWalletScheme();
    $("walletStatus").textContent = "Derived locally · private seed, xprv and WIF values are blurred by default · never shared.";
  } catch (error) {
    clearWallet(`Derivation failed: ${error.message || error}`);
  } finally {
    button.disabled = false;
  }
}

function renderAnalysis(words, analysis) {
  $("chips").innerHTML = words
    .map((w, i) => {
      const last = i === words.length - 1;
      return `<span class="chip ${last ? "cs" : ""}">${String(i + 1).padStart(2, "0")} ${w}</span>`;
    })
    .join("");

  renderSeedIdentity(words, analysis);
  galoisExplorer?.update();

  const status = $("status");
  if (!analysis) {
    status.className = "status warn";
    status.textContent = "No phrase loaded";
    drawSlice(null, 0);
    drawBitPlane(null, 0, []);
    renderTape([], [], 0);
    renderScale(0);
    renderHoles([], [], 0);
    updateLiveStats(null);
    drawMath(null);
    return;
  }
  status.className = "status " + (analysis.ok ? "ok" : "bad");
  status.textContent = analysis.reason;

  const idxs = analysis.indices || indicesOf(words);
  renderTape(words, idxs, analysis.checksumBits || 0);
  renderHoles(words, idxs, analysis.checksumBits || 0);
  updateLiveStats(analysis.entropy);
  drawSlice(analysis.entropy, analysis.entropyBits || 0);
  drawBitPlane(analysis.entropy, analysis.checksumBits, analysis.checksumObserved);
  renderScale(analysis.entropyBits || 0);
  drawMath(analysis);

  if (analysis.entropy) {
    const bits = analysis.entropyBits;
    $("entBits").textContent = `${bits} bits`;
    $("csBits").textContent = `${analysis.checksumBits} bits`;
    $("space").textContent = `2^${bits} ≈ ${keyspaceDecimal(bits)}`;
    $("hex").textContent = hex(analysis.entropy);
  }
}

async function applyPhrase(text, { broadcast = false } = {}) {
  const words = parsePhrase(text);
  const normalized = words.join(" ");
  if (normalized !== state.words.join(" ")) {
    clearWallet("Phrase changed · derive again explicitly.", true);
  }
  $("phrase").value = normalized;
  state.words = words;
  if (!words.length) {
    state.analysis = null;
    renderAnalysis([], null);
    makePath([]);
    state.pathPts = [];
    updatePair();
    return;
  }
  const analysis = await mnemonicToEntropy(words);
  state.analysis = analysis;
  renderAnalysis(words, analysis);

  const idxs = indicesOf(words).map((i) => (i < 0 ? 0 : i));
  const t0 = performance.now();
  const raw = state.engine.phrasePath(idxs);
  pushTiming("phrasePath", performance.now() - t0);
  state.pathPts = [];
  for (let i = 0; i < raw.length; i += 3) state.pathPts.push([raw[i], raw[i + 1], raw[i + 2]]);
  makePath(raw);

  const seed = analysis.entropy ?? new TextEncoder().encode(words.join(" "));
  const fieldN = isCoarse ? 2200 : 5000;
  const t1 = performance.now();
  makeField(state.engine.entropyField(seed, fieldN));
  applyForm();
  pushTiming(`entropyField ×${fieldN}`, performance.now() - t1);
  logAction("project", analysis.ok);
  updatePair();
  await refreshLens();

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
  const layout = currentLayout();
  if (!layout) {
    $("status").className = "status bad";
    $("status").textContent = `Pick a valid length: ${MIN_WORDS}–${MAX_WORDS} words, or entropy in whole bytes.`;
    return;
  }
  const t0 = performance.now();
  const entropy = new Uint8Array(layout.entBytes);
  crypto.getRandomValues(entropy);
  const words = await entropyToMnemonic(entropy);
  pushTiming(`sample+encode ${layout.entBits}b`, performance.now() - t0);
  logAction("sample", true);
  await applyPhrase(words.join(" "));
}

function bindSeg(id, key, onChange) {
  $(id).addEventListener("click", (e) => {
    const btn = e.target.closest("[data-" + (key === "embed" ? "embed" : "curve") + "]");
    if (!btn) return;
    const attr = key === "embed" ? "embed" : "curve";
    state[key] = btn.dataset[attr];
    [...$(id).querySelectorAll(".seg-btn")].forEach((b) =>
      b.classList.toggle("on", b === btn)
    );
    onChange();
  });
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
      /* cancelled */
    }
  }
  await applyPhrase(text, { broadcast: true });
}

/* ------------------------------------------------------------------ *
 * layers — invert keyspace A↔B and the formal-system lenses
 * ------------------------------------------------------------------ */

function pushTiming(label, ms) {
  state.timings = [...state.timings.filter((t) => t.label !== label), { label, ms }].slice(-6);
}

function logAction(kind, ok) {
  state.actions.push({ kind, at: performance.now(), ok });
  if (state.actions.length > 80) state.actions.shift();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

/** Everything a lens is allowed to look at. */
function sessionCtx() {
  const a = state.analysis;
  return {
    words: state.words,
    indices: a?.indices || indicesOf(state.words),
    entropy: a?.entropy,
    layout: a?.layout || layoutForWords(state.words.length) || layoutForWords(12),
    analysis: a,
    path: state.pathPts,
    flips: state.flips,
    anf: state.anf,
    pair: state.pair,
    pairEntropy: state.analysisB?.entropy,
    actions: state.actions,
    timings: state.timings,
    seed: state.seed,
  };
}

/** Which key length the controls currently ask for. */
function currentLayout() {
  const v = $("wc").value;
  if (v === "custom") {
    const bits = Number($("customBits").value);
    if (bits) return layoutForEntropyBits(bits);
    return layoutForWords(Number($("customWords").value));
  }
  return layoutForWords(Number(v));
}

function describeLayout(layout) {
  if (!layout) return `no valid layout — words must be ${MIN_WORDS}–${MAX_WORDS}, entropy a multiple of 8`;
  const rule = layout.standard ? "BIP-39 ladder (CS = ENT/32)" : "generalised rule (largest CS ≤ 11)";
  return `${layout.words} words × 11 = ${layout.totalBits} bits = ${layout.entBits} ENT + ${layout.csBits} CS · ${rule} · keyspace 2^${layout.entBits}`;
}

function layoutOptionLabel(layout) {
  return `${layout.words} words · ${layout.entBits}-bit ENT · CS ${layout.csBits}`;
}

function option(text, value) {
  const o = document.createElement("option");
  o.value = value;
  o.textContent = text;
  return o;
}

/**
 * The length menu lists every word count the layout rule closes: the five
 * BIP-39 ladder entries, then *all* generalised counts from 25 up to MAX_WORDS
 * (each labelled from layoutForWords, so ENT/CS can never drift from the
 * maths), then the custom row for short counts or an exact ENT bit length.
 * The static markup only carries the ladder and a few examples; this rebuilds
 * the menu so the two never disagree.
 */
function buildWordCountMenu() {
  const sel = $("wc");
  const keep = sel.value || String(STANDARD_WORDS[0]);
  const group = (label, values) => {
    const g = document.createElement("optgroup");
    g.label = label;
    for (const n of values) {
      const layout = layoutForWords(n);
      if (layout) g.append(option(layoutOptionLabel(layout), String(n)));
    }
    return g;
  };
  const beyond = [];
  for (let n = 25; n <= MAX_WORDS; n++) if (!STANDARD_WORDS.includes(n)) beyond.push(n);
  const custom = document.createElement("optgroup");
  custom.label = `custom · ${MIN_WORDS}–${MAX_WORDS} words or an ENT bit length`;
  custom.append(option("custom words or bit length…", "custom"));
  sel.replaceChildren(
    group("BIP-39 standard ladder · CS = ENT/32", STANDARD_WORDS),
    group(`generalised rule · every count 25…${MAX_WORDS} · 11n = ENT + CS`, beyond),
    custom
  );
  sel.value = [...sel.options].some((o) => o.value === keep) ? keep : String(STANDARD_WORDS[0]);
  $("customWords").min = String(MIN_WORDS);
  $("customWords").max = String(MAX_WORDS);
  $("customWords").placeholder = `words (${MIN_WORDS}–${MAX_WORDS})`;
}

/** Flip every entropy bit once and re-run Φ — the measured derivative. */
async function runFlipSweep() {
  const a = state.analysis;
  if (!a?.entropy) return;
  const key = hex(a.entropy);
  if (state.flipsKey === key && state.flips) return;
  const t0 = performance.now();
  const baseIdx = a.indices;
  const out = [];
  const entBits = a.entropyBits;
  for (let b = 0; b < entBits; b++) {
    const words = await entropyToMnemonic(flipEntropyBit(a.entropy, b));
    const idx = indicesOf(words);
    let changed = 0;
    const deltas = [];
    for (let i = 0; i < idx.length; i++) {
      if (idx[i] !== baseIdx[i]) {
        changed++;
        deltas.push([i, Math.abs(idx[i] - baseIdx[i])]);
      }
    }
    out.push({ bit: b, changed, deltas, lastChanged: idx[idx.length - 1] !== baseIdx[idx.length - 1] });
    if ((b & 63) === 63) await new Promise((r) => setTimeout(r, 0));
  }
  state.flips = out;
  state.flipsKey = key;
  pushTiming(`flip sweep ×${entBits}`, performance.now() - t0);
}

/** 16 preimages: the checksum word's LSB as a Boolean function of 4 ENT bits. */
async function runAnfProbe() {
  const a = state.analysis;
  if (!a?.entropy || state.anfKey === hex(a.entropy)) return;
  const t0 = performance.now();
  const table = [];
  for (let m = 0; m < 16; m++) {
    const e = new Uint8Array(a.entropy);
    for (let i = 0; i < 4; i++) if ((m >> i) & 1) e[0] ^= 1 << (7 - i);
    const words = await entropyToMnemonic(e);
    table.push((INDEX.get(words[words.length - 1]) ?? 0) & 1);
  }
  state.anf = table;
  state.anfKey = hex(a.entropy);
  pushTiming("ANF probe ×16", performance.now() - t0);
}

async function ensureLensData(lens) {
  const needs = lens.needs || [];
  if (needs.includes("flips")) {
    if (!state.flips || state.flipsKey !== hex(state.analysis?.entropy ?? new Uint8Array(0))) {
      $("lensPredict").textContent = `Measuring ∂Φ over ${state.analysis?.entropyBits ?? 0} bits…`;
      await runFlipSweep();
    }
  }
  if (needs.includes("anf")) await runAnfProbe();
}

function renderLensPanel(lens) {
  const ctx = sessionCtx();
  let res = null;
  try {
    res = lens.compute(ctx);
  } catch (err) {
    console.error(`lens ${lens.id} failed`, err);
  }
  const rows = res?.rows || [];
  $("lensRows").innerHTML = rows
    .map(([k, v]) => `<tr><th>${escapeHtml(k)}</th><td>${escapeHtml(v)}</td></tr>`)
    .join("");
  $("lensDescribe").textContent = res?.describe ? `Describe · ${res.describe}` : "";
  $("lensExplain").textContent = res?.explain ? `Explain · ${res.explain}` : "";
  $("lensPredict").textContent = res
    ? `Predict · ${res.predict}`
    : lens.needs?.includes("pair") && !ctx.pair
      ? "Needs a second key — load key B above."
      : "No data yet — project a phrase first.";
  const drew = lens.kind !== "card" && drawLens(lens.id, $("lensCanvas"), ctx);
  $("lensCanvas").hidden = !drew;
}

function disposeGroup(g) {
  g.traverse((o) => {
    o.geometry?.dispose?.();
    if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
    else o.material?.dispose?.();
  });
}

function rebuildLensLayers() {
  if (!lensGroup) return;
  for (const [, g] of state.layerObjs) {
    lensGroup.remove(g);
    disposeGroup(g);
  }
  state.layerObjs.clear();
  const ctx = sessionCtx();
  for (const id of state.layers) {
    if (!LENS_3D.includes(id)) continue;
    let g = null;
    try {
      g = buildLensLayer(id, ctx);
    } catch (err) {
      console.error(`3D layer ${id} failed`, err);
    }
    if (g) {
      lensGroup.add(g);
      state.layerObjs.set(id, g);
    }
  }
}

async function focusLens(id) {
  const lens = LENS_BY_ID.get(id);
  if (!lens) return;
  state.lens = id;
  $("lensName").textContent = lens.name;
  $("lensKind").textContent = lens.kind === "card" ? "card" : "lens";
  $("lensKind").className = lens.kind === "card" ? "tag card" : "tag";
  $("lensTag").textContent = lens.tagline;
  await ensureLensData(lens);
  renderLensPanel(lens);
  renderRack();
  rebuildLensLayers();
}

async function refreshLens() {
  if (state.lens) await focusLens(state.lens);
}

function renderRack() {
  const filter = $("lensFilter").value;
  const host = $("lensRack");
  host.innerHTML = LENSES.filter((l) => filter === "all" || l.group === filter)
    .map((l) => {
      const on = state.layers.has(l.id);
      const card = l.kind === "card";
      const st = on ? (card ? "CARD" : LENS_3D.includes(l.id) ? "3D" : "2D") : "off";
      // Two intents, two targets: the dot toggles the layer, the name focuses the panel.
      return `<div class="layer-row${on ? " on" : ""}${
        state.lens === l.id ? " focus" : ""
      }" data-lens="${l.id}">
        <button type="button" class="dot-btn" data-act="toggle" aria-pressed="${on}"
          title="${on ? "remove this layer from the scene" : "add this layer to the scene"}"><span class="dot"></span></button>
        <button type="button" class="nm-btn" data-act="focus">${escapeHtml(l.name)}</button>
        <span class="grp">${escapeHtml(l.group)}</span>
        <span class="st${card ? " card" : ""}">${st}</span></div>`;
    })
    .join("");
}

function updatePair() {
  const A = state.analysis?.entropy;
  const B = state.analysisB?.entropy;
  state.pair = A && B ? invertReport(A, B) : null;
  const r = state.pair;
  $("invHam").textContent = r ? `${r.d} / ${r.entBits}` : "—";
  $("invSub").textContent = r ? (r.d <= 20 ? String(2 ** r.d) : `2^${r.d}`) : "—";
  $("invComp").textContent = r ? `${r.complementAToB}` : "—";
  $("invGeo").textContent = r ? `${r.d}!` : "—";
  $("invertNote").textContent = !r
    ? "S(A,B) = { A ⊕ (m ⊙ s) : s ∈ {0,1}^d }, m = A⊕B — load key B to open the invert layers."
    : `d(A,B) = ${r.d} bits → the subcube S(A,B) holds 2^${r.d} keys = 2^${r.measureLog2} of the space. ` +
      `d(¬A,B) = ${r.complementAToB} = ${r.entBits} − ${r.d}. ${
        r.equalLength ? "" : "(lengths differ — shorter key left-padded with zero bytes)"
      }`;
  drawInvertCanvas();
}

function drawInvertCanvas() {
  const mode = state.layers.has("inv-geodesic")
    ? "inv-geodesic"
    : state.layers.has("inv-complement")
      ? "inv-complement"
      : state.layers.has("inv-shell")
        ? "inv-shell"
        : "inv-subcube";
  drawLens(mode, $("invertPlot"), sessionCtx());
}

async function applyPhraseB(text) {
  const words = parsePhrase(text);
  $("phraseB").value = words.join(" ");
  state.wordsB = words;
  if (!words.length) {
    state.analysisB = null;
    $("statusB").className = "status warn";
    $("statusB").textContent = "No key B — the invert layers need two keys.";
    updatePair();
    return;
  }
  const analysis = await mnemonicToEntropy(words);
  state.analysisB = analysis;
  $("statusB").className = `status ${analysis.ok ? "ok" : "bad"}`;
  $("statusB").textContent = `B · ${analysis.reason}`;
  logAction("load-b", analysis.ok);
  updatePair();
  await refreshLens();
}

async function sampleB() {
  const layout = state.analysis?.layout || currentLayout() || layoutForWords(12);
  const entropy = new Uint8Array(layout.entBytes);
  crypto.getRandomValues(entropy);
  const words = await entropyToMnemonic(entropy);
  await applyPhraseB(words.join(" "));
}

/** B = the well-formed phrase whose entropy is the bitwise complement of A's. */
async function bFromNotA() {
  const A = state.analysis?.entropy;
  if (!A) return;
  const words = await entropyToMnemonic(notBytes(A));
  await applyPhraseB(words.join(" "));
}

async function main() {
  galoisExplorer = initGaloisExplorer(document, () => state.analysis?.ok ? state.analysis.entropy : null);
  initThree();
  startTicker();
  bindSheet();
  updateRollNeed();
  paintDecode();
  renderLex("");
  loadTopCoins();
  $("wl").textContent = `${WORDLIST.length}`;
  const sel = $("formSel");
  sel.innerHTML = FORMS.map((f) => `<option value="${f[0]}">${f[1]}</option>`).join("");
  sel.value = state.form;
  sel.onchange = () => {
    state.form = sel.value;
    applyForm();
  };
  buildWordCountMenu();
  $("wcNote").textContent = describeLayout(currentLayout());

  state.engine = await loadEngine("./wasm/entropy.wasm");
  state.scatterCache = state.engine.scatterWords(2048);
  applyEmbedding();

  bindSeg("embedSeg", "embed", () => {
    applyEmbedding();
    if (state.analysis) renderAnalysis(state.words, state.analysis);
  });
  bindSeg("curveSeg", "curve", () => {
    if (state.analysis) {
      drawSlice(state.analysis.entropy, state.analysis.entropyBits || 0);
    }
  });

  $("srcSeg").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-src]");
    if (!btn) return;
    state.src = btn.dataset.src;
    [...$("srcSeg").querySelectorAll(".seg-btn")].forEach((b) =>
      b.classList.toggle("on", b === btn)
    );
    updateRollNeed();
  });
  $("rolls").addEventListener("input", updateRollNeed);
  $("commitRolls").onclick = commitRolls;
  $("decodePips").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-bit]");
    if (!btn) return;
    const i = Number(btn.dataset.bit);
    state.decodeBits[i] = state.decodeBits[i] ? 0 : 1;
    paintDecode();
  });
  $("decodeWord").addEventListener("input", (e) => setDecodeFromWord(e.target.value));
  $("decodeAdd").onclick = () => {
    const w = $("decodeWord").value.trim().toLowerCase();
    if (!INDEX.has(w)) return;
    const next = [...state.words, w].join(" ");
    applyPhrase(next);
  };
  $("lexQ").addEventListener("input", (e) => renderLex(e.target.value));
  $("doFlip").onclick = previewAvalanche;
  $("mathPrev").onclick = () => setMathStep(state.mathStep - 1);
  $("mathNext").onclick = () => setMathStep(state.mathStep + 1);
  $("cubeSeg").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-cube]");
    if (!btn) return;
    state.cubeN = Number(btn.dataset.cube);
    [...$("cubeSeg").querySelectorAll(".seg-btn")].forEach((b) =>
      b.classList.toggle("on", b === btn)
    );
    drawCube(state.analysis?.entropy);
  });
  $("statsSeg").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-stats]");
    if (!btn) return;
    state.statsView = btn.dataset.stats;
    [...$("statsSeg").querySelectorAll(".seg-btn")].forEach((b) =>
      b.classList.toggle("on", b === btn)
    );
    drawStatistics(state.analysis);
  });
  setMathStep(1);

  $("apply").onclick = () => applyPhrase($("phrase").value);
  $("gen").onclick = generate;
  $("share").onclick = shareChat;
  $("copyHaiku").onclick = copyHaiku;
  $("saveEnso").onclick = saveEnso;
  $("deriveWallet").onclick = deriveWallet;
  $("revealWallet").onclick = () => setWalletReveal(!state.walletRevealed);
  $("clearWallet").onclick = () => clearWallet("Wallet derivatives and passphrase cleared.", true);
  $("deriveTopCoin").onclick = deriveSelectedTopCoin;
  $("topCoin").addEventListener("change", updateTopCoinSelection);
  $("topCoinNetwork").addEventListener("change", updateTopCoinNetwork);
  $("topCoinSearch").addEventListener("input", filterTopCoins);
  $("walletPass").addEventListener("input", () => {
    clearWallet("Passphrase changed · derive again explicitly.");
  });
  $("phrase").addEventListener("input", () => {
    clearWallet("Phrase edited · apply it, then derive again explicitly.");
  });
  $("walletScheme").addEventListener("click", (event) => {
    const button = event.target.closest("[data-wallet-scheme]");
    if (!button) return;
    state.walletScheme = button.dataset.walletScheme;
    [...$("walletScheme").querySelectorAll(".seg-btn")].forEach((item) => item.classList.toggle("on", item === button));
    renderWalletScheme();
  });
  const syncWc = () => {
    $("customRow").hidden = $("wc").value !== "custom";
    const layout = currentLayout();
    $("wcNote").textContent = describeLayout(layout);
    updateRollNeed();
  };
  $("wc").onchange = syncWc;
  $("customWords").addEventListener("input", syncWc);
  $("customBits").addEventListener("input", syncWc);
  syncWc();

  /* layers: invert keyspace + formal-system lenses */
  $("genB").onclick = sampleB;
  $("notA").onclick = bFromNotA;
  $("phraseB").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      applyPhraseB($("phraseB").value);
      $("phraseB").blur();
    }
  });
  $("lensFilter").onchange = renderRack;
  $("lensRack").addEventListener("click", (e) => {
    const row = e.target.closest("[data-lens]");
    if (!row) return;
    const id = row.dataset.lens;
    const act = e.target.closest("[data-act]")?.dataset.act ?? "focus";
    if (act === "toggle") {
      // dot: add/remove the layer. Turning one on also opens its panel.
      if (state.layers.has(id)) state.layers.delete(id);
      else {
        state.layers.add(id);
        focusLens(id);
      }
      renderRack();
      rebuildLensLayers();
      drawInvertCanvas();
      return;
    }
    // name (or anywhere else on the row): focus the readout, leave layers alone
    focusLens(id);
  });
  renderRack();
  focusLens(state.lens);
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
