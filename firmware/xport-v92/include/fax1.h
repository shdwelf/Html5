/*
 * fax1.h — T.31 Class 1 framing and the T.30 phase machine.
 *
 * What the DCE does for us, and what it does not
 *   On +FTH the host sends address + control + information only. The modem
 *   "adds start and end flags, performs zero-bit insertion, generates FCS" —
 *   so this code never computes an FCS for a frame it transmits.
 *   On +FRH the modem hands over address + control + information + the two FCS
 *   octets (4 octets of overhead on a bare frame), terminated by DLE ETX when
 *   the FCS it checked was good and DLE <ferr> when it was not. So the host
 *   does verify the FCS on receive, which is why fcs.h exists.
 *
 * The P/F bit decides whether the call stays up
 *   "if the final bit was a 1 (bit 4 of the second byte received from the DTE),
 *   the modem generates OK and returns to command mode. If the final bit was a
 *   0, the modem generates CONNECT and waits for further data while
 *   transmitting HDLC flags."
 *   That is the whole trick of sending TSI then DCS in one +FTH: the first
 *   frame carries P/F=0 so the modem keeps the carrier up, the last carries
 *   P/F=1 so it drops it. Getting this wrong hangs the call or kills it early.
 */
#ifndef FAX1_H
#define FAX1_H

#include <stddef.h>
#include <stdint.h>

#include "dle.h"
#include "fcs.h"

#define FAX1_ADDR_BROADCAST 0xFFu
#define FAX1_MAX_INFO 256
#define FAX1_MAX_FRAME (FAX1_MAX_INFO + 4)

/*
 * T.30 FCF values. These are the conventional Table 2 encodings and are used
 * here only to label frames in logs and to drive the phase machine; the phase
 * machine itself is FCF-agnostic and takes whatever the caller passes.
 * NOT cross-checked against a copy of T.30 in this repository — verify before
 * relying on them for interoperability.
 */
#define T30_DIS 0x01u /* digital identification signal (received) */
#define T30_CSI 0x02u /* called subscriber identification */
#define T30_NSF 0x04u /* non-standard facilities */
#define T30_CFR 0x21u /* confirmation to receive */
#define T30_FTT 0x22u /* failure to train */
#define T30_MCF 0x31u /* message confirmation */
#define T30_RTP 0x32u /* request to poll */
#define T30_RTN 0x33u /* retrain negative */
#define T30_DCS 0x41u /* digital command signal */
#define T30_TSI 0x42u /* transmitting subscriber identification */
#define T30_MPS 0x25u /* multi-page signal */
#define T30_EOP 0x26u /* end of procedures */

/* Modulation <MOD> values for +FTM/+FRM/+FTH/+FRH. */
#define MOD_V21CH2_300  3   /* HDLC signalling channel */
#define MOD_V27TER_2400 24
#define MOD_V27TER_4800 48
#define MOD_V29_9600    96
#define MOD_V17_14400   146

/* ------------------------------------------------------------------ frames */

/*
 * Build a transmit frame body: address, control, information. The caller DLE-
 * escapes it and follows it with DLE ETX. `final` sets the P/F bit, which is
 * what tells the modem whether to drop carrier after this frame.
 */
typedef struct {
    uint8_t buf[FAX1_MAX_FRAME];
    size_t len;
} fax1_frame_t;

int fax1_build(fax1_frame_t *f, uint8_t addr, uint8_t control_base, int final,
               const uint8_t *info, size_t info_len);

/* The P/F bit, bit 4 of the control octet. */
#define FAX1_PF 0x10u

/* Escape a whole frame into out (needs 2x room). Returns bytes written. */
size_t fax1_escape(const fax1_frame_t *f, uint8_t *out, size_t out_cap);

/* ------------------------------------------------------------------ receive */

typedef enum {
    FAX1_RX_MORE,      /* still inside a frame */
    FAX1_RX_FRAME_OK,  /* DLE ETX: frame complete, FCS verified good */
    FAX1_RX_FRAME_BAD, /* DLE <ferr> or FCS mismatch: frame complete, corrupt */
    FAX1_RX_OVERFLOW,  /* frame longer than FAX1_MAX_FRAME; discarded */
    FAX1_RX_ABORT,     /* DLE EOT */
} fax1_rx_event_t;

typedef struct {
    dle_dec_t dle;
    uint8_t frame[FAX1_MAX_FRAME];
    size_t len;
    int overflow;
    int fcs_bad;
} fax1_rx_t;

void fax1_rx_init(fax1_rx_t *r);

/*
 * Feed one octet from the modem UART. On a terminal event, r->frame / r->len
 * hold the frame including its two FCS octets.
 */
fax1_rx_event_t fax1_rx_feed(fax1_rx_t *r, uint8_t b);

/* Information octets of a received frame (skips address and control). */
const uint8_t *fax1_rx_info(const fax1_rx_t *r, size_t *info_len);

/* FCF of a received frame: the first information octet. 0 if the frame is short. */
uint8_t fax1_rx_fcf(const fax1_rx_t *r);

/* ------------------------------------------------------------------ session */

typedef enum {
    S_IDLE = 0,
    S_DIAL,        /* ATD sent, waiting for CONNECT */
    S_WAIT_DIS,    /* +FRH=3, waiting for DIS from the called station */
    S_SEND_TSI,    /* +FTH=3, sending TSI with P/F=0 */
    S_SEND_DCS,    /* same carrier, sending DCS with P/F=1 */
    S_SEND_TCF,    /* +FTS then +FTM, sending the training check */
    S_WAIT_CFR,    /* +FRH=3, waiting for CFR or FTT */
    S_SEND_PAGE,   /* +FTM, image data then RTC */
    S_SEND_EOP,    /* +FTH=3, sending EOP/MPS with P/F=1 */
    S_WAIT_MCF,    /* +FRH=3, waiting for MCF */
    S_HANGUP,
    S_DONE,
    S_FAILED,
} fax1_state_t;

typedef struct {
    fax1_state_t state;
    int retrains;      /* FTT count so far */
    int max_retrains;
    int pages_sent;
    int last_fcf;      /* FCF of the last frame received, for logging */
    long last_fhs;     /* last +FHS:<n> */
    int step;          /* sub-step within the current phase */
} fax1_session_t;

typedef enum {
    FAX1_ACT_NONE = 0,
    FAX1_ACT_AT_FRH_3,  /* issue AT+FRH=3 */
    FAX1_ACT_AT_FTH_3,  /* issue AT+FTH=3 */
    FAX1_ACT_SEND_TSI,
    FAX1_ACT_SEND_DCS,
    FAX1_ACT_AT_FTS_FTM,/* issue AT+FTS=<n>; then AT+FTM=<mod> */
    FAX1_ACT_SEND_TCF,
    FAX1_ACT_SEND_PAGE,
    FAX1_ACT_SEND_EOP,
    FAX1_ACT_ATH,
    FAX1_ACT_DONE,
    FAX1_ACT_FAIL,
} fax1_action_t;

void fax1_begin(fax1_session_t *s, int max_retrains);

/*
 * Advance the session. `res` is the AT result just parsed (AT_NONE if this is
 * a frame event rather than a result), `fcf` is the FCF of a frame just
 * received (0 when there was none), and `frame_good` says whether its FCS was
 * valid. Returns what the caller should do next.
 */
fax1_action_t fax1_next(fax1_session_t *s, int res, uint8_t fcf, int frame_good);

const char *fax1_state_name(fax1_state_t s);
const char *fax1_action_name(fax1_action_t a);

#endif /* FAX1_H */
