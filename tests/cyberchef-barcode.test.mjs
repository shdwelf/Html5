import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { JSDOM } from "jsdom";

/**
 * Barcode operations in public/apps/cyberchef/index.html.
 *
 * The Code 39 table and the QR encoder here are verified against two
 * independent encoders (bwip-js and node-qrcode); this file freezes those
 * results as dependency-free known answers so a future edit that breaks a
 * symbology fails here rather than at a scanner.
 */

const html = readFileSync(new URL("../public/apps/cyberchef/index.html", import.meta.url), "utf8");

function boot() {
  const dom = new JSDOM(html, {
    runScripts: "dangerously",
    url: "https://example.test/apps/cyberchef/",
    pretendToBeVisual: true,
    beforeParse(window) {
      window.alert = () => undefined;
      window.confirm = () => false;
      window.prompt = () => null;
      window.URL.createObjectURL = () => "blob:barcode-test";
      window.URL.revokeObjectURL = () => undefined;
      // Plain JSDOM ships no canvas backend. This no-op 2D context lets the ops'
      // drawing code run (and any geometry bug throw) without producing pixels;
      // pixel-level correctness is covered by tests/cyberchef-barcode-pixels.test.mjs.
      window.HTMLCanvasElement.prototype.getContext = () => ({
        fillStyle: "", strokeStyle: "", lineWidth: 1, font: "", textAlign: "", textBaseline: "",
        fillRect() {}, strokeRect() {}, clearRect() {}, fillText() {}, save() {}, restore() {},
        measureText: () => ({ width: 10 }), beginPath() {}, moveTo() {}, lineTo() {}, stroke() {},
        drawImage() {}, getImageData: () => ({ data: new Uint8ClampedArray(4) }),
      });
      window.HTMLCanvasElement.prototype.toDataURL = () => "data:image/png;base64,STUB";
    },
  });
  return dom;
}

/** Runs an operation through the app's real recipe -> bake() pipeline. */
async function bakeOp(dom, opId, args) {
  return dom.window.eval(`(async function(){
    const op = OPERATIONS.find(o => o.id === ${JSON.stringify(opId)});
    if (!op) throw new Error("no such op ${opId}");
    recipe.length = 0;
    const item = { uid: ++opIdCounter, op, args: {} };
    op.args.forEach(a => { item.args[a.key] = a.default; });
    Object.assign(item.args, ${JSON.stringify(args || {})});
    recipe.push(item);
    await bake();
    const err = document.getElementById('out-error');
    if (err && err.style.display !== 'none') throw new Error(err.textContent);
    return {
      text: document.getElementById('output').value,
      html: document.getElementById('preview').innerHTML,
    };
  })()`);
}

test("the merged build boots cleanly with no stranded bootstrap code", () => {
  const dom = boot();
  try {
    // The file used to end with a duplicated tail after </html> that called an
    // InitUi() which was never defined; the parser turned it into visible body
    // text on the page and in every generated SFX build.
    assert.equal(dom.window.eval("typeof InitUi"), "undefined");
    // sfxInitUi() is the real bootstrap; a *bare* InitUi() is the removed artefact.
    assert.doesNotMatch(dom.window.document.body.textContent, /(?<![A-Za-z0-9_$])InitUi\(\)/);
    assert.doesNotMatch(html, /<\/html>\s*[\s\S]+InitUi\(\)/);
    assert.equal(html.match(/<\/html>/g).length, 1, "exactly one document terminator");
  } finally {
    dom.window.close();
  }
});

test("Code 39 table is structurally valid and covers the full alphabet", () => {
  const dom = boot();
  try {
    const check = dom.window.eval(`(function(){
      const out = { chars: BAR_C39.length, patterns: BAR_C39P.length, bad: [] };
      const runs = (p) => { const o = []; let c = p[0], n = 1;
        for (let i = 1; i < p.length; i++) { if (p[i] === c) n++; else { o.push([c, n]); c = p[i]; n = 1; } }
        o.push([c, n]); return o; };
      for (let i = 0; i < BAR_C39P.length; i++) {
        const p = BAR_C39P[i], r = runs(p);
        // A Code 39 character is 9 elements (5 bars, 4 spaces) with exactly 3
        // wide, 15 modules at a 3:1 ratio, starting and ending with a bar.
        if (p.length !== 15 || r.length !== 9 || r.filter(x => x[1] > 1).length !== 3
            || r[0][0] !== '1' || r[8][0] !== '1') out.bad.push(BAR_C39[i]);
      }
      const s = runs(BAR_C39SS);
      out.startStop = { modules: BAR_C39SS.length, elements: s.length, wide: s.filter(x => x[1] > 1).length };
      return out;
    })()`);
    assert.equal(check.chars, 43, "alphabet covers 0-9 A-Z - . space $ / + %");
    assert.equal(check.patterns, check.chars, "one pattern per character — '/ + %' used to have none");
    assert.deepEqual([...check.bad], []);
    assert.deepEqual({ ...check.startStop }, { modules: 15, elements: 9, wide: 3 },
      "the '*' start/stop must be the same 15-module shape as a data character");
  } finally {
    dom.window.close();
  }
});

