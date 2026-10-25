#!/usr/bin/env node
// Optional real-browser check. Run against your local build, not a third-party site.
// Browser automation is the dependency-free JavaScript conversion of the
// Playwright slice (./cdp-browser.mjs — see docs/playwright-164-disassembly-javascript-2026-10-25.md);
// the only external piece left is a Chromium binary (CHROMIUM_EXECUTABLE or
// the optional @sparticuz/chromium package, kept outside the production
// package on purpose; see README).
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {ROOT} from './deps.mjs';
import {decryptVault,validateWorkspaceVault} from './web/vault.mjs';
import {readExchange} from './exchange.mjs';
import {launchChromium} from './cdp-browser.mjs';
const require=createRequire(path.join(process.env.WIKI_BROWSER_MODULES||path.join(ROOT,'.cache/wiki-browser'),'package.json'));
const browserPackage=process.env.CHROMIUM_EXECUTABLE?null:require('@sparticuz/chromium');
const bundled=browserPackage?.default||browserPackage;
const base=(process.argv[2]||'http://127.0.0.1:3003').replace(/\/$/,'');
const screenshots=path.join(ROOT,'.cache/wiki-browser-results');mkdirSync(screenshots,{recursive:true});
const browser=await launchChromium({executablePath:process.env.CHROMIUM_EXECUTABLE||await bundled.executablePath(),args:bundled?.args||['--no-sandbox'],headless:true});
try {
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const catalog=await (await page.request.get(base+'/repository.json')).json();
  await page.goto(base);await page.waitForSelector('#file-list button');
  console.log('Catalog:',await page.locator('#count').innerText());
  await page.screenshot({path:path.join(screenshots,'library.png'),fullPage:true});
  await page.locator('#search').fill('boy.djvu');await page.locator('#file-list button').first().click();
  await page.waitForFunction(()=>document.querySelector('#media-preview p')?.textContent.includes('DjVu page'));
  console.log('Library DjVu:',await page.locator('#media-preview p').innerText());
  await page.locator('[data-view="vault"]').click();await page.locator('#password').fill('browser test only passphrase');
  await page.locator('#include-file').check();const download=page.waitForEvent('download');await page.locator('#export-vault').click();
  const exported=await download,envelope=readFileSync(await exported.path(),'utf8');
  const value=await validateWorkspaceVault(await decryptVault(envelope,'browser test only passphrase'));
  assert.equal(value.files.length,1);assert.ok(value.files[0].name.endsWith('boy.djvu'));
  await page.locator('#password').fill('browser test only passphrase');
  await page.locator('#import-vault').setInputFiles({name:'test.haikuvault',mimeType:'application/octet-stream',buffer:Buffer.from(envelope)});
  await page.waitForFunction(()=>document.querySelector('#vault-info').textContent.includes('Verified 1 page(s) and 1 file(s)'));
  const jsonDownload=page.waitForEvent('download');await page.getByRole('button',{name:/Download page JSON:/}).click();
  const pageJson=readFileSync(await (await jsonDownload).path(),'utf8');
  assert.equal(readExchange(JSON.parse(pageJson)).length,1);
  writeFileSync(path.join(screenshots,'exported-page.json'),pageJson);
  console.log('Encrypted page + exact file round-trip, and exported page JSON: passed');
  await page.goto(base+'/wiki/#/calendar');await page.waitForSelector('.calendar-day');
  assert.equal(await page.locator('nav.tabs svg').count(),7);
  await page.screenshot({path:path.join(screenshots,'calendar.png'),fullPage:true});
  await page.locator('#calendarDate').fill('2026-10-22');await page.locator('#calendarTitle').fill('Browser smoke event');
  await page.locator('#calendarCreate button').click();await page.waitForURL(/2026-10-22/);
  await page.goto(base+'/tiddlywiki.html');await page.waitForSelector('[data-tiddler-title="Repository Home"]',{timeout:60000});
  assert.equal(await page.evaluate(()=>$tw.wiki.filterTiddlers('[tag[Repository]]').length),catalog.totals.pages);
  const sourceTitle=await page.evaluate(()=>$tw.wiki.filterTiddlers('[tag[Repository]field:source-path[README.md]]')[0]);
  assert.ok(sourceTitle);
  await page.evaluate(title=>$tw.wiki.addTiddler({title:'$:/StoryList',list:[title]}),sourceTitle);
  await page.waitForFunction(()=>document.querySelector('.tc-tiddler-frame')?.textContent.includes('Source path:'));
  assert.ok((await page.locator('.tc-tiddler-frame').first().innerText()).includes('Linked source pages'));
  const before=await page.evaluate(()=>localStorage.length);assert.ok(before<30,'the source corpus must not be mirrored into localStorage');
  await page.evaluate(()=>$tw.wiki.addTiddler({title:'Browser persistence test',type:'text/plain',text:'saved note'}));
  await page.waitForFunction(()=>localStorage.getItem('tw5#/tiddlywiki.html#Browser persistence test')?.includes('saved note'));
  await page.reload();await page.waitForFunction(()=>$tw.wiki.getTiddlerText('Browser persistence test')==='saved note');
  console.log('Native TiddlyWiki:',catalog.totals.pages,'source tiddlers; metadata links; local edit survived reload');
  await page.screenshot({path:path.join(screenshots,'tiddlywiki.png'),fullPage:true});
  await page.goto(base+'/djvu-demo.html');await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('rendered'));
  await page.setViewportSize({width:390,height:844});await page.goto(base+'/library/');await page.waitForSelector('#file-list button');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.screenshot({path:path.join(screenshots,'mobile-library.png'),fullPage:true});
  await page.goto(base+'/wiki/#/calendar');await page.waitForSelector('.calendar-day');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  assert.ok(await page.evaluate(()=>document.querySelector('.calendar-grid').getBoundingClientRect().height<650));
  await page.screenshot({path:path.join(screenshots,'mobile-calendar.png'),fullPage:true});
  assert.deepEqual(errors,[]);console.log('Mobile layouts: no horizontal overflow; compact calendar. JavaScript errors: none.');
  console.log('Screenshots:',screenshots);
} finally { await browser.close(); }
