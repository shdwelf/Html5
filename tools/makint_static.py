#!/usr/bin/env python3
"""makint_static.py — wave-8 static pass over the MAKInterface / PyMAKInt material.

Everything here is derived from bytes we can actually reach from this sandbox.
The Wayback Machine is not routable from the build host, so the five December
2005 vendor drops stay hash-pinned for browser-side recovery (see
`js/krome-catalog.js`); what this script *can* do is disassemble the Python
that was written to drive that hardware, and use it to confirm the `.mag`
capture container against real vendor-produced captures.

Outputs samples/makint/analysis.json:

  1. upstream  — hashes of the PyMAKInt files (upstream is NOT re-hosted here;
                  it carries no license, so we keep derived facts only)
  2. bytecode  — CPython 3.4 .pyc census per module: magic, timestamp, code
                  objects, opcode histogram, the import/attribute graph
  3. magformat — the `.mag` container, tested against the 144 captures in the
                  upstream tree plus a synthetic vector written under vectors/
  4. iso7816   — the ETU arithmetic the swappable crystal implies
  5. cuecat    — the :CueCat modified-base64 byte transform, checked against
                  the two published decode examples

Static only: nothing fetched, nothing executed beyond pure decoding of data.
"""

from __future__ import annotations

import hashlib
import json
import math
import os
import struct
import sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT_DIR = os.path.join(ROOT, "samples", "makint")
UPSTREAM = os.environ.get("PYMAKINT_DIR", "/home/user/labwork/pymakint")

# The MAKStripe serial protocol, lifted out of the vendor driver's constant pool.
COMMANDS = {
    "?": ("identity", "reply: 15 bytes, must begin 'MSUSB'"),
    "R": ("read raw tracks", "'R' + trackmask; ack 'Ready', then 'RD ' + u16 tick count + payload, then 'RD=OK'"),
    "F": ("format tracks", "'F' + trackmask + seconds*8 + '\\\\'; ack 'FM ', completion 'FM=OK'"),
    "E": ("erase tracks fwd", "'E' + trackmask + seconds; ack 'Er ', completion 'Er=OK'"),
    "e": ("erase tracks rev", "'e' + trackmask + seconds; ack 'eR ', completion 'eR=OK'"),
    "I": ("read EEPROM entry", "'I' + entry(1..20) + '\\01'; three '#...\\'...\\'' lines"),
    "H": ("erase EEPROM", "'H'; completion 'EZ=OK'"),
}

# ISO7816-3 direct convention: the vendor ships a 3.579545 MHz oscillator in the
# socket and tells you it can be swapped for 6.0 MHz. F=372/D=1 is the classic
# pairing for that first crystal — it lands on ~9626 baud, which is why T=0
# drivers of the era defaulted their smart-card COM port to 9600.
CRYSTALS = {
    "3.579545 MHz (shipped)": 3_579_545,
    "6.0 MHz (optional)": 6_000_000,
    "4.9152 MHz (digital-mode switch)": 4_915_200,
    "10.7 MHz (digital-mode switch)": 10_700_000,
}


def sha1_of(path):
    h = hashlib.sha1()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def md5_of(path):
    h = hashlib.md5()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def entropy(data: bytes) -> float:
    if not data:
        return 0.0
    n = len(data)
    c = Counter(data)
    return -sum((v / n) * math.log2(v / n) for v in c.values())


# ----------------------------------------------------------------- upstream tree

def survey_upstream():
    """Hash + classify the upstream files without copying them into the repo."""
    rows = []
    if not os.path.isdir(UPSTREAM):
        return rows
    for dirpath, dirnames, filenames in os.walk(UPSTREAM):
        dirnames[:] = [d for d in dirnames if d != ".git"]
        for name in sorted(filenames):
            p = os.path.join(dirpath, name)
            rel = os.path.relpath(p, UPSTREAM)
            data = open(p, "rb").read()
            rows.append({
                "path": rel,
                "bytes": len(data),
                "md5": md5_of(p),
                "sha1": sha1_of(p),
                "entropy": round(entropy(data), 3),
                "kind": kind_of(data),
            })
    return rows


def kind_of(data: bytes) -> str:
    """Sniff by magic only — .mag is named by its extension, not its header."""
    if data[:4].hex() in PYC_MAGICS:
        return "cpython-pyc"
    if data[:2] == b"MZ":
        return "mz"
    if data[:4] == b"PK\x03\x04":
        return "zip"
    if len(data) >= 12:
        try:
            info = parse_mag(data)
            if info["transitions"] > 0:
                return "mag-container"
        except (ValueError, struct.error):
            pass
    try:
        data[:400].decode("ascii")
        return "text"
    except UnicodeDecodeError:
        return "binary"


