import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync, execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createScreen, feed, plainText, CP437_HIGH } from "../js/ansi-model.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BANNER = path.join(root, "tools/bbs/wildcat-banner.mjs");
const VIEWER = path.join(root, "public/apps/bbs-viewer/index.html");

/**
 * The netcat capture path, end to end.
 *
 * This sandbox cannot reach any live BBS -- DNS for arbitrary hosts fails and
 * the outbound allowlist does not include one -- but loopback works. So a
 * Wildcat!-flavoured screen is served locally and captured with the same tool,
 * nc, that would be used against a real system. The capture path is exercised
 * for real; only the destination is local.
 */

const hasNc = spawnSync("nc", ["-h"], { encoding: "utf8" }).status !== null
  || spawnSync("which", ["nc"]).status === 0;

function serveThenCapture(port) {
  return new Promise((resolve, reject) => {
    const server = spawn(process.execPath, [BANNER, "--serve", String(port)], {
      cwd: root, stdio: ["ignore", "pipe", "pipe"],
    });
    let ready = false;
    server.stdout.on("data", (d) => {
      if (ready || !/listening/.test(String(d))) return;
      ready = true;
      const cap = spawnSync("nc", ["127.0.0.1", String(port)], {
        encoding: "buffer", timeout: 8000, maxBuffer: 1 << 20,
      });
      server.kill();
      if (cap.error) reject(cap.error);
      else resolve(cap.stdout);
    });
    server.stderr.on("data", () => {});
    server.on("error", reject);
    setTimeout(() => { server.kill(); reject(new Error("server never reported listening")); }, 8000);
  });
}

test("netcat is present, or these capture tests are skipped", (t) => {
  if (!hasNc) t.skip("nc not installed");
  assert.ok(hasNc);
});

test("a BBS screen can be served and captured with netcat", async (t) => {
  if (!hasNc) t.skip("nc not installed");
  const bytes = await serveThenCapture(6431);
  assert.ok(bytes.length > 100, `capture was only ${bytes.length} bytes`);
  // The wire carries CP437, so the box corner must be the raw byte, not UTF-8.
  assert.ok(bytes.includes(0xc9), "expected CP437 0xC9 (top-left corner) on the wire");
  assert.ok(bytes.includes(0xcd), "expected CP437 0xCD (double horizontal) on the wire");
  assert.ok(!Buffer.from(bytes).toString("latin1").includes("\u2554"),
    "the wire must not contain a UTF-8 box character");
});

test("the capture renders as the screen the BBS sent", async (t) => {
  if (!hasNc) t.skip("nc not installed");
  const bytes = await serveThenCapture(6432);
  const s = feed(createScreen(), new Uint8Array(bytes), { cp437: CP437_HIGH });
  const text = plainText(s);
  assert.match(text, /W I L D C A T !   B B S/);
  assert.match(text, /\[M\]essage bases\s+\[F\]ile areas/);
  assert.match(text, /Select>/);
  assert.ok(s.written > 200, `only ${s.written} chars rendered`);
  assert.ok(s.sequences >= 8, `only ${s.sequences} CSI sequences parsed`);
});

test("the box borders line up, which they did not when padding was counted by eye", async (t) => {
  if (!hasNc) t.skip("nc not installed");
  const bytes = await serveThenCapture(6433);
  const s = feed(createScreen(), new Uint8Array(bytes), { cp437: CP437_HIGH });
  const rows = plainText(s).replace(/\s+$/, "").split("\n").slice(0, 4);
  assert.equal(new Set(rows.map((r) => r.length)).size, 1,
    `border rows differ in width: ${rows.map((r) => r.length).join(", ")}`);
  assert.match(rows[0], /^\u2554\u2550+\u2557$/);
  assert.match(rows[3], /^\u255a\u2550+\u255d$/);
});

test("the capture is byte-stable between runs", async (t) => {
  if (!hasNc) t.skip("nc not installed");
  const a = await serveThenCapture(6434);
  const b = await serveThenCapture(6435);
  assert.equal(Buffer.compare(a, b), 0, "the same screen must produce identical bytes");
});

test("the CP437 table covers the whole upper half and maps the box glyphs", () => {
  assert.equal(CP437_HIGH.length, 128, "0x80-0xFF is 128 entries");
  assert.ok(CP437_HIGH.every((g) => typeof g === "string" && g.length >= 1));
  assert.equal(CP437_HIGH[0xc9 - 0x80], "\u2554", "0xC9 is top-left double corner");
  assert.equal(CP437_HIGH[0xcd - 0x80], "\u2550", "0xCD is double horizontal");
  assert.equal(CP437_HIGH[0xba - 0x80], "\u2551", "0xBA is double vertical");
  assert.equal(CP437_HIGH[0xdb - 0x80], "\u2588", "0xDB is full block");
  assert.equal(CP437_HIGH[0xfa - 0x80], "\u00b7", "0xFA is the interpunct, not a bullet");
});

test("reading a CP437 capture as latin-1 would mangle it, which is the point", () => {
  const wire = new Uint8Array([0xc9, 0xcd, 0xbb]);
  const wrong = Buffer.from(wire).toString("latin1");
  const right = plainText(feed(createScreen({ cols: 10, rows: 2 }), wire, { cp437: CP437_HIGH }));
  assert.equal(wrong, "\u00c9\u00cd\u00bb", "latin-1 gives accented letters");
  assert.equal(right.trim(), "\u2554\u2550\u2557", "CP437 gives box art");
  assert.notEqual(wrong, right);
});

test("the viewer imports the model rather than reimplementing it", () => {
  const html = readFileSync(VIEWER, "utf8");
  const m = html.match(/import \{([^}]+)\}\s*from "([^"]*ansi-model\.js)"/);
  assert.ok(m, "the viewer must import js/ansi-model.js");
  const names = m[1].split(",").map((s) => s.trim()).filter(Boolean);
  assert.ok(names.length >= 3, `expected several imports, got ${names.join(", ")}`);
});

test("the viewer's imports all exist, so the page cannot fail at load", async () => {
  const html = readFileSync(VIEWER, "utf8");
  const names = html.match(/import \{([^}]+)\}\s*from "[^"]*ansi-model\.js"/)[1]
    .split(",").map((s) => s.trim()).filter(Boolean);
  const mod = await import("../js/ansi-model.js");
  for (const n of names) assert.ok(n in mod, `ansi-model does not export ${n}`);
});

test("the viewer holds no palette of its own", () => {
  // Duplicating the SGR colours in the page is how a viewer drifts from the
  // model it is supposed to be showing.
  const html = readFileSync(VIEWER, "utf8");
  const script = html.split("<script")[1];
  assert.doesNotMatch(script, /\bmagenta\b/, "the page must not restate the palette");
  assert.doesNotMatch(script, /CP437\s*=\s*\[/, "the page must not restate the CP437 table");
});

test("nothing generated here is tracked", () => {
  const tracked = execFileSync("git", ["ls-files", "dist/"], { cwd: root, encoding: "utf8" }).trim();
  assert.equal(tracked, "");
});
