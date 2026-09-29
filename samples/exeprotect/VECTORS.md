# EXE protection vector check — LZEXE 0.91 / TPE / Johansson / anti-debug

Three independent implementations were cross-checked against each other and
against the packer's own runtime stub:

1. **Ghidra** — `tools/decompile_mz.mjs` (Ghidra-WASM, x86:LE:16:Real Mode)
   disassembly of the LZEXE stub inside `samples/archive/dr7/99info.zip →
   ATR.EXE`. Decompile of the far-jump stub entry itself fails ("bytes not
   mapped" — the retf leaves the flow map), so the grammar below was taken
   from `--list` linear disassembly of `0x15B50–0x15C2C` plus the stub data
   area, then re-derived by hand.
2. **UNLZEXE 0.9** — the classic reference utility (`mywave82/unlzexe` on
   GitHub, direct descendant of the 1990 original), compiled with gcc 12.2
   and run on the same files.
3. **This repo** — `tools/exeprotect.py` (standalone CLI) and the kitchen ops
   (`mzTriage`, `lzexeDecode`) in `public/apps/cyberchef/index.html`, both
   written from the Ghidra-derived grammar without consulting the C source
   for the decode loop.

## LZEXE 0.91 — ATR.EXE (dr7 corpus, `99info.zip`)

| check | result |
| --- | --- |
| packer ID | LZEXE 0.91 — `LZ91` at file offset 0x1C (word@0x18 forced to 0x001C so the marker doubles as an empty reloc table) |
| packed file | 23 883 bytes, entry 05B3:000E, `e_crlc=0` |
| unpacked load module | **55 002 bytes**, sha256 `79c72bc08667210160ccd595a776766d14b55f59374762c33de756c7252c5fd7` |
| rebuilt original EXE | **56 026 bytes**, sha256 `4eb9a400e69b310882cfc3dca4402520ff515f5476eb7a7852582d7eb545c38c` |
| UNLZEXE 0.9 output | **byte-identical** to the rebuilt EXE (both tools, all 56 026 bytes) |
| stream stats | 23 335 of 23 851 stream bytes consumed; 9 974 literals, 2 957 short matches, 2 615 long matches, 550 runs, 1 segment slide |
| relocations | 132, rebuilt from the stub's compressed table (stub+0x158); first entry 0000:0001 → image[1] = 0x084F, the `mov dx,084Fh` pointer at the program start |
| original entry | 0:0 (image offset 0 — the first decoded bytes are `mov dx,084Fh; mov cs:[028Fh],dx; mov ah,30h; int 21h`), ss:sp 0D86:0080 |
| LZEXE 0.90 / PKLITE | detected, **decode deferred** (honest limitation) |

The one non-obvious semantic that both re-implementations got wrong on the
first pass: **the 16-bit flag word is reloaded the moment the 16th bit is
dispensed — before the element bytes for that bit are read** (stub:
`dec dx / jne / lodsw` sits ahead of the `movsb`). A lazy reload consumes
the flag word one element too late and desynchronises the whole stream
after 15 elements (first symptom: a short match whose displacement reaches
before the start of output).

## LZEXE 0.91 — the game corpus (`samples/archive/games/`)

Added 2026-09-29. ATR.EXE was for a long time the *only* LZEXE sample
here, and that hid a bug: both implementations hard-coded the stub data
area at `0x5B30`, which is just `e_cs << 4` for that one file (`e_cs =
0x5B3`). These two samples have different entry segments, so they are
the vectors that pin the offset to the header rather than to a constant.
See `docs/dos-game-disassembly.md` §2–3.

| | **KEEN1.EXE** | **NUKEM2.EXE** |
| --- | --- | --- |
| source | `keen1.zip` (Commander Keen 1 v1.31, Apogee/id 1990) | `DUKE2.zip → DUKE2/` (Duke Nukem II shareware, Apogee 1993) |
| packed file | 51 190 bytes | 58 852 bytes |
| entry | 0C66:000E | 0E02:000E |
| stub data area | image + **0x C660** | image + **0x E020** |
| unpacked load module | **99 972 bytes** (0x18684), sha256 `f2a38bf36ac19dba85fd6335b1c9fc0dea0a15647a3b0c0257f109c10df3400a` | **114 124 bytes** (0x1BDCC), sha256 `4bc2f9202f8445d0734fea711679e0efdb537494b988a824068d4cea809c7ee4` |
| rebuilt original EXE | **100 484 bytes**, sha256 `d52d7b6bd9f25412ff40d0bece121f83d3c0aca87abd7d879c8219711b61ed70` | **118 220 bytes**, sha256 `06589de60d40d85d5e97e0b9b635bfb7b84050355e63ac2bbee1176d2d4d8b0a` |
| stream stats | 50 773 of 51 158 consumed; 21 164 lit, 7 526 short, 5 364 long, 1 106 runs, 2 slides | 57 370 of 58 820 consumed; 23 618 lit, 6 525 short, 7 234 long, 1 454 runs, 2 slides |
| relocations | 17 | 949 |
| agreement | `tools/exeprotect.py` and the `lzexeDecode` kitchen op produce **byte-identical** output | same |

Cross-check status: these two are corroborated by the repo's *two*
independent implementations (Python and JS), not by UNLZEXE — no compiled
UNLZEXE was available in this sandbox. ATR.EXE remains the sample tied to
the external third-party reference, and it is unchanged by the fix
(`0x5B3 << 4 == 0x5B30`), which is what makes it the regression anchor.

Unpacked-content sanity check (Keen): strings absent from the packed file
and present after unpacking — `Turbo C++ - Copyright 1990 Borland Intl.`,
`KEENSCRN.PIC`, `You are now cheating!`.

## TPE data cipher (Trident Polymorphic Engine)

`samples/exeprotect/tpe_cipher_ref.c` is a C harness transcribed directly
from `samples/src/tpe_v12.asm` (`do_encrypt`, the `lup` word loop, the
`blup` byte loop with its `xor dh,dh` quirk). Progressive key
`K_i = K0 + i·S`, methods XOR / ADD / SUB, byte or 16-bit word:

| mode | K0 | S | input | reference (C) | kitchen `tpeCrypt` | verdict |
| --- | --- | --- | --- | --- | --- | --- |
| word XOR | beef | 0001 | `abcdef01` | `5b731ebf` | `5b731ebf` | PASS |
| word ADD | 1234 | beef | `deadbeefcafe` | `017fd07fcb4d` | `017fd07fcb4d` | PASS |
| word SUB | 0000 | 00ff | `0102` | `0201` | `0201` | PASS |
| byte ADD | beef | 0101 | `00010203` | `f0f2f4f6` | `f0f2f4f6` | PASS |
| byte XOR | aaaa | 0007 | `0011223344556677` | `b1a99df58981bd95` | `b1a99df58981bd95` | PASS |

All five vectors also decrypt back to the plaintext with the inverse
method (ADD↔SUB). The op implements the cipher core only — TPE's
mutating-decryptor *generator* (junk insertion, register permutation,
carry chains) is out of scope and documented as such.

## Johansson opcode substitution

Table: 163 byte-pairs parsed verbatim from
`samples/src/byte-substitutions.txt` ("Byte Substitutions for Intel
Opcodes", Karsten Johansson / PC Scavenger, 1993). Spot checks:
`03C3→01D8` (ADD AX,BX), `13C2→11D0` (ADC AX,DX), `8AE1→88CC` (MOV AH,CL);
reverse direction inverts them. Note: a few published pairs (e.g. the
`02C0/02C4` ADD AL,AL row) are not semantics-preserving and are kept
as-published — the report mode shows the mnemonic so nothing is hidden.

## Anti-debug scan

Vectors are hand-assembled snippets from the `samples/src/anti-debug1*.asm`
corpus (`jmp $-2` = `EB FC`, `mov ax,3508h` = `B8 08 35`, `div ah` =
`F6 F4`, pushf/popf = `9C … 9E`, self-modifying `C6 06 …` before `CD 21`).
Scanner output offsets were checked against those sources.

## How to re-run

```sh
python3 tools/exeprotect.py triage  samples/…/ATR.EXE     # after unzipping
python3 tools/exeprotect.py unpack  samples/…/ATR.EXE out.exe
python3 tools/exeprotect.py verify  samples/…/ATR.EXE 79c72bc08667210160ccd595a776766d14b55f59374762c33de756c7252c5fd7
gcc -O2 -o tpe_ref samples/exeprotect/tpe_cipher_ref.c && ./tpe_ref w x beef 0001 abcdef01
npx vitest run test/exe-protection-recipes.test.ts

# game corpus (unzip samples/archive/games/{keen1,DUKE2}.zip first)
python3 tools/game_triage.py --dir /path/to/extracted
python3 tools/exeprotect.py unpack KEEN1.EXE  KEEN1.unp.exe
python3 tools/exeprotect.py unpack NUKEM2.EXE NUKEM2.unp.exe
```

## PKLITE v1.15 "extra compression" — Disavr3.exe

Derived from the packer's own stub (`tools/decompile_mz.mjs`), not from any
existing unpacker. Closes the deferral in `docs/exe-protection-deep-dive.md`
§2. Full derivation: `docs/exe-compressors-and-scumm.md` §1.

Source: `samples/archive/dr7/disavr121.zip` → `Disavr3.exe`, 12 744 bytes.

| field | value |
| --- | --- |
| version word @0x1C | `0x110F` → v1.15, extra compression |
| entry `cs:ip` | `FFF0:0100` (20-bit wrap → image offset 0) |
| stub segment base | image − `0x100` (operand `0x2F6` = image `0x1F6`) |
| decrypt chain | 216 words, backwards, image `0x48..0x1F7` |
| initial chain key | `0x0317` (**first** `mov dx,imm16`; the last is the AH=9 message pointer `0x0118`) |
| length table | image `0x1CF` = `[3,0,2,10,4,5,0,0,0,0,0,0,6,7,8,9]` |
| offset-high table | image `0x1DF` = `[1,2,0,0,3,4,5,6,0,…,7,8,9,10,11,12,13,…]` |
| token stream | image `0x200 .. 0x315A` (the only paragraph-aligned start that ends cleanly) |
| tokens | 6 490 literals, 2 617 matches (24 runs), 223 length escapes |
| output | 19 914 bytes, sha256 `0a3e081fa757b6d78433340b4b98ab4c28fb326fbcbe42de8b659a5e020d7c0e` |

Output opens `BA 20 04 · 2E 89 16 BE 02 · B4 30 · CD 21`
(`mov dx,0420h; mov cs:[02BEh],dx; mov ah,30h; int 21h`).
Strings present only after unpacking (zero occurrences in the packed file):
`Borland C++ - Copyright 1991 Borland Intl.`, `Atmel AVR Disassembler v1.21`.

**The key barely matters, which is the point.** Decrypting with the wrong key
`0x0118` yields the *same* `0a3e081f…` output: the chain is self-synchronising,
so only the first word depends on the key and that word is outside the stream.

**Not covered:** PKLITE v1.20 (`DN3DSW13.SHR`) — the stub decrypts but the
decompressor layout differs; `tools/pklite.py` fails loudly rather than
guessing. Also not covered: non-"extra" mode, and relocation-table rebuild
(the unpacker emits the load module, not a runnable EXE).

## SCUMM v5 resource obfuscation — PLAYFATE (Fate of Atlantis demo)

Source: `samples/archive/games/PLAYFATE.zip`. Tool: `tools/scumm.py`.

| field | value |
| --- | --- |
| whole-file XOR | `0x69`, recovered from the root tag (all 4 bytes must agree) |
| room-name XOR | `0xFF`, a **second** layer applied only to RNAM name bytes |
| block header | 4-byte tag + **big-endian** u32 size, size includes the header |
| `PLAYFATE.000` | root `RNAM`, 12 030 B, **96** room names |
| `PLAYFATE.001` | root `LECF`, 929 852 B, `LOFF` directory + **10** `LFLF` rooms |
| rooms shipped | `[42, 48, 49, 63, 68, 69, 75, 82, 83, 98]` |
| rooms listed but absent | 86, each name prefixed `;` |

Verified invariant (`scumm.py verify`): the set of rooms in the `LOFF`
directory equals exactly the set of names **without** the `;` prefix, and the
`LFLF` block count agrees. 10 for 10.

The table's final entry repeats the last room number with an all-zero name;
both implementations treat an empty name as the terminator, which is why the
count is 96 and not 97.
