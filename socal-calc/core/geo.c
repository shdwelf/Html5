/* core/geo.c — the projection, the terrain field and the depth ramp, in
 * integers only.
 *
 * socal-geo.js is the single source of truth for all three in the web app, and
 * the constants used here (SC_ELEV_BASE, SC_EXP_*, SC_FRAC*, SC_DEPTH_*) are
 * lifted out of that file at conversion time rather than retyped. host/tests.c
 * then holds this field against an elevation fixture sampled from the app's own
 * elevationAt(), so "the calculator agrees with the theater" is a test result,
 * not a claim.
 *
 * Fixed point used below:
 *   quant units  1/SC_Q degree, the unit every stored coordinate is in
 *   Q8           u, v inside the gaussian; the exp table; the depth magnitude
 *   Q12          sines, cosines and the screen scale factors
 *   Q16 turns    the argument of the fractal texture term
 */
#include "socal.h"

extern const i16 SC_SIN_Q12[257];
extern const u16 SC_EXP_Q8[130];

/* Truncating 32-bit divide. C truncates toward zero; Math.trunc matches, so
   the transpiled build and the gcc build agree on negative operands too. */
i32 idiv32(i32 a, i32 b) {
#ifdef JS_BUILD
  return Math.trunc(a / b) | 0;
#else
  return a / b;
#endif
}

/* sin of a Q16 turn (65536 = one full turn), Q12 out, linearly interpolated. */
int sc_sin_turn(i32 t_q16) {
  i32 i;
  i32 f;
  i32 a;
  i32 b;
  i = (t_q16 >> 8) & 255;
  f = t_q16 & 255;
  a = (i32)SC_SIN_Q12[i];
  b = (i32)SC_SIN_Q12[i + 1];
  return (int)(a + (((b - a) * f) >> 8));
}

int sc_cos_turn(i32 t_q16) {
  return sc_sin_turn(t_q16 + 16384);
}

/* Elevation in metres at a quantised position — the integer twin of
   elevationAt(lon, lat) in socal-geo.js. */
i32 sc_elev_q(i32 qlon, i32 qlat) {
  i32 e;
  i32 dx;
  i32 dy;
  i32 rx;
  i32 ry;
  i32 amp;
  i32 rot;
  i32 c;
  i32 s;
  i32 uq;
  i32 vq;
  i32 t;
  i32 idx;
  i32 fr;
  i32 w;
  i32 t1;
  i32 t2;
  int k;
  e = SC_ELEV_BASE;
  for (k = 0; k < SC_NRELIEF; k++) {
    dx = qlon - (i32)SC_RELIEF[k * 6 + 0];
    dy = qlat - (i32)SC_RELIEF[k * 6 + 1];
    rx = (i32)SC_RELIEF[k * 6 + 2];
    ry = (i32)SC_RELIEF[k * 6 + 3];
    amp = (i32)SC_RELIEF[k * 6 + 4];
    rot = ((i32)SC_RELIEF[k * 6 + 5]) << 2;   /* Q14 turn -> Q16 turn */
    c = (i32)sc_cos_turn(rot);
    s = (i32)sc_sin_turn(rot);
    /* u = (dx*cos + dy*sin)/rx, v = (-dx*sin + dy*cos)/ry, both Q8 */
    uq = idiv32((dx * c + dy * s) >> 4, rx);
    vq = idiv32(((0 - dx) * s + dy * c) >> 4, ry);
    t = uq * uq + vq * vq;                     /* Q16 of u*u + v*v */
    idx = (t * SC_EXP_MUL) >> SC_EXP_SHIFT;    /* 16 * table index */
    if (idx < 2048) {
      fr = idx & 15;
      idx = idx >> 4;
      w = (i32)SC_EXP_Q8[idx];
      w = w + ((((i32)SC_EXP_Q8[idx + 1] - w) * fr) >> 4);
      e = e + idiv32(amp * w, 256);
    }
  }
  /* Fractal texture: amp * (sin(a) + sin(b)), a and b in Q16 turns. */
  t1 = SC_FRAC1_BASE + ((qlon * SC_FRAC1_LON_M) >> SC_FRAC1_LON_S)
       + ((qlat * SC_FRAC1_LAT_M) >> SC_FRAC1_LAT_S);
  t2 = SC_FRAC2_BASE + ((qlon * SC_FRAC2_LON_M) >> SC_FRAC2_LON_S)
       + ((qlat * SC_FRAC2_LAT_M) >> SC_FRAC2_LAT_S);
  e = e + idiv32((i32)SC_FRAC_AMP * ((i32)sc_sin_turn(t1) + (i32)sc_sin_turn(t2)), 4096);
  return e;
}

/* Same field, addressed in 1/1000 degree — what the host fixture speaks. */
i32 sc_elev_deg(i32 lon_m, i32 lat_m) {
  i32 qlon;
  i32 qlat;
  qlon = idiv32((lon_m - SC_LON_BASE_M) * SC_Q, 1000);
  qlat = idiv32((lat_m - SC_LAT_BASE_M) * SC_Q, 1000);
  return sc_elev_q(qlon, qlat);
}

/* depthY() without the float: mag = a + b*log10(1 + |m|), returned in Q8.
   A trench-buried products line is 1.5 m down and a geothermal production zone
   is 2,000 m down; only a log ramp puts both on one 64-pixel LCD. */
