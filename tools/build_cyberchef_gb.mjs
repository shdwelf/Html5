#!/usr/bin/env node
/**
 * build_cyberchef_gb.mjs — "convert CyberChef to Game Boy ROM".
 *
 * Emits a real, bootable 32 KB Game Boy (DMG) ROM whose on-screen program IS a
 * CyberChef recipe: it runs the UHS-88a decode (the recipe verified in
 * docs/uhs-gamegenie-recipe-cards-2026-10-21.md) live on the LR35902 CPU and
 * prints input and output to the tile map:
 *
 *   row 2:  CYBERCHEF GB
 *   row 4:  IN: gHrGtGs iqrGr
 *   row 5:  OUT: OPENING SCENE
 *
 * The ROM is regenerable output (like other builders here it writes under
 * dist/, which is gitignored):   node tools/build_cyberchef_gb.mjs
 * tests/cyberchef-gb-rom.test.mjs executes the ROM in a small independent
 * LR35902 emulator and checks the tile map against tools/verify_uhs_gamegenie.mjs.
 *
 * Font: vendor/font8x8_basic.h — Daniel Hepper's public-domain 8x8 bitmap
 * font (glyphs 0x00-0x7F), converted to Game Boy 2bpp tiles with tile index =
 * ASCII code so the program can write plain text into the tile map.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/* ------------------------------------------------------------- font */

export function loadFontTiles() {
  const h = readFileSync(path.join(root, "vendor", "font8x8_basic.h"), "utf8");
  const start = h.indexOf("{", h.indexOf("font8x8_basic"));
  const end = h.indexOf("};", start);
  const body = h.slice(start, end);
  const rows = [...body.matchAll(/\{([^{}]+)\}/g)].map((m) =>
    m[1].match(/0x[0-9a-fA-F]{2}|\b\d{1,3}\b/g).map((t) =>
      t.startsWith("0x") ? parseInt(t, 16) : parseInt(t, 10)));
  if (rows.length !== 128 || rows.some((r) => r.length !== 8)) {
    throw new Error(`font8x8_basic.h parse failed: ${rows.length} glyphs`);
  }
  // Game Boy 2bpp: 16 bytes per tile, 2 bytes per row. font8x8 stores bit 0
  // as the leftmost pixel; GB stores bit 7 leftmost. Color 3 (both planes)
  // marks ink. Tile index == ASCII code, so VRAM 0x8000+c*16 holds glyph c.
  const tiles = new Uint8Array(128 * 16);
  rows.forEach((glyph, code) => {
    for (let y = 0; y < 8; y++) {
      let plane = 0;
      for (let x = 0; x < 8; x++) {
        if ((glyph[y] >> x) & 1) plane |= 0x80 >> x;
      }
      tiles[code * 16 + y * 2] = plane;
      tiles[code * 16 + y * 2 + 1] = plane;
    }
  });
  return tiles;
}

/* --------------------------------------------------------- assembler */

// Two-pass mini assembler for the opcode subset the program uses. mnemonics
// are resolved by encode(); labels fix JR/CALL/JP/db operands in pass 2.
function assemble(items) {
  const ops = [];
  const labels = new Map();
  let pc = 0x150;
  // pass 1: sizes + label addresses
  for (const it of items) {
    if (it.label) { labels.set(it.label, pc); }
    if (it.db !== undefined) {
      const bytes = typeof it.db === "string"
        ? [...new TextEncoder().encode(it.db), 0]
        : it.db;
      ops.push({ pc, db: bytes });
      pc += bytes.length;
      continue;
    }
    if (it.op === undefined) continue; // bare label marker
    const size = insnSize(it);
    ops.push({ pc, insn: it, size });
    pc += size;
  }
  // pass 2: encode
  const out = [];
  for (const op of ops) {
    if (op.db !== undefined) { out.push(...op.db); continue; }
    const bytes = encode(op.insn, labels, op.pc);
    if (bytes.length !== op.size) {
      throw new Error(`size/encode mismatch for ${op.insn.op}: ${op.size} vs ${bytes.length}`);
    }
    out.push(...bytes);
  }
  return Uint8Array.from(out);
}

const R8 = { b: 0, c: 1, d: 2, e: 3, h: 4, l: 5, a: 7 };
const RR = { bc: 0, de: 1, hl: 2, sp: 3 };

function insnSize({ op, args = [] }) {
  switch (op) {
    case "nop": case "halt": case "di": case "ret": case "retz":
    case "ldea": case "ldah": case "lda_b": case "lda_c":
    case "ldhlp_a": case "incde": case "decbc": case "ora": case "orc":
    case "xora": case "addaa":
      return 1;
    case "ld_r_n": case "sub": case "cp":
    case "ldh_n_a": case "ldh_a_n":
      return 2;
    case "jr": case "jrcc":
      return 2;
    case "jp": case "call": case "ld_rr_nn":
      return 3;
    default: throw new Error(`size? ${op}`);
  }
}

