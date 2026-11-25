#!/usr/bin/env python3
"""Emit Xena-style preservation wrappers (NAA binary-object 1.0) for the Sneakers press kit.

Xena (National Archives of Australia, srnsw/xena, GPL) normalises files it has no
specific normaliser for with BinaryToXenaBinaryNormaliser: the bytes are Base64
encoded inside a ``binary-object:binary-object`` element and wrapped in the
``Default Package Wrapper`` metadata envelope.  The archive software is Java/Ant
and is not built here; this module reproduces the *file format* byte-for-byte
in spirit (same element names, namespace, wrapper name, normaliser class name,
``NAME_Binary.xena`` naming) so the pinned press-kit bytes travel in a format a
Xena viewer or any XML+Base64 tool can open.  Format references were read from
the 2011-06-29 master of srnsw/xena:

  kernel/metadatawrapper/DefaultWrapper.java          (meta_data element names)
  kernel/normalise/BinaryToXenaBinaryNormaliser.java  (binary-object element, 76-col base64)
  plugins/basic/doc/xena/plugin/basic/binary_schema.html (NAA binary-object schema 1.0)
  plugins/example/example_file1.foo_Binary.xena       (sample output)

Usage
-----
  python3 tools/xena_binary_archive.py wrap  <file> [...] --out DIR [--source-uri-prefix file:/]
  python3 tools/xena_binary_archive.py unwrap <file.xena> [...] --out DIR
  python3 tools/xena_binary_archive.py sneakers --out DIR
        # wraps the pinned Sneakers_Promotional_Diskette.zip, its two EXEs and
        # every decoded GRASP library member (via tools/grasp_gl_cipher.py)
  python3 tools/xena_binary_archive.py verify DIR
        # re-decodes every .xena in DIR and prints name, length, sha256

Nothing is executed; the DOS executables are treated as opaque bytes.
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import io
import json
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

WRAPPER_NAME = "Default Package Wrapper"
NORMALISER = "au.gov.naa.digipres.xena.kernel.normalise.BinaryToXenaBinaryNormaliser"
BINARY_NS = "http://preservation.naa.gov.au/binary-object/1.0"
BINARY_PREFIX = "binary-object"
DESCRIPTION = ("The following data is a MIME-compliant (RFC 2045) PEM base64 (RFC 1421) "
               "representation of the original file contents.")
XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>\n'

ROOT = Path(__file__).resolve().parents[1]
SNEAKERS_ZIP = ROOT / "webxdc-sneakers-exact" / "source" / "Sneakers_Promotional_Diskette.zip"


def _esc(s: str) -> str:
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;"))


def wrap_bytes(name: str, data: bytes, *, source_uri_prefix: str = "file:/", extra_meta: dict | None = None) -> str:
    """Return the text of a NAME_Binary.xena document for ``data``."""
    b64 = base64.encodebytes(data).decode("ascii")  # 76-column lines, trailing newline (RFC 2045 style)
    meta = [
        f"<meta_data_wrapper_name>{_esc(WRAPPER_NAME)}</meta_data_wrapper_name>",
        f"<normaliser_name>{_esc(NORMALISER)}</normaliser_name>",
        f"<input_source_uri>{_esc(source_uri_prefix + name)}</input_source_uri>",
    ]
    if extra_meta:
        # Xena's default wrapper carries exactly the three elements above; the
        # extra provenance is kept in a clearly separate element so a Xena
        # viewer still sees a conformant package.
        items = "".join(f"<{k}>{_esc(str(v))}</{k}>" for k, v in extra_meta.items())
        meta.append(f"<html5_provenance>{items}</html5_provenance>")
    return (
        XML_HEADER
        + "<xena>"
        + "<meta_data>" + "".join(meta) + "</meta_data>"
        + "<content>"
        + f'<{BINARY_PREFIX}:{BINARY_PREFIX} xmlns:{BINARY_PREFIX}="{BINARY_NS}" '
        + f'{BINARY_PREFIX}:description="{_esc(DESCRIPTION)}">\n'
        + b64
        + f"</{BINARY_PREFIX}:{BINARY_PREFIX}>"
        + "</content>"
        + "</xena>\n"
    )


def unwrap_text(xml_text: str) -> tuple[dict, bytes]:
    """Parse a .xena document; return (metadata dict, original bytes)."""
    root = ET.fromstring(xml_text)
    if root.tag != "xena":
        raise ValueError(f"not a xena document (root <{root.tag}>)")
    meta = {child.tag: (child.text or "") for child in root.find("meta_data") or []}
    body = root.find("content").find(f"{{{BINARY_NS}}}{BINARY_PREFIX}")
    if body is None:
        raise ValueError("no binary-object content")
    return meta, base64.b64decode("".join((body.text or "").split()), validate=True)


def xena_name(name: str) -> str:
    return f"{name}_Binary.xena"


def write_wrapped(out: Path, name: str, data: bytes, **kw) -> dict:
    out.mkdir(parents=True, exist_ok=True)
    text = wrap_bytes(name, data, **kw)
    target = out / xena_name(name)
    target.write_text(text, encoding="utf-8")
    return {
        "name": name,
        "xena_file": target.name,
        "length": len(data),
        "sha256": hashlib.sha256(data).hexdigest(),
        "xena_sha256": hashlib.sha256(text.encode("utf-8")).hexdigest(),
    }


def cmd_wrap(args) -> int:
    rows = [write_wrapped(Path(args.out), Path(f).name, Path(f).read_bytes(), source_uri_prefix=args.source_uri_prefix)
            for f in args.files]
    print(json.dumps(rows, indent=2))
    return 0


def cmd_unwrap(args) -> int:
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    for f in args.files:
        meta, data = unwrap_text(Path(f).read_text(encoding="utf-8"))
        name = meta.get("input_source_uri", Path(f).name).rsplit("/", 1)[-1] or Path(f).stem
        (out / name).write_bytes(data)
        print(f"{name}\t{len(data)}\t{hashlib.sha256(data).hexdigest()}")
    return 0


def cmd_verify(args) -> int:
    bad = 0
    for f in sorted(Path(args.dir).glob("*.xena")):
        try:
            meta, data = unwrap_text(f.read_text(encoding="utf-8"))
        except Exception as exc:  # noqa: BLE001 — report and continue
            print(f"{f.name}\tERROR\t{exc}")
            bad += 1
            continue
        print(f"{f.name}\t{meta.get('normaliser_name','?').rsplit('.',1)[-1]}\t{len(data)}\t{hashlib.sha256(data).hexdigest()}")
    return 1 if bad else 0


def cmd_sneakers(args) -> int:
    sys.path.insert(0, str(ROOT / "tools"))
    import grasp_gl_cipher as g  # local tool, same directory

    out = Path(args.out)
    zip_bytes = SNEAKERS_ZIP.read_bytes()
    rows = []
    prov = {"collection": "Universal Pictures Sneakers computer press kit (1992), GRASPRT 4.00d",
            "method": "static bytes only; nothing executed", "generated_by": "tools/xena_binary_archive.py"}
    rows.append(write_wrapped(out, SNEAKERS_ZIP.name, zip_bytes, extra_meta=prov))
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as z:
        for member in ("SNEAKERS.EXE", "SNEAK.EXE"):
            rows.append(write_wrapped(out / "exe", member, z.read(member),
                                      source_uri_prefix=f"zip:{SNEAKERS_ZIP.name}!/",
                                      extra_meta={**prov, "container": SNEAKERS_ZIP.name}))
        exe = z.read("SNEAKERS.EXE")
    tmp = out / ".SNEAKERS.EXE.tmp"
    tmp.write_bytes(exe)
    try:
        lib = g.parse_library(tmp)
    finally:
        tmp.unlink()
    for m in lib.members:
        data = lib.member_bytes(m)
        rows.append(write_wrapped(out / "gl", m.name, data,
                                  source_uri_prefix="grasp-gl:SNEAKERS.EXE!/",
                                  extra_meta={**prov, "container": "SNEAKERS.EXE GRASP GL library @121997",
                                              "gl_offset": m.offset, "gl_key_word": f"0x{lib.key_word:04x}",
                                              "cipher": "GRASPRT 4.00d byte permutation (xorshift31 seeded key*0x7cf7)"}))
    manifest = {"generator": "tools/xena_binary_archive.py sneakers", "wrapper": WRAPPER_NAME, "normaliser": NORMALISER,
                "binary_object_namespace": BINARY_NS, "entries": rows}
    (out / "MANIFEST.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    agg = hashlib.sha256("".join(f"{r['name']}:{r['sha256']}\n" for r in rows).encode()).hexdigest()
    print(f"wrote {len(rows)} .xena packages under {out} · aggregate sha256 {agg}")
    return 0


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    w = sub.add_parser("wrap"); w.add_argument("files", nargs="+"); w.add_argument("--out", required=True)
    w.add_argument("--source-uri-prefix", default="file:/"); w.set_defaults(fn=cmd_wrap)
    u = sub.add_parser("unwrap"); u.add_argument("files", nargs="+"); u.add_argument("--out", required=True); u.set_defaults(fn=cmd_unwrap)
    v = sub.add_parser("verify"); v.add_argument("dir"); v.set_defaults(fn=cmd_verify)
    s = sub.add_parser("sneakers"); s.add_argument("--out", required=True); s.set_defaults(fn=cmd_sneakers)
    args = ap.parse_args(argv)
    return args.fn(args)


if __name__ == "__main__":
    raise SystemExit(main())
