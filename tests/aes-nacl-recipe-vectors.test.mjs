// AES + NaCl recipe verification for the CyberChef lab ("try aes nc recipe").
//
// Known-answer vectors, in three layers:
//   1. naclSecretbox — pinned to the OFFICIAL NaCl crypto_secretbox test vector
//      (key/nonce/message/box from the NaCl distribution; the op's own argument
//      defaults are those values). Cross-checked against tweetnacl from npm
//      (independent implementation of the same construction).
//   2. aesGCM / aesCBC — output cross-checked by RE-DERIVING the WebCrypto
//      pipeline in node:crypto (PBKDF2-SHA256, 100k iterations, salt = iv,
//      AES-256-GCM / AES-256-CBC-PKCS7) and decrypting there.
//   3. saltpackEncrypt — the second entry of the "NaCl / Keybase Saltpack
//      Encrypt" recipe pack: seal/open round-trip (its secretbox core is the
//      verified primitive from layer 1; the wrapper is self-consistent framing).
//
// See docs/aes-nacl-recipe-checks-2026-10-21.md.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { webcrypto, createDecipheriv, pbkdf2Sync } from "node:crypto";
import { TextEncoder, TextDecoder } from "node:util";
import { JSDOM } from "jsdom";
import nacl from "tweetnacl";

/* --------------------------------------------- official NaCl vector (pinned) */
// jedisct1/libsodium test/default/secretbox.c + secretbox.exp (first block):
// c[0..15] is the Poly1305 tag, c[16..162] the 131-byte ciphertext.
const NACL_KEY_HEX = "1b27556473e985d462cd51197a9a46c76009549eac6474f206c4ee0844f68389";
const NACL_NONCE_HEX = "69696ee955b62b73cd62bda875fc73d68219e0036b7a0b37";
const NACL_MSG_HEX =
  "be075fc53c81f2d5cf141316ebeb0c7b5228c52a4c62cbd44b66849b64244ffce5ecb" +
  "aaf33bd751a1ac728d45e6c61296cdc3c01233561f41db66cce314adb310e3be8250c" +
  "46f06dceea3a7fa1348057e2f6556ad6b1318a024a838f21af1fde048977eb48f59ff" +
  "d4924ca1c60902e52f0a089bc76897040e082f937763848645e0705";
const NACL_BOX_HEX =
  "f3ffc7703f9400e52a7dfb4b3d3305d98e993b9f48681273c29650ba32fc76ce48332e" +
  "a7164d96a4476fb8c531a1186ac0dfc17c98dce87b4da7f011ec48c97271d2c20f9b9" +
  "28fe2270d6fb863d51738b48eeee314a7cc8ab932164548e526ae90224368517acfeab" +
  "d6bb3732bc0e9da99832b61ca01b6de56244a9e88d5f9b37973f622a43d14a6599b1f6" +
  "54cb45a74e355a5";

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
      window.URL.createObjectURL = () => "blob:aes-nacl-test";
      window.URL.revokeObjectURL = () => undefined;
      window.fetch = async (url) => {
        const body = String(url).includes("zxing-library.min.js") ? zxingSource : bwipSource;
        return { ok: true, text: async () => body };
      };
    },
  });
}

// Run one registry op the way the apply path does: run(data, args). The async
// wrapper normalises sync ops into promises so callers can always await.
function opRun(dom, id, input, args) {
  return dom.window.eval(`(async () => {
    const op = OPERATIONS.find(o => o.id === ${JSON.stringify(id)});
    if (!op) throw new Error("missing op " + ${JSON.stringify(id)});
    return await op.run(${JSON.stringify(input)}, ${JSON.stringify(args)});
  })()`);
}

const unhex = (h) => Uint8Array.from(h.match(/../g).map((x) => parseInt(x, 16)));
const hexOf = (b) => [...b].map((x) => x.toString(16).padStart(2, "0")).join("");

let dom;
test("boots the CyberChef registry", async () => {
  dom = createDom();
  const ids = dom.window.eval("OPERATIONS.map(o => o.id)");
  for (const id of ["naclSecretbox", "saltpackEncrypt", "aesGCM", "aesCBC"]) {
    assert.ok(ids.includes(id), `${id} registered`);
  }
});

