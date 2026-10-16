#!/usr/bin/env bash
# Static inspection only. A C-like decompiler listing is not a compilable C++ port.
set -euo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
APP="${1:-$ROOT/dist/wiki/more.wiki.in.a.jar}"
OUTPUT="$ROOT/build/wiki-jvm-inspection"
mkdir -p "$OUTPUT"
JAVAP_BIN="$(cd "$ROOT" && node --input-type=module -e "import {javaTool} from './tools/wiki-workspace/deps.mjs'; console.log(javaTool('javap'))")"
"$JAVAP_BIN" -classpath "$APP" -c -p -s -verbose org.html5.wiki.WikiServer > "$OUTPUT/WikiServer.javap.txt"
python3 - "$APP" "$OUTPUT" <<'PY'
from pathlib import Path
import sys, zipfile
with zipfile.ZipFile(sys.argv[1]) as archive:
    data = archive.read('org/html5/wiki/WikiServer.class')
    (Path(sys.argv[2]) / 'WikiServer.class').write_bytes(data)
PY
printf 'JVM class and javap disassembly: %s\n' "$OUTPUT"
if [[ -z "${GHIDRA_HOME:-}" ]]; then
  printf '%s\n' 'Ghidra not run: set GHIDRA_HOME to a desktop/headless Ghidra installation and rerun.'
  exit 0
fi
if [[ ! -x "$GHIDRA_HOME/support/analyzeHeadless" ]]; then
  echo 'GHIDRA_HOME does not contain support/analyzeHeadless' >&2
  exit 2
fi
mkdir -p "$OUTPUT/projects" "$OUTPUT/ghidra"
"$GHIDRA_HOME/support/analyzeHeadless" "$OUTPUT/projects" "WikiJvm-$$" \
  -import "$OUTPUT/WikiServer.class" \
  -scriptPath "$ROOT/tools/ghidra_scripts" \
  -postScript GenericProgramReport.java "$OUTPUT/ghidra" \
  -deleteProject
printf '%s\n' 'Review Ghidra reports as static analysis. No Java-to-C++ translation or native-code equivalence is implied.'
