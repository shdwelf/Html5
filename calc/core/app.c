/* core/app.c — the SITE-K shell: five screens, one keypad contract.
 *
 * Platform layers do three things: call sitek_init(w,h), feed sitek_key(),
 * and blit SK_FB. Everything drawn here is device-independent.
 */
#include "sitek.h"

u16 SK_W;
u16 SK_H;
u16 SK_ROWB;
u16 SK_FBB;
u8 SK_DEV;
u8 SK_SCREEN;
u8 SK_CURSOR;
u8 SK_SUB;
u8 SK_SELWORD;
u16 SK_TICK;
u8 SK_QUIT;

static const u8 T_SITEK[] = { 'S', 'I', 'T', 'E', '-', 'K', 0 };
static const u8 T_TAG[] = { 'H', 'T', 'M', 'L', '5', ' ', 'C', 'O', 'R', 'E', 0 };
static const u8 T_PRESS[] = { 'P', 'R', 'E', 'S', 'S', ' ', 'K', 'E', 'Y', 0 };
static const u8 T_GRID[] = { 'G', 'R', 'I', 'D', 0 };
static const u8 T_KEYS[] = { 'K', 'E', 'Y', 'S', 0 };
static const u8 T_TERR[] = { 'T', 'E', 'R', 'R', 0 };
static const u8 T_INFO[] = { 'D', 'E', 'V', 'I', 'C', 'E', 0 };
static const u8 T_SEC[] = { 'S', 'E', 'C', ' ', 0 };
static const u8 T_NPREF[] = { ' ', 'N', 0 };
static const u8 T_LCDPFX[] = { 'L', 'C', 'D', ' ', 0 };
static const u8 T_RAMPFX[] = { 'R', 'A', 'M', ' ', 0 };
static const u8 T_ONES[] = { ' ', 'O', 'N', 'E', 'S', ' ', 0 };
static const u8 T_GEN[] = { 'G', 'E', 'N', ' ', 0 };
static const u8 T_PAR[] = { 'P', 'A', 'R', 'A', 'L', 'L', 'E', 'L', 0 };
static const u8 T_HIL[] = { 'H', 'I', 'L', 'B', 'E', 'R', 'T', 0 };
static const u8 T_BIT[] = { 'B', 'I', 'T', 'S', 0 };
static const u8 T_IDX[] = { 'I', 'D', 'X', ' ', 0 };
static const u8 T_WORDS[] = { 'W', 'O', 'R', 'D', 'S', 0 };

static const u8 N_TI83[] = { 'T', 'I', '-', '8', '3', 0 };
static const u8 N_TI85[] = { 'T', 'I', '-', '8', '5', 0 };
static const u8 N_TI89[] = { 'T', 'I', '-', '8', '9', 0 };
static const u8 N_TI90[] = { 'T', 'I', '-', '9', '0', 0 };
static const u8 N_TI92[] = { 'T', 'I', '-', '9', '2', 0 };
static const u8 N_HOST[] = { 'H', 'O', 'S', 'T', 0 };
static const u8 C_Z80[] = { 'Z', '8', '0', 0 };
static const u8 C_M68K[] = { 'M', '6', '8', 'K', 0 };

const u8 *dev_name(u8 dev) {
  if (dev == DEV_TI85) return N_TI85;
  if (dev == DEV_TI89) return N_TI89;
  if (dev == DEV_TI90) return N_TI90;
  if (dev == DEV_TI92) return N_TI92;
  if (dev == DEV_HOST) return N_HOST;
  return N_TI83;
}

const u8 *dev_cpu(u8 dev) {
  if (dev == DEV_TI89) return C_M68K;
  if (dev == DEV_TI92) return C_M68K;
  return C_Z80;
}

u16 dev_ram_k(u8 dev) {
  if (dev == DEV_TI89) return 256;
  if (dev == DEV_TI92) return 128;
  return 32;
}

