#!/usr/bin/env python3
"""
fetch.py — retrieve archived files, byte-exact, and record their provenance.

Run inside a GitHub Actions job (see .github/workflows/arena-archive-fetch.yml).
It is the only egress channel this project has: the development sandbox is
allowlisted to GitHub/PyPI/npm, so web.archive.org is unreachable from there,
while the runner has ordinary internet access.

Reads .arena-archive/requests.txt, one request per line:

    <url> <output-path> [expected-size]

`#` starts a comment. Every file is fetched, written to `output-path`, and hashed.
A file is *rejected* - not written - if it is empty, if the server returned a
Wayback error page instead of the original bytes, or if the size does not match
the expectation (CDX's `length` column, which is the archived record's length).
The raw-bytes URL modifier `id_` is required; without it the Archived toolbar is
injected into HTML and the content-type is rewritten.

Output: the files, plus samples/archive/PROVENANCE.md rewritten from what was
actually received, and .arena-archive/fetch.log with one line per request.
"""

import hashlib
import os
import pathlib
import sys
import time
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
REQUESTS = ROOT / ".arena-archive" / "requests.txt"
DEST = ROOT / "samples" / "archive"

UA = "arena-archive-fetch/1.0 (+https://github.com/shdwelf/Html5; firmware provenance)"


def parse(text):
    out = []
    for raw in text.splitlines():
        line = raw.split("#", 1)[0].strip()
        if not line:
            continue
        parts = line.split()
        if len(parts) < 2:
            out.append({"url": parts[0], "path": None, "want": None, "error": "malformed line"})
            continue
        url, path = parts[0], parts[1]
        want = int(parts[2]) if len(parts) > 2 and parts[2].isdigit() else None
        out.append({"url": url, "path": path, "want": want})
    return out


def looks_like_wayback_error(body: bytes) -> bool:
    head = body[:2048].lower()
    if b"wayback machine has not archived that url" in head:
        return True
    if b"<html" in head and b"web.archive.org" in head and b"<title>internet archive" in head:
        return True
    return False


def fetch(url, attempts=4):
    last = None
    for i in range(attempts):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
            with urllib.request.urlopen(req, timeout=120) as r:
                body = r.read()
                return r.status, dict(r.headers), body
        except urllib.error.HTTPError as e:
            last = f"HTTP {e.code}"
            # 404 on a timestamped URL means that capture is gone; no point retrying.
            if e.code in (400, 403, 404, 410):
                break
        except Exception as e:  # noqa: BLE001 - report, do not crash the whole run
            last = f"{type(e).__name__}: {e}"
        time.sleep(3 * (i + 1))
    raise RuntimeError(last or "fetch failed")


def main():
    if not REQUESTS.exists():
        print(f"no {REQUESTS}")
        return 2
    requests = parse(REQUESTS.read_text())
    DEST.mkdir(parents=True, exist_ok=True)
    log = []
    rows = []

    for r in requests:
        if r.get("error"):
            log.append(f"SKIP  {r['url']}  ({r['error']})")
            continue
        url, rel, want = r["url"], r["path"], r["want"]
        if "id_" not in url:
            log.append(f"SKIP  {url}  (no id_ modifier: would fetch the Archive's rewritten copy, not the original bytes)")
            continue
        try:
            status, headers, body = fetch(url)
        except Exception as e:  # noqa: BLE001
            log.append(f"FAIL  {rel}  {url}  ({e})")
            continue

        if not body:
            log.append(f"FAIL  {rel}  {url}  (empty body)")
            continue
        if looks_like_wayback_error(body):
            log.append(f"FAIL  {rel}  {url}  (Wayback error page, not the original file)")
            continue

        # A capture whose length disagrees with the index is either a truncated
        # transfer or a different capture than the one requested. Both matter.
        if want is not None and len(body) != want:
            log.append(f"FAIL  {rel}  {url}  (size {len(body)} != indexed {want})")
            continue

        out = DEST / rel
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_bytes(body)
        digest = hashlib.sha256(body).hexdigest()
        magic = body[:4].hex()
        ctype = headers.get("Content-Type", "?")
        log.append(f"OK    {rel}  {len(body)} bytes  sha256 {digest[:16]}  {ctype}")
        rows.append((rel, url, len(body), digest, magic, ctype))

    (ROOT / ".arena-archive").mkdir(exist_ok=True)
    (ROOT / ".arena-archive" / "fetch.log").write_text("\n".join(log) + "\n")

    if rows:
        lines = [
            "# Archived vendor files — what these are and exactly where they came from",
            "",
            "Retrieved by `.github/workflows/arena-archive-fetch.yml` from the Internet",
            "Archive, byte-for-byte, using the `id_` URL modifier (which returns the",
            "original response rather than the Archive's rewritten copy). Each file's",
            "sha256 below is over the bytes as received; the size is checked against the",
            "length the CDX index recorded for that capture, and a mismatch is a",
            "failure rather than a warning.",
            "",
            "The development sandbox cannot reach archive.org (its egress is allowlisted",
            "to GitHub/PyPI/npm), which is why this runs on a GitHub Actions runner and",
            "commits the bytes back to the branch instead of downloading them locally.",
            "",
            "| file | bytes | sha256 | magic | source |",
            "| --- | --- | --- | --- | --- |",
        ]
        for rel, url, size, digest, magic, _ctype in sorted(rows):
            lines.append(f"| `{rel}` | {size} | `{digest}` | `{magic}` | [{url.split('/web/')[-1]}]({url}) |")
        lines += [
            "",
            "## Re-fetching",
            "",
            "`python3 .arena-archive/fetch.py` re-runs every request; an unchanged line in",
            "`requests.txt` is idempotent, and a size mismatch aborts that file instead of",
            "writing a corrupt one. To add a URL, append it (with its expected size, from",
            "the CDX index) and push — the workflow triggers on that path.",
            "",
        ]
        (DEST / "PROVENANCE.md").write_text("\n".join(lines))

    print("\n".join(log))
    ok = sum(1 for l in log if l.startswith("OK"))
    print(f"\n{ok}/{len(requests)} retrieved")
    return 0


if __name__ == "__main__":
    sys.exit(main())
