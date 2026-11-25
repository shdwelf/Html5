/*
 * Microbenchmark for ace-c's Huffman builder.
 * Build against ace-c's huffman.o and bitstream.o; see
 * scripts/benchmark-ace-c-huffman-patch.sh.
 */
#define _POSIX_C_SOURCE 200809L
#include "ace/huffman.h"

#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

static double monotonic_seconds(void)
{
    struct timespec ts;
    if (clock_gettime(CLOCK_MONOTONIC, &ts) != 0)
        return -1.0;
    return (double)ts.tv_sec + (double)ts.tv_nsec / 1000000000.0;
}

int main(int argc, char **argv)
{
    uint32_t freq[284];
    uint32_t state = 0xACE12345u;
    unsigned loops = argc > 1 ? (unsigned)strtoul(argv[1], NULL, 10) : 2500;
    volatile uint64_t checksum = 0;
    unsigned i;
    unsigned run;
    double start;
    double elapsed;

    if (loops == 0) {
        fprintf(stderr, "loop count must be positive\n");
        return 2;
    }
    for (i = 0; i < 284; i++) {
        state = state * 1664525u + 1013904223u;
        freq[i] = 1u + ((state >> 8) % 10000u);
    }

    start = monotonic_seconds();
    if (start < 0.0) {
        perror("clock_gettime");
        return 2;
    }
    for (run = 0; run < loops; run++) {
        ace_huff_t tree = {0};
        int rc = ace_huff_from_freq(freq, 284, 15, &tree);
        if (rc != ACE_OK) {
            fprintf(stderr, "ace_huff_from_freq failed: %d\n", rc);
            ace_huff_free(&tree);
            return 1;
        }
        for (i = 0; i < tree.nwidths; i++)
            checksum += (uint64_t)(i + 1u) * tree.widths[i];
        ace_huff_free(&tree);
    }
    elapsed = monotonic_seconds() - start;

    printf("loops=%u symbols=284 seconds=%.6f checksum=%llu\n",
           loops, elapsed, (unsigned long long)checksum);
    return 0;
}
