# Backlog execution round 49 — 2026-10-25

**Round:** 49 · **Stream/task:** S5 · T5.1 (continuation after round 48) · **PR:** session branch (`arena/05d57723-html5`, PR #154)

> **Renumber note:** originally written as "round 46" before the parallel-session merge; main then took 46 (S2 sneakers), 47 (gateway), and 48 (S5 opener) while PR #154 was open, so this record was renumbered to **49** per the conflict rule (main keeps its numbering; this round moves to the next free slot).

## Position check (parallel-session rule)

- Pre-merge: rounds 40–44 were on main (`272e809`); round 45 was claimed by open PR #153 (S6 ARPANET), and this session originally took the then-free **46**.
- During PR #154's open window, main advanced: **round 46** (S2 sneakers, PR #155), **round 47** (Riseup VPN × InviZible gateway), **round 48** (S5 opener — source inventory, feed normalizers, standalone dish calculator). Merging `origin/main` into the branch surfaced wiki conflicts only (`docs.json` / `wikiinajar.xdc`, resolved main-preferred then rebuilt) — code paths were disjoint.
- Reconciliation: main's numbering, records, and tests kept as-is; this round renumbered **46 → 49** (next free), its S5-**opener** claim corrected (round 48 opened S5), and round-48 evidence folded into the backlog fields round 48 left untouched (JSON `next_actions` / `T5.1` note).

## Scope

Complement to round 48's opener: that round shipped the live-layer inventory ([`s5-live-layers-inventory-2026-10-25.md`](s5-live-layers-inventory-2026-10-25.md)), the feed-agnostic normalizers (`js/incident-adapters.js`), and a **standalone** dish calculator (`dish-pointing.html` + `js/dish-pointing.js`). This round delivers the **in-viewer** half of S5's "dish-pointing / satellite-alignment calculator layer": the calculator as an integrated layer inside the existing `/satellite-constellations.html` theater, with its own independent validation chain and cited GEO-slot presets. The two implementations coexist deliberately — different host apps (standalone page vs viewer panel), different modules, different test files, no duplicate generation; neither replaces the other. Still queued: fire-lookout + KiwiSDR static layers, live capture (F3 runner work per round 48), viewer wiring for the incident layers, tv.garden/radio.garden.

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