test("Code 39 encoding matches the reference encoder bit for bit", () => {
  const dom = boot();
  try {
    // Expected values captured from bwip-js's bwipp Code 39 implementation.
    const expected = {
      A: "10001011101110101110101000101110100010111011101",
      HELLO: "100010111011101011101010001110101110101110001010101110101000111010111010100011101110101110100010100010111011101",
      "12345": "100010111011101011101000101011101011100010101110111011100010101010100011101011101110100011101010100010111011101",
      "$/+%": "10001011101110101000100010001010100010001010001010001010001000101010001000100010100010111011101",
    };
    for (const [text, want] of Object.entries(expected)) {
      const got = dom.window.eval(`barCode39(${JSON.stringify(text)})`);
      assert.equal(got, want, `Code 39 of ${JSON.stringify(text)}`);
    }
    // Symbol length must be start + (gap + char) per character + gap + stop.
    for (const text of ["A", "HELLO", "12345"]) {
      assert.equal(dom.window.eval(`barCode39(${JSON.stringify(text)}).length`),
        15 + 16 * text.length + 16, `module count for ${JSON.stringify(text)}`);
    }
    assert.throws(() => dom.window.eval("barCode39('BAD*CHAR')"), /invalid char/,
      "'*' is reserved as the start/stop and must not be encodable as data");
  } finally {
    dom.window.close();
  }
});

test("Code 39 operation renders through bake()", async () => {
  const dom = boot();
  try {
    const out = await bakeOp(dom, "code39", { txt: "HELLO" });
    assert.match(out.html, /data:image\/png;base64,/, "canvas preview emitted");
    assert.match(out.text, /^10001011101110101110101000111010111010/);
  } finally {
    dom.window.close();
  }
});

/** Known-answer vectors captured from node-qrcode in byte mode. */
const QR_VECTORS = [
  { text: "HELLO WORLD", ec: "M", version: 1, size: 21, mask: 4, sha256: "97c1a581e2a1d0759baec4d7f56740bcc7e85a125fe775c93f4aaaec1c67738d" },
  { text: "https://github.com/shdwelf/Html5", ec: "Q", version: 3, size: 29, mask: 6, sha256: "619261108166d9fe3d4838dc4994d432ed73b126702f73d97b2f6dc848a0bbd8" },
  { text: "A", ec: "L", version: 1, size: 21, mask: 0, sha256: "4597c26c5a34a79c80006146bbb14ade03f6a4c8ae35407ee421e7e2830adefc" },
  { text: "0123456789", ec: "H", version: 2, size: 25, mask: 7, sha256: "d50d5925d5f798b8d8c09af15b1e5886e64b928fea1cb5554dc5112938fe85b3" },
  { text: "x".repeat(120), ec: "M", version: 7, size: 45, mask: 2, sha256: "28b4c662aaf1cdc6712ac8ea4d6ec5b96fd674da616c5342502aa4d3b03fd9fe" },
  { text: "ünïcödé ✓", ec: "L", version: 1, size: 21, mask: 2, sha256: "88281db84a6bce304dd70c76026b16aa3592e7160a1773464a3f3f3b3b911927" },
];

test("QR encoder reproduces the reference matrices exactly", () => {
  const dom = boot();
  try {
    for (const v of QR_VECTORS) {
      const got = dom.window.eval(`(function(){
        const q = qrEncode(${JSON.stringify(v.text)}, ${JSON.stringify(v.ec)});
        return { version: q.version, size: q.size, mask: q.mask, bits: Array.prototype.join.call(q.modules, '') };
      })()`);
      assert.equal(got.version, v.version, `version for ${JSON.stringify(v.text.slice(0, 24))} ${v.ec}`);
      assert.equal(got.size, v.size);
      assert.equal(got.size, v.version * 4 + 17, "size = version * 4 + 17");
      assert.equal(got.mask, v.mask, "mask chosen by the penalty rules");
      const digest = createHash("sha256").update(Buffer.from(got.bits.split("").map(Number))).digest("hex");
      assert.equal(digest, v.sha256, `module matrix for ${JSON.stringify(v.text.slice(0, 24))} ${v.ec}`);
    }
  } finally {
    dom.window.close();
  }
});

