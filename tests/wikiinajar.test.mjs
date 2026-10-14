/**
 * Wiki in a Jar (HTML5/webxdc rebuild) guards.
 *   node --test tests/wikiinajar.test.mjs
 * The wikitext renderer lives inline in wikiinajar.html between the
 * WIKI-RENDER markers; these tests evaluate that exact block (the same
 * technique as tests/yubnub.test.mjs) so the shipped parser is the tested one.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(path.join(root, "wikiinajar.html"), "utf8");

function renderer() {
  const m = html.match(/\/\*WIKI-RENDER-BEGIN\*\/([\s\S]*?)\/\*WIKI-RENDER-END\*\//);
  assert.ok(m, "renderer block found between WIKI-RENDER markers");
  return new Function(m[1] + "\nreturn { renderWiki, wikiCollectTags, wikiCollectLinks };")();
}
function seeds() {
  const m = html.match(/const SEED_PAGES = (\{[\s\S]*?\n\});/);
  assert.ok(m, "SEED_PAGES literal found");
  return new Function("return " + m[1])();
}
const CTX = {
  exists: (t) => t === "Main Page",
  pageHref: (t) => "#/page/" + encodeURIComponent(t),
  contactHref: () => "#/contacts",
  mediaHref: (n) => (n === "ok.png" ? "data:image/png;base64,AA==" : null),
};

test("app is a single offline file with the webxdc hook", () => {
  assert.match(html, /<script src="\.\/webxdc\.js"><\/script>/);
  assert.doesNotMatch(html, /<(?:script|link)[^>]+(?:src|href)="https?:/i);
  assert.ok(html.includes("npm run build:wikiinajar"), "rebuild command documented in-app");
});

test("seed jar ships the documentation page and its neighbours", () => {
  const pages = seeds();
  for (const title of ["Main Page", "Wiki in a Jar", "Wiki Syntax", "Image Support Demo", "SideBar", "SandBox"]) {
    assert.ok(pages[title], `missing seed page: ${title}`);
  }
  const doc = pages["Wiki in a Jar"];
  assert.ok(doc.includes("java -jar wiki.in.a.jar 3003"), "doc page carries the original launch command");
  assert.ok(doc.includes("[[image:diagram.png|Diagram alt text]]"), "doc page documents image syntax");
  assert.ok(doc.includes("[[djvu:reference.djvu|Read the reference]]"), "doc page documents djvu syntax");
  assert.ok(doc.includes("public/docs/image"), "doc page names the Java media folder");
  assert.ok(pages["Main Page"].includes("[[Wiki in a Jar]]"), "Main Page links the documentation page");
  assert.ok(pages["Image Support Demo"].includes("[[djvu:djvu-smoke.djvu|"), "demo page embeds the smoke DjVu");
});

test("renderer: headings, emphasis, lists, rules, pre", () => {
  const { renderWiki } = renderer();
  const out = renderWiki("== Title ==\n\n'''bold''' and ''ital''\n\n* one\n* two\n\n----\n\n indented", CTX);
  assert.match(out, /<h2>Title<\/h2>/);
  assert.match(out, /<strong>bold<\/strong> and <em>ital<\/em>/);
  assert.match(out, /<ul>\s*<li>one<\/li>\s*<li>two<\/li>\s*<\/ul>/);
  assert.match(out, /<hr \/>/);
  assert.match(out, /<pre>indented<\/pre>/);
});

test("renderer: wiki links distinguish existing and missing pages (0.8 behaviour)", () => {
  const { renderWiki } = renderer();
  const ok = renderWiki("[[Main Page|home]]", CTX);
  assert.match(ok, /href="#\/page\/Main%20Page"/);
  assert.doesNotMatch(ok, /class="missing"/);
  const missing = renderWiki("[[Nowhere Yet]]", CTX);
  assert.match(missing, /class="missing"/);
});

test("renderer: namespaces mirror WikiLink/ImageFilter, incl. error text", () => {
  const { renderWiki } = renderer();
  assert.match(renderWiki("[[image:ok.png|Alt]]", CTX), /<img class="wiki-image" src="data:image\/png/);
  assert.match(renderWiki("[[img:gone.png|Alt]]", CTX), /Missing media:/);
  assert.match(renderWiki("[[djvu:book.djvu|Read]]", CTX), /class="wiki-djvu-embed" data-djvu-media="book\.djvu"/);
  assert.match(renderWiki("[[djvu:book.png|Read]]", CTX), /DjVu links must point to a \.djvu or \.djv file\./);
  assert.match(renderWiki("[[image:notes.txt|N]]", CTX), /Unsupported image type\./);
  assert.match(renderWiki("[[image:../secret.png|S]]", CTX), /safe relative file path/);
  assert.equal(renderWiki("[[tags:a,b]]", CTX), "");
  assert.match(renderWiki("[[bogus:Thing]]", CTX), /\(Unknown namespace: bogus\)/);
  assert.match(renderWiki("<nowiki>[[image:ok.png]]</nowiki>", CTX), /<pre>\[\[image:ok\.png\]\]<\/pre>/);
});

test("renderer: user text cannot inject markup (escape-first)", () => {
  const { renderWiki } = renderer();
  const out = renderWiki('[[image:ok.png|"><script>alert(1)</script>]] and <script>alert(2)</script>', CTX);
  assert.doesNotMatch(out, /<script>/);
  assert.match(out, /&lt;script&gt;/);
});

test("tags and backlink collection read the same wikitext", () => {
  const { wikiCollectTags, wikiCollectLinks } = renderer();
  assert.deepEqual(wikiCollectTags("x [[tags:Demo, guide]] y [[Tags:Extra]]"), ["demo", "extra", "guide"]);
  assert.deepEqual(wikiCollectLinks("[[Main Page]] [[image:a.png]] [[Other Page|label]]"), ["Main Page", "Other Page"]);
});

test("xdc bundle is a zip rooted at index.html + manifest.toml + DjVu reader", () => {
  const bytes = readFileSync(path.join(root, "wikiinajar.xdc"));
  assert.equal(bytes[0], 0x50); // 'P'
  assert.equal(bytes[1], 0x4b); // 'K'
  const names = bytes.toString("latin1");
  for (const entry of ["index.html", "manifest.toml", "webxdc.js", "djvu-rs/djvu_rs.js", "media/djvu-smoke.djvu"]) {
    assert.ok(names.includes(entry), `xdc contains ${entry}`);
  }
  const staged = readFileSync(path.join(root, "public", "apps", "wikiinajar", "index.html"), "utf8");
  assert.equal(staged, html, "staged public/apps/wikiinajar/index.html matches wikiinajar.html");
  assert.match(readFileSync(path.join(root, "public", "apps", "wikiinajar", "manifest.toml"), "utf8"), /name = "Wiki in a Jar"/);
  assert.ok(existsSync(path.join(root, "public", "apps", "wikiinajar", "djvu-rs", "simd128", "djvu_rs_bg.wasm")), "SIMD wasm staged");
});

test("Java edition ships the same documentation as a .wiki page", () => {
  const wiki = readFileSync(path.join(root, "tools", "wikiinajar", "public", "docs", "wiki", "Wiki in a Jar.wiki"), "utf8");
  assert.match(wiki, /== Wiki in a Jar ==/);
  assert.ok(wiki.includes("[[Image Support Demo]]"), "Java doc page links the demo");
  assert.ok(wiki.includes("public/docs/image"), "Java doc page names the media folder");
  assert.ok(wiki.includes("no authentication"), "Java doc page keeps the safety warning");
  const build = readFileSync(path.join(root, "tools", "wikiinajar", "build-image-support.sh"), "utf8");
  assert.ok(build.includes("Wiki in a Jar.wiki"), "Java build ships the documentation page");
});

test("deep dive documents the conversion and links every artifact", () => {
  const dive = readFileSync(path.join(root, "wikiinajar-deep-dive.md"), "utf8");
  for (const needle of ["wikiinajar.html", "wikiinajar.xdc", "tools/wikiinajar", "Wiki in a Jar.wiki", "Continued research"]) {
    assert.ok(dive.includes(needle), `deep dive missing: ${needle}`);
  }
});
