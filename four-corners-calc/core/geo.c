/* core/geo.c — the projection, the IDW terrain field and the depth ramp, in
 * integers only.
 *
 * js/four-corners-geo.js is the single source of truth for the first two in
 * the web app, and the constants used here (FC_COSLAT_Q12, FC_SNAP_Q,
 * FC_IDW_MUL, FC_KMQ_Q12) are lifted out of that module at conversion time
 * rather than retyped. host/tests.c then holds this field against an elevation
 * fixture sampled from the app's own elevAt(), so "the calculator agrees with
 * the theater" is a test result, not a claim.
 *
 * The app's field is inverse-distance interpolation over 31 control points
 * with power 2.4:
 *
 *     w_i = 1 / d_i^2.4      elev = sum(w_i * e_i) / sum(w_i)
 *
 * In integers, d2 is measured in cos-corrected quant units (a constant rescale
 * of the app's km2, which cancels in the weighted average), and the weight is
 * evaluated as
 *
 *     t  = 1.2 * log2(d2)                  Q8, FC_IDW_MUL = 307
 *     n  = t >> 8, f = t & 255             integer + fraction of the exponent
 *     w  = (2^(-f/256) << 14) >> n         FC_EXP2_Q16[f] << FC_WBIAS
 *
 * The weights are then normalized by the largest one's highest set bit, so
 * every r_i fits in 13 bits and sum(r_i * e_i) cannot overflow 32 bits. The
 * measured cost of all that fixed point: mean error 3 m, worst 13 m over the
 * fixture lattice (socal-calc's gaussian field: 2 m / 16 m).
 *
 * The depth ramp is this port's own (the app shows depth as dossier text
 * only); it is the same a + b*log10(1+|m|) ramp the SOCAL port uses, so a
 * -1700 m reservoir and a -2400 m CO2 field stay separable under the profile.
 *
 * Fixed point used below:
 *   quant units  1/FC_Q degree, the unit every stored coordinate is in
 *   Q8           the exp2 fraction; the depth magnitude; the log2 exponent
 *   Q12          cosines and the screen scale factors
 */
#include "fourcorners.h"

extern const u16 FC_EXP2_Q16[257];

/* Truncating 32-bit divide. C truncates toward zero; Math.trunc matches, so
   the transpiled build and the gcc build agree on negative operands too. */
i32 idiv32(i32 a, i32 b) {
#ifdef JS_BUILD
  return Math.trunc(a / b) | 0;
#else
  return a / b;
#endif
}

/* Per-point weights, module scope so the Z80 stack stays shallow. */
static u32 FC_W[FC_NTER];

/* Elevation in metres at a quantised position — the integer twin of
   elevAt(lon, lat) in four-corners-geo.js. */
i32 fc_elev_q(i32 qlon, i32 qlat) {
  i32 dx;
  i32 dy;
  i32 dxc;
  i32 d2;
  i32 l2;
  i32 t;
  i32 n;
  i32 f;
  i32 sh;
  i32 num;
  i32 den;
  u32 w;
  u32 wmax;
  u32 wi;
  int k;
  for (k = 0; k < FC_NTER; k++) {
    dx = qlon - (i32)FC_TER[k * 3];
    dy = qlat - (i32)FC_TER[k * 3 + 1];
    dxc = (dx * FC_COSLAT_Q12) >> 12;         /* cos-corrected dx, quant */
    d2 = dxc * dxc + dy * dy;                 /* quant^2, scales out */
    if (d2 < FC_SNAP_Q) return (i32)FC_TER[k * 3 + 2];
    l2 = (i32)log2_q8((u32)d2);
    t = (l2 * FC_IDW_MUL) >> 8;               /* 1.2 * log2(d2), Q8 */
    n = t >> 8;
    f = t & 255;
    if (n > 30) w = 0;                        /* weight < 2^-30: no say */
    else w = ((u32)FC_EXP2_Q16[f] << FC_WBIAS) >> n;
    FC_W[k] = w;
  }
  wmax = 0;
  for (k = 0; k < FC_NTER; k++) {
    if (FC_W[k] > wmax) wmax = FC_W[k];
  }
  if (wmax == 0) return FC_ELEV_BASE;
  /* Normalize so the largest weight lands in [4096, 8191]: the average is
     scale-invariant, and r_i * e_i * 31 stays far inside i32. */
  sh = 0;
  wi = wmax;
  while (wi > 8191) {
    wi = wi >> 1;
    sh = sh + 1;
  }
  num = 0;
  den = 0;
  for (k = 0; k < FC_NTER; k++) {
    wi = FC_W[k] >> sh;
    num = num + (i32)wi * (i32)FC_TER[k * 3 + 2];
    den = den + (i32)wi;
  }
  if (den == 0) return FC_ELEV_BASE;
  return idiv32(num, den);
}

/* Same field, addressed in 1/1000 degree — what the host fixture speaks. */
i32 fc_elev_deg(i32 lon_m, i32 lat_m) {
  i32 qlon;
  i32 qlat;
  qlon = idiv32((lon_m - FC_LON_BASE_M) * FC_Q, 1000);
  qlat = idiv32((lat_m - FC_LAT_BASE_M) * FC_Q, 1000);
  return fc_elev_q(qlon, qlat);
}

