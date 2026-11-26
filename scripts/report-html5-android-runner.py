#!/usr/bin/env python3
"""Bounded runner-level diagnostics for synthetic Android CI (no device access).

AGP sometimes writes an empty testcase <failure/> while placing the real
instrumentation/process failure in suite system-err or logcat. Diagnostic mode
never confirms success. --require-complete rejects absent/partial/skipped phase
results even when Gradle or a device runner reports exit zero.
"""
import json
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

MAX_BYTES = 2 * 1024 * 1024
MAX_REPORTS = 24
MAX_ANNOTATIONS = 12
CHUNK = 2800
CRITICAL = re.compile(
    r"(?i)(fatal signal|fatal exception|abort message|sigabrt|sigsegv|anr in|"
    r"input dispatching timed out|testtimedoutexception|timeoutexception|"
    r"instrumentation_(?:result|failed|code)|process crashed|test run failed|"
    r"process .* has died|(?:lowmemorykiller|lmkd).*(?:killed|killing|oom)|monitoringinstr.*(?:error|fail)|"
    r"device .{0,80}not found|AdbCommandRejectedException|DeviceOfflineException|"
    r"runner finished with|test instrumentation process crashed)"
)
STAGES = re.compile(r"Html5GestureSmoke|Html5LocalFileSmoke|Html5RecoverySmoke|Html5CiPhase|TestRunner.*(?:started:|failed:|finished:)")


def tail(path):
    if path.is_symlink() or not path.is_file():
        return ""
    with path.open("rb") as stream:
        size = path.stat().st_size
        stream.seek(max(0, size - MAX_BYTES))
        data = stream.read(MAX_BYTES)
    return data.decode("utf-8", errors="replace")


def collect(base):
    base = Path(base).resolve()
    evidence = []
    for path in sorted((base / "instrumentation-reports").glob("**/*.xml"))[:MAX_REPORTS]:
        if path.is_symlink() or not path.resolve().is_relative_to(base) or path.stat().st_size > MAX_BYTES:
            continue
        try:
            root = ET.fromstring(path.read_bytes())
        except (OSError, ET.ParseError):
            continue
        # Keep primary AND suppressed cleanup failures. A short first-failure
        # annotation or a suite tail can otherwise report only the finalizer.
        for case in list(root.iter("testcase"))[:32]:
            for failure in (list(case.findall("failure")) + list(case.findall("error")))[:2]:
                detail = " ".join(list(failure.attrib.values()) + list(failure.itertext())).strip()
                if not detail:
                    continue
                if len(detail) > CHUNK - 400:
                    detail = detail[:1100] + "\n[bounded middle omitted]\n" + detail[-1100:]
                label = case.get("classname", "") + "." + case.get("name", "")
                evidence.append(("Android-runner-testcase", label[:180] + "\n" + detail))
        # Include suite-level output, not only children of a testcase. Preserve
        # the beginning (often the actual process death) as well as the tail.
        outputs = [" ".join(node.itertext()).strip() for node in root.iter()
                   if node.tag in ("system-err", "system-out")]
        text = "\n".join(output for output in outputs if output)
        if text:
            if len(text) > CHUNK - 200:
                text = text[:1200] + "\n[bounded middle omitted]\n" + text[-1200:]
            evidence.append(("Android-runner-XML", str(path.relative_to(base)) + "\n" + text))
    for name in ("android-webview-tests.log", "android-webview-logcat.log"):
        lines = tail(base / name).splitlines()
        hits = [i for i, line in enumerate(lines) if CRITICAL.search(line)]
        # Keep early and late failures, not only the final Gradle stack tail.
        chosen = list(dict.fromkeys(hits[:2] + hits[-4:]))
        for i in chosen:
            evidence.append(("Android-runner-process", name + "\n" + "\n".join(lines[max(0, i - 2):i + 8])[:CHUNK - 100]))
        local = [line for line in lines if "Html5LocalFileSmoke" in line]
        if local:
            failed = [i for i, line in enumerate(local) if "failed during" in line or "cleanup failure" in line]
            indices = sorted({j for i in failed[:2] for j in range(max(0, i - 6), min(len(local), i + 3))})
            context = [local[i] for i in indices] if indices else local[-12:]
            evidence.append(("Android-runner-stages", name + " [local-file milestones]\n" + "\n".join(context)[:CHUNK - 150]))
        recovery = [line for line in lines if "Html5RecoverySmoke" in line]
        if recovery:
            evidence.append(("Android-runner-stages", name + " [recovery milestones]\n" + "\n".join(recovery[-16:])[-CHUNK + 100:]))
        stages = [line for line in lines if STAGES.search(line)]
        if stages:
            evidence.append(("Android-runner-stages", name + "\n" + "\n".join(stages[-24:])[-CHUNK + 100:]))
    # Reserve room for suite-level causes AND last gesture phases before noisy
    # repeated process messages can use the annotation budget.
    cases = [item for item in evidence if item[0] == "Android-runner-testcase"]
    xml = [item for item in evidence if item[0] == "Android-runner-XML"]
    stages = [item for item in evidence if item[0] == "Android-runner-stages"]
    processes = [item for item in evidence if item[0] == "Android-runner-process"]
    host = tail(base / "android-webview-host.log")
    if len(host) > 2600:
        host = host[:1200] + "\n[bounded middle omitted]\n" + host[-1200:]
    hosts = [("Android-runner-host", host)] if host else []
    return (cases[:4] + xml[:4] + stages + hosts + processes + xml[4:])[:MAX_ANNOTATIONS]


