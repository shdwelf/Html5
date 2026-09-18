/* CHIPWRIGHT · cw-arch.js — architecture and instruction-set analysis.
 *
 * Three jobs:
 *   1. Decode a word into an instruction, using the tables in cw-data.js.
 *   2. Decide which architecture a blob of bytes came from, and how confident
 *      that decision is allowed to be.
 *   3. Validate a boot structure (Cortex-M vector table, x86 CPUID) against the
 *      architectural rules that make it either possible or impossible.
 *
 * A disassembler built from a partial table must never pretend to be complete.
 * Every row it cannot decode is reported as an unknown encoding with its raw
 * bytes, because silently skipping or mis-decoding is what turns a disassembly
 * into fiction.
 */

import { hex, bin, u32, rd, ISA, ARCHS, IDCODES, JEP106, decodeIdcode } from "./cw-data.js";

/* ------------------------------------------------------------------ *
 * 1. Generic decoder over the ISA tables
 * ------------------------------------------------------------------ */

const maskValFromBits = (s) => {
  let mask = 0, val = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    mask <<= 1; val <<= 1;
    if (c === "1") { mask |= 1; val |= 1; }
    else if (c === "0") { mask |= 1; }
  }
  return { mask: mask >>> 0, val: val >>> 0, width: s.length };
};

/**
 * Decode-time semantics that the encoding tables do not carry.
 *
 * The ISA rows in cw-data.js describe the bit *pattern* of each instruction;
 * whether a field is a signed offset, and what it is scaled by, is a property of
 * how the CPU computes an address, not of how the instruction is laid out. It
 * lives here so that the two concerns stay separate and each is checkable.
 *
 * `signed`  — the field width in bits to sign-extend from.
 * `shift`   — how far LEFT the field is shifted to become a byte displacement.
 *             MIPS branch offsets are word displacements, so shift 2 (×4);
 *             Thumb branch offsets are halfword displacements, so shift 1 (×2).
 * `pcRel`   — the target is relative to the address AFTER this instruction.
 * `regionBits` — for MIPS J/JAL: how many top bits of PC+4 are kept and OR-ed
 *             into the shifted target, because the jump field does not carry a
 *             full address.
 * `hex`     — render the immediate in hex rather than decimal.
 */
export const DECODE_SEMANTICS = {
  thumb: {
    "B #imm11": { imm11: { signed: 11, shift: 1, pcRel: true } },
    "BEQ #imm8": { imm8: { signed: 8, shift: 1, pcRel: true } },
    "MOVS Rd, #imm8": { imm8: { hex: true } },
    "CMP Rn, #imm8": { imm8: { hex: true } },
  },
  mips: {
    "LW rt, off(rs)": { off: { signed: 16 } },
    "SW rt, off(rs)": { off: { signed: 16 } },
    "BEQ rs, rt, off": { off: { signed: 16, shift: 2, pcRel: true } },
    "BNE rs, rt, off": { off: { signed: 16, shift: 2, pcRel: true } },
    "ADDIU rt, rs, imm": { imm: { signed: 16 } },
    "LUI rt, imm": { imm: { hex: true } },
    "J target": { target: { shift: 2, regionBits: 4 } },
    "JAL target": { target: { shift: 2, regionBits: 4 } },
  },
  avr: {},
  mos6502: {},
};

/** Precompute the matchable form of every row in every ISA table. */
export function compileIsa() {
  const out = {};
  for (const [isaName, isa] of Object.entries(ISA)) {
    out[isaName] = {
      arch: isa.arch, bits: isa.bits, ev: isa.ev, note: isa.note,
      // Thumb branches are relative to instruction+4 even though the
      // instruction is 2 bytes wide; every other ISA here defaults to one
      // instruction width. See ISA.thumb.branchPcOffset in cw-data.js.
      branchPcOffset: isa.branchPcOffset ?? isa.bits / 8,
      rows: isa.rows.map((r, i) => {
        let mask = null, val = null, width = isa.bits;
        if (r.mask !== undefined && r.val !== undefined) {
          mask = typeof r.mask === "string" ? parseInt(r.mask, 2) : r.mask;
          val = typeof r.val === "string" ? parseInt(r.val, 2) : r.val;
        } else if (r.enc) {
          const mv = maskValFromBits(r.enc);
          mask = mv.mask; val = mv.val; width = mv.width;
        } else if (r.op !== undefined) {
          // 6502: whole-byte opcode.
          mask = 0xff; val = r.op; width = 8;
        }
        return { ...r, _i: i, _mask: mask >>> 0, _val: val >>> 0, _width: width };
      }),
    };
  }
  return out;
}

export const ISA_COMPILED = compileIsa();

/**
 * `pc` is the address the CPU would see; `offset` in disassemble() is the byte
 * position in the file. They differ by the load base, and the difference is
 * exactly what makes a branch target meaningful or meaningless.
 */
