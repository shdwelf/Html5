#!/usr/bin/env python3
"""
build_index.py — NPI search index builder
==========================================

Turns the CMS NPPES "Full Replacement Monthly NPI File" (or a curated demo
subset) into the compact binary index consumed by `npi-search.html`.

Why preprocess server-side
--------------------------
The official CMS file (https://download.cms.gov/nppes/NPI_Files.html) is a
~1 GB zip / >4 GB CSV with 329+ columns per provider. Earl Glynn's analysis
(https://earlglynn.github.io/National-Provider-Identifier/) shows most of the
bloat is quoted empty cells and 15x taxonomy / 50x other-id repeating groups.
A browser cannot stream-parse that, so we reduce it once, offline, to:

  meta.json     dataset description, dictionaries (states, specialties), stats
  names.br      unique last/legal-business names, sorted (u16 len + utf8)
  firsts.br     unique first names, sorted (u16 len + utf8)
  rows.br       one fixed 32-byte record per provider, sorted by NPI
  nameorder.br  u32[]  name-sorted position -> row index (trigram id space)
  firstorder.br u32[]  first-name-sorted position -> row index
  trig.br       two trigram inverted indexes (last name / first name):
                65536-entry lookup tables + varint-delta posting lists,
                positions in name-sorted space (locality -> small deltas)

All .br files are brotli of the raw byte layout documented in
tools/npi/README.md. The app decompresses with DecompressionStream('br').

Memory: designed to stay < ~2.5 GB on a 4 GB box (parallel arrays, no
per-row objects, streaming CSV, q=10 brotli).

Modes
-----
  --demo            Build from the two public mirror files that this
                    sandbox could reach (NPPES name table parquet +
                    CMS Order/Referring CSV). See --name-parquet / --orc-csv.
  --cms-zip FILE    Build from the official CMS zip (any month, V1 or V2).
                    Streams the CSV; never loads it fully into memory.

Output:  -o DIR   (default: <repo>/data/npi)
"""

import argparse
import brotli
import csv
import datetime
import json
import os
import random
import struct
import sys
import unicodedata
import zipfile
from array import array

EPOCH = datetime.date(2000, 1, 1)


def log(*a):
    print(*a, flush=True)


# ----------------------------------------------------------------------------
# normalization + trigrams
# ----------------------------------------------------------------------------
# charset: a-z (0-25), 0-9 (26-35), ' (36), - (37), . (38); space = boundary
CHARS = {ch: i for i, ch in enumerate("abcdefghijklmnopqrstuvwxyz0123456789'-.")}
B = 39          # base
TMAX = B ** 3   # 59319 codes; table sized 65536


def normalize(s: str) -> str:
    """Lowercase, strip diacritics, keep indexed charset + spaces."""
    s = unicodedata.normalize("NFD", s)
    out = []
    for ch in s.lower():
        if ch in CHARS or ch == " ":
            out.append(ch)
    return "".join(out)


def trigrams(norm: str):
    """Trigram codes over space-delimited runs of a normalized string."""
    codes = []
    run = []
    for ch in norm + " ":
        if ch == " ":
            if len(run) >= 3:
                for i in range(len(run) - 2):
                    codes.append((run[i] * B + run[i + 1]) * B + run[i + 2])
            run = []
        else:
            run.append(CHARS[ch])
    return codes


def varint(n: int) -> bytes:
    out = bytearray()
    while True:
        b7 = n & 0x7F
        n >>= 7
        if n:
            out.append(b7 | 0x80)
        else:
            out.append(b7)
            return bytes(out)


def write_posting_section(data: bytearray, posts) -> bytes:
    """Emit a 65536-entry (u32 offset, u32 count) table.

    `posts`: dict code -> array('I') of ascending positions (already sorted,
    appended in name-sorted order). Posting lists are appended to `data` as
    varint deltas (first value absolute). Returns the table bytes.
    """
    table = bytearray(TMAX * 8)
    for code in sorted(posts):
        arr = posts[code]
        if not arr:
            continue
        off = len(data)
        prev = 0
        for p in arr:
            data += varint(p - prev)
            prev = p
        struct.pack_into("<II", table, code * 8, off, len(arr))
    return bytes(table)


