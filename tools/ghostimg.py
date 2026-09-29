#!/usr/bin/env python3
"""ghostimg.py — Norton Ghost .GHO/.GHS container, Fast LZ codec, and an
analysis of the password cipher that ships with the format.

Companion to docs/norton-ghost-deep-dive.md. This completes the "Norton
Ghost processor-lock and encryption" item left open in
docs/virus-encyclopedia.md.

What is implemented, and on what authority:

  * Container layer (512-byte file header, 10-byte records, 2-byte framed
    blocks). Two independent reverse-engineering projects publish the same
    byte layout for Ghost 11.5.1 — nyarime/gho (Go) and tomeq82/gho
    (Rust) — so the container is corroborated. Where they *disagree* (the
    record type field: one u32 with flags in the high half, versus u16
    type + u16 padding) the disagreement is reported, not papered over.

  * Fast LZ (Z1) decompressor, transcribed from the published
    reconstruction of Ghost 11.5.1's `sub_4DDD70`. Single-sourced.

  * The CRC-16 password cipher. **Single-sourced and contested**:
    nyarime/gho publishes it; tomeq82/gho states Ghost's encryption is not
    reverse-engineered and refuses encrypted images. Everything this tool
    says about Ghost encryption is therefore a statement about *that
    published reconstruction*, which is what `analyse` reports on.

The cryptanalysis is the point. The construction has a 16-bit state and
the password only chooses where that state starts, so the whole password
space collapses onto at most 65 536 keystreams. `python3 tools/ghostimg.py
analyse` demonstrates that, and `--selftest` round-trips the codec and the
container.

Usage:
  python3 tools/ghostimg.py info     FILE.GHO      # header + record walk
  python3 tools/ghostimg.py analyse                # cipher cryptanalysis
  python3 tools/ghostimg.py selftest               # codec + container tests
"""
from __future__ import annotations

import hashlib
import struct
import sys

# ---------------------------------------------------------------- constants
FILE_MAGIC = 0xEFFE          # bytes FE EF; also opens each FEEF partition header
RECORD_MAGIC = 0x012F18D8    # at offset 4 of every record header
HEADER_SIZE = 512
RECORD_HEADER_SIZE = 10
BLOCK_SIZE = 32768           # decompressed size of a full block
FASTLZ_HASH_SIZE = 4096

REC_TRACK0 = 0x0006          # track 0 / MBR
REC_PARTITION = 0x0603       # partition descriptor
REC_CONTINUATION = 0x0703    # span continuation
REC_END = 0x0023             # end of image

COMPRESSION = {
    0: "none (Z0)",
    1: "old/unsupported",
    2: "Fast LZ (Z1)",
    **{n: "zlib (Z%d, 'High')" % n for n in range(3, 10)},
}

# The decompressor's hash table starts out pointing at this literal in the
# original Ghost code, so a match token emitted before its slot was ever
# filled reproduces these bytes rather than reading uninitialised memory.
FASTLZ_SENTINEL = b"123456789012345678"


# ------------------------------------------------------------- CRC-16 cipher
def _crc16_table() -> list[int]:
    """CRC-16/ARC table: reflected polynomial 0xA001 (= 0x8005 reversed)."""
    table = []
    for i in range(256):
        crc = i
        for _ in range(8):
            crc = (crc >> 1) ^ 0xA001 if crc & 1 else crc >> 1
        table.append(crc)
    return table


CRC16_TABLE = _crc16_table()


def crc16_update(crc: int, byte: int) -> int:
    return (crc >> 8) ^ CRC16_TABLE[(crc ^ byte) & 0xFF]


def password_state(password: str | bytes) -> int:
    """Fold a password into the cipher's 16-bit initial state.

    This is the whole of the key schedule: init 0xFFFF, then run the
    password bytes through the CRC update. The output is 16 bits wide no
    matter how long the password is.
    """
    data = password.encode() if isinstance(password, str) else password
    state = 0xFFFF
    for b in data:
        state = crc16_update(state, b)
    return state


