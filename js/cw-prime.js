/* CHIPWRIGHT · cw-prime.js — the number-theory layer.
 *
 * This is not decoration. Primes turn up in hardware work in four places where
 * getting them wrong costs a day:
 *
 *   1. Stride aliasing. A memory bank, channel, or hash bucket count that
 *      shares a factor with your access stride sends every access to the same
 *      bank. Coprimality is the whole test, and primes are the maximal case.
 *   2. LFSR and CRC tap selection. A maximal-length LFSR needs a *primitive*
 *      polynomial over GF(2), whose period is 2^n - 1. When 2^n - 1 is prime
 *      (a Mersenne prime) every non-trivial tap pattern from an irreducible
 *      polynomial is primitive, which is why those widths are favoured.
 *   3. Capacity arithmetic. Flash and disk capacities are not always powers of
 *      two — 24 Mbit (3 MiB) SPI parts are everywhere in platform firmware, and
 *      their address space does not wrap where a naive parser expects.
 *   4. Wear and scheduling. Coprime periods never synchronise. Two polling
 *      loops with periods 7 and 11 only coincide every 77 ticks; periods 8 and
 *      12 coincide every 24. That difference is a bus-collision bug.
 *
 * The sieve here is verified against Project Gutenberg ebook #65, "The First
 * 100,000 Prime Numbers", which is the canonical printed table.
 */

import { hex, popcount } from "./cw-data.js";

/* ------------------------------------------------------------------ *
 * 1. Sieve and factorisation
 * ------------------------------------------------------------------ */

let sieveCache = null;
let sieveCacheLimit = 0;

/** Smallest-prime-factor table up to n. Built once, reused. */
export function spfTable(n) {
  if (sieveCache && sieveCacheLimit >= n) return sieveCache;
  const spf = new Int32Array(n + 1);
  for (let i = 2; i <= n; i++) {
    if (spf[i] === 0) {
      spf[i] = i;
      if (i <= Math.sqrt(n)) for (let j = i * i; j <= n; j += i) if (spf[j] === 0) spf[j] = i;
    }
  }
  sieveCache = spf;
  sieveCacheLimit = n;
  return spf;
}

/** All primes <= n. */
export function primesUpTo(n) {
  if (n < 2) return [];
  const flags = new Uint8Array(n + 1);
  const out = [];
  for (let i = 2; i <= n; i++) {
    if (!flags[i]) {
      out.push(i);
      if (i * i <= n) for (let j = i * i; j <= n; j += i) flags[j] = 1;
    }
  }
  return out;
}

/** The k-th prime, 1-based: nthPrime(1) === 2. */
export function nthPrime(k) {
  if (k < 1) return null;
  // Rosser–Schoenfeld upper bound, safe for k >= 6; small k handled directly.
  const small = [2, 3, 5, 7, 11, 13];
  if (k <= 6) return small[k - 1];
  const lnk = Math.log(k), lnlnk = Math.log(lnk);
  let bound = Math.ceil(k * (lnk + lnlnk - 1 + (1.8 * lnlnk) / lnk)) + 16;
  for (;;) {
    const ps = primesUpTo(bound);
    if (ps.length >= k) return ps[k - 1];
    bound = Math.ceil(bound * 1.5);
  }
}

export function isPrime(n) {
  if (!Number.isFinite(n) || n < 2) return false;
  if (n < 4) return true;
  if (!(n & 1) || n % 3 === 0) return false;
  if (n < 1e6) return spfTable(Math.min(n, 1 << 20))[n] === n;
  for (let i = 5; i * i <= n; i += 6) if (n % i === 0 || n % (i + 2) === 0) return false;
  return true;
}

/** Trial division — enough for anything that fits comfortably in a double. */
export function factorise(n) {
  const out = [];
  if (!Number.isInteger(n) || n < 1) return out;
  let m = n;
  for (let p = 2; p * p <= m; p += p === 2 ? 1 : 2) {
    while (m % p === 0) { out.push(p); m = Math.trunc(m / p); }
  }
  if (m > 1) out.push(m);
  return out;
}