# ----------------------------------------------------------------------------
# name dictionaries
# ----------------------------------------------------------------------------
class NameDict:
    """normalized name -> index; stores display strings sorted by norm."""

    def __init__(self):
        self.norm_to_idx = {}
        self.items = []  # (norm, disp)

    def add(self, norm: str, disp: str) -> int:
        got = self.norm_to_idx.get(norm)
        if got is not None:
            return got
        idx = len(self.items)
        self.norm_to_idx[norm] = idx
        self.items.append((norm, disp))
        return idx

    def finalize(self) -> bytes:
        self.items.sort(key=lambda t: (t[0], t[1]))
        self.norm_to_idx = {n: i for i, (n, _) in enumerate(self.items)}
        out = bytearray()
        for _, disp in self.items:
            b = disp.encode("utf-8")[:65535]
            out += struct.pack("<H", len(b)) + b
        return bytes(out)


# ----------------------------------------------------------------------------
# row storage: parallel arrays (no per-row objects)
# ----------------------------------------------------------------------------
class Rows:
    __slots__ = ("npi", "name", "first", "flags", "state", "zip5",
                 "city", "tax", "phone", "updated")

    def __init__(self):
        self.npi = array("I")
        self.name = []          # str
        self.first = []         # str ("")
        self.flags = array("B")
        self.state = array("B")
        self.zip5 = array("H")
        self.city = array("I")
        self.tax = array("I")
        self.phone = array("I")
        self.updated = array("I")

    def add(self, npi, name, first="", flags=0, state=255, zip5=0,
            city=0, tax=0, phone=0, updated=0):
        self.npi.append(npi)
        self.name.append(name)
        self.first.append(first)
        self.flags.append(flags)
        self.state.append(state)
        self.zip5.append(zip5)
        self.city.append(city)
        self.tax.append(tax)
        self.phone.append(phone)
        self.updated.append(updated)

    def __len__(self):
        return len(self.npi)


def days_since_epoch(s):
    if not s:
        return 0
    for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%Y%m%d"):
        try:
            d = datetime.datetime.strptime(s[:10], fmt).date()
            return (d - EPOCH).days
        except ValueError:
            pass
    return 0


# ----------------------------------------------------------------------------
# DEMO mode (sandbox-reachable mirrors)
# ----------------------------------------------------------------------------
def build_demo(args):
    import pyarrow.parquet as pq

    log(f"[demo] reading name table: {args.name_parquet}")
    f = pq.ParquetFile(args.name_parquet)
    total_names = f.metadata.num_rows
    log(f"[demo] name table rows: {total_names}")

    log(f"[demo] reading order/referring: {args.orc_csv}")
    orc = {}
    with open(args.orc_csv, newline="") as fh:
        rd = csv.reader(fh)
        next(rd)
        for row in rd:
            if len(row) < 8:
                continue
            try:
                npi = int(row[0])
            except ValueError:
                continue
            last = row[1].strip()
            first = row[2].strip()
            if not last:
                continue
            flags = 0
            for i, bit in enumerate((1, 2, 3, 4, 5)):  # partB,dme,hha,pmd,hospice
                if row[3 + i].upper() == "Y":          # cols 3..7 of the O/R file
                    flags |= 1 << bit
            if first.upper() in ("N", "", "NA"):
                first = ""
            orc[npi] = (last, first, flags)
    log(f"[demo] order/referring rows: {len(orc):,}")

    # stream the parquet, stratify remaining rows by first letter (no full copy)
    by_first = {}
    f2 = pq.ParquetFile(args.name_parquet)
    seen = 0
    for batch in f2.iter_batches(batch_size=250_000):
        codes = batch.column("code").to_pylist()
        descs = batch.column("description").to_pylist()
        for npi_s, name in zip(codes, descs):
            if not name:
                continue
            seen += 1
            if seen % 2_000_000 == 0:
                log(f"[demo] scanned {seen:,}")
            npi = int(npi_s)
            if npi in orc:
                continue
            by_first.setdefault(name[0].upper(), []).append((npi, name))
    remain = sum(len(v) for v in by_first.values())
    log(f"[demo] remaining (non order/referring) rows: {remain:,}")

    rng = random.Random(42)
    target = args.demo_sample
    per = target // len(by_first)
    keys = list(by_first)
    rng.shuffle(keys)
    sample = []
    for k in keys:
        lst = by_first[k]
        rng.shuffle(lst)
        sample.extend(lst[:per])
        by_first[k] = lst[per:]  # keep the remainder for top-up
    if len(sample) < target:
        need = target - len(sample)
        for k in keys:
            lst = by_first[k]
            if lst is None:
                continue
            take = min(need, len(lst))
            sample.extend(lst[:take])
            need -= take
            if need <= 0:
                break
    log(f"[demo] sampled rows: {len(sample):,}")

    rows = Rows()
    orc_vintage = days_since_epoch("2025-09-29")
    name_vintage = days_since_epoch("2025-09-03")
    for npi, (last, first, flags) in orc.items():
        rows.add(npi, last, first, flags, updated=orc_vintage)
    del orc
    for npi, name in sample:
        rows.add(npi, name, "", 1 << 0, updated=name_vintage)
    del sample, by_first

    source = {
        "name": "CMS NPI demo dataset",
        "vintage": "2025-09-29",
        "interactive_rows": len(rows),
        "registry_rows": total_names,
        "files": [
            {
                "desc": f"NPPES name table (NPI -> legal name), all {total_names:,} issued NPIs incl. deactivated",
                "source": "npidata_pfile_20050523-20250810 (Aug 2025 NPPES file) via github.com/hantswilliams/HHA-507-2025 (npi_small.parquet)",
            },
            {
                "desc": "CMS Medicare Order & Referring dataset (Part B / DME / HHA / PMD / Hospice participation)",
                "source": "OrderReferring_20250929.csv via github.com/hantswilliams/HHA-507-2025",
            },
        ],
        "notes": ("Interactive set = 2,000,887 Medicare ordering/referring "
                  "providers (name + program flags) + 1,000,000 stratified "
                  "sample of remaining issued NPIs (name only, flagged "
                  "'sample'). Address/specialty fields are empty in this "
                  "profile; rebuild with the official CMS file (see "
                  "tools/npi/README.md) for the full registry."),
    }
    return rows, source, {}


