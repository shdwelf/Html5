# Backlog execution — Round 26 (2026-10-23)

Continues the agent backlog on branch `arena/ed5d4b7c-html5` (PR #139).
This round extends T4.1 batch 9 (Illinois + Indiana, configurations
29–30) on the two-surface GNIS pipeline, and repairs a round-24 data
defect found while hardening the batch tests.

## Outcomes

- **T4.1 batch 9 — Illinois + Indiana (partial; configurations 29–30).**
  Twelve all-GNIS `VERIFIED=1` starter rows per state (six populated
  places, one state high point, two–three lakes, two–three river-mouth
  streams), generated pages/data/gazetteers, `*.xdc` (75 entries),
  engine loaders, and `public/apps/` mirrors via
  `npm run build:city-subsurface`. Evidence:
  `resources/city-subsurface/gnis-state-batch9-source-register-2026-10-23.json`.
- **Batch-7 register repair.** Hardening the county assertions exposed
  a builder defect from round 24: the batch-7 register's
  `geocoderCounty` values were truncated to single letters (a stray
  `[0]` index on a comprehension in the one-off builder). The correct
  county strings were restored in
  `resources/city-subsurface/gnis-state-batch7-source-register-2026-10-23.json`,
  and the batch-7/8/9 tests now assert the full invariant
  (`geocoderCounty === county + " County"`, with the St. Louis →
  "Saint Louis County" styling preserved verbatim). Lesson recorded:
  provenance fields need semantic asserts, not truthiness asserts; the
  builder-side county table also received a full audit after several
  template slips were caught in review.

## Identity decisions worth remembering

- Charles Mound (1,235 ft) and Hoosier Hill (1,257 ft) carry per-ID
  checks; Hoosier Hill `1851956` is adjacent to round 24's Hawkeye
  Point `1851955` in the high-point record series.
- Monroe Lake is the official name order; `Lake Monroe` screens empty
  (Vermilion Lake precedent, round 24).
- Mississippi River, Ohio River, and Lake Michigan screen empty under
  both IL and IN and remain corridors (the Ohio record returns under
  another state's association; the Michigan record is Michigan's,
  held to starter scope in round 25).
- Illinois's narrow frames sit exactly on the generator's overview
  `Math.max(20, 32)` floors; the batch-9 test asserts the generator
  contract (`>=`) instead of the wider states' incidental exceedance.
- Starter-scope holds: Joliet, Waukegan (IL); Gary (IN).

## Test tally at round-26 close

| Suite | Result |
| --- | --- |
| `npm run build:city-subsurface` | PASS — 30 frames built; Illinois/Indiana each report 12 gazetteer rows (12 verified), 5 corridors, 4 nodes; every city XDC has 75 entries |
| `node --test tests/city-subsurface.test.mjs` | 16/16 PASS (includes the batch-7 register repair verification via the hardened county invariant) |
| `npm run build:wikiinajar` | PASS — 242 Markdown files converted to Wiki pages; `wikiinajar.xdc` rebuilt |
| Full `node --test tests/*.test.mjs` | 804 tests: 791 pass, 10 skipped, 3 fail — the same pre-existing CyberChef registry/SFX sandbox failures as rounds 24–25 (identical on pristine `main`); no city-suite regressions |

## Next

- Ohio eastward next, then Missouri/Oklahoma/Texas and the remaining
  states in dated per-row batches, then the country/PC Globe thread.
- PR #138 (T1.3 + iParty Ghidra strand) still awaits the user's merge
  decision on its own branch.
- Keep bulk California themes and archived-class features behind their
  own explicit source decisions.
