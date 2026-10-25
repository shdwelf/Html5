# GitHub JDK/JVM runtime research — OpenJVM, OpenJDK, OpenJRE, Sun, Oracle JDK, Zulu, Temurin

*Research date: 2026-10-23. Scope: find a Java toolchain that this sandbox
can actually obtain and run; separate that from source trees, installer
recipes, and browser JVM experiments that merely mention Java.*

## Executive conclusion

There are now **two proven local Java routes**, for two different jobs:

1. **Java Card / MealPlan simulator:** the Git-hosted **Azul Zulu OpenJDK
   8u362** tree in `MR-Adopt/MR-Adopt.github.io`. It supplies `javac`
   1.8.0_362, builds the Java Card CAP, and runs the simulator. On
   2026-10-23 the previously failing simulator suite passed **18/18** after
   the test file was wired to the existing `ensureBuilt()` preparation step.
   This is an old, unofficial mirror, so Round 19 pins its source commit and
   verifies the `release`, `java`, and `javac` hashes before execution.
2. **Modern Java / parser work:** the checksum-verified **Eclipse Temurin
   OpenJDK 21.0.12.1+1** relay already in `.relay/jdk/`. It reports
   `javac 21.0.12.1` and parses the six JavaCard samples with zero syntax
   errors. It cannot replace JDK 8 for the Java Card 3.0.3 converter, which
   needs `-source/-target 1.6`.

The preferred long-term upgrade is an **official current Temurin 8 relay**
through the same lawful GitHub Actions/relay route used for Temurin 21, not a
new random Git tree. Official Temurin release metadata is reachable here,
but the release bytes are not: GitHub redirects them to
`release-assets.githubusercontent.com`, and a tiny `.sha256.txt` download
probe failed with EOF on 2026-10-23.

No Sun-branded or Oracle JDK GitHub route found in this survey is a suitable
source. The useful results are packaging scripts, Docker recipes, or test
fixtures—not an official, complete, current Linux x64 JDK distribution.

## Method

The survey used four different searches because repository names alone are a
poor way to find a runtime:

1. GitHub **repository search** for `openjvm`, `openjdk`, `openjre`,
   `"sun jdk"`, `oraclejdk`, `"oracle jdk"`, `zulujdk`, `"zulu jdk"`, and
   `temurin`.
2. Targeted GitHub repository/release inspection for Adoptium, OpenJDK,
   Eclipse OpenJ9, Oracle GraalVM, and the National Security Agency's Ghidra.
3. GitHub **code search** for the `release` marker file every JDK/JRE image
   carries, filtered by implementor and, where possible,
   `OS_NAME="Linux"` + `OS_ARCH="amd64"`.
4. Local execution. A repository was not called a route merely because it
   contained a `release` file; it had to have the relevant executables and
   pass the repository's own Java workloads.

GitHub returned a search API rate-limit response during one broad code-search
batch. The counts below are therefore dated snapshots and discovery evidence,
not a claim that GitHub contains no other copies.

## Repository-search snapshot

| Query | Results on 2026-10-23 | Useful signal |
| --- | ---: | --- |
| `openjvm` | 3 | `pmietlicki/openjvm-wasm` is the only substantive runtime lead: OpenJDK 17 Zero compiled to WebAssembly. The other hits are a JVM study and an old empty/stale project. |
| `openjdk` | 4,335 | Official `openjdk/jdk`, `openjdk/jdk21u`, and `openjdk/jdk8u` source trees; Eclipse OpenJ9 is the main alternative JVM implementation. Source availability does not solve bootstrap/binary delivery in this sandbox. |
| `openjre` | 40 | Mostly Docker recipes. The top exact-name result, `Szahu/OpenJRE`, is an **Open Java Rendering Engine**, not a Java runtime. |
| `"sun jdk"` | 14 | Historical Puppet/JPackage/Debian packaging for Sun Java 5–7. No supportable current runtime. |
| `oraclejdk` | 186 | Dockerfiles and installer roles, often for JDK 7/8. |
| `"oracle jdk"` | 581 | Ansible/Vagrant/Docker automation and a Windows portable wrapper. No official Oracle JDK binary repository was identified. |
| `zulujdk` | 3 | Old Docker base-image projects. |
| `"zulu jdk"` | 29 | Docker/Ansible/version-manager wrappers. The actual usable Zulu tree was found by code search, not repository search. |
| `temurin` | 215 | Official Adoptium build scripts and per-version binary repositories are easy to identify and actively maintained. |