# ----------------------------------------------------------------------------
# FULL CMS mode
# ----------------------------------------------------------------------------
STATE_ABBR = {
    "ALABAMA": "AL", "ALASKA": "AK", "ARIZONA": "AZ", "ARKANSAS": "AR",
    "CALIFORNIA": "CA", "COLORADO": "CO", "CONNECTICUT": "CT", "DELAWARE": "DE",
    "FLORIDA": "FL", "GEORGIA": "GA", "HAWAII": "HI", "IDAHO": "ID",
    "ILLINOIS": "IL", "INDIANA": "IN", "IOWA": "IA", "KANSAS": "KS",
    "KENTUCKY": "KY", "LOUISIANA": "LA", "MAINE": "ME", "MARYLAND": "MD",
    "MASSACHUSETTS": "MA", "MICHIGAN": "MI", "MINNESOTA": "MN", "MISSISSIPPI": "MS",
    "MISSOURI": "MO", "MONTANA": "MT", "NEBRASKA": "NE", "NEVADA": "NV",
    "NEW HAMPSHIRE": "NH", "NEW JERSEY": "NJ", "NEW MEXICO": "NM", "NEW YORK": "NY",
    "NORTH CAROLINA": "NC", "NORTH DAKOTA": "ND", "OHIO": "OH", "OKLAHOMA": "OK",
    "OREGON": "OR", "PENNSYLVANIA": "PA", "RHODE ISLAND": "RI",
    "SOUTH CAROLINA": "SC", "SOUTH DAKOTA": "SD", "TENNESSEE": "TN", "TEXAS": "TX",
    "UTAH": "UT", "VERMONT": "VT", "VIRGINIA": "VA", "WASHINGTON": "WA",
    "WEST VIRGINIA": "WV", "WISCONSIN": "WI", "WYOMING": "WY", "PUERTO RICO": "PR",
}


def find_data_file(zf: zipfile.ZipFile):
    best = None
    best_len = -1
    for n in zf.namelist():
        base = os.path.basename(n).lower()
        if base.startswith("npidata") and base.endswith(".csv") \
                and not base.endswith("fileheader.csv"):
            if len(n) > best_len:
                best, best_len = n, len(n)
    return best


def g(row, idx, key):
    i = idx.get(key)
    if i is None or i >= len(row):
        return ""
    return row[i].strip()


