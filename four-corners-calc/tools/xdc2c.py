#!/usr/bin/env python3
"""Convert four-corners.xdc into the C data pack the calculators link against.

    python3 four-corners-calc/tools/xdc2c.py --xdc four-corners.xdc

A .xdc is a webxdc bundle: a zip of HTML, CSS and ES modules. This converter
does not scrape it with regexes. It unzips the bundle, runs the app's own data
and geo modules under node (tools/fc_dump.mjs), and emits

    core/fcdata.h      counts, quantisation + IDW constants, externs
    core/fcdata.c      the tables themselves
    host/elevfix.h     elevation fixture, straight out of the app's elevAt()
    build/fcdata.json  the intermediate dump, for inspection

Everything is integer. lon/lat become u16 in units of 1/FC_Q degree measured
from a whole-milli-degree origin; site and register elevations the data pack
leaves null are the app's own elevAt() evaluated at conversion time; corridor
lengths are the app's own pathKm(); the state lines are the two-vertex lines
through the SURVEYED quadripoint the app draws its borders as.

The terrain is the app's inverse-distance field over 31 control points with
power 2.4. The integer twin in core/geo.c evaluates the same field with a
log2/exp2 pair in fixed point; host/tests.c holds it against the fixture.

Prose is what gets left behind: full stories and sources are UTF-8 and a TI-83
program variable tops out around 24 KB. Pass --fact-chars N to carry the first
sentence of each feature's story (or register note) anyway.
"""
import argparse
import json
import math
import re
import shutil
import subprocess
import sys
import tempfile
import unicodedata
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parent

# The 3x5 font in calc/core/tables.c covers exactly these glyphs.
FONT_CHARS = set("0123456789 .-:+/*#ABCDEFGHIJKLMNOPQRSTUVWXYZ")

# Applied before the ASCII fold, so the fold never has to guess.
SUBST = {
    "\u00b7": " ",   # ·  interpunct, used as a separator throughout the app
    "\u2014": "-", "\u2013": "-", "\u2212": "-", "\u2010": "-", "\u2011": "-",
    "\u2018": "", "\u2019": "", "\u201c": "", "\u201d": "",
    "\u2032": "", "\u2033": "", "\u02bc": "",   # ʼ modifier apostrophe (Tsé Bitʼaʼí)
    "\u00d7": "X", "\u00f7": "/",
    "\u2248": "~", "\u2264": "<", "\u2265": ">",
    "\u00b0": " DEG", "\u00b2": "2", "\u00b3": "3",
    "&": " + ", "%": " PCT", "(": " ", ")": " ", "[": " ", "]": " ",
    ",": " ", ";": " ", "'": "", '"': "", "!": "", "?": "", "_": "-",
    "\u2026": "...", "=": "-", "<": " ", ">": " ", "|": " ", "@": " AT ",
    "$": " USD ", "\u00a0": " ",
}

TIERS = ["official", "community", "context"]

# Layer kinds the renderer knows about. "terrain" is the relief shell, which
# on a 1-bit LCD is the section screen's profile rather than a mesh (the app
# says kind:"terrain"; the SOCAL converter called the same thing "surface").
KINDS = ["terrain", "line", "node"]

# Per-device budget for the whole program variable, from devices.json ram_k and
# the documented maximum variable size of each model.
BUDGET = {"ti83": 24 * 1024, "ti89": 64 * 1024, "ti92": 64 * 1024}

