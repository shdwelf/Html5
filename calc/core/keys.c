/* core/keys.c — BIP-39 keyspace maths, ported from js/mathvis.js + js/spacefill.js.
 *
 * The wordlist (2048 words, ~15 KB) stays in the web app; on the calculators we
 * carry the 11-bit word *indices*, the entropy, and a real SHA-256 so the
 * checksum bits are the genuine BIP-39 ones and not a toy hash.
 */
#include "sitek.h"

static const u32 SHA_K[64] = {
  0x428A2F98U, 0x71374491U, 0xB5C0FBCFU, 0xE9B5DBA5U, 0x3956C25BU, 0x59F111F1U, 0x923F82A4U, 0xAB1C5ED5U,
  0xD807AA98U, 0x12835B01U, 0x243185BEU, 0x550C7DC3U, 0x72BE5D74U, 0x80DEB1FEU, 0x9BDC06A7U, 0xC19BF174U,
  0xE49B69C1U, 0xEFBE4786U, 0x0FC19DC6U, 0x240CA1CCU, 0x2DE92C6FU, 0x4A7484AAU, 0x5CB0A9DCU, 0x76F988DAU,
  0x983E5152U, 0xA831C66DU, 0xB00327C8U, 0xBF597FC7U, 0xC6E00BF3U, 0xD5A79147U, 0x06CA6351U, 0x14292967U,
  0x27B70A85U, 0x2E1B2138U, 0x4D2C6DFCU, 0x53380D13U, 0x650A7354U, 0x766A0ABBU, 0x81C2C92EU, 0x92722C85U,
  0xA2BFE8A1U, 0xA81A664BU, 0xC24B8B70U, 0xC76C51A3U, 0xD192E819U, 0xD6990624U, 0xF40E3585U, 0x106AA070U,
  0x19A4C116U, 0x1E376C08U, 0x2748774CU, 0x34B0BCB5U, 0x391C0CB3U, 0x4ED8AA4AU, 0x5B9CCA4FU, 0x682E6FF3U,
  0x748F82EEU, 0x78A5636FU, 0x84C87814U, 0x8CC70208U, 0x90BEFFFAU, 0xA4506CEBU, 0xBEF9A3F7U, 0xC67178F2U
};

static const u16 KS_ENTBITS[5] = { 128, 160, 192, 224, 256 };

static u32 sha_h[8];
static u8 sha_blk[64];
static u32 sha_w[64];

static u8 ks_ent[32];
static u8 ks_dig[32];
static u16 ks_idx[KS_MAX_WORDS];
static u16 ks_hist[256];
static u8 ks_words_n;
static u8 ks_entn;

/* One-block SHA-256: enough for 128–256 bits of entropy (<= 32 bytes). */
static void sha_compress(void) {
  u32 a;
  u32 b;
  u32 c;
  u32 d;
  u32 e;
  u32 f;
  u32 g;
  u32 h;
  u32 s0;
  u32 s1;
  u32 t1;
  u32 t2;
  u32 ch;
  u32 maj;
  int i;
  for (i = 0; i < 16; i++) {
    sha_w[i] = u32w(((u32)sha_blk[i * 4] << 24) | ((u32)sha_blk[i * 4 + 1] << 16) |
                    ((u32)sha_blk[i * 4 + 2] << 8) | (u32)sha_blk[i * 4 + 3]);
  }
  for (i = 16; i < 64; i++) {
    s0 = u32w(ror32(sha_w[i - 15], 7) ^ ror32(sha_w[i - 15], 18) ^ shr32(sha_w[i - 15], 3));
    s1 = u32w(ror32(sha_w[i - 2], 17) ^ ror32(sha_w[i - 2], 19) ^ shr32(sha_w[i - 2], 10));
    sha_w[i] = add32(add32(add32(sha_w[i - 16], s0), sha_w[i - 7]), s1);
  }
  a = sha_h[0];
  b = sha_h[1];
  c = sha_h[2];
  d = sha_h[3];
  e = sha_h[4];
  f = sha_h[5];
  g = sha_h[6];
  h = sha_h[7];
  for (i = 0; i < 64; i++) {
    s1 = u32w(ror32(e, 6) ^ ror32(e, 11) ^ ror32(e, 25));
    ch = u32w((e & f) ^ ((~e) & g));
    t1 = add32(add32(add32(add32(h, s1), ch), SHA_K[i]), sha_w[i]);
    s0 = u32w(ror32(a, 2) ^ ror32(a, 13) ^ ror32(a, 22));
    maj = u32w((a & b) ^ (a & c) ^ (b & c));
    t2 = add32(s0, maj);
    h = g;
    g = f;
    f = e;
    e = add32(d, t1);
    d = c;
    c = b;
    b = a;
    a = add32(t1, t2);
  }
  sha_h[0] = add32(sha_h[0], a);
  sha_h[1] = add32(sha_h[1], b);
  sha_h[2] = add32(sha_h[2], c);
  sha_h[3] = add32(sha_h[3], d);
  sha_h[4] = add32(sha_h[4], e);
  sha_h[5] = add32(sha_h[5], f);
  sha_h[6] = add32(sha_h[6], g);
  sha_h[7] = add32(sha_h[7], h);
}

