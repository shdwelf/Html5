# Backlog execution round 23 — 23 Oct 2026

*Twenty-third round: “Continue backlog.” This round continues the S4
geographic queue immediately after the round-22 Dakotas batch.
Index: [`agent-backlog-2026-10-21.md`](agent-backlog-2026-10-21.md).
Previous rounds: [21](backlog-execution-round-21-2026-10-23.md) ·
[22](backlog-execution-round-22-2026-10-23.md).*

## Scoping decision

Rounds 20, 21, and 22 all handed the queue the same instruction: remaining
states in **dated, per-row GNIS source-register batches**. Round 23 takes
the **Central Plains batch — Nebraska and Kansas**, which the round-22
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
| **Nebraska** (`nebraska`) | Configuration 23. Twelve all-GNIS rows: Lincoln, Omaha, Grand Island, Kearney, Scottsbluff, North Platte, Lake McConaughy, Panorama Point, Scotts Bluff (Summit), Platte River, Niobrara River, and North Platte River. Four context corridors (I-80, US 30, Platte system, Missouri) and four GNIS-backed nodes. |
| **Kansas** (`kansas`) | Configuration 24. Twelve all-GNIS rows: Topeka, Wichita, Kansas City (KS side), Dodge City, Lawrence, Hays, Mount Sunflower, Tuttle Creek Lake, Milford Lake, Kansas River, Republican River, and Smoky Hill River. Four context corridors (I-70, I-35, Missouri, Arkansas) and four GNIS-backed nodes. |
| [`../resources/city-subsurface/gnis-state-batch6-source-register-2026-10-23.json`](../resources/city-subsurface/gnis-state-batch6-source-register-2026-10-23.json) | Machine-readable batch-6 register: row-level FEATURE_IDs, returned Geocoder types/counties, stored points, source notes, selection rules, eleven identity decisions (including one known service discrepancy), and limitations. The city test reconstructs every generated row from it exactly. |
| Generated apps | Root pages, data/gazetteer packs, public staged apps, and Webxdc bundles for both states. Every city XDC now contains 63 entries (24 data + 24 gazetteer packs plus the shared shell/vendor set). |
| Docs/backlog | `city-subsurface.md`, root README, backlog MD/JSON, docs index, and the Wiki archive describe twenty-four configurations and the batch-6 evidence. |

## Identity findings

- **Both high points needed per-ID detail checks.** GNIS Domestic Names
  confirms Panorama Point (`1851953`) is Class=Summit, Primary
  County=Kimball County, coordinate sequence 1 marked **High Point** at
  the stored point, description “Highest elevation in NE at 5424 feet”;
  and Mount Sunflower (`484933`) is Class=Summit, Wallace County,
  sequence 1 marked High Point, description “Highest elevation in KS at
  4039 feet”. Both coordinates match the Geocoder exactly.
- **Lincoln is the precinct trap.** The populated place `837279` is
  seeded; the many same-name Lincoln Election Precinct records and the
  Lincoln County record `835877` are rejected. Kearney rejects Kearney
  County `835871` and historical Kearney City `1873810`; Omaha rejects
  Omaha Reservation `834985` and Omaha Regency `1900411`.
- **Grand Island is one name, two features.** The Hall County populated
  place `829622` is seeded; the same-name Buffalo County Islands record
  `829621` is rejected in its note.
- **Scottsbluff and Scotts Bluff both seed — as different features.** The
  one-word town `833318` and the two-word Summit `835997` carry distinct
  names, classes, and points; each note names the other FEATURE_ID and
  the Scotts Bluff County record `835900` it does not verify. The test
  proves the points differ. The same split holds for North Platte town
  `831719` versus North Platte River `204647` (with precinct `1929109`
  and canal `831720` rejected).
- **The big rivers stay corridor-only.** Missouri River screens returned
  empty under both `states=NE` and `states=KS`; Republican River was
  empty under `states=NE`; Arkansas River was empty under `states=KS`,
  matching the round-18 Colorado empty screen for the same intended
  stream. The Kansas Republican and Smoky Hill records *are* seeded —
  both at the Geary County confluence area, about 22 metres apart, each
  note naming the other.
- **Kansas City has two sides.** The Wyandotte County Kansas record
  `478635` seeds in the Kansas frame; the Missouri-side record `748198`
  remains in the Kansas City city frame. The test proves their points
  differ.
- **The Kansas River is a multipoint record with a service discrepancy.**
  The batch stores the `states=KS` Wyandotte point; the same FEATURE_ID
  `485184` appears in the Kansas City frame (county “Multiple counties”)
  and the Lawrence frame (Douglas) from earlier extractions. All three
  are the same official record at different returned sequences, and none
  is a channel trace — recorded in the register as a known discrepancy.
- **Salina is identity-safe but starter-scope.** The screen returned one
  clean populated-place record; the 12-row starter omits it under the
  same treatment as Rogue River (round 20) and Belle Fourche river/
  reservoir (round 22), and the decision is recorded.

## Test tally at round-23 close

| Suite | Result |
| --- | --- |
| `npm run build:city-subsurface` | PASS — 24 frames built; Nebraska/Kansas each report 12 gazetteer rows (12 verified), 4 corridors, 4 nodes; every city XDC has 63 entries |
| `node --test tests/city-subsurface.test.mjs` | 13/13 PASS |
| `npm run build:wikiinajar` | PASS — 218 Markdown files converted to Wiki pages; `wikiinajar.xdc` rebuilt |
| Full `vitest run` | 35 files, 307/307 PASS |
| Full `node --test tests/*.test.mjs` | 726 tests: 716 pass, 10 skipped, 0 fail |

## Next

- Remaining plains/mountain states next in dated per-row batches, then
  the country/PC Globe thread.
- Keep bulk California themes and archived-class features behind their own
  explicit source decisions.
- Unchanged from round 19: relay official current Temurin 8/21, evaluate
  OpenJVM-Wasm only in isolation, keep Ghidra distributions on CI/relay.
- S6 still needs lawfully redistributable historical snapshots; S7 remains
  blocked on its missing binary/teardown/driver artifacts.
