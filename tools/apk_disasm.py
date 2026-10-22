#!/usr/bin/env python3
"""Deep static disassembly inventory for APKs — JADX source analysis,
native-library string/symbol census, and a bounded Ghidra headless pass
(CryptoInventory.java) over each app's largest native library.

Focus: the API surface and the *encryption posture* — cipher
transformations (ECB flags), digest/KDF choices, TLS trust behaviour,
hard-coded key material candidates, Tor/crypto library versions.
Endpoint reporting stays at registrable-domain level and REST paths are
counted, never printed verbatim (operational detail withheld by design).

Static only: decompilers read the sample; nothing is installed, run,
emulated or patched. Best-effort: every phase degrades to a note.

Usage: python3 tools/apk_disasm.py app.apk [more.apk ...]
Writes docs/zlib-apk-triage/disasm-<apk-stem>.md per sample.
Env: JADX (jadx binary), GHIDRA_HOME (install dir), WORK (scratch dir).
"""

import collections
import os
import pathlib
import re
import subprocess
import sys
import zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'docs' / 'zlib-apk-triage'
WORK = pathlib.Path(os.environ.get('WORK', '/tmp/apk-disasm'))


def sh(cmd, timeout=900):
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return r.returncode, (r.stdout or '') + (r.stderr or '')
    except Exception as e:  # noqa: BLE001
        return 1, f'(failed: {e})'


def regdom(host: str) -> str:
    parts = host.lower().strip('.').split('.')
    return '.'.join(parts[-2:]) if len(parts) >= 2 else host.lower()


def jadx_phase(apk: pathlib.Path, lines: list) -> pathlib.Path | None:
    jadx = os.environ.get('JADX', 'jadx')
    dest = WORK / (apk.stem + '-jadx')
    rc, out = sh([jadx, '-d', str(dest), '--no-res', '-j', '4', str(apk)], timeout=1800)
    srcs = list(dest.rglob('*.java')) if dest.exists() else []
    lines += ['## JADX decompilation', '',
              f'- Exit {rc}; Java sources recovered: {len(srcs)} files']
    if not srcs:
        lines += ['- (no sources — JADX unavailable or failed)', '']
        return None
    blob = ''
    pkg_tally = collections.Counter()
    for f in srcs:
        try:
            t = f.read_text(encoding='utf-8', errors='replace')
        except Exception:  # noqa: BLE001
            continue
        blob += t + '\n'
        m = re.search(r'^\s*package\s+([\w.]+);', t, re.M)
        if m:
            pkg_tally['.'.join(m.group(1).split('.')[:3])] += 1
    lines += [f'- Top packages: ' + ', '.join(f'`{p}` ×{c}' for p, c in pkg_tally.most_common(8)), '']

    def hits(pat, flags=0):
        return re.findall(pat, blob, flags)

    lines += ['### API surface (paths counted, never printed)', '']
    ann = re.findall(r'@(GET|POST|PUT|DELETE|PATCH)\("([^"]+)"\)', blob)
    cnt = collections.Counter(m for m, _ in ann)
    segs = collections.Counter('/'.join(p.split('/')[:2]) for _, p in ann)
    baseurls = collections.Counter(('<redacted>.onion' if h.endswith('.onion') else regdom(h))
                                   for h in re.findall(r'baseUrl\("https?://([\w.\-]+)', blob))
    lines += [f'- Retrofit-style endpoints declared: {len(ann)} '
              f'({", ".join(f"{k} {v}" for k, v in sorted(cnt.items())) or "none"})',
              f'- First-segment groups: ' + (', '.join(f'`{s}` ×{c}' for s, c in segs.most_common(8)) or '—'),
              f'- baseUrl() hosts: ' + (', '.join(f'`{d}` ×{c}' for d, c in baseurls.most_common(8)) or '—'),
              f'- Authorization-header constructions: {len(re.findall(r"[Aa]uthorization", blob))} refs; '
              f'Bearer literals: {len(re.findall(r"Bearer ", blob))}; '
              f'API-key header refs: {len(re.findall(r"[Xx]-[Aa]pi-[Kk]ey", blob))}', '']

    lines += ['### Encryption & transport posture', '']
    ciphers = collections.Counter(re.findall(r'Cipher\.getInstance\("([^"]+)"\)', blob))
    digests = collections.Counter(re.findall(r'MessageDigest\.getInstance\("([^"]+)"\)', blob))
    lines += ['- Cipher transformations: ' + (', '.join(f'`{k}` ×{v}' for k, v in ciphers.most_common()) or 'none found'),
              '- Message digests: ' + (', '.join(f'`{k}` ×{v}' for k, v in digests.most_common()) or 'none found')]
    ecb = [k for k in ciphers if 'ECB' in k.upper()]
    lines.append(f'- ⚠ ECB-mode ciphers: {ecb}' if ecb else '- ECB-mode ciphers: none found ✓')
    weak = [k for k in digests if k.upper() in ('MD5', 'SHA1', 'SHA-1')]
    lines.append(f'- Legacy digests (MD5/SHA-1): {weak or "none"}')
    lines += [f'- PBKDF2 / scrypt / bcrypt / Argon refs: {len(re.findall(r"PBKDF2|SCrypt|BCrypt|Argon2", blob))}; '
              f'SecretKeySpec literals: {len(re.findall(r"SecretKeySpec", blob))}; '
              f'hard-coded IV candidates (IvParameterSpec with literal): {len(re.findall(r"IvParameterSpec\(new byte", blob))}',
              f'- Android Keystore refs: {len(re.findall(r"AndroidKeyStore", blob))}; '
              f'EncryptedSharedPreferences refs: {len(re.findall(r"EncryptedSharedPreferences", blob))}; '
              f'plain SharedPreferences files: {len(re.findall(r"getSharedPreferences", blob))}', '']
    lines += ['### TLS trust behaviour', '']
    tm = re.findall(r'class\s+(\w+)\s+implements\s+X509TrustManager', blob)
    permissive = len(re.findall(r'checkServerTrusted\([^)]*\)\s*\{\s*\}', blob))
    hv = len(re.findall(r'HostnameVerifier|ALLOW_ALL_HOSTNAME', blob))
    lines += [f'- Custom X509TrustManager classes: {tm or "none"}; empty checkServerTrusted bodies: {permissive}',
              f'- HostnameVerifier refs: {hv}; CertificatePinner refs: {len(re.findall(r"CertificatePinner", blob))}; '
              f'SSLContext inits: {len(re.findall(r"SSLContext\.getInstance", blob))}',
              f'- WebView JS interfaces: {len(re.findall(r"addJavascriptInterface", blob))}; '
              f'cleartext http:// literals: {len(re.findall(r"http://", blob))}', '']
    b64 = re.findall(r'"([A-Za-z0-9+/]{40,}={0,2})"', blob)
    lines += ['### Hard-coded secret candidates', '',
              f'- Long base64-looking string literals (≥40 chars): {len(b64)} '
              '(count only — values withheld; most are assets/fonts in practice)',
              f'- "api_key"/"secret"/"token" constant assignments: '
              f'{len(re.findall(r"(?i)(api[_-]?key|secret|token)\"\s*,?\s*\"[^\"]{8,}", blob))}', '']
    return dest


