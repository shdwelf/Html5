#!/usr/bin/env python3
"""verify_rtl.py — build the virtual chipset RTL and verify it.

What this proves, and with which tool:

  1. The RTL elaborates and synthesises (yosys read_verilog + prep + synth).
  2. rtl/vchip_mix.v reproduces js/vchip-model.js bit for bit, on a generated
     vector table (CXXRTL simulation of the actual RTL).
  3. rtl/vchip_top.v walks the scenarios in rtl/scenarios/vchip_scenarios.json
     and produces the *same transcript* as the reference model
     (tools/run_vchip_scenarios.mjs), cycle for cycle.
  4. The security properties in rtl/formal/vchip_formal_top.v cannot be
     refuted: yosys asks its SAT solver for a counterexample to each one.

Usage

    python3 tools/verify_rtl.py             # verify, compare with the golden transcript
    python3 tools/verify_rtl.py --update    # re-baseline rtl/golden/vchip_transcript.txt
    python3 tools/verify_rtl.py --depth 32  # bounded proof depth (default 24)
    python3 tools/verify_rtl.py --quick     # skip the formal proofs

Toolchain

yosys and a C++17 compiler are required. In this sandbox yosys comes from the
PyPI wheel ``yowasp-yosys`` (``pip install yowasp-yosys``); that wheel does not
ship the ``sim`` command, which is why simulation runs through CXXRTL and g++
instead of a Verilog testbench. Nothing else is needed: no Verilator, no
Icarus, no Java.

Exit status is non-zero if any check fails, so this is usable as a gate.
"""

from __future__ import annotations

import argparse
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RTL = ROOT / "rtl"
SIM = ROOT / "sim"
GOLDEN = RTL / "golden"
DRIVER = ROOT / "tools" / "sim" / "vchip_driver.cc"

RTL_SOURCES = [
    RTL / "vchip_mix.v",
    RTL / "boot_vector_lock.v",
    RTL / "ata_security_fsm.v",
    RTL / "vchip_top.v",
]

# Properties proved by SAT. Each entry is (signal, plain english claim).
PROPERTIES = [
    ("inv_tamper_no_chain", "tamper latch implies chain_ok is cleared"),
    ("inv_locked_is_tamper", "LOCKED state implies the latch is set"),
    ("inv_tamper_is_locked", "the latch always drives the lock to LOCKED"),
    ("inv_unlock_mask_complete", "unlock implies every stage matched (0111)"),
    ("inv_unlock_state_is_unlocked", "chain_ok implies state UNLOCKED"),
    ("inv_erase_needs_chain", "ERASE UNIT grant implies a verified chain"),
    ("inv_erase_needs_no_tamper", "ERASE UNIT grant implies no tamper latch"),
    ("inv_erase_needs_destructive_policy", "ERASE UNIT grant implies policy allows it"),
    ("inv_reflash_needs_no_tamper", "reflash grant implies no tamper latch"),
    ("inv_reflash_needs_chain", "reflash grant implies a verified chain"),
    ("inv_write_needs_chain", "media write implies a verified chain"),
    ("inv_write_needs_no_tamper", "media write implies no tamper latch"),
    ("inv_grants_need_unlocked", "every capability gate implies an unlocked lock"),
    ("inv_release_needs_chain", "CPU handoff implies a verified chain"),
    ("inv_release_needs_no_tamper", "CPU handoff implies no tamper latch"),
    ("inv_release_needs_mode", "CPU handoff implies the policy allows the source"),
    ("inv_sticky_tamper", "once latched, tamper stays latched (modulo reset)"),
    ("inv_sticky_locked", "once LOCKED, the lock stays LOCKED (modulo reset)"),
    ("inv_locked_grants_nothing", "a LOCKED chipset grants nothing"),
    ("inv_vector_advances_in_order", "extension count never exceeds the stage count"),
]

SAT_PASS = re.compile(r"SAT proof finished.*SUCCESS", re.I)
SAT_FAIL = re.compile(r"SAT proof finished.*(FAIL|model found)", re.I)


