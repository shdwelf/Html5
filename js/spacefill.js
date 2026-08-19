/** Locality-preserving maps and BIP-39 bit layouts. No network. */

export function bytesToBits(bytes) {
  const bits = [];
  for (const b of bytes) {
    for (let i = 7; i >= 0; i--) bits.push((b >> i) & 1);
  }
  return bits;
}

export function prefixBits(bytes, n) {
  const bits = bytesToBits(bytes);
  let v = 0;
  const take = Math.min(n, bits.length);
  for (let i = 0; i < take; i++) v = (v << 1) | bits[i];
  if (take < n) v <<= n - take;
  return v >>> 0;
}

/** 2-D Hilbert index → (x,y) on a 2^order grid. */
export function hilbertXY(index, order) {
  let x = 0;
  let y = 0;
  let t = index >>> 0;
  for (let s = 1; s < 1 << order; s <<= 1) {
    const rx = 1 & (t >>> 1);
    const ry = 1 & (t ^ rx);
    ({ x, y } = rot(s, x, y, rx, ry));
    x += s * rx;
    y += s * ry;
    t >>>= 2;
  }
  return { x, y };
}

function rot(n, x, y, rx, ry) {
  if (ry === 0) {
    if (rx === 1) {
      x = n - 1 - x;
      y = n - 1 - y;
    }
    return { x: y, y: x };
  }
  return { x, y };
}

/** Morton / Z-order: de-interleave low 2n bits. */
export function mortonXY(index, order) {
  const mask = (1 << order) - 1;
  let x = 0;
  let y = 0;
  for (let i = 0; i < order; i++) {
    x |= ((index >>> (2 * i)) & 1) << i;
    y |= ((index >>> (2 * i + 1)) & 1) << i;
  }
  return { x: x & mask, y: y & mask };
}

export function fibonacciSphere(n) {
  const out = new Float32Array(n * 3);
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / Math.max(1, n - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const t = phi * i;
    out[i * 3] = Math.cos(t) * r;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = Math.sin(t) * r;
  }
  return out;
}

/** Adjacent 11-bit indices stay near each other (64 azimuth × 32 elevation). */
export function polarIndexEmbedding(n = 2048) {
  const out = new Float32Array(n * 3);
  const az = 64;
  const el = 32;
  for (let i = 0; i < n; i++) {
    const a = (i % az) / az;
    const e = Math.floor(i / az) / Math.max(1, el - 1);
    const theta = a * Math.PI * 2;
    const phi = (e - 0.5) * Math.PI;
    const c = Math.cos(phi);
    out[i * 3] = Math.cos(theta) * c;
    out[i * 3 + 1] = Math.sin(phi);
    out[i * 3 + 2] = Math.sin(theta) * c;
  }
  return out;
}

export const SCALE_MARKS = [
  { bits: 40, label: "2⁴⁰", note: "puzzle-sized band" },
  { bits: 64, label: "2⁶⁴", note: "GPU-year folklore" },
  { bits: 80, label: "2⁸⁰", note: "~atoms in you" },
  { bits: 128, label: "2¹²⁸", note: "12-word entropy" },
  { bits: 256, label: "2²⁵⁶", note: "24-word / secp scalar" },
];

export function analogForBits(bits) {
  if (bits <= 40) return "Small enough that dedicated hardware has searched similar bands (puzzles).";
  if (bits <= 64) return "On the edge of massive parallel search; not a BIP-39 CSPRNG sample.";
  if (bits <= 80) return "Roughly atoms in a human — still not a 12-word space.";
  if (bits <= 128) return "≈ 3.4×10³⁸. Age of universe × 10²⁰+ at a trillion guesses/s.";
  return "≈ 1.16×10⁷⁷. Larger than atoms in the observable universe (~10⁸⁰ is close in log-space; 2²⁵⁶ is 10⁷⁷).";
}
