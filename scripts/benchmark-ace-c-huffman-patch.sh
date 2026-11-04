#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
ACE_C_DIR=${ACE_C_DIR:?Set ACE_C_DIR to a local clone of seb3773/ace-c}
BASE_COMMIT=6cc986fbecf65137bc4657039fba1eb227e2e446
BENCH_LOOPS=${BENCH_LOOPS:-2500}
BENCH_RUNS=${BENCH_RUNS:-5}

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
if ! [[ "$BENCH_LOOPS" =~ ^[1-9][0-9]*$ && "$BENCH_RUNS" =~ ^[1-9][0-9]*$ ]]; then
  echo "BENCH_LOOPS and BENCH_RUNS must be positive integers" >&2
  exit 2
fi

WORK=$(mktemp -d "${TMPDIR:-/tmp}/ace-c-huffman-bench.XXXXXX")
trap 'rm -rf "$WORK"' EXIT

for variant in baseline patched; do
  tree="$WORK/$variant"
  git clone --quiet --no-hardlinks "$ACE_C_DIR" "$tree"
  if [[ "$variant" == patched ]]; then
    git -C "$tree" apply --check "$ROOT/patches/ace-c-huffman-two-queue.patch"
    git -C "$tree" apply "$ROOT/patches/ace-c-huffman-two-queue.patch"
  fi
  make -C "$tree" linux >/dev/null
  cc -std=c11 -O2 -Wall -Wextra -I"$tree/include" \
    "$ROOT/patches/ace-c-huffman-benchmark.c" \
    "$tree/build/linux/huffman.o" "$tree/build/linux/bitstream.o" \
    -o "$WORK/$variant-benchmark"
done

for variant in baseline patched; do
  times="$WORK/$variant-times.txt"
  : > "$times"
  echo "$variant ($BENCH_RUNS runs × $BENCH_LOOPS builder calls):"
  for ((run = 1; run <= BENCH_RUNS; run++)); do
    output=$("$WORK/$variant-benchmark" "$BENCH_LOOPS")
    echo "  $output"
    seconds=$(sed -n 's/.*seconds=\([0-9.]*\).*/\1/p' <<<"$output")
    [[ -n "$seconds" ]] || { echo "could not parse benchmark output" >&2; exit 1; }
    echo "$seconds" >> "$times"
  done
done

python3 - "$WORK/baseline-times.txt" "$WORK/patched-times.txt" <<'PY'
import statistics
import sys
from pathlib import Path

base = [float(v) for v in Path(sys.argv[1]).read_text().split()]
patched = [float(v) for v in Path(sys.argv[2]).read_text().split()]
base_median = statistics.median(base)
patched_median = statistics.median(patched)
print(f"median: baseline={base_median:.6f}s patched={patched_median:.6f}s")
if patched_median:
    print(f"observed speedup: {base_median / patched_median:.2f}x")
print("Microbenchmark only; no performance threshold is enforced.")
PY
