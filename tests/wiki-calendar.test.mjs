import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
const html=readFileSync(new URL('../wikiinajar.html',import.meta.url),'utf8');
function browser(t) {
  const dom=new JSDOM(html,{url:'https://wiki.example/wikiinajar.html',runScripts:'outside-only'});
  t.after(()=>dom.window.close());dom.window.fetch=async()=>({ok:false});dom.window.TextEncoder=TextEncoder;dom.window.TextDecoder=TextDecoder;
  const inline=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n');
  dom.window.eval(inline+`\nwindow.calendarTest={setMonth(y,m){calCursor={y,m};renderCalendar();},events:calendarEvents,cells:wikiMonthCells,setContacts(value){contacts=value;},setDocs(value){bundledDocs=new Map(value);},hide(title){pages[title]={deleted:true};}};`);
  return {w:dom.window,d:dom.window.document,api:dom.window.calendarTest};
}
test('calendar renders an empty month grid without emoji fonts or seed events',t=>{
  const {d,api}=browser(t);api.setMonth(2026,2);
  assert.equal(d.querySelectorAll('.calendar-day').length,28);assert.match(d.querySelector('#calendarList').textContent,/No events this month/);
  assert.ok(d.querySelector('[data-tab="calendar"] svg'));assert.match(d.querySelector('[data-tab="calendar"]').textContent,/Calendar/);
  assert.equal(api.cells(2024,2).filter(Boolean).length,29);assert.throws(()=>api.cells(2026,13));
});
test('creating an event writes a normal dated page and it survives a calendar rerender',t=>{
  const {w,d,api}=browser(t);api.setMonth(2026,10);
  d.querySelector('[data-day="22"]').click();assert.equal(d.querySelector('#calendarDate').value,'2026-10-22');
  d.querySelector('#calendarTitle').value='Research review';d.querySelector('#calendarCreate').dispatchEvent(new w.Event('submit',{cancelable:true}));
  const pages=JSON.parse(w.localStorage.getItem('wikiinajar.pages.v1'));
  assert.match(pages['2026-10-22 Research review'].body,/tags:calendar/);api.setMonth(2026,10);
  assert.ok([...d.querySelectorAll('.calendar-day a')].some(a=>a.textContent==='2026-10-22 Research review'));
});
test('bundled dated pages count, tombstones hide them, and invalid leap anniversaries are not rendered',t=>{
  const {api,d}=browser(t);api.setDocs([['2026-02-19 Release',{body:'source',source:'docs/release.md'}]]);
  api.setContacts([{fn:'Leap birthday',bday:'--02-29'}]);api.setMonth(2026,2);
  assert.ok([...d.querySelectorAll('.calendar-day a')].some(a=>a.textContent==='2026-02-19 Release'));
  assert.equal(api.events(2026,2).length,1);api.hide('2026-02-19 Release');assert.equal(api.events(2026,2).length,0);
  assert.equal(api.events(2024,2).length,1);
});

test('busy days stay compact and every event remains available in the expandable agenda',t=>{
  const {api,d}=browser(t);api.setDocs(Array.from({length:12},(_,i)=>['2026-02-03 Long research event '+i,{body:'source',source:'notes.md'}]));api.setMonth(2026,2);
  const day=d.querySelector('[data-day="3"]').closest('.calendar-day');assert.equal(day.querySelectorAll('a').length,2);
  assert.equal(d.querySelectorAll('#calendarAgenda li').length,12);assert.equal(d.querySelector('#calendarAgenda').open,false);
  day.querySelector('[data-agenda-day="3"]').click();assert.equal(d.querySelector('#calendarAgenda').open,true);
});
