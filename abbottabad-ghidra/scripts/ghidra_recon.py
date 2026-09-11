# Ghidra headless post-script (Jython 2.7)
# Produces a Markdown/JSON reconnaissance report for a PE/ELF binary.
# @category Security
# @runtime Jython

import os, re, json, traceback
from ghidra.program.model.symbol import SymbolType
from ghidra.app.decompiler import DecompInterface, DecompileOptions

ARGS = list(getScriptArgs())
OUTDIR = ARGS[0] if ARGS else "."
if not os.path.exists(OUTDIR):
    os.makedirs(OUTDIR)

def safe(name):
    return re.sub(r"[^A-Za-z0-9._-]+", "_", name)[:80]

prog = currentProgram
log = []
def note(s):
    println(s)
    log.append(s)

report = {"file": prog.getName(), "metadata": {}, "sections": [], "imports": {},
          "exports": [], "entries": [], "functions": [], "strings": [], "iocs": {}}

# --- metadata -------------------------------------------------------------
md = prog.getMetadata()
for k in md.keySet():
    report["metadata"][str(k)] = str(md[k])
report["language"] = str(prog.getLanguageID())
report["image_base"] = str(prog.getImageBase())

# --- memory blocks --------------------------------------------------------
for b in prog.getMemory().getBlocks():
    report["sections"].append({
        "name": b.getName(), "start": str(b.getStart()), "end": str(b.getEnd()),
        "size": b.getSize(), "r": b.isRead(), "w": b.isWrite(), "x": b.isExecute()})

# --- imports --------------------------------------------------------------
em = prog.getExternalManager()
for lib in sorted(em.getExternalLibraryNames()):
    funcs = []
    for loc in em.getExternalLocations(lib):
        funcs.append(str(loc.getLabel()))
    report["imports"][str(lib)] = sorted(set(funcs))

# --- exports / external entry points -------------------------------------
st = prog.getSymbolTable()
it = st.getExternalEntryPointIterator()
entries = []
while it.hasNext():
    a = it.next()
    s = st.getPrimarySymbol(a)
    entries.append(str(a) + (("  " + s.getName(True)) if s else ""))
    report["entries"].append(str(a))
for sym in st.getSymbolIterator():
    try:
        if sym.getSymbolType() == SymbolType.FUNCTION and sym.isExternalEntryPoint():
            report["exports"].append(sym.getName(True))
    except Exception:
        pass

# --- raw ASCII / wide string scan for IOCs -------------------------------
ASCII = re.compile(rb"[\x20-\x7e]{4,}")
def read_all():
    chunks = []
    mem = prog.getMemory()
    blk = mem.getBlocks()
    for b in blk:
        if not b.isInitialized():
            continue
        buf = bytearray(b.getSize())
        try:
            b.getBytes(b.getStart(), buf)
            chunks.append((b.getName(), bytes(buf)))
        except Exception:
            pass
    return chunks

ioc_re = {
    "url": re.compile(rb"https?://[A-Za-z0-9_.:/%?=&~+\-]+", re.I),
    "ftp": re.compile(rb"ftp://[^\s\"'<>]+", re.I),
    "ipv4": re.compile(rb"\b(?:\d{1,3}\.){3}\d{1,3}(?::\d{1,5})?\b"),
    "email": re.compile(rb"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}"),
    "reg_run": re.compile(rb"(?i)(software\\microsoft\\windows\\currentversion\\run[^\x00\"']*)"),
    "mutex": re.compile(rb"(?i)(mutex|event)[\\/: ][ -~]{3,}"),
}
found = dict((k, set()) for k in ioc_re)
string_count = 0
for bname, data in read_all():
    for m in ASCII.finditer(data):
        s = m.group()
        string_count += 1
        if len(report["strings"]) < 4000:
            try: report["strings"].append(s.decode("latin-1"))
            except Exception: pass
        for k, rx in ioc_re.items():
            for mm in rx.finditer(s):
                v = mm.group()
                if k == "ipv4":
                    o = v.split(b".")
                    if any(int(x) > 255 for x in o[:4] if x.isdigit()):
                        continue
                found[k].add(v.decode("latin-1", "replace"))
    # UTF-16LE
    try:
        txt = data.decode("utf-16-le", "ignore").encode("latin-1", "ignore")
        for m in ASCII.finditer(txt):
            for k, rx in ioc_re.items():
                for mm in rx.finditer(m.group()):
                    found[k].add(mm.group().decode("latin-1", "replace"))
    except Exception:
        pass
