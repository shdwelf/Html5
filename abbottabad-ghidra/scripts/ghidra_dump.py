# Decompile every non-thunk function; dump strings with addresses.
# @category Security
# @runtime Jython
import os, re, jarray
from ghidra.app.decompiler import DecompInterface, DecompileOptions

OUT = list(getScriptArgs())[0]
if not os.path.exists(OUT):
    os.makedirs(OUT)
ddir = os.path.join(OUT, "all")
if not os.path.exists(ddir):
    os.makedirs(ddir)

prog = currentProgram
dec = DecompInterface()
dec.setOptions(DecompileOptions())
dec.openProgram(prog)
fm = prog.getFunctionManager()
funcs = list(fm.getFunctions(True))
idx = []
for f in funcs:
    if f.isThunk():
        continue
    try:
        res = dec.decompileFunction(f, 90, monitor)
        c = res.getDecompiledFunction()
        if not c:
            continue
        fn = "%08x_%s.c" % (f.getEntryPoint().getOffset(), re.sub(r"[^A-Za-z0-9._-]", "_", f.getName())[:60])
        open(os.path.join(ddir, fn), "w").write(c.getC())
        idx.append((f.getEntryPoint().getOffset(), f.getName(), fn, f.getBody().getNumAddresses()))
    except Exception:
        pass
dec.dispose()
with open(os.path.join(OUT, "function_index.tsv"), "w") as fp:
    for x in sorted(idx):
        fp.write("%08x\t%s\t%s\t%d\n" % x)

# defined strings (ASCII + Unicode) with addresses
from ghidra.program.model.data import StringDataType, UnicodeDataType
listing = prog.getListing()
count = 0
with open(os.path.join(OUT, "strings.txt"), "w") as sp:
    for d in listing.getDefinedData(True):
        t = d.getDataType()
        tn = t.getName() if t is not None else ""
        if "string" in tn.lower() or "char" in tn.lower():
            try:
                v = d.getValue()
                if v is not None:
                    s = str(v).replace("\n", "\\n").replace("\r", "\\r")
                    if s.strip():
                        sp.write("%s\t%s\t%s\n" % (d.getAddress(), tn, s[:500]))
                        count += 1
            except Exception:
                pass
println("DUMPED %d functions, %d strings" % (len(idx), count))
