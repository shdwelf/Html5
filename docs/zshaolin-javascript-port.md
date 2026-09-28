# ZShaolin to JavaScript port investigation

## What was inspected

The upstream project is [dyne/ZShaolin](https://github.com/dyne/ZShaolin), an Android GNU/Linux terminal build framework. The checkout contains build recipes, Android JNI glue, shell configuration, and a toolchain; it is not a single portable executable.

The most relevant native component is `termapk/jni/termExec.cpp`. It creates an Android pseudo-terminal with `/dev/ptmx`, forks a child process, attaches file descriptors, and invokes a native command with `execl`. That behavior depends on Android/Linux kernel facilities and cannot be translated into browser JavaScript as a real process launcher.

## Ghidra assessment

There are no ZShaolin release binaries in this repository to disassemble. Running Ghidra against the GitHub build scripts would not produce meaningful machine-code output. The source is available, so source-level porting is more accurate than decompiling it. Ghidra is appropriate if a specific compiled ARM ELF is supplied later; the workflow would be:

1. preserve the binary hash and architecture;
2. identify ARM/ARM64 and load the correct processor language;
3. inspect JNI exports, imports, strings, and syscall boundaries;
4. compare decompiler output against the available C/C++ source;
5. port only deterministic, platform-independent behavior;
6. test the JavaScript/WASM replacement against captured input/output transcripts.

A disassembly-to-JavaScript rewrite would not recreate `fork`, `/dev/ptmx`, `ioctl`, `termios`, signals, or Android JNI semantics. It would produce a fragile emulator and could violate assumptions of the original GPLv3/native build.

## Implemented browser port

The inline app `apps/z3950-sru-gopher-terminal.html` now contains a safe ZShaolin bridge:

- `help`, `pwd`, `echo`, and `clear` are locally emulated;
- `catalog`, `sru`, and `gopher` route into the existing catalog UI;
- the upstream GitHub and project documentation are linked;
- no `eval`, shell execution, arbitrary filesystem access, arbitrary socket access, or credential handling is exposed;
- the entire HTML/CSS/JavaScript bundle is repackaged as `z3950-sru-gopher-terminal.xdc`.

This is a behavior-compatible terminal surface, not a claim to run Android binaries in a browser. A full native port should use a source-level rebuild to WebAssembly (PTY library + command implementations), not Ghidra output. The current bridge is the safe first milestone and leaves the protocol adapters explicit.

## Next feasible milestones

- compile a small, permitted command subset to WASM;
- implement a virtual filesystem backed by IndexedDB;
- add a line discipline and ANSI parser in JavaScript;
- keep Z39.50/YAZ behind the PHP server adapter;
- add recorded tests for command transcripts and terminal escape sequences.
