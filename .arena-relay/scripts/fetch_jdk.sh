#!/usr/bin/env bash
set -euo pipefail
mkdir -p .relay/jdk
if [ ! -f .relay/jdk/jdk21.tar.gz.part-00 ]; then
  URL="https://api.adoptium.net/v3/binary/latest/21/ga/linux/x64/jdk/hotspot/normal/eclipse"
  curl -fL --retry 4 -o /tmp/jdk21.tar.gz "$URL"
  ls -la /tmp/jdk21.tar.gz
  sha256sum /tmp/jdk21.tar.gz | tee .relay/jdk/jdk21.sha256
  split -b 90M -d -a 2 /tmp/jdk21.tar.gz .relay/jdk/jdk21.tar.gz.part-
  rm -f /tmp/jdk21.tar.gz
fi
ls -la .relay/jdk
