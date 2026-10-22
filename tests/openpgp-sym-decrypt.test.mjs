// OpenPGP symmetric-key decrypt (SKESK + SEIPD) — the RFC 4880 §13.9 / §5.13 recipe.
//
// Control vectors are GnuPG's own test blobs, so the recipe is checked against the
// artefact the GnuPG project itself tests with:
//   * tests/openpgp/samplemsgs/enc-sym-cfb-1.asc — AES-128, passphrase "password",
//     decrypts to "Hello, world!\n", MDC and armor CRC both valid.
//   * tests/openpgp/samplemsgs/enc-sym-cfb-2.asc — the same payload under AES-256
//     (two string-to-key digest rounds): both must be reported, not just accepted.
//   * tests/openpgp/samplemsgs/enc-1-key-1.asc — a public-key (PKESK) message, which
//     must be refused by name rather than decrypted into noise.
//   * tests/openpgp/samplemsgs/enc-sym-ocb-1.asc — AEAD Encrypted Data (tag 20), which
//     is a different recipe and must say so.
// The in-page SHA-1 / SHA-256 cores are checked against the FIPS 180-4 vectors and
// against node's own crypto for a spread of lengths. Sources and the record of how the
// mode was pinned down: docs/recipe-sourcing-round-4-2026-10-14.md §4b.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import crypto from "node:crypto";
import { JSDOM } from "jsdom";

const html = readFileSync(new URL("../public/apps/cyberchef/index.html", import.meta.url), "utf8");

const CFB1 = "Symmetric encrypted message of \"Hello, world!\\n\" using\nthe passphrase \"password\" and cipher AES128.CFB.\n\n-----BEGIN PGP MESSAGE-----\n\njA0EBwMCt0tGQ7H0b2Xt0j8BHVEh+mzI3SyApdQmObZuDtAKNk/dRbERyF7haRCn\ncw3N5t3hbOZ/fWlN/BRAaKplninV//QEo8lqheFFpmI=\n=LxrG\n-----END PGP MESSAGE-----\n";
const CFB2 = "Symmetric encrypted message of \"Hello, world!\\n\" using\nthe passphrase \"password\" and cipher AES256.CFB.\n\n-----BEGIN PGP MESSAGE-----\n\njA0ECQMCN4BmCgZpVHDt0j8B1MRJ3ezrbVqU3Xofj5ykOmb7dgYytxzk6QHqzdNO\nlorumncKV+xjFkte8uKqaGJoPhoKb2s9uJWDgugLMDM=\n=gy0I\n-----END PGP MESSAGE-----\n";
const PKESK = "-----BEGIN PGP MESSAGE-----\nVersion: GnuPG v2\n\nhF4DkYWHjk/NdMASAQdAPDV6Y3JTfAGDX8pfZcT6YggC7qV3g8B1ezijcfIcdVAw\n+hCFGXS1EikBbZ21v79GtGh6Wp3fmyZFRQcsJZciLE/EFcbf9Mv4Q2qfRhKYHlqj\n0lwBRYQrwTJbMNspOwd2MidjYYUxb/02PNiqZSrWUeX0iPsgHFToJol9RVAqs4Zz\nbZNKL6y/GeRIRZY12Lzo2TIXSLfjvbMTdkoz53mMKiUXsi/fCKXkTmgIheni8w==\n=kmqY\n-----END PGP MESSAGE-----\n";
const OCB = "Symmetric encrypted message of \"Hello, world!\\n\" using\nthe passphrase \"password\" and cipher AES128.OCB.\nThis is the sample message from the rfc4880bis specs.\n\n-----BEGIN PGP MESSAGE-----\n\nwz0FBwIDCJ8LfaPl6mR3kJnjJuVACpCTbO+06OugjGdzcW0fJxRUCjj8rFKZSdrF\nKdPeMeFbSutynjMAM9vt1EkBBwIOXtK8HkcKvo8dZEx6bIpWew93ARlmEaFUupwl\ndM0FYoSo72gDXGI9k8xwikMhG7bq8rJ/fBjVcbzYOyCt06CLc68VuaCY\n=xyh5\n-----END PGP MESSAGE-----\n";

