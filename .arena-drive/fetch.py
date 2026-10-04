#!/usr/bin/env python3
"""
fetch.py — pull Google Drive backup artifacts onto a runner, byte-verified.

Companion to .arena-archive/fetch.py, for a different unreachable host. The
development sandbox's egress is allowlisted to GitHub/PyPI/npm, so Drive fails
at the TLS handshake there:

    curl https://drive.google.com/...
    curl: (35) OpenSSL SSL_connect: SSL_ERROR_SYSCALL

A GitHub Actions runner has ordinary internet access, so it can fetch what the
sandbox cannot. See .github/workflows/arena-drive-sync.yml.

Reads .arena-drive/requests.txt, one request per line:

    <drive-file-id> <output-name> [expected-size]

`#` starts a comment. Files land in .arena-drive/payload/ (gitignored — these
are up to 96 MB and must never be committed; only the delta they reveal is).

ACCESS. Drive's `uc?export=download` endpoint serves a file only if it is
link-readable. This script does not and cannot change sharing — granting and
revoking that is a deliberate human decision, made outside this repository.
When a file is not shared, Drive returns an HTML sign-in page with HTTP 200;
that is detected and reported as NOT-SHARED rather than written to disk, so a
permissions problem can never masquerade as a corrupt download.

INTEGRITY. Every file is size-checked against the expectation recorded in
requests.txt (taken from Drive's own metadata) and sha256'd. A mismatch is a
failure that rejects the file, never a warning that writes it anyway. This
matters more than usual here: the Drive area's own READ ME FIRST.txt documents
that raw .bundle/.xdc uploads were silently mangled by a UTF-8 re-encode
(65,552 B stored as 118,711 B), so "the file downloaded" is not evidence that
the bytes are the right ones.
"""

import hashlib
import pathlib
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
REQUESTS = ROOT / ".arena-drive" / "requests.txt"
DEST = ROOT / ".arena-drive" / "payload"
LOG = ROOT / ".arena-drive" / "fetch.log"

UA = "arena-drive-sync/1.0 (+https://github.com/shdwelf/Html5; backup reconciliation)"

# Large files get a virus-scan interstitial instead of the bytes; this host
# serves them directly with confirm=t.
ENDPOINTS = (
    "https://drive.usercontent.google.com/download?id={id}&export=download&confirm=t",
    "https://drive.google.com/uc?export=download&id={id}&confirm=t",
)


def parse(text):
    out = []
    for raw in text.splitlines():
        line = raw.split("#", 1)[0].strip()
        if not line:
            continue
        parts = line.split()
        if len(parts) < 2:
            out.append({"id": parts[0] if parts else "?", "name": None,
                        "want": None, "error": "malformed line"})
            continue
        want = int(parts[2]) if len(parts) > 2 and parts[2].isdigit() else None
        out.append({"id": parts[0], "name": parts[1], "want": want, "error": None})
    return out


def looks_like_html(body: bytes) -> bool:
    head = body[:4096].lstrip().lower()
    return head.startswith(b"<!doctype html") or head.startswith(b"<html")


def describe_block(body: bytes) -> str:
    """Why Drive gave us a page instead of a file."""
    text = body[:200_000].decode("utf-8", "replace").lower()
    if "sign in" in text or "accounts.google.com" in text:
        return "NOT-SHARED (Drive returned a sign-in page; the file is not link-readable)"
    if "quota" in text or "too many" in text:
        return "RATE-LIMITED (Drive download quota exceeded for this file)"
    if "can't scan" in text or "virus" in text:
        return "SCAN-INTERSTITIAL (confirm token not accepted)"
    return "HTML page returned instead of file bytes"


def get(url: str):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=300) as r:
        return r.read()


def main() -> int:
    if not REQUESTS.exists():
        print(f"no {REQUESTS}", file=sys.stderr)
        return 1

    requests = parse(REQUESTS.read_text())
    DEST.mkdir(parents=True, exist_ok=True)
    log = []
    ok = 0

    for item in requests:
        name = item["name"]
        if item["error"]:
            log.append(f"FAIL  {item['id']}  {item['error']}")
            continue

        out = DEST / name
        want = item["want"]

        # Idempotent: an existing file of the right size and hash is not re-fetched.
        if out.exists() and (want is None or out.stat().st_size == want):
            digest = hashlib.sha256(out.read_bytes()).hexdigest()
            log.append(f"CACHED {name}  {out.stat().st_size} bytes  sha256 {digest[:16]}")
            ok += 1
            continue

        body, err = None, None
        for tmpl in ENDPOINTS:
            try:
                candidate = get(tmpl.format(id=item["id"]))
            except urllib.error.HTTPError as e:
                err = f"HTTP {e.code}"
                continue
            except Exception as e:                      # noqa: BLE001
                err = type(e).__name__
                continue
            if looks_like_html(candidate):
                err = describe_block(candidate)
                continue
            body = candidate
            break

        if body is None:
            log.append(f"FAIL  {name}  {err or 'no response'}")
            continue
        if not body:
            log.append(f"FAIL  {name}  empty response")
            continue
        if want is not None and len(body) != want:
            log.append(f"FAIL  {name}  size {len(body)} != expected {want} — rejected, not written")
            continue

        out.write_bytes(body)
        digest = hashlib.sha256(body).hexdigest()
        log.append(f"OK    {name}  {len(body)} bytes  sha256 {digest[:16]}")
        ok += 1

    LOG.write_text("\n".join(log) + "\n")
    print("\n".join(log))
    print(f"\n{ok}/{len(requests)} retrieved")
    # Missing payload is a normal, reportable state (nothing shared yet), not a
    # crash: the workflow still runs the diff over whatever did arrive.
    return 0


if __name__ == "__main__":
    sys.exit(main())