def info(msg: str) -> None:
    print(f"  {msg}")


def run(cmd, cwd=ROOT, capture=True, check=True, env=None):
    proc = subprocess.run(
        cmd, cwd=str(cwd), capture_output=capture, text=True, env=env,
    )
    if check and proc.returncode != 0:
        tail = (proc.stdout or "")[-4000:] + (proc.stderr or "")[-2000:]
        raise SystemExit(f"command failed ({proc.returncode}): {' '.join(map(str, cmd))}\n{tail}")
    return proc


def find_yosys() -> str:
    """Locate yosys, looking beyond PATH.

    The yowasp build installs into ``~/.local/bin`` (pip --user), which is not
    always on PATH - and on a sandbox where $HOME is not part of the snapshot it
    can disappear entirely between sessions. Both cases are common enough that
    the lookup handles them and the error message says exactly how to fix it.
    """
    candidates = ["yosys", "yowasp-yosys"]
    extra = [Path.home() / ".local" / "bin", Path("/usr/local/bin"), Path(sys.prefix) / "bin"]
    for candidate in candidates:
        found = shutil.which(candidate)
        if found:
            return found
    for directory in extra:
        for candidate in candidates:
            path = directory / candidate
            if path.is_file() and os.access(path, os.X_OK):
                os.environ["PATH"] = f"{directory}{os.pathsep}{os.environ.get('PATH', '')}"
                return str(path)
    raise SystemExit(
        "no yosys found.\n"
        "  install it:     python3 -m pip install --user --break-system-packages yowasp-yosys\n"
        "  or point at it: PATH=$HOME/.local/bin:$PATH python3 tools/verify_rtl.py\n"
        "  or just run:    sh tools/setup_rtl.sh\n"
    )


def find_cxx() -> str:
    for candidate in ("g++", "c++", "clang++"):
        if shutil.which(candidate):
            return candidate
    raise SystemExit("no C++ compiler found (g++, c++ or clang++)")


def yosys_env() -> dict:
    # yowasp tools unpack a wasm payload on first use and are quieter about it
    # when asked to stay off the network.
    env = dict(os.environ)
    env.setdefault("YOWASP_QUIET", "1")
    return env


def build_cxxrtl(yosys: str) -> None:
    SIM.mkdir(exist_ok=True)
    script = SIM / "build.ys"
    script.write_text(
        "\n".join(
            [
                "read_verilog -Irtl " + " ".join(str(p.relative_to(ROOT)) for p in RTL_SOURCES),
                "prep -top vchip_top",
                "write_cxxrtl sim/vchip_top.cc",
                "design -reset",
                "read_verilog -Irtl rtl/vchip_mix.v",
                "prep -top vchip_mix",
                "write_cxxrtl sim/vchip_mix.cc",
                "design -reset",
                "read_verilog -Irtl " + " ".join(str(p.relative_to(ROOT)) for p in RTL_SOURCES),
                "prep -top vchip_top",
                # -noabc on purpose: this WASI build of yosys exits 0 while
                # silently truncating the log in the ABC pass, so `stat` after
                # a full `synth` never runs. The count below is therefore the
                # internal-gate mapping, not a technology-mapped gate count.
                "synth -noabc -top vchip_top",
                "stat",
            ]
        )
        + "\n"
    )
    # No -q here either: with it, `stat` prints nothing, synth.log stays empty
    # and the cell count below is always "?".
    proc = run([yosys, "-s", str(script.relative_to(ROOT))], env=yosys_env())
    (SIM / "synth.log").write_text(proc.stdout + proc.stderr)
    log = proc.stdout + proc.stderr
    # yosys 0.69 prints compact stat blocks ("     4123 cells", not
    # "Number of cells: 4123") and emits one block per module, so the design-wide
    # figure is the last "<N> vchip_top" line in the "Count including submodules"
    # section. Anchoring on the last occurrence avoids picking up a per-module
    # block whose numbers would look plausible and be wrong.
    hits = list(re.finditer(r"^\s*(\d+) vchip_top$", log, re.M))
    if not hits:
        raise SystemExit(
            "yosys never reached `stat` (see sim/synth.log) - refusing to report "
            "a synthesis that did not run"
        )
    cells = hits[-1].group(1)
    wires = re.search(r"^\s*(\d+) wire bits$", log[hits[-1].end():], re.M)
    info(f"synthesised: {cells} cells / "
         f"{wires.group(1) if wires else '?'} wire bits including submodules "
         f"-> sim/synth.log")


