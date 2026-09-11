import builtins, threading, sys, os, warnings, logging
warnings.filterwarnings("ignore"); logging.disable(logging.CRITICAL)
builtins.input = lambda *a, **k: ""
from unipacker.core import Sample, UnpackerEngine, SimpleClient

S="/home/user/Html5/.relay/samples/"
fn="F8294A40F19351B9F2C05717D6350B2E_cr_tw123a.exe"
sample=Sample(S+fn, auto_default_unpacker=False)
# neutralize auto-dump behavior
sample.unpacker.section_hopping_control=False
sample.unpacker.write_execute_control=False
ev=threading.Event()
class C(SimpleClient): pass
eng=UnpackerEngine(sample,"/tmp/x.bin"); c=C(ev); eng.register_client(c)
sections=[]
for s in sample.sections:
    nm = s.Name if isinstance(s.Name, str) else s.Name.decode('latin1')
    sections.append((nm.rstrip('\x00'), 0x400000+s.VirtualAddress, 0x400000+s.VirtualAddress+s.VirtualSize))
def secof(a):
    for n,lo,hi in sections:
        if lo<=a<hi: return n
    return b'EXT'
hops={}
order=[]
cnt=[0]
def hook(uc,address,size,ud):
    cnt[0]+=1
    n=secof(address)
    if n not in hops:
        hops[n]=address; order.append((n,address))
        print("HOP", n, hex(address), "insn",cnt[0])
    if cnt[0]>12_000_000:
        print("budget exhausted"); uc.emu_stop()
eng.uc.hook_add(8,hook)
t=threading.Thread(target=eng.emu); t.daemon=True; t.start()
ev.wait(240)
try: eng.stop()
except: pass
print("hops:",[(n.decode('latin1'),hex(a)) for n,a in order])
