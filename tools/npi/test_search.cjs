#!/usr/bin/env node
/*
 * test_search.js — runs the app's ACTUAL search code (extracted verbatim from
 * npi-search.html) in Node against the built index in data/npi/.
 *
 *   node tools/npi/test_search.js
 *
 * No DOM needed: only the pure search core is executed; the index buffers are
 * built exactly the way the browser build does.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const ROOT = path.resolve(__dirname, "..", "..");
const DIR = path.join(ROOT, "data", "npi");
const br = f => new Uint8Array(zlib.brotliDecompressSync(fs.readFileSync(path.join(DIR, f))));

// ---- extract the app's own core (normalization + check + loading + search) ----
const html = fs.readFileSync(path.join(ROOT, "npi-search.html"), "utf8");
const script = html.split("<script>")[1].split("</script>")[0];
const core = script.slice(
  script.indexOf("/* ---------------- normalization"),
  script.indexOf("/* ---------------- UI"));
if (core.length < 5000) { console.error("could not extract search core from npi-search.html"); process.exit(1); }

// ---- globals the core expects ----
globalThis.DATA = "data/npi";
globalThis.REC = 32;
globalThis.B = 39;
globalThis.TMAX = 39 * 39 * 39;
globalThis.CH = "abcdefghijklmnopqrstuvwxyz0123456789'-.\"";
globalThis.FLAG = { sample: 1, partB: 2, dme: 4, hha: 8, pmd: 16, hospice: 32, org: 64 };
globalThis.FLAG_LABEL = { 2: "PART B", 4: "DME", 8: "HHA", 16: "PMD", 32: "HOSPICE" };
globalThis.meta = JSON.parse(fs.readFileSync(path.join(DIR, "meta.json"), "utf8"));
globalThis.names = [];
globalThis.firsts = [];
globalThis.rowsDV = null;
globalThis.nameOrder = null;
globalThis.firstOrder = null;
globalThis.tName = null;
globalThis.tFirst = null;
globalThis.N = 0;
globalThis.ready = true;
globalThis.lastResults = [];
globalThis.lastSel = -1;
globalThis.lastQuery = "";
globalThis.curFilters = { flags: 0, type: "", state: "" };

(0, eval)(core); // indirect eval -> global scope

// ---- build structures exactly like the browser boot does ----
globalThis.names = parseLenStrings(br("names.br").buffer);
globalThis.firsts = parseLenStrings(br("firsts.br").buffer);
globalThis.rowsDV = new DataView(br("rows.br").buffer);
globalThis.N = globalThis.meta.rows;
globalThis.nameOrder = new Uint32Array(br("nameorder.br").buffer);
globalThis.firstOrder = new Uint32Array(br("firstorder.br").buffer);
{
  const buf = br("trig.br").buffer;
  const dv = new DataView(buf);
  globalThis.tName = decodeTrigSection(buf, Number(dv.getBigUint64(4, true)), Number(dv.getBigUint64(20, true)));
  globalThis.tFirst = decodeTrigSection(buf, Number(dv.getBigUint64(12, true)), Number(dv.getBigUint64(28, true)));
}
console.log(`loaded: N=${globalThis.N} names=${globalThis.names.length} firsts=${globalThis.firsts.length} ` +
  `postings name=${globalThis.tName.w} first=${globalThis.tFirst.w}\n`);

let failures = 0;
const expect = (label, cond) => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${label}`);
  if (!cond) failures++;
};
function show(label, r, k = 5) {
  console.log(`--- ${label}  [${r.stats.mode} ${r.stats.ms.toFixed(1)}ms cand=${r.stats.candidates}` +
    `${r.stats.fuzzyUsed ? " fuzzy" : ""}${r.stats.fallback ? " fallback" : ""}${r.stats.capped ? " capped" : ""}]`);
  r.rows.slice(0, k).forEach(h => {
    const nm = globalThis.names[h.r.nameRef], fst = h.r.firstRef ? globalThis.firsts[h.r.firstRef] : "";
    console.log(`      ${h.score}  ${nm}${fst ? ", " + fst : ""}  ${h.r.npi}`);
  });
}

// 1 · check digit (Luhn, 80840 prefix per CMS spec)
const anyNpi = globalThis.names && rowAt(0).npi;
const s = String(anyNpi).padStart(10, "0");
expect("check digit validates a real NPI from the data", npiCheck(s) === true);
expect("check digit rejects a tampered NPI", npiCheck(String(Number(s) + 1).padStart(10, "0")) === false);

// 2 · NPI exact (binary search)
let r = search(s);
expect("NPI exact finds the row", r.rows.length === 1 && r.rows[0].r.npi === anyNpi);

// 3 · NPI prefix
r = search(String(anyNpi).slice(0, 6));
expect("NPI prefix returns the prefix range", r.rows.length > 0 && r.rows.every(h => String(h.r.npi).startsWith(String(anyNpi).slice(0, 6))));

// 4 · name exact
r = search("johnson");
expect("name 'johnson' finds JOHNSON rows", r.rows.length > 100 && r.rows[0].r.npi > 0 && /JOHNSON/i.test(globalThis.names[r.rows[0].r.nameRef]));
show("name 'johnson'", r, 3);

// 5 · cross-field AND (last + first)
r = search("johnson mary");
const exactJM = r.rows.filter(h => h.score === 192).length; // 100 (name) + 92 (first)
expect("'johnson mary' intersects last ∩ first name",
  r.rows.length > 40 && exactJM >= 40 &&
  r.rows.slice(0, 10).every(h => /JOHNSON/i.test(globalThis.names[h.r.nameRef]) && /MARY/i.test(globalThis.firsts[h.r.firstRef] || "")));
show("'johnson mary'", r, 3);

// 6 · typo (drop-one trigram + Levenshtein verify)
r = search("johnsan");
expect("typo 'johnsan' fuzzy-matches JOHNSON", r.rows.length > 100 && /JOHNSON/i.test(globalThis.names[r.rows[0].r.nameRef]) && r.stats.fuzzyUsed);

// 7 · typo that breaks every trigram (brute-force fallback or direct)
r = search("smyth");
expect("'smyth' resolves (SMYTH/SMITH)", r.rows.length > 0);

// 8 · short prefix query (lexicographic range)
r = search("va");
expect("2-letter prefix 'va' finds VA/VAN* names", r.rows.length > 10 && /V/.test(globalThis.names[r.rows[0].r.nameRef][0]));

// 9 · dotted name
r = search("st. louis");
expect("'st. louis' matches", r.rows.length > 0 && /ST\.?\s?LOUIS/i.test(globalThis.names[r.rows[0].r.nameRef]));

// 10 · Medicare program filter
globalThis.curFilters.flags = globalThis.FLAG.partB;
r = search("garcia");
expect("PART B filter only keeps partB rows", r.rows.length > 0 && r.rows.every(h => (h.r.flags & globalThis.FLAG.partB) !== 0));
globalThis.curFilters.flags = 0;

// 11 · no results + fallback path
r = search("zzzqqqxxx");
expect("nonsense returns 0 rows", r.rows.length === 0);

// 12 · first-name-only search (second section)
r = search("elizabeth");
expect("first-name-only 'elizabeth' finds rows", r.rows.length > 10);

// 13 · latency sanity
let t = 0;
for (let i = 0; i < 20; i++) t += search("johnson").stats.ms;
expect(`common query under 25 ms (avg ${(t / 20).toFixed(1)} ms)`, t / 20 < 25);

console.log(failures ? `\n${failures} FAILURES` : "\nALL TESTS PASSED");
process.exit(failures ? 1 : 0);
