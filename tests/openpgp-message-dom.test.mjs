import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';
import { mountWorkbench } from '../apps/openpgp-workbench/app.js';
const html = readFileSync('apps/openpgp-workbench/index.html', 'utf8');
const armor = readFileSync('tests/fixtures/openpgp/gnupg-enc-sym-cfb-1.asc', 'utf8');
const password = 'synthetic message-only test';
async function until(fn) { for (let i = 0; i < 300; i++) { if (fn()) return; await delay(5); } assert.fail('UI did not settle'); }
function boot(messageDecryptor, { nativeSave } = {}) {
  const dom = new JSDOM(html, { url: 'https://example.test/apps/openpgp-workbench/' }), view = dom.window;
  Object.defineProperty(view, 'isSecureContext', { value: true }); Object.defineProperty(view.crypto, 'subtle', { value: webcrypto.subtle });
  const downloads = [], blobs = new Map();
  view.URL.createObjectURL = (blob) => { const key = `blob:synthetic-message-${blobs.size}`; blobs.set(key, blob); return key; };
  view.URL.revokeObjectURL = () => {};
  view.HTMLAnchorElement.prototype.click = function () { downloads.push({ filename: this.download, blob: blobs.get(this.href) }); };
  if (nativeSave) Object.defineProperty(view, "Html5LocalFiles", { value: { version: 1, save: nativeSave } });
  mountWorkbench({ doc: view.document, view, ...(messageDecryptor ? { messageDecryptor } : {}) });
  const get = (id) => view.document.getElementById(id);
  const input = (id, value) => { get(id).value = value; get(id).dispatchEvent(new view.Event('input', { bubbles: true })); };
  const submit = () => get('decrypt-form').dispatchEvent(new view.Event('submit', { bubbles: true, cancelable: true }));
  const file = (value) => { Object.defineProperty(get('encrypted-message-file'), 'files', { configurable: true, value: value ? [value] : [] }); get('encrypted-message-file').dispatchEvent(new view.Event('change', { bubbles: true })); };
  return { dom, view, get, input, submit, file, downloads };
}

test('file selection stages only; submit sends exactly the selected file/passphrase without requesting a private key or storing data', async () => {
  let calls = 0, seen;
  const ui = boot(async (...args) => { calls++; seen = args; return new TextEncoder().encode('synthetic plaintext'); });
  try {
    const file = { size: 80, arrayBuffer() { assert.fail('the page never reads selected file bytes'); } };
    ui.file(file); assert.equal(calls, 0); assert.equal(ui.get('armored-input').value, '');
    assert.equal(ui.get('download-decrypted-file').disabled, true);
    ui.input('decrypt-passphrase', password); ui.submit(); await until(() => ui.get('decrypt-status').dataset.kind === 'success');
    assert.equal(calls, 1); assert.equal(seen[0], file); assert.equal(seen[1], password);
    assert.ok(seen[2].signal instanceof AbortSignal); assert.equal(ui.get('decrypt-passphrase').value, '');
    assert.equal(ui.get('decrypted-output').value, 'synthetic plaintext');
    assert.equal(ui.get('recovery-private-key').value, ''); assert.equal(ui.get('keyring-list').children.length, 0);
    assert.equal(ui.view.localStorage.length + ui.view.sessionStorage.length, 0); assert.deepEqual(ui.downloads, []);
  } finally { ui.dom.window.close(); }
});
test('binary plaintext is never rendered/executed, embedded filenames are ignored and saving requires separate consent', async () => {
  const data = Uint8Array.of(0, 255, 254, 1);
  const ui = boot(async () => data.slice());
  try {
    ui.input('armored-input', armor); ui.input('decrypt-passphrase', password); ui.submit(); await until(() => ui.get('decrypt-status').dataset.kind === 'success');
    assert.equal(ui.get('decrypted-output').value, ''); assert.match(ui.get('decrypted-payload-status').textContent, /Binary payload/);
    ui.get('download-decrypted-file').click(); assert.deepEqual(ui.downloads, []);
    ui.get('decrypted-save-ack').checked = true; ui.get('decrypted-save-ack').dispatchEvent(new ui.view.Event('change'));
    ui.get('download-decrypted-file').click(); assert.equal(ui.downloads.length, 1);
    assert.equal(ui.downloads[0].filename, 'openpgp-decrypted.bin');
    assert.deepEqual(new Uint8Array(await ui.downloads[0].blob.arrayBuffer()), data);
    assert.match(ui.get('decrypt-status').textContent, /UNENCRYPTED/);
    ui.get('clear-all').click(); assert.equal(ui.get('download-decrypted-file').disabled, true); assert.equal(ui.get('decrypted-save-ack').checked, false);
  } finally { ui.dom.window.close(); }
});
for (const action of ['edit', 'file', 'stop', 'clear', 'output', 'pagehide', 'switch']) test(`${action} invalidates a pending decrypt and cannot resurrect bytes or a save button`, async () => {
  let resolve, signal;
  const ui = boot((input, pass, controls) => { signal = controls.signal; return new Promise((done) => { resolve = done; }); });
  try {
    ui.input('armored-input', armor); ui.input('decrypt-passphrase', password); ui.submit();
    if (action === 'edit') ui.input('armored-input', armor + '\n');
    if (action === 'file') ui.file({ size: 80 });
    if (action === 'stop') ui.get('cancel-message-decrypt').click();
    if (action === 'clear') ui.view.document.querySelector('[data-clear-form="decrypt-form"]').click();
    if (action === 'output') ui.view.document.querySelector('[data-clear-output="decrypted-output"]').click();
    if (action === 'pagehide') ui.view.dispatchEvent(new ui.view.Event('pagehide'));
    if (action === 'switch') ui.get('keyring-tab').click();
    assert.equal(signal.aborted, true); resolve(new TextEncoder().encode('STALE plaintext')); await delay(5);
    assert.equal(ui.get('decrypted-output').value, ''); assert.equal(ui.get('decrypted-save-ack').disabled, true); assert.equal(ui.get('download-decrypted-file').disabled, true);
    assert.deepEqual(ui.downloads, []);
  } finally { ui.dom.window.close(); }
});
test('unavailable local workers fail honestly with no fallback or private-key request', async () => {
  const ui = boot();
  try {
    ui.input('armored-input', armor); ui.input('decrypt-passphrase', password); ui.submit(); await until(() => ui.get('decrypt-status').dataset.kind === 'error');
    assert.match(ui.get('decrypt-status').textContent, /requires a local module worker/);
    assert.equal(ui.get('decrypted-output').value, ''); assert.equal(ui.get('recovery-private-key').value, '');
    assert.equal(ui.get('cancel-message-decrypt').disabled, true);
  } finally { ui.dom.window.close(); }
});

