     .model tiny               ;Trace  through  this
     .data                     ;code with a debugger
                               ;& type (G) at INT 21
text  db   'Don''t DEBUG Me.$'
bug   db   7, 7, 7
      db   'I said NOT TO DEBUG ME! Are you slow?$'

     .code
      org 100h

begin:
      mov   ah,9
      mov   word ptr [offset intrs - 2],offset bug  ;change message
      lea   dx,text

intrs:
      int   21h
      int   20h

end   begin
