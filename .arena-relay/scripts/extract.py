#!/usr/bin/env python3
# Extract selected members from the Internet Archive-hosted original Abbottabad ZIP
# using HTTP Range requests (local header + deflate/stored member data).
import os, csv, gzip, struct, zlib, hashlib, urllib.request, time

URL = "https://archive.org/download/AbbottabadCompoundMaterials/Everything.20171021.zip"
TOKENS = [l.strip() for l in open(".arena-relay/scripts/extract.txt") if l.strip() and not l.startswith("#")]
OUT = ".relay/samples"
os.makedirs(OUT, exist_ok=True)

def get_range(start, end, retries=6):
    want = end-start+1
    for i in range(retries):
        try:
            req = urllib.request.Request(URL, headers={"Range": f"bytes={start}-{end}", "User-Agent":"relay-extract/1.0"})
            with urllib.request.urlopen(req, timeout=180) as r:
                data = r.read()
            if len(data) == want:
                return data
            if 0 < len(data) < want:
                return data + get_range(start+len(data), end)
        except Exception as e:
            print("range retry", i, start, repr(e)[:160]); time.sleep(3*(i+1))
    raise RuntimeError("range failed %d-%d" % (start, end))

# load manifest rows
rows = []
with gzip.open(".relay/recon/full-manifest.tsv.gz", "rt", newline="") as f:
    r = csv.reader(f, delimiter="\t")
    header = next(r)
    for row in r:
        rows.append(row)
print("manifest rows", len(rows))

selected = []
seen = set()
for tok in TOKENS:
    matches = [row for row in rows if tok.upper() in row[0].upper()]
    if not matches:
        print("NO MATCH for", tok); continue
    for row in matches:
        if row[0] in seen: continue
        seen.add(row[0]); selected.append(row)
    print("token", tok, "matches", len(matches))

index = open(os.path.join(OUT, "INDEX.tsv"), "w")
iw = csv.writer(index, delimiter="\t")
iw.writerow(["member","usize","crc32_zip","md5","sha1","crc32_ok"])

for row in selected:
    name, method_s, flag_s, crc_s, csize_s, usize_s, lho_s = row[:7]
    method, crc, csize, usize, lho = int(method_s), int(crc_s), int(csize_s), int(usize_s), int(lho_s)
    base = name.split("/")[-1]
    try:
        local = get_range(lho, lho+29)
        if local[:4] != b"PK\x03\x04":
            print("BAD LOCAL SIG", name, local[:4]); continue
        (lsig, lver, lflag, lmethod, lmt, lmd, lcrc, lcs, lus, nlen, elen) = struct.unpack("<IHHHHHIIIHH", local)
        ds = lho+30+nlen+elen
        cdata = get_range(ds, ds+csize-1)
        if method == 8:
            raw = zlib.decompress(cdata, -15)
        elif method == 0:
            raw = cdata
        else:
            print("unknown method", method, name); continue
        ok = (len(raw) == usize) and (zlib.crc32(raw) & 0xffffffff == crc)
        md5 = hashlib.md5(raw).hexdigest()
        sha1 = hashlib.sha1(raw).hexdigest()
        # filesystem-safe name: keep hash prefix + sanitized tail
        tail = base.encode("utf-8", "replace").decode("utf-8", "replace")
        safe = "".join(c if (c.isalnum() or c in "._-") else "_" for c in tail)[:120]
        outp = os.path.join(OUT, safe)
        open(outp, "wb").write(raw)
        iw.writerow([name, usize, "%08x" % crc, md5, sha1, int(ok)])
        index.flush()
        print("extracted", safe, usize, "crc_ok" if ok else "CRC_MISMATCH", md5)
    except Exception as e:
        print("FAILED", name, repr(e)[:200])
index.close()
print("DONE")