for (const correct of [true, false]) test(`native decrypted-byte save ${correct ? 'confirms only the matching digest' : 'rejects a wrong-hash receipt'}`, async () => {
  let calls = 0;
  const ui = boot(async () => Uint8Array.of(0, 255, 254, 1), { nativeSave: async (blob, filename) => {
    calls++; assert.equal(filename, 'openpgp-decrypted.bin');
    return { status: 'saved', bytes: blob.size, sha256: correct ? Buffer.from(await webcrypto.subtle.digest('SHA-256', await blob.arrayBuffer())).toString('hex') : '0'.repeat(64) };
  } });
  try {
    ui.input('armored-input', armor); ui.input('decrypt-passphrase', password); ui.submit(); await until(() => ui.get('decrypt-status').dataset.kind === 'success');
    ui.get('download-decrypted-file').click(); assert.equal(calls, 0);
    ui.get('decrypted-save-ack').checked = true; ui.get('decrypted-save-ack').dispatchEvent(new ui.view.Event('change'));
    ui.get('download-decrypted-file').click(); await until(() => /Saved |Save failed/.test(ui.get('decrypt-status').textContent));
    assert.equal(calls, 1); assert.equal(ui.get('decrypt-status').dataset.kind, correct ? 'success' : 'error');
    assert.match(ui.get('decrypt-status').textContent, correct ? /read-back verified.*UNENCRYPTED/ : /SHA-256 does not match/);
    assert.deepEqual(ui.downloads, []);
  } finally { ui.dom.window.close(); }
});
test('Clear invalidates a pending save receipt without promising to retract plaintext already handed to the system', async () => {
  let resolve, handed;
  const bytes = Uint8Array.of(0, 255, 254, 1);
  const ui = boot(async () => bytes.slice(), { nativeSave: (blob) => { handed = blob; return new Promise((done) => { resolve = done; }); } });
  try {
    ui.input('armored-input', armor); ui.input('decrypt-passphrase', password); ui.submit(); await until(() => ui.get('decrypt-status').dataset.kind === 'success');
    ui.get('decrypted-save-ack').checked = true; ui.get('decrypted-save-ack').dispatchEvent(new ui.view.Event('change')); ui.get('download-decrypted-file').click();
    ui.get('clear-all').click(); assert.match(ui.get('decrypt-status').textContent, /already handed.*may still finish/);
    assert.deepEqual(new Uint8Array(await handed.arrayBuffer()), bytes, 'Clear cannot retract an already-exported Blob');
    resolve({ status: 'saved', bytes: handed.size, sha256: Buffer.from(await webcrypto.subtle.digest('SHA-256', await handed.arrayBuffer())).toString('hex') }); await delay(5);
    assert.match(ui.get('decrypt-status').textContent, /Fields cleared/); assert.equal(ui.get('decrypted-output').value, '');
    assert.equal(ui.get('download-decrypted-file').disabled, true); assert.equal(ui.get('decrypted-save-ack').checked, false);
  } finally { ui.dom.window.close(); }
});

test('UTF-8 text-file byte export preserves CRLF even though the HTML preview normalizes display line endings', async () => {
  const original = new TextEncoder().encode('Synthetic first line\r\nsecond line\r\n');
  const ui = boot(async () => original.slice());
  try {
    ui.input('armored-input', armor); ui.input('decrypt-passphrase', password); ui.submit(); await until(() => ui.get('decrypt-status').dataset.kind === 'success');
    assert.equal(ui.get('decrypted-output').value, 'Synthetic first line\nsecond line\n');
    assert.match(ui.get('decrypted-payload-status').textContent, /line endings may normalize/);
    ui.get('decrypted-save-ack').checked = true; ui.get('decrypted-save-ack').dispatchEvent(new ui.view.Event('change')); ui.get('download-decrypted-file').click();
    assert.equal(ui.downloads.length, 1); assert.deepEqual(new Uint8Array(await ui.downloads[0].blob.arrayBuffer()), original);
  } finally { ui.dom.window.close(); }
});
