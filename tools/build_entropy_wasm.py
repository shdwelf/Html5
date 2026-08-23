#!/usr/bin/env python3
"""Assemble a compact WASM entropy/keyspace projector (no external wat2wasm)."""

import struct
from pathlib import Path


def uleb(n: int) -> bytes:
    out = bytearray()
    while True:
        b = n & 0x7F
        n >>= 7
        if n:
            out.append(b | 0x80)
        else:
            out.append(b)
            break
    return bytes(out)


def vec(items: bytes, count: int) -> bytes:
    return uleb(count) + items


def section(sid: int, payload: bytes) -> bytes:
    return bytes([sid]) + uleb(len(payload)) + payload


# valtypes
I32, F32 = 0x7F, 0x7D

# opcodes
UNREACHABLE = b"\x00"
NOP = b"\x01"
END = b"\x0b"
LOCAL_GET = lambda i: b"\x20" + uleb(i)
LOCAL_SET = lambda i: b"\x21" + uleb(i)
LOCAL_TEE = lambda i: b"\x22" + uleb(i)
I32_LOAD = lambda align, off: b"\x28" + uleb(align) + uleb(off)
I32_STORE = lambda align, off: b"\x36" + uleb(align) + uleb(off)
F32_STORE = lambda align, off: b"\x38" + uleb(align) + uleb(off)
def I32_CONST(n: int) -> bytes:
    n = n & 0xFFFFFFFF
    if n >= 0x80000000:
        n -= 0x100000000
    return b"\x41" + signed_leb(n)
F32_CONST = lambda f: b"\x43" + struct.pack("<f", f)
I32_ADD = b"\x6a"
I32_SUB = b"\x6b"
I32_MUL = b"\x6c"
I32_AND = b"\x71"
I32_OR = b"\x72"
I32_XOR = b"\x73"
I32_SHL = b"\x74"
I32_SHR_U = b"\x76"
I32_ROTL = b"\x77"
I32_EQZ = b"\x45"
I32_EQ = b"\x46"
I32_LT_U = b"\x49"
I32_GE_U = b"\x4f"
F32_DIV = b"\x95"
F32_MUL = b"\x94"
F32_ADD = b"\x92"
F32_SUB = b"\x93"
I32_TRUNC_F32_U = b"\xaa"
F32_CONVERT_I32_U = b"\xb3"
IF = b"\x04\x40"
ELSE = b"\x05"
BLOCK = b"\x02\x40"
LOOP = b"\x03\x40"
BR = lambda i: b"\x0c" + uleb(i)
BR_IF = lambda i: b"\x0d" + uleb(i)
RETURN = b"\x0f"
DROP = b"\x1a"
CALL = lambda i: b"\x10" + uleb(i)


def signed_leb(n: int) -> bytes:
    out = bytearray()
    more = True
    while more:
        b = n & 0x7F
        n >>= 7
        if (n == 0 and (b & 0x40) == 0) or (n == -1 and (b & 0x40)):
            more = False
        else:
            b |= 0x80
        out.append(b)
        # keep n as signed
        if n > 0 and not more:
            pass
    return bytes(out)


def I32_CONST_S(n: int) -> bytes:
    return b"\x41" + signed_leb(n)


# types: 0 mix(i32,i32)->i32 ; 1 scatter(i32)->i32 ; 2 path(i32)->i32 ; 3 field(i32,i32,i32)->i32
type_mix = bytes([0x60, 2, I32, I32, 1, I32])
type_scatter = bytes([0x60, 1, I32, 1, I32])
type_path = bytes([0x60, 1, I32, 1, I32])
type_field = bytes([0x60, 3, I32, I32, I32, 1, I32])

type_sec = section(1, vec(type_mix + type_scatter + type_path + type_field, 4))

# funcs: mix=0, scatter=1, path=2, field=3
func_sec = section(3, vec(uleb(0) + uleb(1) + uleb(2) + uleb(3), 4))

mem_sec = section(5, vec(bytes([0x00, 4]), 1))  # 4 pages

export_entries = b""
exports = [
    (b"memory", 0x02, 0),
    (b"mix", 0x00, 0),
    (b"scatterWords", 0x00, 1),
    (b"phrasePath", 0x00, 2),
    (b"entropyField", 0x00, 3),
]
exp_pl = bytearray()
exp_pl += uleb(len(exports))
for name, kind, idx in exports:
    exp_pl += uleb(len(name)) + name + bytes([kind]) + uleb(idx)
export_sec = section(7, bytes(exp_pl))

# mix(x, k): x ^= k; x *= 0x45d9f3b; x ^= x>>16; return x
# locals none
mix_body = (
    LOCAL_GET(0)
    + LOCAL_GET(1)
    + I32_XOR
    + I32_CONST(0x45D9F3B)
    + I32_MUL
    + LOCAL_TEE(0)
    + LOCAL_GET(0)
    + I32_CONST(16)
    + I32_SHR_U
    + I32_XOR
    + END
)
mix_code = uleb(len(mix_body)) + mix_body  # wait, code is size of locals+body
# actually: size, vec(locals), expr
mix_fn = vec(b"", 0) + mix_body
mix_fn = uleb(len(mix_fn)) + mix_fn

