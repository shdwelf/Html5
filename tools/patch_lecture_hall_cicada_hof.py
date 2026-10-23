#!/usr/bin/env python3
"""
patch_lecture_hall_cicada_hof.py — the 2026-10-23 pass over the Intelligence
Lecture Hall (backlog T12.1, shared with T10.2).

Status: **already applied** to the bundle on 2026-10-23. Kept, like the
earlier lecture-hall patch tools, because the record otherwise exists only
as text spliced into a 1 MB single-file app, and this is the reviewable
source of that text plus the only way to re-derive the edit against a clean
copy of the bundle. Every anchor is asserted to occur exactly once, so the
tool cannot double-apply.

What this pass does
  * adds ONE record — `cicada-3301-hall-of-fame` (hall: 33 -> 34) — the
    Hall-of-Fame induction for the 2012 Cicada geographic/web layer,
    companion to the existing `cicada-3301` signature-discipline record.
    Content rests entirely on the public historical record assembled in
    docs/cicada-3301-qr-locations-2026-10-23.md and
    docs/warrick-cicada-recovery-2026-10-23.md: no QR payloads, no onion
    addresses, no puzzle solution material.

After running this, bump the record count in tools/verify_lecture_hall.mjs
from 33 to 34 and add `cicada-3301-hall-of-fame` to the RAISED list (both
done in the same commit). See docs/cicada-3301-hall-of-fame-lecture-2026-10-23.md.
"""
import json
import os
import sys

APP = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "apps",
    "Cipher-Machines-and-Cryptology-Suite-2026-08-02 (1).html",
)


def js(value):
    """A JS string literal from a Python str (single-quote-safe, no raw quotes)."""
    return json.dumps(value, ensure_ascii=False)


def record(rid, title, period, location, confidence, summary, facts, links, caution):
    parts = [
        f'id:"{rid}"',
        f"title:{js(title)}",
        f"period:{js(period)}",
        f"location:{js(location)}",
        f"confidence:{js(confidence)}",
        f"summary:{js(summary)}",
        "facts:[" + ",".join(js(f) for f in facts) + "]",
        "sourceLinks:["
        + ",".join("{" + f"label:{js(l)},url:{js(u)}" + "}" for l, u in links)
        + "]",
        f"caution:{js(caution)}",
    ]
    return "{" + ",".join(parts) + "}"


# ------------------------------------------------------------------ the record

