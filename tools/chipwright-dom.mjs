/**
 * chipwright-dom.mjs — a DOM stand-in scoped to chipwright.html.
 *
 * tools/dom-stub.mjs already exists in this repo, but it is built around
 * glendora-app.js: its querySelectorAll() returns [] unconditionally and its
 * getElementById() invents an element for any unknown id. Neither is right
 * here. cw-app.js drives its tab strip through querySelectorAll(".tab-btn")
 * and querySelectorAll(".panel"), and inventing elements would hide exactly
 * the failure this harness exists to catch — a renderer reading an id the
 * markup does not define.
 *
 * So this one seeds the real id set out of chipwright.html and returns null
 * for anything absent, the way Blink does. It is deliberately not a general
 * DOM: it implements the surface cw-app.js touches and nothing more, and it
 * records what it was asked for so the contract test can assert in both
 * directions.
 */

/** Ids the controller looked up, whether or not they existed. */
export const TOUCHED = new Set();
/** Ids a listener was attached to. */
export const WIRED = new Set();
/** Ids the controller read a `.value` or `.checked` from. */
export const READ = new Set();

const REG = new Map();
const TABS = ["dossier", "jtag", "dump", "uefi", "storage", "onewire", "javacard", "arch", "subst", "prime", "refs"];
const VOID_TAGS = new Set(["br", "hr", "img", "input", "meta", "link", "area", "base", "col", "embed", "source", "track", "wbr"]);

const camel = (k) => k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

class El {
  constructor(id, tag) {
    this.id = id ?? "";
    this.tagName = String(tag ?? "div").toUpperCase();
    this._html = "";
    this._value = "";
    this.checked = false;
    this.hidden = false;
    this.tabIndex = 0;
    this.children = [];
    this.dataset = {};
    this.style = {};
    this.className = "";
    this._attrs = {};
    this._listeners = {};
    this.files = [];
    /** Queryable children of this element's own rendered markup. */
    this._kids = [];
    this._parent = null;
  }

