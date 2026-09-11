/**
 * Shared real-browser harness for the suites that want Blink rather than a
 * stand-in (tests/07, tests/10).
 *
 * No apt, no conda, no Chrome CDN: the browser binary, the three NSS libraries
 * the sandbox lacks and SwiftShader (so WebGL works with no GPU) all come out of
 * the @sparticuz/chromium npm tarball. Everything here skips itself cleanly when
 * those two packages are absent, because the suites that use it must stay
 * runnable on a bare checkout.
 */
import { brotliDecompressSync, inflateSync } from "node:zlib";
import { execSync } from "node:child_process";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** @returns {Promise<{puppeteer, chromium}|null>} null when the deps are absent */
export async function browserDeps() {
  try {
    const puppeteer = (await import("puppeteer-core")).default;
    const chromium = (await import("@sparticuz/chromium")).default;
    return { puppeteer, chromium };
  } catch {
    return null;
  }
}

/** Unpack libnss3/libnspr4/libnssutil3 + swiftshader next to the browser. */
export function unpackLibs(workDir = "/tmp/lens3d-browser-libs") {
  let dir = require.resolve("@sparticuz/chromium");
  while (dir !== "/" && !existsSync(`${dir}/bin/al2023.tar.br`)) dir = dir.slice(0, dir.lastIndexOf("/"));
  const pkgDir = `${dir}/`;
  if (!existsSync(`${workDir}/lib/libnss3.so`)) {
    mkdirSync(workDir, { recursive: true });
    for (const name of ["al2023", "swiftshader"]) {
      const br = `${pkgDir}bin/${name}.tar.br`;
      if (!existsSync(br)) continue;
      const tarPath = `${workDir}/${name}.tar`;
      writeFileSync(tarPath, brotliDecompressSync(readFileSync(br)));
      execSync(`tar xf ${tarPath} -C ${workDir}`);
    }
  }
  return `${workDir}/lib:${workDir}`;
}

/**
 * A static server for the repository root. The `.wasm` content type matters:
 * WebAssembly.instantiateStreaming is only available when the host says so.
 */
export function serve(root = ROOT) {
  const server = createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "") || "index.html";
    const file = join(root, rel);
    if (!file.startsWith(root) || !existsSync(file)) {
      res.writeHead(404, { "content-type": "text/plain" }).end("not found\n");
      return;
    }
    const ext = rel.slice(rel.lastIndexOf(".") + 1).toLowerCase();
    const type =
      ext === "wasm" ? "application/wasm"
        : ext === "js" || ext === "mjs" ? "text/javascript"
          : ext === "html" ? "text/html; charset=utf-8"
            : ext === "json" ? "application/json"
              : "application/octet-stream";
    res.writeHead(200, { "content-type": type, "cache-control": "no-store" });
    res.end(readFileSync(file));
  });
  return new Promise((done) => server.listen(0, "127.0.0.1", () => done({ server, port: server.address().port })));
}

export async function withBrowser(deps, fn) {
  const libDir = unpackLibs();
  const browser = await deps.puppeteer.launch({
    executablePath: await deps.chromium.executablePath(),
    headless: "new",
    env: { ...process.env, LD_LIBRARY_PATH: `${libDir}:${process.env.LD_LIBRARY_PATH ?? ""}` },
    args: [
      "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu-sandbox",
      "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
    ],
  });
  try {
    return await fn(browser);
  } finally {
    await browser.close();
  }
}

/**
 * Count lit pixels in a PNG the way tests/07 does: decode the *composited*
 * screenshot rather than calling readPixels, because a canvas created with
 * preserveDrawingBuffer:false is not readable after the frame is handed over —
 * Blink's default, and the reason the page asks for it explicitly.
 */
export function pngLitPixels(buf, minSum = 24) {
  let pos = 8;
  let w = 0;
  let h = 0;
  let colorType = 0;
  let interlace = 0;
  const idat = [];
  while (pos + 8 <= buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") {
      w = data.readUInt32BE(0);
      h = data.readUInt32BE(4);
      colorType = data[9];
      interlace = data[12];
    } else if (type === "IDAT") idat.push(data);
    pos += 12 + len;
  }
  if (interlace !== 0 || !idat.length) return null;
  const bpp = colorType === 6 ? 4 : colorType === 2 ? 3 : 0;
  if (!bpp) return null;
  const raw = inflateSync(Buffer.concat(idat));
  const stride = w * bpp;
  const out = Buffer.alloc(h * stride);
  const paeth = (a, b, c) => {
    const q = a + b - c;
    const pa = Math.abs(q - a);
    const pb = Math.abs(q - b);
    const pc = Math.abs(q - c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
  };
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const dst = out.subarray(y * stride, (y + 1) * stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? dst[x - bpp] : 0;
      const b = y > 0 ? out[(y - 1) * stride + x] : 0;
      const c = x >= bpp && y > 0 ? out[(y - 1) * stride + x - bpp] : 0;
      let v = line[x];
      if (f === 1) v += a;
      else if (f === 2) v += b;
      else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) v += paeth(a, b, c);
      dst[x] = v & 255;
    }
  }
  let lit = 0;
  for (let i = 0; i + 2 < out.length; i += bpp) {
    if (out[i] + out[i + 1] + out[i + 2] > minSum) lit++;
  }
  return { lit, w, h, total: w * h };
}
