// The WAR packaging: deterministic, engine-servable, jar included.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { inflateRawSync } from "node:zlib";
import { unzipSync } from "fflate";
import { execFileSync } from "node:child_process";

const entries = (buf) => {
  const names = [];
  for (let i = 0; i + 30 <= buf.length && buf.readUInt32LE(i) === 0x04034b50;) {
    const nlen = buf.readUInt16LE(i + 26), elen = buf.readUInt16LE(i + 28);
    const clen = buf.readUInt32LE(i + 18);
    const name = buf.subarray(i + 30, i + 30 + nlen).toString("utf8");
    names.push({ name, dataStart: i + 30 + nlen + elen, clen,
                 method: buf.readUInt16LE(i + 8), date: buf.readUInt16LE(i + 12) });
    i = i + 30 + nlen + elen + clen;
  }
  return names;
};

test("gateway-config.war is byte-reproducible from committed inputs", () => {
  assert.ok(existsSync("gateway-config.war"), "build with scripts/build-gateway-war.mjs");
  execFileSync("node", ["scripts/build-gateway-war.mjs", "--check"], { stdio: "pipe" });
});

test("gateway-config.war layout: page, engine, web.xml, jar in WEB-INF/lib", () => {
  const buf = readFileSync("gateway-config.war");
  const list = entries(buf);
  assert.deepEqual(list.map(e => e.name), [
    "WEB-INF/lib/gateway-config.jar",
    "WEB-INF/web.xml",
    "gateway-config.html",
    "js/gateway-config.js",
    "js/vpn-analysis-tools.js",
  ]);
  const jarEntry = list[0];
  const jar = inflateRawSync(buf.subarray(jarEntry.dataStart, jarEntry.dataStart + jarEntry.clen));
  assert.equal(jar.readUInt32LE(0), 0x04034b50, "nested jar is a real zip");
  assert.equal(jarEntry.date, 0x21, "deterministic 1980-01-01 stamp");
});

// A standards-based independent ZIP reader catches accidental zlib-wrapped
// DEFLATE streams that a matching custom decoder would mistakenly accept.
test("WAR is a valid standard ZIP with source-exact assets and a schema-v2 planner JAR", () => {
  const war = unzipSync(readFileSync("gateway-config.war"));
  for (const path of ["gateway-config.html", "js/gateway-config.js", "js/vpn-analysis-tools.js"]) assert.deepEqual(Buffer.from(war[path]), readFileSync(path));
  const jar = unzipSync(war["WEB-INF/lib/gateway-config.jar"]);
  assert.equal(JSON.parse(new TextDecoder().decode(jar["META-INF/gateway-build.json"])).schema, 2);
  assert.equal(JSON.parse(new TextDecoder().decode(jar["META-INF/gateway-build.json"])).protectionActive, false);
});