def build_cms(args):
    zf = zipfile.ZipFile(args.cms_zip)
    name = find_data_file(zf)
    if name is None:
        sys.exit("could not locate npidata*.csv inside zip")
    log(f"[cms] data file: {name}")
    fh = zf.open(name)
    rd = csv.reader(fh)
    header = [h.strip() for h in next(rd)]
    idx = {}
    for i, h in enumerate(header):
        hl = h.lower()
        if hl == "npi":
            idx["npi"] = i
        elif hl.startswith("provider last name"):
            idx["last"] = i
        elif hl.startswith("provider first name") and "other" not in hl:
            idx["first"] = i
        elif hl.startswith("provider organization name"):
            idx["org"] = i
        elif hl.startswith("entity type code"):
            idx["et"] = i
        elif hl.startswith("provider first line business mailing address"):
            idx["mail1"] = i
        elif hl.startswith("provider business mailing address city"):
            idx["mcity"] = i
        elif hl.startswith("provider business mailing address state"):
            idx["mstate"] = i
        elif hl.startswith("provider business mailing address postal"):
            idx["mzip"] = i
        elif hl.startswith("provider business mailing address telephone"):
            idx["mphone"] = i
        elif hl.startswith("primary tax code"):
            idx["tax"] = i
        elif hl.startswith("last update date"):
            idx["upd"] = i
        elif hl.startswith("npi deactivation date"):
            idx["deact"] = i
    for k in ("npi", "last", "mcity", "mstate", "mzip", "upd"):
        if k not in idx:
            sys.exit(f"column not found: {k} (headers: {header[:12]}...)")

    states, cities, taxes = {}, {}, {}
    rows = Rows()
    n = deact = 0
    for row in rd:
        n += 1
        if n % 500_000 == 0:
            log(f"[cms] {n:,} rows...")
        try:
            npi = int(row[idx["npi"]])
        except (ValueError, IndexError):
            continue
        last = g(row, idx, "last")
        first = g(row, idx, "first")
        org = g(row, idx, "org")
        deact_d = g(row, idx, "deact")
        if deact_d:  # deactivated: NPI + date only per CMS FOIA guidance
            deact += 1
            continue
        if not last and not org:
            continue
        st = STATE_ABBR.get(g(row, idx, "mstate").upper())
        state = states.setdefault(st, len(states)) if st else 255
        z = g(row, idx, "mzip")
        zip5 = int(z[:5]) if z.isdigit() else 0
        city = g(row, idx, "mcity")
        city_i = cities.setdefault(city, len(cities)) if city else 0
        tax = g(row, idx, "tax")
        tax_i = taxes.setdefault(tax, len(taxes)) if tax else 0
        phone = "".join(ch for ch in g(row, idx, "mphone") if ch.isdigit())
        phone = int(phone[-10:]) if len(phone) >= 10 else 0
        rows.add(npi, last or org, "" if org else first,
                 1 << 6 if org else 0, state, zip5, city_i, tax_i, phone,
                 days_since_epoch(g(row, idx, "upd")))
    log(f"[cms] active rows: {len(rows):,}  deactivated (skipped): {deact:,}")
    source = {
        "name": "CMS NPPES Full Replacement Monthly NPI File",
        "vintage": os.path.basename(args.cms_zip),
        "interactive_rows": len(rows),
        "registry_rows": n,
        "files": [{"desc": os.path.basename(args.cms_zip),
                   "source": "https://download.cms.gov/nppes/NPI_Files.html"}],
    }
    extra = {
        "states": [states[i] for i in sorted(states, key=states.get)],
        "cities": [cities[i] for i in sorted(cities, key=cities.get)],
        "taxes": [taxes[i] for i in sorted(taxes, key=taxes.get)],
    }
    return rows, source, extra


# ----------------------------------------------------------------------------
# index emission
# ----------------------------------------------------------------------------
REC = struct.Struct("<IIIBBHIIII")  # 32 B: npi,nameRef,firstRef,flags,state,zip5,city,tax,phone,updated


