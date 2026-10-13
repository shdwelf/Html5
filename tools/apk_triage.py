#!/usr/bin/env python3
"""Static APK triage — facts only, never executes the sample.

For each APK: sha256/size pin, ZIP census, signing certificate (androguard /
keytool), manifest identity (package, versions, SDK range), permission audit
with a dangerous-permission watchlist, component census, hard-coded endpoint
extraction from DEX/native/assets (registrable domains only — URL paths and
query strings are withheld by design), third-party SDK fingerprints, and
dynamic-code / abuse indicator string hits.

Usage: python3 tools/apk_triage.py app.apk [more.apk ...]
Writes docs/zlib-apk-triage/<apk-stem>.md and a combined SUMMARY.md.
Runs fully offline; stdlib only, androguard/keytool used if present.
"""

import collections
import hashlib
import pathlib
import re
import subprocess
import sys
import zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'docs' / 'zlib-apk-triage'

DANGEROUS = {
    'android.permission.SEND_SMS', 'android.permission.READ_SMS',
    'android.permission.RECEIVE_SMS', 'android.permission.READ_CONTACTS',
    'android.permission.READ_CALL_LOG', 'android.permission.RECORD_AUDIO',
    'android.permission.CAMERA', 'android.permission.ACCESS_FINE_LOCATION',
    'android.permission.READ_PHONE_STATE', 'android.permission.SYSTEM_ALERT_WINDOW',
    'android.permission.REQUEST_INSTALL_PACKAGES', 'android.permission.BIND_ACCESSIBILITY_SERVICE',
    'android.permission.READ_EXTERNAL_STORAGE', 'android.permission.WRITE_EXTERNAL_STORAGE',
    'android.permission.MANAGE_EXTERNAL_STORAGE', 'android.permission.READ_MEDIA_IMAGES',
    'android.permission.QUERY_ALL_PACKAGES', 'android.permission.RECEIVE_BOOT_COMPLETED',
    'android.permission.FOREGROUND_SERVICE', 'android.permission.WAKE_LOCK',
    'android.permission.GET_ACCOUNTS', 'android.permission.READ_DEVICE_CONFIG',
}

INDICATORS = {
    'dynamic code loading (DexClassLoader/PathClassLoader)': rb'DexClassLoader|PathClassLoader|InMemoryDexClassLoader',
    'process exec (Runtime.exec / ProcessBuilder)': rb'Runtime;->exec|ProcessBuilder',
    'native library loading (loadLibrary)': rb'loadLibrary|System;->load',
    'device identifiers (IMEI/Android ID)': rb'getDeviceId|getImei|ANDROID_ID|getSubscriberId',
    'SMS sending API': rb'sendTextMessage|sendMultipartTextMessage',
    'accessibility abuse surface': rb'AccessibilityService|BIND_ACCESSIBILITY',
    'crypto-mining markers (stratum/monero/xmrig)': rb'stratum\+tcp|monero|xmrig|RandomX',
    'reflection into hidden APIs': rb'setAccessible|forName\(.*android\.os\.SystemProperties',
    'credential-form WebView flags (JS + file access)': rb'setJavaScriptEnabled|setAllowFileAccessFromFileURLs',
    'Tor / onion routing': rb'\.onion|Orbot|tor-android',
    'payment SDKs (card capture surface)': rb'stripe|Stripe|braintree|Braintree|adyen|Adyen',
}

SDK_FINGERPRINTS = {
    'Firebase (Google)': ['com/google/firebase', 'firebase'],
    'Google Play Services / Ads': ['com/google/android/gms', 'admob'],
    'Sentry crash reporting': ['io/sentry'],
    'OkHttp / Okio networking': ['okhttp3', 'okio'],
    'Retrofit': ['retrofit2'],
    'Kotlin runtime': ['kotlin/'],
    'Flutter engine': ['io/flutter', 'libflutter.so'],
    'React Native': ['com/facebook/react', 'libreactnative'],
    'AppMetrica / ad mediation': ['io/appmetrica', 'com/yandex'],
    'Unity engine': ['com/unity3d', 'libunity.so'],
    'Tor (guardianproject)': ['info/guardianproject'],
}

