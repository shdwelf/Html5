# Backlog execution round 21 — 23 Oct 2026

*Twenty-first round: “continue backlog.” This round continues the S4
geographic queue immediately after the round-20 Pacific Northwest batch.
Index: [`agent-backlog-2026-10-21.md`](agent-backlog-2026-10-21.md).
Previous rounds: [19](backlog-execution-round-19-2026-10-23.md) ·
[20](backlog-execution-round-20-2026-10-23.md).*

## Scoping decision

Round 20 handed the queue the same instruction it inherited: remaining
states in **dated, per-row GNIS source-register batches**. Round 21 takes the
**Northern Rockies batch — Montana and Wyoming**, extending the western
state sequence north of the round-16/18/20 frames.

The identity rule is unchanged: exact official name, compatible returned
type, intended state, returned primary county, permanent FEATURE_ID, and
returned primary point must all identify the intended feature before
`VERIFIED=1`; points are never described as boundaries, shorelines, lake
polygons, or river centerlines; ambiguous or state-screen-unreturned
features stay unseeded or become generalized `context` corridors.

## Delivered

| Frame | Result |
| --- | --- |
| **Montana** (`montana`) | Configuration 19. Twelve all-GNIS rows: Helena, Billings, Missoula, Great Falls, Bozeman, Butte, Miles City, Flathead Lake, Fort Peck Lake, Lake McDonald, Bighorn River, and Granite Peak. Four context corridors (I-90, I-15, Missouri, Yellowstone) and four GNIS-backed nodes. |
| **Wyoming** (`wyoming`) | Configuration 20. Twelve all-GNIS rows: Cheyenne, Casper, Laramie, Jackson, Rock Springs, Green River, Gannett Peak, Grand Teton, Devils Tower, Yellowstone Lake, Jackson Lake (Reservoir), and Shoshone River. Four context corridors (I-25, I-80, Snake, North Platte) and four GNIS-backed nodes. |
| [`../resources/city-subsurface/gnis-state-batch4-source-register-2026-10-23.json`](../resources/city-subsurface/gnis-state-batch4-source-register-2026-10-23.json) | Machine-readable batch-4 register: row-level FEATURE_IDs, returned Geocoder types/counties, stored points, source notes, selection rules, eleven identity decisions, and limitations. The city test reconstructs every generated row from it exactly. |
| Generated apps | Root pages, data/gazetteer packs, public staged apps, and Webxdc bundles for both states. Every city XDC now contains 55 entries (20 data + 20 gazetteer packs plus the shared shell/vendor set). |
| Docs/backlog | `city-subsurface.md`, root README, backlog MD/JSON, docs index, and the Wiki archive describe twenty configurations and the batch-4 evidence. |

## Identity findings

- **Granite Peak needed a per-ID detail check.** The exact-name Summit
  screen returned three records: Madison County `784179`, Park County
  `784178`, and Park County `784177`. GNIS Domestic Names confirms
  `784178` is Class=Summit, Primary County=Park County, coordinate
  sequence 1 marked **High Point** at the stored point (Crazy Peak map),
  matching the Geocoder exactly. The other two are rejected.
- **Jackson Lake stores as Reservoir, not Lake.** Two same-name lake
  records were returned (`1609177` Teton, `1590031` Natrona). The per-ID
  check confirms `1609177` is Class=Reservoir in Teton County with five
  coordinate sequences; sequence 1 matches the Geocoder. The Natrona
  record is rejected.
- **Lake McDonald is a lake-versus-town pair.** Seeded `787038`, rejected
  the same-name populated place `785919`.
- **The Yellowstone and Missouri rivers are corridor-only in Montana.**
  Both exact-name `states=MT` screens returned empty arrays.
- **Glacier National Park has no park row.** The screen returned only
  Division records (`1940629`, `1940630`); archived Park classes remain
  absent from the current Geocoder surface, matching the round-16
  California finding.
- **Bighorn River is seeded only in Montana.** Montana returned
  Yellowstone County Stream `779903`; Wyoming returned an empty array, so
  no Wyoming Bighorn row is claimed.
- **Wyoming's river stack is deliberately corridor-only.** North Platte
  returned empty; Snake River returned only the same-name mountain range;
  Green River returned town/division/canal records plus a *different*
  same-name Weston County Stream (`1600086`), while Wind River returned
  a place/reservation/canal/stream/range pile that the 12-row starter did
  not need to resolve.
- **Devils Tower and Rock Springs are class guards.** Summit `1609083` is
  not the town `1604684`; populated place `1593588` is not either
  same-name spring. Grand Teton Summit `1609199` is not canal `1589026`.

## Test tally at round-21 close

| Suite | Result |
| --- | --- |
| `npm run build:city-subsurface` | PASS — 20 frames built; Montana/Wyoming each report 12 gazetteer rows (12 verified), 4 corridors, 4 nodes; every city XDC has 55 entries |
| `node --test tests/city-subsurface.test.mjs` | 11/11 PASS |
| `npm run build:wikiinajar` | PASS — 216 Markdown files converted to Wiki pages; `wikiinajar.xdc` rebuilt |
| Full `vitest run` | 35 files, 307/307 PASS |
| Full `node --test tests/*.test.mjs` | 724 tests: 714 pass, 10 skipped, 0 fail |

## Next

- Continue the remaining states in dated per-row batches. The western
  sequence now covers CA/NV/AZ/UT/CO/NM/OR/WA/ID/MT/WY; the natural next
  steps are North/South Dakota, then Nebraska–Kansas or Montana's northern
  neighbors before the country/PC Globe thread.
- Keep bulk California themes and archived-class features behind their own
  explicit source decisions.
- Unchanged from round 19: relay official current Temurin 8/21, evaluate
  OpenJVM-Wasm only in isolation, keep Ghidra distributions on CI/relay.
- S6 still needs lawfully redistributable historical snapshots; S7 remains
  blocked on its missing binary/teardown/driver artifacts.
