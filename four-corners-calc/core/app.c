/* core/app.c — FOUR CORNERS, five screens on a 1-bit LCD.
 *
 * The web app is a three.js theater with picture-in-picture panels: HUD,
 * LAYERS, DOSSIER, search and a plan-view minimap. Strip the WebGL and that is
 * a plan view, a cross-section, a layer register, a dossier and a device
 * readout — which is exactly what a calculator can hold.
 *
 *   1 MAP      plan view: state lines thru the surveyed quadripoint, the San
 *              Juan corridor, the register, site markers, the selection
 *   2 SECTION  the terrain screen: IDW relief profile + the reservoir hung
 *              under it on the log depth ramp
 *   3 LAYERS   the 8-layer register, on/off, counts
 *   4 DOSSIER  the selected feature in full, story sentence when it fits
 *   5 DEVICE   model, LCD, RAM and what the dataset actually contains
 *
 * Evidence tiers survive the loss of colour: official draws solid, community
 * dashed, context dotted — the same hygiene the web app enforces with colour.
 * The quadripoint beacon survives as a diamond: the surveyed point is the one
 * legally final fact in the whole theater.
 */
#include "fourcorners.h"

/* Live globals of the shared 1-bit runtime (calc/core/fb.c reads these). */
u16 SK_W;
u16 SK_H;
u16 SK_ROWB;
u16 SK_FBB;
u8 SK_DEV;
u16 SK_TICK;
u8 SK_QUIT;

u8 FC_SCREEN;
u16 FC_SEL;
u8 FC_ZOOM;
u8 FC_DEPTHX;
u8 FC_PROFMODE;
u8 FC_LAYCUR;
u8 FC_LAYON[FC_NLAYER];

static i16 PROF_E[FC_PROF_MAX];
static u16 PROF_N;
static i32 PROF_LO;
static i32 PROF_HI;
static u16 PROF_KM;
static u8 PROF_DIRTY;

/* --------------------------------------------------------------- strings */

u16 fc_str(u8 *dst, u16 off) {
  u16 n;
  n = 0;
  while (FC_STR[off + n] != 0) {
    dst[n] = FC_STR[off + n];
    n = (u16)(n + 1);
  }
  dst[n] = 0;
  return n;
}

u16 fc_str_at(u8 *dst, u16 at, u16 off) {
  u16 n;
  n = 0;
  while (FC_STR[off + n] != 0) {
    dst[at + n] = FC_STR[off + n];
    n = (u16)(n + 1);
  }
  dst[at + n] = 0;
  return n;
}

/* num_to() in the shared runtime tops out at a u16; longitudes in 1/1000
   degree do not fit in one, so this port prints the full 32-bit range. */
u16 fc_num_at(u8 *dst, u16 at, i32 v) {
  u16 n;
  i32 x;
  i32 div;
  i32 d;
  u8 started;
  n = 0;
  x = v;
  if (x < 0) {
    dst[at] = 45;
    n = 1;
    x = 0 - x;
  }
  div = 1000000000;
  started = 0;
  while (div > 0) {
    d = idiv32(x, div);
    if (d > 0 || started != 0 || div == 1) {
      dst[at + n] = (u8)(48 + d);
      n = (u16)(n + 1);
      started = 1;
    }
    x = x - d * div;
    div = idiv32(div, 10);
  }
  dst[at + n] = 0;
  return n;
}

/* 1/1000 degree -> "-108.837" */
u16 fc_deg_at(u8 *dst, u16 at, i32 mdeg) {
  u16 n;
  i32 v;
  i32 w;
  i32 f;
  n = 0;
  v = mdeg;
  if (v < 0) {
    dst[at] = 45;
    n = 1;
    v = 0 - v;
  }
  w = idiv32(v, 1000);
  f = v - w * 1000;
  n = (u16)(n + fc_num_at(dst, (u16)(at + n), w));
  dst[at + n] = 46;
  n = (u16)(n + 1);
  dst[at + n] = (u8)(48 + idiv32(f, 100));
  n = (u16)(n + 1);
  dst[at + n] = (u8)(48 + idiv32(f, 10) - idiv32(f, 100) * 10);
  n = (u16)(n + 1);
  dst[at + n] = (u8)(48 + f - idiv32(f, 10) * 10);
  n = (u16)(n + 1);
  dst[at + n] = 0;
  return n;
}

/* ------------------------------------------------------- feature accessors */

u16 fcorner_feat_count(void) {
  return FC_NFEAT;
}

u8 fcorner_feat_class(u16 f) {
  if (f < FC_NCOR) return FC_CLS_COR;
  return FC_CLS_NODE;
}

u16 fcorner_feat_sub(u16 f) {
  if (f < FC_NCOR) return f;
  return (u16)(f - FC_NCOR);
}

u8 fcorner_feat_layer(u16 f) {
  if (fcorner_feat_class(f) == FC_CLS_COR) return FC_COR_LAYER[fcorner_feat_sub(f)];
  return FC_NODE_LAYER[fcorner_feat_sub(f)];
}

u8 fcorner_feat_tier(u16 f) {
  if (fcorner_feat_class(f) == FC_CLS_COR) return FC_COR_TIER[fcorner_feat_sub(f)];
  return FC_NODE_TIER[fcorner_feat_sub(f)];
}

u16 fcorner_feat_name(u16 f) {
  if (fcorner_feat_class(f) == FC_CLS_COR) return FC_COR_NAME[fcorner_feat_sub(f)];
  return FC_NODE_NAME[fcorner_feat_sub(f)];
}

u16 fcorner_feat_kind(u16 f) {
  if (fcorner_feat_class(f) == FC_CLS_COR) return 0;
  return FC_NODE_KIND[fcorner_feat_sub(f)];
}

u8 fcorner_feat_reg(u16 f) {
  if (fcorner_feat_class(f) == FC_CLS_COR) return 0;
  return FC_NODE_REG[fcorner_feat_sub(f)];
}

/* First and last vertex of a polyline feature; nodes report a zero-length run. */
static u16 feat_v0(u16 f) {
  if (fcorner_feat_class(f) == FC_CLS_COR) return FC_COR_OFF[fcorner_feat_sub(f)];
  return fcorner_feat_sub(f);
}

