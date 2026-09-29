#!/usr/bin/env python3
"""exeprotect.py — DOS EXE (MZ) protection triage + LZEXE 0.91 unpacker.

Companion tool for the "EXE Protection" kitchen recipes. The LZEXE 0.91
decoder below was derived from the packer's own runtime stub (disassembled
with tools/decompile_mz.mjs, the Ghidra-WASM MZ loader) and verified
byte-for-byte against the classic UNLZEXE 0.9 utility (mywave82/unlzexe,
compiled and run on the same files) — see samples/exeprotect/VECTORS.md.

Usage:
  python3 tools/exeprotect.py triage  FILE            # MZ header + packer ID
  python3 tools/exeprotect.py unpack  FILE OUT.EXE    # LZEXE 0.91 -> original
  python3 tools/exeprotect.py verify  FILE SHA256     # unpack, compare image
                                                      # hash (reference check)

Exit code is non-zero on verification failure or unimplemented packer.
PKLITE (and LZEXE 0.90) are detected but not decoded — honest deferral.
"""
import hashlib
import struct
import sys

MZ_FIELDS = [
    ("e_magic", "H"), ("e_cblp", "H"), ("e_cp", "H"), ("e_crlc", "H"),
    ("e_cparhdr", "H"), ("e_minalloc", "H"), ("e_maxalloc", "H"),
    ("e_ss", "H"), ("e_sp", "H"), ("e_csum", "H"),
    ("e_ip", "H"), ("e_cs", "H"), ("e_ovno", "H"),
]
LZEXE_STUB_STEP_PARAS = 0x7CC      # dest step used by the 0.91 stub
LZEXE91_RELOC_OFF = 0x158          # compressed reloc table inside the stub


def lzexe_stub_off(hdr):
    """Image-relative offset of the LZEXE stub data area (8 words).

    LZEXE parks the stub in its own segment and points the MZ entry at it,
    with `e_ip = 0x0E` so execution starts just past the data words. The
    data area is therefore at the start of that segment: `e_cs << 4` bytes
    into the load module (the load module itself begins at
    `e_cparhdr << 4` in the file). UNLZEXE reads its `inf[]` from the same
    place.

    This used to be the hard-coded constant 0x5B30, which is simply
    `e_cs << 4` for ATR.EXE — the only sample it was ever run on. Every
    other LZEXE file has a different `e_cs`, so the constant read the
    wrong 16 bytes, produced nonsense stub info, and walked the
    relocation decoder off into garbage until it threw. Deriving it from
    the header is what makes the unpacker work on the whole corpus;
    ATR.EXE's verified vectors are unchanged because 0x5B3 << 4 == 0x5B30.
    """
    return hdr["e_cs"] << 4


def parse_mz(data):
    if data[:2] not in (b"MZ", b"ZM"):
        raise SystemExit("not an MZ file (bad magic)")
    hdr = {name: struct.unpack_from(fmt, data, off)[0]
           for off, (name, fmt) in enumerate_intervals()}
    hdr["entry_off"] = ((hdr["e_cparhdr"] + hdr["e_cs"]) << 4) + hdr["e_ip"]
    return hdr


def enumerate_intervals():
    off = 0
    for name, fmt in MZ_FIELDS:
        yield off, (name, fmt)
        off += struct.calcsize(fmt)


def detect_packer(data, hdr):
    """Return (name, detail) for the packer/protector, or (None, ...)."""
    marker = data[0x1C:0x20]
    word18 = struct.unpack_from("<H", data, 0x18)[0]
    if word18 == 0x001C and marker in (b"LZ91", b"LZ09"):
        ver = "0.91" if marker == b"LZ91" else "0.90"
        return ("LZEXE " + ver,
                "signature %r at 0x1C (relocation table pointer forced to "
                "0x1C so the marker doubles as a valid empty reloc table)"
                % marker)
    for needle, name in ((b"PKLITE Copr.", "PKLITE"),
                         (b"PKLITE", "PKLITE (marker only)"),
                         (b"[ MK / TridenT ]", "TPE (Trident Polymorphic Engine)")):
        if needle in data:
            return (name, "string %r at file offset 0x%X"
                    % (needle, data.index(needle)))
    return (None, "no known packer signature; entry at file offset 0x%X"
            % hdr["entry_off"])


def lzexe91_relocations(image, stub_off):
    """Decode the compressed relocation table at stub+0x158.

    Semantics mirror UNLZEXE 0.9 (reloc91): byte spans accumulate rel_off;
    a 0x00 byte announces a word: 0x0000 bumps rel_seg by 0x0FFF, 0x0001
    terminates, anything larger is a wide span.

    `stub_off` is image-relative (see lzexe_stub_off).
    """
    i = stub_off + LZEXE91_RELOC_OFF
    rel_off = 0
    rel_seg = 0
    relocs = []
    while True:
        if i + 2 >= len(image):
            raise SystemExit("relocation table ran off the end of the image at "
                             "0x%X — stub offset 0x%X is not a 0.91 stub"
                             % (i, stub_off))
        span = image[i]; i += 1
        if span == 0:
            word = image[i] | (image[i + 1] << 8); i += 2
            if word == 0:
                rel_seg += 0x0FFF
                continue
            if word == 1:
                return relocs
            span = word
        rel_off += span
        rel_seg += (rel_off & ~0x0F) >> 4
        rel_off &= 0x0F
        relocs.append((rel_seg, rel_off))


