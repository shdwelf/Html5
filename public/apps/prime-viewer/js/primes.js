// Prime-number engine shared by Prime Viewer and its tests.
// Exact integer arithmetic for the viewer's supported range (2..250,000).

export function sieve(limit) {
  const n = Math.max(1, Math.floor(Number(limit) || 0));
  const composite = new Uint8Array(n + 1);
  const primes = [];
  for (let p = 2; p <= n; p++) {
    if (composite[p]) continue;
    primes.push(p);
    if (p * p <= n) for (let k = p * p; k <= n; k += p) composite[k] = 1;
  }
  return { limit: n, primes, composite };
}

export function isPrime(n) {
  n = Math.floor(Number(n));
  if (n < 2 || !Number.isFinite(n)) return false;
  if (n % 2 === 0) return n === 2;
  if (n % 3 === 0) return n === 3;
  for (let d = 5; d * d <= n; d += 6) if (n % d === 0 || n % (d + 2) === 0) return false;
  return true;
}

export function factorize(n) {
  n = Math.abs(Math.floor(Number(n)));
  if (n < 2) return [];
  const out = [];
  for (let d = 2; d * d <= n; d += d === 2 ? 1 : 2) {
    if (n % d) continue;
    let exponent = 0;
    while (n % d === 0) { n /= d; exponent++; }
    out.push([d, exponent]);
  }
  if (n > 1) out.push([n, 1]);
  return out;
}

/** Integer n -> Cartesian coordinate on the square Ulam spiral (1 at 0,0). */
export function ulamCoordinate(n) {
  n = Math.max(1, Math.floor(n));
  if (n === 1) return [0, 0];
  const k = Math.ceil((Math.sqrt(n) - 1) / 2);
  const side = 2 * k;
  const max = (2 * k + 1) ** 2;
  let d = max - n;
  if (d < side) return [k - d, -k];
  d -= side;
  if (d < side) return [-k, -k + d];
  d -= side;
  if (d < side) return [-k + d, k];
  d -= side;
  return [k, k - d];
}

export function primeConstellations(primes, primeSet = new Set(primes)) {
  const twins = [], cousins = [], sexy = [], triplets = [];
  for (const p of primes) {
    if (primeSet.has(p + 2)) twins.push([p, p + 2]);
    if (primeSet.has(p + 4)) cousins.push([p, p + 4]);
    if (primeSet.has(p + 6)) sexy.push([p, p + 6]);
    if (primeSet.has(p + 2) && primeSet.has(p + 6)) triplets.push([p, p + 2, p + 6]);
    if (primeSet.has(p + 4) && primeSet.has(p + 6)) triplets.push([p, p + 4, p + 6]);
  }
  return { twins, cousins, sexy, triplets };
}

export function primeStatistics(primes, limit) {
  const count = primes.length;
  const gaps = [];
  let maxGap = 0, maxGapAfter = 0;
  for (let i = 1; i < count; i++) {
    const gap = primes[i] - primes[i - 1];
    gaps.push(gap);
    if (gap > maxGap) { maxGap = gap; maxGapAfter = primes[i - 1]; }
  }
  const meanGap = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;
  const variance = gaps.length ? gaps.reduce((sum, gap) => sum + (gap - meanGap) ** 2, 0) / gaps.length : 0;
  const estimate = limit > 1 ? limit / Math.log(limit) : 0;
  const residues30 = new Map([1, 7, 11, 13, 17, 19, 23, 29].map((r) => [r, 0]));
  for (const p of primes) if (p > 5 && residues30.has(p % 30)) residues30.set(p % 30, residues30.get(p % 30) + 1);
  const constellations = primeConstellations(primes);
  return {
    count,
    density: limit ? count / limit : 0,
    estimate,
    estimateError: count ? (estimate - count) / count : 0,
    maxGap,
    maxGapAfter,
    meanGap,
    gapStdDev: Math.sqrt(variance),
    gaps,
    residues30,
    ...constellations,
  };
}

export function formatFactorization(n) {
  const factors = factorize(n);
  if (!factors.length) return String(n);
  return factors.map(([p, e]) => e === 1 ? String(p) : `${p}^${e}`).join(" × ");
}
