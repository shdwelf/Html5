#!/usr/bin/env python3
"""hu_unlooper_static.py — wave-7 static pass over the HU unlooper artifacts.

Reproduces every lab-side fact the HUUNLOOPER case asserts, without executing
anything:
  1. verifies samples/hu-unlooper/MANIFEST.sha1 against the bytes on disk,
  2. walks both WinExplorer PEs (sections, entropy, imports, exports,
     entry-point disassembly) via pefile + capstone,
  3. censuses the nine .xvb scripts (lines, Sc/Wx/Fs API usage, Intel-HEX
     presence) and the Delphi/DCPcrypt/Winexplorer_tlb markers in the PEs.

Writes samples/hu-unlooper/analysis.json. Static only — nothing runs.

Requires: pip install pefile capstone   (no JVM, no Ghidra needed)
"""

import hashlib
import json
import math
import os
import re
import sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SAMPLES = os.path.join(ROOT, "samples", "hu-unlooper")


def sha1_of(path):
    h = hashlib.sha1()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def entropy(data):
    if not data:
        return 0.0
    n = len(data)
    return -sum(v / n * math.log2(v / n) for v in Counter(data).values())


def check_manifest():
    manifest = os.path.join(SAMPLES, "MANIFEST.sha1")
    ok, bad, rows = 0, [], []
    with open(manifest) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            digest, name = line.split(None, 1)
            name = name.lstrip("*")
            got = sha1_of(os.path.join(SAMPLES, name))
            match = got == digest
            ok += match
            if not match:
                bad.append(name)
            rows.append({"file": name, "expected": digest, "got": got, "match": match})
    return {"checked": len(rows), "ok": ok, "mismatches": bad, "rows": rows}


def pe_pass(path):
    import pefile  # noqa: PLC0415
    from capstone import CS_ARCH_X86, CS_MODE_32, Cs  # noqa: PLC0415

    raw = open(path, "rb").read()
    pe = pefile.PE(path)
    out = {
        "file": os.path.relpath(path, ROOT),
        "bytes": len(raw),
        "sha1": hashlib.sha1(raw).hexdigest(),
        "machine": hex(pe.FILE_HEADER.Machine),
        "timestamp": pe.FILE_HEADER.TimeDateStamp,
        "entry": hex(pe.OPTIONAL_HEADER.AddressOfEntryPoint),
        "imagebase": hex(pe.OPTIONAL_HEADER.ImageBase),
        "sections": [
            {
                "name": s.Name.decode(errors="replace").rstrip("\x00"),
                "vsize": s.Misc_VirtualSize,
                "raw": s.SizeOfRawData,
                "entropy": round(entropy(s.get_data()), 3),
            }
            for s in pe.sections
        ],
        "imports": {},
        "export_count": 0,
        "tlb": [],
        "dcp_units": [],
    }
    try:
        for d in pe.DIRECTORY_ENTRY_IMPORT:
            dll = d.dll.decode(errors="replace")
            out["imports"][dll] = [
                x.name.decode(errors="replace") if x.name else f"ord{x.ordinal}"
                for x in d.imports
            ]
    except AttributeError:
        pass
    try:
        exps = [x.name.decode(errors="replace") for x in pe.DIRECTORY_ENTRY_EXPORT.symbols if x.name]
        out["export_count"] = len(exps)
        out["tlb"] = sorted({e for e in exps if "Winexplorer_tlb" in e})
        out["dcp_units"] = sorted({m.group(0) for e in exps if (m := re.search(r"TDCP_\w+", e))})
    except AttributeError:
        pass
    ep = pe.OPTIONAL_HEADER.AddressOfEntryPoint
    img = pe.get_memory_mapped_image()
    md = Cs(CS_ARCH_X86, CS_MODE_32)
    out["entry_disasm"] = [
        {"addr": hex(i.address), "text": f"{i.mnemonic} {i.op_str}".strip()}
        for _, i in zip(range(20), md.disasm(bytes(img[ep : ep + 160]), pe.OPTIONAL_HEADER.ImageBase + ep))
    ]
    strs = set(re.findall(rb"[ -~]{8,}", raw))
    out["printable_runs"] = len(strs)
    out["markers"] = {
        key: sorted({s.decode() for s in strs if key.encode() in s})[:4]
        for key in ("Delphi", "DCP", "Winexplorer_tlb", "Copyright")
    }
    out["delphi_refs"] = sum(1 for s in strs if b"Delphi" in s)
    return out


def script_pass(path):
    raw = open(path, "rb").read()
    try:
        text = raw.decode("cp1252")
    except UnicodeDecodeError:
        text = raw.decode("cp1252", errors="replace")
    lines = text.splitlines()
    head = "\n".join(lines[:12])
    return {
        "file": os.path.basename(path),
        "bytes": len(raw),
        "sha1": hashlib.sha1(raw).hexdigest(),
        "lines": len(lines),
        "head": head[:600],
        "intel_hex_records": sum(1 for ln in lines if re.match(r"^:[0-9A-Fa-f]{8,}$", ln.strip())),
        "api": {
            "Sc.": len(re.findall(r"\bSc\.", text)),
            "Wx.": len(re.findall(r"\bWx\.", text)),
            "Fs.": len(re.findall(r"\bFs\.", text)),
        },
        "mentions_ul4s_magic": "55" in text and "4C" in text and "ChipVer" in text,
    }


def main():
    report = {"manifest": check_manifest(), "pe": [], "scripts": []}
    for exe in ("winexp46/WinExplorer.exe", "winexp50/WinExplorer.exe"):
        report["pe"].append(pe_pass(os.path.join(SAMPLES, exe)))
    for name in sorted(f for f in os.listdir(SAMPLES) if f.endswith(".xvb")):
        report["scripts"].append(script_pass(os.path.join(SAMPLES, name)))
    dest = os.path.join(SAMPLES, "analysis.json")
    with open(dest, "w") as f:
        json.dump(report, f, indent=2)
    fails = len(report["manifest"]["mismatches"])
    print(f"manifest: {report['manifest']['ok']}/{report['manifest']['checked']} match")
    print(f"pe: {len(report['pe'])} builds, scripts: {len(report['scripts'])}")
    print(f"wrote {os.path.relpath(dest, ROOT)}")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
