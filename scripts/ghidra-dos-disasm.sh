#!/usr/bin/env bash
# Ghidra headless harness for the DOS abandonware targets.
#
# The sandbox this repo's agents run in has NO obtainable JVM and cannot reach
# archive.org/myabandonware or the GitHub release-asset CDN, so this script is
# meant to run on a machine that has Ghidra + a JDK. It imports a 16-bit DOS
# .COM/.EXE, runs the auto-analysis, then runs ghidra_dos_summary.py to survey
# the binary and flag O(n^2) array sorts for replacement.
#
#   scripts/ghidra-dos-disasm.sh /path/to/ShadowPresident/SP.COM
#   GHIDRA_HOME=/opt/ghidra scripts/ghidra-dos-disasm.sh *.EXE
#
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "usage: $0 <dos-binary> [more-binaries...]" >&2
  exit 2
fi

GHIDRA_HOME="${GHIDRA_HOME:-/opt/ghidra}"
HEADLESS="${GHIDRA_HOME}/support/analyzeHeadless"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJ_DIR="${GHIDRA_PROJ_DIR:-${SCRIPT_DIR}/../.ghidra-proj}"
REPORT_DIR="${GHIDRA_REPORT_DIR:-${SCRIPT_DIR}/../docs/ghidra}"

if [[ ! -x "$HEADLESS" ]]; then
  echo "error: analyzeHeadless not found at $HEADLESS" >&2
  echo "set GHIDRA_HOME to your Ghidra install (needs a JDK 21+)." >&2
  exit 3
fi

mkdir -p "$PROJ_DIR" "$REPORT_DIR"

for bin in "$@"; do
  [[ -f "$bin" ]] || { echo "skip (not a file): $bin" >&2; continue; }
  base="$(basename "$bin")"
  echo "==> $base"
  GHIDRA_REPORT_DIR="$REPORT_DIR" "$HEADLESS" \
    "$PROJ_DIR" "dos_${base//[^A-Za-z0-9]/_}" \
    -import "$bin" \
    -processor x86:LE:16:default \
    -scriptPath "$SCRIPT_DIR" \
    -postScript ghidra_dos_summary.py \
    -overwrite \
    -deleteProject
  echo "    report: ${REPORT_DIR}/ghidra-report-${base}.md"
done

echo "done. reports in ${REPORT_DIR}"
