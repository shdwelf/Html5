# Sierra / Shadow President / Game Wizard / Game Gear sweep — 21 Oct 2026

*Backlog round 5, stream **S3** (“Format study and abandonware sweep (Easter eggs,
walkthroughs, *Shadow President*), feeding the existing DOS disassembly line”).
Feeds [`dos-game-disassembly.md`](dos-game-disassembly.md) and
[`spycraft-research.md`](spycraft-research.md). Game Genie/UHS recipe work lives in
[`uhs-gamegenie-recipe-cards-2026-10-21.md`](uhs-gamegenie-recipe-cards-2026-10-21.md);
this sweep closes the remaining **Game Gear Game Genie** format item.*

## 1. Game Gear Game Genie — format study closed

The **Game Gear Game Genie is real** (Codemasters-designed, Galoob-published, Sega
seal of approval, US/EU 1994 — later than the NES/SNES/Genesis/GB units). Physically
it is a pass-through with a pop-up second cartridge slot and a peel-off sticker code
book ([Wikipedia](https://en.wikipedia.org/wiki/Game_Genie),
[GameHacking wiki](https://wiki.gamehacking.org/Game_Genie_(Game_Gear))).

**Code format** (documented by [SMS Power](https://www.smspower.org/Development/GameGenie),
implemented in `tools/verify_uhs_gamegenie.mjs` as `decodeGGG`/`encodeGGG`):

```
DDA-AAA-RRR     2 or 3 groups of 3 hex digits -> 36-bit code
  DD      patch value (plain)
  AAAA    Z80 address: move the last digit to the front and bit-invert it
  RRR     optional: cloak = d6^d7 (8 in every known code),
          reference = ror2(d6||d8) ^ 0xBA (the original byte at the address)
```

Published Sonic the Hedgehog (Game Gear) codes from gamegenie.com — all decoded and
re-encoded to the exact code by the port (8/8, `tests/uhs-gamegenie.test.mjs`):

| Code | Effect | value | address | reference |
| --- | --- | --- | --- | --- |
| `007-01A-3BE` | infinite lives | 00 | 5701 | 35 |
| `013-7DE-E66` | start with 1 life | 01 | 137D | 03 |
| `053-7DE-E66` | start with 5 lives | 05 | 137D | 03 |
| `093-7DE-E66` | start with 9 lives | 09 | 137D | 03 |
| `020-54A-E6E` | rings worth 2 points | 02 | 5054 | 01 |
| `3A0-21C-2A2` | never lose rings | 3A | 3021 | 32 |
| `003-F8C-3B7` | stop timer | 00 | 33F8 | 77 |
| `009-04F-3BE` | Sonic 2 infinite lives | 00 | 0904 | 35 |

The 1/5/9-lives family is exactly what the format predicts: one patch address
(`137D`) and one reference (`03`), with only the unobfuscated value byte changing.

**Easter-egg bonus** (GameHacking wiki): the device carries hidden text entered as
codes/button sequences on the code screen — `DEAD` (screen wobble), the factory
credits *“Game Genie built by: Richard Aplin programmed by: R. Fred N. managed by:
Ted Carron”*, *“Help! I'm a prisoner in a Game Genie factory!”*, several joke poems,
and an idle-time self-advertisement. (SMS Power instead credits “Jon the Programmer”
and manager Paul Ranson — both attributions are preserved as published.) TCRF also
catalogs the hidden developer message: <https://tcrf.net/Game_Genie_(Game_Gear)>.

## 2. Sierra On-Line abandonware sweep — Easter eggs & walkthroughs

Canonical egg catalogues (per-game egg IDs, cross-references between series):

- **The Sierra Chest** — <https://www.sierrachest.com/> (deep egg database with IDs;
  e.g. LSL1 egg 134 “the Sierra assembly line”, egg 340 Ken Williams cameo in Lefty's,
  egg 344 the “Ken Sent Me” password).
- **Sierra Planet Easter Egg Hunt** — <http://www.sierraplanet.net/other-pages/curiosities/easter-egg-hunt/>
  (LSL series eggs with dated submissions, 1999–2002).
- **The Sierra Help Pages** — <https://sierrahelp.com/Misc/EasterEggs/> (Space Quest /
  King's Quest egg lists; e.g. SQ1 typing `ken`/`scott` for developer cameos, the
  “don't touch” button dropping Roger into King's Quest 1, the SQ3 “Crowe” signature).
- **Al Lowe's own walkthroughs** — allowe.com (LSL2 walkthrough PDF documents the
  Police Quest I cameo window and the LSL1 alley callback).

Cross-series pattern worth noting for the disassembly line: Sierra's AGI/SCI games
share string-table Easter eggs across franchises (LSL1's death alley assembles
“spare” Larries next to a King's Quest 1 Graham + dragon and the Space Quest 1 droid;
SQ2's snare dream is LSL; KQ4's swear-word parser answer names LSL). Any RE of one
title's message tables should grep the others' known strings.

**Abandonware/GOG status (F3):** downloads themselves are out of scope here
(external hosts via relay only); the sweep records *where* the preservation copies
are catalogued (MyAbandonware, GOG re-releases, in-game egg documentation above)
rather than redistributing anything.

## 3. Shadow President (D.C. True, Feb 1993) — dossier

- **What it is:** geopolitical presidential simulation for MS-DOS, designed by Robin
  Antonick & Brad Stock (with Charlie Athanas); sequel **CyberJudas** (June 1996).
  Sources: [Wikipedia](https://en.wikipedia.org/wiki/Shadow_President),
  [MobyGames](https://www.mobygames.com/game/9598/shadow-president/) (full credits:
  lead SW engineer Bill Dempsey, etc.).
- **Data provenance claim (reviewer-reported):** nation stats drawn from the
  **1990 CIA World Factbook** (600+ pages on 150+ nations per the period ad copy on
  GameFAQs; Classic Gamer Hub's review repeats the World-Factbook sourcing and the
  “30,000 variables” ShadowNetwork figure). Treat as *period marketing/reviewer
  claim*, not verified data extraction — a good RE target for the disassembly line:
  compare in-game stats against the 1990 Factbook tables.
- **Simulation framing:** start 1 June 1990 (Ogaden war aftermath) with the 2 Aug
  1990 Iraqi invasion of Kuwait ahead; budget/aid/crises/war; approval & elections;
  CGW 1993 (Chuck Moss) called it a good learning tool with “certain real-world
  problems” (Iraqi forces stronger than reality).
- **Preservation:** TCRF has hidden development text
  (<https://tcrf.net/Shadow_President>); MyAbandonware/GameFAQs hold catalog entries;
  a 2025 Windows re-release exists per MobyGames. DOS disassembly of the ShadowNetwork
  variable tables would slot into `tools/game_triage.py` + the spycraft research line.

## 4. Game Wizard 32 (the DOS trainer in the backlog line)

- **Product line:** Game Wizard / Game Wizard 32 / 32 Pro 3.0 by Ray Hsu & Gerald
  Rickman (Enhanced Software Design); shareware vs Pro (Pro adds Intermediate/
  Advanced searches, up to 90 frozen table entries, save/load of game memory states
  incl. EMS/XMS/DOS4GW/SVGA). Reference-guide excerpt preserved at
  [VCFed](https://forum.vcfed.org/index.php?threads/game-wizard-32-x-dos.55444/).
- **RE-relevant:** the installer **binds the installed executable to a BIOS/video-BIOS
  checksum** of the machine it was installed on (VOGONS + MiSTer threads) — a
  hardware-fingerprinting copy-protection trick worth a slot in
  [`software-protection-encyclopedia.md`](software-protection-encyclopedia.md) /
  [`exe-protection-deep-dive.md`](exe-protection-deep-dive.md) alongside the LZEXE/
  TPE material.
- **DOSBox notes (VOGONS, 2020):** works, but memory-state save/load is impossible
  under DOSBox (missing internal DOS structures), File Manager locks up, and
  `ems` must be `false` or `ems=emsboard` for extended-memory search. Full reinstall
  required after BIOS updates. DOSBox smoke remains **gated** in this sandbox (no
  `dosbox`/`Xvfb` host binaries) — `tools/smoke_sneakers_dosbox.sh` pattern applies.
- **Archives:** Internet Archive holds `game-wizard-32-pro-30-a-dfi` and the 1994
  “Game Wizard” (Ray Hsu) images (F3: link only, fetch via relay/user capture).

## 5. “Ghidra encryption” (S3 line item)

The encryption-RE arm of this line already has first-class in-repo tooling: the
FindCrypt/native-Ghidra Sneakers work
([`sneakers-original-ghidra-wasm-2026-10-18.md`](sneakers-original-ghidra-wasm-2026-10-18.md)),
`tools/ghidra_scripts/`, `tools/verify_ghidra.mjs` + `tests/ghidra-headless-methodology.test.mjs`,
and the DOS protection docs above. Nothing new was needed to close the sweep; the
next concrete targets it feeds are (a) Shadow President's ShadowNetwork tables and
(b) Game Wizard 32's BIOS-checksum installer, both above.

## 6. What this changes downstream

- `tools/verify_uhs_gamegenie.mjs` now covers **all five** Galoob Game Genie formats
  (NES, SNES, Genesis, Game Boy, Game Gear) — 32 vector checks + full report.
- Round-5 test tally: `tests/uhs-gamegenie.test.mjs` 11 tests, all green.

## 7. Round-6 follow-up: the cross-grep pass is a tool now

The §2 recommendation (“grep sibling titles' known strings”) is implemented as
**`tools/sierra_xgrep.mjs`** (`tests/sierra-xgrep.test.mjs`, 5 tests): a
byte-level, case-insensitive sweep of a resource corpus against a conservative
manifest of documented egg strings (`KEN SENT ME`, `CROWE`, `RICK CAVIN`, …),
each carrying its source (Sierra Chest / Sierra Help). Run
`node tools/sierra_xgrep.mjs <games-dir>` over locally owned dumps; it reports
file, offset, and printable context. No game data ships with the repo — tests
use synthetic fixtures. The Game Wizard 32 machine-binding note (§4) also landed
in [`software-protection-encyclopedia.md`](software-protection-encyclopedia.md)
(“Machine-binding installers” section), and the LHA/ACE password follow-through
is [`arj-lha-ace-password-notes-2026-10-21.md`](arj-lha-ace-password-notes-2026-10-21.md).
