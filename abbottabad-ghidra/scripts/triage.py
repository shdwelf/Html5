#!/usr/bin/env python3
# Fast PE triage for extracted Abbottabad samples.
import os, re, sys, json, hashlib
import pefile

SAMPLE_DIR = sys.argv[1] if len(sys.argv) > 1 else ".relay/samples"
OUT = sys.argv[2] if len(sys.argv) > 2 else "evidence/triage.json"

IOC_RX = {
    "url": re.compile(rb"https?://[A-Za-z0-9_.:/%?=&~+\-]{4,}", re.I),
    "ftp": re.compile(rb"ftp://[^\s\"'<>]{4,}", re.I),
    "ipv4": re.compile(rb"\b(?:\d{1,3}\.){3}\d{1,3}(?::\d{1,5})?\b"),
    "mail": re.compile(rb"[A-Za-z0-9._%+\-]{3,}@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}"),
    "runkey": re.compile(rb"(?i)software(?:\\|/)microsoft(?:\\|/)windows(?:\\|/)currentversion(?:\\|/)(?:run|runservices|runonce)[^\x00\"']*"),
}
ASCII_RX = re.compile(rb"[\x20-\x7e]{5,}")

def ascii_strings(b, n=5):
    return [m.group().decode("latin1") for m in ASCII_RX.finditer(b)]

def triage(path):
    d = {"file": os.path.basename(path), "size": os.path.getsize(path)}
    raw = open(path, "rb").read()
    d["md5"] = hashlib.md5(raw).hexdigest()
    d["sha1"] = hashlib.sha1(raw).hexdigest()
    d["sha256"] = hashlib.sha256(raw).hexdigest()
    try:
        pe = pefile.PE(data=raw, fast_load=False)
    except Exception as e:
        d["error"] = repr(e)
        return d
    fh = pe.FILE_HEADER
    oh = pe.OPTIONAL_HEADER
    d["machine"] = hex(fh.Machine)
    d["bits"] = 64 if fh.Machine == 0x8664 else 32
    d["subsystem"] = oh.Subsystem
    d["imagebase"] = hex(oh.ImageBase)
    d["entrypoint_rva"] = hex(oh.AddressOfEntryPoint)
    d["timestamp"] = fh.TimeDateStamp
    import datetime
    d["timestamp_utc"] = datetime.datetime.utcfromtimestamp(fh.TimeDateStamp).isoformat()+"Z" if fh.TimeDateStamp else ""
    d["sections"] = [{"name": s.Name.rstrip(b"\x00").decode("latin1"), "vsize": s.Misc_VirtualSize,
                      "rawsize": s.SizeOfRawData, "entropy": round(s.get_entropy(),2),
                      "chars": "".join(x for x, ok in [("R", s.IMAGE_SCN_MEM_READ),("W",s.IMAGE_SCN_MEM_WRITE),("X",s.IMAGE_SCN_MEM_EXECUTE)] if ok)}
                     for s in pe.sections]
    d["dllchars"] = [name for bit, name in [(0x0040,"DYNAMIC_BASE"),(0x0100,"NX_COMPAT"),(0x4000,"GUARD_CF"),(0x100,"TERMINAL_SERVER")] if oh.DllCharacteristics & bit]
    imports = {}
    if hasattr(pe, "DIRECTORY_ENTRY_IMPORT"):
        for e in pe.DIRECTORY_ENTRY_IMPORT:
            imports[e.dll.decode("latin1")] = [imp.name.decode("latin1") for imp in e.imports if imp.name]
    d["imports"] = imports
    d["import_count"] = sum(len(v) for v in imports.values())
    if hasattr(pe, "DIRECTORY_ENTRY_EXPORT"):
        d["exports"] = [s.name.decode("latin1") for s in pe.DIRECTORY_ENTRY_EXPORT.symbols if s.name][:50]
    # version resource
    try:
        for fi in pe.FileInfo[0]:
            if fi.Key == b"StringFileInfo":
                for st in fi.StringTable:
                    d["version"] = {k.decode("latin1"): v.decode("latin1") for k, v in st.entries.items()}
    except Exception:
        pass
    # iocs on whole image
    iocs = dict((k, set()) for k in IOC_RX)
    for s in ascii_strings(raw):
        for k, rx in IOC_RX.items():
            for mm in rx.finditer(s.encode("latin1", "ignore")):
                v = mm.group().decode("latin1")
                if k == "ipv4" and any(int(x) > 255 for x in v.split(":")[0].split(".")):
                    continue
                iocs[k].add(v)
    try:
        wide = raw.decode("utf-16-le", "ignore")
        for k, rx in IOC_RX.items():
            for mm in rx.finditer(wide.encode("latin1","ignore")):
                iocs[k].add(mm.group().decode("latin1"))
    except Exception:
        pass
    d["iocs"] = dict((k, sorted(v)[:60]) for k, v in iocs.items())
    # interesting strings
    interesting = re.compile(r"(?i)(\.exe$|\.dll$|cmd(?:\.exe)?|reg |winlogon|userinit|currentversion.run|startup|"
                             r"password|passw|login|keylog|getasynckeystate|recorder|screenshot|mutex|\\\\|net use|"
                             r"winsock|socket|connect|ftp|http|smtp|mail|mydoc|system32|temp|appdata|trojan|spy|rat\b)")
    strs = ascii_strings(raw)
    d["interesting_strings"] = [s for s in strs if interesting.search(s)][:120]
    d["section_max_entropy"] = max((s["entropy"] for s in d["sections"]), default=0)
    return d

results = []
for fn in sorted(os.listdir(SAMPLE_DIR)):
    if fn == "INDEX.tsv" or fn.startswith("."):
        continue
    p = os.path.join(SAMPLE_DIR, fn)
    if os.path.isfile(p):
        try:
            r = triage(p)
        except Exception as e:
            r = {"file": fn, "error": repr(e)}
        results.append(r)
        print(r["file"], "->", r.get("bits"), "bit", r.get("timestamp_utc",""),
              "imports", r.get("import_count"), "maxH", r.get("section_max_entropy"), r.get("error",""))

os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump(results, open(OUT, "w"), indent=1, sort_keys=True)
print("wrote", OUT)