def emit(rows, source, extra, outdir):
    os.makedirs(outdir, exist_ok=True)
    N = len(rows)
    log(f"[emit] {N:,} rows -> {outdir}")

    # normalized names (kept for sort keys + trigrams)
    log("[emit] normalizing...")
    nname = [normalize(n) for n in rows.name]
    nfirst = [normalize(f) if f else "" for f in rows.first]

    names = NameDict()
    firsts = NameDict()
    for i in range(N):
        names.add(nname[i], rows.name[i])
        if nfirst[i]:
            firsts.add(nfirst[i], rows.first[i])
    log("[emit] dictionaries...")
    names_bytes = names.finalize()
    firsts_bytes = firsts.finalize()
    nname_i = [names.norm_to_idx[x] for x in nname]
    nfirst_i = [firsts.norm_to_idx[x] if x else 0 for x in nfirst]

    log("[emit] sorting by name...")
    order = sorted(range(N), key=lambda i: (nname_i[i], nfirst_i[i], rows.npi[i]))

    log("[emit] last-name trigram postings...")
    posts = {}
    for pos, i in enumerate(order):
        for c in trigrams(nname[i]):
            a = posts.get(c)
            if a is None:
                posts[c] = array("I", [pos])
            else:
                a.append(pos)
    stats_t1, stats_p1 = len(posts), sum(len(v) for v in posts.values())
    del nname

    log("[emit] first-name trigram postings...")
    forder = sorted((i for i in order if rows.first[i]),
                    key=lambda i: (nfirst_i[i], nname_i[i], rows.npi[i]))
    fposts = {}
    for pos, i in enumerate(forder):
        for c in trigrams(nfirst[i]):
            a = fposts.get(c)
            if a is None:
                fposts[c] = array("I", [pos])
            else:
                a.append(pos)
    stats_t2, stats_p2 = len(fposts), sum(len(v) for v in fposts.values())
    del nfirst

    log("[emit] packing records (NPI order)...")
    order2 = sorted(range(N), key=lambda i: rows.npi[i])
    row_idx_of = [0] * N
    rec = bytearray(N * REC.size)
    for k, i in enumerate(order2):
        row_idx_of[i] = k
        REC.pack_into(rec, k * REC.size, rows.npi[i], nname_i[i], nfirst_i[i],
                      rows.flags[i], rows.state[i], rows.zip5[i], rows.city[i],
                      rows.tax[i], rows.phone[i], rows.updated[i])
    nameorder = array("I", (row_idx_of[i] for i in order))
    firstorder = array("I", (row_idx_of[i] for i in forder))
    del order, forder, row_idx_of, nname_i, nfirst_i, order2, rows

    log("[emit] writing files...")
    data1 = bytearray()
    t1 = write_posting_section(data1, posts)
    data2 = bytearray()
    t2 = write_posting_section(data2, fposts)
    del posts, fposts
    hdr = 4 + 8 * 4
    d1 = hdr + 2 * TMAX * 8
    trig = struct.pack("<I", 1)
    trig += struct.pack("<QQQQ", hdr, hdr + TMAX * 8, d1, d1 + len(data1))
    trig += t1 + t2 + data1 + data2

    meta = {
        "version": 1,
        "generated": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
        "source": source,
        "rows": N,
        "names": len(names.items),
        "firsts": len(firsts.items),
        "frows": len(firstorder),
        "states": extra.get("states", []),
        "specialties": [{"code": c} for c in extra.get("taxes", [])],
        "cities": extra.get("cities", []),
        "stats": {
            "trigrams_name": stats_t1,
            "trigrams_first": stats_t2,
            "postings_name": stats_p1,
            "postings_first": stats_p2,
        },
        "flags": {
            "1": "sample (registry sample, name only)",
            "2": "partB", "4": "dme", "8": "hha", "16": "pmd", "32": "hospice",
            "64": "organization",
        },
        "flag_bits": {"sample": 1, "partB": 2, "dme": 4, "hha": 8,
                      "pmd": 16, "hospice": 32, "org": 64},
    }
    files = {"meta.json": json.dumps(meta, indent=1)}
    raw = {
        "names.br": names_bytes,
        "firsts.br": firsts_bytes,
        "rows.br": bytes(rec),
        "nameorder.br": bytes(nameorder),
        "firstorder.br": bytes(firstorder),
        "trig.br": bytes(trig),
    }
    for fn, data in files.items():
        with open(os.path.join(outdir, fn), "w", encoding="utf-8") as fh:
            fh.write(data)
    for fn, data in raw.items():
        comp = brotli.compress(data, quality=10)
        with open(os.path.join(outdir, fn), "wb") as fh:
            fh.write(comp)
        log(f"[emit] {fn:15s} raw {len(data)/1e6:8.1f} MB -> {len(comp)/1e6:6.2f} MB")
    log("[emit] done")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--demo", action="store_true")
    ap.add_argument("--name-parquet",
                    default="/tmp/hha/Module1_MedicalCodexes/npi/output/npi_small.parquet")
    ap.add_argument("--orc-csv",
                    default="/tmp/hha/Module5_inferential/data/cms-npi-ordering/OrderReferring_20250929.csv")
    ap.add_argument("--demo-sample", type=int, default=1_000_000)
    ap.add_argument("--cms-zip")
    ap.add_argument("-o", "--outdir", default=os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data", "npi"))
    args = ap.parse_args()

    if args.demo:
        rows, source, extra = build_demo(args)
    elif args.cms_zip:
        rows, source, extra = build_cms(args)
    else:
        ap.exit("need --demo or --cms-zip")
    emit(rows, source, extra, args.outdir)


if __name__ == "__main__":
    main()
