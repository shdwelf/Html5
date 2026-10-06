; TI-83 / TI-83+ / TI-84+ platform glue for the SITE-K core.
;
; Requires ti83plus.inc (TI-83 Plus SDK, or the copy shipped with Brass/spasm).
; Every ROM entry point is referenced by NAME from that include file — no
; hard-coded addresses are invented here.
;
; Build:  sdasz80 -p -g -o lcd.rel lcd.asm
#include "ti83plus.inc"

    .globl  _plat_lcd_init
    .globl  _plat_lcd_blit
    .globl  _plat_key
    .globl  _SK_FB

    .area   _CODE

; void plat_lcd_init(void)
_plat_lcd_init:
    bcall(_ClrLCDFull)
    res     AppTextSave, (iy + AppFlags)    ; text shadow off: we own the screen
    ret

; void plat_lcd_blit(void) — copy the core framebuffer into gbuf and display it.
; 96x64 -> 768 bytes, and SK_ROWB is 12, so the core layout IS the gbuf layout.
_plat_lcd_blit:
    ld      hl, #_SK_FB
    ld      de, #gbuf
    ld      bc, #768
    ldir
    bcall(_GrBufCpy)
    ret

; unsigned char plat_key(void) — blocking key read mapped onto SKK_* codes.
_plat_key:
    bcall(_GetKey)
    cp      #kLeft
    ld      a, #1                   ; SKK_LEFT
    ret     z
    cp      #kRight
    ld      a, #2                   ; SKK_RIGHT
    ret     z
    cp      #kUp
    ld      a, #3                   ; SKK_UP
    ret     z
    cp      #kDown
    ld      a, #4                   ; SKK_DOWN
    ret     z
    cp      #kEnter
    ld      a, #5                   ; SKK_ENTER
    ret     z
    cp      #kClear
    ld      a, #6                   ; SKK_EXIT
    ret     z
    cp      #kDel
    ld      a, #7                   ; SKK_ACT
    ret     z
    cp      #k1
    ld      a, #8                   ; SKK_1
    ret     z
    cp      #k2
    ld      a, #9
    ret     z
    cp      #k3
    ld      a, #10
    ret     z
    cp      #k4
    ld      a, #11
    ret     z
    cp      #k5
    ld      a, #12
    ret     z
    xor     a                       ; SKK_NONE
    ret
