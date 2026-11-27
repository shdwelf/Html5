#!/usr/bin/env python3
"""Static, bounded VPN/config inspection of the already-acquired, hash-pinned ISO.

No mount, boot, chroot, installer, extracted executable, network connection or
credential use. ISO/SquashFS readers operate on file streams. Unknown credential
values and private keys are never put in the public report or CI annotations.
"""
from collections import Counter
from datetime import datetime, timezone
import hashlib
import importlib.util
import json
import os
from pathlib import Path, PurePosixPath
import re
import shlex
import struct
import sys

MAX_ENTRIES = 700000
MAX_DEPTH = 64
MAX_CANDIDATES = 20000
MAX_CONFIG_BYTES = 8 * 1024 * 1024
MAX_BINARY_BYTES = 64 * 1024 * 1024
MAX_TOTAL_BYTES = 768 * 1024 * 1024
MAX_FINDINGS = 100
KNOWN_OS_DEFAULTS = ('r@@t00', 'Security4All')
REQUESTED_LITERALS = ('r00t0r', 'r00tor', 'r00t')
RUNTIME_ROOT = '/opt/kodachi/dashboard/hooks/'
PRIVATE_BLOCK = re.compile(r'<(?:key|tls-auth|tls-crypt|pkcs12)>.*?</(?:key|tls-auth|tls-crypt|pkcs12)>|-----BEGIN [^-]*(?:PRIVATE KEY|SECRET)[^-]*-----.*?-----END [^-]+-----', re.I | re.S)
ASSIGNMENT = re.compile(r'''(?im)^\s*(?:export\s+)?["']?([a-z_][\w.-]{0,127})["']?\s*(?:=|:)\s*([^\r\n]{0,1024})''')
INTEREST = re.compile(r'vpn|wireguard|cloak|auth|credential|password|provider', re.I)


def safe_path(value):
    if not isinstance(value, str) or len(value) > 4096 or not value.startswith('/') or '\0' in value:
        raise ValueError('Unsupported image path')
    if any(part in ('.', '..') for part in value.split('/')):
        raise ValueError('Image path traversal is not accepted')
    return value



def literal_matches(data):
    result = {}
    for literal in REQUESTED_LITERALS:
        matches = {}
        for label, encoding in [('utf8', 'utf-8'), ('utf16le', 'utf-16le'), ('utf16be', 'utf-16be')]:
            pattern = literal.encode(encoding)
            count = data.count(pattern)
            if count:
                matches[label + 'SubstringOccurrences'] = count
                if label == 'utf8':
                    matches['standaloneAsciiOccurrences'] = len(re.findall(rb'(?<![A-Za-z0-9_])' + re.escape(pattern) + rb'(?![A-Za-z0-9_])', data))
        if matches:
            result[literal] = matches
    return result


def reportable_reference(value):
    # Do not publish URL components or arbitrary slash-shaped strings/tokens.
    return value.startswith(('/etc/', '/run/', '/var/', '/home/', '/root/', '/opt/', '/usr/', '/tmp/', '/.config/', '/.ssh/'))


def candidate_kind(path):
    p = path.lower()
    name = PurePosixPath(p).name
    if any(literal in p for literal in REQUESTED_LITERALS):
        return 'requested-literal-path'
    if p.endswith(('.ovpn', '.wg')):
        return 'vpn-profile'
    if p.startswith(('/etc/openvpn/', '/etc/wireguard/', '/etc/networkmanager/system-connections/')) or '/own_vpn_config/' in p:
        return 'vpn-config'
    home = p.startswith('/home/kodachi/')
    kodachi = 'kodachi' in p and (not home or '/.config/kodachi' in p or name.startswith('kodachi'))
    if kodachi and (p.startswith(('/opt/', '/etc/', '/usr/', '/home/', '/root/')) or '/' not in p[1:]):
        if not p.endswith(('.png', '.jpg', '.jpeg', '.svg', '.webp', '.woff', '.woff2', '.ttf', '.mp4', '.ogg', '.wav', '.deb', '.so')):
            return 'kodachi-runtime-or-config'
    if INTEREST.search(p) and (p.startswith(('/etc/', '/usr/local/', '/home/kodachi/')) or '/' not in p[1:]) and (name.endswith(('.conf', '.json', '.ini', '.yaml', '.yml', '.toml', '.txt', '.sh', 'setup', 'auth', '.nmconnection')) or 'password' in name):
        return 'auth-or-vpn-reference'
    if p in ('/etc/os-release', '/usr/lib/os-release'):
        return 'os-release'
    return None


