# Evolution OS — Ghidra disassembly, assembled with BBS / wiki / fax modem

Generated: 2026-10-28T11:44:27.237Z by `tools/evolution-os/evolution-os.mjs`.

**Status: 1 Ghidra report(s) assembled.** Static analysis only — no input was executed.

## Targets — the language is pinned per part number

| Target | Part | CPU | OS | Ghidra language | Firmware artefacts |
| --- | --- | --- | --- | --- | --- |
| xPort Pro (Evolution OS) | `XPP1002000-02R / XPP100200S-02R` | DSTni-FX — Freescale 32-bit ColdFire | Evolution OS 5.4.0.2R2 | `68000:BE:32:Coldfire` | xport_pro_*.rom / .romz firmware · web content (≤1 MB) · XML configuration records |
| MatchPort AR (Evolution OS option) | `MPB/MPDK1000 — Evolution OS variant` | DSTni-FX — 32-bit ColdFire, 166 MHz | Evolution OS (dual-OS part; Linux option uses the µClinux SDK instead) | `68000:BE:32:Coldfire` | matchport_*.rom / .romz firmware |
| EDS1100 / EDS2100 (Evolution OS option) | `EDS1100 / EDS2100 Evolution OS variant` | ColdFire-class (same SDK family as MatchPort AR / xPort Pro) | Evolution OS 7.1.0.0R1 | `68000:BE:32:Coldfire` | eds*.rom / .romz firmware |
| xPort (classic) | `XP100100-01` | DSTni-EX "186" — x86-class 16-bit | Evolution OS | `x86:LE:16:Real Mode` | xport_*.rom firmware · built-in web pages |
| xPico | `XPC100100B-01` | DSTni-EX Enhanced 16-bit x86 | Evolution OS | `x86:LE:16:Real Mode` | xpico_*.rom firmware · 384 KB web-page storage |
| xPort-485 | `XP100485-01` | DSTni-EX "186" | Evolution OS | `x86:LE:16:Real Mode` | xport485_*.rom firmware |

The trap the Lantronix Lab matrix exists to prevent: the xPort Pro and the classic xPort share
an RJ45 footprint and an 8-pin header, but one is ColdFire and the other is 16-bit x86. An
Evolution OS image loaded under the wrong language disassembles into confident garbage.
Also recorded there, and binding here: **do not flash a Linux image onto an Evolution OS part
number or vice versa** — the SDK and PCN both warn that mixing images bricks the unit. This
pipeline only reads images; it never writes one to a device.

## Pipeline

1. **Stage the image.** A firmware URL becomes a local file through `tools/urln/ln` (curl
   download into a cache, then a symlink), or the runner downloads it directly. Record the
   SHA-256 before analysis; the report carries Ghidra's own hash of the same bytes.
2. **Triage before Ghidra.** `lantronix-lab.html` (GHIDRA MATCH tab) names the container:
   inflate gzip, strip a uImage header, read an ELF `e_machine`, or find the vector table in a
   raw image. An `Evolution` string settles the OS question — it is not Linux, so there is no
   kernel banner, no `/proc`, and no ELF userland to expect.
3. **Disassemble on the runner.** Pinned Ghidra 12.1.4 (SHA-256 gated,
   `ddac49f903da9d5b…`), JDK 21, `GenericProgramReport.java`:

```sh
analyzeHeadless "$RUNNER_TEMP/ghidra-projects" EVO_XPORT_PRO_EVOLUTION \
  -import <staged-image> \
  -processor 68000:BE:32:Coldfire \
  -scriptPath tools/ghidra_scripts \
  -postScript GenericProgramReport.java <reports-dir> \
  -deleteProject
```

   For a raw `.rom`, set the loader and base address from the triage result first; a `.romz`
   must be inflated before import. The 16-bit x86 targets use the same command with
   `-processor x86:LE:16:Real Mode`.
4. **Assemble.** `node tools/evolution-os/evolution-os.mjs --reports docs/ghidra/evolution-os`
   rewrites this record from the runner's `*.ghidra.json` reports, and
   `node scripts/build-wikiinajar-xdc.mjs` carries it into Wiki in a Jar.

## Reports

| Program | Format | Language | SHA-256 | Functions | Instructions | Strings | Imports | Decompiled |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| payload.bin | Raw Binary | `68000:BE:32:Coldfire` | `6e67282af187acd8…` | 4102 | 200000 | 4446 | 0 | 48/48 |

## Firmware candidates (GitHub + archive.org search, 2026-10-28)

GitHub has no Evolution OS firmware or SDK mirror — code search returns this repo, the
Lantronix org publishes newer-product code, and the one XPort Pro toolset found
(morkai/walkner-tools) targets the *Linux* SDK. archive.org's firmwarelibrary collection
mirrors the official Lantronix FTP as one ZIP per release. Record:
`docs/evolution-os-software-search-2026-10-28.md`.

