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
run_tests() {
  local label="$1" limit="$2" task="$3" test_class="$4" code=0
  printf '\n=== %s ===\n' "$label" >> app/build/android-webview-tests.log
  timeout --kill-after=10s "$limit" ./gradlew --no-daemon --stacktrace "$task" \
    "-Pandroid.testInstrumentationRunnerArguments.class=$test_class" \
    -Pandroid.testInstrumentationRunnerArguments.timeout_msec=120000 \
    >> app/build/android-webview-tests.log 2>&1 || code=$?
  printf '=== %s exit=%s ===\n' "$label" "$code" >> app/build/android-webview-tests.log
  if [[ -d app/build/outputs/androidTest-results ]]; then
    mkdir -p "app/build/instrumentation-reports/$label"
    cp -R app/build/outputs/androidTest-results/. "app/build/instrumentation-reports/$label/"
  fi
  if [[ "$code" != 0 ]]; then status=1; fi
}
run_tests public-local-files 3m :app:connectedPublicDebugAndroidTest org.arena.html5launcher.LocalFileExportSmokeTest
run_tests network-local-files 3m :app:connectedNetworkDebugAndroidTest org.arena.html5launcher.LocalFileExportSmokeTest
run_tests public-audio-policy 2m :app:connectedPublicDebugAndroidTest 'org.arena.html5launcher.OfflineWebViewSmokeTest#microphoneCaptureWorksOnlyForAncOriginAndAudioResource'
run_tests public-headline-harry 2m :app:connectedPublicDebugAndroidTest 'org.arena.html5launcher.OfflineWebViewSmokeTest#headlineHarryStartControlBootsBundledDosProgramInAndroidWebView'
exit "$status"