# UI chrome. Not from the bundle — but it shares the bundle's string pool so
# core/app.c never has to spell a word out as a brace-list of char codes.
UI_LABELS = [
    ("FL_TITLE", "FOUR CORNERS"), ("FL_FOUR", "FOUR"), ("FL_CORNERS", "CORNERS"),
    ("FL_SUB", "4DWM NATIVE PORT"), ("FL_PRESS", "PRESS ANY KEY"),
    ("FL_MAP", "MAP"), ("FL_PROF", "SECTION"), ("FL_LAYERS", "LAYERS"),
    ("FL_DOS", "DOSSIER"), ("FL_INFO", "DEVICE"),
    ("FL_OFFICIAL", "OFFICIAL"), ("FL_COMMUNITY", "COMMUNITY"), ("FL_CONTEXT", "CONTEXT"),
    ("FL_TIER", "TIER "), ("FL_LAYER", "LAYER "), ("FL_ELEV", "ELEV "),
    ("FL_MAX", "MAX "), ("FL_DEPTH", "DEPTH "), ("FL_LEN", "LEN "), ("FL_KM", " KM"),
    ("FL_M", " M"), ("FL_FT", " FT"), ("FL_LON", "LON "), ("FL_LAT", " LAT"),
    ("FL_NOTDEM", "CURATED IDW - NOT A DEM"),
    ("FL_SURVEY", "LINES THRU SURVEYED POINT"),
    ("FL_REGNOTE", "GNIS SEED REGISTER"),
    ("FL_TRANSECT", "W-E TRANSECT"), ("FL_ALONG", "ALONG ROUTE"),
    ("FL_ON", "ON"), ("FL_OFF", "OFF"), ("FL_VIS", "VIS "), ("FL_SLASH", "/"),
    ("FL_CORR", "CORRIDORS "), ("FL_SITES", "SITES "), ("FL_REG", "REGISTER "),
    ("FL_VERTS", "VERTICES "), ("FL_TER", "CONTROL PTS "),
    ("FL_LCD", "LCD "), ("FL_RAM", "RAM "),
    ("FL_XDC", "FOUR-CORNERS.XDC"), ("FL_QUANT", "1/2000 DEG GRID"),
    ("FL_ZOOM", "Z"), ("FL_IDW", "IDW"),
    ("FL_TI83", "TI-83"), ("FL_TI89", "TI-89"), ("FL_TI92", "TI-92"),
    ("FL_HOST", "HOST"), ("FL_Z80", "Z80"), ("FL_M68K", "M68K"),
    ("FL_LAYERSON", "LAYERS ON "),
]


# --------------------------------------------------------------- text folding

