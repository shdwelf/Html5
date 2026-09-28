# Terrain + vector overlay deep dive

Companion to `docs/socal-subsurface.md`. What the overlay layer is, where the
real data lives, and exactly what in this app is synthetic.

---

## 1. The overlay layer

`js/socal-overlays.js` + `js/socal-overlays-data.js` add four draped vector
overlays on the same terrain surface the infrastructure theater uses. They all
go through `js/socal-geo.js` — one projection, one elevation field — so nothing
floats off the hillsides.

| Overlay | What it draws | Default |
| --- | --- | --- |
| `fires` | 12 historical fire perimeters, coloured by decade the way FRAP symbolizes its own layer | on |
| `demTile` | 1° × 1° 3DEP DEM delivery tiles | on |
| `quad` | USGS 7.5-minute quadrangle graticule (0.125°) | off |
| `sar` | Sentinel-1-style descending swath at true 250 km width + three InSAR deformation bowls | off |
| `clui` | Center for Land Use Interpretation register captions | off |

### The Cajon result

The reason the fire layer and the pipe layer are in one scene: select the
**CALNEV Edwards AFB lateral** or the **Edwards / Victor Valley gas feeder** and
the dossier computes the intersection live, by point-in-ring sampling at 0.01°:

```
CALNEV Edwards lateral   19 km of plotted route inside the Blue Cut perimeter (115 km total)
Edwards gas feeder       18 km inside                                         (113 km total)
California Aqueduct SWP  14 km inside
CALNEV main stem          9 km inside
UP Los Angeles Sub        2 km inside
```

Both Edwards feeds load *uphill* out of the basin through Cajon Pass and both
climb through ground the Blue Cut Fire burned over on 16 August 2016. Turn on
the FLOW beads to see the direction of load.

---

## 2. Fire perimeters — WIFIRE and CAL FIRE FRAP

**Authoritative sources**

- **WIFIRE Firemap** — UC San Diego / San Diego Supercomputer Center. Real-time
  and archival fire data, Firemap model runs, perimeter feeds.
- **CAL FIRE FRAP** (Fire and Resource Assessment Program) — the `firep` series,
  the canonical California historical perimeter database, **fires back to 1878**,
  as of the 2026 release `firep25_1`. Published as GeoJSON / shapefile / GDB /
  GeoPackage on `data.ca.gov` and the CNRA ArcGIS Hub.
- Collection criteria worth knowing before you draw conclusions from it:
  CAL FIRE submits perimeters ≥10 acres in timber, ≥50 acres in brush, ≥300
  acres in grass, and/or ≥3 structures impacted, and/or ≥1 fatality. Small fires
  are structurally absent. NIFC's national set differs.

**What this app ships instead, and why.** The app makes zero network calls, so
it cannot pull FRAP at runtime. Each fire is stored as *centroid + published
acreage + orientation*, and `fireRing()` synthesizes a deterministic organic
ring which is then uniformly scaled so its **planar area equals the published
acreage exactly** (verified: all 12 rings hit target to 0.1 km²). Location,
year, size, orientation and narrative are real. The wiggle of the line is not.
`FIRE_SOURCE_URLS` is the drop-in list for true geometry.

**Blue Cut Fire, the reference case.** Reported 10:36 AM, 16 August 2016, on Old
Cajon Blvd north of Kenwood Ave, west of I-15. Spotted across Cajon Creek and
ran: 18,000 acres within ~12 hours, ~82,600 people under evacuation orders,
I-15 closed, the Summit Inn burned, a freight crew abandoned their train. The
mapped size went **30,000 → 25,626 → 31,689 → ~36,274 acres** as infrared
flights replaced smoothed hand-drawn line. That sequence is the single best
argument for treating any perimeter as a timestamped estimate with a lineage,
not a fact.

---

## 2b. Getting the real gas pipeline maps

The operator is right that the gas company has detailed maps. The question is
which of them a member of the public can actually hold.

**PHMSA National Pipeline Mapping System (NPMS)** — US DOT, Office of Pipeline
Safety. The only complete non-commercial source of transmission pipeline
geometry. Operator submission is **mandatory and annual**.