function encode({ op, args = [] }, labels, pc) {
  const ref = (a) => {
    const v = typeof a === "string" ? labels.get(a) : a;
    if (v === undefined) throw new Error(`unknown label ${a}`);
    return v;
  };
  switch (op) {
    case "nop": return [0x00];
    case "halt": return [0x76];
    case "di": return [0xf3];
    case "ret": return [0xc9];
    case "retz": return [0xc8];
    case "ldea": return [0x1a];            // ld a,(de)
    case "ldah": case "ldhlp_a": return [0x22]; // ld (hl+),a
    case "incde": return [0x13];
    case "decbc": return [0x0b];
    case "lda_b": return [0x78];
    case "lda_c": return [0x79];
    case "ora": return [0xb7];
    case "orc": return [0xb1];
    case "xora": return [0xaf];
    case "addaa": return [0x87];
    case "ld_r_n": return [0x06 + (R8[args[0]] << 3), ref(args[1]) & 0xff];
    case "ld_rr_nn": {
      const nn = ref(args[1]);
      return [0x01 + (RR[args[0]] << 4), nn & 0xff, (nn >> 8) & 0xff];
    }
    case "sub": return [0xd6, ref(args[0]) & 0xff];
    case "cp": return [0xfe, ref(args[0]) & 0xff];
    case "ldh_n_a": return [0xe0, ref(args[0]) & 0xff];
    case "ldh_a_n": return [0xf0, ref(args[0]) & 0xff];
    case "jr": {
      const rel = ref(args[0]) - (pc + 2);
      if (rel < -128 || rel > 127) throw new Error("jr out of range");
      return [0x18, rel & 0xff];
    }
    case "jrcc": {
      const [cc, target] = args;
      const base = { nz: 0x20, z: 0x28, nc: 0x30, c: 0x38 }[cc];
      const rel = ref(target) - (pc + 2);
      if (rel < -128 || rel > 127) throw new Error("jr out of range");
      return [base, rel & 0xff];
    }
    case "jp": return [0xc3, ref(args[0]) & 0xff, (ref(args[0]) >> 8) & 0xff];
    case "call": return [0xcd, ref(args[0]) & 0xff, (ref(args[0]) >> 8) & 0xff];
    default: throw new Error(`encode? ${op}`);
  }
}

/* ------------------------------------------------------------ program */

const INPUT = "gHrGtGs iqrGr";       // published UHS-88a ciphertext
const TITLE = "CYBERCHEF GB";
const IN_LABEL = "IN: ";
const OUT_LABEL = "OUT: ";

export const PROGRAM = {
  input: INPUT,
  title: TITLE,
  inRow: IN_LABEL + INPUT,
  outRowPrefix: OUT_LABEL,
  vram: { title: 0x9820, inRow: 0x9860, outRow: 0x9880 },
  wramBuffer: 0xc000,
};

function programItems() {
  return [
    { op: "di" },
    { op: "ld_r_n", args: ["a", 0x00] },
    { op: "ldh_n_a", args: [0x40] },              // LCDC off
    // clear BG tilemap 0x9800..0x9BFF to tile 0x20 (space)
    { op: "ld_rr_nn", args: ["hl", 0x9800] },
    { op: "ld_rr_nn", args: ["bc", 0x0400] },
    { label: "clr" },
    { op: "ld_r_n", args: ["a", 0x20] },  // reload: the test below clobbers A
    { op: "ldhlp_a" },
    { op: "decbc" },
    { op: "lda_b" },
    { op: "orc" },
    { op: "jrcc", args: ["nz", "clr"] },
    // copy 32 KB-ROM font (2048 bytes) to 0x8000 (tile index = ASCII)
    { op: "ld_rr_nn", args: ["hl", 0x8000] },
    { op: "ld_rr_nn", args: ["de", "font"] },
    { op: "ld_rr_nn", args: ["bc", 0x0800] },
    { label: "fontlp" },
    { op: "ldea" },
    { op: "ldhlp_a" },
    { op: "incde" },
    { op: "decbc" },
    { op: "lda_b" },
    { op: "orc" },
    { op: "jrcc", args: ["nz", "fontlp"] },
    // title row
    { op: "ld_rr_nn", args: ["hl", PROGRAM.vram.title] },
    { op: "ld_rr_nn", args: ["de", "title"] },
    { op: "call", args: ["print"] },
    // decode INPUT -> WRAM via the UHS-88a transform (c<80 ? 2c-32 : 2c-127)
    { op: "ld_rr_nn", args: ["de", "input"] },
    { op: "ld_rr_nn", args: ["hl", PROGRAM.wramBuffer] },
    { label: "dec88" },
    { op: "ldea" },
    { op: "ora" },
    { op: "jrcc", args: ["z", "dec88done"] },
    { op: "cp", args: [0x50] },
    { op: "jrcc", args: ["c", "lower"] },
    { op: "addaa" },
    { op: "sub", args: [0x7f] },
    { op: "jr", args: ["store"] },
    { label: "lower" },
    { op: "addaa" },
    { op: "sub", args: [0x20] },
    { label: "store" },
    { op: "ldhlp_a" },
    { op: "incde" },
    { op: "jr", args: ["dec88"] },
    { label: "dec88done" },
    { op: "xora" },
    { op: "ldhlp_a" },                       // NUL-terminate the WRAM string
    // IN row: "IN: " + ciphertext
    { op: "ld_rr_nn", args: ["hl", PROGRAM.vram.inRow] },
    { op: "ld_rr_nn", args: ["de", "inlab"] },
    { op: "call", args: ["print"] },
    { op: "ld_rr_nn", args: ["de", "input"] },
    { op: "call", args: ["print"] },
    // OUT row: "OUT: " + WRAM decoded string
    { op: "ld_rr_nn", args: ["hl", PROGRAM.vram.outRow] },
    { op: "ld_rr_nn", args: ["de", "outlab"] },
    { op: "call", args: ["print"] },
    { op: "ld_rr_nn", args: ["de", PROGRAM.wramBuffer] },
    { op: "call", args: ["print"] },
    // wait for VBlank (LY == 0x90), then LCD on (LCDC 0x91) and idle
    { label: "waitvb" },
    { op: "ldh_a_n", args: [0x44] },
    { op: "cp", args: [0x90] },
    { op: "jrcc", args: ["nz", "waitvb"] },
    { op: "ld_r_n", args: ["a", 0x91] },
    { op: "ldh_n_a", args: [0x40] },
    { label: "idle" },
    { op: "halt" },
    { op: "jr", args: ["idle"] },
    // print: DE = NUL-terminated source, HL = tile-map destination
    { label: "print" },
    { op: "ldea" },
    { op: "ora" },
    { op: "retz" },
    { op: "ldhlp_a" },
    { op: "incde" },
    { op: "jr", args: ["print"] },
    // strings
    { label: "title", db: TITLE },
    { label: "inlab", db: IN_LABEL },
    { label: "outlab", db: OUT_LABEL },
    { label: "input", db: INPUT },
    { label: "font", font: true },
  ];
}

