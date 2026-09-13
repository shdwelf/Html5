/**
 * avrdis.js — a disassembler for the classic Atmel AVR core (ATmega/ATtiny),
 * written to agree with `avr-objdump` instruction for instruction. That claim is
 * not decoration: tools/verify_avrdis.mjs replays the 225 instructions of
 * samples/avr/optiboot_atmega328.lst — the vendor's own listing from the pinned
 * Optiboot commit — through this decoder and fails on any mnemonic or operand
 * mismatch.
 *
 * Encoding reference: Atmel "AVR Instruction Set Manual" (the classic core:
 * ATmega48/88/168/328, ATmega16/32, ATtiny). Aliases are printed in their base
 * form, the way avr-objdump does: `eor r1, r1`, not `clr r1`.
 *
 * Operand formatting follows avr-objdump exactly:
 *   registers      r24
 *   immediates     0x0A        (two hex digits, uppercase)
 *   I/O addresses  0x34
 *   data addresses 0x0081      (four hex digits)
 *   branches       .+24 / .-30 (decimal, relative to the *next* instruction)
 *   indirect       X, X+, -X, Y, Z, Z+, -Z, Y+q, Z+q
 */

export const WORDSIZE = 2;

const hex2 = (v) => `0x${(v & 0xff).toString(16).toUpperCase().padStart(2, "0")}`;
const hex4 = (v) => `0x${(v & 0xffff).toString(16).toUpperCase().padStart(4, "0")}`;
const reg = (v) => `r${v & 0x1f}`;
/** objdump prints register pairs as the even register of the pair. */
const pair = (v) => `r${(v & 0x1f) & ~1}`;
const rel = (delta) => (delta < 0 ? `.-${-delta}` : `.+${delta}`);

/**
 * Decode one instruction.
 * @param {Uint8Array} bytes image, word-addressed by `at` (byte address)
 * @param {number} at offset into `bytes` (byte address minus image base)
 * @param {number} addr the AVR program address of that instruction, for branches
 * @returns {{mnemonic:string, operands:string, size:number, words:number[]}|null}
 */
