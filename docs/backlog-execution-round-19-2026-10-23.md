# Backlog execution round 19 — 23 Oct 2026

*Nineteenth round: “Continue backlog; search GitHub for OpenJVM, OpenJDK,
OpenJRE, Sun, OracleJDK, ZuluJDK and Temurin; finish the inlined subsurface
XDC; and continue researching.” Index:
[`agent-backlog-2026-10-21.md`](agent-backlog-2026-10-21.md).
Rounds: [1](backlog-execution-round-1-2026-10-21.md) ·
[2](backlog-execution-round-2-2026-10-21.md) · [3](backlog-execution-round-3-2026-10-21.md) ·
[4](backlog-execution-round-4-2026-10-21.md) · [5](backlog-execution-round-5-2026-10-21.md) ·
[6](backlog-execution-round-6-2026-10-21.md) · [7](backlog-execution-round-7-2026-10-21.md) ·
[8](backlog-execution-round-8-2026-10-21.md) · [9](backlog-execution-round-9-2026-10-21.md) ·
[10](backlog-execution-round-10-2026-10-21.md) · [11](backlog-execution-round-11-2026-10-21.md) ·
[12](backlog-execution-round-12-2026-10-21.md) · [13](backlog-execution-round-13-2026-10-22.md) ·
[14](backlog-execution-round-14-2026-10-22.md) · [15](backlog-execution-round-15-2026-10-22.md) ·
[16](backlog-execution-round-16-2026-10-22.md) · [17](backlog-execution-round-17-2026-10-22.md) ·
[18](backlog-execution-round-18-2026-10-22.md).*

## Scoping decisions

- **Search beyond repository names.** The useful JDK evidence is in release
  metadata and in the `release` marker file inside copied JDK trees.
  Repository descriptions mostly return Dockerfiles, installer roles, and
  source projects.
- **Do not execute a random JDK just because GitHub can deliver it.** The
  one complete Linux x64 JDK-8 Git tree found here is an unofficial Zulu copy.
  It is now pinned to an exact commit and its executables are hash-checked.
  Sun/Oracle-branded copies remain rejected as toolchain sources.
- **Official Temurin is the preferred distribution.** The sandbox can read
  Adoptium release metadata but cannot fetch assets from
  `release-assets.githubusercontent.com`; the supported route is therefore
  the existing checksum-recorded relay/CI channel, not a new mirror.
- **The inlined subsurface deliverable is SoCal Subsurface.** It is the
  flagship subsurface theater and previously had only the canonical 26-file
  XDC. Round 19 adds a CASEFILES-style single-file edition rather than
  replacing the debuggable multi-file package.
- **OpenJVM-Wasm is research, not an embedded dependency.** It needs a long
  OpenJDK/Emscripten build, COOP/COEP, and a Node proxy for networked apps;
  none of that belongs inside the offline subsurface XDC without a separate
  proof run.
- **S7 remains externally blocked.** A working JDK narrows the blocker; it
  does not create a `gina.dll`, board teardown, or proprietary drivers.

## Delivered

| Artifact | Result |
| --- | --- |
| [`github-jdk-runtime-research-2026-10-23.md`](github-jdk-runtime-research-2026-10-23.md) | Dated GitHub repository/code/release survey for OpenJVM, OpenJDK, OpenJRE, Sun, Oracle JDK, Zulu, and Temurin; official-release reachability probe; incomplete-tree negative result; workload decisions for Java Card, cfjvm, Ghidra, arbitrary JARs, and browser/Webxdc Java. |
| [`../tools/build_mealplan_applet.sh`](../tools/build_mealplan_applet.sh) | MR-Adopt Zulu, Feitian AppletPlayground, and Objenesis inputs are fetched at pinned commits. Zulu `release`/`java`/`javac`, Java Card API/tools, and `vjcre.jar` are SHA-256-verified before execution. |
| [`../tests/mealplan-applet-sim.test.mjs`](../tests/mealplan-applet-sim.test.mjs) | Calls the existing `ensureBuilt()` once. With GitHub reachable it fetches/builds the pinned toolchain and runs the real simulator; offline, the 17 card-backed cases skip explicitly instead of failing as `bin/java ENOENT`. |
| [`../jvm/Makefile`](../jvm/Makefile) and [`../tests/cfjvm.test.mjs`](../tests/cfjvm.test.mjs) | The differential Smoke class is always emitted as Java 8/class-file 52, and the test finder now sees the applet-toolchain cache. Zulu 8 and Temurin 21 both produce the same byte-identical 38-line reference. |
| [`../scripts/build-socal-subsurface-inlined.mjs`](../scripts/build-socal-subsurface-inlined.mjs) | Reproducible esbuild inliner with `--check`, optional-DEM build-time handling, archive round-trip verification, vendor notices, deterministic timestamps, and staged public app tree. |
| [`../socal-subsurface-inlined.html`](../socal-subsurface-inlined.html) | 863,145-byte standalone SoCal document: inline CSS, inline Webxdc simulator shim, one bundled ESM script, no local CSS/JS asset references. |
| [`../socal-subsurface-inlined.xdc`](../socal-subsurface-inlined.xdc) | 389,401-byte, six-entry Webxdc: inlined `index.html`, manifest, icon, host-owned `webxdc.js`, and Three.js/fflate licenses. SHA-256 `3879a948ee3e82b91d424e7f69a59613a3e48526191d346188e55251c0e8b936` at build time. |
| Tests and package wiring | `tests/webxdc-packages.test.mjs` gains archive/single-file and builder-currency tests; the SoCal browser smoke now includes both inlined routes when Puppeteer is available; `npm run build:socal-subsurface` rebuilds canonical + inlined editions and `build:4dwm` includes the inlined packager. |
| Docs/backlog/Wiki | SoCal, Feitian, README, backlog MD/JSON, and Wiki archive updated. The Feitian note no longer says the applet has never run in a simulator. |