def native_phase(apk: pathlib.Path, lines: list) -> list:
    z = zipfile.ZipFile(apk)
    sos = sorted((n for n in z.namelist() if n.startswith('lib/') and n.endswith('.so')),
                 key=lambda n: -z.getinfo(n).file_size)
    lines += ['## Native libraries', '', f'- .so files: {len(sos)}']
    ext = WORK / (apk.stem + '-so')
    ext.mkdir(parents=True, exist_ok=True)
    largest = []
    for n in sos[:14]:
        p = ext / pathlib.Path(n).name
        if not p.exists():
            p.write_bytes(z.read(n))
        _, strings = sh(['strings', str(p)], timeout=120)
        vers = sorted(set(re.findall(r'(OpenSSL\s+[\d.]+[a-z]*|BoringSSL|Tor\s+[\d.]+|tor[/ ][\d.]+|SQLite\s+[\d.]+|libcurl/[\d.]+)', strings)))
        crypto = len(re.findall(r'\b(EVP_\w+|AES_\w+|RSA_\w+|EC_KEY\w*|SHA256_\w+|HMAC\w*)\b', strings))
        lines.append(f'- `{n}` ({z.getinfo(n).file_size:,} B) — versions: {vers or "—"}; crypto-symbol strings: {crypto}')
        largest.append(p)
    lines.append('')
    return largest


def ghidra_phase(so: pathlib.Path, lines: list, stem: str = 'app'):
    home = os.environ.get('GHIDRA_HOME', '')
    headless = pathlib.Path(home) / 'support' / 'analyzeHeadless'
    lines += [f'## Ghidra headless — `{so.name}`', '']
    if not headless.exists():
        lines += ['- (analyzeHeadless not available on this runner)', '']
        return
    report = WORK / f'ghidra-report-{stem}.txt'
    proj = WORK / 'gproj'
    proj.mkdir(parents=True, exist_ok=True)
    rc, out = sh([str(headless), str(proj), 'ApkNat', '-import', str(so),
                  '-scriptPath', str(ROOT / 'tools' / 'ghidra_scripts'),
                  '-postScript', 'CryptoInventory.java', str(report),
                  '-deleteProject', '-analysisTimeoutPerFile', '1200'], timeout=1700)
    body = report.read_text(errors='replace') if report.exists() else ''
    keep = [ln for ln in body.splitlines() if ln.startswith('GHIDRA-')][:80]
    tail = [ln for ln in out.splitlines() if ln.strip()][-12:]
    lines += [f'- analyzeHeadless exit {rc}; report lines: {len(keep)}', '']
    lines += ['```'] + (keep or ['(no GHIDRA-REPORT lines produced)']) + ['```', '',
              '<details><summary>analyzeHeadless log tail</summary>', '', '```'] + tail + ['```', '', '</details>', '']


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    WORK.mkdir(parents=True, exist_ok=True)
    for arg in sys.argv[1:]:
        apk = pathlib.Path(arg)
        lines = [f'# Deep disassembly — {apk.name}', '',
                 'Static disassembly inventory (JADX + strings + Ghidra). Nothing executed.', '']
        jadx_phase(apk, lines)
        largest = native_phase(apk, lines)
        targets = list(largest[:1])
        app_so = [t for t in largest if t.name == 'libapp.so']
        if app_so and app_so[0] not in targets:
            targets.append(app_so[0])  # Flutter/Dart AOT core (sample B)
        for t in targets:
            ghidra_phase(t, lines, apk.stem)
        out = OUT / f'disasm-{apk.stem}.md'
        out.write_text('\n'.join(lines) + '\n', encoding='utf-8')
        print(f'wrote {out}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