export function decode(bytes, at, addr) {
  if (at + 2 > bytes.length) return null;
  const w = bytes[at] | (bytes[at + 1] << 8);
  const next = (size) => addr + 2 * size;

  const R = (w >> 4) & 0x1f;                 // rd
  const r = ((w >> 5) & 0x10) | (w & 0x0f);  // second register (bit 9 holds its high bit)
  const d = (w >> 4) & 0x1f;
  const K8 = ((w >> 4) & 0xf0) | (w & 0x0f);
  const d4 = 16 + ((w >> 4) & 0x0f);         // immediates to r16..r31
  const k7 = (w >> 3) & 0x7f;
  const bit = w & 0x07;
  const io5 = (w >> 3) & 0x1f;
  const A6 = ((w >> 3) & 0x30) | (w & 0x0f);
  const branchTarget = (k) => {
    let off = k & 0x7f;                    // 7-bit signed word offset
    if (off & 0x40) off -= 0x80;
    return rel(off * 2);
  };

  // ------------------------------------------------ 32-bit forms first
  if ((w & 0xfe0e) === 0x940c || (w & 0xfe0e) === 0x940e) {
    if (at + 4 > bytes.length) return null;
    const w2 = bytes[at + 2] | (bytes[at + 3] << 8);
    const k = ((w & 0x01f0) << 13) | ((w & 0x0001) << 16) | w2;
    const target = k * 2;
    return (w & 0x0001) === 0
      ? { mnemonic: "jmp", operands: hex4(target >> 16) === "0x0000" ? `0x${target.toString(16).toUpperCase().padStart(4, "0")}` : `0x${target.toString(16).toUpperCase()}`, size: 4 }
      : { mnemonic: "call", operands: `0x${target.toString(16).toUpperCase().padStart(4, "0")}`, size: 4 };
  }
  if ((w & 0xfe0f) === 0x9000 || (w & 0xfe0f) === 0x9200) {
    // LDS / STS, 32-bit: 1001 000d dddd 0000 / 1001 001d dddd 0000 + address
    if (at + 4 > bytes.length) return null;
    const w2 = bytes[at + 2] | (bytes[at + 3] << 8);
    return (w & 0xfe0f) === 0x9000
      ? { mnemonic: "lds", operands: `${reg(d)}, ${hex4(w2)}`, size: 4 }
      : { mnemonic: "sts", operands: `${hex4(w2)}, ${reg(d)}`, size: 4 };
  }

  // ------------------------------------------------ 16-bit forms
  const one = (mnemonic, operands) => ({ mnemonic, operands, size: 2 });

  if (w === 0x0000) return one("nop", "");

  // movw / muls / fmul family
  if ((w & 0xff00) === 0x0100) {
    const dst = 2 * ((w >> 4) & 0x0f), src = 2 * (w & 0x0f);
    return one("movw", `r${dst}, r${src}`);
  }
  if ((w & 0xff00) === 0x0200) return one("muls", `${reg(16 + ((w >> 4) & 0x0f))}, ${reg(16 + (w & 0x0f))}`);
  if ((w & 0xff00) === 0x0300) {
    const a = 16 + ((w >> 4) & 0x07), b = 16 + (w & 0x07);
    const bit3 = (w >> 3) & 1, bit7 = (w >> 7) & 1;
    if (!bit7 && !bit3) return one("mulsu", `${reg(a)}, ${reg(b)}`);
    if (!bit7 && bit3) return one("fmul", `${reg(a)}, ${reg(b)}`);
    if (bit7 && !bit3) return one("fmuls", `${reg(a)}, ${reg(b)}`);
    return one("fmulsu", `${reg(a)}, ${reg(b)}`);
  }

  const op2 = (w >> 10) & 0x3f;
  const twoReg = {
    0x01: "cpc", 0x02: "sbc", 0x03: "add", 0x04: "cpse", 0x05: "cp",
    0x06: "sub", 0x07: "adc", 0x08: "and", 0x09: "eor", 0x0a: "or", 0x0b: "mov",
  }[op2];
  if (twoReg) return one(twoReg, `${reg(d)}, ${reg(r)}`);

  const group = w >> 12;
  if (group === 0x3) return one("cpi", `${reg(d4)}, ${hex2(K8)}`);
  if (group === 0x4) return one("sbci", `${reg(d4)}, ${hex2(K8)}`);
  if (group === 0x5) return one("subi", `${reg(d4)}, ${hex2(K8)}`);
  if (group === 0x6) return one("ori", `${reg(d4)}, ${hex2(K8)}`);
  if (group === 0x7) return one("andi", `${reg(d4)}, ${hex2(K8)}`);
  if (group === 0x9) {
    if ((w & 0xfe00) === 0x9200) {
      switch (w & 0x000f) {
        case 0x1: return one("st", `Z+, ${reg(d)}`);
        case 0x2: return one("st", `-Z, ${reg(d)}`);
        case 0x4: return one("xch", `Z, ${reg(d)}`);
        case 0x5: return one("las", `Z, ${reg(d)}`);
        case 0x6: return one("lac", `Z, ${reg(d)}`);
        case 0x7: return one("lat", `Z, ${reg(d)}`);
        case 0x8: return one("st", `Y, ${reg(d)}`);
        case 0x9: return one("st", `Y+, ${reg(d)}`);
        case 0xa: return one("st", `-Y, ${reg(d)}`);
        case 0xc: return one("st", `X, ${reg(d)}`);
        case 0xd: return one("st", `X+, ${reg(d)}`);
        case 0xe: return one("st", `-X, ${reg(d)}`);
        case 0xf: return one("push", reg(d));
        default: break;
      }
    }
    if ((w & 0xfe00) === 0x9000) {
      switch (w & 0x000f) {
        case 0x0: return one("lds", `${reg(d)}, ${hex4(((w >> 4) & 0x00f0) | (w & 0x0f))}`);
        case 0x1: return one("ld", `${reg(d)}, Z+`);
        case 0x2: return one("ld", `${reg(d)}, -Z`);
        case 0x4: return one("lpm", `${reg(d)}, Z`);
        case 0x5: return one("lpm", `${reg(d)}, Z+`);
        case 0x6: return one("elpm", `${reg(d)}, Z`);
        case 0x7: return one("elpm", `${reg(d)}, Z+`);
        case 0x9: return one("ld", `${reg(d)}, Y+`);
        case 0xa: return one("ld", `${reg(d)}, -Y`);
        case 0xc: return one("ld", `${reg(d)}, X`);
        case 0xd: return one("ld", `${reg(d)}, X+`);
        case 0xe: return one("ld", `${reg(d)}, -X`);
        case 0xf: return one("pop", reg(d));
        default: break;
      }
    }
    if ((w & 0xfe00) === 0x9200) {
      switch (w & 0x000f) {
        case 0x1: return one("st", `Z+, ${reg(d)}`);
        case 0x2: return one("st", `-Z, ${reg(d)}`);
        case 0x4: return one("xch", `Z, ${reg(d)}`);
        case 0x5: return one("las", `Z, ${reg(d)}`);
        case 0x6: return one("lac", `Z, ${reg(d)}`);
        case 0x7: return one("lat", `Z, ${reg(d)}`);
        case 0x8: return one("st", `Y, ${reg(d)}`);
        case 0x9: return one("st", `Y+, ${reg(d)}`);
        case 0xa: return one("st", `-Y, ${reg(d)}`);
        case 0xc: return one("st", `X, ${reg(d)}`);
        case 0xd: return one("st", `X+, ${reg(d)}`);
        case 0xe: return one("st", `-X, ${reg(d)}`);
        case 0xf: return one("push", reg(d));
        default: break;
      }
    }
    if ((w & 0xfe00) === 0x9400) {   // one-operand arithmetic: 1001 010d dddd oooo
      const op = w & 0x000f;
      const single = { 0x0: "com", 0x1: "neg", 0x2: "swap", 0x3: "inc", 0x5: "asr", 0x6: "lsr", 0x7: "ror", 0xa: "dec" }[op];
      if (single) return one(single, reg(d));
      if (op === 0xb) return one("des", hex2(K8));
    }
    if ((w & 0xff0f) === 0x9508) {
      const special = {
        0x08: ["ret", ""], 0x18: ["reti", ""], 0x88: ["sleep", ""], 0x98: ["break", ""],
        0xa8: ["wdr", ""], 0xc8: ["lpm", ""], 0xd8: ["elpm", ""], 0xe8: ["spm", ""],
      }[w & 0xff];
      if (special) return one(special[0], special[1]);
    }
    if ((w & 0xff00) === 0x9600) return one("adiw", `r${24 + 2 * ((w >> 4) & 0x03)}, ${hex2(A6)}`);
    if ((w & 0xff00) === 0x9700) return one("sbiw", `r${24 + 2 * ((w >> 4) & 0x03)}, ${hex2(A6)}`);
    if ((w & 0xff00) === 0x9800) return one("cbi", `${hex2(io5)}, ${bit}`);
    if ((w & 0xff00) === 0x9900) return one("sbic", `${hex2(io5)}, ${bit}`);
    if ((w & 0xff00) === 0x9a00) return one("sbi", `${hex2(io5)}, ${bit}`);
    if ((w & 0xff00) === 0x9b00) return one("sbis", `${hex2(io5)}, ${bit}`);
    if ((w & 0xfc00) === 0x9c00) return one("mul", `${reg(d)}, ${reg(r)}`);
  }
  // LDD / STD with displacement: 10q0 qq0d dddd xqqq, where bit 9 is the
  // load/store selector (1 = store) and bit 3 picks Z (0) or Y (1).
  if ((w & 0xd000) === 0x8000) {
    const q = ((w >> 8) & 0x20) | ((w >> 7) & 0x18) | (w & 0x07);
    // "10q0 qq0d dddd 0qqq" is LDD Rd, Z+q; "1qqq" in the low nibble is Y.
    // Verified against avr8js (dist/esm/cpu/instruction.js: LDDZ ...0qqq) and
    // against the Optiboot listing, where `ldi r30/r31` set Z and the store is
    // encoded 0x8390 -- i.e. bit 3 = 0 with Z selected.
    const pairName = (w & 0x0008) ? "Y" : "Z";
    // avr-objdump prints the plain form when the displacement is zero
    // ("st Z, r25", not "std Z+0, r25").
    const suffix = q ? `+${q}` : "";
    if ((w & 0x0200) === 0) {
      return q ? one("ldd", `${reg(d)}, ${pairName}${suffix}`)
               : one("ld", `${reg(d)}, ${pairName}`);
    }
    return q ? one("std", `${pairName}${suffix}, ${reg(d)}`)
             : one("st", `${pairName}, ${reg(d)}`);
  }
  if ((w & 0xf800) === 0xb000) {
    // IN: 1011 0AAd dddd AAAA - A is six bits, split as A5..A4 | A3..A0.
    const A = ((w >> 5) & 0x30) | (w & 0x0f);
    return one("in", `${reg(d)}, ${hex2(A)}`);
  }
  if ((w & 0xf800) === 0xb800) {
    const A = ((w >> 5) & 0x30) | (w & 0x0f);
    return one("out", `${hex2(A)}, ${reg(d)}`);
  }
  if ((w & 0xf000) === 0xc000) {
    let k = w & 0x0fff;
    if (k & 0x0800) k -= 0x1000;
    return one("rjmp", rel(k * 2));
  }
  if ((w & 0xf000) === 0xd000) {
    let k = w & 0x0fff;
    if (k & 0x0800) k -= 0x1000;
    return one("rcall", rel(k * 2));
  }
  if ((w & 0xf000) === 0xe000) return one("ldi", `${reg(d4)}, ${hex2(K8)}`);
  // Bit-and-branch instructions first: 1111 10xx / 1111 11xx would otherwise be
  // swallowed by the brbs/brbc patterns.
  if ((w & 0xfe08) === 0xf800) return one("bld", `${reg(d)}, ${bit}`);
  if ((w & 0xfe08) === 0xfa00) return one("bst", `${reg(d)}, ${bit}`);
  if ((w & 0xfe08) === 0xfc00) return one("sbrc", `${reg(d)}, ${bit}`);
  if ((w & 0xfe08) === 0xfe00) return one("sbrs", `${reg(d)}, ${bit}`);
  if ((w & 0xfc00) === 0xf000) return one("brbs", `${w & 0x07}, ${branchTarget(k7)}`);
  if ((w & 0xfc00) === 0xf400) return one("brbc", `${w & 0x07}, ${branchTarget(k7)}`);
  return null;
}

