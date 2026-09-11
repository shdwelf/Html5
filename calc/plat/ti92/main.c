/* TI-92 / TI-92 Plus entry point — TIGCC (or GCC4TI).
 *
 * Build:  tigcc -O2 -DUSE_TI92PLUS -o sitek.9xz plat/ti92/main.c core/*.c
 *
 * Biggest LCD in the family: 240x128, 30 bytes per row, 3840-byte framebuffer
 * — this is what FB_MAX is sized for.
 */
#define USE_TI92PLUS
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
  sitek_init(DEV_TI92, LCD_WIDTH, LCD_HEIGHT);
  clrscr();
  while (SK_QUIT == 0) {
    sitek_tick();
    memcpy(LCD_MEM, SK_FB, LCD_WIDTH / 8 * LCD_HEIGHT);
    k = ngetchx();
    sitek_key(map_key(k));
  }
}
