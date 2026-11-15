#!/usr/bin/env python3
"""Static reader for GRASP 4.00d "protected" GL libraries (EXE-bound or .GL).

The cipher below was recovered by disassembling the GRASPRT 4.00d runtime that
is the load module of the 1992 Sneakers computer press kit (SNEAKERS.EXE,
SHA-256 d5738c9a...5961).  Code-segment offsets (file offset = 0x1200 + code
offset, because the MZ header is 0x120 paragraphs):

  0xc003  DOS read wrapper: after INT 21h/3Fh, if the handle equals the
          library handle (ds:0x1635) and a table pointer (ds:0x1633) is set,
          every byte read is replaced by  table[byte]  (xlat loop at 0xc037).
  0x14471 library open: the 16-bit word at directory offset 2 — the HIGH word
          of the first directory entry's 32-bit offset — is the key.  It is
          zeroed in memory (0x145c6), multiplied by 0x7cf7 with the 32-bit
          multiply helper at 0x0:0xba (0x145d3-0x145df), and passed to 0x16087.
  0x16087 builds the inverse table:  inverse[perm[i]] = i  for i in 0..255.
  0x16024 builds perm: seed the 32-bit PRNG state (ds:0x219e), fill 0..255,
          then for i in 0..255: j = rng() & 0xff; swap(perm[i], perm[j]).
  0x1224a PRNG (386 path; the 8086 path at 0x12274 is bit-identical):
          x = state & 0x7fffffff; x ^= x >> 13; x = (x ^ (x << 18)) & 0xffffffff;
          state = x; return x & 0xffff.

So ciphertext = perm[plaintext] for every byte of every member, including each
member's own 4-byte little-endian length prefix.  Nothing here executes the
runtime or any member; it only reads bytes.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import struct
import sys
from dataclasses import dataclass
from pathlib import Path

KEY_MULTIPLIER = 0x7CF7
DIRECTORY_ENTRY = 17  # 4-byte offset + 13-byte NUL-padded 8.3 name


class XorShift31:
    """The runtime's generator: 31-bit masked xorshift (>>13, <<18)."""

    def __init__(self, seed: int) -> None:
        self.state = seed & 0xFFFFFFFF

    def next(self) -> int:
        x = self.state & 0x7FFFFFFF
        x ^= x >> 13
        x = (x ^ (x << 18)) & 0xFFFFFFFF
        self.state = x
        return x & 0xFFFF


def permutation_for_key(key_word: int, multiplier: int = KEY_MULTIPLIER) -> bytes:
    """perm[plain] = cipher, exactly as GRASPRT 4.00d derives it from the key word."""
    if not 0 <= key_word <= 0xFFFF:
        raise ValueError("key word must fit in 16 bits")
    rng = XorShift31((key_word * multiplier) & 0xFFFFFFFF)
    perm = list(range(256))
    for i in range(256):
        j = rng.next() & 0xFF
        perm[i], perm[j] = perm[j], perm[i]
    return bytes(perm)


def inverse_table(perm: bytes) -> bytes:
    inverse = bytearray(256)
    for plain, cipher in enumerate(perm):
        inverse[cipher] = plain
    return bytes(inverse)


def mz_load_module_size(data: bytes) -> int | None:
    if len(data) < 0x1C or data[:2] != b"MZ":
        return None
    e_cblp, e_cp = struct.unpack_from("<HH", data, 2)
    return (e_cp - 1) * 512 + e_cblp if e_cblp else e_cp * 512


@dataclass
class Member:
    name: str
    offset: int  # relative to the library start
    stored_length: int  # decoded 4-byte prefix
    span: int  # bytes until the next member (or library end), minus the prefix

    @property
    def consistent(self) -> bool:
        return self.stored_length == self.span


@dataclass
class Library:
    path: Path
    library_offset: int
    key_word: int
    members: list[Member]
    data: bytes  # whole library (still enciphered)

    @property
    def table(self) -> bytes:
        return inverse_table(permutation_for_key(self.key_word)) if self.key_word else bytes(range(256))

    def decode(self, raw: bytes) -> bytes:
        return raw.translate(self.table)

    def member_bytes(self, member: Member) -> bytes:
        start = member.offset + 4
        return self.decode(self.data[start : start + member.stored_length])