class GhostCipher:
    """Ghost's password cipher: an autokey / self-synchronising XOR stream.

    keystream byte = low 8 bits of the state
    state         := crc16_update(state, PLAINTEXT byte)

    Because the state advances on the *plaintext*, encryption and
    decryption are not the same loop (decrypt must recover the plaintext
    byte first, then feed it back), but the cipher is self-synchronising:
    knowing the state at any offset decrypts everything after it.
    """

    def __init__(self, password: str | bytes | None = None, state: int | None = None):
        if state is not None:
            self.state = state & 0xFFFF
        else:
            if not password:
                raise ValueError("empty password")
            self.state = password_state(password)

    def encrypt(self, data: bytes) -> bytes:
        out = bytearray(len(data))
        st = self.state
        for i, p in enumerate(data):
            out[i] = p ^ (st & 0xFF)
            st = crc16_update(st, p)
        self.state = st
        return bytes(out)

    def decrypt(self, data: bytes) -> bytes:
        out = bytearray(len(data))
        st = self.state
        for i, c in enumerate(data):
            p = c ^ (st & 0xFF)
            st = crc16_update(st, p)
            out[i] = p
        self.state = st
        return bytes(out)


# ------------------------------------------------------------ Fast LZ (Z1)
def fastlz_hash(b0: int, b1: int, b2: int) -> int:
    """h = ((-24993 * (b2 ^ (16 * (b1 ^ (16 * b0))))) >> 4) & 0xFFF"""
    v = b2 ^ (16 * (b1 ^ (16 * b0)))
    # signed 32-bit multiply, then an unsigned shift of the 32-bit result
    prod = (-24993 * v) & 0xFFFFFFFF
    return (prod >> 4) & 0xFFF


def fastlz_decompress(data: bytes, comp_len: int, out_cap: int = BLOCK_SIZE) -> bytes:
    """Decode one Ghost Fast LZ block body.

    Block body layout: byte 0 == 1 means the block is stored, and the
    payload is data[4:comp_len]. Otherwise the body is a token stream that
    starts at offset 4 and is driven by 16-bit control words, LSB first:
    bit 0 = copy one literal byte, bit 1 = a 2-byte match token.

    A match token is (b0, b1): hash index = b1 | ((b0 & 0xF0) << 4), and
    the copy length is 3 + (b0 & 0x0F). The *source* of the copy is not a
    displacement — it is whatever output position the 4096-entry hash
    table currently holds for that index, which is what makes this a hash
    -addressed LZ rather than a classic LZ77.
    """
    if comp_len <= 0 or len(data) < comp_len:
        raise ValueError("truncated Fast LZ block")

    if data[0] == 1:
        n = comp_len - 4
        if n <= 0 or n > out_cap:
            raise ValueError("bad stored block length %d" % n)
        return bytes(data[4:4 + n])

    dst = bytearray(out_cap)
    hash_table = [-1] * FASTLZ_HASH_SIZE
    src, src_end, out_pos = 4, comp_len, 0
    control = 1
    literal_run = 0
    prev_literal_run = 0

    while src < src_end:
        if control == 1:
            if src + 1 >= src_end:
                break
            control = data[src] | (data[src + 1] << 8) | 0x10000
            src += 2

        token_count = 1 if src_end - 32 < src else 16
        for _ in range(token_count):
            if src >= src_end:
                break
            if control & 1:
                if src + 1 >= src_end:
                    return bytes(dst[:out_pos])
                b0, b1 = data[src], data[src + 1]
                hash_idx = b1 | ((b0 & 0xF0) << 4)
                total = 3 + (b0 & 0x0F)
                match_pos = hash_table[hash_idx]
                match_start = out_pos
                for j in range(total):
                    if out_pos >= out_cap:
                        raise ValueError("Fast LZ block overruns %d bytes" % out_cap)
                    if match_pos == -1:
                        dst[out_pos] = FASTLZ_SENTINEL[j] if j < len(FASTLZ_SENTINEL) else 0
                    else:
                        si = match_pos + j
                        dst[out_pos] = dst[si] if si < out_cap else 0
                    out_pos += 1
                src += 2
                if literal_run > 0:
                    pos = match_start - literal_run
                    if pos >= 0 and pos + 2 < out_pos:
                        hash_table[fastlz_hash(dst[pos], dst[pos + 1], dst[pos + 2])] = pos
                        if prev_literal_run == 2 and pos + 3 < out_pos:
                            hash_table[fastlz_hash(dst[pos + 1], dst[pos + 2], dst[pos + 3])] = pos + 1
                    literal_run = 0
                    prev_literal_run = 0
                hash_table[hash_idx] = match_start
            else:
                if out_pos >= out_cap:
                    raise ValueError("Fast LZ block overruns %d bytes" % out_cap)
                literal_run += 1
                dst[out_pos] = data[src]
                out_pos += 1
                src += 1
                prev_literal_run = literal_run
                if literal_run == 3:
                    pos = out_pos - 3
                    hash_table[fastlz_hash(dst[pos], dst[pos + 1], dst[pos + 2])] = pos
                    literal_run = 2
                    prev_literal_run = 2
            control >>= 1
            if control == 1:
                break

    return bytes(dst[:out_pos])