void sha256_hash(const u8 *msg, u16 len, u8 *out) {
  u16 i;
  u16 bits;
  for (i = 0; i < 64; i++) sha_blk[i] = 0;
  for (i = 0; i < len; i++) sha_blk[i] = msg[i];
  sha_blk[len] = 0x80;
  bits = (u16)(len * 8);
  sha_blk[62] = (u8)(bits >> 8);
  sha_blk[63] = (u8)(bits & 0xFF);
  sha_h[0] = 0x6A09E667U;
  sha_h[1] = 0xBB67AE85U;
  sha_h[2] = 0x3C6EF372U;
  sha_h[3] = 0xA54FF53AU;
  sha_h[4] = 0x510E527FU;
  sha_h[5] = 0x9B05688CU;
  sha_h[6] = 0x1F83D9ABU;
  sha_h[7] = 0x5BE0CD19U;
  sha_compress();
  for (i = 0; i < 32; i++) {
    out[i] = (u8)(shr32(sha_h[i >> 2], 24 - (int)(i & 3) * 8) & 0xFF);
  }
}

void ks_seed(u32 s) {
  rng_seed(s);
}

u16 ks_ent_bits(void) {
  int k;
  k = idiv((int)ks_words_n - 12, 3);
  if (k < 0) k = 0;
  if (k > 4) k = 4;
  return KS_ENTBITS[k];
}

u8 ks_cs_bits(void) {
  return (u8)idiv((int)ks_ent_bits(), 32);
}

u8 ks_words(void) {
  return ks_words_n;
}

/* bit i of the entropy||checksum stream (BIP-39 index source) */
u8 ks_stream_bit(u16 i) {
  u16 ebits;
  u8 byte;
  u8 bit;
  ebits = ks_ent_bits();
  if (i < ebits) byte = ks_ent[i >> 3];
  else byte = ks_dig[(u16)((int)i - (int)ebits) >> 3];
  bit = (u8)(7 - (i & 7));
  return (u8)((byte >> bit) & 1);
}

void ks_gen(u8 words) {
  int i;
  int b;
  int n;
  int ebits;
  u16 v;
  if (words < 12) words = 12;
  if (words > 24) words = 24;
  ks_words_n = words;
  ebits = (int)ks_ent_bits();
  ks_entn = (u8)idiv(ebits, 8);
  for (i = 0; i < (int)ks_entn; i++) ks_ent[i] = (u8)(rng_next() & 0xFF);
  sha256_hash(ks_ent, (u16)ks_entn, ks_dig);
  n = 0;
  for (i = 0; i < (int)ks_words_n; i++) {
    v = 0;
    for (b = 0; b < 11; b++) {
      v = (u16)((v << 1) | ks_stream_bit((u16)n));
      n = n + 1;
    }
    ks_idx[i] = (u16)(v & 0x7FF);
  }
}

/* Load real entropy (16/20/24/28/32 bytes) instead of the CSPRNG.
   Used by the self test and by any target that gets entropy from a host. */
