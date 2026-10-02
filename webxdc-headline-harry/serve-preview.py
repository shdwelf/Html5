#!/usr/bin/env python3
"""Static preview server for the webxdc app, with cross-origin-isolation
headers (COOP/COEP) like the repo's webxdc-dos vite config used, plus CORP so
COEP: require-corp accepts the local resources. All paths are same-origin."""
import http.server, functools, os

os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), "app"))

class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        self.send_header("Cross-Origin-Resource-Policy", "cross-origin")
        self.send_header("Cross-Origin-Isolation-Mode", "logical")
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        pass

http.server.ThreadingHTTPServer(("0.0.0.0", 8080), H).serve_forever()
