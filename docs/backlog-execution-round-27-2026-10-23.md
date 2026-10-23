# Backlog execution — round 27 (2026-10-23)

Branch: `arena/ed5d4b7c-html5` (PR #139). Builds on PR #136's merged
base; PR #138 remains open on its own branch awaiting the user's merge
decision.

## T4.1 batch 10 — Ohio & Pennsylvania statewide frames (configurations 31–32)

**Ohio (`ohio`, OH, lon −84.85..−80.5, lat 38.4..42.25):** Columbus
`1080996` (Franklin), Cleveland `1066654` (Cuyahoga), Cincinnati
`1066650` (Hamilton), Toledo `1067015` (Lucas), Akron `1064305`
(Summit), Dayton `1064514` (Montgomery), Campbell Hill `1079572`
(Logan, 1,550 ft, per-ID check; Pike `1048578` and Scioto `1038781`
namesakes rejected), Lake Erie `1075813` (county field "Lake"), Grand
Lake `1083992` (Mercer), Scioto River `1072258`, Maumee River
`1084017`, Cuyahoga River `1072205`. Corridors-only: Ohio River
(fourth consecutive empty state screen after IL/IN), Maumee Bay and
the Sandusky/Celina society context lines.

**Pennsylvania (`pennsylvania`, PA, lon −80.55..−74.95, lat 39.7..
42.3):** Harrisburg `1213649` (Dauphin; Philadelphia namesake
`1213812` rejected), Philadelphia `1209052`, Pittsburgh `1213644`
(Allegheny), Allentown `1213700` (Lehigh; Allegheny namesake
`1202899` rejected), Erie `1174305`, Scranton `1213652`, Mount Davis
`1209050` (Wayne, 3,213 ft, per-ID check), Pymatuning Reservoir
`1044806` (Crawford; multipoint duplicate `1199940` unseeded),
Raystown Lake `1193175` (Huntingdon), Lake Wallenpaupack `1199735`
(Pike), Allegheny River `1209386`, Monongahela River `1209053`.
Corridors-only: Susquehanna, Delaware, Erie Shore, Ohio main stem.

**Pipeline evidence.** This was the first batch screened in the same
session it shipped: candidates staged in `.arena-gnis/candidates.json`
(dedup merge preserved), runner extract pulled and verified
(23/24 rows reproduced on the first pull; Pymatuning Reservoir
`1044806` added by follow-up commit and reproduced on rerun). The
cumulative extract now covers MN/IA/WI/MI/IL/IN/OH/PA; every seeded row
reproduces name/county/point against it in the batch-10 test.

**Indian Lake: the first source-corrupted GNIS coordinate in this
series.** The Geocoder returned Logan County's Indian Lake
(`1041943`) at longitude −80.8753645 — a western-Pennsylvania point,
and the DomesticNames text extract reproduces the identical value.
Two-surface agreement therefore does *not* certify correctness; the
feature is excluded and recorded as a `knownServiceDiscrepancy`
rather than hand-corrected.

**Maintenance fixes.** (1) `cities.json` carried duplicated
`illinois`/`indiana` key pairs — a batch-9 builder ran twice; both
copies were identical and JSON consumers used the last, so behavior
was unchanged. Deduplicated (the atlas now has exactly 32 frames).
(2) The batch-9 Charles Mound note misnamed its county ("Wayne");
corrected to Wayne County in `cities.json` and the batch-9
register, and every batch test now asserts semantic county identity
(geocoderCounty equality + per-summit note counties), so hand-typed
county slips fail loudly instead of passing silently. A second
instance of the same slip — in the batch-10 *test regex* for Mount
Davis — was caught by the new assert; the atlas ("Wayne") was the
correct surface there. City suite 17/17.

**Tests.** `tests/city-subsurface.test.mjs` — 32-frame list, batch-10
register deep-equality vs generated rows, per-row FEATURE_ID/name/
county/point equality vs the DomesticNames extract, semantic
geocoderCounty asserts, overview floor assertions (`>=` 20/32 for the
narrow frames), Indian Lake exclusion and discrepancy assert, and
engine-loader asserts. Both `.xdc` packages: 79 entries each, ~530 KB.

## Next candidates

Missouri/Arkansas (batch 11) via the same pipeline; then Kentucky/
Tennessee. Larger T-items unchanged per backlog.
