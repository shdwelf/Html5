#!/usr/bin/env python3
"""Country thread batch C1: fetch CIA World Factbook country profiles from the
factbook/factbook.json GitHub mirror (CC0), pinned by upstream commit, and emit
the frozen source register for the PC-Globe-style country viewer.

Each seeded country file is hashed (SHA-256) and its viewer fields extracted
verbatim (name, capital + coordinates, country centroid, total area, population,
languages, government type, national-anthem title and lyrics/music credit,
location note). The raw upstream files are not committed; the register's
per-file hashes pin them, exactly as the GNIS candidate extract pins the
DomesticNames ZIPs. Re-running against the same upstream commit reproduces the
register byte-for-byte except for the fetch timestamp note.

Usage: python3 tools/fetch_factbook_countries.py
"""
import hashlib
import html as html_mod
import json
import re
import urllib.request

REPO = "factbook/factbook.json"
COMMIT = "144d6977b2b0"  # resolved to the full SHA at fetch time from the branch HEAD
DATE = "2026-10-24"
OUT = "resources/country-viewer/country-factbook-batch1-source-register-2026-10-24.json"

COUNTRIES = [
    ("us", "north-america"), ("ca", "north-america"), ("mx", "north-america"),
    ("gt", "central-america-n-caribbean"),
    ("br", "south-america"), ("ar", "south-america"),
    ("uk", "europe"), ("fr", "europe"), ("gm", "europe"), ("it", "europe"),
    ("sp", "europe"), ("up", "europe"),
    ("sf", "africa"), ("eg", "africa"), ("ni", "africa"),
    ("tu", "middle-east"), ("is", "middle-east"),
    ("kz", "central-asia"), ("rs", "central-asia"),
    ("in", "south-asia"),
    ("ch", "east-n-southeast-asia"), ("ja", "east-n-southeast-asia"),
    ("id", "east-n-southeast-asia"),
    ("as", "australia-oceania"), ("nz", "australia-oceania"),
]


def get_json(url, raw=False):
    req = urllib.request.Request(url, headers={
        "Accept": "application/vnd.github.raw" if raw else "application/vnd.github+json",
        "User-Agent": "html5-factbook-fetcher"})
    with urllib.request.urlopen(req) as r:
        return r.read()


def clean(s):
    s = re.sub(r"<[^>]+>", " ", s or "")
    return re.sub(r"\s+", " ", html_mod.unescape(s)).strip()


def text(node):
    if isinstance(node, dict):
        return clean(node.get("text", ""))
    return ""


def dig(d, *path):
    cur = d
    for p in path:
        if not isinstance(cur, dict) or p not in cur:
            return ""
        cur = cur[p]
    return text(cur) if not isinstance(cur, str) else cur


def parse_coords(s):
    m = re.search(r"(\d+)\s+(\d+)\s*([NS]),\s*(\d+)\s+(\d+)\s*([EW])", s or "")
    if not m:
        return None
    lat = int(m.group(1)) + int(m.group(2)) / 60.0
    if m.group(3) == "S":
        lat = -lat
    lon = int(m.group(4)) + int(m.group(5)) / 60.0
    if m.group(6) == "W":
        lon = -lon
    return [round(lat, 4), round(lon, 4)]


def parse_int(s):
    m = re.search(r"[\d,]+", s or "")
    return int(m.group(0).replace(",", "")) if m else None


def main():
    head = json.loads(get_json(f"https://api.github.com/repos/{REPO}/commits?per_page=1"))
    full_sha = head[0]["sha"]
    print(f"upstream HEAD {full_sha}")
    countries = []
    for code, region in COUNTRIES:
        path = f"{region}/{code}.json"
        blob = get_json(f"https://api.github.com/repos/{REPO}/contents/{path}"
                        f"?ref={full_sha}", raw=True)
        d = json.loads(blob)
        sha = hashlib.sha256(blob).hexdigest()
        anthem = d.get("Government", {}).get("National anthem(s)", {})
        entry = {
            "code": code,
            "factbookPath": path,
            "fileSha256": sha,
            "name": dig(d, "Government", "Country name", "conventional short form")
                    or dig(d, "Government", "Country name", "conventional long form"),
            "capital": {
                "name": dig(d, "Government", "Capital", "name"),
                "coords": parse_coords(dig(d, "Government", "Capital", "geographic coordinates")),
            },
            "coords": parse_coords(dig(d, "Geography", "Geographic coordinates")),
            "areaTotalSqKm": parse_int(dig(d, "Geography", "Area", "total ")),
            "population": parse_int(dig(d, "People and Society", "Population", "total")),
            "populationText": dig(d, "People and Society", "Population", "total"),
            "languages": (dig(d, "People and Society", "Languages", "Languages")
                          or dig(d, "People and Society", "Languages"))[:240],
            "governmentType": dig(d, "Government", "Government type"),
            "anthem": {
                "title": text(anthem.get("title", {})) if isinstance(anthem, dict) else "",
                "lyricsMusic": text(anthem.get("lyrics/music", {})) if isinstance(anthem, dict) else "",
            },
            "location": dig(d, "Geography", "Location")[:240],
        }
        assert entry["name"] and entry["capital"]["name"] and entry["coords"], entry
        countries.append(entry)
        print(f"{code}: {entry['name']} / {entry['capital']['name']} / pop {entry['population']}")
    register = {
        "generated": DATE,
        "title": "Country thread batch C1: PC-Globe-style country viewer Factbook source register",
        "scope": ("Seed register for the country viewer (docs/agent-backlog-2026-10-21.md stream S4: "
                  "'PC-Globe-style country viewer with CIA Factbook notes'). Fields are extracted "
                  "verbatim from the CIA World Factbook as mirrored by factbook/factbook.json at a "
                  "pinned upstream commit; every seeded file carries its SHA-256 so the extraction "
                  "is re-verifiable. This is a starter set (25 countries), not full Factbook coverage; "
                  "the raw upstream files are not committed."),
        "upstream": {
            "repo": f"https://github.com/{REPO}",
            "commit": full_sha,
            "license": "CC0 1.0 Universal (mirror); CIA World Factbook content is public domain.",
            "fetched": DATE,
            "fetcher": "tools/fetch_factbook_countries.py",
        },
        "countries": countries,
    }
    import os
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w") as f:
        f.write(json.dumps(register, indent=2, ensure_ascii=False) + "\n")
    print(f"register written: {OUT} ({len(countries)} countries)")


if __name__ == "__main__":
    main()
