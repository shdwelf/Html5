/**
 * 07 · real-browser check. Headless Chromium with SwiftShader for WebGL,
 * driving the actual keyspace.html over HTTP.
 *
 * No apt/conda/Chrome-CDN access is needed: the browser binary and the three
 * NSS libraries it lacks come from the @sparticuz/chromium npm tarball, whose
 * al2023.tar.br ships libnspr4/libnss3/libnssutil3 (plus SwiftShader).
 *
 *   npm i --no-save puppeteer-core @sparticuz/chromium
 *   node tests/07-browser.mjs [url]
 *
 * Skips itself when those packages are absent. Screenshots land in /tmp.
 */
import { brotliDecompressSync, inflateSync } from "zlib";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { execSync } from "child_process";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const URL_TARGET = process.argv[2] || "http://127.0.0.1:8000/keyspace.html";

let puppeteer, chromium;
try {
  puppeteer = (await import("puppeteer-core")).default;
  chromium = (await import("@sparticuz/chromium")).default;
} catch {
  console.log("07 · browser: SKIPPED (npm i --no-save puppeteer-core @sparticuz/chromium)");
  process.exit(0);
}

const checks = [];
/* Minimal non-interlaced 8-bit RGB/RGBA PNG decoder, used to assert the WebGL
 * stage actually rasterised. readPixels is unreliable on a canvas created with
 * preserveDrawingBuffer:false, so we decode the real composited screenshot. */
function pngLitPixels(buf, minSum = 30) {
  let pos = 8; // skip signature
  let w = 0, h = 0, colorType = 0, interlace = 0, idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") {
      w = data.readUInt32BE(0); h = data.readUInt32BE(4);
      colorType = data[9]; interlace = data[12];
    } else if (type === "IDAT") idat.push(data);
    pos += 12 + len;
  }
  if (interlace !== 0) return -1;
  const bpp = colorType === 6 ? 4 : colorType === 2 ? 3 : 0;
  if (!bpp) return -1;
  const raw = inflateSync(Buffer.concat(idat));
  const stride = w * bpp;
  const out = Buffer.alloc(h * stride);
  const paeth = (a, b, c) => { const q = a + b - c; const pa = Math.abs(q-a), pb = Math.abs(q-b), pc = Math.abs(q-c); return pa <= pb && pa <= pc ? a : pb <= pc ? b : c; };
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const dst = out.subarray(y * stride, (y + 1) * stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? dst[x - bpp] : 0;
      const b = y > 0 ? out[(y - 1) * stride + x] : 0;
      const c = x >= bpp && y > 0 ? out[(y - 1) * stride + x - bpp] : 0;
      let v = line[x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1; else if (f === 4) v += paeth(a, b, c);
      dst[x] = v & 255;
    }
  }
  let lit = 0;
  for (let i = 0; i < out.length; i += bpp) {
    if (out[i] + out[i + 1] + out[i + 2] > minSum) lit++;
  }
  return { lit, w, h };
}

const check = (label, cond, extra = "") => checks.push({ label, cond: !!cond, extra: String(extra) });

/* --- unpack the NSS libs + SwiftShader that the sandbox lacks --- */
function unpackLibs() {
  // The package's "exports" map forbids resolving ./package.json, so resolve the
  // main entry and walk up until the directory that holds bin/*.tar.br.
  let dir = require.resolve("@sparticuz/chromium");
  while (dir !== "/" && !existsSync(`${dir}/bin/al2023.tar.br`)) {
    dir = dir.substring(0, dir.lastIndexOf("/"));
  }
  const pkgDir = dir + "/";
  const out = "/tmp/keyspace-browser-libs";
  // al2023.tar nests its libs under lib/, swiftshader.tar does not.
  if (!existsSync(`${out}/lib/libnss3.so`)) {
    mkdirSync(out, { recursive: true });
    for (const name of ["al2023", "swiftshader"]) {
      const br = `${pkgDir}bin/${name}.tar.br`;
      if (!existsSync(br)) continue;
      const tarPath = `${out}/${name}.tar`;
      writeFileSync(tarPath, brotliDecompressSync(readFileSync(br)));
      execSync(`tar xf ${tarPath} -C ${out}`);
    }
  }
  return `${out}/lib:${out}`;
}

const libDir = unpackLibs();
check("NSS libs unpacked", libDir.split(":").some((d) => existsSync(`${d}/libnss3.so`)), libDir);