static u16 feat_v1(u16 f) {
  if (fcorner_feat_class(f) == FC_CLS_COR) return FC_COR_OFF[fcorner_feat_sub(f) + 1];
  return (u16)(fcorner_feat_sub(f) + 1);
}

static u16 vert_lon(u8 cls, u16 v) {
  if (cls == FC_CLS_COR) return FC_PT[v * 2];
  return FC_NODE_Q[v * 2];
}

static u16 vert_lat(u8 cls, u16 v) {
  if (cls == FC_CLS_COR) return FC_PT[v * 2 + 1];
  return FC_NODE_Q[v * 2 + 1];
}

u16 fcorner_feat_qlon(u16 f) {
  u8 cls;
  u16 v;
  u16 a;
  u16 b;
  u16 lo;
  u16 hi;
  cls = fcorner_feat_class(f);
  a = feat_v0(f);
  b = feat_v1(f);
  lo = 65535;
  hi = 0;
  for (v = a; v < b; v++) {
    if (vert_lon(cls, v) < lo) lo = vert_lon(cls, v);
    if (vert_lon(cls, v) > hi) hi = vert_lon(cls, v);
  }
  if (b <= a) return vert_lon(cls, a);
  return (u16)((lo + hi) >> 1);
}

u16 fcorner_feat_qlat(u16 f) {
  u8 cls;
  u16 v;
  u16 a;
  u16 b;
  u16 lo;
  u16 hi;
  cls = fcorner_feat_class(f);
  a = feat_v0(f);
  b = feat_v1(f);
  lo = 65535;
  hi = 0;
  for (v = a; v < b; v++) {
    if (vert_lat(cls, v) < lo) lo = vert_lat(cls, v);
    if (vert_lat(cls, v) > hi) hi = vert_lat(cls, v);
  }
  if (b <= a) return vert_lat(cls, a);
  return (u16)((lo + hi) >> 1);
}

i32 fcorner_feat_elev(u16 f) {
  if (fcorner_feat_class(f) == FC_CLS_COR) return 0;
  return (i32)FC_NODE_ELEV[fcorner_feat_sub(f)];
}

i32 fcorner_feat_depth(u16 f) {
  if (fcorner_feat_class(f) == FC_CLS_COR) return 0;
  return (i32)FC_NODE_DEPTH[fcorner_feat_sub(f)];
}

u8 fcorner_layer_on(u8 i) {
  return FC_LAYON[i];
}

static u8 feat_visible(u16 f) {
  return FC_LAYON[fcorner_feat_layer(f)];
}

u16 fcorner_layer_name(u8 i) {
  if (i >= FC_NLAYER) return 0;
  return FC_LAYER_NAME[i];
}

u8 fcorner_layer_kind(u8 i) {
  if (i >= FC_NLAYER) return 0;
  return FC_LAYER_KIND[i];
}

u16 fcorner_visible(void) {
  u16 i;
  u16 n;
  n = 0;
  for (i = 0; i < FC_NFEAT; i++) {
    if (feat_visible(i) != 0) n = (u16)(n + 1);
  }
  return n;
}

static u16 layer_count(u8 l) {
  u16 i;
  u16 n;
  n = 0;
  for (i = 0; i < FC_NFEAT; i++) {
    if (fcorner_feat_layer(i) == l) n = (u16)(n + 1);
  }
  return n;
}

static u8 tier_label(u8 tier) {
  if (tier == FC_TIER_COMMUNITY) return FC_STY_DASH;
  if (tier == FC_TIER_CONTEXT) return FC_STY_DOT;
  return FC_STY_SOLID;
}

/* ------------------------------------------------------------- primitives */

/* Clip rectangle. The map draws lines that run to the frame edge, and without
   this they would scribble over the status bar and the footer. */
static int CLIP_X0;
static int CLIP_Y0;
static int CLIP_X1;
static int CLIP_Y1;

static void clip_full(void) {
  CLIP_X0 = 0;
  CLIP_Y0 = 0;
  CLIP_X1 = (int)SK_W - 1;
  CLIP_Y1 = (int)SK_H - 1;
}

static void clip_set(int x0, int y0, int x1, int y1) {
  CLIP_X0 = x0;
  CLIP_Y0 = y0;
  CLIP_X1 = x1;
  CLIP_Y1 = y1;
}

static void px(int x, int y, u8 mode) {
  if (x < CLIP_X0) return;
  if (y < CLIP_Y0) return;
  if (x > CLIP_X1) return;
  if (y > CLIP_Y1) return;
  fb_px((u16)x, (u16)y, mode);
}

/* Bresenham with a dash pattern. The pattern IS the evidence tier: on a 1-bit
   LCD there is no colour left to carry it. */
static void line_sty(int x0, int y0, int x1, int y1, u8 sty) {
  int x;
  int y;
  int dx;
  int dy;
  int sx;
  int sy;
  int err;
  int e2;
  int n;
  if (x0 < -400 && x1 < -400) return;
  if (y0 < -400 && y1 < -400) return;
  if (x0 > (int)SK_W + 400 && x1 > (int)SK_W + 400) return;
  if (y0 > (int)SK_H + 400 && y1 > (int)SK_H + 400) return;
  x = x0;
  y = y0;
  dx = iabs(x1 - x0);
  dy = iabs(y1 - y0);
  if (x0 < x1) sx = 1;
  else sx = -1;
  if (y0 < y1) sy = 1;
  else sy = -1;
  err = dx - dy;
  n = 0;
  while (1) {
    if (sty == FC_STY_SOLID) px(x, y, PX_SET);
    else if (sty == FC_STY_DASH) {
      if ((n & 3) != 3) px(x, y, PX_SET);
    } else {
      if ((n & 3) == 0) px(x, y, PX_SET);
    }
    if (x == x1 && y == y1) break;
    e2 = err * 2;
    if (e2 > -dy) {
      err = err - dy;
      x = x + sx;
    }
    if (e2 < dx) {
      err = err + dx;
      y = y + sy;
    }
    n = n + 1;
  }
}