def credential_field(name):
    return bool(re.search(r'password|passwd|passphrase|username|user_name|credential|auth_token|api_key', name, re.I) or re.search(r'(?:^|[_-])(?:pass|pwd)(?:$|[_-])', name, re.I))


def reference_rank(value):
    runtime = value.startswith(('/etc/', '/run/', '/var/', '/home/', '/root/', '/opt/', '/usr/', '/tmp/', '/.config/'))
    source = '/.cargo/' in value or '/rustc/' in value or '/.rustup/' in value
    return (not runtime or source, not bool(re.search(r'vpn|wireguard|cloak|online-auth', value, re.I)), value)


def provider_templates(text):
    """Only type/states of provider API templates, never instantiated logins."""
    try:
        document = json.loads(text)
    except ValueError:
        return []
    found, stack, nodes = [], [('$', document, 0)], 0
    while stack:
        path, value, depth = stack.pop()
        nodes += 1
        if nodes > 65536 or depth > 32:
            raise ValueError('Provider metadata JSON bound exceeded')
        if isinstance(value, dict):
            for key, child in value.items():
                label = path + '.' + key[:80]
                if key == 'auth_user_pass_template':
                    record = {'jsonPath': label, 'type': type(child).__name__}
                    if isinstance(child, dict):
                        record['fields'] = {k: value_state(json.dumps(v)) for k, v in child.items() if credential_field(k)}
                    elif child is None:
                        record['state'] = 'no-template'
                    else:
                        record['state'] = value_state(json.dumps(child))['state']
                    found.append(record)
                if isinstance(child, (dict, list)):
                    stack.append((label, child, depth + 1))
        elif isinstance(value, list):
            stack.extend((path + '[' + str(i) + ']', child, depth + 1) for i, child in enumerate(value) if isinstance(child, (dict, list)))
    return found[:40]


def value_state(raw):
    value = raw.strip().rstrip(',').strip()
    quoted = value[:1] in ('"', "'") and value[-1:] == value[:1]
    if quoted:
        value = value[1:-1]
    elif ' #' in value:
        value = value.split(' #', 1)[0].strip()
    if not quoted:
        if value.lower() in ('true', 'false'):
            return {'state': 'boolean-not-credential', 'boolean': value.lower() == 'true'}
        if value in ('{', '[', '{}', '[]'):
            return {'state': 'structure-not-credential'}
        if re.fullmatch(r'[-+]?\d+(?:\.\d+)?', value):
            return {'state': 'numeric-configuration'}
        if any(token in value for token in ('(', ')', '[', ' * ', ' + ', ' == ', ' >= ')):
            return {'state': 'runtime-expression'}
    if not value:
        return {'state': 'empty'}
    if value.lower() in ('...', 'changeme', 'your_password', 'your_username', 'null', 'none', '<password>', '<username>') or re.fullmatch(r'<[^>]+>|\{\{.*\}\}', value):
        return {'state': 'placeholder'}
    if any(token in value for token in ('$', '`', 'await ', 'getenv', 'env::', 'read_password', 'args.')):
        return {'state': 'runtime-expression'}
    result = {'state': 'nonempty-literal', 'characters': len(value), 'valueRedacted': True}
    if value in KNOWN_OS_DEFAULTS:
        result['knownPublishedOsLoginDefault'] = value
        result['vpnPasswordProven'] = False
    return result


