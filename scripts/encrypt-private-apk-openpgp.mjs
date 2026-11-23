#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import * as openpgp from "../public/apps/openpgp-workbench/vendor/openpgp.min.mjs";

const [apkPath, armoredKeysPath, outputDir] = process.argv.slice(2);
if (!apkPath || !armoredKeysPath || !outputDir) {
  throw new Error("Usage: node scripts/encrypt-private-apk-openpgp.mjs <private.apk> <recipient-keys.asc> <output-dir>");
}

const [apk, armoredKeys] = await Promise.all([
  readFile(apkPath),
  readFile(armoredKeysPath, "utf8"),
]);
if (apk.length === 0) throw new Error("Refusing to encrypt an empty APK.");

const keyBlocks = armoredKeys
  .split(/(?=-----BEGIN PGP PUBLIC KEY BLOCK-----)/)
  .map((block) => block.trim())
  .filter((block) => block.startsWith("-----BEGIN PGP PUBLIC KEY BLOCK-----") && block.includes("-----END PGP PUBLIC KEY BLOCK-----"));
if (keyBlocks.length === 0) throw new Error("No armored OpenPGP public key blocks were found.");
const keys = await Promise.all(keyBlocks.map((armoredKey) => openpgp.readKey({ armoredKey })));
await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true, mode: 0o700 });

const encryptedSubkeys = new Set();
const written = [];
for (const key of keys) {
  if (key.isPrivate()) throw new Error("Supply only public key certificates; private keys are not accepted.");
  const encryptionKey = await key.getEncryptionKey();
  const fingerprint = encryptionKey.getFingerprint().toLowerCase();
  if (encryptedSubkeys.has(fingerprint)) continue;
  encryptedSubkeys.add(fingerprint);

  const message = await openpgp.createMessage({ binary: new Uint8Array(apk) });
  const ciphertext = await openpgp.encrypt({ message, encryptionKeys: key, format: "armored" });
  const name = `app-private-debug-${fingerprint}.apk.asc`;
  const filePath = path.join(outputDir, name);
  await writeFile(filePath, ciphertext, { mode: 0o600 });
  const digest = createHash("sha256").update(ciphertext).digest("hex");
  written.push(`${digest}  ${name}`);
  console.log(`Encrypted private APK to OpenPGP encryption subkey ${fingerprint}.`);
}

if (written.length === 0) throw new Error("No unique encryption-capable recipient subkeys were found.");
await writeFile(path.join(outputDir, "SHA256SUMS.txt"), `${written.join("\n")}\n`, { mode: 0o600 });
const files = await readdir(outputDir);
console.log(`Wrote ${files.length - 1} encrypted APK file(s) and SHA256SUMS.txt.`);