function boot() {
  const dom = new JSDOM(html, {
    runScripts: "dangerously",
    url: "https://example.test/apps/cyberchef/",
    beforeParse(window) {
      window.alert = () => undefined;
      window.confirm = () => false;
      window.prompt = () => null;
      window.URL.createObjectURL = () => "blob:openpgp-sym-test";
      window.URL.revokeObjectURL = () => undefined;
    },
  });
  const ops = dom.window.eval("OPERATIONS");
  const op = ops.find((entry) => entry.id === "pgpSymDecrypt");
  assert.ok(op, "pgpSymDecrypt is registered");
  const run = (input, changes = {}) => {
    const args = Object.fromEntries(op.args.map((arg) => [arg.key, arg.default]));
    Object.assign(args, changes);
    return op.run(input, args);
  };
  return { dom, run, ops };
}

test("the in-page SHA-1 and SHA-256 cores match the FIPS 180-4 vectors", () => {
  const { dom } = boot();
  try {
    const hex = (name, text) => dom.window.eval(`(s) => fdHex(fdHashBytes(${JSON.stringify(name)}, utf8Encode(s)))`)(text);
    // FIPS 180-4 / NIST CAVP: one block, no block, and the 448-bit message that
    // forces a second padding block.
    assert.equal(hex("SHA-1", ""), "da39a3ee5e6b4b0d3255bfef95601890afd80709");
    assert.equal(hex("SHA-1", "abc"), "a9993e364706816aba3e25717850c26c9cd0d89d");
    assert.equal(hex("SHA-1", "abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"),
      "84983e441c3bd26ebaae4aa1f95129e5e54670f1");
    assert.equal(hex("SHA-256", ""), "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    assert.equal(hex("SHA-256", "abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    assert.equal(hex("SHA-256", "abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"),
      "248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1");
    // The streaming wrappers must agree with node's crypto across block boundaries,
    // including the 56/57/63/64 lengths where the padding branches differ.
    for (const n of [0, 1, 55, 56, 57, 63, 64, 65, 127, 128, 1000, 70000]) {
      const bytes = crypto.createHash("sha512").update("len-" + n).digest().subarray(0, Math.max(1, n % 64));
      const buf = Buffer.concat(Array.from({ length: Math.ceil(n / Math.max(1, bytes.length)) }, () => bytes)).subarray(0, n);
      const u8 = new Uint8Array(buf);
      const mine1 = dom.window.eval("(b) => fdHex(fdHashBytes('SHA-1', b))")(u8);
      const mine2 = dom.window.eval("(b) => fdHex(fdHashBytes('SHA-256', b))")(u8);
      assert.equal(mine1, crypto.createHash("sha1").update(buf).digest("hex"), `SHA-1 of ${n} octets`);
      assert.equal(mine2, crypto.createHash("sha256").update(buf).digest("hex"), `SHA-256 of ${n} octets`);
    }
  } finally { dom.window.close(); }
});

test("GnuPG's AES-128 symmetric message decrypts to \"Hello, world!\n\" with a matching MDC", () => {
  const { dom, run } = boot();
  try {
    const out = run(CFB1);
    assert.match(out, /^════ OpenPGP symmetric-key message ════$/m);
    assert.match(out, /CRC-24 line =LxrG OK/, "the armor checksum of the same blob is verified too");
    assert.match(out, /SKESK v4 \(tag 3, 13 octets\) · SEIPD v1 \(tag 18, 63 octets\)/);
    assert.match(out, /S2K {8}: iterated \+ salted, SHA-1 \(hash id 2\), salt b74b4643b1f46f65, count 0xED → 30408704 octets, 1 digest round/);
    assert.match(out, /Session key: 4427a90b4b80099835fb0b5950352b33/);
    // The §13.9 quick check: the two octets after the 16-octet random prefix repeat
    // the pair before them.  Truncated to 18 octets here, exactly as §13.9 sets it up.
    assert.match(out, /Prefix {5}: 307da69d5b87325044683d12858a65b4 \| 65b4 {2}quick check OK/);
    assert.match(out, /literal data \(tag 11, 20 octets\) · format "b" · filename \(none\) · stored 2022-11-02T14:01:58Z/);
    assert.match(out, /MDC {8}: OK — hash of the 62 octets that precede the 20-octet MDC matches it, and the D3 14 packet octets are where they belong/);
    assert.match(out, /Payload {4}: 14 octets\nHello, world!\n/);
  } finally { dom.window.close(); }
});

test("the AES-256 twin decrypts too, and reports its extra string-to-key round", () => {
  const { dom, run } = boot();
  try {
    const out = run(CFB2);
    assert.match(out, /CRC-24 line =gy0I OK/);
    assert.match(out, /Cipher {5}: AES-256 \(id 9\) · CFB, 256-bit feedback, IV = 0/);
    assert.match(out, /salt 3780660a06695470, count 0xED → 30408704 octets, 2 digest rounds/, "a 32-octet key needs a second digest round");
    assert.match(out, /Session key: c6f7e95227c816a1c8b25f161088492cdd5ebd0f01e2e690e2b80c3cec15002c/);
    assert.match(out, /Prefix {5}: af2d997656147e9d95c8474a6cf97804 \| 7804 {2}quick check OK/);
    assert.match(out, /stored 2022-11-02T14:02:13Z/);
    assert.match(out, /MDC {8}: OK/);
    assert.match(out, /Hello, world!\n/);
  } finally { dom.window.close(); }
});

test("one altered base64 character breaks the armor CRC, the prefix check and the MDC", () => {
  const { dom, run } = boot();
  try {
    const lines = CFB1.split("\n");
    const i = lines.findIndex((line) => line.startsWith("cw3N"));
    lines[i] = "dw3N" + lines[i].slice(4);
    const out = run(lines.join("\n"));
    assert.match(out, /CRC-24 line =LxrG MISMATCH \(recomputed =Hk5h\)/, "the armor checksum catches the edit first");
    // The §13.9 pair check only looks at the 18-octet prefix, so an edit further down
    // leaves it green — the MDC is what has to catch the change, and it does.
    assert.match(out, /quick check OK/);
    assert.match(out, /MDC {8}: MISMATCH — recomputed 0x[0-9a-f]+… against stored 0x/);
    assert.doesNotMatch(out, /Hello, world!/);
  } finally { dom.window.close(); }
});

test("a wrong passphrase is reported, never returned as plaintext noise", () => {
  const { dom, run } = boot();
  try {
    const out = run(CFB1, { pass: "Password" });
    assert.match(out, /quick check FAILED/);
    assert.match(out, /MDC {8}: MISMATCH/);
    assert.doesNotMatch(out, /Hello, world!/);
  } finally { dom.window.close(); }
});

test("the raw (hex / base64) path is the same packet stream as the armored one", () => {
  const { dom, run } = boot();
  try {
    const lines = CFB1.split("\n");
    const begin = lines.findIndex((line) => line.startsWith("-----BEGIN PGP"));
    const b64 = lines.slice(begin + 1).filter((line) => line && !line.startsWith("=") && !line.startsWith("-----")).join("");
    const hex = dom.window.eval("(s) => fdHex(bytesFromB64(s))")(b64);
    for (const [input, infmt] of [[b64, "base64"], [hex, "hex"]]) {
      const out = run(input, { mode: "raw", infmt });
      assert.match(out, /Input {6}: 80 octets of packet stream \(/);
      assert.match(out, /Hello, world!\n/);
      assert.match(out, /MDC {8}: OK/);
    }
    // The armor's CRC line lives outside the payload, so raw mode has no checksum to
    // report — a difference worth pinning, not a bug.
    assert.match(run(hex, { mode: "raw", infmt: "hex" }), /Input {6}: 80 octets/);
    assert.doesNotMatch(run(hex, { mode: "raw", infmt: "hex" }), /CRC-24 line/);
  } finally { dom.window.close(); }
});

test("out-of-scope messages are refused by name: public key, AEAD, and non-armored text", () => {
  const { dom, run } = boot();
  try {
    assert.throws(() => run(PKESK), /encrypted to a public key \(PKESK, tag 1\)/);
    assert.throws(() => run(OCB), /AEAD Encrypted Data \(tag 20, RFC 9580\)/);
    assert.throws(() => run("hello there"), /No "-----BEGIN PGP …" armor header found/);
    // §5.3's other SKESK form — a session key encrypted inside the packet — is refused
    // with the reason, not guessed at.  Built by prefixing the AES-128 vector's own
    // SEIPD packet with a version-4 SKESK that carries a 48-octet session-key field.
    const payloadLines = CFB1.split("\n");
    const payloadStart = payloadLines.findIndex((line) => line.startsWith("-----BEGIN PGP"));
    const payload = payloadLines.slice(payloadStart + 1)
      .filter((line) => line && !line.startsWith("=") && !line.startsWith("-----")).join("");
    const seipdHex = dom.window.eval("(s) => fdHex(bytesFromB64(s))")(payload).slice(30);
    const skeskWithEsk = "8c3d04070302b74b4643b1f46f65ed" + "00112233445566778899aabbccddeeff".repeat(3) + seipdHex;
    assert.throws(() => run(skeskWithEsk, { mode: "raw", infmt: "hex" }), /48-octet encrypted session key/);
  } finally { dom.window.close(); }
});
