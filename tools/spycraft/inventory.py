#!/usr/bin/env python3
"""Hash-gated, non-executing inventory for Activision's Spycraft demo ZIP.

The script treats the ZIP as untrusted input, rejects unsafe paths and links,
and never invokes any extracted member. It uses only Python's standard library.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import stat
import struct
import sys
import zipfile
from pathlib import Path, PurePosixPath
from typing import BinaryIO

ARCHIVE_IDENTIFIER = "Spycraft."
ARCHIVE_MEMBER = "spycraft.zip"
ARCHIVE_URL = "https://archive.org/download/Spycraft./spycraft.zip"
EXPECTED_SIZE = 2_410_498
EXPECTED_MD5 = "6eb0f915fb10123eb89575ac46132357"
EXPECTED_SHA1 = "cd1ab69040bcdce7e4131e62216fd65ac8361b22"
MAX_FILES = 10_000
MAX_EXPANDED_BYTES = 512 * 1024 * 1024
EXECUTABLE_SUFFIXES = {".exe", ".dll", ".com", ".drv", ".scr"}
MEDIA_SUFFIXES = {".avi", ".wav", ".mid", ".midi", ".bmp", ".pcx", ".gif", ".jpg", ".jpeg"}
GAME_DATA_SUFFIXES = {".ast", ".sgm", ".ini", ".cfg", ".dat", ".res"}
MACHINE_NAMES = {
    0x014C: "x86",
    0x0162: "MIPS R3000",
    0x0166: "MIPS R4000",
    0x0184: "Alpha",
    0x01C0: "ARM",
    0x8664: "x86-64",
    0xAA64: "ARM64",
}
NE_OS_NAMES = {1: "OS/2", 2: "Windows", 3: "European MS-DOS 4.x", 4: "Windows 386"}


def hashes(path: Path) -> dict[str, object]:
    digesters = {name: hashlib.new(name) for name in ("md5", "sha1", "sha256")}
    size = 0
    with path.open("rb") as stream:
        while chunk := stream.read(1024 * 1024):
            size += len(chunk)
            for digester in digesters.values():
                digester.update(chunk)
    return {"bytes": size, **{name: value.hexdigest() for name, value in digesters.items()}}


def safe_member_path(name: str) -> PurePosixPath:
    normalized = name.replace("\\", "/")
    path = PurePosixPath(normalized)
    if not normalized or normalized.startswith("/") or path.is_absolute():
        raise ValueError(f"unsafe absolute/empty archive path: {name!r}")
    if any(part in {"", ".", ".."} for part in path.parts):
        raise ValueError(f"unsafe archive path component: {name!r}")
    if ":" in path.parts[0]:
        raise ValueError(f"unsafe drive-qualified archive path: {name!r}")
    return path


def executable_metadata(path: Path) -> dict[str, object]:
    """Return conservative header facts without loading or executing the file."""
    result: dict[str, object] = {"format": "unknown", "architecture": "unknown"}
    with path.open("rb") as stream:
        header = stream.read(64)
        if len(header) < 2 or header[:2] != b"MZ":
            if path.suffix.lower() == ".com":
                result.update(format="DOS COM", architecture="x86 16-bit")
            return result
        result.update(format="DOS MZ", architecture="x86 16-bit")
        if len(header) < 64:
            return result
        new_offset = struct.unpack_from("<I", header, 0x3C)[0]
        stream.seek(new_offset)
        signature = stream.read(4)
        if signature == b"PE\0\0":
            coff = stream.read(20)
            if len(coff) == 20:
                machine, sections, timestamp, _, _, optional_size, characteristics = struct.unpack("<HHIIIHH", coff)
                result.update(
                    format="PE",
                    architecture=MACHINE_NAMES.get(machine, f"machine 0x{machine:04x}"),
                    machine=f"0x{machine:04x}",
                    sections=sections,
                    coffTimestamp=timestamp,
                    characteristics=f"0x{characteristics:04x}",
                )
                optional = stream.read(optional_size)
                if len(optional) >= 70:
                    result["subsystem"] = struct.unpack_from("<H", optional, 68)[0]
            return result
        if signature[:2] == b"NE":
            stream.seek(new_offset)
            ne = stream.read(64)
            if len(ne) >= 55:
                result.update(
                    format="NE",
                    architecture="x86 16-bit",
                    entryTableOffset=struct.unpack_from("<H", ne, 0x04)[0],
                    entryTableBytes=struct.unpack_from("<H", ne, 0x06)[0],
                    segmentCount=struct.unpack_from("<H", ne, 0x1C)[0],
                    moduleReferenceCount=struct.unpack_from("<H", ne, 0x1E)[0],
                    targetOS=NE_OS_NAMES.get(ne[0x36], f"code {ne[0x36]}"),
                )
            return result
        if signature[:2] == b"LE":
            result.update(format="LE", architecture="x86 32-bit")
        elif signature[:2] == b"LX":
            result.update(format="LX", architecture="x86 32-bit")
    return result


def classify(path: Path, first_bytes: bytes) -> list[str]:
    suffix = path.suffix.lower()
    labels: list[str] = []
    if suffix in EXECUTABLE_SUFFIXES or first_bytes.startswith(b"MZ"):
        labels.append("executable-candidate")
    if suffix in MEDIA_SUFFIXES:
        labels.append("media")
    if suffix in GAME_DATA_SUFFIXES:
        labels.append("game-data")
    if suffix in {".zip", ".arj", ".lzh", ".cab"}:
        labels.append("nested-archive")
    if suffix in {".txt", ".doc", ".wri", ".rtf", ".pdf"}:
        labels.append("documentation")
    return labels or ["other"]


def copy_member(source: BinaryIO, destination: Path) -> dict[str, object]:
    digesters = {name: hashlib.new(name) for name in ("md5", "sha1", "sha256")}
    size = 0
    first = b""
    destination.parent.mkdir(parents=True, exist_ok=True)
    with destination.open("wb") as output:
        while chunk := source.read(1024 * 1024):
            if not first:
                first = chunk[:64]
            size += len(chunk)
            if size > MAX_EXPANDED_BYTES:
                raise ValueError("a member exceeds the extraction byte limit")
            output.write(chunk)
            for digester in digesters.values():
                digester.update(chunk)
    return {
        "bytes": size,
        "firstBytes": first.hex(),
        **{name: value.hexdigest() for name, value in digesters.items()},
    }


def inventory(archive: Path, extract_dir: Path, strict_gate: bool = True) -> dict[str, object]:
    archive_facts = hashes(archive)
    if strict_gate:
        failures = []
        if archive_facts["bytes"] != EXPECTED_SIZE:
            failures.append(f"size {archive_facts['bytes']} != {EXPECTED_SIZE}")
        if archive_facts["md5"] != EXPECTED_MD5:
            failures.append(f"MD5 {archive_facts['md5']} != {EXPECTED_MD5}")
        if archive_facts["sha1"] != EXPECTED_SHA1:
            failures.append(f"SHA-1 {archive_facts['sha1']} != {EXPECTED_SHA1}")
        if failures:
            raise ValueError("archive provenance gate failed: " + "; ".join(failures))

    files: list[dict[str, object]] = []
    total_expanded = 0
    seen: set[str] = set()
    with zipfile.ZipFile(archive) as bundle:
        entries = bundle.infolist()
        if len(entries) > MAX_FILES:
            raise ValueError(f"archive has {len(entries)} entries; limit is {MAX_FILES}")
        for info in entries:
            path = safe_member_path(info.filename)
            key = str(path).casefold()
            if key in seen:
                raise ValueError(f"duplicate/case-colliding archive member: {info.filename!r}")
            seen.add(key)
            unix_mode = info.external_attr >> 16
            if stat.S_ISLNK(unix_mode):
                raise ValueError(f"symbolic links are not allowed: {info.filename!r}")
            if info.is_dir():
                continue
            total_expanded += info.file_size
            if total_expanded > MAX_EXPANDED_BYTES:
                raise ValueError(f"expanded archive exceeds {MAX_EXPANDED_BYTES} bytes")
            destination = extract_dir.joinpath(*path.parts)
            destination_resolved = destination.resolve()
            extract_root = extract_dir.resolve()
            if os.path.commonpath((str(extract_root), str(destination_resolved))) != str(extract_root):
                raise ValueError(f"archive member escapes extraction root: {info.filename!r}")
            with bundle.open(info, "r") as source:
                facts = copy_member(source, destination)
            if facts["bytes"] != info.file_size:
                raise ValueError(f"size mismatch while extracting {info.filename!r}")
            labels = classify(destination, bytes.fromhex(str(facts.pop("firstBytes"))))
            row: dict[str, object] = {
                "member": str(path),
                "extractedPath": str(path),
                "zipBytes": info.compress_size,
                "crc32": f"{info.CRC:08x}",
                "categories": labels,
                **facts,
            }
            if "executable-candidate" in labels:
                row["executable"] = executable_metadata(destination)
            files.append(row)

    category_counts: dict[str, int] = {}
    for row in files:
        for category in row["categories"]:
            category_counts[category] = category_counts.get(category, 0) + 1
    return {
        "schemaVersion": 1,
        "analysisMode": "static-only; no extracted file was executed",
        "source": {
            "provider": "Internet Archive",
            "identifier": ARCHIVE_IDENTIFIER,
            "member": ARCHIVE_MEMBER,
            "url": ARCHIVE_URL,
            "publisherAttribution": "Activision",
            "publicationDate": "1996",
        },
        "archive": {"path": archive.name, **archive_facts, "gatePassed": strict_gate},
        "summary": {
            "files": len(files),
            "expandedBytes": total_expanded,
            "categories": dict(sorted(category_counts.items())),
        },
        "files": files,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive", required=True, type=Path)
    parser.add_argument("--extract-dir", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument(
        "--skip-archive-gate",
        action="store_true",
        help="development/testing only; CI must never pass this option",
    )
    args = parser.parse_args()
    try:
        result = inventory(args.archive, args.extract_dir, not args.skip_archive_gate)
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    except (OSError, ValueError, zipfile.BadZipFile) as error:
        print(f"spycraft inventory failed: {error}", file=sys.stderr)
        return 1
    candidates = sum("executable-candidate" in row["categories"] for row in result["files"])
    print(f"Inventoried {result['summary']['files']} files; {candidates} executable candidates")
    print(f"Wrote {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
