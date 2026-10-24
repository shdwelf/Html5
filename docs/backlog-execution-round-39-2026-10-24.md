# Backlog execution — round 39 (2026-10-24)

**Stream:** T4.1 GNIS state gazetteer coverage — batch 21 (Alaska, single-state).
**Branch:** `arena/6885d4c7-html5` (from `main` at `0ca6497`, the PR #144 merge).
**Result:** configuration 56 of the city-subsurface atlas on this branch line.
New Jersey and Hawaii remain carried by the open PR #145; when it merges, every
US state has a statewide frame.

## What shipped

- **Alaska (`alaska`) statewide frame** with a 12-row all-`VERIFIED=1` USGS GNIS
  starter register, labelled synthetic relief gaussians, generalized context-tier
  corridors, and no DEM claim.
- **Two-surface verification**, unchanged from batches 7–20: USGS GNIS Geocoder
  screening + staged-products `DomesticNames_AK_Text` extract via GitHub Actions
  (`tools/gnis_extract.py`), ZIP SHA-256 `46c00418af…`; all 12 seeded
  `FEATURE_ID`s reproduced at the stored points.
- **The summit name, handled as evidence:** the per-ID-checked high point
  (`1414314`, Denali Borough, 20,310 ft) is seeded under the current official GNIS
  name **Mount McKinley** — renamed Denali in 2015, restored by federal action in
  2025. A `states=AK` screen for `Denali` returns the borough, Denali Park, and
  Denali Pass but no summit record. The row note preserves both names and dates;
  identity rests on FEATURE_ID/class/county/point.
- **Recorded decisions:** Utqiaġvik stores its decomposed combining-dot diacritic
  exactly as the extract stores it (the literal-staging precedent from Līhuʻe);
  extract county strings (shortened boroughs, `(CA)` census areas) are stored
  verbatim with full Geocoder county forms preserved per row; the far-western
  Aleutians across the antimeridian are outside the -171..-129.85 frame and
  disclosed, with Unalaska as the Aleutian anchor; Mount Foraker `1402265`
  returned valid but was displaced by the one-summit starter register.
- Frozen register: `resources/city-subsurface/gnis-state-batch21-source-register-2026-10-24.json`.

## Verification

- City suite: 31/31 on this branch line (new batch-21 test; register deep-equal
  oracle + DomesticNames extract cross-checks, including the per-county Geocoder
  county-string map).
- Full Node suite and wiki rebuild: see the PR description.

## Next

Merge PR #145 (NJ+HI) to complete the 50-state set at 58 frames, then the
country/planet thread.
