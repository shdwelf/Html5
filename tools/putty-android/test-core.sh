#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="$ROOT/build/putty-android/core-tests"
mkdir -p "$OUT"
javac --release 17 -d "$OUT" \
    "$ROOT/apps/putty-android/app/src/main/java/org/html5/putty/SessionConfig.java" \
    "$ROOT/apps/putty-android/app/src/main/java/org/html5/putty/PlainTerminal.java" \
    "$ROOT/tools/putty-android/CoreTest.java"
java -cp "$OUT" org.html5.putty.CoreTest
