import builtins, threading, sys, os, warnings, logging, re, struct
warnings.filterwarnings("ignore"); logging.disable(logging.CRITICAL)
builtins.input = lambda *a, **k: ""
from unicorn import UC_HOOK_MEM_READ_UNMAPPED,UC_HOOK_MEM_WRITE_UNMAPPED,UC_HOOK_MEM_FETCH_UNMAPPED
from unipacker.core import Sample, UnpackerEngine, SimpleClient
from unipacker.imagedump import ImageDump
from unipacker import imagedump
def _nochecksum(self, uc, hdr, base, total): hdr.opt_header.CheckSum=0; return hdr
imagedump.ImageDump.fix_checksum=_nochecksum

S="/home/user/Html5/.relay/samples/"
fn="F8294A40F19351B9F2C05717D6350B2E_cr_tw123a.exe"
sample=Sample(S+fn, auto_default_unpacker=False)
sample.unpacker.section_hopping_control=False
sample.unpacker.write_execute_control=False
sample.unpacker.allowed_addr_ranges=[]
ev=threading.Event()
class C(SimpleClient): pass
eng=UnpackerEngine(sample,"/tmp/x.bin"); eng.register_client(C(ev))
state={"dumped":False}
cnt=[0]
def code(uc,address,size,ud):
    cnt[0]+=1
    # payload CRT main area starts at 0x401xxx; dump once main() reached after CRT init (heuristic: >300k insns and EIP in 0x401000-0x420000)
    if not state["dumped"] and cnt[0]>300000 and 0x401000<=address<0x420000 and address!=0x401000:
        # only dump when image fully unpacked (look for PE at 0x400000 and populated .text)
        try:
            t=bytes(uc.mem_read(0x401000,16))
            if t.count(0)<8:
                state["dumped"]=True
                print("dumping at",hex(address),"insns",cnt[0])
                for rva in range(0,0x40000,0x1000):
                    try: uc.mem_map(0x400000+rva,0x1000)
                    except Exception: pass
                sample.unpacker.dump(uc, eng.apicall_handler, sample, "/home/user/work/unpacked/cr_stage2.exe")
                uc.emu_stop()
        except Exception as e: print("dumpchk",e)
    if cnt[0]>3_000_000: uc.emu_stop()
eng.uc.hook_add(8,code)
def on_unmapped(uc,access,address,size,value,ud):
    p=address&~0xfff
    end=(address+size+0xfff)&~0xfff
    while p<end:
        try: uc.mem_map(p,0x1000)
        except Exception: pass
        p+=0x1000
    return True
eng.uc.hook_add(UC_HOOK_MEM_READ_UNMAPPED|UC_HOOK_MEM_WRITE_UNMAPPED|UC_HOOK_MEM_FETCH_UNMAPPED,on_unmapped)
t=threading.Thread(target=eng.emu); t.daemon=True; t.start()
ev.wait(220)
try: eng.stop()
except: pass
print("dumped",state["dumped"],"insns",cnt[0])
