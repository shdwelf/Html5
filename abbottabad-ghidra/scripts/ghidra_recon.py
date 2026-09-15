# Ghidra headless post-script (Jython 2.7)
# Produces Markdown/JSON reconnaissance report for a PE binary.
# @category Security
# @runtime Jython

import os, re, json, traceback
from ghidra.program.model.symbol import SymbolType
from ghidra.app.decompiler import DecompInterface, DecompileOptions
import jarray

ARGS = list(getScriptArgs())
OUTDIR = ARGS[0] if ARGS else "."
if not os.path.exists(OUTDIR):
    os.makedirs(OUTDIR)

def safe(name):
    return re.sub(r"[^A-Za-z0-9._-]+", "_", name)[:80]

prog = currentProgram
log = []
def note(s):
    println(s); log.append(str(s))

report = {"file": prog.getName(), "metadata": {}, "sections": [], "imports": {},
          "exports": [], "entries": [], "functions": [], "strings": [], "iocs": {}}

md = prog.getMetadata()
for k in md.keySet():
    report["metadata"][str(k)] = str(md[k])
report["language"] = str(prog.getLanguageID())
report["image_base"] = str(prog.getImageBase())

for b in prog.getMemory().getBlocks():
    report["sections"].append({
        "name": b.getName(), "start": str(b.getStart()), "end": str(b.getEnd()),
        "size": b.getSize(), "r": b.isRead(), "w": b.isWrite(), "x": b.isExecute()})

em = prog.getExternalManager()
for lib in sorted(em.getExternalLibraryNames()):
    funcs = []
    for loc in em.getExternalLocations(lib):
        funcs.append(str(loc.getLabel()))
    report["imports"][str(lib)] = sorted(set(funcs))

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

# --- string / IOC scan over initialized memory ---------------------------
ASCII_RX = re.compile(r"[ -~]{4,}")
IOC_RX = {
    "url": re.compile(r"https?://[A-Za-z0-9_.:/%?=&~+\-]{4,}", re.I),
    "ftp": re.compile(r"ftp://[^\s\"'<>]{4,}", re.I),
    "ipv4": re.compile(r"(?:\d{1,3}\.){3}\d{1,3}(?::\d{1,5})?"),
    "email": re.compile(r"[A-Za-z0-9._%+\-]{3,}@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}"),
    "runkey": re.compile(r"software[\\/]microsoft[\\/]windows[\\/]currentversion[\\/](?:run|runservices|runonce)[^\x00\"']*", re.I),
}
found = dict((k, set()) for k in IOC_RX)

def scan_text(text):
    for m in ASCII_RX.finditer(text):
        s = m.group()
        if len(report["strings"]) < 6000:
            report["strings"].append(s)
        for k, rx in IOC_RX.items():
            for mm in rx.finditer(s):
                v = mm.group()
                if k == "ipv4":
                    parts = v.split(":")[0].split(".")
                    if any(int(x) > 255 for x in parts if x.isdigit()):
                        continue
                found[k].add(v)

for blk in prog.getMemory().getBlocks():
    if not blk.isInitialized():
        continue
    try:
        n = min(blk.getSize(), 64 * 1024 * 1024)
        buf = jarray.zeros(n, "b")
        blk.getBytes(blk.getStart(), buf)
        scan_text("".join(chr(x & 0xff) for x in buf))
    except Exception:
        note("block scan failed: " + traceback.format_exc()[:200])

# UTF-16LE strings
for blk in prog.getMemory().getBlocks():
    if not blk.isInitialized():
        continue
    try:
        n = min(blk.getSize(), 64 * 1024 * 1024)
        buf = jarray.zeros(n, "b")
        blk.getBytes(blk.getStart(), buf)
        raw = "".join(chr(x & 0xff) for x in buf)
        wide = raw[::2]
        scan_text(wide)
    except Exception:
        pass

report["iocs"] = dict((k, sorted(found[k])) for k in found)

# --- functions & decompilation -------------------------------------------
fm = prog.getFunctionManager()
funcs = list(fm.getFunctions(True))
report["function_count"] = len(funcs)
for f in funcs[:4000]:
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
                 r"winexec|shellexecute|createfile|writefile|mutex|startup|shutdown|login|pass|start@|"
                 r"copyfile|movefile|toolhelp|process32|volume|computername|username|snapshot)")
prio = []
entrieset = set(report["entries"])
for f in funcs:
    n = f.getName()
    score = 0
    if str(f.getEntryPoint()) in entrieset:
        score += 5
    if SUS.search(n):
        score += 3
    if not f.isThunk() and not re.match(r"FUN_", n):
        score += 1
    if score:
        prio.append((score, f))
prio.sort(key=lambda x: -x[0])
targets = prio[:80] if prio else funcs[:20]
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

json.dump(report, open(os.path.join(OUTDIR, "report.json"), "w"), indent=1, sort_keys=True)

lines = []
lines.append("# Ghidra headless recon: %s" % prog.getName())
lines.append("")
lines.append("- Language: `%s`" % report["language"])
lines.append("- Image base: `%s`" % report["image_base"])
lines.append("- Functions: %s" % report["function_count"])
lines.append("- Strings collected: %s" % len(report["strings"]))
lines.append("")
lines.append("## Metadata")
for k in sorted(report["metadata"]):
    lines.append("- %s: `%s`" % (k, report["metadata"][k].replace("`", "'")))
lines.append("")
lines.append("## Sections")
lines.append("| name | start | size | R W X |")
lines.append("|---|---|---:|:-:|")
for sx in report["sections"]:
    lines.append("| %s | %s | %d | %s%s%s |" % (sx["name"], sx["start"], sx["size"],
        "R" if sx["r"] else "-", "W" if sx["w"] else "-", "X" if sx["x"] else "-"))
lines.append("")
lines.append("## Imports")
for lib in sorted(report["imports"]):
    lines.append("### %s (%d)" % (lib, len(report["imports"][lib])))
    lines.append("")
    for fn in report["imports"][lib]:
        lines.append("- `%s`" % fn)
    lines.append("")
lines.append("## Entry points / exports")
for e in entries:
    lines.append("- `%s`" % e)
for e in report["exports"]:
    lines.append("- export `%s`" % e)
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
for dx in decompiled:
    lines.append("- `%s` at %s (score %d) -> %s" % (dx["name"], dx["entry"], dx["score"], dx["file"]))
open(os.path.join(OUTDIR, "report.md"), "w").write("\n".join(lines))
note("DONE -> " + OUTDIR)
