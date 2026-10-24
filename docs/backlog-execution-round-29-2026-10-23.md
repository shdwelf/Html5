# Backlog execution round 29 — 23 Oct 2026

*Twenty-ninth round: “Continue backlog.” This round follows the
round-28 queue entry: the South Atlantic seaboard continues with
**South Carolina**, the state immediately north of Georgia on the
Atlantic coast. Index:
[`agent-backlog-2026-10-21.md`](agent-backlog-2026-10-21.md).
Previous rounds: [27](backlog-execution-round-27-2026-10-23.md) ·
[28](backlog-execution-round-28-2026-10-23.md).*

## Scoping decision

Rounds 20–28 handed the queue the same instruction: remaining states in
**dated, per-row GNIS source-register batches**. Round 29 continues the
South Atlantic thread with **South Carolina**, immediately north of the
round-28 Georgia frame. The identity rule is unchanged: exact official
name, compatible returned type, intended state, returned primary county,
permanent FEATURE_ID, and returned primary point must all identify the
feature before `VERIFIED=1`; points are never described as boundaries,
shorelines, lake polygons, or river centerlines; ambiguous, mismatched,
duplicate, empty-screen, or out-of-reach features stay unseeded or
become generalized `context` corridors.

## Delivered

| Frame | Result |
| --- | --- |
| **South Carolina** (`southcarolina`) | Configuration 34. Twelve all-GNIS rows: Columbia, Charleston, North Charleston, Rock Hill, Greenville, Spartanburg, Sassafras Mountain, Lake Marion, Lake Murray, Savannah River, Santee River, Pee Dee River. Five context corridors (I-26, I-20, I-95, I-77, Savannah River reach) and four GNIS-backed nodes; labelled generalized Atlantic coast line (eight points, Grand Strand to the Georgia line). |
| [`../resources/city-subsurface/gnis-state-batch12-source-register-2026-10-23.json`](../resources/city-subsurface/gnis-state-batch12-source-register-2026-10-23.json) | Machine-readable batch-12 register: row-level FEATURE_IDs, returned Geocoder types/counties, stored points, source notes, selection rules (the duplicate rule now covers census-class splits as well as description locators), ten identity decisions, and limitations. The city test reconstructs every generated row from it exactly. |
| Generated apps | Root page, data/gazetteer packs, public staged app, and Webxdc bundle for South Carolina. Every city XDC now contains **83 entries** (34 data + 34 gazetteer packs plus the shared shell/vendor set); southcarolina-subsurface.xdc is 544,246 bytes, sha256 `988ec75183f89aed…`. |
| Docs/backlog | `city-subsurface.md`, root README, backlog MD/JSON, docs index, and the Wiki archive describe thirty-four configurations and the batch-12 evidence. |

## Identity findings

- **The high point has no GNIS description — and says so.** Sassafras
  Mountain (`1015279`) returned a single exact Summit record in Pickens
  County; the per-ID check against the official `gaznames_default` REST
  layer confirmed `gaz_featureclass` Summit, feature code 15048, and
  stored `gaz_elevation` 1078, but the **description field is empty** —
  unlike Woodall, Cheaha, and Brasstown, this record carries no
  “Highest elevation…” sentence and no High Point designation text in
  that layer. The 3,560-foot figure is therefore sourced from the
  official USGS *Elevations and Distances* table (Sassafras Mountain,
  Pickens, 3,560 feet) — a separate USGS publication — and the row note
  discloses the split provenance rather than inventing a GNIS quote.
- **Rock Hill resolved by census class, not description.** The screen
  returned two same-name populated places ~78 km apart: York County
  `1250417` (census class **P1**, GSA/OPM codes 2200 — the incorporated
  city) and Fairfield County `1231736` (census class **U6**,
  unincorporated — returned *before* the York record, behind the
  division). The register’s duplicate rule now covers both patterns:
  description locators where they exist (Lake Oconee, round 28), census
  class and government codes where descriptions are empty (this pair).
- **Savannah River crosses state lines in the evidence.** The
  `states=SC` screen returned the exact Jasper County record
  `1253486` — the same FEATURE_ID whose `states=GA` screen in batch-11
  returned an empty array and which surfaced only on Georgia’s no-state
  national screen. South Carolina seeds the record in its home state,
  and both the row note and the corridor carry the cross-reference.
- **The Lake Murray trap.** The screen led with Lake Murray **Shores**
  (a Saluda County populated place) and also returned the Lake Murray
  of Richland census record; the Lexington County Lakes & Reservoirs
  record `1224900` is the intended impoundment.
- **County/census-division piles across all six cities.** Columbia
  (division, canal, reservoir, historical air base), Charleston
  (division, county, an Abbeville County same-name crossroads, farms,
  heights, harbor, census division), North Charleston (division,
  historical Air Force Station), Greenville, and Spartanburg (county +
  division each) — every rejected FEATURE_ID named in the row notes.
- **Santee and Pee Dee seeded as single exact streams** (Georgetown and
  Chesterfield sequences); Lake Marion likewise returned first with no
  twins.

## Test tally at round-29 close

| Suite | Result |
| --- | --- |
| `npm run build:city-subsurface` | PASS — 34 frames built; South Carolina reports 12 gazetteer rows (12 verified), 5 corridors, 4 nodes; every city XDC has 83 entries |
| `node --test tests/city-subsurface.test.mjs` | 19/19 PASS (batch-12 plus the bit-exact overview mirrors) |
| Full `node --test tests/*.test.mjs` | 807 tests: 795 pass, 12 skipped, 0 fail |
| Full `vitest run` | 35 files, 307/307 PASS |
| `npm run build:wikiinajar` | PASS — 245 Markdown files converted to Wiki pages; `wikiinajar.xdc` rebuilt |

## Next

- South Atlantic continues: **North Carolina** next (the state directly
  north of this frame), then Virginia and the remaining seaboard states
  northward, Florida's peninsula frames, then the country/PC Globe
  thread.
- Keep bulk California themes and archived-class features behind their
  own explicit source decisions.
- Unchanged from round 19: relay official current Temurin 8/21,
  evaluate OpenJVM-Wasm only in isolation, keep Ghidra distributions
  on CI/relay.
- S6 still needs lawfully redistributable historical snapshots; S7
  remains blocked on its missing binary/teardown/driver artifacts.
- Carry the count-gate lesson (round 28) forward: any op-count change
  updates all five CyberChef count sites or the suites go red.
