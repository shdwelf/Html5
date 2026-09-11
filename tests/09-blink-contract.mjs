/**
 * 09 · the DOM stand-ins are checked against Chromium, not against memory.
 * node tests/09-blink-contract.mjs
 *
 * Every assertion here reads config/blink-dom-contract.json — the facts
 * tools/blink_contract.mjs extracted from third_party/blink/renderer — and
 * compares them with what tools/dom-stub.mjs implements. Add a member to the
 * shim that Blink does not have, and this suite fails.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { suite, ROOT } from "./lib.mjs";

const D = await import("../tools/dom-stub.mjs");
const s = suite("09 · Blink DOM contract");

const CONTRACT_PATH = join(ROOT, "config", "blink-dom-contract.json");
s.ok("contract is committed", existsSync(CONTRACT_PATH), CONTRACT_PATH.replace(`${ROOT}/`, ""));
if (!existsSync(CONTRACT_PATH)) process.exit(s.done() ? 1 : 0);

const C = JSON.parse(readFileSync(CONTRACT_PATH, "utf8"));

console.log("\n[1] provenance — the contract says where it came from");
s.ok("schema", C.schema === "blink-dom-contract/1", C.schema);
s.ok("source is chromium", C.provenance.source === "https://github.com/chromium/chromium", C.provenance.revision.slice(0, 12));
s.ok("revision looks like a sha", /^[0-9a-f]{40}$/.test(C.provenance.revision), C.provenance.revision.slice(0, 12));
s.ok("every mined file has a digest", Object.values(C.provenance.files).every((f) => /^[0-9a-f]{64}$/.test(f.sha256) && f.bytes > 0),
  `${Object.keys(C.provenance.files).length} files`);
s.ok("getContext comes from the module IDL", /html_canvas_element_module\.idl/.test(C.provenance.files.canvasModuleIdl.path), C.provenance.files.canvasModuleIdl.path);

console.log("\n[2] getContext accepts exactly Blink's context ids");
const ids = C.canvas.renderingApiIds.map((r) => r.id);
s.eq("RenderingAPIFromId", ids, ["2d", "experimental-webgl", "webgl", "webgl2", "bitmaprenderer", "webgpu"]);
s.eq("the shim agrees with the contract", D.renderingApiIds(), ids);
s.ok("experimental-webgl is a real Blink id (not folklore)", C.canvas.renderingApiIds.some((r) => r.id === "experimental-webgl" && r.api === "kWebgl"));
{
  const cv = D.makeBlinkCanvas(C);
  cv.width = 256;
  cv.height = 256;
  for (const id of ["nosuchcontext", "webgl-1", "WebGL", "", "experimental-webgl2"]) {
    s.ok(`"${id}" is refused without throwing`, cv.getContext(id) === null, cv.__attempts.at(-1).api === null ? "unknown id" : `mapped to ${cv.__attempts.at(-1).api}`);
  }
  s.ok("case matters: \"WebGL\" is not \"webgl\"", cv.getContext("WebGL") === null);
}
{
  const cv = D.makeBlinkCanvas(C);
  cv.width = 64;
  cv.height = 64;
  const gl1 = cv.getContext("webgl");
  s.ok("second getContext(webgl) returns the same object (Blink memoises)", cv.getContext("webgl") === gl1);
  s.ok("experimental-webgl and webgl are the same API, so also the same object", cv.getContext("experimental-webgl") === gl1);
  s.ok("a different type is refused with the engine's message",
    cv.getContext("2d") === null && /existing context of a different type/.test(cv.__attempts.at(-1).error), cv.__attempts.at(-1).error);
  s.ok("the refusal is recorded, not thrown", cv.__attempts.length === 4);
}

console.log("\n[3] attributes follow the IDL, including its defaults");
{
  const cv = D.makeBlinkCanvas(C);
  cv.width = 64;
  cv.height = 64;
  const gl = cv.getContext("webgl");
  const got = gl.getContextAttributes();
  for (const m of C.webgl.contextAttributes.members) {
    const want = m.defaultValue === "true" ? true : m.defaultValue === "false" ? false : m.defaultValue?.replace(/"/g, "");
    s.ok(`default ${m.name} = ${m.defaultValue}`, got[m.name] === want, `got ${JSON.stringify(got[m.name])}`);
  }
  s.ok("preserveDrawingBuffer defaults to false — the reason readPixels is unreliable",
    C.webgl.contextAttributes.members.find((m) => m.name === "preserveDrawingBuffer").defaultValue === "false");
  // [PermissiveDictionaryConversion]: a non-object second argument is ignored.
  const cv2 = D.makeBlinkCanvas(C);
  cv2.width = 64;
  cv2.height = 64;
  const gl2 = cv2.getContext("webgl", true);
  s.ok("getContext('webgl', true) is accepted (PermissiveDictionaryConversion)", gl2 !== null && gl2.getContextAttributes().antialias === true);
  const cv3 = D.makeBlinkCanvas(C);
  cv3.width = 64;
  cv3.height = 64;
  const gl3 = cv3.getContext("webgl", { antialias: false, notAnAttribute: 7 });
  s.ok("unknown dictionary members are dropped, not echoed back",
    gl3.getContextAttributes().antialias === false && !("notAnAttribute" in gl3.getContextAttributes()));
}

console.log("\n[4] canvas size limits are the engine's, not invented");
{
  const side = C.canvas.sizeLimits.MaxSkiaDim;
  const area = C.canvas.sizeLimits.MaxCanvasArea;
  s.ok("side limit is 65535", side === 65535, String(side));
  s.ok("area limit is 32768·8192", area === 32768 * 8192, String(area));
  const mk = (w, h) => {
    const cv = D.makeBlinkCanvas(C);
    cv.width = w;
    cv.height = h;
    return cv.getContext("webgl");
  };
  s.ok("65535 × 1 passes both rules", mk(65535, 1) !== null, `side ${side}, area ${area}`);
  s.ok("1 × 1 creates a context", mk(1, 1) !== null);
  s.ok("0 × 0 is refused (IsEmpty)", mk(0, 0) === null);
  s.ok("65536 px wide is refused", mk(65536, 1) === null);
  s.ok("65535 × 4096 is exactly the area limit, so it passes", mk(65535, 4096) !== null, `${65535 * 4096} vs ${area}`);
  s.ok("one row more exceeds it and is refused", mk(65535, 4097) === null, `${65535 * 4097} vs ${area}`);
}

console.log("\n[5] the WebGL stand-in rejects what Blink would reject");
{
  const cv = D.makeBlinkCanvas(C);
  cv.width = 256;
  cv.height = 256;
  const gl = cv.getContext("webgl");
  const buf = gl.createBuffer();
  gl.bindBuffer(0x8892, buf);
  gl.bufferData(0x8892, 8192 * 32, 0x88e8);
  gl.bufferSubData(0x8892, 0, new Float32Array(64));
  gl.texImage2D(0x0de1, 0, 0x1908, 256, 256, 0, 0x1908, 0x1401, new Uint8Array(256 * 256 * 4));
  s.ok("the calls our wasm path makes are all legal", gl.__violations.length === 0 && gl.__errors.length === 0,
    `${gl.__calls.length} calls recorded`);

  gl.bindBuffer(0x8893, null);
  gl.bufferData(0x8893, 16, 0x88e8);
  const noBuffer = gl.getError();
  s.ok("bufferData with nothing bound queues INVALID_OPERATION", noBuffer === 0x0502,
    `getError → 0x${noBuffer.toString(16)}`);
  gl.bufferData(0x8a11, 16, 0x88e8);
  s.ok("bufferData with a non-buffer target queues INVALID_ENUM", gl.getError() === 0x0500);

  let threw = null;
  try {
    gl.bufferData(0x8892, new Float32Array(8));
  } catch (e) {
    threw = e;
  }
  s.ok("a 2-argument bufferData is refused (Blink declares 3 overloads)", threw instanceof TypeError, threw?.message);
  threw = null;
  try {
    gl.texImage2D(0x0de1, 0, 0x1908, 8, 8, 0, 0x1908);
  } catch (e) {
    threw = e;
  }
  s.ok("a half-written texImage2D is refused (6 or 9 args only)", threw instanceof TypeError, threw?.message);

  threw = null;
  try {
    gl.blendEquationSeparateWOZ(1, 2);
  } catch (e) {
    threw = e;
  }
  s.ok("invented members are refused", threw instanceof TypeError && /has no member/.test(threw.message), threw?.message);

  threw = null;
  try {
    gl.createVertexArray();
  } catch (e) {
    threw = e;
  }
  s.ok("a WebGL2-only method on a 'webgl' context is refused", threw instanceof TypeError && /WebGL2-only/.test(threw.message), threw?.message);
  s.ok("…and the same call is fine on webgl2", (() => {
    const cv2 = D.makeBlinkCanvas(C);
    cv2.width = 64;
    cv2.height = 64;
    const gl2 = cv2.getContext("webgl2");
    return typeof gl2.createVertexArray() === "object";
  })());
  s.ok("the contract's own overload table is what the shim checked",
    C.webgl.calls.find((x) => x.name === "bufferData").overloads.length === 3 &&
      C.webgl.calls.find((x) => x.name === "texImage2D").overloads.length === 8);
}

console.log("\n[6] the shim exposes no canvas member Blink does not");
{
  const cv = D.makeBlinkCanvas(C);
  const declared = new Set([...C.canvas.members, "getContext"]);
  // Only the canvas-specific surface is in scope: what every element carries
  // comes from El and is checked by the DOM suite, not here.
  const shared = new Set([
    ...Object.getOwnPropertyNames(new D.El("canvas")),
    ...Object.getOwnPropertyNames(D.El.prototype),
  ]);
  const own = Object.keys(cv);
  const invented = own.filter((k) => !shared.has(k) && !k.startsWith("_") && !declared.has(k));
  s.ok("no invented canvas members", invented.length === 0, invented.join(", ") || `${own.length} canvas-specific names checked`);
  s.ok("width/height/getContext/toBlob/toDataURL are all real", ["width", "height", "getContext", "toBlob", "toDataURL"].every((k) => declared.has(k)));
}

console.log("\n[7] the repo's own WebGL source respects the contract");
{
  const webgl2Only = new Set(C.webgl.webgl2OnlyMethods);
  const files = [
    ...readdirSync(join(ROOT, "js")).filter((f) => f.endsWith(".js")).map((f) => join(ROOT, "js", f)),
    ...readdirSync(ROOT).filter((f) => f.endsWith(".html")).map((f) => join(ROOT, f)),
  ].filter((f) => {
    try {
      return statSync(f).size < 262144; // skip the byte-locked single-file uploads
    } catch {
      return false;
    }
  });
  let checked = 0;
  const offenders = [];
  for (const f of files) {
    const src = readFileSync(f, "utf8");
    if (!/getContext\(\s*["'](webgl|experimental-webgl)["']/.test(src)) continue;
    if (/getContext\(\s*["']webgl2["']/.test(src)) continue; // may legitimately use WebGL2
    checked++;
    for (const m of src.matchAll(/\.([A-Za-z]\w*)\s*\(/g)) {
      if (webgl2Only.has(m[1])) offenders.push(`${f.replace(`${ROOT}/`, "")}: ${m[1]}()`);
    }
  }
  s.ok(`no WebGL2-only call on a WebGL1 context (${checked} files)`, offenders.length === 0, offenders.slice(0, 5).join(" · "));
}

console.log("\n[8] wasm buffers fit the ceiling Blink documents for BufferSource");
{
  const cap = 2 * 1024 * 1024 * 1024 - 2 * 1024 * 1024; // what the stub enforces
  s.ok("the contract records why", /Only with WebAssembly/.test(C.webgl.bufferLimits.comment), C.webgl.bufferLimits.maxArrayBufferSize);
  const { CAP, STRIDE } = await import("../js/lens3d-ref.js");
  const vertexBytes = CAP * STRIDE;
  const textureBytes = 256 * 256 * 4;
  s.ok(`vertex buffer ${vertexBytes} B is under the cap`, vertexBytes < cap);
  s.ok(`texture ${textureBytes} B is under the cap`, textureBytes < cap);
  s.ok("both are whole multiples of f32 (no partial trailing element)", vertexBytes % 4 === 0 && textureBytes % 4 === 0);
}

console.log("\n[9] the contract still matches the checkout, when one is handy");
{
  const src = process.env.CHROMIUM_SRC;
  if (!src || !existsSync(join(src, ".git"))) {
    console.log("  --  skipped: set CHROMIUM_SRC=/path/to/src to re-derive (tools/blink_contract.mjs --src … --check)");
  } else {
    let out = "";
    let failed = false;
    try {
      out = execFileSync("node", [join(ROOT, "tools", "blink_contract.mjs"), "--src", src, "--check"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    } catch (err) {
      failed = true;
      out = String(err.stdout || "") + String(err.stderr || "");
    }
    s.ok("re-extraction matches the committed contract", !failed, out.trim().split("\n").slice(0, 2).join(" · ").slice(0, 120));
  }
}

process.exit(s.done() ? 1 : 0);
