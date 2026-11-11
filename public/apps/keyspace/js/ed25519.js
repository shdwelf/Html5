// Minimal ed25519 for SLIP-0010 wallet derivation: scalar-mult-base and
// point encoding (public key from seed). RFC 8032, extended coordinates,
// BigInt field arithmetic. Cross-checked against node:crypto in tests/11.

import { sha512 } from "./hash.js";

const P = (1n << 255n) - 19n;
const D = (() => {
  const inv = (a) => {
    let [t, nt, r, nr] = [0n, 1n, P, ((a % P) + P) % P];
    while (nr !== 0n) {
      const q = r / nr;
      [t, nt] = [nt, t - q * nt];
      [r, nr] = [nr, r - q * nr];
    }
    return ((t % P) + P) % P;
  };
  return ((-121665n * inv(121666n)) % P + P) % P;
})();
const D2 = (2n * D) % P;
const SQRT_M1 = (() => {
  let b = 2n, e = (P - 1n) / 4n, r = 1n;
  while (e > 0n) {
    if (e & 1n) r = (r * b) % P;
    b = (b * b) % P;
    e >>= 1n;
  }
  return r;
})();

const mod = (a) => ((a % P) + P) % P;

function xRecover(y) {
  const xx = mod((y * y - 1n) * modInv(mod(D * y * y + 1n)));
  let x = modPow(xx, (P + 3n) / 8n);
  if (mod(x * x - xx) !== 0n) x = mod(x * SQRT_M1);
  if (x & 1n) x = P - x;
  return x;
}

function modInv(a) {
  let [t, nt, r, nr] = [0n, 1n, P, mod(a)];
  while (nr !== 0n) {
    const q = r / nr;
    [t, nt] = [nt, t - q * nt];
    [r, nr] = [nr, r - q * nr];
  }
  if (r !== 1n) throw new Error("no inverse");
  return mod(t);
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

function pointAdd(p, q) {
  const [x1, y1, z1, t1] = p, [x2, y2, z2, t2] = q;
  const a = mod((y1 - x1) * (y2 - x2));
  const b = mod((y1 + x1) * (y2 + x2));
  const c = mod(t1 * D2 * t2);
  const d = mod(z1 * 2n * z2);
  const e = mod(b - a), f = mod(d - c), g = mod(d + c), h = mod(b + a);
  return [mod(e * f), mod(g * h), mod(f * g), mod(e * h)];
}

function pointDouble(p) {
  const [x1, y1, z1] = p;
  const a = mod(x1 * x1), b = mod(y1 * y1), c = mod(2n * z1 * z1);
  const d = mod(-a);
  const e = mod((x1 + y1) * (x1 + y1) - a - b);
  const g = mod(d + b), f = mod(g - c), h = mod(d - b);
  return [mod(e * f), mod(g * h), mod(f * g), mod(e * h)];
}

const IDENT = [0n, 1n, 1n, 0n];
const BASE = (() => {
  // compressed base point 0x58 + 0x66*31: y LE, x even
  let y = 0n;
  const raw = [0x58, ...new Array(31).fill(0x66)];
  raw.forEach((v, i) => { y |= BigInt(v) << BigInt(8 * i); });
  const x = xRecover(y);
  return [x, y, 1n, mod(x * y)];
})();

export function scalarMultBase(scalar) {
  let s = 0n;
  for (let i = 0; i < scalar.length; i++) s |= BigInt(scalar[i]) << BigInt(8 * i);
  let acc = IDENT;
  let add = BASE;
  while (s > 0n) {
    if (s & 1n) acc = pointAdd(acc, add);
    add = pointDouble(add);
    s >>= 1n;
  }
  return acc;
}

export function pointEncode(p) {
  const [x, y, z] = p;
  const zi = modInv(z);
  const xx = mod(x * zi), yy = mod(y * zi);
  const bits = yy | ((xx & 1n) << 255n);
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i++) out[i] = Number((bits >> BigInt(8 * i)) & 0xffn);
  return out;
}

function clamp(s32) {
  const s = s32.slice();
  s[0] &= 248;
  s[31] &= 127;
  s[31] |= 64;
  return s;
}

/** RFC 8032 public key for a 32-byte seed (sha512, clamp, mult, encode). */
export function pubFromSeed(seed32) {
  if (seed32.length !== 32) throw new Error("seed must be 32 bytes");
  const h = sha512(seed32);
  return pointEncode(scalarMultBase(clamp(h.subarray(0, 32))));
}