export function decodeInstruction(isaName, word, { pc = 0 } = {}) {
  const isa = ISA_COMPILED[isaName];
  if (!isa) return { ok: false, note: `no ISA table named "${isaName}"; known: ${Object.keys(ISA_COMPILED).join(", ")}` };
  // >>>0 matters: JavaScript's & returns a SIGNED int32, so for a 32-bit ISA a
  // mask whose top bit is set produces a negative left-hand side that never
  // equals the positive stored value. Every MIPS row above 0x80000000 would
  // silently fail to match without it.
  const w = word >>> 0;
  const matched = isa.rows.filter((r) => r._mask !== null && ((w & r._mask) >>> 0) === r._val);
  const missing = `No row in the ${isaName} table matches ${hex(word, Math.ceil(isa.bits / 4))}. Either the table is a subset (it is — these are the encodings a bootloader is made of, not the full ISA) or the word is data rather than an instruction.`;
  if (!matched.length) {
    return { ok: false, isa: isaName, word, wordHex: hex(word, isa.bits / 4), pc, note: missing };
  }
  const extract = (row) => {
    const f = {};
    for (const [name, [hi, lo]] of Object.entries(row.fields || {})) {
      const width = hi - lo + 1;
      f[name] = lo >= 31 ? Number((BigInt(w) >> BigInt(lo)) & ((1n << BigInt(width)) - 1n)) : (w >>> lo) & ((1 << width) - 1);
    }
    return f;
  };
  /*
   * A row can match the mask and still be an encoding the architecture
   * reserves — Thumb cond 0b1110 is UNDEFINED, 0b1111 is SVC. Rendering those
   * as a confident BEQ is invention, so rejectIf filters them out here.
   * "Matched the pattern but the field is reserved" is reported distinctly
   * from "no pattern matched", because the two have different implications:
   * the first says the ISA is known and this word is not valid in it.
   */
  const rows = matched.filter((r) => !(typeof r.rejectIf === "function" && r.rejectIf(extract(r))));
  if (!rows.length) {
    const why = matched.map((r) => r.reservedNote).filter(Boolean).join(" ") || missing;
    return {
      ok: false, reserved: true, isa: isaName, word, wordHex: hex(word, isa.bits / 4), pc,
      note: `Reserved encoding: ${why}`,
    };
  }
  // Longest / most-specific match first: more mask bits set wins.
  const r = rows.sort((a, b) => popcnt(b._mask) - popcnt(a._mask))[0];
  const fields = {};
  const resolved = {};
  const underflow = [];
  const sem = (DECODE_SEMANTICS[isaName] ?? {})[r.asm] ?? {};
  for (const [name, [hi, lo]] of Object.entries(r.fields || {})) {
    const width = hi - lo + 1;
    let v = lo >= 31 ? Number((BigInt(w) >> BigInt(lo)) & ((1n << BigInt(width)) - 1n)) : (w >>> lo) & ((1 << width) - 1);
    const rule = sem[name];
    // Sign-extend a field the architecture defines as signed.
    if (rule?.signed && (v >>> (rule.signed - 1)) & 1) v -= 1 << rule.signed;
    fields[name] = v;
    const nextPc = pc + isa.branchPcOffset;
    if (rule?.regionBits) {
      // MIPS J/JAL: shifted target, with the top regionBits of PC+4 kept.
      const shifted = (v << rule.shift) >>> 0;
      const regionMask = (0xffffffff << (32 - rule.regionBits)) >>> 0;
      resolved[name] = ((nextPc & regionMask) | shifted) >>> 0;
    } else if (rule?.pcRel) {
      // Keep the signed result: a target below zero means the disassembly offset
      // is not the code's real load address, and reporting 0xFFFFFFFE instead
      // would hide exactly the mistake worth noticing.
      const t = nextPc + (rule.shift ? v << rule.shift : v);
      resolved[name] = t;
      if (t < 0) underflow.push(`${r.asm} at ${hex(pc)} resolves to ${t}, which is below zero — the offset passed to the disassembler is not this code's real load address, so the branch target is not meaningful.`);
    } else {
      resolved[name] = rule?.shift ? (v << rule.shift) >>> 0 : v;
    }
  }
  const target = Object.keys(resolved).filter((k) => sem[k]?.pcRel);
  // Render fields in assembly convention: a register token becomes Rn / SP / LR /
  // PC, a raw immediate stays a number, and a hex-ish name is shown in hex.
  const renderField = (name, v) => {
    // Thumb/ARM register tokens. R13/R14/R15 have architectural names.
    if (/^(Rd|Rn|Rm|Rt|Rs|RdHi|RdLo|Dd|Dn|Dm|Sd)$/.test(name)) {
      return { 13: "SP", 14: "LR", 15: "PC" }[v] ?? `R${v}`;
    }
    // MIPS register numbers are conventionally written $n. `sa` is a shift
    // AMOUNT, not a register, so it is deliberately excluded here.
    if (/^(rs|rt|rd)$/.test(name)) return `$${v}`;
    if (name === "sa") return String(v);
    if (/^(cond|opcode|funct|mode|type|atype|dimensions)$/i.test(name)) return `0x${v.toString(16)}`;
    // A branch offset renders as its resolved target, which is what a reader
    // actually wants; the raw field stays available in `fields`.
    if (sem[name]?.pcRel) return resolved[name] < 0 ? `<${resolved[name]}>` : hex(resolved[name]);
    // J/JAL render as the full effective address, not the raw 26-bit field.
    if (sem[name]?.regionBits) return hex(resolved[name]);
    if (sem[name]?.hex && v >= 10) return `0x${(v >>> 0).toString(16).toUpperCase()}`;
    // The asm templates already carry their own '#', so immediates render bare.
    if (/imm|addr|offset|const|value|target|off/i.test(name)) return String(v);
    if (/^(M|P)$/.test(name)) return v ? { M: "LR", P: "PC" }[name] : "";
    // A Thumb register-list byte expands to the actual list.
    if (/^r7_r0$/.test(name)) return null; // handled by regList below
    return String(v);
  };
  // Build the register list for PUSH/POP, which the template writes as
  // "{regs, LR}" / "{regs, PC}" and which cannot be substituted token-by-token.
  const regList = (() => {
    if (!("r7_r0" in fields)) return null;
    const names = [];
    for (let i = 0; i < 8; i++) if ((fields.r7_r0 >>> i) & 1) names.push(`R${i}`);
    if (fields.M) names.push("LR");
    if (fields.P) names.push("PC");
    return names.length ? `{${names.join(", ")}}` : "{}";
  })();
  const text = regList !== null
    ? r.asm.replace(/\{[^}]*\}/, regList)
    : r.asm.replace(/[A-Za-z_][A-Za-z0-9_]*/g, (tok) => {
        if (!(tok in fields)) return tok;
        const out = renderField(tok, fields[tok]);
        return out === null ? tok : out;
      });
  return {
    ok: true, isa: isaName, pc, word, wordHex: hex(word, Math.ceil(isa.bits / 4)),
    asm: r.asm, text, fields, resolved,
    branchTarget: target.length ? (resolved[target[0]] < 0 ? null : hex(resolved[target[0]])) : null,
    warnings: underflow,
    bytes: r.len ?? (isa.bits / 8),
    ambiguous: rows.length > 1,
    alternatives: rows.length > 1 ? rows.slice(1).map((x) => x.asm) : [],
    note: r.note || "",
    ev: isa.ev,
  };
}

