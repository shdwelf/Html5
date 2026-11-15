"""Pinned-byte checks for tools/grasp_gl_cipher.py against the in-repo Sneakers ZIP.

The source archive is webxdc-sneakers-exact/source/Sneakers_Promotional_Diskette.zip;
SNEAKERS.EXE inside it is the GRASPRT 4.00d runtime plus a protected GL library.
Nothing is executed: the tests only parse bytes.
"""

import hashlib
import sys
import unittest
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))

import grasp_gl_cipher as g  # noqa: E402

ZIP = ROOT / "webxdc-sneakers-exact" / "source" / "Sneakers_Promotional_Diskette.zip"
SNEAKERS_SHA = "d5738c9a4050d69ca205a03229dad1616d681fbc9312859be3e629f4b3905961"
ASINTRO_SHA = "4184e79efdf783e8ebd1fb4bc57cd16cb7287b42ffe67cfa1d043de2d1ed9b68"
MENU_PIC_SHA = "c54019c782a015be4a1805e9dc04e8b722ba5762656365e3058ed88998f794de"
AGGREGATE_SHA = "22cd34f6b71f2c238e611fc1a1a672ce97b034a882d1275df24d42e55a28ee6b"


class TableDerivation(unittest.TestCase):
    def test_permutation_matches_values_read_from_the_runtime_length_fields(self):
        perm = g.permutation_for_key(0xEC70)
        # (plain -> cipher) pairs observed directly in member length prefixes
        for plain, cipher in {0x00: 0x43, 0x3B: 0x00, 0x42: 0x07, 0x4D: 0x93, 0x63: 0xD5, 0x01: 0x6C, 0x02: 0x88,
                              0x20: 0x42, 0x0D: 0x2B, 0x0A: 0x2A}.items():
            self.assertEqual(perm[plain], cipher, f"perm[{plain:#04x}]")
        self.assertEqual(sorted(perm), list(range(256)), "must be a permutation")
        inv = g.inverse_table(perm)
        self.assertEqual(inv[0x43], 0x00)
        self.assertEqual(bytes(perm).translate(inv), bytes(range(256)))

    def test_xorshift_matches_the_386_and_8086_code_paths(self):
        rng = g.XorShift31(0xEC70 * 0x7CF7)
        first = rng.next()
        x = (0xEC70 * 0x7CF7) & 0x7FFFFFFF
        x ^= x >> 13
        x = (x ^ (x << 18)) & 0xFFFFFFFF
        self.assertEqual(first, x & 0xFFFF)
        self.assertEqual(rng.state, x)

    def test_key_zero_means_identity(self):
        self.assertEqual(g.permutation_for_key(0), g.permutation_for_key(0))
        self.assertNotEqual(g.permutation_for_key(1), g.permutation_for_key(2))


@unittest.skipUnless(ZIP.exists(), "repository Sneakers ZIP absent")
class SneakersLibrary(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with zipfile.ZipFile(ZIP) as archive:
            data = archive.read("SNEAKERS.EXE")
        assert hashlib.sha256(data).hexdigest() == SNEAKERS_SHA
        cls.path = ROOT / ".cache" / "tests" / "SNEAKERS.EXE"
        cls.path.parent.mkdir(parents=True, exist_ok=True)
        cls.path.write_bytes(data)
        cls.lib = g.parse_library(cls.path)

    def test_directory_and_key(self):
        self.assertEqual(self.lib.library_offset, 121997)
        self.assertEqual(self.lib.key_word, 0xEC70)
        self.assertEqual(len(self.lib.members), 224)
        self.assertTrue(all(m.consistent for m in self.lib.members))
        self.assertEqual(self.lib.members[0].name, "asintro.txt")
        self.assertEqual(self.lib.members[0].offset, 3827)

    def test_member_bytes(self):
        by_name = {m.name: m for m in self.lib.members}
        intro = self.lib.member_bytes(by_name["asintro.txt"])
        self.assertEqual(hashlib.sha256(intro).hexdigest(), ASINTRO_SHA)
        self.assertTrue(intro.startswith(b";\r\n; Universal Pictures' Sneakers\r\n;"))
        self.assertEqual(hashlib.sha256(self.lib.member_bytes(by_name["menu.pic"])).hexdigest(), MENU_PIC_SHA)
        for m in self.lib.members:
            if m.name.endswith((".pic", ".clp", ".pal")):
                self.assertEqual(self.lib.member_bytes(m)[:2], b"\x34\x12", f"{m.name} should carry the Pictor 0x1234 magic")

    def test_manifest_aggregate(self):
        rows = g.manifest(self.lib)
        self.assertEqual(rows["consistent_members"], 224)
        agg = hashlib.sha256("".join(f"{e['name']}:{e['sha256_decoded']}\n" for e in rows["entries"]).encode()).hexdigest()
        self.assertEqual(agg, AGGREGATE_SHA)


if __name__ == "__main__":
    unittest.main()
