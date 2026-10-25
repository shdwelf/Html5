#!/usr/bin/env node
/*
 * Build gateway-config.war — the combined gateway configuration page
 * packaged as a servlet-container web archive (round 47).
 *
 *   gateway-config.war
 *     gateway-config.html        (UI; loads js/gateway-config.js)
 *     js/gateway-config.js       (the pure configuration engine)
 *     WEB-INF/web.xml            (welcome file only)
 *     WEB-INF/lib/gateway-config.jar
 *                                (GatewayMain CLI + shared GatewayConfig core,
 *                                 runner-built; source of truth in
 *                                 research/gateway-config/)
 *
 * The WAR is a static web app + library jar: no servlet execution of
 * user input, no upstream code. Entries are STORED, sorted, stamped
 * 1980-01-01 so the archive is byte-reproducible from identical inputs.
 * Run with --check to verify the committed WAR matches current inputs.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const args = process.argv.slice(2);
const check = args.includes("--check");
const out = "gateway-config.war";
const jarPath = "research/gateway-config/gateway-config.jar";
if (!existsSync(jarPath)) {
  console.error(`missing ${jarPath} — build via .github/workflows/arena-gateway-build.yml first`);
  process.exit(1);
}

const files = new Map();
files.set("WEB-INF/web.xml", Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<web-app xmlns="https://jakarta.ee/xml/ns/jakartaee" version="6.0">
  <welcome-file-list><welcome-file>gateway-config.html</welcome-file></welcome-file-list>
</web-app>
`));
files.set("gateway-config.html", readFileSync("gateway-config.html"));
files.set("js/gateway-config.js", readFileSync("js/gateway-config.js"));
files.set("WEB-INF/lib/gateway-config.jar", readFileSync(jarPath));

const crcTable = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});
function crc32(buf) {
  let crc = 0xffffffff;
  for (const b of buf) crc = crcTable[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

const chunks = [], central = [];
let offset = 0;
const names = [...files.keys()].sort();
for (const name of names) {
  const data = files.get(name);
  const compressed = deflateSync(data, { level: 9 });
  const nb = Buffer.from(name, "utf8");
  const lh = Buffer.alloc(30);
  lh.writeUInt32LE(0x04034b50, 0);
  lh.writeUInt16LE(20, 4);
  lh.writeUInt16LE(0x0800, 6); // UTF-8 flag
  lh.writeUInt16LE(8, 8); // deflate
  lh.writeUInt16LE(0x0000, 10); // time 00:00
  lh.writeUInt16LE(0x0021, 12); // date 1980-01-01
  lh.writeUInt32LE(crc32(data), 14);
  lh.writeUInt32LE(compressed.length, 18);
  lh.writeUInt32LE(data.length, 22);
  lh.writeUInt16LE(nb.length, 26);
  chunks.push(lh, nb, compressed);

  const cd = Buffer.alloc(46);
  cd.writeUInt32LE(0x02014b50, 0);
  cd.writeUInt16LE(20, 4);
  cd.writeUInt16LE(20, 6);
  cd.writeUInt16LE(0x0800, 8);
  cd.writeUInt16LE(8, 10);
  cd.writeUInt16LE(0x0000, 12);
  cd.writeUInt16LE(0x0021, 14);
  cd.writeUInt32LE(crc32(data), 16);
  cd.writeUInt32LE(compressed.length, 20);
  cd.writeUInt32LE(data.length, 24);
  cd.writeUInt16LE(nb.length, 28);
  cd.writeUInt32LE(offset, 42);
  central.push(cd, nb);
  offset += lh.length + nb.length + compressed.length;
}
const cdStart = offset;
for (const c of central) chunks.push(c);
const cdSize = central.reduce((n, c) => n + c.length, 0);
const eocd = Buffer.alloc(22);
eocd.writeUInt32LE(0x06054b50, 0);
eocd.writeUInt16LE(names.length, 8);
eocd.writeUInt16LE(names.length, 10);
eocd.writeUInt32LE(cdSize, 12);
eocd.writeUInt32LE(cdStart, 16);
chunks.push(eocd);

const war = Buffer.concat(chunks);
if (check) {
  const committed = readFileSync(out);
  if (!committed.equals(war)) {
    console.error(`${out} differs from current inputs — rebuild with node scripts/build-gateway-war.mjs`);
    process.exit(1);
  }
  console.log(`${out}: up to date (${war.length} bytes, ${names.length} entries)`);
} else {
  writeFileSync(out, war);
  console.log(`${out}: wrote ${war.length} bytes, ${names.length} entries`);
}