const popcnt = (n) => { let c = 0, x = n >>> 0; while (x) { c += x & 1; x >>>= 1; } return c; };

/**
 * Disassemble a byte range. Reports coverage honestly: the fraction of
 * instructions decoded is a property of the *table*, not of the code, and a low
 * number does not mean the code is bad.
 */
export function disassemble(isaName, bytes, { offset = 0, length = null, limit = 512, endian = null, loadBase = null } = {}) {
  const isa = ISA_COMPILED[isaName];
  if (!isa) return { ok: false, note: `no ISA table "${isaName}"` };
  const be = endian ?? (ARCHS.find((a) => a.id === isa.arch)?.endian.startsWith("big") ? "be" : "le");
  const step = isa.bits / 8;
  const end = Math.min(bytes.length, offset + (length ?? bytes.length - offset));
  // Where the CPU would see this code. Defaulting to the file offset is what
  // makes every PC-relative branch look wrong; supplying the real load base is
  // what makes the disassembly usable.
  const base = loadBase ?? (isaName === "thumb" ? 0x08000000 : 0);
  const out = [];
  let decoded = 0;
  for (let i = offset; i + step <= end && out.length < limit; i += step) {
    const pc = base + (i - offset);
    const word = step === 1 ? bytes[i]
      : step === 2 ? (be === "be" ? rd.u16be(bytes, i) : rd.u16le(bytes, i))
      : (be === "be" ? rd.u32be(bytes, i) : rd.u32le(bytes, i));
    const d = decodeInstruction(isaName, word, { pc });
    if (d.ok) decoded++;
    out.push({ pc, pcHex: hex(pc), fileOffset: i, fileOffsetHex: hex(i), word, wordHex: hex(word, step * 2), ok: d.ok,
      text: d.ok ? d.text : `.word ${hex(word, step * 2)}`, asm: d.asm ?? null,
      branchTarget: d.branchTarget ?? null, warnings: d.warnings ?? [], note: d.note ?? "" });
  }
  return {
    ok: true, isa: isaName, endian: be, loadBase: base,
    loadBaseNote: loadBase === null
      ? `No load base was supplied, so branch targets are computed against ${hex(base)} — the default for this ISA. If this code actually lives elsewhere in the address map, pass loadBase and the targets will be right.`
      : `Load base ${hex(base)}; PC-relative targets are computed against it.`,
    count: out.length, decoded,
    coverage: out.length ? decoded / out.length : 0,
    instructions: out,
    warnings: out.flatMap((i) => i.warnings ?? []),
    note: out.length
      ? `${decoded}/${out.length} words decoded (${((decoded / out.length) * 100).toFixed(0)}%). These tables are deliberately partial — they cover the encodings a bootloader or a vector table is made of, not the whole ISA. The undecoded words are shown as raw .word values rather than guessed at.`
      : "Nothing to disassemble in the given range.",
  };
}

/* ------------------------------------------------------------------ *
 * 2. Architecture identification from bytes
 * ------------------------------------------------------------------ */

