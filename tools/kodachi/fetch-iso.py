#!/usr/bin/env python3
"""Owner-requested ISO acquisition, never execution. Fixed publisher routes/pins.

The sandbox cannot reach this host directly. The read-only Actions job downloads
and verifies it on a runner, then keeps the ISO only in a short-lived artifact.
A signature using a key from the same site is NOT independent key authentication.
"""
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener

NAME = 'kodachi-os-xfce-10.0.3-amd64.iso'
URL = 'https://kodachi.cloud/downloads/download.php?f=xfce-iso'
BASE = 'https://kodachi.cloud/downloads/installers/desktop/'
EXPECTED_BYTES = 4544303104
EXPECTED_SHA256 = '57693b32079bef101b75f21f3391bd036f1aae72836b8a06c921d236df626c14'
EXPECTED_SHA512 = 'ec45001c7f9f6fe288c478c4ed6b454b9effb4b9c1bf808a2c22750d7d5018b0ff96f1c8874988788335576f15d8c514a8fb4789a2d0e90e85d1de0509503628'
META_LIMIT = 128 * 1024


def checked_url(value):
    u = urlsplit(value)
    if u.scheme != 'https' or u.hostname != 'kodachi.cloud' or u.port not in (None, 443) or u.username or u.password or u.fragment:
        raise ValueError('Only the fixed HTTPS publisher origin is allowed, including redirects')
    return value


class PublisherRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        checked_url(newurl)
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def fetch(url, target, maximum, expected_bytes=None, opener=None):
    checked_url(url)
    opener = opener or build_opener(PublisherRedirect())
    request = Request(url, headers={'User-Agent': 'Html5-owner-requested-ISO-review/1.0', 'Accept-Encoding': 'identity'})
    sha256, sha512, size = hashlib.sha256(), hashlib.sha512(), 0
    part = target.with_suffix(target.suffix + '.partial')
    try:
        with opener.open(request, timeout=120) as response:
            final = checked_url(response.geturl())
            length = response.headers.get('Content-Length')
            if length and (not length.isdecimal() or int(length) > maximum or (expected_bytes is not None and int(length) != expected_bytes)):
                raise ValueError('Publisher Content-Length differs from the pinned size/bound')
            with part.open('xb') as out:
                while data := response.read(1024 * 1024):
                    size += len(data)
                    if size > maximum:
                        raise ValueError('Download exceeded the pinned bound')
                    out.write(data)
                    sha256.update(data)
                    sha512.update(data)
                    if expected_bytes and size % (64 * 1024 * 1024) < len(data):
                        print(f'Downloaded {size:,} / {expected_bytes:,} bytes', flush=True)
        if not size or (expected_bytes is not None and size != expected_bytes):
            raise ValueError('Empty/truncated download; not the pinned ISO')
        part.replace(target)
        return {'requestedUrl': url, 'finalUrl': final, 'bytes': size, 'sha256': sha256.hexdigest(), 'sha512': sha512.hexdigest()}
    except BaseException:
        part.unlink(missing_ok=True)
        raise


def main(out):
    out.mkdir(parents=True, exist_ok=True)
    if any(out.iterdir()):
        raise ValueError('Use a fresh output directory; refusing to overwrite an earlier acquisition')
    records = {}
    # Fetch exact matching verification material before spending bandwidth on ISO.
    for name in [NAME + '.sha256', NAME + '.sig', NAME + '.sig.info', 'public_key_v10.0.3.pem']:
        records[name] = fetch(BASE + name, out / name, META_LIMIT)
    checksum = (out / (NAME + '.sha256')).read_text().split()
    if not checksum or checksum[0].lower() != EXPECTED_SHA256 or (len(checksum) > 1 and checksum[-1].lstrip('*') != NAME):
        raise ValueError('Publisher checksum changed; review a new build explicitly instead of silently updating pins')
    if records[NAME + '.sig']['bytes'] != 512:
        raise ValueError('Detached signature is not the advertised 512-byte signature')
    records[NAME] = fetch(URL, out / NAME, EXPECTED_BYTES, EXPECTED_BYTES)
    iso = records[NAME]
    if iso['sha256'] != EXPECTED_SHA256 or iso['sha512'] != EXPECTED_SHA512:
        (out / NAME).unlink(missing_ok=True)
        raise ValueError('Downloaded ISO does not match both publisher hash pins; unsafe bytes removed')
    result = subprocess.run(['openssl', 'dgst', '-sha256', '-verify', str(out / 'public_key_v10.0.3.pem'), '-signature', str(out / (NAME + '.sig')), str(out / NAME)], capture_output=True, text=True, timeout=180)
    (out / 'signature-verification.txt').write_text(result.stdout + result.stderr)
    if result.returncode or result.stdout.strip() != 'Verified OK':
        raise ValueError('ISO signature did not verify with the downloaded publisher key; do not boot it')
    der = subprocess.check_output(['openssl', 'pkey', '-pubin', '-in', str(out / 'public_key_v10.0.3.pem'), '-outform', 'DER'], timeout=10)
    receipt = {'schema': 1, 'acquiredAtRunnerClock': datetime.now(timezone.utc).isoformat(), 'runnerSourceCommit': os.environ.get('GITHUB_SHA'), 'runId': os.environ.get('GITHUB_RUN_ID'), 'edition': 'Desktop XFCE amd64', 'publisherVersion': '10.0.3', 'publisherBuild': 76, 'publisherClaimedUpdatedAt': '2026-11-19', 'reportCutoff': '2026-11-17', 'futureDatedRelativeToReportCutoff': True, 'files': records, 'isoAcquired': True, 'sha256AndSha512MatchPins': True, 'signatureVerifiedAgainstDownloadedKey': True, 'publisherKeySpkiSha256': hashlib.sha256(der).hexdigest(), 'publisherKeyIndependentlyAuthenticated': False, 'booted': False, 'installed': False, 'isoCommittedToGit': False, 'storage': 'Short-lived Actions artifact only; no ISO bytes in Git or public app assets', 'trustCaveat': 'Hashes and a valid signature establish consistency with the downloaded key, not independent publisher-key authentication or OS security. No boot, mount or installer execution.'}
    (out / 'acquisition-receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')
    (out / 'SHA256SUMS.txt').write_text(''.join(record['sha256'] + '  ' + name + '\n' for name, record in records.items()))
    # Small, public metadata only. Retrieve via Checks API when artifact CDN is
    # inaccessible to the sandbox. Never encode/commit the multi-GB ISO itself.
    annotation = json.dumps(receipt, separators=(',', ':')).replace('%', '%25').replace('\r', '%0D').replace('\n', '%0A')
    print('::notice title=Kodachi ISO acquisition receipt::' + annotation)
    print(f'Acquired {EXPECTED_BYTES:,} ISO bytes; hashes and downloaded-key signature verified. NOT BOOTED. Independent key trust remains open.')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit('usage: fetch-iso.py EMPTY_OUTPUT_DIRECTORY')
    main(Path(sys.argv[1]).resolve())
