#!/usr/bin/env node
/**
 * Build the ANC Studio utility CSS locally so its packaged Android/Webxdc
 * page has no Tailwind CDN or Google Fonts dependency. The extensionless
 * standalone source page is mirrored with a sibling stylesheet link.
 *
 *   node scripts/build-anc-studio-css.mjs
 *   node scripts/build-anc-studio-css.mjs --check
 */
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const input = path.join(root, "apps", "anc-studio-tailwind.input.css");
const publicHtml = path.join(root, "public", "apps", "anc-studio", "index.html");
const mirroredHtml = path.join(root, "apps", "anc-studio-ultra-html5-active-noise-control-lab");
const outputs = [
  path.join(root, "public", "apps", "anc-studio", "tailwind.css"),
  path.join(root, "apps", "anc-studio-tailwind.css"),
];
const cli = path.join(root, "node_modules", ".bin", "tailwindcss");
const checkOnly = process.argv.includes("--check");

if (!(await stat(cli).catch(() => null))?.isFile()) {
  throw new Error("Tailwind CLI is not installed; run npm ci before building ANC Studio CSS.");
}
if (!(await stat(input).catch(() => null))?.isFile()) throw new Error("ANC Studio Tailwind input is missing.");

const tempDir = await mkdtemp(path.join(os.tmpdir(), "anc-studio-tailwind-"));
try {
  const generated = path.join(tempDir, "tailwind.css");
  execFileSync(cli, ["-i", input, "-o", generated, "--minify"], { cwd: root, stdio: "inherit" });
  const bytes = await readFile(generated);
  if (bytes.length < 20_000) throw new Error(`Tailwind output is unexpectedly small (${bytes.length} bytes).`);

  const canonicalHtml = await readFile(publicHtml, "utf8");
  const relativeCss = canonicalHtml.replaceAll('href="./tailwind.css"', 'href="./anc-studio-tailwind.css"');
  if (relativeCss === canonicalHtml) throw new Error("ANC Studio page has no local Tailwind stylesheet link to mirror.");

  if (checkOnly) {
    for (const output of outputs) {
      const current = await readFile(output).catch(() => null);
      if (!current || !current.equals(bytes)) {
        throw new Error(`Generated ANC stylesheet is stale: ${path.relative(root, output)} (run npm run build:anc-studio).`);
      }
    }
    const sourceHtml = await readFile(mirroredHtml, "utf8").catch(() => null);
    if (sourceHtml !== relativeCss) {
      throw new Error("ANC standalone HTML mirror is stale (run npm run build:anc-studio).");
    }
    console.log(`ANC Studio CSS and standalone HTML mirror are current (${bytes.length.toLocaleString("en-US")} CSS bytes).`);
  } else {
    for (const output of outputs) {
      await mkdir(path.dirname(output), { recursive: true });
      await writeFile(output, bytes);
    }
    await writeFile(mirroredHtml, relativeCss);
    console.log(`Built and synchronized ANC Studio CSS (${bytes.length.toLocaleString("en-US")} bytes) and standalone HTML mirror.`);
  }
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
