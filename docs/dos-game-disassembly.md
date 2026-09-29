# Disassembling the DOS game shelf — Keen, Duke, DOOM, Heretic, Quest for Glory, Tetris

*2026-09-29 · runs the repo's existing MZ toolchain
(`tools/exeprotect.py`, `tools/decompile_mz.mjs`, `tools/decompile_boot.mjs`)
over seven shareware and demo game binaries, and fixes the LZEXE unpacker
bug that the corpus exposed.*

*New tool: `tools/game_triage.py` — container/packer classification for
MZ, LZEXE, PKLITE and LE (DOS/4GW) images.
Evidence: `docs/game-corpus-evidence/`.*

---

## 1. The corpus, and why these files

Only material the publishers released for free redistribution: shareware
episodes, an official Sierra demo, and the freely-distributed original
Tetris. Fetched byte-exact through the repo's archive channel
(`.arena-archive/requests.txt` round 4 → `samples/archive/games/`, sha256
recorded in `samples/archive/PROVENANCE.md`).

| game | file | archive.org item |
| --- | --- | --- |
| Commander Keen 1 v1.31 (Apogee/id, 1990) | `keen1.zip` | `keen1-sw` |
| Duke Nukem II shareware (Apogee, 1993) | `DUKE2.zip` | `msdos_DUKE2_shareware` |
| Duke Nukem 3D shareware v1.3d (3D Realms, 1996) | `3dduke13SW.zip` | `3dduke13SW` |
| DOOM v1.9 shareware (id, 1995) | `doom-sw.zip` | `doom1-sw1` |
| Heretic shareware v1.2 (Raven/id, 1994) | `heretic-sw.zip` | `ayers-software-repair-heretic` |
| Quest for Glory I demo (Sierra, SCI) | `qfg1demo.zip` | `QuestForGlorySoYouWantToBeAHeroDemo` |
| Tetris (AcademySoft, 1986) | `Tetris_1986.zip` | `msdos_Tetris_1986` |

Seven games, and it turns out **four distinct executable families** —
which is the actual interest here. Nobody needs another Doom source
tour; what this corpus shows is the full spread of what "a DOS game
binary" meant between 1986 and 1996.

```
python3 tools/game_triage.py --dir /path/to/extracted
```

| file | family | what stands between you and the code |
| --- | --- | --- |
| `KEEN1.EXE` | MZ + **LZEXE 0.91** | packer stub |
| `NUKEM2.EXE` | MZ + **LZEXE 0.91** | packer stub |
| `DN3DSW13.SHR` | MZ + **PKLITE** | packer stub (undecoded) |
| `doom.exe` | MZ stub + **LE** | DOS/4GW extender, 32-bit flat |
| `HERETIC.EXE` | MZ stub + **LE** | DOS/4GW extender, 32-bit flat |
| `SCIDHUV.EXE` | plain MZ | nothing — but the *game* is bytecode |
| `tetris.com` | **COM**, Turbo Pascal 3.x | runtime header |

## 2. The bug the corpus found: LZEXE only ever worked on one file

`KEEN1.EXE` and `NUKEM2.EXE` both carry the `LZ91` marker, so
`tools/exeprotect.py unpack` should have handled them. It crashed on
both:

```
struct.error: ushort format requires 0 <= number <= 65535
```

The cause was a hard-coded constant:

```python
LZEXE_STUB_INFO = 0x5B30    # stub data area: 8 words (orig regs etc.)
```

LZEXE puts its stub in its own segment and points the MZ entry there with
`e_ip = 0x0E`, so the eight data words sit at the **start of that
segment** — image offset `e_cs << 4`. For `ATR.EXE`, the single sample
the unpacker had ever been run on, `e_cs = 0x5B3`, and `0x5B3 << 4` is
exactly `0x5B30`. The constant was that one file's header, frozen.

Every other LZEXE file therefore read its "stub info" from the wrong 16
bytes, walked the compressed relocation decoder into unrelated data, and
produced nonsense — 26 830 relocations for Keen, with segment values
above `0xFFFF`, which is what finally threw. A quiet failure that only
became loud at the `struct.pack`.

The fix derives the offset from the header:

```python
def lzexe_stub_off(hdr):
    return hdr["e_cs"] << 4
```

plus two guards that turn silent corruption into an error: the
relocation walker now refuses to read past the end of the image, and
`rebuild_exe` rejects any relocation outside 16 bits instead of packing
it.

**Regression check.** `0x5B3 << 4 == 0x5B30`, so ATR.EXE must be
bit-identical to the vectors in `samples/exeprotect/VECTORS.md`, and it
is:

