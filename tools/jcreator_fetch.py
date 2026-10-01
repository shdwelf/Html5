#!/usr/bin/env python3
"""Fetch the archived JCreator distributions and inventory what is inside them.

    python3 tools/jcreator_fetch.py <workdir>

JCreator (Xinox Software, 1999-2014) is a Java IDE that is itself written in
C++ — "written entirely in C++, which makes it fast and efficient compared to
the Java-based IDEs", as the Tucows listing puts it. That makes it a native PE
binary rather than bytecode, and therefore a Ghidra target rather than a
javap one. It is interesting here because a native IDE has to *discover and
drive* a JDK from outside, so its binary records the Windows/Java integration
contract of its era.

Both items are hash-gated against the checksums the Internet Archive publishes
in its own item metadata (https://archive.org/metadata/<identifier>). If a
byte changes, this script fails rather than feeding Ghidra something else.

The sandbox this repo is developed in cannot reach archive.org — its egress is
allowlisted to GitHub/PyPI/npm — so this runs on a GitHub Actions runner. See
.github/workflows/jcreator-ghidra.yml.
"""
import hashlib
import json
import pathlib
import subprocess
import sys
import zipfile

# Checksums and sizes copied from archive.org item metadata, not computed by us.
#   https://archive.org/metadata/jcrea111_zip
#   https://archive.org/metadata/tucows_225075_JCreator_LE
SOURCES = [
    {
        "key": "jcreator-1.11",
        "identifier": "jcrea111_zip",
        "filename": "jcrea111.zip",
        "size": 2047175,
        "md5": "724024cb3160c6de89bc9684e9519c45",
        "sha1": "ec6b60ae93288d8a2ab6c3390654616cfde93bc4",
        "note": "JCreator v1.11, freeware, DEMU Collection / vintagesoftware, dated 2000.",
    },
    {
        "key": "jcreator-le-2.50",
        "identifier": "tucows_225075_JCreator_LE",
        "filename": "jcrea250.zip",
        "size": 2029349,
        "md5": "c31eeb68b03f491fc61455dc207c1c40",
        "sha1": "6deceb4f18dda28b4cec5443851d158b73740f9a",
        "note": (
            "JCreator LE 2.5.0, Tucows Software Archive, dated 2001-10-14, rights "
            "'Freeware'. Archive curation note: 'checked for malware' "
            "(validator@archive.org, 2014-04-06)."
        ),
    },
]

MIRRORS = ["https://archive.org/download/{identifier}/{filename}"]


def digest(path: pathlib.Path) -> tuple[str, str]:
    md5 = hashlib.md5()
    sha1 = hashlib.sha1()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            md5.update(chunk)
            sha1.update(chunk)
    return md5.hexdigest(), sha1.hexdigest()


def download(spec: dict, dest: pathlib.Path) -> None:
    last = None
    for template in MIRRORS:
        url = template.format(**spec)
        print(f"  GET {url}")
        result = subprocess.run(
            ["curl", "-fL", "--retry", "6", "--retry-all-errors",
             "--connect-timeout", "30", "--max-time", "900", url, "-o", str(dest)],
            capture_output=True, text=True,
        )
        if result.returncode == 0 and dest.exists() and dest.stat().st_size > 0:
            return
        last = result.stderr.strip() or f"curl exit {result.returncode}"
        print(f"      failed: {last}")
    raise SystemExit(f"could not download {spec['filename']}: {last}")


def gate(spec: dict, path: pathlib.Path) -> dict:
    size = path.stat().st_size
    md5, sha1 = digest(path)
    print(f"      bytes={size} md5={md5} sha1={sha1}")
    problems = []
    if size != spec["size"]:
        problems.append(f"size {size} != published {spec['size']}")
    if md5 != spec["md5"]:
        problems.append(f"md5 {md5} != published {spec['md5']}")
    if sha1 != spec["sha1"]:
        problems.append(f"sha1 {sha1} != published {spec['sha1']}")
    if problems:
        raise SystemExit(
            f"hash gate failed for {spec['filename']}:\n  " + "\n  ".join(problems)
            + "\nThe archived item changed, or the download was corrupted. "
              "Refusing to hand unverified bytes to Ghidra."
        )
    return {"size": size, "md5": md5, "sha1": sha1}


def classify(path: pathlib.Path) -> str:
    """Identify a file by signature. No dependency on `file`."""
    try:
        head = path.open("rb").read(0x400)
    except OSError:
        return "unreadable"
    if head[:2] != b"MZ":
        if head[:2] == b"PK":
            return "zip"
        if head[:4] == b"\x7fELF":
            return "elf"
        return "data"
    # Walk the DOS header to the PE header.
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


def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__)
        return 2
    root = pathlib.Path(sys.argv[1]).resolve()
    raw = root / "raw"
    expanded = root / "expanded"
    raw.mkdir(parents=True, exist_ok=True)
    expanded.mkdir(parents=True, exist_ok=True)

    inventory = {"sources": [], "expandedFiles": []}

    for spec in SOURCES:
        print(f"[{spec['key']}] {spec['note']}")
        archive = raw / spec["filename"]
        download(spec, archive)
        checked = gate(spec, archive)

        out = expanded / spec["key"]
        out.mkdir(parents=True, exist_ok=True)
        members = []
        with zipfile.ZipFile(archive) as zf:
            for info in zf.infolist():
                if info.is_dir():
                    continue
                # Refuse absolute paths and traversal before extracting.
                name = info.filename.replace("\\", "/")
                if name.startswith("/") or ".." in pathlib.PurePosixPath(name).parts:
                    print(f"      skip unsafe member {info.filename!r}")
                    continue
                target = out / name
                target.parent.mkdir(parents=True, exist_ok=True)
                with zf.open(info) as src, target.open("wb") as dst:
                    dst.write(src.read())
                kind = classify(target)
                members.append({"name": name, "size": info.file_size, "kind": kind})
                md5, sha1 = digest(target)
                inventory["expandedFiles"].append({
                    "source": spec["key"],
                    "path": str(target),
                    "name": name,
                    "size": info.file_size,
                    "kind": kind,
                    "md5": md5,
                    "sha1": sha1,
                })
                print(f"      {name:<34} {info.file_size:>9} B  {kind}")

        inventory["sources"].append({
            "key": spec["key"],
            "identifier": spec["identifier"],
            "filename": spec["filename"],
            "url": MIRRORS[0].format(**spec),
            "note": spec["note"],
            **checked,
            "members": members,
        })

    executables = [r for r in inventory["expandedFiles"] if r["kind"].startswith("pe-")]
    inventory["executableCount"] = len(executables)
    print(f"\n{len(inventory['expandedFiles'])} files expanded, "
          f"{len(executables)} PE executables queued for Ghidra")
    for row in executables:
        print(f"  queue {row['name']} ({row['size']} B, {row['kind']})")

    (root / "inventory.json").write_text(json.dumps(inventory, indent=2) + "\n")
    if not executables:
        raise SystemExit("no PE executable found in either archive — nothing to analyze")
    return 0


if __name__ == "__main__":
    sys.exit(main())
