#!/usr/bin/env python3
"""Conservative first-pass triage for a DOS MZ executable.

This is not a decompiler and does not reconstruct QBasic source: native machine
code has lost BASIC names, line structure, comments, and types. It only reports
obvious embedded file signatures and printable strings so an analyst can decide
what to extract or open in Ghidra.
"""
from __future__ import annotations
import hashlib, math, sys
from collections import Counter
from pathlib import Path

SIGNATURES = {
    b"MZ": "DOS MZ executable", b"PK\x03\x04": "ZIP archive", b"GIF87a": "GIF image",
    b"GIF89a": "GIF image", b"\x89PNG\r\n\x1a\n": "PNG image", b"BM": "BMP image",
    b"\x0a\x05\x01\x08": "PCX (8-bit, possible)",
}

def entropy(data: bytes) -> float:
    n=len(data)
    return -sum((v/n)*math.log2(v/n) for v in Counter(data).values()) if n else 0.0

def main() -> int:
    if len(sys.argv) != 2: print("usage: exe_triage.py path/to/SNEAKERS.EXE", file=sys.stderr); return 2
    path=Path(sys.argv[1]); data=path.read_bytes()
    out=[f"File: {path.name}", f"Bytes: {len(data)}", f"SHA-256: {hashlib.sha256(data).hexdigest()}", f"Entropy: {entropy(data):.3f} bits/byte", "", "SIGNATURE OFFSETS"]
    for signature, label in SIGNATURES.items():
        start=0; hits=0
        while (found:=data.find(signature,start)) >= 0:
            out.append(f"0x{found:08X}  {label}"); start=found+1; hits+=1
            if hits == 100: out.append("  … truncated after 100 matches"); break
    out.append("\nNEXT STEPS\n- Open a copy in Ghidra with the 16-bit x86 DOS loader.\n- Treat every signature as a candidate; verify its length/header before carving.\n- Use the original disk files for graphics where possible, not guesses inside the EXE.\n- Native MZ code cannot be automatically converted back into faithful QBasic source.")
    report=path.with_suffix(path.suffix+".triage.txt"); report.write_text("\n".join(out)+"\n")
    print(report); return 0
if __name__ == "__main__": raise SystemExit(main())