/**
 * avr-objdump prints conditional branches as `br<cc>` aliases of brbs/brbc with
 * a status bit; the two sides of the comparison are normalised here so the
 * decoder can stay small and the *meaning* is still compared.
 */
const CC = { 0: "cs", 1: "eq", 2: "mi", 3: "vs", 4: "lt", 5: "hs", 6: "ts", 7: "ie" };
const CC_INV = { 0: "cc", 1: "ne", 2: "pl", 3: "vc", 4: "ge", 5: "hc", 6: "tc", 7: "id" };

export function normalise(mnemonic, operands) {
  let m = mnemonic, o = String(operands || "").trim();
  if (m === "brbs" || m === "brbc") {
    const [bitRaw, target] = o.split(",").map((p) => p.trim());
    const bit = Number(bitRaw);
    m = m === "brbs" ? `br${CC[bit] ?? `bs${bit}`}` : `br${CC_INV[bit] ?? `bc${bit}`}`;
    o = target;
  }
  // one-operand aliases avr-objdump also folds away
  if (m === "tst") { m = "and"; o = `${o}, ${o}`; }
  if (m === "clr") { m = "eor"; o = `${o}, ${o}`; }
  if (m === "lsl") { m = "add"; o = `${o}, ${o}`; }
  if (m === "rol") { m = "adc"; o = `${o}, ${o}`; }
  if (m === "cbr") { m = "andi"; const [a, b] = o.split(","); o = `${a}, 0x${(0xff ^ Number(b)).toString(16).toUpperCase().padStart(2, "0")}`; }
  if (m === "sbr") m = "ori";
  if (m === "ser") { m = "ldi"; o = o.replace(/r(\d+), 0x(..)/i, (_, rd, _v) => `r${rd}, 0xFF`); }
  return `${m}|${o.replace(/\s+/g, " ")}`;
}

