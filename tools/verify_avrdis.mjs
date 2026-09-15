#!/usr/bin/env node
/**
 * verify_avrdis.mjs — prove js/avrdis.js against a real avr-objdump listing.
 *
 *   node tools/verify_avrdis.mjs
 *   node tools/verify_avrdis.mjs --show 20      # print the first 20 comparisons
 *
 * Ground truth is samples/avr/optiboot_atmega328.lst: the disassembly that ships
 * with Optiboot v8.0 (commit f3308fc4…), produced by the vendor's own toolchain.
 * It is not regenerated here — there is no avr-objdump in this environment — so
 * it is a genuinely independent implementation to compare against.
 *
 * The comparison is on mnemonic + operands, with the same normalisations
 * avr-objdump itself applies (brbs/brbc printed as br<cc>, tst/clr/lsl/rol/cbr
 * as their base opcode). Exit 1 on any mismatch.
 */

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { decode, normalise, branchOrJumpTarget, walkInfo as walkImage, parseListing, parseSymbols } from "../js/avrdis.js";
import { parseIntelHex } from "../js/avrhex.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LST = join(ROOT, "samples", "avr", "optiboot_atmega328.lst");
const HEX = join(ROOT, "samples", "avr", "optiboot_atmega328.hex");

const show = (() => {
  const i = process.argv.indexOf("--show");
  return i >= 0 ? Number(process.argv[i + 1] ?? 10) : 0;
})();

// ---------------------------------------------------------------- ground truth
const listingText = readFileSync(LST, "utf8");
const listing = parseListing(listingText);
const symbols = parseSymbols(listingText);

const img = parseIntelHex(readFileSync(HEX, "utf8"));
if (listing.length === 0) {
  console.error(`no instructions parsed from ${LST}`);
  process.exit(2);
}

// ------------------------------------------------------------------ comparison
let agree = 0;
const mismatches = [];
const covered = new Set();

for (const ins of listing) {
  const at = ins.addr - img.base;
  if (at < 0 || at + 2 > img.bytes.length) {
    mismatches.push({ ...ins, got: "outside the image" });
    continue;
  }
  // The listing's bytes must match the vendored hex, or the two artifacts are
  // not the same build and nothing below means anything.
  const rawOk = ins.bytes.every((b, i) => img.bytes[at + i] === b);
  const got = decode(img.bytes, at, ins.addr);
  const want = normalise(ins.mnemonic, ins.operands);
  covered.add(ins.mnemonic);
  if (!rawOk) {
    mismatches.push({ ...ins, got: "byte mismatch: the .hex and .lst are not the same build" });
  } else if (!got) {
    mismatches.push({ ...ins, got: "undecoded" });
  } else if (normalise(got.mnemonic, got.operands) !== want) {
    mismatches.push({ ...ins, got: `${got.mnemonic} ${got.operands}`.trim() });
  } else {
    agree++;
  }
}

const total = listing.length;
console.log(`ground truth : ${LST.replace(ROOT + "/", "")}`);
console.log(`instructions : ${total} (from ${covered.size} distinct mnemonics)`);
console.log(`decoder      : ${agree}/${total} agree with avr-objdump`);

if (show) {
  console.log("\n-- first comparisons --");
  for (const ins of listing.slice(0, show)) {
    const at = ins.addr - img.base;
    const got = decode(img.bytes, at, ins.addr);
    const text = got ? `${got.mnemonic} ${got.operands}`.trim() : "?";
    const mark = normalise(got?.mnemonic ?? "", got?.operands ?? "") === normalise(ins.mnemonic, ins.operands) ? "=" : "!";
    console.log(`  ${ins.addr.toString(16).padStart(5)}: ${ins.bytes.map((b) => b.toString(16).padStart(2, "0")).join(" ").padEnd(12)} ` +
      `${mark} objdump: ${`${ins.mnemonic} ${ins.operands}`.trim().padEnd(22)} mine: ${text}`);
  }
}

if (mismatches.length) {
  console.log(`\n${mismatches.length} mismatch(es):`);
  for (const m of mismatches.slice(0, 20)) {
    console.log(`  ${m.addr.toString(16)}: ${m.bytes.map((b) => b.toString(16).padStart(2, "0")).join(" ")}  ` +
      `objdump: ${`${m.mnemonic} ${m.operands}`.trim()}   mine: ${m.got}`);
  }
  if (mismatches.length > 20) console.log(`  ... ${mismatches.length - 20} more`);
  process.exit(1);
}

// ------------------------------------------------------- branch-target check
//
// Every control transfer in the listing carries its resolved target. If our
// branch arithmetic were off by one word, by the instruction size, or by a sign
// extension, this is where it shows.
const listingAddrs = new Set(listing.map((i) => i.addr));
let targetsChecked = 0;
const targetErrors = [];
for (const ins of listing) {
  if (ins.target === null) continue;
  const got = decode(img.bytes, ins.addr - img.base, ins.addr);
  const mine = got ? branchOrJumpTarget(ins.addr, got) : null;
  targetsChecked++;
  if (mine !== ins.target) {
    targetErrors.push({ addr: ins.addr, mnemonic: ins.mnemonic, operands: ins.operands, want: ins.target, mine });
  }
}
console.log(`targets      : ${targetsChecked - targetErrors.length}/${targetsChecked} branch/call targets match avr-objdump's own resolution`);
for (const e of targetErrors.slice(0, 10)) {
  console.log(`  ! ${e.addr.toString(16)} ${e.mnemonic} ${e.operands}: objdump -> 0x${e.want.toString(16)}, mine -> ${e.mine === null ? "null" : "0x" + e.mine.toString(16)}`);
}