def inspect_content(path, data, kind):
    binary = data.startswith(b'\x7fELF') or b'\0' in data[:4096]
    result = {'path': safe_path(path), 'bytesRead': len(data), 'sha256': hashlib.sha256(data).hexdigest(), 'kind': kind, 'binary': binary}
    known = {value: data.count(value.encode()) for value in KNOWN_OS_DEFAULTS if value.encode() in data}
    if known:
        result['knownOsLoginLiteralOccurrences'] = known
    requested = literal_matches(data)
    if requested:
        result['requestedLiteralMatches'] = requested
        result['literalRoleUnproven'] = True
        result['workingVpnCredentialProven'] = False
    if data.startswith(b'\x7fELF'):
        result['binaryFormat'] = 'ELF'
    if binary:
        # Path references only, never arbitrary strings/keys or a claim that a
        # nearby "password" symbol is an embedded working VPN password.
        paths = set()
        for match in re.finditer(rb'/[A-Za-z0-9_./+~-]{4,240}', data):
            value = match[0].decode('ascii')
            if reportable_reference(value) and INTEREST.search(value) and len(value) < 240:
                paths.add(value)
            if len(paths) >= 2000:
                break
        result['pathReferences'] = sorted(paths, key=reference_rank)[:MAX_FINDINGS]
        result['passwordKeywordOccurrences'] = len(re.findall(rb'password|passwd|auth-user-pass', data, re.I))
        result['limitation'] = 'Static path/literal search, not decompilation, runtime tracing or a complete secret search.'
        return result
    text = data.decode('utf-8', errors='replace')
    # Preserve line numbers without retaining PEM/inline secret material.
    text = PRIVATE_BLOCK.sub(lambda m: '\n' * m[0].count('\n'), text)
    directives, assignments = [], []
    for index, line in enumerate(text.splitlines(), 1):
        if re.match(r'^\s*(auth-user-pass|askpass)\b', line, re.I):
            try:
                parts = shlex.split(line, comments=True)
            except ValueError:
                parts = []
            if parts:
                directives.append({'line': index, 'directive': parts[0], 'argument': parts[1] if len(parts) == 2 and len(parts[1]) <= 256 else None, 'interactiveOrInlineReviewNeeded': len(parts) != 2})
        match = ASSIGNMENT.match(line)
        if match and credential_field(match[1]) and len(assignments) < MAX_FINDINGS:
            assignments.append({'line': index, 'field': match[1], **value_state(match[2])})
    if path.endswith('vpn-providers-public-api.json'):
        result['providerAuthTemplates'] = provider_templates(text)
    if directives:
        result['authDirectives'] = directives[:MAX_FINDINGS]
    if assignments:
        result['credentialFields'] = assignments
    inline = re.search(r'<auth-user-pass>(.*?)</auth-user-pass>', text, re.I | re.S)
    if inline:
        result['inlineAuth'] = {'present': True, 'nonemptyLines': sum(bool(x.strip()) for x in inline[1].splitlines()), 'valuesRedacted': True}
    name = PurePosixPath(path.lower()).name
    if INTEREST.search(path) and any(token in name for token in ('auth', 'pass', 'credential', 'login', 'secret')) and len(data) <= 4096:
        lines = [x.strip() for x in text.splitlines() if x.strip() and not x.lstrip().startswith('#')]
        if 1 <= len(lines) <= 2 and not any(re.search(r'[={}<>]|\b(?:echo|cat|sudo|exec)\b', x) for x in lines):
            result['shortAuthFileCandidate'] = {'nonemptyLines': len(lines), 'lineStates': [value_state(x) for x in lines], 'valuesRedacted': True, 'workingCredentialProven': False}
    if kind == 'os-release':
        result['osRelease'] = {m[1]: m[2].strip('"') for line in text.splitlines() if (m := re.fullmatch(r'(ID|VERSION_ID|VERSION_CODENAME|PRETTY_NAME)=(.{0,200})', line))}
    # Report relevant literal paths rather than printing full configuration or
    # arbitrary context which can include private keys, tokens or auth values.
    reference_text = ASSIGNMENT.sub(lambda m: m[1] + '=<redacted>' if credential_field(m[1]) or re.search(r'private.?key|preshared.?key|secret', m[1], re.I) else m[0], text)
    reference_text = re.sub(r'<auth-user-pass>.*?</auth-user-pass>', '', reference_text, flags=re.I | re.S)
    if result.get('shortAuthFileCandidate'):
        reference_text = ''
    references = set(re.findall(r'/(?:[A-Za-z0-9_.+~-]+/)*[A-Za-z0-9_.+~-]+', reference_text))
    refs = sorted((x for x in references if reportable_reference(x) and INTEREST.search(x) and len(x) <= 240), key=reference_rank)
    if refs:
        result['pathReferences'] = refs[:MAX_FINDINGS]
    return result