void ks_set_entropy(const u8 *ent, u8 nbytes) {
  int i;
  int b;
  int n;
  u16 v;
  if (nbytes < 16) nbytes = 16;
  if (nbytes > 32) nbytes = 32;
  ks_entn = nbytes;
  for (i = 0; i < (int)nbytes; i++) ks_ent[i] = ent[i];
  ks_words_n = (u8)idiv((int)nbytes * 8 + idiv((int)nbytes * 8, 32), 11);
  sha256_hash(ks_ent, (u16)nbytes, ks_dig);
  n = 0;
  for (i = 0; i < (int)ks_words_n; i++) {
    v = 0;
    for (b = 0; b < 11; b++) {
      v = (u16)((v << 1) | ks_stream_bit((u16)n));
      n = n + 1;
    }
    ks_idx[i] = (u16)(v & 0x7FF);
  }
}

u16 ks_word(u8 i) {
  if (i >= ks_words_n) return 0;
  return ks_idx[i];
}

u16 ks_gray(u16 n) {
  return (u16)(n ^ (n >> 1));
}

u16 ks_gray_inv(u16 g) {
  u16 n;
  n = g;
  n = (u16)(n ^ (n >> 1));
  n = (u16)(n ^ (n >> 2));
  n = (u16)(n ^ (n >> 4));
  n = (u16)(n ^ (n >> 8));
  return (u16)(n & 0x7FF);
}

/* (x << 8) | y on a 2^order grid — matches js/spacefill.js hilbertXY() */
u16 ks_hilbert(u32 d, u8 order) {
  u32 rx;
  u32 ry;
  u32 t;
  u32 s;
  u16 x;
  u16 y;
  u16 tmp;
  t = d;
  x = 0;
  y = 0;
  s = 1;
  while (s < (u32)(1 << order)) {
    rx = (u32)(1 & shr32(t, 1));
    ry = (u32)(1 & (t ^ rx));
    if (ry == 0) {
      if (rx == 1) {
        x = (u16)(s - 1 - x);
        y = (u16)(s - 1 - y);
      }
      tmp = x;
      x = y;
      y = tmp;
    }
    x = (u16)(x + (u16)(s * rx));
    y = (u16)(y + (u16)(s * ry));
    t = shr32(t, 2);
    s = s << 1;
  }
  return (u16)((x << 8) | (y & 255));
}

/* (x << 8) | y — matches js/spacefill.js mortonXY() */
u16 ks_morton(u32 d, u8 order) {
  u16 x;
  u16 y;
  u32 bit;
  int i;
  x = 0;
  y = 0;
  for (i = 0; i < (int)order; i++) {
    bit = (d >> (2 * i)) & 1;
    x = (u16)(x | (u16)(bit << i));
    bit = (d >> (2 * i + 1)) & 1;
    y = (u16)(y | (u16)(bit << i));
  }
  return (u16)((x << 8) | (y & 255));
}

u16 ks_ones(void) {
  u16 n;
  int i;
  int b;
  n = 0;
  for (i = 0; i < (int)ks_entn; i++) {
    for (b = 0; b < 8; b++) {
      if (((ks_ent[i] >> b) & 1) != 0) n = (u16)(n + 1);
    }
  }
  return n;
}

/* Shannon entropy of the entropy bytes, H8 * 256 (Q8) */
u16 ks_h8(void) {
  u32 acc;
  int i;
  int n;
  int lg;
  for (i = 0; i < 256; i++) ks_hist[i] = 0;
  for (i = 0; i < (int)ks_entn; i++) ks_hist[ks_ent[i]] = (u16)(ks_hist[ks_ent[i]] + 1);
  acc = 0;
  for (i = 0; i < 256; i++) {
    if (ks_hist[i] > 0) {
      acc = add32(acc, mul32((u32)ks_hist[i], (u32)log2_q8((u32)ks_hist[i])));
    }
  }
  n = (int)ks_entn;
  if (n <= 0) return 0;
  lg = log2_q8((u32)n);
  return (u16)(lg - idiv((int)acc, n));
}
