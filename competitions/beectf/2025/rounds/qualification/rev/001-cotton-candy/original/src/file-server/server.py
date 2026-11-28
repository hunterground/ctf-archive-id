#!/usr/bin/env python3
import argparse
import hmac
import io
import logging
import mimetypes
import os
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from datetime import datetime
from email.utils import formatdate

CHUNK_SIZE = 64 * 1024  # 64 KiB

class AuthFileHandler(BaseHTTPRequestHandler):
    expected_user = None
    expected_pass = None
    serve_path   = None
    download_route = "/download"

    def log_message(self, fmt, *args):
        logging.info("%s - - %s", self.address_string(), fmt % args)

    def _unauthorized(self, reason="Unauthorized"):
        self.send_response(401, "Unauthorized")
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        # Simple hint header (not real auth challenge; we’re using query params)
        self.end_headers()
        self.wfile.write(f"401 Unauthorized: {reason}\n".encode("utf-8"))

    def _not_found(self, reason="Not Found"):
        self.send_response(404, "Not Found")
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.end_headers()
        self.wfile.write(f"404 Not Found: {reason}\n".encode("utf-8"))

    def _bad_request(self, reason="Bad Request"):
        self.send_response(400, "Bad Request")
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.end_headers()
        self.wfile.write(f"400 Bad Request: {reason}\n".encode("utf-8"))

    def _ok_headers(self, ctype, size, filename):
        self.send_response(200, "OK")
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(size))
        self.send_header("Last-Modified", formatdate(os.path.getmtime(self.serve_path), usegmt=True))
        self.send_header("Date", formatdate(timeval=None, usegmt=True))
        self.send_header("Cache-Control", "no-store")
        # Force download
        self.send_header("Content-Disposition", f'attachment; filename="{filename}"')
        self.end_headers()

    def do_HEAD(self):
        self._handle_request(send_body=False)

    def do_GET(self):
        self._handle_request(send_body=True)

    def _handle_request(self, send_body: bool):
        parsed = urlparse(self.path)
        if parsed.path != self.download_route:
            return self._not_found("Use /download with ?user=...&pass=...")

        # Check the query parameters
        qs = parse_qs(parsed.query)
        user = qs.get("user", [None])[0]
        pwd  = qs.get("pass", [None])[0]

        if user is None or pwd is None:
            return self._unauthorized("Missing user/pass query parameters")

        # Constant-time compare to avoid timing leaks
        if not (hmac.compare_digest(user, self.expected_user) and
                hmac.compare_digest(pwd,  self.expected_pass)):
            return self._unauthorized("Invalid credentials")

        # Validate file
        if not self.serve_path or not os.path.isfile(self.serve_path):
            return self._not_found("Configured file not found")

        try:
            file_size = os.path.getsize(self.serve_path)
            filename = os.path.basename(self.serve_path)
            ctype = mimetypes.guess_type(filename)[0] or "application/octet-stream"

            # Send headers
            self._ok_headers(ctype, file_size, filename)

            if not send_body:
                return

            # Stream the file in chunks
            with open(self.serve_path, "rb") as f:
                # Use buffered writing; BaseHTTPRequestHandler.wfile is already buffered,
                # but chunking keeps memory usage predictable for large files.
                while True:
                    chunk = f.read(CHUNK_SIZE)
                    if not chunk:
                        break
                    self.wfile.write(chunk)

        except BrokenPipeError:
            # Client closed the connection mid-transfer; just log.
            logging.warning("Client closed connection during transfer.")
        except Exception as e:
            logging.exception("Error serving file: %s", e)
            # Avoid leaking details to client
            self._bad_request("Error while serving file")

def main():
    parser = argparse.ArgumentParser(description="Simple auth-gated file download server on port 6969.")
    parser.add_argument("--file", required=True, help="Path to the file to serve")
    parser.add_argument("--user", required=True, help="Expected username")
    parser.add_argument("--pass", dest="password", required=True, help="Expected password")
    parser.add_argument("--host", default="127.0.0.1", help="Bind address (default: 0.0.0.0)")
    parser.add_argument("--port", type=int, default=6969, help="Port to listen on (default: 6969)")
    args = parser.parse_args()

    # Normalize and validate file path
    serve_path = os.path.abspath(args.file)
    if not os.path.isfile(serve_path):
        raise SystemExit(f"File not found: {serve_path}")

    # Configure logging
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s")

    # Configure handler class variables
    AuthFileHandler.expected_user = args.user
    AuthFileHandler.expected_pass = args.password
    AuthFileHandler.serve_path = serve_path

    httpd = HTTPServer((args.host, args.port), AuthFileHandler)
    logging.info("Serving %s on http://%s:%d/download (use ?user=<u>&pass=<p>)",
                 serve_path, args.host, args.port)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        logging.info("Shutting down...")
        httpd.server_close()

if __name__ == "__main__":
    main()

