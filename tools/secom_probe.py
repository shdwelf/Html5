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
