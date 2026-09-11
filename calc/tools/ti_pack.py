#!/usr/bin/env python3
"""Write (and verify) TI variable containers for the SITE-K native port.

Containers implemented from the TI Link Protocol Guide, with the variable type
IDs from tilibs (libtifiles):

  z80_83plus  .8xp   "**TI83F*"  1A 0A 00   comment 42   TI-83+/84+
  z80_85      .85s   "**TI85**"  1A 0C 00   comment 42   TI-85
  m68k        .89z / .9xz  "**TI89**" / "**TI92**"  01 00   comment 40

Checksums are the low 16 bits of the sum of the bytes of the data section
(Z80) or of the variable data (68k).

    python3 calc/tools/ti_pack.py pack   --device ti83 --input build/ti83.bin --out build/sitek.8xp
    python3 calc/tools/ti_pack.py verify --file build/sitek.8xp
    python3 calc/tools/ti_pack.py info   [--device ti83] [--json]
    python3 calc/tools/ti_pack.py selftest
"""
import argparse
import json
import struct
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEVICES_PATH = ROOT / "devices.json"

TI83_ENTRY_HDR = 0x0D   # 0x0D = TI Connect style entry (version + archive flag present)


def load_devices():
    data = json.loads(DEVICES_PATH.read_text())
    return {d["id"]: d for d in data["devices"]}


def checksum16(data: bytes) -> int:
    return sum(data) & 0xFFFF


def var_name_bytes(name: str, size: int) -> bytes:
    raw = name.encode("ascii")[:size]
    return raw + b"\x00" * (size - len(raw))


def comment_bytes(text: str, size: int) -> bytes:
    raw = text.encode("ascii")[: size - 1]
    return raw + b"\x00" * (size - len(raw))


def pack_z80_83plus(dev, body: bytes, name: str, comment: str, type_id: int) -> bytes:
    body_len = len(body)
    entry = struct.pack("<HHB", TI83_ENTRY_HDR, body_len + 2, type_id)
    entry += var_name_bytes(name, 8)
    entry += bytes([0, 0])                      # version, archive flag
    entry += struct.pack("<HH", body_len + 2, body_len)
    entry += body
    head = dev["signature"].encode("ascii")
    head += bytes(dev["signature2"])
    head += comment_bytes(comment, dev["comment_len"])
    head += struct.pack("<H", len(entry))
    return head + entry + struct.pack("<H", checksum16(entry))


def pack_z80_85(dev, body: bytes, name: str, comment: str, type_id: int) -> bytes:
    nm = name.encode("ascii")
    body_len = len(body)
    entry = struct.pack("<HHBB", 6 + len(nm), body_len, type_id, len(nm))
    entry += nm
    entry += struct.pack("<H", body_len)
    entry += body
    head = dev["signature"].encode("ascii")
    head += bytes(dev["signature2"])
    head += comment_bytes(comment, dev["comment_len"])
    head += struct.pack("<H", len(entry))
    return head + entry + struct.pack("<H", checksum16(entry))


def pack_m68k(dev, body: bytes, name: str, comment: str, type_id: int, size_mode="file") -> bytes:
    head = dev["signature"].encode("ascii")
    head += bytes(dev["signature2"])
    head += b"main\x00\x00\x00\x00"                       # parent folder
    head += comment_bytes(comment, dev["comment_len"])
    head += bytes([0x01, 0x00, 0x52, 0x00, 0x00, 0x00])
    head += var_name_bytes(name, 8)
    head += bytes([type_id])
    head += bytes([0, 0, 0])
    total = len(head) + 4 + 2 + len(body) + 2
    head += struct.pack("<I", total if size_mode == "file" else len(body) + 6)
    head += bytes([0xA5, 0x5A])
    return head + body + struct.pack("<H", checksum16(body))


