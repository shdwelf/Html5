# UEFI with OpenBIOS, and what JavacParser is actually used for

Two requests, one document: the firmware side (boot requirements with UEFI and
OpenBIOS in the picture) and the compiler side (OpenJDK's `JavacParser.java`
as the grammar reference for the generated JavaCard applets).

## 1. OpenBIOS — the facts

https://github.com/openbios/openbios — "First published Open Source
implementation of OpenFirmware". GPL-2.0, 450 stars, 2.8 MB, actively pushed
(2026-07-04 at visit time). OpenBIOS implements IEEE 1275: a Forth machine
with a device tree, `boot` reading a driver from the selected device — the
lineage behind SPARC/OpenPOWER booting and QEMU's `-bios openbios-*` images,
distinct from the UEFI PI/EDK2 lineage (PE32+ boot applications on a FAT ESP).

## 2. Where UEFI and OpenBIOS meet this project's checker

`tools/bootchain.py` already parses both disk lineages for real:

| requirement | lineage | check id |
| --- | --- | --- |
| MBR signature + fdisk table, active flag, no overlaps | legacy/fdisk | `mbr_signature legacy_active mbr_no_overlap` |
| GPT header + entry-array CRCs, backup header | UEFI | `gpt_header_crc gpt_entries_crc gpt_backup_header` |
| ESP is a real FAT volume | UEFI | `esp_fat_type` |
| boot application is PE32+ | UEFI | (PE parse in `check_disk`) |
| first-stage bootstrap identifiable | legacy/CSM | `legacy_loader_id` |
| expected second stage present | legacy/CSM | `legacy_loader` (grub/lilo/syslinux/ntldr/…) |

Added for this order: an **`openbios` loader marker**. OpenBIOS
bootblocks sign themselves with the `OpenBIOS` string, so `--loader openbios`
now identifies them the same way GRUB/LILO are identified, with two new
selftest cases (`OpenBIOS bootblock identified` passes,
`OpenBIOS when GRUB is expected` fails). `python3 tools/bootchain.py
--selftest` is green.

What this does *not* claim: the checker identifies an OpenBIOS bootblock, it
does not execute Forth or walk a device tree. Booting OpenBIOS/EDK2 under
QEMU on the Actions runner stays a proposed follow-up (the dismissed
questions never confirmed it), and the Verilog measurement chain is untouched
— the vchip status-word layout is parsed out of the RTL, and no firmware
finding in this window changes it.

## 3. JavacParser.java — the facts

`src/jdk.compiler/share/classes/com/sun/tools/javac/parser/JavacParser.java`
at OpenJDK `master`: 5,697 lines, 225,312 bytes (blob
`19daed61aa75425e691b658dbe26a81947419f39`), retrieved in full through the
GitHub API and read — method names below are line-cited from that file:

| rule | method | line |
| --- | --- | --- |
| compilation unit | `parseCompilationUnit()` | 4040 |
| class | `classDeclaration(mods, dc)` | 4404 |
| interface / enum | `interfaceDeclaration` / `enumDeclaration` | 4381/4383 |
| field | `variableDeclaratorRest(…)` | 3815 |
| statement | `parseStatement()` → `parseStatementAsBlock()` | 3233/2882 |
| block | `block()` | 2842 |
| expression / type | `parseExpression()` / `parseType()` | 973/1054 |

## 4. What JavacParser is used for here (and what it is not)

The generated card programs (`samples/javacard/*.java`) are deliberately
confined to the grammar subset above: one compilation unit = one `package`
clause + `javacard.*` imports + one public `ClassDeclaration` holding field
declarations and method declarations whose bodies are blocks of expression
statements, `if`s, `switch`es and `return`s. No generics, no enums, no
annotations, no lambdas, no `String` — the subset test in
`tests/14-javacard.mjs` enforces the JavaCard 2.2.2 side of that (banned
tokens, brace balance, one applet class, real API constants only).

Honest boundary: the sandbox has no `java` on PATH, so no `javac` parse was
run here — conformance is structural, by construction plus test 14, not by
invoking the parser. The file is **not** vendored (OpenJDK is GPL-2.0 with
the Classpath exception; method names and line numbers are cited, not
copied). The natural next step, if the Ghidra-headless question is ever
answered "yes", is an Actions job that fetches the JDK (the channel is
proven: `.relay/jdk/` exists) and runs `javac -proc:none -d /tmp` over
`samples/javacard/` as a parse gate — proposed, not claimed.
