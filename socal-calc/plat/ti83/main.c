/* TI-83 / TI-83+ / TI-84+ entry point for SOCAL SUBSURFACE.
 *
 * The platform contract is the same four calls the SITE-K port uses:
 * init, tick, blit, key. Everything drawn comes from socal-calc/core.
 *
 * Build:  python3 calc/tools/build_device.py --root socal-calc --device ti83
 *         (needs sdcc and ti83plus.inc in this directory)
 */
#include "socal.h"

void plat_lcd_init(void);
void plat_lcd_blit(void);
unsigned char plat_key(void);

void main(void) {
  plat_lcd_init();
  socal_init(DEV_TI83, 96, 64);
  while (SK_QUIT == 0) {
    socal_tick();
    plat_lcd_blit();
    socal_key(plat_key());
  }
}
