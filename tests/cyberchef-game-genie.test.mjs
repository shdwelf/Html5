// NES Game Genie op (T3.1): known-answer tests.
// Vector anchor: SXIOPO is the widely published Super Mario Bros. infinite-
// lives code; decoded here as $91D9 <- $AD, which the encode direction must
// reproduce exactly. Formulas per tuxnes Game Genie notes / NESDev.
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
      window.URL.createObjectURL = () => "blob:game-genie-test";
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
const enc = { mode: "encode", address: "91D9", value: "AD", compare: "" };
const dec = { mode: "decode", address: "91D9", value: "AD", compare: "" };

test("SXIOPO decodes to $91D9 <- $AD and encodes back exactly", async () => {
  const dom = createDom();
  const out = text(await opRun(dom, "gameGenieNes", "SXIOPO", dec));
  assert.match(out, /address: \$91D9/);
  assert.match(out, /value:\s+\$AD/);
  assert.match(out, /compare: \(none/);
  const back = text(await opRun(dom, "gameGenieNes", "", enc));
  assert.match(back, /NES Game Genie SXIOPO/);
});

test("8-letter codes carry a compare byte and round-trip", async () => {
  const dom = createDom();
  const made = text(await opRun(dom, "gameGenieNes", "", { ...enc, address: "C213", value: "0A", compare: "7E" }));
  const code = made.match(/NES Game Genie ([A-Z]{8})/)[1];
  const out = text(await opRun(dom, "gameGenieNes", code, dec));
  assert.match(out, /address: \$C213/);
  assert.match(out, /value:\s+\$0A/);
  assert.match(out, /compare: \$7E/);
});

test("invalid codes and inputs are refused, not guessed", async () => {
  const dom = createDom();
  assert.match(text(await opRun(dom, "gameGenieNes", "SXIOP", dec)), /6- or 8-letter/);
  await assert.rejects(opRun(dom, "gameGenieNes", "SXIOPB", dec), /not in the Game Genie alphabet/);
  assert.match(text(await opRun(dom, "gameGenieNes", "", { ...enc, address: "1234" })), /\$8000-\$FFFF/);
});
