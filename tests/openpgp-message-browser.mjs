/** Real Chromium/module workers + synthetic encrypted files only. No private keys supplied to the app. */
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { test } from 'node:test';
import * as openpgp from 'openpgp';
import { CLASSIC_OPENPGP_CONFIG } from '../apps/openpgp-workbench/crypto.mjs';
import { browserDeps, serve, withBrowser, ROOT } from './lib-browser.mjs';
const deps = await browserDeps(); if (!deps) throw new Error('Required locked Chromium harness is unavailable.');
const { server, port } = await serve(join(ROOT, 'public')), origin = `http://127.0.0.1:${port}`;
const folder = await mkdtemp(join(tmpdir(), 'synthetic-openpgp-message-'));
const armor = await readFile('tests/fixtures/openpgp/gnupg-enc-sym-cfb-1.asc', 'utf8');
const raw = (await openpgp.unarmor(armor)).data, payload = Uint8Array.of(0, 255, 254, 1, 128, 10);
const binary = await openpgp.encrypt({ message: await openpgp.createMessage({ binary: payload, filename: '../../untrusted.html' }), passwords: ['synthetic binary password'], format: 'binary', config: CLASSIC_OPENPGP_CONFIG });
const key = await openpgp.generateKey({ type: 'ecc', curve: 'curve25519Legacy', userIDs: [{ name: 'Synthetic required-key control only' }] });
const publicOnly = await openpgp.encrypt({ message: await openpgp.createMessage({ text: 'requires original private key' }), encryptionKeys: await openpgp.readKey({ armoredKey: key.publicKey }), format: 'binary' });
for (const [name, data] of [['control.asc', armor], ['control.gpg', raw], ['binary.gpg', binary], ['public-only.pgp', publicOnly]]) await writeFile(join(folder, name), data);
try {
  await withBrowser(deps, async (browser) => {
    async function boot() {
      const page = await browser.newPage(), external = [], errors = [];
      await page.setRequestInterception(true);
      page.on('request', (request) => { if (/^https?:/u.test(request.url()) && new URL(request.url()).origin !== origin) { external.push(request.url()); void request.abort(); } else void request.continue(); });
      page.on('pageerror', (error) => errors.push(error.message));
      await page.evaluateOnNewDocument(() => {
        window.__messageWorkers = 0; window.__terminatedWorkers = 0;
        const ActualWorker = window.Worker;
        window.Worker = class extends ActualWorker { constructor(...args) { super(...args); window.__messageWorkers++; } terminate() { window.__terminatedWorkers++; return super.terminate(); } };
      });
      await page.goto(`${origin}/apps/openpgp-workbench/index.html`, { waitUntil: 'networkidle0' }); await page.click('#decrypt-tab');
      const set = (id, value) => page.$eval(`#${id}`, (el, value) => { el.value = value; el.dispatchEvent(new Event('input', { bubbles: true })); }, value);
      const submit = async (password) => { await set('decrypt-passphrase', password); await page.click('#decrypt-form [type=submit]'); };
      const status = async (kind) => { await page.waitForFunction(() => ['success', 'error'].includes(document.getElementById('decrypt-status').dataset.kind)); const s = await page.$eval('#decrypt-status', (el) => ({ kind: el.dataset.kind, text: el.textContent })); assert.equal(s.kind, kind, s.text); return s.text; };
      return { page, set, submit, status, async close() { assert.deepEqual(external, []); assert.deepEqual(errors, []); await page.click('#clear-all'); await page.close(); } };
    }
    for (const source of ['paste', 'control.asc', 'control.gpg']) await test(`real worker decrypts independent GnuPG ${source} with only a passphrase`, async () => {
      const ui = await boot();
      try {
        if (source === 'paste') await ui.set('armored-input', armor); else await (await ui.page.$('#encrypted-message-file')).uploadFile(join(folder, source));
        assert.equal(await ui.page.evaluate(() => window.__messageWorkers), 0);
        await ui.submit('password'); await ui.status('success');
        assert.equal(await ui.page.$eval('#decrypted-output', (el) => el.value), 'Hello, world!\n');
        assert.equal(await ui.page.$eval('#recovery-private-key', (el) => el.value), '');
        assert.equal(await ui.page.$eval('#decrypt-passphrase', (el) => el.value), '');
        assert.deepEqual(await ui.page.evaluate(() => [window.__messageWorkers, window.__terminatedWorkers, localStorage.length, sessionStorage.length]), [1, 1, 0, 0]);
      } finally { await ui.close(); }
    });
    await test('real binary file output is exact, inert, consent-gated and saved with a fixed safe filename', async () => {
      const ui = await boot();
      try {
        const session = await ui.page.createCDPSession(); await session.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: folder });
        await (await ui.page.$('#encrypted-message-file')).uploadFile(join(folder, 'binary.gpg'));
        await ui.submit('synthetic binary password'); await ui.status('success');
        assert.equal(await ui.page.$eval('#decrypted-output', (el) => el.value), '');
        assert.match(await ui.page.$eval('#decrypted-payload-status', (el) => el.textContent), /Binary payload/);
        assert.equal(await ui.page.$eval('#download-decrypted-file', (el) => el.disabled), true);
        await ui.page.click('#decrypted-save-ack'); await ui.page.click('#download-decrypted-file');
        let saved;
        for (let i = 0; i < 200; i++) { if ((await readdir(folder)).includes('openpgp-decrypted.bin')) { saved = await readFile(join(folder, 'openpgp-decrypted.bin')); break; } await delay(20); }
        assert.deepEqual(new Uint8Array(saved), payload);
        assert.match(await ui.page.$eval('#decrypt-status', (el) => el.textContent), /download requested, not verified saved.*UNENCRYPTED/);
        assert.equal(await ui.page.$eval('#decrypted-save-ack', (el) => el.checked), true);
        await ui.page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 }); assert.equal(await ui.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      } finally { await ui.close(); }
    });
    await test('wrong passphrase and public-key-only input release no plaintext and do not ask for a private-key paste', async () => {
      const ui = await boot();
      try {
        await (await ui.page.$('#encrypted-message-file')).uploadFile(join(folder, 'control.gpg'));
        await ui.submit('incorrect password'); assert.match(await ui.status('error'), /decryption failed/);
        assert.equal(await ui.page.$eval('#decrypted-output', (el) => el.value), '');
        await (await ui.page.$('#encrypted-message-file')).uploadFile(join(folder, 'public-only.pgp'));
        await ui.submit('unrelated password'); assert.match(await ui.status('error'), /matching private key/);
        assert.equal(await ui.page.$eval('#download-decrypted-file', (el) => el.disabled), true);
        assert.equal(await ui.page.$eval('#recovery-private-key', (el) => el.value), '');
      } finally { await ui.close(); }
    });
    for (const action of ['stop', 'pagehide', 'edit']) await test(`real ${action} terminates a just-started worker and prevents a late result`, async () => {
      const ui = await boot();
      try {
        await ui.set('armored-input', armor); await ui.set('decrypt-passphrase', 'password');
        await ui.page.evaluate((action) => {
          document.getElementById('decrypt-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
          if (action === 'stop') document.getElementById('cancel-message-decrypt').click();
          else if (action === 'pagehide') window.dispatchEvent(new Event('pagehide'));
          else { const field = document.getElementById('armored-input'); field.value = ''; field.dispatchEvent(new Event('input', { bubbles: true })); }
        }, action);
        await ui.page.waitForFunction(() => !document.querySelector('#decrypt-form [type=submit]').disabled); await delay(30);
        assert.equal(await ui.page.$eval('#decrypted-output', (el) => el.value), '');
        assert.equal(await ui.page.$eval('#download-decrypted-file', (el) => el.disabled), true);
        assert.deepEqual(await ui.page.evaluate(() => [window.__messageWorkers, window.__terminatedWorkers]), [1, 1]);
        if (action === 'pagehide') assert.equal(await ui.page.$eval('#encrypted-message-file', (el) => el.files.length), 0);
      } finally { await ui.close(); }
    });
  });
} finally { await new Promise((done) => server.close(done)); await rm(folder, { recursive: true, force: true }); }
