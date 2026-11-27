#!/usr/bin/env python3
"""Publish bounded test counts/failures from disposable CI XML, never logcat.

Only for the synthetic ZShaolin instrumentation suite on the disposable emulator.
The production app keeps its command output private; this reads test XML only.
"""
import json
import os
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
RESULTS = ROOT/'apps/zshaolin-android/app/build/outputs/androidTest-results/connected'


def summarize(path):
    if path.stat().st_size > 2 * 1024 * 1024:
        raise ValueError('Test XML exceeds bound')
    suite = ET.parse(path).getroot()
    failures = []
    for case in suite.iter('testcase'):
        for tag in ('failure', 'error'):
            for error in case.findall(tag):
                if len(failures) >= 5:
                    break
                text = error.attrib.get('message') or error.text or ''
                failures.append({'test': case.attrib.get('name', '')[:120],
                                 'type': tag, 'message': text[:2000]})
    return {'suite': suite.attrib.get('name', '')[:160],
            'tests': int(suite.attrib.get('tests', 0)),
            'failures': int(suite.attrib.get('failures', 0)),
            'errors': int(suite.attrib.get('errors', 0)), 'failureDetails': failures}


def main():
    if os.environ.get('GITHUB_ACTIONS') != 'true':
        raise ValueError('Only publish synthetic disposable-CI test output')
    paths = sorted(RESULTS.rglob('TEST-*.xml'))[:10]
    if not paths:
        print('::notice title=ZShaolin synthetic test results::No instrumentation XML exists; no runtime pass is inferred.')
    for path in paths:
        report = summarize(path)
        details = report.pop('failureDetails')
        print('::notice title=ZShaolin synthetic test counts::' + json.dumps(report, separators=(',', ':')))
        for detail in details:
            message = json.dumps(detail, ensure_ascii=True, separators=(',', ':')).replace('%', '%25')
            print('::error title=ZShaolin synthetic test failure::' + message)


if __name__ == '__main__':
    main()
