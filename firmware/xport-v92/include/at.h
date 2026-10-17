/*
 * at.h — byte-fed AT result-code parser.
 *
 * Fed one octet at a time from the modem UART, so it needs no line buffering
 * beyond one line and never blocks. Classifies the result codes a Class 1
 * session actually branches on, and keeps the raw line for logging.
 */
#ifndef AT_H
#define AT_H

#include <stddef.h>
#include <stdint.h>

#define AT_LINE_MAX 96

typedef enum {
    AT_NONE = 0,
    AT_OK,          /* OK */
    AT_ERROR,       /* ERROR, +CME ERROR, +CMS ERROR */
    AT_CONNECT,     /* CONNECT [rate] — carrier up; param is the rate or 0 */
    AT_NO_CARRIER,  /* NO CARRIER — carrier lost or never established */
    AT_NO_DIALTONE,
    AT_BUSY,
    AT_NO_ANSWER,
    AT_RING,
    AT_FHS,         /* +FHS:<n> — fax hangup status; param is n */
    AT_FCERROR,     /* +FCERROR — HDLC frame error */
    AT_OTHER,       /* anything else; the line is still available */
} at_result_t;

typedef struct {
    char line[AT_LINE_MAX];
    size_t len;
    at_result_t result;
    long param;
} at_parser_t;

void at_init(at_parser_t *p);

/*
 * Feed one octet. Returns 1 when a complete result is available (and fills
 * p->result / p->line / p->param), 0 when more input is needed. Lines longer
 * than AT_LINE_MAX are truncated but still terminated and classified.
 */
int at_feed(at_parser_t *p, uint8_t b);

const char *at_result_name(at_result_t r);

#endif /* AT_H */
