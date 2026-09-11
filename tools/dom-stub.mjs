/**
 * Minimal DOM stand-in so tools/check_ghs.mjs can execute the page controller
 * (js/glendora-app.js) in node.  Only what that module touches at import time
 * is implemented: element lookup by id, listener registration, innerHTML /
 * textContent assignment, and dataset.  There is no WebGL context here, so the
 * three.js renderer construction is expected to fail — the caller asserts that
 * everything up to it ran.
 */

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

export function installDomStub() {
  TOUCHED.clear();
  byId.clear();
  const document = {
    body: new El("body"),
    documentElement: new El("html"),
    pointerLockElement: null,
    getElementById(id) {
      let el = byId.get(id);
      if (!el) {
        el = new El("div", id);
        byId.set(id, el);
      }
      return el;
    },
    createElement(tag) {
      const el = new El(tag);
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
  globalThis.location = globalThis.location || { hash: "", href: "", reload() {} };
  return { document, TOUCHED, byId, created };
}

export { TOUCHED, byId, El };
