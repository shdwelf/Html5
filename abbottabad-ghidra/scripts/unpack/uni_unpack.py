import builtins, threading, sys, os, warnings, logging
warnings.filterwarnings("ignore"); logging.disable(logging.CRITICAL)
builtins.input = lambda *a, **k: ""
from unipacker.core import Sample, UnpackerEngine, SimpleClient
import unipacker

S="/home/user/Html5/.relay/samples/"
jobs={
 "CLScc":"8EC740ED0E4D6EF2C669C1BEF52E588F_CLScc.exe",
 "KeyGen_FSG":"FB0C718C7DE194CD046D3D8AF9268DCF_KeyGen.exe",
 "A0262141_PEC2":"8C3F387E85090907ED7864D07980AF86_A0262141.exe",
 "cr_tw123a":"F8294A40F19351B9F2C05717D6350B2E_cr_tw123a.exe",
}
tag=sys.argv[1]; fn=jobs[tag]; out=f"/home/user/work/unpacked/{tag}.exe"
sample=Sample(S+fn)
print("yara packer:", getattr(sample,'yara_matches',None), "unpacker:", type(sample.unpacker).__name__,
      "start:",hex(sample.unpacker.startaddr) if sample.unpacker.startaddr else "ep",
      "end:",hex(sample.unpacker.endaddr) if sample.unpacker.endaddr!=sys.maxsize else "max")
ev=threading.Event()
client=SimpleClient(ev)
eng=UnpackerEngine(sample, out)
eng.register_client(client)
t=threading.Thread(target=eng.emu); t.daemon=True; t.start()
ev.wait(300)
print("done event set:", ev.is_set())
try: eng.stop()
except Exception: pass
print("output exists:", os.path.exists(out), os.path.getsize(out) if os.path.exists(out) else "")
print("EIP:", hex(eng.uc.regs.eip))
