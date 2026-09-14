#!/usr/bin/env python3
"""
archive_inspect.py — find the firmware inside archived vendor downloads.

The MAKInterface / MAKInterface Pro downloads retrieved from the Wayback Machine
(samples/archive/, see .arena-archive/) are period Windows packages: ZIPs of
DOC/PDF manuals, installers, and CAB/VBX artefacts. The question this tool
answers is the one that matters for the AVR thread - *is there an AVR firmware
image in here, and where?* - without pretending to be an antivirus or a
decompiler.

For every entry it reports:

  * text that is already text (the pinout files list which Atmel parts the
    vendor's adapters support, which is the hardware half of the story);
  * text recovered from Word .DOC (CP1252 and UTF-16LE runs) and from PDF
    FlateDecode streams, so the manuals can be searched without a Word or PDF
    library;
  * Intel HEX records embedded anywhere in a binary - that is what an AVR
    firmware image looks like, and installers routinely carry one;
  * AVR device names (atmega/attiny/at90s/at89/t89) and programmer keywords.

Anything that looks like a firmware image is written out as a separate file
next to the report, named after the archive it came from, so it can be fed to
tools/ghidra_avr.mjs and js/avrdis.js.

    python3 tools/archive_inspect.py                  # scan samples/archive
    python3 tools/archive_inspect.py --write          # also write the report
    python3 tools/archive_inspect.py --dir DIR
"""

import argparse
import io
import pathlib
import re
import sys
import zipfile
import zlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
DEFAULT_DIR = ROOT / "samples" / "archive"

AVR_NAMES = re.compile(rb"(atmega\d+|attiny\d+|at90s\d+|at89[a-z]*\d+|t89c?\d+|at17|at24c|at93c|atf\w+)", re.I)
PROG_WORDS = re.compile(rb"(avrdude|ponyprog|atmel|fuse|lock ?bit|isp|spi|bootloader|flash)", re.I)
HEX_RECORD = re.compile(rb":[0-9A-Fa-f]{10}[0-9A-Fa-f]{2}[0-9A-Fa-f]{2}\r?\n")

TEXT_EXT = {".txt", ".lst", ".ini", ".bat", ".cfg", ".doc", ".nfo", ".me", ".1st"}
BIN_EXT = {".exe", ".dll", ".cab", ".vbx", ".ocx", ".bin", ".com", ".rom", ".hex"}


def runs(data: bytes, min_len=8):
    """Printable stretches of a byte string, decoded as CP1252 then UTF-16LE."""
    out = []
    for enc, sample in (("cp1252", data), ("utf-16-le", data)):
        try:
            text = sample.decode(enc, "ignore")
        except Exception:  # noqa: BLE001
            continue
        for m in re.finditer(rf"[ -~]{{{min_len},}}", text):
            out.append((enc, m.group(0)))
    return out


def keywords(text: str):
    low = text.lower()
    hits = set()
    for word in ("hex", "fuse", "isp", "atmega", "attiny", "at90s", "pic", "eeprom", "programmer",
                 "serial", "usb", "bootloader", "lock", "security", "smartcard", "smart card"):
        if word in low:
            hits.add(word)
    return sorted(hits)


def pdf_text(data: bytes):
    """Text out of a PDF without a PDF library: FlateDecode streams + Tj/TJ ops."""
    chunks = []
    for m in re.finditer(rb"stream\r?\n(.*?)endstream", data, re.S):
        raw = m.group(1)
        try:
            raw = zlib.decompress(raw)
        except Exception:  # noqa: BLE001
            pass
        # literal strings inside text-showing operators
        for s in re.finditer(rb"\(([^()\\]{2,})\)\s*(?:Tj|TJ|')", raw):
            chunks.append(s.group(1).decode("cp1252", "ignore"))
        for s in re.finditer(rb"\[(.*?)\]\s*TJ", raw, re.S):
            for lit in re.finditer(rb"\(([^()\\]*)\)", s.group(1)):
                chunks.append(lit.group(1).decode("cp1252", "ignore"))
    return " ".join(chunks)


def doc_text(data: bytes):
    """Approximate Word .DOC text: the longest printable runs are the body."""
    best = []
    for _enc, run in runs(data, 12):
        if sum(c.isalpha() for c in run) > len(run) * 0.4:
            best.append(run)
    return best


def find_hex(data: bytes, min_records=8):
    """Contiguous Intel HEX record blocks, which is what a firmware dump is."""
    matches = list(HEX_RECORD.finditer(data))
    if len(matches) < min_records:
        return []
    blocks, cur = [], [matches[0]]
    for prev, nxt in zip(matches, matches[1:]):
        if nxt.start() - prev.end() <= 2:
            cur.append(nxt)
        else:
            blocks.append(cur)
            cur = [nxt]
    blocks.append(cur)
    out = []
    for b in blocks:
        if len(b) < min_records:
            continue
        text = b"".join(m.group(0) for m in b)
        out.append((b[0].start(), len(b), text))
    return out


