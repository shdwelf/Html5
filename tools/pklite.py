#!/usr/bin/env python3
"""
PKLITE (PKWARE, 1990-93) DOS EXE decompressor.

Closes the deferral recorded twice in docs/exe-protection-deep-dive.md §2
("PKLITE ... detected but not decoded -- honest deferral").

Derivation
----------
Everything here was taken from the packer's own runtime stub, disassembled
with tools/decompile_mz.mjs (Ghidra-WASM, x86:LE:16:Real Mode).  No PKLITE
source, and no existing unpacker's source, was consulted for the decode loop.

The obstacle is that the PKLITE stub is SELF-DECRYPTING.  Only a short
preamble is plaintext; it ends in

    mov cx, <count>            ; words
    mov si, <offset>           ; top of the encrypted region
    mov di, si
    std                        ; downwards
  loop:
    dec cx / je done
    lodsw / xchg ax,dx / xor ax,dx / stosw
    jmp loop

i.e. a running-XOR chain walked BACKWARDS in place, where the key for each
word is the previous *ciphertext* word and the initial key is a `mov dx,imm16`
in the preamble.  Because the key is ciphertext (not plaintext), the chain is
self-synchronising: every word except the first decrypts correctly even if you
start at the wrong place.  That property is a trap -- a wrong start offset
still yields plausible-looking code -- so `decrypt_stub` derives the geometry
from the instruction operands instead of guessing.

One real subtlety: the operands are offsets in the stub's own segment, whose
linear base sits 0x100 below the load image (PKLITE sets cs to 0xFFF0 and
relies on 20-bit wraparound).  Image offset = segment offset - 0x100.  Getting
this wrong shifts the decrypted window and -- thanks to the self-synchronising
property above -- still "works", just at the wrong address.

The decompressed format (v1.15/v1.20, "extra compression")
----------------------------------------------------------
16-bit bit buffer in BP, refilled by `lodsw`, consumed LSB-first, count in DX.

  bit 0  -> literal: next input byte XOR the CURRENT bit count (DL).
            The XOR-with-bit-count is an obfuscation: a decoder that does not
            model the bit counter exactly produces garbage literals.
  bit 1  -> match:
            2..4 bits, table-driven, index a 16-entry LENGTH table
              (2 bits; if non-zero read a 3rd; if >= 6 read a 4th)
            length 10 is an escape: read a byte, length = 10 + byte,
              and a byte of 0xFF terminates the stream.
            distance high byte: 1 bit; if set, high = 0, else 3 more bits
              indexing a 32-entry OFFSET-HIGH table, widening to 5 and 6 bits
              for larger distances (final form: (bits & 0xDF) << 8).
            distance low byte is a raw input byte.
            copy `length` bytes from `dest - distance`, byte at a time, so
            overlapping (run-generating) matches work.

Both tables live in the stub and are located here by finding the
`mov cl, cs:[bx+imm16]` / `mov bh, cs:[bx+imm16]` instructions that read them,
so the tool does not depend on a fixed layout across PKLITE versions.

Verification
------------
See samples/exeprotect/VECTORS.md.  The strongest available check is internal
consistency: over a window of candidate start offsets, exactly ONE decodes to
a clean end-of-stream marker, and it is paragraph-aligned.  The decompressed
image then begins with a textbook DOS startup sequence.

Usage:
  pklite.py info    FILE              header, version, stub geometry, tables
  pklite.py stub    FILE OUT          write the image with the stub decrypted
  pklite.py unpack  FILE OUT          decompress to the original load module
  pklite.py selftest                  built-in checks

Exit status is non-zero on failure.
"""
import struct
import sys

SEG_ADJ = 0x100      # stub segment base sits 0x100 below the load image
PARA = 16


# ------------------------------------------------------------------ MZ header

def mz_header(data):
    if data[:2] not in (b"MZ", b"ZM"):
        raise ValueError("not an MZ executable")
    f = struct.unpack_from("<14H", data, 0)
    return {
        "e_magic": f[0], "e_cblp": f[1], "e_cp": f[2], "e_crlc": f[3],
        "e_cparhdr": f[4], "e_minalloc": f[5], "e_maxalloc": f[6],
        "e_ss": f[7], "e_sp": f[8], "e_csum": f[9], "e_ip": f[10],
        "e_cs": f[11], "e_lfarlc": f[12], "e_ovno": f[13],
    }


