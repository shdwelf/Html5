/* core/grid.c — SITE-K sector grid + terrarium automaton.
 *
 * Deterministic from a seed, so a TI-83 and a TI-92 render the same park.
 */
#include "sitek.h"

static u32 grid_seed_v;

static u8 tr_a[TR_MAXW * TR_MAXH];
static u8 tr_b[TR_MAXW * TR_MAXH];
static u16 tr_wv;
static u16 tr_hv;
static u16 tr_gen_v;

void grid_seed(u32 s) {
  if (s == 0) s = 0x5A17E1U;
  grid_seed_v = u32w(s);
}

/* How many sanctuary nodes sit in a sector: 0..12, stable per seed. */
u8 grid_nodes(u8 sector) {
  u32 h;
  h = u32w(grid_seed_v ^ mul32((u32)sector, 0x9E3779B1U));
  h = u32w(h ^ shr32(h, 13));
  h = mul32(h, 0x85EBCA6BU);
  h = u32w(h ^ shr32(h, 16));
  return (u8)(h % 13);
}

/* Position of one node inside its sector: (x << 8) | y, both 0..255 */
u16 grid_node_xy(u8 sector, u8 slot) {
  u32 h;
  u16 x;
  u16 y;
  h = u32w(grid_seed_v ^ mul32((u32)((sector * 31) + slot), 0xC2B2AE35U));
  h = u32w(h ^ shr32(h, 15));
  h = mul32(h, 0x27D4EB2FU);
  h = u32w(h ^ shr32(h, 13));
  x = (u16)(h & 255);
  y = (u16)((h >> 8) & 255);
  return (u16)((x << 8) | y);
}

u16 tr_w(void) {
  return tr_wv;
}

u16 tr_h(void) {
  return tr_hv;
}

u16 tr_gen(void) {
  return tr_gen_v;
}

void tr_init(u32 s, u16 maxw, u16 maxh) {
  u16 i;
  u16 n;
  u32 r;
  if (maxw > TR_MAXW) maxw = TR_MAXW;
  if (maxh > TR_MAXH) maxh = TR_MAXH;
  if (maxw < 8) maxw = 8;
  if (maxh < 8) maxh = 8;
  tr_wv = maxw;
  tr_hv = maxh;
  tr_gen_v = 0;
  rng_seed(s);
  n = (u16)(maxw * maxh);
  for (i = 0; i < n; i++) {
    r = rng_next();
    if ((r & 3) == 0) tr_a[i] = 1;
    else tr_a[i] = 0;
  }
}

u8 tr_get(u16 i) {
  if (i >= (u16)(tr_wv * tr_hv)) return 0;
  return tr_a[i];
}

/* B3 / S1234 — a slow-breathing terrarium rather than Conway's die-off */
void tr_step(void) {
  u16 x;
  u16 y;
  u16 i;
  u16 n;
  u16 left;
  u16 right;
  u16 up;
  u16 down;
  u8 alive;
  for (y = 0; y < tr_hv; y++) {
    up = (u16)((y + tr_hv - 1) % tr_hv);
    down = (u16)((y + 1) % tr_hv);
    for (x = 0; x < tr_wv; x++) {
      left = (u16)((x + tr_wv - 1) % tr_wv);
      right = (u16)((x + 1) % tr_wv);
      n = 0;
      n = (u16)(n + tr_a[up * tr_wv + left]);
      n = (u16)(n + tr_a[up * tr_wv + x]);
      n = (u16)(n + tr_a[up * tr_wv + right]);
      n = (u16)(n + tr_a[y * tr_wv + left]);
      n = (u16)(n + tr_a[y * tr_wv + right]);
      n = (u16)(n + tr_a[down * tr_wv + left]);
      n = (u16)(n + tr_a[down * tr_wv + x]);
      n = (u16)(n + tr_a[down * tr_wv + right]);
      i = (u16)(y * tr_wv + x);
      alive = tr_a[i];
      if (alive != 0) {
        if (n >= 1 && n <= 4) tr_b[i] = 1;
        else tr_b[i] = 0;
      } else {
        if (n == 3) tr_b[i] = 1;
        else tr_b[i] = 0;
      }
    }
  }
  n = (u16)(tr_wv * tr_hv);
  for (i = 0; i < n; i++) tr_a[i] = tr_b[i];
  tr_gen_v = (u16)((tr_gen_v + 1) & 0xFFFF);
}