static void marker(int x, int y, u8 tier) {
  int i;
  int j;
  if (tier == FC_TIER_CONTEXT) {
    px(x, y, PX_SET);
    px(x - 1, y - 1, PX_SET);
    px(x + 1, y + 1, PX_SET);
    return;
  }
  if (tier == FC_TIER_OFFICIAL) {
    if (SK_W < 128) {
      /* a filled 3x3 eats a thirtieth of a 96 px screen: use a plus */
      px(x, y, PX_SET);
      px(x - 1, y, PX_SET);
      px(x + 1, y, PX_SET);
      px(x, y - 1, PX_SET);
      px(x, y + 1, PX_SET);
      return;
    }
    for (j = -1; j <= 1; j++) {
      for (i = -1; i <= 1; i++) px(x + i, y + j, PX_SET);
    }
    return;
  }
  if (SK_W < 128) {
    px(x, y, PX_SET);
    px(x - 1, y, PX_SET);
    px(x + 1, y, PX_SET);
    return;
  }
  for (i = -1; i <= 1; i++) {
    px(x + i, y - 1, PX_SET);
    px(x + i, y + 1, PX_SET);
  }
  px(x - 1, y, PX_SET);
  px(x + 1, y, PX_SET);
}

/* The register is 46 dots of community tier; hollow boxes everywhere would
   read as noise, so register rows draw one pixel plus a tail. */
static void marker_reg(int x, int y) {
  px(x, y, PX_SET);
  px(x - 1, y, PX_SET);
}

static void crosshair(int x, int y) {
  int i;
  for (i = 2; i <= 5; i++) {
    px(x - i, y, PX_SET);
    px(x + i, y, PX_SET);
    px(x, y - i, PX_SET);
    px(x, y + i, PX_SET);
  }
  px(x - 5, y - 5, PX_SET);
  px(x + 5, y - 5, PX_SET);
  px(x - 5, y + 5, PX_SET);
  px(x + 5, y + 5, PX_SET);
}

/* The web app's octahedron beacon at the surveyed quadripoint. */
static void beacon(int x, int y) {
  line_sty(x, y - 3, x + 3, y, FC_STY_SOLID);
  line_sty(x + 3, y, x, y + 3, FC_STY_SOLID);
  line_sty(x, y + 3, x - 3, y, FC_STY_SOLID);
  line_sty(x - 3, y, x, y - 3, FC_STY_SOLID);
}

static u16 scr_label(void) {
  if (FC_SCREEN == FC_SCR_MAP) return FL_MAP;
  if (FC_SCREEN == FC_SCR_PROF) return FL_PROF;
  if (FC_SCREEN == FC_SCR_LAYERS) return FL_LAYERS;
  if (FC_SCREEN == FC_SCR_DOS) return FL_DOS;
  if (FC_SCREEN == FC_SCR_INFO) return FL_INFO;
  return FL_TITLE;
}

u16 fc_dev_label(u8 dev) {
  if (dev == DEV_TI89) return FL_TI89;
  if (dev == DEV_TI92) return FL_TI92;
  if (dev == DEV_HOST) return FL_HOST;
  return FL_TI83;
}

u16 fc_dev_cpu(u8 dev) {
  if (dev == DEV_TI89) return FL_M68K;
  if (dev == DEV_TI92) return FL_M68K;
  return FL_Z80;
}

u16 fc_dev_ram(u8 dev) {
  if (dev == DEV_TI89) return 256;
  if (dev == DEV_TI92) return 128;
  return 32;
}

static void draw_status(void) {
  u8 buf[48];
  u16 x;
  fb_box(0, 0, SK_W, 8, FILL_SOLID);
  fc_str(buf, scr_label());
  fb_textm(2, 2, buf, PX_CLEAR);
  fc_str(buf, fc_dev_label(SK_DEV));
  x = (u16)(SK_W - 2 - fb_text_w(buf));
  if (x < 40) x = 40;
  fb_textm(x, 2, buf, PX_CLEAR);
}

static void draw_footer(const u8 *s) {
  u16 y;
  y = (u16)(SK_H - 9);
  fb_hline(0, (u16)(SK_W - 1), y, PX_SET);
  fb_text(2, (u16)(y + 2), s);
}

static u16 line_chars(void) {
  return (u16)idiv((int)SK_W - 4, 4);
}

/* ----------------------------------------------------------------- screens */

static void render_boot(void) {
  u8 buf[72];
  u16 y;
  u16 n;
  u16 cx;
  y = (u16)idiv((int)SK_H - 50, 2);
  if (y < 3) y = 3;
  fc_str(buf, FL_TITLE);
  if (fb_text_w(buf) * 2 < SK_W) {
    cx = (u16)idiv((int)SK_W - (int)fb_text_w(buf) * 2, 2);
    fb_text2(cx, y, buf);
    y = (u16)(y + 13);
  } else {
    fc_str(buf, FL_FOUR);
    cx = (u16)idiv((int)SK_W - (int)fb_text_w(buf) * 2, 2);
    fb_text2(cx, y, buf);
    fc_str(buf, FL_CORNERS);
    cx = (u16)idiv((int)SK_W - (int)fb_text_w(buf) * 2, 2);
    fb_text2(cx, (u16)(y + 12), buf);
    y = (u16)(y + 25);
  }
  fb_hline(2, (u16)(SK_W - 3), y, PX_SET);
  y = (u16)(y + 4);
  fc_str(buf, FL_SUB);
  fb_text(2, y, buf);
  y = (u16)(y + 7);

  n = fc_str_at(buf, 0, fc_dev_label(SK_DEV));
  buf[n] = 32;
  n = (u16)(n + 1);
  n = (u16)(n + fc_str_at(buf, n, FL_LCD));
  n = (u16)(n + fc_num_at(buf, n, (i32)SK_W));
  buf[n] = 88;
  n = (u16)(n + 1);
  n = (u16)(n + fc_num_at(buf, n, (i32)SK_H));
  fb_text(2, y, buf);
  y = (u16)(y + 7);

  n = fc_num_at(buf, 0, (i32)FC_NFEAT);
  buf[n] = 32;
  n = (u16)(n + 1);
  n = (u16)(n + fc_str_at(buf, n, FL_SITES));
  n = (u16)(n + fc_num_at(buf, n, (i32)FC_NSITE));
  buf[n] = 32;
  n = (u16)(n + 1);
  n = (u16)(n + fc_str_at(buf, n, FL_REG));
  n = (u16)(n + fc_num_at(buf, n, (i32)FC_NREG));
  fb_text(2, y, buf);
  y = (u16)(y + 7);

  fc_str(buf, FL_PRESS);
  fb_text(2, y, buf);
}

