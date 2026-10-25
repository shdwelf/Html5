/**
 * Playwright 1.64 disassembly + JavaScript conversion, protocol level.
 *
 * The disassembler is pinned against a synthetic bundle (and against the
 * committed 1.64.1 register), and the converted CDP client
 * (tools/wiki-workspace/cdp-browser.mjs) is exercised over a fake
 * WebSocket transport that scripts CDP replies — no browser needed.
 * Real-Chromium proof lives in tests/playwright164-browser.mjs.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {parseBundleModules, parseProtocolDomains, disassemblePackage} from '../tools/playwright164/disassemble.mjs';
import {CdpConnection, Browser, Page, chromiumLaunchArgs} from '../tools/wiki-workspace/cdp-browser.mjs';

const root = path.resolve(import.meta.dirname, '..');

test('disassembler splits an esbuild bundle on its module banners', () => {
  const bundle = [
    '"use strict";',
    '// packages/isomorphic/cssParser.ts',
    'a();', 'b();',
    '// packages/playwright-core/src/client/locator.ts',
    'c();',
    '// node_modules/ws/lib/websocket.js',
    'd();', 'e();', 'f();',
  ].join('\n');
  const {totalLines, modules} = parseBundleModules(bundle);
  assert.equal(totalLines, 10);
  assert.deepEqual(modules.map((m) => [m.path, m.startLine, m.lines]), [
    ['packages/isomorphic/cssParser.ts', 2, 3],
    ['packages/playwright-core/src/client/locator.ts', 5, 2],
    ['node_modules/ws/lib/websocket.js', 7, 4],
  ]);
});

test('disassembler reads CDP domains out of protocol.d.ts', () => {
  const dts = 'export namespace Protocol {\n  export namespace Page {\n  }\n  export namespace Runtime {\n  }\n}';
  assert.deepEqual(parseProtocolDomains(dts), ['Page', 'Runtime']);
});

test('disassemblePackage reports identity, browsers and bundle stats for a fixture package', (t) => {
  const dir = mkdtempSync(path.join(tmpdir(), 'pw-fixture-'));
  t.after(() => rmSync(dir, {recursive: true, force: true}));
  const put = (rel, text) => { const f = path.join(dir, rel); mkdirSync(path.dirname(f), {recursive: true}); writeFileSync(f, text); };
  put('package.json', JSON.stringify({name: 'playwright-core', version: '9.9.9', license: 'Apache-2.0', engines: {node: '>=20'}}));
  put('browsers.json', JSON.stringify({browsers: [{name: 'chromium', revision: '1'}]}));
  put('index.js', 'require("./lib/coreBundle")');
  put('lib/coreBundle.js', '// packages/isomorphic/a.ts\nx\n// packages/playwright-core/src/server/b.ts\ny\nz');
  put('lib/utilsBundle.js', '// node_modules/ws/index.js\nw');
  put('types/protocol.d.ts', 'export namespace Protocol {\n  export namespace Page {\n  }\n}');
  const report = disassemblePackage(dir);
  assert.equal(report.package.version, '9.9.9');
  assert.equal(report.browsers[0].name, 'chromium');
  assert.equal(report.coreBundle.moduleCount, 2);
  assert.equal(report.coreBundle.playwrightSrcAreas.server.modules, 1);
  assert.deepEqual(report.protocol.domains, ['Page']);
  assert.match(report.files['lib/coreBundle.js'].sha256, /^[0-9a-f]{64}$/);
});

test('committed 1.64.1 register pins the disassembly of the real package', () => {
  const register = JSON.parse(readFileSync(path.join(root, 'docs/playwright164-evidence/module-map-1.64.1.json'), 'utf8'));
  assert.equal(register.package.name, 'playwright-core');
  assert.equal(register.package.version, '1.64.1');
  assert.equal(register.package.license, 'Apache-2.0');
  assert.equal(register.coreBundle.moduleCount, 414);
  assert.equal(register.utilsBundle.moduleCount, 627);
  assert.equal(register.coreBundle.playwrightSrcAreas.server.modules, 154);
  assert.equal(register.coreBundle.playwrightSrcAreas.client.modules, 51);
  for (const d of ['Browser', 'DOM', 'Page', 'Runtime', 'Target']) assert.ok(register.protocol.domains.includes(d), d);
  const chromium = register.browsers.find((b) => b.name === 'chromium');
  assert.equal(chromium.revision, '1248');
  assert.equal(chromium.browserVersion, '156.0.8078.4');
});

/* ---------------- fake CDP transport ---------------- */

class FakeSocket {
  constructor(responder) {
    this.responder = responder; // (method, params, sessionId) => result | undefined
    this.sent = [];
    this.handlers = {};
  }
  addEventListener(type, fn) { this.handlers[type] = fn; }
  send(text) {
    const msg = JSON.parse(text);
    this.sent.push(msg);
    const result = this.responder?.(msg.method, msg.params, msg.sessionId);
    if (result !== undefined) {
      queueMicrotask(() => this.handlers.message?.({data: JSON.stringify({id: msg.id, result})}));
    }
  }
  push(obj) { this.handlers.message?.({data: JSON.stringify(obj)}); }
  close() {}
}

