#!/usr/bin/env python3
"""Source-check and stream-search the public GeoCities URL graph, never its anchors.

Only the fixed public Internet Archive item is fetched. Raw graph/page content
is never written or logged. Metadata/check annotations are public, sanitized
observations; graph edges are leads, not source-page-verified backlinks.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import re
import sys
import time
import zlib
from pathlib import Path
from urllib.parse import quote, urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener

ITEM = "geocities-webarchive-collection-derivatives"
METADATA_URL = "https://archive.org/metadata/" + ITEM
GRAPH_FILES = ("geocities-webgraph.csv.gz", "v2/geocities-webgraph.csv.gz", "v3/geocities-webgraph.csv.gz")
SCHEMAS = (("crawl_date", "src", "dest", "anchor"), ("crawl_date", "source", "target", "anchor_text"))
MAX_COMPRESSED = 24 * 1024**3
MAX_UNCOMPRESSED = 512 * 1024**3
PREFIX_BYTES = 1024 * 1024
BLOCK_BYTES = 2 * 1024 * 1024


def archive_url(url):
    parts = urlsplit(url)
    host = (parts.hostname or "").lower()
    if (parts.scheme != "https" or not (host == "archive.org" or host.endswith(".archive.org")) or
            parts.username or parts.password or parts.port not in (None, 443)):
        raise ValueError("Only public HTTPS archive.org destinations are allowed")
    return url


class ArchiveRedirect(HTTPRedirectHandler):
    max_redirections = 5

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        archive_url(newurl)
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def open_archive(url, headers=None):
    archive_url(url)
    request = Request(url, headers={"User-Agent": "Html5-public-GeoCities-graph-research/1.0", "Accept-Encoding": "identity", **(headers or {})})
    response = build_opener(ArchiveRedirect()).open(request, timeout=60)
    archive_url(response.url)
    return response


def graph_metadata(body, selected):
    data = json.loads(body)
    if not isinstance(data, dict) or not isinstance(data.get("files"), list):
        raise ValueError("No file metadata was obtained")
    files = [{key: row[key] for key in ("name", "size", "md5", "sha1", "mtime", "format", "source") if key in row}
             for row in data["files"] if row.get("name") in GRAPH_FILES]
    match = next((row for row in files if row["name"] == selected), None)
    if (not match or not str(match.get("size", "")).isdigit() or
            not 0 < int(match["size"]) <= MAX_COMPRESSED or
            not re.fullmatch(r"[a-f0-9]{40}", match.get("sha1", "")) or
            not re.fullmatch(r"[a-f0-9]{32}", match.get("md5", ""))):
        raise ValueError("The selected graph lacks bounded size and exact checksum metadata")
    return {"item": ITEM, "metadataUrl": METADATA_URL, "metadataResponseSha256": hashlib.sha256(body).hexdigest(),
            "graphFiles": files, "selectedFile": match,
            "datasetVersionCaution": "The item description calls the collection v3. That does not establish that its unversioned file is v3; each path/digest is kept distinct.",
            "checksumCaution": "Archive metadata is a publisher claim; full streamed transfer must match its size, MD5 and SHA-1. This is not an independent authenticity signature."}


def get_metadata(selected):
    with open_archive(METADATA_URL) as response:
        body = response.read(BLOCK_BYTES + 1)
    if len(body) > BLOCK_BYTES:
        raise ValueError("Metadata response exceeded its limit")
    return graph_metadata(body, selected)


def probe_prefix(body):
    decoder = zlib.decompressobj(16 + zlib.MAX_WBITS)
    expanded = decoder.decompress(body, BLOCK_BYTES)
    # TextIOWrapper decodes incrementally: a prefix ending halfway through an
    # unrelated later UTF-8 character must not invalidate an ASCII header.
    text = io.TextIOWrapper(io.BytesIO(expanded), encoding="utf-8", errors="strict", newline="")
    first = next(csv.reader(text), [])
    recognized = tuple(first) in SCHEMAS
    return {"header": first if recognized else None, "recognizedHeader": recognized,
            "firstRecordColumnCount": len(first),
            "firstFieldLooksLikeCrawlDate": bool(first and re.fullmatch(r"\d{8}(?:\d{6})?", first[0])),
            "firstRecordFieldHashes": [] if recognized else [hashlib.sha256(value.encode()).hexdigest() for value in first[:4]],
            "prefixCompressedBytes": len(body), "prefixCompressedSha256": hashlib.sha256(body).hexdigest(),
            "prefixUncompressedBytes": len(expanded), "completeGraphSearched": False,
            "limitation": "Header/prefix inspection only, not a search of the complete graph or any absence finding"}


def probe(selected):
    metadata = get_metadata(selected)
    url = "https://archive.org/download/" + ITEM + "/" + quote(selected, safe="/")
    with open_archive(url, {"Range": f"bytes=0-{PREFIX_BYTES - 1}"}) as response:
        content_range = response.headers.get("Content-Range", "")
        if response.status == 206 and not content_range.startswith("bytes 0-"):
            raise ValueError("Prefix response did not begin at byte zero")
        body = response.read(PREFIX_BYTES)
        transport = {"httpStatus": response.status, "contentRange": content_range, "resolvedHost": urlsplit(response.url).hostname}
    return {"schemaVersion": 1, "mode": "probe", **metadata, "downloadUrl": url, "transport": transport, **probe_prefix(body),
            "rawPayloadSaved": False, "visitorContactsOrAnchorTextSaved": False}


def write_receipt(path, result):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    path.chmod(0o600)


def notice(title, result):
    encoded = json.dumps(result, ensure_ascii=True, separators=(",", ":"))
    if len(encoded) > 3500:
        encoded = json.dumps({"annotationTruncated": True, "limitation": "Full sanitized receipt required; never interpret this as complete evidence"})
    print("::notice title=" + title + "::" + encoded.replace("%", "%25").replace("\r", "%0D").replace("\n", "%0A"), flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--file", choices=GRAPH_FILES, default=GRAPH_FILES[0])
    parser.add_argument("--probe", action="store_true", required=True)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--actions-annotations", action="store_true")
    args = parser.parse_args()
    result = probe(args.file)
    write_receipt(args.output, result)
    if args.actions_annotations:
        notice("graph-probe", result)
    else:
        print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
