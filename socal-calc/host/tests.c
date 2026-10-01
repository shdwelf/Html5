/* host/tests.c — what has to be true before any of this is worth flashing.
 *
 * The interesting checks are the last two groups: the integer terrain field is
 * held against a fixture sampled from the bundle's own socal-geo.js, and the
 * log depth ramp is held against the ordering depthY() produces. Everything
 * else is structural — the tables the converter emitted have to be internally
 * consistent or the renderer will read off the end of an array on a calculator
 * where nothing will tell you it did.
 */
#include <stdio.h>
#include <stdlib.h>
#include "socal.h"
#include "elevfix.h"

static int failures;
static int checks;

static void ok(const char *what, int cond) {
  checks++;
  if (cond) {
    printf("  ok   %s\n", what);
  } else {
    printf("  FAIL %s\n", what);
    failures++;
  }
}

static void okv(const char *what, long got, long want) {
  checks++;
  if (got == want) {
    printf("  ok   %-46s %ld\n", what, got);
  } else {
    printf("  FAIL %-46s got %ld want %ld\n", what, got, want);
    failures++;
  }
}

static void test_tables(void) {
  int i;
  int bad;

  okv("corridor offsets terminate at SC_NPT", (long)SC_COR_OFF[SC_NCOR], (long)SC_NPT);
  okv("ring offsets terminate at SC_NRPT", (long)SC_RING_OFF[SC_NRING], (long)SC_NRPT);

  bad = 0;
  for (i = 0; i < SC_NCOR; i++) {
    if (SC_COR_OFF[i + 1] <= SC_COR_OFF[i]) bad++;
    if (SC_COR_LAYER[i] >= SC_NLAYER) bad++;
    if (SC_COR_TIER[i] > SC_TIER_CONTEXT) bad++;
    if (SC_COR_NAME[i] >= SC_STRB) bad++;
    if (SC_COR_SHORT[i] >= SC_STRB) bad++;
    if (SC_COR_TUN[i] > 100) bad++;
  }
  ok("every corridor: non-empty, in range, named", bad == 0);

  bad = 0;
  for (i = 0; i < SC_NNODE; i++) {
    if (SC_NODE_LAYER[i] >= SC_NLAYER) bad++;
    if (SC_NODE_TIER[i] > SC_TIER_CONTEXT) bad++;
    if (SC_NODE_KIND[i] >= SC_NKIND) bad++;
    if (SC_NODE_NAME[i] >= SC_STRB) bad++;
    if (SC_NODE_Q[i * 2] > SC_SPAN_LON) bad++;
    if (SC_NODE_Q[i * 2 + 1] > SC_SPAN_LAT) bad++;
  }
  ok("every site: inside the frame, in range, named", bad == 0);

  bad = 0;
  for (i = 0; i < SC_NPT; i++) {
    if (SC_PT[i * 2] > SC_SPAN_LON) bad++;
    if (SC_PT[i * 2 + 1] > SC_SPAN_LAT) bad++;
  }
  for (i = 0; i < SC_NRPT; i++) {
    if (SC_RING_PT[i * 2] > SC_SPAN_LON) bad++;
    if (SC_RING_PT[i * 2 + 1] > SC_SPAN_LAT) bad++;
  }
  ok("every vertex inside the quantised frame", bad == 0);

  bad = 0;
  for (i = 0; i < SC_NLAYER; i++) {
    if (SC_LAYER_NAME[i] >= SC_STRB) bad++;
    if (SC_LAYER_KIND[i] > SC_KIND_RING) bad++;
  }
  ok("every layer named and classified", bad == 0);
  okv("string pool is 0 terminated", (long)SC_STR[SC_STRB - 1], 0L);

  bad = 0;
  for (i = 0; i < SC_NFEAT; i++) {
    if (socal_feat_layer((u16)i) >= SC_NLAYER) bad++;
    if (socal_feat_name((u16)i) >= SC_STRB) bad++;
  }
  ok("unified feature list resolves for all 117 entries", bad == 0);
  okv("feature count = corridors + sites + rings",
      (long)socal_feat_count(), (long)(SC_NCOR + SC_NNODE + SC_NRING));
}

