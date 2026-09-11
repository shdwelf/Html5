#!/usr/bin/env python3
# Range-based ZIP64 central-directory parser for Internet Archive large-zip access.
import os, sys, struct, zlib, gzip, io, csv, urllib.request, urllib.parse, time, re

URL = "https://archive.org/download/AbbottabadCompoundMaterials/Everything.20171021.zip"
OUT = ".relay/recon"
os.makedirs(OUT, exist_ok=True)

def get_range(url, start, end, retries=5):
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers={"Range": f"bytes={start}-{end}", "User-Agent":"relay-recon/1.0"})
            with urllib.request.urlopen(req, timeout=120) as r:
                return r.read()
        except Exception as e:
            print("range retry", i, start, end, repr(e)[:200]); time.sleep(3*(i+1))
    raise RuntimeError(f"range failed {start}-{end}")

class RangeZip:
    def __init__(self, url):
        self.url = url
        req = urllib.request.Request(url, method="HEAD", headers={"User-Agent":"relay-recon/1.0"})
        with urllib.request.urlopen(req, timeout=60) as r:
            self.size = int(r.headers["Content-Length"])
        print("zip size", self.size)
    def parse(self):
        tail = get_range(self.url, self.size-262144, self.size-1)
        # EOCD signature 0x06054b50
        idx = tail.rfind(b"PK\x05\x06")
        if idx < 0: raise RuntimeError("no EOCD")
        eocd = tail[idx:idx+22]
        (sig, disk, cd_disk, n_disk, n_total, cd_size32, cd_off32, clen) = struct.unpack("<IHHHHIIH", eocd)
        cd_off, cd_size, n = cd_off32, cd_size32, n_total
        if cd_off == 0xFFFFFFFF or cd_size == 0xFFFFFFFF or n_total == 0xFFFF:
            zidx = tail.rfind(b"PK\x06\x07")
            if zidx < 0: raise RuntimeError("no zip64 eocd locator")
            loc = tail[zidx:zidx+20]
            (zsig, zdisk, z64off, zdisks) = struct.unpack("<IQII", loc)
            z64 = get_range(self.url, z64off, z64off+55)
            if z64[:4] != b"PK\x06\x06": raise RuntimeError("bad zip64 eocd")
            vals = struct.unpack("<IQHHIIQQQQ", z64[:56])
            n = vals[7]; cd_size = vals[8]; cd_off = vals[9]
        print("entries", n, "cd_off", cd_off, "cd_size", cd_size)
        cd = b""
        CH = 64*1024*1024
        pos = cd_off
        end = cd_off+cd_size
        while pos < end:
            cd += get_range(self.url, pos, min(pos+CH-1, end-1))
            pos += CH
        print("cd downloaded", len(cd))
        members=[]
        p=0
        while True:
            sig = cd[p:p+4]
            if not sig: break
            if sig == b"PK\x06\x06": break
            if sig != b"PK\x02\x01":
                print("bad central sig at", p, cd[p:p+8]); break
            hdr = struct.unpack("<IHHHHHHIIIHHHHHIIH", cd[p:p+46])
            (s, vmade, vneed, flag, method, mtime, mdate, crc, csize, usize,
             nlen, elen, clen2, disk, iattr, eattr, lho) = hdr
            name = cd[p+46:p+46+nlen]
            extra = cd[p+46+nlen:p+46+nlen+elen]
            comment = cd[p+46+nlen+elen:p+46+nlen+elen+clen2]
            csize64, usize64, lho64 = csize, usize, lho
            # zip64 extra 0x0001
            ep=0
            while ep+4 <= len(extra):
                etag, esz = struct.unpack("<HH", extra[ep:ep+4]); ed = extra[ep+4:ep+4+esz]
                if etag == 0x0001:
                    q=0
                    if usize == 0xFFFFFFFF:
                        usize64 = struct.unpack("<Q", ed[q:q+8])[0]; q+=8
                    if csize == 0xFFFFFFFF:
                        csize64 = struct.unpack("<Q", ed[q:q+8])[0]; q+=8
                    if lho == 0xFFFFFFFF:
                        lho64 = struct.unpack("<Q", ed[q:q+8])[0]
                ep += 4+esz
            enc = "utf-8" if (flag & 0x800) else "cp437"
            try: fname = name.decode(enc)
            except Exception: fname = name.decode("utf-8", "replace")
            members.append((fname, method, flag, crc, csize64, usize64, lho64))
            p += 46+nlen+elen+clen2
        return members

