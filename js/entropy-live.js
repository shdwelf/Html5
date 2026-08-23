/** Live entropy sources: CSPRNG peek, physical rolls, Shannon, hole plates. */

export const SOURCES = {
  dice6: { base: 6, bits: Math.log2(6), label: "d6", digits: "123456", map: (c) => c - 1 },
  dice10: { base: 10, bits: Math.log2(10), label: "d10", digits: "0123456789", map: (c) => c },
  coin: { base: 2, bits: 1, label: "coin", digits: "01", map: (c) => c },
};

export function rollsNeeded(bits, perRoll) {
  return Math.ceil(bits / perRoll);
}

/** Positional base integer → low-order entropy bytes. No hash mix. */
export function rollsToEntropy(values, base, byteLen) {
  let n = 0n;
  const B = BigInt(base);
  for (const v of values) n = n * B + BigInt(v);
  const out = new Uint8Array(byteLen);
  for (let i = byteLen - 1; i >= 0; i--) {
    out[i] = Number(n & 0xffn);
    n >>= 8n;
  }
  return out;
}

export function parseRolls(text, kind) {
  const src = SOURCES[kind];
  const out = [];
  for (const ch of text.replace(/[\s,]+/g, "")) {
    if (!src.digits.includes(ch)) continue;
    out.push(src.map(Number(ch)));
  }
  return out;
}

export function shannonBits(bytes) {
  if (!bytes?.length) return 0;
  const freq = new Array(256).fill(0);
  for (const b of bytes) freq[b]++;
  let h = 0;
  for (const f of freq) {
    if (!f) continue;
    const p = f / bytes.length;
    h -= p * Math.log2(p);
  }
  return h;
}

export function onesRatio(bytes) {
  if (!bytes?.length) return 0;
  let ones = 0;
  for (const b of bytes) {
    let x = b;
    while (x) {
      ones += x & 1;
      x >>= 1;
    }
  }
  return ones / (bytes.length * 8);
}

export function hexDump(bytes, cols = 16) {
  if (!bytes) return "";
  return [...bytes]
    .map((b, i) => b.toString(16).padStart(2, "0") + ((i + 1) % cols === 0 ? "\n" : " "))
    .join("")
    .trim();
}
