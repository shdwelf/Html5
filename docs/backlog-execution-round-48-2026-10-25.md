# Backlog execution round 48 — 2026-10-25 (S5 opened: live-layer inventory, dish-pointing, normalizers)

Per the user's order — continue the backlog first, then merge the pull
request. S5 was the only stream still fully *open*; this round opens
it with the pieces that are buildable and verifiable offline.

## Shipped

- `docs/s5-live-layers-inventory-2026-10-25.md` — the named S5 sources
  with their real access patterns: CHP CAD (public per-center HTML at
  cad.chp.ca.gov, no documented JSON API), Caltrans QuickMap/DOT
  cameras, WildCAD-E (agency CAD — explicitly *not* a public feed),
  NIFC WFIGS public ArcGIS services, WiFire, liveuamap, NOTAMs,
  lookouts, KiwiSDR. "WREN cameras" is flagged as an unverified
  referent rather than guessed.
- `js/dish-pointing.js` + `dish-pointing.html` — the backlog's
  dish-pointing/satellite-alignment calculator: GEO azimuth/elevation/
  range/visibility and visible-arc span, spherical-Earth limits stated
  in the output. Known answers verified (overhead el 90° / 35,793 km;
  LA→GOES-West az 211.5°, el 45.5°; antipode invisible).
- `js/incident-adapters.js` — feed-agnostic layer normalization
  (`incident|camera|fire|lookout|sdr|notam`): validation with loud
  rejections (including (0,0) placeholders), dedupe-newest, stale
  filter, radius queries, ArcGIS-point adapter with caller field map.

## Honesty boundaries

- No live fetching: S5 endpoints are outside the sandbox allowlist
  (F3); capture is runner/relay work, queued in the inventory doc.
- All test fixtures are synthetic and say so; no live record, camera
  image, or agency data is bundled.
- Viewer wiring for the S4 surfaces is a deliberate follow-up, not
  bolted on here.

## Test evidence

- `tests/dish-pointing.test.mjs` 5/5, `tests/incident-adapters.test.mjs`
  5/5. Full suite: see the PR body (runs before merge).
