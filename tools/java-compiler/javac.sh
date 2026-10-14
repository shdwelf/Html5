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
JAVA_BIN="${JAVA:-}"
if [ -z "$JAVA_BIN" ] && [ -n "${JAVA_HOME:-}" ] && [ -x "$JAVA_HOME/bin/java" ]; then
  JAVA_BIN="$JAVA_HOME/bin/java"
fi
if [ -z "$JAVA_BIN" ]; then
  JAVA_BIN="$(command -v java || true)"
fi
if [ -z "$JAVA_BIN" ]; then
  JDK4PY_HOME="$(python3 -c 'import jdk4py; print(jdk4py.JAVA_HOME)' 2>/dev/null || true)"
  [ -z "$JDK4PY_HOME" ] || JAVA_BIN="$JDK4PY_HOME/bin/java"
fi
if [ -n "$JAVA_BIN" ] && [ ! -x "$JAVA_BIN" ]; then
  JAVA_BIN="$(command -v "$JAVA_BIN" || true)"
fi
ECJ="$HERE/ecj-4.4.jar"
RT="$HERE/.rt/rt.jar"
[ -x "$JAVA_BIN" ] || { echo "no Java runtime: set JAVA or JAVA_HOME, put java on PATH, or install jdk4py" >&2; exit 1; }
[ -f "$ECJ" ] || { echo "missing $ECJ" >&2; exit 1; }
[ -f "$RT" ]  || "$HERE/fetch-rtjar.sh"
exec "$JAVA_BIN" -jar "$ECJ" -bootclasspath "$RT" -source 1.7 -target 1.7 -encoding UTF-8 "$@"
