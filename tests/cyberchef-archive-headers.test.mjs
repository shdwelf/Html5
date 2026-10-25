// Round-13: archive header triage ops (arjHeader / lhaHeader / aceHeader /
// paranoidUnzip) known-answer tests (JSDOM boot of the registry, same harness
// pattern as tests/cyberchef-polyglot-scan.test.mjs) + the TomTom-slash
// round-trip and spotlight pack wiring.
//
// All fixtures are SYNTHETIC byte strings built below — no real archives, no
// decompression, no decryption (F2/F4). Checksums in the builders come from
// node:zlib (CRC-32) and two textbook check values ("123456789" → ACE CRC-16
// 50905 per acefile doctests; CRC-16/ARC 0xBB3D), independent of the ops'
// own table code. Format layouts: tools/arjwalk.py +
// docs/arj-garble-format-notes.md (ARJ); jca02266/lha header.doc.md +
// src/header.c (LHA); droe/acefile header structs (ACE); PKWARE APPNOTE (ZIP).
// See docs/backlog-execution-round-13-2026-10-22.md.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { webcrypto } from "node:crypto";
import { crc32 } from "node:zlib";
import { TextEncoder, TextDecoder } from "node:util";
import { JSDOM } from "jsdom";

const appHtml = readFileSync(new URL("../public/apps/cyberchef/index.html", import.meta.url), "utf8");
const bwipSource = readFileSync(new URL("../public/apps/cyberchef/vendor/bwip-js.min.js", import.meta.url), "utf8");
const zxingSource = readFileSync(new URL("../public/apps/cyberchef/vendor/zxing-library.min.js", import.meta.url), "utf8");

function createDom() {
  return new JSDOM(appHtml, {
    runScripts: "dangerously",
    url: "https://example.test/apps/cyberchef/",
    pretendToBeVisual: true,
    beforeParse(window) {
      Object.defineProperty(window, "crypto", { value: webcrypto, configurable: true });
      window.TextEncoder = TextEncoder;
      window.TextDecoder = TextDecoder;
      window.alert = () => undefined;
      window.confirm = () => false;
      window.prompt = () => null;
      window.URL.createObjectURL = () => "blob:archive-headers-test";
      window.URL.revokeObjectURL = () => undefined;
      window.fetch = async (url) => {
        const body = String(url).includes("zxing-library.min.js") ? zxingSource : bwipSource;
        return { ok: true, text: async () => body };
      };
    },
  });
}

function opRun(dom, id, input, args) {
  return dom.window.eval(`(async () => {
    const op = OPERATIONS.find(o => o.id === ${JSON.stringify(id)});
    if (!op) throw new Error("missing op " + ${JSON.stringify(id)});
    return await op.run(${JSON.stringify(input)}, ${JSON.stringify(args)});
  })()`);
}

const text = (r) => (r && r.__text) != null ? r.__text : String(r);
const hex = (buf) => Buffer.from(buf).toString("hex");

/* ---------- fixture builder helpers ---------- */
const u16 = (n) => { const b = Buffer.alloc(2); b.writeUInt16LE(n); return b; };
const u32 = (n) => { const b = Buffer.alloc(4); b.writeUInt32LE(n >>> 0); return b; };
const dosDT = (y, mo, d, h, mi, s) => {
  const date = ((y - 1980) << 9) | (mo << 5) | d;
  const time = (h << 11) | (mi << 5) | (s >> 1);
  return (((date << 16) | time) >>> 0);
};

function lhaCrc16(buf) { // CRC-16/ARC: poly 0xA001 reflected, init 0 (lha crcio.c)
  let crc = 0;
  for (const byte of buf) {
    crc ^= byte;
    for (let k = 0; k < 8; k++) crc = (crc & 1) ? ((crc >> 1) ^ 0xa001) : (crc >> 1);
  }
  return crc & 0xffff;
}
const aceCrc16 = (buf) => ((crc32(buf) ^ 0xffffffff) >>> 0) & 0xffff;
// Textbook check values anchoring the two builders above.
assert.equal(crc32(Buffer.from("123456789")), 0xcbf43926);
assert.equal(aceCrc16(Buffer.from("123456789")), 50905);
assert.equal(lhaCrc16(Buffer.from("123456789")), 0xbb3d);

