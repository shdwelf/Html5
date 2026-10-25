// Round-12: polyglotScan known-answer tests (JSDOM boot of the registry,
// same harness pattern as tests/cyberchef-round5-ops.test.mjs).
// Vectors mirror tests/polyglot-scan.test.mjs (tools/polyglot_scan.mjs) —
// docs/polyglot-files-deep-dive-2026-10-21.md.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { webcrypto } from "node:crypto";
import { TextEncoder, TextDecoder } from "node:util";
import { JSDOM } from "jsdom";

const appHtml = readFileSync(new URL("../public/apps/cyberchef/index.html", import.meta.url), "utf8");
const bwipSource = readFileSync(new URL("../public/apps/cyberchef/vendor/bwip-js.min.js", import.meta.url), "utf8");
const zxingSource = readFileSync(new URL("../public/apps/cyberchef/vendor/zxing-library.min.js", import.meta.url), "utf8");

function createDom() {
  return new JSDOM(appHtml, {
    runScripts: "dangerously",
    url: "https://example.test/apps/cyberchef/",
    pretendToBeVisual: true,
    beforeParse(window) {
      Object.defineProperty(window, "crypto", { value: webcrypto, configurable: true });
      window.TextEncoder = TextEncoder;
      window.TextDecoder = TextDecoder;
      window.alert = () => undefined;
      window.confirm = () => false;
      window.prompt = () => null;
      window.URL.createObjectURL = () => "blob:polyglot-scan-test";
      window.URL.revokeObjectURL = () => undefined;
      window.fetch = async (url) => {
        const body = String(url).includes("zxing-library.min.js") ? zxingSource : bwipSource;
        return { ok: true, text: async () => body };
      };
    },
  });
}

function opRun(dom, id, input, args) {
  return dom.window.eval(`(async () => {
    const op = OPERATIONS.find(o => o.id === ${JSON.stringify(id)});
    if (!op) throw new Error("missing op " + ${JSON.stringify(id)});
    return await op.run(${JSON.stringify(input)}, ${JSON.stringify(args)});
  })()`);
}

const text = (r) => (r && r.__text) != null ? r.__text : String(r);

let dom;
test("registry boots with polyglotScan and the spotlight pack", () => {
  dom = createDom();
  const ids = dom.window.eval("OPERATIONS.map(o => o.id)");
  assert.ok(ids.includes("polyglotScan"), "polyglotScan registered");
  const packs = dom.window.eval("JSON.stringify(Object.keys(RECIPE_PACKS))");
  assert.match(packs, /Polyglot & format triage/);
});

test("polyglotScan: GIF + ZIP hex input classifies parasite-or-stack", async () => {
  const out = text(await opRun(dom, "polyglotScan", "47 49 46 38 39 61 50 4b 03 04", {}));
  assert.match(out, /parasite-or-stack/);
  assert.match(out, /GIF89a \(image\/gif\)/);
  assert.match(out, /ZIP local file \(application\/zip\)/);
});

test("polyglotScan: doubled JPEG marker overlaps = chimera-candidate", async () => {
  const out = text(await opRun(dom, "polyglotScan", "ffd8ffd8ff", {}));
  assert.match(out, /chimera-candidate/);
});

test("polyglotScan: plain text is unknown", async () => {
  const out = text(await opRun(dom, "polyglotScan", "hello, plain text only", { inputfmt: "text" }));
  assert.match(out, /unknown/);
});
