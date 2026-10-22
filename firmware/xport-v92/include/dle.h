/*
 * dle.h — the Class 1 "transparent data" escape layer.
 *
 * HDLC payload octets may not contain DLE (0x10), so T.31 wraps the frame in a
 * second escape layer between DTE and DCE:
 *
 *   10 10   DLE DLE    one 0x10 in the data
 *   10 1A   DLE SUB    two 0x10 patterns
 *   10 03   DLE ETX    end of frame / end of stream
 *   10 04   DLE EOT    abort, host-initiated termination
 *   10 11   DLE DC1    enable flow control
 *   10 13   DLE DC3    disable flow control
 *
 * On +FRH the DCE terminates a frame with DLE ETX when the FCS it checked was
 * good, and with DLE <ferr> when it was not. T.31 names that sequence but the
 * octet after DLE is implementation-defined, so this decoder does not guess it:
 * anything after DLE that is not one of the six above is reported as
 * DLE_EV_UNKNOWN with the octet in *out, and the caller decides.
 */
#ifndef DLE_H
#define DLE_H

#include <stddef.h>
#include <stdint.h>

#define DLE 0x10u
#define DLE_ETX 0x03u
#define DLE_EOT 0x04u
#define DLE_DC1 0x11u
#define DLE_DC3 0x13u
#define DLE_SUB 0x1Au

typedef enum {
    DLE_EV_DATA,    /* *out is a payload octet */
    DLE_EV_END,     /* DLE ETX */
    DLE_EV_ABORT,   /* DLE EOT */
    DLE_EV_FC_ON,   /* DLE DC1 */
    DLE_EV_FC_OFF,  /* DLE DC3 */
    DLE_EV_UNKNOWN, /* DLE + anything else, incl. DLE <ferr>; *out is that octet */
} dle_event_t;

typedef struct {
    int in_escape;
} dle_dec_t;

void dle_dec_init(dle_dec_t *d);

/*
 * Feed one octet from the modem. Returns the event.
 *
 * For DLE_EV_DATA, out[] receives 1 or 2 payload octets and *n says how many:
 * DLE SUB expands to two 0x10 octets from a single two-byte sequence, so a
 * one-in-one-out API cannot express it. For DLE_EV_UNKNOWN, out[0] is the
 * octet that followed DLE and *n is 1. Otherwise *n is 0.
 */
dle_event_t dle_decode(dle_dec_t *d, uint8_t b, uint8_t out[2], size_t *n);

/*
 * Escape one octet for the modem. Writes 1 or 2 bytes to out (which must have
 * room for 2) and returns how many.
 */
size_t dle_encode(uint8_t in, uint8_t out[2]);

#endif /* DLE_H */
