/*
 * cfjvm_port.h - everything platform-specific, in one place.
 *
 * PORTING CONTRACT FOR COLDFIRE uCLINUX
 *
 * The xPort Pro runs a DSTni-FX ColdFire at 166 MHz with NO MMU, 16 MiB of
 * flash and 8-16 MiB of SDRAM, of which only the 4 MiB JFFS2 partition is
 * writable. That combination imposes four requirements, and they are the
 * reason this file exists rather than the interpreter calling libc directly:
 *
 *   1. NO FORK. Without an MMU there is no copy-on-write, so fork() cannot
 *      duplicate an address space. uClinux offers vfork(), where the child
 *      shares the parent's memory and must immediately exec. A JVM that
 *      shells out is therefore not portable; this interpreter never spawns a
 *      process, which is also exactly why Synchronet cannot run there (see
 *      docs/xport-pro-synchronet-fit.md - 7 fork() and 9 popen() call sites).
 *
 *   2. NO SHARED LIBRARIES. uClinux uses the bFLT binary format, which has no
 *      dynamic linker. Everything must be static, so the binary has to fit in
 *      flash and its whole data footprint in RAM. Keep this dependency list
 *      to libc; do not add pthreads, dlopen, or locales.
 *
 *   3. ONE ADDRESS SPACE, NO PROTECTION. A wild pointer corrupts the kernel's
 *      view of the process rather than faulting cleanly. Every array access in
 *      the interpreter is bounds-checked for that reason, not for speed.
 *
 *   4. FORWARD-ONLY ALLOCATION. There is no GC here, so memory is never
 *      reclaimed. cfj_alloc/cfj_free are the only allocation entry points so a
 *      real port can swap in a bump allocator over a fixed arena - which is
 *      what you want when the heap has to fit inside a 4 MiB partition
 *      alongside everything else.
 *
 * Retargeting means providing these eleven functions and the two FILE
 * handles. Nothing else in cfjvm.c includes a system header.
 */
#ifndef CFJVM_PORT_H
#define CFJVM_PORT_H

#include <stdarg.h>
#include <stdio.h>
#include <stdlib.h>

/* Allocation. Swap for an arena/bump allocator on a no-MMU target. */
static inline void *cfj_alloc(size_t n) { return malloc(n); }
static inline void cfj_free(void *p) { free(p); }

/* Diagnostics. */
static inline int cfj_vfprintf(FILE *f, const char *fmt, va_list ap) { return vfprintf(f, fmt, ap); }
static inline int cfj_fputc(int c, FILE *f) { return fputc(c, f); }
static inline int cfj_fputs(const char *s, FILE *f) { return fputs(s, f); }
static inline size_t cfj_fwrite(const void *p, size_t sz, size_t n, FILE *f) { return fwrite(p, sz, n, f); }
static inline int cfj_fflush(FILE *f) { return fflush(f); }

/* Class-file input. On a target with no filesystem, replace cfj_fopen with a
   lookup into a linked-in array and the rest becomes a no-op. */
static inline FILE *cfj_fopen(const char *path, const char *mode) { return fopen(path, mode); }
static inline int cfj_fclose(FILE *f) { return fclose(f); }
static inline int cfj_fseek(FILE *f, long off, int whence) { return fseek(f, off, whence); }
static inline long cfj_ftell(FILE *f) { return ftell(f); }
static inline size_t cfj_fread(void *p, size_t sz, size_t n, FILE *f) { return fread(p, sz, n, f); }

/* Termination. uClinux has no atexit ordering guarantees, so do not rely on
   destructors running. */
static inline void cfj_exit(int code) { exit(code); }

#endif /* CFJVM_PORT_H */
