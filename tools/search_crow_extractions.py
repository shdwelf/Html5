#!/usr/bin/env python3
"""Search structured 20-letter key candidates derived from the Crow poem.

This is deliberately a bounded, auditable search: it tests extraction rules
that preserve poem order and records rejects. It does not claim that arbitrary
subsets or anagrams are exhaustive.
"""
from itertools import combinations
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import secom_probe as probe  # noqa: E402

LINES = [
    "NEVER FORGET THE TOWN WE LOVED",
    "A TOWN BETRAYED BY STRANGERS",
    "NOT ONCE OR TWICE BUT THREE TIMES",
    "TO UNVEIL THE TRUTH AND SMELL OF GRIEF",
    "WE FOUND IN SACRED SOIL",
]
WORDS = [word for line in LINES for word in line.split()]


def clean(text):
    return probe.letters_only(text)


def add(candidates, label, text):
    text = clean(text)
    if len(text) == 20:
        candidates.setdefault(text, []).append(label)


def build_candidates():
    c = {}
    # Acrostic/telestich families: words and lines, preserving order.
    word_acrostic = ''.join(w[0] for w in WORDS)
    word_telestich = ''.join(w[-1] for w in WORDS)
    line_acrostic = ''.join(line[0] for line in LINES)
    line_telestich = ''.join(line[-1] for line in LINES)
    for name, stream in [
        ("word-acrostic", word_acrostic),
        ("word-telestich", word_telestich),
    ]:
        for i in range(len(stream) - 19):
            add(c, f"{name}[{i}:{i+20}]", stream[i:i+20])
    # First/last characters of each line and both directions.
    for a_name, a in [("line-acrostic", line_acrostic), ("line-telestich", line_telestich)]:
        for b_name, b in [("forward", a), ("reverse", a[::-1])]:
            # Extend short selectors with the line/word stream in either order.
            for stream_name, stream in [("words", word_acrostic), ("ends", word_telestich)]:
                add(c, f"{a_name}+{b_name}+{stream_name}", b + stream)
                add(c, f"{stream_name}+{a_name}+{b_name}", stream + b)

    # Every contiguous word span, and every line-internal span, exactly 20 letters.
    for start in range(len(WORDS)):
        for end in range(start + 1, len(WORDS) + 1):
            text = ''.join(WORDS[start:end])
            if len(text) >= 20:
                if len(text) == 20:
                    add(c, f"word-span[{start}:{end}]", text)
                break
    for line_no, line in enumerate(LINES):
        words = line.split()
        for start in range(len(words)):
            for end in range(start + 1, len(words) + 1):
                add(c, f"line-{line_no+1}-span[{start}:{end}]", ' '.join(words[start:end]))

    # The visible SECOM capitalization and meaningful phrase fragments.
    semantic = [
        "SECOM", "NEVER FORGET", "THE TOWN WE LOVED", "A TOWN",
        "BETRAYED BY STRANGERS", "NOT ONCE OR TWICE", "THREE TIMES",
        "UNVEIL THE TRUTH", "SMELL OF GRIEF", "SACRED SOIL",
        "THE OLD CROWS ARE ON THE WATCH", "THEY SEE AND COME",
    ]
    for phrase in semantic:
        p = clean(phrase)
        for i in range(max(1, 20 - len(p)), min(len(word_acrostic), 20) + 1):
            # Combine only poem-order prefixes/suffixes, retaining the phrase.
            add(c, f"SECOM-semantic:{phrase}+acrostic[{i}]", p + word_acrostic[:i])
            add(c, f"acrostic[{i}]+SECOM-semantic:{phrase}", word_acrostic[:i] + p)
        # Exact semantic spans with another semantic phrase.
        for other in semantic:
            add(c, f"semantic:{phrase}+{other}", phrase + other)
            add(c, f"semantic:{other}+{phrase}", other + phrase)

    # Odd/even extraction families: a bounded interpretation of "odd poem"
    # that preserves order rather than enumerating arbitrary subsets.
    flat = clean(' '.join(LINES))
    for name, stream in [
        ("poem-odd-letters", flat[::2]),
        ("poem-even-letters", flat[1::2]),
        ("poem-odd-words", clean(' '.join(WORDS[::2]))),
        ("poem-even-words", clean(' '.join(WORDS[1::2]))),
    ]:
        for i in range(len(stream) - 19):
            add(c, f"{name}[{i}:{i+20}]", stream[i:i+20])
    # Capitalization clue plus all 15-letter poem windows (SECOM + 15 letters).
    for i in range(len(flat) - 14):
        add(c, f"SECOM+poem[{i}:{i+15}]", "SECOM" + flat[i:i+15])
        add(c, f"poem[{i}:{i+15}]+SECOM", flat[i:i+15] + "SECOM")
    return c


def main():
    candidates = build_candidates()
    # Same calibration used by the documented probe.
    sample = ("THE QUICK CROW FLEW OVER THE QUIET TOWN AND SAW THE PEOPLE "
              "WHO NEVER FORGOT WHAT HAD HAPPENED THERE IN THE YEARS OF "
              "TROUBLE AND GRIEF THEY STILL WALK THE OLD STREETS AND "
              "REMEMBER THE MUSIC OF BETTER DAYS")
    english = probe.metrics(sample)
    null_plain, _, _ = probe.decrypt(probe.CROW_CIPHERTEXT, "THE QUICK BROWN FOX JUMP")
    null = probe.metrics(null_plain)
    thresholds = {
        "bigram": (english["bigram"] + null["bigram"]) / 2,
        "chi2": (english["chi2"] + null["chi2"]) / 2,
        "ioc": (english["ioc"] + null["ioc"]) / 2,
    }
    rows = []
    for key, labels in candidates.items():
        try:
            plain, _, _ = probe.decrypt(probe.CROW_CIPHERTEXT, key)
        except (ValueError, ZeroDivisionError):
            # A degenerate key can fail to produce two transposition widths;
            # record it as structurally invalid rather than treating it as a
            # plaintext candidate.
            continue
        m = probe.metrics(plain)
        ok = (m["bigram"] >= thresholds["bigram"] and
              m["chi2"] <= thresholds["chi2"] and
              m["ioc"] <= thresholds["ioc"])
        rows.append((ok, m["bigram"], -m["chi2"], -m["ioc"], key, labels))
    rows.sort(reverse=True)
    print(f"structured candidates: {len(rows)}")
    print("thresholds:", ", ".join(f"{k}={v:.4f}" for k, v in thresholds.items()))
    print("survivors:", sum(row[0] for row in rows))
    print("top 20 candidates by rough score:")
    for ok, bigram, neg_chi, neg_ioc, key, labels in rows[:20]:
        print(f"{'SURVIVES' if ok else 'reject':8} {key} "
              f"IoC={-neg_ioc:.4f} chi2={-neg_chi:.1f} bigram={bigram:+.3f} "
              f"{labels[0]}")


if __name__ == "__main__":
    main()