export function factorSummary(n) {
  const f = factorise(n);
  const counts = new Map();
  for (const p of f) counts.set(p, (counts.get(p) || 0) + 1);
  const parts = [...counts.entries()].map(([p, e]) => (e === 1 ? `${p}` : `${p}^${e}`));
  return {
    n,
    factors: f,
    distinct: [...counts.keys()],
    exponents: [...counts.entries()].map(([p, e]) => ({ p, e })),
    expression: parts.join(" × ") || "1",
    isPrime: f.length === 1 && f[0] === n,
    isPowerOfTwo: f.length > 0 && f.every((p) => p === 2),
    log2IfPowerOfTwo: f.every((p) => p === 2) ? f.length : null,
    omega: counts.size, // number of distinct prime factors
    tau: [...counts.values()].reduce((a, e) => a * (e + 1), 1), // number of divisors
  };
}

export function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; }
export const lcm = (a, b) => Math.abs(a * b) / (gcd(a, b) || 1);
export function coprime(a, b) { return gcd(a, b) === 1; }

/** Extended Euclid: returns {g, x, y} with a*x + b*y = g. */
export function egcd(a, b) {
  let [old_r, r] = [a, b], [old_s, s] = [1, 0], [old_t, t] = [0, 1];
  while (r !== 0) {
    const q = Math.trunc(old_r / r);
    [old_r, r] = [r, old_r - q * r];
    [old_s, s] = [s, old_s - q * s];
    [old_t, t] = [t, old_t - q * t];
  }
  return { g: old_r, x: old_s, y: old_t };
}

/** Modular inverse, or null if it does not exist. */
export function modInverse(a, m) {
  const { g, x } = egcd(((a % m) + m) % m, m);
  return g === 1 ? ((x % m) + m) % m : null;
}

/**
 * Chinese Remainder Theorem. Given residues r[i] mod m[i] with pairwise-coprime
 * moduli, returns the unique x mod M. This is how a wide counter built from
 * several narrow ones is reconstructed — a real technique in RTC and event
 * counter designs where the storage is split across small fields.
 */
export function crt(residues, moduli) {
  if (residues.length !== moduli.length) return { ok: false, note: "residue/modulus count mismatch" };
  for (let i = 0; i < moduli.length; i++)
    for (let j = i + 1; j < moduli.length; j++)
      if (!coprime(moduli[i], moduli[j]))
        return { ok: false, note: `moduli ${moduli[i]} and ${moduli[j]} are not coprime (gcd ${gcd(moduli[i], moduli[j])}); CRT does not apply directly` };
  const M = moduli.reduce((a, m) => a * m, 1);
  let x = 0;
  for (let i = 0; i < moduli.length; i++) {
    const Mi = M / moduli[i];
    const yi = modInverse(Mi, moduli[i]);
    if (yi === null) return { ok: false, note: `no inverse for modulus ${moduli[i]}` };
    x += residues[i] * Mi * yi;
  }
  x = ((x % M) + M) % M;
  return { ok: true, x, modulus: M, residues, moduli };
}

/* ------------------------------------------------------------------ *
 * 2. GF(2) — LFSR, primitive polynomials, CRC taps
 *
 *    ev: "std" for the definitions; the tap lists below are the published
 *    maximal-length sets, and lfsrPeriod() re-derives each one by simulation
 *    so the table cannot quietly disagree with the arithmetic.
 *
 *    Polynomial arithmetic is BigInt-based. That is deliberate: a product of two
 *    degree-32 polynomials has degree 64, which is past Number.MAX_SAFE_INTEGER,
 *    and a wrong answer here is invisible. This is a reference tool, not a hot
 *    path, so clarity beats speed.
 * ------------------------------------------------------------------ */

const B0 = 0n, B1 = 1n, B2 = 2n;

/** Carryless (GF(2)) multiply of two polynomials given as bitmasks. */
export function gf2Mul(a, b) {
  let x = BigInt(a), y = BigInt(b), r = B0;
  while (y) { if (y & B1) r ^= x; x <<= B1; y >>= B1; }
  return r;
}

/** Polynomial degree of a bitmask, or -1 for zero. */
export function gf2Degree(p) { const b = BigInt(p); return b === B0 ? -1 : (b.toString(2).length - 1); }

/** Remainder of a divided by m over GF(2). */
export function gf2Mod(a, m) {
  let r = BigInt(a); const mm = BigInt(m);
  if (mm === B0) throw new Error("gf2Mod: zero modulus");
  const md = gf2Degree(mm);
  while (gf2Degree(r) >= md) r ^= mm << BigInt(gf2Degree(r) - md);
  return r;
}

/** Polynomial GCD over GF(2). */
export function gf2Gcd(a, b) {
  let x = BigInt(a), y = BigInt(b);
  while (y !== B0) { const t = gf2Mod(x, y); x = y; y = t; }
  return x;
}