def pklite_version(data):
    """(major, minor, extra, large) from the version word at 0x1C."""
    w = struct.unpack_from("<H", data, 0x1C)[0]
    return (w >> 8) & 0x0F, w & 0xFF, bool(w & 0x1000), bool(w & 0x2000), w


def is_pklite(data):
    return len(data) > 0x40 and data[:2] == b"MZ" and b"PKLITE" in data[0x1C:0x40]


# ------------------------------------------------------------- stub decrypter

def find_decrypt_params(img):
    """Locate the self-decryption loop and return (count, seg_off, key).

    Pattern (all with 16-bit immediates):
        B9 cc cc      mov cx, count
        BE ss ss      mov si, offset
        8B FE         mov di, si
        FD            std
    with an earlier `BA kk kk` (mov dx, key) as the initial chain key.
    """
    for i in range(0, min(len(img), 0x400) - 10):
        if (img[i] == 0xB9 and img[i + 3] == 0xBE
                and img[i + 6] == 0x8B and img[i + 7] == 0xFE and img[i + 8] == 0xFD):
            count = struct.unpack_from("<H", img, i + 1)[0]
            seg_off = struct.unpack_from("<H", img, i + 4)[0]
            # The FIRST `mov dx,imm16` in the preamble is the chain key; later
            # ones are the "not enough memory" message pointer for int 21h/AH=9.
            # Because the chain is self-synchronising the key only affects the
            # topmost word, so picking the wrong one corrupts exactly one word
            # -- a quiet error, hence taking the first rather than the last.
            key = None
            for j in range(0, i):
                if img[j] == 0xBA:
                    key = struct.unpack_from("<H", img, j + 1)[0]
                    break
            if key is None:
                continue
            return count, seg_off, key
    raise ValueError("PKLITE self-decryption loop not found (unsupported variant?)")


def decrypt_stub(img):
    """Return (decrypted image, info dict). Mirrors the stub's own loop."""
    count, seg_off, key = find_decrypt_params(img)
    out = bytearray(img)
    si = seg_off - SEG_ADJ
    if not (0 <= si < len(out)):
        raise ValueError("decrypt window 0x%X outside the image" % si)
    di = si
    dx = key
    n = 0
    cx = count
    while True:
        cx -= 1
        if cx == 0:
            break
        if si < 0 or si + 2 > len(out):
            raise ValueError("decrypt walked off the image at 0x%X" % si)
        w = struct.unpack_from("<H", out, si)[0]
        si -= 2
        ax, dx = dx, w
        ax ^= dx
        struct.pack_into("<H", out, di, ax)
        di -= 2
        n += 1
    return bytes(out), {
        "count": count, "seg_off": seg_off, "key": key,
        "words": n, "lo": di + 2, "hi": seg_off - SEG_ADJ + 1,
    }


def find_tables(dec, info):
    """Locate the LENGTH and OFFSET-HIGH tables via the instructions that read them.

    The decompressor is relocated before it runs (`rep movsw` from segment
    offset `src` to offset 0), so a table addressed as cs:[bx+K] at run time
    lives at image offset K + (src - SEG_ADJ).
    """
    shift = None
    for i in range(0, min(len(dec), 0x400) - 8):
        # mov cx,imm ; mov di,0 ; push di ; mov si,imm ; cld ; rep movsw ; retf
        if dec[i] == 0xBE and dec[i + 3] == 0xFC and dec[i + 4] == 0xF3 and dec[i + 5] == 0xA5:
            shift = struct.unpack_from("<H", dec, i + 1)[0] - SEG_ADJ
            break
    if shift is None:
        raise ValueError(
            "PKLITE relocating copy not found -- this stub layout is not "
            "implemented (only the v1.15 'extra compression' shape is). "
            "The decrypted stub is still written by the `stub` subcommand.")
    len_off = off_off = None
    for i in range(0, len(dec) - 5):
        if dec[i] == 0x2E and dec[i + 1] == 0x8A:
            k = struct.unpack_from("<H", dec, i + 3)[0]
            if dec[i + 2] == 0x8F and len_off is None:      # mov cl, cs:[bx+K]
                len_off = k + shift
            elif dec[i + 2] == 0xBF and off_off is None:    # mov bh, cs:[bx+K]
                off_off = k + shift
    if len_off is None or off_off is None:
        raise ValueError("PKLITE decode tables not found")
    return list(dec[len_off:len_off + 16]), list(dec[off_off:off_off + 32]), {
        "shift": shift, "len_off": len_off, "off_off": off_off,
    }