/* ----------------------------------------------------------- ROM image */

const NINTENDO_LOGO = Uint8Array.from([
  0xce, 0xed, 0x66, 0x66, 0xcc, 0x0d, 0x00, 0x0b, 0x03, 0x73, 0x00, 0x83,
  0x00, 0x0c, 0x00, 0x0d, 0x00, 0x08, 0x11, 0x1f, 0x88, 0x89, 0x00, 0x0e,
  0xdc, 0xcc, 0x6e, 0xe6, 0xdd, 0xdd, 0xd9, 0x99, 0xbb, 0xbb, 0x67, 0x63,
  0x6e, 0x0e, 0xec, 0xcc, 0xdd, 0xdc, 0x99, 0x9f, 0xbb, 0xb9, 0x33, 0x3e,
]);

export function buildCyberchefGB() {
  const font = loadFontTiles();
  // splice the font into the item stream by replacing the sentinel entry
  const items = programItems().map((it) =>
    it.font ? { label: "font", db: Array.from(font) } : it);
  const code = assemble(items);
  const rom = new Uint8Array(0x8000);        // 32 KB, ROM-only cartridge
  // entry point
  rom.set([0x00, 0xc3, 0x50, 0x01], 0x100);  // NOP; JP $150
  // header
  rom.set(NINTENDO_LOGO, 0x104);
  const title = new TextEncoder().encode("CYBERCHEF");
  rom.set(title, 0x134);
  rom[0x143] = 0x00;                          // DMG only
  rom[0x144] = 0x00; rom[0x145] = 0x00;       // new licensee "00"
  rom[0x146] = 0x00;                          // not SGB
  rom[0x147] = 0x00;                          // ROM only (no MBC)
  rom[0x148] = 0x00;                          // 32 KB
  rom[0x149] = 0x00;                          // no RAM
  rom[0x14a] = 0x00;                          // dest non-JP
  rom[0x14b] = 0x33;                          // use new licensee
  rom[0x14c] = 0x00;                          // version
  let x = 0;
  for (let i = 0x134; i <= 0x14c; i++) x = (x - rom[i] - 1) & 0xff;
  rom[0x14d] = x;                             // header checksum
  if (0x150 + code.length > 0x8000) throw new Error("program overflows 32 KB");
  rom.set(code, 0x150);
  let sum = 0;
  for (let i = 0; i < rom.length; i++) sum = (sum + rom[i]) & 0xffff;
  sum = (sum - rom[0x14e] - rom[0x14f]) & 0xffff;
  rom[0x14e] = (sum >> 8) & 0xff;
  rom[0x14f] = sum & 0xff;
  return { rom, program: PROGRAM, font };
}

/* ---------------------------------------------------------------- CLI */

if (import.meta.url === `file://${process.argv[1]}`) {
  const { rom } = buildCyberchefGB();
  const outDir = path.join(root, "dist", "cyberchef-gb");
  mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "cyberchef.gb");
  writeFileSync(outFile, rom);
  const sha = createHash("sha256").update(rom).digest("hex");
  console.log(`built ${path.relative(root, outFile)}: ${rom.length} bytes`);
  console.log(`sha256 ${sha}`);
}