static const u8 *scr_name(void) {
  if (SK_SCREEN == SCR_GRID) return T_GRID;
  if (SK_SCREEN == SCR_KEYS) return T_KEYS;
  if (SK_SCREEN == SCR_TERR) return T_TERR;
  if (SK_SCREEN == SCR_INFO) return T_INFO;
  return T_SITEK;
}

static u16 fmt_dims(u8 *buf) {
  u16 n;
  n = str_copy(buf, T_LCDPFX);
  n = (u16)(n + num_to(buf, n, SK_W));
  buf[n] = 88;
  n = (u16)(n + 1);
  n = (u16)(n + num_to(buf, n, SK_H));
  buf[n] = 0;
  return n;
}

static u16 fmt_ram(u8 *buf) {
  u16 n;
  n = str_copy(buf, T_RAMPFX);
  n = (u16)(n + num_to(buf, n, dev_ram_k(SK_DEV)));
  buf[n] = 75;
  n = (u16)(n + 1);
  buf[n] = 0;
  return n;
}

static u16 fmt_sec(u8 *buf, u8 sector) {
  u16 n;
  u8 col;
  u8 row;
  col = (u8)(sector & 7);
  row = (u8)(sector >> 3);
  n = str_copy(buf, T_SEC);
  buf[n] = (u8)(65 + col);
  n = (u16)(n + 1);
  buf[n] = (u8)(49 + row);
  n = (u16)(n + 1);
  return n;
}

static u16 fmt_q8(u8 *buf, u16 at, u16 v) {
  u16 n;
  u16 frac;
  n = at;
  n = (u16)(n + num_to(buf, n, (u16)(v >> 8)));
  buf[n] = 46;
  n = (u16)(n + 1);
  frac = (u16)idiv((int)(v & 255) * 100, 256);
  buf[n] = (u8)(48 + idiv((int)frac, 10));
  n = (u16)(n + 1);
  buf[n] = (u8)(48 + imod((int)frac, 10));
  n = (u16)(n + 1);
  return n;
}

static void draw_status(void) {
  const u8 *nm;
  u16 x;
  fb_box(0, 0, SK_W, 8, FILL_SOLID);
  fb_textm(2, 2, scr_name(), PX_CLEAR);
  nm = dev_name(SK_DEV);
  x = (u16)(SK_W - 2 - fb_text_w(nm));
  if (x < 24) x = 24;
  fb_textm(x, 2, nm, PX_CLEAR);
}

static void draw_footer(const u8 *s) {
  u16 y;
  y = (u16)(SK_H - 9);
  fb_hline(0, (u16)(SK_W - 1), y, PX_SET);
  fb_text(2, (u16)(y + 2), s);
}

static void render_boot(void) {
  u8 buf[24];
  u16 cx;
  u16 y;
  y = (u16)idiv((int)SK_H - 44, 2);
  if (y < 8) y = 8;
  cx = (u16)idiv((int)SK_W - (int)fb_text_w(T_SITEK) * 2, 2);
  fb_text2(cx, y, T_SITEK);
  fb_hline(0, (u16)(SK_W - 1), (u16)(y + 12), PX_SET);
  fb_text(2, (u16)(y + 16), T_TAG);
  fb_text(2, (u16)(y + 23), dev_name(SK_DEV));
  fmt_dims(buf);
  fb_text(2, (u16)(y + 30), buf);
  fb_text(2, (u16)(y + 37), T_PRESS);
}