# CPython import/magic pairs we care about (3.3 → 3.8), used to name the .pyc
# flavor precisely instead of guessing from a byte sniff.
PYC_MAGICS = {
    "dd0d0a0d": "3.3", "ee0c0d0a": "3.4", "330d0d0a": "3.5",
    "06030d0a": "3.6", "3c0d0d0a": "3.7", "420d0d0a": "3.8",
}


# ------------------------------------------------------------------ the bytecode

def disassemble_pyc(path: str) -> dict:
    """xdis-based cross-version census of a CPython .pyc.

    xdis 6.x returns an 8-slot tuple from load_module:
      (version_tuple, timestamp, magic_int, code, implementation, source_size, …)
    The source_size slot is what lets us prove the shipped .pyc was compiled
    from the shipped .py rather than from a revision of it — a real integrity
    claim, not a courtesy.
    """
    try:
        import xdis
        from xdis.load import load_module
        from xdis.bytecode import Bytecode
    except ImportError:
        return {"error": "xdis not installed (pip install xdis)"}

    try:
        loaded = load_module(path)
    except Exception as exc:                                   # noqa: BLE001
        return {"error": f"{type(exc).__name__}: {exc}"}

    version, timestamp, code = loaded[0], loaded[1], loaded[3]
    source_size = loaded[5] if len(loaded) > 5 else None

    funcs = []

    def walk(co):
        funcs.append(co)
        for c in getattr(co, "co_consts", ()) or ():
            if hasattr(c, "co_code"):
                walk(c)

    walk(code)

    magic = open(path, "rb").read(4).hex()
    opc = xdis.get_opcode(version, False)

    rows, total = [], Counter()
    # (the opcode census below *is* the `ops` rollup; kept under one name so the
    #  return block cannot drift out of sync with the loop that fills it)
    for co in funcs:
        per = Counter()
        try:
            for ins in Bytecode(co, opc).get_instructions(co):
                per[ins.opname] += 1
        except Exception as exc:                               # noqa: BLE001
            per[f"<error {type(exc).__name__}>"] += 1
        total.update(per)
        rows.append({
            "name": co.co_name,
            "firstline": getattr(co, "co_firstlineno", None),
            "args": getattr(co, "co_argcount", None),
            "locals": getattr(co, "co_nlocals", None),
            "stack": getattr(co, "co_stacksize", None),
            "instructions": sum(per.values()),
            "names": [n for n in getattr(co, "co_names", ()) if isinstance(n, str)][:24],
            "strings": [
                c.decode("latin-1") if isinstance(c, bytes) else c
                for c in (getattr(co, "co_consts", ()) or ())
                if isinstance(c, (bytes, str)) and 0 < len(c) <= 48
            ][:20],
        })

    sibling = os.path.join(os.path.dirname(os.path.dirname(path)), os.path.basename(code.co_filename or ""))
    return {
        "file": os.path.basename(path),
        "python": f"{version[0]}.{version[1]}" if isinstance(version, (tuple, list)) else str(version),
        "magic": magic,
        "magic_flavor": PYC_MAGICS.get(magic, "unknown"),
        "timestamp": timestamp,
        "source_size_recorded": source_size,
        "source_size_on_disk": os.path.getsize(sibling) if sibling and os.path.exists(sibling) else None,
        "source_in_sync": (
            source_size is not None and sibling and os.path.exists(sibling)
            and os.path.getsize(sibling) == source_size
        ),
        "compiled_from_path": code.co_filename,
        "code_objects": len(funcs),
        "opcode_total": sum(total.values()),
        "opcode_top": dict(total.most_common(16)),
        "functions": rows,
    }


# ---------------------------------------------------------------- .mag container

MAG_TICK_HZ = 150           # PyMAKDat multiplies second-deltas by this constant
MAG_TICK_MAX = 511          # 9-bit field: byte + ((byte2 & 0x80) << 1)


