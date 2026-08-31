#!/usr/bin/env python3
"""Rebuild the Greeran Book artifacts from source.

    python3 tools/build_greeran_artifacts.py

Produces:
  greeran-book-inlined.html  — single-file build (CSS + JS inlined, no external refs)
  greeran-book.xdc           — webxdc container in this repo's established
                               NUL-delimited layout:
                                 manifest.json \\0 <json> \\0
                                 index.html   \\0 <html> \\0
                                 icon.png     \\0 <png>
"""
import io
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BOOK = "greeran-book.html"
INLINED = "greeran-book-inlined.html"
XDC = "greeran-book.xdc"
CSS = "css/greeran-book.css"
JS = "js/greeran-book.js"
ICON = "icon.png"

MANIFEST = {
    "name": "The Greeran Book",
    "source_code_url": "https://github.com/shdwelf/Html5",
    "version": "1.0.0",
    "min_api": 1,
    "webxdc": "index.html",
}


def read(path):
    with io.open(os.path.join(ROOT, path), encoding="utf-8") as fh:
        return fh.read()


def main():
    html = read(BOOK)
    css = read(CSS)
    js = read(JS)

    link = '<link rel="stylesheet" href="./css/greeran-book.css" />'
    script = '<script src="./js/greeran-book.js"></script>'
    if html.count(link) != 1 or html.count(script) != 1:
        raise SystemExit("expected exactly one CSS link and one JS script tag")

    inlined = html.replace(link, "<style>\n" + css + "\n</style>")
    inlined = inlined.replace(script, "<script>\n" + js + "\n</script>")

    # The standalone build must not reference anything outside itself.
    for bad in ('<link rel="stylesheet"', '<script src='):
        if bad in inlined:
            raise SystemExit("inlined build still references external asset: " + bad)

    out = os.path.join(ROOT, INLINED)
    with io.open(out, "w", encoding="utf-8") as fh:
        fh.write(inlined)
    print("%-28s %8d bytes" % (INLINED, os.path.getsize(out)))

    with open(os.path.join(ROOT, ICON), "rb") as fh:
        icon = fh.read()

    parts = [
        b"manifest.json",
        json.dumps(MANIFEST).encode("utf-8"),
        b"index.html",
        inlined.encode("utf-8"),
        b"icon.png",
        icon,
    ]
    blob = b"\0".join(parts) + b"\0"
    out = os.path.join(ROOT, XDC)
    with open(out, "wb") as fh:
        fh.write(blob)
    print("%-28s %8d bytes" % (XDC, os.path.getsize(out)))

    # Round-trip the container to prove the layout is intact.
    fields = blob.split(b"\0")
    assert fields[0] == b"manifest.json" and json.loads(fields[1])["name"] == MANIFEST["name"]
    assert fields[2] == b"index.html" and fields[3].startswith(b"<!DOCTYPE html>")
    assert fields[4] == b"icon.png" and fields[5].startswith(b"\x89PNG")
    print("container verified: 3 entries, layout intact")


if __name__ == "__main__":
    main()
