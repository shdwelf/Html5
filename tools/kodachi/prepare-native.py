#!/usr/bin/env python3
"""Prepare two flat, non-executable data copies for authorized native Ghidra.

The normal scanner rehashes the pinned original ISO first. Copies are limited to
these two literal paths; no filesystem tree, symlink resolution or image-file
execution is performed. Nothing raw is published by the paired workflow.
"""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import struct
import sys

spec = importlib.util.spec_from_file_location('kodachi_review', Path(__file__).with_name('inspect-iso.py'))
review = importlib.util.module_from_spec(spec)
spec.loader.exec_module(review)
TARGETS = {
    '/opt/kodachi/dashboard/hooks/online-auth': 'online-auth.elf',
    '/opt/kodachi/dashboard/hooks/routing-switch': 'routing-switch.elf',
}


def copy_native_inputs(iso_path, inventory, output, targets=TARGETS):
    import pycdlib
    from dissect.squashfs import SquashFS
    if output.exists() or output.is_symlink():
        raise ValueError('Use a fresh native-input directory')
    if not 1 <= len(targets) <= 2 or any(name not in TARGETS.values() for name in targets.values()) or len(set(targets.values())) != len(targets):
        raise ValueError('Only fixed flat non-executable filenames are allowed')
    records = {item['path']: item for item in inventory['files'] if item['path'] in targets}
    if set(records) != set(targets):
        raise ValueError('Both exact native targets must have been scanned in the pinned ISO')
    if any(not 64 <= item['bytesRead'] <= review.MAX_BINARY_BYTES for item in records.values()):
        raise ValueError('Native target size outside bounds')
    output.mkdir(mode=0o700)
    iso, copied = pycdlib.PyCdlib(), []
    try:
        iso.open(str(iso_path))
        key = 'rr_path' if iso.rock_ridge else 'joliet_path' if iso.joliet_vd else 'iso_path'
        for layer in inventory['layers']:
            with iso.open_file_from_iso(**{key: layer['isoPath']}) as stream:
                review.validated_superblock(stream)
                fs = SquashFS(stream)
                for path, inode, entry_type in review.walk_files(fs.root):
                    if path not in targets or entry_type != 'file':
                        continue
                    if any(item['isoPath'] == path for item in copied):
                        raise ValueError('Ambiguous duplicate native target across layers')
                    expected = records[path]
                    if expected['layer'] != layer['isoPath'] or inode.size != expected['bytesRead']:
                        raise ValueError('Native target identity/size changed')
                    with inode.open() as source:
                        data = source.read(inode.size)
                    digest = hashlib.sha256(data).hexdigest()
                    if len(data) != inode.size or digest != expected['sha256']:
                        raise ValueError('Native target hash differs from verified inventory')
                    if data[:7] != b'\x7fELF\x02\x01\x01' or struct.unpack_from('<H', data, 18)[0] != 62:
                        raise ValueError('Only the expected AMD64 ELF64 native inputs are accepted, not .NET or scripts')
                    target = output / targets[path]
                    descriptor = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
                    with os.fdopen(descriptor, 'wb') as destination:
                        destination.write(data)
                    copied.append({'isoPath': path, 'layer': layer['isoPath'], 'flatName': target.name, 'bytes': len(data), 'sha256': digest, 'executableBit': False, 'executed': False})
    finally:
        iso.close()
    if len(copied) != len(targets):
        raise ValueError('Native inputs are incomplete; no Ghidra run may proceed')
    return copied


def main(iso, report_path, output):
    review.main(iso, report_path)  # fixed ISO size + SHA-256 + SHA-512 first
    inventory = json.loads(report_path.read_text())
    inputs = copy_native_inputs(iso, inventory, output)
    manifest = {'schema': 1, 'iso': inventory['iso'], 'sourceCommit': inventory['sourceCommit'], 'runId': inventory['runId'], 'inputs': inputs, 'preparedByScriptSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(), 'scope': 'Two fixed native ELF64 data copies, mode 0600, temporary runner only. No tree extraction, image execution, VPN login or decryption.'}
    (output / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print('Two verified native ELF64 inputs prepared as non-executable data; no image content executed.', flush=True)


if __name__ == '__main__':
    if len(sys.argv) != 4:
        raise SystemExit('usage: prepare-native.py PINNED_ISO FRESH_SCAN_JSON FRESH_INPUT_DIRECTORY')
    main(Path(sys.argv[1]).absolute(), Path(sys.argv[2]).absolute(), Path(sys.argv[3]).absolute())
