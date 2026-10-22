/*
 * fcs.c — see fcs.h. Bitwise so it costs nothing on an M3; swap for a 256-entry
 * table if a page image ever makes this hot.
 */
#include "fcs.h"

#define FCS_POLY_REFLECTED 0x8408u /* 0x1021 reflected */

uint16_t fcs_update(uint16_t fcs, uint8_t octet)
{
    fcs ^= octet;
    for (int i = 0; i < 8; i++) {
        if (fcs & 1u)
            fcs = (uint16_t)((fcs >> 1) ^ FCS_POLY_REFLECTED);
        else
            fcs = (uint16_t)(fcs >> 1);
    }
    return fcs;
}

uint16_t fcs_block(const uint8_t *p, size_t n)
{
    uint16_t fcs = FCS_INIT;
    while (n--)
        fcs = fcs_update(fcs, *p++);
    return fcs;
}

uint16_t fcs_final(uint16_t fcs)
{
    return (uint16_t)(fcs ^ 0xFFFFu);
}

int fcs_check(const uint8_t *frame, size_t n)
{
    if (n < 3) /* address + control + at least one FCS octet */
        return 0;
    return fcs_block(frame, n) == FCS_GOOD_RESIDUE;
}
