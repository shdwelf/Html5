# Closing the PKLITE deferral, and the LucasArts XOR — X-COM, Indiana Jones, and a self-decrypting packer

*2026-09-29 (round 2) · companion to `docs/dos-game-disassembly.md`.*

*New tools: `tools/pklite.py` (PKLITE stub decryption + v1.15 decompressor),
`tools/scumm.py` (SCUMM XOR deobfuscator + container walker).
New kitchen ops: `pkliteStub`, `scummXor`.*

---

## 0. OpenJDK, finally

The previous rounds recorded "no JDK — don't attempt Ghidra headless locally"
as a hard dead end. That is now resolved, and it did not need the network:
the repo already relays a JDK through GitHub in three split parts for CI use.

```sh
cat .relay/jdk/jdk21.tar.gz.part-0* > /tmp/jdk21.tar.gz
sha256sum -c .relay/jdk/jdk21.sha256      # ce79869e…aee94  ✓
tar xzf /tmp/jdk21.tar.gz -C /tmp/jdk
/tmp/jdk/jdk-21.0.12.1+1/bin/java -version
#   openjdk version "21.0.12.1" 2026-08-18 LTS
#   OpenJDK Runtime Environment Temurin-21.0.12.1+1 (build 21.0.12.1+1-LTS)
```

The hash matches the recorded one exactly. A direct download is still
impossible — GitHub release assets redirect to
`release-assets.githubusercontent.com`, which the sandbox cannot reach
(`SSL_ERROR_SYSCALL`) — so the relay is the mechanism, not a convenience.

Worth being honest about what this bought: **nothing yet**. A JVM is not
Ghidra, and no Ghidra distribution is present (only the ~4 MB WASM
decompiler in `wasm/ghidra/`). Fetching the real thing is a ~400 MB release
zip, far beyond what belongs in this repo. All the disassembly below was done
with the existing JVM-free `tools/decompile_mz.mjs`. The JDK is now available
for `abbottabad-ghidra/`'s pipeline; that is the payoff, and it is deferred.

## 1. PKLITE — a self-decrypting packer, and how it was opened

`docs/exe-protection-deep-dive.md` §2 twice recorded PKLITE as
"detected but not decoded — honest deferral". That deferral is now closed for
**v1.15 "extra compression"**, derived entirely from the packer's own runtime
stub via `tools/decompile_mz.mjs`. No PKLITE source and no existing unpacker's
source was consulted for the decode loop.

### 1.1 The stub decrypts itself

Only a short preamble is plaintext. It ends in:

```asm
      mov  dx, 0317h          ; <- initial chain key
      ...
      mov  cx, 00D9h          ; 217 words
      mov  si, 02F6h          ; top of the encrypted region
      mov  di, si
      std                     ; walk DOWNWARDS
loop: dec  cx
      je   done
      lodsw
      xchg ax, dx             ; ax = previous key, dx = this ciphertext word
      xor  ax, dx
      stosw
      jmp  loop
```

A running-XOR chain, backwards, in place, where the key for each word is the
**previous ciphertext** word. Two traps are worth recording:

**Trap 1 — the segment base.** PKLITE sets `cs = 0xFFF0` and relies on 20-bit
wraparound, so the stub's segment sits **0x100 below** the load image. The
operand `0x2F6` is image offset `0x1F6`, not `0x2F6`. Decrypting at the wrong
base produced a window of `0x148..0x2F7` instead of `0x48..0x1F7`. The
correct geometry is self-evidencing: the loop's exit branch (`je 0x48`) lands
exactly on the first byte of the decrypted region.

**Trap 2 — it is self-synchronising, so wrong answers look right.** Because
the key is ciphertext rather than plaintext, `out[i] = C[i] ^ C[i-1]` depends
only on two adjacent words. *Only the very first word depends on the initial
key.* So a wrong start offset still decrypts the overlapping region perfectly,
and a wrong key corrupts exactly one word. Both mistakes were made here and
both produced plausible, readable 8086 code.

That is not a hypothetical: `find_decrypt_params` initially picked the *last*
`mov dx,imm16` in the preamble — which is the "not enough memory" message
pointer for `int 21h/AH=9`, not the key — and got `0x0118` instead of `0x0317`.
The tool still unpacked the file to a **byte-identical** result
(`sha256 0a3e081f…` either way), because the one corrupted word lies outside
the token stream. The fix is to take the first such instruction; the point is
that nothing in the output would have told you.

### 1.2 The token stream

