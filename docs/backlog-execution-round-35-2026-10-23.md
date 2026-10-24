# Backlog execution — round 35 (2026-10-23)

Branch: `arena/0f557daa-html5` (branched from the PR #142 merge
commit `e37c6c1`). PR #138 remains open on its own branch awaiting
the user's merge decision.

## T4.1 batch 17 — New Hampshire & Vermont statewide frames (configurations 50–51)

**New Hampshire (`newhampshire`, NH, lon −72.6..−70.65, lat
42.65..45.05):** Concord `873303` (Merrimack), Manchester `868243`
(Hillsborough), Nashua `868677` (Hillsborough), Portsmouth `869312`
(Rockingham), Dover `866618` (Strafford), Keene `867823` (Cheshire),
Mount Washington `871352` (Coos, 6,288 ft, per-ID check), Monadnock
Mountain `868516` (Cheshire), Lake Winnipesaukee `870958` (Belknap),
Squam Lake `872720` (Belknap), Umbagog Lake `870563` (Coos),
Piscataqua River `869224` (Rockingham).

**Vermont (`vermont`, VT, lon −73.45..−71.4, lat 42.65..45.1):**
Montpelier `1461834` (Washington), Burlington `1456663`
(Chittenden), Rutland `1461361` (Rutland), Brattleboro `1456556`
(Windham), Saint Johnsbury `1459328` (Caledonia), Bennington
`1460600` (Bennington), Mount Mansfield `1461774` (Chittenden,
4,395 ft, per-ID check), Camels Hump `1456724` (Chittenden), Lake
Champlain `946367` (Grand Isle), Lake Memphremagog `1458419`
(Orleans), Winooski river `1460304` (Chittenden), Otter Creek `1460510`
(Addison).

**Identity decisions that mattered.** Four big rivers refused to
seed: the Connecticut returns only `Connecticut River Reservoir`
impoundments under both NH and VT, the Merrimack and Androscoggin
return reservoir-only records under NH, and the Saco screens empty
under NH — all four main stems stay generalized corridors (the
mouth-keyed GNIS pattern seen with the Mississippi and Pearl). The
familiar `Mount Monadnock` order screens empty; the summit is seeded
under the GNIS name order `Monadnock Mountain`. GNIS spellings are
stored verbatim: apostrophe-free `Camels Hump`, full `Saint
Johnsbury`. Lake Champlain's seeded point is the VT-associated
Grand Isle record; most of the lake lies outside the frame in New York.

**Pipeline note.** The GNIS fetch workflow's branch trigger was
repointed from `arena/9caea545-html5` to this branch; the cumulative
candidate extract now covers twenty-two states.

**Tests.** `tests/city-subsurface.test.mjs` 28/28 — 51-frame list,
batch-17 register deep-equality, per-row FEATURE_ID/name/county/point
equality vs the extract, Connecticut corridor asserts. `.xdc`
packages: 117 entries each. Full-suite tally and commit follow.
