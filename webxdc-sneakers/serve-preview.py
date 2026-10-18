#!/usr/bin/env python3
"""Serve the standalone Sneakers Webxdc shell with local WASM-friendly headers."""
from __future__ import annotations

import functools
import http.server
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent / "app"
PORT = int(os.environ.get("PORT", "4173"))


class PreviewHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self) -> None:
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        self.send_header("Cross-Origin-Resource-Policy", "same-origin")
        self.send_header("Cross-Origin-Isolation-Mode", "logical")
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt: str, *args: object) -> None:
        print(fmt % args)


if __name__ == "__main__":
    handler = functools.partial(PreviewHandler, directory=str(ROOT))
    server = http.server.ThreadingHTTPServer(("0.0.0.0", PORT), handler)
    print(f"Serving Sneakers Webxdc preview from {ROOT} on 0.0.0.0:{PORT}")
    server.serve_forever()
