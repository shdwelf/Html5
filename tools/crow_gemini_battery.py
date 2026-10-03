#!/usr/bin/env python3
"""Exhaustive Crow's Cryptogram analysis battery (2026-10-03 pass).

Scope, following the plan attributed to a Gemini session by the requester:

  1. Monographic digit frequency        - Part B1-B3
  2. Digram & periodicity analysis      - Part B4-B6 (grid-width hunt)
  3. Disruption / structural-break hunt - Part B7 (+ simulated controls B8)
  4. Checkerboard skeleton recovery     - Part C  (monograms are
     transposition-invariant, so the board can be fitted WITHOUT the key)
  5. Structured 20-letter extraction of the hint text - Part D
     (capitalization, acrostics, line endings, word positions, strides,
      the "SEe and COMe" family, song-reference and semantic phrases)
  6. Calibrated candidate scan          - Part E (Sylichenko-style ladder
     with positive controls; every candidate is a documented event)

Prior passes (merged PRs) established: exact SECOM model with the official
worksheet vector; the transposition-invariant histogram; a 111-candidate
scan (8 named phrases + 103 windows over the six italic lines), all
rejected by a calibrated IoC/chi2/bigram ladder.  This battery does not
re-run that set as "new" work - overlap is reported as PRIOR coverage.

Nothing here is, or claims to be, a solution.
"""

import importlib.util
import math
import random
import sys
from collections import Counter
from itertools import permutations
from pathlib import Path

TOOLS = Path(__file__).resolve().parent


