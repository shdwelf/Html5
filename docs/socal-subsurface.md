# SOCAL SUBSURFACE 4Dwm

A Three.js theater of Southern California's buried and linear infrastructure —
aqueducts, refined-product and crude/gas trunk lines, rail corridors, geothermal
wellfields, oilfields, desert sites and federal ranges — with draggable PiP
windows for HUD, layers, dossier and a plan-view minimap.

- App shell: `socal-subsurface.html`
- Logic: `js/socal-subsurface.js`
- Data pack: `js/socal-subsurface-data.js`
- Styles: `css/socal-subsurface.css`
- Webxdc build: `node scripts/build-socal-subsurface-xdc.mjs` → `socal-subsurface.xdc`
  (staged bundle in `public/apps/socal-subsurface/`)

## What is in the theater

| Layer | Contents |
| --- | --- |
| Terrain | Generalized relief shell for the transect: Sierra south, Tehachapi, San Gabriel/San Bernardino/San Jacinto, Mojave block, Peninsular ranges, LA Basin, San Joaquin floor, Salton Trough, Pacific shelf |
| Aqueducts | Colorado River Aqueduct (MWD), California Aqueduct / SWP East + West Branch (DWR), Los Angeles Aqueduct (LADWP) |
| Refined products | CALNEV Colton → Las Vegas (14"/8", Kinder Morgan) plus the ~55 mi Edwards AFB lateral; SFPP North Line out of Watson/Carson |
| Crude + gas | San Joaquin heavy-crude trunk (Kern → LA refineries); SoCalGas Topock → basin backbone |
| Rail | Union Pacific LA Sub / ex-LA&SL over Cajon; BNSF Southern Transcon (ex-Santa Fe); Southern Pacific lineage over the Tehachapi Loop |
| Power | Salton Sea Geothermal Field (CalEnergy, ~340–400 MW, the lithium brine), Coso at China Lake, IID collection corridor, Salton Buttes heat source |
| Sites | Ducommun (1849 — oldest continuously operating business in California), El Mirage Dry Lake (the *Con Air* "Lerner Airfield" set), Kern River Oil Field (1899, Bakersfield), Midway-Sunset / Lakeview Gusher |
| Bases | Edwards AFB, Fort Irwin NTC, NAWS China Lake, MCAGCC Twentynine Palms |

## Controls

- Drag to orbit, wheel to zoom, right-drag to pan.
- Click a pip, pipe, aqueduct or rail tube → DOSSIER PiP fills with facts + sources.
- **X-RAY** makes the terrain translucent so the buried systems read through it.
- **WIREFRAME** overlays the DEM lattice; **LABELS** toggles the 2D callouts.
- HUD sliders: terrain exaggeration (linear) and depth scale.
- PiP windows drag by their title bar and collapse with the `–` button.

## Honest scale notes

- Corridors are hand-digitized from public route descriptions (operator maps,
  CEQA/NEPA documents, USGS quads) at roughly **5–15 km accuracy**. They are not
  alignments, not as-builts, not dig tickets. Call 811.
- Terrain is a synthesized gaussian-relief field, not a DEM download — shape is
  right, individual contours are not.
- **Depth is logarithmic.** A products line at 1.5 m and a geothermal
  production zone at 2,000 m cannot share a linear axis on a 700 km stage, so
  `depthY()` compresses with a log10 ramp. Ordering and magnitude survive;
  absolute spacing does not. The dossier always shows the real figure.

## Evidence tiers

Same hygiene as the other 4Dwm theaters in this repo:

- **official** (amber) — operator or agency published fact
- **community** (cyan) — well-documented public/secondary sourcing
- **context** (magenta) — schematic terrain or corridor context only

## Webxdc

`scripts/build-socal-subsurface-xdc.mjs` stages the sources into
`public/apps/socal-subsurface/`, injects a `webxdc.js` simulator shim (the host
replaces it at runtime), writes `manifest.toml`, and zips deterministically to
`socal-subsurface.xdc` (also copied to `dist/`). Inside Delta Chat the app
broadcasts selections as status updates, so a chat can walk the same corridor
together; outside a host it degrades to a plain offline page. No network calls,
no external assets — Three.js is vendored.
