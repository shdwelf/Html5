# Backlog execution round 46 — 2026-10-25

**Round:** 46 · **Stream/task:** S5 · T5.1 (opener) · **PR:** session branch (`arena/05d57723-html5`, PR #154)

## Position check (parallel-session rule)

- `git fetch origin main` → main at `272e809` (round 44 = S4 complete, merged as PR #152); local merge of `origin/main` completed clean after deepening the fresh shallow clone (its depth-1 history had refused the merge with `unrelated histories`).
- `gh pr list` → round 45 is claimed by open PR #153 (S6 ARPANET). Next free round = **46**.
- Open PRs respected: #155 (S2 sneakers, other session), #153 (S6, other session), #154 (this session's freeze fix), #138, #46. Nobody is on **S5** — the round opens S5/T5.1.

## Scope

S5's static-layer next-action item: the **dish-pointing / satellite-alignment calculator layer**, delivered inside the existing `/satellite-constellations.html` viewer as a new **DISH ALIGNMENT** panel. The live-API inventory (item 1), the fire-lookout + KiwiSDR static layers (item 2 remainder), and the tv.garden/radio.garden pipeline (item 3) stay queued.

## What shipped

- `js/satellite-dish-pointing.js` — pure closed-form GEO look angles: central angle γ, azimuth by great-circle bearing `atan2(sin Δλ, −sin φ · cos Δλ)` (all quadrants, poles, degenerate sub-point → `azimuthDeg: null`), elevation `atan2(cos γ − R/r, sin γ)`, slant range by law of cosines, horizon cut at `acos(R/r)`. GEO radius derived from the viewer's own `MU_EARTH_KM3_S2` and ω_E = 7.2921150e-5 rad/s (≈ 42164 km); sphere R = 6371 km = the viewer's `EARTH_RADIUS_KM`.
- `js/satellite-constellations-data.js` — `DISH_SITES` (5: the worked-example site 52°N 0°, Seattle, Denver, Miami, San Juan city centers with "city-center, not address-level" notes) and `DISH_SLOTS` (4, all with sources: GOES-19 75.2°W GOES-East and GOES-18 137.0°W GOES-West from the NOAA OSPo operations status page (+ WMO OSCAR for GOES-18), GOES-16 storage 104.7°W from WMO OSCAR + orbitalfocus geostationary listing, and IOR 66°E exactly as the lecture example's own figure), plus `dishModelNote`.
- `satellite-constellations.html` + `js/satellite-constellations.js` — new draggable `pipDish` panel: site/slot presets, editable lat/lon/sat inputs, az/el/range/γ readout, compass-needle SVG, horizon status, cited sources per preset, model caveat. Seeds the worked example on first paint.
- `tests/satellite-dish-pointing.test.mjs` — 10 tests (see below).

## Validation (S5 honesty rules)

- **Worked example reproduced:** 52°N 0° → 66°E gives az **109.33°**, el **5.85°** within 0.05° of the published SPU lecture answer (the 0.05° slack covers its 6378 km sphere vs this viewer's 6371 km, disclosed in-panel).
- **Two independent derivations agree:** the module's spherical form vs the classic `atan((cos φ cos Δλ − k)/√(1 − cos²φ cos²Δλ))` to 1e-9° across a grid, and vs an ECEF→ENU vector implementation (test-local) to 1e-6° az/el, 1e-4 km range.
- **Geometry pins:** equator east/west azimuths exact (90/270), NH due-south 180, SH due-north 0, sub-point el 90 with `azimuthDeg: null` and range = r − R, horizon arc 81.2–81.4° (lecture's 81.3°), far slots correctly below the horizon.
- **Disclosures carried in the model note:** sphere vs published 6378 km examples (~0.1°), slots are published assignments checked 2026-10-25 and drift, terrain/structures/magnetic-north/LNB skew unmodelled — "not a substitute for a meter at the dish". No live tracking, no TLEs, no coverage claims — consistent with the viewer's standing footer.

## Verification

- `node --test tests/satellite-dish-pointing.test.mjs` → **10/10 pass** (full-suite numbers recorded at commit time in the PR).
- `acorn` ES-module parse of the three touched JS files → clean.
- Vite dev server screens `/satellite-constellations.html` (panel live).

## Next (recorded for round 47+)

1. S5 API inventory + adapters (cad.chp.ca.gov, Caltrans/state DOT cameras, WildCAD, NIFC, WiFire, WREN, liveuamap, NOTAMs) with fixture contract tests — live endpoints only where lawfully readable.
2. Static layers: fire lookouts, KiwiSDR/SDR receiver locations.
3. tv.garden / radio.garden transcription pipeline + PR.

## Status effect

- S5: `open` → **partial**; T5.1: `open` → **partial** (calculator layer done; inventory/lookouts/KiwiSDR/tv-garden remain).
