#!/usr/bin/env bash
# javac.sh — a working Java compiler for this sandbox.
#
# The bundled runtime (jdk4py Temurin 25) is a JRE: it has the java.compiler API
# module but the jdk.compiler implementation is stripped ("Module jdk.compiler
# not in boot Layer"), and there is no javac/jar/javap launcher. So we compile
# with ECJ (Eclipse Compiler for Java), which is pure Java and runs ON the JRE.
# ECJ 3.10 predates Java 9 modules, so it needs a classic bootclasspath: a Java 7
# rt.jar. Output is Java 7 bytecode (v51), which runs fine on the Java 25 JRE.
#
# Usage:  javac.sh -d OUTDIR [-cp CLASSPATH] FILE.java [FILE.java ...]
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JAVA="$(python3 -c 'import jdk4py; print(jdk4py.JAVA_HOME)' 2>/dev/null)/bin/java"
ECJ="$HERE/ecj-4.4.jar"
RT="$HERE/.rt/rt.jar"
[ -x "$JAVA" ] || { echo "no jdk4py java" >&2; exit 1; }
[ -f "$ECJ" ] || { echo "missing $ECJ" >&2; exit 1; }
[ -f "$RT" ]  || "$HERE/fetch-rtjar.sh"
exec "$JAVA" -jar "$ECJ" -bootclasspath "$RT" -source 1.7 -target 1.7 -encoding UTF-8 "$@"
