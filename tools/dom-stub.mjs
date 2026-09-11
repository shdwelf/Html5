/**
 * Minimal DOM stand-in so tools/check_ghs.mjs can execute the page controller
 * (js/glendora-app.js) in node.  Only what that module touches at import time
 * is implemented: element lookup by id, listener registration, innerHTML /
 * textContent assignment, and dataset.  By default there is no WebGL context
 * here, so the three.js renderer construction is expected to fail — the caller
 * asserts that everything up to it ran.
 *
 * `installDomStub({ webgl: "record" })` turns a `<canvas>` into a faithful
 * stand-in for the real thing, and it is *derived* rather than guessed: the
 * accepted context ids, the context-creation attribute defaults, the canvas
 * size limits, the WebGL member list, the per-call argument shapes and even the
 * GL error strings come from config/blink-dom-contract.json, which
 * tools/blink_contract.mjs extracts from a Chromium checkout
 * (third_party/blink/renderer).  That is what makes it useful as a test double:
 * a call this recorder rejects is a call Chromium would reject too, and
 * tests/09-blink-contract.mjs asserts the two stay in step.
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CONTRACT_PATH = join(ROOT, "config", "blink-dom-contract.json");

let contractCache;
/** @returns {object|null} the extracted Blink contract, or null when absent */
export function loadContract() {
  if (contractCache !== undefined) return contractCache;
  contractCache = existsSync(CONTRACT_PATH) ? JSON.parse(readFileSync(CONTRACT_PATH, "utf8")) : null;
  return contractCache;
}

export const CONTRACT_PATH_FOR_TESTS = CONTRACT_PATH;

