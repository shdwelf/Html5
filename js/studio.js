import { INDEX, parsePhrase, mnemonicToEntropy, wordCountToEntropyBits } from "./bip39.js";

const DEMO_VECTOR = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
const DEMO_SEED = new Uint8Array([0x45, 0x4e, 0x53, 0x4f, 0x2d, 0x46, 0x4f, 0x52, 0x47, 0x45, 0x2d, 0x30, 0x31, 0x2e, 0x30, 0x31]);
const PALETTES = {
  mineral: {
    label: "MINERAL",
    background: ["#18202a", "#0d121a", "#08090d"],
    guide: "rgba(140,232,220,.08)",
    strokes: ["#8ce8dc", "#9facff", "#c7a9ff", "#f2c984", "#f0f1ed"],
    strokeAlpha: [".72", ".60", ".43", ".28", ".30"],
    splatter: "#f2c984",
    labelColor: "#8ce8dc",
  },
  ember: {
    label: "EMBER",
    background: ["#2a1a1a", "#171014", "#0b090d"],
    guide: "rgba(242,201,132,.09)",
    strokes: ["#f2c984", "#ff9e83", "#ff8c9d", "#c7a9ff", "#fff0cf"],
    strokeAlpha: [".78", ".62", ".48", ".30", ".30"],
    splatter: "#ff9e83",
    labelColor: "#f2c984",
  },
  moon: {
    label: "MOON",
    background: ["#182034", "#0d101c", "#08090d"],
    guide: "rgba(159,172,255,.1)",
    strokes: ["#d8e0ff", "#9facff", "#8ce8dc", "#c7a9ff", "#edf0ff"],
    strokeAlpha: [".76", ".62", ".48", ".34", ".32"],
    splatter: "#d8e0ff",
    labelColor: "#9facff",
  },
};
const DEFAULT_FORGE = { palette: "mineral", brush: 5, roughness: 50, opening: 24, variant: 0, guides: true };
const $ = (id) => document.getElementById(id);

const state = {
  words: [],
  analysis: null,
  panel: "forgePanel",
  seed: DEMO_SEED,
  art: null,
  palette: DEFAULT_FORGE.palette,
  brush: DEFAULT_FORGE.brush,
  roughness: DEFAULT_FORGE.roughness,
  opening: DEFAULT_FORGE.opening,
  variant: DEFAULT_FORGE.variant,
  guides: DEFAULT_FORGE.guides,
  viewerPoints: [],
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

function currentPalette() {
  return PALETTES[state.palette] || PALETTES.mineral;
}

function artSeed() {
  return hashText(`${toHex(state.seed)}|${state.variant}|${state.palette}|${state.brush}|${state.roughness}|${state.opening}`);
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
  const brush = Number(state.brush) / 9;
  const roughness = Number(state.roughness) / 100;
  const gap = (Number(state.opening) * Math.PI) / 180 * (0.88 + random() * 0.24);
  const start = -Math.PI / 2 + gap * (0.2 + random() * 0.35);
  const end = start + Math.PI * 2 - gap;
  const paths = [];
  const passes = 3 + Math.round(brush * 4);
  const baseRadius = 0.315 + random() * 0.028;
  const lean = (random() - 0.5) * (0.035 + roughness * 0.12);
  for (let pass = 0; pass < passes; pass += 1) {
    const points = [];
    const steps = 190 + pass * 10;
    const scale = 1 + (random() - 0.5) * (0.025 + roughness * 0.06);
    const wobble = 0.0025 + roughness * 0.02 + random() * 0.005;
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const angle = start + (end - start) * t;
      const noise = (random() - 0.5) * wobble + Math.sin(t * (12 + roughness * 12) + pass * 2.2) * wobble * 0.65;
      const pressure = 1 + Math.sin(t * Math.PI) * (0.025 + roughness * 0.08) + noise;
      const radius = baseRadius * scale * pressure;
      points.push({
        x: Math.cos(angle) * radius + lean * t + (random() - 0.5) * wobble * 0.45,
        y: Math.sin(angle) * radius + (random() - 0.5) * wobble * 0.45,
        width: 0.005 + Math.sin(t * Math.PI) * 0.009 + random() * 0.006,
      });
    }
    paths.push(points);
  }
  const splatters = [];
  const splatterCount = 12 + Math.round(roughness * 46);
  for (let i = 0; i < splatterCount; i += 1) {
    const angle = start + random() * (end - start);
    const radius = baseRadius * (1.01 + random() * (0.1 + roughness * 0.16));
    splatters.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, r: 0.001 + random() * (0.002 + roughness * 0.006), a: 0.12 + random() * (0.24 + roughness * 0.48) });
  }
  return { paths, splatters, gap, start, end, passes };
}