// ------------------------------------------------------------ walk checks
//
// The walk follows every target the decoder computes. If it ever lands on an
// address the vendor's disassembly does not consider an instruction, the
// decoder produced a target that is not code start.
const flow = walkImage(img.bytes, { base: img.base });
const strayTargets = [];
for (const ins of flow.ins.values()) {
  if (ins.target == null) continue;
  const inImage = ins.target >= img.base && ins.target < img.max;
  if (inImage && !listingAddrs.has(ins.target)) strayTargets.push({ from: ins.addr, to: ins.target, mnemonic: ins.mnemonic });
}
const reachableOutside = [...flow.reachable].filter((a) => a < img.base || a >= img.max).length;
const symbolMisses = [];
for (const [addr, name] of symbols) {
  if (!flow.ins.has(addr)) symbolMisses.push(`${name} (0x${addr.toString(16)})`);
  else if (listing.length && !listingAddrs.has(addr)) symbolMisses.push(`${name} (0x${addr.toString(16)}, not an instruction start)`);
}

const walkFacts = [
  [`walk starts at the image base (0x${img.base.toString(16)})`, flow.entries.has(img.base)],
  ["every followed target lands on an instruction in the vendor listing", strayTargets.length === 0],
  ["no reachable instruction lies outside the image", reachableOutside === 0],
  ["every symbol in the listing resolves to a decoded instruction", symbolMisses.length === 0],
  ["the reset vector resolves to the `main` symbol", symbols.get(flow.ins.get(img.base)?.target) === "main"],
];

// What the walk is *for* on this firmware: which flash-write sites a redirect
// can actually reach. Optiboot keeps `do_spm` (__attribute__((used))) even
// though nothing calls it in this build - that is a real, measurable property.
const opcodeSites = (name) => [...flow.ins.values()].filter((i) => i.mnemonic === name).map((i) => i.addr);
const spm = opcodeSites("spm");
const spmReachable = spm.filter((a) => flow.reachable.has(a));
const doSpm = symbols.get(0x7fbc) ? 0x7fbc : null;
const spmInDoSpm = doSpm === null ? [] : spm.filter((a) => a >= doSpm);
if (doSpm !== null) {
  walkFacts.push([`the do_spm routine's SPM sites (${spmInDoSpm.length}) are dead code in this build`,
    spmInDoSpm.length > 0 && spmInDoSpm.every((a) => !flow.reachable.has(a))]);
  walkFacts.push([`the reachable SPM sites (${spmReachable.length}) are all before do_spm`,
    spmReachable.length > 0 && spmReachable.every((a) => a < doSpm)]);
}
for (const name of ["wdr", "lpm"]) {
  const sites = opcodeSites(name);
  if (sites.length) walkFacts.push([`every ${name} site (${sites.length}) is reachable`, sites.every((a) => flow.reachable.has(a))]);
}

console.log(`walk         : ${flow.reachable.size} of ${flow.ins.size} instructions reachable, ${flow.entries.size} entry point(s), ${spmReachable.length}/${spm.length} SPM sites reachable`);
let walkFailed = 0;
for (const [what, ok] of walkFacts) {
  if (!ok) walkFailed++;
  console.log(`  [${ok ? "ok " : "FAIL"}] ${what}`);
}
for (const t of strayTargets.slice(0, 5)) console.log(`  ! 0x${t.from.toString(16)} ${t.mnemonic} -> 0x${t.to.toString(16)} is not an instruction start`);
for (const m of symbolMisses.slice(0, 5)) console.log(`  ! symbol ${m}`);

// Micronucleus has no vendored listing, so it is checked as a *second,
// independent* image: the walk must still terminate inside the image and reach
// every self-programming site - a bootloader that cannot program flash is not a
// bootloader.
const usbImg = parseIntelHex(readFileSync(join(ROOT, "samples/avr/micronucleus_m328p_extclock.hex"), "utf8"));
const usbFlow = walkImage(usbImg.bytes, { base: usbImg.base });
const usbSites = (name) => [...usbFlow.ins.values()].filter((i) => i.mnemonic === name).map((i) => i.addr);
const usbChecks = [
  ["micronucleus: 100% of the walk lands inside the image", [...usbFlow.reachable].every((a) => a >= usbImg.base && a < usbImg.max)],
  ["micronucleus: every SPM site is reachable", usbSites("spm").length > 0 && usbSites("spm").every((a) => usbFlow.reachable.has(a))],
  ["micronucleus: every LPM site is reachable", usbSites("lpm").length > 0 && usbSites("lpm").every((a) => usbFlow.reachable.has(a))],
  ["micronucleus: every WDR site is reachable", usbSites("wdr").length > 0 && usbSites("wdr").every((a) => usbFlow.reachable.has(a))],
];
console.log(`walk (2nd)   : micronucleus at 0x${usbImg.base.toString(16)}: ${usbFlow.reachable.size} of ${usbFlow.ins.size} instructions reachable, ${usbSites("spm").length} SPM / ${usbSites("lpm").length} LPM / ${usbSites("wdr").length} WDR sites`);
for (const [what, ok] of usbChecks) {
  if (!ok) walkFailed++;
  console.log(`  [${ok ? "ok " : "FAIL"}] ${what}`);
}

if (targetErrors.length || walkFailed) process.exit(1);

console.log("\ndecoder agrees with avr-objdump on every instruction in the listing");
