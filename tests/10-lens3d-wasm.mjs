/**
 * 10 · the WebAssembly lens rasteriser, against its JavaScript shadow and
 *      against the projection the repository documents.
 * node tests/10-lens3d-wasm.mjs          (no three.js stub needed: this is
                                           wasm + memory + optional Chromium)
 *
 * Three claims, in order of how much they cost to fake:
 *
 *   [2] wasm agrees with js/spacefill.js keyProjectionCells — i.e. with the
 *       rule KEYSPACE.md states, not merely with itself.
 *   [3] wasm agrees with js/lens3d-ref.js bit for bit, on vertices and on the
 *       rasterised texture. Any rounding difference between the two backends
 *       fails here rather than appearing as a shimmer in a browser.
 *   [7] a real Chromium (Blink + SwiftShader) instantiates the module, uploads
 *       it to WebGL and rasterises — skipped when puppeteer is not installed.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { suite, ROOT } from "./lib.mjs";

const S = await import("../js/lens3d-ref.js");
const W = await import("../js/lens3d-wasm.js");
const SP = await import("../js/spacefill.js");
const F = await import("../js/formal.js");
const s = suite("10 · lens3d wasm rasteriser");

const WASM_PATH = join(ROOT, "wasm", "lens3d.wasm");
const WAT_PATH = join(ROOT, "wasm", "lens3d.wat");
const bytes = existsSync(WASM_PATH) ? readFileSync(WASM_PATH) : null;
s.ok("wasm/lens3d.wasm is committed", bytes !== null, bytes ? `${bytes.length} bytes` : "");

console.log("\n[1] the module assembles from the .wat, validates, and exports the surface");
{
  if (!bytes) {
    console.log("  --  everything below needs the module; run node tools/build_lens3d_wasm.mjs");
    process.exit(s.done() ? 1 : 0);
  }
  let caught = null;
  try {
    await WebAssembly.compile(bytes);
  } catch (e) {
    caught = e;
  }
  s.ok("WebAssembly.compile accepts it", !caught, caught?.message);
  const compiled = await WebAssembly.compile(bytes);
  s.ok("it declares no imports (nothing to inject, nothing to spoof)",
    WebAssembly.Module.imports(compiled).length === 0, `${WebAssembly.Module.imports(compiled).length} imports`);
  const mems = WebAssembly.Module.exports(compiled).filter((e) => e.kind === "memory");
  const inst = await WebAssembly.instantiate(bytes, {});
  s.ok("exactly one memory, 64 pages, and no grow() headroom",
    mems.length === 1 && inst.instance.exports.memory.buffer.byteLength === 64 * 65536,
    `${mems.length} memory, ${inst.instance.exports.memory.buffer.byteLength / 65536} pages`);
  let fresh = null;
  try {
    await checkFresh(compiled, bytes);
  } catch (e) {
    fresh = e.message;
  }
  s.ok("the .wasm is what the .wat assembles to", fresh === null, fresh ?? "byte-identical to a fresh wabt build");

  const wasm = await W.loadLens3d({ backend: "wasm", moduleBytes: bytes });
  const ref = await W.loadLens3d({ backend: "ref" });
  const missing = S.EXPORTS.filter((k) => !(k in wasm.exports));
  const extra = Object.keys(wasm.exports).filter((k) => !S.EXPORTS.includes(k) && k !== "memory");
  s.ok("exports match the declared surface exactly (wasm)", missing.length === 0 && extra.length === 0,
    missing.length ? `missing ${missing.join(",")}` : extra.length ? `extra ${extra.join(",")}` : `${S.EXPORTS.length} exports`);
  s.ok("the shadow exposes the same surface (ref)",
    S.EXPORTS.every((k) => typeof ref.exports[k] === "function"), `${Object.keys(ref.exports).length} keys`);
  s.ok("backend names are what the client claims", wasm.backend === "wasm" && ref.backend === "ref");
}

/** Re-assemble the .wat when wabt happens to be installed; skip otherwise. */
async function checkFresh(compiled, onDisk) {
  let wabt;
  try {
    ({ default: wabt } = await import("wabt"));
  } catch {
    console.log("  --  freshness of lens3d.wasm vs lens3d.wat not checked (npm i --no-save wabt)");
    return true;
  }
  const mod = (await wabt()).parseWat("lens3d.wat", readFileSync(WAT_PATH, "utf8"), {});
  const built = Buffer.from(mod.toBinary({ writeDebugNames: false, generateNameSection: true }).buffer);
  if (built.equals(onDisk)) return true;
  throw new Error(`wasm/lens3d.wasm is stale — run node tools/build_lens3d_wasm.mjs (disk ${onDisk.length} B, assembled ${built.length} B)`);
}