static void render_grid(void) {
  u8 buf[24];
  u16 gw;
  u16 gh;
  u16 ox;
  u16 oy;
  u16 i;
  u16 x0;
  u16 y0;
  u16 k;
  u16 n;
  u16 xy;
  u16 px;
  u16 py;
  u8 col;
  u8 row;
  gw = (u16)idiv((int)SK_W - 4, 8);
  gh = (u16)idiv((int)SK_H - 26, 8);
  if (gw < 4) gw = 4;
  if (gh < 3) gh = 3;
  ox = (u16)idiv((int)SK_W - (int)gw * 8, 2);
  oy = 11;
  for (i = 0; i < 64; i++) {
    col = (u8)(i & 7);
    row = (u8)(i >> 3);
    x0 = (u16)(ox + col * gw);
    y0 = (u16)(oy + row * gh);
    if (i == SK_CURSOR) fb_box(x0, y0, gw, gh, FILL_HALF);
    else fb_rect(x0, y0, gw, gh, PX_SET);
    n = (u16)grid_nodes((u8)i);
    for (k = 0; k < 3; k++) {
      if (n > k * 4) {
        xy = grid_node_xy((u8)i, (u8)k);
        px = (u16)(x0 + 1 + idiv((int)(xy >> 8) * (int)(gw - 2), 255));
        py = (u16)(y0 + 1 + idiv((int)(xy & 255) * (int)(gh - 2), 255));
        fb_px(px, py, PX_SET);
      }
    }
  }
  n = fmt_sec(buf, SK_CURSOR);
  n = (u16)(n + str_copy_at(buf, n, T_NPREF));
  n = (u16)(n + num_to(buf, n, (u16)grid_nodes(SK_CURSOR)));
  buf[n] = 0;
  draw_footer(buf);
}

static const u8 T_H8[] = { ' ', 'H', '8', ' ', 0 };

static void keys_footer(u8 *buf) {
  u16 n;
  n = 0;
  buf[n] = 87;
  n = (u16)(n + 1);
  n = (u16)(n + num_to(buf, n, (u16)ks_words()));
  n = (u16)(n + str_copy_at(buf, n, T_H8));
  n = fmt_q8(buf, n, ks_h8());
  n = (u16)(n + str_copy_at(buf, n, T_ONES));
  n = (u16)(n + num_to(buf, n, ks_ones()));
  buf[n] = 0;
}

static void render_keys(void) {
  u8 buf[32];
  u16 i;
  u16 x;
  u16 y;
  u16 prevx;
  u16 prevy;
  u16 sc;
  u16 ox;
  u16 oy;
  u16 d;
  u16 p;
  u16 nbits;
  u16 bx;
  u16 by;
  u16 hgt;
  u16 top;
  top = 11;
  hgt = (u16)(SK_H - 22);
  if (SK_SUB == 0) {
    /* parallel coordinates: one axis per word, 0..2047 */
    prevx = 0;
    prevy = 0;
    for (i = 0; i < (u16)ks_words(); i++) {
      x = (u16)(2 + idiv((int)i * (int)(SK_W - 4), (int)(ks_words() - 1)));
      y = (u16)(top + idiv((int)ks_word((u8)i) * (int)hgt, 2047));
      fb_vline(x, top, (u16)(top + hgt), PX_SET);
      if (i > 0) fb_line(prevx, prevy, x, y, PX_SET);
      prevx = x;
      prevy = y;
    }
    fb_box((u16)(prevx - 1), (u16)(prevy - 1), 3, 3, FILL_SOLID);
    fb_text(2, (u16)(top + 1), T_PAR);
  } else if (SK_SUB == 1) {
    /* Gray-ordered Hilbert tour of the first 8 bits */
    sc = (u16)idiv((int)hgt, 16);
    if (sc < 1) sc = 1;
    ox = (u16)idiv((int)SK_W - 16 * (int)sc, 2);
    oy = (u16)((int)top + idiv((int)hgt - 16 * (int)sc, 2));
    prevx = 0;
    prevy = 0;
    for (d = 0; d < 256; d++) {
      p = ks_hilbert(ks_gray(d), 4);
      x = (u16)(ox + (u16)(p >> 8) * sc);
      y = (u16)(oy + (u16)(p & 255) * sc);
      if (d > 0) fb_line(prevx, prevy, x, y, PX_SET);
      prevx = x;
      prevy = y;
    }
    fb_text(2, (u16)(top + 1), T_HIL);
  } else {
    /* entropy + checksum bits as blocks */
    nbits = (u16)(ks_ent_bits() + ks_cs_bits());
    for (i = 0; i < nbits; i++) {
      if (i >= 132) break;
      bx = (u16)(3 + imod((int)i, 22) * 4);
      by = (u16)(top + idiv((int)i, 22) * 4);
      if (ks_stream_bit(i) != 0) fb_box(bx, by, 3, 3, FILL_SOLID);
      else fb_rect(bx, by, 3, 3, PX_SET);
    }
    fb_text(2, (u16)(top + 1), T_BIT);
  }
  keys_footer(buf);
  draw_footer(buf);
}

