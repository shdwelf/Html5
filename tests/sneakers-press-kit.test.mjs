// The Sneakers Press Kit is an installable Webxdc deliverable. Validate the
// archive users receive, not only the source tree used to build it.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { unzipSync } from "../vendor/fflate/index.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const decoder = new TextDecoder();
const engineFiles = [
  "js-dos.js", "js-dos.css", "emulators.js", "wdosbox.js",
  "wdosbox.wasm", "wlibzip.js", "wlibzip.wasm",
];

function text(files, name) {
  assert.ok(files[name], `archive is missing ${name}`);
  return decoder.decode(files[name]);
}

function read(relative) {
  return readFileSync(path.join(root, relative));
}

test("Sneakers Press Kit XDC is a self-contained js-dos v8 Webxdc", () => {
  const archive = unzipSync(read("sneakers-press-kit.xdc"));
  for (const name of [
    "README.md", "index.html", "manifest.toml", "webxdc.js", "icon.png",
    "roms/SNEAKERS.jsdos",
    ...engineFiles.map((name) => `js-dos/${name}`),
  ]) assert.ok(archive[name], `sneakers-press-kit.xdc is missing ${name}`);

  assert.equal(text(archive, "index.html"), read("webxdc-sneakers/app/index.html").toString("utf8"));
  assert.equal(text(archive, "manifest.toml"), read("webxdc-sneakers/app/manifest.toml").toString("utf8"));
  assert.equal(text(archive, "webxdc.js"), read("webxdc-sneakers/app/webxdc.js").toString("utf8"));
  assert.equal(text(archive, "README.md"), read("webxdc-sneakers/README.md").toString("utf8"));

  const html = text(archive, "index.html");
  assert.match(html, /url:\s*"roms\/SNEAKERS\.jsdos"/);
  assert.match(html, /pathPrefix:\s*"js-dos\/"/);
  assert.match(html, /noCloud:\s*true/);
  assert.doesNotMatch(html, /dosInstance\.run\(/, "v7 js-dos API should not be used");
  assert.doesNotMatch(html, /<script\b[^>]*\bsrc\s*=\s*["']https?:/i, "runtime script references must stay local");
  assert.match(html, /not a byte-for-byte copy/i);
  assert.match(html, /retrogames\.pro\//);
  assert.match(html, /archive\.org\/details\/Sneakers_Film_Promotional_Floppy/);
  assert.match(html, /ebay\.com\/itm\/365528826482/);

  const manifest = text(archive, "manifest.toml");
  assert.match(manifest, /^name = "Sneakers Press Kit \(DOS·1992\)"/);
  assert.match(manifest, /source_code_url = "https:\/\/github\.com\/shdwelf\/Html5"/);

  for (const name of engineFiles) {
    assert.deepEqual(
      Buffer.from(archive[`js-dos/${name}`]),
      read(`webxdc-dos/public/js-dos/${name}`),
      `packed js-dos/${name} differs from the vendored runtime`,
    );
  }

  const icon = Buffer.from(archive["icon.png"]);
  assert.deepEqual(Array.from(icon.slice(0, 8)), [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(icon.readUInt32BE(16), 256);
  assert.equal(icon.readUInt32BE(20), 256);

  // The payload is intentionally the checked-in reconstructed subset; the
  // much larger original floppy and distribution ZIP are not mislabeled as
  // part of this Webxdc.
  assert.ok(!Object.keys(archive).some((name) => /(?:^|\/)sneakers\.img$|Promotional_Diskette\.zip/i.test(name)));
  assert.match(text(archive, "README.md"), /not the original Universal City Studios executable/i);
});

test("embedded Sneakers bundle has a valid MZ executable and RUN.BAT autoexec", () => {
  const archive = unzipSync(read("sneakers-press-kit.xdc"));
  const game = unzipSync(archive["roms/SNEAKERS.jsdos"]);
  const exe = game["SNEAKERS.EXE"];
  assert.ok(exe, "local bundle is missing SNEAKERS.EXE");
  assert.equal(exe[0], 0x4d);
  assert.equal(exe[1], 0x5a);
  const lastPageBytes = exe[2] | (exe[3] << 8);
  const pages = exe[4] | (exe[5] << 8);
  assert.equal(lastPageBytes ? (pages - 1) * 512 + lastPageBytes : pages * 512, exe.length);
  assert.match(decoder.decode(game["RUN.BAT"]), /SNEAKERS\.EXE/i);
  const conf = decoder.decode(game[".jsdos/dosbox.conf"]);
  const autoexec = conf.split(/^\[autoexec\]\s*$/im)[1] ?? "";
  assert.match(autoexec, /^mount\s+c\s+\./im);
  assert.equal(autoexec.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).at(-1).toUpperCase(), "RUN.BAT");
});

test("Sneakers XDC rebuild is deterministic and the checked-in deliverable is current", () => {
  const result = spawnSync(process.execPath, ["scripts/build-sneakers-press-kit-xdc.mjs", "--check"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /sneakers-press-kit\.xdc is current/);
});