const mk = async (backend, keyA, keyB, cfg) => {
  const api = await W.loadLens3d({ backend, moduleBytes: backend === "wasm" ? bytes : undefined });
  api.configure(keyA, keyB, cfg);
  return api;
};

const cases = (() => {
  const A = new Uint8Array(16), B = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    A[i] = (i * 37 + 11) & 255;
    B[i] = (255 - i * 53) & 255;
  }
  const same = Uint8Array.from(A);
  const antipode = Uint8Array.from(A, (v) => v ^ 0xff);
  const oneBit = Uint8Array.from(A);
  oneBit[0] ^= 0x80;
  return {
    "two keys": { A, B: Uint8Array.from(B) },
    "identical keys": { A, B: same },
    "antipodal keys": { A, B: antipode },
    "one bit apart": { A, B: oneBit },
    "no pair": { A, B: null },
    "short key (6-bit entropy)": { A: A.slice(0, 7), B: null },
    "512-word key (704 B)": { A: new Uint8Array(704).fill(0xa5), B: new Uint8Array(704).fill(0x5a) },
  };
})();

console.log("\n[2] wasm's projection is the projection the docs promise");
for (const order of [1, 2, 7, 10]) {
  let mismatch = 0;
  let checked = 0;
  const api = await mk("wasm", cases["two keys"].A, cases["two keys"].B, { order });
  for (let seed = 0; seed < 60; seed++) {
    const key = new Uint8Array(16);
    let x = 0x9e3779b9 ^ seed;
    for (let i = 0; i < 16; i++) {
      x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
      key[i] = x & 255;
    }
    api.configure(key, null, { order });
    const want = SP.keyProjectionCells(key, order);
    const cells = [want.cx, want.cy, want.cz];
    const mask = (1 << order) - 1;
    for (let axis = 0; axis < 3; axis++) {
      checked++;
      if (api.exports.cellOf(0, axis, 0) !== cells[axis]) mismatch++;
      // ¬k flips every prefix bit, so its cell is the grid complement.
      if (api.exports.cellOf(0, axis, 1) !== (cells[axis] ^ mask)) mismatch++;
    }
  }
  s.ok(`order ${order}: cellOf ≡ keyProjectionCells over ${checked} reads`, mismatch === 0, `${mismatch} mismatches`);
}
{
  // The rule from KEYSPACE.md, checked on the module rather than on prose:
  // d(¬A, B) = ENT − d(A, B). Cells differ on a bit iff the keys differ there.
  const api = await mk("wasm", cases["two keys"].A, cases["two keys"].B, { order: 7 });
  const bits = (which, flip) => {
    let v = 0;
    for (let axis = 0; axis < 3; axis++) v |= api.exports.cellOf(which, axis, flip);
    return v;
  };
  const pop = (n) => {
    let c = 0;
    while (n) { c += n & 1; n >>>= 1; }
    return c;
  };
  const r = F.invertReport(cases["two keys"].A, cases["two keys"].B);
  const cellDiff = [0, 1, 2].reduce((acc, axis) => acc + pop(api.exports.cellOf(0, axis, 0) ^ api.exports.cellOf(1, axis, 0)), 0);
  s.ok("the cells differ on exactly the prefix bits invertReport counts", cellDiff === r.prefixDiff,
    `cells ${cellDiff}, prefixDiff ${r.prefixDiff}, d=${r.d} of ENT ${r.entBits}`);
  const anti = [0, 1, 2].reduce((acc, axis) => acc + pop(api.exports.cellOf(0, axis, 1) ^ api.exports.cellOf(1, axis, 0)), 0);
  s.ok("d(¬A, B) projected = 21 − d(A, B) on the prefix", anti === 21 - r.prefixDiff, `${anti} vs ${21 - r.prefixDiff}`);
  void bits;
}