const parseDefault = (v) => {
  if (v === null || v === undefined) return undefined;
  const t = String(v).trim();
  if (t === "true") return true;
  if (t === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  if (/^"(.*)"$/.test(t)) return t.slice(1, -1);
  return t;
};

/** Attribute defaults Blink applies when getContext() gets no attributes. */
export function webglAttributeDefaults(c = loadContract()) {
  const out = {};
  for (const m of c.webgl.contextAttributes.members) out[m.name] = parseDefault(m.defaultValue);
  return out;
}

export function canvasAttributeDefaults(c = loadContract()) {
  const out = {};
  for (const m of c.canvas.creationAttributes.members) out[m.name] = parseDefault(m.defaultValue);
  return out;
}

/** The exact context ids Blink recognises — everything else returns null. */
export function renderingApiIds(c = loadContract()) {
  return c.canvas.renderingApiIds.map((r) => r.id);
}

/** Contexts this stand-in can actually service (the rest fail creation, as an
 *  engine without those backends would). */
export const SERVICED = new Set(["2d", "webgl", "experimental-webgl", "webgl2"]);

/**
 * A WebGLRenderingContext stand-in that validates itself against the contract.
 *
 * · an unknown member is a hard error (the engine has no such property), and a
 *   WebGL2-only method on a "webgl" context is reported separately — that is the
 *   single most common way hand-written WebGL breaks in one browser only.
 * · argument counts are checked against the overload set Blink declares.
 * · bufferData's three overloads are type-checked, because the wasm path passes
 *   a Float32Array view onto WebAssembly.Memory — the case Blink calls out
 *   explicitly when it caps buffer sizes.
 * · rejections follow the engine: the GL error is *queued* for getError(), not
 *   thrown.
 */
export function makeWebglContext(kind = "webgl", attrs = {}, c = loadContract()) {
  const calls = [];
  const errors = [];
  const violations = [];
  const isWebGL2 = kind === "webgl2";
  const known = new Set([...c.webgl.methods, ...(isWebGL2 ? c.webgl.webgl2OnlyMethods : [])]);
  const attrs2 = new Set([...c.webgl.attributes, "drawingBufferWidth", "drawingBufferHeight", "drawingBufferFormat"]);
  const overloads = new Map(c.webgl.calls.map((call) => [call.name, new Set(call.overloads.map((o) => o.args.length))]));
  let resources = 0;
  // Web IDL drops dictionary members the interface does not declare, so an
  // attribute the spec has no name for must not reappear from
  // getContextAttributes() — only the contract's keys are merged.
  const defaults = webglAttributeDefaults(c);
  const accepted = {};
  if (attrs && typeof attrs === "object") {
    for (const key of Object.keys(defaults)) if (key in attrs) accepted[key] = attrs[key];
  }
  const settings = { ...defaults, ...accepted };

  const record = (name, args) => {
    calls.push({ name, args: args.length });
    if (!known.has(name)) {
      const why = c.webgl.webgl2OnlyMethods.includes(name)
        ? `${name}() is WebGL2-only; this context was created as "${kind}"`
        : `WebGLRenderingContext has no member "${name}"`;
      violations.push(why);
      throw new TypeError(why);
    }
    // Anything the contract declares and that hands back an object gets one, so
    // a WebGL2 createVertexArray on a WebGL2 context behaves like the engine.
    if (name.startsWith("create") && !name.startsWith("createImageData")) {
      recordCreate(name);
      return { __gl: name.slice(6).toLowerCase(), id: ++resources };
    }
    const arity = overloads.get(name);
    if (arity && !arity.has(args.length)) {
      violations.push(`${name}() called with ${args.length} args; Blink declares ${[...arity].sort().join(" or ")}`);
      throw new TypeError(violations[violations.length - 1]);
    }
    if (name === "bufferData") {
      const [target, data, usage] = args;
      // ValidateBufferDataTarget: a non-buffer target is INVALID_ENUM, a target
      // with nothing bound is INVALID_OPERATION.
      if (target !== 0x8892 && target !== 0x8893) {
        errors.push([0x0500, "bufferData", "invalid target"]);
      } else if (!bindings.get(target)) {
        errors.push([0x0502, "bufferData", "no buffer"]);
      }
      // ValidateBufferDataBufferSize: negative or above the ArrayBuffer ceiling.
      const size = typeof data === "number" ? data : data && data.byteLength;
      if (!(size >= 0)) errors.push([0x0501, "bufferData", "data size is invalid"]);
      else if (size > MAX_BUFFER_BYTES) errors.push([0x0501, "bufferData", "data size exceeds the maximum supported size"]);
      else if (data && typeof data === "object" && !ArrayBuffer.isView(data) && !(data instanceof ArrayBuffer)) {
        violations.push(`bufferData data must be a number, ArrayBuffer or ArrayBufferView (got ${Object.prototype.toString.call(data)})`);
      } else if (ArrayBuffer.isView(data) && data.buffer.detached === true) {
        violations.push("bufferData got a view onto a detached ArrayBuffer (wasm memory grew)");
      }
      if (usage !== 0x88e0 && usage !== 0x88e4 && usage !== 0x88e8) {
        errors.push([0x0500, "bufferData", "invalid usage"]);
      }
    }
    if (name === "texImage2D" && args.length === 9) {
      const [, level, internalformat, w, h, border, format, type, pixels] = args;
      if (level !== 0 || border !== 0) errors.push([0x0502, "texImage2D", "level of detail and border must be 0"]);
      if (!(w >= 0 && h >= 0)) errors.push([0x0501, "texImage2D", "width/height must be non-negative"]);
      if (pixels !== null && !ArrayBuffer.isView(pixels)) {
        violations.push("texImage2D pixels must be an ArrayBufferView or null");
      }
      const need = w * h * 4;
      if (ArrayBuffer.isView(pixels) && type === 0x1401 && format === 0x1908 && pixels.byteLength < need) {
        errors.push([0x0502, "texImage2D", "pixel data is too small for the requested size"]);
      }
      void internalformat;
    }
    return undefined;
  };

  // Blink caps BufferSource sizes at PartitionAlloc's maximum allocation
  // (2 GB − 2 MB) — see webgl.bufferLimits.comment in the contract.
  const MAX_BUFFER_BYTES = 2 * 1024 * 1024 * 1024 - 2 * 1024 * 1024;
  const bindings = new Map();

  const recordCreate = (name) => calls.push({ name, args: 0 });

  const impl = {
    __kind: kind,
    __calls: calls,
    __violations: violations,
    __errors: errors,
    __attributes: settings,
    getContextAttributes: () => ({ ...settings }),
    getExtension: (name) => (name === "OES_vertex_array_object" ? { __ext: name } : null),
    getParameter: (p) => (p === 0x8869 ? 16 : p === 0x0d33 ? 16384 : 0),
    getError: () => (errors.length ? errors.shift()[0] : 0),
    isContextLost: () => false,
    createBuffer: () => ({ __gl: "buffer", id: ++resources }),
    createTexture: () => ({ __gl: "texture", id: ++resources }),
    createProgram: () => ({ __gl: "program", id: ++resources }),
    createShader: () => ({ __gl: "shader", id: ++resources }),
    bindBuffer: (target, buffer) => {
      if (buffer) bindings.set(target, buffer);
      else bindings.delete(target);
    },
  };

  return new Proxy(impl, {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (typeof prop !== "string") return undefined;
      if (attrs2.has(prop)) return prop.startsWith("drawingBuffer") ? 256 : undefined;
      return (...args) => record(prop, args);
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    },
  });
}