| | expected (VECTORS.md) | got |
| --- | --- | --- |
| unpacked load module | 55 002 B, sha256 `79c72bc0…` | **match** |
| rebuilt EXE | 56 026 B, sha256 `4eb9a400…` | **match** |
| relocations | 132 | 132 |
| stream stats | 9 974 lit / 2 957 short / 2 615 long / 550 runs / 1 slide | identical |

Full log: `docs/game-corpus-evidence/lzexe-unpack.txt`.

## 3. LZEXE 0.91 — Commander Keen 1 and Duke Nukem II

Both unpack cleanly now:

| | KEEN1.EXE | NUKEM2.EXE |
| --- | --- | --- |
| packed | 51 190 B | 58 852 B |
| stub data area | image + `0xC660` | image + `0xE020` |
| unpacked load module | **99 972 B** (`f2a38bf3…`) | **114 124 B** (`4bc2f920…`) |
| rebuilt EXE | 100 484 B (`d52d7b6b…`) | 118 220 B (`06589de6…`) |
| literals / short / long / runs / slides | 21 164 / 7 526 / 5 364 / 1 106 / 2 | 23 618 / 6 525 / 7 234 / 1 454 / 2 |
| relocations rebuilt | 17 | 949 |

`keen1.zip` also ships two more LZEXE 0.91 files that make the point
about the constant better than either game does — `CATALOG.EXE`
(stub at image + `0x1E50`) and `DEALERS.EXE` (+ `0x2050`), both
self-displaying Apogee order-form viewers by Keith P. Graham. So the
corpus now exercises **five different stub offsets**
(`0x5B30`, `0x1E50`, `0x2050`, `0xC660`, `0xE020`), which is four more
than the old code could have handled. `CATALOG.EXE` consumes only 7 756
of its 58 717 stream bytes: the rest of the file is the plain-text
catalogue appended behind the packed viewer, and the unpacker stopping
cleanly at the terminator rather than running on into it is itself a
check on the stream termination logic.

Two observations worth keeping.

**Keen 1 has 17 relocations; Duke Nukem II has 949.** Both are Borland
16-bit builds of comparable size. 17 relocations means almost everything
is near-addressed — Keen 1 is effectively a small-model program with the
EGA data streamed from the `.CK1` files, while Duke Nukem II's 949
fixups are a far-call-heavy multi-segment build. The relocation count is
a free structural fingerprint before you disassemble anything.

**The compressor's own statistics identify the compiler.** Keen has 2.8×
as many literals as long matches; Duke has 3.3×. Both show exactly
**2 segment slides**, against ATR.EXE's 1 — the slide is emitted when the
output window crosses a 64 KB representation boundary, so it is a direct
readout of how many segments of code the original image spans.

Strings confirm the toolchain the moment the stub is stripped — this is
invisible in the packed file:

```
Turbo C++ - Copyright 1990 Borland Intl.
Null pointer assignment
KEENSCRN.PIC
You are now cheating!
You just got a pogo stick, all the key cards, and lots of ray gun charges.
```

That is the Turbo C++ 1.0 runtime plus Keen's own debug cheat
(Ctrl-Alt-F10). Feeding the unpacked image to the Ghidra WASM loader
lands directly in the Turbo C startup:

```
$ node tools/decompile_mz.mjs KEEN1.unp.exe entry
#     entry cs:ip=0x0:0x0 -> linear 0x10000 (image +0x0)
  xRam00010235 = 0x1305;
  pcVar3 = (code *)swi(0x21);        /* INT 21h AH=30h — DOS version check */
  ...
  *(xunknown2 *)0x90 = (int2)xVar14; /* c0.asm stashing PSP/env/DOS version */
```

`swi(0x21)` is Ghidra's rendering of `int 21h`; the pattern of saving the
version, the PSP segment and the environment pointer into fixed low
offsets is `c0.asm`, Borland's C startup module, byte for byte.
Full output: `docs/game-corpus-evidence/keen1-unpacked-entry.c`.

## 4. PKLITE — Duke Nukem 3D's payload, and an honest deferral kept honest

`3dduke13SW.zip` does not contain `DUKE3D.EXE`. It contains
`INSTALL.EXE` and a 5.8 MB blob called `DN3DSW13.SHR`, and the blob is
itself a DOS executable:

```
DN3DSW13.SHR  (5848108 bytes)
  family : MZ + PKLITE
  detail : 'PKLITE Copr.' at 0x1E; e_cs=0xFFF0
           (the 0xFFF0 wrap: entry resolves back to image offset 0)
  MZ     : relocs=1 hdrparas=6   ss:sp=0000:5FB0  cs:ip=FFF0:0100
```

