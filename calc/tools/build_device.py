#!/usr/bin/env python3
"""Build one calculator target end to end: core + platform layer + container.

    python3 calc/tools/build_device.py --device ti83
    python3 calc/tools/build_device.py --all
    python3 calc/tools/build_device.py --all --strict     # fail if a toolchain is missing

Toolchains (none of them are vendored here):

    Z80  (TI-83, TI-85, TI-90)  sdcc      https://sdcc.sourceforge.net/
          plus the matching include file: ti83plus.inc / ti85.inc next to the .asm
    68k  (TI-89, TI-92)         tigcc or gcc4ti
                                http://tigcc.ticalc.org/  https://debrouxl.github.io/gcc4ti/

A missing toolchain is reported and skipped (exit 0) so `make -C calc all`
always produces what it can, unless --strict is given.
"""
import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CORE_C = ["core/tables.c", "core/util.c", "core/fb.c", "core/keys.c", "core/grid.c", "core/app.c"]

INSTALL = {
    "sdcc": "apt install sdcc / brew install sdcc — then put ti83plus.inc (TI-83+ SDK) in calc/plat/ti83/",
    "tigcc": "install TIGCC or GCC4TI (http://tigcc.ticalc.org/)",
}

SPECS = {
    "ti83": {
        "toolchain": "sdcc",
        "asm": ["plat/ti83/crt0.asm", "plat/ti83/lcd.asm"],
        "main": "plat/ti83/main.c",
        "org": "0x9D95",
        "pack": True,
    },
    "ti90": {
        "toolchain": "sdcc",
        "asm": ["plat/ti83/crt0.asm", "plat/ti83/lcd.asm"],
        "main": "plat/ti90/main.c",
        "org": "0x9D95",
        "pack": True,
    },
    "ti85": {
        "toolchain": "sdcc",
        "asm": ["plat/ti83/crt0.asm", "plat/ti85/lcd.asm"],
        "main": "plat/ti85/main.c",
        "org": "0x8E29",       # ZShell program base — override with SITEK_TI85_ORG
        "pack": True,
    },
    "ti89": {"toolchain": "tigcc", "main": "plat/ti89/main.c", "pack": False},
    "ti92": {"toolchain": "tigcc", "main": "plat/ti92/main.c", "pack": False},
}


def load_devices():
    data = json.loads((ROOT / "devices.json").read_text())
    return {d["id"]: d for d in data["devices"]}


def run(cmd, cwd=ROOT):
    printable = " ".join(cmd)
    print("  $ %s" % printable)
    proc = subprocess.run(cmd, cwd=str(cwd), capture_output=True, text=True)
    if proc.stdout.strip():
        print("      " + proc.stdout.strip().replace("\n", "\n      "))
    if proc.returncode != 0:
        if proc.stderr.strip():
            print("      " + proc.stderr.strip().replace("\n", "\n      "))
        raise SystemExit("command failed: %s" % printable)
    return proc


def build(dev_id, dev, strict=False):
    spec = SPECS.get(dev_id)
    if not spec:
        print("  skip %-5s no build spec" % dev_id)
        return None
    tool = spec["toolchain"]
    if not shutil.which(tool):
        msg = "  skip %-5s %s not found — %s" % (dev_id, tool, INSTALL[tool])
        if strict:
            raise SystemExit(msg)
        print(msg)
        return None

    out = ROOT / "build" / dev_id
    out.mkdir(parents=True, exist_ok=True)
    print("build %s (%s, %s, %dx%d)" % (dev_id, dev["cpu"], tool, dev["lcd"][0], dev["lcd"][1]))

    if tool == "sdcc":
        rels = []
        for src in spec["asm"]:
            rel = out / (Path(src).stem + ".rel")
            run(["sdasz80", "-p", "-g", "-o", str(rel), src])
            rels.append(str(rel))
        ihx = out / ("sitek.ihx")
        binf = out / ("sitek.bin")
        org = spec["org"]
        if dev_id == "ti85":
            org = subprocess.os.environ.get("SITEK_TI85_ORG", org)
        cmd = ["sdcc", "-mz80", "--no-std-crt0", "--code-loc", org, "--data-loc", "0",
               "-Icore", "-o", str(ihx)] + rels + CORE_C + [spec["main"]]
        run(cmd)
        run(["sdobjcopy", "-I", "ihex", "-O", "binary", str(ihx), str(binf)])
        payload = binf
    else:
        payload = None

    if spec["pack"]:
        target = ROOT / "build" / ("sitek-%s.%s" % (dev_id, dev["ext"]))
        run([sys.executable, "tools/ti_pack.py", "pack", "--device", dev_id,
             "--input", str(payload), "--out", str(target), "--hexdump"])
        return target

    target = ROOT / "build" / ("sitek-%s.%s" % (dev_id, dev["ext"]))
    run(["tigcc", "-O2", "-Wall", "-Icore", "-o", str(target), spec["main"]] + CORE_C)
    return target


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--device", help="device id from devices.json")
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--strict", action="store_true", help="fail instead of skipping")
    args = ap.parse_args(argv)
    devices = load_devices()
    ids = list(devices) if args.all else [args.device]
    built = []
    for dev_id in ids:
        target = build(dev_id, devices[dev_id], args.strict)
        if target:
            built.append(str(target))
    if built:
        print("\nbuilt:")
        for b in built:
            print("  %s" % b)
    else:
        print("\nnothing built — install sdcc (Z80) and/or tigcc (68k) to produce binaries.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
