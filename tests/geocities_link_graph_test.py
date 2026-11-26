"""Offline synthetic controls; do not fetch any real graph or visitor content."""
import csv
import gzip
import io
import subprocess
import tempfile
import hashlib
import importlib.util
import json
import unittest
from unittest.mock import patch
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

class GraphStreamingTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temporary = tempfile.TemporaryDirectory(prefix="synthetic-geocities-graph-")
        cls.scanner = Path(cls.temporary.name) / "scanner"
        compiled = subprocess.run(["g++", "-O2", "-std=c++17", "-Wall", "-Wextra", "-Werror",
                                   str(Path(__file__).parents[1] / "tools/geocities-link-graph.cpp"), "-o", str(cls.scanner)],
                                  capture_output=True, timeout=30)
        if compiled.returncode:
            raise AssertionError(compiled.stderr.decode())

    @classmethod
    def tearDownClass(cls):
        cls.temporary.cleanup()

    def csv_bytes(self, rows, header=graph.SCHEMAS[1]):
        stream = io.StringIO(newline="")
        writer = csv.writer(stream, lineterminator="\r\n", doublequote=True)
        writer.writerow(header)
        writer.writerows(rows)
        return stream.getvalue().encode()

    def metadata(self, body):
        return {"selectedFile": {"name": graph.GRAPH_FILES[0], "size": str(len(body)),
                                 "md5": hashlib.md5(body).hexdigest(), "sha1": hashlib.sha1(body).hexdigest()}}

    def scan(self, body, chunk=17, metadata=None):
        chunks = (body[i:i + chunk] for i in range(0, len(body), chunk))
        return graph.scan_chunks(chunks, metadata or self.metadata(body), self.scanner)

    def test_all_records_and_gzip_members_are_scanned_and_only_target_edges_retained(self):
        target = "http://www.geocities.com/SiliconValley/Park/8099/"
        source = "http://www.geocities.com/SiliconValley/Other/1234/geobook.html?email=visitor@example.invalid"
        rows = [
            ["19991008", source, target, "Visitor name, email visitor@example.invalid\nwith a fake http://secret.invalid/ link"],
            ["19991008", target, target + "intro.htm", "Self link"],
            ["19991008", target, "http://unrelated.invalid/", "Original outlink"],
            ["19991008", "http://example.invalid/", "http://www.geocities.com/TimesSquare/8099/", "Other neighborhood"],
            ["19991008", "http://example.invalid/", "http://geocities.com.evil.invalid/SiliconValley/Park/8099/", "Lookalike"],
            ["19991008", "http://example.invalid/", "http://www.lpage.com/wgb/wgbview.dbm?owner=Shadowelf", "Public book"],
            ["19991008", "http://example.invalid/", "http://www.lpage.com/wgb/wgbview.dbm?owner=Other", "Other book"],
            ["19991008", "http://example.invalid/", "http://www.lpage.com/wgb/wgbview.dbm?owner=Shadowelf&action=private", "Not public"],
            ["19991008", "http://example.invalid/", "http://unrelated.invalid/", "8099 Shadowelf only in anchor: not an edge"],
        ]
        body = gzip.compress(self.csv_bytes(rows[:4])) + gzip.compress(self.csv_bytes(rows[4:]))
        result, _ = self.scan(body, chunk=1)
        self.assertTrue(result["completeGraphSearched"], result)
        self.assertTrue(result["transferIntegrityVerified"])
        self.assertEqual(result["gzipMembersCompleted"], 2)
        self.assertEqual(result["nativeStats"]["rows"], 9)
        self.assertEqual(result["nativeStats"]["repeatedHeaders"], 1)
        self.assertEqual(result["counts"]["inboundSiteRows"], 1)
        self.assertEqual(result["counts"]["inboundGuestbookRows"], 1)
        self.assertEqual(result["counts"]["selfLinkRows"], 1)
        self.assertEqual(result["counts"]["originalSourceRows"], 2)
        self.assertEqual(len(result["matches"]), 2)
        encoded = json.dumps(result)
        for value in ["visitor@example.invalid", "Visitor name", "http://secret.invalid/", "Other book"]:
            self.assertNotIn(value, encoded)
        self.assertTrue(result["matches"][0]["source"]["queryRedacted"])
        self.assertFalse(result["matches"][0]["sourcePageVerified"])

    def test_percent_escapes_case_and_csv_quoting_do_not_drop_exact_url_targets(self):
        rows = [["20000101", "http://www.geocities.com/Elsewhere/1000/a,b.htm",
                 "http://WWW.GEOCITIES.COM/siliconvalley/park/%38%30%39%39/", 'Comma, "quote" and\nmultiline anchor'],
                ["20000101", "http://example.invalid/", "http://www.lpage.com/wgb/wgbview.dbm?owner=%53hadoWelf", "Private label omitted"]]
        body = gzip.compress(self.csv_bytes(rows))
        result, _ = self.scan(body)
        self.assertTrue(result["completeGraphSearched"], result)
        self.assertEqual(result["nativeStats"]["rows"], 2)
        self.assertEqual(len(result["matches"]), 2)
        self.assertEqual(result["counts"]["inboundSiteRows"], 1)
        self.assertEqual(result["counts"]["inboundGuestbookRows"], 1)

    def test_rfc_doublequotes_and_literal_backslashes_are_not_conflated_with_a_second_dialect(self):
        target = "http://www.geocities.com/SiliconValley/Park/8099/"
        rows = [["20000101", "http://example.invalid/", target, anchor]
                for anchor in ['Comma, ending slash' + chr(92), 'Quote " and slash ' + chr(92) + '"',
                               'A literal ' + chr(92) * 2 + ' followed by " doubled quotes, and a newline\n', 'regular']]
        result, _ = self.scan(gzip.compress(self.csv_bytes(rows)), chunk=1)
        self.assertTrue(result["completeGraphSearched"], result)
        self.assertEqual(result["nativeStats"]["rows"], 4)
        self.assertEqual(result["counts"]["inboundSiteRows"], 4)

    def test_no_match_is_a_complete_file_result_only_after_all_integrity_and_parser_gates(self):
        body = gzip.compress(self.csv_bytes([["20000101", "http://example.invalid/", "http://elsewhere.invalid/", "not retained"]]))
        complete, _ = self.scan(body)
        self.assertTrue(complete["completeGraphSearched"])
        self.assertEqual(complete["matches"], [])
        wrong = self.metadata(body)
        wrong["selectedFile"]["sha1"] = "0" * 40
        for payload, metadata in [(body[:-8], self.metadata(body)), (body + b"junk", self.metadata(body + b"junk")),
                                  (body, wrong), (gzip.compress(b"wrong,header\n"), None),
                                  (gzip.compress(b'crawl_date,source,target,anchor_text\n20000101,http://example.invalid/,http://elsewhere.invalid/,"unterminated'), None)]:
            result, _ = self.scan(payload, metadata=metadata)
            self.assertFalse(result["completeGraphSearched"], result)
            self.assertEqual(result["status"], "partial-or-failed")

    def test_late_target_after_large_multiline_anchor_is_seen_without_retaining_anchor(self):
        anchor = ("unrelated visitor text, \"quotes\"\n" * 50000)
        rows = [["20000101", "http://example.invalid/", "http://elsewhere.invalid/", anchor],
                ["20000101", "http://www.geocities.com/Elsewhere/5678/", "http://www.geocities.com/SiliconValley/Park/8099/", "target"]]
        body = gzip.compress(self.csv_bytes(rows))
        result, _ = self.scan(body, chunk=100)
        self.assertTrue(result["completeGraphSearched"], result)
        self.assertEqual(result["nativeStats"]["rows"], 2)
        self.assertEqual(result["counts"]["inboundSiteRows"], 1)
        self.assertLess(len(json.dumps(result)), 6000)

    def test_bad_columns_oversized_date_and_unquoted_quote_fail_with_fixed_diagnostics_only(self):
        header = b"crawl_date,source,target,anchor_text\n"
        for record in [b"a,b,c,d,e\n", b'a,b"quote,c,d\n', b"x" * 65537 + b",b,c,d\n"]:
            result, _ = self.scan(gzip.compress(header + record))
            self.assertFalse(result["completeGraphSearched"])
            self.assertNotEqual(result["nativeExitStatus"], 0)
            self.assertNotIn("x" * 200, json.dumps(result))

    def test_oversized_non_http_urls_cannot_abort_or_become_target_edges(self):
        target = "http://www.geocities.com/SiliconValley/Park/8099/"
        rows = [["20000101", target, "javascript:" + "x" * 70000 + "8099Shadowelf", "not retained"],
                ["20000101", "http://example.invalid/", target, "real edge after oversized URL"]]
        result, _ = self.scan(gzip.compress(self.csv_bytes(rows)), chunk=97)
        self.assertTrue(result["completeGraphSearched"], result)
        self.assertEqual(result["nativeStats"]["oversizedNonHttpFields"], 1)
        self.assertEqual(result["counts"]["originalSourceRows"], 1)
        self.assertEqual(result["counts"]["inboundSiteRows"], 1)
        self.assertNotIn("x" * 500, json.dumps(result))

    def test_oversized_http_fields_are_fully_prefiltered_without_false_completeness(self):
        target = "http://www.geocities.com/SiliconValley/Park/8099/"
        irrelevant = ["20000101", "http://example.invalid/", "http://elsewhere.invalid/" + "x" * 70000, "not retained"]
        result, _ = self.scan(gzip.compress(self.csv_bytes([irrelevant])))
        self.assertTrue(result["completeGraphSearched"], result)
        self.assertEqual(result["nativeStats"]["oversizedHttpFields"], 1)
        candidate = ["20000101", "http://elsewhere.invalid/" + "x" * 70000, target, "not retained"]
        encoded_late = ["20000101", "http://elsewhere.invalid/", "http://elsewhere.invalid/" + "x" * 70000 + "%38%30%39%39", "not retained"]
        guestbook_late = ["20000101", "http://elsewhere.invalid/", "http://www.lpage.com/wgb/wgbview.dbm?pad=" + "x" * 70000 + "&owner=%53haDoWelf", "not retained"]
        body = gzip.compress(self.csv_bytes([irrelevant, candidate, encoded_late, guestbook_late]))
        result, _ = self.scan(body, chunk=61)
        self.assertFalse(result["completeGraphSearched"], result)
        self.assertTrue(result["fullPayloadRead"])
        self.assertTrue(result["transferIntegrityVerified"])
        self.assertTrue(result["csvComplete"])
        self.assertFalse(result["exactCandidateCoverageComplete"])
        self.assertEqual(result["counts"]["unclassifiedCandidateRows"], 3)
        self.assertEqual(result["nativeStats"]["unclassifiedCandidateRows"], 3)
        self.assertEqual(result["nativeStats"]["rows"], 4)
        self.assertNotIn("x" * 500, json.dumps(result))

    def test_source_verification_is_kind_specific_and_never_upgrades_an_unseen_target_kind(self):
        source = "http://www.geocities.com/Elsewhere/1234/geobook.html"
        collector = graph.EdgeCollector()
        for target in ["http://www.geocities.com/SiliconValley/Park/8099/", "http://www.lpage.com/wgb/wgbview.dbm?owner=Shadowelf"]:
            collector.accept({"type": "candidate", "row": 1, "crawlDate": "20000101", "source": source, "target": target})
        class Response(io.BytesIO):
            url = "https://web.archive.org/web/20000101000000id_/" + source
        body = b'<a href="http://www.geocities.com/SiliconValley/Park/8099/">omitted visitor text</a>'
        result = collector.snapshot()
        with patch.object(graph, "open_archive", return_value=Response(body)):
            graph.validate_sources(result, collector)
        self.assertEqual([edge["sourcePageVerified"] for edge in result["matches"]], [True, False])
        self.assertEqual(result["verifiedSourcePages"], 1)
        self.assertNotIn("omitted visitor text", json.dumps(result))

    def test_parallel_ranges_are_consumed_in_order_and_do_not_write_payloads(self):
        body = bytes(range(100))
        calls = []
        def fake(url, start, end, size):
            calls.append((start, end, size))
            return body[start:end + 1]
        result = b"".join(graph.ranged_chunks("https://archive.org/synthetic", len(body), fetch=fake, part=9, workers=4))
        self.assertEqual(result, body)
        self.assertEqual(sorted(calls), [(start, min(99, start + 8), 100) for start in range(0, 100, 9)])

    def test_url_evidence_redacts_contacts_and_rejects_credentials_controls_and_bad_ports(self):
        row = graph.public_url("http://www.geocities.com/visitor%40example.invalid/geobook.html?email=visitor@example.invalid#fragment")
        self.assertTrue(row["pathRedacted"])
        self.assertTrue(row["queryRedacted"])
        self.assertNotIn("visitor", json.dumps(row))
        for value in ["http://user:password@geocities.com/SiliconValley/Park/8099/", "http://geocities.com:81/SiliconValley/Park/8099/", "http://geocities.com/a\nb", "javascript:alert(1)"]:
            self.assertIsNone(graph.public_url(value))

    def test_retained_edge_limit_never_stops_counting_or_becomes_an_exhaustive_edge_list(self):
        collector = graph.EdgeCollector(maximum=1)
        for i in range(3):
            collector.accept({"type": "candidate", "row": i + 1, "crawlDate": "20000101", "source": f"http://www.geocities.com/Elsewhere/{i}/", "target": "http://www.geocities.com/SiliconValley/Park/8099/"})
        receipt = collector.snapshot()
        self.assertEqual(receipt["counts"]["inboundSiteRows"], 3)
        self.assertEqual(receipt["counts"]["retainedEdgeLimitOmissions"], 2)
        self.assertEqual(len(receipt["matches"]), 1)


if __name__ == "__main__":
    unittest.main()
