# Backlog execution round 15 — 22 Oct 2026

*Fifteenth round: “Continue backlog” — beyond the registry line, per the
round-14 queue: S4 California viewer sequencing, S6 Keyhole research, and
an S7 disposition. Lands as a third commit on PR #129. Index:
[`agent-backlog-2026-10-21.md`](agent-backlog-2026-10-21.md).
Rounds: [1](backlog-execution-round-1-2026-10-21.md) ·
[2](backlog-execution-round-2-2026-10-21.md) · [3](backlog-execution-round-3-2026-10-21.md) ·
[4](backlog-execution-round-4-2026-10-21.md) · [5](backlog-execution-round-5-2026-10-21.md) ·
[6](backlog-execution-round-6-2026-10-21.md) · [7](backlog-execution-round-7-2026-10-21.md) ·
[8](backlog-execution-round-8-2026-10-21.md) · [9](backlog-execution-round-9-2026-10-21.md) ·
[10](backlog-execution-round-10-2026-10-21.md) · [11](backlog-execution-round-11-2026-10-21.md) ·
[12](backlog-execution-round-12-2026-10-21.md) · [13](backlog-execution-round-13-2026-10-22.md) ·
[14](backlog-execution-round-14-2026-10-22.md).*

## Scoping decisions (recorded before code)

- **S4** is delivered through the existing parametric city-subsurface build
  as a sixth, statewide frame — not a one-off viewer. The gazetteer is a
  *starter register*: sourced exemplar rows only. Backlog categories that
  are ephemeral or commercial (factory outlets, Renaissance faires,
  Red Cross / evacuation points) are catalogued as planned layers in
  [`city-subsurface.md`](city-subsurface.md), not seeded as data rows that
  would silently go stale.
- **S6** is a research deliverable this round (Keyhole disambiguation).
  ARPANET / FidoNet / payphone layer *datasets* are deferred to a round
  that builds a consumer historical-network viewer; the California frame
  deliberately does not absorb S6 layers.
- **S7**: no work. Re-audit during scoping confirmed the hierarchy write-up
  (§3) and escrow model already exist and the remainder is fully externally
  blocked per `docs/goldkey-parity-gina-and-units.md` §7 (gina.dll binary +
  JDK/Ghidra, board teardown, or proprietary drivers). Recorded in the
  backlog JSON so it stops being re-queued as if it were a code task.

## Delivered

| Artifact | What it closes |
| --- | --- |
| `california` frame: `resources/city-subsurface/cities.json` (6th config), generated `california-subsurface.html`, `js/city-subsurface-data-california.js`, `js/city-gazetteer-data-california.js`, `california-subsurface.xdc` (27 entries) | **S4 California viewer, first deliverable**: statewide bbox (−124.48…−114.13, 32.53…42.01); generalized coast polyline, 9 relief gaussians (Sierra Nevada, Cascades, Coast Ranges, Transverse/Peninsular, Central Valley, Death Valley trough…), 3 `context`-tier corridors (El Camino Real/US-101, California Aqueduct, Overland Route via Donner Pass), 5 nodes. **16-row starter gazetteer, every row VERIFIED=0 with no GNIS FEATURE_ID claimed** and its public source + retrieval date (2026-10-22) in the row note: Los Angeles, San Francisco, Sacramento, San Diego, Oakville (Mondavi/vintner exemplar), UC Berkeley, UCLA, Manzanar, Tule Lake, Empire Mine SHP, Nike Site SF-88L, Morris Dam, La Casa Pacifica, Stow House (Rancho La Patera), Clair Tappaan Lodge, Aerojet General Corp. Site. Sources: Wikipedia article coordinates, US EPA TRI facility profile + Superfund profile CAD980358832, lodge-published location data |
| Scale-aware framing: `viewsFor` in `scripts/build-city-subsurface.mjs`; fog range in `js/city-subsurface.js` | The build assumed city scale (overview camera `[0,20,32]` vs. a ≈92-unit-wide state frame; fog 45/130 would white-out the far half of the state). Both now scale with frame size behind `Math.max` floors — **rebuilding all cities afterwards produced zero diff on the five existing data packs**, proving city frames are byte-unchanged |
| `california` entries in the engine's `DATA_LOADERS` / `GAZ_LOADERS` / `DEM_LOADERS` (`js/city-subsurface.js`) + all six `*-subsurface.xdc` rebuilt | The engine hard-codes per-city dynamic-import maps; without these entries the California page throws `unknown city`. Because every bundle ships the shared engine (and, via its import graph, every city's packs), all six Webxdcs were rebuilt and re-verified byte-current by the test suite |
| `tests/city-subsurface.test.mjs`: `california` added to the shared currency test + new focused test | Pins the round's contract: starter rows all VERIFIED=0 / GNIS-free / source-dated; required exemplar names present; overview/underground views exceed city-scale floors; corridors stay `context` tier |
| [`keyhole-disambiguation-deep-dive-2026-10-22.md`](keyhole-disambiguation-deep-dive-2026-10-22.md) | **S6 Keyhole task (T6.1 → partial)**: "Keyhole BBS" is a documented Denver dial-up board (USBBS list #127, Nov 1994: `303-477-6337 CO Denver Linda McCraw … Keyhole BBS`), unrelated to Keyhole, Inc. The EarthViewer lineage is pinned from primary/secondary sources (Intrinsic Graphics → Keyhole Corp. 1999 under John Hanke → EarthViewer 2001-06-11 → In-Q-Tel investment Feb 2003, announced 2003-06-25 as its first engagement for NIMA → Google acquisition Oct 2004 → Google Earth 2005-06-28; KML keeps the name). The popular KH-satellite naming story is flagged as uncorroborated by the sources consulted |
| S7 disposition + `docs/agent-backlog-2026-10-21.json` (S4/S6/S7 notes, T4.1 note, T6.1 open→partial) · `docs/city-subsurface.md` (California section + planned-layers catalogue) · `docs/README.md` · `wikiinajar.xdc` rebuilt | bookkeeping; S7 recorded as fully externally blocked, no code by decision |

## Findings worth keeping

1. **The "city" system was already a frame system.** Everything data-driven
   (bbox, projection, gazetteer, layers, corridors) scaled to a state
   unchanged; only three things assumed city scale — the camera floors in
   `viewsFor`, the fog constants, and the hard-coded loader maps. Adding a
   frame is now a known recipe: config block + 3 loader lines + test-list
   entry + two build scripts. Nevada/Arizona are cheap follow-ons.
2. **Parallel edits to one file race, and build logs won't tell you.** The
   three loader edits were first issued concurrently with the fog edit;
   the tool reported success for all, but last-writer-wins silently kept
   only the fog change. The first `california-subsurface.xdc` therefore
   built "successfully" as a hollow bundle (25 entries, no California
   packs, engine that would throw `unknown city: california`). It was
   caught by grepping the bundle's contents, not the build output — then
   fixed with sequential edits and a rebuild (27 entries). Rule: after
   multi-part edits to a shared file, verify the artifact, not the log;
   never batch same-file edits in parallel.
3. **Starter-register discipline scales better than bulk imports.** Sixteen
   rows with per-row named sources beat a scraped thousand-row dump with
   none: the Lawrence/Kansas City packs show what `VERIFIED=1` costs
   (per-ID GNIS cross-checks), and California's register is explicit that
   it has not paid that cost yet. The test now fails if a future edit
   quietly upgrades a row's tier or drops its source note.
4. **Wikipedia title traps are real data-quality hazards.** Three of the
   sixteen lookups first landed wrong: `Casa_Pacifica` does not exist
   (the article is `La_Casa_Pacifica`), `Robert_Mondavi_Winery` redirects
   to the founder's biography, which carries no coordinates (the row uses
   Oakville, with the winery named as exemplar), and
   `Stow_House_(Goleta,_California)` does not exist (article: `Stow_House`).
   Coordinates were only accepted from pages whose subject matched the row.
