#!/usr/bin/env python3
"""Conservative first-pass triage for a DOS MZ executable.

This is not a decompiler and does not reconstruct QBasic source: native machine
code has lost BASIC names, line structure, comments, and types. It only reports
obvious embedded file signatures and printable strings so an analyst can decide
what to extract or open in Ghidra.
"""
from __future__ import annotations
import hashlib, math, struct, sys
from collections import Counter
from pathlib import Path

SIGNATURES = {
    b"MZ": "DOS MZ executable", b"PK\x03\x04": "ZIP archive", b"GIF87a": "GIF image",
    b"GIF89a": "GIF image", b"\x89PNG\r\n\x1a\n": "PNG image", b"BM": "BMP image",
    b"\x0a\x05\x01\x08": "PCX (8-bit, possible)",
}

MZ_FIELDS = ("e_magic e_cblp e_cp e_crlc e_cparhdr e_minalloc e_maxalloc "
             "e_ss e_sp e_csum e_ip e_cs e_lfarlc e_ovno").split()

def parse_mz_header(data: bytes) -> list[str]:
    """Decode the 14-word DOS MZ header incl. the classic word-sum checksum."""
    words = struct.unpack_from("<14H", data, 0)
    lines = ["", "MZ HEADER"]
    for name, w in zip(MZ_FIELDS, words):
        lines.append(f"  {name:<11} 0x{w:04X} ({w})")
    image = words[2] * 512 - (512 - words[1] if words[1] else 0) if words[1] else words[2] * 512
    lines.append(f"  image size ≈ {image} bytes; load module starts at 0x{words[4]*16:X}")
    # DOS checksum: word sum of the load image with e_csum zeroed must be 0 mod 0x10000
    nwords = min(len(data), image) // 2
    total = sum(struct.unpack_from("<%dH" % nwords, data, 0))
    total = (total - words[9]) & 0xFFFF
    expected = (0x10000 - total) & 0xFFFF
    stored = words[9]
    lines.append(f"  e_csum stored 0x{stored:04X}, computed 0x{expected:04X} -> "
                 f"{'MATCH' if stored == expected else 'MISMATCH (patched, packed, or zeroed by a linker)'}")
    lines.append(f"  entry CS:IP = 0x{words[11]:04X}:0x{words[10]:04X}, stack SS:SP = 0x{words[7]:04X}:0x{words[8]:04X}")
    overlay = len(data) - image
    if overlay > 0:
        lines.append(f"  overlay: {overlay} bytes after image (data blob or appended payload)")
    return lines

def parse_pe_or_ne(data: bytes) -> list[str]:
    """Follow e_lfanew to a PE/NE/LE/LX signature (Windows, OS/2, VxD)."""
    if len(data) < 0x40:
        return []
    lfanew = struct.unpack_from("<I", data, 0x3C)[0]
    if not (0x40 <= lfanew < len(data) - 24):
        return [f"", f"e_lfanew = 0x{lfanew:08X} (out of range — not a PE)"]
    sig = data[lfanew:lfanew + 2]
    out = ["", "e_lfanew = 0x%X -> %s" % (lfanew, data[lfanew:lfanew+4].decode('latin1', 'replace'))]
    if sig == b"PE":
        machine, nsec, _td, _ptr, _opt, chars = struct.unpack_from("<HHIIIH", data, lfanew + 4)
        machines = {0x14C: "i386", 0x8664: "x86-64", 0x1C0: "ARM", 0xAA64: "ARM64"}
        opt_magic = struct.unpack_from("<H", data, lfanew + 24)[0] if lfanew + 26 <= len(data) else 0
        subsystem = struct.unpack_from("<H", data, lfanew + 24 + 68)[0] if lfanew + 24 + 70 <= len(data) else 0
        subs = {2: "GUI", 3: "console", 5: "OS/2", 7: "POSIX", 9: "WinCE"}
        out += [f"  PE machine 0x{machine:X} ({machines.get(machine, '?')})",
                f"  sections: {nsec}, optional-header magic 0x{opt_magic:X} ({'PE32' if opt_magic == 0x10B else 'PE32+' if opt_magic == 0x20B else '?'})",
                f"  subsystem {subsystem} ({subs.get(subsystem, '?')})",
                f"  characteristics 0x{chars:04X}"]
    elif sig in (b"NE", b"LE", b"LX"):
        out.append(f"  {sig.decode()} image (OS/2 / VxD family) — 16-bit Windows analysis path")
    return out

def entropy(data: bytes) -> float:
    n=len(data)
    return -sum((v/n)*math.log2(v/n) for v in Counter(data).values()) if n else 0.0

def main() -> int:
    if len(sys.argv) != 2: print("usage: exe_triage.py path/to/SNEAKERS.EXE", file=sys.stderr); return 2
    path=Path(sys.argv[1]); data=path.read_bytes()
    out=[f"File: {path.name}", f"Bytes: {len(data)}", f"SHA-256: {hashlib.sha256(data).hexdigest()}", f"Entropy: {entropy(data):.3f} bits/byte", ""]
    if data[:2] == b"MZ":
        pe = parse_pe_or_ne(data)
        is_pe = any("PE machine" in ln for ln in pe)
        if is_pe:
            out.append("MZ HEADER (DOS stub — a PE image follows via e_lfanew)")
            stub = parse_mz_header(data)
            out += [ln for ln in stub[1:] if not ln.lstrip().startswith(("e_csum", "image size", "entry CS:IP", "overlay"))
                    and not ln.startswith("MZ HEADER")]
            out += pe
        else:
            out += parse_mz_header(data)
            out += pe
        out.append("")
    out += ["SIGNATURE OFFSETS"]
    for signature, label in SIGNATURES.items():
        start=0; hits=0
        while (found:=data.find(signature,start)) >= 0:
            out.append(f"0x{found:08X}  {label}"); start=found+1; hits+=1
            if hits == 100: out.append("  … truncated after 100 matches"); break
    out.append("\nNEXT STEPS\n- Open a copy in Ghidra with the 16-bit x86 DOS loader.\n- Treat every signature as a candidate; verify its length/header before carving.\n- Use the original disk files for graphics where possible, not guesses inside the EXE.\n- Native MZ code cannot be automatically converted back into faithful QBasic source.")
    report=path.with_suffix(path.suffix+".triage.txt"); report.write_text("\n".join(out)+"\n")
    print(report); return 0
if __name__ == "__main__": raise SystemExit(main())
