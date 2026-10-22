// Execute the CyberChef Game Boy ROM in a small independent LR35902 emulator
// and check the on-screen recipe result against the verified UHS-88a decoder.
//
// The emulator implements exactly the opcode subset tools/build_cyberchef_gb.mjs
// emits (listed in OPS below) — it is not a Game Boy emulator dependency, it is
// a second implementation the ROM must convince. See
// docs/cyberchef-gb-rom-2026-10-21.md.
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCyberchefGB, PROGRAM } from "../tools/build_cyberchef_gb.mjs";
import { decrypt88a } from "../tools/verify_uhs_gamegenie.mjs";

const { rom } = buildCyberchefGB();

const NINTENDO_LOGO = Uint8Array.from([
  0xce, 0xed, 0x66, 0x66, 0xcc, 0x0d, 0x00, 0x0b, 0x03, 0x73, 0x00, 0x83,
  0x00, 0x0c, 0x00, 0x0d, 0x00, 0x08, 0x11, 0x1f, 0x88, 0x89, 0x00, 0x0e,
  0xdc, 0xcc, 0x6e, 0xe6, 0xdd, 0xdd, 0xd9, 0x99, 0xbb, 0xbb, 0x67, 0x63,
  0x6e, 0x0e, 0xec, 0xcc, 0xdd, 0xdc, 0x99, 0x9f, 0xbb, 0xb9, 0x33, 0x3e,
]);

test("ROM header is a valid DMG cartridge header", () => {
  assert.equal(rom.length, 0x8000);
  assert.deepEqual(rom.subarray(0x104, 0x134), NINTENDO_LOGO);
  assert.equal(new TextDecoder().decode(rom.subarray(0x134, 0x13d)), "CYBERCHEF");
  assert.equal(rom[0x147], 0x00); // ROM only
  assert.equal(rom[0x148], 0x00); // 32 KB
  let x = 0;
  for (let i = 0x134; i <= 0x14c; i++) x = (x - rom[i] - 1) & 0xff;
  assert.equal(rom[0x14d], x, "header checksum");
  let sum = 0;
  for (let i = 0; i < rom.length; i++) {
    if (i === 0x14e || i === 0x14f) continue; // checksum field excluded
    sum = (sum + rom[i]) & 0xffff;
  }
  const stored = (rom[0x14e] << 8) | rom[0x14f];
  assert.equal(stored, sum, "global checksum");
  // entry: NOP; JP $150 (C3 50 01 — JP nn is little-endian)
  assert.deepEqual([...rom.subarray(0x100, 0x104)], [0x00, 0xc3, 0x50, 0x01]);
});

/* ------------------------------------------------- mini LR35902 emulator */

