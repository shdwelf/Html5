import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { JSDOM } from "jsdom";
import * as openpgp from "openpgp";
import {
  CLASSIC_OPENPGP_CONFIG,
  MAX_ARMORED_BYTES,
  MAX_PLAINTEXT_BYTES,
  createOpenPgpTextTools,
  decryptOpenPgpText,
  encryptClassicText,
} from "../apps/openpgp-workbench/crypto.mjs";

const gnupgVector = readFileSync(new URL("./fixtures/openpgp/gnupg-enc-sym-cfb-1.asc", import.meta.url), "utf8");
const cyberChefHtml = readFileSync(new URL("../public/apps/cyberchef/index.html", import.meta.url), "utf8");
const appHtml = readFileSync(new URL("../public/apps/openpgp-workbench/index.html", import.meta.url), "utf8");
const bundledBrowserModule = new URL("../public/apps/openpgp-workbench/vendor/openpgp.min.mjs", import.meta.url);

function bootCyberChef() {
  const dom = new JSDOM(cyberChefHtml, {
    runScripts: "dangerously",
    url: "https://example.test/apps/cyberchef/",
    beforeParse(window) {
      window.alert = () => undefined;
      window.confirm = () => false;
      window.prompt = () => null;
      window.URL.createObjectURL = () => "blob:openpgp-workbench-test";
      window.URL.revokeObjectURL = () => undefined;
    },
  });
  const ops = dom.window.eval("OPERATIONS");
  const operation = ops.find((entry) => entry.id === "pgpSymDecrypt");
  assert.ok(operation, "the existing CyberChef symmetric OpenPGP operation is registered");
  const run = (input, changes = {}) => {
    const args = Object.fromEntries(operation.args.map((arg) => [arg.key, arg.default]));
    Object.assign(args, changes);
    return operation.run(input, args);
  };
  return { dom, run };
}

test("the workbench pins a classic v4 passphrase profile", () => {
  assert.equal(CLASSIC_OPENPGP_CONFIG.preferredSymmetricAlgorithm, openpgp.enums.symmetric.aes256);
  assert.equal(CLASSIC_OPENPGP_CONFIG.preferredHashAlgorithm, openpgp.enums.hash.sha256);
  assert.equal(CLASSIC_OPENPGP_CONFIG.preferredCompressionAlgorithm, openpgp.enums.compression.uncompressed);
  assert.equal(CLASSIC_OPENPGP_CONFIG.s2kType, openpgp.enums.s2k.iterated);
  assert.equal(CLASSIC_OPENPGP_CONFIG.s2kIterationCountByte, 0xff);
  assert.equal(CLASSIC_OPENPGP_CONFIG.aeadProtect, false);
  assert.equal(CLASSIC_OPENPGP_CONFIG.allowUnauthenticatedMessages, false);
});

test("the app decrypts the published GnuPG AES-128 control message to its known plaintext", async () => {
  assert.equal(await decryptOpenPgpText(gnupgVector, "password"), "Hello, world!\n");
});

test("text encrypt/decrypt round-trips Unicode and exact newline bytes", async () => {
  const plaintext = "OpenPGP Workbench — local test only.\nA second line: café, Καλημέρα, and 🔐.\n";
  const passphrase = "unit-test-only classic passphrase";
  const armored = await encryptClassicText(plaintext, passphrase);
  assert.match(armored, /^-----BEGIN PGP MESSAGE-----/);
  assert.match(armored, /-----END PGP MESSAGE-----\s*$/);
  assert.equal(await decryptOpenPgpText(armored, passphrase), plaintext);
});

test("app-generated classic AES-256 output independently decrypts in CyberChef", async () => {
  const plaintext = "Cross-implementation control from OpenPGP Workbench.\n";
  const passphrase = "cyberchef-interoperability-test-only";
  const armored = await encryptClassicText(plaintext, passphrase);
  const { dom, run } = bootCyberChef();
  try {
    const output = run(armored, { pass: passphrase });
    assert.match(output, /SKESK v4 \(tag 3,/);
    assert.match(output, /SEIPD v1 \(tag 18,/);
    assert.match(output, /Cipher {5}: AES-256 \(id 9\)/);
    assert.match(output, /S2K {8}: iterated \+ salted, SHA-256 \(hash id 8\), salt [0-9a-f]{16}, count 0xFF → 65011712 octets/);
    assert.match(output, /MDC {8}: OK/);
    assert.match(output, /Payload {4}: \d+ octets\nCross-implementation control from OpenPGP Workbench\.\n/);
  } finally {
    dom.window.close();
  }
});

test("the shipped browser bundle and page are local and carry the library license", async () => {
  assert.match(appHtml, /"openpgp":\s*"\.\/vendor\/openpgp\.min\.mjs"/);
  assert.match(appHtml, /\.\/styles\.css/);
  assert.doesNotMatch(appHtml, /<(?:script|link)[^>]+(?:https?:)?\/\//i);
  const bundlePath = fileURLToPath(bundledBrowserModule);
  assert.ok(statSync(bundlePath).size > 100_000, "the local OpenPGP.js browser bundle was built");
  const license = readFileSync(new URL("../public/apps/openpgp-workbench/vendor/openpgp.LICENSE", import.meta.url), "utf8");
  assert.match(license, /GNU LESSER GENERAL PUBLIC LICENSE/i);

  // Exercise the actual browser distribution as a module, not only OpenPGP.js's Node entry.
  const browserOpenPgp = await import(pathToFileURL(bundlePath).href);
  const message = await browserOpenPgp.readMessage({ armoredMessage: gnupgVector });
  const { data } = await browserOpenPgp.decrypt({
    message,
    passwords: ["password"],
    format: "utf8",
    config: CLASSIC_OPENPGP_CONFIG,
  });
  assert.equal(data, "Hello, world!\n");

  const browserTools = createOpenPgpTextTools(browserOpenPgp);
  assert.equal(await browserTools.decryptOpenPgpText(gnupgVector, "password"), "Hello, world!\n");
  const browserArmor = await browserTools.encryptClassicText("Browser-bundle interoperability check.\n", "browser-bundle-test-only");
  const { dom, run } = bootCyberChef();
  try {
    const output = run(browserArmor, { pass: "browser-bundle-test-only" });
    assert.match(output, /Cipher {5}: AES-256 \(id 9\)/);
    assert.match(output, /S2K {8}: iterated \+ salted, SHA-256 \(hash id 8\)/);
    assert.match(output, /MDC {8}: OK/);
    assert.match(output, /Browser-bundle interoperability check\./);
  } finally {
    dom.window.close();
  }
});

test("the workbench rejects a modified GnuPG control message", async () => {
  const tampered = gnupgVector.replace("cw3N", "dw3N");
  assert.notEqual(tampered, gnupgVector);
  await assert.rejects(decryptOpenPgpText(tampered, "password"), /decrypt|integrity|modification|MDC/i);
});

test("wrong passphrases and oversized input are rejected", async () => {
  await assert.rejects(decryptOpenPgpText(gnupgVector, "not-the-password"), /decrypt|session|key|passphrase/i);
  await assert.rejects(encryptClassicText("x".repeat(MAX_PLAINTEXT_BYTES + 1), "test passphrase"), /1,048,576 UTF-8 bytes/);
  await assert.rejects(decryptOpenPgpText("x".repeat(MAX_ARMORED_BYTES + 1), "test passphrase"), /2,097,152 UTF-8 bytes/);
  await assert.rejects(encryptClassicText("text", ""), /Passphrase must not be empty/);
});
