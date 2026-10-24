# Backlog execution — round 34 (2026-10-23)

Branch: `arena/9caea545-html5` (branched from the PR #139 merge
commit `efce379`). PR #138 remains open on its own branch awaiting
the user's merge decision.

## T4.1 batch 16 — Maryland & Delaware statewide frames (configurations 48–49)

**Maryland (`Maryland`, MD, lon −79.55..−74.95, lat 37.85..39.75):**
Annapolis `595031` (Anne Arundel), Baltimore `597040` (Baltimore
(city)), Frederick `584497` (Frederick), Cumberland `590057`
(Allegany), Hagerstown `598385` (Washington), Ocean City `586284`
(Worcester), Salisbury `591221` (Wicomico), Hoye-Crest `1959484`
(Garrett, 3,360 ft, per-ID check), Deep Creek Lake `584060` (Garrett),
Potomac River `597915` (St. Mary's), Susquehanna River `591690`
(Cecil), Choptank River `583766` (Dorchester).

**Delaware (`delaware`, DE, lon −76.05..−74.95, lat 38.35..39.95):**
Dover `217882` (Kent), Wilmington `214862` (New Castle), Newark
`214385` (New Castle), Middletown `214304` (New Castle), Milford
`214308` (Sussex), Rehoboth Beach `214535` (Sussex), Iron Hill
`214151` (New Castle, Summit), Lums Pond `214259` (New Castle),
Silver Lake `214647` (Kent), Delaware River `217887` (New Castle),
Christina River `213799` (New Castle), Saint Jones River `217883`
(Kent).

**Identity decisions that mattered.** The Choptank River exists twice
in GNIS with identical name/class/county/point (`583766`, `213797`);
the in-series Maryland record is seeded and the duplicate is named in
the row note and register (the Guntersville rule). Baltimore's stored
county is the extract's `Baltimore (city)`; the Geocoder's `City of
Baltimore` is preserved in the register. Hoye-Crest is seeded under
its GNIS name because `Backbone Mountain` screens empty under MD (its
record keys to West Virginia). Delaware's surveyed high point,
Ebright Azimuth (447 ft), has no GNIS Summit record, so Iron Hill is
seeded openly as the identity-safe Summit rather than inventing a
high-point row; the Nanticoke River screens empty under DE and stays
a corridor.

**Pipeline note.** The GNIS fetch workflow's branch trigger was
repointed from the merged `arena/ed5d4b7c-html5` to this branch; the
cumulative candidate extract now covers twenty states.

**Tests.** `tests/city-subsurface.test.mjs` 27/27 — 49-frame list,
batch-16 register deep-equality, per-row FEATURE_ID/name/county/point
equality vs the extract, semantic geocoderCounty asserts (incl.
`City of Baltimore` and `Saint Mary's County`), Choptank duplicate
and Iron Hill/Ebright asserts. `.xdc` packages: 113 entries each.
Full-suite tally and commit follow.