static void map_footer(void) {
  u8 buf[72];
  u16 n;
  u16 lim;
  i32 d;
  n = fc_str_at(buf, 0, fcorner_feat_name(FC_SEL));
  buf[n] = 32;
  n = (u16)(n + 1);
  d = fcorner_feat_depth(FC_SEL);
  if (fcorner_feat_class(FC_SEL) == FC_CLS_COR) {
    n = (u16)(n + fc_num_at(buf, n, (i32)FC_COR_KM[fcorner_feat_sub(FC_SEL)]));
    n = (u16)(n + fc_str_at(buf, n, FL_KM));
  } else if (d != 0) {
    n = (u16)(n + fc_num_at(buf, n, d));
    n = (u16)(n + fc_str_at(buf, n, FL_M));
  } else {
    n = (u16)(n + fc_num_at(buf, n, fcorner_feat_elev(FC_SEL)));
    n = (u16)(n + fc_str_at(buf, n, FL_M));
  }
  lim = line_chars();
  if (n > lim) buf[lim] = 0;
  draw_footer(buf);
}

static void render_map(void) {
  u8 buf[24];
  u16 c;
  u16 v;
  u16 a;
  u16 b;
  u8 sty;
  fc_view();
  fb_rect(0, 9, SK_W, (u16)(SK_H - 18), PX_SET);
  clip_set(1, 10, (int)SK_W - 2, (int)SK_H - 12);

  for (c = 0; c < FC_NCOR; c++) {
    if (FC_LAYON[FC_COR_LAYER[c]] == 0) continue;
    sty = tier_label(FC_COR_TIER[c]);
    a = FC_COR_OFF[c];
    b = FC_COR_OFF[c + 1];
    for (v = a; v + 1 < b; v++) {
      line_sty(fc_px(FC_PT[v * 2]), fc_py(FC_PT[v * 2 + 1]),
               fc_px(FC_PT[v * 2 + 2]), fc_py(FC_PT[v * 2 + 3]), sty);
    }
  }

  /* The surveyed quadripoint beacon: legally final, so it never blinks out
     with the register the way tier markers do. */
  if (FC_LAYON[FC_NODE_LAYER[0]] != 0 || FC_LAYON[1] != 0) {
    beacon(fc_px((u16)FC_QUAD_LON_Q), fc_py((u16)FC_QUAD_LAT_Q));
  }

  for (c = 0; c < FC_NNODE; c++) {
    if (FC_LAYON[FC_NODE_LAYER[c]] == 0) continue;
    if (FC_NODE_REG[c] != 0) {
      marker_reg(fc_px(FC_NODE_Q[c * 2]), fc_py(FC_NODE_Q[c * 2 + 1]));
    } else {
      marker(fc_px(FC_NODE_Q[c * 2]), fc_py(FC_NODE_Q[c * 2 + 1]), FC_NODE_TIER[c]);
    }
  }

  crosshair(fc_px(fcorner_feat_qlon(FC_SEL)), fc_py(fcorner_feat_qlat(FC_SEL)));
  clip_full();

  fc_str(buf, FL_ZOOM);
  fc_num_at(buf, 1, (i32)(1 << FC_ZOOM));
  fb_box((u16)(SK_W - 20), 10, 18, 7, FILL_CLEAR);
  fb_text((u16)(SK_W - 18), 11, buf);
  map_footer();
}

/* ------------------------------------------------------------ the section */

/* Sample the terrain along the selected route (or across the frame) and cache
   it. 31 IDW weights per sample is affordable once, not once per frame. */
static void prof_build(void) {
  u16 i;
  u16 n;
  u16 a;
  u16 b;
  u16 v;
  u8 cls;
  i32 q0lon;
  i32 q1lon;
  i32 qlon;
  i32 qlat;
  i32 e;
  i32 total;
  i32 want;
  i32 acc;
  i32 seg;
  i32 dx;
  i32 dy;
  cls = fcorner_feat_class(FC_SEL);
  n = (u16)(SK_W - 8);
  if (n > FC_PROF_MAX) n = FC_PROF_MAX;
  if (n < 8) n = 8;
  PROF_N = n;
  PROF_DIRTY = 0;

  a = feat_v0(FC_SEL);
  b = feat_v1(FC_SEL);
  if (FC_PROFMODE == 1 || cls != FC_CLS_COR) {
    /* W-E transect: the whole frame in transect mode, +-0.7 deg (half the
       theater) around the feature otherwise. Mirrors the app's minimap. */
    qlat = (i32)fcorner_feat_qlat(FC_SEL);
    if (FC_PROFMODE == 1) {
      q0lon = 0;
      q1lon = FC_SPAN_LON;
    } else {
      q0lon = (i32)fcorner_feat_qlon(FC_SEL) - 1400;
      q1lon = (i32)fcorner_feat_qlon(FC_SEL) + 1400;
      if (q0lon < 0) q0lon = 0;
      if (q1lon > (i32)FC_SPAN_LON) q1lon = FC_SPAN_LON;
      if (q1lon - q0lon < 400) {
        q0lon = 0;
        q1lon = FC_SPAN_LON;
      }
    }
    for (i = 0; i < n; i++) {
      qlon = q0lon + idiv32((q1lon - q0lon) * (i32)i, (i32)(n - 1));
      PROF_E[i] = (i16)fc_elev_q(qlon, qlat);
    }
    PROF_KM = fc_km_span(q1lon - q0lon, 0);
  } else {
    /* Along the route, resampled by arc length. */
    total = 0;
    for (v = a; v + 1 < b; v++) {
      dx = (i32)FC_PT[v * 2 + 2] - (i32)FC_PT[v * 2];
      dy = (i32)FC_PT[v * 2 + 3] - (i32)FC_PT[v * 2 + 1];
      total = total + (i32)fc_km_span(dx, dy);
    }
    if (total < 1) total = 1;
    PROF_KM = (u16)total;
    for (i = 0; i < n; i++) {
      want = idiv32(total * (i32)i, (i32)(n - 1));
      acc = 0;
      qlon = (i32)FC_PT[a * 2];
      qlat = (i32)FC_PT[a * 2 + 1];
      for (v = a; v + 1 < b; v++) {
        dx = (i32)FC_PT[v * 2 + 2] - (i32)FC_PT[v * 2];
        dy = (i32)FC_PT[v * 2 + 3] - (i32)FC_PT[v * 2 + 1];
        seg = (i32)fc_km_span(dx, dy);
        if (acc + seg >= want || v + 2 == b) {
          if (seg < 1) seg = 1;
          qlon = (i32)FC_PT[v * 2] + idiv32(dx * (want - acc), seg);
          qlat = (i32)FC_PT[v * 2 + 1] + idiv32(dy * (want - acc), seg);
          break;
        }
        acc = acc + seg;
      }
      PROF_E[i] = (i16)fc_elev_q(qlon, qlat);
    }
  }

  PROF_LO = 32000;
  PROF_HI = -32000;
  for (i = 0; i < n; i++) {
    e = (i32)PROF_E[i];
    if (e < PROF_LO) PROF_LO = e;
    if (e > PROF_HI) PROF_HI = e;
  }
  if (PROF_HI - PROF_LO < 200) PROF_HI = PROF_LO + 200;
}

