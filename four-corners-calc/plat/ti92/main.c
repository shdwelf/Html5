/* TI-92 / TI-92 Plus entry point for FOUR CORNERS — TIGCC / GCC4TI.
 *
 * Build:  tigcc -O2 -DUSE_TI92PLUS -I four-corners-calc/core -I calc/core \
 *               -o fcorner.9xz plat/ti92/main.c <core sources>
 *
 * Biggest LCD in the family: 240x128, 30 bytes per row, 3840-byte
 * framebuffer — this is what FB_MAX is sized for. It is the only target
 * that fits the full dossier: name, tier + kind, position and three lines
 * of the story sentence at once.
 */
#define USE_TI92PLUS
#define MIN_AMS 100
#define SAVE_SCREEN

#include <tigcclib.h>
#include "fourcorners.h"

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
  fcorner_init(DEV_TI92, LCD_WIDTH, LCD_HEIGHT);
  clrscr();
  while (SK_QUIT == 0) {
    fcorner_tick();
    memcpy(LCD_MEM, SK_FB, LCD_WIDTH / 8 * LCD_HEIGHT);
    k = ngetchx();
    fcorner_key(map_key(k));
  }
}