test("naclSecretbox defaults are the official NaCl vector values", () => {
  const args = JSON.parse(dom.window.eval(
    "JSON.stringify(OPERATIONS.find(o => o.id === 'naclSecretbox').args)"));
  const byKey = Object.fromEntries(args.map((a) => [a.key, a]));
  assert.equal(byKey.key.default, NACL_KEY_HEX, "default key = official key");
  assert.equal(byKey.nonce.default, NACL_NONCE_HEX, "default nonce = official nonce");
  assert.equal(byKey.mode.default, "encrypt");
  assert.equal(byKey.infmt.default, "hex");
});

test("naclSecretbox encrypts the official vector to the official box (+ tweetnacl cross-check)", async () => {
  const out = await opRun(dom, "naclSecretbox", NACL_MSG_HEX, {
    key: NACL_KEY_HEX, nonce: NACL_NONCE_HEX, mode: "encrypt", infmt: "hex",
  });
  const m = String(out.__text).match(/Box : ([0-9a-f]+)/);
  assert.ok(m, "kit card reports the box hex");
  assert.equal(m[1], NACL_BOX_HEX, "op box == official NaCl box (147B, f3ffc770…)");
  // independent implementation: tweetnacl (npm) over the same raw bytes
  const box = nacl.secretbox(unhex(NACL_MSG_HEX), unhex(NACL_NONCE_HEX), unhex(NACL_KEY_HEX));
  assert.equal(hexOf(box), NACL_BOX_HEX, "tweetnacl agrees with the official box");
});

test("naclSecretbox opens the official box and rejects tampering", async () => {
  const out = await opRun(dom, "naclSecretbox", NACL_BOX_HEX, {
    key: NACL_KEY_HEX, nonce: NACL_NONCE_HEX, mode: "decrypt", infmt: "hex",
  });
  assert.equal(out.__text, NACL_MSG_HEX, "decrypt returns the official message");
  // tweetnacl open cross-check
  const pt = nacl.secretbox.open(unhex(NACL_BOX_HEX), unhex(NACL_NONCE_HEX), unhex(NACL_KEY_HEX));
  assert.equal(hexOf(pt), NACL_MSG_HEX);
  // one flipped ciphertext nibble -> MAC must fail
  const bad = NACL_BOX_HEX.slice(0, -1) + (NACL_BOX_HEX.endsWith("5") ? "4" : "5");
  await assert.rejects(
    opRun(dom, "naclSecretbox", bad, {
      key: NACL_KEY_HEX, nonce: NACL_NONCE_HEX, mode: "decrypt", infmt: "hex",
    }),
    /MAC check failed/);
});

test("naclSecretbox text mode round-trips", async () => {
  const enc = await opRun(dom, "naclSecretbox", "Too many secrets.", {
    key: NACL_KEY_HEX, nonce: NACL_NONCE_HEX, mode: "encrypt", infmt: "text",
  });
  const boxHex = String(enc.__text).match(/Box : ([0-9a-f]+)/)[1];
  const expected = hexOf(nacl.secretbox(new TextEncoder().encode("Too many secrets."),
    unhex(NACL_NONCE_HEX), unhex(NACL_KEY_HEX)));
  assert.equal(boxHex, expected, "text-mode box matches tweetnacl over the UTF-8 bytes");
  const dec = await opRun(dom, "naclSecretbox", boxHex, {
    key: NACL_KEY_HEX, nonce: NACL_NONCE_HEX, mode: "decrypt", infmt: "text",
  });
  assert.equal(dec.__text, "Too many secrets.");
});

/* ------------------------------------------------------------- AES recipes */

function nodeAesGcmDecrypt(pass, b64) {
  const raw = Buffer.from(b64, "base64");
  const iv = raw.subarray(0, 12);
  const body = raw.subarray(12);
  const key = pbkdf2Sync(pass, iv, 100000, 32, "sha256");
  const d = createDecipheriv("aes-256-gcm", key, iv);
  d.setAuthTag(body.subarray(body.length - 16));
  return Buffer.concat([d.update(body.subarray(0, body.length - 16)), d.final()]).toString("utf8");
}