# ------------------------------------------------------------- container
def parse_file_header(data: bytes) -> dict:
    if len(data) < HEADER_SIZE:
        raise ValueError("short file header")
    magic = struct.unpack_from("<H", data, 0)[0]
    if magic != FILE_MAGIC:
        raise ValueError("bad magic 0x%04X (expected 0x%04X)" % (magic, FILE_MAGIC))
    return {
        "magic": magic,
        "file_type": data[2],          # 1 = first/single, 9 = span continuation
        "compression": data[3],
        "image_id": struct.unpack_from("<I", data, 4)[0],
        "flags": data[8:11],
        # Contested: nyarime reads the encryption indicator as byte 12 bit 1;
        # tomeq82 documents the same bit as "reserved, not implemented".
        "encrypted": bool(data[12] & 0x02),
    }


def parse_record(data: bytes, off: int) -> dict:
    if off + RECORD_HEADER_SIZE > len(data):
        raise ValueError("truncated record header at 0x%X" % off)
    raw_type, magic, body_len = struct.unpack_from("<IIH", data, off)
    if magic != RECORD_MAGIC:
        raise ValueError("bad record magic 0x%08X at 0x%X" % (magic, off))
    return {
        "offset": off,
        "raw_type": raw_type,
        # The two published specs split this dword differently; both agree on
        # the low 16 bits, which is the part anybody actually dispatches on.
        "type": raw_type & 0xFFFF,
        "high": raw_type >> 16,
        "body_len": body_len,
        "body": data[off + RECORD_HEADER_SIZE: off + RECORD_HEADER_SIZE + body_len],
    }


def build_record(rtype: int, body: bytes, high: int = 0) -> bytes:
    return struct.pack("<IIH", (high << 16) | rtype, RECORD_MAGIC, len(body)) + body


def build_file_header(compression: int, image_id: int, file_type: int = 1,
                      encrypted: bool = False) -> bytes:
    h = bytearray(HEADER_SIZE)
    struct.pack_into("<H", h, 0, FILE_MAGIC)
    h[2] = file_type
    h[3] = compression
    struct.pack_into("<I", h, 4, image_id)
    if encrypted:
        h[12] |= 0x02
    return bytes(h)


def frame_block(payload: bytes) -> bytes:
    """A block is [LE u16 stored_len][payload]; stored_len counts itself."""
    return struct.pack("<H", len(payload) + 2) + payload


def stored_block(raw: bytes) -> bytes:
    """A Z1 'stored' block body: marker 1, 3 pad bytes, then the raw data."""
    return b"\x01\x00\x00\x00" + raw


def cmd_info(path: str) -> int:
    data = open(path, "rb").read()
    hdr = parse_file_header(data)
    print("file: %s (%d bytes)" % (path, len(data)))
    print("  magic       0x%04X" % hdr["magic"])
    print("  file_type   %d (%s)" % (hdr["file_type"],
          {1: "first/single", 9: "span continuation"}.get(hdr["file_type"], "?")))
    print("  compression %d (%s)" % (hdr["compression"],
          COMPRESSION.get(hdr["compression"], "unknown")))
    print("  image_id    0x%08X" % hdr["image_id"])
    print("  encrypted   %s  (contested indicator: byte 12 bit 1)" % hdr["encrypted"])
    off = HEADER_SIZE
    names = {REC_TRACK0: "TRACK0", REC_PARTITION: "PARTITION",
             REC_CONTINUATION: "CONTINUATION", REC_END: "END"}
    while off + RECORD_HEADER_SIZE <= len(data):
        try:
            rec = parse_record(data, off)
        except ValueError as e:
            print("  stop at 0x%X: %s" % (off, e))
            break
        print("  record @0x%-8X type=0x%04X %-13s body=%d bytes"
              % (rec["offset"], rec["type"],
                 names.get(rec["type"], "?"), rec["body_len"]))
        off += RECORD_HEADER_SIZE + rec["body_len"]
        if rec["type"] == REC_END:
            break
    return 0


