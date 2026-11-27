#!/usr/bin/env python3
"""Inspect public historical Cydia bytes; never install, execute or decrypt them."""
import argparse
import base64
import hashlib
import io
import json
import os
from pathlib import Path, PurePosixPath
import struct
import subprocess
import tarfile
import urllib.request
import zipfile
import zlib

ROOT = Path(__file__).resolve().parents[2]
SPEC = json.loads((ROOT/'tools/cydia-static-review/inputs.json').read_text())
WORK = Path(os.environ.get('RUNNER_TEMP', ROOT/'build'))/'cydia-static-review'
MAX_NATIVE = 16 * 1024 * 1024
THIN = {b'\xce\xfa\xed\xfe': ('<', 32), b'\xcf\xfa\xed\xfe': ('<', 64),
        b'\xfe\xed\xfa\xce': ('>', 32), b'\xfe\xed\xfa\xcf': ('>', 64)}
FAT = {b'\xca\xfe\xba\xbe': ('>', False), b'\xbe\xba\xfe\xca': ('<', False),
       b'\xca\xfe\xba\xbf': ('>', True), b'\xbf\xba\xfe\xca': ('<', True)}


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def download(url, maximum, expected_sha=None):
    if not url.startswith('https://'):
        raise ValueError('HTTPS required')
    with urllib.request.urlopen(url, timeout=120) as response:
        if not response.geturl().startswith('https://'):
            raise ValueError('Non-HTTPS redirect rejected')
        raw = response.read(maximum + 1)
    if len(raw) > maximum or (expected_sha and sha(raw) != expected_sha):
        raise ValueError('Public input exceeds bound or pinned SHA-256 mismatch')
    return raw


def thin_metadata(raw):
    if len(raw) < 28 or raw[:4] not in THIN:
        raise ValueError('Unrecognized or truncated Mach-O header')
    endian, bits = THIN[raw[:4]]
    header = 32 if bits == 64 else 28
    if len(raw) < header:
        raise ValueError('Truncated Mach-O header')
    _, cpu, subtype, filetype, count, cmdbytes, flags = struct.unpack_from(endian+'7I', raw)
    if count > 4096 or cmdbytes > len(raw)-header:
        raise ValueError('Mach-O command table exceeds bounds')
    pos, end = header, header+cmdbytes
    encryption, signatures = [], []
    for _ in range(count):
        if pos+8 > end:
            raise ValueError('Truncated Mach-O load command')
        cmd, length = struct.unpack_from(endian+'2I', raw, pos)
        if length < 8 or length % 4 or pos+length > end:
            raise ValueError('Invalid Mach-O command size')
        if cmd in (0x21, 0x2c):
            if length != (24 if cmd == 0x2c else 20):
                raise ValueError('Invalid encryption-info command size')
            offset, size, cryptid = struct.unpack_from(endian+'3I', raw, pos+8)
            if offset+size > len(raw):
                raise ValueError('Encrypted range exceeds slice')
            encryption.append({'command': 'LC_ENCRYPTION_INFO_64' if cmd == 0x2c else 'LC_ENCRYPTION_INFO',
                               'offset': offset, 'bytes': size, 'cryptid': cryptid})
        if cmd == 0x1d:
            if length != 16:
                raise ValueError('Invalid code-signature command size')
            offset, size = struct.unpack_from(endian+'2I', raw, pos+8)
            if offset+size > len(raw):
                raise ValueError('Code-signature range exceeds slice')
            signatures.append({'offset': offset, 'bytes': size})
        pos += length
    if pos != end:
        raise ValueError('Mach-O command count/size disagreement')
    return {'cpuType': cpu, 'cpuSubtype': subtype, 'bits': bits, 'byteOrder': endian,
            'fileType': filetype, 'loadCommandCount': count, 'encryptionInfo': encryption,
            'nonzeroEncryptionCryptid': any(row['cryptid'] != 0 for row in encryption),
            'embeddedCodeSignatureRanges': signatures, 'codeSignatureCryptographicallyVerified': False,
            'sha256': sha(raw), 'bytes': len(raw)}


