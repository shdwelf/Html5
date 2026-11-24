#!/usr/bin/env python3
"""Bounded runner-level diagnostics for synthetic Android CI (no device access).

AGP sometimes writes an empty testcase <failure/> while placing the real
instrumentation/process failure in suite system-err or logcat. Never interpret
that absence, partial test counts, or this reporter's exit code as test success.
"""
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
    r"process .* has died|lowmemorykiller|lmkd.*kill|monitoringinstr.*(?:error|fail)|"
    r"runner finished with|test instrumentation process crashed)"
)
STAGES = re.compile(r"Html5GestureSmoke|Html5LocalFileSmoke|Html5CiPhase|TestRunner.*(?:started:|failed:|finished:)")


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
        stages = [line for line in lines if STAGES.search(line)]
        if stages:
            evidence.append(("Android-runner-stages", name + "\n" + "\n".join(stages[-24:])[-CHUNK + 100:]))
    # Reserve room for suite-level causes AND last gesture phases before noisy
    # repeated process messages can use the annotation budget.
    xml = [item for item in evidence if item[0] == "Android-runner-XML"]
    stages = [item for item in evidence if item[0] == "Android-runner-stages"]
    processes = [item for item in evidence if item[0] == "Android-runner-process"]
    return (xml[:4] + stages + processes + xml[4:])[:MAX_ANNOTATIONS]


def annotation(title, text):
    text = text[:CHUNK].replace("%", "%25").replace("\r", "%0D").replace("\n", "%0A")
    return f"::error title={title}::{text}"


def main():
    if len(sys.argv) != 2:
        raise SystemExit("usage: report-html5-android-runner.py <synthetic app/build directory>")
    evidence = collect(sys.argv[1])
    for title, text in evidence:
        print(annotation(title, text))
    if not evidence:
        print(annotation("Android-runner-evidence", "No bounded runner-level evidence found; this does not establish success or a root cause."))


if __name__ == "__main__":
    main()