R_CICADA_HOF = record(
    "cicada-3301-hall-of-fame",
    "Hall of Fame — Cicada 3301 (2012): the hunt that left the screen and walked the planet",
    "4 January 2012 – April 2017 · the posters of January 2012 are all long gone",
    "Fourteen coordinate sites — Warsaw, Paris, Seattle, Seoul, Fayetteville, Chino, New Orleans, Miami, Haleiwa, Sydney — and one countdown web page",
    "Community archive",
    "Induction record for the puzzle this hall already studies for its signature discipline (the "
    "cicada-3301 record). This companion honours the other half of the phenomenon: the week in "
    "January 2012 when the hunt left the screen, published fourteen sets of GPS coordinates, and "
    "sent strangers to street furniture on four continents to photograph paper posters before the "
    "weather took them. Almost everything about that layer is now gone — which is precisely why it "
    "belongs in a hall about provenance: what survives is a chain of public, checkable acts of "
    "retrieval, and the lesson that a puzzle can be a geographic event as well as a cryptographic one.",
    [
        "Chronology of the physical turn: the first puzzle was posted to 4chan on 4 January 2012; five "
        "days later, on 9 January 2012 at 17:00 UTC, a countdown page on the puzzle's website published "
        "fourteen GPS coordinates with the instruction to find the cicada symbol at the location "
        "nearest you.",
        "What waited at the coordinates: paper posters bearing the cicada glyph and a QR code, taped to "
        "poles and street furniture — the puzzle's only physical artefacts, and deliberately "
        "perishable ones.",
        "Solver matrices — the community's own outcome ledgers — mark five of the fourteen posters as "
        "FOUND and photographed: Oleandrów 6 in Warsaw; 89–91 Rue de la Plaine in Paris; West Dickson "
        "Street in Fayetteville, Arkansas; Southwest 152nd Avenue in Miami; and Banghwa-dong, "
        "Gangseo-gu, Seoul.",
        "Two of the fourteen coordinates — Gangseo-gu in Seoul and Fayetteville — appeared only on the "
        "website, never in the puzzle's signed data files; both posters were retrieved anyway, which is "
        "part of why the episode is so completely documented.",
        "The other twelve coordinates were also carried in the puzzle's OutGuess payload data, so the "
        "geographic layer was announced simultaneously through the signed channel and the public web — "
        "the same provenance discipline the cicada-3301 record verifies from the signature bytes.",
        "The fourteen sites span Warsaw, Paris, Seattle, Seoul, Fayetteville, Chino, New Orleans, "
        "Miami, Haleiwa and Sydney: a puzzle staged simultaneously on four continents, at a scale no "
        "later round attempted to repeat in physical space.",
        "Every one of the 2012 posters is gone — removed, weathered or cleaned away within years of "
        "the event — so the physical layer survives only as dated photographs, contemporaneous solver "
        "reports and archived copies of the countdown page.",
        "The web layer is recoverable in principle and only in part: web archives hold captures of the "
        "public pages, and this repository specifies a Warrick-method recovery plan for them "
        "(Memento/Wayback discovery, seed-scoped crawling, BagIt packaging) — while the puzzle's later "
        "onion-service stages left no archived copies at all and are unrecoverable by design.",
        "Why a Hall of Fame: this is the rare internet mystery whose evidence trail is public, "
        "timestamped and independently re-checkable — coordinates anyone can still visit, photographs "
        "anyone can still compare — and whose authors then vanished, leaving the record, rather than a "
        "solution, as the artefact.",
    ],
    [
        ("Wikipedia — Cicada 3301", "https://en.wikipedia.org/wiki/Cicada_3301"),
        ("scream314/cicada3301 — mirrored 2012 coordinate list (GitHub)", "https://github.com/scream314/cicada3301"),
        ("Warrick — recover lost websites from the web infrastructure (GitHub, ODU Web Science and Digital Libraries)", "https://github.com/oduwsdl/warrick"),
        ("RFC 7089 — HTTP Framework for Time-Based Access to Resource States (Memento)", "https://www.rfc-editor.org/rfc/rfc7089"),
        ("Internet Archive — Wayback Machine", "https://web.archive.org/"),
    ],
    "Poster outcomes rest on solver-community matrices, not on the issuers, who never confirmed "
    "individual retrievals; FOUND means a poster was photographed and reported by solvers, and at "
    "least one listed site (the second Paris coordinate, Rue des Maraîchers) is recorded as not "
    "recovered. Coordinates and outcomes here are the public historical record of a 2012 event: no QR "
    "payloads, onion addresses or puzzle solution material are reproduced, and the later Liber Primus "
    "remains unsolved and untouched. The original posters are gone; any party displaying or selling "
    "an 'original' 2012 poster should be treated as unverified.",
)

# ------------------------------------------------------------------- the edits

EDITS = [
    # 1. append the record at the end of the hall's data array Pc
    (
        'wrong copy-paste."}],Vv=[',
        'wrong copy-paste."},' + R_CICADA_HOF + "],Vv=[",
    ),
]


def main():
    if "cicada-3301-hall-of-fame" in open(APP, encoding="utf-8").read():
        print("FAIL: record already present (patch cannot double-apply)")
        sys.exit(1)
    src = open(APP, encoding="utf-8").read()
    original = src
    for i, (old, new) in enumerate(EDITS, 1):
        n = src.count(old)
        if n != 1:
            print(f"FAIL edit {i}: anchor found {n} times (need exactly 1)")
            sys.exit(1)
        src = src.replace(old, new, 1)
    open(APP, "w", encoding="utf-8").write(src)
    print(f"OK · bundle {len(original)} → {len(src)} bytes ({len(src) - len(original):+d})")


if __name__ == "__main__":
    main()
