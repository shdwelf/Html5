#!/usr/bin/env python3
"""Supplemental, offline-only r@@t0r search using the measured ISO reader.

The historical scanner and its evidence stay byte-identical. A fresh in-memory
module adds this one owner-requested literal to its candidate/path selection.
Only fixed-literal counts and bounded matching-file metadata leave this wrapper;
its temporary full report is redacted by the original scanner and then deleted.
This does not try a password, decrypt data or authenticate against any endpoint.
"""
from datetime import datetime, timezone
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import sys
import tempfile

CANDIDATE = 'r@@t0r'
MAX_MATCHING_FILE_METADATA = 16
MAX_REPORT_BYTES = 16000
ENCODINGS = ('utf8', 'utf16le', 'utf16be')
BOUNDARY_FLAGS = ('booted', 'mounted', 'installed', 'executedImageFiles',
                  'connectedToVpn', 'credentialsUsed')


def load_inspector():
    path = Path(__file__).with_name('inspect-iso.py')
    spec = importlib.util.spec_from_file_location('kodachi_supplemental_reader', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def summarize(report, original_literals):
    """No arbitrary file contents, auth-field values or contexts are exported."""
    for flag in BOUNDARY_FLAGS:
        if report.get(flag) is not False:
            raise ValueError('Missing or violated no-execution/authentication boundary')
    records = report['files']
    if report['counts'].get('scannedFiles', 0) != len(records):
        raise ValueError('Full candidate scan and record counts disagree')
    results = {}
    for literal in (*original_literals, CANDIDATE):
        matches = [item for item in records if literal in item.get('requestedLiteralMatches', {})]
        result = {'matchingScannedFiles': len(matches)}
        for encoding in ENCODINGS:
            key = encoding + 'SubstringOccurrences'
            result[key] = sum(item.get('requestedLiteralMatches', {}).get(literal, {}).get(key, 0) for item in records)
        result['standaloneAsciiOccurrences'] = sum(item.get('requestedLiteralMatches', {}).get(literal, {}).get('standaloneAsciiOccurrences', 0) for item in records)
        result['literalRoleUnproven'] = True
        result['workingVpnCredentialProven'] = False
        results[literal] = result
    matching = [item for item in records if CANDIDATE in item.get('requestedLiteralMatches', {})]
    metadata = [{key: item[key] for key in ('layer', 'path', 'kind', 'bytesRead', 'sha256')} for item in matching[:MAX_MATCHING_FILE_METADATA]]
    summary = {
        'schema': 1,
        'kind': 'supplemental-kodachi-fixed-literal-search',
        'supplementalLiteral': CANDIDATE,
        'originalRequestedLiterals': list(original_literals),
        'literalSelectionOverride': 'A fresh loaded scanner module appends only the supplemental literal; historical scanner bytes/evidence are unchanged. Candidate paths may additionally match this literal.',
        'encodings': ['UTF-8', 'UTF-16LE', 'UTF-16BE'],
        'iso': report['iso'],
        'layers': report['layers'],
        'counts': report['counts'],
        'bytesRead': report['bytesRead'],
        'limits': report['limits'],
        'skippedCount': len(report['skipped']),
        'skippedExamples': report['skipped'][:8],
        'requestedLiteralSearch': results,
        'supplementalMatchingFileMetadata': metadata,
        'supplementalMatchingFileMetadataOmitted': max(0, len(matching) - len(metadata)),
        'inspectedAtRunnerClock': report['inspectedAtRunnerClock'],
        'summaryAtRunnerClock': datetime.now(timezone.utc).isoformat(),
        'sourceCommit': report['sourceCommit'],
        'runId': report['runId'],
        'sourceSha256': {
            'tools/kodachi/search-candidate.py': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
            'tools/kodachi/inspect-iso.py': report['inspectionScriptSha256'],
            'tools/kodachi/inspect-requirements.txt': report['dependencyLockSha256'],
            'tools/kodachi/fetch-iso.py': hashlib.sha256(Path(__file__).with_name('fetch-iso.py').read_bytes()).hexdigest(),
        },
        **{flag: False for flag in BOUNDARY_FLAGS},
        'privateKeysPublished': False,
        'unknownCredentialValuesRedacted': True,
        'arbitraryStringsOrFileContentsPublished': False,
        'decryptionAttempted': False,
        'ghidraRerun': False,
        'passwordAuthenticationAttempted': False,
        'passwordAccepted': None,
        'passwordRejected': None,
        'workingVpnPasswordEstablished': False,
        'noMatchProvesAbsenceFromEntireIsoOrRuntime': False,
        'scope': report['scope'],
        'limitations': 'Literal byte search only, not a password verifier, hash comparison, decryption, provider login or new Ghidra analysis. Same bounded candidate policy plus the supplemental literal in paths; not every ISO byte, skipped file, nested archive, unloaded memory or runtime-downloaded/derived state.',
    }
    if len((json.dumps(summary, separators=(',', ':')) + '\n').encode()) > MAX_REPORT_BYTES:
        raise ValueError('Supplemental metadata exceeds bounded transport')
    return summary


def main(iso_path, output):
    if output.exists() or output.is_symlink():
        raise ValueError('Use a fresh supplemental report path')
    review = load_inspector()
    original = tuple(review.REQUESTED_LITERALS)
    if CANDIDATE in original:
        raise ValueError('Historical scanner already includes the supplemental literal; review provenance before reuse')
    review.REQUESTED_LITERALS = (*original, CANDIDATE)
    # TemporaryDirectory is private; no ISO members are extracted. The original
    # main verifies the original ISO size/SHA-256/SHA-512 before reading it.
    with tempfile.TemporaryDirectory(prefix='kodachi-fixed-literal-') as directory:
        full_path = Path(directory) / 'redacted-full-report.json'
        review.main(iso_path, full_path)
        report = json.loads(full_path.read_text())
        result = summarize(report, original)
    output.parent.mkdir(parents=True, exist_ok=True)
    fd = os.open(output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'w') as stream:
        stream.write(json.dumps(result, separators=(',', ':')) + '\n')
    print('Supplemental fixed-literal search completed; no authentication or decryption attempted.', flush=True)
    return result


if __name__ == '__main__':
    if len(sys.argv) != 3:
        raise SystemExit('usage: search-candidate.py PINNED_ORIGINAL_ISO FRESH_REPORT_JSON')
    main(Path(sys.argv[1]).absolute(), Path(sys.argv[2]).absolute())