console.log("\n[3] bit-exact parity with the JavaScript shadow");
for (const [name, k] of Object.entries(cases)) {
  const cfg = { order: 7 };
  const a = await mk("wasm", k.A, k.B, cfg);
  const b = await mk("ref", k.A, k.B, cfg);
  a.setViewport(128, 128);
  b.setViewport(128, 128);
  const ba = a.build();
  const bb = b.build();
  const ra = a.raster();
  const rb = b.raster();
  const eqArr = (p, q) => p.length === q.length && p.every((v, i) => Object.is(v, q[i]));
  s.ok(`${name}: points identical`, eqArr(a.points(), b.points()),
    `${ba.points} pts / ${ba.lines} line verts, ${a.points().length} f32`);
  s.ok(`${name}: lines identical`, eqArr(a.lines(), b.lines()));
  s.ok(`${name}: texture identical`, eqArr(ra.bytes, rb.bytes), `lit ${ra.lit} vs ${rb.lit}`);
  s.ok(`${name}: counts and error state identical`,
    JSON.stringify(a.stats()) === JSON.stringify({ ...b.stats(), backend: a.stats().backend }),
    JSON.stringify({ ...a.stats(), backend: undefined }));
}

console.log("\n[4] geometry the layers claim");
{
  const a = await mk("wasm", cases["two keys"].A, cases["two keys"].B, { order: 7 });
  a.build(["inv-complement"]);
  const p = a.points();
  const l = a.lines();
  const mask = (1 << 7) - 1;
  const cellSum = [0, 1, 2].map((axis) => a.exports.cellOf(0, axis, 0) + a.exports.cellOf(0, axis, 1));
  s.ok("A and ¬A are antipodes on every axis (cells sum to the mask)", cellSum.every((v) => v === mask), cellSum.join("+"));
  // A configured pair turns the layer into two chords: A→¬A and B→¬B.
  s.ok("a key pair gives two markers each and one chord each",
    a.stats().points === 4 && a.stats().lines === 4, JSON.stringify(a.stats()));
  // The line run is not a copy: its two vertices must be exactly the two marker
  // positions, which is what makes the overlay line up at any camera angle.
  s.ok("the chord joins exactly those two markers",
    [0, 1, 2].every((k) => Object.is(l[k], p[k])) && [0, 1, 2].every((k) => Object.is(l[8 + k], p[8 + k])),
    `line (${l[0]},${l[1]},${l[2]}) → (${l[8]},${l[9]},${l[10]})`);
  const ref = await mk("ref", cases["two keys"].A, cases["two keys"].B, { order: 7 });
  ref.build(["inv-complement"]);
  // The two runs sit in one buffer and read back in push order — the property
  // the split-halves layout buys over growing the line run downwards.
  s.ok("line pairs are in push order, both chords present",
    [0, 1, 2].every((k) => Object.is(l[8 + k], p[8 + k])) && [0, 1, 2].every((k) => Object.is(l[16 + k], p[16 + k])),
    `line2 (${l[16].toFixed(2)},${l[17].toFixed(2)},${l[18].toFixed(2)})`);
  s.ok("the shadow reproduces the same vertices", ref.points().length === p.length && ref.points()[0] === p[0]);
}
{
  const a = await mk("wasm", cases["two keys"].A, cases["two keys"].B, { order: 7 });
  a.build(["inv-subcube"]);
  // The subcube box is axis-aligned: every line vertex coordinate equals one of
  // the two endpoints' coordinates on that axis.
  const p = a.points();
  const endpoints = [[p[0], p[8]], [p[1], p[9]], [p[2], p[10]]];
  const l = a.lines();
  let offAxis = 0;
  // One edge is two vertices = 16 f32; iterating by 8 would walk off the end.
  for (let e = 0; e < l.length / 16; e++) {
    for (let axis = 0; axis < 3; axis++) {
      const v0 = l[e * 16 + axis];
      const v1 = l[e * 16 + 8 + axis];
      const [lo, hi] = endpoints[axis];
      if (!Object.is(v0, lo) && !Object.is(v0, hi)) offAxis++;
      if (!Object.is(v1, lo) && !Object.is(v1, hi)) offAxis++;
    }
  }
  s.ok("the sampled box is axis-aligned (Blink-independent geometry claim)",
    offAxis === 0 && l.length / 16 === 12, `${l.length / 16} edges, ${l.length / 8} line verts, ${offAxis} off-axis coords`);
  // 2 endpoint markers + 12 box edges' worth of points? No: markers and samples
  // are the only points; the box is lines. |samples| = min(2^d, maxSamples).
  const ndiff = (() => {
    let n = 0;
    for (let j = 0; j < 21 && n < 10; j++) {
      const A8 = cases["two keys"].A, B8 = cases["two keys"].B;
      if (((A8[j >> 3] >> (7 - (j & 7))) & 1) !== (((B8[j >> 3] >> (7 - (j & 7))) & 1))) n++;
    }
    return n;
  })();
  const wantPoints = 2 + Math.min(1 << ndiff, 512);
  s.ok(`|S| = 2^${ndiff} sampled corners, plus the two endpoints`, a.stats().points === wantPoints,
    `points ${a.stats().points}, expected ${wantPoints}`);
  s.ok(`and 12 edges = 24 line vertices`, a.stats().lines === 24, `lines ${a.stats().lines}`);
}
{
  const a = await mk("wasm", cases["one bit apart"].A, cases["one bit apart"].B, { order: 7 });
  a.build(["inv-geodesic"]);
  const st = a.stats();
  s.ok("one differing prefix bit ⇒ one step ⇒ 3 points, 2 line verts", st.points === 3 && st.lines === 2, JSON.stringify(st));
  const p = a.points();
  const mid = [p[8], p[9], p[10]];
  const start = [p[0], p[1], p[2]];
  const changed = mid.filter((v, i) => !Object.is(v, start[i])).length;
  s.ok("exactly one coordinate moved on that step", changed === 1, `moved axes: ${mid.map((v, i) => (Object.is(v, start[i]) ? "" : "xyz"[i])).join("")}`);
}

