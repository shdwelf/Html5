#!/usr/bin/env node
/**
 * Small same-origin web server for the inline catalog terminal.
 * It replaces the PHP adapter for SRU proxying without accepting arbitrary URLs.
 * Z39.50 Search/Present still requires PHP/YAZ or another native adapter.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const app = join(root, 'apps', 'z3950-sru-gopher-terminal.html');
const port = Number(process.env.PORT || 4173);
const targets = {
  loc: 'https://lx2.loc.gov/sru/lcdb',
  dnb: 'https://services.dnb.de/sru/dnb',
  dma: 'https://services.dnb.de/sru/dnb.dma',
  zdb: 'https://services.dnb.de/sru/zdb',
};
const resources = {
  loc: 'https://www.loc.gov/z3950/lcserver.html',
  dnb: 'https://www.dnb.de/EN/sru',
  ucsb: 'https://cylinders.library.ucsb.edu/',
  worldcat: 'https://search.worldcat.org/',
  zshaolin: 'https://github.com/dyne/ZShaolin',
  gopher: 'https://gopher.floodgap.com/gopher/',
};
const meta = Object.entries(targets).map(([id, base]) => ({ id, base }));
const headers = { 'content-type': 'application/json; charset=utf-8' };
function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store' });
  res.end(body);
}
function json(res, status, value) { send(res, status, JSON.stringify(value), headers['content-type']); }
async function proxySru(res, url) {
  const id = url.searchParams.get('server') || 'loc';
  const base = targets[id];
  if (!base) return json(res, 400, { error: 'Target is not allow-listed.' });
  const q = (url.searchParams.get('q') || '').trim();
  if (!q || q.length > 120) return json(res, 400, { error: 'Query must be 1–120 characters.' });
  const target = new URL(base);
  target.searchParams.set('version', '1.1');
  target.searchParams.set('operation', 'searchRetrieve');
  target.searchParams.set('recordSchema', 'mods');
  target.searchParams.set('maximumRecords', '5');
  target.searchParams.set('query', `title="${q.replaceAll('"', '')}"`);
  try {
    const upstream = await fetch(target, { headers: { 'user-agent': 'Html5-Catalog-Terminal/1.0' } });
    const text = await upstream.text();
    send(res, upstream.status, text, upstream.headers.get('content-type') || 'application/xml; charset=utf-8');
  } catch (error) { json(res, 502, { error: `SRU upstream unavailable: ${error.message}` }); }
}
async function fetchResource(res, id, proxy = false) {
  const target = resources[id];
  if (!target) return json(res, 404, { error: 'Resource is not allow-listed.' });
  try {
    const upstream = await fetch(target, { redirect: 'follow', headers: { 'user-agent': 'Html5-Catalog-Terminal/1.0' } });
    const body = await upstream.text();
    if (Buffer.byteLength(body, 'utf8') > 2_000_000) return json(res, 413, { error: 'Resource exceeds the 2 MB fetch limit.' });
    const type = upstream.headers.get('content-type') || 'text/plain; charset=utf-8';
    if (proxy) return send(res, upstream.status, body, type);
    return json(res, upstream.status, { id, requested: target, finalUrl: upstream.url, status: upstream.status, contentType: type, body });
  } catch (error) { return json(res, 502, { error: `Resource fetch failed: ${error.message}` }); }
}
const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.pathname === '/api/resources') return json(res, 200, { resources: Object.entries(resources).map(([id, url]) => ({ id, url })) });
  if (url.pathname.startsWith('/go/')) {
    const target = resources[url.pathname.slice(4)];
    return target ? (res.writeHead(302, { location: target }), res.end()) : send(res, 404, 'Unknown resource');
  }
  if (url.pathname === '/api/fetch') return fetchResource(res, url.searchParams.get('resource'), false);
  if (url.pathname === '/api/proxy') return fetchResource(res, url.searchParams.get('resource'), true);
  if (url.pathname === '/api/servers') return json(res, 200, { servers: meta, z3950: 'Use tools/z3950-terminal.php with PHP/YAZ for native Z39.50.' });
  if (url.pathname === '/api/sru') return proxySru(res, url);
  if (url.pathname === '/' || url.pathname === '/index.html') {
    try { return send(res, 200, await readFile(app), 'text/html; charset=utf-8'); }
    catch { return send(res, 500, 'Inline app could not be read.'); }
  }
  send(res, 404, 'Not found');
});
server.listen(port, '0.0.0.0', () => console.log(`Catalog terminal: http://0.0.0.0:${port}`));
