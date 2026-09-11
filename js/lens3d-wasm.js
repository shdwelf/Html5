/**
 * lens3d-wasm.js — client for the keyspace lens rasteriser, WebAssembly or JS.
 *
 * The module in wasm/lens3d.wasm builds the vertex data for the three
 * projection-determined 3-D lens layers and rasterises them into an RGBA buffer;
 * this file owns the boundary: it instantiates the module, publishes typed views
 * over its linear memory, and hands the two GPU uploads a WebGL context wants.
 *
 * Two backends, one surface:
 *
 *   · "wasm"   wasm/lens3d.wasm, instantiated here
 *   · "ref"    js/lens3d-ref.js, the shadow implementation
 *
 * They must agree bit for bit (tests/10-lens3d-wasm.mjs), which is what makes
 * the fallback honest rather than a second rendering path to maintain, and lets
 * the module be exercised on hosts that refuse to compile WebAssembly: a
 * document without `wasm-unsafe-eval` in its CSP, or a webxdc runtime that
 * disables it. `backend: "auto"` picks wasm when it works and says which it
 * chose; "require" surfaces the instantiation error instead of degrading.
 *
 * The memory is declared `initial: maximum: 64` pages in both backends and is
 * never grown. That is deliberate, not laziness: growing a wasm memory detaches
 * its old ArrayBuffer, and any typed-array view of the previous buffer starts
 * reading as undefined/0-length. Views are taken once and kept — see
 * docs/blink-webgl-wasm.md, which cites the Blink paths that enforce this.
 */

import {
  createLens3dRef,
  P,
  focalFor,
  LINES_BASE,
  KEY_A,
  KEYSPAN,
  PAGES,
  STRIDE,
  VERTS,
  CAP,
  FLOATS_PER_VERT,
  MAX_VIEWPORT,
  DEFAULTS,
  ERR,
  EXPORTS,
} from "./lens3d-ref.js";

export const LAYERS = ["inv-subcube", "inv-geodesic", "inv-complement"];
export const GL = {
  ARRAY_BUFFER: 0x8892,
  STATIC_DRAW: 0x88e4,
  DYNAMIC_DRAW: 0x88e8,
  TEXTURE_2D: 0x0de1,
  RGBA: 0x1908,
  UNSIGNED_BYTE: 0x1401,
  LINEAR: 0x2601,
  POINTS: 0x0000,
  LINES: 0x0001,
  COLOR_ATTACHMENT0: 0x8ce0,
  FRAMEBUFFER: 0x8d40,
};

const BUILDERS = {
  "inv-subcube": "buildSubcube",
  "inv-geodesic": "buildGeodesic",
  "inv-complement": "buildComplement",
};

/** The vertex layout both backends write and the shader reads. */
export const ATTRIBS = [
  { name: "aPos", offset: 0, size: 3 },
  { name: "aColor", offset: 12, size: 3 },
  { name: "aSize", offset: 24, size: 1 },
  { name: "aAlpha", offset: 28, size: 1 },
];

/**
 * @param {string|URL} root
 * @param {(msg:string)=>void} log
 * @param {ArrayBuffer|Uint8Array} [bytes] pre-read module bytes, for hosts with
 *   no fetch of file: URLs — the Node test harness passes the checked-in
 *   wasm/lens3d.wasm straight off disk, exactly as a webxdc host would after it
 *   unzipped the bundle.
 */
async function instantiateWasm(root, log, bytes) {
  if (bytes) {
    const { instance } = await WebAssembly.instantiate(
      bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes), {}
    );
    return instance;
  }
  const url = new URL("lens3d.wasm", root).href;
  // instantiateStreaming compiles while the bytes stream; it needs the right
  // content type, so a host that answers with anything else falls back rather
  // than failing (same shape as the WebGL context fallback the VRML viewer
  // uses: try the fast path, degrade, keep a note of why).
  if (typeof WebAssembly.instantiateStreaming === "function") {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const { instance } = await WebAssembly.instantiateStreaming(res, {});
        return instance;
      }
      log(`lens3d: ${url} answered ${res.status}, falling back to arrayBuffer`);
    } catch (err) {
      log(`lens3d: streaming compile failed (${err.message}), falling back to arrayBuffer`);
    }
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`lens3d.wasm: HTTP ${res.status}`);
  const { instance } = await WebAssembly.instantiate(await res.arrayBuffer(), {});
  return instance;
}