/**
 * `<canvas>` with Blink's getContext() decision table.
 * @returns {object} an element whose getContext mirrors HTMLCanvasElement
 */
export function makeBlinkCanvas(c = loadContract()) {
  const el = new El("canvas");
  let ctx = null;
  let ctxApi = null;
  const attempts = [];
  el.__attempts = attempts;
  const sizeOk = () => {
    const w = el.width | 0;
    const h = el.height | 0;
    const limits = c.canvas.sizeLimits;
    return (
      w >= 1 && h >= 1 &&
      w * h <= (limits.MaxCanvasArea ?? Infinity) &&
      w <= (limits.MaxSkiaDim ?? Infinity) &&
      h <= (limits.MaxSkiaDim ?? Infinity)
    );
  };
  el.getContext = (contextId, attributes) => {
    const known = renderingApiIds(c);
    const api = known.includes(contextId) ? c.canvas.renderingApiIds.find((r) => r.id === contextId).api : null;
    attempts.push({ contextId, api, accepted: known.includes(contextId) && SERVICED.has(contextId) });
    // RenderingAPIFromId(): an unrecognised id is refused quietly, no exception.
    if (!known.includes(contextId)) return null;
    if (!SERVICED.has(contextId)) return null; // no bitmaprenderer/webgpu backend here
    // Same api twice hands back the same object; a different one is refused.
    if (ctx) {
      if (ctxApi === api) return ctx;
      attempts[attempts.length - 1].error = "Canvas has an existing context of a different type";
      return null;
    }
    if (!sizeOk()) {
      attempts[attempts.length - 1].error =
        `size ${el.width}×${el.height} exceeds the engine limit (${c.canvas.sizeLimits.MaxSkiaDim}px per side, area ${c.canvas.sizeLimits.MaxCanvasArea})`;
      return null;
    }
    // [PermissiveDictionaryConversion]: non-object attributes are ignored, not
    // a TypeError. Passing `true` for attributes must therefore still work.
    const attrs = attributes && typeof attributes === "object" ? attributes : {};
    ctx = contextId === "2d" ? makeCanvas2dRecorder() : makeWebglContext(contextId === "experimental-webgl" ? "webgl" : contextId, attrs, c);
    ctxApi = api;
    return ctx;
  };
  el.width = 300;
  el.height = 150;
  return el;
}

function makeCanvas2dRecorder() {
  const ops = [];
  const ctx = { __ops: ops };
  for (const name of ["fillRect", "strokeRect", "clearRect", "drawImage", "beginPath", "closePath", "moveTo", "lineTo", "stroke", "fill", "arc", "rect", "save", "restore", "setTransform", "fillText", "setLineDash", "putImageData"]) {
    ctx[name] = (...a) => ops.push({ name: a.length ? `${name}(${a.length})` : name });
  }
  ctx.measureText = (t) => ({ width: String(t).length * 5 });
  ctx.createImageData = (w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h });
  return ctx;
}

