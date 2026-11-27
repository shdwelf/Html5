#!/usr/bin/env python3
"""Measure a built APK and actual test reports; never manufacture a success receipt."""
import argparse
import base64
import hashlib
import json
import os
from pathlib import Path
import sys
import subprocess
import xml.etree.ElementTree as ET
import zipfile
import zlib

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tools/android-ci'))
from apk_signature import certificate_fingerprints

TEST_SUITE = 'org.dyne.zshaolin.modern.ToolboxTest'
REQUIRED_TEST_CASES = frozenset({
    'aAllDeclaredPackagesAndCommandsAreInstalled',
    'bRealNativeShellEditorsCryptoLanguagesAndMedia',
    'cNoAutomaticListenersAndMissingKeyRefusesToStart',
    'dSyntheticLoopbackKeyOnlySshWithoutHttpProvisioning',
    'eForegroundTerminalPtyAndExitLifecycle',
})
SOURCE_FILES = (
    'tools/zshaolin-modern/inputs.json',
    'tools/zshaolin-modern/prepare.py',
    'tools/zshaolin-modern/apk-receipt.py',
    'tools/zshaolin-modern/assets/sshd_config',
    'tools/zshaolin-modern/assets/zshrc',
    'tools/zshaolin-legacy/overlay/z-ssh',
    'apps/zshaolin-android/app/src/main/java/org/dyne/zshaolin/modern/Toolbox.java',
    'apps/zshaolin-android/app/src/main/java/org/dyne/zshaolin/modern/MainActivity.java',
    'apps/zshaolin-android/app/src/androidTest/java/org/dyne/zshaolin/modern/ToolboxTest.java',
    'apps/zshaolin-android/app/src/main/AndroidManifest.xml',
    'apps/zshaolin-android/app/build.gradle',
)


