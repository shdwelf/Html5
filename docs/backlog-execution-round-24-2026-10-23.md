# Backlog execution — Round 24 (2026-10-23)

Continues the agent backlog on branch `arena/ed5d4b7c-html5` (PR #139).
This round closes the T4.1 batch-7 GNIS pipeline: Minnesota and Iowa join
the CITY SUBSURFACE atlas as configurations 25–26.

## Outcomes

- **T4.1 batch 7 — Minnesota + Iowa (partial; configurations 25–26).**
  Each frame ships twelve all-GNIS `VERIFIED=1` starter rows (six
  populated places, one state high point, four–five lakes/streams,
  generalized context corridors, four official nodes, labelled synthetic
  relief, no DEM), generated into `minnesota-subsurface.html` /
  `iowa-subsurface.html`, `js/city-subsurface-data-*.js`,
  `js/city-gazetteer-data-*.js`, `*.xdc`, and the `public/apps/` mirrors
  by `npm run build:city-subsurface`.

## Two-surface verification method (new this round)

Rounds 20–23 screened each row once against the USGS GNIS Geocoder. This
round adds a second, independent USGS surface so every `VERIFIED=1`
claim rests on two reproductions of the same record:

1. **USGS GNIS Geocoder** (`dashboard.waterdata.usgs.gov/service/geocoder`)
   — exact official name, returned type, state, primary county, GnisId,
   and primary-point coordinates (the same screening rule as round 23).
2. **GNIS DomesticNames state text files** (staged-products S3:
   `DomesticNames_<ST>_Text.zip`) — the sandbox cannot reach that host, so
   `tools/gnis_extract.py` runs in a GitHub Actions runner
   (`.github/workflows/arena-gnis-fetch.yml`, request in
   `.arena-gnis/candidates.json`) and commits the small candidate extract
   (`resources/city-subsurface/gnis-candidates-batch7.json`, per-state
   ZIP SHA-256 pinned) plus a committed diagnostic log. The 2026 text
   layout lowercases the header, prefixes a UTF-8 BOM, and drops the
   elevation columns; the extractor normalizes accordingly, and the two
   high-point elevations therefore cite USGS-published state-highpoint
   values (Eagle Mountain 2,301 ft, Hawkeye Point 1,670 ft) instead of
   the text file.

All 24 seeded rows reproduce identically on both surfaces (same
FEATURE_ID, class, county, and primary point). The batch-7 register
(`resources/city-subsurface/gnis-state-batch7-source-register-2026-10-23.json`)
preserves the returned Geocoder type/county strings and records every
identity decision.

## Identity decisions worth remembering

- **Eagle Mountain** is two Cook County summits (`656080` seeded,
  `656081` rejected, ~25 km apart) plus a Todd County namesake
  (`643035`, rejected); the seeded record matches the published
  Minnesota high-point location.
- **Lake of the Woods** has two permanent FEATURE_IDs (`654378` seeded,
  `1930543` unseeded) — multipoint duplication on one lake, preserved as
  a known service discrepancy.
- **Vermilion Lake** is the official name order; the reversed screen
  returned no lake record.
- **Clear Lake** (lake `455462` vs city `455465` vs Pocahontas County
  lake `455463`) and **Spirit Lake** (lake `461850` vs city `461851`)
  follow the established town-versus-lake split.
- Main-stem screens stay unseeded: Mississippi River (empty under
  MN+IA; only the Stearns County reservoir record surfaced),
  Missouri River (empty under IA), Red River of the North (record found
  but its primary point is the Lake Winnipeg mouth at 50.4002778, −96.8,
  outside the frame), Lake Superior (empty under MN). All four remain
  generalized context corridors whose facts say why.
- Starter-scope holds (Salina precedent): Bloomington and
  Lake Minnetonka (MN); Waterloo, East Okoboji Lake, Lake Red Rock,
  and Saylorville Lake (IA) — all identity-safe in the extract.

## Test tally at round-24 close

| Suite | Result |
| --- | --- |
| `npm run build:city-subsurface` | PASS — 26 frames built; Minnesota/Iowa each report 12 gazetteer rows (12 verified), 5 corridors, 4 nodes; every city XDC has 65 entries |
| `node --test tests/city-subsurface.test.mjs` | 14/14 PASS (includes the new Upper Midwest batch test, which re-verifies every FEATURE_ID against the DomesticNames extract) |
| `npm run build:wikiinajar` | PASS — 240 Markdown files converted to Wiki pages; `wikiinajar.xdc` rebuilt |
| Full `node --test tests/*.test.mjs` | 802 tests: 787 pass, 12 skipped, 3 fail — the 3 failures are the CyberChef registry/SFX suites and fail identically on pristine `main` (`d66e052`) in this sandbox (they need the full npm tree); no city-suite regressions |

## Next

- Remaining states next in dated per-row batches (Wisconsin/Michigan/
  Illinois/Indiana/Ohio eastward, then the South), then the
  country/PC Globe thread.
- PR #138 (T1.3 + iParty Ghidra strand) still awaits the user's merge
  decision on its own branch; nothing from it is duplicated here.
- Keep bulk California themes and archived-class features behind their
  own explicit source decisions.
