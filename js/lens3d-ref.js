/**
 * lens3d-ref.js — the JavaScript shadow of wasm/lens3d.wasm.
 *
 * Same memory map, same exports, same instruction-by-instruction arithmetic.
 * It exists for two reasons:
 *
 *   1. It makes the WebAssembly path *testable* without a GPU: the wasm module
 *      and this file must agree bit for bit on the vertex buffer and on the
 *      rasterised texture, so a divergence is a bug in one of them and never a
 *      difference of opinion about rounding (tests/10-lens3d-wasm.mjs).
 *   2. It is the fallback backend on hosts where wasm compilation is refused —
 *      a locked-down webxdc, a CSP without `wasm-unsafe-eval`. The client in
 *      js/lens3d-wasm.js hands both to the same code, so the app never has two
 *      rendering paths to keep in sync by hand.
 *
 * Exactness is deliberate. Every operation used here — add, sub, mul, div,
 * floor, ceil, sqrt, and the one f64→f32 rounding at store time — is an exact
 * IEEE-754 operation in both V8 and the wasm spec, and `f32.add` on the
 * accumulator cannot double-round because the exact sum of two f32 values is
 * representable in f64. Transcendentals are what would break this, which is
 * why the stochastic and shell lenses live in js/lens-3d.js and not here.
 */

export const PAGE = 65536;
export const PAGES = 64; // 4 MiB, allocated once, never grown
export const MEM_BYTES = PAGE * PAGES;

/** Parameter block (mirrors the $P_* globals in wasm/lens3d.wat). */
export const P = {
  ORDER: 0, ALEN: 4, BLEN: 8, FLAGS: 12, NPTS: 16, NLN: 20, ERR: 24,
  TEXW: 28, TEXH: 32, MAXS: 36, PREFIX: 40, DIFFCAP: 44,
  COLORA: 48, COLORB: 52, COLORC: 56, LIT: 60,
  SCALE: 128, YAWC: 136, YAWS: 144, PITC: 152, PITS: 160,
  FOCAL: 168, DIST: 176, PXRAD: 184, BRIGHT: 192,
};

export const KEY_A = 0x400;
export const KEY_B = 0x800;
export const VERTS = 0xc00;
export const ACCUM = 0x41000;
export const RGBA = 0x141000;
export const SCRATCH = 0x241000;
export const CAP = 8192;
export const PT_CAP = 4096; // slots in each of the two runs
export const STRIDE = 32;
export const FLOATS_PER_VERT = 8;
export const LINES_BASE = VERTS + PT_CAP * STRIDE; // the line run grows up from here
export const KEYSPAN = 0x400;
export const MAX_VIEWPORT = 256;

export const SIZE = { mark: 0.11, pt: 0.06, sml: 0.05, ln: 0.03 };
export const ALPHA = { pt: 0.95, ln: 0.9, dim: 0.4, edge: 0.75, sml: 0.7 };

/** The module's whole surface: both backends must provide exactly this. */
export const EXPORTS = [
  "configure", "setView", "setViewport", "reset",
  "buildComplement", "buildGeodesic", "buildSubcube", "raster",
  "pointCount", "lineCount", "pointPtr", "linePtr",
  "vertexCapacity", "vertexStride", "floatsPerVertex",
  "error", "litPixels", "rgbaPtr", "rgbaBytes",
  "keyPtr", "keyLen", "cellOf", "pushVert",
];

/** Errors the module reports through the params block instead of throwing. */
export const ERR = { OK: 0, OVERFLOW: 1, VIEWPORT: 2, ORDER: 3, KEYLEN: 4 };

/** Defaults shared by both backends — see docs/blink-webgl-wasm.md. */
export const DEFAULTS = {
  order: 7,
  scale: 3.1, // the SCALE constant js/lens-3d.js renders against
  prefix: 21, // 3·order: the projection is honest on the top 21 bits
  diffCap: 10,
  maxSamples: 512,
  colorA: 0x5ce1ff,
  colorB: 0x3dffb0,
  colorC: 0xffb020,
  // null means "derive it from the texture width" (lens3d-wasm.js camera()):
  // the scene spans ±scale at depth dist, so focal = w·0.74·dist/(2·scale)
  // puts the cube edge at ~37% of the side. Deriving rather than hard-coding
  // matters — a fixed focal tuned for 256 px clips most of the geometry out of a
  // 128 px texture, and tuning this is the difference between "it rasterised"
  // and "it rasterised the thing".
  focal: null,
  dist: 5.6,
  pxRadius: 24, // splat radius = pxRadius · (vertex size + 0.5) / depth
  brightness: 0.55,
};