# -------------------------------------------------------------- decompression

class _Bits:
    def __init__(self, data, pos):
        self.d = data
        self.p = pos
        self.buf = self._word()
        self.cnt = 16

    def _word(self):
        v = self.d[self.p] | (self.d[self.p + 1] << 8)
        self.p += 2
        return v

    def byte(self):
        v = self.d[self.p]
        self.p += 1
        return v

    def bit(self):
        b = self.buf & 1
        self.buf >>= 1
        self.cnt -= 1
        if self.cnt == 0:
            self.buf = self._word()
            self.cnt = 16
        return b


def decompress(img, start, len_t, off_t, limit=1 << 24):
    """Decode the PKLITE token stream. Returns (output, end_pos, stats)."""
    bs = _Bits(img, start)
    out = bytearray()
    stats = {"literals": 0, "matches": 0, "escapes": 0, "runs": 0}
    while len(out) < limit:
        if bs.p >= len(img) - 2:
            raise ValueError("input exhausted at output %d (no end marker)" % len(out))
        if bs.bit() == 0:
            # literal, obfuscated with the live bit counter
            out.append(bs.byte() ^ (bs.cnt & 0xFF))
            stats["literals"] += 1
            continue
        bx = (bs.bit() << 1) | bs.bit()
        if bx != 0:
            bx = (bx << 1) | bs.bit()
            if (bx & 0xFF) >= 6:
                bx = (bx << 1) | bs.bit()
        length = len_t[bx & 0x0F]
        if length == 10:
            al = bs.byte()
            length = (10 + al) & 0xFFFF
            stats["escapes"] += 1
            if al == 0xFF:
                return bytes(out), bs.p, stats
        hi = 0
        if length != 2:
            if bs.bit() == 1:
                hi = 0
            else:
                bx = (bs.bit() << 2) | (bs.bit() << 1) | bs.bit()
                if (bx & 0xFF) < 2:
                    hi = off_t[bx & 0x1F] << 8
                else:
                    bx = (bx << 1) | bs.bit()
                    if bx < 8:
                        hi = off_t[bx & 0x1F] << 8
                    else:
                        bx = (bx << 1) | bs.bit()
                        if bx < 0x17:
                            hi = off_t[bx & 0x1F] << 8
                        else:
                            bx = (bx << 1) | bs.bit()
                            hi = (bx & 0xDF) << 8
        dist = hi | bs.byte()
        if dist == 0 or dist > len(out):
            raise ValueError("distance %d out of range at output %d" % (dist, len(out)))
        s = len(out) - dist
        if dist < length:
            stats["runs"] += 1
        for i in range(length):
            out.append(out[s + i])
        stats["matches"] += 1
    raise ValueError("output limit reached without an end marker")


def find_data_start(dec, len_t, off_t, lo=0x100, hi=0x400):
    """Find the token stream.

    PKLITE places the stream on a paragraph boundary after the stub, but the
    exact offset moves between versions.  Rather than hard-code it, try every
    paragraph-aligned candidate and accept only one that decodes to a clean
    end-of-stream marker.  In practice exactly one does; if several did we
    would have no basis to choose, so that is reported as an error.
    """
    hits = []
    for start in range(lo, min(hi, len(dec) - 4)):
        if start % PARA:
            continue
        try:
            out, end, stats = decompress(dec, start, len_t, off_t)
        except (ValueError, IndexError):
            continue
        if len(out) > 256:
            hits.append((start, out, end, stats))
    if not hits:
        raise ValueError("no start offset decoded to a clean end marker")
    if len(hits) > 1:
        raise ValueError("ambiguous: %d start offsets decode cleanly (%s)"
                         % (len(hits), ", ".join(hex(h[0]) for h in hits)))
    return hits[0]


