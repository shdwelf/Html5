// Descriptive statistics for a single entropy sample.
// These measurements describe the loaded bytes; they are not a randomness
// certification. BIP-39 samples (16–32 bytes) are far too short for most
// asymptotic test suites, so callers must present p-values with that caveat.

export function bitsFromBytes(bytes) {
  const bits = [];
  for (const byte of bytes || []) {
    for (let bit = 7; bit >= 0; bit--) bits.push((byte >> bit) & 1);
  }
  return bits;
}

// Numerical Recipes approximation, maximum error about 1.5e-7.
export function erfc(x) {
  const z = Math.abs(x);
  const t = 1 / (1 + z / 2);
  const r = t * Math.exp(-z * z - 1.26551223 +
    t * (1.00002368 + t * (0.37409196 + t * (0.09678418 +
    t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 +
    t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
  return x >= 0 ? r : 2 - r;
}

export function pearson(a, b) {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;
  let ax = 0, bx = 0;
  for (let i = 0; i < n; i++) { ax += a[i]; bx += b[i]; }
  ax /= n; bx /= n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    const x = a[i] - ax, y = b[i] - bx;
    num += x * y; da += x * x; db += y * y;
  }
  return da && db ? num / Math.sqrt(da * db) : 0;
}

export function autocorrelations(bits, maxLag = 32) {
  const out = [];
  for (let lag = 1; lag <= Math.min(maxLag, bits.length - 2); lag++) {
    out.push({ lag, correlation: pearson(bits.slice(0, -lag), bits.slice(lag)) });
  }
  return out;
}

export function entropyStatistics(bytes, indices = []) {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
  const bits = bitsFromBytes(data);
  const n = bits.length;
  const ones = bits.reduce((sum, bit) => sum + bit, 0);
  const zeros = n - ones;
  const balance = n ? ones / n : 0;
  const monobitZ = n ? (ones - zeros) / Math.sqrt(n) : 0;
  const monobitP = n ? erfc(Math.abs(monobitZ) / Math.SQRT2) : 0;

  let runs = n ? 1 : 0, longestRun = n ? 1 : 0, currentRun = n ? 1 : 0;
  for (let i = 1; i < n; i++) {
    if (bits[i] === bits[i - 1]) {
      currentRun++;
      longestRun = Math.max(longestRun, currentRun);
    } else {
      runs++;
      currentRun = 1;
    }
  }
  const expectedRuns = n ? 1 + 2 * (n - 1) * balance * (1 - balance) : 0;
  const nistRunsCenter = 2 * n * balance * (1 - balance);
  const runsApplicable = n > 0 && Math.abs(balance - 0.5) < 2 / Math.sqrt(n);
  const runsP = runsApplicable && balance > 0 && balance < 1
    ? erfc(Math.abs(runs - nistRunsCenter) / (2 * Math.sqrt(2 * n) * balance * (1 - balance)))
    : null;

  const byteHistogram = Array(256).fill(0);
  const nibbleHistogram = Array(16).fill(0);
  for (const byte of data) {
    byteHistogram[byte]++;
    nibbleHistogram[byte >> 4]++;
    nibbleHistogram[byte & 15]++;
  }
  let byteEntropy = 0, maxByteCount = 0, uniqueBytes = 0;
  for (const count of byteHistogram) {
    if (!count) continue;
    uniqueBytes++;
    maxByteCount = Math.max(maxByteCount, count);
    const p = count / Math.max(1, data.length);
    byteEntropy -= p * Math.log2(p);
  }
  const minEntropy = data.length ? -Math.log2(maxByteCount / data.length) : 0;
  const nibbleN = data.length * 2;
  const nibbleExpected = nibbleN / 16;
  const nibbleChiSquare = nibbleExpected
    ? nibbleHistogram.reduce((sum, count) => sum + ((count - nibbleExpected) ** 2) / nibbleExpected, 0)
    : 0;

  const wordMean = indices.length ? indices.reduce((a, b) => a + b, 0) / indices.length : 0;
  const wordVariance = indices.length
    ? indices.reduce((sum, value) => sum + (value - wordMean) ** 2, 0) / indices.length
    : 0;

  return {
    bits, bitCount: n, ones, zeros, balance, monobitZ, monobitP,
    runs, expectedRuns, runsApplicable, runsP, longestRun,
    byteHistogram, nibbleHistogram, uniqueBytes, byteEntropy, minEntropy,
    nibbleChiSquare,
    autocorrelation: autocorrelations(bits),
    wordMean, wordStdDev: Math.sqrt(wordVariance),
    uniqueWords: new Set(indices).size,
    wordLag1: pearson(indices.slice(0, -1), indices.slice(1)),
    sampleWarning: n < 1000,
  };
}
