#!/usr/bin/env python3
"""
gnis_extract.py — pull GNIS candidate rows for a city-subsurface batch.

The USGS GNIS domestic-names app is a JavaScript SPA over a POST API, so
it cannot be queried from the development sandbox (allowlisted egress).
The staged-products S3 bucket, however, publishes the same database as
per-state pipe-delimited text zips:

    https://prd-tnm.s3.amazonaws.com/StagedProducts/GeographicNames/
        DomesticNames/DomesticNames_<ST>_Text.zip

This tool runs where ordinary internet exists (the GitHub runner). It
downloads the requested state files, verifies nothing but its own
hashes (the sha256 of each zip is recorded as provenance), and extracts
only the candidate features named in a request file — the small JSON
extract is what gets committed, never the bulk gazetteer.

Usage:
    python3 tools/gnis_extract.py .arena-gnis/candidates.json <out.json>

Request format:
    {"states": {"MN": ["Saint Paul", "Minneapolis", ...], "IA": [...]}}

Each emitted row carries FEATURE_ID, official name, feature class,
state, primary county, primary-point lat/lon, and elevation where the
source provides it, so the batch author can screen exact official
names / town-vs-lake splits exactly as previous batches did.
"""

import hashlib
import io
import json
import pathlib
import sys
import urllib.request
import zipfile
from datetime import datetime, timezone

BASE = ("https://prd-tnm.s3.amazonaws.com/StagedProducts/GeographicNames/"
        "DomesticNames/DomesticNames_{st}_Text.zip")
UA = "arena-gnis-fetch/1.0 (+https://github.com/shdwelf/Html5; GNIS batch sourcing)"

# The GNIS text layout has drifted across publications; resolve columns
# by header name with aliases rather than by position.
ALIASES = {
    "feature_id": ["FEATURE_ID"],
    "name": ["FEATURE_NAME"],
    "cls": ["FEATURE_CLASS"],
    "state": ["STATE_NAME", "STATE_ALPHA"],
    "county": ["COUNTY_NAME"],
    "lat": ["PRIM_LAT_DEC", "PRIMARY_LAT_DEC", "LATITUDE_DECIMAL"],
    "lon": ["PRIM_LONG_DEC", "PRIMARY_LONG_DEC", "LONGITUDE_DECIMAL"],
    "elev_m": ["ELEV_IN_M", "ELEVATION_IN_METERS"],
    "elev_ft": ["ELEV_IN_FT", "ELEVATION_IN_FEET"],
}


def resolve_columns(header):
    cols = {}
    # Current publications lowercase the header and prefix a UTF-8 BOM.
    upper = [h.strip().lstrip("\ufeff").upper() for h in header]
    for key, names in ALIASES.items():
        for name in names:
            if name in upper:
                cols[key] = upper.index(name)
                break
    missing = [k for k in ("feature_id", "name", "cls", "lat", "lon") if k not in cols]
    if missing:
        raise ValueError(f"GNIS header is missing required columns {missing}: {header}")
    return cols


def extract_state(st, wanted_names, fetcher):
    url = BASE.format(st=st)
    raw = fetcher(url)
    digest = hashlib.sha256(raw).hexdigest()
    rows = []
    with zipfile.ZipFile(io.BytesIO(raw)) as zf:
        # The archive may carry metadata .txt members beside the data file;
        # the gazetteer is the largest text member.
        texts = [n for n in zf.namelist() if n.lower().endswith(".txt")]
        if not texts:
            raise ValueError(f"{st}: no .txt member in {zf.namelist()}")
        member = max(texts, key=lambda n: zf.getinfo(n).file_size)
        with zf.open(member) as fh:
            text = io.TextIOWrapper(fh, encoding="utf-8", errors="replace")
            header = next(text).rstrip("\n").split("|")
            cols = resolve_columns(header)
            wanted = set(wanted_names)
            for line in text:
                parts = line.rstrip("\n").split("|")
                if len(parts) <= max(cols.values()):
                    continue
                name = parts[cols["name"]].strip()
                if name not in wanted:
                    continue
                def get(key):
                    i = cols.get(key)
                    return parts[i].strip() if i is not None and i < len(parts) else ""
                try:
                    lat = float(get("lat") or "nan")
                    lon = float(get("lon") or "nan")
                except ValueError:
                    continue
                row = {
                    "featureId": get("feature_id"),
                    "name": name,
                    "featureClass": get("cls"),
                    "state": get("state") or st,
                    "county": get("county"),
                    "lat": lat,
                    "lon": lon,
                }
                for key, src in (("elevM", "elev_m"), ("elevFt", "elev_ft")):
                    v = get(src)
                    if v:
                        try:
                            row[key] = float(v)
                        except ValueError:
                            pass
                rows.append(row)
    return url, digest, rows


def http_fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=300) as resp:
        return resp.read()


def main():
    request_path, out_path = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
    request = json.loads(request_path.read_text(encoding="utf-8"))
    result = {
        "format": "gnis-candidates-v1",
        "retrieved": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "sourceNote": ("USGS GNIS DomesticNames per-state text files (pipe-delimited), "
                       "extracted in the GitHub runner; see tools/gnis_extract.py. "
                       "Rows are candidates for screening, not yet VERIFIED batch rows."),
        "states": {},
    }
    for st, names in request["states"].items():
        url, digest, rows = extract_state(st, names, http_fetch)
        result["states"][st] = {
            "sourceUrl": url,
            "zipSha256": digest,
            "candidatesRequested": names,
            "rows": sorted(rows, key=lambda r: (r["name"], r["featureClass"], r["county"])),
        }
        print(f"{st}: {len(rows)} candidate rows from {url} sha256={digest[:16]}...")
    out_path.write_text(json.dumps(result, indent=1) + "\n", encoding="utf-8")
    print(f"wrote {out_path}")


if __name__ == "__main__":
    main()