export function identifyArchitecture(bytes, { offset = 0 } = {}) {
  const scores = [];
  const take = (id, points, why) => { const e = scores.find((s) => s.id === id); if (e) { e.score += points; e.evidence.push(why); } else scores.push({ id, score: points, evidence: [why] }); };

  const n = Math.min(bytes.length - offset, 4096);
  if (n < 4) return { ok: false, note: "Not enough bytes to say anything." };

  // --- Cortex-M vector table: word0 = initial SP (in SRAM), word1 = reset
  // handler (in flash, bit0 set for Thumb), then NMI/HardFault.
  const w0 = rd.u32le(bytes, offset), w1 = rd.u32le(bytes, offset + 4);
  const w2 = rd.u32le(bytes, offset + 8), w3 = rd.u32le(bytes, offset + 12);
  const spPlausible = w0 >= 0x20000000 && w0 < 0x40000000 && (w0 & 3) === 0;
  const resetThumb = (w1 & 1) === 1 && w1 >= 0x08000000 && w1 < 0x20000000;
  const resetThumbLow = (w1 & 1) === 1 && w1 >= 0x00000000 && w1 < 0x20000000;
  if (spPlausible && resetThumb) take("cortex-m", 6, `word0 ${hex(w0)} is a plausible initial SP in SRAM and word1 ${hex(w1)} is a Thumb reset vector in flash`);
  else if (spPlausible && resetThumbLow) take("cortex-m", 3, `word0 ${hex(w0)} is a plausible SP; word1 ${hex(w1)} is Thumb but in the code-alias region, so the flash base may not be 0x08000000`);
  if ((w2 & 1) === 1 && (w3 & 1) === 1 && resetThumbLow) take("cortex-m", 1, "NMI and HardFault vectors also have bit0 set, as Thumb requires");
  if (spPlausible && resetThumb) {
    // Count how many of the first 64 words look like Thumb code addresses.
    let good = 0;
    for (let i = 0; i < 64 && offset + (i + 1) * 4 <= bytes.length; i++) {
      const v = rd.u32le(bytes, offset + i * 4);
      if ((v & 1) === 1 && v >= 0x08000000 && v < 0x20000000) good++;
    }
    if (good > 12) take("cortex-m", 3, `${good} of the first 64 words are Thumb addresses in the flash range`);
  }

  // --- MIPS: the branch-at-reset-vector idiom. A MIPS reset vector at
  // 0xBFC00000 typically starts with a branch plus a delay-slot instruction,
  // and MIPS32 code in big-endian form has a very recognisable opcode field.
  const beOp = (rd.u32be(bytes, offset) >>> 26) & 0x3f;
  const leOp = (rd.u32le(bytes, offset) >>> 26) & 0x3f;
  for (const [endianness, op] of [["big-endian", beOp], ["little-endian", leOp]]) {
    // 0x02 J, 0x03 JAL, 0x04 BEQ, 0x05 BNE, 0x08 ADDI, 0x09 ADDIU,
    // 0x0F LUI, 0x23 LW, 0x2B SW — the opcodes that dominate real MIPS code.
    if ([0x02, 0x03, 0x04, 0x05, 0x08, 0x09, 0x0f, 0x23, 0x2b].includes(op))
      take("mips32", 2, `${endianness} top 6 bits = 0x${op.toString(16)}, a common MIPS opcode (J/JAL/branch/LUI/LW/SW)`);
  }

  // --- 6502 / AVR / 8051: these cannot be identified from bytes with any
  // confidence at all, and saying so is the correct answer.
  // --- x86 BIOS: look for the 0x55AA at a 512-byte boundary and for typical
  // 16-bit real-mode prologue bytes (FA 33 C0 8E D0, or a near jump EB/F9).
  for (let i = offset; i + 512 <= bytes.length && i < offset + 65536; i += 512) {
    if (bytes[i + 510] === 0x55 && bytes[i + 511] === 0xaa) {
      take("x86-bios", 3, `0x55AA at ${hex(i + 510)} — a 512-byte boot-sector boundary`);
      const b0 = bytes[i];
      if (b0 === 0xeb || b0 === 0xe9) take("x86-bios", 2, `short/near jump 0x${b0.toString(16)} at the start of the sector, the classic x86 boot prologue`);
      if (bytes[i] === 0xfa || bytes[i] === 0xf4 || bytes[i] === 0x33) take("x86-bios", 1, `CLI/HLT/XOR prologue byte 0x${bytes[i].toString(16)}`);
      break;
    }
  }

  // --- ESP32 / Xtensa: the ESP32 image header starts with the magic 0xE9
  // followed by segment count, SPI mode, speed/size and entry point.
  if (bytes[offset] === 0xe9 && n >= 24) {
    const segs = bytes[offset + 1];
    if (segs >= 1 && segs <= 16) take("esp32", 4, `ESP image magic 0xE9 with ${segs} segment(s) — plausible ESP32/ESP8266 image header`);
  }

  // --- AV-9 entropy heuristic: nothing. Deliberately not used. Entropy cannot
  // distinguish an ISA from compressed data, and pretending otherwise is the
  // kind of confident wrong answer this app exists to avoid.

  const ranked = scores.sort((a, b) => b.score - a.score);
  const best = ranked[0];
  const arch = best ? ARCHS.find((a) => a.id === best.id || a.id.startsWith(best.id)) : null;
  return {
    ok: !!best,
    ranked: ranked.map((r) => ({ id: r.id, score: r.score, evidence: r.evidence, arch: ARCHS.find((a) => a.id === r.id)?.name ?? r.id })),
    best: best ? best.id : null,
    arch,
    confidence: !best ? "none" : ranked.length > 1 && ranked[1].score >= best.score * 0.75 ? "low" : best.score >= 6 ? "high" : best.score >= 3 ? "medium" : "low",
    verdict: !best
      ? "No architecture identified. That is a legitimate result: these heuristics only fire on structures that are themselves architectural (a vector table, a boot signature, an image magic). Raw code without its boot structure cannot be attributed to an ISA from bytes alone, and any tool that claims otherwise is pattern-matching on noise."
      : `Best match: ${arch ? arch.name : best.id} (score ${best.score}, ${ranked.length > 1 ? `next is ${ranked[1].id} at ${ranked[1].score}` : "no competitor"}). Evidence: ${best.evidence.join("; ")}.`,
    caveat: best && best.id === "cortex-m"
      ? "A Cortex-M vector table identifies the *core family*, not the part. The same table shape appears on an STM32, a GD32, an AT32 and a CS32 clone, and the only thing that distinguishes them is the IDCODE and the flash/RAM sizes — which is exactly the substitution question this workbench exists to answer."
      : "",
  };
}

/* ------------------------------------------------------------------ *
 * 3. Cortex-M vector table validation
 *    ev: "std" (ARMv7-M ARM, B1.5).
 * ------------------------------------------------------------------ */

export const CORTEX_M_VECTORS = [
  { n: -15, name: "Reset", what: "The initial PC. Bit0 must be 1 (Thumb). A zero here means the flash is erased and the core will hard-fault immediately." },
  { n: -14, name: "NMI", what: "Non-maskable interrupt. Usually points at a clock-failure handler." },
  { n: -13, name: "HardFault", what: "The catch-all. In a bootloader that has not set up anything else, this often loops to itself." },
  { n: -12, name: "MemManage", what: "Optional — present only if the MPU is implemented." },
  { n: -11, name: "BusFault", what: "Optional." },
  { n: -10, name: "UsageFault", what: "Optional." },
  { n: -9, name: "Reserved", what: "Must be zero." },
  { n: -8, name: "Reserved", what: "Must be zero." },
  { n: -7, name: "Reserved", what: "Must be zero." },
  { n: -6, name: "Reserved", what: "Must be zero." },
  { n: -5, name: "SVCall", what: "" },
  { n: -4, name: "DebugMon", what: "Optional." },
  { n: -3, name: "Reserved", what: "Must be zero." },
  { n: -2, name: "PendSV", what: "The context-switch hook in every RTOS." },
  { n: -1, name: "SysTick", what: "" },
];