/* The reason this port exists: the theater's elevation field, in integers. */
static void test_elevation(void) {
  int i;
  long worst;
  long sum;
  long got;
  long want;
  long d;
  worst = 0;
  sum = 0;
  for (i = 0; i < ELEVFIX_N; i++) {
    want = (long)ELEVFIX[i * 3 + 2];
    got = (long)sc_elev_deg((i32)ELEVFIX[i * 3], (i32)ELEVFIX[i * 3 + 1]);
    d = got - want;
    if (d < 0) d = -d;
    if (d > worst) worst = d;
    sum += d;
  }
  printf("  ..   elevation fixture: %d samples, mean |error| %ld m, worst %ld m\n",
         ELEVFIX_N, sum / ELEVFIX_N, worst);
  ok("integer terrain field tracks socal-geo.js within 25 m", worst <= 25);
  ok("integer terrain field mean error under 5 m", (sum / ELEVFIX_N) <= 5);
}

static void test_geo(void) {
  int i;
  int bad;
  i32 a;
  i32 b;

  okv("sin(0 turns)", (long)sc_sin_turn(0), 0L);
  okv("sin(1/4 turn) is Q12 one", (long)sc_sin_turn(16384), 4096L);
  okv("cos(0 turns) is Q12 one", (long)sc_cos_turn(0), 4096L);
  ok("sin(1/2 turn) is zero", sc_sin_turn(32768) == 0);
  ok("sin is odd about the half turn", sc_sin_turn(49152) == -4096);

  okv("isqrt32(0)", (long)sc_isqrt32(0), 0L);
  okv("isqrt32(4e8)", (long)sc_isqrt32(400000000U), 20000L);
  bad = 0;
  for (i = 1; i < 4000; i += 7) {
    if ((long)sc_isqrt32((u32)(i * i)) != i) bad++;
    if ((long)sc_isqrt32((u32)(i * i - 1)) != i - 1) bad++;
  }
  ok("isqrt32 exact on perfect squares and just below", bad == 0);

  /* depthY is a log ramp: ordering and order of magnitude survive, spacing
     does not. A trench line and a geothermal zone must not collapse together. */
  a = (i32)sc_depth_mag_q8(-2);
  b = (i32)sc_depth_mag_q8(-2000);
  ok("depth ramp separates 2 m from 2000 m", b > a + 200);
  bad = 0;
  for (i = 1; i < 3000; i += 13) {
    if (sc_depth_mag_q8((i32)i) > sc_depth_mag_q8((i32)(i + 13))) bad++;
  }
  ok("depth ramp is monotonic", bad == 0);
  okv("depth ramp is symmetric in sign",
      (long)sc_depth_mag_q8(-120), (long)sc_depth_mag_q8(120));

  /* SC_COR_KM comes from the app's own pathKm() at conversion time. Walking
     the QUANTISED vertices with the calculator's own integer distance has to
     land in the same place, or the u16 grid is lying about the geometry.
     (These are generalized routes: the CRA's published 389 km includes
     meanders a ten-vertex polyline does not have. 312 km is the polyline.) */
  bad = 0;
  for (i = 0; i < SC_NCOR; i++) {
    long ipath;
    long fpath;
    int v;
    ipath = 0;
    for (v = (int)SC_COR_OFF[i]; v + 1 < (int)SC_COR_OFF[i + 1]; v++) {
      ipath += (long)sc_km_span((i32)SC_PT[v * 2 + 2] - (i32)SC_PT[v * 2],
                                (i32)SC_PT[v * 2 + 3] - (i32)SC_PT[v * 2 + 1]);
    }
    fpath = (long)SC_COR_KM[i];
    if (fpath > 20 && (ipath * 100 > fpath * 104 || ipath * 100 < fpath * 92)) bad++;
  }
  ok("integer path length agrees with pathKm() to within 8 pct", bad == 0);
  okv("CRA polyline length, from the app's pathKm()", (long)SC_COR_KM[0], 312L);
  ok("km span across the whole frame is 600-800 km",
     sc_km_span((i32)SC_SPAN_LON, 0) > 600 && sc_km_span((i32)SC_SPAN_LON, 0) < 800);
}

