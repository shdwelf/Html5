# Java compiler toolchain (ECJ on a JRE)

The default sandbox JVM (`jdk4py`, Temurin 25) is a **JRE**: it exposes the
`java.compiler` API but has no `jdk.compiler` implementation or `javac`/`jar`/
`javap` launchers. Direct Adoptium downloads are blocked in this environment.
An optional Temurin 21 JDK is now relayed as ignored split files in `.relay/jdk/`;
its checksum, reassembly, and the applet parser check are documented in
[`docs/UEFI_OPENBIOS_JAVAC.md`](../../docs/UEFI_OPENBIOS_JAVAC.md). The compiler
wrapper remains independent of that JDK and uses **ECJ — the Eclipse Compiler
for Java**, which is pure Java and runs on a JRE.

## Pieces (both fetched via `codeload.github.com`, which is reachable; `raw.githubusercontent.com` is not)

- `ecj-4.4.jar` — ECJ 3.10.0 (Eclipse 4.4), committed at `github.com/marcust/ecj4ant` (`lib/ecj-4.4.jar`).
- `.rt/rt.jar` — OpenJDK 7 `rt.jar`, committed at `github.com/emabrey/openjdk7-rt`. ECJ 3.10 predates
  Java 9 modules and cannot read the modular `lib/modules` jimage, so it needs a classic
  bootclasspath. `.rt/` is gitignored (58 MB); run `./fetch-rtjar.sh` to populate it.

## Use

```
./javac.sh -d out [-cp classpath] Foo.java ...
```

`javac.sh` resolves its Java runtime in this order: explicit `JAVA`, `JAVA_HOME`,
`java` on `PATH`, then `jdk4py`. It invokes `java -jar ecj-4.4.jar -bootclasspath
.rt/rt.jar -source 1.7 -target 1.7`. A JDK is not required for ECJ itself; if one
is available, it can be selected with `JAVA_HOME=/path/to/jdk ./javac.sh ...`.
The compiler emits Java 7 bytecode (class file v51), which runs on the Java 25
JRE. Verified: compiles + runs a class end-to-end, and compiles against an
external jar via `-cp` (e.g. WikiInAJar's `wiki.in.a.jar`).

## Limits

- Source/target 1.7 (ECJ 3.10 tops out at Java 8; no lambdas/`var`/records).
- Compile only — there is still no Java *decompiler* here, so editing an existing
  `.class` (e.g. WikiInAJar's `RenderEngine`) needs the original `.java` source.
