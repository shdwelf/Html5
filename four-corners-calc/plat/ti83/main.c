/* TI-83 / TI-83+ / TI-84+ entry point for FOUR CORNERS.
 *
 * The platform contract is the same four calls the SITE-K and SOCAL ports
 * use: init, tick, blit, key. Everything drawn comes from
 * four-corners-calc/core.
 *
 * Build:  python3 calc/tools/build_device.py --root four-corners-calc --device ti83
 *         (needs sdcc and ti83plus.inc in this directory)
 */
#include "fourcorners.h"

void plat_lcd_init(void);
void plat_lcd_blit(void);
unsigned char plat_key(void);

void main(void) {
  plat_lcd_init();
  fcorner_init(DEV_TI83, 96, 64);
  while (SK_QUIT == 0) {
    fcorner_tick();
    plat_lcd_blit();
    fcorner_key(plat_key());
  }
}
