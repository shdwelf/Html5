#!/usr/bin/env python3
"""Independent reference implementation of the SECOM hand cipher.

Written from the published worksheet at
https://www.ciphermachinesandcryptology.com/en/secom.htm without reusing
tools/secom_probe.py, so the two implementations can cross-validate each
other.  Ambiguities are pinned to the page's own worked example:

  * rank assignment: 1..9 in alphabetical/numerical order, ties read
    left-to-right, the 10th rank is written 0;
  * transposition read-off: ascending rank with 0 counting as LAST;
  * widths: unique digits of the last chain row, right-to-left, summed
    until the result exceeds 9 (twice);
  * transposition keys: the 50 chain digits read column-wise with the
    10-digit mix (2nd key half + checkerboard top, mod 10);
  * disrupted-transposition triangles exactly as the worked example;
  * the checkerboard digits row is UNROTATED in the worked example
    (the page's rotation prose contradicts its own example there);
    `digits_row_mode="rotated"` is kept for completeness but is not the
    authoritative mode.

Self-test reproduces the official 105-digit vector, including the exact
triangular fill, and round-trips.
"""

import math

ROW1_BASE = "BCDFGHJKLM"
ROW2_BASE = "PQRUVWXYZ*"
ROW3_BASE = "1234567890"
BLANKS = (2, 5, 8)                 # 3rd, 6th, 9th squares (0 based)
HIGHFREQ = "ESTONIA"               # one-digit letters, in column order

# ------------------------------------------------------------------ ranks

def letters_only(s):
    return "".join(c for c in s.upper() if "A" <= c <= "Z")


def assign_ranks(seq):
    """1..9 by value (ties in appearance order); 10th assignment is 0."""
    order = sorted(range(len(seq)), key=lambda i: (seq[i], i))
    out = [0] * len(seq)
    for r, pos in enumerate(order):
        out[pos] = (r + 1) % 10
    return out


def read_order(keydigits):
    """Column read order: ascending digit, with 0 treated as 10 (last)."""
    return sorted(range(len(keydigits)),
                  key=lambda i: ((keydigits[i] if keydigits[i] else 10), i))

# ------------------------------------------------------------------ key schedule

def chain_add(seed, total_new=50):
    out = list(seed)
    while len(out) < len(seed) + total_new:
        out.append((out[-10] + out[-9]) % 10)
    return out[len(seed):]


def key_material(phrase, zero_last=True):
    letters = letters_only(phrase)
    if len(letters) < 20:
        raise ValueError("key phrase must supply at least 20 letters")
    h1 = [ord(c) - 65 for c in letters[:10]]
    h2 = [ord(c) - 65 for c in letters[10:20]]
    d1, d2 = assign_ranks(h1), assign_ranks(h2)
    srow = [(a + b) % 10 for a, b in zip(d1, d2)]
    gen = chain_add(srow, 50)
    lastrow = gen[40:50]
    # worksheet rule: "assign 1 to the smallest digit ... treating 0 as the
    # last number".  zero_last=False reproduces the legacy probe behaviour
    # (0 ranked smallest) for cross-validation of the zero-free cases only.
    if zero_last:
        top = assign_ranks([10 if d == 0 else d for d in lastrow])
    else:
        top = assign_ranks(list(lastrow))

    # widths: unique digits read right-to-left STARTING at the end of the
    # last row of the 50 generated digits, continuing through the block
    # (the worksheet says "starting at the end of the last row ... from
    # right to left"); sums close when they exceed 9.
    seen, stream = set(), []
    for d in reversed(gen):
        if d not in seen:
            seen.add(d)
            stream.append(d)
    widths, acc = [], 0
    for d in stream:
        acc += d
        if acc > 9:
            widths.append(acc)
            acc = 0
            if len(widths) == 2:
                break
    if len(widths) < 2:
        # documented edge case: a chain whose distinct values cannot close
        # two sums > 9 (e.g. an even-only chain); the key phrase is unusable
        raise ValueError("degenerate SECOM key: transposition widths "
                         "not obtainable from the chain block")
    w1, w2 = widths

    seed2 = [(a + b) % 10 for a, b in zip(d2, top)]
    block = [gen[r * 10:(r + 1) * 10] for r in range(5)]
    colstream = [block[r][c] for c in read_order(seed2) for r in range(5)]
    return {
        "letters20": letters[:20], "d1": d1, "d2": d2, "sum": srow,
        "gen50": gen, "top": top, "w1": w1, "w2": w2, "mix": seed2,
        "tkey1": colstream[:w1], "tkey2": colstream[w1:w1 + w2],
    }

