#!/usr/bin/env python3
"""Static file server with simple live-reload stamp endpoint."""

from __future__ import annotations

import argparse
import json
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse


WATCH_EXTENSIONS = {".html", ".css", ".js", ".mjs", ".json"}
IGNORE_DIRS = {"node_modules", ".git", "__pycache__"}


def latest_stamp(root: Path) -> int:
    newest = 0
    for current_root, dirs, files in os.walk(root):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        for filename in files:
            path = Path(current_root) / filename
            if path.suffix.lower() not in WATCH_EXTENSIONS:
                continue
            try:
                mtime_ns = path.stat().st_mtime_ns
            except OSError:
                continue
            if mtime_ns > newest:
                newest = mtime_ns
    return newest


class LiveReloadHandler(SimpleHTTPRequestHandler):
    def do_GET(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        if parsed.path == "/__reload__":
            stamp = latest_stamp(Path.cwd())
            payload = json.dumps({"stamp": stamp}).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return
        super().do_GET()


def main() -> None:
    parser = argparse.ArgumentParser(description="Run local static dev server with live reload.")
    parser.add_argument("--port", type=int, default=5500, help="Port to listen on (default: 5500)")
    args = parser.parse_args()

    host = "127.0.0.1"
    with ThreadingHTTPServer((host, args.port), LiveReloadHandler) as httpd:
        print(f"Serving on http://{host}:{args.port}")
        httpd.serve_forever()


if __name__ == "__main__":
    main()
