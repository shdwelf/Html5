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

/** Morton / Z-order 3-D: de-interleave the low 3n bits of `index`. */
export function mortonXYZ(index, order) {
  const mask = (1 << order) - 1;
  let x = 0;
  let y = 0;
  let z = 0;
  for (let i = 0; i < order; i++) {
    x |= ((index >>> (3 * i)) & 1) << i;
    y |= ((index >>> (3 * i + 1)) & 1) << i;
    z |= ((index >>> (3 * i + 2)) & 1) << i;
  }
  return { x: x & mask, y: y & mask, z: z & mask };
}

/**
 * Canonical projection of a key into a 2^order Morton grid — the map every 3-D
 * lens (js/lens-3d.js) and the WebAssembly rasteriser (wasm/lens3d.wasm) share.
 *
 * Prefix entropy bit j (bit 0 = MSB of byte 0, the order `bytesToBits` gives)
 * becomes coordinate bit ⌊j/3⌋ of axis j % 3. Short keys are left-aligned
 * exactly like `prefixBits`: missing bits read as 0, so a 6-bit key still spans
 * the grid instead of collapsing into one corner.
 *
 * Because every bit lands on exactly one axis bit, Hamming adjacency in the
 * prefix *is* grid adjacency: the affine subcube spanned by two keys really is
 * an axis-aligned box, which is the whole reason this projection is used.
 *
 * `x`/`y`/`z` are normalised to [0, 1] over the grid — `keyProjectionCells`
 * returns the underlying integer cells.
 *
 * @returns {{x:number,y:number,z:number,cx:number,cy:number,cz:number,
 *            index:number,order:number}}
 */
export function keyProjection(bytes, order = 7) {
  const c = keyProjectionCells(bytes, order);
  const d = (1 << c.order) - 1;
  return { ...c, x: c.cx / d, y: c.cy / d, z: c.cz / d };
}

/** {@link keyProjection} on the integer grid: cells in [0, 2^order). */
export function keyProjectionCells(bytes, order = 7) {
  const o = Math.max(1, Math.min(10, order | 0));
  const bits = bytesToBits(bytes || new Uint8Array(0));
  const cell = [0, 0, 0];
  const n = 3 * o;
  for (let j = 0; j < n; j++) {
    if (j < bits.length && bits[j]) cell[j % 3] |= 1 << ((j / 3) | 0);
  }
  let index = 0;
  for (let i = o - 1; i >= 0; i--) {
    index = (index << 1) | ((cell[2] >> i) & 1);
    index = (index << 1) | ((cell[1] >> i) & 1);
    index = (index << 1) | ((cell[0] >> i) & 1);
  }
  return { cx: cell[0], cy: cell[1], cz: cell[2], index: index >>> 0, order: o };
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

/** Last 11-bit group: leftover entropy bits then checksum bits. */
export function lastWordSplit(entropyBits, checksumBits) {
  const leftover = 11 - checksumBits;
  return { leftover, checksumBits, entropyBits };
}

const curveCache = new Map();

export function curveTable(kind, order) {
  const key = `${kind}:${order}`;
  if (curveCache.has(key)) return curveCache.get(key);
  const n = 1 << order;
  const map = kind === "morton" ? mortonXY : hilbertXY;
  const xs = new Uint16Array(n * n);
  const ys = new Uint16Array(n * n);
  for (let i = 0; i < n * n; i++) {
    const p = map(i, order);
    xs[i] = p.x;
    ys[i] = p.y;
  }
  const pack = { n, xs, ys };
  curveCache.set(key, pack);
  return pack;
}

export function analogForBits(bits) {
  if (bits <= 40) return "Small enough that dedicated hardware has searched similar bands (puzzles).";
  if (bits <= 64) return "On the edge of massive parallel search; not a BIP-39 CSPRNG sample.";
  if (bits <= 80) return "Roughly atoms in a human — still not a 12-word space.";
  if (bits <= 128) return "≈ 3.4×10³⁸. Age of universe × 10²⁰+ at a trillion guesses/s.";
  return "≈ 1.16×10⁷⁷. Larger than atoms in the observable universe (~10⁸⁰ is close in log-space; 2²⁵⁶ is 10⁷⁷).";
}
