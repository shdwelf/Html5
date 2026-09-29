#!/usr/bin/env python3
"""
SCUMM (LucasArts) resource-file deobfuscator and container walker.

Derived from the shipped bytes of the official "Indiana Jones and the Fate of
Atlantis" playable demo (PLAYFATE, LucasArts 1994), archived at
samples/archive/games/PLAYFATE.zip.  See docs/dos-game-disassembly.md and
docs/scumm-and-exe-compressors.md.

The obfuscation
---------------
SCUMM v5 ships the game as an index file (.000) and a data file (.001), both
whole-file XORed with a single constant byte.  For Fate of Atlantis that byte
is 0x69.  This is not encryption -- it is a single-byte XOR whose key is
recoverable from any known block tag, and this tool recovers it that way
rather than hard-coding it (see `detect_key`).

The container
-------------
After the XOR both files are IFF-ish: a 4-byte ASCII tag followed by a
BIG-endian u32 size that INCLUDES the 8-byte header itself.

  .001   LECF                     outer wrapper
           LOFF                   room-number -> file-offset directory
           LFLF ...               one per room actually present
             ROOM, RMHD, ...      room contents

  .000   RNAM                     room-number -> 9-char name table
           (name bytes carry a SECOND, different XOR: 0xFF)
         MAXS, DROO, DSCR, ...    object/script directories

The 0xFF on the name characters is a separate layer from the 0x69 on the file,
which is why a naive single-XOR dump shows structure but garbled names.

What this found in the demo
---------------------------
PLAYFATE.000 carries the room-name table for the ENTIRE retail game -- 97
entries, including the Barnett College rooms (col-offi, col-hall, col-base,
col-atti, col-stor, col-arch, col-catr) and the endgame (end-volc, end-v2,
endscene) -- while PLAYFATE.001 physically contains only 10 rooms.  Names of
rooms stripped from the demo build keep a leading ';'.  That is a hypothesis
this tool verifies rather than asserts: `verify` checks that the set of rooms
in the LOFF directory is exactly the set of names WITHOUT the ';' prefix.  It
matches, 10 for 10.

Usage:
  scumm.py key    FILE            recover the XOR key from the block tag
  scumm.py deob   IN OUT          write the de-XORed file
  scumm.py walk   FILE            dump the block tree
  scumm.py rooms  INDEX.000       dump the room-name table
  scumm.py verify INDEX.000 DATA.001
                                  cross-check names vs. rooms present
  scumm.py selftest               run the built-in checks

Exit status is non-zero when a check fails.
"""
import os
import struct
import sys

# Tags that may legally start a SCUMM v5 index / data file.  Recovering the key
# from these is what makes `detect_key` evidence-based instead of a constant.
ROOT_TAGS = (b"LECF", b"RNAM", b"LOFF", b"MAXS")
CONTAINER_TAGS = (b"LECF", b"LFLF", b"ROOM", b"RNAM")
NAME_XOR = 0xFF  # second layer, applied to RNAM name characters only
NAME_LEN = 9


def detect_key(data: bytes):
    """Recover the whole-file XOR byte from the first four bytes.

    Every candidate root tag gives a candidate key; a key is only accepted if
    all four bytes agree on it. Returns (key, tag) or (None, None).
    """
    if len(data) < 4:
        return None, None
    for tag in ROOT_TAGS:
        keys = {data[i] ^ tag[i] for i in range(4)}
        if len(keys) == 1:
            return keys.pop(), tag
    return None, None


def deobfuscate(data: bytes, key: int) -> bytes:
    if key == 0:
        return bytes(data)
    return bytes(b ^ key for b in data)


def _u32be(buf, off):
    return struct.unpack_from(">I", buf, off)[0]


def walk(buf, off=0, end=None, depth=0, collect=None):
    """Yield (depth, tag, offset, size) for every block, recursing containers."""
    if end is None:
        end = len(buf)
    while off + 8 <= end:
        tag = bytes(buf[off:off + 4])
        size = _u32be(buf, off + 4)
        # A size that does not cover its own header, or overruns the parent,
        # means we have desynchronised -- stop rather than emit garbage.
        if size < 8 or off + size > end:
            break
        if collect is not None:
            collect.append((depth, tag, off, size))
        if tag in CONTAINER_TAGS and tag != b"RNAM":
            walk(buf, off + 8, off + size, depth + 1, collect)
        off += size
    return collect


