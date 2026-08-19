import * as THREE from "../vendor/three.module.min.js";
import { OrbitControls } from "../vendor/OrbitControls.js";
import { loadEngine } from "./engine.js";
import {
  WORDLIST,
  parsePhrase,
  mnemonicToEntropy,
  randomMnemonic,
  entropyToMnemonic,
  wordCountToEntropyBits,
  keyspaceDecimal,
  indicesOf,
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
};

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
  const bits = wordCountToEntropyBits(Number($("wc").value)) || 128;
  const need = rollsNeeded(bits, src.bits);
  const have = parseRolls($("rolls").value, state.src).length;
  $("poolBits").textContent = (have * src.bits).toFixed(1);
  $("rollNeed").textContent = `${have}/${need} ${src.label} · ${src.bits.toFixed(3)} bits/event · ${bits}-bit target`;
}

async function commitRolls() {
  const src = SOURCES[state.src];
  if (!src) return;
  const bits = wordCountToEntropyBits(Number($("wc").value));
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
  for (let i = 0; i < n; i++) {
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
  indices.forEach((idx, i) => {
    const y = 10 + (1 - Math.max(0, idx) / 2047) * (h - 28);
    ctx.fillStyle = changed.includes(i) ? "#ffb020" : "#5ce1ff";
    ctx.beginPath();
    ctx.arc(xs(i), y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawFiber(csBits, observed) {
  const cv = $("fiber");
  if (!cv) return;
  const ctx = cv.getContext("2d");
  const n = Math.max(1, 1 << (csBits || 0));
  ctx.fillStyle = "#05070c";
  ctx.fillRect(0, 0, cv.width, cv.height);
  const cols = Math.min(n, 16);
  const rows = Math.ceil(n / cols);
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

function drawMath(analysis) {
  const idxs = analysis?.indices || [];
  drawParallel(idxs);
  drawFiber(analysis?.checksumBits || 0, analysis?.checksumExpected);
  drawGray(idxs);
  drawCube(analysis?.entropy);
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

async function main() {
  initThree();
  startTicker();
  bindSheet();
  updateRollNeed();
  paintDecode();
  renderLex("");
  $("wl").textContent = `${WORDLIST.length}`;
  $("wcNote").textContent = `12 words → ${wordCountToEntropyBits(12)} bits · not 2048¹²`;

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

  $("apply").onclick = () => applyPhrase($("phrase").value);
  $("gen").onclick = generate;
  $("share").onclick = shareChat;
  $("wc").onchange = () => {
    $("wcNote").textContent = `${$("wc").value} words → ${wordCountToEntropyBits(Number($("wc").value))} bits · checksum is not free entropy`;
    updateRollNeed();
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
