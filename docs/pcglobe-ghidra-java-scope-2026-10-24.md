# PC Globe → Ghidra → Java experiment — scope & provenance (2026-10-24)

**Stream:** S4 (subsurface viewers), the "Ghidra PC Globe→Java experiment" that
follows the country viewer in the backlog sequence. Status: **scoped; fetch and
static-analysis stages implemented as workflows; Java stage defined below.**

## The subject

*PC Globe* (PC Globe, Inc.; Broderbund distribution) is a DOS world-atlas
program — first released 1987 (Comwell Systems), with the 1990 edition offering
"information on 177 countries and dependencies," per-country maps and
statistics, and PC-speaker national anthems. It is the commercial archetype of
the PC-Globe idiom our country viewer (`country-viewer.html`, rounds 41–42)
imitates with modern CIA Factbook data. The experiment closes the loop:
statically analyze the original program (Ghidra), then re-implement its
country-database reader in Java against the original data files.

## Lawful source & pinning

- Item: Internet Archive **`PC_Globe_for_DOS`** ("PC Globe for DOS", PC Globe,
  Inc., 1990; added 2016-10-21), 36 files / 1,630,229 bytes, including the
  loose installed program — no installer automation needed.
- `.arena-pcglobe/files.txt` pins the 32 original files by name. The fetch
  workflow (`.github/workflows/arena-pcglobe-fetch.yml`, the
  `arena-headline-harry` precedent — the sandbox cannot reach archive.org, the
  runner can) downloads each file from
  `https://archive.org/download/PC_Globe_for_DOS/<name>` and **verifies it
  against the MD5 and size the Archive itself publishes** in
  `https://archive.org/metadata/PC_Globe_for_DOS`, then commits the media and
  a SHA-256 manifest to `.xfer/pcglobe/`. The Ghidra workflow re-verifies
  `sha256sum -c SHA256SUMS` before analysis.
- Key files (metadata sizes/MD5s): `PCGLOBE.EXE` 155,697 B (main program,
  16-bit DOS MZ); `COUNTRY1.DAT` 351,426 B and `COUNTRY2.DAT` 346,809 B
  (country records — the Java target); `DATABASE.DAT` 314,718 B; `NAMES.DAT`
  42,075 B; `WORLD.VEC` 80,318 B (vector world map), `FEATURES.VEC`, video
  drivers `PCGCGA/PCGCGA6/PCGEGA/PCGVGA/PCGHERC2.COM`, plus help/menu/text
  data. The in-repo `archives/source/convert-pcglobe-to-html5 (1).zip` is an
  unrelated Next.js app scaffold (a prior conversion *attempt's* shell, no
  original program or data) and is not an input to this experiment.
- Analysis is **pure static analysis** (disassembly/decompilation and string
  probes); the program is never executed or emulated — the repo's standing
  rule for recovered binaries (Headline Harry, Dr. Solomon precedents).

## Stages

1. **Fetch** (`arena-pcglobe-fetch.yml`, trigger `.arena-pcglobe/fetch.txt`) —
   media + verified manifest into `.xfer/pcglobe/`. 
2. **Analyze** (`arena-pcglobe-ghidra.yml`, trigger `.arena-pcglobe/ghidra.txt`) —
   pinned Ghidra 12.1.4 (release SHA-256 checked, as in
   `arena-headline-harry-ghidra.yml`) disassembles `PCGLOBE.EXE` via
   `tools/ghidra_scripts/EncyclopediaReport.java`; static printable-string
   probes of `COUNTRY1/2.DAT`, `DATABASE.DAT`, `NAMES.DAT`, `MENU.DAT`,
   `TEXTMENU.DAT`, `HELP.DAT` give the data-layout head-start. Reports land in
   `research/pcglobe-ghidra/` (+ `ANALYSIS.md`).
3. **Java port (defined, next round)** — a small, dependency-free Java program
   (the repo's Java idiom: javac-only, like the JCreator strand) that opens
   `.xfer/pcglobe/COUNTRY1.DAT`/`COUNTRY2.DAT`/`DATABASE.DAT`, walks the
   record structure the Ghidra stage identifies (record headers, indexes in
   `NAMES.DAT`/`DATABASE.DAT`), and dumps country records as text/JSON.
   Acceptance for that stage: the Java dump must reproduce, for a named
   sample of countries, the same country names and headline statistics that
   the string probes show in the raw files — a two-source check (binary
   layout vs. file content), reported with any fields left undecoded rather
   than guessed.

## Risks & open questions

- 16-bit segmented MZ in modern Ghidra: function recovery on 1990 code is
  partial by nature; the experiment treats decompiler output as leads, not
  ground truth, and cross-checks against the `.DAT` bytes.
- The database may be packed or lightly obfuscated (period practice); if the
  string probes show compressed records, stage 3 starts from the unpacking
  routine the disassembly identifies.
- Which of `COUNTRY1/2.DAT` vs `DATABASE.DAT` holds which record family is an
  empirical question the probes answer first.

## What this is not

No emulation, no execution, no installer automation, and no redistribution
stance: media sits under `.xfer/` for analysis, exactly like the Headline
Harry recovery, and this doc + the workflows are the audit trail.
