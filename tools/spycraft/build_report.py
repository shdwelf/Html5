#!/usr/bin/env python3
"""Build a reviewable Spycraft static-analysis report from inventory/Ghidra JSON."""

from __future__ import annotations

import argparse
import json
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def human_bytes(value: int) -> str:
    units = ("B", "KiB", "MiB", "GiB")
    number = float(value)
    for unit in units:
        if number < 1024 or unit == units[-1]:
            return f"{number:.0f} {unit}" if unit == "B" else f"{number:.2f} {unit}"
        number /= 1024
    return f"{value} B"


def cell(value: object) -> str:
    return str(value).replace("|", "\\|").replace("\n", " ")


def candidate_rows(inventory: dict[str, Any]) -> list[dict[str, Any]]:
    return [row for row in inventory["files"] if "executable-candidate" in row["categories"]]


def report_rows(report_root: Path) -> list[dict[str, Any]]:
    rows = []
    for path in sorted(report_root.rglob("*.ghidra.json")):
        try:
            row = load_json(path)
        except (OSError, json.JSONDecodeError) as error:
            rows.append({"program": path.name, "reportPath": str(path.relative_to(report_root)), "loadError": str(error)})
            continue
        row["reportPath"] = str(path.relative_to(report_root))
        rows.append(row)
    return rows


def summarize(inventory: dict[str, Any], ghidra: list[dict[str, Any]]) -> dict[str, Any]:
    imports: Counter[str] = Counter()
    libraries: Counter[str] = Counter()
    notable: list[dict[str, str]] = []
    for report in ghidra:
        for symbol in report.get("imports", []):
            name = symbol.get("name", "")
            library = symbol.get("library", "")
            if name:
                imports[name] += int(symbol.get("references", 0)) or 1
            if library:
                libraries[library] += 1
        for string in report.get("notableStringReferences", []):
            notable.append(
                {
                    "program": report.get("program", ""),
                    "address": string.get("address", ""),
                    "text": string.get("text", ""),
                }
            )
    return {
        "schemaVersion": 1,
        "analysisMode": "static-only; binaries were imported but never executed",
        "source": inventory["source"],
        "archive": inventory["archive"],
        "inventorySummary": inventory["summary"],
        "inventoryFiles": inventory["files"],
        "executableCandidates": candidate_rows(inventory),
        "ghidraReports": ghidra,
        "aggregate": {
            "libraries": dict(libraries.most_common()),
            "importsByObservedReferences": dict(imports.most_common()),
            "notableStrings": notable,
        },
    }


