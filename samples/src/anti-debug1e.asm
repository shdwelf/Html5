.model tiny
.code
org 100h

begin:
    mov   ax,3508h              ;trap the timer interrupt
    int   21h
    mov   word ptr [int_8],bx
    mov   word ptr [int_8+2],es
    mov   dx,offset prog_start
    mov   ah,25h                ;program is now part of timer interrupt
    int   21h

done:
    cmp   flag,1                 ;if the flag isn't set, loop
    jne   done
    push  bx                     ;clean up and exit
    pop   dx
    push  es
    pop   ds
    int   21h
    int   20h

flag      db    0               ;this is the flag we're interested in
int_8     dd    ?
text      db    'Don''t DEBUG Me!$'

prog_start:

    push  ax
    push  dx
    mov   ah,9
    lea   dx,text
    int   21h
    mov   flag,1          ;This flag gets set when the timer goes off
    pop   dx
    pop   ax
    jmp   dword ptr [offset int_8]

end begin
