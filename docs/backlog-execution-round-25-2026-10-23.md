# Backlog execution — Round 25 (2026-10-23)

Continues the agent backlog on branch `arena/ed5d4b7c-html5` (PR #139).
This round extends T4.1 batch 8: Wisconsin and Michigan join the CITY
SUBSURFACE atlas as configurations 27–28, using the two-surface GNIS
pipeline established in round 24.

## Outcomes

- **T4.1 batch 8 — Wisconsin + Michigan (partial; configurations
  27–28).** Each frame ships twelve all-GNIS `VERIFIED=1` starter rows
  (six populated places, one state high point, three–four lakes/streams,
  generalized context corridors, four official nodes, labelled synthetic
  relief, no DEM), generated into `wisconsin-subsurface.html` /
  `michigan-subsurface.html`, data/gazetteer packs, `*.xdc` (71 entries),
  and the `public/apps/` mirrors by `npm run build:city-subsurface`.
- All 24 rows reproduce identically on the USGS GNIS Geocoder and the
  runner-extracted DomesticNames text (cumulative candidate extract,
  per-state ZIP SHA-256 pinned). Evidence:
  `resources/city-subsurface/gnis-state-batch8-source-register-2026-10-23.json`.

## Identity decisions worth remembering

- **Devils Lake (WI)** is nine same-name lakes; the seeded Sauk County
  record (`1563937`) is the Baraboo Range / Devil's Lake State Park
  lake, screened by county against the other eight.
- **Lake Superior is seeded exactly once in the atlas** — in the
  Michigan frame (`1618946`), where its single GNIS primary point lies
  in Michigan waters inside the frame. Its `states=MN` and `states=WI`
  screens are empty. Lake Huron (`1624619`) and Lake Michigan
  (`1623080`) also returned in-frame Michigan-associated points but are
  held to starter scope on the 12-row cap; Lake Erie screened empty.
- **Saint Croix River** returns only under `states=MN` (Washington
  County primary point); it is not seeded in either border frame and
  remains a corridor in the Wisconsin narrative.
- Town/lake and same-name splits: Torch Lake (four same-name records),
  Houghton Lake vs its shore community, Grand Rapids vs the Ontonagon
  County namesake, Green Bay city vs two bay records.
- Timms Hill (1,951 ft) and Mount Arvon (1,979 ft) carry Domestic Names
  per-ID checks; elevations cite USGS-published state-highpoint values
  because the current text layout has no elevation columns.
- Starter-scope holds: Appleton, La Crosse, Superior (WI); Kalamazoo,
  Flint, Higgins Lake lake/community pair (MI).

## Test tally at round-25 close

| Suite | Result |
| --- | --- |
| `npm run build:city-subsurface` | PASS — 28 frames built; Wisconsin/Michigan each report 12 gazetteer rows (12 verified), 5 corridors, 4 nodes; every city XDC has 71 entries |
| `node --test tests/city-subsurface.test.mjs` | 15/15 PASS (includes the new Great Lakes batch test with per-row extract re-verification) |
| `npm run build:wikiinajar` | PASS — 241 Markdown files converted to Wiki pages; `wikiinajar.xdc` rebuilt |
| Full `node --test tests/*.test.mjs` | 803 tests: 790 pass, 10 skipped, 3 fail — the same pre-existing CyberChef registry/SFX sandbox failures as round 24 (identical on pristine `main`); no city-suite regressions |

## Next

- Illinois/Indiana/Ohio eastward next, then the remaining states in
  dated per-row batches, then the country/PC Globe thread.
- PR #138 (T1.3 + iParty Ghidra strand) still awaits the user's merge
  decision on its own branch.
- Keep bulk California themes and archived-class features behind their
  own explicit source decisions.