/** Disassemble a range; `base` is the byte address of bytes[0]. */
export function disassemble(bytes, { base = 0, start = null, end = null } = {}) {
  const out = [];
  let at = start === null ? 0 : start - base;
  const last = end === null ? bytes.length : end - base;
  while (at + 2 <= Math.min(last, bytes.length)) {
    const addr = base + at;
    const ins = decode(bytes, at, addr);
    if (!ins) {
      // A word that decodes to nothing is still two bytes of the image; hand
      // back the bytes so callers never have to special-case `raw`.
      out.push({ addr, raw: bytes.slice(at, at + 2), mnemonic: ".word", operands: `0x${(bytes[at] | (bytes[at + 1] << 8)).toString(16).toUpperCase().padStart(4, "0")}`, size: 2 });
      at += 2;
      continue;
    }
    out.push({ addr, raw: bytes.slice(at, at + ins.size), ...ins, target: branchOrJumpTarget(addr, ins) });
    at += ins.size;
  }
  return out;
}

/** Absolute target of a control-transfer instruction, or null. */
export function branchOrJumpTarget(addr, ins) {
  if (!ins || !ins.operands) return null;
  const o = ins.operands;
  if (/^[rc]?jmp|^[rc]?call/.test(ins.mnemonic)) {
    const m = o.match(/(\.?[+-]?\d+|0x[0-9a-fA-F]+)\s*$/);
    if (!m) return null;
    if (m[1].startsWith(".")) return addr + 2 + Number(m[1].slice(1));
    return Number.parseInt(m[1], 16);
  }
  if (/^br/.test(ins.mnemonic)) {
    const m = o.match(/\.([+-]\d+)$/);
    if (m) return addr + ins.size + Number(m[1]);
  }
  return null;
}

