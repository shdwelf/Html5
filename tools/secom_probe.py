#!/usr/bin/env python3
"""Exact, auditable SECOM probe following Rijmenants' published worksheet."""
import hashlib
import re

# Published verbatim at https://www.ciphermachinesandcryptology.com/en/crow.htm
CROW_CIPHERTEXT = '''
81232 44783 73232 32263 75722 86365 51963 87366 03222 72668
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
08538 20333 27838 52662 13523 27833 39332 81488 25260 82636
'''


def sequence(text):
    # Stable alphabetical/numeric rank, with 0 denoting rank 10.
    out = [None] * len(text)
    for rank, i in enumerate(sorted(range(len(text)), key=lambda i: (text[i], i)), 1):
        out[i] = rank % 10
    return ''.join(map(str, out))


def chain(seed, count=50):
    a = list(map(int, seed))
    for i in range(count):
        a.append((a[i] + a[i + 1]) % 10)
    return ''.join(map(str, a[-count:]))


def schedule(phrase):
    p = re.sub('[^A-Z]', '', phrase.upper())[:20]
    if len(p) != 20:
        raise ValueError('SECOM requires at least 20 letters')
    a, b = sequence(p[:10]), sequence(p[10:])
    seed = ''.join(str((int(x) + int(y)) % 10) for x, y in zip(a, b))
    block = chain(seed)
    board = sequence(block[-10:])
    # Widths: unique digits right-to-left, continuing after first sum exceeds 9.
    rev, seen, widths, total = block[::-1], set(), [], 0
    for x in rev:
        if x in seen:
            continue
        seen.add(x); total += int(x)
        if total > 9:
            widths.append(total); total = 0
            if len(widths) == 2: break
    mix = ''.join(str((int(x) + int(y)) % 10) for x, y in zip(b, board))
    # Read chain block by columns ordered 1..9,0 according to the sequenced mix.
    stream = ''.join(block[r * 10 + c] for d in '1234567890'
                     for c, q in enumerate(mix) if q == d for r in range(5))
    return dict(phrase=p, first=a, second=b, seed=seed, block=block, board=board,
                widths=widths, keys=[stream[:widths[0]], stream[widths[0]:sum(widths)]])


def key_columns(key):
    return [i for d in '1234567890' for i, x in enumerate(key) if x == d]


