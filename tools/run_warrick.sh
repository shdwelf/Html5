#!/bin/bash
# run_warrick.sh - Execute Warrick website reconstruction tool with satisfied dependencies
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PERL5_DIR="${HOME}/perl5"

export PERL5LIB="$SCRIPT_DIR/warrick:$PERL5_DIR/lib/perl5:$PERL5_DIR/lib/perl5/x86_64-linux-gnu-thread-multi"

exec perl "$SCRIPT_DIR/warrick/warrick.pl" "$@"
