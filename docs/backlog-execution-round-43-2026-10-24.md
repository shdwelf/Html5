# Backlog execution — round 43 (2026-10-24)

**Stream:** S4 — Ghidra PC Globe→Java experiment, stages 1–2 (fetch + static analysis).
**Branch:** `arena/876f9abb-html5` (from `main` at `7ff777c`, the PR #150 merge;
PR #148 closed as superseded).
**Result:** the 1990 PC Globe media is fetched, hash-verified, and statically
analyzed; the Java port stage is defined against concrete file-layout evidence.

## Provenance chain (all auditable in-repo)

1. **Fetch** — `.github/workflows/arena-pcglobe-fetch.yml` downloaded the 32
   original files of the Internet Archive item `PC_Globe_for_DOS` (1990, PC
   Globe, Inc.) and verified **every file against the MD5 and size the Archive
   itself publishes** in the item metadata; media + SHA-256 manifest committed
   to `.xfer/pcglobe/` (`.arena-pcglobe/last-run.log`, 32/32 OK). Scope and
   rationale: `docs/pcglobe-ghidra-java-scope-2026-10-24.md`.
2. **Analyze** — `.github/workflows/arena-pcglobe-ghidra.yml` (pinned Ghidra
   12.1.4, release SHA-256 checked; `sha256sum -c` re-verified the media)
   disassembled `PCGLOBE.EXE` headlessly and ran static string probes over the
   database files. Reports committed under `research/pcglobe-ghidra/`
   (`ANALYSIS.md`, `.asm`, `.c`, `.ghidra.json`, `.strings.txt`,
   `dat-strings/`). Pure static analysis; nothing was executed or emulated.
   (One operational note: the first trigger commit carried `[skip ci]` and
   silently suppressed the run; the re-trigger without it ran green.)

## Findings

- **Executable**: `PCGLOBE.EXE` (155,697 B) is an old-style DOS MZ,
  `x86:LE:16:Real Mode`, entry point `348d:0010`; Ghidra's MD5 for the file
  (`6a2a7ea3…`) independently equals the Archive's published MD5. The
  exporter's function list came back empty (far-function recovery on 1990
  segmented code is partial), but the disassembly (2.67 MB `.asm`) and
  decompiler output (79.9 KB `.c`) were produced — the Java stage treats them
  as leads, not ground truth, per the scope doc.
- **Runtime file table** (from the executable's own strings): `DATABASE.DAT`,
  `COUNTRY1.DAT`, `PARAMS.DAT`, `WORLD.VEC`, `FEATURES.VEC`, `PRINTER.DAT`,
  `FILLCOLO.DAT`, `TEXTMENU.DAT`, `INSTALL1.DAT` (with a diskette-swap prompt
  string), and runtime `MENUF.DAT`/`HELPF.DAT` names.
- **`NAMES.DAT`** carries a plain alphabetical country index (first entries at
  `0xbc7`: AFGHANISTAN, ALBANIA, ALGERIA, ANDORRA, ANGOLA, ANTIGUA & BARBUDA,
  ARGENTINA, AUSTRALIA, AUSTRIA, BAHAMAS, BAHRAIN, BANGLADESH, …) — the reader
  index for the Java stage.
- **`COUNTRY1.DAT`/`COUNTRY2.DAT`** contain per-country geography strings
  (mountains, rivers, deserts, oceans) that print as fragments with the first
  one or two letters clipped (`indu Kush`, `abul River`, `ahara Atlas`) —
  evidence that each string is preceded by a length/type byte or two. That
  prefix structure is the first thing the Java reader must pin down.
- **`DATABASE.DAT`** (9,609 printable runs) carries the statistical/resource
  vocabulary (Natural Gas, Crude Oil, Coal, Copper, Talc, …) behind PC Globe's
  country tables.

## Java stage (defined; next round)

A dependency-free Java program (javac-only, repo Java idiom) that reads
`.xfer/pcglobe/NAMES.DAT` + `COUNTRY1.DAT`/`COUNTRY2.DAT` (+ `DATABASE.DAT`
statistics), walks the record layout (index → record → prefixed strings), and
dumps country records as text/JSON. Acceptance: for a named sample of
countries, the Java dump must reproduce the country names and geography
strings visible in the raw probes, with any undecoded fields reported rather
than guessed — the two-source check (layout hypothesis vs. file content).

## Next

Java stage (above), then the S4 tail: reuse the Red October globe for the
planet viewer step (`red-october-4dwm.html` / `planet-viewer-4dwm.html` bases
already in-repo).
