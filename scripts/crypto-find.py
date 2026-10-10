#!/usr/bin/env python3
"""
Encryption finder — the Ghidra "Find Crypt" concept, dependency-free.

Scans binaries for well-known cryptographic constants: block-cipher S-boxes and
round tables, hash init vectors and round constants, stream/base encodings, and
magic deltas. Each hit is reported with its file offset, so a match can be
cross-checked against the disassembly (scripts/dos-disasm.py) or a decompiler.

Signatures are searched in both byte orders where endianness is ambiguous
(x86 immediates are little-endian; network-order hash constants are big-endian),
so a 32-bit round constant is caught whether it sits in a data table or a mov.

  scripts/crypto-find.py BINARY [more...]
  scripts/crypto-find.py --md out.md BINARY ...
"""

import sys
import argparse

# --- byte-table signatures (searched verbatim) -------------------------------
AES_SBOX = bytes.fromhex(
    "637c777bf26b6fc53001672bfed7ab76ca82c97dfa5947f0add4a2af9ca472c0"
    "b7fd9326363ff7cc34a5e5f171d8311504c723c31896059a071280e2eb27b275"
)
AES_INV_SBOX = bytes.fromhex(
    "52096ad53036a538bf40a39e81f3d7fb7ce339829b2fff87348e4344c4dee9cb"
)
BASE64_STD = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
BASE64_URL = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
# CRC-32 (IEEE 802.3) table head: 0x00000000, 0x77073096, 0xEE0E612C, 0x990951BA
CRC32_TABLE = bytes.fromhex("000000007707309 6ee0e612c990951ba".replace(" ", ""))

# --- 32/64-bit constants (searched in both byte orders) ----------------------
CONST32 = {
    "MD5 T[0] 0xD76AA478": 0xD76AA478,
    "MD5 T[1] 0xE8C7B756": 0xE8C7B756,
    "MD5 init 0x67452301": 0x67452301,
    "SHA-1 H1 0xEFCDAB89": 0xEFCDAB89,
    "SHA-256 K[0] 0x428A2F98": 0x428A2F98,
    "SHA-256 H0 0x6A09E667": 0x6A09E667,
    "SHA-224 H0 0xC1059ED8": 0xC1059ED8,
    "Blowfish P[0] 0x243F6A88": 0x243F6A88,
    "Blowfish S0[0] 0x85DF6327": 0x85DF6327,
    "RC5/RC6 P32 0xB7E15163": 0xB7E15163,
    "RC5/RC6 Q32 / TEA delta 0x9E3779B9": 0x9E3779B9,
    "CAST-256 t 0xB7E15163": 0xB7E15163,
    "xxHash PRIME32_1 0x9E3779B1": 0x9E3779B1,
    "AES Te0[0] 0xC66363A5": 0xC66363A5,
    "DES S-box-ish 0x00808200": 0x00808200,
    "MD2 pi 0x29 (table)": 0x00000000,  # placeholder, skipped
}
CONST64 = {
    "SHA-512 K[0] 0x428A2F98D728AE22": 0x428A2F98D728AE22,
    "SHA-512 H0 0x6A09E667F3BCC908": 0x6A09E667F3BCC908,
}

del CONST32["MD2 pi 0x29 (table)"]


def orders(value, width):
    b = value.to_bytes(width, "big")
    return {b, b[::-1]}


def scan(path):
    data = open(path, "rb").read()
    hits = []
    for name, table in [("AES S-box", AES_SBOX), ("AES inverse S-box", AES_INV_SBOX),
                        ("Base64 std alphabet", BASE64_STD), ("Base64 url alphabet", BASE64_URL),
                        ("CRC-32 table", CRC32_TABLE)]:
        start = data.find(table)
        while start != -1:
            hits.append((start, name, "%d-byte table" % len(table)))
            start = data.find(table, start + 1)
    for name, val in CONST32.items():
        for pat in orders(val, 4):
            start = data.find(pat)
            while start != -1:
                hits.append((start, name, "const32 %s" % pat.hex()))
                start = data.find(pat, start + 1)
    for name, val in CONST64.items():
        for pat in orders(val, 8):
            start = data.find(pat)
            while start != -1:
                hits.append((start, name, "const64 %s" % pat.hex()))
                start = data.find(pat, start + 1)
    hits.sort()
    return {"path": path, "size": len(data), "hits": hits}


def render_md(results):
    out = ["# Encryption finder — crypto-constant scan", "",
           "Ghidra 'Find Crypt' concept, dependency-free. A hit is a known",
           "cryptographic constant at a file offset; confirm against the",
           "disassembly before concluding an algorithm is present.", ""]
    for r in results:
        name = r["path"].split("/")[-1]
        out.append("## %s — %d bytes, %d hit(s)" % (name, r["size"], len(r["hits"])))
        if not r["hits"]:
            out.append("_no known crypto constants_")
            out.append("")
            continue
        # Collapse repeated constants into a count + first offsets.
        agg = {}
        for off, nm, detail in r["hits"]:
            agg.setdefault(nm, []).append(off)
        out.append("| constant | count | first offset(s) |")
        out.append("| --- | --- | --- |")
        for nm, offs in sorted(agg.items(), key=lambda kv: -len(kv[1])):
            shown = ", ".join("`0x%X`" % o for o in offs[:6])
            out.append("| %s | %d | %s |" % (nm, len(offs), shown))
        out.append("")
    return "\n".join(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("binaries", nargs="+")
    ap.add_argument("--md", help="write a Markdown report here")
    args = ap.parse_args()
    results = [scan(b) for b in args.binaries]
    for r in results:
        print("%-26s %9d bytes  %d crypto hits" % (r["path"].split("/")[-1], r["size"], len(r["hits"])))
    if args.md:
        open(args.md, "w").write(render_md(results) + "\n")
        print("wrote %s" % args.md)


if __name__ == "__main__":
    main()
