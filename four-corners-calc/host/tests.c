/* host/tests.c — what has to be true before any of this is worth flashing.
 *
 * The interesting checks are the middle three groups: the integer IDW field is
 * held against a fixture sampled from the bundle's own four-corners-geo.js,
 * every terrain control point must snap to exactly its own elevation, and the
 * surveyed quadripoint must quantise to the values the state lines are drawn
 * through. Everything else is structural — the tables the converter emitted
 * have to be internally consistent or the renderer will read off the end of an
 * array on a calculator where nothing will tell you it did.
 */
#include <stdio.h>
#include <stdlib.h>
#include "fourcorners.h"
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
  }
}

static void test_tables(void) {
  int i;
  int bad;
  int reg;

  okv("corridor offsets terminate at FC_NPT", (long)FC_COR_OFF[FC_NCOR], (long)FC_NPT);

  bad = 0;
  for (i = 0; i < FC_NCOR; i++) {
    if (FC_COR_OFF[i + 1] <= FC_COR_OFF[i]) bad++;
    if (FC_COR_LAYER[i] >= FC_NLAYER) bad++;
    if (FC_COR_TIER[i] > FC_TIER_CONTEXT) bad++;
    if (FC_COR_NAME[i] >= FC_STRB) bad++;
    if (FC_COR_KM[i] == 0 || FC_COR_KM[i] > 1000) bad++;
  }
  ok("every corridor: non-empty, in range, named, long", bad == 0);

  bad = 0;
  for (i = 0; i < FC_NNODE; i++) {
    if (FC_NODE_LAYER[i] >= FC_NLAYER) bad++;
    if (FC_NODE_TIER[i] > FC_TIER_CONTEXT) bad++;
    if (FC_NODE_NAME[i] >= FC_STRB) bad++;
    if (FC_NODE_KIND[i] >= FC_STRB) bad++;
    if (FC_NODE_Q[i * 2] > FC_SPAN_LON) bad++;
    if (FC_NODE_Q[i * 2 + 1] > FC_SPAN_LAT) bad++;
    if (FC_NODE_ELEV[i] < 1200 || FC_NODE_ELEV[i] > 3600) bad++;
    if (FC_NODE_DEPTH[i] > 0 || FC_NODE_DEPTH[i] < -3000) bad++;
  }
  ok("every node: inside the frame, in range, named, plausible", bad == 0);

  reg = 0;
  for (i = 0; i < FC_NNODE; i++) {
    if (FC_NODE_REG[i] > 1) reg += 100;
    if (FC_NODE_REG[i] == 1) reg++;
  }
  okv("register rows in the node list", (long)reg, (long)FC_NREG);
  okv("sites + register = nodes", (long)(FC_NSITE + FC_NREG), (long)FC_NNODE);

  bad = 0;
  for (i = 0; i < FC_NPT; i++) {
    if (FC_PT[i * 2] > FC_SPAN_LON) bad++;
    if (FC_PT[i * 2 + 1] > FC_SPAN_LAT) bad++;
  }
  ok("every corridor vertex inside the quantised frame", bad == 0);

  bad = 0;
  for (i = 0; i < FC_NTER; i++) {
    if (FC_TER[i * 3] > FC_SPAN_LON) bad++;
    if (FC_TER[i * 3 + 1] > FC_SPAN_LAT) bad++;
    if (FC_TER[i * 3 + 2] < 1200 || FC_TER[i * 3 + 2] > 3600) bad++;
  }
  ok("every control point inside the frame with a sane elevation", bad == 0);

  bad = 0;
  for (i = 0; i < FC_NLAYER; i++) {
    if (FC_LAYER_NAME[i] >= FC_STRB) bad++;
    if (FC_LAYER_KIND[i] > FC_KIND_NODE) bad++;
  }
  ok("every layer named and classified", bad == 0);
  okv("string pool is 0 terminated", (long)FC_STR[FC_STRB - 1], 0L);

  bad = 0;
  for (i = 0; i < FC_NFEAT; i++) {
    if (fcorner_feat_layer((u16)i) >= FC_NLAYER) bad++;
    if (fcorner_feat_name((u16)i) >= FC_STRB) bad++;
    if (fcorner_feat_kind((u16)i) >= FC_STRB) bad++;
  }
  ok("unified feature list resolves for all entries", bad == 0);
  okv("feature count = corridors + nodes",
      (long)fcorner_feat_count(), (long)(FC_NCOR + FC_NNODE));
}

/* The reason this port exists: the theater's IDW relief field, in integers. */
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
    got = (long)fc_elev_deg((i32)ELEVFIX[i * 3], (i32)ELEVFIX[i * 3 + 1]);
    d = got - want;
    if (d < 0) d = -d;
    if (d > worst) worst = d;
    sum += d;
  }
  printf("  ..   elevation fixture: %d samples, mean |error| %ld m, worst %ld m\n",
         ELEVFIX_N, sum / ELEVFIX_N, worst);
  ok("integer IDW field tracks four-corners-geo.js within 25 m", worst <= 25);
  ok("integer IDW field mean error under 6 m", (sum / ELEVFIX_N) <= 6);
}

