# Backlog execution — round 28 (2026-10-23)

Branch: `arena/ed5d4b7c-html5` (PR #139). PR #138 remains open on its
own branch awaiting the user's merge decision.

## T4.1 batch 11 — Missouri & Arkansas statewide frames (configurations 33–34)

**Missouri (`missouri`, MO, lon −95.65..−89.0, lat 35.9..40.7):**
Jefferson City `758233` (Cole), Saint Louis `765765` (City of Saint
Louis), Kansas City `748198` (Jackson), Springfield `735864` (Greene),
Columbia `716133` (Boone), Saint Joseph `730205` (Buchanan), Taum Sauk
Mountain `752501` (Iron, 1,772 ft, per-ID check), Lake of the Ozarks
`729600` (Camden), Table Rock Lake `752479` (Stone), Missouri River
`756398` (Saint Charles), Osage River `756484` (Osage), Meramec River
`756378` (Jefferson). Corridors-only: Mississippi River (no Streams
record under MO), Current River (empty screen).

**Arkansas (`arkansas`, AR, lon −94.65..−90.0, lat 32.95..36.55):**
Little Rock `83350` (Pulaski), Fort Smith `76952` (Sebastian),
Fayetteville `76914` and Springdale `78436` (Washington), Jonesboro
`77389` (Craighead), Magazine Mountain `67051` (Logan, 2,753 ft,
per-ID check), Lake Ouachita `75813` (Garland), Beaver Lake `70305`
(Washington; five same-name small lakes rejected), Greers Ferry Lake
`75245` (Cleburne), Bull Shoals Lake `83589` (Boone), Arkansas River
`78956` and White River `78762` (Desha). Corridors-only: Mississippi
River (empty screen).

**Magazine Mountain is the first Ridge-class row.** Both USGS surfaces
classify the Arkansas high-point mesa as `Ridge` (Signal Hill is its
summit). Rather than misname the class, `js/city-gazetteer.js` gained a
`Ridge` entry (`phys.ridge`, short `RDG`) and the row keeps the GNIS
class with the high-point designation in its note.

**Surface-spelling normalization, not editing.** Saint Louis's county
is "City of Saint Louis" in the Geocoder and "St. Louis (city)" in the
DomesticNames text; the Missouri River's county is "Saint Charles"
vs "St. Charles". The batch-11 test normalizes these spellings when
comparing surfaces; no source string is edited, and the register
records both.

**Process note.** The batch-11 frame entries initially used a stale
entry schema and a text-insert whose tail slice left the previous
last frame unclosed (entries nested inside it); both were caught by
the build/assert chain before any commit, and the insert was rebuilt
against the current schema (entries now assert key-parity with the
previous batch's frames). No committed state was affected.

**Tests.** `tests/city-subsurface.test.mjs` 18/18 — 34-frame list,
batch-11 register deep-equality, per-row FEATURE_ID/name/county
(normalized)/point equality vs the extract, semantic geocoderCounty
asserts including the independent-city special case, Ridge-class
asserts, and empty-screen corridor asserts. `.xdc` packages: 83
entries each. Full suite tally and commit follow below.
