#!/usr/bin/env python3
"""Stage the Ghidra decompiler WASM + SLEIGH specs that ghidra-lab.html loads.

The heavy lifting (Ghidra's C++ decompiler compiled to WebAssembly) is done by
@mauricelam/ghidra-decompiler-wasm.  We do not rebuild it here -- this script
just vendors the runtime pieces we need into ./wasm/ghidra and rewrites
processors.json so it only advertises languages whose specs actually shipped.

Usage:
    python3 tools/stage_ghidra_specs.py /path/to/ghidra-decompiler-wasm/dist

Get that directory with:
    npm pack @mauricelam/ghidra-decompiler-wasm
    tar xzf mauricelam-ghidra-decompiler-wasm-*.tgz package/dist
"""

from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "wasm" / "ghidra"

# Languages worth keeping for the lab: the three x86 modes a DOS-era sample can
# realistically be, plus 64-bit so the same pane can chew on modern binaries.
KEEP_LANGUAGES = [
    "x86:LE:16:Real Mode",
    "x86:LE:16:Protected Mode",
    "x86:LE:32:default",
    "x86:LE:32:System Management Mode",
    "x86:LE:64:default",
    "x86:LE:64:compat32",
]

COMPILERS_TO_DROP = {"golang", "swift", "clangwindows"}


def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__)
        return 2
    src = Path(sys.argv[1]).resolve()
    if not (src / "ghidra_decompiler.wasm").is_file():
        print(f"error: {src}/ghidra_decompiler.wasm not found", file=sys.stderr)
        return 1

    DEST.mkdir(parents=True, exist_ok=True)
    for name in ("ghidra_decompiler.js", "ghidra_decompiler.wasm"):
        shutil.copy2(src / name, DEST / name)
        print(f"copied {name}")

    procs = json.loads((src / "processors.json").read_text())
    kept = []

    for entry in procs:
        if entry["id"] not in KEEP_LANGUAGES:
            continue
        compilers = [c for c in entry.get("compilers", []) if c.get("id") not in COMPILERS_TO_DROP]
        if not compilers:
            continue
        entry = dict(entry, compilers=compilers)
        files = [entry["sla"], entry["pspec"]] + [c["spec"] for c in compilers]
        if not all((src / f).is_file() for f in files):
            print(f"skip {entry['id']}: missing files")
            continue
        for rel in files:
            target = DEST / rel
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src / rel, target)
        kept.append(entry)
        print(f"kept {entry['id']} ({len(compilers)} compiler spec(s))")

    (DEST / "processors.json").write_text(json.dumps(kept, indent=2) + "\n")
    print(f"wrote {DEST / 'processors.json'} with {len(kept)} languages")
    total = sum(f.stat().st_size for f in DEST.rglob("*") if f.is_file())
    print(f"vendored {total / 1e6:.1f} MB into wasm/ghidra")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