EXPECTED = {"public-local-files": 6, "network-local-files": 6,
            "public-openpgp-recovery": 3, "public-audio-policy": 1, "public-headline-harry": 1}


def incomplete(summary):
    """A zero Gradle exit without all 17 actual results must never turn green."""
    if not isinstance(summary, dict) or type(summary.get("schema")) is not int or summary["schema"] != 1:
        return ["Missing or unsupported Android WebView result schema."]
    phases = summary.get("phases")
    if not isinstance(phases, list) or len(phases) != len(EXPECTED):
        return ["Exactly five Android WebView result phases are required."]
    seen, errors = set(), []
    for phase in phases:
        if not isinstance(phase, dict) or not isinstance(phase.get("phase"), str):
            return ["Malformed Android WebView result phase."]
        label = phase["phase"]
        if label not in EXPECTED or label in seen:
            return ["Unknown or duplicate Android WebView result phase."]
        seen.add(label)
        required = {"exit": 0, "tests": EXPECTED[label], "passed": EXPECTED[label], "failed": 0, "skipped": 0}
        if any(type(phase.get(key)) is not int or phase[key] != value for key, value in required.items()):
            errors.append(label + ": require complete passing results with zero failures/skips and exit zero.")
    return errors


def annotation(title, text):
    text = text[:CHUNK].replace("%", "%25").replace("\r", "%0D").replace("\n", "%0A")
    return f"::error title={title}::{text}"


def main():
    if len(sys.argv) == 3 and sys.argv[1] == "--require-complete":
        try:
            path = Path(sys.argv[2])
            if path.is_symlink() or path.stat().st_size > 65536:
                raise ValueError("unsupported summary")
            errors = incomplete(json.loads(path.read_text(encoding="utf-8")))
        except (OSError, ValueError):
            errors = ["Android WebView summary missing, oversized or malformed; no passing result confirmed."]
        for error in errors:
            print(annotation("Android-WebView-incomplete", error))
        if not errors:
            print("All five Android WebView phases: 17 passed, zero failed/skipped, all exits zero.")
        return 1 if errors else 0
    if len(sys.argv) != 2:
        raise SystemExit("usage: report-html5-android-runner.py <synthetic app/build directory> | --require-complete <summary.json>")
    evidence = collect(sys.argv[1])
    for title, text in evidence:
        print(annotation(title, text))
    if not evidence:
        print(annotation("Android-runner-evidence", "No bounded runner-level evidence found; this does not establish success or a root cause."))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
