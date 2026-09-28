import { createServer } from "node:http";
import { readFileSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
const root = process.cwd();
const types = { ".html":"text/html; charset=utf-8", ".js":"text/javascript", ".css":"text/css", ".wasm":"application/wasm", ".png":"image/png", ".svg":"image/svg+xml" };
createServer((req,res) => {
  let url = decodeURIComponent(req.url.split("?")[0]);
  if (url === "/") { res.writeHead(302,{location:"/prime.html"}).end(); return; }
  const path = normalize(join(root, url.replace(/^\/+/,"")));
  if (!path.startsWith(root)) { res.writeHead(403).end("forbidden"); return; }
  try { if (!statSync(path).isFile()) throw new Error(); res.writeHead(200,{"content-type":types[extname(path)]||"application/octet-stream","cache-control":"no-store"}); res.end(readFileSync(path)); }
  catch { res.writeHead(404).end("not found"); }
}).listen(Number(process.argv[2]||4174),"0.0.0.0",()=>console.log(`Prime Viewer → http://0.0.0.0:${process.argv[2]||4174}/prime.html`));
