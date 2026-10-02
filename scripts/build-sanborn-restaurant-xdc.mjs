#!/usr/bin/env node
/** Build the offline Webxdc for the source-readable Sanborn restaurant study. */
import { mkdir, readFile, rm, writeFile, cp } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { zipSync } from "../vendor/fflate/index.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = path.join(root, "public/apps/sanborn-restaurant-4dwm");
const mtime = new Date("2026-10-02T00:00:00.000Z");
const manifest = `name = "Sanborn Restaurant Study — 4Dwm VRML Viewer"
orientation = "landscape"
source_code_url = "https://github.com/shdwelf/Html5"
`;
const webxdc = `// Offline Webxdc compatibility shim. The study has no network or server dependency.\nwindow.webxdc = window.webxdc || {\n  sendUpdate() {},\n  setUpdateListener() {},\n};\n`;

await rm(app, { recursive: true, force: true });
await mkdir(path.join(app, "vendor"), { recursive: true });
await cp(path.join(root, "sanborn-restaurant-4dwm.html"), path.join(app, "index.html"));
await cp(path.join(root, "sanborn-restaurant.wrl"), path.join(app, "sanborn-restaurant.wrl"));
await cp(path.join(root, "vendor/three.module.min.js"), path.join(app, "vendor/three.module.min.js"));
await cp(path.join(root, "vendor/OrbitControls.js"), path.join(app, "vendor/OrbitControls.js"));
await cp(path.join(root, "research/jim-sanborn-source-check.md"), path.join(app, "research-source-check.md"));
await writeFile(path.join(app, "manifest.toml"), manifest);
await writeFile(path.join(app, "webxdc.js"), webxdc);

const files = ["index.html", "sanborn-restaurant.wrl", "research-source-check.md", "manifest.toml", "webxdc.js", "vendor/OrbitControls.js", "vendor/three.module.min.js"];
const archive = {};
for (const file of files) archive[file] = [new Uint8Array(await readFile(path.join(app, file))), { level: 9, mtime }];
const bytes = zipSync(archive, { level: 9, mtime });
const out = path.join(root, "sanborn-restaurant-4dwm.xdc");
await writeFile(out, bytes);
console.log(`wrote ${path.relative(root, out)} (${bytes.length.toLocaleString()} bytes)`);
console.log(`sha256 ${createHash("sha256").update(bytes).digest("hex")}`);
console.log(`entries ${files.length}`);
