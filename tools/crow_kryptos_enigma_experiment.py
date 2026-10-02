#!/usr/bin/env python3
"""
crow_kryptos_enigma_experiment.py — the 2026-10-02 investigation.

The hypothesis under test (user-supplied, recorded verbatim in
docs/crow-cryptogram-investigation-2026-10-02.md):

  The Crow's Cryptogram (Dirk Rijmenants, 2010; 600 digits) might be
  attackable with an Enigma whose settings are derived from the four
  deliberate Kryptos misspellings:

      IQLUSION (K1), UNDERGRUUND (K2), DESPARATLY (K3), DIGETAL (Morse slab)

  with the "Enigma with another rotor" read as the four-rotor Kriegsmarine
  M4 (Beta/Gamma Zusatzwalze + thin reflectors), and the misspellings
  supplying Grundstellung / Ringstellung / Steckerbrett / Greek-rotor
  offset.  A secondary target: the 97-letter Kryptos K4 ciphertext.

This script is deterministic and prints every scored candidate.  It is kept
as the reviewable source of the numbers quoted in the docs; the JavaScript
port that the bundle's verify harness runs is js/lecture-ciphers.js +
tools/verify_lecture_hall.mjs section 9.
"""
import itertools
import json
import math
import re
from collections import Counter

# ---------------------------------------------------------------- corpus

POEM = """Never forget the town we loved
A town betrayed by strangers
Not once or twice but three times
To unveil the truth and smell of grief
We found in sacred soil"""

CIPHERTEXT = """81232 44783 73232 32263 75722 86365 51963 87366 03222 72668
33331 27230 52235 23366 23822 87373 75343 52352 22233 29348
72314 63282 03622 22824 35552 23820 28242 22051 38253 78435
26882 44825 82262 72736 59828 70417 82232 22288 22682 21731
65838 47821 47438 75321 25803 22980 25288 84853 83221 55566
12882 32833 56821 61483 61322 52289 29223 38362 64330 03281
04482 38254 24393 22203 85563 42714 75854 33606 22125 32227
32427 54827 34541 73353 02673 22537 58933 02858 78627 23216
18332 58738 17238 27432 75818 78175 22327 21458 58181 16284
32082 36857 60426 34562 34873 32531 48845 26072 42848 81358
26533 52733 04602 28232 38732 23385 38336 23731 83852 72638
08538 20333 27838 52662 13523 27833 39332 81488 25260 82636"""

K4_CIPHERTEXT = ("OBKRUOXOGHULBSOLIFBBWFLRVQQVPRNGKSSOTWTQSJQSSEKZZWATJKLUDIAWINFBNYPVTTMZFPKWGDKZXTJCDIGKUHUAUEKCAR")

MISSPELLINGS = {
    "K1": ("IQLUSION", "ILLUSION"),
    "K2": ("UNDERGRUUND", "UNDERGROUND"),
    "K3": ("DESPARATLY", "DESPERATELY"),
    "Morse slab": ("DIGETAL", "DIGITAL"),
}

# ---------------------------------------------------------------- Enigma

ROTORS = {
    "I":     ("EKMFLGDQVZNTOWYHXUSPAIBRCJ", "Q"),
    "II":    ("AJDKSIRUXBLHWTMCQGZNPYFVOE", "E"),
    "III":   ("BDFHJLCPRTXVZNYEIWGAKMUSQO", "V"),
    "IV":    ("ESOVPZJAYQUIRHXLNFTGKDCMWB", "J"),
    "V":     ("VZBRGITYUPSDNHLXAWMJQOFECK", "Z"),
    "VI":    ("JPGVOUMFYQBENHZRDKASXLICTW", "ZM"),
    "VII":   ("NZJHGRCXMYSWBOUFAIVLPEKQDT", "ZM"),
    "VIII":  ("FKQHTLXOCBJSPDZRAMEWNIUYGV", "ZM"),
    "Beta":  ("LEYJVCNIXWPBQMDRTAKZGFUHOS", ""),
    "Gamma": ("FSOKANUERHMBTIYCWLQPZXVGJD", ""),
}
REFLECTORS = {
    "A":        "EJMZALYXVBWFCRQUONTSPIKHGD",
    "B":        "YRUHQSLDPXNGOKMIEBFZCWVJAT",
    "C":        "FVPJIAOYEDRZXWGCTKUQSBNMHL",
    "B-thin":   "ENKQAUYWJICOPBLMDXZVFTHRGS",
    "C-thin":   "RDOBJNTKVEHMLFCWZAXGYIPSUQ",
}
A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"


