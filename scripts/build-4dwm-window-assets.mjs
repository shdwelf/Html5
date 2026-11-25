#!/usr/bin/env node
/**
 * Keep one reviewed 4DWM window manager in each isolated offline app origin.
 * The WebView intentionally prevents an app from reaching sibling app paths,
 * so each bundle receives the same tiny local module.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = path.join(ROOT, "public", "apps", "_shared", "4dwm-window-manager.js");
const APP_SLUGS = [
  "dalton-race-4dwm",
  "esgvrop-4dwm",
  "glendora-high-4dwm",
  "greeran-subsurface",
  "sanborn-restaurant-4dwm",
];

export function sync4dwmWindowAssets({ checkOnly = false } = {}) {
  if (!existsSync(SOURCE)) throw new Error("Canonical 4DWM window-manager module is missing.");
  const sourceBytes = readFileSync(SOURCE);
  const stale = [];
  for (const slug of APP_SLUGS) {
    const target = path.join(ROOT, "public", "apps", slug, "js", "4dwm-window-manager.js");
    if (checkOnly) {
      if (!existsSync(target) || !readFileSync(target).equals(sourceBytes)) stale.push(slug);
      continue;
    }
    mkdirSync(path.dirname(target), { recursive: true });
    copyFileSync(SOURCE, target);
  }
  if (stale.length) {
    throw new Error(`4DWM window-manager assets are missing or stale for: ${stale.join(", ")}. Run the builder.`);
  }
  return APP_SLUGS;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const checkOnly = process.argv.includes("--check");
  const apps = sync4dwmWindowAssets({ checkOnly });
  console.log(`${checkOnly ? "Verified" : "Synchronized"} the 4DWM window manager for ${apps.length} apps.`);
}
