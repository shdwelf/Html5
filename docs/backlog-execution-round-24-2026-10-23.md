# Backlog execution round 24 — 23 Oct 2026

*Twenty-fourth round: “Continue backlog.” This round continues the S4
geographic queue immediately after the round-23 Central Plains batch.
Index: [`agent-backlog-2026-10-21.md`](agent-backlog-2026-10-21.md).
Previous rounds: [22](backlog-execution-round-22-2026-10-23.md) ·
[23](backlog-execution-round-23-2026-10-23.md).*

## Scoping decision

Rounds 20–23 all handed the queue the same instruction: remaining states
in **dated, per-row GNIS source-register batches**. Round 24 takes the
**Southern Plains batch — Oklahoma and Texas**, which the round-23 record
named as the next step of the remaining plains/mountain states (all
census-Mountain states are now shipped).

The identity rule is unchanged: exact official name, compatible returned
type, intended state, returned primary county, permanent FEATURE_ID, and
returned primary point must all identify the feature before `VERIFIED=1`;
points are never described as boundaries, shorelines, bay polygons,
canyon rims, or river centerlines; ambiguous, mismatched, or
state-screen-unreturned features stay unseeded or become generalized
`context` corridors.

## Delivered

| Frame | Result |
| --- | --- |
| **Oklahoma** (`oklahoma`) | Configuration 25. Twelve all-GNIS rows: Oklahoma City, Tulsa, Lawton, Norman, Stillwater, Enid, Mount Scott, Lake Texoma, Grand Lake O' The Cherokees, Tenkiller Ferry Lake, Canadian River, and Illinois River. Four context corridors (I-40, I-44, Red River border, Arkansas River) and four GNIS-backed nodes. |
| **Texas** (`texas`) | Configuration 26. Twelve all-GNIS rows: Austin, Houston, Dallas, San Antonio, El Paso, Fort Worth, Guadalupe Peak, Brazos River, Rio Grande, Trinity River, Galveston Bay, and Palo Duro Canyon. Four context corridors (I-35, I-10, Rio Grande, Brazos), a labelled generalized Gulf coast line, and four GNIS-backed nodes. |
| [`../resources/city-subsurface/gnis-state-batch7-source-register-2026-10-23.json`](../resources/city-subsurface/gnis-state-batch7-source-register-2026-10-23.json) | Machine-readable batch-7 register: row-level FEATURE_IDs, returned Geocoder types/counties, stored points, source notes, selection rules, sixteen identity decisions (including the per-ID Red River rejection), and limitations. The city test reconstructs every generated row from it exactly. |
| Generated apps | Root pages, data/gazetteer packs, public staged apps, and Webxdc bundles for both states. Every city XDC now contains 67 entries (26 data + 26 gazetteer packs plus the shared shell/vendor set). |
| Docs/backlog | `city-subsurface.md`, root README, backlog MD/JSON, docs index, and the Wiki archive describe twenty-six configurations and the batch-7 evidence. |

## Identity findings

- **Guadalupe Peak needed the per-ID treatment.** GNIS Domestic Names
  confirms `1358489` is Class=Summit, Primary County=Culberson County,
  coordinate sequence 1 marked **High Point** at the stored point,
  description “Highest elevation in TX at 8749 feet” in Guadalupe
  Mountains National Park, with a 1936 Board decision — coordinate
  matches the Geocoder exactly. Its variant names (El Capitan Peak,
  Signal Peak, the Guadaloupe misspelling) are variants of the same
  record, not extra rows.
- **Oklahoma's high point has no row — on purpose.** The exact-name
  Black Mesa `states=OK` screens returned empty arrays twice
  (maxSuggestions 10 and 25), so nothing was forced; Mount Scott is
  seeded as a Wichita Mountains summit and its note states it is **not**
  the state high point. This is the first state where the high point
  stays unseeded on an empty-screen record.
- **Red River was rejected by per-ID review, not an empty screen.**
  `states=OK` returned an empty array; `states=TX` returned an
  exact-name Stream record — but the per-ID check shows Primary
  County=Brown County with both coordinate sequences near 31.95 N, about
  150 miles south of the intended Texas–Oklahoma border reach (~34.4 N).
  The record does not identify the intended feature, so both frames keep
  Red River corridor-only (consistent with the round-22 Red River of the
  North empty screens). Red River County, Red River City, and Red River
  Army Depot are further same-name rejections.
- **Arkansas River empties for a third consecutive state.** After
  round-18 Colorado and round-23 Kansas, the `states=OK` screen again
  returned an empty array; the corridor chains all three. Gloss
  Mountains also screened empty.
- **The Division pile is Oklahoma's trap.** Oklahoma City rejects four
  city Divisions plus the census Division and the historical Air Force
  Station; Tulsa rejects county/Division/Non-Community/AAF/airport
  records; Lawton, Norman, Stillwater, and Enid each reject their
  Division (Stillwater also rejects Stillwater Creek and its reservoir
  pile). Grand Lake seeds only under the official apostrophe spelling —
  “Grand Lake of the Cherokees” screens empty.
- **Texas metros carry the biggest same-name piles yet.** Austin rejects
  its county, Division, colonia, two Branch streams, and a Bayou;
  Houston rejects county/Division/Heights/Ship Channel/Colonia/Creek/
  lakes; San Antonio rejects seven Divisions plus Prairie and Viejo; El
  Paso rejects county, four Divisions, the Electric Company lake, and
  the historical AAF; Dallas and Fort Worth likewise. The Rio Grande
  seeds at the Cameron County Gulf mouth (City/Village/Division
  rejected) — the reach that stayed unseeded in the New Mexico batch.
- **Two classes get first exercises.** Galveston Bay stores the returned
  **Bay** class (Bays & Harbors type; entrance channel stream rejected;
  Chambers County primary point disclosed as a mapped point, not a
  shoreline polygon), and Palo Duro Canyon stores the returned **Valley**
  class rather than an invented Canyon class. Colorado River (TX),
  Quartz Mountain, and Padre Island are identity-safe but held to
  starter scope (Rogue River/Belle Fourche/Salina precedent).

## Test tally at round-24 close

| Suite | Result |
| --- | --- |
| `npm run build:city-subsurface` | PASS — 26 frames built; Oklahoma/Texas each report 12 gazetteer rows (12 verified), 4 corridors, 4 nodes; every city XDC has 67 entries |
| `node --test tests/city-subsurface.test.mjs` | 14/14 PASS |
| `npm run build:wikiinajar` | PASS — 219 Markdown files converted to Wiki pages; `wikiinajar.xdc` rebuilt |
| Full `vitest run` | 35 files, 307/307 PASS |
| Full `node --test tests/*.test.mjs` | 727 tests: 717 pass, 10 skipped, 0 fail |

## Next

- The West North Central remainder (Iowa, Missouri, Minnesota) or the
  Gulf/South Atlantic states next in dated per-row batches; after that
  the country/PC Globe thread.
- Keep bulk California themes and archived-class features behind their own
  explicit source decisions.
- Unchanged from round 19: relay official current Temurin 8/21, evaluate
  OpenJVM-Wasm only in isolation, keep Ghidra distributions on CI/relay.
- S6 still needs lawfully redistributable historical snapshots; S7 remains
  blocked on its missing binary/teardown/driver artifacts.
