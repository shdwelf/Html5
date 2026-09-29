#!/usr/bin/env python3
"""game_triage.py — container/packer triage for the DOS game shareware corpus.

Companion to docs/dos-game-disassembly.md. Reports, per executable, which of
the four DOS executable families it belongs to and what protection or
packing sits in front of the real code:

  * plain MZ real-mode          (Sierra SCI interpreter, Turbo C/Pascal)
  * MZ + LZEXE 0.91             (Keen 1, Duke Nukem II) -> tools/exeprotect.py
  * MZ + PKLITE                 (Duke Nukem 3D's DN3DSW13.SHR payload)
  * MZ stub + LE (DOS/4GW)      (DOOM, Heretic) -> 32-bit flat, not real mode

Usage:  python3 tools/game_triage.py FILE [FILE...]
        python3 tools/game_triage.py --dir DIR
"""
from __future__ import annotations

import pathlib
import struct
import sys

MZ_FIELDS = ("e_magic e_cblp e_cp e_crlc e_cparhdr e_minalloc e_maxalloc "
             "e_ss e_sp e_csum e_ip e_cs e_lfarlc e_ovno").split()

# Turbo Pascal 3.x COM images open with a JMP over a 3-byte signature and the
# Borland copyright; that is the runtime header, not the program's own code.
TP3_COPYRIGHT = b"Copyright (C) 1985 BORLAND Inc"


def parse_mz(data: bytes) -> dict | None:
    if len(data) < 28 or data[:2] not in (b"MZ", b"ZM"):
        return None
    h = dict(zip(MZ_FIELDS, struct.unpack_from("<14H", data, 0)))
    # DOS computes the entry as (load_seg + e_cs):e_ip; in file terms the load
    # module starts at e_cparhdr paragraphs, and e_cs is relative to that.
    h["entry_off"] = ((h["e_cparhdr"] + h["e_cs"]) & 0xFFFF) * 16 + h["e_ip"]
    h["image_off"] = h["e_cparhdr"] * 16
    return h


def le_header(data: bytes):
    """Locate and decode a Linear Executable header (DOS/4GW et al.).

    Field offsets are from the LE specification. The two that are easy to
    transpose — and that produce spectacular nonsense when you do — are
    0x40 = object table offset and 0x44 = object count, in that order.
    """
    off = data.find(b"LE\x00\x00")
    if off < 0:
        off = data.find(b"LX\x00\x00")
        if off < 0:
            return None
    if off + 0xC4 > len(data):
        return None
    u32 = lambda o: struct.unpack_from("<I", data, off + o)[0]  # noqa: E731
    u16 = lambda o: struct.unpack_from("<H", data, off + o)[0]  # noqa: E731
    le = {
        "kind": data[off:off + 2].decode(),
        "file_off": off,
        "byte_order": data[off + 2],
        "word_order": data[off + 3],
        "cpu": u16(0x08),
        "os": u16(0x0A),
        "module_flags": u32(0x10),
        "pages": u32(0x14),
        "eip_object": u32(0x18),
        "eip": u32(0x1C),
        "esp_object": u32(0x20),
        "esp": u32(0x24),
        "page_size": u32(0x28),
        "fixup_size": u32(0x30),
        "loader_size": u32(0x38),
        "objtab_off": u32(0x40),
        "num_objects": u32(0x44),
        "data_pages_off": u32(0x80),
    }
    objs = []
    base = off + le["objtab_off"]
    for i in range(min(le["num_objects"], 32)):
        o = base + i * 24
        if o + 24 > len(data):
            break
        vsize, reloc, flags, pagemap, pagecount = struct.unpack_from("<IIIII", data, o)
        objs.append({
            "n": i + 1, "vsize": vsize, "base": reloc, "flags": flags,
            "pagemap": pagemap, "pages": pagecount,
            "perm": "".join(c for c, bit in (("R", 1), ("W", 2), ("X", 4)) if flags & bit),
            "big": bool(flags & 0x2000),
        })
    le["objects"] = objs
    return le


CPU_NAMES = {1: "80286", 2: "80386", 3: "80486", 4: "Pentium"}
OS_NAMES = {1: "OS/2", 2: "Windows", 3: "DOS 4.x", 4: "Windows 386"}