const f32 = (v) => Math.fround(v);

/** Perspective that fits the ±scale cube into `texW` pixels. */
export const focalFor = (texW, scale = DEFAULTS.scale, dist = DEFAULTS.dist) =>
  texW > 0 ? (texW * 0.74 * dist) / (2 * scale) : 171;

/**
 * A shadow module: `memory` plus an `exports` object with the same names, arity
 * and return types as the instantiated WebAssembly module.
 */
export function createLens3dRef() {
  const memory = new WebAssembly.Memory({ initial: PAGES, maximum: PAGES });
  const bytes = () => new Uint8Array(memory.buffer);
  const i32 = () => new Int32Array(memory.buffer);
  const f64 = () => new Float64Array(memory.buffer);
  const f32v = () => new Float32Array(memory.buffer);
  const gd = (slot) => f64()[slot / 8];
  const gi = (slot) => i32()[slot / 4];
  const si = (slot, v) => { i32()[slot / 4] = v; };

  /** prefix bit j of the key at ptr (bit 0 = MSB of byte 0); 0 past the end */
  function bit(ptr, len, j) {
    if ((j >> 3) >>> 0 >= len >>> 0) return 0;
    return (bytes()[ptr + (j >> 3)] >> (7 - (j & 7))) & 1;
  }

  function cell(ptr, len, axis, flip) {
    const order = gi(P.ORDER);
    let acc = 0;
    for (let j = axis, k = 0; k < order; j += 3, k++) {
      const b = bit(ptr, len, j) ^ flip;
      if (b) acc |= 1 << k;
    }
    return acc >>> 0;
  }

  function coordOfCell(c) {
    const d = (1 << gi(P.ORDER)) - 1;
    return ((c / d) * 2 - 1) * gd(P.SCALE);
  }

  const proj = (which, axis, flip) =>
    coordOfCell(cell(which === 0 ? KEY_A : KEY_B, gi(which === 0 ? P.ALEN : P.BLEN), axis, flip));

  function putVert(p, x, y, z, col, size, alpha) {
    const f = f32v();
    f[p / 4] = x;
    f[p / 4 + 1] = y;
    f[p / 4 + 2] = z;
    f[p / 4 + 3] = ((col >> 16) & 255) / 255;
    f[p / 4 + 4] = ((col >> 8) & 255) / 255;
    f[p / 4 + 5] = (col & 255) / 255;
    f[p / 4 + 6] = size;
    f[p / 4 + 7] = alpha;
  }

  function pushPt(x, y, z, col, size, alpha) {
    const n = gi(P.NPTS);
    if (n >= PT_CAP) {
      si(P.ERR, ERR.OVERFLOW);
      return;
    }
    putVert(VERTS + n * STRIDE, x, y, z, col, size, alpha);
    si(P.NPTS, n + 1);
  }

  function pushLn(x0, y0, z0, x1, y1, z1, col, size, alpha) {
    const n = gi(P.NLN);
    if (n + 2 >= PT_CAP) {
      si(P.ERR, ERR.OVERFLOW);
      return;
    }
    const p = LINES_BASE + n * STRIDE;
    putVert(p, x0, y0, z0, col, size, alpha);
    putVert(p + STRIDE, x1, y1, z1, col, size, alpha);
    si(P.NLN, n + 2);
  }

  /** differing prefix bits, in flip order, into the scratch array */
  function collectDiff() {
    const lim = gi(P.PREFIX);
    const cap = gi(P.DIFFCAP);
    const arr = i32();
    let n = 0;
    for (let j = 0; j < lim && n < cap; j++) {
      if (bit(KEY_A, gi(P.ALEN), j) !== bit(KEY_B, gi(P.BLEN), j)) {
        arr[SCRATCH / 4 + n] = j;
        n++;
      }
    }
    return n;
  }

  function cellAt(which, axis, ndiff, mask) {
    const ptr = which === 0 ? KEY_A : KEY_B;
    const len = gi(which === 0 ? P.ALEN : P.BLEN);
    const arr = i32();
    let acc = 0;
    for (let m = 0; m < ndiff; m++) {
      if (!(mask & (1 << m))) continue;
      const b = arr[SCRATCH / 4 + m];
      if (b % 3 === axis) acc ^= 1 << ((b / 3) | 0);
    }
    return (cell(ptr, len, axis, 0) ^ acc) >>> 0;
  }

  const coordAt = (which, axis, ndiff, mask) => coordOfCell(cellAt(which, axis, ndiff, mask));

  const boxCoord = (corner, axis, lo, hi) => (corner & (1 << axis) ? hi : lo);

  function toQ8(v) {
    if (v !== v) return 0; // NaN only arrives from a caller-written vertex
    return Math.trunc(Math.min(Math.max(v, 0), 1) * 255 + 0.5);
  }

  /** one vertex → a disc with linear falloff, accumulated in RGBA f32 */
  function splat(p, w, h) {
    const f = f32v();
    const o = p / 4;
    const x = f[o], y = f[o + 1], z = f[o + 2];
    const r = f[o + 3], g = f[o + 4], b = f[o + 5];
    const size = f[o + 6], alpha = f[o + 7];
    if (x !== x || y !== y || z !== z) return;
    if (alpha === 0) return;
    const yawC = gd(P.YAWC), yawS = gd(P.YAWS), pitC = gd(P.PITC), pitS = gd(P.PITS);
    const focal = gd(P.FOCAL), dist = gd(P.DIST), pxRadius = gd(P.PXRAD), bright = gd(P.BRIGHT);
    const x1 = x * yawC + z * yawS;
    const z1 = z * yawC - x * yawS;
    const y2 = y * pitC - z1 * pitS;
    const z2 = y * pitS + z1 * pitC;
    const depth = z2 + dist;
    if (depth <= 0.000001) return;
    let sx = w / 2 + (x1 * focal) / depth;
    let sy = h / 2 - (y2 * focal) / depth;
    let rr = (pxRadius * (size + 0.5)) / depth;
    if (sx !== sx || sy !== sy || rr !== rr) return;
    // Integer min/max are not in the MVP instruction set, so the module clamps
    // with the sum of the sides; mirrored here for the same reason.
    const maxf = w + h;
    sx = Math.min(Math.max(sx, -maxf), maxf);
    sy = Math.min(Math.max(sy, -maxf), maxf);
    rr = Math.min(Math.max(rr, 0.5), maxf);
    const x0 = Math.max(0, Math.trunc(Math.floor(sx - rr)));
    const x1i = Math.min(w, Math.trunc(Math.ceil(sx + rr)));
    const y0 = Math.max(0, Math.trunc(Math.floor(sy - rr)));
    const y1i = Math.min(h, Math.trunc(Math.ceil(sy + rr)));
    const acc = f32v();
    for (let py = y0; py < y1i; py++) {
      const dy = py + 0.5 - sy;
      for (let px = x0; px < x1i; px++) {
        const dx = px + 0.5 - sx;
        const fall = 1 - Math.sqrt(dx * dx + dy * dy) / rr;
        if (!(fall > 0)) continue;
        const amt = fall * bright;
        // ACCUM/4 is the f32 index of the accumulator's first channel; the
        // module uses the byte address ACCUM + pixel·16 for the same cell.
        const k = ACCUM / 4 + (py * w + px) * 4;
        acc[k] = acc[k] + f32(r * amt);
        acc[k + 1] = acc[k + 1] + f32(g * amt);
        acc[k + 2] = acc[k + 2] + f32(b * amt);
        acc[k + 3] = acc[k + 3] + f32(alpha * amt);
      }
    }
  }

  return {
    memory,
    exports: {
      configure(order, aLen, bLen, flags, scale, prefix, diffCap, maxSamples, colorA, colorB, colorC) {
        if (!(order >= 1 && order <= 10)) {
          si(P.ERR, ERR.ORDER);
          return;
        }
        if (aLen > KEYSPAN || bLen > KEYSPAN) {
          si(P.ERR, ERR.KEYLEN);
          return;
        }
        si(P.ORDER, order); si(P.ALEN, aLen); si(P.BLEN, bLen); si(P.FLAGS, flags);
        f64()[P.SCALE / 8] = scale;
        si(P.PREFIX, prefix); si(P.DIFFCAP, diffCap); si(P.MAXS, maxSamples);
        si(P.COLORA, colorA >>> 0); si(P.COLORB, colorB >>> 0); si(P.COLORC, colorC >>> 0);
      },

      setView(yawCos, yawSin, pitchCos, pitchSin, focal, dist, pxRadius, brightness) {
        const d = f64();
        d[P.YAWC / 8] = yawCos; d[P.YAWS / 8] = yawSin;
        d[P.PITC / 8] = pitchCos; d[P.PITS / 8] = pitchSin;
        d[P.FOCAL / 8] = focal; d[P.DIST / 8] = dist;
        d[P.PXRAD / 8] = pxRadius; d[P.BRIGHT / 8] = brightness;
      },

      setViewport(w, h) {
        if (!(w >= 1 && w <= MAX_VIEWPORT && h >= 1 && h <= MAX_VIEWPORT)) {
          si(P.ERR, ERR.VIEWPORT);
          return 1;
        }
        si(P.TEXW, w); si(P.TEXH, h);
        return 0;
      },

      reset() {
        si(P.NPTS, 0); si(P.NLN, 0); si(P.ERR, 0); si(P.LIT, 0);
      },

      buildComplement() {
        const start = gi(P.NPTS);
        if (!gi(P.ALEN)) return 0;
        const colA = gi(P.COLORA) | 0, colB = gi(P.COLORB) | 0, colC = gi(P.COLORC) | 0;
        const ax = proj(0, 0, 0), ay = proj(0, 1, 0), az = proj(0, 2, 0);
        const nx = proj(0, 0, 1), ny = proj(0, 1, 1), nz = proj(0, 2, 1);
        pushPt(ax, ay, az, colA, SIZE.mark, ALPHA.pt);
        pushPt(nx, ny, nz, colC, SIZE.mark, ALPHA.pt);
        pushLn(ax, ay, az, nx, ny, nz, colC, SIZE.ln, ALPHA.ln);
        if (gi(P.FLAGS) & 1) {
          const bx = proj(1, 0, 0), by = proj(1, 1, 0), bz = proj(1, 2, 0);
          const mx = proj(1, 0, 1), my = proj(1, 1, 1), mz = proj(1, 2, 1);
          pushPt(bx, by, bz, colB, SIZE.mark, ALPHA.pt);
          pushPt(mx, my, mz, colC, SIZE.sml, ALPHA.pt);
          pushLn(bx, by, bz, mx, my, mz, colC, SIZE.ln, ALPHA.dim);
        }
        return gi(P.NPTS) - start;
      },

      buildGeodesic() {
        const start = gi(P.NPTS);
        if (!gi(P.BLEN)) return 0;
        const colA = gi(P.COLORA) | 0, colB = gi(P.COLORB) | 0, colC = gi(P.COLORC) | 0;
        const ndiff = collectDiff();
        let mask = 0;
        let px = coordAt(0, 0, ndiff, mask);
        let py = coordAt(0, 1, ndiff, mask);
        let pz = coordAt(0, 2, ndiff, mask);
        pushPt(px, py, pz, colA, SIZE.pt, ALPHA.pt);
        for (let step = 0; step < ndiff; step++) {
          mask |= 1 << step;
          const cx = coordAt(0, 0, ndiff, mask);
          const cy = coordAt(0, 1, ndiff, mask);
          const cz = coordAt(0, 2, ndiff, mask);
          pushPt(cx, cy, cz, colC, SIZE.pt, ALPHA.pt);
          pushLn(px, py, pz, cx, cy, cz, colC, SIZE.ln, ALPHA.ln);
          px = cx; py = cy; pz = cz;
        }
        pushPt(px, py, pz, colB, SIZE.mark, ALPHA.pt);
        return gi(P.NPTS) - start;
      },

      buildSubcube() {
        const start = gi(P.NPTS);
        if (!gi(P.BLEN)) return 0;
        const colA = gi(P.COLORA) | 0, colB = gi(P.COLORB) | 0, colC = gi(P.COLORC) | 0;
        const ax = proj(0, 0, 0), ay = proj(0, 1, 0), az = proj(0, 2, 0);
        const bx = proj(1, 0, 0), by = proj(1, 1, 0), bz = proj(1, 2, 0);
        pushPt(ax, ay, az, colA, SIZE.mark, ALPHA.pt);
        pushPt(bx, by, bz, colB, SIZE.mark, ALPHA.pt);
        const minx = Math.min(ax, bx), miny = Math.min(ay, by), minz = Math.min(az, bz);
        const maxx = Math.max(ax, bx), maxy = Math.max(ay, by), maxz = Math.max(az, bz);
        for (let k = 0; k < 12; k++) {
          const axis = k >> 2;
          const q = k & 3;
          const a1 = (axis + 1) % 3;
          const a2 = (axis + 2) % 3;
          const c0 = ((q & 1) << a1) | ((q >> 1) << a2);
          const c1 = c0 | (1 << axis);
          pushLn(
            boxCoord(c0, 0, minx, maxx), boxCoord(c0, 1, miny, maxy), boxCoord(c0, 2, minz, maxz),
            boxCoord(c1, 0, minx, maxx), boxCoord(c1, 1, miny, maxy), boxCoord(c1, 2, minz, maxz),
            colC, SIZE.ln, ALPHA.edge
          );
        }
        const ndiff = collectDiff();
        const count = Math.min(1 << ndiff, gi(P.MAXS));
        for (let s = 0; s < count; s++) {
          pushPt(
            coordAt(0, 0, ndiff, s), coordAt(0, 1, ndiff, s), coordAt(0, 2, ndiff, s),
            colC, SIZE.sml, ALPHA.sml
          );
        }
        return gi(P.NPTS) - start;
      },

      raster() {
        const w = gi(P.TEXW), h = gi(P.TEXH);
        if (!w || !h) return 0;
        const npx = w * h;
        const acc = f32v();
        acc.fill(0, ACCUM / 4, ACCUM / 4 + npx * 4);
        for (let i = 0; i < gi(P.NPTS); i++) splat(VERTS + i * STRIDE, w, h);
        for (let i = 0; i < gi(P.NLN); i++) splat(LINES_BASE + i * STRIDE, w, h);
        const out = bytes();
        let lit = 0;
        for (let i = 0; i < npx; i++) {
          const a = acc[ACCUM / 4 + i * 4];
          const q0 = toQ8(a);
          const q1 = toQ8(acc[ACCUM / 4 + i * 4 + 1]);
          const q2 = toQ8(acc[ACCUM / 4 + i * 4 + 2]);
          const q3 = toQ8(acc[ACCUM / 4 + i * 4 + 3]);
          const p = RGBA + i * 4;
          out[p] = q0; out[p + 1] = q1; out[p + 2] = q2; out[p + 3] = q3;
          if (q0 | q1 | q2 | q3) lit++;
        }
        si(P.LIT, lit);
        return lit;
      },

      pointCount: () => gi(P.NPTS),
      lineCount: () => gi(P.NLN),
      pointPtr: () => VERTS,
      linePtr: () => LINES_BASE,
      vertexCapacity: () => CAP,
      vertexStride: () => STRIDE,
      floatsPerVertex: () => FLOATS_PER_VERT,
      error: () => gi(P.ERR),
      litPixels: () => gi(P.LIT),
      rgbaPtr: () => RGBA,
      rgbaBytes: () => gi(P.TEXW) * gi(P.TEXH) * 4,
      keyPtr: (which) => KEY_A + which * KEYSPAN,
      keyLen: (which) => gi(which === 0 ? P.ALEN : P.BLEN),
      cellOf: (which, axis, flip) =>
        cell(which === 0 ? KEY_A : KEY_B, gi(which === 0 ? P.ALEN : P.BLEN), axis, flip),
      pushVert: (x, y, z, col, size, alpha) => pushPt(x, y, z, col, size, alpha),
    },
  };
}
