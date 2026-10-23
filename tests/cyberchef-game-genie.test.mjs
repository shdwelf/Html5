// Game Genie ops (T3.1): NES + SNES known-answer tests.
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

const encS = { mode: "encode", address: "C4A704", value: "C9", map: "none" };
const decS = { mode: "decode", address: "C4A704", value: "C9", map: "none" };

test("SNES: ABCD-EFFF is C4A704:C9 (published worked example) and round-trips", async () => {
  const dom = createDom();
  const out = text(await opRun(dom, "gameGenieSnes", "ABCD-EFFF", decS));
  assert.match(out, /address \(CPU\): \$C4A704/);
  assert.match(out, /value:\s+\$C9/);
  const back = text(await opRun(dom, "gameGenieSnes", "", encS));
  assert.match(back, /SNES Game Genie ABCD-EFFF/);
});

test("SNES: LoROM conversion and bad input handling", async () => {
  const dom = createDom();
  const out = text(await opRun(dom, "gameGenieSnes", "ABCD-EFFF", { ...decS, map: "lorom" }));
  assert.match(out, /LoROM file offset \(headerless\): \$622704/);
  assert.match(text(await opRun(dom, "gameGenieSnes", "ABCDEFF", decS)), /8-character/);
  await assert.rejects(opRun(dom, "gameGenieSnes", "ABCD-EFFZ", decS), /not in the SNES Game Genie alphabet/);
});

const encGb = { mode: "encode", address: "B123", value: "FF", compare: "7E" };
const decGb = { mode: "decode", address: "B123", value: "FF", compare: "" };

test("GB/GG: FF1-234-123 is $B123 <- $FF with compare $7E (source check-byte example)", async () => {
  const dom = createDom();
  const out = text(await opRun(dom, "gameGenieGb", "FF1-234-123", decGb));
  assert.match(out, /address: \$B123/);
  assert.match(out, /value:\s+\$FF/);
  assert.match(out, /compare: \$7E/);
  const back = text(await opRun(dom, "gameGenieGb", "", encGb));
  assert.match(back, /Game Genie FF1-234-103/); // ignored middle digit emitted as 0
  // ...and that twin decodes identically:
  const twin = text(await opRun(dom, "gameGenieGb", back.match(/Game Genie (\S+)/)[1], decGb));
  assert.match(twin, /address: \$B123/);
  assert.match(twin, /compare: \$7E/);
  const noCmp = text(await opRun(dom, "gameGenieGb", "", { ...encGb, compare: "" }));
  assert.match(noCmp, /Game Genie FF1-234\n/);
});

const encGen = { mode: "encode", address: "BE47BD", value: "1F00" };
const decGen = { mode: "decode", address: "BE47BD", value: "1F00" };

test("Genesis: ABD5-78F7 is BE47BD:1F00 (published worked example) and round-trips", async () => {
  const dom = createDom();
  const out = text(await opRun(dom, "gameGenieGenesis", "ABD5-78F7", decGen));
  assert.match(out, /address: \$BE47BD/);
  assert.match(out, /value:\s+\$1F00/);
  const back = text(await opRun(dom, "gameGenieGenesis", "", encGen));
  assert.match(back, /Game Genie ABD5-78F7/);
  await assert.rejects(opRun(dom, "gameGenieGenesis", "ABD5-78FI", decGen), /not in the Genesis Game Genie alphabet/);
  assert.match(text(await opRun(dom, "gameGenieGenesis", "", { ...encGen, value: "1F000" })), /16-bit hex word/);
});
