# Backlog execution round 25 — 23 Oct 2026

*Twenty-fifth round: “Continue backlog.” This round continues the S4
geographic queue immediately after the round-24 Southern Plains batch.
Index: [`agent-backlog-2026-10-21.md`](agent-backlog-2026-10-21.md).
Previous rounds: [23](backlog-execution-round-23-2026-10-23.md) ·
[24](backlog-execution-round-24-2026-10-23.md).*

## Scoping decision

Rounds 20–24 all handed the queue the same instruction: remaining states
in **dated, per-row GNIS source-register batches**. Round 25 takes the
**West North Central remainder — Iowa and Missouri**, the first option
the round-24 record named as the next step (Minnesota closes that census
division in a later batch).

The identity rule is unchanged: exact official name, compatible returned
type, intended state, returned primary county, permanent FEATURE_ID, and
returned primary point must all identify the feature before `VERIFIED=1`;
points are never described as boundaries, shorelines, lake polygons, or
river centerlines; ambiguous, mismatched, or state-screen-unreturned
features stay unseeded or become generalized `context` corridors.

## Delivered

| Frame | Result |
| --- | --- |
| **Iowa** (`iowa`) | Configuration 27. Twelve all-GNIS rows: Des Moines, Cedar Rapids, Davenport, Iowa City, Sioux City, Dubuque, Hawkeye Point, West Okoboji Lake, Saylorville Lake, Lake Red Rock, Des Moines River, and Iowa River. Four context corridors (I-80, I-35, Mississippi, Missouri) and four GNIS-backed nodes. |
| **Missouri** (`missouri`) | Configuration 28. Twelve all-GNIS rows: Jefferson City, Saint Louis, Kansas City (MO side), Columbia, Springfield, Saint Joseph, Branson, Taum Sauk Mountain, Missouri River, Meramec River, Lake of the Ozarks, and Mark Twain Lake. Four context corridors (I-70, I-44, Missouri, Mississippi) and four GNIS-backed nodes. |
| [`../resources/city-subsurface/gnis-state-batch8-source-register-2026-10-23.json`](../resources/city-subsurface/gnis-state-batch8-source-register-2026-10-23.json) | Machine-readable batch-8 register: row-level FEATURE_IDs, returned Geocoder types/counties, stored points, source notes, selection rules, eleven identity decisions (including three known service discrepancies), and limitations. The city test reconstructs every generated row from it exactly. |
| Generated apps | Root pages, data/gazetteer packs, public staged apps, and Webxdc bundles for both states. Every city XDC now contains 71 entries (28 data + 28 gazetteer packs plus the shared shell/vendor set). |
| Docs/backlog | `city-subsurface.md`, root README, backlog MD/JSON, docs index, and the Wiki archive describe twenty-eight configurations and the batch-8 evidence. |

## Identity findings

- **Both high points needed per-ID checks again.** GNIS Domestic Names
  confirms Hawkeye Point (`1851955`) is Class=Summit, Osceola County,
  sequence 1 marked **High Point** at the stored point, description
  “Highest elevation in IA at 1670 feet”; and Taum Sauk Mountain
  (`752501`) is Class=Summit, Iron County, High Point, “Highest
  elevation in MO at 1772 feet” with a 1938 Board decision. The Taum
  Sauk per-ID page prints the longitude as `-90.7291684` versus the
  Geocoder’s `-90.7291683` — a 1e-7-degree rounding difference at the
  same mapped point, disclosed in the row note — and its per-ID variant
  name “Tom Sauk Mountain” is a variant of the same record, not a row.
- **The St./Saint spelling is an identity gate.** Both `St. Louis` and
  `St. Joseph` screens returned empty arrays; the `Saint` spellings
  returned the official populated places (`765765` in the City of Saint
  Louis, `730205` in Buchanan) plus their county/lake/place/airfield
  piles, all rejected in the notes. Same treatment as round-24’s Grand
  Lake apostrophe.
- **The Missouri River gets its first statewide row after six empty
  screens.** Montana, North Dakota, South Dakota, Nebraska, Kansas, and
  Iowa all returned empty; the Missouri screen finally returns `756398`
  at the Saint Charles County confluence sequence. The Kansas City city
  frame stores a different sequence of the same multipoint record
  (`39.123899988352946, -94.5613514316943`, “Multiple counties”);
  both are recorded, neither is a channel trace.
- **The Mississippi River stays corridor-only everywhere so far.**
  Iowa returned an empty array; Missouri returned only a same-prefix
  **Mississippi River Hills** Area record (`758109`, Knox County), which
  fails the exact-name/type match. Both frames draw border corridors
  only.
- **Des Moines is the county/river/beach/military trap.** The Polk
  County place rejects Des Moines County, the same-name Des Moines
  River (which seeds separately at its Lee County mouth sequence),
  Des Moines Beach, the international airport, and the historical
  ordnance plant. Dubuque rejects its county and the Dubuque Hills
  range; Cedar Rapids and Davenport reject their beach/harbor records.
- **Kansas City MO stores this screen’s series.** `748198` at
  `39.0997266, -94.5785667` differs by less than a metre from the city
  frame’s higher-precision series; the register records both, plus the
  Kansas-side record `478635` and the Kansas City Reach bend as
  rejections. Current River screened empty; Waterloo is identity-safe
  but held to starter scope (Rogue River/Belle Fourche/Salina chain).

## Test tally at round-25 close

| Suite | Result |
| --- | --- |
| `npm run build:city-subsurface` | PASS — 28 frames built; Iowa/Missouri each report 12 gazetteer rows (12 verified), 4 corridors, 4 nodes; every city XDC has 71 entries |
| `node --test tests/city-subsurface.test.mjs` | 15/15 PASS |
| `npm run build:wikiinajar` | PASS — 220 Markdown files converted to Wiki pages; `wikiinajar.xdc` rebuilt |
| Full `vitest run` | 35 files, 307/307 PASS |
| Full `node --test tests/*.test.mjs` | 728 tests: 718 pass, 10 skipped, 0 fail |

## Next

- Minnesota closes the West North Central division; the Gulf/South
  Atlantic states follow, then the country/PC Globe thread.
- Keep bulk California themes and archived-class features behind their own
  explicit source decisions.
- Unchanged from round 19: relay official current Temurin 8/21, evaluate
  OpenJVM-Wasm only in isolation, keep Ghidra distributions on CI/relay.
- S6 still needs lawfully redistributable historical snapshots; S7 remains
  blocked on its missing binary/teardown/driver artifacts.
