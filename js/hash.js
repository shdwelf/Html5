// Zero-dependency hashes for the wallet stack: SHA-256, SHA-512,
// HMAC-SHA-512, PBKDF2-HMAC-SHA-512, RIPEMD-160, Keccak-256,
// and the BIP-340 tagged hash. All functions take Uint8Array and
// return Uint8Array. Verified against node:crypto in tests/11.

const u8 = (n) => new Uint8Array(n);

function rotr32(x, n) { return ((x >>> n) | (x << (32 - n))) >>> 0; }

// ---------------------------------------------------------------- SHA-256

const K256 = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
  0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
  0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
  0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
  0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
  0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

export function sha256(msg) {
  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
  const bitLen = msg.length * 8;
  const withOne = msg.length + 1;
  const padLen = (withOne % 64 <= 56 ? 56 - (withOne % 64) : 120 - (withOne % 64));
  const total = withOne + padLen + 8;
  const buf = u8(total);
  buf.set(msg, 0);
  buf[msg.length] = 0x80;
  const dv = new DataView(buf.buffer);
  // high 32 bits of bit length are zero for any input we hash (< 512 MB)
  dv.setUint32(total - 8, Math.floor(bitLen / 0x100000000) >>> 0, false);
  dv.setUint32(total - 4, bitLen >>> 0, false);
  const w = new Uint32Array(64);
  for (let off = 0; off < total; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4, false);
    for (let i = 16; i < 64; i++) {
      const s0 = (rotr32(w[i - 15], 7) ^ rotr32(w[i - 15], 18) ^ (w[i - 15] >>> 3)) >>> 0;
      const s1 = (rotr32(w[i - 2], 17) ^ rotr32(w[i - 2], 19) ^ (w[i - 2] >>> 10)) >>> 0;
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, h] = [h0, h1, h2, h3, h4, h5, h6, h7];
    for (let i = 0; i < 64; i++) {
      const S1 = (rotr32(e, 6) ^ rotr32(e, 11) ^ rotr32(e, 25)) >>> 0;
      const ch = ((e & f) ^ (~e & g)) >>> 0;
      const t1 = (h + S1 + ch + K256[i] + w[i]) >>> 0;
      const S0 = (rotr32(a, 2) ^ rotr32(a, 13) ^ rotr32(a, 22)) >>> 0;
      const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
      const t2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0;
      d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
  }
  const out = u8(32);
  new DataView(out.buffer).setUint32(0, h0, false);
  const od = new DataView(out.buffer);
  od.setUint32(0, h0, false); od.setUint32(4, h1, false);
  od.setUint32(8, h2, false); od.setUint32(12, h3, false);
  od.setUint32(16, h4, false); od.setUint32(20, h5, false);
  od.setUint32(24, h6, false); od.setUint32(28, h7, false);
  return out;
}

// ---------------------------------------------------------------- SHA-512
// BigInt words: simpler than hi/lo pairs and fast enough for key derivation.

