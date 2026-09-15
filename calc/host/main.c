/* host/main.c — host harness: self test, PBM previews, golden dumps.
 *
 *   sitek-host selftest
 *   sitek-host render <dev> <outdir>      writes P4 PBM frames per screen
 *   sitek-host dump   <dev>               golden values for the JS diff test
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "sitek.h"

int sitek_selftest(void);

static const char *DEV_NAMES[6] = { "ti83", "ti85", "ti89", "ti90", "ti92", "host" };

static int dev_id(const char *name) {
  int i;
  for (i = 0; i < 6; i++) {
    if (strcmp(name, DEV_NAMES[i]) == 0) return i;
  }
  return -1;
}

static void dev_dims(int dev, u16 *w, u16 *h) {
  if (dev == DEV_TI85) {
    *w = 128;
    *h = 64;
  } else if (dev == DEV_TI89) {
    *w = 160;
    *h = 100;
  } else if (dev == DEV_TI92) {
    *w = 240;
    *h = 128;
  } else if (dev == DEV_HOST) {
    *w = 160;
    *h = 100;
  } else {
    *w = 96;
    *h = 64;
  }
}

/* FNV-1a over the packed framebuffer — the cross-language golden */
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

static int cmd_render(int dev, const char *outdir) {
  u16 w;
  u16 h;
  u8 scr;
  char path[512];
  dev_dims(dev, &w, &h);
  sitek_init((u8)dev, w, h);
  printf("dev\t%s\tlcd\t%ux%u\trowb\t%u\tfb\t%u\n", DEV_NAMES[dev], (unsigned)w, (unsigned)h,
         (unsigned)SK_ROWB, (unsigned)SK_FBB);
  for (scr = 0; scr < 5; scr++) {
    sitek_set_screen(scr);
    sitek_render();
    printf("screen\t%u\thash\t%08lx\n", (unsigned)scr, (unsigned long)fb_hash());
    sprintf(path, "%s/%s-%u.pbm", outdir, DEV_NAMES[dev], (unsigned)scr);
    if (write_pbm(path) != 0) {
      printf("write failed: %s\n", path);
      return 1;
    }
  }
  /* one step of the automaton for a second terrarium frame */
  sitek_set_screen(SCR_TERR);
  tr_step();
  sitek_render();
  printf("screen\t%u\thash\t%08lx\tgen\t%u\n", SCR_TERR, (unsigned long)fb_hash(), (unsigned)tr_gen());
  return 0;
}

static int cmd_dump(int dev) {
  u16 w;
  u16 h;
  int i;
  dev_dims(dev, &w, &h);
  sitek_init((u8)dev, w, h);
  printf("dev\t%s\n", DEV_NAMES[dev]);
  printf("w\t%u\th\t%u\trowb\t%u\tfb\t%u\n", (unsigned)SK_W, (unsigned)SK_H, (unsigned)SK_ROWB,
         (unsigned)SK_FBB);
  printf("words\t%u\tentbits\t%u\tcsbits\t%u\n", (unsigned)ks_words(), (unsigned)ks_ent_bits(),
         (unsigned)ks_cs_bits());
  for (i = 0; i < (int)ks_words(); i++) printf("idx\t%d\t%u\n", i, (unsigned)ks_word((u8)i));
  printf("ones\t%u\th8\t%u\n", (unsigned)ks_ones(), (unsigned)ks_h8());
  printf("gray\t%u\tmorton\t%u\thilbert\t%u\n", (unsigned)ks_gray(1234), (unsigned)ks_morton(1234, 5),
         (unsigned)ks_hilbert(1234, 5));
  for (i = 0; i < 8; i++) printf("nodes\t%d\t%u\n", i, (unsigned)grid_nodes((u8)i));
  for (i = 0; i < 5; i++) {
    sitek_set_screen((u8)i);
    sitek_render();
    printf("screen\t%d\thash\t%08lx\n", i, (unsigned long)fb_hash());
  }
  return 0;
}

int main(int argc, char **argv) {
  int dev;
  if (argc >= 2 && strcmp(argv[1], "selftest") == 0) return sitek_selftest();
  if (argc >= 4 && strcmp(argv[1], "render") == 0) {
    dev = dev_id(argv[2]);
    if (dev < 0) {
      printf("unknown device %s\n", argv[2]);
      return 2;
    }
    return cmd_render(dev, argv[3]);
  }
  if (argc >= 3 && strcmp(argv[1], "dump") == 0) {
    dev = dev_id(argv[2]);
    if (dev < 0) {
      printf("unknown device %s\n", argv[2]);
      return 2;
    }
    return cmd_dump(dev);
  }
  printf("usage: sitek-host selftest | render <dev> <outdir> | dump <dev>\n");
  printf("devices: ti83 ti85 ti89 ti90 ti92 host\n");
  return 2;
}