void fcorner_set_zoom(u8 z) {
  if (z > 3) z = 3;
  FC_ZOOM = z;
}

void fcorner_set_depthx(u8 d) {
  if (d > 3) d = 3;
  FC_DEPTHX = d;
}

void fcorner_set_profmode(u8 m) {
  if (m > 1) m = 1;
  FC_PROFMODE = m;
  PROF_DIRTY = 1;
}

void fcorner_set_laycur(u8 i) {
  if (i >= FC_NLAYER) i = 0;
  FC_LAYCUR = i;
}

u16 fc_prof_km(void) {
  if (PROF_DIRTY != 0) prof_build();
  return PROF_KM;
}

u16 fc_prof_n(void) {
  if (PROF_DIRTY != 0) prof_build();
  return PROF_N;
}

i32 fc_prof_elev(u16 i) {
  if (PROF_DIRTY != 0) prof_build();
  if (i >= PROF_N) return 0;
  return (i32)PROF_E[i];
}

static i32 depth_gain(void) {
  if (FC_DEPTHX == 0) return 5;
  if (FC_DEPTHX == 1) return 10;
  if (FC_DEPTHX == 2) return 20;
  return 40;
}

static void render_prof(void) {
  u8 buf[72];
  u16 i;
  u16 n;
  u16 top;
  u16 bot;
  u16 mid;
  u16 eband;
  u16 dband;
  int gy;
  int py2;
  int prev;
  int j;
  i32 e;
  i32 mag;
  i32 maxmag;
  i32 dpx;
  u16 nn;
  if (PROF_DIRTY != 0) prof_build();
  n = PROF_N;
  top = 10;
  bot = (u16)(SK_H - 11);
  eband = (u16)idiv((int)(bot - top) * 6, 10);
  mid = (u16)(top + eband);
  dband = (u16)(bot - mid);
  maxmag = (i32)fc_depth_mag_q8(3000);
  clip_set(1, (int)top, (int)SK_W - 2, (int)bot);

  /* The terrain layer gates the relief itself: with layer 0 off the section
     shows only the hung feature, which is the honest reading of the toggle. */
  if (FC_LAYON[0] != 0) {
    prev = -1;
    for (i = 0; i < n; i++) {
      e = (i32)PROF_E[i];
      gy = (int)mid - (int)idiv32((e - PROF_LO) * (i32)eband, PROF_HI - PROF_LO);
      /* rock below the ground line, dithered so it reads as fill, not as ink */
      for (j = gy + 2; j < (int)bot; j++) {
        if (((j + (int)i) & 3) == 0) px((int)i + 4, j, PX_SET);
      }
      if (prev >= 0) line_sty((int)i + 3, prev, (int)i + 4, gy, FC_STY_SOLID);
      px((int)i + 4, gy, PX_SET);
      prev = gy;
    }
  }

  /* The buried thing itself, hung under the terrain on the log depth ramp:
     the Aneth reservoir and McElmo Dome's CO2 are the two that have one. */
  e = fcorner_feat_depth(FC_SEL);
  if (e != 0) {
    mag = (i32)fc_depth_mag_q8(e);
    dpx = idiv32(mag * (i32)dband * depth_gain(), maxmag * 10);
    if (dpx > (i32)dband - 2) dpx = (i32)dband - 2;
    if (dpx < 2) dpx = 2;
    prev = -1;
    for (i = 0; i < n; i++) {
      gy = (int)mid - (int)idiv32(((i32)PROF_E[i] - PROF_LO) * (i32)eband, PROF_HI - PROF_LO);
      if (FC_LAYON[0] == 0) gy = (int)mid;
      py2 = gy + (int)dpx;
      px((int)i + 4, py2 - 1, PX_CLEAR);
      px((int)i + 4, py2 + 1, PX_CLEAR);
      if (prev >= 0) line_sty((int)i + 3, prev, (int)i + 4, py2, FC_STY_DASH);
      prev = py2;
    }
  }
  clip_full();

  /* MAX 3463M  DEP -1700M  254KM */
  nn = fc_str_at(buf, 0, FL_MAX);
  nn = (u16)(nn + fc_num_at(buf, nn, PROF_HI));
  nn = (u16)(nn + fc_str_at(buf, nn, FL_M));
  buf[nn] = 32;
  nn = (u16)(nn + 1);
  nn = (u16)(nn + fc_str_at(buf, nn, FL_DEPTH));
  nn = (u16)(nn + fc_num_at(buf, nn, e));
  buf[nn] = 32;
  nn = (u16)(nn + 1);
  nn = (u16)(nn + fc_num_at(buf, nn, (i32)PROF_KM));
  nn = (u16)(nn + fc_str_at(buf, nn, FL_KM));
  if (fb_text_w(buf) > SK_W - 4) {
    /* narrow LCD: drop the words, keep the three numbers */
    nn = fc_num_at(buf, 0, PROF_HI);
    nn = (u16)(nn + fc_str_at(buf, nn, FL_M));
    buf[nn] = 32;
    nn = (u16)(nn + 1);
    nn = (u16)(nn + fc_num_at(buf, nn, e));
    nn = (u16)(nn + fc_str_at(buf, nn, FL_M));
    buf[nn] = 32;
    nn = (u16)(nn + 1);
    nn = (u16)(nn + fc_num_at(buf, nn, (i32)PROF_KM));
    nn = (u16)(nn + fc_str_at(buf, nn, FL_KM));
  }
  if (nn > line_chars()) buf[line_chars()] = 0;
  draw_footer(buf);

  if (FC_PROFMODE == 1) fc_str(buf, FL_TRANSECT);
  else fc_str(buf, FL_ALONG);
  fb_box(2, 10, (u16)(fb_text_w(buf) + 2), 7, FILL_CLEAR);
  fb_text(3, 11, buf);
}

