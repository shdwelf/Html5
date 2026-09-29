# EXE protection deep dive — Ghidra on DOS packers, polymorphic engines, anti-debug lore

*2026-09-28 · companion to the `EXE Protection` recipes in `/apps/cyberchef/`
(`mzTriage`, `lzexeDecode`, `tpeCrypt`, `opcodeSubst`, `antiDebugScan`),
the CLI `tools/exeprotect.py`, the loader `tools/decompile_mz.mjs`, and the
vector record `samples/exeprotect/VECTORS.md`.*

This deep dive runs the repo's Ghidra tooling over *real* archived
protection schemes — not clean-room textbook examples — and rebuilds them
as kitchen recipes. Corpus: `samples/archive/dr7` (ATR.EXE, LZEXE 0.91),
`samples/archive/dr7 → disavr121.zip` (Disavr3.exe, PKLITE), and the
`samples/src` protection/virus sources (TPE v1.1–1.3, Johansson's opcode
substitutions, five anti-debug demos, EXEBUG2, Michelangelo & friends).

---

## 1. Running Ghidra on a DOS MZ executable

`tools/decompile_mz.mjs` (same fetch-shim + loadBundle pattern as the ELF
loader) maps an MZ file the way DOS would: load segment `0x1000`, image at
`BASE=0x10000`, entry at `((0x1000 + e_cs) << 4) + e_ip`, and decompiles
with SLEIGH `x86:LE:16:Real Mode`.

What works, what doesn't:

- **Segmented addressing decompiles fine.** The LZEXE stub's three stages
  (chunked backward move, flag-word decode loop, epilogue) all survived
  Ghidra's decompiler in real mode.
- **Far-flow stubs break whole-function decompilation.** ATR.EXE's entry
  point ends in `retf` into a *different segment*; the decompiler dies with
  `Lowlevel Error: Bytes at 0x00088894 are not mapped`. The workaround that
  produced the full algorithm: `--list FROM:TO` linear disassembly of the
  stub range plus targeted decompiles of interior addresses. This is
  worth remembering as a general MZ lesson: *when the entry far-jumps,
  disassemble the target range linearly first.*
- The disassembler helper (`js/x86dis.js` `analyze()`) returns
  `{insns: Map, order: […]}` with `.ip/.bytes/.repr` per instruction —
  see `tools/verify_disasm.mjs` for canonical usage.

## 2. LZEXE 0.91 — the packer Ghidra unpacked

