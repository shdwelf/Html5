#!/bin/sh
# Runs every check. No build step, no dependencies for suites 01–04 and 06.
# Optional: npm i --no-save jsdom puppeteer-core @sparticuz/chromium
#   enables 05 (jsdom DOM boot) and 07 (headless Chromium + SwiftShader); both
#   skip themselves cleanly if their packages are absent.
set -u
cd "$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"

status=0
for t in tests/01-layout.mjs tests/02-lens-math.mjs tests/03-lens-draw.mjs tests/04-lens-3d.mjs; do
  echo "──────────────────────────────────────────────"
  node "$t" || status=1
done

echo "──────────────────────────────────────────────"
node --import ./tests/stubs/register.mjs tests/05-viewer-dom.mjs || status=1

echo "──────────────────────────────────────────────"
node tests/06-extreme.mjs || status=1

echo "──────────────────────────────────────────────"
node tests/07-browser.mjs "${KEYSPACE_URL:-http://127.0.0.1:8000/keyspace.html}" || status=1

echo "──────────────────────────────────────────────"
[ "$status" -eq 0 ] && echo "all suites passed" || echo "FAILURES — see above"
exit "$status"