def pack(dev, body: bytes, name: str, comment: str, type_id: int, prefix=True, size_mode="file"):
    if prefix and dev.get("prefix"):
        body = bytes(dev["prefix"]) + body
    kind = dev["container"]
    if kind == "z80_83plus":
        return pack_z80_83plus(dev, body, name, comment, type_id)
    if kind == "z80_85":
        return pack_z80_85(dev, body, name, comment, type_id)
    if kind == "m68k":
        return pack_m68k(dev, body, name, comment, type_id, size_mode)
    raise SystemExit("unknown container %r" % kind)


def verify(data: bytes, dev=None) -> dict:
    """Re-parse a container and report on it. Raises ValueError on mismatch."""
    report = {"size": len(data)}
    sig = data[:8].decode("ascii", "replace")
    report["signature"] = sig
    if sig.startswith("**TI83F**") or sig == "**TI83F*":
        dev_len = struct.unpack_from("<H", data, 53)[0]
        entry = data[55:55 + dev_len]
        stored = struct.unpack_from("<H", data, 55 + dev_len)[0]
        if len(entry) != dev_len:
            raise ValueError("truncated data section")
        if stored != checksum16(entry):
            raise ValueError("checksum %04x != computed %04x" % (stored, checksum16(entry)))
        magic, total, type_id = struct.unpack_from("<HHB", entry, 0)
        name = entry[5:13].rstrip(b"\x00").decode("ascii", "replace")
        body_len = struct.unpack_from("<H", entry, 17)[0]
        body = entry[19:19 + body_len]
        report.update({"container": "z80_83plus", "entry_magic": magic, "type_id": type_id,
                       "name": name, "body_len": body_len, "body_read": len(body),
                       "checksum": stored, "total_field": total})
        if len(body) != body_len:
            raise ValueError("body length mismatch")
    elif sig in ("**TI85**", "**TI86**"):
        dev_len = struct.unpack_from("<H", data, 53)[0]
        entry = data[55:55 + dev_len]
        stored = struct.unpack_from("<H", data, 55 + dev_len)[0]
        if stored != checksum16(entry):
            raise ValueError("checksum %04x != computed %04x" % (stored, checksum16(entry)))
        off_len, body_len, type_id, name_len = struct.unpack_from("<HHBB", entry, 0)
        name = entry[6:6 + name_len].decode("ascii", "replace")
        body = entry[8 + name_len:8 + name_len + body_len]
        report.update({"container": "z80_85", "type_id": type_id, "name": name,
                       "body_len": body_len, "body_read": len(body), "checksum": stored,
                       "offset_to_len_field": off_len})
        if len(body) != body_len:
            raise ValueError("body length mismatch")
    elif sig in ("**TI89**", "**TI92**"):
        name = data[64:72].rstrip(b"\x00").decode("ascii", "replace")
        type_id = data[72]
        size_field = struct.unpack_from("<I", data, 76)[0]
        if data[80:82] != b"\xa5\x5a":
            raise ValueError("missing A5 5A data signature")
        body = data[82:-2]
        stored = struct.unpack_from("<H", data, len(data) - 2)[0]
        if stored != checksum16(body):
            raise ValueError("checksum %04x != computed %04x" % (stored, checksum16(body)))
        report.update({"container": "m68k", "type_id": type_id, "name": name,
                       "body_len": len(body), "checksum": stored, "size_field": size_field,
                       "size_field_matches_file": size_field == len(data)})
    else:
        raise ValueError("unrecognised signature %r" % sig)
    return report


def hexdump(data: bytes, limit=96) -> str:
    out = []
    for i in range(0, min(len(data), limit), 16):
        chunk = data[i:i + 16]
        out.append("%04x  %-47s  %s" % (
            i,
            " ".join("%02x" % b for b in chunk),
            "".join(chr(b) if 32 <= b < 127 else "." for b in chunk)))
    if len(data) > limit:
        out.append("... %d more bytes" % (len(data) - limit))
    return "\n".join(out)


