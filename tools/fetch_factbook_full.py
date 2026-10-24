#!/usr/bin/env python3
"""Country thread batch C2: full-coverage Factbook register.

Downloads the factbook/factbook.json tarball at the pinned upstream commit
from codeload.github.com (one request) and extracts every country/territory
profile in the ten inhabited region directories (oceans/ and antarctica/ are
out of scope for a country viewer). Entries that cannot supply the viewer's
minimum identity set (conventional name, capital name + coordinates, country
reference point) are not seeded; they are recorded by path in the register's
skipped[] with the missing fields, so the coverage claim stays auditable.

field extraction reuses tools/fetch_factbook_countries.py verbatim.
Output: resources/country-viewer/country-factbook-batch2-source-register-2026-10-24.json
"""
import hashlib
import importlib.util
import io
import json
import os
import tarfile
import urllib.request

spec = importlib.util.spec_from_file_location("b1", os.path.join(os.path.dirname(__file__), "fetch_factbook_countries.py"))
b1 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(b1)

BATCH1 = "resources/country-viewer/country-factbook-batch1-source-register-2026-10-24.json"
OUT = "resources/country-viewer/country-factbook-batch2-source-register-2026-10-24.json"
DATE = "2026-10-24"
REGIONS = ["north-america", "central-america-n-caribbean", "south-america", "europe",
           "africa", "middle-east", "central-asia", "south-asia",
           "east-n-southeast-asia", "australia-oceania"]


def main():
    commit = json.load(open(BATCH1))["upstream"]["commit"]
    url = f"https://codeload.github.com/factbook/factbook.json/tar.gz/{commit}"
    req = urllib.request.Request(url, headers={"User-Agent": "html5-factbook-fetcher"})
    blob = urllib.request.urlopen(req).read()
    print(f"tarball {len(blob)} bytes at {commit[:12]}")
    tf = tarfile.open(fileobj=io.BytesIO(blob), mode="r:gz")
    countries, skipped = [], []
    for member in tf.getmembers():
        parts = member.name.split("/")
        if len(parts) != 3 or parts[1] not in REGIONS or not parts[2].endswith(".json"):
            continue
        path = f"{parts[1]}/{parts[2]}"
        raw = tf.extractfile(member).read()
        d = json.loads(raw)
        code = parts[2][:-5]
        anthem = d.get("Government", {}).get("National anthem(s)", {})
        entry = {
            "code": code,
            "factbookPath": path,
            "fileSha256": hashlib.sha256(raw).hexdigest(),
            "name": b1.dig(d, "Government", "Country name", "conventional short form")
                    or b1.dig(d, "Government", "Country name", "conventional long form"),
            "capital": {
                "name": b1.dig(d, "Government", "Capital", "name"),
                "coords": b1.parse_coords(b1.dig(d, "Government", "Capital", "geographic coordinates")),
            },
            "coords": b1.parse_coords(b1.dig(d, "Geography", "Geographic coordinates")),
            "areaTotalSqKm": b1.parse_int(b1.dig(d, "Geography", "Area", "total ")),
            "population": b1.parse_int(b1.dig(d, "People and Society", "Population", "total")),
            "populationText": b1.dig(d, "People and Society", "Population", "total"),
            "languages": (b1.dig(d, "People and Society", "Languages", "Languages")
                          or b1.dig(d, "People and Society", "Languages"))[:240],
            "governmentType": b1.dig(d, "Government", "Government type"),
            "anthem": {
                "title": b1.text(anthem.get("title", {})) if isinstance(anthem, dict) else "",
                "lyricsMusic": b1.text(anthem.get("lyrics/music", {})) if isinstance(anthem, dict) else "",
            },
            "location": b1.dig(d, "Geography", "Location")[:240],
        }
        missing = [k for k, ok in [("name", bool(entry["name"])),
                                   ("capital.name", bool(entry["capital"]["name"])),
                                   ("capital.coords", bool(entry["capital"]["coords"])),
                                   ("coords", bool(entry["coords"]))] if not ok]
        if missing:
            skipped.append({"factbookPath": path, "code": code, "missing": missing})
        else:
            countries.append(entry)
    countries.sort(key=lambda c: c["name"])
    register = {
        "generated": DATE,
        "title": "Country thread batch C2: full-coverage Factbook source register",
        "scope": ("Full-coverage successor to the batch-1 seed register "
                  "(country-factbook-batch1-source-register-2026-10-24.json, 25 countries). Every "
                  "profile in the ten inhabited Factbook region directories at the same pinned "
                  "upstream commit was extracted verbatim (ocean and antarctica directories are out "
                  "of scope for a country viewer). Entries lacking the viewer's minimum identity set "
                  "(name, capital name + coordinates, reference point) are recorded in skipped[] "
                  "rather than silently dropped. Raw upstream files are not committed; per-file "
                  "SHA-256 hashes pin them."),
        "upstream": {
            "repo": "https://github.com/factbook/factbook.json",
            "commit": commit,
            "license": "CC0 1.0 Universal (mirror); CIA World Factbook content is public domain.",
            "fetched": DATE,
            "fetcher": "tools/fetch_factbook_full.py",
            "tarballUrl": url,
        },
        "counts": {"seeded": len(countries), "skipped": len(skipped)},
        "skipped": skipped,
        "countries": countries,
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w") as f:
        f.write(json.dumps(register, indent=2, ensure_ascii=False) + "\n")
    no_anthem = sum(1 for c in countries if not c["anthem"]["title"])
    no_pop = sum(1 for c in countries if c["population"] is None)
    print(f"register written: {OUT} ({len(countries)} seeded, {len(skipped)} skipped, "
          f"{no_anthem} without anthem title, {no_pop} without population)")


if __name__ == "__main__":
    main()
