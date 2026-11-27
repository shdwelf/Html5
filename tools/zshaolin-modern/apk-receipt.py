#!/usr/bin/env python3
"""Measure a built APK and actual test reports; never manufacture a success receipt."""
import argparse
import base64
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import xml.etree.ElementTree as ET
import zipfile
import zlib

ROOT = Path(__file__).resolve().parents[2]


def sha(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as f:
        for part in iter(lambda: f.read(1024 * 1024), b''):
            h.update(part)
    return h.hexdigest()


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('arch', choices=['arm', 'aarch64', 'x86_64'])
    p.add_argument('--android-tests-required', action='store_true')
    args = p.parse_args()
    work = ROOT / 'build/zshaolin' / args.arch
    apks = list((ROOT / 'apps/zshaolin-android/app/build/outputs/apk/release').glob('*.apk'))
    if len(apks) != 1:
        raise ValueError('Exactly one compiled release APK required')
    apk = apks[0]
    sdk = Path(os.environ['ANDROID_HOME'])
    signer = sdk / 'build-tools/35.0.0/apksigner'
    signature = subprocess.check_output([str(signer), 'verify', '--verbose', '--print-certs', str(apk)], text=True)
    cert = re.search(r'Signer #1 certificate SHA-256 digest: ([a-f0-9]{64})', signature)
    if not cert:
        raise ValueError('Missing verified APK signing certificate')
    with zipfile.ZipFile(apk) as z:
        if len(z.namelist()) != len(set(z.namelist())):
            raise ValueError('Duplicate APK entries')
        receipt = json.loads(z.read('assets/toolbox.json'))
        if receipt['arch'] != args.arch or receipt['sourceCommit'] != os.environ['GITHUB_SHA']:
            raise ValueError('APK payload/source receipt mismatch')
        if not receipt['aptSignatureVerificationRequired'] or receipt['missingCommands']:
            raise ValueError('Full authenticated native payload is not present')
        for pkg in receipt['packages']:
            data = z.read('assets/' + pkg['asset'])
            if len(data) != pkg['bytes'] or hashlib.sha256(data).hexdigest() != pkg['sha256']:
                raise ValueError('APK package bytes differ from signed repository inputs')
        elf = z.read('lib/' + receipt['abi'] + '/libtermux.so')
        if elf[:4] != b'\x7fELF':
            raise ValueError('Compiled terminal JNI library is missing')
    badging = subprocess.check_output([str(sdk/'build-tools/35.0.0/aapt'), 'dump', 'badging', str(apk)], text=True)
    if "package: name='com.termux'" not in badging or "targetSdkVersion:'28'" not in badging:
        raise ValueError('APK namespace/compatibility target differs from consented specification')
    if 'application-debuggable' in badging:
        raise ValueError('The delivery APK must not be debuggable')
    tests = []
    for f in sorted((ROOT/'apps/zshaolin-android/app/build/outputs/androidTest-results/connected').rglob('TEST-*.xml')):
        suite = ET.parse(f).getroot()
        if int(suite.attrib.get('failures', 0)) or int(suite.attrib.get('errors', 0)):
            raise ValueError('Android instrumentation failures remain')
        tests.append({'suite': suite.attrib.get('name'), 'tests': int(suite.attrib['tests']),
                      'failures': int(suite.attrib.get('failures', 0)),
                      'errors': int(suite.attrib.get('errors', 0)), 'xmlSha256': sha(f)})
    if args.android_tests_required and sum(t['tests'] for t in tests) < 5:
        raise ValueError('Actual full-toolbox emulator controls did not complete')
    name = f'zshaolin-modern-2.0.0-review-{receipt["abi"]}.apk'
    dest = work / name
    import shutil
    shutil.copyfile(apk, dest)
    report = {
        'schema': 1, 'sourceCommit': os.environ['GITHUB_SHA'], 'runId': os.environ['GITHUB_RUN_ID'],
        'apk': {'file': name, 'bytes': dest.stat().st_size, 'sha256': sha(dest),
                'applicationId': 'com.termux', 'versionName': '2.0.0-review', 'targetSdk': 28,
                'debuggable': False, 'abi': receipt['abi'], 'signerCertificateSha256': cert[1]},
        'payload': receipt, 'androidInstrumentationSuites': tests,
        'testedOnAndroid13X86Emulator': bool(tests), 'testedOnPhysicalSamsung': False,
        'armDeviceExecutionVerified': False, 'rootVerified': False, 'vpnProtectionProvided': False,
        'signingIdentity': 'New ephemeral unofficial review identity. Not upstream ZShaolin or Termux; updates require retaining/re-establishing the same signer.',
        'compatibilityLimitation': 'Primary Android user only; cannot coexist with Termux; target 28 permits private-prefix execution and forgoes newer target-SDK enforcement.',
    }
    raw = (json.dumps(report, indent=2) + '\n').encode()
    (work / 'apk-receipt.json').write_bytes(raw)
    (work / 'apk-signature.txt').write_text(signature)
    (work / 'SHA256SUMS.txt').write_text(sha(dest) + '  ' + name + '\n')
    # Large dependency inventory stays in the artifact. A compact, hashed summary
    # is transported through Checks for this environment's restricted downloads.
    compact = dict(report)
    compact['payload'] = {key: value for key, value in receipt.items() if key not in ('packages', 'maintainerScripts')}
    compact['payload']['packageVersions'] = {r['package']: r['version'] for r in receipt['packages']}
    compact['fullReceiptBytes'] = len(raw)
    compact['fullReceiptSha256'] = hashlib.sha256(raw).hexdigest()
    data = (json.dumps(compact, indent=2) + '\n').encode()
    (work / 'apk-summary.json').write_bytes(data)
    packed = zlib.compress(data, 9)
    if len(packed) > 30000: raise ValueError('Checks evidence transport limit')
    chunks = [base64.b64encode(packed[i:i+1800]).decode() for i in range(0, len(packed), 1800)]
    print('::notice title=ZShaolin APK evidence metadata::' + json.dumps({'bytes':len(data), 'sha256':hashlib.sha256(data).hexdigest(), 'chunks':len(chunks), 'arch':args.arch}, separators=(',', ':')))
    for i, chunk in enumerate(chunks):
        print(f'::notice title=ZShaolin APK evidence zlib {i+1} of {len(chunks)}::{chunk}')


if __name__ == '__main__':
    main()
