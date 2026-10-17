/*
 * xport.h — Lantronix xPort Pro side of the bridge.
 *
 * The xPort Pro is a serial-to-Ethernet device server. Two things matter here:
 * getting it into command mode without the guard time swallowing the attempt,
 * and keeping its channel configuration consistent with what the modem link
 * expects.
 *
 * Response codes beyond "0 = handled" are taken from the xPort Pro Integration
 * Guide 900-557 and are NOT reproduced here, because this repository has no
 * copy of it to check against. The code treats 0 as success and anything else
 * as failure, which is enough to drive a bring-up sequence but will not tell
 * you *why* something failed — log the raw byte.
 */
#ifndef XPORT_H
#define XPORT_H

#include <stddef.h>
#include <stdint.h>

/*
 * Guard-time detector for the +++ escape.
 *
 * The sequence only counts as an escape if the line has been idle for at least
 * guard_ms before the first '+' and the three '+' arrive inside that window.
 * Without the guard, three '+' in a fax image or a binary payload would drop
 * the connection mid-transfer — which is exactly the failure this exists to
 * prevent on a card that bridges an unframed image channel.
 */
typedef struct {
    uint8_t esc_char;
    int idx;
    uint32_t guard_ms;
    uint32_t idle_since_ms;
    int armed;         /* idle long enough to accept an escape */
    uint32_t first_ms; /* when the current partial escape started */
} xport_esc_t;

void xport_esc_init(xport_esc_t *e, uint8_t esc_char, uint32_t guard_ms);

/*
 * Feed one octet heading for the xPort Pro. `now_ms` is a free-running
 * millisecond clock. Returns 1 when a complete guarded escape has been seen.
 */
int xport_esc_feed(xport_esc_t *e, uint8_t b, uint32_t now_ms);

/* Call on a timer tick so a long idle re-arms the detector. */
void xport_esc_tick(xport_esc_t *e, uint32_t now_ms);

/* Format a monitor-mode command. Returns bytes written, or 0 if it would not fit. */
size_t xport_cmd(char *out, size_t cap, const char *fmt, const char *arg);

#endif /* XPORT_H */
