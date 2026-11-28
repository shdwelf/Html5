/** Real Chromium; retained local evidence + synthetic guesses/host APIs only. No outbound navigation. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { unzipSync } from '../vendor/fflate/index.mjs';
import { browserDeps, ROOT, serve, withBrowser } from './lib-browser.mjs';

const deps = await browserDeps();
if (!deps) throw new Error('Armstrong–Madison requires the locked Chromium harness; refusing a silent browser skip.');
await mkdir(join(ROOT, '.cache/armstrong-madison'), { recursive: true });
const directory = await mkdtemp(join(ROOT, '.cache/armstrong-madison/browser-'));
const { server, port } = await serve(), origin = `http://127.0.0.1:${port}`;
const appPath = '/public/apps/armstrong-madison/';
const storageName = 'armstrong-madison.review.key.v1';
const expectedAudit = JSON.parse(await readFile(join(ROOT, 'docs/research/armstrong-madison-1808/audit.json'), 'utf8'));
const notices = await readFile(join(ROOT, 'apps/armstrong-madison/THIRD_PARTY_NOTICES.txt'), 'utf8');
const githubLicense = await readFile(join(ROOT, 'docs/research/armstrong-madison-1808/github-MIT-LICENSE.txt'), 'utf8');
const text = (page, selector) => page.$eval(selector, (node) => node.textContent);
const set = (page, selector, value, event = 'input') => page.$eval(selector, (node, next, name) => {
  if (node.type === 'checkbox') node.checked = next; else node.value = next;
  node.dispatchEvent(new Event(name, { bubbles: true }));
}, value, event);
const waitStatus = (page, fragment) => page.waitForFunction((value) => document.getElementById('workspace-status').textContent.includes(value), { timeout: 10000 }, fragment);
const currentKey = (page) => page.evaluate(() => window.ArmstrongWorkspace.read());
const controls = (page) => page.$eval('#workspace-controls', (node) => { node.open = true; });
async function clickText(page, value, selector = 'button') {
  const handle = await page.evaluateHandle((label, query) => [...document.querySelectorAll(query)].find((node) => node.textContent.trim() === label), value, selector);
  const button = handle.asElement(); assert.ok(button, `Missing button: ${value}`);
  try { await button.click(); } finally { await handle.dispose(); }
}
async function section(page, id) {
  const label = await page.$eval(`#root header select option[value="${id}"]`, (node) => node.textContent.replace(/^\d+\.\s*/u, ''));
  await page.select('#root header select', id);
  await page.waitForFunction((expected) => [...document.querySelectorAll('#root header nav button')].some((node) => node.textContent === expected && node.classList.contains('text-[#f0e6cd]')), {}, label);
}
async function reviewFrame(page) {
  await page.waitForSelector('#verified-research-frame');
  const frame = await (await page.$('#verified-research-frame')).contentFrame();
  await frame.waitForFunction(() => document.body.dataset.researchReady === 'true');
  return frame;
}
async function ready(page, standalone = false) {
  await page.waitForFunction((onlyReview) => document.body.dataset[onlyReview ? 'researchReady' : 'workspaceReady'] === 'true', {}, standalone);
  if (!standalone) await reviewFrame(page);
}
let browser, downloadId = 0;
async function boot({ path = appPath + 'index.html', native, webxdc, offline = false, standalone = false, catalog = false, viewport = { width: 1280, height: 900 } } = {}) {
  const context = await browser.createBrowserContext(), page = await context.newPage();
  const external = [], errors = [], consoleErrors = [], requests = [];
  let allowCsp = false;
  await page.setViewport(viewport);
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    const url = request.url(); requests.push(url);
    if (/^https?:/u.test(url) && new URL(url).origin !== origin) { external.push(url); void request.abort(); }
    else void request.continue();
  });
  await page.evaluateOnNewDocument((nativeMode, chatMode) => {
    window.__cspViolations = [];
    document.addEventListener('securitypolicyviolation', (event) => window.__cspViolations.push({ directive: event.effectiveDirective, blocked: event.blockedURI }));
    if (window !== window.top) return;
    window.__storageOps = []; window.__copies = []; window.__saves = [];
    for (const name of ['getItem', 'setItem', 'removeItem', 'clear']) {
      const original = Storage.prototype[name];
      Storage.prototype[name] = function (...args) {
        if (this === localStorage) window.__storageOps.push([name, args[0] ?? null]);
        return original.apply(this, args);
      };
    }
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (value) => { window.__copies.push(value); } } });
    window.__chat = { sends: [], listeners: 0, history: [] };
    if (chatMode) window.webxdc = {
      selfName: 'Synthetic investigator',
      async sendUpdate(update, description) {
        window.__chat.sends.push({ update, description });
        if (chatMode === 'send-failure') throw new Error('synthetic send failure');
      },
      async setUpdateListener(listener, serial) {
        window.__chat.listeners++; window.__chat.startSerial = serial; window.__chat.listener = listener;
        if (chatMode === 'receive-failure') throw new Error('synthetic history failure');
        for (const message of window.__chat.history) listener(message);
      },
    };
    if (nativeMode) window.Html5LocalFiles = { version: 1, async save(blob, name) {
      window.__saves.push({ bytes: blob.size, name, text: await blob.text() });
      if (nativeMode === 'canceled') return { status: 'canceled' };
      if (nativeMode === 'bad') return { status: 'saved', bytes: blob.size - 1, sha256: 'invalid' };
      if (nativeMode === 'wrong-hash') return { status: 'saved', bytes: blob.size, sha256: '0'.repeat(64) };
      if (nativeMode === 'error') throw new Error('synthetic native picker failure');
      const sha256 = [...new Uint8Array(await crypto.subtle.digest('SHA-256', await blob.arrayBuffer()))].map((byte) => byte.toString(16).padStart(2, '0')).join('');
      return { status: 'saved', bytes: blob.size, sha256 };
    } };
  }, native, webxdc);
  if (offline) await page.setOfflineMode(true);
  await page.goto(path.startsWith('file:') ? path : origin + path, { waitUntil: 'networkidle0' });
  if (catalog) await page.waitForFunction(() => document.getElementById('app-count')?.textContent === '98 of 98 approved apps');
  else await ready(page, standalone);
  return {
    page, external, errors, requests,
    expectCspRejections() { allowCsp = true; },
    async close() {
      try {
        assert.deepEqual(external, [], 'no external requests are authorized');
        assert.deepEqual(errors, [], 'no browser/runtime exception or swallowed render failure');
        assert.deepEqual(consoleErrors.filter((message) => !allowCsp || !/Content Security Policy|violates the following/u.test(message)), []);
        if (!allowCsp) for (const frame of page.frames()) assert.deepEqual(await frame.evaluate(() => window.__cspViolations || []), [], 'normal use must not violate CSP');
      } finally { await context.close(); }
    },
  };
}
async function download(page, action) {
  const destination = join(directory, `download-${++downloadId}`); await mkdir(destination);
  const session = await browser.target().createCDPSession();
  await session.send('Browser.setDownloadBehavior', { behavior: 'allow', browserContextId: page.browserContext().id, downloadPath: destination, eventsEnabled: true });
  let timeout, filename, guid;
  const completed = new Promise((resolve, reject) => {
    timeout = setTimeout(() => reject(new Error('Expected a completed browser download')), 15000);
    session.on('Browser.downloadWillBegin', (event) => { guid = event.guid; filename = event.suggestedFilename; });
    session.on('Browser.downloadProgress', (event) => {
      if (guid && event.guid !== guid) return;
      if (event.state === 'completed') resolve();
      if (event.state === 'canceled') reject(new Error('Synthetic browser download canceled'));
    });
  });
  try {
    await action(); await completed;
    assert.ok(filename, 'browser supplies a real filename');
    return { filename, path: join(destination, filename), bytes: await readFile(join(destination, filename)) };
  } finally { clearTimeout(timeout); await session.detach(); }
}
async function extract(archive, name) {
  const target = join(directory, name), files = unzipSync(archive);
  for (const [path, bytes] of Object.entries(files)) {
    assert.ok(!path.startsWith('/') && !path.split('/').includes('..'));
    const file = join(target, path); await mkdir(join(file, '..'), { recursive: true }); await writeFile(file, bytes);
  }
  return { files, path: `/${relative(ROOT, target)}/index.html` };
}