def fold(text: str) -> str:
    """UTF-8 prose -> the uppercase subset the 3x5 font can actually draw."""
    for src, dst in SUBST.items():
        text = text.replace(src, dst)
    text = unicodedata.normalize("NFKD", text)
    text = "".join(c for c in text if not unicodedata.combining(c))
    text = text.upper()
    text = "".join(c if c in FONT_CHARS else " " for c in text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def fold_label(text: str) -> str:
    """Fold, but keep the leading/trailing space — in a UI label it is the
    separator between 'DEPTH' and the number, not decoration."""
    lead = " " if text[:1] == " " else ""
    trail = " " if text[-1:] == " " else ""
    return lead + fold(text) + trail


def clip(text: str, limit: int) -> str:
    """Fold and shorten at a word boundary when we can."""
    text = fold(text)
    if limit <= 0 or len(text) <= limit:
        return text
    cut = text[:limit]
    if " " in cut[limit // 2:]:
        cut = cut[: cut.rindex(" ")]
    return cut.rstrip(" -.")


class StringPool:
    """One 0-terminated blob; features hold u16 offsets into it."""

    def __init__(self):
        self.blob = bytearray(b"\x00")   # offset 0 is the empty string
        self.index = {"": 0}

    def add(self, text: str) -> int:
        if text in self.index:
            return self.index[text]
        off = len(self.blob)
        self.blob += text.encode("ascii") + b"\x00"
        self.index[text] = off
        if off > 0xFFFF:
            raise SystemExit("string pool exceeded 64 KB — lower --max-name")
        return off


# ------------------------------------------------------------------ xdc input

def read_xdc(xdc_path: Path, workdir: Path) -> dict:
    if not xdc_path.exists():
        raise SystemExit("no such bundle: %s" % xdc_path)
    if not zipfile.is_zipfile(xdc_path):
        raise SystemExit("%s is not a zip — a .xdc is a zipped webxdc bundle" % xdc_path)
    with zipfile.ZipFile(xdc_path) as zf:
        names = zf.namelist()
        if "index.html" not in names:
            raise SystemExit("%s has no index.html — not a webxdc bundle" % xdc_path)
        if "js/four-corners-geo.js" not in names:
            raise SystemExit("%s has no js/four-corners-geo.js — rebuild the bundle"
                             " (node scripts/build-four-corners-xdc.mjs)" % xdc_path)
        zf.extractall(workdir)
    if not shutil.which("node"):
        raise SystemExit("node is required: the converter runs the bundle's own ES modules")
    dump = ROOT / "tools" / "fc_dump.mjs"
    proc = subprocess.run([shutil.which("node"), str(dump), str(workdir)],
                          capture_output=True, text=True)
    if proc.returncode != 0:
        raise SystemExit("fc_dump.mjs failed:\n%s" % proc.stderr.strip())
    data = json.loads(proc.stdout)
    data["_members"] = sorted(names)
    return data


# ---------------------------------------------------------------- quantisation

class Quant:
    """lon/lat <-> u16 grid, anchored on whole milli-degrees."""

    def __init__(self, per_deg: int, lon_base_m: int, lat_base_m: int):
        self.q = per_deg
        self.lon_base_m = lon_base_m
        self.lat_base_m = lat_base_m
        self.max_err_m = 0.0

    def lon(self, lon: float) -> int:
        v = int(round((lon - self.lon_base_m / 1000.0) * self.q))
        self._err(lon, self.lon_base_m, v, 92.0)
        return self._check(v, "lon", lon)

    def lat(self, lat: float) -> int:
        v = int(round((lat - self.lat_base_m / 1000.0) * self.q))
        self._err(lat, self.lat_base_m, v, 111.32)
        return self._check(v, "lat", lat)

    def _err(self, deg, base_m, v, km_per_deg):
        back = base_m / 1000.0 + v / self.q
        self.max_err_m = max(self.max_err_m, abs(back - deg) * km_per_deg * 1000.0)

    @staticmethod
    def _check(v, what, deg):
        if not 0 <= v <= 0xFFFF:
            raise SystemExit("%s %.4f quantises to %d, outside u16" % (what, deg, v))
        return v


def choose_origin(values, floor_to=0.1):
    lo = min(values)
    # round() first: 35.8/0.1 is 357.99999999999994 in binary, and flooring
    # that would silently move the whole grid a tenth of a degree south.
    step = round(lo / floor_to, 6)
    return int(math.floor(step) * floor_to * 1000)


# ------------------------------------------------------------------- emission

def carr(ctype: str, name: str, size_expr: str, values, per_line=12, comment=None):
    out = []
    if comment:
        out.append("/* %s */" % comment)
    out.append("%s %s[%s] = {" % (ctype, name, size_expr))
    for i in range(0, len(values), per_line):
        out.append("  " + ", ".join(str(int(v)) for v in values[i:i + per_line]) + ",")
    if not values:
        out.append("  0,")
    out.append("};")
    return "\n".join(out)


def sizeof(ctype: str, n: int) -> int:
    return n * {"const u8": 1, "const i8": 1, "const u16": 2, "const i16": 2}[ctype]


def clamp_i16(v):
    return max(-32768, min(32767, int(v)))


def first_fact(feature, limit):
    if limit <= 0:
        return ""
    facts = feature.get("facts") or []
    if not facts:
        return ""
    sentence = re.split(r"(?<=[.;])\s", facts[0])[0]
    return clip(sentence, limit)


def convert(data, args):
    pool = StringPool()
    tables = []          # (ctype, name, size_expr, values, comment)
    defines = []         # (name, value, comment)

    def table(ctype, name, size_expr, values, comment=None):
        tables.append((ctype, name, size_expr, values, comment))

    # ---------------------------------------------------------------- layers
    layers = list(data["layers"])
    layer_ix = {l["id"]: i for i, l in enumerate(layers)}

    # ---------------------------------------------------------------- extent
    lons, lats = [], []
    for c in data["corridors"]:
        for lon, lat in c["path"]:
            lons.append(lon)
            lats.append(lat)
    for n in data["nodes"] + data["register"]:
        lons.append(n["lon"])
        lats.append(n["lat"])
    for lon, lat, _e in data["terrainPoints"]:
        lons.append(lon)
        lats.append(lat)
    # The synthetic state lines reach the bbox edges, which no vertex does.
    lons += [data["bbox"]["lon0"], data["bbox"]["lon1"]]
    lats += [data["bbox"]["lat0"], data["bbox"]["lat1"]]

    quant = Quant(args.quant, choose_origin(lons), choose_origin(lats))
    span_lon = max(quant.lon(v) for v in lons)
    span_lat = max(quant.lat(v) for v in lats)

    # ------------------------------------------------------------ corridors
    pts, cor_off = [], []
    cor_layer, cor_tier, cor_km = [], [], []
    cor_name, cor_fact = [], []
    for c in data["corridors"]:
        cor_off.append(len(pts) // 2)
        for lon, lat in c["path"]:
            pts += [quant.lon(lon), quant.lat(lat)]
        cor_layer.append(layer_ix[c["layer"]])
        cor_tier.append(TIERS.index(c["tier"]))
        cor_km.append(min(65535, int(round(c["km"]))))
        cor_name.append(pool.add(clip(c["name"], args.max_name)))
        cor_fact.append(pool.add(first_fact(c, args.fact_chars)))
    cor_off.append(len(pts) // 2)

    # ---------------------------------------------------------------- nodes
    # Sites first, then the gazetteer register — the app's own pickable order.
    nodes = list(data["nodes"]) + list(data["register"])
    nd_q, nd_layer, nd_tier, nd_depth, nd_elev = [], [], [], [], []
    nd_name, nd_kind, nd_fact, nd_reg = [], [], [], []
    for n in nodes:
        nd_q += [quant.lon(n["lon"]), quant.lat(n["lat"])]
        nd_layer.append(layer_ix[n["layer"]])
        nd_tier.append(TIERS.index(n["tier"]))
        nd_depth.append(clamp_i16(round(n["depthM"])))
        nd_elev.append(clamp_i16(round(n["elevM"])))
        nd_name.append(pool.add(clip(n["name"], args.max_name)))
        nd_kind.append(pool.add(clip(n["kind"], args.max_kind)))
        nd_fact.append(pool.add(first_fact(n, args.fact_chars)))
        nd_reg.append(n["register"])

    # -------------------------------------------------------------- terrain
    ter = []
    for lon, lat, elev in data["terrainPoints"]:
        ter += [quant.lon(lon), quant.lat(lat), clamp_i16(round(elev))]

    # --------------------------------------------------------------- layers
    lay_name = [pool.add(clip(l["name"], args.max_name)) for l in layers]
    lay_kind = [KINDS.index(l["kind"]) for l in layers]
    lay_on = [1 if l["on"] else 0 for l in layers]

    # ------------------------------------------------------------ UI labels
    ui = [(name, pool.add(fold_label(text))) for name, text in UI_LABELS]

    # ------------------------------------------------------------- assemble
    center_lon_m = int(round(data["center"]["lon"] * 1000))
    center_lat_m = int(round(data["center"]["lat"] * 1000))
    cos_lat_q12 = int(round(data["cosLat"] * 4096))
    kmq = data["kmPerDegLat"] / args.quant            # km per quant unit (lat)
    quad_lon_q = quant.lon(data["quadripoint"]["lon"])
    quad_lat_q = quant.lat(data["quadripoint"]["lat"])

    defines += [
        ("FC_NLAYER", len(layers), "layers"),
        ("FC_NCOR", len(data["corridors"]), "corridors: 2 state lines + the San Juan River"),
        ("FC_NNODE", len(nodes), "point features: sites, then the gazetteer register"),
        ("FC_NSITE", len(data["nodes"]), "dossier sites (necks, energy, uranium, ruins)"),
        ("FC_NREG", len(data["register"]), "gazetteer register rows"),
        ("FC_NPT", len(pts) // 2, "corridor vertices"),
        ("FC_NTER", len(data["terrainPoints"]), "IDW terrain control points"),
        ("FC_STRB", len(pool.blob), "string pool bytes"),
        ("FC_Q", args.quant, "quantisation units per degree"),
        ("FC_LON_BASE_M", quant.lon_base_m, "lon origin, 1/1000 deg"),
        ("FC_LAT_BASE_M", quant.lat_base_m, "lat origin, 1/1000 deg"),
        ("FC_SPAN_LON", span_lon, "frame width in quant units"),
        ("FC_SPAN_LAT", span_lat, "frame height in quant units"),
        ("FC_CENTER_LON_M", center_lon_m, "projection centre, 1/1000 deg"),
        ("FC_CENTER_LAT_M", center_lat_m, "projection centre, 1/1000 deg"),
        ("FC_COSLAT_Q12", cos_lat_q12, "cos(centre latitude) in Q12"),
        ("FC_KMDEG_Q4", int(round(data["kmPerDegLat"] * 16)), "km per degree of latitude, Q4"),
        ("FC_QUAD_LON_Q", quad_lon_q, "the SURVEYED quadripoint, qlon"),
        ("FC_QUAD_LAT_Q", quad_lat_q, "the SURVEYED quadripoint, qlat"),
        ("FC_TIER_OFFICIAL", 0, None),
        ("FC_TIER_COMMUNITY", 1, None),
        ("FC_TIER_CONTEXT", 2, None),
        ("FC_KIND_TERRAIN", 0, None),
        ("FC_KIND_LINE", 1, None),
        ("FC_KIND_NODE", 2, None),
    ]

    # ------------------------------- IDW field constants, lifted from the app
    if abs(data["idwPower"] - 2.4) > 1e-9 or abs(data["idwSnapKm2"] - 0.25) > 1e-9:
        raise SystemExit("xdc2c: js/four-corners-geo.js changed its IDW constants "
                         "(power %r, snap %r). Update core/geo.c and the fixture "
                         "test together." % (data["idwPower"], data["idwSnapKm2"]))
    defines += [
        (None, None, "IDW relief field: power 2.4, snap inside 0.5 km, from four-corners-geo.js"),
        ("FC_ELEV_BASE", 1500, "metres returned when every weight underflows (unreachable)"),
        ("FC_KMQ_Q12", int(round(kmq * 4096)), "km per lat-quant unit, Q12"),
        ("FC_SNAP_Q", int(round(data["idwSnapKm2"] / (kmq * kmq))),
         "0.25 km2 snap radius in quant2 units"),
        ("FC_IDW_MUL", int(round(data["idwPower"] / 2 * 256)),
         "weight exponent 1.2 in Q8: t = (log2(d2)*FC_IDW_MUL)>>8"),
        ("FC_WBIAS", 14, "w = (FC_EXP2_Q16[f] << FC_WBIAS) >> n, see core/geo.c"),
        (None, None, "the port's own log depth ramp for the section screen (the app has none)"),
        ("FC_DEPTH_A_Q8", 90, "mag = a + b*log10(1+|m|), Q8"),
        ("FC_DEPTH_B_Q8", 115, None),
        (None, None, "string-pool offsets for the UI chrome"),
    ]
    defines += [(name, off, None) for name, off in ui]

    table("const u16", "FC_PT", "FC_NPT * 2", pts, "corridor vertices, qlon/qlat pairs")
    table("const u16", "FC_COR_OFF", "FC_NCOR + 1", cor_off, "first vertex of each corridor")
    table("const u8", "FC_COR_LAYER", "FC_NCOR", cor_layer)
    table("const u8", "FC_COR_TIER", "FC_NCOR", cor_tier)
    table("const u16", "FC_COR_KM", "FC_NCOR", cor_km, "length from the app's pathKm()")
    table("const u16", "FC_COR_NAME", "FC_NCOR", cor_name)
    table("const u16", "FC_COR_FACT", "FC_NCOR", cor_fact)
    table("const u16", "FC_NODE_Q", "FC_NNODE * 2", nd_q, "feature positions, qlon/qlat pairs")
    table("const u8", "FC_NODE_LAYER", "FC_NNODE", nd_layer)
    table("const u8", "FC_NODE_TIER", "FC_NNODE", nd_tier)
    table("const u8", "FC_NODE_REG", "FC_NNODE", nd_reg,
          "0 = dossier site, 1 = gazetteer register row")
    table("const i16", "FC_NODE_ELEV", "FC_NNODE", nd_elev,
          "metres; nulls in the pack are the app's own elevAt()")
    table("const i16", "FC_NODE_DEPTH", "FC_NNODE", nd_depth, "schematic depth, metres")
    table("const u16", "FC_NODE_NAME", "FC_NNODE", nd_name)
    table("const u16", "FC_NODE_KIND", "FC_NNODE", nd_kind,
          "string-pool offset: site kind or register feature class")
    table("const u16", "FC_NODE_FACT", "FC_NNODE", nd_fact)
    table("const u16", "FC_TER", "FC_NTER * 3", ter, "qlon, qlat, elevation_m control points")
    table("const u16", "FC_LAYER_NAME", "FC_NLAYER", lay_name)
    table("const u8", "FC_LAYER_KIND", "FC_NLAYER", lay_kind)
    table("const u8", "FC_LAYER_ON", "FC_NLAYER", lay_on, "default visibility from the web app")
    table("const u8", "FC_STR", "FC_STRB", list(pool.blob), "0-terminated names, folded to the 3x5 font")

    return {
        "defines": defines, "tables": tables, "quant": quant, "layers": layers,
        "pool": pool,
    }


# ------------------------------------------------------------------- writers

def write_c(built, data, args):
    defines, tables = built["defines"], built["tables"]
    origin = "four-corners.xdc"

    head = [
        "/* GENERATED by four-corners-calc/tools/xdc2c.py from %s — do not edit." % origin,
        " *",
        " * Source of truth is the bundle, not this file. Regenerate with:",
        " *     make -C four-corners-calc data",
        " *",
        " * %d layers  %d corridors (%d vertices)  %d sites + %d register rows  %d control points" % (
            len(built["layers"]), len([t for t in tables if t[1] == "FC_COR_LAYER"][0][3]),
            len([t for t in tables if t[1] == "FC_PT"][0][3]) // 2,
            len([t for t in tables if t[1] == "FC_NODE_REG"][0][3]) - sum([t for t in tables if t[1] == "FC_NODE_REG"][0][3]),
            sum([t for t in tables if t[1] == "FC_NODE_REG"][0][3]),
            len([t for t in tables if t[1] == "FC_TER"][0][3]) // 3),
        " * Positions are u16 in units of 1/%d degree; worst-case quantisation" % args.quant,
        " * error %.1f m, against curated point data and a context-tier relief." % built["quant"].max_err_m,
        " */",
    ]

    hdr = ["#ifndef FCDATA_H", "#define FCDATA_H", ""]
    for name, value, comment in defines:
        if name is None:
            hdr += ["", "/* %s */" % comment]
            continue
        line = "#define %-18s %s" % (name, value)
        if comment:
            line += "   /* %s */" % comment
        hdr.append(line)
    hdr.append("")
    for ctype, name, _size, _values, _c in tables:
        hdr.append("extern %s %s[];" % (ctype, name))
    hdr += ["", "#endif"]

    body = ['#include "fourcorners.h"', ""]
    for ctype, name, size, values, comment in tables:
        body.append(carr(ctype, name, size, values, comment=comment))
        body.append("")

    (ROOT / "core" / "fcdata.h").write_text("\n".join(head + [""] + hdr) + "\n")
    (ROOT / "core" / "fcdata.c").write_text("\n".join(head + [""] + body) + "\n")

    fix = data["elevationFixture"]
    fixture = [
        "/* GENERATED by four-corners-calc/tools/xdc2c.py — do not edit.",
        " * lon/lat in 1/1000 degree and the metres four-corners-geo.js elevAt()",
        " * returns there. host/tests.c holds the integer field to this. */",
        "#ifndef ELEVFIX_H",
        "#define ELEVFIX_H",
        "#define ELEVFIX_N %d" % len(fix),
        carr("static const i32", "ELEVFIX", "ELEVFIX_N * 3",
             [v for lon, lat, e in fix
              for v in (int(round(lon * 1000)), int(round(lat * 1000)), int(e))], per_line=9),
        "#endif",
    ]
    (ROOT / "host" / "elevfix.h").write_text("\n".join(fixture) + "\n")

    out_json = ROOT / "build" / "fcdata.json"
    out_json.parent.mkdir(parents=True, exist_ok=True)
    dump = dict(data)
    dump.pop("elevationFixture", None)
    out_json.write_text(json.dumps(dump, indent=1))


def report(built, data, args):
    tables = built["tables"]
    total = 0
    rows = []
    for ctype, name, _size, values, _c in tables:
        n = sizeof(ctype, len(values))
        total += n
        rows.append((name, ctype.replace("const ", ""), len(values), n))
    rows.sort(key=lambda r: -r[3])

    print("xdc2c: %s" % args.xdc)
    print("  bundle members      %d" % len(data["_members"]))
    print("  quantisation        1/%d deg, worst case %.1f m" % (args.quant, built["quant"].max_err_m))
    print("  frame               %d x %d quant units from %.3f, %.3f" % (
        [d[1] for d in built["defines"] if d[0] == "FC_SPAN_LON"][0],
        [d[1] for d in built["defines"] if d[0] == "FC_SPAN_LAT"][0],
        built["quant"].lon_base_m / 1000.0, built["quant"].lat_base_m / 1000.0))
    print("  strings             %d bytes, %d unique" % (len(built["pool"].blob),
                                                         len(built["pool"].index)))
    print()
    print("  %-16s %-5s %6s %8s" % ("table", "type", "count", "bytes"))
    for name, ctype, count, nbytes in rows:
        print("  %-16s %-5s %6d %8d" % (name, ctype, count, nbytes))
    print("  %-16s %-5s %6s %8d" % ("TOTAL", "", "", total))
    print()
    for dev, budget in sorted(BUDGET.items()):
        share = 100.0 * total / budget
        flag = "ok" if share < 55 else ("tight" if share < 80 else "OVER")
        print("  %-5s variable budget %6d bytes  data is %5.1f%%  %s" % (dev, budget, share, flag))

    dropped = [
        ("full stories/sources", "carried: %d chars per feature" % args.fact_chars
         if args.fact_chars else "dropped (--fact-chars N to carry them)"),
        ("state tints + 3D terrain", "the section screen's profile is the terrain on a 1-bit LCD"),
        ("views / search / minimap", "camera moves and DOM panels; the keypad is the interface"),
        ("layer colours", "no colour on a 1-bit LCD; tier drives the line style instead"),
        ("three.js + OrbitControls", "691 KB of vendor code, replaced by core/*.c"),
    ]
    print()
    print("  not carried to the calculator:")
    for what, why in dropped:
        print("    %-26s %s" % (what, why))


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--xdc", default=str(REPO / "four-corners.xdc"))
    ap.add_argument("--quant", type=int, default=2000,
                    help="quantisation units per degree (default 2000 = 1/2000 deg)")
    ap.add_argument("--max-name", type=int, default=36)
    ap.add_argument("--max-kind", type=int, default=20)
    ap.add_argument("--fact-chars", type=int, default=64,
                    help="carry this many characters of each first fact (0 = none)")
    ap.add_argument("--report-only", action="store_true")
    args = ap.parse_args(argv)

    with tempfile.TemporaryDirectory(prefix="fcorner-xdc-") as tmp:
        data = read_xdc(Path(args.xdc), Path(tmp))
    built = convert(data, args)
    if not args.report_only:
        write_c(built, data, args)
    report(built, data, args)
    return 0


if __name__ == "__main__":
    sys.exit(main())