report["string_count_approx"] = string_count
for k in found:
    report["iocs"][k] = sorted(found[k])

# --- functions & decompilation -------------------------------------------
fm = prog.getFunctionManager()
funcs = list(fm.getFunctions(True))
report["function_count"] = len(funcs)
for f in funcs[:3000]:
    report["functions"].append({"name": f.getName(), "entry": str(f.getEntryPoint()),
                                "size": f.getBody().getNumAddresses(), "thunk": f.isThunk()})

decomp_dir = os.path.join(OUTDIR, "decompiled")
if not os.path.exists(decomp_dir):
    os.makedirs(decomp_dir)
opts = DecompileOptions()
dec = DecompInterface()
dec.setOptions(opts)
dec.openProgram(prog)

SUS = re.compile(r"(?i)(url|internet|socket|connect|recv|send|exec|process|service|regset|regcreate|"
                 r"keylog|async.?key|getkeystate|ftp|http|download|inject|virtualalloc|wsa|crypt|"
                 r"winexec|shellexecute|createfile|writefile|mutex|startup|shutdown|login|pass)")
prio = []
for f in funcs:
    n = f.getName()
    score = 0
    refs = prog.getReferenceManager().getReferencesTo(f.getEntryPoint())
    # priority: entry points, suspicious names, callers of suspicious imports
    if str(f.getEntryPoint()) in report["entries"]:
        score += 5
    if SUS.search(n):
        score += 3
    if re.match(r"^(FUN_|FUN_0x)", n) is None and not f.isThunk():
        score += 1
    if score:
        prio.append((score, f))
prio.sort(key=lambda x: -x[0])
targets = prio[:60] if prio else funcs[:20]
decompiled = []
for score, f in targets:
    try:
        res = dec.decompileFunction(f, 60, monitor)
        c = res.getDecompiledFunction()
        if c:
            src = c.getC()
            fn = safe(f.getName()) + "_" + str(f.getEntryPoint()).replace(":", "") + ".c"
            open(os.path.join(decomp_dir, fn), "w").write(src)
            decompiled.append({"name": f.getName(), "entry": str(f.getEntryPoint()),
                               "score": score, "file": "decompiled/" + fn})
    except Exception:
        note("decompile failed: %s %s" % (f.getName(), traceback.format_exc()[:200]))
dec.dispose()
report["decompiled"] = decompiled

# --- write JSON -----------------------------------------------------------
json.dump(report, open(os.path.join(OUTDIR, "report.json"), "w"), indent=1, sort_keys=True)

# --- write Markdown -------------------------------------------------------
lines = []
lines.append("# Ghidra headless recon: %s" % prog.getName())
lines.append("")
lines.append("- Language: `%s`" % report["language"])
lines.append("- Image base: `%s`" % report["image_base"])
lines.append("- Functions: %s" % report["function_count"])
lines.append("- Approx strings: %s" % report["string_count_approx"])
lines.append("")
lines.append("## Metadata")
for k in sorted(report["metadata"]):
    lines.append("- %s: `%s`" % (k, report["metadata"][k].replace("`", "'")))
lines.append("")
lines.append("## Sections")
lines.append("| name | start | size | R W X |")
lines.append("|---|---|---:|:-:|")
for s in report["sections"]:
    lines.append("| %s | %s | %d | %s%s%s |" % (s["name"], s["start"], s["size"],
        "R" if s["r"] else "-", "W" if s["w"] else "-", "X" if s["x"] else "-"))
lines.append("")
lines.append("## Imports")
for lib in sorted(report["imports"]):
    lines.append("### %s (%d)" % (lib, len(report["imports"][lib])))
    lines.append("")
    for fn in report["imports"][lib]:
        lines.append("- `%s`" % fn)
    lines.append("")
lines.append("## Entry points")
for e in entries:
    lines.append("- `%s`" % e)
lines.append("")
lines.append("## IOCs")
for k in sorted(report["iocs"]):
    vals = report["iocs"][k]
    if not vals:
        continue
    lines.append("### %s" % k)
    for v in vals[:200]:
        lines.append("- `%s`" % v.replace("|", "\\|"))
    lines.append("")
lines.append("## Decompiled functions (%d)" % len(decompiled))
for d in decompiled:
    lines.append("- [%s] `%s` at %s (score %d) -> %s" % (d["file"], d["name"], d["entry"], d["score"], d["file"]))
open(os.path.join(OUTDIR, "report.md"), "w").write("\n".join(lines))
note("DONE -> " + OUTDIR)