/**
 * @param {object} [opts]
 * @param {string|URL} [opts.root]    base URL for wasm/lens3d.wasm
 * @param {Uint8Array|ArrayBuffer} [opts.moduleBytes] skip the fetch (Node hosts)
 * @param {"auto"|"wasm"|"ref"} [opts.backend]
 * @param {(msg:string)=>void} [opts.log]
 */
export async function loadLens3d(opts = {}) {
  const log = opts.log || (() => {});
  const want = opts.backend || "auto";
  let backend = "ref";
  let memory;
  let exports_;

  if (want !== "ref") {
    try {
      const root = new URL(opts.root || "../wasm/", import.meta.url);
      const instance = await instantiateWasm(root, log, opts.moduleBytes);
      const missing = EXPORTS.filter((k) => !(k in instance.exports));
      if (missing.length) throw new Error(`module is missing exports: ${missing.join(", ")}`);
      exports_ = instance.exports;
      memory = exports_.memory;
      backend = "wasm";
    } catch (err) {
      if (want === "wasm") throw err;
      log(`lens3d: WebAssembly unavailable (${err.message}), using the JS shadow`);
    }
  }
  if (!exports_) {
    const shadow = createLens3dRef();
    memory = shadow.memory;
    exports_ = shadow.exports;
  }

  const f32 = () => new Float32Array(memory.buffer);
  const u8 = () => new Uint8Array(memory.buffer);
  if (memory.buffer.byteLength !== PAGES * 65536) {
    throw new Error(`lens3d: expected a ${PAGES}-page memory, got ${memory.buffer.byteLength} bytes`);
  }

  const api = {
    backend,
    memory,
    exports: exports_,
    defaults: DEFAULTS,
    layerNames: LAYERS,
    errorNames: ERR,

    /**
     * Load up to two keys and the lens parameters. `keyA`/`keyB` accept
     * Uint8Array / ArrayBuffer / typed view / array of byte values; `keyB` may
     * be omitted for the single-key layers.
     */
    configure(keyA, keyB = null, opts2 = {}) {
      const cfg = { ...DEFAULTS, ...opts2 };
      const a = toBytes(keyA);
      const b = keyB === null || keyB === undefined ? new Uint8Array(0) : toBytes(keyB);
      if (a.length > KEYSPAN) throw new Error(`lens3d: key A is ${a.length} bytes, the limit is ${KEYSPAN}`);
      if (b.length > KEYSPAN) throw new Error(`lens3d: key B is ${b.length} bytes, the limit is ${KEYSPAN}`);
      u8().set(a, KEY_A);
      u8().set(b, KEY_A + KEYSPAN);
      exports_.configure(
        cfg.order, a.length, b.length, b.length ? 1 : 0, cfg.scale,
        cfg.prefix, cfg.diffCap, cfg.maxSamples,
        cfg.colorA >>> 0, cfg.colorB >>> 0, cfg.colorC >>> 0
      );
      api.setView(cfg);
      const err = exports_.error();
      if (err) throw new Error(`lens3d: configure rejected the request (error ${err})`);
      return api;
    },

    setView(cfg = {}) {
      api.__viewCfg = cfg;
      const c = api.camera(cfg);
      exports_.setView(c.yawCos, c.yawSin, c.pitchCos, c.pitchSin, c.focal, c.dist, c.pxRadius, c.brightness);
      api.__camera = c;
      return api;
    },

    /**
     * The camera, resolved once. The module's raster and the GPU shader are
     * handed *these* numbers, so the two views of the same vertex buffer cannot
     * drift apart by a re-derived sin() somewhere else.
     */
    camera(cfg = {}) {
      const v = { ...DEFAULTS, ...cfg };
      // The texture width the raster will use, read from the module's own
      // parameter block: one source of truth for "how big is the picture".
      const texW = new Int32Array(memory.buffer)[P.TEXW / 4];
      return {
        yawCos: Math.cos(v.yaw || 0), yawSin: Math.sin(v.yaw || 0),
        pitchCos: Math.cos(v.pitch || 0), pitchSin: Math.sin(v.pitch || 0),
        focal: v.focal ?? focalFor(texW, v.scale, v.dist),
        dist: v.dist, pxRadius: v.pxRadius, brightness: v.brightness,
        order: v.order, scale: v.scale, texW,
      };
    },

    /** The same camera, as the uniforms the vertex shader needs. */
    applyView(gl, program, dims = { w: 256, h: 256 }) {
      const c = api.__camera || api.camera({});
      const u = (name) => gl.getUniformLocation(program, name);
      gl.uniform1f(u("uYawC"), c.yawCos);
      gl.uniform1f(u("uYawS"), c.yawSin);
      gl.uniform1f(u("uPitC"), c.pitchCos);
      gl.uniform1f(u("uPitS"), c.pitchSin);
      gl.uniform1f(u("uDist"), c.dist);
      gl.uniform1f(u("uFocal"), c.focal);
      gl.uniform1f(u("uPxRadius"), c.pxRadius);
      gl.uniform1f(u("uBright"), c.brightness);
      // pixels → clip: the module maps a vertex to W/2 + x·focal/depth, so the
      // shader has to multiply by 2/W to land in the same place.
      gl.uniform1f(u("uClipX"), 2 / dims.w);
      gl.uniform1f(u("uClipY"), 2 / dims.h);
      return api;
    },

    setViewport(w, h) {
      if (exports_.setViewport(w, h) !== 0) {
        throw new Error(`lens3d: viewport ${w}×${h} rejected (both sides must be 1…${MAX_VIEWPORT})`);
      }
      // A derived focal depends on the viewport, so changing one re-applies the
      // other: callers may set them in either order and still get a picture.
      if (api.__viewCfg) api.setView(api.__viewCfg);
      return api;
    },

    /** Rebuild the vertex buffer from scratch (idempotent for a fixed key). */
    build(layers = LAYERS) {
      exports_.reset();
      const built = [];
      for (const id of layers) {
        const fn = BUILDERS[id];
        if (!fn) throw new Error(`lens3d: no wasm builder for layer "${id}"`);
        built.push({ id, points: exports_[fn]() });
      }
      return { built, ...api.stats() };
    },

    /** Typed views onto the two vertex runs; both share one interleaved layout. */
    points() {
      const n = exports_.pointCount();
      return new Float32Array(memory.buffer, VERTS, n * FLOATS_PER_VERT);
    },
    /** Line vertices, in push order: drawArrays(GL_LINES, 0, 2·edges) reads them straight. */
    lines() {
      const n = exports_.lineCount();
      return new Float32Array(memory.buffer, exports_.linePtr(), n * FLOATS_PER_VERT);
    },
    vertexBytes() {
      return CAP * STRIDE;
    },

    /**
     * Upload both vertex runs into one buffer with two subData calls: the point
     * run grows up from the base and the line run grows down from the far end,
     * so the pair never needs a re-allocating bufferData per frame.
     *
     * The sizing call is `bufferData(target, size, usage)` — the GLsizeiptr
     * overload — and the payload calls are the ArrayBufferView overloads; those
     * three shapes are the whole reason this file bothers to check Blink at all
     * (docs/blink-webgl-wasm.md).
     */
    uploadVertices(gl, vbo, usage = GL.DYNAMIC_DRAW) {
      const total = api.vertexBytes();
      gl.bindBuffer(GL.ARRAY_BUFFER, vbo);
      gl.bufferData(GL.ARRAY_BUFFER, total, usage);
      const nPts = exports_.pointCount();
      const nLn = exports_.lineCount();
      const mem = memory.buffer;
      if (nPts > 0) {
        gl.bufferSubData(GL.ARRAY_BUFFER, 0, new Float32Array(mem, VERTS, nPts * FLOATS_PER_VERT));
      }
      if (nLn > 0) {
        gl.bufferSubData(
          GL.ARRAY_BUFFER,
          LINES_BASE - VERTS,
          new Float32Array(mem, exports_.linePtr(), nLn * FLOATS_PER_VERT)
        );
      }
      return { bytes: total, points: nPts, lines: nLn };
    },

    /** Point the interleaved record at a program's attributes. */
    bindAttribs(gl, program) {
      const loc = {};
      for (const a of ATTRIBS) {
        const at = gl.getAttribLocation(program, a.name);
        loc[a.name] = at;
        if (at < 0) continue;
        gl.enableVertexAttribArray(at);
        gl.vertexAttribPointer(at, a.size, gl.FLOAT, false, STRIDE, a.offset);
      }
      return loc;
    },

    /** Rasterise into the module's RGBA buffer and return it for a texture upload. */
    raster() {
      const lit = exports_.raster();
      return { lit, bytes: new Uint8Array(memory.buffer, exports_.rgbaPtr(), exports_.rgbaBytes()) };
    },

    stats() {
      return {
        backend: api.backend,
        points: exports_.pointCount(),
        lines: exports_.lineCount(),
        capacity: exports_.vertexCapacity(),
        strideF32: exports_.floatsPerVertex(),
        error: exports_.error(),
        litPixels: exports_.litPixels(),
      };
    },
  };

  return api;
}

