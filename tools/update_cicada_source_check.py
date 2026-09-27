#!/usr/bin/env python3
"""
Safely extend the Cicada 3301 record with the 2026-09-27 April-2017 source check.

The lecture hall is a minified, single-file app. This tool changes only the
`cicada-3301` record, refuses to run twice, and writes atomically. It records
what the published bytes prove (packet structure and issuer ID) separately from
what still requires a trusted public key (RSA verification and human identity).
"""
from __future__ import annotations

import json
import os
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "apps" / "Cipher-Machines-and-Cryptology-Suite-2026-08-02 (1).html"


def js(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def find_record(src: str, rid: str) -> tuple[int, int]:
    marker = f'id:"{rid}"'
    if src.count(marker) != 1:
        raise SystemExit(f"FAIL: {marker} occurs {src.count(marker)} times")
    start = src.rfind("{", 0, src.index(marker))
    depth = 0
    quoted = False
    escaped = False
    for i in range(start, len(src)):
        c = src[i]
        if quoted:
            if escaped:
                escaped = False
            elif c == "\\":
                escaped = True
            elif c == '"':
                quoted = False
            continue
        if c == '"':
            quoted = True
        elif c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return start, i + 1
    raise SystemExit(f"FAIL: could not bracket-match {rid}")


def array_range(src: str, rid: str, field: str) -> tuple[int, int]:
    lo, hi = find_record(src, rid)
    marker = f"{field}:["
    pos = src.find(marker, lo, hi)
    if pos < 0:
        raise SystemExit(f"FAIL: {rid}.{field} is missing")
    open_at = pos + len(marker) - 1
    depth = 0
    quoted = False
    escaped = False
    for i in range(open_at, hi):
        c = src[i]
        if quoted:
            if escaped:
                escaped = False
            elif c == "\\":
                escaped = True
            elif c == '"':
                quoted = False
            continue
        if c == '"':
            quoted = True
        elif c == "[":
            depth += 1
        elif c == "]":
            depth -= 1
            if depth == 0:
                return open_at, i + 1
    raise SystemExit(f"FAIL: could not bracket-match {rid}.{field}")


def quoted_bounds(src: str, lo: int, hi: int, needle: str) -> tuple[int, int]:
    pos = src.find(needle, lo, hi)
    if pos < 0:
        raise SystemExit(f"FAIL: anchor not found: {needle}")
    if src.find(needle, pos + 1, hi) >= 0:
        raise SystemExit(f"FAIL: anchor is not unique: {needle}")
    a = pos
    escaped = False
    while a >= lo:
        if src[a] == '"' and (a == 0 or src[a - 1] != "\\"):
            break
        a -= 1
    b = pos
    escaped = False
    while b < hi:
        if src[b] == '"' and (b == 0 or src[b - 1] != "\\"):
            break
        b += 1
    if a < lo or b >= hi:
        raise SystemExit(f"FAIL: could not find string bounds for: {needle}")
    return a, b + 1


def replace_fact(src: str, old_needle: str, new_fact: str) -> str:
    lo, hi = find_record(src, "cicada-3301")
    a, b = quoted_bounds(src, lo, hi, old_needle)
    replacement = js(new_fact)
    if replacement in src:
        raise SystemExit("FAIL: replacement fact already exists; update was already applied")
    return src[:a] + replacement + src[b:]


def append_items(src: str, field: str, items: list[str]) -> str:
    lo, hi = array_range(src, "cicada-3301", field)
    close = hi - 1
    for item in items:
        if item in src:
            raise SystemExit(f"FAIL: item already exists in cicada-3301.{field}")
    separator = "," if src[close - 1] != "[" else ""
    return src[:close] + separator + ",".join(items) + src[close:]


def replace_caution(src: str, new_caution: str) -> str:
    lo, hi = find_record(src, "cicada-3301")
    a, b = quoted_bounds(src, lo, hi, "Cicada 3301 has no owner")
    replacement = js(new_caution)
    if replacement in src:
        raise SystemExit("FAIL: caution replacement already exists; update was already applied")
    return src[:a] + replacement + src[b:]


APRIL_FACT = (
    "Source check of the April 2017 artefact against the surviving primary transcription: "
    "Pastebin labels it 4 April 2017 and preserves the exact cleartext “Beware false paths.  "
    "Always verify PGP signature from 7A35090F.  3301” plus the signature prefix. Parsing that "
    "prefix here yields an old-format Tag 2 packet of declared length 540, v4 canonical-text "
    "signature, RSA (algorithm 1), SHA-512 (algorithm 10), a 4096-bit RSA MPI, issuer "
    "181F01E57A35090F, and creation time 2017-04-04 23:23:28 UTC. This is a structural and "
    "provenance check, not a replacement for RSA verification against the public key."
)

RFC_FACT = (
    "RFC 4880 §6.2 resolves the April anomaly more precisely than the old wording did. Armor "
    "headers are part of the armor, not part of the message, and are not protected by signatures; "
    "therefore Version: CicadaPG v.3301 is an encoder label, not an authenticity signal. RFC 4880 "
    "§7 describes Hash: SHA512 as the cleartext-signature header, while the embedded packet's hash "
    "algorithm byte is the authoritative machine-readable field — here both say SHA-512. The "
    "custom-looking Version value is consistent with an out-of-tree encoder, but it neither proves "
    "nor disproves who controlled the signing key. The correct conclusion is narrowed, not solved."
)

CAUTION = (
    "Cicada 3301 has no owner, no institutional archive and no attributed author, so nearly "
    "everything about it arrives through community mirrors and secondary reporting. The April 2017 "
    "Pastebin is a primary artefact for its posted bytes and date, but this repository parses the "
    "packet header and issuer ID; it does not bundle a trusted public key or pretend to re-run RSA "
    "verification. It therefore records continuity of the published key ID, not proof of a human "
    "author. RFC 4880 says the Version armor header is outside the signed content, so “CicadaPG "
    "v.3301” cannot authenticate the signer. Nothing here endorses an intelligence-agency theory, "
    "and the Liber Primus is recorded as unfinished rather than as a mystery with a withheld ending."
)

LINKS = [
    '{label:"Pastebin — Message from 3301/Cicada, posted 4 April 2017 (raw signed text)",url:"https://pastebin.com/yEiTHhvF"}',
    '{label:"RFC 4880 §§6.2 and 7 — armor headers and the cleartext signature framework",url:"https://www.rfc-editor.org/rfc/rfc4880.html"}',
]


def main() -> None:
    src = APP.read_text(encoding="utf-8")
    src = replace_fact(src, "An anomaly recorded rather than resolved:", APRIL_FACT)
    src = append_items(src, "facts", [js(RFC_FACT)])
    src = append_items(src, "sourceLinks", LINKS)
    src = replace_caution(src, CAUTION)

    fd, temp_name = tempfile.mkstemp(prefix=APP.name + ".", dir=APP.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8", newline="") as out:
            out.write(src)
        os.replace(temp_name, APP)
    finally:
        if os.path.exists(temp_name):
            os.unlink(temp_name)
    print("Updated cicada-3301 with April 2017 packet and RFC 4880 source checks")


if __name__ == "__main__":
    main()
