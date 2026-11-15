#!/usr/bin/env python3
"""Validate and summarize bounded, native Ghidra/FindCrypt FBCTF 2019 reports.

Only approved metadata, external names, and signature labels are emitted. In
particular, do not copy decompiled code, strings, sample bytes, or Ghidra logs
into the Git checkout. CI checks the input hashes before invoking this script.
"""

import argparse
import json
import re
from pathlib import Path

NETSCREAM_SHA = "0a3b86e635d220fda3381432e67a139a2efa6cf587cc97e20e28caf08a714b89"
SOMBRERO_SHA = "5433df31bdc99d8980c5fe11cde9b68516d21e5a95efb85e94205539185026f8"
DB_COMMIT = "5c2fd5bb50d13a4092da136dc7004becd8129c7b"
DB_SHA = "ec3f54412ea1a1ddca05ec39eaa8ad1a9c38ce021297f359dbc0a58b9c7a8897"
REQUIRED_IMPORTS = {"AES_ige_encrypt", "AES_set_encrypt_key", "BN_mask_bits", "EC_GROUP_new_by_curve_name"}
EXPECTED_SOMBRERO = {
    (0x96EA0, "SHA256_K"),
    (0x96EA0, "SHACAL2_K"),
    (0x96FB0, "BLAKE2_IV"),
}


def scan(path: Path, expected_sha: str) -> dict:
    text = path.read_text(encoding="utf-8")
    version = re.search(r"^- Ghidra: `([^`]+)`$", text, re.M)
    checksum = re.search(r"^- SHA-256: `([^`]*)`$", text, re.M)
    count = re.search(r"^- Matching signature occurrences: \*\*(\d+)\*\*", text, re.M)
    db_count = re.search(r"^- FindCrypt database signatures: \*\*(\d+)\*\*", text, re.M)
    if not (version and checksum and count and db_count):
        raise ValueError(f"Incomplete native FindCrypt report: {path}")
    if version.group(1) != "12.1.4" or db_count.group(1) != "126":
        raise ValueError(f"Wrong Ghidra version or database cardinality: {path}")
    # BinaryLoader may omit a file digest; never equate an empty Ghidra field
    # with the CI input hash. A nonempty digest must match the pinned bytes.
    if expected_sha and checksum.group(1) and checksum.group(1) != expected_sha:
        raise ValueError(f"Imported file digest mismatch in {path}: {checksum.group(1)}")
    hits = {
        (int(addr, 16), label)
        for addr, label in re.findall(r"^\| `([0-9a-fA-F]+)` \| `CRYPT_([A-Za-z0-9_]+)` \|$", text, re.M)
    }
    if len(hits) != int(count.group(1)):
        raise ValueError(f"Unexpected hit count, duplicate or truncated report: {path}")
    return {"version": version.group(1), "sha": checksum.group(1), "hits": hits}