LZEXE is the 1989–1990 DOS EXE compressor by **Fabrice Bellard** — yes,
the same Bellard of later QEMU and FFmpeg fame — v0.90 (1989-10-30) and
v0.91 (1990-01-02), shipped with a generation of shareware and early id
Software / Apogee / Softdisk titles. Identification is easy: the word at
header offset 0x18 is forced to `0x001C` so the bytes at 0x1C — `LZ91` —
double as an *empty relocation table*, and Bellard's mark (`*FAB*`) sits at
start-of-execution +233 in 0.91 ([justsolve.archiveteam.org](http://justsolve.archiveteam.org/wiki/LZEXE)).

ATR.EXE (dr7 corpus, 23 883 bytes) carries the canonical 0.91 stub. The
runtime, from the Ghidra disassembly of `05B3:000E`:

1. **Stage 1** — copy the 507-byte stub up to `cs+0x7CC` paragraphs and
   `retf` to `(new):0x2B`.
2. **Stage 2** — chunked (≤0x1000 paragraphs at a time) *backward* move of
   the packed data from the load image to just above the stub.
3. **Stage 3** — `es` = destination (original load segment), `ds` = packed
   source, `si = di = 0`, first flag word preloaded with `lodsw`, `dx`
   counts 16 bits.

The compressed grammar (bit stream LSB-first, 16-bit flag words):

| bits | meaning |
| --- | --- |
| `1` | literal: copy one byte |
| `0 0 <2-bit L> <byte>` | short match: `len = L+2` (2–5), `disp = byte − 0x100` (−256…−1) |
| `0 1 <word w>` | long match: `lo=w&0xFF`, `hi=w>>8`, `disp = −0x2000 + ((hi>>3)<<8) + lo`, `len = (hi&7)+2` (2–9) |
| long match with `len==0`, next byte | `0` = END · `1` = segment slide (pure representation change: `es += (di>>4) − 0x200; di = (di&0xF) + 0x2000`) · `n≥2` = run, `len = n+1`, same displacement |

Matches copy **byte by byte** (`mov al,es:[bx+di]; stosb`), so
overlapping copies behave like RLE. The stub's data area (stub segment
+0) holds the original `ip, cs, sp, ss`, the packed size in paragraphs,
the "grow" paragraphs, and the stub length; the compressed relocation
table hides at stub+0x158 and decodes through byte-delta spans with
`0x0000` bumping the segment by `0x0FFF` and `0x0001` terminating.

**The bug that took the longest.** Our first reimplementation decoded 15
elements and then desynchronised — a short match appeared to reach before
the start of the output window, which is impossible for a well-formed
stream. Every window-prefill theory (zeros, spaces, stale image bytes,
ring buffer) failed a relocation oracle. The real cause was one
instruction pair in the stub: the flag word is reloaded *the moment the
16th bit is dispensed* — `dec dx / jne / lodsw` sits **before** the
`movsb` — so the 16th element's data bytes are read *after* the next flag
word. A lazy reload consumes the flag word one element too late. One line
of code; the entire stream depends on it. (UNLZEXE's `getbit()` — reload
inside the call, before the caller reads data — encodes the same order.)

**Verification chain** (full record in `samples/exeprotect/VECTORS.md`):
our Python decoder and our kitchen op both produce an unpacked image of
55 002 bytes (sha256 `79c72bc0…`) and a rebuilt EXE of 56 026 bytes
(sha256 `4eb9a400…`), **byte-identical** to the output of UNLZEXE 0.9 —
the classic decompressor originally by **Mitugu Kurizono (Kou)**, later
patched by others; we compiled `mywave82/unlzexe` and ran it on the same
file. 132 relocations rebuild, entry restores to `0:0`, and the first
decoded instructions are the original program start
(`mov dx,084Fh; mov cs:[028Fh],dx; mov ah,30h; int 21h` — a DOS version
check, i.e. 99info's own ATR tool).

**What we did not implement, on purpose.** LZEXE 0.90 (different stub,
different reloc format at +0x19D) and PKLITE — detected by `mzTriage`
(`PKLITE Copr. 1990-92 PKWARE Inc.` string; our Disavr3.exe sample) but
decode is honestly deferred, not silently faked. There is also a Rust
`lzexe` crate covering 0.90/0.91/0.91e if you need 0.90 today.

> **2026-09-29 — the unpacker only ever worked on ATR.EXE.** The stub
> data area was a hard-coded `0x5B30`, which is simply `e_cs << 4` for
> this one file. Running it on the DOS game corpus
> (`docs/dos-game-disassembly.md`) crashed it on both LZEXE samples;
> `tools/exeprotect.py` now derives the offset from the header and
> rejects out-of-range relocations instead of packing them. ATR.EXE's
> vectors above are unchanged (`0x5B3 << 4 == 0x5B30`), and Commander
> Keen 1 and Duke Nukem II now unpack. The PKLITE deferral still
> stands, but the corpus gained a second, 5.8 MB PKLITE sample
> (Duke Nukem 3D's `DN3DSW13.SHR`) to test against when it is lifted.

## 3. The polymorphic era — TPE and friends

Once scanners started matching *bytes*, virus authors answered with
polymorphic engines: every generation of the payload gets a different
decryptor, so no fixed signature matches. The canonical trio of the early
'90s: **MTE** (Mutation Engine, "Dark Avenger"), **TPE** (Trident
Polymorphic Engine), and **DAME** (Dark Angel's Multiple Encryptor).

The repo's `samples/src/tpe_v1[123].asm` files are a full TPE
disassembly ("[ MK / TridenT ]" — the engine carries its makers' mark in
the first bytes, which is exactly how `mzTriage` detects it). The engine
takes `DS:DX` code + `CX` length plus flag bits, and *generates* a
decryptor with randomized register choices, junk instructions, direction,
and count style — then encrypts the payload with the cipher core:

```
do_encrypt:  add  dx, add_val        ; K += S (progressive key)
             xor  ax, dx   ; or      ; method bit 1
             sub  ax, dx   ; or      ; method bit 0
             add  ax, dx             ; default
lup:         lodsw / stosw / loop    ; word mode
blup:        lodsb / xor dh,dh / stosb / loop   ; byte mode (carry dropped)
```

The kitchen's `tpeCrypt` implements exactly this core — `K_i = K0 + i·S`
under XOR/ADD/SUB, word or byte width — verified against
`samples/exeprotect/tpe_cipher_ref.c`, a C harness transcribed
instruction-for-instruction from the v1.2 listing. The *generator* side
(junk insertion, register permutation) is out of scope for a recipe op
and documented as such: the point of shipping the cipher is that a
reverse engineer who meets a TPE-encrypted blob can strip the decryptor
in a debugger and then finish the job with arithmetic they can verify.

## 4. Johansson's opcode substitutions — mutation without an engine

Karsten Johansson's 1993 "Byte Substitutions for Intel Opcodes" (PC
Scavenger; `samples/src/byte-substitutions.txt`) is the poor man's
polymorphism: 163 published byte-pairs where x86 register instructions
have two encodings that differ by a constant XOR — the classic
`op r, r/m` ↔ `op r/m, r` direction swap (`ADD AX,BX`: `03 C3` ↔ `01 D8`,
XOR `1202`). XOR a whole code region with one word and entire
instruction sets flip to their twins; the text pitches it for mutating
the encryption engine *and* the encrypted bytecode, "stamping" a
signature into a binary, or hiding text inside a working executable.
A few published pairs are not semantics-preserving (the ADD AL,AL row's
`02 C4` is `add al,ah`) — the `opcodeSubst` report shows the mnemonic so
nothing is hidden, and the table is kept as-published. This is the
ancestor of the trick every packer still uses: two encodings, one
meaning, pick per build.

## 5. Anti-debug & anti-disassembly, 1990s edition

The five `samples/src/anti-debug1*.asm` demos catalogue the era's
techniques; `antiDebugScan` recognises their signatures:

| trick | sample | what a tracer sees |
| --- | --- | --- |
| `jmp $-2` (`EB FC`) into the previous immediate | 1a | the debugger's linear disassembly desynchronises; execution "starts" mid-instruction |
| self-modifying `mov byte [mem],9` before `int 21h` | 1b | traced run prints garbage / exits, real run prints the string |
| patching the message pointer word | 1c | traced run shows the taunt, real run the real text |
| `div ah` after installing an INT 0 handler | 1d | divide "error" is actually a jump table |
| hijacking INT 8 (timer) so the program body runs from the ISR | 1e | single-stepping never reaches the program at all |

Plus the classics the scanner also flags: `EB FE` jump-to-self hangs,
`INT 1` / one-byte `ICEBP` (`F1`) traps, `INT3` (`CC`) planting,
`PUSHF…POPF` trap-flag inspection, and `MOV AX,3508h` vector grabs.
The readme's own words hold up thirty years later: when you consider how
these work, CPU side-channel bugs "didn't surprise me one bit."

## 6. The lore shelf — why these tools existed

**Processor-locked licensing.** Before there was any serial number *in*
the CPU, protection tied licenses to whatever fingerprint the machine
offered: PSP/BIOS data, timing quirks, FPU presence. The industry then
tried to make the tie-in silicon: the Pentium III launched 28 Feb 1999
with a **Processor Serial Number** readable via `CPUID` — pitched for
e-commerce identity, and immediately met by EPIC, a letter from Rep.
Edward Markey to Craig Barrett, and a European Parliament motion
([Wired, Jan 1999](https://www.wired.com/1999/01/intel-on-privacy-whoops/));
Intel made the off-switch default and dropped PSN from Tualatin, the P4
and Pentium M. The idea returned quietly as **PPIN** from Ivy Bridge on
(and in AMD's Zen 2), while modern licensing mostly hashes hardware
through TPMs instead. The DOS corpus in §5 is what "processor locking"
looked like when the CPU gave you nothing to lock to.

*Both of the threads below are now carried through in full — the
processor-locking arc (PSN → PPIN → TPM, with the actual CPUID sequence
and MSR numbers), the Ghost container and its password cipher, and the
debugger/lore shelf — in `docs/norton-ghost-deep-dive.md`.*

**Norton Ghost and the boot-disk economy.** GHOST — "General
Hardware-Oriented System Transfer" — was built by **Murray Haszard** at
**Binary Research, Auckland, New Zealand** (first sold 1996; DOS-based
versions 1995–2003), and Symantec bought the company in July 1998 for
US$27.5 million, rebranding it Norton Ghost and keeping the Auckland
team for another decade. Consumer Ghost died 30 April 2013. For the
boot-crowd: Hiren's BootCD included commercial tools like Ghost up to
**v10.6** (17 commercial products, from Acronis to Paragon); v11.0
removed them all, and people have bolted Ghost32 back onto 15.x with
HBCD Customizer ever since. Ghost matters to *this* corpus because the
DOS boot floppy was the natural habitat of packed EXEs and the
anti-debug tricks above — the same toolkit used for cloning labs and for
cracking licenses.

**The reverse-engineering lore ISOs.** The scene's knowledge didn't live
on websites; it lived on CDs. **OpenRCE** (openrce.org, launched at RECon
Montréal 2005 by Pedram Amini; now read-only, its 2014 "secret" leak
famously fixed by Pedram himself on Reddit) preserved plugins like
OllyBone and Loop Detection, and archive.org carries GitHub bundles of
its malware-analysis training (Amini & Ero Carrera). **+Fravia** —
Francesco Vianello, 1952–2009 — ran *searchlores.org*, the definitive
"searching habits" school of reverse engineering; the domain is parked
but woodmann.com/fravia and search.lores.eu mirror it, archive.org holds
the 83 MB site zip and his 2006 Recon talk ("Power searching without
Google"). The RCE community of that era overlaps directly with the
protection schemes above: the same OllyDbg-era workflows — stepping
through a TPE decryptor, patching an INT 3 — that the anti-debug corpus
was built to punish.

**The debuggers themselves.** **IDA Pro** (DataRescue → Hex-Rays) grew
from a disassembler into a full debugger, and remains the professional
default; the free tier is deliberately limited. **Immunity Debugger** —
OllyDbg 1.1 reborn with a Python 2.7 console, built by Immunity Inc. for
exploit development, home of Corelan's **mona.py** — is unmaintained
today; **x64dbg** is its living successor. Ghidra (NSA, open-sourced
2019) is the free-software answer that this repo's own tooling is built
on: `tools/decompile_mz.mjs` is literally Ghidra's SLEIGH real-mode
specification disassembling a 1990 packer stub in a browser-adjacent
WASM runtime. The loop from "buy IDA or know somebody" to "run SLEIGH on
a DOS EXE from a JS shell" is the whole story of the last thirty years
of this craft.

## 7. Recipe map

| recipe | what it does | verified how |
| --- | --- | --- |
| `mzTriage` | MZ header parse, entry, relocations, packer ID (LZEXE 0.90/0.91, PKLITE, TPE mark) | header fields vs hex dump; stub-info words vs UNLZEXE's `inf[]` |
| `lzexeDecode` | full LZEXE 0.91 unpack + EXE rebuild | byte-identical to compiled UNLZEXE 0.9 (§2) |
| `tpeCrypt` | TPE cipher core, both widths, inverse | C harness transcribed from `tpe_v12.asm` (§3) |
| `opcodeSubst` | Johansson byte-pair substitution + report | table parsed verbatim from the 1993 text (§4) |
| `antiDebugScan` | signature scan of the corpus tricks | offsets vs hand-assembled `anti-debug1*.asm` snippets (§5) |

Packs: **EXE Packer Triage & LZEXE Unpack (Ghidra-verified)** and
**DOS Anti-Debug & Polymorphic Ops (TPE, Johansson)**.