16-bit bit buffer in `BP`, refilled by `lodsw`, consumed LSB-first, count in
`DX`. Two tables live in the stub, located here by finding the instructions
that read them (`mov cl, cs:[bx+K]` and `mov bh, cs:[bx+K]`) rather than by
fixed offset:

```
length table (16)  [3, 0, 2, 10, 4, 5, 0, 0, 0, 0, 0, 0, 6, 7, 8, 9]
offset-high  (32)  [1, 2, 0, 0, 3, 4, 5, 6, 0, …, 7, 8, 9, 10, 11, 12, 13, …]
```

| token | encoding |
| --- | --- |
| literal | control bit 0 → next input byte **XOR the live bit count (`DL`)** |
| match | control bit 1 → 2 bits; if non-zero read a 3rd; if ≥ 6 read a 4th → index the length table |
| length escape | table value 10 → read a byte, `length = 10 + byte`; a byte of `0xFF` **terminates the stream** |
| distance | 1 bit; if set the high byte is 0, else 3 more bits index the offset table, widening to 5 and 6 bits for larger distances (final form `(bits & 0xDF) << 8`); the low byte is a raw input byte |
| copy | byte-at-a-time from `dest − distance`, so overlapping matches generate runs |

**The literal XOR is the interesting part.** Literals are obfuscated with the
*current bit-buffer counter* — a value that exists only inside the decoder's
own state machine. A decoder that does not model the counter cycle exactly
produces garbage literals while matches still look fine. This is deliberate
anti-tamper, and it is the reason PKLITE is meaningfully harder than LZEXE
rather than just differently shaped.

### 1.3 Verification

There is no third-party PKLITE reference in this sandbox, so the check is
internal consistency plus content:

- **Uniqueness.** Over every paragraph-aligned candidate start offset in
  `0x100..0x400`, **exactly one** (`0x200`) decodes to a clean end-of-stream
  marker. `find_data_start` treats more than one hit as an error rather than
  picking a winner.
- **Shape.** The output begins `BA 20 04 / 2E 89 16 BE 02 / B4 30 / CD 21` —
  `mov dx,0420h; mov cs:[02BEh],dx; mov ah,30h; int 21h`, the same DOS
  version-check startup the LZEXE-unpacked ATR.EXE opens with.
- **Content.** Strings present *only* after unpacking, and absent from the
  packed file (verified by grep, zero hits):
  `Borland C++ - Copyright 1991 Borland Intl.`,
  `Atmel AVR Disassembler v1.21`, `avr%04X:  %s`.
- **Decompiles.** The output is accepted by `tools/decompile_boot.mjs` as
  real-mode code.

```
Disavr3.exe (12 744 B) → 19 914 B   sha256 0a3e081fa757b6d7…
  stub decryption : 216 words, image 0x48..0x1F7, key 0x0317
  tables          : image 0x1CF (length), 0x1DF (offset)
  token stream    : image 0x200 .. 0x315A
  tokens          : 6 490 literals, 2 617 matches (24 runs), 223 escapes
```

### 1.4 What is still deferred

**PKLITE v1.20 is not implemented.** `DN3DSW13.SHR` (Duke Nukem 3D's 5.8 MB
payload) is v1.20, and its stub has a different layout — the relocating
`rep movsw` that v1.15 uses to move its decompressor is absent, so table
location fails. The tool **says so and exits non-zero** instead of emitting
garbage, and `pklite.py stub` still writes the decrypted stub so the work can
be continued. Also not implemented: the non-"extra" compression mode, and
PKLITE's relocation-table rebuild (the unpacker emits the load module, not a
runnable EXE).

## 2. The X-COM demo disk

`samples/archive/games/xcom-tftd-demo.ima` — the PC Gamer cover-mounted demo
of *X-COM: Terror From The Deep* (MicroProse/Mythos, 1995). Unlike everything
else in the corpus this is a **raw 1.44 MB floppy image**, not an archive:
1 474 560 = 80 cyl × 2 heads × 18 sectors × 512.

Parsing it exercises the FAT12 path rather than the MZ path:

```
OEM='IBM  3.3'  bps=512 spc=1 rsv=1 nfat=2 nroot=224 tot=2880
media=0xF0 spf=9 spt=18 heads=2   boot signature AA55
root dir @ 0x2600, data @ 0x4200

INSTALL.BAT      1 977
DISKSIZE.EXE    10 685
PKUNZIP.EXE     28 806
README.TXT       1 547
TFTD.ZIP     1 128 810
```