So the shareware "archive" is a PKLITE-compressed self-extracting
program that carries the game data behind it — and `e_cs = 0xFFF0` is
exactly the wraparound trick that `tools/decompile_mz.mjs` documents in
its header comment: `(0xFFF0 + e_cparhdr) & 0xFFFF` wraps the entry
segment back near zero, so the entry resolves to the top of the image
rather than past the end of the file. Get the `& 0xFFFF` wrong and the
entry lands at file offset 0x100060, well past EOF. `game_triage.py`
prints the raw arithmetic so the wrap is visible rather than implied.

`INSTALL.EXE` is a different animal: 2 444 relocations, an MS C 7.0
build, with `PKLITE Copr. 1990-92 PKWARE Inc.` present in the *body*
rather than the header. It is not PKLITE-compressed; it **links PKWARE's
decompression code** to unpack `DN3DSW13.SHR` at install time.
The distinction matters and the triage tool makes it: the marker is only
a packer identification if it sits in the first 0x200 bytes.

`docs/exe-protection-deep-dive.md` §2 recorded PKLITE as a deliberate
non-implementation ("detected but not decoded — honest deferral"). That
deferral stands. What has changed is that the corpus now has a **second,
much larger** PKLITE sample next to `Disavr3.exe`, so whenever PKLITE
does get decoded there is a real test case with a 5.8 MB payload behind
it.

## 5. LE / DOS/4GW — DOOM and Heretic

Both are the 1993–95 id/Raven pattern: a 16-bit MZ program that is
really Rational Systems' **DOS/4GW** extender, with the 32-bit game
appended as a Linear Executable.

```
doom.exe      LE header at 0x270CC   cpu=80386  82 pages x 4096
              entry = object #1 + 0x2DDE0, stack = object #2 + 0x7C710
              obj1 base=0x00010000 vsize=0x32A66 pages=51 flags=0x2045 [RX BIG/32]
              obj2 base=0x00050000 vsize=0x7C710 pages=31 flags=0x2043 [RW BIG/32]

HERETIC.EXE   LE header at 0x28FEC   cpu=80386  114 pages x 4096
              entry = object #1 + 0x2A408, stack = object #3 + 0x6F750
              obj1 base=0x00010000 vsize=0x47250 pages=72 flags=0x2045 [RX BIG/32]
              obj2 base=0x00060000 vsize=0x19    pages=1  flags=0x1045 [RX]
              obj3 base=0x00070000 vsize=0x6F750 pages=41 flags=0x2043 [RW BIG/32]
```

Heretic's third object is the tell: a **25-byte** read-execute object
sitting alone between code and data. That is the classic DOS/4GW
callback/trampoline thunk object — a scrap of code that has to live at a
known selector so real-mode callbacks can reach protected-mode handlers.
DOOM does not have one; Heretic's networking (`IPXSETUP`, `SERSETUP`,
`DWANGO`) does.

Heretic's code object is `0x47250` bytes against DOOM's `0x32A66` — 45%
more code for what is famously the same engine, which is the inventory
system, the flight/wings physics and the ambient-sound code.

**A field-offset trap worth recording.** In the LE header, `0x40` is the
object *table offset* and `0x44` is the object *count*, in that order.
Transposing them is easy and the failure is spectacular rather than
quiet: the first attempt at this parse reported *196 objects* with
`vsize=0xDDE00000` and `pages=117637120`. 196 is `0xC4` — the object
table offset — being read as a count. If an LE parse gives you absurd
object counts, that is the bug.

The 16-bit MZ stub is ordinary real-mode code and `decompile_mz.mjs`
handles it, but it only ever gets you into DOS/4GW's loader. Decompiling
the game itself needs a 32-bit flat SLEIGH spec and an LE page loader
that applies the fixup records (81 KB of them in DOOM, 95 KB in
Heretic). **Not implemented — honest deferral.** The object table above
is the map you would build it from.

## 6. Sierra SCI — the interpreter is not the game

`SCIDHUV.EXE` (144 836 B) is a plain real-mode MZ with 1 924
relocations and no packing at all. Its strings give it away immediately:

```
Script Interpreter, Copyright (C) 1987 Sierra On-Line, Inc.
```

This is the point of the SCI architecture, and it is the most
interesting thing in the corpus from a reverse-engineering standpoint:
**disassembling this binary tells you almost nothing about Quest for
Glory.** `SCIDHUV.EXE` is a virtual machine. The game is `RESOURCE.MAP`
plus `RESOURCE.000` — SCI bytecode, room scripts, `Said()` parser
grammars and views — and the x86 you get from Ghidra is the interpreter
loop, the resource manager and the drivers (`VGA320.DRV`, `MT32.DRV`,
`AUDBLAST.DRV`, all separately loadable).

