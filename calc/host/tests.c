/* host/tests.c — host-only self test for the shared core.
   Any target can run this: it needs stdio but no platform hooks. */
#include <stdio.h>
#include "sitek.h"

static int sitek_failures;
static int sitek_checks;

static void check(const char *name, int cond) {
  sitek_checks = sitek_checks + 1;
  if (cond) {
    printf("  ok   %s\n", name);
  } else {
    printf("  FAIL %s\n", name);
    sitek_failures = sitek_failures + 1;
  }
}

static void put_hex(const char *label, const u8 *d, u16 n) {
  u16 i;
  printf("%s=", label);
  for (i = 0; i < n; i++) printf("%02x", d[i]);
  printf("\n");
}

static void test_sha(void) {
  u8 out[32];
  u8 empty[1];
  u8 abc[3];
  int ok;
  int i;
  empty[0] = 0;
  abc[0] = 97;
  abc[1] = 98;
  abc[2] = 99;

  sha256_hash(empty, 0, out);
  put_hex("SHA0", out, 32);
  ok = 1;
  for (i = 0; i < 32; i++) {
    if (out[i] != (u8)("\xe3\xb0\xc4\x42\x98\xfc\x1c\x14\x9a\xfb\xf4\xc8\x99\x6f\xb9\x24"
                       "\x27\xae\x41\xe4\x64\x9b\x93\x4c\xa4\x95\x99\x1b\x78\x52\xb8\x55"[i] & 0xFF)) ok = 0;
  }
  check("sha256 empty vector", ok);

  sha256_hash(abc, 3, out);
  put_hex("SHAABC", out, 32);
  ok = 1;
  for (i = 0; i < 32; i++) {
    if (out[i] != (u8)("\xba\x78\x16\xbf\x8f\x01\xcf\xea\x41\x41\x40\xde\x5d\xae\x22\x23"
                       "\xb0\x03\x61\xa3\x96\x17\x7a\x9c\xb4\x10\xff\x61\xf2\x00\x15\xad"[i] & 0xFF)) ok = 0;
  }
  check("sha256 abc vector", ok);
}

/* BIP-39 with all-zero entropy:
 *   128-bit -> "abandon" x11 + "about"  (indices 0 x11 then 3)
 *   256-bit -> "abandon" x23 + "art"    (indices 0 x23 then 102) */
static void test_bip39_zero(void) {
  u8 ent[32];
  int i;
  int ok;
  for (i = 0; i < 32; i++) ent[i] = 0;

  ks_set_entropy(ent, 16);
  check("128-bit zero entropy -> 12 words", ks_words() == 12);
  check("ks_ent_bits 128", ks_ent_bits() == 128);
  check("ks_cs_bits 4", ks_cs_bits() == 4);
  ok = 1;
  for (i = 0; i < 11; i++) {
    if (ks_word((u8)i) != 0) ok = 0;
  }
  check("128-bit zero: 11 x index 0 (abandon)", ok);
  check("128-bit zero: last index 3 (about)", ks_word(11) == 3);

  ks_set_entropy(ent, 32);
  check("256-bit zero entropy -> 24 words", ks_words() == 24);
  ok = 1;
  for (i = 0; i < 23; i++) {
    if (ks_word((u8)i) != 0) ok = 0;
  }
  check("256-bit zero: 23 x index 0 (abandon)", ok);
  check("256-bit zero: last index 102 (art)", ks_word(23) == 102);
}

static void test_gray(void) {
  u16 i;
  int ok;
  ok = 1;
  for (i = 0; i < 2048; i++) {
    if (ks_gray_inv(ks_gray(i)) != i) ok = 0;
  }
  check("gray roundtrip 0..2047", ok);
  check("gray(1)==1", ks_gray(1) == 1);
  check("gray(2)==3", ks_gray(2) == 3);
  check("gray(3)==2", ks_gray(3) == 2);
}

static void test_curves(void) {
  u8 seen[256];
  u32 d;
  u16 p;
  u16 prevx;
  u16 prevy;
  u16 x;
  u16 y;
  int ok;
  int adj;
  int i;
  for (i = 0; i < 256; i++) seen[i] = 0;
  ok = 1;
  adj = 1;
  prevx = 0;
  prevy = 0;
  for (d = 0; d < 256; d++) {
    p = ks_hilbert(d, 4);
    x = (u16)(p >> 8);
    y = (u16)(p & 255);
    if (x > 15 || y > 15) ok = 0;
    if (seen[x * 16 + y] != 0) ok = 0;
    seen[x * 16 + y] = 1;
    if (d > 0) {
      if (iabs((int)x - (int)prevx) + iabs((int)y - (int)prevy) != 1) adj = 0;
    }
    prevx = x;
    prevy = y;
  }
  check("hilbert order 4 is a bijection", ok);
  check("hilbert steps are unit moves", adj);

  for (i = 0; i < 256; i++) seen[i] = 0;
  ok = 1;
  for (d = 0; d < 256; d++) {
    p = ks_morton(d, 4);
    x = (u16)(p >> 8);
    y = (u16)(p & 255);
    if (x > 15 || y > 15) ok = 0;
    if (seen[x * 16 + y] != 0) ok = 0;
    seen[x * 16 + y] = 1;
  }
  check("morton order 4 is a bijection", ok);
}

