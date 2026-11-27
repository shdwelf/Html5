import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { browserDeps, serve, withBrowser } from './lib-browser.mjs';

const deps = await browserDeps();
test('gateway toolbox changes format/runtime/templates and reads an inert local header without network or execution', { skip: !deps, timeout: 60000 }, async () => {
  const { server, port } = await serve();
  try {
    await withBrowser(deps, async browser => {
      const page = await browser.newPage(), remote = [], errors = [];
      await page.setRequestInterception(true);
      page.on('request', request => { if (new URL(request.url()).hostname === '127.0.0.1') request.continue(); else { remote.push(request.url()); request.abort(); } });
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`http://127.0.0.1:${port}/gateway-config.html`, { waitUntil: 'networkidle0' });
      await page.waitForFunction(() => document.getElementById('analysisPlan').textContent.includes('analyzeHeadless'));
      await page.select('#analysisRuntime', 'zulu');
      assert.match(await page.$eval('#analysisPlan', el => el.textContent), /ZULU_21_HOME/);
      await page.select('#analysisAcquisition', 'direct');
      assert.match(await page.$eval('#analysisPlan', el => el.textContent), /--noproxy '\*'/);
      await page.select('#analysisAcquisition', 'proxy');
      assert.match(await page.$eval('#analysisPlan', el => el.textContent), /--proxy "\$HTTPS_PROXY"/);
      await page.select('#analysisFormat', 'dotnet');
      assert.equal(await page.$eval('#analysisRuntime', el => el.disabled), true);
      assert.match(await page.$eval('#analysisPlan', el => el.textContent), /ilspycmd/);
      const dir = resolve('.cache/vpn-analysis-fixtures'); mkdirSync(dir, { recursive: true });
      const file = resolve(dir, 'synthetic-ELF-not-executed.bin');
      const bytes = Buffer.alloc(64); bytes.set([0x7f, 0x45, 0x4c, 0x46, 2, 1, 1]); writeFileSync(file, bytes);
      await (await page.$('#analysisFile')).uploadFile(file);
      await page.waitForFunction(() => document.getElementById('analysisStatus').textContent.includes('Read 64 header bytes'));
      assert.equal(await page.$eval('#analysisFormat', el => el.value), 'native');
      assert.match(await page.$eval('#analysisStatus', el => el.textContent), /no upload, execution, decompilation or decryption/);
      await page.click('#analysisClear');
      assert.equal(await page.$eval('#analysisFile', el => el.value), '');
      assert.match(await page.$eval('#analysisStatus', el => el.textContent), /cleared/);
      for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
        await page.setViewport(viewport);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      }
      assert.deepEqual(remote, []); assert.deepEqual(errors, []);
      await page.close();
    });
  } finally { await new Promise(resolve => server.close(resolve)); }
});
