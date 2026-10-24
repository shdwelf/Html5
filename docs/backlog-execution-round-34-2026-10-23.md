# Backlog execution — round 34 (2026-10-23)

Branch: `arena/0f04e91f-html5` (PR #141). Reconciliation round after
PR #139 merged into main (round 33's record:
[`backlog-execution-round-33-2026-10-23.md`](backlog-execution-round-33-2026-10-23.md)).
This branch had been executing “Continue backlog” as its own
South Carolina round (internally round 29, GNIS batch 12) while PR #139
ran in parallel with rounds 29–33; the branch's round-29/batch-12
identity was superseded on main, so this record adopts the next free
round number.

## The collision

| | PR #141 branch (this branch) | PR #139 (merged, main) |
| --- | --- | --- |
| South Carolina frame | Own generation: 12 rows incl. North Charleston `1225072`, Rock Hill `1250417`, Santee River `1250783` | Canonical generation (config 34): 12 rows incl. Myrtle Beach `1249770`, Lake Moultrie `1230046`, Congaree River `1249468` |
| Register | `gnis-state-batch12-source-register-2026-10-23.json` (SC) | `gnis-state-batch14-source-register-2026-10-23.json` (NC/SC); batch 12 = Kentucky–Tennessee |
| Round record | `backlog-execution-round-29-…` (SC) | `backlog-execution-round-29-…` (KY/TN) … through round 33 |

Both generations applied the standing identity rules (exact official
name, compatible returned type, state, returned primary county,
permanent FEATURE_ID, returned primary point; points never described as
boundaries/shorelines/channels) and both verified 12/12 rows.

## Resolution — main-preferred

PR #139's round-33 record already set the precedent (“PRs #137/#140 had
built … in parallel; main's copies are kept”). This branch applied the
same rule everywhere: `git merge origin/main` with **every conflict
resolved to origin/main** (153 files: `cities.json`, the city tests,
the engine loaders, README/backlog/docs, both South Carolina
generations, all Webxdc binaries). The branch's duplicate South Carolina
frame, its batch-12 register, and its round-29 record were dropped in
favour of main's frame, batch numbering (batch 12 stays
Kentucky–Tennessee), and PR #139's rounds 29–33.

## Evidence transferred from the dropped generation

The parallel screen's unique findings were moved into main's
South Carolina evidence, lockstep between `resources/city-subsurface/cities.json`
and the batch-14 register (the city test asserts the register reproduces
the generated rows exactly):

1. **Sassafras Mountain elevation, both figures disclosed.** The
   register's own known limitation noted that the DomesticNames text
   layout carries no elevation columns and that its 3,553-foot figure is
   a USGS-published value. This branch re-fetched the official USGS
   *Elevations and Distances* table (2026-10-23): it publishes
   **South Carolina | Sassafras Mountain | Pickens | 3,560** — from the
   very same table that supplies this batch's Mount Mitchell (6,684) and
   Kuwohi (6,643) citations. The row note, node fact, register
   `frameNote`, row `sourceNote`, and `knownLimitations` now carry both
   3,560 feet (current table, fetched date) and 3,553 feet (earlier
   USGS-published material), neither silently dropped; the test pins
   both values.
2. **Savannah River stale text replaced with the live cross-reference.**
   The row note said the river “remains a corridor in Georgia (no
   Georgia frame exists yet …)” — false once PR #140's Georgia frame
   landed with its batch-11 `savannah-river` corridor. The note now
   cites that corridor on the same FEATURE_ID 1253486 and the
   batch-11 disclosure that the states=GA Geocoder screen returned an
   empty array, making this SC-associated record the only seeded
   instance; a test pins the `states=GA` disclosure.
3. **Rock Hill census-class tie-break preserved as a known
   limitation.** The parallel screen resolved the two Rock Hill records
   (York County `1250417`, census class P1, GSA/OPM 2200 vs Fairfield
   County `1231736`, census class U6, returned first, ~78 km apart;
   neither seeded) and verified North Charleston `1225072` and Santee
   River `1250783` as alternates — recorded in the batch-14 register's
   `knownLimitations` so the batch-12 census-class rule survives the
   frame that shipped.

## Rebuilds and verification

- `npm run build:city-subsurface` — **47 Webxdc bundles** rebuilt from
  the patched sources (southcarolina-subsurface.xdc regenerated;
  e.g. florida-subsurface.xdc 612,807 bytes / 109 entries, sha256
  `cef34a45…`).
- `npm run build:wikiinajar` — **250 Markdown files** → wiki pages,
  `wikiinajar.xdc` sha256 `952dd8c0…` (249 before this record).
- `node --test tests/city-subsurface.test.mjs` — **26/26 PASS**
  (main's suite; three new assertions added in the Carolina test).
- Full `node --test tests/*.test.mjs` and `vitest run` — see PR #141
  table; main's baseline was 814 = 802/12/0 and 307/307.

## Next

- Queue per round 33: the country/planet thread; the seaboard states
  are complete through Florida.
- Any future parallel-session duplicate of a frame resolves
  main-preferred, with the losing generation's unique evidence
  transferred into the winning frame's notes/register rather than
  discarded wholesale.