5. **A one-line 1994 BBS listing outranks a famous namesake.** Search
   results for "Keyhole BBS" are dominated by Keyhole, Inc.; the actual
   board only surfaces inside the textfiles.com USBBS corpus. For
   BBS-era referents, go to the list files first.

## Verification notes

- Every California coordinate was transcribed from a fetched source on
  2026-10-22 (article infoboxes / EPA profile / lodge data); elevations
  only where the source prints them (Oakville 47 m, Morris Dam normal
  pool 351 m), else `null`. No GNIS FEATURE_ID was looked up, inferred, or
  fabricated — `validateRows` enforces `VERIFIED=0 ⇒ gnis null` at build.
- Existing-city regression proof: after the `viewsFor` change,
  `node scripts/build-city-subsurface.mjs` regenerated all six frames and
  `git status` showed **no modification** to any pre-existing city file.
- Gated items unchanged: no java/dosbox/Xvfb in sandbox (17 mealplan
  sim failures, S7 uClinux fax JAR); Warrick/DOSBox relay + S5/S8/S13
  external hosts (F3); HVD/Puzzle Code glyph tiles await font/image terms.

## Test tally at round-15 close

| Suite | Result |
| --- | --- |
| `tests/city-subsurface.test.mjs` (5 tests, incl. new California contract test; shared test now covers 6 frames incl. xdc byte-currency) | 5 PASS |
| full `node --test tests/*.test.mjs` | 707 tests: 677 pass, 12 skipped, 18 fail = 17 JDK-environmental sim cases (pre-existing) + 1 wiki page-count case that goes green with the `build:wikiinajar` rebuild in this same commit |
| full `vitest run` | 35 files, 307/307 PASS |
| live preview (vite, port 5173) | `/california-subsurface.html` served from the working tree |

## Next (round 16)

- S4: GNIS-verified California extract (Lawrence/Kansas City treatment:
  per-ID cross-checked rows), then Nevada + Arizona frames via the new
  recipe; bulk layers (Nike sites statewide, UC/CSU, ranchos, mine maps)
  only with per-row source registers.
- S6: scope the consumer historical-network viewer so ARPANET/FidoNet/
  payphone datasets have somewhere to land; second independent listing
  for the Denver Keyhole BBS (FidoNet nodelists / Boardwatch, F3 rules).
- S7 stays blocked on external artifacts (binary/JDK/teardown/drivers).
- Gated, unchanged: DOSBox sneakers smoke; Warrick relay runs; JDK
  toolchain items (mealplan sim, uClinux fax JAR); S5/S8/S13 hosts (F3).