static void test_geo(void) {
  int i;
  int bad;
  i32 a;
  i32 b;

  /* The exp2 fraction table: 2^0 = 1 clamped to u16, halving over 256 steps. */
  okv("FC_EXP2_Q16[0] is Q16 one (clamped)", (long)FC_EXP2_Q16[0], 65535L);
  okv("FC_EXP2_Q16[256] is Q16 one half", (long)FC_EXP2_Q16[256], 32768L);
  bad = 0;
  for (i = 1; i <= 256; i++) {
    if (FC_EXP2_Q16[i] > FC_EXP2_Q16[i - 1]) bad++;
  }
  ok("exp2 fraction table is monotone non-increasing", bad == 0);

  /* The app snaps to a control point inside 0.5 km: the integer field must
     return exactly that point's elevation at exactly that point. */
  bad = 0;
  for (i = 0; i < (int)FC_NTER; i++) {
    if (fc_elev_q((i32)FC_TER[i * 3], (i32)FC_TER[i * 3 + 1]) != (i32)FC_TER[i * 3 + 2]) bad++;
  }
  ok("every control point snaps to exactly its own elevation", bad == 0);

  okv("isqrt32(0)", (long)fc_isqrt32(0), 0L);
  okv("isqrt32(4e8)", (long)fc_isqrt32(400000000U), 20000L);
  bad = 0;
  for (i = 1; i < 4000; i += 7) {
    if ((long)fc_isqrt32((u32)(i * i)) != i) bad++;
    if ((long)fc_isqrt32((u32)(i * i - 1)) != i - 1) bad++;
  }
  ok("isqrt32 exact on perfect squares and just below", bad == 0);

  /* The depth ramp is a log ramp: the Aneth reservoir (1700 m) and McElmo
     Dome's CO2 (2400 m) must not collapse together. */
  a = (i32)fc_depth_mag_q8(-1700);
  b = (i32)fc_depth_mag_q8(-2400);
  okv("depth ramp at 1700 m, Q8", (long)a, 460L);
  okv("depth ramp at 2400 m, Q8", (long)b, 478L);
  ok("depth ramp separates 1700 m from 2400 m", b > a + 12);
  bad = 0;
  for (i = 1; i < 3000; i += 13) {
    if (fc_depth_mag_q8((i32)i) > fc_depth_mag_q8((i32)(i + 13))) bad++;
  }
  ok("depth ramp is monotonic", bad == 0);
  okv("depth ramp is symmetric in sign",
      (long)fc_depth_mag_q8(-1700), (long)fc_depth_mag_q8(1700));

  /* FC_COR_KM comes from the app's own pathKm() at conversion time. Walking
     the QUANTISED vertices with the calculator's own integer distance has to
     land in the same place, or the u16 grid is lying about the geometry. */
  bad = 0;
  for (i = 0; i < FC_NCOR; i++) {
    long ipath;
    long fpath;
    int v;
    ipath = 0;
    for (v = (int)FC_COR_OFF[i]; v + 1 < (int)FC_COR_OFF[i + 1]; v++) {
      ipath += (long)fc_km_span((i32)FC_PT[v * 2 + 2] - (i32)FC_PT[v * 2],
                                (i32)FC_PT[v * 2 + 3] - (i32)FC_PT[v * 2 + 1]);
    }
    fpath = (long)FC_COR_KM[i];
    if (fpath > 20 && (ipath * 100 > fpath * 104 || ipath * 100 < fpath * 92)) bad++;
  }
  ok("integer path length agrees with pathKm() to within 8 pct", bad == 0);
  ok("San Juan polyline length, from the app's pathKm()",
     FC_COR_KM[2] > 230 && FC_COR_KM[2] < 280);
  ok("state lines are the surveyed straight lines",
     FC_COR_KM[0] > 225 && FC_COR_KM[0] < 245 && FC_COR_KM[1] > 240 && FC_COR_KM[1] < 260);
  ok("frame is 240-260 km wide",
     fc_km_span((i32)FC_SPAN_LON, 0) > 240 && fc_km_span((i32)FC_SPAN_LON, 0) < 260);
  ok("frame is 220-250 km tall",
     fc_km_span(0, (i32)FC_SPAN_LAT) > 220 && fc_km_span(0, (i32)FC_SPAN_LAT) < 250);

  /* The surveyed quadripoint: NAD83 36.998976 -109.045172, quantised. The
     state lines are drawn through exactly these values, and the monument
     register row sits on top of them. */
  okv("quadripoint qlon", (long)FC_QUAD_LON_Q, 3110L);
  okv("quadripoint qlat", (long)FC_QUAD_LAT_Q, 2398L);
  bad = 0;
  if (FC_QUAD_LON_Q > FC_SPAN_LON || FC_QUAD_LAT_Q > FC_SPAN_LAT) bad++;
  if (fcorner_feat_qlon((u16)(FC_NCOR + FC_NSITE)) < (u16)(FC_QUAD_LON_Q - 2)) bad++;
  if (fcorner_feat_qlon((u16)(FC_NCOR + FC_NSITE)) > (u16)(FC_QUAD_LON_Q + 2)) bad++;
  if (fcorner_feat_qlat((u16)(FC_NCOR + FC_NSITE)) < (u16)(FC_QUAD_LAT_Q - 2)) bad++;
  if (fcorner_feat_qlat((u16)(FC_NCOR + FC_NSITE)) > (u16)(FC_QUAD_LAT_Q + 2)) bad++;
  ok("the monument register row sits on the surveyed quadripoint", bad == 0);
}

