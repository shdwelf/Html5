#!/usr/bin/env python3
"""Differential test: the transpiled core must behave exactly like the C core.

For every device we run `<port>-host dump <dev>` (the gcc build of the C core)
and `node <port>/tools/js_dump.mjs` (the c2js build of those very same C
sources) and require byte-identical output: every scalar the dump prints and
every rendered framebuffer hash.

    python3 calc/tools/difftest.py                       # the SITE-K port
    python3 calc/tools/difftest.py --host socal-calc/build/socal-host \
        --core socal-calc/build/socal-core.mjs --devices ti83,ti89,ti92 \
        --jsdump socal-calc/tools/js_dump.mjs            # the SOCAL port
"""
import argparse
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEVICES = ["ti83", "ti85", "ti89", "ti90", "ti92", "host"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--host", default=str(ROOT / "build" / "sitek-host"))
    ap.add_argument("--core", default=str(ROOT / "build" / "calc-core.mjs"))
    ap.add_argument("--verbose", action="store_true")
    ap.add_argument("--devices", default=",".join(DEVICES),
                    help="comma separated device ids to diff")
    ap.add_argument("--jsdump", default=str(ROOT / "tools" / "js_dump.mjs"),
                    help="node mirror of the host dump command")
    args = ap.parse_args()
    devices = [d for d in args.devices.replace(",", " ").split() if d]

    if not Path(args.host).exists():
        print("missing host binary: %s (run make -C calc host)" % args.host)
        return 2
    if not Path(args.core).exists():
        print("missing transpiled core: %s (run make -C calc web)" % args.core)
        return 2

    failures = 0
    for dev in devices:
        c = subprocess.run([args.host, "dump", dev], capture_output=True, text=True, check=True).stdout
        j = subprocess.run(["node", args.jsdump, args.core, dev],
                           capture_output=True, text=True)
        if j.returncode != 0:
            print("  FAIL %-5s node exited %d\n%s" % (dev, j.returncode, j.stderr.strip()))
            failures += 1
            continue
        if c.strip() == j.stdout.strip():
            lines = c.strip().splitlines()
            print("  ok   %-5s %2d lines identical (every scalar and every frame hash)" % (dev, len(lines)))
            if args.verbose:
                for line in lines:
                    print("         %s" % line)
        else:
            failures += 1
            print("  FAIL %-5s C and JS output differ" % dev)
            cl, jl = c.strip().splitlines(), j.stdout.strip().splitlines()
            for i in range(max(len(cl), len(jl))):
                a = cl[i] if i < len(cl) else "<missing>"
                b = jl[i] if i < len(jl) else "<missing>"
                if a != b:
                    print("         C : %s" % a)
                    print("         JS: %s" % b)
    print("%d devices, %d failures" % (len(devices), failures))
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
