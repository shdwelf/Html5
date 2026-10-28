#!/usr/bin/env python3
"""Probe a Lantronix Evolution OS .romz container for its compression.

Why this exists: every Evolution OS firmware image found on archive.org /
the Lantronix FTP (docs/evolution-os-software-search-2026-10-28.md) wraps a
compressed .romz payload ("Rom Compressed: True" in DeviceInstaller logs),
and no public .romz unpacker was found. Before Ghidra may see the image the
container must be inflated, but the compression is undocumented - so this
probe does not guess, it *tests*: the standard inflation family (gzip,
zlib, raw DEFLATE, bzip2, LZMA/XZ) at offset 0, plus signature scans for an
embedded gzip/zlib stream behind a short header. Every attempt is recorded
(win or lose) in a JSON report, and a candidate output is only accepted as
"inflated" when it scores as plausible firmware: sizeable, mostly printable
in its string regions, and carrying Evolution-era keywords (Evolution,
Lantronix, XPort, HTTP/SSH/Telnet...). Static analysis only - the input is
never executed.

The classic 16-bit targets ship an UNcompressed .rom instead, so the probe
has a second positive verdict: if no inflation works but the raw bytes
themselves score as plausible firmware, the verdict is "raw" (exit 3) and
the caller should hand the original file to Ghidra unchanged.

Exit codes: 0 = plausible inflation written to --out; 3 = raw plausible
firmware, analyse as-is; 2 = neither (report still written);
1 = usage/IO error.

  python3 tools/evolution-os/romz_probe.py xport_pro_6_0_0_1_R2.romz \
      --out payload.bin --report romz-probe.json
"""
import hashlib
import json
import re
import sys
import zlib
import bz2
import lzma

KEYWORDS = [b"evolution", b"lantronix", b"xport", b"coldfire", b"copyright",
            b"http", b"ssh", b"telnet", b"snmp", b"firmware"]
STRING_RE = re.compile(rb"[\x20-\x7e]{6,}")


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def strings_sample(data, limit=40):
    out = []
    for m in STRING_RE.finditer(data[:262144]):
        s = m.group().decode("ascii", "replace")
        if s not in out:
            out.append(s)
        if len(out) >= limit:
            break
    return out


def score(data):
    """Plausibility of an inflated payload: size, keyword hits, printables."""
    if not data:
        return {"outBytes": 0, "keywordHits": {}, "printableRatio": 0.0, "plausible": False}
    low = data.lower()
    hits = {k.decode(): low.count(k) for k in KEYWORDS if low.count(k)}
    head = data[:65536]
    printable = sum(1 for b in head if b in (9, 10, 13) or 32 <= b < 127)
    ratio = printable / max(1, len(head))
    # ColdFire code is not "printable text", so keywords are the strong
    # signal; printable ratio only corroborates. A real Evolution payload
    # carries its web/CLI strings in the clear.
    plausible = len(data) >= 4096 and (sum(hits.values()) >= 3 or (hits and ratio > 0.15))
    return {"outBytes": len(data), "keywordHits": hits,
            "printableRatio": round(ratio, 4), "plausible": bool(plausible)}


def try_decompress(name, fn, data):
    try:
        out = fn(data)
        return {"method": name, "offset": 0, "ok": True, "error": "", **score(out)}, out
    except Exception as exc:  # probe records failures; it does not hide them
        return {"method": name, "offset": 0, "ok": False, "error": str(exc)[:160],
                "outBytes": 0, "keywordHits": {}, "printableRatio": 0.0,
                "plausible": False}, None


