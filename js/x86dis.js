/**
 * x86dis.js — 16/32-bit x86 disassembler + static analysis, no dependencies.
 *
 * Written for the SITE-K Ghidra lab.  DOS-era samples (boot sectors, .COM
 * files, TSR loaders) carry no headers, no symbol table and no entry point
 * metadata, so before anything can be handed to a decompiler we have to
 * recover the instruction stream ourselves.
 *
 * Verified against GNU `objdump -M i8086` on the samples in ./samples/bin —
 * see tools/verify_disasm.mjs.
 *
 * Scope: the 8086 opcode map plus the 186/286/386 instructions that show up in
 * DOS malware (shifts by immediate, PUSHA/POPA, ENTER/LEAVE, LOOPcc, BOUND,
 * IMUL imm).  x87 escapes decode as ESC stubs and unknown bytes degrade to a
 * `db` directive instead of throwing.
 */

/* ------------------------------------------------------------------ tables */

const REG16 = ["ax", "cx", "dx", "bx", "sp", "bp", "si", "di"];
const REG8 = ["al", "cl", "dl", "bl", "ah", "ch", "dh", "bh"];
const REG32 = ["eax", "ecx", "edx", "ebx", "esp", "ebp", "esi", "edi"];
const SREG = ["es", "cs", "ss", "ds"];
const ALU = ["add", "or", "adc", "sbb", "and", "sub", "xor", "cmp"];
const SHIFT = ["rol", "ror", "rcl", "rcr", "shl", "shr", "shl", "sar"];
const CC = ["o", "no", "b", "ae", "e", "ne", "be", "a", "s", "ns", "p", "np", "l", "ge", "le", "g"];
const PREFIXES = { 0x26: "es", 0x2e: "cs", 0x36: "ss", 0x3e: "ds", 0xf0: "lock", 0xf2: "repne", 0xf3: "rep" };
const STRING_OPS = {
  0xa4: ["movsb", 1], 0xa5: ["movsw", 2], 0xa6: ["cmpsb", 1], 0xa7: ["cmpsw", 2],
  0xaa: ["stosb", 1], 0xab: ["stosw", 2], 0xac: ["lodsb", 1], 0xad: ["lodsw", 2],
  0xae: ["scasb", 1], 0xaf: ["scasw", 2],
};
const EA_BASE = [
  ["bx", "si"], ["bx", "di"], ["bp", "si"], ["bp", "di"],
  ["si"], ["di"], ["bp"], ["bx"],
];

export const hex = (v, pad = 0) => {
  const s = ((v >>> 0)).toString(16);
  return "0x" + (pad ? s.padStart(pad, "0") : s);
};

/* --------------------------------------------------------------- decoding */

class Reader {
  constructor(bytes, pos, limit) {
    this.bytes = bytes;
    this.pos = pos;
    this.limit = limit;
    this.start = pos;
  }
  get left() { return this.limit - this.pos; }
  u8() { if (this.pos >= this.limit) throw new RangeError("eof"); return this.bytes[this.pos++]; }
  i8() { const v = this.u8(); return v > 127 ? v - 256 : v; }
  u16() { return this.u8() | (this.u8() << 8); }
  i16() { const v = this.u16(); return v > 0x7fff ? v - 0x10000 : v; }
  u32() { return (this.u16() | (this.u16() << 16)) >>> 0; }
  slice() { return Array.from(this.bytes.subarray(this.start, this.pos)); }
}

function readModRM(rd, mode, size, seg) {
  const b = rd.u8();
  const mod = b >> 6, reg = (b >> 3) & 7, rm = b & 7;
  const info = { kind: "rm", size, seg: seg || null, reg, mod, rm, memory: false, base: [], disp: 0, absolute: false };
  if (mod === 3) {
    info.regName = size === 1 ? REG8[rm] : size === 4 ? REG32[rm] : REG16[rm];
    info.str = info.regName;
    return info;
  }
  info.memory = true;
  if (mode === 32) {
    if (rm === 4) {
      const sib = rd.u8();
      const ss = sib >> 6, idx = (sib >> 3) & 7, bas = sib & 7;
      if (idx !== 4) info.base.push(`${REG32[idx]}*${1 << ss}`);
      if (bas === 5 && mod === 0) { info.disp = rd.u32(); info.absolute = true; }
      else info.base.unshift(REG32[bas]);
    } else if (rm === 5 && mod === 0) {
      info.disp = rd.u32(); info.absolute = true;
    } else {
      info.base.push(REG32[rm]);
    }
    if (!info.absolute && mod === 1) info.disp = rd.i8();
    if (!info.absolute && mod === 2) info.disp = rd.u32();
  } else {
    if (mod === 0 && rm === 6) { info.disp = rd.u16(); info.absolute = true; }
    else if (mod === 0 && rm === 2) { info.base = ["bp", "si"]; info.disp = 0; } // [bp+si]
    else { info.base = EA_BASE[rm].slice(); if (mod === 1) info.disp = rd.i8(); else if (mod === 2) info.disp = rd.u16(); }
  }
  info.str = formatMem(info);
  return info;
}

function formatMem(info) {
  const parts = [];
  if (info.base.length) parts.push(info.base.join("+"));
  const disp = info.disp | 0;
  if (disp && parts.length) parts.push((disp < 0 ? "- " : "+ ") + hex(Math.abs(disp)));
  else if (disp) parts.push(disp < 0 ? "-" + hex(-disp) : hex(disp));
  else if (!parts.length) parts.push("0x0");
  const seg = info.seg ? info.seg + ":" : "";
  const size = info.size === 1 ? "byte ptr " : info.size === 2 ? "word ptr " : info.size === 4 ? "dword ptr " : "";
  return `${size}${seg}[${parts.join(" ")}]`;
}