def summarize(netscream_json: Path, netscream_scan: Path, sombrero_scan: Path, sentinel_scan: Path) -> str:
    meta = json.loads(netscream_json.read_text(encoding="utf-8"))
    if meta.get("ghidraVersion") != "12.1.4":
        raise ValueError("Netscream JSON did not come from pinned Ghidra 12.1.4")
    if meta.get("sha256") != NETSCREAM_SHA:
        raise ValueError("Netscream native ELF import did not match the pinned SHA-256")
    if "ELF" not in meta.get("executableFormat", "") or not meta.get("language", "").startswith("x86:LE:64"):
        raise ValueError("Expected x86-64 ELF import, not a raw or misidentified loader")
    if meta.get("instructions", 0) <= 0 or meta.get("functions", 0) <= 0:
        raise ValueError("ELF import produced no disassembly/functions")
    imports = {str(row.get("name", "")).split("@")[0] for row in meta.get("imports", [])}
    if missing := REQUIRED_IMPORTS - imports:
        raise ValueError(f"Required native ELF import names absent: {sorted(missing)}")

    netscream = scan(netscream_scan, NETSCREAM_SHA)
    sombrero = scan(sombrero_scan, SOMBRERO_SHA)
    sentinel = scan(sentinel_scan, "")
    if netscream["version"] != meta["ghidraVersion"] or netscream["sha"] != NETSCREAM_SHA:
        raise ValueError("Native Netscream ELF and raw FindCrypt reports disagree")
    if netscream["hits"]:
        raise ValueError(f"Unexpected Netscream FindCrypt hits; review before publication: {netscream['hits']}")
    if sombrero["hits"] != EXPECTED_SOMBRERO:
        raise ValueError(f"Unexpected SOMBRERO signature set; review before publication: {sombrero['hits']}")
    if not any(label == "AES_Encryption_SBox" for _, label in sentinel["hits"]):
        raise ValueError("FindCrypt positive control did not detect AES_Encryption_SBox")

    names = ", ".join(f"`{name}`" for name in sorted(REQUIRED_IMPORTS))
    return f"""# FBCTF 2019: native Ghidra/FindCrypt metadata (CI-generated)

This report is the **static** output of a hash-gated GitHub Actions job, not an execution of either challenge. It is not a record of which team solved a task. Native Ghidra {meta['ghidraVersion']} imported `netscream.bin` as {meta['executableFormat']} / `{meta['language']}` and disassembled {meta['instructions']} instructions across {meta['functions']} functions. For both signature scans the complete original files were separately imported as raw bytes at base 0. The full disassembly and decompilation are retained as CI artifacts for review, **not** committed as text here.

| Public organizer sample | SHA-256 (bytes verified before import) | Native Ghidra loader | Pinned FindCrypt signature occurrences |
|---|---|---|---:|
| `crypto/netscream/dist/bin` (9,688 bytes) | `{NETSCREAM_SHA}` | ELF x86-64 disassembly; raw full-file scan | {len(netscream['hits'])} |
| `reversing/SOMBRERO_ROJO/dist/sombrero_rojo` (807,688 bytes) | `{SOMBRERO_SHA}` | **raw BinaryLoader only**, base 0; no auto-analysis (ELF header deliberately misleading) | {len(sombrero['hits'])} |

FindCrypt database: [TorgoTorgo/ghidra-findcrypt at `{DB_COMMIT}`](https://github.com/TorgoTorgo/ghidra-findcrypt/tree/{DB_COMMIT}), 126 records, database SHA-256 `{DB_SHA}`. The native **AES S-box positive control matched**; it is a synthetic signature file, not part of either challenge. The Ghidra ELF symbol table contains, among other imports, {names}; symbols alone do not prove which call site uses them.

Raw-loader SOMBRERO offsets (base 0 equals original **file offsets**):

| Offset | FindCrypt label | Interpretation after source review |
|---|---|---|
| `0x96ea0` | `SHA256_K` **and** `SHACAL2_K` | Same 256 bytes; the organizer source contains SHA-256 round constants, not evidence for SHACAL-2. |
| `0x96fb0` | `BLAKE2_IV` | Same 32-byte constants as SHA-256's initial state; organizer `sha256.c` uses SHA-256, not evidence for BLAKE2. |

**Boundaries:** This job uses Ghidra's `Memory.findBytes` with the verified FindCrypt signature database, **not** an installed FindCrypt plug-in's labeling pass. The independent `scripts/crypto-find.py` is a different heuristic and is not the source of this report. Zero matches in `netscream.bin` do **not** rule out cryptography: its AES and elliptic-curve implementations reside in the dynamically linked OpenSSL library, not the 9,688-byte file. SOMBRERO was not auto-disassembled here; a normalized-header copy must be separately hash-pinned and reviewed before calling it an ELF analysis. Do not run either challenge; SOMBRERO's source describes dropping and executing an embedded payload.

Origin, recipe vectors, contradictions in the organizer README, and 18-event scope: [`ctftime-facebook-2019-software-crypto-2026-11-13.md`](../ctftime-facebook-2019-software-crypto-2026-11-13.md). CI workflow: [`.github/workflows/arena-ctftime-ghidra.yml`](../../.github/workflows/arena-ctftime-ghidra.yml).
"""


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--netscream-json", type=Path, required=True)
    parser.add_argument("--netscream-findcrypt", type=Path, required=True)
    parser.add_argument("--sombrero-findcrypt", type=Path, required=True)
    parser.add_argument("--sentinel-findcrypt", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    report = summarize(args.netscream_json, args.netscream_findcrypt, args.sombrero_findcrypt, args.sentinel_findcrypt)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(report, encoding="utf-8")
    print(f"Validated pinned native static reports; wrote {args.output}")


if __name__ == "__main__":
    main()
