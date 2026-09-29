#!/usr/bin/env python3
"""
patch_lecture_hall_kryptos.py — the 2026-09-29 pass over the Intelligence
Lecture Hall.

Status: **already applied** to the bundle on 2026-09-29. Kept for the same
reason the earlier lecture-hall patch tools are kept: the record otherwise
exists only as ~9 kB of text spliced into a 1 MB minified file, and this is the
reviewable source of that text plus the only way to re-derive the edit against a
clean copy of the bundle. Every anchor is asserted to occur exactly once, so the
tool cannot double-apply.

What this pass does
  * adds ONE record — `kryptos-k4-smithsonian` (hall: 24 -> 25) — a
    provenance/"domain chain" source-check of Jim Sanborn's Smithsonian archive
    and the 2025 K4 plaintext recovery, built from the institution's own finding
    aid (AAA.sanbojim) and its machine-readable EAD rather than the press
    summaries of them
  * widens the hall's scope line to name archival provenance

After running this, bump the record count in tools/verify_lecture_hall.mjs from
24 to 25 and add `kryptos-k4-smithsonian` to the RAISED list (both done in the
same commit). See docs/lecture-hall-research-2026-09-29.md for the research and
docs/sanborn-suite-deep-dive.md / docs/source-check-2026-09-29.md for the K4
crypto facts this record rests on.
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

R_KRYPTOS = record(
    "kryptos-k4-smithsonian",
    "Kryptos K4: the plaintext that was read out of a Smithsonian filing cabinet, not broken",
    "1990 sculpture · donated 2023 & 2026 · found Sept 2025 · sold Nov 2025",
    "Smithsonian Archives of American Art (AAA.sanbojim), Washington DC · RR Auction, Boston · Paradigm",
    "Primary archive",
    "When journalists cracked Kryptos K4 in 2025 they did not break the cipher — they read it off scraps that "
    "artist Jim Sanborn had accidentally donated to the Smithsonian. This record walks the archive as a "
    "provenance chain and checks each link against the institution's own pages rather than the press summary of "
    "them: the public finding aid, the box and folder that actually held the plaintext charts, the discovery, "
    "the reported fifty-year seal, and the onward sale. The lesson for this hall is that a puzzle can fall to "
    "archival research long before it falls to cryptanalysis, and that a finding aid is a checkable primary source.",
    [
        "The archive is real, public and citable: the \u201cJim Sanborn papers, circa 1945\u20132024\u201d measure 16.1 linear feet at the Smithsonian\u2019s Archives of American Art (call number AAA.sanbojim); the finding aid\u2019s Immediate Source of Acquisition reads \u201cDonated in 2023 and 2026 by Jim Sanborn,\u201d processed by Ricky Gomez in 2024 and updated in 2026.",
        "The boxes: all Kryptos commission material sits in Series 3 (Commission Files), Box 6, under the heading \u201c\u201cKryptos\u201d CIA Headquarters\u201d \u2014 including \u201cCodes Research, circa 1980s\u2013circa 2002\u201d (6:11), five folders of \u201cCorrespondence, Attempts at Deciphering Codes\u201d (6:13\u201317), and the two that matter, \u201cCracked Codes and Charts, 1990\u2013circa 2013\u201d (6:18) and \u201cCracked Codes and Charts, circa 1999\u20132010\u201d (6:19).",
        "The 2026 addition to Series 3 is described in the finding aid as \u201cadditional articles, posters, charts, and correspondence related to \u2018Kryptos\u2019\u201d \u2014 the same word, charts, that the auction catalogue used when it noted \u201ccopies of coding charts used to code Kryptos (originals at the Smithsonian).\u201d",
        "The mechanism of the find, per Scientific American: Jarett Kobek flagged the catalogue\u2019s Smithsonian reference, Richard Byrne photographed the holdings on 2 September 2025, and Kobek then spotted five pages of scrambled text \u2014 the K4 plaintext Sanborn had cut into strips and taped out of order in 1990 for the CIA\u2019s Historical Intelligence content review, then donated by accident. Sanborn confirmed authenticity on 3 September 2025.",
        "Source-check on the \u201cseal\u201d: the press reported that Sanborn asked the Smithsonian to seal the files for fifty years, to 2075. But the finding aid\u2019s own EAD, generated 2026-09-24, still records \u201cConditions Governing Access: This collection is open for research.\u201d No fifty-year restriction is written into the document itself.",
        "Where the seal actually shows: the \u201cCracked Codes and Charts\u201d folders are still listed in the inventory as \u201cDigitized,\u201d yet the folder pages \u2014 live, and the 22 November 2025 Wayback capture alike \u2014 both display \u201cImage assets for this folder have not been fully processed.\u201d The page images that revealed K4 are no longer served online.",
        "Recovered is not solved: every party agrees the cipher method was never publicly broken. Kobek: \u201cThere\u2019s no way on earth that this is a cryptographic solve, and we have not claimed that.\u201d It was the auctioned material, not the archive, that carried the method.",
        "The provenance chain a researcher can walk without leaving a browser: finding aid at aaa.si.edu/collections/jim-sanborn-papers-22298, then the machine-readable EAD at sirismm.si.edu/EADs/AAA.sanbojim-ead.xml and the PDF at sirismm.si.edu/EADpdfs/AAA.sanbojim.pdf, then the per-folder pages under /series-3/box-6-folder-NN, then Wayback snapshots (collection 2024-02-27; series 2025-03-29; folder 2025-11-22).",
        "The onward custody chain: RR Auction\u2019s \u201cDecoding History\u201d sale (16 Oct\u201320 Nov 2025) sold the complete archive \u2014 handwritten K4 plaintext, the original K4 coding system, and the unpublished 1988 alternate K4 now called K5 \u2014 for $962,500; the anonymous buyer was revealed on 12 June 2026 as Paradigm, which verifies public K4 guesses by SHA-256\u2192HMAC (Google Cloud KMS) at $1 a submission without anyone reading the answer.",
        "Anchors versus reconstruction: EAST, NORTHEAST, BERLIN and CLOCK are artist-confirmed at positions 22\u201325, 26\u201334, 64\u201369 and 70\u201374; the circulating full reading \u201cTHE COMPASS ROSE IS HERE X \u2026\u201d is a community reconstruction (solvekryptos.com), clean English, not the sealed text. Sanborn clarified in November 2025 that \u201cBerlin Clock\u201d means the Weltzeituhr at Alexanderplatz, itself standing on a compass-rose mosaic.",
        "Same-name distractors the finding aid quietly disambiguates: photographs of a \u201cCode Room\u201d (Box 10:21) and a \u201cCompass Installation\u201d (Box 10:24) are separate photographic files, and Box 18:27 holds Chase Brandon\u2019s 2011 reproduction requests for his novel \u201cThe Kryptos Conundrum\u201d \u2014 none of these is the K4 key; only Box 6:18\u201319 held the charts.",
        "A documentary discrepancy, flagged not resolved: the finding aid\u2019s Arrangement note says the collection \u201cis arranged into twelve series,\u201d but both the HTML inventory and the EAD enumerate only eleven (Series 1\u201311, ending \u201cUnprocessed Born Digital Material,\u201d Box 14).",
    ],
    [
        ("Smithsonian Archives of American Art \u2014 Jim Sanborn papers, finding aid (AAA.sanbojim)", "https://www.aaa.si.edu/collections/jim-sanborn-papers-22298"),
        ("Smithsonian AAA \u2014 full container inventory (Series 3, Box 6 Kryptos folders)", "https://www.aaa.si.edu/collections/jim-sanborn-papers-22298/contents-arrangement"),
        ("Smithsonian AAA \u2014 machine-readable EAD XML (Conditions Governing Access)", "https://sirismm.si.edu/EADs/AAA.sanbojim-ead.xml"),
        ("Smithsonian AAA \u2014 finding aid PDF", "https://sirismm.si.edu/EADpdfs/AAA.sanbojim.pdf"),
        ("Scientific American \u2014 A Solution to the CIA\u2019s Kryptos Code Is Found after 35 Years", "https://www.scientificamerican.com/article/a-solution-to-the-cias-kryptos-code-is-found-after-35-years/"),
        ("RR Auction \u2014 Sanborn\u2019s complete Kryptos archive sells for $962,500", "https://content.rrauction.com/jim-sanborns-complete-kryptos-archive-sells-for-962500-at-auction/"),
        ("Paradigm \u2014 Project Kryptos (SHA-256\u2192HMAC submission verifier)", "https://www.paradigm.xyz/writing/kryptos"),
        ("Internet Archive Wayback Machine \u2014 archived finding-aid folder page (2025-11-22)", "https://web.archive.org/web/20251122141135/https://www.aaa.si.edu/collections/jim-sanborn-papers-22298/series-3/box-6-folder-10"),
    ],
    "Recovered is not solved: the K4 cipher method has never been publicly broken, and the authenticated "
    "plaintext is not public. The full 97-character reading quoted by solvers is a reconstruction that keeps "
    "the four artist-confirmed anchors, not the archive's text. The reported fifty-year seal is not written into "
    "the finding aid's access note \u2014 which still reads \u201copen for research\u201d in the 2026-09-24 EAD \u2014 it shows "
    "only as withdrawn page images. Box and folder numbers are transcribed from the finding aid and may shift as "
    "the 2026 addition is fully processed.",
)

# ------------------------------------------------------------------- the edits

EDITS = [
    # 1. append the record to the hall's data array Pc, after the f5-blackhat-2018 entry
    (
        'puzzle, not protection."}],Vv=[',
        'puzzle, not protection."},' + R_KRYPTOS + "],Vv=[",
    ),
    # 2. widen the hall's own scope line to name archival provenance
    (
        ", internet puzzle hunts and institutional memory\"",
        ", internet puzzle hunts, archival provenance and institutional memory\"",
    ),
]


def main():
    src = open(APP, encoding="utf-8").read()
    original = src
    for i, (old, new) in enumerate(EDITS, 1):
        n = src.count(old)
        if n != 1:
            print(f"FAIL edit {i}: anchor found {n} times (need exactly 1)")
            sys.exit(1)
        src = src.replace(old, new, 1)
    open(APP, "w", encoding="utf-8").write(src)
    print(f"OK · bundle {len(original)} \u2192 {len(src)} bytes ({len(src) - len(original):+d})")


if __name__ == "__main__":
    main()
