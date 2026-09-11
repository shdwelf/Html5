import builtins, threading, sys, os, warnings, logging, traceback
warnings.filterwarnings("ignore"); logging.disable(logging.CRITICAL)
builtins.input = lambda *a, **k: ""
from unipacker.core import Sample, UnpackerEngine, SimpleClient
from unipacker import imagedump
def _nochecksum(self, uc, hdr, base_addr, total_size):
    hdr.opt_header.CheckSum = 0
    return hdr
imagedump.ImageDump.fix_checksum = _nochecksum

S="/home/user/Html5/.relay/samples/"
tag, fn, lo, hi = sys.argv[1], sys.argv[2], int(sys.argv[3],16), int(sys.argv[4],16)
out=f"/home/user/work/unpacked/{tag}_oep.exe"
sample=Sample(S+fn, auto_default_unpacker=False)
sample.unpacker.section_hopping_control=False
sample.unpacker.write_execute_control=False
sample.unpacker.allowed_addr_ranges=[]
ev=threading.Event()
class C(SimpleClient): pass
eng=UnpackerEngine(sample,out); eng.register_client(C(ev))
state={"dumped":False}
def hook(uc,address,size,ud):
    if not state["dumped"] and lo<=address<hi:
        state["dumped"]=True
        print("OEP-range hit",hex(address))
        # backfill any unmapped pages across the image so dump reads succeed
        base = 0x400000
        for rva in range(0, 0x40000, 0x1000):
            try: uc.mem_map(base+rva, 0x1000)
            except Exception: pass
        try:
            sample.unpacker.dump(uc, eng.apicall_handler, sample, out)
        except Exception:
            traceback.print_exc()
        uc.emu_stop()
eng.uc.hook_add(8,hook)
t=threading.Thread(target=eng.emu); t.daemon=True; t.start()
ev.wait(240)
try: eng.stop()
except: pass
print("dumped",state["dumped"],os.path.exists(out), os.path.getsize(out) if os.path.exists(out) else "")
