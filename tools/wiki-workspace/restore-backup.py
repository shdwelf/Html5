#!/usr/bin/env python3
"""Restore checked wiki artifacts without recompressing shared JAR bytes.

Put this script beside wiki-backup.json, both JAR parts and the supplement ZIP.
Run: python3 restore-wiki-backup.py --output restored-wiki --extract-source
Existing output directories are refused. No network access or code execution.
The Git increment is separate and requires the base commit named in the README.
"""
from pathlib import Path, PurePosixPath
import argparse
import hashlib
import json
import re
import shutil
import tempfile
import zipfile

MAX_FILE = 2 * 1024**3

def flat(name):
    if not isinstance(name, str) or not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9._-]*', name):
        raise ValueError('Unsafe artifact filename')
    return name

def number(n):
    if type(n) is not int or not 0 <= n <= MAX_FILE:
        raise ValueError('Invalid byte count or offset')
    return n

def digest(file):
    h = hashlib.sha256()
    with file.open('rb') as reader:
        while True:
            chunk = reader.read(1024 * 1024)
            if not chunk:
                break
            h.update(chunk)
    return h.hexdigest()

def verify(file, record):
    if file.is_symlink() or not file.is_file() or file.stat().st_size != number(record['bytes']):
        raise ValueError('Missing or wrong-sized file: ' + file.name)
    if digest(file) != record['sha256']:
        raise ValueError('SHA-256 mismatch: ' + file.name)

def copy_n(reader, writer, length):
    remaining = number(length)
    while remaining:
        chunk = reader.read(min(remaining, 1024 * 1024))
        if not chunk:
            raise ValueError('Unexpected end of backup data')
        writer.write(chunk)
        remaining -= len(chunk)

def source_path(repo, name):
    flat(repo)
    if not isinstance(name, str) or '\\' in name or '\x00' in name or ':' in name:
        raise ValueError('Unsafe repository path')
    p = PurePosixPath(name)
    if p.is_absolute() or str(p) != name or any(part in ('.', '..', '.git') for part in p.parts):
        raise ValueError('Unsafe repository path')
    return Path(repo, *p.parts)

def restore(folder, output, extract_source=False):
    folder, output = Path(folder).resolve(), Path(output).absolute()
    if output.exists() or output.is_symlink():
        raise ValueError('Output already exists; choose a new directory')
    manifest = json.loads((folder / 'wiki-backup.json').read_text(encoding='utf-8'))
    if manifest.get('format') != 'repository-wiki-shared-jar-backup' or manifest.get('version') != 1:
        raise ValueError('Unsupported backup format')
    for record in manifest['inputs']:
        verify(folder / flat(record['name']), record)
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = Path(tempfile.mkdtemp(prefix='.wiki-restore-', dir=output.parent))
    try:
        base_record = manifest['canonical']
        base = temporary / flat(base_record['name'])
        with base.open('wb') as writer:
            for part in manifest['parts']:
                with (folder / flat(part['name'])).open('rb') as reader:
                    copy_n(reader, writer, part['bytes'])
        verify(base, base_record)
        with zipfile.ZipFile(folder / flat(manifest['supplement'])) as extra, base.open('rb') as raw, zipfile.ZipFile(base) as jar:
            for record in manifest['artifacts']:
                name = flat(record['name'])
                if name == base.name:
                    verify(base, record)
                    continue
                target = temporary / name
                if target.exists():
                    raise ValueError('Duplicate artifact name')
                with target.open('wb') as writer:
                    if 'ranges' in record:
                        written = 0
                        for chunk in record['ranges']:
                            count = number(chunk['bytes'])
                            written += count
                            if written > number(record['bytes']):
                                raise ValueError('Artifact exceeds declared size')
                            if chunk['kind'] == 'base':
                                offset = number(chunk['offset'])
                                if offset + count > base.stat().st_size:
                                    raise ValueError('Range outside canonical JAR')
                                raw.seek(offset)
                                copy_n(raw, writer, count)
                            elif chunk['kind'] == 'supplement':
                                info = extra.getinfo(chunk['member'])
                                if info.file_size != count:
                                    raise ValueError('Wrong-sized supplement entry')
                                with extra.open(info) as reader:
                                    copy_n(reader, writer, count)
                            else:
                                raise ValueError('Unknown range type')
                    else:
                        archive = jar if record['kind'] == 'base-entry' else extra
                        info = archive.getinfo(record['member'])
                        if info.file_size != number(record['bytes']):
                            raise ValueError('Wrong-sized artifact entry')
                        with archive.open(info) as reader:
                            copy_n(reader, writer, record['bytes'])
                verify(target, record)
            if extract_source:
                catalog = json.loads(jar.read('web/repository.json'))
                if catalog['snapshot'] != manifest['snapshot']:
                    raise ValueError('Wrong repository snapshot')
                modes = json.loads(extra.read('repository-modes.json'))
                for page in catalog['pages']:
                    relative = source_path(page['repo'], page['path'])
                    hash_id = page['sha256']
                    if not re.fullmatch(r'[0-9a-f]{64}', hash_id):
                        raise ValueError('Invalid vault id')
                    target = temporary / 'repository' / relative
                    if target.exists():
                        raise ValueError('Duplicate source path')
                    target.parent.mkdir(parents=True, exist_ok=True)
                    with jar.open('web/vault/' + hash_id) as reader, target.open('wb') as writer:
                        copy_n(reader, writer, page['size'])
                    verify(target, {'bytes': page['size'], 'sha256': hash_id})
                    target.chmod(0o755 if modes.get(relative.as_posix()) == '100755' else 0o644)
        if output.exists() or output.is_symlink():
            raise ValueError('Output appeared while restoring; refusing to replace it')
        temporary.rename(output)
        print('Verified and restored', len(manifest['artifacts']), 'wiki artifacts to', output)
        if extract_source:
            print('Also restored', len(catalog['pages']), 'eligible source files, not Git history or excluded data.')
    except BaseException:
        shutil.rmtree(temporary, ignore_errors=True)
        raise

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--backup', type=Path, default=Path(__file__).resolve().parent)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--extract-source', action='store_true')
    args = parser.parse_args()
    restore(args.backup, args.output, args.extract_source)
