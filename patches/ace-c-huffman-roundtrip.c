/*
 * Supplemental property test for the ace-c Huffman builder patch.
 * Build against ace-c's huffman.o and bitstream.o; see
 * scripts/test-ace-c-huffman-patch.sh.
 */
#include "ace/huffman.h"

#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static uint32_t next_u32(uint32_t *state)
{
    *state = *state * 1664525u + 1013904223u;
    return *state;
}

static int check_frequency_vector(const uint32_t *freq, unsigned n,
                                  unsigned max_width, unsigned case_no)
{
    ace_huff_t encoded = {0};
    ace_huff_t decoded = {0};
    ace_bsw_t writer = {0};
    ace_bs_t reader = {0};
    ace_memsrc_t source = {0};
    unsigned i;
    unsigned active = 0;
    unsigned symbol;
    int rc;

    rc = ace_huff_from_freq(freq, n, max_width, &encoded);
    if (rc != ACE_OK) {
        fprintf(stderr, "from_freq case %u rc %d\n", case_no, rc);
        goto fail;
    }
    rc = ace_bsw_init(&writer);
    if (rc != ACE_OK)
        goto fail;

    rc = ace_huff_write_tree(&writer, &encoded);
    for (i = 0; rc == ACE_OK && i < n; i++) {
        if (freq[i] != 0) {
            rc = ace_huff_write_symbol(&writer, &encoded, i);
            active++;
        }
    }
    if (rc == ACE_OK)
        rc = ace_bsw_pad32(&writer);
    if (rc == ACE_OK)
        rc = ace_bs_from_mem(&reader, &source, writer.data, writer.len, 64);
    if (rc == ACE_OK)
        rc = ace_huff_read_tree(&reader, max_width, n, &decoded);

    for (i = 0; rc == ACE_OK && i < n; i++) {
        if (freq[i] == 0)
            continue;
        rc = ace_huff_read_symbol(&decoded, &reader, &symbol);
        if (rc == ACE_OK && symbol != i) {
            fprintf(stderr, "symbol case %u i %u got %u\n",
                    case_no, i, symbol);
            rc = ACE_ERR_CORRUPT;
        }
    }
    if (rc == ACE_OK)
        goto cleanup;

    fprintf(stderr, "roundtrip case %u n=%u active=%u rc=%d\n",
            case_no, n, active, rc);

fail:
    rc = 1;
    goto cleanup;

cleanup:
    ace_huff_free(&decoded);
    ace_huff_free(&encoded);
    ace_bs_free(&reader);
    ace_bsw_free(&writer);
    return rc == ACE_OK ? 0 : 1;
}

int main(void)
{
    uint32_t state = 0xACE2026u;
    unsigned n;
    unsigned trial;
    unsigned i;
    unsigned case_no = 0;
    unsigned failures = 0;

    for (n = 2; n <= 284; n++) {
        for (trial = 0; trial < 50; trial++) {
            uint32_t *freq = (uint32_t *)malloc((size_t)n * sizeof(*freq));
            unsigned shape = trial % 5;

            if (!freq) {
                fprintf(stderr, "out of memory for n=%u\n", n);
                return 2;
            }
            for (i = 0; i < n; i++) {
                uint32_t value = next_u32(&state);
                if (shape == 0)
                    freq[i] = value % 2;
                else if (shape == 1)
                    freq[i] = value % 8;
                else if (shape == 2)
                    freq[i] = (i % 7) + 1;
                else if (shape == 3)
                    freq[i] = (i < n / 2) ? (i + 1) : (n - i);
                else
                    freq[i] = 1 + (value % 100000);
            }

            failures += (unsigned)check_frequency_vector(freq, n, 15, case_no);
            case_no++;
            free(freq);
        }
    }

    printf("cases=%u failures=%u\n", case_no, failures);
    return failures != 0;
}
