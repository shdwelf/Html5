/** Discrete geometry of BIP-39: product space, Gray Q11, cube faces. */

export function binaryReflectedGray(n) {
  return n ^ (n >>> 1);
}

export function grayInverse(g) {
  let n = g;
  n ^= n >>> 1;
  n ^= n >>> 2;
  n ^= n >>> 4;
  n ^= n >>> 8;
  n ^= n >>> 16;
  return n >>> 0;
}

/** Gray-adjacent neighbors on Q_11 (Hamming distance 1). */
export function grayNeighbors(index) {
  const g = binaryReflectedGray(index);
  const out = [];
  for (let b = 0; b < 11; b++) {
    const ng = g ^ (1 << b);
    out.push(grayInverse(ng) & 2047);
  }
  return out;
}

export function bitsToInt(bits) {
  let v = 0;
  for (const b of bits) v = (v << 1) | (b ? 1 : 0);
  return v >>> 0;
}

export function flipEntropyBit(entropy, bitIndex) {
  const out = new Uint8Array(entropy);
  const byte = bitIndex >> 3;
  const bit = 7 - (bitIndex & 7);
  if (byte < out.length) out[byte] ^= 1 << bit;
  return out;
}

/** 2-D net of Q_n (n≤6): vertices placed by bit-sum / Gray angle. */
export function hypercubeLayout(n) {
  const N = 1 << n;
  const pts = [];
  for (let i = 0; i < N; i++) {
    let wt = 0;
    for (let b = 0; b < n; b++) if (i & (1 << b)) wt++;
    const ang = (binaryReflectedGray(i) / N) * Math.PI * 2;
    const r = 0.22 + (wt / n) * 0.72;
    pts.push({ i, x: 0.5 + Math.cos(ang) * r * 0.45, y: 0.5 + Math.sin(ang) * r * 0.45, wt });
  }
  const edges = [];
  for (let i = 0; i < N; i++) {
    for (let b = 0; b < n; b++) {
      const j = i ^ (1 << b);
      if (j > i) edges.push([i, j]);
    }
  }
  return { n, pts, edges };
}

export function indexChanged(a, b) {
  const n = Math.max(a.length, b.length);
  const hit = [];
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) hit.push(i);
  return hit;
}