def parse_rnam(index: bytes):
    """Room-number -> name. Names carry the extra 0xFF XOR."""
    if index[0:4] != b"RNAM":
        raise ValueError("not an RNAM block: %r" % index[0:4])
    size = _u32be(index, 4)
    rooms = {}
    off = 8
    while off + 1 + NAME_LEN <= min(size, len(index)):
        num = index[off]
        if num == 0:
            break
        raw = index[off + 1:off + 1 + NAME_LEN]
        name = bytes(c ^ NAME_XOR for c in raw).rstrip(b"\x00").decode("latin1")
        # The table ends with a padding entry that repeats the last room
        # number with an all-zero (empty) name.  Treat an empty name as the
        # terminator; relying on dict-overwrite to hide it would make the
        # count depend on an accident of the data structure.
        if not name:
            break
        rooms[num] = name
        off += 1 + NAME_LEN
    return rooms


def parse_loff(data: bytes):
    """Room numbers present in the data file, from the LOFF directory."""
    blocks = walk(data, collect=[])
    for _depth, tag, off, size in blocks:
        if tag == b"LOFF":
            count = data[off + 8]
            out = {}
            for i in range(count):
                base = off + 9 + i * 5
                num = data[base]
                out[num] = struct.unpack_from("<I", data, base + 1)[0]
            return out
    return {}


def _load(path):
    raw = open(path, "rb").read()
    key, tag = detect_key(raw)
    if key is None:
        raise SystemExit("%s: no recognised SCUMM root tag; not a v5 resource file" % path)
    return deobfuscate(raw, key), key, tag


# ---------------------------------------------------------------- subcommands

def cmd_key(path):
    raw = open(path, "rb").read()
    key, tag = detect_key(raw)
    if key is None:
        print("%s: no recognised root tag (tried %s)" % (path, ", ".join(t.decode() for t in ROOT_TAGS)))
        return 1
    print("%s: XOR key 0x%02X, root tag %s" % (path, key, tag.decode()))
    return 0


def cmd_deob(src, dst):
    data, key, tag = _load(src)
    open(dst, "wb").write(data)
    print("%s -> %s  (%d bytes, XOR 0x%02X, root %s)" % (src, dst, len(data), key, tag.decode()))
    return 0


def cmd_walk(path):
    data, key, tag = _load(path)
    print("%s: %d bytes, XOR 0x%02X, root %s" % (path, len(data), key, tag.decode()))
    blocks = walk(data, collect=[])
    shown = 0
    for depth, btag, off, size in blocks:
        if depth > 1 and shown > 60:
            continue
        print("  %s%-4s  off=0x%06X  size=%d" % ("  " * depth, btag.decode("latin1"), off, size))
        shown += 1
    if shown < len(blocks):
        print("  ... %d more blocks" % (len(blocks) - shown))
    print("  total blocks: %d" % len(blocks))
    return 0


def cmd_rooms(path):
    data, key, tag = _load(path)
    rooms = parse_rnam(data)
    stripped = sorted(n for n, nm in rooms.items() if nm.startswith(";"))
    kept = sorted(n for n, nm in rooms.items() if not nm.startswith(";"))
    print("%s: %d room names (XOR 0x%02X on the file, 0x%02X on the names)"
          % (path, len(rooms), key, NAME_XOR))
    for num in sorted(rooms):
        mark = "  (stripped)" if rooms[num].startswith(";") else ""
        print("  %3d  %-10s%s" % (num, rooms[num], mark))
    print("  %d marked ';' (absent from this build), %d unmarked" % (len(stripped), len(kept)))
    return 0


