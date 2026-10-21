# CyberChef → Game Boy ROM — 21 Oct 2026

**Request:** "Convert cyberchef to Gameboy rom." Deliverable: a real, bootable
Game Boy cartridge image whose *on-screen program is a CyberChef recipe* — the
ROM executes the UHS-88a decode recipe (the same recipe verified in
[uhs-gamegenie-recipe-cards-2026-10-21.md](uhs-gamegenie-recipe-cards-2026-10-21.md))
live on the LR35902 CPU and prints its input and output to the tile map.

Builder: [`tools/build_cyberchef_gb.mjs`](../tools/build_cyberchef_gb.mjs)
Test: [`tests/cyberchef-gb-rom.test.mjs`](../tests/cyberchef-gb-rom.test.mjs)

```console
$ npm run build:cyberchef-gb
built dist/cyberchef-gb/cyberchef.gb: 32768 bytes
sha256 2b12931a1e6c04397bf9aa30b09e453330800074bc11f13427cbde77dc803589
```

The ROM is regenerable output (written under gitignored `dist/`, like the other
builders); the builder + test are the source of truth.

## 1. What the ROM does

A 32 KB ROM-only DMG cartridge. Boot: LCD off → clear the BG tile map to
spaces → copy the 8×8 font into tile VRAM (tile index = ASCII) → run the recipe
→ wait for VBlank (LY = 0x90) → LCD on (LCDC = 0x91) → idle. On screen:

```
CYBERCHEF GB
IN: gHrGtGs iqrGr
OUT: Opening Scene
```

The recipe the CPU *computes* is the published UHS-88a transform
(`c < 80 ? 2c−32 : 2c−127` per character), run at boot into a WRAM scratch
string at `$C000` before the text is copied to the tile map. The cipher text
`gHrGtGs iqrGr` and its plaintext **`Opening Scene`** (mixed case — that is the
published pairing, `UHS88A_VECTORS[0]`) come from the Stefan Wolff UHS2HTML
primer listing pinned in `tools/verify_uhs_gamegenie.mjs`.

## 2. Cartridge & program layout

| Region | Contents |
| --- | --- |
| `$0100-$0103` | entry: `00 C3 50 01` — `NOP; JP $150` (JP nn is little-endian!) |
| `$0104-$0133` | Nintendo logo (boot ROM check) |
| `$0134-$014C` | header: title `CYBERCHEF`, ROM-only, 32 KB, no RAM |
| `$014D` / `$014E-$014F` | header checksum / global checksum (both computed by the builder) |
| `$0150-…` | program: clear map, font copy, 88a decode loop, print routines, VBlank gate |
| `…-$1xxx` | strings + 2048-byte font blob (128 glyphs × 16 B 2bpp) |

The font is [`vendor/font8x8_basic.h`](../vendor/font8x8_basic.h) — Daniel
Hepper's public-domain 8×8 bitmap font (`font8x8_basic[128][8]`, bit 0 =
leftmost pixel), converted to Game Boy 2bpp tiles with ink = color 3. Tile
index == ASCII code, so the print routines write plain text straight into the
tile map.

The assembler is a deliberate ~150-line two-pass subset of LR35902 mnemonics
(the ~25 opcodes the program uses) with label fixups for `JR`/`CALL`/`JP` — not
a general assembler. A pass-2 size/encode consistency check throws on any
mismatch (it caught a real bug, see §4).

## 3. Independent verification

`tests/cyberchef-gb-rom.test.mjs` (4 tests) executes the finished ROM image in
a small **independent LR35902 emulator** (another ~25-opcode subset, written
against the opcode spec, not against the builder) and checks:

1. **Header validity** — logo bytes, title, cartridge type/size, header
   checksum, global checksum (field excluded, per the Pan Docs formula), and
   the exact entry bytes.
2. **The recipe ran and displayed** — after the program halts to idle, the tile
   map rows read exactly `CYBERCHEF GB`, `IN: gHrGtGs iqrGr`, and
   `OUT: ` + `decrypt88a("gHrGtGs iqrGr")` taken from the *verified* port in
   `tools/verify_uhs_gamegenie.mjs` (24 published vectors, rounds 2–3). The
   emulator's memory view is the only oracle — the test never re-implements the
   transform.
3. **The runtime-computed WRAM string** at `$C000` equals `decrypt88a` output.
4. **Opcode discipline** — the emulator throws on any opcode outside the
   implemented subset, so the ROM cannot silently depend on anything the tests
   do not model.

```console
$ node --test tests/cyberchef-gb-rom.test.mjs
# tests 4
# pass 4
```

## 4. What the emulator test caught (all real bugs in the first build)

The two-implementation approach earned its keep immediately:

- **`JP $150` encoded as `C3 50 00`** (jumped to `$0050`, into header zeros)
  — a little-endian high byte typo. CPU traced a NOP sled through the header.
- **`insnSize`/`encode` disagreement on `ld_rr_nn`** (sized 2, emits 3):
  every label after the first register-pair load drifted 1 byte per use (15
  uses → 15-byte displacement error; `CALL print` landed mid-instruction at
  `$1B5`). Now guarded by the size/encode check in the assembler itself.
- **Tile-map clear loop clobbered `A`** with the loop counter test
  (`ld a,b; or c`), storing countdown bytes instead of spaces after the first
  iteration — the title row rendered `CYBERCHEF GB×ÓÓÓÓÏÏÏÏ…`.

## 5. Scope, limits, honest labelling

- **Verified here:** the ROM image is structurally valid (checksums, logo,
  entry) and its behavior is correct under the independent emulator; the 88a
  recipe text matches the published UHS primer vectors byte-for-byte.
- **Not verified here:** boot on physical hardware or in a third-party
  emulator (none in the sandbox). The header follows the Pan Docs conventions,
  so BGB/SameBoy/Emulicious should boot it; that claim stays **UNVERIFIED**
  until someone drops the `.gb` into one.
- The cartridge is ROM-only: no MBC, no save RAM, DMG-mode (`$0143` = 0x00).

## 6. Provenance

- 88a vectors + transform: Stefan Wolff UHS2HTML primer via
  [`Tormen/my-uhs`](https://github.com/Tormen/my-uhs) @ `84ba2c90…` (round 2
  ingestion), re-derived in `tools/verify_uhs_gamegenie.mjs`.
- Font: [`dhepper/font8x8`](https://github.com/dhepper/font8x8)
  (`font8x8_basic.h`, public domain) — vendored at `vendor/font8x8_basic.h`.
- No external GB toolchain (RGBDS etc.) is required or used.
