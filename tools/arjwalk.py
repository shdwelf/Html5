#!/usr/bin/env python3
"""
ARJ archive structure walker — structure only, no decryption.

Walks an ARJ archive (revision 4 / ARJ 2.30) and reports the main header and
every local file header: name, method, flags (GARBLED/PATHSYM/…), the
per-member password_modifier (the otherwise-reserved header byte), compressed
and original sizes, and the original CRC. It also verifies each header's CRC-32.

It deliberately does NOT transform or extract GARBLED (password-XOR) members.
The GARBLED payload is the author's paid content; this tool documents the
mechanism and stops at the ciphertext boundary, which is the line the
2026-09-29 research set.

  arjwalk.py list FILE [FILE...]     # concatenate parts, then walk
"""

import sys
import struct
import zlib

MAGIC = b"\x60\xea"

FLAG_NAMES = {
    0x01: "GARBLED", 0x02: "VOLUMES", 0x04: "EXTFILE", 0x08: "EXTFILE2",
    0x10: "PATHSYM", 0x20: "BACKUP", 0x40: "NTSPECIAL",
}
# Bit assignments follow the ARJ Technical Information (April 1993) as cited by
# the 2026-09-29 research: flags 0x11 = GARBLED | PATHSYM. PATHSYM is consistent
# with these members carrying ALMANAC/ path prefixes. (Some references swap the
# 0x08/0x10 labels; the GARBLED bit 0x01 is unambiguous.)
METHODS = {0: "stored", 1: "max", 2: "fast", 3: "faster", 4: "fastest"}
FTYPES = {0: "binary", 1: "7-bit text", 2: "comment", 3: "directory", 4: "label", 8: "chapter"}


def headers(data):
    """Yield (offset, header_bytes, header_crc_ok, next_offset_after_header)."""
    off = 0
    n = len(data)
    while off + 4 <= n:
        if data[off:off + 2] != MAGIC:
            return
        hlen = struct.unpack_from("<H", data, off + 2)[0]
        if hlen == 0:
            return  # end-of-archive marker
        start = off + 4
        end = start + hlen
        if end + 4 > n:
            return
        hd = data[start:end]
        crc = struct.unpack_from("<I", data, end)[0]
        ok = (zlib.crc32(hd) & 0xFFFFFFFF) == crc
        yield off, hd, ok, end + 4
        off = end + 4  # caller advances past compressed data for local headers
        # For the walker we need to jump over csize; handled by the caller via
        # a generator that knows the member size, so we break here and let
        # walk() drive.
        return


def parse_header(hd):
    first = hd[0]
    fixed = hd[:first]
    tail = hd[first:]
    parts = tail.split(b"\x00")
    name = parts[0].decode("cp437", "replace") if parts else ""
    comment = parts[1].decode("cp437", "replace") if len(parts) > 1 else ""
    f = {
        "first_size": first,
        "arch_ver": fixed[1] if len(fixed) > 1 else None,
        "min_ver": fixed[2] if len(fixed) > 2 else None,
        "host_os": fixed[3] if len(fixed) > 3 else None,
        "flags": fixed[4] if len(fixed) > 4 else None,
        "method": fixed[5] if len(fixed) > 5 else None,
        "file_type": fixed[6] if len(fixed) > 6 else None,
        "modifier": fixed[7] if len(fixed) > 7 else None,
        "name": name,
        "comment": comment,
    }
    if len(fixed) >= 24:
        f["csize"] = struct.unpack_from("<I", fixed, 12)[0]
        f["osize"] = struct.unpack_from("<I", fixed, 16)[0]
        f["ocrc"] = struct.unpack_from("<I", fixed, 20)[0]
    return f


def flag_str(flags):
    if flags is None:
        return "?"
    return "|".join(n for b, n in FLAG_NAMES.items() if flags & b) or "0"


def walk(data, label):
    print("== %s (%d bytes) ==" % (label, len(data)))
    if data[:2] != MAGIC:
        print("  not an ARJ archive (no 0x60EA magic)")
        return
    # ARJ puts a 0x60EA magic in front of every header, but the stride between
    # the main header and the first local header (and the compressed-data gap)
    # is not uniform, so locate headers by magic and keep only those whose
    # header CRC-32 verifies and whose fields are plausible. Compressed data
    # that happens to contain 0x60EA fails the CRC and is discarded.
    cand = []
    i = data.find(MAGIC)
    while i != -1:
        hlen = struct.unpack_from("<H", data, i + 2)[0] if i + 4 <= len(data) else 0
        if 0 < hlen <= 2600 and i + 4 + hlen + 4 <= len(data):
            hd = data[i + 4:i + 4 + hlen]
            crc = struct.unpack_from("<I", data, i + 4 + hlen)[0]
            if (zlib.crc32(hd) & 0xFFFFFFFF) == crc:
                m = parse_header(hd)
                first = m["first_size"]
                plausible = (12 <= first <= hlen and (m["method"] or 0) <= 4
                             and m["name"].isprintable())
                if plausible:
                    cand.append((i, m))
        i = data.find(MAGIC, i + 1)
    if not cand:
        print("  no CRC-valid headers found")
        return
    # First CRC-valid header is the main/archive header.
    off0, mh = cand[0]
    print("  main header @0x%X: archive name %r  rev %s  host_os %s  flags 0x%02X"
          % (off0, mh["name"], mh["arch_ver"], mh["host_os"], mh["flags"] or 0))
    idx = 0
    for off, m in cand[1:]:
        idx += 1
        garbled = (m["flags"] or 0) & 0x01
        print("  [%2d] @0x%-6X %-26s method=%d(%s) flags=0x%02X(%s) mod=0x%02X csize=%d osize=%d crc=%08X%s"
              % (idx, off, m["name"], m["method"] or 0, METHODS.get(m["method"], "?"),
                 m["flags"] or 0, flag_str(m["flags"]), m["modifier"] or 0,
                 m.get("csize", 0), m.get("osize", 0), m.get("ocrc", 0),
                 "  <GARBLED>" if garbled else ""))
    print("  %d local header(s); GARBLED members left encrypted (structure only)." % idx)



def main():
    if len(sys.argv) < 3 or sys.argv[1] != "list":
        print(__doc__)
        sys.exit(2)
    parts = [open(p, "rb").read() for p in sys.argv[2:]]
    data = b"".join(parts)
    walk(data, " + ".join(p.split("/")[-1] for p in sys.argv[2:]))


if __name__ == "__main__":
    main()
