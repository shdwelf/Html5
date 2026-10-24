# Backlog execution — round 35 (2026-10-23)

Branch: `arena/0f04e91f-html5` (PR #141). Reconciliation round. This
branch had been executing “Continue backlog” as its own South Carolina
round (internally round 29, GNIS batch 12) while **two** other sessions
ran in parallel: PR #139 (rounds 29–33, merged first) and PR #142
(claimed round 34 for Maryland/Delaware, batch 16, merged while this PR
was in review). Both of those round numbers were taken before this
record could land, so it adopts round 35. Prior records:
[`backlog-execution-round-33-2026-10-23.md`](backlog-execution-round-33-2026-10-23.md),
[`backlog-execution-round-34-2026-10-23.md`](backlog-execution-round-34-2026-10-23.md).

## The collision

| | PR #141 branch (this branch) | PR #139 (merged, main) |
| --- | --- | --- |
| South Carolina frame | Own generation: 12 rows incl. North Charleston `1225072`, Rock Hill `1250417`, Santee River `1250783` | Canonical generation (config 34): 12 rows incl. Myrtle Beach `1249770`, Lake Moultrie `1230046`, Congaree River `1249468` |
| Register | `gnis-state-batch12-source-register-2026-10-23.json` (SC) | `gnis-state-batch14-source-register-2026-10-23.json` (NC/SC); batch 12 = Kentucky–Tennessee |
| Round record | `backlog-execution-round-29-…` (SC) | `backlog-execution-round-29-…` (KY/TN) … through round 34 (MD/DE, PR #142) |

Both South Carolina generations applied the standing identity rules
(exact official name, compatible returned type, state, returned primary
county, permanent FEATURE_ID, returned primary point; points never
described as boundaries/shorelines/channels) and both verified 12/12
rows.

## Resolution — main-preferred, twice

PR #139's round-33 record set the precedent (“PRs #137/#140 had built …
in parallel; main's copies are kept”). This branch applied the same
rule to **both** merges:

1. **Merge of `efce379` (PR #139):** all 153 conflicts resolved to
   `origin/main` — main's South Carolina frame, batch numbering
   (batch 12 = Kentucky–Tennessee), tests, README, and rounds 29–33
   records kept; this branch's duplicate SC frame, batch-12 SC
   register, and round-29 record dropped.
2. **Merge of `e37c6c1` (PR #142):** binaries and their round-34 record
   taken from main; the backlog statuses kept both blocks — theirs
   holds label 34 (Maryland/Delaware), this record takes 35.

## Evidence transferred from the dropped generation

The parallel screen's unique findings were moved into main's
South Carolina evidence, lockstep between
`resources/city-subsurface/cities.json` and the batch-14 register (the
city test asserts the register reproduces the generated rows exactly):

1. **Sassafras Mountain elevation, both figures disclosed.** The
   register's own known limitation noted that the DomesticNames text
   layout carries no elevation columns and that its 3,553-foot figure is
   a USGS-published value. This branch re-fetched the official USGS
   *Elevations and Distances* table (2026-10-23): it publishes
   **South Carolina | Sassafras Mountain | Pickens | 3,560** — the very
   same table that supplies this batch's Mount Mitchell (6,684) and
   Kuwohi (6,643) citations. The row note, node fact, register
   `frameNote`, row `sourceNote`, and `knownLimitations` now carry both
   3,560 feet (current table, fetched date) and 3,553 feet (earlier
   USGS-published material), neither silently dropped; tests pin both.
2. **Savannah River stale text replaced with the live cross-reference.**
   The row said the river “remains a corridor in Georgia (no Georgia
   frame exists yet …)” — false once PR #140's Georgia frame landed with
   its batch-11 `savannah-river` corridor. The note now cites that
   corridor on the same FEATURE_ID 1253486 and the batch-11 disclosure
   that the states=GA Geocoder screen returned an empty array, making
   this SC-associated record the only seeded instance; a test pins the
   `states=GA` disclosure.
3. **Rock Hill census-class tie-break preserved as a known
   limitation.** The parallel screen resolved the two Rock Hill records
   (York County `1250417`, census class P1, GSA/OPM 2200 vs Fairfield
   County `1231736`, census class U6, returned first, ~78 km apart;
   neither seeded) and verified North Charleston `1225072` and Santee
   River `1250783` as alternates — recorded in the batch-14 register's
   `knownLimitations` so the batch-12 census-class rule survives the
   frame that shipped.

## Rebuilds and verification (see PR #141 for the live table)

- `npm run build:city-subsurface` — all **49 Webxdc bundles** rebuilt
  from the merged, patched sources (Maryland/Delaware from PR #142 plus
  the patched South Carolina packs everywhere).
- `npm run build:wikiinajar` — **251 Markdown files** (250 plus this
  record).
- City tests **27/27**; full `node --test` and `vitest run` results in
  the PR table (main's baselines: Node 814 = 802/12/0 at round 33,
  vitest 307/307).

## Next

- Queue per round 34: **nine state frames remain** (AK, CT, HI, ME, MA,
  NH, NJ, RI, VT), then the country/planet thread.
- Any future parallel-session duplicate of a frame resolves
  main-preferred, with the losing generation's unique evidence
  transferred into the winning frame's notes/register rather than
  discarded wholesale.
