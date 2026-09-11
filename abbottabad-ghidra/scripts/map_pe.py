#!/usr/bin/env python3
"""Emit a virtual-memory-mapped PE image (sections placed at RVAs, zero-padded
to SizeOfImage) for the WASM Ghidra decompiler driver.
Usage: map_pe.py <pe-file> <out-image.bin> ; prints "<imagebase> <ep_rva+base>"""
import sys, pefile

pe = pefile.PE(sys.argv[1], fast_load=True)
imagebase = pe.OPTIONAL_HEADER.ImageBase
size = pe.OPTIONAL_HEADER.SizeOfImage
img = bytearray(size)
for s in pe.sections:
    data = s.get_data()
    va = s.VirtualAddress
    img[va:va + len(data)] = data
with open(sys.argv[2], "wb") as f:
    f.write(bytes(img))
print("%d %d %d" % (imagebase, imagebase + pe.OPTIONAL_HEADER.AddressOfEntryPoint, size))