export function validateCortexMVectors(bytes, { offset = 0, flashBase = 0x08000000, ramBase = 0x20000000, ramTop = 0x20020000, count = 16 } = {}) {
  const words = [];
  for (let i = 0; i < count && offset + (i + 1) * 4 <= bytes.length; i++) words.push(rd.u32le(bytes, offset + i * 4));
  const problems = [];
  const notes = [];

  if (words.length < 16) return { ok: false, note: `Only ${words.length} words available at ${hex(offset)}; a Cortex-M vector table needs at least the 16 system entries.` };

  const sp = words[0];
  if (sp === 0xffffffff) problems.push({ severity: "fatal", what: "word 0 (initial MSP) is 0xFFFFFFFF", why: "The flash is erased at the vector table. The core loads SP = 0xFFFFFFFF and PC = 0xFFFFFFFE and faults before executing a single instruction. This is not a firmware bug, it is an empty chip." });
  else if (sp === 0) problems.push({ severity: "fatal", what: "word 0 (initial MSP) is 0x00000000", why: "Same failure, different cause: either the flash is zeroed or the read is wrong." });
  else if (!(sp >= ramBase && sp < ramTop)) problems.push({ severity: "warn", what: `word 0 = ${hex(sp)} is not in the SRAM range ${hex(ramBase)}-${hex(ramTop)}`, why: "Either the RAM base/size assumed here is wrong for this part, or the vector table is not at this offset. Some parts boot from 0x00000000 with RAM elsewhere." });
  else if (sp & 7) notes.push(`initial MSP ${hex(sp)} is not 8-byte aligned — the AAPCS requires it to be at exception entry, so this is unusual but not impossible for a boot stage.`);
  else notes.push(`initial MSP ${hex(sp)} — plausible, 8-byte aligned, inside the assumed SRAM.`);

  const reset = words[1];
  if (reset === 0xffffffff) problems.push({ severity: "fatal", what: "word 1 (Reset handler) is 0xFFFFFFFF", why: "Erased flash. Nothing will run." });
  else if (!(reset & 1)) problems.push({ severity: "fatal", what: `Reset handler ${hex(reset)} has bit0 clear`, why: "On Cortex-M every vector is a Thumb address and bit0 must be 1. Bit0 clear causes an immediate INVSTATE usage fault. A vector table with bit0 clear was written by something that did not know it was writing ARM code." });
  else if (reset < flashBase || reset >= flashBase + 0x02000000) problems.push({ severity: "warn", what: `Reset handler ${hex(reset)} is outside ${hex(flashBase)}-ish`, why: "The flash may be aliased at 0x00000000 by the boot pins, which is normal — but if the address is not in any mapped code region the table is not for this part." });
  else notes.push(`Reset handler ${hex(reset)} — Thumb, inside the assumed flash range.`);

  const reservedIdx = [6, 7, 8, 9, 12];
  for (const i of reservedIdx) if (words[i] !== 0) problems.push({ severity: "warn", what: `vector slot ${i} (reserved) = ${hex(words[i])}`, why: "Reserved slots must be zero. A non-zero value means the table was built by something using a different layout, or the offset is wrong." });

  let thumbCount = 0;
  for (let i = 1; i < 16; i++) if (words[i] & 1) thumbCount++;
  notes.push(`${thumbCount}/15 of the handler vectors have bit0 set (Thumb).`);
  if (thumbCount < 8 && words[1] !== 0xffffffff) problems.push({ severity: "warn", what: `only ${thumbCount} of 15 handlers are Thumb addresses`, why: "Most handlers normally point at real code. A table where only a few do usually means the firmware fills unused slots with a single shared default handler — which is legitimate — or that the table is not fully populated." });

  return {
    ok: !problems.some((p) => p.severity === "fatal"),
    words: words.map((w, i) => ({ index: i, value: w, hex: hex(w), name: i === 0 ? "Initial MSP" : (CORTEX_M_VECTORS.find((v) => v.n === i - 16)?.name ?? `IRQ ${i - 16}`), thumb: i > 0 && (w & 1) === 1 })),
    problems, notes,
    verdict: problems.some((p) => p.severity === "fatal")
      ? `This vector table cannot boot: ${problems.filter((p) => p.severity === "fatal").map((p) => p.what).join("; ")}.`
      : problems.length
        ? `The table is bootable but ${problems.length} issue(s) need explaining before you trust it.`
        : "The vector table is architecturally valid: SP in RAM and 8-aligned, Thumb reset handler in flash, reserved slots zero.",
    ev: "std",
  };
}

/* ------------------------------------------------------------------ *
 * 4. x86 CPUID decode
 *    ev: "std" for the leaf structure; "tool" for the feature-bit names, which
 *    are quoted from the Intel SDM Vol. 2A CPUID tables and from Linux's
 *    arch/x86/include/asm/cpufeatures.h.
 * ------------------------------------------------------------------ */

export const CPUID_LEAF0_VENDORS = [
  { str: "GenuineIntel", vendor: "Intel", ev: "std" },
  { str: "AuthenticAMD", vendor: "AMD", ev: "std" },
  { str: "CyrixInstead", vendor: "Cyrix / VIA / NSC", ev: "std" },
  { str: "CentaurHauls", vendor: "Centaur / VIA", ev: "std" },
  { str: "GenuineTMx86", vendor: "Transmeta", ev: "std" },
  { str: "Geode by NSC", vendor: "National Semiconductor Geode", ev: "std" },
  { str: "NexGenDriven", vendor: "NexGen", ev: "std" },
  { str: "RiseRiseRise", vendor: "Rise Technology", ev: "std" },
  { str: "SiS SiS SiS ", vendor: "SiS", ev: "std" },
  { str: "UMC UMC UMC ", vendor: "UMC", ev: "std" },
  { str: "bhyve bhyve ", vendor: "bhyve hypervisor", ev: "tool" },
  { str: "KVMKVMKVM\0\0\0", vendor: "KVM hypervisor", ev: "tool" },
  { str: "Microsoft Hv", vendor: "Microsoft Hyper-V", ev: "tool" },
  { str: "VMwareVMware", vendor: "VMware", ev: "tool" },
  { str: "XenVMMXenVMM", vendor: "Xen", ev: "tool" },
  { str: "TCGTCGTCGTCG", vendor: "QEMU/TCG", ev: "tool" },
  { str: "VBoxVBoxVBox", vendor: "VirtualBox", ev: "tool" },
  { str: "prl hyperv  ", vendor: "Parallels", ev: "tool" },
];