/* The port's log depth ramp: mag = a + b*log10(1 + |m|), returned in Q8.
   The Aneth reservoir is 1700 m down and McElmo Dome's CO2 is 2400 m down;
   only a log ramp keeps both visible under a 64-pixel profile. */
u16 fc_depth_mag_q8(i32 metres) {
  i32 v;
  i32 l2;
  i32 l10;
  v = metres;
  if (v < 0) v = 0 - v;
  if (v == 0) return 0;
  l2 = (i32)log2_q8((u32)(v + 1));
  l10 = idiv32(l2 * 77, 256);            /* 256 / log2(10) = 77.06 */
  return (u16)(FC_DEPTH_A_Q8 + idiv32((i32)FC_DEPTH_B_Q8 * l10, 256));
}

/* Integer square root over the full 32-bit range. calc/core/util.c has one,
   but it is a 16-bit trial loop: squared quant units reach 4e8 here. */
u16 fc_isqrt32(u32 v) {
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
   the same planar approximation pathKm() makes in four-corners-geo.js. */
u16 fc_km_span(i32 dqlon, i32 dqlat) {
  i32 dx;
  i32 dy;
  i32 r;
  dx = idiv32(dqlon * FC_COSLAT_Q12, 4096);
  if (dx < 0) dx = 0 - dx;
  dy = dqlat;
  if (dy < 0) dy = 0 - dy;
  r = (i32)fc_isqrt32((u32)(dx * dx + dy * dy));
  return (u16)idiv32(r * FC_KMDEG_Q4, (i32)FC_Q * 16);
}

i32 fc_lon_mdeg(u16 q) {
  return FC_LON_BASE_M + idiv32((i32)q * 1000, FC_Q);
}

i32 fc_lat_mdeg(u16 q) {
  return FC_LAT_BASE_M + idiv32((i32)q * 1000, FC_Q);
}

/* ------------------------------------------------------------- the viewport */

u16 FC_MX;
u16 FC_MY;
u16 FC_MW;
u16 FC_MH;
i32 FC_VX;
i32 FC_VY;
i32 FC_VW;
i32 FC_VH;
i32 FC_KX;
i32 FC_KY;

/* Recompute the map rectangle for the current zoom and selection.
   The projection is the app's: local equirectangular about CENTER, so one
   degree of longitude is cos(CENTER.lat) as wide as one of latitude. */
void fc_view(void) {
  i32 cx;
  i32 cy;
  i32 ky;
  i32 kx;
  i32 wpx;
  i32 hpx;
  FC_VW = ((i32)FC_SPAN_LON) >> FC_ZOOM;
  FC_VH = ((i32)FC_SPAN_LAT) >> FC_ZOOM;
  cx = (i32)fcorner_feat_qlon(FC_SEL);
  cy = (i32)fcorner_feat_qlat(FC_SEL);
  if (FC_ZOOM == 0) {
    cx = FC_VW >> 1;
    cy = FC_VH >> 1;
  }
  FC_VX = cx - (FC_VW >> 1);
  FC_VY = cy - (FC_VH >> 1);
  if (FC_VX < 0) FC_VX = 0;
  if (FC_VY < 0) FC_VY = 0;
  if (FC_VX + FC_VW > (i32)FC_SPAN_LON) FC_VX = (i32)FC_SPAN_LON - FC_VW;
  if (FC_VY + FC_VH > (i32)FC_SPAN_LAT) FC_VY = (i32)FC_SPAN_LAT - FC_VH;

  FC_MX = 1;
  FC_MY = 10;
  FC_MW = (u16)(SK_W - 2);
  FC_MH = (u16)(SK_H - 20);

  /* Fit, keeping km per pixel equal on both axes. */
  ky = idiv32((i32)FC_MH * 4096, FC_VH);
  kx = idiv32((i32)FC_MW * 4096, idiv32(FC_VW * FC_COSLAT_Q12, 4096));
  if (kx < ky) ky = kx;
  FC_KY = ky;
  FC_KX = idiv32(ky * FC_COSLAT_Q12, 4096);
  if (FC_KX < 1) FC_KX = 1;
  if (FC_KY < 1) FC_KY = 1;

  wpx = (FC_VW * FC_KX) >> 12;
  hpx = (FC_VH * FC_KY) >> 12;
  if (wpx < (i32)FC_MW) FC_MX = (u16)((i32)FC_MX + (((i32)FC_MW - wpx) >> 1));
  if (hpx < (i32)FC_MH) FC_MY = (u16)((i32)FC_MY + (((i32)FC_MH - hpx) >> 1));
}

/* Quantised lon -> screen x. Latitude grows north, screen y grows down. */
int fc_px(u16 q) {
  return (int)((i32)FC_MX + ((((i32)q - FC_VX) * FC_KX) >> 12));
}

int fc_py(u16 q) {
  i32 hpx;
  hpx = (FC_VH * FC_KY) >> 12;
  return (int)((i32)FC_MY + hpx - ((((i32)q - FC_VY) * FC_KY) >> 12));
}
