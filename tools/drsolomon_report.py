#!/usr/bin/env python3
"""Build the checked-in research note from ephemeral Ghidra output."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import re

KEYWORDS = re.compile(
    r"virus|encyclop|infect|remove|repair|clean|boot|partition|memory|findvirus|solomon|s&s|toolkit",
    re.IGNORECASE,
)


def cell(value: object) -> str:
    return str(value).replace("|", "\\|").replace("\n", " ")


def short_hash(value: str) -> str:
    return value[:16] + "…" if len(value) > 16 else value


def find_encyclopedia(rows: list[dict[str, object]]) -> dict[str, object] | None:
    for row in rows:
        if "VENCYCL" in str(row.get("name", "")).upper():
            return row
    return None


def excerpt_after(lines: list[str], needle: str, count: int = 36) -> list[str]:
    for index, line in enumerate(lines):
        if needle and line.lstrip().startswith(needle):
            start = max(0, index - 1)
            return lines[start : start + count]
    return lines[:count]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("inventory", type=Path)
    parser.add_argument("reports", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()

    inventory = json.loads(args.inventory.read_text(encoding="utf-8"))
    reports: dict[str, tuple[dict[str, object], Path]] = {}
    for path in sorted(args.reports.glob("*.ghidra.json")):
        report = json.loads(path.read_text(encoding="utf-8"))
        reports[str(report["program"]).upper()] = (report, path)

    expanded = inventory["expandedFiles"]
    artifact = inventory["artifact"]
    encyclopedia = find_encyclopedia(expanded)
    lines: list[str] = [
        "# Dr Solomon’s Virus Encyclopaedia — recovery and Ghidra static analysis",
        "",
        "> **Safety boundary:** all results below come from filesystem parsing and static",
        "> Ghidra analysis. No DOS/Windows program, installer, driver, demonstration, or",
        "> antivirus component was executed or emulated.",
        "",
        "## Finding",
        "",
        "The requested artifact resolves to **Dr Solomon’s Virus Encyclopaedia**, bundled",
        "with the 1992 *Dr Solomon’s Anti-Virus Toolkit for Windows & DOS* by S & S",
        "International Ltd. It is not a product of a software publisher called “Spectre",
        "Press”; that phrase was a mistaken lead. The primary preserved item is Internet",
        "Archive identifier [`dr-solomon`](https://archive.org/details/dr-solomon). Its file",
        "is named `DrSolomon.iso`, but the bytes are a **720 KiB FAT12 floppy image**, not",
        "an ISO-9660 CD image.",
        "",
        "The disk’s `WVENCYCL.EX_` member expands with Microsoft SZDD/LZSS to",
        "`WVENCYCL.EXE`, the Windows encyclopaedia program. The disk also carries the",
        "DOS/Windows scanner, guard, repair, installer, help, and virus-data components.",
        "The report keeps those components in scope so the encyclopaedia is not mistaken",
        "for a stand-alone virus sample.",
        "",
        "## Provenance gate",
        "",
        f"- Archive file: `{artifact['archiveFile']}` ({artifact['bytes']:,} bytes)",
        f"- MD5 (Archive metadata cross-check): `{artifact['md5']}`",
        f"- SHA-1 (Archive metadata cross-check): `{artifact['sha1']}`",
        f"- SHA-256 (computed by this pipeline): `{artifact['sha256']}`",
        f"- Gate result: **{'PASS' if artifact['pinned'] else 'FAIL'}**",
        "- Extractor: `tools/drsolomon_extract.py` (FAT12 + SZDD implemented locally)",
        "",
        "The MD5/SHA-1 values are identifiers copied from the Archive metadata, not a",
        "claim that those algorithms remain collision-resistant. The pipeline computes",
        "SHA-256 as the retained modern digest and refuses an image whose size, MD5, or",
        "SHA-1 differs from the pinned artifact.",
        "",
        "## Disk inventory",
        "",
        f"FAT12 geometry: {inventory['filesystem']['bytesPerSector']} bytes/sector · ",
        f"{inventory['filesystem']['totalSectors']} sectors · ",
        f"{inventory['filesystem']['rootEntries']} root entries · ",
        f"{inventory['filesystem']['fatCopies']} FAT copies.",
        "",
        "| expanded file | bytes | static type | SHA-256 | source member |",
        "| --- | ---: | --- | --- | --- |",
    ]
    for row in expanded:
        lines.append(
            f"| `{cell(row['name'])}` | {row['bytes']:,} | {cell(row['kind'])} | "
            f"`{short_hash(str(row['sha256']))}` | `{cell(row['source'])}` |"
        )

    lines += [
        "",
        "## Ghidra sweep",
        "",
        "The workflow imports every expanded MZ/NE executable into official NSA Ghidra",
        "12.1.4, allows standard auto-analysis, exports a complete instruction listing,",
        "defined strings, imports, analyzer warnings, and up to 48 decompiled functions,",
        "then deletes the temporary Ghidra project and source bytes. The Git repository",
        "retains this report plus `WVENCYCL.EXE` assembly, selected decompilation, strings,",
        "and JSON metadata—not the executable corpus.",
        "",
        "| program | format | language | functions | instructions | strings | imports | decompiled |",
        "| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |",
    ]
    for program, (report, _) in sorted(reports.items()):
        counts = report["counts"]
        completed = sum(1 for row in report["decompilations"] if row.get("completed"))
        lines.append(
            f"| `{cell(report['program'])}` | {cell(report['executableFormat'])} | "
            f"`{cell(report['language'])}` | {counts['functions']} | {counts['instructions']} | "
            f"{counts['definedStrings']} | {len(report['imports'])} | {completed}/{len(report['decompilations'])} |"
        )

    if encyclopedia is None:
        lines += ["", "**Pipeline error:** the expanded disk had no `VENCYCL` member."]
    else:
        enc_name = str(encyclopedia["name"])
        pair = reports.get(enc_name.upper())
        lines += ["", "## Encyclopaedia executable", ""]
        if pair is None:
            lines += [
                f"`{enc_name}` expanded and hash-checked, but Ghidra did not emit a report.",
                "Consult the workflow log before treating the sweep as complete.",
            ]
        else:
            report, json_path = pair
            counts = report["counts"]
            entries = report.get("entryPoints", [])
            blocks = report.get("memoryBlocks", [])
            imports = report.get("imports", [])
            completed = [row for row in report["decompilations"] if row.get("completed")]
            lines += [
                f"- File: `{enc_name}` · {encyclopedia['bytes']:,} bytes",
                f"- SHA-256: `{encyclopedia['sha256']}`",
                f"- Loader verdict: **{report['executableFormat']}**",
                f"- SLEIGH language: `{report['language']}` · compiler spec `{report['compiler']}`",
                f"- Image base/range: `{report['imageBase']}` · `{report['minAddress']}`–`{report['maxAddress']}`",
                f"- Recovered: **{counts['functions']} functions**, **{counts['instructions']} instructions**, "
                f"**{counts['definedStrings']} strings**, **{len(imports)} external symbols**",
                f"- Decompiler: **{len(completed)}/{len(report['decompilations'])}** selected functions produced C",
                "",
                "### What the static evidence establishes",
                "",
                "- This is a segmented 16-bit Windows NE application, not an encyclopedia",
                "  document and not a stand-alone DOS virus sample.",
                "- Its `USER`, `GDI`, `KERNEL`, and `BWCC` imports identify a graphical Win16",
                "  front end using Borland's custom controls. Embedded references to",
                "  `WTOOLKIT.HLP` connect it to the surrounding Anti-Virus Toolkit.",
                "- Its descriptive records distinguish infectiousness, infected object classes",
                "  (COM, EXE, boot/partition sectors), memory residence, and payload/infection",
                "  behavior. That is consistent with an informational browser over structured",
                "  virus descriptions; it does not establish that `WVENCYCL.EXE` carries or runs",
                "  the viruses it describes.",
                "- Ghidra's generated names (`FUN_…`, `DAT_…`) remain provisional. The checked-in",
                "  evidence preserves addresses and bytes so later symbol recovery can be audited.",
                "",
                "### Memory map",
                "",
                "| block | address range | bytes | R/W/X | entropy |",
                "| --- | --- | ---: | --- | ---: |",
            ]
            for block in blocks:
                perms = "".join(letter if block.get(flag) else "-" for letter, flag in (("R", "read"), ("W", "write"), ("X", "execute")))
                entropy = block.get("entropy", "—")
                lines.append(
                    f"| `{cell(block['name'])}` | `{block['start']}`–`{block['end']}` | "
                    f"{block['bytes']:,} | `{perms}` | {entropy} |"
                )

            lines += ["", "### Entry points", ""]
            if entries:
                for entry in entries[:32]:
                    lines.append(f"- `{entry['address']}` — `{cell(entry.get('function') or entry.get('name') or 'unnamed')}`")
                if len(entries) > 32:
                    lines.append(
                        f"- … {len(entries) - 32} additional NE entry/export addresses are retained in "
                        "[`WVENCYCL.EXE.ghidra.json`](dr-solomon-ghidra-evidence/WVENCYCL.EXE.ghidra.json)."
                    )
            else:
                lines.append("- Ghidra marked no external entry point; review the loader/analyzer warnings.")

            lines += ["", "### Imported API surface", ""]
            if imports:
                by_library: dict[str, list[str]] = {}
                for row in imports:
                    by_library.setdefault(str(row.get("library") or "unknown"), []).append(str(row["name"]))
                for library, names in sorted(by_library.items()):
                    preview = ", ".join(f"`{name}`" for name in names[:30])
                    tail = f" (+{len(names) - 30} more)" if len(names) > 30 else ""
                    lines.append(f"- **{cell(library)}:** {preview}{tail}")
            else:
                lines.append("- No external symbols recovered (normal for some statically linked 16-bit programs).")

            stem = json_path.name.removesuffix(".ghidra.json")
            strings_path = args.reports / f"{stem}.strings.txt"
            asm_path = args.reports / f"{stem}.asm"
            c_path = args.reports / f"{stem}.c"
            notable: list[str] = []
            if strings_path.exists():
                for line in strings_path.read_text(encoding="utf-8", errors="replace").splitlines():
                    if KEYWORDS.search(line) and line not in notable:
                        notable.append(line)
                    if len(notable) >= 24:
                        break
            lines += ["", "### Notable defined strings", ""]
            if notable:
                lines += ["```text", *notable, "```"]
            else:
                lines.append("Ghidra's defined-string pass found no strings matching the research terms.")

            string_references = [
                row for row in report.get("notableStringReferences", []) if row.get("xrefs")
            ]
            lines += ["", "### Code references to descriptive strings", ""]
            if string_references:
                lines += [
                    "| string address/text | referring instruction → function |",
                    "| --- | --- |",
                ]
                for row in string_references[:24]:
                    text = str(row.get("text", "")).replace("`", "'")
                    if len(text) > 72:
                        text = text[:69] + "…"
                    refs = ", ".join(
                        f"`{ref.get('from', '')}` → `{cell(ref.get('function') or 'unresolved')}`"
                        for ref in row["xrefs"][:8]
                    )
                    lines.append(f"| `{row['address']}` — {cell(text)} | {refs} |")
            else:
                lines.append(
                    "No direct references to the matched string starts were recovered; Win16 resource "
                    "or table indirection can obscure those links."
                )

            lines += [
                "",
                "### Checked-in Ghidra evidence",
                "",
                "- [Complete instruction listing](dr-solomon-ghidra-evidence/WVENCYCL.EXE.asm)",
                "- [Selected decompiler output](dr-solomon-ghidra-evidence/WVENCYCL.EXE.c)",
                "- [Defined strings](dr-solomon-ghidra-evidence/WVENCYCL.EXE.strings.txt)",
                "- [Machine-readable metadata, imports, xrefs, and analyzer findings](dr-solomon-ghidra-evidence/WVENCYCL.EXE.ghidra.json)",
            ]

            entry_address = str(entries[0]["address"]) if entries else ""
            if asm_path.exists():
                asm_lines = asm_path.read_text(encoding="utf-8", errors="replace").splitlines()
                excerpt = excerpt_after(asm_lines, entry_address, 42)
                lines += [
                    "",
                    "### Disassembly excerpt at the entry point",
                    "",
                    "The complete checked-in listing is linked above; this excerpt provides a",
                    "compact view of the decoded entry path.",
                    "",
                    "```asm",
                    *excerpt,
                    "```",
                ]
            if c_path.exists():
                c_lines = c_path.read_text(encoding="utf-8", errors="replace").splitlines()
                excerpt = c_lines[:90]
                lines += [
                    "",
                    "### Decompiler excerpt",
                    "",
                    "```c",
                    *excerpt,
                    "```",
                ]

            warnings = report.get("analysisBookmarks", [])
            lines += ["", "### Analyzer caveats", ""]
            if warnings:
                for warning in warnings[:30]:
                    lines.append(
                        f"- `{warning['address']}` {cell(warning['type'])}/{cell(warning['category'])}: "
                        f"{cell(warning['comment'])}"
                    )
            else:
                lines.append("- Ghidra emitted no Error/Warning bookmarks for this program.")

    lines += [
        "",
        "## Historical cross-check",
        "",
        "- The 1992 disk image and S&S attribution come from the Internet Archive item",
        "  metadata and are independently enforced by the disk hashes above.",
        "- A separate 1995 print edition is catalogued as *Dr Solomon’s Virus",
        "  Encyclopaedia* by Alan Solomon and Dmitry O. Gryaznov, ISBN 1-897661-00-2.",
        "- This artifact is distinct from Eugene Kaspersky’s later AVP Virus",
        "  Encyclopedia. Contemporary descriptions place AVP’s bilingual virus databank",
        "  project in 1992, but that does not make this S&S disk an AVP binary.",
        "",
        "## Reproduce",
        "",
        "```bash",
        "# The workflow pins and downloads DrSolomon.iso, then:",
        "python3 tools/drsolomon_extract.py DrSolomon.iso /tmp/drsolomon",
        "# For each expanded MZ/NE member:",
        "analyzeHeadless /tmp/ghidra-projects NAME -import FILE \\",
        "  -scriptPath tools/ghidra_scripts \\",
        "  -postScript EncyclopediaReport.java /tmp/drsolomon/reports -deleteProject",
        "python3 tools/drsolomon_report.py \\",
        "  /tmp/drsolomon/inventory.json /tmp/drsolomon/reports \\",
        "  docs/dr-solomon-virus-encyclopaedia-ghidra.md",
        "```",
        "",
        "The automation lives in `.github/workflows/drsolomon-ghidra.yml`. The principal",
        "`WVENCYCL.EXE` static outputs are checked in under `docs/dr-solomon-ghidra-evidence/`;",
        "the run artifact also contains exports for every analyzed executable. Raw disk and",
        "executable bytes are intentionally excluded from both destinations.",
        "",
    ]

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text("\n".join(lines), encoding="utf-8")
    print(args.output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