| Target | Version | Source | ZIP SHA-1 | Payload (.romz, vendor MD5) | Status |
| --- | --- | --- | --- | --- | --- |
| xport-pro-evolution | 6.0.0.1R2 | archive.org `Lantronix_XPort-Pro_6.0.0.1R2_136c8` | `9fac545077eb1a95…` | xport_pro_6_0_0_1_R2.romz (623002 B, MD5 `7c996f6e…`) | staged-candidate — unzip, inflate .romz, then Ghidra |
| xport-pro-evolution | 7.0.0.0R2 | archive.org `Lantronix_XPort-Pro_7.0.0.0R2_7769a` | `b6f25081807f1957…` | xport_pro_7_0_0_0_R2.romz (623434 B, MD5 `c0e1fbdc…`) | staged-candidate — unzip, inflate .romz, then Ghidra |
| xport-pro-evolution | 5.5.0.2R5 / 6.0.0.0R5 / 6.0.0.3R1 | archive.org `Lantronix_XPort-Pro_6.0.0.0R5_51e0f` | `—` | — | catalogued — same .romz caveat |
| matchport-ar-evolution | 6.0.0.1R2 | archive.org `Lantronix_matchport-ar_6.0.0.1R2_7737b` | `—` | — | catalogued — same .romz caveat |
| eds-evolution | 6.0.0.0R1 | archive.org `Lantronix_eds1100_2100_6.0.0.0R1_ca0f3` | `—` | — | catalogued — same .romz caveat |

Each ZIP wraps a compressed `.romz` payload (plus release notes and `md5sum.txt` on the FTP),
so the remaining step before a real disassembly is `.romz` inflation — Ghidra must see the
ColdFire payload, not the compressed container. Stage with:

```sh
tools/urln/ln -s https://archive.org/download/Lantronix_XPort-Pro_6.0.0.1R2_136c8/136c8005c1aacd8734ed0f621ec73383.zip ./xport-pro-6.0.0.1R2.zip
```

## Container probe (.romz)

`xport_pro_6_0_0_1_R2.romz` — 623002 bytes, SHA-256 `59b73b3659e9bf12…`, magic `1f 8b 08 08 c8 7e c0 60 00 03 78 70 6f 72 74 5f` (probe: `tools/evolution-os/romz_probe.py`).

| Method | Offset | Result | Output bytes |
| --- | ---: | --- | ---: |
| gzip | 0 | inflated, plausible | 1725386 |
| zlib | 0 | failed | 0 |
| raw-deflate | 0 | failed | 0 |
| bzip2 | 0 | failed | 0 |
| lzma-xz | 0 | failed | 0 |
| zlib@7076 | 7076 | failed | 0 |

**Inflated:** `gzip` → 1725386 bytes, SHA-256 `6e67282af187acd8…`, keyword hits {"evolution":6,"lantronix":8,"xport":112,"coldfire":1,"copyright":1,"http":304,"ssh":435,"telnet":132,"snmp":102,"firmware":40}. This payload — not the container — is what Ghidra analysed.

## Assembled with

| Module | Artefact | Role in this assembly |
| --- | --- | --- |
| Lantronix Lab — firmware triage (GHIDRA MATCH) | `lantronix-lab.html` | Names the container, the CPU and the Ghidra language before Ghidra runs; an "Evolution" string means not-Linux, so there is no kernel banner to match. |
| Ghidra reporter (static only) | `tools/ghidra_scripts/GenericProgramReport.java` | Writes <program>.ghidra.json + .asm + .c + .strings.txt from the program database. Never executes, emulates or patches the input. |
| urln/ln — stage a URL as a local file | `tools/urln/ln` | A URL symlink target is downloaded with curl (nc fallback for plain HTTP) into a cache and linked locally, so a firmware URL becomes the local image Ghidra imports. |
| BBS viewer + netcat capture | `public/apps/bbs-viewer/index.html` | Renders a captured ANSI byte stream. Capture path: `nc -q1 <host> 23 > capture.ans`; local source: `node tools/bbs/wildcat-banner.mjs --serve 6420`. |
| Wiki in a Jar | `wikiinajar.html` | This assembly is a docs/*.md record, so rebuilding the wiki (`node scripts/build-wikiinajar-xdc.mjs`) carries it into the offline wiki like every other research record. |
| xPort Pro → Nucleo-64 → V.92 fax modem (HP EIO card) | `docs/xport-nucleo-v92-eio-fax-card.md` | The hardware the firmware serves: PSTN → RJ11 → V.92 modem → Nucleo-64 USART1 (PA9/PA10) → USART2 (PA2/PA3) → xPort Pro DIN/DOUT → RJ45 telnet BBS. |

Why these belong in one record: the fax-modem card's whole purpose is to put an xPort Pro on
Ethernet as a telnet BBS front end. The Evolution OS firmware is what answers that telnet
session, so its disassembly, the BBS capture that exercises it, the wiki that archives the
record, and the board that carries the modem are four views of the same system.
