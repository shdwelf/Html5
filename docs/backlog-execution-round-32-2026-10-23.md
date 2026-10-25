# Backlog execution — round 32 (2026-10-23)

Branch: `arena/ed5d4b7c-html5` (PR #139). PR #138 remains open on its
own branch awaiting the user's merge decision.

## T4.1 batch 15 — Georgia & Florida statewide frames (configurations 41–42)

**Georgia (`Georgia`, GA, lon −85.65..−80.75, lat 30.35..35.05):**
Atlanta `351615` (Fulton), Augusta `310670` (Richmond), Macon `332301`
(Bibb), Columbus `331443` (Muscogee), Savannah `322590` (Chatham),
Athens `354407` (Clarke), Brasstown Bald `354839` (Towns, 4,784 ft,
per-ID check), Hartwell Lake `356215` (Stephens), Lake Sidney Lanier
`322971` (Forsyth), Altamaha River `354294` (McIntosh), Chattahoochee
River `354236` (Decatur), Flint River `358207` (Decatur).

**Florida (`florida`, FL, lon −87.7..−79.9, lat 25.1..31.05):**
Tallahassee `308416` (Leon), Jacksonville `295003` (Duval), Miami
`295004` (Miami-Dade), Tampa `292005` (Hillsborough), Orlando `288240`
(Orange), Pensacola `294117` (Escambia), Britton Hill `1851954`
(Walton, 345 ft, per-ID check), Lake Okeechobee `307550` (Palm Beach),
Lake George `305722` (Volusia), Saint Johns River `308105` (Duval),
Suwannee River `308455` (Dixie), Apalachicola River `305219`
(Franklin).

**One point, two rivers.** The Chattahoochee and Flint GNIS records
share exactly one primary point — their Decatur County confluence —
on both surfaces. Both rows are stored unadjusted (the batch-15 test
asserts coincidence *and* distinct FEATURE_IDs). It is the inverse of
the multipoint-duplication case (Pymatuning): there, two IDs meant
one feature; here, two features share one point.

**Official name orders, again.** "Lake Hartwell" screens empty in
both Georgia and South Carolina; the reservoir is "Hartwell Lake".
"Lake Lanier" returns only a subdivision; the reservoir is "Lake
Sidney Lanier". Britton Hill's FEATURE_ID (1851954) sits immediately
before Iowa's Hawkeye Point (1851955) and Indiana's Hoosier Hill
(1851956) — a shared GNIS high-point registration series spanning
batches 7, 9, and 15, noted as provenance colour only.

**Tests.** `tests/city-subsurface.test.mjs` 22/22 — 42-frame list,
batch-15 register deep-equality, per-row FEATURE_ID/name/county/point
equality vs the extract, semantic geocoderCounty asserts, shared-point
asserts. `.xdc` packages: 99 entries each. Full suite tally and
commit follow.
