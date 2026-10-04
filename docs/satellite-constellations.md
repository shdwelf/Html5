# Satellite Constellations 4Dwm

Research checked: **30 September 2026**. Continued **4 October 2026** with
launch windows, launch opportunities, and a new `transfer` orbit layer —
see `docs/satellite-launch-windows-research-2026-10-04.md`.

`/satellite-constellations.html` is a new Three.js viewer based on the interaction pattern of `socal-subsurface.html`: fixed canvas, draggable 4Dwm-style PiP panels, layer toggles, dossier panel, minimap, and a timeline slider. It illustrates satellite constellations as **mathematical orbit shells**, not as live satellite tracking.

## What the viewer does

- Draws Earth at a fixed radius and places orbital shells at a **linear radius** using `Earth radius + published altitude`.
- Uses the circular-orbit Kepler period formula:

```txt
T = 2π sqrt(a³ / μ)
a = Earth radius + altitude
μ = 398600.4418 km³/s²
```

- Computes and displays:
  - orbital period,
  - circular-orbit speed,
  - straight-up one-way light time,
  - Earth-central horizon half-angle.
- Uses a year slider from **1957–2032** so the viewer can illustrate the shift from early satellite navigation to large LEO broadband constellations.
- Downsamples very large constellations into proxy markers. For example, Starlink and OneWeb are drawn as representative swarms instead of thousands of individual meshes.
- Draws elliptical launch/transfer orbit classes (GTO, Molniya-type HEO) via the conic equation, and carries a LAUNCH WINDOWS panel: the window taxonomy per mission class plus dated, sourced launch opportunities (`LAUNCH_WINDOWS` in the data pack).

## What the viewer does not do

- No TLE propagation.
- No real-time satellite position or health status.
- No collision / conjunction screening.
- No certified service coverage, latency, brightness, or debris-risk analysis.
- No operational advice for satellite users or operators.

## Included constellation summaries

| Viewer layer | Constellation | Publicly sourced summary used in the model |
| --- | --- | --- |
| Navigation | GPS / Navstar | At least 24 satellites, six orbital planes, ~20,200 km altitude, 55° inclination, roughly 12-hour orbit. |
| Navigation | GLONASS | Nominally 24 satellites, three planes, ~19,100 km altitude, 64.8° inclination. |
| Navigation | Galileo | 30-satellite design, three planes, 23,222 km altitude, 56° inclination. |
| Navigation | BeiDou-3 composite | MEO core around 21,528 km / 55°, plus simplified IGSO and GEO components. |
| Mobile | Iridium NEXT | 66 operational satellites, six near-polar LEO planes, ~780 km altitude. |
| Broadband | Eutelsat OneWeb Gen 1 | 648 satellites at roughly 1,200 km, 12 near-polar planes; drawn with 144 proxy markers. |
| Broadband | Starlink representative shell | SpaceX describes thousands of LEO satellites around 550 km; source page reported over 6,750 in orbit at research time. Drawn as one representative 53° shell with proxy markers, not the full multi-shell system. |
| Earth observation | NOAA JPSS | Polar weather satellites around 512 miles / 824 km, about 101-minute orbits; drawn as a small polar observation series. |
| Launch & transfer | GTO transfer ellipse (illustrative) | 250 × 35,786 km, ~27°, e ≈ 0.73 — the standard GEO delivery ellipse; one marker, not a fleet. |
| Launch & transfer | Molniya-type HEO (illustrative) | 600 × 39,750 km at the 63.4° critical inclination; ~12-hour semi-synchronous ellipses dwelling over high latitudes. |

## Sources consulted

- NASA GPS overview — `https://www.nasa.gov/directorates/somd/space-communications-navigation-program/gps/`
- USCG Navigation Center GPS overview — `https://www.navcen.uscg.gov/global-positioning-system-overview`
- ESA Galileo constellation description — `https://www.esa.int/Space_in_Member_States/Spain/Galileo_una_constelacion_de_30_satelites_de_navegacion`
- GLONASS Information and Analysis Center, constellation parameters — `https://glonass-iac.ru/en/about_glonass/`
- eoPortal BeiDou / Compass summary — `https://www.eoportal.org/satellite-missions/cnss`
- Starlink technology page — `https://www.starlink.com/technology`
- eoPortal OneWeb minisatellite constellation — `https://www.eoportal.org/satellite-missions/oneweb`
- Iridium network overview — `https://www.iridium.com/network`
- eoPortal Iridium NEXT architecture — `https://www.eoportal.org/satellite-missions/iridium-next`
- NOAA JPSS fact sheet — `https://www.nesdis.noaa.gov/s3/2024-12/JPSS-factsheet.pdf`

## Research caveats

1. **Starlink is simplified most aggressively.** The real Starlink network uses multiple shells, generations, insertion orbits, deorbiting spacecraft, active stationkeeping, and ongoing launches. This viewer currently draws a representative low-inclination LEO shell because the goal is to show the mathematical contrast between LEO megaconstellations and MEO/GEO systems.
2. **BeiDou is a composite system.** The viewer includes separate simplified MEO, IGSO, and GEO proxy shells, but not station-kept longitudes or real broadcast status.
3. **Counts are timeline/design summaries.** They are useful for an interpretive timeline, not for exact fleet accounting on any given day.
4. **Coverage is not certified.** The horizon angle formula only shows ideal geometric visibility. Real service depends on power, antennas, frequency plan, masks, ground gateways, inter-satellite links, regulatory constraints, and user terminals.
5. **No current catalog is bundled.** Adding real satellite positions would require a fresh source such as CelesTrak / Space-Track TLEs and an SGP4 propagator, plus source-date labeling and rate limiting.

## Files

- `satellite-constellations.html` — app shell.
- `css/satellite-constellations.css` — dark 4Dwm-style PiP layout.
- `js/satellite-constellations-data.js` — sourced constellation parameters and orbital math helpers.
- `js/satellite-constellations.js` — Three.js rendering, timeline, picking, charts, minimap.
- `tests/satellite-constellations.test.mjs` — data and math checks.

## Validation

```sh
node --test tests/satellite-constellations.test.mjs
node --check js/satellite-constellations-data.js js/satellite-constellations.js
python3 scripts/serve-los-alamos.py --host 0.0.0.0 --port 5173
# open http://localhost:5173/satellite-constellations.html
```