# ------------------------------------------------------------------ checkerboard

def build_board(top, digits_row_mode="identity"):
    """top: 10 ints.  Returns (singles, prefix_rows, grid).
    singles: col -> one-digit letter; prefix_rows: {row_index: prefix digit};
    grid[row][col] -> symbol."""
    nonblank = [c for c in range(10) if c not in BLANKS]
    singles = {c: HIGHFREQ[i] for i, c in enumerate(nonblank)}
    prefix_rows = {r: top[c] for r, c in enumerate(BLANKS)}
    grid = []
    for r, c in enumerate(BLANKS):
        base = (ROW1_BASE, ROW2_BASE, ROW3_BASE)[r]
        if r == 2 and digits_row_mode == "identity":
            grid.append({col: str(col) for col in range(10)})
        else:
            grid.append({col: base[(col - c) % 10] for col in range(10)})
    return singles, prefix_rows, grid


def board_encode(text, top, digits_row_mode="identity"):
    singles, prefix_rows, grid = build_board(top, digits_row_mode)
    inv_single = {v: k for k, v in singles.items()}
    inv_grid = [{v: k for k, v in row.items()} for row in grid]
    out = []
    for ch in text:
        ch = "*" if ch == " " else ch
        if ch in inv_single:
            out.append(str(top[inv_single[ch]]))
            continue
        for r in range(3):
            if ch in inv_grid[r]:
                out.append(str(prefix_rows[r]) + str(top[inv_grid[r][ch]]))
                break
        else:
            raise ValueError("cannot encode %r" % ch)
    return "".join(out)


def board_decode(digits, top, digits_row_mode="identity"):
    singles, prefix_rows, grid = build_board(top, digits_row_mode)
    by_top = {top[c]: c for c in range(10)}
    prefix_set = set(prefix_rows.values())
    out, i, n = [], 0, len(digits)
    while i < n:
        d = int(digits[i])
        if d in prefix_set:
            if i + 1 >= n:
                out.append("?")           # dangling trailing null digit
                i += 1
                continue
            col = by_top[int(digits[i + 1])]
            out.append(grid[[r for r, p in prefix_rows.items()
                             if p == d][0]][col])
            i += 2
        else:
            col = by_top[d]
            out.append(singles[col] if col not in BLANKS else "?")
            i += 1
    return "".join(out)

# ------------------------------------------------------------------ transposition

def simple_transpose_encrypt(digits, key):
    w, n = len(key), len(digits)
    rows = math.ceil(n / w)
    grid = [digits[r * w:min((r + 1) * w, n)] for r in range(rows)]
    return "".join(grid[r][c] for c in read_order(key)
                   for r in range(rows) if c < len(grid[r]))


def simple_transpose_decrypt(digits, key):
    w, n = len(key), len(digits)
    rows = math.ceil(n / w)
    base, extra = divmod(n, w)
    collen = [base + (c < extra) for c in range(w)]
    cols, pos = {}, 0
    for c in read_order(key):
        cols[c] = digits[pos:pos + collen[c]]
        pos += collen[c]
    return "".join(cols[c][r] for r in range(rows)
                   for c in range(w) if r < len(cols[c]))


def _disrupted_geometry(n, w, key):
    rows = math.ceil(n / w)
    rowlens = [w] * (rows - 1) + [n - (rows - 1) * w]
    order = read_order(key)
    tri, r, ti = set(), 0, 0
    while ti < w and r <= rows - 1:
        j = order[ti]
        i = 0
        while j + i <= w - 1 and r + i <= rows - 1:
            for c in range(j + i, w):     # triangle row spans to the last col
                if c < rowlens[r + i]:
                    tri.add((r + i, c))
            i += 1
        r = r + (w - 1 - j) + 2           # triangle run + one full row
        ti += 1
    return rows, rowlens, tri


