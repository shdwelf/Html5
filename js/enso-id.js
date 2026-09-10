// Packed Ensō ID + deterministic brushstroke.
// Ported from shdwelf/bip39-haiku-workbench (src/lib/enso.ts, src/lib/rng.ts).

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashStr(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const FIELDS = [
  ["inkLoad", 1, 8],
  ["direction", 0, 1],
  ["paperHue", 0, 359],
  ["brushSize", 1, 12],
  ["inkDensity", 1, 9],
  ["stretch", 0, 4],
  ["paperTexture", 0, 9],
  ["bristleDensity", 1, 9],
  ["signatureStyle", 0, 1],
  ["brushstrokeSize", 0, 2],
  ["startRotation", 0, 359],
  ["seed", 0, 65535],
];

export const HUE_NAMES = [
  { name: "Crimson", hue: 348 },
  { name: "Amber", hue: 38 },
  { name: "Gold", hue: 50 },
  { name: "Jade", hue: 150 },
  { name: "Cyan", hue: 180 },
  { name: "Azure", hue: 210 },
  { name: "Indigo", hue: 245 },
  { name: "Violet", hue: 280 },
  { name: "Sumi (black)", hue: 0 },
];

export const STRETCH_NAMES = ["Equal", "Slight", "Moderate", "Unequal", "Extreme"];
export const STROKE_SIZE_NAMES = ["Small", "Medium", "Large"];

export const DEFAULT_SETTINGS = {
  inkLoad: 4,
  direction: 0,
  paperHue: 180,
  brushSize: 6,
  inkDensity: 3,
  stretch: 3,
  paperTexture: 4,
  bristleDensity: 5,
  signatureStyle: 0,
  brushstrokeSize: 1,
  startRotation: 216,
  seed: 1337,
};

export function encodeEnsoId(s) {
  let acc = 0n;
  for (const [key, min, max] of FIELDS) {
    const range = BigInt(max - min + 1);
    const v = Math.max(min, Math.min(max, Math.round(s[key])));
    acc = acc * range + BigInt(v - min);
  }
  const str = acc.toString(36).toUpperCase();
  const cs = (hashStr(str) % 36).toString(36).toUpperCase();
  return "EN" + cs + str;
}

function parseInt36(str) {
  let acc = 0n;
  for (const ch of str) {
    const d = parseInt(ch, 36);
    if (Number.isNaN(d)) throw new Error("bad");
    acc = acc * 36n + BigInt(d);
  }
  return acc;
}

export function decodeEnsoId(id) {
  try {
    const m = String(id || "").trim().toUpperCase();
    if (!m.startsWith("EN")) return null;
    const body = m.slice(3);
    let acc = parseInt36(body);
    const out = {};
    for (let i = FIELDS.length - 1; i >= 0; i--) {
      const [key, min, max] = FIELDS[i];
      const range = BigInt(max - min + 1);
      out[key] = Number(acc % range) + min;
      acc = acc / range;
    }
    return out;
  } catch {
    return null;
  }
}

export function prettyId(id) {
  return String(id).replace(/(.{4})/g, "$1-").replace(/-$/, "");
}

export function randomSettings(seed) {
  const s = (seed ?? Math.random() * 0xffffffff) >>> 0;
  const r = mulberry32(s);
  const pick = (min, max) => min + Math.floor(r() * (max - min + 1));
  return {
    inkLoad: pick(1, 8),
    direction: pick(0, 1),
    paperHue: HUE_NAMES[pick(0, HUE_NAMES.length - 1)].hue,
    brushSize: pick(1, 12),
    inkDensity: pick(1, 9),
    stretch: pick(0, 4),
    paperTexture: pick(0, 9),
    bristleDensity: pick(1, 9),
    signatureStyle: pick(0, 1),
    brushstrokeSize: pick(0, 2),
    startRotation: pick(0, 359),
    seed: pick(0, 65535),
  };
}

function withAlpha(hsl, a) {
  return hsl.replace("hsl(", "hsla(").replace(")", `, ${a.toFixed(3)})`);
}

export function drawEnso(canvas, s) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const W = canvas.width;
  const H = canvas.height;
  const r = mulberry32((s.seed << 8) ^ hashStr(encodeEnsoId(s)));

  const light = s.signatureStyle === 0 ? 96 : 14;
  ctx.fillStyle = `hsl(${s.paperHue}, 18%, ${light}%)`;
  ctx.fillRect(0, 0, W, H);

  const speckles = s.paperTexture * 1200;
  for (let i = 0; i < speckles; i++) {
    const x = r() * W;
    const y = r() * H;
    const a = r() * 0.05 * (s.paperTexture / 9 + 0.2);
    ctx.fillStyle = s.signatureStyle === 0 ? `rgba(0,0,0,${a})` : `rgba(255,255,255,${a})`;
    ctx.fillRect(x, y, 1.4, 1.4);
  }

  const cx = W / 2;
  const cy = H / 2;
  const baseR = Math.min(W, H) * 0.32;
  const stretchAmt = s.stretch * 0.06;
  const sx = 1 + stretchAmt * (r() > 0.5 ? 1 : -1);
  const sy = 1 - stretchAmt * (r() > 0.5 ? 1 : -1);
  const inkColor = s.signatureStyle === 0
    ? `hsl(${s.paperHue}, 30%, 8%)`
    : `hsl(${s.paperHue}, 40%, 92%)`;
  const dir = s.direction === 0 ? 1 : -1;
  const start = (s.startRotation * Math.PI) / 180;
  const sweep = Math.PI * (2 - 0.18 - r() * 0.12);
  const segments = 520;
  const noiseN = 8 + s.bristleDensity;
  const amps = [];
  const phs = [];
  for (let k = 0; k < noiseN; k++) {
    amps.push((r() - 0.5) * (baseR * 0.10) * (s.stretch / 4 + 0.4));
    phs.push(r() * Math.PI * 2);
  }
  const radialNoise = (t) => {
    let v = 0;
    for (let k = 0; k < noiseN; k++) v += amps[k] * Math.sin((k + 1) * t + phs[k]);
    return v;
  };
  const maxWidth = s.brushSize * (s.brushstrokeSize === 0 ? 2.2 : s.brushstrokeSize === 1 ? 3.4 : 5);
  const bristleCount = Math.max(3, s.bristleDensity * 3);

  for (let b = 0; b < bristleCount; b++) {
    const off = (b / bristleCount - 0.5) * maxWidth;
    const jitter = (r() - 0.5) * 2;
    ctx.beginPath();
    for (let i = 0; i <= segments; i++) {
      const tt = i / segments;
      const ang = start + dir * sweep * tt;
      const rr = baseR + radialNoise(ang) + off + jitter * Math.sin(tt * 30 + b);
      const x = cx + Math.cos(ang) * rr * sx;
      const y = cy + Math.sin(ang) * rr * sy;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    const baseAlpha = Math.min(1, 0.12 + s.inkDensity * 0.09);
    const dryout = 1 - (b / bristleCount) * 0.4;
    ctx.strokeStyle = withAlpha(inkColor, baseAlpha * dryout * Math.min(1, s.inkLoad / 4));
    ctx.lineWidth = Math.max(0.6, (maxWidth / bristleCount) * (0.8 + r() * 0.6));
    ctx.lineCap = "round";
    ctx.stroke();
  }

  const splat = Math.round(s.inkLoad * 6);
  const sR = baseR + radialNoise(start);
  const sxp = cx + Math.cos(start) * sR * sx;
  const syp = cy + Math.sin(start) * sR * sy;
  for (let i = 0; i < splat; i++) {
    const a = r() * Math.PI * 2;
    const d = r() * maxWidth * 1.6;
    ctx.beginPath();
    ctx.arc(sxp + Math.cos(a) * d, syp + Math.sin(a) * d, r() * 2 + 0.4, 0, Math.PI * 2);
    ctx.fillStyle = withAlpha(inkColor, 0.5 * (s.inkLoad / 8));
    ctx.fill();
  }
}

export function settingsSummary(s) {
  const hueName = HUE_NAMES.reduce((best, h) =>
    Math.abs(h.hue - s.paperHue) < Math.abs(best.hue - s.paperHue) ? h : best
  );
  return [
    ["Ink Load", String(s.inkLoad)],
    ["Direction", s.direction === 0 ? "Clockwise" : "Counter-Clockwise"],
    ["Paper Hue", `${hueName.name} (${s.paperHue}°)`],
    ["Brush Size", String(s.brushSize)],
    ["Ink Density", String(s.inkDensity)],
    ["X/Y Stretch", STRETCH_NAMES[s.stretch]],
    ["Paper Texture", String(s.paperTexture)],
    ["Bristle Density", String(s.bristleDensity)],
    ["Signature Style", s.signatureStyle === 0 ? "Dark" : "Light"],
    ["Brushstroke Size", STROKE_SIZE_NAMES[s.brushstrokeSize]],
    ["Brushstroke Start", `${s.startRotation}°`],
  ];
}
