#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
ACE_C_DIR=${ACE_C_DIR:?Set ACE_C_DIR to a local clone of seb3773/ace-c}
BASE_COMMIT=6cc986fbecf65137bc4657039fba1eb227e2e446

if ! command -v git >/dev/null || ! command -v make >/dev/null || ! command -v cc >/dev/null || ! command -v python3 >/dev/null; then
  echo "required tools: git, make, cc, python3" >&2
  exit 2
fi
if ! git -C "$ACE_C_DIR" rev-parse --git-dir >/dev/null 2>&1; then
  echo "ACE_C_DIR must be a local git clone/worktree: $ACE_C_DIR" >&2
  exit 2
fi
actual=$(git -C "$ACE_C_DIR" rev-parse HEAD)
if [[ "$actual" != "$BASE_COMMIT" ]]; then
  echo "expected ace-c $BASE_COMMIT, got $actual" >&2
  exit 2
fi

WORK=$(mktemp -d "${TMPDIR:-/tmp}/ace-c-huffman-check.XXXXXX")
trap 'rm -rf "$WORK"' EXIT
ACE="$WORK/ace-c"
git clone --quiet --no-hardlinks "$ACE_C_DIR" "$ACE"
git -C "$ACE" apply --check "$ROOT/patches/ace-c-huffman-two-queue.patch"
git -C "$ACE" apply "$ROOT/patches/ace-c-huffman-two-queue.patch"
make -C "$ACE" linux
"$ACE/build/linux/test_core"

cc -std=c11 -O2 -Wall -Wextra -I"$ACE/include" \
  "$ROOT/patches/ace-c-huffman-roundtrip.c" \
  "$ACE/build/linux/huffman.o" "$ACE/build/linux/bitstream.o" \
  -o "$WORK/huffman-roundtrip"
"$WORK/huffman-roundtrip"

python3 - "$WORK/data" <<'PY'
from pathlib import Path
import random
import sys

root = Path(sys.argv[1])
root.mkdir(parents=True)
line = b"ACE compression lab: the quick brown fox jumps over the lazy dog.\n"
(root / "repeated.txt").write_bytes((line * ((135168 + len(line) - 1) // len(line)))[:135168])
(root / "pattern.bin").write_bytes((bytes(range(8)) * ((262144 + 7) // 8))[:262144])
rng = random.Random(0xACE2026)
(root / "random.bin").write_bytes(bytes(rng.randrange(256) for _ in range(65536)))
PY

check_archive() {
  local mode=$1
  local filename=$2
  local input="$WORK/data/$filename"
  local archive="$WORK/${mode#-}-$filename.ace"
  local extracted="$WORK/extract-${mode#-}-$filename"
  mkdir -p "$extracted"
  "$ACE/build/linux/ace" a "$archive" "$mode" "$input" >/dev/null
  "$ACE/build/linux/ace" t "$archive" >/dev/null
  "$ACE/build/linux/ace" x -d "$extracted" "$archive" >/dev/null
  cmp "$input" "$extracted/$filename"
  printf 'archive round-trip: %s %s OK (%s bytes)\n' \
    "$mode" "$filename" "$(wc -c < "$archive" | tr -d ' ')"
}

check_archive -z repeated.txt
check_archive -z pattern.bin
check_archive -z random.bin
check_archive -2 repeated.txt
check_archive -2 random.bin

echo "ACE Huffman patch checks passed."
