# Backlog execution — round 31 (2026-10-23)

Branch: `arena/ed5d4b7c-html5` (PR #139). PR #138 remains open on its
own branch awaiting the user's merge decision.

## T4.1 batch 14 — North Carolina & South Carolina (configurations 39–40)

**North Carolina (`northcarolina`, NC, lon −84.35..−75.35, lat 33.75..
36.6):** Raleigh `1024242` (Wake), Charlotte `1019610` (Mecklenburg),
Greensboro `1020557` (Guilford), Durham `1020059` (Durham), Asheville
`1018864` (Buncombe), Wilmington `1023269` (New Hanover), Mount
Mitchell `1013745` (Yancey, 6,684 ft, per-ID check; two same-name
populated places rejected), Kuwohi `1326387` (Swain, 6,643 ft, per-ID
check), Lake Norman `991183` (Iredell), B. Everett Jordan Lake
`980401` (Chatham), Cape Fear River `1023879` (Brunswick), Roanoke
River `1502110` (Bertie).

**South Carolina (`southcarolina`, SC, lon −83.4..−78.5, lat 31.9..
35.25):** Columbia `1245051` (Richland), Charleston `1221516`
(Charleston), Greenville `1245842` (Greenville), Spartanburg `1250982`
(Spartanburg), Myrtle Beach `1249770` (Horry), Sassafras Mountain
`1015279` (Pickens, 3,553 ft, per-ID check), Lake Marion `1224315`
(Clarendon), Lake Moultrie `1230046` (Berkeley), Lake Murray `1224900`
(Lexington), Savannah River `1253486` (Jasper), Congaree River
`1249468` (Richland), Pee Dee River `1251573` (Chesterfield).

**Kuwohi closes the Tennessee question.** Batch 12 (round 29) found
no Tennessee GNIS record for Tennessee's highest summit under its old
name (empty TN screen, empty NC screen for "Clingmans Dome", absent
from the TN text). Under the restored 2024 name **Kuwohi**, the
Swain County Summit record returns cleanly under `states=NC` and
reproduces in the NC text — so the peak is seeded here, and
Tennessee's frame keeps its documented context marker plus Mount
Le Conte, exactly as batch 12 recorded. Lesson folded into the
register: screen by the *current official name*; a renamed feature
can be invisible under its historical name in every state filter.

**Other decisions.** B. Everett Jordan Lake seeded under its official
name order (plain "Jordan Lake" screen empty — the Vermilion/Monroe
rule). The Savannah River mouth record is SC-associated; Pee Dee's
returned Chesterfield keying preserved verbatim (the Kanawha
pattern). Lake Hartwell screens empty under SC (Georgia-associated).

**Tests.** `tests/city-subsurface.test.mjs` 21/21 — 40-frame list,
batch-14 register deep-equality, per-row FEATURE_ID/name/county/point
equality vs the extract, semantic geocoderCounty asserts, Kuwohi
closure asserts. `.xdc` packages: 95 entries each. Full suite tally
and commit follow.