function nodeAesCbcDecrypt(pass, b64) {
  const raw = Buffer.from(b64, "base64");
  const iv = raw.subarray(0, 16);
  const ct = raw.subarray(16);
  const key = pbkdf2Sync(pass, iv, 100000, 32, "sha256");
  const d = createDecipheriv("aes-256-cbc", key, iv); // PKCS#7 auto-unpad
  return Buffer.concat([d.update(ct), d.final()]).toString("utf8");
}

test("aesGCM output decrypts via an independent node:crypto PBKDF2+AES-256-GCM pipeline", async () => {
  const b64 = await opRun(dom, "aesGCM", "Too many secrets.", { pass: "secret", mode: "encrypt" });
  assert.equal(typeof b64, "string");
  const raw = Buffer.from(b64, "base64");
  assert.equal(raw.length, 12 + 17 + 16, "iv(12) + ct(17) + tag(16)");
  assert.equal(nodeAesGcmDecrypt("secret", b64), "Too many secrets.",
    "node:crypto re-derivation (PBKDF2-SHA256 100k, salt=iv) decrypts the op output");
  // op's own decrypt path
  const back = await opRun(dom, "aesGCM", b64, { pass: "secret", mode: "decrypt" });
  assert.equal(back, "Too many secrets.");
  // wrong password fails the GCM tag
  await assert.rejects(opRun(dom, "aesGCM", b64, { pass: "wrong", mode: "decrypt" }));
  // tampering with the ciphertext fails the GCM tag
  const raw2 = Buffer.from(raw); raw2[20] ^= 1;
  await assert.rejects(opRun(dom, "aesGCM", raw2.toString("base64"), { pass: "secret", mode: "decrypt" }));
});

test("aesCBC output decrypts via an independent node:crypto PBKDF2+AES-256-CBC pipeline", async () => {
  const b64 = await opRun(dom, "aesCBC", "Too many secrets.", { pass: "secret", mode: "encrypt" });
  const raw = Buffer.from(b64, "base64");
  assert.equal(raw.length, 16 + 32, "iv(16) + ct(32: 17B pt, PKCS#7 two blocks)");
  assert.equal(nodeAesCbcDecrypt("secret", b64), "Too many secrets.");
  const back = await opRun(dom, "aesCBC", b64, { pass: "secret", mode: "decrypt" });
  assert.equal(back, "Too many secrets.");
  await assert.rejects(opRun(dom, "aesCBC", b64, { pass: "wrong", mode: "decrypt" }));
});

/* ------------------------------------------- Saltpack pack (NaCl family) */

test("the NaCl / Keybase Saltpack Encrypt pack pairs secretbox with saltpack framing", async () => {
  const pack = JSON.parse(dom.window.eval(
    "JSON.stringify(RECIPE_PACKS['NaCl / Keybase Saltpack Encrypt'])"));
  assert.deepEqual(pack, [["naclSecretbox", {}], ["saltpackEncrypt", {}]]);
});

test("saltpackEncrypt seal/open round-trips (secretbox core, Armor62 wrapper)", async () => {
  const sealed = await opRun(dom, "saltpackEncrypt", "Too many secrets.", {
    mode: "seal", pass: "SecretSpace",
  });
  const arm = String(sealed.__text).split("\n")[1];
  assert.ok(arm && arm.includes("BEGIN KEYBASE SALTPACK"), `armor header present (${arm})`);
  const opened = await opRun(dom, "saltpackEncrypt", arm, {
    mode: "open", pass: "SecretSpace",
  });
  assert.equal(opened.__text, "Too many secrets.");
  // wrong passphrase cannot recover the plaintext (throws, or yields other text)
  const wrong = await opRun(dom, "saltpackEncrypt", arm, {
    mode: "open", pass: "WrongPass",
  }).then((r) => String(r.__text), (e) => `THREW: ${e.message}`);
  assert.notEqual(wrong, "Too many secrets.");
});
