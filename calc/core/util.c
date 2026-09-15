/* core/util.c — integer math shared by every target. No libc, no float. */
#include "sitek.h"

extern const i16 SIN_Q12[64];
extern const u8 LOG2_MANT[256];

int idiv(int a, int b) {
#ifdef JS_BUILD
  return Math.trunc(a / b) | 0;
#else
  return a / b;
#endif
}

int imod(int a, int b) {
#ifdef JS_BUILD
  return (a % b) | 0;
#else
  return a % b;
#endif
}

int iabs(int a) {
  if (a < 0) return -a;
  return a;
}

int imin(int a, int b) {
  if (a < b) return a;
  return b;
}

int imax(int a, int b) {
  if (a > b) return a;
  return b;
}

int iclamp(int v, int lo, int hi) {
  if (v < lo) return lo;
  if (v > hi) return hi;
  return v;
}

/* JS bit ops are 32-bit signed, so >> on a value >= 2^31 would go negative.
   Every 32-bit shift in the core goes through shr32 so sdcc (unsigned long),
   gcc4ti and the transpiled build agree bit for bit. */
u32 u32w(u32 v) {
#ifdef JS_BUILD
  return v >>> 0;
#else
  return v & 0xFFFFFFFFU;
#endif
}

u32 shr32(u32 v, int n) {
#ifdef JS_BUILD
  return (v >>> n) >>> 0;
#else
  return (v >> n) & 0xFFFFFFFFU;
#endif
}

/* JS doubles lose bits past 2^53, so a 32x32 multiply has to go through
   Math.imul to stay bit-identical with a Z80 unsigned long. */
u32 mul32(u32 a, u32 b) {
#ifdef JS_BUILD
  return Math.imul(a, b) >>> 0;
#else
  return (a * b) & 0xFFFFFFFFU;
#endif
}

u32 add32(u32 a, u32 b) {
#ifdef JS_BUILD
  return (a + b) >>> 0;
#else
  return (a + b) & 0xFFFFFFFFU;
#endif
}

u32 ror32(u32 v, int n) {
#ifdef JS_BUILD
  return (((v >>> n) | (v << (32 - n))) >>> 0);
#else
  return ((v >> n) | (v << (32 - n))) & 0xFFFFFFFFU;
#endif
}

static u32 rng_state;

void rng_seed(u32 s) {
  if (s == 0) s = 0x9E3779B9U;
  rng_state = u32w(s);
}

/* xorshift32 */
u32 rng_next(void) {
  u32 x;
  x = rng_state;
  x = u32w(x ^ (x << 13));
  x = u32w(x ^ shr32(x, 17));
  x = u32w(x ^ (x << 5));
  rng_state = x;
  return x;
}

u16 rng_range(u16 n) {
  if (n == 0) return 0;
  return (u16)(rng_next() % n);
}

/* sin/cos in Q12 (4096 = 1.0), 64 steps around the circle. */
static int sin_index(int deg) {
  int i;
  i = imod(deg, 360);
  if (i < 0) i = i + 360;
  i = idiv(i * 64, 360);
  if (i >= 64) i = i - 64;
  return i;
}

int fsin(int deg) {
  return (int)SIN_Q12[sin_index(deg)];
}

int fcos(int deg) {
  return (int)SIN_Q12[sin_index(deg + 90)];
}

int isqrt(int v) {
  int i;
  if (v <= 0) return 0;
  i = 1;
  while (i * i <= v) i = i + 1;
  return i - 1;
}

/* 256 * log2(v), v > 0. Accurate to ~0.004 — enough for the H8 readout. */
int log2_q8(u32 v) {
  int b;
  u32 t;
  if (v == 0) return 0;
  b = 0;
  t = v;
  while (t >= 256) {
    t = shr32(t, 1);
    b = b + 1;
  }
  while (t < 128) {
    t = t << 1;
    b = b - 1;
  }
  return (b + 7) * 256 + (int)LOG2_MANT[(t - 128) * 2];
}
