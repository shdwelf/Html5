# Red October 4D Command Theater — research and provenance

Status date: 2026-10-09. This note records the Archive.org, Ghidra, terrain/SAR/GNIS,
DjVu, and Xena research behind `apps/red-october-command-viewer/` and its offline
Webxdc build. It is a source register and a list of limits, not a claim that all
historical game versions or related titles have been identified.

## What the viewer represents

The app is a **fictionalized story index**. Its six chapter markers and broad
map anchors were authored for this visualization. They are not transcribed from
an executable, a game replay, a patrol report, sonar observations, or a real
submarine track. The app displays no numeric coordinates or story timestamps;
its exports explicitly set `coordinatesAsserted`, `historicalTrack`, and
`operationalData` to false.

The globe uses the repository's low-resolution Natural Earth country-outline
GeoJSON for geographic context only. The model is normalized display geometry:
no physical scale, internal compartment plan, weapons, machinery, sensor
performance, or engineering dimensions are asserted. The optional profile
relief is a synthetic curve, **not bathymetry**. This scene does not consume a
USGS DEM or a SAR/InSAR product.

## Archive.org title/version distinctions

| Record | What the record supports | What is not assumed |
| --- | --- | --- |
| [The Hunt for Red October (1987), MS-DOS](https://archive.org/details/msdos_The_Hunt_for_Red_October_1987) | The record identifies an Oxford Digital Enterprises / IntelliCreations DOS game. | No routes or timings are extracted from its files; the archive record is not treated as proof that this was the only DOS build. |
| [The Hunt for Red October (1990), MS-DOS listing](https://archive.org/details/msdos_The_Hunt_for_Red_October_1990_1990) | A distinct 1990 Archive.org item exists. | Its small reported item size and limited catalog metadata do not establish its exact build, completeness, or relation to the other adaptations. |
| [Grandslam manual record](https://archive.org/details/HuntforRedOctober) | A separate 1990 movie-based adaptation/manual record. | It is not conflated with the earlier Oxford Digital DOS title or with console releases. |

The presidential geopolitical/nuclear-command simulation the user had in mind
is identified as *Shadow President* (1993 DOS). The [Internet Archive Software
Library record](https://archive.org/details/msdos_Shadow_President_1993) lists
a 1993 MS-DOS item configured for DOSBox; [My Abandonware's catalog
entry](https://www.myabandonware.com/game/shadow-president-206) classifies it as
strategy/simulation and lists a fixed/flip-screen perspective, not a first-
person shooter. The user's “nuclear briefcase” wording is a useful premise
description, not evidence that the game uses that exact interface term; the
original manual should be consulted before quoting the detailed launch flow or
retaliation/game-over sequence. A separate literal FPS, if one was also meant,
remains unidentified. *Shadow President* is not a source for this viewer's
fictional submarine story anchors, and no game binary or manual scan is
redistributed by the app.

Ghidra is a candidate for later **static** examination of legally obtained
executables: the [official NSA repository](https://github.com/NationalSecurityAgency/ghidra)
contains DOS/MZ parsing code. A source mirror of Xena is at
[`srnsw/xena`](https://github.com/srnsw/xena); it was used to confirm the
normaliser class name used by the export. This viewer does not execute, unpack,
or reverse engineer any commercial game data.

## USGS 3DEP, SAR/InSAR, and GNIS

### Elevation

The [USGS 3DEP ImageServer](https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer)
is a dynamic elevation service with export/identify/query operations. The
SoCal viewer's [DEM fetch script](../scripts/fetch-3dep-dem.py) can create an
optional local grid, but the large `js/socal-dem-grid.js` data file is absent
from this checkout. Accordingly, the SoCal scene currently reports its
synthetic Gaussian relief as the source; it must not be described as a loaded
USGS DEM. A 3DEP surface is U.S. elevation coverage, not an Atlantic bathymetry
product and not the base terrain for the Red October globe.

### SAR and InSAR

[Sentinel-1 documentation](https://www.earthdata.nasa.gov/data/platforms/space-based-platforms/sentinel-1)
describes C-band SAR and the Interferometric Wide Swath mode. [ASF HyP3's InSAR
product guide](https://hyp3-docs.asf.alaska.edu/guides/insar_product_guide/)
describes displacement products, line-of-sight conventions, DEM use, and
coherence/processing caveats. A proper displacement layer requires an actual
acquisition pair, orbit and acquisition metadata, DEM-assisted processing,
coherence handling, and georeferenced output; drawing concentric rings is not a
substitute for that workflow.

The existing SoCal overlay is deliberately synthetic: its swath is a nominal
illustration of a Sentinel-1 IW-width pass, not a dated acquisition footprint;
its concentric deformation rings are cartoon fringes, not measured deformation
or a real interferogram. The viewer label and evidence tier now say **illustrative
only**. A future measured layer must carry the source product ID, pair dates,
relative orbit, processing method, units/sign convention, coherence mask,
spatial reference, and checksum.

### Geographic names

The [USGS GNIS download page](https://www.usgs.gov/us-board-on-geographic-names/download-gnis-data)
now documents DomesticNames text and GIS packages, plus topical products and
metadata. It says the domestic downloads cover the 50 states, DC, Puerto Rico,
the U.S. Virgin Islands, Guam, and the Northern Mariana Islands, and products
are refreshed every other month. The GNIS [Feature ID is the persistent
identifier](https://data.usgs.gov/datacatalog/data/USGS:9338e845-e2b1-483e-bf56-2405d54c5756)
for reconciling features across datasets. For a refreshed snapshot, record the
exact package publication date, filename, metadata XML, checksum, selected
fields, and any filters; do not silently substitute the legacy 2021 archive.

## DjVu and OCR preservation

The Internet Archive's [OCR workflow documentation](https://archive.org/developers/ocr.html)
says that `*_djvu.xml` is a modified DjVuXML OCR/text-coordinate output and
recommends hOCR for OCR extraction. It is **not the original `.djvu` bitstream**
and should not be treated as one. DjVuLibre's [DjVuXML tools](https://djvu.sourceforge.net/doc/man/djvuxml.html)
can round-trip associated hidden text/metadata when paired with a DjVu file.
For a preservation ingest, keep the original bitstream when available, its
checksum, IA item identifier and retrieval date, plus OCR derivative, format,
language/model and confidence metadata; do not reconstruct the compressed image
from OCR XML alone.

The current Vincennes DjVu material in this repository is a small, explicitly
scoped format/parser demonstration. It does not imply that the Red October game
manuals or all DjVu variants have been parsed or preserved.

## Xena export

Xena (XML Electronic Normalising for Archives) is an archival normalization
framework, not a 3D model format. Its [schema notes](https://sourceforge.net/p/xena/wiki/Xena_schemas/)
describe Base64 embedding of binary data; the
[default package wrapper](https://sourceforge.net/p/xena/wiki/Default_package_wrapper/)
and [Binary object schema](https://sourceforge.net/p/xena/wiki/Binary/) specify
the XML namespaces. The viewer's **Export Xena XML** action wraps the generated
VRML 2.0 bytes in those schemas using the `BinaryToXenaBinaryNormaliser` class
name recorded in the [Xena source mirror](https://github.com/srnsw/xena/blob/master/xena/src/au/gov/naa/digipres/xena/kernel/normalise/BinaryToXenaBinaryNormaliser.java).
It also emits a JSON sidecar with SHA-256 and the scene's synthetic-data
provenance.

The export is a binary-preservation wrapper: it does not normalize VRML into
another model format, and it has **not yet been opened in the historical Xena
application**. The sidecar is therefore important, and the XML export should be
called schema-shaped/Xena-style until a real Xena installation validates its
round-trip.

## Build and checks

```sh
npm run build:red-october-command-viewer
node --test tests/red-october-command-viewer.test.mjs
```

The generated Webxdc includes the app modules, the bundled low-resolution
outlines, the dataset's license/notice, and no external runtime dependencies.

## Still open

- Identify the exact president/briefcase FPS from an item title, platform, or remembered scene; do not guess from political simulations.
- Verify the identity and completeness of the 1990 Archive.org DOS item against primary catalogs/manuals before calling it a distinct executable release.
- Acquire any source raster or SAR pair only with a documented license and complete scene metadata; otherwise retain the current synthetic labels.
- Refresh GNIS through the dated official package rather than relying on a stale or undocumented excerpt.
- Validate the `.xena` output by importing and exporting it in an actual compatible Xena build.
