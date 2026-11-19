import test, { after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const dom = new JSDOM(readFileSync(new URL("../public/apps/cyberchef/index.html", import.meta.url), "utf8"), {
  runScripts: "dangerously", pretendToBeVisual: true, url: "https://example.test/apps/cyberchef/",
  beforeParse(w) {
    w.alert = () => {}; w.confirm = () => false; w.prompt = () => null;
    w.TextEncoder = TextEncoder; w.TextDecoder = TextDecoder;
    w.fetch = () => { throw new Error("Recipe attempted network access"); };
    w.URL.createObjectURL = () => "blob:2600-test"; w.URL.revokeObjectURL = () => {};
  },
});
const w = dom.window;
after(() => w.close());
const packs = JSON.parse(w.eval("JSON.stringify(RECIPE_PACKS)"));
const headerPack = "2600 — SnapSafe SECV v1 header (42:4, passive only)";

function header({ chunkSize = 4, chunks = 2n, original = 6n, final = 2 } = {}) {
  const buf = Buffer.alloc(64);
  buf.write("SECV"); buf.writeUInt16LE(1, 4); buf.writeUInt32LE(chunkSize, 6);
  buf.writeBigUInt64LE(chunks, 10); buf.writeBigUInt64LE(original, 18); buf.writeUInt32LE(final, 26);
  return buf;
}

async function bake(steps, input) {
  w.document.getElementById("input").value = input;
  return w.eval(`(async()=>{
    recipe=${JSON.stringify(steps)}.map(([id,args])=>{
      const op=OPERATIONS.find(op=>op.id===id);if(!op)throw new Error('missing '+id);
      return {uid:++opIdCounter,op,args:{...Object.fromEntries(op.args.map(a=>[a.key,a.default])),...args}};
    });
    await bake();
    const error=document.getElementById('out-error');
    if(error&&error.style.display!=='none')throw new Error(error.textContent);
    return document.getElementById('output').value;
  })()`);
}
const inspect = async (bytes, mode = "header") => JSON.parse(await bake([["snapSafeSecv", { mode }]], bytes.toString("hex")));

test("three source-labelled packs exist, are in full coverage, and reproduce public 2600 examples", async () => {
  const ids = w.eval("OPERATIONS.map(op=>op.id)");
  assert.equal(ids.length, 525);
  assert.equal(ids.filter((id) => id === "snapSafeSecv").length, 1);
  assert.ok(packs["Full Coverage — Data"].some(([id]) => id === "snapSafeSecv"));
  assert.deepEqual(packs[headerPack], [["snapSafeSecv", { mode: "header" }]]);
  assert.equal(await bake(packs["2600 — Code Wall binary to UTF-8 (43:3)"], "01001001 01001110 01010011 01010000 01001001 01010010 01000101"), "INSPIRE");
  // 31 reviewed bytes from the article's manual DOS COM listing. Inspect only:
  // neither the recipe nor this test runs the DOS program.
  const com = "b4 09 ba 10 01 cd 21 b4 4c 30 c0 cd 21 00 00 00 48 65 6c 6c 6f 2c 20 57 6f 72 6c 64 21 24 00";
  const dump = await bake(packs["2600 — DOS Hello World bytes (43:3, hex to static hexdump)"], com);
  assert.match(dump, /00000010.*48 65 6c 6c 6f 2c 20 57/);
  assert.match(dump, /Hello, World!\$\./);
  assert.equal(await bake([["fromHexdump", { outfmt: "hex" }]], dump), com.replaceAll(" ", ""));
});

test("SECV header inspection follows pinned Kotlin offsets and makes no authentication claim", async () => {
  const report = JSON.parse(await bake(packs[headerPack], header().toString("hex")));
  assert.match(report.scope, /No decryption.*tag verification/);
  assert.equal(report.source.commit, "826bf51357c8ca81bad9e81c045107fd6671e633");
  assert.equal(report.version, 1);
  assert.equal(report.byte_order, "little-endian");
  assert.equal(report.total_chunks, "2");
  assert.equal(report.original_size_bytes, "6");
  assert.equal(report.chunk_size_bytes, 4);
  assert.equal(report.final_chunk_plaintext_bytes, 2);
  assert.equal(report.first_chunk_offset, "64");
  assert.equal(report.last_chunk_offset, "96");
  assert.equal(report.expected_file_bytes, "126");
  assert.equal(report.iv_bytes, 12); assert.equal(report.tag_bytes, 16);
  assert.equal(report.payload_length_checked, false);
  assert.equal(report.authentication_verified, false);
  assert.match(report.warnings.join(" "), /unencrypted MP4/);
});

test("small-file mode checks only length, even with fake GCM bytes", async () => {
  const file = Buffer.concat([header(), Buffer.alloc(62, 0x7f)]);
  const report = await inspect(file, "file");
  assert.equal(report.payload_length_checked, true);
  assert.equal(report.authentication_verified, false);
  await assert.rejects(inspect(file.subarray(0, -1), "file"), /payload length mismatch/);
  await assert.rejects(inspect(Buffer.concat([file, Buffer.alloc(1)]), "file"), /payload length mismatch/);
  await assert.rejects(inspect(file), /exactly 64 bytes/);
});

test("empty, exact-full-chunk and >2^53 headers preserve exact sizes without allocation", async () => {
  const empty = await inspect(header({ chunks: 0n, original: 0n, final: 0 }), "file");
  assert.equal(empty.expected_file_bytes, "64");
  assert.equal(empty.last_chunk_offset, null);
  const full = await inspect(header({ original: 8n, final: 4 }));
  assert.equal(full.expected_file_bytes, "128");
  const size = (1n << 54n) + 1n, chunk = 1048576n;
  const chunks = (size + chunk - 1n) / chunk;
  const large = await inspect(header({ chunkSize: Number(chunk), chunks, original: size, final: Number(size - (chunks - 1n) * chunk) }));
  assert.equal(large.original_size_bytes, size.toString());
  assert.equal(large.expected_file_bytes, (64n + size + 28n * chunks).toString());
  assert.equal(large.last_chunk_offset, (64n + (chunks - 1n) * (chunk + 28n)).toString());
});

test("reserved bytes are reported, not authenticated; malformed and oversized metadata fails closed", async () => {
  const reserved = header(); reserved[30] = 1;
  const r = await inspect(reserved);
  assert.equal(r.reserved_nonzero, true);
  assert.match(r.warnings.at(-1), /Reserved/);
  const badMagic = header(); badMagic[0] = 0;
  const badVersion = header(); badVersion.writeUInt16LE(2, 4);
  for (const [bytes, message] of [
    [badMagic, /magic/], [badVersion, /version/], [header().subarray(0, 63), /complete 64-byte/],
    [header({ chunkSize: 0 }), /chunk size/], [header({ chunkSize: 0xffffffff }), /Kotlin Int/],
    [header({ final: 0 }), /final chunk/], [header({ final: 5 }), /final chunk/],
    [header({ original: 7n }), /inconsistent/], [header({ chunks: 0n }), /Empty/],
    [header({ original: 1n << 63n }), /Kotlin Long/],
    [header({ chunkSize: 1, chunks: 1n << 62n, original: 1n << 62n, final: 1 }), /file-offset/],
  ]) await assert.rejects(inspect(bytes), message);
  await assert.rejects(bake([["snapSafeSecv", {}]], "gg"), /plain hex/);
  await assert.rejects(bake([["snapSafeSecv", {}]], "0".repeat(129)), /complete bytes/);
  await assert.rejects(bake([["snapSafeSecv", {}]], "00".repeat(1048577)), /1 MiB/);
  await assert.rejects(inspect(header(), "unknown"), /Unknown SECV/);
});

test("AES field kitchen operation also marks inverse of zero undefined", async () => {
  assert.match(await bake([["gf256", { a: "00", op: "inv" }]], ""), /undefined.*zero has no multiplicative inverse/);
  assert.match(await bake([["gf256", { a: "53", op: "inv" }]], ""), /ca/);
});