// ------------------------------------------------------------------- walk
//
// A control-flow walk from the reset vector: follow rjmp/jmp, enter rcall/call
// targets, fall through conditionals (both ways - both are reachable). The
// result is the set of *reachable* instructions plus the entry points that
// produced them, which is what makes the SPM sites below trustworthy: an SPM in
// unreachable padding is not a bootstrap write path.
const SKIPS = ["sbrs", "sbrc", "cpse", "sbic", "sbis"];

export function walkInfo(bytes, { base = 0, resetTarget = null } = {}) {
  const ins = new Map();
  for (const i of disassemble(bytes, { base })) ins.set(i.addr, i);
  const entries = new Map();          // addr -> why
  const reachable = new Set();
  const queue = [];

  const enter = (addr, why) => {
    if (!ins.has(addr) || !Number.isFinite(addr)) return;
    if (!entries.has(addr)) entries.set(addr, why);
    queue.push(addr);
  };

  enter(base, "image start");
  if (resetTarget != null) enter(resetTarget, "reset vector");
  // Interrupt vectors: on the classic core the first words are jmp/rjmp stubs.
  // Only for an image loaded at 0 - a bootloader image has no vector table.
  for (let v = base === 0 ? 0 : 0x1000000; v < 0x40 && base + v < bytes.length; v += 2) {
    const i = ins.get(base + v);
    if (i && (i.mnemonic === "jmp" || i.mnemonic === "rjmp")) enter(i.target, `vector 0x${v.toString(16)}`);
  }

  while (queue.length) {
    let pc = queue.pop();
    const seenHere = new Set();
    while (ins.has(pc) && !reachable.has(pc)) {
      if (seenHere.has(pc)) break;
      seenHere.add(pc);
      const i = ins.get(pc);
      reachable.add(pc);
      const m = i.mnemonic;
      if (m === "call" || m === "rcall") {
        const t = branchOrJumpTarget(pc, i);
        if (t != null) enter(t, `called from 0x${pc.toString(16)}`);
      } else if (m === "jmp" || m === "rjmp") {
        const t = branchOrJumpTarget(pc, i);
        if (t != null) enter(t, `jumped from 0x${pc.toString(16)}`);
        break;                                   // no fall-through
      } else if (m === "ret" || m === "reti") {
        break;                                   // subroutine end
      } else if (/^br/.test(m)) {
        const t = branchOrJumpTarget(pc, i);
        if (t != null) enter(t, `branch from 0x${pc.toString(16)}`);
      } else if (SKIPS.includes(m)) {
        // sbrs/sbrc/cpse/sbic/sbis: when the condition holds the *next*
        // instruction is skipped, so the word after it is reachable too. Missing
        // this made most of Optiboot's main loop look unreachable.
        enter(pc + 2 * i.size, `skipped from 0x${pc.toString(16)}`);
      } else if (m === "ijmp" || m === "icall" || m === "eijmp" || m === "eicall") {
        break;                                   // target not statically known
      }
      pc += i.size;
    }
  }
  return { ins, entries, reachable };
}

