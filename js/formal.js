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
];

export const LENS_BY_ID = new Map(LENSES.map((l) => [l.id, l]));

export const LENS_GROUPS = [
  ["invert", "invert keyspace"],
  ["λ", "λ-calculus"],
  ["analysis", "analysis"],
  ["logic", "logic"],
  ["algebra", "algebra"],
  ["time", "time"],
  ["stochastic", "stochastic"],
  ["process", "process"],
];