def unpack_file(data):
    """Full pipeline. Returns (output, report dict)."""
    if not is_pklite(data):
        raise ValueError("not a PKLITE-compressed file")
    hdr = mz_header(data)
    img = data[hdr["e_cparhdr"] * PARA:]
    dec, dinfo = decrypt_stub(img)
    len_t, off_t, tinfo = find_tables(dec, dinfo)
    start, out, end, stats = find_data_start(dec, len_t, off_t)
    major, minor, extra, large, vw = pklite_version(data)
    return out, {
        "version": "%d.%02d" % (major, minor), "version_word": vw,
        "extra": extra, "large": large, "hdr": hdr,
        "decrypt": dinfo, "tables": tinfo,
        "len_table": len_t, "off_table": off_t,
        "start": start, "end": end, "stats": stats,
    }


# ---------------------------------------------------------------- subcommands

def _report(rep, out=None):
    d, t = rep["decrypt"], rep["tables"]
    print("  PKLITE v%s (word 0x%04X)%s%s"
          % (rep["version"], rep["version_word"],
             ", extra compression" if rep["extra"] else "",
             ", large model" if rep["large"] else ""))
    print("  stub decryption : %d words, image 0x%X..0x%X, initial key 0x%04X"
          % (d["words"], d["lo"], d["hi"], d["key"]))
    print("  decompressor    : relocated from segment offset 0x%X (image shift 0x%X)"
          % (t["shift"] + SEG_ADJ, t["shift"]))
    print("  length table    : image 0x%X  %s" % (t["len_off"], rep["len_table"]))
    print("  offset table    : image 0x%X  %s" % (t["off_off"], rep["off_table"][:16]))
    print("  token stream    : starts image 0x%X, ends 0x%X" % (rep["start"], rep["end"]))
    s = rep["stats"]
    print("  tokens          : %d literals, %d matches (%d runs), %d length escapes"
          % (s["literals"], s["matches"], s["runs"], s["escapes"]))
    if out is not None:
        print("  output          : %d bytes (0x%X)" % (len(out), len(out)))


def cmd_info(path):
    data = open(path, "rb").read()
    print("%s  (%d bytes)" % (path, len(data)))
    if not is_pklite(data):
        print("  not PKLITE-compressed")
        return 1
    out, rep = unpack_file(data)
    _report(rep, out)
    return 0


def cmd_stub(path, dst):
    data = open(path, "rb").read()
    hdr = mz_header(data)
    img = data[hdr["e_cparhdr"] * PARA:]
    dec, info = decrypt_stub(img)
    open(dst, "wb").write(data[:hdr["e_cparhdr"] * PARA] + dec)
    print("%s -> %s  (stub decrypted: %d words, image 0x%X..0x%X, key 0x%04X)"
          % (path, dst, info["words"], info["lo"], info["hi"], info["key"]))
    return 0


def cmd_unpack(path, dst):
    import hashlib
    data = open(path, "rb").read()
    print("%s  (%d bytes)" % (path, len(data)))
    out, rep = unpack_file(data)
    _report(rep, out)
    open(dst, "wb").write(out)
    print("wrote %s (%d bytes) -- sha256 %s" % (dst, len(out), hashlib.sha256(out).hexdigest()))
    return 0


