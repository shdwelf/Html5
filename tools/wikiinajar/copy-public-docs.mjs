#!/usr/bin/env node
/**
 * Copy the reviewed public Markdown/asset tree into a distributable app while
 * honoring the same source exclusions as Wiki in a Jar. The copy is refused
 * if any included Markdown contains a likely private Drive/Dropbox reference.
 */
import { copyFile, mkdir, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PUBLIC_CORPUS_EXCLUDED_SOURCES } from "./public-corpus-policy.mjs";
import { findUnsafeCloudReferenceSources, findPrivateBackupPassageSources } from "./privacy-preflight.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const sourceRoot = path.join(root, "docs");
const destination = process.argv[2];
if (!destination) {
  console.error("usage: node tools/wikiinajar/copy-public-docs.mjs <destination>");
  process.exit(2);
}
const destinationRoot = path.resolve(destination);
const excluded = new Set(PUBLIC_CORPUS_EXCLUDED_SOURCES.filter((name) => name.startsWith("docs/")));

async function collect(directory, relative = "docs") {
  const files = [];
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const sourcePath = path.join(directory, entry.name);
    const relativePath = `${relative}/${entry.name}`;
    if (entry.isDirectory()) files.push(...await collect(sourcePath, relativePath));
    else if (entry.isFile() && !excluded.has(relativePath)) files.push({ sourcePath, relativePath });
  }
  return files;
}

const files = await collect(sourceRoot);
const markdown = await Promise.all(files
  .filter(({ relativePath }) => relativePath.endsWith(".md"))
  .map(async ({ sourcePath, relativePath }) => ({ source: relativePath, markdown: await readFile(sourcePath, "utf8") })));
const unsafe = [...new Set([
  ...findUnsafeCloudReferenceSources(markdown),
  ...findPrivateBackupPassageSources(markdown),
])];
if (unsafe.length) {
  throw new Error(`refusing to copy private cloud/archive references from: ${unsafe.join(", ")}`);
}

await mkdir(destinationRoot, { recursive: true });
for (const { sourcePath, relativePath } of files) {
  const target = path.join(destinationRoot, relativePath.slice("docs/".length));
  await mkdir(path.dirname(target), { recursive: true });
  await copyFile(sourcePath, target);
}
console.log(`Copied ${files.length} public docs assets (${excluded.size} private/personal Markdown sources excluded).`);