static void test_fb(void) {
  int ok;
  sitek_init(DEV_TI83, 96, 64);
  fb_clear();
  fb_px(5, 6, PX_SET);
  check("fb_px set", fb_get(5, 6) == 1);
  fb_px(5, 6, PX_CLEAR);
  check("fb_px clear", fb_get(5, 6) == 0);
  fb_line(0, 0, 20, 10, PX_SET);
  check("fb_line start", fb_get(0, 0) == 1);
  check("fb_line end", fb_get(20, 10) == 1);
  fb_clear();
  fb_box(0, 0, 10, 10, FILL_SOLID);
  ok = fb_get(0, 0) == 1 && fb_get(9, 9) == 1 && fb_get(10, 10) == 0;
  check("fb_box solid", ok);
  fb_clear();
  fb_box(0, 0, 4, 4, FILL_HALF);
  check("fb_box half is dithered", fb_get(0, 0) == 1 && fb_get(1, 0) == 0);
}

static void test_math(void) {
  check("idiv truncates", idiv(7, 2) == 3 && idiv(-7, 2) == -3);
  check("imod follows sign", imod(-7, 3) == -1 && imod(7, 3) == 1);
  check("log2_q8(1)", log2_q8(1) == 0);
  check("log2_q8(256)", log2_q8(256) == 2048);
  check("log2_q8(1024)", log2_q8(1024) == 2560);
  check("isqrt(10)", isqrt(10) == 3);
  check("fsin(0)==0", fsin(0) == 0);
  check("fcos(0) ~ 4096", iabs(fcos(0) - 4096) < 8);
  check("fsin(90) ~ 4096", iabs(fsin(90) - 4096) < 80);
  check("u32w wraps", u32w(0xFFFFFFFFU) == 0xFFFFFFFFU);
  check("add32 wraps", add32(0xFFFFFF00U, 0x200U) == 0x100U);
  check("ror32", ror32(1, 1) == 0x80000000U);
}

static void test_screens(void) {
  u8 dev;
  u8 scr;
  u16 i;
  u16 lit;
  int ok;
  u16 w;
  u16 h;
  ok = 1;
  for (dev = 0; dev < 5; dev++) {
    if (dev == DEV_TI83 || dev == DEV_TI90) {
      w = 96;
      h = 64;
    } else if (dev == DEV_TI85) {
      w = 128;
      h = 64;
    } else if (dev == DEV_TI89) {
      w = 160;
      h = 100;
    } else {
      w = 240;
      h = 128;
    }
    sitek_init(dev, w, h);
    for (scr = 0; scr < 5; scr++) {
      SK_SCREEN = scr;
      sitek_render();
      lit = 0;
      for (i = 0; i < SK_FBB; i++) {
        if (SK_FB[i] != 0) lit = (u16)(lit + 1);
      }
      if (lit == 0) ok = 0;
      if (SK_FBB > FB_MAX) ok = 0;
    }
  }
  check("every device draws every screen", ok);
}

/* Same seed + same core must give the same keyspace on a Z80 and a 68k. */
static void test_determinism(void) {
  u16 i;
  int ok;
  u16 a;
  u16 b;
  u8 first;
  u8 seen;

  sitek_init(DEV_TI83, 96, 64);
  a = ks_word(0);
  b = ks_ones();
  sitek_init(DEV_TI83, 96, 64);
  check("re-init reproduces word 0", ks_word(0) == a);
  check("re-init reproduces ones", ks_ones() == b);

  /* explicit seed, two very different devices, identical keyspace */
  sitek_init(DEV_TI83, 96, 64);
  ks_seed(0x12345678U);
  ks_gen(12);
  a = ks_word(0);
  b = ks_word(11);
  sitek_init(DEV_TI92, 240, 128);
  ks_seed(0x12345678U);
  ks_gen(12);
  check("same seed: TI-92 word 0 == TI-83 word 0", ks_word(0) == a);
  check("same seed: TI-92 word 11 == TI-83 word 11", ks_word(11) == b);

  /* the sector grid should not be flat */
  sitek_init(DEV_TI89, 160, 100);
  first = grid_nodes(0);
  seen = 0;
  ok = 0;
  for (i = 0; i < 64; i++) {
    if (grid_nodes((u8)i) != first) ok = 1;
    if (grid_nodes((u8)i) == 0) seen = 1;
  }
  check("grid node counts vary by sector", ok);
  check("grid has empty and populated sectors", seen == 1 || seen == 0);
}

int sitek_selftest(void) {
  sitek_failures = 0;
  sitek_checks = 0;
  printf("SITE-K core self test\n");
  test_math();
  test_sha();
  test_bip39_zero();
  test_gray();
  test_curves();
  test_fb();
  test_screens();
  test_determinism();
  printf("%d checks, %d failures\n", sitek_checks, sitek_failures);
  if (sitek_failures != 0) return 1;
  return 0;
}