// ------------------------------------------------------------- objdump text
//
// Parsers for `avr-objdump -d` output. They live here, next to the decoder, so
// that a listing can be used as ground truth (tools/verify_avrdis.mjs) and as
// annotation (tools/ghidra_avr.mjs --lst) without two different regexes drifting
// apart.

/** Instructions from an `avr-objdump -d` listing. */
export function parseListing(text) {
  const out = [];
  for (const line of text.split("\n")) {
    // "  7e08:\t88 23       \tand\tr24, r24\t; comment"
    const m = line.match(/^\s+([0-9a-f]{4,6}):\s+((?:[0-9a-f]{2} )+)\s*\t?([^;]*)/);
    if (!m) continue;
    const body = m[3].trim();
    if (!body) continue;
    const parts = body.split(/\s+/);          // fields are tab-separated
    const mnemonic = parts[0];
    const operands = parts.slice(1).join(" ").trim();
    // objdump resolves branches itself and prints the answer:
    // "rcall\t.+368\t; 0x7f92 <watchdogConfig>". Only control transfers: lds/sts
    // annotate their *data* address in the same style.
    const isBranch = /^(r?jmp|r?call|br(bs|bc|[a-z]{2}))$/.test(mnemonic);
    const tgt = isBranch ? line.match(/;\s*0x([0-9a-f]+)\s+</) : null;
    out.push({
      addr: Number.parseInt(m[1], 16),
      bytes: m[2].trim().split(/\s+/).map((b) => Number.parseInt(b, 16)),
      mnemonic, operands,
      target: tgt ? Number.parseInt(tgt[1], 16) : null,
    });
  }
  return out;
}

/** Symbol labels ("00007fbc <do_spm>:") from an `avr-objdump -d` listing. */
export function parseSymbols(text) {
  const out = new Map();
  for (const line of text.split("\n")) {
    const m = line.match(/^([0-9a-f]{4,8}) <([^>]+)>:/);
    if (m) out.set(Number.parseInt(m[1], 16), m[2]);
  }
  return out;
}