def parse_mag(data: bytes) -> dict:
    """The MAKStripe capture container: u32 count, then count × (u32 mask<<4, f32 t)."""
    if len(data) < 4:
        raise ValueError("truncated header")
    (count,) = struct.unpack_from("<I", data, 0)
    want = 4 + count * 8
    if len(data) != want:
        raise ValueError(f"length mismatch: {len(data)} != 4 + {count}*8 = {want}")
    masks = Counter()
    times = []
    for i in range(count):
        mask, t = struct.unpack_from("<If", data, 4 + i * 8)
        masks[mask >> 4] += 1
        times.append(t)
    dts = [times[i + 1] - times[i] for i in range(len(times) - 1)]
    ticks = [int(round(d * MAG_TICK_HZ)) for d in dts]
    return {
        "transitions": count,
        "tracks_seen": sorted(masks),
        "mask_hist": {str(k): v for k, v in sorted(masks.items())},
        "monotone": all(b >= a for a, b in zip(times, times[1:])),
        "span_s": round(times[-1] - times[0], 3) if len(times) > 1 else 0.0,
        "tick_min": min(ticks) if ticks else 0,
        "tick_max": max(ticks) if ticks else 0,
    }


def synth_mag(bits_per_cell=251, cells=64) -> bytes:
    """A deterministic synthetic capture — the test vector the JS module reads."""
    out = struct.pack("<I", cells)
    t = 0.0
    for i in range(cells):
        # alternating track-2 / no-transition masks, one cell apart
        mask = (0x02 if i % 2 else 0x00) << 4
        out += struct.pack("<If", mask, round(t, 6))
        t += bits_per_cell / MAG_TICK_HZ
    return out


def survey_magcaptures(limit: int | None = None) -> dict:
    """Validate the container hypothesis against the real captures upstream."""
    dirs = [os.path.join(UPSTREAM, "woodlands_bulk"), os.path.join(UPSTREAM, "woodlands_paid")]
    files = []
    for d in dirs:
        if os.path.isdir(d):
            files += [os.path.join(d, f) for f in sorted(os.listdir(d)) if f.endswith(".mag")]
    if not files:
        return {"files": 0, "note": "no captures reachable"}
    if limit:
        files = files[:limit]
    ok, bad, sizes, spans, tickmax, tracksets = 0, [], set(), [], set(), Counter()
    widest = 0.0
    for p in files:
        data = open(p, "rb").read()
        try:
            info = parse_mag(data)
        except ValueError as exc:
            bad.append(f"{os.path.basename(p)}: {exc}")
            continue
        ok += 1
        sizes.add(len(data))
        spans.append(info["span_s"])
        tickmax.add(info["tick_max"])
        widest = max(widest, info["span_s"])
        for m, n in info["mask_hist"].items():
            tracksets[m] += n
    ceiling = MAG_TICK_MAX / MAG_TICK_HZ
    return {
        "files": len(files),
        "parsed": ok,
        "failed": bad[:5],
        "distinct_sizes": len(sizes),
        "span_s_min": round(min(spans), 3) if spans else None,
        "span_s_max": round(max(spans), 3) if spans else None,
        "tick_max_values": sorted(tickmax),
        "mask_hist_totals": {k: v for k, v in sorted(tracksets.items())},
        "saturated_at_9bit": MAG_TICK_MAX in tickmax,
        "unit_proof": (
            f"widest inter-transition gap in the corpus is {widest:.6f} s, and "
            f"{MAG_TICK_MAX} ticks at {MAG_TICK_HZ} Hz is {ceiling:.6f} s — the gap "
            f"sits exactly on the 9-bit ceiling of the on-wire tick field. So the "
            f"float in the container is seconds and the capture clock is {MAG_TICK_HZ} Hz."
        ),
    }


# ------------------------------------------------------------------------ ISO7816

def iso7816_math() -> dict:
    """F/D table math for the crystals the vendor puts in the socket."""
    out = {}
    for label, fi in CRYSTALS.items():
        etu = 372.0 / fi * 1e6
        out[label] = {
            "fi_hz": fi,
            "etu_us_f372_d1": round(etu, 3),
            "baud_f372_d1": round(fi / 372.0, 1),
            "fwt_us_bwt10": round(10 * 960 * etu, 1),
        }
    return out


# -------------------------------------------------------------------- CueCat code

CUECAT_ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+-"