/** base^exp mod m over GF(2), square-and-multiply. */
export function gf2PowMod(base, exp, m) {
  let b = gf2Mod(base, m), r = B1, e = BigInt(exp);
  while (e > B0) { if (e & B1) r = gf2Mod(gf2Mul(r, b), m); b = gf2Mod(gf2Mul(b, b), m); e >>= B1; }
  return r;
}

/** Convert a bitmask to a readable polynomial string: 0b1011 → "x^3 + x + 1". */
export function gf2ToString(p) {
  const b = BigInt(p);
  if (b === B0) return "0";
  const terms = [];
  let i = 0n, v = b;
  while (v) {
    if (v & B1) terms.push(i === 0n ? "1" : i === 1n ? "x" : `x^${i}`);
    v >>= B1; i += B1;
  }
  return terms.reverse().join(" + ");
}

/** Taps [n, t2, …] as published → the polynomial bitmask with the x^0 term set. */
export function tapsToPoly(taps) {
  let p = B1; // the constant term is implied by every published tap table
  for (const t of taps) p |= B1 << BigInt(t);
  return p;
}

/**
 * Irreducible over GF(2)?
 *
 * The rigorous test, not a heuristic: p of degree n is irreducible iff
 *   (a) x^(2^n) ≡ x  (mod p), and
 *   (b) for every prime divisor q of n, gcd(x^(2^(n/q)) − x, p) = 1.
 * Condition (a) alone is necessary but not sufficient — it also holds for
 * products of distinct irreducibles whose degrees all divide n.
 */
export function isIrreducibleGF2(poly, degree) {
  const p = BigInt(poly), n = BigInt(degree);
  if (gf2Degree(p) !== Number(n)) return { ok: false, irreducible: false, note: `bitmask degree ${gf2Degree(p)} does not match the stated degree ${degree}` };
  if (!(p & B1)) return { ok: true, irreducible: false, note: "no constant term, so x divides it" };
  const x = B2;
  // (a) x^(2^n) == x mod p, computed by n successive squarings.
  let acc = x;
  for (let i = 0n; i < n; i++) acc = gf2Mod(gf2Mul(acc, acc), p);
  if (acc !== x) return { ok: true, irreducible: false, note: `x^(2^${n}) ≠ x mod p, so p is not a product of degree-${n}-dividing irreducibles` };
  // (b) coprime to x^(2^(n/q)) - x for each prime q | n
  for (const q of [...new Set(factorise(Number(n)))]) {
    const e = n / BigInt(q);
    let y = x;
    for (let i = 0n; i < e; i++) y = gf2Mod(gf2Mul(y, y), p);
    const g = gf2Gcd(y ^ x, p);
    if (g !== B1) return { ok: true, irreducible: false, note: `gcd(x^(2^${e}) − x, p) = ${gf2ToString(g)}, so p has an irreducible factor of degree dividing ${e}` };
  }
  return { ok: true, irreducible: true, note: `x^(2^${n}) ≡ x and no subfield polynomial shares a factor with p — p is irreducible of degree ${n}`, poly: gf2ToString(p) };
}

/**
 * Primitive over GF(2)? Irreducible, and x has order exactly 2^n − 1.
 * Test: x^((2^n−1)/q) ≠ 1 for every prime divisor q of 2^n − 1.
 */
export function isPrimitiveGF2(poly, degree) {
  const irr = isIrreducibleGF2(poly, degree);
  if (!irr.ok) return irr;
  if (!irr.irreducible) return { ok: true, primitive: false, irreducible: false, note: irr.note };
  const p = BigInt(poly);
  const order = (B1 << BigInt(degree)) - B1;
  for (const q of [...new Set(factorise(Number(order)))]) {
    const e = order / BigInt(q);
    if (gf2PowMod(B2, e, p) === B1)
      return { ok: true, primitive: false, irreducible: true, note: `x^(${order}/${q}) ≡ 1, so the order of x is ${e}, not ${order}` };
  }
  const mersenne = isPrime(Number(order));
  return {
    ok: true, primitive: true, irreducible: true,
    order: order.toString(), mersenne,
    note: `x has order 2^${degree} − 1 = ${order}${mersenne ? ", which is itself prime (a Mersenne prime), so the sequence has no proper sub-cycles at all" : ""}`,
    poly: gf2ToString(p),
  };
}

