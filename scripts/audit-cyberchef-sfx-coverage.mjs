#!/usr/bin/env node
/**
 * Audit the CyberChef kitchen's SFX installer coverage.
 *
 * The SFX installer offers "select all" over RECIPE_PACKS and claims that
 * selecting every pack reproduces the complete operation registry. That claim
 * is checkable: the registry is `OPERATIONS` (filled by addOp), the installer
 * only ever installs ids that appear inside some RECIPE_PACKS entry, and
 * `applyRecipePacks` silently skips ids with no registered operation.
 *
 * This tool boots the real page in JSDOM and prints:
 *   - registered operation count (and duplicate ids)
 *   - RECIPE_PACKS pack count and the size of its id union
 *   - how many of those ids actually resolve (what "select all" really bakes)
 *   - dangling ids (in a pack, not registered)
 *   - orphaned ids (registered, in no pack -> silently dropped by SFX)
 *
 *   node scripts/audit-cyberchef-sfx-coverage.mjs [path/to/index.html]
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { JSDOM, VirtualConsole } from "jsdom";

const target = path.resolve(
  process.argv[2] || "public/apps/cyberchef/index.html",
);
const html = await readFile(target, "utf8");

const badge = (html.match(/HTML5 · (\d+) recipes/) || [])[1];

const errors = [];
const virtualConsole = new VirtualConsole();
virtualConsole.on("jsdomError", (e) => errors.push(e.message));
virtualConsole.on("error", (...a) => errors.push(a.join(" ")));

const dom = new JSDOM(html, {
  runScripts: "dangerously",
  pretendToBeVisual: true,
  url: "https://local.test/cyberchef/",
  virtualConsole,
});

const { window } = dom;

// The kitchen boots synchronously; wait one macrotask for any queued work.
await new Promise((r) => setTimeout(r, 50));

const report = await window.eval(`(function(){
  var reg = OPERATIONS.map(function(o){ return o.id; });
  var uniq = {};
  var dupes = [];
  reg.forEach(function(id){ if (uniq[id]) dupes.push(id); uniq[id] = 1; });

  var packNames = Object.keys(RECIPE_PACKS);
  var union = {};
  var totalEntries = 0;
  packNames.forEach(function(n){
    (RECIPE_PACKS[n] || []).forEach(function(pair){
      totalEntries++;
      union[pair[0]] = 1;
    });
  });
  var unionIds = Object.keys(union);

  var registered = {};
  reg.forEach(function(id){ registered[id] = 1; });

  var resolves = unionIds.filter(function(id){ return registered[id]; });
  var dangling = unionIds.filter(function(id){ return !registered[id]; });
  var orphaned = Object.keys(registered).filter(function(id){ return !union[id]; });

  // What the installer actually bakes when every box is ticked.
  var selectAll = (typeof applyRecipePacks === "function")
    ? applyRecipePacks(packNames)
    : null;
  var hasSfx = (typeof sfxInitUi === "function");

  return {
    registeredCount: reg.length,
    uniqueRegistered: Object.keys(registered).length,
    duplicateIds: dupes,
    packCount: packNames.length,
    packEntries: totalEntries,
    unionCount: unionIds.length,
    resolvesCount: resolves.length,
    dangling: dangling,
    orphaned: orphaned,
    selectAllRecipeLength: selectAll,
    hasSfx: hasSfx
  };
})()`);

const pct = (a, b) => (b ? ((a / b) * 100).toFixed(1) + "%" : "n/a");

console.log(`file:                 ${path.relative(process.cwd(), target)}`);
console.log(`header badge claims:  ${badge ?? "n/a"} recipes`);
console.log(`OPERATIONS registered: ${report.registeredCount} (${report.uniqueRegistered} unique ids)`);
if (report.duplicateIds.length) {
  console.log(`  duplicate ids:       ${report.duplicateIds.join(", ")}`);
}
console.log(`RECIPE_PACKS packs:   ${report.packCount} (${report.packEntries} entries)`);
console.log(`union of pack ids:    ${report.unionCount}`);
console.log(`  resolves to an op:  ${report.resolvesCount}  <- what SFX "select all" bakes`);
console.log(`  dangling (no op):   ${report.dangling.length}`);
console.log(
  `orphaned ops (registered, in no pack): ${report.orphaned.length}  ${pct(report.orphaned.length, report.uniqueRegistered)} of registry`,
);
console.log(`SFX installer present: ${report.hasSfx}`);
console.log(`applyRecipePacks(all) returns: ${report.selectAllRecipeLength === null ? "n/a (no SFX in this build)" : report.selectAllRecipeLength}`);

if (report.dangling.length) {
  console.log(`\ndangling ids (first 25):\n  ${report.dangling.slice(0, 25).join("\n  ")}`);
}
if (report.orphaned.length) {
  console.log(`\norphaned ids (first 25):\n  ${report.orphaned.slice(0, 25).join("\n  ")}`);
}
if (errors.length) {
  console.log(`\nconsole/jsdom errors (${errors.length}):`);
  errors.slice(0, 10).forEach((e) => console.log(`  ${e}`));
}

const fullCoverage = report.orphaned.length === 0 && report.dangling.length === 0 && report.hasSfx;
console.log(`\nVERDICT: ${fullCoverage ? "SFX select-all covers the full registry" : "SFX select-all is INCOMPLETE"}`);
process.exit(fullCoverage ? 0 : 1);
