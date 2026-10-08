#!/usr/bin/env node
/**
 * Merge two single-file CyberChef kitchens at recipe level.
 *
 * `shdwelf/Html5` and `shdwelf/Html5-sync-incoming` both carry a standalone
 * CyberChef build. The incoming repository has the newer upstream recipe set;
 * Html5 carries research recipes that the incoming build does not. This tool
 * does an rsync-style merge of the two *recipe sets*:
 *
 *   base    = Html5 `public/apps/cyberchef/index.html` (tested shared recipes)
 *   porter  = incoming `webxdc/cyberchef/index.html` (newer missing recipes)
 *
 * The Html5 base wins for shared declarations, so its audited research-recipe
 * APIs and vectors are preserved. Porter top-level declarations are copied only
 * when they introduce names the base does not already declare, and porter
 * `addOp(...)` calls are copied only for operation ids missing from the base.
 * Recipe packs are unioned by operation id, so a pack that exists on both sides
 * keeps the base entries and gains only the missing ones.
 *
 * The result is written back to Html5 `public/apps/cyberchef/index.html`.
 * The merge is intentionally conservative: it never deletes a base recipe and it
 * never overwrites a base declaration with a same-named porter declaration.
 *
 *   node scripts/merge-cyberchef-recipes.mjs \
 *     --base public/apps/cyberchef/index.html \
 *     --porter ../Html5-sync-incoming/webxdc/cyberchef/index.html \
 *     --out public/apps/cyberchef/index.html
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { parse } from "acorn";
import { JSDOM } from "jsdom";

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

const basePath = path.resolve(arg("--base", "public/apps/cyberchef/index.html"));
const porterPath = path.resolve(arg("--porter", "../Html5-sync-incoming/webxdc/cyberchef/index.html"));
const outPath = path.resolve(arg("--out", "public/apps/cyberchef/index.html"));
const baseLabel = arg("--base-label", path.relative(process.cwd(), basePath));
const porterLabel = arg("--porter-label", path.relative(process.cwd(), porterPath));
const outLabel = arg("--out-label", path.relative(process.cwd(), outPath));

/** Extract the largest inline <script> block from a single-file HTML app. */
function mainScript(html) {
  const blocks = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  if (!blocks.length) throw new Error("no inline <script> block found");
  return blocks.reduce((a, b) => (b.length > a.length ? b : a));
}

/** Split a classic script into top-level AST statements. */
function topLevelStatements(script) {
  const ast = parse(script, {
    ecmaVersion: "latest",
    sourceType: "script",
    allowReturnOutsideFunction: true,
  });
  return ast.body.map((node) => ({
    text: script.slice(node.start, node.end).trim(),
    start: node.start,
    end: node.end,
    node,
  }));
}

function patternNames(pattern, out = new Set()) {
  if (!pattern) return out;
  if (pattern.type === "Identifier") out.add(pattern.name);
  else if (pattern.type === "RestElement") patternNames(pattern.argument, out);
  else if (pattern.type === "AssignmentPattern") patternNames(pattern.left, out);
  else if (pattern.type === "ArrayPattern") {
    for (const element of pattern.elements) if (element) patternNames(element, out);
  } else if (pattern.type === "ObjectPattern") {
    for (const property of pattern.properties) {
      if (property.type === "RestElement") patternNames(property.argument, out);
      else patternNames(property.value, out);
    }
  }
  return out;
}

/** Names introduced by a top-level declaration AST node. */
function declaredNames(node) {
  if (!node) return [];
  if (node.type === "FunctionDeclaration" || node.type === "ClassDeclaration") {
    return node.id ? [node.id.name] : [];
  }
  if (node.type === "VariableDeclaration") {
    return [...new Set(node.declarations.flatMap((d) => [...patternNames(d.id)]))];
  }
  return [];
}

/**
 * Count operations the way the app does: boot the single-file page in JSDOM
 * and read the runtime OPERATIONS registry. Static regex counting misses
 * dynamically registered operations such as the IC gate family.
 */
async function runtimeOperationIds(html) {
  const dom = new JSDOM(html, {
    runScripts: "dangerously",
    url: "https://example.test/",
    pretendToBeVisual: true,
    beforeParse(window) {
      window.alert = () => undefined;
      window.confirm = () => false;
      window.prompt = () => null;
      window.URL.createObjectURL = () => "blob:merge-cyberchef";
      window.URL.revokeObjectURL = () => undefined;
    },
  });
  try {
    const ops = dom.window.eval("OPERATIONS");
    return [...new Set(ops.map((op) => op.id))].sort();
  } finally {
    dom.window.close();
  }
}

/** Evaluate a plain object literal from a controlled local build file. */
function evalObjectLiteral(text) {
  // eslint-disable-next-line no-new-func
  return new Function(`"use strict"; return (${text});`)();
}

function extractPacks(script) {
  const m = script.match(/const\s+RECIPE_PACKS\s*=\s*(\{[\s\S]*?\})\s*;/);
  if (!m) return {};
  return evalObjectLiteral(m[1]);
}

const baseHtml = await readFile(basePath, "utf8");
const porterHtml = await readFile(porterPath, "utf8");
const baseScript = mainScript(baseHtml);
const porterScript = mainScript(porterHtml);

