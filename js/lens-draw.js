/**
 * lens-draw.js — 2-D canvas renderers, one per formal-system lens.
 *
 * Depends only on the canvas 2-D API: no WebGL, no DOM beyond the canvas
 * element itself, so the drawing paths are unit-testable with a stub context.
 */

import { curveTable, prefixBits } from "./spacefill.js";
import {
  differentialProfile,
  integralProfile,
  fractionalDerivative,
  influenceMatrix,
  gramMatrix,
  eigenSymmetric,
  reachabilityFixpoint,
  truthTable,
  wellFormedAtoms,
  umbralProfile,
  eventReport,
  durationReport,
  stochasticForecast,
  itoReport,
  piReport,
  ltsReport,
  mobius,
  binomBig,
  log10Big,
  popcountBytes,
  xorBytes,
  fmtBig,
  bitMatrix,
  gf2Rank,
  cross3,
  quatFromBytes,
  quatMul,
  quatNorm,
  gradeDims,
  tensorGraded,
  symmetricGraded,
  sigmaAtoms,
  flipGraph,
} from "./formal.js";

export const C = {
  bg: "#05070c",
  grid: "#163246",
  faint: "#0f1a24",
  accent: "#5ce1ff",
  ok: "#3dffb0",
  warn: "#ffb020",
  bad: "#ff5d6c",
  muted: "#8aa0b8",
  text: "#e8f1ff",
};

const MONO = '10px ui-monospace, "SF Mono", Menlo, monospace';

export function prep(canvas, w = 340, h = 172) {
  const dpr = Math.min(2, (typeof devicePixelRatio === "number" && devicePixelRatio) || 1);
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
  ctx.font = MONO;
  ctx.textBaseline = "top";
  return ctx;
}

function text(ctx, s, x, y, color = C.muted, size = 10) {
  ctx.fillStyle = color;
  ctx.font = `${size}px ui-monospace, monospace`;
  ctx.fillText(s, x, y);
}

function grid(ctx, w, h, pad, cols = 8, rows = 4) {
  ctx.strokeStyle = C.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= cols; i++) {
    const x = pad.l + ((w - pad.l - pad.r) * i) / cols;
    ctx.beginPath();
    ctx.moveTo(x, pad.t);
    ctx.lineTo(x, h - pad.b);
    ctx.stroke();
  }
  for (let j = 0; j <= rows; j++) {
    const y = pad.t + ((h - pad.t - pad.b) * j) / rows;
    ctx.beginPath();
    ctx.moveTo(pad.l, y);
    ctx.lineTo(w - pad.r, y);
    ctx.stroke();
  }
}

