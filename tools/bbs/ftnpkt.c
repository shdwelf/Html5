/*
 * ftnpkt.c — FidoNet Type-2 packet (FTS-0001) reader and echomail->news
 * mapper, in portable C99. This is the C analogue of js/fidonet-pkt.js and
 * the first conversion artifact for the MBSE-derived minimal FTN node on
 * uClinux/ColdFire (docs/spidermonkey-bbs-uclinux-fidonet-news-2026-10-23.md):
 * single translation unit, no fork, no threads, no dynamic loading, bounded
 * buffers, slurp-capped input.
 *
 * Usage:
 *   ftnpkt <file.pkt>           dump header + messages (evidence view)
 *   ftnpkt --news <file.pkt>    emit NNTP-style articles (gateway view)
 *
 * Build:  cc -std=c99 -Wall -Wextra -O2 -o ftnpkt tools/bbs/ftnpkt.c
 *
 * Parse rules mirror the JS implementation: kludges, SEEN-BY and PATH are
 * preserved in the dump, never emitted in --news mode; a damaged message
 * degrades to a warning on stderr instead of aborting the packet.
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

#define MAX_PACKET_BYTES (16u * 1024u * 1024u)
#define MAX_BODY 65536
#define MAX_FIELD 512

typedef struct {
    unsigned char *data;
    size_t len;
    size_t pos;
    int truncated;
} cursor;

static unsigned rd16(cursor *c) {
    if (c->pos + 2 > c->len) { c->truncated = 1; return 0; }
    unsigned v = c->data[c->pos] | (c->data[c->pos + 1] << 8);
    c->pos += 2;
    return v;
}

/* NUL-terminated field with a hard width; always NUL-terminates out. */
static void rd_field(cursor *c, char *out, size_t outsz, size_t maxwidth) {
    size_t start = c->pos, end = start;
    size_t hard = c->len < start + maxwidth ? c->len : start + maxwidth;
    while (end < hard && c->data[end] != 0) end++;
    size_t n = end - start;
    if (n >= outsz) n = outsz - 1;
    memcpy(out, c->data + start, n);
    out[n] = 0;
    c->pos = end < c->len ? end + 1 : end;
    if (end >= c->len) c->truncated = 1;
}

static void trim(char *s) {
    size_t n = strlen(s);
    while (n && isspace((unsigned char)s[n - 1])) s[--n] = 0;
    size_t i = 0;
    while (s[i] && isspace((unsigned char)s[i])) i++;
    if (i) memmove(s, s + i, strlen(s + i) + 1);
}

static void copy_trunc(char *dst, size_t dstsz, const char *src) {
    size_t n = strlen(src);
    if (n >= dstsz) n = dstsz - 1;
    memcpy(dst, src, n);
    dst[n] = 0;
}

/* --- news mapping (must stay in step with js/fidonet-pkt.js) ------------- */

static int valid_newsgroup(const char *g) {
    size_t n = strlen(g);
    if (n < 3 || n > 66) return 0;
    int dots = 0;
    for (size_t i = 0; i < n; i++) {
        char ch = g[i];
        if (!(islower((unsigned char)ch) || isdigit((unsigned char)ch) ||
              ch == '+' || ch == '.' || ch == '_' || ch == '-'))
            return 0;
        if (ch == '.') {
            dots++;
            if (i == 0 || i == n - 1 || g[i - 1] == '.') return 0;
        }
    }
    return dots >= 1;
}

