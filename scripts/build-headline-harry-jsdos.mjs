// Deterministically build the inner js-dos archive from the installer's clean
// Headline Harry files. Raw floppy executables (ff 4d 5a) are intentionally
// rejected; the game bundle boots MAP.EXE directly to skip the intro stall.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { zipSync } from "../vendor/fflate/index.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const gameDir = path.join(root, ".xfer", "harry", "installed");
const output = path.join(root, "webxdc-headline-harry", "app", "roms", "headline-harry.jsdos");

for (const name of ["INTRO.EXE", "MAP.EXE"]) {
  let executable;
  try {
    executable = readFileSync(path.join(gameDir, name));
  } catch {
    throw new Error(`missing installer-recovered ${path.relative(root, path.join(gameDir, name))}`);
  }
  if (executable[0] !== 0x4d || executable[1] !== 0x5a) {
    throw new Error(`${name} is not a clean MZ executable; refusing to package packed floppy data`);
  }
}

const dosboxConf = `[jsdos]
# js-dos bundle for Headline Harry and The Great Paper Race (1991, DOS)
[cpu]
core=auto
cputype=auto
cycles=auto

[mixer]
rate=22050

[sblaster]
sbtype=sb16

[speaker]
pcspeaker=true

[autoexec]
mount c .
c:
MAP.EXE
`;

const files = {};
for (const entry of readdirSync(gameDir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
  if (!entry.isFile()) continue;
  const name = entry.name;
  files[name] = new Uint8Array(readFileSync(path.join(gameDir, name)));
}
files[".jsdos/"] = new Uint8Array();
files[".jsdos/dosbox.conf"] = new TextEncoder().encode(dosboxConf);

// Stable timestamps, ordering, and compression keep repeated builds byte-identical.
const fixedDate = new Date("2026-10-04T00:00:00Z");
const ordered = {};
for (const name of Object.keys(files).sort()) {
  ordered[name] = [files[name], { level: 9, mtime: fixedDate }];
}
const zipped = zipSync(ordered);
writeFileSync(output, zipped);
console.log(`built ${path.relative(root, output)}: ${zipped.length} bytes, ${Object.keys(files).length} entries`);
console.log(`sha256 ${createHash("sha256").update(zipped).digest("hex")}`);
