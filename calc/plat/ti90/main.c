/* TI-90 entry point.
 *
 * No TI-90 was ever shipped. This profile is a TI-83-class Z80 build
 * (96x64, same AsmPrgm container) with its own device id, seed and variable
 * name, so the "TI-90" you asked for exists as a real, buildable target that
 * differs from the TI-83 in name, seed and every device-dependent panel —
 * while sharing one core and one Z80 backend.
 *
 * Reuses plat/ti83/{crt0.asm,lcd.asm}.
 */
#include "sitek.h"

void plat_lcd_init(void);
void plat_lcd_blit(void);
unsigned char plat_key(void);

void main(void) {
  plat_lcd_init();
  sitek_init(DEV_TI90, 96, 64);
  while (SK_QUIT == 0) {
    sitek_tick();
    plat_lcd_blit();
    sitek_key(plat_key());
  }
}
