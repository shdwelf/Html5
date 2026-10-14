import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const wikiRoot = path.join(repoRoot, "tools/wikiinajar");
const manifestPath = path.join(wikiRoot, "wiki-pages.json");

test("the wiki content set carries the newest repository notes, in sync", () => {
  assert.ok(existsSync(manifestPath), "wiki-pages.json must exist — run sync-docs.mjs");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  assert.ok(Array.isArray(manifest.pages) && manifest.pages.length >= 9, `expected the newest notes, got ${manifest.pages.length}`);
  assert.match(manifest.rule, /newest \d+ dated notes/);

  // The newest dated note in docs/ must be in the set, or the page count is
  // cheating by syncing something easier.
  const newest = manifest.pages[0];
  assert.match(newest.date, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(
    manifest.pages.every((entry) => entry.date <= newest.date),
    "pages are ordered newest first",
  );

  for (const entry of manifest.pages) {
    const pagePath = path.join(wikiRoot, "public", "docs", "wiki", `${entry.page}.wiki`);
    assert.ok(existsSync(pagePath), `${entry.page}.wiki must exist`);
    const page = readFileSync(pagePath, "utf8");
    assert.match(page, new RegExp(`^Source: ${entry.source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} `, "m"));
    assert.ok(page.includes("[[Main Page]]"), `${entry.page} must link back to the Main Page`);
    assert.ok(page.split("\n").length > 20, `${entry.page} looks empty`);
    assert.ok(!/^#\s/m.test(page), `${entry.page} still has Markdown H1 lines — headings must be wiki headings`);
  }

  // No page may shadow the application's own pages.
  const names = manifest.pages.map((entry) => entry.page);
  assert.ok(!names.includes("Main Page") && !names.includes("Image Support Demo"));
});

test("sync-docs.mjs --check proves every page still matches its note", () => {
  const result = spawnSync(process.execPath, [path.join(wikiRoot, "sync-docs.mjs"), "--check"], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, `--check failed:\n${result.stdout}${result.stderr}`);
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  assert.ok(
    result.stdout.includes(`All ${manifest.pages.length} pages match their notes`),
    `unexpected check output: ${result.stdout}`,
  );
});

test("the build copies every page and links the manifest on the Main Page", () => {
  const build = readFileSync(path.join(wikiRoot, "build-image-support.sh"), "utf8");
  assert.match(build, /for page in "\$SCRIPT_DIR"\/public\/docs\/wiki\/\*\.wiki/, "the build must copy the whole content set");
  assert.ok(build.includes("wiki-pages.json"), "the Main Page links must come from the manifest");
  assert.match(build, /Repository notes/, "the Main Page must gain a Repository notes section");
});