def validated_superblock(stream):
    size = stream.seek(0, 2)
    stream.seek(0)
    raw = stream.read(96)
    if len(raw) != 96:
        raise ValueError('Truncated SquashFS superblock')
    values = struct.unpack('<5I6H8Q', raw)
    magic, inodes, _, block, fragments, compression, log, _, ids, major, _, root, used, id_table, xattr, inode_table, directory_table, fragment_table, lookup = values
    if magic != 0x73717368 or major != 4 or not 1 <= inodes <= MAX_ENTRIES or block < 4096 or block > 1048576 or block != 1 << log or fragments > MAX_ENTRIES or not 1 <= compression <= 6 or not 1 <= ids <= 65535:
        raise ValueError('Unsupported/bounded SquashFS metadata')
    if not 96 <= used <= size or any(offset != 0xffffffffffffffff and not 96 <= offset < used for offset in (id_table, xattr, inode_table, directory_table, fragment_table, lookup)):
        raise ValueError('SquashFS table outside its declared stream')
    stream.seek(0)
    return {'bytesUsed': used, 'streamBytes': size, 'inodes': inodes, 'blockBytes': block, 'compressionId': compression}


def walk_files(root):
    stack, seen, total = [('/', root, 0)], set(), 0
    while stack:
        base, node, depth = stack.pop()
        if depth > MAX_DEPTH:
            raise ValueError('Filesystem depth bound exceeded')
        identity = (node.block, node.offset)
        if identity in seen:
            raise ValueError('Repeated/cyclic directory inode')
        seen.add(identity)
        for child in node.iterdir():
            total += 1
            if total > MAX_ENTRIES:
                raise ValueError('Filesystem entry bound exceeded')
            if not child.name or '/' in child.name or child.name in ('.', '..'):
                raise ValueError('Invalid filesystem component')
            path = safe_path(base.rstrip('/') + '/' + child.name)
            if child.is_symlink():
                yield path, child, 'symlink'
            elif child.is_dir():
                stack.append((path, child, depth + 1))
            elif child.is_file():
                yield path, child, 'file'
            else:
                yield path, child, 'special'


def inspect_iso(iso_path):
    import pycdlib
    from dissect.squashfs import SquashFS
    iso = pycdlib.PyCdlib()
    iso.open(str(iso_path))
    results, counts, layers, skipped = [], Counter(), [], []
    total_read = 0
    try:
        key = 'rr_path' if iso.rock_ridge else 'joliet_path' if iso.joliet_vd else 'iso_path'
        images = []
        for base, directories, files in iso.walk(**{key: '/'}):
            if len(base.split('/')) > MAX_DEPTH:
                raise ValueError('ISO depth bound exceeded')
            for name in files:
                path = safe_path(base.rstrip('/') + '/' + name)
                counts['isoFiles'] += 1
                if counts['isoFiles'] > 20000:
                    raise ValueError('ISO entry bound exceeded')
                if re.search(r'\.squashfs(?:;\d+)?$', name, re.I):
                    images.append(path)
        if not 1 <= len(images) <= 16:
            raise ValueError('Expected one to sixteen SquashFS layers')
        for image in sorted(images):
            with iso.open_file_from_iso(**{key: image}) as stream:
                sb = validated_superblock(stream)
                fs = SquashFS(stream)
                layer = {'isoPath': image, **sb}
                layers.append(layer)
                for path, inode, entry_type in walk_files(fs.root):
                    counts[entry_type + 'Entries'] += 1
                    if entry_type != 'file':
                        continue  # Never follow links, read devices or execute anything.
                    kind = candidate_kind(path)
                    if not kind:
                        continue
                    counts['candidateFiles'] += 1
                    if counts['candidateFiles'] > MAX_CANDIDATES:
                        raise ValueError('Candidate-file bound exceeded')
                    size = inode.size
                    if size > MAX_BINARY_BYTES or total_read + min(size, MAX_BINARY_BYTES) > MAX_TOTAL_BYTES:
                        skipped.append({'layer': image, 'path': path, 'bytes': size, 'reason': 'declared file/total byte bound'})
                        continue
                    with inode.open() as file:
                        data = file.read(size)
                    if len(data) != size:
                        raise ValueError('Truncated filesystem file')
                    total_read += len(data)
                    binary = data.startswith(b'\x7fELF') or b'\0' in data[:4096]
                    if not binary and size > MAX_CONFIG_BYTES:
                        skipped.append({'layer': image, 'path': path, 'bytes': size, 'reason': 'configuration text byte bound'})
                        continue
                    record = inspect_content(path, data, kind)
                    record['layer'] = image
                    results.append(record)
                    counts['scannedFiles'] += 1
                    counts[kind] += 1
                    if counts['scannedFiles'] % 250 == 0:
                        print('Inspected', counts['scannedFiles'], 'candidate files;', total_read, 'bytes; no image execution.', flush=True)
    finally:
        iso.close()
    return {'schema': 1, 'layers': layers, 'counts': dict(counts), 'bytesRead': total_read, 'files': results, 'skipped': skipped,
            'scope': 'All listed regular-file paths classified; bounded configuration text and selected Kodachi runtime bytes only. No symlink/device reads, nested archives, runtime downloads, decryption or network/authentication tests.',
            'booted': False, 'mounted': False, 'installed': False, 'executedImageFiles': False, 'connectedToVpn': False, 'credentialsUsed': False,
            'unknownCredentialValuesRedacted': True, 'privateKeysPublished': False,
            'pathEncoding': 'Literal Linux image paths; JSON escapes control/non-UTF8 names. Never used as host extraction paths.',
            'limits': {'entries': MAX_ENTRIES, 'depth': MAX_DEPTH, 'candidateFiles': MAX_CANDIDATES, 'configBytes': MAX_CONFIG_BYTES, 'binaryBytes': MAX_BINARY_BYTES, 'totalBytes': MAX_TOTAL_BYTES}}