The entry decompiles cleanly:

```
$ node tools/decompile_mz.mjs SCIDHUV.EXE entry
#     entry cs:ip=0x26:0x7d -> linear 0x102dd (image +0x2dd)
  bVar11 = 0xefff < 0x1a66U - unaff_ES;
  pcVar3 = (code *)swi(0x21);
  ...
  for (iVar7 = 0x2000; iVar4 = iRam0001a668, iVar7 != 0; iVar7 = iVar7 + -1) {
    *pxVar1 = 0x73;                  /* fill 0x2000 words with 0x73 */
  }
```

The `0xEFFF` comparison against a computed segment is a heap-size sanity
check, and the `0x2000`-iteration fill is the stack/heap poison pattern
Sierra's startup writes before handing control to the interpreter — the
same `0x73` fill that later lets SCI report "Out of heap" precisely.
Full output: `docs/game-corpus-evidence/qfg1-sci-interp-entry.c`.

Decoding SCI bytecode is a resource-format problem, not a disassembly
problem, and it is **out of scope here** — ScummVM and the SCI Companion
family already do it properly.

## 7. Tetris, 1986 — 24 KB of Turbo Pascal

The oldest and smallest thing in the corpus, and the only `.COM`:

```
00100  e9 79 2c              jmp 0x2d7c
00103  90                    nop
00104  90                    nop
00105  cd ab                 int abh
00107  "Copyright (C) 1985 BORLAND Inc"
```

A COM file loads flat at `0x100`, so the very first instruction jumps
over a runtime header — and the header is Borland's. The `E9`/`90 90`/
`CD AB` prologue followed by the 1985 copyright is the **Turbo Pascal
3.x** runtime signature; `CD AB` (`int 0ABh`) is header data that never
executes, not an instruction, which is exactly the kind of byte a linear
disassembler will happily mis-decode.

This is independent binary confirmation of the documented history:
Pajitnov's Elektronika 60 original was ported to the IBM PC **in Turbo
Pascal** by Dmitry Pavlovsky and the then-16-year-old Vadim Gerasimov,
over about two months, with Gerasimov adding colour and Pavlovsky the
scoreboard. The whole game, in 24 245 bytes.

`tools/decompile_boot.mjs` handles flat images, so the real entry is
reachable with `--org 0x100`:

```
node tools/decompile_boot.mjs tetris.com 0x2d7c --org 0x100
```

The decompilation (`docs/game-corpus-evidence/tetris1986-entry.c`, 508
lines) is heavily `unaff_`-qualified — Ghidra flagging registers that are
live on entry but never set in the function. That is the correct reading
of Turbo Pascal 3 output: the runtime passes state in registers across
what look like ordinary function boundaries, so no single function is
self-contained. Decompiling TP3 well needs the runtime's calling
convention modelled, which nothing here does.

## 8. Half-Life, Unreal Tournament — not attempted, and why

Both were on the request list and neither is in the corpus. The reasons
are specific, not general:

- **They are 32-bit Windows PE, not DOS.** Nothing in this repo's MZ/LE
  toolchain applies. `tools/exe_triage.py` recognises PE and stops there.
- **The demos are 40–130 MB**, which is outside what this repo commits to
  `samples/archive/` (the largest existing artifact is a 12 MB firmware
  image).
- **The interesting content is not native code anyway.** Unreal
  Tournament's game logic is UnrealScript bytecode inside `.u` packages,
  running on a VM — the same "the binary is an interpreter" situation as
  Sierra SCI in §6, one generation on. Half-Life's is a GoldSrc
  `hl.dll` game module against an engine whose SDK Valve published.

If they are wanted, the honest path is a PE + section triage tool and a
`.u` package reader, which is a separate piece of work from this one.

## 9. Status

| target | result |
| --- | --- |
| Commander Keen 1 | **unpacked** (LZEXE 0.91) + decompiled entry |
| Duke Nukem II | **unpacked** (LZEXE 0.91) |
| Duke Nukem 3D | classified (PKLITE + the `0xFFF0` wrap); decode deferred |
| DOOM | LE object map extracted; 32-bit body deferred |
| Heretic | LE object map extracted (incl. the 25-byte thunk object); body deferred |
| Quest for Glory I | interpreter decompiled; SCI bytecode out of scope |
| Tetris 1986 | classified (Turbo Pascal 3 COM) + entry decompiled |
| Half-Life, Unreal Tournament | not attempted — §8 |
| `tools/exeprotect.py` | **bug fixed**, ATR.EXE vectors unchanged |
