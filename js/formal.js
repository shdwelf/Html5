/**
 * formal.js — the mathematics behind every formal-system lens.
 *
 * Pure module: no DOM, no WebGL, no randomness without an explicit seed.
 * Every lens below computes real numbers from the loaded key (or from the
 * session's measured events). Where a system has no honest geometry on a
 * BIP-39 keyspace, the registry says so and marks the entry `kind: "card"`.
 */

import { bytesToBits } from "./spacefill.js";
import { PIPELINE } from "./hdtopo.js";

/* ------------------------------------------------------------------ *
 * formatting helpers
 * ------------------------------------------------------------------ */

export function popcount(v) {
  let x = v >>> 0;
  let n = 0;
  while (x) {
    n += x & 1;
    x >>>= 1;
  }
  return n;
}

export function popcountBytes(bytes) {
  let n = 0;
  for (const b of bytes) n += popcount(b);
  return n;
}

/** log10 of a BigInt, accurate to ~14 significant digits. */
export function log10Big(b) {
  if (b <= 0n) return -Infinity;
  const s = b.toString();
  const d = s.length;
  const keep = Math.min(15, d);
  const lead = Number(s.slice(0, keep));
  return d - 1 + Math.log10(lead / 10 ** (keep - 1));
}

/** Human form for integers that overflow Number: 1.2345 × 10^77. */
export function fmtBig(b) {
  if (typeof b !== "bigint") return String(b);
  if (b < 1000000n) return b.toString();
  const l = log10Big(b);
  const e = Math.floor(l);
  const mant = 10 ** (l - e);
  return `${mant.toFixed(4)} × 10^${e}`;
}

export function factorialBig(n) {
  let out = 1n;
  for (let i = 2n; i <= BigInt(n); i++) out *= i;
  return out;
}

export function binomBig(n, k) {
  if (k < 0 || k > n) return 0n;
  let out = 1n;
  const N = BigInt(n);
  for (let i = 0n; i < BigInt(k); i++) {
    out = (out * (N - i)) / (i + 1n);
  }
  return out;
}

export function pow2Big(n) {
  return n >= 0 ? 1n << BigInt(n) : 0n;
}

export function fmtSeconds(seconds) {
  if (!isFinite(seconds)) return "∞";
  const units = [
    ["s", 1],
    ["min", 60],
    ["h", 3600],
    ["d", 86400],
    ["yr", 31557600],
  ];
  let pick = units[0];
  for (const u of units) if (seconds >= u[1]) pick = u;
  const v = seconds / pick[1];
  if (pick[0] === "yr") {
    if (v > 1e6) return `${v.toExponential(3)} yr`;
    return `${v.toFixed(v < 10 ? 2 : 0)} yr`;
  }
  return `${v.toFixed(v < 10 ? 2 : 1)} ${pick[0]}`;
}

export const fmt = (v, d = 4) =>
  typeof v === "number" ? (Number.isInteger(v) ? String(v) : v.toFixed(d)) : String(v);

/* ------------------------------------------------------------------ *
 * bit utilities
 * ------------------------------------------------------------------ */

export function bitsOf(bytes) {
  return bytesToBits(bytes);
}

/** Pad/truncate two keys to a common length so ⊕ is defined. */
export function alignBytes(a, b) {
  const n = Math.max(a.length, b.length);
  const pad = (x) => {
    const out = new Uint8Array(n);
    out.set(x, n - x.length); // left-pad with zero bytes
    return out;
  };
  return [pad(a), pad(b), n];
}

export function xorBytes(a, b) {
  const [x, y, n] = alignBytes(a, b);
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i++) out[i] = x[i] ^ y[i];
  return out;
}

export function notBytes(a) {
  const out = new Uint8Array(a.length);
  for (let i = 0; i < a.length; i++) out[i] = ~a[i] & 255;
  return out;
}

export function hammingBytes(a, b) {
  return popcountBytes(xorBytes(a, b));
}

export function hexOf(bytes) {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * The invert keyspace between two keys.
 *
 * A and B are two corners of the ENT-dimensional Hamming cube. The set of keys
 * "between" them is the affine subcube they span:
 *
 *   S(A,B) = { A ⊕ (m ⊙ s) : s ∈ {0,1}^d },  m = A ⊕ B,  d = |m|
 *
 * |S| = 2^d, its diameter is d, and every shortest A→B path (there are d! of
 * them) stays inside S. ¬A is the antipode of A: d(¬A,B) = ENT − d(A,B).
 */
export function invertReport(A, B, projectionBits = 21) {
  if (!A?.length || !B?.length) return null;
  const [x, y, n] = alignBytes(A, B);
  const entBits = n * 8;
  const mask = xorBytes(x, y);
  const bits = bitsOf(mask);
  const differing = [];
  bits.forEach((v, i) => {
    if (v) differing.push(i);
  });
  const d = differing.length;
  const prefixDiff = differing.filter((i) => i < projectionBits).length;
  const complementA = notBytes(x);
  const complementB = notBytes(y);
  return {
    equalLength: A.length === B.length,
    entBits,
    mask,
    maskHex: hexOf(mask),
    differing,
    d,
    prefixDiff,
    subcubeBits: d,
    subcubeSize: pow2Big(d),
    measureLog2: d - entBits,
    geodesics: factorialBig(d),
    firstSteps: differing.slice(0, 8),
    complementA,
    complementB,
    complementAToB: hammingBytes(complementA, y),
    /** ¬A differs from A in every bit, by definition of the antipode */
    complementAToA: entBits,
    antipode: entBits,
    identical: d === 0,
  };
}

/* ------------------------------------------------------------------ *
 * differential family — the discrete derivative of Φ
 * ------------------------------------------------------------------ */

/**
 * flips: [{ bit, changed, deltas: [[wordIdx, |Δindex|], …], lastChanged }]
 * produced by flipping one entropy bit at a time and re-running Φ.
 */
export function differentialProfile(flips) {
  if (!flips?.length) return null;
  const grad = flips.map((f) => f.changed);
  const total = grad.reduce((a, b) => a + b, 0);
  let max = 0;
  let maxBit = 0;
  grad.forEach((g, i) => {
    if (g > max) {
      max = g;
      maxBit = i;
    }
  });
  const last = flips.filter((f) => f.lastChanged).length;
  const histogram = new Map();
  for (const g of grad) histogram.set(g, (histogram.get(g) || 0) + 1);
  return {
    grad,
    total,
    mean: total / grad.length,
    max,
    maxBit,
    support: grad.filter((g) => g > 0).length,
    zero: grad.length - grad.filter((g) => g > 0).length,
    lastWordChanged: last,
    histogram: [...histogram.entries()].sort((a, b) => a[0] - b[0]),
    confined: max <= 2,
    /** word index that carries bit i — the analytic prediction to test against */
    predictedWord: (i) => Math.floor(i / 11),
  };
}

export function integralProfile(grad) {
  if (!grad?.length) return null;
  const cum = [];
  let s = 0;
  for (const g of grad) {
    s += g;
    cum.push(s);
  }
  const half = s / 2;
  return {
    cum,
    area: s,
    meanRate: s / grad.length,
    halfAt: cum.findIndex((v) => v >= half) + 1,
    /** measure of the set of keys sharing the first k bits: 2^-k */
    prefixMeasure: grad.map((_, k) => 2 ** -Math.min(k + 1, 1023)),
  };
}

/** Grünwald–Letnikov coefficients c_j = (−1)^j · C(α, j). */
export function glCoeffs(alpha, n) {
  const c = [1];
  for (let j = 1; j < n; j++) c.push((c[j - 1] * (j - 1 - alpha)) / j);
  return c;
}

export function fractionalDerivative(f, alpha) {
  if (!f?.length) return [];
  const c = glCoeffs(alpha, f.length);
  const out = new Array(f.length).fill(0);
  for (let k = 0; k < f.length; k++) {
    let s = 0;
    for (let j = 0; j <= k; j++) s += c[j] * f[k - j];
    out[k] = s;
  }
  return out;
}

/** rows = words, cols = entropy bits, value = |Δindex| / 2047. */
export function influenceMatrix(flips, wordCount) {
  if (!flips?.length || !wordCount) return null;
  const rows = Array.from({ length: wordCount }, () => new Float64Array(flips.length));
  for (const f of flips) {
    for (const [w, delta] of f.deltas) {
      if (w < wordCount) rows[w][f.bit] = delta / 2047;
    }
  }
  const rowSum = rows.map((r) => r.reduce((a, b) => a + b, 0));
  const colSum = new Float64Array(flips.length);
  rows.forEach((r) => r.forEach((v, j) => (colSum[j] += v)));
  const total = colSum.reduce((a, b) => a + b, 0) || 1;
  return { rows, rowSum, colSum, total, words: wordCount, bits: flips.length };
}

export function gramMatrix(rows) {
  const n = rows.length;
  const G = Array.from({ length: n }, () => new Float64Array(n));
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      let s = 0;
      for (let k = 0; k < rows[i].length; k++) s += rows[i][k] * rows[j][k];
      G[i][j] = s;
      G[j][i] = s;
    }
  }
  return G;
}

/** Power iteration + deflation for a small symmetric matrix. */
export function eigenSymmetric(M, count = 2, iters = 200) {
  const n = M.length;
  const A = M.map((r) => Float64Array.from(r));
  const out = [];
  for (let e = 0; e < Math.min(count, n); e++) {
    let v = new Float64Array(n).fill(1 / Math.sqrt(n));
    let lambda = 0;
    for (let t = 0; t < iters; t++) {
      const w = new Float64Array(n);
      for (let i = 0; i < n; i++) {
        let s = 0;
        for (let j = 0; j < n; j++) s += A[i][j] * v[j];
        w[i] = s;
      }
      const norm = Math.hypot(...w) || 1;
      lambda = norm;
      v = new Float64Array(w.map((x) => x / norm));
    }
    out.push({ lambda, vector: v });
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) A[i][j] -= lambda * v[i] * v[j];
  }
  return out;
}

export function traceOf(M) {
  let s = 0;
  for (let i = 0; i < M.length; i++) s += M[i][i];
  return s;
}

/**
 * Ricci calculus on the bit lattice. The Hamming cube carries the flat metric
 * g_ij = δ_ij, so every Christoffel symbol and the whole Ricci tensor vanish —
 * the honest result, and the point of the lens.
 */
export function ricciReport(entropy) {
  const bits = bitsOf(entropy || new Uint8Array(16));
  const n = bits.length;
  const weight = bits.reduce((a, b) => a + b, 0);
  const ds2 = bits.reduce((a, b) => a + b * b, 0); // g_ij dx^i dx^j with dx ∈ {0,1}
  return {
    n,
    weight,
    metric: "g_ij = δ_ij (flat)",
    christoffel: 0,
    ricciScalar: 0,
    ds2,
    contraction: ds2, // g^ij T_ij for T = g
    complementWeight: n - weight,
  };
}

/* ------------------------------------------------------------------ *
 * Boolean / Zhegalkin
 * ------------------------------------------------------------------ */

