#!/usr/bin/env python3
"""Fetch an optional denser USGS 3DEP resample for Lawrence, Kansas.

The shared city XDC includes an 8x8 point-sample grid so it works fully offline.
For a smoother local build, run this script in a network-connected environment
with numpy+rasterio installed; it writes an optional high-resolution module
that the shared city viewer prefers over the sparse grid:

    python3 scripts/fetch-lawrence-dem.py --nx 160 --ny 160
    npm run build:city-subsurface

USGS 3DEP ImageServer is public domain. The requested BBOX is intentionally a
compact 0.16-degree square around Lawrence (not a statewide download). The
export is bilinearly resampled to the requested dimensions and encoded as
Int16 metres for an offline-friendly xdc asset. This is a visualization grid,
not a survey or engineering product. Check each GeoTIFF's vertical datum; the
Lawrence source pixels inspected here report NAVD88.
"""
from __future__ import annotations

import argparse
import base64
import datetime as dt
import json
import math
import struct
import sys
import urllib.parse
import urllib.request
from pathlib import Path

BBOX = {"lon0": -95.31, "lat0": 38.88, "lon1": -95.15, "lat1": 39.04}
IMAGESERVER = (
    "https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/"
    "ImageServer/exportImage"
)


def fetch_tiff(nx: int, ny: int, timeout: int = 180) -> bytes:
    """Ask the USGS 3DEP dynamic ImageServer for a resampled float32 GeoTIFF."""
    params = {
        "bbox": f"{BBOX['lon0']},{BBOX['lat0']},{BBOX['lon1']},{BBOX['lat1']}",
        "bboxSR": "4326",
        "imageSR": "4326",
        "size": f"{nx},{ny}",
        "format": "tiff",
        "pixelType": "F32",
        "noDataInterpretation": "esriNoDataMatchAny",
        "interpolation": "RSP_BilinearInterpolation",
        "f": "image",
    }
    url = IMAGESERVER + "?" + urllib.parse.urlencode(params)
    print(f"GET {url}", file=sys.stderr)
    req = urllib.request.Request(url, headers={"User-Agent": "Html5-Lawrence-DEM/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as response:
        payload = response.read()
    if len(payload) < 1024 or payload[:2] not in (b"II", b"MM"):
        preview = payload[:300].decode("utf-8", "replace")
        raise RuntimeError(
            f"USGS did not return a GeoTIFF (received {len(payload)} bytes): {preview}"
        )
    return payload


def read_resampled_grid(tiff_bytes: bytes, nx: int, ny: int) -> list[float]:
    """Reproject/crop a GeoTIFF to the exact Lawrence frame, north-to-south."""
    try:
        import numpy as np
        import rasterio
        from rasterio.io import MemoryFile
        from rasterio.transform import from_bounds
        from rasterio.warp import reproject
    except ImportError as exc:
        raise RuntimeError("Install numpy and rasterio to read the GeoTIFF: pip install numpy rasterio") from exc

    destination = np.full((ny, nx), np.nan, dtype="float32")
    destination_transform = from_bounds(
        BBOX["lon0"], BBOX["lat0"], BBOX["lon1"], BBOX["lat1"], nx, ny
    )
    with MemoryFile(tiff_bytes) as memory, memory.open() as src:
        if src.crs is None:
            raise RuntimeError("input GeoTIFF has no CRS; refusing to guess its coordinates")
        reproject(
            source=rasterio.band(src, 1),
            destination=destination,
            src_transform=src.transform,
            src_crs=src.crs,
            src_nodata=src.nodata,
            dst_transform=destination_transform,
            dst_crs="EPSG:4326",
            dst_nodata=np.nan,
            resampling=rasterio.enums.Resampling.bilinear,
        )
    values = destination.reshape(-1).tolist()
    if any(not math.isfinite(v) for v in values):
        missing = sum(not math.isfinite(v) for v in values)
        raise RuntimeError(f"resampled raster contains {missing} NoData cells; check source coverage of the Lawrence frame")
    return values


def emit_module(values: list[float], nx: int, ny: int, out: Path) -> None:
    """Write the optional high-resolution JS grid consumed by lawrence-geo.js."""
    raw = bytearray()
    lo, hi = math.inf, -math.inf
    for value in values:
        elevation = max(-32000, min(32000, int(round(value))))
        lo = min(lo, elevation)
        hi = max(hi, elevation)
        raw += struct.pack("<h", elevation)
    encoded = base64.b64encode(raw).decode("ascii")
    spacing = f"approximately {(BBOX['lon1']-BBOX['lon0'])*111.32*math.cos(math.radians(38.96))/nx:.3f} km east-west × {(BBOX['lat1']-BBOX['lat0'])*111.32/ny:.3f} km north-south resample cells"
    meta = {
        **BBOX,
        "nx": nx,
        "ny": ny,
        "source": "USGS 3DEP dynamic ImageServer exportImage (elevation.nationalmap.gov)",
        "resolution": f"Float32 GeoTIFF bilinearly resampled to {nx}x{ny}; stored elevations rounded to whole metres",
        "sampleSpacing": spacing,
        "sourceRasterResolutionMeters": None,
        "retrieved": dt.date.today().isoformat(),
        "verticalDatum": "NAVD88 where reported by the selected 3DEP source raster; verify source metadata",
        "disclosure": "Optional locally generated resample. Cell spacing is not the source raster pixel resolution, and values are rounded to whole metres. Not surveyed control elevations.",
        "min": lo,
        "max": hi,
    }
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(
        "/** GENERATED by scripts/fetch-lawrence-dem.py; do not hand-edit. */\n"
        f"const META = {json.dumps(meta, indent=2)};\n"
        f'const B64 = "{encoded}";\n'
        "function decode(b64) {\n"
        '  const bin = typeof atob === "function" ? atob(b64) : Buffer.from(b64, "base64").toString("binary");\n'
        "  const bytes = new Uint8Array(bin.length);\n"
        "  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);\n"
        "  return new Int16Array(bytes.buffer);\n"
        "}\n"
        "export const DEM = { ...META, data: decode(B64) };\n"
        "export default DEM;\n",
        encoding="ascii",
    )
    print(
        f"wrote {out}: {nx}x{ny} Int16 grid, {len(encoded)/1024:.1f} KiB base64, range {lo}..{hi} m",
        file=sys.stderr,
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--nx", type=int, default=160, help="columns, default 160")
    parser.add_argument("--ny", type=int, default=160, help="rows, default 160")
    parser.add_argument("--out", type=Path, default=Path("js/city-dem-grid-lawrence-highres.js"))
    parser.add_argument("--raw", type=Path, help="use a pre-downloaded GeoTIFF instead of requesting the ImageServer")
    args = parser.parse_args()
    if not (2 <= args.nx <= 2000 and 2 <= args.ny <= 2000):
        parser.error("--nx and --ny must be between 2 and 2000")
    if args.raw:
        tiff_bytes = args.raw.read_bytes()
        if len(tiff_bytes) < 4 or tiff_bytes[:2] not in (b"II", b"MM"):
            parser.error("--raw file is not a TIFF")
    else:
        tiff_bytes = fetch_tiff(args.nx, args.ny)
    values = read_resampled_grid(tiff_bytes, args.nx, args.ny)
    emit_module(values, args.nx, args.ny, args.out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