static void render_terr(void) {
  u8 buf[24];
  u16 i;
  u16 x;
  u16 y;
  u16 ox;
  u16 oy;
  u16 sc;
  u16 n;
  sc = 1;
  if (SK_W >= 200) sc = 2;
  ox = (u16)idiv((int)SK_W - (int)tr_w() * (int)sc, 2);
  oy = 11;
  n = (u16)(tr_w() * tr_h());
  for (i = 0; i < n; i++) {
    if (tr_get(i) != 0) {
      x = (u16)(ox + imod((int)i, (int)tr_w()) * sc);
      y = (u16)(oy + idiv((int)i, (int)tr_w()) * sc);
      fb_box(x, y, sc, sc, FILL_SOLID);
    }
  }
  fb_rect((u16)(ox - 1), (u16)(oy - 1), (u16)(tr_w() * sc + 2), (u16)(tr_h() * sc + 2), PX_SET);
  n = str_copy(buf, T_GEN);
  n = (u16)(n + num_to(buf, n, tr_gen()));
  buf[n] = 0;
  draw_footer(buf);
}

static void render_info(void) {
  u8 buf[32];
  u16 y;
  u16 n;
  y = 12;
  fb_text(2, y, dev_name(SK_DEV));
  y = (u16)(y + 8);
  fb_text(2, y, dev_cpu(SK_DEV));
  y = (u16)(y + 8);
  fmt_dims(buf);
  fb_text(2, y, buf);
  y = (u16)(y + 8);
  fmt_ram(buf);
  fb_text(2, y, buf);
  y = (u16)(y + 8);
  n = str_copy(buf, T_WORDS);
  buf[n] = 32;
  n = (u16)(n + 1);
  n = (u16)(n + num_to(buf, n, (u16)ks_words()));
  buf[n] = 0;
  fb_text(2, y, buf);
  y = (u16)(y + 8);
  n = str_copy(buf, T_IDX);
  n = (u16)(n + num_to(buf, n, ks_word(SK_SELWORD)));
  buf[n] = 0;
  fb_text(2, y, buf);
}

void sitek_init(u8 dev, u16 w, u16 h) {
  u16 terrw;
  u16 terrh;
  SK_DEV = dev;
  SK_W = w;
  SK_H = h;
  SK_ROWB = (u16)((w + 7) >> 3);
  SK_FBB = (u16)(SK_ROWB * h);
  if (SK_FBB > FB_MAX) SK_FBB = FB_MAX;
  SK_SCREEN = SCR_BOOT;
  SK_CURSOR = 0;
  SK_SUB = 0;
  SK_SELWORD = 0;
  SK_TICK = 0;
  SK_QUIT = 0;
  grid_seed(u32w(0x5A17E1U ^ mul32((u32)dev, 0x9E3779B9U)));
  ks_seed(u32w(0x53495445U ^ mul32((u32)dev, 0x85EBCA6BU)));
  ks_gen(12);
  terrw = (u16)(w - 8);
  terrh = (u16)idiv((int)h - 24, 2);
  if (terrw > TR_MAXW) terrw = TR_MAXW;
  if (terrh > TR_MAXH) terrh = TR_MAXH;
  tr_init(u32w(0x7EBBA12U ^ mul32((u32)dev, 0xC2B2AE35U)), terrw, terrh);
}