/* ARJ: main header + one GARBLED + one plain member (plus a CRC-bad magic). */
function buildArj() {
  function header(first, fill, name, comment) {
    const body = Buffer.concat([fill(first), Buffer.from(name + "\0" + comment + "\0", "latin1")]);
    return Buffer.concat([Buffer.from([0x60, 0xea]), u16(body.length), body, u32(crc32(body))]);
  }
  const main = header(30, (first) => {
    const f = Buffer.alloc(first);
    f[0] = first; f[1] = 4; f[2] = 1; f[3] = 0; f[4] = 0x10; f[5] = 0; f[6] = 2; f[7] = 0;
    f.writeUInt32LE(dosDT(2026, 10, 22, 12, 30, 0), 8);
    return f;
  }, "TEST.ARJ", "round13 fixture");
  const member = (flags, method, name, dataLen, ocrc) => header(30, (first) => {
    const f = Buffer.alloc(first);
    f[0] = first; f[1] = 4; f[2] = 1; f[3] = 0; f[4] = flags; f[5] = method; f[6] = 0; f[7] = 0xe6;
    f.writeUInt32LE(dosDT(2026, 10, 22, 12, 31, 0), 8);
    f.writeUInt32LE(dataLen, 12); f.writeUInt32LE(dataLen, 16); f.writeUInt32LE(ocrc, 20);
    return f;
  }, name, "");
  const garbledData = Buffer.concat([Buffer.alloc(5, 0x41), Buffer.from([0x60, 0xea, 0x04, 0x00, 1, 2, 3, 4, 0, 0, 0, 0])]); // fake magic, bad CRC
  return Buffer.concat([
    main,
    member(0x11, 1, "SECRET.TXT", garbledData.length, 0xdeadbeef), garbledData,
    member(0x10, 0, "PLAIN.TXT", 3, 0x12345678), Buffer.from("abc"),
    Buffer.from([0x60, 0xea, 0x00, 0x00]),
  ]);
}

/* LHA: level-0, level-1 (+ filename ext), level-2 (+ common/filename ext). */
function buildLhaL0() {
  const name = Buffer.from("HELLO.TXT", "latin1");
  const data = Buffer.from("HELLO", "latin1");
  const hsz = 22 + name.length; // header_size counts from method to end of header
  const h = Buffer.alloc(hsz + 2);
  h[0] = hsz;
  Buffer.from("-lh0-", "latin1").copy(h, 2);
  h.writeUInt32LE(data.length, 7); h.writeUInt32LE(data.length, 11);
  h.writeUInt32LE(dosDT(2026, 10, 22, 9, 0, 0), 15);
  h[19] = 0x20; h[20] = 0; h[21] = name.length;
  name.copy(h, 22);
  h.writeUInt16LE(lhaCrc16(data), 22 + name.length);
  let sum = 0; for (let i = 0; i < hsz; i++) sum = (sum + h[2 + i]) & 0xff;
  h[1] = sum;
  return Buffer.concat([h, data]);
}
function buildLhaL1() {
  const name = Buffer.from("SHORT.TXT", "latin1");
  const extName = Buffer.from("A-LONGER-NAME.TXT", "latin1");
  const data = Buffer.from("DATA", "latin1");
  const ext = Buffer.concat([Buffer.from([0x01]), extName, u16(0)]);
  const skip = ext.length + data.length;
  const hsz = 25 + name.length;
  const h = Buffer.alloc(hsz + 2);
  h[0] = hsz;
  Buffer.from("-lh5-", "latin1").copy(h, 2);
  h.writeUInt32LE(skip, 7); h.writeUInt32LE(data.length, 11);
  h.writeUInt32LE(dosDT(2026, 10, 22, 9, 5, 0), 15);
  h[19] = 0x20; h[20] = 1; h[21] = name.length;
  name.copy(h, 22);
  h.writeUInt16LE(lhaCrc16(data), 22 + name.length);
  h[24 + name.length] = 0x55; // OS ID 'U'
  h.writeUInt16LE(ext.length, hsz); // first ext size = final word of basic header
  let sum = 0; for (let i = 0; i < hsz; i++) sum = (sum + h[2 + i]) & 0xff;
  h[1] = sum;
  return Buffer.concat([h, ext, data]);
}
function buildLhaL2() {
  const name = Buffer.from("LEVEL2.TXT", "latin1");
  const data = Buffer.from("L2", "latin1");
  const extName = Buffer.concat([Buffer.from([0x01]), name, u16(0)]);
  const extCommon = Buffer.concat([Buffer.from([0x00]), u16(0), u16(extName.length)]);
  const total = 26 + extCommon.length + extName.length;
  const h = Buffer.alloc(total);
  h.writeUInt16LE(total, 0);
  Buffer.from("-lh5-", "latin1").copy(h, 2);
  h.writeUInt32LE(data.length, 7); h.writeUInt32LE(data.length, 11);
  h.writeUInt32LE(1760000000, 15);
  h[19] = 0x20; h[20] = 2;
  h.writeUInt16LE(lhaCrc16(data), 21);
  h[23] = 0x55;
  h.writeUInt16LE(extCommon.length, 24);
  extCommon.copy(h, 26); extName.copy(h, 26 + extCommon.length);
  h.writeUInt16LE(lhaCrc16(h), 27); // header CRC over header with this field zeroed
  return Buffer.concat([h, data]);
}