console.log("\n[5] determinism and guards");
{
  const one = await mk("wasm", cases["two keys"].A, cases["two keys"].B, {});
  const two = await mk("wasm", cases["two keys"].A, cases["two keys"].B, {});
  one.setViewport(64, 64);
  two.setViewport(64, 64);
  one.build();
  two.build();
  one.raster();
  two.raster();
  s.ok("two runs are byte-identical", one.raster().bytes.every((v, i) => v === two.raster().bytes[i]) && one.points().every((v, i) => v === two.points()[i]));
  s.ok("rebuild after reset reproduces itself", (() => {
    const before = [...one.raster().bytes];
    one.build();
    const after = [...one.raster().bytes];
    return after.every((v, i) => v === before[i]);
  })(), "reset+build+raster is idempotent");
}
{
  const api = await mk("wasm", cases["two keys"].A, cases["two keys"].B, {});
  api.setViewport(64, 64);
  let threw = null;
  try {
    api.setViewport(0, 64);
  } catch (e) {
    threw = e;
  }
  s.ok("a zero-sized viewport is rejected, not clamped", threw && /rejected/.test(threw.message), threw?.message);
  threw = null;
  try {
    api.configure(new Uint8Array(16), null, { order: 0 });
  } catch (e) {
    threw = e;
  }
  s.ok("order 0 is rejected with the module's own error code", threw && /error 3/.test(threw.message), threw?.message);
  threw = null;
  try {
    api.configure(new Uint8Array(1025), null, {});
  } catch (e) {
    threw = e;
  }
  s.ok("an oversized key is refused before the module is asked", threw && /limit is 1024/.test(threw.message), threw?.message);
}
{
  // A non-finite vertex must be dropped, not drawn and not fatal: the module has
  // no libm and i32.trunc_f64_s traps on out-of-range input, so the clamp has to
  // happen first.
  const api = await mk("wasm", cases["two keys"].A, cases["two keys"].B, {});
  api.setViewport(64, 64);
  api.exports.reset();
  api.exports.pushVert(NaN, 0, 0, 0xffb020, 0.06, 0.95);
  api.exports.pushVert(Infinity, 0, 0, 0xffb020, 0.06, 0.95);
  api.exports.pushVert(0, 0, 0, 0xffb020, 0.06, 0.95);
  let lit = 0;
  let trap = null;
  try {
    lit = api.raster().lit;
  } catch (e) {
    trap = e;
  }
  s.ok("NaN / Infinity vertices do not trap the raster", trap === null, trap?.message);
  s.ok("…and the finite vertex still drew", lit > 0, `lit ${lit}`);
  const ref = await mk("ref", cases["two keys"].A, cases["two keys"].B, {});
  ref.setViewport(64, 64);
  ref.exports.reset();
  ref.exports.pushVert(NaN, 0, 0, 0xffb020, 0.06, 0.95);
  ref.exports.pushVert(Infinity, 0, 0, 0xffb020, 0.06, 0.95);
  ref.exports.pushVert(0, 0, 0, 0xffb020, 0.06, 0.95);
  s.ok("the shadow drops them the same way", ref.raster().lit === lit, `${ref.raster().lit} vs ${lit}`);
}
{
  const api = await mk("wasm", cases["two keys"].A, cases["two keys"].B, { maxSamples: 4096 });
  api.setViewport(32, 32);
  api.exports.reset();
  for (let i = 0; i < 8300; i++) api.exports.pushVert(0, 0, 0, 0xffffff, 0.05, 0.9);
  s.ok("the vertex run overflows into an error code, never a trap",
    api.stats().error === 1 && api.stats().points === 4096,
    `points ${api.stats().points} of ${api.exports.vertexCapacity()} slots, error ${api.stats().error}`);
}

