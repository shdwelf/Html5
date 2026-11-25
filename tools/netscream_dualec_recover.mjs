// FBCTF 2019 "netscream" — Dual EC DRBG state recovery from the organizer-published
// sample, reproduced OFF the kitchen with @noble/curves (devDependency) and node:crypto.
//
// Inputs (all hash-pinned in docs/ctftime-facebook-2019-software-crypto-2026-11-13.md):
//   enc  — dist/enc; its first 32 bytes are the IV = consecutive Dual EC output
//   d    — dist/d, the published backdoor scalar with d·Q = G
//   Q    — the generator Q hard-coded in src/dualec.c
//   key  — the organizer's debug key (the expected answer, used only to label the result)
//
// Source semantics (src/dualec.c): out = x(s·Q) with BN_mask_bits(x, 240) => the LOW 240
// bits become 30 output bytes; the next call contributes 2 more bytes. So IV[0:30] is the
// low 240 bits of r1 = x(s1·Q) and the unknown is the HIGH 16 bits. For each of the 65,536
// completions that lifts to a curve point A = ±s1·Q, d·A has x-coordinate x(s1·G) = s2.
// Checking IV[30:32] against the top of x(s2·Q) leaves one state; two more steps give the key.
//
// Usage: node tools/netscream_dualec_recover.mjs [--readme-variant] [--limit N]
import { p256 } from "@noble/curves/nist.js";

export const PUBLISHED = {
  encHex: "e5cca6d1c93c1160d732fbfb339804e9d9104968da5e087b34ac6061f56a9704539f026ed4b9027c82ecdb764e6f2ef85a4a43dcd1d4bca1e8fc438e8edb094e",
  keyHex: "38475fb0a7ac9bb193d112e63b2f0b90ebd4509f366671a64bd13bb494a0bc42",
  qx: "f6c4f766b3c61f09e609582224cc8ebccf4cd4961ef780cc02e8f09a0efa7ca5",
  qy: "f212c5768d46716c6cac4d23ff12e8ae89fd9eeec83a0e83e35db3aade0ccb5b",
  d: "6FC45453894DE99C661581B0A12087B862667B785AABA7116DCDCB3CB3A79AFE",
  // the state the search finds (pinned so a regression is visible without a full run)
  recoveredState: "6df2c0e509107c6ca9499b0c9229ab94362e2c302d70bfb109fb2f16ee92e3a3",
  recoveredGuess: 5245,
};

const Point = p256.Point;
const Fp = Point.Fp;
const MASK240 = (1n << 240n) - 1n;
const hex30 = v => v.toString(16).padStart(60, "0");
const xOf = pt => pt.toAffine().x;

export function setup({ qx = PUBLISHED.qx, qy = PUBLISHED.qy, d = PUBLISHED.d } = {}) {
  const Q = Point.fromAffine({ x: BigInt("0x" + qx), y: BigInt("0x" + qy) });
  Q.assertValidity();
  const G = Point.BASE;
  const D = BigInt("0x" + d);
  const dQ = Q.multiply(D).toAffine();
  const g = G.toAffine();
  return { Q, G, D, dQEqualsG: dQ.x === g.x && dQ.y === g.y };
}

/** One Dual EC step as src/dualec.c performs it: s' = x(s·G); out = x(s'·Q) & (2^240-1). */
export function dualEcStep({ G, Q }, s) {
  const s2 = xOf(G.multiply(s));
  return { s: s2, out: xOf(Q.multiply(s2)) & MASK240 };
}

/** Derive the 32-byte key screamos derives after the state s2 (30 bytes of r2, top 2 of r3). */
export function keyFromState(ctx, s2) {
  const a = dualEcStep(ctx, s2);
  const b = dualEcStep(ctx, a.s);
  return hex30(a.out) + hex30(b.out).slice(0, 4);
}

function lift(x) {
  if (x >= Fp.ORDER) return null;
  const b = (p256.CURVE && p256.CURVE.b) || Point.CURVE().b;
  const rhs = Fp.add(Fp.sub(Fp.mul(Fp.mul(x, x), x), Fp.mul(3n, x)), b);
  let y;
  try { y = Fp.sqrt(rhs); } catch { return null; }
  if (Fp.mul(y, y) !== rhs) return null;
  return Point.fromAffine({ x, y });
}

/**
 * Test one 16-bit completion of IV[0:30]. Returns null when the candidate x is not on
 * the curve or the derived next output disagrees with IV[30:32]; otherwise the state and key.
 */
export function tryGuess(ctx, ivHex, guess, { readmeVariant = false } = {}) {
  const iv = Buffer.from(ivHex, "hex").subarray(0, 32);
  const t0 = BigInt("0x" + iv.subarray(0, 30).toString("hex"));
  const tail = iv.subarray(30, 32).toString("hex");
  const x = readmeVariant ? (t0 << 16n) | BigInt(guess) : (BigInt(guess) << 240n) | t0;
  const A = lift(x);
  if (!A) return null;
  const s2 = xOf(A.multiply(ctx.D));
  const r1 = xOf(ctx.Q.multiply(s2)) & MASK240;
  if (hex30(r1).slice(0, 4) !== tail) return null;
  return { guess, state: s2.toString(16).padStart(64, "0"), keyHex: keyFromState(ctx, s2) };
}

export function recover(ctx, ivHex, { readmeVariant = false, limit = 65536, start = 0 } = {}) {
  const matches = [];
  for (let g = start; g < start + limit; g++) {
    const m = tryGuess(ctx, ivHex, g, { readmeVariant });
    if (m) matches.push(m);
  }
  return matches;
}

const isMain = process.argv[1] && new URL(import.meta.url).pathname === new URL(`file://${process.argv[1]}`).pathname;
if (isMain) {
  const args = process.argv.slice(2);
  const readmeVariant = args.includes("--readme-variant");
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx >= 0 ? Number(args[limitIdx + 1]) : 65536;
  const ctx = setup();
  const started = Date.now();
  const matches = recover(ctx, PUBLISHED.encHex, { readmeVariant, limit });
  console.log(JSON.stringify({
    dQEqualsG: ctx.dQEqualsG,
    variant: readmeVariant ? "README msb30 (unknown low 16 bits)" : "source BN_mask_bits (unknown high 16 bits)",
    candidates: limit,
    seconds: (Date.now() - started) / 1000,
    matches: matches.map(m => ({ ...m, matchesPublishedKey: m.keyHex === PUBLISHED.keyHex })),
  }, null, 2));
}