/* ACE: MAIN + one plain + one PASSWORD member. */
function aceBlock(body) {
  return Buffer.concat([u16(aceCrc16(body)), u16(body.length), body]);
}
function buildAce() {
  const mainBody = Buffer.concat([
    Buffer.from([0]), u16(256 | 4096), Buffer.from("**ACE**", "latin1"),
    Buffer.from([20, 20, 2, 0]), u32(dosDT(2026, 10, 22, 8, 0, 0)), Buffer.alloc(8),
    Buffer.from([4]), Buffer.from("TEST", "latin1"),
  ]);
  const member = (flags, name, dataLen) => {
    const nb = Buffer.from(name, "latin1");
    const body = Buffer.concat([
      Buffer.from([1]), u16(flags), u32(dataLen), u32(dataLen),
      u32(dosDT(2026, 10, 22, 8, 1, 0)), u32(0x20), u32(0xcbf43926),
      Buffer.from([0, 0]), u16(0), u16(0), u16(nb.length), nb,
    ]);
    return Buffer.concat([aceBlock(body), Buffer.alloc(dataLen, 0x42)]);
  };
  return Buffer.concat([aceBlock(mainBody), member(1, "README.TXT", 4), member(1 | 16384, "SECRET.TXT", 6)]);
}

/* ZIP (stored): local+central builders; returns {zip, cdOffset} so SFX tests
   can prepend a prefix without rewriting offsets (real reader behaviour). */