def main():
    rz = RangeZip(URL)
    members = rz.parse()
    print("parsed members", len(members))
    # full manifest
    with gzip.open(os.path.join(OUT,"full-manifest.tsv.gz"),"wt",newline="") as f:
        w=csv.writer(f, delimiter="\t")
        w.writerow(["name","method","flag","crc","csize","usize","lho"])
        for m in members: w.writerow(m)
    # root listing
    roots = sorted({m[0].split("/")[0] for m in members if m[0]})
    open(os.path.join(OUT,"roots.txt"),"w").write("\n".join(roots))
    # redacted list
    red = os.path.join(OUT,"redacted.txt")
    urllib.request.urlretrieve("https://ia800407.us.archive.org/25/items/AbbottabadCompoundMaterials/list_of_redacted_files_cia_et_al_seized_during_the_ubl_raid.txt", red)
    redpaths=set()
    for line in open(red, encoding="utf-8", errors="replace"):
        parts=line.rstrip("\n").split("\t")
        if len(parts)>=2:
            pth=parts[1].lstrip("./")
            # outer archive member only (before first '.zip/' nested marker)
            m=re.match(r"(.+?\.zip)/", pth)
            redpaths.add(m.group(1) if m else pth)
    print("redacted outer paths", len(redpaths))
    byname={m[0]:m for m in members}
    # PE-ish direct members
    pe_ext=re.compile(r"\.(exe|dll|scr|sys|cpl|ocx|pif|com|drv|ax)$", re.I)
    def is_direct(n): 
        # direct member: 2011-1234/DEVICE/HASH_name
        return re.match(r"^2011-1234/[0-9]{9}/[0-9A-Fa-f]{32}_", n) is not None
    with gzip.open(os.path.join(OUT,"pe-members.tsv.gz"),"wt",newline="") as f:
        w=csv.writer(f, delimiter="\t"); w.writerow(["name","method","crc","csize","usize","lho","redacted"])
        for m in members:
            n=m[0]
            if is_direct(n) and pe_ext.search(n):
                w.writerow([*m[1:], 1 if n in redpaths else 0])
    # redacted PE hits
    hits=[byname[p] for p in redpaths if p in byname and pe_ext.search(p)]
    with gzip.open(os.path.join(OUT,"redacted-pe.tsv.gz"),"wt",newline="") as f:
        w=csv.writer(f, delimiter="\t"); w.writerow(["name","method","flag","crc","csize","usize","lho"])
        for m in hits: w.writerow(m)
    print("redacted PE direct members:", len(hits))
    # specific IOC hashes / names
    needles=["4742ae6404fa227623192998e79f1bc6","903a80a6e8c6457e51a00179f10a8fa8","regsvr.exe","scvhost.exe",
             "agentcpd.dll","tsxp","a0003368","setup1.exe","postbuild.exe","glb1.tmp","softonicen_vlc",
             "spyder","password","keylog","klogger","njrat","poison","spy-net","spynet","bifrost","picsnoop"]
    with open(os.path.join(OUT,"ioc-hits.tsv"),"w") as f:
        w=csv.writer(f, delimiter="\t"); w.writerow(["needle","name","method","csize","usize","lho"])
        for nd in needles:
            for m in members:
                if nd in m[0].lower():
                    w.writerow([nd,*m[:1],m[4],m[5],m[6]])
                    if sum(1 for _ in [0]) and False: pass
    # tiny PE redacted candidates by size (most compelling small malware)
    small=sorted([m for m in hits if m[5] <= 400_000], key=lambda m:m[5])[:80]
    with open(os.path.join(OUT,"small-redacted-pe.tsv"),"w") as f:
        w=csv.writer(f, delimiter="\t"); w.writerow(["name","method","flag","crc","csize","usize","lho"])
        for m in small: w.writerow(m)
    # method stats
    from collections import Counter
    print("methods", Counter(m[1] for m in members))
    print("direct PE count:", sum(1 for m in members if is_direct(m[0]) and pe_ext.search(m[0])))

if __name__=="__main__":
    main()
