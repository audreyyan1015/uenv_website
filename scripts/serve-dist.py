#!/usr/bin/env python3
"""Static file server for the built UEnv website (dist/).

Compared to ``python3 -m http.server`` this adds the three things the docs
site needs to feel fast on a slow link:

- gzip compression for text payloads when the client accepts it
- ``If-Modified-Since`` handling so revalidation answers ``304`` instead of
  re-sending multi-MB assets
- explicit ``Cache-Control``: long-lived for the vendor runtime, short for
  app assets, ``no-cache`` for HTML so content updates show up immediately

Usage: python3 scripts/serve-dist.py [--port 8000] [--directory dist]
"""

from __future__ import annotations

import argparse
import email.utils
import gzip
import http.server
import io
import os
import time

GZIP_TYPES = (
    "text/html",
    "text/css",
    "text/javascript",
    "application/javascript",
    "application/json",
    "image/svg+xml",
    "text/markdown",
)
GZIP_MIN_SIZE = 1024
VENDOR_CACHE = "public, max-age=604800"  # 7 days: fingerprinted runtime drops
ASSET_CACHE = "public, max-age=3600"  # 1 hour: app.js / styles.css / images
HTML_CACHE = "no-cache"  # always revalidate; cheap once 304 works


class Handler(http.server.SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, format, *args):  # noqa: A002 - stdlib signature
        line = format % args
        if " 304 " in line or " 200 " in line:
            super().log_message(format, *args)

    def cache_policy(self):
        path = self.path.split("?", 1)[0]
        if "/vendor/" in path:
            return VENDOR_CACHE
        if path.endswith((".html", ".htm")) or path.endswith("/"):
            return HTML_CACHE
        return ASSET_CACHE

    def not_modified_since(self, filepath):
        try:
            ims = self.headers.get("If-Modified-Since")
            if not ims:
                return False
            since = email.utils.parsedate_to_datetime(ims)
            modified = os.path.getmtime(filepath)
            return modified <= since.timestamp()
        except (TypeError, ValueError, OSError):
            return False

    def send_head(self):  # noqa: C901 - mirrors stdlib control flow
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            for index in ("index.html", "index.htm"):
                candidate = os.path.join(path, index)
                if os.path.isfile(candidate):
                    path = candidate
                    break
            else:
                return super().send_head()
        if not os.path.isfile(path):
            return super().send_head()

        if self.not_modified_since(path):
            self.send_response(304)
            self.send_header("Cache-Control", self.cache_policy())
            self.send_header("Date", self.date_time_string())
            self.end_headers()
            return None

        size = os.path.getsize(path)
        content_type = self.guess_type(path)
        accepts_gzip = "gzip" in self.headers.get("Accept-Encoding", "")
        use_gzip = accepts_gzip and size >= GZIP_MIN_SIZE and content_type in GZIP_TYPES

        if use_gzip:
            with open(path, "rb") as source:
                body = gzip.compress(source.read(), compresslevel=6)
            fileobj = io.BytesIO(body)
            length = len(body)
        else:
            fileobj = open(path, "rb")  # noqa: SIM115 - closed by stdlib caller
            length = size

        self.send_response(200)
        self.send_header("Content-type", content_type)
        self.send_header("Content-Length", str(length))
        self.send_header("Last-Modified", self.date_time_string(os.path.getmtime(path)))
        self.send_header("Cache-Control", self.cache_policy())
        if use_gzip:
            self.send_header("Content-Encoding", "gzip")
            self.send_header("Vary", "Accept-Encoding")
        self.end_headers()
        return fileobj


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--directory", default="dist")
    parser.add_argument("--bind", default="0.0.0.0")
    args = parser.parse_args()

    os.chdir(args.directory)
    server = http.server.ThreadingHTTPServer((args.bind, args.port), Handler)
    print(f"serving {os.getcwd()} on {args.bind}:{args.port} at {time.ctime()}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