function zipMember(name, data, { flags = 0, descriptor = false, localName = null } = {}) {
  const nb = Buffer.from(name, "latin1");
  const lnb = Buffer.from(localName ?? name, "latin1");
  const crc = crc32(data);
  const local = Buffer.concat([
    u32(0x04034b50), u16(20), u16(flags), u16(0), u16(0), u16(0),
    u32(descriptor ? 0 : crc), u32(descriptor ? 0 : data.length), u32(descriptor ? 0 : data.length),
    u16(lnb.length), u16(0), lnb, data,
    ...(descriptor ? [u32(0x08074b50), u32(crc), u32(data.length), u32(data.length)] : []),
  ]);
  const central = (lho) => Buffer.concat([
    u32(0x02014b50), u16(20), u16(20), u16(flags), u16(0), u16(0), u16(0),
    u32(crc), u32(data.length), u32(data.length),
    u16(nb.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(lho), nb,
  ]);
  return { local, central };
}
function buildZip(members) {
  const locals = [], centrals = [];
  let off = 0;
  for (const m of members) { locals.push(m.local); centrals.push(m.central(off)); off += m.local.length; }
  const cd = Buffer.concat(centrals);
  const eocd = Buffer.concat([
    u32(0x06054b50), u16(0), u16(0), u16(members.length), u16(members.length),
    u32(cd.length), u32(off), u16(0),
  ]);
  return Buffer.concat([...locals, cd, eocd]);
}

/* ---------- tests ---------- */
let dom;
test("registry boots with the four round-13 ops and spotlight packs", () => {
  dom = createDom();
  const ids = dom.window.eval("OPERATIONS.map(o => o.id)");
  for (const id of ["arjHeader", "lhaHeader", "aceHeader", "paranoidUnzip"]) {
    assert.ok(ids.includes(id), `${id} registered`);
  }
  assert.equal(ids.length, 517);
  const packKeys = JSON.parse(dom.window.eval("JSON.stringify(Object.keys(RECIPE_PACKS))"));
  for (const key of [
    "Spotlight — Archive header triage (ARJ · LHA · ACE · ZIP, headers only)",
    "Spotlight — TomTom slash round-trip (A-tom-tom encode → decode)",
    "Spotlight — SHA-2 & checksums (SHA-384 · SHA-512 · SHA3-512 · CRC16 · Adler-32)",
    "Spotlight — Data encodings (Base62 · data URI · ASCII codes)",
  ]) assert.ok(packKeys.includes(key), `pack present: ${key}`);
  const dangling = dom.window.eval(`(() => {
    const known = new Set(OPERATIONS.map(o => o.id)); const bad = [];
    for (const [name, entries] of Object.entries(RECIPE_PACKS))
      for (const [id] of entries) if (!known.has(id)) bad.push(name + ':' + id);
    return bad;
  })()`);
  assert.deepEqual([...dangling], []);
});

test("arjHeader: synthetic archive walks main + members, GARBLED flagged", async () => {
  const out = text(await opRun(dom, "arjHeader", hex(buildArj()), {}));
  assert.match(out, /main header @\+0/);
  assert.match(out, /archive name: "TEST\.ARJ".*comment: "round13 fixture"/);
  assert.match(out, /no encryption-version byte/);
  assert.match(out, /"SECRET\.TXT"[\s\S]*GARBLED — left encrypted/);
  assert.match(out, /"PLAIN\.TXT"/);
  assert.match(out, /verdict: 2 member header\(s\), 1 garbled/);
});

test("arjHeader: garbage and truncated inputs report, never throw", async () => {
  assert.match(text(await opRun(dom, "arjHeader", "not an archive at all", { inputfmt: "text" })), /verdict: not-arj/);
  assert.match(text(await opRun(dom, "arjHeader", "60ea", {})), /verdict: not-arj/);
});

test("lhaHeader: level-0 + level-1 (ext filename) + level-2 (header CRC)", async () => {
  const archive = Buffer.concat([buildLhaL0(), buildLhaL1(), buildLhaL2(), Buffer.from([0])]);
  const out = text(await opRun(dom, "lhaHeader", hex(archive), {}));
  assert.match(out, /"HELLO\.TXT"[\s\S]*level=0.*sum=ok/);
  assert.match(out, /"A-LONGER-NAME\.TXT"[\s\S]*level=1.*sum=ok/);
  assert.match(out, /"LEVEL2\.TXT"[\s\S]*level=2.*headerCRC=ok/);
  assert.match(out, /end-of-archive mark/);
  assert.match(out, /verdict: 3 member header\(s\)/);
});

test("lhaHeader: SFX prefix is located and reported", async () => {
  const sfx = Buffer.concat([Buffer.from("MZ-stub-junk", "latin1"), buildLhaL0()]);
  const out = text(await opRun(dom, "lhaHeader", hex(sfx), {}));
  assert.match(out, /first plausible header at \+12/);
  assert.match(out, /"HELLO\.TXT"/);
});

test("aceHeader: MAIN + members, PASSWORD flag reported, nothing decrypted", async () => {
  const out = text(await opRun(dom, "aceHeader", hex(buildAce()), {}));
  assert.match(out, /MAIN @\+0.*headerCRC=ok/);
  assert.match(out, /host: 2 \(Win32\)/);
  assert.match(out, /advert \(4 bytes\): "TEST"/);
  assert.match(out, /"README\.TXT"/);
  assert.match(out, /"SECRET\.TXT"[\s\S]*<PASSWORD — not decrypted>/);
  assert.match(out, /verdict: 3 block\(s\), 2 member\(s\), 1 password-encrypted/);
  assert.match(text(await opRun(dom, "aceHeader", "plain text", { inputfmt: "text" })), /verdict: not-ace/);
});

test("paranoidUnzip: clean stored zip audits with zero warnings", async () => {
  const zip = buildZip([zipMember("A.TXT", Buffer.from("hello")), zipMember("B.TXT", Buffer.from("world!"))]);
  const out = text(await opRun(dom, "paranoidUnzip", hex(zip), {}));
  assert.match(out, /entries: 2/);
  assert.match(out, /"A\.TXT"[\s\S]*local: agrees/);
  assert.match(out, /verdict: 2 entries, 0 warning\(s\)/);
});

test("paranoidUnzip: SFX prefix, traversal name, encrypted + descriptor members", async () => {
  const zip = buildZip([
    zipMember("../EVIL.TXT", Buffer.from("x")),
    zipMember("LOCKED.BIN", Buffer.from("12345678"), { flags: 0x01 }),
    zipMember("STREAM.TXT", Buffer.from("streamed"), { flags: 0x08, descriptor: true }),
  ]);
  const sfx = Buffer.concat([Buffer.alloc(100, 0x4d), zip]);
  const out = text(await opRun(dom, "paranoidUnzip", hex(sfx), {}));
  assert.match(out, /prefix: 100 byte\(s\)/);
  assert.match(out, /path-traversal-shaped name: "\.\.\/EVIL\.TXT"/);
  assert.match(out, /ENCRYPTED\/ZipCrypto-era — not decrypted/);
  assert.match(out, /descriptor/);
  assert.match(out, /warnings \(1\)/);
});

test("paranoidUnzip: local/central mismatch, trailing bytes, non-zip", async () => {
  const bad = buildZip([zipMember("CENTRAL.TXT", Buffer.from("data"), { localName: "LOCAL.TXT" })]);
  const withTrash = Buffer.concat([bad, Buffer.from("JUNK")]);
  const out = text(await opRun(dom, "paranoidUnzip", hex(withTrash), {}));
  assert.match(out, /local\/central mismatch/);
  assert.match(out, /trailing byte\(s\) after EOCD/);
  const empty = Buffer.concat([u32(0x06054b50), u16(0), u16(0), u16(0), u16(0), u32(0), u32(0), u16(0)]);
  assert.match(text(await opRun(dom, "paranoidUnzip", hex(empty), {})), /verdict: 0 entries, 0 warning\(s\)/);
  assert.match(text(await opRun(dom, "paranoidUnzip", "hello world", { inputfmt: "text" })), /verdict: not-zip/);
});

test("TomTom slash: ANZ known vector + full-alphabet round-trip", async () => {
  const args = { table: "tomtom", mode: "encode" };
  const aanz = text(await opRun(dom, "gcwTomTinesWin", "ANZ", args));
  assert.equal(aanz, "/ \\\\/// /\\\\/\\\\"); // A=/, N=\\///, Z=/\\/\\ (GCWizard/Omniglot map)
  assert.equal(text(await opRun(dom, "gcwTomTinesWin", aanz, { table: "tomtom", mode: "decode" })), "ANZ");
  const alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const enc = text(await opRun(dom, "gcwTomTinesWin", alpha, args));
  assert.equal(text(await opRun(dom, "gcwTomTinesWin", enc, { table: "tomtom", mode: "decode" })), alpha);
});

export { buildArj, buildLhaL0, buildLhaL1, buildLhaL2, buildAce, buildZip, zipMember };
