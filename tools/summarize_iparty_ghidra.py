#!/usr/bin/env python3
"""Summarize GenericProgramReport output for the iParty binaries (T8.3).

Reads <reports-dir> for IPARTY/IPARTYD Ghidra reports and writes a
Markdown result focused on the audio-codec question: ACM imports,
codec/format strings, and decompiled fragments touching the ACM or
WAVEFORMAT machinery. Static analysis only - inputs are never executed.
"""
import json
import re
import sys
from pathlib import Path

ACM_RE = re.compile(r"acm|wave(In|Out)|mmio|WINMM|MSACM", re.I)
STRING_RE = re.compile(r"codec|compress|speech format|GSM|TrueSpeech|wave format|format tag", re.I)
C_RE = re.compile(r"acmStream|acmFormat|wFormatTag|WAVEFORMAT|CCodec")


def stem_of(p: Path) -> str:
    return p.name.replace(".ghidra.json", "")


def main() -> int:
    reports = Path(sys.argv[1])
    out = Path(sys.argv[2])
    lines = ["# iParty Ghidra pass — result (T8.3)", ""]
    reports_found = sorted(reports.glob("*.ghidra.json"))
    if not reports_found:
        lines.append("No Ghidra reports were produced — see the run log. This file records the attempt, not a pass.")
        out.write_text("\n".join(lines) + "\n", encoding="utf-8")
        return 0
    for jf in reports_found:
        stem = stem_of(jf)
        data = json.loads(jf.read_text(encoding="utf-8", errors="replace"))
        lines.append(f"## {data.get('program', stem)}")
        lines.append("")
        lines.append(f"- format: {data.get('executableFormat')} · language: {data.get('language')} · compiler: {data.get('compiler')}")
        lines.append(f"- sha256 (Ghidra): {data.get('sha256')}")
        lines.append(f"- functions: {data.get('functions')} · instructions: {data.get('instructions')} · defined strings: {data.get('definedStrings')}")
        lines.append("")
        imports = [r for r in data.get("imports", []) if ACM_RE.search(r.get("name", "") + " " + r.get("library", ""))]
        lines.append(f"### Audio/ACM-related imports ({len(imports)})")
        lines.append("")
        for r in imports[:80]:
            lines.append(f"- `{r.get('library')}!{r.get('name')}` @ {r.get('address')}")
        if not imports:
            lines.append("- none matched (codec may be statically linked or the import table is packed)")
        lines.append("")
        strings_file = reports / f"{stem}.strings.txt"
        hits = []
        if strings_file.exists():
            for raw in strings_file.read_text(encoding="utf-8", errors="replace").splitlines():
                if STRING_RE.search(raw):
                    hits.append(raw.strip())
        lines.append(f"### Codec/format strings ({len(hits)})")
        lines.append("")
        for h in hits[:60]:
            lines.append(f"- `{h[:180]}`")
        lines.append("")
        c_file = reports / f"{stem}.c"
        frags = []
        if c_file.exists():
            text = c_file.read_text(encoding="utf-8", errors="replace")
            for m in C_RE.finditer(text):
                start = max(0, text.rfind("\n", 0, max(0, m.start() - 400)))
                frags.append(text[start:m.start() + 400].strip())
                if len(frags) >= 6:
                    break
        lines.append(f"### Decompiled fragments touching ACM/WAVEFORMAT ({len(frags)} shown)")
        lines.append("")
        for f in frags:
            lines.append("```c")
            lines.append(f[:1200])
            lines.append("```")
            lines.append("")
        if not frags:
            lines.append("None of the decompiled functions (the report caps decompilation) touched the ACM path; a targeted xref script is the follow-on.")
            lines.append("")
    lines.append("Scope: static analysis only; binaries were never executed or emulated. "
                 "Identifying the *default* WAVEFORMAT tag IPL proposes may still need a targeted "
                 "cross-reference pass from the compressor-open call sites.")
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"wrote {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
