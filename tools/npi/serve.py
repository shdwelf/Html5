#!/usr/bin/env python3
"""
serve.py — tiny static server for the NPI//SEARCH app.

  python3 tools/npi/serve.py [--port 8080] [--root <repo root>]

Serves the repository root. `data/npi/*` gets long cache headers (the index
is content-addressed by meta.generated, so stale caches self-heal on rebuild).
Binds 0.0.0.0 for the sandbox live preview.
"""

import argparse
import http.server
import os
import socketserver
import sys
from urllib.parse import unquote

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_ROOT = os.path.dirname(os.path.dirname(HERE))  # repo root


class H(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".br": "application/octet-stream",
        ".bin": "application/octet-stream",
        ".html": "text/html; charset=utf-8",
        ".js": "text/javascript; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".json": "application/json; charset=utf-8",
        ".parquet": "application/octet-stream",
    }

    def end_headers(self):
        path = unquote(self.path.split("?", 1)[0])
        if path.startswith("/data/npi/"):
            self.send_header("Cache-Control", "public, max-age=604800")
        else:
            self.send_header("Cache-Control", "no-cache")
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

    def do_GET(self):
        # landing: / -> the app
        if self.path in ("/", "/index.html") and self._app_exists():
            self.path = "/npi-search.html"
        return super().do_GET()

    def _app_exists(self):
        return os.path.exists(os.path.join(self.directory, "npi-search.html"))

    def log_message(self, fmt, *args):
        sys.stderr.write("· " + (fmt % args) + "\n")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=8080)
    ap.add_argument("--root", default=DEFAULT_ROOT)
    args = ap.parse_args()

    os.chdir(args.root)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer(("0.0.0.0", args.port), H) as srv:
        print(f"serving {args.root} on http://0.0.0.0:{args.port}  (app: /npi-search.html)")
        try:
            srv.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
