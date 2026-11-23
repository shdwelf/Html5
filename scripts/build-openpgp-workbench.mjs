#!/usr/bin/env node
/** Build the static, offline OpenPGP Workbench app and locally vendor OpenPGP.js. */

import { copyFile, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildLargeRsaWorker } from "./openpgp-large-rsa-build.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = path.join(root, "apps", "openpgp-workbench");
const outputDir = path.join(root, "public", "apps", "openpgp-workbench");
const packageDir = path.join(root, "node_modules", "openpgp");
const expectedVersion = "6.3.3";

const libraryPackage = JSON.parse(await readFile(path.join(packageDir, "package.json"), "utf8"));
if (libraryPackage.version !== expectedVersion) {
  throw new Error(`Expected openpgp@${expectedVersion}; found ${libraryPackage.version ?? "unknown"}.`);
}

const largeWorker = await buildLargeRsaWorker(); // Fail closed before changing shipped assets.

await rm(outputDir, { recursive: true, force: true });
await mkdir(path.join(outputDir, "vendor"), { recursive: true });
for (const name of ["index.html", "app.js", "crypto.mjs", "keyring.mjs", "large-rsa.mjs", "styles.css", "THIRD_PARTY_NOTICES.md"]) {
  await copyFile(path.join(sourceDir, name), path.join(outputDir, name));
}
await copyFile(path.join(packageDir, "dist", "openpgp.min.mjs"), path.join(outputDir, "vendor", "openpgp.min.mjs"));
await copyFile(path.join(packageDir, "LICENSE"), path.join(outputDir, "vendor", "openpgp.LICENSE"));

await writeFile(path.join(outputDir, "large-rsa-worker.bundle.mjs"), largeWorker.compact);
await writeFile(path.join(outputDir, "vendor", "openpgp-large-rsa-worker.source.mjs"), largeWorker.readable);
await writeFile(path.join(outputDir, "vendor", "large-rsa-build.json"), JSON.stringify(largeWorker.metadata, null, 2) + "\n");

const bundle = path.join(outputDir, "vendor", "openpgp.min.mjs");
const bundleBytes = (await stat(bundle)).size;
console.log(`OpenPGP Workbench built at public/apps/openpgp-workbench/`);
console.log(`  OpenPGP.js ${expectedVersion} browser bundle: ${bundleBytes.toLocaleString()} bytes`);
console.log(`  Explicit >8192-bit worker: ${largeWorker.metadata.compactBytes.toLocaleString()} bytes; readable source and pinned build receipt included.`);