/* ------------------------------------------------------------- the layers */

static void render_layers(void) {
  u8 buf[72];
  u16 rows;
  u16 first;
  u16 i;
  u16 r;
  u16 y;
  u16 n;
  u16 lim;
  rows = (u16)idiv((int)SK_H - 20, 7);
  if (rows < 1) rows = 1;
  first = 0;
  if (FC_LAYCUR >= rows) first = (u16)(FC_LAYCUR - rows + 1);
  lim = line_chars();
  for (r = 0; r < rows; r++) {
    i = (u16)(first + r);
    if (i >= FC_NLAYER) break;
    y = (u16)(10 + r * 7);
    n = fc_str_at(buf, 0, FC_LAYER_NAME[i]);
    if (n > lim - 6) {
      n = (u16)(lim - 6);
      buf[n] = 0;
    }
    buf[n] = 32;
    n = (u16)(n + 1);
    n = (u16)(n + fc_num_at(buf, n, (i32)layer_count((u8)i)));
    if (n > lim) buf[lim] = 0;
    if (i == FC_LAYCUR) {
      fb_box(0, (u16)(y - 1), SK_W, 7, FILL_SOLID);
      fb_textm(9, y, buf, PX_CLEAR);
      fb_box(2, (u16)(y + 1), 5, 3, FILL_CLEAR);
      if (FC_LAYON[i] != 0) fb_box(3, (u16)(y + 2), 3, 1, FILL_SOLID);
    } else {
      fb_text(9, y, buf);
      fb_rect(2, y, 5, 5, PX_SET);
      if (FC_LAYON[i] != 0) fb_box(3, (u16)(y + 1), 3, 3, FILL_SOLID);
    }
  }
  n = fc_str_at(buf, 0, FL_VIS);
  n = (u16)(n + fc_num_at(buf, n, (i32)fcorner_visible()));
  n = (u16)(n + fc_str_at(buf, n, FL_SLASH));
  n = (u16)(n + fc_num_at(buf, n, (i32)FC_NFEAT));
  draw_footer(buf);
}

/* ------------------------------------------------------------ the dossier */

static u16 wrap_line(u8 *buf, u16 off, u16 start, u16 width) {
  u16 n;
  u16 cut;
  n = 0;
  while (FC_STR[off + start + n] != 0 && n < width) {
    buf[n] = FC_STR[off + start + n];
    n = (u16)(n + 1);
  }
  cut = n;
  if (FC_STR[off + start + n] != 0) {
    while (cut > 0 && buf[cut - 1] != 32) cut = (u16)(cut - 1);
    if (cut == 0) cut = n;
  }
  buf[cut] = 0;
  return cut;
}

static void render_dos(void) {
  u8 buf[72];
  u16 y;
  u16 width;
  u16 start;
  u16 n;
  u16 off;
  u8 cls;
  u16 i;
  i32 d;
  width = line_chars();
  off = fcorner_feat_name(FC_SEL);
  cls = fcorner_feat_class(FC_SEL);
  i = fcorner_feat_sub(FC_SEL);
  y = 10;
  start = 0;
  while (FC_STR[off + start] != 0 && y < SK_H - 40) {
    n = wrap_line(buf, off, start, width);
    fb_text(2, y, buf);
    y = (u16)(y + 7);
    start = (u16)(start + n);
    while (FC_STR[off + start] == 32) start = (u16)(start + 1);
  }
  fb_hline(2, (u16)(SK_W - 3), y, PX_SET);
  y = (u16)(y + 3);

  n = fc_str_at(buf, 0, FL_LAYER);
  n = (u16)(n + fc_str_at(buf, n, FC_LAYER_NAME[fcorner_feat_layer(FC_SEL)]));
  if (n > width) buf[width] = 0;
  fb_text(2, y, buf);
  y = (u16)(y + 7);

  n = fc_str_at(buf, 0, FL_TIER);
  if (fcorner_feat_tier(FC_SEL) == FC_TIER_OFFICIAL) n = (u16)(n + fc_str_at(buf, n, FL_OFFICIAL));
  else if (fcorner_feat_tier(FC_SEL) == FC_TIER_COMMUNITY) n = (u16)(n + fc_str_at(buf, n, FL_COMMUNITY));
  else n = (u16)(n + fc_str_at(buf, n, FL_CONTEXT));
  if (cls == FC_CLS_NODE) {
    buf[n] = 32;
    n = (u16)(n + 1);
    n = (u16)(n + fc_str_at(buf, n, FC_NODE_KIND[i]));
  }
  if (n > width) buf[width] = 0;
  fb_text(2, y, buf);
  y = (u16)(y + 7);

  if (cls == FC_CLS_COR) {
    n = fc_str_at(buf, 0, FL_LEN);
    n = (u16)(n + fc_num_at(buf, n, (i32)FC_COR_KM[i]));
    n = (u16)(n + fc_str_at(buf, n, FL_KM));
  } else {
    n = fc_str_at(buf, 0, FL_ELEV);
    n = (u16)(n + fc_num_at(buf, n, fcorner_feat_elev(FC_SEL)));
    n = (u16)(n + fc_str_at(buf, n, FL_M));
    buf[n] = 32;
    n = (u16)(n + 1);
    n = (u16)(n + fc_num_at(buf, n, idiv32(fcorner_feat_elev(FC_SEL) * 3281, 1000)));
    n = (u16)(n + fc_str_at(buf, n, FL_FT));
  }
  if (n > width) buf[width] = 0;
  fb_text(2, y, buf);
  y = (u16)(y + 7);

  d = fcorner_feat_depth(FC_SEL);
  if (d != 0) {
    n = fc_str_at(buf, 0, FL_DEPTH);
    n = (u16)(n + fc_num_at(buf, n, d));
    n = (u16)(n + fc_str_at(buf, n, FL_M));
    buf[n] = 32;
    n = (u16)(n + 1);
    n = (u16)(n + fc_num_at(buf, n, idiv32(d * 3281, 1000)));
    n = (u16)(n + fc_str_at(buf, n, FL_FT));
    if (n > width) buf[width] = 0;
    fb_text(2, y, buf);
    y = (u16)(y + 7);
  }

  n = fc_str_at(buf, 0, FL_LON);
  n = (u16)(n + fc_deg_at(buf, n, fc_lon_mdeg(fcorner_feat_qlon(FC_SEL))));
  n = (u16)(n + fc_str_at(buf, n, FL_LAT));
  n = (u16)(n + fc_deg_at(buf, n, fc_lat_mdeg(fcorner_feat_qlat(FC_SEL))));
  if (n > width) buf[width] = 0;
  fb_text(2, y, buf);
  y = (u16)(y + 7);

  /* The story sentence (or the register row's note), wrapped into whatever
     room is left above the footer. TI-83 usually has one line; the 68k
     models have three or four. */
  off = 0;
  if (cls == FC_CLS_COR) off = FC_COR_FACT[i];
  else off = FC_NODE_FACT[i];
  if (off != 0) {
    start = 0;
    while (FC_STR[off + start] != 0 && y + 6 < SK_H - 9) {
      n = wrap_line(buf, off, start, width);
      fb_text(2, y, buf);
      y = (u16)(y + 7);
      start = (u16)(start + n);
      while (FC_STR[off + start] == 32) start = (u16)(start + 1);
    }
  }

  if (cls == FC_CLS_COR && fcorner_feat_layer(FC_SEL) == FC_COR_LAYER[0]) fc_str(buf, FL_SURVEY);
  else if (cls == FC_CLS_NODE && FC_NODE_REG[i] != 0) fc_str(buf, FL_REGNOTE);
  else fc_str(buf, FL_NOTDEM);
  if (fb_text_w(buf) > SK_W - 4) fc_str(buf, FL_NOTDEM);
  draw_footer(buf);
}

