import { INDEX, parsePhrase, mnemonicToEntropy, wordCountToEntropyBits } from "./bip39.js";
import { CATALOG } from "./haiku-catalog.js";
import { COIN_MODELS, FOIL_TREATMENTS, HANKO_STYLES, PAPER_HUES, POETRY_FORMS, SAIJIKI, SEASONS, SOLVERS } from "./studio-data.js";
import { clearGallery, deleteGalleryCard, listGallery, saveGalleryCard } from "./studio-fs.js";

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
const DEFAULT_FORGE = {
  palette: "mineral", brush: 5, inkLoad: 8, roughness: 50, opening: 24,
  fluidDensity: 1, fiberGrain: 1, bristleSplit: 1, strokeDirection: "ccw", paperHue: "cyan",
  aspect: "organic", dynamic: "balanced", hanko: "slate", hankoText: "印", hankoColor: "#1f2937",
  batchSize: 1, rotation: 353, variant: 0, guides: true, coin: "btc", foil: "aurora", cardTitle: "ENSŌ / FIRST BREATH",
};
const $ = (id) => document.getElementById(id);

const state = {
  words: [],
  analysis: null,
  panel: "forgePanel",
  seed: DEMO_SEED,
  art: null,
  palette: DEFAULT_FORGE.palette,
  brush: DEFAULT_FORGE.brush,
  inkLoad: DEFAULT_FORGE.inkLoad,
  roughness: DEFAULT_FORGE.roughness,
  opening: DEFAULT_FORGE.opening,
  fluidDensity: DEFAULT_FORGE.fluidDensity,
  fiberGrain: DEFAULT_FORGE.fiberGrain,
  bristleSplit: DEFAULT_FORGE.bristleSplit,
  strokeDirection: DEFAULT_FORGE.strokeDirection,
  paperHue: DEFAULT_FORGE.paperHue,
  aspect: DEFAULT_FORGE.aspect,
  dynamic: DEFAULT_FORGE.dynamic,
  hanko: DEFAULT_FORGE.hanko,
  hankoText: DEFAULT_FORGE.hankoText,
  hankoColor: DEFAULT_FORGE.hankoColor,
  batchSize: DEFAULT_FORGE.batchSize,
  rotation: DEFAULT_FORGE.rotation,
  variant: DEFAULT_FORGE.variant,
  guides: DEFAULT_FORGE.guides,
  coin: DEFAULT_FORGE.coin,
  foil: DEFAULT_FORGE.foil,
  cardTitle: DEFAULT_FORGE.cardTitle,
  fingerprint: "003F6B0F",
  viewerPoints: [],
  solvers: [],
  poem: null,
  gallery: [],
};

let validationId = 0;
let validationTimer = null;

function countLabel(n) {
  return `${n} word${n === 1 ? "" : "s"}`;
}

function catalogMatches(item, filter, query) {
  const type = item.type.toLowerCase();
  const matchesFilter =
    filter === "all" ||
    (filter === "repeat12" && type.includes("11 / 12")) ||
    (filter === "repeat15" && type.includes("14 / 15")) ||
    (filter === "repeat24" && type.includes("23 / 24")) ||
    (filter === "haiku" && type.includes("haiku"));
  if (!matchesFilter) return false;
  if (!query) return true;
  return `${item.type} ${item.pattern} ${item.text}`.toLowerCase().includes(query);
}

function renderCatalog() {
  const host = $("catalogList");
  if (!host) return;
  const filter = $("catalogFilter")?.value || "all";
  const query = ($("catalogSearch")?.value || "").trim().toLowerCase();
  const matches = CATALOG.filter((item) => catalogMatches(item, filter, query));
  host.replaceChildren();
  matches.forEach((item) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "catalog-card";
    card.title = "Load this checksum-valid pattern into the studio";
    const head = document.createElement("span"); head.className = "catalog-card-head";
    const type = document.createElement("b"); type.textContent = item.type.toUpperCase();
    const badge = document.createElement("i"); badge.textContent = "VALID";
    head.append(type, badge);
    const pattern = document.createElement("span"); pattern.className = "catalog-card-pattern"; pattern.textContent = item.pattern;
    const phrase = document.createElement("span"); phrase.className = "catalog-card-phrase"; phrase.textContent = item.text;
    const foot = document.createElement("span"); foot.className = "catalog-card-foot"; foot.textContent = `LOAD SPECIMEN ${String(CATALOG.indexOf(item) + 1).padStart(3, "0")}  →`;
    card.append(head, pattern, phrase, foot);
    card.addEventListener("click", () => {
      $("studioInput").value = item.text;
      $("sourceHint").textContent = "Catalog specimen loaded · checksum-valid demonstration, not a wallet seed.";
      clearTimeout(validationTimer);
      validateStudio();
      setPanel("validatorPanel");
      $("studioInput").focus();
    });
    host.append(card);
  });
  $("catalogCount").textContent = `${matches.length} / ${CATALOG.length}`;
  $("catalogStatus").textContent = query || filter !== "all" ? `${matches.length} MATCHES` : `${CATALOG.length} ENTRIES`;
  if (!matches.length) {
    const empty = document.createElement("div"); empty.className = "catalog-empty"; empty.textContent = "No specimens match this filter."; host.append(empty);
  }
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
  return hashText(`${toHex(state.seed)}|${state.variant}|${state.palette}|${state.inkLoad}|${state.brush}|${state.roughness}|${state.opening}|${state.strokeDirection}|${state.paperHue}|${state.aspect}|${state.dynamic}|${state.hanko}|${state.hankoText}|${state.rotation}`);
}

async function sha256(bytes) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return new Uint8Array(digest);
}

async function fingerprintFor(bytes) {
  try {
    return toHex(await sha256(bytes), 4).toUpperCase();
  } catch {
    return toHex(hashText(`fingerprint|${toHex(bytes)}`), 4).toUpperCase();
  }
}

async function refreshFingerprint() {
  state.fingerprint = await fingerprintFor(state.seed);
  renderMetrics();
}

