import assert from "node:assert/strict";
import { test } from "node:test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import * as openpgp from "openpgp";
import { generateCompatibilityKey, KEY_COMPATIBILITY_CONFIG as config } from "../apps/openpgp-workbench/keyring.mjs";

const python = process.env.OPENPGP_PYTHON || "python3";
const pyProbe = spawnSync(python, ["-c", "import pgpy, importlib.metadata; print(importlib.metadata.version('PGPy'))"], { encoding: "utf8", timeout: 10000 });
const hasPgpy = pyProbe.status === 0 && pyProbe.stdout.trim() === "0.6.0";
const gpgvProbe = spawnSync("gpgv", ["--version"], { encoding: "utf8", timeout: 10000 });
const hasGpgv = gpgvProbe.status === 0;
const required = process.env.REQUIRE_OPENPGP_INTEROP === "1";
const plaintext = "Independent synthetic RSA-key control only.\nUnicode: café 🔐.\n";
const passphrase = "independent control — synthetic use only";
let control;
async function vector() {
  if (control) return control;
  const bundle = await generateCompatibilityKey({ name: "Synthetic interop control — do not use", email: "interop@example.invalid", passphrase, expiryDays: 30 });
  const publicKey = await openpgp.readKey({ armoredKey: bundle.publicKey });
  const privateKey = await openpgp.decryptKey({ privateKey: await openpgp.readPrivateKey({ armoredKey: bundle.privateKey }), passphrase });
  try {
    const message = await openpgp.createMessage({ binary: new TextEncoder().encode(plaintext) });
    const signature = await openpgp.sign({ message, signingKeys: privateKey, detached: true, config });
    const encrypted = await openpgp.encrypt({ message, encryptionKeys: publicKey, config });
    control = { bundle, signature, encrypted };
    return control;
  } finally { privateKey.clearPrivateParams(); }
}

test("independent GnuPG gpgv parses the exported public certificate and verifies the generated RSA signature", { skip: !hasGpgv && !required && "gpgv unavailable (verification-only control)" }, async () => {
  assert.ok(hasGpgv, "This mandatory interop run requires gpgv, not a silent skip");
  const { bundle, signature } = await vector();
  const directory = mkdtempSync(join(tmpdir(), "html5-gpgv-control-"));
  try {
    // Only public certificate, detached signature and synthetic plaintext hit
    // disk. gpgv is verification-only: NOT gpg secret import/decrypt testing.
    writeFileSync(join(directory, "public.gpg"), (await openpgp.readKey({ armoredKey: bundle.publicKey })).write());
    writeFileSync(join(directory, "message.sig.asc"), signature);
    writeFileSync(join(directory, "message.txt"), plaintext);
    const verified = spawnSync("gpgv", ["--homedir", directory, "--status-fd", "1", "--keyring", join(directory, "public.gpg"), join(directory, "message.sig.asc"), join(directory, "message.txt")], { encoding: "utf8", timeout: 15000 });
    assert.equal(verified.status, 0, verified.stderr);
    assert.ok(verified.stdout.includes(`[GNUPG:] VALIDSIG ${bundle.fingerprint}`));
    writeFileSync(join(directory, "message.txt"), plaintext + "modified");
    const bad = spawnSync("gpgv", ["--homedir", directory, "--keyring", join(directory, "public.gpg"), join(directory, "message.sig.asc"), join(directory, "message.txt")], { encoding: "utf8", timeout: 15000 });
    assert.notEqual(bad.status, 0, "modified control must fail independently");
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test("independent PGPy unlocks both protected packets, checks fingerprints and cross-decrypts/signs in both directions", { skip: !hasPgpy && !required && "optional PGPy==0.6.0 unavailable; install it separately and set PYTHONPATH" }, async () => {
  assert.ok(hasPgpy, "This mandatory interop run requires PGPy==0.6.0, not a silent skip");
  const { bundle, signature, encrypted } = await vector();
  const independent = spawnSync(python, [fileURLToPath(new URL("./openpgp-key-interop.py", import.meta.url))], {
    input: JSON.stringify({ ...bundle, signature, encrypted, plaintext, passphrase }), encoding: "utf8", timeout: 30000, maxBuffer: 1_048_576,
  });
  assert.equal(independent.status, 0, independent.stderr);
  const result = JSON.parse(independent.stdout);
  assert.equal(result.implementation, "PGPy"); assert.equal(result.version, "0.6.0");
  assert.equal(result.fingerprint, bundle.fingerprint); assert.equal(result.wrongPassphraseRefused, true);
  const privateKey = await openpgp.decryptKey({ privateKey: await openpgp.readPrivateKey({ armoredKey: bundle.privateKey }), passphrase });
  try {
    const { data } = await openpgp.decrypt({ message: await openpgp.readMessage({ armoredMessage: result.encrypted }), decryptionKeys: privateKey, format: "binary", config });
    assert.equal(new TextDecoder().decode(data), plaintext);
    const verified = await openpgp.verify({ message: await openpgp.createMessage({ binary: new TextEncoder().encode(plaintext) }), signature: await openpgp.readSignature({ armoredSignature: result.signature }), verificationKeys: await openpgp.readKey({ armoredKey: bundle.publicKey }), config });
    assert.equal(verified.signatures.length, 1); await verified.signatures[0].verified;
  } finally { privateKey.clearPrivateParams(); }
});