The demo is a ZIP plus PKUNZIP — the same PKWARE tooling as §1, shipped as a
self-installing floppy. Inside, the game is the now-familiar shape:
`TFTDEXE/TACTICAL.EXE` is a **DOS/4GW LE** image (LE header at `0x2998`,
Watcom C/C++32, `Copyright 1995 Microprose`), with `DOS4GW.EXE` 254 556 bytes
alongside and a set of real-mode `.COM` sound drivers
(`MUSIC.COM`, `SOUNDRV.COM`, `VECTOR.COM`).

No easter eggs were found. The string scan across `TACTICAL.EXE` for the usual
markers (hidden credits, developer names, debug/cheat text) turned up only the
Watcom runtime banners and the MicroProse copyright. **Reporting that as a
null result rather than manufacturing a find**: the 32-bit LE body is not
decompilable with the current real-mode-only toolchain (§5 of
`docs/dos-game-disassembly.md`), so this is a "not found with these tools",
not a "not there".

## 3. Indiana Jones and the Fate of Atlantis — the demo leaks the whole game

`samples/archive/games/PLAYFATE.zip` — the official LucasArts playable demo
(SCUMM v5, dated 1 Sept 1994). This is the Barnett College game: Fate of
Atlantis opens in Indy's office at Barnett.

### 3.1 The XOR

SCUMM v5 ships an index (`.000`) and a data file (`.001`), both whole-file
XORed with one constant byte — `0x69` here. `tools/scumm.py` **recovers the
key from the data** rather than hard-coding it: every candidate root tag
(`LECF`, `RNAM`, `LOFF`, `MAXS`) yields a candidate key, and a key is accepted
only if all four bytes agree.

After the XOR both files are IFF-ish — 4-byte ASCII tag, then a **big-endian**
u32 size that includes the 8-byte header:

```
.001   LECF                  outer wrapper
         LOFF                room number -> file offset directory
         LFLF …              one per room actually present
           ROOM, RMHD, …
.000   RNAM                  room number -> 9-char name table
       MAXS, DROO, DSCR, …
```

There is a **second, different XOR** on the room-name characters: `0xFF`.
A naive single-XOR dump shows correct structure with garbled names, which is
exactly the sort of half-right result that invites a wrong conclusion.

### 3.2 The finding

The demo ships **10 rooms**. Its index file carries the room-name table for
the **entire retail game — 97 entries**, including the Barnett College suite
and the ending:

```
  1 ;col-offi     Indy's office, Barnett College
  2 ;col-hall     3 ;col-base    4 ;col-atti
  5 ;col-stor     6 ;col-arch    7 ;col-catr
 …
 89 ;end-volc    90 ;end-v2     96 ;endscene
```

Names of rooms stripped from the demo build keep a leading `;`. That is a
hypothesis, and `scumm.py verify` checks it rather than asserting it: the set
of rooms in the `LOFF` directory must equal the set of names *without* the
`;`. It matches exactly, 10 for 10, and the `LFLF` block count agrees:

```
room-name table : 96 entries
LOFF directory  : 10 rooms
LFLF blocks     : 10
rooms present   : [42, 48, 49, 63, 68, 69, 75, 82, 83, 98]
names w/o ';'   : [42, 48, 49, 63, 68, 69, 75, 82, 83, 98]
PASS — 10 shipped, 86 listed but absent
```

The shipped ten are `sal-surfa`, `a1-darkro`, `th-dock`, `th-landsc`, `logo`,
`th-dig-ex`, `map-world`, `sal-under`, `cu-plato`, and the `icons` room.

So LucasArts built the demo by **commenting rooms out of the build list** and
shipping the list anyway. The `;` is a source-level comment marker that
survived into a retail artifact — the closest thing to an easter egg in this
corpus, and an accidental one: a complete table of contents for a game the
demo does not contain.

## 4. Status

| target | result |
| --- | --- |
| OpenJDK | **working** (relay reassembly, hash verified); no Ghidra distribution yet |
| PKLITE v1.15 | **decoded** — deferral closed, verified by content and uniqueness |
| PKLITE v1.20 | stub decrypts; decompressor layout differs — **explicit failure**, not faked |
| X-COM TFTD demo | FAT12 disk parsed, contents triaged; **no easter eggs found** (null result) |
| Fate of Atlantis demo | XOR broken, container walked, **97-room table recovered and the `;` rule verified** |
| LZEXE 0.91 | corpus grew from 1 sample to **13** (see `docs/dos-game-disassembly.md`) |
