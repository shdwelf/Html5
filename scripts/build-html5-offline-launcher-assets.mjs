#!/usr/bin/env node
/**
 * Stage every public/apps/<name>/index.html app for the offline Android
 * launcher. Assets are copied only into Gradle's ignored build directory;
 * the repository keeps one canonical copy under public/apps/.
 *
 *   node scripts/build-html5-offline-launcher-assets.mjs --check
 *   node scripts/build-html5-offline-launcher-assets.mjs --out-dir \
 *     apps/html5-offline-launcher/app/build/generated/html5-assets
 */

import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { sync4dwmWindowAssets } from "./build-4dwm-window-assets.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_APPS = join(ROOT, "public", "apps");
const EXPECTED_ENTRYPOINTS = 93;
const APP_SLUG_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const HOST_LABEL_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EXTERNAL_RESOURCE_PATTERN = /<(?:script|link|img|iframe|video|audio|source|object)\b[^>]*?\b(?:src|href)\s*=\s*(["'])https?:\/\//is;

function readOptional(filePath) {
  try {
    return readFileSync(filePath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return "";
    throw error;
  }
}

function unquoteTomlBasicString(value) {
  return value
    .replace(/\\(["\\])/g, "$1")
    .replace(/\\n/g, " ")
    .replace(/\\r/g, " ")
    .replace(/\\t/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tomlString(text, key) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(
    new RegExp(`^\\s*${escapedKey}\\s*=\\s*"((?:[^"\\\\]|\\\\.)*)"`, "m"),
  );
  return match ? unquoteTomlBasicString(match[1]) : "";
}

function htmlTitle(text) {
  const match = text.match(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i);
  if (!match) return "";
  return match[1]
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function titleFromSlug(slug) {
  return slug
    .replace(/[._-]+/g, " ")
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function hostToken(slug) {
  return slug.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
}

function shortHash(value) {
  return createHash("sha256").update(value, "utf8").digest("hex").slice(0, 8);
}

function checkAppSlug(slug) {
  if (!APP_SLUG_PATTERN.test(slug)) {
    throw new Error(`Unsupported app directory name: ${JSON.stringify(slug)}`);
  }
}

export function discoverApps() {
  if (!existsSync(PUBLIC_APPS)) {
    throw new Error(`Apps directory not found: ${PUBLIC_APPS}`);
  }

  const apps = readdirSync(PUBLIC_APPS, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(PUBLIC_APPS, entry.name, "index.html")))
    .map((entry) => {
      checkAppSlug(entry.name);
      const directory = join(PUBLIC_APPS, entry.name);
      const indexPath = join(directory, "index.html");
      const index = readFileSync(indexPath, "utf8");
      const manifest = readOptional(join(directory, "manifest.toml"));
      const name = tomlString(manifest, "name") || htmlTitle(index) || titleFromSlug(entry.name);
      const description =
        tomlString(manifest, "description") ||
        (index.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i)?.[1] ?? "")
          .replace(/\s+/g, " ")
          .trim();

      return {
        slug: entry.name,
        sourceType: "directory",
        directory,
        name,
        description: description.slice(0, 280),
        hasRemoteResources: EXTERNAL_RESOURCE_PATTERN.test(index),
      };
    });

  const seen = new Set();
  for (const app of apps) {
    if (seen.has(app.slug)) throw new Error(`Duplicate offline launcher app slug: ${app.slug}`);
    seen.add(app.slug);
  }
  return apps.sort((left, right) => left.slug.localeCompare(right.slug, "en"));
}

export function assignAppHosts(apps) {
  const groups = new Map();
  for (const app of apps) {
    const base = hostToken(app.slug);
    if (!base) throw new Error(`Cannot create a local host for app ${app.slug}`);
    const group = groups.get(base) ?? [];
    group.push(app.slug);
    groups.set(base, group);
  }

  const hostBySlug = new Map();
  const usedHosts = new Set(["catalog.invalid"]);
  for (const [base, slugs] of groups) {
    for (const slug of slugs) {
      const collisionSuffix = slugs.length > 1 ? `-${shortHash(slug)}` : "";
      const label = `app-${base}${collisionSuffix}`;
      if (!HOST_LABEL_PATTERN.test(label)) {
        throw new Error(`Invalid local hostname label for ${slug}: ${label}`);
      }
      const host = `${label}.invalid`;
      if (usedHosts.has(host)) throw new Error(`Duplicate local app host: ${host}`);
      usedHosts.add(host);
      hostBySlug.set(slug, host);
    }
  }
  return hostBySlug;
}

function catalogFromApps(apps) {
  const hosts = assignAppHosts(apps);
  return apps
    .map(({ slug, name, description, hasRemoteResources }) => ({
      slug,
      host: hosts.get(slug),
      name,
      description,
      hasRemoteResources,
    }))
    .sort(
      (left, right) =>
        left.name.localeCompare(right.name, "en", { sensitivity: "base" }) ||
        left.slug.localeCompare(right.slug, "en"),
    );
}

export function buildCatalog() {
  return catalogFromApps(discoverApps());
}

function checkInventory() {
  sync4dwmWindowAssets({ checkOnly: true });
  const catalog = buildCatalog();
  if (catalog.length !== EXPECTED_ENTRYPOINTS) {
    throw new Error(
      `Expected ${EXPECTED_ENTRYPOINTS} HTML app entrypoints; found ${catalog.length}. ` +
        "Review the launcher inventory and update its acceptance test if the corpus changed.",
    );
  }
  if (catalog.some((app) => !app.host || !app.name || !app.slug)) {
    throw new Error("Catalog contains an incomplete app record.");
  }
  console.log(`Validated ${catalog.length} local HTML entrypoints.`);
  const remoteApps = catalog.filter((app) => app.hasRemoteResources).map((app) => app.slug);
  console.log(
    remoteApps.length
      ? `Static external-resource markers in index.html: ${remoteApps.join(", ")}`
      : "No static external-resource markers found in index.html.",
  );
}

function stageAppSource(app, destination) {
  cpSync(app.directory, destination, { recursive: true, dereference: true, force: true });
}

function writeStagedAssets(outDir) {
  const output = resolve(outDir);
  const allowedRoot = resolve(ROOT, "apps", "html5-offline-launcher", "app", "build") + sep;
  if (!output.startsWith(allowedRoot)) {
    throw new Error(`Refusing to write outside the launcher Gradle build directory: ${output}`);
  }

  sync4dwmWindowAssets();
  const sourceApps = discoverApps();
  const catalog = catalogFromApps(sourceApps);
  if (catalog.length !== EXPECTED_ENTRYPOINTS) {
    throw new Error(
      `Expected ${EXPECTED_ENTRYPOINTS} HTML app entrypoints; found ${catalog.length}.`,
    );
  }

  rmSync(output, { recursive: true, force: true });
  mkdirSync(join(output, "apps"), { recursive: true });
  mkdirSync(join(output, "launcher"), { recursive: true });

  for (const app of sourceApps) {
    const destination = join(output, "apps", app.slug);
    stageAppSource(app, destination);
  }

  writeFileSync(
    join(output, "launcher", "catalog.json"),
    `${JSON.stringify({ version: 1, apps: catalog }, null, 2)}\n`,
    "utf8",
  );
  const fileCount = catalog.reduce((count, app) => {
    const walk = (directory) =>
      readdirSync(directory, { withFileTypes: true }).reduce(
        (sum, entry) => sum + (entry.isDirectory() ? walk(join(directory, entry.name)) : 1),
        0,
      );
    return count + walk(join(output, "apps", app.slug));
  }, 0);
  const rawBytes = catalog.reduce((total, app) => {
    const walk = (directory) =>
      readdirSync(directory, { withFileTypes: true }).reduce((sum, entry) => {
        const path = join(directory, entry.name);
        return sum + (entry.isDirectory() ? walk(path) : statSync(path).size);
      }, 0);
    return total + walk(join(output, "apps", app.slug));
  }, 0);
  console.log(
    `Staged ${catalog.length} apps / ${fileCount.toLocaleString("en-US")} files ` +
      `(${rawBytes.toLocaleString("en-US")} bytes uncompressed) at ${output}`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.includes("--check")) {
    checkInventory();
  } else {
    const outIndex = args.indexOf("--out-dir");
    const inlineOut = args.find((argument) => argument.startsWith("--out-dir="));
    const outDir = outIndex >= 0 ? args[outIndex + 1] : inlineOut?.slice("--out-dir=".length);
    if (!outDir || outDir.startsWith("--")) {
      console.error("Usage: build-html5-offline-launcher-assets.mjs --check | --out-dir <Gradle build path>");
      process.exitCode = 2;
    } else {
      writeStagedAssets(outDir);
    }
  }
}