const K512 = [
  0x428a2f98d728ae22n, 0x7137449123ef65cdn, 0xb5c0fbcfec4d3b2fn,
  0xe9b5dba58189dbbcn, 0x3956c25bf348b538n, 0x59f111f1b605d019n,
  0x923f82a4af194f9bn, 0xab1c5ed5da6d8118n, 0xd807aa98a3030242n,
  0x12835b0145706fben, 0x243185be4ee4b28cn, 0x550c7dc3d5ffb4e2n,
  0x72be5d74f27b896fn, 0x80deb1fe3b1696b1n, 0x9bdc06a725c71235n,
  0xc19bf174cf692694n, 0xe49b69c19ef14ad2n, 0xefbe4786384f25e3n,
  0x0fc19dc68b8cd5b5n, 0x240ca1cc77ac9c65n, 0x2de92c6f592b0275n,
  0x4a7484aa6ea6e483n, 0x5cb0a9dcbd41fbd4n, 0x76f988da831153b5n,
  0x983e5152ee66dfabn, 0xa831c66d2db43210n, 0xb00327c898fb213fn,
  0xbf597fc7beef0ee4n, 0xc6e00bf33da88fc2n, 0xd5a79147930aa725n,
  0x06ca6351e003826fn, 0x142929670a0e6e70n, 0x27b70a8546d22ffcn,
  0x2e1b21385c26c926n, 0x4d2c6dfc5ac42aedn, 0x53380d139d95b3dfn,
  0x650a73548baf63den, 0x766a0abb3c77b2a8n, 0x81c2c92e47edaee6n,
  0x92722c851482353bn, 0xa2bfe8a14cf10364n, 0xa81a664bbc423001n,
  0xc24b8b70d0f89791n, 0xc76c51a30654be30n, 0xd192e819d6ef5218n,
  0xd69906245565a910n, 0xf40e35855771202an, 0x106aa07032bbd1b8n,
  0x19a4c116b8d2d0c8n, 0x1e376c085141ab53n, 0x2748774cdf8eeb99n,
  0x34b0bcb5e19b48a8n, 0x391c0cb3c5c95a63n, 0x4ed8aa4ae3418acbn,
  0x5b9cca4f7763e373n, 0x682e6ff3d6b2b8a3n, 0x748f82ee5defb2fcn,
  0x78a5636f43172f60n, 0x84c87814a1f0ab72n, 0x8cc702081a6439ecn,
  0x90befffa23631e28n, 0xa4506cebde82bde9n, 0xbef9a3f7b2c67915n,
  0xc67178f2e372532bn, 0xca273eceea26619cn, 0xd186b8c721c0c207n,
  0xeada7dd6cde0eb1en, 0xf57d4f7fee6ed178n, 0x06f067aa72176fban,
  0x0a637dc5a2c898a6n, 0x113f9804bef90daen, 0x1b710b35131c471bn,
  0x28db77f523047d84n, 0x32caab7b40c72493n, 0x3c9ebe0a15c9bebcn,
  0x431d67c49c100d4cn, 0x4cc5d4becb3e42b6n, 0x597f299cfc657e2an,
  0x5fcb6fab3ad6faecn, 0x6c44198c4a475817n,
];

const M64 = (1n << 64n) - 1n;
function rotr64(x, n) {
  n = BigInt(n);
  return ((x >> n) | (x << (64n - n))) & M64;
}

export function sha512(msg) {
  let h = [
    0x6a09e667f3bcc908n, 0xbb67ae8584caa73bn, 0x3c6ef372fe94f82bn,
    0xa54ff53a5f1d36f1n, 0x510e527fade682d1n, 0x9b05688c2b3e6c1fn,
    0x1f83d9abfb41bd6bn, 0x5be0cd19137e2179n,
  ];
  const bitLen = BigInt(msg.length) * 8n;
  const withOne = msg.length + 1;
  const padLen = withOne % 128 <= 112 ? 112 - (withOne % 128) : 240 - (withOne % 128);
  const total = withOne + padLen + 16;
  const buf = u8(total);
  buf.set(msg, 0);
  buf[msg.length] = 0x80;
  const dv = new DataView(buf.buffer);
  dv.setUint32(total - 16, Number((bitLen >> 96n) & 0xffffffffn), false);
  dv.setUint32(total - 12, Number((bitLen >> 64n) & 0xffffffffn), false);
  dv.setUint32(total - 8, Number((bitLen >> 32n) & 0xffffffffn), false);
  dv.setUint32(total - 4, Number(bitLen & 0xffffffffn), false);
  const w = new Array(80);
  const get64 = (off) => (BigInt(dv.getUint32(off, false)) << 32n) | BigInt(dv.getUint32(off + 4, false));
  for (let off = 0; off < total; off += 128) {
    for (let i = 0; i < 16; i++) w[i] = get64(off + i * 8);
    for (let i = 16; i < 80; i++) {
      const s0 = rotr64(w[i - 15], 1) ^ rotr64(w[i - 15], 8) ^ (w[i - 15] >> 7n);
      const s1 = rotr64(w[i - 2], 19) ^ rotr64(w[i - 2], 61) ^ (w[i - 2] >> 6n);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) & M64;
    }
    let [a, b, c, d, e, f, g, hh] = h;
    for (let i = 0; i < 80; i++) {
      const S1 = rotr64(e, 14) ^ rotr64(e, 18) ^ rotr64(e, 41);
      const ch = (e & f) ^ (~e & g);
      const t1 = (hh + S1 + ch + K512[i] + w[i]) & M64;
      const S0 = rotr64(a, 28) ^ rotr64(a, 34) ^ rotr64(a, 39);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) & M64;
      hh = g; g = f; f = e; e = (d + t1) & M64;
      d = c; c = b; b = a; a = (t1 + t2) & M64;
    }
    h = [
      (h[0] + a) & M64, (h[1] + b) & M64, (h[2] + c) & M64, (h[3] + d) & M64,
      (h[4] + e) & M64, (h[5] + f) & M64, (h[6] + g) & M64, (h[7] + hh) & M64,
    ];
  }
  const out = u8(64);
  const od = new DataView(out.buffer);
  for (let i = 0; i < 8; i++) {
    od.setUint32(i * 8, Number((h[i] >> 32n) & 0xffffffffn), false);
    od.setUint32(i * 8 + 4, Number(h[i] & 0xffffffffn), false);
  }
  return out;
}