async function fakePage(responder) {
  const socket = new FakeSocket(responder ?? (() => ({})));
  const connection = new CdpConnection(socket);
  const browser = new Browser(connection, {downloadsPath: '/tmp/cdp-test-downloads'});
  const page = new Page(browser, 'sess-1', 'target-1');
  await page._init({width: 800, height: 600});
  return {socket, connection, browser, page};
}

test('CdpConnection correlates replies by id, even out of order', async () => {
  const socket = new FakeSocket(() => undefined); // manual replies
  const conn = new CdpConnection(socket);
  const a = conn.send('Page.enable', {}, 's1');
  const b = conn.send('Runtime.enable', {}, 's1');
  socket.push({id: 2, result: {two: true}});
  socket.push({id: 1, result: {one: true}});
  assert.deepEqual(await a, {one: true});
  assert.deepEqual(await b, {two: true});
  const failing = conn.send('Nope.nope', {});
  socket.push({id: 3, error: {message: 'not found'}});
  await assert.rejects(failing, /not found/);
});

test('launch args pin the DevTools endpoint contract', () => {
  const args = chromiumLaunchArgs({executablePath: '/bin/chrome', userDataDir: '/tmp/prof', args: ['--no-sandbox'], headless: true});
  assert.ok(args.includes('--headless=new'));
  assert.ok(args.includes('--remote-debugging-port=0'));
  assert.ok(args.includes('--user-data-dir=/tmp/prof'));
  assert.ok(args.includes('--no-sandbox'));
});

test('converted Page: evaluate serializes function + arg, waitForFunction polls to truthy', async () => {
  let polls = 0;
  const {socket, page} = await fakePage((method, params) => {
    if (method !== 'Runtime.evaluate') return {};
    if (params.expression.includes('readyFlag')) { polls++; return {result: {value: polls >= 3}}; }
    return {result: {value: 42}};
  });
  assert.equal(await page.evaluate((x) => x + 1, 41), 42);
  const evalMsg = socket.sent.find((m) => m.method === 'Runtime.evaluate');
  assert.ok(evalMsg.params.expression.endsWith('(41)'), evalMsg.params.expression);
  await page.waitForFunction(() => window.readyFlag === true, undefined, {polling: 5, timeout: 5000});
  assert.equal(polls, 3);
});

test('converted Page: goto navigates then resolves on loadEventFired; pageerror surfaces', async () => {
  const {socket, page} = await fakePage(() => ({}));
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const going = page.goto('http://127.0.0.1:9/fixture');
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(socket.sent.at(-1).method, 'Page.navigate');
  socket.push({method: 'Page.loadEventFired', sessionId: 'sess-1', params: {}});
  await going;
  socket.push({method: 'Runtime.exceptionThrown', sessionId: 'sess-1',
    params: {exceptionDetails: {exception: {description: 'Boom: bad thing\n    at x'}, text: 'Uncaught'}}});
  assert.deepEqual(errors, ['Boom: bad thing']);
});

test('converted Locator: count reads querySelectorAll; a missing element times out honestly', async () => {
  const {page} = await fakePage((method, params) => {
    if (method !== 'Runtime.evaluate') return {};
    if (params.expression.includes('__pwMissing')) return {result: {value: {__pwMissing: true}}};
    return {result: {value: 7}};
  });
  assert.equal(await page.locator('.tile').count(), 7);
  await assert.rejects(page.locator('.nope').click({timeout: 250}), /no element after 250ms/);
});

test('converted Browser: download waiters resolve and path() joins the downloads dir', async () => {
  const {socket, browser} = await fakePage(() => ({}));
  const waiting = browser._waitForDownload();
  socket.push({method: 'Browser.downloadWillBegin', params: {guid: 'g1', url: 'http://x/hello.txt', suggestedFilename: 'hello.txt'}});
  const dl = await waiting;
  assert.equal(dl.suggestedFilename(), 'hello.txt');
  socket.push({method: 'Browser.downloadProgress', params: {guid: 'g1', state: 'completed'}});
  assert.equal(await dl.path(), path.join('/tmp/cdp-test-downloads', 'hello.txt'));
});

test('converted Page: role locator counts through the injected role picker', async () => {
  let sawRolePicker = false;
  const {page} = await fakePage((method, params) => {
    if (method !== 'Runtime.evaluate') return {};
    if (params.expression.includes('roleOf')) sawRolePicker = true;
    return {result: {value: 2}};
  });
  assert.equal(await page.getByRole('button', {name: /Download/}).count(), 2);
  assert.ok(sawRolePicker);
});