static void newsgroup_for_area(const char *area, char *out, size_t outsz) {
    /* fidonet.<tag lowercased, non-alnum folded to dots, dots squeezed> */
    char buf[128];
    size_t w = 0;
    for (const char *p = area; *p && w < sizeof(buf) - 1; p++) {
        char ch = (char)tolower((unsigned char)*p);
        if ((ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9')) buf[w++] = ch;
        else if (w && buf[w - 1] != '.') buf[w++] = '.';
    }
    while (w && buf[w - 1] == '.') w--;
    buf[w] = 0;
    if (!w) { out[0] = 0; return; }
    snprintf(out, outsz, "fidonet.%s", buf);
    if (!valid_newsgroup(out)) out[0] = 0;
}

/* "1:104/100 2f3a4b5c" -> "<2f3a4b5c@1.104.100.fidonet.invalid>" */
static void message_id_for(const char *msgid, char *out, size_t outsz) {
    out[0] = 0;
    if (!msgid || !*msgid) return;
    char addr[128], serial[128];
    if (sscanf(msgid, "%127s %127s", addr, serial) != 2) return;
    for (char *p = addr; *p; p++)
        if (*p == ':' || *p == '/' || *p == '@') *p = '.';
    snprintf(out, outsz, "<%s@%s.fidonet.invalid>", serial, addr);
}

/* --- message body dissection -------------------------------------------- */

typedef struct {
    char area[128];
    char msgid[MAX_FIELD];
    char reply[MAX_FIELD];
    char origin[MAX_FIELD];
    int seenby_lines;
    char *text; /* malloc'd, caller frees */
} body_parts;

static void parse_body(const char *raw, body_parts *bp) {
    memset(bp, 0, sizeof(*bp));
    size_t cap = strlen(raw) + 1;
    bp->text = (char *)malloc(cap);
    bp->text[0] = 0;
    size_t tw = 0;
    int first = 1;
    const char *p = raw;
    while (*p) {
        const char *e = p;
        while (*e && *e != '\r' && *e != '\n') e++;
        size_t linelen = (size_t)(e - p);
        char line[MAX_BODY];
        if (linelen >= sizeof(line)) linelen = sizeof(line) - 1;
        memcpy(line, p, linelen);
        line[linelen] = 0;
        p = (*e == '\r' && e[1] == '\n') ? e + 2 : (*e ? e + 1 : e);

        if (first && strncmp(line, "AREA:", 5) == 0) {
            copy_trunc(bp->area, sizeof(bp->area), line + 5);
            trim(bp->area);
        } else if (line[0] == '\x01') {
            if (strncmp(line + 1, "MSGID:", 6) == 0) { copy_trunc(bp->msgid, sizeof(bp->msgid), line + 7); trim(bp->msgid); }
            else if (strncmp(line + 1, "REPLY:", 6) == 0) { copy_trunc(bp->reply, sizeof(bp->reply), line + 7); trim(bp->reply); }
            else if (strncmp(line + 1, "SEEN-BY:", 8) == 0) bp->seenby_lines++;
            /* other kludges (CHRS, PATH, TZUTC...) are evidence: not text */
        } else if (strncmp(line, "SEEN-BY:", 8) == 0) {
            bp->seenby_lines++;
        } else if (strncmp(line, "---", 3) == 0) {
            /* tearline: evidence only */
        } else if (strstr(line, "* Origin:") == line + (line[0] == ' ' ? 1 : 0) && strncmp(line + (line[0] == ' '), "* Origin:", 9) == 0) {
            copy_trunc(bp->origin, sizeof(bp->origin), line);
            trim(bp->origin);
        } else {
            size_t ll = strlen(line);
            if (tw + ll + 2 < cap) {
                memcpy(bp->text + tw, line, ll);
                tw += ll;
                bp->text[tw++] = '\n';
                bp->text[tw] = 0;
            }
        }
        first = 0;
    }
    while (tw && bp->text[tw - 1] == '\n') bp->text[--tw] = 0;
}

/* --- main ---------------------------------------------------------------- */

int main(int argc, char **argv) {
    int news_mode = 0;
    const char *path = NULL;
    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "--news") == 0) news_mode = 1;
        else path = argv[i];
    }
    if (!path) {
        fprintf(stderr, "usage: ftnpkt [--news] <file.pkt>\n");
        return 2;
    }
    FILE *f = fopen(path, "rb");
    if (!f) { fprintf(stderr, "ftnpkt: cannot open %s\n", path); return 2; }
    fseek(f, 0, SEEK_END);
    long sz = ftell(f);
    fseek(f, 0, SEEK_SET);
    if (sz < 0 || (unsigned long)sz > MAX_PACKET_BYTES) {
        fprintf(stderr, "ftnpkt: %s: unreasonable size %ld\n", path, sz);
        fclose(f);
        return 2;
    }
    unsigned char *buf = (unsigned char *)malloc(sz ? (size_t)sz : 1);
    if (sz && fread(buf, 1, (size_t)sz, f) != (size_t)sz) {
        fprintf(stderr, "ftnpkt: short read on %s\n", path);
        fclose(f);
        free(buf);
        return 2;
    }
    fclose(f);

    cursor c = { buf, (size_t)sz, 0, 0 };
    if (c.len < 58) {
        fprintf(stderr, "ftnpkt: %s: too short for a Type-2 header (%zu bytes)\n", path, c.len);
        free(buf);
        return 2;
    }
    unsigned origNode = rd16(&c), destNode = rd16(&c);
    unsigned year = rd16(&c), month = rd16(&c), day = rd16(&c);
    unsigned hour = rd16(&c), minute = rd16(&c), second = rd16(&c);
    (void)rd16(&c); /* baud */
    unsigned ptype = rd16(&c);
    unsigned origNet = rd16(&c), destNet = rd16(&c);
    c.pos += 34; /* product/revision/password/zone fields: read past, basic Type-2 */

    if (!news_mode) {
        printf("PKT orig=%u/%u dest=%u/%u date=%04u-%02u-%02u %02u:%02u:%02u type=%u\n",
               origNet, origNode, destNet, destNode, year, month, day, hour, minute, second, ptype);
    }
    if (ptype != 2) fprintf(stderr, "ftnpkt: warning: packet type %u is not 2; parsing as Type-2\n", ptype);

    int msgno = 0;
    while (c.pos + 2 <= c.len) {
        unsigned type = rd16(&c);
        if (type == 0) break;
        if (type != 2) {
            fprintf(stderr, "ftnpkt: warning: stopping at offset %zu: unknown packed-message type %u\n", c.pos - 2, type);
            break;
        }
        if (c.pos + 12 > c.len) { fprintf(stderr, "ftnpkt: warning: truncated fixed fields\n"); break; }
        unsigned mOrigNode = rd16(&c), mDestNode = rd16(&c);
        unsigned mOrigNet = rd16(&c), mDestNet = rd16(&c);
        (void)rd16(&c); /* attribute */
        (void)rd16(&c); /* cost */
        char datetime[24];
        {
            size_t avail = c.len - c.pos < 20 ? c.len - c.pos : 20;
            size_t n = 0;
            while (n < avail && c.data[c.pos + n] != 0) n++;
            if (n >= sizeof(datetime)) n = sizeof(datetime) - 1;
            memcpy(datetime, c.data + c.pos, n);
            datetime[n] = 0;
            c.pos += 20;
        }
        char to[MAX_FIELD], from[MAX_FIELD], subject[MAX_FIELD];
        rd_field(&c, to, sizeof(to), 36);
        rd_field(&c, from, sizeof(from), 36);
        rd_field(&c, subject, sizeof(subject), 72);
        /* body: NUL-terminated, capped */
        size_t bstart = c.pos, bend = bstart;
        while (bend < c.len && buf[bend] != 0) bend++;
        size_t blen = bend - bstart;
        if (blen > MAX_BODY) blen = MAX_BODY;
        char *raw = (char *)malloc(blen + 1);
        memcpy(raw, buf + bstart, blen);
        raw[blen] = 0;
        c.pos = bend < c.len ? bend + 1 : bend;

        body_parts bp;
        parse_body(raw, &bp);
        msgno++;
        if (news_mode) {
            char group[160], mid[300], ref[300];
            newsgroup_for_area(bp.area, group, sizeof(group));
            message_id_for(bp.msgid, mid, sizeof(mid));
            message_id_for(bp.reply, ref, sizeof(ref));
            if (msgno > 1) printf("\n");
            printf("Newsgroups: %s\n", group[0] ? group : "(unmapped)");
            if (mid[0]) printf("Message-ID: %s\n", mid);
            if (ref[0]) printf("References: %s\n", ref);
            printf("From: %s\nSubject: %s\nDate: %s\n\n%s\n", from, subject, datetime, bp.text);
        } else {
            printf("MSG %d area=%s from=\"%s\" to=\"%s\" subject=\"%s\" msgid=\"%s\" nodes=%u/%u->%u/%u seenby=%d\n",
                   msgno, bp.area[0] ? bp.area : "(netmail)", from, to, subject,
                   bp.msgid, mOrigNet, mOrigNode, mDestNet, mDestNode, bp.seenby_lines);
            printf("BODY\n%s\nEND\n", bp.text);
        }
        free(bp.text);
        free(raw);
        if (c.truncated) {
            fprintf(stderr, "ftnpkt: warning: packet truncated inside message %d\n", msgno);
            break;
        }
    }
    free(buf);
    return 0;
}
