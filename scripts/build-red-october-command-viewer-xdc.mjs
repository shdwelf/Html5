#!/usr/bin/env node
/**
 * Build the offline Red October story-index viewer and its Webxdc package.
 *
 *   node scripts/build-red-october-command-viewer-xdc.mjs
 *
 * The app uses only its local modules and the Natural Earth outline asset that
 * is already vendored in this repository. The deterministic XDC includes that
 * outline and its public-domain notice; it makes no network requests at run
 * time.
 */

import { createHash } from "node:crypto";
import { deflateSync } from "node:zlib";
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const { zipSync } = await import("fflate").catch(() => import("../vendor/fflate/index.mjs"));

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = path.join(root, "apps", "red-october-command-viewer");
const appDir = path.join(root, "public", "apps", "red-october-command-viewer");
const outputName = "red-october-command-viewer.xdc";
const fixedMtime = new Date("2026-10-09T00:00:00.000Z");

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const name = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, checksum]);
}

function makeIconPng() {
  const width = 256;
  const height = 256;
  const pixels = Buffer.alloc(height * (1 + width * 4));
  const center = 128;
  const globeRadius = 111;
  for (let y = 0; y < height; y += 1) {
    const row = y * (1 + width * 4);
    pixels[row] = 0; // PNG filter: None.
    for (let x = 0; x < width; x += 1) {
      const dx = x - center;
      const dy = y - center;
      const radius = Math.hypot(dx, dy);
      let color = [5, 13, 22, 255];
      if (radius <= globeRadius) {
        const shade = Math.max(0, 1 - radius / (globeRadius * 1.45));
        color = [7 + Math.round(14 * shade), 35 + Math.round(39 * shade), 49 + Math.round(42 * shade), 255];
        const latitudeGrid = Math.abs((dy / globeRadius) * 5);
        const longitudeGrid = Math.abs((dx / globeRadius) * 5);
        if (Math.abs(latitudeGrid - Math.round(latitudeGrid)) < 0.055 || Math.abs(longitudeGrid - Math.round(longitudeGrid)) < 0.045) {
          color = [36, 113, 116, 255];
        }
        if (Math.abs(radius - globeRadius) < 2) color = [89, 224, 191, 255];
      }
      // Minimal hull mark, kept intentionally icon-like rather than a drawing.
      const hullHalfHeight = Math.max(3, Math.round(9 * Math.sqrt(Math.max(0, 1 - ((x - center) / 82) ** 2))));
      if (x >= 46 && x <= 210 && Math.abs(y - 139) <= hullHalfHeight) color = [91, 224, 191, 255];
      if (x >= 121 && x <= 140 && y >= 116 && y <= 135) color = [255, 192, 110, 255];
      const offset = row + 1 + x * 4;
      pixels[offset] = color[0];
      pixels[offset + 1] = color[1];
      pixels[offset + 2] = color[2];
      pixels[offset + 3] = color[3];
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(pixels, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

await rm(appDir, { recursive: true, force: true });
await mkdir(path.join(appDir, "data-sources"), { recursive: true });
for (const name of ["index.html", "app.js", "core.js"]) {
  await copyFile(path.join(sourceDir, name), path.join(appDir, name));
}
await copyFile(path.join(root, "vendor", "world", "countries.geo.json"), path.join(appDir, "world-countries.geo.json"));
await copyFile(path.join(root, "vendor", "world", "README.md"), path.join(appDir, "data-sources", "Natural-Earth-source.md"));
await copyFile(path.join(root, "vendor", "world", "UNLICENSE"), path.join(appDir, "data-sources", "UNLICENSE"));
await copyFile(path.join(sourceDir, "data-sources", "archive-research.md"), path.join(appDir, "data-sources", "archive-research.md"));
await writeFile(path.join(appDir, "icon.png"), makeIconPng());

const manifest = `name = "Red October 4D Command Theater"
source_code_url = "https://github.com/shdwelf/Html5"
description = "Offline fictionalized story-index globe and schematic profile viewer. No real submarine track data or detailed internal layout."
icon = "icon.png"
`;
await writeFile(path.join(appDir, "manifest.toml"), manifest);
await writeFile(
  path.join(appDir, "webxdc.js"),
  `/* Optional Webxdc host shim; this viewer does not use peer messaging. */
window.webxdc = window.webxdc || {
  selfAddr: "local@device",
  selfName: "local",
  sendUpdate() {},
  setUpdateListener: async () => 0,
  getAllUpdates: async () => [],
};
`,
);
await writeFile(
  path.join(appDir, "THIRD_PARTY_NOTICES.md"),
  `# Third-party data notice\n\n` +
  `The low-resolution country outlines in \`world-countries.geo.json\` were copied from this repository's \`vendor/world/countries.geo.json\`. ` +
  `The adjacent \`data-sources/UNLICENSE\` is included with the bundle. See \`data-sources/Natural-Earth-source.md\` for the repository's provenance note.\n\n` +
  `No Archive.org game binary, Jane’s/Bulletin issue scan or article text, real-world submarine track, or bathymetry raster is bundled. ` +
  `The Archive.org, Wayback, TRID, and Bulletin links in \`data-sources/archive-research.md\` are bibliographic pointers; source access and reuse rights remain with their providers.\n`,
);

const bundleFiles = [
  "THIRD_PARTY_NOTICES.md",
  "app.js",
  "core.js",
  "data-sources/archive-research.md",
  "data-sources/Natural-Earth-source.md",
  "data-sources/UNLICENSE",
  "icon.png",
  "index.html",
  "manifest.toml",
  "webxdc.js",
  "world-countries.geo.json",
];
const entries = {};
for (const relativePath of bundleFiles) {
  entries[relativePath] = [new Uint8Array(await readFile(path.join(appDir, relativePath))), { level: 9, mtime: fixedMtime }];
}
const bytes = zipSync(entries, { level: 9, mtime: fixedMtime });
await writeFile(path.join(root, outputName), bytes);
await mkdir(path.join(root, "dist"), { recursive: true });
await writeFile(path.join(root, "dist", outputName), bytes);

console.log(`Webxdc: ${outputName} (${bytes.length.toLocaleString()} bytes, ${bundleFiles.length} entries)`);
console.log(`  sha256: ${createHash("sha256").update(bytes).digest("hex")}`);
