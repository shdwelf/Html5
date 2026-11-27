#!/usr/bin/env python3
"""Prepare/validate static official Magisk inputs; never execute the APK or ELF."""
import argparse
import base64
import hashlib
import json
import os
import re
from pathlib import Path
import shutil
import subprocess
import urllib.request
import zipfile
import zlib

ROOT = Path(__file__).resolve().parents[2]
PIN = json.loads((ROOT / 'tools/android-root-review/inputs.json').read_text())
WORK = Path(os.environ.get('RUNNER_TEMP', ROOT / 'build')) / 'android-root-review'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def fetch(pin, dest):
    with urllib.request.urlopen(pin['url'], timeout=120) as response, dest.open('wb') as out:
        if not response.geturl().startswith('https://'):
            raise ValueError('Non-HTTPS redirect')
        maximum = pin.get('bytes', 700 * 1024**2)
        count = 0
        while part := response.read(1024 * 1024):
            count += len(part)
            if count > maximum:
                raise ValueError('Download exceeds pinned bound')
            out.write(part)
    if sha(dest) != pin['sha256'] or ('bytes' in pin and dest.stat().st_size != pin['bytes']):
        raise ValueError('Pinned artifact SHA-256/size mismatch')


def prepare():
    for part in ('inputs', 'reports', 'logs', 'projects'):
        (WORK / part).mkdir(parents=True, exist_ok=True)
    apk = WORK / 'Magisk-v31.1.apk'
    fetch(PIN['magisk'], apk)
    records = []
    with zipfile.ZipFile(apk) as archive:
        if len(archive.namelist()) != len(set(archive.namelist())):
            raise ValueError('Duplicate APK entries')
        for number, name in enumerate(PIN['analysisTargets']):
            info = archive.getinfo(name)
            if info.file_size > 12 * 1024**2:
                raise ValueError('ELF input exceeds static-review bound')
            raw = archive.read(info)
            if raw[:4] != b'\x7fELF':
                raise ValueError('Expected native ELF input')
            flat = f'magiskinit-{number}.elf'
            (WORK / 'inputs' / flat).write_bytes(raw)
            records.append({'apkEntry': name, 'flatName': flat, 'bytes': len(raw),
                            'sha256': hashlib.sha256(raw).hexdigest(), 'executed': False})
    (WORK / 'inputs/manifest.json').write_text(json.dumps(records, indent=2) + '\n')
    ghidra = WORK / 'ghidra.zip'
    fetch(PIN['ghidra'], ghidra)
    # Trusted pinned upstream distribution. Python's ZipFile still rejects unsafe
    # path components explicitly before extracting into this dedicated directory.
    with zipfile.ZipFile(ghidra) as archive:
        for info in archive.infolist():
            p = Path(info.filename)
            if p.is_absolute() or '..' in p.parts or '\\' in info.filename:
                raise ValueError('Unsafe Ghidra distribution entry')
        archive.extractall(WORK)
        for info in archive.infolist():
            if info.external_attr >> 16 & 0o111:
                (WORK / info.filename).chmod(0o755)
    ghidra.unlink()
    print('Pinned official APK and Ghidra distribution verified; no APK/native input executed.')


def certificate_fingerprints(text):
    # New apksigner versions can label a signer by SDK range rather than #1.
    # Keep the certificate SHA-256 requirement, accept only Signer-labelled lines.
    return sorted(set(value.lower() for value in re.findall(
        r'(?im)^Signer[^\r\n]*certificate SHA-256 digest:\s*([0-9a-f]{64})[ \t]*$', text)))


def summarize():
    programs = []
    manifest = json.loads((WORK / 'inputs/manifest.json').read_text())
    for inp in manifest:
        report = json.loads((WORK / 'reports' / (inp['flatName'] + '.json')).read_text())
        if report['inputSha256'] != inp['sha256'] or report['ghidraVersion'] != PIN['ghidra']['version']:
            raise ValueError('Ghidra/input receipt mismatch')
        if report['instructionsVisitedUpTo1000000'] <= 0 or report['functionsDefinedUpTo200000'] <= 0:
            raise ValueError('No measured native disassembly/functions')
        if not any(x['completed'] for x in report['boundedDecompilations']):
            raise ValueError('No native decompilation completed')
        if any(report[key] for key in ('inputExecuted', 'firmwarePatchedOrFlashed', 'deviceRootVerified',
                                      'malwareFreeOrSafeVerdict', 'wholeProgramSecurityAudit')):
            raise ValueError('Invalid security/device success claim')
        programs.append({'input': inp, 'analysis': report})
    control = json.loads((WORK / 'reports/control.json').read_text())
    if control['instructionsVisitedUpTo1000000'] <= 0 or not any(x['completed'] for x in control['boundedDecompilations']):
        raise ValueError('Synthetic positive control failed')
    signature = (WORK / 'reports/apk-signature.txt').read_text()
    fingerprints = certificate_fingerprints(signature)
    if not fingerprints:
        raise ValueError('Missing measured APK signer receipt; public signer output: ' + signature[-1500:])
    summary = {
        'schema': 1, 'sourceCommit': os.environ.get('GITHUB_SHA'), 'runId': os.environ.get('GITHUB_RUN_ID'),
        'magisk': PIN['magisk'], 'ghidra': PIN['ghidra'], 'programs': programs,
        'syntheticPositiveControl': control, 'apkSignatureVerification': signature,
        'apkSignerCertificateSha256': fingerprints,
        'signatureLimit': 'Internal APK-signature consistency and an observed certificate fingerprint; not independent authentication of the author signing key or a complete APK audit.',
        'screenshotEvidence': json.loads((ROOT / 'tools/android-root-review/screenshot-findings.json').read_text()),
        'sourceSha256': {p: sha(ROOT / p) for p in ['tools/android-root-review/static-review.py',
                                                  'tools/ghidra_scripts/AndroidRootingReview.java',
                                                  'tools/android-root-review/inputs.json']},
        'deviceConnected': False, 'firmwareAcquired': False, 'firmwareFlashed': False,
        'rootVerifiedOnDevice': False, 'wholeApkAudited': False, 'identifierCollection': False,
        'conclusion': 'Bounded static observations of two public Magisk init binaries only. Screenshots confirm firmware labels, not unlockability or working root. Download Mode OEM Lock/KnoxGuard and exact firmware remain device-side gates.',
    }
    raw = (json.dumps(summary, indent=2) + '\n').encode()
    (WORK / 'reports/static-summary.json').write_bytes(raw)
    compressed = zlib.compress(raw, 9)
    if len(raw) > 128 * 1024 or len(compressed) > 30000:
        raise ValueError('Evidence transport bound exceeded')
    chunks = [base64.b64encode(compressed[i:i+1800]).decode() for i in range(0, len(compressed), 1800)]
    meta = {'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest(), 'chunks': len(chunks),
            'sourceCommit': summary['sourceCommit'], 'runId': summary['runId']}
    print('::notice title=Android root static evidence metadata::' + json.dumps(meta, separators=(',', ':')))
    for i, chunk in enumerate(chunks):
        print(f'::notice title=Android root static evidence zlib {i+1} of {len(chunks)}::{chunk}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('stage', choices=['prepare', 'summarize'])
    args = parser.parse_args()
    {'prepare': prepare, 'summarize': summarize}[args.stage]()
