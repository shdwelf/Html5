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
```
