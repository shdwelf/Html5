# Backlog execution — round 38 (2026-10-24)

**Stream:** T4.1 GNIS state gazetteer coverage — batch 20 (New Jersey + Hawaii).
**Branch:** `arena/dce0f74e-html5` (from `main` at `0ca6497`, the PR #144 merge).
**Result:** configurations 56–57 of the city-subsurface atlas; 57 frames total.
One state frame remains: AK.

## What shipped

- **New Jersey (`newjersey`) and Hawaii (`hawaii`) statewide frames**, each with a
  12-row all-`VERIFIED=1` USGS GNIS starter register, labelled synthetic relief
  gaussians, generalized context-tier corridors, and no DEM claim.
- **Two-surface verification**, unchanged from batches 7–19: USGS GNIS Geocoder
  screening + staged-products `DomesticNames_<ST>_Text` extracts via GitHub Actions
  (`tools/gnis_extract.py`). Cumulative extract
  `resources/city-subsurface/gnis-candidates-batch7.json` now covers 28 states;
  batch-20 ZIP SHA-256 values: NJ `551e673eae…`, HI `fb72d5629b…`.
- **High points keep per-ID checks:** High Point `877098` (Sussex County, 1,803 ft —
  with an adjacent-ID Ocean County community twin `877099` rejected by class) and
  Mauna Kea `366215` (Hawaii County, 13,796 ft).
- **Recorded decisions:** Delaware River corridor-only in NJ (empty `states=NJ`
  screen); Lake Hopatcong seeded on its reservoir record over the same-name
  borough; Kailua seeded on the Hawaii County record over two namesakes; Wailuku
  River seeded on its Hawaii County record over the Maui stream; Mauna Loa kept
  distinct from Maui's one-word Maunaloa records; the Mauna Kea summit lake seeded
  as **Waiau** after `Lake Waiau` screened empty; Elizabeth `876147` and Kahului
  `359843` returned valid but were displaced (selections, not failures). Hawaii's
  diacritic spellings (Līhuʻe, Haleakalā) are stored verbatim — the extract staging
  had to use them literally before the rows would reproduce (22/24 → 24/24).
- Frozen register: `resources/city-subsurface/gnis-state-batch20-source-register-2026-10-24.json`.

## Verification

- City suite: 31/31 (new batch-20 test; register deep-equal oracle + DomesticNames
  extract cross-checks per seeded `FEATURE_ID`).
- Full Node suite and wiki rebuild: see the PR description.

## Next

Batch 21: Alaska alone (the final state frame — largest state, Aleutian chain
crossing the antimeridian, so the frame design needs care). After that: the
country/planet thread.