def native_slices(raw):
    if len(raw) > MAX_NATIVE:
        raise ValueError('Native input exceeds bound')
    if raw[:4] in THIN:
        return [(thin_metadata(raw), raw)]
    if len(raw) < 8 or raw[:4] not in FAT:
        raise ValueError('Expected a Mach-O or universal Mach-O binary')
    endian, wide = FAT[raw[:4]]
    count = struct.unpack_from(endian+'I', raw, 4)[0]
    width = 32 if wide else 20
    table_end = 8+count*width
    if count < 1 or count > 16 or table_end > len(raw):
        raise ValueError('Universal-binary table exceeds bounds')
    ranges, result = [], []
    for i in range(count):
        pos = 8+i*width
        if wide:
            cpu, subtype, offset, size, align, reserved = struct.unpack_from(endian+'2I2Q2I', raw, pos)
            if reserved:
                raise ValueError('Unexpected reserved fat-architecture value')
        else:
            cpu, subtype, offset, size, align = struct.unpack_from(endian+'5I', raw, pos)
        if (align > 31 or offset < table_end or size < 28 or offset+size > len(raw)
                or offset % (1 << align) or any(offset < b and offset+size > a for a, b in ranges)):
            raise ValueError('Invalid or overlapping universal-binary slice')
        ranges.append((offset, offset+size))
        part = raw[offset:offset+size]
        metadata = thin_metadata(part)
        if metadata['cpuType'] != cpu or metadata['cpuSubtype'] != subtype:
            raise ValueError('Universal and thin architecture disagree')
        result.append((dict(metadata, universalOffset=offset), part))
    return result


def matching_stanza(index):
    matches = []
    for stanza in index.decode('utf-8').split('\n\n'):
        fields = dict(line.split(': ', 1) for line in stanza.splitlines() if ': ' in line and not line[0].isspace())
        if all(fields.get(k) == str(v) for k, v in {'Package': 'cydia', 'Version': SPEC['cydia']['version'],
                'Architecture': 'iphoneos-arm'}.items()):
            matches.append(fields)
    if len(matches) != 1:
        raise ValueError('Historical Cydia index stanza missing or ambiguous')
    return matches[0]


def native_from_tar(archive):
    targets = []
    entries, expanded = 0, 0
    for member in archive:
        entries += 1
        expanded += member.size
        p = PurePosixPath(member.name)
        if (p.is_absolute() or '..' in p.parts or '\\' in member.name or len(member.name) > 4096 or
                entries > 20000 or expanded > 128*1024*1024):
            raise ValueError('Unsafe or oversized public-package archive')
        if str(p) == SPEC['cydia']['nativeEntry']:
            if not member.isfile() or member.size > MAX_NATIVE or targets:
                raise ValueError('Native entry is not one bounded regular file')
            targets.append(archive.extractfile(member).read())
    if len(targets) != 1:
        raise ValueError('Could not read exact Cydia native entry')
    return targets[0]


def prepare():
    for part in ['inputs', 'reports', 'logs', 'projects']:
        (WORK/part).mkdir(parents=True, exist_ok=True)
    pin = SPEC['cydia']
    index = download(pin['indexUrl'], 3*1024*1024)
    fields = matching_stanza(index)
    if (fields.get('Filename') != 'debs/cydia_1.1.30_iphoneos-arm.deb' or
            fields.get('Size') != str(pin['bytes']) or fields.get('MD5sum') != pin['md5FromHttpsIndex']):
        raise ValueError('Selected index fields differ from the reviewed historical listing')
    package = download(pin['url'], pin['bytes'])
    if len(package) != pin['bytes'] or hashlib.md5(package, usedforsecurity=False).hexdigest() != pin['md5FromHttpsIndex']:
        raise ValueError('Historical package size/MD5 cross-check failed (MD5 is not authentication)')
    deb = WORK/'cydia_1.1.30_iphoneos-arm.deb'
    deb.write_bytes(package)
    # dpkg-deb merely streams archive payload, never dpkg --install or scripts.
    proc = subprocess.Popen(['dpkg-deb', '--fsys-tarfile', str(deb)], stdout=subprocess.PIPE)
    try:
        with tarfile.open(fileobj=proc.stdout, mode='r|') as archive:
            native = native_from_tar(archive)
        if proc.wait(timeout=60) != 0:
            raise ValueError('Public-package archive reader failed')
    finally:
        proc.stdout.close()
        if proc.poll() is None:
            proc.kill()
            proc.wait(timeout=10)
    selected = []
    slices = native_slices(native)
    for label, cpu in [('arm64', 0x100000c), ('arm', 12)]:
        candidates = [(m, b) for m, b in slices if m['cpuType'] == cpu]
        if not candidates:
            continue
        # Prefer ARMv7 over obsolete ARMv6 when the universal binary has both.
        metadata, data = max(candidates, key=lambda row: row[0]['cpuSubtype'] & 0xffffff)
        if metadata['nonzeroEncryptionCryptid']:
            raise ValueError('Encrypted Mach-O range detected; no decryption/bypass attempted')
        name = f'cydia-{label}.macho'
        (WORK/'inputs'/name).write_bytes(data)
        selected.append(dict(metadata, file=name, executed=False))
    if not selected:
        raise ValueError('No expected ARM Cydia slice found')
    acquisition = {'schema': 1, 'package': pin, 'indexSha256': sha(index),
                   'downloadedPackageSha256': sha(package), 'nativeEntrySha256': sha(native),
                   'nativeSlicesAvailable': [m for m, _ in slices], 'selectedSlices': selected,
                   'repositorySignatureChainVerified': False, 'publisherSignatureVerified': False,
                   'deviceDataAcquired': False, 'inputOrMaintainerScriptsExecuted': False}
    (WORK/'reports/acquisition.json').write_text(json.dumps(acquisition, indent=2)+'\n')
    ghidra = download(SPEC['ghidra']['url'], 700*1024*1024, SPEC['ghidra']['sha256'])
    with zipfile.ZipFile(io.BytesIO(ghidra)) as archive:
        for info in archive.infolist():
            p = PurePosixPath(info.filename)
            if p.is_absolute() or '..' in p.parts or '\\' in info.filename:
                raise ValueError('Unsafe pinned Ghidra distribution entry')
        archive.extractall(WORK)
        for info in archive.infolist():
            if info.external_attr >> 16 & 0o111:
                (WORK/info.filename).chmod(0o755)
    print('Public historical Cydia bytes measured; Mach-O headers checked; no package/native input executed.')