def preview_priority(record):
    path = record['path']
    if record.get('requestedLiteralMatches'):
        return -1, path
    if record['kind'] in ('vpn-profile', 'vpn-config'):
        rank = 0
    elif record.get('binary') and re.search(r'vpn|wireguard|cloak|online-auth', path, re.I):
        rank = 1
    elif record.get('providerAuthTemplates'):
        rank = 2
    elif re.search(r'vpn|wireguard|cloak|online-auth', path, re.I):
        rank = 3
    elif record.get('knownOsLoginLiteralOccurrences'):
        rank = 4
    elif record.get('osRelease'):
        rank = 5
    elif record.get('credentialFields') or record.get('shortAuthFileCandidate') or record.get('inlineAuth'):
        rank = 6
    else:
        rank = 7
    return rank, path


def preview(report):
    fields = Counter(field['state'] for item in report['files'] for field in item.get('credentialFields', []))
    configs = [f for f in report['files'] if f['kind'] in ('vpn-profile', 'vpn-config')]
    result = {k: v for k, v in report.items() if k not in ('files', 'skipped')}
    result['skippedCount'] = len(report.get('skipped', []))
    result['skippedExamples'] = report.get('skipped', [])[:8]
    result['credentialFieldStates'] = dict(fields)
    literal_candidates = [{'path': f['path'], 'line': field['line'], 'field': field['field'], 'state': field['state'], 'valueRedacted': True} for f in report['files'] for field in f.get('credentialFields', []) if field['state'] == 'nonempty-literal']
    result['credentialLiteralCandidatesCount'] = len(literal_candidates)
    result['credentialLiteralCandidates'] = literal_candidates[:8]
    result['configurationInventoryCount'] = len(configs)
    result['configurationInventory'] = [{k: f[k] for k in ('path', 'kind', 'bytesRead', 'sha256')} for f in configs[:8]]
    result['knownOsLoginLiteralTotals'] = {key: sum(f.get('knownOsLoginLiteralOccurrences', {}).get(key, 0) for f in report['files']) for key in KNOWN_OS_DEFAULTS}
    result['authenticationRecordCounts'] = {
        key: sum(bool(f.get(key)) for f in report['files'])
        for key in ('authDirectives', 'inlineAuth', 'shortAuthFileCandidate', 'providerAuthTemplates')
    }
    result['requestedLiteralSearch'] = {literal: {'matchingScannedFiles': sum(literal in f.get('requestedLiteralMatches', {}) for f in report['files']), 'utf8SubstringOccurrences': sum(f.get('requestedLiteralMatches', {}).get(literal, {}).get('utf8SubstringOccurrences', 0) for f in report['files']), 'standaloneAsciiOccurrences': sum(f.get('requestedLiteralMatches', {}).get(literal, {}).get('standaloneAsciiOccurrences', 0) for f in report['files']), 'roleUnproven': True, 'workingVpnCredentialProven': False} for literal in REQUESTED_LITERALS}
    runtime = [f for f in report['files'] if f.get('binaryFormat') == 'ELF' and f['path'].startswith(RUNTIME_ROOT) and '/' not in f['path'][len(RUNTIME_ROOT):]]
    result['runtimeBinaryInventoryCount'] = len(runtime)
    result['runtimeBinaryInventory'] = [{k: f[k] for k in ('path', 'bytesRead', 'sha256')} for f in runtime[:32]]
    template_states = Counter(field['state'] for f in report['files'] for item in f.get('providerAuthTemplates', []) for field in item.get('fields', {}).values())
    result['providerTemplateFieldStates'] = dict(template_states)
    result['providerTemplateStates'] = dict(Counter(item.get('state', 'field-object') for f in report['files'] for item in f.get('providerAuthTemplates', [])))
    result['previewFiles'] = []
    result['previewOnly'] = True
    if len(json.dumps(result, separators=(',', ':')).encode()) > 14000:
        raise ValueError('Preview metadata exceeds transport bound; use full redacted report')
    for original in sorted(report['files'], key=preview_priority):
        if preview_priority(original)[0] == 7:
            continue
        record = dict(original)
        for field, limit in [('pathReferences', 12), ('credentialFields', 12), ('providerAuthTemplates', 6)]:
            if field in record:
                record[field] = record[field][:limit]
                if len(original[field]) > limit:
                    record[field + 'OmittedFromPreview'] = len(original[field]) - limit
        result['previewFiles'].append(record)
        if len(json.dumps(result, separators=(',', ':')).encode()) > 14000:
            result['previewFiles'].pop()
            continue
    return result