const errors = [];
const browser = await puppeteer.launch({
  executablePath: await chromium.executablePath(),
  headless: "new",
  env: { ...process.env, LD_LIBRARY_PATH: `${libDir}:${process.env.LD_LIBRARY_PATH ?? ""}` },
  args: [
    "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu-sandbox",
    "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
  ],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1000 });
  page.on("console", (m) => { if (m.type() === "error") errors.push(`console.error: ${m.text()}`); });
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("requestfailed", (r) => errors.push(`requestfailed: ${r.url()} ${r.failure()?.errorText ?? ""}`));

  await page.goto(URL_TARGET, { waitUntil: "networkidle2", timeout: 60000 });
  await page.waitForFunction(
    () => /Checksum valid/.test(document.getElementById("status")?.textContent || ""),
    { timeout: 60000 }
  );

  const boot = await page.evaluate(() => ({
    status: document.getElementById("status").textContent,
    chips: document.querySelectorAll("#chips .chip").length,
    rackRows: document.querySelectorAll("#lensRack [data-lens]").length,
    forms: document.getElementById("formSel").options.length,
    wcNote: document.getElementById("wcNote").textContent,
    webgl: !!document.getElementById("stage").getContext("webgl2"),
    renderer: (() => {
      const gl = document.getElementById("stage").getContext("webgl2");
      if (!gl) return "none";
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : String(gl.getParameter(gl.RENDERER));
    })(),
    stageW: document.getElementById("stage").width,
  }));

  check("boots to a valid phrase", /Checksum valid/.test(boot.status), boot.status);
  check("12 chips rendered", boot.chips === 12, boot.chips);
  check("72 rack rows", boot.rackRows === 72, boot.rackRows);
  check("13 3-D forms", boot.forms === 13, boot.forms);
  check("layout note correct", /132 bits = 128 ENT \+ 4 CS/.test(boot.wcNote), boot.wcNote);
  check("WebGL context live", boot.webgl);
  check("GL renderer", boot.renderer.length > 0, boot.renderer.slice(0, 60));
  const stageEl = await page.$("#stage");
  const stageShot = await stageEl.screenshot();
  const stage = pngLitPixels(stageShot);
  check("stage rasterised", stage.lit > 2000, `${stage.lit}/${stage.w * stage.h} lit px (${stage.w}x${stage.h})`);
  await page.screenshot({ path: "/tmp/keyspace-1-boot.png" });

  /* generalised 25-word length */
  await page.select("#wc", "25");
  await page.evaluate(() => document.getElementById("wc").dispatchEvent(new Event("change", { bubbles: true })));
  await page.click("#gen");
  await page.waitForFunction(() => document.querySelectorAll("#chips .chip").length === 25, { timeout: 60000 });
  const w25 = await page.evaluate(() => ({
    chips: document.querySelectorAll("#chips .chip").length,
    status: document.getElementById("status").textContent,
    hexLen: document.getElementById("hex").textContent.length,
  }));
  check("25 words generated", w25.chips === 25, w25.chips);
  check("flagged as generalised", /generalised/.test(w25.status), w25.status.slice(0, 58));
  check("66 hex nibbles", w25.hexLen === 66, w25.hexLen);

  /* invert keyspace */
  await page.click("#genB");
  await page.waitForFunction(() => /B ·/.test(document.getElementById("statusB").textContent), { timeout: 60000 });
  await page.click("#notA");
  await page.waitForFunction(() => document.getElementById("invHam").textContent === "264 / 264", { timeout: 60000 });
  const inv = await page.evaluate(() => ({
    ham: document.getElementById("invHam").textContent,
    comp: document.getElementById("invComp").textContent,
    geo: document.getElementById("invGeo").textContent,
  }));
  check("d(A,¬A) = 264/264", inv.ham === "264 / 264", inv.ham);
  check("d(¬A,B) = 0", inv.comp === "0", inv.comp);
  check("geodesics = 264!", inv.geo === "264!", inv.geo);

  /* differential lens: runs the real 264-bit flip sweep in the page */
  await page.click('#lensRack [data-lens="differential"] [data-act="toggle"]');
  await page.waitForFunction(() => /Predict/.test(document.getElementById("lensPredict").textContent), { timeout: 240000 });
  const lens = await page.evaluate(() => ({
    name: document.getElementById("lensName").textContent,
    rows: [...document.querySelectorAll("#lensRows tr")].map((t) => t.textContent.replace(/\s+/g, " ").trim()).slice(0, 3),
    predict: document.getElementById("lensPredict").textContent,
    canvasHidden: document.getElementById("lensCanvas").hidden,
    lensPixels: (() => {
      const c = document.getElementById("lensCanvas");
      const g = c.getContext("2d");
      const d = g.getImageData(0, 0, c.width, c.height).data;
      let lit = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] > 60) lit++;
      return lit;
    })(),
  }));
  check("lens focused", lens.name === "differential calculus", lens.name);
  check("sweep measured 264 bits", lens.rows.some((r) => /bits probed\s*264/.test(r)), lens.rows.join(" | "));
  check("prediction confirmed by measurement", /Confirmed/.test(lens.predict), lens.predict.slice(0, 96));
  check("lens canvas has real pixels", lens.lensPixels > 50, `${lens.lensPixels} lit`);
  await page.screenshot({ path: "/tmp/keyspace-2-lens.png" });

  /* a second lens with a 3-D layer, to exercise the WebGL path again */
  await page.click('#lensRack [data-lens="modal-mu"] [data-act="toggle"]');
  await page.waitForFunction(() => document.getElementById("lensName").textContent === "modal μ-calculus", { timeout: 60000 });
  const mu = await page.evaluate(() => ({
    rows: [...document.querySelectorAll("#lensRows tr")].map((t) => t.textContent.replace(/\s+/g, " ").trim()).slice(0, 2),
  }));
  check("modal μ lens renders", mu.rows.length > 0, mu.rows.join(" | "));
  await page.screenshot({ path: "/tmp/keyspace-3-modal.png" });
} finally {
  await browser.close();
}

let pass = 0, fail = 0;
for (const c of checks) {
  c.cond ? pass++ : fail++;
  console.log(`  ${c.cond ? "ok  " : "FAIL"} ${c.label} ${c.extra}`);
}
console.log(`\n  browser console/network errors: ${errors.length}`);
for (const e of errors.slice(0, 10)) console.log("    " + e);
console.log(`\n07 · browser: ${pass} passed, ${fail} failed${errors.length ? `, ${errors.length} console errors` : ""}`);
process.exit(fail || errors.length ? 1 : 0);