def cmd_verify(index_path, data_path):
    index, _k1, _t1 = _load(index_path)
    data, _k2, _t2 = _load(data_path)
    rooms = parse_rnam(index)
    loff = parse_loff(data)
    present = sorted(loff)
    unmarked = sorted(n for n, nm in rooms.items() if not nm.startswith(";"))
    lflf = [b for b in walk(data, collect=[]) if b[1] == b"LFLF"]

    print("room-name table (%s): %d entries" % (os.path.basename(index_path), len(rooms)))
    print("LOFF directory  (%s): %d rooms" % (os.path.basename(data_path), len(loff)))
    print("LFLF blocks physically present: %d" % len(lflf))
    print()
    print("rooms present : %s" % present)
    print("names w/o ';' : %s" % unmarked)
    ok = present == unmarked and len(lflf) == len(present)
    print()
    for num in present:
        print("  room %3d -> %s" % (num, rooms.get(num, "<unnamed>")))
    print()
    if ok:
        print("PASS: the ';' prefix marks exactly the rooms stripped from this build")
        print("      (%d shipped, %d listed but absent)" % (len(present), len(rooms) - len(present)))
        return 0
    print("FAIL: the ';' hypothesis does not hold for this pair")
    return 1


def cmd_selftest():
    fails = []

    def check(name, cond, detail=""):
        print("  %-52s %s%s" % (name, "PASS" if cond else "FAIL", "  " + detail if detail else ""))
        if not cond:
            fails.append(name)

    print("key recovery")
    for key in (0x00, 0x69, 0xFF, 0x5A):
        blob = deobfuscate(b"LECF" + b"\x00\x00\x00\x10" + b"\x00" * 8, key)
        got, tag = detect_key(blob)
        check("XOR 0x%02X round-trips through detect_key" % key, got == key and tag == b"LECF",
              "got 0x%02X" % (got if got is not None else 0xFFFF))
    junk = bytes([0x01, 0x02, 0x03, 0x04])
    check("a non-SCUMM header is rejected", detect_key(junk) == (None, None))

    print("container walk")
    inner = b"ROOM" + struct.pack(">I", 8)
    outer = b"LFLF" + struct.pack(">I", 8 + len(inner)) + inner
    root = b"LECF" + struct.pack(">I", 8 + len(outer)) + outer
    got = walk(root, collect=[])
    check("nested LECF/LFLF/ROOM walks to 3 blocks", len(got) == 3, str([t.decode() for _d, t, _o, _s in got]))
    check("depths are 0,1,2", [d for d, _t, _o, _s in got] == [0, 1, 2])
    bad = b"LECF" + struct.pack(">I", 4)  # size smaller than its own header
    check("a size shorter than the header stops the walk", walk(bad, collect=[]) == [])
    over = b"LECF" + struct.pack(">I", 9999)
    check("a size overrunning the buffer stops the walk", walk(over, collect=[]) == [])

    print("RNAM")
    rn = b"RNAM" + struct.pack(">I", 8 + 20 + 1)
    rn += bytes([7]) + bytes(c ^ NAME_XOR for c in b"col-offi\x00")
    rn += bytes([9]) + bytes(c ^ NAME_XOR for c in b";stripped")
    rn += b"\x00"
    rooms = parse_rnam(rn)
    check("names decode through the second 0xFF XOR", rooms.get(7) == "col-offi", repr(rooms.get(7)))
    check("';' prefix survives decoding", rooms.get(9, "").startswith(";"))
    check("a zero room number terminates the table", len(rooms) == 2)

    print()
    print("%d failure(s)" % len(fails))
    return 1 if fails else 0


USAGE = __doc__.split("Usage:")[1].strip()


def main(argv):
    if len(argv) < 2:
        print("usage:\n  " + USAGE)
        return 2
    cmd = argv[1]
    try:
        if cmd == "key" and len(argv) == 3:
            return cmd_key(argv[2])
        if cmd == "deob" and len(argv) == 4:
            return cmd_deob(argv[2], argv[3])
        if cmd == "walk" and len(argv) == 3:
            return cmd_walk(argv[2])
        if cmd == "rooms" and len(argv) == 3:
            return cmd_rooms(argv[2])
        if cmd == "verify" and len(argv) == 4:
            return cmd_verify(argv[2], argv[3])
        if cmd == "selftest":
            return cmd_selftest()
    except (ValueError, struct.error) as exc:
        print("error: %s" % exc)
        return 1
    print("usage:\n  " + USAGE)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv))
