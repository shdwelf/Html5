#!/usr/bin/env python3
"""Independent metadata-only interoperability. Never construct a libtorrent session."""
import base64
import json
from pathlib import Path
import sys
import tempfile
import libtorrent as lt

if lt.version != '2.0.11.0':
    raise RuntimeError('Use the hash-pinned libtorrent 2.0.11 test wheel.')

def hashes(info):
    value = info.info_hashes()
    return {'v1': str(value.v1) if value.has_v1() else '', 'v2': str(value.v2) if value.has_v2() else ''}

def generate():
    vectors = []
    with tempfile.TemporaryDirectory(prefix='atlas-libtorrent-payload-') as folder:
        root = Path(folder)
        cases = [('single', [('single.bin', 50000)]), ('small', [('small.txt', 5)]), ('multi', [('bundle/a.bin', 1), ('bundle/b.bin', 40000), ('bundle/empty.txt', 0), ('bundle/sub/data.bin', 16384)])]
        for family, entries in cases:
            for index, (name, size) in enumerate(entries):
                target = root / name
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(bytes((i + index) % 251 for i in range(size)))
            for piece_size in [16384, 65536]:
                for mode, flag in [('v1', lt.create_torrent.v1_only), ('v2', lt.create_torrent.v2_only), ('hybrid', 0)]:
                    storage = lt.file_storage()
                    for name, size in entries:
                        storage.add_file(name, size)
                    created = lt.create_torrent(storage, piece_size, flag)
                    lt.set_piece_hashes(created, str(root))
                    value = created.generate()
                    value.pop(b'creation date', None)
                    encoded = lt.bencode(value)
                    parsed = lt.torrent_info(encoded)
                    vectors.append({'id': f'{family}-{piece_size}-{mode}', 'version': mode, 'pieceLength': piece_size, 'payloadBytes': sum(size for _, size in entries), 'files': len(entries), **hashes(parsed), 'base64': base64.b64encode(encoded).decode('ascii')})
    return {'generator': 'libtorrent 2.0.11.0', 'scope': 'Synthetic metadata only; no network or peer session. Creation dates removed for deterministic fixtures.', 'vectors': vectors}

if sys.argv[1:] == ['generate']:
    print(json.dumps(generate(), ensure_ascii=False, indent=2))
elif len(sys.argv) == 3 and sys.argv[1] == 'validate':
    directory = Path(sys.argv[2])
    manifest = json.loads((directory / 'manifest.json').read_text())
    for item in manifest:
        parsed = lt.torrent_info((directory / item['file']).read_bytes())
        if hashes(parsed) != {'v1': item['v1'], 'v2': ''}:
            raise AssertionError('Independent infohash mismatch: ' + item['file'])
        if parsed.total_size() != item['total'] or parsed.priv() != item['private']:
            raise AssertionError('Independent size/private mismatch: ' + item['file'])
    print(json.dumps({'independentParser': 'libtorrent 2.0.11.0', 'atlasExportsAccepted': len(manifest), 'networkSessions': 0}))
else:
    raise RuntimeError('usage: torrent-atlas-interop.py generate | validate DIRECTORY')