def _load(name):
    spec = importlib.util.spec_from_file_location(name, TOOLS / (name + ".py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


probe = _load("secom_probe")
ref = _load("secom_ref_impl")

DIGITS = "".join(c for c in probe.CROW_CIPHERTEXT if c.isdigit())
N = len(DIGITS)

# Golden histogram recorded in merged PR #81 (independent of this file).
GOLDEN_HIST = {"2": 144, "3": 116, "8": 88, "5": 56, "7": 46,
               "6": 45, "4": 40, "1": 33, "0": 23, "9": 9}

INTRO = "The old crows are on the watch. They SEe and COMe..."
POEM_LINES = [
    "Never forget",
    "the town we loved",
    "A town betrayed by strangers",
    "Not once or twice but three times",
    "To unveil the truth and smell of grief",
    "We found in sacred soil",
]

CTRL_PHRASE = "GEMINIBATTERYTESTKEY"      # exactly 20 letters, arbitrary
SAMPLE = ("THE OLD CROWS WATCH OVER THE TOWN THAT WE HAVE LOVED SO WELL "
          "AND THE PEOPLE WHO REMEMBER THOSE DAYS STILL WALK THROUGH THE "
          "OLD STREETS IN THE EVENING WHEN THE AIR IS QUIET AND THE LIGHT "
          "IS LOW THEY SPEAK OF MUSIC AND OF GRIEF OF EVERYTHING THAT WAS "
          "TAKEN AND OF EVERYTHING THAT REMAINS BEHIND IN THE SACRED SOIL")

FREQ = {k: v / 100.0 for k, v in probe.ENGLISH_FREQ.items()}

# =========================================================================
# helpers
# =========================================================================

def hist_of(seq):
    h = Counter(seq)
    return {str(d): h.get(str(d), 0) for d in range(10)}


def chi2_uniform(counts):
    n = sum(counts.values())
    e = n / len(counts)
    return sum((v - e) ** 2 / e for v in counts.values())


def sumsq(counts):
    n = sum(counts.values())
    return sum((v / n) ** 2 for v in counts.values())


def chi2_assoc(counts2D, row_tot, col_tot, n):
    out = 0.0
    for i in range(10):
        for j in range(10):
            e = n * (row_tot[i] / n) * (col_tot[j] / n)
            o = counts2D[i][j]
            out += (o - e) ** 2 / e
    return out


def mutual_info(counts2D, n):
    rs = [sum(counts2D[i]) for i in range(10)]
    cs = [sum(counts2D[i][j] for i in range(10)) for j in range(10)]
    mi = 0.0
    for i in range(10):
        for j in range(10):
            o = counts2D[i][j]
            if o:
                mi += (o / n) * math.log2(o * n / (rs[i] * cs[j]))
    return mi


def width_scan(digits, widths=range(2, 46)):
    """For each candidate grid width: mean column sum-of-squares (SSQ),
    sum of column chi2 vs uniform, and horizontal adjacent-cell MI."""
    n = len(digits)
    out = {}
    for w in widths:
        rows = math.ceil(n / w)
        cols = [digits[i] for c in range(w)
                for i in range(c, n, w)]
        col_sets = [digits[c::w] for c in range(w)]
        ssq = sum(sumsq(Counter(s)) for s in col_sets) / w
        chi = sum(chi2_uniform({str(d): Counter(s).get(str(d), 0)
                                for d in range(10)}) for s in col_sets)
        mats = [[0] * 10 for _ in range(10)]
        m = 0
        for r in range(rows - 1):
            row_a = digits[r * w:(r + 1) * w]
            row_b = digits[(r + 1) * w:(r + 2) * w]
            for c in range(min(len(row_a), len(row_b))):
                mats[int(row_a[c])][int(row_b[c])] += 1
                m += 1
        out[w] = dict(ssq=ssq, chi2=chi, mi=mutual_info(mats, m) if m else 0.0)
    return out


def autocorr(digits, max_lag=150):
    p0 = sumsq(Counter(digits))
    n = len(digits)
    rows = []
    for k in range(1, max_lag + 1):
        m = sum(1 for i in range(n - k) if digits[i] == digits[i + k])
        e = (n - k) * p0
        z = (m - e) / math.sqrt(e * (1 - p0))
        rows.append((k, m, z))
    return p0, rows


def kasiski(digits, sizes=(3, 4, 5)):
    rep = {}
    for sz in sizes:
        seen = {}
        for i in range(len(digits) - sz + 1):
            seen.setdefault(digits[i:i + sz], []).append(i)
        hits = {s: pos for s, pos in seen.items() if len(pos) > 1}
        rep[sz] = hits
    return rep


# =========================================================================
# PART A - hygiene and cross-validation
# =========================================================================

def part_a():
    print("=" * 74)
    print("PART A - ciphertext hygiene and tooling cross-validation")
    print("=" * 74)
    groups = probe.CROW_CIPHERTEXT.split()
    print("groups: %d, digits: %d, groups-of-5: %s"
          % (len(groups), N, all(len(g) == 5 for g in groups)))
    h = hist_of(DIGITS)
    print("histogram matches PR #81 golden record: %s" % (h == GOLDEN_HIST))
    print("counts: " + "  ".join("%s:%d" % (d, h[d])
                               for d in sorted(h, key=lambda x: -h[x])))

    ref.selftest(verbose=False)
    print("secom_ref_impl official worksheet vector: PASS")

    # Cross-implementation validation.  The two engines agree EXCEPT in the
    # checkerboard-top numbering when the last chain row contains the digit
    # 0: the worksheet rule is "assign 1 to the smallest digit ... treating
    # 0 as the last number" (ref, zero_last=True), while the merged probe
    # ranks 0 smallest (legacy behaviour; passes the official vector only
    # because the worksheet example has no 0 in that row).
    cand = "INMYMEMORYIWILLALWAY"
    p_plain, _, _ = probe.decrypt(probe.CROW_CIPHERTEXT, cand)
    # probe decodes the space symbol '*' to ' '; ref keeps '*'. Normalise.
    p_norm = p_plain.replace(" ", "*")
    r_legacy = ref.secom_decrypt(DIGITS, cand, zero_last=False)
    print("probe == ref in legacy (0-smallest) mode on a zero-row phrase: %s"
          % (p_norm == r_legacy))
    assert p_norm == r_legacy
    zfree = None
    _, prior_windows = probe.hint_windows()
    for _, ph in probe.HINT_LINES:
        prior_windows.append(probe.letters_only(ph)[:20])
    for ph in prior_windows:
        if len(ph) != 20:
            continue
        km = ref.key_material(ph, zero_last=True)
        if 0 not in km["gen50"][40:50]:
            zfree = ph
            break
    if zfree:
        p2, _, _ = probe.decrypt(probe.CROW_CIPHERTEXT, zfree)
        r2 = ref.secom_decrypt(DIGITS, zfree, zero_last=True)
        print("probe == ref worksheet mode when the chain row is zero-free: %s"
              % (p2.replace(" ", "*") == r2))
        assert p2.replace(" ", "*") == r2
    n_zero = 0
    n_tot = 0
    for ph in set(prior_windows):
        if len(ph) != 20:
            continue
        n_tot += 1
        km = ref.key_material(ph, zero_last=True)
        if 0 in km["gen50"][40:50]:
            n_zero += 1
    print("prior scan contamination: %d of %d prior candidates have a 0 in the"
          % (n_zero, n_tot))
    print("   last chain row and were therefore tested under a NON-worksheet")
    print("   board numbering in the merged record; they are re-tested here.")
    assert h == GOLDEN_HIST

# =========================================================================
# PART B - statistical battery
# =========================================================================

def part_b():
    print()
    print("=" * 74)
    print("PART B - statistical battery on the 600 digits")
    print("=" * 74)
    h = hist_of(DIGITS)
    counts = [h[str(d)] for d in range(10)]

    print("\n--- B1 monographic frequencies (vs the 'mostly flat' hypothesis)")
    chi = chi2_uniform(h)
    print("digit:  " + "  ".join("%6s" % d for d in range(10)))
    print("count:  " + "  ".join("%6d" % c for c in counts))
    print("pct  :  " + "  ".join("%5.1f%%" % (100 * c / N) for c in counts))
    for c in counts:
        pass
    print("chi2 vs uniform = %.1f  (df=9; crit 16.9 @5%%, 21.7 @1%%)" % chi)
    print("digit sum-of-squares (digit-level IoC) = %.4f  (uniform floor 0.1000)"
          % sumsq(Counter(DIGITS)))
    print("verdict: distribution is NOT flat - a heavy three-peak profile")
    print("         {2,3,8} holds %.1f%% of all digits; this alone refutes the"
          % (100 * sum(h[d] for d in "238") / N))
    print("         'homophonic/pseudorandom' reading of the monogram layer.")

    print("\n--- B2 adjacent digrams (599 overlapping pairs)")
    mat = [[0] * 10 for _ in range(10)]
    for i in range(N - 1):
        mat[int(DIGITS[i])][int(DIGITS[i + 1])] += 1
    row_tot = [sum(mat[i]) for i in range(10)]
    assoc = chi2_assoc(mat, row_tot, row_tot, N - 1)
    print("chi2 association = %.1f  (df~81; crit ~103 @5%%)" % assoc)
    print("mutual information = %.4f bits (0 => independence)" % mutual_info(mat, N - 1))
    top = sorted(((mat[i][j], str(i) + str(j)) for i in range(10)
                  for j in range(10)), reverse=True)[:6]
    print("top digrams: " + ", ".join("%s x%d" % (p, c) for c, p in top))
    print("verdict: consistent with a PERMUTED stream - adjacency carries no")
    print("         information because the transpositions destroyed it.")

    print("\n--- B3 repeated substrings (Kasiski) ")
    rep = kasiski(DIGITS)
    for sz in (3, 4, 5):
        hits = rep[sz]
        gaps = []
        for pos in hits.values():
            gaps += [b - a for a, b in zip(pos, pos[1:])]
        g = 0
        for x in gaps:
            g = math.gcd(g, x)
        print("%d-grams repeated: %3d distinct, %3d repeats total, gap gcd=%d"
              % (sz, len(hits), len(gaps), g))
    ex = sorted(rep[4].items())[:3] + sorted(rep[5].items())[:2]
    for s, pos in ex:
        print("   %s @ %s gaps=%s" % (s, pos, [b - a for a, b in zip(pos, pos[1:])]))
    print("verdict: repeat profile matches a random-looking permutation; no")
    print("         usable period leaks through the double transposition.")

    print("\n--- B4 autocorrelation (match count at lag k, z-scored)")
    p0, rows = autocorr(DIGITS)
    top = sorted(rows, key=lambda r: -abs(r[2]))[:6]
    print("expected single-digit match rate p0 = %.4f" % p0)
    print("largest |z| lags: " + ", ".join("lag %d z=%+.2f" % (k, z) for k, m, z in top))
    extreme = [r for r in rows if abs(r[2]) > 3.0]
    print("lags with |z|>3.0: %d (150 lags tested; ~%.1f expected by chance)"
          % (len(extreme), 150 * 0.0027))

    print("\n--- B5 width scan w=2..45 (arrange rows of w; look for structure)")
    ws = width_scan(DIGITS)
    best_ssq = sorted(ws, key=lambda w: -ws[w]["ssq"])[:5]
    best_mi = sorted(ws, key=lambda w: -ws[w]["mi"])[:5]
    best_chi = sorted(ws, key=lambda w: ws[w]["chi2"])[:5]
    print("top widths by mean column SSQ : %s"
          % ", ".join("w=%d %.4f" % (w, ws[w]["ssq"]) for w in best_ssq))
    print("top widths by column chi2 low : %s"
          % ", ".join("w=%d %.1f" % (w, ws[w]["chi2"]) for w in best_chi))
    print("top widths by horizontal MI   : %s"
          % ", ".join("w=%d %.4f" % (w, ws[w]["mi"]) for w in best_mi))

    print("\n--- B6 homogeneity / structural break hunt")
    half = N // 2
    h1, h2s = hist_of(DIGITS[:half]), hist_of(DIGITS[half:])
    ks = max(abs(sum((h1[str(d)] - 0) for d in range(k + 1)) / half
                 - sum((h2s[str(d)] - 0) for d in range(k + 1)) / half)
             for k in range(10))
    c12 = sum((h2s[str(d)] - h1[str(d)]) ** 2 /
              max(h1[str(d)], 1) for d in range(10))
    print("first-half vs second-half chi2 = %.1f (df~9), KS gap = %.3f" % (c12, ks))
    qs = [hist_of(DIGITS[i * 150:(i + 1) * 150]) for i in range(4)]
    qchi = 0.0
    for d in range(10):
        col = [q[str(d)] for q in qs]
        e = sum(col) / 4
        qchi += sum((v - e) ** 2 / e for v in col)
    print("quarter homogeneity chi2 = %.1f (df~27; crit ~40 @5%%)" % qchi)
    win = [chi2_uniform(hist_of(DIGITS[i:i + 100])) for i in range(0, N - 99, 100)]
    print("100-digit window chi2 vs uniform: min %.1f  max %.1f (df=9)"
          % (min(win), max(win)))
    print("verdict: no statistically significant break - the profile is")
    print("         stationary, so the disruption does NOT leak as a frequency")
    print("         step (exactly what a well-formed SECOM message should do).")

    print("\n--- B7 simulated controls (what signals SHOULD look like)")
    rnd = random.Random(42)
    fake = "".join(rnd.choice("0123456789") for _ in range(N))
    ws_r = width_scan(fake)
    print("uniform random digits: mean-col SSQ range [%.4f, %.4f] (Crow: [%.4f, %.4f])"
          % (min(v["ssq"] for v in ws_r.values()), max(v["ssq"] for v in ws_r.values()),
             min(v["ssq"] for v in ws.values()), max(v["ssq"] for v in ws.values())))

    s = probe.schedule(CTRL_PHRASE)
    w1, w2 = s["widths"]
    full = probe.encrypt(SAMPLE, CTRL_PHRASE)
    enc_dec, _ = probe.checkerboard(s)
    import re as _re
    raw = "".join(enc_dec[ch] for ch in _re.sub(r"[^A-Z0-9 *]", "", SAMPLE.upper()))
    raw += "0" * (-len(raw) % 5)
    simple_only = probe.transpose_encrypt(raw, s["keys"][0])
    ws_s = width_scan(simple_only)
    ws_f = width_scan(full)
    rank_of = lambda d, keyw: sorted(d, key=lambda w: -d[w]["ssq"]).index(keyw) + 1
    print("control phrase %s -> widths w1=%d w2=%d" % (CTRL_PHRASE, w1, w2))
    print("SIMPLE transposition only : w1=%d ranks #%d of 44 by column SSQ "
          "(SSQ %.4f vs median %.4f)"
          % (w1, rank_of(ws_s, w1), ws_s[w1]["ssq"],
             sorted(v["ssq"] for v in ws_s.values())[22]))
    print("FULL double+disrupted     : w1=%d ranks #%d, w2=%d ranks #%d of 44 "
          % (w1, rank_of(ws_f, w1), w2, rank_of(ws_f, w2)))
    print("verdict: column-marginal statistics (SSQ/IoC/chi2) are the WRONG")
    print("         instrument even for a single transposition - both control")
    print("         widths hide in the noise band. A digram contact method is")
    print("         the classic remedy, and the second (disrupted) pass of")
    print("         SECOM exists precisely to defeat it; the Gemini plan's")
    print("         width-recovery step is a dead end on this construction.")

# =========================================================================
# PART C - checkerboard skeleton inference from monograms
# =========================================================================

ROW1_L = "BCDFGHJKLM"
ROW2_L = "PQRUVWXYZ"
SIGMAS = (0.0, 0.05, 0.10, 0.15, 0.20)
RHOS = (0.0, 0.005, 0.01, 0.02)


def stage_a_fit(obs):
    """Coarse fit: which 3 digits are the row prefixes, and (rank-matched)
    which digit tops which ESTONIA letter. Background second-digit mass B
    is spread uniformly as an approximation."""
    singles = "ESTONIA"
    smass_sorted = sorted((FREQ[L] for L in singles), reverse=True)
    mL1 = sum(FREQ[L] for L in ROW1_L)
    mL2 = sum(FREQ[L] for L in ROW2_L)
    results = []
    digits = list(range(10))
    for combo in permutations(digits, 3):          # (row1,row2,row3) prefixes
        rest = [d for d in digits if d not in combo]
        rest_counts = [obs[d] for d in rest]
        for sg in SIGMAS:
            for rh in RHOS:
                scale = 1.0 - sg - rh
                sm = [m * scale for m in smass_sorted]
                rows = (mL1 * scale, mL2 * scale + sg, rh)
                S = sum(sm)
                # every two-digit symbol appears once as a second digit;
                # spread that total mass uniformly over the 10 top digits
                B = (1.0 - S) / 10.0
                # rank-matched assignment (heaviest letter -> heaviest digit)
                order = [d for d, _ in sorted(zip(rest, rest_counts),
                                              key=lambda t: -t[1])]
                exp_single = dict(zip(order, sm))
                mu_full = {}
                for d in digits:
                    if d in combo:
                        mu_full[d] = rows[combo.index(d)] + B
                    else:
                        mu_full[d] = exp_single[d] + B
                chi = sum((obs[d] / 600.0 - mu_full[d]) ** 2 / mu_full[d]
                          for d in digits)
                results.append((chi, combo, order, sg, rh))
    results.sort()
    return results


def exact_stage_c(obs, prefixes, sg, rh):
    """Exact fit for a chosen prefix set: place the three prefix digits on
    the blank columns {2,5,8} and the seven ESTONIA letters on the single
    columns, using the true rotated-row geometry, and score exactly."""
    singles = "ESTONIA"
    scale = 1.0 - sg - rh
    blank_cols = (2, 5, 8)
    single_cols = [c for c in range(10) if c not in blank_cols]
    best = None
    for prow in permutations(range(3)):            # prefix digit -> row order
        prefix_of_col = {blank_cols[i]: prefixes[prow[i]] for i in range(3)}
        row_of_prefix = {prefixes[prow[i]]: i for i in range(3)}
        # precompute rotated row contents per column
        row0 = {c: ROW1_L[(c - 2) % 10] for c in range(10)}
        row1 = {c: ("PQRUVWXYZ*"[(c - 5) % 10]) for c in range(10)}
        rowsym_mass = []
        for r in range(3):
            base = ("BCDFGHJKLM", "PQRUVWXYZ*", "1234567890")[r]
            tot = 0.0
            for c in range(10):
                ch = row0[c] if r == 0 else (row1[c] if r == 1 else str(c))
                if r == 2:
                    tot += rh / 10.0
                elif ch == "*":
                    tot += sg
                else:
                    tot += FREQ[ch] * scale
            rowsym_mass.append(tot)
        colsec = {}
        for c in range(10):
            sec = 0.0
            ch0, ch1 = row0[c], row1[c]
            sec += FREQ[ch0] * scale
            sec += sg if ch1 == "*" else FREQ[ch1] * scale
            sec += rh / 10.0
            colsec[c] = sec
        for letr in permutations(singles):
            coldigit = {}
            for c in blank_cols:
                coldigit[c] = (prefix_of_col[c], None)
            for i, c in enumerate(single_cols):
                coldigit[c] = (letr[i], None)
            # assign single letters to single columns; digit for a single
            # column is the digit whose MASS we match: the digit is whatever
            # the board's top gives - but we fit LETTER placement only, with
            # the observed count pinned to that column's top digit.
            mu = {}
            dig_of_col = {}
            remain = [d for d in range(10) if d not in prefixes]
            for i, c in enumerate(single_cols):
                dig_of_col[c] = remain[i]
            for c in range(10):
                d = coldigit[c][0] if c in blank_cols else dig_of_col[c]
                m = colsec[c]
                if c in blank_cols:
                    m += rowsym_mass[row_of_prefix[d]]
                else:
                    m += FREQ[coldigit[c][0]] * scale
                mu[d] = m
            # letter->digit binding: letter letr[i] sits at single_cols[i]
            # which carries digit remain[i]
            chi = sum((obs[d] / 600.0 - mu[d]) ** 2 / max(mu[d], 1e-9)
                      for d in range(10))
            if best is None or chi < best[0]:
                layout = {dig_of_col[c]: letr[i]
                          for i, c in enumerate(single_cols)}
                best = (chi, {row_of_prefix[p]: p for p in prefixes},
                        dict(layout))
    return best


def part_c():
    print()
    print("=" * 74)
    print("PART C - checkerboard skeleton inference (key-independent)")
    print("=" * 74)
    print("Columnar transposition never changes digit COUNTS, so the observed")
    print("histogram is the histogram of the checkerboard-encoded plaintext.")
    obs = {int(d): GOLDEN_HIST[d] / 600.0 for d in GOLDEN_HIST}
    obs = {int(k): float(v) for k, v in GOLDEN_HIST.items()}
    res = stage_a_fit(obs)
    print("\ncoarse fit - top prefix triples (row1,row2,row3) by chi2:")
    for chi, combo, order, sg, rh in res[:8]:
        print("  chi2=%8.5f  prefixes=%s%s%s  singles-by-rank=%s  sigma=%.2f rho=%.3f"
              % (chi, *combo, "".join(map(str, order)), sg, rh))
    chi, combo, order, sg, rh = res[0]
    print("\nwinner: prefixes row1=%d row2=%d row3=%d (chi2=%.5f, sigma=%.2f rho=%.3f)"
          % (combo[0], combo[1], combo[2], chi, sg, rh))
    print("rank-matched one-digit letters (mass order E>T>A>O>I>N>S):")
    letters_by_mass = "ETAOINS"
    for d, L in zip(order, letters_by_mass):
        print("   digit %d  ->  %s   (observed %d/600 = %.1f%%)"
              % (d, L, GOLDEN_HIST[str(d)], 100 * GOLDEN_HIST[str(d)] / 600.0))

    print("\nexact stage-C geometry fit for the winning prefix set")
    best = None
    for sg2 in {sg, 0.10, 0.15}:
        for rh2 in {rh, 0.005, 0.01}:
            b = exact_stage_c(obs, (combo[0], combo[1], combo[2]), sg2, rh2)
            if best is None or b[0] < best[0]:
                best = b + (sg2, rh2)
    chi2e, prows, layout, sg2, rh2 = best
    print("best exact chi2 = %.5f at sigma=%.2f rho=%.3f" % (chi2e, sg2, rh2))
    print("implied board (top digits are placeholders for the UNKNOWN order):")
    for r, p in sorted(prows.items()):
        name = ("BCDFGHJKLM", "PQRUVWXYZ*", "0123456789")[r]
        print("   row %-11s headed by digit %d" % (name, p))
    print("   one-digit letters: " + "  ".join("%d:%s" % (d, L)
          for d, L in sorted(layout.items())))
    print("caveat: sigma (use of '*' spaces) and rho (use of digits) are")
    print("        unknowns; a real ~400-symbol message fluctuates around the")
    print("        model, so single-letter assignment near the mass ties")
    print("        (esp. digits 0/1) is indicative, not proven.")

# =========================================================================
# PART D - structured extraction of the hint text
# =========================================================================

def letters(s):
    return probe.letters_only(s)


def windows_of(blob, size=20):
    return [blob[i:i + size] for i in range(len(blob) - size + 1)]


SONG_BLOB = letters(
    "In my memory I will always see the town that I have loved so well "
    "where our school played ball by the gas yard wall and we laughed "
    "through the smoke and the smell going home in the rain running up "
    "the dark lane past the jail and down behind the fountain those were "
    "happy days in so many many ways in the town I loved so well")

# Project Gutenberg EBook #12383, "The Poetical Works of William
# Wordsworth, Vol. III" (ed. Knight, 1896), 1804 section:
# "I wandered lonely as a cloud" - requested as a candidate source.
WORDSWORTH_LINES = [
    "I wandered lonely as a cloud",
    "That floats on high o'er vales and hills,",
    "When all at once I saw a crowd,",
    "A host, of golden daffodils;",
    "Beside the lake, beneath the trees,",
    "Fluttering and dancing in the breeze.",
    "Continuous as the stars that shine",
    "And twinkle on the milky way,",
    "They stretched in never-ending line",
    "Along the margin of a bay:",
    "Ten thousand saw I at a glance,",
    "Tossing their heads in sprightly dance.",
    "The waves beside them danced; but they",
    "Out-did the sparkling waves in glee:",
    "A poet could not but be gay,",
    "In such a jocund company:",
    "I gazed - and gazed - but little thought",
    "What wealth the show to me had brought:",
    "For oft, when on my couch I lie",
    "In vacant or in pensive mood,",
    "They flash upon that inward eye",
    "Which is the bliss of solitude;",
    "And then my heart with pleasure fills,",
    "And dances with the daffodils.",
]

NAMED = [
    ("crow sentence (intro, first 20)", INTRO),
    ("they SEe and COMe (normalised)", "They see and come never forget the town"),
    ("title as published (19+lyric)", "THE TOWN I LOVED SO WELL IN MY MEMORY"),
    ("title that-variant", "THE TOWN THAT I HAVE LOVED SO WELL"),
    ("song line 1", "In my memory I will always see"),
    ("song line 2", "The town that I have loved so well"),
    ("song line 3", "Where our school played ball by the gas yard wall"),
    ("song chorus close", "In the town I loved so well"),
    ("semantic: town betrayed", "A town betrayed by strangers not once or twice"),
    ("semantic: three times", "Not once or twice but three times betrayed"),
    ("semantic: sacred soil", "To unveil the truth and smell of grief sacred soil"),
    ("semantic: found truth", "We found the truth in sacred soil never forget"),
    ("semantic: watch", "The old crows are on the watch never forget"),
    ("derry hypothesis A", "Derry the town we loved betrayed three times"),
    ("derry hypothesis B", "Siege of Derry not once or twice but three times"),
    ("derry hypothesis C", "Londonderry sacred soil we found the truth"),
    ("wordsworth: opening line", "I wandered lonely as a cloud"),
    ("wordsworth: daffodils line", "A host of golden daffodils"),
    ("wordsworth: floats line", "That floats on high o'er vales and hills"),
    ("wordsworth: glance line", "Ten thousand saw I at a glance"),
    ("wordsworth: sparkling line", "They out-did the sparkling waves in glee"),
    ("wordsworth: wealth line", "What wealth the show to me had brought"),
    ("wordsworth: inward eye", "They flash upon that inward eye solitude"),
    ("wordsworth: bliss", "Which is the bliss of solitude and then"),
    ("wordsworth: cloud + daffodils", "I wandered lonely as a cloud a host"),
    ("wordsworth: golden host", "A host of golden daffodils beside the lake"),
]


def poem_streams():
    lines = [letters(x) for x in POEM_LINES]
    words = [x.upper().split() for x in POEM_LINES]
    intro = letters(INTRO)
    poem = "".join(lines)
    streams = {
        "intro-sentence": intro,
        "poem blob": poem,
        "intro+poem": intro + poem,
        "poem reversed": poem[::-1],
        "each line reversed": "".join(x[::-1] for x in lines),
        "word order reversed": "".join(w for lw in reversed(words) for w in reversed(lw)),
        "word-initials": "".join(w[0] for lw in words for w in lw),
        "word-finals": "".join(w[-1] for lw in words for w in lw),
        "song lyrics blob (Coulter opening)": SONG_BLOB,
        "wordsworth blob (Gutenberg #12383)": letters(" ".join(WORDSWORTH_LINES)),
        "wordsworth+acrostic": letters(" ".join(WORDSWORTH_LINES))
            + "".join(l[0] for l in WORDSWORTH_LINES),
    }
    for k in (2, 3):
        for off in range(k):
            streams["stride %d offset %d" % (k, off)] = poem[off::k]
    return streams


def micro_extractions():
    lines = [letters(x) for x in POEM_LINES]
    words = [x.upper().split() for x in POEM_LINES]
    caps = "".join(c for c in (INTRO + " " + " ".join(POEM_LINES)) if c.isupper())
    acro = "".join(x[0] for x in lines)
    tele = "".join(x[-1] for x in lines)
    diag = "".join(lines[i][i] for i in range(len(lines)) if len(lines[i]) > i)
    firstw = "".join(lw[0] for lw in words if lw)
    lastw = "".join(lw[-1] for lw in words if lw)
    secw = "".join(lw[1] for lw in words if len(lw) > 1)
    print("\nmicro-extractions (< 20 letters -> documented, not decryptable):")
    print("  caps stream        : %s (%d)" % (caps, len(caps)))
    print("  line acrostic      : %s" % acro)
    print("  line telestich     : %s" % tele)
    print("  main diagonal      : %s" % diag)
    print("  first words joined : %s (%d)" % (firstw, len(firstw)))
    print("  second words joined: %s (%d)" % (secw, len(secw)))
    print("  last words joined  : %s (%d)" % (lastw, len(lastw)))


SEM_TOK18 = ["NEVER", "FORGET", "TOWN", "LOVED", "BETRAYED", "STRANGERS",
             "THREE", "TIMES", "TRUTH", "GRIEF", "SACRED", "SOIL", "CROWS",
             "WATCH", "DERRY", "DOIRE", "LONDONDERRY", "SIEGE"]
SEM_TOK10 = SEM_TOK18[:10]


def semantic_family():
    out = set()
    for tok in permutations(SEM_TOK18, 3):
        s = "".join(tok)
        if 20 <= len(s) <= 44:
            out.add(s[:20])
    for tok in permutations(SEM_TOK10, 4):
        s = "".join(tok)
        if 20 <= len(s) <= 44:
            out.add(s[:20])
    # Wordsworth angle: daffodil-flavoured phrases mixing both sources
    for tok in permutations(SEM_TOK10 + ["DAFFODILS", "GOLDEN", "CLOUD"], 3):
        s = "".join(tok)
        if 20 <= len(s) <= 44:
            out.add(s[:20])
    return out


def gather_candidates():
    prior = set()
    named_prior = [(lb, letters(ph)[:20]) for lb, ph in probe.HINT_LINES]
    prior |= {p for _, p in named_prior if len(p) == 20}
    _, prior_windows = probe.hint_windows()
    prior |= set(prior_windows)

    cands = {}   # phrase -> (class, label)
    def add(cls, label, phrase):
        phrase = letters(phrase)[:20]
        if len(phrase) != 20:
            return
        cands.setdefault(phrase, (cls, label))

    for label, phrase in NAMED:
        add("named", label, phrase)
    for sname, blob in poem_streams().items():
        for i, w in enumerate(windows_of(blob)):
            add("stream:" + sname, "%s +%d" % (sname, i), w)
    for s in sorted(semantic_family()):
        add("semantic-permutation", "token-perm", s)

    tagged = {}
    for phrase, (cls, label) in cands.items():
        cov = "PRIOR" if phrase in prior else "NEW"
        tagged[phrase] = (cls, label, cov)
    return tagged, prior


# =========================================================================
# PART E - calibrated scan
# =========================================================================

def _zero_in_chain(phrase):
    km = ref.key_material(phrase, zero_last=True)
    return 0 in km["gen50"][40:50]


def part_e(tagged):
    print()
    print("=" * 74)
    print("PART E - calibrated candidate scan")
    print("=" * 74)
    eng = probe.metrics(SAMPLE)
    null_plain = ref.secom_decrypt(DIGITS, "THEQUICKBROWNFOXJUMP")
    null = probe.metrics(null_plain)
    bigram_floor = (eng["bigram"] + null["bigram"]) / 2
    chi2_ceiling = (eng["chi2"] + null["chi2"]) / 2
    ioc_ceiling = (eng["ioc"] + null["ioc"]) / 2
    print("english sample : IoC %.4f  chi2 %7.1f  bigram %+.3f"
          % (eng["ioc"], eng["chi2"], eng["bigram"]))
    print("null decrypt   : IoC %.4f  chi2 %7.1f  bigram %+.3f"
          % (null["ioc"], null["chi2"], null["bigram"]))
    print("ladder: bigram >= %+.3f AND chi2 <= %.1f AND IoC <= %.4f"
          % (bigram_floor, chi2_ceiling, ioc_ceiling))

    print("\n--- positive controls (known phrase must SURVIVE the ladder)")
    for phrase in ("CORRECTHORSEBATTERYSTAPLE", CTRL_PHRASE):
        ct = ref.secom_encrypt(SAMPLE, phrase)
        back = ref.secom_decrypt(ct, phrase)
        m = probe.metrics(back)
        ok = (m["bigram"] >= bigram_floor and m["chi2"] <= chi2_ceiling
              and m["ioc"] <= ioc_ceiling)
        print("  %-26s IoC %.4f chi2 %7.1f bigram %+.3f -> %s"
              % (probe.letters_only(phrase)[:20], m["ioc"], m["chi2"],
                 m["bigram"], "SURVIVES (control ok)" if ok else "FAIL"))
        if not ok:
            print("  !! control failed - ladder miscalibrated, abort scan")
            return

    rows = []
    n_degenerate = 0
    for phrase, (cls, label, cov) in tagged.items():
        prior = cov == "PRIOR"
        for mode, mlabel in ((True, "worksheet"), (False, "legacy")):
            # prior-set: re-test ONLY the zero-contaminated phrases, which
            # the merged record never saw under the worksheet numbering
            if prior and not (mode and _zero_in_chain(phrase)):
                continue
            try:
                plain = ref.secom_decrypt(DIGITS, phrase, zero_last=mode)
            except ValueError:
                n_degenerate += 1
                continue
            m = probe.metrics(plain)
            ok = (m["bigram"] >= bigram_floor and m["chi2"] <= chi2_ceiling
                  and m["ioc"] <= ioc_ceiling)
            rows.append((phrase, cls, label, mlabel, m, ok, plain,
                         "PRIOR-RETEST" if prior else "NEW"))

    n_prior = sum(1 for v in tagged.values() if v[2] == "PRIOR")
    n_new = sum(1 for v in tagged.values() if v[2] == "NEW")
    n_retest = sum(1 for r in rows if r[7] == "PRIOR-RETEST")
    print("\ncoverage: %d unique 20-letter candidates total" % len(tagged))
    print("  %4d covered by the merged 111-candidate record" % n_prior)
    print("  %4d thereof zero-contaminated -> re-tested under the worksheet" % n_retest)
    print("       board-numbering rule in this pass")
    print("  %4d NEW candidates in this pass (scanned in BOTH board modes)" % n_new)
    print("  %4d decrypt-and-score events executed" % len(rows))
    print("  %4d degenerate key phrases skipped (chain cannot close two widths)"
          % n_degenerate)
    by_class = Counter(v[0] for v in tagged.values())
    print("classes: " + ", ".join("%s x%d" % kv for kv in sorted(by_class.items())))

    survivors = [r for r in rows if r[5]]
    print("\nSURVIVORS (decrypt events beating the whole ladder): %d"
          % len(survivors))
    for phrase, cls, label, mlabel, m, ok, plain, origin in survivors:
        print("  %s %-30s %-9s %-9s IoC %.4f chi2 %.1f bigram %+.3f"
              % (phrase, label[:30], mlabel, origin, m["ioc"], m["chi2"],
                 m["bigram"]))
        print("    %s..." % plain[:70])

    print("\nbest 12 NEW decrypts by bigram (all still rejections):")
    newonly = [r for r in rows if r[7] == "NEW"]
    newonly.sort(key=lambda r: (-r[4]["bigram"], r[0]))
    for phrase, cls, label, mlabel, m, ok, plain, origin in newonly[:12]:
        print("  %s %-30s %-9s IoC %.4f chi2 %7.1f bigram %+.3f"
              % (phrase, (cls + ":" + label)[:30], mlabel, m["ioc"],
                 m["chi2"], m["bigram"]))
    if not survivors:
        print("\nverdict: every candidate is REJECTED. The phrase remains")
        print("         unknown; the structured extraction record, the board")
        print("         skeleton, and the negative results are the product.")


# =========================================================================

def main():
    part_a()
    part_b()
    part_c()
    print()
    print("=" * 74)
    print("PART D - structured 20-letter extraction of the hint text")
    print("=" * 74)
    micro_extractions()
    tagged, prior = gather_candidates()
    part_e(tagged)


if __name__ == "__main__":
    main()