def summarize():
    acquisition = json.loads((WORK/'reports/acquisition.json').read_text())
    programs = []
    for item in acquisition['selectedSlices']:
        analysis = json.loads((WORK/'reports'/(item['file']+'.json')).read_text())
        if (analysis['inputSha256'] != item['sha256'] or analysis['ghidraVersion'] != SPEC['ghidra']['version'] or
                analysis['instructionsVisitedUpTo1000000'] <= 0 or analysis['functionsDefinedUpTo200000'] <= 0 or
                not any(x['completed'] for x in analysis['boundedDecompilations'])):
            raise ValueError('Missing or mismatched actual Cydia native analysis')
        if any(analysis[key] for key in ['inputExecuted', 'deviceDataDecrypted', 'jailbreakVerified', 'malwareFreeVerdict']):
            raise ValueError('Invalid device/security success claim')
        programs.append({'slice': item, 'analysis': analysis})
    control = json.loads((WORK/'reports/control.json').read_text())
    if control['instructionsVisitedUpTo1000000'] <= 0 or not any(x['completed'] for x in control['boundedDecompilations']):
        raise ValueError('Native decompiler positive control failed')
    source_paths = ['tools/cydia-static-review/inputs.json', 'tools/cydia-static-review/review.py',
                    'tools/ghidra_scripts/CydiaCryptoReview.java', '.github/workflows/cydia-static-review.yml']
    report = {'schema': 1, 'sourceCommit': os.environ.get('GITHUB_SHA'), 'runId': os.environ.get('GITHUB_RUN_ID'),
              'ghidra': SPEC['ghidra'], 'acquisition': acquisition, 'programs': programs,
              'syntheticPositiveControl': control, 'guardrails': SPEC['guardrails'],
              'sourceSha256': {p: sha((ROOT/p).read_bytes()) for p in source_paths},
              'conclusion': 'Bounded static observations of historical Cydia 1.1.30 Mach-O only. Not current jailbreak compatibility, recovered encryption keys, a whole-program audit, Samsung root or Secure Folder access.'}
    raw = (json.dumps(report, indent=2)+'\n').encode()
    packed = zlib.compress(raw, 9)
    if len(raw) > 128*1024 or len(packed) > 30000:
        raise ValueError('Evidence transport bound exceeded')
    (WORK/'reports/static-summary.json').write_bytes(raw)
    chunks = [base64.b64encode(packed[i:i+1800]).decode() for i in range(0, len(packed), 1800)]
    meta = {'bytes': len(raw), 'sha256': sha(raw), 'chunks': len(chunks),
            'sourceCommit': report['sourceCommit'], 'runId': report['runId']}
    print('::notice title=Cydia static evidence metadata::'+json.dumps(meta, separators=(',', ':')))
    for i, chunk in enumerate(chunks):
        print(f'::notice title=Cydia static evidence zlib {i+1} of {len(chunks)}::{chunk}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('stage', choices=['prepare', 'summarize'])
    args = parser.parse_args()
    {'prepare': prepare, 'summarize': summarize}[args.stage]()