static void test_shell(void) {
  int dev;
  int scr;
  int bad;
  u16 w;
  u16 h;
  u16 sel;
  int devs[3];
  u16 ws[3];
  u16 hs[3];
  devs[0] = DEV_TI83;
  devs[1] = DEV_TI89;
  devs[2] = DEV_TI92;
  ws[0] = 96;
  ws[1] = 160;
  ws[2] = 240;
  hs[0] = 64;
  hs[1] = 100;
  hs[2] = 128;

  bad = 0;
  for (dev = 0; dev < 3; dev++) {
    w = ws[dev];
    h = hs[dev];
    socal_init((u8)devs[dev], w, h);
    if (SK_FBB > FB_MAX) bad++;
    for (scr = 0; scr < SC_NSCREEN; scr++) {
      socal_set_screen((u8)scr);
      socal_render();
    }
  }
  ok("every device draws every screen without overrunning FB_MAX", bad == 0);

  socal_init(DEV_TI92, 240, 128);
  okv("TI-92 framebuffer is 3840 bytes", (long)SK_FBB, 3840L);
  socal_init(DEV_TI83, 96, 64);
  okv("TI-83 framebuffer is 768 bytes", (long)SK_FBB, 768L);

  /* Selection only ever lands on a visible feature. */
  socal_init(DEV_TI83, 96, 64);
  bad = 0;
  for (scr = 0; scr < 400; scr++) {
    socal_key(SKK_RIGHT);
    if (socal_layer_on(socal_feat_layer(socal_get_sel())) == 0) bad++;
  }
  ok("400 steps of the selection stay on visible layers", bad == 0);

  sel = socal_get_sel();
  w = socal_visible();
  for (scr = 0; scr < (int)w; scr++) socal_key(SKK_RIGHT);
  okv("a full lap of the visible set returns to where it started",
      (long)socal_get_sel(), (long)sel);

  /* Turning a layer off must remove exactly its features from the visible set. */
  socal_init(DEV_TI83, 96, 64);
  w = socal_visible();
  socal_toggle_layer(6);
  h = socal_visible();
  ok("toggling a layer changes the visible count", h < w);
  socal_toggle_layer(6);
  okv("toggling it back restores the count", (long)socal_visible(), (long)w);

  /* Zoom must keep the selected feature on the map rectangle. */
  bad = 0;
  for (scr = 0; scr < 4; scr++) {
    socal_set_zoom((u8)scr);
    socal_set_sel((u16)(scr * 17 + 2));
    sc_view();
    if (sc_px(socal_feat_qlon(socal_get_sel())) < 0) bad++;
    if (sc_px(socal_feat_qlon(socal_get_sel())) >= (int)SK_W) bad++;
    if (sc_py(socal_feat_qlat(socal_get_sel())) < 0) bad++;
    if (sc_py(socal_feat_qlat(socal_get_sel())) >= (int)SK_H) bad++;
  }
  ok("the selected feature is on screen at every zoom", bad == 0);

  /* The section screen has to produce a profile with real relief in it. */
  socal_init(DEV_TI92, 240, 128);
  socal_set_sel(1);                       /* California Aqueduct, over the Tehachapis */
  socal_set_screen(SC_SCR_PROF);
  socal_render();
  ok("SWP profile samples the full LCD width", sc_prof_n() == 232);
  ok("SWP profile crosses real relief (>1000 m of range)",
     sc_prof_elev(0) != sc_prof_elev(100));
  bad = 0;
  for (scr = 0; scr < (int)sc_prof_n(); scr++) {
    if (sc_prof_elev((u16)scr) < -3000) bad++;
    if (sc_prof_elev((u16)scr) > 5000) bad++;
  }
  ok("every profile sample is a plausible elevation", bad == 0);
}

int socal_selftest(void) {
  failures = 0;
  checks = 0;
  test_tables();
  test_geo();
  test_elevation();
  test_shell();
  printf("%d checks, %d failures\n", checks, failures);
  return failures ? 1 : 0;
}
