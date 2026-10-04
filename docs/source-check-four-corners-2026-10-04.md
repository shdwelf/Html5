# Source check — Four Corners Gazetteer + Orbit — 2026-10-04

This note audits the new `.xdc`; it is not a claim of live launch availability.

## Register sync

- **SoCal Subsurface register:** `docs/socal-usgs-gazetteer.md`, `js/socal-gazetteer-data.js`, and `data/gnis/socal-gazetteer-seed.csv`. The builder preserves the row's name, feature class, county, WGS84 latitude/longitude, and verified/curated tier. A null GNIS id is never fabricated.
- **Cheyenne / Angeles register:** `docs/cheyenne.md` and `js/cheyenne-data.js`, whose `GAZETTEER` arrays are documented as a July 2026 USGS GNIS refresh. The builder carries both plates into the same neutral register but retains `Cheyenne / Colorado` and `Angeles / California` region tags.
- **MRDS distinction:** mine records remain in the Cheyenne app's source theater. The merged Four Corners view is a gazetteer index, not a treasure map and not evidence that a place contains recoverable property.

## Minimal USGS DEM probe

The Four Corners extension does not ship a large raster. It exposes four Gazetteer-linked point probes and, on user action, queries the USGS **Elevation Point Query Service (EPQS)** endpoint: `https://epqs.nationalmap.gov/v1/json`. USGS documents EPQS as returning elevations interpolated from the 3DEP dynamic elevation service, including 1 m lidar DEMs where available and 1/3 arc-second seamless DEMs: [USGS Maps and Mapping FAQ](https://www.usgs.gov/science/faqs/maps-and-mapping?page=5).

- Colorado is seeded from the repository's local USGS 3DEP control point for Pikes Peak (`js/cheyenne-dem-data.js`, fetched 2026-10-02).
- Utah, Arizona, and Nevada retain only coordinates in the offline bundle; their elevations are intentionally blank until a live EPQS query succeeds.
- A returned point value is labeled as an EPQS point sample, not a downloaded DEM tile or a survey. Failed network requests remain visibly unavailable.

## CORS / proxy deep dive

The browser path now tries three first-party USGS alternatives in order:

1. `https://epqs.nationalmap.gov/v1/json` — current EPQS JSON endpoint.
2. `https://nationalmap.gov/epqs/pqs.php` — legacy EPQS compatibility path, retained as a fallback only.
3. `https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/getSamples` — ArcGIS ImageServer point sampling against the current 3DEP dynamic service.

The app first tries these directly. If the host blocks cross-origin requests, the user may provide a proxy URL template containing `{url}`, for example `https://corsproxy.io/?url={url}` or an organization-controlled relay. The app URL-encodes the complete USGS request and never sends a request through a public proxy unless the user explicitly enters that template.

Public CORS proxies are an availability and privacy risk: they can log coordinates, rate-limit, rewrite responses, or disappear. They are not treated as authoritative data sources, and the source displayed in the app remains the USGS endpoint. A same-origin relay under the deployer's control is preferable. The offline webxdc cannot embed a server-side proxy; the direct path and local seed therefore remain the honest fallback.

Alternative paths investigated:

- USGS 3DEP ImageServer supports REST, WMS, WCS, and `getSamples`; this is the best no-key alternative for point queries and small map exports: [3DEPElevation ImageServer](https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer).
- The National Map download/TNM Access API is appropriate for downloading a real DEM tile, not for a four-point browser probe: [USGS GIS Data Download](https://www.usgs.gov/the-national-map-data-delivery/gis-data-download).
- OpenTopography exposes USGS 3DEP rasters but requires a free API key for the public API, so it is not embedded as an anonymous fallback: [OpenTopography 3DEP API](https://opentopography.org/news/api-access-usgs-3dep-rasters-now-available).

## Orbital windows

- Sentinel-1 geometry: [ESA Sentinel-1 mission summary](https://sentinel.esa.int/en/web/sentinel/missions/sentinel-1/overview/mission-summary) — 693 km, 98.18°, 12-day single-satellite repeat; the app reports the nominal six-day constellation cadence only when both spacecraft are operational.
- Landsat 9: [USGS Landsat 9 mission](https://www.usgs.gov/landsat-missions/landsat-9) and [USGS acquisitions](https://www.usgs.gov/landsat-missions/landsat-acquisitions) — local crossing time and WRS-2 planning context.
- NISAR: [NASA/JPL mission page](https://nisar.jpl.nasa.gov/) — mission characteristics. The app deliberately does not generate an ephemeris or a guaranteed pass time.

## Launch opportunities

- [Vandenberg Space Force Base, CAS500-2 launch notice](https://www.vandenberg.spaceforce.mil/News/Article-Display/Article/4476202/vsfb-to-support-midnight-launch-and-landing-may-2-3/) establishes the official range as the authority for a published window and illustrates that windows are operationally constrained.
- The October 2026 entries are planning listings from [Space Launch Schedule](https://www.spacelaunchschedule.com/category/vandenberg-sfb/) retrieved 2026-10-04. They are explicitly labeled schedule listings, not official confirmations, and must be rechecked before use.

## Boundary conditions

No live satellite tracking, launch access, or viewing location is promised. The `.xdc` is offline and the orbital layer is a repeat-cycle explainer. “Lost treasure” language is not converted into a location claim; only sourced named places are synchronized.