# scatterWords(n): for i in 0..n write 3 f32 at i*12
# golden angle sphere
# locals: i, h, x, (use i32 locals)
# i32 locals: i, hashed
scatter_code = bytearray()
# locals: 2 xi32
scatter_locals = vec(bytes([2, I32]), 1)
# i = 0
scatter_body = (
    I32_CONST(0)
    + LOCAL_SET(1)
    + LOOP
    + LOCAL_GET(1)
    + LOCAL_GET(0)
    + I32_GE_U
    + BR_IF(1)  # break loop? we need block+loop
)

# Fix control flow: block { loop { if i>=n br 1; ... i++; br 0 } }
scatter_body = (
    I32_CONST(0)
    + LOCAL_SET(1)
    + BLOCK
    + LOOP
    + LOCAL_GET(1)
    + LOCAL_GET(0)
    + I32_GE_U
    + BR_IF(1)
    # h = mix(i * 2654435761, i)
    + LOCAL_GET(1)
    + I32_CONST(2654435761 & 0xFFFFFFFF)
    + I32_MUL
    + LOCAL_GET(1)
    + CALL(0)
    + LOCAL_SET(2)
    # store f32 x at i*12
    # x = ((h & 0xffff) / 65535) * 2 - 1
    + LOCAL_GET(1)
    + I32_CONST(12)
    + I32_MUL
    + LOCAL_GET(2)
    + I32_CONST(0xFFFF)
    + I32_AND
    + F32_CONVERT_I32_U
    + F32_CONST(65535.0)
    + F32_DIV
    + F32_CONST(2.0)
    + F32_MUL
    + F32_CONST(1.0)
    + F32_SUB
    + F32_STORE(2, 0)
    # y
    + LOCAL_GET(1)
    + I32_CONST(12)
    + I32_MUL
    + LOCAL_GET(2)
    + I32_CONST(16)
    + I32_SHR_U
    + I32_CONST(0xFFFF)
    + I32_AND
    + F32_CONVERT_I32_U
    + F32_CONST(65535.0)
    + F32_DIV
    + F32_CONST(2.0)
    + F32_MUL
    + F32_CONST(1.0)
    + F32_SUB
    + F32_STORE(2, 4)
    # z from mix(h, 0x9e3779b9)
    + LOCAL_GET(2)
    + I32_CONST(0x9E3779B9)
    + CALL(0)
    + LOCAL_SET(2)
    + LOCAL_GET(1)
    + I32_CONST(12)
    + I32_MUL
    + LOCAL_GET(2)
    + I32_CONST(0xFFFF)
    + I32_AND
    + F32_CONVERT_I32_U
    + F32_CONST(65535.0)
    + F32_DIV
    + F32_CONST(2.0)
    + F32_MUL
    + F32_CONST(1.0)
    + F32_SUB
    + F32_STORE(2, 8)
    + LOCAL_GET(1)
    + I32_CONST(1)
    + I32_ADD
    + LOCAL_SET(1)
    + BR(0)
    + END  # loop
    + END  # block
    + LOCAL_GET(0)
    + END
)
scatter_fn = scatter_locals + scatter_body
scatter_fn = uleb(len(scatter_fn)) + scatter_fn

# phrasePath(count): indices i32 at offset 32768, write xyz f32 at 0 using word positions at 0? 
# We'll put word cloud at 0 (2048*12), indices at 65536, path at 69632
# Actually scatter writes n points at 0. phrasePath reads indices as i32 from ptr 65536
# pos = index * 12
# locals: i

path_locals = vec(bytes([2, I32]), 1)
path_body = (
    I32_CONST(0)
    + LOCAL_SET(1)
    + BLOCK
    + LOOP
    + LOCAL_GET(1)
    + LOCAL_GET(0)
    + I32_GE_U
    + BR_IF(1)
    # idx = load i32 65536 + i*4
    + I32_CONST(65536)
    + LOCAL_GET(1)
    + I32_CONST(4)
    + I32_MUL
    + I32_ADD
    + I32_LOAD(2, 0)
    + LOCAL_SET(2)
    # dest = 69632 + i*12
    # src = idx * 12
    + I32_CONST(69632)
    + LOCAL_GET(1)
    + I32_CONST(12)
    + I32_MUL
    + I32_ADD
    + LOCAL_GET(2)
    + I32_CONST(12)
    + I32_MUL
    + I32_LOAD(2, 0)
    + I32_STORE(2, 0)
    + I32_CONST(69632)
    + LOCAL_GET(1)
    + I32_CONST(12)
    + I32_MUL
    + I32_ADD
    + LOCAL_GET(2)
    + I32_CONST(12)
    + I32_MUL
    + I32_LOAD(2, 4)
    + I32_STORE(2, 4)
    + I32_CONST(69632)
    + LOCAL_GET(1)
    + I32_CONST(12)
    + I32_MUL
    + I32_ADD
    + LOCAL_GET(2)
    + I32_CONST(12)
    + I32_MUL
    + I32_LOAD(2, 8)
    + I32_STORE(2, 8)
    + LOCAL_GET(1)
    + I32_CONST(1)
    + I32_ADD
    + LOCAL_SET(1)
    + BR(0)
    + END
    + END
    + I32_CONST(69632)
    + END
)
path_fn = path_locals + path_body
path_fn = uleb(len(path_fn)) + path_fn

