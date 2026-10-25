# Backlog execution — round 33 (2026-10-23): PR #139 merge reconciliation

Branch: `arena/ed5d4b7c-html5` (PR #139). This round merges PR #139
into main after two Arena sessions extended the SoCal GNIS atlas in
parallel from the same base commit (`d66e052`).

## What happened

- main advanced through PR #137 (GNIS state batches through
  Mississippi/Alabama, plus Minnesota/Louisiana) and PR #140 (Georgia),
  reaching 33 city configurations.
- PR #139 (this branch) had independently built batches 7–15 up to
  Georgia/Florida (rounds 24–32 on this branch), reaching 42
  configurations. A merge attempt reported 253 conflicted paths.
- The user chose: **merge #139, prefer main, keep only the
  non-duplicated work.**

## Resolution

- Merge commit `776ebd7` merged `origin/main` into this branch with
  every conflict resolved in main's favour (main's engine,
  `cities.json`, tests, docs, backlog, and batch 2–11 registers are
  authoritative; main's Minnesota, Iowa, Missouri, and Georgia frames
  supersede this branch's parallel builds of the same states).
- The follow-up integration retained only what main lacked: the 14
  statewide frames Wisconsin, Michigan, Illinois, Indiana, Ohio,
  Pennsylvania, Arkansas, Kentucky, Tennessee, Virginia, West
  Virginia, North Carolina, South Carolina, and Florida — now
  configurations 34–47, 12/12 GNIS `VERIFIED=1` rows each.
- Their evidence registers were restored as
  `gnis-state-batch{8,9,10,11}-source-register-2026-10-23-pr139.json`
  (the `-pr139` suffix avoids colliding with main's same-numbered
  batch files), joining the non-colliding batch 12–15 registers.
  In batch 15 only Florida is retained; its Georgia frame is
  superseded by main's batch-11 Georgia register.
- The gazetteer gained the `Ridge` class (Arkansas' Magazine
  Mountain), and PR #139's GNIS extraction pipeline
  (`tools/gnis_extract.py`, `.arena-gnis/candidates.json`,
  `arena-gnis-fetch.yml`) plus the cumulative candidate extract
  (`gnis-candidates-batch7.json`) were kept for provenance.
- This branch's MN/IA, WI/MI … GA/FL round docs 29–32 remain in the
  branch history; `docs/city-subsurface.md` Round 33 records the
  reconciled atlas.

## Verification

- City suite: 26/26 (`tests/city-subsurface.test.mjs`, including the
  eight retained-batch tests ported onto main's test file).
- Full Node suite: 814 tests = 802 pass / 12 skipped / 0 fail.
- `wikiinajar.xdc` rebuilt after the doc updates.