async function evaluateSolvers() {
  const encoded = new TextEncoder();
  const source = new Uint8Array([...state.seed, ...encoded.encode("ART-STUDIO")]);
  return Promise.all(SOLVERS.map(async (solver) => ({
    ...solver,
    fingerprint: await fingerprintFor(new Uint8Array([...source, ...encoded.encode(solver.domain)])),
  })));
}

function renderSolvers() {
  const host = $("solverGrid");
  if (!host) return;
  host.replaceChildren();
  (state.solvers.length ? state.solvers : SOLVERS).forEach((solver) => {
    const chip = document.createElement("div");
    chip.className = `solver-chip${state.solvers.length ? " active" : ""}`;
    const label = document.createElement("b"); label.textContent = solver.label;
    const value = document.createElement("span"); value.textContent = solver.fingerprint || "READY";
    chip.append(label, value); host.append(chip);
  });
  $("solverSummary").textContent = state.solvers.length ? `${state.solvers.length} EVALUATED` : `${SOLVERS.length} MAPPINGS`;
}

function renderMatchState() {
  const match = $("mintMatch");
  if (!match) return;
  const valid = Boolean(state.analysis?.ok);
  const kind = valid ? "valid" : state.analysis ? "invalid" : "draft";
  match.className = `mint-match ${kind}`;
  match.querySelector(".match-icon").textContent = valid ? "✓" : kind === "invalid" ? "×" : "·";
  $("mappingStatus").textContent = valid ? `VALID MATCH FORMED · ${state.solvers.length || SOLVERS.length} MAPPINGS` : "VALID SOURCE REQUIRED";
  $("mappingNote").textContent = valid ? "Ten distinct art mappings evaluated from the verified entropy source." : "Validate a phrase to evaluate the ten local mapping solvers.";
  $("mintState").textContent = valid ? "VALID / READY" : "DRAFT READY";
}

function randomInt(max) {
  if (max <= 0) return 0;
  const values = new Uint32Array(1);
  try { crypto.getRandomValues(values); } catch { values[0] = Math.floor(Math.random() * 0xffffffff); }
  return values[0] % max;
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
  const brush = Number(state.brush) / 10;
  const ink = Number(state.inkLoad) / 10;
  const roughness = Number(state.roughness) / 100;
  const dynamic = state.dynamic === "calm" ? .58 : state.dynamic === "wild" ? 1.5 : 1;
  const direction = state.strokeDirection === "cw" ? -1 : 1;
  const gap = (Number(state.opening) * Math.PI) / 180 * (0.88 + random() * 0.24);
  const start = (Number(state.rotation) * Math.PI) / 180 + gap * (0.2 + random() * 0.35) * direction;
  const end = start + direction * (Math.PI * 2 - gap);
  const paths = [];
  const passes = 2 + Math.round(brush * 4) + Number(state.bristleSplit);
  const baseRadius = 0.31 + ink * 0.025 + random() * 0.028;
  const lean = (random() - 0.5) * (0.035 + roughness * 0.12) * dynamic;
  for (let pass = 0; pass < passes; pass += 1) {
    const points = [];
    const steps = 190 + pass * 10;
    const scale = 1 + (random() - 0.5) * (0.025 + roughness * 0.06);
    const wobble = (0.0025 + roughness * 0.02 + random() * 0.005) * dynamic;
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const angle = start + (end - start) * t;
      const noise = (random() - 0.5) * wobble + Math.sin(t * (12 + roughness * 12) + pass * 2.2) * wobble * 0.65;
      const pressure = 1 + Math.sin(t * Math.PI) * (0.025 + roughness * 0.08) * dynamic + noise;
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
  const splatterCount = 10 + Math.round(roughness * 40 + Number(state.fluidDensity) * 10 + Number(state.bristleSplit) * 5);
  for (let i = 0; i < splatterCount; i += 1) {
    const angle = start + random() * (end - start);
    const radius = baseRadius * (1.01 + random() * (0.1 + roughness * 0.16));
    splatters.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, r: 0.001 + random() * (0.002 + roughness * 0.006), a: (0.12 + random() * (0.24 + roughness * 0.48)) * (0.55 + Number(state.fluidDensity) * .18) });
  }
  return { paths, splatters, gap, start, end, passes };
}

function aspectScale() {
  return state.aspect === "equal" ? 1 : state.aspect === "wide" ? .72 : state.aspect === "tall" ? 1.22 : .87;
}

function drawFiberGrain(ctx, w, h, scale, paper) {
  const intensity = Number(state.fiberGrain);
  if (!intensity) return;
  const random = makeRng(hashText(`fiber|${toHex(state.seed)}|${state.variant}|${state.paperHue}`));
  ctx.save();
  ctx.strokeStyle = `${paper.ink}24`;
  ctx.fillStyle = `${paper.ink}28`;
  ctx.lineWidth = Math.max(1, scale * .0011);
  for (let i = 0; i < intensity * 26; i += 1) {
    const x = random() * w;
    const y = random() * h;
    const length = scale * (.02 + random() * .12);
    ctx.globalAlpha = .18 + random() * .18;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + length * (random() - .5), y + length * (random() - .14));
    ctx.stroke();
  }
  for (let i = 0; i < intensity * 35; i += 1) {
    ctx.globalAlpha = .12 + random() * .2;
    ctx.beginPath();
    ctx.arc(random() * w, random() * h, Math.max(1, scale * (.0005 + random() * .0015)), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawHanko(ctx, w, h, scale) {
  const style = HANKO_STYLES[state.hanko] || HANKO_STYLES.slate;
  const color = state.hanko === "custom" ? state.hankoColor : style.color;
  const glyph = state.hanko === "custom" ? (state.hankoText.trim() || "印") : style.glyph;
  const radius = Math.max(18, scale * .052);
  const x = w - radius - 20;
  const y = h - radius - 28;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-.08);
  ctx.globalAlpha = .82;
  ctx.strokeStyle = color;
  ctx.fillStyle = `${color}18`;
  ctx.lineWidth = Math.max(1.5, scale * .003);
  if (state.hanko === "indigo") {
    ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, radius * .72, 0, Math.PI * 2); ctx.stroke();
  } else {
    ctx.strokeRect(-radius, -radius, radius * 2, radius * 2);
    ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
  }
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `600 ${Math.max(12, scale * .035)}px ${getComputedStyle(document.body).fontFamily}`;
  ctx.fillText(glyph.slice(0, 4), 0, 0);
  ctx.restore();
}

