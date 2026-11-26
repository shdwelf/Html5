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
import subprocess
import threading
from concurrent.futures import ThreadPoolExecutor
import time
import zlib
from pathlib import Path
from urllib.parse import quote, unquote, urlsplit, urlunsplit
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


def audit_tools():
    import importlib.util
    path = Path(__file__).with_name("archive-backlink-audit.py")
    spec = importlib.util.spec_from_file_location("public_archive_audit", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


AUDIT = audit_tools()


def public_url(value):
    """Drop queries/fragments/contacts; preserve a hash of the full observed URL."""
    if not isinstance(value, str) or len(value) > 16384 or re.search(r"[\x00-\x20\x7f]", value):
        return None
    try:
        original = AUDIT.original_url(value)
        parts = urlsplit(original)
        if parts.scheme not in ("http", "https") or not parts.hostname or parts.username or parts.password or parts.port not in (None, 80, 443):
            return None
        path = parts.path or "/"
        redacted_path = "@" in unquote(path) or bool(re.search(r"(?:password|token|session|private)", path, re.I))
        safe_path = "/[redacted-public-path]" if redacted_path else path
        safe_query = "owner=Shadowelf" if AUDIT.target_link(original) and AUDIT.target_link(original)["kind"] == "guestbook" else ""
        safe = urlunsplit((parts.scheme, parts.netloc, safe_path, safe_query, ""))
        return {"url": safe, "urlSha256": hashlib.sha256(original.encode()).hexdigest(),
                "queryRedacted": bool(parts.query and parts.query != safe_query), "pathRedacted": redacted_path}
    except (ValueError, UnicodeError):
        return None


class EdgeCollector:
    def __init__(self, maximum=256):
        self.lock = threading.Lock()
        self.maximum = maximum
        self.matches = {}
        self.source_inputs = {}  # Ephemeral, public URLs only; never serialized.
        self.counts = {"candidateRows": 0, "inboundSiteRows": 0, "inboundGuestbookRows": 0,
                       "selfLinkRows": 0, "originalSourceRows": 0, "unrelatedCandidateRows": 0, "retainedEdgeLimitOmissions": 0}
        self.stats = {}
        self.progress = {}
        self.error = None
        self.header = False

    def accept(self, row):
        kind = row.get("type")
        if kind == "header":
            self.header = row.get("recognized") is True
        elif kind == "stats":
            self.stats = {key: row[key] for key in ("csvComplete", "rows", "candidateRows", "repeatedHeaders", "blankRecords", "uncompressedBytes")}
        elif kind == "progress":
            self.progress = {key: row[key] for key in ("rows", "uncompressedBytes")}
        elif kind == "error":
            self.error = row.get("code", "native-parser-error")
        elif kind == "candidate":
            source = public_url(row["source"])
            target = public_url(row["target"])
            source_match = AUDIT.target_link(row["source"]) if source else None
            target_match = AUDIT.target_link(row["target"]) if target else None
            self.counts["candidateRows"] += 1
            if source_match:
                self.counts["originalSourceRows"] += 1
            if target_match and source_match:
                self.counts["selfLinkRows"] += 1
            elif target_match and source:
                label = "inboundSiteRows" if target_match["kind"] == "site" else "inboundGuestbookRows"
                self.counts[label] += 1
                date = row.get("crawlDate", "")
                date = date if re.fullmatch(r"\d{8}(?:\d{6})?", date) else None
                key = (date, source["urlSha256"], target["urlSha256"])
                if key in self.matches:
                    self.matches[key]["duplicateRows"] += 1
                elif len(self.matches) < self.maximum:
                    self.matches[key] = {"crawlDate": date, "source": source, "target": target,
                                         "targetKind": target_match["kind"], "row": row["row"], "duplicateRows": 0,
                                         "sourcePageVerified": False, "evidence": "URL-graph edge candidate, not proof of independent ownership or a verified source page"}
                    self.source_inputs[source["urlSha256"]] = (row["source"], date)
                else:
                    self.counts["retainedEdgeLimitOmissions"] += 1
            else:
                self.counts["unrelatedCandidateRows"] += 1
        else:
            raise ValueError("Invalid native scanner protocol")

    def read(self, stream):
        try:
            while True:
                line = stream.readline(262145)
                if not line:
                    break
                if len(line) > 262144 or not line.endswith(b"\n"):
                    raise ValueError("Native scanner response exceeded its framing bound")
                row = json.loads(line)
                with self.lock:
                    self.accept(row)
        except (ValueError, KeyError, TypeError, UnicodeError):
            with self.lock:
                self.error = "invalid-native-response"

    def snapshot(self):
        with self.lock:
            return {"counts": dict(self.counts), "matches": [dict(row) for row in self.matches.values()],
                    "nativeStats": dict(self.stats), "lastNativeProgress": dict(self.progress),
                    "nativeHeaderRecognized": self.header, "nativeError": self.error}


def scan_chunks(chunks, metadata, scanner, checkpoint=None, max_seconds=5400):
    started = time.monotonic()
    expected = metadata["selectedFile"]
    hashes = {name: hashlib.new(name) for name in ("md5", "sha1", "sha256")}
    compressed = 0
    expanded_bytes = 0
    members = 0
    decoder = None
    error = None
    input_eof = False
    collector = EdgeCollector()
    process = subprocess.Popen([str(scanner)], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    reader = threading.Thread(target=collector.read, args=(process.stdout,), daemon=True)
    reader.start()
    next_checkpoint = 64 * 1024**2

    def partial():
        return {"schemaVersion": 1, "mode": "scan", "selectedFile": expected,
                "compressedBytesScanned": compressed, "uncompressedBytesScanned": expanded_bytes,
                "gzipMembersCompleted": members, "elapsedSeconds": round(time.monotonic() - started, 3),
                "completeGraphSearched": False, "rawPayloadSaved": False, "visitorContactsOrAnchorTextSaved": False,
                **collector.snapshot()}

    try:
        for network_block in chunks:
            for offset in range(0, len(network_block), BLOCK_BYTES):
                if time.monotonic() - started > max_seconds:
                    raise TimeoutError("scan-time-limit")
                block = network_block[offset:offset + BLOCK_BYTES]
                compressed += len(block)
                if compressed > int(expected["size"]) or compressed > MAX_COMPRESSED:
                    raise ValueError("compressed-byte-limit")
                for digest in hashes.values():
                    digest.update(block)
                pending = block
                while pending:
                    if decoder is None:
                        decoder = zlib.decompressobj(16 + zlib.MAX_WBITS)
                    expanded = decoder.decompress(pending, BLOCK_BYTES)
                    pending = decoder.unconsumed_tail
                    if expanded:
                        expanded_bytes += len(expanded)
                        if expanded_bytes > MAX_UNCOMPRESSED:
                            raise ValueError("uncompressed-byte-limit")
                        process.stdin.write(expanded)
                    if decoder.eof:
                        members += 1
                        pending = decoder.unused_data
                        decoder = None
                if checkpoint and compressed >= next_checkpoint:
                    checkpoint(partial())
                    next_checkpoint = compressed + 64 * 1024**2
        input_eof = True
    except (OSError, ValueError, zlib.error, TimeoutError) as failure:
        error = type(failure).__name__  # Never serialize remote error bodies/URLs.
    finally:
        if hasattr(chunks, "close"):
            chunks.close()
        try:
            process.stdin.close()
        except OSError:
            pass
        try:
            status = process.wait(timeout=30)
        except subprocess.TimeoutExpired:
            process.kill()
            status = process.wait(timeout=5)
            error = error or "native-exit-time-limit"
        reader.join(timeout=5)
        if reader.is_alive():
            error = error or "native-response-time-limit"
        process.stdout.close()
    result = partial()
    digests = {name: value.hexdigest() for name, value in hashes.items()}
    gzip_complete = input_eof and decoder is None and members > 0
    integrity = input_eof and compressed == int(expected["size"]) and all(digests[name] == expected[name] for name in ("md5", "sha1"))
    csv_complete = (status == 0 and not result["nativeError"] and result["nativeHeaderRecognized"] and
                    result["nativeStats"].get("csvComplete") is True and result["nativeStats"].get("uncompressedBytes") == expanded_bytes)
    complete = not error and integrity and gzip_complete and csv_complete
    return {**result, "status": "complete" if complete else "partial-or-failed", "completeGraphSearched": bool(complete),
            "inputEof": input_eof, "gzipComplete": gzip_complete, "transferIntegrityVerified": integrity,
            "csvComplete": bool(csv_complete), "compressedResponseDigests": digests, "errorClass": error,
            "nativeExitStatus": status, "limits": {"compressedBytes": MAX_COMPRESSED, "uncompressedBytes": MAX_UNCOMPRESSED,
                                                   "seconds": max_seconds, "retainedEdges": collector.maximum},
            "limitations": ["Only the exact named graph/digest is searched, not the distinct v2 file or every archive collection.",
                            "A full checksum-verified scan is not a signed provenance attestation or proof that the original crawl was exhaustive.",
                            "Edges are leads until source HTML is fetched and parsed; a non-self URL is not independently verified ownership.",
                            "Queries/contacts/fragments and all anchor text are omitted from retained evidence."]}, collector


RANGE_BYTES = 64 * 1024**2
RANGE_WORKERS = 4


def read_range(url, start, end, size):
    # One fixed public GET per range, no account token, resume file or raw cache.
    with open_archive(url, {"Range": f"bytes={start}-{end}"}) as response:
        if response.status != 206 or response.headers.get("Content-Range") != f"bytes {start}-{end}/{size}":
            raise ValueError("Range response did not match its exact requested offsets")
        body = response.read(end - start + 2)
        if len(body) != end - start + 1:
            raise ValueError("Range response was truncated or oversized")
        return body


def ranged_chunks(url, size, fetch=read_range, part=RANGE_BYTES, workers=RANGE_WORKERS):
    # Fetch ahead at most four 64-MiB ranges and consume them in byte order.
    # gzip and all transfer digests therefore cover one exact continuous stream.
    executor = ThreadPoolExecutor(max_workers=workers)
    pending = {}
    starts = iter(range(0, size, part))
    try:
        for _ in range(workers):
            start = next(starts, None)
            if start is not None:
                pending[start] = executor.submit(fetch, url, start, min(size - 1, start + part - 1), size)
        for start in range(0, size, part):
            future = pending.pop(start)
            body = future.result()
            following = next(starts, None)
            if following is not None:
                pending[following] = executor.submit(fetch, url, following, min(size - 1, following + part - 1), size)
            yield body
    finally:
        for future in pending.values():
            future.cancel()
        executor.shutdown(wait=True, cancel_futures=True)


def validate_sources(result, collector, maximum=16):
    observations = []
    # Verification follows only public GeoCities source pages via Wayback.
    # No live forms, private/management paths, guessed URLs or script execution.
    for digest, (source, date) in list(collector.source_inputs.items())[:maximum]:
        row = {"sourceUrlSha256": digest, "sourcePageVerified": False}
        parts = urlsplit(source)
        host = (parts.hostname or "").removeprefix("www.").lower()
        if (host not in AUDIT.TARGET_HOSTS or not date or
                re.search(r"(?:^|/)(?:admin|private|manage|login)(?:/|\.|$)", parts.path, re.I) or
                AUDIT.FORBIDDEN.search(parts.query)):
            row["outcome"] = "not-fetched-outside-public-source-profile"
            observations.append(row)
            continue
        replay = "https://web.archive.org/web/" + date + "id_/" + source
        try:
            with open_archive(replay) as response:
                body = response.read(BLOCK_BYTES + 1)
                resolved = response.url
            if len(body) > BLOCK_BYTES:
                row["outcome"] = "source-size-limit"
            else:
                page = AUDIT.inspect_html(body, replay)
                row.update({"outcome": "fetched-and-parsed", "bytes": len(body), "responseBodySha256": hashlib.sha256(body).hexdigest(),
                            "targetLinkCount": len(page["targetLinks"]), "accessBarrierDetected": page["accessBarrierDetected"],
                            "sourcePageVerified": bool(page["targetLinks"]) and not page["accessBarrierDetected"],
                            "resolvedReplayTimestamp": (re.search(r"/web/(\d{8,14})", resolved).group(1) if re.search(r"/web/(\d{8,14})", resolved) else None)})
        except (OSError, ValueError, TimeoutError):
            row["outcome"] = "source-fetch-or-parse-error"
        observations.append(row)
    verified = {row["sourceUrlSha256"] for row in observations if row["sourcePageVerified"]}
    for edge in result["matches"]:
        edge["sourcePageVerified"] = edge["source"]["urlSha256"] in verified
    result["sourceVerification"] = observations
    result["verifiedSourcePages"] = len(verified)
    result["sourceVerificationLimit"] = maximum
    result["sourceVerificationOmissions"] = max(0, len(collector.source_inputs) - maximum)


def full_scan(selected, scanner, output, probe_receipt):
    metadata = get_metadata(selected)
    expected = metadata["selectedFile"]
    prior = json.loads(probe_receipt.read_text())
    if (prior.get("selectedFile") != expected or not prior.get("recognizedHeader") or
            not prior.get("transport", {}).get("contentRange", "").startswith("bytes 0-")):
        raise ValueError("Exact metadata/header/range probe gate failed")
    url = "https://archive.org/download/" + ITEM + "/" + quote(selected, safe="/")
    result, collector = scan_chunks(ranged_chunks(url, int(expected["size"])), metadata, scanner,
                                    checkpoint=lambda receipt: write_receipt(output, receipt))
    result.update({"metadata": metadata, "downloadUrl": url, "transport": {"rangeBytes": RANGE_BYTES, "concurrentRanges": RANGE_WORKERS},
                   "pythonVersion": sys.version.split()[0]})
    write_receipt(output, result)
    validate_sources(result, collector)
    write_receipt(output, result)
    return result


def emit_scan_receipts(result):
    # Separate CI step: keep below ten notices and 4096 characters per notice.
    summary = {key: value for key, value in result.items() if key not in ("matches", "metadata", "sourceVerification", "limitations")}
    notice("graph-scan-summary", summary)
    batch = []
    part = 1
    for edge in result.get("matches", []):
        candidate = {"edges": batch + [edge]}
        if len(json.dumps(candidate, ensure_ascii=True, separators=(",", ":"))) > 3200 and batch:
            notice(f"graph-matches-{part}", {"edges": batch})
            part += 1
            batch = []
        if part > 7:
            break
        batch.append(edge)
    if batch and part <= 7:
        notice(f"graph-matches-{part}", {"edges": batch})
    notice("graph-source-verification", {"sources": result.get("sourceVerification", [])[:16],
                                         "retainedEdges": len(result.get("matches", [])),
                                         "limitation": "If all retained edges do not fit these bounded annotations, the complete sanitized JSON artifact is required"})


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--file", choices=GRAPH_FILES, default=GRAPH_FILES[0])
    modes = parser.add_mutually_exclusive_group(required=True)
    modes.add_argument("--probe", action="store_true")
    modes.add_argument("--scan", action="store_true")
    modes.add_argument("--publish-receipt", action="store_true")
    parser.add_argument("--scanner", type=Path)
    parser.add_argument("--probe-receipt", type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--actions-annotations", action="store_true")
    args = parser.parse_args()
    if args.publish_receipt:
        emit_scan_receipts(json.loads(args.output.read_text()))
        return
    if args.scan:
        if not args.scanner or not args.probe_receipt:
            parser.error("--scan requires a compiled --scanner and exact --probe-receipt")
        result = full_scan(args.file, args.scanner.resolve(), args.output, args.probe_receipt)
    else:
        result = probe(args.file)
        write_receipt(args.output, result)
    if args.actions_annotations:
        if args.scan:
            emit_scan_receipts(result)
        else:
            notice("graph-probe", result)
    else:
        print(json.dumps({key: value for key, value in result.items() if key != "matches"}, indent=2))
    if args.scan and not result["completeGraphSearched"]:
        raise SystemExit(2)


if __name__ == "__main__":
    main()
