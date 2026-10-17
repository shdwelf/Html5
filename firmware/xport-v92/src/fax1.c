/* fax1.c — see fax1.h. */
#include "fax1.h"

#include <string.h>

#include "at.h"

/* ------------------------------------------------------------------ frames */

int fax1_build(fax1_frame_t *f, uint8_t addr, uint8_t control_base, int final,
               const uint8_t *info, size_t info_len)
{
    if (info_len > FAX1_MAX_INFO)
        return 0;
    f->buf[0] = addr;
    f->buf[1] = (uint8_t)(control_base | (final ? FAX1_PF : 0));
    if (info_len)
        memcpy(&f->buf[2], info, info_len);
    f->len = info_len + 2;
    return 1;
}

size_t fax1_escape(const fax1_frame_t *f, uint8_t *out, size_t out_cap)
{
    size_t n = 0;
    for (size_t i = 0; i < f->len; i++) {
        uint8_t tmp[2];
        size_t k = dle_encode(f->buf[i], tmp);
        if (n + k > out_cap)
            break;
        memcpy(out + n, tmp, k);
        n += k;
    }
    /* End the frame. */
    if (n + 2 <= out_cap) {
        out[n++] = DLE;
        out[n++] = DLE_ETX;
    }
    return n;
}

/* ------------------------------------------------------------------ receive */

void fax1_rx_init(fax1_rx_t *r)
{
    dle_dec_init(&r->dle);
    r->len = 0;
    r->overflow = 0;
    r->fcs_bad = 0;
}

static void push(fax1_rx_t *r, const uint8_t *p, size_t n)
{
    for (size_t i = 0; i < n; i++) {
        if (r->len >= sizeof(r->frame)) {
            r->overflow = 1;
            return;
        }
        r->frame[r->len++] = p[i];
    }
}

fax1_rx_event_t fax1_rx_feed(fax1_rx_t *r, uint8_t b)
{
    uint8_t out[2];
    size_t n = 0;
    dle_event_t ev = dle_decode(&r->dle, b, out, &n);

    switch (ev) {
    case DLE_EV_DATA:
        if (n)
            push(r, out, n);
        return r->overflow ? FAX1_RX_OVERFLOW : FAX1_RX_MORE;

    case DLE_EV_END: {
        /* The modem checked the FCS and said it was good. Check it too. */
        if (r->overflow)
            return FAX1_RX_OVERFLOW;
        if (r->len >= 4 && !fcs_check(r->frame, r->len))
            r->fcs_bad = 1;
        return r->fcs_bad ? FAX1_RX_FRAME_BAD : FAX1_RX_FRAME_OK;
    }

    case DLE_EV_UNKNOWN:
        /* DLE <ferr>: the modem already told us the FCS was bad. */
        if (n)
            push(r, out, n);
        r->fcs_bad = 1;
        return r->overflow ? FAX1_RX_OVERFLOW : FAX1_RX_FRAME_BAD;

    case DLE_EV_ABORT:
        return FAX1_RX_ABORT;

    case DLE_EV_FC_ON:
    case DLE_EV_FC_OFF:
    default:
        return FAX1_RX_MORE;
    }
}

const uint8_t *fax1_rx_info(const fax1_rx_t *r, size_t *info_len)
{
    if (r->len < 4) {
        *info_len = 0;
        return NULL;
    }
    *info_len = r->len - 4; /* strip address, control and the two FCS octets */
    return &r->frame[2];
}

uint8_t fax1_rx_fcf(const fax1_rx_t *r)
{
    size_t n = 0;
    const uint8_t *info = fax1_rx_info(r, &n);
    return (info && n >= 1) ? info[0] : 0;
}

/* ------------------------------------------------------------------ session */

void fax1_begin(fax1_session_t *s, int max_retrains)
{
    s->state = S_DIAL;
    s->retrains = 0;
    s->max_retrains = max_retrains > 0 ? max_retrains : 3;
    s->pages_sent = 0;
    s->last_fcf = 0;
    s->last_fhs = 0;
    s->step = 0;
}

