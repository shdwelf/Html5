# Java compiler toolchain (ECJ on a JRE)

The sandbox JVM (`jdk4py`, Temurin 25) is a **JRE**: it exposes the `java.compiler`
API module but the `jdk.compiler` implementation is stripped, and there is no
`javac`/`jar`/`javap` launcher. `java Hello.java` (source-file mode) fails with
`Module jdk.compiler not in boot Layer`. A full 64-bit JDK is not obtainable here
(Adoptium/GitHub release assets are on the blocked `objects.githubusercontent.com`;
the PyPI `jdk`/`zulu` packages are unrelated; `install-jdk` pulls from the blocked
Adoptium CDN; the one committed JDK found, `OpenIndex/openjdk-linux-x86`, is 32-bit
`i686` and this host has no 32-bit loader).

So we compile with **ECJ — the Eclipse Compiler for Java**, which is pure Java and
runs *on* the JRE.

## Pieces (both fetched via `codeload.github.com`, which is reachable; `raw.githubusercontent.com` is not)

- `ecj-4.4.jar` — ECJ 3.10.0 (Eclipse 4.4), committed at `github.com/marcust/ecj4ant` (`lib/ecj-4.4.jar`).
- `.rt/rt.jar` — OpenJDK 7 `rt.jar`, committed at `github.com/emabrey/openjdk7-rt`. ECJ 3.10 predates
  Java 9 modules and cannot read the modular `lib/modules` jimage, so it needs a classic
  bootclasspath. `.rt/` is gitignored (58 MB); run `./fetch-rtjar.sh` to populate it.

## Use

```
./javac.sh -d out [-cp classpath] Foo.java ...
```

`javac.sh` invokes `java -jar ecj-4.4.jar -bootclasspath .rt/rt.jar -source 1.7
-target 1.7`. It emits Java 7 bytecode (class file v51), which the Java 25 JRE runs.
Verified: compiles + runs a class end-to-end, and compiles against an external jar
via `-cp` (e.g. WikiInAJar's `wiki.in.a.jar`).

## Limits

- Source/target 1.7 (ECJ 3.10 tops out at Java 8; no lambdas/`var`/records).
- Compile only — there is still no Java *decompiler* here, so editing an existing
  `.class` (e.g. WikiInAJar's `RenderEngine`) needs the original `.java` source.