SEIZED = {  # publicly reported DOJ/FBI seizures 2022-2024 (Wikipedia/TorrentFreak)
    'z-lib.org', 'b-ok.org', '3lib.net', 'z-lib.se', 'z-library.se',
    'zlibrary-global.se', 'singlelogin.se', 'z-library.sx',
}


def regdom(host: str) -> str:
    parts = host.lower().strip('.').split('.')
    return '.'.join(parts[-2:]) if len(parts) >= 2 else host.lower()


def keytool_cert(apk: pathlib.Path) -> str:
    try:
        r = subprocess.run(['keytool', '-printcert', '-jarfile', str(apk)],
                           capture_output=True, text=True, timeout=60)
        out = (r.stdout or '') + (r.stderr or '')
        keep = [ln.strip() for ln in out.splitlines()
                if any(k in ln for k in ('Owner:', 'Issuer:', 'Serial number:',
                                          'Valid from:', 'SHA1:', 'SHA256:', 'Signature algorithm'))]
        return '\n'.join(keep) if keep else '(keytool returned no certificate block)'
    except Exception as e:  # noqa: BLE001
        return f'(keytool unavailable: {e})'


def triage(apk: pathlib.Path) -> str:
    data_head = apk.read_bytes()
    sha = hashlib.sha256(data_head).hexdigest()
    md5 = hashlib.md5(data_head).hexdigest()
    lines = [f'# APK triage — {apk.name}', '',
             f'- File: `{apk.name}`', f'- Size: {apk.stat().st_size:,} bytes',
             f'- SHA-256: `{sha}`', f'- MD5: `{md5}`',
             '- Method: static only — ZIP census, manifest decode, string/IOC extraction. Nothing installed or executed.', '']

    z = zipfile.ZipFile(apk)
    names = z.namelist()
    dex = [n for n in names if re.fullmatch(r'classes\d*\.dex', n)]
    libs = [n for n in names if n.startswith('lib/')]
    assets = [n for n in names if n.startswith('assets/')]
    lines += ['## ZIP census', '',
              f'- Entries: {len(names)} · DEX files: {len(dex)} ({", ".join(dex) or "none"}) · '
              f'native libs: {len(libs)} · assets: {len(assets)}',
              f'- ABIs: {sorted({n.split("/")[1] for n in libs if "/" in n[4:]}) or "none"}', '']

    pkg = ver_name = ver_code = min_sdk = target_sdk = app_label = None
    perms, activities, services, receivers, providers = [], [], [], [], []
    cert_fps, sig_schemes = [], []
    try:
        from androguard.core.apk import APK
        a = APK(str(apk))
        pkg, ver_name, ver_code = a.get_package(), a.get_androidversion_name(), a.get_androidversion_code()
        min_sdk, target_sdk = a.get_min_sdk_version(), a.get_target_sdk_version()
        app_label = a.get_app_name()
        perms = a.get_permissions() or []
        activities, services = a.get_activities() or [], a.get_services() or []
        receivers, providers = a.get_receivers() or [], a.get_providers() or []
        for cert in a.get_certificates():
            cert_fps.append(hashlib.sha256(cert.dump()).hexdigest())
        try:
            sig_schemes = [s for s, ok in (('v1', a.is_signed_v1()), ('v2', a.is_signed_v2()), ('v3', a.is_signed_v3())) if ok]
        except Exception:  # noqa: BLE001
            pass
    except Exception as e:  # noqa: BLE001
        lines += [f'> Manifest decode via androguard failed: {e}', '']

    lines += ['## Identity', '',
              f'- Package: `{pkg}` · app label: {app_label!r}',
              f'- Version: {ver_name} (code {ver_code}) · SDK min/target: {min_sdk} / {target_sdk}',
              f'- Signing schemes: {", ".join(sig_schemes) or "unknown"}',
              f'- Cert SHA-256 (androguard): {cert_fps or "—"}', '',
              '```', keytool_cert(apk), '```', '']

    flagged = sorted(set(perms) & DANGEROUS)
    lines += ['## Permissions', '',
              f'- Declared: {len(perms)} · watchlist hits: {len(flagged)}', '']
    lines += [f'- ⚠ `{p}`' for p in flagged] or ['- (none of the dangerous watchlist)']
    lines += ['', '<details><summary>All permissions</summary>', '']
    lines += [f'- `{p}`' for p in sorted(perms)] + ['', '</details>', '']

    lines += ['## Components', '',
              f'- Activities: {len(activities)} · services: {len(services)} · receivers: {len(receivers)} · providers: {len(providers)}',
              f'- Main activity: {(a.get_main_activity() if 'a' in dir() else None) or (activities[:1])}', '']

    # --- string / IOC extraction over DEX + native + assets (bounded reads) ---
    blob = b''
    for n in dex + libs + assets:
        try:
            info = z.getinfo(n)
            if info.file_size <= 60_000_000:
                blob += z.read(n) + b'\n'
        except Exception:  # noqa: BLE001
            pass
    urls = re.findall(rb'https?://([A-Za-z0-9.\-]+)', blob)
    bare = re.findall(rb'(?<![\w.])([a-z0-9\-]+\.(?:com|net|org|io|se|sk|sx|me|is|to|info|online|site|app|dev|cloud|su|rs|gl|cc|xyz|top|fun|club|live|store|pro|solutions|today|world|life|ink|fun|vip|one|icu)(?::\d+)?)', blob)
    dom_count = collections.Counter()
    for h in urls:
        dom_count[regdom(h.decode('ascii', 'replace'))] += 1
    for h in bare:
        dom_count[regdom(h.decode('ascii', 'replace').split(':')[0])] += 1
    known_infra = {'googleapis.com', 'gstatic.com', 'google.com', 'android.com', 'schemas.android.com',
                   'w3.org', 'apache.org', 'github.com', 'mozilla.org', 'chromium.org'}
    endpoint_rows = [(d, c) for d, c in dom_count.most_common() if d not in known_infra]
    lines += ['## Hard-coded endpoints (registrable domains; paths withheld)', '',
              '| Domain | Refs | Note |', '| --- | ---: | --- |']
    for d, c in endpoint_rows[:40]:
        note = '⚖ reported seized 2022–2024' if d in SEIZED else ''
        lines.append(f'| `{d}` | {c} | {note} |')
    lines += ['', f'Total distinct non-infra domains: {len(endpoint_rows)}', '']

    lines += ['## SDK / library fingerprints', '']
    namestr = '\n'.join(names).encode() + blob[:5_000_000]
    for label, needles in SDK_FINGERPRINTS.items():
        if any(n.encode() in namestr for n in needles):
            lines.append(f'- {label}')
    lines += ['', '## Abuse / capability indicators (string-level)', '']
    for label, pat in INDICATORS.items():
        n = len(re.findall(pat, blob))
        lines.append(f'- {"⚠" if n else "·"} {label}: {n} hit(s)')
    lines += ['', '## Analyst notes', '',
              '- Certificate comparison across samples and any APKPure repackaging '
              'assessment belong in the summary doc, written after all samples are triaged.']
    return '\n'.join(lines) + '\n'


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    written = []
    for arg in sys.argv[1:]:
        apk = pathlib.Path(arg)
        if not apk.exists():
            print(f'skip missing {apk}', file=sys.stderr)
            continue
        md = triage(apk)
        out = OUT / (apk.stem + '.md')
        out.write_text(md, encoding='utf-8')
        written.append(out.name)
        print(f'wrote {out}')
    (OUT / 'SUMMARY.md').write_text(
        '# APK triage summary\n\nStatic triage reports:\n\n' +
        ''.join(f'- [{w}]({w})\n' for w in written) +
        '\nCross-sample verdict (signer match, provenance, fake-vs-consistent) is '
        'recorded in `docs/zlibrary-apk-ghidra-research-2026-10-13.md`.\n',
        encoding='utf-8')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