/* True for the results that mean the call did not connect. */
static int is_call_failure(int res)
{
    return res == AT_NO_CARRIER || res == AT_NO_DIALTONE ||
           res == AT_BUSY || res == AT_NO_ANSWER || res == AT_ERROR;
}

fax1_action_t fax1_next(fax1_session_t *s, int res, uint8_t fcf, int frame_good)
{
    switch (s->state) {
    case S_DIAL:
        if (res == AT_CONNECT) { s->step = 0; s->state = S_WAIT_DIS; return FAX1_ACT_AT_FRH_3; }
        if (is_call_failure(res)) { s->state = S_FAILED; return FAX1_ACT_FAIL; }
        return FAX1_ACT_NONE;

    case S_WAIT_DIS:
        if (res == AT_CONNECT) return FAX1_ACT_NONE; /* carrier up, frame pending */
        if (is_call_failure(res)) { s->state = S_FAILED; return FAX1_ACT_FAIL; }
        if (fcf && frame_good) {
            s->last_fcf = fcf;
            /* DIS is what we want; CSI and NSF may precede it and are accepted. */
            if (fcf == T30_DIS || fcf == T30_CSI || fcf == T30_NSF) {
                s->step = 0;
                s->state = S_SEND_TSI;
                return FAX1_ACT_AT_FTH_3;
            }
        }
        if (fcf && !frame_good) return FAX1_ACT_AT_FRH_3; /* corrupt: ask again */
        return FAX1_ACT_NONE;

    case S_SEND_TSI:
        /* CONNECT after +FTH=3 → send TSI with P/F=0 so the modem holds carrier. */
        if (res == AT_CONNECT && s->step == 0) { s->step = 1; return FAX1_ACT_SEND_TSI; }
        /* CONNECT again because P/F was 0 → now send DCS with P/F=1. */
        if (res == AT_CONNECT && s->step == 1) {
            s->step = 0;
            s->state = S_SEND_DCS;
            return FAX1_ACT_SEND_DCS;
        }
        if (is_call_failure(res)) { s->state = S_FAILED; return FAX1_ACT_FAIL; }
        return FAX1_ACT_NONE;

    case S_SEND_DCS:
        /* OK here means P/F=1 took: the modem dropped carrier and is back in
         * command mode. Move on to the training check. */
        if (res == AT_OK) { s->step = 0; s->state = S_SEND_TCF; return FAX1_ACT_AT_FTS_FTM; }
        if (is_call_failure(res)) { s->state = S_FAILED; return FAX1_ACT_FAIL; }
        return FAX1_ACT_NONE;

    case S_SEND_TCF:
        if (res == AT_CONNECT) { s->step = 1; return FAX1_ACT_SEND_TCF; }
        if (res == AT_OK && s->step == 1) { s->step = 0; s->state = S_WAIT_CFR; return FAX1_ACT_AT_FRH_3; }
        if (is_call_failure(res)) { s->state = S_FAILED; return FAX1_ACT_FAIL; }
        return FAX1_ACT_NONE;

    case S_WAIT_CFR:
        if (res == AT_CONNECT) return FAX1_ACT_NONE;
        if (is_call_failure(res)) { s->state = S_FAILED; return FAX1_ACT_FAIL; }
        if (fcf && frame_good) {
            s->last_fcf = fcf;
            if (fcf == T30_CFR) { s->step = 0; s->state = S_SEND_PAGE; return FAX1_ACT_AT_FTS_FTM; }
            if (fcf == T30_FTT) {
                s->retrains++;
                if (s->retrains >= s->max_retrains) { s->state = S_FAILED; return FAX1_ACT_FAIL; }
                s->step = 0;
                s->state = S_SEND_TSI;      /* renegotiate from the ident phase */
                return FAX1_ACT_AT_FTH_3;
            }
        }
        return FAX1_ACT_NONE;

    case S_SEND_PAGE:
        if (res == AT_CONNECT) { s->step = 1; return FAX1_ACT_SEND_PAGE; }
        if (res == AT_OK && s->step == 1) { s->step = 0; s->pages_sent++; s->state = S_SEND_EOP; return FAX1_ACT_AT_FTH_3; }
        if (is_call_failure(res)) { s->state = S_FAILED; return FAX1_ACT_FAIL; }
        return FAX1_ACT_NONE;

    case S_SEND_EOP:
        if (res == AT_CONNECT) { s->step = 1; return FAX1_ACT_SEND_EOP; }
        if (res == AT_OK && s->step == 1) { s->step = 0; s->state = S_WAIT_MCF; return FAX1_ACT_AT_FRH_3; }
        if (is_call_failure(res)) { s->state = S_FAILED; return FAX1_ACT_FAIL; }
        return FAX1_ACT_NONE;

    case S_WAIT_MCF:
        if (res == AT_CONNECT) return FAX1_ACT_NONE;
        if (is_call_failure(res)) { s->state = S_FAILED; return FAX1_ACT_FAIL; }
        if (fcf && frame_good) {
            s->last_fcf = fcf;
            if (fcf == T30_MCF || fcf == T30_RTP) { s->state = S_HANGUP; return FAX1_ACT_ATH; }
            if (fcf == T30_RTN) {
                s->retrains++;
                if (s->retrains >= s->max_retrains) { s->state = S_FAILED; return FAX1_ACT_FAIL; }
                s->step = 0;
                s->state = S_SEND_TSI;
                return FAX1_ACT_AT_FTH_3;
            }
        }
        return FAX1_ACT_NONE;

    case S_HANGUP:
        if (res == AT_OK) { s->state = S_DONE; return FAX1_ACT_DONE; }
        if (res == AT_FHS) { s->last_fhs = 0; }
        return FAX1_ACT_NONE;

    case S_DONE:  return FAX1_ACT_DONE;
    case S_FAILED: return FAX1_ACT_FAIL;
    default: return FAX1_ACT_NONE;
    }
}

