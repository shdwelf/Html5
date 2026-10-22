/**
 * Build the SoCal Subsurface 4Dwm payload under the legacy Planet XDC filename.
 *
 * The request is to have the legacy Planet XDC filename deliver the SoCal
 * Subsurface 4Dwm app instead of the Planet package. Keep the established
 * filename so existing download references do not break, but package the
 * canonical SoCal XDC byte for byte (including its truthful SoCal manifest).
 * The standalone Planet authoring
 * page and its research/tests remain available as a browser app.
 *
 *   npm run build:planet
 */

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "socal-subsurface.xdc");
const output = path.join(root, "planet-viewer-4dwm.xdc");
const distDir = path.join(root, "dist");

// Rebuild the canonical SoCal package first, so this compatibility artifact
// can never silently lag behind its source app.
execFileSync(process.execPath, [path.join(root, "scripts", "build-socal-subsurface-xdc.mjs")], {
  cwd: root,
  stdio: "inherit",
});

const bytes = await readFile(source);
await writeFile(output, bytes);
await mkdir(distDir, { recursive: true });
await writeFile(path.join(distDir, path.basename(output)), bytes);

console.log(`Compatibility Webxdc: ${path.basename(output)} (${bytes.length.toLocaleString()} bytes)`);
console.log(`  payload: ${path.basename(source)} (byte-identical SoCal Subsurface 4Dwm)`);
console.log(`  sha256: ${createHash("sha256").update(bytes).digest("hex")}`);