u16 sc_depth_mag_q8(i32 metres) {
  i32 v;
  i32 l2;
  i32 l10;
  v = metres;
  if (v < 0) v = 0 - v;
  if (v == 0) return 0;
  l2 = (i32)log2_q8((u32)(v + 1));
  l10 = idiv32(l2 * 77, 256);            /* 256 / log2(10) = 77.06 */
  return (u16)(SC_DEPTH_A_Q8 + idiv32((i32)SC_DEPTH_B_Q8 * l10, 256));
}

/* Integer square root over the full 32-bit range. calc/core/util.c has one,
   but it is a 16-bit trial loop: squared quant units reach 4e8 here. */
u16 sc_isqrt32(u32 v) {
  u32 rest;
  u32 place;
  u32 root;
  rest = v;
  root = 0;
  place = 1073741824;
  while (place > rest) place = shr32(place, 2);
  while (place != 0) {
    if (rest >= root + place) {
      rest = rest - (root + place);
      root = root + place + place;
    }
    root = shr32(root, 1);
    place = shr32(place, 2);
  }
  return (u16)root;
}

/* Planar distance in km between two quantised points, cos-corrected in lon —
   the same planar approximation pathKm() makes in socal-geo.js. */
u16 sc_km_span(i32 dqlon, i32 dqlat) {
  i32 dx;
  i32 dy;
  i32 r;
  dx = idiv32(dqlon * SC_COSLAT_Q12, 4096);
  if (dx < 0) dx = 0 - dx;
  dy = dqlat;
  if (dy < 0) dy = 0 - dy;
  r = (i32)sc_isqrt32((u32)(dx * dx + dy * dy));
  return (u16)idiv32(r * SC_KMDEG_Q4, (i32)SC_Q * 16);
}

i32 sc_lon_mdeg(u16 q) {
  return SC_LON_BASE_M + idiv32((i32)q * 1000, SC_Q);
}

i32 sc_lat_mdeg(u16 q) {
  return SC_LAT_BASE_M + idiv32((i32)q * 1000, SC_Q);
}

/* ------------------------------------------------------------- the viewport */

u16 SC_MX;
u16 SC_MY;
u16 SC_MW;
u16 SC_MH;
i32 SC_VX;
i32 SC_VY;
i32 SC_VW;
i32 SC_VH;
i32 SC_KX;
i32 SC_KY;

/* Recompute the map rectangle for the current zoom and selection.
   The projection is the app's: local equirectangular about CENTER, so one
   degree of longitude is cos(CENTER.lat) as wide as one of latitude. */
void sc_view(void) {
  i32 cx;
  i32 cy;
  i32 ky;
  i32 kx;
  i32 wpx;
  i32 hpx;
  SC_VW = ((i32)SC_SPAN_LON) >> SC_ZOOM;
  SC_VH = ((i32)SC_SPAN_LAT) >> SC_ZOOM;
  cx = (i32)socal_feat_qlon(SC_SEL);
  cy = (i32)socal_feat_qlat(SC_SEL);
  if (SC_ZOOM == 0) {
    cx = SC_VW >> 1;
    cy = SC_VH >> 1;
  }
  SC_VX = cx - (SC_VW >> 1);
  SC_VY = cy - (SC_VH >> 1);
  if (SC_VX < 0) SC_VX = 0;
  if (SC_VY < 0) SC_VY = 0;
  if (SC_VX + SC_VW > (i32)SC_SPAN_LON) SC_VX = (i32)SC_SPAN_LON - SC_VW;
  if (SC_VY + SC_VH > (i32)SC_SPAN_LAT) SC_VY = (i32)SC_SPAN_LAT - SC_VH;

  SC_MX = 1;
  SC_MY = 10;
  SC_MW = (u16)(SK_W - 2);
  SC_MH = (u16)(SK_H - 20);

  /* Fit, keeping km per pixel equal on both axes. */
  ky = idiv32((i32)SC_MH * 4096, SC_VH);
  kx = idiv32((i32)SC_MW * 4096, idiv32(SC_VW * SC_COSLAT_Q12, 4096));
  if (kx < ky) ky = kx;
  SC_KY = ky;
  SC_KX = idiv32(ky * SC_COSLAT_Q12, 4096);
  if (SC_KX < 1) SC_KX = 1;
  if (SC_KY < 1) SC_KY = 1;

  wpx = (SC_VW * SC_KX) >> 12;
  hpx = (SC_VH * SC_KY) >> 12;
  if (wpx < (i32)SC_MW) SC_MX = (u16)((i32)SC_MX + (((i32)SC_MW - wpx) >> 1));
  if (hpx < (i32)SC_MH) SC_MY = (u16)((i32)SC_MY + (((i32)SC_MH - hpx) >> 1));
}

/* Quantised lon -> screen x. Latitude grows north, screen y grows down. */
int sc_px(u16 q) {
  return (int)((i32)SC_MX + ((((i32)q - SC_VX) * SC_KX) >> 12));
}

int sc_py(u16 q) {
  i32 hpx;
  hpx = (SC_VH * SC_KY) >> 12;
  return (int)((i32)SC_MY + hpx - ((((i32)q - SC_VY) * SC_KY) >> 12));
}