  get innerHTML() { return this._html; }
  set innerHTML(v) {
    this._html = String(v);
    /*
     * Materialise ids the controller queries back out of rendered markup.
     * renderPinoutCard() builds #pinRun and #pinOut inside a template string
     * and then wires them in the same call, so a stub that ignored innerHTML
     * would report those ids as missing and the sweep would never exercise
     * them.
     */
    for (const m of this._html.matchAll(/\bid="([^"]+)"/g)) {
      if (!REG.has(m[1])) REG.set(m[1], new El(m[1], "div"));
      REG.get(m[1])._parent = this;
    }
    for (const m of this._html.matchAll(/data-(tab|rep|gate|v)="([^"]*)"/g)) this.dataset[m[1]] = m[2];
    this._buildKids();
  }

  get value() { READ.add(this.id); return this._value; }
  set value(v) { this._value = String(v); }

  /**
   * classList, kept in step with className. renderGates() toggles `.pass` on a
   * gate row from inside a click handler, and dz.classList.add("over") runs on
   * every dragover — without this the sweep throws on the first gate click.
   */
  get classList() {
    const self = this;
    const list = () => self.className.split(/\s+/).filter(Boolean);
    const write = (a) => { self.className = a.join(" ").trim(); };
    return {
      add: (...c) => write([...new Set([...list(), ...c])]),
      remove: (...c) => write(list().filter((x) => !c.includes(x))),
      toggle: (c, force) => {
        const has = list().includes(c);
        const want = force === undefined ? !has : !!force;
        write(want ? [...new Set([...list(), c])] : list().filter((x) => x !== c));
        return want;
      },
      contains: (c) => list().includes(c),
      replace: (a, b) => write(list().map((x) => (x === a ? b : x))),
      get length() { return list().length; },
    };
  }

  setAttribute(k, v) {
    this._attrs[k] = String(v);
    if (k.startsWith("data-")) this.dataset[camel(k.slice(5))] = String(v);
  }
  getAttribute(k) { return this._attrs[k] ?? null; }

  addEventListener(t, fn) { (this._listeners[t] ??= []).push(fn); WIRED.add(this.id); }
  removeEventListener() {}
  dispatch(t, ev = {}) {
    for (const fn of this._listeners[t] ?? []) {
      fn({ preventDefault() {}, stopPropagation() {}, ...ev, target: this, currentTarget: this });
    }
  }
  click() { this.dispatch("click"); }
  focus() {}
  insertAdjacentHTML(pos, html) {
    this._html = pos === "afterbegin" ? html + this._html : this._html + html;
    this._buildKids();
  }

  /*
   * Parse this element's rendered markup into queryable children, keeping them
   * IDENTITY-STABLE across re-renders and preserving nesting.
   *
   * Neither property is cosmetic:
   *
   *  - Identity. report() renders nine section buttons, wires a listener to
   *    each, then re-renders the same nine on every click. A stub that minted
   *    a fresh element per querySelectorAll() handed the sweep objects with no
   *    listeners on them, so every click was a silent no-op and the section
   *    switcher looked verified while never having run. Keying the cache on
   *    the element's own signature reproduces what a real DOM does: the node
   *    the controller wired is the node the test clicks.
   *
   *  - Nesting. renderGates() draws `.gate` rows and then calls
   *    el.querySelectorAll("button[data-v]") on EACH ROW to wire its three
   *    state buttons. A flat scan of the whole subtree makes those buttons
   *    siblings of their row instead of children, the row's query returns
   *    nothing, and the substitution tab's central interaction is never wired
   *    at all — while every other check still passes.
   *
   * This is a tag-level scanner, not an HTML parser: it does not model implied
   * end tags, and it does not need to, because the markup here is generated by
   * this app's own template strings and is therefore well-formed by
   * construction. Anything it did mis-nest would show up as a missing listener
   * in the sweep rather than as a wrong answer.
   */
  _buildKids() {
    this._kids.length = 0;
    /*
     * Nothing in this markup could ever match a selector.
     *
     * Three separate linear tests, NOT one combined pattern. The obvious
     * single regex — /data-|id=|class="[^"]*\bgate\b/ — is quadratic: for
     * every class attribute it consumes to the closing quote, fails to find
     * "gate", then backtracks one character at a time retrying. Tables here
     * carry thousands of class attributes, and that one pattern turned a
     * sub-second render into a three-minute hang.
     */
    const h = this._html;
    if (!h.includes("data-") && !h.includes("id=") && !/\bgate\b/.test(h)) return;
    /*
     * Build only the nodes a selector could match, and parent each to its
     * NEAREST INTERESTING ANCESTOR rather than to its literal parent tag.
     *
     * The collapse is what keeps this harness usable. Materialising an El for
     * every <td> in a 250-row opcode table made a single render quadratic and
     * the sweep took minutes; this yields a few dozen nodes instead. It is
     * faithful for every query cw-app.js makes, because each of them spans
     * exactly one interesting boundary:
     *   #loadStatus -> [data-rep] buttons   (the wrapper is a bare div.row)
     *   .gate row   -> button[data-v]       (the wrapper is a bare span.seg)
     * A bare structural tag between the two carries nothing a selector can key
     * on, so skipping it cannot change which elements a query returns.
     *
     * Nodes are FRESH on every render, never cached across renders. This is
     * the part that is easy to get wrong in either direction:
     *
     *   - Mint a new element per querySelectorAll() and the nodes the
     *     controller wired are not the nodes the test clicks, so every click
     *     is a silent no-op and the section switcher looks verified while
     *     never having run.
     *   - Reuse one element across renders and listeners ACCUMULATE on it,
     *     because report() re-wires the same nine buttons every time it draws
     *     them. Clicks then double per render and the sweep hangs. A real DOM
     *     destroys those nodes when innerHTML is replaced, and so does this.
     *
     * Within a single render, though, a node must be the same object the
     * controller wired and the object the test later queries — hence one pass
     * over the markup building a tree, rather than re-parsing per query.
     */
    const stack = [{ tag: "#root", el: this }];
    const tok = /<(\/?)([a-zA-Z][\w-]*)\b([^>]*)>/g;
    let m;
    while ((m = tok.exec(h)) !== null) {
      const [, closing, rawTag, attrs] = m;
      const tag = rawTag.toLowerCase();
      if (closing) {
        for (let i = stack.length - 1; i > 0; i--) {
          if (stack[i].tag === tag) { stack.length = i; break; }
        }
        continue;
      }
      const id = attrs.match(/\bid="([^"]+)"/)?.[1] ?? "";
      const cls = attrs.match(/\bclass="([^"]*)"/)?.[1] ?? "";
      const data = [...attrs.matchAll(/\bdata-([a-z-]+)="([^"]*)"/g)];
      const interesting = !!id || !!data.length || /\bgate\b/.test(cls);

      let el = null;
      if (interesting) {
        el = new El(id, tag);
        for (const [, k, v] of data) el.dataset[camel(k)] = v;
        el.className = cls;
        const parentEl = stack[stack.length - 1].el;
        el._parent = parentEl;
        if (id && !REG.has(id)) REG.set(id, el);
        parentEl._kids.push(el);
      }
      if (!VOID_TAGS.has(tag)) stack.push({ tag, el: el ?? stack[stack.length - 1].el });
    }
  }

  /** Depth-first over the subtree, because that is what the DOM does. */
  _descendants() {
    const out = [];
    const walk = (el) => { for (const k of el._kids) { out.push(k); walk(k); } };
    walk(this);
    return out;
  }

  querySelectorAll(sel) {
    if (sel === ".tab-btn") return TABS.map((t) => REG.get(`tab-btn-${t}`)).filter(Boolean);
    if (sel === ".panel") return TABS.map((t) => REG.get(`tab-${t}`)).filter(Boolean);
    const kids = this._descendants();
    // [data-x] or [data-x="y"]
    const dm = sel.match(/^\[data-([a-z-]+)(?:="([^"]*)")?\]$/i);
    if (dm) {
      const key = camel(dm[1]);
      return kids.filter((k) => k.dataset[key] !== undefined && (dm[2] === undefined || k.dataset[key] === dm[2]));
    }
    // tag[data-x] — e.g. button[data-v] inside a gate row.
    const tm = sel.match(/^(\w+)\[data-([a-z-]+)(?:="([^"]*)")?\]$/i);
    if (tm) {
      const key = camel(tm[2]);
      return kids.filter((k) => k.tagName === tm[1].toUpperCase() && k.dataset[key] !== undefined &&
        (tm[3] === undefined || k.dataset[key] === tm[3]));
    }
    // bare tag name
    if (/^\w+$/.test(sel)) { const T = sel.toUpperCase(); return kids.filter((k) => k.tagName === T); }
    // .class
    if (sel.startsWith(".")) {
      const cls = sel.slice(1);
      return kids.filter((k) => k.className.split(/\s+/).includes(cls));
    }
    return [];
  }
  querySelector(sel) { return this.querySelectorAll(sel)[0] ?? null; }
  appendChild(c) { this.children.push(c); return c; }
}

/**
 * @param {string[]} ids every id declared in chipwright.html
 * @returns {{document: object, reg: Map<string, El>}}
 */
export function makeDocument(ids) {
  REG.clear(); TOUCHED.clear(); WIRED.clear(); READ.clear();
  for (const id of ids) REG.set(id, new El(id, "div"));
  for (const t of TABS) {
    const b = REG.get(`tab-btn-${t}`);
    if (b) { b.dataset.tab = t; b.tagName = "BUTTON"; }
    const p = REG.get(`tab-${t}`);
    if (p) p.tagName = "SECTION";
  }
  const document = {
    readyState: "complete",
    getElementById(id) {
      TOUCHED.add(id);
      return REG.get(id) ?? null;
    },
    createElement(tag) {
      const e = new El("", tag);
      e.click = () => {};
      return e;
    },
    querySelectorAll(sel) {
      if (sel === ".tab-btn") return TABS.map((t) => REG.get(`tab-btn-${t}`)).filter(Boolean);
      if (sel === ".panel") return TABS.map((t) => REG.get(`tab-${t}`)).filter(Boolean);
      return [];
    },
    querySelector() { return null; },
    addEventListener() {},
    removeEventListener() {},
    body: new El("body", "body"),
    documentElement: new El("html", "html"),
  };
  return { document, reg: REG };
}

/** Install browser globals cw-app.js expects, seeded from the real markup. */
export function install(html, { values = {} } = {}) {
  const ids = [...new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))];
  const { document, reg } = makeDocument(ids);
  for (const [id, el] of reg) {
    const im = html.match(new RegExp(`<input[^>]*id="${id}"[^>]*>`));
    if (im) {
      el.tagName = "INPUT";
      const v = im[0].match(/value="([^"]*)"/);
      el._value = v ? v[1] : "";
      el.checked = /checked/.test(im[0]);
    }
    const sm = html.match(new RegExp(`<select[^>]*id="${id}"[\\s\\S]*?</select>`));
    if (sm) {
      el.tagName = "SELECT";
      const o = sm[0].match(/<option[^>]*value="([^"]*)"/);
      el._value = o ? o[1] : "";
    }
    if (values[id] !== undefined) el._value = values[id];
  }
  globalThis.document = document;
  globalThis.window = globalThis;
  globalThis.TextDecoder = TextDecoder;
  /*
   * Use node's real Blob. A hand-rolled stand-in makes URL.createObjectURL
   * throw a genuine TypeError, which would show up as a bug in the dossier
   * export when the actual fault is in the harness — and a harness that
   * produces false failures gets ignored, which defeats the purpose.
   */
  globalThis.URL = globalThis.URL ?? {};
  globalThis.URL.createObjectURL = () => "blob:chipwright-stub";
  globalThis.URL.revokeObjectURL = () => {};
  globalThis.FileReader = class { readAsArrayBuffer() {} };
  return { document, reg, ids };
}

export { El, REG };
