/**
 * ghidra-wasm.js — thin client for the Ghidra decompiler compiled to
 * WebAssembly (@mauricelam/ghidra-decompiler-wasm, Apache-2.0).
 *
 * The module is emscripten output with a small C++ bridge exported as
 * `init_decompiler`, `decompile_pcode`, `detect_architecture` and
 * `free_string`.  It ships SLEIGH `.sla` binaries in a memory buffer instead of
 * touching a filesystem, so all we have to do is hand it:
 *
 *   - the compiled SLEIGH spec for the processor (.sla)  → as a byte buffer
 *   - the processor spec (.pspec) and compiler spec (.cspec) → as text
 *   - a `<binaryimage>` XML blob holding the raw bytes at a load address
 *   - a function to decompile, given as a symbol name or an address
 *
 * Everything runs in this tab. No sample bytes leave the browser.
 */

const DEFAULT_ROOT = new URL("../wasm/ghidra/", import.meta.url);

export class GhidraWasm {
  /**
   * @param {object} [opts]
   * @param {string|URL} [opts.root] base URL of the vendored wasm bundle
   * @param {(msg:string, level?:string)=>void} [opts.log]
   */
  constructor(opts = {}) {
    this.root = new URL(opts.root || DEFAULT_ROOT, globalThis.location?.href || "http://localhost/");
    this.log = opts.log || (() => {});
    // Injectable for non-DOM hosts (the verification harness imports the UMD
    // bundle with require() and hands back the instantiated module).
    this._loadModule = opts.loadModule || null;
    this.module = null;
    this.languages = [];
    this._specCache = new Map();
    this._loading = null;
    this.stats = { decompiles: 0, ms: 0, bytes: 0 };
  }

  get ready() { return !!this.module; }

  /** Load and initialise the wasm module. Idempotent. */
  async load() {
    if (this._loading) return this._loading;
    this._loading = (async () => {
      const t0 = performance.now();
      this.log("fetching processor list", "info");
      const res = await fetch(new URL("processors.json", this.root));
      if (!res.ok) throw new Error(`processors.json: HTTP ${res.status}`);
      this.languages = await res.json();

      this.log("instantiating ghidra_decompiler.wasm", "info");
      if (this._loadModule) {
        this.module = await this._loadModule(this);
      } else {
        await this._ensureGlobal();
        this.module = await globalThis.GhidraDecompiler({
          locateFile: (p) => new URL(p, this.root).href,
          print: (s) => this.log(s, "ghidra"),
          printErr: (s) => this.log(s, "error"),
        });
      }
      this.module._init_decompiler();
      if (!this.module.HEAPU8) throw new Error("wasm loaded but HEAPU8 missing");
      this.log(`ghidra decompiler ready in ${Math.round(performance.now() - t0)} ms`, "ok");
      return this;
    })().catch((err) => {
      this._loading = null;
      throw err;
    });
    return this._loading;
  }

  /** The bundle is a classic UMD script, so it has to be injected, not imported. */
  async _ensureGlobal() {
    if (globalThis.GhidraDecompiler) return;
    const src = new URL("ghidra_decompiler.js", this.root).href;
    await new Promise((resolve, reject) => {
      const el = document.createElement("script");
      el.src = src;
      el.onload = resolve;
      el.onerror = () => reject(new Error(`failed to load ${src}`));
      document.head.appendChild(el);
    });
    if (!globalThis.GhidraDecompiler) throw new Error("GhidraDecompiler global not defined");
  }

  /** Languages whose processor spec we actually vendored. */
  languagesFor(kind) {
    return this.languages.filter((l) => l.id.endsWith(kind));
  }

  findLanguage(id) {
    return this.languages.find((l) => l.id === id) || null;
  }

  async specs(langId, compilerId) {
    const key = `${langId}|${compilerId || ""}`;
    if (this._specCache.has(key)) return this._specCache.get(key);
    const lang = this.findLanguage(langId);
    if (!lang) throw new Error(`unknown language ${langId}`);
    const compiler = compilerId ? lang.compilers.find((c) => c.id === compilerId) : lang.compilers[0];
    if (!compiler) throw new Error(`language ${langId} has no compiler ${compilerId}`);

    const [slaRes, pspecRes, cspecRes] = await Promise.all([
      fetch(new URL(lang.sla, this.root)),
      fetch(new URL(lang.pspec, this.root)),
      fetch(new URL(compiler.spec, this.root)),
    ]);
    if (!slaRes.ok || !pspecRes.ok || !cspecRes.ok) throw new Error("failed to fetch SLEIGH specs");
    const specs = {
      lang,
      compiler,
      sla: new Uint8Array(await slaRes.arrayBuffer()),
      pspec: await pspecRes.text(),
      cspec: await cspecRes.text(),
    };
    this._specCache.set(key, specs);
    return specs;
  }

  /**
   * Decompile one function out of a flat blob.
   *
   * @param {Uint8Array} bytes
   * @param {object} o
   * @param {string} o.lang        e.g. "x86:LE:16:Real Mode"
   * @param {string} [o.compiler]  compiler spec id
   * @param {string|number} o.base load address of byte 0
   * @param {string} o.func        function to decompile (symbol name or "0x7c0e")
   * @returns {Promise<{text:string, ms:number, lang:string, compiler:string}>}
   */
  async decompile(bytes, { lang, compiler, base = 0, func }) {
    if (!this.module) await this.load();
    const specs = await this.specs(lang, compiler);
    const t0 = performance.now();

    const slaPtr = this.module._malloc(specs.sla.length);
    this.module.HEAPU8.set(specs.sla, slaPtr);
    try {
      const resPtr = this.module.ccall(
        "decompile_pcode",
        "number",
        ["number", "number", "string", "string", "string", "string"],
        [slaPtr, specs.sla.length, specs.pspec, specs.cspec, imageXml(bytes, base, lang), String(func)]
      );
      const text = this.module.UTF8ToString(resPtr);
      this.module._free_string(resPtr);
      const ms = performance.now() - t0;
      this.stats.decompiles++;
      this.stats.ms += ms;
      this.stats.bytes = Math.max(this.stats.bytes, bytes.length);
      return { text, ms, lang: specs.lang.id, compiler: specs.compiler.name };
    } finally {
      this.module._free(slaPtr);
    }
  }

  /** Ask the bridge to sniff an ELF/PE header. */
  async detect(bytes) {
    if (!this.module) await this.load();
    const ptr = this.module._malloc(bytes.length);
    this.module.HEAPU8.set(bytes, ptr);
    try {
      const id = this.module.ccall("detect_architecture", "string", ["number", "number"], [ptr, bytes.length]);
      return id || null;
    } finally {
      this.module._free(ptr);
    }
  }
}

/**
 * `<binaryimage>` document the bridge parses.  Ghidra reads a little past the
 * end of a function, so 32 bytes of zero padding keep the decompiler from
 * running off the image on short samples.
 */
export function imageXml(bytes, base, archId) {
  const b = typeof base === "string" ? Number.parseInt(base, 16) : base;
  const hex = [];
  for (let i = 0; i < bytes.length; i++) hex.push(bytes[i].toString(16).padStart(2, "0"));
  for (let i = 0; i < 32; i++) hex.push("00");
  return `<binaryimage arch="${archId}">\n<bytechunk space="ram" offset="0x${(b >>> 0).toString(16)}">\n${hex.join("")}\n</bytechunk>\n</binaryimage>`;
}
