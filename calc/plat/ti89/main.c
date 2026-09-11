/* TI-89 / TI-89 Titanium entry point — TIGCC (or GCC4TI).
 *
 * Build:  tigcc -O2 -DUSE_TI89 -o sitek.89z plat/ti89/main.c core/*.c
 *
 * The 68k LCD is 1 bit per pixel with LCD_WIDTH/8 bytes per row, which is
 * exactly the core's framebuffer layout, so the blit is a straight copy.
 */
#define USE_TI89
#define MIN_AMS 100
#define SAVE_SCREEN

#include <tigcclib.h>
#include "sitek.h"

static unsigned char map_key(unsigned short k) {
  if (k == KEY_LEFT) return SKK_LEFT;
  if (k == KEY_RIGHT) return SKK_RIGHT;
  if (k == KEY_UP) return SKK_UP;
  if (k == KEY_DOWN) return SKK_DOWN;
  if (k == KEY_ENTER) return SKK_ENTER;
  if (k == KEY_ESC) return SKK_EXIT;
  if (k == KEY_F1) return SKK_ACT;
  if (k >= '1' && k <= '5') return (unsigned char)(SKK_1 + (k - '1'));
  return SKK_NONE;
}

void _main(void) {
  unsigned short k;
  sitek_init(DEV_TI89, LCD_WIDTH, LCD_HEIGHT);
  clrscr();
  while (SK_QUIT == 0) {
    sitek_tick();
    /* SK_FB is already in LCD order: 160x100, 20 bytes per row. */
    memcpy(LCD_MEM, SK_FB, LCD_WIDTH / 8 * LCD_HEIGHT);
    k = ngetchx();
    sitek_key(map_key(k));
  }
}
