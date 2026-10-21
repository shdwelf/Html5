# Jeopardy! & Wheel of Fortune — abandonware corpus + Ghidra research (21 Oct 2026)

*Request: search archive.org for Jeopardy / Wheel of Fortune abandonware,
“ghirdra both and disassemble investigate”. Same posture as
[`john-ghidra-diablo-research.md`](john-ghidra-diablo-research.md): corpus
provenance first (F3 — archive.org is relay/user-capture; nothing is downloaded
here), RE plan second (F4 — recipe level, no assets redistributed).*

## 1. Corpus on archive.org (provenance record)

**Jeopardy!** (licensed quiz-show games; the DOS line is ShareData → GameTek):

| Item | Year / maker | Size | Notes |
| --- | --- | --- | --- |
| [`msdos_Jeopardy_1987`](https://archive.org/details/msdos_Jeopardy_1987) | 1987, ShareData | 313 KB | IA MS-DOS software library (in-browser DOSBox, access-restricted) |
| [`jeopardy_gametek_DOS`](https://archive.org/details/jeopardy_gametek_DOS) | 1992, GameTek | 1.1 MB | “2nd generation DOS home version … more options for graphics and sound cards” |
| [`JEOPARDY_201704`](https://archive.org/details/JEOPARDY_201704) | 1992, GameTek | 661 KB | ZIP download, 5 files |
| [`jeopardy-25th-anniversary-edition`](https://archive.org/details/jeopardy-25th-anniversary-edition) | 1991, GameTek/IJE | 193 MB | 25th Anniversary Edition (scans bundled) |
| [`jeopardy-second-edition`](https://archive.org/details/jeopardy-second-edition) | 1991, GameTek | 124 MB | floppy image |
| [`jeopardy_game_disk`](https://archive.org/details/jeopardy_game_disk) | 1987, ShareData | 549 KB | Commodore 64 “clean” disk |

**Wheel of Fortune** (Merv Griffin format; GameTek held most 20th-century game
rights and **filed Chapter 11 in 1998**):

| Item | Year / maker | Size | Notes |
| --- | --- | --- | --- |
| [`msdos_Wheel_of_Fortune_-_Golden_Edition_1989`](https://archive.org/details/msdos_Wheel_of_Fortune_-_Golden_Edition_1989) | 1989, GameTek/Softie | 364 KB | DOS; “re-release … with an extra one thousand new puzzles” |
| [`win3_WHEEL`](https://archive.org/details/win3_WHEEL) | 1994, GameTek/Imagitec | 14.8 MB | Win 3.x “Deluxe Edition”, 4,000 puzzles, digitized Vanna White |
| [`arcade_wfortune`](https://archive.org/details/arcade_wfortune) | 1989, GameTek | 762 KB | arcade (MAME, stream-only) |
| [`wof_nes`](https://archive.org/details/wof_nes) / [`wof_snes`](https://archive.org/details/wof_snes) / [`wof_gb`](https://archive.org/details/wof_gb) / [`vannawhite`](https://archive.org/details/vannawhite) | 1988–1992 | ≤2 MB | console ports (NES/SNES/GB) |

Catalog cross-check: MyAbandonware lists the same DOS line (Jeopardy! 1987,
2nd Edition 1988, Super Jeopardy! 1991, 25th Anniversary 1991) with DOSBox
ratings — consistent with the IA items. As with the Diablo corpus: **link only**;
install locally from your own media or a capture you are entitled to use.

## 2. What to disassemble (the interesting data is the question database)

Game-show games are unusually honest RE targets: the *content* (clue/answer
pairs, puzzle lists) is the product, so the formats are plain and the validation
logic is the code worth reading.

1. **Puzzle / question data files.** The “+1,000 puzzles” (Golden Edition) and
   “4,000 puzzles” (Deluxe) claims imply external data files or packed tables —
   find them by size/signature triage (`tools/game_triage.py` pattern), then
   Ghidra the loader: how strings are indexed, whether categories are codes or
   text, endianness/length-prefix conventions.
2. **Answer-validation logic.** Jeopardy-style games historically accept
   misspellings (compare against the arcade/console lineage); WoF letter-pick
   and solve paths are a tiny state machine (spin → consonant → vowel → solve).
   Ghidra question: where is the equivalence class for answers computed?
3. **Timing / scoring state machines** — the DOS timer tick, the buzz-in window.
   Model as a small state machine like the hint-layer study in
   [`software-protection-encyclopedia.md`](software-protection-encyclopedia.md).
4. **MZ/PE triage first** (the dos-game-disassembly protocol): identify COM vs
   MZ vs packed; record strings before touching the decompiler
   ([`dos-game-disassembly.md`](dos-game-disassembly.md)).

## 3. Snopes-forensics tie-in

The viral-fake WoF analyses are the *media* side of the same puzzle data — see
[`snopes-game-show-forensics-2026-10-21.md`](snopes-game-show-forensics-2026-10-21.md).
The deep-dive techniques there (source-episode reconstruction, board-letter
consistency checks, font forensics) map onto the binary side: a puzzle database
extracted from these games is exactly the kind of reference used to test whether
a purported “episode puzzle” is real.

## 4. Method (when a specimen is user-supplied)

```text
node tools/sierra_xgrep.mjs <extract>/          # generic string sweep (reuse)
ghidra: analyzeHeadless gsp jeop -import JEOPARDY.EXE -analysisTimeoutPerFile 300
#   then: strings xrefs around the puzzle loader; data-file parsers; timers
```

Same Ghidra/OpenJDK pinning rules as the John/Ghidra notes (record the pair in
the analysis header). Expected findings stay at documentation level: file-format
notes, state-machine descriptions, validation quirks — no redistribution of
clue/answer content beyond short illustrative quotes.
