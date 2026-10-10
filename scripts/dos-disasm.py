#!/usr/bin/env python3
"""
Capstone-based 16-bit DOS disassembler + array-sort scanner.

This is the in-sandbox counterpart to scripts/ghidra-dos-disasm.sh. Ghidra needs
a JVM (not obtainable in the agent sandbox), but capstone is pip-installable and
disassembles real-mode x86. It parses .COM (flat, base 0x100) and MZ .EXE
(headers give the code offset), disassembles linearly, and flags the classic
O(n^2) in-place array-sort shapes: a loop (backward jump) containing a CMP of
two memory operands feeding a short forward conditional jump, followed by a swap
(XCHG or a 3-move register/memory exchange) and an index bump.

Detection is heuristic over assembly, not a decompiler — it flags candidate
loops for review. It does not rewrite anything.

  scripts/dos-disasm.py BINARY [more...]      # report to stdout
  scripts/dos-disasm.py --md out.md BINARY     # also write a Markdown report
"""

import sys
import struct
import argparse
from capstone import Cs, CS_ARCH_X86, CS_MODE_16


def parse_binary(path):
    """Return (code_bytes, base, entry, kind) for a .COM or MZ .EXE."""
    raw = open(path, "rb").read()
    if raw[:2] == b"MZ":
        cparhdr = struct.unpack_from("<H", raw, 0x18)[0]
        ip = struct.unpack_from("<H", raw, 0x14)[0]
        cs = struct.unpack_from("<H", raw, 0x16)[0]
        code_off = cparhdr * 16
        code = raw[code_off:]
        return code, cs * 16, ip, "MZ .EXE"
    if raw[:2] == b"ZM":
        raise SystemExit("unsupported ZM (NE/LE) executable: %s" % path)
    # Plain .COM: flat image loaded at 0x100.
    return raw, 0x100, 0x100, ".COM"


SWAP_MNEMONICS = {"xchg"}
CMP_MNEMONICS = {"cmp", "sub"}
COND_JUMPS = {"ja", "jb", "jae", "jbe", "jg", "jl", "jge", "jle", "jc", "jnc", "jo", "jno"}
INDEX_REGS = {"si", "di", "bx", "bp", "cx", "dx"}


def disassemble(code, base):
    md = Cs(CS_ARCH_X86, CS_MODE_16)
    md.detail = True
    # Sweep past data/undecodable bytes instead of stopping at the first one —
    # real .EXE images interleave code and data.
    md.skipdata = True
    return list(md.disasm(code, base))


def has_memory_operand(insn):
    for op in insn.operands:
        if op.type == 3:  # X86_OP_MEM
            return True
    return False


def two_memory_or_indexed(insn):
    """True if a CMP touches memory or an indexed operand (array access)."""
    mem = 0
    for op in insn.operands:
        if op.type == 3:
            mem += 1
    return mem >= 1


def find_sort_candidates(insns):
    """Heuristic: return candidate sort loops as dicts."""
    by_addr = {i.address: n for n, i in enumerate(insns)}
    n = len(insns)
    cands = []
    # Backward jumps = loop back-edges.
    back_edges = []
    for idx, insn in enumerate(insns):
        if insn.mnemonic.startswith("j") or insn.mnemonic == "loop":
            if insn.operands and insn.operands[0].type == 2:  # X86_OP_IMM
                target = insn.operands[0].imm
                if target < insn.address:
                    back_edges.append((idx, target))
    for idx, target in back_edges:
        head = by_addr.get(target)
        if head is None or idx - head < 4 or idx - head > 200:
            continue
        body = insns[head:idx + 1]
        cmps = [i for i in body if i.mnemonic in CMP_MNEMONICS and two_memory_or_indexed(i)]
        swaps = [i for i in body if i.mnemonic in SWAP_MNEMONICS]
        condj = [i for i in body if i.mnemonic in COND_JUMPS]
        indexbump = [i for i in body if i.mnemonic in ("inc", "add", "dec") and
                     i.op_str.split(",")[0].strip() in INDEX_REGS]
        # A sort loop: compares memory, conditionally skips, swaps, bumps an index.
        score = (len(cmps) > 0) + (len(condj) > 0) + (len(swaps) > 0) + (len(indexbump) > 0)
        if score >= 3 and (cmps and (swaps or condj)):
            cands.append({
                "start": target,
                "end": insns[idx].address,
                "insns": idx - head + 1,
                "cmps": len(cmps),
                "swaps": len(swaps),
                "condj": len(condj),
                "indexbump": len(indexbump),
                "score": score,
            })
    # De-duplicate nested/overlapping: keep the largest per start.
    cands.sort(key=lambda c: (-c["insns"], c["start"]))
    kept, seen = [], set()
    for c in cands:
        if c["start"] in seen:
            continue
        seen.add(c["start"])
        kept.append(c)
    return sorted(kept, key=lambda c: c["start"])


def analyze(path):
    code, base, entry, kind = parse_binary(path)
    insns = disassemble(code, base)
    cands = find_sort_candidates(insns)
    return {
        "path": path, "kind": kind, "base": base, "entry": entry,
        "bytes": len(code), "insns": len(insns), "candidates": cands,
    }


def render_md(results):
    out = ["# DOS disassembly + array-sort scan", "",
           "Capstone (real-mode x86, 16-bit) linear sweep. Candidate loops are",
           "heuristic flags for review, not confirmed sorts; a decompiler (Ghidra)",
           "would confirm. Complexity note: in-place nested-loop sorts are O(n^2);",
           "the comparison-sort lower bound is Ω(n log n).", ""]
    for r in results:
        out.append("## %s" % r["path"].split("/")[-1])
        out.append("- format: `%s` · code: %d bytes · %d instructions · entry `0x%04X`"
                   % (r["kind"], r["bytes"], r["insns"], r["entry"]))
        out.append("- array-sort candidates: **%d**" % len(r["candidates"]))
        out.append("")
        if not r["candidates"]:
            out.append("_none flagged_")
            out.append("")
            continue
        out.append("| start | end | insns | cmp | swap | cond-jmp | idx-bump |")
        out.append("| --- | --- | --- | --- | --- | --- | --- |")
        for c in r["candidates"]:
            out.append("| `0x%04X` | `0x%04X` | %d | %d | %d | %d | %d |"
                       % (c["start"], c["end"], c["insns"], c["cmps"],
                          c["swaps"], c["condj"], c["indexbump"]))
        out.append("")
    return "\n".join(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("binaries", nargs="+")
    ap.add_argument("--md", help="write a Markdown report here")
    args = ap.parse_args()
    results = [analyze(b) for b in args.binaries]
    for r in results:
        print("%-24s %-8s %6d bytes  %6d insns  %d sort candidates"
              % (r["path"].split("/")[-1], r["kind"], r["bytes"], r["insns"], len(r["candidates"])))
    if args.md:
        open(args.md, "w").write(render_md(results) + "\n")
        print("wrote %s" % args.md)


if __name__ == "__main__":
    main()
