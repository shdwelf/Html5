#!/usr/bin/env python3
"""Fetch only the official pinned PuTTY release. Verify SHA-256 AND GPG origin.

No GitHub PuTTY mirror or third-party APK is accepted as the release source.
All downloads/build products go under the ignored repository build directory.
"""
import hashlib
import json
import subprocess
import tarfile
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener

ROOT = Path(__file__).resolve().parents[2]
VERSION = "0.85"
SHA256 = "13fd4db2936d03b73812a7bcc2a658e4dd29cc776a56c3670a7fc6f1a0ee8af8"
RELEASE_FINGERPRINT = "1A07DAC0F220CF12248EA7195C67D0F88BC3E5B5"
ARCHIVE_URL = f"https://the.earth.li/~sgtatham/putty/{VERSION}/putty-{VERSION}.tar.gz"
KEY_URL = "https://www.chiark.greenend.org.uk/~sgtatham/putty/keys/release-2026.asc"
ALLOWED = {"the.earth.li", "www.chiark.greenend.org.uk"}
BUILD = ROOT / "build/putty-android"


def allowed(url):
    p = urlsplit(url)
    if p.scheme != "https" or p.hostname not in ALLOWED or p.username or p.password or p.port not in (None, 443):
        raise ValueError("Outside the official HTTPS source allowlist")
    return url


class Redirects(HTTPRedirectHandler):
    max_redirections = 3

    def redirect_request(self, req, fp, code, msg, headers, url):
        allowed(url)
        return super().redirect_request(req, fp, code, msg, headers, url)


def fetch(url, path, maximum):
    request = Request(allowed(url), headers={"User-Agent": "Html5-unofficial-PuTTY-Android-source-build/1.0"})
    with build_opener(Redirects()).open(request, timeout=60) as response:
        allowed(response.url)
        body = response.read(maximum + 1)
    if len(body) > maximum:
        raise ValueError("Source download exceeded its bound")
    path.write_bytes(body)
    return body


def main():
    BUILD.mkdir(parents=True, exist_ok=True)
    archive = BUILD / f"putty-{VERSION}.tar.gz"
    body = fetch(ARCHIVE_URL, archive, 16 * 1024 * 1024)
    if hashlib.sha256(body).hexdigest() != SHA256:
        raise ValueError("Official release archive SHA-256 mismatch")
    signature = BUILD / "putty-source.sig"
    key = BUILD / "release.asc"
    fetch(ARCHIVE_URL + ".gpg", signature, 65536)
    fetch(KEY_URL, key, 256 * 1024)
    home = BUILD / "verify-home"
    home.mkdir(mode=0o700, exist_ok=True)
    home.chmod(0o700)
    prefix = ["gpg", "--homedir", str(home), "--batch", "--no-options", "--auto-key-locate", "clear"]
    details = subprocess.check_output(prefix + ["--with-colons", "--show-keys", str(key)], text=True)
    primary = []
    waiting = False
    for line in details.splitlines():
        parts = line.split(":")
        if parts[0] == "pub":
            waiting = True
        elif parts[0] == "fpr" and waiting:
            primary.append(parts[9]); waiting = False
    if primary != [RELEASE_FINGERPRINT]:
        raise ValueError("Downloaded public release certificate does not match the pinned full fingerprint")
    keyring = BUILD / "release.gpg"
    subprocess.run(prefix + ["--yes", "--dearmor", "--output", str(keyring), str(key)], check=True)
    verified = subprocess.run(["gpgv", "--homedir", str(home), "--status-fd", "1", "--keyring", str(keyring), str(signature), str(archive)],
                              text=True, capture_output=True, check=True)
    signatures = [line.split() for line in verified.stdout.splitlines() if line.startswith("[GNUPG:] VALIDSIG ")]
    if not any(row[2] == RELEASE_FINGERPRINT or row[-1] == RELEASE_FINGERPRINT for row in signatures):
        raise ValueError("No valid signature from the pinned release certificate")
    destination = BUILD / "source"
    destination.mkdir(exist_ok=True)
    with tarfile.open(archive, "r:gz") as package:
        members = package.getmembers()
        if len(members) > 12000 or sum(member.size for member in members) > 80 * 1024 * 1024:
            raise ValueError("Release extraction exceeded limits")
        if any(not member.name.startswith(f"putty-{VERSION}/") for member in members):
            raise ValueError("Unexpected release archive layout")
        package.extractall(destination, filter="data")
    receipt = {"version": VERSION, "sourceUrl": ARCHIVE_URL, "archiveSha256": SHA256,
               "releaseCertificateFingerprint": RELEASE_FINGERPRINT, "releaseSignatureVerified": True,
               "keyProvenance": KEY_URL, "keyTrustCaution": "Fingerprint pinned from the official HTTPS keys page; no independent offline web-of-trust attestation is claimed."}
    (BUILD / "source-receipt.json").write_text(json.dumps(receipt, indent=2) + "\n")
    print(json.dumps(receipt))


if __name__ == "__main__":
    main()
