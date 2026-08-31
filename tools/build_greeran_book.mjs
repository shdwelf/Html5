#!/usr/bin/env node
/*
 * build_greeran_book.mjs — regenerate The Greeran Book's derived artifacts.
 *
 *   node tools/build_greeran_book.mjs            # build inlined HTML + webxdc
 *   node tools/build_greeran_book.mjs --check    # verify only; exit 1 on drift
 *
 * Two artifacts are derived from tracked sources and must never be hand-edited:
 *
 *   1. greeran-book-inlined.html
 *      greeran-book.html with ./css/greeran-book.css inlined into a <style>
 *      element and ./js/greeran-book.js inlined into a <script> element. The
 *      runtime artifact stays a single self-contained file (no build step, no
 *      network, no keys) — this script only makes that file reproducible.
 *
 *   2. greeran-book.xdc
 *      A webxdc package: entries written as name + NUL + content, with a final
 *      NUL terminator. Entry order is manifest.json, index.html, icon.png.
 *      index.html is the inlined book; icon.png is the repository root icon.
 *
 * --check compares both regenerated artifacts against the files on disk, so CI
 * or a pre-commit run can prove the checked-in artifacts match their sources.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p));
const md5 = (b) => createHash('md5').update(b).digest('hex');
const checkOnly = process.argv.includes('--check');

// --- 1. inline the stylesheet and the script --------------------------------
const book = read('greeran-book.html').toString('utf8');
const css = read('css/greeran-book.css').toString('utf8');
const js = read('js/greeran-book.js').toString('utf8');

const LINK = '  <link rel="stylesheet" href="./css/greeran-book.css" />';
const SCRIPT = '  <script src="./js/greeran-book.js"></script>';
for (const tag of [LINK, SCRIPT]) {
  if (!book.includes(tag)) {
    console.error(`build_greeran_book: expected tag not found in greeran-book.html:\n  ${tag.trim()}`);
    process.exit(2);
  }
}

// Inline exactly as the checked-in artifact does: the source file's own
// trailing newline is kept, one blank line follows, and the closing tag sits at
// column zero. Changing this formatting desynchronises the derived files.
const inlined = book
  .replace(LINK, `  <style>\n${css}\n</style>`)
  .replace(SCRIPT, `  <script>\n${js}\n</script>`);

// --- 2. pack the webxdc -----------------------------------------------------
// Comma/colon spacing matches the manifest the original packer wrote
// (Python json.dumps defaults). Keep it byte-stable.
const jsonDumps = (value) => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return `[${value.map(jsonDumps).join(', ')}]`;
  if (typeof value === 'object') {
    return `{${Object.entries(value).map(([k, v]) => `${JSON.stringify(k)}: ${jsonDumps(v)}`).join(', ')}}`;
  }
  return JSON.stringify(value);
};

const manifest = jsonDumps({
  name: 'The Greeran Book',
  source_code_url: 'https://github.com/shdwelf/Html5',
  version: '1.0.0',
  min_api: 1,
  webxdc: 'index.html',
});

const NUL = Buffer.from([0]);
const parts = [];
for (const [name, content] of [
  ['manifest.json', manifest],
  ['index.html', inlined],
  ['icon.png', read('icon.png')],
]) {
  parts.push(Buffer.from(name, 'utf8'), NUL, Buffer.from(content), NUL);
}
const xdc = Buffer.concat(parts);

// --- 3. write or verify -----------------------------------------------------
const targets = [
  ['greeran-book-inlined.html', Buffer.from(inlined, 'utf8')],
  ['greeran-book.xdc', xdc],
];

let drift = 0;
for (const [rel, want] of targets) {
  const have = read(rel);
  if (have.equals(want)) {
    console.log(`up to date  ${rel}  (${want.length} bytes, md5 ${md5(want)})`);
    continue;
  }
  if (checkOnly) {
    console.log(`STALE       ${rel}  on disk ${have.length} bytes / md5 ${md5(have)}`);
    console.log(`            ${rel}  rebuilt ${want.length} bytes / md5 ${md5(want)}`);
    drift++;
  } else {
    writeFileSync(join(root, rel), want);
    console.log(`wrote       ${rel}  (${want.length} bytes, md5 ${md5(want)})`);
  }
}

if (checkOnly && drift) {
  console.error(`\n${drift} derived artifact(s) out of date — run: node tools/build_greeran_book.mjs`);
  process.exit(1);
}