# ------------------------------------------------------------ cryptanalysis
def cmd_analyse() -> int:
    print("Ghost password cipher — analysis of the published reconstruction")
    print("=" * 68)
    print("Construction: keystream byte = low(state); state := crc16(state,")
    print("plaintext byte); state seeded by running the password through the")
    print("same CRC-16 (init 0xFFFF, reflected poly 0xA001).")
    print()

    print("1. The key schedule's output is 16 bits wide.")
    for pw in ("a", "hunter2", "correct horse battery staple",
               "a 64 character password " + "x" * 40):
        print("     %-46r -> state 0x%04X" % (pw[:44], password_state(pw)))
    print("   A password of any length selects one of at most 65 536 states,")
    print("   and the state is the entire key. Password entropy above 16 bits")
    print("   is discarded by construction.")
    print()

    print("2. Therefore distinct passwords collide into identical keystreams.")
    seen: dict[int, str] = {}
    collisions = []
    n = 0
    for i in range(400000):
        pw = "pw%d" % i
        st = password_state(pw)
        n += 1
        if st in seen:
            collisions.append((seen[st], pw, st))
            if len(collisions) == 3:
                break
        else:
            seen[st] = pw
    plain = b"FE EF partition header and 32 KiB of disk sectors follow..."
    for a, b, st in collisions:
        ca = GhostCipher(a).encrypt(plain)
        cb = GhostCipher(b).encrypt(plain)
        print("     %-10r and %-10r -> state 0x%04X, same ciphertext: %s"
              % (a, b, st, ca == cb))
    print("   Found after trying %d candidate passwords." % n)
    print()

    print("3. Exhaustive key search costs 2^16, independent of the password.")
    secret = "a-very-long-passphrase-nobody-will-guess-2026"
    header = build_file_header(compression=2, image_id=0xDEADBEEF, encrypted=True)
    body = header + b"".join(frame_block(stored_block(bytes([i & 0xFF] * 64)))
                             for i in range(4))
    ciphertext = GhostCipher(secret).encrypt(body)
    # The attacker knows a GHO stream opens with FE EF and a file-type byte.
    crib = struct.pack("<H", FILE_MAGIC)
    hits = [s for s in range(0x10000)
            if GhostCipher(state=s).decrypt(ciphertext[:len(crib)]) == crib]
    print("     2-byte crib (the FE EF magic) leaves %d candidate states"
          % len(hits))
    recovered = [s for s in hits
                 if GhostCipher(state=s).decrypt(ciphertext) == body]
    print("     full-stream check leaves %d: 0x%04X (true state 0x%04X)"
          % (len(recovered), recovered[0], password_state(secret)))
    assert recovered == [password_state(secret)]
    print("     plaintext recovered without ever guessing the %d-character"
          % len(secret))
    print("     passphrase. 65 536 trial decryptions is milliseconds of work.")
    print()

    print("4. It is also malleable and self-synchronising.")
    print("   Keystream depends on plaintext, so an attacker who knows a")
    print("   prefix can flip bits in it; and recovering the state at any")
    print("   offset decrypts the entire remainder of the stream.")
    st_mid = GhostCipher(secret)
    st_mid.encrypt(body[:100])
    tail = GhostCipher(state=st_mid.state).decrypt(ciphertext[100:])
    print("     state at offset 100 = 0x%04X decrypts the tail: %s"
          % (st_mid.state, tail == body[100:]))
    print()
    print("Verdict: this is a 1990s-grade obfuscation layer, not encryption.")
    print("Treat any .GHO 'password' as a speed bump. (And note the caveat in")
    print("this file's docstring: the construction itself is single-sourced.)")
    return 0


