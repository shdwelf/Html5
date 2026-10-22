#!/usr/bin/env python3
"""Deterministic executable JARs. Streaming avoids loading the repository vault in RAM."""
from pathlib import Path
import sys
import zipfile
import shutil

classes, web, output = map(Path, sys.argv[1:])
editions = [
    ('wiki.in.a.jar', 'Wiki in a Jar - repository edition 1', '/wiki/index.html'),
    ('more.wiki.in.a.jar', 'More Wiki in a Jar - repository edition 1', '/library/index.html'),
    ('tiddlywiki.in.a.jar', 'TiddlyWiki in a Jar - repository edition 1', '/tiddlywiki.html'),
]

def info(name):
    entry = zipfile.ZipInfo(name, (2026, 10, 15, 0, 0, 0))
    entry.compress_type = zipfile.ZIP_DEFLATED
    entry.external_attr = 0o100644 << 16
    return entry

files = [(p.relative_to(classes).as_posix(), p) for p in classes.rglob('*') if p.is_file()]
files += [('web/' + p.relative_to(web).as_posix(), p) for p in web.rglob('*') if p.is_file()]
for filename, label, landing in editions:
    target = output / filename
    with zipfile.ZipFile(target, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
        archive.writestr(info('META-INF/MANIFEST.MF'), 'Manifest-Version: 1.0\r\nMain-Class: org.html5.wiki.WikiServer\r\nImplementation-Version: 1.0.0\r\n\r\n')
        archive.writestr(info('edition.properties'), f'edition={label}\nlanding={landing}\n')
        for name, source in sorted(files):
            with source.open('rb') as reader, archive.open(info(name), 'w') as writer:
                shutil.copyfileobj(reader, writer, 1024 * 1024)
    print(f'{filename}: {target.stat().st_size:,} bytes', flush=True)
