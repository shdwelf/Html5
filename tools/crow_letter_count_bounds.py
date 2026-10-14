#!/usr/bin/env python3
"""Test any "the Crow plaintext is N letters" claim against SECOM arithmetic.

The Crow's Cryptogram is fixed at 600 digits and its published system is SECOM
(identified by the page's own typographic clue, "They SEe and COMe"). In SECOM
each plaintext symbol costs one digit (the seven one-digit letters of the
straddling checkerboard) or two digits (every other letter, the space and the
numerals), and the final group of five may be completed with at most four null
digits. That fixes an identity between digits, symbols and one-digit symbols:

    600 - pad = a + 2 * (T - a),   pad in [0, 4],   0 <= a <= L <= T

where T is the number of plaintext symbols (letters + spaces + numerals), L the
letters among them and a the symbols encoded by a single digit. As a share of
the letters, a can plausibly range only from the seven rarest English letters
(~3.7%) to the seven commonest (~57.5%), because the checkerboard gives exactly
seven letters a one-digit code.

Any claimed plaintext length must satisfy this. The test is necessary, never
sufficient: it can kill a claim outright, it can never prove a solve.

Usage:
    python3 tools/crow_letter_count_bounds.py                  # windows + 217
    python3 tools/crow_letter_count_bounds.py 217 300 420 250
"""
import re
import sys
from math import ceil
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import secom_probe as probe  # noqa: E402

DIGITS = len(re.sub(r"\D", "", probe.CROW_CIPHERTEXT))
PAD_MAX = 4                      # documented maximum (completing the last group of five)
LETTERS_PER_WORD = 4.7           # ordinary English prose

# The checkerboard gives exactly seven letters a one-digit code, so the share of
# the plaintext's letters that can be one-digit symbols runs from the seven
# rarest letters to the seven commonest — taken from the probe's own frequency
# table so the bound cannot drift from the research it is testing.
_FREQ = sorted(probe.ENGLISH_FREQ.values(), reverse=True)
SHARE_COMMON = sum(_FREQ[:7]) / 100           # E T A O I N S
SHARE_RARE = sum(_FREQ[-7:]) / 100            # Z Q J X K V B


def histogram():
    digits = re.sub(r"\D", "", probe.CROW_CIPHERTEXT)
    return {d: digits.count(d) for d in "0123456789"}


def symbol_floor(pad=PAD_MAX):
    """Fewest plaintext symbols 600 digits can hold: every symbol two digits."""
    return ceil((DIGITS - pad) / 2)


def symbols_for(a, pad=PAD_MAX):
    """Plaintext symbol count implied by a one-digit symbols and the padding."""
    return (DIGITS - pad + a) / 2


def plaintext_window(letters_per_word=LETTERS_PER_WORD, share_common=SHARE_COMMON,
                     share_rare=SHARE_RARE):
    """Letter counts an English-prose plaintext of 600 SECOM digits can occupy.

    symbols T = L + L/letters_per_word, and a = 2T - 600 must fall between
    share_rare * L and share_common * L.  Solving gives the window.
    """
    per_symbol = 2 * (1 + 1 / letters_per_word)
    low = DIGITS / (per_symbol - share_rare)
    high = DIGITS / (per_symbol - share_common)
    return low, high


def assess(letters, letters_per_word=LETTERS_PER_WORD):
    """Symbols, digits bounds and the one-digit share each padding value implies."""
    spaces = round(letters / letters_per_word)
    symbols = letters + spaces
    digits_lo = 2 * symbols - letters        # a = letters (every letter one digit)
    digits_hi = 2 * symbols                  # a = 0
    shares = {}
    for pad in range(PAD_MAX + 1):
        a = 2 * symbols - (DIGITS - pad)     # a = 2T - (600 - pad)
        if a >= 0:
            shares[pad] = a / letters
    return symbols, spaces, digits_lo, digits_hi, shares