def classify(data: bytes, hdr: dict | None):
    """(family, detail) — what has to be defeated before the real code shows."""
    if hdr is None:
        if data[:1] == b"\xe9" and TP3_COPYRIGHT in data[:64]:
            return ("COM / Turbo Pascal 3.x",
                    "JMP over the runtime header; %r at 0x%X"
                    % (TP3_COPYRIGHT.decode(), data.find(TP3_COPYRIGHT)))
        if data[:1] in (b"\xe9", b"\xeb"):
            return ("COM (flat 16-bit, loaded at 0x100)", "entry is a JMP at offset 0")
        return ("unknown", "no MZ magic and no COM-style entry jump")

    le = le_header(data)
    if le:
        return ("MZ stub + %s (32-bit protected mode)" % le["kind"],
                "%s header at 0x%X; DOS/4GW-class extender in the MZ stub"
                % (le["kind"], le["file_off"]))

    if data[0x1C:0x20] in (b"LZ91", b"LZ09") and hdr["e_lfarlc"] == 0x1C:
        ver = "0.91" if data[0x1C:0x20] == b"LZ91" else "0.90"
        return ("MZ + LZEXE %s" % ver,
                "marker at 0x1C doubling as an empty reloc table; "
                "stub data area at image+0x%X" % (hdr["e_cs"] << 4))

    if b"PKLITE Copr." in data[:0x200]:
        return ("MZ + PKLITE",
                "%r at 0x%X; e_cs=0x%04X%s"
                % ("PKLITE Copr.", data.find(b"PKLITE Copr."), hdr["e_cs"],
                   " (the 0xFFF0 wrap: entry resolves back to image offset 0)"
                   if hdr["e_cs"] == 0xFFF0 else ""))

    return ("MZ (plain real-mode)",
            "%d relocations, entry %04X:%04X"
            % (hdr["e_crlc"], hdr["e_cs"], hdr["e_ip"]))


def report(path: pathlib.Path) -> None:
    data = path.read_bytes()
    hdr = parse_mz(data)
    family, detail = classify(data, hdr)
    print("=" * 72)
    print("%s  (%d bytes)" % (path, len(data)))
    print("  family : %s" % family)
    print("  detail : %s" % detail)
    if hdr:
        print("  MZ     : pages=%d lastpage=%d relocs=%d hdrparas=%d "
              "(image @0x%X)" % (hdr["e_cp"], hdr["e_cblp"], hdr["e_crlc"],
                                 hdr["e_cparhdr"], hdr["image_off"]))
        print("           ss:sp=%04X:%04X  cs:ip=%04X:%04X  entry @file 0x%X"
              % (hdr["e_ss"], hdr["e_sp"], hdr["e_cs"], hdr["e_ip"],
                 hdr["entry_off"]))
    le = le_header(data) if hdr else None
    if le:
        print("  %s     : cpu=%s os=%s pages=%d x %d bytes, %d objects @0x%X"
              % (le["kind"], CPU_NAMES.get(le["cpu"], "0x%X" % le["cpu"]),
                 OS_NAMES.get(le["os"], "0x%X" % le["os"]), le["pages"],
                 le["page_size"], le["num_objects"], le["objtab_off"]))
        print("           entry = object #%d + 0x%X, stack = object #%d + 0x%X"
              % (le["eip_object"], le["eip"], le["esp_object"], le["esp"]))
        print("           fixup section %d bytes, loader section %d bytes"
              % (le["fixup_size"], le["loader_size"]))
        for o in le["objects"]:
            print("           obj%-2d base=0x%08X vsize=0x%-7X pages=%-5d "
                  "flags=0x%04X [%s%s]"
                  % (o["n"], o["base"], o["vsize"], o["pages"], o["flags"],
                     o["perm"], " BIG/32" if o["big"] else ""))


def main(argv: list[str]) -> int:
    args = argv[1:]
    if not args:
        raise SystemExit(__doc__)
    paths: list[pathlib.Path] = []
    if args[0] == "--dir":
        root = pathlib.Path(args[1])
        for p in sorted(root.rglob("*")):
            if p.is_file() and p.suffix.upper() in (".EXE", ".COM", ".SHR", ".DRV"):
                paths.append(p)
    else:
        paths = [pathlib.Path(a) for a in args]
    for p in paths:
        report(p)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