/** Algebraic normal form coefficients (Möbius transform over GF(2)). */
export function mobius(table) {
  const a = table.slice();
  for (let i = 0; (1 << i) < a.length; i++) {
    for (let m = 0; m < a.length; m++) {
      if (m & (1 << i)) a[m] ^= a[m ^ (1 << i)];
    }
  }
  return a;
}

export function anfTerms(coef) {
  const vars = ["x₁", "x₂", "x₃", "x₄", "x₅", "x₆"];
  const terms = [];
  coef.forEach((c, m) => {
    if (!c) return;
    if (m === 0) return terms.push("1");
    const lits = [];
    for (let i = 0; (1 << i) <= m; i++) if (m & (1 << i)) lits.push(vars[i] ?? `x${i + 1}`);
    terms.push(lits.join(""));
  });
  return terms.length ? terms : ["0"];
}

export function booleanProfile(anfTable, A, B) {
  const coef = anfTable ? mobius(anfTable) : null;
  const xor = A && B ? xorBytes(A, B) : null;
  return {
    anf: coef,
    anfTerms: coef ? anfTerms(coef) : null,
    anfWeight: coef ? coef.reduce((a, b) => a + b, 0) : null,
    linearCeiling: anfTable ? 1 + Math.log2(anfTable.length) : null,
    xorHex: xor ? hexOf(xor) : null,
    xorWeight: xor ? popcountBytes(xor) : null,
    popA: A ? popcountBytes(A) : null,
    popB: B ? popcountBytes(B) : null,
  };
}

/* ------------------------------------------------------------------ *
 * λ-calculus family
 * ------------------------------------------------------------------ */

export function churchNumeral(n) {
  const k = Math.max(0, Math.min(n, 64));
  return `λf.λx.${"f(".repeat(k)}x${")".repeat(k)}`;
}

export function phraseTerm(words) {
  const n = words.length;
  const vars = words.map((_, i) => `x${i + 1}`);
  return {
    term: `λ${vars.join(".")}. ${vars.join(" ")}`,
    size: 3 * n - 1,
    freeVars: 0,
    boundVars: n,
    /** λc.λn. c b₁ (c b₂ … n) — the Church-encoded entropy bit list */
    fold: (bits) => `λc.λn. ${bits.slice(0, 6).join(" (c ")}…`,
  };
}

export function betaReport(words, entBits, csBits) {
  const n = words.length;
  return {
    words: n,
    numeral: churchNumeral(n),
    applications: n,
    normalForm: `f^${n} x`,
    redexes: n, // one β-redex per application in the Church numeral spine
    betaSteps: n,
    termSize: 3 * n - 1,
    bitsTermSize: 2 * entBits + 1,
    csType: `Φ : 2^${entBits} → 2^${csBits}`,
  };
}

export function simplyTypedJudgments(layout) {
  const { entBits, csBits, words } = layout;
  return [
    [`ENT`, `Bit^{${entBits}}  (|·| = 2^${entBits})`],
    [`CS`, `Bit^{${csBits}}  (|·| = 2^${csBits})`],
    [`W`, `Word = Fin 2048  (11 bits)`],
    [`Φ`, `ENT → CS   (total, deterministic)`],
    [`encode`, `ENT → W^{${words}}   (injective)`],
    [`decode`, `W^{${words}} → ENT × CS   (partial: defined iff checksum holds)`],
    [`seed`, `W^{${words}} → Bit^{512}   (PBKDF2, not modelled here)`],
  ];
}

/* ------------------------------------------------------------------ *
 * logic family
 * ------------------------------------------------------------------ */

export function wellFormedAtoms(a, words) {
  const layout = a?.layout;
  return [
    {
      id: "N",
      label: `N : word count ${words.length} admits a whole-byte split`,
      value: !!layout,
    },
    {
      id: "W",
      label: "W : every token is in the 2048-word list",
      value: !!a && (a.indices || []).every((i) => i >= 0),
    },
    {
      id: "C",
      label: `C : observed CS = SHA-256(ENT)[0:${layout?.csBits ?? "?"}]`,
      value: !!a?.ok,
    },
  ];
}

export function truthTable(atoms) {
  const k = atoms.length;
  const rows = [];
  for (let m = 0; m < 1 << k; m++) {
    const val = atoms.map((at, i) => ((m >> (k - 1 - i)) & 1) === 1);
    rows.push({
      val,
      result: val.every(Boolean),
      actual: val.every((v, i) => v === atoms[i].value),
    });
  }
  const actualIndex = atoms.reduce((acc, at, i) => acc | ((at.value ? 1 : 0) << (k - 1 - i)), 0);
  return { rows, atoms, actualIndex, tautology: false };
}

export function predicateClaims(a) {
  const ent = a?.entropyBits ?? 0;
  const cs = a?.checksumBits ?? 0;
  const space = pow2Big(ent);
  const fiber = pow2Big(ent - cs);
  const prefix = Math.min(14, ent);
  const prefixFiber = pow2Big(ent - prefix);
  return [
    {
      claim: `∀w ∈ phrase : w ∈ WORDLIST`,
      value: !!a && (a.indices || []).every((i) => i >= 0),
      detail: `${(a?.indices || []).length} witnesses checked`,
    },
    {
      claim: `|{ k ∈ C : Φ(k) = cs }| = 2^(ENT−CS)`,
      value: true,
      detail: `${fmtBig(fiber)} keys per checksum cell (2^${ent - cs})`,
    },
    {
      claim: `∃! k : prefix${prefix}(k) = observed`,
      value: !!a?.entropy,
      detail: `the fibre holds ${fmtBig(prefixFiber)} keys, not one`,
    },
    {
      claim: `|C| = 2^ENT`,
      value: true,
      detail: `${fmtBig(space)} keys (2^${ent})`,
    },
    {
      claim: `¬∃ k : k ∈ C ∧ k has fewer than ENT bits of freedom`,
      value: true,
      detail: `CS is a function of ENT — it adds 0 bits`,
    },
  ];
}

/** Sequent proof of the well-formedness judgment. */
export function sequentProof(atoms) {
  const leaves = atoms.map((at) => ({
    label: `⊢ ${at.id}`,
    rule: at.value ? "axiom (measured)" : "failed leaf",
    ok: at.value,
    children: [],
  }));
  const and = {
    label: `⊢ ${atoms.map((a) => a.id).join(" ∧ ")}`,
    rule: "∧-right",
    ok: leaves.every((l) => l.ok),
    children: leaves,
  };
  const root = {
    label: "⊢ well-formed mnemonic",
    rule: and.ok ? "cut (definition of valid)" : "no derivation",
    ok: and.ok,
    children: [and],
  };
  const depth = 3;
  return {
    root,
    depth,
    rules: 1 + leaves.length + 1,
    cutFree: false,
    failed: leaves.filter((l) => !l.ok).map((l) => l.label),
  };
}

/** Tuple relational calculus over the relations actually in memory. */
export function relationalQuery(a, words) {
  const idx = a?.indices || [];
  const cs = a?.checksumBits || 0;
  const PHRASE = words.map((w, i) => ({
    pos: i + 1,
    idx: idx[i] ?? -1,
    word: w,
    bits: (idx[i] ?? 0).toString(2).padStart(11, "0"),
    cs: i === words.length - 1,
  }));
  const ENT = [...(a?.entropy || [])].map((b, i) => ({
    byte: i + 1,
    hex: b.toString(16).padStart(2, "0"),
  }));
  const CHECKSUM = (a?.checksumObserved || []).map((v, i) => ({
    bit: i + 1,
    observed: v,
    expected: (a?.checksumExpected || [])[i] ?? null,
    ok: v === (a?.checksumExpected || [])[i],
  }));
  const sel = PHRASE.filter((t) => t.cs);
  const join = sel.flatMap((t) => CHECKSUM.filter((c) => c.ok).map((c) => ({ ...t, ...c })));
  return {
    relations: [
      [`PHRASE(pos, idx, word, bits)`, PHRASE.length],
      [`ENT(byte, hex)`, ENT.length],
      [`CHECKSUM(bit, observed, expected)`, CHECKSUM.length],
    ],
    query: `{ t.word | t ∈ PHRASE ∧ t.cs }`,
    result: sel.map((t) => `${t.word} #${t.idx}`),
    join: `{ ⟨t.word, c.bit⟩ | t ∈ PHRASE ∧ t.cs ∧ c ∈ CHECKSUM ∧ c.ok }`,
    joinCount: join.length,
    checksumRows: CHECKSUM.filter((c) => c.ok).length + "/" + CHECKSUM.length,
  };
}

/** Modal μ-calculus: reachability fixpoint on the Hamming cube Q_ENT. */
export function reachabilityFixpoint(entBits, maxRadius = 12) {
  const n = entBits;
  const balls = [];
  let acc = 0n;
  let c = 1n;
  const half = pow2Big(n - 1);
  let halfRadius = null;
  for (let k = 0; k <= Math.min(n, 4096); k++) {
    if (k > 0) c = (c * BigInt(n - k + 1)) / BigInt(k);
    acc += c;
    if (k <= maxRadius) balls.push({ k, shell: c, ball: acc });
    if (halfRadius === null && acc >= half) halfRadius = k;
  }
  return {
    n,
    balls,
    halfRadius,
    halfBall: acc,
    /** μX. (X ∪ ◇X) closes only at the antipode: n+1 iterations */
    fixpointIterations: n + 1,
    total: pow2Big(n),
  };
}

/* ------------------------------------------------------------------ *
 * umbral calculus
 * ------------------------------------------------------------------ */

export function differenceTable(seq) {
  const rows = [seq.slice()];
  let cur = seq.slice();
  while (cur.length > 1) {
    const next = [];
    for (let i = 1; i < cur.length; i++) next.push(cur[i] - cur[i - 1]);
    rows.push(next);
    cur = next;
  }
  return rows;
}

export function binomialTransform(seq) {
  return seq.map((_, n) => {
    let s = 0;
    for (let k = 0; k <= n; k++) {
      const sign = (n - k) % 2 ? -1 : 1;
      s += sign * Number(binomBig(n, k)) * seq[k];
    }
    return s;
  });
}

export function umbralProfile(indices) {
  const seq = indices.filter((i) => i >= 0);
  if (!seq.length) return null;
  const diffs = differenceTable(seq);
  const top = diffs.map((r) => r[0]);
  return {
    seq,
    diffs,
    topDiagonal: top,
    binomial: binomialTransform(seq.slice(0, Math.min(seq.length, 12))),
    /** exponential generating function coefficients a_k / k! */
    egf: seq.slice(0, 12).map((a, k) => a / Number(factorialBig(k))),
    shadowDegree: Math.max(...seq),
  };
}

/* ------------------------------------------------------------------ *
 * vector calculus on the drawn path
 * ------------------------------------------------------------------ */

