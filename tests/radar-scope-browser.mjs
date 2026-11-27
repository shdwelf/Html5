import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import test from 'node:test';
import { browserDeps, serve, withBrowser } from './lib-browser.mjs';

const deps = await browserDeps();
const viewportCases = [
  { width: 1440, height: 1000 }, { width: 1024, height: 768 },
  { width: 768, height: 1024 }, { width: 390, height: 844 },
  { width: 320, height: 568 }, { width: 844, height: 390 },
];
const fixture = { aircraft: [{ hex: 'a12345', flight: '<img src=x onerror=alert(1)>', lat: 37.2, lon: -95.7, alt_baro: 10000, gs: 100, track: 30, t: 'TEST' }] };
async function pageFor(browser, port, mode = 'fixture') {
  const page = await browser.newPage(), requests = [], errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setRequestInterception(true);
  page.on('request', request => {
    if (new URL(request.url()).hostname === '127.0.0.1') return request.continue();
    requests.push(request.url());
    if (mode === 'offline') return request.abort('failed');
    return request.respond({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(request.url().includes('airplanes.live') ? { ac: fixture.aircraft } : fixture) });
  });
  await page.goto(`http://127.0.0.1:${port}/apps/radar_scope.html`, { waitUntil: 'load' });
  await page.waitForSelector('.ac-list-item');
  return { page, requests, errors };
}
async function assertTiled(page) {
  const result = await page.evaluate(() => {
    const ids = ['scopeWindow', 'statusPanel', 'statsPanel', 'listPanel', 'selectedPanel', 'detailsPanel'];
    const boxes = ids.map(id => document.getElementById(id)).filter(el => getComputedStyle(el).display !== 'none' && el.getClientRects().length).map(el => ({ id: el.id, ...Object.fromEntries(['left', 'top', 'right', 'bottom', 'width'].map(k => [k, el.getBoundingClientRect()[k]])) }));
    const overlaps = [];
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j];
      if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1) overlaps.push([a.id, b.id]);
    }
    const clipped = [...document.querySelectorAll('button,select')].filter(el => getComputedStyle(el).display !== 'none' && el.getClientRects().length).filter(el => { const r = el.getBoundingClientRect(); return r.left < -1 || r.right > innerWidth + 1 || r.width < 1; }).map(el => el.id || el.className);
    return { overlaps, clipped, width: innerWidth, scrollWidth: document.documentElement.scrollWidth, canvasWidth: document.getElementById('radarCanvas').getBoundingClientRect().width };
  });
  assert.deepEqual(result.overlaps, [], JSON.stringify(result));
  assert.deepEqual(result.clipped, [], JSON.stringify(result));
  assert.ok(result.scrollWidth <= result.width + 1, JSON.stringify(result));
  assert.ok(result.canvasWidth > 150, JSON.stringify(result));
}

test('radar tiled 4DWM layout has no instrument overlaps at six viewport sizes, including open target details', { skip: !deps, timeout: 120000 }, async () => {
  const { server, port } = await serve();
  try {
    await withBrowser(deps, async browser => {
      const { page, requests, errors } = await pageFor(browser, port);
      for (const viewport of viewportCases) {
        await page.setViewport(viewport);
        await page.waitForFunction(() => Math.abs(document.getElementById('radarCanvas').getBoundingClientRect().width - document.querySelector('.radar-container').clientWidth) < 2);
        await assertTiled(page);
        await (await page.$('.ac-list-item')).click();
        await assertTiled(page);
        await page.evaluate(() => closeDetails());
      }
      await page.setViewport({ width: 1440, height: 1000 });
      await page.evaluate(() => scrollTo(0, 0));
      mkdirSync('.cache/radar-review', { recursive: true });
      await page.screenshot({ path: '.cache/radar-review/radar-desktop.png', fullPage: true });
      await page.setViewport({ width: 390, height: 844 });
      await page.waitForFunction(() => Math.abs(document.getElementById('radarCanvas').getBoundingClientRect().width - document.querySelector('.radar-container').clientWidth) < 2);
      await page.screenshot({ path: '.cache/radar-review/radar-mobile.png', fullPage: true });
      assert.deepEqual(requests, []); assert.deepEqual(errors, []);
      await page.close();
    });
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test('direct and proxy routes are exclusive, consented, inert to hostile feed text and stop cleanly', { skip: !deps, timeout: 60000 }, async () => {
  const { server, port } = await serve();
  try {
    await withBrowser(deps, async browser => {
      const { page, requests, errors } = await pageFor(browser, port);
      await page.click('#btnStart');
      await page.waitForFunction(() => document.getElementById('scopeStatus').textContent.startsWith('LIVE'));
      assert.equal(requests.length, 2);
      assert.ok(requests.every(url => /^https:\/\/api\.(adsb\.fi|airplanes\.live)\//.test(url)));
      assert.equal(await page.$('.ac-list-item img'), null);
      assert.match(await page.$eval('.ac-list-item .cs', el => el.textContent), /<img/);
      await page.select('#networkMode', 'proxy');
      const before = requests.length;
      await page.click('#btnStart');
      assert.match(await page.$eval('#networkStatus', el => el.textContent), /consent is required/);
      assert.equal(requests.length, before);
      await page.click('#proxyConsent'); await page.click('#btnStart');
      await page.waitForFunction(() => document.getElementById('networkStatus').textContent.includes('LIVE — explicit proxy'));
      assert.equal(requests.length, before + 2);
      assert.ok(requests.slice(before).every(url => url.startsWith('https://api.allorigins.win/raw?url=')));
      await page.click('#btnPause');
      assert.match(await page.$eval('#scopeStatus', el => el.textContent), /DEMO/);
      await page.click('#btnMinimal'); await assertTiled(page);
      await page.click('#btnMinimal'); await assertTiled(page);
      assert.deepEqual(errors, []);
      await page.close();
    });
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test('direct network failure never falls through to a third-party proxy', { skip: !deps, timeout: 60000 }, async () => {
  const { server, port } = await serve();
  try {
    await withBrowser(deps, async browser => {
      const { page, requests, errors } = await pageFor(browser, port, 'offline');
      await page.click('#btnStart');
      await page.waitForFunction(() => document.getElementById('networkStatus').textContent.includes('unavailable'));
      assert.equal(requests.length, 2);
      assert.ok(requests.every(url => !url.includes('allorigins') && !url.includes('corsproxy')));
      assert.match(await page.$eval('#scopeStatus', el => el.textContent), /DEMO/);
      assert.deepEqual(errors, []);
      await page.close();
    });
  } finally { await new Promise(resolve => server.close(resolve)); }
});