export const CPUID_FEAT_ECX_LEAF1 = [
  { bit: 0, name: "SSE3", ev: "std" }, { bit: 1, name: "PCLMULQDQ", ev: "std" },
  { bit: 2, name: "DTES64", ev: "std" }, { bit: 3, name: "MONITOR", ev: "std" },
  { bit: 4, name: "DS-CPL", ev: "std" }, { bit: 5, name: "VMX", ev: "std" },
  { bit: 6, name: "SMX", ev: "std" }, { bit: 7, name: "EIST", ev: "std" },
  { bit: 8, name: "TM2", ev: "std" }, { bit: 9, name: "SSSE3", ev: "std" },
  { bit: 10, name: "CNXT-ID", ev: "std" }, { bit: 11, name: "SDBG", ev: "std" },
  { bit: 12, name: "FMA", ev: "std" }, { bit: 13, name: "CMPXCHG16B", ev: "std" },
  { bit: 14, name: "xTPR", ev: "std" }, { bit: 15, name: "PDCM", ev: "std" },
  { bit: 17, name: "PCID", ev: "std" }, { bit: 18, name: "DCA", ev: "std" },
  { bit: 19, name: "SSE4.1", ev: "std" }, { bit: 20, name: "SSE4.2", ev: "std" },
  { bit: 21, name: "x2APIC", ev: "std" }, { bit: 22, name: "MOVBE", ev: "std" },
  { bit: 23, name: "POPCNT", ev: "std" }, { bit: 24, name: "TSC-Deadline", ev: "std" },
  { bit: 25, name: "AES-NI", ev: "std" }, { bit: 26, name: "XSAVE", ev: "std" },
  { bit: 27, name: "OSXSAVE", ev: "std" }, { bit: 28, name: "AVX", ev: "std" },
  { bit: 29, name: "F16C", ev: "std" }, { bit: 30, name: "RDRAND", ev: "std" },
  { bit: 31, name: "Hypervisor present", ev: "std", what: "Set by a hypervisor to tell a guest it is not on bare metal. If this is set on a machine you believe is physical, that belief is the thing to re-examine." },
];

export const CPUID_FEAT_EDX_LEAF1 = [
  { bit: 0, name: "FPU (x87)", ev: "std", what: "The on-chip math coprocessor. Its absence is what the BIOS coprocessor probe in cw-data-firmware.js is testing for." },
  { bit: 1, name: "VME", ev: "std" }, { bit: 2, name: "DE", ev: "std" },
  { bit: 3, name: "PSE", ev: "std" }, { bit: 4, name: "TSC", ev: "std" },
  { bit: 5, name: "MSR", ev: "std" }, { bit: 6, name: "PAE", ev: "std" },
  { bit: 7, name: "MCE", ev: "std" }, { bit: 8, name: "CX8", ev: "std" },
  { bit: 9, name: "APIC", ev: "std" }, { bit: 11, name: "SEP", ev: "std" },
  { bit: 12, name: "MTRR", ev: "std" }, { bit: 13, name: "PGE", ev: "std" },
  { bit: 14, name: "MCA", ev: "std" }, { bit: 15, name: "CMOV", ev: "std" },
  { bit: 16, name: "PAT", ev: "std" }, { bit: 17, name: "PSE-36", ev: "std" },
  { bit: 18, name: "PSN", ev: "std" }, { bit: 19, name: "CLFSH", ev: "std" },
  { bit: 21, name: "DS", ev: "std" }, { bit: 22, name: "ACPI", ev: "std" },
  { bit: 23, name: "MMX", ev: "std" }, { bit: 24, name: "FXSR", ev: "std" },
  { bit: 25, name: "SSE", ev: "std" }, { bit: 26, name: "SSE2", ev: "std" },
  { bit: 27, name: "SS", ev: "std" }, { bit: 28, name: "HTT", ev: "std" },
  { bit: 29, name: "TM", ev: "std" }, { bit: 31, name: "PBE", ev: "std" },
];

export const CPUID_FEAT_LEAF7_EBX = [
  { bit: 0, name: "FSGSBASE", ev: "std" }, { bit: 1, name: "IA32_TSC_ADJUST", ev: "std" },
  { bit: 2, name: "SGX", ev: "std" }, { bit: 3, name: "BMI1", ev: "std" },
  { bit: 4, name: "HLE", ev: "std" }, { bit: 5, name: "AVX2", ev: "std" },
  { bit: 6, name: "FDP_EXCPTN_ONLY", ev: "std" }, { bit: 7, name: "SMEP", ev: "std" },
  { bit: 8, name: "BMI2", ev: "std" }, { bit: 9, name: "ERMS", ev: "std" },
  { bit: 10, name: "INVPCID", ev: "std" }, { bit: 11, name: "RTM", ev: "std" },
  { bit: 12, name: "PQM / RDT-M", ev: "std" }, { bit: 13, name: "FPU CS/DS deprecated", ev: "std" },
  { bit: 14, name: "MPX", ev: "std" }, { bit: 15, name: "PQE / RDT-A", ev: "std" },
  { bit: 16, name: "AVX512F", ev: "std", what: "The live portability hazard: a chip with AVX-512 and one without both run the same OS, and only the workload that uses it faults." },
  { bit: 17, name: "AVX512DQ", ev: "std" }, { bit: 18, name: "RDSEED", ev: "std" },
  { bit: 19, name: "ADX", ev: "std" }, { bit: 20, name: "SMAP", ev: "std" },
  { bit: 21, name: "AVX512_IFMA", ev: "std" }, { bit: 23, name: "CLFLUSHOPT", ev: "std" },
  { bit: 24, name: "CLWB", ev: "std" }, { bit: 25, name: "Intel PT", ev: "std" },
  { bit: 26, name: "AVX512PF", ev: "std" }, { bit: 27, name: "AVX512ER", ev: "std" },
  { bit: 28, name: "AVX512CD", ev: "std" }, { bit: 29, name: "SHA", ev: "std" },
  { bit: 30, name: "AVX512BW", ev: "std" }, { bit: 31, name: "AVX512VL", ev: "std" },
];