| Access route | Who | What you get | Export? |
| --- | --- | --- | --- |
| **Public Map Viewer** (`npms.phmsa.dot.gov/PublicViewer`) | anyone | Gas transmission + hazardous-liquid trunk lines, **one county per session**, max scale **1:24,000**, operator name/contact, commodity, sometimes diameter | print only |
| **PIMMA** | federal / state / local / tribal government, operators, contractors under NDA | Same plus incidents and accidents since 2012, network history, federal and tribal lands, liquid HCAs, imagery | no download |
| **NPMS GIS Data Request** | government with jurisdiction | Shapefile / File Geodatabase for your jurisdiction, full attributes, metadata, data use agreement | yes, 1-month access |

**What is deliberately not there.** NPMS excludes **gas gathering** and **gas
distribution** entirely. The line to a house, the line down a residential
street, the field gathering web around a producing area — none of it. So a map
that looks complete is not.

**Accuracy.** NPMS metadata states ±500 ft. Submitted record accuracy breaks
down roughly 22% at 0–50 ft, 45% at 51–300 ft, the rest worse. That is fine for
awareness and useless for excavation, which is why every NPMS page says the same
thing this app's status bar says: **call 811**.

**Operator-side sources worth adding.** SoCalGas publishes transmission system
maps and integrity-management materials (it runs ~101,000 miles of transmission
and distribution pipe, the largest gas distribution utility in the US); CPUC
filings and CEQA/NEPA documents for specific projects carry alignment figures at
far better accuracy than NPMS; CEC and CNRA publish some energy-infrastructure
GIS. For a Cajon Pass refinement specifically, the county-by-county trace is
San Bernardino → Los Angeles → Kern in the Public Map Viewer, cross-read against
the Calnev Expansion EIR/EIS route figures, which are drawn at engineering scale
and are public.

The `edwards-gas` and `socalgas-trunk` dossiers in the app now carry this
provenance ladder, so the schematic line points at the way to replace itself.

---

## 3. USGS 3DEP — replacing the synthetic terrain

The elevation field in `socal-geo.js` is a sum of rotated gaussians (`RELIEF`).
It gets the *shape* of the basin right and every contour wrong. The real thing:

**Products**

| Product | Resolution | Coverage | Format |
| --- | --- | --- | --- |
| 1 arc-second | ~30 m | seamless CONUS | GridFloat / IMG / COG |
| **1/3 arc-second** | **~10 m** | **seamless CONUS — the default choice** | ArcGrid / GridFloat / IMG |
| 1/9 arc-second | ~3 m | partial | IMG |
| 1 metre | 1 m | lidar project footprints, not seamless across projects | IMG, UTM |
| Lidar point cloud | — | project tiles | LAZ |

**Quality levels** (3DEP Lidar Base Specification): QL0 ≤0.35 m nominal pulse
spacing; QL1 ~0.35 m; **QL2 is the 3DEP standard — ≤0.71 m NPS, ≥2 pts/m²,
10 cm RMSEz, 1 m DEM cell**; QL3 ~1.4 m.

**Delivery** 1/3 arc-second ships in 1° × 1° tiles (the teal `demTile` frame in
the app is exactly that grid — this theater spans roughly 7 × 5 tiles). 1 m DEMs
ship in 10,000 × 10,000 m UTM tiles. Access via The National Map Download
Client, TNM Access API, LidarExplorer, or bulk from the USGS S3 mirror. All
3DEP products are public domain.

**Datums** NAD83 horizontal, NAVD88 vertical (via a GEOID model). If you mix
3DEP with GPS ellipsoidal heights or with WGS84 web-mercator tiles without
converting, you will be metres off and the error will look like a real signal.

**Drop-in recipe for this app**
1. Pull the 1/3 arc-second tiles covering `BBOX` (n37w122 … n33w115).
2. Resample to the app's 190 × 150 grid (GDAL: `gdalwarp -te … -ts 190 150 -r bilinear`).
3. Emit a `Float32Array` of metres, gzip it, ship as an asset.
4. Replace `elevationAt()` with a bilinear sample of that grid. Everything else
   — corridors, fire rings, CLUI pins, the minimap — drapes automatically,
   because they all already go through one function.

---

## 4. SAR — what radar adds that a DEM cannot

A DEM is one surface at one time. SAR is the same surface repeatedly, at
millimetre sensitivity, through cloud and at night.

- **Sentinel-1** (ESA Copernicus): C-band, 5.405 GHz, 5.6 cm wavelength.
  Interferometric Wide mode — **250 km swath, 5 × 20 m resolution**, 12-day
  repeat per satellite. The `sar` overlay draws that swath at its true width.
