// Real-image LSB decode for the CyberChef stego lab (T9.1 follow-on).
// The pixel bit-walk is canvas-free when source=rgba-hex, so these are true
// known-answer tests in JSDOM: synthetic RGBA fixtures built below, decoded
// by the shipped op. Fixtures are generated here — no image files involved.
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
      window.URL.createObjectURL = () => "blob:stego-lsb-test";
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

/** Hide bytes MSB-first in one channel's LSBs of a synthetic RGBA buffer. */
function hideInChannel(bytes, channelOffset = 0, pixels = 64) {
  const px = new Uint8Array(pixels * 4);
  for (let i = 0; i < px.length; i += 4) { px[i] = 0x10; px[i + 1] = 0x20; px[i + 2] = 0x30; px[i + 3] = 0xff; }
  const bits = [];
  for (const b of bytes) for (let i = 7; i >= 0; i--) bits.push((b >> i) & 1);
  bits.forEach((bit, i) => { const at = i * 4 + channelOffset; px[at] = (px[at] & 0xfe) | bit; });
  return Buffer.from(px).toString("hex");
}

const base = { secret: "SECRET", source: "rgba-hex", channels: "R", framing: "terminator", byteCount: 64 };

test("stegoLSB decodes a real pixel stream (0xFF terminator framing)", async () => {
  const dom = createDom();
  const hex = hideInChannel([0x48, 0x49, 0xff]); // "HI" + terminator
  const out = text(await opRun(dom, "stegoLSB", hex, { ...base, mode: "decode" }));
  assert.match(out, /0xFF terminator at byte 2/);
  assert.match(out, /bytes: 2 \(100% printable\)/);
  assert.match(out, /\nHI$/);
});

test("stegoLSB decodes length-prefixed payloads on other channels", async () => {
  const dom = createDom();
  const msg = [0x4f, 0x4b, 0x21]; // "OK!"
  const hex = hideInChannel([0, 0, 0, msg.length, ...msg], 1); // G channel
  const out = text(await opRun(dom, "stegoLSB", hex, { ...base, mode: "decode", channels: "G", framing: "length32" }));
  assert.match(out, /stopped: length prefix/);
  assert.match(out, /\nOK!$/);
});

test("stegoLSB refuses nonsense instead of inventing output", async () => {
  const dom = createDom();
  const bad = text(await opRun(dom, "stegoLSB", "not an image", { ...base, mode: "decode", source: "image" }));
  assert.match(bad, /needs an image/);
  const badHex = text(await opRun(dom, "stegoLSB", "zz", { ...base, mode: "decode" }));
  assert.match(badHex, /expects an even-length hex dump/);
  // A length prefix that exceeds pixel capacity must fail closed.
  const over = hideInChannel([0xff, 0xff, 0xff, 0xff, 0x41], 0);
  await assert.rejects(
    opRun(dom, "stegoLSB", over, { ...base, mode: "decode", framing: "length32" }),
    /exceeds pixel capacity/,
  );
});
