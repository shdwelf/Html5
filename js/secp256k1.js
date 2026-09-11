// Minimal secp256k1 for wallet derivation (BigInt affine arithmetic):
// private -> compressed/uncompressed public key, point lift (BIP-340),
// public tweak-add (BIP-86 output key). Cross-checked against
// node:crypto ECDH in tests/11. No signing — derivation only.

export const P = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2Fn;
export const N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141n;
export const G = {
  x: 0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798n,
  y: 0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8n,
};

const mod = (a, m = P) => ((a % m) + m) % m;
const modInv = (a, m = P) => {
  let [t, nt, r, nr] = [0n, 1n, m, mod(a, m)];
  while (nr !== 0n) {
    const q = r / nr;
    [t, nt] = [nt, t - q * nt];
    [r, nr] = [nr, r - q * nr];
  }
  if (r !== 1n) throw new Error("no inverse");
  return mod(t, m);
};

export function pointAdd(p, q) {
  if (!p) return q;
  if (!q) return p;
  if (p.x === q.x) {
    if (mod(p.y + q.y) === 0n) return null; // infinity
    const s = mod((3n * p.x * p.x) * modInv(mod(2n * p.y)));
    const x = mod(s * s - 2n * p.x);
    return { x, y: mod(s * (p.x - x) - p.y) };
  }
  const s = mod((q.y - p.y) * modInv(q.x - p.x));
  const x = mod(s * s - p.x - q.x);
  return { x, y: mod(s * (p.x - x) - p.y) };
}

export function scalarMul(k, point = G) {
  let n = mod(k, N);
  let acc = null;
  let add = point;
  while (n > 0n) {
    if (n & 1n) acc = pointAdd(acc, add);
    add = pointAdd(add, add);
    n >>= 1n;
  }
  return acc;
}

const to32 = (n) => {
  const out = new Uint8Array(32);
  let v = mod(n, 1n << 256n);
  for (let i = 31; i >= 0; i--) {
    out[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return out;
};

export const bytesToBig = (b) => {
  let v = 0n;
  for (const x of b) v = (v << 8n) | BigInt(x);
  return v;
};

export function privToPoint(priv) {
  const k = typeof priv === "bigint" ? priv : bytesToBig(priv);
  if (k <= 0n || k >= N) throw new Error("bad private key");
  return scalarMul(k);
}

export function compress(pt) {
  const out = new Uint8Array(33);
  out[0] = pt.y & 1n ? 0x03 : 0x02;
  out.set(to32(pt.x), 1);
  return out;
}

export function privToPubCompressed(priv) {
  return compress(privToPoint(priv));
}

export function privToPubUncompressed(priv) {
  const pt = privToPoint(priv);
  const out = new Uint8Array(65);
  out[0] = 0x04;
  out.set(to32(pt.x), 1);
  out.set(to32(pt.y), 33);
  return out;
}

/**
 * BIP-340 lift_x: the curve point with even Y for field element x, i.e.
 * y = sqrt(x^3 + 7) (null when x^3 + 7 is not a quadratic residue).
 */
export function liftX(x) {
  const xx = mod(x);
  const y2 = mod(xx * xx * xx + 7n);
  const y = modPow(y2, (P + 1n) / 4n);
  if (mod(y * y) !== y2) return null;
  return { x: xx, y: y & 1n ? P - y : y };
}

function modPow(base, exp) {
  let b = mod(base), e = exp, r = 1n;
  while (e > 0n) {
    if (e & 1n) r = mod(r * b);
    b = mod(b * b);
    e >>= 1n;
  }
  return r;
}

/** Parse a 33-byte compressed public key. */
export function parseCompressed(pub) {
  if (pub.length !== 33 || (pub[0] !== 0x02 && pub[0] !== 0x03))
    throw new Error("bad compressed key");
  const x = bytesToBig(pub.subarray(1));
  if (x >= P) throw new Error("x out of range");
  const pt = liftX(x);
  if (!pt) throw new Error("no lift");
  const odd = pub[0] === 0x03;
  return { x: pt.x, y: odd ? (pt.y & 1n ? pt.y : P - pt.y) : (pt.y & 1n ? P - pt.y : pt.y) };
}

/**
 * BIP-86 P2TR output key. Takes the 33-byte COMPRESSED internal key (not
 * x-only): when P has odd Y the tweak is negated first, i.e. the function
 * computes x(P + t*G) via lift(x) + t'*G with t' = odd(P) ? N - t : t.
 */
export function taprootOutputKey(internalCompressed33, tweakHash32) {
  if (internalCompressed33.length !== 33)
    throw new Error("taproot needs the 33-byte compressed internal key");
  const p = parseCompressed(internalCompressed33);
  const even = liftX(p.x);
  if (!even) throw new Error("bad internal key");
  let t = bytesToBig(tweakHash32);
  if (t >= N) throw new Error("tweak out of range");
  if (p.y & 1n) t = mod(N - t, N);
  const q = pointAdd(even, scalarMul(t));
  if (!q) throw new Error("tweak gives infinity");
  return to32(q.x);
}