test("QR function patterns are placed correctly", () => {
  const dom = boot();
  try {
    const check = dom.window.eval(`(function(){
      const q = qrEncode('HELLO WORLD', 'M');
      const n = q.size, g = q.modules, at = (r, c) => g[r * n + c];
      const finderOk = (r0, c0) => {
        for (let dr = 0; dr < 7; dr++) for (let dc = 0; dc < 7; dc++) {
          const ring = Math.max(Math.abs(dr - 3), Math.abs(dc - 3));
          const want = ring === 2 ? 0 : 1;   // 3x3 core (rings 0-1) dark, ring 2 light, ring 3 dark
          if (at(r0 + dr, c0 + dc) !== want) return false;
        }
        return true;
      };
      let timingOk = true;
      for (let i = 8; i < n - 8; i++) {
        if (at(6, i) !== (i % 2 === 0 ? 1 : 0)) timingOk = false;
        if (at(i, 6) !== (i % 2 === 0 ? 1 : 0)) timingOk = false;
      }
      return { finders: finderOk(0, 0) && finderOk(0, n - 7) && finderOk(n - 7, 0),
               timingOk, dark: at(n - 8, 8) };
    })()`);
    assert.equal(check.finders, true, "three 7x7 finder patterns with a light ring");
    assert.equal(check.timingOk, true, "timing patterns alternate");
    assert.equal(check.dark, 1, "always-dark module is set");
  } finally {
    dom.window.close();
  }
});

test("QR capacity limits are reported, not silently truncated", () => {
  const dom = boot();
  try {
    assert.equal(dom.window.eval("qrByteCapacity(40, 0)"), 2953, "version 40 EC L holds 2953 bytes");
    assert.equal(dom.window.eval("qrBestVersion(2953, 0)"), 40);
    assert.equal(dom.window.eval("qrBestVersion(2954, 0)"), -1, "one byte over the largest symbol");
    assert.throws(() => dom.window.eval("qrEncode('x'.repeat(2954), 'L')"), /exceeds the version-40/);
    assert.throws(() => dom.window.eval("qrEncode('x', 'Z')"), /EC level must be/);
  } finally {
    dom.window.close();
  }
});

test("QR operation renders a PNG through bake()", async () => {
  const dom = boot();
  try {
    const out = await bakeOp(dom, "qr", { txt: "HELLO WORLD", ec: "M", scale: "6" });
    assert.match(out.text, /QR Code version 1 \(21x21 modules\) EC M mask 4/);
        // v1-M holds 16 data codewords: floor((16*8 - 4 mode - 8 count) / 8) = 14 bytes.
    assert.match(out.text, /11 payload byte\(s\), capacity 14 bytes/);
    assert.match(out.html, /data:image\/png;base64,STUB/);
  } finally {
    dom.window.close();
  }
});

test("every operation belongs to a recipe pack so SFX can output them all", () => {
  const dom = boot();
  try {
    const cov = dom.window.eval(`(function(){
      const inPack = new Set();
      Object.values(RECIPE_PACKS).forEach(p => p.forEach(e => inPack.add(Array.isArray(e) ? e[0] : e)));
      const opIds = OPERATIONS.map(o => o.id);
      return {
        total: opIds.length,
        packs: Object.keys(RECIPE_PACKS).length,
        missing: opIds.filter(id => !inPack.has(id)),
        dangling: [...inPack].filter(id => !opIds.includes(id)).sort(),
        selectAll: applyRecipePacks(Object.keys(RECIPE_PACKS)),
      };
    })()`);
    assert.deepEqual([...cov.missing], [], "operations with no pack are dropped by the SFX builder");
    assert.deepEqual([...cov.dangling], [], "packs must not reference operations that do not exist");
    assert.equal(cov.selectAll, cov.total, 'SFX "select all" loads the whole registry');
    assert.match(html, new RegExp(`HTML5 · ${cov.total} recipes`), "header count matches the registry");
  } finally {
    dom.window.close();
  }
});

