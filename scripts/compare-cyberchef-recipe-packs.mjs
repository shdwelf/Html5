#!/usr/bin/env node
/**
 * compare-cyberchef-recipe-packs.mjs — comparative pass over RECIPE_PACKS.
 *
 * Backlog line 7 (“using comparison of all recipes in cyberchef optimally
 * enhance”). The coverage auditor (scripts/audit-cyberchef-sfx-coverage.mjs)
 * answers “does select-all cover the registry?”; this tool answers “how do the
 * packs relate to each other?” It boots the real page in JSDOM and reports:
 *
 *   - pack size distribution (largest / smallest packs)
 *   - per-category registry counts
 *   - near-duplicate packs (Jaccard >= 0.6) and strict subset packs
 *   - hub operations (in many packs) and lonely operations (in one pack)
 *
 * Findings feed docs/cyberchef-recipe-comparison-2026-10-21.md.
 *
 *   node scripts/compare-cyberchef-recipe-packs.mjs [path/to/index.html]
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { JSDOM, VirtualConsole } from "jsdom";

const target = path.resolve(
  process.argv[2] || "public/apps/cyberchef/index.html",
);
const html = await readFile(target, "utf8");
const errors = [];
const virtualConsole = new VirtualConsole();
virtualConsole.on("jsdomError", (e) => errors.push(e.message));
const dom = new JSDOM(html, {
  runScripts: "dangerously",
  pretendToBeVisual: true,
  url: "https://local.test/cyberchef/",
  virtualConsole,
});
const { window } = dom;
await new Promise((r) => setTimeout(r, 50));

const data = await window.eval(`(function(){
  var ops = OPERATIONS.map(function(o){ return { id: o.id, label: o.label || o.name || o.id, category: o.category || "?" }; });
  var packs = {};
  Object.keys(RECIPE_PACKS).forEach(function(name){
    packs[name] = (RECIPE_PACKS[name] || []).map(function(pair){
      return Array.isArray(pair) ? pair[0] : pair;
    });
  });
  return JSON.stringify({ ops: ops, packs: packs });
})()`);
const { ops, packs } = JSON.parse(data);

const categories = {};
for (const o of ops) categories[o.category] = (categories[o.category] || 0) + 1;

const names = Object.keys(packs);
const sizes = names.map((n) => [n, packs[n].length]).sort((a, b) => b[1] - a[1]);
const packSets = Object.fromEntries(names.map((n) => [n, new Set(packs[n])]));

const pairs = [];
for (let i = 0; i < names.length; i++) {
  for (let j = i + 1; j < names.length; j++) {
    const a = packSets[names[i]];
    const b = packSets[names[j]];
    let inter = 0;
    for (const id of a) if (b.has(id)) inter++;
    if (inter === 0) continue;
    const union = a.size + b.size - inter;
    const jaccard = inter / union;
    const subset = inter === a.size || inter === b.size;
    pairs.push({ a: names[i], b: names[j], inter, union, jaccard, subset });
  }
}
pairs.sort((x, y) => y.jaccard - x.jaccard);

const freq = {};
for (const n of names) for (const id of packSets[n]) freq[id] = (freq[id] || 0) + 1;
const hubs = Object.entries(freq).sort((x, y) => y[1] - x[1]).slice(0, 15);
const lonely = Object.entries(freq).filter(([, c]) => c === 1).length;

console.log(`file: ${path.relative(process.cwd(), target)}`);
console.log(`operations: ${ops.length} across ${Object.keys(categories).length} categories`);
console.log(`packs: ${names.length}, entries: ${sizes.reduce((s, [, n]) => s + n, 0)}, union ids: ${Object.keys(freq).length}`);
console.log("");
console.log("## Category distribution");
for (const [cat, n] of Object.entries(categories).sort((a, b) => b[1] - a[1])) {
  console.log(`| ${cat} | ${n} |`);
}
console.log("");
console.log("## Largest packs");
for (const [n, s] of sizes.slice(0, 12)) console.log(`| ${n} | ${s} |`);
console.log("");
console.log("## Smallest packs");
for (const [n, s] of sizes.slice(-8).reverse()) console.log(`| ${n} | ${s} |`);
console.log("");
console.log("## Near-duplicate pairs (Jaccard >= 0.6, or strict subset)");
const near = pairs.filter((p) => p.jaccard >= 0.6 || p.subset);
for (const p of near.slice(0, 25)) {
  console.log(`| ${p.a} | ${p.b} | ${p.inter} | ${p.jaccard.toFixed(2)} | ${p.subset ? "subset" : ""} |`);
}
console.log(`(${near.length} such pairs total)`);
console.log("");
console.log("## Hub operations (appear in the most packs)");
for (const [id, c] of hubs) {
  const o = ops.find((x) => x.id === id);
  console.log(`| ${id} | ${c} | ${o ? o.category : "?"} |`);
}
console.log("");
console.log(`lonely ops (exactly one pack): ${lonely} (${(100 * lonely / Object.keys(freq).length).toFixed(1)}% of union)`);
console.log(`pack pairs sharing >=1 id: ${pairs.length} of ${names.length * (names.length - 1) / 2}`);