def physical_cells(n, width):
    return [(r, c) for r in range((n + width - 1) // width)
            for c in range(width) if r * width + c < n]


def disruption_cells(n, key):
    w = len(key); cells = set(physical_cells(n, w)); triangles = set(); row = 0
    for col in key_columns(key):
        for delta in range(w - col):
            r = row + delta
            for c in range(col + delta, w):
                if (r, c) in cells: triangles.add((r, c))
        row += (w - col) + 1  # the triangular run, followed by one full row
        if row >= (n + w - 1) // w: break
    return cells, triangles


def transpose_encrypt(text, key, disrupted=False):
    n, w = len(text), len(key); cells = set(physical_cells(n, w))
    if disrupted:
        _, triangles = disruption_cells(n, key)
        write = sorted(cells - triangles) + sorted(triangles)
    else: write = sorted(cells)
    grid = dict(zip(write, text))
    return ''.join(grid[(r, c)] for c in key_columns(key)
                   for r in range((n + w - 1) // w) if (r, c) in cells)


def transpose_decrypt(text, key, disrupted=False):
    n, w = len(text), len(key); cells = set(physical_cells(n, w)); grid = {}; i = 0
    for c in key_columns(key):
        for r in range((n + w - 1) // w):
            if (r, c) in cells: grid[(r, c)] = text[i]; i += 1
    if disrupted:
        _, triangles = disruption_cells(n, key)
        read = sorted(cells - triangles) + sorted(triangles)
    else: read = sorted(cells)
    return ''.join(grid[p] for p in read)


def checkerboard(schedule):
    top = schedule['board']; rowheads = [top[i] for i in (2, 5, 8)]
    enc = {}; dec = {}; singles = 'ES TON IA'.replace(' ', '')
    # E,S,blank,T,O,blank,N,I,blank,A under top digits
    topchars = ['E','S',None,'T','O',None,'N','I',None,'A']
    for d, ch in zip(top, topchars):
        if ch: enc[ch] = d; dec[d] = ch
    for row_i, (head, chars) in enumerate(zip(rowheads, ['BCDFGHJKLM','PQRUVWXYZ*','0123456789'])):
        start = top.index(head)
        # Letter rows rotate so B/P begins under the row-head digit. The numeric
        # row is printed 0..9 left-to-right in the authoritative worksheet.
        for j, ch in enumerate(chars):
            col = j if row_i == 2 else (start + j) % 10
            code = head + top[col]
            enc[ch] = code; dec[code] = ch
    enc[' '] = enc.pop('*'); dec = {k: (' ' if v == '*' else v) for k, v in dec.items()}
    return enc, dec


def encrypt(plain, phrase):
    s = schedule(phrase); enc, _ = checkerboard(s)
    p = re.sub(r'[^A-Z0-9 *]', '', plain.upper())
    digits = ''.join(enc[ch] for ch in p)
    digits += '0' * (-len(digits) % 5)
    return transpose_encrypt(transpose_encrypt(digits, s['keys'][0]), s['keys'][1], True)


def decrypt(cipher, phrase):
    s = schedule(phrase); _, dec = checkerboard(s)
    digits = re.sub(r'\D', '', cipher)
    digits = transpose_decrypt(transpose_decrypt(digits, s['keys'][1], True), s['keys'][0])
    out=[]; i=0
    while i < len(digits):
        if digits[i] in dec: out.append(dec[digits[i]]); i += 1
        elif digits[i:i+2] in dec: out.append(dec[digits[i:i+2]]); i += 2
        else: out.append('?'); i += 1
    return ''.join(out), digits, s


# ---------------------------------------------------------------------------
# Continued research, second 2026-10-02 pass.
#
# The scoring ladder below is modeled on the fitness design that the Crow's
# first listed solver, Oleksii Sylichenko, published for his Enigma breaker
# (https://github.com/asilichenko/enigma, hill-climbing module):
#
#   * a cheap integer Index-of-Coincidence filter first — his IocFitness
#     deliberately simplifies IoC to sum(h[i]^2), dropping the static
#     N*(N-1) denominator because only the ranking matters;
#   * n-gram fitness afterwards for the fine decision;
#   * thresholds calibrated against a same-length sample text in the target
#     language before any search is trusted (his README, "Stage 1 — obtain
#     search parameters").
#
# His repository is Enigma tooling under LGPL v3 and contains neither SECOM
# code nor a Crow solution; only the *method discipline* transfers here.
# ---------------------------------------------------------------------------

ENGLISH_FREQ = {  # letter frequencies, percent (standard corpus values)
    'E': 12.70, 'T': 9.06, 'A': 8.17, 'O': 7.51, 'I': 6.97, 'N': 6.75,
    'S': 6.33, 'H': 6.09, 'R': 5.99, 'D': 4.25, 'L': 4.03, 'C': 2.78,
    'U': 2.76, 'M': 2.41, 'W': 2.36, 'F': 2.23, 'G': 2.02, 'Y': 1.97,
    'P': 1.93, 'B': 1.49, 'V': 0.98, 'K': 0.77, 'J': 0.15, 'X': 0.15,
    'Q': 0.10, 'Z': 0.07,
}

# Compact per-mille table of common English bigrams; unseen bigrams score the
# floor.  Coarse on purpose: it separates English from checkerboard noise, it
# does not pretend to be a corpus model.
TOP_BIGRAMS = {
    'TH': 27.1, 'HE': 23.3, 'IN': 20.3, 'ER': 17.8, 'AN': 16.1, 'RE': 14.1,
    'ES': 13.2, 'ON': 13.2, 'ST': 12.5, 'NT': 11.7, 'EN': 11.3, 'AT': 11.2,
    'ED': 10.8, 'ND': 10.7, 'TO': 10.7, 'OR': 10.6, 'EA': 10.0, 'TI': 9.9,
    'AR': 9.8, 'TE': 9.8, 'NG': 8.9, 'AL': 8.8, 'IT': 8.8, 'AS': 8.7,
    'IS': 8.6, 'HA': 8.3, 'ET': 7.6, 'SE': 7.3, 'OU': 7.2, 'OF': 7.1,
    'LE': 7.0, 'SA': 6.8, 'VE': 6.8, 'RO': 6.6, 'RA': 6.5, 'RI': 6.3,
    'HI': 6.2, 'NE': 6.2, 'ME': 6.1, 'DE': 6.1, 'CO': 5.9, 'TA': 5.8,
    'EC': 5.8, 'SI': 5.5, 'LL': 5.4, 'SO': 5.3, 'NA': 5.2, 'LI': 5.0,
    'LA': 4.9, 'EL': 4.6, 'MA': 4.4, 'DI': 4.3, 'IC': 4.2, 'RT': 4.2,
    'NS': 4.2, 'IO': 4.1, 'WE': 4.1, 'OM': 4.0, 'UR': 4.0, 'US': 3.9,
    'OW': 3.3, 'LO': 3.3, 'UT': 3.2, 'DA': 3.0, 'UN': 3.0, 'WA': 3.0,
    'EE': 2.8, 'NO': 2.8, 'CE': 2.6, 'MO': 2.5, 'TR': 2.5, 'BE': 2.3,
}

import math


def letters_only(text):
    return re.sub('[^A-Z]', '', text.upper())


def ioc(text):
    """Classic Friedman index of coincidence over A-Z."""
    s = letters_only(text)
    n = len(s)
    if n < 2:
        return 0.0
    hist = {}
    for ch in s:
        hist[ch] = hist.get(ch, 0) + 1
    return sum(v * (v - 1) for v in hist.values()) / (n * (n - 1))


def ioc_integer(text):
    """Sylichenko's simplified integer IoC: sum of squared counts."""
    s = letters_only(text)
    hist = {}
    for ch in s:
        hist[ch] = hist.get(ch, 0) + 1
    return sum(v * v for v in hist.values())


def chi2_english(text):
    """Chi-squared distance from English letter frequencies (lower = closer)."""
    s = letters_only(text)
    n = len(s)
    if not n:
        return float('inf')
    out = 0.0
    for ch, pct in ENGLISH_FREQ.items():
        expected = n * pct / 100.0
        observed = s.count(ch)
        out += (observed - expected) ** 2 / expected
    return out


def bigram_score(text):
    """Mean log10 per-mille bigram weight; unseen bigrams take a -1 floor."""
    s = letters_only(text)
    if len(s) < 2:
        return float('-inf')
    total = 0.0
    for i in range(len(s) - 1):
        w = TOP_BIGRAMS.get(s[i:i + 2])
        total += math.log10(w) if w else -1.0
    return total / (len(s) - 1)


def metrics(text):
    return dict(ioc=ioc(text), ioc_int=ioc_integer(text),
                chi2=chi2_english(text), bigram=bigram_score(text),
                letters=len(letters_only(text)))


def crow_digit_histogram():
    """Columnar transposition permutes digits but never changes their counts,
    so the Crow histogram equals the histogram of the checkerboard-encoded
    plaintext (plus 0-pads to a multiple of five).  Any proposed solution must
    reproduce this exact multiset — a free necessary condition that costs one
    pass over 600 digits, long before full re-encryption."""
    digits = re.sub(r'\D', '', CROW_CIPHERTEXT)
    hist = {str(d): digits.count(str(d)) for d in range(10)}
    return digits, hist


# The hint poem is quoted from the challenge page itself; the song title line
# THETOWNILOVEDSOWELL has 19 letters and stays excluded (padding would add an
# undocumented choice).  Every entry is a documented, hint-derived candidate.
HINT_LINES = [
    ('hint line 1-2', 'NEVER FORGET THE TOWN WE LOVED'),
    ('hint line 3', 'A TOWN BETRAYED BY STRANGERS'),
    ('hint line 4', 'NOT ONCE OR TWICE BUT THREE TIMES'),
    ('hint line 5', 'TO UNVEIL THE TRUTH AND SMELL OF GRIEF'),
    ('hint line 6 + wrap', 'WE FOUND IN SACRED SOIL NEVER FORGET'),
    ('crow sentence', 'THE OLD CROWS ARE ON THE WATCH'),
    ('crow sentence 2', 'THEY SEE AND COME NEVER FORGET THE TOWN'),
    ('song opening (re-run)', 'IN MY MEMORY I WILL ALWAYS SEE'),
]


def hint_windows():
    """Every 20-letter window of the concatenated six-line hint."""
    blob = letters_only('NEVER FORGET THE TOWN WE LOVED '
                        'A TOWN BETRAYED BY STRANGERS '
                        'NOT ONCE OR TWICE BUT THREE TIMES '
                        'TO UNVEIL THE TRUTH AND SMELL OF GRIEF '
                        'WE FOUND IN SACRED SOIL')
    return blob, [blob[i:i + 20] for i in range(len(blob) - 19)]


def scan_candidates(bigram_floor, chi2_ceiling, ioc_ceiling):
    """Decrypt the Crow under every candidate and score with the ladder.
    Returns (rows, survivors). A survivor must beat ALL calibrated
    thresholds; everything else is a recorded rejection, not a hint.

    The IoC rung is load-bearing: SECOM's checkerboard deliberately maps the
    most frequent cipher digits onto high-frequency English letters
    (E,S,T,O,N,I,A), so a WRONG key still emits letter soup whose unigram and
    bigram statistics flatter English models.  Friedman IoC exposes that soup
    — wrong-key output clusters near 0.11-0.17, far above English 0.067."""
    rows, survivors, seen = [], [], set()
    named = [(label, letters_only(phrase)[:20]) for label, phrase in HINT_LINES]
    blob, windows = hint_windows()
    cands = [(label, p) for label, p in named if len(p) == 20]
    cands += [('hint window +%d' % i, w) for i, w in enumerate(windows)]
    for label, phrase in cands:
        if phrase in seen:
            continue
        seen.add(phrase)
        plain, _, _ = decrypt(CROW_CIPHERTEXT, phrase)
        m = metrics(plain)
        ok = (m['bigram'] >= bigram_floor and m['chi2'] <= chi2_ceiling
              and m['ioc'] <= ioc_ceiling)
        rows.append((label, phrase, m, ok))
        if ok:
            survivors.append((label, phrase, m))
    return rows, survivors


if __name__ == '__main__':
    example_plain='RV TOMORROW AT 1400PM TO COMPLETE TRANSACTION USE DEADDROP AS USUAL'
    expected='777193862200032042396003829683146080607178016736060606463536069686740369681890014021906662606660863160549'
    got=encrypt(example_plain, 'MAKE NEW FRIENDS BUT KEEP THE OLD')
    if got != expected:
        raise SystemExit('official SECOM example mismatch: ' + got)
    recovered, _, _ = decrypt(expected, 'MAKE NEW FRIENDS BUT KEEP THE OLD')
    if not recovered.startswith('RV TOMORROW AT 1400PM TO COMPLETE TRANSACTION USE DEADDROP AS USUAL'):
        raise SystemExit('official SECOM decrypt mismatch: ' + recovered)
    print('official SECOM 105-digit encrypt/decrypt vector: PASS')

    candidate, _, _ = decrypt(CROW_CIPHERTEXT, 'IN MY MEMORY I WILL ALWAYS SEE')
    digest = hashlib.sha256(candidate.encode()).hexdigest()
    expected_digest = '4eea6f3be82930d27e5af3f438c34ee1bea353569e0a04e1dcb6737c4f8c1fe5'
    if digest != expected_digest:
        raise SystemExit('Crow candidate result changed: ' + digest)
    print('Crow opening-line candidate: REJECTED (non-English output)')
    print('result sha256:', digest)
    print('result prefix:', candidate[:80])

    # --- second pass: structural histogram + Sylichenko-style scoring ladder
    print()
    print('=== Crow digit histogram (transposition-invariant) ===')
    digits, hist = crow_digit_histogram()
    assert len(digits) == 600, 'Crow ciphertext must hold 600 digits'
    order = sorted(hist, key=lambda d: -hist[d])
    print('counts :', ' '.join('%s:%d' % (d, hist[d]) for d in order))
    print('reading: transposition only permutes digits, so these counts ARE the')
    print('         checkerboard-encoded plaintext counts (+<=4 pad zeros).')
    print('         Any proposed phrase+plaintext must reproduce them exactly')
    print('         before a full re-encryption is even attempted.')

    print()
    print('=== Scoring ladder calibration (Stage 1, per asilichenko/enigma) ===')
    sample = ('THE QUICK CROW FLEW OVER THE QUIET TOWN AND SAW THE PEOPLE '
              'WHO NEVER FORGOT WHAT HAD HAPPENED THERE IN THE YEARS OF '
              'TROUBLE AND GRIEF THEY STILL WALK THE OLD STREETS AND '
              'REMEMBER THE MUSIC OF BETTER DAYS')
    eng = metrics(sample)
    # A symmetric alphabet phrase degenerates (even-only chain yields one
    # width), which is itself a documented SECOM edge case; use a plain
    # pangram-style control instead.
    null_plain, _, _ = decrypt(CROW_CIPHERTEXT, 'THEQUICKBROWNFOXJUMP')
    null = metrics(null_plain)
    print('english sample : IoC %.4f  chi2 %7.1f  bigram %+.3f' % (eng['ioc'], eng['chi2'], eng['bigram']))
    print('null decrypt   : IoC %.4f  chi2 %7.1f  bigram %+.3f' % (null['ioc'], null['chi2'], null['bigram']))
    bigram_floor = (eng['bigram'] + null['bigram']) / 2
    chi2_ceiling = (eng['chi2'] + null['chi2']) / 2
    ioc_ceiling = (eng['ioc'] + null['ioc']) / 2
    print('thresholds     : bigram >= %+.3f AND chi2 <= %.1f AND IoC <= %.4f'
          % (bigram_floor, chi2_ceiling, ioc_ceiling))
    print('note: the IoC rung matters most — the SECOM board biases wrong-key')
    print('      output toward E,S,T,O,N,I,A, flattering unigram/bigram scores.')

    print()
    print('=== Hint-derived candidate scan (all 20-letter phrases) ===')
    rows, survivors = scan_candidates(bigram_floor, chi2_ceiling, ioc_ceiling)
    for label, phrase, m, ok in rows:
        if label.startswith('hint window'):
            continue  # windows are summarized below to keep output stable
        print('%-22s %s  IoC %.4f  chi2 %7.1f  bigram %+.3f  -> %s'
              % (label, phrase, m['ioc'], m['chi2'], m['bigram'],
                 'SURVIVES' if ok else 'rejected'))
    windows = [r for r in rows if r[0].startswith('hint window')]
    w_ok = [r for r in windows if r[3]]
    print('hint windows scanned: %d of 20 letters each; survivors: %d' % (len(windows), len(w_ok)))
    for label, phrase, m, _ in w_ok:
        print('  SURVIVOR %s %s IoC %.4f chi2 %.1f bigram %+.3f' % (label, phrase, m['ioc'], m['chi2'], m['bigram']))
    if survivors:
        print('NOTE: a survivor is a lead for exact re-encryption of all 600')
        print('      digits — it is NOT a solve claim.')
    else:
        print('verdict: every documented hint-derived candidate is REJECTED by')
        print('         the calibrated ladder. The phrase remains unknown; the')
        print('         negative result is the research product.')
