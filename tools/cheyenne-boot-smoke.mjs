#!/usr/bin/env node
/**
 * Boot smoke harness for js/cheyenne.js: stubs just enough DOM + WebGL to
 * actually RUN init() headlessly.  The previous smoke test only imported the
 * module, which never executes init (boot-guarded); that let a run-time
 * ReferenceError ship.  This harness exists to make that class of bug
 * impossible to ship again.
 *
 *   node tools/cheyenne-boot-smoke.mjs
 *
 * Exit 0 = init() ran to completion without throwing.
 */
import { setTimeout as delay } from "node:timers/promises";

/* ------------------------------------------------------------ GL stub -- */
function makeGL() {
  const fun = (ret) => () => ret;
  const obj = () => ({});
  /* THREE looks up numeric enums as properties on the context (gl.VERSION…).
   * Give every ALL-CAPS property a stable synthetic enum value so identity
   * comparisons stay consistent across calls.  String-typed parameters get
   * '__s:'-prefixed values so getParameter can answer with strings.  */
  const STRING_ENUMS = new Set(["VERSION", "SHADING_LANGUAGE_VERSION", "VENDOR", "RENDERER"]);
  const STRING_VALS = {
    VERSION: "WebGL 2.0 (stub)",
    SHADING_LANGUAGE_VERSION: "GLSL ES 3.00 (stub)",
    VENDOR: "stub-vendor",
    RENDERER: "stub-renderer",
  };
  const enumOf = new Map();   // name -> value
  const nameOf = new Map();   // value -> name
  let nextEnum = 0x2000;
  const enumValue = (name) => {
    if (!enumOf.has(name)) {
      const v = STRING_ENUMS.has(name) ? `__s:${name}` : nextEnum++;
      enumOf.set(name, v);
      nameOf.set(v, name);
    }
    return enumOf.get(name);
  };
  const base = {
    getParameter(p) {
      if (typeof p === "string" && p.startsWith("__s:")) {
        return STRING_VALS[p.slice(4)];
      }
      const name = typeof p === "number" ? nameOf.get(p) || "" : "";
      if (name.startsWith("ALIASED_") || name === "MAX_VIEWPORT_DIMS") {
        return new Float32Array([16384, 16384]);   // numeric ranges
      }
      if (name === "MAX_ELEMENTS_VERTICES" || name === "MAX_ELEMENTS_INDICES") {
        return 2147483647;
      }
      if (typeof p === "number") return 16384;      // numeric caps
      return {};
    },
    getShaderPrecisionFormat: fun({ rangeMin: 127, rangeMax: 127, precision: 23 }),
    getExtension(p) {
      if (p === "WEBGL_lose_context") return { loseContext() {}, restoreContext() {} };
      return {};
    },
    getSupportedExtensions: fun([]),
    getContextAttributes: fun({ alpha: true, antialias: true, depth: true }),
    getShaderParameter: fun(true),
    getProgramParameter(_p, pname) {
      const n = nameOf.get(pname) || "";
      if (n === "ACTIVE_UNIFORMS" || n === "ACTIVE_ATTRIBUTES" || n === "ATTACHED_SHADERS") return 0;
      return true;                       // LINK_STATUS / DELETE_STATUS / VALIDATE_STATUS
    },
    getActiveUniform: fun({ name: "", size: 0, type: 0 }),
    getActiveAttrib: fun({ name: "", size: 0, type: 0 }),
    getProgramInfoLog: fun(""),
    getShaderInfoLog: fun(""),
    getError: fun(0),
    checkFramebufferStatus: fun(0x8cd5),
  };
  return new Proxy(base, {
    get(t, prop) {
      if (prop in t) return t[prop];
      if (typeof prop === "string" && /^[A-Z][A-Z0-9_]*$/.test(prop)) return enumValue(prop);
      if (typeof prop === "string" && /^(create|make)/.test(prop)) return obj;
      if (typeof prop === "string" && prop.startsWith("get")) return fun(16384);
      if (typeof prop === "string" && prop.startsWith("is")) return fun(false);
      return fun(undefined); // every other GL call is a no-op
    },
  });
}

