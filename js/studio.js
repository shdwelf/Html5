import { INDEX, parsePhrase, mnemonicToEntropy, wordCountToEntropyBits } from "./bip39.js";

const DEMO_VECTOR = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
const DEMO_SEED = new Uint8Array([0x45, 0x4e, 0x53, 0x4f, 0x2d, 0x46, 0x4f, 0x52, 0x47, 0x45, 0x2d, 0x30, 0x31, 0x2e, 0x30, 0x31]);
const $ = (id) => document.getElementById(id);

const state = {
  words: [],
  analysis: null,
  panel: "forgePanel",
  seed: DEMO_SEED,
  art: null,
};

let validationId = 0;
let validationTimer = null;

function countLabel(n) {
  return `${n} word${n === 1 ? "" : "s"}`;
}

function toHex(bytes, length = bytes.length) {
  return [...bytes].slice(0, length).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hashText(text) {
  let a = 0x811c9dc5;
  let b = 0x9e3779b9;
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    a ^= code;
    a = Math.imul(a, 0x01000193);
    b ^= code + i * 17;
    b = Math.imul(b, 0x85ebca6b);
  }
  const out = new Uint8Array(16);
  for (let i = 0; i < out.length; i += 1) {
    a ^= a >>> 13;
    a = Math.imul(a, 0x5bd1e995);
    b ^= b >>> 16;
    b = Math.imul(b, 0x27d4eb2d);
    out[i] = (a + b + i * 29) & 255;
  }
  return out;
}

function seedFromInput(words, analysis) {
  if (analysis?.entropy) return new Uint8Array(analysis.entropy);
  if (words.length) return hashText(words.join(" "));
  return new Uint8Array(DEMO_SEED);
}

function makeRng(bytes) {
  let seed = 0x811c9dc5;
  for (const byte of bytes) seed = Math.imul(seed ^ byte, 0x01000193);
  return () => {
    seed += 0x6d2b79f5;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function resizeCanvas(canvas, width, height) {
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.round(rect.width * Math.min(devicePixelRatio || 1, 2)));
  const h = Math.max(1, Math.round((rect.height || rect.width * height / width) * Math.min(devicePixelRatio || 1, 2)));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  return { w, h, dpr: Math.min(devicePixelRatio || 1, 2) };
}

function makeBrushPaths(seed) {
  const random = makeRng(seed);
  const gap = 0.12 + random() * 0.18;
  const start = -Math.PI / 2 + gap * (0.2 + random() * 0.35);
  const end = start + Math.PI * 2 - gap;
  const paths = [];
  const baseRadius = 0.33 + random() * 0.035;
  const lean = (random() - 0.5) * 0.09;
  for (let pass = 0; pass < 5; pass += 1) {
    const points = [];
    const steps = 230 + pass * 9;
    const scale = 1 + (random() - 0.5) * 0.045;
    const wobble = 0.008 + random() * 0.012;
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const angle = start + (end - start) * t;
      const noise = (random() - 0.5) * wobble + Math.sin(t * 17 + pass * 2.2) * wobble * 0.65;
      const pressure = 1 + Math.sin(t * Math.PI) * (0.035 + random() * 0.03) + noise;
      const radius = baseRadius * scale * pressure;
      points.push({
        x: Math.cos(angle) * radius + lean * t + (random() - 0.5) * 0.005,
        y: Math.sin(angle) * radius + (random() - 0.5) * 0.005,
        width: 0.005 + (Math.sin(t * Math.PI) * 0.009) + random() * 0.006,
      });
    }
    paths.push(points);
  }
  const splatters = [];
  for (let i = 0; i < 38; i += 1) {
    const angle = start + random() * (end - start);
    const radius = baseRadius * (1.01 + random() * 0.16);
    splatters.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, r: 0.001 + random() * 0.005, a: 0.15 + random() * 0.5 });
  }
  return { paths, splatters, gap, start, end };
}

