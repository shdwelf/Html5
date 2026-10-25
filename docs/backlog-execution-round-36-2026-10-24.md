# Backlog execution — round 36 (2026-10-24)

**Stream:** T4.1 GNIS state gazetteer coverage — batch 18 (Maine + Massachusetts).
**Branch:** `arena/dce0f74e-html5` (from `main` at `bb92f04`, the PR #143 merge).
**Result:** configurations 52–53 of the city-subsurface atlas; 53 frames total.
Five state frames remain without a statewide frame: AK, CT, HI, NJ, RI.

## What shipped

- **Maine (`maine`) and Massachusetts (`massachusetts`) statewide frames**, each with
  a 12-row all-`VERIFIED=1` USGS GNIS starter register, labelled synthetic relief
  gaussians, generalized context-tier corridors, and no DEM claim.
- **Two-surface verification**, unchanged from batches 7–17: every seeded row was
  screened on the USGS GNIS Geocoder (exact official name, grouped type, state,
  county, `FEATURE_ID`, returned GNIS primary point) and reproduced on the
  staged-products `DomesticNames_<ST>_Text` extract run in GitHub Actions
  (`tools/gnis_extract.py`). Cumulative extract
  `resources/city-subsurface/gnis-candidates-batch7.json` now covers 24 states;
  batch-18 ZIP SHA-256 values: ME `487e81d9af…`, MA `4803f0a17…`.
- **High points keep per-ID Domestic Names checks:** Mount Katahdin `579940`
  (Piscataquis County, 5,270 ft, Maine high point) and Mount Greylock `607448`
  (Berkshire County, 3,491 ft, Massachusetts high point). The text layout carries
  no elevation columns, so the elevations cite USGS-published references.
- **River closures:** the Androscoggin (`580918`), Saco (`574648`), and Merrimack
  (`619363`) main stems — corridor-only under New Hampshire in batch 17 — seed here
  on their Maine/Massachusetts mouth records. The Connecticut River returns only
  `Connecticut River Reservoir` impoundments under MA as well: its fourth
  consecutive corridor-only frame (NH, VT, MA), pending its Connecticut record.
- **Adjacency decisions recorded:** Sebago Lake seeds on the lakes record
  (`575155`); the populated-place twin (`575156`), Provincetown Harbor (`616640`
  beside `616639`), and New Bedford Reservoir (`613715` beside `613714`) are
  rejected by class, county, and point — never by ID sequence.
- Frozen register: `resources/city-subsurface/gnis-state-batch18-source-register-2026-10-23.json`.

## Verification

- City suite: 29/29 (new batch-18 test; register deep-equal oracle + DomesticNames
  extract cross-checks per seeded `FEATURE_ID`).
- Full Node suite, wiki rebuild, and PR: see the PR description.

## Next

Batch 19 pairing under decision (CT+RI recommended: the Connecticut River's mouth
record lives in Connecticut, which would close the corridor chain; NJ+AK/HI are
the alternatives). After the remaining five states: the country/planet thread.