/** Decode one instruction at byte offset `pos` (address `ip`). */
export function decodeOne(bytes, pos, ip, mode = 16) {
  const rd = new Reader(bytes, pos, bytes.length);
  const insn = { ip, bytes: [], len: 0, mnem: "", ops: [], flow: "fall", target: null, intNo: null, prefix: [], repr: "", known: true };
  try {
    for (;;) {
      const b = bytes[rd.pos];
      const p = PREFIXES[b];
      if (p === undefined || rd.pos - rd.start >= 4) break;
      rd.u8();
      insn.prefix.push(p);
      if (b !== 0xf0 && b !== 0xf2 && b !== 0xf3) insn.segPrefix = p;
    }
    const op = rd.u8();
    const seg = insn.segPrefix || null;
    const opsz = mode === 32 ? 4 : 2;
    const E = (size) => readModRM(rd, mode, size, seg);
    const regName = (size, i) => (size === 1 ? REG8[i] : size === 4 ? REG32[i] : REG16[i]);
    const G = (size, i) => ({ kind: "reg", size, name: regName(size, i), reg: i });
    const imm8 = () => ({ kind: "imm", size: 1, value: rd.u8() });
    const imm16 = () => ({ kind: "imm", size: 2, value: rd.u16() });
    const imm32 = () => ({ kind: "imm", size: 4, value: rd.u32() });
    const jb = () => { const d = rd.i8(); return { kind: "rel", size: 1, value: d, target: (ip + d + rd.pos - rd.start) & (mode === 32 ? 0xffffffff : 0xffff) }; };
    const jv = () => { const d = mode === 32 ? rd.u32() : rd.i16(); return { kind: "rel", size: mode === 32 ? 4 : 2, value: d, target: (ip + d + (rd.pos - rd.start)) & (mode === 32 ? 0xffffffff : 0xffff) }; };
    const regOf = () => (bytes[rd.pos] >> 3) & 7; // ModRM reg field, pre-consumption
    const finish = (mnem, ops, extra) => { insn.mnem = mnem; insn.ops = ops.filter(Boolean); if (extra) Object.assign(insn, extra); };

    if (op === 0x0f) {
      // Two-byte escape (386+). On the original 8086 this byte was POP CS, which
      // nothing has used since 1981, so the 386 meaning wins.
      const op2 = rd.u8();
      if (op2 >= 0x80 && op2 <= 0x8f) {
        const o = jv();
        finish("j" + CC[op2 & 15], [o], { flow: "jcc", target: o.target });
      } else if (op2 === 0x05) finish("syscall", []);
      else if (op2 === 0x0b) finish("ud2", []);
      else if (op2 === 0x31) finish("rdtsc", []);
      else if (op2 === 0xa2) finish("cpuid", []);
      else if (op2 === 0xb6 || op2 === 0xb7) { const r = regOf(); finish("movzx", [G(op2 === 0xb6 ? 2 : opsz, r), E(1)]); }
      else if (op2 === 0xbe || op2 === 0xbf) { const r = regOf(); finish("movsx", [G(op2 === 0xbe ? 2 : opsz, r), E(op2 === 0xbe ? 1 : 2)]); }
      else if (op2 === 0xaf) { const r = regOf(); finish("imul", [G(opsz, r), E(opsz)]); }
      else if (op2 === 0xb0 || op2 === 0xb1) { const r = regOf(); finish("cmpxchg", [E(op2 === 0xb0 ? 1 : opsz), G(op2 === 0xb0 ? 1 : opsz, r)]); }
      else if (op2 === 0xc0 || op2 === 0xc1) { const r = regOf(); finish("xadd", [E(op2 === 0xc0 ? 1 : opsz), G(op2 === 0xc0 ? 1 : opsz, r)]); }
      else throw new Error("unknown two-byte opcode " + hex(op2));
    } else if (op < 0x40) {
      const alu = ALU[(op >> 3) & 7];
      const form = op & 7;
      if (form <= 3) {
        const size = form % 2 === 0 ? 1 : opsz;
        const r = regOf();
        finish(alu, form <= 1 ? [E(size), G(size, r)] : [G(size, r), E(size)]);
      } else if (form === 4) finish(alu, [{ kind: "reg", size: 1, name: "al" }, imm8()]);
      else if (form === 5) finish(alu, [{ kind: "reg", size: opsz, name: opsz === 4 ? "eax" : "ax" }, opsz === 4 ? imm32() : imm16()]);
      else if (form === 6) finish("push", [{ kind: "reg", size: 2, name: SREG[(op >> 3) & 3], sreg: true }]);
      else if (op === 0x07 || op === 0x17 || op === 0x1f) {
        finish("pop", [{ kind: "reg", size: 2, name: SREG[(op >> 3) & 3], sreg: true }]);
      } else {
        const special = { 0x27: "daa", 0x2f: "das", 0x37: "aaa", 0x3f: "aas" }[op];
        if (!special) throw new Error("unhandled opcode " + hex(op));
        finish(special, []);
      }
    } else if (op >= 0x40 && op <= 0x4f && mode !== 32) {
      finish(op < 0x48 ? "inc" : "dec", [G(opsz, op & 7)]);
    } else if (op >= 0x50 && op <= 0x5f) {
      finish(op < 0x58 ? "push" : "pop", [G(opsz, op & 7)]);
    } else if (op === 0x07 || op === 0x17 || op === 0x1f) finish("pop", [{ kind: "reg", size: 2, name: SREG[(op >> 3) & 3], sreg: true }]);
    else if (op >= 0x60 && op <= 0x6f) {
      const m = { 0x60: "pusha", 0x61: "popa", 0x62: "bound", 0x63: "arpl", 0x68: "push", 0x69: "imul", 0x6a: "push", 0x6b: "imul", 0x6c: "insb", 0x6d: "insw", 0x6e: "outsb", 0x6f: "outsw" }[op];
      if (op === 0x6c || op === 0x6d) {
        const size = op === 0x6c ? 1 : 2;
        finish(m, [{ kind: "mem", size, memory: true, str: `${size === 1 ? "byte ptr " : "word ptr "}es:[di]` }, { kind: "reg", size: 2, name: "dx" }]);
      } else if (op === 0x6e || op === 0x6f) {
        const size = op === 0x6e ? 1 : 2;
        finish(m, [{ kind: "reg", size: 2, name: "dx" }, { kind: "mem", size, memory: true, str: `${size === 1 ? "byte ptr " : "word ptr "}ds:[si]` }]);
      } else if (op <= 0x61) finish(m, []);
      else if (op === 0x62) { const r = regOf(); finish("bound", [G(opsz, r), E(opsz * 2)]); }
      else if (op === 0x63) { const r = regOf(); finish("arpl", [E(2), G(2, r)]); }
      else if (op === 0x68) finish("push", [opsz === 4 ? imm32() : imm16()]);
      else if (op === 0x6a) finish("push", [{ ...imm8(), signed: true }]);
      else if (op === 0x69) { const r = regOf(); finish("imul", [G(opsz, r), E(opsz), opsz === 4 ? imm32() : imm16()]); }
      else { const r = regOf(); finish("imul", [G(opsz, r), E(opsz), { ...imm8(), signed: true }]); }
    } else if (op >= 0x70 && op <= 0x7f) {
      const o = jb();
      finish("j" + CC[op & 15], [o], { flow: "jcc", target: o.target });
    } else if (op >= 0x80 && op <= 0x83) {
      const size = op === 0x80 || op === 0x82 ? 1 : opsz;
      const sub = regOf();
      const dst = E(size);
      const imm = op === 0x83 ? { ...imm8(), signed: true } : size === 1 ? imm8() : opsz === 4 ? imm32() : imm16();
      finish(ALU[sub], [dst, imm]);
    } else if (op === 0x84 || op === 0x85) { const size = op & 1 ? opsz : 1; const r = regOf(); finish("test", [E(size), G(size, r)]); }
    else if (op === 0x86 || op === 0x87) { const size = op & 1 ? opsz : 1; const r = regOf(); finish("xchg", [E(size), G(size, r)]); }
    else if (op === 0x88 || op === 0x89) { const size = op & 1 ? opsz : 1; const r = regOf(); finish("mov", [E(size), G(size, r)]); }
    else if (op === 0x8a || op === 0x8b) { const size = op & 1 ? opsz : 1; const r = regOf(); finish("mov", [G(size, r), E(size)]); }
    else if (op === 0x8c) { const r = regOf(); finish("mov", [E(2), { kind: "reg", size: 2, name: SREG[r], sreg: true }]); }
    else if (op === 0x8d) { const r = regOf(); finish("lea", [G(opsz, r), E(opsz)]); }
    else if (op === 0x8e) { const r = regOf(); finish("mov", [{ kind: "reg", size: 2, name: SREG[r], sreg: true }, E(2)]); }
    else if (op === 0x8f) finish("pop", [E(opsz)]);
    else if (op === 0x90) finish(insn.prefix.includes("rep") ? "pause" : "nop", []);
    else if (op >= 0x91 && op <= 0x97) finish("xchg", [{ kind: "reg", size: opsz, name: opsz === 4 ? "eax" : "ax" }, G(opsz, op & 7)]);
    else if (op === 0x98) finish(opsz === 4 ? "cwde" : "cbw", []);
    else if (op === 0x99) finish(opsz === 4 ? "cdq" : "cwd", []);
    else if (op === 0x9a) finish("call far", [{ kind: "far", off: rd.u16(), seg: rd.u16(), str: "" }], { flow: "call" });
    else if (op === 0x9b) finish("wait", []);
    else if (op === 0x9c) finish("pushf", []);
    else if (op === 0x9d) finish("popf", []);
    else if (op === 0x9e) finish("sahf", []);
    else if (op === 0x9f) finish("lahf", []);
    else if (op >= 0xa0 && op <= 0xa3) {
      const size = op & 1 ? opsz : 1;
      const addr = mode === 32 ? rd.u32() : rd.u16();
      const acc = { kind: "reg", size, name: size === 1 ? "al" : size === 4 ? "eax" : "ax" };
      const mem = { kind: "mem", size, addr, seg, memory: true, str: `${size === 1 ? "byte ptr " : size === 2 ? "word ptr " : ""}${seg ? seg + ":" : ""}[${hex(addr)}]` };
      if (op === 0xa0 || op === 0xa1) finish("mov", [acc, mem]); else finish("mov", [mem, acc]);
    } else if (STRING_OPS[op]) {
      const [m, size] = STRING_OPS[op];
      const s = size === 1 ? "al" : "ax";
      const pref = insn.prefix.includes("repne") ? "repne " : insn.prefix.includes("rep") ? "rep " : "";
      const memStr = (reg, sg) => ({ kind: "mem", size, memory: true, str: `${size === 1 ? "byte ptr " : "word ptr "}${sg ? sg + ":" : ""}[${reg}]` });
      let ops;
      if (m.startsWith("movs")) ops = [memStr("di", seg), memStr("si", "ds")];
      else if (m.startsWith("cmps")) ops = [memStr("di", seg), memStr("si", "ds")];
      else if (m.startsWith("stos")) ops = [memStr("di", seg), { kind: "reg", size, name: s }];
      else if (m.startsWith("lods")) ops = [{ kind: "reg", size, name: s }, memStr("si", "ds")];
      else ops = [{ kind: "reg", size, name: s }, memStr("di", seg)];
      finish(pref + m, ops);
      insn.repPrefix = insn.prefix.find((p) => p === "rep" || p === "repne") || null;
    } else if (op >= 0xb0 && op <= 0xbf) {
      const size = op < 0xb8 ? 1 : opsz;
      finish("mov", [G(size, op & 7), size === 1 ? imm8() : size === 4 ? imm32() : imm16()]);
    } else if (op === 0xc0 || op === 0xc1) {
      const size = op === 0xc0 ? 1 : opsz;
      const sub = regOf();
      finish(SHIFT[sub], [E(size), imm8()]);
    } else if (op === 0xc2) finish("ret", [imm16()], { flow: "ret" });
    else if (op === 0xc3) finish("ret", [], { flow: "ret" });
    else if (op === 0xc4 || op === 0xc5) { const r = regOf(); finish(op === 0xc4 ? "les" : "lds", [G(opsz, r), E(opsz * 2)]); }
    else if (op === 0xc6 || op === 0xc7) {
      const size = op === 0xc6 ? 1 : opsz;
      finish("mov", [E(size), size === 1 ? imm8() : size === 4 ? imm32() : imm16()]);
    } else if (op === 0xc8) finish("enter", [imm16(), imm8()]);
    else if (op === 0xc9) finish("leave", []);
    else if (op === 0xca) finish("retf", [imm16()], { flow: "ret" });
    else if (op === 0xcb) finish("retf", [], { flow: "ret" });
    else if (op === 0xcc) finish("int3", [], { flow: "int", intNo: 3 });
    else if (op === 0xcd) { const n = rd.u8(); finish("int", [{ kind: "imm", size: 1, value: n }], { flow: "int", intNo: n }); }
    else if (op === 0xce) finish("into", [], { flow: "int" });
    else if (op === 0xcf) finish("iret", [], { flow: "ret" });
    else if (op >= 0xd0 && op <= 0xd3) {
      const size = op & 1 ? opsz : 1;
      const sub = regOf();
      const ops = [E(size)];
      ops.push(op === 0xd0 || op === 0xd1 ? { kind: "imm", size: 1, value: 1, implicit: "1" } : { kind: "reg", size: 1, name: "cl" });
      finish(SHIFT[sub], ops);
    } else if (op === 0xd4) finish("aam", [imm8()]);
    else if (op === 0xd5) finish("aad", [imm8()]);
    else if (op === 0xd6) finish("salc", []);
    else if (op === 0xd7) finish("xlat", []);
    else if (op >= 0xd8 && op <= 0xdf) { const b = rd.u8(); finish("esc", [{ kind: "raw", str: hex(op) + " " + hex(b) }]); }
    else if (op === 0xe0) { const o = jb(); finish("loopne", [o], { flow: "jcc", target: o.target }); }
    else if (op === 0xe1) { const o = jb(); finish("loope", [o], { flow: "jcc", target: o.target }); }
    else if (op === 0xe2) { const o = jb(); finish("loop", [o], { flow: "jcc", target: o.target }); }
    else if (op === 0xe3) { const o = jb(); finish("jcxz", [o], { flow: "jcc", target: o.target }); }
    else if (op >= 0xe4 && op <= 0xe7) {
      const port = rd.u8();
      const acc = { kind: "reg", size: op & 1 ? 2 : 1, name: op & 1 ? "ax" : "al" };
      if (op === 0xe4 || op === 0xe5) finish("in", [acc, { kind: "imm", size: 1, value: port }]);
      else finish("out", [{ kind: "imm", size: 1, value: port }, acc]);
    } else if (op === 0xe8) { const o = jv(); finish("call", [o], { flow: "call", target: o.target }); }
    else if (op === 0xe9) { const o = jv(); finish("jmp", [o], { flow: "jmp", target: o.target }); }
    else if (op === 0xea) {
      const off = rd.u16(), sg = rd.u16();
      finish("jmp far", [{ kind: "far", seg: sg, off, str: `${hex(sg)}:${hex(off)}` }], { flow: "jmpfar" });
    } else if (op === 0xeb) { const o = jb(); finish("jmp", [o], { flow: "jmp", target: o.target }); }
    else if (op >= 0xec && op <= 0xef) {
      const acc = { kind: "reg", size: op & 1 ? 2 : 1, name: op & 1 ? "ax" : "al" };
      if (op === 0xec || op === 0xed) finish("in", [acc, { kind: "reg", size: 2, name: "dx" }]);
      else finish("out", [{ kind: "reg", size: 2, name: "dx" }, acc]);
    } else if (op === 0xf1) finish("icebp", []);
    else if (op === 0xf4) finish("hlt", [], { flow: "halt" });
    else if (op === 0xf5) finish("cmc", []);
    else if (op === 0xf6 || op === 0xf7) {
      const size = op === 0xf6 ? 1 : opsz;
      const r = regOf();
      if (r === 0) finish("test", [E(size), imm8()]);
      else if (r === 1) finish("test", [E(size), size === 1 ? imm8() : size === 4 ? imm32() : imm16()]);
      else finish(["not", "neg", "mul", "imul", "div", "idiv"][r - 2], [E(size)], { accumulator: r >= 4 });
    } else if (op >= 0xf8 && op <= 0xfd) finish(["clc", "stc", "cli", "sti", "cld", "std"][op - 0xf8], []);
    else if (op === 0xfe || op === 0xff) {
      const r = regOf();
      if (op === 0xfe && r < 2) finish(r ? "dec" : "inc", [E(1)]);
      else if (op === 0xfe) throw new Error("bad FE");
      else {
        const names = { 0: ["inc", 2], 1: ["dec", 2], 2: ["call", opsz], 3: ["call far", opsz * 2], 4: ["jmp", opsz], 5: ["jmp far", opsz * 2], 6: ["push", opsz] };
        const spec = names[r];
        if (!spec) throw new Error("bad FF");
        const o = E(spec[1]); o.indirect = true;
        const flow = r === 2 || r === 3 ? "call" : r === 5 ? "jmpfar" : r === 4 ? "jmp" : "fall";
        finish(spec[0], [o], { flow });
      }
    } else {
      throw new Error("unknown opcode " + hex(op));
    }

    if (insn.mnem === "call far" || insn.mnem === "jmp far") {
      const o = insn.ops[0];
      if (o && o.kind === "far" && !o.str) o.str = `${hex(o.seg)}:${hex(o.off)}`;
    }
    insn.len = rd.pos - rd.start;
    insn.bytes = rd.slice();
    insn.repr = render(insn);
    return insn;
  } catch (err) {
    if (err instanceof RangeError) return null;
    return {
      ip, bytes: [bytes[pos]], len: 1, mnem: "db", ops: [], flow: "fall", target: null,
      intNo: null, prefix: [], repr: `db ${hex(bytes[pos], 2)}`, known: false, data: true,
    };
  }
}