/* ------------------------------------------------------------- the device */

/* Draws a line of the device sheet only if it clears the footer bar, and
   returns the next baseline. The TI-83 has room for five of the seven. */
static u16 info_row(u16 y, const u8 *buf) {
  if (y + 6 >= SK_H - 9) return y;
  if (fb_text_w(buf) > SK_W - 4) return y;
  fb_text(2, y, buf);
  return (u16)(y + 7);
}

static void render_info(void) {
  u8 buf[72];
  u16 y;
  u16 n;
  y = 11;
  n = fc_str_at(buf, 0, fc_dev_label(SK_DEV));
  buf[n] = 32;
  n = (u16)(n + 1);
  n = (u16)(n + fc_str_at(buf, n, fc_dev_cpu(SK_DEV)));
  y = info_row(y, buf);

  n = fc_str_at(buf, 0, FL_LCD);
  n = (u16)(n + fc_num_at(buf, n, (i32)SK_W));
  buf[n] = 88;
  n = (u16)(n + 1);
  n = (u16)(n + fc_num_at(buf, n, (i32)SK_H));
  buf[n] = 32;
  n = (u16)(n + 1);
  n = (u16)(n + fc_str_at(buf, n, FL_RAM));
  n = (u16)(n + fc_num_at(buf, n, (i32)fc_dev_ram(SK_DEV)));
  buf[n] = 75;
  n = (u16)(n + 1);
  buf[n] = 0;
  y = info_row(y, buf);

  n = fc_str_at(buf, 0, FL_CORR);
  n = (u16)(n + fc_num_at(buf, n, (i32)FC_NCOR));
  buf[n] = 32;
  n = (u16)(n + 1);
  n = (u16)(n + fc_str_at(buf, n, FL_SITES));
  n = (u16)(n + fc_num_at(buf, n, (i32)FC_NSITE));
  y = info_row(y, buf);

  n = fc_str_at(buf, 0, FL_REG);
  n = (u16)(n + fc_num_at(buf, n, (i32)FC_NREG));
  buf[n] = 32;
  n = (u16)(n + 1);
  n = (u16)(n + fc_str_at(buf, n, FL_VERTS));
  n = (u16)(n + fc_num_at(buf, n, (i32)FC_NPT));
  y = info_row(y, buf);

  n = fc_str_at(buf, 0, FL_TER);
  n = (u16)(n + fc_num_at(buf, n, (i32)FC_NTER));
  buf[n] = 32;
  n = (u16)(n + 1);
  n = (u16)(n + fc_str_at(buf, n, FL_IDW));
  n = (u16)(n + fc_str_at(buf, n, FL_QUANT));
  y = info_row(y, buf);

  n = fc_str_at(buf, 0, FL_LAYERSON);
  n = (u16)(n + fc_num_at(buf, n, (i32)fcorner_visible()));
  n = (u16)(n + fc_str_at(buf, n, FL_SLASH));
  n = (u16)(n + fc_num_at(buf, n, (i32)FC_NFEAT));
  y = info_row(y, buf);

  fc_str(buf, FL_XDC);
  y = info_row(y, buf);
  fc_str(buf, FL_NOTDEM);
  draw_footer(buf);
}

/* ------------------------------------------------------------- the driver */

void fcorner_init(u8 dev, u16 w, u16 h) {
  u16 i;
  SK_DEV = dev;
  SK_W = w;
  SK_H = h;
  SK_ROWB = (u16)((w + 7) >> 3);
  SK_FBB = (u16)(SK_ROWB * h);
  if (SK_FBB > FB_MAX) SK_FBB = FB_MAX;
  SK_TICK = 0;
  SK_QUIT = 0;
  FC_SCREEN = FC_SCR_BOOT;
  FC_SEL = 0;
  /* 70 nodes across 96 px is a smudge; the TI-83 opens one step in. */
  FC_ZOOM = 0;
  if (w < 128) FC_ZOOM = 1;
  FC_DEPTHX = 1;
  FC_PROFMODE = 0;
  FC_LAYCUR = 0;
  for (i = 0; i < FC_NLAYER; i++) FC_LAYON[i] = FC_LAYER_ON[i];
  PROF_DIRTY = 1;
  PROF_N = 0;
  PROF_KM = 0;
  PROF_LO = 0;
  PROF_HI = 0;
  fc_view();
}

