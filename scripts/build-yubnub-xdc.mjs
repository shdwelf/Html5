/**
 * Package YUBNUB — command line for the web — as a Webxdc bundle.
 *
 * A .xdc is a deflated ZIP rooted at index.html + manifest.toml. The app is
 * authored as a single inline file at the repo root (yubnub.html — all CSS/JS
 * inlined, no build step), so this script stages it into
 * public/apps/yubnub/ as a flat offline bundle, then zips it deterministically
 * — same flow as build-four-corners-xdc.mjs / build-cia-museum-xdc.mjs.
 *
 *   node scripts/build-yubnub-xdc.mjs
 */
import { createHash } from "node:crypto";
import { copyFile, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
// Prefer the installed package; fall back to the vendored copy so the build
// works in a bare checkout with no node_modules.
const { zipSync } = await import("fflate").catch(() => import("../vendor/fflate/index.mjs"));

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appDir = path.join(root, "public", "apps", "yubnub");
const outName = "yubnub.xdc";
const mtime = new Date("2026-10-13T00:00:00.000Z"); // reproducible builds

const manifest = `name = "Yubnub"
source_code_url = "https://github.com/shdwelf/Html5"
`;

await rm(appDir, { recursive: true, force: true });
await mkdir(appDir, { recursive: true });

// Inline authoring source -> bundle index.html (unchanged: fully self-contained).
await copyFile(path.join(root, "yubnub.html"), path.join(appDir, "index.html"));

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
await writeFile(path.join(appDir, "manifest.toml"), manifest);
try {
  await copyFile(path.join(root, "icon.png"), path.join(appDir, "icon.png"));
} catch { /* icon is optional in a webxdc */ }

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(abs)));
    else if (e.isFile()) out.push(abs);
  }
  return out;
}

const archive = {};
for (const abs of (await walk(appDir)).sort()) {
  const rel = path.relative(appDir, abs).split(path.sep).join("/");
  archive[rel] = [new Uint8Array(await readFile(abs)), { level: 9, mtime }];
}
if (!archive["index.html"] || !archive["manifest.toml"]) throw new Error("bundle missing index.html/manifest.toml");

const bytes = zipSync(archive, { level: 9, mtime });
await writeFile(path.join(root, outName), bytes);
await mkdir(path.join(root, "dist"), { recursive: true });
await writeFile(path.join(root, "dist", outName), bytes);

console.log(`Webxdc: ${outName} (${bytes.length.toLocaleString()} bytes, ${Object.keys(archive).length} entries)`);
console.log(`  sha256: ${createHash("sha256").update(bytes).digest("hex")}`);
