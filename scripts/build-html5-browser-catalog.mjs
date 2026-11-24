#!/usr/bin/env node
/** Browser app index and Android share one reviewed public inventory. */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildCatalog } from "./build-html5-offline-launcher-assets.mjs";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export function browserCatalog() {
  return { version: 1, profile: "public", apps: buildCatalog("public").map(({ slug, name, description }) => ({ slug, name, description, href: `./${encodeURIComponent(slug)}/index.html` })) };
}
export function buildBrowserCatalog({ check = false } = {}) {
  const catalog = browserCatalog(), content = JSON.stringify(catalog, null, 2) + "\n";
  const output = join(ROOT, "public/apps/catalog.json");
  if (check) {
    if (readFileSync(output, "utf8") !== content) throw new Error("Browser app catalog is stale; run npm run build:app-catalog.");
  } else writeFileSync(output, content);
  return catalog.apps.length;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(`Browser app catalog validated: ${buildBrowserCatalog({ check: process.argv.includes("--check") })} approved HTML entrypoints.`);
}