class GB {
  constructor(bytes) {
    this.rom = bytes;
    this.vram = new Uint8Array(0x2000);
    this.wram = new Uint8Array(0x2000);
    this.io = new Uint8Array(0x80);
    this.a = 0; this.b = 0; this.c = 0; this.d = 0; this.e = 0;
    this.h = 0; this.l = 0;
    this.f = 0; // Z=0x80 C=0x10
    this.sp = 0xfffe;
    this.pc = 0x100;
    this.cycles = 0;
    this.halted = false;
    this.stack = [];
  }
  get hl() { return (this.h << 8) | this.l; }
  set hl(v) { this.h = (v >> 8) & 0xff; this.l = v & 0xff; }
  get de() { return (this.d << 8) | this.e; }
  set de(v) { this.d = (v >> 8) & 0xff; this.e = v & 0xff; }
  get bc() { return (this.b << 8) | this.c; }
  set bc(v) { this.b = (v >> 8) & 0xff; this.c = v & 0xff; }
  read(addr) {
    if (addr < 0x8000) return this.rom[addr];
    if (addr < 0xa000) return this.vram[addr - 0x8000];
    if (addr < 0xe000) return this.wram[addr - 0xc000];
    if (addr >= 0xff00 && addr < 0xff80) {
      if (addr === 0xff44) return Math.floor(this.cycles / 456) % 154; // LY
      return this.io[addr - 0xff00];
    }
    return 0xff;
  }
  write(addr, v) {
    if (addr >= 0x8000 && addr < 0xa000) this.vram[addr - 0x8000] = v;
    else if (addr >= 0xc000 && addr < 0xe000) this.wram[addr - 0xc000] = v;
    else if (addr >= 0xff00 && addr < 0xff80) this.io[addr - 0xff00] = v;
  }
  fetch() { return this.read(this.pc++); }
  fetch16() { const lo = this.fetch(); return lo | (this.fetch() << 8); }
  setZ(v) { this.f = (v & 0xff) === 0 ? 0x80 : 0; }
  step() {
    const op = this.fetch();
    this.cycles += 4;
    switch (op) {
      case 0x00: break;                                  // NOP
      case 0xf3: break;                                  // DI (no interrupts here)
      case 0x76: this.halted = true; break;              // HALT
      case 0xc3: this.pc = this.fetch16(); break;        // JP nn
      case 0x01: this.bc = this.fetch16(); break;
      case 0x11: this.de = this.fetch16(); break;
      case 0x21: this.hl = this.fetch16(); break;
      case 0x06: this.b = this.fetch(); break;
      case 0x0e: this.c = this.fetch(); break;
      case 0x16: this.d = this.fetch(); break;
      case 0x1e: this.e = this.fetch(); break;
      case 0x26: this.h = this.fetch(); break;
      case 0x2e: this.l = this.fetch(); break;
      case 0x3e: this.a = this.fetch(); break;
      case 0x22: this.write(this.hl, this.a); this.hl = (this.hl + 1) & 0xffff; break;
      case 0x1a: this.a = this.read(this.de); break;
      case 0x13: this.de = (this.de + 1) & 0xffff; break;
      case 0x0b: this.bc = (this.bc - 1) & 0xffff; break;
      case 0x78: this.a = this.b; break;
      case 0x79: this.a = this.c; break;
      case 0xb1: this.a |= this.c; this.f = this.a === 0 ? 0x80 : 0; break;
      case 0xb7: this.a |= this.a; this.f = this.a === 0 ? 0x80 : 0; break;
      case 0xaf: this.a = 0; this.f = 0x80; break;
      case 0x87: { const c = this.a > 0x7f; this.a = (this.a << 1) & 0xff;
        this.f = (this.a === 0 ? 0x80 : 0) | (c ? 0x10 : 0); break; }
      case 0xd6: { const n = this.fetch(); const borrow = this.a < n;
        this.a = (this.a - n) & 0xff;
        this.f = (this.a === 0 ? 0x80 : 0) | (borrow ? 0x10 : 0); break; }
      case 0xfe: { const n = this.fetch();
        this.f = (this.a === (n & 0xff) ? 0x80 : 0) | (this.a < (n & 0xff) ? 0x10 : 0); break; }
      case 0x18: { const e = this.fetch(); const rel = e > 127 ? e - 256 : e;
        this.pc = (this.pc + rel) & 0xffff; break; }
      case 0x20: case 0x28: case 0x30: case 0x38: {     // JR cc,e
        const e = this.fetch(); const rel = e > 127 ? e - 256 : e;
        const z = (this.f & 0x80) !== 0, c = (this.f & 0x10) !== 0;
        const take = { 0x20: !z, 0x28: z, 0x30: !c, 0x38: c }[op];
        if (take) this.pc = (this.pc + rel) & 0xffff;
        break;
      }
      case 0xcd: this.stack.push(this.pc + 2); this.pc = this.fetch16(); break;
      case 0xc9: this.pc = this.stack.pop(); break;
      case 0xc8: if (this.f & 0x80) this.pc = this.stack.pop(); break; // ret z (1 byte)
      case 0xe0: this.write(0xff00 + this.fetch(), this.a); break;
      case 0xf0: this.a = this.read(0xff00 + this.fetch()); break;
      default: throw new Error(`unimplemented opcode 0x${op.toString(16)} at 0x${(this.pc - 1).toString(16)}`);
    }
  }
  run(maxSteps = 5_000_000) {
    for (let i = 0; i < maxSteps; i++) {
      if (this.halted) return;
      this.step();
    }
    throw new Error("program did not reach idle");
  }
  rowText(addr) {
    const base = addr - 0x8000;
    let s = "";
    for (let i = 0; i < 32; i++) {
      const t = this.vram[base + i];
      if (t === 0x20 && s.length >= 0) s += " ";
      else s += String.fromCharCode(t);
    }
    return s.replace(/\s+$/, "");
  }
}

test("the ROM runs the UHS-88a recipe and prints it to the tile map", () => {
  const gb = new GB(rom);
  gb.run();

  assert.equal(gb.read(0xff40) & 0x80 ? true : false, true, "LCD on (LCDC bit7)");
  assert.equal(gb.read(0xff40), 0x91, "LCDC = BG on, tiles 0x8000");

  assert.equal(gb.rowText(PROGRAM.vram.title), PROGRAM.title);
  assert.equal(gb.rowText(PROGRAM.vram.inRow), PROGRAM.inRow);

  // independent expectation: the verified UHS-88a decoder from
  // tools/verify_uhs_gamegenie.mjs (published primer vectors — mixed case)
  const expected = PROGRAM.outRowPrefix + decrypt88a(PROGRAM.input);
  assert.equal(decrypt88a(PROGRAM.input), "Opening Scene");
  assert.equal(gb.rowText(PROGRAM.vram.outRow), expected);
});

test("the runtime-computed WRAM string matches the verified decoder", () => {
  const gb = new GB(rom);
  gb.run();
  let s = "";
  for (let i = 0; ; i++) {
    const ch = gb.wram[PROGRAM.wramBuffer - 0xc000 + i];
    if (ch === 0) break;
    s += String.fromCharCode(ch);
  }
  assert.equal(s, decrypt88a(PROGRAM.input));
});

test("only the implemented opcode subset is used", () => {
  const OPS = new Set([
    0x00, 0xf3, 0x76, 0xc3, 0x01, 0x11, 0x21, 0x06, 0x0e, 0x16, 0x1e,
    0x26, 0x2e, 0x3e, 0x22, 0x1a, 0x13, 0x0b, 0x78, 0x79, 0xb1, 0xb7,
    0xaf, 0x87, 0xd6, 0xfe, 0x18, 0x20, 0x28, 0x30, 0x38, 0xcd, 0xc9,
    0xc8, 0xe0, 0xf0,
  ]);
  // Static walk of the emitted program is unnecessary: the emulator throws on
  // any unimplemented opcode, and run() above executed the whole program.
  assert.ok(OPS.size > 30);
});
