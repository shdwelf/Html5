import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { unzipSync } from "fflate";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function archiveMember(zipPath, basename) {
  const files = unzipSync(readFileSync(path.join(root, zipPath)));
  const member = Object.keys(files).find((name) => path.posix.basename(name).toLowerCase() === basename.toLowerCase());
  assert.ok(member, `${basename} exists in ${zipPath}`);
  return files[member];
}

function triage(bytes, name) {
  const dir = mkdtempSync(path.join(os.tmpdir(), "game-triage-"));
  try {
    const file = path.join(dir, name);
    writeFileSync(file, bytes);
    return execFileSync("python3", ["tools/game_triage.py", file], {
      cwd: root,
      encoding: "utf8",
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("game triage rejects an LE-looking overlay in the Duke 3D installer", () => {
  const install = archiveMember("samples/archive/games/3dduke13SW.zip", "INSTALL.EXE");
  assert.notEqual(Buffer.from(install).indexOf(Buffer.from("LE\0\0")), -1,
    "the fixture contains a decoy LE signature that must not classify the installer");

  const report = triage(install, "INSTALL.EXE");
  assert.match(report, /family : MZ \(plain real-mode\)/);
  assert.match(report, /2444 relocations/);
  assert.doesNotMatch(report, /MZ stub \+ LE|MZ stub \+ LX/);
});

test("structural LE validation still recognizes the DOOM and Heretic DOS/4GW images", () => {
  const fixtures = [
    ["samples/archive/games/doom-sw.zip", "doom.exe", /pages=82 x 4096 bytes, 2 objects/],
    ["samples/archive/games/heretic-sw.zip", "HERETIC.EXE", /pages=114 x 4096 bytes, 3 objects/],
  ];
  for (const [zipPath, name, shape] of fixtures) {
    const report = triage(archiveMember(zipPath, name), name);
    assert.match(report, /family : MZ stub \+ LE \(32-bit protected mode\)/);
    assert.match(report, shape);
    assert.match(report, /cpu=80386/);
  }
});

test("Duke Nukem 3D's 0xFFF0 PKLITE sample remains correctly identified", () => {
  const payload = archiveMember("samples/archive/games/3dduke13SW.zip", "DN3DSW13.SHR");
  const report = triage(payload, "DN3DSW13.SHR");
  assert.match(report, /family : MZ \+ PKLITE/);
  assert.match(report, /e_cs=0xFFF0/);
});
