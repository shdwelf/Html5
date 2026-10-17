/* at.c — see at.h. */
#include "at.h"

#include <string.h>

static int starts_with(const char *s, const char *pfx)
{
    return strncmp(s, pfx, strlen(pfx)) == 0;
}

/* Strip trailing spaces/tabs in place. */
static void rtrim(char *s)
{
    size_t n = strlen(s);
    while (n && (s[n - 1] == ' ' || s[n - 1] == '\t'))
        s[--n] = '\0';
}

/* First run of digits in s, or -1 if there is none. */
static long first_number(const char *s)
{
    while (*s && (*s < '0' || *s > '9'))
        s++;
    if (!*s)
        return -1;
    long v = 0;
    while (*s >= '0' && *s <= '9')
        v = v * 10 + (*s++ - '0');
    return v;
}

void at_init(at_parser_t *p)
{
    p->len = 0;
    p->line[0] = '\0';
    p->result = AT_NONE;
    p->param = 0;
}

static void classify(at_parser_t *p)
{
    char *s = p->line;
    rtrim(s);
    p->param = 0;

    if (strcmp(s, "OK") == 0) {
        p->result = AT_OK;
    } else if (strcmp(s, "ERROR") == 0 ||
               starts_with(s, "+CME ERROR") || starts_with(s, "+CMS ERROR")) {
        p->result = AT_ERROR;
    } else if (strcmp(s, "CONNECT") == 0 || starts_with(s, "CONNECT ")) {
        p->result = AT_CONNECT;
        long n = first_number(s);
        p->param = (n < 0) ? 0 : n;
    } else if (strcmp(s, "NO CARRIER") == 0) {
        p->result = AT_NO_CARRIER;
    } else if (strcmp(s, "NO DIALTONE") == 0) {
        p->result = AT_NO_DIALTONE;
    } else if (strcmp(s, "BUSY") == 0) {
        p->result = AT_BUSY;
    } else if (strcmp(s, "NO ANSWER") == 0) {
        p->result = AT_NO_ANSWER;
    } else if (strcmp(s, "RING") == 0) {
        p->result = AT_RING;
    } else if (starts_with(s, "+FHS:")) {
        p->result = AT_FHS;
        long n = first_number(s);
        p->param = (n < 0) ? 0 : n;
    } else if (starts_with(s, "+FCERROR")) {
        p->result = AT_FCERROR;
    } else {
        p->result = AT_OTHER;
    }
}

int at_feed(at_parser_t *p, uint8_t b)
{
    if (b == '\r' || b == '\n') {
        if (p->len == 0)
            return 0; /* blank line between results: nothing to report */
        p->line[p->len] = '\0';
        classify(p);
        p->len = 0;
        return 1;
    }

    if (p->len < AT_LINE_MAX - 1)
        p->line[p->len++] = (char)b;
    /* else: keep consuming but stop storing; the line is still terminated */
    return 0;
}

const char *at_result_name(at_result_t r)
{
    switch (r) {
    case AT_OK:          return "OK";
    case AT_ERROR:       return "ERROR";
    case AT_CONNECT:     return "CONNECT";
    case AT_NO_CARRIER:  return "NO CARRIER";
    case AT_NO_DIALTONE: return "NO DIALTONE";
    case AT_BUSY:        return "BUSY";
    case AT_NO_ANSWER:   return "NO ANSWER";
    case AT_RING:        return "RING";
    case AT_FHS:         return "+FHS";
    case AT_FCERROR:     return "+FCERROR";
    case AT_OTHER:       return "OTHER";
    default:             return "NONE";
    }
}
