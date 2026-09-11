// globe-ref.js — the JavaScript shadow of wasm/globe.wat, and the single
// home of the globe memory map both backends share.
//
// Division of labour (the lens3d rule): transcendentals stay on the JS side.
// The caller converts lat/lon to unit xyz once at load and derives the four
// rotation cosines per frame; the module — wasm or this file — then does the
// per-vertex linear algebra (rotate, horizon-clip, fade) with plain f32
// arithmetic only. Every multiply/add/divide below rounds exactly once, in
// the same order as the .wat, so the two agree bit for bit (tests/12).
//
// Memory map (11 pages = 704 KiB, allocated once, never grown):
//   0x0000 params            (0x100)
//   0x0100 rings: (start u32, count u32) × 256
//   0x1000 coast xyz: f32 ×3 × 8192
//   0x19000 markers: f32 xyzw × 512
//   0x1B000 line verts: 8×f32 × 16384  (x y z r g b size alpha)
//   0x9B000 point verts: 8×f32 × 2048

export const PAGE = 65536;
export const PAGES = 11;
export const MEM_BYTES = PAGE * PAGES;

export const P = {
  NPTS: 0, NRINGS: 4, NMARK: 8, NLNV: 12, NPTV: 16, ERR: 20,
  C0: 32, S0: 36, C1: 40, S1: 44,
  COAST_R: 48, COAST_G: 52, COAST_B: 56,
  MARK_R: 60, MARK_G: 64, MARK_B: 68,
  MARK_SIZE: 72, LIMB: 76,
};
export const RINGS = 0x100;
export const RING_CAP = 256;
export const COAST = 0x1000;
export const COAST_CAP = 8192;
export const MARKERS = 0x19000;
export const MARK_CAP = 512;
export const LINEVERTS = 0x1b000;
export const LINE_CAP = 16384;
export const POINTVERTS = 0x9b000;
export const POINT_CAP = 2048;
export const STRIDE = 32;
export const FLOATS_PER_VERT = 8;

export const ERR = { OK: 0, LINE_OVERFLOW: 1, POINT_OVERFLOW: 2, BAD_COUNTS: 3 };
export const EXPORTS = ["memory", "buildCoast", "buildMarkers"];

export const DEFAULTS = {
  coast: [0.35, 0.75, 0.55],
  mark: [1.0, 0.45, 0.3],
  markSize: 9.0, // pixels at 1:1, scaled by the page's uniform
  limb: 0.18, // horizon fade width in unit-z
};

const F = (v) => Math.fround(v);
const M = (a, b) => Math.fround(a * b);
const A = (a, b) => Math.fround(a + b);
const S = (a, b) => Math.fround(a - b);
const D = (a, b) => Math.fround(a / b);
const SZ0 = F(0.55);
const SZK = F(0.45);
const HALF = F(0.5);

/**
 * Rotate a unit vector so the sub-viewer point sits on +Z.
 * (c0,s0) = cos/sin of λ0, (c1,s1) = sin/cos-form of φ0 — see setView.
 * Op order is the contract tests/12 locks against the .wat.
 */
export function rotateXYZ(x, y, z, c0, s0, c1, s1) {
  const x1 = A(M(x, c0), M(y, s0));
  const y1 = S(M(y, c0), M(x, s0));
  const x2 = A(M(x1, c1), M(z, s1));
  const z2 = S(M(z, c1), M(x1, s1));
  return [x2, y1, z2];
}

/** Clip fraction t where the segment p0→p1 pierces z=0 (straddle only). */
export function clipT(z0, z1) {
  return D(z0, S(z0, z1));
}