class Enigma:
    """Enigma I / M3 / M4.  rotors is leftmost-first, e.g. ['Beta','I','II','III'].
    rings/positions are leftmost-first strings; the Greek rotor never steps."""

    def __init__(self, rotors, reflector, positions, rings, plugs=()):
        self.rotors = list(rotors)
        self.reflector = REFLECTORS[reflector]
        self.pos = [A.index(c) for c in positions]
        self.ring = [A.index(c) for c in rings]
        self.plug = {}
        for a, b in plugs:
            self.plug[a] = b
            self.plug[b] = a

    def _step(self):
        n = len(self.rotors)
        right, middle = n - 1, n - 2
        notch_r = ROTORS[self.rotors[right]][1]
        notch_m = ROTORS[self.rotors[middle]][1]
        at_notch_m = self.rotors[middle] in ROTORS and A[self.pos[middle]] in notch_m
        at_notch_r = A[self.pos[right]] in notch_r
        step_mid = at_notch_m or at_notch_r
        step_left = at_notch_m
        self.pos[right] = (self.pos[right] + 1) % 26
        if step_mid:
            self.pos[middle] = (self.pos[middle] + 1) % 26
        if step_left and n >= 3:
            self.pos[middle - 1] = (self.pos[middle - 1] + 1) % 26
        # the Greek rotor (index 0 on an M4) never steps: handled by only ever
        # touching indices n-1, n-2, n-3.

    def _through(self, i, name, pos, ring, reverse=False):
        shift = pos - ring
        x = (i + shift) % 26
        wiring = ROTORS[name][0]
        if not reverse:
            return (A.index(wiring[x]) - shift) % 26
        y = A[x]
        return (wiring.index(y) - shift) % 26

    def encrypt(self, text):
        out = []
        for ch in text.upper():
            if ch not in A:
                continue
            self._step()
            c = self.plug.get(ch, ch)
            i = A.index(c)
            for k in range(len(self.rotors) - 1, -1, -1):
                i = self._through(i, self.rotors[k], self.pos[k], self.ring[k])
            i = A.index(self.reflector[i])
            for k in range(0, len(self.rotors)):
                i = self._through(i, self.rotors[k], self.pos[k], self.ring[k], reverse=True)
            c = self.plug.get(A[i], A[i])
            out.append(c)
        return "".join(out)


# ---------------------------------------------------------------- scoring

ENGLISH_LETTER_FREQ = {
    "A": 8.17, "B": 1.49, "C": 2.78, "D": 4.25, "E": 12.70, "F": 2.23,
    "G": 2.02, "H": 6.09, "I": 6.97, "J": 0.15, "K": 0.77, "L": 4.03,
    "M": 2.41, "N": 6.75, "O": 7.51, "P": 1.93, "Q": 0.10, "R": 5.99,
    "S": 6.33, "T": 9.06, "U": 2.76, "V": 0.98, "W": 2.36, "X": 0.15,
    "Y": 1.97, "Z": 0.07,
}
COMMON_WORDS = re.compile(
    r"\b(THE|AND|THAT|HAVE|FOR|NOT|WITH|YOU|THIS|BUT|HIS|FROM|THEY|SAY|HER|SHE|"
    r"ONE|ALL|WE|WOULD|THERE|THEIR|WHAT|OUT|ABOUT|WHO|GET|WHICH|WHEN|MAKE|CAN|"
    r"LIKE|TIME|JUST|HIM|KNOW|TAKE|PERSON|INTO|YEAR|YOUR|GOOD|SOME|COULD|THEM|"
    r"SEE|OTHER|THAN|THEN|NOW|LOOK|ONLY|COME|ITS|OVER|THINK|ALSO|BACK|AFTER|"
    r"USE|TWO|HOW|OUR|WORK|FIRST|WELL|WAY|EVEN|NEW|WANT|BECAUSE|ANY|THESE|GIVE|"
    r"DAY|MOST|US|IS|ARE|WAS|WERE|BEEN|HAS|HAD|WILL|TOWN|CROW|NEVER|FORGET)\b"
)