static void grid_key(u8 k) {
  u8 col;
  u8 row;
  col = (u8)(SK_CURSOR & 7);
  row = (u8)(SK_CURSOR >> 3);
  if (k == SKK_LEFT) col = (u8)((col + 7) & 7);
  else if (k == SKK_RIGHT) col = (u8)((col + 1) & 7);
  else if (k == SKK_UP) row = (u8)((row + 7) & 7);
  else if (k == SKK_DOWN) row = (u8)((row + 1) & 7);
  else if (k == SKK_ACT) {
    grid_seed(u32w(grid_nodes(0) + rng_next()));
    return;
  } else return;
  SK_CURSOR = (u8)(row * 8 + col);
}

static void keys_key(u8 k) {
  if (k == SKK_UP) {
    if (SK_SUB == 0) SK_SUB = 2;
    else SK_SUB = (u8)(SK_SUB - 1);
    return;
  }
  if (k == SKK_DOWN) {
    SK_SUB = (u8)((SK_SUB + 1) % 3);
    return;
  }
  if (k == SKK_LEFT) {
    if (SK_SELWORD == 0) SK_SELWORD = (u8)(ks_words() - 1);
    else SK_SELWORD = (u8)(SK_SELWORD - 1);
    return;
  }
  if (k == SKK_RIGHT) {
    SK_SELWORD = (u8)((SK_SELWORD + 1) % ks_words());
    return;
  }
  if (k == SKK_ENTER) {
    ks_seed(rng_next());
    ks_gen(ks_words());
    return;
  }
  if (k == SKK_ACT) {
    if (ks_words() >= 24) ks_gen(12);
    else ks_gen((u8)(ks_words() + 3));
  }
}

void sitek_key(u8 k) {
  if (k == SKK_EXIT) {
    SK_QUIT = 1;
    return;
  }
  if (SK_SCREEN == SCR_BOOT) {
    if (k != SKK_NONE) SK_SCREEN = SCR_GRID;
    return;
  }
  if (k == SKK_1) {
    SK_SCREEN = SCR_GRID;
    return;
  }
  if (k == SKK_2) {
    SK_SCREEN = SCR_KEYS;
    return;
  }
  if (k == SKK_3) {
    SK_SCREEN = SCR_TERR;
    return;
  }
  if (k == SKK_4) {
    SK_SCREEN = SCR_INFO;
    return;
  }
  if (k == SKK_5) {
    SK_SCREEN = SCR_BOOT;
    return;
  }
  if (SK_SCREEN == SCR_GRID) grid_key(k);
  else if (SK_SCREEN == SCR_KEYS) keys_key(k);
  else if (SK_SCREEN == SCR_TERR) {
    if (k == SKK_ENTER) tr_step();
    else if (k == SKK_ACT) tr_init(u32w(rng_next()), tr_w(), tr_h());
  } else if (SK_SCREEN == SCR_INFO) {
    if (k == SKK_ENTER) SK_SCREEN = SCR_GRID;
  }
}

/* Drive the shell from outside: the host harness, the browser emulator, and
   any target that renders one screen at a time. (ES module exports are
   read-only, so the JS build needs these instead of assigning SK_SCREEN.) */
void sitek_set_screen(u8 scr) {
  if (scr > SCR_INFO) scr = SCR_BOOT;
  SK_SCREEN = scr;
}

u8 sitek_get_screen(void) {
  return SK_SCREEN;
}

void sitek_set_cursor(u8 cur) {
  SK_CURSOR = (u8)(cur & 63);
}

void sitek_set_sub(u8 sub) {
  SK_SUB = (u8)(sub % 3);
}

void sitek_tick(void) {
  SK_TICK = (u16)((SK_TICK + 1) & 0xFFFF);
  if (SK_SCREEN == SCR_TERR) {
    if ((SK_TICK & 1) == 0) tr_step();
  }
}

void sitek_render(void) {
  fb_clear();
  if (SK_SCREEN == SCR_BOOT) {
    render_boot();
    return;
  }
  draw_status();
  if (SK_SCREEN == SCR_GRID) render_grid();
  else if (SK_SCREEN == SCR_KEYS) render_keys();
  else if (SK_SCREEN == SCR_TERR) render_terr();
  else render_info();
}
