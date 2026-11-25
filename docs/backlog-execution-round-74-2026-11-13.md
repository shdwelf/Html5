# Backlog execution — round 74 (2026-11-13)

## S5 follow-up: local incident and sensor snapshots

Round 73 called the sandbox backlog terminal, but the S5 register and
[`s5-live-layers-inventory-2026-10-25.md`](s5-live-layers-inventory-2026-10-25.md)
explicitly still listed **viewer wiring** after the feed normalizers. This
round closes that local viewer follow-up on the existing PR #215 (Linear
ENS-8). It does **not** claim that any external agency feed has been
captured, that a raw feed is a public API, or that an imported record is live.

- The Planet Viewer (`planet-viewer-4dwm.html`) accepts a **user-selected**
  canonical JSON snapshot. Its S5 section shows the capture timestamp, accepted
  counts, duplicate count, and explicit invalid/stale rejection reasons. Users
  can filter by kind, inspect records from the list or click globe markers,
  and clear all imported data. Markers appear on the orthographic globe only;
  terrain and PC Globe index plates are not misrepresented as incident maps.
- `js/incident-snapshot.js` uses the existing `js/incident-adapters.js`
  contract and enforces a 1 MiB / 2,000-record cap, required schema/version
  and UTC capture time, finite coordinates and timestamps, dedupe by
  `(sourceId, kind, id)`, and a 24-hour expiry for incident/fire/camera/NOTAM
  records. Lookout/SDR points may be older but remain labelled with the
  snapshot date. Invalid or future records cannot overwrite a valid earlier
  copy. No record is automatically requested, uploaded, or persisted.
- The mirrored `public/apps/planet-viewer/` offline entrypoint was regenerated
  with `node scripts/build-planet-viewer-offline-app.mjs`. The legacy
  `planet-viewer-4dwm.xdc` is a **SoCal** compatibility artifact and was not
  repurposed; nothing was added to the privacy-sensitive offline viewer
  allowlist.

### Canonical input (example shape; synthetic records only)

```json
{
  "schema": "html5-incident-snapshot-v1",
  "capturedAt": "2026-11-13T12:00:00.000Z",
  "records": [
    {
      "id": "synthetic-1",
      "kind": "lookout",
      "title": "Synthetic test lookout",
      "lat": 34.1,
      "lon": -118.2,
      "updatedEpochMs": 1794571200000,
      "sourceId": "synthetic-fixture"
    }
  ]
}
```

For dynamic kinds, replace both dates with the real authorized capture time
and record update time; a dated example will expire after 24 hours. The input
is **already normalized**, not raw CHP HTML or ArcGIS projected geometry.
Only authorized F3 runners may fetch and normalize upstream sources. Camera
images and record URLs are never fetched by the viewer. For real emergencies,
consult the responsible agency directly rather than this offline snapshot.

## Verification

- `node --test tests/incident-adapters.test.mjs tests/incident-snapshot.test.mjs tests/planet-viewer-offline-app.test.mjs` — **14/14 pass**.
- `node --test tests/incident-adapters.test.mjs tests/incident-snapshot.test.mjs tests/planet-viewer.test.mjs tests/planet-viewer-search.test.mjs` — **35/35 pass**.
- `node tests/planet-viewer-browser.mjs` (Chromium/SwiftShader) — **13/13 pass**: live WebGL/plate regressions and a synthetic snapshot import with rejected records, far-hemisphere filtering, marker click, string-only rendering of an HTML-looking title, kind filter, invalid-file handling, clear, and no outbound requests on import.
- `node --test tests/offline-viewer.test.mjs tests/html5-offline-launcher.test.mjs tests/incident-adapters.test.mjs` — retained baseline **18/18** (rerun before merge).

## Remaining boundary

S5 live CHP CAD/WFIGS/Caltrans etc. captures and agency rights remain
externally gated under F3. The UI works offline from explicitly provided
canonical snapshots; it does not imply that these feeds are integrated or
fresh. F1/F2/F3/F4 standing decisions remain unchanged.
