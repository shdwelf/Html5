#!/usr/bin/env node
/**
 * serve.mjs — tiny static server for the SITE-K / Ghidra lab.
 *
 *   node tools/serve.mjs [port]        # default 8080, binds 0.0.0.0
 *
 * Why not `python3 -m http.server`: this one sets `application/wasm` so the
 * emscripten runtime can use instantiateStreaming, adds the COOP/COEP pair that
 * some wasm builds want, and never caches during development.
 */

import { createServer } from "node:http";
import { createReadStream, statSync, existsSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const PORT = Number(process.argv[2] || process.env.PORT || 8080);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".wasm": "application/wasm",
  ".bin": "application/octet-stream",
  ".com": "application/octet-stream",
  ".exe": "application/octet-stream",
  ".xdc": "application/octet-stream",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".toml": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".rss": "application/rss+xml; charset=utf-8",
  ".sla": "application/octet-stream",
  ".pspec": "text/xml; charset=utf-8",
  ".cspec": "text/xml; charset=utf-8",
};

const server = createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  let path = decodeURIComponent(url.pathname);
  if (path.endsWith("/")) path += "index.html";
  const target = join(ROOT, normalize(path).replace(/^(\.\.[/\\])+/, ""));

  if (!target.startsWith(ROOT) || !existsSync(target) || statSync(target).isDirectory()) {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("404");
    return;
  }

  const headers = {
    "content-type": TYPES[extname(target).toLowerCase()] || "application/octet-stream",
    "cache-control": "no-store",
    // Harmless for this app, and required by some wasm toolchains.
    "cross-origin-opener-policy": "same-origin",
    "cross-origin-embedder-policy": "require-corp",
    "cross-origin-resource-policy": "cross-origin",
  };
  res.writeHead(200, headers);
  createReadStream(target).pipe(res);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`SITE-K + Ghidra lab → http://0.0.0.0:${PORT}/ghidra-lab.html  (root: ${ROOT})`);
});
