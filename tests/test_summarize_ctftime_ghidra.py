"""Fail-closed checks for the compact native FBCTF evidence gate."""
from pathlib import Path
import json
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
from summarize_ctftime_ghidra import (  # noqa: E402
    NETSCREAM_SHA,
    SOMBRERO_SHA,
    EXPECTED_SOMBRERO,
    REQUIRED_IMPORTS,
    summarize,
)


def scan_report(sha, rows):
    return "\n".join([
        "# Ghidra FindCrypt signature scan — static only",
        "",
        "- Ghidra: `12.1.4`",
        f"- SHA-256: `{sha}`",
        "- FindCrypt database signatures: **126**",
        f"- Matching signature occurrences: **{len(rows)}**",
        "",
        "| Address | FindCrypt database label |",
        "|---|---|",
        *(f"| `{addr:08x}` | `CRYPT_{label}` |" for addr, label in sorted(rows)),
        "",
    ])


class SummaryTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        root = Path(self.temp.name)
        self.js = root / "meta.json"
        self.netscream = root / "n.md"
        self.sombrero = root / "s.md"
        self.sentinel = root / "a.md"
        self.meta = {
            "ghidraVersion": "12.1.4",
            "sha256": NETSCREAM_SHA,
            "executableFormat": "Executable and Linkable Format (ELF)",
            "language": "x86:LE:64:default",
            "instructions": 329,
            "functions": 24,
            "imports": [{"name": item} for item in REQUIRED_IMPORTS],
        }
        self.js.write_text(json.dumps(self.meta))
        self.netscream.write_text(scan_report(NETSCREAM_SHA, set()))
        self.sombrero.write_text(scan_report(SOMBRERO_SHA, EXPECTED_SOMBRERO))
        self.sentinel.write_text(scan_report("synthetic-positive-control", {(0, "AES_Encryption_SBox")}))

    def summarize(self):
        return summarize(self.js, self.netscream, self.sombrero, self.sentinel)

    def test_expected_minimal_report(self):
        text = self.summarize()
        self.assertIn("`0x96ea0`", text)
        self.assertIn("SHACAL-2", text)
        self.assertIn("raw BinaryLoader only", text)
        self.assertNotIn("synthetic-positive-control", text)

    def test_reject_wrong_binary_hash(self):
        self.meta["sha256"] = "0" * 64
        self.js.write_text(json.dumps(self.meta))
        with self.assertRaisesRegex(ValueError, "pinned SHA"):
            self.summarize()

    def test_reject_missing_native_import(self):
        self.meta["imports"] = []
        self.js.write_text(json.dumps(self.meta))
        with self.assertRaisesRegex(ValueError, "Required native ELF import"):
            self.summarize()

    def test_reject_modified_signature_map(self):
        self.sombrero.write_text(scan_report(SOMBRERO_SHA, {(0x96EA0, "SHACAL2_K")}))
        with self.assertRaisesRegex(ValueError, "Unexpected SOMBRERO"):
            self.summarize()

    def test_reject_undetected_control(self):
        self.sentinel.write_text(scan_report("", set()))
        with self.assertRaisesRegex(ValueError, "positive control"):
            self.summarize()

    def test_reject_wrong_version_and_scan_hash(self):
        self.netscream.write_text(scan_report("f" * 64, set()))
        with self.assertRaisesRegex(ValueError, "digest mismatch"):
            self.summarize()
        self.netscream.write_text(scan_report(NETSCREAM_SHA, set()).replace("12.1.4", "11.0.0"))
        with self.assertRaisesRegex(ValueError, "Wrong Ghidra version"):
            self.summarize()


if __name__ == "__main__":
    unittest.main()
