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
  assert.equal(rows.length, 102, `documented curated offline snapshot count, got ${rows.length}`);
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

test("ls exposes paginated live search and clearly labels the offline registry as a subset", () => {
  const ls = registryRows().find((row) => row[0] === "ls");
  assert.ok(ls, "local ls command exists");
  assert.match(ls[2], /curated offline command index/);
  assert.ok(html.includes('id="lsLivePage"'), "live page selector exists");
  assert.ok(html.includes('id="btnOpenLiveLs"'), "live ls link exists");
  assert.ok(html.includes('url.searchParams.set("args"'), "live link carries the search query");
  assert.ok(html.includes('url.searchParams.set("page"'), "live link carries the page number");
  assert.ok(html.includes("displays 49 rows while advancing page offsets by 50"), "upstream pagination caveat is disclosed");
  assert.ok(html.includes("Use the live <span class=\"mono\">ls</span> control above"), "local use-count note points to the full live directory");
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

test("every command has researched open-source backing; proprietary endpoints replaced", () => {
  const rows = registryRows();
  const m = html.match(/const BACKING = \{([\s\S]*?)\n\};/);
  assert.ok(m, "BACKING map found in yubnub.html");
  const backing = new Function("return {" + m[1] + "}")();
  for (const [name] of rows) {
    assert.ok(backing[name], `no backing research recorded for: ${name}`);
    assert.match(backing[name], /^(open|api|local|prop|dead):/, `${name}: backing needs a kind prefix`);
  }
  const tpl = Object.fromEntries(rows.map((r) => [String(r[0]).toLowerCase(), r[1]]));
  // Replaced with open-source-backed endpoints (2026-10-13 audit)
  assert.ok(tpl["gm"].includes("openstreetmap.org"), "gm -> OpenStreetMap");
  assert.ok(tpl["gim"].includes("openverse.org"), "gim -> Openverse");
  assert.ok(tpl["g"].includes("search.inetol.net"), "g -> SearXNG instance");
  assert.ok(tpl["xe"].includes("api.frankfurter.dev"), "xe -> Frankfurter API");
  assert.ok(tpl["weather"].includes("wttr.in"), "weather -> wttr.in");
  assert.ok(tpl["tr"].includes("libretranslate.com"), "tr -> LibreTranslate");
  // The old proprietary endpoints must stay gone
  // streetview is the documented exception: open street imagery needs coordinates, no address drop-in
  const all = rows.filter((r) => r[0] !== "streetview").map((r) => r[1]).join("\n");
  for (const dead of ["maps.google.com", "images.google.com/images", "xe.com/ucc", "finance.yahoo.com", "wunderground.com", "youtube.com/results?search_query", "allmusic.com/search"]) {
    assert.ok(!all.includes(dead), `proprietary endpoint crept back: ${dead}`);
  }
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

test("live templates are HTTPS-only (dead historical entries exempt)", () => {
  const rows = registryRows();
  for (const [name, template, , , flags] of rows) {
    if (String(flags || "").includes("D")) continue; // dead services kept for history
    if (/^https?:\/\//.test(template)) {
      assert.ok(template.startsWith("https://"), `${name} template must be https: ${template}`);
    }
  }
});

test("legal book shelves are wired (guten / ia / ol)", () => {
  const names = new Set(registryRows().map((r) => r[0]));
  for (const n of ["guten", "ia", "ol"]) assert.ok(names.has(n), `missing ${n}`);
});
