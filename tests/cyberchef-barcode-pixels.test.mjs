// Pixel-level verification of the barcode symbologies, using a real canvas
// backend and two independent reference encoders:
//   - bwip-js  (BWIPP) for the linear barcodes
//   - qrcode   (node-qrcode) for the QR matrices
//
// These are *optional* devDependencies: they pull platform-specific native
// binaries, so a plain `npm install` does not guarantee them. When they are
// missing every test here reports as skipped rather than failing, and the
// dependency-free known-answer suite in tests/cyberchef-barcode.test.mjs still
// covers the same encoders. To run this suite for real:
//
//   npm install --no-save @napi-rs/canvas qrcode bwip-js
//   node --test tests/cyberchef-barcode-pixels.test.mjs
//
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../public/apps/cyberchef/index.html", import.meta.url), "utf8");

/** Resolve the optional pixel dependencies; null if they are not installed. */
async function pixelDeps() {
  try {
    const [{ JSDOM }, canvas, QRCode, bwipjs] = await Promise.all([
      import("jsdom"),
      import("@napi-rs/canvas"),
      import("qrcode"),
      import("bwip-js"),
    ]);
    return { JSDOM: JSDOM.JSDOM ?? JSDOM.default ?? JSDOM, canvas, QRCode: QRCode.default ?? QRCode, bwipjs: bwipjs.default ?? bwipjs };
  } catch {
    return null;
  }
}

const deps = await pixelDeps();

function boot(JSDOM, canvas) {
  const { createCanvas } = canvas;
  return new JSDOM(html, {
    runScripts: "dangerously",
    url: "https://example.test/apps/cyberchef/",
    pretendToBeVisual: true,
    beforeParse(window) {
      window.alert = () => undefined;
      window.confirm = () => false;
      window.prompt = () => null;
      window.URL.createObjectURL = () => "blob:pixels";
      window.URL.revokeObjectURL = () => undefined;
      // Back jsdom's canvas with a real rasteriser so toDataURL() yields pixels.
      window.HTMLCanvasElement.prototype.getContext = function (type) {
        if (!this.__c) this.__c = createCanvas(this.width || 300, this.height || 150);
        const c = this.__c;
        if (c.width !== this.width || c.height !== this.height) { c.width = this.width; c.height = this.height; }
        return c.getContext(type || "2d");
      };
      window.HTMLCanvasElement.prototype.toDataURL = function (t) {
        return this.__c ? this.__c.toDataURL(t || "image/png") : "data:,";
      };
    },
  });
}

/** Runs an operation through the app's real recipe -> bake() pipeline. */
async function bakeOp(dom, opId, args) {
  return JSON.parse(await dom.window.eval(`(async function(){
    const op = OPERATIONS.find(o => o.id === ${JSON.stringify(opId)});
    if (!op) throw new Error("no such op " + ${JSON.stringify(opId)});
    recipe.length = 0;
    const item = { uid: ++opIdCounter, op, args: {} };
    op.args.forEach(a => { item.args[a.key] = a.default; });
    Object.assign(item.args, ${JSON.stringify(args || {})});
    recipe.push(item);
    await bake();
    const err = document.getElementById('out-error');
    if (err && err.style.display !== 'none') throw new Error(err.textContent);
    const prev = document.getElementById('preview');
    return JSON.stringify({ text: document.getElementById('output').value,
      img: (prev.querySelector('img') || {}).src || '' });
  })()`));
}

const pngOf = (src) => Buffer.from(src.replace(/^data:image\/png;base64,/, ""), "base64");

async function toPixels(canvas, dataUrl) {
  const { createCanvas, loadImage } = canvas;
  const img = await loadImage(pngOf(dataUrl));
  const c = createCanvas(img.width, img.height);
  const ctx = c.getContext("2d");
  ctx.drawImage(img, 0, 0);
  return { width: img.width, height: img.height, data: ctx.getImageData(0, 0, img.width, img.height).data };
}

function inkIn(px, x, y, w, h) {
  let n = 0;
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) {
    if (px.data[(j * px.width + i) * 4] < 128) n++;
  }
  return n;
}

/** bwip-js draws one <path> per stroke-width; rebuild the module pattern. */
function bwippModules(bwipjs, bcid, text, opts = {}) {
  const svg = bwipjs.toSVG({ bcid, text, ...opts });
  const vb = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg);
  const bars = [];
  for (const tag of svg.match(/<path[^>]*\/>/g) || []) {
    const sw = +/stroke-width="([\d.]+)"/.exec(tag)[1];
    const d = /\bd="([^"]*)"/.exec(tag)[1];
    for (const m of d.matchAll(/M\s*([\d.]+)[\s,][\d.]+/g)) bars.push([+m[1], sw]);
  }
  const unit = Math.min(...bars.map((b) => b[1]));
  const n = Math.round(+vb[1] / unit);
  const mods = new Array(n).fill(0);
  for (const [x, wd] of bars) {
    for (let i = Math.round((x - wd / 2) / unit); i < Math.round((x + wd / 2) / unit) && i < n; i++) {
      if (i >= 0) mods[i] = 1;
    }
  }
  return mods.join("");
}
const trimQuiet = (s) => s.replace(/^0+/, "").replace(/0+$/, "");

const skip = !deps;
const when = skip ? { skip: "optional pixel deps (@napi-rs/canvas, qrcode, bwip-js) not installed" } : {};

