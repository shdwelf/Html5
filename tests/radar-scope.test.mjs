import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { JSDOM, VirtualConsole } from 'jsdom';

const html = readFileSync(new URL('../apps/ads-b-radar-scope', import.meta.url), 'utf8');
function boot() {
  const requests = [], timers = new Map(), errors = []; let sequence = 0;
  const virtualConsole = new VirtualConsole(); virtualConsole.on('jsdomError', error => errors.push(error.message));
  const dom = new JSDOM(html, {
    runScripts: 'dangerously', url: 'https://radar.invalid/', virtualConsole,
    beforeParse(window) {
      window.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: (_, key) => ['createRadialGradient', 'createLinearGradient', 'createConicGradient'].includes(key) ? () => ({ addColorStop() {} }) : () => {} });
      window.requestAnimationFrame = () => 1;
      window.setInterval = (fn, ms) => { timers.set(++sequence, { fn, ms }); return sequence; };
      window.clearInterval = id => timers.delete(id);
      window.fetch = async url => { requests.push(url); throw new Error('Synthetic offline control'); };
      window.AbortController = AbortController; window.TextDecoder = TextDecoder;
    }
  });
  return { window: dom.window, document: dom.window.document, requests, timers, close: () => { dom.window.close(); assert.deepEqual(errors, [], 'Radar must not hide a startup/event exception'); } };
}
const tick = () => new Promise(resolve => setTimeout(resolve, 0));

test('browser alias is exact and the self-contained app needs no remote scripts or styles', () => {
  assert.equal(readFileSync(new URL('../apps/radar_scope.html', import.meta.url), 'utf8'), html);
  const d = new JSDOM(html).window.document;
  assert.equal(d.querySelectorAll('script[src],link[rel=stylesheet],iframe').length, 0);
  assert.match(html, /4DWM \/ tiled instruments/);
  assert.doesNotMatch(html, /startAutoShare|thingproxy|codetabs/);
});

test('startup is clearly marked synthetic demo with zero fetches and no auto-sharing timer', () => {
  const app = boot();
  try {
    assert.equal(app.requests.length, 0);
    assert.match(app.document.getElementById('scopeStatus').textContent, /DEMO.*synthetic/);
    assert.match(app.document.getElementById('networkStatus').textContent, /no feed requests/);
    assert.equal([...app.timers.values()].some(x => x.ms === 15000), false);
    assert.ok(app.document.querySelectorAll('.ac-list-item').length > 0);
  } finally { app.close(); }
});

test('direct mode fails to demo without contacting any proxy and explicit proxy requires consent', async () => {
  const app = boot();
  try {
    app.window.startLive(); await tick();
    assert.equal(app.requests.length, 2);
    assert.ok(app.requests.every(url => /^https:\/\/api\.(adsb\.fi|airplanes\.live)\//.test(url)));
    assert.match(app.document.getElementById('networkStatus').textContent, /DEMO.*unavailable.*no proxy fallback/);
    const mode = app.document.getElementById('networkMode'); mode.value = 'proxy';
    mode.dispatchEvent(new app.window.Event('change'));
    const before = app.requests.length;
    app.window.startLive(); await tick();
    assert.equal(app.requests.length, before);
    assert.match(app.document.getElementById('networkStatus').textContent, /consent is required/);
    app.document.getElementById('proxyConsent').checked = true;
    app.window.startLive(); await tick();
    assert.equal(app.requests.length, before + 2);
    assert.ok(app.requests.slice(before).every(url => url.startsWith('https://api.allorigins.win/raw?url=')));
    assert.equal(app.requests.some(url => url.startsWith('https://corsproxy.io/')), false);
  } finally { app.close(); }
});

test('tiled instruments can be hidden/restored and keyboard shortcuts do not hijack controls', () => {
  const app = boot();
  try {
    const button = app.document.getElementById('btnMinimal');
    button.click(); assert.equal(button.getAttribute('aria-expanded'), 'false');
    assert.ok(app.document.getElementById('workspace').classList.contains('is-minimal'));
    button.click(); assert.equal(button.getAttribute('aria-expanded'), 'true');
    const select = app.document.getElementById('networkMode');
    select.dispatchEvent(new app.window.KeyboardEvent('keydown', { key: 'm', bubbles: true }));
    assert.equal(button.getAttribute('aria-expanded'), 'true');
    app.document.body.dispatchEvent(new app.window.KeyboardEvent('keydown', { key: 'm', bubbles: true }));
    assert.equal(button.getAttribute('aria-expanded'), 'false');
    app.window.togglePanel('stats');
    assert.equal(app.document.getElementById('btnStats').getAttribute('aria-pressed'), 'false');
  } finally { app.close(); }
});

test('track list uses real keyboard buttons and target details remain separate from the radar canvas', () => {
  const app = boot();
  try {
    const first = app.document.querySelector('.ac-list-item'); assert.equal(first.tagName, 'BUTTON');
    first.click();
    const details = app.document.getElementById('detailsPanel');
    assert.ok(details.classList.contains('active'));
    assert.equal(details.parentElement.id, 'hudOverlay');
    assert.equal(app.document.querySelector('.radar-container').contains(details), false);
    app.window.closeDetails(); assert.equal(details.classList.contains('active'), false);
  } finally { app.close(); }
});

test('pausing aborts pending requests and stale successful replies cannot replace demo state', async () => {
  const app = boot(), pending = []; let aborted = 0;
  try {
    app.window.fetch = (url, options) => new Promise(resolve => {
      options.signal.addEventListener('abort', () => aborted++);
      pending.push(() => resolve(new Response(JSON.stringify(url.includes('airplanes.live') ? { ac: [] } : { aircraft: [] }), { headers: { 'Content-Type': 'application/json' } })));
    });
    app.window.startLive();
    assert.equal(pending.length, 2);
    app.window.pauseLive();
    assert.equal(aborted, 2);
    for (const resolve of pending) resolve();
    await tick(); await tick();
    assert.match(app.document.getElementById('scopeStatus').textContent, /DEMO/);
    assert.match(app.document.getElementById('networkStatus').textContent, /no feed requests/);
    assert.ok(app.document.querySelectorAll('.ac-list-item').length > 0);
  } finally { app.close(); }
});
