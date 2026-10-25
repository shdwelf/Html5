#!/usr/bin/env node
/**
 * cdp-browser.mjs — Playwright 1.64, disassembled and converted to plain
 * JavaScript for the slice this repository actually uses.
 *
 * The disassembly (tools/playwright164/disassemble.mjs, register in
 * docs/playwright164-evidence/) shows what playwright-core@1.64.1 is: a
 * TypeScript monorepo compiled to two esbuild bundles — a 51-module client
 * speaking a channel protocol to a 154-module server, which drives Chromium
 * over CDP (--remote-debugging-pipe), Firefox over Juggler and WebKit over
 * its own protocol, with injected in-page scripts doing selector parsing
 * and actionability. tools/wiki-workspace/browser-smoke.mjs only ever used
 * the Chromium slice: launch, goto, CSS/role locators, fill/click/check,
 * evaluate/waitForFunction, screenshots, downloads, setInputFiles.
 *
 * This module re-implements exactly that slice in dependency-free
 * JavaScript (Node >= 20 built-ins + the global WebSocket), talking CDP
 * directly to a Chromium the caller supplies (CHROMIUM_EXECUTABLE or
 * @sparticuz/chromium, the same binary sources lib-browser.mjs uses).
 * It is NOT a Playwright replacement: no Firefox/WebKit, no tracing/HAR/
 * video, no network interception, no storage-state, no test runner, and
 * actionability is polling for existence/visibility rather than
 * Playwright's full hit-target/stability engine. What is converted is
 * verified end-to-end in tests/playwright164-browser.mjs (real Chromium,
 * skips cleanly when the binary deps are absent) and at protocol level in
 * tests/playwright164.test.mjs (fake transport, always runs).
 */
import {spawn} from 'node:child_process';
import {existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const DEFAULT_TIMEOUT = 30_000;

/* ------------------------------------------------------------------ */
/* CDP transport: JSON messages over a WebSocket-like socket.          */
/* ------------------------------------------------------------------ */
export class CdpConnection {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    this.handlers = []; // {method, sessionId|undefined, fn}
    socket.addEventListener('message', (ev) => this._onMessage(ev.data));
    socket.addEventListener('close', () => {
      for (const {reject} of this.pending.values()) reject(new Error('CDP connection closed'));
      this.pending.clear();
    });
  }

  send(method, params = {}, sessionId) {
    const id = this.nextId++;
    const payload = {id, method, params};
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, {resolve, reject});
      this.socket.send(JSON.stringify(payload));
    });
  }

  /** Subscribe to an event; returns an unsubscribe function. */
  on(method, fn, sessionId) {
    const h = {method, fn, sessionId};
    this.handlers.push(h);
    return () => { this.handlers = this.handlers.filter((x) => x !== h); };
  }

  _onMessage(data) {
    let msg;
    try { msg = JSON.parse(data); } catch { return; }
    if (msg.id !== undefined && this.pending.has(msg.id)) {
      const {resolve, reject} = this.pending.get(msg.id);
      this.pending.delete(msg.id);
      if (msg.error) reject(new Error(`CDP ${msg.error.message || 'error'}${msg.error.data ? `: ${msg.error.data}` : ''}`));
      else resolve(msg.result ?? {});
      return;
    }
    if (msg.method) {
      for (const h of [...this.handlers]) {
        if (h.method === msg.method && (h.sessionId === undefined || h.sessionId === msg.sessionId)) {
          try { h.fn(msg.params ?? {}, msg); } catch { /* event handlers must not break dispatch */ }
        }
      }
    }
  }

  close() { try { this.socket.close(); } catch { /* already closed */ } }
}

