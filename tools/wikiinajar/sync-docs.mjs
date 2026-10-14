#!/usr/bin/env node
/**
 * sync-docs.mjs — put the newest repository notes into the Wiki-in-a-Jar content set.
 *
 *   node tools/wikiinajar/sync-docs.mjs            # sync the newest nine dated notes
 *   node tools/wikiinajar/sync-docs.mjs --count 3  # sync the newest three
 *   node tools/wikiinajar/sync-docs.mjs --check    # verify the pages match the notes
 *
 * Wiki-in-a-Jar 0.8 keeps its articles as `public/docs/wiki/<Page name>.wiki`
 * files; `build-image-support.sh` copies that whole directory into the packed
 * installation.  A Markdown note is turned into a wiki page with:
 *
 *   * the note's own H1/H2/H3 headings promoted to `=` wikitext headings so the
 *     renderer shows real sections;
 *   * a Source line naming the file and its sync date, so a page found in the
 *     rebuilt jar can always be traced back to the repository;
 *   * everything else left verbatim — Markdown that the renderer does not
 *     understand stays readable text rather than being silently rewritten.
 *
 * `wiki-pages.json` is the manifest: page name, source path, byte count and
 * SHA-256 of the generated body.  `--check` recomputes it and fails loudly if a
 * page and its note have drifted apart, which is what keeps the shipped wiki
 * honest between rebuilds.
 *
 * Zero dependencies beyond node itself.
 */

import { createHash } from "node:crypto";
import { readFileSync, readdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const DOCS = join(ROOT, "docs");
const WIKI = join(HERE, "public", "docs", "wiki");
const MANIFEST = join(HERE, "wiki-pages.json");

const args = process.argv.slice(2);
const checkOnly = args.includes("--check");
const countArg = args.indexOf("--count");
const COUNT = countArg >= 0 ? Number(args[countArg + 1]) : 9;
// pages this script manages all end with a date suffix, which is how a stale one
// left behind by an earlier run is told apart from the application's own pages
const DATE_SUFFIX = "-\\d{4}-\\d{2}-\\d{2}";

/** the newest notes by the date embedded in their file name */
function newestDocs(limit) {
  const dated = readdirSync(DOCS)
    .filter((name) => name.endsWith(".md"))
    .map((name) => {
      const m = name.match(/(\d{4}-\d{2}-\d{2})/);
      return m ? { name, date: m[1] } : null;
    })
    .filter(Boolean)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.name.localeCompare(b.name)));
  return dated.slice(0, limit);
}

function pageNameFor(docName) {
  return docName.replace(/\.md$/, "");
}

/** Markdown headings become wiki headings; every other line is kept verbatim. */
function toWikiPage(docName, markdown, syncedOn) {
  const heading = markdown.match(/^#\s+(.+)$/m);
  const title = heading ? heading[1].trim() : pageNameFor(docName);
  const body = markdown.replace(/^(#{1,3})\s+(.+)$/gm, (_, hashes, text) => {
    const level = Math.min(3, hashes.length); // # → =, ## → ==, ### → ===
    return `${"=".repeat(level)} ${text.trim()} ${"=".repeat(level)}`;
  });
  return [
    `== ${title} ==`,
    "",
    `Source: docs/${docName} — synced ${syncedOn} by tools/wikiinajar/sync-docs.mjs.`,
    "Back to [[Main Page]].",
    "",
    body.trimEnd(),
    "",
  ].join("\n");
}

function sha256(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

const syncedOn = process.env.WIKI_SYNC_DATE || new Date().toISOString().slice(0, 10);
const docs = newestDocs(COUNT);

if (checkOnly) {
  if (!existsSync(MANIFEST)) {
    console.error("wiki-pages.json is missing — run sync-docs.mjs without --check first.");
    process.exit(1);
  }
  const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
  let failures = 0;
  for (const entry of manifest.pages) {
    const pagePath = join(WIKI, `${entry.page}.wiki`);
    if (!existsSync(pagePath)) {
      console.error(`✗ missing page for ${entry.source}: ${entry.page}.wiki`);
      failures++;
      continue;
    }
    const notePath = join(ROOT, entry.source);
    if (!existsSync(notePath)) {
      console.error(`✗ ${entry.source} is gone but ${entry.page}.wiki still ships`);
      failures++;
      continue;
    }
    const page = readFileSync(pagePath, "utf8");
    // Regenerate the page from the note: a page that still matches the note is
    // simply the page this script would write today.
    const expected = toWikiPage(entry.source.replace(/^docs\//, ""), readFileSync(notePath, "utf8"), manifest.syncedOn);
    if (page !== expected) {
      console.error(`✗ ${entry.page} no longer matches ${entry.source} — run sync-docs.mjs again`);
      failures++;
      continue;
    }
    if (sha256(expected) !== entry.sha256 || Buffer.byteLength(expected, "utf8") !== entry.bytes) {
      console.error(`✗ ${entry.page}: manifest digest/size disagrees with the regenerated page`);
      failures++;
      continue;
    }
    console.log(`✓ ${entry.page} ← ${entry.source} (${entry.bytes} bytes)`);
  }
  // A page left behind by an earlier run is worse than a missing one: the build
  // copies every *.wiki in this directory into the application.
  const dated = new RegExp(`${DATE_SUFFIX}\\.wiki$`);
  const known = new Set(manifest.pages.map((entry) => `${entry.page}.wiki`));
  for (const file of readdirSync(WIKI)) {
    if (dated.test(file) && !known.has(file)) {
      console.error(`✗ ${file} is not in the manifest — run sync-docs.mjs again to prune it`);
      failures++;
    }
  }
  console.log(
    failures === 0
      ? `\nAll ${manifest.pages.length} pages match their notes (synced ${manifest.syncedOn}).`
      : `\n${failures} page(s) out of sync.`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

const pages = [];
for (const { name, date } of docs) {
  const markdown = readFileSync(join(DOCS, name), "utf8");
  const page = pageNameFor(name);
  const body = toWikiPage(name, markdown, syncedOn);
  writeFileSync(join(WIKI, `${page}.wiki`), body, "utf8");
  pages.push({ page, source: `docs/${name}`, date, bytes: Buffer.byteLength(body, "utf8"), sha256: sha256(body) });
  console.log(`wrote ${page}.wiki ← docs/${name} (${pages[pages.length - 1].bytes} bytes)`);
}

// Drop pages this run did not produce, so the set in the directory is exactly the
// set in the manifest (Image Support Demo.wiki is the application's own page).
const produced = new Set(pages.map((entry) => `${entry.page}.wiki`));
const dated = new RegExp(`${DATE_SUFFIX}\\.wiki$`);
for (const file of readdirSync(WIKI)) {
  if (dated.test(file) && !produced.has(file)) {
    rmSync(join(WIKI, file));
    console.log(`pruned ${file} (no longer among the newest ${COUNT} notes)`);
  }
}

writeFileSync(
  MANIFEST,
  `${JSON.stringify({ syncedOn, rule: `newest ${COUNT} dated notes in docs/`, pages }, null, 2)}\n`,
  "utf8",
);
console.log(`\n${pages.length} pages written; manifest at tools/wikiinajar/wiki-pages.json`);
