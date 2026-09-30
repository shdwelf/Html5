#!/usr/bin/env python3
"""Convert socal-subsurface.xdc into the C data pack the calculators link against.

    python3 socal-calc/tools/xdc2c.py --xdc socal-subsurface.xdc

A .xdc is a webxdc bundle: a zip of HTML, CSS and ES modules. This converter
does not scrape it with regexes. It unzips the bundle, runs the app's own data
modules under node (tools/socal_dump.mjs), and emits

    core/socaldata.h    counts, quantisation constants, extern declarations
    core/socaldata.c    the tables themselves
    host/elevfix.h      elevation fixture, straight out of the app's geo module
    build/socaldata.json  the intermediate dump, for inspection

Everything is integer. lon/lat become u16 in units of 1/SC_Q degree measured
from a whole-milli-degree origin; depths stay in metres; corridor lengths are
the app's own pathKm() evaluated at conversion time; fire perimeters are the
app's own fireRing() decimated to a handful of vertices.

Prose is what gets left behind: facts and sources are megabytes of UTF-8 and a
TI-83 program variable tops out around 24 KB. Pass --fact-chars N to carry the
first sentence of each feature's first fact anyway (the 68k targets have room).
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
    "\u2032": "", "\u2033": "",
    "\u00d7": "X", "\u00f7": "/",
    "\u2248": "~", "\u2264": "<", "\u2265": ">",
    "\u00b0": " DEG", "\u00b2": "2", "\u00b3": "3",
    "&": " + ", "%": " PCT", "(": " ", ")": " ", "[": " ", "]": " ",
    ",": " ", ";": " ", "'": "", '"': "", "!": "", "?": "", "_": "-",
    "\u2026": "...", "=": "-", "<": " ", ">": " ", "|": " ", "@": " AT ",
    "$": " USD ", "\u00a0": " ",
}

TIERS = ["official", "community", "context"]

# Layer kinds the renderer knows about. "surface" is the terrain shell, which on
# a 1-bit LCD is the coastline plus the profile screen rather than a mesh.
KINDS = ["surface", "line", "node", "ring"]

# Per-device budget for the whole program variable, from devices.json ram_k and
# the documented maximum variable size of each model.
BUDGET = {"ti83": 24 * 1024, "ti89": 64 * 1024, "ti92": 64 * 1024}

# UI chrome. Not from the bundle — but it shares the bundle's string pool so
# core/app.c never has to spell a word out as a brace-list of char codes.
UI_LABELS = [
    ("SL_TITLE", "SOCAL SUBSURFACE"), ("SL_SUB", "4DWM NATIVE PORT"),
    ("SL_SOCAL", "SOCAL"), ("SL_SUBSURF", "SUBSURFACE"),
    ("SL_PRESS", "PRESS ANY KEY"), ("SL_MAP", "MAP"), ("SL_PROF", "SECTION"),
    ("SL_LAYERS", "LAYERS"), ("SL_DOS", "DOSSIER"), ("SL_INFO", "DEVICE"),
    ("SL_OFFICIAL", "OFFICIAL"), ("SL_COMMUNITY", "COMMUNITY"), ("SL_CONTEXT", "CONTEXT"),
    ("SL_TIER", "TIER "), ("SL_LAYER", "LAYER "), ("SL_KIND", "KIND "),
    ("SL_DEPTH", "DEPTH "), ("SL_LEN", "LEN "), ("SL_AREA", "AREA "),
    ("SL_KM", " KM"), ("SL_KM2", " KM2"), ("SL_M", " M"), ("SL_FT", " FT"),
    ("SL_LON", "LON "), ("SL_LAT", " LAT "), ("SL_TUN", "TUN "), ("SL_PCT", " PCT"),
    ("SL_811", "CALL 811 BEFORE YOU DIG"), ("SL_GEN", "GENERALIZED 5-15 KM"),
    ("SL_ELEV", "ELEV "), ("SL_MAX", "MAX "), ("SL_MIN", "MIN "),
    ("SL_TRANSECT", "W-E TRANSECT"), ("SL_ALONG", "ALONG ROUTE"),
    ("SL_ON", "ON"), ("SL_OFF", "OFF"), ("SL_VIS", "VIS "), ("SL_SLASH", "/"),
    ("SL_SITES", "SITES"), ("SL_CORR", "CORRIDORS"), ("SL_RINGS", "RINGS"),
    ("SL_VERTS", "VERTICES"), ("SL_LCD", "LCD "), ("SL_RAM", "RAM "),
    ("SL_XDC", "SOCAL-SUBSURFACE.XDC"), ("SL_QUANT", "1/2000 DEG GRID"),
    ("SL_SEA", "SEA"), ("SL_NONE", "NONE"), ("SL_ZOOM", "Z"), ("SL_SURF", "SURFACE"),
    ("SL_TI83", "TI-83"), ("SL_TI89", "TI-89"), ("SL_TI92", "TI-92"), ("SL_HOST", "HOST"),
    ("SL_Z80", "Z80"), ("SL_M68K", "M68K"), ("SL_LAYERSON", "LAYERS ON "),
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
        zf.extractall(workdir)
    if not shutil.which("node"):
        raise SystemExit("node is required: the converter runs the bundle's own ES modules")
    dump = ROOT / "tools" / "socal_dump.mjs"
    proc = subprocess.run([shutil.which("node"), str(dump), str(workdir)],
                          capture_output=True, text=True)
    if proc.returncode != 0:
        raise SystemExit("socal_dump.mjs failed:\n%s" % proc.stderr.strip())
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
    return int(math.floor(lo / floor_to) * floor_to * 1000)


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


def convert(data, args):
    pool = StringPool()
    tables = []          # (ctype, name, size_expr, values, comment)
    defines = []         # (name, value, comment)

    def table(ctype, name, size_expr, values, comment=None):
        tables.append((ctype, name, size_expr, values, comment))

    # ---------------------------------------------------------------- layers
    layers = list(data["layers"])
    have_fires = bool(data["fires"])
    have_def = bool(data["deformation"])
    if have_fires:
        layers.append({"id": "fires", "name": "Fire perimeters (generalized)",
                       "kind": "ring", "on": True})
    if have_def:
        layers.append({"id": "deform", "name": "InSAR deformation bowls",
                       "kind": "ring", "on": True})
    layer_ix = {l["id"]: i for i, l in enumerate(layers)}

    # ---------------------------------------------------------------- extent
    lons, lats = [], []
    for c in data["corridors"]:
        for lon, lat in c["path"]:
            lons.append(lon)
            lats.append(lat)
    for n in data["nodes"]:
        lons.append(n["lon"])
        lats.append(n["lat"])
    for lon, lat in data["coast"]:
        lons.append(lon)
        lats.append(lat)
    for f in data["fires"]:
        for lon, lat in (f["ring"] or [[f["lon"], f["lat"]]]):
            lons.append(lon)
            lats.append(lat)
    for d in data["deformation"]:
        lons.append(d["lon"])
        lats.append(d["lat"])

    quant = Quant(args.quant, choose_origin(lons), choose_origin(lats))
    span_lon = max(quant.lon(v) for v in lons)
    span_lat = max(quant.lat(v) for v in lats)

    # ------------------------------------------------------------ corridors
    pts, cor_off = [], []
    cor_layer, cor_tier, cor_depth, cor_km = [], [], [], []
    cor_name, cor_short, cor_tun, cor_fact = [], [], [], []
    for c in data["corridors"]:
        cor_off.append(len(pts) // 2)
        path = simplify(c["path"], args.simplify)
        for lon, lat in path:
            pts += [quant.lon(lon), quant.lat(lat)]
        cor_layer.append(layer_ix[c["layer"]])
        cor_tier.append(TIERS.index(c["tier"]))
        cor_depth.append(clamp_i16(round(c["depthM"])))
        cor_km.append(min(65535, int(round(c["km"]))))
        cor_name.append(pool.add(clip(c["name"], args.max_name)))
        cor_short.append(pool.add(clip(c["short"] or c["id"], args.max_short)))
        cor_tun.append(int(round(min(1.0, c["tunnelFraction"]) * 100)))
        cor_fact.append(pool.add(first_fact(c, args.fact_chars)))
    cor_off.append(len(pts) // 2)

    # ---------------------------------------------------------------- nodes
    kinds = sorted({n["kind"] for n in data["nodes"]})
    kind_name = [pool.add(clip(k, 12)) for k in kinds]
    nd_q, nd_layer, nd_tier, nd_depth, nd_name, nd_kind, nd_fact = [], [], [], [], [], [], []
    for n in data["nodes"]:
        nd_q += [quant.lon(n["lon"]), quant.lat(n["lat"])]
        nd_layer.append(layer_ix[n["layer"]])
        nd_tier.append(TIERS.index(n["tier"]))
        nd_depth.append(clamp_i16(round(n["depthM"])))
        nd_name.append(pool.add(clip(n["name"], args.max_name)))
        nd_kind.append(kinds.index(n["kind"]))
        nd_fact.append(pool.add(first_fact(n, args.fact_chars)))

    # ---------------------------------------------------------------- rings
    ring_pts, ring_off, ring_layer, ring_name, ring_val, ring_tier = [], [], [], [], [], []
    for f in data["fires"]:
        ring_off.append(len(ring_pts) // 2)
        ring = f["ring"] or circle(f["lon"], f["lat"], 5.0, data, 20)
        for lon, lat in ring:
            ring_pts += [quant.lon(lon), quant.lat(lat)]
        ring_layer.append(layer_ix["fires"])
        ring_tier.append(TIERS.index("community"))
        ring_name.append(pool.add(clip("%s %d" % (f["name"], f["year"]), args.max_name)))
        ring_val.append(min(65535, int(round(f["acres"] * data["acreKm2"]))))   # km2
    for d in data["deformation"]:
        ring_off.append(len(ring_pts) // 2)
        for lon, lat in circle(d["lon"], d["lat"], d["radiusKm"], data, 20):
            ring_pts += [quant.lon(lon), quant.lat(lat)]
        ring_layer.append(layer_ix["deform"])
        ring_tier.append(TIERS.index("community"))
        ring_name.append(pool.add(clip(d["name"], args.max_name)))
        ring_val.append(min(65535, int(round(math.pi * d["radiusKm"] ** 2))))
    ring_off.append(len(ring_pts) // 2)

    # ---------------------------------------------------------------- coast
    coast = []
    for lon, lat in data["coast"]:
        coast += [quant.lon(lon), quant.lat(lat)]

    # --------------------------------------------------------------- relief
    # rx/ry are degrees; store them in quant units so the field evaluator never
    # leaves integer space. rot is radians in the app and 1/16384 of a turn
    # here — Q14 keeps it inside i16 and still resolves to 0.022 degrees.
    relief = []
    for r in data["relief"]:
        relief += [
            quant.lon(r["lon"]), quant.lat(r["lat"]),
            max(1, int(round(r["rx"] * args.quant))),
            max(1, int(round(r["ry"] * args.quant))),
            clamp_i16(round(r["amp"])),
            int(round(r["rot"] / (2 * math.pi) * 16384)) % 16384,
        ]

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

    defines += [
        ("SC_NLAYER", len(layers), "layers, including the two overlay packs"),
        ("SC_NCOR", len(data["corridors"]), "corridors (polylines)"),
        ("SC_NNODE", len(data["nodes"]), "point sites"),
        ("SC_NRING", len(ring_off) - 1, "closed rings: fire perimeters + deformation bowls"),
        ("SC_NPT", len(pts) // 2, "corridor vertices"),
        ("SC_NRPT", len(ring_pts) // 2, "ring vertices"),
        ("SC_NCOAST", len(coast) // 2, "coastline vertices"),
        ("SC_NRELIEF", len(data["relief"]), "gaussian relief control features"),
        ("SC_NKIND", len(kinds), "distinct node kinds"),
        ("SC_STRB", len(pool.blob), "string pool bytes"),
        ("SC_Q", args.quant, "quantisation units per degree"),
        ("SC_LON_BASE_M", quant.lon_base_m, "lon origin, 1/1000 deg"),
        ("SC_LAT_BASE_M", quant.lat_base_m, "lat origin, 1/1000 deg"),
        ("SC_SPAN_LON", span_lon, "frame width in quant units"),
        ("SC_SPAN_LAT", span_lat, "frame height in quant units"),
        ("SC_CENTER_LON_M", center_lon_m, "projection centre, 1/1000 deg"),
        ("SC_CENTER_LAT_M", center_lat_m, "projection centre, 1/1000 deg"),
        ("SC_COSLAT_Q12", cos_lat_q12, "cos(centre latitude) in Q12"),
        ("SC_KMDEG_Q4", int(round(data["kmPerDegLat"] * 16)), "km per degree of latitude, Q4"),
        ("SC_TIER_OFFICIAL", 0, None),
        ("SC_TIER_COMMUNITY", 1, None),
        ("SC_TIER_CONTEXT", 2, None),
        ("SC_KIND_SURFACE", 0, None),
        ("SC_KIND_LINE", 1, None),
        ("SC_KIND_NODE", 2, None),
        ("SC_KIND_RING", 3, None),
    ]

    # ----------------------------------------- elevation / depth field, lifted
    geo = lift_geo_constants(data["geoSource"])
    max_t = 2 * (10240 ** 2)     # worst case u^2 + v^2 in Q16, see core/geo.c
    exp_mul, exp_shift = exp_index_scale(geo["gauss_k"], max_t)
    c = geo["frac_c"]
    span = max(span_lon, span_lat)
    m1l, s1l = turn_coeff(c[0], args.quant, span)
    m1a, s1a = turn_coeff(c[1], args.quant, span)
    m2l, s2l = turn_coeff(c[2], args.quant, span)
    m2a, s2a = turn_coeff(-c[3], args.quant, span)
    lon0 = quant.lon_base_m / 1000.0
    lat0 = quant.lat_base_m / 1000.0
    base1 = int(round((c[0] * lon0 + c[1] * lat0) / (2 * math.pi) * 65536))
    base2 = int(round((c[2] * lon0 - c[3] * lat0) / (2 * math.pi) * 65536))

    defines += [
        (None, None, "elevation + depth field, lifted from the bundle's socal-geo.js"),
        ("SC_ELEV_BASE", int(round(geo["elev_base"])), "metres before any relief"),
        ("SC_EXP_MUL", exp_mul, None),
        ("SC_EXP_SHIFT", exp_shift, "idx_q4 = (t_q16 * SC_EXP_MUL) >> SC_EXP_SHIFT"),
        ("SC_FRAC_AMP", int(round(geo["frac_amp"])), "metres per unit of the fractal term"),
        ("SC_FRAC1_BASE", base1, "Q16 turns at the frame origin"),
        ("SC_FRAC1_LON_M", m1l, None), ("SC_FRAC1_LON_S", s1l, None),
        ("SC_FRAC1_LAT_M", m1a, None), ("SC_FRAC1_LAT_S", s1a, None),
        ("SC_FRAC2_BASE", base2, None),
        ("SC_FRAC2_LON_M", m2l, None), ("SC_FRAC2_LON_S", s2l, None),
        ("SC_FRAC2_LAT_M", m2a, None), ("SC_FRAC2_LAT_S", s2a, None),
        ("SC_DEPTH_A_Q8", int(round(geo["depth_a"] * 256)), "depthY: mag = a + b*log10(1+|m|)"),
        ("SC_DEPTH_B_Q8", int(round(geo["depth_b"] * 256)), None),
        (None, None, "string-pool offsets for the UI chrome"),
    ]
    defines += [(name, off, None) for name, off in ui]

    table("const u16", "SC_PT", "SC_NPT * 2", pts, "corridor vertices, qlon/qlat pairs")
    table("const u16", "SC_COR_OFF", "SC_NCOR + 1", cor_off, "first vertex of each corridor")
    table("const u8", "SC_COR_LAYER", "SC_NCOR", cor_layer)
    table("const u8", "SC_COR_TIER", "SC_NCOR", cor_tier)
    table("const i16", "SC_COR_DEPTH", "SC_NCOR", cor_depth, "class-typical depth, metres")
    table("const u16", "SC_COR_KM", "SC_NCOR", cor_km, "length from the app's pathKm()")
    table("const u8", "SC_COR_TUN", "SC_NCOR", cor_tun, "tunnel fraction, percent")
    table("const u16", "SC_COR_NAME", "SC_NCOR", cor_name)
    table("const u16", "SC_COR_SHORT", "SC_NCOR", cor_short)
    table("const u16", "SC_COR_FACT", "SC_NCOR", cor_fact)
    table("const u16", "SC_NODE_Q", "SC_NNODE * 2", nd_q, "site positions, qlon/qlat pairs")
    table("const u8", "SC_NODE_LAYER", "SC_NNODE", nd_layer)
    table("const u8", "SC_NODE_TIER", "SC_NNODE", nd_tier)
    table("const u8", "SC_NODE_KIND", "SC_NNODE", nd_kind)
    table("const i16", "SC_NODE_DEPTH", "SC_NNODE", nd_depth)
    table("const u16", "SC_NODE_NAME", "SC_NNODE", nd_name)
    table("const u16", "SC_NODE_FACT", "SC_NNODE", nd_fact)
    table("const u16", "SC_RING_PT", "SC_NRPT * 2", ring_pts, "ring vertices, qlon/qlat pairs")
    table("const u16", "SC_RING_OFF", "SC_NRING + 1", ring_off)
    table("const u8", "SC_RING_LAYER", "SC_NRING", ring_layer)
    table("const u8", "SC_RING_TIER", "SC_NRING", ring_tier)
    table("const u16", "SC_RING_NAME", "SC_NRING", ring_name)
    table("const u16", "SC_RING_KM2", "SC_NRING", ring_val, "enclosed area, km2")
    table("const u16", "SC_COAST", "SC_NCOAST * 2", coast)
    table("const i16", "SC_RELIEF", "SC_NRELIEF * 6", relief,
          "qlon, qlat, rx_q, ry_q, amplitude_m, rotation in 1/16384 turn")
    table("const u16", "SC_LAYER_NAME", "SC_NLAYER", lay_name)
    table("const u8", "SC_LAYER_KIND", "SC_NLAYER", lay_kind)
    table("const u8", "SC_LAYER_ON", "SC_NLAYER", lay_on, "default visibility from the web app")
    table("const u16", "SC_KIND_NAME", "SC_NKIND", kind_name)
    table("const u8", "SC_STR", "SC_STRB", list(pool.blob), "0-terminated names, folded to the 3x5 font")

    return {
        "defines": defines, "tables": tables, "quant": quant, "layers": layers,
        "kinds": kinds, "pool": pool,
    }


def clamp_i16(v):
    return max(-32768, min(32767, int(v)))


N = r"(-?\d+(?:\.\d+)?)"


def lift_geo_constants(source: str) -> dict:
    """Pull the elevation/depth field's magic numbers out of socal-geo.js.

    They live inside function bodies, so they are not exported and cannot be
    read by importing the module. Scraping them here — and failing loudly when
    the shape changes — is what keeps the integer field in core/geo.c pinned to
    the bundle instead of to numbers that were true once.
    """
    want = {
        "base": r"let\s+e\s*=\s*" + N + r"\s*;",
        "gauss": r"\(\s*u\s*\*\s*u\s*\+\s*v\s*\*\s*v\s*\)\s*\*\s*" + N,
        "fractal": (r"e\s*\+=\s*" + N + r"\s*\*\s*\(\s*Math\.sin\(\s*lon\s*\*\s*" + N +
                    r"\s*\+\s*lat\s*\*\s*" + N + r"\s*\)\s*\+\s*Math\.sin\(\s*lon\s*\*\s*" + N +
                    r"\s*-\s*lat\s*\*\s*" + N + r"\s*\)\s*\)\s*\*\s*" + N),
        "depth": r"mag\s*=\s*" + N + r"\s*\+\s*" + N + r"\s*\*\s*Math\.log10",
    }
    got = {}
    for key, pattern in want.items():
        m = re.search(pattern, source)
        if not m:
            raise SystemExit(
                "xdc2c: socal-geo.js no longer matches the %r pattern.\n"
                "The elevation/depth field changed shape; update lift_geo_constants()\n"
                "and core/geo.c together, then re-run the fixture test." % key)
        got[key] = [float(g) for g in m.groups()]
    return {
        "elev_base": got["base"][0],
        "gauss_k": got["gauss"][0],
        "frac_amp": got["fractal"][0] * got["fractal"][5],
        "frac_c": got["fractal"][1:5],      # lon1, lat1, lon2, lat2 (lat2 is subtracted)
        "depth_a": got["depth"][0],
        "depth_b": got["depth"][1],
    }


def turn_coeff(coef_per_deg: float, per_deg_units: int, max_units: int):
    """coef (radians per degree) -> (multiplier, shift) giving Q16 turns per quant unit."""
    turns_per_unit = coef_per_deg / (2 * math.pi) / per_deg_units
    for shift in range(24, -1, -1):
        mul = int(round(turns_per_unit * (1 << 16) * (1 << shift)))
        if abs(mul) * max_units < (1 << 31) and mul != 0:
            return mul, shift
    raise SystemExit("cannot fit turn coefficient %g in 32 bits" % coef_per_deg)


def exp_index_scale(gauss_k: float, max_t_q16: int):
    """idx_q4 = (t_q16 * mul) >> shift, where idx_q4 is 16 * (table index)."""
    for shift in range(24, -1, -1):
        mul = int(round(gauss_k / 256.0 * (1 << shift)))
        if mul and mul * max_t_q16 < (1 << 31):
            return mul, shift
    raise SystemExit("cannot fit the gaussian index scale in 32 bits")


def first_fact(feature, limit):
    if limit <= 0:
        return ""
    facts = feature.get("facts") or []
    if not facts:
        return ""
    sentence = re.split(r"(?<=[.;])\s", facts[0])[0]
    return clip(sentence, limit)


def circle(lon, lat, radius_km, data, steps):
    km_deg = data["kmPerDegLat"]
    cos_lat = data["cosLat"]
    out = []
    for i in range(steps):
        th = 2 * math.pi * i / steps
        out.append([lon + (radius_km / km_deg / cos_lat) * math.cos(th),
                    lat + (radius_km / km_deg) * math.sin(th)])
    return out


def simplify(path, eps_deg):
    """Douglas-Peucker in lon/lat. eps_deg = 0 keeps every published vertex."""
    if eps_deg <= 0 or len(path) < 3:
        return path
    keep = [False] * len(path)
    keep[0] = keep[-1] = True
    stack = [(0, len(path) - 1)]
    while stack:
        a, b = stack.pop()
        if b <= a + 1:
            continue
        ax, ay = path[a]
        bx, by = path[b]
        dx, dy = bx - ax, by - ay
        den = math.hypot(dx, dy) or 1e-12
        worst, wi = 0.0, a
        for i in range(a + 1, b):
            px, py = path[i]
            d = abs(dy * px - dx * py + bx * ay - by * ax) / den
            if d > worst:
                worst, wi = d, i
        if worst > eps_deg:
            keep[wi] = True
            stack += [(a, wi), (wi, b)]
    return [p for p, k in zip(path, keep) if k]


# ------------------------------------------------------------------- writers

def write_c(built, data, args):
    defines, tables = built["defines"], built["tables"]
    origin = "socal-subsurface.xdc"

    head = [
        "/* GENERATED by socal-calc/tools/xdc2c.py from %s — do not edit." % origin,
        " *",
        " * Source of truth is the bundle, not this file. Regenerate with:",
        " *     make -C socal-calc data",
        " *",
        " * %d layers  %d corridors (%d vertices)  %d sites  %d rings (%d vertices)" % (
            len(built["layers"]), len([t for t in tables if t[1] == "SC_COR_LAYER"][0][3]),
            len([t for t in tables if t[1] == "SC_PT"][0][3]) // 2,
            len([t for t in tables if t[1] == "SC_NODE_LAYER"][0][3]),
            len([t for t in tables if t[1] == "SC_RING_LAYER"][0][3]),
            len([t for t in tables if t[1] == "SC_RING_PT"][0][3]) // 2),
        " * Positions are u16 in units of 1/%d degree; worst-case quantisation" % args.quant,
        " * error %.1f m, against a data pack documented as 5-15 km generalized." % built["quant"].max_err_m,
        " */",
    ]

    hdr = ["#ifndef SOCALDATA_H", "#define SOCALDATA_H", ""]
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

    body = ['#include "socal.h"', ""]
    for ctype, name, size, values, comment in tables:
        body.append(carr(ctype, name, size, values, comment=comment))
        body.append("")

    (ROOT / "core" / "socaldata.h").write_text("\n".join(head + [""] + hdr) + "\n")
    (ROOT / "core" / "socaldata.c").write_text("\n".join(head + [""] + body) + "\n")

    fix = data["elevationFixture"]
    fixture = [
        "/* GENERATED by socal-calc/tools/xdc2c.py — do not edit.",
        " * lon/lat in 1/1000 degree and the metres socal-geo.js elevationAt()",
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

    out_json = ROOT / "build" / "socaldata.json"
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
    print("  fire rings from     %s" % data["ringSource"])
    print("  quantisation        1/%d deg, worst case %.1f m "
          "(pack is documented as 5-15 km generalized)" % (args.quant, built["quant"].max_err_m))
    print("  frame               %d x %d quant units from %.3f, %.3f" % (
        [d[1] for d in built["defines"] if d[0] == "SC_SPAN_LON"][0],
        [d[1] for d in built["defines"] if d[0] == "SC_SPAN_LAT"][0],
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
        ("facts / sources prose", "carried: %d chars per feature" % args.fact_chars
         if args.fact_chars else "dropped (--fact-chars N to carry it)"),
        ("off-frame register", "%d entries, outside the frame by design" % len(data["offFrame"])),
        ("SAR swaths", "%d, schematic rectangles" % len(data["sarSwaths"])),
        ("CLUI captions", "%d, prose" % len(data["cluiCaptions"])),
        ("layer colours", "no colour on a 1-bit LCD; tier drives the dither instead"),
        ("three.js + OrbitControls", "691 KB of vendor code, replaced by core/*.c"),
    ]
    print()
    print("  not carried to the calculator:")
    for what, why in dropped:
        print("    %-26s %s" % (what, why))


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--xdc", default=str(REPO / "socal-subsurface.xdc"))
    ap.add_argument("--quant", type=int, default=2000,
                    help="quantisation units per degree (default 2000 = 1/2000 deg)")
    ap.add_argument("--max-name", type=int, default=36)
    ap.add_argument("--max-short", type=int, default=14)
    ap.add_argument("--fact-chars", type=int, default=0,
                    help="carry this many characters of each first fact (0 = none)")
    ap.add_argument("--simplify", type=float, default=0.0,
                    help="Douglas-Peucker epsilon in degrees (0 = keep every vertex)")
    ap.add_argument("--report-only", action="store_true")
    args = ap.parse_args(argv)

    with tempfile.TemporaryDirectory(prefix="socal-xdc-") as tmp:
        data = read_xdc(Path(args.xdc), Path(tmp))
    built = convert(data, args)
    if not args.report_only:
        write_c(built, data, args)
    report(built, data, args)
    return 0


if __name__ == "__main__":
    sys.exit(main())
