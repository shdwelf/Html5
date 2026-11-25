#!/usr/bin/env bash
# Run from apps/html5-offline-launcher after the emulator is ready.
# Keep loss-prevention checks ahead of the independent DOS-game stress test.
set -u
mkdir -p app/build
: > app/build/android-webview-tests.log
adb logcat -c || true
adb logcat -v threadtime > app/build/android-webview-logcat.log 2>&1 &
logcat_pid=$!
finish() {
  kill "$logcat_pid" 2>/dev/null || true
  wait "$logcat_pid" 2>/dev/null || true
  cat app/build/android-webview-tests.log
}
trap finish EXIT

# A smaller, explicit emulator display avoids wasting software-renderer memory
# on a 1440p phone skin; this does not alter the packaged apps or test assertions.
timeout --kill-after=3s 10s adb shell wm size 720x1280 || exit "$?"
timeout --kill-after=3s 10s adb shell wm density 280 || exit "$?"
status=0
host_evidence() {
  # Synthetic CI host only: process names/resource counters, never command-line
  # arguments, environment values, owner files or a full kernel log.
  local label="$1" kernel
  {
    printf '\n=== %s failed: host/device resources before emulator teardown ===\n' "$label"
    free -m || true
    df -h . || true
    ps -eo pid,ppid,rss,vsz,comm | awk 'NR == 1 || $5 ~ /qemu|emulator|java/' || true
    for name in memory.max memory.current memory.events; do
      if [[ -r "/sys/fs/cgroup/$name" ]]; then printf '%s: ' "$name"; cat "/sys/fs/cgroup/$name"; fi
    done
    timeout --kill-after=1s 5s adb get-state || true
    kernel="$(mktemp app/build/.android-host-kernel.XXXXXX)" || return
    if timeout --kill-after=1s 5s sudo -n dmesg --ctime > "$kernel" 2>&1; then
      grep -Ei 'out of memory|oom-kill|killed process|qemu|emulator|segfault' "$kernel" | tail -n 24 || true
    else
      tail -n 3 "$kernel"
    fi
    rm -f "$kernel"
  } >> app/build/android-webview-host.log 2>&1
}
run_tests() {
  local label="$1" limit="$2" task="$3" test_class="$4" code=0 flavor=public
  if [[ "$task" == *Network* ]]; then flavor=network; fi
  # Reports from an earlier invocation must not be counted as this one's run.
  rm -rf "app/build/outputs/androidTest-results/connected/debug/flavors/$flavor"
  printf '\n=== %s ===\n' "$label" >> app/build/android-webview-tests.log
  # APKs are already compiled. Do not reserve a build-sized 2-GiB Gradle heap
  # alongside the Android guest and its WASM/WebView workload.
  timeout --kill-after=10s "$limit" ./gradlew --no-daemon --max-workers=1 \
    '-Dorg.gradle.jvmargs=-Xmx1024m -Dfile.encoding=UTF-8' --stacktrace "$task" \
    "-Pandroid.testInstrumentationRunnerArguments.class=$test_class" \
    -Pandroid.testInstrumentationRunnerArguments.timeout_msec=120000 \
    >> app/build/android-webview-tests.log 2>&1 || code=$?
  printf '=== %s exit=%s ===\n' "$label" "$code" >> app/build/android-webview-tests.log
  if [[ -d "app/build/outputs/androidTest-results/connected/debug/flavors/$flavor" ]]; then
    mkdir -p "app/build/instrumentation-reports/$label"
    cp -R "app/build/outputs/androidTest-results/connected/debug/flavors/$flavor/." "app/build/instrumentation-reports/$label/"
  fi
  if [[ "$code" != 0 ]]; then status=1; host_evidence "$label"; fi
}
run_tests public-local-files 3m :app:connectedPublicDebugAndroidTest org.arena.html5launcher.LocalFileExportSmokeTest
run_tests network-local-files 3m :app:connectedNetworkDebugAndroidTest org.arena.html5launcher.LocalFileExportSmokeTest
run_tests public-openpgp-recovery 3m :app:connectedPublicDebugAndroidTest org.arena.html5launcher.RecoveryWebViewSmokeTest
run_tests public-audio-policy 2m :app:connectedPublicDebugAndroidTest 'org.arena.html5launcher.OfflineWebViewSmokeTest#microphoneCaptureWorksOnlyForAncOriginAndAudioResource'
run_tests public-headline-harry 2m :app:connectedPublicDebugAndroidTest 'org.arena.html5launcher.OfflineWebViewSmokeTest#headlineHarryStartControlBootsBundledDosProgramInAndroidWebView'
exit "$status"