function render(insn) {
  const fmt = (o) => {
    if (typeof o === "string") return o;
    if (o.implicit) return o.implicit;
    if (o.kind === "reg") return o.name;
    if (o.kind === "imm") {
      if (insn.mnem === "int" || insn.mnem === "int3" || insn.mnem === "aam" || insn.mnem === "aad") return (o.value & 0xff).toString(16) + "h";
      if (o.signed && o.size === 1 && (o.value & 0x80)) return "-" + hex(0x100 - (o.value & 0xff));
      return hex(o.value >>> 0);
    }
    if (o.kind === "rel") return hex(o.target);
    if (o.kind === "far") return o.str || `${hex(o.seg)}:${hex(o.off)}`;
    if (o.kind === "mem") return o.str;
    if (o.kind === "rm") return o.str;
    if (o.kind === "raw") return o.str;
    return String(o);
  };
  let m = insn.mnem;
  if ((m === "jmp" || m === "call") && insn.ops[0] && insn.ops[0].kind === "rel" && insn.ops[0].size === 1) m += " short";
  const parts = insn.ops.map(fmt).filter((s) => s !== "");
  return (m + (parts.length ? " " + parts.join(", ") : "")).replace(/\s+/g, " ").trim();
}

/* --------------------------------------------------------------- analysis */