def inflate_candidates(data):
    """Yield (attempt, bytes|None) for every method/offset combination."""
    yield try_decompress("gzip", lambda d: zlib.decompress(d, 31), data)
    yield try_decompress("zlib", lambda d: zlib.decompress(d, 15), data)
    yield try_decompress("raw-deflate", lambda d: zlib.decompress(d, -15), data)
    yield try_decompress("bzip2", bz2.decompress, data)
    yield try_decompress("lzma-xz", lzma.decompress, data)
    # Embedded-stream scan: a short vendor header may precede the stream.
    # gzip magic 1F 8B and the common zlib headers 78 01/5E/9C/DA.
    offsets = set()
    for magic in (b"\x1f\x8b", b"\x78\x01", b"\x78\x5e", b"\x78\x9c", b"\x78\xda"):
        start = 0
        while True:
            i = data.find(magic, start, 8192)
            if i < 0 or i == 0:
                break
            offsets.add((i, magic))
            start = i + 1
    for off, magic in sorted(offsets):
        wbits = 31 if magic == b"\x1f\x8b" else 15
        name = ("gzip@" if wbits == 31 else "zlib@") + str(off)
        attempt, out = try_decompress(name, lambda d, w=wbits: zlib.decompress(d, w), data[off:])
        attempt["offset"] = off
        yield attempt, out


def vector_table(data):
    """ColdFire images open with the vector table: initial SP, reset PC
    (big-endian). Whether the reset PC lands inside the image is the first
    clue to the load base Ghidra should use on a later, refined pass."""
    if len(data) < 8:
        return None
    sp = int.from_bytes(data[0:4], "big")
    pc = int.from_bytes(data[4:8], "big")
    return {"initialStackPointer": f"0x{sp:08x}", "resetEntry": f"0x{pc:08x}",
            "resetEntryWithinImage": pc < len(data)}


def probe(path):
    data = open(path, "rb").read()
    report = {
        "file": path.rsplit("/", 1)[-1],
        "bytes": len(data),
        "sha256": sha256(data),
        "magicHex": data[:16].hex(" "),
        "attempts": [],
        "inflated": None,
        "verdict": "unknown",
        "vectorTable": None,
    }
    best = None
    for attempt, out in inflate_candidates(data):
        report["attempts"].append({k: attempt[k] for k in
                                   ("method", "offset", "ok", "error", "outBytes",
                                    "keywordHits", "printableRatio", "plausible")})
        if out is not None and attempt["plausible"]:
            if best is None or attempt["outBytes"] > best[0]["outBytes"]:
                best = (attempt, out)
    if best is not None:
        attempt, out = best
        report["verdict"] = "inflated"
        report["vectorTable"] = vector_table(out)
        report["inflated"] = {
            "method": attempt["method"], "offset": attempt["offset"],
            "outBytes": len(out), "sha256": sha256(out),
            "keywordHits": attempt["keywordHits"],
            "sampleStrings": strings_sample(out),
        }
        return report, out
    raw = score(data)
    report["rawScore"] = raw
    if raw["plausible"]:
        report["verdict"] = "raw"
        report["vectorTable"] = vector_table(data)
        return report, "RAW"
    return report, None


def main(argv):
    if len(argv) < 2:
        print(__doc__)
        return 1
    path = argv[1]
    out_path = report_path = None
    i = 2
    while i < len(argv):
        if argv[i] == "--out":
            out_path = argv[i + 1]
            i += 2
        elif argv[i] == "--report":
            report_path = argv[i + 1]
            i += 2
        else:
            print(f"romz_probe: unknown argument {argv[i]}", file=sys.stderr)
            return 1
    try:
        report, payload = probe(path)
    except OSError as exc:
        print(f"romz_probe: {exc}", file=sys.stderr)
        return 1
    for a in report["attempts"]:
        status = f"ok out={a['outBytes']} plausible={a['plausible']}" if a["ok"] else f"fail {a['error'][:60]}"
        print(f"  {a['method']:<16} {status}")
    if isinstance(payload, bytes) and out_path:
        with open(out_path, "wb") as fh:
            fh.write(payload)
    if report_path:
        with open(report_path, "w", encoding="utf-8") as fh:
            json.dump(report, fh, indent=2)
            fh.write("\n")
    if isinstance(payload, bytes):
        inf = report["inflated"]
        print(f"INFLATED method={inf['method']} out={inf['outBytes']} sha256={inf['sha256']}")
        return 0
    if payload == "RAW":
        print(f"RAW plausible firmware ({report['bytes']} bytes); analyse the file as-is")
        return 3
    print("NOT INFLATED: no standard method produced a plausible payload; see report")
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv))
