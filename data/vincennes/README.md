# `data/vincennes/`

Artefacts for `vincennes-4dwm.html`. Both files in here are **generated** — regenerate
them rather than editing them:

```sh
node tools/make-vincennes-dem.mjs      # -> dem.json
node tools/make-vincennes-plates.mjs   # -> plates.json + djvu/*.djvu
```

`tests/run.sh` regenerates both before running `tests/19-vincennes.mjs`, so a drift
between the generator and the committed artefact fails the suite.

---

## `dem.json` — the elevation control set

**This is not a sample of a USGS raster, and the distinction is the point.**

It is a list of published spot heights and soundings — 30 of them across the three
theaters — plus generalised island outlines and the parameters of the interpolation
kernel in `js/vincennes-dem.js`. The viewer rebuilds the grid from these at load time
in a few milliseconds, which is why no raster is stored here.

### Why not real USGS data?

Because none of these three theaters is in **3DEP**. 3DEP is the United States. The
Strait of Hormuz, Iron Bottom Sound and the Philippine Sea are covered by the global
products USGS/EROS distributes instead, and those have to be fetched and clipped:

| Product | Resolution | Coverage | Where |
|---|---|---|---|
| SRTM 1 Arc-Second Global | 1″ (~30 m) | 60°N–56°S — all three frames | EarthExplorer → Digital Elevation → SRTM |
| ASTER GDEM v3 | 1″ (~30 m) | 83°N–83°S | AppEEARS (USGS LP DAAC) |
| GMTED2010 | 7.5″/15″/30″ | global | EarthExplorer → Digital Elevation → GMTED2010 |
| 3DEP ImageServer | 1 m – 1″ | **US only — nothing here** | elevation.nationalmap.gov |

All three usable products need a free EarthData/EROS registration, which is why this
repository ships the control points instead of the tiles.

### Swapping in a real clip

`js/vincennes-dem.js` funnels every consumer through `sampleDem(grid, lon, lat)`, and
`buildGrid()` returns `{ nx, ny, bbox, elev: Float32Array, min, max, meta }`. Produce
that shape from a real GeoTIFF and nothing downstream changes:

```sh
gdal_translate -projwin <W> <N> <E> <S> srtm.tif clip.tif
gdal_translate -of AAIGrid clip.tif clip.asc
# then emit { nx, ny, bbox:[w,s,e,n], elev:[...] } as dem-<theater>.json
```

### Control-point discipline

`validateControl(theaterId)` asserts that every land spot height falls inside a land
polygon and every sounding outside all of them, that elevations have the right sign,
and that nothing sits outside its theater's bbox. A control point on the wrong side of
its own coastline is silently dropped from the interpolation pool and produces a DEM
that looks fine and is wrong — so the check is in `tests/19-vincennes.mjs`, not in a
comment.

`dem.json` also carries a `probes` table per theater. The test suite rebuilds the grid
and asserts each probe still reads within 2 m, which catches an accidental change to
the kernel, the coastal taper or the shelf width.

---

## `plates.json` + `djvu/*.djvu` — the source-plate layer

**These are generated fixtures, not scans.** Each `.djvu` is a genuine DjVu byte
stream — `AT&T` magic, IFF85 chunks, a real `INFO`, an `ANTa` annotation and a `TXTa`
hidden-text layer with a real zone tree — carrying the *transcribed text* of the page
it stands for, positioned where it sits on that page. There is no image layer, because
there is no scan.

Four plates, about 4 KB in total:

| File | Stands for |
|---|---|
| `fogarty-encl5-timeline.djvu` | Fogarty report chronology, 0647Z–0655Z |
| `icao-figure-1-positions.djvu` | ICAO C-WP/8708 Figure 1 unit positions |
| `graybook-v1-savo.djvu` | Nimitz Graybook vol. 1, running estimate 9 Aug 1942 |
| `graybook-v5-formosa.djvu` | Nimitz Graybook vol. 5, pp. 270–272 |

Every plate links the real document in `plates.json`. The real ones are not vendored:
the Graybook alone is 3,548 scanned pages across eight volumes, and a geometry viewer
should not ship that to demonstrate that it can read a chunk header.

### What the reader does and does not do

`js/vincennes-djvu.js` decodes the container, `INFO`, `INCL`, `ANTa` and `TXTa`
including the hidden-text zone tree. It **detects and reports** `TXTz`, `ANTz`, `NAVM`
and the `DIRM` body without decoding them: those are BZZ streams (Burrows–Wheeler plus
the ZP adaptive binary arithmetic coder), and a half-remembered ZP implementation would
be worse than an honest refusal. For real scans with compressed text the supported
paths are `djvused -e 'select 1; print-pure-txt'` and the Internet Archive's
`<id>_djvu.xml` derivative, which the reader parses.

The `TXTa` zone-record layout is not in any published DjVu specification — the DjVu3
spec says "to be documented" — so it is implemented from DjVuLibre's `DjVuText.cpp`
and exported as `ZONE_RECORD`. The parser insists it consumed exactly the chunk and
reports `zoneParse: "length-mismatch"` if it did not, so a wrong guess surfaces as a
refusal rather than as plausible-looking wrong boxes.

You can drag a real `.djvu` or an Internet Archive `_djvu.xml` onto the viewer and it
goes through the same code path.
