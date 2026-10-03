#!/usr/bin/env python3
"""
Fetch a USGS 3DEP elevation grid for the SOCAL SUBSURFACE frame and emit it as
an ES module the app can import.

    python3 scripts/fetch-3dep-dem.py --nx 768 --ny 600 --out js/socal-dem-grid.js

Drop the result in place and js/socal-subsurface.js picks it up at boot (it
dynamic-imports ./socal-dem-grid.js and installs the grid into socal-geo.js).
Everything that drapes on the terrain — corridors, fire perimeters, CLUI pins,
radio propagation, the relief map, the minimap — switches to measured ground at
once, because they all sample one function, elevationAt().

Why a script and not a bundled asset: 3DEP is public domain (17 USC 105) but a
1/3 arc-second grid over this 7.6° x 5.9° frame is gigabytes, and this app is
built to run offline from a single directory. So the repo ships the recipe and
you ship the raster.

Sources, in the order worth trying:

  1. 3DEP dynamic ImageServer (no key, returns a resampled grid directly)
     https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/exportImage
     bbox + bboxSR=4326 + size + format=tiff + pixelType=F32 + f=image

  2. OpenTopography USGS DEM API (free key, mosaics the AWS COGs for you)
     https://portal.opentopography.org/API/usgsdem?datasetName=USGS10m&south=..&north=..
         &west=..&east=..&outputFormat=GTiff&API_Key=...
     datasetName: USGS30m (1"), USGS10m (1/3"), USGS1m (1 m, academic only)

  3. TNM Access API -> 1/3" tile list -> download -> gdalwarp yourself
     https://tnmaccess.nationalmap.gov/api/v1/products?datasets=National%20Elevation%20Dataset%20(NED)%201/3%20arc-second

  4. The 3DEP COG mirror on AWS (s3://prd-tnm/StagedProducts/Elevation/), which is
     what 1 and 2 are reading under the hood.

Datum note, and this is the one that bites people: 3DEP is NAD83 horizontal and
NAVD88 vertical (via a GEOID model). The app's projection is a local
equirectangular on WGS84-ish lon/lat. At this scale the horizontal difference is
sub-metre and irrelevant; the vertical difference between NAVD88 and a GPS
ellipsoidal height in Southern California is roughly -32 m and is NOT
irrelevant if you mix sources. Keep one vertical datum.

Requires: requests (or urllib), numpy, and rasterio OR GDAL's gdal_translate
on PATH. Degrades gracefully: with --raw you can feed it a GeoTIFF you already
downloaded by hand.
"""

from __future__ import annotations

import argparse
import base64
import json
import math
import struct
import sys
from pathlib import Path

BBOX = dict(lon0=-121.6, lat0=32.45, lon1=-114.0, lat1=38.35)

IMAGESERVER = (
    "https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/"
    "ImageServer/exportImage"
)


def fetch_imageserver(bbox: dict, nx: int, ny: int, timeout: int = 300) -> bytes:
    """Ask the 3DEP dynamic image service for a resampled float32 GeoTIFF."""
    import urllib.parse
    import urllib.request

    query = {
        "bbox": f"{bbox['lon0']},{bbox['lat0']},{bbox['lon1']},{bbox['lat1']}",
        "bboxSR": "4326",
        "imageSR": "4326",
        "size": f"{nx},{ny}",
        "format": "tiff",
        "pixelType": "F32",
        "noDataInterpretation": "esriNoDataMatchAny",
        "interpolation": "RSP_BilinearInterpolation",
        "f": "image",
    }
    url = f"{IMAGESERVER}?{urllib.parse.urlencode(query)}"
    print(f"GET {url}", file=sys.stderr)
    with urllib.request.urlopen(url, timeout=timeout) as resp:
        data = resp.read()
    if len(data) < 1024 or data[:2] not in (b"II", b"MM"):
        raise RuntimeError(f"not a GeoTIFF (got {len(data)} bytes; service may be refusing the request)")
    return data


