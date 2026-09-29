#!/usr/bin/env python3
"""
patch_lecture_hall_packers.py — the 2026-09-29 (round 2) pass over the
Intelligence Lecture Hall.

Status: **already applied** to the bundle. Kept for the same reason the earlier
lecture-hall patch tools are kept: the record otherwise exists only as ~7 kB of
text spliced into a 1 MB minified file, and this is the reviewable source of
that text plus the only way to re-derive the edit against a clean copy of the
bundle. Every anchor is asserted to occur exactly once, so the tool cannot
double-apply.

What this pass does
  * adds ONE record — `dos-packer-obfuscation` (hall: 25 -> 26) — on the
    obfuscation layers inside DOS executable compressors and LucasArts game
    resources, and specifically on the failure mode that makes them a
    cryptology lesson rather than a file-format lesson: BOTH ciphers involved
    are constructions in which a WRONG KEY STILL PRODUCES PLAUSIBLE OUTPUT.

Why it belongs in this hall
  The hall's standing rule is that anything computable must be computed, not
  quoted. These two ciphers are the sharpest argument for that rule in the
  collection, because eyeballing the output is an actively misleading test:
    - PKLITE's stub is decrypted by a backwards running-XOR chain keyed on the
      previous CIPHERTEXT word. That is self-synchronising, so only the first
      word depends on the key. A wrong key corrupts exactly one word out of
      216 and the rest disassembles as clean, sensible 8086 code.
    - SCUMM's resource files are a single-byte whole-file XOR, and its room
      NAMES carry a second, different XOR. Break only the first and you get a
      perfectly valid block tree with garbled names — right structure, wrong
      content, no error anywhere.
  Both were actually got wrong during this work before being caught by a
  computed check, which is the evidence the record rests on.

After running this, bump the record count in tools/verify_lecture_hall.mjs from
25 to 26 and add `dos-packer-obfuscation` to the RAISED list (both done in the
same commit). See docs/exe-compressors-and-scumm.md for the research, and
tools/pklite.py / tools/scumm.py for the executable proofs.
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

R_PACKERS = record(
    "dos-packer-obfuscation",
    "Ciphers that fail silently: PKLITE's self-decrypting stub and the LucasArts XOR",
    "PKLITE 1990\u201393 (PKWARE) \u00b7 SCUMM v5 1991\u201394 (LucasArts) \u00b7 re-derived 2026",
    "MS-DOS executable compressors and game resource files",
    "Primary archive",
    "Two shipping-product obfuscations from the same few years, chosen because they share one property that "
    "matters more than either format: a wrong key still produces output that looks right. PKLITE hides its own "
    "decompressor behind a running-XOR chain keyed on the previous ciphertext word, which makes the chain "
    "self-synchronising \u2014 only the first word depends on the key at all. LucasArts XORs its whole resource file "
    "with one byte and then XORs the room names again with a different one, so breaking the outer layer yields a "
    "structurally perfect file full of garbage text. Neither cipher ever reports an error. Both were got wrong "
    "during this reconstruction and caught only by a computed check, which is exactly the hall's rule about "
    "computing rather than quoting.",
    [
        "PKLITE's stub is encrypted with a backwards running-XOR chain: std, then lodsw / xchg ax,dx / xor ax,dx / stosw, walking DOWNWARDS in place over 216 words. The key for each word is the previous CIPHERTEXT word, and the initial key is a mov dx,imm16 in the plaintext preamble.",
        "Because the key is ciphertext rather than plaintext, out[i] = C[i] XOR C[i-1] depends only on two adjacent words. Only the FIRST word depends on the initial key. The cipher is therefore self-synchronising, and that is the whole trap: decrypt from the wrong offset and every word in the overlap is still correct.",
        "Demonstrated, not asserted: the reconstruction first picked the wrong mov dx,imm16 \u2014 the int 21h/AH=9 \u201cnot enough memory\u201d message pointer (0x0118) instead of the real key (0x0317) \u2014 and the file still unpacked to a BYTE-IDENTICAL result, sha256 0a3e081f\u2026, because the single corrupted word lay outside the token stream. Nothing in the output would have revealed the error.",
        "A second silent trap in the same stub: PKLITE sets cs=0xFFF0 and relies on 20-bit segment wraparound, so the stub's segment base sits 0x100 BELOW the load image. The operand 0x2F6 means image offset 0x1F6. Decrypting at the unadjusted address produced a window shifted by 0x100 that \u2014 by the self-synchronising property \u2014 still disassembled as clean, plausible 8086 code.",
        "What finally pinned the geometry was a computable check rather than an eyeball: the decrypt loop's own exit branch (je 0x48) must land exactly on the first byte of the decrypted region, and with the corrected base it does, to the byte.",
        "PKLITE also obfuscates the compressed stream itself: every literal byte is XORed with the LIVE BIT-BUFFER COUNTER (DL, 1..16), a value that exists only inside the decoder's state machine. A decoder that does not model the counter cycle exactly emits garbage literals while matches keep working, so the output degrades gradually instead of failing.",
        "LucasArts SCUMM v5 ships an index (.000) and data (.001) file XORed whole with one constant byte \u2014 0x69 for Indiana Jones and the Fate of Atlantis. The key is recoverable from any known block tag, so it is key-less obfuscation, not encryption; the reconstruction recovers it from the root tag rather than hard-coding it, requiring all four tag bytes to agree.",
        "The second layer: room NAMES inside the RNAM table carry a further XOR of 0xFF. Break only the outer 0x69 and the container walks perfectly \u2014 LECF, LOFF, LFLF, ROOM all parse, sizes all check \u2014 while every name reads as mojibake. Right structure, wrong content, and no error raised anywhere.",
        "The payoff once both layers are off: the official Fate of Atlantis DEMO ships 10 rooms but its index carries the room-name table for the entire retail game, 96 entries, including the Barnett College suite (col-offi, col-hall, col-base, col-atti, col-stor, col-arch, col-catr) and the ending (end-volc, end-v2, endscene).",
        "Names of rooms stripped from the demo build keep a leading semicolon \u2014 a source-level comment marker that survived into a shipped retail artifact. Treated as a hypothesis and checked, not asserted: the set of rooms in the LOFF directory must equal the set of names WITHOUT the semicolon. It matches exactly, 10 for 10, and the LFLF block count agrees.",
        "Scale check on the older lesson in this hall: the same corpus work found that an LZEXE unpacker which had only ever been run on one file had that file's e_cs<<4 frozen into it as a constant (0x5B30). It worked on exactly one sample and silently corrupted every other, until a second sample existed. The corpus has since grown from 1 LZEXE sample to 13.",
    ],
    [
        ("Reconstruction and proofs \u2014 tools/pklite.py (stub decryption + v1.15 decoder, selftest)", "https://github.com/shdwelf/Html5/blob/main/tools/pklite.py"),
        ("Reconstruction and proofs \u2014 tools/scumm.py (XOR recovery, container walk, ';' verification)", "https://github.com/shdwelf/Html5/blob/main/tools/scumm.py"),
        ("Write-up \u2014 docs/exe-compressors-and-scumm.md", "https://github.com/shdwelf/Html5/blob/main/docs/exe-compressors-and-scumm.md"),
        ("PKWARE \u2014 company history (PKZIP/PKLITE, Phil Katz)", "https://www.pkware.com/about"),
        ("ScummVM \u2014 the SCUMM engine and its resource formats", "https://wiki.scummvm.org/index.php/SCUMM"),
        ("Internet Archive \u2014 Indiana Jones and the Fate of Atlantis playable demo (PLAYFATE)", "https://archive.org/details/msdos_PLAYFATE_shareware"),
        ("Internet Archive \u2014 X-COM: Terror From The Deep, PC Gamer demo disk image", "https://archive.org/details/PCGamerTerrorFromTheDeepDemo"),
    ],
    "Scope: the PKLITE decoder here covers v1.15 \u201cextra compression\u201d only. v1.20 decrypts but its decompressor "
    "layout differs and is NOT implemented \u2014 the tool fails loudly rather than emitting garbage. No third-party "
    "PKLITE reference implementation was available in this environment, so verification is internal consistency "
    "(exactly one paragraph-aligned start offset decodes to a clean end marker) plus content (strings present "
    "only after unpacking). The SCUMM finding is from one demo of one game; the ';' convention is verified for "
    "that build and should not be assumed across the SCUMM catalogue. Neither construction is encryption and "
    "neither was meant to be \u2014 they are obfuscation, and the point of the record is how quietly they fail, not "
    "how strong they are.",
)

# ------------------------------------------------------------------- the edits

EDITS = [
    # 1. append the record to the hall's data array Pc, after the kryptos entry
    (
        "the 2026 addition is fully processed.\"}],Vv=[",
        "the 2026 addition is fully processed.\"},"
        + R_PACKERS
        + "],Vv=[",
    ),
    # 2. widen the hall's scope line to name executable packers
    (
        ", internet puzzle hunts, archival provenance and institutional memory\"",
        ", internet puzzle hunts, archival provenance, executable packers and institutional memory\"",
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
    print(f"OK \u00b7 bundle {len(original)} \u2192 {len(src)} bytes ({len(src) - len(original):+d})")


if __name__ == "__main__":
    main()