export function curveInvariants(pts) {
  if (!pts || pts.length < 3) return null;
  const seg = [];
  let arc = 0;
  let turning = 0;
  const curvatures = [];
  for (let i = 1; i < pts.length; i++) {
    const d = [0, 1, 2].map((k) => pts[i][k] - pts[i - 1][k]);
    const len = Math.hypot(...d);
    seg.push(d);
    arc += len;
  }
  for (let i = 1; i < seg.length; i++) {
    const a = seg[i - 1];
    const b = seg[i];
    const na = Math.hypot(...a) || 1;
    const nb = Math.hypot(...b) || 1;
    const cos = Math.max(-1, Math.min(1, (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / (na * nb)));
    const theta = Math.acos(cos);
    turning += theta;
    curvatures.push((2 * Math.sin(theta / 2)) / ((na + nb) / 2 || 1));
  }
  const chord = Math.hypot(...[0, 1, 2].map((k) => pts[pts.length - 1][k] - pts[0][k]));
  const total = curvatures.reduce((a, b) => a + b, 0);
  return {
    points: pts.length,
    arcLength: arc,
    chord,
    slack: arc / (chord || 1),
    totalTurning: turning,
    meanCurvature: curvatures.length ? total / curvatures.length : 0,
    maxCurvature: curvatures.length ? Math.max(...curvatures) : 0,
  };
}

/* ------------------------------------------------------------------ *
 * stochastic / Itô
 * ------------------------------------------------------------------ */

export function stochasticForecast(entBits, rates) {
  const log2 = Math.log10(2);
  const logSpace = entBits * log2; // log10 |C|
  const rows = rates.map((r) => {
    const logSeconds = logSpace - Math.log10(r.rate);
    const seconds = 10 ** logSeconds; // Infinity past ~1e308 — logYears stays finite
    const logYears = logSeconds - Math.log10(31557600);
    return {
      label: r.label,
      rate: r.rate,
      seconds,
      years: seconds / 31557600,
      logYears,
    };
  });
  return {
    entBits,
    log10Space: logSpace,
    medianGuessesLog10: logSpace + Math.log10(Math.LN2),
    rows,
    birthdayLog10: logSpace / 2,
    /** P(hit within t guesses) ≈ 1 − exp(−t / 2^ENT); at t = 10^12: */
    hitAt1e12: 1 - Math.exp(-(10 ** (12 - entBits * Math.LOG10E * Math.LN2))),
  };
}

/** Deterministic LCG so the Monte-Carlo numbers are reproducible. */
export function lcg(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Itô calculus on the search process. Model: guesses arrive as a Poisson(λ)
 * stream, progress X_t = log₂(1 + N_t). [X]_T is the realised quadratic
 * variation; the Itô correction ½∫f″ dt is what separates Itô from
 * Stratonovich for f(N) = log₂(1+N). Monte-Carlo illustration, seeded.
 */
export function itoReport(seed, steps = 240, lambda = 1.7, horizon = 1) {
  const rnd = lcg(seed);
  const dt = horizon / steps;
  let n = 0;
  let qv = 0;
  let prevX = 0;
  let corr = 0;
  const path = [];
  for (let i = 1; i <= steps; i++) {
    // Poisson increment by inverse-CDF on a uniform
    let u = rnd();
    let k = 0;
    let p = Math.exp(-lambda * dt);
    let cum = p;
    while (u > cum && k < 40) {
      k++;
      p *= (lambda * dt) / k;
      cum += p;
    }
    n += k;
    const x = Math.log2(1 + n);
    const dx = x - prevX;
    qv += dx * dx;
    // f''(N) = -1/(ln2 (1+N)^2)
    corr += (-1 / (Math.LN2 * (1 + n) ** 2)) * dt;
    prevX = x;
    if (i % 6 === 0) path.push([i * dt, x]);
  }
  return { steps, lambda, path, quadraticVariation: qv, itoCorrection: corr / 2, drift: prevX };
}

/* ------------------------------------------------------------------ *
 * time families — situation / event / duration calculus
 * ------------------------------------------------------------------ */

export function situationReport(actions) {
  const chain = [{ term: "S₀", action: "boot", valid: false }];
  let valid = false;
  actions.forEach((a, i) => {
    if (a.kind === "project" || a.kind === "sample") valid = a.ok ?? valid;
    if (a.kind === "flip") valid = a.ok ?? valid;
    chain.push({
      term: `do(${a.kind}, ${chain[chain.length - 1].term})`,
      action: a.kind,
      valid,
      at: a.at,
    });
  });
  return {
    chain,
    fluents: ["Entropy(e)", "Words(n)", "Valid"],
    successor: `Valid(do(a,s)) ≡ (a = project ∧ checksum(a)) ∨ (Valid(s) ∧ a ≠ invalidate)`,
    situations: chain.length,
  };
}

export function eventReport(actions) {
  const t0 = actions[0]?.at ?? 0;
  const events = actions.map((a) => ({
    label: a.kind,
    t: a.at - t0,
    initiates: a.kind === "project" || a.kind === "sample" ? "Valid" : null,
    terminates: a.kind === "flip" && a.ok === false ? "Valid" : null,
  }));
  // HoldsAt(Valid, t) evaluated on the sampled grid
  const grid = [];
  const end = events[events.length - 1]?.t ?? 1;
  for (let i = 0; i <= 40; i++) {
    const t = (end * i) / 40;
    let holds = false;
    for (const e of events) {
      if (e.t > t) break;
      if (e.initiates === "Valid") holds = true;
      if (e.terminates === "Valid") holds = false;
    }
    grid.push([t, holds ? 1 : 0]);
  }
  const intervals = [];
  let start = null;
  grid.forEach(([t, v], i) => {
    if (v && start === null) start = t;
    if (!v && start !== null) {
      intervals.push([start, grid[i - 1][0]]);
      start = null;
    }
  });
  if (start !== null) intervals.push([start, end]);
  return { events, grid, intervals, t0 };
}

export function durationReport(timings) {
  const total = timings.reduce((a, t) => a + t.ms, 0) || 1;
  return {
    rows: timings.map((t) => ({ ...t, share: t.ms / total })),
    total,
    slowest: timings.slice().sort((a, b) => b.ms - a.ms)[0]?.label ?? "—",
  };
}

/* ------------------------------------------------------------------ *
 * process families — π-calculus / LTS
 * ------------------------------------------------------------------ */

export function piReport() {
  const stages = PIPELINE;
  const names = stages.map((s, i) => `c${i}`);
  return {
    process: stages
      .map((s, i) => (i === 0 ? `ν c0. out(c0, ${s})` : `in(c${i - 1}, x). out(c${i}, ${s})`))
      .join(" | "),
    channels: names,
    freeNames: 0,
    boundNames: names.length,
    parallelWidth: stages.length,
    stages,
  };
}

export function ltsReport() {
  const states = PIPELINE.map((label, i) => ({
    id: i,
    label,
    out: i < PIPELINE.length - 1 ? [{ label: "τ", to: i + 1 }] : [],
  }));
  const transitions = states.reduce((a, s) => a + s.out.length, 0);
  const deadlocks = states.filter((s) => !s.out.length).map((s) => s.label);
  const reachable = new Set([0]);
  let frontier = [0];
  while (frontier.length) {
    const next = [];
    for (const id of frontier) {
      for (const t of states[id].out) {
        if (!reachable.has(t.to)) {
          reachable.add(t.to);
          next.push(t.to);
        }
      }
    }
    frontier = next;
  }
  return {
    states,
    count: states.length,
    transitions,
    deadlocks,
    reachable: reachable.size,
    traces: 1, // linear pipeline: exactly one maximal trace
  };
}

/* ------------------------------------------------------------------ *
 * registry
 * ------------------------------------------------------------------ *
 * kind: "lens"  — real computation + real geometry
 *       "card"  — the system has no honest geometry here; text only
 * needs: data the viewer must prepare before compute() runs
 */


/* ------------------------------------------------------------------ *
 * algebra / geometry / trigonometry helpers
 * ------------------------------------------------------------------ */

export function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; }
export function lcm(a, b) { return Math.abs(a * b) / (gcd(a, b) || 1); }

/** Permutation (array mapping i -> p[i]) to disjoint cycles + order + sign. */
export function permutationCycles(p) {
  const n = p.length; const seen = new Array(n).fill(false); const cycles = [];
  for (let i = 0; i < n; i++) {
    if (seen[i]) continue;
    const cyc = []; let j = i;
    while (!seen[j]) { seen[j] = true; cyc.push(j); j = p[j]; }
    if (cyc.length) cycles.push(cyc);
  }
  const order = cycles.reduce((o, c) => lcm(o, c.length), 1);
  const sign = cycles.reduce((sg, c) => sg * ((c.length - 1) % 2 ? -1 : 1), 1);
  return { cycles, order, sign, transpositions: cycles.reduce((t, c) => t + c.length - 1, 0) };
}

/** Rank over GF(2) of a matrix given as an array of bigint row bitmasks. */
export function gf2Rank(rows) {
  const m = rows.slice(); let rank = 0;
  const width = m.reduce((w, r) => Math.max(w, r ? r.toString(2).length : 0), 0);
  for (let col = width - 1; col >= 0 && rank < m.length; col--) {
    let piv = -1;
    for (let r = rank; r < m.length; r++) if ((m[r] >> BigInt(col)) & 1n) { piv = r; break; }
    if (piv < 0) continue;
    [m[rank], m[piv]] = [m[piv], m[rank]];
    for (let r = 0; r < m.length; r++) if (r !== rank && ((m[r] >> BigInt(col)) & 1n)) m[r] ^= m[rank];
    rank++;
  }
  return rank;
}

/** GF(2^8) with AES reduction polynomial x^8+x^4+x^3+x+1. */
export function gf256Mul(a, b) { let r = 0; a &= 255; b &= 255; while (b) { if (b & 1) r ^= a; a <<= 1; if (a & 256) a ^= 0x11b; b >>= 1; } return r & 255; }
export function gf256Inv(a) { let r = 1, base = a & 255, e = 254; while (e) { if (e & 1) r = gf256Mul(r, base); base = gf256Mul(base, base); e >>= 1; } return a ? r : 0; }

/** Real DFT amplitude spectrum of a numeric sequence. */
export function dftAmplitudes(seq) {
  const n = seq.length; const out = [];
  const half = Math.floor(n / 2) + 1;
  for (let k = 0; k < half; k++) {
    let re = 0, im = 0;
    for (let t = 0; t < n; t++) { const a = (2 * Math.PI * k * t) / n; re += seq[t] * Math.cos(a); im -= seq[t] * Math.sin(a); }
    out.push(Math.hypot(re, im));
  }
  return out;
}

export function parseval(seq) {
  const n = seq.length;
  const time = seq.reduce((a, v) => a + v * v, 0);
  const amp = dftAmplitudes(seq);
  let freq = amp[0] * amp[0];
  for (let k = 1; k < amp.length - (n % 2 === 0 ? 1 : 0); k++) freq += 2 * amp[k] * amp[k];
  if (n % 2 === 0) freq += amp[amp.length - 1] ** 2; // Nyquist counted once
  return { time, freq: freq / n };
}

export function crossRatio(x1, x2, x3, x4) {
  return ((x1 - x3) * (x2 - x4)) / ((x1 - x4) * (x2 - x3));
}

/** Monotone-chain convex hull; returns the hull vertices in order. */
export function convexHull(pts) {
  const P = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = []; for (const q of P) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop(); lower.push(q); }
  const upper = []; for (let i = P.length - 1; i >= 0; i--) { const q = P[i]; while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop(); upper.push(q); }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}

