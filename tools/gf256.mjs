/**
 * Galois Field GF(2^8) arithmetic module with AES irreducible polynomial:
 * p(x) = x^8 + x^4 + x^3 + x + 1 (0x11d)
 *
 * Precomputes exponential and logarithm lookup tables for O(1) multiplication,
 * division, and inversion, enabling Gaussian elimination for Reed-Solomon / Raptor precode decoding.
 */

export const GF_EXP = new Uint8Array(512);
export const GF_LOG = new Uint8Array(256);

(function initGF256() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) {
      x ^= 0x11d; // 285 decimal = 0x11d
    }
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255];
  }
})();

export function gfAdd(a, b) {
  return a ^ b;
}

export function gfSub(a, b) {
  return a ^ b;
}

export function gfMulFast(a, b) {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

export function gfInv(a) {
  if (a === 0) throw new Error("Division by zero in GF(2^8)");
  return GF_EXP[255 - GF_LOG[a]];
}

export function gfDiv(a, b) {
  if (b === 0) throw new Error("Division by zero in GF(2^8)");
  if (a === 0) return 0;
  return GF_EXP[(GF_LOG[a] + 255 - GF_LOG[b]) % 255];
}
