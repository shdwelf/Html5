# Backlog execution round 22 — 23 Oct 2026

*Twenty-second round: “Continue backlog.” This round continues the S4
geographic queue immediately after the round-21 Northern Rockies batch.
Index: [`agent-backlog-2026-10-21.md`](agent-backlog-2026-10-21.md).
Previous rounds: [20](backlog-execution-round-20-2026-10-23.md) ·
[21](backlog-execution-round-21-2026-10-23.md).*

## Scoping decision

Rounds 20 and 21 both handed the queue the same instruction: remaining
states in **dated, per-row GNIS source-register batches**. Round 22 takes
the **Dakotas batch — North Dakota and South Dakota**, which the round-21
record named as the next step.

The identity rule is unchanged: exact official name, compatible returned
type, intended state, returned primary county, permanent FEATURE_ID, and
returned primary point must all identify the feature before `VERIFIED=1`;
points are never described as boundaries, shorelines, lake polygons, or
river centerlines; ambiguous or state-screen-unreturned features stay
unseeded or become generalized `context` corridors.

## Delivered

| Frame | Result |
| --- | --- |
| **North Dakota** (`northdakota`) | Configuration 21. Twelve all-GNIS rows: Bismarck, Fargo, Grand Forks, Minot, Williston, Dickinson, Devils Lake town + Devils Lake lake (separate classes, distinct points), Lake Sakakawea, White Butte, Sheyenne River, and Heart River. Four context corridors (I-94, I-29, Missouri, Red River) and four GNIS-backed nodes. |
| **South Dakota** (`southdakota`) | Configuration 22. Twelve all-GNIS rows: Pierre, Sioux Falls, Rapid City, Aberdeen, Mitchell, Yankton, Belle Fourche, Black Elk Peak, Lake Oahe, Bad River, Cheyenne River, and James River. Four context corridors (I-90, I-29, Missouri, Cheyenne) and four GNIS-backed nodes. |
| [`../resources/city-subsurface/gnis-state-batch5-source-register-2026-10-23.json`](../resources/city-subsurface/gnis-state-batch5-source-register-2026-10-23.json) | Machine-readable batch-5 register: row-level FEATURE_IDs, returned Geocoder types/counties, stored points, source notes, selection rules, ten identity decisions, and limitations. The city test reconstructs every generated row from it exactly. |
| Generated apps | Root pages, data/gazetteer packs, public staged apps, and Webxdc bundles for both states. Every city XDC now contains 59 entries (22 data + 22 gazetteer packs plus the shared shell/vendor set). |
| Docs/backlog | `city-subsurface.md`, root README, backlog MD/JSON, docs index, and the Wiki archive describe twenty-two configurations and the batch-5 evidence. |

## Identity findings

- **White Butte needed a per-ID detail check.** The exact-name Summit
  screen returned four records: Slope `1035239`, Hettinger `1032775`,
  Morton `2761541`, and Stark `1032774`. GNIS Domestic Names confirms
  `1035239` is Class=Summit, Primary County=Slope County, coordinate
  sequence 1 marked **High Point** at the stored point (Amidon map), with
  the description "Highest elevation in ND at 3506 feet"; coordinate
  matches the Geocoder exactly. The other three are rejected.
- **Black Elk Peak carries its own rename history.** The per-ID check
  confirms Class=Summit, Pennington County, sequence 1 marked High Point,
  and the Board on Geographic Names' 2016 rename from Harney Peak. The
  former name returns an empty screen under `states=SD`, so the row name
  is the current official name with the history in the note.
- **Devils Lake is one name, two features, both seeded.** The Ramsey
  County populated place (`1028672`) and lake (`1034194`) carry distinct
  classes and distinct points; each note names the other FEATURE_ID it
  does not verify, and the test proves the points differ.
- **The Dakotas' big rivers are corridor-only.** Missouri River screens
  returned empty under both `states=ND` and `states=SD`; the Red River
  was screened under both `Red River` and the official `Red River of the
  North` name and returned empty both times; the North Dakota James River
  screen was empty while the unique South Dakota Yankton County James
  River record (`1261082`) is seeded only in South Dakota.
- **Sioux Falls is a town, not a waterfall.** The populated place
  `1267670` is seeded; same-name falls `1258087` and junction `1261066`
  are rejected. Mitchell rejects its two same-name lakes; Yankton rejects
  its county and reservation records; Cheyenne River rejects the
  reservation record.
- **Belle Fourche keeps its town only.** The river (`1265120`) and
  reservoir (`1253838`) are identity-safe but out of the 12-row starter,
  the same starter-scope treatment as Rogue River in round 20.
- **Badlands National Park and Lake Sheridan have no rows.** Both
  exact-name `states=SD` screens returned empty arrays.

## Test tally at round-22 close

| Suite | Result |
| --- | --- |
| `npm run build:city-subsurface` | PASS — 22 frames built; North Dakota/South Dakota each report 12 gazetteer rows (12 verified), 4 corridors, 4 nodes; every city XDC has 59 entries |
| `node --test tests/city-subsurface.test.mjs` | 12/12 PASS |
| `npm run build:wikiinajar` | PASS — 217 Markdown files converted to Wiki pages; `wikiinajar.xdc` rebuilt |
| Full `vitest run` | 35 files, 307/307 PASS |
| Full `node --test tests/*.test.mjs` | 725 tests: 715 pass, 10 skipped, 0 fail |

## Next

- Nebraska–Kansas is the natural next pair (the round-21 record named the
  Dakotas first, then Nebraska–Kansas); after that the remaining
  plains/mountain states before the country/PC Globe thread.
- Keep bulk California themes and archived-class features behind their own
  explicit source decisions.
- Unchanged from round 19: relay official current Temurin 8/21, evaluate
  OpenJVM-Wasm only in isolation, keep Ghidra distributions on CI/relay.
- S6 still needs lawfully redistributable historical snapshots; S7 remains
  blocked on its missing binary/teardown/driver artifacts.