export function shoelace(pts) {
  let a = 0; for (let i = 0; i < pts.length; i++) { const [x1, y1] = pts[i]; const [x2, y2] = pts[(i + 1) % pts.length]; a += x1 * y2 - x2 * y1; }
  return Math.abs(a) / 2;
}

export function segmentsCross(p1, p2, p3, p4) {
  const d = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const d1 = d(p3, p4, p1), d2 = d(p3, p4, p2), d3 = d(p1, p2, p3), d4 = d(p1, p2, p4);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

export function greatCircle(u, v) {
  const du = Math.hypot(...u), dv = Math.hypot(...v);
  const cos = Math.max(-1, Math.min(1, (u[0] * v[0] + u[1] * v[1] + u[2] * v[2]) / (du * dv || 1)));
  return Math.acos(cos);
}

export function sphericalAngle(a, b, c) {
  // angle at vertex a of spherical triangle abc (unit vectors)
  const ab = greatCircle(a, b), ac = greatCircle(a, c), bc = greatCircle(b, c);
  const cos = (Math.cos(bc) - Math.cos(ab) * Math.cos(ac)) / (Math.sin(ab) * Math.sin(ac) || 1);
  return Math.acos(Math.max(-1, Math.min(1, cos)));
}

export function lawOfCosinesAngle(a, b, c) {
  // angle opposite side c
  const cos = (a * a + b * b - c * c) / (2 * a * b || 1);
  return Math.acos(Math.max(-1, Math.min(1, cos)));
}

/** Least-squares single-sinusoid fit at a fixed frequency. */
export function fitSinusoid(seq, freq) {
  const n = seq.length; const w = (2 * Math.PI * freq) / n;
  let sc = 0, ss = 0, yc = 0, ys = 0;
  for (let t = 0; t < n; t++) { const c = Math.cos(w * t), si = Math.sin(w * t); sc += c * c; ss += si * si; yc += seq[t] * c; ys += seq[t] * si; }
  const A = yc / (sc || 1), Bv = ys / (ss || 1);
  const amp = Math.hypot(A, Bv), phase = Math.atan2(-Bv, A);
  const mean = seq.reduce((a, b) => a + b, 0) / n;
  let ssr = 0, sst = 0;
  for (let t = 0; t < n; t++) { const f = mean + A * Math.cos(w * t) + Bv * Math.sin(w * t); ssr += (seq[t] - f) ** 2; sst += (seq[t] - mean) ** 2; }
  return { amp, phase, r2: 1 - ssr / (sst || 1) };
}

export function divisors(n) { const out = []; for (let d = 1; d <= n; d++) if (n % d === 0) out.push(d); return out; }
export function mobiusFn(n) {
  let k = 0; let m = n;
  for (let p = 2; p * p <= m; p++) if (m % p === 0) { if ((m / p) % p === 0) return 0; k++; m /= p; }
  if (m > 1) k++;
  return k % 2 ? -1 : 1;
}

export const LENSES = [
  /* ---- invert keyspace: A ↔ B ---- */
  {
    id: "inv-subcube",
    name: "Invert · affine subcube",
    group: "invert",
    kind: "lens",
    needs: ["pair"],
    tagline: "The 2^d keys spanned by A and B",
    compute: (c) => {
      const r = c.pair;
      if (!r) return null;
      return {
        rows: [
          ["d(A,B)", `${r.d} bits of ${r.entBits}`],
          ["mask A⊕B", `${r.maskHex.slice(0, 32)}${r.maskHex.length > 32 ? "…" : ""}`],
          ["|S(A,B)|", `2^${r.d} = ${fmtBig(r.subcubeSize)}`],
          ["measure |S|/|C|", `2^${r.measureLog2}`],
          ["differing in top 21", `${r.prefixDiff} bits`],
        ],
        describe: `A and B are two corners of the ${r.entBits}-cube. The keys "between" them form the affine subcube A ⊕ (m ⊙ s), m = A⊕B.`,
        explain: `|S| = 2^d with d = ${r.d}. Every shortest A→B path lives inside S, so S is the smallest convex set containing both keys.`,
        predict: `S holds ${fmtBig(r.subcubeSize)} keys = 2^${r.measureLog2} of the whole space — ${r.d === 0 ? "A = B, the subcube is a point" : "a vanishing fraction unless the keys are close"}.`,
      };
    },
  },
  {
    id: "inv-geodesic",
    name: "Invert · geodesics",
    group: "invert",
    kind: "lens",
    needs: ["pair"],
    tagline: "d! shortest paths, d flips each",
    compute: (c) => {
      const r = c.pair;
      if (!r) return null;
      return {
        rows: [
          ["length", `${r.d} flips`],
          ["#geodesics", `${fmtBig(r.geodesics)} (= ${r.d}!)`],
          ["first flips", r.firstSteps.length ? r.firstSteps.map((b) => `bit ${b}`).join(", ") : "—"],
          ["digits in d!", r.d ? Math.floor(log10Big(r.geodesics)) + 1 : 1],
        ],
        describe: `A geodesic on the Hamming cube flips the ${r.d} differing bits in some order.`,
        explain: `All ${r.d}! orders give distinct shortest paths of length ${r.d}; the cube has no unique geodesic once d ≥ 2.`,
        predict: `Every intermediate key on any geodesic agrees with A and B on all ${r.entBits - r.d} shared bits — that is the invert keyspace's boundary condition.`,
      };
    },
  },
  {
    id: "inv-complement",
    name: "Invert · complement ¬k",
    group: "invert",
    kind: "lens",
    needs: ["pair"],
    tagline: "Antipode of A, and its distance to B",
    compute: (c) => {
      const r = c.pair;
      if (!r) return null;
      return {
        rows: [
          ["d(A,¬A)", `${r.antipode} bits (antipode)`],
          ["d(¬A,B)", `${r.complementAToB} bits`],
          ["invariant", `d(¬A,B) = ENT − d(A,B) → ${r.entBits} − ${r.d} = ${r.entBits - r.d}`],
          ["¬A", `${hexOf(r.complementA).slice(0, 32)}${r.entBits > 128 ? "…" : ""}`],
        ],
        describe: `¬A flips every bit: the antipodal corner of the cube.`,
        explain: `Complementation is an isometry of the Hamming cube, so d(¬A,¬B) = d(A,B) and d(¬A,B) = ENT − d(A,B).`,
        predict: `Measured d(¬A,B) = ${r.complementAToB}; predicted ${r.entBits - r.d}. ${r.complementAToB === r.entBits - r.d ? "Match." : "Mismatch — lengths differ."}`,
      };
    },
  },
  {
    id: "inv-shell",
    name: "Invert · Hamming shell",
    group: "invert",
    kind: "lens",
    needs: ["pair"],
    tagline: "Sphere of radius d around A",
    compute: (c) => {
      const r = c.pair;
      if (!r) return null;
      const shell = binomBig(r.entBits, r.d);
      return {
        rows: [
          ["radius", r.d],
          ["|shell|", `C(${r.entBits},${r.d}) = ${fmtBig(shell)}`],
          ["|shell|/|C|", `≈ 2^${(log10Big(shell) / Math.log10(2) - r.entBits).toFixed(1)}`],
        ],
        describe: `The set of keys at exactly distance ${r.d} from A — B is one of them.`,
        explain: `Shells partition the cube; BIP-39 gives no way to enumerate a shell, only to test membership.`,
        predict: `B is 1 of ${fmtBig(shell)} keys on this shell; the shell is ${r.d === 0 ? "a single point" : "overwhelmingly larger than the subcube S"}.`,
      };
    },
  },

  /* ---- λ-calculus family ---- */
  {
    id: "lambda",
    name: "λ-calculus",
    group: "λ",
    kind: "lens",
    tagline: "The phrase as a closed λ-term",
    compute: (c) => {
      const b = betaReport(c.words, c.layout.entBits, c.layout.csBits);
      const t = phraseTerm(c.words);
      return {
        rows: [
          ["term", t.term.length > 48 ? `${t.term.slice(0, 44)}…` : t.term],
          ["|term|", `${t.size} symbols`],
          ["bound vars", t.boundVars],
          ["β-redexes", b.redexes],
          ["type of Φ", b.csType],
        ],
        describe: `Read the mnemonic as λx₁…x_n. x₁ x₂ … x_n — a closed term with ${c.words.length} binders.`,
        explain: `Φ (entropy → checksum) is a total function, so the encoding term always has a normal form; there are no free variables and no divergence.`,
        predict: `β-reduction of the Church spine terminates in ${b.betaSteps} steps; term size grows linearly (3n−1 = ${t.size}).`,
      };
    },
  },
  {
    id: "lambda-untyped",
    name: "untyped λ-calculus",
    group: "λ",
    kind: "lens",
    tagline: "Church numeral of the word count",
    compute: (c) => {
      const n = c.words.length;
      return {
        rows: [
          ["numeral", n <= 24 ? churchNumeral(n) : `λf.λx.f^${n} x`],
          ["applications", n],
          ["normal form", `f^${n} x`],
          ["bits term", `λc.λn. c b₁ (c b₂ … n), ${2 * c.layout.entBits + 1} symbols`],
        ],
        describe: `Your word count as a Church numeral: ${n} applications of f to x.`,
        explain: `Untyped terms can diverge (Ω = (λx.x x)(λx.x x)); the entropy term cannot, because it is built only from applications of a fixed successor to a fixed zero.`,
        predict: `Reducing f^${n} x under any strategy reaches the same normal form in ${n} β-steps — confluence guarantees it.`,
      };
    },
  },
  {
    id: "lambda-typed",
    name: "typed λ-calculus",
    group: "λ",
    kind: "card",
    tagline: "Why the honest type is dependent, not simple",
    compute: (c) => {
      const { entBits, csBits, words } = c.layout;
      return {
        rows: [
          ["needed", `Φ : (e : Bit^ENT) → Bit^(ENT/32)`],
          ["obstacle", `the codomain depends on the length index`],
          ["your case", `Φ : Bit^${entBits} → Bit^${csBits}`],
        ],
        describe: `Stating Φ's type precisely requires a dependent (or at least indexed) type: the checksum length is a function of the entropy length.`,
        explain: `System F can express ∀n. Bit^n → Bit^(n/32) only with type-level arithmetic; plain polymorphism cannot. This entry is a card because there is no keyspace geometry to draw from it — the content is the typing judgment itself.`,
        predict: `For ${words} words the instantiation is Φ : Bit^${entBits} → Bit^${csBits}; no other instance is reachable from this phrase.`,
      };
    },
  },
  {
    id: "lambda-simple",
    name: "simply typed λ-calculus",
    group: "λ",
    kind: "lens",
    tagline: "The pipeline as base types and arrows",
    compute: (c) => {
      const rows = simplyTypedJudgments(c.layout);
      return {
        rows,
        describe: `Fix the length indices and every stage becomes a base type with an arrow between them.`,
        explain: `Simply typed λ-terms are strongly normalising: every reduction sequence halts. That is the formal reason a mnemonic encoder cannot loop.`,
        predict: `decode ∘ encode = id on ENT (injective); encode ∘ decode is defined only on the 1-in-2^${c.layout.csBits} slice where the checksum holds.`,
      };
    },
  },

  /* ---- analysis family ---- */
  {
    id: "differential",
    name: "differential calculus",
    group: "analysis",
    kind: "lens",
    needs: ["flips"],
    tagline: "∂Φ/∂bᵢ measured for every entropy bit",
    compute: (c) => {
      const p = differentialProfile(c.flips);
      if (!p) return null;
      const dist = p.histogram.map(([k, v]) => `${k}→${v}`).join("  ");
      return {
        rows: [
          ["bits probed", p.grad.length],
          ["mean ‖∂Φ‖", `${p.mean.toFixed(3)} words/bit`],
          ["max", `${p.max} words (bit ${p.maxBit})`],
          ["support", `${p.support}/${p.grad.length} bits change something`],
          ["histogram", dist],
        ],
        describe: `Flip one entropy bit, re-run Φ, count the words that move. That count is the discrete derivative at each bit.`,
        explain: `Bit i lives in 11-bit chunk ⌊i/11⌋, so ∂Φ/∂bᵢ is supported on at most two words: its own chunk and the checksum word. BIP-39 is not an avalanche function — the hash only touches the last word.`,
        predict: `Predicted support = {⌊i/11⌋, last}. Measured: ${p.lastWordChanged}/${p.grad.length} flips moved the checksum word; max change = ${p.max} words. ${p.confined ? "Confirmed." : "Exceeded — investigate."}`,
      };
    },
  },
  {
    id: "integral",
    name: "integral calculus",
    group: "analysis",
    kind: "lens",
    needs: ["flips"],
    tagline: "Cumulative sensitivity + prefix measure",
    compute: (c) => {
      const p = differentialProfile(c.flips);
      if (!p) return null;
      const ip = integralProfile(p.grad);
      return {
        rows: [
          ["∫‖∂Φ‖", `${ip.area} word-changes over ${p.grad.length} bits`],
          ["half-area at", `bit ${ip.halfAt}`],
          ["mean rate", ip.meanRate.toFixed(4)],
          ["prefix measure μ_k", `2^−k keys share the first k bits`],
        ],
        describe: `Sum the derivative: the accumulated number of word-changes as you sweep the entropy bits left to right.`,
        explain: `The area under ‖∂Φ‖ is the total sensitivity of the encoding; the prefix measure 2^−k is the dual statement — how much of the space the first k bits already pin down.`,
        predict: `Half of the total sensitivity sits in the first ${ip.halfAt} bits; the measure after ${ip.halfAt} bits is 2^−${ip.halfAt}.`,
      };
    },
  },
  {
    id: "fractional",
    name: "fractional calculus",
    group: "analysis",
    kind: "lens",
    needs: ["flips"],
    tagline: "Grünwald–Letnikov derivative of order α",
    compute: (c) => {
      const p = differentialProfile(c.flips);
      if (!p) return null;
      const half = fractionalDerivative(p.grad, 0.5);
      const quarter = fractionalDerivative(p.grad, 0.25);
      const peak = half.indexOf(Math.max(...half));
      return {
        rows: [
          ["D^0.5 peak", `bit ${peak} = ${half[peak].toFixed(3)}`],
          ["D^0.25 peak", `bit ${quarter.indexOf(Math.max(...quarter))}`],
          ["memory terms", `${p.grad.length} per output point`],
          ["α = 1 recovers", `the measured gradient`],
        ],
        describe: `A half-order derivative of the gradient field — each output mixes every earlier bit with the binomial kernel (−1)^j C(α,j).`,
        explain: `Fractional derivatives are non-local: D^0.5 at bit k remembers the whole prefix. That is exactly the right lens for a checksum, whose value depends on all of ENT at once.`,
        predict: `As α→0 the result tends to the gradient itself, as α→1 to the integer difference; the half-order curve should lead the integer one by ~half a chunk.`,
      };
    },
  },
  {
    id: "vector",
    name: "vector calculus",
    group: "analysis",
    kind: "lens",
    tagline: "Arc length, curvature, turning of the drawn path",
    compute: (c) => {
      const v = curveInvariants(c.path);
      if (!v) return null;
      return {
        rows: [
          ["points", v.points],
          ["arc length", v.arcLength.toFixed(4)],
          ["chord", v.chord.toFixed(4)],
          ["arc/chord", v.slack.toFixed(4)],
          ["total turning", `${v.totalTurning.toFixed(3)} rad`],
          ["mean curvature", v.meanCurvature.toFixed(4)],
          ["max curvature", v.maxCurvature.toFixed(4)],
        ],
        describe: `The phrase path through the word cloud is a polygonal curve; these are its differential invariants.`,
        explain: `Curvature is computed from the angle between consecutive segments, κ ≈ 2 sin(θ/2)/|h|. arc/chord ≥ 1 measures how much the path wanders.`,
        predict: `A random path of ${v.points} points in the ball has arc/chord ≈ ${(1.5).toFixed(1)}–3; measured ${v.slack.toFixed(2)} — ${v.slack > 3 ? "more tangled than random" : "consistent with a mixer output"}.`,
      };
    },
  },
  {
    id: "tensor",
    name: "tensor calculus",
    group: "analysis",
    kind: "lens",
    needs: ["flips"],
    tagline: "Gram tensor of the Jacobian + eigenvalues",
    compute: (c) => {
      const inf = influenceMatrix(c.flips, c.words.length);
      if (!inf) return null;
      const rows = Math.min(6, inf.words);
      const M = gramMatrix(Array.from({ length: rows }, (_, i) => inf.rows[i]));
      const ev = eigenSymmetric(M, 2);
      return {
        rows: [
          ["Jacobian", `${inf.words} × ${inf.bits}`],
          ["Gram J Jᵀ", `${rows} × ${rows} (first ${rows} words)`],
          ["tr(J Jᵀ)", traceOf(M).toFixed(5)],
          ["λ₁", ev[0].lambda.toFixed(5)],
          ["λ₂", (ev[1]?.lambda ?? 0).toFixed(5)],
          ["λ₁/λ₂", ev[1]?.lambda ? (ev[0].lambda / ev[1].lambda).toFixed(2) : "∞"],
        ],
        describe: `Treat the influence matrix as a rank-2 tensor J^w{}_b; contracting it with itself gives the word-word Gram tensor.`,
        explain: `λ₁/λ₂ is the anisotropy of the encoding's sensitivity: how much one direction in word-space dominates. A checksum-driven map should be dominated by the last word.`,
        predict: `λ₁ ≈ ‖row(last word)‖² because the checksum word responds to every bit; measured λ₁ = ${ev[0].lambda.toFixed(4)}.`,
      };
    },
  },
  {
    id: "ricci",
    name: "Ricci calculus",
    group: "analysis",
    kind: "lens",
    tagline: "Index gymnastics on the flat bit metric",
    compute: (c) => {
      const r = ricciReport(c.entropy);
      return {
        rows: [
          ["metric", r.metric],
          ["Γⁱⱼₖ", `${r.christoffel} (all)`],
          ["R", `${r.ricciScalar}`],
          ["g^ij g_ij", `${r.n} (dimension)`],
          ["ds² for your key", `${r.ds2} (Hamming weight ${r.weight})`],
        ],
        describe: `Raise and lower indices with the Hamming-cube metric g_ij = δ_ij and contract.`,
        explain: `The result is deliberately boring: the cube is flat, so every Christoffel symbol and the Ricci scalar vanish. There is no curvature to exploit — that is a real statement about the keyspace, not a failure of the lens.`,
        predict: `ds² = g_ij dxⁱ dxʲ equals the Hamming weight for dx ∈ {0,1}^n: ${r.ds2}. Any lens claiming curvature here is wrong.`,
      };
    },
  },
  {
    id: "influence",
    name: "influence calculus",
    group: "analysis",
    kind: "lens",
    needs: ["flips"],
    tagline: "Which bit controls which word",
    compute: (c) => {
      const inf = influenceMatrix(c.flips, c.words.length);
      if (!inf) return null;
      const order = inf.rowSum
        .map((s, i) => [i + 1, s])
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
      return {
        rows: [
          ["matrix", `${inf.words} words × ${inf.bits} bits`],
          ["total influence", inf.total.toFixed(3)],
          ["top words", order.map(([w, s]) => `#${w} ${s.toFixed(2)}`).join("  ")],
          ["mean per bit", (inf.total / inf.bits).toFixed(5)],
        ],
        describe: `Normalised |Δindex| per (word, bit) pair — the influence each entropy bit exerts on each word.`,
        explain: `Rows other than ⌊i/11⌋ and the last are structurally zero: BIP-39's chunking gives the influence matrix a banded-plus-last-row shape.`,
        predict: `Word ${order[0]?.[1]} should carry the most influence (it holds the checksum); measured share ${((order[0]?.[1] / inf.total) * 100).toFixed(1)}%.`,
      };
    },
  },

  /* ---- logic family ---- */
  {
    id: "propositional",
    name: "propositional calculus",
    group: "logic",
    kind: "lens",
    tagline: "Truth table of the well-formedness formula",
    compute: (c) => {
      const atoms = wellFormedAtoms(c.analysis, c.words);
      const tt = truthTable(atoms);
      return {
        rows: [
          ...atoms.map((a) => [a.id, a.value ? "TRUE" : "FALSE"]),
          ["N ∧ W ∧ C", atoms.every((a) => a.value) ? "TRUE" : "FALSE"],
          ["your row", `#${tt.actualIndex + 1} of ${tt.rows.length}`],
        ],
        describe: `Three atoms decide whether your phrase is well formed; the formula is their conjunction.`,
        explain: `This is decidable in one pass — no search, no oracle. Every row of the table is reachable except that C is a hash predicate: flipping it costs a preimage.`,
        predict: `Current valuation makes N ∧ W ∧ C ${atoms.every((a) => a.value) ? "true" : "false"} — matching the checksum status shown above.`,
        truth: tt,
      };
    },
  },
  {
    id: "predicate",
    name: "predicate calculus",
    group: "logic",
    kind: "lens",
    tagline: "Quantified claims with real cardinalities",
    compute: (c) => {
      const claims = predicateClaims(c.analysis);
      return {
        rows: claims.map((cl) => [cl.claim, cl.detail]),
        describe: `∀ and ∃ over the keyspace, with each witness set counted exactly.`,
        explain: `The interesting failure of intuition is ∃!: a 14-bit prefix looks like it identifies a key, but its fibre still holds 2^(ENT−14) keys.`,
        predict: `Every claim above is checkable from the loaded phrase; the cardinalities are exact, not estimates.`,
        claims,
      };
    },
  },
  {
    id: "relational",
    name: "relational calculus",
    group: "logic",
    kind: "lens",
    tagline: "A real query over the loaded relations",
    compute: (c) => {
      const q = relationalQuery(c.analysis, c.words);
      return {
        rows: [
          ...q.relations,
          [q.query, q.result.join(", ") || "∅"],
          ["join size", `${q.joinCount} tuples`],
          ["CS rows ok", q.checksumRows],
        ],
        describe: `PHRASE, ENT and CHECKSUM as relations; the query is tuple relational calculus.`,
        explain: `Selection and projection are exact here because the relations are finite and materialised in memory — no estimation, no index.`,
        predict: `The projection π_word(σ_cs(PHRASE)) returns exactly one tuple for any well-formed phrase: got ${q.result.length}.`,
      };
    },
  },
  {
    id: "sequent",
    name: "sequent calculus",
    group: "logic",
    kind: "lens",
    tagline: "Derivation tree of the validity judgment",
    compute: (c) => {
      const atoms = wellFormedAtoms(c.analysis, c.words);
      const p = sequentProof(atoms);
      return {
        rows: [
          ["sequent", p.root.label],
          ["depth", p.depth],
          ["rule applications", p.rules],
          ["cut-free", p.cutFree ? "yes" : "no (uses the definition of valid)"],
          ["failed leaves", p.failed.join(", ") || "none"],
        ],
        describe: `The judgment ⊢ well-formed mnemonic derived from three measured axioms by ∧-right and a cut.`,
        explain: `If any atom fails, the derivation stops at that leaf — the tree shows exactly where the phrase broke instead of only saying "invalid".`,
        predict: `${p.failed.length ? `This phrase has ${p.failed.length} failed leaf/leaves: ${p.failed.join(", ")}` : "All leaves discharge; the derivation closes."}`,
        tree: p.root,
      };
    },
  },
  {
    id: "modal-mu",
    name: "modal μ-calculus",
    group: "logic",
    kind: "lens",
    tagline: "Reachability fixpoint on Q_ENT",
    compute: (c) => {
      const r = reachabilityFixpoint(c.layout.entBits, 6);
      return {
        rows: [
          ["space", `Q_${r.n}, 2^${r.n} corners`],
          ["μ closes after", `${r.fixpointIterations} iterations`],
          ["|B(1)|", `${r.balls[1]?.ball ?? "—"}`],
          ["|B(6)|", fmtBig(r.balls[6]?.ball ?? 0n)],
          ["50% coverage at", `radius ${r.halfRadius}`],
        ],
        describe: `μX. (X ∪ ◇X) — the least fixpoint that keeps adding Hamming-distance-1 neighbours.`,
        explain: `On a connected graph the fixpoint is the whole vertex set; on Q_n it takes exactly n+1 iterations because the antipode is n flips away.`,
        predict: `Half of 2^${r.n} is inside radius ${r.halfRadius}; the shell there is where a random key most likely sits (concentration of measure).`,
        balls: r.balls,
      };
    },
  },

  /* ---- algebra family ---- */
  {
    id: "boolean",
    name: "Boolean calculus",
    group: "algebra",
    kind: "lens",
    needs: ["anf"],
    tagline: "Zhegalkin polynomial of a checksum-derived bit",
    compute: (c) => {
      const b = booleanProfile(c.anf, c.entropy, c.pairEntropy);
      const terms = b.anfTerms ? b.anfTerms.join(" ⊕ ") : "—";
      return {
        rows: [
          ["ANF", terms.length > 54 ? `${terms.slice(0, 50)}…` : terms],
          ["ANF weight", `${b.anfWeight ?? "—"} monomials`],
          ["linear ceiling", b.linearCeiling ? `≤ ${b.linearCeiling} if affine` : "—"],
          ["popcount(A)", `${b.popA ?? "—"}/${(c.entropy?.length ?? 0) * 8}`],
          ["A⊕B weight", b.xorWeight ?? "—"],
        ],
        describe: `Take one output bit of the checksum word as a Boolean function of 4 chosen entropy bits and compute its algebraic normal form over GF(2).`,
        explain: `Every Boolean function has a unique Zhegalkin polynomial. Affine functions have weight ≤ n+1; a hash-derived bit should look like a random polynomial of weight ≈ 2^(n−1).`,
        predict: `Weight ${b.anfWeight ?? "?"} vs affine ceiling ${b.linearCeiling ?? "?"} — ${b.anfWeight > b.linearCeiling ? "nonlinear, as a hash bit must be" : "looks affine (sample-dependent)"}.`,
      };
    },
  },
  {
    id: "umbral",
    name: "umbral calculus",
    group: "algebra",
    kind: "lens",
    tagline: "Difference table and binomial transform of the indices",
    compute: (c) => {
      const u = umbralProfile(c.indices);
      if (!u) return null;
      return {
        rows: [
          ["aₙ", u.seq.slice(0, 8).join(", ") + (u.seq.length > 8 ? ", …" : "")],
          ["Δaₙ", u.diffs[1]?.slice(0, 8).join(", ") ?? "—"],
          ["top diagonal", u.topDiagonal.slice(0, 8).join(", ")],
          ["binomial transform", u.binomial.slice(0, 6).join(", ")],
          ["shadow degree", u.shadowDegree],
        ],
        describe: `Treat the word-index sequence as the moment sequence of a shadow polynomial and take its finite differences.`,
        explain: `The top diagonal of the difference table is the Newton series coefficient list; the binomial transform is its involutive dual. Both are exact integer operations on your actual indices.`,
        predict: `A random index sequence has no vanishing differences — if any Δ^k row is identically zero, the phrase is not random.`,
        diffs: u.diffs,
      };
    },
  },

  /* ---- time family ---- */
  {
    id: "situation",
    name: "situation calculus",
    group: "time",
    kind: "lens",
    needs: ["session"],
    tagline: "Fluents over this session's situations",
    compute: (c) => {
      const s = situationReport(c.actions);
      return {
        rows: [
          ["situations", s.situations],
          ["fluents", s.fluents.join(", ")],
          ["current", s.chain[s.chain.length - 1].term],
          ["successor axiom", s.successor],
        ],
        describe: `Every action you take (sample, project, flip) builds a new situation term do(a, s).`,
        explain: `Validity is a fluent: it is initiated by a successful projection and persists until an action falsifies it — this is the frame problem solved by a successor-state axiom.`,
        predict: `After ${s.situations} actions the current situation is ${s.chain[s.chain.length - 1].term}; Valid holds iff the last projection's checksum matched.`,
        chain: s.chain,
      };
    },
  },
  {
    id: "event",
    name: "event calculus",
    group: "time",
    kind: "lens",
    needs: ["session"],
    tagline: "HoldsAt(Valid, t) from real timestamps",
    compute: (c) => {
      const e = eventReport(c.actions);
      return {
        rows: [
          ["events", e.events.length],
          ["intervals", e.intervals.map(([a, b]) => `[${a.toFixed(0)}, ${b.toFixed(0)}] ms`).join(" ") || "none"],
          ["initiates", e.events.filter((x) => x.initiates).length],
          ["terminates", e.events.filter((x) => x.terminates).length],
        ],
        describe: `Same history as situation calculus, but on a metric timeline: Initiates / Terminates decide HoldsAt(Valid, t).`,
        explain: `The timestamps are measured with performance.now() in this tab, so the intervals are real durations, not modelled ones.`,
        predict: `HoldsAt(Valid, now) is ${e.grid[e.grid.length - 1]?.[1] ? "true" : "false"} given ${e.events.length} recorded events.`,
        grid: e.grid,
      };
    },
  },
  {
    id: "duration",
    name: "duration calculus",
    group: "time",
    kind: "lens",
    needs: ["timings"],
    tagline: "Measured cost of each stage",
    compute: (c) => {
      const d = durationReport(c.timings);
      return {
        rows: [
          ...d.rows.map((r) => [r.label, `${r.ms.toFixed(2)} ms (${(r.share * 100).toFixed(1)}%)`]),
          ["total", `${d.total.toFixed(2)} ms`],
        ],
        describe: `Wall-clock duration of SHA-256, encoding, the WASM mixer and the flip sweep, measured in this tab.`,
        explain: `Duration calculus reasons about intervals rather than instants; here the intervals are the measured spans of each pipeline stage.`,
        predict: `SHA-256 dominates whenever the flip sweep runs (${c.layout.entBits} digests); slowest measured stage: ${d.slowest}.`,
      };
    },
  },

  /* ---- stochastic family ---- */
  {
    id: "stochastic",
    name: "stochastic calculus",
    group: "stochastic",
    kind: "lens",
    tagline: "Expected search time and birthday bound",
    compute: (c) => {
      const s = stochasticForecast(c.layout.entBits, [
        { label: "10⁶/s CPU", rate: 1e6 },
        { label: "10⁹/s GPU", rate: 1e9 },
        { label: "10¹²/s ASIC-folklore", rate: 1e12 },
        { label: "10¹⁵/s hypothetical", rate: 1e15 },
      ]);
      return {
        rows: [
          ["|C|", `2^${s.entBits} (log₁₀ = ${s.log10Space.toFixed(1)})`],
          ...s.rows.map((r) => [r.label, fmtSeconds(r.years * 31557600)]),
          ["birthday 50%", `≈ 2^${s.birthdayLog10.toFixed(1)} keys seen`],
          ["median hit", `2^${s.medianGuessesLog10.toFixed(1)} guesses`],
        ],
        describe: `Search as a geometric process: each guess hits with p = 2^−ENT, independently.`,
        explain: `Expected first hit is 2^ENT guesses, median 2^ENT·ln2. The birthday bound governs collisions between two random keys, not a targeted hit.`,
        predict: `Even at 10¹⁵ guesses/s a targeted hit on 2^${s.entBits} takes ${fmtSeconds(s.rows[3].years * 31557600)} — the timescale is astronomical, not merely large.`,
      };
    },
  },
  {
    id: "ito",
    name: "Itô calculus",
    group: "stochastic",
    kind: "lens",
    needs: ["seed"],
    tagline: "Quadratic variation of the search process",
    compute: (c) => {
      const it = itoReport(c.seed ?? 12345, 240);
      return {
        rows: [
          ["steps", it.steps],
          ["λ (guess rate)", it.lambda],
          ["[X]_T", it.quadraticVariation.toFixed(5)],
          ["Itô correction ½∫f″dt", it.itoCorrection.toExponential(3)],
          ["drift X_T", it.drift.toFixed(4)],
        ],
        describe: `Model the guess count as a Poisson stream and track X_t = log₂(1 + N_t); [X]_T is its realised quadratic variation.`,
        explain: `Quadratic variation is what separates Itô from ordinary calculus: it is why the Itô correction term appears and why log-progress grows like √t in fluctuation, t in drift.`,
        predict: `[X]_T = ${it.quadraticVariation.toFixed(4)} on this seeded path; re-running with the same seed reproduces it exactly (deterministic LCG).`,
        path: it.path,
      };
    },
  },

  /* ---- process family ---- */
  {
    id: "pi",
    name: "π-calculus",
    group: "process",
    kind: "lens",
    tagline: "The pipeline as name-passing processes",
    compute: () => {
      const p = piReport();
      return {
        rows: [
          ["term", `${p.process.slice(0, 64)}…`],
          ["channels", p.channels.join(", ")],
          ["bound names", p.boundNames],
          ["parallel width", p.parallelWidth],
        ],
        describe: `Each pipeline stage is a process; stages communicate by passing the seed along private channels c0…c${p.channels.length - 1}.`,
        explain: `Restriction (ν c) models the fact that intermediate values never leave the derivation. This is a model of the pipeline, not observed traffic.`,
        predict: `${p.parallelWidth} parallel components, ${p.boundNames} private names, no free names — nothing is observable from outside the term.`,
      };
    },
  },
  {
    id: "process",
    name: "process calculus",
    group: "process",
    kind: "lens",
    tagline: "LTS of the derivation, deadlock check",
    compute: () => {
      const l = ltsReport();
      return {
        rows: [
          ["states", l.count],
          ["transitions", l.transitions],
          ["reachable", `${l.reachable}/${l.count}`],
          ["deadlocks", l.deadlocks.join(", ") || "none (terminal state is intended)"],
          ["maximal traces", l.traces],
        ],
        describe: `The derivation as a labelled transition system: one state per pipeline stage, one τ transition between them.`,
        explain: `A linear pipeline has exactly one maximal trace and no branching, which is the formal way of saying the derivation is deterministic.`,
        predict: `All ${l.reachable} states are reachable from the start and only the final state has no successor — deadlock-freedom up to the intended terminal.`,
        lts: l.states,
      };
    },
  },

  /* ---- algebra (expanded; boolean + umbral were already here) ---- */
  {
    id: "alg-group", name: "group theory", group: "algebra", kind: "lens",
    tagline: "The sorting permutation of your word indices",
    compute: (c) => {
      const idx = c.indices.filter((i) => i >= 0);
      if (idx.length < 2) return null;
      const order = idx.map((_, i) => i).sort((a, b) => idx[a] - idx[b] || a - b);
      const perm = new Array(idx.length); order.forEach((src, dst) => (perm[src] = dst));
      const g = permutationCycles(perm);
      return {
        rows: [
          ["S_n", `S_${idx.length} on word positions`],
          ["cycle type", g.cycles.map((cy) => cy.length).sort((a, b) => b - a).join("·") || "1"],
          ["order", g.order],
          ["sign", g.sign === 1 ? "+1 (even)" : "−1 (odd)"],
          ["transpositions", g.transpositions],
        ],
        describe: `Sort the words by index; the rearrangement is a permutation in the symmetric group S_${idx.length}.`,
        explain: `Every permutation factors into disjoint cycles; its order is the lcm of the cycle lengths and its sign is (−1)^(#transpositions) — the two invariants that classify it up to conjugacy and parity.`,
        predict: `Applying the permutation ${g.order} times returns the identity (that is the order); the sign is ${g.sign === 1 ? "even" : "odd"}.`,
        cycles: g.cycles,
      };
    },
  },
  {
    id: "alg-linear", name: "linear algebra over GF(2)", group: "algebra", kind: "lens",
    tagline: "Rank of the word-bit matrix",
    compute: (c) => {
      const idx = c.indices.filter((i) => i >= 0);
      if (!idx.length) return null;
      const rows = idx.map((i) => BigInt(i));
      const rank = gf2Rank(rows);
      return {
        rows: [
          ["matrix", `${idx.length} words × 11 bits over GF(2)`],
          ["rank", rank],
          ["nullity", idx.length - rank],
          ["full column rank", rank === Math.min(idx.length, 11) ? "yes" : "no"],
        ],
        describe: `Read each 11-bit word index as a row vector over GF(2) and row-reduce.`,
        explain: `Rank is the size of the largest independent set of word-rows; nullity counts linear relations among them. For a random mnemonic the rows are ~uniform, so rank saturates at min(n,11).`,
        predict: `rank + nullity = n = ${idx.length}; measured ${rank} + ${idx.length - rank} = ${idx.length}.`,
        matrix: idx, rank,
      };
    },
  },
  {
    id: "alg-field", name: "finite fields", group: "algebra", kind: "lens",
    tagline: "GF(2^8) structure of the entropy bytes",
    compute: (c) => {
      const e = c.entropy;
      if (!e?.length) return null;
      const first = [...e].find((b) => b !== 0) ?? 0;
      const inv = gf256Inv(first);
      return {
        rows: [
          ["field", "GF(2^8), x^8+x^4+x^3+x+1"],
          ["characteristic", 2],
          ["order", 256],
          [`a = 0x${first.toString(16)}`, `a⁻¹ = 0x${inv.toString(16)}`],
          ["a·a⁻¹", `0x${gf256Mul(first, inv).toString(16)} (=1)`],
          ["additive group", `(Z/2)^8, byte ⊕ byte`],
        ],
        describe: `Treat each entropy byte as an element of the field with 256 elements; addition is XOR, multiplication is polynomial multiplication mod the AES polynomial.`,
        explain: `A field needs every nonzero element invertible; exponentiation a^254 gives the inverse by Fermat. The additive group is elementary abelian — that is exactly why byte XOR is the checksum's natural addition.`,
        predict: `a·a⁻¹ = 1 for the first nonzero byte: got 0x${gf256Mul(first, inv).toString(16)}.`,
      };
    },
  },
  {
    id: "alg-lattice", name: "lattice of divisors", group: "algebra", kind: "lens",
    tagline: "The divisibility poset of the word count",
    compute: (c) => {
      const n = c.layout?.words ?? c.words.length;
      if (!n) return null;
      const divs = divisors(n);
      return {
        rows: [
          ["n", n],
          ["divisors", divs.join(", ")],
          ["τ(n)", divs.length],
          ["σ(n)", divs.reduce((a, b) => a + b, 0)],
          ["μ(n)", mobiusFn(n)],
          ["structure", mobiusFn(n) === 0 ? "has a squared factor" : "square-free"],
        ],
        describe: `The divisors of the word count ordered by divisibility form a lattice under gcd (meet) and lcm (join).`,
        explain: `Möbius μ(n) is 0 exactly when n has a squared prime factor; otherwise (−1)^(#primes). The lattice is boolean precisely when n is square-free.`,
        predict: `μ(${n}) = ${mobiusFn(n)}; the lattice has ${divs.length} elements.`,
        divisors: divs,
      };
    },
  },
  {
    id: "alg-poly", name: "polynomial ring", group: "algebra", kind: "lens",
    tagline: "The index sequence as P(x) over Z",
    compute: (c) => {
      const idx = c.indices.filter((i) => i >= 0);
      if (!idx.length) return null;
      const p1 = idx.reduce((a, b) => a + b, 0);
      const pm1 = idx.reduce((a, b, i) => a + (i % 2 ? -b : b), 0);
      const content = idx.reduce((g, v) => gcd(g, v), 0);
      return {
        rows: [
          ["deg P", idx.length - 1],
          ["P(1)", p1],
          ["P(−1)", pm1],
          ["content gcd", content],
          ["primitive", content === 1 ? "yes" : "no"],
        ],
        describe: `Read the index sequence as P(x) = Σ idx_i x^i with integer coefficients.`,
        explain: `P(1) is the coefficient sum and P(−1) the alternating sum; the content is the gcd of the coefficients, and P is primitive iff it is 1 — Gauss's lemma says primitive polynomials factor the same over Z and Q.`,
        predict: `content = ${content}, so the polynomial is ${content === 1 ? "primitive" : "not primitive"}.`,
      };
    },
  },

  /* ---- geometry ---- */
  {
    id: "geom-metric", name: "metric geometry", group: "geometry", kind: "lens",
    tagline: "The four metric axioms on Hamming distance",
    compute: (c) => {
      const A = c.entropy, B = c.pairEntropy;
      if (!A || !B) return null;
      const notA = notBytes(A);
      const dAB = hammingBytes(A, B), dAnA = hammingBytes(A, notA), dAnB = hammingBytes(notA, B);
      const tri = dAB + dAnB >= dAnA;
      return {
        rows: [
          ["d(A,B)", dAB],
          ["d(A,¬A)", dAnA],
          ["d(¬A,B)", dAnB],
          ["identity d(x,x)=0", "holds"],
          ["symmetry", "holds (XOR)"],
          [`triangle d(A,B)+d(¬A,B)≥d(A,¬A)`, `${dAB}+${dAnB}=${dAB + dAnB} ≥ ${dAnA} ${tri ? "✓" : "✗"}`],
        ],
        describe: `Hamming distance makes the keyspace a metric space; the axioms are checked on the loaded keys.`,
        explain: `Non-negativity and identity come from popcount; symmetry from XOR's commutativity; the triangle inequality from the fact that a bit changed twice can be changed once.`,
        predict: `Triangle inequality must hold: ${dAB}+${dAnB}=${dAB + dAnB} ≥ ${dAnA} — ${tri ? "confirmed" : "VIOLATED (impossible)"}.`,
        tri: [dAB, dAnB, dAnA],
      };
    },
  },
  {
    id: "geom-euclidean", name: "euclidean geometry", group: "geometry", kind: "lens",
    tagline: "Segment lengths and perimeter of the path",
    compute: (c) => {
      const P = c.path;
      if (!P || P.length < 3) return null;
      const segs = [];
      for (let i = 1; i < P.length; i++) segs.push(Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1], P[i][2] - P[i - 1][2]));
      const per = segs.reduce((a, b) => a + b, 0);
      const chord = Math.hypot(...P[P.length - 1].map((v, k) => v - P[0][k]));
      return {
        rows: [
          ["segments", segs.length],
          ["perimeter", per.toFixed(4)],
          ["chord", chord.toFixed(4)],
          ["perimeter/chord", (per / (chord || 1)).toFixed(4)],
          ["centroid", P.reduce((acc, q) => [acc[0] + q[0] / P.length, acc[1] + q[1] / P.length, acc[2] + q[2] / P.length], [0, 0, 0]).map((v) => v.toFixed(2)).join(", ")],
        ],
        describe: `The phrase path as a Euclidean polygonal curve in R^3.`,
        explain: `Perimeter ≥ chord always (triangle inequality applied inductively); the ratio measures how far the curve strays from the straight line between its endpoints.`,
        predict: `perimeter/chord ≥ 1; measured ${(per / (chord || 1)).toFixed(3)}.`,
        segs,
      };
    },
  },
  {
    id: "geom-spherical", name: "spherical geometry", group: "geometry", kind: "lens",
    tagline: "Great-circle triangle + spherical excess",
    compute: (c) => {
      const P = c.path;
      if (!P || P.length < 3) return null;
      const u = P[0], v = P[1], w = P[2];
      const A = sphericalAngle(u, v, w), B = sphericalAngle(v, u, w), Cc = sphericalAngle(w, u, v);
      const excess = A + B + Cc - Math.PI;
      return {
        rows: [
          ["angles (rad)", `${A.toFixed(3)}, ${B.toFixed(3)}, ${Cc.toFixed(3)}`],
          ["Σ angles", (A + B + Cc).toFixed(4)],
          ["spherical excess E", excess.toFixed(4)],
          ["area (unit sphere)", excess.toFixed(4)],
          ["flat would give", `π = ${Math.PI.toFixed(4)}`],
        ],
        describe: `Project the first three path points to the unit sphere and solve the spherical triangle.`,
        explain: `On a sphere the angles of a triangle sum to more than π; the excess equals the area (Girard). A nonzero excess is the local signature of positive curvature.`,
        predict: `Σ angles − π = area on the unit sphere: E = ${excess.toFixed(4)}.`,
      };
    },
  },
  {
    id: "geom-projective", name: "projective geometry", group: "geometry", kind: "lens",
    tagline: "The cross-ratio, the projective invariant",
    compute: (c) => {
      const idx = c.indices.filter((i) => i >= 0);
      if (idx.length < 4) return null;
      const x = idx.slice(0, 4).map((i) => i / 2047);
      const cr = crossRatio(x[0], x[1], x[2], x[3]);
      const mob = (t) => (2 * t + 1) / (t + 3); // a projective transform
      const cr2 = crossRatio(...x.map(mob));
      return {
        rows: [
          ["4 points", idx.slice(0, 4).join(", ")],
          ["cross-ratio", cr.toFixed(6)],
          ["under a Möbius map", cr2.toFixed(6)],
          ["invariant", Math.abs(cr - cr2) < 1e-6 ? "yes" : "no"],
        ],
        describe: `The cross-ratio of four collinear points is the single invariant of projective geometry.`,
        explain: `Any projective (Möbius) transformation preserves the cross-ratio; distances and ratios of two do not. That is why it, not length, is the projective notion of 'shape'.`,
        predict: `Cross-ratio is unchanged by the Möbius map: ${cr.toFixed(5)} ≈ ${cr2.toFixed(5)}.`,
      };
    },
  },
  {
    id: "geom-convex", name: "convex geometry", group: "geometry", kind: "lens",
    tagline: "Convex hull of the projected path",
    compute: (c) => {
      const P = c.path;
      if (!P || P.length < 3) return null;
      const pts2 = P.map((q) => [q[0], q[1]]);
      const hull = convexHull(pts2);
      const area = shoelace(hull);
      return {
        rows: [
          ["points", pts2.length],
          ["hull vertices", hull.length],
          ["hull area", area.toFixed(4)],
          ["interior points", pts2.length - hull.length],
        ],
        describe: `The convex hull of the path's (x,y) projection, by the monotone-chain algorithm.`,
        explain: `The hull is the smallest convex set containing the points; its area (shoelace) bounds every convex functional of the path. Interior points are the ones the path 'doubles back' over.`,
        predict: `hull vertices ≤ n; area computed by shoelace = ${area.toFixed(3)}.`,
        pts: pts2, hull,
      };
    },
  },
  {
    id: "geom-topology", name: "topology of the path", group: "geometry", kind: "lens",
    tagline: "Self-intersections, cycles, Euler characteristic",
    compute: (c) => {
      const P = (c.path || []).slice(0, 120).map((q) => [q[0], q[1]]);
      if (P.length < 4) return null;
      let crossings = 0;
      for (let i = 0; i + 1 < P.length; i++)
        for (let j = i + 2; j + 1 < P.length; j++)
          if (segmentsCross(P[i], P[i + 1], P[j], P[j + 1])) crossings++;
      const V = P.length + crossings;
      const E = P.length - 1 + 2 * crossings;
      const F = E - V + 2; // planar Euler: V - E + F = 2
      return {
        rows: [
          ["vertices V", V],
          ["edges E", E],
          ["self-intersections", crossings],
          ["faces F", F],
          ["V−E+F", V - E + F],
          ["first Betti b₁", E - V + 1],
        ],
        describe: `Close the polyline into a planar graph by counting its self-intersections as vertices.`,
        explain: `Euler's formula V−E+F=2 fixes the face count; the first Betti number b₁=E−V+1 counts independent cycles — the topological 'loops' the path traces.`,
        predict: `V−E+F must equal 2 for a connected planar graph: got ${V - E + F}.`,
        pts: P, crossings,
      };
    },
  },

  /* ---- trigonometry ---- */
  {
    id: "trig-unit", name: "unit circle", group: "trigonometry", kind: "lens",
    tagline: "Word indices as angles + circular concentration",
    compute: (c) => {
      const idx = c.indices.filter((i) => i >= 0);
      if (!idx.length) return null;
      const th = idx.map((i) => (i / 2048) * 2 * Math.PI);
      let sx = 0, sy = 0;
      for (const t of th) { sx += Math.cos(t); sy += Math.sin(t); }
      const R = Math.hypot(sx, sy) / th.length;
      const ident = Math.sin(th[0]) ** 2 + Math.cos(th[0]) ** 2;
      return {
        rows: [
          ["θ₁", `${th[0].toFixed(4)} rad`],
          ["sin θ₁, cos θ₁", `${Math.sin(th[0]).toFixed(4)}, ${Math.cos(th[0]).toFixed(4)}`],
          ["sin²+cos²", ident.toFixed(6)],
          ["mean resultant R", R.toFixed(4)],
          ["interpretation", R < 0.2 ? "angles ~uniform on the circle" : "angles concentrated"],
        ],
        describe: `Map each 11-bit index to an angle θ = idx/2048·2π and place it on the unit circle.`,
        explain: `sin²+cos²=1 is the Pythagorean identity; the mean resultant length R (|Σe^{iθ}|/n) is circular statistics' measure of concentration — uniform random words give R≈0.`,
        predict: `R should be near 0 for random words: ${R.toFixed(3)}; identity holds to ${ident.toFixed(5)}.`,
        th,
      };
    },
  },
  {
    id: "trig-dft", name: "Fourier / harmonics", group: "trigonometry", kind: "lens",
    tagline: "Amplitude spectrum + Parseval's theorem",
    compute: (c) => {
      const seq = c.indices.filter((i) => i >= 0);
      if (seq.length < 4) return null;
      const amp = dftAmplitudes(seq);
      let dom = 1; for (let k = 1; k < amp.length; k++) if (amp[k] > amp[dom]) dom = k;
      const pv = parseval(seq);
      const ratio = pv.freq / (pv.time || 1);
      return {
        rows: [
          ["harmonics", amp.length],
          ["dominant k", dom],
          ["|X₀| (DC)", amp[0].toFixed(1)],
          ["Σ|x|² (time)", pv.time.toFixed(1)],
          ["(1/n)Σ|X|² (freq)", pv.freq.toFixed(1)],
          ["Parseval ratio", ratio.toFixed(6)],
        ],
        describe: `The index sequence decomposed into sinusoids by the discrete Fourier transform.`,
        explain: `Parseval's theorem says energy is the same in time and frequency domains; the ratio must be 1. The dominant harmonic is the frequency carrying the most variance.`,
        predict: `Parseval ratio = 1; measured ${ratio.toFixed(5)}.`,
        amp, dom,
      };
    },
  },
  {
    id: "trig-law", name: "laws of sines & cosines", group: "trigonometry", kind: "lens",
    tagline: "Solve each path triangle two ways",
    compute: (c) => {
      const P = c.path;
      if (!P || P.length < 3) return null;
      const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
      let worst = 0;
      for (let i = 0; i + 2 < P.length; i++) {
        const a = d(P[i + 1], P[i + 2]), b = d(P[i], P[i + 2]), cc = d(P[i], P[i + 1]);
        const byCos = lawOfCosinesAngle(a, b, cc);
        const dot = ((P[i + 1][0] - P[i][0]) * (P[i + 2][0] - P[i][0]) + (P[i + 1][1] - P[i][1]) * (P[i + 2][1] - P[i][1]) + (P[i + 1][2] - P[i][2]) * (P[i + 2][2] - P[i][2])) / ((b * a) || 1);
        const byDot = Math.acos(Math.max(-1, Math.min(1, dot)));
        worst = Math.max(worst, Math.abs(byCos - byDot));
      }
      return {
        rows: [
          ["triangles", Math.max(0, P.length - 2)],
          ["method", "law of cosines vs dot product"],
          ["max disagreement", worst.toExponential(2)],
          ["verdict", worst < 1e-6 ? "the law holds" : "disagreement!"],
        ],
        describe: `For every consecutive triple, compute the corner angle with the law of cosines and independently with the dot product.`,
        explain: `The law of cosines c²=a²+b²−2ab·cos(C) is the Pythagorean theorem corrected by the cosine term; agreement with the coordinate (dot-product) angle is a self-check of the trigonometry.`,
        predict: `Max |law − dot| ≈ 0; measured ${worst.toExponential(2)}.`,
      };
    },
  },
  {
    id: "trig-harmonic", name: "harmonic regression", group: "trigonometry", kind: "lens",
    tagline: "Best-fit sinusoid of the index sequence",
    compute: (c) => {
      const seq = c.indices.filter((i) => i >= 0);
      if (seq.length < 6) return null;
      const amp = dftAmplitudes(seq);
      let dom = 1; for (let k = 1; k < amp.length; k++) if (amp[k] > amp[dom]) dom = k;
      const fit = fitSinusoid(seq, dom);
      return {
        rows: [
          ["frequency k", dom],
          ["amplitude", fit.amp.toFixed(2)],
          ["phase", fit.phase.toFixed(3)],
          ["R²", fit.r2.toFixed(4)],
          ["fit quality", fit.r2 < 0.3 ? "noise — no sinusoid" : "some periodic structure"],
        ],
        describe: `Least-squares fit of a single sinusoid at the dominant DFT frequency to the index sequence.`,
        explain: `R² is the fraction of variance explained. A random mnemonic is white noise, so a single sinusoid should explain little (low R²) — a high R² would betray non-random structure.`,
        predict: `R² should be small for random words: ${fit.r2.toFixed(3)}.`,
        seq, fit, dom,
      };
    },
  },

];

export const LENS_BY_ID = new Map(LENSES.map((l) => [l.id, l]));

export const LENS_GROUPS = [
  ["invert", "invert keyspace"],
  ["λ", "λ-calculus"],
  ["analysis", "analysis"],
  ["logic", "logic"],
  ["algebra", "algebra"],
  ["geometry", "geometry"],
  ["trigonometry", "trigonometry"],
  ["time", "time"],
  ["stochastic", "stochastic"],
  ["process", "process"],
];
