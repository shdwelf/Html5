#!/usr/bin/env python3
"""Refresh the embedded Kr0meCorp lecture-hall note with primary-source evidence.

The single-file cipher suite keeps this monograph inside a minified inline
script. This patch is intentionally narrow: it replaces the one stale paragraph
that claimed the riddle transcript was unrecovered, and refuses reapplication.
See docs/openrce-iso-kr0me-riddle-vcl-2026-11-01.md for the source review.
"""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "apps/Cipher-Machines-and-Cryptology-Suite-2026-08-02 (1).html"
OLD = (
    'What has **not** been recovered is equally important: no primary Kr0meCorp '
    'page, screenshot, file listing, author identity, exact publication date, or '
    'riddle transcript has surfaced in the sources reviewed. No evidence connects '
    'the site to +ORC, +HCU, or Fravia. Until such material appears, claims about '
    'a “Kr0meCorp riddle” cannot be reproduced responsibly.'
)
NEW = (
    '### The recovered Kr0meCorp riddle\n'
    'The earlier claim that no primary riddle transcript had surfaced is superseded '
    'by a SHA-1-gated Wayback capture of members.tripod.com/~retrotech/hidden.html '
    '(1998-12-06 00:43:51 UTC; expected digest '
    'MMOS2TQI5722PUSYVTROIMSZEYIJH5G4). The page asks for four numbers forming '
    'an IP address and says their order is given by the riddle, then reads:\n\n'
    '> Follow the path of the one who hath her face covered;\n'
    '> clothed in white, holding in her left hand, four keys.\n'
    '> One is the red Servant, contrary to the King;\n'
    '> One is the white Jayre; dying, and recreated;\n'
    '> One is the Camelion; something more sublime\n'
    '> than the King, the last One; but fugitive.\n'
    '> — Kv QW n df\n\n'
    'The order-corrected alchemical/atomic-number reading is 47.26.47.80 '
    '(silver/Moon, iron/Mars, silver/Moon, mercury). This is a candidate, not a '
    'confirmed solution: the earlier 26.47.79.80 reading wrongly treats the King '
    'as one of the four figures and violates the ordering hint. The hunt found no '
    'publicly posted solution; the pointer kr0mecorp.home.ml.org died with the '
    'Monolith service, so the case remains OPEN and even a correct address cannot '
    'be checked against the vanished target. The transcript and candidate are '
    'documented in docs/dss-casefiles-riddle-warrick.md and js/krome-catalog.js.\n\n'
    '### Related RCE CD lead — not an OpenRCE.org ISO\n'
    'The Internet Archive preserves ReverseCodeEngineeringRceCdsandman2000.iso, '
    'a 2000 +sandman/newbies-forum compilation described as 50+ reverse-engineering '
    'web pages from circa 1999–2000. Its catalog metadata lists 712,343,552 bytes '
    'and SHA-1 b12b847879f5ac22d830be9085f1a98ffe08b99c. This is a related period '
    'source, but not named openrce.iso: OpenRCE.org says it launched in 2005, and '
    'the CD contents have not been inspected here. No connection between that '
    'disc and the Kr0meCorp riddle is established. Keep this as an unverified '
    'research lead, not as riddle evidence.'
)


def record_range(source: str, record_id: str) -> tuple[int, int]:
    marker = f'id:"{record_id}"'
    if source.count(marker) != 1:
        raise SystemExit(f"Expected one {record_id} record, found {source.count(marker)}")
    start = source.rfind("{", 0, source.index(marker))
    depth = 0
    quote = None
    i = start
    while i < len(source):
        char = source[i]
        if quote:
            if char == "\\":
                i += 2
                continue
            if char == quote:
                quote = None
        elif char in "\"'`":
            quote = char
        elif char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return start, i + 1
        i += 1
    raise SystemExit(f"Could not parse the {record_id} record")


def main():
    source = APP.read_text(encoding="utf-8")
    lo, hi = record_range(source, "art-reverse-lore")
    record = source[lo:hi]
    if OLD in record:
        record = record.replace(OLD, NEW, 1)
    elif NEW not in record:
        raise SystemExit("Expected stale Kr0meCorp paragraph not found; refusing to guess")
    if "MMOS2TQI5722PUSYVTROIMSZEYIJH5G4" not in record or "not an OpenRCE.org ISO" not in record:
        raise SystemExit("Monograph evidence check failed")
    source = source[:lo] + record + source[hi:]

    # Add the disc as a clearly unrelated lead to the structured Intelligence
    # Lecture Hall record too; its presence must not imply that the ISO contains the
    # riddle. Preserve the hall's existing primary-source confidence and verdict.
    lo, hi = record_range(source, "kr0mecorp")
    hall_record = source[lo:hi]
    new_fact = (
        '"Related RCE CD lead, not riddle evidence: Internet Archive item '
        'ReverseCodeEngineeringRceCdsandman2000.iso is credited to +sandman and '
        'described as a 2000 compilation of 50+ reverse-engineering pages from '
        'circa 1999–2000; metadata SHA-1 b12b847879f5ac22d830be9085f1a98ffe08b99c. '
        'It is not named openrce.iso, OpenRCE.org launched in 2005, and the disc '
        'contents have not been inspected or linked to Kr0meCorp."'
    )
    old_last_fact = (
        '"The full dossier, recovery console and Ghidra pipeline live in this '
        'repository’s CASEFILES lab (casefiles.html)"'
    )
    if new_fact not in hall_record:
        if hall_record.count(old_last_fact) != 1:
            raise SystemExit("Could not uniquely locate the final Kr0meCorp hall fact")
        hall_record = hall_record.replace(old_last_fact, new_fact + "," + old_last_fact, 1)

    new_link = (
        '{label:"RCE CD +sandman 2000 — metadata only; contents not inspected",'
        'url:"https://archive.org/metadata/ReverseCodeEngineeringRceCdsandman2000"}'
    )
    link_anchor = (
        '{label:"CASEFILES lab — hash-gated recovery + Ghidra",'
        'url:"https://github.com/shdwelf/Html5/blob/arena/01a098c1-html5/casefiles.html"}'
    )
    if new_link not in hall_record:
        if hall_record.count(link_anchor) != 1:
            raise SystemExit("Could not uniquely locate the CASEFILES source link")
        hall_record = hall_record.replace(link_anchor, link_anchor + "," + new_link, 1)

    if (
        "47·26·47·80" not in hall_record or
        "MMOS2TQI5722PUSYVTROIMSZEYIJH5G4" not in hall_record or
        "It is not named openrce.iso" not in hall_record or
        not any(term in hall_record for term in ("never confirmed", "not confirmed"))
    ):
        raise SystemExit("Lecture-hall evidence check failed")
    source = source[:lo] + hall_record + source[hi:]
    APP.write_text(source, encoding="utf-8")
    print(f"Updated {APP.relative_to(ROOT)}: synced archive monograph and added qualified RCE CD lead to the lecture hall")


if __name__ == "__main__":
    main()
