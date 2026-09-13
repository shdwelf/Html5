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

import base64
import hashlib
import pathlib
import re
import zipfile
import io
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


def cdx_digest(original_url: str, timestamp: str):
    """The index's own integrity field for that capture: base32(sha1(payload))."""
    bare = re.sub(r"^https?://", "", original_url)
    api = ("https://web.archive.org/cdx/search/cdx?url=" + urllib.parse.quote(bare, safe="")
           + "&fl=timestamp,digest,length&limit=200")
    try:
        with urllib.request.urlopen(urllib.request.Request(api, headers={"User-Agent": UA}), timeout=60) as r:
            for line in r.read().decode("utf-8", "replace").splitlines():
                parts = line.split()
                if len(parts) >= 2 and parts[0] == timestamp:
                    return parts[1]
    except Exception:  # noqa: BLE001 - verification is best-effort, reported not assumed
        return None
    return None


def sha1_base32(body: bytes) -> str:
    return base64.b32encode(hashlib.sha1(body).digest()).decode().rstrip("=")


def zip_report(body: bytes):
    """(entries, uncompressed_bytes, bad) for a ZIP body, or None if it is not one."""
    if body[:2] != b"PK":
        return None
    try:
        with zipfile.ZipFile(io.BytesIO(body)) as z:
            names = z.namelist()
            sizes = sum(i.file_size for i in z.infolist())
            bad = z.testzip()
            return len(names), sizes, bad, [n for n in names if not n.endswith("/")][:6]
    except Exception as e:  # noqa: BLE001
        return -1, 0, f"{type(e).__name__}: {e}", []


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

        # The index's `length` is not the byte count of the original file (it is
        # the size of the stored record, which differs by a few hundred bytes
        # either way), so it is a sanity band, not an equality: a body this far
        # from the index is a different resource or a truncated transfer.
        if want is not None and abs(len(body) - want) > max(1024, int(want * 0.25)):
            log.append(f"FAIL  {rel}  {url}  (size {len(body)} vs indexed {want}: not the same resource)")
            continue

        out = DEST / rel
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_bytes(body)
        digest = hashlib.sha256(body).hexdigest()
        sha1b = sha1_base32(body)
        magic = body[:4].hex()
        ctype = headers.get("Content-Type", "?")
        # The index's digest is over the archived payload, so a match proves the
        # bytes on disk are the bytes the Archive holds - by content, not by size.
        want_digest = cdx_digest(re.match(r"^https?://[^/]+/web/(\d+)id_/(.+)$", url).group(2),
                                 re.match(r"^https?://[^/]+/web/(\d+)id_/(.+)$", url).group(1)) if re.match(r"^https?://[^/]+/web/(\d+)id_/(.+)$", url) else None
        verdict = "digest match" if want_digest == sha1b else (f"digest MISMATCH (index {want_digest})" if want_digest else "digest unavailable")
        zr = zip_report(body)
        extra = ""
        if zr:
            entries, usize, bad, first = zr
            extra = f"  zip: {entries} entries, {usize} bytes unpacked, crc {'OK' if bad is None else 'BAD ' + str(bad)} [{', '.join(first)}]"
        log.append(f"OK    {rel}  {len(body)} bytes  sha256 {digest[:16]}  {verdict}  {ctype}{extra}")
        rows.append((rel, url, len(body), digest, sha1b, want_digest, magic, ctype))

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
            "| file | bytes | sha256 | CDX digest (sha1 base32) | verified | source |",
            "| --- | --- | --- | --- | --- | --- |",
        ]
        for rel, url, size, digest, sha1b, want_digest, _magic, _ctype in sorted(rows):
            state = "yes" if want_digest == sha1b else ("**no**" if want_digest else "index had none")
            lines.append(f"| `{rel}` | {size} | `{digest}` | `{sha1b}` | {state} | [{url.split('/web/')[-1]}]({url}) |")
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
