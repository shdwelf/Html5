#!/usr/bin/env python3
"""Inventory public DOS press-kit media without modifying its original ZIP."""
from __future__ import annotations
import hashlib
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path

IMAGE_EXTENSIONS = {".pcx", ".bmp", ".gif", ".png", ".jpg", ".jpeg"}
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "artifacts"


def digest(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: extract_assets.py source/Sneakers_Promotional_Diskette.zip", file=sys.stderr)
        return 2
    original = Path(sys.argv[1])
    if not original.is_file():
        print(f"missing source ZIP: {original}", file=sys.stderr)
        return 2
    staging = OUT / "disk"; graphics = OUT / "graphics"; pngs = OUT / "png"
    for directory in (staging, graphics, pngs): directory.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(original) as archive:
        archive.extractall(staging)
    files = sorted(p for p in staging.rglob("*") if p.is_file())
    lines = [f"Original: {original.name}", f"SHA-256: {digest(original)}", "", "FILES"]
    for item in files:
        lines.append(f"{item.relative_to(staging)}\t{item.stat().st_size}\t{digest(item)}")
        if item.suffix.lower() in IMAGE_EXTENSIONS:
            target = graphics / item.name
            shutil.copy2(item, target)
            # ImageMagick supports common historic PCX/BMP files. Failure is
            # recorded in the inventory rather than silently dropping an asset.
            if shutil.which("magick"):
                output = pngs / f"{item.stem}.png"
                result = subprocess.run(["magick", str(item), str(output)], capture_output=True, text=True)
                if result.returncode:
                    lines.append(f"CONVERSION-FAILED\t{item.relative_to(staging)}\t{result.stderr.strip()}")
    exe = next((p for p in files if p.name.upper() == "SNEAKERS.EXE"), None)
    if exe:
        raw = exe.read_bytes()
        printable = []
        for run in raw.split(b"\x00"):
            if len(run) >= 5 and sum(32 <= c < 127 for c in run) / len(run) > .9:
                printable.append(run.decode("cp437", "replace"))
        (OUT / "SNEAKERS.EXE.strings.txt").write_text("\n".join(printable) + "\n", encoding="utf-8")
        lines.append(f"\nSTATIC-ANALYSIS\nExecutable: {exe.relative_to(staging)}\nSHA-256: {digest(exe)}\nPrintable strings: SNEAKERS.EXE.strings.txt")
    else:
        lines.append("\nSTATIC-ANALYSIS\nSNEAKERS.EXE not found; inspect inventory for the actual entry point.")
    (OUT / "inventory.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
    converted = sorted(pngs.glob("*.png"))
    if converted and shutil.which("magick"):
        subprocess.run(["magick", "-delay", "80", "-loop", "0", *map(str, converted), str(OUT / "sneakers-graphics.gif")], check=False)
    print(f"Wrote {OUT.relative_to(ROOT)}/inventory.txt; found {len(list(graphics.iterdir()))} conventional graphics files.")
    return 0

if __name__ == "__main__": raise SystemExit(main())