/**
 * Maximal-length LFSR check by simulation: Fibonacci form, shifting left, with
 * the feedback bit being the XOR of the tapped positions. Brute force, and the
 * honest one — it cannot lie about the period, and it is what the verify script
 * runs against the published tap table.
 */
export function lfsrPeriod(taps, n, cap = 1 << 22) {
  const mask = n >= 32 ? 0xffffffff : ((1 << n) - 1);
  let tapMask = 0;
  for (const t of taps) tapMask = (tapMask | (1 << (t - 1))) >>> 0;
  let state = 1, steps = 0;
  const expected = mask;
  do {
    const fb = popcount(state & tapMask) & 1;
    state = (((state << 1) | fb) >>> 0) & mask;
    steps++;
    if (steps > cap) return { period: null, note: `exceeded cap ${cap} — not maximal, or the tap set is wrong` };
  } while (state !== 1);
  return {
    period: steps, maximal: steps === expected, expected, n, taps,
    tapMaskHex: hex(tapMask >>> 0),
    polynomial: gf2ToString(tapsToPoly(taps)),
    verdict: steps === expected
      ? `Period ${steps} = 2^${n} − 1. Maximal length; every non-zero state appears exactly once per cycle.`
      : `Period ${steps}, but 2^${n} − 1 = ${expected}. NOT maximal — this tap set does not generate the full sequence.`,
  };
}

/**
 * Verify every published tap set.
 *
 * Two methods, and the row says which one was used, because they have different
 * failure meanings. Up to `simulateUpTo` bits the period is found by actually
 * running the register — that cannot lie, and it is cheap. Above that the cycle
 * is too long to walk (2^32 − 1 steps), so the algebraic test is used instead:
 * a tap set is maximal-length exactly when its polynomial is primitive, which
 * isIrreducibleGF2/isPrimitiveGF2 decide exactly, not approximately.
 *
 * A row with `period === null` is NOT a failure — it means the simulation hit
 * its cap. Those rows are reported separately so a cap-exceeded run is never
 * mistaken for a wrong tap set.
 */
export function verifyTapTable({ simulateUpTo = 22, cap = 1 << 24 } = {}) {
  const rows = MAXIMAL_LFSR_TAPS.map((t) => {
    const poly = tapsToPoly(t.taps);
    if (t.n <= simulateUpTo) {
      const sim = lfsrPeriod(t.taps, t.n, cap);
      return {
        n: t.n, taps: t.taps, polynomial: gf2ToString(poly), method: "simulation",
        period: sim.period === null ? null : String(sim.period),
        maximal: sim.maximal, expected: String(sim.expected),
        capped: sim.period === null,
        note: sim.period === null ? `simulation exceeded its cap of ${cap} steps` : sim.verdict,
      };
    }
    const alg = isPrimitiveGF2(poly, t.n);
    return {
      n: t.n, taps: t.taps, polynomial: gf2ToString(poly), method: "algebraic",
      period: alg.primitive ? (2n ** BigInt(t.n) - 1n).toString() : null,
      maximal: !!alg.primitive, expected: (2n ** BigInt(t.n) - 1n).toString(),
      capped: false,
      note: alg.note,
    };
  });
  return {
    allMaximal: rows.every((r) => r.maximal),
    anyCapped: rows.some((r) => r.capped),
    rows,
    failures: rows.filter((r) => !r.maximal && !r.capped),
  };
}

