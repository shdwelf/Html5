// Round-5 sourced operations: known-answer tests for the thin-category vectors
// and the GTA asc()+1 text codec. Sources are pinned in each test header:
//   gtaText    — requester-specified codec (BASIC asc(c)+1); self-consistent pairs.
//   base45     — RFC 9285 §4.3/§4.4 examples.
//   aesCmac    — RFC 4493 §4 (all four examples + subkeys), cross-checked with an
//                independent node:crypto AES-ECB CMAC implementation below.
//   aesKeySched— FIPS 197 Appendix A.1 words and the C.1 round-key table.
//   gf256      — FIPS 197 §4.1/4.2/4.2.1 worked examples + §5.1.1 inv({53})={ca}.
//   mignotte   — classic CRT threshold scheme (Stinson, Cryptography: Theory and
//                Practice): round-trip + bound checks, no published KAT claimed.
// See docs/backlog-execution-round-5-2026-10-21.md.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { webcrypto, createCipheriv } from "node:crypto";
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
      window.URL.createObjectURL = () => "blob:round5-test";
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

let dom;
test("registry boots with the six round-5 ops", () => {
  dom = createDom();
  const ids = dom.window.eval("OPERATIONS.map(o => o.id)");
  for (const id of ["gtaText", "base45", "aesCmac", "aesKeySched", "gf256", "mignotte"]) {
    assert.ok(ids.includes(id), `${id} registered`);
  }
});

test("round-5 recipe packs reference registered ops", () => {
  const packs = JSON.parse(dom.window.eval(`JSON.stringify({
    rfc: RECIPE_PACKS['RFC 4493 / RFC 9285 — AES-CMAC & Base45 vectors'],
    fips: RECIPE_PACKS['FIPS 197 — AES Key Schedule & GF(2^8) Field Math'],
    mignotte: RECIPE_PACKS['Mignotte CRT Threshold Sharing (Stinson)'],
    gta: RECIPE_PACKS['Retro Text — GTA asc+1 Codec'],
  })`));
  const ids = dom.window.eval("OPERATIONS.map(o => o.id)");
  for (const list of Object.values(packs)) {
    for (const [id] of list) assert.ok(ids.includes(id), `pack entry ${id} registered`);
  }
  assert.deepEqual(packs.gta, [["gtaText", { mode: "decode" }]]);
});

/* --------------------------------------------------- GTA text (asc()+1) */

test("gtaText decodes the asc()+1 form and encodes back (GOURANGA pair)", async () => {
  // The famous GTA-1 cheat word, stored one-up per byte: G->H, O->P, U->V, ...
  assert.equal(await opRun(dom, "gtaText", "HPVSBOHB", { mode: "decode" }), "GOURANGA");
  assert.equal(await opRun(dom, "gtaText", "GOURANGA", { mode: "encode" }), "HPVSBOHB");
  assert.equal(await opRun(dom, "gtaText", "HSBOE!UIFGU!BVUP", { mode: "decode" }), "GRAND THEFT AUTO");
  assert.equal(await opRun(dom, "gtaText", "GRAND THEFT AUTO", { mode: "encode" }), "HSBOE!UIFGU!BVUP");
  // byte-wise behaviour: space (0x20) encodes to '!' (0x21) and back
  assert.equal(await opRun(dom, "gtaText", " ", { mode: "encode" }), "!");
  assert.equal(await opRun(dom, "gtaText", "!", { mode: "decode" }), " ");
  // arbitrary round-trip over the printable range
  const sample = "The quick brown fox; 0123456789 [brackets] {braces}";
  const round = await opRun(dom, "gtaText", await opRun(dom, "gtaText", sample, { mode: "encode" }), { mode: "decode" });
  assert.equal(round, sample);
});

/* ------------------------------------------------------- Base45 (RFC 9285) */

test("base45 reproduces the RFC 9285 examples both ways", async () => {
  const enc = { mode: "encode" };
  assert.equal(await opRun(dom, "base45", "AB", enc), "BB8");
  assert.equal(await opRun(dom, "base45", "Hello!!", enc), "%69 VD92EX0");
  assert.equal(await opRun(dom, "base45", "base-45", enc), "UJCLQE7W581");
  assert.equal(await opRun(dom, "base45", "QED8WEX0", { mode: "decode" }), "ietf!");
  assert.equal(await opRun(dom, "base45", "%69 VD92EX0", { mode: "decode" }), "Hello!!");
  // odd trailing byte: "53" -> one byte 53 -> "81"? RFC §4.3 tables cover 1-byte tail via Hello!!
  const sample = "RFC 9285 padding-free QR payload";
  const round = await opRun(dom, "base45", await opRun(dom, "base45", sample, enc), { mode: "decode" });
  assert.equal(round, sample);
  await assert.rejects(opRun(dom, "base45", "AB!", { mode: "decode" }), /alphabet/i);
  await assert.rejects(opRun(dom, "base45", "ABCD", { mode: "decode" }), /length/i);
});

