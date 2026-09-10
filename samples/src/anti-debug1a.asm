    .model tiny        ;use Debugger to Trace
    .data              ;   this code through.

text db  'DEBUG Me!$'

    .code
     org  100h

begin:
     mov   ax,0FE05h
     jmp   $-2
     sub   ax,9E03h
     lea   dx,text
     lea   sp,intrs     ;use stack to corrupt file
     push  ax
     sub   ah,43h

intrs:
     int   21h          ;stack will be moved to here
     pop   ax
     int   21h

end  begin
