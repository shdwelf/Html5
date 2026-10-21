# John the Ripper, Ghidra, OpenJDK, and Diablo research notes

*2026-09-29 · source-led, authorized research only*

## GitHub starting points

- [Openwall John the Ripper](https://github.com/openwall/john) — the
  maintained Jumbo repository. John is an offline password-auditing tool;
  use it only against hashes and systems for which the investigator has
  explicit authorization.
- [Ghidra](https://github.com/NationalSecurityAgency/ghidra) — NSA's software
  reverse-engineering framework, including disassembly, decompilation, and
  scripting support.
- [OpenJDK](https://github.com/openjdk/jdk) — the reference open-source JDK
  development repository. “OpenJVM” is commonly used informally for the JVM
  implementations in the OpenJDK ecosystem; verify which project and build
  are meant before comparing internals.

Pin a commit or release, record the JDK version and host architecture, and
keep downloaded binaries separate from the source checkout. GitHub repository
names and forks are not proof of provenance: check the owner, tags, signatures,
license, and checksum.

## Safe John workflow

John can support a password-policy audit when the organization owns the
password database and has approved the test. A safe report records the hash
format, test scope, wordlist provenance, duration, and remediation; it does
not publish recovered passwords or attack recipes. Use synthetic fixtures for
CI and demonstrations. Never process credential dumps, third-party hashes, or
online login endpoints.

For this encyclopedia, the useful static-analysis angle is to study John's
format/plugin architecture, test vectors, and CPU-feature dispatch—not to
recover a real secret. Compare source changes between pinned tags, run the
project's own tests, and document performance only on non-sensitive fixtures.

## Ghidra with OpenJDK

Ghidra requires a supported Java runtime. Use the JDK version documented by
the specific Ghidra release, rather than assuming the newest OpenJDK is
compatible. A reproducible setup should capture:

```text
java -version
GHIDRA_INSTALL_DIR/support/analyzeHeadless <project> <name> \
  -import sample.exe -analysisTimeoutPerFile 300
```

Run headless analysis on a copy, preferably in an offline VM. For DOS or PE
samples, begin with file identification, hashes, headers, imports, strings,
and section boundaries. Treat decompiler output as a hypothesis and confirm
important conclusions against bytes, control-flow references, and test
fixtures. The repository's existing `docs/GHIDRA_COOKBOOK.md` and
`abbottabad-ghidra/` evidence workflow provide local examples.

## Diablo series: preservation and analysis boundary

If “Diablo” means Blizzard's *Diablo* series, a lawful research track can
cover executable formats, asset containers, save-file structure, network
protocol history, and the evolution from DOS/Windows binaries to later
engines. Use official re-releases, legally owned installations, open-source
engine reimplementations, or developer-released material. Keep original game
assets private when redistribution is not permitted.

A static case study can inventory PE/MZ headers, locate resource tables,
compare patch versions, and describe data-driven systems. It must not produce
multiplayer cheats, license bypasses, malware, credential theft tooling, or
instructions for attacking Battle.net or another player's machine. For
network research, use a disconnected test harness and synthetic packets.

## Corpus target (question 1, answered 2026-10-21)

**Diablo 1 (1996) retail CD**, the archive.org item the requester named:

- Primary: <https://archive.org/details/diablo.iso> — “Diablo ISO + Ddraw.dll”
  (identifier `diablo.iso`, ark `ark:/13960/t81k76897`, published 1996-12-31;
  `Diablo.ISO.iso` 572.3 MB + `ddraw.dll` 1.7 MB).
- Preservation alternates: <https://archive.org/details/Diablo_1996_Blizzard>
  (2013 upload, `Diablo (1996)(Blizzard).iso` 572.3 MB) and
  <https://archive.org/details/diablo_20201222> (“Diablo 1996 (Eng/Ger)”,
  572.6 MB, ISO image download).
- Companion for the cow theme: <https://archive.org/details/Hellfire_Sierra_On-Line_1997>
  (*Diablo: Hellfire*, 1997 — the expansion that hid the cow-suit quest).

Per the uploader's own description and period reports, Diablo 1 is the only
classic Battle.net title that **never required a CD-key** — worth one line in the
protection lineage (no serial scheme to study; the disc check is the whole
gate). Contents to triage: `DIABLO.EXE` (PE/MZ) and `DIABDAT.MPQ` (Blizzard
MPQ asset container — strings for quests/dialogue live here).

**F3 boundary:** archive.org is a relay/user-capture host — the sandbox cannot
pull the ISO; the item pages above are the captured provenance record. The
analysis below runs when the image is user-supplied; no game assets are
redistributed by this repository.

## Secret Cow Level investigation (2026-10-21)

**Question.** Did Diablo 1 ship a “secret cow level” (the legend: click the
Tristram cows repeatedly → portal opens)?

**Published record** (this is the hypothesis set the binary work must test):

1. **The interaction is real.** Tristram has cows near the Catacombs entrance;
   clicking them moos and after several clicks the *character* speaks lines
   including “Yup, that's a cow all right!” (~8 clicks) and “I am not thirsty!”
   ([TheGamer](https://www.thegamer.com/diablo-secret-cow-level-explained-origin/),
   [Grokipedia](https://grokipedia.com/page/Cow_level)).
2. **The level is not.** Fake “screenshots” were Photoshopped from a red-hued
   portal and unused demon assets; the official word from Blizzard's own
   Arreat Summit: *“There was, of course, no Cow Level in Diablo, but the
   legend was born”* ([classic.battle.net](https://classic.battle.net/diablo2exp/quests/cow.shtml);
   [Diablowiki](https://diablo2.diablowiki.net/Secret_Cow_Level): “There was no
   truth behind the rumors of a cow level in Diablo I”).
3. **The joke cascade:** *Hellfire* hid the cow-suited “Jersey's Jersey” quest
   behind a `command.txt` unlock (cow-suit NPC voiced by programmer Jim
   Edwards); *StarCraft* (1998) shipped the cheat `there is no cow level`
   (instant mission win) as the official denial; *Diablo II* (2000) built the
   real “Moo Moo Farm” (Hell Bovines, Cow King, Wirt's Leg + Tome of Town
   Portal in the Horadric Cube; walkthroughs were public within four days of
   launch) ([Wikipedia](https://en.wikipedia.org/wiki/Cow_level),
   [BlizzardWatch](https://blizzardwatch.com/2021/08/17/history-secret-cow-level/)).
4. A Blizzard screenshot-of-the-week on **1 April 1999** showed cows in combat —
   the April Fools' that foreshadowed the real D2 level.

**Binary-side method (runs on a user-supplied ISO extract):**

```text
# 1. tooling sweep (implemented — tools/cow_level_xgrep.mjs)
node tools/cow_level_xgrep.mjs /path/to/iso-extract/
#   expect on retail D1: d1-click hits (the character one-liners),
#   zero cow-level hits → verdict "interaction without a level"

# 2. Ghidra headless pass on DIABLO.EXE (pinned pair, record both versions)
GHIDRA_INSTALL_DIR/support/analyzeHeadless cowproj d1 \
  -import DIABLO.EXE -analysisTimeoutPerFile 300
#   file identification, strings, then xrefs to the cow-click speech strings;
#   quest-table/data-driven lookups around the Tristram town logic. Treat
#   decompiler output as hypothesis; confirm against bytes (GHIDRA_COOKBOOK).

# 3. MPQ side: extract TEXT/string tables from DIABDAT.MPQ with a
#    preservation-grade MPQ tool (list/extract locally, keep the archive
#    untouched) and run the same sweep over the extracted corpus.
```

**Expected finding (to be confirmed on the real binary):** retail D1 contains
the click-dialogue strings and no portal/level/bovine content — i.e. the
legend is an interaction *without* a level, exactly as the Arreat Summit says.
A cow-level hit in a D1 corpus would indicate a non-retail/debug build and is
worth documenting as a finding, not as a cheat.

**Implemented tooling:** `tools/cow_level_xgrep.mjs` (needle manifest with
provenance for each string; `profileReport()` words the verdict) +
`tests/cow-level-xgrep.test.mjs` (5 tests, synthetic fixtures — no game data in
the repo). The scanner is shared with `tools/sierra_xgrep.mjs` (round-6
cross-title sweep).

## Open questions for the next pass

1. ~~Which Diablo title and release should be the corpus target?~~ **Answered
   above:** Diablo 1 retail ISO (`archive.org/details/diablo.iso`), plus
   Hellfire for the cow-suit quest.
2. Which Ghidra release and OpenJDK LTS version should be pinned for the
   project environment? (Record the pair from the Ghidra release notes at
   install time — Ghidra 11.x requires JDK 21 — and keep the pair in the
   analysis header.)
3. Can a small, redistributable toy binary demonstrate the same loader and
   resource-analysis techniques without proprietary game assets?
4. Can John's existing test vectors be wired into a local, non-secret audit
   regression test?
