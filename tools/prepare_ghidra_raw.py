#!/usr/bin/env python3
"""Prepare an MS-DOS MZ EXE load module for Ghidra's Raw Binary loader.

The native Ghidra MS-DOS loader should be preferred. This tool exists for
repeatable raw-binary experiments: it removes the MZ header, applies the MZ
relocation table for a chosen DOS load segment, and writes an import-plan JSON.
It never executes or decrypts the input.
"""
from __future__ import annotations
import argparse, json, struct
from pathlib import Path


def u16(data: bytes, offset: int) -> int: return struct.unpack_from("<H", data, offset)[0]
def main() -> int:
    ap=argparse.ArgumentParser()
    ap.add_argument("exe", type=Path)
    ap.add_argument("--out", type=Path, default=None)
    ap.add_argument("--load-segment", type=lambda x:int(x,0), default=0x1000,
                    help="emulated DOS program load segment (default: 0x1000)")
    ns=ap.parse_args(); data=ns.exe.read_bytes()
    if len(data)<28 or data[:2]!=b"MZ": ap.error("input is not a complete MZ executable")
    pages,last,relocs,header_paras= u16(data,4),u16(data,2),u16(data,6),u16(data,8)
    ss,sp,ip,cs,reloc_off= u16(data,14),u16(data,16),u16(data,20),u16(data,22),u16(data,24)
    claimed=(pages-1)*512 + (last or 512)
    header=header_paras*16
    if header>len(data): ap.error("MZ header extends past end of file")
    image=bytearray(data[header:min(len(data),claimed)])
    relocated=[]
    for i in range(relocs):
        at=reloc_off+i*4
        if at+4>len(data): ap.error(f"relocation {i} is outside MZ header")
        off,seg=u16(data,at),u16(data,at+2)
        image_off=seg*16+off
        if image_off+2>len(image):
            relocated.append({"segment":seg,"offset":off,"status":"outside-load-module"}); continue
        old=u16(image,image_off); new=(old+ns.load_segment)&0xffff
        struct.pack_into("<H",image,image_off,new)
        relocated.append({"segment":seg,"offset":off,"image_offset":image_off,"old":old,"new":new})
    out=ns.out or ns.exe.with_suffix(".raw.bin"); out.write_bytes(image)
    plan={
      "format":"ghidra-raw-binary-import-plan-v1", "input":ns.exe.name, "raw_file":out.name,
      "language":"x86:LE:16:Real Mode", "compiler_specification":"default", "raw_base_address":f"{ns.load_segment:04X}:0000",
      "dos_load_segment":ns.load_segment, "header_bytes_removed":header, "load_module_bytes":len(image),
      "initial_registers":{"CS":(ns.load_segment+cs)&0xffff,"IP":ip,"SS":(ns.load_segment+ss)&0xffff,"SP":sp},
      "entry_address":f"{(ns.load_segment+cs)&0xffff:04X}:{ip:04X}",
      "relocation_count":relocs, "relocations_applied":relocated,
      "notes":["Import raw_file with Ghidra Raw Binary loader and select language exactly x86:LE:16:Real Mode.","Set image base to raw_base_address. Create a function at entry_address.","This is a modeled DOS load at dos_load_segment; PSP, overlays, self-modifying code, and interrupts need manual analysis.","For normal MZ work, prefer Ghidra's native MS-DOS executable loader."]
    }
    plan_path=out.with_suffix(out.suffix+".ghidra.json"); plan_path.write_text(json.dumps(plan,indent=2)+"\n")
    print(f"wrote {out}\nwrote {plan_path}")
    return 0
if __name__=="__main__": raise SystemExit(main())
