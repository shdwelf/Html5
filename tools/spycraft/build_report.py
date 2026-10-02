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

    aggregate = summary["aggregate"]
    lines.extend(["", "### Imported libraries", ""])
    if aggregate["libraries"]:
        lines.extend(["| Library / namespace | Imported symbols |", "|---|---:|"])
        for library, count in list(aggregate["libraries"].items())[:30]:
            lines.append(f"| `{cell(library)}` | {count} |")
    else:
        lines.append("No external library symbols were recovered. That can reflect the executable format or loader limitations; it is not evidence that the program has no dependencies.")

    lines.extend(["", "### Research strings with code references", ""])
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
            "- Full per-program disassembly, selected decompilation, defined-string listings, and Ghidra JSON are retained as workflow artifacts rather than committed copyrighted binaries.",
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