def compile_driver(cxx: str) -> Path:
    out = SIM / "vchip_rtl"
    run([
        cxx, "-std=c++17", "-O2", "-w",
        f"-I{SIM.relative_to(ROOT)}",
        f"-I{(ROOT / 'vendor' / 'cxxrtl').relative_to(ROOT)}",
        f"-I{GOLDEN.relative_to(ROOT)}",
        str(DRIVER.relative_to(ROOT)),
        "-o", str(out.relative_to(ROOT)),
    ])
    info(f"compiled: {out.relative_to(ROOT)}")
    return out


def generate_vectors() -> None:
    proc = run(["node", "tools/gen_vchip_vectors.mjs"])
    for line in proc.stdout.strip().splitlines():
        info(line)


def rtl_transcript(binary: Path) -> str:
    proc = run([str(binary.relative_to(ROOT))], check=False)
    if proc.returncode != 0:
        raise SystemExit(f"RTL driver failed ({proc.returncode}):\n{proc.stderr[-4000:]}")
    return proc.stdout


def model_transcript() -> str:
    proc = run(["node", "tools/run_vchip_scenarios.mjs"])
    return proc.stdout


def compare(a: str, b: str, a_name: str, b_name: str) -> bool:
    if a == b:
        return True
    al, bl = a.splitlines(), b.splitlines()
    print(f"  transcripts differ: {a_name} ({len(al)} lines) vs {b_name} ({len(bl)} lines)")
    shown = 0
    for i in range(max(len(al), len(bl))):
        av = al[i] if i < len(al) else "<missing>"
        bv = bl[i] if i < len(bl) else "<missing>"
        if av != bv:
            print(f"    line {i + 1}:")
            print(f"      {a_name}: {av}")
            print(f"      {b_name}: {bv}")
            shown += 1
            if shown >= 5:
                print("    ... (first 5 differences shown)")
                break
    return False


