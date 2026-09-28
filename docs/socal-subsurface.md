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
| Terrain | Generalized relief shell for the transect: Sierra south, Tehachapi, San Gabriel/San Bernardino/San Jacinto, Mojave block, Peninsular ranges, LA Basin, San Joaquin floor, Salton Trough, Pacific shelf; now extended north to the Long Valley caldera, Mammoth, Mono Basin and Bodie Hills |
| Aqueducts | Colorado River Aqueduct (MWD), California Aqueduct / SWP East + West Branch (DWR), Los Angeles Aqueduct (LADWP), Silverwood Lake / San Bernardino Tunnel |
| Refined products | CALNEV Colton → Las Vegas (14"/8", Kinder Morgan) plus the ~55 mi Edwards AFB lateral; SFPP North Line out of Watson/Carson |
| Crude + gas | San Joaquin heavy-crude trunk (Kern → LA refineries); SoCalGas Topock → basin backbone; Las Flores / Gaviota crude pipeline context |
| Rail | Union Pacific LA Sub / ex-LA&SL over Cajon; BNSF Southern Transcon (ex-Santa Fe); Southern Pacific lineage over the Tehachapi Loop; BNSF Cushenbury Branch; Carson & Colorado / SP narrow gauge; Bodie Railway & Lumber Co. |
| Power | Salton Sea Geothermal Field (CalEnergy, ~340–400 MW, the lithium brine), Coso at China Lake, IID collection corridor, Salton Buttes heat source, Big/Little Caliente, Sespe, Long Valley / Casa Diablo |
| Sites | Ducommun (1849 — oldest continuously operating business in California), El Mirage Dry Lake (the *Con Air* "Lerner Airfield" set), Kern River Oil Field (1899, Bakersfield), Midway-Sunset / Lakeview Gusher, Knapp's Castle, Solvang, Mammoth Mountain Resort, Bodie / Mono Mills |
| Bases | Edwards AFB, Fort Irwin NTC, NAWS China Lake, MCAGCC Twentynine Palms |
| Trails | Pacific Crest Trail now drawn north to the Yosemite edge; John Muir Trail generalized from Happy Isles to Mount Whitney |
| Roads | Silverwood → Arrowhead / Arrowbear / Big Bear backside → Lucerne Valley → US 395 → Mammoth / June Lake / Mono Lake / Bodie; June Lake Loop; Rim of the World / backside route |
| Aviation | San Bernardino International, Big Bear City, Mammoth Yosemite, Eastern Sierra Regional, Victorville SCLA, Apple Valley, Hesperia, and Mountains Community Hospital Heliport |
| Harbors | Port of Los Angeles, Port of Long Beach, Port Hueneme, Santa Barbara Harbor |
| Offshore | THUMS Islands; Platform Holly; Santa Ynez Unit platforms Hondo / Harmony / Heritage; Point Arguello platforms Hidalgo / Harvest / Hermosa; subsea gathering lines and Line 901/903 / Las Flores pipeline context |
| Industry | Mitsubishi Cement's Cushenbury plant and its rail-served limestone / cement backside to Big Bear |


## September 2026 north-and-offshore extension

This pass widened the theater from a Southern California basin plate to a basin +
Eastern Sierra + Santa Barbara Channel plate. The frame now reaches Bodie and
Mono Lake, so the former JMT off-frame entry was removed and the JMT itself is
drawn as a generalized Yosemite-to-Whitney trace.

New reading lines and sites:

- `silverwood-bodie-route`: a field route, not an engineered utility line, from
  Silverwood Lake through Arrowhead, Arrowbear, Big Bear's backside, the
  Cushenbury cement works, US 395, Mammoth, June Lake, Mono Lake and Bodie.
- `bnsf-cushenbury-branch`: the rail spur that makes Mitsubishi Cement legible
  as a bulk-material plant rather than just a dot on SR 18.
- `june-lake-loop`: the SR 158 resort loop under Carson Peak.
- `carson-colorado` and `bodie-mono-mills-rail`: the two narrow-gauge stories
  that explain why Bodie needed a timber railroad and why Owens Valley had a
  separate rail economy.
- `syu-offshore-gathering`, `point-arguello-gathering`, `lasflores-901-903`,
  and `thums-harbor-oil`: offshore steel tied to onshore pipes and ports.

The same warning applies more strongly offshore: platform and pipeline traces
are schematic register lines. They are not navigation, survey, lease-boundary or
excavation data.

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
