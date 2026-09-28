#!/usr/bin/env python3
"""Extract Dr Solomon's 1992 floppy and expand its SZDD members.

No guest code is executed. The script parses FAT12 and Microsoft's historical
SZDD/LZSS format directly, records hashes, and emits an inventory for Ghidra.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import struct

EXPECTED_BYTES = 737_280
EXPECTED_MD5 = "c11cd5385d9c69bbaf5224235e09e569"
EXPECTED_SHA1 = "9cfb8f096f78da0582dfb2171754e8b739724c6a"
SZDD_MAGIC = b"SZDD\x88\xf0\x27\x33"


def hashes(body: bytes) -> dict[str, object]:
    return {
        "bytes": len(body),
        "md5": hashlib.md5(body).hexdigest(),  # provenance, not a security decision
        "sha1": hashlib.sha1(body).hexdigest(),
        "sha256": hashlib.sha256(body).hexdigest(),
    }


def executable_kind(body: bytes) -> str:
    if body.startswith(SZDD_MAGIC):
        return "Microsoft SZDD compressed"
    if body.startswith(b"MZ"):
        if len(body) >= 0x40:
            offset = struct.unpack_from("<I", body, 0x3C)[0]
            if offset + 2 <= len(body):
                signature = body[offset : offset + 4]
                if signature[:2] == b"NE":
                    return "Windows 16-bit NE executable"
                if signature == b"PE\0\0":
                    return "Windows PE executable"
                if signature[:2] in (b"LE", b"LX"):
                    return f"Linear executable ({signature[:2].decode('ascii')})"
        return "DOS MZ executable"
    if body.startswith(b"PK\x03\x04"):
        return "ZIP archive"
    printable = sum(1 for byte in body[:4096] if byte in b"\t\r\n" or 32 <= byte < 127)
    if body and printable / min(len(body), 4096) > 0.85:
        return "text/data"
    return "binary data"


def fat12_value(fat: bytes, cluster: int) -> int:
    offset = cluster + cluster // 2
    if offset + 2 > len(fat):
        raise ValueError(f"FAT12 cluster {cluster} lies outside the table")
    word = fat[offset] | (fat[offset + 1] << 8)
    return (word >> 4) & 0xFFF if cluster & 1 else word & 0xFFF


def fat_name(entry: bytes) -> str:
    stem = entry[:8].decode("ascii", "replace").rstrip()
    suffix = entry[8:11].decode("ascii", "replace").rstrip()
    return stem + ("." + suffix if suffix else "")


def extract_fat12(image: bytes, destination: Path) -> tuple[dict[str, int], list[dict[str, object]]]:
    if len(image) < 512:
        raise ValueError("image is too small to contain a FAT boot sector")
    bps = struct.unpack_from("<H", image, 11)[0]
    spc = image[13]
    reserved = struct.unpack_from("<H", image, 14)[0]
    fats = image[16]
    root_entries = struct.unpack_from("<H", image, 17)[0]
    total16 = struct.unpack_from("<H", image, 19)[0]
    sectors_per_fat = struct.unpack_from("<H", image, 22)[0]
    total32 = struct.unpack_from("<I", image, 32)[0]
    total_sectors = total16 or total32
    if bps not in (512, 1024, 2048, 4096) or not spc or not fats or not sectors_per_fat:
        raise ValueError("image does not contain a plausible FAT12 BPB")

    root_sectors = (root_entries * 32 + bps - 1) // bps
    fat_offset = reserved * bps
    root_offset = (reserved + fats * sectors_per_fat) * bps
    data_offset = root_offset + root_sectors * bps
    cluster_bytes = spc * bps
    fat = image[fat_offset : fat_offset + sectors_per_fat * bps]
    root = image[root_offset : root_offset + root_entries * 32]

    destination.mkdir(parents=True, exist_ok=True)
    rows: list[dict[str, object]] = []
    for offset in range(0, len(root), 32):
        entry = root[offset : offset + 32]
        first = entry[0]
        if first == 0x00:
            break
        if first == 0xE5:
            continue
        attributes = entry[11]
        if attributes == 0x0F or attributes & 0x08 or attributes & 0x10:
            continue
        name = fat_name(entry)
        cluster = struct.unpack_from("<H", entry, 26)[0]
        size = struct.unpack_from("<I", entry, 28)[0]
        body = bytearray()
        seen: set[int] = set()
        current = cluster
        while 2 <= current < 0xFF8 and len(body) < size:
            if current in seen:
                raise ValueError(f"{name}: cyclic FAT chain at cluster {current}")
            seen.add(current)
            start = data_offset + (current - 2) * cluster_bytes
            end = start + cluster_bytes
            if end > len(image):
                raise ValueError(f"{name}: cluster {current} is outside the image")
            body.extend(image[start:end])
            current = fat12_value(fat, current)
        body = body[:size]
        if len(body) != size:
            raise ValueError(f"{name}: extracted {len(body)} of {size} bytes")
        output = destination / name
        output.write_bytes(body)
        rows.append({
            "name": name,
            "path": str(output),
            "kind": executable_kind(body),
            "firstCluster": cluster,
            "clusters": len(seen),
            **hashes(body),
        })

    geometry = {
        "bytesPerSector": bps,
        "sectorsPerCluster": spc,
        "reservedSectors": reserved,
        "fatCopies": fats,
        "rootEntries": root_entries,
        "sectorsPerFat": sectors_per_fat,
        "totalSectors": total_sectors,
    }
    return geometry, rows


def expand_szdd(body: bytes) -> tuple[bytes, str]:
    if not body.startswith(SZDD_MAGIC) or len(body) < 14:
        raise ValueError("not a complete SZDD stream")
    mode = chr(body[8])
    missing = chr(body[9])
    expected = struct.unpack_from("<I", body, 10)[0]
    if mode != "A":
        raise ValueError(f"unsupported SZDD mode {mode!r}")

    window_size = 4096
    lookahead = 16
    threshold = 2
    window = bytearray(b" " * window_size)
    write_at = window_size - lookahead
    source = 14
    flags = 0
    output = bytearray()

    while source < len(body) and len(output) < expected:
        flags >>= 1
        if flags & 0x100 == 0:
            flags = body[source] | 0xFF00
            source += 1
        if flags & 1:
            if source >= len(body):
                break
            value = body[source]
            source += 1
            output.append(value)
            window[write_at] = value
            write_at = (write_at + 1) & (window_size - 1)
        else:
            if source + 1 >= len(body):
                break
            low = body[source]
            high = body[source + 1]
            source += 2
            read_at = low | ((high & 0xF0) << 4)
            length = (high & 0x0F) + threshold + 1
            for index in range(length):
                value = window[(read_at + index) & (window_size - 1)]
                output.append(value)
                window[write_at] = value
                write_at = (write_at + 1) & (window_size - 1)
                if len(output) >= expected:
                    break

    if len(output) != expected:
        raise ValueError(f"SZDD expanded to {len(output)} bytes; header requires {expected}")
    return bytes(output), missing


def restored_name(name: str, missing: str) -> str:
    if not name.endswith("_"):
        raise ValueError(f"compressed member {name} has no underscore suffix")
    # Microsoft's compressor permits 0 here ("missing character unknown").
    # The disk uses conventional setup suffixes, so recover those explicitly
    # rather than creating a path containing NUL or silently inventing a byte.
    if missing == "\x00":
        conventional = {
            ".EX_": "E",
            ".DL_": "L",
            ".HL_": "P",
            ".DR_": "V",
            ".CO_": "M",
            ".PI_": "F",
            ".DA_": "T",
            ".00_": "1",
        }
        for suffix, inferred in conventional.items():
            if name.upper().endswith(suffix):
                missing = inferred
                break
        else:
            raise ValueError(f"{name}: SZDD header omits the missing filename character")
    if missing in ("/", "\\") or ord(missing) < 32:
        raise ValueError(f"{name}: unsafe SZDD missing character {missing!r}")
    return name[:-1] + missing


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("image", type=Path)
    parser.add_argument("destination", type=Path)
    parser.add_argument("--allow-unpinned", action="store_true", help="permit an image other than the catalogued Archive item")
    args = parser.parse_args()

    image = args.image.read_bytes()
    image_hashes = hashes(image)
    pinned = (
        len(image) == EXPECTED_BYTES
        and image_hashes["md5"] == EXPECTED_MD5
        and image_hashes["sha1"] == EXPECTED_SHA1
    )
    if not pinned and not args.allow_unpinned:
        raise SystemExit(
            "disk-image provenance mismatch: "
            f"bytes={len(image)} md5={image_hashes['md5']} sha1={image_hashes['sha1']}"
        )

    raw_dir = args.destination / "raw"
    expanded_dir = args.destination / "expanded"
    geometry, raw_rows = extract_fat12(image, raw_dir)
    expanded_dir.mkdir(parents=True, exist_ok=True)
    expanded_rows: list[dict[str, object]] = []

    for row in raw_rows:
        raw_path = Path(str(row["path"]))
        body = raw_path.read_bytes()
        if body.startswith(SZDD_MAGIC):
            expanded, missing = expand_szdd(body)
            name = restored_name(str(row["name"]), missing)
            output = expanded_dir / name
            output.write_bytes(expanded)
            expanded_rows.append({
                "name": name,
                "source": row["name"],
                "path": str(output),
                "kind": executable_kind(expanded),
                **hashes(expanded),
            })
        else:
            output = expanded_dir / str(row["name"])
            output.write_bytes(body)
            expanded_rows.append({
                "name": row["name"],
                "source": row["name"],
                "path": str(output),
                "kind": row["kind"],
                **hashes(body),
            })

    inventory = {
        "schemaVersion": 1,
        "artifact": {
            "title": "Dr Solomon's Anti-Virus Toolkit for Windows & DOS",
            "publisher": "S & S International Ltd",
            "date": 1992,
            "archiveIdentifier": "dr-solomon",
            "archiveFile": "DrSolomon.iso",
            "source": "https://archive.org/download/dr-solomon/DrSolomon.iso",
            "pinned": pinned,
            **image_hashes,
        },
        "filesystem": {"type": "FAT12", **geometry},
        "rawFiles": raw_rows,
        "expandedFiles": expanded_rows,
        "safety": "Static extraction only; no disk member was executed.",
    }
    inventory_path = args.destination / "inventory.json"
    inventory_path.write_text(json.dumps(inventory, indent=2) + "\n", encoding="utf-8")
    print(f"FAT12: {len(raw_rows)} files; {len(expanded_rows)} expanded/copied; pinned={pinned}")
    for row in expanded_rows:
        print(f"{row['name']:<14} {row['bytes']:>8}  {row['kind']}  sha256={row['sha256']}")
    print(inventory_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
