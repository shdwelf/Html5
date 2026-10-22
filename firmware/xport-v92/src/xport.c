/* xport.c — see xport.h. */
#include "xport.h"

#include <string.h>

void xport_esc_init(xport_esc_t *e, uint8_t esc_char, uint32_t guard_ms)
{
    e->esc_char = esc_char ? esc_char : '+';
    e->idx = 0;
    e->guard_ms = guard_ms ? guard_ms : 1000;
    e->idle_since_ms = 0;
    e->armed = 0;
    e->first_ms = 0;
}

void xport_esc_tick(xport_esc_t *e, uint32_t now_ms)
{
    if (!e->armed && (now_ms - e->idle_since_ms) >= e->guard_ms)
        e->armed = 1;
}

int xport_esc_feed(xport_esc_t *e, uint8_t b, uint32_t now_ms)
{
    if (b == e->esc_char) {
        if (e->idx == 0) {
            if (!e->armed) {
                /* Data was flowing: this is payload, not an escape. Re-arm the
                 * idle timer and keep going. */
                e->idle_since_ms = now_ms;
                return 0;
            }
            e->idx = 1;
            e->first_ms = now_ms;
            return 0;
        }
        /* Continue an escape in progress, but only inside the guard window. */
        if ((now_ms - e->first_ms) > e->guard_ms) {
            e->idx = 1;
            e->first_ms = now_ms;
            return 0;
        }
        e->idx++;
        if (e->idx < 3)
            return 0;
        /* Complete escape. Disarm until the line idles again. */
        e->idx = 0;
        e->armed = 0;
        e->idle_since_ms = now_ms;
        return 1;
    }

    e->idx = 0;
    e->armed = 0;
    e->idle_since_ms = now_ms;
    return 0;
}

size_t xport_cmd(char *out, size_t cap, const char *verb, const char *arg)
{
    size_t n = strlen(verb);
    size_t need = n + (arg ? strlen(arg) + 1 : 0) + 1 /* CR */ + 1 /* NUL */;
    if (cap < need)
        return 0;

    memcpy(out, verb, n);
    if (arg) {
        out[n++] = ' ';
        size_t m = strlen(arg);
        memcpy(out + n, arg, m);
        n += m;
    }
    out[n++] = '\r';
    out[n] = '\0';
    return n;
}