function drawEnso() {
  const canvas = $("ensoCanvas");
  if (!canvas) return;
  const { w, h } = resizeCanvas(canvas, 900, 620);
  const ctx = canvas.getContext("2d");
  const scale = Math.min(w, h);
  const cx = w * 0.5;
  const cy = h * 0.5;
  const art = makeBrushPaths(state.seed);
  state.art = art;
  ctx.clearRect(0, 0, w, h);

  const background = ctx.createRadialGradient(cx, cy * 0.87, 0, cx, cy, scale * 0.72);
  background.addColorStop(0, "#18202a");
  background.addColorStop(0.55, "#0d121a");
  background.addColorStop(1, "#08090d");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "rgba(140,232,220,.08)";
  ctx.lineWidth = 1;
  for (let i = 1; i <= 4; i += 1) {
    ctx.beginPath();
    ctx.arc(cx, cy, scale * (0.18 + i * 0.1), 0, Math.PI * 2);
    ctx.stroke();
  }

  const colors = ["rgba(140,232,220,.72)", "rgba(159,172,255,.6)", "rgba(199,169,255,.43)", "rgba(242,201,132,.28)", "rgba(240,241,237,.3)"];
  art.paths.forEach((path, pass) => {
    ctx.beginPath();
    path.forEach((point, index) => {
      const x = cx + point.x * scale;
      const y = cy + point.y * scale * 0.96;
      if (!index) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = colors[pass];
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = scale * (0.016 - pass * 0.0018);
    ctx.shadowColor = pass === 0 ? "rgba(140,232,220,.22)" : "transparent";
    ctx.shadowBlur = pass === 0 ? scale * 0.018 : 0;
    ctx.stroke();
  });
  ctx.shadowBlur = 0;
  art.splatters.forEach((dot) => {
    ctx.beginPath();
    ctx.fillStyle = `rgba(242,201,132,${dot.a})`;
    ctx.arc(cx + dot.x * scale, cy + dot.y * scale * .96, dot.r * scale, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "rgba(190,199,230,.42)";
  ctx.font = `${Math.max(8, scale * .013)}px ${getComputedStyle(document.body).fontFamily}`;
  ctx.letterSpacing = "2px";
  ctx.fillText("ENSO / FORGE", 18, h - 18);
  ctx.fillStyle = "rgba(190,199,230,.28)";
  ctx.textAlign = "right";
  ctx.fillText(`${state.analysis?.ok ? "VALID SOURCE" : state.words.length ? "DRAFT SOURCE" : "DEMO SOURCE"}`, w - 18, h - 18);
  ctx.textAlign = "left";

  const angleDeg = Math.round((art.gap * 180) / Math.PI);
  $("inspectorGap").textContent = `${angleDeg}° / OPEN`;
}

function drawKeyField() {
  const canvas = $("keyCanvas");
  if (!canvas) return;
  const { w, h } = resizeCanvas(canvas, 900, 430);
  const ctx = canvas.getContext("2d");
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, "#080c14");
  bg.addColorStop(1, "#10101b");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const random = makeRng(state.seed);
  const pad = Math.min(25, w * .04);
  ctx.strokeStyle = "rgba(159,172,255,.1)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i += 1) {
    const x = pad + (i / 7) * (w - pad * 2);
    ctx.beginPath(); ctx.moveTo(x, 25); ctx.lineTo(x, h - 20); ctx.stroke();
  }
  for (let i = 0; i < 5; i += 1) {
    const y = 25 + (i / 4) * (h - 45);
    ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(w - pad, y); ctx.stroke();
  }

  const points = [];
  for (let i = 0; i < 2048; i += 1) {
    const x = pad + random() * (w - pad * 2);
    const y = 32 + (Math.sin(i * .026) * .32 + .5 + (random() - .5) * .16) * (h - 70);
    points.push({ x, y });
    ctx.fillStyle = i % 11 === 0 ? "rgba(199,169,255,.32)" : "rgba(140,232,220,.19)";
    ctx.fillRect(x, y, 1.2, 1.2);
  }

  const indices = (state.analysis?.indices || state.words.map((word) => INDEX.get(word))).filter((index) => Number.isInteger(index));
  if (indices.length) {
    ctx.beginPath();
    indices.forEach((index, i) => {
      const point = points[index];
      if (!point) return;
      if (!i) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.strokeStyle = "rgba(242,201,132,.75)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    indices.forEach((index, i) => {
      const point = points[index];
      if (!point) return;
      ctx.beginPath();
      ctx.fillStyle = i === indices.length - 1 ? "#f2c984" : "#8ce8dc";
      ctx.arc(point.x, point.y, i === indices.length - 1 ? 4 : 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  ctx.fillStyle = "rgba(190,199,230,.43)";
  ctx.font = `${Math.max(8, w * .012)}px ${getComputedStyle(document.body).fontFamily}`;
  ctx.fillText("0", pad, h - 7);
  ctx.textAlign = "right";
  ctx.fillText("2047", w - pad, h - 7);
  ctx.textAlign = "left";
  $("viewerOverlayValue").textContent = indices.length ? `${indices.length} MARKED` : "NO MARKS";
  $("viewerState").textContent = state.analysis?.ok ? "VALID SOURCE" : state.words.length ? "DRAFT SOURCE" : "NO SOURCE";
}

function drawBitTape() {
  const canvas = $("bitCanvas");
  if (!canvas) return;
  const { w, h } = resizeCanvas(canvas, 900, 120);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#070a11";
  ctx.fillRect(0, 0, w, h);
  const entropy = state.analysis?.entropy ? [...state.analysis.entropy].flatMap((byte) => Array.from({ length: 8 }, (_, i) => (byte >> (7 - i)) & 1)) : [];
  const checksum = state.analysis?.checksumObserved || [];
  const bits = entropy.concat(checksum);
  const cols = Math.max(1, Math.min(64, Math.floor(w / 13)));
  const cell = w / cols;
  const rows = Math.max(3, Math.ceil(Math.max(bits.length, 1) / cols));
  const rowH = h / rows;
  for (let i = 0; i < rows * cols; i += 1) {
    const value = bits[i];
    const isChecksum = i >= entropy.length && value !== undefined;
    ctx.fillStyle = value === undefined ? "#101522" : isChecksum ? (value ? "#f2c984" : "#493816") : (value ? "#8ce8dc" : "#16323a");
    ctx.fillRect((i % cols) * cell + 1, Math.floor(i / cols) * rowH + 1, Math.max(1, cell - 2), Math.max(1, rowH - 2));
  }
  $("bitCount").textContent = bits.length ? `${entropy.length} ENT + ${checksum.length} CS` : "NO SOURCE";
}

function renderWordDiagnostics() {
  const host = $("studioWordList");
  const words = state.words;
  host.replaceChildren();
  if (!words.length) {
    const empty = document.createElement("li");
    empty.className = "studio-empty";
    const mark = document.createElement("span"); mark.textContent = "—";
    const copy = document.createElement("p"); copy.textContent = "Diagnostics will appear when a phrase is entered.";
    empty.append(mark, copy); host.append(empty);
    $("validatorState").textContent = "NO SOURCE";
    return;
  }
  const indices = words.map((word) => INDEX.get(word));
  const validCount = Boolean(wordCountToEntropyBits(words.length));
  const allKnown = indices.every((index) => index !== undefined);
  words.forEach((word, i) => {
    const known = indices[i] !== undefined;
    const checksum = i === words.length - 1 && validCount && allKnown;
    const row = document.createElement("li");
    row.className = `studio-word-row ${known ? "known" : "unknown"}${checksum ? " checksum" : ""}`;
    const position = document.createElement("span"); position.className = "position"; position.textContent = String(i + 1).padStart(2, "0");
    const value = document.createElement("span"); value.className = "word"; value.textContent = word; value.title = word;
    const index = document.createElement("span"); index.className = "index"; index.textContent = known ? `#${String(indices[i]).padStart(4, "0")}` : "—";
    const role = document.createElement("span"); role.className = "role"; role.textContent = known ? (checksum ? (state.analysis?.ok ? "CHECKSUM OK" : "CHECKSUM") : "WORDLIST") : "UNKNOWN";
    row.append(position, value, index, role); host.append(row);
  });
  $("validatorState").textContent = state.analysis?.ok ? "VALID MNEMONIC" : validCount && allKnown ? "CHECKSUM MISMATCH" : "REVIEW SOURCE";
}

function renderStatus(kind, label, message) {
  const el = $("studioStatus");
  el.className = `studio-status ${kind}`;
  el.querySelector("b").textContent = label;
  el.querySelector("p").textContent = message;
}

function renderMetrics() {
  const words = state.words;
  const analysis = state.analysis;
  $("studioWordCount").textContent = countLabel(words.length);
  $("metricWords").textContent = words.length ? words.length : "—";
  $("metricEntropy").textContent = analysis?.entropyBits ? `${analysis.entropyBits}b` : "—";
  $("metricChecksum").textContent = analysis?.checksumBits ? `${analysis.checksumBits}b` : "—";
  $("inspectorInput").textContent = analysis?.ok ? `${words.length} WORDS` : words.length ? "DRAFT SOURCE" : "DEMO SEED";
  $("forgeState").textContent = analysis?.ok ? "VALID SOURCE" : words.length ? "DRAFT SEED" : "DEMO SEED";
  $("forgeNote").textContent = analysis?.ok ? "Source verified. Forge a deterministic mark from its entropy." : words.length ? "Draft source only. Validate the phrase before treating the mark as a verified study." : "A calm default mark is ready. Load a phrase to forge a private variation.";
  $("inspectorBrush").textContent = analysis?.ok ? "DRY / 05 PASS" : "DRY / DEMO PASS";
}

function renderAll() {
  renderMetrics();
  renderWordDiagnostics();
  drawEnso();
  drawKeyField();
  drawBitTape();
}

function setPanel(panelId) {
  state.panel = panelId;
  document.querySelectorAll(".studio-tab").forEach((button) => {
    const active = button.dataset.panel === panelId;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  document.querySelectorAll("[data-panel-view]").forEach((panel) => {
    panel.hidden = panel.id !== panelId;
    panel.classList.toggle("active", panel.id === panelId);
  });
  if (panelId === "viewerPanel") { drawKeyField(); drawBitTape(); }
  if (panelId === "forgePanel") drawEnso();
}

document.querySelectorAll(".studio-tab").forEach((button) => {
  button.id = button.dataset.panel === "forgePanel" ? "forgeTab" : button.dataset.panel === "viewerPanel" ? "viewerTab" : "validatorTab";
  button.addEventListener("click", () => setPanel(button.dataset.panel));
});

async function validateStudio() {
  const run = ++validationId;
  const words = parsePhrase($("studioInput").value);
  state.words = words;
  state.analysis = null;
  renderMetrics();
  renderWordDiagnostics();
  if (!words.length) {
    state.seed = new Uint8Array(DEMO_SEED);
    renderStatus("ready", "READY", "Waiting for a phrase to enter the studio.");
    renderAll();
    return;
  }
  renderStatus("pending", "CHECKING", "Reading the wordlist and rebuilding the encoded bits…");
  const bits = wordCountToEntropyBits(words.length);
  if (!bits) {
    state.seed = seedFromInput(words, null);
    renderStatus("invalid", "INVALID LENGTH", `${countLabel(words.length)} entered · use 12, 15, 18, 21, or 24 words.`);
    renderAll();
    return;
  }
  const unknown = words.filter((word) => !INDEX.has(word));
  if (unknown.length) {
    state.seed = seedFromInput(words, null);
    renderStatus("invalid", "UNKNOWN WORD", `${unknown.length} word${unknown.length === 1 ? "" : "s"} not in the English BIP-39 list.`);
    renderAll();
    return;
  }
  try {
    const analysis = await mnemonicToEntropy(words);
    if (run !== validationId) return;
    state.analysis = analysis;
    state.seed = seedFromInput(words, analysis);
    renderStatus(analysis.ok ? "valid" : "invalid", analysis.ok ? "VALID MNEMONIC" : "CHECKSUM MISMATCH", analysis.ok ? `${words.length} words · ${analysis.entropyBits}-bit entropy · ready to forge.` : "All words are recognized, but the SHA-256 checksum does not match.");
    renderAll();
  } catch (error) {
    if (run !== validationId) return;
    state.seed = seedFromInput(words, null);
    renderStatus("invalid", "UNABLE TO CHECK", error?.message || "The browser could not calculate SHA-256.");
    renderAll();
  }
}

function scheduleValidation() {
  clearTimeout(validationTimer);
  validationTimer = setTimeout(validateStudio, 220);
}

$("studioInput").addEventListener("input", scheduleValidation);
$("studioInput").addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
    event.preventDefault(); clearTimeout(validationTimer); validateStudio();
  }
});

$("studioPaste").addEventListener("click", async () => {
  try {
    if (!navigator.clipboard?.readText) throw new Error("unavailable");
    $("studioInput").value = await navigator.clipboard.readText();
    $("studioInput").focus();
    clearTimeout(validationTimer); validateStudio();
    $("sourceHint").textContent = "Pasted locally · review the phrase before forging.";
  } catch {
    $("studioInput").focus();
    $("sourceHint").textContent = "Clipboard unavailable · paste manually into the source field.";
  }
});

$("studioClear").addEventListener("click", () => {
  validationId += 1;
  $("studioInput").value = "";
  $("studioInput").focus();
  $("sourceHint").textContent = "English BIP-39 · spaces, commas, or line breaks";
  validateStudio();
});

$("studioSample").addEventListener("click", () => {
  $("studioInput").value = DEMO_VECTOR;
  $("studioInput").focus();
  clearTimeout(validationTimer); validateStudio();
  $("sourceHint").textContent = "Demo vector loaded · not a wallet seed.";
});

$("forgeButton").addEventListener("click", () => {
  state.seed = seedFromInput(state.words, state.analysis);
  drawEnso();
  $("forgeState").textContent = state.analysis?.ok ? "FORGED / VERIFIED" : state.words.length ? "FORGED / DRAFT" : "DEMO SEED";
});

$("pngButton").addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = `enso-forge-${toHex(state.seed, 4)}.png`;
  link.href = $("ensoCanvas").toDataURL("image/png");
  link.click();
});

function svgForArt() {
  const paths = state.art?.paths || [];
  const splatters = state.art?.splatters || [];
  const pathMarkup = paths.map((path, pass) => {
    const d = path.map((point, i) => `${i ? "L" : "M"}${(450 + point.x * 620).toFixed(2)} ${(310 + point.y * 620 * .96).toFixed(2)}`).join(" ");
    const opacity = [.72, .6, .43, .28, .3][pass];
    const color = ["#8ce8dc", "#9facff", "#c7a9ff", "#f2c984", "#f0f1ed"][pass];
    return `<path d="${d}" fill="none" stroke="${color}" stroke-opacity="${opacity}" stroke-width="${14 - pass * 1.6}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }).join("");
  const dots = splatters.map((dot) => `<circle cx="${(450 + dot.x * 620).toFixed(2)}" cy="${(310 + dot.y * 620 * .96).toFixed(2)}" r="${(dot.r * 620).toFixed(2)}" fill="#f2c984" fill-opacity="${dot.a}"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="620" viewBox="0 0 900 620"><defs><radialGradient id="bg"><stop stop-color="#18202a"/><stop offset=".55" stop-color="#0d121a"/><stop offset="1" stop-color="#08090d"/></radialGradient></defs><rect width="900" height="620" fill="url(#bg)"/>${pathMarkup}${dots}<text x="18" y="602" fill="#8ce8dc" fill-opacity=".55" font-family="monospace" font-size="11">ENSO / FORGE</text></svg>`;
}

$("svgButton").addEventListener("click", () => {
  const blob = new Blob([svgForArt()], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a"); link.download = `enso-forge-${toHex(state.seed, 4)}.svg`; link.href = url; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

addEventListener("resize", () => {
  window.requestAnimationFrame(renderAll);
});

renderAll();
