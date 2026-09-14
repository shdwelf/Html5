import assert from 'node:assert/strict';
import {browserDeps,withBrowser} from './lib-browser.mjs';
const deps=await browserDeps();
if(!deps){console.log('SKIP: install puppeteer-core and @sparticuz/chromium for browser checks.');process.exit(0);}
await withBrowser(deps,async browser=>{
 const page=await browser.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.setViewport({width:1280,height:1000});
 await page.goto((process.argv[2]||'http://127.0.0.1:5173/los-alamos.html')+'#sites',{waitUntil:'networkidle0'});
 await page.$eval('#sites',e=>e.scrollIntoView());
 await page.waitForFunction(()=>document.querySelector('#site-render-status').textContent.includes('Drag to explore'));
 let last=null;
 for(const id of ['los-alamos','hanford','trinity']){
  await page.click(`[data-site="${id}"]`);
  assert.equal(await page.$eval(`[data-site="${id}"]`,e=>e.getAttribute('aria-pressed')),'true');
  assert.ok((await page.$eval('#site-vrml',e=>e.href)).endsWith(id+'.wrl'));
  const response=await page.evaluate(async()=>{const r=await fetch(document.querySelector('#site-vrml').href);return {status:r.status,text:await r.text()};});
  assert.equal(response.status,200);assert.ok(response.text.startsWith('#VRML V2.0 utf8'));
  const shot=await (await page.$('#site-canvas')).screenshot();
  if(last)assert.notDeepEqual(shot,last);last=shot;
 }
 await page.click('#site-wire');assert.equal(await page.$eval('#site-wire',e=>e.getAttribute('aria-pressed')),'true');
 for(const id of ['site-top','site-left','site-right','site-zoom-in','site-zoom-out','site-reset'])await page.click('#'+id);
 await page.screenshot({path:'/tmp/project-y-sites-desktop.png'});
 await page.setViewport({width:390,height:844});
 await page.click('[data-site="hanford"]');
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await page.screenshot({path:'/tmp/project-y-sites-mobile.png'});
 assert.deepEqual(errors,[]);
 // Simulate missing WebGL: sources and download links must still work.
 const fallback=await browser.newPage();
 await fallback.evaluateOnNewDocument(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...rest){return type.startsWith('webgl')?null:get.call(this,type,...rest);};});
 await fallback.goto((process.argv[2]||'http://127.0.0.1:5173/los-alamos.html')+'#sites');
 await fallback.waitForFunction(()=>document.querySelector('#site-stage').classList.contains('unavailable'));
 await fallback.click('[data-site="trinity"]');
 assert.ok((await fallback.$eval('#site-detail',e=>e.textContent)).includes('Trinity Test Site'));
 assert.ok((await fallback.$eval('#site-vrml',e=>e.href)).endsWith('trinity.wrl'));
 console.log('PASS: Three.js scenes, site switching, VRML downloads, controls, mobile layout, and no-WebGL fallback.');
});
