#!/usr/bin/env python3
"""Bounded public-archive follow-up. No JS, live guestbook submissions or raw-page output.

Run the four stages in order. Only safe target links/form metadata are retained;
third-party guestbook content stays in memory, never in logs or artifacts.
Network errors are observations, not evidence that a backlink is absent.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import time
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qsl, quote, unquote, urljoin, urlsplit, urlunsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener

MAX_BODY = 2 * 1024 * 1024
MAX_TOTAL = 24 * 1024 * 1024
MAX_SECONDS = 240
HOSTS = frozenset({"web.archive.org", "archive.org", "www.geocities.ws", "www.oocities.org"})
TARGET_PATH = "/siliconvalley/park/8099"
TARGET_HOSTS = frozenset({"geocities.com", "geocities.ws", "oocities.org", "reocities.com"})
BOOK_HOSTS = frozenset({"lpage.com", "saturn.guestworld.com", "saturn.guestworld.tripod.lycos.com"})
FORBIDDEN = re.compile(r"(?:manage|private|sign|login|admin|recover|delete|remove)", re.I)
PAGINATION_FIELD = re.compile(r"(?:start|first|last|offset|page|count|entries|records|num|n|next|previous)", re.I)
BARRIER = re.compile(r"(?:access denied|bad gateway|verify you are human|too many requests|temporarily unavailable|captcha challenge|doesn't have that page archived)", re.I)


def cdx(original: str, prefix: bool = False) -> str:
    return ("https://web.archive.org/cdx/search/cdx?url=" + quote(original, safe="") +
            ("&matchType=prefix" if prefix else "") +
            "&output=json&fl=timestamp%2Coriginal%2Cstatuscode&collapse=urlkey&limit=100")


SOURCES = (
    (1, "original-ring-code", "html", "https://web.archive.org/web/19991008031725id_/http://www.geocities.com:80/SiliconValley/Park/8099/sites.htm"),
    (1, "ring-hub-index", "cdx", cdx("http://www.geocities.com/SiliconValley/Lakes/6418/", True)),
    (1, "ring-next-five", "cdx", cdx("http://www.webring.org/cgi-bin/webring?ring=conquer&id=4&next5")),
    (1, "ring-skip", "cdx", cdx("http://www.webring.org/cgi-bin/webring?ring=conquer&id=4&skip")),
    (1, "ring-nav-org-list", "cdx", cdx("http://nav.webring.org/cgi-bin/navcgi?ring=conquer;list")),
    (1, "ring-com-list", "cdx", cdx("http://www.webring.com/cgi-bin/webring?ring=conquer&list")),
    (1, "ring-dir-list", "cdx", cdx("http://dir.webring.org/rw?ring=conquer;list")),
    (2, "home-hearth-complete", "html", "https://www.geocities.ws/Heartland/Hills/3678/jan98.html"),
    (2, "linux-guestbook-complete", "html", "https://www.oocities.org/siliconvalley/lab/6582/geobook.html"),
    (2, "ariadne-guestbook", "html", "https://www.oocities.org/siliconvalley/6895/geobook.html"),
    (3, "guestbook-may-control", "html", "https://web.archive.org/web/20000525201144id_/http://www.lpage.com:80/wgb/wgbview.dbm?owner=Shadowelf"),
    (3, "guestbook-june-control", "html", "https://web.archive.org/web/20000619172234id_/http://www.lpage.com:80/wgb/wgbview.dbm?owner=Shadowelf"),
    (4, "reocities-metadata", "metadata", "https://archive.org/metadata/REOCITIES.archiveteam_geocities"),
    (4, "derivatives-metadata", "metadata", "https://archive.org/metadata/geocities-webarchive-collection-derivatives"),
    (4, "torrent-catalog-metadata", "metadata", "https://archive.org/metadata/academictorrents_2dc18f47afee0307e138dab3015ee7e5154766f6"),
)


def safe_request_url(url: str) -> str:
    parts = urlsplit(url)
    if (parts.scheme != "https" or parts.hostname not in HOSTS or parts.username or
            parts.password or parts.port not in (None, 443)):
        raise ValueError("Network destination is outside the fixed HTTPS archive allowlist")
    return url


class ArchiveRedirect(HTTPRedirectHandler):
    max_redirections = 3

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        safe_request_url(newurl)
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def original_url(value: str, base: str = "") -> str:
    absolute = urljoin(base, value)
    # Remove only an actual Wayback replay wrapper, not a lookalike hostname.
    parts = urlsplit(absolute)
    if parts.hostname == "web.archive.org":
        match = re.match(r"^/web/[^/]+/(https?://.+)$", parts.path)
        if match:
            return match.group(1) + ("?" + parts.query if parts.query else "")
    return absolute


def target_link(value: str, base: str = "") -> dict | None:
    try:
        parts = urlsplit(original_url(value, base))
        if parts.scheme not in ("http", "https") or parts.username or parts.password:
            return None
        host = (parts.hostname or "").removeprefix("www.").lower()
        path = unquote(parts.path).rstrip("/").lower()
        if host in TARGET_HOSTS and (path == TARGET_PATH or path.startswith(TARGET_PATH + "/")):
            return {"kind": "site", "target": "http://www.geocities.com/SiliconValley/Park/8099/"}
        query = dict(parse_qsl(parts.query))
        if (host in BOOK_HOSTS and path == "/wgb/wgbview.dbm" and
                not FORBIDDEN.search(parts.query) and query.get("owner", "").lower() == "shadowelf"):
            return {"kind": "guestbook", "target": "http://www.lpage.com/wgb/wgbview.dbm?owner=Shadowelf"}
    except (ValueError, UnicodeError):
        pass
    return None


class PublicPage(HTMLParser):
    def __init__(self, base: str):
        super().__init__(convert_charrefs=True)
        self.base = base
        self.links = []
        self.ring_links = []
        self.forms = []
        self.form = None
        self.ignored_depth = 0
        self.text_tail = ""
        self.plain_mentions = set()

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag in ("script", "style"):
            self.ignored_depth += 1
        if self.ignored_depth:
            return
        if tag == "a" and attrs.get("href"):
            value = attrs["href"]
            found = target_link(value, self.base)
            if found:
                # Retain the canonical target, not arbitrary query fields,
                # link labels, surrounding entries or visitor contacts.
                self.links.append(found)
            original = original_url(value, self.base)
            parts = urlsplit(original)
            fields = dict(parse_qsl(parts.query.replace(";", "&"), keep_blank_values=True))
            if ((parts.hostname or "").removeprefix("www.") in {"webring.org", "webring.com", "nav.webring.org", "dir.webring.org"}
                    and fields.get("ring") == "conquer" and fields.get("id") == "4"):
                self.ring_links.append({"ring": "conquer", "id": "4", "actions": sorted(set(fields) & {"prev", "skip", "next5", "next", "random"})})
        if tag == "form":
            action = original_url(attrs.get("action", ""), self.base)
            parts = urlsplit(action)
            host = (parts.hostname or "").removeprefix("www.").lower()
            public_view = (parts.scheme in ("http", "https") and host in BOOK_HOSTS and
                           not parts.username and not parts.password and parts.path.lower() == "/wgb/wgbview.dbm")
            self.form = {"method": "POST" if attrs.get("method", "get").lower() == "post" else "GET",
                         "action": urlunsplit((parts.scheme, parts.netloc, parts.path, "", "")) if public_view else "",
                         "fields": []}
            if not public_view or FORBIDDEN.search(parts.path + "?" + parts.query):
                self.form["refused"] = True
        if self.form is not None and tag in ("input", "select", "button"):
            name = attrs.get("name", "")
            if not re.fullmatch(r"[A-Za-z0-9_-]{1,64}", name):
                return
            value = attrs.get("value", "")
            field_type = attrs.get("type", tag).lower()
            field = {"name": name, "type": field_type if field_type in {"hidden", "text", "submit", "button", "select", "number"} else tag}
            if name.lower() == "owner" and value.lower() == "shadowelf":
                field["value"] = "Shadowelf"
            elif PAGINATION_FIELD.fullmatch(name) and re.fullmatch(r"[0-9]{1,6}", value):
                field["value"] = value
            if name.lower() == "action" and FORBIDDEN.search(value):
                self.form["refused"] = True
            self.form["fields"].append(field)

    def handle_endtag(self, tag):
        if tag in ("script", "style") and self.ignored_depth:
            self.ignored_depth -= 1
        if tag == "form" and self.form is not None:
            action_path = urlsplit(self.form["action"]).path.lower()
            if not self.form.get("refused") and action_path.endswith("/wgb/wgbview.dbm"):
                self.forms.append(self.form)
            self.form = None

    def handle_data(self, data):
        if self.ignored_depth:
            return
        combined = self.text_tail + data
        if re.search(r"siliconvalley/park/8099(?:/|\b)", combined, re.I):
            self.plain_mentions.add("SiliconValley/Park/8099")
        if re.search(r"owner=shadowelf(?:\b|&)", combined, re.I):
            self.plain_mentions.add("owner=Shadowelf")
        self.text_tail = combined[-128:]

    def report(self):
        return {"targetLinks": self.links, "ringNavigation": self.ring_links,
                "publicViewForms": self.forms, "plainMentions": sorted(self.plain_mentions),
                "inspection": "Entire fetched body parsed without executing scripts; no visitor text/contacts retained"}


def inspect_html(body: bytes, url: str) -> dict:
    parser = PublicPage(url)
    parser.feed(body.decode("utf-8", errors="replace"))
    parser.close()
    report = parser.report()
    text = body.decode("utf-8", errors="replace")
    report["guestbookMarkerObserved"] = bool(re.search(r"guest\s*book|guestworld|lpage|home\s*(?:&|and|&amp;)\s*hearth", text, re.I))
    report["accessBarrierDetected"] = bool(BARRIER.search(text))
    return report


class Fetcher:
    def __init__(self):
        self.opener = build_opener(ArchiveRedirect())
        self.started = time.monotonic()
        self.total = 0

    def get(self, url, maximum=MAX_BODY):
        safe_request_url(url)
        if time.monotonic() - self.started > MAX_SECONDS or self.total >= MAX_TOTAL:
            return {"outcome": "not-attempted-budget"}, None
        try:
            req = Request(url, headers={"User-Agent": "Html5-public-archive-audit/1.0", "Accept-Encoding": "identity"})
            with self.opener.open(req, timeout=12) as response:
                safe_request_url(response.url)
                body = response.read(min(maximum, MAX_TOTAL - self.total) + 1)
                self.total += len(body)
                if len(body) > maximum or self.total > MAX_TOTAL:
                    return {"outcome": "size-limit"}, None
                return {"outcome": "fetched", "httpStatus": response.status, "resolvedUrl": response.url,
                        "bytes": len(body), "contentType": response.headers.get_content_type(),
                        "responseBodySha256": hashlib.sha256(body).hexdigest(),
                        "hashScope": "Runner-fetched HTTP response bytes, not a CDX digest comparison"}, body
        except HTTPError as error:
            return {"outcome": "http-error", "httpStatus": error.code}, None
        except (URLError, TimeoutError, OSError, ValueError):
            return {"outcome": "fetch-error"}, None


def metadata_summary(data):
    files = data.get("files", []) if isinstance(data, dict) else []
    candidates = [{"name": item["name"], "size": str(item.get("size", "unknown"))}
                  for item in files if isinstance(item, dict) and isinstance(item.get("name"), str)
                  and re.search(r"(?:index|manifest|link|graph|cdx|\.torrent$)", item["name"], re.I)]
    return {"fileRecords": len(files), "smallIndexCandidates": candidates[:20],
            "bulkPayloadsDownloaded": False, "backlinkGraphSearched": False,
            "limitation": "File metadata only. Catalog presence is not target-site inclusion or a file-content search."}


def run_audit(fetcher=None):
    fetcher = fetcher or Fetcher()
    results = []
    for stage, identifier, kind, url in SOURCES:
        receipt, body = fetcher.get(url)
        row = {"stage": stage, "id": identifier, "kind": kind, "requestedUrl": url, **receipt}
        if body is not None:
            try:
                if kind == "html":
                    row.update(inspect_html(body, url))
                elif kind == "cdx":
                    data = json.loads(body)
                    row["cdxRows"] = data[:101] if isinstance(data, list) else []
                else:
                    row.update(metadata_summary(json.loads(body)))
            except (ValueError, TypeError, KeyError):
                row["outcome"] = "unparseable-response"
        results.append(row)
    controls = [row for row in results if row["stage"] == 3]
    positive = all(row.get("targetLinks") for row in controls)
    candidates = [row for row in results if row["stage"] == 2]
    return {"schemaVersion": 1, "stageOrder": [1, 2, 3, 4], "sources": results,
            "positiveGuestbookControlsPassed": bool(positive),
            "fullyFetchedCandidatePages": [row["id"] for row in candidates if row.get("outcome") == "fetched" and row.get("guestbookMarkerObserved") and not row.get("accessBarrierDetected")],
            "candidatePagesWithTargetLinks": [row["id"] for row in candidates if row.get("targetLinks")],
            "privateOrManagementRequests": 0, "rawBodiesSaved": False,
            "limits": {"perResponseBytes": MAX_BODY, "totalBytes": MAX_TOTAL, "seconds": MAX_SECONDS},
            "limitations": ["HTTP success/CI success alone is not positive research evidence; inspect source receipts and controls.",
                            "Negative results apply only to completely parsed fetched pages, not all backups or indexes.",
                            "Public form fields are metadata, not proof archived pagination works. No form was submitted.",
                            "Bulk collection metadata is not a search of WARC/WAT/link-graph contents."]}


def emit_actions_annotations(result):
    """Expose sanitized observations via Checks API when artifact CDN is unreachable.

    Workflow commands are escaped so a remote metadata value cannot inject a
    second command. Oversized annotations are explicitly marked, never silently
    treated as a complete receipt; the full sanitized JSON remains the artifact.
    """
    # GitHub retains only ten notice annotations per step, even if the API
    # requests 100. Group by the fixed four stages so the summary/controls survive.
    rows = [(f"archive-stage-{stage}", {"stage": stage, "sources": [row for row in result["sources"] if row["stage"] == stage]})
            for stage in (1, 2, 3, 4)]
    rows.append(("audit-summary", {key: value for key, value in result.items() if key != "sources"}))
    for title, row in rows:
        encoded = json.dumps(row, ensure_ascii=True, separators=(",", ":"))
        if len(encoded) > 32768:
            encoded = json.dumps({"id": title, "outcome": row.get("outcome"), "annotationTruncated": True,
                                  "limitation": "Read the sanitized artifact for the complete source observation"})
        encoded = encoded.replace("%", "%25").replace("\r", "%0D").replace("\n", "%0A")
        print(f"::notice title={title}::{encoded}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--actions-annotations", action="store_true", help="Also emit sanitized receipts through the Checks API")
    args = parser.parse_args()
    result = run_audit()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    args.output.chmod(0o600)
    for row in result["sources"]:
        print(f"stage {row['stage']} {row['id']}: {row['outcome']}; target links {len(row.get('targetLinks', []))}")
    print("Positive guestbook controls:", result["positiveGuestbookControlsPassed"])
    if args.actions_annotations:
        emit_actions_annotations(result)


if __name__ == "__main__":
    main()