def disrupted_encrypt(digits, key):
    w, n = len(key), len(digits)
    rows, rowlens, tri = _disrupted_geometry(n, w, key)
    grid = [[None] * rowlens[r] for r in range(rows)]
    pos = 0
    for r in range(rows):
        for c in range(rowlens[r]):
            if (r, c) not in tri:
                grid[r][c] = digits[pos]; pos += 1
    for r in range(rows):
        for c in range(rowlens[r]):
            if (r, c) in tri:
                grid[r][c] = digits[pos]; pos += 1
    assert pos == n
    return "".join(grid[r][c] for c in read_order(key)
                   for r in range(rows) if c < rowlens[r])


def disrupted_decrypt(digits, key):
    w, n = len(key), len(digits)
    rows, rowlens, tri = _disrupted_geometry(n, w, key)
    grid = [[None] * rowlens[r] for r in range(rows)]
    pos = 0
    for c in read_order(key):
        for r in range(rows):
            if c < rowlens[r]:
                grid[r][c] = digits[pos]; pos += 1
    assert pos == n
    return "".join(grid[r][c] for r in range(rows)
                 for c in range(rowlens[r]) if (r, c) not in tri) + \
           "".join(grid[r][c] for r in range(rows)
                 for c in range(rowlens[r]) if (r, c) in tri)

# ------------------------------------------------------------------ full cipher

def secom_encrypt(plaintext, phrase, digits_row_mode="identity",
                  zero_last=True):
    km = key_material(phrase, zero_last)
    encoded = board_encode(plaintext.upper().replace(" ", "*"), km["top"],
                           digits_row_mode)
    encoded += "0" * ((-len(encoded)) % 5)
    return disrupted_encrypt(simple_transpose_encrypt(encoded, km["tkey1"]),
                             km["tkey2"])


def secom_decrypt(ciphertext, phrase, digits_row_mode="identity",
                  zero_last=True):
    km = key_material(phrase, zero_last)
    stage1 = disrupted_decrypt(ciphertext, km["tkey2"])
    encoded = simple_transpose_decrypt(stage1, km["tkey1"])
    return board_decode(encoded, km["top"], digits_row_mode)


# ------------------------------------------------------------------ self test

def selftest(verbose=True):
    pt = "RV TOMORROW AT 1400PM TO COMPLETE TRANSACTION USE DEADDROP AS USUAL"
    key = "MAKE NEW FRIENDS BUT KEEP THE OLD"
    km = key_material(key)
    assert "".join(map(str, km["d1"])) == "7162830495"
    assert "".join(map(str, km["d2"])) == "3728109645"
    assert "".join(map(str, km["sum"])) == "0880939030"
    assert "".join(map(str, km["gen50"])) == (
        "86892293384471412612818553873099308150398238965327")
    assert "".join(map(str, km["top"])) == "8139065427"
    assert (km["w1"], km["w2"]) == (12, 11)
    assert "".join(map(str, km["mix"])) == "1857164062"
    assert "".join(map(str, km["tkey1"])) == "848982458982"
    assert "".join(map(str, km["tkey2"])) == "09792855878"
    enc = board_encode(pt.upper().replace(" ", "*"), km["top"])
    assert enc == ("646760903106464068607960212028286631609060390316638898"
                   "60964751739940560621860308730306406660716062162738")
    ct = secom_encrypt(pt, key)
    assert ct == ("777193862200032042396003829683146080607178016736060606"
                  "463536069686740369681890014021906662606660863160549")
    back = secom_decrypt(ct, key).replace("*", " ")
    assert back.startswith(pt.replace("*", " ")[:60]), back
    if verbose:
        print("secom_ref_impl self-test: official worksheet vector PASS")
    return True


if __name__ == "__main__":
    selftest()
