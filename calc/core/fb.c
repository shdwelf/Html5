/* core/fb.c — 1-bit framebuffer shared by every target.
 *
 * Layout is the calculator's own: rows of SK_ROWB bytes, MSB left, which is
 * exactly what the TI-83/85/90 gbuf and the 68k LCD_MEM expect, so the
 * platform blitter is a straight copy.
 */
#include "sitek.h"

extern const u8 FONT3x5[220];

u8 SK_FB[FB_MAX];

void fb_clear(void) {
  u16 i;
  for (i = 0; i < SK_FBB; i++) SK_FB[i] = 0;
}

void fb_px(u16 x, u16 y, u8 mode) {
  u16 o;
  u8 m;
  if (x >= SK_W) return;
  if (y >= SK_H) return;
  o = (u16)(y * SK_ROWB + (x >> 3));
  m = (u8)(128 >> (x & 7));
  if (mode == PX_SET) SK_FB[o] = (u8)(SK_FB[o] | m);
  else if (mode == PX_CLEAR) SK_FB[o] = (u8)(SK_FB[o] & (u8)(~m));
  else SK_FB[o] = (u8)(SK_FB[o] ^ m);
}

u8 fb_get(u16 x, u16 y) {
  u16 o;
  u8 m;
  if (x >= SK_W) return 0;
  if (y >= SK_H) return 0;
  o = (u16)(y * SK_ROWB + (x >> 3));
  m = (u8)(128 >> (x & 7));
  if ((SK_FB[o] & m) != 0) return 1;
  return 0;
}

void fb_hline(u16 x0, u16 x1, u16 y, u8 mode) {
  u16 x;
  if (x1 < x0) return;
  for (x = x0; x <= x1; x++) fb_px(x, y, mode);
}

void fb_vline(u16 x, u16 y0, u16 y1, u8 mode) {
  u16 y;
  if (y1 < y0) return;
  for (y = y0; y <= y1; y++) fb_px(x, y, mode);
}

void fb_line(u16 x0, u16 y0, u16 x1, u16 y1, u8 mode) {
  int x;
  int y;
  int dx;
  int dy;
  int sx;
  int sy;
  int err;
  int e2;
  x = (int)x0;
  y = (int)y0;
  dx = iabs((int)x1 - (int)x0);
  dy = iabs((int)y1 - (int)y0);
  if (x0 < x1) sx = 1;
  else sx = -1;
  if (y0 < y1) sy = 1;
  else sy = -1;
  err = dx - dy;
  while (1) {
    fb_px((u16)x, (u16)y, mode);
    if (x == (int)x1 && y == (int)y1) break;
    e2 = err * 2;
    if (e2 > -dy) {
      err = err - dy;
      x = x + sx;
    }
    if (e2 < dx) {
      err = err + dx;
      y = y + sy;
    }
  }
}

void fb_rect(u16 x, u16 y, u16 w, u16 h, u8 mode) {
  if (w < 1) return;
  if (h < 1) return;
  fb_hline(x, (u16)(x + w - 1), y, mode);
  fb_hline(x, (u16)(x + w - 1), (u16)(y + h - 1), mode);
  fb_vline(x, y, (u16)(y + h - 1), mode);
  fb_vline((u16)(x + w - 1), y, (u16)(y + h - 1), mode);
}

void fb_box(u16 x, u16 y, u16 w, u16 h, u8 fill) {
  u16 i;
  u16 j;
  u8 on;
  for (j = 0; j < h; j++) {
    for (i = 0; i < w; i++) {
      on = 0;
      if (fill == FILL_SOLID) on = 1;
      else if (fill == FILL_HALF) {
        if (((x + i + y + j) & 1) == 0) on = 1;
      } else if (fill == FILL_QUARTER) {
        if (((x + i + y + j) & 3) == 0) on = 1;
      }
      if (on != 0) fb_px((u16)(x + i), (u16)(y + j), PX_SET);
      else if (fill != FILL_CLEAR) fb_px((u16)(x + i), (u16)(y + j), PX_CLEAR);
    }
  }
}

