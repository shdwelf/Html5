"""tools/xena_binary_archive.py — NAA binary-object wrapper round-trip and shape checks."""

import base64
import hashlib
import json
import sys
import tempfile
import unittest
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))

import xena_binary_archive as xa  # noqa: E402

# Verbatim sample shipped in srnsw/xena plugins/example/example_file1.foo_Binary.xena
# (master 03784b6574e8c6beab9b5604b8a0f7145015663d): the element names and namespace
# below are what a Xena viewer expects.
SAMPLE = ('<?xml version="1.0" encoding="UTF-8"?><xena><meta_data><meta_data_wrapper_name>Default Package Wrapper'
          '</meta_data_wrapper_name><normaliser_name>au.gov.naa.digipres.xena.kernel.normalise.BinaryToXenaBinaryNormaliser'
          '</normaliser_name><input_source_uri>file:/example_file.foo</input_source_uri></meta_data><content>'
          '<binary-object:binary-object xmlns:binary-object="http://preservation.naa.gov.au/binary-object/1.0">'
          '77u/fmJlZ2luRm9vfnRoaXMgaXMgb3VyIGZpcnN0IGZvbyBmaWxlISBob29yYXkhDQo=</binary-object:binary-object></content></xena>')


class WrapperShape(unittest.TestCase):
    def test_unwrap_reads_the_upstream_sample(self):
        meta, data = xa.unwrap_text(SAMPLE)
        self.assertEqual(meta["meta_data_wrapper_name"], xa.WRAPPER_NAME)
        self.assertEqual(meta["normaliser_name"], xa.NORMALISER)
        self.assertEqual(meta["input_source_uri"], "file:/example_file.foo")
        self.assertEqual(data, "\ufeff~beginFoo~this is our first foo file! hooray!\r\n".encode("utf-8"))

    def test_wrap_round_trips_and_uses_the_same_vocabulary_as_xena(self):
        payload = bytes(range(256)) * 3 + b"\x00\xff<&>\"'"
        text = xa.wrap_bytes("blob.bin", payload)
        self.assertTrue(text.startswith('<?xml version="1.0" encoding="UTF-8"?>\n<xena><meta_data>'))
        root = ET.fromstring(text)
        self.assertEqual(root.tag, "xena")
        self.assertEqual([c.tag for c in root], ["meta_data", "content"])
        self.assertEqual([c.tag for c in root.find("meta_data")],
                         ["meta_data_wrapper_name", "normaliser_name", "input_source_uri"])
        body = root.find("content")[0]
        self.assertEqual(body.tag, f"{{{xa.BINARY_NS}}}binary-object")
        self.assertEqual(body.attrib[f"{{{xa.BINARY_NS}}}description"], xa.DESCRIPTION)
        lines = [l for l in body.text.split("\n") if l]
        self.assertTrue(all(len(l) <= 76 for l in lines), "RFC 2045 line length")
        meta, back = xa.unwrap_text(text)
        self.assertEqual(back, payload)
        self.assertEqual(meta["input_source_uri"], "file:/blob.bin")
        self.assertEqual(xa.xena_name("blob.bin"), "blob.bin_Binary.xena")

    def test_extra_provenance_lives_outside_the_three_xena_fields(self):
        text = xa.wrap_bytes("a.txt", b"hi", source_uri_prefix="zip:kit.zip!/", extra_meta={"container": "kit.zip", "n": 3})
        meta, back = xa.unwrap_text(text)
        self.assertEqual(back, b"hi")
        self.assertEqual(meta["input_source_uri"], "zip:kit.zip!/a.txt")
        self.assertIn("<html5_provenance><container>kit.zip</container><n>3</n></html5_provenance>", text)

    def test_rejects_foreign_xml(self):
        with self.assertRaises(ValueError):
            xa.unwrap_text("<html/>")

    def test_cli_wrap_verify_unwrap(self):
        with tempfile.TemporaryDirectory() as tmp:
            src = Path(tmp) / "hello.dat"
            src.write_bytes(b"GRASP\x34\x12")
            out = Path(tmp) / "out"
            self.assertEqual(xa.main(["wrap", str(src), "--out", str(out)]), 0)
            self.assertTrue((out / "hello.dat_Binary.xena").exists())
            self.assertEqual(xa.main(["verify", str(out)]), 0)
            back = Path(tmp) / "back"
            self.assertEqual(xa.main(["unwrap", str(out / "hello.dat_Binary.xena"), "--out", str(back)]), 0)
            self.assertEqual((back / "hello.dat").read_bytes(), b"GRASP\x34\x12")


@unittest.skipUnless(xa.SNEAKERS_ZIP.exists(), "repository Sneakers ZIP absent")
class SneakersArchive(unittest.TestCase):
    def test_committed_manifest_matches_a_fresh_build(self):
        committed = ROOT / "docs" / "xena" / "sneakers-grasp" / "MANIFEST.json"
        if not committed.exists():
            self.skipTest("docs/xena/sneakers-grasp/MANIFEST.json not present")
        pinned = json.loads(committed.read_text())
        with tempfile.TemporaryDirectory() as tmp:
            self.assertEqual(xa.main(["sneakers", "--out", tmp]), 0)
            fresh = json.loads((Path(tmp) / "MANIFEST.json").read_text())
            self.assertEqual(fresh["entries"], pinned["entries"])
            self.assertEqual(len(fresh["entries"]), 227)  # zip + 2 EXE + 224 GL members
            by_name = {e["name"]: e for e in fresh["entries"]}
            self.assertEqual(by_name["SNEAKERS.EXE"]["sha256"], "d5738c9a4050d69ca205a03229dad1616d681fbc9312859be3e629f4b3905961")
            self.assertEqual(by_name["asintro.txt"]["sha256"], "4184e79efdf783e8ebd1fb4bc57cd16cb7287b42ffe67cfa1d043de2d1ed9b68")
            # the committed sample packages are byte-identical to the fresh ones
            for sample in (ROOT / "docs" / "xena" / "sneakers-grasp" / "gl").glob("*.xena"):
                fresh_file = Path(tmp) / "gl" / sample.name
                self.assertEqual(hashlib.sha256(sample.read_bytes()).hexdigest(), hashlib.sha256(fresh_file.read_bytes()).hexdigest(), sample.name)


if __name__ == "__main__":
    unittest.main()
