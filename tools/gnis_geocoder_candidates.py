#!/usr/bin/env python3
"""Fetch small per-name candidate responses from the USGS GNIS Geocoder.

This is a second-surface screening aid for the DomesticNames text extract,
not a bulk gazetteer download. The Geocoder is fuzzy: keep every returned
candidate for each explicitly requested name and review exact name, feature
type, state, county, GNIS ID, and primary-point coordinates before seeding.

Usage:
    python3 tools/gnis_geocoder_candidates.py request.json output.json
"""

import json
import pathlib
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone

BASE = "https://dashboard.waterdata.usgs.gov/service/geocoder/get/location/1.0"
UA = "arena-gnis-geocoder-screen/1.0 (+https://github.com/shdwelf/Html5; official GNIS candidate review)"


def fetch(name, state):
    params = urllib.parse.urlencode({
        "term": name,
        "states": state,
        "include": "gnis",
        "maxSuggestions": 10,
    })
    url = f"{BASE}?{params}"
    request = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": UA})
    with urllib.request.urlopen(request, timeout=90) as response:
        raw = response.read()
        payload = json.loads(raw.decode("utf-8"))
    return url, payload


def main():
    request_path, output_path = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
    request = json.loads(request_path.read_text(encoding="utf-8"))
    result = {
        "format": "gnis-geocoder-candidates-v1",
        "retrieved": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source": {
            "endpoint": BASE,
            "parameters": "term=<requested name>&states=<requested state>&include=gnis&maxSuggestions=10",
            "use": "Fuzzy candidate discovery only. Responses are retained for review; no candidate is VERIFIED by this script.",
        },
        "states": {},
    }
    for state, names in request["states"].items():
        queries = []
        for index, name in enumerate(names):
            url, payload = fetch(name, state)
            queries.append({"term": name, "url": url, "response": payload})
            features = payload.get("features", []) if isinstance(payload, dict) else []
            print(f"{state} {name}: {len(features)} Geocoder candidate features")
            if index + 1 < len(names):
                time.sleep(0.2)
        result["states"][state] = {"queries": queries}
    output_path.write_text(json.dumps(result, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {output_path}")


if __name__ == "__main__":
    main()
