// globe-wasm.js — client for the news-globe orthographic projector.
//
// The module in wasm/globe.wasm rotates coastline/marker unit-vectors behind
// the sub-viewer point, clips coast segments at the horizon, and emits the
// interleaved 8×f32 vertices WebGL draws; this file owns the boundary: it
// instantiates the module (or the JS shadow), stages coast/marker data, sets
// the per-frame view, and hands back the two GPU uploads.
//
// Backends ("auto" picks wasm when it compiles and says which it chose):
//   · "wasm"   wasm/globe.wasm
//   · "ref"    js/globe-ref.js — bit-identical (tests/12), for hosts that
//              refuse WebAssembly (CSP without wasm-unsafe-eval, webxdc).
// Memory is initial:maximum 11 pages, never grown; views are taken once.

import {
  createGlobeRef, P, RINGS, RING_CAP, COAST, COAST_CAP, MARKERS, MARK_CAP,
  LINEVERTS, LINE_CAP, POINTVERTS, POINT_CAP, STRIDE, DEFAULTS, ERR,
} from "./globe-ref.js";

export const ATTRIBS = [
  { name: "aPos", offset: 0, size: 3 },
  { name: "aColor", offset: 12, size: 3 },
  { name: "aSize", offset: 24, size: 1 },
  { name: "aAlpha", offset: 28, size: 1 },
];

export { P, LINEVERTS, POINTVERTS, STRIDE, DEFAULTS, ERR };

/** Haversine-free bake: lat/lon degrees → unit xyz (f64; rounded on store). */
export function latLonToXyz(lon, lat) {
  const la = (lon * Math.PI) / 180, ph = (lat * Math.PI) / 180;
  return [Math.cos(ph) * Math.cos(la), Math.cos(ph) * Math.sin(la), Math.sin(ph)];
}

async function instantiateWasm(root, log, bytes) {
  if (bytes) {
    const { instance } = await WebAssembly.instantiate(
      bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes), {}
    );
    return instance;
  }
  const url = new URL("globe.wasm", root).href;
  if (typeof WebAssembly.instantiateStreaming === "function") {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const { instance } = await WebAssembly.instantiateStreaming(res, {});
        return instance;
      }
      log(`globe: ${url} answered ${res.status}, falling back to arrayBuffer`);
    } catch (err) {
      log(`globe: streaming compile failed (${err.message}), falling back to arrayBuffer`);
    }
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`globe.wasm: HTTP ${res.status}`);
  const { instance } = await WebAssembly.instantiate(await res.arrayBuffer(), {});
  return instance;
}

/**
 * @param {object} [opts]
 * @param {string|URL} [opts.root] base URL for wasm/globe.wasm
 * @param {Uint8Array|ArrayBuffer} [opts.moduleBytes] skip the fetch (Node hosts)
 * @param {"auto"|"wasm"|"ref"} [opts.backend]
 * @param {(msg:string)=>void} [opts.log]
 */
export async function loadGlobe(opts = {}) {
  const { root = documentBase(), moduleBytes = null, backend = "auto", log = () => {} } = opts;
  let inst = null, chosen = "ref";
  if (backend === "wasm" || backend === "auto") {
    try {
      inst = await instantiateWasm(root, log, moduleBytes);
      chosen = "wasm";
    } catch (err) {
      if (backend === "wasm") throw err;
      log(`globe: wasm unavailable (${err.message}), using JS shadow`);
    }
  }
  const core = inst ? inst.exports : createGlobeRef();
  const memory = core.memory;
  const dv = new DataView(memory.buffer);
  const f32 = new Float32Array(memory.buffer);
  const u32 = new Uint32Array(memory.buffer);

  const setView = (lon0, lat0) => {
    const l = (lon0 * Math.PI) / 180, p = (lat0 * Math.PI) / 180;
    dv.setFloat32(P.C0, Math.cos(l), true);
    dv.setFloat32(P.S0, Math.sin(l), true);
    dv.setFloat32(P.C1, Math.sin(p), true);
    dv.setFloat32(P.S1, -Math.cos(p), true);
  };

  const setStyle = (style = {}) => {
    const d = { ...DEFAULTS, ...style };
    dv.setFloat32(P.COAST_R, d.coast[0], true);
    dv.setFloat32(P.COAST_G, d.coast[1], true);
    dv.setFloat32(P.COAST_B, d.coast[2], true);
    dv.setFloat32(P.MARK_R, d.mark[0], true);
    dv.setFloat32(P.MARK_G, d.mark[1], true);
    dv.setFloat32(P.MARK_B, d.mark[2], true);
    dv.setFloat32(P.MARK_SIZE, d.markSize, true);
    dv.setFloat32(P.LIMB, d.limb, true);
  };

  /** rings: array of [[lon,lat],…]; returns point count (throws past caps). */
  const loadCoast = (rings) => {
    if (rings.length > RING_CAP) throw new Error(`too many rings (${rings.length})`);
    let n = 0;
    rings.forEach((ring, r) => {
      u32[RINGS / 4 + r * 2] = n;
      u32[RINGS / 4 + r * 2 + 1] = ring.length;
      for (const [lon, lat] of ring) {
        if (n >= COAST_CAP) throw new Error("coast exceeds 8192 points");
        f32.set(latLonToXyz(lon, lat), COAST / 4 + n * 3);
        n++;
      }
    });
    dv.setUint32(P.NPTS, n, true);
    dv.setUint32(P.NRINGS, rings.length, true);
    return n;
  };

  /** markers: [{lon, lat, w}]; returns count (throws past the cap). */
  const loadMarkers = (markers) => {
    if (markers.length > MARK_CAP) throw new Error(`too many markers (${markers.length})`);
    markers.forEach((m, i) => {
      f32.set([...latLonToXyz(m.lon, m.lat), m.w ?? 1], MARKERS / 4 + i * 4);
    });
    dv.setUint32(P.NMARK, markers.length, true);
    return markers.length;
  };

  /** Rebuild both vertex runs for the current view; returns {lines, points}. */
  const build = () => {
    core.buildCoast();
    if (dv.getUint32(P.ERR, true) !== ERR.OK) throw new Error("buildCoast err " + dv.getUint32(P.ERR, true));
    const lines = dv.getUint32(P.NLNV, true);
    core.buildMarkers();
    if (dv.getUint32(P.ERR, true) !== ERR.OK) throw new Error("buildMarkers err " + dv.getUint32(P.ERR, true));
    const points = dv.getUint32(P.NPTV, true);
    return { lines, points };
  };

  const lineView = () => new Float32Array(memory.buffer, LINEVERTS, dv.getUint32(P.NLNV, true) * 8);
  const pointView = () => new Float32Array(memory.buffer, POINTVERTS, dv.getUint32(P.NPTV, true) * 8);

  setStyle();
  return { backend: chosen, memory, setView, setStyle, loadCoast, loadMarkers, build, lineView, pointView };
}

function documentBase() {
  try {
    // the page lives in apps/, the module in wasm/
    return new URL("../wasm/", document.baseURI).href;
  } catch {
    return new URL("../wasm/", import.meta.url).href;
  }
}