def read_grid(tiff_bytes: bytes, nx: int, ny: int):
    """Decode a GeoTIFF into a flat list of floats, north-to-south row major."""
    try:
        import numpy as np
        import rasterio
        from rasterio.io import MemoryFile

        with MemoryFile(tiff_bytes) as mem, mem.open() as src:
            band = src.read(1, out_shape=(ny, nx), masked=True)
            arr = np.ma.filled(band.astype("float32"), 0.0)
            return arr.reshape(-1).tolist()
    except ImportError:
        pass

    # Fallback: shell out to gdal_translate -> ENVI/raw and read that.
    import subprocess
    import tempfile

    with tempfile.TemporaryDirectory() as td:
        src = Path(td) / "dem.tif"
        dst = Path(td) / "dem.bin"
        src.write_bytes(tiff_bytes)
        subprocess.run(
            ["gdal_translate", "-of", "ENVI", "-ot", "Float32", "-outsize", str(nx), str(ny), str(src), str(dst)],
            check=True,
            stdout=subprocess.DEVNULL,
        )
        raw = dst.read_bytes()
        return list(struct.unpack(f"<{nx*ny}f", raw[: nx * ny * 4]))


def emit_module(values, nx: int, ny: int, bbox: dict, resolution: str, out: Path, source: str) -> None:
    """Write js/socal-dem-grid.js: base64 Int16 metres, decoded at import."""
    import datetime

    ints = bytearray()
    lo, hi = math.inf, -math.inf
    for v in values:
        iv = int(round(max(-32000, min(32000, v))))
        lo = min(lo, iv)
        hi = max(hi, iv)
        ints += struct.pack("<h", iv)
    b64 = base64.b64encode(bytes(ints)).decode("ascii")

    meta = {
        "lon0": bbox["lon0"],
        "lat0": bbox["lat0"],
        "lon1": bbox["lon1"],
        "lat1": bbox["lat1"],
        "nx": nx,
        "ny": ny,
        "resolution": resolution,
        "source": source,
        "retrieved": datetime.date.today().isoformat(),
        "min": lo,
        "max": hi,
    }

    out.write_text(
        "/**\n"
        " * SOCAL SUBSURFACE — measured elevation grid.\n"
        " *\n"
        " * GENERATED FILE. Do not hand-edit. Rebuild with:\n"
        f" *   python3 scripts/fetch-3dep-dem.py --nx {nx} --ny {ny}\n"
        " *\n"
        f" * Source: {source}\n"
        f" * Grid:   {nx} x {ny} over the theater bbox, metres, Int16, NAVD88.\n"
        f" * Range:  {int(lo)} .. {int(hi)} m\n"
        " * 3DEP products are public domain (17 USC 105).\n"
        " */\n\n"
        f"const META = {json.dumps(meta, indent=2)};\n\n"
        f'const B64 = "{b64}";\n\n'
        "function decode(b64) {\n"
        "  const bin = typeof atob === \"function\" ? atob(b64) : Buffer.from(b64, \"base64\").toString(\"binary\");\n"
        "  const bytes = new Uint8Array(bin.length);\n"
        "  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);\n"
        "  return new Int16Array(bytes.buffer);\n"
        "}\n\n"
        "export const DEM = { ...META, data: decode(B64) };\n"
        "export default DEM;\n",
        encoding="ascii",
    )
    print(
        f"wrote {out} — {nx}x{ny} cells, {len(b64)/1024:.0f} KiB base64, range {int(lo)}..{int(hi)} m",
        file=sys.stderr,
    )


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--nx", type=int, default=768, help="grid columns (default 768, about 1.1 km cells)")
    ap.add_argument("--ny", type=int, default=600, help="grid rows (default 600)")
    ap.add_argument("--out", type=Path, default=Path("js/socal-dem-grid.js"))
    ap.add_argument("--raw", type=Path, help="use this already-downloaded GeoTIFF instead of fetching")
    ap.add_argument(
        "--resolution",
        default="1/3 arc-second (~10 m) 3DEP, resampled bilinear",
        help="resolution string recorded in the module metadata",
    )
    args = ap.parse_args()

    if args.raw:
        tiff = args.raw.read_bytes()
        source = f"local GeoTIFF {args.raw.name} (USGS 3DEP)"
    else:
        tiff = fetch_imageserver(BBOX, args.nx, args.ny)
        source = "USGS 3DEP dynamic ImageServer (elevation.nationalmap.gov)"

    values = read_grid(tiff, args.nx, args.ny)
    emit_module(values, args.nx, args.ny, BBOX, args.resolution, args.out, source)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