export function createGlobeRef() {
  const memory = new WebAssembly.Memory({ initial: PAGES, maximum: PAGES });
  const dv = () => new DataView(memory.buffer);
  const f32 = () => new Float32Array(memory.buffer);
  const u32 = () => new Uint32Array(memory.buffer);

  const g = (o) => dv().getFloat32(o, true);
  const gi = (o) => dv().getUint32(o, true);
  const si = (o, v) => dv().setUint32(o, v, true);

  function emitVert(base, i, x, y, z, r, gg, b, size, alpha) {
    const o = (base + i * STRIDE) / 4;
    const f = f32();
    f[o] = x; f[o + 1] = y; f[o + 2] = z;
    f[o + 3] = r; f[o + 4] = gg; f[o + 5] = b;
    f[o + 6] = size; f[o + 7] = alpha;
  }

  function fade(z, width) {
    let a = D(z, width);
    if (a > 1) a = 1;
    if (a < 0) a = 0;
    return a;
  }

  function buildCoast() {
    const npts = gi(P.NPTS), nrings = gi(P.NRINGS);
    si(P.NLNV, 0);
    if (npts > COAST_CAP || nrings > RING_CAP) { si(P.ERR, ERR.BAD_COUNTS); return; }
    const c0 = g(P.C0), s0 = g(P.S0), c1 = g(P.C1), s1 = g(P.S1);
    const cr = g(P.COAST_R), cg = g(P.COAST_G), cb = g(P.COAST_B);
    const limb = g(P.LIMB);
    const f = f32(), u = u32();
    let n = 0;
    for (let r = 0; r < nrings; r++) {
      const start = u[RINGS / 4 + r * 2], count = u[RINGS / 4 + r * 2 + 1];
      if (start + count > npts) { si(P.ERR, ERR.BAD_COUNTS); return; }
      for (let k = 0; k + 1 < count; k++) {
        const a = (COAST / 4) + (start + k) * 3;
        const b = a + 3;
        const [x0, y0, z0] = rotateXYZ(f[a], f[a + 1], f[a + 2], c0, s0, c1, s1);
        const [x1, y1, z1] = rotateXYZ(f[b], f[b + 1], f[b + 2], c0, s0, c1, s1);
        const v0 = z0 > 0, v1 = z1 > 0;
        if (!v0 && !v1) continue;
        let ex0 = x0, ey0 = y0, ez0 = z0, ex1 = x1, ey1 = y1, ez1 = z1;
        if (v0 !== v1) {
          const t = clipT(z0, z1);
          const cx = A(x0, M(t, S(x1, x0)));
          const cy = A(y0, M(t, S(y1, y0)));
          const cz = A(z0, M(t, S(z1, z0)));
          if (v0) { ex1 = cx; ey1 = cy; ez1 = cz; } else { ex0 = cx; ey0 = cy; ez0 = cz; }
        }
        if (n + 2 > LINE_CAP) { si(P.ERR, ERR.LINE_OVERFLOW); si(P.NLNV, n); return; }
        emitVert(LINEVERTS, n++, ex0, ey0, ez0, cr, cg, cb, 0, fade(ez0, limb));
        emitVert(LINEVERTS, n++, ex1, ey1, ez1, cr, cg, cb, 0, fade(ez1, limb));
      }
    }
    si(P.NLNV, n);
    si(P.ERR, ERR.OK);
  }

  function buildMarkers() {
    const nmark = gi(P.NMARK);
    si(P.NPTV, 0);
    if (nmark > MARK_CAP) { si(P.ERR, ERR.BAD_COUNTS); return; }
    const c0 = g(P.C0), s0 = g(P.S0), c1 = g(P.C1), s1 = g(P.S1);
    const mr = g(P.MARK_R), mg = g(P.MARK_G), mb = g(P.MARK_B);
    const msize = g(P.MARK_SIZE), limb = g(P.LIMB);
    const half = M(limb, HALF);
    const f = f32();
    let n = 0;
    for (let m = 0; m < nmark; m++) {
      const a = (MARKERS / 4) + m * 4;
      const [x, y, z] = rotateXYZ(f[a], f[a + 1], f[a + 2], c0, s0, c1, s1);
      if (z <= 0) continue;
      if (n + 1 > POINT_CAP) { si(P.ERR, ERR.POINT_OVERFLOW); si(P.NPTV, n); return; }
      const size = M(M(msize, f[a + 3]), A(SZ0, M(SZK, z)));
      emitVert(POINTVERTS, n++, x, y, z, mr, mg, mb, size, fade(z, half));
    }
    si(P.NPTV, n);
    si(P.ERR, ERR.OK);
  }

  return { memory, buildCoast, buildMarkers };
}