function toBytes(v) {
  if (v instanceof Uint8Array) return v;
  if (v instanceof ArrayBuffer) return new Uint8Array(v);
  if (ArrayBuffer.isView(v)) return new Uint8Array(v.buffer, v.byteOffset, v.byteLength);
  if (Array.isArray(v)) return Uint8Array.from(v);
  throw new TypeError(`lens3d: expected bytes, got ${Object.prototype.toString.call(v)}`);
}

/**
 * The shader that consumes the interleaved record. Kept here rather than in the
 * page so the buffer contract has exactly one description.
 */
export const SHADER = {
  vertex: `attribute vec3 aPos; attribute vec3 aColor; attribute float aSize; attribute float aAlpha;
uniform float uYawC, uYawS, uPitC, uPitS, uDist, uFocal, uPxRadius, uBright, uClipX, uClipY;
uniform mediump int uTextured;
varying vec2 vUv; varying lowp vec3 vColor; varying lowp float vAlpha;
void main() {
  if (uTextured == 1) {
    // The textured path: this program only samples what the module rasterised,
    // so the quad is already in clip space and needs no camera.
    vUv = aPos.xy * 0.5 + 0.5;
    vColor = vec3(1.0); vAlpha = 1.0;
    gl_Position = vec4(aPos.xy, 0.0, 1.0);
    gl_PointSize = 1.0;
    return;
  }
  // Exactly the module's maths: yaw about Y, pitch about X, one-point
  // perspective, then pixels → clip with the same 2/W the raster uses.
  float x1 = aPos.x * uYawC + aPos.z * uYawS;
  float z1 = aPos.z * uYawC - aPos.x * uYawS;
  float y2 = aPos.y * uPitC - z1 * uPitS;
  float z2 = aPos.y * uPitS + z1 * uPitC;
  float depth = max(z2 + uDist, 0.000001);
  float s = uFocal / depth;
  gl_Position = vec4(x1 * s * uClipX, -y2 * s * uClipY, 0.0, 1.0);
  gl_PointSize = max(1.0, uPxRadius * (aSize + 0.5) / depth);
  vUv = vec2(0.0);
  vColor = aColor; vAlpha = aAlpha * uBright;
}`,
  fragment: `precision mediump float;
uniform sampler2D uTex; uniform mediump int uTextured;
varying vec2 vUv; varying lowp vec3 vColor; varying lowp float vAlpha;
void main() {
  if (uTextured == 1) { gl_FragColor = texture2D(uTex, vUv); return; }
  gl_FragColor = vec4(vColor, vAlpha);
}`,
};

/** The four f32 fields, in the order the module writes and the shader reads. */
export const QUAD = new Float32Array([
  // x y z   r g b size alpha
  -1, -1, 0, 1, 1, 1, 0, 1,
  1, -1, 0, 1, 1, 1, 0, 1,
  -1, 1, 0, 1, 1, 1, 0, 1,
  1, 1, 0, 1, 1, 1, 0, 1,
]);