/** Published maximal-length (primitive) tap sets, Fibonacci form, 1-based bit numbers. */
export const MAXIMAL_LFSR_TAPS = [
  { n: 3, taps: [3, 2], ev: "std" },
  { n: 4, taps: [4, 3], ev: "std" },
  { n: 5, taps: [5, 3], ev: "std" },
  { n: 6, taps: [6, 5], ev: "std" },
  { n: 7, taps: [7, 6], ev: "std" },
  { n: 8, taps: [8, 6, 5, 4], ev: "std" },
  { n: 9, taps: [9, 5], ev: "std" },
  { n: 10, taps: [10, 7], ev: "std" },
  { n: 11, taps: [11, 9], ev: "std" },
  { n: 12, taps: [12, 6, 4, 1], ev: "std" },
  { n: 13, taps: [13, 4, 3, 1], ev: "std" },
  { n: 14, taps: [14, 5, 3, 1], ev: "std" },
  { n: 15, taps: [15, 14], ev: "std" },
  { n: 16, taps: [16, 15, 13, 4], ev: "std" },
  { n: 17, taps: [17, 14], ev: "std" },
  { n: 18, taps: [18, 11], ev: "std" },
  { n: 19, taps: [19, 6, 2, 1], ev: "std" },
  { n: 20, taps: [20, 17], ev: "std" },
  { n: 21, taps: [21, 19], ev: "std" },
  { n: 22, taps: [22, 21], ev: "std" },
  { n: 23, taps: [23, 18], ev: "std" },
  { n: 24, taps: [24, 23, 22, 17], ev: "std" },
  { n: 25, taps: [25, 22], ev: "std" },
  { n: 26, taps: [26, 6, 2, 1], ev: "std" },
  { n: 27, taps: [27, 5, 2, 1], ev: "std" },
  { n: 28, taps: [28, 25], ev: "std" },
  { n: 29, taps: [29, 27], ev: "std" },
  { n: 30, taps: [30, 6, 4, 1], ev: "std" },
  { n: 31, taps: [31, 28], ev: "std" },
  { n: 32, taps: [32, 22, 2, 1], ev: "std" },
];

export const MERSENNE = {
  exponents: [2, 3, 5, 7, 13, 17, 19, 31, 61, 89, 107, 127],
  note: "p for which 2^p - 1 is prime. For an n-bit LFSR the maximal period is 2^n - 1; when that number is itself prime the period has no non-trivial divisors, so a sequence that is not maximal cannot be a short cycle of it — it simply does not repeat. That is why widths 3, 5, 7, 13, 17, 19 and 31 are the comfortable choices for a pseudo-random generator: any observed repetition is the full period.",
  hardwareRelevance: [
    "The 31-bit width in classic scramblers and PRBS generators (PRBS31) is not arbitrary: 2^31 - 1 = 2147483647 is prime, so the sequence is provably one single cycle of maximum length.",
    "PRBS7 (x^7 + x^6 + 1) and PRBS15 are the standard link-integrity patterns for SerDes and for SATA/eSATA compliance testing. PRBS7's period is 127, which is prime.",
    "CRC generator polynomials are chosen irreducible-or-better, but not maximal-length: a CRC wants error-detection structure (divisibility of likely error patterns), not the longest cycle. Confusing the two goals is a common design mistake.",
  ],
  ev: "std",
};

export function isMersenneExponent(p) { return MERSENNE.exponents.includes(p); }

/* ------------------------------------------------------------------ *
 * 3. Stride aliasing — the analysis that actually saves time
 *    ev: "std" for the arithmetic; "report" for the DDR interpretation.
 * ------------------------------------------------------------------ */

/**
 * Given a number of buckets (banks, channels, hash slots) and an access stride,
 * report how the stride maps onto the buckets and how many are actually used.
 */
export function strideAnalysis({ buckets, stride, accesses = 64 }) {
  if (!buckets || buckets < 1) return { ok: false, note: "bucket count must be >= 1" };
  if (!stride) return { ok: false, note: "stride must be non-zero" };
  const g = gcd(buckets, Math.abs(stride));
  const touched = buckets / g;
  const seen = new Set();
  const order = [];
  for (let i = 0; i < accesses; i++) {
    const b = ((i * stride) % buckets + buckets) % buckets;
    if (!seen.has(b)) { seen.add(b); order.push(b); }
  }
  const ratio = touched / buckets;
  return {
    ok: true,
    buckets, stride, accesses,
    gcd: g,
    bucketsTouched: touched,
    utilisation: ratio,
    visitOrder: order.slice(0, Math.min(order.length, 32)),
    coprime: g === 1,
    bucketsIsPrime: isPrime(buckets),
    strideIsPrime: isPrime(Math.abs(stride)),
    verdict: ratio === 1
      ? `Stride ${stride} is coprime with ${buckets} buckets: all ${buckets} are visited before any repeats. ${isPrime(buckets) ? `A prime bucket count makes this true for every stride that is not a multiple of ${buckets}, which is the strongest guarantee available.` : ""} This is the ideal case — no bank is hot.`
      : ratio <= 1 / 4
        ? `SEVERE aliasing: stride ${stride} against ${buckets} buckets has gcd ${g}, so only ${touched} of ${buckets} buckets are ever used and the remaining ${buckets - touched} sit idle while ${touched} take all the traffic. This is the classic power-of-two stride against a power-of-two bank count. Fix it by changing the stride, or by XOR-folding higher address bits into the bank index rather than taking a contiguous slice.`
        : `Partial aliasing: gcd ${g} means ${touched} of ${buckets} buckets are used. Utilisation ${(ratio * 100).toFixed(0)}%.`,
    ev: "std",
  };
}