def cmd_pack(args):
    devices = load_devices()
    if args.device not in devices:
        raise SystemExit("unknown device %s (have: %s)" % (args.device, ", ".join(devices)))
    dev = devices[args.device]
    body = Path(args.input).read_bytes()
    type_id = args.type_id if args.type_id is not None else dev["type_id"]
    comment = args.comment or "SITE-K %s core" % dev["name"]
    blob = pack(dev, body, args.name, comment, type_id,
                prefix=not args.no_prefix, size_mode=args.size_mode)
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(blob)
    report = verify(blob, dev)
    print("wrote %s  %d bytes  container=%s  type=0x%02X  name=%s  body=%d" %
          (out, len(blob), report["container"], type_id, report["name"], report["body_len"]))
    if args.hexdump:
        print(hexdump(blob))
    return 0


def cmd_verify(args):
    blob = Path(args.file).read_bytes()
    report = verify(blob)
    print(json.dumps(report, indent=2))
    return 0


def cmd_info(args):
    devices = load_devices()
    if args.json:
        print(json.dumps(devices, indent=2))
        return 0
    for dev in devices.values():
        print("%-4s %-46s %-5s %3dx%-4d %-5s .%-3s type=0x%02X prefix=%s" % (
            dev["id"], dev["name"], dev["cpu"], dev["lcd"][0], dev["lcd"][1],
            dev["container"], dev["ext"], dev["type_id"],
            " ".join("%02X" % p for p in dev["prefix"]) or "-"))
    return 0


def cmd_selftest(args):
    """Round-trip every device with a fake payload and check every field."""
    devices = load_devices()
    failures = 0
    payload = bytes(range(256)) * 2
    for dev in devices.values():
        blob = pack(dev, payload, dev["var_name"], "selftest", dev["type_id"])
        try:
            rep = verify(blob)
            body_ok = rep["body_len"] == len(payload) + len(dev["prefix"])
            print("  ok   %-5s .%-3s %6d bytes  body=%d  type=0x%02X  name=%s  sum=%04X%s" % (
                dev["id"], dev["ext"], len(blob), rep["body_len"], rep["type_id"],
                rep["name"], rep["checksum"], "" if body_ok else "  BODY MISMATCH"))
            if not body_ok:
                failures += 1
        except ValueError as err:
            print("  FAIL %-5s %s" % (dev["id"], err))
            failures += 1
    # TI-85 program variant (0x12) must work too
    dev = devices["ti85"]
    blob = pack(dev, payload, "SITEK", "selftest", dev["type_ids"]["prgm"])
    rep = verify(blob)
    if rep["type_id"] != dev["type_ids"]["prgm"]:
        print("  FAIL ti85 program variant type id")
        failures += 1
    else:
        print("  ok   ti85  .85p program variant type=0x%02X" % rep["type_id"])
    print("%d devices, %d failures" % (len(devices), failures))
    return 1 if failures else 0


def main(argv=None):
    ap = argparse.ArgumentParser(description="TI variable container writer for SITE-K")
    sub = ap.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("pack")
    p.add_argument("--device", required=True)
    p.add_argument("--input", required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--name", default=None)
    p.add_argument("--comment", default=None)
    p.add_argument("--type-id", type=lambda s: int(s, 0), default=None)
    p.add_argument("--ext", default=None, help="override the output extension")
    p.add_argument("--no-prefix", action="store_true", help="omit the AsmPrgm token")
    p.add_argument("--size-mode", choices=["file", "data"], default="file",
                   help="68k only: what the 4-byte size field at 0x4C holds")
    p.add_argument("--hexdump", action="store_true")
    p.set_defaults(func=cmd_pack)

    p = sub.add_parser("verify")
    p.add_argument("--file", required=True)
    p.set_defaults(func=cmd_verify)

    p = sub.add_parser("info")
    p.add_argument("--json", action="store_true")
    p.set_defaults(func=cmd_info)

    p = sub.add_parser("selftest")
    p.set_defaults(func=cmd_selftest)

    args = ap.parse_args(argv)
    if args.cmd == "pack" and args.ext:
        args.out = str(Path(args.out).with_suffix("." + args.ext.lstrip(".")))
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