# entropyField(seedPtr, seedLen, count): write count vec3 at 131072
# h = mix(byte, i)
field_locals = vec(bytes([3, I32]), 1)  # i, h, b
field_body = (
    I32_CONST(0)
    + LOCAL_SET(3)
    + BLOCK
    + LOOP
    + LOCAL_GET(3)
    + LOCAL_GET(2)
    + I32_GE_U
    + BR_IF(1)
    # b = mem[seedPtr + (i % seedLen)]
    + LOCAL_GET(0)
    + LOCAL_GET(3)
    + LOCAL_GET(1)
    + b"\x6f"  # rem_u
    + I32_ADD
    + I32_LOAD(0, 0)  # load i32 then and 0xff — align 0
    + I32_CONST(0xFF)
    + I32_AND
    + LOCAL_GET(3)
    + I32_CONST(16777619)
    + I32_MUL
    + I32_XOR
    + LOCAL_GET(3)
    + CALL(0)
    + LOCAL_SET(4)
    + I32_CONST(131072)
    + LOCAL_GET(3)
    + I32_CONST(12)
    + I32_MUL
    + I32_ADD
    + LOCAL_GET(4)
    + I32_CONST(0xFFFF)
    + I32_AND
    + F32_CONVERT_I32_U
    + F32_CONST(65535.0)
    + F32_DIV
    + F32_CONST(8.0)
    + F32_MUL
    + F32_CONST(4.0)
    + F32_SUB
    + F32_STORE(2, 0)
    + LOCAL_GET(4)
    + I32_CONST(0x27d4eb2d)
    + CALL(0)
    + LOCAL_SET(4)
    + I32_CONST(131072)
    + LOCAL_GET(3)
    + I32_CONST(12)
    + I32_MUL
    + I32_ADD
    + LOCAL_GET(4)
    + I32_CONST(0xFFFF)
    + I32_AND
    + F32_CONVERT_I32_U
    + F32_CONST(65535.0)
    + F32_DIV
    + F32_CONST(8.0)
    + F32_MUL
    + F32_CONST(4.0)
    + F32_SUB
    + F32_STORE(2, 4)
    + LOCAL_GET(4)
    + I32_CONST(0x165667B1)
    + CALL(0)
    + LOCAL_SET(4)
    + I32_CONST(131072)
    + LOCAL_GET(3)
    + I32_CONST(12)
    + I32_MUL
    + I32_ADD
    + LOCAL_GET(4)
    + I32_CONST(0xFFFF)
    + I32_AND
    + F32_CONVERT_I32_U
    + F32_CONST(65535.0)
    + F32_DIV
    + F32_CONST(8.0)
    + F32_MUL
    + F32_CONST(4.0)
    + F32_SUB
    + F32_STORE(2, 8)
    + LOCAL_GET(3)
    + I32_CONST(1)
    + I32_ADD
    + LOCAL_SET(3)
    + BR(0)
    + END
    + END
    + I32_CONST(131072)
    + END
)
# locals: we used 3,4 — declared 3 i32 starting after params (params 0,1,2) so locals are 3,4,5
# I used local 3 and 4. Need 2 locals. Fix declaration to 2 i32 — then local 3 and 4. Good.
# Wait I declared 3 i32 (3,4,5) and used 3 and 4. OK.

field_fn = field_locals + field_body
field_fn = uleb(len(field_fn)) + field_fn

# mix function uses local.set 0 which is a param — that's allowed (params are locals)

code_pl = vec(mix_fn + scatter_fn + path_fn + field_fn, 4)
# vec already prefixes count; but mix_fn etc already have their own size prefixes
code_sec = section(10, code_pl)

mod = (
    b"\x00asm\x01\x00\x00\x00"
    + type_sec
    + func_sec
    + mem_sec
    + export_sec
    + code_sec
)

out = Path(__file__).resolve().parents[1] / "wasm" / "entropy.wasm"
out.parent.mkdir(parents=True, exist_ok=True)
out.write_bytes(mod)
print(f"wrote {out} ({len(mod)} bytes)")
