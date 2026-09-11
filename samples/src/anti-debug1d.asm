     .model tiny
     .code
      org   100h

trick:
      sub   ax,ax
      mov   ds,ax
      mov   ax,word ptr ds:[0]    ;trap interrupt 0 (Divide by 0 error)
      mov   word ptr cs:orig_0,ax
      mov   ax,word ptr ds:[2]
      mov   word ptr cs:orig_2,ax
      mov   word ptr ds:[0],offset untrick ;INT 0 points to our routine
      sub   ah,ah
      mov   ds:[2],cs              ;INT 0 segment now same as ours
      div   ah                     ;Invoke INT 0 error

exit:

      mov   ah,4Ch                 ;put all kinds of routines here
      int   21h

untrick:
      mov   word ptr ds:[0],0      ;reset INT 0 to normal values
orig_0      equ $-2
      mov   word ptr ds:[2],0
orig_2      equ $-2

      push  cs                     ;continue with program
      pop   ds
      mov   ah,9
      lea   dx,it_worked
      int   21h

      jmp   short exit

it_worked   db 'It Worked!$'

end trick