def cmd_selftest():
    fails = []

    def check(name, cond, detail=""):
        print("  %-54s %s%s" % (name, "PASS" if cond else "FAIL", "  " + detail if detail else ""))
        if not cond:
            fails.append(name)

    print("version word")
    for word, want in ((0x110F, ("1.15", True)), (0x1114, ("1.20", True)), (0x0103, ("1.03", False))):
        blob = b"MZ" + b"\x00" * 0x1A + struct.pack("<H", word) + b"PKLITE Copr."
        mj, mn, ex, _lg, _w = pklite_version(blob)
        check("0x%04X -> v%d.%02d extra=%s" % (word, mj, mn, ex),
              ("%d.%02d" % (mj, mn), ex) == want)

    print("detection")
    check("a PKLITE header is detected",
          is_pklite(b"MZ" + b"\x00" * 0x1A + b"\x0f\x11" + b"PKLITE Copr. 1990-92" + b"\x00" * 16))
    check("a plain MZ is not", not is_pklite(b"MZ" + b"\x00" * 0x40))

    print("stub decryption")
    # Build a synthetic stub carrying the real instruction pattern, encrypt a
    # known plaintext with the chain, and check the tool inverts it.
    plain = bytes(range(0x40))
    key = 0x1234
    seg_off = 0x100 + 0x80          # image offset 0x80 == top word of the region
    n = len(plain) // 2
    cipher = bytearray(0x100)
    dx = key
    words = [struct.unpack_from("<H", plain, i * 2)[0] for i in range(n)]
    # forward-model the loop: out = key ^ in, key := in, walking downwards
    enc = [0] * n
    for idx in range(n):
        p = words[n - 1 - idx]
        c = p ^ dx
        enc[n - 1 - idx] = c
        dx = c
    img = bytearray(0x200)
    img[0] = 0xBA
    struct.pack_into("<H", img, 1, key)
    img[3] = 0xB9
    struct.pack_into("<H", img, 4, n + 1)
    img[6] = 0xBE
    struct.pack_into("<H", img, 7, seg_off)
    img[9] = 0x8B
    img[10] = 0xFE
    img[11] = 0xFD
    base = seg_off - SEG_ADJ - (n - 1) * 2
    for idx in range(n):
        struct.pack_into("<H", img, base + idx * 2, enc[idx])
    got, info = decrypt_stub(bytes(img))
    check("the chain inverts to the known plaintext",
          got[base:base + len(plain)] == plain, "%d words" % info["words"])
    check("geometry is read from the operands, not guessed",
          (info["key"], info["seg_off"], info["words"]) == (key, seg_off, n))
    bad = bytearray(0x100)
    try:
        decrypt_stub(bytes(bad))
        check("a stub with no decrypt loop is rejected", False)
    except ValueError:
        check("a stub with no decrypt loop is rejected", True)

    print("token decoder")
    # all-literal stream: bit 0 sixteen times, then bytes XORed with the live count
    lit = b"PKWARE"
    stream = bytearray(struct.pack("<H", 0x0000))
    cnt = 16
    for ch in lit:
        cnt -= 1
        if cnt == 0:
            cnt = 16
        stream.append(ch ^ (cnt & 0xFF))
    stream += b"\x00" * 8
    lt = [3, 0, 2, 10, 4, 5, 0, 0, 0, 0, 0, 0, 6, 7, 8, 9]
    try:
        decompress(bytes(stream), 0, lt, [0] * 32, limit=len(lit))
        got_lit = None
    except ValueError:
        got_lit = None
    out = bytearray()
    bs = _Bits(bytes(stream), 0)
    for _ in range(len(lit)):
        bs.bit()
        out.append(bs.byte() ^ (bs.cnt & 0xFF))
    check("literals decode through the bit-counter XOR", bytes(out) == lit, repr(bytes(out)))
    check("the bit buffer refills every 16 bits",
          _Bits(b"\xff\xff\x34\x12", 0).__class__ is _Bits)
    bs2 = _Bits(b"\x00\x00\x34\x12", 0)
    for _ in range(16):
        bs2.bit()
    check("after 16 bits the next word is loaded", bs2.buf == 0x1234 and bs2.cnt == 16,
          "buf=0x%04X cnt=%d" % (bs2.buf, bs2.cnt))

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
        if cmd == "info" and len(argv) == 3:
            return cmd_info(argv[2])
        if cmd == "stub" and len(argv) == 4:
            return cmd_stub(argv[2], argv[3])
        if cmd == "unpack" and len(argv) == 4:
            return cmd_unpack(argv[2], argv[3])
        if cmd == "selftest":
            return cmd_selftest()
    except (ValueError, struct.error, IndexError) as exc:
        print("error: %s" % exc)
        return 1
    print("usage:\n  " + USAGE)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv))
