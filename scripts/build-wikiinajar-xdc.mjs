/**
 * Package WIKI IN A JAR — the 2008 USB-stick personal wiki — as a Webxdc bundle.
 *
 * A .xdc is a deflated ZIP rooted at index.html + manifest.toml. The app is
 * authored as a single inline file at the repo root (wikiinajar.html — all
 * CSS/JS inlined, no build step), so this script stages it into
 * public/apps/wikiinajar/ as a flat offline bundle, then zips it
 * deterministically — same flow as build-yubnub-xdc.mjs.
 *
 * The bundle additionally ships the DjVu reader beside the page, because a
 * bare .html cannot carry 1.1 MB of WebAssembly inline and stay a page:
 *   djvu-rs/   vendored MIT djvu-rs 0.42.0 decoder (from tools/wikiinajar,
 *              provenance in tools/wikiinajar/THIRD_PARTY_NOTICES.md)
 *   media/djvu-smoke.djvu   the Unlicense smoke fixture the demo page embeds
 *
 *   node scripts/build-wikiinajar-xdc.mjs   (or: npm run build:wikiinajar)
 */
import { createHash } from "node:crypto";
import { copyFile, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
// Prefer the installed package; fall back to the vendored copy so the build
// works in a bare checkout with no node_modules.
const { zipSync } = await import("fflate").catch(() => import("../vendor/fflate/index.mjs"));

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appDir = path.join(root, "public", "apps", "wikiinajar");
const djvuSrc = path.join(root, "tools", "wikiinajar", "public", "skins", "default", "djvu-rs");
const fixture = path.join(root, "tools", "wikiinajar", "test", "fixtures", "boy.djvu");
const outName = "wikiinajar.xdc";
const mtime = new Date("2026-10-14T00:00:00.000Z"); // reproducible builds

const manifest = `name = "Wiki in a Jar"
source_code_url = "https://github.com/shdwelf/Html5"
`;

await rm(appDir, { recursive: true, force: true });
await mkdir(path.join(appDir, "media"), { recursive: true });

// Inline authoring source -> bundle index.html (unchanged: fully self-contained).
await copyFile(path.join(root, "wikiinajar.html"), path.join(appDir, "index.html"));

// DjVu decoder (scalar + SIMD variants) so [[djvu:...]] renders inside the chat.
async function copyTree(src, dst) {
  await mkdir(dst, { recursive: true });
  for (const e of await readdir(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) await copyTree(s, d);
    else if (e.isFile()) await copyFile(s, d);
  }
}
await copyTree(djvuSrc, path.join(appDir, "djvu-rs"));
await copyFile(fixture, path.join(appDir, "media", "djvu-smoke.djvu"));

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
for (const required of ["index.html", "manifest.toml", "djvu-rs/djvu_rs.js", "media/djvu-smoke.djvu"]) {
  if (!archive[required]) throw new Error(`bundle missing ${required}`);
}

const bytes = zipSync(archive, { level: 9, mtime });
await writeFile(path.join(root, outName), bytes);
await mkdir(path.join(root, "dist"), { recursive: true });
await writeFile(path.join(root, "dist", outName), bytes);

console.log(`Webxdc: ${outName} (${bytes.length.toLocaleString()} bytes, ${Object.keys(archive).length} entries)`);
console.log(`  sha256: ${createHash("sha256").update(bytes).digest("hex")}`);
