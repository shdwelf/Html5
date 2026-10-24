# Backlog execution — round 37 (2026-10-24)

**Stream:** T4.1 GNIS state gazetteer coverage — batch 19 (Connecticut + Rhode Island).
**Branch:** `arena/dce0f74e-html5` — stacked on PR #144 (batch 18), same branch.
**Result:** configurations 54–55 of the city-subsurface atlas; 55 frames total.
Three state frames remain: AK, HI, NJ.

## What shipped

- **Connecticut (`connecticut`) and Rhode Island (`rhodeisland`) statewide frames**,
  each with a 12-row all-`VERIFIED=1` USGS GNIS starter register, labelled synthetic
  relief gaussians, generalized context-tier corridors, and no DEM claim.
- **Two-surface verification**, unchanged from batches 7–18: USGS GNIS Geocoder
  screening + staged-products `DomesticNames_<ST>_Text` extracts via GitHub Actions
  (`tools/gnis_extract.py`). Cumulative extract
  `resources/city-subsurface/gnis-candidates-batch7.json` now covers 26 states;
  batch-19 ZIP SHA-256 values: CT `3c1a2f7593…`, RI `72ff852c64…`.
- **The Connecticut River closes its chain:** corridor-only in New Hampshire, Vermont,
  and Massachusetts (batches 17–18, reservoir-only screens), it seeds here on its
  Connecticut mouth record `206425` (Lower Connecticut River Valley Planning Region).
- **High points keep per-ID checks:** Bear Mountain `205348` (2,323 ft, Connecticut's
  highest summit) and Jerimoth Hill `1219566` (812 ft, Rhode Island high point).
  Connecticut's highest *ground* — the Mount Frissell south slope, 2,379 ft — has no
  Connecticut GNIS record (empty `states=CT` screen; summit keys to Massachusetts),
  so the summit/slope distinction is documented rather than blurred.
- **Connecticut county equivalents are planning regions** (county governments were
  abolished in 1960): stored counties reproduce the DomesticNames region strings;
  the Geocoder's full `… Planning Region` forms are preserved per register row.
- **Candlewood Lake is not seeded:** its screen returns only shoreline communities,
  so Bantam Lake and Lake Lillinonah carry the lake rows. The Pawcatuck River screens
  empty under RI and stays a corridor; Farmington River `207042` returned valid but
  was displaced by the three Sound-draining main stems (selection recorded).
- Frozen register: `resources/city-subsurface/gnis-state-batch19-source-register-2026-10-24.json`.

## Verification

- City suite: 30/30 (new batch-19 test; register deep-equal oracle + DomesticNames
  extract cross-checks per seeded `FEATURE_ID`).
- Full Node suite and wiki rebuild: see the final tallies in this branch's commits.

## Next

Batch 20 pairing under decision (NJ+AK, NJ+HI, or AK+HI). After the remaining three
states (AK, HI, NJ): the country/planet thread.
