import builtins, threading, sys, os, warnings, logging
warnings.filterwarnings("ignore"); logging.disable(logging.CRITICAL)
builtins.input = lambda *a, **k: ""
from unicorn import UC_HOOK_MEM_READ_UNMAPPED,UC_HOOK_MEM_WRITE_UNMAPPED,UC_HOOK_MEM_FETCH_UNMAPPED
from unipacker.core import Sample, UnpackerEngine, SimpleClient
from unipacker import unpackers as U
from unipacker import imagedump
def _nochecksum(self, uc, hdr, base, total): hdr.opt_header.CheckSum=0; return hdr
imagedump.ImageDump.fix_checksum=_nochecksum

S="/home/user/Html5/.relay/samples/"
fn="8C3F387E85090907ED7864D07980AF86_A0262141.exe"
sample=Sample(S+fn, auto_default_unpacker=False)
sample.unpacker=U.PECompactUnpacker(sample)
ev=threading.Event(); eng=UnpackerEngine(sample,"/home/user/work/unpacked/A0262141_PEC2.exe")
eng.register_client(SimpleClient(ev))
cnt=[0]; hops={}
def code(uc,address,size,ud):
    cnt[0]+=1
    sec=sample.unpacker.get_section(address)
    if sec not in hops:
        hops[sec]=address; print("HOP",sec,hex(address),"insn",cnt[0])
    if cnt[0]>20_000_000: uc.emu_stop()
eng.uc.hook_add(8,code)
def on_unmapped(uc,access,address,size,value,ud):
    p=address&~0xfff; end=(address+size+0xfff)&~0xfff
    while p<end:
        try: uc.mem_map(p,0x1000)
        except Exception: pass
        p+=0x1000
    return True
eng.uc.hook_add(UC_HOOK_MEM_READ_UNMAPPED|UC_HOOK_MEM_WRITE_UNMAPPED|UC_HOOK_MEM_FETCH_UNMAPPED,on_unmapped)
t=threading.Thread(target=eng.emu); t.daemon=True; t.start()
ev.wait(260)
try: eng.stop()
except: pass
out="/home/user/work/unpacked/A0262141_PEC2.exe"
if not os.path.exists(out):
    # manual dump once execution left the packed CODE region into freshly written code
    print("manual dump; hops:",[(k,hex(v)) for k,v in hops.items()])
    try:
        for rva in range(0,0x100000,0x1000):
            try: eng.uc.mem_map(0x400000+rva,0x1000)
            except Exception: pass
        sample.unpacker.dump(eng.uc, eng.apicall_handler, sample, out)
    except Exception as e:
        import traceback; traceback.print_exc()
print("insns",cnt[0],"file",os.path.exists(out), os.path.getsize(out) if os.path.exists(out) else "")