def chi2_english(text):
    n = len(text)
    if n == 0:
        return float("inf")
    obs = Counter(text)
    score = 0.0
    for ch in A:
        e = ENGLISH_LETTER_FREQ[ch] * n / 100.0
        o = obs.get(ch, 0)
        score += (o - e) ** 2 / e
    return score / max(n, 1)


def ioc(text):
    n = len(text)
    if n < 2:
        return 0.0
    c = Counter(text)
    return sum(v * (v - 1) for v in c.values()) / (n * (n - 1))


def englishness(text):
    """Composite heuristic: 0..1.  Real English decrypts score high on
    chi-square closeness, IoC and common words; Enigma output does not."""
    words = len(COMMON_WORDS.findall(text))
    n = len(text)
    chi = chi2_english(text)
    # normalise: chi ~ 0.1-0.3 per letter for English, ~1.0+ for random
    chi_score = max(0.0, 1.0 - chi / 0.8)
    ioc_score = max(0.0, min(1.0, (ioc(text) - 0.030) / 0.040))
    word_score = min(1.0, words / max(1.0, n / 30.0))
    return 0.4 * chi_score + 0.3 * ioc_score + 0.3 * word_score


# ---------------------------------------------------------------- profiles

def digit_profile():
    digits = re.sub(r"\D", "", CIPHERTEXT)
    groups = CIPHERTEXT.split()
    freq = Counter(digits)
    pairs = Counter(digits[i : i + 2] for i in range(0, len(digits) - 1, 2))
    print("== Crow cryptogram statistical profile ==")
    print(f"groups: {len(groups)}  digits: {len(digits)}")
    print(f"digit frequencies: {dict(sorted(freq.items()))}")
    print(f"digit IoC: {sum(v*(v-1) for v in freq.values())/(len(digits)*(len(digits)-1)):.5f}")
    top_pairs = pairs.most_common(8)
    print(f"top digit-pairs (non-overlapping): {top_pairs}")
    repeat_groups = [g for g, c in Counter(groups).items() if c > 1]
    print(f"repeated whole groups: {repeat_groups}")
    endings = Counter(g[-1] for g in groups)
    print(f"group final-digit distribution: {dict(sorted(endings.items()))}")
    print(f"poem word count: {len(POEM.split())}")
    print(f"poem letter count: {len(re.sub(r'[^A-Za-z]', '', POEM))}")
    return digits


# ------------------------------------------------------------ digit→letters

def digits_to_letters(digits, scheme):
    if scheme == "A-J":                       # 0-9 -> A-J
        return "".join(chr(65 + int(d)) for d in digits)
    if scheme == "mod26-pairs":               # pairs 00-99 -> 00-25 -> A-Z
        out = []
        for i in range(0, len(digits) - 1, 2):
            out.append(A[(int(digits[i : i + 2])) % 26])
        return "".join(out)
    if scheme == "phone":                     # 2=ABC 3=DEF ... collapse to first letter
        m = {"2": "A", "3": "D", "4": "G", "5": "J", "6": "M", "7": "P", "8": "T", "9": "W",
             "0": "Z", "1": "Q"}
        return "".join(m[d] for d in digits)
    raise ValueError(scheme)


# --------------------------------------------------- derived setting sets

def plugboard_pairs(word, limit=10):
    """Pair a word's letters sequentially: UNDERGRUUND -> UN DE RG RU UN D."""
    w = re.sub(r"[^A-Z]", "", word.upper())
    pairs, used = [], set()
    for i in range(0, len(w) - 1, 2):
        a, b = w[i], w[i + 1]
        if a != b and a not in used and b not in used:
            pairs.append((a, b))
            used.update((a, b))
    return pairs[:limit]


