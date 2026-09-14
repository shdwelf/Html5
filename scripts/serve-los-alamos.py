"""Dependency-free preview; existing SITE-K entry point remains untouched."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os

os.chdir(Path(__file__).resolve().parent.parent)

class ArchiveHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(302)
            self.send_header('Location', '/los-alamos.html')
            self.end_headers()
        else:
            super().do_GET()

if __name__ == '__main__':
    print('Project Y archive available on port 5173', flush=True)
    ThreadingHTTPServer(('0.0.0.0', 5173), ArchiveHandler).serve_forever()