try {
  await withBrowser(deps, async (instance) => {
    browser = instance;
    await test('the complete browser library finds and opens the reviewed workbench through its generated catalog', async () => {
      const ui = await boot({ path: '/public/apps/index.html', catalog: true }), { page } = ui;
      try {
        await set(page, '#app-search', 'Armstrong');
        assert.match(await text(page, '#app-count'), /1 of 98/u);
        assert.equal(await page.$$eval('#app-list a', (nodes) => nodes.length), 1);
        await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle0' }), page.click('#app-list a')]);
        await ready(page);
        assert.equal(new URL(page.url()).pathname, appPath + 'index.html');
        assert.match(await text(await reviewFrame(page), '#baseline-stats'), /130\/365/u);
      } finally { await ui.close(); }
    });
    await test('all 18 supplied sections plus the default review actually render without network, storage or chat startup activity', async () => {
      const ui = await boot(), { page } = ui;
      try {
        assert.deepEqual(await currentKey(page), {});
        assert.deepEqual(await page.evaluate(() => window.__storageOps), []);
        assert.match(await text(page, '#source-review-banner'), /not certified as plaintext/u);
        assert.match(await text(page, '#root header'), /legacy readings/u);
        const options = await page.$$eval('#root header select option', (nodes) => nodes.map((node) => node.value));
        assert.equal(options.length, 19); assert.equal(options[0], 'verified');
        for (const id of options.slice(1)) {
          await section(page, id);
          assert.ok((await text(page, '#root main')).trim().length > 40, id);
          assert.doesNotMatch(await text(page, '#root main'), /could not be displayed|render error/u, id);
        }
        await section(page, 'verified'); await reviewFrame(page);
        assert.deepEqual(await page.evaluate(() => [window.__chat.sends.length, window.__chat.listeners, window.__storageOps.length]), [0, 0, 0]);
        assert.deepEqual(ui.requests.filter((url) => /^https?:/u.test(url)).map((url) => new URL(url).pathname).sort(), [appPath + 'index.html', appPath + 'webxdc.js']);
      } finally { await ui.close(); }
    });
    await test('the original letter-to-solver selection binds, copies, unbinds, loads all AFIO labels and clears without recursive state errors', async () => {
      const ui = await boot(), { page } = ui;
      try {
        await section(page, 'letter'); await clickText(page, '453', '#root main button');
        await page.waitForSelector('input[placeholder="word / phrase / syllable"]');
        await page.type('input[placeholder="word / phrase / syllable"]', 'synthetic bearer');
        await clickText(page, 'bind', '#root main button');
        await page.waitForFunction(() => window.ArmstrongWorkspace.read()[453] === 'synthetic bearer');
        assert.match(await text(page, '#root main'), /Live hypothesis rendering/u);
        assert.doesNotMatch(await text(page, '#root main'), /synced across the chat|kept in this browser/u);
        await clickText(page, 'copy', '#root main button');
        assert.deepEqual(await page.evaluate(() => window.__copies), ['453\tsynthetic bearer']);
        await clickText(page, 'unbind', '#root main button'); assert.deepEqual(await currentKey(page), {});
        await clickText(page, 'load AFIO key', '#root main button');
        await page.waitForFunction(() => Object.keys(window.ArmstrongWorkspace.read()).length === 56);
        assert.equal((await currentKey(page))[681], 'petitions');
        await section(page, 'letter'); assert.match(await text(page, '#root main'), /petitions/u);
        await section(page, 'solve'); await clickText(page, 'clear', '#root main button');
        await page.waitForFunction(() => Object.keys(window.ArmstrongWorkspace.read()).length === 0);
        assert.deepEqual(await page.evaluate(() => window.__storageOps), []);
      } finally { await ui.close(); }
    });
    await test('device and legacy guesses are never restored automatically; explicit save/load/forget touch only the two app entries', async () => {
      const ui = await boot(), { page } = ui;
      try {
        await page.evaluate(() => {
          localStorage.setItem('unrelated-synthetic-app', 'keep');
          localStorage.setItem('madison1808.key', '{"453":"legacy synthetic"}');
        });
        await page.reload({ waitUntil: 'networkidle0' }); await ready(page);
        assert.deepEqual(await page.evaluate(() => window.__storageOps), []); assert.deepEqual(await currentKey(page), {});
        await controls(page); await page.click('#workspace-load');
        assert.deepEqual(await currentKey(page), { 453: 'legacy synthetic' });
        await page.evaluate(() => window.ArmstrongWorkspace.update({ 453: 'explicit synthetic' }));
        await page.click('#workspace-save'); await waitStatus(page, 'saved unencrypted');
        assert.equal(await page.evaluate((name) => localStorage.getItem(name), storageName), '{"453":"explicit synthetic"}');
        await page.reload({ waitUntil: 'networkidle0' }); await ready(page);
        assert.deepEqual(await currentKey(page), {}); assert.deepEqual(await page.evaluate(() => window.__storageOps), []);
        await controls(page); await page.click('#workspace-load'); assert.deepEqual(await currentKey(page), { 453: 'explicit synthetic' });
        await page.click('#workspace-forget'); await waitStatus(page, 'secure erasure is not claimed');
        assert.deepEqual(await currentKey(page), { 453: 'explicit synthetic' });
        assert.deepEqual(await page.evaluate((name) => [localStorage.getItem(name), localStorage.getItem('madison1808.key'), localStorage.getItem('unrelated-synthetic-app')], storageName), [null, null, 'keep']);
      } finally { await ui.close(); }
    });
    await test('invalid stored data and denied storage produce visible failures without replacing guesses or deleting unrelated data', async () => {
      const ui = await boot(), { page } = ui;
      try {
        await controls(page);
        await page.evaluate((name) => { window.ArmstrongWorkspace.update({ 453: 'keep' }); localStorage.setItem(name, '{"1901":"invalid"}'); }, storageName);
        await page.click('#workspace-load'); await waitStatus(page, 'Saved key not loaded'); assert.deepEqual(await currentKey(page), { 453: 'keep' });
        await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException('synthetic denied', 'SecurityError'); }; });
        await page.click('#workspace-save'); await waitStatus(page, 'Not saved: synthetic denied'); assert.deepEqual(await currentKey(page), { 453: 'keep' });
      } finally { await ui.close(); }
    });
    await test('real selected JSON imports validate bounds/prototype keys and export a separate round-trippable guess file', async () => {
      const ui = await boot(), { page } = ui;
      try {
        await controls(page); await page.evaluate(() => window.ArmstrongWorkspace.update({ 453: 'keep' }));
        const badInputs = ['not json', '{"__proto__":{"polluted":true}}', '{"0":"invalid"}', '{"453":"' + 'x'.repeat(81) + '"}', ' '.repeat(384001)];
        for (let index = 0; index < badInputs.length; index++) {
          const path = join(directory, `invalid-${index}.json`); await writeFile(path, badInputs[index]);
          await (await page.$('#workspace-import')).uploadFile(path); await waitStatus(page, 'Import not applied');
          assert.deepEqual(await currentKey(page), { 453: 'keep' });
          await page.waitForFunction(() => document.getElementById('workspace-import').files.length === 0);
        }
        const path = join(directory, 'valid.json'); await writeFile(path, '{"453":"synthetic imported"}');
        await (await page.$('#workspace-import')).uploadFile(path); await waitStatus(page, '1 working labels in memory');
        assert.deepEqual(await currentKey(page), { 453: 'synthetic imported' });
        const saved = await download(page, () => page.click('#workspace-export'));
        assert.equal(saved.filename, 'armstrong-working-hypothesis.json'); assert.deepEqual(JSON.parse(saved.bytes), { 453: 'synthetic imported' });
        await waitStatus(page, 'not independently confirmed');
        await page.evaluate(() => window.ArmstrongWorkspace.update({}));
        await (await page.$('#workspace-import')).uploadFile(saved.path); await waitStatus(page, '1 working labels in memory');
        assert.deepEqual(await currentKey(page), { 453: 'synthetic imported' });
        assert.deepEqual(await page.evaluate(() => window.__storageOps), []);
      } finally { await ui.close(); }
    });
    await test('Webxdc edits and checkbox alone send nothing; sharing and validated history loading each require their button', async () => {
      const ui = await boot({ webxdc: 'available' }), { page } = ui;
      try {
        await controls(page); await page.evaluate(() => window.ArmstrongWorkspace.update({ 453: 'local synthetic' }));
        assert.deepEqual(await page.evaluate(() => [window.__chat.sends.length, window.__chat.listeners]), [0, 0]);
        assert.equal(await page.$eval('#workspace-share', (node) => node.disabled), true);
        await page.click('#workspace-share-consent');
        assert.deepEqual(await page.evaluate(() => [window.__chat.sends.length, window.__chat.listeners]), [0, 0]);
        await page.click('#workspace-share'); await waitStatus(page, 'remote delivery is not independently verified');
        assert.deepEqual(await page.evaluate(() => window.__chat.sends[0].update.payload), { type: 'key', key: { 453: 'local synthetic' }, count: 1, by: 'Synthetic investigator' });
        await page.evaluate(() => {
          window.__chat.history = [
            { serial: 1, payload: { type: 'key', key: { 1: 'first synthetic' } } },
            { serial: 999, payload: { type: 'key', key: { 1901: 'invalid' } } },
            { serial: 2, payload: { type: 'key', key: { 453: 'last valid history' } } },
          ];
        });
        await page.click('#workspace-receive'); await waitStatus(page, 'loaded by request');
        assert.deepEqual(await currentKey(page), { 453: 'last valid history' });
        assert.equal(await page.evaluate(() => window.__chat.startSerial), 0);
        await page.evaluate(() => {
          window.__chat.listener({ serial: 3, payload: { type: 'key', key: { 453: 'later pending' } } });
          window.ArmstrongWorkspace.update({ 453: 'my later edit' });
        });
        assert.deepEqual(await currentKey(page), { 453: 'my later edit' });
        await page.click('#workspace-receive'); assert.deepEqual(await currentKey(page), { 453: 'later pending' });
        await page.evaluate(() => window.__chat.listener({ serial: 1, payload: { type: 'key', key: { 1: 'stale' } } }));
        await page.click('#workspace-receive'); assert.deepEqual(await currentKey(page), { 453: 'later pending' });
        await page.click('#workspace-share-consent');
        await page.evaluate(() => window.__chat.listener({ serial: 4, payload: { type: 'key', key: { 1: 'arrived after revocation' } } }));
        await page.click('#workspace-share-consent'); await page.click('#workspace-receive'); await waitStatus(page, 'No valid shared key');
        assert.deepEqual(await currentKey(page), { 453: 'later pending' });
        assert.deepEqual(await page.evaluate(() => [window.__chat.sends.length, window.__chat.listeners, window.__storageOps.length]), [1, 1, 0]);
      } finally { await ui.close(); }
    });
    for (const [webxdc, button, expected] of [['send-failure', '#workspace-share', 'Share failed: synthetic send failure'], ['receive-failure', '#workspace-receive', 'Shared key not loaded: synthetic history failure']]) {
      await test(`Webxdc ${webxdc} is not reported as sharing/history success`, async () => {
        const ui = await boot({ webxdc });
        try { await controls(ui.page); await ui.page.click('#workspace-share-consent'); await ui.page.click(button); await waitStatus(ui.page, expected); }
        finally { await ui.close(); }
      });
    }
    await test('a normal browser never invents a Webxdc host or an available share action', async () => {
      const ui = await boot();
      try {
        await controls(ui.page); await ui.page.click('#workspace-share-consent');
        assert.equal(await ui.page.evaluate(() => window.webxdc), undefined);
        assert.deepEqual(await ui.page.$$eval('#workspace-share, #workspace-receive', (nodes) => nodes.map((node) => node.disabled)), [true, true]);
      } finally { await ui.close(); }
    });
    for (const [native, expected] of [['saved', 'native byte count and SHA-256 receipt verified'], ['canceled', 'Save canceled'], ['bad', 'no valid save receipt'], ['wrong-hash', 'receipt hash does not match'], ['error', 'synthetic native picker failure']]) {
      await test(`native export adapter ${native} keeps cancellation/failure distinct from verified saves`, async () => {
        const ui = await boot({ native });
        try {
          await controls(ui.page); await ui.page.evaluate(() => window.ArmstrongWorkspace.update({ 453: 'synthetic export' }));
          await ui.page.click('#workspace-export'); await waitStatus(ui.page, expected);
          const saves = await ui.page.evaluate(() => window.__saves);
          assert.equal(saves.length, 1); assert.equal(saves[0].name, 'armstrong-working-hypothesis.json');
          assert.deepEqual(JSON.parse(saves[0].text), { 453: 'synthetic export' });
        } finally { await ui.close(); }
      });
    }
    await test('standalone research renders 33 sources, nine search families and keyboard-accessible panels without dependencies', async () => {
      const ui = await boot({ path: appPath + 'research.html', standalone: true }), { page } = ui;
      try {
        assert.match(await text(page, '#baseline-stats'), /365/u);
        assert.equal(await text(page, '#third-party-notices'), notices);
        assert.equal(await page.$$eval('#source-cards article', (nodes) => nodes.length), 33);
        assert.equal(await page.$$eval('#query-trail article', (nodes) => nodes.length), 9);
        assert.deepEqual(await page.evaluate(() => window.__storageOps), []);
        await page.focus('#tab-review'); await page.keyboard.press('ArrowRight');
        assert.equal(await page.$eval('#tab-transcript', (node) => node.getAttribute('aria-selected')), 'true');
        assert.equal(await page.$$eval('#transcript-lines .code-token', (nodes) => nodes.length), 366);
        assert.equal(await page.$$eval('#transcript-lines .glyph', (nodes) => nodes.length), 34);
        await set(page, '#highlight-code', '203'); assert.equal(await page.$$eval('.chosen', (nodes) => nodes.length), 1);
        await set(page, '#highlight-code', '1203'); assert.equal(await page.$$eval('.chosen', (nodes) => nodes.length), 0);
        await set(page, '#highlight-code', '17'); assert.equal(await page.$$eval('.chosen', (nodes) => nodes.length), 13);
        await page.click('#show-labels'); assert.equal(await page.$$eval('#transcript-lines .gloss', (nodes) => nodes.length), 131);
        assert.match(await text(page, '.damaged .gloss'), /provisional: of/u);
        await page.focus('#tab-transcript'); await page.keyboard.press('End');
        assert.equal(await page.$eval('#tab-evidence', (node) => node.getAttribute('aria-selected')), 'true');
        await page.keyboard.press('Home'); assert.equal(await page.$eval('#tab-review', (node) => node.getAttribute('aria-selected')), 'true');
        await page.click('#finding-identity .citations button');
        assert.equal(await page.$eval('#tab-sources', (node) => node.getAttribute('aria-selected')), 'true');
        assert.equal(await page.evaluate(() => document.activeElement.id), 'source-S01');
        await set(page, '#source-filter', 'S17'); assert.equal(await page.$$eval('#source-cards article', (nodes) => nodes.length), 1);
        assert.match(await text(page, '#source-cards'), /direct ebook\/HTML\/text fetches failed/u);
        const links = await page.$$eval('#source-cards a', (nodes) => nodes.map((node) => [new URL(node.href).protocol, node.target, node.rel, node.referrerPolicy]));
        assert.deepEqual(links, [['https:', '_blank', 'noopener noreferrer', 'no-referrer']]);
        assert.deepEqual(ui.requests.filter((url) => /^https?:/u.test(url)), [origin + appPath + 'research.html']);
      } finally { await ui.close(); }
    });
    await test('editable audit hypotheses invalidate stale results, preserve damaged policy and render hostile labels only as text', async () => {
      const ui = await boot(), { page } = ui;
      try {
        const frame = await reviewFrame(page); await frame.click('#tab-audit');
        assert.match(await text(frame, '#audit-stats'), /130\/365/u);
        await frame.click('#include-damaged'); assert.match(await text(frame, '#audit-stats'), /131\/366/u);
        await set(frame, '#key-editor', '{"453":"test"');
        assert.equal(await frame.$eval('#audit-results', (node) => node.hidden), true);
        assert.equal(await frame.$$eval('#frequency-body tr', (nodes) => nodes.length), 0);
        await frame.click('#apply-key'); assert.match(await text(frame, '#key-status'), /Not applied/u);
        const label = '<img src=x onerror=window.__injected=1>';
        await set(frame, '#key-editor', JSON.stringify({ 453: label })); await frame.click('#apply-key');
        assert.equal(await frame.$eval('#audit-results', (node) => node.hidden), false);
        assert.match(await text(frame, '#audit-stats'), /1\/366/u);
        assert.equal(await frame.$('#frequency-body img'), null);
        assert.equal(await frame.evaluate(() => window.__injected), undefined);
        await frame.click('#tab-transcript'); await set(frame, '#show-labels', true, 'change');
        assert.equal(await text(frame, '[data-code="453"] .gloss'), label);
        assert.equal(await frame.$('#transcript-lines img'), null);
        assert.deepEqual(await currentKey(page), {}, 'the research audit never changes the original solver key');
        await frame.click('#tab-audit'); await frame.click('#empty-key'); assert.match(await text(frame, '#audit-stats'), /0\/366/u);
        await frame.click('#reset-key'); assert.match(await text(frame, '#audit-stats'), /131\/366/u);
      } finally { await ui.close(); }
    });
    await test('JSON receipts are really downloaded from the sandbox and exclude unvalidated editor content', async () => {
      const ui = await boot(), { page } = ui;
      try {
        const frame = await reviewFrame(page); await frame.click('#tab-evidence'); await frame.click('#show-receipt');
        const shown = JSON.parse(await frame.$eval('#receipt-output', (node) => node.value));
        assert.deepEqual(shown.strict, expectedAudit.strict); assert.equal(shown.evidenceIntegrity.length, 13); assert.equal(shown.sourceRegister.length, 33);
        const saved = await download(page, () => frame.click('#download-receipt'));
        assert.equal(saved.filename, 'armstrong-madison-audit.json'); assert.deepEqual(JSON.parse(saved.bytes), shown);
        assert.match(await text(frame, '#export-status'), /not confirmed saved/u);
        await frame.click('#tab-audit'); await set(frame, '#key-editor', 'UNAPPLIED-SYNTHETIC-CONTENT');
        await frame.click('#tab-evidence'); await frame.click('#show-receipt');
        const dirty = JSON.parse(await frame.$eval('#receipt-output', (node) => node.value));
        assert.deepEqual(dirty.activeHypothesis, { status: 'Unapplied editor content excluded' });
        assert.doesNotMatch(JSON.stringify(dirty), /UNAPPLIED-SYNTHETIC-CONTENT/u);
      } finally { await ui.close(); }
    });
    await test('CSP actually denies connections and extra scripts; the opaque review cannot read parent guesses/storage', async () => {
      const ui = await boot(), { page } = ui;
      try {
        const frame = await reviewFrame(page);
        assert.equal(await frame.evaluate(() => { try { void parent.ArmstrongWorkspace; return false; } catch (error) { return error.name === 'SecurityError'; } }), true);
        assert.equal(await frame.evaluate(() => { try { void localStorage.length; return false; } catch (error) { return error.name === 'SecurityError'; } }), true);
        ui.expectCspRejections();
        for (const target of [page, frame]) assert.equal(await target.evaluate(async () => { try { await fetch('https://example.invalid/blocked'); return false; } catch (error) { return error.name === 'TypeError'; } }), true);
        await frame.evaluate(() => { const script = document.createElement('script'); script.textContent = 'window.__unapprovedScript = true'; document.body.append(script); });
        assert.equal(await frame.evaluate(() => window.__unapprovedScript), undefined);
        await page.waitForFunction(() => window.__cspViolations.some((event) => event.directive === 'connect-src'));
        await frame.waitForFunction(() => window.__cspViolations.some((event) => event.directive === 'script-src-elem'));
      } finally { await ui.close(); }
    });
    await test('the checked-in 20-file XDC boots after real extraction, not just from the development public directory', async () => {
      const extracted = await extract(await readFile(join(ROOT, 'armstrong-madison-cipher.xdc')), 'repository-xdc');
      assert.equal(Object.keys(extracted.files).length, 20);
      const ui = await boot({ path: extracted.path });
      try {
        assert.match(await text(await reviewFrame(ui.page), '#audit-stats'), /130\/365/u);
        await section(ui.page, 'solve'); await clickText(ui.page, 'load AFIO key', '#root main button');
        await ui.page.waitForFunction(() => Object.keys(window.ArmstrongWorkspace.read()).length === 56);
      } finally { await ui.close(); }
    });
    await test('actual portable HTML → XDC → HTML round trips retain the review, re-add exactly one bridge and exclude working guesses/consent', async () => {
      const ui = await boot({ webxdc: 'available' }), { page } = ui;
      try {
        const secret = 'SYNTHETIC-PRIVATE-GUESS-DO-NOT-BUNDLE';
        await controls(page); await page.evaluate((label) => window.ArmstrongWorkspace.update({ 453: label }), secret);
        await page.click('#workspace-save'); await page.click('#workspace-share-consent'); await section(page, 'solve');
        assert.match(await text(page, '#root main'), new RegExp(secret, 'u'));
        const html = await download(page, () => clickText(page, 'download self HTML'));
        assert.equal(html.filename, 'armstrong-cipher-lab.self.html'); assert.doesNotMatch(html.bytes.toString(), new RegExp(secret, 'u'));
        assert.doesNotMatch(html.bytes.toString(), /<script[^>]+src=["'][^"']*webxdc\.js/u);
        const portable = await boot({ path: pathToFileURL(html.path).href, offline: true });
        try {
          assert.deepEqual(await currentKey(portable.page), {});
          assert.equal(await portable.page.$eval('#workspace-share-consent', (node) => node.checked), false);
          assert.equal(portable.requests.some((url) => /^https?:/u.test(url)), false);
          const xdc = await download(portable.page, () => clickText(portable.page, 'download WebXDC'));
          const extracted = await extract(xdc.bytes, 'portable-xdc');
          assert.deepEqual(Object.keys(extracted.files).sort(), ['SOURCE-CHECK.md', 'THIRD_PARTY_NOTICES.txt', 'index.html', 'manifest.toml', 'webxdc.js']);
          assert.equal(Buffer.from(extracted.files['THIRD_PARTY_NOTICES.txt']).toString(), notices);
          assert.ok(notices.includes(githubLicense.trim()), 'the complete upstream MIT notice survives compact exports');
          const packed = Buffer.from(extracted.files['index.html']).toString();
          assert.equal([...packed.matchAll(/<script[^>]+src=["']\.\/webxdc\.js["']/gu)].length, 1);
          assert.doesNotMatch(packed, new RegExp(secret, 'u'));
          const repacked = await boot({ path: extracted.path, webxdc: 'available' });
          try {
            assert.deepEqual(await currentKey(repacked.page), {});
            assert.deepEqual(await repacked.page.evaluate(() => [window.__chat.sends.length, window.__chat.listeners]), [0, 0]);
            assert.equal(repacked.requests.filter((url) => url.endsWith('/webxdc.js')).length, 1);
            const again = await download(repacked.page, () => clickText(repacked.page, 'download self HTML'));
            assert.doesNotMatch(again.bytes.toString(), /<script[^>]+src=["'][^"']*webxdc\.js/u);
            const reopened = await boot({ path: pathToFileURL(again.path).href, offline: true });
            try { assert.match(await text(await reviewFrame(reopened.page), '#audit-stats'), /130\/365/u); }
            finally { await reopened.close(); }
          } finally { await repacked.close(); }
        } finally { await portable.close(); }
      } finally { await ui.close(); }
    });
    await test('mobile section navigation and every new research panel fit 390px and 320px viewports', async () => {
      const ui = await boot({ viewport: { width: 390, height: 844 } }), { page } = ui;
      try {
        for (const width of [390, 320]) {
          await page.setViewport({ width, height: 844 });
          const frame = await reviewFrame(page);
          for (const view of ['review', 'transcript', 'audit', 'sources', 'trail', 'evidence']) {
            await frame.click(`#tab-${view}`);
            assert.equal(await frame.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${width}px ${view}`);
          }
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${width}px workbench`);
        }
        await section(page, 'solve'); await clickText(page, 'load AFIO key', '#root main button');
        await page.waitForFunction(() => Object.keys(window.ArmstrongWorkspace.read()).length === 56);
        await section(page, 'verified'); await reviewFrame(page);
      } finally { await ui.close(); }
    });
  });
} finally {
  await new Promise((done) => server.close(done));
  await rm(directory, { recursive: true, force: true });
}
