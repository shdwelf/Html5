/* dle.c — see dle.h. */
#include "dle.h"

void dle_dec_init(dle_dec_t *d)
{
    d->in_escape = 0;
}

dle_event_t dle_decode(dle_dec_t *d, uint8_t b, uint8_t out[2], size_t *n)
{
    *n = 0;

    if (!d->in_escape) {
        if (b == DLE) {
            d->in_escape = 1;
            return DLE_EV_DATA; /* nothing emitted yet; caller sees *n == 0 */
        }
        out[0] = b;
        *n = 1;
        return DLE_EV_DATA;
    }

    /* Second octet of an escape pair. */
    d->in_escape = 0;
    switch (b) {
    case DLE:      /* one 0x10 in the data */
        out[0] = DLE;
        *n = 1;
        return DLE_EV_DATA;
    case DLE_SUB:  /* two 0x10 patterns */
        out[0] = DLE;
        out[1] = DLE;
        *n = 2;
        return DLE_EV_DATA;
    case DLE_ETX:  return DLE_EV_END;
    case DLE_EOT:  return DLE_EV_ABORT;
    case DLE_DC1:  return DLE_EV_FC_ON;
    case DLE_DC3:  return DLE_EV_FC_OFF;
    default:       /* includes DLE <ferr>, whose value is implementation-defined */
        out[0] = b;
        *n = 1;
        return DLE_EV_UNKNOWN;
    }
}

size_t dle_encode(uint8_t in, uint8_t out[2])
{
    if (in == DLE) {
        out[0] = DLE;
        out[1] = DLE;
        return 2;
    }
    out[0] = in;
    return 1;
}