export const CPUID_FEAT_LEAF7_ECX = [
  { bit: 0, name: "PREFETCHWT1", ev: "std" }, { bit: 1, name: "AVX512_VBMI", ev: "std" },
  { bit: 2, name: "UMIP", ev: "std" }, { bit: 3, name: "PKU", ev: "std" },
  { bit: 4, name: "OSPKE", ev: "std" }, { bit: 5, name: "WAITPKG", ev: "std" },
  { bit: 6, name: "AVX512_VBMI2", ev: "std" }, { bit: 7, name: "CET_SS", ev: "std" },
  { bit: 8, name: "GFNI", ev: "std" }, { bit: 9, name: "VAES", ev: "std" },
  { bit: 10, name: "VPCLMULQDQ", ev: "std" }, { bit: 11, name: "AVX512_VNNI", ev: "std" },
  { bit: 12, name: "AVX512_BITALG", ev: "std" }, { bit: 14, name: "AVX512_VPOPCNTDQ", ev: "std" },
  { bit: 16, name: "LA57 (5-level paging)", ev: "std" }, { bit: 22, name: "RDPID", ev: "std" },
  { bit: 25, name: "CLDEMOTE", ev: "std" }, { bit: 27, name: "MOVDIRI", ev: "std" },
  { bit: 28, name: "MOVDIR64B", ev: "std" }, { bit: 29, name: "ENQCMD", ev: "std" },
  { bit: 30, name: "SGX_LC", ev: "std" },
];

function regToAscii(...regs) {
  let s = "";
  for (const r of regs) for (const sh of [0, 8, 16, 24]) {
    const c = (r >>> sh) & 0xff;
    if (c) s += String.fromCharCode(c);
  }
  return s;
}

export function decodeCpuid({ leaf0, leaf1, leaf7, leaf80000002, leaf80000003, leaf80000004 }) {
  const out = { ok: true };
  if (leaf0) {
    const [a, b, c, d] = leaf0;
    out.maxLeaf = a;
    out.vendorString = regToAscii(b, d, c);
    out.vendor = CPUID_LEAF0_VENDORS.find((v) => v.vendorString === out.vendorString)?.vendor ?? CPUID_LEAF0_VENDORS.find((v) => v.str === out.vendorString)?.vendor ?? "unrecognised";
    out.vendorEv = "std";
    out.hypervisorVendorString = out.vendorString.includes(" ") && CPUID_LEAF0_VENDORS.some((v) => v.ev === "tool" && v.str === out.vendorString) ? out.vendorString : null;
  }
  if (leaf1) {
    const [a, b, c, d] = leaf1;
    const stepping = a & 0xf;
    const baseModel = (a >>> 4) & 0xf;
    const baseFamily = (a >>> 8) & 0xf;
    const type = (a >>> 12) & 0x3;
    const extModel = (a >>> 16) & 0xf;
    const extFamily = (a >>> 20) & 0xff;
    const family = baseFamily === 0xf ? baseFamily + extFamily : baseFamily;
    const model = (baseFamily === 0x6 || baseFamily === 0xf) ? (extModel << 4) + baseModel : baseModel;
    out.signature = { raw: hex(a), stepping, baseModel, baseFamily, type, extModel, extFamily, family, model,
      display: `Family ${family} (0x${family.toString(16)}), Model ${model} (0x${model.toString(16)}), Stepping ${stepping}` };
    out.ecx = bitsSet(c, CPUID_FEAT_ECX_LEAF1);
    out.edx = bitsSet(d, CPUID_FEAT_EDX_LEAF1);
    out.brandFeatures = {
      fpu: !!((d >>> 0) & 1),
      tsc: !!((d >>> 4) & 1),
      apic: !!((d >>> 9) & 1),
      ht: !!((d >>> 28) & 1),
      avx: !!((c >>> 28) & 1),
      aesni: !!((c >>> 25) & 1),
      hypervisorGuest: !!((c >>> 31) & 1),
    };
    out.logicalProcessors = (b >>> 16) & 0xff;
    out.clflushLine = ((b >>> 8) & 0xff) * 8;
    out.apicId = (b >>> 24) & 0xff;
  }
  if (leaf7 && leaf7.length >= 3) {
    out.leaf7 = { ebx: bitsSet(leaf7[1], CPUID_FEAT_LEAF7_EBX), ecx: bitsSet(leaf7[2], CPUID_FEAT_LEAF7_ECX), maxSubleaf: leaf7[0] };
  }
  const brand = leaf80000002 && leaf80000003 && leaf80000004
    ? regToAscii(...leaf80000002, ...leaf80000003, ...leaf80000004).replace(/\0+$/, "").replace(/\s+/g, " ").trim()
    : null;
  out.brandString = brand;
  return out;
}

function bitsSet(word, table) {
  return table.filter((f) => (word >>> f.bit) & 1).map((f) => ({ bit: f.bit, name: f.name, ev: f.ev, what: f.what ?? "" }));
}

/**
 * Diff two CPUIDs feature by feature. This is the substitution question in its
 * purest form: what does the replacement part do that the original did not, and
 * — much more importantly — what did the original do that the replacement does
 * not? Only the second direction breaks software.
 */
