#!/usr/bin/env node
/**
 * Boot smoke harness for public/apps/cia-museum: stubs DOM + WebGL, serves
 * the real .wrl bytes, and actually RUNS app.js init() — the repo's unit
 * tests only check files/parse counts, so they can never see a boot-time
 * failure (the same class of bug that shipped in cheyenne.js).
 *
 *   node tools/cia-museum-boot-smoke.mjs
 *
 * Exit 0 = init() finished and the loading screen reached its "done" state.
 */
import { setTimeout as delay } from "node:timers/promises";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// CIA_APP_DIR lets the same harness boot an extracted .xdc bundle.
const APP = process.env.CIA_APP_DIR
  ? path.resolve(process.env.CIA_APP_DIR)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "public/apps/cia-museum");

/* ------------------------------------------------------------ GL stub -- */
function makeGL() {
  const fun = (ret) => () => ret;
  const obj = () => ({});
  const STRING_ENUMS = new Set(["VERSION", "SHADING_LANGUAGE_VERSION", "VENDOR", "RENDERER"]);
  const STRING_VALS = {
    VERSION: "WebGL 1.0 (stub)", SHADING_LANGUAGE_VERSION: "GLSL ES 1.00 (stub)",
    VENDOR: "stub-vendor", RENDERER: "stub-renderer",
  };
  const enumOf = new Map();
  const nameOf = new Map();
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
      if (typeof p === "string" && p.startsWith("__s:")) return STRING_VALS[p.slice(4)];
      const name = typeof p === "number" ? nameOf.get(p) || "" : "";
      if (name.startsWith("ALIASED_") || name === "MAX_VIEWPORT_DIMS") return new Float32Array([16384, 16384]);
      if (typeof p === "number") return 16384;
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
    getAttribLocation: fun(0),
    getUniformLocation: fun({}),
  };
  return new Proxy(base, {
    get(t, prop) {
      if (prop in t) return t[prop];
      if (typeof prop === "string" && /^[A-Z][A-Z0-9_]*$/.test(prop)) return enumValue(prop);
      if (typeof prop === "string" && /^(create|make)/.test(prop)) return obj;
      if (typeof prop === "string" && prop.startsWith("get")) return fun(16384);
      if (typeof prop === "string" && prop.startsWith("is")) return fun(false);
      return fun(undefined);
    },
  });
}

/* ------------------------------------------------------------ DOM stub -- */
const BOOT_ERRORS = [];
function makeEl(tag = "div") {
  const el = {
    tagName: tag.toUpperCase(),
    style: {},
    dataset: {},
    children: [],
    attributes: {},
    classList: null,
    hidden: false,
    clientWidth: 800,
    clientHeight: 500,
    parentNode: null,
    firstChild: null,
    setAttribute(k, v) { this.attributes[k] = v; },
    getAttribute(k) { return this.attributes[k]; },
    removeAttribute(k) { delete this.attributes[k]; },
    appendChild(c) { this.children.push(c); this.firstChild = this.children[0]; return c; },
    append(...cs) { this.children.push(...cs); this.firstChild = this.children[0]; },
    prepend(...cs) { this.children.unshift(...cs); this.firstChild = this.children[0]; },
    insertBefore(c) { this.children.push(c); return c; },
    replaceChildren() { this.children = []; },
    removeChild(c) { this.children = this.children.filter((x) => x !== c); this.firstChild = this.children[0] || null; return c; },
    remove() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() { return true; },
    querySelector(sel) {
      // support simple descendant tag selectors like "p" used by app.js
      this.__qs = this.__qs || {};
      const tag = /^[a-z]+$/i.test(sel) ? sel : null;
      if (tag) {
        if (!this.__qs[tag]) this.__qs[tag] = makeEl(tag);
        return this.__qs[tag];
      }
      return null;
    },
    querySelectorAll: () => [],
    closest: () => null,
    getRootNode: () => globalThis.document,
    setPointerCapture() {}, releasePointerCapture() {}, hasPointerCapture: () => false,
    getBoundingClientRect: () => ({ width: 800, height: 500, left: 0, top: 0 }),
    focus() {}, blur() {}, click() {}, scrollIntoView() {},
    cloneNode() { return makeEl(tag); },
  };
  const classes = new Set();
  el.classList = {
    add: (...cs) => cs.forEach((c) => classes.add(c)),
    remove: (...cs) => cs.forEach((c) => classes.delete(c)),
    toggle: (c, force) => {
      const want = force === undefined ? !classes.has(c) : !!force;
      if (want) classes.add(c); else classes.delete(c);
      return want;
    },
    contains: (c) => classes.has(c),
  };
  el.__classes = classes;
  Object.defineProperty(el, "textContent", {
    set(v) { this.__text = String(v); },
    get() { return this.__text || ""; },
  });
  Object.defineProperty(el, "innerHTML", { set(_) {}, get() { return ""; } });
  if (tag === "canvas") {
    el.width = 800; el.height = 500;
    el.getContext = (kind) => (kind.startsWith("webgl") ? makeGL() : null);
  }
  return el;
}