def sha(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as f:
        for part in iter(lambda: f.read(1024 * 1024), b''):
            h.update(part)
    return h.hexdigest()


def android_test_results(directory, required=False):
    """Accept the exact five completed controls, not an inflated suite counter."""
    paths = sorted(Path(directory).rglob('TEST-*.xml'))
    if len(paths) > 10:
        raise ValueError('Too many Android instrumentation reports')
    tests = []
    for path in paths:
        if path.stat().st_size > 2 * 1024 * 1024:
            raise ValueError('Android instrumentation XML exceeds bound')
        suite = ET.parse(path).getroot()
        cases = list(suite.findall('testcase'))
        names = [case.attrib.get('name') for case in cases]
        counters = {key: int(suite.attrib.get(key, 0)) for key in ('tests', 'failures', 'errors', 'skipped', 'disabled')}
        if suite.tag != 'testsuite' or counters['tests'] != len(cases) or any(value < 0 for value in counters.values()):
            raise ValueError('Android instrumentation report counts are inconsistent')
        if any(counters[key] for key in ('failures', 'errors', 'skipped', 'disabled')) or any(
            case.find(tag) is not None for case in cases for tag in ('failure', 'error', 'skipped')):
            raise ValueError('Android instrumentation failures or skipped tests remain')
        if required and (suite.attrib.get('name') != TEST_SUITE or set(names) != REQUIRED_TEST_CASES or
                         len(names) != len(REQUIRED_TEST_CASES) or
                         any(case.attrib.get('classname') != TEST_SUITE for case in cases)):
            raise ValueError('The exact five mandatory full-toolbox controls must complete')
        tests.append({'suite': suite.attrib.get('name'), **counters, 'testCases': sorted(names), 'xmlSha256': sha(path)})
    if required and len(tests) != 1:
        raise ValueError('Exactly one actual full-toolbox emulator suite must complete')
    return tests


def offline_emulator_verified(arch, required, environ):
    # The workflow sets this only after disabling radios, and the test suite
    # checks airplane/Wi-Fi settings again before any payload installation.
    verified = arch == 'x86_64' and environ.get('ZSHAOLIN_EMULATOR_OFFLINE') == '1'
    if required and not verified:
        raise ValueError('Mandatory offline Android 13 emulator setup was not verified')
    return required and verified


def verify_security_assets(archive):
    expected = {
        'z-ssh': (ROOT/'tools/zshaolin-legacy/overlay/z-ssh').read_bytes().replace(
            b'#!env zsh', b'#!/data/data/com.termux/files/usr/bin/zsh', 1),
        'sshd_config': (ROOT/'tools/zshaolin-modern/assets/sshd_config').read_bytes(),
        'zshrc': (ROOT/'tools/zshaolin-modern/assets/zshrc').read_bytes(),
    }
    measured = {}
    for name, source in expected.items():
        data = archive.read('assets/' + name)
        if data != source:
            raise ValueError('Packaged security/startup asset differs from reviewed source: ' + name)
        measured[name] = {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
    return measured


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('arch', choices=['arm', 'aarch64', 'x86_64'])
    p.add_argument('--android-tests-required', action='store_true')
    args = p.parse_args()
    offline_verified = offline_emulator_verified(args.arch, args.android_tests_required, os.environ)
    work = ROOT / 'build/zshaolin' / args.arch
    apks = list((ROOT / 'apps/zshaolin-android/app/build/outputs/apk/release').glob('*.apk'))
    if len(apks) != 1:
        raise ValueError('Exactly one compiled release APK required')
    apk = apks[0]
    sdk = Path(os.environ['ANDROID_HOME'])
    signer = sdk / 'build-tools/35.0.0/apksigner'
    signature = subprocess.check_output([str(signer), 'verify', '--verbose', '--print-certs', str(apk)], text=True)
    fingerprints = certificate_fingerprints(signature)
    if len(fingerprints) != 1:
        raise ValueError('Missing verified APK signing certificate')
    with zipfile.ZipFile(apk) as z:
        if len(z.namelist()) != len(set(z.namelist())):
            raise ValueError('Duplicate APK entries')
        receipt = json.loads(z.read('assets/toolbox.json'))
        if receipt['arch'] != args.arch or receipt['sourceCommit'] != os.environ['GITHUB_SHA']:
            raise ValueError('APK payload/source receipt mismatch')
        if not receipt['aptSignatureVerificationRequired'] or receipt['missingCommands']:
            raise ValueError('Full authenticated native payload is not present')
        spec = json.loads((ROOT/'tools/zshaolin-modern/inputs.json').read_text())
        bootstrap_hash = hashlib.sha256(z.read('assets/bootstrap.zip')).hexdigest()
        if bootstrap_hash != spec['bootstrap'][args.arch] or bootstrap_hash != receipt['bootstrapSha256']:
            raise ValueError('Packaged bootstrap differs from the pinned native input')
        security_assets = verify_security_assets(z)
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
    tests = android_test_results(ROOT/'apps/zshaolin-android/app/build/outputs/androidTest-results/connected',
                                 required=args.android_tests_required)
    name = f'zshaolin-modern-2.0.0-review-{receipt["abi"]}.apk'
    dest = work / name
    import shutil
    shutil.copyfile(apk, dest)
    report = {
        'schema': 1, 'sourceCommit': os.environ['GITHUB_SHA'], 'runId': os.environ['GITHUB_RUN_ID'],
        'sourceSha256': {name: sha(ROOT/name) for name in SOURCE_FILES},
        'apk': {'file': name, 'bytes': dest.stat().st_size, 'sha256': sha(dest),
                'applicationId': 'com.termux', 'versionName': '2.0.0-review', 'targetSdk': 28,
                'debuggable': False, 'abi': receipt['abi'], 'signerCertificateSha256': fingerprints[0]},
        'payload': receipt, 'packagedSecurityAssets': security_assets, 'androidInstrumentationSuites': tests,
        'testedOnAndroid13X86Emulator': args.arch == 'x86_64' and bool(tests),
        'android13EmulatorOfflineInstallVerified': offline_verified,
        'testedOnPhysicalSamsung': False,
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
