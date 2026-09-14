# BlueTops GSO — extracted source data

Snapshot data powering [`bluetops-gso-4dwm.html`](../../bluetops-gso-4dwm.html),
extracted 2026-09-11 from official U.S. Government sources.

| File | Source | Method |
| --- | --- | --- |
| `awards.json` | **FPDS-NG public ATOM feed** (`https://www.fpds.gov/ezsearch/FEEDS/ATOM`, template 1.5.3) | `CONTRACTING_OFFICE_ID:"47*"` + `LAST_MOD_DATE:[2026/08/01,2026/09/10]`, pages start=0…80. Winning contracts = new awards and funded modifications signed by GSA contracting offices (FAS `47Q*`/`GS*`, PBS `47PA*`/`47P*`, HQ `47H*`). Vendor name/UEI, street address, PIID, mod number, signed date, action amounts, PSC/NAICS, funding department were parsed from each feed entry. |
| `dem.json` | **USGS 3DEP Program** ImageServer (`https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/identify`) | One `identify` per geocoded point and per route sample; values are meters (NAVD88 composite). 34 samples. |
| `register.json` | **Federal Register API v1** (`https://www.federalregister.gov/api/v1/documents.json`) | term "General Services Administration" + agency GSA, newest first. |

Notes:

* FPDS contract search moved to SAM.gov on 2026-02-24; the SAM.gov Contract
  Awards API requires a personal API key, so the still-live FPDS ATOM feed was
  used for key-less extraction. The app's **LIVE USASPENDING** button tries a
  client-side `spending_by_award` POST against `api.usaspending.gov` and merges
  whatever returns.
* Geocoding: vendor-reported FPDS street addresses → city-block centroids
  (built-in table). The app can refine live with the Census geocoder / USGS
  3DEP when the browser's CORS allows it.
* Globe vertical exaggeration is ×400; raw meters are stored here.

## Webxdc packaging

`npm run build:bluetops` (→ `scripts/build-bluetops-xdc.mjs`) packages the app
as [`bluetops-gso-4dwm.xdc`](../../bluetops-gso-4dwm.xdc), a Webxdc ZIP rooted at
`index.html` + `manifest.toml` + `icon.png`, following the repo's existing
`build-xdc.mjs` conventions (deflate-9, fixed mtime → reproducible bytes).

The build bundles `js/bluetops-gso-4dwm.js` (app + vendored three.js +
OrbitControls) with esbuild, inlines the CSS, and embeds all four datasets
(awards / DEM / register / coastlines) as `window.__BLUETOPS_DATA__`, because
messenger webxdc sandboxes (Delta Chat / ArcaneChat) block external network
access — inside a messenger the app therefore runs fully offline from the
snapshot; over plain HTTP the same code path falls back to fetching
`data/bluetops/*.json` and the live-refresh buttons become active.