test("every Avery template rasterises a full US Letter sheet with ink on the labels", when, async () => {
  const { canvas } = deps;
  const dom = boot(deps.JSDOM, canvas);
  try {
    for (const [tpl, sym, vals] of [
      ["5160", "code39", "ALPHA\nBRAVO\nCHARLIE"],
      ["5161", "qr", "ONE\nTWO"],
      ["5163", "code128", "X1\nX2\nX3\nX4"],
      ["5392", "qr", "BADGE ONE\nBADGE TWO"],
      ["custom", "qr", "A\nB\nC"],
    ]) {
      const out = await bakeOp(dom, "averyLabels", {
        tpl, sym, ec: "M", vals, copies: "1", showText: true,
        cols: "4", rows: "3", lw: "1.9", lh: "0.8", top: "0.5", left: "0.3",
      });
      assert.match(out.img, /^data:image\/png;base64,/, `${tpl} produced a PNG`);
      const px = await toPixels(canvas, out.img);
      assert.equal(px.width, Math.round(8.5 * 96), `${tpl} sheet is 8.5" wide at 96 dpi`);
      assert.equal(px.height, Math.round(11 * 96), `${tpl} sheet is 11" tall at 96 dpi`);

      const geo = JSON.parse(dom.window.eval(`JSON.stringify(labelTemplate(${JSON.stringify(tpl)},
        { cols: 4, rows: 3, lw: 1.9, lh: 0.8, top: 0.5, left: 0.3, gx: 0, gy: 0 }))`));
      const x = Math.round(geo.left * 96), y = Math.round(geo.top * 96);
      const w = Math.round(geo.lw * 96), h = Math.round(geo.lh * 96);
      assert.ok(inkIn(px, x, y, w, h) > 50, `${tpl}: the first label cell actually has a symbol in it`);
    }
  } finally { dom.window.close(); }
});

test("a QR drawn on a label sheet decodes back to the reference matrix", when, async () => {
  const { canvas, QRCode } = deps;
  const dom = boot(deps.JSDOM, canvas);
  try {
    const txt = "https://github.com/shdwelf/Html5";
    const out = await bakeOp(dom, "averyLabels", {
      tpl: "custom", sym: "qr", ec: "M", vals: txt, copies: "1", showText: false,
      cols: "1", rows: "1", lw: "4", lh: "4", top: "0.5", left: "0.5",
    });
    const px = await toPixels(canvas, out.img);
    const geo = JSON.parse(dom.window.eval(`JSON.stringify(labelTemplate('custom',
      { cols: 1, rows: 1, lw: 4, lh: 4, top: 0.5, left: 0.5, gx: 0, gy: 0 }))`));
    const x0 = Math.round(geo.left * 96), y0 = Math.round(geo.top * 96);
    const w = Math.round(geo.lw * 96), h = Math.round(geo.lh * 96);

    const ref = QRCode.create([{ data: Buffer.from(txt, "utf8"), mode: "byte" }], { errorCorrectionLevel: "M" });
    const n = ref.modules.size;

    // Find the ink bounding box, then sample one point per module.
    let minX = Infinity, minY = Infinity, maxX = -1, maxY = -1;
    for (let j = y0; j < y0 + h; j++) for (let i = x0; i < x0 + w; i++) {
      if (px.data[(j * px.width + i) * 4] < 128) {
        if (i < minX) minX = i; if (i > maxX) maxX = i;
        if (j < minY) minY = j; if (j > maxY) maxY = j;
      }
    }
    const bw = maxX - minX + 1, bh = maxY - minY + 1;
    let diffs = 0;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const sx = Math.round(minX + ((c + 0.5) * bw) / n), sy = Math.round(minY + ((r + 0.5) * bh) / n);
      const dark = px.data[(sy * px.width + sx) * 4] < 128 ? 1 : 0;
      if (dark !== (ref.modules.get(r, c) ? 1 : 0)) diffs++;
    }
    assert.equal(diffs, 0, `all ${n * n} sampled modules match the node-qrcode v${ref.version} matrix`);
  } finally { dom.window.close(); }
});

test("Code 39 matches BWIPP module-for-module", when, () => {
  const { bwipjs } = deps;
  const dom = boot(deps.JSDOM, deps.canvas);
  try {
    for (const txt of ["A", "HELLO", "12345", "$/+%", "THE QUICK BROWN FOX"]) {
      const ref = bwippModules(bwipjs, "code39", txt);
      const got = dom.window.eval(`barCode39(${JSON.stringify(txt)})`);
      assert.equal(trimQuiet(got), trimQuiet(ref), `Code 39 of ${JSON.stringify(txt)} vs BWIPP`);
    }
  } finally { dom.window.close(); }
});

test("the Code 39 mod-43 check character matches BWIPP's", when, () => {
  const { bwipjs } = deps;
  const dom = boot(deps.JSDOM, deps.canvas);
  try {
    for (const txt of ["CODE39", "HELLO", "WIKIPEDIA"]) {
      // BWIPP only appends the mod-43 check character when asked to.
      const ref = bwippModules(bwipjs, "code39", txt, { includecheck: true });
      const got = dom.window.eval(`barCode39(${JSON.stringify(txt)}, true)`);
      assert.equal(trimQuiet(got), trimQuiet(ref), `Code 39 + mod43 of ${JSON.stringify(txt)} vs BWIPP`);
    }
  } finally { dom.window.close(); }
});

test("a bad EAN-13 surfaces an error instead of drawing a broken symbol", when, () => {
  const dom = boot(deps.JSDOM, deps.canvas);
  try {
    assert.throws(
      () => dom.window.eval("renderLabelSheet('5160', 'ean13', 'M', ['notdigits'], { copies: 1, showText: false })"),
      /12 digits/);
  } finally { dom.window.close(); }
});