def lzexe91_unpack(image):
    """LZEXE 0.91 load-module decode. Returns (image_bytes, stats).

    Grammar (from the stub, confirmed against UNLZEXE 0.9):
      * 16-bit flag words, bits consumed LSB-first; 1 = literal byte.
      * 0 0 <2-bit L> <byte>            short match, len = L+2,
                                        disp = byte - 0x100
      * 0 1 <word w>                    long match; lo = w&0xFF, hi = w>>8,
                                        disp = -0x2000 + ((hi>>3)<<8) + lo,
                                        len = (hi&7)+2
      * len == 0 special byte:          0 = END, 1 = segment change (the
                                        sliding-window representation
                                        shuffle; no bytes emitted),
                                        n >= 2 = run, len = n+1, same disp
      * matches copy byte-by-byte (overlapping RLE-style copies work).
    The flag word is reloaded the moment the 16th bit is dispensed —
    BEFORE the element bytes for that bit are read (stub: dec dx / jne /
    lodsw sits ahead of the movsb). Getting this lazy-vs-eager reload
    wrong desynchronises the whole stream after 15 elements.
    """
    out = bytearray()
    si = 0
    flag = 0
    bits = 0
    stats = {"literal": 0, "short": 0, "long": 0, "run": 0, "slide": 0,
             "consumed": 0}

    def word():
        nonlocal si
        w = image[si] | (image[si + 1] << 8)
        si += 2
        return w

    def bit():
        nonlocal flag, bits
        if bits == 0:
            flag = word()
            bits = 16
        cf = flag & 1
        flag >>= 1
        bits -= 1
        if bits == 0:                     # eager reload, see docstring
            flag = word()
            bits = 16
        return cf

    while True:
        if bit() == 1:
            out.append(image[si]); si += 1
            stats["literal"] += 1
            continue
        if bit() == 0:
            length = ((bit() << 1) | bit()) + 2
            disp = image[si] - 0x100
            si += 1
            stats["short"] += 1
        else:
            w = word()
            lo = w & 0xFF
            hi = w >> 8
            disp = -0x2000 + ((hi >> 3) << 8) + lo
            ln = hi & 7
            if ln == 0:
                cmd = image[si]; si += 1
                if cmd == 0:
                    stats["consumed"] = si
                    return bytes(out), stats
                if cmd == 1:
                    stats["slide"] += 1
                    continue
                length = cmd + 1
                stats["run"] += 1
            else:
                length = ln + 2
                stats["long"] += 1
        src = len(out) + disp
        if src < 0:
            raise SystemExit("match reaches before start of output at "
                             "out[%d]+%d — stream desynchronised" %
                             (len(out), disp))
        for k in range(length):
            out.append(out[src + k])


def rebuild_exe(data, hdr, image, relocs, stub_off):
    """Rebuild the original EXE exactly like UNLZEXE 0.9 does."""
    base = (hdr["e_cparhdr"] << 4) + stub_off
    stub = data[base:base + 16]
    inf = struct.unpack("<8H", stub)
    oip, ocs, osp, oss = inf[0], inf[1], inf[2], inf[3]
    word18 = struct.unpack_from("<H", data, 0x18)[0]
    word1a = struct.unpack_from("<H", data, 0x1A)[0]
    out = bytearray(struct.pack("<14H",
                                0x5A4D, hdr["e_cblp"], hdr["e_cp"], len(relocs),
                                0, hdr["e_minalloc"], hdr["e_maxalloc"],
                                oss, osp, hdr["e_csum"], oip, ocs,
                                word18, word1a))
    for seg, off in relocs:
        # A 16-bit reloc table cannot express a segment above 0xFFFF; a
        # decode that produces one means the table was misread, not that
        # the file is exotic. Fail loudly rather than emit a corrupt EXE.
        if not (0 <= seg <= 0xFFFF and 0 <= off <= 0xFFFF):
            raise SystemExit("relocation %04X:%04X out of range — the "
                             "decoded table is not a valid 0.91 table" % (seg, off))
        out += struct.pack("<HH", off, seg)
    fpos = len(out)
    pad = (0x200 - fpos) & 0x1FF
    cparhdr = (fpos + pad) >> 4
    out += b"\x00" * pad
    out += image
    loadsize = len(image)
    struct.pack_into("<H", out, 8, cparhdr)
    struct.pack_into("<H", out, 2, (loadsize + (cparhdr << 4)) & 0x1FF)  # e_cblp
    struct.pack_into("<H", out, 4, (loadsize + (cparhdr << 4) + 0x1FF) >> 9)  # e_cp
    minalloc = hdr["e_minalloc"]
    if hdr["e_maxalloc"] != 0:
        minalloc -= inf[5] + ((inf[6] + 15) >> 4) + 9
        struct.pack_into("<H", out, 10, minalloc & 0xFFFF)
        if hdr["e_maxalloc"] != 0xFFFF:
            struct.pack_into("<H", out, 12,
                             (hdr["e_maxalloc"] - (hdr["e_minalloc"] - minalloc)) & 0xFFFF)
    return bytes(out)