const byId = new Map();
globalThis.window = {
  devicePixelRatio: 1,
  innerWidth: 1280,
  innerHeight: 800,
  addEventListener() {},
  removeEventListener() {},
  matchMedia: () => ({ matches: false, addEventListener() {} }),
  requestAnimationFrame(cb) { return setTimeout(cb, 0); },
  cancelAnimationFrame: clearTimeout,
  location: { href: "http://smoke.local/" },
  navigator: { maxTouchPoints: 0 },
};
globalThis.devicePixelRatio = 1;
globalThis.innerWidth = 1280;
globalThis.innerHeight = 800;
globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0);
globalThis.cancelAnimationFrame = clearTimeout;
globalThis.self = globalThis.window;
globalThis.addEventListener = () => {};
globalThis.ResizeObserver = class {
  constructor(cb) { this.cb = cb; }
  observe() {}
  unobserve() {}
  disconnect() {}
};
globalThis.document = {
  readyState: "complete",
  hidden: false,
  body: makeEl("body"),
  activeElement: null,
  createElement: (tag) => makeEl(tag),
  createElementNS: (_ns, tag) => makeEl(tag),
  createTextNode: (t) => ({ text: t }),
  getElementById(id) {
    if (!byId.has(id)) byId.set(id, makeEl(id.endsWith("-canvas") ? "canvas" : "div"));
    return byId.get(id);
  },
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener() {},
  removeEventListener() {},
  fonts: { ready: Promise.resolve() },
};

/* fetch against the app directory, like a webxdc host serving the zip */
globalThis.fetch = async (url) => {
  const rel = String(url).replace(/^\.\//, "");
  const abs = path.join(APP, rel);
  try {
    const text = await readFile(abs, "utf8");
    return { ok: true, status: 200, text: async () => text };
  } catch {
    return { ok: false, status: 404, text: async () => "" };
  }
};

const consoleErrors = [];
const origError = console.error;
console.error = (...args) => { consoleErrors.push(args.map(String).join(" ")); origError(...args); };

process.on("uncaughtException", (e) => { BOOT_ERRORS.push(e); });
process.on("unhandledRejection", (e) => { BOOT_ERRORS.push(e); });

/* ----------------------------------------------------------------- run -- */
await import("../public/apps/cia-museum/app.js");
await delay(1500);   // init(): two model loads + a few animation frames

const loading = byId.get("loading");
const message = byId.get("loading-message");
const msgText = message ? message.__text || "" : "";

if (msgText.startsWith("Unable to initialize") || (loading && !loading.__classes.has("done"))) {
  console.error("BOOT-FAIL: loading screen stuck.");
  console.error("  loading-message:", JSON.stringify(msgText));
  for (const c of consoleErrors.slice(0, 3)) console.error("  console.error:", c.slice(0, 400));
  process.exit(1);
}
if (BOOT_ERRORS.length) {
  const e = BOOT_ERRORS[0];
  console.error("BOOT-FAIL:", e.stack || e.message);
  process.exit(1);
}
console.log(`BOOT-OK: museum init() completed (loading-message: “${msgText}”)`);
const campus = byId.get("campus-canvas");
console.log(`  campus canvas: ${campus.width}x${campus.height}`);
process.exit(0);
