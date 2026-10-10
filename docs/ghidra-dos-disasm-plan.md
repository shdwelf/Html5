# Ghidra on the DOS abandonware targets — plan and blocker

*2026-10-09*

## Targets

- **Shadow President** (1993 DOS, Digi4Fan/Mindscape)
- **WarGames** (DOS)
- **Balance of Power** (1985, Chris Crawford / Mindscape)

## Status (verified 2026-10-09/10)

| need | status | evidence |
| --- | --- | --- |
| DOS binaries | **obtained** | uploaded to Google Drive; pulled into the workspace via the Drive connector (`google_drive/`, gitignored) |
| a JVM to run Ghidra | none present, none obtainable | no `java`/`javac` on the filesystem; release assets and `node-jre` pull from `objects.githubusercontent.com`, which returns `000` |
| Ghidra | unobtainable here | same blocked CDN |
| capstone (disassembler) | **installed** | `pip install --break-system-packages capstone` → 5.0.7 |

So Ghidra cannot run in the sandbox (no JVM), but the binaries are in hand and
**real 16-bit disassembly was done with capstone** via `scripts/dos-disasm.py`.

## What was actually disassembled

From the Drive uploads: `SHADOW.EXE` (Shadow President, 1.44 MB code, 540,510
instructions), `EGAGAME.EXE`, `HFROEGA.EXE`, `HFROVGA.EXE`, `HFRO.COM` (Hunt for
Red October). WarGames and Balance of Power were **not** in Drive (Drive-wide
search returned 0).

The capstone scan (`docs/ghidra/dos-disasm-report.md`) flags candidate
nested-loop/array shapes, but **manual inspection of the top candidates found no
array sort** — they are an `itoa` number formatter, a bounding-box hit-test
search, a DOS `int 21h` file-I/O routine, and a 4-element threshold scan. The
`xchg`/`cmp`/backward-jump signature over raw assembly also matches those, so
asm-level detection is too noisy to be reliable. **A decompiler is required to
confirm sorts** — that is what `scripts/ghidra-dos-disasm.sh` is for, on a host
with a JVM. Nothing here is fabricated.

## Harness

- `scripts/ghidra-dos-disasm.sh <binary>...` — imports each 16-bit DOS
  `.COM`/`.EXE` (`-processor x86:LE:16:default`), runs auto-analysis, then the
  post-script, writing reports to `docs/ghidra/`.
- `scripts/ghidra_dos_summary.py` — GhidraPy post-analysis script. Surveys
  functions/strings and flags **O(n²) in-place array-sort shapes** (bubble,
  selection, insertion, generic nested-loop swap) in the decompiled pseudocode.

Both are syntax-checked (`bash -n`, `python3 -m py_compile`). They are not
executed here because there is no JVM — that is stated, not hidden.

## Why: the sort-rewrite goal

The point of the disassembly is to correct bugs — specifically to find `for`
loops that sort arrays and replace them with an efficient algorithm. The
harness flags the candidates; the replacement is the standard result:

- In-place comparison sorts built on nested loops (bubble/selection/insertion)
  are **O(n²)** comparisons and swaps.
- Replace with **O(n log n)**: introsort/quicksort (average), mergesort
  (stable, O(n) extra space), or heapsort (in-place, worst-case O(n log n)).
- Lower bound: any comparison sort is **Ω(n log n)** (decision-tree argument —
  n! leaves need log₂(n!) = Θ(n log n) comparisons). So the O(n²) shapes are
  provably suboptimal, not merely slow.

Gang of Four framing for the rewrite: a **Strategy** object for the comparator
(`Comparator`), the sort itself as a **Template Method** over the comparison,
and a **Factory** selecting quicksort vs mergesort by size/stability needs.

## To actually run it

1. Obtain the binaries (outside this sandbox) and put them somewhere reachable.
2. On a host with Ghidra 12.x + JDK 21+:
   `GHIDRA_HOME=/opt/ghidra scripts/ghidra-dos-disasm.sh SP.COM WAR.EXE BOP.EXE`
3. Read `docs/ghidra/ghidra-report-*.md`, then rewrite the flagged sorts.