function drawEnso() {
  const canvas = $("ensoCanvas");
  if (!canvas) return;
  const frame = canvas.closest(".enso-frame");
  frame?.classList.toggle("no-guides", !state.guides);
  const { w, h } = resizeCanvas(canvas, 900, 620);
  const ctx = canvas.getContext("2d");
  const palette = currentPalette();
  const scale = Math.min(w, h);
  const cx = w * 0.5;
  const cy = h * 0.5;
  const art = makeBrushPaths(artSeed());
  state.art = art;
  ctx.clearRect(0, 0, w, h);

  const background = ctx.createRadialGradient(cx, cy * 0.87, 0, cx, cy, scale * 0.72);
  background.addColorStop(0, palette.background[0]);
  background.addColorStop(0.55, palette.background[1]);
  background.addColorStop(1, palette.background[2]);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = palette.guide;
  ctx.lineWidth = 1;
  for (let i = 1; i <= 4; i += 1) {
    ctx.beginPath();
    ctx.arc(cx, cy, scale * (0.18 + i * 0.1), 0, Math.PI * 2);
    ctx.stroke();
  }

  art.paths.forEach((path, pass) => {
    ctx.beginPath();
    path.forEach((point, index) => {
      const x = cx + point.x * scale;
      const y = cy + point.y * scale * 0.96;
      if (!index) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    const color = palette.strokes[pass % palette.strokes.length];
    const opacity = palette.strokeAlpha[pass % palette.strokeAlpha.length];
    ctx.strokeStyle = color;
    ctx.globalAlpha = Number(opacity);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(1.5, scale * (0.007 + Number(state.brush) / 9 * 0.014 - pass * 0.0011));
    ctx.shadowColor = pass === 0 ? `${color}55` : "transparent";
    ctx.shadowBlur = pass === 0 ? scale * 0.018 : 0;
    ctx.stroke();
  });
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  art.splatters.forEach((dot) => {
    ctx.beginPath();
    ctx.fillStyle = palette.splatter;
    ctx.globalAlpha = dot.a;
    ctx.arc(cx + dot.x * scale, cy + dot.y * scale * .96, dot.r * scale, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  ctx.fillStyle = `${palette.labelColor}88`;
  ctx.font = `${Math.max(8, scale * .013)}px ${getComputedStyle(document.body).fontFamily}`;
  ctx.letterSpacing = "2px";
  ctx.fillText("ENSO / FORGE", 18, h - 18);
  ctx.fillStyle = "rgba(190,199,230,.28)";
  ctx.textAlign = "right";
  ctx.fillText(`${state.analysis?.ok ? "VALID SOURCE" : state.words.length ? "DRAFT SOURCE" : "DEMO SOURCE"} · V${String(state.variant).padStart(2, "0")}`, w - 18, h - 18);
  ctx.textAlign = "left";

  const angleDeg = Math.round((art.gap * 180) / Math.PI);
  $("inspectorGap").textContent = `${angleDeg}° / OPEN`;
  $("inspectorBrush").textContent = `DRY / ${String(art.passes).padStart(2, "0")} PASS`;
  $("inspectorVariant").textContent = `${String(state.variant).padStart(2, "0")} / ${state.analysis?.ok ? "VERIFIED" : state.words.length ? "DRAFT" : "DEMO"}`;
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

  const palette = currentPalette();
  const random = makeRng(hashText(`field|${toHex(state.seed)}`));
  const pad = Math.min(25, w * .04);
  ctx.strokeStyle = `${palette.strokes[1]}22`;
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
    ctx.fillStyle = i % 11 === 0 ? `${palette.strokes[2]}55` : `${palette.strokes[0]}30`;
    ctx.fillRect(x, y, 1.2, 1.2);
  }
  state.viewerPoints = points;

  const indices = (state.analysis?.indices || state.words.map((word) => INDEX.get(word))).filter((index) => Number.isInteger(index));
  if (indices.length) {
    ctx.beginPath();
    indices.forEach((index, i) => {
      const point = points[index];
      if (!point) return;
      if (!i) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.strokeStyle = `${palette.splatter}bf`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    indices.forEach((index, i) => {
      const point = points[index];
      if (!point) return;
      ctx.beginPath();
      ctx.fillStyle = i === indices.length - 1 ? palette.splatter : palette.strokes[0];
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

function hideViewerTooltip() {
  const tooltip = $("viewerTooltip");
  if (tooltip) tooltip.hidden = true;
}

function inspectViewerPoint(event) {
  const canvas = $("keyCanvas");
  const tooltip = $("viewerTooltip");
  if (!canvas || !tooltip || !state.viewerPoints.length) return;
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const sx = canvas.width / Math.max(1, rect.width);
  const sy = canvas.height / Math.max(1, rect.height);
  const px = x * sx;
  const py = y * sy;
  let nearest = -1;
  let distance = Infinity;
  state.viewerPoints.forEach((point, index) => {
    const dx = point.x - px;
    const dy = point.y - py;
    const next = dx * dx + dy * dy;
    if (next < distance) { distance = next; nearest = index; }
  });
  const hitRadius = Math.max(12 * sx, canvas.width * .022);
  if (nearest < 0 || distance > hitRadius * hitRadius) {
    hideViewerTooltip();
    return;
  }
  const point = state.viewerPoints[nearest];
  const words = state.analysis?.indices || state.words.map((word) => INDEX.get(word));
  const wordPosition = words.findIndex((index) => index === nearest);
  $("tooltipIndex").textContent = `#${String(nearest).padStart(4, "0")}`;
  $("tooltipWord").textContent = wordPosition >= 0 ? `${String(wordPosition + 1).padStart(2, "0")} · ${state.words[wordPosition]}` : "unselected word cell";
  tooltip.hidden = false;
  const tooltipWidth = Math.min(180, rect.width * .42);
  tooltip.style.left = `${Math.max(8, Math.min(rect.width - tooltipWidth - 8, x + 12))}px`;
  tooltip.style.top = `${Math.max(8, Math.min(rect.height - 55, y + 12))}px`;
}

function drawBitTape() {
  const canvas = $("bitCanvas");
  if (!canvas) return;
  const { w, h } = resizeCanvas(canvas, 900, 120);
  const ctx = canvas.getContext("2d");
  const palette = currentPalette();
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
    ctx.fillStyle = value === undefined ? "#101522" : isChecksum ? (value ? palette.splatter : `${palette.splatter}38`) : (value ? palette.strokes[0] : `${palette.strokes[0]}30`);
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
    $("validatorReadout").textContent = "NO SOURCE";
    $("validatorChecksumBits").textContent = "—";
    $("validatorEntropyBits").textContent = "—";
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
  const validatorLabel = state.analysis?.ok ? "CHECKSUM OK" : validCount && allKnown ? "CHECKSUM MISMATCH" : "REVIEW SOURCE";
  $("validatorState").textContent = state.analysis?.ok ? "VALID MNEMONIC" : validCount && allKnown ? "CHECKSUM MISMATCH" : "REVIEW SOURCE";
  $("validatorReadout").textContent = validatorLabel;
  $("validatorChecksumBits").textContent = validCount ? `${wordCountToEntropyBits(words.length) / 32} bits` : "—";
  $("validatorEntropyBits").textContent = state.analysis?.entropyBits ? `${state.analysis.entropyBits} bits` : validCount ? `${wordCountToEntropyBits(words.length)} bits` : "—";
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
  const palette = currentPalette();
  const sourceLabel = analysis?.ok ? `${words.length} WORDS` : words.length ? "DRAFT SOURCE" : "DEMO SEED";
  $("studioWordCount").textContent = countLabel(words.length);
  $("metricWords").textContent = words.length ? words.length : "—";
  $("metricEntropy").textContent = analysis?.entropyBits ? `${analysis.entropyBits}b` : "—";
  $("metricChecksum").textContent = analysis?.checksumBits ? `${analysis.checksumBits}b` : "—";
  $("inspectorInput").textContent = sourceLabel;
  $("inspectorPalette").textContent = palette.label;
  $("inspectorVariant").textContent = `${String(state.variant).padStart(2, "0")} / ${analysis?.ok ? "VERIFIED" : words.length ? "DRAFT" : "DEMO"}`;
  $("forgeState").textContent = analysis?.ok ? `VALID SOURCE · V${String(state.variant).padStart(2, "0")}` : words.length ? `DRAFT SEED · V${String(state.variant).padStart(2, "0")}` : "DEMO SEED";
  $("forgeNote").textContent = analysis?.ok ? `Source verified. Forge variation ${String(state.variant).padStart(2, "0")} from its entropy.` : words.length ? "Draft source only. Validate the phrase before treating the mark as a verified study." : "A calm default mark is ready. Load a phrase to forge a private variation.";
  $("paletteName").textContent = palette.label;
  $("brushValue").textContent = String(state.brush).padStart(2, "0");
  $("roughnessValue").textContent = String(state.roughness).padStart(2, "0");
  $("openingValue").textContent = `${state.opening}°`;
  $("guidesButton").textContent = state.guides ? "GUIDES ON" : "GUIDES OFF";
  $("guidesButton").setAttribute("aria-pressed", String(state.guides));
}

function syncForgeControls() {
  $("brushRange").value = String(state.brush);
  $("roughnessRange").value = String(state.roughness);
  $("openingRange").value = String(state.opening);
  document.querySelectorAll("[data-palette]").forEach((button) => button.classList.toggle("active", button.dataset.palette === state.palette));
}

function renderAll() {
  renderMetrics();
  renderWordDiagnostics();
  syncForgeControls();
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
  else hideViewerTooltip();
  if (panelId === "forgePanel") drawEnso();
}

document.querySelectorAll(".studio-tab").forEach((button) => {
  button.id = button.dataset.panel === "forgePanel" ? "forgeTab" : button.dataset.panel === "viewerPanel" ? "viewerTab" : "validatorTab";
  button.addEventListener("click", () => setPanel(button.dataset.panel));
});

document.addEventListener("keydown", (event) => {
  if (["TEXTAREA", "INPUT", "BUTTON"].includes(event.target?.tagName)) return;
  const panels = ["forgePanel", "viewerPanel", "validatorPanel"];
  const index = Number(event.key) - 1;
  if (index >= 0 && index < panels.length) setPanel(panels[index]);
  if (event.key.toLowerCase() === "f") { state.variant = (state.variant + 1) % 100; renderMetrics(); drawEnso(); }
});

function bindForgeControls() {
  const ranges = [
    ["brushRange", "brush", (value) => String(value).padStart(2, "0")],
    ["roughnessRange", "roughness", (value) => String(value).padStart(2, "0")],
    ["openingRange", "opening", (value) => `${value}°`],
  ];
  ranges.forEach(([id, key, format]) => {
    $(id).addEventListener("input", (event) => {
      state[key] = Number(event.target.value);
      $(id.replace("Range", "Value")).textContent = format(state[key]);
      drawEnso();
      renderMetrics();
    });
  });
  $("paletteControls").addEventListener("click", (event) => {
    const button = event.target.closest("[data-palette]");
    if (!button || !PALETTES[button.dataset.palette]) return;
    state.palette = button.dataset.palette;
    syncForgeControls();
    renderAll();
  });
  $("guidesButton").addEventListener("click", () => {
    state.guides = !state.guides;
    renderMetrics();
    drawEnso();
  });
  $("resetButton").addEventListener("click", () => {
    state.palette = DEFAULT_FORGE.palette;
    state.brush = DEFAULT_FORGE.brush;
    state.roughness = DEFAULT_FORGE.roughness;
    state.opening = DEFAULT_FORGE.opening;
    state.variant = DEFAULT_FORGE.variant;
    state.guides = DEFAULT_FORGE.guides;
    syncForgeControls();
    renderAll();
  });
}

function bindViewerInspection() {
  const canvas = $("keyCanvas");
  if (!canvas) return;
  canvas.addEventListener("pointermove", inspectViewerPoint);
  canvas.addEventListener("pointerleave", hideViewerTooltip);
  canvas.addEventListener("blur", hideViewerTooltip);
}

async function validateStudio() {
  const run = ++validationId;
  const words = parsePhrase($("studioInput").value);
  state.words = words;
  state.analysis = null;
  state.variant = DEFAULT_FORGE.variant;
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
  state.variant = (state.variant + 1) % 100;
  renderMetrics();
  drawEnso();
});

$("pngButton").addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = `enso-forge-${toHex(state.seed, 4)}-v${String(state.variant).padStart(2, "0")}.png`;
  link.href = $("ensoCanvas").toDataURL("image/png");
  link.click();
});

function svgForArt() {
  const palette = currentPalette();
  const paths = state.art?.paths || [];
  const splatters = state.art?.splatters || [];
  const pathMarkup = paths.map((path, pass) => {
    const d = path.map((point, i) => `${i ? "L" : "M"}${(450 + point.x * 620).toFixed(2)} ${(310 + point.y * 620 * .96).toFixed(2)}`).join(" ");
    const opacity = Number(palette.strokeAlpha[pass % palette.strokeAlpha.length]);
    const color = palette.strokes[pass % palette.strokes.length];
    const width = Math.max(2, 14 - pass * 1.35 + Number(state.brush));
    return `<path d="${d}" fill="none" stroke="${color}" stroke-opacity="${opacity}" stroke-width="${width.toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }).join("");
  const dots = splatters.map((dot) => `<circle cx="${(450 + dot.x * 620).toFixed(2)}" cy="${(310 + dot.y * 620 * .96).toFixed(2)}" r="${(dot.r * 620).toFixed(2)}" fill="${palette.splatter}" fill-opacity="${dot.a}"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="620" viewBox="0 0 900 620"><defs><radialGradient id="bg"><stop stop-color="${palette.background[0]}"/><stop offset=".55" stop-color="${palette.background[1]}"/><stop offset="1" stop-color="${palette.background[2]}"/></radialGradient></defs><rect width="900" height="620" fill="url(#bg)"/>${pathMarkup}${dots}<text x="18" y="602" fill="${palette.labelColor}" fill-opacity=".55" font-family="monospace" font-size="11">ENSO / FORGE · V${String(state.variant).padStart(2, "0")}</text></svg>`;
}

$("svgButton").addEventListener("click", () => {
  const blob = new Blob([svgForArt()], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a"); link.download = `enso-forge-${toHex(state.seed, 4)}-v${String(state.variant).padStart(2, "0")}.svg`; link.href = url; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

addEventListener("resize", () => {
  window.requestAnimationFrame(renderAll);
});

bindForgeControls();
bindViewerInspection();
renderAll();