const TOUCHED = new Set();
const byId = new Map();
const created = [];

class El {
  constructor(tag = "div", id = "") {
    this.tagName = String(tag).toUpperCase();
    this.id = id;
    this.children = [];
    this.dataset = {};
    this.style = {};
    this.hidden = false;
    this.disabled = false;
    this.listeners = {};
    this._html = "";
    this._text = "";
    const cls = new Set();
    this.classList = {
      add: (c) => cls.add(c),
      remove: (c) => cls.delete(c),
      toggle: (c, on) => (on ? cls.add(c) : cls.delete(c)),
      contains: (c) => cls.has(c),
    };
  }

  addEventListener(type, fn) {
    (this.listeners[type] ||= []).push(fn);
  }

  removeEventListener() {}
  appendChild(child) {
    this.children.push(child);
    return child;
  }
  removeChild() {}
  remove() {}
  setPointerCapture() {}
  releasePointerCapture() {}
  querySelector() {
    return null;
  }
  querySelectorAll() {
    return [];
  }
  get clientWidth() {
    return 960;
  }
  get clientHeight() {
    return 600;
  }
  getContext() {
    return null;
  }

  get innerHTML() {
    return this._html;
  }
  set innerHTML(v) {
    this._html = String(v);
    TOUCHED.add(this.id || this.tagName);
  }
  get textContent() {
    return this._text;
  }
  set textContent(v) {
    this._text = String(v);
    TOUCHED.add(this.id || this.tagName);
  }
  get firstElementChild() {
    return this.children[0] || null;
  }
}

export function installDomStub(opts = {}) {
  const webglMode = opts.webgl || "none";
  const contract = webglMode === "record" ? loadContract() : null;
  if (webglMode === "record" && !contract) {
    throw new Error(
      "installDomStub({webgl:'record'}) needs the extracted Blink contract: " +
        "node tools/blink_contract.mjs --src /path/to/chromium/src"
    );
  }
  TOUCHED.clear();
  byId.clear();
  const canvasAttempts = [];
  const document = {
    body: new El("body"),
    documentElement: new El("html"),
    pointerLockElement: null,
    getElementById(id) {
      let el = byId.get(id);
      if (!el) {
        // Two modes, because two things go wrong in different ways: the default
        // stand-in invents an element so a controller can run to completion
        // (that is what check_ghs.mjs asserts about), while `strictIds` makes
        // a missing id observable, as Blink does.
        if (opts.strictIds) return null;
        el = new El("div", id);
        byId.set(id, el);
      }
      return el;
    },
    createElement(tag) {
      const el = String(tag).toLowerCase() === "canvas" && webglMode === "record" ? makeBlinkCanvas(contract) : new El(tag);
      if (el.__attempts) canvasAttempts.push(...el.__attempts);
      created.push(el);
      return el;
    },
    createElementNS(ns, tag) {
      return new El(tag);
    },
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
    addEventListener() {},
    removeEventListener() {},
  };
  globalThis.document = document;
  globalThis.window = globalThis;
  globalThis.addEventListener = () => {};
  globalThis.removeEventListener = () => {};
  globalThis.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  globalThis.devicePixelRatio = 1;
  globalThis.innerWidth = 1280;
  globalThis.innerHeight = 800;
  globalThis.OffscreenCanvas =
    webglMode === "record"
      ? class OffscreenCanvas {
          constructor(w, h) {
            this.width = w;
            this.height = h;
          }
          getContext(id, attrs) {
            const probe = makeBlinkCanvas(contract);
            probe.width = this.width;
            probe.height = this.height;
            const ctx = probe.getContext(id, attrs);
            if (ctx) this.__attempts = probe.__attempts;
            return ctx;
          }
        }
      : globalThis.OffscreenCanvas;
  globalThis.location = globalThis.location || { hash: "", href: "", reload() {} };
  return { document, TOUCHED, byId, created, canvasAttempts, webglMode, contract };
}

export { TOUCHED, byId, El };
