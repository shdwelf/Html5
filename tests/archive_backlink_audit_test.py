"""Synthetic offline controls only; never fetch third-party pages in unit tests."""
import importlib.util
import io
import json
import unittest
from contextlib import redirect_stdout
from pathlib import Path

spec = importlib.util.spec_from_file_location("archive_audit", Path(__file__).parents[1] / "tools/archive-backlink-audit.py")
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)


class ArchiveAuditTests(unittest.TestCase):
    def test_exact_targets_not_other_neighborhoods_lookalikes_or_private_actions(self):
        for value in ["http://www.geocities.com/SiliconValley/Park/8099/",
                      "https://www.oocities.org/siliconvalley/park/8099/intro.htm",
                      "https://web.archive.org/web/20000525201144id_/http://www.geocities.com:80/SiliconValley/Park/8099"]:
            self.assertEqual(audit.target_link(value)["kind"], "site")
        self.assertEqual(audit.target_link("http://www.lpage.com/wgb/wgbview.dbm?owner=Shadowelf")["kind"], "guestbook")
        for value in ["http://geocities.com/TimesSquare/8099/", "http://geocities.com/SiliconValley/Park/80999/",
                      "http://evil.geocities.com/SiliconValley/Park/8099/", "https://geocities.com.evil.invalid/SiliconValley/Park/8099/",
                      "http://www.lpage.com/wgb/wgbsign.dbm?owner=Shadowelf", "http://www.lpage.com/wgb/wgbview.dbm?owner=Other",
                      "http://saturn.guestworld.com/gear/gateway.cfm?action=private&owner=Shadowelf",
                      "javascript:alert('SiliconValley/Park/8099')", "http://user:pass@geocities.com/SiliconValley/Park/8099/"]:
            self.assertIsNone(audit.target_link(value), value)

    def test_complete_body_scan_redacts_contacts_labels_queries_and_scripts(self):
        page = ("<html>" + "<p>other visitor</p>" * 40000 +
                '<a href="http://www.geocities.com/SiliconValley/Park/8099/?email=visitor@example.invalid">Visitor Contact</a>' +
                '<script>const hidden="http://www.lpage.com/wgb/wgbview.dbm?owner=Shadowelf";</script>' +
                '<p>SiliconValley/Park/8099</p></html>').encode()
        report = audit.inspect_html(page, "https://www.geocities.ws/Heartland/Hills/3678/jan98.html")
        self.assertEqual(len(report["targetLinks"]), 1, "late-body links must not be missed by an excerpt limit")
        self.assertEqual(report["plainMentions"], ["SiliconValley/Park/8099"])
        encoded = json.dumps(report)
        for forbidden in ["visitor@example.invalid", "Visitor Contact", "other visitor", "email="]:
            self.assertNotIn(forbidden, encoded)

    def test_public_pagination_metadata_only_no_management_or_private_forms(self):
        report = audit.inspect_html(b'''
          <form action="http://www.lpage.com/wgb/wgbview.dbm?owner=Shadowelf" method="post">
            <input name="owner" type="hidden" value="Shadowelf"><input name="first" value="240">
            <input name="email" value="visitor@example.invalid"><select name="jump"></select>
          </form>
          <form action="http://saturn.guestworld.com/gear/gateway.cfm?action=private"><input name="owner" value="Shadowelf"></form>
          <form action="http://www.lpage.com/wgb/wgbview.dbm"><input name="action" value="manage"></form>
        ''', "https://web.archive.org/web/20000525201144id_/http://www.lpage.com/wgb/wgbview.dbm?owner=Shadowelf")
        self.assertEqual(len(report["publicViewForms"]), 1)
        form = report["publicViewForms"][0]
        self.assertEqual(form["method"], "POST")
        self.assertEqual(form["fields"][0]["value"], "Shadowelf")
        self.assertEqual(form["fields"][1]["value"], "240")
        self.assertNotIn("value", form["fields"][2])
        self.assertNotIn("visitor@example.invalid", json.dumps(report))

    def test_raw_replay_root_relative_actions_use_the_original_not_archive_origin(self):
        base = "https://web.archive.org/web/20000525201144id_/http://www.lpage.com:80/wgb/wgbview.dbm?owner=Shadowelf"
        self.assertEqual(audit.original_url("/wgb/wgbview.dbm", base), "http://www.lpage.com:80/wgb/wgbview.dbm")
        report = audit.inspect_html(b'<form action="/wgb/wgbview.dbm"><input name="owner" value="Shadowelf"><input name="offset" value="10"></form>', base)
        self.assertEqual(report["formTagsSeen"], 1)
        self.assertEqual(report["refusedForms"], 0)
        self.assertEqual(report["publicViewForms"][0]["action"], "http://www.lpage.com:80/wgb/wgbview.dbm")
        self.assertEqual(report["publicViewForms"][0]["fields"][1]["value"], "10")

    def test_ring_identity_requires_exact_ring_and_member(self):
        report = audit.inspect_html(b'''
          <a href="http://www.webring.org/cgi-bin/webring?ring=conquer&amp;id=4&amp;next5">Next</a>
          <a href="http://www.webring.org/cgi-bin/webring?ring=other&amp;id=4&amp;next">Other</a>
          <a href="http://www.webring.org/cgi-bin/webring?ring=conquer&amp;id=40&amp;next">Other</a>
        ''', "https://example.invalid/")
        self.assertEqual(report["ringNavigation"], [{"ring": "conquer", "id": "4", "actions": ["next5"]}])

    def test_network_allowlist_and_no_bulk_file_downloads(self):
        for url in ["http://archive.org/", "https://archive.org.evil.invalid/", "https://127.0.0.1/",
                    "https://user:pass@archive.org/", "https://archive.org:8443/", "https://www.lpage.com/wgb/wgbsign.dbm"]:
            with self.assertRaises(ValueError):
                audit.safe_request_url(url)
        for _, _, _, url in audit.SOURCES:
            audit.safe_request_url(url)
        summary = audit.metadata_summary({"files": [{"name": "SiliconValley.7z", "size": "1000000000"},
                                                       {"name": "index.txt", "size": "1200"}]})
        self.assertEqual(summary["fileRecords"], 2)
        self.assertEqual(summary["smallIndexCandidates"], [{"name": "index.txt", "size": "1200"}])
        self.assertFalse(summary["backlinkGraphSearched"])
        self.assertFalse(summary["bulkPayloadsDownloaded"])

    def test_stages_run_in_order_and_failures_are_not_successful_scans(self):
        calls = []

        class Unavailable:
            def get(self, url):
                calls.append(url)
                return {"outcome": "fetch-error"}, None

        report = audit.run_audit(Unavailable())
        self.assertEqual(calls, [row[3] for row in audit.SOURCES])
        self.assertEqual([row["stage"] for row in report["sources"]], sorted(row[0] for row in audit.SOURCES))
        self.assertEqual(report["fullyFetchedCandidatePages"], [])
        self.assertFalse(report["positiveGuestbookControlsPassed"])
        self.assertFalse(report["rawBodiesSaved"])
        self.assertEqual(report["privateOrManagementRequests"], 0)

    def test_http_200_barrier_is_not_a_completed_guestbook_inspection(self):
        class Barrier:
            def get(self, url):
                return {"outcome": "fetched", "httpStatus": 200}, b"<html>Guestbook: verify you are human</html>"

        report = audit.run_audit(Barrier())
        self.assertEqual(report["fullyFetchedCandidatePages"], [])
        self.assertFalse(report["positiveGuestbookControlsPassed"])

    def test_private_lookalike_forms_and_numeric_contact_values_are_not_retained(self):
        self.assertIsNone(audit.target_link("http://www.lpage.com/wgb/wgbview.dbm?owner=Shadowelf&action=private"))
        report = audit.inspect_html(b'''
          <form action="https://evil.invalid/visitor@example.invalid/wgb/wgbview.dbm"><input name="first" value="10"></form>
          <form action="http://www.lpage.com/wgb/wgbview.dbm"><input name="phone" value="123456"></form>
        ''', "https://example.invalid/")
        self.assertEqual(len(report["publicViewForms"]), 1)
        self.assertNotIn("value", report["publicViewForms"][0]["fields"][0])
        self.assertNotIn("visitor@example.invalid", json.dumps(report))

    def test_actual_form_controls_get_separate_bounded_notices_not_one_truncated_stage(self):
        rows = [{"stage": 3, "id": name, "publicViewForms": [{"syntheticFieldProjection": "x" * 2000}]} for name in ("may", "june")]
        output = io.StringIO()
        with redirect_stdout(output):
            audit.emit_actions_annotations({"sources": rows})
        lines = output.getvalue().splitlines()
        self.assertEqual(len(lines), 6)
        self.assertIn("title=archive-stage-3-may::", lines[2])
        self.assertIn("title=archive-stage-3-june::", lines[3])
        self.assertNotIn("annotationTruncated", output.getvalue())

    def test_check_annotations_escape_remote_workflow_commands_and_bound_receipts(self):
        result = {"sources": [{"stage": 1, "id": "synthetic", "value": "%0A\n::error::injection"}], "rawBodiesSaved": False}
        output = io.StringIO()
        with redirect_stdout(output):
            audit.emit_actions_annotations(result)
        lines = output.getvalue().splitlines()
        self.assertEqual(len(lines), 5, "stay below GitHub's ten-notices-per-step cap")
        self.assertTrue(lines[0].startswith("::notice title=archive-stage-1::"))
        self.assertIn("%250A", lines[0])
        self.assertIn("\\n::error::injection", lines[0])
        self.assertTrue(lines[4].startswith("::notice title=audit-summary::"))
        output = io.StringIO()
        with redirect_stdout(output):
            audit.emit_actions_annotations({"sources": [{"stage": 4, "id": "large", "value": "x" * 4000}]})
        self.assertIn('"annotationTruncated": true', output.getvalue())


if __name__ == "__main__":
    unittest.main()
