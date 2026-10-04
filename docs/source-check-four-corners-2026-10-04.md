# Source check — Four Corners Gazetteer + Orbit — 2026-10-04

This note audits the new `.xdc`; it is not a claim of live launch availability.

## Register sync

- **SoCal Subsurface register:** `docs/socal-usgs-gazetteer.md`, `js/socal-gazetteer-data.js`, and `data/gnis/socal-gazetteer-seed.csv`. The builder preserves the row's name, feature class, county, WGS84 latitude/longitude, and verified/curated tier. A null GNIS id is never fabricated.
- **Cheyenne / Angeles register:** `docs/cheyenne.md` and `js/cheyenne-data.js`, whose `GAZETTEER` arrays are documented as a July 2026 USGS GNIS refresh. The builder carries both plates into the same neutral register but retains `Cheyenne / Colorado` and `Angeles / California` region tags.
- **MRDS distinction:** mine records remain in the Cheyenne app's source theater. The merged Four Corners view is a gazetteer index, not a treasure map and not evidence that a place contains recoverable property.

## Orbital windows

- Sentinel-1 geometry: [ESA Sentinel-1 mission summary](https://sentinel.esa.int/en/web/sentinel/missions/sentinel-1/overview/mission-summary) — 693 km, 98.18°, 12-day single-satellite repeat; the app reports the nominal six-day constellation cadence only when both spacecraft are operational.
- Landsat 9: [USGS Landsat 9 mission](https://www.usgs.gov/landsat-missions/landsat-9) and [USGS acquisitions](https://www.usgs.gov/landsat-missions/landsat-acquisitions) — local crossing time and WRS-2 planning context.
- NISAR: [NASA/JPL mission page](https://nisar.jpl.nasa.gov/) — mission characteristics. The app deliberately does not generate an ephemeris or a guaranteed pass time.

## Launch opportunities

- [Vandenberg Space Force Base, CAS500-2 launch notice](https://www.vandenberg.spaceforce.mil/News/Article-Display/Article/4476202/vsfb-to-support-midnight-launch-and-landing-may-2-3/) establishes the official range as the authority for a published window and illustrates that windows are operationally constrained.
- The October 2026 entries are planning listings from [Space Launch Schedule](https://www.spacelaunchschedule.com/category/vandenberg-sfb/) retrieved 2026-10-04. They are explicitly labeled schedule listings, not official confirmations, and must be rechecked before use.

## Boundary conditions

No live satellite tracking, launch access, or viewing location is promised. The `.xdc` is offline and the orbital layer is a repeat-cycle explainer. “Lost treasure” language is not converted into a location claim; only sourced named places are synchronized.
