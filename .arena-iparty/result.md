<!-- run 40030773332 attempt 1 · toolchain: Temurin 21 + Ghidra 12.1.4 (20260921) · IPL mirror commit c9f022bea9087d7ce9fe8325de6da95e9fe2f996 -->

# iParty Ghidra pass — result (T8.3)

## IPARTY.EXE

- format: Portable Executable (PE) · language: x86:LE:32:default · compiler: windows
- sha256 (Ghidra): e1eefe28dd1ac1f0c49424a8ad102beb46ad969975e634765d9a1622977e5eb4
- functions: 1644 · instructions: 52914 · defined strings: 923

### Audio/ACM-related imports (13)

- `WINMM.DLL!waveInClose` @ EXTERNAL:00000001
- `WINMM.DLL!waveInOpen` @ EXTERNAL:00000002
- `WINMM.DLL!waveInReset` @ EXTERNAL:00000003
- `WINMM.DLL!waveOutUnprepareHeader` @ EXTERNAL:00000004
- `WINMM.DLL!waveInStart` @ EXTERNAL:00000005
- `WINMM.DLL!waveOutReset` @ EXTERNAL:00000006
- `WINMM.DLL!waveOutWrite` @ EXTERNAL:00000007
- `WINMM.DLL!waveOutClose` @ EXTERNAL:00000008
- `WINMM.DLL!waveInUnprepareHeader` @ EXTERNAL:00000009
- `WINMM.DLL!waveInAddBuffer` @ EXTERNAL:0000000a
- `WINMM.DLL!waveOutPrepareHeader` @ EXTERNAL:0000000b
- `WINMM.DLL!waveInPrepareHeader` @ EXTERNAL:0000000c
- `WINMM.DLL!waveOutOpen` @ EXTERNAL:0000000d

### Codec/format strings (8)

- `004391a8	received unknown speech format.`
- `004392f0	Can't open audio decompressor`
- `00439310	Can't create audio decompressor`
- `00439330	Can't open audio compressor`
- `0043934c	Can't create audio compressor`
- `00439490	CCodec`
- `00439698	CGSMPub610`
- `004396a8	$Header: /home/kbs/jutta/src/gsm/gsm-1.0/src/RCS/gsm_create.c,v 1.2 1994/05/10 20:18:39 jutta Exp $`

### Decompiled fragments touching ACM/WAVEFORMAT (0 shown)

None of the decompiled functions (the report caps decompilation) touched the ACM path; a targeted xref script is the follow-on.

## IPARTYD.EXE

- format: Portable Executable (PE) · language: x86:LE:32:default · compiler: windows
- sha256 (Ghidra): 162a34fb384bc7d139df8efad1fc31cdcd774946d6b9ae11c08d95c116d2f41c
- functions: 1634 · instructions: 52615 · defined strings: 904

### Audio/ACM-related imports (13)

- `WINMM.DLL!waveInClose` @ EXTERNAL:00000001
- `WINMM.DLL!waveInOpen` @ EXTERNAL:00000002
- `WINMM.DLL!waveInReset` @ EXTERNAL:00000003
- `WINMM.DLL!waveOutUnprepareHeader` @ EXTERNAL:00000004
- `WINMM.DLL!waveInStart` @ EXTERNAL:00000005
- `WINMM.DLL!waveOutReset` @ EXTERNAL:00000006
- `WINMM.DLL!waveOutWrite` @ EXTERNAL:00000007
- `WINMM.DLL!waveOutClose` @ EXTERNAL:00000008
- `WINMM.DLL!waveInUnprepareHeader` @ EXTERNAL:00000009
- `WINMM.DLL!waveInAddBuffer` @ EXTERNAL:0000000a
- `WINMM.DLL!waveOutPrepareHeader` @ EXTERNAL:0000000b
- `WINMM.DLL!waveInPrepareHeader` @ EXTERNAL:0000000c
- `WINMM.DLL!waveOutOpen` @ EXTERNAL:0000000d

### Codec/format strings (8)

- `00439090	received unknown speech format.`
- `004391d8	Can't open audio decompressor`
- `004391f8	Can't create audio decompressor`
- `00439218	Can't open audio compressor`
- `00439234	Can't create audio compressor`
- `00439400	CCodec`
- `00439608	CGSMPub610`
- `00439618	$Header: /home/kbs/jutta/src/gsm/gsm-1.0/src/RCS/gsm_create.c,v 1.2 1994/05/10 20:18:39 jutta Exp $`

### Decompiled fragments touching ACM/WAVEFORMAT (0 shown)

None of the decompiled functions (the report caps decompilation) touched the ACM path; a targeted xref script is the follow-on.

Scope: static analysis only; binaries were never executed or emulated. Identifying the *default* WAVEFORMAT tag IPL proposes may still need a targeted cross-reference pass from the compressor-open call sites.
