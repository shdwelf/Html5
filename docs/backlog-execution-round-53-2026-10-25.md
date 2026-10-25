# Backlog execution round 53 — 2026-10-25

**Ask:** “Utilize additional resources on drive, investigate for new recipes,
continue researching.” Research-first Drive investigation that closed the last
blocked strand of T11.1 and shipped its distillation as cookbook section 24.

## Drive investigation (what was mined, what was rejected)

| Resource | Finding |
| --- | --- |
| `html5-session-20261009b.bundle` (5 commits `d5580f6..4d8627b`) | Unpacked after `git fetch --deepen=300` supplied the prerequisite. The “cookbook commit that could not be pushed” (barcode/QR/Avery/SFX-gap work, 5 test files) **already landed and is superseded** on main: current tests are strictly stronger (bwip/zxing vendor pins, `zenInit` tail assertions) and the cookbook moved on (+27/−6 vs the bundle tip). Nothing to port. |
| `html5-changed-20261009b.tar.gz` | Same 20 files as the bundle — redundant, not unpacked. |
| 2026-10-04 patches (`854f8ff`/`445776b`, 6.3 MB + 1.8 MB) | Round-17/18-era content (four-corners, gazetteer, launch windows) already on main; backups only. |
| `More` folder | Wiki-in-a-Jar split payload — not recipes. |
| `html5-2026-10-15/13/14/10` change overlays + session backups | PR #108–#116 restore kits — landed, inspection only. |
| `html5-re-research-2026-09-29.tar.gz` / `UFOpaedia.html` | EXE-protection/UFOpaedia rounds — landed (`public/apps/ufopaedia`, `test/ufopaedia.test.ts`). |
| `Codes and Ciphers` (R. F. Churchhouse, CUP 2004, ISBN 0-521-00890-5) | Theory source cited in the new cards (ch.4 transposition, ch.5 digraph, ch.7 book ciphers). Methods distilled with own vectors; no textbook prose copied. |
| **`The Cold War Spy Pocket Manual`** (Philip Parker, Casemate 2021, ISBN 978-1-910860-02-1) | **The source book T11.1 was blocked on.** Its end-of-book “Code and Cipher-Breaking Challenge” (devised by Micheal Colao; Pool of London Press contest closed 2016-03-31) has **16** items — the round-12 backlog note said 18. Extracted all 16 (text + rendered image pages). |

Full-text and name searches (`recipe`, `CyberChef`, `patch`, `research`, `lab`,
`spy`, `cipher`) were re-run; every remaining hit is either round-51 hash-lab
territory (folder `143iR3…`, already recorded in
[`cyberchef-hash-lab-drive-investigation-2026-10-25.md`](cyberchef-hash-lab-drive-investigation-2026-10-25.md))
or landed backup material.

## The 16-item challenge → kitchen mapping

| # | System | Route | Verdict |
| --- | --- | --- | --- |
| 1 | Caesar (ROT-13 warm-up) | `rot13`, `caesar` | Verified vectors |
| 2 | Beale-style symbol stream (public-domain lineage) | `gcwBookCipher` (L-W-L tuples; built-in reference → `GOLD`) | Verified |
| 3 | Constructed substitution | `keyedSubstitution` (ZEBRAS round trip) | Verified |
| 4 | Unidentified blocky glyph image | Moon/Nyctography families are candidates only | **Skip (recorded)** |
| 5 | Navajo code-talker words | no Navajo table ships; inventing values would fabricate a wartime system | **Skip (recorded)** |
| 6 | Clock times (`11:52`, …) | plate tables `gcwFicCicero`/clocks + `gcwPruinfClkToki`/clk2 round-trip; minute-resolution dial step **not shipped** | Partial + gap recorded |
| 7 | 37-word list (acrostic family) | no first-letter extractor op in this kitchen | **Skip (recorded)** |
| 8 | English shorthand image | nearest table is German stenography in `gcwBrailfxChrexSteno`; transcription out of scope | **Skip (recorded)** |
| 9 | Six-fact flag matrix | `toBinary`/`fromBinary` plumbing documented; contest grouping unpublished | Method card |
| 10 | Vigenère, 6-letter key hint | `vigenere` (+ autokey/Beaufort relatives); ciphertext computed independently in the test | Verified |
| 11–13, 15 | Five-letter transposition blocks | `coltrans`, `doubleTransposition`, `zigzagTransposition` round trips | Verified |
| 14 | Two-letter groups | `playfair` + `gcwPlayfair` | Verified (after fix) |
| 16 | Symbol-alphabet block | `rot47` measured negative result; `keyedSubstitution` method note | Method card |

The preface’s named families (Morse, fractionated Morse, Braille, semaphore,
NATO phonetic) all round-trip and are documented in the same section.

## Playfair mode fix (bug found while distilling)

`public/apps/cyberchef/index.html` — `playfair` declared a `mode` argument but
never read it: **decrypt silently re-encrypted**. The run function now branches:

* encrypt keeps the repeated-letter `X`-insertion rule and `+1` shifts;
* decrypt pairs ciphertext straight through (no X rule) and shifts by
  `-1 mod 5 == +4`.

Evidence: `ATTACKATDAWN` ↔ `RSSRDERSBRNY` under the textbook MONARCHY square,
cross-checked by an independent implementation inside the new test. No prior
test or doc referenced `playfair`, so nothing pinned the broken behavior.
This mirrors the 2026-10-09 session’s “correct Code 39” class of repair.
The `gcwPlayfair` sibling was already correct and stays the pair-structured
route (`SPYMEETSATTHREE` ↔ `TQ CN IU KL XB SZ PD MK IU` ↔
`SP YM EX ET SA TX TH RE EX`).

## Delivery

* `public/apps/cookbook/index.html` — new section
  **`#spy-manual-challenges` (24.)** with ten cards: source citation, and one
  card per challenge family plus a consolidated skip card. No full book
  ciphertext is quoted; practice strings are synthetic or public domain.
* `tests/cyberchef-spy-challenge.test.mjs` — 17 checks: section shape
  (unique ids, `.n` = 24., footer last, entities resolve, no markup leak),
  every documented figure re-read from the section text, and every figure
  re-baked through the real `recipe -> bake()` pipeline with independent
  Vigenère, columnar and Playfair implementations.
* **No operation added or removed** — the registry stays at 517, so the five
  op-count sites (recipe-sync list, SFX constant, archive-headers, cookbook
  guard + card) are untouched by design. No recipe-pack changes either; the
  section is prose + measured figures like the rest of the cookbook.
* Backlog: T11.1 → **done** (spy-book strand was the last open half);
  T10.2 cookbook tail advanced (Ghidra DTSearch remains).

## Evidence

* Targeted: `node --test tests/cyberchef-spy-challenge.test.mjs tests/cyberchef-cookbook.test.mjs` → **17/17**.
* Full gate: `npm test` (see Key results of this round’s commit message).
* `git diff --check` clean.
