#!/usr/bin/env python3
"""Unpack the JCreator installers so Ghidra sees the IDE, not the setup stub.

    python3 tools/jcreator_unpack.py <workdir>

The first run of the pipeline analyzed `JCreatorSetup.exe` and `Setup.exe` and
correctly reported no JDK coupling at all — because neither is JCreator. Both
are ~2 MB files with ~45 KB of code and a compressed payload appended:

    JCreatorSetup.exe   MSVC-built SFX stub, .text 40 KB, 232 strings
    Setup.exe           compiler id `borlanddelphi`, CODE 46 KB — Inno Setup,
                        which is written in Delphi

This step expands them and rebuilds the analysis queue from what falls out, so
the probe runs against `JCreator.exe` itself.

Reads and rewrites <workdir>/inventory.json, adding `unpackedFiles` and
`analysisQueue`.
"""
import json
import pathlib
import shutil
import subprocess
import sys

# Tried in order; the first that yields a PE wins. None of them execute the
# installer — they all parse the container format.
EXTRACTORS = [
    ("innoextract", lambda exe, out: ["innoextract", "--extract", "--silent",
                                      "--output-dir", str(out), str(exe)]),
    ("7z", lambda exe, out: ["7z", "x", "-y", f"-o{out}", str(exe)]),
    ("cabextract", lambda exe, out: ["cabextract", "-q", "-d", str(out), str(exe)]),
]


def classify(path: pathlib.Path) -> str:
    try:
        head = path.open("rb").read(0x400)
    except OSError:
        return "unreadable"
    if head[:2] != b"MZ":
        return "data"
    if len(head) < 0x40:
        return "dos-mz"
    offset = int.from_bytes(head[0x3C:0x40], "little")
    try:
        with path.open("rb") as handle:
            handle.seek(offset)
            sig = handle.read(6)
    except OSError:
        return "dos-mz"
    if sig[:4] != b"PE\0\0":
        return "dos-mz"
    machine = int.from_bytes(sig[4:6], "little")
    arch = {0x014C: "i386", 0x8664: "x86-64", 0x01C0: "arm"}.get(machine, hex(machine))
    return f"pe-executable:{arch}"


def find_pes(root: pathlib.Path) -> list[pathlib.Path]:
    out = []
    for path in sorted(root.rglob("*")):
        if path.is_file() and classify(path).startswith("pe-"):
            out.append(path)
    return out


def unpack(exe: pathlib.Path, out: pathlib.Path) -> tuple[str, list[pathlib.Path]]:
    """Return (extractor-that-worked, PEs produced)."""
    for name, build in EXTRACTORS:
        if not shutil.which(name):
            print(f"      {name}: not installed, skipping")
            continue
        target = out / name
        target.mkdir(parents=True, exist_ok=True)
        result = subprocess.run(build(exe, target), capture_output=True, text=True)
        pes = find_pes(target)
        status = "ok" if result.returncode == 0 else f"exit {result.returncode}"
        print(f"      {name}: {status}, {len(pes)} PE(s)")
        if pes:
            return name, pes
        # Nothing usable — don't leave a confusing empty tree behind.
        shutil.rmtree(target, ignore_errors=True)
    return "", []


def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__)
        return 2
    root = pathlib.Path(sys.argv[1]).resolve()
    inventory_path = root / "inventory.json"
    inventory = json.loads(inventory_path.read_text())

    installers = [r for r in inventory["expandedFiles"] if r["kind"].startswith("pe-")]
    unpacked: list[dict] = []

    for row in installers:
        exe = pathlib.Path(row["path"])
        print(f"[{row['source']}] {row['name']} ({row['size']:,} B)")
        out = exe.parent / "_unpacked"
        tool, pes = unpack(exe, out)
        if not pes:
            print("      nothing extracted — the stub stays in the queue")
            continue
        for pe in pes:
            size = pe.stat().st_size
            unpacked.append({
                "source": row["source"],
                "fromInstaller": row["name"],
                "extractor": tool,
                "path": str(pe),
                "name": pe.name,
                "relative": str(pe.relative_to(out)),
                "size": size,
                "kind": classify(pe),
            })
            print(f"      -> {pe.name:<30} {size:>10,} B")

    inventory["unpackedFiles"] = unpacked

    # Queue: prefer what came out of the installers. Keep a stub only if its
    # installer yielded nothing, so the run still has something to say.
    produced = {u["fromInstaller"] for u in unpacked}
    queue = [u["path"] for u in unpacked]
    for row in installers:
        if row["name"] not in produced:
            queue.append(row["path"])

    # Biggest first: the IDE is the large one, helper stubs are small.
    sizes = {u["path"]: u["size"] for u in unpacked}
    sizes.update({r["path"]: r["size"] for r in installers})
    queue.sort(key=lambda p: -sizes.get(p, 0))

    # Keep the run bounded; an installer can contain dozens of small DLLs.
    MAX_QUEUE = 12
    if len(queue) > MAX_QUEUE:
        print(f"\nqueue trimmed from {len(queue)} to {MAX_QUEUE} largest PEs")
        queue = queue[:MAX_QUEUE]

    inventory["analysisQueue"] = queue
    inventory_path.write_text(json.dumps(inventory, indent=2) + "\n")

    print(f"\n{len(unpacked)} PE(s) recovered from {len(installers)} installer(s)")
    for path in queue:
        print(f"  queue {pathlib.Path(path).name} ({sizes.get(path, 0):,} B)")
    if not queue:
        raise SystemExit("nothing to analyze")
    return 0


if __name__ == "__main__":
    sys.exit(main())