/**
 * Recursive-descent over the sample starting from `entries`, then a linear
 * sweep so every byte lands in exactly one instruction. Runs of bytes that
 * decode as nonsense become `db` data records.
 */
export function analyze(bytes, { base = 0, entries = [base], mode = 16, dataRanges = [], org = null, maxInsns = 100000 } = {}) {
  // `org` is the address the sample was assembled against. A .COM is assembled
  // at 0x100 and its absolute operands already include that offset; a boot
  // sector is assembled at 0 and its operands are segment-relative. Knowing
  // which one we have is what lets the technique map resolve `mov [0x8], ax`
  // to 0x7c08 (virus data) instead of 0x0008 (an interrupt vector).
  const imageOrg = org !== null ? org : (base <= 0x100 ? base : 0);
  const insns = new Map();
  const queue = [];
  const visited = new Set();
  const limit = base + bytes.length;
  const inDataRange = (a) => dataRanges.some(([s, e]) => a >= base + s && a < base + e);
  // Runs of printable ASCII are data, not code. DOS samples put their messages
  // inline at the end of the image, and decoding "*.COM\0" as instructions
  // poisons both the listing and the symbol table.
  const isStringByte = stringMask(bytes);

  const push = (a) => {
    if (a >= base && a < limit && !visited.has(a) && !inDataRange(a)) { visited.add(a); queue.push(a); }
  };
  entries.forEach(push);

  // pass 1 — follow control flow
  let budget = maxInsns;
  while (queue.length && budget-- > 0) {
    let ip = queue.shift();
    while (ip >= base && ip < limit && !insns.has(ip) && !inDataRange(ip)) {
      const insn = decodeOne(bytes, ip - base, ip, mode);
      if (!insn) break;
      insns.set(ip, insn);
      if (insn.flow === "jmp" && insn.target !== null) { push(insn.target); break; }
      if (insn.flow === "call" && insn.target !== null) push(insn.target);
      if (insn.flow === "jcc" && insn.target !== null) push(insn.target);
      if (insn.flow === "jmp" || insn.flow === "jmpfar" || insn.flow === "ret" || insn.flow === "halt") break;
      ip += insn.len;
    }
  }

  // pass 2 — linear fill for everything else
  let cursor = base;
  const emitData = (at, len, why) => {
    const chunk = Array.from(bytes.subarray(at - base, at - base + len));
    insns.set(at, {
      ip: at, bytes: chunk, len, mnem: "db", ops: [], flow: "fall", repr: "db " + chunk.map((b) => hex(b, 2)).join(", "),
      known: true, data: true, dataNote: why,
    });
  };
  while (cursor < limit) {
    if (insns.has(cursor)) { cursor += insns.get(cursor).len; continue; }
    if (inDataRange(cursor)) {
      let n = 0;
      while (cursor + n < limit && !insns.has(cursor + n) && inDataRange(cursor + n)) n++;
      emitData(cursor, n, "file region");
      cursor += n;
      continue;
    }
    if (isStringByte[cursor - base] && !insns.has(cursor)) {
      // Swallow the whole blob up to the next address pass 1 already claimed.
      let n = 0;
      while (cursor + n < limit && !insns.has(cursor + n)) n++;
      emitData(cursor, n, "inline string");
      cursor += n;
      continue;
    }
    const insn = decodeOne(bytes, cursor - base, cursor, mode);
    if (!insn || insn.data || !plausible(bytes, cursor - base)) {
      let n = 1;
      while (cursor + n < limit && !insns.has(cursor + n) && !plausible(bytes, cursor - base + n) && n < 32) {
        if (inDataRange(cursor + n)) break;
        n++;
      }
      emitData(cursor, n, "unreferenced bytes");
      cursor += n;
      continue;
    }
    insns.set(cursor, insn);
    cursor += insn.len;
  }

  // cross references
  const refs = new Map();
  const bump = (addr, key) => {
    if (addr === null || addr === undefined) return;
    if (addr < base || addr >= limit) return;
    if (!refs.has(addr)) refs.set(addr, { calls: 0, jumps: 0, data: 0 });
    refs.get(addr)[key]++;
  };
  for (const insn of insns.values()) {
    if (insn.flow === "call" && insn.target !== null) bump(insn.target, "calls");
    else if ((insn.flow === "jmp" || insn.flow === "jcc") && insn.target !== null) bump(insn.target, "jumps");
    for (const o of insn.ops) {
      if (o && o.kind === "rm" && o.memory && o.absolute) bump(o.disp, "data");
      if (o && o.kind === "mem" && o.addr !== undefined) bump(o.addr, "data");
      if (o && o.kind === "far" && o.off !== undefined && insn.flow === "fall") bump(o.off, "data");
    }
  }

  const order = [...insns.keys()].sort((a, b) => a - b);
  let codeBytes = 0, dataBytes = 0;
  for (const insn of insns.values()) (insn.data ? (dataBytes += insn.len) : (codeBytes += insn.len));
  return { insns, order, refs, base, limit, bytes, codeBytes, dataBytes, mode, dataRanges, org: imageOrg };
}

