/* TI-85 entry point — 128x64, launched from a ZShell-compatible shell. */
#include "sitek.h"

void plat_lcd_init(void);
void plat_lcd_blit(void);
unsigned char plat_key(void);

void main(void) {
  plat_lcd_init();
  sitek_init(DEV_TI85, 128, 64);
  while (SK_QUIT == 0) {
    sitek_tick();
    plat_lcd_blit();
    sitek_key(plat_key());
  }
}
