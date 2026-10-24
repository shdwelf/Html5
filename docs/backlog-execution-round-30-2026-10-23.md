# Backlog execution — round 30 (2026-10-23)

Branch: `arena/ed5d4b7c-html5` (PR #139). PR #138 remains open on its
own branch awaiting the user's merge decision.

## T4.1 batch 13 — Virginia & West Virginia statewide frames (configurations 37–38)

**Virginia (`virginia`, VA, lon −83.7..−75.0, lat 36.45..39.5):**
Richmond `1499957`, Virginia Beach `1500261`, Norfolk `1497051`,
Roanoke `1499971`, Charlottesville `1498463`, Chesapeake `1496841`
(all independent cities, county field verbatim as "City of …"),
Mount Rogers `1485637` (Smyth, 5,729 ft, per-ID check), Smith
Mountain Lake `1502131` (Franklin), Lake Anna `1501942` (Louisa),
Claytor Lake `1501983` (Pulaski), James River `1488853` (Isle of
Wight), Rappahannock River `1479404` (Lancaster).

**West Virginia (`westvirginia`, WV, lon −82.7..−77.7, lat 37.15..
40.7):** Charleston `1558347` (Kanawha), Huntington `1540605`
(Cabell), Morgantown `1555161` (Monongalia), Parkersburg `1544587`
(Wood), Wheeling `1548994` (Ohio), Spruce Knob `1553014` (Pendleton,
4,863 ft, per-ID check; Randolph summit `1555698` rejected),
Summersville Lake `1553142` (Nicholas), Cheat Lake `1537226`
(Monongalia), New River `1552301` (Fayette), Kanawha River `1551620`
(Fayette), Shenandoah River `1556740` (Jefferson), Greenbrier River
`1551294` (Summers).

**Independent cities, normalized not edited.** Six Virginia rows carry
"City of …" from the Geocoder and "… (city)" from the DomesticNames
text (the Saint Louis pattern from batch 11, generalized: the batch-13
test strips both forms before comparing counties).

**Cross-state rivers.** The Shenandoah (mouth at Harpers Ferry) and
New (confluence in Fayette County) records are West Virginia-associated
and seeded there; Virginia's screens return no stream records for
either name (subdivisions / a populated place), so both are corridors
in Virginia. The Ohio and Monongahela are empty under WV; the Potomac
empty under VA.

**Kanawha county preservation.** The Kanawha River's stored point is
its Ohio mouth at Point Pleasant (Mason County), yet both surfaces
return its primary county as Fayette — GNIS keys the record to its
source-reach county. Preserved verbatim, documented in the register,
so it does not read as a transcription error.

**Tests.** `tests/city-subsurface.test.mjs` 20/20 — 38-frame list,
batch-13 register deep-equality, per-row FEATURE_ID/name/county
(normalized)/point equality vs the extract, semantic geocoderCounty
asserts with the independent-city special case, Kanawha preservation
assert, empty-screen corridor asserts. `.xdc` packages: 91 entries
each. Full suite tally and commit follow.
