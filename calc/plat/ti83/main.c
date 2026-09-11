/* TI-83 / TI-83+ / TI-84+ entry point.
 *
 * The whole platform contract is four calls: init, tick, blit, key.
 * Everything drawn comes from calc/core.
 */
#include "sitek.h"

void plat_lcd_init(void);
void plat_lcd_blit(void);
unsigned char plat_key(void);

void main(void) {
  plat_lcd_init();
  sitek_init(DEV_TI83, 96, 64);
  while (SK_QUIT == 0) {
    sitek_tick();
    plat_lcd_blit();
    sitek_key(plat_key());
  }
}