def report(letters, letters_per_word=LETTERS_PER_WORD):
    symbols, spaces, d_lo, d_hi, shares = assess(letters, letters_per_word)
    low, high = plaintext_window(letters_per_word)
    print(f"\nclaimed plaintext: {letters} letters "
          f"(at {letters_per_word:g} letters/word: {symbols} symbols, {spaces} spaces)")
    print(f"  digits such a text can occupy : {d_lo}-{d_hi}   "
          f"(600 digits on the wire, <= {PAD_MAX} of them pad)")
    if d_hi < DIGITS - PAD_MAX:
        print(f"  VERDICT: REJECTED - too few symbols for {DIGITS} digits.")
        print(f"           Even with every symbol encoded by two digits the text writes "
              f"{d_hi} digits, short of")
        print(f"           the {DIGITS - PAD_MAX} the wire demands by "
              f"{DIGITS - PAD_MAX - d_hi} digits; closing that gap would take "
              f"{ceil((DIGITS - PAD_MAX - d_hi) / 2)}+ two-digit null")
        print(f"           pairs against a documented allowance of {PAD_MAX} null digits.")
        if letters < symbol_floor():
            print(f"           A {DIGITS}-digit message needs >= {symbol_floor()} symbols, "
                  f"so {letters} letters would leave room for only")
            print(f"           {symbol_floor() - letters} non-letter symbols "
                  f"(<= {letters / (symbol_floor() - letters):.2f} letters per word, "
                  f"against {letters_per_word:g} in ordinary English).")
    elif d_lo > DIGITS:
        print(f"  VERDICT: REJECTED - too many symbols.")
        print(f"           a = 2T - 600 would have to be {d_lo - DIGITS} or more one-digit "
              f"symbols, i.e. {d_lo / letters - 1:.0%}")
        print(f"           of the letters, more than the {SHARE_COMMON:.1%} any seven "
              f"key letters can cover.")
    else:
        lo, hi = min(shares.values()), max(shares.values())
        print(f"  one-digit share implied by a = 2T - 600 + pad : "
              f"{lo:.1%}-{hi:.1%} of the letters")
        print(f"  plausible share for any seven key letters    : "
              f"{SHARE_RARE:.1%}-{SHARE_COMMON:.1%}")
        if hi < SHARE_RARE or lo > SHARE_COMMON:
            print(f"  VERDICT: REJECTED - the key's seven one-digit letters would have to "
                  f"be far rarer")
            print(f"           (or far commoner) than any seven letters in English prose.")
        else:
            print(f"  VERDICT: arithmetically possible; no evidence value without the "
                  f"20-letter phrase")
            print(f"           and an exact re-encryption of all {DIGITS} digits "
                  f"(<= {PAD_MAX} null digits).")
    inside = low <= letters <= high
    print(f"  {'inside' if inside else 'outside'} the English-prose window "
          f"{ceil(low)}-{int(high)} letters for {DIGITS} SECOM digits")


def self_check():
    """Validate the digit identity on the publisher's own SECOM worked example."""
    plain = "RV TOMORROW AT 1400PM TO COMPLETE TRANSACTION USE DEADDROP AS USUAL"
    phrase = "MAKE NEW FRIENDS BUT KEEP THE OLD"
    sched = probe.schedule(phrase)
    enc, _ = probe.checkerboard(sched)
    symbols = [enc[ch] for ch in re.sub(r"[^A-Z0-9 ]", "", plain.upper())]
    one_digit = sum(1 for c in symbols if len(c) == 1)
    used = sum(map(len, symbols))
    padded = used + (-used % 5)
    ok = used == 2 * len(symbols) - one_digit and 0 <= padded - used <= PAD_MAX
    print(f"model self-check on the publisher's worked example: "
          f"{'PASS' if ok else 'FAIL'}")
    print(f"  {len(symbols)} symbols, {one_digit} one-digit symbols -> {used} digits "
          f"+ {padded - used} null = {padded}")
    return ok


def main(argv):
    if not self_check():
        return 1
    hist = histogram()
    print("\n=== Crow ciphertext (transposition-invariant) ===")
    print(f"digits: {DIGITS}   histogram: "
          + "  ".join(f"{d}:{hist[d]}" for d in "2385764109"))
    print(f"\n600 - pad = a + 2(T - a), pad <= {PAD_MAX}  =>  T = (600 + a)/2, "
          f"T >= {symbol_floor()}")
    print("plaintext symbol count T for a range of one-digit-symbol counts a "
          f"(pad = {PAD_MAX}):")
    for a in (0, 50, 100, 150, 200, 250, 300, 331):
        print(f"  a = {a:3d}  ->  T = {symbols_for(a):5.1f} symbols")
    low, high = plaintext_window()
    print(f"\nEnglish-prose window: {ceil(low)}-{int(high)} letters "
          f"(at {LETTERS_PER_WORD:g} letters/word)")
    print(f"  {ceil(low):3d} letters = the key's seven one-digit letters are the seven "
          f"rarest (Z Q J X K V B)")
    print(f"  {int(high):3d} letters = the key's seven one-digit letters are the seven "
          f"commonest (E T A O I N S)")
    claims = [int(x) for x in argv] if argv else [217, 250, 300, 325, 420]
    for n in claims:
        report(n)
    print("\nreference: the publisher's own SECOM worked example is 105 digits, "
          "67 symbols")
    print("(53 letters, 10 spaces, 4 numerals), 30 of them one-digit symbols; "
          "its plaintext is")
    print("'RV TOMORROW AT 1400PM TO COMPLETE TRANSACTION USE DEADDROP AS USUAL'.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
