import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const djvuPackage = path.join(
  repoRoot,
  "tools/wikiinajar/public/skins/default/djvu-rs",
);
const fixturePath = path.join(repoRoot, "tools/wikiinajar/test/fixtures/boy.djvu");

test("vendored djvu-rs parses and renders a DjVu page", async () => {
  const modulePath = pathToFileURL(path.join(djvuPackage, "djvu_rs.js")).href;
  const decoder = await import(modulePath);
  const variant = decoder.wasmSimd128Supported() ? "simd128" : "scalar";
  const wasmBytes = new Uint8Array(
    readFileSync(path.join(djvuPackage, variant, "djvu_rs_bg.wasm")),
  );
  await decoder.default(wasmBytes);

  const doc = decoder.WasmDocument.from_bytes(new Uint8Array(readFileSync(fixturePath)));
  try {
    assert.equal(doc.page_count(), 1);
    const page = doc.page(0);
    try {
      const dpi = 72;
      const width = page.width_at(dpi);
      const height = page.height_at(dpi);
      const pixels = page.render(dpi);
      assert.ok(width > 0 && height > 0);
      assert.equal(pixels.length, width * height * 4);
      assert.ok(pixels.some((channel, index) => index % 4 !== 3 && channel < 250));
    } finally {
      page.free();
    }
  } finally {
    doc.free();
  }
});
