#!/usr/bin/env node
/**
 * Generate or verify the two embedded, collapsed-by-default QR images in the
 * Greeran Family Tree keepsake panel. The human-readable links in the same
 * details panels are the authoritative payloads.
 *
 *   node scripts/build-greeran-family-qr.mjs          # verify only
 *   node scripts/build-greeran-family-qr.mjs --write  # refresh the HTML data URIs
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
  { panel: "qr-family", image: "family" },
  { panel: "qr-bible", image: "bible" },
];

let html = await readFile(htmlPath, "utf8");
const writeMode = process.argv.includes("--write");
let changed = false;

for (const { panel, image } of targets) {
  const panelMatch = html.match(new RegExp(`<details\\b[^>]*\\bid="${panel}"[^>]*>([\\s\\S]*?)<\\/details>`));
  if (!panelMatch) throw new Error(`Missing QR panel #${panel}`);
  const body = panelMatch[1];
  const targetMatch = body.match(/<a\b[^>]*\bdata-qr-target\b[^>]*\bhref="([^"]+)"/);
  if (!targetMatch) throw new Error(`Missing direct target link in #${panel}`);
  const targetUrl = targetMatch[1];
  const imageMatch = body.match(new RegExp(`(<img\\b[^>]*\\bdata-qr-image="${image}"[^>]*\\bsrc=")[^"]*(")`));
  if (!imageMatch) throw new Error(`Missing QR image data URI for ${image}`);

  const svg = await QRCode.toString(targetUrl, options);
  const dataUri = `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;
  if (imageMatch[0].includes(dataUri)) {
    console.log(`${image}: verified (${targetUrl})`);
    continue;
  }
  if (!writeMode) {
    throw new Error(`QR image ${image} is stale; run node scripts/build-greeran-family-qr.mjs --write`);
  }

  const updatedPanel = body.replace(imageMatch[0], `${imageMatch[1]}${dataUri}${imageMatch[2]}`);
  html = html.replace(panelMatch[0], panelMatch[0].replace(body, updatedPanel));
  changed = true;
  console.log(`${image}: refreshed (${targetUrl})`);
}

if (writeMode && changed) {
  await writeFile(htmlPath, html, "utf8");
  console.log(`Updated ${path.basename(htmlPath)}`);
}
