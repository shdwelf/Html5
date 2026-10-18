/*
 * run_tests.c — host-side tests for the xPort Pro / Nucleo / V.92 bridge core.
 *
 * These run against the same .c files the STM32 build compiles; only hal.h is
 * swapped. Build with `make test` in firmware/xport-v92.
 *
 * Reference values below come from an independent CRC-16/X-25 implementation,
 * not from fcs.c: the published check value for CRC-16/X-25 over "123456789"
 * is 0x906E, and the residue over a frame plus its own appended FCS is 0xF0B8.
 */
#include <stdio.h>
#include <string.h>

#include "at.h"
#include "dle.h"
#include "fax1.h"
#include "fcs.h"
#include "xport.h"

static int checks, failures;

#define CHECK(cond)                                                          \
    do {                                                                     \
        checks++;                                                            \
        if (!(cond)) {                                                       \
            failures++;                                                      \
            printf("  FAIL %s:%d  %s\n", __FILE__, __LINE__, #cond);         \
        }                                                                    \
    } while (0)

#define CHECK_EQ(a, b)                                                       \
    do {                                                                     \
        checks++;                                                            \
        long check_a_ = (long)(a), check_b_ = (long)(b);                     \
        if (check_a_ != check_b_) {                                          \
            failures++;                                                      \
            printf("  FAIL %s:%d  %s == %s  (%ld != %ld)\n", __FILE__,       \
                   __LINE__, #a, #b, check_a_, check_b_);                    \
        }                                                                    \
    } while (0)

/* --------------------------------------------------------------------- FCS */

static void test_fcs(void)
{
    printf("fcs\n");

    /* Published CRC-16/X-25 check value. */
    const uint8_t std[] = "123456789";
    CHECK_EQ(fcs_final(fcs_block(std, 9)), 0x906E);

    /* A T.30 DIS frame with its FCS appended LSB first. */
    uint8_t frame[] = { 0xFF, 0xC0, 0x01, 0x00, 0x00, 0x00, 0x69, 0x5D };
    CHECK(fcs_check(frame, sizeof frame));

    /* Corrupt one information octet and the check must fail. */
    frame[3] ^= 0x01;
    CHECK(!fcs_check(frame, sizeof frame));
    frame[3] ^= 0x01;

    /* Too short to carry an FCS at all. */
    CHECK(!fcs_check(frame, 2));
}

/* --------------------------------------------------------------------- DLE */

static void test_dle(void)
{
    printf("dle\n");

    /* Every octet survives an encode/decode round trip. */
    for (int v = 0; v < 256; v++) {
        dle_dec_t d;
        dle_dec_init(&d);
        uint8_t esc[2];
        size_t k = dle_encode((uint8_t)v, esc);

        uint8_t got = 0, count = 0;
        for (size_t i = 0; i < k; i++) {
            uint8_t out[2];
            size_t n = 0;
            dle_event_t ev = dle_decode(&d, esc[i], out, &n);
            if (n) {
                count += (uint8_t)n;
                got = out[n - 1];
            }
            CHECK_EQ(ev, DLE_EV_DATA);
        }
        CHECK_EQ(count, 1);
        CHECK_EQ(got, v);
    }

    /* DLE SUB expands to two 0x10 octets from one two-byte sequence. */
    dle_dec_t d;
    dle_dec_init(&d);
    uint8_t out[2];
    size_t n = 0;
    dle_decode(&d, DLE, out, &n);
    CHECK_EQ(n, 0);
    CHECK_EQ(dle_decode(&d, DLE_SUB, out, &n), DLE_EV_DATA);
    CHECK_EQ(n, 2);
    CHECK_EQ(out[0], DLE);
    CHECK_EQ(out[1], DLE);

    /* The control sequences. */
    struct { uint8_t b; dle_event_t ev; } cases[] = {
        { DLE_ETX, DLE_EV_END }, { DLE_EOT, DLE_EV_ABORT },
        { DLE_DC1, DLE_EV_FC_ON }, { DLE_DC3, DLE_EV_FC_OFF },
    };
    for (size_t i = 0; i < sizeof cases / sizeof cases[0]; i++) {
        dle_dec_init(&d);
        dle_decode(&d, DLE, out, &n);
        CHECK_EQ(dle_decode(&d, cases[i].b, out, &n), cases[i].ev);
    }

    /* DLE <ferr> is implementation-defined, so it must not be guessed at:
     * it comes back as UNKNOWN with the octet preserved. */
    dle_dec_init(&d);
    dle_decode(&d, DLE, out, &n);
    CHECK_EQ(dle_decode(&d, 0x08, out, &n), DLE_EV_UNKNOWN);
    CHECK_EQ(out[0], 0x08);
}

/* ---------------------------------------------------------------------- AT */

/* Feed a whole string and return the result of the last completed line. */
static at_result_t at_feed_str(at_parser_t *p, const char *s, long *param)
{
    at_result_t r = AT_NONE;
    for (const char *c = s; *c; c++) {
        if (at_feed(p, (uint8_t)*c)) {
            r = p->result;
            *param = p->param;
        }
    }
    return r;
}

static void test_at(void)
{
    printf("at\n");
    at_parser_t p;
    long param = -1;

    at_init(&p);
    /* Modems emit blank lines between results; those must not be reported. */
    CHECK_EQ(at_feed_str(&p, "\r\n\r\nOK\r\n", &param), AT_OK);

    at_init(&p);
    CHECK_EQ(at_feed_str(&p, "CONNECT 14400\r", &param), AT_CONNECT);
    CHECK_EQ(param, 14400);

    at_init(&p);
    CHECK_EQ(at_feed_str(&p, "CONNECT\r", &param), AT_CONNECT);
    CHECK_EQ(param, 0); /* bare CONNECT: no rate to report */

    at_init(&p);
    CHECK_EQ(at_feed_str(&p, "+FHS: 3\r", &param), AT_FHS);
    CHECK_EQ(param, 3);

    at_init(&p);
    CHECK_EQ(at_feed_str(&p, "NO CARRIER\r", &param), AT_NO_CARRIER);

    at_init(&p);
    CHECK_EQ(at_feed_str(&p, "RING\r", &param), AT_RING);

    at_init(&p);
    CHECK_EQ(at_feed_str(&p, "+CME ERROR: 10\r", &param), AT_ERROR);

    at_init(&p);
    CHECK_EQ(at_feed_str(&p, "+FCERROR\r", &param), AT_FCERROR);

    at_init(&p);
    CHECK_EQ(at_feed_str(&p, "SOMETHING UNEXPECTED\r", &param), AT_OTHER);

    /* "CONNECT" must not be confused with a line that merely starts with it. */
    at_init(&p);
    CHECK_EQ(at_feed_str(&p, "CONNECTING\r", &param), AT_OTHER);

    CHECK(strcmp(at_result_name(AT_NO_CARRIER), "NO CARRIER") == 0);
}

/* ------------------------------------------------------------------- fax1 */

static void test_fax1_frames(void)
{
    printf("fax1 frames\n");

    fax1_frame_t f;
    const uint8_t info[] = { T30_TSI, '1', '2', '3' };
    CHECK(fax1_build(&f, FAX1_ADDR_BROADCAST, 0xC0, 0, info, sizeof info));
    CHECK_EQ(f.len, 2 + sizeof info);
    CHECK_EQ(f.buf[0], 0xFF);
    CHECK_EQ(f.buf[1], 0xC0); /* P/F clear: modem holds carrier up */

    fax1_frame_t g;
    CHECK(fax1_build(&g, FAX1_ADDR_BROADCAST, 0xC0, 1, info, sizeof info));
    CHECK_EQ(g.buf[1], 0xC0 | FAX1_PF); /* P/F set: modem drops carrier */

    /* A 0x10 in the payload must be escaped, or the modem reads it as the
     * start of a transparent-data command. */
    const uint8_t tricky[] = { T30_DCS, 0x10, 0x03, 0x00 };
    fax1_frame_t t;
    CHECK(fax1_build(&t, 0xFF, 0xC0, 1, tricky, sizeof tricky));
    uint8_t esc[2 * FAX1_MAX_FRAME];
    size_t n = fax1_escape(&t, esc, sizeof esc);
    /* 0x10 doubles and 0x03 is left alone (it is only special after DLE). */
    CHECK_EQ(n, t.len + 1 /* doubled DLE */ + 2 /* trailing DLE ETX */);
    CHECK_EQ(esc[n - 2], DLE);
    CHECK_EQ(esc[n - 1], DLE_ETX);
}

/* Append a correctly computed FCS, as a DCE would deliver on +FRH. */
static size_t append_fcs(const uint8_t *body, size_t body_len, uint8_t *out)
{
    memcpy(out, body, body_len);
    uint16_t f = fcs_final(fcs_block(body, body_len));
    out[body_len] = (uint8_t)(f & 0xFF);
    out[body_len + 1] = (uint8_t)(f >> 8);
    return body_len + 2;
}

/* Escape a complete on-wire frame and feed it through the receive path. */
static fax1_rx_event_t rx_whole(fax1_rx_t *r, const uint8_t *wire, size_t n)
{
    uint8_t esc[2 * FAX1_MAX_FRAME];
    size_t m = 0;
    for (size_t i = 0; i < n; i++) {
        uint8_t tmp[2];
        size_t k = dle_encode(wire[i], tmp);
        memcpy(esc + m, tmp, k);
        m += k;
    }
    esc[m++] = DLE;
    esc[m++] = DLE_ETX;

    fax1_rx_event_t ev = FAX1_RX_MORE;
    for (size_t i = 0; i < m; i++)
        ev = fax1_rx_feed(r, esc[i]);
    return ev;
}

static void test_fax1_rx(void)
{
    printf("fax1 receive\n");

    /* DIS frame as the modem would hand it over: addr, control, info, FCS. */
    const uint8_t body[] = { 0xFF, 0xC0, T30_DIS, 0x00, 0x00, 0x00 };
    uint8_t wire[FAX1_MAX_FRAME];
    size_t n = append_fcs(body, sizeof body, wire);

    fax1_rx_t r;
    fax1_rx_init(&r);
    CHECK_EQ(rx_whole(&r, wire, n), FAX1_RX_FRAME_OK);
    CHECK_EQ(r.len, n);
    CHECK_EQ(fax1_rx_fcf(&r), T30_DIS);

    size_t info_len = 0;
    const uint8_t *info = fax1_rx_info(&r, &info_len);
    CHECK(info != NULL);
    CHECK_EQ(info_len, sizeof body - 2); /* address and control stripped */

    /* Corrupt the frame and the FCS check must reject it. */
    wire[3] ^= 0x80;
    fax1_rx_init(&r);
    CHECK_EQ(rx_whole(&r, wire, n), FAX1_RX_FRAME_BAD);
    wire[3] ^= 0x80;

    /* The DCE's own "FCS was bad" terminator must also be reported as bad. */
    fax1_rx_init(&r);
    for (size_t i = 0; i < n; i++) {
        uint8_t tmp[2];
        size_t k = dle_encode(wire[i], tmp);
        for (size_t j = 0; j < k; j++)
            fax1_rx_feed(&r, tmp[j]);
    }
    CHECK_EQ(fax1_rx_feed(&r, DLE), FAX1_RX_MORE);
    CHECK_EQ(fax1_rx_feed(&r, 0x08), FAX1_RX_FRAME_BAD);

    /* DLE EOT aborts. */
    fax1_rx_init(&r);
    fax1_rx_feed(&r, 0x41);
    CHECK_EQ(fax1_rx_feed(&r, DLE), FAX1_RX_MORE);
    CHECK_EQ(fax1_rx_feed(&r, DLE_EOT), FAX1_RX_ABORT);

    /* A frame too long to buffer is discarded rather than truncating quietly. */
    fax1_rx_init(&r);
    for (int i = 0; i < FAX1_MAX_FRAME + 8; i++)
        if (fax1_rx_feed(&r, 0x41) == FAX1_RX_OVERFLOW)
            break;
    CHECK_EQ(fax1_rx_feed(&r, DLE), FAX1_RX_OVERFLOW);
}

/* Drive the session and assert the action it asks for. */
#define STEP(res, fcf, good, want)                                       \
    do {                                                                 \
        fax1_action_t act_ = fax1_next(&s, (res), (fcf), (good));        \
        CHECK_EQ(act_, (want));                                          \
        if (act_ == FAX1_ACT_FAIL || act_ == FAX1_ACT_DONE)              \
            printf("  terminal: %s\n", fax1_state_name(s.state));        \
    } while (0)

static void test_fax1_session_send(void)
{
    printf("fax1 session (send, happy path)\n");

    fax1_session_t s;
    fax1_begin(&s, 3);
    CHECK_EQ(s.state, S_DIAL);

    STEP(AT_CONNECT, 0, 0, FAX1_ACT_AT_FRH_3);
    CHECK_EQ(s.state, S_WAIT_DIS);

    STEP(AT_NONE, T30_DIS, 1, FAX1_ACT_AT_FTH_3);
    CHECK_EQ(s.state, S_SEND_TSI);

    /* CONNECT after +FTH=3 -> send TSI with P/F=0, so the modem holds carrier
     * and answers CONNECT again rather than OK. */
    STEP(AT_CONNECT, 0, 0, FAX1_ACT_SEND_TSI);
    STEP(AT_CONNECT, 0, 0, FAX1_ACT_SEND_DCS);
    CHECK_EQ(s.state, S_SEND_DCS);

    /* P/F=1 took: OK means the modem dropped carrier. */
    STEP(AT_OK, 0, 0, FAX1_ACT_AT_FTS_FTM);
    CHECK_EQ(s.state, S_SEND_TCF);

    STEP(AT_CONNECT, 0, 0, FAX1_ACT_SEND_TCF);
    STEP(AT_OK, 0, 0, FAX1_ACT_AT_FRH_3);
    CHECK_EQ(s.state, S_WAIT_CFR);

    STEP(AT_NONE, T30_CFR, 1, FAX1_ACT_AT_FTS_FTM);
    CHECK_EQ(s.state, S_SEND_PAGE);

    STEP(AT_CONNECT, 0, 0, FAX1_ACT_SEND_PAGE);
    STEP(AT_OK, 0, 0, FAX1_ACT_AT_FTH_3);
    CHECK_EQ(s.pages_sent, 1);
    CHECK_EQ(s.state, S_SEND_EOP);

    STEP(AT_CONNECT, 0, 0, FAX1_ACT_SEND_EOP);
    STEP(AT_OK, 0, 0, FAX1_ACT_AT_FRH_3);
    CHECK_EQ(s.state, S_WAIT_MCF);

    STEP(AT_NONE, T30_MCF, 1, FAX1_ACT_ATH);
    CHECK_EQ(s.state, S_HANGUP);

    STEP(AT_OK, 0, 0, FAX1_ACT_DONE);
    CHECK_EQ(s.state, S_DONE);
}

static void test_fax1_session_retrain_and_failure(void)
{
    printf("fax1 session (retrain, then give up)\n");

    fax1_session_t s;
    fax1_begin(&s, 2);

    STEP(AT_CONNECT, 0, 0, FAX1_ACT_AT_FRH_3);
    STEP(AT_NONE, T30_DIS, 1, FAX1_ACT_AT_FTH_3);
    STEP(AT_CONNECT, 0, 0, FAX1_ACT_SEND_TSI);
    STEP(AT_CONNECT, 0, 0, FAX1_ACT_SEND_DCS);
    STEP(AT_OK, 0, 0, FAX1_ACT_AT_FTS_FTM);
    STEP(AT_CONNECT, 0, 0, FAX1_ACT_SEND_TCF);
    STEP(AT_OK, 0, 0, FAX1_ACT_AT_FRH_3);

    /* FTT: go back to the ident phase and try again. */
    STEP(AT_NONE, T30_FTT, 1, FAX1_ACT_AT_FTH_3);
    CHECK_EQ(s.retrains, 1);
    CHECK_EQ(s.state, S_SEND_TSI);

    /* Second FTT reaches max_retrains and the session fails. */
    fax1_next(&s, AT_CONNECT, 0, 0);
    fax1_next(&s, AT_CONNECT, 0, 0);
    fax1_next(&s, AT_OK, 0, 0);
    fax1_next(&s, AT_CONNECT, 0, 0);
    fax1_next(&s, AT_OK, 0, 0);
    STEP(AT_NONE, T30_FTT, 1, FAX1_ACT_FAIL);
    CHECK_EQ(s.retrains, 2);
    CHECK_EQ(s.state, S_FAILED);

    /* A busy number never gets past the dial. */
    fax1_begin(&s, 3);
    STEP(AT_BUSY, 0, 0, FAX1_ACT_FAIL);
    CHECK_EQ(s.state, S_FAILED);

    fax1_begin(&s, 3);
    STEP(AT_NO_CARRIER, 0, 0, FAX1_ACT_FAIL);
    CHECK_EQ(s.state, S_FAILED);

    /* A corrupt DIS is not accepted as a good one. */
    fax1_begin(&s, 3);
    fax1_next(&s, AT_CONNECT, 0, 0);
    STEP(AT_NONE, T30_DIS, 0, FAX1_ACT_AT_FRH_3);
    CHECK_EQ(s.state, S_WAIT_DIS);
}

/* ------------------------------------------------------------------ xPort */

static void test_xport(void)
{
    printf("xport\n");

    xport_esc_t e;
    xport_esc_init(&e, '+', 1000);

    /* Straight after data, +++ is payload, not an escape. */
    xport_esc_feed(&e, 'A', 0);
    CHECK_EQ(xport_esc_feed(&e, '+', 10), 0);
    CHECK_EQ(xport_esc_feed(&e, '+', 11), 0);
    CHECK_EQ(xport_esc_feed(&e, '+', 12), 0);

    /* After a full guard period of silence it is an escape. */
    xport_esc_tick(&e, 2000);
    CHECK_EQ(xport_esc_feed(&e, '+', 2000), 0);
    CHECK_EQ(xport_esc_feed(&e, '+', 2001), 0);
    CHECK_EQ(xport_esc_feed(&e, '+', 2002), 1);

    /* Disarmed again immediately after, so a burst does not repeat. */
    CHECK_EQ(xport_esc_feed(&e, '+', 2003), 0);

    /* Three '+' spread wider than the guard window do not count. */
    xport_esc_init(&e, '+', 1000);
    xport_esc_tick(&e, 5000);
    CHECK_EQ(xport_esc_feed(&e, '+', 5000), 0);
    CHECK_EQ(xport_esc_feed(&e, '+', 5400), 0);
    CHECK_EQ(xport_esc_feed(&e, '+', 6500), 0); /* 1500 ms after the first */

    /* Interrupted by data, the partial escape is abandoned. */
    xport_esc_init(&e, '+', 1000);
    xport_esc_tick(&e, 9000);
    CHECK_EQ(xport_esc_feed(&e, '+', 9000), 0);
    CHECK_EQ(xport_esc_feed(&e, 'x', 9001), 0);
    CHECK_EQ(xport_esc_feed(&e, '+', 9002), 0);
    CHECK_EQ(xport_esc_feed(&e, '+', 9003), 0);

    /* Command formatting. */
    char buf[64];
    CHECK_EQ(xport_cmd(buf, sizeof buf, "SET CHANNEL", "1"), 14);
    CHECK(strcmp(buf, "SET CHANNEL 1\r") == 0);
    CHECK_EQ(xport_cmd(buf, sizeof buf, "SAVE", NULL), 5);
    CHECK(strcmp(buf, "SAVE\r") == 0);
    CHECK_EQ(xport_cmd(buf, 4, "SET CHANNEL", "1"), 0); /* would not fit */
}

/* -------------------------------------------------------------------- main */

int main(void)
{
    test_fcs();
    test_dle();
    test_at();
    test_fax1_frames();
    test_fax1_rx();
    test_fax1_session_send();
    test_fax1_session_retrain_and_failure();
    test_xport();

    printf("\n%d checks, %d failure(s)\n", checks, failures);
    return failures ? 1 : 0;
}