// ------------------------------------------------------- HMAC-SHA-512/PBKDF2

export function hmacSha512(key, msg) {
  let k = key;
  if (k.length > 128) k = sha512(k);
  const kb = u8(128);
  kb.set(k, 0);
  const ipad = u8(128), opad = u8(128);
  for (let i = 0; i < 128; i++) {
    ipad[i] = kb[i] ^ 0x36;
    opad[i] = kb[i] ^ 0x5c;
  }
  const inner = u8(128 + msg.length);
  inner.set(ipad, 0);
  inner.set(msg, 128);
  const outer = u8(128 + 64);
  outer.set(opad, 0);
  outer.set(sha512(inner), 128);
  return sha512(outer);
}

export function pbkdf2HmacSha512(password, salt, rounds, dkLen) {
  const hLen = 64;
  const blocks = Math.ceil(dkLen / hLen);
  const out = u8(blocks * hLen);
  const saltBlock = u8(salt.length + 4);
  saltBlock.set(salt, 0);
  const dv = new DataView(saltBlock.buffer);
  for (let b = 1; b <= blocks; b++) {
    dv.setUint32(salt.length, b, false);
    let u = hmacSha512(password, saltBlock);
    const t = u.slice();
    for (let r = 1; r < rounds; r++) {
      u = hmacSha512(password, u);
      for (let i = 0; i < hLen; i++) t[i] ^= u[i];
    }
    out.set(t, (b - 1) * hLen);
  }
  return out.slice(0, dkLen);
}

// ------------------------------------------------------------- RIPEMD-160

function rotl32(x, n) { return ((x << n) | (x >>> (32 - n))) >>> 0; }