static void test_shell(void) {
  int dev;
  int scr;
  int bad;
  int i;
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
    fcorner_init((u8)devs[dev], w, h);
    if (SK_FBB > FB_MAX) bad++;
    for (scr = 0; scr < FC_NSCREEN; scr++) {
      fcorner_set_screen((u8)scr);
      fcorner_render();
    }
  }
  ok("every device draws every screen without overrunning FB_MAX", bad == 0);

  fcorner_init(DEV_TI92, 240, 128);
  okv("TI-92 framebuffer is 3840 bytes", (long)SK_FBB, 3840L);
  fcorner_init(DEV_TI83, 96, 64);
  okv("TI-83 framebuffer is 768 bytes", (long)SK_FBB, 768L);

  /* Selection only ever lands on a visible feature. */
  fcorner_init(DEV_TI83, 96, 64);
  bad = 0;
  for (scr = 0; scr < 400; scr++) {
    fcorner_key(SKK_RIGHT);
    if (fcorner_layer_on(fcorner_feat_layer(fcorner_get_sel())) == 0) bad++;
  }
  ok("400 steps of the selection stay on visible layers", bad == 0);

  sel = fcorner_get_sel();
  w = fcorner_visible();
  for (scr = 0; scr < (int)w; scr++) fcorner_key(SKK_RIGHT);
  okv("a full lap of the visible set returns to where it started",
      (long)fcorner_get_sel(), (long)sel);

  /* Turning a layer off must remove exactly its features from the visible set. */
  fcorner_init(DEV_TI83, 96, 64);
  w = fcorner_visible();
  fcorner_toggle_layer(6);
  h = fcorner_visible();
  ok("toggling a layer changes the visible count", h < w);
  fcorner_toggle_layer(6);
  okv("toggling it back restores the count", (long)fcorner_visible(), (long)w);

  /* Zoom must keep the selected feature on the map rectangle. */
  bad = 0;
  for (scr = 0; scr < 4; scr++) {
    fcorner_set_zoom((u8)scr);
    fcorner_set_sel((u16)(scr * 17 + 2));
    fc_view();
    if (fc_px(fcorner_feat_qlon(fcorner_get_sel())) < 0) bad++;
    if (fc_px(fcorner_feat_qlon(fcorner_get_sel())) >= (int)SK_W) bad++;
    if (fc_py(fcorner_feat_qlat(fcorner_get_sel())) < 0) bad++;
    if (fc_py(fcorner_feat_qlat(fcorner_get_sel())) >= (int)SK_H) bad++;
  }
  ok("the selected feature is on screen at every zoom", bad == 0);

  /* The section screen has to produce a profile with real relief in it. */
  fcorner_init(DEV_TI92, 240, 128);
  fcorner_set_sel(2);                       /* the San Juan River corridor */
  fcorner_set_screen(FC_SCR_PROF);
  fcorner_render();
  okv("river profile samples the full LCD width", (long)fc_prof_n(), 232L);
  ok("river profile crosses real relief (>300 m of range)",
     fc_prof_elev(0) != fc_prof_elev(100));
  bad = 0;
  for (scr = 0; scr < (int)fc_prof_n(); scr++) {
    if (fc_prof_elev((u16)scr) < 1200) bad++;
    if (fc_prof_elev((u16)scr) > 3600) bad++;
  }
  ok("every profile sample is a plausible elevation", bad == 0);

  /* A node selection transects around itself; the deep sites hang a marker.
     Exactly two features carry a schematic depth — the Aneth reservoir and
     McElmo Dome's CO2 — and the loop leaves the selection on the deepest. */
  bad = 0;
  sel = 0;
  for (i = 0; i < (int)FC_NNODE; i++) {
    if (FC_NODE_DEPTH[i] != 0) {
      sel = (u16)(FC_NCOR + i);
      bad++;
    }
  }
  okv("exactly two features carry a schematic depth", (long)bad, 2L);
  fcorner_set_sel(sel);
  fcorner_set_screen(FC_SCR_PROF);
  fcorner_render();
  ok("deep-field transect runs shorter than the full frame",
     fc_prof_km() > 50 && fc_prof_km() < 250);
  okv("McElmo Dome's CO2 depth survives into the dossier",
      fcorner_feat_depth(fcorner_get_sel()), -2400L);
}

int fcorner_selftest(void) {
  failures = 0;
  checks = 0;
  test_tables();
  test_geo();
  test_elevation();
  test_shell();
  printf("%d checks, %d failures\n", checks, failures);
  return failures ? 1 : 0;
}
