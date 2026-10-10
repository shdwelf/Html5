# Ghidra on the DOS abandonware targets — plan and blocker

*2026-10-09*

## Targets

- **Shadow President** (1993 DOS, Digi4Fan/Mindscape)
- **WarGames** (DOS)
- **Balance of Power** (1985, Chris Crawford / Mindscape)

## Blocker (verified 2026-10-09)

This repo's agent sandbox **cannot run Ghidra** and **cannot fetch the
binaries**:

| need | status | evidence |
| --- | --- | --- |
| DOS binaries | unreachable | `archive.org`, `myabandonware.com`, IA file host all return HTTP `000` |
| Ghidra | unobtainable | release assets redirect to `objects.githubusercontent.com`, which returns `000` (CDN outside the egress allowlist) |
| a JVM to run Ghidra | none present, none obtainable | no `java`/`javac` on the filesystem; `node-jre` and Adoptium both pull from the same blocked CDN |

No disassembly is fabricated. What exists here is a **ready-to-run harness** to
execute on a machine that has Ghidra + a JDK 21+.

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