The important negative result is that **searching only repository names or
descriptions misses the one complete Git-hosted JDK 8 tree this project can
fetch**. That tree lives inside a research-project website repository whose
README is about metamorphic testing, not Java distributions.

## Official OpenJDK distributions on GitHub

### Eclipse Temurin — best official route, blocked only by asset delivery

Adoptium publishes separate binary repositories. The latest releases seen on
2026-10-23 were:

| Branch | Release | Linux x64 JDK asset | Linux x64 JRE asset |
| --- | --- | ---: | ---: |
| 8 | [`jdk8u504-b01`](https://github.com/adoptium/temurin8-binaries/releases/tag/jdk8u504-b01) | 103,542,511 bytes | 41,844,148 bytes |
| 21 | [`jdk-21.0.13+9`](https://github.com/adoptium/temurin21-binaries/releases/tag/jdk-21.0.13%2B9) | 207,858,352 bytes | 52,181,297 bytes |
| 25 | [`jdk-25.0.5+8`](https://github.com/adoptium/temurin25-binaries/releases/tag/jdk-25.0.5%2B8) | 141,341,188 bytes | 61,736,206 bytes |

For a normal workstation or GitHub Actions runner this is the obvious route:
official project, current security branch, checksums, and both JDK and JRE
images. In this sandbox `gh release view` can read the metadata, but
`gh release download` follows a signed redirect to
`release-assets.githubusercontent.com`, outside the reachable host set. The
failure was reproduced with only the Temurin 21 checksum file; it is not a
size problem.

The existing **Temurin 21.0.12.1+1 relay** remains valid and is one quarterly
update behind 21.0.13+9 at survey time. Reassembly on 2026-10-23 produced:

```text
/tmp/jdk21.tar.gz: OK
openjdk version "21.0.12.1" 2026-08-18 LTS
OpenJDK Runtime Environment Temurin-21.0.12.1+1 (build 21.0.12.1+1-LTS)
javac 21.0.12.1
JavacParser parsed 6/6 source file(s); 0 syntax error(s)
```

### OpenJDK source is necessary context, not a shortcut

`openjdk/jdk`, `openjdk/jdk21u`, and `openjdk/jdk8u` are active GPL-2.0
(with Classpath-exception) source repositories. Building a JDK from them
requires a bootstrap JDK and a substantial native toolchain. They are the
right provenance references for source-level questions—such as the
`JavacParser.java` work—but they do not give this sandbox a faster runnable
JDK than the Temurin relay or Zulu Git tree.

Eclipse OpenJ9 is a real alternative JVM for OpenJDK, and Eclipse OMR is its
runtime-component base. The `eclipse-openj9/openj9` GitHub release inspected
here (`openj9-0.62.0`) had no downloadable assets attached; complete Semeru
runtime delivery is a separate distribution problem. It is not a browser JVM
and does not help the Java Card converter's JDK-8 requirement.

### Oracle JDK, Sun JDK, and GraalVM

The survey found no official Oracle JDK binary distribution on GitHub:

- `oracle/docker-images` is official, but it is UPL-licensed configuration
  and examples; the Oracle software itself is supplied under Oracle's own
  download/licensing path.
- `oracle/graal` is the GraalVM source repository. Its old GitHub release
  page says releases have moved. GraalVM/native-image is an interesting AOT
  route for bounded Java programs, not a drop-in Java Card converter or a
  way to run arbitrary Ghidra JARs in a Webxdc.
- Exact Sun/Oracle repository searches overwhelmingly return obsolete
  installers for Java 5–8. Running an old Sun/Oracle binary copied into an
  unrelated GitHub repository would combine provenance, licensing, and
  security problems without improving on Zulu 8 or Temurin.

For this repository, **Oracle/Sun should remain a historical search term,
not a toolchain source**.

## What code search found in Git trees

A JDK/JRE image contains a root `release` file with fields such as
`IMPLEMENTOR`, `JAVA_VERSION`, `OS_NAME`, and `OS_ARCH`. Searching that file
is much more precise than searching for the word “JDK”.

| Code-search filter | Snapshot | Interpretation |
| --- | ---: | --- |
| Eclipse Adoptium, any OS | 391 hits | Many Windows JREs and application-bundled runtimes. |
| Azul Systems, any OS | 83 hits | Mostly bundled JREs. |
| Oracle Corporation, any OS | 166 hits | Bundled runtimes and benchmark trees; not an official distribution channel. |
| Sun Microsystems implementor | 0 hits | No Sun-branded image was found by this exact marker. |
| Azul + Linux + amd64 | 2 hits | The complete MR-Adopt Zulu 8 JDK and one mock-JDK test fixture. |
| Eclipse Adoptium + Linux + amd64 | 11 hits | Several JREs and one apparent Temurin JDK 8 tree. |
| Oracle + Linux + amd64 | 1 hit | A JVM test-data fixture, not a usable distribution. |

### Zulu 8 in MR-Adopt — complete and proven, but unofficial and old

The useful path is:

```text
MR-Adopt/MR-Adopt.github.io
  tool/software/zulu_jdks/zulu8.68.0.19-ca-jdk8.0.362-linux_x64/
```

Its `release` file says:

```text
IMPLEMENTOR="Azul Systems, Inc."
IMPLEMENTOR_VERSION="Zulu8.68.0.19-CA-linux64"
JAVA_VERSION="1.8.0_362"
OS_NAME="Linux"
OS_ARCH="amd64"
```

The repository is not an Azul distribution repository: at survey time it had
two stars, no detected license, and its latest commit was from 2024-09-09.
That makes commit pinning essential. Round 19 pins:

```text
MR-Adopt commit  7e7d2a8649fbc6d7c590a7e1de8dfaf4289fc04c
release SHA-256  2d22f9cd0f6763ba1ffc1e9a72da7a08a6a76fc90358c521a53b418611e9f86b
bin/java SHA-256 2618e30a65f22f2739179de39b8e06027718e544860b5672e1d7470bbce66fe7
bin/javac SHA-256
                 828c2ff27e0a0d6e17abae963ec7e23a4db5b874177ddedac5415780423a83a2
```

Local proving run:

```text
javac 1.8.0_362
INFO: conversion completed with 0 errors and 0 warnings.
CAP build/mealplan/.../mealplan.cap
tests/mealplan-applet-sim.test.mjs: 18 pass, 0 fail
```

8u362 is far behind Temurin's current 8u504 branch. It should be treated as
an isolated, local build/test compiler for trusted repository sources—not
bundled into an app, exposed to a network service, or used to process
untrusted code. Replacing it with an official Temurin 8 relay is the next
toolchain upgrade.

### The apparent Temurin 8u504 Git tree is incomplete

One Linux/amd64 code-search result pointed at
`DerKaiser2023/flans-mod-deutschland-edition/.buildtools/jdk8u504-b01/`.
Its `release` file is genuinely shaped like Temurin 8u504 and the tree has
431 files / about 205 MB. But the top level has **no `bin/` directory**, so
there is no `java` or `javac` to execute. It is a partial copied tree, not a
JDK route.

That negative result is why the acceptance test for any future candidate is:

1. `release` identifies the intended implementor/version/OS/arch;
2. `bin/java` and `bin/javac` exist and are executable;
3. the source repository commit is pinned;
4. executable hashes are recorded;
5. the repository's own workload runs, not merely `java -version`.

## Workload-specific decisions

| Workload | Decision after this survey |
| --- | --- |
| MealPlan Java Card CAP + simulator | Keep Zulu 8 for now, pinned and hash-checked. JDK 21/25 cannot emit the converter's required source/target 1.6 path. Plan an official Temurin 8 relay replacement. |
| JavaCard source parsing | Temurin 21 relay is proven. `JavacTask.parse()` is syntax-only; it is not a Java Card API type check. |
| cfjvm differential test | Both Zulu 8 and Temurin 21 now work. The Makefile explicitly emits Java 8/class-file 52, so a JDK 21 compiler no longer produces unsupported class-file 65 output. Both produced byte-identical 38-line reference output. |
| Ghidra | The JDK half is solved locally by Temurin 21, and CI workflows already use `actions/setup-java` with Temurin. The Ghidra distribution itself remains a separate 569,712,708-byte GitHub release asset for [Ghidra 12.2](https://github.com/NationalSecurityAgency/ghidra/releases/tag/Ghidra_12.2_build), so local sandbox delivery still needs CI/relay rather than a direct download. |
| Running arbitrary JARs | Temurin 21 is the first choice when the JAR's class-file/API level permits. The older PyPI `jdk4py` route remains useful only as a runtime-only fallback; it has no `javac`. |
| Browser/Webxdc Java | No production-ready drop-in was found. See the browser section below. |

## Browser JVM research: OpenJVM, OpenJRE, and adjacent projects

### `pmietlicki/openjvm-wasm`

This is the most interesting new lead. At commit
`03ec1f7c21ca9880661911617bf12e02069d8462`, it claims:

- OpenJDK 17 **Zero** compiled to WebAssembly with Emscripten;
- real Java execution in Node and the browser;
- a custom AWT/Swing toolkit rendering frames to `<canvas>`;
- JNLP/WebObjects support through a same-origin Node proxy;
- GPL-2.0-only with Classpath-exception for its original code.

It is not yet a Webxdc solution:

- no GitHub release was present at survey time;
- a fresh clone must perform a long OpenJDK/Emscripten build;
- the browser runtime needs a secure context plus **COOP/COEP** so
  `SharedArrayBuffer`/Wasm threads are available;
- networked Java applications need its Node proxy;
- the project had zero stars and is institution-specific around CAS and
  WebObjects, so its claims need an independent build/run before this
  repository relies on them.

A sensible next experiment is **not** to embed it in SoCal Subsurface. It is
to build it in CI, run one tiny local Swing-free class and one tiny Swing
class under Node, record artifact sizes and startup/memory, and only then
decide whether a separate local-JAR viewer is feasible.

### Other browser routes are not general OpenJDK substitutes

- **TeaVM** and **JWebAssembly** compile bounded Java bytecode ahead of time
  to JavaScript/WebAssembly/C. They can be excellent for a known applet or
  model, but they do not load arbitrary JARs with full JDK semantics.
- **DoppioJVM** is a browser JVM, but its repository's last push in this
  survey was 2022; it would need a fresh compatibility audit before any use.
- **CheerpJ** has a public meta repository and a much more complete product
  story, but runtime licensing/distribution is separate from that repository.
  It should not be treated as vendored open-source code.
- `Szahu/OpenJRE` is not a JRE at all; the acronym means Open Java Rendering
  Engine.

For an offline Webxdc, an AOT-compiled bounded Java model is more plausible
than carrying a general JVM. Arbitrary Ghidra, Java Card conversion, or
networked JNLP should stay on a native JDK/CI route.

## Changes made from this research

Round 19 turns the survey into repository behavior:

- `tools/build_mealplan_applet.sh` now fetches the Zulu, Feitian, and
  Objenesis inputs at pinned commits and verifies Zulu executables plus the
  Java Card API/tools and simulator JARs by SHA-256.
- `tests/mealplan-applet-sim.test.mjs` calls `ensureBuilt()` once. In a
  sandbox that can reach GitHub it now runs the real simulator; if the fetch
  is unavailable, only the card-backed cases skip with an explicit toolchain
  reason instead of producing 17 `bin/java ENOENT` failures.
- `jvm/Makefile` emits Java 8 bytecode for the cfjvm differential test, and
  `tests/cfjvm.test.mjs` finds the JDK in the same applet-toolchain cache
  the Makefile already searched.
- The JDK is **not** committed or bundled into any XDC. `.cache/`, `build/`,
  and `.relay/` remain ignored local/toolchain areas.

## Recommended next steps

1. **Relay official Temurin 8u504 and Temurin 21.0.13** through the existing
   checksum-recorded split-relay mechanism; then retire the MR-Adopt Zulu
   8u362 Git-tree route or keep it only as a documented fallback.
2. **Keep Ghidra on GitHub Actions** until a 12.2 distribution relay exists.
   Pin both Ghidra and Temurin versions in each workflow/report.
3. **Evaluate OpenJVM-Wasm in isolation** with a tiny class-file fixture.
   Record build time, Wasm/data sizes, COOP/COEP requirements, and whether
   it can run without its Node proxy. Do not couple that experiment to the
   subsurface XDCs.
4. **Do not chase Sun/Oracle GitHub mirrors.** If an Oracle-specific binary
   is ever required for compatibility evidence, acquire it through Oracle's
   own terms and record its exact version/hash; do not execute a random
   repository copy.
