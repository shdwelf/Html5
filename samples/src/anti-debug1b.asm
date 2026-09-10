     .model tiny        ;(T)race first line,
     .data              ;then type (G)o

text  db   'Don''t DEBUG Me.$'

     .code
      org 100h

begin:
      mov   byte ptr [offset intrs - 1],9 ;change the AH val for INT 21h
      lea   dx,text
      mov   ah,4Ch            ;drop to DOS. (Print_String if debugged)

intrs:
      int   21h
      int   20h

end   begin