export function ripemd160(msg) {
  const bitLen = msg.length * 8;
  const withOne = msg.length + 1;
  const padLen = withOne % 64 <= 56 ? 56 - (withOne % 64) : 120 - (withOne % 64);
  const total = withOne + padLen + 8;
  const buf = u8(total);
  buf.set(msg, 0);
  buf[msg.length] = 0x80;
  const dv = new DataView(buf.buffer);
  dv.setUint32(total - 8, bitLen >>> 0, true);
  dv.setUint32(total - 4, Math.floor(bitLen / 0x100000000) >>> 0, true);
  const KL = [0x00000000, 0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xa953fd4e];
  const KR = [0x50a28be6, 0x5c4dd124, 0x6d703ef3, 0x7a6d76e9, 0x00000000];
  const RL = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8,
    3, 10, 14, 4, 9, 15, 8, 1, 2, 7, 0, 6, 13, 11, 5, 12,
    1, 9, 11, 10, 0, 8, 12, 4, 13, 3, 7, 15, 14, 5, 6, 2,
    4, 0, 5, 9, 7, 12, 2, 10, 14, 1, 3, 8, 11, 6, 15, 13,
  ];
  const RR = [
    5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12,
    6, 11, 3, 7, 0, 13, 5, 10, 14, 15, 8, 12, 4, 9, 1, 2,
    15, 5, 1, 3, 7, 14, 6, 9, 11, 8, 12, 2, 10, 0, 4, 13,
    8, 6, 4, 1, 3, 11, 15, 0, 5, 12, 2, 13, 9, 7, 10, 14,
    12, 15, 10, 4, 1, 5, 8, 7, 6, 2, 13, 14, 0, 3, 9, 11,
  ];
  const SL = [
    11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8,
    7, 6, 8, 13, 11, 9, 7, 15, 7, 12, 15, 9, 11, 7, 13, 12,
    11, 13, 6, 7, 14, 9, 13, 15, 14, 8, 13, 6, 5, 12, 7, 5,
    11, 12, 14, 15, 14, 15, 9, 8, 9, 14, 5, 6, 8, 6, 5, 12,
    9, 15, 5, 11, 6, 8, 13, 12, 5, 12, 13, 14, 11, 8, 5, 6,
  ];
  const SR = [
    8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6,
    9, 13, 15, 7, 12, 8, 9, 11, 7, 7, 12, 7, 6, 15, 13, 11,
    9, 7, 15, 11, 8, 6, 6, 14, 12, 13, 5, 14, 13, 13, 7, 5,
    15, 5, 8, 11, 14, 14, 6, 14, 6, 9, 12, 9, 12, 5, 15, 8,
    8, 5, 12, 9, 12, 5, 14, 6, 8, 13, 6, 5, 15, 13, 11, 11,
  ];
  const fl = [
    (x, y, z) => (x ^ y ^ z) >>> 0,
    (x, y, z) => ((x & y) | (~x & z)) >>> 0,
    (x, y, z) => ((x | ~y) ^ z) >>> 0,
    (x, y, z) => ((x & z) | (y & ~z)) >>> 0,
    (x, y, z) => (x ^ (y | ~z)) >>> 0,
  ];
  let h0 = 0x67452301, h1 = 0xefcdab89, h2 = 0x98badcfe,
      h3 = 0x10325476, h4 = 0xc3d2e1f0;
  const X = new Uint32Array(16);
  for (let off = 0; off < total; off += 64) {
    for (let i = 0; i < 16; i++) X[i] = dv.getUint32(off + i * 4, true);
    let [al, bl, cl, dl, el] = [h0, h1, h2, h3, h4];
    let [ar, br, cr, dr, er] = [h0, h1, h2, h3, h4];
    for (let j = 0; j < 80; j++) {
      const r = (j / 16) | 0;
      let t = (al + fl[r](bl, cl, dl) + X[RL[j]] + KL[r]) >>> 0;
      t = (rotl32(t, SL[j]) + el) >>> 0;
      al = el; el = dl; dl = rotl32(cl, 10); cl = bl; bl = t;
      t = (ar + fl[4 - r](br, cr, dr) + X[RR[j]] + KR[r]) >>> 0;
      t = (rotl32(t, SR[j]) + er) >>> 0;
      ar = er; er = dr; dr = rotl32(cr, 10); cr = br; br = t;
    }
    const t = (h1 + cl + dr) >>> 0;
    h1 = (h2 + dl + er) >>> 0;
    h2 = (h3 + el + ar) >>> 0;
    h3 = (h4 + al + br) >>> 0;
    h4 = (h0 + bl + cr) >>> 0;
    h0 = t;
  }
  const out = u8(20);
  const od = new DataView(out.buffer);
  od.setUint32(0, h0, true); od.setUint32(4, h1, true);
  od.setUint32(8, h2, true); od.setUint32(12, h3, true);
  od.setUint32(16, h4, true);
  return out;
}

// ------------------------------------------------------- composites + keccak

export function hash256(b) { return sha256(sha256(b)); }
export function hash160(b) { return ripemd160(sha256(b)); }

/** BIP-340 tagged hash: SHA256(SHA256(tag) || SHA256(tag) || msg). */
export function taggedHash(tagAscii, msg) {
  const tag = typeof tagAscii === "string"
    ? new TextEncoder().encode(tagAscii) : tagAscii;
  const th = sha256(tag);
  const buf = u8(64 + msg.length);
  buf.set(th, 0);
  buf.set(th, 32);
  buf.set(msg, 64);
  return sha256(buf);
}

