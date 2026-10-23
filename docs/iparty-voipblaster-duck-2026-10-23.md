# T8.3 — iParty, VoIP Blaster FCC trail, DUCK codecs (2026-10-23)

T8.3's first cluster asked after Intel iParty and Creative Labs FCC
schematics, the VoIP Blaster, Ghidra work on iParty/DUCK codecs.
Three of the four resolve with research rather than tooling — and
one premise needs correcting: **iParty is software, so it has no
FCC filing at all**, and the VoIP Blaster's wired design means its
FCC trail never contained schematics.

## Intel iParty — Internet Party Line (1995)

Intel's experimental prototype (Nov 1995; v1.2 mirrored on GitHub at
RSzkotnicki/IPARTY, still runnable per the mirror) was among the
first Internet telephony/conference programs for Windows. Its design
sidesteps 1995 bandwidth and latency by *not mixing*: push-to-talk
records an utterance clip, the daemon (`IPARTYD.EXE`, default port
**6004**) queues clips, and clients (`IPARTY.EXE`) play them back in
order — IRC semantics with audio. Sessions are `.ipl` files addressed
by an `iparty://` URL scheme.

**The codec question, answered without Ghidra:** the binaries carry
a `CCodec` class and the strings "Can't open audio compressor",
"Can't create audio decompressor", "received unknown speech
format." — iParty delegates compression to the **Windows Audio
Compression Manager (ACM)** and negotiates a speech-format
descriptor on the wire. There is no bespoke Intel codec to
disassemble; the tractable remainder of the "Ghidra iParty codecs"
strand is identifying the default WAVEFORMAT tag values IPL 1.2
proposes (a small, well-posed target for the runner/JVM Ghidra route
shared with T1.2/T2.1). Clip-queueing *is* the compression strategy:
at 28.8 kbps, store-and-forward of utterances beats streaming.

## Creative VoIP Blaster — and why there are no FCC schematics

The VoIP Blaster (Creative, Nov 2000, $19.99 street; model TP0001,
MPN 70TP000103000) is an InnoMedia platform in Creative clothing:
USB VID `0x1292` (InnoMedia) / PID `0x0258`, an on-board DSP doing
the voice work so the host PC doesn't have to, POTS handset on one
side (corded/cordless phones supported), PC-to-PC free calling
between Blaster owners and PC-to-phone via InnoMedia's service in
200+ countries. Contemporary coverage describes H.323 compliance
that was nominal in practice (it interfered with NetMeeting rather
than interoperating), TCP signalling plus UDP voice, and the
device's serial number doubling as its phone number; the open-source
**fobbit** project (and the voip-blaster/OpenH323 effort) reverse-
engineered the USB pipes and protocol, identifying **G.723.1** as
the voice codec — the period's usual suspect for DSP-based ATAs.

**FCC verdict:** InnoMedia's ATA datasheets certify **FCC Part 15B**
— the *unintentional radiator* regime for wired digital devices.
There is no transmitter, hence no certification grant and **no
schematic exhibit in the FCC OET database to retrieve**; schematics
were never part of a 15B verification/DoC file. The schematic-level
recon trail that actually exists: InnoMedia's UL listing
(UL E220702, InnoMedia Technology Inc.), the fobbit protocol/driver
documentation, and Creative's support downloads (VOIPBlaster.EXE
driver packages). Anyone selling "the FCC schematics" for this
device is selling a document the FCC does not hold.

## DUCK codecs — the lineage ends in WebM

"DUCK" is **The Duck Corporation** (founded 1992, NYC), whose
TrueMotion line ran: **TrueMotion S** (the Sega-era FMV codec,
competing with Cinepak and Indeo), **TrueMotion 2** (FourCC `TM20`;
*Final Fantasy VII* PC; licensed by Microsoft in 1997 to "bring
TV-quality video to the PC"), then the VP series after the company
re-emerged as On2 Technologies. On2 open-sourced **VP3** in 2001 —
it lives on as Xiph's **Theora** — and Google's 2010 acquisition of
On2 turned **VP8** into the core of **WebM**. Practical consequence
for the Ghidra strand: TrueMotion 1/2 decoders are source-available
in FFmpeg's libavcodec, so the codecs need *format documentation*,
not disassembly; the lineage above is that documentation's outline.

## What remains genuinely open in T8.3

- iParty's default speech-format tags (runner/JVM Ghidra, shared
  route with T1.2/T2.1);
- the **lossless comms room** and **Tetrinet** strands (design/build
  items, untouched by this research pass — stated plainly rather
  than padded);
- Ghidra iParty *protocol* work if the format-tag pass justifies it.

## Sources

Wikipedia, "Internet Party Line" (with Hamilton & Wilson, *IEEE
Computer* 30(4), 1997); RSzkotnicki/IPARTY GitHub mirror (binaries
and INI inspected locally this pass — ACM/`CCodec` strings, port
6004); Creative press release "Creative Makes the Call with VoIP
Blaster" (2000-11-15) and Creative support downloads; DeviceHunt
USB VID 1292 / PID 0258; fobbit project (SourceForge) info page and
contemporary Slashdot voip-blaster discussion (2002) for protocol
and codec attribution; InnoMedia MTA8328 datasheets (FCC Part 15B
compliance) and UL Prospector listing E220702; Wikipedia/On2
Technologies and Microsoft's 1997 TrueMotion 2.0 licence release
for the DUCK lineage.