static void sel_step(int dir) {
  u16 i;
  u16 f;
  f = FC_SEL;
  for (i = 0; i < FC_NFEAT; i++) {
    if (dir > 0) f = (u16)((f + 1) % FC_NFEAT);
    else if (f == 0) f = (u16)(FC_NFEAT - 1);
    else f = (u16)(f - 1);
    if (feat_visible(f) != 0) break;
  }
  FC_SEL = f;
  PROF_DIRTY = 1;
}

void fcorner_set_sel(u16 f) {
  FC_SEL = (u16)(f % FC_NFEAT);
  PROF_DIRTY = 1;
}

u16 fcorner_get_sel(void) {
  return FC_SEL;
}

void fcorner_toggle_layer(u8 i) {
  if (i >= FC_NLAYER) return;
  if (FC_LAYON[i] != 0) FC_LAYON[i] = 0;
  else FC_LAYON[i] = 1;
  PROF_DIRTY = 1;
}

void fcorner_set_screen(u8 scr) {
  if (scr >= FC_NSCREEN) scr = FC_SCR_BOOT;
  FC_SCREEN = scr;
}

u8 fcorner_get_screen(void) {
  return FC_SCREEN;
}

static void map_key(u8 k) {
  if (k == SKK_LEFT) sel_step(-1);
  else if (k == SKK_RIGHT) sel_step(1);
  else if (k == SKK_UP) {
    if (FC_ZOOM < 3) FC_ZOOM = (u8)(FC_ZOOM + 1);
  } else if (k == SKK_DOWN) {
    if (FC_ZOOM > 0) FC_ZOOM = (u8)(FC_ZOOM - 1);
  } else if (k == SKK_ENTER) {
    FC_SCREEN = FC_SCR_DOS;
  } else if (k == SKK_ACT) {
    FC_SCREEN = FC_SCR_PROF;
  }
}

static void prof_key(u8 k) {
  if (k == SKK_LEFT) sel_step(-1);
  else if (k == SKK_RIGHT) sel_step(1);
  else if (k == SKK_UP) {
    if (FC_DEPTHX < 3) FC_DEPTHX = (u8)(FC_DEPTHX + 1);
  } else if (k == SKK_DOWN) {
    if (FC_DEPTHX > 0) FC_DEPTHX = (u8)(FC_DEPTHX - 1);
  } else if (k == SKK_ACT) {
    if (FC_PROFMODE != 0) FC_PROFMODE = 0;
    else FC_PROFMODE = 1;
    PROF_DIRTY = 1;
  } else if (k == SKK_ENTER) {
    FC_SCREEN = FC_SCR_DOS;
  }
}

static void layers_key(u8 k) {
  u16 i;
  if (k == SKK_UP) {
    if (FC_LAYCUR == 0) FC_LAYCUR = (u8)(FC_NLAYER - 1);
    else FC_LAYCUR = (u8)(FC_LAYCUR - 1);
  } else if (k == SKK_DOWN) {
    FC_LAYCUR = (u8)((FC_LAYCUR + 1) % FC_NLAYER);
  } else if (k == SKK_ENTER) {
    fcorner_toggle_layer(FC_LAYCUR);
  } else if (k == SKK_ACT) {
    /* all on, or back to the web app's own defaults */
    if (fcorner_visible() == FC_NFEAT) {
      for (i = 0; i < FC_NLAYER; i++) FC_LAYON[i] = FC_LAYER_ON[i];
    } else {
      for (i = 0; i < FC_NLAYER; i++) FC_LAYON[i] = 1;
    }
    PROF_DIRTY = 1;
  } else if (k == SKK_LEFT) {
    sel_step(-1);
  } else if (k == SKK_RIGHT) {
    sel_step(1);
  }
}

void fcorner_key(u8 k) {
  if (k == SKK_EXIT) {
    SK_QUIT = 1;
    return;
  }
  if (FC_SCREEN == FC_SCR_BOOT) {
    if (k != SKK_NONE) FC_SCREEN = FC_SCR_MAP;
    return;
  }
  if (k == SKK_1) {
    FC_SCREEN = FC_SCR_MAP;
    return;
  }
  if (k == SKK_2) {
    FC_SCREEN = FC_SCR_PROF;
    return;
  }
  if (k == SKK_3) {
    FC_SCREEN = FC_SCR_LAYERS;
    return;
  }
  if (k == SKK_4) {
    FC_SCREEN = FC_SCR_DOS;
    return;
  }
  if (k == SKK_5) {
    FC_SCREEN = FC_SCR_INFO;
    return;
  }
  if (FC_SCREEN == FC_SCR_MAP) map_key(k);
  else if (FC_SCREEN == FC_SCR_PROF) prof_key(k);
  else if (FC_SCREEN == FC_SCR_LAYERS) layers_key(k);
  else if (FC_SCREEN == FC_SCR_DOS) {
    if (k == SKK_LEFT) sel_step(-1);
    else if (k == SKK_RIGHT) sel_step(1);
    else if (k == SKK_ENTER) FC_SCREEN = FC_SCR_MAP;
    else if (k == SKK_ACT) FC_SCREEN = FC_SCR_PROF;
  } else if (FC_SCREEN == FC_SCR_INFO) {
    if (k == SKK_ENTER) FC_SCREEN = FC_SCR_MAP;
  }
}

void fcorner_tick(void) {
  SK_TICK = (u16)((SK_TICK + 1) & 0xFFFF);
}

void fcorner_render(void) {
  fb_clear();
  clip_full();
  if (FC_SCREEN == FC_SCR_BOOT) {
    render_boot();
    return;
  }
  draw_status();
  if (FC_SCREEN == FC_SCR_MAP) render_map();
  else if (FC_SCREEN == FC_SCR_PROF) render_prof();
  else if (FC_SCREEN == FC_SCR_LAYERS) render_layers();
  else if (FC_SCREEN == FC_SCR_DOS) render_dos();
  else render_info();
}