- **Repeat-pass InSAR** differences the phase of two passes: line-of-sight
  ground motion at centimetre-to-millimetre scale, over whole basins, with no
  one standing in the desert holding a rod.
- **NISAR** (NASA + ISRO) launched **30 July 2025** on GSLV-F16 — dual frequency,
  L-band at 1.257 GHz (24 cm) and S-band at 3.2 GHz, 747 km sun-synchronous,
  12-day repeat, 12 m deployable reflector. L-band penetrates vegetation and
  supports deformation rates **as small as ~4 mm/year**. It is the instrument
  that makes the deformation overlay in this app obsolete and replaceable with
  real interferograms.
- **UAVSAR** (JPL, L-band, airborne) for targeted campaigns; **ARIA** products
  for event response.

**What it sees inside this frame** — the three bowls in the `sar` overlay:
Antelope Valley pumping subsidence around Lancaster and Edwards (why parts of
Rogers Dry Lake get re-surveyed); San Joaquin Valley subsidence, which has
physically deformed the California Aqueduct and cut its design capacity; and
the Salton Trough, where tectonic spreading and geothermal production show up
in the *same* interferogram and have to be separated by argument, not by data.
Also: burn scars change surface roughness and coherence, so SAR maps fire
effects and post-fire debris-flow risk on the Cajon slopes directly.

The app draws the deformation bowls as three concentric fringes. That is a
cartoon of an interferogram, not one, and it is labelled as such in the dossier.

---

## 5. DjVu — why the old maps are in a format nobody else uses

Relevant because the **USGS Historical Topographic Map Collection** (HTMC) —
every 7.5′ and 15′ quad printed from 1884 to 2006, the primary record of what
was on this land before the Landsat era — was scanned and first distributed as
**DjVu**, and the `quad` graticule in this app is exactly the sheet index those
scans are cut to.

