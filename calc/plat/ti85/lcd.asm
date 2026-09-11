; TI-85 platform glue for the SITE-K core.
;
; The TI-85 has no OS hook for assembly: programs ship as strings and are
; launched by a ZShell-compatible shell (ZShell, Usgard, Rigel). This layer
; uses the ZShell ROM entry points by NAME from ti85.inc — get that include
; from the ZShell SDK / ticalc.org and drop it next to this file.
;
; Build:  sdasz80 -p -g -o lcd.rel lcd.asm
#include "ti85.inc"

    .globl  _plat_lcd_init
    .globl  _plat_lcd_blit
    .globl  _plat_key
    .globl  _SK_FB

    .area   _CODE

_plat_lcd_init:
    call    CLR_LCD
    ret

; 128x64 -> 1024 bytes, SK_ROWB is 16: the core layout is the gbuf layout.
_plat_lcd_blit:
    ld      hl, #_SK_FB
    ld      de, #VIDEO_MEM
    ld      bc, #1024
    ldir
    call    GRBUFCPY
    ret

; Blocking key read. ZShell exposes GET_KEY; the shell owns the keypad mapping.
_plat_key:
    call    GET_KEY
    cp      #K_LEFT
    ld      a, #1                   ; SKK_LEFT
    ret     z
    cp      #K_RIGHT
    ld      a, #2
    ret     z
    cp      #K_UP
    ld      a, #3
    ret     z
    cp      #K_DOWN
    ld      a, #4
    ret     z
    cp      #K_ENTER
    ld      a, #5
    ret     z
    cp      #K_EXIT
    ld      a, #6
    ret     z
    cp      #K_F1
    ld      a, #7                   ; SKK_ACT
    ret     z
    xor     a
    ret
