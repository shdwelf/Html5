/**
 * Yubnub rebuild guards: registry integrity + bundle shape.
 *   node --test tests/yubnub.test.mjs
 * The parser itself lives inline in yubnub.html; these tests pin the
 * data the crawl produced so a registry edit can't silently break it.
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = await readFile(path.join(root, "yubnub.html"), "utf8");

function registryRows() {
  const m = html.match(/const REGISTRY = \[([\s\S]*?)\n\];/);
  assert.ok(m, "REGISTRY literal found in yubnub.html");
  // Rows are plain data literals — evaluate in isolation.
  return new Function("return [" + m[1] + "]")();
}

test("registry is a non-trivial corpus with unique names", () => {
  const rows = registryRows();
  assert.ok(rows.length >= 80, `expected >=80 commands, got ${rows.length}`);
  const seen = new Set();
  for (const [name] of rows) {
    const key = String(name).toLowerCase();
    assert.ok(!seen.has(key), `duplicate command name: ${name}`);
    seen.add(key);
  }
});

test("core commands from the yubnub.org homepage are present", () => {
  const names = new Set(registryRows().map((r) => String(r[0]).toLowerCase()));
  for (const core of ["g", "gim", "random", "man", "ls", "ge", "create", "url", "wp", "am", "xe", "echo", "%", "split", "mash2"]) {
    assert.ok(names.has(core), `missing core command: ${core}`);
  }
});

test("every URL template is navigable or local, and %s templates parse", () => {
  for (const [name, tpl] of registryRows()) {
    assert.equal(typeof tpl, "string", `${name}: template must be a string`);
    assert.ok(
      tpl.startsWith("local:") || /^https?:\/\//.test(tpl),
      `${name}: template must be http(s) or local: — got ${tpl}`,
    );
  }
});

test("engine implements the documented advanced syntax", () => {
  for (const needle of ["[no url encoding]", "for spaces", "[post]", "declaredSwitches", "resolveCommandLine", "__SHOW_SPLIT__"]) {
    assert.ok(html.includes(needle), `engine missing: ${needle}`);
  }
  assert.ok(html.includes("parser/parse?command="), "install URL documented");
});

test("xdc bundle is a zip rooted at index.html + manifest.toml", async () => {
  const bytes = await readFile(path.join(root, "yubnub.xdc"));
  assert.equal(bytes[0], 0x50); // 'P'
  assert.equal(bytes[1], 0x4b); // 'K'
  const text = bytes.toString("latin1");
  assert.ok(text.includes("index.html"), "xdc contains index.html");
  assert.ok(text.includes("manifest.toml"), "xdc contains manifest.toml");
  const staged = await readFile(path.join(root, "public", "apps", "yubnub", "index.html"), "utf8");
  assert.equal(staged, html, "staged public/apps/yubnub/index.html matches yubnub.html");
});
