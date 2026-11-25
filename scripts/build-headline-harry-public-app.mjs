#!/usr/bin/env node
/** Stage the rights-authorized Headline Harry app assets into the offline catalog. */
import { copyFile, mkdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { unzipSync } from "../vendor/fflate/index.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "webxdc-headline-harry", "app");
const destination = path.join(root, "public", "apps", "headline-harry");
const runtimeFiles = [
  "js-dos/emulators.js",
  "js-dos/js-dos.css",
  "js-dos/js-dos.js",
  "js-dos/wdosbox.js",
  "js-dos/wdosbox.wasm",
  "js-dos/wlibzip.js",
  "js-dos/wlibzip.wasm",
  "roms/headline-harry.jsdos",
  "icon.png",
  "manifest.toml",
  "webxdc.js",
];

const [page, sourcePage, dosRuntime, gameBundle] = await Promise.all([
  readFile(path.join(destination, "index.html")),
  readFile(path.join(source, "index.html")),
  readFile(path.join(source, "js-dos", "js-dos.js"), "utf8"),
  readFile(path.join(source, "roms", "headline-harry.jsdos")),
]);
if (!page.equals(sourcePage)) throw new Error("Headline Harry public page differs from the authorized app shell.");
if (!/window\.Dos\s*=/.test(dosRuntime)) throw new Error("The bundled js-dos runtime does not expose window.Dos.");
if (!page.toString("utf8").includes('url: "roms/headline-harry.jsdos"') ||
    !page.toString("utf8").includes('pathPrefix: "js-dos/"') ||
    !page.toString("utf8").includes("autoStart: true")) {
  throw new Error("Headline Harry start options are not configured for its local js-dos bundle.");
}

const innerFiles = unzipSync(new Uint8Array(gameBundle));
const dosboxConfig = innerFiles[".jsdos/dosbox.conf"];
if (!dosboxConfig) throw new Error("Headline Harry js-dos bundle has no DOSBox startup configuration.");
const configText = new TextDecoder().decode(dosboxConfig);
if (!/^MAP\.EXE\s*$/mi.test(configText) || /^INTRO\.EXE\s*$/mi.test(configText)) {
  throw new Error("The bundled game does not start MAP.EXE directly as documented.");
}

await mkdir(destination, { recursive: true });
for (const relative of runtimeFiles) {
  const from = path.join(source, relative);
  const to = path.join(destination, relative);
  await stat(from);
  await mkdir(path.dirname(to), { recursive: true });
  await copyFile(from, to);
}
console.log(`Staged ${runtimeFiles.length} authorized Headline Harry runtime assets under public/apps/headline-harry.`);
