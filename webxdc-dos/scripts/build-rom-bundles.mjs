/**
 * Generate the pre-built js-dos v8 bundles under public/roms/.
 *
 * js-dos v8 does not auto-run plain ZIPs: a bundle is a ZIP that carries the
 * game files plus a `.jsdos/dosbox.conf` whose [autoexec] section mounts the
 * bundle as C: and starts the program.  `DOSDEMO.ZIP` and `SNEAKERS.ZIP` are
 * plain archives (analysis artifacts), so the runnable versions ship as
 * `DOSDEMO.jsdos` / `SNEAKERS.jsdos`, wrapped here with the same
 * dosbox.conf conventions as the headline-harry bundle.
 *
 * Deterministic: fixed mtime, sorted entries, so rebuilding is byte-stable
 * and tests can assert freshness.
 *
 *   node scripts/build-rom-bundles.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { unzipSync, zipSync } from "../../vendor/fflate/index.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const roms = path.join(root, "public", "roms");
const FIXED_DATE = new Date("2026-10-04T00:00:00Z");

const dosboxConf = (comment, autoexec) =>
  `[jsdos]\n# ${comment}\n` +
  "[cpu]\ncore=auto\ncputype=auto\ncycles=auto\n\n" +
  "[mixer]\nrate=22050\n\n[sblaster]\nsbtype=sb16\n\n[speaker]\npcspeaker=true\n\n" +
  "[autoexec]\nmount c .\nc:\n" +
  autoexec.map((line) => `${line}\n`).join("");

function buildBundle(sourceZip, comment, autoexec) {
  const entries = unzipSync(readFileSync(path.join(roms, sourceZip)));
  const files = {};
  for (const name of Object.keys(entries).sort()) {
    if (name.endsWith("/")) continue; // drop dir entries; zipSync re-adds paths
    files[name] = entries[name];
  }
  files[".jsdos/dosbox.conf"] = new TextEncoder().encode(dosboxConf(comment, autoexec));
  const ordered = {};
  for (const name of Object.keys(files).sort()) {
    ordered[name] = [files[name], { level: 9, mtime: FIXED_DATE }];
  }
  return zipSync(ordered);
}

const bundles = [
  {
    out: "DOSDEMO.jsdos",
    source: "DOSDEMO.ZIP",
    comment: "js-dos bundle — DOS demo COM file (webxdc-dos Run Demo)",
    autoexec: ["DEMO.COM"],
  },
  {
    out: "SNEAKERS.jsdos",
    source: "SNEAKERS.ZIP",
    comment: "js-dos bundle — SNEAKERS.EXE password gate (webxdc-dos)",
    autoexec: ["RUN.BAT"],
  },
];

for (const b of bundles) {
  const zipped = buildBundle(b.source, b.comment, b.autoexec);
  const out = path.join(roms, b.out);
  writeFileSync(out, zipped);
  const sha = createHash("sha256").update(zipped).digest("hex");
  console.log(`${b.out}: ${zipped.length} bytes, sha256 ${sha.slice(0, 16)}…`);
}
