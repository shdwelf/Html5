/* core/app.c — SOCAL SUBSURFACE, five screens on a 1-bit LCD.
 *
 * The web app is a three.js theater with picture-in-picture panels: HUD,
 * LAYERS, OVERLAYS, DOSSIER and PLAN VIEW. Strip the WebGL and that is a plan
 * view, a cross-section, a layer register, a dossier and a device readout —
 * which is exactly what a calculator can hold.
 *
 *   1 MAP      plan view: coastline, corridors, rings, sites, selection
 *   2 SECTION  the subsurface screen: terrain profile + the pipe under it
 *   3 LAYERS   the 20-layer register, on/off, counts
 *   4 DOSSIER  the selected feature in full
 *   5 DEVICE   model, LCD, RAM and what the dataset actually contains
 *
 * Evidence tiers survive the loss of colour: official draws solid, community
 * dashed, context dotted, the same hygiene the web app enforces with colour.
 */
#include "socal.h"

/* Live globals of the shared 1-bit runtime (calc/core/fb.c reads these). */
u16 SK_W;
u16 SK_H;
u16 SK_ROWB;
u16 SK_FBB;
u8 SK_DEV;
u16 SK_TICK;
u8 SK_QUIT;

u8 SC_SCREEN;
u16 SC_SEL;
u8 SC_ZOOM;
u8 SC_DEPTHX;
u8 SC_PROFMODE;
u8 SC_LAYCUR;
u8 SC_DOSLINE;
u8 SC_LAYON[SC_NLAYER];

static i16 PROF_E[SC_PROF_MAX];
static u16 PROF_N;
static i32 PROF_LO;
static i32 PROF_HI;
static u16 PROF_KM;
static u8 PROF_DIRTY;

/* --------------------------------------------------------------- strings */

u16 sc_str(u8 *dst, u16 off) {
  u16 n;
  n = 0;
  while (SC_STR[off + n] != 0) {
    dst[n] = SC_STR[off + n];
    n = n + 1;
  }
  dst[n] = 0;
  return n;
}

u16 sc_str_at(u8 *dst, u16 at, u16 off) {
  u16 n;
  n = 0;
  while (SC_STR[off + n] != 0) {
    dst[at + n] = SC_STR[off + n];
    n = n + 1;
  }
  dst[at + n] = 0;
  return n;
}

/* num_to() in the shared runtime tops out at a u16; longitudes in 1/1000
   degree do not fit in one, so this port prints the full 32-bit range. */
