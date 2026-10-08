# SOCAL SUBSURFACE 4Dwm

A Three.js theater of Southern California's buried and linear infrastructure —
aqueducts, refined-product and crude/gas trunk lines, rail corridors, geothermal
wellfields, oilfields, desert sites and federal ranges — with draggable PiP
windows for HUD, layers, dossier and a plan-view minimap.

- App shell: `socal-subsurface.html`
- Logic: `js/socal-subsurface.js`
- Data pack: `js/socal-subsurface-data.js`
- Gazetteer pack + engine: `js/socal-gazetteer-data.js` (generated; seed at `data/gnis/socal-gazetteer-seed.csv`), `js/socal-gazetteer.js`
- Styles: `css/socal-subsurface.css`
- Webxdc build: `node scripts/build-socal-subsurface-xdc.mjs` → `socal-subsurface.xdc`
  (staged bundle in `public/apps/socal-subsurface/`)

## What is in the theater

| Layer | Contents |
| --- | --- |
| Terrain | Generalized relief shell for the transect: Sierra south, Tehachapi, San Gabriel/San Bernardino/San Jacinto, Mojave block, Peninsular ranges, LA Basin, San Joaquin floor, Salton Trough, Pacific shelf; now extended north to the Long Valley caldera, Mammoth, Mono Basin and Bodie Hills |
| USGS Gazetteer | 78 curated GNIS / The National Map control points: populated places, summits, gaps, ranges, valleys, basins, lakes, reservoirs and coastal names. Embedded offline from the July 2026 service refresh; search from the HUD |
| Aqueducts | Colorado River Aqueduct (MWD), California Aqueduct / SWP East + West Branch (DWR), Los Angeles Aqueduct (LADWP), Silverwood Lake / San Bernardino Tunnel |
| Refined products | CALNEV Colton → Las Vegas (14"/8", Kinder Morgan) plus the ~55 mi Edwards AFB lateral; SFPP North Line out of Watson/Carson |
| Crude + gas | San Joaquin heavy-crude trunk (Kern → LA refineries); SoCalGas Topock → basin backbone; Las Flores / Gaviota crude pipeline context |
| Rail | Union Pacific LA Sub / ex-LA&SL over Cajon; BNSF Southern Transcon (ex-Santa Fe); Southern Pacific lineage over the Tehachapi Loop; BNSF Cushenbury Branch; Carson & Colorado / SP narrow gauge; Bodie Railway & Lumber Co. |
| Power | Salton Sea Geothermal Field (CalEnergy, ~340–400 MW, the lithium brine), Coso at China Lake, IID collection corridor, Salton Buttes heat source, Big/Little Caliente, Sespe, Long Valley / Casa Diablo |
| GNIS gazetteer | Fixed compiled snapshot (508 entries, 26 classes, 69 FEATURE_ID-verified plus curated community-tier rows) — mast+pin markers with FTT-branch swatches, fuzzy trigram search-name / search-box / search-point ops and a get-capabilities caption. Ten unsupported static Geocache rows were removed; local GPX imports are separate, session-only records. See `docs/socal-usgs-gazetteer.md` |
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

- Search the **HUD · USGS GAZETTEER** box by name, GNIS class, county or theater feature; choose a result to fly to it and open its dossier.
- Drag to orbit, wheel to zoom, right-drag to pan.
- Click a GNIS control, pip, pipe, aqueduct or rail tube → DOSSIER PiP fills with facts + sources.
- **X-RAY** makes the terrain translucent so the buried systems read through it.
- **WIREFRAME** overlays the DEM lattice; **LABELS** toggles the 2D callouts.
- HUD sliders: terrain exaggeration (linear) and depth scale.
- PiP windows drag by their title bar and collapse with the `–` button.
- The GAZETTEER PiP searches the fixed register plus any session-local GPX imports offline: fuzzy name queries
  (pg_trgm-style trigram similarity with prefix/substring boosts), FTT facet
  and GNIS class chips, an **in view** search-box under the camera, and a
  click-to-fly result list whose pins open the full dossier (feature class →
  ADL FTT facet, county, elevation, FEATURE_ID or its absence).
- The PiP also imports user-supplied GPX 1.0/1.1 files locally. Only unique,
  coordinate-valid caches inside the SoCal frame are added to the live map;
  records are tagged as user-supplied and never GNIS-verified. Imports are not
  persisted between sessions. See `docs/geomate-gpx-preservation.md` for
  format, privacy and export limitations.

## Honest scale notes

- Corridors are hand-digitized from public route descriptions (operator maps,
  CEQA/NEPA documents, USGS quads) at roughly **5–15 km accuracy**. They are not
  alignments, not as-builts, not dig tickets. Call 811.
- Terrain is a synthesized gaussian-relief field, not a DEM download — shape is
  right, individual contours are not.
- Gazetteer points are rounded GNIS primary/control locations. For a valley,
  range, basin, lake or channel the point identifies the name; it does **not**
  define the feature's extent. This is a curated landmark set, not every GNIS
  record in the frame. The declared `data/gnis/` seed and Wikidata anchor files
  are absent from this checkout, so the 508-row JS snapshot is not currently
  reproducible; see `docs/socal-usgs-gazetteer.md` before attempting a rebuild.
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
