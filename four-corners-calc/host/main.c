/* host/main.c — host harness for the FOUR CORNERS port.
 *
 *   fcorner-host selftest            core checks + the elevation fixture
 *   fcorner-host render <dev> <dir>  P4 PBM frames, one per screen
 *   fcorner-host dump   <dev>        golden values for the C/JS differential test
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "fourcorners.h"

int fcorner_selftest(void);

static const char *DEV_NAMES[3] = { "ti83", "ti89", "ti92" };
static const int DEV_IDS[3] = { DEV_TI83, DEV_TI89, DEV_TI92 };

static int dev_slot(const char *name) {
  int i;
  for (i = 0; i < 3; i++) {
    if (strcmp(name, DEV_NAMES[i]) == 0) return i;
  }
  return -1;
}

static void dev_dims(int slot, u16 *w, u16 *h) {
  if (slot == 1) {
    *w = 160;
    *h = 100;
  } else if (slot == 2) {
    *w = 240;
    *h = 128;
  } else {
    *w = 96;
    *h = 64;
  }
}

/* FNV-1a over the packed framebuffer — the cross-language golden. */
u32 fb_hash(void) {
  u32 h;
  u16 i;
  h = 0x811C9DC5U;
  for (i = 0; i < SK_FBB; i++) {
    h = u32w(h ^ (u32)SK_FB[i]);
    h = u32w(h * 0x01000193U);
  }
  return h;
}

static int write_pbm(const char *path) {
  FILE *f;
  f = fopen(path, "wb");
  if (!f) return 1;
  fprintf(f, "P4\n%u %u\n", (unsigned)SK_W, (unsigned)SK_H);
  fwrite(SK_FB, 1, (size_t)SK_FBB, f);
  fclose(f);
  return 0;
}

static int cmd_render(int slot, const char *outdir) {
  u16 w;
  u16 h;
  u8 scr;
  char path[512];
  dev_dims(slot, &w, &h);
  fcorner_init((u8)DEV_IDS[slot], w, h);
  printf("dev\t%s\tlcd\t%ux%u\trowb\t%u\tfb\t%u\n", DEV_NAMES[slot], (unsigned)w, (unsigned)h,
         (unsigned)SK_ROWB, (unsigned)SK_FBB);
  for (scr = 0; scr < FC_NSCREEN; scr++) {
    fcorner_set_screen(scr);
    fcorner_render();
    printf("screen\t%u\thash\t%08lx\n", (unsigned)scr, (unsigned long)fb_hash());
    sprintf(path, "%s/%s-%u.pbm", outdir, DEV_NAMES[slot], (unsigned)scr);
    if (write_pbm(path) != 0) {
      printf("write failed: %s\n", path);
      return 1;
    }
  }
  /* A second map frame, zoomed onto the river corridor, to exercise the
     projection. */
  fcorner_set_sel(2);
  fcorner_set_zoom(2);
  fcorner_set_screen(FC_SCR_MAP);
  fcorner_render();
  sprintf(path, "%s/%s-zoom.pbm", outdir, DEV_NAMES[slot]);
  write_pbm(path);
  printf("screen\tzoom\thash\t%08lx\n", (unsigned long)fb_hash());
  return 0;
}

static int cmd_dump(int slot) {
  u16 w;
  u16 h;
  int i;
  dev_dims(slot, &w, &h);
  fcorner_init((u8)DEV_IDS[slot], w, h);
  printf("dev\t%s\n", DEV_NAMES[slot]);
  printf("w\t%u\th\t%u\trowb\t%u\tfb\t%u\n", (unsigned)SK_W, (unsigned)SK_H,
         (unsigned)SK_ROWB, (unsigned)SK_FBB);
  printf("feat\t%u\tvis\t%u\tlayers\t%u\n", (unsigned)fcorner_feat_count(),
         (unsigned)fcorner_visible(), (unsigned)FC_NLAYER);
  for (i = 0; i < 12; i++) {
    printf("elev\t%d\t%ld\n", i,
           (long)fc_elev_q((i32)(i * 400), (i32)(FC_SPAN_LAT - i * 300)));
  }
  for (i = 0; i < (int)FC_NTER; i++) {
    printf("snap\t%d\t%ld\n", i,
           (long)fc_elev_q((i32)FC_TER[i * 3], (i32)FC_TER[i * 3 + 1]));
  }
  for (i = 0; i < 8; i++) {
    printf("depth\t%d\t%u\n", i, (unsigned)fc_depth_mag_q8((i32)(1 << (i * 2))));
  }
  for (i = 0; i < 10; i++) {
    printf("feat\t%d\tlon\t%u\tlat\t%u\tlayer\t%u\ttier\t%u\n", i,
           (unsigned)fcorner_feat_qlon((u16)(i * 7)), (unsigned)fcorner_feat_qlat((u16)(i * 7)),
           (unsigned)fcorner_feat_layer((u16)(i * 7)), (unsigned)fcorner_feat_tier((u16)(i * 7)));
  }
  fcorner_set_sel(2);
  printf("prof\tn\t%u\tkm\t%u\n", (unsigned)fc_prof_n(), (unsigned)fc_prof_km());
  for (i = 0; i < 8; i++) {
    printf("prof\t%d\t%ld\n", i, (long)fc_prof_elev((u16)(i * 7)));
  }
  for (i = 0; i < FC_NSCREEN; i++) {
    fcorner_set_screen((u8)i);
    fcorner_render();
    printf("screen\t%d\thash\t%08lx\n", i, (unsigned long)fb_hash());
  }
  fcorner_set_sel(2);
  fcorner_set_zoom(2);
  fcorner_set_screen(FC_SCR_MAP);
  fcorner_render();
  printf("screen\tzoom\thash\t%08lx\n", (unsigned long)fb_hash());
  return 0;
}

int main(int argc, char **argv) {
  int slot;
  if (argc >= 2 && strcmp(argv[1], "selftest") == 0) return fcorner_selftest();
  if (argc >= 4 && strcmp(argv[1], "render") == 0) {
    slot = dev_slot(argv[2]);
    if (slot < 0) {
      printf("unknown device %s\n", argv[2]);
      return 2;
    }
    return cmd_render(slot, argv[3]);
  }
  if (argc >= 3 && strcmp(argv[1], "dump") == 0) {
    slot = dev_slot(argv[2]);
    if (slot < 0) {
      printf("unknown device %s\n", argv[2]);
      return 2;
    }
    return cmd_dump(slot);
  }
  printf("usage: fcorner-host selftest | render <dev> <outdir> | dump <dev>\n");
  printf("devices: ti83 ti89 ti92\n");
  return 2;
}