u16 sc_num_at(u8 *dst, u16 at, i32 v) {
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

/* 1/1000 degree -> "-118.240" */
u16 sc_deg_at(u8 *dst, u16 at, i32 mdeg) {
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
  n = (u16)(n + sc_num_at(dst, (u16)(at + n), w));
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

u16 socal_feat_count(void) {
  return SC_NFEAT;
}

u8 socal_feat_class(u16 f) {
  if (f < SC_NCOR) return SC_CLS_COR;
  if (f < SC_NCOR + SC_NNODE) return SC_CLS_NODE;
  return SC_CLS_RING;
}

u16 socal_feat_sub(u16 f) {
  if (f < SC_NCOR) return f;
  if (f < SC_NCOR + SC_NNODE) return (u16)(f - SC_NCOR);
  return (u16)(f - SC_NCOR - SC_NNODE);
}

u8 socal_feat_layer(u16 f) {
  u8 cls;
  u16 i;
  cls = socal_feat_class(f);
  i = socal_feat_sub(f);
  if (cls == SC_CLS_COR) return SC_COR_LAYER[i];
  if (cls == SC_CLS_NODE) return SC_NODE_LAYER[i];
  return SC_RING_LAYER[i];
}

u8 socal_feat_tier(u16 f) {
  u8 cls;
  u16 i;
  cls = socal_feat_class(f);
  i = socal_feat_sub(f);
  if (cls == SC_CLS_COR) return SC_COR_TIER[i];
  if (cls == SC_CLS_NODE) return SC_NODE_TIER[i];
  return SC_RING_TIER[i];
}

u16 socal_feat_name(u16 f) {
  u8 cls;
  u16 i;
  cls = socal_feat_class(f);
  i = socal_feat_sub(f);
  if (cls == SC_CLS_COR) return SC_COR_NAME[i];
  if (cls == SC_CLS_NODE) return SC_NODE_NAME[i];
  return SC_RING_NAME[i];
}

i32 socal_feat_depth(u16 f) {
  u8 cls;
  u16 i;
  cls = socal_feat_class(f);
  i = socal_feat_sub(f);
  if (cls == SC_CLS_COR) return (i32)SC_COR_DEPTH[i];
  if (cls == SC_CLS_NODE) return (i32)SC_NODE_DEPTH[i];
  return 0;
}

/* First and last vertex of a polyline feature; nodes report a zero-length run. */
static u16 feat_v0(u16 f) {
  u8 cls;
  u16 i;
  cls = socal_feat_class(f);
  i = socal_feat_sub(f);
  if (cls == SC_CLS_COR) return SC_COR_OFF[i];
  if (cls == SC_CLS_RING) return SC_RING_OFF[i];
  return i;
}

static u16 feat_v1(u16 f) {
  u8 cls;
  u16 i;
  cls = socal_feat_class(f);
  i = socal_feat_sub(f);
  if (cls == SC_CLS_COR) return SC_COR_OFF[i + 1];
  if (cls == SC_CLS_RING) return SC_RING_OFF[i + 1];
  return (u16)(i + 1);
}

static u16 vert_lon(u8 cls, u16 v) {
  if (cls == SC_CLS_COR) return SC_PT[v * 2];
  if (cls == SC_CLS_RING) return SC_RING_PT[v * 2];
  return SC_NODE_Q[v * 2];
}

static u16 vert_lat(u8 cls, u16 v) {
  if (cls == SC_CLS_COR) return SC_PT[v * 2 + 1];
  if (cls == SC_CLS_RING) return SC_RING_PT[v * 2 + 1];
  return SC_NODE_Q[v * 2 + 1];
}

u16 socal_feat_qlon(u16 f) {
  u8 cls;
  u16 v;
  u16 a;
  u16 b;
  u16 lo;
  u16 hi;
  cls = socal_feat_class(f);
  a = feat_v0(f);
  b = feat_v1(f);
  lo = 65535;
  hi = 0;
  for (v = a; v < b; v++) {
    if (vert_lon(cls, v) < lo) lo = vert_lon(cls, v);
    if (vert_lon(cls, v) > hi) hi = vert_lon(cls, v);
  }
  return (u16)((lo + hi) >> 1);
}

u16 socal_feat_qlat(u16 f) {
  u8 cls;
  u16 v;
  u16 a;
  u16 b;
  u16 lo;
  u16 hi;
  cls = socal_feat_class(f);
  a = feat_v0(f);
  b = feat_v1(f);
  lo = 65535;
  hi = 0;
  for (v = a; v < b; v++) {
    if (vert_lat(cls, v) < lo) lo = vert_lat(cls, v);
    if (vert_lat(cls, v) > hi) hi = vert_lat(cls, v);
  }
  return (u16)((lo + hi) >> 1);
}

u8 socal_layer_on(u8 i) {
  return SC_LAYON[i];
}

static u8 feat_visible(u16 f) {
  return SC_LAYON[socal_feat_layer(f)];
}

/* Layer/kind lookups. The calculator screens read the tables directly, but
   the browser bench reaches the string pool through these. */
u16 socal_layer_name(u8 i) {
  if (i >= SC_NLAYER) return 0;
  return SC_LAYER_NAME[i];
}

u8 socal_layer_kind(u8 i) {
  if (i >= SC_NLAYER) return 0;
  return SC_LAYER_KIND[i];
}

u16 socal_kind_name(u8 k) {
  if (k >= SC_NKIND) return 0;
  return SC_KIND_NAME[k];
}

u16 socal_visible(void) {
  u16 i;
  u16 n;
  n = 0;
  for (i = 0; i < SC_NFEAT; i++) {
    if (feat_visible(i) != 0) n = (u16)(n + 1);
  }
  return n;
}

static u16 layer_count(u8 l) {
  u16 i;
  u16 n;
  n = 0;
  for (i = 0; i < SC_NFEAT; i++) {
    if (socal_feat_layer(i) == l) n = (u16)(n + 1);
  }
  return n;
}

static u8 tier_label(u8 tier) {
  if (tier == SC_TIER_COMMUNITY) return SC_STY_DASH;
  if (tier == SC_TIER_CONTEXT) return SC_STY_DOT;
  return SC_STY_SOLID;
}

/* ------------------------------------------------------------- primitives */

/* Clip rectangle. The map draws routes that run far outside the viewport, and
   without this they would scribble over the status bar and the footer. */
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
    if (sty == SC_STY_SOLID) px(x, y, PX_SET);
    else if (sty == SC_STY_DASH) {
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
  if (tier == SC_TIER_CONTEXT) {
    px(x, y, PX_SET);
    px(x - 1, y - 1, PX_SET);
    px(x + 1, y + 1, PX_SET);
    return;
  }
  if (tier == SC_TIER_OFFICIAL) {
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
  if (SK_W < 128 && tier == SC_TIER_COMMUNITY) {
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

static u16 scr_label(void) {
  if (SC_SCREEN == SC_SCR_MAP) return SL_MAP;
  if (SC_SCREEN == SC_SCR_PROF) return SL_PROF;
  if (SC_SCREEN == SC_SCR_LAYERS) return SL_LAYERS;
  if (SC_SCREEN == SC_SCR_DOS) return SL_DOS;
  if (SC_SCREEN == SC_SCR_INFO) return SL_INFO;
  return SL_TITLE;
}

u16 sc_dev_label(u8 dev) {
  if (dev == DEV_TI89) return SL_TI89;
  if (dev == DEV_TI92) return SL_TI92;
  if (dev == DEV_HOST) return SL_HOST;
  return SL_TI83;
}

u16 sc_dev_cpu(u8 dev) {
  if (dev == DEV_TI89) return SL_M68K;
  if (dev == DEV_TI92) return SL_M68K;
  return SL_Z80;
}

u16 sc_dev_ram(u8 dev) {
  if (dev == DEV_TI89) return 256;
  if (dev == DEV_TI92) return 128;
  return 32;
}

static void draw_status(void) {
  u8 buf[48];
  u16 x;
  fb_box(0, 0, SK_W, 8, FILL_SOLID);
  sc_str(buf, scr_label());
  fb_textm(2, 2, buf, PX_CLEAR);
  sc_str(buf, sc_dev_label(SK_DEV));
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
  sc_str(buf, SL_TITLE);
  if (fb_text_w(buf) * 2 < SK_W) {
    cx = (u16)idiv((int)SK_W - (int)fb_text_w(buf) * 2, 2);
    fb_text2(cx, y, buf);
    y = (u16)(y + 13);
  } else {
    sc_str(buf, SL_SOCAL);
    cx = (u16)idiv((int)SK_W - (int)fb_text_w(buf) * 2, 2);
    fb_text2(cx, y, buf);
    sc_str(buf, SL_SUBSURF);
    cx = (u16)idiv((int)SK_W - (int)fb_text_w(buf) * 2, 2);
    fb_text2(cx, (u16)(y + 12), buf);
    y = (u16)(y + 25);
  }
  fb_hline(2, (u16)(SK_W - 3), y, PX_SET);
  y = (u16)(y + 4);
  sc_str(buf, SL_SUB);
  fb_text(2, y, buf);
  y = (u16)(y + 7);

  n = sc_str_at(buf, 0, sc_dev_label(SK_DEV));
  buf[n] = 32;
  n = (u16)(n + 1);
  n = (u16)(n + sc_str_at(buf, n, SL_LCD));
  n = (u16)(n + sc_num_at(buf, n, (i32)SK_W));
  buf[n] = 88;
  n = (u16)(n + 1);
  n = (u16)(n + sc_num_at(buf, n, (i32)SK_H));
  fb_text(2, y, buf);
  y = (u16)(y + 7);

  n = sc_num_at(buf, 0, (i32)SC_NFEAT);
  buf[n] = 32;
  n = (u16)(n + 1);
  n = (u16)(n + sc_str_at(buf, n, SL_VERTS));
  buf[n] = 32;
  n = (u16)(n + 1);
  n = (u16)(n + sc_num_at(buf, n, (i32)(SC_NPT + SC_NRPT + SC_NCOAST)));
  fb_text(2, y, buf);
  y = (u16)(y + 7);

  sc_str(buf, SL_PRESS);
  fb_text(2, y, buf);
}

static void map_footer(void) {
  u8 buf[72];
  u16 n;
  u16 lim;
  u8 cls;
  u16 i;
  cls = socal_feat_class(SC_SEL);
  i = socal_feat_sub(SC_SEL);
  n = 0;
  if (cls == SC_CLS_COR) n = sc_str_at(buf, 0, SC_COR_SHORT[i]);
  else n = sc_str_at(buf, 0, socal_feat_name(SC_SEL));
  buf[n] = 32;
  n = (u16)(n + 1);
  if (cls == SC_CLS_COR) {
    n = (u16)(n + sc_num_at(buf, n, (i32)SC_COR_KM[i]));
    n = (u16)(n + sc_str_at(buf, n, SL_KM));
  } else if (cls == SC_CLS_RING) {
    n = (u16)(n + sc_num_at(buf, n, (i32)SC_RING_KM2[i]));
    n = (u16)(n + sc_str_at(buf, n, SL_KM2));
  } else {
    n = (u16)(n + sc_num_at(buf, n, socal_feat_depth(SC_SEL)));
    n = (u16)(n + sc_str_at(buf, n, SL_M));
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
  int x0;
  int y0;
  int x1;
  int y1;
  sc_view();
  fb_rect(0, 9, SK_W, (u16)(SK_H - 18), PX_SET);
  clip_set(1, 10, (int)SK_W - 2, (int)SK_H - 12);

  if (SC_LAYON[0] != 0) {
    for (v = 0; v + 1 < SC_NCOAST; v++) {
      line_sty(sc_px(SC_COAST[v * 2]), sc_py(SC_COAST[v * 2 + 1]),
               sc_px(SC_COAST[v * 2 + 2]), sc_py(SC_COAST[v * 2 + 3]), SC_STY_DOT);
    }
  }

  for (c = 0; c < SC_NCOR; c++) {
    if (SC_LAYON[SC_COR_LAYER[c]] == 0) continue;
    sty = tier_label(SC_COR_TIER[c]);
    a = SC_COR_OFF[c];
    b = SC_COR_OFF[c + 1];
    for (v = a; v + 1 < b; v++) {
      line_sty(sc_px(SC_PT[v * 2]), sc_py(SC_PT[v * 2 + 1]),
               sc_px(SC_PT[v * 2 + 2]), sc_py(SC_PT[v * 2 + 3]), sty);
    }
  }

  for (c = 0; c < SC_NRING; c++) {
    if (SC_LAYON[SC_RING_LAYER[c]] == 0) continue;
    a = SC_RING_OFF[c];
    b = SC_RING_OFF[c + 1];
    if (b <= a) continue;
    x0 = sc_px(SC_RING_PT[a * 2]);
    y0 = sc_py(SC_RING_PT[a * 2 + 1]);
    for (v = a; v + 1 < b; v++) {
      line_sty(sc_px(SC_RING_PT[v * 2]), sc_py(SC_RING_PT[v * 2 + 1]),
               sc_px(SC_RING_PT[v * 2 + 2]), sc_py(SC_RING_PT[v * 2 + 3]), SC_STY_DOT);
    }
    x1 = sc_px(SC_RING_PT[(b - 1) * 2]);
    y1 = sc_py(SC_RING_PT[(b - 1) * 2 + 1]);
    line_sty(x1, y1, x0, y0, SC_STY_DOT);
  }

  for (c = 0; c < SC_NNODE; c++) {
    if (SC_LAYON[SC_NODE_LAYER[c]] == 0) continue;
    marker(sc_px(SC_NODE_Q[c * 2]), sc_py(SC_NODE_Q[c * 2 + 1]), SC_NODE_TIER[c]);
  }

  crosshair(sc_px(socal_feat_qlon(SC_SEL)), sc_py(socal_feat_qlat(SC_SEL)));
  clip_full();

  sc_str(buf, SL_ZOOM);
  sc_num_at(buf, 1, (i32)(1 << SC_ZOOM));
  fb_box((u16)(SK_W - 20), 10, 18, 7, FILL_CLEAR);
  fb_text((u16)(SK_W - 18), 11, buf);
  map_footer();
}

/* ------------------------------------------------------------ the section */

/* Sample the terrain along the selected route (or across the frame) and cache
   it. 21 gaussians per sample is affordable once, not once per frame. */
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
  cls = socal_feat_class(SC_SEL);
  n = (u16)(SK_W - 8);
  if (n > SC_PROF_MAX) n = SC_PROF_MAX;
  if (n < 8) n = 8;
  PROF_N = n;
  PROF_DIRTY = 0;

  a = feat_v0(SC_SEL);
  b = feat_v1(SC_SEL);
  if (SC_PROFMODE == 1 || cls != SC_CLS_COR) {
    /* W-E transect: the whole frame in transect mode, 2 degrees around the
       feature otherwise. Mirrors the web app's VIEW / TRANSECT camera. */
    qlat = (i32)socal_feat_qlat(SC_SEL);
    if (SC_PROFMODE == 1) {
      q0lon = 0;
      q1lon = SC_SPAN_LON;
    } else {
      q0lon = (i32)socal_feat_qlon(SC_SEL) - 2 * SC_Q;
      q1lon = q0lon + 4 * SC_Q;
      if (q0lon < 0) q0lon = 0;
      if (q1lon > SC_SPAN_LON) q1lon = SC_SPAN_LON;
    }
    for (i = 0; i < n; i++) {
      qlon = q0lon + idiv32((q1lon - q0lon) * (i32)i, (i32)(n - 1));
      PROF_E[i] = (i16)sc_elev_q(qlon, qlat);
    }
    PROF_KM = sc_km_span(q1lon - q0lon, 0);
  } else {
    /* Along the route, resampled by arc length. */
    total = 0;
    for (v = a; v + 1 < b; v++) {
      dx = (i32)SC_PT[v * 2 + 2] - (i32)SC_PT[v * 2];
      dy = (i32)SC_PT[v * 2 + 3] - (i32)SC_PT[v * 2 + 1];
      total = total + (i32)sc_km_span(dx, dy);
    }
    if (total < 1) total = 1;
    PROF_KM = (u16)total;
    for (i = 0; i < n; i++) {
      want = idiv32(total * (i32)i, (i32)(n - 1));
      acc = 0;
      qlon = (i32)SC_PT[a * 2];
      qlat = (i32)SC_PT[a * 2 + 1];
      for (v = a; v + 1 < b; v++) {
        dx = (i32)SC_PT[v * 2 + 2] - (i32)SC_PT[v * 2];
        dy = (i32)SC_PT[v * 2 + 3] - (i32)SC_PT[v * 2 + 1];
        seg = (i32)sc_km_span(dx, dy);
        if (acc + seg >= want || v + 2 == b) {
          if (seg < 1) seg = 1;
          qlon = (i32)SC_PT[v * 2] + idiv32(dx * (want - acc), seg);
          qlat = (i32)SC_PT[v * 2 + 1] + idiv32(dy * (want - acc), seg);
          break;
        }
        acc = acc + seg;
      }
      PROF_E[i] = (i16)sc_elev_q(qlon, qlat);
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

void socal_set_zoom(u8 z) {
  if (z > 3) z = 3;
  SC_ZOOM = z;
}

void socal_set_depthx(u8 d) {
  if (d > 3) d = 3;
  SC_DEPTHX = d;
}

void socal_set_profmode(u8 m) {
  if (m > 1) m = 1;
  SC_PROFMODE = m;
  PROF_DIRTY = 1;
}

void socal_set_laycur(u8 i) {
  if (i >= SC_NLAYER) i = 0;
  SC_LAYCUR = i;
}

u16 sc_prof_km(void) {
  if (PROF_DIRTY != 0) prof_build();
  return PROF_KM;
}

u16 sc_prof_n(void) {
  if (PROF_DIRTY != 0) prof_build();
  return PROF_N;
}

i32 sc_prof_elev(u16 i) {
  if (PROF_DIRTY != 0) prof_build();
  if (i >= PROF_N) return 0;
  return (i32)PROF_E[i];
}

static i32 depth_gain(void) {
  if (SC_DEPTHX == 0) return 5;
  if (SC_DEPTHX == 1) return 10;
  if (SC_DEPTHX == 2) return 20;
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
  maxmag = (i32)sc_depth_mag_q8(3000);
  clip_set(1, (int)top, (int)SK_W - 2, (int)bot);

  /* Sea level, when the window straddles it. */
  if (PROF_LO < 0 && PROF_HI > 0) {
    gy = (int)mid - (int)idiv32((0 - PROF_LO) * (i32)eband, PROF_HI - PROF_LO);
    for (i = 0; i < SK_W; i = (u16)(i + 3)) px((int)i, gy, PX_SET);
  }

  prev = -1;
  for (i = 0; i < n; i++) {
    e = (i32)PROF_E[i];
    gy = (int)mid - (int)idiv32((e - PROF_LO) * (i32)eband, PROF_HI - PROF_LO);
    /* rock below the ground line, dithered so it reads as fill, not as ink */
    for (j = gy + 2; j < (int)bot; j++) {
      if (((j + (int)i) & 3) == 0) px((int)i + 4, j, PX_SET);
    }
    if (prev >= 0) line_sty((int)i + 3, prev, (int)i + 4, gy, SC_STY_SOLID);
    px((int)i + 4, gy, PX_SET);
    prev = gy;
  }

  /* The buried thing itself, hung under the terrain on the log depth ramp. */
  e = socal_feat_depth(SC_SEL);
  if (e != 0) {
    mag = (i32)sc_depth_mag_q8(e);
    dpx = idiv32(mag * (i32)dband * depth_gain(), maxmag * 10);
    if (dpx > (i32)dband - 2) dpx = (i32)dband - 2;
    if (dpx < 2) dpx = 2;
    prev = -1;
    for (i = 0; i < n; i++) {
      gy = (int)mid - (int)idiv32(((i32)PROF_E[i] - PROF_LO) * (i32)eband, PROF_HI - PROF_LO);
      py2 = gy + (int)dpx;
      px((int)i + 4, py2 - 1, PX_CLEAR);
      px((int)i + 4, py2 + 1, PX_CLEAR);
      if (prev >= 0) line_sty((int)i + 3, prev, (int)i + 4, py2, SC_STY_DASH);
      prev = py2;
    }
  }
  clip_full();

  /* MAX 2600M  DEP -120M  389KM */
  nn = sc_str_at(buf, 0, SL_MAX);
  nn = (u16)(nn + sc_num_at(buf, nn, PROF_HI));
  nn = (u16)(nn + sc_str_at(buf, nn, SL_M));
  buf[nn] = 32;
  nn = (u16)(nn + 1);
  nn = (u16)(nn + sc_str_at(buf, nn, SL_DEPTH));
  nn = (u16)(nn + sc_num_at(buf, nn, e));
  buf[nn] = 32;
  nn = (u16)(nn + 1);
  nn = (u16)(nn + sc_num_at(buf, nn, (i32)PROF_KM));
  nn = (u16)(nn + sc_str_at(buf, nn, SL_KM));
  if (fb_text_w(buf) > SK_W - 4) {
    /* narrow LCD: drop the words, keep the three numbers */
    nn = sc_num_at(buf, 0, PROF_HI);
    nn = (u16)(nn + sc_str_at(buf, nn, SL_M));
    buf[nn] = 32;
    nn = (u16)(nn + 1);
    nn = (u16)(nn + sc_num_at(buf, nn, e));
    nn = (u16)(nn + sc_str_at(buf, nn, SL_M));
    buf[nn] = 32;
    nn = (u16)(nn + 1);
    nn = (u16)(nn + sc_num_at(buf, nn, (i32)PROF_KM));
    nn = (u16)(nn + sc_str_at(buf, nn, SL_KM));
  }
  if (nn > line_chars()) buf[line_chars()] = 0;
  draw_footer(buf);

  if (SC_PROFMODE == 1) sc_str(buf, SL_TRANSECT);
  else sc_str(buf, SL_ALONG);
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
  if (SC_LAYCUR >= rows) first = (u16)(SC_LAYCUR - rows + 1);
  lim = line_chars();
  for (r = 0; r < rows; r++) {
    i = (u16)(first + r);
    if (i >= SC_NLAYER) break;
    y = (u16)(10 + r * 7);
    n = sc_str_at(buf, 0, SC_LAYER_NAME[i]);
    if (n > lim - 6) {
      n = (u16)(lim - 6);
      buf[n] = 0;
    }
    buf[n] = 32;
    n = (u16)(n + 1);
    n = (u16)(n + sc_num_at(buf, n, (i32)layer_count((u8)i)));
    if (n > lim) buf[lim] = 0;
    if (i == SC_LAYCUR) {
      fb_box(0, (u16)(y - 1), SK_W, 7, FILL_SOLID);
      fb_textm(9, y, buf, PX_CLEAR);
      fb_box(2, (u16)(y + 1), 5, 3, FILL_CLEAR);
      if (SC_LAYON[i] != 0) fb_box(3, (u16)(y + 2), 3, 1, FILL_SOLID);
    } else {
      fb_text(9, y, buf);
      fb_rect(2, y, 5, 5, PX_SET);
      if (SC_LAYON[i] != 0) fb_box(3, (u16)(y + 1), 3, 3, FILL_SOLID);
    }
  }
  n = sc_str_at(buf, 0, SL_VIS);
  n = (u16)(n + sc_num_at(buf, n, (i32)socal_visible()));
  n = (u16)(n + sc_str_at(buf, n, SL_SLASH));
  n = (u16)(n + sc_num_at(buf, n, (i32)SC_NFEAT));
  draw_footer(buf);
}

/* ------------------------------------------------------------ the dossier */

static u16 wrap_line(u8 *buf, u16 off, u16 start, u16 width) {
  u16 n;
  u16 cut;
  n = 0;
  while (SC_STR[off + start + n] != 0 && n < width) {
    buf[n] = SC_STR[off + start + n];
    n = n + 1;
  }
  cut = n;
  if (SC_STR[off + start + n] != 0) {
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
  off = socal_feat_name(SC_SEL);
  cls = socal_feat_class(SC_SEL);
  i = socal_feat_sub(SC_SEL);
  y = 10;
  start = 0;
  while (SC_STR[off + start] != 0 && y < SK_H - 40) {
    n = wrap_line(buf, off, start, width);
    fb_text(2, y, buf);
    y = (u16)(y + 7);
    start = (u16)(start + n);
    while (SC_STR[off + start] == 32) start = (u16)(start + 1);
  }
  fb_hline(2, (u16)(SK_W - 3), y, PX_SET);
  y = (u16)(y + 3);

  n = sc_str_at(buf, 0, SL_LAYER);
  n = (u16)(n + sc_str_at(buf, n, SC_LAYER_NAME[socal_feat_layer(SC_SEL)]));
  if (n > width) buf[width] = 0;
  fb_text(2, y, buf);
  y = (u16)(y + 7);

  n = sc_str_at(buf, 0, SL_TIER);
  if (socal_feat_tier(SC_SEL) == SC_TIER_OFFICIAL) n = (u16)(n + sc_str_at(buf, n, SL_OFFICIAL));
  else if (socal_feat_tier(SC_SEL) == SC_TIER_COMMUNITY) n = (u16)(n + sc_str_at(buf, n, SL_COMMUNITY));
  else n = (u16)(n + sc_str_at(buf, n, SL_CONTEXT));
  if (cls == SC_CLS_NODE) {
    buf[n] = 32;
    n = (u16)(n + 1);
    n = (u16)(n + sc_str_at(buf, n, SC_KIND_NAME[SC_NODE_KIND[i]]));
  }
  if (n > width) buf[width] = 0;
  fb_text(2, y, buf);
  y = (u16)(y + 7);

  d = socal_feat_depth(SC_SEL);
  n = 0;
  if (cls == SC_CLS_COR) {
    n = sc_str_at(buf, 0, SL_LEN);
    n = (u16)(n + sc_num_at(buf, n, (i32)SC_COR_KM[i]));
    n = (u16)(n + sc_str_at(buf, n, SL_KM));
    buf[n] = 32;
    n = (u16)(n + 1);
    n = (u16)(n + sc_str_at(buf, n, SL_TUN));
    n = (u16)(n + sc_num_at(buf, n, (i32)SC_COR_TUN[i]));
    n = (u16)(n + sc_str_at(buf, n, SL_PCT));
  } else if (cls == SC_CLS_RING) {
    n = sc_str_at(buf, 0, SL_AREA);
    n = (u16)(n + sc_num_at(buf, n, (i32)SC_RING_KM2[i]));
    n = (u16)(n + sc_str_at(buf, n, SL_KM2));
  }
  if (n > 0) {
    if (n > width) buf[width] = 0;
    fb_text(2, y, buf);
    y = (u16)(y + 7);
  }

  if (d != 0) {
    n = sc_str_at(buf, 0, SL_DEPTH);
    n = (u16)(n + sc_num_at(buf, n, d));
    n = (u16)(n + sc_str_at(buf, n, SL_M));
    buf[n] = 32;
    n = (u16)(n + 1);
    n = (u16)(n + sc_num_at(buf, n, idiv32(d * 3281, 1000)));
    n = (u16)(n + sc_str_at(buf, n, SL_FT));
    if (n > width) buf[width] = 0;
    fb_text(2, y, buf);
    y = (u16)(y + 7);
  }

  n = sc_str_at(buf, 0, SL_LON);
  n = (u16)(n + sc_deg_at(buf, n, sc_lon_mdeg(socal_feat_qlon(SC_SEL))));
  n = (u16)(n + sc_str_at(buf, n, SL_LAT));
  n = (u16)(n + sc_deg_at(buf, n, sc_lat_mdeg(socal_feat_qlat(SC_SEL))));
  if (n > width) buf[width] = 0;
  fb_text(2, y, buf);

  sc_str(buf, SL_811);
  if (fb_text_w(buf) > SK_W - 4) sc_str(buf, SL_GEN);
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
  n = sc_str_at(buf, 0, sc_dev_label(SK_DEV));
  buf[n] = 32;
  n = (u16)(n + 1);
  n = (u16)(n + sc_str_at(buf, n, sc_dev_cpu(SK_DEV)));
  y = info_row(y, buf);

  n = sc_str_at(buf, 0, SL_LCD);
  n = (u16)(n + sc_num_at(buf, n, (i32)SK_W));
  buf[n] = 88;
  n = (u16)(n + 1);
  n = (u16)(n + sc_num_at(buf, n, (i32)SK_H));
  buf[n] = 32;
  n = (u16)(n + 1);
  n = (u16)(n + sc_str_at(buf, n, SL_RAM));
  n = (u16)(n + sc_num_at(buf, n, (i32)sc_dev_ram(SK_DEV)));
  buf[n] = 75;
  n = (u16)(n + 1);
  buf[n] = 0;
  y = info_row(y, buf);

  n = sc_str_at(buf, 0, SL_CORR);
  buf[n] = 32;
  n = (u16)(n + 1);
  n = (u16)(n + sc_num_at(buf, n, (i32)SC_NCOR));
  buf[n] = 32;
  n = (u16)(n + 1);
  n = (u16)(n + sc_str_at(buf, n, SL_SITES));
  buf[n] = 32;
  n = (u16)(n + 1);
  n = (u16)(n + sc_num_at(buf, n, (i32)SC_NNODE));
  y = info_row(y, buf);

  n = sc_str_at(buf, 0, SL_RINGS);
  buf[n] = 32;
  n = (u16)(n + 1);
  n = (u16)(n + sc_num_at(buf, n, (i32)SC_NRING));
  buf[n] = 32;
  n = (u16)(n + 1);
  n = (u16)(n + sc_str_at(buf, n, SL_VERTS));
  buf[n] = 32;
  n = (u16)(n + 1);
  n = (u16)(n + sc_num_at(buf, n, (i32)(SC_NPT + SC_NRPT + SC_NCOAST)));
  y = info_row(y, buf);

  n = sc_str_at(buf, 0, SL_LAYERSON);
  n = (u16)(n + sc_num_at(buf, n, (i32)socal_visible()));
  n = (u16)(n + sc_str_at(buf, n, SL_SLASH));
  n = (u16)(n + sc_num_at(buf, n, (i32)SC_NFEAT));
  y = info_row(y, buf);

  sc_str(buf, SL_QUANT);
  y = info_row(y, buf);

  sc_str(buf, SL_XDC);
  y = info_row(y, buf);
  sc_str(buf, SL_811);
  draw_footer(buf);
}

/* ------------------------------------------------------------- the driver */

void socal_init(u8 dev, u16 w, u16 h) {
  u16 i;
  SK_DEV = dev;
  SK_W = w;
  SK_H = h;
  SK_ROWB = (u16)((w + 7) >> 3);
  SK_FBB = (u16)(SK_ROWB * h);
  if (SK_FBB > FB_MAX) SK_FBB = FB_MAX;
  SK_TICK = 0;
  SK_QUIT = 0;
  SC_SCREEN = SC_SCR_BOOT;
  SC_SEL = 0;
  /* 117 features across 96 px is a smudge; the TI-83 opens one step in. */
  SC_ZOOM = 0;
  if (w < 128) SC_ZOOM = 1;
  SC_DEPTHX = 1;
  SC_PROFMODE = 0;
  SC_LAYCUR = 0;
  SC_DOSLINE = 0;
  for (i = 0; i < SC_NLAYER; i++) SC_LAYON[i] = SC_LAYER_ON[i];
  PROF_DIRTY = 1;
  PROF_N = 0;
  PROF_KM = 0;
  PROF_LO = 0;
  PROF_HI = 0;
  sc_view();
}

static void sel_step(int dir) {
  u16 i;
  u16 f;
  f = SC_SEL;
  for (i = 0; i < SC_NFEAT; i++) {
    if (dir > 0) f = (u16)((f + 1) % SC_NFEAT);
    else if (f == 0) f = (u16)(SC_NFEAT - 1);
    else f = (u16)(f - 1);
    if (feat_visible(f) != 0) break;
  }
  SC_SEL = f;
  PROF_DIRTY = 1;
  SC_DOSLINE = 0;
}

void socal_set_sel(u16 f) {
  SC_SEL = (u16)(f % SC_NFEAT);
  PROF_DIRTY = 1;
}

u16 socal_get_sel(void) {
  return SC_SEL;
}

void socal_toggle_layer(u8 i) {
  if (i >= SC_NLAYER) return;
  if (SC_LAYON[i] != 0) SC_LAYON[i] = 0;
  else SC_LAYON[i] = 1;
  PROF_DIRTY = 1;
}

void socal_set_screen(u8 scr) {
  if (scr >= SC_NSCREEN) scr = SC_SCR_BOOT;
  SC_SCREEN = scr;
}

u8 socal_get_screen(void) {
  return SC_SCREEN;
}

static void map_key(u8 k) {
  if (k == SKK_LEFT) sel_step(-1);
  else if (k == SKK_RIGHT) sel_step(1);
  else if (k == SKK_UP) {
    if (SC_ZOOM < 3) SC_ZOOM = (u8)(SC_ZOOM + 1);
  } else if (k == SKK_DOWN) {
    if (SC_ZOOM > 0) SC_ZOOM = (u8)(SC_ZOOM - 1);
  } else if (k == SKK_ENTER) {
    SC_SCREEN = SC_SCR_DOS;
  } else if (k == SKK_ACT) {
    SC_SCREEN = SC_SCR_PROF;
  }
}

static void prof_key(u8 k) {
  if (k == SKK_LEFT) sel_step(-1);
  else if (k == SKK_RIGHT) sel_step(1);
  else if (k == SKK_UP) {
    if (SC_DEPTHX < 3) SC_DEPTHX = (u8)(SC_DEPTHX + 1);
  } else if (k == SKK_DOWN) {
    if (SC_DEPTHX > 0) SC_DEPTHX = (u8)(SC_DEPTHX - 1);
  } else if (k == SKK_ACT) {
    if (SC_PROFMODE != 0) SC_PROFMODE = 0;
    else SC_PROFMODE = 1;
    PROF_DIRTY = 1;
  } else if (k == SKK_ENTER) {
    SC_SCREEN = SC_SCR_DOS;
  }
}

static void layers_key(u8 k) {
  u16 i;
  if (k == SKK_UP) {
    if (SC_LAYCUR == 0) SC_LAYCUR = (u8)(SC_NLAYER - 1);
    else SC_LAYCUR = (u8)(SC_LAYCUR - 1);
  } else if (k == SKK_DOWN) {
    SC_LAYCUR = (u8)((SC_LAYCUR + 1) % SC_NLAYER);
  } else if (k == SKK_ENTER) {
    socal_toggle_layer(SC_LAYCUR);
  } else if (k == SKK_ACT) {
    /* all on, or back to the web app's own defaults */
    if (socal_visible() == SC_NFEAT) {
      for (i = 0; i < SC_NLAYER; i++) SC_LAYON[i] = SC_LAYER_ON[i];
    } else {
      for (i = 0; i < SC_NLAYER; i++) SC_LAYON[i] = 1;
    }
    PROF_DIRTY = 1;
  } else if (k == SKK_LEFT) {
    sel_step(-1);
  } else if (k == SKK_RIGHT) {
    sel_step(1);
  }
}

void socal_key(u8 k) {
  if (k == SKK_EXIT) {
    SK_QUIT = 1;
    return;
  }
  if (SC_SCREEN == SC_SCR_BOOT) {
    if (k != SKK_NONE) SC_SCREEN = SC_SCR_MAP;
    return;
  }
  if (k == SKK_1) {
    SC_SCREEN = SC_SCR_MAP;
    return;
  }
  if (k == SKK_2) {
    SC_SCREEN = SC_SCR_PROF;
    return;
  }
  if (k == SKK_3) {
    SC_SCREEN = SC_SCR_LAYERS;
    return;
  }
  if (k == SKK_4) {
    SC_SCREEN = SC_SCR_DOS;
    return;
  }
  if (k == SKK_5) {
    SC_SCREEN = SC_SCR_INFO;
    return;
  }
  if (SC_SCREEN == SC_SCR_MAP) map_key(k);
  else if (SC_SCREEN == SC_SCR_PROF) prof_key(k);
  else if (SC_SCREEN == SC_SCR_LAYERS) layers_key(k);
  else if (SC_SCREEN == SC_SCR_DOS) {
    if (k == SKK_LEFT) sel_step(-1);
    else if (k == SKK_RIGHT) sel_step(1);
    else if (k == SKK_ENTER) SC_SCREEN = SC_SCR_MAP;
    else if (k == SKK_ACT) SC_SCREEN = SC_SCR_PROF;
  } else if (SC_SCREEN == SC_SCR_INFO) {
    if (k == SKK_ENTER) SC_SCREEN = SC_SCR_MAP;
  }
}

void socal_tick(void) {
  SK_TICK = (u16)((SK_TICK + 1) & 0xFFFF);
}

void socal_render(void) {
  fb_clear();
  clip_full();
  if (SC_SCREEN == SC_SCR_BOOT) {
    render_boot();
    return;
  }
  draw_status();
  if (SC_SCREEN == SC_SCR_MAP) render_map();
  else if (SC_SCREEN == SC_SCR_PROF) render_prof();
  else if (SC_SCREEN == SC_SCR_LAYERS) render_layers();
  else if (SC_SCREEN == SC_SCR_DOS) render_dos();
  else render_info();
}