/* ------------------------------------------------ AES-CMAC (RFC 4493 §4) */

const CMAC_KEY = "2b7e151628aed2a6abf7158809cf4f3c";
const RFC4493 = [
  ["", "bb1d6929e95937287fa37d129b756746"],
  ["6bc1bee22e409f96e93d7e117393172a", "070a16b46b4d4144f79bdd9dd04a287c"],
  ["6bc1bee22e409f96e93d7e117393172aae2d8a571e03ac9c9eb76fac45af8e5130c81c46a35ce411",
    "dfa66747de9ae63030ca32611497c827"],
  ["6bc1bee22e409f96e93d7e117393172aae2d8a571e03ac9c9eb76fac45af8e5130c81c46a35ce411e5fbc1191a0a52eff69f2445df4f9b17ad2b417be66c3710",
    "51f0bebf7e3b9d92fc49741779363cfe"],
];

function nodeCmac(keyHex, msgHex) {
  const ecb = (blk) => {
    const c = createCipheriv("aes-128-ecb", Buffer.from(keyHex, "hex"), null);
    c.setAutoPadding(false);
    return Buffer.concat([c.update(Buffer.from(blk, "hex")), c.final()]);
  };
  const shl = (b) => { const o = Buffer.alloc(16); let cy = 0; for (let i = 15; i >= 0; i--) { o[i] = ((b[i] << 1) | cy) & 0xff; cy = b[i] >> 7; } return o; };
  const xor = (x, y) => Buffer.from(x.map((v, i) => v ^ y[i]));
  const Rb = Buffer.from("00000000000000000000000000000087", "hex");
  const L = ecb(Buffer.alloc(16).toString("hex"));
  let K1 = shl(L); if (L[0] & 0x80) K1 = xor(K1, Rb);
  let K2 = shl(K1); if (K1[0] & 0x80) K2 = xor(K2, Rb);
  const m = Buffer.from(msgHex, "hex");
  const complete = m.length > 0 && m.length % 16 === 0;
  const nFull = complete ? m.length / 16 - 1 : Math.floor(m.length / 16);
  let x = Buffer.alloc(16);
  for (let i = 0; i < nFull; i++) x = ecb(xor(x, m.subarray(i * 16, i * 16 + 16)).toString("hex"));
  let last = m.subarray(nFull * 16);
  if (complete) last = xor(last, K1);
  else last = xor(Buffer.concat([last, Buffer.from([0x80]), Buffer.alloc(15 - last.length)]), K2);
  return ecb(xor(x, last).toString("hex")).toString("hex");
}

test("aesCmac matches all four RFC 4493 examples and node:crypto", async () => {
  for (const [msg, mac] of RFC4493) {
    const got = await opRun(dom, "aesCmac", msg, { key: CMAC_KEY, infmt: "hex" });
    assert.equal(got, mac, `RFC 4493 MAC for ${msg.length / 2} bytes`);
    assert.equal(nodeCmac(CMAC_KEY, msg), mac, "independent node:crypto CMAC agrees");
  }
  // RFC 4493 subkey section pins AES-128(K, 0^128) too — covered by the empty
  // message case (K2 path) and the 64-byte case (K1 path) above.
  await assert.rejects(opRun(dom, "aesCmac", "00", { key: "00", infmt: "hex" }), /16 bytes/);
});

/* ------------------------------------------ AES Key Schedule (FIPS 197) */

const C1_ROUNDS = [
  "000102030405060708090a0b0c0d0e0f", "d6aa74fdd2af72fadaa678f1d6ab76fe",
  "b692cf0b643dbdf1be9bc5006830b3fe", "b6ff744ed2c2c9bf6c590cbf0469bf41",
  "47f7f7bc95353e03f96c32bcfd058dfd", "3caaa3e8a99f9deb50f3af57adf622aa",
  "5e390f7df7a69296a7553dc10aa31f6b", "14f9701ae35fe28c440adf4d4ea9c026",
  "47438735a41c65b9e016baf4aebf7ad2", "549932d1f08557681093ed9cbe2c974e",
  "13111d7fe3944a17f307a78b4d2b30c5",
];

