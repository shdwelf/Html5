// 2026-10-25 hash-lab port: blake2 (RFC 7693) + argon2 (RFC 9106) ops.
// Clean-room JS written for this repo; every expected value below was produced
// by the reference implementations (argon2-cffi binding of PHC argon2 20190702
// and Python hashlib), never by the JS under test. Provenance and the Drive
// investigation behind the port: docs/cyberchef-hash-lab-drive-investigation-2026-10-25.md
// Harness pattern follows tests/cyberchef-polyglot-scan.test.mjs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const appHtml = readFileSync(new URL("../public/apps/cyberchef/index.html", import.meta.url), "utf8");

function createDom() {
  return new JSDOM(appHtml, {
    runScripts: "dangerously",
    url: "https://example.test/apps/cyberchef/",
    pretendToBeVisual: true,
    beforeParse(window) {
      window.alert = () => undefined;
      window.confirm = () => false;
      window.prompt = () => null;
      window.URL.createObjectURL = () => "blob:hash-lab-test";
      window.URL.revokeObjectURL = () => undefined;
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

let dom;
test("registry boots with the hash-lab ops and pack", () => {
  dom = createDom();
  const ids = dom.window.eval("OPERATIONS.map(o => o.id)");
  assert.ok(ids.includes("blake2"), "blake2 registered");
  assert.ok(ids.includes("argon2"), "argon2 registered");
  const packs = dom.window.eval("JSON.stringify(Object.keys(RECIPE_PACKS))");
  assert.match(packs, /Hash lab \(BLAKE2 keyed · Argon2 PHC\)/);
});

test("blake2: RFC 7693 / hashlib vectors for b-512/384/256/160 and s-256/224", async () => {
  const abc = "abc";
  assert.equal(await opRun(dom, "blake2", abc, { variant: "b512" }),
    "ba80a53f981c4d0d6a2797b69f12f6e94c212f14685ac4b74b12bb6fdbffa2d17d87c5392aab792dc252d5de4533cc9518d38aa8dbf1925ab92386edd4009923");
  assert.equal(await opRun(dom, "blake2", abc, { variant: "b384" }),
    "6f56a82c8e7ef526dfe182eb5212f7db9df1317e57815dbda46083fc30f54ee6c66ba83be64b302d7cba6ce15bb556f4");
  assert.equal(await opRun(dom, "blake2", abc, { variant: "b256" }),
    "bddd813c634239723171ef3fee98579b94964e3bb1cb3e427262c8c068d52319");
  assert.equal(await opRun(dom, "blake2", abc, { variant: "b160" }),
    "384264f676f39536840523f284921cdc68b6846b");
  assert.equal(await opRun(dom, "blake2", abc, { variant: "s256" }),
    "508c5e8c327c14e2e1a72ba34eeb452f37458b209ed63a294d999b4c86675982");
  assert.equal(await opRun(dom, "blake2", abc, { variant: "s224" }),
    "0b033fc226df7abde29f67a05d3dc62cf271ef3dfea4d387407fbd55");
  assert.equal(await opRun(dom, "blake2", "", { variant: "b512" }),
    "786a02f742015903c6c6fd852552d272912f4740e15847618a86e217f71f5419d25e1031afee585313896444934eb04b903a685b1448b755d56f701afe9be2ce");
});

test("blake2: keyed vectors and key-length guard", async () => {
  assert.equal(await opRun(dom, "blake2", "abc", { variant: "s256", key: "hunter2" }),
    "de035a6bec2accae099e39256485b85cfcea1d0119e260cae31977d86d0ece89");
  assert.equal(await opRun(dom, "blake2", "abc", { variant: "b256", key: "hunter2" }),
    "615a63b3f1368c54d835cff6b8f581bbd4e6a950aa06164a610d956a597983c0");
  await assert.rejects(
    opRun(dom, "blake2", "abc", { variant: "s256", key: "k".repeat(33) }),
    /BLAKE2s key must be at most 32 bytes/);
});

const KAT = { salt: "somesalt", time: "3", memoryKiB: "4096", lanes: "2", outlen: "32" };

test("argon2id: reference KAT (t=3, m=4096 KiB, p=2) with PHC string", async () => {
  const out = await opRun(dom, "argon2", "password", { ...KAT, variant: "id" });
  assert.match(out, /hex : 2e93c004379bd4a80aca990f1db8df34fc4c8f77671940a986d50cd31a6487f5/);
  assert.match(out, /PHC : \$argon2id\$v=19\$m=4096,t=3,p=2\$c29tZXNhbHQ\$LpPABDeb1KgKypkPHbjfNPxMj3dnGUCphtUM0xpkh\/U/);
});

test("argon2d: reference KAT (t=3, m=4096 KiB, p=2) with PHC string", async () => {
  const out = await opRun(dom, "argon2", "password", { ...KAT, variant: "d" });
  assert.match(out, /hex : 20cb1a7edf9620a847831928446f4452c9c93509277823ea937a5c2d42bf6d03/);
  assert.match(out, /PHC : \$argon2d\$v=19\$m=4096,t=3,p=2\$c29tZXNhbHQ\$IMsaft\+WIKhHgxkoRG9EUsnJNQkneCPqk3pcLUK\/bQM/);
});

test("argon2i: reference KAT (t=3, m=4096 KiB, p=2)", async () => {
  const out = await opRun(dom, "argon2", "password", { ...KAT, variant: "i" });
  assert.match(out, /hex : be6f9f17d7c27c7be9112ec5ab1f6cbb58b877ac86dc17d754abca8033cc2110/);
});

test("argon2: minimal-memory config and parameter guards", async () => {
  const out = await opRun(dom, "argon2", "password",
    { variant: "id", salt: "somesalt", time: "1", memoryKiB: "8", lanes: "1", outlen: "32" });
  assert.match(out, /hex : f137f8e186a403a679ccd0606e5ab5dcdafe43c1640855ac8c6e33e9bd63eeb3/);
  await assert.rejects(
    opRun(dom, "argon2", "password", { variant: "id", salt: "abc", time: "1", memoryKiB: "8", lanes: "1", outlen: "32" }),
    /Salt must be at least 4 bytes/);
  await assert.rejects(
    opRun(dom, "argon2", "password", { variant: "id", salt: "somesalt", time: "0", memoryKiB: "8", lanes: "1", outlen: "32" }),
    /Time cost must be 1\.\.10/);
});
