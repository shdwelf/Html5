// Existing kitchen operations checked against their PUBLISHED test vectors.
//   Solitaire: Bruce Schneier, "The Solitaire Encryption Algorithm" v1.2 (1999),
//              test-vector file sol-test.txt linked from schneier.com/academic/solitaire/.
//   TOTP/HOTP: RFC 4226 Appendix D (HOTP, secret "12345678901234567890") and
//              RFC 6238 Appendix B (TOTP, 8 digits, T0=0, X=30; the SHA-256/512
//              rows use the RFC's 32- and 64-byte repeated-ASCII seeds).
// The ops previously advertised only self-consistency; these are the external checks.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { webcrypto, createHmac } from "node:crypto";
import { JSDOM } from "jsdom";

const html = readFileSync(new URL("../public/apps/cyberchef/index.html", import.meta.url), "utf8");

function boot() {
  const dom = new JSDOM(html, {
    runScripts: "dangerously",
    url: "https://example.test/apps/cyberchef/",
    beforeParse(window) {
      window.alert = () => undefined;
      window.confirm = () => false;
      window.prompt = () => null;
      window.URL.createObjectURL = () => "blob:vectors-test";
      window.URL.revokeObjectURL = () => undefined;
      if (!window.crypto || !window.crypto.subtle) Object.defineProperty(window, "crypto", { value: webcrypto });
    },
  });
  const ops = new Map(dom.window.eval("OPERATIONS").map(op => [op.id, op]));
  const run = (id, input, overrides = {}) => {
    const op = ops.get(id);
    assert.ok(op, `missing kitchen operation ${id}`);
    return op.run(input, Object.assign(Object.fromEntries(op.args.map(arg => [arg.key, arg.default])), overrides));
  };
  return { dom, run };
}

const stripHtml = s => (s && typeof s === "object" && "__text" in s ? String(s.__text) + " " + String(s.__html) : String(s)).replace(/<[^>]+>/g, " ");

// Schneier's sol-test.txt: plaintext of A's, key, ciphertext (groups of five).
const solitaireVectors = [
  ["", "AAAAAAAAAAAAAAA", "EXKYI ZSGEH UNTIQ"],
  ["f", "AAAAAAAAAAAAAAA", "XYIUQ BMHKK JBEGY"],
  ["fo", "AAAAAAAAAAAAAAA", "TUJYM BERLG XNDIW"],
  ["foo", "AAAAAAAAAAAAAAA", "ITHZU JIWGR FARMW"],
  ["a", "AAAAAAAAAAAAAAA", "XODAL GSCUL IQNSC"],
  ["aa", "AAAAAAAAAAAAAAA", "OHGWM XXCAI MCIQP"],
  ["aaa", "AAAAAAAAAAAAAAA", "DCSQY HBQZN GDRUT"],
  ["b", "AAAAAAAAAAAAAAA", "XQEEM OITLZ VDSQS"],
  ["bc", "AAAAAAAAAAAAAAA", "QNGRK QIHCL GWSCE"],
  ["bcd", "AAAAAAAAAAAAAAA", "FMUBY BMAXH NQXCJ"],
  ["cryptonomicon", "AAAAAAAAAAAAAAAAAAAAAAAAA", "SUGSR SXSWQ RMXOH IPBFP XARYQ"],
  ["cryptonomicon", "SOLITAIRE", "KIRAK SFJAN"],
];

test("gcwSolitaire matches all twelve Schneier test vectors (encrypt and decrypt)", () => {
  const { dom, run } = boot();
  try {
    for (const [pass, plain, cipher] of solitaireVectors) {
      const enc = stripHtml(run("gcwSolitaire", plain, { op: "encode", pass }));
      assert.ok(enc.includes(cipher), `key '${pass}': expected ${cipher} in ${enc.slice(0, 200)}`);
      const dec = stripHtml(run("gcwSolitaire", cipher, { op: "decode", pass }));
      const expectedPlain = plain.length % 5 ? plain + "X".repeat(5 - (plain.length % 5)) : plain;
      assert.ok(dec.replace(/\s+/g, " ").includes(expectedPlain.replace(/(.{5})/g, "$1 ").trim()), `decrypt key '${pass}': ${dec.slice(0, 200)}`);
    }
  } finally { dom.window.close(); }
});

// RFC 4226 Appendix D: HMAC-SHA-1 HOTP values for counters 0..9.
const hotpRfc4226 = ["755224", "287082", "359152", "969429", "338314", "254676", "287922", "162583", "399871", "520489"];
// RFC 6238 Appendix B: time, SHA-1 / SHA-256 / SHA-512 TOTP (8 digits).
const totpRfc6238 = [
  [59, "94287082", "46119246", "90693936"],
  [1111111109, "07081804", "68084774", "25091201"],
  [1111111111, "14050471", "67062674", "99943326"],
  [1234567890, "89005924", "91819424", "93441116"],
  [2000000000, "69279037", "90698825", "38618901"],
  [20000000000, "65353130", "77737706", "47863826"],
];
const seed20 = Buffer.from("12345678901234567890", "ascii");
const seed32 = Buffer.from("12345678901234567890123456789012", "ascii");
const seed64 = Buffer.from("1234567890123456789012345678901234567890123456789012345678901234", "ascii");

function referenceOtp(algo, key, counter, digits) {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const h = createHmac(algo, key).update(msg).digest();
  const o = h[h.length - 1] & 0x0f;
  const bin = ((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(bin % 10 ** digits).padStart(digits, "0");
}

test("RFC 4226 / RFC 6238 appendix vectors hold for the reference and for the kitchen TOTP op", async () => {
  // The RFC tables first, computed independently with node:crypto.
  hotpRfc4226.forEach((code, counter) => assert.equal(referenceOtp("sha1", seed20, counter, 6), code));
  for (const [t, s1, s256, s512] of totpRfc6238) {
    const T = Math.floor(t / 30);
    assert.equal(referenceOtp("sha1", seed20, T, 8), s1);
    assert.equal(referenceOtp("sha256", seed32, T, 8), s256);
    assert.equal(referenceOtp("sha512", seed64, T, 8), s512);
  }
  const { dom, run } = boot();
  try {
    // HOTP counters 0..9 expressed through the op's time counter: period 1 s, ts = counter.
    for (const [counter, code] of hotpRfc4226.entries()) {
      const out = stripHtml(await run("privacyIdeaTotp", "", { seed: seed20.toString("hex"), algo: "SHA-1", digits: "6", period: "1", ts: String(counter) }));
      assert.match(out, new RegExp(`OATH TOTP Token Code: ${code} `), `HOTP counter ${counter}`);
    }
    for (const [t, s1, s256, s512] of totpRfc6238) {
      const common = { digits: "8", period: "30", ts: String(t) };
      assert.match(stripHtml(await run("privacyIdeaTotp", "", { ...common, seed: seed20.toString("hex"), algo: "SHA-1" })), new RegExp(`Token Code: ${s1} `), `SHA-1 @ ${t}`);
      assert.match(stripHtml(await run("privacyIdeaTotp", "", { ...common, seed: seed32.toString("hex"), algo: "SHA-256" })), new RegExp(`Token Code: ${s256} `), `SHA-256 @ ${t}`);
      assert.match(stripHtml(await run("privacyIdeaTotp", "", { ...common, seed: seed64.toString("hex"), algo: "SHA-512" })), new RegExp(`Token Code: ${s512} `), `SHA-512 @ ${t}`);
    }
  } finally { dom.window.close(); }
});
