#!/usr/bin/env python3
"""Build an ignored, private copy of the curated HTML5 offline viewer.

This allowlist intentionally contains only the repository's Helios Observatory
and Prime Viewer apps. It never reads staged or user-supplied files.
"""
from __future__ import annotations

from hashlib import sha256
from pathlib import Path
import json
import shutil
import zipfile

ROOT = Path(__file__).resolve().parents[1]
OUT_BASE = ROOT / "google_drive"
OUT_DIR = OUT_BASE / "html5-offline-viewer-private"
ZIP_PATH = OUT_BASE / "html5-offline-viewer-private.zip"
APP_SLUGS = ("helios-observatory", "prime-viewer")


def digest(path: Path) -> str:
    h = sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def copy_inputs() -> None:
    OUT_BASE.mkdir(parents=True, exist_ok=True)
    if OUT_DIR.exists():
        shutil.rmtree(OUT_DIR)
    (OUT_DIR / "apps").mkdir(parents=True)
    (OUT_DIR / "packages").mkdir()
    (OUT_DIR / "vendor" / "fflate").mkdir(parents=True)

    page = (ROOT / "offline-viewer.html").read_text(encoding="utf-8")
    if 'data-app-root="./public/apps/"' not in page or 'data-package-root="./"' not in page:
        raise SystemExit("Public viewer path markers changed; refusing a partial private build")
    page = page.replace('data-app-root="./public/apps/"', 'data-app-root="./apps/"', 1)
    page = page.replace('data-package-root="./"', 'data-package-root="./packages/"', 1)
    (OUT_DIR / "index.html").write_text(page, encoding="utf-8", newline="\n")

    for slug in APP_SLUGS:
        source = ROOT / "public" / "apps" / slug
        package = ROOT / f"{slug}.xdc"
        if not (source / "index.html").is_file() or not package.is_file():
            raise SystemExit(f"Required allowlisted app asset is missing: {slug}")
        shutil.copytree(source, OUT_DIR / "apps" / slug)
        with zipfile.ZipFile(package) as archive:
            bad_entry = archive.testzip()
            if bad_entry:
                raise SystemExit(f"Invalid repository XDC {package.name}: {bad_entry}")
            if "index.html" not in archive.namelist() or "manifest.toml" not in archive.namelist():
                raise SystemExit(f"Incomplete repository XDC: {package.name}")
        shutil.copy2(package, OUT_DIR / "packages" / package.name)

    shutil.copy2(ROOT / "xdc-viewer.html", OUT_DIR / "xdc-viewer.html")
    shutil.copy2(ROOT / "vendor" / "fflate" / "index.mjs", OUT_DIR / "vendor" / "fflate" / "index.mjs")
    shutil.copy2(ROOT / "vendor" / "fflate" / "LICENSE", OUT_DIR / "vendor" / "fflate" / "LICENSE")
    shutil.copy2(ROOT / "LICENSE", OUT_DIR / "LICENSE")

    (OUT_DIR / "README.md").write_text(
        "# HTML5 Offline Viewer — private copy\n\n"
        "This portable bundle contains the curated Helios Observatory and Prime Viewer apps, their WebXDC packages, and the local XDC player. It is a separate private delivery copy of the allowlisted repository software.\n\n"
        "## Run offline\n\n"
        "Keep the folder structure intact. Serve this directory from a local static HTTP server and open `index.html`; the apps and their assets are bundled here and require no external service. JavaScript modules may be blocked when opened directly with a `file://` URL.\n\n"
        "Use **Open local XDC player** to load an additional `.xdc` from disk. The player keeps app updates in memory and does not upload the selected file.\n\n"
        "`manifest.json` lists every bundled file except itself, with each listed file's SHA-256 digest. Root project software is covered by the included `LICENSE`; bundled dependencies retain their own license files.\n",
        encoding="utf-8",
        newline="\n",
    )
    file_records = []
    for path in sorted(p for p in OUT_DIR.rglob("*") if p.is_file()):
        file_records.append({
            "path": path.relative_to(OUT_DIR).as_posix(),
            "size": path.stat().st_size,
            "sha256": digest(path),
        })
    manifest = {
        "name": "HTML5 Offline Viewer (private copy)",
        "version": 1,
        "contents": [
            {"slug": "helios-observatory", "name": "Helios Observatory", "source": "public/apps/helios-observatory", "package": "packages/helios-observatory.xdc"},
            {"slug": "prime-viewer", "name": "Prime Viewer", "source": "public/apps/prime-viewer", "package": "packages/prime-viewer.xdc"},
        ],
        "privacy": "Only allowlisted repository apps are included. No staged or user-supplied files are read or copied.",
        "files": file_records,
    }
    (OUT_DIR / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")


def write_zip() -> None:
    if ZIP_PATH.exists():
        ZIP_PATH.unlink()
    with zipfile.ZipFile(ZIP_PATH, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for path in sorted(p for p in OUT_DIR.rglob("*") if p.is_file()):
            relative = path.relative_to(OUT_DIR.parent).as_posix()
            info = zipfile.ZipInfo(relative, date_time=(2026, 11, 10, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, path.read_bytes(), compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
    with zipfile.ZipFile(ZIP_PATH) as archive:
        bad_entry = archive.testzip()
        if bad_entry:
            raise SystemExit(f"Generated viewer bundle failed ZIP validation at {bad_entry}")
    print(f"Built private viewer: {ZIP_PATH.relative_to(ROOT)} ({ZIP_PATH.stat().st_size} bytes)")
    print(f"Expanded package: {sum(p.stat().st_size for p in OUT_DIR.rglob('*') if p.is_file())} bytes")


if __name__ == "__main__":
    copy_inputs()
    write_zip()
