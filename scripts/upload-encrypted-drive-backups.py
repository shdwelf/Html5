#!/usr/bin/env python3
"""Send only checked ciphertext to one-time, file-scoped Drive upload sessions.

The CI secret contains scoped session URLs, never an account OAuth token. No
plaintext APK, public certificate, owner private key or passphrase is read here.
"""
from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

PROFILES = ("public", "network", "private")
CHUNK_BYTES = 4 * 1024 * 1024  # Nonfinal chunks are multiples of 256 KiB.
SESSION_HOSTS = frozenset(("www.googleapis.com", "upload.googleapis.com", "content.googleapis.com"))


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise RuntimeError("Upload session redirects are refused.")


def digests(path: Path) -> dict:
    sha256, md5, size = hashlib.sha256(), hashlib.md5(), 0
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(CHUNK_BYTES), b""):
            size += len(chunk)
            sha256.update(chunk)
            md5.update(chunk)
    return {"bytes": size, "sha256": sha256.hexdigest(), "md5": md5.hexdigest()}


def prepare(raw: str, directory: Path, revision: str, fingerprint: str) -> list:
    if not re.fullmatch(r"[a-f0-9]{40}", revision) or not re.fullmatch(r"[A-F0-9]{40}", fingerprint):
        raise ValueError("Exact source revision and primary fingerprint are required.")
    sessions = json.loads(raw)
    if sessions.get("schema") != 1 or sessions.get("sourceRevision") != revision or set(sessions.get("profiles", {})) != set(PROFILES):
        raise ValueError("Upload sessions must match this exact release and all three profiles.")
    prepared, seen = [], set()
    for profile in PROFILES:
        item = sessions["profiles"][profile]
        uri = item["sessionUri"]
        parsed = urllib.parse.urlsplit(uri)
        if parsed.scheme != "https" or parsed.hostname not in SESSION_HOSTS or parsed.port not in (None, 443) or parsed.username or parsed.password or parsed.fragment:
            raise ValueError("Only HTTPS Google upload sessions are permitted.")
        if not parsed.path.startswith("/upload/drive/") or not urllib.parse.parse_qs(parsed.query).get("upload_id") or uri in seen:
            raise ValueError("A distinct file-scoped Drive upload session is required.")
        seen.add(uri)
        if not re.fullmatch(r"[A-Za-z0-9._-]{1,150}\.apk\.gpg", item["fileName"]):
            raise ValueError("Only encrypted APK target names are permitted.")
        path = directory / f"app-{profile}-debug.apk.gpg"
        receipt = json.loads(Path(f"{path}.json").read_text(encoding="utf-8"))
        if receipt.get("sourceRevision") != revision or receipt.get("recipientFingerprint") != fingerprint or receipt.get("file") != path.name:
            raise ValueError("Ciphertext receipt does not match this release/recipient.")
        if not path.is_file() or path.is_symlink() or not path.stat().st_size or digests(path) != receipt.get("ciphertext"):
            raise ValueError("Ciphertext size/checksum verification failed before upload.")
        prepared.append((profile, item, path, receipt))
    return prepared


def upload(path: Path, uri: str, opener=None) -> dict:
    opener = opener or urllib.request.build_opener(NoRedirect())
    size, offset = path.stat().st_size, 0
    with path.open("rb") as stream:
        while offset < size:
            chunk = stream.read(CHUNK_BYTES)
            if not chunk:
                raise RuntimeError("Ciphertext changed during upload.")
            end = offset + len(chunk)
            final = end == size
            request = urllib.request.Request(uri, data=chunk, method="PUT", headers={
                "Content-Type": "application/pgp-encrypted",
                "Content-Length": str(len(chunk)),
                "Content-Range": f"bytes {offset}-{end - 1}/{size}",
                "X-Goog-Upload-Offset": str(offset),
                "X-Goog-Upload-Command": "upload, finalize" if final else "upload",
                "X-Goog-Upload-Total-Size": str(size),
            })
            try:
                response = opener.open(request, timeout=120)
            except urllib.error.HTTPError as error:
                # Drive REST may use 308 Resume Incomplete. Never follow its
                # Location or log a credential-bearing request/exception URL.
                if error.code != 308:
                    raise RuntimeError("Drive rejected an encrypted upload chunk.") from None
                response = error
            with response:
                code, headers = response.status, response.headers
                body = response.read(1_048_577)
            if len(body) > 1_048_576:
                raise RuntimeError("Unexpectedly large Drive upload receipt.")
            state = headers.get("X-Goog-Upload-Status", "").lower()
            if state:
                # Header state, NOT HTTP 200 alone, determines completion.
                if state not in ("active", "final") or (state == "final") != final:
                    raise RuntimeError("Unexpected Drive upload session state.")
                if headers.get("X-Goog-Upload-Size-Received") not in (None, str(end)):
                    raise RuntimeError("Drive acknowledged an unexpected byte offset.")
                complete = state == "final"
            else:
                # Standard Drive v3 Content-Range protocol compatibility. A
                # bare success status without a final file ID is insufficient.
                if not final and code == 308 and headers.get("Range") == f"bytes=0-{end - 1}":
                    complete = False
                elif final and code in (200, 201):
                    complete = True
                else:
                    raise RuntimeError("Drive did not acknowledge the exact chunk.")
            if complete:
                result = json.loads(body)
                if not isinstance(result, dict) or not re.fullmatch(r"[A-Za-z0-9_-]{10,128}", result.get("id", "")):
                    raise RuntimeError("No final Drive file ID was returned.")
                return {key: result[key] for key in ("id", "name", "size", "md5Checksum", "sha256Checksum") if key in result}
            offset = end
    raise RuntimeError("Upload never reached a confirmed final state.")


def main() -> None:
    prepared = prepare(
        os.environ.pop("DRIVE_UPLOAD_SESSIONS_JSON"), Path(os.environ["ENCRYPTED_APK_DIRECTORY"]),
        os.environ["GITHUB_SHA"], os.environ["RECIPIENT_FINGERPRINT"].upper(),
    )
    for profile, item, path, receipt in prepared:
        result = upload(path, item["sessionUri"])
        if digests(path) != receipt["ciphertext"]:
            raise RuntimeError("Ciphertext changed during upload.")
        # These notices contain no URL, User ID or credential. Independent
        # Drive get_file checks must still match the ciphertext receipt.
        record = {"profile": profile, "targetName": item["fileName"], "drive": result, "receipt": receipt}
        safe = json.dumps(record, separators=(",", ":")).replace("%", "%25").replace("\r", "%0D").replace("\n", "%0A")
        print(f"::notice title=Encrypted-Drive-backup::{safe}", flush=True)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        # Do not print urllib exception reprs/tracebacks: they can contain the
        # scoped session URI. An uncertain upload must be inspected in Drive
        # before issuing another session or retrying a finalized upload.
        print("Encrypted Drive upload not confirmed. Inspect destination metadata before retrying; scoped credentials are intentionally omitted.", file=sys.stderr)
        sys.exit(1)