def markdown(summary: dict[str, Any]) -> str:
    source = summary["source"]
    archive = summary["archive"]
    inventory = summary["inventorySummary"]
    candidates = summary["executableCandidates"]
    ghidra = summary["ghidraReports"]
    lines = [
        "# Spycraft: The Great Game demo — static analysis",
        "",
        "> Evidence generated without launching the installer, game, or any extracted executable. Ghidra imported candidate binaries for static analysis only.",
        "",
        "## Provenance and hash gate",
        "",
        f"- **Item:** Internet Archive `{source['identifier']}` / `{source['member']}`",
        f"- **Acquisition:** {source['url']}",
        f"- **Publisher attribution / date:** {source['publisherAttribution']} / {source['publicationDate']}",
        f"- **Archive size:** {archive['bytes']:,} bytes ({human_bytes(archive['bytes'])})",
        f"- **MD5:** `{archive['md5']}`",
        f"- **SHA-1:** `{archive['sha1']}`",
        f"- **SHA-256:** `{archive['sha256']}`",
        f"- **Gate:** {'passed exact expected size, MD5, and SHA-1' if archive.get('gatePassed') else 'not applied (development output)'}",
        "",
        "The selected corpus is the small publisher-attributed 1996 demo, not a retail-disc image. The workflow stops before extraction if the recorded size, MD5, or SHA-1 differs.",
        "",
        "## Archive inventory",
        "",
        f"The ZIP contains **{inventory['files']} files** totaling **{inventory['expandedBytes']:,} expanded bytes**. Category counts are labels, so a file may appear in more than one category.",
        "",
        "| Category | Files |",
        "|---|---:|",
    ]
    for category, count in inventory["categories"].items():
        lines.append(f"| {cell(category)} | {count} |")
    lines.extend(["", "### Members", "", "| Archive member | Bytes | Signature | Categories |", "|---|---:|---|---|"])
    for row in summary.get("inventoryFiles", []):
        categories = ", ".join(row.get("categories", []))
        lines.append(f"| `{cell(row['member'])}` | {row['bytes']:,} | `{cell(row.get('signature', ''))}` | {cell(categories)} |")
    lines.extend(
        [
            "",
            "### Executable candidates",
            "",
            "Candidates are selected by filename suffix or an `MZ` header. Header parsing below is independent of Ghidra and intentionally conservative.",
            "",
            "| Archive member | Bytes | SHA-256 | Header | Architecture / target |",
            "|---|---:|---|---|---|",
        ]
    )
    for row in candidates:
        executable = row.get("executable", {})
        target = executable.get("targetOS", executable.get("architecture", "unknown"))
        lines.append(
            f"| `{cell(row['member'])}` | {row['bytes']:,} | `{row['sha256']}` | {cell(executable.get('format', 'unknown'))} | {cell(target)} |"
        )
    if not candidates:
        lines.append("| _None found_ | — | — | — | — |")

    lines.extend(
        [
            "",
            "## Ghidra results",
            "",
            "| Program | Format | Language | Functions | Instructions | Strings | Decompiles |",
            "|---|---|---|---:|---:|---:|---:|",
        ]
    )
    for report in ghidra:
        if "loadError" in report:
            lines.append(f"| `{cell(report['program'])}` | report error | — | — | — | — | — |")
            continue
        counts = report.get("counts", {})
        decompiles = sum(bool(item.get("completed")) for item in report.get("decompilations", []))
        lines.append(
            f"| `{cell(report.get('program', ''))}` | {cell(report.get('executableFormat', ''))} | `{cell(report.get('language', ''))}` | {counts.get('functions', 0)} | {counts.get('instructions', 0)} | {counts.get('definedStrings', 0)} | {decompiles} |"
        )
    if not ghidra:
        lines.append("| _No Ghidra JSON reports were produced_ | — | — | — | — | — | — |")

    lines.extend(["", "### Evidence-based findings", ""])
    inventory_files = summary.get("inventoryFiles", [])
    director_containers = [
        (row["member"], row.get("signature", ""))
        for row in inventory_files
        if row.get("signature", "").startswith(("RIFX/", "XFIR/", "RIFF/"))
    ]
    if candidates and all(row.get("executable", {}).get("format") == "NE" for row in candidates):
        names = " and ".join(f"`{row['member']}`" for row in candidates)
        quantifier = "Both executable candidates are" if len(candidates) == 2 else f"All {len(candidates)} executable candidate(s) are"
        lines.append(f"- {quantifier} 16-bit Windows New Executable (NE) files: {names}.")
    if director_containers:
        rendered = ", ".join(f"`{name}` ({signature})" for name, signature in director_containers)
        lines.append(f"- The archive carries Director-style resource containers: {rendered}.")

    notable_text = [row["text"] for row in summary["aggregate"]["notableStrings"]]
    notable_lower = "\n".join(notable_text).lower()
    director_version = next((text for text in notable_text if "director version" in text.lower()), "")
    player_version = next((text for text in notable_text if "director player" in text.lower()), "")
    if director_version or player_version:
        versions = " and ".join(f"`{value}`" for value in (director_version, player_version) if value)
        lines.append(f"- Defined resource strings identify the executable as a Macromedia Director-era projector: {versions}.")
    requirements = [
        text for text in notable_text
        if any(term in text.lower() for term in ("windows version", "protected mode", "free memory"))
    ]
    if requirements:
        lines.append("- Its own initialization strings require Windows 3.1 or later, enhanced/protected mode, and at least 4 MB of free memory; these are period platform requirements, not modern compatibility claims.")
    if any("video for windows" in text.lower() for text in notable_text) and any("windows sound" in text.lower() for text in notable_text):
        lines.append("- The player resources enumerate Video for Windows (`.avi`) and Windows Sound (`.wav`); the broader string listing also names Director movies, QuickTime, FLI/FLC, bitmap, GIF, TIFF, and other importable media formats.")

    fileio = next((row for row in ghidra if row.get("program", "").upper() == "FILEIO.DLL"), None)
    if fileio:
        exports = [row.get("name", "") for row in fileio.get("entryPoints", []) if row.get("name", "").startswith("_FILEIO_")]
        if exports:
            exemplars = ", ".join(f"`{name}`" for name in exports[:6])
            lines.append(f"- `FILEIO.DLL` exposes {len(exports)} named FileIO entry points ({exemplars}, …), consistent with the recovered XObject factory/help strings for scripted file access.")
    if not any(term in notable_lower for term in ("cia", "kgb", "spycraft")):
        lines.append("- No defined executable string matched CIA, KGB, or Spycraft narrative terms. In this demo, story/interface material is therefore more likely to reside in the Director containers than in the generic player and FileIO executable strings; this is a bounded inference, not a decoded-container result.")

    bookmarks = sum(len(row.get("analysisBookmarks", [])) for row in ghidra)
    if bookmarks:
        lines.append(f"- Ghidra recorded {bookmarks} warning/error analysis bookmarks. Function and instruction counts are partial loader results for segmented 16-bit NE code, not complete source-level coverage.")
    if not any(line.startswith("- ") for line in lines[-8:]):
        lines.append("- The available machine-readable evidence does not support additional format-level findings.")

    aggregate = summary["aggregate"]
    lines.extend(["", "### Imported libraries", ""])
    if aggregate["libraries"]:
        lines.extend(["| Library / namespace | Imported symbols |", "|---|---:|"])
        for library, count in list(aggregate["libraries"].items())[:30]:
            lines.append(f"| `{cell(library)}` | {count} |")
    else:
        lines.append("No external library symbols were recovered. That can reflect the executable format or loader limitations; it is not evidence that the program has no dependencies.")

    lines.extend(["", "### Research string records", "", "These are defined strings selected by research terms; per-row cross-reference arrays in the JSON may be empty for resource-only text.", ""])
    notable = aggregate["notableStrings"]
    if notable:
        lines.extend(["| Program | Address | Defined string |", "|---|---|---|"])
        for row in notable[:80]:
            text = row["text"]
            if len(text) > 180:
                text = text[:177] + "…"
            lines.append(f"| `{cell(row['program'])}` | `{cell(row['address'])}` | `{cell(text)}` |")
        if len(notable) > 80:
            lines.append(f"\n_The table is capped at 80 of {len(notable)} rows; machine-readable JSON retains all rows._")
    else:
        lines.append("No defined strings matched the Spycraft/media/network/tradecraft research terms with recoverable references.")

    lines.extend(
        [
            "",
            "## Interpretation limits",
            "",
            "- This is a static inventory and reverse-engineering pass, not a playthrough and not a claim about runtime behavior.",
            "- Import names and strings indicate capabilities or terminology available to a binary; they do not prove a code path ran.",
            "- Ghidra's recovered names and decompilation are analytic reconstructions, not original Activision source code.",
            "- A demo may differ materially from the 1996 retail releases and later reissues.",
            "- Selected decompilation, defined-string listings, and Ghidra JSON are committed as derived evidence. Full disassembly remains only in the time-limited workflow artifact; copyrighted input binaries are never committed or uploaded.",
            "",
            "## Reproduction",
            "",
            "Run the `Spycraft demo / static Ghidra analysis` GitHub Actions workflow. It downloads the exact gated archive and the repository-pinned official Ghidra release, inventories safely extracted members, imports candidate executables one at a time, and uploads only derived reports and logs.",
            "",
        ]
    )
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--inventory", required=True, type=Path)
    parser.add_argument("--ghidra-root", required=True, type=Path)
    parser.add_argument("--json-output", required=True, type=Path)
    parser.add_argument("--markdown-output", required=True, type=Path)
    args = parser.parse_args()

    inventory = load_json(args.inventory)
    ghidra = report_rows(args.ghidra_root)
    summary = summarize(inventory, ghidra)
    args.json_output.parent.mkdir(parents=True, exist_ok=True)
    args.markdown_output.parent.mkdir(parents=True, exist_ok=True)
    args.json_output.write_text(json.dumps(summary, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    args.markdown_output.write_text(markdown(summary), encoding="utf-8")
    print(f"Wrote {args.json_output}")
    print(f"Wrote {args.markdown_output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
