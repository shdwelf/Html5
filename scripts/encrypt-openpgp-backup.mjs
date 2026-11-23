#!/usr/bin/env node
/** Recipient-only, streaming release encryption. No native GnuPG or private key is needed. */
import * as openpgp from "openpgp";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, open, readFile, rm, stat, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import {
  KEY_COMPATIBILITY_CONFIG as config, MAX_KEYRING_BYTES, readEncryptionRecipient,
} from "../apps/openpgp-workbench/keyring.mjs";

async function ciphertextDigest(path) {
  const sha256 = createHash("sha256"), md5 = createHash("md5");
  let bytes = 0;
  for await (const chunk of createReadStream(path)) {
    bytes += chunk.length; sha256.update(chunk); md5.update(chunk);
  }
  return { bytes, sha256: sha256.digest("hex"), md5: md5.digest("hex") };
}

export async function encryptBackup({ inputPath, outputPath, recipientFile, expectedFingerprint, sourceRevision }) {
  if (!/^[a-f0-9]{40}$/.test(sourceRevision ?? "")) throw new Error("An exact 40-hex source revision is required.");
  const input = resolve(inputPath), output = resolve(outputPath);
  if (input === output) throw new Error("Input and ciphertext output must be different files.");
  if (!(await stat(input)).isFile()) throw new Error("Backup input must be a regular file.");
  const keyStat = await stat(recipientFile);
  if (!keyStat.isFile() || keyStat.size > MAX_KEYRING_BYTES) throw new Error("Recipient certificate exceeds the bounded public-key input policy.");
  const recipient = await readEncryptionRecipient(await readFile(recipientFile, "utf8"), expectedFingerprint);
  const created = [];
  let inputStream, outputHandle;
  try {
    await mkdir(dirname(output), { recursive: true, mode: 0o700 });
    // Exclusive creation: a rerun cannot silently overwrite a previous backup.
    outputHandle = await open(output, "wx", 0o600); created.push(output);
    inputStream = createReadStream(input);
    const encrypted = await openpgp.encrypt({
      message: await openpgp.createMessage({ binary: Readable.toWeb(inputStream), filename: basename(input) }),
      encryptionKeys: recipient.key,
      encryptionKeyIDs: [recipient.encryptionKey.getKeyID()],
      format: "binary", config,
    });
    await pipeline(Readable.fromWeb(encrypted), outputHandle.createWriteStream());
    outputHandle = undefined;

    // Inspect the actual envelope, not just the requested options. Only one
    // v3 PKESK for the validated encryption key and classic SEIPDv1/MDC.
    const envelopeStream = createReadStream(output);
    try {
      const message = await openpgp.readMessage({ binaryMessage: Readable.toWeb(envelopeStream), config });
      const sessions = message.packets.filter((packet) => packet.constructor.tag === openpgp.enums.packet.publicKeyEncryptedSessionKey);
      const body = message.packets.at(-1);
      if (sessions.length !== 1 || sessions[0].version !== 3 ||
        sessions[0].publicKeyID.toHex().toUpperCase() !== recipient.encryptionKeyID ||
        message.packets.length !== 2 || body.constructor.tag !== openpgp.enums.packet.symEncryptedIntegrityProtectedData || body.version !== 1) {
        throw new Error("Unexpected recipient or encrypted packet profile; backup refused.");
      }
    } finally { envelopeStream.destroy(); }

    const manifest = {
      schema: 1,
      sourceRevision,
      file: basename(output),
      recipientFingerprint: recipient.fingerprint,
      encryptionFingerprint: recipient.encryptionFingerprint,
      encryptionKeyID: recipient.encryptionKeyID,
      recipientProfile: recipient.algorithm,
      format: "binary OpenPGP; one v3 PKESK; SEIPDv1/MDC; unsigned",
      preferredCipher: "AES-256 (negotiated against recipient preferences)",
      ciphertext: await ciphertextDigest(output),
      verification: "Envelope and ciphertext digests checked. Owner decryption is not claimed; no owner private key was supplied.",
    };
    await writeFile(`${output}.json`, `${JSON.stringify(manifest, null, 2)}\n`, { flag: "wx", mode: 0o600 });
    created.push(`${output}.json`);
    await writeFile(`${output}.sha256`, `${manifest.ciphertext.sha256}  ${basename(output)}\n`, { flag: "wx", mode: 0o600 });
    created.push(`${output}.sha256`);
    return manifest;
  } catch (error) {
    await outputHandle?.close().catch(() => {});
    await Promise.all(created.map((path) => rm(path, { force: true })));
    throw error;
  } finally { inputStream?.destroy(); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const names = new Map([
      ["--input", "inputPath"], ["--output", "outputPath"], ["--recipient-file", "recipientFile"],
      ["--expected-fingerprint", "expectedFingerprint"], ["--source-revision", "sourceRevision"],
    ]);
    const options = {}, args = process.argv.slice(2);
    for (let index = 0; index < args.length; index += 2) {
      const name = names.get(args[index]), value = args[index + 1];
      if (!name || !value || value.startsWith("--") || Object.hasOwn(options, name)) throw new Error("Invalid arguments.");
      options[name] = value;
    }
    if (Object.keys(options).length !== names.size) throw new Error("All five options are required.");
    const manifest = await encryptBackup(options);
    console.log(`Encrypted ${manifest.file}: ${manifest.ciphertext.bytes} bytes; SHA-256 ${manifest.ciphertext.sha256}`);
  } catch {
    // Library parser errors may quote a User ID. Never echo imported key data,
    // argv contents, private file contents or personal identity into CI logs.
    console.error("OpenPGP backup failed. Check input paths, the full expected fingerprint, certificate validity and exclusive output permissions.");
    process.exitCode = 1;
  }
}
