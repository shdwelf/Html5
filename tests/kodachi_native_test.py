"""Original synthetic native-input controls; never boot or execute image bytes."""
import copy
import importlib.util
import io
import os
from pathlib import Path
import struct
import tempfile
import unittest

from kodachi_iso_inspect_test import squash_fixture

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('kodachi_native', ROOT / 'tools/kodachi/prepare-native.py')
native = importlib.util.module_from_spec(spec)
spec.loader.exec_module(native)
TARGETS = {'/online-auth': 'online-auth.elf', '/kodachi-routing-switch': 'routing-switch.elf'}


def elf():
    data = bytearray(64)
    data[:7] = b'\x7fELF\x02\x01\x01'
    struct.pack_into('<H', data, 18, 62)
    return bytes(data)


def fixture(path, data=None):
    import pycdlib
    binary = elf() if data is None else data
    payload = squash_fixture({'online-auth': binary, 'kodachi-routing-switch': binary})
    iso = pycdlib.PyCdlib()
    iso.new(interchange_level=3, rock_ridge='1.09', joliet=3)
    iso.add_directory(iso_path='/LIVE', rr_name='live')
    iso.add_fp(io.BytesIO(payload), len(payload), iso_path='/LIVE/FILESYSTEM.SQUASHFS;1', rr_name='filesystem.squashfs')
    iso.write(str(path)); iso.close()
    return native.review.inspect_iso(path)


class NativeInputTests(unittest.TestCase):
    def test_real_readers_copy_only_two_verified_flat_files_without_execute_bits(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp); source = root/'original.iso'; inventory = fixture(source)
            out = root/'flat-inputs'
            records = native.copy_native_inputs(source, inventory, out, targets=TARGETS)
            self.assertEqual(len(records), 2)
            self.assertEqual(sorted(p.name for p in out.iterdir()), ['online-auth.elf', 'routing-switch.elf'])
            for item in records:
                p = out/item['flatName']
                self.assertEqual(p.read_bytes(), elf())
                self.assertEqual(p.stat().st_mode & 0o111, 0)
                self.assertFalse(item['executed'])
            self.assertEqual(sorted(p.name for p in root.iterdir()), ['flat-inputs', 'original.iso'])

    def test_hash_or_format_mismatch_prevents_raw_input_writes(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp); source = root/'original.iso'; inventory = fixture(source)
            wrong = copy.deepcopy(inventory)
            for row in wrong['files']: row['sha256'] = '0' * 64
            with self.assertRaisesRegex(ValueError, 'hash differs'):
                native.copy_native_inputs(source, wrong, root/'wrong-hash', targets=TARGETS)
            self.assertEqual(list((root/'wrong-hash').iterdir()), [])
            source2 = root/'not-native.iso'; inventory2 = fixture(source2, b'MZ' + b'X' * 62)
            with self.assertRaisesRegex(ValueError, 'AMD64 ELF64'):
                native.copy_native_inputs(source2, inventory2, root/'wrong-format', targets=TARGETS)
            self.assertEqual(list((root/'wrong-format').iterdir()), [])

    def test_existing_symlink_or_path_derived_output_targets_are_refused(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            with self.assertRaisesRegex(ValueError, 'fresh'):
                native.copy_native_inputs(root/'unused.iso', {}, root)
            link = root/'link'; link.symlink_to(root/'absent')
            with self.assertRaisesRegex(ValueError, 'fresh'):
                native.copy_native_inputs(root/'unused.iso', {}, link)
            for targets in [{'/x': '../escape'}, {'/x': 'online-auth.elf', '/y': 'online-auth.elf'}, {}]:
                with self.assertRaisesRegex(ValueError, 'fixed flat'):
                    native.copy_native_inputs(root/'unused.iso', {}, root/'new', targets=targets)
            self.assertFalse((root/'new').exists())

    def test_gated_native_script_keeps_decompiled_code_strings_and_keys_out_of_report(self):
        script = (ROOT/'tools/ghidra_scripts/KodachiCryptoReport.java').read_text()
        self.assertIn('extends HeadlessScript', script)
        self.assertIn('analysisTimeoutOccurred()', script)
        self.assertIn('engine.decompileFunction', script)
        self.assertIn('getC().getBytes', script)
        self.assertIn('cSha256', script)
        self.assertIn('memory.findBytes', script)
        self.assertNotIn('emulate', script.lower().replace('emulation', ''))
        self.assertNotIn('getRuntime().exec', script)
        self.assertNotIn('out.println', script)
        workflow = (ROOT/'.github/workflows/kodachi-native-analysis.yml').read_text()
        self.assertIn('needs: ordered-controls', workflow)
        self.assertIn('java-version: \'21\'', workflow)
        self.assertIn('ddac49f903da9d5bac833e5cc79395098b9c33cfd3279be5f31bd00387d2d4db', workflow)
        self.assertNotIn('contents: write', workflow)
        self.assertIn('Original acquisition expired', workflow)
        self.assertIn('Native Ghidra disassembly/decompilation', workflow)


if __name__ == '__main__':
    unittest.main()