const char *fax1_state_name(fax1_state_t s)
{
    switch (s) {
    case S_IDLE:      return "IDLE";
    case S_DIAL:      return "DIAL";
    case S_WAIT_DIS:  return "WAIT_DIS";
    case S_SEND_TSI:  return "SEND_TSI";
    case S_SEND_DCS:  return "SEND_DCS";
    case S_SEND_TCF:  return "SEND_TCF";
    case S_WAIT_CFR:  return "WAIT_CFR";
    case S_SEND_PAGE: return "SEND_PAGE";
    case S_SEND_EOP:  return "SEND_EOP";
    case S_WAIT_MCF:  return "WAIT_MCF";
    case S_HANGUP:    return "HANGUP";
    case S_DONE:      return "DONE";
    case S_FAILED:    return "FAILED";
    default:          return "?";
    }
}

const char *fax1_action_name(fax1_action_t a)
{
    switch (a) {
    case FAX1_ACT_NONE:       return "NONE";
    case FAX1_ACT_AT_FRH_3:   return "AT+FRH=3";
    case FAX1_ACT_AT_FTH_3:   return "AT+FTH=3";
    case FAX1_ACT_SEND_TSI:   return "SEND_TSI";
    case FAX1_ACT_SEND_DCS:   return "SEND_DCS";
    case FAX1_ACT_AT_FTS_FTM: return "AT+FTS;AT+FTM";
    case FAX1_ACT_SEND_TCF:   return "SEND_TCF";
    case FAX1_ACT_SEND_PAGE:  return "SEND_PAGE";
    case FAX1_ACT_SEND_EOP:   return "SEND_EOP";
    case FAX1_ACT_ATH:        return "ATH";
    case FAX1_ACT_DONE:       return "DONE";
    case FAX1_ACT_FAIL:       return "FAIL";
    default:                  return "?";
    }
}
