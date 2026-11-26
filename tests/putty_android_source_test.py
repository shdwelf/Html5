"""Offline source-fetcher safety controls. No network or account access."""
import importlib.util
import tarfile
import unittest
from pathlib import Path

MODULE = Path(__file__).resolve().parents[1] / "tools/putty-android/fetch-source.py"
spec = importlib.util.spec_from_file_location("putty_source", MODULE)
source = importlib.util.module_from_spec(spec)
spec.loader.exec_module(source)


def member(name, directory=False, size=0):
    entry = tarfile.TarInfo(name)
    entry.type = tarfile.DIRTYPE if directory else tarfile.REGTYPE
    entry.size = size
    return entry


class SourceControls(unittest.TestCase):
    def test_official_root_directory_without_slash_is_valid(self):
        source.validate_members([member("putty-0.85", True), member("putty-0.85/LICENCE", size=2000)])

    def test_directory_with_slash_is_also_valid(self):
        source.validate_members([member("putty-0.85/", True), member("putty-0.85/unix/plink.c")])

    def test_root_file_is_not_a_directory(self):
        with self.assertRaises(ValueError):
            source.validate_members([member("putty-0.85")])

    def test_wrong_root_is_rejected(self):
        for name in ["putty-0.84/file", "putty-0.85-evil/file", "/putty-0.85/file", "README"]:
            with self.subTest(name=name), self.assertRaises(ValueError):
                source.validate_members([member(name)])

    def test_traversal_is_rejected(self):
        with self.assertRaises(ValueError):
            source.validate_members([member("putty-0.85/../../file")])

    def test_expansion_size_bound(self):
        with self.assertRaises(ValueError):
            source.validate_members([member("putty-0.85/huge", size=80*1024*1024+1)])

    def test_member_count_bound(self):
        with self.assertRaises(ValueError):
            source.validate_members([member("putty-0.85/a")] * 12001)

    def test_only_official_https_source_hosts_allowed(self):
        for url in ["http://the.earth.li/file", "https://example.com/file", "https://the.earth.li.evil.test/file", "file:///etc/passwd", "https://user:pass@the.earth.li/file", "https://the.earth.li:444/file"]:
            with self.subTest(url=url), self.assertRaises(ValueError):
                source.allowed(url)
        self.assertEqual(source.allowed(source.ARCHIVE_URL), source.ARCHIVE_URL)
        self.assertEqual(source.allowed(source.KEY_URL), source.KEY_URL)

    def test_pins_are_full_release_identities(self):
        self.assertEqual(len(source.SHA256), 64)
        self.assertEqual(source.VERSION, "0.85")
        self.assertEqual(source.RELEASE_FINGERPRINT, "1A07DAC0F220CF12248EA7195C67D0F88BC3E5B5")


if __name__ == "__main__":
    unittest.main()