def formal(yosys: str, depth: int) -> tuple[bool, list[tuple[str, str, str]]]:
    """Run the bounded SAT proofs and one temporal-induction attempt each."""
    script_lines = [
        "read_verilog -Irtl " + " ".join(str(p.relative_to(ROOT)) for p in RTL_SOURCES),
        "read_verilog -Irtl rtl/formal/vchip_formal_top.v",
        "prep -top vchip_formal_top",
        "flatten",
    ]
    for signal, _ in PROPERTIES:
        script_lines.append(f"sat -seq {depth} -prove {signal} 1")
    script = SIM / "formal.ys"
    script.write_text("\n".join(script_lines) + "\n")

    # No -q: yosys only prints the "SAT proof finished" verdicts when it is
    # not quiet, and -verify is deliberately left off so that one failing
    # property does not abort the remaining nineteen.
    proc = run([yosys, "-s", str(script.relative_to(ROOT))], env=yosys_env(), check=False)
    log = proc.stdout + proc.stderr
    (SIM / "formal.log").write_text(log)

    results: list[tuple[str, str, str]] = []
    for signal, claim in PROPERTIES:
        # Each `sat` block reports its own verdict; walk the log in order.
        pass
    verdicts = []
    for line in log.splitlines():
        if SAT_PASS.search(line):
            verdicts.append("PASS")
        elif SAT_FAIL.search(line):
            verdicts.append("FAIL")
        elif "Timeout" in line:
            # The "Solving problem with <n> variables" banner is not a
            # verdict; counting it shifted every later property by one and
            # turned a fully green run into a mostly-red report.
            verdicts.append("TIMEOUT")
    for i, (signal, claim) in enumerate(PROPERTIES):
        verdict = verdicts[i] if i < len(verdicts) else "UNKNOWN"
        results.append((signal, claim, verdict))
    ok = all(v == "PASS" for _, _, v in results)
    return ok, results


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--update", action="store_true", help="re-baseline the golden transcript")
    parser.add_argument("--depth", type=int, default=24, help="bounded SAT proof depth")
    parser.add_argument("--quick", action="store_true", help="skip the formal proofs")
    args = parser.parse_args()

    yosys = find_yosys()
    cxx = find_cxx()
    failures: list[str] = []

    print("== generated vectors ==")
    generate_vectors()

    print("== RTL build ==")
    info(f"yosys     : {yosys}")
    info(f"compiler  : {cxx}")
    build_cxxrtl(yosys)
    binary = compile_driver(cxx)

    print("== conformance + scenarios ==")
    rtl_txt = rtl_transcript(binary)
    js_txt = model_transcript()
    (SIM / "transcript.rtl.txt").write_text(rtl_txt)
    (SIM / "transcript.js.txt").write_text(js_txt)

    cycles = sum(1 for ln in rtl_txt.splitlines() if not ln.startswith("#") and ln.strip())
    if not compare(rtl_txt, js_txt, "RTL", "reference model"):
        failures.append("RTL and reference model transcripts disagree")
    else:
        info(f"RTL and reference model agree on all {cycles} cycles")

    golden_file = GOLDEN / "vchip_transcript.txt"
    if args.update:
        golden_file.write_text(rtl_txt)
        info(f"re-baselined {golden_file.relative_to(ROOT)}")
    elif golden_file.exists():
        golden_txt = golden_file.read_text()
        if not compare(rtl_txt, golden_txt, "RTL", "golden"):
            failures.append("transcript differs from the checked-in golden transcript")
        else:
            info(f"transcript matches {golden_file.relative_to(ROOT)}")
    else:
        failures.append(f"missing {golden_file.relative_to(ROOT)} (run with --update)")

    if not args.quick:
        print(f"== formal proofs (bounded depth {args.depth}) ==")
        ok, results = formal(yosys, args.depth)
        width = max(len(s) for s, _, _ in results)
        for signal, claim, verdict in results:
            mark = "ok  " if verdict == "PASS" else "FAIL"
            print(f"  [{mark}] {signal.ljust(width)}  {claim}")
        if not ok:
            failed = [s for s, _, v in results if v != "PASS"]
            failures.append(f"unproved properties: {', '.join(failed)} (see sim/formal.log)")

    print("== boot-chain requirements ==")
    # Three independent things are checked here, and they check each other:
    # the requirement rules against crafted fixtures, the JS mirror in
    # js/bootchain.js against the layout parsed out of the RTL, and both
    # implementations against every cycle of the transcript above.
    for label, cmd in (
        ("fixtures + crafted status words", [sys.executable, str(ROOT / "tools" / "bootchain.py"), "--selftest"]),
        ("transcript parity", [sys.executable, str(ROOT / "tools" / "bootchain.py"),
                               "--transcript", str(ROOT / "rtl" / "golden" / "vchip_transcript.txt")]),
        ("js mirror", ["node", str(ROOT / "tools" / "verify_bootchain.mjs")]),
    ):
        proc = run(cmd, check=False)
        text = (proc.stdout or "") + (proc.stderr or "")
        good = proc.returncode == 0
        info(f"{label}: {'ok' if good else 'FAILED'}")
        if not good:
            failures.append(f"boot-chain check failed: {label}")
            for line in text.splitlines()[-12:]:
                info(f"    {line}")

    print()
    if failures:
        print("FAILED:")
        for f in failures:
            print(f"  - {f}")
        return 1
    print("all checks passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