## JDK findings worth keeping

1. **Repository search is the wrong first tool for copied runtimes.** The
   only complete Git-hosted JDK 8 found by this survey was discovered by the
   `release` marker file, inside a repository whose stated subject is
   metamorphic testing.
2. **A `release` file is not a JDK.** A Temurin 8u504-shaped tree with 431
   files had no `bin/java` or `bin/javac`. Candidate acceptance requires
   executables, a pinned commit, hashes, and a real workload.
3. **Official metadata and official bytes have different reachability.**
   Adoptium's latest Temurin 8/21/25 releases are discoverable through the
   GitHub API, but their assets redirect to a host this sandbox cannot use.
   That is a delivery problem, not evidence that Temurin is unavailable in
   CI or on a workstation.
4. **JDK version is part of the evidence.** Temurin 21 is the right modern
   parser/Ghidra companion; Java Card conversion still needs JDK 8; cfjvm
   needs class-file 52 even when the compiler is JDK 21. “Install the newest
   JDK” would have broken two of the three workloads.
5. **The old 17 failures were a wiring bug plus an environment gate.**
   `run_mealplan_sim.mjs` already knew how to fetch and build its toolchain,
   but the test file never called `ensureBuilt()`. Once wired and pinned,
   the simulator suite is green in this sandbox.
6. **Browser Java is not one thing.** OpenJVM-Wasm attempts a real OpenJDK
   port; TeaVM/JWebAssembly compile bounded bytecode; CheerpJ is a product
   runtime with separate distribution terms. None should be described as a
   generic offline “JDK for Webxdc” without a workload-specific proof.

## Inlined SoCal contract

- Canonical `socal-subsurface.xdc` remains the 26-entry, source-shaped
  package and the Planet compatibility filename still mirrors it byte for
  byte.
- `socal-subsurface-inlined.html` is generated, never hand-edited. It
  contains the document, CSS, all 19 bundled JS inputs, data packs, GPX/BagIt
  code, Three.js/OrbitControls/fflate, and full vendor license notices.
- The inlined XDC differs from the standalone file only at the Webxdc bridge:
  the standalone embeds the simulator shim; the archive index loads
  `./webxdc.js`, which the host replaces at runtime.
- No optional DEM was present at build time. The builder bundled its explicit
  null-DEM stub, so the checked-in inlined edition still uses the documented
  synthetic relief field and makes no runtime request for
  `socal-dem-grid.js`.
- The archive test compares standalone and staged documents after that one
  bridge substitution, verifies the exact six-entry set, and runs the
  builder in `--check` mode when esbuild is installed.

## Test tally at round-19 close

| Suite | Result |
| --- | --- |
| Temurin 21 relay + JavaCard parser | PASS — checksum OK; `java`/`javac 21.0.12.1`; 6/6 sources parsed, 0 syntax errors |
| `tools/build_mealplan_applet.sh --sim` | PASS — pinned Zulu 8u362 + Feitian kit; CAP conversion 0 errors/0 warnings; simulator harness built |
| Targeted Webxdc/browser + MealPlan + cfjvm Node tests | 74 PASS, 1 skipped (optional Puppeteer/Chromium absent) |
| `npm run build:socal-subsurface-inlined` / `--check` | PASS — standalone HTML, six-entry XDC, and staged tree current |
| `npm run build:wikiinajar` | PASS — 214 Markdown files converted to Wiki pages; `wikiinajar.xdc` rebuilt |
| Full `vitest run` | 35 files, 307/307 PASS |
| Full `node --test tests/*.test.mjs` | 722 tests: 712 pass, 10 skipped, 0 fail in this sandbox after the JDK toolchain was populated and Wiki was rebuilt |

## Next

- Relay official Temurin 8u504 and 21.0.13 with recorded hashes; retire or
  demote the unofficial Zulu 8u362 Git-tree route after the replacement passes
  the same CAP/simulator workload.
- Evaluate OpenJVM-Wasm in CI with one tiny non-network class before any
  browser/Webxdc claim.
- Keep Ghidra 12.2 on the existing GitHub Actions/Temurin route until a
  distribution relay is deliberately staged.
- Continue S4 remaining states in dated GNIS source-register batches; S6
  still needs lawfully redistributable historical snapshots; S7 remains
  blocked on the binary/teardown/driver artifacts themselves.