def cmd_triage(path):
    data = open(path, "rb").read()
    hdr = parse_mz(data)
    print("file: %s (%d bytes)" % (path, len(data)))
    for name, _ in MZ_FIELDS:
        print("  %-11s = 0x%04X" % (name, hdr[name]))
    print("  entry      = %04X:%04X (file offset 0x%X)"
          % (hdr["e_cs"], hdr["e_ip"], hdr["entry_off"]))
    relocs_off = 0x1C
    n = min(hdr["e_crlc"], 8)
    print("  relocations: %d" % hdr["e_crlc"])
    for i in range(n):
        off, seg = struct.unpack_from("<HH", data, relocs_off + 4 * i)
        print("    [%d] %04X:%04X" % (i, seg, off))
    name, detail = detect_packer(data, hdr)
    print("  packer: %s — %s" % (name or "unknown", detail))
    if name and name.startswith("LZEXE 0.91"):
        image = data[hdr["e_cparhdr"] << 4:]
        stub_off = lzexe_stub_off(hdr)
        stub = image[stub_off:stub_off + 14]
        inf = struct.unpack("<7H", stub)
        print("  LZEXE stub data area: image offset 0x%X (e_cs<<4), file "
              "offset 0x%X" % (stub_off, (hdr["e_cparhdr"] << 4) + stub_off))
        print("  LZEXE stub info: orig entry %04X:%04X, orig ss:sp %04X:%04X,"
              " packed paras 0x%X, grow paras 0x%X, stub+reloc bytes 0x%X"
              % (inf[1], inf[0], inf[3], inf[2], inf[4], inf[5], inf[6]))
        print("  reloc table decodes to %d entries"
              % len(lzexe91_relocations(image, stub_off)))


def cmd_unpack(path, out_path):
    data = open(path, "rb").read()
    hdr = parse_mz(data)
    name, _ = detect_packer(data, hdr)
    if name == "LZEXE 0.90":
        raise SystemExit("LZEXE 0.90 detected — this tool implements 0.91 "
                         "only (0.90 uses a different stub and reloc table)")
    if name != "LZEXE 0.91":
        raise SystemExit("unsupported packer: %s" % (name or "none detected"))
    image = data[hdr["e_cparhdr"] << 4:]
    stub_off = lzexe_stub_off(hdr)
    out, stats = lzexe91_unpack(image)
    relocs = lzexe91_relocations(image, stub_off)
    # The packed file's e_crlc is 0 (the LZ91 marker doubles as an empty
    # reloc table); the real table is rebuilt from the stub's compressed one.
    exe = rebuild_exe(data, hdr, out, relocs, stub_off)
    print("unpacked load module: %d bytes (0x%X)" % (len(out), len(out)))
    print("  sha256(image) = %s" % hashlib.sha256(out).hexdigest())
    print("  stream: %d of %d bytes consumed; %d literals, %d short, "
          "%d long matches, %d runs, %d segment slides"
          % (stats["consumed"], len(image), stats["literal"], stats["short"],
             stats["long"], stats["run"], stats["slide"]))
    print("  relocations: %d" % len(relocs))
    if exe:
        open(out_path, "wb").write(exe)
        print("wrote %s (%d bytes) — sha256 %s"
              % (out_path, len(exe), hashlib.sha256(exe).hexdigest()))


def cmd_verify(path, expected):
    data = open(path, "rb").read()
    hdr = parse_mz(data)
    image = data[hdr["e_cparhdr"] << 4:]
    out, _ = lzexe91_unpack(image)
    got = hashlib.sha256(out).hexdigest()
    ok = got == expected.lower()
    print("%s: image sha256 %s %s expected %s"
          % ("PASS" if ok else "FAIL", got,
             "==" if ok else "!=", expected))
    sys.exit(0 if ok else 1)


def main(argv):
    if len(argv) >= 3 and argv[1] == "triage":
        cmd_triage(argv[2])
    elif len(argv) >= 4 and argv[1] == "unpack":
        cmd_unpack(argv[2], argv[3])
    elif len(argv) >= 4 and argv[1] == "verify":
        cmd_verify(argv[2], argv[3])
    else:
        raise SystemExit(__doc__)


if __name__ == "__main__":
    main(sys.argv)
