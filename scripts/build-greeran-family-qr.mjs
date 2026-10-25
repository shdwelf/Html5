#!/usr/bin/env node
/**
 * Generate or verify the two collapsed-by-default QR images in the Greeran
 * Family Tree keepsake panel. The human-readable links in the same details
 * panels are the authoritative payloads.
 *
 * The QR codes ship as package-local SVG files (`assets/greeran/*-qr.svg`)
 * referenced by relative `src` paths, so an offline host never sees a
 * `data:` request — tests/greeran-family-ebook-browser.test.mjs asserts every
 * request stays on the local origin.
 *
 *   node scripts/build-greeran-family-qr.mjs          # verify only
 *   node scripts/build-greeran-family-qr.mjs --write  # refresh html srcs + SVG files
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import QRCode from "qrcode";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const htmlPath = path.join(root, "greeran-family-4dwm.html");
const options = {
  type: "svg",
  errorCorrectionLevel: "M",
  margin: 3,
  width: 320,
  color: { dark: "#101820", light: "#ffffff" },
};
const targets = [
  { panel: "qr-family", image: "family", file: "family-tree-qr.svg" },
  { panel: "qr-bible", image: "bible", file: "world-english-bible-epub-qr.svg" },
];

const writeMode = process.argv.includes("--write");
let html = await readFile(htmlPath, "utf8");
let changed = false;

for (const { panel, image, file } of targets) {
  const relSrc = `./assets/greeran/${file}`;
  const absPath = path.join(root, "assets/greeran", file);
  const panelMatch = html.match(new RegExp(`<details\\b[^>]*\\bid="${panel}"[^>]*>([\\s\\S]*?)<\\/details>`));
  if (!panelMatch) throw new Error(`Missing QR panel #${panel}`);
  const body = panelMatch[1];
  const targetMatch = body.match(/<a\b[^>]*\bdata-qr-target\b[^>]*\bhref="([^"]+)"/);
  if (!targetMatch) throw new Error(`Missing direct target link in #${panel}`);
  const targetUrl = targetMatch[1];
  const imageMatch = body.match(new RegExp(`(<img\\b[^>]*\\bdata-qr-image="${image}"[^>]*\\bsrc=")[^"]*(")`));
  if (!imageMatch) throw new Error(`Missing QR image src for ${image}`);

  const svg = await QRCode.toString(targetUrl, options);
  const srcIsLocal = imageMatch[0].includes(relSrc);

  let fileIsFresh = false;
  if (!writeMode) {
    try {
      fileIsFresh = (await readFile(absPath, "utf8")) === svg;
    } catch {
      fileIsFresh = false;
    }
    if (srcIsLocal && fileIsFresh) {
      console.log(`${image}: verified (${relSrc} ← ${targetUrl})`);
      continue;
    }
    throw new Error(`QR image ${image} is stale; run node scripts/build-greeran-family-qr.mjs --write`);
  }

  await writeFile(absPath, svg, "utf8");
  if (!srcIsLocal) {
    const updatedPanel = body.replace(imageMatch[0], `${imageMatch[1]}${relSrc}${imageMatch[2]}`);
    html = html.replace(panelMatch[0], panelMatch[0].replace(body, updatedPanel));
    changed = true;
    console.log(`${image}: src → ${relSrc} (${targetUrl})`);
  } else {
    console.log(`${image}: refreshed ${relSrc} (${targetUrl})`);
  }
}

if (writeMode && changed) {
  await writeFile(htmlPath, html, "utf8");
  console.log(`Updated ${path.basename(htmlPath)}`);
}