export function diffCpuid(original, replacement) {
  const key = (o) => new Set(o.map((f) => f.name));
  const groups = [
    { name: "leaf1 ECX", present: !!(original.ecx && replacement.ecx), a: original.ecx ?? [], b: replacement.ecx ?? [] },
    { name: "leaf1 EDX", present: !!(original.edx && replacement.edx), a: original.edx ?? [], b: replacement.edx ?? [] },
    { name: "leaf7 EBX", present: !!(original.leaf7 && replacement.leaf7), a: original.leaf7?.ebx ?? [], b: replacement.leaf7?.ebx ?? [] },
    { name: "leaf7 ECX", present: !!(original.leaf7 && replacement.leaf7), a: original.leaf7?.ecx ?? [], b: replacement.leaf7?.ecx ?? [] },
  ];
  // A group where one side was never captured is NOT a difference — reporting it
  // as one would claim the replacement lost features that were simply never read.
  const skipped = groups.filter((g) => !g.present).map((g) => g.name);
  const lost = [], gained = [];
  for (const g of groups) {
    if (!g.present) continue;
    const ka = key(g.a), kb = key(g.b);
    for (const f of g.a) if (!kb.has(f.name)) lost.push({ group: g.name, ...f });
    for (const f of g.b) if (!ka.has(f.name)) gained.push({ group: g.name, ...f });
  }
  return {
    lost, gained, skippedGroups: skipped,
    comparedGroups: groups.filter((g) => g.present).map((g) => g.name),
    signatureDiffers: original.signature?.display !== replacement.signature?.display,
    vendorDiffers: original.vendor !== replacement.vendor,
    brandDiffers: original.brandString !== replacement.brandString,
    verdict: skipped.length
      ? `Could not compare ${skipped.join(", ")} — that leaf was not captured for one of the two CPUs. Capture it before drawing any conclusion; the comparison below covers only ${groups.filter((g) => g.present).map((g) => g.name).join(", ")}. `
      : ""
    + (lost.length === 0 && gained.length === 0
      ? "No feature difference in the compared leaves. That is the strongest statement CPUID can support — it does not prove the parts are interchangeable, only that they expose the same ISA to software."
      : [
        lost.length ? `LOST (${lost.length}): ${lost.map((f) => f.name).join(", ")}. Software that uses any of these will fault or silently take a different path on the replacement. This is the direction that breaks things.` : "No features lost.",
        gained.length ? `GAINED (${gained.length}): ${gained.map((f) => f.name).join(", ")}. Harmless for existing software, but a compiler or runtime that auto-detects these may now emit code the original could not run — which matters if the two parts share a boot image.` : "",
        original.vendor !== replacement.vendor ? "Different vendor. This is a platform change, not a chip swap: new microcode, new firmware, new drivers, and a different errata list." : "",
      ].filter(Boolean).join(" ")),
    ev: "std",
  };
}

/* ------------------------------------------------------------------ *
 * 5. JTAG IDCODE → architecture inference
 * ------------------------------------------------------------------ */

/**
 * Resolve the JEDEC designer from an IDCODE's manufacturer field.
 *
 * The bank (continuation code) is part of the identity, not decoration: 0xC8 in
 * bank 7 is GigaDevice and 0xC8 in bank 1 is Apple. Any lookup that ignores the
 * continuation code will eventually name the wrong company, which on a
 * substitution decision is the difference between a working repair and a dead
 * board. ev: "std" (Arm KA001301) / "tool" (flashrom, EDK2 JedecJep106Lib).
 */
export function lookupJep106(d) {
  const hit = JEP106.find((j) => j.cont === d.continuationCode && j.code === d.identity);
  return hit ? { ...hit, matchedOnBank: true } : { vendor: null, cont: d.continuationCode, code: d.identity, matchedOnBank: false, ev: "none" };
}

export function idcodeToArchitecture(idcode) {
  const d = decodeIdcode(idcode);
  const known = IDCODES.find((k) => k.id === d.raw);
  const jedec = d.structurallyValid ? lookupJep106(d) : null;
  const designerKnown = !!(jedec && jedec.vendor);
  const designer = designerKnown ? jedec.vendor : null;
  const isArm = designerKnown && /arm/i.test(designer);
  const hints = [];
  if (isArm) hints.push({
    arch: "cortex-m", designer, ev: "std",
    why: "The JEDEC designer field resolves to Arm Ltd (bank ${d.jedecBank}, identity ${hex(d.identity, 2)}), so this IDCODE belongs to an Arm CoreSight debug port. On a microcontroller that means a Cortex-M core behind it; on an application processor a Cortex-A.",
  });
  if (known) hints.push({
    arch: isArm ? "cortex-m" : null, ev: known.ev,
    why: `${hex(known.id)} is in this workbench's known-IDCODE table: ${known.family}. ${known.note}`,
  });
  hints.push({
    arch: null, partNumber: d.partNumber, partHex: d.partHex, ev: "tool",
    note: "The part-number field identifies the DEBUG PORT, not the microcontroller. An STM32F103 and a GD32F103 both present 0x1BA01477 because both use the same Arm CoreSight DAP. An IDCODE match is therefore not evidence of part equivalence, and this workbench refuses to treat it as such.",
  });
  const archHint = hints.find((h) => h.arch);
  return {
    idcode: d, hints, jedec, known: known ?? null,
    designerKnown, designer, isArm,
    verdict: !d.structurallyValid
      ? `IDCODE ${hex(idcode)} is not structurally valid: LSB=${d.lsbIsOne ? 1 : 0} (must be 1), odd parity ${d.parityIsOdd ? "OK" : "FAILED"}, identity ${hex(d.identity, 2)}. A malformed IDCODE is a chain fault, not a device fault — a wrong IR length, a mis-clocked TAP, or two devices driving TDO. Fix the chain before concluding anything about the silicon.`
      : !designerKnown
        ? `IDCODE ${hex(idcode)} is structurally valid but its JEDEC designer (bank ${d.jedecBank}, identity ${hex(d.identity, 2)}) is not in this workbench's table, so no architecture can be inferred from it. That is a gap in the table, not a fault in the reading — the bank and identity above are enough to look the assignment up in JEDEC JEP106 directly.`
        : archHint
          ? `Narrowed to a CoreSight-attached ${archHint.arch.toUpperCase()}-class core, designer ${designer}${known ? `, known family ${known.family}` : ""}. That is the limit of what an IDCODE can tell you. Name the actual silicon from the vendor's own device-ID register (DBGMCU_IDCODE at 0xE0042000 on STM32, EFUSE_BLK1 on ESP32, and so on) plus the flash and RAM sizes — those do distinguish the part, and they are what a substitution decision has to rest on.`
          : `Designer ${designer} recognised, but the IDCODE carries no architecture hint on its own.`,
  };
}

export { hex, bin, u32, ARCHS };
