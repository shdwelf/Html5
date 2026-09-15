# SITE-K on calculators — native port

The web app (`index.html`, `keyspace.html`, …) and five graphing calculators now
run **one core**: `calc/core/*.c`. It is compiled by sdcc for the Z80 models, by
TIGCC/GCC4TI for the 68k models, by gcc for the host tests, and transpiled to an
ES module for the browser — so the browser preview you can open in
`calc.html` is not a re-implementation of the port, it *is* the port.

```
TI-83 / TI-83+ / TI-84+   Z80   96x64     .8xp
TI-85                     Z80   128x64    .85s   (ZShell string — see notes)
TI-89 / TI-89 Titanium    68k   160x100   .89z
TI-90                     Z80   96x64     .8xp   (unshipped model — see notes)
TI-92 / TI-92 Plus        68k   240x128   .9xz
```

## What runs on the calculator

Five screens, all drawn into the core's own 1-bit framebuffer:

| # | Screen    | What it shows |
|---|-----------|---------------|
| — | boot      | `SITE-K`, device name, LCD size, "press key" |
| 1 | grid      | 8x8 sector grid (A1–H8), node dots per sector, cursor sector |
| 2 | keyspace  | parallel coordinates of the 12 word indices / Gray-ordered Hilbert tour / entropy+checksum bit plane |
| 3 | terrarium | B3-S1234 automaton, generation counter |
| 4 | device    | model, CPU, LCD, RAM, word count, selected index |

Keys: arrows move, `ENTER` acts (reseed keyspace / step the automaton),
`DEL`/`F1` is the action key (re-seed grid, cycle 12→15→18→21→24 words),
`1`–`5` jump to a screen, `CLEAR`/`ESC` exits.

The keyspace carries real BIP-39 maths, not a decoration: a from-scratch
SHA-256 (single block, enough for 128–256 bits of entropy) produces the genuine
checksum bits, and the 11-bit word **indices** are derived from entropy ‖
checksum. The 2048-word list (~15 KB) deliberately stays in the web app — a
calculator shows indices.

## Layout

```
calc/
  core/          the shared core — integer only, no libc, no float, no malloc
    sitek.h        types, device ids, keys, the platform contract
    tables.c       generated: 3x5 font, sin Q12, log2 mantissa
    util.c         idiv/imod, xorshift32, u32w/add32/ror32/shr32, fsin/fcos
    fb.c           framebuffer: pixel, line, rect, dithered box, text
    keys.c         SHA-256 + BIP-39 index maths, Gray, Hilbert, Morton, H8
    grid.c         sector grid + terrarium automaton
    app.c          the five screens and the key dispatch
  plat/          per-device glue — four calls: init, tick, blit, key
    ti83/ ti85/ ti90/  Z80: crt0.asm + lcd.asm (ROM calls by name) + main.c
    ti89/ ti92/        68k: TIGCC main.c
  host/          host harness: self test, PBM previews, golden dumps
  tools/
    gen_tables.py   regenerates core/tables.c
    c2js.py         C-subset -> ES module (the browser runs this)
    ti_pack.py      writes/verifies .8xp / .85s / .89z / .9xz containers
    build_device.py per-target build orchestration + toolchain detection
    difftest.py     proves the transpiled core == the gcc core
    js_dump.mjs     node-side mirror of `sitek-host dump`
  devices.json    one entry per target: LCD, CPU, container, type ids
  Makefile        host / web / test / preview / pack / per-device
```

## Build

Everything verified in this repo needs only gcc, python3 and node:

```sh
make -C calc            # host build + transpiled web core
make -C calc test       # 42 core checks, C/JS differential test, container selftest
make -C calc preview    # PBM frames for every device (build/preview)
```

Calculator binaries need a cross toolchain; missing ones are reported and
skipped, never faked:

```sh
make -C calc ti83       # needs sdcc + ti83plus.inc in calc/plat/ti83/
make -C calc ti89       # needs tigcc (or gcc4ti)
python3 calc/tools/build_device.py --all
```

`ti83plus.inc` ships with the TI-83 Plus SDK and with Brass/spasm; `ti85.inc`
comes from the ZShell SDK. Every ROM entry point in `plat/*/lcd.asm` is
referenced **by name** from those includes, so nothing hard-codes an address.

## Containers

`tools/ti_pack.py` writes and re-verifies the variable files. Variable type IDs
come from the TI Link Protocol Guide and libtifiles (`types83p.h`, `types85.h`,
`types89.h`), not from guesswork:

| target | container | signature | variable type |
|--------|-----------|-----------|---------------|
| TI-83/84+ | `.8xp` | `**TI83F*` `1A 0A 00` | `0x05` program (+ `BB 6D` AsmPrgm token) |
| TI-85     | `.85s` | `**TI85**` `1A 0C 00` | `0x0C` string (`--type-id 18` → `.85p` program) |
| TI-89/92  | `.89z`/`.9xz` | `**TI89**`/`**TI92**` `01 00` | `0x21` ASM program |

Checksums are the low 16 bits of the sum of the data section (Z80) or of the
variable data (68k). `python3 calc/tools/ti_pack.py selftest` round-trips all
five devices and both TI-85 variants.

## What is verified, what is not

Verified here, on every run of `make -C calc test`:

* 42 core self checks, including SHA-256 against the canonical vectors,
  BIP-39 zero-entropy mnemonics (12 words → index 3 "about",
  24 words → index 102 "art"), Gray round-trip, Hilbert/Morton bijections.
* `tools/difftest.py`: gcc and the transpiled JS produce byte-identical dumps
  for all six devices — word indices, checksum bits, H8, and every rendered
  framebuffer hash.
* Container round-trip for every device.

Not verified here (no cross toolchain and no hardware in this environment):

* The Z80 and 68k binaries themselves. `plat/*/lcd.asm` and the sdcc/TIGCC
  invocations follow the documented SDK conventions, but they have never been
  assembled or run on real silicon. Expect to fix include-file names
  (`kLeft` vs `K_LEFT`) against your copy of `ti83plus.inc` / `ti85.inc` and
  the linker flags against your sdcc version.
* The TI-85 entry points assume a ZShell-compatible shell; the TI-85 has no OS
  assembly hook of its own, which is why the program ships as a string.

## Notes on two of the models

* **TI-90** — no TI-90 was ever shipped. It is built here as a TI-83-class Z80
  profile (96x64, same AsmPrgm container) with its own device id, seed and
  variable name `SITEK90`, so it is a real buildable target that differs from
  the TI-83 in name, seed and every device-dependent panel while sharing the
  core and the Z80 backend.
* **TI-92** — the biggest LCD in the family sets `FB_MAX` (240x128, 30 bytes a
  row, 3840 bytes). On a TI-83 that costs 3.75 KB of RAM for the framebuffer;
  shrink `FB_MAX` per target if you need the bytes back.

## Core dialect

`calc/core` compiles under `-std=c89 -Wall -Wextra -pedantic` for three very
different compilers, so it sticks to a small dialect (documented at the top of
`sitek.h`): integers only, no libc, no struct, no pointer arithmetic, no
`switch`, no ternary, declarations at block top, and every potentially
32-bit-wrapping operation routed through `u32w()` / `add32()` / `mul32()` / `ror32()` / `shr32()` /
`shr32()` so a 16-bit-int Z80 and a 32-bit-int 68k agree. `tools/c2js.py`
enforces the same rules and fails loudly on anything outside them, which is
what keeps the browser build honest.
