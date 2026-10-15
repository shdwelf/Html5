#!/usr/bin/env python3
"""Bounded loopback HTTP smoke for a rebuilt Wiki-in-a-Jar 0.8 installation.

Run only against a trusted/rebuilt package. This is not a sandbox or an auth audit.
The old server binds a wildcard socket but defaults to rejecting non-loopback
connections. This check refuses an installation configured for remote access,
issues GET requests only, and always terminates its short-lived JVM fixture.
"""
from pathlib import Path
import argparse
import http.client
import json
import os
import shutil
import socket
import subprocess
import time
import xml.etree.ElementTree as ET


def java_binary():
    root = Path(__file__).resolve().parents[3]
    home = os.environ.get('JAVA_HOME')
    if home:
        return str(Path(home) / 'bin/java')
    choices = sorted((root / '.relay/jdk/extracted').glob('*/bin/java'))
    return str(choices[0]) if choices else shutil.which('java')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--app', required=True, type=Path)
    parser.add_argument('--java', default=java_binary())
    parser.add_argument('--report', type=Path)
    args = parser.parse_args()
    app = args.app.resolve()
    if not args.java or not (app / 'wiki.in.a.jar').is_file() or not (app / 'public').is_dir():
        parser.error('A Java runtime and an extracted installation (JAR + public/) are required')
    config = app / 'public/config'
    if config.exists():
        values = {e.attrib.get('key'): e.text for e in ET.parse(config).getroot().findall('entry')}
        if values.get('only.allow.local.connections', 'yes') != 'yes':
            parser.error('Refusing an installation configured to allow remote connections')
    with socket.socket() as reservation:
        reservation.bind(('127.0.0.1', 0))
        port = reservation.getsockname()[1]
    env = {k: os.environ[k] for k in ('PATH', 'LANG', 'JAVA_HOME') if k in os.environ}
    child = subprocess.Popen([args.java, '-Djava.awt.headless=true', '-jar', 'wiki.in.a.jar', str(port)],
                             cwd=app, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    observations = []

    def get(url):
        client = http.client.HTTPConnection('127.0.0.1', port, timeout=3)
        try:
            client.request('GET', url)
            response = client.getresponse()
            body = response.read()
            result = {'path': url, 'status': response.status,
                      'contentType': response.getheader('Content-Type'), 'bytes': len(body)}
            observations.append(result)
            return result, body
        finally:
            client.close()

    try:
        # Bounded fixture readiness, not a persistent dev server or watcher.
        deadline = time.monotonic() + 8
        while True:
            if child.poll() is not None:
                raise RuntimeError('Legacy JVM exited: ' + child.stdout.read().decode(errors='replace')[-2000:])
            try:
                # A bare connect-and-close probe can kill the 2008 accept loop.
                # Use a complete HTTP request for readiness instead.
                result, body = get('/wiki/show/Image%20Support%20Demo')
                break
            except ConnectionRefusedError:
                if time.monotonic() >= deadline:
                    raise TimeoutError('Legacy fixture did not start')
                time.sleep(.05)
        assert result['status'] == 200, result
        assert b'data-djvu-src=' in body and b'/image/show/demo.png' in body, 'Rendered image/DjVu markup missing'
        for url, mime in [
            ('/image/show/demo.png', 'image/png'),
            ('/image/show/djvu-smoke.djvu', 'image/vnd.djvu'),
            ('/public/skins/default/wikiinajar-djvu-viewer.js', 'javascript'),
            ('/public/skins/default/djvu-rs/scalar/djvu_rs_bg.wasm', 'application/wasm')
        ]:
            result, body = get(url)
            assert result['status'] == 200 and mime in result['contentType'] and body, result
        for url in ['/image/show/../wiki/Main%20Page.wiki',
                    '/image/show/%2e%2e/wiki/Main%20Page.wiki',
                    '/public/skins/../../wiki.in.a.jar',
                    '/image/show/missing.svg']:
            result, _ = get(url)
            assert result['status'] == 404, result
    finally:
        child.terminate()
        try:
            output, _ = child.communicate(timeout=3)
        except subprocess.TimeoutExpired:
            child.kill()
            output, _ = child.communicate(timeout=3)
    report = {'format': 'wikiinajar-legacy-http-smoke', 'version': 1,
              'engine': 'XRays/NanoHTTPD, not ACME', 'defaultOnlyLocalConnections': True,
              'serverStopped': child.poll() is not None, 'requests': observations,
              'limits': 'GET-only smoke on a trusted package; no auth, range, browser, or Internet-security certification.'}
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print('Legacy 0.8 HTTP smoke passed:', len(observations), 'requests; JVM fixture stopped.')


if __name__ == '__main__':
    main()
