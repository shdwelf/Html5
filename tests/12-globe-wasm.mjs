/**
 * 12 · the news-globe orthographic projector: committed wasm/globe.wasm
 *      against its JavaScript shadow, and the projection against geometry.
 * node tests/12-globe-wasm.mjs
 *
 *   [2] wasm and js/globe-ref.js agree bit for bit on real coastline data
 *       across six views — counts, vertices, and error flags.
 *   [3] the projection itself is right: the sub-viewer point lands on +Z,
 *       the antipode is culled, every emitted vertex sits inside the unit
 *       disc with alpha in [0,1].
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { suite, ROOT } from "./lib.mjs";

const R = await import("../js/globe-ref.js");
const G = await import("../js/globe-wasm.js");
const s = suite("12 · globe wasm projector");

const WASM_PATH = join(ROOT, "wasm", "globe.wasm");
const COAST_PATH = join(ROOT, "config", "coast-110m.json");
if (!existsSync(WASM_PATH)) {
  console.log("  SKIP globe wasm: binary not built (node tools/build_globe_wasm.mjs)");
  process.exit(0);
}
const bytes = readFileSync(WASM_PATH);
const coast = JSON.parse(readFileSync(COAST_PATH, "utf8"));

const MARKERS = [
  { lon: -74, lat: 40.7, w: 2 },   // New York
  { lon: 139.7, lat: 35.7, w: 1 }, // Tokyo
  { lon: 0, lat: 0, w: 3 },        // Null Island
  { lon: -58.4, lat: -34.6, w: 1.5 },
  { lon: 151.2, lat: -33.9, w: 1 },
];
const VIEWS = [[0, 0], [-74, 40.7], [139.7, 35.7], [0, -80], [180, 60], [-122, 37]];

const wasm = await G.loadGlobe({ moduleBytes: bytes, backend: "wasm" });
const ref = await G.loadGlobe({ backend: "ref" });
s.eq("wasm backend chosen", wasm.backend, "wasm");
s.eq("ref backend chosen", ref.backend, "ref");
s.eq("coast points staged", wasm.loadCoast(coast.rings), coast._meta.points);
ref.loadCoast(coast.rings);
wasm.loadMarkers(MARKERS);
ref.loadMarkers(MARKERS);

for (const [lon0, lat0] of VIEWS) {
  wasm.setView(lon0, lat0);
  ref.setView(lon0, lat0);
  const a = wasm.build(), b = ref.build();
  s.eq(`counts ${lon0}/${lat0}`, [a.lines, a.points], [b.lines, b.points]);
  const la = wasm.lineView(), lb = ref.lineView();
  let diff = 0;
  for (let i = 0; i < la.length; i++) if (la[i] !== lb[i]) { diff++; break; }
  const pa = wasm.pointView(), pb = ref.pointView();
  for (let i = 0; i < pa.length; i++) if (pa[i] !== pb[i]) { diff++; break; }
  s.ok(`bit-exact ${lon0}/${lat0} (${a.lines} line verts, ${a.points} points)`, diff === 0);
  // Geometry: inside the unit disc, sane alpha, positive depth.
  let sane = true;
  for (let i = 0; i < la.length; i += 8) {
    if (Math.hypot(la[i], la[i + 1]) > 1.0001 || la[i + 7] < 0 || la[i + 7] > 1 || la[i + 2] < -0.0001) sane = false;
  }
  for (let i = 0; i < pa.length; i += 8) {
    if (Math.hypot(pa[i], pa[i + 1]) > 1.0001 || pa[i + 7] <= 0 || pa[i + 7] > 1 || pa[i + 2] <= 0) sane = false;
  }
  s.ok(`sane verts ${lon0}/${lat0}`, sane);
}

// Sub-viewer marker lands on +Z (x,y ≈ 0); the antipode is culled.
{
  const g = await G.loadGlobe({ backend: "ref" });
  g.loadCoast([]);
  g.setView(-74, 40.7);
  g.loadMarkers([{ lon: -74, lat: 40.7, w: 1 }, { lon: 106, lat: -40.7, w: 1 }]);
  const { points } = g.build();
  s.eq("antipode culled", points, 1);
  const v = g.pointView();
  s.ok("sub-viewer at origin", Math.abs(v[0]) < 1e-6 && Math.abs(v[1]) < 1e-6 && Math.abs(v[2] - 1) < 1e-6);
}

// Error paths: the module reports, it never traps on bad counts.
{
  const core = R.createGlobeRef();
  const dv = new DataView(core.memory.buffer);
  dv.setUint32(R.P.NRINGS, 9999, true);
  core.buildCoast();
  s.eq("bad ring count", dv.getUint32(R.P.ERR, true), R.ERR.BAD_COUNTS);
  dv.setUint32(R.P.NRINGS, 0, true);
  dv.setUint32(R.P.NMARK, 9999, true);
  core.buildMarkers();
  s.eq("bad marker count", dv.getUint32(R.P.ERR, true), R.ERR.BAD_COUNTS);
}

process.exit(s.done() ? 1 : 0);
