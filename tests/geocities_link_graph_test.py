"""Offline synthetic controls; do not fetch any real graph or visitor content."""
import gzip
import hashlib
import importlib.util
import json
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location("geocities_graph", Path(__file__).parents[1] / "tools/geocities-link-graph.py")
graph = importlib.util.module_from_spec(spec)
spec.loader.exec_module(graph)


class GraphProbeTests(unittest.TestCase):
    def test_metadata_keeps_versions_distinct_and_requires_complete_transfer_checksums(self):
        rows = [{"name": name, "size": str(1000 + i), "sha1": "a" * 40, "md5": "b" * 32}
                for i, name in enumerate(graph.GRAPH_FILES)]
        body = json.dumps({"files": rows}).encode()
        result = graph.graph_metadata(body, graph.GRAPH_FILES[0])
        self.assertEqual(result["selectedFile"]["name"], "geocities-webgraph.csv.gz")
        self.assertEqual(len(result["graphFiles"]), 3)
        self.assertEqual(result["metadataResponseSha256"], hashlib.sha256(body).hexdigest())
        for value in [{"files": []}, {"files": [{**rows[0], "sha1": ""}]},
                      {"files": [{**rows[0], "size": str(graph.MAX_COMPRESSED + 1)}]}]:
            with self.assertRaises(ValueError):
                graph.graph_metadata(json.dumps(value).encode(), graph.GRAPH_FILES[0])

    def test_actual_and_documented_schema_names_are_distinguished_from_a_complete_scan(self):
        for header in ["crawl_date,src,dest,anchor", "crawl_date,source,target,anchor_text"]:
            result = graph.probe_prefix(gzip.compress((header + "\n19990101,http://example.invalid/,http://target.invalid/,private visitor text\n").encode()))
            self.assertTrue(result["recognizedHeader"])
            self.assertEqual(result["header"], header.split(","))
            self.assertFalse(result["completeGraphSearched"])
            self.assertNotIn("private visitor text", json.dumps(result))
            self.assertNotIn("http://example.invalid/", json.dumps(result))

    def test_unknown_or_headerless_schema_is_not_silently_accepted_or_logged(self):
        result = graph.probe_prefix(gzip.compress(b"19990101,http://example.invalid/,http://target.invalid/,visitor@example.invalid\n"))
        self.assertFalse(result["recognizedHeader"])
        self.assertTrue(result["firstFieldLooksLikeCrawlDate"])
        self.assertEqual(result["firstRecordColumnCount"], 4)
        self.assertNotIn("visitor@example.invalid", json.dumps(result))

    def test_https_archive_only_redirect_boundary(self):
        for value in ["http://archive.org/", "https://archive.org.evil.invalid/", "https://127.0.0.1/",
                      "https://user:pass@archive.org/", "https://archive.org:8443/", "https://guestbook.invalid/admin"]:
            with self.assertRaises(ValueError):
                graph.archive_url(value)
        for value in ["https://archive.org/download/item/file.gz", "https://ia801.example.us.archive.org/file.gz"]:
            self.assertEqual(graph.archive_url(value), value)


if __name__ == "__main__":
    unittest.main()