def parse_library(path: Path, library_offset: int | None = None) -> Library:
    blob = path.read_bytes()
    if library_offset is None:
        library_offset = mz_load_module_size(blob) or 0
    data = blob[library_offset:]
    if len(data) < 2:
        raise ValueError("no library data after the load module")
    directory_length = struct.unpack_from("<H", data, 0)[0]
    entries: list[tuple[int, str]] = []
    pos = 2
    while pos + DIRECTORY_ENTRY <= directory_length + 2:
        offset = struct.unpack_from("<I", data, pos)[0]
        name = data[pos + 4 : pos + DIRECTORY_ENTRY].split(b"\0", 1)[0].decode("latin-1")
        entries.append((offset, name))
        pos += DIRECTORY_ENTRY
    if not entries:
        raise ValueError("empty GL directory")
    # The runtime takes the key from the first entry's high word and zeroes it.
    key_word = entries[0][0] >> 16
    entries[0] = (entries[0][0] & 0xFFFF, entries[0][1])
    entries = [e for e in entries if e[1]]  # the all-zero terminator carries no name
    table = inverse_table(permutation_for_key(key_word)) if key_word else bytes(range(256))
    members: list[Member] = []
    for index, (offset, name) in enumerate(entries):
        next_offset = entries[index + 1][0] if index + 1 < len(entries) else len(data)
        if offset + 4 > len(data):
            raise ValueError(f"member {name} points outside the library")
        stored = struct.unpack("<I", data[offset : offset + 4].translate(table))[0]
        members.append(Member(name, offset, stored, next_offset - offset - 4))
    return Library(path, library_offset, key_word, members, data)


def manifest(lib: Library) -> dict:
    rows = []
    for m in lib.members:
        plain = lib.member_bytes(m) if m.consistent else b""
        rows.append(
            {
                "name": m.name,
                "library_offset": m.offset,
                "file_offset": lib.library_offset + m.offset,
                "length": m.stored_length,
                "length_consistent": m.consistent,
                "sha256_decoded": hashlib.sha256(plain).hexdigest() if m.consistent else None,
            }
        )
    return {
        "source": lib.path.name,
        "source_sha256": hashlib.sha256(lib.path.read_bytes()).hexdigest(),
        "library_offset": lib.library_offset,
        "key_word": f"0x{lib.key_word:04x}",
        "cipher": "GRASPRT 4.00d byte substitution (xorshift31 >>13 <<18, seed = key*0x7cf7, 256 swaps)",
        "members": len(rows),
        "consistent_members": sum(1 for r in rows if r["length_consistent"]),
        "entries": rows,
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="command", required=True)
    for name in ("info", "manifest", "extract", "table"):
        p = sub.add_parser(name)
        if name != "table":
            p.add_argument("library", type=Path, help="EXE-bound GRASP presentation or a .GL file")
            p.add_argument("--offset", type=int, default=None, help="library start (default: MZ load-module size, else 0)")
        if name == "extract":
            p.add_argument("outdir", type=Path)
        if name == "table":
            p.add_argument("key_word", type=lambda s: int(s, 0))
    args = parser.parse_args(argv)

    if args.command == "table":
        perm = permutation_for_key(args.key_word)
        print(json.dumps({"key_word": f"0x{args.key_word:04x}", "encrypt_table_hex": perm.hex(), "decrypt_table_hex": inverse_table(perm).hex()}))
        return 0

    lib = parse_library(args.library, args.offset)
    if args.command == "info":
        bad = [m.name for m in lib.members if not m.consistent]
        print(f"library offset {lib.library_offset}, key word 0x{lib.key_word:04x}, {len(lib.members)} members, {len(lib.members) - len(bad)} length-consistent")
        if bad:
            print("inconsistent:", ", ".join(bad))
        return 1 if bad else 0
    if args.command == "manifest":
        print(json.dumps(manifest(lib), indent=2))
        return 0
    args.outdir.mkdir(parents=True, exist_ok=True)
    for m in lib.members:
        if not m.consistent:
            print(f"skip {m.name}: length prefix disagrees with directory", file=sys.stderr)
            continue
        safe = m.name.replace("/", "_").replace("\\", "_")
        (args.outdir / safe).write_bytes(lib.member_bytes(m))
    (args.outdir / "MANIFEST.json").write_text(json.dumps(manifest(lib), indent=2), encoding="utf-8")
    print(f"extracted {sum(m.consistent for m in lib.members)} members to {args.outdir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
