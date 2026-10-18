/*
 * bridge.c — the glue: xPort Pro serial channel <-> V.92 modem, plus the
 * Class 1 fax session.
 *
 * This is the integration layer. The protocol logic it calls (at.c, dle.c,
 * fax1.c, fcs.c, xport.c) is hardware-independent and unit-tested on the host;
 * this file is the part that needs a board.
 */
#include "at.h"
#include "dle.h"
#include "fax1.h"
#include "fcs.h"
#include "hal.h"
#include "xport.h"

#include <string.h>

#define XPORT_GUARD_MS 1000

/* Where the bridge is. */
typedef enum {
    BR_PASSTHROUGH, /* bytes flow straight between the two UARTs */
    BR_FAX_SEND,    /* driving a Class 1 transmit session */
} bridge_mode_t;

static at_parser_t at;
static fax1_rx_t rx;
static fax1_session_t sess;
static xport_esc_t esc;
static bridge_mode_t mode = BR_PASSTHROUGH;

/* Emitted by the caller's page source; stubbed here. */
extern const uint8_t *page_data(size_t *len);

void bridge_init(void)
{
    hal_init();
    at_init(&at);
    fax1_rx_init(&rx);
    xport_esc_init(&esc, '+', XPORT_GUARD_MS);
    mode = BR_PASSTHROUGH;
}

/* Hand an action to the modem. */
static void do_action(fax1_action_t a)
{
    switch (a) {
    case FAX1_ACT_AT_FRH_3:   hal_at_send("AT+FRH=3"); break;
    case FAX1_ACT_AT_FTH_3:   hal_at_send("AT+FTH=3"); break;
    case FAX1_ACT_AT_FTS_FTM: hal_at_send("AT+FTS=8"); hal_at_send("AT+FTM=96"); break;
    case FAX1_ACT_ATH:        hal_at_send("ATH"); break;
    case FAX1_ACT_SEND_TSI:
    case FAX1_ACT_SEND_DCS:
    case FAX1_ACT_SEND_TCF:
    case FAX1_ACT_SEND_PAGE:
    case FAX1_ACT_SEND_EOP:
        /*
         * Frame bodies depend on the station identifiers and the page source,
         * which are deployment data rather than protocol logic. The caller
         * builds them with fax1_build() — P/F clear on every frame except the
         * last in a +FTH burst, because that bit is what tells the modem
         * whether to drop carrier — escapes them with fax1_escape(), and
         * writes the result to HAL_UART_MODEM.
         */
        break;
    case FAX1_ACT_DONE:
    case FAX1_ACT_FAIL:
        mode = BR_PASSTHROUGH;
        hal_dtr(0);
        break;
    case FAX1_ACT_NONE:
    default:
        break;
    }
}

void bridge_poll(void)
{
    uint32_t now = hal_millis();
    xport_esc_tick(&esc, now);
    uint8_t b;

    /* ---- xPort Pro -> modem ---- */
    while (hal_uart_get(HAL_UART_XPORT, &b)) {
        if (xport_esc_feed(&esc, b, now)) {
            /* Guarded +++: enter the xPort Pro's command mode and stop
             * forwarding, so the escape reaches the device server rather than
             * the PSTN. */
            hal_at_send("+++");
            continue;
        }
        hal_uart_put(HAL_UART_MODEM, &b, 1);
    }

    /* ---- modem -> xPort Pro, and the fax session ---- */
    while (hal_uart_get(HAL_UART_MODEM, &b)) {
        if (at_feed(&at, b)) {
            if (mode == BR_FAX_SEND)
                do_action(fax1_next(&sess, at.result, 0, 0));
            continue;
        }

        if (mode == BR_FAX_SEND) {
            fax1_rx_event_t ev = fax1_rx_feed(&rx, b);
            if (ev == FAX1_RX_FRAME_OK || ev == FAX1_RX_FRAME_BAD) {
                uint8_t fcf = fax1_rx_fcf(&rx);
                do_action(fax1_next(&sess, AT_NONE, fcf, ev == FAX1_RX_FRAME_OK));
                fax1_rx_init(&rx);
            }
            continue;
        }

        hal_uart_put(HAL_UART_XPORT, &b, 1);
    }
}

/* Start a Class 1 send. `number` is dialled as-is. */
void bridge_start_fax(const char *number, int max_retrains)
{
    if (!number || !*number)
        return;

    /*
     * The trailing ';' keeps the DCE in command mode after dialling, which is
     * what lets the host issue +FRH/+FTH instead of dropping into data mode.
     */
    char cmd[64];
    size_t n = strlen(number);
    if (n + 5 >= sizeof cmd) /* "ATD" + number + ";" + CR + NUL */
        return;
    memcpy(cmd, "ATD", 3);
    memcpy(cmd + 3, number, n);
    n += 3;
    cmd[n++] = ';';
    cmd[n++] = '\r';
    cmd[n] = '\0';

    (void)page_data; /* page source is supplied by the caller */
    fax1_begin(&sess, max_retrains);
    mode = BR_FAX_SEND;
    hal_dtr(1);
    hal_at_send(cmd);
}
