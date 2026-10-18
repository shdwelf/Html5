# BBS servers → ColdFire / JAR feasibility (18 October 2026)

## Scope and source distinction

The Internet Archive is useful for identifying and preserving historical BBS distributions; a listing tagged “abandonware” is **not** a source-code license. A Java `.jar` is JVM bytecode in a ZIP container, not ColdFire machine code. A ColdFire-native JVM, OS, matching class libraries and socket implementation would be required to execute it on a ColdFire board. Merely re-zipping a DOS/Win32 EXE, or compiling Java on x86, does not meet that requirement.

## Archive.org candidates (listing metadata, not a license audit of downloaded bytes)

| Archive item | Listed content | Port verdict |
| --- | --- | --- |
| [Wildcat! 4.11 for DOS](https://archive.org/details/mustang-software-wildcat-4.11) | 1995 Mustang Software, DOS installer images | Historical preservation/reference only; no source or redistribution/derivative license established from the listing. No binary-to-JAR conversion. |
| [Wildcat! BBS 5](https://archive.org/details/wildcat5) | 1996 proprietary-era release | Same limitation; item metadata and product key are not permission to port or republish. |
| [World of Communication](https://archive.org/details/wocusd-025) | 1994 shareware compilation; listing names QuickBBS, RemoteAccess, Renegade, Synchronet and others | Index of candidates, **not** proof that every included program is open source. Inventory individual media and licenses before reuse. |
| [Synchronet collection](https://archive.org/details/3b4a365aac025b62e1045552d613cb1c3d7f2f8b5ae7462f353dd3dc71f2ec4bf50018dbcbd51cf7) | Multi-version historical distribution; uploader describes GPL/LGPL components | Inspect particular version/component and source availability; prefer the live source repository for implementation rather than treating uploader metadata as blanket licensing. |

No archive payload was downloaded, executed, or bundled in this pass.

## GitHub candidates (repository metadata and primary README/build files)

| Source | Language / terms | Java/JAR and ColdFire fit |
| --- | --- | --- |
| [sblendorio/petscii-bbs](https://github.com/sblendorio/petscii-bbs) | Java, repository `LICENSE` is MPL-2.0; README documents a fat-JAR BBS with ASCII/PETSCII and Telnet. Current `pom.xml` sets both compiler source and target to **21**, with numerous dependencies, including SQLite JDBC. | Best *functional* Java reference, but the current jar is **not** a plausible drop-in for an older embedded JVM. A version-pinned, reduced port would need an explicit target Java level and per-dependency/native audit; preserve MPL obligations for reused files. |
| [wwivbbs/wwiv](https://github.com/wwivbbs/wwiv) | C++; checked repository `LICENSE` says Apache-2.0 (GitHub's automated metadata is `NOASSERTION`). | Good open-source classic BBS reference or potential native ColdFire C++ port; cannot turn C++ into JVM bytecode by packaging it in a JAR. Verify lib dependencies and no-MMU assumptions. |
| [SynchronetBBS/sbbs](https://github.com/SynchronetBBS/sbbs) | C/C++ and BBS JavaScript; GitHub says this is a mirror, not the contribution upstream. Archive describes GPL/LGPL, but licensing is component-specific. | Large mixed-language server; native cross-port or clean-room Java rewrite, not direct Java compilation. |
| [NuSkooler/enigma-bbs](https://github.com/NuSkooler/enigma-bbs) | Node.js, BSD-2-Clause. | A reference for server behavior, not JVM code; needs Node.js or a rewrite. |
| [wouterken/BulletinBoard](https://github.com/wouterken/BulletinBoard) | Java Telnet bulletin board; GitHub repository has **no declared license** in metadata checked here. | Technically interesting, but do not copy or distribute it without explicit permission/license confirmation. |
| [kaffe/kaffe](https://github.com/kaffe/kaffe) / [uclinux-dev/elf2flt](https://github.com/uclinux-dev/elf2flt) | Historical JVM / no-MMU ELF-to-flat tool. | Research leads only. Neither source is evidence that a Java runtime and libraries are already running on the requested ColdFire board. |

GitHub repository search for the exact string `coldfirejvm` returned **zero repositories** on this date. This is not proof no private/local project exists. It is not safe to select a bytecode target, heap budget, networking API or VM-specific packaging without knowing what “coldfirejvm” means here.

## Proposed conversion contract

1. **Identify target:** ColdFire CPU/board, MMU status, OS/firmware, RAM/flash limits, the exact ColdFireJVM binary/source/version, supported class-file major version, class library profile (`java.net.ServerSocket`, `java.io`, charset, threads), invocation syntax and a small working hello-world JAR. Existing repo research in `docs/lantronix-uclinux-deep-dive-2026-10-08.md` distinguishes DSTni-FX ColdFire xPort Pro from DSTni-EX x86 devices; an xPort Pro serving *Java applets* from its web storage does **not** imply it executes them locally.
2. **Select licensed basis:** Prefer a minimal original Telnet/ASCII BBS designed for that exact VM or a version-pinned, reduced MPL-compliant fork of the Java project. Do not import proprietary Wildcat binaries/assets or assume archive listings grant derivative rights.
3. **Build on a host:** compile to the supported class-file version (`javac --release N` when supported, or an appropriate older compiler); assemble a JAR with `Main-Class`; inspect each `.class` version and JAR manifest. Reject reflection/JNI/native SQLite dependencies unless verified on target.
4. **Validate on target:** launch on ColdFire/µClinux or an accurate emulator with that VM, connect over a local Telnet client, exercise login/menu/post/read/disconnect, test concurrency and memory limits; persist data only to an approved writable path. Keep network bind loopback/private during testing and do not expose an unauthenticated vintage BBS publicly.

**Status:** research and compatibility plan, **not** a converted or validated ColdFire JAR. This sandbox has no installed `java`, `javac`, or identified `coldfirejvm`; building a generic fat JAR and claiming ColdFire support would be misleading.