function drawEnso() {
  const canvas = $("ensoCanvas");
  if (!canvas) return;
  const frame = canvas.closest(".enso-frame");
  frame?.classList.toggle("no-guides", !state.guides);
  const { w, h } = resizeCanvas(canvas, 900, 620);
  const ctx = canvas.getContext("2d");
  const palette = currentPalette();
  const paper = PAPER_HUES[state.paperHue] || PAPER_HUES.cyan;
  const aspect = aspectScale();
  const scale = Math.min(w, h);
  const cx = w * 0.5;
  const cy = h * 0.5;
  const art = makeBrushPaths(artSeed());
  state.art = art;
  ctx.clearRect(0, 0, w, h);

  const background = ctx.createRadialGradient(cx, cy * 0.87, 0, cx, cy, scale * 0.72);
  background.addColorStop(0, `${paper.hex}32`);
  background.addColorStop(0.34, palette.background[0]);
  background.addColorStop(0.62, palette.background[1]);
  background.addColorStop(1, palette.background[2]);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, w, h);
  drawFiberGrain(ctx, w, h, scale, paper);

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
      const y = cy + point.y * scale * aspect;
      if (!index) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    const color = palette.strokes[pass % palette.strokes.length];
    const opacity = palette.strokeAlpha[pass % palette.strokeAlpha.length];
    ctx.strokeStyle = color;
    ctx.globalAlpha = Math.min(1, Number(opacity) * (.55 + Number(state.inkLoad) * .065));
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(1.5, scale * (0.006 + Number(state.brush) / 10 * 0.016 - pass * 0.0011));
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
    ctx.arc(cx + dot.x * scale, cy + dot.y * scale * aspect, dot.r * scale, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  drawHanko(ctx, w, h, scale);

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

function drawCoinGeometry() {
  const canvas = $("coinCanvas");
  if (!canvas) return;
  const { w, h } = resizeCanvas(canvas, 900, 170);
  const model = COIN_MODELS[state.coin] || COIN_MODELS.btc;
  const ctx = canvas.getContext("2d");
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, "#080a10"); bg.addColorStop(1, "#141321");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  const random = makeRng(hashText(`coin-geometry|${toHex(state.seed)}|${state.coin}`));
  const cx = w * .5; const cy = h * .5; const radius = Math.min(w, h) * .31;
  ctx.strokeStyle = `${model.color}20`; ctx.lineWidth = 1;
  for (let ring = 1; ring <= 3; ring += 1) {
    ctx.beginPath(); ctx.ellipse(cx, cy, radius * ring / 3, radius * ring / 3 * (model.sides % 2 ? .62 : .78), (ring - 1) * .2, 0, Math.PI * 2); ctx.stroke();
  }
  const points = [];
  for (let i = 0; i < 96; i += 1) {
    const t = i / 95;
    const angle = t * Math.PI * 2;
    const modulation = .74 + Math.sin(i * .31 + random() * 2) * .16 + (random() - .5) * .11;
    const r = radius * modulation;
    const x = cx + Math.cos(angle * (model.sides / 7)) * r;
    const y = cy + Math.sin(angle) * r * (model.sides % 3 === 0 ? .55 : .75);
    points.push({ x, y });
  }
  ctx.beginPath(); points.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y));
  ctx.strokeStyle = `${model.color}a6`; ctx.lineWidth = 1.2; ctx.stroke();
  for (let i = 0; i < points.length; i += 4) {
    const point = points[i]; ctx.beginPath(); ctx.fillStyle = i % model.sides === 0 ? model.color : `${model.color}80`; ctx.arc(point.x, point.y, i % model.sides === 0 ? 2.5 : 1.2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = `${model.color}b8`; ctx.font = `${Math.max(8, w * .012)}px ${getComputedStyle(document.body).fontFamily}`; ctx.fillText(model.label, 14, h - 12);
  ctx.fillStyle = "rgba(190,199,230,.42)"; ctx.textAlign = "right"; ctx.fillText(model.geometry.toUpperCase(), w - 14, h - 12); ctx.textAlign = "left";
  $("coinGeometryNote").textContent = `${model.label} · ${model.geometry}`;
  document.querySelectorAll("[data-coin]").forEach((button) => button.classList.toggle("active", button.dataset.coin === state.coin));
}

function drawMintCard() {
  const canvas = $("mintCanvas");
  if (!canvas) return;
  const { w, h } = resizeCanvas(canvas, 720, 920);
  const ctx = canvas.getContext("2d");
  const model = COIN_MODELS[state.coin] || COIN_MODELS.btc;
  const foil = FOIL_TREATMENTS[state.foil] || FOIL_TREATMENTS.aurora;
  const paper = PAPER_HUES[state.paperHue] || PAPER_HUES.cyan;
  const background = ctx.createLinearGradient(0, 0, w, h);
  background.addColorStop(0, `${paper.hex}4c`); background.addColorStop(.34, "#151b29"); background.addColorStop(1, "#090b12");
  ctx.fillStyle = background; ctx.fillRect(0, 0, w, h);
  const glow = ctx.createRadialGradient(w * .5, h * .38, 0, w * .5, h * .38, w * .56);
  glow.addColorStop(0, `${foil.colors[0]}28`); glow.addColorStop(1, "transparent"); ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = `${foil.colors[0]}a6`; ctx.lineWidth = Math.max(2, w * .008); ctx.strokeRect(12, 12, w - 24, h - 24);
  ctx.strokeStyle = `${foil.colors[1]}75`; ctx.lineWidth = Math.max(1, w * .003); ctx.strokeRect(20, 20, w - 40, h - 40);

  ctx.fillStyle = foil.colors[0]; ctx.font = `600 ${Math.max(9, w * .026)}px ${getComputedStyle(document.body).fontFamily}`; ctx.fillText("ART STUDIO / ENSO FORGE", 34, 52);
  ctx.fillStyle = "rgba(240,241,237,.65)"; ctx.textAlign = "right"; ctx.fillText(model.label, w - 34, 52); ctx.textAlign = "left";
  const cx = w * .5; const cy = h * .39; const radius = Math.min(w, h) * .27; const art = state.art || makeBrushPaths(artSeed());
  ctx.strokeStyle = `${foil.colors[0]}20`; ctx.lineWidth = 1; for (let ring = 1; ring <= 3; ring += 1) { ctx.beginPath(); ctx.arc(cx, cy, radius * ring / 3, 0, Math.PI * 2); ctx.stroke(); }
  art.paths.forEach((path, pass) => {
    ctx.beginPath(); path.forEach((point, index) => { const x = cx + point.x * radius * 2.75; const y = cy + point.y * radius * 2.75 * aspectScale(); if (!index) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
    ctx.strokeStyle = pass % 2 ? foil.colors[1] : foil.colors[0]; ctx.globalAlpha = .27 + Math.max(0, .22 - pass * .018); ctx.lineWidth = Math.max(1.5, w * (.008 - pass * .0007)); ctx.lineCap = "round"; ctx.stroke();
  });
  ctx.globalAlpha = 1; drawHanko(ctx, w, h, Math.min(w, h) * .62);
  ctx.fillStyle = "rgba(240,241,237,.88)"; ctx.textAlign = "center"; ctx.font = `600 ${Math.max(14, w * .046)}px ${getComputedStyle(document.body).fontFamily}`; ctx.fillText((state.cardTitle || "ENSŌ / FIRST BREATH").slice(0, 28), cx, h * .72);
  ctx.fillStyle = `${foil.colors[0]}b8`; ctx.font = `${Math.max(8, w * .018)}px ${getComputedStyle(document.body).fontFamily}`; ctx.fillText(`${model.name.toUpperCase()} · ${model.geometry.toUpperCase()}`, cx, h * .765);
  ctx.textAlign = "left"; ctx.fillStyle = "rgba(240,241,237,.5)"; ctx.font = `${Math.max(7, w * .015)}px ${getComputedStyle(document.body).fontFamily}`; ctx.fillText("COLLECTIBLE SEED ID / MAP ART", 34, h - 82); ctx.fillStyle = foil.colors[0]; ctx.font = `600 ${Math.max(11, w * .03)}px ${getComputedStyle(document.body).fontFamily}`; ctx.fillText(state.fingerprint, 34, h - 59);
  ctx.textAlign = "right"; ctx.fillStyle = "rgba(240,241,237,.45)"; ctx.font = `${Math.max(7, w * .014)}px ${getComputedStyle(document.body).fontFamily}`; ctx.fillText(`${state.poem?.form || "HAIKU"} · V${String(state.variant).padStart(2, "0")}`, w - 34, h - 59); ctx.textAlign = "left";
  ctx.fillStyle = `${foil.colors[1]}88`; ctx.font = `${Math.max(7, w * .014)}px ${getComputedStyle(document.body).fontFamily}`; ctx.fillText("NO WALLET KEY / ARTIFACT ONLY", 34, h - 35);
}

function renderMintMeta() {
  const model = COIN_MODELS[state.coin] || COIN_MODELS.btc;
  $("mintSeedId").textContent = state.fingerprint;
  $("mintBatchValue").textContent = `${state.batchSize} ASSET${state.batchSize === 1 ? "" : "S"}`;
  $("mintFormValue").textContent = state.poem?.form || "HAIKU";
  $("mintState").textContent = state.analysis?.ok ? "VALID / READY" : "DRAFT READY";
  $("mintCoin").value = state.coin;
  $("foilTreatment").value = state.foil;
  $("coinGeometryNote").textContent = `${model.label} · ${model.geometry}`;
}

function renderGallery() {
  const host = $("galleryList");
  if (!host) return;
  host.replaceChildren();
  if (!state.gallery.length) {
    const empty = document.createElement("div"); empty.className = "gallery-empty"; empty.textContent = "No artifacts minted in this browser yet."; host.append(empty); return;
  }
  state.gallery.slice(0, 24).forEach((card) => {
    const item = document.createElement("article"); item.className = "gallery-item";
    const head = document.createElement("div"); head.className = "gallery-item-head";
    const title = document.createElement("b"); title.textContent = card.title || "UNTITLED ENSŌ";
    const remove = document.createElement("button"); remove.type = "button"; remove.textContent = "×"; remove.title = "Remove artifact";
    remove.addEventListener("click", async () => { await deleteGalleryCard(card.id); state.gallery = state.gallery.filter((entry) => entry.id !== card.id); renderGallery(); });
    head.append(title, remove);
    const detail = document.createElement("p"); detail.textContent = `${card.seedId} · ${card.coin} · ${card.form} · V${String(card.variant).padStart(2, "0")}`;
    item.append(head, detail); host.append(item);
  });
}

async function loadGallery() {
  state.gallery = await listGallery();
  renderGallery();
}

function buildCardRecord() {
  return {
    id: `enso-${state.fingerprint.toLowerCase()}-${String(state.variant).padStart(2, "0")}-${Date.now().toString(36)}`,
    title: state.cardTitle.trim() || "UNTITLED ENSŌ",
    seedId: state.fingerprint,
    coin: (COIN_MODELS[state.coin] || COIN_MODELS.btc).label,
    foil: (FOIL_TREATMENTS[state.foil] || FOIL_TREATMENTS.aurora).label,
    form: state.poem?.form || "HAIKU",
    variant: state.variant,
    batch: state.batchSize,
    solvers: state.solvers.map((solver) => solver.label),
    svg: svgForArt(),
    createdAt: Date.now(),
  };
}

async function mintCollectible() {
  if (!state.analysis?.ok) {
    setPanel("validatorPanel");
    renderStatus("invalid", "VALID MATCH REQUIRED", "A checksum-valid source is required before minting a wallet-linked art collectible.");
    return;
  }
  const startVariant = state.variant;
  const records = [];
  for (let index = 0; index < state.batchSize; index += 1) {
    state.variant = (startVariant + index) % 100;
    drawEnso(); drawMintCard();
    records.push(await saveGalleryCard(buildCardRecord()));
  }
  state.variant = (startVariant + records.length - 1) % 100;
  state.gallery = await listGallery();
  renderAll();
  renderGallery();
  $("mintState").textContent = `${records.length} MINTED / LOCAL GALLERY`;
  setPanel("mintPanel");
}

function shareCard() {
  if (!state.analysis?.ok) {
    setPanel("validatorPanel");
    renderStatus("invalid", "VALID MATCH REQUIRED", "Validate the source before sharing a collectible record.");
    return;
  }
  const model = COIN_MODELS[state.coin] || COIN_MODELS.btc;
  const update = {
    payload: { type: "enso-card", title: state.cardTitle, seedId: state.fingerprint, coin: model.label, foil: FOIL_TREATMENTS[state.foil]?.label || state.foil, form: state.poem?.form || "HAIKU", variant: state.variant },
    info: `Enso Forge collectible · ${state.fingerprint}`,
    summary: `${state.cardTitle} · ${model.label} · ${state.fingerprint}`,
  };
  if (window.webxdc?.sendUpdate) window.webxdc.sendUpdate(update, "enso forge collectible");
  $("mintState").textContent = "SHARED TO CHAT";
}

function base64FromText(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index]);
  return btoa(binary);
}

function buildQuineHtml() {
  const svgData = base64FromText(svgForArt());
  return `<!doctype html><html lang="en"><meta charset="utf-8"><title>ENSŌ FORGE · ${state.fingerprint}</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#08090d;color:#f2f1ed;font-family:system-ui;padding:24px}main{width:min(900px,100%)}img{display:block;width:100%;border:1px solid #8ce8dc;border-radius:12px}p{font:12px monospace;color:#8ce8dc;letter-spacing:.08em}code{display:block;white-space:pre-wrap;color:#a7a9b8;font:10px monospace;background:#11141d;padding:12px;border-radius:8px}</style><main><img src="data:image/svg+xml;base64,${svgData}"><p>ENSŌ FORGE / QUINE SFX · ${state.fingerprint}</p><code>This self-contained art artifact contains no mnemonic, wallet key, or address. Use the packaged sitek-art-studio.xdc for the full offline webxdc.</code></main></html>`;
}

function downloadQuine() {
  const blob = new Blob([buildQuineHtml()], { type: "text/html" });
  const url = URL.createObjectURL(blob); const link = document.createElement("a");
  link.download = `enso-forge-${state.fingerprint.toLowerCase()}-quine.html`; link.href = url; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function sourceWordsForPoem() {
  const source = state.words.filter((word) => word.length > 2);
  return source.length ? source : ["silent", "mountain", "path", "moon", "rain", "stone", "light", "river"];
}

function lineFromPool(random, pool, target) {
  const wordCount = target >= 7 ? 4 : target >= 5 ? 3 : 2;
  const words = [];
  for (let i = 0; i < wordCount; i += 1) words.push(pool[Math.floor(random() * pool.length)]);
  return words.join(" ");
}

function findAnagramThread() {
  const groups = new Map();
  state.words.forEach((word) => {
    const key = word.toLowerCase().split("").sort().join("");
    if (word.length > 2) groups.set(key, [...(groups.get(key) || []), word]);
  });
  const exact = [...groups.values()].filter((group) => new Set(group).size > 1);
  if (exact.length) return exact.map((group) => group.join(" ↔ ")).join(" · ");
  if (!state.words.length) return "Enter a source to look for exact word anagrams.";
  const braid = state.words.slice(0, 4).reverse().join(" · ");
  return `No exact source anagrams · reverse braid: ${braid}`;
}

function renderPoetryMeta() {
  const formId = $("poemForm").value;
  const form = POETRY_FORMS[formId] || POETRY_FORMS.haiku;
  const seasonId = $("seasonSelect").value;
  const season = SEASONS.find((item) => item.id === seasonId) || SEASONS[0];
  $("poemFormLabel").textContent = form.label;
  $("poemMeter").textContent = form.short;
  $("poemDescription").textContent = form.description;
  $("seasonLabel").textContent = season.label;
  $("saijikiList").replaceChildren(...(SAIJIKI[seasonId] || []).map((word) => { const item = document.createElement("i"); item.textContent = word; return item; }));
  $("anagramOutput").textContent = findAnagramThread();
}

function renderPoem() {
  const formId = $("poemForm").value;
  const form = POETRY_FORMS[formId] || POETRY_FORMS.haiku;
  const seasonId = $("seasonSelect").value;
  const seasonal = SAIJIKI[seasonId] || SAIJIKI.autumn;
  const pool = [...new Set([...seasonal, ...sourceWordsForPoem()])];
  const random = makeRng(hashText(`poem|${toHex(state.seed)}|${state.variant}|${formId}|${seasonId}`));
  let body = "";
  let kicker = `${form.label} · ${form.short}`;
  if (formId === "saijiki") {
    body = `${seasonal.slice(0, 7).join(" · ")}\n\nseason index / ${seasonId}`;
    kicker = "SAIJIKI · KIGO INDEX";
  } else if (formId === "micro") {
    body = lineFromPool(random, pool, 7);
  } else if (formId === "haibun") {
    const prose = `After the ${seasonal[Math.floor(random() * seasonal.length)]}, the path keeps its quiet shape.`;
    body = `${prose}\n\n${form.lines.map((target) => lineFromPool(random, pool, target)).join("\n")}`;
    kicker = "HAIBUN · PROSE + HAIKU";
  } else if (formId === "haiga") {
    body = `${form.lines.map((target) => lineFromPool(random, pool, target)).join("\n")}\n\n[ image plane: ENSŌ / FORGE ]`;
    kicker = "HAIGA · POEM + IMAGE";
  } else if (formId === "renga") {
    body = `${form.lines.slice(0, 3).map((target) => lineFromPool(random, pool, target)).join("\n")}\n— link —\n${form.lines.slice(3).map((target) => lineFromPool(random, pool, target)).join("\n")}`;
    kicker = "RENGA · 3-LINE + 2-LINE LINK";
  } else {
    body = form.lines.map((target) => lineFromPool(random, pool, target)).join("\n");
  }
  const output = $("poemOutput");
  output.replaceChildren();
  const label = document.createElement("span"); label.className = "poem-kicker"; label.textContent = kicker;
  const poem = document.createElement("p"); poem.textContent = body;
  const footer = document.createElement("small"); footer.textContent = `${seasonId.toUpperCase()} / source ${state.words.length ? "linked" : "demo"} / target meter, editorial syllables`;
  output.append(label, poem, footer);
  $("poetryState").textContent = `${form.label} / ${seasonId.toUpperCase()}`;
  state.poem = { form: form.label, season: seasonId, text: body, kicker };
  renderPoetryMeta();
}

let magnetAnimation = 0;
function animateMagnet(time = 0) {
  const field = $("magnetField");
  const magnet = $("fridgeMagnet");
  if (!field || !magnet) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    magnet.style.left = "18px"; magnet.style.top = "42px"; return;
  }
  const width = Math.max(0, field.clientWidth - magnet.offsetWidth - 12);
  const height = Math.max(0, field.clientHeight - magnet.offsetHeight - 12);
  const x = 8 + (Math.sin(time / 2300) * .5 + .5) * width;
  const y = 35 + (Math.cos(time / 2900) * .5 + .5) * Math.max(0, height - 35);
  magnet.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${Math.sin(time / 1700) * 7 - 4}deg)`;
  magnetAnimation = requestAnimationFrame(animateMagnet);
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

function renderDerivationPaths() {
  const paths = $("derivationPaths");
  if (paths) paths.hidden = !state.analysis?.ok;
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
  $("inkLoadValue").textContent = String(state.inkLoad).padStart(2, "0");
  $("brushSizeValue").textContent = String(state.brush).padStart(2, "0");
  $("roughnessValue").textContent = String(state.roughness).padStart(2, "0");
  $("openingValue").textContent = `${state.opening}°`;
  $("batchSizeValue").textContent = String(state.batchSize).padStart(2, "0");
  $("fluidDensityValue").textContent = String(state.fluidDensity).padStart(2, "0");
  $("fiberGrainValue").textContent = String(state.fiberGrain).padStart(2, "0");
  $("bristleSplitValue").textContent = String(state.bristleSplit).padStart(2, "0");
  $("rotationValue").textContent = `${state.rotation}°`;
  $("guidesButton").textContent = state.guides ? "GUIDES ON" : "GUIDES OFF";
  $("guidesButton").setAttribute("aria-pressed", String(state.guides));
  $("collectibleSeedId").textContent = state.fingerprint;
  $("solverSummary").textContent = state.solvers.length ? `${state.solvers.length} EVALUATED` : `${SOLVERS.length} MAPPINGS`;
  $("mintBatchValue").textContent = `${state.batchSize} ASSET${state.batchSize === 1 ? "" : "S"}`;
  renderSolvers();
  renderMatchState();
}

function syncForgeControls() {
  const ranges = [
    ["inkLoadRange", state.inkLoad], ["brushSizeRange", state.brush], ["roughnessRange", state.roughness],
    ["openingRange", state.opening], ["fluidDensityRange", state.fluidDensity], ["fiberGrainRange", state.fiberGrain],
    ["bristleSplitRange", state.bristleSplit], ["batchSizeRange", state.batchSize], ["rotationRange", state.rotation],
  ];
  ranges.forEach(([id, value]) => { if ($(id)) $(id).value = String(value); });
  if ($("strokeDirection")) $("strokeDirection").value = state.strokeDirection;
  if ($("paperHue")) $("paperHue").value = state.paperHue;
  if ($("aspectProportion")) $("aspectProportion").value = state.aspect;
  if ($("dynamicMode")) $("dynamicMode").value = state.dynamic;
  if ($("hankoStyle")) $("hankoStyle").value = state.hanko;
  if ($("hankoText")) $("hankoText").value = state.hankoText;
  if ($("hankoColor")) $("hankoColor").value = state.hankoColor;
  if ($("mintCoin")) $("mintCoin").value = state.coin;
  if ($("foilTreatment")) $("foilTreatment").value = state.foil;
  if ($("cardTitle")) $("cardTitle").value = state.cardTitle;
  document.querySelectorAll("[data-palette]").forEach((button) => button.classList.toggle("active", button.dataset.palette === state.palette));
}

function renderAll() {
  renderMetrics();
  renderWordDiagnostics();
  renderDerivationPaths();
  syncForgeControls();
  drawEnso();
  drawKeyField();
  drawBitTape();
  drawCoinGeometry();
  renderPoem();
  renderMintMeta();
  drawMintCard();
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
  if (panelId === "viewerPanel") { drawKeyField(); drawBitTape(); drawCoinGeometry(); }
  else hideViewerTooltip();
  if (panelId === "forgePanel") drawEnso();
  if (panelId === "mintPanel") { renderMintMeta(); drawMintCard(); renderGallery(); }
  if (panelId === "poetryPanel") { renderPoetryMeta(); }
}

const TAB_IDS = { forgePanel: "forgeTab", viewerPanel: "viewerTab", validatorPanel: "validatorTab", catalogPanel: "catalogTab", poetryPanel: "poetryTab", mintPanel: "mintTab" };
const PANEL_KEYS = ["forgePanel", "viewerPanel", "validatorPanel", "catalogPanel", "poetryPanel", "mintPanel"];

document.querySelectorAll(".studio-tab").forEach((button) => {
  button.id = TAB_IDS[button.dataset.panel];
  button.addEventListener("click", () => setPanel(button.dataset.panel));
});

document.addEventListener("keydown", (event) => {
  if (["TEXTAREA", "INPUT", "BUTTON"].includes(event.target?.tagName)) return;
  const index = Number(event.key) - 1;
  if (index >= 0 && index < PANEL_KEYS.length) setPanel(PANEL_KEYS[index]);
  if (event.key.toLowerCase() === "f") { state.variant = (state.variant + 1) % 100; renderMetrics(); drawEnso(); }
});

async function randomizeForge() {
  const seed = new Uint8Array(16);
  try { crypto.getRandomValues(seed); } catch { seed.forEach((_, index) => { seed[index] = randomInt(256); }); }
  state.seed = seed;
  state.words = [];
  state.analysis = null;
  state.solvers = [];
  state.variant = 0;
  state.palette = ["mineral", "ember", "moon"][randomInt(3)];
  state.brush = 1 + randomInt(10);
  state.inkLoad = 1 + randomInt(10);
  state.roughness = randomInt(101);
  state.opening = 4 + randomInt(45);
  state.fluidDensity = 1 + randomInt(5);
  state.fiberGrain = randomInt(6);
  state.bristleSplit = randomInt(6);
  state.strokeDirection = randomInt(2) ? "ccw" : "cw";
  state.paperHue = Object.keys(PAPER_HUES)[randomInt(Object.keys(PAPER_HUES).length)];
  state.aspect = ["organic", "equal", "wide", "tall"][randomInt(4)];
  state.dynamic = ["calm", "balanced", "wild"][randomInt(3)];
  state.hanko = ["slate", "vermilion", "indigo"][randomInt(3)];
  state.hankoText = "印";
  state.hankoColor = HANKO_STYLES[state.hanko].color;
  state.batchSize = 1 + randomInt(10);
  state.rotation = randomInt(360);
  $("studioInput").value = "";
  $("sourceHint").textContent = "Random art seed created · no mnemonic source loaded.";
  renderStatus("ready", "RANDOM SEED", "Configuration randomized locally. This is an art seed, not a wallet seed.");
  await refreshFingerprint();
  renderAll();
}

function bindForgeControls() {
  const ranges = [
    ["inkLoadRange", "inkLoad", (value) => String(value).padStart(2, "0")],
    ["brushSizeRange", "brush", (value) => String(value).padStart(2, "0")],
    ["roughnessRange", "roughness", (value) => String(value).padStart(2, "0")],
    ["openingRange", "opening", (value) => `${value}°`],
    ["batchSizeRange", "batchSize", (value) => String(value).padStart(2, "0")],
    ["fluidDensityRange", "fluidDensity", (value) => String(value).padStart(2, "0")],
    ["fiberGrainRange", "fiberGrain", (value) => String(value).padStart(2, "0")],
    ["bristleSplitRange", "bristleSplit", (value) => String(value).padStart(2, "0")],
    ["rotationRange", "rotation", (value) => `${value}°`],
  ];
  ranges.forEach(([id, key, format]) => {
    $(id).addEventListener("input", (event) => {
      state[key] = Number(event.target.value);
      const valueId = id.replace("Range", "Value");
      if ($(valueId)) $(valueId).textContent = format(state[key]);
      drawEnso();
      renderMetrics();
    });
  });
  [["strokeDirection", "strokeDirection"], ["paperHue", "paperHue"], ["aspectProportion", "aspect"], ["dynamicMode", "dynamic"], ["hankoStyle", "hanko"]].forEach(([id, key]) => {
    $(id).addEventListener("change", (event) => { state[key] = event.target.value; renderAll(); });
  });
  $("hankoText").addEventListener("input", (event) => { state.hankoText = event.target.value; drawEnso(); });
  $("hankoColor").addEventListener("input", (event) => { state.hankoColor = event.target.value; drawEnso(); });
  $("randomizeButton").addEventListener("click", randomizeForge);
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
    state.inkLoad = DEFAULT_FORGE.inkLoad;
    state.roughness = DEFAULT_FORGE.roughness;
    state.opening = DEFAULT_FORGE.opening;
    state.fluidDensity = DEFAULT_FORGE.fluidDensity;
    state.fiberGrain = DEFAULT_FORGE.fiberGrain;
    state.bristleSplit = DEFAULT_FORGE.bristleSplit;
    state.strokeDirection = DEFAULT_FORGE.strokeDirection;
    state.paperHue = DEFAULT_FORGE.paperHue;
    state.aspect = DEFAULT_FORGE.aspect;
    state.dynamic = DEFAULT_FORGE.dynamic;
    state.hanko = DEFAULT_FORGE.hanko;
    state.hankoText = DEFAULT_FORGE.hankoText;
    state.hankoColor = DEFAULT_FORGE.hankoColor;
    state.batchSize = DEFAULT_FORGE.batchSize;
    state.rotation = DEFAULT_FORGE.rotation;
    state.variant = DEFAULT_FORGE.variant;
    state.guides = DEFAULT_FORGE.guides;
    state.coin = DEFAULT_FORGE.coin;
    state.foil = DEFAULT_FORGE.foil;
    state.cardTitle = DEFAULT_FORGE.cardTitle;
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

function bindCatalog() {
  $("catalogFilter").addEventListener("change", renderCatalog);
  $("catalogSearch").addEventListener("input", renderCatalog);
  renderCatalog();
}

function bindCoinControls() {
  $("coinControls").addEventListener("click", (event) => {
    const button = event.target.closest("[data-coin]");
    if (!button || !COIN_MODELS[button.dataset.coin]) return;
    state.coin = button.dataset.coin;
    drawCoinGeometry();
    drawMintCard();
  });
}

function bindPoetry() {
  $("poemForm").addEventListener("change", renderPoem);
  $("seasonSelect").addEventListener("change", renderPoem);
  $("generatePoemButton").addEventListener("click", renderPoem);
  renderPoem();
  magnetAnimation = requestAnimationFrame(animateMagnet);
}

function bindMint() {
  $("cardTitle").addEventListener("input", (event) => { state.cardTitle = event.target.value; drawMintCard(); });
  $("mintCoin").addEventListener("change", (event) => { state.coin = event.target.value; drawCoinGeometry(); renderMintMeta(); drawMintCard(); });
  $("foilTreatment").addEventListener("change", (event) => { state.foil = event.target.value; renderMintMeta(); drawMintCard(); });
  $("mintButton").addEventListener("click", mintCollectible);
  $("poeticMintButton").addEventListener("click", () => { setPanel("mintPanel"); mintCollectible(); });
  $("mintPngButton").addEventListener("click", () => {
    const link = document.createElement("a"); link.download = `enso-card-${state.fingerprint.toLowerCase()}-v${String(state.variant).padStart(2, "0")}.png`; link.href = $("mintCanvas").toDataURL("image/png"); link.click();
  });
  $("mintShareButton").addEventListener("click", shareCard);
  $("shareButton").addEventListener("click", shareCard);
  $("quineButton").addEventListener("click", downloadQuine);
  $("clearGalleryButton").addEventListener("click", async () => {
    if (!state.gallery.length || window.confirm("Clear the local Art Studio gallery?")) { await clearGallery(); state.gallery = []; renderGallery(); }
  });
  loadGallery();
}

async function validateStudio() {
  const run = ++validationId;
  const words = parsePhrase($("studioInput").value);
  state.words = words;
  state.analysis = null;
  state.solvers = [];
  state.variant = DEFAULT_FORGE.variant;
  renderMetrics();
  renderWordDiagnostics();
  if (!words.length) {
    state.seed = new Uint8Array(DEMO_SEED);
    state.fingerprint = "003F6B0F";
    renderStatus("ready", "READY", "Waiting for a phrase to enter the studio.");
    renderAll();
    return;
  }
  renderStatus("pending", "CHECKING", "Reading the wordlist and rebuilding the encoded bits…");
  const bits = wordCountToEntropyBits(words.length);
  if (!bits) {
    state.seed = seedFromInput(words, null);
    state.fingerprint = toHex(hashText(`draft|${toHex(state.seed)}`), 4).toUpperCase();
    renderStatus("invalid", "INVALID LENGTH", `${countLabel(words.length)} entered · use 12, 15, 18, 21, or 24 words.`);
    renderAll();
    return;
  }
  const unknown = words.filter((word) => !INDEX.has(word));
  if (unknown.length) {
    state.seed = seedFromInput(words, null);
    state.fingerprint = toHex(hashText(`draft|${toHex(state.seed)}`), 4).toUpperCase();
    renderStatus("invalid", "UNKNOWN WORD", `${unknown.length} word${unknown.length === 1 ? "" : "s"} not in the English BIP-39 list.`);
    renderAll();
    return;
  }
  try {
    const analysis = await mnemonicToEntropy(words);
    if (run !== validationId) return;
    state.analysis = analysis;
    state.seed = seedFromInput(words, analysis);
    state.fingerprint = await fingerprintFor(state.seed);
    state.solvers = analysis.ok ? await evaluateSolvers() : [];
    if (run !== validationId) return;
    renderStatus(analysis.ok ? "valid" : "invalid", analysis.ok ? "VALID MNEMONIC" : "CHECKSUM MISMATCH", analysis.ok ? `${words.length} words · ${analysis.entropyBits}-bit entropy · ready to forge.` : "All words are recognized, but the SHA-256 checksum does not match.");
    renderAll();
  } catch (error) {
    if (run !== validationId) return;
    state.seed = seedFromInput(words, null);
    state.fingerprint = toHex(hashText(`draft|${toHex(state.seed)}`), 4).toUpperCase();
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

function escapeXml(value) {
  return String(value).replace(/[<>&'"]/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", "\"": "&quot;" })[character]);
}

function svgForArt() {
  const palette = currentPalette();
  const paper = PAPER_HUES[state.paperHue] || PAPER_HUES.cyan;
  const paths = state.art?.paths || [];
  const splatters = state.art?.splatters || [];
  const aspect = aspectScale();
  const pathMarkup = paths.map((path, pass) => {
    const d = path.map((point, i) => `${i ? "L" : "M"}${(450 + point.x * 620).toFixed(2)} ${(310 + point.y * 620 * aspect).toFixed(2)}`).join(" ");
    const opacity = Math.min(1, Number(palette.strokeAlpha[pass % palette.strokeAlpha.length]) * (.55 + Number(state.inkLoad) * .065));
    const color = palette.strokes[pass % palette.strokes.length];
    const width = Math.max(2, 7 + Number(state.brush) * 1.3 - pass * 1.15);
    return `<path d="${d}" fill="none" stroke="${color}" stroke-opacity="${opacity.toFixed(2)}" stroke-width="${width.toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }).join("");
  const dots = splatters.map((dot) => `<circle cx="${(450 + dot.x * 620).toFixed(2)}" cy="${(310 + dot.y * 620 * aspect).toFixed(2)}" r="${(dot.r * 620).toFixed(2)}" fill="${palette.splatter}" fill-opacity="${dot.a.toFixed(2)}"/>`).join("");
  const guide = state.guides ? `<g fill="none" stroke="${palette.guide}" stroke-width="1">${[.28, .38, .48, .58].map((radius) => `<ellipse cx="450" cy="310" rx="${(radius * 620).toFixed(1)}" ry="${(radius * 620 * aspect).toFixed(1)}"/>`).join("")}</g>` : "";
  const hanko = HANKO_STYLES[state.hanko] || HANKO_STYLES.slate;
  const sealColor = state.hanko === "custom" ? state.hankoColor : hanko.color;
  const sealGlyph = escapeXml(state.hanko === "custom" ? (state.hankoText.trim() || "印") : hanko.glyph).slice(0, 4);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="620" viewBox="0 0 900 620"><defs><radialGradient id="bg"><stop stop-color="${paper.hex}" stop-opacity=".2"/><stop offset=".34" stop-color="${palette.background[0]}"/><stop offset=".64" stop-color="${palette.background[1]}"/><stop offset="1" stop-color="${palette.background[2]}"/></radialGradient></defs><rect width="900" height="620" fill="url(#bg)"/>${guide}${pathMarkup}${dots}<g transform="translate(842 548) rotate(-5)" stroke="${sealColor}" fill="${sealColor}" fill-opacity=".1"><rect x="-28" y="-28" width="56" height="56"/><text x="0" y="4" text-anchor="middle" fill="${sealColor}" fill-opacity="1" stroke="none" font-family="sans-serif" font-size="22">${sealGlyph}</text></g><text x="18" y="602" fill="${palette.labelColor}" fill-opacity=".55" font-family="monospace" font-size="11">ENSO / FORGE · V${String(state.variant).padStart(2, "0")}</text></svg>`;
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
bindCatalog();
bindCoinControls();
bindPoetry();
bindMint();
renderAll();
