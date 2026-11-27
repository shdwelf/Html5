/** Actual Blink + module workers, synthetic local data only. No remote provider or swarm traffic. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { inspectTorrent } from '../apps/torrent-atlas/torrent.mjs';
import { v1, v2 } from './torrent-fixtures.mjs';
import { browserDeps, serve, withBrowser } from './lib-browser.mjs';
const deps = await browserDeps();
if (!deps) throw new Error('Torrent Atlas requires the locked Chromium harness; refusing a silent browser skip.');
const { server, port } = await serve(), origin = `http://127.0.0.1:${port}`;
const directory = await mkdtemp(join(tmpdir(), 'torrent-atlas-synthetic-'));
const source = join(directory, 'synthetic.txt'), meta = join(directory, 'synthetic.torrent'), v2meta = join(directory, 'synthetic-v2.torrent'), privateMeta = join(directory, 'private.torrent');
await writeFile(source, 'hello'); await writeFile(meta, v1().bytes); await writeFile(v2meta, v2().bytes);
await writeFile(privateMeta, v1({ fields: { private: 1 }, root: { announce: 'https://tracker.example.invalid/secret-passkey' } }).bytes);
const summary = async (page, id) => await page.$eval(`#${id}`, (el) => el.textContent);
const submit = async (page, id) => await page.$eval(`#${id}`, (form) => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
const set = async (page, id, value, event = 'input') => await page.$eval(`#${id}`, (el, v, name) => { if (el.type === 'checkbox') el.checked = v; else el.value = v; el.dispatchEvent(new Event(name, { bubbles: true })); }, value, event);
const tool = async (page, name) => await page.click(`[data-panel="${name}"]`);
const waitStatus = async (page, id, fragment) => await page.waitForFunction((name, text) => document.getElementById(name).textContent.includes(text), { timeout: 15000 }, id, fragment);
let browser;
async function boot({ native, mockWorker = false, noWorker = false, path = '/public/apps/torrent-atlas/index.html' } = {}) {
  const page = await browser.newPage(), external = [], errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setRequestInterception(true);
  page.on('request', (request) => { if (/^https?:/u.test(request.url()) && new URL(request.url()).origin !== origin) { external.push(request.url()); void request.abort(); } else void request.continue(); });
  await page.evaluateOnNewDocument((mode, mock, absent) => {
    window.__copies = []; window.__saves = []; window.__workers = [];
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text) => { window.__copies.push(text); } } });
    if (mode) window.Html5LocalFiles = { version: 1, async save(blob, name) {
      window.__saves.push({ size: blob.size, name });
      if (mode === 'pending') return await new Promise((resolve) => { window.__resolveSave = resolve; });
      if (mode === 'canceled') return { status: 'canceled' };
      if (mode === 'bad') return { status: 'saved', bytes: blob.size - 1, sha256: 'not-a-receipt' };
      if (mode === 'wrong-hash') return { status: 'saved', bytes: blob.size, sha256: '0'.repeat(64) };
      if (mode === 'error') throw new Error('synthetic picker failure');
      const sha256 = [...new Uint8Array(await crypto.subtle.digest('SHA-256', await blob.arrayBuffer()))].map((n) => n.toString(16).padStart(2, '0')).join('');
      return { status: 'saved', bytes: blob.size, sha256 };
    } };
    if (mock) window.Worker = class { constructor(url, options) { this.options = options; window.__workers.push(this); } postMessage(data) { this.input = data; } terminate() { this.terminated = true; } };
    if (absent) window.Worker = undefined;
  }, native, mockWorker, noWorker);
  await page.goto(origin + path, { waitUntil: 'networkidle0' });
  if (path.includes('torrent-atlas')) await page.waitForFunction(() => document.querySelectorAll('#source-cards article').length === 27);
  return { page, external, errors, async close() { assert.deepEqual(external, [], 'no external request is authorized in this suite'); assert.deepEqual(errors, []); await page.close(); } };
}
async function create(page, { privateFlag = false } = {}) {
  await tool(page, 'create'); await (await page.$('#create-files')).uploadFile(source);
  await set(page, 'create-consent', true, 'change');
  if (privateFlag) { await set(page, 'create-trackers', 'https://tracker.example.invalid/secret-passkey'); await set(page, 'create-private', true, 'change'); }
  await submit(page, 'create-form'); await waitStatus(page, 'create-status', 'Real v1');
}
try {
  await withBrowser(deps, async (instance) => {
    browser = instance;
    await test('Atlas boots offline, filters 27 sources / 37 manager rows and stays within mobile width', async () => {
      const ui = await boot(); const { page } = ui;
      try {
        assert.equal(await page.$eval('#source-total', (el) => el.textContent), '27');
        assert.equal(await page.evaluate(() => localStorage.length + sessionStorage.length), 0);
        assert.equal(await page.evaluate(() => document.cookie), '');
        await set(page, 'source-filter', 'searx'); assert.ok(await page.$$eval('#source-cards article', (items) => items.length) >= 3);
        await tool(page, 'passwords'); assert.equal(await page.$$eval('#manager-cards article', (items) => items.length), 37);
        await set(page, 'manager-filter', 'Dropbox'); assert.equal(await page.$$eval('#manager-cards article', (items) => items.length), 1);
        assert.match(await summary(page, 'manager-cards'), /Discontinued/);
        await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        assert.deepEqual(await page.evaluate(() => [window.__copies.length, window.__saves.length, window.__workers.length]), [0, 0, 0]);
      } finally { await ui.close(); }
    });
    await test('consent + exact outbound preview + edit/clear invalidation never execute a search', async () => {
      const ui = await boot(); const { page } = ui;
      try {
        await set(page, 'search-query', 'climate & water'); await submit(page, 'search-form');
        assert.match(await summary(page, 'search-status'), /Consent/); assert.equal(await page.$eval('#search-open', (el) => el.hasAttribute('href')), false);
        await set(page, 'search-consent', true, 'change'); await submit(page, 'search-form');
        assert.match(await summary(page, 'search-destination'), /https:\/\/archive.org.*NOT been sent/);
        const url = await page.$eval('#search-url', (el) => el.value); assert.equal(new URL(url).origin, 'https://archive.org'); assert.match(new URL(url).searchParams.get('query'), /format:"Archive BitTorrent"/);
        assert.equal(await page.$eval('#search-open', (el) => `${el.rel}/${el.referrerPolicy}`), 'noopener noreferrer/no-referrer');
        await page.click('#search-copy'); assert.deepEqual(await page.evaluate(() => window.__copies), [url]);
        await set(page, 'search-query', 'different'); assert.equal(await page.$eval('#search-preview', (el) => el.hidden), true);
        assert.equal(await page.$eval('#search-open', (el) => el.hasAttribute('href')), false);
        await page.click('#clear-all'); assert.equal(await page.$eval('#search-consent', (el) => el.checked), false); assert.equal(await page.$eval('#search-query', (el) => el.value), '');
      } finally { await ui.close(); }
    });
    await test('hostile magnet names are inert text, endpoint passkeys stay collapsed and minimal copies exclude them', async () => {
      const ui = await boot(); const { page } = ui;
      try {
        await tool(page, 'magnet');
        const input = 'magnet:?xt=urn:btih:' + 'a'.repeat(40) + '&dn=' + encodeURIComponent('<img src=x onerror=window.__injected=1>') + '&tr=' + encodeURIComponent('https://tracker.example.invalid/secret-passkey');
        await set(page, 'magnet-input', input); await submit(page, 'magnet-form');
        assert.match(await summary(page, 'magnet-result'), /<img src=x/); assert.equal(await page.$('#magnet-result img'), null);
        assert.equal(await page.evaluate(() => window.__injected), undefined);
        assert.equal(await page.$eval('#magnet-result details', (el) => el.open), false);
        await page.click('#magnet-result button'); const copied = await page.evaluate(() => window.__copies[0]); assert.doesNotMatch(copied, /secret-passkey|tr=/);
        await set(page, 'magnet-input', 'magnet:?xt=bad'); assert.equal(await page.$eval('#magnet-result', (el) => el.hidden), true);
        await submit(page, 'magnet-form'); assert.match(await summary(page, 'magnet-status'), /Unsupported/);
      } finally { await ui.close(); }
    });
    await test('actual module workers inspect exact v1/v2 hashes, reject mismatches and suppress private magnet export', async () => {
      const ui = await boot(); const { page } = ui;
      try {
        await tool(page, 'inspect'); await (await page.$('#inspect-file')).uploadFile(meta); await submit(page, 'inspect-form');
        await waitStatus(page, 'inspect-status', 'inspection complete'); assert.match(await summary(page, 'inspect-result'), /v1.*5 bytes/s);
        await set(page, 'expected-hash', '0'.repeat(40)); await submit(page, 'inspect-form'); await waitStatus(page, 'inspect-status', 'does not match');
        assert.equal(await page.$eval('#inspect-result', (el) => el.hidden), true);
        await set(page, 'expected-hash', ''); await (await page.$('#inspect-file')).uploadFile(v2meta); await submit(page, 'inspect-form');
        await waitStatus(page, 'inspect-status', 'inspection complete'); assert.match(await summary(page, 'inspect-result'), /v2.*SHA-256/s);
        await (await page.$('#inspect-file')).uploadFile(privateMeta); await submit(page, 'inspect-form'); await waitStatus(page, 'inspect-status', 'inspection complete');
        assert.match(await summary(page, 'inspect-result'), /PRIVATE — no magnet export/); assert.equal(await page.$('#inspect-result textarea'), null);
      } finally { await ui.close(); }
    });
    await test('actual worker creates deterministic real v1 metainfo and browser download is not called a read-back save', async () => {
      const ui = await boot(); const { page } = ui;
      try {
        const session = await page.createCDPSession(); await session.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: directory });
        await create(page); assert.match(await summary(page, 'create-result'), /synthetic.txt/);
        await page.click('#save-torrent'); await waitStatus(page, 'save-status', 'Browser download requested');
        let bytes;
        for (let i = 0; i < 200; i++) { if ((await readdir(directory)).includes('synthetic.txt.torrent')) { bytes = await readFile(join(directory, 'synthetic.txt.torrent')); break; } await delay(20); }
        assert.ok(bytes, 'real exported torrent bytes must exist'); const result = await inspectTorrent(new Uint8Array(bytes)); assert.equal(result.total, 5);
        assert.equal(result.v1, (await inspectTorrent(v1({ name: 'synthetic.txt', pieceLength: 262144 }).bytes)).v1);
        await page.click('#clear-all'); assert.equal(await page.$eval('#save-torrent', (el) => el.hidden), true); assert.equal(await page.$eval('#create-consent', (el) => el.checked), false);
        assert.match(await summary(page, 'global-status'), /Session cleared/);
      } finally { await ui.close(); }
    });
    for (const [native, expected] of [['saved', 'native read-back verification'], ['canceled', 'Save canceled'], ['bad', 'No valid completed-save receipt'], ['wrong-hash', 'does not match the created torrent bytes'], ['error', 'synthetic picker failure']]) {
      await test(`native adapter ${native} receipt stays distinct from a confirmed save`, async () => {
        const ui = await boot({ native });
        try { await create(ui.page, { privateFlag: true }); assert.equal(await ui.page.$('#create-result textarea'), null); await ui.page.click('#save-torrent'); await waitStatus(ui.page, 'save-status', expected); assert.equal(await ui.page.evaluate(() => window.__saves.length), 1); }
        finally { await ui.close(); }
      });
    }
    await test('clearing during a pending save never resurrects the completed result', async () => {
      const ui = await boot({ native: 'pending' }); const { page } = ui;
      try {
        await create(page); await page.click('#save-torrent'); await waitStatus(page, 'save-status', 'system Files picker');
        await page.click('#clear-all'); assert.match(await summary(page, 'global-status'), /may still finish/);
        await page.evaluate(() => window.__resolveSave({ status: 'canceled' })); await delay(30);
        assert.equal(await summary(page, 'save-status'), ''); assert.equal(await page.$eval('#create-result', (el) => el.hidden), true);
      } finally { await ui.close(); }
    });
    await test('input edits, cancel, tool switch and pagehide terminate workers and suppress stale results', async () => {
      const ui = await boot({ mockWorker: true }); const { page } = ui;
      try {
        await tool(page, 'inspect'); await (await page.$('#inspect-file')).uploadFile(meta); await submit(page, 'inspect-form');
        await page.waitForFunction(() => window.__workers.length === 1); await set(page, 'expected-hash', 'a'.repeat(40));
        assert.equal(await page.evaluate(() => window.__workers[0].terminated), true);
        await page.evaluate(() => window.__workers[0].onmessage({ data: { type: 'result', result: { summary: { name: 'STALE' } } } }));
        assert.equal(await page.$eval('#inspect-result', (el) => el.hidden), true);
        await submit(page, 'inspect-form'); await page.click('#inspect-cancel'); assert.equal(await page.evaluate(() => window.__workers[1].terminated), true);
        await submit(page, 'inspect-form'); await tool(page, 'create'); assert.equal(await page.evaluate(() => window.__workers[2].terminated), true);
        await tool(page, 'inspect'); await submit(page, 'inspect-form'); await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
        assert.equal(await page.evaluate(() => window.__workers[3].terminated), true); assert.equal(await page.$eval('#inspect-file', (el) => el.files.length), 0);
      } finally { await ui.close(); }
    });
    await test('missing workers fail honestly, without a main-thread fallback or stuck controls', async () => {
      const ui = await boot({ noWorker: true }); const { page } = ui;
      try { await tool(page, 'inspect'); await (await page.$('#inspect-file')).uploadFile(meta); await submit(page, 'inspect-form'); await waitStatus(page, 'inspect-status', 'does not support'); assert.equal(await page.$eval('#inspect-form [type=submit]', (el) => el.disabled), false); assert.equal(await page.$eval('#inspect-result', (el) => el.hidden), true); }
      finally { await ui.close(); }
    });
    await test('gateway browser mirrors plan-only choices and clears invalid output without network or consent', async () => {
      const ui = await boot({ path: '/gateway-config.html' }); const { page } = ui;
      try {
        await page.waitForFunction(() => document.getElementById('profileOut').textContent.includes('plan-only'));
        const config = JSON.parse(await summary(page, 'profileOut')); assert.equal(config.readiness.protectionActive, false); assert.equal(config.vpnService.consentRequested, false);
        await page.select('#providerSelect', 'bitmask'); await page.select('#channelSelect', 'beta'); await page.click('#i2pToggle');
        const changed = JSON.parse(await summary(page, 'profileOut')); assert.equal(changed.provider.transport, 'openvpn'); assert.equal(changed.i2p.enabled, true); assert.match(await summary(page, 'warningList'), /not an extra anonymity layer/);
        await set(page, 'exceptionsInput', '*'); assert.equal(await summary(page, 'profileOut'), ''); assert.match(await summary(page, 'warningList'), /package names/);
      } finally { await ui.close(); }
    });
  });
} finally { await new Promise((done) => server.close(done)); await rm(directory, { recursive: true, force: true }); }
