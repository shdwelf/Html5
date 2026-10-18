#!/usr/bin/env python3
"""Build a compact, provenance-aware Markdown report from native Ghidra outputs."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


LABELS = {
    "SNEAKERS.EXE": "original promotional program",
    "SNEAK.EXE": "original LHA SFX companion",
    "RECONSTRUCTED_SNEAKERS.EXE": "repository reconstruction (comparison only)",
}
INPUT_HASHES = {
    "SNEAKERS.EXE": "d5738c9a4050d69ca205a03229dad1616d681fbc9312859be3e629f4b3905961",
    "SNEAK.EXE": "4710858f7be6461a6d3a267cbc2dec8ca2594e70d28695298ecfb682d99f33bb",
    "RECONSTRUCTED_SNEAKERS.EXE": "52e66ef4e192b4a368c0de58cac79a8e81d7ec06180da15bba2675614a0f1920",
}


def text_file(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="replace").strip() if path.exists() else "not recorded"


def first_line(path: Path) -> str:
    value = text_file(path)
    return value.splitlines()[0] if value != "not recorded" else value


def asm_excerpt(path: Path, limit: int = 18) -> list[str]:
    if not path.exists():
        return []
    rows = []
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        if not line.strip() or line.lstrip().startswith(";"):
            continue
        rows.append(line.rstrip())
        if len(rows) >= limit:
            break
    return rows


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mz-dir", type=Path, required=True)
    parser.add_argument("--findcrypt-dir", type=Path, required=True)
    parser.add_argument("--sentinel-report", type=Path, required=True)
    parser.add_argument("--runtime-dir", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    sentinel = text_file(args.sentinel_report)
    if "CRYPT_AES_Encryption_SBox" not in sentinel:
        raise SystemExit("FindCrypt AES positive control failed or its report is missing")

    programs = {}
    for path in args.mz_dir.glob("*.ghidra.json"):
        metadata = json.loads(path.read_text(encoding="utf-8"))
        digest = str(metadata.get("sha256", "")).lower()
        name = next((input_name for input_name, expected in INPUT_HASHES.items() if digest == expected), None)
        if name is None:
            raise SystemExit(f"unexpected or missing input SHA-256 in {path}: {digest!r}")
        programs[name] = (metadata, path)
    if set(programs) != set(LABELS):
        raise SystemExit(f"expected Ghidra reports for {sorted(LABELS)}, found {sorted(programs)}")

    findcrypt_reports = {}
    for path in args.findcrypt_dir.glob("*.findcrypt.md"):
        if path.resolve() == args.sentinel_report.resolve() or path.name == "aes-signature-test.bin.findcrypt.md":
            continue
        name = None
        for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
            if line.startswith("- SHA-256: `") and line.endswith("`"):
                digest = line.removeprefix("- SHA-256: `").removesuffix("`").lower()
                name = next((input_name for input_name, expected in INPUT_HASHES.items() if digest == expected), None)
                break
        if name is None:
            candidate = path.name.removesuffix(".findcrypt.md").upper()
            if candidate in LABELS:
                name = candidate
        if name is not None:
            findcrypt_reports[name] = path
    if set(findcrypt_reports) != set(LABELS):
        raise SystemExit(f"expected FindCrypt reports for {sorted(LABELS)}, found {sorted(findcrypt_reports)}")

    output: list[str] = [
        "# Sneakers: native Ghidra + FindCrypt results",
        "",
        "Static analysis only. None of the input executables were launched or emulated by this workflow.",
        "",
        "## Reproducible toolchain",
        "",
        f"- Ghidra: `{first_line(args.runtime_dir / 'ghidra-version.txt')}`",
        f"- Eclipse Temurin/OpenJDK runtime: `{first_line(args.runtime_dir / 'java-version.txt')}`",
        f"- FindCrypt database: `{first_line(args.runtime_dir / 'findcrypt-version.txt')}`",
        "- The official Ghidra archive and FindCrypt database were SHA-256 checked before analysis.",
        "- The database-driven scan passed a positive control: its AES encryption S-box matched `CRYPT_AES_Encryption_SBox`.",
        "- This run uses the pinned FindCrypt signature database through Ghidra's `Memory.findBytes` API; it does not claim that the separately compiled FindCrypt extension loaded.",
        "",
        "## MZ loader analyses",
        "",
        "| Input / provenance | SHA-256 | Ghidra format | Language | Image base | Memory blocks / bytes | Functions | Instructions | Defined strings | Decompilations completed |",
        "|---|---|---|---|---|---:|---:|---:|---:|---:|",
    ]

    for name, label in LABELS.items():
        metadata, json_path = programs[name]
        blocks = metadata.get("memoryBlocks", [])
        block_bytes = sum(int(block.get("bytes", 0)) for block in blocks)
        decompilations = metadata.get("decompilations", [])
        decomp_ok = sum(bool(row.get("completed")) for row in decompilations)
        asm_stem = json_path.name.removesuffix(".ghidra.json")
        asm_path = args.mz_dir / f"{asm_stem}.asm"
        output.append(
            "| `{}` — {} | `{}` | `{}` | `{}` | `{}` | {} / {} B | {} | {} | {} | {}/{} |".format(
                name,
                label,
                metadata.get("sha256", ""),
                metadata.get("executableFormat", ""),
                metadata.get("language", ""),
                metadata.get("imageBase", ""),
                len(blocks),
                block_bytes,
                metadata.get("functions", 0),
                metadata.get("instructions", 0),
                metadata.get("definedStrings", 0),
                decomp_ok,
                len(decompilations),
            )
        )
        excerpt = asm_excerpt(asm_path)
        if excerpt:
            output.extend([
                "",
                f"### Address-order disassembly excerpt — `{name}`",
                "",
                "These are the first instructions in the exported listing, not a claim that the first address is the MZ entry point:",
                "",
                "```asm",
                *excerpt,
                "```",
            ])
        output.extend(["", f"Full `.asm`, `.c`, and `.strings.txt` files are retained in the CI artifact for `{name}`.", ""])

    output.extend([
        "",
        "## Native FindCrypt results",
        "",
        "The pinned TorgoTorgo FindCrypt database was scanned inside native Ghidra with `Memory.findBytes` against each complete file imported through `BinaryLoader` at base address zero. This pass covers the MZ header and any file overlay, not just the DOS-loaded image. It uses the extension's signature data, but is a Ghidra script rather than the compiled GUI/auto-analysis extension. The separate MZ-loader analyses above are the source for code disassembly and decompilation.",
        "",
    ])
    for name, label in LABELS.items():
        report = findcrypt_reports[name]
        output.extend([f"### `{name}` — {label}", "", text_file(report), ""])

    output.extend([
        "## Interpretation limits",
        "",
        "A FindCrypt zero-hit result means only that this pinned database's signatures did not match the bytes scanned. It does not rule out custom/table-free cryptography, XOR/add/sub transforms, compressed or encoded resources, or algorithms with different constants. A hit would still require disassembly and cross-reference review before attributing an algorithm to the program.",
        "",
        "The reconstruction comparator is included only to keep its previous puzzle/cipher claims distinct from the original promotional binaries. Do not transfer reconstruction behavior to either original EXE.",
        "",
    ])

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text("\n".join(output), encoding="utf-8")
    print(f"wrote {args.output}")


if __name__ == "__main__":
    main()
