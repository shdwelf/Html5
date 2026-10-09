#!/usr/bin/env node
/**
 * Package the merged Html5 CyberChef kitchen as a Webxdc bundle.
 *
 *   node scripts/build-cyberchef-xdc.mjs
 *
 * The input is the merged `public/apps/cyberchef/index.html` produced by
 * `scripts/merge-cyberchef-recipes.mjs`. The bundle is deterministic and runs
 * offline; the shim is replaced by a real Webxdc host at runtime.
 */

import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const { zipSync } = await import("fflate").catch(() => import("../vendor/fflate/index.mjs"));

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appDir = path.join(root, "public", "apps", "cyberchef-merged");
const outName = "cyberchef.xdc";
const mtime = new Date("2026-10-07T00:00:00.000Z");

await rm(appDir, { recursive: true, force: true });
await mkdir(appDir, { recursive: true });

await copyFile(path.join(root, "public", "apps", "cyberchef", "index.html"), path.join(appDir, "index.html"));
await copyFile(path.join(root, "icon.png"), path.join(appDir, "icon.png"));

// Read the operation count off the kitchen's own header badge so the manifest
// description can never drift from the build it describes.
const kitchenHtml = await readFile(path.join(root, "public", "apps", "cyberchef", "index.html"), "utf8");
const opCount = (kitchenHtml.match(/HTML5 · (\d+) recipes/) || [])[1] || "0";

const manifest = `name = "CyberChef Kitchen (Html5 merged)"
source_code_url = "https://github.com/shdwelf/Html5"
description = "Offline HTML5 CyberChef build — ${opCount} operations after the Html5 / Html5-sync-incoming recipe merge."
icon = "icon.png"
`;
await writeFile(path.join(appDir, "manifest.toml"), manifest);
await writeFile(
  path.join(appDir, "webxdc.js"),
  `/* webxdc simulator shim - the host overrides this file at runtime. */
window.webxdc = window.webxdc || {
  selfAddr: "local@device",
  selfName: "local",
  sendUpdate() {},
  setUpdateListener: async () => 0,
  getAllUpdates: async () => [],
};
`,
);

const files = ["icon.png", "index.html", "manifest.toml", "webxdc.js"];
const archive = {};
for (const rel of files) {
  archive[rel] = [new Uint8Array(await readFile(path.join(appDir, rel))), { level: 9, mtime }];
}
const bytes = zipSync(archive, { level: 9, mtime });
await writeFile(path.join(root, outName), bytes);
await mkdir(path.join(root, "dist"), { recursive: true });
await writeFile(path.join(root, "dist", outName), bytes);

console.log(`Webxdc: ${outName} (${bytes.length.toLocaleString()} bytes, ${files.length} entries)`);
console.log(`  sha256: ${createHash("sha256").update(bytes).digest("hex")}`);
