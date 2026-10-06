; Minimal crt0 for sdcc --no-std-crt0 on the TI-83+/84+.
;
; The core has no initialised globals (only const tables and zero-filled RAM),
; so there is no gsinit loop. If you add an initialised global, add one.
; The $BB $6D AsmPrgm token is NOT here: tools/ti_pack.py prepends it, so the
; same .bin can be packed for a program or (with --no-prefix) an appvar.
;
; Build:  sdasz80 -p -g -o crt0.rel crt0.asm
    .module crt0
    .globl  _main

    .area   _HEADER (ABS)
    .org    0x9D95              ; userMem on the TI-83+/84+
    call    _main
    ret

    .area   _CODE
    .area   _DATA
