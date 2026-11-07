#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
ACE_C_DIR=${ACE_C_DIR:?Set ACE_C_DIR to a local clone of seb3773/ace-c}
BASE_COMMIT=6cc986fbecf65137bc4657039fba1eb227e2e446

for tool in git make cc python3; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "required tool not found: $tool" >&2
    exit 2
  fi
done
if ! git -C "$ACE_C_DIR" rev-parse --git-dir >/dev/null 2>&1; then
  echo "ACE_C_DIR must be a local git clone/worktree: $ACE_C_DIR" >&2
  exit 2
fi
if ! git -C "$ACE_C_DIR" cat-file -e "$BASE_COMMIT^{commit}" 2>/dev/null; then
  echo "ACE_C_DIR does not contain required commit $BASE_COMMIT" >&2
  exit 2
fi

WORK=$(mktemp -d "${TMPDIR:-/tmp}/ace-c-distance-history.XXXXXX")
trap 'rm -rf "$WORK"' EXIT
ACE="$WORK/ace-c"
git clone --quiet --no-hardlinks "$ACE_C_DIR" "$ACE"
git -C "$ACE" checkout --quiet --detach "$BASE_COMMIT"

make -s -C "$ACE" linux
ACE_BIN="$ACE/build/linux/ace"

python3 - "$WORK/data" <<'PY'
from pathlib import Path
import sys

root = Path(sys.argv[1])
root.mkdir(parents=True)
# A deterministic varying-offset pattern. The automatic blocked-mode detector
# selects DELTA for these inputs; subsequent DELTA runs exercise the persistent
# four-entry LZ77 repeat-distance history across mode switches.
for period, step in ((7, 1), (13, 3), (64, 7)):
    n = 131072
    data = bytes(((i % period) + (i // period) * step) & 0xff for i in range(n))
    (root / f"period-{period}-step-{step}.bin").write_bytes(data)
PY

expect_crc_failure() {
  local label=$1
  local archive=$2
  local log="$WORK/${label}.log"
  if "$ACE_BIN" t "$archive" >"$log" 2>&1; then
    echo "$label: expected the known baseline CRC failure, but ace t passed" >&2
    exit 1
  fi
  if ! grep -Fq 'crc mismatch' "$log"; then
    echo "$label: expected a CRC mismatch; got:" >&2
    cat "$log" >&2
    exit 1
  fi
  printf '%s: reproduced CRC mismatch\n' "$label"
}

make_archive() {
  local mode=$1
  local label=$2
  local input=$3
  local archive="$WORK/${label}.ace"
  "$ACE_BIN" a "$archive" "$mode" "$input" >/dev/null
  printf '%s' "$archive"
}

# Control: the same fixture succeeds in the legacy LZ77 (-z) method.
INPUT="$WORK/data/period-7-step-1.bin"
Z_ARCHIVE=$(make_archive -z baseline-z "$INPUT")
"$ACE_BIN" t "$Z_ARCHIVE" >/dev/null
Z_EXTRACT="$WORK/z-extract"
mkdir -p "$Z_EXTRACT"
"$ACE_BIN" x -d "$Z_EXTRACT" "$Z_ARCHIVE" >/dev/null
cmp "$INPUT" "$Z_EXTRACT/period-7-step-1.bin"
echo 'baseline -z control: integrity and extraction passed'

# Confirm this is independent of the two-queue Huffman change: both the
# unmodified encoder and Huffman-only patched encoder fail the same -2 case.
BASE_ARCHIVE=$(make_archive -2 baseline-2 "$INPUT")
expect_crc_failure baseline "$BASE_ARCHIVE"
git -C "$ACE" apply --check "$ROOT/patches/ace-c-huffman-two-queue.patch"
git -C "$ACE" apply "$ROOT/patches/ace-c-huffman-two-queue.patch"
make -s -C "$ACE" linux
HUF_ARCHIVE=$(make_archive -2 huffman-only-2 "$INPUT")
expect_crc_failure huffman-only "$HUF_ARCHIVE"

# The separate fix keeps the compressor's four-entry repeat-distance history
# in sync with the decoder across each blocked-mode/typecode transition.
git -C "$ACE" apply --check "$ROOT/patches/ace-c-lz77-distance-history.patch"
git -C "$ACE" apply "$ROOT/patches/ace-c-lz77-distance-history.patch"
make -s -C "$ACE" linux
"$ACE/build/linux/test_core"

for input in "$WORK"/data/*.bin; do
  name=$(basename "$input")
  archive="$WORK/fixed-${name%.bin}.ace"
  extracted="$WORK/fixed-${name%.bin}"
  mkdir -p "$extracted"
  "$ACE_BIN" a "$archive" -2 "$input" >/dev/null
  "$ACE_BIN" t "$archive"
  "$ACE_BIN" x -d "$extracted" "$archive" >/dev/null
  cmp "$input" "$extracted/$name"
  printf 'fixed -2 round-trip: %s OK\n' "$name"
done

echo 'ACE distance-history regression checks passed.'