def inspect_zip(path: pathlib.Path, outdir: pathlib.Path | None, log):
    report = {"archive": path.name, "bytes": path.stat().st_size, "entries": [], "firmware": [], "text": {}}
    with zipfile.ZipFile(path) as z:
        for info in z.infolist():
            if info.filename.endswith("/"):
                continue
            data = z.read(info)
            ext = pathlib.Path(info.filename).suffix.lower()
            entry = {"name": info.filename, "size": len(data), "ext": ext, "kind": "binary"}
            log.append(f"    {info.filename:16s} {len(data):8d} B")

            if ext in (".doc",):
                body = doc_text(data)
                joined = " ".join(body)
                entry["kind"] = "doc"
                entry["keywords"] = keywords(joined)
                report["text"][info.filename] = joined[:4000]
            elif ext == ".pdf":
                joined = pdf_text(data)
                entry["kind"] = "pdf"
                entry["keywords"] = keywords(joined)
                report["text"][info.filename] = joined[:4000]
            elif ext in TEXT_EXT:
                joined = data.decode("cp1252", "ignore")
                entry["kind"] = "text"
                entry["keywords"] = keywords(joined)
                report["text"][info.filename] = joined[:4000]

            names = sorted({m.group(1).decode("cp1252", "ignore").lower()
                            for m in AVR_NAMES.finditer(data)})
            if names:
                entry["avr_names"] = names[:12]
            words = sorted({m.group(1).decode("cp1252", "ignore").lower()
                            for m in PROG_WORDS.finditer(data)})
            if words:
                entry["keywords"] = sorted(set(entry.get("keywords", [])) | set(words))

            for off, count, text in find_hex(data):
                tag = f"{path.stem}__{pathlib.Path(info.filename).stem}__{off:08x}.hex"
                entry.setdefault("hex_blocks", []).append({"offset": off, "records": count, "out": tag})
                if outdir is not None:
                    outdir.mkdir(parents=True, exist_ok=True)
                    (outdir / tag).write_bytes(text)
                log.append(f"      -> Intel HEX: {count} records at 0x{off:x} -> {tag}")
                report["firmware"].append({"archive": path.name, "entry": info.filename, "offset": off,
                                           "records": count, "file": tag})
            report["entries"].append(entry)
    return report


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", default=str(DEFAULT_DIR))
    ap.add_argument("--write", action="store_true")
    args = ap.parse_args()

    root = pathlib.Path(args.dir)
    zips = sorted(p for p in root.rglob("*") if p.is_file() and p.suffix.lower() == ".zip")
    if not zips:
        print(f"no archives under {root}")
        return 2

    outdir = root / "firmware" if args.write else None
    log = []
    reports = []
    for z in zips:
        log.append(f"  {z.relative_to(root)}  ({z.stat().st_size} bytes)")
        try:
            reports.append(inspect_zip(z, outdir, log))
        except Exception as e:  # noqa: BLE001
            log.append(f"    !! {type(e).__name__}: {e}")

    print("\n".join(log))

    firmware = [f for r in reports for f in r["firmware"]]
    print(f"\narchives : {len(reports)}")
    print(f"entries  : {sum(len(r['entries']) for r in reports)}")
    print(f"firmware : {len(firmware)} Intel HEX block(s)")
    for f in firmware:
        print(f"  {f['archive']} :: {f['entry']} @0x{f['offset']:x}  {f['records']} records -> {f['file']}")

    named = [(r["archive"], e["name"], e["avr_names"]) for r in reports for e in r["entries"] if e.get("avr_names")]
    print(f"\nAVR device names found in {len(named)} file(s):")
    for archive, name, names in named[:40]:
        print(f"  {archive} :: {name}: {', '.join(names)}")

    if args.write:
        lines = ["# What is inside the archived vendor downloads", ""]
        for r in reports:
            lines.append(f"## {r['archive']} ({r['bytes']} bytes)")
            lines.append("")
            lines.append("| entry | bytes | kind | AVR names | keywords |")
            lines.append("| --- | --- | --- | --- | --- |")
            for e in r["entries"]:
                lines.append(f"| `{e['name']}` | {e['size']} | {e['kind']} | "
                             f"{', '.join(e.get('avr_names', [])) or '—'} | {', '.join(e.get('keywords', [])) or '—'} |")
            lines.append("")
            for f in r["firmware"]:
                lines.append(f"- Intel HEX: `{f['entry']}` at 0x{f['offset']:x}, {f['records']} records → `firmware/{f['file']}`")
            lines.append("")
        (root / "INSPECT.md").write_text("\n".join(lines))
        print(f"\nwrote {root / 'INSPECT.md'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