test("aesKeySched reproduces the FIPS 197 C.1 round-key table", async () => {
  const out = await opRun(dom, "aesKeySched", "", { key: C1_ROUNDS[0], show: "rounds" });
  for (let r = 0; r <= 10; r++) {
    const m = out.match(new RegExp(`round\\[${r}\\]\\.k_sch\\s+([0-9a-f ]+)`));
    assert.ok(m, `round ${r} present`);
    assert.equal(m[1].replace(/ /g, ""), C1_ROUNDS[r], `C.1 round ${r} key`);
  }
  // FIPS 197 Appendix A.1 expansion of the RFC-4493 key 2b7e…4f3c
  const a1 = await opRun(dom, "aesKeySched", "", { key: "2b7e151628aed2a6abf7158809cf4f3c", show: "words" });
  assert.ok(a1.includes("w[4]"), "word trace present");
  const words = [...a1.matchAll(/w\[(\d+)\]\s+\S+\s+\S+=([0-9a-f]{2})\s+->\s+([0-9a-f]{8})/g)];
  const byIdx = Object.fromEntries(words.map((m) => [m[1], m[3]]));
  assert.equal(byIdx[4], "a0fafe17");
  assert.equal(byIdx[5], "88542cb1");
  assert.equal(byIdx[6], "23a33939");
  assert.equal(byIdx[7], "2a6c7605");
  assert.equal(byIdx[8], "f2c295f2");
  assert.equal(byIdx[11], "7359f67f");
});

/* ------------------------------------- GF(2^8) field math (FIPS 197 §4) */

test("gf256 reproduces the FIPS 197 worked examples", async () => {
  assert.equal(await opRun(dom, "gf256", "", { a: "57", b: "83", op: "add" }),
    "add: 57 + 83 = d4"); // §4.1
  assert.equal(await opRun(dom, "gf256", "", { a: "57", b: "83", op: "mul" }),
    "mul: 57 * 83 = c1"); // §4.2
  assert.equal(await opRun(dom, "gf256", "", { a: "57", b: "13", op: "mul" }),
    "mul: 57 * 13 = fe"); // §4.2.1
  const xt = await opRun(dom, "gf256", "", { a: "57", op: "xtime" });
  assert.ok(xt.includes("02=ae 04=47 08=8e 10=07"), `xtime chain (${xt})`); // §4.2.1
  assert.equal(await opRun(dom, "gf256", "", { a: "53", op: "inv" }).then((s) => s.split("  ")[0]),
    "inv: 53^-1 = ca"); // §5.1.1 construction input
  // S-box tie-in: Fig. 7 S[{53}] = {ed} is the affine image of inv({53})={ca}
  assert.equal(await opRun(dom, "gf256", "", { a: "ca", b: "00", op: "pow" }),
    "pow: ca^0 = 01");
});

/* ------------------------- Mignotte CRT threshold sharing (Stinson) */

function crt(pairs) {
  let S = pairs[0][1], M = pairs[0][0];
  for (let i = 1; i < pairs.length; i++) {
    const [m, s] = pairs[i];
    let d = 0n;
    for (let x = 0n; x < m; x++) if ((M * x) % m === ((s - S) % m + m) % m) { d = x; break; }
    S += M * d; M *= m; S = ((S % M) + M) % M;
  }
  return S;
}

test("mignotte split/combine round-trips through independent CRT", async () => {
  const out = await opRun(dom, "mignotte", "", {
    mode: "split", n: "5", k: "3", secret: "1234", moduli: "11,13,17,19,23",
  });
  const shares = [...out.matchAll(/Share (\d+): m=(\d+) a=(\d+)/g)]
    .map((m) => [BigInt(m[2]), BigInt(m[3])]);
  assert.equal(shares.length, 5);
  assert.equal(shares[0][1], 1234n % 11n);
  // any K=3 shares reconstruct S via CRT (independent of the op)
  assert.equal(crt([shares[0], shares[1], shares[2]]), 1234n);
  assert.equal(crt([shares[1], shares[3], shares[4]]), 1234n);
  // the op's own combine path agrees
  const lines = [shares[1], shares[3], shares[4]]
    .map(([m, a], i) => `Share ${i + 1}: m=${m} a=${a}`).join("\n");
  const combined = await opRun(dom, "mignotte", lines, { mode: "combine" });
  assert.equal(combined, "Mignotte CRT combine (3 shares): S = 1234");
  // Mignotte bound: S outside m3·m4·m5 < S < m1·m2·m3 is rejected
  await assert.rejects(opRun(dom, "mignotte", "", {
    mode: "split", n: "5", k: "3", secret: "4000", moduli: "11,13,17,19,23",
  }), /bound/i);
  await assert.rejects(opRun(dom, "mignotte", "", {
    mode: "split", n: "5", k: "3", secret: "300", moduli: "11,13,17,19,23",
  }), /bound/i);
  // non-coprime moduli rejected
  await assert.rejects(opRun(dom, "mignotte", "", {
    mode: "split", n: "3", k: "2", secret: "10", moduli: "9,12,25",
  }), /coprime/i);
});