// Keccak-f[1600] permutation, 64-bit lanes as BigInt. Lane order is
// x + 5*y (little-endian lanes). Rotation offsets r[x][y]:
// y=0: 0,1,62,28,27  y=1: 36,44,6,55,20  y=2: 3,10,43,25,39
// y=3: 41,45,15,21,8  y=4: 18,2,61,56,14
const RC = [
  0x0000000000000001n, 0x0000000000008082n, 0x800000000000808an,
  0x8000000080008000n, 0x000000000000808bn, 0x0000000080000001n,
  0x8000000080008081n, 0x8000000000008009n, 0x000000000000008an,
  0x0000000000000088n, 0x0000000080008009n, 0x000000008000000an,
  0x000000008000808bn, 0x800000000000008bn, 0x8000000000008089n,
  0x8000000000008003n, 0x8000000000008002n, 0x8000000000000080n,
  0x000000000000800an, 0x800000008000000an, 0x8000000080008081n,
  0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n,
];
const RHO = [
  0, 1, 62, 28, 27,
  36, 44, 6, 55, 20,
  3, 10, 43, 25, 39,
  41, 45, 15, 21, 8,
  18, 2, 61, 56, 14,
];
// PI destination index for lane (x, y): x' = y, y' = (2x + 3y) mod 5.
const PI = (() => {
  const t = new Array(25);
  for (let x = 0; x < 5; x++)
    for (let y = 0; y < 5; y++)
      t[x + 5 * y] = y + 5 * (((2 * x + 3 * y) % 5));
  return t;
})();

function keccakF1600(s) {
  for (let round = 0; round < 24; round++) {
    // theta
    const c = [0n, 0n, 0n, 0n, 0n];
    for (let x = 0; x < 5; x++)
      for (let y = 0; y < 5; y++) c[x] ^= s[x + 5 * y];
    const d = [0n, 0n, 0n, 0n, 0n];
    for (let x = 0; x < 5; x++) {
      const t = c[(x + 1) % 5];
      d[x] = c[(x + 4) % 5] ^ (((t << 1n) | (t >> 63n)) & M64);
    }
    for (let x = 0; x < 5; x++)
      for (let y = 0; y < 5; y++) s[x + 5 * y] ^= d[x];
    // rho + pi
    const b = new Array(25);
    for (let i = 0; i < 25; i++) {
      const r = BigInt(RHO[i]);
      b[PI[i]] = ((s[i] << r) | (s[i] >> (64n - r))) & M64;
    }
    // chi
    for (let y = 0; y < 5; y++)
      for (let x = 0; x < 5; x++)
        s[x + 5 * y] = b[x + 5 * y] ^ ((~b[(x + 1) % 5 + 5 * y] & M64) & b[(x + 2) % 5 + 5 * y]);
    // iota
    s[0] ^= RC[round];
  }
}

/**
 * Original Keccak-256 (padding 0x01 — NOT NIST SHA3-256, which uses 0x06).
 * This is the Ethereum hash.
 */
export function keccak256(msg) {
  const s = new Array(25).fill(0n);
  const rate = 136; // bytes; capacity 512
  const xorBlock = (off, len) => {
    for (let i = 0; i < len; i++) {
      const lane = (i / 8) | 0;
      s[lane] ^= BigInt(msg[off + i]) << BigInt(8 * (i % 8));
    }
  };
  let off = 0;
  while (msg.length - off >= rate) {
    xorBlock(off, rate);
    keccakF1600(s);
    off += rate;
  }
  const last = u8(rate);
  last.set(msg.subarray(off), 0);
  last[msg.length - off] = 0x01;
  last[rate - 1] |= 0x80;
  for (let i = 0; i < rate; i++) {
    const lane = (i / 8) | 0;
    s[lane] ^= BigInt(last[i]) << BigInt(8 * (i % 8));
  }
  keccakF1600(s);
  const out = u8(32);
  for (let i = 0; i < 32; i++)
    out[i] = Number((s[(i / 8) | 0] >> BigInt(8 * (i % 8))) & 0xffn);
  return out;
}