async function connectWebSocket(url, WebSocketImpl, timeoutMs) {
  const WS = WebSocketImpl ?? globalThis.WebSocket;
  if (!WS) throw new Error('No WebSocket implementation: use Node >= 22 (global WebSocket) or pass webSocketImpl');
  const socket = new WS(url);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out connecting to ${url}`)), timeoutMs);
    socket.addEventListener('open', () => { clearTimeout(timer); resolve(); }, {once: true});
    socket.addEventListener('error', (e) => { clearTimeout(timer); reject(new Error(`WebSocket error connecting to ${url}: ${e.message ?? e.type ?? 'unknown'}`)); }, {once: true});
  });
  return new CdpConnection(socket);
}

/* ------------------------------------------------------------------ */
/* In-page helpers, injected as expression strings (the same trick     */
/* Playwright's packages/injected plays, at smoke-test scale).         */
/* ------------------------------------------------------------------ */
const ROLE_PICKER = `(() => {
  const roleOf = (el) => {
    const r = el.getAttribute && el.getAttribute('role');
    if (r) return r;
    const t = (el.tagName || '').toLowerCase();
    if (t === 'button') return 'button';
    if (t === 'a' && el.hasAttribute('href')) return 'link';
    if (t === 'input') {
      const ty = (el.getAttribute('type') || 'text').toLowerCase();
      if (['button', 'submit', 'reset', 'image'].includes(ty)) return 'button';
      if (ty === 'checkbox') return 'checkbox';
      if (ty === 'radio') return 'radio';
      return 'textbox';
    }
    if (t === 'textarea') return 'textbox';
    if (t === 'select') return 'combobox';
    if (/^h[1-6]$/.test(t)) return 'heading';
    if (t === 'img') return 'img';
    return null;
  };
  const nameOf = (el) => ((el.getAttribute && (el.getAttribute('aria-label') || el.getAttribute('title'))) ||
    (el.tagName === 'INPUT' ? (el.value || '') : (el.innerText || el.textContent || ''))).trim().replace(/\\s+/g, ' ');
  return {roleOf, nameOf};
})()`;

function cssResolver(selector) {
  const sel = JSON.stringify(selector);
  return {
    kind: 'css', selector,
    countExpr: `document.querySelectorAll(${sel}).length`,
    pickExpr: (i) => `document.querySelectorAll(${sel})[${i}] ?? null`,
  };
}

function roleResolver(role, name) {
  const nameMatch = name === undefined
    ? 'true'
    : name instanceof RegExp
      ? `new RegExp(${JSON.stringify(name.source)}, ${JSON.stringify(name.flags)}).test(nameOf(el))`
      : `nameOf(el).toLowerCase().includes(${JSON.stringify(String(name).toLowerCase())})`;
  const all = `(() => { const {roleOf, nameOf} = ${ROLE_PICKER};
    return [...document.querySelectorAll('*')].filter((el) => roleOf(el) === ${JSON.stringify(role)} && ${nameMatch}); })()`;
  return {
    kind: 'role', selector: `role=${role}${name !== undefined ? `[name=${String(name)}]` : ''}`,
    countExpr: `${all}.length`,
    pickExpr: (i) => `${all}[${i}] ?? null`,
  };
}

/* ------------------------------------------------------------------ */
/* Locator                                                             */
/* ------------------------------------------------------------------ */
export class Locator {
  constructor(page, resolver, index = 0) {
    this.page = page;
    this.resolver = resolver;
    this.index = index;
  }

  first() { return new Locator(this.page, this.resolver, 0); }
  nth(i) { return new Locator(this.page, this.resolver, i); }

  async count() { return this.page._evaluateExpr(this.resolver.countExpr); }

  /** Run `body(el)` in-page once the picked element exists; returns its value. */
  async _act(body, {timeout = DEFAULT_TIMEOUT} = {}) {
    const expr = `(() => { const el = ${this.resolver.pickExpr(this.index)};
      if (!el) return {__pwMissing: true}; return (${body})(el); })()`;
    const deadline = Date.now() + timeout;
    for (;;) {
      const value = await this.page._evaluateExpr(expr);
      if (!value || value.__pwMissing !== true) return value;
      if (Date.now() > deadline) throw new Error(`locator.${this.resolver.selector}: no element after ${timeout}ms`);
      await sleep(100);
    }
  }

  async click(options = {}) {
    await this._act((el) => { el.scrollIntoView({block: 'center', inline: 'center'}); el.click(); return true; }, options);
  }

  async fill(value, options = {}) {
    // The value is JSON-interpolated into the action expression (the action
    // itself runs in the page and cannot close over Node variables).
    const body = `(el) => {
      el.focus();
      const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype
        : el instanceof HTMLInputElement ? HTMLInputElement.prototype : null;
      const setter = proto && Object.getOwnPropertyDescriptor(proto, 'value')?.set;
      const v = ${JSON.stringify(String(value))};
      if (setter) setter.call(el, v); else el.value = v;
      el.dispatchEvent(new InputEvent('input', {bubbles: true, data: v, inputType: 'insertText'}));
      el.dispatchEvent(new Event('change', {bubbles: true}));
      return true;
    }`;
    await this._act(body, options);
  }

  async check(options = {}) {
    await this._act((el) => {
      if (el.checked !== true) el.click();
      if (el.checked !== true) {
        el.checked = true;
        el.dispatchEvent(new Event('change', {bubbles: true}));
      }
      return true;
    }, options);
  }

  async innerText(options = {}) { return this._act((el) => el.innerText, options); }
  async textContent(options = {}) { return this._act((el) => el.textContent, options); }
  async getAttribute(name, options = {}) {
    return this._act((el) => el.getAttribute(name), options);
  }

  /**
   * Playwright: setInputFiles({name, mimeType, buffer} | path | array).
   * Converted via CDP DOM.setFileInputFiles on the first CSS match — the
   * payload form is written to a temp file the browser can read.
   */
  async setInputFiles(files) {
    if (this.resolver.kind !== 'css') throw new Error('setInputFiles is only converted for CSS locators');
    const list = Array.isArray(files) ? files : [files];
    const dir = this.page.browser._tempDir();
    const paths = list.map((f) => {
      if (typeof f === 'string') return f;
      // Preserve the payload's name exactly: input.files[0].name is how the
      // page (and Playwright callers) identify the upload.
      const safe = path.basename(f.name || 'upload.bin').replace(/[^\w.\-]+/g, '_');
      const p = path.join(dir, safe);
      writeFileSync(p, f.buffer);
      return p;
    });
    const conn = this.page.browser.connection;
    const {root} = await conn.send('DOM.getDocument', {depth: 1}, this.page.sessionId);
    const {nodeId} = await conn.send('DOM.querySelector', {nodeId: root.nodeId, selector: this.resolver.selector}, this.page.sessionId);
    if (!nodeId) throw new Error(`locator.${this.resolver.selector}: no element for setInputFiles`);
    await conn.send('DOM.setFileInputFiles', {files: paths, nodeId}, this.page.sessionId);
  }
}

/* ------------------------------------------------------------------ */
/* Download                                                            */
/* ------------------------------------------------------------------ */
export class Download {
  constructor(browser, {guid, url, suggestedFilename}) {
    this._browser = browser;
    this.guid = guid;
    this._url = url;
    this._suggestedFilename = suggestedFilename;
    this.state = 'inProgress';
    this._done = new Promise((resolve, reject) => { this._resolve = resolve; this._reject = reject; });
    this._done.catch(() => {}); // callers may never await path()
  }

  url() { return this._url; }
  suggestedFilename() { return this._suggestedFilename; }

  async path() {
    await this._done;
    if (this.state === 'canceled') throw new Error(`Download canceled: ${this._suggestedFilename}`);
    return path.join(this._browser.downloadsPath, this._suggestedFilename);
  }

  _progress(state) {
    this.state = state;
    if (state === 'completed') this._resolve();
    else if (state === 'canceled') this._reject(new Error(`Download canceled: ${this._suggestedFilename}`));
  }
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export class Page {
  constructor(browser, sessionId, targetId) {
    this.browser = browser;
    this.sessionId = sessionId;
    this.targetId = targetId;
    this._listeners = {pageerror: [], console: []};
    this.request = {
      get: async (url) => {
        const res = await fetch(url);
        return {
          ok: res.ok, status: res.status,
          text: () => res.text(), json: () => res.json(),
        };
      },
    };
  }

  async _init(viewport) {
    const conn = this.browser.connection;
    await conn.send('Page.enable', {}, this.sessionId);
    await conn.send('Runtime.enable', {}, this.sessionId);
    await conn.send('DOM.enable', {}, this.sessionId);
    conn.on('Runtime.exceptionThrown', (params) => {
      const d = params.exceptionDetails;
      const message = d?.exception?.description || d?.text || 'Page error';
      const err = new Error(message.split('\n')[0]);
      err.stack = message;
      for (const fn of this._listeners.pageerror) fn(err);
    }, this.sessionId);
    conn.on('Runtime.consoleAPICalled', (params) => {
      const msg = {
        type: () => params.type,
        text: () => (params.args ?? []).map((a) => a.value ?? a.description ?? '').join(' '),
      };
      for (const fn of this._listeners.console) fn(msg);
    }, this.sessionId);
    if (viewport) await this.setViewportSize(viewport);
  }

  on(event, fn) {
    if (!this._listeners[event]) throw new Error(`page.on('${event}') is not converted (pageerror, console)`);
    this._listeners[event].push(fn);
    return this;
  }

  waitForEvent(event) {
    if (event === 'download') return this.browser._waitForDownload();
    throw new Error(`page.waitForEvent('${event}') is not converted (download)`);
  }

  async _evaluateExpr(expression) {
    const {result, exceptionDetails} = await this.browser.connection.send('Runtime.evaluate', {
      expression, awaitPromise: true, returnByValue: true,
    }, this.sessionId);
    if (exceptionDetails) {
      const message = exceptionDetails.exception?.description || exceptionDetails.text || 'Evaluation failed';
      throw new Error(message.split('\n')[0]);
    }
    return result?.value;
  }

  async evaluate(fn, arg) {
    const expression = typeof fn === 'string'
      ? fn
      : `(${fn.toString()})(${arg === undefined ? '' : JSON.stringify(arg)})`;
    return this._evaluateExpr(expression);
  }

  _loadPromise(what, timeout) {
    const conn = this.browser.connection;
    const loaded = new Promise((resolve, reject) => {
      const off = conn.on('Page.loadEventFired', () => { clearTimeout(timer); off(); resolve(); }, this.sessionId);
      var timer = setTimeout(() => { off(); reject(new Error(`${what} timed out after ${timeout}ms`)); }, timeout);
    });
    loaded.catch(() => {});
    return loaded;
  }

  async goto(url, {timeout = DEFAULT_TIMEOUT} = {}) {
    const loaded = this._loadPromise(`page.goto ${url}`, timeout);
    const {errorText} = await this.browser.connection.send('Page.navigate', {url}, this.sessionId);
    if (errorText) throw new Error(`page.goto failed: ${errorText} (${url})`);
    await loaded;
  }

  async reload({timeout = DEFAULT_TIMEOUT} = {}) {
    const loaded = this._loadPromise('page.reload', timeout);
    await this.browser.connection.send('Page.reload', {}, this.sessionId);
    await loaded;
  }

  async waitForSelector(selector, {timeout = DEFAULT_TIMEOUT, state = 'visible'} = {}) {
    const sel = JSON.stringify(selector);
    const isVisible = `(el) => !!(el && (el.offsetWidth || el.offsetHeight || el.getClientRects().length) &&
      getComputedStyle(el).visibility !== 'hidden' && getComputedStyle(el).display !== 'none')`;
    const expr = state === 'attached'
      ? `!!document.querySelector(${sel})`
      : `(${isVisible})(document.querySelector(${sel}))`;
    const deadline = Date.now() + timeout;
    for (;;) {
      if (await this._evaluateExpr(expr)) return;
      if (Date.now() > deadline) throw new Error(`page.waitForSelector timed out after ${timeout}ms: ${selector}`);
      await sleep(100);
    }
  }

  async waitForFunction(fn, arg, options) {
    if (arg && options === undefined && (arg.timeout !== undefined || arg.polling !== undefined)) {
      options = arg; arg = undefined;
    }
    const {timeout = DEFAULT_TIMEOUT, polling = 100} = options ?? {};
    const deadline = Date.now() + timeout;
    for (;;) {
      const value = await this.evaluate(fn, arg);
      if (value) return;
      if (Date.now() > deadline) throw new Error(`page.waitForFunction timed out after ${timeout}ms`);
      await sleep(polling);
    }
  }

  async waitForURL(pattern, {timeout = DEFAULT_TIMEOUT} = {}) {
    const deadline = Date.now() + timeout;
    for (;;) {
      const href = await this._evaluateExpr('location.href');
      const hit = pattern instanceof RegExp ? pattern.test(href) : href.includes(String(pattern));
      if (hit) return;
      if (Date.now() > deadline) throw new Error(`page.waitForURL timed out after ${timeout}ms: ${pattern} (at ${href})`);
      await sleep(100);
    }
  }

  locator(selector) { return new Locator(this, cssResolver(selector)); }
  getByRole(role, {name} = {}) { return new Locator(this, roleResolver(role, name)); }

  async setViewportSize({width, height}) {
    await this.browser.connection.send('Emulation.setDeviceMetricsOverride', {
      width, height, deviceScaleFactor: 1, mobile: false,
    }, this.sessionId);
  }

  async screenshot({path: filePath, fullPage = false} = {}) {
    const conn = this.browser.connection;
    const params = {format: 'png', fromSurface: true, captureBeyondViewport: !!fullPage};
    if (fullPage) {
      const {contentSize} = await conn.send('Page.getLayoutMetrics', {}, this.sessionId);
      if (contentSize) params.clip = {x: 0, y: 0, width: contentSize.width, height: contentSize.height, scale: 1};
    }
    const {data} = await conn.send('Page.captureScreenshot', params, this.sessionId);
    const buf = Buffer.from(data, 'base64');
    if (filePath) writeFileSync(filePath, buf);
    return buf;
  }

  waitForTimeout(ms) { return sleep(ms); }

  async close() {
    await this.browser.connection.send('Target.closeTarget', {targetId: this.targetId});
  }
}

/* ------------------------------------------------------------------ */
/* Browser                                                             */
/* ------------------------------------------------------------------ */
export class Browser {
  constructor(connection, {downloadsPath, process: proc, userDataDir} = {}) {
    this.connection = connection;
    this.downloadsPath = downloadsPath ?? mkdtempSync(path.join(tmpdir(), 'cdp-downloads-'));
    this._process = proc;
    this._userDataDir = userDataDir;
    this._tempDirs = [];
    this._downloads = new Map();
    this._downloadWaiters = [];
    this._closed = false;
    const begin = (params) => {
      // Chrome reports each download on BOTH the Page session and the
      // browser target; dedupe by guid or the waiter's Download never sees
      // its progress events (they land on the overwritten map entry).
      if (this._downloads.has(params.guid)) return;
      const dl = new Download(this, params);
      this._downloads.set(params.guid, dl);
      for (const resolve of this._downloadWaiters.splice(0)) resolve(dl);
    };
    const progress = (params) => this._downloads.get(params.guid)?._progress(params.state);
    connection.on('Browser.downloadWillBegin', begin);
    connection.on('Browser.downloadProgress', progress);
    connection.on('Page.downloadWillBegin', begin);
    connection.on('Page.downloadProgress', progress);
  }

  _tempDir() {
    const dir = mkdtempSync(path.join(tmpdir(), 'cdp-upload-'));
    this._tempDirs.push(dir);
    return dir;
  }

  _waitForDownload() {
    return new Promise((resolve) => this._downloadWaiters.push(resolve));
  }

  async newPage({viewport} = {}) {
    const conn = this.connection;
    const {targetId} = await conn.send('Target.createTarget', {url: 'about:blank'});
    const {sessionId} = await conn.send('Target.attachToTarget', {targetId, flatten: true});
    const page = new Page(this, sessionId, targetId);
    await page._init(viewport);
    return page;
  }

  async close() {
    if (this._closed) return;
    this._closed = true;
    try { await this.connection.send('Browser.close', {}); } catch { /* shutting down anyway */ }
    this.connection.close();
    if (this._process && !this._process.killed) this._process.kill('SIGTERM');
    for (const dir of [this._userDataDir, ...this._tempDirs]) {
      if (dir) { try { rmSync(dir, {recursive: true, force: true}); } catch { /* best effort */ } }
    }
  }
}

/* ------------------------------------------------------------------ */
/* Launch: spawn Chromium, read its DevTools WebSocket URL, attach.    */
/* ------------------------------------------------------------------ */
export function chromiumLaunchArgs({executablePath, userDataDir, args = [], headless = true}) {
  return [
    ...(headless ? ['--headless=new'] : []),
    '--remote-debugging-port=0',
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    ...args,
  ];
}

export async function launchChromium({
  executablePath,
  args = [],
  headless = true,
  downloadsPath,
  timeout = DEFAULT_TIMEOUT,
  env,
  webSocketImpl,
} = {}) {
  if (!executablePath || !existsSync(executablePath)) {
    throw new Error(`launchChromium: Chromium executable not found: ${executablePath} (set CHROMIUM_EXECUTABLE or use @sparticuz/chromium)`);
  }
  const userDataDir = mkdtempSync(path.join(tmpdir(), 'cdp-profile-'));
  const proc = spawn(executablePath, chromiumLaunchArgs({executablePath, userDataDir, args, headless}), {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: env ?? process.env,
  });
  let stderr = '';
  const wsUrl = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out waiting for DevTools endpoint. Chromium stderr: ${stderr.slice(-500)}`)), timeout);
    proc.stderr.on('data', (chunk) => {
      stderr += chunk;
      const m = stderr.match(/DevTools listening on (ws:\/\/\S+)/);
      if (m) { clearTimeout(timer); resolve(m[1]); }
    });
    proc.on('exit', (code) => { clearTimeout(timer); reject(new Error(`Chromium exited (${code}) before DevTools was ready. stderr: ${stderr.slice(-500)}`)); });
    proc.on('error', (e) => { clearTimeout(timer); reject(e); });
  });
  const connection = await connectWebSocket(wsUrl, webSocketImpl, timeout);
  await connection.send('Target.setDiscoverTargets', {discover: true});
  const browser = new Browser(connection, {downloadsPath, process: proc, userDataDir});
  await connection.send('Browser.setDownloadBehavior', {
    behavior: 'allow', downloadPath: browser.downloadsPath, eventsEnabled: true,
  });
  return browser;
}
