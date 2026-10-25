#!/usr/bin/env python3
"""Country thread batch C3: completion register for the pinned Factbook pin.

Batch C2 (tools/fetch_factbook_full.py) required a conventional name, a
capital name + coordinates and a country reference point, and recorded 18
profiles as skipped. C3 revisits exactly those skips at the same pinned
upstream commit: a profile whose source publishes a conventional name and a
reference point, but no capital (uninhabited or disputed features, Hong
Kong/Macau-style profiles), is now seeded with the capital fields standing
empty exactly as published - the same treatment C2 already gave profiles
with no anthem title or no population. A profile that publishes neither a
name nor a reference point (europe/ee.json) stays skipped: seeding it would
require inventing identity.

field extraction reuses tools/fetch_factbook_countries.py verbatim (via
tools/fetch_factbook_full.py's import). Downloads the pinned tarball from
codeload.github.com in one request; raw upstream files are not committed,
each seeded profile is pinned by its file SHA-256.

Output: resources/country-viewer/country-factbook-batch3-source-register-2026-10-25.json
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

BATCH2 = "resources/country-viewer/country-factbook-batch2-source-register-2026-10-24.json"
OUT = "resources/country-viewer/country-factbook-batch3-source-register-2026-10-25.json"
DATE = "2026-10-25"
REGIONS = ["north-america", "central-america-n-caribbean", "south-america", "europe",
           "africa", "middle-east", "central-asia", "south-asia",
           "east-n-southeast-asia", "australia-oceania"]


def main():
    commit = json.load(open(BATCH2))["upstream"]["commit"]
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
        # C3 minimum identity: a published conventional name and reference
        # point. Capital name/coordinates may stand empty as published.
        missing = [k for k, ok in [("name", bool(entry["name"])),
                                   ("coords", bool(entry["coords"]))] if not ok]
        if missing:
            skipped.append({"factbookPath": path, "code": code, "missing": missing})
        else:
            countries.append(entry)
    countries.sort(key=lambda c: c["name"])
    register = {
        "generated": DATE,
        "title": "Country thread batch C3: completion Factbook source register",
        "scope": ("Completion successor to the batch-2 full-coverage register "
                  "(country-factbook-batch2-source-register-2026-10-24.json, 233 seeded / 18 skipped) "
                  "at the same pinned upstream commit. The 17 profiles whose source publishes a "
                  "conventional name and a country reference point but no capital (mostly uninhabited "
                  "or disputed features, plus Hong Kong / Macau) are now seeded, with capital name "
                  "and coordinates standing empty exactly as published - as batch C2 already seeded "
                  "profiles with no published anthem title or population. One profile "
                  "(europe/ee.json) publishes neither a conventional name nor a reference point and "
                  "remains skipped: seeding it would require inventing identity. Oceans and antarctica "
                  "directories remain out of scope. Raw upstream files are not committed; per-file "
                  "SHA-256 hashes pin them."),
        "upstream": {
            "repo": "https://github.com/factbook/factbook.json",
            "commit": commit,
            "license": "CC0 1.0 Universal (mirror); CIA World Factbook content is public domain.",
            "fetched": DATE,
            "fetcher": "tools/fetch_factbook_completion.py",
            "tarballUrl": url,
        },
        "counts": {"seeded": len(countries), "skipped": len(skipped)},
        "skipped": skipped,
        "countries": countries,
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w") as f:
        f.write(json.dumps(register, indent=2, ensure_ascii=False) + "\n")
    no_capital = sum(1 for c in countries if not c["capital"]["name"])
    no_capital_coords = sum(1 for c in countries if not c["capital"]["coords"])
    no_anthem = sum(1 for c in countries if not c["anthem"]["title"])
    no_pop = sum(1 for c in countries if c["population"] is None)
    print(f"register written: {OUT} ({len(countries)} seeded, {len(skipped)} skipped, "
          f"{no_capital} without a published capital name, {no_capital_coords} without capital "
          f"coordinates, {no_anthem} without anthem title, {no_pop} without population)")
    for s in skipped:
        print("still skipped:", s)


if __name__ == "__main__":
    main()