console.log("\n[6] the texture actually covers area (not a single blob)");
{
  const api = await mk("wasm", cases["two keys"].A, cases["two keys"].B, {});
  api.setViewport(256, 256);
  api.build();
  const { lit } = api.raster();
  const b = api.raster().bytes;
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, peak = 0;
  for (let i = 0; i < 256 * 256; i++) {
    const v = b[i * 4] | b[i * 4 + 1] | b[i * 4 + 2];
    if (!v) continue;
    const px = i % 256;
    const py = (i / 256) | 0;
    x0 = Math.min(x0, px); x1 = Math.max(x1, px);
    y0 = Math.min(y0, py); y1 = Math.max(y1, py);
    peak = Math.max(peak, b[i * 4], b[i * 4 + 1], b[i * 4 + 2]);
  }
  const span = (a, z) => z - a;
  s.ok("lit pixels are a real fraction of the texture", lit > 400 && lit < 65536, `${lit} of ${256 * 256}`);
  s.ok("the raster spans most of the frame", span(x0, x1) > 96 && span(y0, y1) > 96, `x ${x0}…${x1} y ${y0}…${y1}`);
  s.ok("and saturates somewhere (the tone map is doing its job)", peak === 255, `peak channel ${peak}`);
}

console.log("\n[7] real Blink runs the module (headless Chromium + SwiftShader)");
{
  const { browserDeps, withBrowser, serve, pngLitPixels } = await import("./lib-browser.mjs");
  const deps = await browserDeps();
  if (!deps) {
    console.log("  --  skipped: npm i --no-save puppeteer-core @sparticuz/chromium");
  } else if (!existsSync(join(ROOT, "lens3d-wasm.html"))) {
    console.log("  --  skipped: lens3d-wasm.html is not present");
  } else {
    const { server, port } = await serve(ROOT);
    const FIXED_A = "00112233445566778899aabbccddeeff";
    const FIXED_B = "ffeeddccbbaa99887766554433221100";
    let report = null;
    let png = null;
    let fb = null;
    let fixed = null;
    let pageErrors = [];
    try {
      await withBrowser(deps, async (browser) => {
        const page = await browser.newPage();
        await page.setViewport({ width: 700, height: 700 });
        page.on("pageerror", (e) => pageErrors.push(`pageerror: ${e.message}`));
        page.on("console", (m) => { if (m.type() === "error") pageErrors.push(`console.error: ${m.text()}`); });
        page.on("requestfailed", (r) => pageErrors.push(`requestfailed: ${r.url()} ${r.failure()?.errorText ?? ""}`));
        await page.goto(`http://127.0.0.1:${port}/lens3d-wasm.html?backend=wasm`, { waitUntil: "load" });
        report = await page.evaluate(async () => {
          const wait = (ms) => new Promise((r) => setTimeout(r, ms));
          for (let i = 0; i < 240 && !window.__lens3d; i++) await wait(50);
          return window.__lens3d ? window.__lens3d() : null;
        });
        const el = await page.$("#stage");
        png = el ? await el.screenshot({ type: "png" }) : null;
        await page.screenshot({ path: "/tmp/lens3d-wasm.png" });

        // Same fixed keys, other backend: the promise the shadow exists for is
        // that a host which cannot compile WebAssembly shows the identical
        // picture, so the two loads must agree on counts and on lit pixels.
        await page.goto(
          `http://127.0.0.1:${port}/lens3d-wasm.html?backend=ref&a=${FIXED_A}&b=${FIXED_B}`,
          { waitUntil: "load" }
        );
        fb = await page.evaluate(async () => {
          const wait = (ms) => new Promise((r) => setTimeout(r, ms));
          for (let i = 0; i < 240 && !window.__lens3d; i++) await wait(50);
          return window.__lens3d();
        });
        await page.goto(
          `http://127.0.0.1:${port}/lens3d-wasm.html?backend=wasm&a=${FIXED_A}&b=${FIXED_B}`,
          { waitUntil: "load" }
        );
        fixed = await page.evaluate(async () => {
          const wait = (ms) => new Promise((r) => setTimeout(r, ms));
          for (let i = 0; i < 240 && !window.__lens3d; i++) await wait(50);
          return window.__lens3d();
        });
      });
    } finally {
      server.close();
    }
    s.ok("the page booted in Blink with no page errors", !!report && pageErrors.length === 0, pageErrors.slice(0, 2).join(" · "));
    if (report) {
      s.ok("Chromium instantiated the WebAssembly module", report.backend === "wasm", report.backend);
      s.ok("getContext('webgl') handed back a context", report.context === "webgl", String(report.context));
      s.ok("Blink queued no GL error for our bufferData/texImage2D calls", report.glError === 0, `0x${(report.glError ?? 0).toString(16)}`);
      s.ok("the module's texture reached the canvas", report.litPixels > 100, `${report.litPixels} lit px, ${report.drawCalls} draws`);
      s.ok("wasm and the shadow agree inside the browser too", report.parityExact === true, JSON.stringify(report.parity));
      s.ok("and the module reports no error of its own", report.error === 0, `error ${report.error}`);
      const shot = png && pngLitPixels(Buffer.from(png));
      s.ok("the shadow backend boots in Chromium too", !!fb && fb.backend === "ref" && fb.error === 0,
        fb ? `${fb.backend}, error ${fb.error}` : "not checked");
      s.ok("identical keys through both backends give the identical scene",
        !!fb && !!fixed && fb.points === fixed.points && fb.lines === fixed.lines && fb.litPixels === fixed.litPixels,
        `ref ${fb?.points}/${fb?.lines}/${fb?.litPixels} vs wasm ${fixed?.points}/${fixed?.lines}/${fixed?.litPixels}`);
      s.ok("both self-report exact parity against their peer", !!fb?.parityExact && !!fixed?.parityExact);
      s.ok("the composited screenshot shows lit pixels", !!shot && shot.lit > 200,
        shot ? `${shot.lit}/${shot.total} of ${shot.w}×${shot.h} (readPixels is unreliable without preserveDrawingBuffer; this is the real frame)` : "no decode");
      console.log(`  --  full-page screenshot: /tmp/lens3d-wasm.png`);
    }
  }
}

process.exit(s.done() ? 1 : 0);