static u16 font_index(u8 c) {
  if (c >= 48 && c <= 57) return (u16)(c - 48);
  if (c >= 65 && c <= 90) return (u16)(18 + (c - 65));
  if (c == 32) return 10;
  if (c == 46) return 11;
  if (c == 45) return 12;
  if (c == 58) return 13;
  if (c == 47) return 14;
  if (c == 43) return 15;
  if (c == 42) return 16;
  if (c == 35) return 17;
  return 10;
}

void fb_textm(u16 x, u16 y, const u8 *s, u8 mode) {
  u16 i;
  u16 cx;
  u16 gi;
  u16 r;
  u16 b;
  u8 bits;
  i = 0;
  cx = x;
  while (s[i] != 0) {
    gi = font_index(s[i]);
    for (r = 0; r < 5; r++) {
      bits = FONT3x5[gi * 5 + r];
      for (b = 0; b < 3; b++) {
        if ((bits & (4 >> b)) != 0) fb_px((u16)(cx + b), (u16)(y + r), mode);
        else if (mode == PX_CLEAR) fb_px((u16)(cx + b), (u16)(y + r), PX_CLEAR);
      }
    }
    cx = (u16)(cx + 4);
    i = i + 1;
  }
}

void fb_text(u16 x, u16 y, const u8 *s) {
  fb_textm(x, y, s, PX_SET);
}

void fb_text2(u16 x, u16 y, const u8 *s) {
  u16 i;
  u16 cx;
  u16 gi;
  u16 r;
  u16 b;
  u8 bits;
  i = 0;
  cx = x;
  while (s[i] != 0) {
    gi = font_index(s[i]);
    for (r = 0; r < 5; r++) {
      bits = FONT3x5[gi * 5 + r];
      for (b = 0; b < 3; b++) {
        if ((bits & (4 >> b)) != 0) {
          fb_px((u16)(cx + b * 2), (u16)(y + r * 2), PX_SET);
          fb_px((u16)(cx + b * 2 + 1), (u16)(y + r * 2), PX_SET);
          fb_px((u16)(cx + b * 2), (u16)(y + r * 2 + 1), PX_SET);
          fb_px((u16)(cx + b * 2 + 1), (u16)(y + r * 2 + 1), PX_SET);
        } else {
          fb_px((u16)(cx + b * 2), (u16)(y + r * 2), PX_CLEAR);
          fb_px((u16)(cx + b * 2 + 1), (u16)(y + r * 2), PX_CLEAR);
          fb_px((u16)(cx + b * 2), (u16)(y + r * 2 + 1), PX_CLEAR);
          fb_px((u16)(cx + b * 2 + 1), (u16)(y + r * 2 + 1), PX_CLEAR);
        }
      }
    }
    cx = (u16)(cx + 8);
    i = i + 1;
  }
}

u16 fb_text_w(const u8 *s) {
  u16 n;
  n = 0;
  while (s[n] != 0) n = n + 1;
  if (n == 0) return 0;
  return (u16)(n * 4 - 1);
}

u16 str_copy(u8 *dst, const u8 *src) {
  u16 n;
  n = 0;
  while (src[n] != 0) {
    dst[n] = src[n];
    n = n + 1;
  }
  dst[n] = 0;
  return n;
}

u16 str_copy_at(u8 *dst, u16 at, const u8 *src) {
  u16 n;
  n = 0;
  while (src[n] != 0) {
    dst[at + n] = src[n];
    n = n + 1;
  }
  dst[at + n] = 0;
  return n;
}

u16 num_to(u8 *dst, u16 at, u16 v) {
  u16 div;
  u16 d;
  u16 n;
  u16 started;
  u16 rest;
  div = 10000;
  n = 0;
  started = 0;
  rest = v;
  while (div > 0) {
    d = (u16)idiv((int)rest, (int)div);
    if (d > 0 || started != 0 || div == 1) {
      dst[at + n] = (u8)(48 + d);
      n = n + 1;
      started = 1;
    }
    rest = (u16)(rest - d * div);
    div = (u16)idiv((int)div, 10);
  }
  return n;
}