test("barcode operations are registered in the Barcode category", () => {
  const dom = boot();
  try {
    const ops = JSON.parse(dom.window.eval(`JSON.stringify(OPERATIONS.filter(o => o.category === 'Barcode')
      .map(o => ({ id: o.id, name: o.name, args: o.args.map(a => a.key) })))`));
    const byId = Object.fromEntries(ops.map((o) => [o.id, o]));
    for (const id of ["code39", "code128", "ean13", "qr", "averyLabels"]) {
      assert.ok(byId[id], `missing Barcode op ${id}`);
    }
    assert.deepEqual([...byId.qr.args], ["txt", "ec", "scale"]);
    assert.deepEqual([...byId.averyLabels.args],
      ["tpl", "sym", "ec", "vals", "copies", "showText", "cols", "rows", "lw", "lh"]);
    assert.equal(dom.window.eval("Object.keys(LABEL_TEMPLATES).join(',')"), "5160,5161,5163,5392,custom");
  } finally {
    dom.window.close();
  }
});

test("POSTNET / PLANET match the USPS 2-of-5 standard and its check digits", () => {
  const dom = boot();
  try {
    // USPS weights 7-4-2-1-0, two tall bars per digit.
    const want = ["11000", "00011", "00101", "00110", "01001", "01010", "01100", "10001", "10010", "10100"];
    assert.deepEqual([...dom.window.eval("POSTNET_BITS")], want);
    assert.ok(dom.window.eval("POSTNET_BITS").every((b) => b.split("").filter((c) => c === "1").length === 2),
      "every digit is 2-of-5");
    assert.equal(dom.window.eval("postnetCheck([1,2,3,4,5])"), 5, "ZIP 12345 -> check 5");
    assert.equal(dom.window.eval("postnetCheck([3,3,7,2,7,1,4,2,6])"), 5, "ZIP+4 33727-1426 -> check 5");

    const enc = dom.window.eval(
      "(function(){const d=[1,2,3,4,5];const b=postnetBits(d,false);return {bits:String(b),tok:postnetTokens(b)};})()");
    assert.equal(enc.bits[0], "1");
    assert.equal(enc.bits.slice(-1), "1");
    assert.equal(enc.bits.length, 2 + 6 * 5, "frame + (5 payload + 1 check) x 5 bars");

    // PLANET inverts only the digit bars; both symbologies keep full-height frames.
    const both = dom.window.eval(
      "(function(){const d=[1,2,3,4,5];return [String(postnetBits(d,false)),String(postnetBits(d,true))];})()");
    const strip = (s) => s.slice(1, -1);
    assert.equal(strip(both[1]), [...strip(both[0])].map((c) => (c === "1" ? "0" : "1")).join(""));
    assert.equal(both[1][0], "1");
    assert.equal(both[1].slice(-1), "1");

    for (const zip of ["12345", "337271426", "90210"]) {
      const rt = dom.window.eval(`(function(){
        const d = ${JSON.stringify(zip.split("").map(Number))};
        const r = postnetDecodeTokens(postnetTokens(postnetBits(d, false)), false);
        return { digits: r.digits.join(''), valid: r.valid };
      })()`);
      assert.equal(rt.digits, zip);
      assert.equal(rt.valid, true, `POSTNET round-trip ${zip}`);
    }
  } finally {
    dom.window.close();
  }
});

test("Royal Mail RM4SCC and PostNL KIX match the published sample", () => {
  const dom = boot();
  try {
    const enc = dom.window.eval("rmEncode('BX11LT1A', 'rm4scc')");
    assert.equal(enc.check, "I", "the Wikipedia RM4SCC sample BX11LT1A has check character I");
    assert.match(enc.daft, /^[ADFT]+$/, "only the four bar states A/D/F/T occur");
    assert.equal(enc.daft[0], "A", "start is a single ascender bar");
    assert.equal(enc.daft.slice(-1), "F", "stop is a single full-height bar");
    assert.equal(enc.daft.length, 2 + 9 * 4, "2 frame bars + (8 payload + 1 check) x 4 bars");

    const kix = dom.window.eval("rmEncode('BX11LT1A', 'kix')");
    assert.equal(kix.daft.length, 32, "KIX drops the start, stop and check character");
    assert.equal(kix.daft.length % 4, 0, "KIX is a whole number of 4-bar characters");
    assert.equal(enc.daft.length - kix.daft.length, 6, "RM4SCC adds start(1) + check(4) + stop(1)");

    const rt = dom.window.eval(`(function(){
      const e = rmEncode('SW1A1AA', 'rm4scc');
      const d = rmDecodeDaft(e.daft);
      return { ok: d.ok, text: d.text, expect: 'SW1A1AA' + rmCheckChar('SW1A1AA') };
    })()`);
    assert.equal(rt.ok, true);
    assert.equal(rt.text, rt.expect, "RM4SCC encode -> decode round-trip");
  } finally {
    dom.window.close();
  }
});
