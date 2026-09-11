import builtins, threading, sys, os, warnings, logging
warnings.filterwarnings("ignore"); logging.disable(logging.CRITICAL)
builtins.input = lambda *a, **k: ""
from unipacker.core import Sample, UnpackerEngine, SimpleClient
from unipacker import unpackers as U

S="/home/user/Html5/.relay/samples/"
jobs={
 "KeyGen_FSG":("FB0C718C7DE194CD046D3D8AF9268DCF_KeyGen.exe", U.FSGUnpacker),
 "A0262141_PEC2":("8C3F387E85090907ED7864D07980AF86_A0262141.exe", U.PECompactUnpacker),
}
tag=sys.argv[1]; fn,cls=jobs[tag]; out=f"/home/user/work/unpacked/{tag}.exe"
sample=Sample(S+fn, auto_default_unpacker=False)
sample.unpacker=cls(sample)
print("forced unpacker:",sample.unpacker.name,
      "allowed:",[(hex(a),hex(b)) for a,b in sample.unpacker.allowed_addr_ranges])
ev=threading.Event(); client=SimpleClient(ev)
eng=UnpackerEngine(sample, out); eng.register_client(client)
t=threading.Thread(target=eng.emu); t.daemon=True; t.start()
ev.wait(280)
try: eng.stop()
except Exception: pass
print("output exists:", os.path.exists(out), os.path.getsize(out) if os.path.exists(out) else "")