/** Generic multi-series line/area chart over normalised x. */
export function plot(ctx, w, h, { series, pad = { l: 34, r: 8, t: 12, b: 16 }, yLog = false, yMin, yMax, marks = [] }) {
  grid(ctx, w, h, pad);
  const all = series.flatMap((s) => s.data).filter((v) => isFinite(v));
  if (!all.length) return;
  let lo = yMin ?? Math.min(...all);
  let hi = yMax ?? Math.max(...all);
  if (yLog) {
    lo = Math.log10(Math.max(lo, 1e-12));
    hi = Math.log10(Math.max(hi, 1e-11));
  }
  if (hi === lo) hi = lo + 1;
  const map = (v) => (yLog ? Math.log10(Math.max(v, 1e-12)) : v);
  const X = (i, n) => pad.l + ((w - pad.l - pad.r) * i) / Math.max(1, n - 1);
  const Y = (v) => pad.t + (h - pad.t - pad.b) * (1 - (map(v) - lo) / (hi - lo));
  for (const s of series) {
    const n = s.data.length;
    ctx.beginPath();
    s.data.forEach((v, i) => {
      const x = X(i, n);
      const y = Y(v);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    if (s.fill) {
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.lineTo(X(n - 1, n), h - pad.b);
      ctx.lineTo(X(0, n), h - pad.b);
      ctx.closePath();
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = s.color;
      ctx.fill();
      ctx.globalAlpha = 1;
    } else {
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
    if (s.label) text(ctx, s.label, pad.l + 4, pad.t + 2 + series.indexOf(s) * 11, s.color);
  }
  for (const m of marks) {
    const x = X(m.at, series[0].data.length);
    ctx.strokeStyle = C.warn;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(x, pad.t);
    ctx.lineTo(x, h - pad.b);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  text(ctx, fmtAxis(yLog ? 10 ** hi : hi), w - pad.r - 46, pad.t + 1, C.muted);
  text(ctx, fmtAxis(yLog ? 10 ** lo : lo), w - pad.r - 46, h - pad.b - 11, C.muted);
}

function fmtAxis(v) {
  if (!isFinite(v)) return "∞";
  if (Math.abs(v) >= 10000 || (v !== 0 && Math.abs(v) < 0.001)) return v.toExponential(1);
  return Number(v.toFixed(3)).toString();
}

/* NB: parameter names must not collide with Object.prototype members
   (valueOf/toString/…) — an inherited property silently defeats the default. */
export function bars(ctx, w, h, { items, pad = { l: 30, r: 8, t: 14, b: 20 }, yLog = false, val = (d) => d.v, lab = (d) => d.label }) {
  grid(ctx, w, h, pad, Math.max(2, items.length - 1), 4);
  const vals = items.map(val);
  const raw = (yLog ? vals.map((v) => Math.log10(Math.max(v, 1e-9))) : vals).map((v) =>
    Number.isFinite(v) ? v : 0
  );
  const hi = Math.max(...raw, 1e-9);
  const lo = Math.min(...raw, 0);
  const span = hi - lo || 1;
  const bw = (w - pad.l - pad.r) / items.length;
  items.forEach((d, i) => {
    const raw0 = yLog ? Math.log10(Math.max(val(d), 1e-9)) : val(d);
    const v = Number.isFinite(raw0) ? raw0 : 0;
    const bh = ((v - lo) / span) * (h - pad.t - pad.b);
    const x = pad.l + i * bw;
    ctx.fillStyle = d.color || C.accent;
    ctx.fillRect(x + bw * 0.18, h - pad.b - bh, bw * 0.64, Math.max(1, bh));
    text(ctx, lab(d), x + 2, h - pad.b + 4, C.muted, 9);
    text(ctx, d.tag ?? fmtAxis(val(d)), x + 2, h - pad.b - bh - 11, C.text, 9);
  });
}

export function heat(ctx, w, h, { rows, cols, values, max, pad = { l: 6, r: 6, t: 6, b: 6 }, tint = [92, 225, 255] }) {
  const cw = (w - pad.l - pad.r) / cols;
  const ch = (h - pad.t - pad.b) / rows;
  const peak = max ?? Math.max(...values, 1e-9);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const v = values[r * cols + c] ?? 0;
      const a = peak ? Math.min(1, v / peak) : 0;
      ctx.fillStyle = `rgba(${tint[0]},${tint[1]},${tint[2]},${0.06 + a * 0.94})`;
      ctx.fillRect(pad.l + c * cw, pad.t + r * ch, Math.max(1, cw - 0.6), Math.max(1, ch - 0.6));
    }
  }
}

export function tree(ctx, w, h, node, pad = 10) {
  const levels = [];
  (function walk(n, d) {
    (levels[d] ||= []).push(n);
    (n.children || []).forEach((c) => walk(c, d + 1));
  })(node, 0);
  const lh = (h - pad * 2) / levels.length;
  levels.forEach((row, d) => {
    row.forEach((n, i) => {
      const x = pad + ((w - pad * 2) * (i + 0.5)) / row.length;
      const y = pad + d * lh + lh / 2;
      n._x = x;
      n._y = y;
    });
  });
  ctx.strokeStyle = C.grid;
  levels.forEach((row) => {
    row.forEach((n) => {
      (n.children || []).forEach((c) => {
        ctx.beginPath();
        ctx.moveTo(n._x, n._y + 8);
        ctx.lineTo(c._x, c._y - 8);
        ctx.stroke();
      });
    });
  });
  levels.forEach((row) => {
    row.forEach((n) => {
      const label = n.label.length > 26 ? `${n.label.slice(0, 24)}…` : n.label;
      const tw = ctx.measureText(label).width + 10;
      ctx.fillStyle = n.ok ? "#0d2a22" : "#2a0f14";
      ctx.strokeStyle = n.ok ? C.ok : C.bad;
      ctx.beginPath();
      ctx.rect(n._x - tw / 2, n._y - 8, tw, 16);
      ctx.fill();
      ctx.stroke();
      text(ctx, label, n._x - tw / 2 + 5, n._y - 5, n.ok ? C.ok : C.bad, 9);
      if (n.rule) text(ctx, n.rule, n._x - tw / 2, n._y + 9, C.muted, 8);
    });
  });
}

export function table(ctx, w, h, { head, rows, pad = 8, highlight = -1 }) {
  const cols = head.length;
  const cw = (w - pad * 2) / cols;
  const rh = Math.min(16, (h - pad * 2) / (rows.length + 1));
  head.forEach((hd, i) => text(ctx, hd, pad + i * cw + 3, pad, C.muted, 9));
  ctx.strokeStyle = C.grid;
  ctx.beginPath();
  ctx.moveTo(pad, pad + rh - 3);
  ctx.lineTo(w - pad, pad + rh - 3);
  ctx.stroke();
  rows.forEach((r, ri) => {
    const y = pad + rh * (ri + 1);
    if (ri === highlight) {
      ctx.fillStyle = "rgba(61,255,176,0.10)";
      ctx.fillRect(pad, y - 2, w - pad * 2, rh);
    }
    r.forEach((cell, ci) => {
      const s = String(cell);
      text(ctx, s.length > 22 ? `${s.slice(0, 20)}…` : s, pad + ci * cw + 3, y, ri === highlight ? C.ok : C.text, 9);
    });
  });
}

export function chain(ctx, w, h, { items, pad = 10 }) {
  const n = items.length;
  const bw = Math.min(74, (w - pad * 2) / n);
  const y = h / 2;
  items.forEach((it, i) => {
    const x = pad + i * ((w - pad * 2) / n);
    ctx.strokeStyle = C.grid;
    ctx.fillStyle = "#0d1c28";
    ctx.beginPath();
    ctx.rect(x, y - 14, bw - 6, 28);
    ctx.fill();
    ctx.stroke();
    const label = it.label ?? String(it);
    text(ctx, label.length > 12 ? `${label.slice(0, 11)}…` : label, x + 4, y - 5, it.color || C.accent, 9);
    if (it.sub) text(ctx, it.sub, x + 4, y + 5, C.muted, 8);
    if (i < n - 1) {
      ctx.strokeStyle = C.ok;
      ctx.beginPath();
      ctx.moveTo(x + bw - 6, y);
      ctx.lineTo(x + (w - pad * 2) / n, y);
      ctx.stroke();
    }
  });
}

/* ------------------------------------------------------------------ *
 * invert-keyspace slice view (top 14 entropy bits on a Hilbert grid)
 * ------------------------------------------------------------------ */

function sliceFrame(ctx, w, h) {
  const n = 128;
  const pad = 6;
  const size = Math.min(w, h) - pad * 2;
  const ox = (w - size) / 2;
  const oy = (h - size) / 2;
  const { xs, ys } = curveTable("hilbert", 7);
  ctx.fillStyle = C.faint;
  ctx.fillRect(ox, oy, size, size);
  // coarse index shading: colour each cell by its position on the curve
  const step = 8;
  for (let i = 0; i < n * n; i += step) {
    const t = i / (n * n);
    ctx.fillStyle = `rgba(22,50,70,${0.25 + t * 0.5})`;
    ctx.fillRect(ox + (xs[i] / n) * size, oy + (ys[i] / n) * size, size / n, size / n);
  }
  ctx.strokeStyle = C.grid;
  for (let g = 1; g < 8; g++) {
    const p = (g / 8) * size;
    ctx.beginPath();
    ctx.moveTo(ox + p, oy);
    ctx.lineTo(ox + p, oy + size);
    ctx.moveTo(ox, oy + p);
    ctx.lineTo(ox + size, oy + p);
    ctx.stroke();
  }
  return { n, xs, ys, ox, oy, size };
}

function cellOf(frame, entropy) {
  const idx = prefixBits(entropy, 14);
  return {
    x: frame.ox + (frame.xs[idx] / frame.n) * frame.size,
    y: frame.oy + (frame.ys[idx] / frame.n) * frame.size,
    idx,
  };
}

function marker(ctx, p, color, label, size = 5) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
  ctx.fill();
  if (label) text(ctx, label, p.x + size + 2, p.y - 5, color, 9);
}

/** Flip the differing prefix bits one at a time: the projected geodesic. */
function projectedGeodesic(A, B, limit = 14) {
  const bitsA = [...A];
  const diffs = [];
  const n = Math.min(A.length, B.length);
  for (let byte = 0; byte < n; byte++) {
    for (let b = 7; b >= 0; b--) {
      const bitIndex = byte * 8 + (7 - b);
      if (bitIndex >= limit) continue;
      if (((A[byte] >> b) & 1) !== ((B[byte] >> b) & 1)) diffs.push([byte, b]);
    }
  }
  const path = [Uint8Array.from(bitsA)];
  let cur = Uint8Array.from(bitsA);
  for (const [byte, b] of diffs) {
    const next = Uint8Array.from(cur);
    next[byte] ^= 1 << b;
    path.push(next);
    cur = next;
  }
  return { path, diffs };
}

function drawInvert(ctx, w, h, data, mode) {
  const A = data.entropy;
  const B = data.pairEntropy;
  if (!A) return text(ctx, "no key A", 10, 10, C.muted);
  const frame = sliceFrame(ctx, w, h);
  const a = cellOf(frame, A);
  marker(ctx, a, C.accent, "A");
  if (!B) return text(ctx, "load key B to see the invert layers", 10, h - 14, C.warn);
  const b = cellOf(frame, B);
  const { path } = projectedGeodesic(A, B);

  if (mode === "box") {
    ctx.strokeStyle = C.warn;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(
      Math.min(a.x, b.x) - 3,
      Math.min(a.y, b.y) - 3,
      Math.abs(a.x - b.x) + 6,
      Math.abs(a.y - b.y) + 6
    );
    ctx.setLineDash([]);
    path.forEach((k, i) => {
      if (!i) return;
      const p = cellOf(frame, k);
      ctx.fillStyle = C.ok;
      ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
    });
  }

  if (mode === "geodesic") {
    ctx.strokeStyle = C.ok;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    path.forEach((k, i) => {
      const p = cellOf(frame, k);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();
    path.forEach((k, i) => {
      const p = cellOf(frame, k);
      ctx.fillStyle = i === 0 || i === path.length - 1 ? C.warn : C.ok;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  if (mode === "complement") {
    const notA = A.map((v) => ~v & 255);
    const notB = B.map((v) => ~v & 255);
    marker(ctx, cellOf(frame, notA), C.bad, "¬A", 4);
    marker(ctx, cellOf(frame, notB), C.warn, "¬B", 4);
    ctx.strokeStyle = "rgba(255,93,108,0.5)";
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(cellOf(frame, notA).x, cellOf(frame, notA).y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (mode === "shell") {
    const r = reachabilityFixpoint(Math.min(data.layout.entBits, 512), 0);
    const k = Math.max(1, Math.min(r.halfRadius ?? 1, 12));
    const shell = binomBig(data.layout.entBits, Math.min(data.pair.d, data.layout.entBits));
    text(ctx, `shell C(${data.layout.entBits},${data.pair.d}) = ${fmtBig(shell)}`, 10, h - 14, C.warn);
    void k;
    // concentric shells around A in the projection
    for (let s = 1; s <= 4; s++) {
      ctx.strokeStyle = `rgba(92,225,255,${0.35 - s * 0.06})`;
      ctx.beginPath();
      ctx.arc(a.x, a.y, s * 7, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  marker(ctx, b, C.ok, "B");
  text(ctx, `Hilbert slice · top 14 ENT bits · d(A,B) = ${data.pair.d}`, 8, 4, C.muted, 9);
}

/* ------------------------------------------------------------------ *
 * per-lens renderers
 * ------------------------------------------------------------------ */

const DRAW = {
  "inv-subcube": (ctx, w, h, d) => drawInvert(ctx, w, h, d, "box"),
  "inv-geodesic": (ctx, w, h, d) => drawInvert(ctx, w, h, d, "geodesic"),
  "inv-complement": (ctx, w, h, d) => drawInvert(ctx, w, h, d, "complement"),
  "inv-shell": (ctx, w, h, d) => drawInvert(ctx, w, h, d, "shell"),

  lambda: (ctx, w, h, d) => {
    const n = d.words.length;
    const step = (w - 24) / Math.max(1, n);
    for (let i = 0; i < n; i++) {
      const x = 12 + i * step;
      ctx.strokeStyle = i === n - 1 ? C.warn : C.accent;
      ctx.beginPath();
      ctx.arc(x, h / 2, 5, 0, Math.PI * 2);
      ctx.stroke();
      text(ctx, `x${i + 1}`, x - 6, h / 2 + 8, C.muted, 8);
      if (i < n - 1) {
        ctx.strokeStyle = C.grid;
        ctx.beginPath();
        ctx.moveTo(x + 5, h / 2);
        ctx.lineTo(x + step - 5, h / 2);
        ctx.stroke();
      }
    }
    text(ctx, `λx₁…x_${n}. application spine · ${3 * n - 1} symbols`, 8, 6, C.muted, 9);
    text(ctx, `${n} β-redexes → normal form f^${n} x`, 8, h - 14, C.ok, 9);
  },

  "lambda-untyped": (ctx, w, h, d) => {
    const n = Math.min(d.words.length, 16);
    for (let i = 0; i < n; i++) {
      const x = 14 + i * ((w - 40) / n);
      ctx.fillStyle = C.accent;
      text(ctx, "f(", x, h / 2 - 6, C.accent, 11);
      ctx.strokeStyle = C.grid;
      ctx.beginPath();
      ctx.arc(x + 16, h / 2, 9 - i * 0.2, 0, Math.PI * 2);
      ctx.stroke();
    }
    text(ctx, `Church numeral ${d.words.length}: f^${d.words.length} x`, 8, 6, C.muted, 9);
    text(ctx, `${d.words.length} applications · confluent · terminates`, 8, h - 14, C.ok, 9);
  },

  "lambda-simple": (ctx, w, h, d) => {
    const { entBits, csBits, words } = d.layout;
    chain(ctx, w, h, {
      items: [
        { label: `Bit^${entBits}`, sub: "ENT" },
        { label: `Bit^${csBits}`, sub: "Φ" },
        { label: `W^${words}`, sub: "encode" },
        { label: "Bit^512", sub: "PBKDF2" },
      ],
    });
    text(ctx, "base types · total arrows · strongly normalising", 8, h - 12, C.muted, 9);
  },

  differential: (ctx, w, h, d) => {
    const p = differentialProfile(d.flips);
    if (!p) return text(ctx, "sweeping bits…", 10, 10, C.muted);
    heat(ctx, w, h - 22, {
      rows: 4,
      cols: Math.ceil(p.grad.length / 4),
      values: p.grad,
      max: Math.max(...p.grad, 1),
      tint: [255, 176, 32],
    });
    plot(ctx, w, h, {
      series: [{ data: p.grad, color: C.accent, label: "‖∂Φ/∂bᵢ‖ words" }],
      pad: { l: 30, r: 8, t: h - 52, b: 14 },
      yMin: 0,
      yMax: Math.max(2, p.max + 0.5),
    });
  },

  integral: (ctx, w, h, d) => {
    const p = differentialProfile(d.flips);
    if (!p) return;
    const ip = integralProfile(p.grad);
    plot(ctx, w, h, {
      series: [
        { data: ip.cum, color: C.ok, fill: true, label: "∫‖∂Φ‖ (word-changes)" },
        { data: p.grad, color: C.accent },
      ],
      yMin: 0,
      marks: [{ at: ip.halfAt }],
    });
    text(ctx, `half-area at bit ${ip.halfAt}`, w - 120, h - 12, C.warn, 9);
  },

  fractional: (ctx, w, h, d) => {
    const p = differentialProfile(d.flips);
    if (!p) return;
    plot(ctx, w, h, {
      series: [
        { data: p.grad, color: C.accent, label: "α=1 (measured)" },
        { data: fractionalDerivative(p.grad, 0.5), color: C.ok, label: "α=0.5" },
        { data: fractionalDerivative(p.grad, 0.25), color: C.warn, label: "α=0.25" },
      ],
      yMin: 0,
    });
  },

  vector: (ctx, w, h, d) => {
    const pts = d.path;
    if (!pts || pts.length < 3) return text(ctx, "no path yet", 10, 10, C.muted);
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const X = (v) => 10 + ((v - minX) / (maxX - minX || 1)) * (w - 20);
    const Y = (v) => h - 14 - ((v - minY) / (maxY - minY || 1)) * (h - 30);
    ctx.strokeStyle = C.accent;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1]))));
    ctx.stroke();
    pts.forEach((p, i) => {
      ctx.fillStyle = i === pts.length - 1 ? C.warn : C.ok;
      ctx.beginPath();
      ctx.arc(X(p[0]), Y(p[1]), i === pts.length - 1 ? 3.4 : 2, 0, Math.PI * 2);
      ctx.fill();
    });
    text(ctx, "projection of the phrase path (x,y)", 8, 4, C.muted, 9);
  },

  tensor: (ctx, w, h, d) => {
    const inf = influenceMatrix(d.flips, d.words.length);
    if (!inf) return;
    const rows = Math.min(8, inf.words);
    const M = gramMatrix(Array.from({ length: rows }, (_, i) => inf.rows[i]));
    const flat = [];
    for (let i = 0; i < rows; i++) for (let j = 0; j < rows; j++) flat.push(M[i][j]);
    const size = Math.min(w, h) - 40;
    heat(ctx, size, size, { rows, cols: rows, values: flat, max: Math.max(...flat), tint: [61, 255, 176] });
    text(ctx, "J Jᵀ (first " + rows + " words)", size + 8, 6, C.muted, 9);
    text(ctx, `tr = ${flat.filter((_, i) => i % (rows + 1) === 0).reduce((a, b) => a + b, 0).toFixed(3)}`, size + 8, 20, C.text, 9);
  },

  ricci: (ctx, w, h, d) => {
    const n = Math.min(12, d.layout.entBits);
    const size = Math.min(w, h) - 34;
    const values = [];
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) values.push(i === j ? 1 : 0);
    heat(ctx, size, size, { rows: n, cols: n, values, max: 1, tint: [92, 225, 255] });
    text(ctx, "g_ij = δ_ij", size + 8, 6, C.muted, 9);
    text(ctx, "Γⁱⱼₖ = 0", size + 8, 20, C.ok, 9);
    text(ctx, "R = 0", size + 8, 34, C.ok, 9);
    text(ctx, `weight ${popcountBytes(d.entropy || new Uint8Array(16))}`, size + 8, 50, C.text, 9);
    text(ctx, "flat — no curvature to find", 8, h - 12, C.muted, 9);
  },

  influence: (ctx, w, h, d) => {
    const inf = influenceMatrix(d.flips, d.words.length);
    if (!inf) return;
    const cols = inf.bits;
    const rows = inf.words;
    const values = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) values.push(inf.rows[r][c]);
    heat(ctx, w, h - 18, { rows, cols, values, max: 1, tint: [255, 176, 32] });
    text(ctx, `${rows} words × ${cols} entropy bits · |Δindex|/2047`, 8, h - 12, C.muted, 9);
  },

  propositional: (ctx, w, h, d) => {
    const atoms = wellFormedAtoms(d.analysis, d.words);
    const tt = truthTable(atoms);
    table(ctx, w, h, {
      head: [...atoms.map((a) => a.id), "N∧W∧C"],
      rows: tt.rows.map((r) => [...r.val.map((v) => (v ? "T" : "F")), r.result ? "T" : "F"]),
      highlight: tt.actualIndex,
    });
  },

  predicate: (ctx, w, h, d) => {
    const ent = d.layout.entBits;
    const cs = d.layout.csBits;
    const LOG2 = Math.log10(2);
    const shell = binomBig(ent, Math.min(8, ent));
    // exact log₁₀ magnitudes: 2^5624 is not representable as a Number
    bars(ctx, w, h, {
      items: [
        { label: "|C|", v: ent * LOG2, tag: `2^${ent}`, color: C.accent },
        { label: "CS fibre", v: (ent - cs) * LOG2, tag: `2^${ent - cs}`, color: C.ok },
        { label: "prefix14", v: (ent - 14) * LOG2, tag: `2^${ent - 14}`, color: C.warn },
        { label: "shell d", v: log10Big(shell), tag: "C(n,8)", color: C.bad },
      ],
    });
    text(ctx, "log₁₀ of each cardinality", 8, 2, C.muted, 9);
  },

  relational: (ctx, w, h, d) => {
    const idx = d.analysis?.indices || [];
    const rows = d.words.slice(0, 8).map((wrd, i) => [
      i + 1,
      idx[i] ?? "—",
      wrd.slice(0, 8),
      (idx[i] ?? 0).toString(2).padStart(11, "0").slice(0, 6),
    ]);
    table(ctx, w, h, { head: ["pos", "idx", "word", "bits"], rows, highlight: rows.length - 1 });
  },

  sequent: (ctx, w, h, d) => {
    const atoms = wellFormedAtoms(d.analysis, d.words);
    const leaves = atoms.map((at) => ({
      label: `⊢ ${at.id}`,
      rule: at.value ? "axiom" : "failed",
      ok: at.value,
      children: [],
    }));
    const and = { label: `⊢ ${atoms.map((a) => a.id).join("∧")}`, rule: "∧R", ok: leaves.every((l) => l.ok), children: leaves };
    tree(ctx, w, h, { label: "⊢ valid", rule: "cut", ok: and.ok, children: [and] });
  },

  "modal-mu": (ctx, w, h, d) => {
    const r = reachabilityFixpoint(Math.min(d.layout.entBits, 1024), 10);
    bars(ctx, w, h, {
      items: r.balls.slice(0, 10).map((b) => ({
        label: `r${b.k}`,
        v: log10Big(b.ball),
        tag: `2^${Math.round(log10Big(b.ball) / Math.log10(2))}`,
        color: b.k === r.halfRadius ? C.warn : C.accent,
      })),
    });
    text(ctx, `50% of 2^${d.layout.entBits} inside radius ${r.halfRadius}`, 8, 2, C.muted, 9);
  },

  boolean: (ctx, w, h, d) => {
    if (!d.anf) return text(ctx, "probing 16 preimages…", 10, 10, C.muted);
    const coef = mobius(d.anf);
    const size = Math.min(w - 90, h - 20);
    heat(ctx, size, size, { rows: 4, cols: 4, values: d.anf, max: 1, tint: [92, 225, 255] });
    heat(ctx, size, size, {
      rows: 4,
      cols: 4,
      values: coef,
      max: 1,
      tint: [61, 255, 176],
      pad: { l: size + 14, r: 6, t: 6, b: 6 },
    });
    text(ctx, "truth", 8, size + 8, C.muted, 9);
    text(ctx, "ANF", size + 22, size + 8, C.muted, 9);
    text(ctx, `weight ${coef.reduce((a, b) => a + b, 0)}/16`, 8, h - 12, C.ok, 9);
  },

  umbral: (ctx, w, h, d) => {
    const u = umbralProfile(d.indices);
    if (!u) return;
    const rows = Math.min(7, u.diffs.length);
    const cols = Math.min(12, u.seq.length);
    const values = [];
    let max = 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const v = u.diffs[r][c] ?? 0;
        values.push(Math.abs(v));
        max = Math.max(max, Math.abs(v));
      }
    }
    heat(ctx, w, h - 18, { rows, cols, values, max, tint: [255, 176, 32] });
    text(ctx, "finite-difference triangle Δ^k aₙ", 8, h - 12, C.muted, 9);
  },

  situation: (ctx, w, h, d) => {
    const recent = (d.actions || []).slice(-6);
    chain(ctx, w, h, {
      items: recent.length ? recent.map((a) => ({ label: a.kind, sub: a.ok === false ? "invalid" : "" })) : [{ label: "S₀", sub: "boot" }],
    });
    text(ctx, `do(a,s) chain · ${d.actions?.length ?? 0} actions`, 8, h - 12, C.muted, 9);
  },

  event: (ctx, w, h, d) => {
    const e = eventReport(d.actions || []);
    plot(ctx, w, h, {
      series: [{ data: e.grid.map((g) => g[1]), color: C.ok, fill: true, label: "HoldsAt(Valid, t)" }],
      yMin: -0.1,
      yMax: 1.2,
    });
  },

  duration: (ctx, w, h, d) => {
    const dr = durationReport(d.timings || []);
    bars(ctx, w, h, {
      items: dr.rows.map((r) => ({ label: r.label.slice(0, 9), v: r.ms, tag: `${r.ms.toFixed(1)}ms`, color: C.accent })),
    });
  },

  stochastic: (ctx, w, h, d) => {
    const s = stochasticForecast(d.layout.entBits, [
      { label: "10⁶", rate: 1e6 },
      { label: "10⁹", rate: 1e9 },
      { label: "10¹²", rate: 1e12 },
      { label: "10¹⁵", rate: 1e15 },
    ]);
    // bars carry log₁₀(years): the raw value overflows Number past ~2^1000
    bars(ctx, w, h, {
      items: s.rows.map((r) => ({
        label: r.label,
        v: r.logYears,
        tag: r.logYears > 6 ? `10^${Math.round(r.logYears)}yr` : `${r.years.toExponential(1)}yr`,
        color: C.warn,
      })),
    });
    text(ctx, `log₁₀ years to first hit on 2^${d.layout.entBits}`, 8, 2, C.muted, 9);
  },

  ito: (ctx, w, h, d) => {
    const it = itoReport(d.seed ?? 12345, 240);
    plot(ctx, w, h, {
      series: [{ data: it.path.map((p) => p[1]), color: C.accent, label: "X_t = log₂(1+N_t)" }],
      yMin: 0,
    });
    text(ctx, `[X]_T = ${it.quadraticVariation.toFixed(4)}`, w - 110, h - 12, C.ok, 9);
  },

  pi: (ctx, w, h) => {
    const p = piReport();
    chain(ctx, w, h, {
      items: p.stages.slice(0, 6).map((s, i) => ({ label: s.split(" ")[0].slice(0, 10), sub: `c${i}`, color: i % 2 ? C.ok : C.accent })),
    });
    text(ctx, "ν-restricted channels · no free names", 8, h - 12, C.muted, 9);
  },

  process: (ctx, w, h) => {
    const l = ltsReport();
    chain(ctx, w, h, { items: l.states.slice(0, 6).map((s) => ({ label: s.label.split(" ")[0].slice(0, 10), sub: `s${s.id}` })) });
    text(ctx, `${l.count} states · ${l.transitions} τ transitions · ${l.traces} maximal trace`, 8, h - 12, C.muted, 9);
  },

  /* ---- algebra family ---- */
  linear: (ctx, w, h, d) => {
    const rows = bitMatrix(d.indices || []);
    if (!rows.length) return;
    heat(ctx, w, h, { rows: rows.length, cols: 11, values: rows.flat(), max: 1, pad: { l: 8, r: 8, t: 16, b: 8 } });
    const r = gf2Rank(rows);
    text(ctx, `GF(2) rank ${r.rank} · nullity ${r.nullity} · ${rows.length}×11`, 8, 4, C.muted, 9);
  },

  lie: (ctx, w, h, d) => {
    const bytes = d.entropy || new Uint8Array(16);
    const vec = (i) => [
      (bytes[i % 16] - 127.5) / 127.5,
      (bytes[(i + 3) % 16] - 127.5) / 127.5,
      (bytes[(i + 6) % 16] - 127.5) / 127.5,
    ];
    const u = vec(0);
    const vv = vec(1);
    const br = cross3(u, vv);
    const cx = w * 0.5;
    const cy = h * 0.52;
    const s = 52;
    const proj = (a) => [cx + a[0] * s, cy - a[1] * s];
    const line = (a, b, col) => {
      const p = proj(a);
      const q = proj(b);
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p[0], p[1]);
      ctx.lineTo(q[0], q[1]);
      ctx.stroke();
    };
    line([0, 0, 0], u, C.accent);
    line([0, 0, 0], vv, C.ok);
    line([0, 0, 0], br, C.warn);
    text(ctx, "u · w · [u,w] = u×w (so(3))", 8, 4, C.muted, 9);
  },

  division: (ctx, w, h, d) => {
    const bytes = d.entropy || new Uint8Array(16);
    const p = quatFromBytes(bytes, 0);
    const q = quatFromBytes(bytes, 4);
    const pq = quatMul(p, q);
    const lhs = quatNorm(pq);
    const rhs = quatNorm(p) * quatNorm(q);
    bars(ctx, w, h, {
      items: [
        { label: "p₀", v: p[0], color: C.accent },
        { label: "p₁", v: p[1], color: C.accent },
        { label: "p₂", v: p[2], color: C.accent },
        { label: "p₃", v: p[3], color: C.accent },
        { label: "q₀", v: q[0], color: C.ok },
        { label: "q₁", v: q[1], color: C.ok },
        { label: "q₂", v: q[2], color: C.ok },
        { label: "q₃", v: q[3], color: C.ok },
      ],
      pad: { l: 30, r: 8, t: 16, b: 22 },
    });
    text(ctx, `‖pq‖=${lhs.toFixed(4)} = ‖p‖‖q‖=${rhs.toFixed(4)}`, 8, 4, C.muted, 9);
  },

  clifford: (ctx, w, h) => {
    const dims = gradeDims(11).slice(0, 8);
    bars(ctx, w, h, {
      items: dims.map((v, i) => ({ label: `g${i}`, v: Number(v), tag: v.toString(), color: C.accent })),
      yLog: true,
      pad: { l: 34, r: 8, t: 16, b: 20 },
    });
    text(ctx, "Cl(ℝ¹¹) grades C(11,k) · Σ = 2048", 8, 4, C.muted, 9);
  },

  exterior: (ctx, w, h, d) => {
    const rows = bitMatrix(d.indices || []);
    if (rows.length < 2) return;
    const u = rows[0].map(Number);
    const v = rows[1].map(Number);
    const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
    const area = Math.sqrt(Math.max(0, dot(u, u) * dot(v, v) - dot(u, v) ** 2));
    const sx = 44;
    const sy = 22;
    const ox = 30;
    const oy = h - 30;
    const P = (a) => [ox + (a[0] + a[1] * 0.35) * sx, oy - (a[1] - a[0] * 0.2) * sy];
    const o = P([0, 0]);
    const pu = P([u[0], u[1]]);
    const pv = P([v[0], v[1]]);
    const puv = P([u[0] + v[0], u[1] + v[1]]);
    ctx.fillStyle = "rgba(92,225,255,0.12)";
    ctx.strokeStyle = C.grid;
    ctx.beginPath();
    ctx.moveTo(o[0], o[1]);
    ctx.lineTo(pu[0], pu[1]);
    ctx.lineTo(puv[0], puv[1]);
    ctx.lineTo(pv[0], pv[1]);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    text(ctx, `‖u∧v‖ = ${area.toFixed(2)} (schematic projection)`, 8, 4, C.muted, 9);
  },

  "tensor-algebra": (ctx, w, h) => {
    const dims = [0, 1, 2, 3, 4, 5, 6].map((k) => tensorGraded(11, k));
    bars(ctx, w, h, {
      items: dims.map((v, i) => ({ label: `${i}`, v: Number(v), tag: v.toString(), color: C.accent })),
      yLog: true,
      pad: { l: 34, r: 8, t: 16, b: 20 },
    });
    text(ctx, "T(V) graded dim 11ᵏ", 8, 4, C.muted, 9);
  },

  "symmetric-algebra": (ctx, w, h) => {
    const dims = [0, 1, 2, 3, 4, 5, 6].map((k) => symmetricGraded(11, k));
    bars(ctx, w, h, {
      items: dims.map((v, i) => ({ label: `${i}`, v: Number(v), tag: v.toString(), color: C.ok })),
      yLog: true,
      pad: { l: 34, r: 8, t: 16, b: 20 },
    });
    text(ctx, "Sym(V) graded dim C(11+k−1,k)", 8, 4, C.muted, 9);
  },

  "boolean-algebra": (ctx, w, h) => {
    const levels = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((k) => binomBig(11, k));
    bars(ctx, w, h, {
      items: levels.map((v, i) => ({ label: `${i}`, v: Number(v), tag: v.toString(), color: C.accent })),
      pad: { l: 30, r: 8, t: 16, b: 20 },
    });
    text(ctx, "B₁₁ levels C(11,k) · Σ = 2048", 8, 4, C.muted, 9);
  },

  heyting: (ctx, w, h) => {
    const levels = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((k) => binomBig(11, k));
    bars(ctx, w, h, {
      items: levels.map((v, i) => ({ label: `${i}`, v: Number(v), tag: v.toString(), color: C.warn })),
      pad: { l: 30, r: 8, t: 16, b: 20 },
    });
    text(ctx, "B₁₁ as Heyting lattice · 2048 elements", 8, 4, C.muted, 9);
  },

  sigma: (ctx, w, h, d) => {
    const s = sigmaAtoms(d.flips, d.layout?.words || 12);
    if (!s) return;
    bars(ctx, w, h, {
      items: s.atoms.slice(0, 10).map(([mask, cnt], i) => ({ label: `a${i}`, v: cnt, tag: `${cnt}`, color: C.accent })),
      pad: { l: 30, r: 8, t: 16, b: 20 },
    });
    text(ctx, `${s.k} atoms · |σ| = 2^${s.k}`, 8, 4, C.muted, 9);
  },

  homological: (ctx, w, h, d) => {
    const g = flipGraph(d.flips, d.layout?.words || 12);
    if (!g) return;
    bars(ctx, w, h, {
      items: [
        { label: "β₀", v: g.betti0, tag: `${g.betti0}`, color: C.ok },
        { label: "β₁", v: g.betti1, tag: `${g.betti1}`, color: C.warn },
        { label: "V", v: g.vertices, tag: `${g.vertices}`, color: C.accent },
        { label: "E", v: g.edges, tag: `${g.edges}`, color: C.muted },
      ],
      pad: { l: 30, r: 8, t: 16, b: 20 },
    });
    text(ctx, `H₀=ℤ^${g.betti0} · H₁=ℤ^${g.betti1}`, 8, 4, C.muted, 9);
  },

  banach: (ctx, w, h, d) => {
    const rows = bitMatrix(d.indices || []);
    if (rows.length < 2) return;
    const G = gramMatrix(rows.map((r) => r.map(Number)));
    const ev = eigenSymmetric(G, Math.min(4, G.length));
    const spec = ev.map((e) => e.lambda).sort((a, b) => b - a);
    plot(ctx, w, h, { series: [{ data: spec, color: C.accent, label: "σ(G)" }] });
    text(ctx, `ρ(G) = ${Math.max(...spec).toFixed(2)}`, 8, h - 12, C.muted, 9);
  },
};

export function drawLens(id, canvas, data) {
  const fn = DRAW[id];
  if (!fn || !canvas) return false;
  const w = 340;
  const h = 172;
  const ctx = prep(canvas, w, h);
  if (!ctx) return false;
  fn(ctx, w, h, data || {});
  return true;
}

export const HAS_DRAW = (id) => typeof DRAW[id] === "function";
