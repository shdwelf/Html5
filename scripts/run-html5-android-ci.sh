#!/usr/bin/env bash
# Preserve the command's exit status while exposing bounded public/synthetic CI
# build errors through the Checks API when raw runner logs are inaccessible.
# Do not use this wrapper for owner material, recipient inputs or private APKs.
set -uo pipefail
if [[ $# -lt 3 || "$2" != -- ]]; then
  echo 'usage: run-html5-android-ci.sh <build-log> -- <command> [args...]' >&2
  exit 2
fi
log="$1"
shift 2
mkdir -p "$(dirname "$log")" || exit "$?"
"$@" > "$log" 2>&1
status=$?
if [[ "$status" == 0 ]]; then
  tail -n 16 "$log"
else
  python3 - "$log" "$status" <<'PY'
import re
import sys
from pathlib import Path
path, status = Path(sys.argv[1]), sys.argv[2]
with path.open('rb') as stream:
    stream.seek(max(0, path.stat().st_size - 2 * 1024 * 1024))
    lines = stream.read(2 * 1024 * 1024).decode('utf-8', errors='replace').splitlines()
pattern = re.compile(r'(?i)(what went wrong|execution failed|caused by:|could not|cannot |exception|error:|outofmemory|no space left|daemon.*disappear|failed to|failure:)')
hits = [i for i, line in enumerate(lines) if pattern.search(line)]
selected = {}
for i in list(dict.fromkeys(hits[:6] + hits[-3:])):
    for j in range(max(0, i - 1), min(len(lines), i + 7)):
        selected[j] = lines[j]
if selected:
    detail = '\n'.join(selected[i] for i in sorted(selected))
else:
    detail = '\n'.join(lines[-60:]) or '(command produced no log output)'
if len(detail) > 10000:
    detail = detail[:5000] + '\n[bounded middle omitted]\n' + detail[-4500:]
message = f'{path.name}: command exited {status}\n{detail}'
for number, start in enumerate(range(0, len(message), 2800), start=1):
    safe = message[start:start + 2800].replace('%', '%25').replace('\r', '%0D').replace('\n', '%0A')
    print(f'::error title=Android-build-{number}::{safe}')
PY
fi
exit "$status"