/**
 * XOR-fold bank hashing — what a real memory controller does to break the
 * aliasing above. Instead of bank = addr[5:2], compute bank = addr[5:2] XOR
 * addr[13:10], which decorrelates the index from any single power-of-two stride.
 */
export function xorFoldBank(addr, { widthBits = 2, lowShift = 2, highShift = 10 }) {
  const mask = (1 << widthBits) - 1;
  const low = (addr >>> lowShift) & mask;
  const high = (addr >>> highShift) & mask;
  return { bank: (low ^ high) & mask, low, high };
}

/**
 * Synchronisation period for N periodic tasks: the LCM of their periods is when
 * they all collide at once, and the pairwise gcd tells you which pairs are the
 * problem. Coprime periods are the design goal.
 */
export function collisionAnalysis(periods) {
  const ps = periods.map(Math.abs).filter((p) => p > 0);
  if (ps.length < 2) return { ok: false, note: "need at least two periods" };
  const all = ps.reduce((a, p) => lcm(a, p), 1);
  const pairs = [];
  for (let i = 0; i < ps.length; i++)
    for (let j = i + 1; j < ps.length; j++)
      pairs.push({ a: ps[i], b: ps[j], gcd: gcd(ps[i], ps[j]), lcm: lcm(ps[i], ps[j]), coprime: gcd(ps[i], ps[j]) === 1 });
  const worst = pairs.slice().sort((x, y) => x.lcm - y.lcm)[0];
  return {
    ok: true,
    periods: ps,
    allSynchroniseAt: all,
    pairs,
    allCoprime: pairs.every((p) => p.coprime),
    worstPair: worst,
    verdict: pairs.every((p) => p.coprime)
      ? `All ${ps.length} periods are pairwise coprime. They coincide only every ${all} ticks, which is the longest possible interval for these values — collisions are spread as thinly as they can be.`
      : `Worst pair: ${worst.a} and ${worst.b} coincide every ${worst.lcm} ticks (gcd ${worst.gcd}). The whole set synchronises every ${all}. If these are bus polling intervals, the pair ${worst.a}/${worst.b} is where contention will show up first — shift one of them by a tick or pick a coprime period.`,
  };
}

/**
 * Hunting-tooth / wear-levelling check. Two meshing counts distribute wear
 * evenly across every tooth only when they are coprime. The same arithmetic
 * governs which flash blocks a rotating write pattern touches.
 */
export function huntingTooth(a, b) {
  const g = gcd(a, b);
  return {
    a, b, gcd: g,
    hunting: g === 1,
    contactPeriod: lcm(a, b),
    distinctContacts: g === 1 ? Math.max(a, b) : Math.max(a, b) / g,
    verdict: g === 1
      ? `${a} and ${b} are coprime: every element of the ${Math.max(a, b)} side meets every element of the ${Math.min(a, b)} side before any pair repeats. Wear is distributed evenly — this is a hunting-tooth pairing.`
      : `${a} and ${b} share the factor ${g}. Only ${Math.max(a, b) / g} distinct contacts ever occur, so wear concentrates on those. Add or remove ${g === 1 ? "" : "one tooth / one block "}to make the counts coprime.`,
  };
}

/* ------------------------------------------------------------------ *
 * 4. Capacity arithmetic — the non-power-of-two trap
 * ------------------------------------------------------------------ */

