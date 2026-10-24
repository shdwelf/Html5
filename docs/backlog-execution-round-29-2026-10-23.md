# Backlog execution — round 29 (2026-10-23)

Branch: `arena/ed5d4b7c-html5` (PR #139). PR #138 remains open on its
own branch awaiting the user's merge decision.

## T4.1 batch 12 — Kentucky & Tennessee statewide frames (configurations 35–36)

**Kentucky (`Kentucky`, KY, lon −89.6..−80.0, lat 36.4..39.55):**
Frankfort `517517` (Franklin), Louisville `509453` (Jefferson; metro
balance records rejected), Lexington `496343` (Fayette), Bowling Green
`487744` (Warren), Covington `490167` (Kenton), Black Mountain
`510753` (Harlan, 4,145 ft, per-ID check; community `487379` and gap
rejected), Lake Cumberland `490483` (Pulaski), Lake Barkley `486356`
(Trigg), Ohio River `425264` (Ballard), Tennessee River `517033` and
Cumberland River `517018` (Livingston), Kentucky River `513130`
(Carroll).

**Tennessee (`tennessee`, TN, lon −90.35..−81.6, lat 34.95..36.7):**
Nashville `1652484` (Davidson), Memphis `1326388` (Shelby), Knoxville
`1648562` (Knox), Chattanooga `1307240` (Hamilton), Clarksville
`1269467` (Montgomery), Murfreesboro `1295105` (Rutherford), Mount
Le Conte `1646824` (Sevier, 6,593 ft, per-ID check), Kentucky Lake
`1269701` (Hardin), Norris Lake `1269832` (Union), Douglas Lake
`1282739` (Jefferson), Cherokee Lake `1280322` (Hawkins), Chickamauga
Lake `1326920` (Meigs).

**The Ohio River resolution.** Rounds 25–27 left the Ohio main stem a
corridor in four frames (OH, IN, IL, PA all screened empty). The
`states=KY` screen returns the stream record at its Mississippi
confluence (Ballard County): the record is Kentucky-associated. It is
seeded once, at its mouth point in the Kentucky frame (the series
convention: seed a cross-state feature once, in the frame that owns
the record), and stays a corridor upstream. The Tennessee and
Cumberland mouths resolve the same way (both empty under TN; seeded
at their Kentucky Ohio-River mouths) — the Tennessee screen returns
only pulp-mill ponds for the river's name, a good reminder that
"no main-stem record" and "no records at all" are different screens.

**Kuwohi.** Tennessee's highest summit (6,643 ft, renamed Kuwohi in
2024) returns no Tennessee record on either surface (empty geocoder
screen; absent from the TN text extract) — its GNIS record is
NC-associated. It appears only as a context corridor whose note
claims no GNIS point; Mount Le Conte (6,593 ft) is the seeded
Tennessee summit.

**Tests.** `tests/city-subsurface.test.mjs` 19/19 — 36-frame list,
batch-12 register deep-equality, per-row FEATURE_ID/name/county/point
equality vs the extract, semantic geocoderCounty asserts, Ohio River
resolution + Kuwohi context asserts, empty-screen corridor asserts.
`.xdc` packages: 87 entries each. Full suite tally and commit follow.
