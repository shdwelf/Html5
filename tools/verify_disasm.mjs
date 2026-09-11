#!/usr/bin/env node
/**
 * verify_disasm.mjs — cross-check js/x86dis.js against GNU objdump.
 *
 *   node tools/verify_disasm.mjs
 *
 * Disassembles every sample in samples/bin linearly and compares each
 * instruction with `objdump -b binary -m i386 -M i8086,intel`.  Operand
 * ordering/spelling differences that are purely cosmetic are normalised away;
 * anything else is reported so a human can look at it.
 */

import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { analyze, bootSectorInfo, decodeOne } from "../js/x86dis.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BIN = join(ROOT, "samples", "bin");

function objdump(file) {
  const out = execFileSync("objdump", ["-D", "-b", "binary", "-m", "i386", "-M", "i8086,intel", file], { encoding: "utf8" });
  const insns = new Map();
  for (const line of out.split("\n")) {
    const m = line.match(/^\s*([0-9a-f]+):\t([0-9a-f ]+)\t(.*)$/);
    if (!m) continue;
    insns.set(parseInt(m[1], 16), { bytes: m[2].trim().split(/\s+/).length, text: m[3].trim() });
  }
  return insns;
}

/**
 * Normalise both sides to "mnemonic op1,op2". Only the things that are actually
 * two spellings of the same instruction are folded; anything else stays and is
 * reported. This is deliberately not a fuzzy matcher — a fuzzy one would hide
 * the decoder bugs this harness exists to find.
 */
const MNEM_ALIAS = { outs: "outsw", outsw: "outsw", outsb: "outsb", ins: "insw", insw: "insw", insb: "insb" };
const CONTEXTUAL = /^(ins|outs)(b|w)?$/;

function canon(text) {
  let t = text.toLowerCase();
  t = t.replace(/\b(byte|word|dword|qword)\s+ptr\b/g, "");
  t = t.replace(/\b(a|e|s|d|cs|ds|es|ss|fs|gs):/g, "");
  t = t.replace(/[\[\]]/g, "");
  t = t.replace(/\s*([+\-*])\s*/g, "$1");
  t = t.replace(/\+0x0\b/g, "");
  t = t.replace(/\b0x0\b/g, "0");
  t = t.replace(/\s+/g, " ");
  t = t.replace(/\s*,\s*/g, ",");
  t = t.replace(/\b0x([0-9a-f]+)/g, (_, h) => parseInt(h, 16).toString(16) + "h");
  t = t.replace(/(^|\s)(\d+)h\b/g, (_, s, h) => s + parseInt(h, 16).toString(16) + "h");
  t = t.replace(/^jmp short /, "jmp ");
  // objdump leaves "far" implicit when the operand size already says dword ptr
  t = t.replace(/^(call|jmp) far /, "$1 ");
  const [mnem, ...rest] = t.split(" ");
  const key = mnem.replace(/^(rep|repne)/, "");
  if (key === "xchg") {
    // 0x93 etc. are commutative and the two tools print the register pair in
    // opposite orders.
    const operands = rest.join(" ").split(",").map((s) => s.trim()).filter(Boolean).sort();
    return [mnem, ...operands].join(" ");
  }
  if (CONTEXTUAL.test(key)) {
    // objdump writes `ins dx,WORD PTR es:[di]`, we write `insw word ptr es:[di], dx`
    const operands = rest.join(" ").split(",").map((s) => s.trim()).filter(Boolean).sort();
    return [MNEM_ALIAS[mnem] || mnem, ...operands].join(" ");
  }
  return [mnem, ...rest].join(" ");
}

const STRINGISH = /^(rep|repne)?\s*(movs|cmps|stos|lods|scas)/;

let files = 0, compared = 0, same = 0;
const diffs = [];

for (const name of readdirSync(BIN).sort()) {
  const file = join(BIN, name);
  const bytes = new Uint8Array(readFileSync(file));
  const ref = objdump(file);
  files++;

  // Compare at the addresses *our* analysis classifies as code. Bytes it calls
  // data (string blobs, partition tables) are skipped: objdump sweeps them
  // linearly and happily prints nonsense instructions for "*.COM\0".
  const boot = bytes.length === 512 ? bootSectorInfo(bytes) : null;
  const analysis = analyze(bytes, {
    base: 0,
    entries: [0],
    mode: 16,
    dataRanges: boot && boot.magic ? [[0x1be, 0x200]] : [],
  });

  let mismatches = 0, checked = 0, cosmetic = 0;
  for (const addr of analysis.order) {
    const insn = analysis.insns.get(addr);
    if (insn.data) continue;
    const theirs = ref.get(addr);
    if (!theirs) continue;
    checked++;
    compared++;
    const mine = canon(insn.repr);
    const theirsC = canon(theirs.text);
    const sameBytes = theirs.bytes === insn.len;
    if (mine === theirsC && sameBytes) { same++; }
    else if (!sameBytes) { mismatches++; diffs.push({ name, off: addr, why: `length (mine ${insn.len}, objdump ${theirs.bytes})`, mine: insn.repr, theirs: theirs.text }); }
    else if (STRINGISH.test(theirs.text) && STRINGISH.test(insn.repr)) { cosmetic++; same++; }
    else { mismatches++; diffs.push({ name, off: addr, why: "text", mine: insn.repr, theirs: theirs.text }); }
  }
  const status = mismatches === 0 ? "OK " : "!! ";
  console.log(`${status}${name.padEnd(28)} ${checked} instructions, ${mismatches} mismatch(es), ${cosmetic} string-op cosmetic`);
}

console.log(`\n${same}/${compared} instructions agree across ${files} sample(s).`);
if (diffs.length) {
  console.log("\nFirst 40 differences:");
  for (const d of diffs.slice(0, 40)) {
    console.log(`  ${d.name} +0x${d.off.toString(16)} [${d.why}] mine="${d.mine}" objdump="${d.theirs}"`);
  }
}
process.exit(diffs.length ? 1 : 0);
