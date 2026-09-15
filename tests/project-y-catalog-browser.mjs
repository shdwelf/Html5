import assert from 'node:assert/strict';
import {browserDeps,withBrowser} from './lib-browser.mjs';
const deps=await browserDeps();if(!deps){console.log('SKIP: optional browser dependencies unavailable');process.exit(0);}
await withBrowser(deps,async browser=>{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setRequestInterception(true);
 page.on('request',request=>{const url=new URL(request.url());if(url.hostname==='127.0.0.1'||url.hostname==='localhost')request.continue();else request.abort();});
 await page.setViewport({width:1280,height:1000});
 await page.goto(process.argv[2]||'http://127.0.0.1:5173/los-alamos.html',{waitUntil:'networkidle0'});
 assert.equal(await page.$eval('#total',e=>e.textContent),'1404');
 assert.equal(await page.$$eval('.records .record',els=>els.length),100);
 assert.equal(await page.$eval('#montage-view',e=>e.getAttribute('aria-pressed')),'true');
 // All external access is blocked: catalog, search, source links, and local reference still work.
 await page.type('#search','Mary P. Frankel');
 assert.equal(await page.$$eval('.records .record',els=>els.length),1);
 // The 4Dwm loads a floating pip for the card instead of the old shared dialog.
 await page.click('.record-image');
 assert.equal(await page.$$eval('.pip-layer .pip4',els=>els.length),1);
 assert.ok((await page.$eval('.pip4 .pip4-body',e=>e.textContent)).includes('BADGE NUMBER NOT TRANSCRIBED'));
 assert.ok((await page.$eval('.pip4 .pip4-body .source-filename',e=>e.textContent)).includes('Mary P. Frankel Los Alamos ID.png'));
 await page.click('.pip4 .pip4-body .detail-save');
 assert.equal(await page.$eval('#wm4d',e=>e.hidden),false);
 await page.click('.pip4 [data-act="close"]');
 assert.equal(await page.$$eval('.pip-layer .pip4',els=>els.length),0);
 await page.$eval('#search',e=>{e.value='';e.dispatchEvent(new Event('input'));});
 await page.click('#saved-tab');assert.equal(await page.$$eval('.records .record',e=>e.length),1);
 await page.click('#curated-tab');assert.equal(await page.$$eval('.records .record',e=>e.length),7);
 await page.click('#all-tab');
 await page.click('[data-letter="Z"]');assert.equal(await page.$$eval('.records .record',e=>e.length),4);
 await page.click('[data-letter="X"]');assert.ok(await page.$('#reset'));await page.click('#reset');
 await page.select('#page-size','all');assert.equal(await page.$$eval('.records .record',e=>e.length),1404);
 assert.equal(await page.$eval('#pagination',e=>e.textContent),'');
 // 4Dwm: PIP RESULTS loads one floating pip per card (capped), then desk tile/iconify/clear.
 await page.click('#pip-results');
 assert.equal(await page.$$eval('.pip-layer .pip4',els=>els.length),12);
 assert.ok((await page.$eval('#wm4d-status',e=>e.textContent)).includes('more cards'));
 await page.click('[data-wm4d="desk"]');
 assert.equal(await page.$$eval('.pip4.is-icon',els=>els.length),12);
 await page.click('[data-wm4d="desk"]');
 assert.equal(await page.$$eval('.pip4.is-icon',els=>els.length),0);
 await page.click('[data-wm4d="tile"]');
 assert.ok(new Set(await page.$$eval('.pip4',els=>els.map(e=>e.style.top))).size>1);
 await page.click('.pip4 [data-act="icon"]');
 assert.equal(await page.$$eval('#wm4d-tray .wm4d-chip',els=>els.length),1);
 await page.click('#wm4d-tray .wm4d-chip');
 assert.equal(await page.$$eval('.pip4:not(.is-icon)',els=>els.length),12);
 await page.click('[data-wm4d="clear"]');
 assert.equal(await page.$$eval('.pip-layer .pip4',els=>els.length),0);
 await page.select('#page-size','100');await page.click('#next');assert.ok((await page.$eval('#pagination',e=>e.textContent)).includes('101–200'));
 for(const id of ['grid','list','montage']){await page.click('#'+id+'-view');assert.equal(await page.$eval('#'+id+'-view',e=>e.getAttribute('aria-pressed')),'true');}
 await page.click('#open-montage-reference');
 assert.equal(await page.$eval('#montage-reference',e=>e.open),true);
 assert.ok(await page.$eval('#reference-image',e=>e.naturalWidth>0));
 await page.$eval('#reference-zoom',e=>{e.value='200';e.dispatchEvent(new Event('input'));});
 assert.equal(await page.$eval('#reference-image',e=>e.style.width),'200%');await page.keyboard.press('Escape');
 await page.click('#load-all');await page.waitForFunction(()=>document.querySelector('#load-status').textContent.includes('Update incomplete'));
 assert.equal(await page.$eval('#total',e=>e.textContent),'1404');
 // Verify export includes all filtered pages, not just visible tiles.
 await page.evaluate(()=>{const create=URL.createObjectURL;URL.createObjectURL=blob=>{window.exportedCSV=blob.text();return create(blob);};});
 await page.click('#download');const csv=await page.evaluate(()=>window.exportedCSV);
 assert.equal(csv.split('\r\n').length,1405);assert.ok(csv.includes('Mary P. Frankel Los Alamos ID.png'));
 await page.$eval('#collection',e=>e.scrollIntoView());await page.screenshot({path:'/tmp/project-y-catalog-desktop.png'});
 await page.setViewport({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await page.screenshot({path:'/tmp/project-y-catalog-mobile.png'});
 assert.deepEqual(errors,[]);
 console.log('PASS: 1404 offline-indexed files, montage/cards/list, search, filters, reviewed/saved tabs, all-files view, pagination, source dialog, reference zoom, CSV, failed-update preservation, and mobile layout. Remote image success was not claimed: external requests were blocked.');
});
