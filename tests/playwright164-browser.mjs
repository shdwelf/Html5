/**
 * Real-browser check for the Playwright-1.64 JavaScript conversion
 * (tools/wiki-workspace/cdp-browser.mjs): drives actual Chromium over raw
 * CDP — no playwright-core, no puppeteer.
 *
 * Skips cleanly when the browser deps are absent:
 *   npm i --no-save @sparticuz/chromium
 * (the same binary source tests/lib-browser.mjs uses; CHROMIUM_EXECUTABLE
 * also works via the fallback executable path below.)
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {existsSync, readFileSync} from 'node:fs';
import {launchChromium} from '../tools/wiki-workspace/cdp-browser.mjs';
import {unpackLibs} from './lib-browser.mjs';

let chromium = null;
let executablePath = process.env.CHROMIUM_EXECUTABLE || null;
if (!executablePath) {
  try {
    chromium = (await import('@sparticuz/chromium')).default;
    executablePath = await chromium.executablePath();
  } catch { /* deps absent: skip */ }
}
if (!executablePath || !existsSync(executablePath)) {
  console.log('playwright164 browser: SKIPPED (npm i --no-save @sparticuz/chromium, or set CHROMIUM_EXECUTABLE)');
  process.exit(0);
}

const FIXTURE = `<!doctype html><title>pw164 fixture</title>
<input id="name" placeholder="name">
<input id="flag" type="checkbox">
<button id="go">Greet</button>
<div role="button" aria-label="Download page JSON: fixture" id="roleBtn">json</div>
<a id="dl" href="/download">download</a>
<input id="file" type="file">
<p class="tile">one</p><p class="tile">two</p><p class="tile">three</p>
<div id="out">idle</div>
<script>
  document.getElementById('go').addEventListener('click', () => {
    document.getElementById('out').textContent = 'Hello ' + document.getElementById('name').value;
  });
  document.getElementById('roleBtn').addEventListener('click', () => {
    document.getElementById('out').textContent = 'role clicked';
  });
  document.getElementById('file').addEventListener('change', (e) => {
    document.getElementById('out').textContent = 'file:' + e.target.files[0].name;
  });
</script>`;

const server = createServer((req, res) => {
  if (req.url === '/download') {
    res.writeHead(200, {'content-type': 'text/plain', 'content-disposition': 'attachment; filename="hello.txt"'});
    res.end('hello from download\n');
    return;
  }
  res.writeHead(200, {'content-type': 'text/html; charset=utf-8'});
  res.end(FIXTURE);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

const libDir = unpackLibs();
const browser = await launchChromium({
  executablePath,
  // The repo's proven arg set (tests/lib-browser.mjs). NOT chromium.args:
  // @sparticuz/chromium's Lambda defaults (--single-process, --headless='shell')
  // deadlock the Target/DevTools flow — observed hanging this very test.
  args: [
    '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu-sandbox',
    '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
  ],
  env: {...process.env, LD_LIBRARY_PATH: `${libDir}:${process.env.LD_LIBRARY_PATH ?? ''}`},
  headless: true,
});

try {
  const page = await browser.newPage({viewport: {width: 900, height: 700}});
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));

  await test('goto + fill + click + waitForFunction round-trip through real CDP', async () => {
    await page.goto(base + '/');
    await page.locator('#name').fill('Ada');
    await page.locator('#go').click();
    await page.waitForFunction(() => document.querySelector('#out').textContent === 'Hello Ada');
    assert.equal(await page.locator('#out').innerText(), 'Hello Ada');
    assert.equal(await page.locator('.tile').count(), 3);
  });

  await test('evaluate passes arguments; checkbox check() sticks', async () => {
    assert.equal(await page.evaluate((x) => x * 6, 7), 42);
    await page.locator('#flag').check();
    assert.equal(await page.evaluate(() => document.getElementById('flag').checked), true);
  });

  await test('getByRole matches accessible name (ARIA slice of the locator engine)', async () => {
    await page.getByRole('button', {name: /Download page JSON:/}).click();
    await page.waitForFunction(() => document.querySelector('#out').textContent === 'role clicked');
  });

  await test('waitForSelector visibility + hash waitForURL + PNG screenshot', async () => {
    await page.waitForSelector('#out');
    await page.evaluate(() => { location.hash = '#/done'; });
    await page.waitForURL(/#\/done/);
    const shot = await page.screenshot({fullPage: true});
    assert.deepEqual([...shot.subarray(0, 4)], [0x89, 0x50, 0x4e, 0x47], 'PNG magic');
    assert.ok(shot.length > 500, 'screenshot suspiciously small');
  });

  await test('download event lands the attachment bytes on disk', async () => {
    const waiting = page.waitForEvent('download');
    await page.locator('#dl').click();
    const dl = await waiting;
    assert.equal(dl.suggestedFilename(), 'hello.txt');
    assert.equal(readFileSync(await dl.path(), 'utf8'), 'hello from download\n');
  });

  await test('setInputFiles delivers an in-memory payload to a file input', async () => {
    await page.locator('#file').setInputFiles({name: 'up.txt', mimeType: 'text/plain', buffer: Buffer.from('payload')});
    await page.waitForFunction(() => document.querySelector('#out').textContent === 'file:up.txt');
    assert.deepEqual(pageErrors, []);
  });
} finally {
  await browser.close();
  server.close();
}
