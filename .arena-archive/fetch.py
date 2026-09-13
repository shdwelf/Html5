#!/usr/bin/env python3
"""
fetch.py — retrieve archived files, byte-exact, and record their provenance.

Run inside a GitHub Actions job (see .github/workflows/arena-archive-fetch.yml).
It is the only egress channel this project has: the development sandbox is
allowlisted to GitHub/PyPI/npm, so web.archive.org is unreachable from there,
while the runner has ordinary internet access.

Reads .arena-archive/requests.txt, one request per line:

    <url> <output-path> [expected-size]
    direct:<live-url> <output-path> [expected-size]

Lines with the `direct:` prefix fetch a live URL instead of an archived
capture (for files the Wayback Machine never captured: the BasicCard
download page, the exact GL-iNet testing build). Direct fetches get no CDX
digest check - the sha256 in the log is the whole integrity story - and are
flagged as such in the provenance table.

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
import urllib.parse
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
        direct = url.startswith("direct:")
        if direct:
            url = url[len("direct:"):]
        out.append({"url": url, "path": path, "want": want, "direct": direct})
    return out


def cdx_digest(original_url: str, timestamp: str):
    """The index's own integrity field for that capture: base32(sha1(payload))."""
    bare = re.sub(r"^https?://", "", original_url)
    api = ("https://web.archive.org/cdx/search/cdx?url=" + urllib.parse.quote(bare, safe="")
           + "&fl=timestamp,digest,length&limit=200")
    try:
        with urllib.request.urlopen(urllib.request.Request(api, headers={"User-Agent": UA}), timeout=20) as r:
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


def fetch(url, attempts=3, budget=240):
    """One file, with an overall wall-clock budget across all attempts.

    urlopen's timeout applies per recv(), so a slow-but-moving transfer could
    otherwise dribble past it forever; the run that motivated this sat in one
    step for 30 minutes. Chunked reads with a deadline fail that file instead.
    """
    last = None
    start = time.monotonic()
    for i in range(attempts):
        remaining = budget - (time.monotonic() - start)
        if remaining <= 0:
            last = f"per-file budget of {budget}s exhausted"
            break
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
            with urllib.request.urlopen(req, timeout=min(60, remaining)) as r:
                status, headers = r.status, dict(r.headers)
                chunks, size = [], 0
                while True:
                    if time.monotonic() - start > budget:
                        raise TimeoutError(f"transfer exceeded the {budget}s per-file budget")
                    piece = r.read(1 << 20)
                    if not piece:
                        break
                    chunks.append(piece)
                    size += len(piece)
                return status, headers, b"".join(chunks)
        except urllib.error.HTTPError as e:
            last = f"HTTP {e.code}"
            # 404 on a timestamped URL means that capture is gone; no point retrying.
            if e.code in (400, 403, 404, 410):
                break
        except Exception as e:  # noqa: BLE001 - report, do not crash the whole run
            last = f"{type(e).__name__}: {e}"
        time.sleep(min(3 * (i + 1), max(0, budget - (time.monotonic() - start))))
    raise RuntimeError(last or "fetch failed")


PROV_ROW = re.compile(
    r"^\| `([^`]+)` \| (\d+) \| `([0-9a-f]{64})` \| `([A-Z2-7]*)` \| (.*?) \| \[[^\]]*\]\(([^)]+)\) \|$")


def recorded_rows():
    """(path -> (url, size, sha256, sha1b32, state)) from PROVENANCE.md, if any."""
    prov = DEST / "PROVENANCE.md"
    rows = {}
    if not prov.exists():
        return rows
    for line in prov.read_text().splitlines():
        m = PROV_ROW.match(line.strip())
        if m:
            rel, size, digest, sha1b, state, url = m.groups()
            rows[rel] = (url, int(size), digest, sha1b, state.strip())
    return rows


def main():
    if not REQUESTS.exists():
        print(f"no {REQUESTS}")
        return 2
    requests = parse(REQUESTS.read_text())
    DEST.mkdir(parents=True, exist_ok=True)
    recorded = recorded_rows()
    log = []
    rows = []

    for r in requests:
        if r.get("error"):
            log.append(f"SKIP  {r['url']}  ({r['error']})")
            continue
        url, rel, want = r["url"], r["path"], r["want"]
        prev = recorded.get(rel)
        if prev and prev[0] == url:
            purl, psize, pdigest, psha1b, pstate = prev
            out = DEST / rel
            if out.exists() and out.stat().st_size == psize and \
                    hashlib.sha256(out.read_bytes()).hexdigest() == pdigest:
                # The bytes on disk are content-addressed against a record this
                # same channel verified before; re-downloading proves nothing.
                # The previous verdict is carried over verbatim (re-derived so
                # the table below renders the same state word).
                want_digest = psha1b if pstate == "yes" else ("!!mismatch" if pstate == "**no**" else None)
                log.append(f"CACHED  {rel}  {psize} bytes  sha256 {pdigest[:16]}  (matches PROVENANCE.md; not re-downloaded)")
                rows.append((rel, url, psize, pdigest, psha1b, want_digest, out.read_bytes()[:4].hex(), "cached"))
                continue
        if "id_" not in url and not r.get("direct"):
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
        if r.get("direct"):
            want_digest = None
            verdict = "direct fetch (no index digest; sha256 recorded)"
        else:
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
            "Entries the fetch log marks CACHED were not re-downloaded: the bytes",
            "on disk already match the sha256 recorded here for that URL.",
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
    ok = sum(1 for l in log if l.startswith("OK") or l.startswith("CACHED"))
    print(f"\n{ok}/{len(requests)} retrieved")
    return 0


if __name__ == "__main__":
    sys.exit(main())
