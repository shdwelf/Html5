import builtins, threading, sys, os, warnings, logging
warnings.filterwarnings("ignore"); logging.disable(logging.CRITICAL)
builtins.input = lambda *a, **k: ""
from unicorn.x86_const import UC_X86_REG_EIP
from unipacker.core import Sample, UnpackerEngine, SimpleClient
from unipacker.imagedump import ImportRebuilderDump

S="/home/user/Html5/.relay/samples/"
tag=sys.argv[1]; fn=sys.argv[2]; oep=int(sys.argv[3],16)
out=f"/home/user/work/unpacked/{tag}.exe"
sample=Sample(S+fn, auto_default_unpacker=False)
ev=threading.Event()
class C(SimpleClient):
    def emu_started(self): pass
eng=UnpackerEngine(sample, out); c=C(ev); eng.register_client(c)
state={"dumped":False}
def hook(uc, addr, size, ud):
    if not state["dumped"] and addr==oep:
        state["dumped"]=True
        print("OEP hit", hex(addr), "- dumping")
        ImportRebuilderDump().dump_image(uc, sample.unpacker.BASE_ADDR,
            sample.unpacker.virtualmemorysize, eng.apicall_handler, sample, out)
        uc.emu_stop()
eng.uc.hook_add(8, hook)  # UC_HOOK_CODE
t=threading.Thread(target=eng.emu); t.daemon=True; t.start()
ev.wait(260)
try: eng.stop()
except Exception: pass
print("dumped:",state["dumped"],"file:",os.path.exists(out), os.path.getsize(out) if os.path.exists(out) else "")