- Developed at AT&T Labs (Bottou, LeCun, Haffner, Le Cun's group) in 1996
  specifically for scanned documents, where general-purpose JPEG fails badly.
- **Layered separation**: a scanned map is split into a bitonal *mask* (text,
  contour lines, the sharp stuff) coded with **JB2** — a symbol-matching codec
  that finds repeated glyphs and stores each shape once — plus *foreground* and
  *background* colour layers coded with the **IW44** wavelet at much lower
  resolution. Reassembled on decode.
- Result: a 400 dpi colour topo sheet at a few hundred KB to a few MB, where the
  same scan as JPEG is tens of MB and unreadably soft on the contour lines.
  Progressive decode, so the sheet paints usably before it finishes.
- USGS has since moved HTMC delivery to **GeoPDF / GeoTIFF**, and current
  products to **Cloud Optimized GeoTIFF**, but a large amount of scanned
  archival material — HTMC mirrors, library and state-archive map collections,
  the Internet Archive's scanned-book corpus — is still DjVu-only.
- Practical toolchain: `djvulibre` (`ddjvu -format=tiff`, `djvused` for the
  OCR/text layer and annotations), then `gdal_translate` + `gdal_edit` /
  `gdalwarp -gcp` to georeference a scanned quad into the same frame as the
  3DEP DEM. That is the path from a 1953 topo sheet showing the Big Horn Mine
  tramway to a layer that drapes in this app.

**Why it matters to this particular map.** Mine adits, tramways, ditch lines,
the Sheep Creek gravity tunnel, vanished rail spurs, the pre-1960 alignment of
things in Cajon Pass — most of that is not in any modern vector dataset. It is
on a scanned quad, in DjVu, and the only way to get it into a 3D scene is to
rectify the raster and digitize by hand.

---

## 6. The register — describing the land as CLUI would

The `clui` overlay and the extended site register follow the Center for Land Use
Interpretation's descriptive discipline, which is a real methodology and not a
style affectation:

1. **Say what is physically there.** Acreage, structures, surfaces, operator.
2. **Name the operator.** Who holds it, who pays for it, what agency.
3. **No adjectives of awe.** No "stunning", no "eerie", no "otherworldly". The
   facts of a 1,000-square-mile maneuver area are sufficient.
4. **Function over narrative.** "The field is a machine for converting natural
   gas into heavy oil" is a description, not a metaphor.
5. **The banal and the extraordinary get the same voice.** A film set, a stealth
   measurement range and a berry-farm dark ride are described identically.

CLUI's own land use database is also a *source* here — it is where the
Antelope Valley radar cross-section triad is documented as a set: Lockheed
Martin at **Helendale**, Northrop Grumman at **Tejon Ranch**, and **Gray Butte**
near El Mirage, built by McDonnell Douglas, inherited by Boeing, closed around
1999 and now a General Atomics UAV site. All three share an architecture: a dish
array at one end, an aeroform on a ~50 ft triangular pedestal at the other, and
the pedestal rises hydraulically out of the ground — which is to say the
interesting part of a radar range is also underground, which is the subject of
this app.

Note the naming trap the register exists to catch: the **Tejon Ranch RCS range**
is not **Fort Tejon**. The 1854 dragoon post is ~25 km west-southwest on the
Grapevine, sitting on the San Andreas, and it gave its name to the M~7.9
earthquake of 9 January 1857 that ruptured ~350 km of the fault — the design
event every pipeline crossing and aqueduct siphon in this frame is quietly built
against.

---

## 7. Evidence quarantine

Three operator-supplied place names could not be corroborated in public sources.
They are plotted in a separate, **default-off** `memory` layer, in magenta, and
their dossiers state plainly what was searched and what the documented
neighbours are. They are never blended with sourced material.

| Memory pin | Status | Documented neighbours offered instead |
| --- | --- | --- |
| «Little Baldy Water Company», Wrightwood | no public record under that name | **Sheep Creek Water Company** — private mutual formed 5 Dec 1913, first reservoir Horse Canyon 1915, supply is a **gravity-flow tunnel north of Wrightwood** feeding Phelan, original steel pipe still visible east of Hwy 2; **Golden State Water** Wrightwood system since 1976 (~4,100 connections, Swarthout Valley / Sheep Creek wells) |
| «Annendorf», Wrightwood | not in GNIS or quad names | Swarthout (1851), Circle Mountain Ranch / Sumner B. Wright (subdivided 1924), Guffy's cabin, Heath's dairy, Big Pines (1924) |
| «Rancho Cucamonga tram to Lookout Point» | no record of a passenger aerial tramway | 1887 Chinese-dug **irrigation tunnels** in Cucamonga Canyon; Pacific Electric extension 1913; Mt. Baldy Notch lifts (1952–); Palm Springs Aerial Tramway (1963) |

If any of those resolve, the fix is a one-line tier change from `context` to
`community` plus a source string. That is the whole point of keeping them apart.

---

## 7b. Trails and springs added in this pass

- **Pacific Crest National Scenic Trail** — 2,650 mi total; roughly 604 km of
  generalized centerline drawn here, Campo to the southern Sierra. It crosses
  Cajon Pass at grade and goes under I-15, the same notch as two railroads, the
  CALNEV stem, the Edwards fuel lateral, a gas transmission line and the SWP
  East Branch, and it tops Vincent Gap and Mount Baden-Powell above the Big Horn
  Mine. Live crossing analysis puts **~107 km of the in-frame PCT inside
  historical fire perimeters**: Bobcat 32 km, Old 16, Station 16, Cedar 16,
  Blue Cut 12, Lake 9, Pilot 6.
- **John Muir Trail** — only the final descent to the Whitney summit terminus
  falls inside the frame; the other ~200 miles are in the off-frame register.
- **Big Caliente Hot Springs** (34.5392 N, 119.5646 W, ~115 °F source, Los
  Padres NF, Santa Barbara RD), **Little Caliente** (4.8 mi north, ~105 °F) and
  **Sespe Hot Springs**. Filed in the `power` layer next to Salton Sea and Coso
  deliberately, because the contrast is the lesson: Salton and Coso are magmatic
  heat, Caliente and Sespe are meteoric water circulating deep along Transverse
  Range faults and coming back up warm. Same symbol, different engine.

---

## 8. Still open

- **The flyer.** A print-ready CLUI-register one-pager generated from the
  current selection and visible layers — deferred at the operator's request
  ("later call the flyer"). Hook goes in `renderDetail()`; it already builds
  every field a flyer needs.
- Real FRAP geometry in place of the scaled rings.
- Real 3DEP 1/3 arc-second grid in place of `elevationAt()`.
- A rectified DjVu quad (Cajon Pass, 1953 or earlier) as a draped texture.