def changed_letters():
    """The letters that make each misspelling a misspelling."""
    out = {}
    for k, (wrong, right) in MISSPELLINGS.items():
        # simple diff of first divergence + length delta
        i = 0
        while i < min(len(wrong), len(right)) and wrong[i] == right[i]:
            i += 1
        out[k] = {"first_divergence_index": i, "wrong_letter": wrong[i] if i < len(wrong) else None,
                  "right_letter": right[i] if i < len(right) else None,
                  "length_delta": len(wrong) - len(right)}
    return out


def candidate_configs():
    """Every configuration the hypothesis suggests, systematically."""
    greeks = [None, "Beta", "Gamma"]
    thin = {"Beta": "B-thin", "Gamma": "C-thin"}
    words = {k: v[0] for k, v in MISSPELLINGS.items()}

    starts = []
    for w in (words["K1"], words["K2"], words["K3"], words["Morse slab"]):
        starts.append(w[:4])
    starts.append("QUAE")          # the four changed letters in order (Q,U,A,E)
    starts.append("UDDE")          # changed letters alternate reading
    starts = sorted(set(s for s in starts if len(s) == 4))

    rings = sorted({"DESP", "IQLU", "UNDE", "DIGE", "AAAA"})

    plugs = {
        "undergruund": plugboard_pairs(words["K2"]),
        "desparatly": plugboard_pairs(words["K3"]),
        "iqlusion": plugboard_pairs(words["K1"]),
        "none": [],
    }

    rotor_sets = [
        ["I", "II", "III"],
        ["Beta", "I", "II", "III"],
        ["Gamma", "I", "II", "III"],
        ["Beta", "II", "IV", "I"],
        ["Gamma", "V", "VI", "VIII"],
    ]

    for rotors in rotor_sets:
        m4 = rotors[0] in ("Beta", "Gamma")
        for start in starts:
            for ring in rings:
                for plugname, plug in plugs.items():
                    if m4:
                        reflector = thin[rotors[0]]
                        yield (rotors, reflector, start, ring, plug, plugname)
                    else:
                        for reflector in ("B", "C"):
                            yield (rotors, reflector, start, ring, plug, plugname)


def run_experiment():
    digits = re.sub(r"\D", "", CIPHERTEXT)
    targets = {}
    for scheme in ("A-J", "mod26-pairs", "phone"):
        targets[f"crow:{scheme}"] = digits_to_letters(digits, scheme)
    targets["k4:letters"] = K4_CIPHERTEXT

    results = []
    n = 0
    for rotors, reflector, start, ring, plug, plugname in candidate_configs():
        m4 = rotors[0] in ("Beta", "Gamma")
        # 3-rotor machines take 3-letter start/ring; M4 takes 4
        if m4:
            st, rg = start[:4], ring[:4]
        else:
            st, rg = start[1:4], ring[1:4]   # drop the would-be Greek slot
        for tname, text in targets.items():
            try:
                e = Enigma(rotors, reflector, st, rg, plug)
                out = e.encrypt(text)
            except Exception:
                continue
            n += 1
            results.append((englishness(out), tname, "-".join(rotors), reflector, st, rg, plugname, out[:48]))
    results.sort(reverse=True)
    print(f"\n== Enigma experiment: {n} runs ==")
    print("changed-letter diff per misspelling:")
    for k, v in changed_letters().items():
        print(f"  {k}: {v}")
    print("\ntop 10 by Englishness heuristic (threshold for real English ≈ 0.6+):")
    for r in results[:10]:
        print(f"  {r[0]:.3f}  {r[1]:<14} {r[2]:<18} {r[3]:<7} start={r[4]} ring={r[5]} plugs={r[6]:<12} {r[7]}")
    best = results[0]
    print(f"\nBEST: score={best[0]:.3f}  target={best[1]}  rotors={best[2]} reflector={best[3]} start={best[4]} ring={best[5]} plugs={best[6]}")
    print(f"best output head: {best[7]}")
    return best, n


if __name__ == "__main__":
    digit_profile()
    best, n = run_experiment()
