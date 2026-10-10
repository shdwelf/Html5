# Ghidra post-analysis script: DOS binary survey + array-sort detection.
#
# Runs under Ghidra's GhidraPy/Jython inside analyzeHeadless:
#   analyzeHeadless <proj> <name> -import TARGET.COM \
#     -processor x86:LE:16:default -postScript ghidra_dos_summary.py
#
# It writes a Markdown report next to the project: functions, entry points,
# defined strings, and — the point of the exercise — every nested-loop pattern
# that looks like an in-place array sort (the O(n^2) bubble/selection/insertion
# shapes the disassembly is meant to expose so they can be replaced with an
# O(n log n) sort). Detection is heuristic over the decompiler's pseudocode;
# it flags candidates for review, it does not rewrite anything.
#
# @category Custom
# @author shdwelf/Html5

from __future__ import print_function
import os
import re

from ghidra.app.decompiler import DecompInterface
from ghidra.util.task import ConsoleTaskMonitor


# Heuristic shapes for the classic O(n^2) in-place sorts. Each is a pair of
# (label, complexity) applied when the nested-loop + swap/compare signature is
# present in a function's pseudocode.
SORT_SIGNATURES = [
    (r"a\[\s*j\s*\]\s*>\s*a\[\s*j\s*\+\s*1\s*\]", "bubble/adjacent-compare", "O(n^2)"),
    (r"for\s*\(.*\)\s*\{[^}]*for\s*\(.*\)\s*\{[^}]*(tmp|temp|t)\s*=\s*a\[", "nested-loop swap", "O(n^2)"),
    (r"(min|minIdx|min_idx)\s*=.*\n.*if\s*\(a\[\s*j\s*\]\s*<\s*a\[\s*min", "selection sort", "O(n^2)"),
]


def decompile_all(func_mgr, timeout_ms):
    """Decompile every function; return [(name, pseudocode)] skipping failures."""
    decomp = DecompInterface()
    decomp.openProgram(currentProgram)
    monitor = ConsoleTaskMonitor()
    out = []
    it = func_mgr.getFunctions(True)
    while it.hasNext():
        f = it.next()
        try:
            res = decomp.decompileFunction(f, timeout_ms, monitor)
            if res is not None and res.decompileCompleted():
                c = res.getDecompiledFunction()
                if c is not None:
                    out.append((f.getName(), c.getC()))
        except Exception:
            pass
    decomp.dispose()
    return out


def find_sort_candidates(pseudocode):
    """Return [(label, complexity)] for O(n^2) sort shapes in one function."""
    hits = []
    for pattern, label, cx in SORT_SIGNATURES:
        if re.search(pattern, pseudocode, re.DOTALL | re.IGNORECASE):
            hits.append((label, cx))
    # Generic nested-loop-with-swap fallback: two nested for-loops and a 3-move
    # swap of the same indexed array.
    if not hits:
        nested = re.search(r"for\s*\(.*?\)\s*\{.*?for\s*\(.*?\)\s*\{", pseudocode, re.DOTALL)
        swap = re.search(r"(\w+)\s*=\s*(\w+)\[.*?\].*?\2\[.*?\]\s*=\s*\w+\[.*?\].*?\1\b", pseudocode, re.DOTALL)
        if nested and swap:
            hits.append(("nested-loop array swap", "O(n^2)"))
    return hits


def main():
    listing = currentProgram.getListing()
    func_mgr = currentProgram.getFunctionManager()
    mem = currentProgram.getMemory()

    proj_dir = os.environ.get("GHIDRA_REPORT_DIR", ".")
    name = currentProgram.getName()
    report = os.path.join(proj_dir, "ghidra-report-%s.md" % name)

    funcs = decompile_all(func_mgr, 30000)

    lines = []
    lines.append("# Ghidra survey — %s" % name)
    lines.append("")
    lines.append("- processor: `%s`" % currentProgram.getLanguageID())
    lines.append("- image base: `%s`" % currentProgram.getImageBase())
    blocks = list(mem.getBlocks())
    lines.append("- memory blocks: %d (%s)" % (
        len(blocks), ", ".join(b.getName() for b in blocks[:8])))
    lines.append("- functions: %d" % func_mgr.getFunctionCount())
    lines.append("- defined data: %d" % listing.getNumDefinedData())
    lines = [l for l in lines if l != ""]

    # Defined strings.
    strings = []
    dit = listing.getDefinedData(True)
    while dit.hasNext():
        d = dit.next()
        try:
            if d.getDataType().getName().startswith("string"):
                v = d.getValue()
                if v is not None:
                    s = str(v)
                    if 3 <= len(s) <= 80:
                        strings.append(s)
        except Exception:
            pass
    lines.append("- defined strings: %d" % len(strings))
    lines.append("")
    lines.append("## Array-sort candidates (replace with O(n log n))")
    lines.append("")
    found = 0
    for fname, code in funcs:
        cands = find_sort_candidates(code)
        if cands:
            found += 1
            labels = ", ".join("%s [%s]" % (l, c) for l, c in cands)
            lines.append("- `%s` — %s" % (fname, labels))
    if not found:
        lines.append("_none detected — either the binary has no in-place array "
                     "sort, or the decompiler did not recover the loop shapes._")
    lines.append("")
    lines.append("## Strings (first 60)")
    lines.append("")
    for s in strings[:60]:
        lines.append("- `%s`" % s.replace("|", "/").replace("\n", " "))

    with open(report, "w") as fh:
        fh.write("\n".join(lines) + "\n")
    print("wrote %s (%d functions, %d sort candidates)" % (report, len(funcs), found))


main()
