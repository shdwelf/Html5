/* SITE-K portable core — one math/UI core for Z80 and 68k calculators.
 *
 * The same sources compile for:
 *   sdcc   (Z80)  TI-83 / TI-85 / TI-90
 *   gcc4ti (m68k) TI-89 / TI-92
 *   gcc    (host) tests, previews
 *   c2js   (web)  the emulator in calc.html — transpiled, not reimplemented
 *
 * Portability rules for anything in calc/core:
 *   - integer only; no float, no libc, no malloc
 *   - no struct, no pointer arithmetic (arrays may be passed as parameters)
 *   - declarations at block top, one per line, no ternary, no switch
 *   - 32-bit values use u32/i32 (long): 16-bit int on Z80 would overflow
 *   - anything that can wrap 32 bits goes through u32w()/add32()/ror32()
 */
#ifndef SITEK_H
#define SITEK_H

typedef unsigned char u8;
typedef signed char i8;
typedef unsigned int u16;
typedef signed int i16;
typedef unsigned long u32;
typedef signed long i32;

/* Largest LCD in the family: TI-92 240x128, 1 bit per pixel, 30 bytes a row. */
#define FB_MAX 3840

/* Device ids — order matters, mirrors calc/devices.json */
#define DEV_TI83 0
#define DEV_TI85 1
#define DEV_TI89 2
#define DEV_TI90 3
#define DEV_TI92 4
#define DEV_HOST 5

/* Screens */
#define SCR_BOOT 0
#define SCR_GRID 1
#define SCR_KEYS 2
#define SCR_TERR 3
#define SCR_INFO 4

/* Normalised keys — each platform layer maps its keypad onto these */
#define SKK_NONE 0
#define SKK_LEFT 1
#define SKK_RIGHT 2
#define SKK_UP 3
#define SKK_DOWN 4
#define SKK_ENTER 5
#define SKK_EXIT 6
#define SKK_ACT 7
#define SKK_1 8
#define SKK_2 9
#define SKK_3 10
#define SKK_4 11
#define SKK_5 12

/* Pixel write modes */
#define PX_CLEAR 0
#define PX_SET 1
#define PX_FLIP 2

/* Fill patterns */
#define FILL_CLEAR 0
#define FILL_SOLID 1
#define FILL_HALF 2
#define FILL_QUARTER 3

#define KS_MAX_WORDS 24

#define TR_MAXW 48
#define TR_MAXH 24

/* ---------- integer helpers (core/util.c) ---------- */
int idiv(int a, int b);
int imod(int a, int b);
int iabs(int a);
int imin(int a, int b);
int imax(int a, int b);
int iclamp(int v, int lo, int hi);
u32 u32w(u32 v);
u32 shr32(u32 v, int n);
u32 mul32(u32 a, u32 b);
u32 add32(u32 a, u32 b);
u32 ror32(u32 v, int n);
u32 rng_next(void);
void rng_seed(u32 s);
u16 rng_range(u16 n);
int fsin(int deg);
int fcos(int deg);
int isqrt(int v);
int log2_q8(u32 v);

/* ---------- framebuffer (core/fb.c) ---------- */
extern u8 SK_FB[FB_MAX];

void fb_clear(void);
void fb_px(u16 x, u16 y, u8 mode);
u8 fb_get(u16 x, u16 y);
void fb_hline(u16 x0, u16 x1, u16 y, u8 mode);
void fb_vline(u16 x, u16 y0, u16 y1, u8 mode);
void fb_line(u16 x0, u16 y0, u16 x1, u16 y1, u8 mode);
void fb_rect(u16 x, u16 y, u16 w, u16 h, u8 mode);
void fb_box(u16 x, u16 y, u16 w, u16 h, u8 fill);
void fb_text(u16 x, u16 y, const u8 *s);
void fb_textm(u16 x, u16 y, const u8 *s, u8 mode);
void fb_text2(u16 x, u16 y, const u8 *s);
u16 fb_text_w(const u8 *s);
u16 str_copy(u8 *dst, const u8 *src);
u16 str_copy_at(u8 *dst, u16 at, const u8 *src);
u16 num_to(u8 *dst, u16 at, u16 v);

/* ---------- keyspace (core/keys.c) ---------- */
void sha256_hash(const u8 *msg, u16 len, u8 *out);
void ks_seed(u32 s);
void ks_gen(u8 words);
void ks_set_entropy(const u8 *ent, u8 nbytes);
u16 ks_word(u8 i);
u16 ks_gray(u16 n);
u16 ks_gray_inv(u16 g);
u16 ks_hilbert(u32 d, u8 order);
u16 ks_morton(u32 d, u8 order);
u8 ks_stream_bit(u16 i);
u16 ks_ent_bits(void);
u8 ks_cs_bits(void);
u8 ks_words(void);
u16 ks_ones(void);
u16 ks_h8(void);

/* ---------- grid + terrarium (core/grid.c) ---------- */
void grid_seed(u32 s);
u8 grid_nodes(u8 sector);
u16 grid_node_xy(u8 sector, u8 slot);
void tr_init(u32 s, u16 maxw, u16 maxh);
void tr_step(void);
u8 tr_get(u16 i);
u16 tr_w(void);
u16 tr_h(void);
u16 tr_gen(void);

/* ---------- app shell (core/app.c) ---------- */
extern u16 SK_W;
extern u16 SK_H;
extern u16 SK_ROWB;
extern u16 SK_FBB;
extern u8 SK_DEV;
extern u8 SK_SCREEN;
extern u8 SK_CURSOR;
extern u8 SK_SUB;
extern u8 SK_SELWORD;
extern u16 SK_TICK;
extern u8 SK_QUIT;

void sitek_init(u8 dev, u16 w, u16 h);
void sitek_key(u8 k);
void sitek_set_screen(u8 scr);
u8 sitek_get_screen(void);
void sitek_set_cursor(u8 cur);
void sitek_set_sub(u8 sub);
void sitek_tick(void);
void sitek_render(void);
const u8 *dev_name(u8 dev);
const u8 *dev_cpu(u8 dev);
u16 dev_ram_k(u8 dev);

#endif