/** Bytes belonging to a printable run of `min` characters or more. */
function stringMask(bytes, min = 5) {
  const mask = new Uint8Array(bytes.length);
  let start = -1;
  for (let i = 0; i <= bytes.length; i++) {
    const printable = i < bytes.length && bytes[i] >= 0x20 && bytes[i] < 0x7f;
    if (printable) { if (start < 0) start = i; continue; }
    if (start >= 0 && i - start >= min) mask.fill(1, start, i);
    start = -1;
  }
  return mask;
}

function plausible(bytes, off) {
  if (off < 0 || off >= bytes.length) return false;
  const b = bytes[off];
  if (b === 0x00 || b === 0xff) return false;
  const insn = decodeOne(bytes, off, 0, 16);
  return !!(insn && !insn.data && insn.len <= 8);
}

/** Boot sector convention: 0x55AA magic at 510 and a partition table at 0x1BE. */
export function bootSectorInfo(bytes) {
  if (bytes.length < 512) return null;
  const magic = bytes[510] === 0x55 && bytes[511] === 0xaa;
  const oem = String.fromCharCode(...bytes.subarray(3, 11)).replace(/[^\x20-\x7e]/g, ".");
  let partitions = 0;
  for (let i = 0; i < 4; i++) {
    const e = 0x1be + i * 16;
    if (bytes[e + 4] || bytes[e + 5] || bytes[e + 6] || bytes[e + 7]) partitions++;
  }
  return { magic, oem, partitions };
}

