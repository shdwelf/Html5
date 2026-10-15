#!/usr/bin/env python3
"""Small offline regression tests for the Drive backup restoration format."""
from pathlib import Path
import hashlib
import importlib.util
import io
import json
import tempfile
import unittest
import zipfile

spec = importlib.util.spec_from_file_location('wiki_backup_restore', Path(__file__).with_name('restore-backup.py'))
restore_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(restore_module)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def record(name, data):
    return {'name': name, 'bytes': len(data), 'sha256': sha(data)}


class BackupTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.backup = self.root / 'backup'
        self.backup.mkdir()
        self.output = self.root / 'restored'
        self.source = b'#!/bin/sh\nprintf source\n'
        self.snapshot = sha(b'fixture snapshot')
        self.catalog = {'snapshot': self.snapshot, 'pages': [
            {'repo': 'Fixture', 'path': 'tools/example.sh', 'size': len(self.source), 'sha256': sha(self.source)}]}
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, 'w', compression=zipfile.ZIP_DEFLATED) as jar:
            jar.writestr('web/repository.json', json.dumps(self.catalog))
            jar.writestr('web/vault/' + sha(self.source), self.source)
            jar.writestr('web/note.html', '<p>Fixture</p>')
        self.base = buffer.getvalue()
        self.variant = self.base + b'exact extra bytes'
        middle = len(self.base) // 2
        parts = []
        for i, data in enumerate([self.base[:middle], self.base[middle:]]):
            name = 'base.part-' + str(i)
            (self.backup / name).write_bytes(data)
            parts.append(record(name, data))
        with zipfile.ZipFile(self.backup / 'supplement.zip', 'w') as extra:
            extra.writestr('tail', b'exact extra bytes')
            extra.writestr('files/extra.txt', b'extra')
            extra.writestr('repository-modes.json', json.dumps({'Fixture/tools/example.sh': '100755'}))
        supplement = (self.backup / 'supplement.zip').read_bytes()
        self.manifest = {'format': 'repository-wiki-shared-jar-backup', 'version': 1,
                         'snapshot': self.snapshot, 'canonical': record('more.wiki.in.a.jar', self.base),
                         'parts': parts, 'supplement': 'supplement.zip',
                         'inputs': parts + [record('supplement.zip', supplement)],
                         'artifacts': [record('more.wiki.in.a.jar', self.base),
                           {**record('variant.bin', self.variant), 'ranges': [
                               {'kind': 'base', 'offset': 0, 'bytes': len(self.base)},
                               {'kind': 'supplement', 'member': 'tail', 'bytes': len(b'exact extra bytes')}]},
                           {**record('note.html', b'<p>Fixture</p>'), 'kind': 'base-entry', 'member': 'web/note.html'},
                           {**record('extra.txt', b'extra'), 'kind': 'supplement-entry', 'member': 'files/extra.txt'}]}
        self.save_manifest()

    def save_manifest(self):
        (self.backup / 'wiki-backup.json').write_text(json.dumps(self.manifest))

    def assert_clean_failure(self):
        self.assertFalse(self.output.exists())
        self.assertEqual(list(self.root.glob('.wiki-restore-*')), [])

    def test_byte_exact_artifacts_and_source_modes(self):
        restore_module.restore(self.backup, self.output, True)
        self.assertEqual((self.output / 'more.wiki.in.a.jar').read_bytes(), self.base)
        self.assertEqual((self.output / 'variant.bin').read_bytes(), self.variant)
        self.assertEqual((self.output / 'note.html').read_text(), '<p>Fixture</p>')
        self.assertEqual((self.output / 'extra.txt').read_bytes(), b'extra')
        source = self.output / 'repository/Fixture/tools/example.sh'
        self.assertEqual(source.read_bytes(), self.source)
        self.assertEqual(source.stat().st_mode & 0o777, 0o755)

    def test_existing_output_is_not_modified(self):
        self.output.mkdir()
        sentinel = self.output / 'keep.txt'
        sentinel.write_text('existing user data')
        with self.assertRaisesRegex(ValueError, 'already exists'):
            restore_module.restore(self.backup, self.output)
        self.assertEqual(sentinel.read_text(), 'existing user data')

    def test_tampered_input_fails_before_writing(self):
        p = self.backup / 'base.part-0'
        data = bytearray(p.read_bytes()); data[0] ^= 1; p.write_bytes(data)
        with self.assertRaisesRegex(ValueError, 'SHA-256'):
            restore_module.restore(self.backup, self.output)
        self.assert_clean_failure()

    def test_missing_part_fails(self):
        (self.backup / 'base.part-1').unlink()
        with self.assertRaisesRegex(ValueError, 'Missing'):
            restore_module.restore(self.backup, self.output)
        self.assert_clean_failure()

    def test_bad_output_hash_is_cleaned_up(self):
        self.manifest['artifacts'][1]['sha256'] = '0' * 64
        self.save_manifest()
        with self.assertRaisesRegex(ValueError, 'SHA-256'):
            restore_module.restore(self.backup, self.output)
        self.assert_clean_failure()

    def test_out_of_bounds_range_is_rejected(self):
        self.manifest['artifacts'][1]['ranges'][0]['offset'] = len(self.base)
        self.save_manifest()
        with self.assertRaisesRegex(ValueError, 'Range outside'):
            restore_module.restore(self.backup, self.output)
        self.assert_clean_failure()

    def test_artifact_path_traversal_is_rejected(self):
        self.manifest['artifacts'][1]['name'] = '../escape.txt'
        self.save_manifest()
        with self.assertRaisesRegex(ValueError, 'Unsafe'):
            restore_module.restore(self.backup, self.output)
        self.assert_clean_failure()
        self.assertFalse((self.root / 'escape.txt').exists())

    def test_source_path_and_numeric_guards(self):
        for name in ['../x', '/etc/passwd', '.git/config', 'a//b', 'a/./b', 'a\\b', 'C:escape', '']:
            with self.subTest(name=name), self.assertRaises(ValueError):
                restore_module.source_path('Fixture', name)
        self.assertEqual(restore_module.source_path('Fixture', 'docs/é.txt'), Path('Fixture/docs/é.txt'))
        for value in [-1, True, '12', restore_module.MAX_FILE + 1]:
            with self.subTest(value=value), self.assertRaises(ValueError):
                restore_module.number(value)


if __name__ == '__main__':
    unittest.main(verbosity=2)
