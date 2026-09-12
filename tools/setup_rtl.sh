#!/bin/sh
# setup_rtl.sh — install the RTL verification toolchain, then verify the tree.
#
# Everything here is user-space (no root): the Yosys used by tools/verify_rtl.py
# is the yowasp WebAssembly build from PyPI, so it needs no system packages.
# It installs into ~/.local/bin, which is not always on PATH and, in some
# sandboxes, is not part of the persisted workspace - so this script can be
# re-run at any time to restore the toolchain.
#
#   sh tools/setup_rtl.sh          # install, then run the full verification
#   sh tools/setup_rtl.sh --quick  # install, then skip the SAT proofs
set -e

cd "$(dirname "$0")/.."

need() { command -v "$1" >/dev/null 2>&1; }

if ! need yosys && ! need yowasp-yosys && [ ! -x "$HOME/.local/bin/yowasp-yosys" ]; then
  echo "installing yowasp-yosys (user install; no root needed)"
  python3 -m pip install --user --break-system-packages yowasp-yosys
fi

PATH="$HOME/.local/bin:$PATH"
export PATH

echo "yosys : $(command -v yosys || command -v yowasp-yosys)"
echo "g++   : $(command -v g++)"
echo "node  : $(command -v node)"
echo

exec python3 tools/verify_rtl.py "$@"