/** Every distinct mnemonic with counts — the "what is this thing made of" view. */
export function mnemonicHistogram(analysis) {
  const counts = new Map();
  for (const insn of analysis.insns.values()) {
    if (insn.data) continue;
    counts.set(insn.mnem, (counts.get(insn.mnem) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

export function stringsIn(bytes, min = 4) {
  const out = [];
  let run = "";
  let start = 0;
  const flush = (end) => {
    if (run.length >= min) out.push({ off: start, text: run });
    run = "";
  };
  bytes.forEach((b, i) => {
    if (b >= 0x20 && b < 0x7f) { if (!run) start = i; run += String.fromCharCode(b); }
    else flush(i);
  });
  flush(bytes.length);
  return out;
}

/* -------------------------------------------------- technique extraction */

export const BIOS_INT = {
  0x10: "BIOS video", 0x11: "BIOS equipment word", 0x12: "BIOS memory size", 0x13: "BIOS disk I/O",
  0x14: "BIOS serial", 0x15: "BIOS system services", 0x16: "BIOS keyboard", 0x17: "BIOS printer",
  0x18: "ROM BASIC", 0x19: "BIOS bootstrap", 0x1a: "BIOS time/date", 0x1c: "BIOS timer tick",
  0x20: "DOS terminate", 0x21: "DOS API", 0x22: "DOS terminate address", 0x23: "DOS Ctrl-Break",
  0x24: "DOS critical error", 0x25: "DOS absolute disk read", 0x26: "DOS absolute disk write",
  0x27: "DOS TSR", 0x28: "DOS idle", 0x2a: "DOS network", 0x2e: "DOS EXEC (undocumented)",
  0x2f: "DOS multiplex", 0x31: "DPMI", 0x33: "Mouse driver",
};

export const DOS_FN = {
  0x00: "terminate program", 0x09: "print $-string", 0x0e: "select disk", 0x19: "current disk",
  0x1a: "set DTA", 0x25: "set interrupt vector", 0x2a: "get date", 0x2c: "get time",
  0x35: "get interrupt vector", 0x3d: "open file", 0x3e: "close file", 0x3f: "read file",
  0x40: "write file", 0x41: "delete file", 0x42: "seek file", 0x43: "get/set attributes",
  0x47: "get current directory", 0x48: "allocate memory", 0x49: "free memory",
  0x4a: "resize memory block", 0x4b: "exec program", 0x4c: "exit with code",
  0x4e: "find first", 0x4f: "find next", 0x56: "rename file", 0x57: "file date/time",
  0x5b: "create file",
};

export const DISK_FN = {
  0x00: "reset controller", 0x01: "get status", 0x02: "read sectors", 0x03: "write sectors",
  0x04: "verify sectors", 0x05: "format track", 0x08: "get drive parameters", 0x0a: "read long",
  0x0b: "write long", 0x0c: "seek", 0x0d: "alternate reset", 0x10: "test drive ready",
  0x11: "recalibrate", 0x14: "controller diagnostics", 0x15: "get disk type",
};

export const VIDEO_FN = {
  0x00: "set video mode", 0x01: "set cursor shape", 0x02: "set cursor position",
  0x03: "get cursor position", 0x05: "set active page", 0x06: "scroll up", 0x07: "scroll down",
  0x08: "read char/attribute", 0x09: "write char/attribute", 0x0a: "write character",
  0x0e: "teletype output", 0x0f: "get video mode", 0x10: "palette / DAC", 0x11: "font",
  0x12: "alternate select", 0x13: "write string",
};

/** Track `mov ah, N` backwards inside the current basic block. */
export function findAH(order, index, insns) {
  for (let i = index - 1, steps = 0; i >= 0 && steps < 14; i--, steps++) {
    const insn = insns.get(order[i]);
    if (!insn) break;
    if (insn.mnem === "mov" && insn.ops.length === 2 && insn.ops[0].kind === "reg" && insn.ops[0].name === "ah" && insn.ops[1].kind === "imm") return insn.ops[1].value & 0xff;
    if (insn.mnem === "mov" && insn.ops.length === 2 && insn.ops[0].kind === "reg" && insn.ops[0].name === "ax" && insn.ops[1].kind === "imm") return (insn.ops[1].value >> 8) & 0xff;
    if (insn.mnem === "xor" && insn.ops.length === 2 && insn.ops[0].kind === "reg" && insn.ops[0].name === "ah" && insn.ops[1].name === "ah") return 0;
    if (insn.flow === "int" || /^(call|ret|j)/.test(insn.mnem)) break;
  }
  return null;
}

/**
 * The technique map: which BIOS/DOS services get called, which IVT vectors get
 * hooked, and which absolute addresses get written.
 *
 * The hard part is segments. `mov word ptr [0x8], cx` is either a write to the
 * virus's own data word (DS=CS) or a write to an interrupt vector (DS=0), and
 * nothing in the instruction says which. So we carry a deliberately small data
 * flow: track the last value loaded into AX and the DS segment across the
 * listing, and label every store as IVT / BIOS data / image-internal /
 * unresolved. It is a heuristic — basic-block boundaries are not honoured — and
 * the UI says so.
 */
export function extractTechniques(analysis) {
  const { insns, order, base, org } = analysis;
  const ints = [], hooks = [], ivtReads = [], biosWrites = [], biosReads = [];
  const internalWrites = [], absoluteWrites = [], unresolved = [], bulkWrites = [];

  // DS/ES are unknown until the code sets them; null means "do not claim
  // anything". A segment-relative access with DS=0 is an absolute one, which is
  // exactly how Michelangelo reaches the IVT, the BIOS data area, and its own
  // relocated image (it runs at linear 0x7C00 with DS=0).
  // A .COM is entered by DOS with DS = ES = CS = PSP and its code at PSP:0x100,
  // so a DS-relative operand already addresses the image. A boot sector gets no
  // such guarantee (its operands are usually segment-relative, but DS is only
  // known once the code sets it), so DS starts out unknown there.
  let ds = org === 0x100 ? "cs" : null;   // null | "cs" | { abs: number }
  let axImm = null;         // last immediate / cleared value in ax
  let pendingCS = false;    // saw `push cs`, awaiting the matching `pop ds|es`

  const regOf = (op) => {
    if (!op || op.memory) return null;
    if (op.kind === "reg") return op.name;
    if (op.kind === "rm" && !op.memory) return op.regName;
    return null;
  };
  const immOf = (op) => (op && op.kind === "imm" ? op.value : null);
  const valOf = (op) => {
    if (!op) return "?";
    if (op.kind === "imm") return hex(op.value);
    return regOf(op) || op.str || "?";
  };
  const segOf = (op) => op.seg || (op.base && op.base.includes("bp") ? "ss" : "ds");
  const memOf = (op) => {
    if (!op || !op.memory) return null;
    if (op.kind === "mem") return typeof op.addr === "number" ? op.addr : null;
    // register-indirect forms ([si], [bx+2], …) are not absolute addresses
    if (op.absolute === true && typeof op.disp === "number") return op.disp;
    return null;
  };
  const resolve = (disp) => base + disp - (org ?? 0);
  const dsIs = (v) => (v === "cs" ? ds === "cs" : ds && typeof ds === "object" && ds.abs === v);

  for (let index = 0; index < order.length; index++) {
    const addr = order[index];
    const insn = insns.get(addr);
    if (!insn || insn.data) continue;
    const [dst, src] = insn.ops;
    const dstReg = regOf(dst), srcReg = regOf(src);
    const dstMem = memOf(dst), srcMem = memOf(src);
    // A call/jmp through a memory operand is a control transfer, not a store.
    const controlTransfer = /^(call|jmp)/.test(insn.mnem);
    const writesMemory = /^(mov|xchg|add|sub|inc|dec|and|or|xor|not|neg|shl|shr|sar|rol|ror|stos|movs|lods|xlat)$/.test(insn.mnem);

    // ------------------------------------------------------- interrupt calls
    if (insn.mnem === "int" && insn.intNo !== null) {
      const ah = findAH(order, index, insns);
      const table = insn.intNo === 0x21 ? DOS_FN : insn.intNo === 0x13 ? DISK_FN : insn.intNo === 0x10 ? VIDEO_FN : null;
      ints.push({
        addr, int: insn.intNo, ah,
        name: BIOS_INT[insn.intNo] || `INT ${hex(insn.intNo)}`,
        service: ah !== null && table ? table[ah] || null : null,
      });
      if (insn.intNo === 0x13 && ah === null && (insn.ops[0] === undefined)) ints[ints.length - 1].note = "unconditional INT 13h — BIOS may read AH from the caller, which is what the virus reuses when it forwards to the original handler";
    }

    // ------------------------------------------------------------ writes
    if (dstMem !== null && writesMemory && !controlTransfer) {
      const seg = segOf(dst);
      const where = { addr, mnem: insn.mnem, size: dst.size || 2, value: valOf(src), seg, disp: dstMem };
      if (seg === "cs" || dsIs("cs")) {
        where.resolved = resolve(dstMem);
        internalWrites.push(where);
      } else if (dsIs(0)) {
        if (dstMem < 0x400) {
          hooks.push({ addr, vector: dstMem >> 2, half: (dstMem & 3) === 0 ? "offset" : "segment", value: where.value, name: `INT ${hex(dstMem >> 2)}` });
        } else if (dstMem < 0x500) {
          biosWrites.push({ ...where, note: dstMem === 0x413 ? "BIOS base-memory size in KB — a TSR claiming its own paragraph" : "BIOS data area" });
        } else {
          absoluteWrites.push({ ...where, resolved: dstMem });
        }
      } else {
        unresolved.push(where);
      }
    }

    // ------------------------------------------------------------- reads
    if (srcMem !== null && ["mov", "cmp", "test", "and", "or", "add", "sub", "xor"].includes(insn.mnem) && !controlTransfer) {
      const seg = segOf(src);
      const read = { addr, mnem: insn.mnem, size: src.size || 2, disp: srcMem, seg, target: dstReg };
      if (dsIs(0)) {
        if (srcMem < 0x400) ivtReads.push({ ...read, vector: srcMem >> 2, half: (srcMem & 3) === 0 ? "offset" : "segment", name: `INT ${hex(srcMem >> 2)}` });
        else if (srcMem < 0x500) biosReads.push({ ...read, note: srcMem === 0x413 ? "reads the BIOS memory count to place itself in high memory" : "BIOS data area" });
      }
    }
    if (insn.repPrefix && /^(rep|repz|repnz)\s+(movs|stos)/.test(insn.repr)) bulkWrites.push({ addr, text: insn.repr });

    // -------------------------------------------------- register/segment flow
    if (insn.mnem === "xor" && dstReg === srcReg && dstReg) axImm = 0;
    else if (insn.mnem === "mov" && /^(ax|ah|al)$/.test(dstReg || "")) axImm = src && src.kind === "imm" ? src.value & 0xffff : null;

    if (insn.mnem === "push" && dstReg === "cs") pendingCS = true;
    else if (insn.mnem === "pop" && dstReg === "ds") { ds = pendingCS ? "cs" : null; pendingCS = false; }
    else if (insn.mnem === "mov" && dstReg === "ds") {
      if (src && src.kind === "imm") ds = { abs: src.value & 0xffff };
      else if (srcReg === "ax" && axImm !== null) ds = { abs: axImm };
      else ds = null;
    }

    // Any transfer of control means the next instruction may not share our
    // linear model of AX, but DS deliberately survives: these handlers preserve
    // it across the BIOS calls they intercept.
    // NOTE: `flow` is "fall" for ordinary instructions, so testing it for
    // truthiness resets AX on every line — only real transfers count.
    if (/^(int|call|jmp|jmpfar|ret|iret|retf)$/.test(insn.flow || "")) {
      axImm = null;
      pendingCS = false;
    }
  }

  return { ints, hooks, ivtReads, biosWrites, biosReads, internalWrites, absoluteWrites, bulkWrites, unresolved };
}

/** Shannon entropy in fixed windows — packing/encryption giveaway. */
export function entropyWindows(bytes, window = 64) {
  const out = [];
  for (let off = 0; off < bytes.length; off += window) {
    const slice = bytes.subarray(off, Math.min(off + window, bytes.length));
    const counts = new Array(256).fill(0);
    for (const b of slice) counts[b]++;
    let h = 0;
    for (const c of counts) if (c) { const p = c / slice.length; h -= p * Math.log2(p); }
    out.push({ off, entropy: h, bytes: slice.length });
  }
  return out;
}

/** Symbols worth handing to the decompiler. */
export function symbolTable(analysis, names = {}) {
  const out = [];
  for (const [addr, ref] of [...analysis.refs.entries()].sort((a, b) => a[0] - b[0])) {
    const insn = analysis.insns.get(addr);
    if (!insn || insn.data) continue;
    const role = ref.calls && !ref.jumps ? "sub" : ref.jumps ? "loc" : "sub";
    out.push({ addr, ref, role, name: names[addr] || `${role}_${addr.toString(16)}` });
  }
  return out;
}

/** Render the listing as text (used by the exporter). */
export function renderListing(analysis, labels = new Map()) {
  const lines = [];
  for (const addr of analysis.order) {
    if (labels.has(addr)) lines.push(`${labels.get(addr)}:`);
    else if (analysis.refs.has(addr) && !analysis.insns.get(addr).data) lines.push(`loc_${addr.toString(16)}:`);
    const insn = analysis.insns.get(addr);
    const hexs = insn.bytes.map((b) => b.toString(16).padStart(2, "0")).join(" ").padEnd(20);
    lines.push(`  ${addr.toString(16).padStart(6, "0")}  ${hexs} ${insn.repr}`);
  }
  return lines.join("\n");
}
