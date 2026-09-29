# DOS Virus Encyclopedia — Ghidra real-mode deep dive

Corpus: `samples/archive/virushistory/` (7 samples from the public
[SnorreFagerland/virushistory](https://github.com/SnorreFagerland/virushistory)
collection, 66,043 samples). Toolchain: `tools/decompile_boot.mjs` and
`tools/decompile_mz.mjs` drive the Ghidra bridge with a flat 16-bit real-mode
x86 mapping (1 MiB image padded with `IRET` so every address is mapped and
analysis stops at the first `iret` instead of running off the end), plus
`tools/exe_triage.py` for MZ/PE structure. Kitchen ops `virusSigScan` and
`dosBootSector` (in `public/apps/cyberchef/`) expose the verified signatures.

**These samples are real malware. They are archived for static analysis only —
never execute them, and never mount the boot sectors on real media.**

## Samples (sha256 prefix · size · note)

| file | sha256 (first 16) | bytes | what it is |
|---|---|---|---|
| `stoned-standard.boo` | `da680c8f9edeec4e` | 512 | Stoned boot-sector infector |
| `michelangelo.boo` | `00255ba82f053206` | 512 | Michelangelo (Stoned clone) boot sector |
| `cascade1701a.vom` | `004e8e4bbd3e814f` | 1801 | Cascade 1701 on a 100-byte goat |
| `cascade1701b.vom` | `53e736180e0f7ccb` | 1774 | Cascade 1701 on a 73-byte goat |
| `jerusalem664.vom` | `72ed6c7f5d52b60f` | 764 | Jerusalem on a goat |
| `whale.vom` | `c6ee5863bb9a6835` | 9218 | Whale COM infector |
| `whale.vxe` | `4f5aeab55eba29ef` | 9802 | Whale on a goat EXE |

`.boo` = raw boot sector, `.vom` = COM-mounted, `.vxe` = EXE-mounted
(the virushistory corpus conventions).

## Stoned (standard)

Entry `EA 05 00 00 7C` — a far JMP at offset 0, which a genuine DOS boot
sector never has (real ones start with a near `E9`/`EB` jump so the BIOS
Parameter Block can sit at 0x0B). js/x86dis.js renders it
`jmp far 0x7c00:0x5`; execution continues at the code at offset +5.

Decompiled (all addresses org 0x7C00):

- **0x7C05 — go resident.** Saves the INT 13h vector
  (`xRam0000004c` → `[0x7C0A]`), steals 2 KiB of top-of-memory
  (`iRam00000413 += -2`, the classic BIOS word at 0x40:0x13), computes the
  new segment (`iRam00000413 * 0x40`), installs the hook by writing offset
  `0x15` into the INT 13h vector, copies `0x1B8` bytes of itself up there,
  saves its CS at `0x7BFE`, and `jmp far [0x7C03]`.
- **0x7C15 — INT 13h hook.** Passes through unless `AH ∈ {2,3}` (read/write
  sectors), `DL == 0` (floppy A:) and the motor flag at `0x43F` is clear —
  then calls the infection routine `func_0x00007c3a` and chains to the
  original handler via the saved vector.
- Strings at file offset `0x18A`: `Your PC is now Stoned!` (with BEL CR LF)
  and `0x1A5`: `LEGALISE MARIJUANA!` — the one-in-eight "beep" messages.

## Michelangelo (Stoned clone, March 6 payload)

Entry `E9 AC 00` (a *normal-looking* near jump — this sector does not look
structurally viral the way Stoned does, so a clean BPB is not proof of health).
Eight `INT 13h` sites in 512 bytes.

- **0x7CAF — go resident.** Same 2 KiB steal as Stoned, but the hook offset
  is `0xE` and the copy length is `0x1BE` bytes; `jmp far [0x7C03]`.
- **0x7D3F — activation.** `INT 1Ah` (get date); `if (DX != 0x0306) return;`
  — March 6. Otherwise an endless `INT 13h` write loop over the first
  sectors of every head (`*(xunknown1*)0x7 = 4` heads) — the disk-killer.
- **0x7C0E — INT 13h hook.** `AH ∈ {2,3}` on drive A: with the motor flag
  clear; rebuilds FLAGS and calls the original handler through the saved
  vector, then `func_0x00007c36`.
- **0x7C36 — infection.** Four read attempts, signature compare of the first
  word against the virus marker, media byte `[BX+0x15]` vs `0xFD` (360 KiB
  floppy → sector 3, else sector 0xE), partition table copy
  `0x3BE → 0x1BE` (0x21 words — the signature/label area preserved).

## Cascade 1701 — the first widespread encrypted file infector

The decryptor (disassembly, cascade1701a.vom, org 0x100):

```asm
1168  e8 00 00        call 0x16b        ; push runtime address…
116b  5b              pop  bx           ; …bx = where this code lives
116c  81 eb 31 01     sub  bx, 0x131    ; virus base (flag at [bx+0x12a])
1170  test [bx+0x12a], 1                ; "encrypted" flag
1176  je   0x187                        ; already plain → run
1178  lea  si, [bx+0x14d]               ; si = encrypted body (0x187 here)
117c  mov  sp, 0x682                    ; sp = body length in bytes
117f  xor  [si], si                      ; ← XOR word with its own address
1181  xor  [si], sp                      ; ← XOR word with the counter
1183  inc  si                            ; byte stride → overlapping words
1184  dec  sp
1185  jne  0x17f                         ; until the counter hits 0
```

The cipher, verified by decrypting **both** archived copies offline
(Python re-implementation): each *overlapping* 16-bit word at `si` is XORed
with `si` and with a counter that descends from the body length
(`0x682` = 1666 = 1701 − 35). The two samples sit on goats of different
sizes (100 vs 73 bytes), so their decryptor constants differ — and both
decrypt to **identical code**, offset by exactly 27 bytes, which is the
goat-size delta. That cross-check is what pins the algorithm.

Decompiled body highlights (0x187 entry):

- opens with `mov sp, bp` — restoring the stack pointer the decryptor
  trashed when it used SP as the key register (a nice confirmation the
  decryption is right);
- install check reads the words `0x4f43 0x5250 0x202e 0x4249 0x004d` at
  `0xE008` — the ASCII string **`COPR. IBM`**, Cascade's resident-copy
  marker disguised as a copyright string;
- a `for (i = 0x6a5; i; i--)` self-copy loop — `0x6A5` = 1701, the virus
  length;
- sets up its private **INT 7Ch** service interrupt.

Kitchen op `virusSigScan` carries the two Cascade decryptor signatures
(`e800005b81eb` and `31343124464c75f8`).

## Jerusalem (664-byte variant)

Entry:

```asm
mov  ah, 0xF1
int  21h            ; F1h = "are you resident?"
cmp  ah, 0xF1       ; resident copy answers by trashing AH
je   already_there
cmp  ah, 0xA1       ; second marker
jne  install
```

If already resident, the sample asks the resident copy (service `AH=C1h`) to
rewrite the original host back over `PSP:0100` and jumps to it — the
self-restoring launcher. Otherwise: four PSP pointers saved, `sp = 0x600`,
`INT 21h AH=4Ah` memory shrink (TSR), `INT 21h AH=35h` captures the real
INT 21h vector into `[0x189]` before hooking.

## Whale — honest triage, not a decrypt

`whale.vxe` is a deliberately malformed MZ: entry `CS:IP = 0005:0001`
(lands at load-module offset 0x51), stack `SS:SP = 0005:FFFE`, stored
checksum `0x3111` vs computed `0x04A0` (mismatch), `e_lfanew` garbage.
Historically Whale carries nine layers of encryption/obfuscation; this
round documents the armor only. **Whale's layers are not stripped here** —
flagged as future work rather than faked.

## Hiren's BootCD triage (BurnCDCC / HBCDCustomizer)

From `aash-gates/Hirens.BootCD.15.2` (the 15.2 ISO itself is a 623,890,432-byte
base64 blob — too large to archive, so only the two small tools were pulled;
metadata-only records exist for Hiren 10.0 ISO sha1 `3c19dc32…` and the 15.2
zip at 592.5 MB):

- **BurnCDCC.exe** — 82,944 B, PE32 i386, subsystem GUI, 3 sections,
  `e_lfanew = 0xF0`, embedded BMP at `0x82F8`; a small DOS stub.
- **HBCDCustomizer.exe** — 75,776 B, PE32 i386 GUI, `e_lfanew = 0xB8`.

`tools/exe_triage.py` now decodes the full MZ header (with DOS word-sum
checksum verification) and follows `e_lfanew` to identify PE/NE images, so
these land in the right analysis path automatically.

## Ken Kirkpatrick's First Name Almanac v1.02 (DOS, 1994)

Fetched through the repo's archive proxy from
`archive.org/download/FNA102B_ZIP/FNA102B.ZIP` (DEMU/vintagesoftware
mirror); md5 `b3ff7ffc102605dfe87086f6850ba70e` and sha1
`cf98dc2588e42dbc2a693cd7f2f2f3ddd40b2126` both match the archive.org
metadata. Contents: `INSTALL.COM` (3,988 B), `NAMES.OVL` (275,799 B),
`MEANINGS.OVL` (275,968 B), `FILE_ID.DIZ`, `SYSOP.DOC`.

- **INSTALL.COM is an MZ EXE renamed .COM**: 8 pages, no relocations,
  32-byte header, entry `CS:IP = 00D3:0010`. Ghidra (`decompile_mz.mjs`)
  shows the entry overwriting the INT 1 vector (0000:0004) with
  `PSP+0x10` — an anti-trace tripwire — followed by a descending
  self-copy loop seeded from the INT 3 vector word.
- **Not one printable string** in INSTALL.COM — the program is
  self-decrypting at runtime.
- **MEANINGS.OVL is itself an MZ EXE** (14,858-byte image, entry
  `0388:000E`) with a ~261 KB encrypted overlay; **NAMES.OVL** is an
  encrypted database (no plaintext names, header `10 06 10 3a …`).
  The 14,000-name database and meanings are the product's asset, and they
  are locked — consistent with a $49.95 ASP shareware registration
  (SYSOP.DOC, initial release December 1993, Kenneth G. Kirkpatrick,
  Taft, CA).

The Tucows mirror hunt closed negative: `archive.org`'s Tucows collection
has no Kirkpatrick entry (q=kirkpatrick+collection:tucows → 0 results);
DEMU/vintagesoftware is the surviving mirror, reached via the proxy.

## Kitchen ops added

- **`virusSigScan`** (Virus Analysis) — scans hex input for the signatures
  above (Stoned entry + both strings, Michelangelo entry, both Cascade
  decryptor fragments, Jerusalem F1h/A1h checks), reports INT 13h/21h site
  density and the 55 AA sector signature. Verified against all four
  archived samples in `test/virus-encyclopedia-recipes.test.ts`.
- **`dosBootSector`** (Virus Analysis) — parses entry jump, OEM name, full
  BPB with media descriptor, 55 AA, and the partition table; flags the
  boot-virus tells (far JMP at offset 0, near JMP over a non-BPB block,
  impossible BPB geometry). Verified against both archived boot sectors, a
  synthetic healthy 1.44 M floppy, and a synthetic MBR.

## Not covered / honest deferrals

- Whale's nine layers: not stripped.
- openrce.iso / rce.iso / Fravia reverse-lore ISOs: not fetched (the
  186–623 MB images exceed the archive commit limits; metadata only).
- ~~Norton Ghost processor-lock and IDA/Immunity debugger sections: not
  completed this round.~~ **Done** — `docs/norton-ghost-deep-dive.md`
  (2026-09-29): the .GHO/.GHS container, the Fast LZ (Z1) codec, a
  cryptanalysis of the password cipher showing 2^16 key recovery
  regardless of passphrase, the PSN→PPIN processor-locking arc, and the
  debugger/lore section. Executable companion `tools/ghostimg.py`
  (`info` / `analyse` / `selftest`). Its own remaining gaps are listed
  in §7 of that page — chiefly that no real `.gho` was available, and
  that the encryption reconstruction is single-sourced and contested.