const baseIds = await runtimeOperationIds(baseHtml);
const porterIds = await runtimeOperationIds(porterHtml);
const baseSet = new Set(baseIds);
const porterSet = new Set(porterIds);
const onlyPorter = porterIds.filter((id) => !baseSet.has(id));
const onlyBase = baseIds.filter((id) => !porterSet.has(id));
const shared = porterIds.filter((id) => baseSet.has(id));
const finalIds = new Set([...baseIds, ...porterIds]);

const baseStatements = topLevelStatements(baseScript);
const porterStatements = topLevelStatements(porterScript);
const baseNames = new Set(baseStatements.flatMap((s) => declaredNames(s.node)));

const ported = [];
const skippedSharedDeclarations = [];
if (process.env.MERGE_DEBUG) {
  const addOps = porterStatements.filter((s) => /^addOp\(\s*'/.test(s.text));
  console.error(JSON.stringify({
    porterStatements: porterStatements.length,
    porterAddOps: addOps.length,
    porterOldOnlyAddOps: addOps.filter((s) => onlyPorter.includes(s.text.match(/^addOp\(\s*'([^']+)'/)[1])).length,
    baseStatements: baseStatements.length,
    baseNames: baseNames.size,
  }));
}
for (const statement of porterStatements) {
  const text = statement.text;
  if (/\bRECIPE_PACKS\b/.test(text)) continue; // packs are unioned separately
  if (/^addOp\(\s*'/.test(text)) {
    const id = text.match(/^addOp\(\s*'([^']+)'/)[1];
    if (onlyPorter.includes(id)) ported.push(text);
    continue;
  }
  const names = declaredNames(statement.node);
  if (!names.length) continue; // skip other side-effecting top-level calls
  if (names.every((n) => !baseNames.has(n))) {
    ported.push(text);
  } else {
    skippedSharedDeclarations.push(names.filter((n) => baseNames.has(n)));
  }
}

// Union recipe packs. Base entries win; porter entries are appended only when
// their operation id is absent from the base pack and present in the merged app.
const basePacks = extractPacks(baseScript);
const porterPacks = extractPacks(porterScript);
const packMerged = [];
const packNew = [];
const packAppended = [];
for (const [name, entriesRaw] of Object.entries(porterPacks)) {
  const entries = Array.isArray(entriesRaw) ? entriesRaw : [];
  const baseEntries = Array.isArray(basePacks[name]) ? basePacks[name] : null;
  const baseIdsInPack = new Set((baseEntries ?? []).map((e) => (Array.isArray(e) ? e[0] : e)));
  const additions = entries.filter((e) => {
    const id = Array.isArray(e) ? e[0] : e;
    return finalIds.has(id) && !baseIdsInPack.has(id);
  });
  if (baseEntries === null) {
    packNew.push(name);
    packMerged.push(`RECIPE_PACKS[${JSON.stringify(name)}] = ${JSON.stringify(entries.filter((e) => finalIds.has(Array.isArray(e) ? e[0] : e)))};`);
  } else if (additions.length) {
    packAppended.push(`${name} +${additions.length}`);
    packMerged.push(`RECIPE_PACKS[${JSON.stringify(name)}] = [...RECIPE_PACKS[${JSON.stringify(name)}], ${JSON.stringify(additions)}];`);
  }
}

const portedBlock = [
  "/* ===== incoming-only recipe port (scripts/merge-cyberchef-recipes.mjs) =====",
  ` * Porter declarations copied only when the base did not declare the name;`,
  ` * porter addOp() calls copied only for ids missing from the base (${onlyPorter.length}).`,
  ` * Shared declarations intentionally stay on the Html5 base implementation. */`,
  ...ported,
  "",
  "/* ===== recipe-pack union (base entries win; porter fills missing ids) ===== */",
  ...packMerged,
  "",
].join("\n\n");

// Insert before the final UI bootstrap so renderOpsList() sees every operation.
let insertAt = baseScript.lastIndexOf("zenInit();");
if (insertAt < 0) insertAt = baseScript.lastIndexOf("InitUi();");
if (insertAt < 0) insertAt = baseScript.lastIndexOf("renderOpsList();");
if (insertAt < 0) throw new Error("could not find the final UI bootstrap in the base script");
const mergedScript = `${baseScript.slice(0, insertAt)}\n${portedBlock}\n\n${baseScript.slice(insertAt)}`;

let mergedHtml = baseHtml.replace(mainScript(baseHtml), () => mergedScript);
mergedHtml = mergedHtml.replace(/HTML5 · \d+ recipes/g, `HTML5 · ${finalIds.size} recipes`);

await writeFile(outPath, mergedHtml);
const mergedIds = await runtimeOperationIds(await readFile(outPath, "utf8"));
if (mergedIds.length !== finalIds.size || mergedIds.some((id) => !finalIds.has(id))) {
  throw new Error(`merged operation registry mismatch: expected ${finalIds.size}, got ${mergedIds.length}`);
}

const report = {
  base: baseLabel,
  porter: porterLabel,
  out: outLabel,
  operationSource: "JSDOM runtime OPERATIONS registry (includes dynamically registered ops)",
  counts: {
    base: baseIds.length,
    porter: porterIds.length,
    shared,
    onlyBase: onlyBase.length,
    onlyPorter: onlyPorter.length,
    merged: finalIds.size,
    mergedRuntime: mergedIds.length,
  },
  onlyBase,
  onlyPorter,
  portedStatements: ported.length,
  skippedSharedDeclarations: [...new Set(skippedSharedDeclarations.flat())].sort(),
  packs: { new: packNew, appended: packAppended },
};
console.log(JSON.stringify(report, null, 2));