def main(iso_path, output):
    spec = importlib.util.spec_from_file_location('kodachi_fetch_pins', Path(__file__).with_name('fetch-iso.py'))
    pins = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(pins)
    if output.exists():
        raise ValueError('Use a fresh report path')
    if iso_path.is_symlink() or not iso_path.is_file() or iso_path.stat().st_size != pins.EXPECTED_BYTES:
        raise ValueError('Not the pinned original ISO size/regular file')
    hashes = [hashlib.sha256(), hashlib.sha512()]
    with iso_path.open('rb') as stream:
        while data := stream.read(4 * 1024 * 1024):
            for digest in hashes:
                digest.update(data)
    if [h.hexdigest() for h in hashes] != [pins.EXPECTED_SHA256, pins.EXPECTED_SHA512]:
        raise ValueError('ISO hash mismatch; no inspection performed')
    print('Original ISO size, SHA-256 and SHA-512 reverified before static parsing.', flush=True)
    report = inspect_iso(iso_path)
    report['iso'] = {'name': pins.NAME, 'bytes': pins.EXPECTED_BYTES, 'sha256': pins.EXPECTED_SHA256, 'sha512': pins.EXPECTED_SHA512}
    report['inspectedAtRunnerClock'] = datetime.now(timezone.utc).isoformat()
    report['runId'] = os.environ.get('GITHUB_RUN_ID')
    report['sourceCommit'] = os.environ.get('GITHUB_SHA')
    report['inspectionScriptSha256'] = hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
    report['dependencyLockSha256'] = hashlib.sha256(Path(__file__).with_name('inspect-requirements.txt').read_bytes()).hexdigest()
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, indent=2) + '\n')
    small = output.with_name('vpn-inspection-preview.json')
    small.write_text(json.dumps(preview(report), separators=(',', ':')) + '\n')
    print('Static inspection completed:', json.dumps(report['counts']), '; skipped:', len(report['skipped']), flush=True)


if __name__ == '__main__':
    if len(sys.argv) != 3:
        raise SystemExit('usage: inspect-iso.py PINNED_ORIGINAL_ISO FRESH_REPORT_JSON')
    main(Path(sys.argv[1]).absolute(), Path(sys.argv[2]).absolute())