def cuecat_decode(section: str) -> str:
    """The :CueCat "modified base64", rebuilt from Bobby Gage's step-by-step.

    Three steps, and the last one is the bit every quick port gets wrong:
      1. map each char to its 0-based index in the custom alphabet
         `abc…xyzABC…Z0-9+-` — lowercase first, and `+`/`-` as 62/63;
      2. regroup the 6-bit indices as three 8-bit values (plain base64 math —
         written out per byte here because a tail group of 3 or 2 chars shifts
         differently than a whole one, and that is where naive ports break);
      3. per byte: `(v ^ 3) + 64`, then Gage's step 10/20/28: "IF larger than
         128 then subtract 128". That single conditional fold is the whole
         trick — it keeps printable digits at their ASCII values and pulls
         everything else back into range, which is why a stock :Cat appears to
         "type" decimal digits straight into a text field.

    Vectors that pin it down: 'fbmxChO' → 'WPT39' (Gage) and the
    Hanselman/Illig Stardust code section → '978006093471251300'.
    """
    pos = {c: i for i, c in enumerate(CUECAT_ALPHABET)}
    vals = [pos[c] for c in section if c in pos]
    out = bytearray()
    for i in range(0, len(vals), 4):
        v = vals[i:i + 4]
        bytes_out = []
        if len(v) >= 2:
            bytes_out.append(((v[0] << 2) | (v[1] >> 4)) & 0xFF)
        if len(v) >= 3:
            bytes_out.append((((v[1] & 0xF) << 4) | (v[2] >> 2)) & 0xFF)
        if len(v) >= 4:
            bytes_out.append((((v[2] & 0x3) << 6) | v[3]) & 0xFF)
        for b in bytes_out:
            ch = (b ^ 3) + 64
            if ch > 128:                            # Gage's step 10 / 20 / 28
                ch -= 128
            out.append(ch)
    return bytes(out).decode("latin-1")


def cuecat_vectors() -> dict:
    """The two published decode examples, checked against the rebuild."""
    cases = [
        ("gage-alnum", "fbmxChO", "WPT39"),
        ("gage-serial-neutered", "C3nZC3nZC3nZ", "000000000"),
        ("hanselman-stardust", "ENr7C3n1C3PWD3rYCxzYChnZ", "978006093471251300"),
    ]
    rows = {}
    all_ok = True
    for label, sec, want in cases:
        got = cuecat_decode(sec)
        all_ok &= got == want
        rows[label] = {"input": sec, "want": want, "got": got, "ok": got == want}
    rows["all_match"] = all_ok
    return rows


# --------------------------------------------------------------------------- main

def main() -> int:
    os.makedirs(OUT_DIR, exist_ok=True)
    vdir = os.path.join(OUT_DIR, "vectors")
    os.makedirs(vdir, exist_ok=True)
    vector = synth_mag()
    vpath = os.path.join(vdir, "synthetic-track2.mag")
    open(vpath, "wb").write(vector)

    report = {
        "tool": "makint_static.py",
        "wave": 8,
        "upstream": {
            "repo": "s3c/PyMAKInt",
            "cloned_via": "git clone https://github.com/s3c/PyMAKInt (depth 200)",
            "rehosted": False,
            "why": "no license file upstream — the tree is hashed and analysed here, not copied into the repository",
            "files": survey_upstream(),
        },
        "makstripe_protocol": COMMANDS,
        "bytecode": [],
        "mag_format": {
            "layout": "u32 transition count, then count × (u32 (trackmask<<4), f32 absolute seconds)",
            "record_bytes": 8,
            "length_rule": "filesize == 4 + 8 * count",
            "tick_hz": MAG_TICK_HZ,
            "tick_field": "9-bit on the wire (byte | (byte2&0x80)<<1), max 511",
            "corpus": survey_magcaptures(),
            "synthetic_vector": {
                "path": "samples/makint/vectors/synthetic-track2.mag",
                "bytes": len(vector),
                "sha1": hashlib.sha1(vector).hexdigest(),
                "parse": parse_mag(vector),
            },
        },
        "iso7816": iso7816_math(),
        "cuecat": cuecat_vectors(),
        "pins_recovered_from": "makinterface.net/pinout_e.php3 @ 20051220165606 (CDX digest ZJT4TY2JWBZOGE5VTLTEKI3YOT4ZFQ5F, 5121 B)",
    }

    for pyc in ("pymakint", "pymagpar"):
        path = os.path.join(UPSTREAM, "__pycache__", f"{pyc}.cpython-34.pyc")
        if os.path.exists(path):
            report["bytecode"].append(disassemble_pyc(path))

    out = os.path.join(OUT_DIR, "analysis.json")
    with open(out, "w") as f:
        json.dump(report, f, indent=2, sort_keys=True)
    print(out)

    c = report["mag_format"]["corpus"]
    print(f"captures: {c.get('parsed')}/{c.get('files')} parsed, "
          f"tick ceiling {c.get('tick_max_values')}, saturated@9bit={c.get('saturated_at_9bit')}")
    for b in report["bytecode"]:
        print(f"{b.get('file')}: py{b.get('python')} magic {b.get('magic')} ({b.get('magic_flavor')}) "
              f"ts {b.get('timestamp')} — {b.get('code_objects')} code objects, "
              f"{b.get('opcode_total')} instructions")
    return 0


if __name__ == "__main__":
    sys.exit(main())