export function analyseCapacity(bytes) {
  if (!Number.isInteger(bytes) || bytes < 1) return { ok: false, note: "capacity must be a positive integer byte count" };
  const f = factorSummary(bytes);
  const bits = bytes * 8;
  const fb = factorSummary(bits);
  const pow2 = f.isPowerOfTwo;
  const wrapMask = pow2 ? bytes - 1 : null;
  const nearestPow2 = 2 ** Math.ceil(Math.log2(bytes));
  const addressBits = Math.ceil(Math.log2(bytes));
  return {
    ok: true,
    bytes, bits,
    factorBytes: f.expression,
    factorBits: fb.expression,
    isPowerOfTwo: pow2,
    mib: bytes / 1048576,
    mb: bytes / 1e6,
    addressBits,
    wrapMask,
    verdict: pow2
      ? `${bytes} bytes = 2^${f.log2IfPowerOfTwo}. Address space wraps cleanly at the capacity, the mask is 0x${wrapMask.toString(16).toUpperCase()}, and a parser can use address & mask without bounds checks.`
      : `${bytes} bytes is NOT a power of two — it factors as ${f.expression} (${fb.expression} bits). This is the shape of a 24 Mbit / 3 MiB SPI flash, a 12 Mbit part, or a disk with a sector count that is not a power of two. Consequences that break naive tools:\n  • There is no wrap mask. Address & (2^${addressBits} - 1) will produce addresses past the end of the device.\n  • ${nearestPow2 - bytes} bytes of the ${addressBits}-bit address space do not exist.\n  • A partial dump is indistinguishable from a complete one by length alone unless you know the real capacity.\n  • Read the capacity from the device itself (RDID byte 2 on SPI NOR gives 2^n in bits for the power-of-two parts, and vendors publish a separate code for the non-power-of-two ones) rather than inferring it from the file size.`,
  };
}

/**
 * Sector / page geometry from a capacity and an erase block size — the numbers
 * a flash programmer needs, and the place where a 3 MiB part silently differs
 * from a 4 MiB one.
 */
export function flashGeometry({ capacityBytes, pageSize = 256, blockSize = 65536, sectorsPerBlock = null }) {
  const pages = capacityBytes / pageSize;
  const blocks = capacityBytes / blockSize;
  const ok = Number.isInteger(pages) && Number.isInteger(blocks);
  return {
    capacityBytes, pageSize, blockSize,
    pages, blocks,
    pageAddressBits: Math.log2(pageSize),
    blockAddressBits: Math.log2(blockSize),
    addressBits: Math.ceil(Math.log2(capacityBytes)),
    clean: ok,
    verdict: ok
      ? `${capacityBytes} bytes = ${blocks} blocks of ${blockSize} B = ${pages} pages of ${pageSize} B. Address splits cleanly: ${Math.log2(blockSize)} bits select the block, ${Math.log2(pageSize)} bits the byte within a page.`
      : `Geometry does not divide evenly: ${pages} pages, ${blocks} blocks. Either the block size is wrong for this part or the capacity is not a power of two. Do not program against this geometry — read the real one from the device.`,
  };
}

/* ------------------------------------------------------------------ *
 * 5. Verification against the printed table
 * ------------------------------------------------------------------ */

export const GUTENBERG_65 = {
  title: "The First 100,000 Prime Numbers",
  ebook: 65,
  url: "https://www.gutenberg.org/files/65/65.txt",
  claims: [
    { k: 1, p: 2 }, { k: 10, p: 29 }, { k: 100, p: 541 }, { k: 1000, p: 7919 },
    { k: 10000, p: 104729 }, { k: 100000, p: 1299709 },
  ],
  note: "The 100,000th prime is 1,299,709. Reproducing that from the sieve is the cheapest possible proof that the factorisation layer in this app is not lying, and it is the check the verify script runs.",
  ev: "std",
};

export function verifyAgainstGutenberg65() {
  const results = [];
  for (const { k, p } of GUTENBERG_65.claims) {
    const got = nthPrime(k);
    results.push({ k, expected: p, got, ok: got === p });
  }
  return { allOk: results.every((r) => r.ok), results };
}

/** Prime gap table for the first N primes — the spacing that makes hash choices. */
export function primeGaps(limit = 50) {
  const ps = primesUpTo(limit * 20);
  const gaps = [];
  for (let i = 1; i < Math.min(ps.length, limit + 1); i++) gaps.push({ p: ps[i], gap: ps[i] - ps[i - 1] });
  const maxGap = gaps.reduce((a, g) => (g.gap > a.gap ? g : a), { gap: 0 });
  return { count: gaps.length, maxGap, gaps: gaps.slice(0, 40) };
}

/**
 * Pick bucket counts for a hash: primes near the requested size. A prime bucket
 * count is coprime with every power-of-two stride, which is the property that
 * kills aliasing without any folding logic.
 */
export function primeBucketCandidates(target, span = 24) {
  const lo = Math.max(2, target - span), hi = target + span;
  return primesUpTo(hi).filter((p) => p >= lo).map((p) => ({
    buckets: p,
    delta: p - target,
    note: `coprime with every power-of-two stride`,
  }));
}

export { hex, popcount };