/* ------------------------------------------------------------ DOM stub -- */
let BOOT_ERRORS = [];
function makeEl(tag = "div") {
  const el = {
    tagName: tag.toUpperCase(),
    style: {},
    dataset: {},
    children: [],
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    attributes: {},
    setAttribute(k, v) { this.attributes[k] = v; },
    getAttribute(k) { return this.attributes[k]; },
    appendChild(c) { this.children.push(c); return c; },
    append(...cs) { this.children.push(...cs); },
    insertBefore(c) { this.children.push(c); return c; },
    removeChild(c) { this.children = this.children.filter((x) => x !== c); },
    remove() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() { return true; },
    querySelector: () => null,
    querySelectorAll: () => [],
    closest: () => null,
    getRootNode: () => globalThis.document,
    setPointerCapture() {}, releasePointerCapture() {}, hasPointerCapture: () => false,
    getBoundingClientRect: () => ({ width: 1024, height: 768, left: 0, top: 0 }),
    focus() {}, blur() {}, click() {},
    cloneNode() { return makeEl(tag); },
  };
  Object.defineProperty(el, "textContent", {
    set(v) { this.__text = String(v); },
    get() { return this.__text || ""; },
  });
  Object.defineProperty(el, "innerHTML", { set(_) {}, get() { return ""; } });
  if (tag === "canvas") {
    el.width = 1024; el.height = 768;
    el.getContext = (kind) => (kind.startsWith("webgl") ? makeGL() : {
      fillRect() {}, clearRect() {}, beginPath() {}, moveTo() {}, lineTo() {},
      stroke() {}, fill() {}, arc() {}, save() {}, restore() {}, translate() {},
      scale() {}, fillText() {}, measureText: () => ({ width: 4 }),
      drawImage() {}, setTransform() {}, closePath() {},
      getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
    });
  }
  return el;
}

const byId = new Map();
globalThis.window = {
  devicePixelRatio: 1,
  innerWidth: 1024,
  innerHeight: 768,
  addEventListener() {},
  removeEventListener() {},
  matchMedia: () => ({ matches: false, addEventListener() {} }),
  requestAnimationFrame(cb) { return setTimeout(cb, 0); },
  cancelAnimationFrame: clearTimeout,
  location: { href: "http://smoke.local/" },
  navigator: { maxTouchPoints: 0 },
};
globalThis.devicePixelRatio = 1;
globalThis.innerWidth = 1024;
globalThis.innerHeight = 768;
globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0);
globalThis.cancelAnimationFrame = clearTimeout;
globalThis.self = globalThis.window;
globalThis.addEventListener = () => {};
globalThis.document = {
  readyState: "complete",
  body: makeEl("body"),
  createElement: (tag) => makeEl(tag),
  createElementNS: (_ns, tag) => makeEl(tag),
  createTextNode: (t) => ({ text: t }),
  getElementById(id) {
    if (!byId.has(id)) {
      const canvasIds = new Set(["stage", "minimap"]);
      byId.set(id, makeEl(canvasIds.has(id) ? "canvas" : "div"));
    }
    return byId.get(id);
  },
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener() {},
  removeEventListener() {},
  hidden: false,
  fonts: { ready: Promise.resolve() },
};

process.on("uncaughtException", (e) => { BOOT_ERRORS.push(e); });
process.on("unhandledRejection", (e) => { BOOT_ERRORS.push(e); });

/* ----------------------------------------------------------------- run -- */
globalThis.window.onerror = (msg, src, line) => {
  BOOT_ERRORS.push(new Error(`onerror: ${msg} @${src}:${line}`));
};

await import("../js/cheyenne.js");
await delay(900);   // let init, first frame and any async tails run

/* the app shows boot-fail cards instead of throwing now; catch those too */
function findBootFail(node, depth = 0) {
  if (depth > 6 || !node) return null;
  if (node.__text && node.__text.includes("failed to start")) return node.__text;
  for (const c of node.children || []) {
    const hit = findBootFail(c, depth + 1);
    if (hit) return hit;
  }
  return null;
}
const card = findBootFail(globalThis.document.body);
if (card) {
  console.error("BOOT-FAIL CARD SHOWN:\n" + card.split("\n").slice(0, 4).join("\n"));
  process.exit(1);
}
if (BOOT_ERRORS.length) {
  const e = BOOT_ERRORS[0];
  console.error("BOOT-FAIL:", e.stack || e.message);
  process.exit(1);
}
console.log("BOOT-OK: init() ran to completion under stubbed DOM/WebGL");
process.exit(0);