# ---------------------------------------------------------------- selftest
def cmd_selftest() -> int:
    fails = 0

    def check(name: str, ok: bool, extra: str = "") -> None:
        nonlocal fails
        print("  %-52s %s%s" % (name, "PASS" if ok else "FAIL",
                                ("  " + extra) if extra else ""))
        if not ok:
            fails += 1

    print("CRC-16 key schedule")
    # CRC-16/MODBUS is the same reflected 0xA001 CRC with init 0xFFFF; its
    # published check value over b"123456789" is 0x4B37. That pins the table,
    # the init value and the update order all at once.
    st = 0xFFFF
    for b in b"123456789":
        st = crc16_update(st, b)
    check("CRC-16 check value over '123456789' == 0x4B37", st == 0x4B37,
          "got 0x%04X" % st)

    print("cipher")
    msg = bytes(range(256)) * 5
    c = GhostCipher("ghost").encrypt(msg)
    check("encrypt then decrypt round-trips",
          GhostCipher("ghost").decrypt(c) == msg)
    check("ciphertext differs from plaintext", c != msg)
    check("wrong password does not recover plaintext",
          GhostCipher("ghos").decrypt(c) != msg)
    check("decrypt by raw state == decrypt by password",
          GhostCipher(state=password_state("ghost")).decrypt(c) == msg)
    # Streaming in chunks must equal one-shot: the state carries across calls.
    ch = GhostCipher("ghost")
    streamed = b"".join(ch.encrypt(msg[i:i + 7]) for i in range(0, len(msg), 7))
    check("chunked encryption == one-shot encryption", streamed == c)

    print("Fast LZ")
    raw = b"Ghost General Hardware-Oriented System Transfer " * 20
    blk = stored_block(raw)
    check("stored block (marker 1) decodes to its payload",
          fastlz_decompress(blk, len(blk)) == raw)
    # A token stream of pure literals: control words with every bit clear.
    lit = b"\x00\x00\x00\x00"
    payload = b"NORTON GHOST"
    for i in range(0, len(payload), 16):
        chunk = payload[i:i + 16]
        lit += struct.pack("<H", 0) + chunk
    check("all-literal token stream decodes verbatim",
          fastlz_decompress(lit, len(lit)) == payload,
          repr(fastlz_decompress(lit, len(lit))))
    check("hash of ('A','B','C') is in range", 0 <= fastlz_hash(65, 66, 67) < 4096)
    try:
        fastlz_decompress(b"\x01\x00\x00\x00", 4)
        check("zero-length stored block is rejected", False)
    except ValueError:
        check("zero-length stored block is rejected", True)

    print("container")
    hdr = build_file_header(compression=2, image_id=0x12345678)
    parsed = parse_file_header(hdr)
    check("file header round-trips", parsed["compression"] == 2
          and parsed["image_id"] == 0x12345678 and parsed["file_type"] == 1)
    check("encryption flag round-trips",
          parse_file_header(build_file_header(2, 1, encrypted=True))["encrypted"])
    mbr = bytearray(512)
    mbr[510], mbr[511] = 0x55, 0xAA
    img = bytearray(hdr)
    img += build_record(REC_TRACK0, b"\x06\x7e\x00\x00\x00\x00" + bytes(mbr))
    img += build_record(REC_PARTITION, bytes(20))
    img += build_file_header(2, 0x12345678)          # FEEF partition header
    img += frame_block(stored_block(b"\xAA" * 4096))
    img += build_record(REC_END, bytes(24))
    rec = parse_record(bytes(img), HEADER_SIZE)
    check("first record is TRACK0", rec["type"] == REC_TRACK0)
    check("record magic verified", rec["raw_type"] & 0xFFFF == REC_TRACK0)
    blk_off = HEADER_SIZE + RECORD_HEADER_SIZE + len(rec["body"]) \
        + RECORD_HEADER_SIZE + 20 + HEADER_SIZE
    slen = struct.unpack_from("<H", bytes(img), blk_off)[0]
    body = bytes(img)[blk_off + 2: blk_off + slen]
    check("framed block length field counts itself", slen == 4096 + 4 + 2)
    check("framed block decodes", fastlz_decompress(body, len(body)) == b"\xAA" * 4096)
    check("a bad record magic is rejected",
          _raises(lambda: parse_record(b"\x06\x00\x00\x00" + b"\x00" * 6, 0)))
    check("a bad file magic is rejected",
          _raises(lambda: parse_file_header(b"\x00" * HEADER_SIZE)))

    print("encrypted container end-to-end")
    clear = bytes(img)
    enc = GhostCipher("s3cret").encrypt(clear)
    check("encrypted image no longer parses as GHO",
          _raises(lambda: parse_file_header(enc)))
    check("decrypting with the password restores the image",
          GhostCipher("s3cret").decrypt(enc) == clear)
    recovered = None
    for s in range(0x10000):
        if GhostCipher(state=s).decrypt(enc[:2]) == struct.pack("<H", FILE_MAGIC):
            if GhostCipher(state=s).decrypt(enc) == clear:
                recovered = s
                break
    check("2^16 search recovers the image with no password",
          recovered == password_state("s3cret"), "state 0x%04X" % (recovered or 0))

    print()
    print("%d failure(s)" % fails)
    print("sha256 of the synthetic image: %s" % hashlib.sha256(clear).hexdigest())
    return 1 if fails else 0


def _raises(fn) -> bool:
    try:
        fn()
    except Exception:
        return True
    return False


def main(argv: list[str]) -> int:
    if len(argv) >= 3 and argv[1] == "info":
        return cmd_info(argv[2])
    if len(argv) >= 2 and argv[1] == "analyse":
        return cmd_analyse()
    if len(argv) >= 2 and argv[1] in ("selftest", "--selftest"):
        return cmd_selftest()
    raise SystemExit(__doc__)


if __name__ == "__main__":
    sys.exit(main(sys.argv))
