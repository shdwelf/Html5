#!/usr/bin/env python3
"""Add the source-graded Cicada laboratory pass to the bundled hall record.

The app is intentionally a single-file build. This updater is fail-loud so a
future pass cannot silently duplicate research facts or source links.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "apps" / "Cipher-Machines-and-Cryptology-Suite-2026-08-02 (1).html"

FACTS = [
    "Laboratory model, bounded by evidence: the public sequence behaves like a progressive cryptography laboratory — each gate tests a different capability (steganographic extraction, source-dependent book indexing, OpenPGP continuity, weak-parameter RSA, Tor deployment, and custom rune/numerical analysis). That is a description of the observable puzzle design, not proof of an intelligence service, employer, or author.",
    "The 2014 archive makes the practical chain explicit: recover a signed OutGuess payload; apply a book cipher whose edition is part of the key; solve a signed RSA/OAEP challenge with e = 65537; follow the resulting onion stage; peel more image/hex/OutGuess layers; then enter Liber Primus. The archive is a community transcription and reproducibility aid, not the publisher's original hosting or a chain-of-custody record.",
    "Tor belongs in the technique column, not the attribution column. The archived signed instruction asks solvers to create a Tor hidden service, accept CGI file uploads, and publish a GnuPG public key at /key.asc. That establishes an observable operational exercise; it does not identify who ran the service or why.",
    "Liber Primus is an open cryptanalysis corpus rather than proof of a complete solution: the community transcription separates LP1's 17 pages from LP2's 58 pages, records known Gematria Primus/rune substitutions, Atbash/reversal and Vigenère-like shifts, and prime/totient observations, and leaves the unresolved pages unresolved. Known plaintext is a positive control for a method, not permission to fill gaps with conjecture.",
    "Source check on the Think Tank claim: the earliest circulated email is explicitly described by the archive as modified and unsigned, so its recruitment and organizational language cannot authenticate itself. A later recovered copy preserves a purportedly verifiable PGP signature, which strengthens the artifact's integrity if independently verified, but community recovery still does not prove authorship, membership, or an intelligence connection.",
    "The defensible conclusion is methodological: Cicada's public artifacts can be studied as a staged cipher-machine laboratory with authentication, concealment, indexing, public-key, anonymous-transport, and manuscript-analysis controls. The evidence does not justify converting the laboratory model into a confirmed institutional identity.",
]

SOURCES = [
    {
        "label": "Community 2014 technical archive — OutGuess, book cipher, RSA/OAEP and onion stages",
        "url": "https://github.com/scream314/cicada3301/blob/master/2014.md",
    },
    {
        "label": "Community Liber Primus transcription — Gematria Primus, prime/totient notes and unresolved pages",
        "url": "https://github.com/scream314/cicada3301/blob/master/liber_primus.md",
    },
    {
        "label": "Uncovering Cicada — The Leaked Email, including modified/unsigned and later signed forms",
        "url": "https://uncovering-cicada.fandom.com/wiki/The_Leaked_Email",
    },
    {
        "label": "Uncovering Cicada — What Happened Part 1 (2014), secondary reconstruction of the Tor and cipher stages",
        "url": "https://uncovering-cicada.fandom.com/wiki/What_Happened_Part_1_(2014)",
    },
]


def js_string(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def main() -> None:
    text = APP.read_text(encoding="utf-8")
    start = text.find('{id:"cicada-3301"')
    if start < 0:
        raise SystemExit("cicada-3301 record not found")
    end = text.find("},{id:", start)
    if end < 0:
        raise SystemExit("end of cicada-3301 record not found")
    record = text[start:end]
    if "Laboratory model, bounded by evidence" in record:
        raise SystemExit("laboratory research already present; refusing to duplicate it")
    facts_at = "],sourceLinks:["
    marker = record.find(facts_at)
    if marker < 0:
        raise SystemExit("cicada facts/sourceLinks boundary not found")

    fact_text = ",".join(js_string(fact) for fact in FACTS)
    record = record[:marker] + "," + fact_text + record[marker:]
    source_text = ",".join(
        "{label:" + js_string(item["label"]) + ",url:" + js_string(item["url"]) + "}"
        for item in SOURCES
    )
    record = record.replace("],sourceLinks:[", "],sourceLinks:[" + source_text + ",", 1)
    APP.write_text(text[:start] + record + text[end:], encoding="utf-8")
    print(f"added {len(FACTS)} facts and {len(SOURCES)} source links to cicada-3301")


if __name__ == "__main__":
    main()
