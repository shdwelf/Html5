/**
 * Wiki in a Jar (HTML5/webxdc rebuild) guards.
 *   node --test tests/wikiinajar.test.mjs
 * The wikitext renderer lives inline in wikiinajar.html between the
 * WIKI-RENDER markers; these tests evaluate that exact block (the same
 * technique as tests/yubnub.test.mjs) so the shipped parser is the tested one.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { buildDocs, convertMarkdown } from "../tools/wikiinajar/md2wiki.mjs";
import { unzipSync } from "../vendor/fflate/index.mjs";

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

test("renderer: 0.8 conformance — strongest emphasis, =h1=, mediawiki tables, ftp, dated titles", () => {
  const { renderWiki, wikiTitleDate, wikiEventTags, wikiParseBday } = new Function(
    html.match(/\/\*WIKI-RENDER-BEGIN\*\/([\s\S]*?)\/\*WIKI-RENDER-END\*\//)[1]
    + "\nreturn { renderWiki, wikiTitleDate, wikiEventTags, wikiParseBday };",
  )();
  assert.match(renderWiki("''''both''''", CTX), /<em><strong>both<\/strong><\/em>/, "'''' -> StrongestFilter <i><b>");
  assert.match(renderWiki("= Top =", CTX), /<h1>Top<\/h1>/, "= H = is an h1 in HeadingFilter");
  assert.match(renderWiki("- dash item", CTX), /<ul>\s*<li>dash item<\/li>\s*<\/ul>/, "ListFilter accepts - bullets");
  const table = renderWiki("{|\n|-\n! Name\n! Kind\n|-\n| jar\n| wiki\n|}", CTX);
  assert.match(table, /<th>Name<\/th>/);
  assert.match(table, /<td>jar<\/td>/);
  assert.match(renderWiki("see ftp://example.org/f", CTX), /href="ftp:\/\/example\.org\/f"/, "UrlFilter links ftp:// too");
  assert.match(renderWiki("one<br/>two", CTX), /one<br\/>two/, "BreakFilter: literal <br/> stays a break");
  assert.doesNotMatch(renderWiki("<div>x</div>", CTX), /<div>/, "non-allowlisted tags stay escaped");
  assert.deepEqual(wikiTitleDate("2026-11-05 Dentist"), { y: 2026, m: 11, d: 5, key: "2026-11-05" });
  assert.equal(wikiTitleDate("Dentist on 2026-13-40"), null, "impossible dates are not due dates");
  assert.equal(wikiTitleDate("No date here"), null);
  assert.deepEqual(wikiEventTags("2026-11-05 Dentist"), ["november", "2026"], "0.8 auto-tags: month + year");
  assert.deepEqual(wikiParseBday("1970-01-02"), { y: 1970, m: 1, d: 2 });
  assert.deepEqual(wikiParseBday("19700102"), { y: 1970, m: 1, d: 2 }, "yyyyMMdd accepted, as in DateUtils");
  assert.equal(wikiParseBday("Jan 2"), null);
});

test("calendar in the app uses title-dates + birthdays (0.8 Month.loadEvents)", () => {
  assert.ok(html.includes("function calendarEvents(y,m)"), "month-at-a-time event loader present");
  assert.ok(html.includes("wikiTitleDate(t)"), "events come from page titles");
  assert.doesNotMatch(html, /Date:\\s\*\(\\d\{4\}/, "the old body-line Date: adaptation is gone");
  assert.ok(html.includes("Month.loadEvents()"), "view documents its primary source");
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

test("md2wiki converts the constructs this corpus actually uses", () => {
  const linkMap = new Map([["docs/other.md", "Other Page"]]);
  const wiki = convertMarkdown(
    "# Title\n\nSome **bold** and *ital* and `code()`.\n\n- one\n  - nested\n1. first\n\n```sh\necho hi # not a heading\n```\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\nSee [the other doc](other.md) and [a file](../src/app.js) and [web](https://example.org).",
    "docs/here.md",
    linkMap,
  );
  assert.match(wiki, /== Title ==/);
  assert.match(wiki, /'''bold''' and ''ital'' and `code\(\)`/);
  assert.match(wiki, /^\* one$/m);
  assert.match(wiki, /^\*\* nested$/m);
  assert.match(wiki, /^# first$/m);
  assert.match(wiki, /^ echo hi # not a heading$/m, "fence content becomes indented pre, markers untouched");
  assert.doesNotMatch(wiki, /```/);
  assert.match(wiki, /^\| A \| B \|$/m);
  assert.doesNotMatch(wiki, /\|---\|/, "table separator row dropped");
  assert.match(wiki, /\[\[Other Page\|the other doc\]\]/, "corpus .md links become wiki links");
  assert.match(wiki, /\[\[https:\/\/example\.org\|web\]\]/, "remote links stay links");
  const docs = buildDocs([
    { source: "b.md", markdown: "# Same\n\nBody B." },
    { source: "a.md", markdown: "# Same\n\nBody A links [B](b.md)." },
  ]);
  assert.equal(docs.length, 2);
  assert.notEqual(docs[0].title, docs[1].title, "duplicate H1 titles are disambiguated");
  assert.ok(docs.every((d) => d.body.includes("[[tags:documentation,")), "every converted page is footered + tagged");
});

test("renderer: md2wiki code spans render as <code>, contents stay literal", () => {
  const { renderWiki } = renderer();
  const out = renderWiki("Run `npm run build:wikiinajar` — not `'''inside code'''`", CTX);
  assert.match(out, /<code>npm run build:wikiinajar<\/code>/);
  assert.match(out, /<code>'''inside code'''<\/code>/, "markup inside backticks stays literal");
  assert.doesNotMatch(out, /<strong>/);
});

test("bundled documentation: one converted page per root/docs *.md", () => {
  const rootMd = readdirSync(root).filter((f) => f.endsWith(".md")).length;
  const docsMd = readdirSync(path.join(root, "docs")).filter((f) => f.endsWith(".md")).length;
  const staged = JSON.parse(readFileSync(path.join(root, "public", "apps", "wikiinajar", "docs.json"), "utf8"));
  assert.equal(staged.format, "wikiinajar-docs");
  assert.equal(staged.count, rootMd + docsMd, "one page per .md file");
  assert.equal(staged.pages.length, staged.count);
  const titles = new Set(staged.pages.map((p) => p.title.toLowerCase()));
  assert.equal(titles.size, staged.pages.length, "page titles are unique");
  for (const page of staged.pages) {
    assert.match(page.source, /\.md$/, "page records its source");
    assert.ok(page.body.includes("[[tags:documentation,"), `${page.source}: footer tags present`);
    assert.ok(page.body.includes("Bundled documentation — converted from `" + page.source + "`"), `${page.source}: provenance footer`);
    assert.ok(!page.body.includes("```"), `${page.source}: no fences survive conversion`);
  }
  const dive = staged.pages.find((p) => p.source === "wikiinajar-deep-dive.md");
  assert.ok(dive, "this deep dive is itself a bundled page");
  assert.ok(staged.pages.some((p) => p.body.includes("[[" ) && p.body.includes("image and DjVu support")), "cross-document wiki links were generated");
  // the .xdc carries the same corpus the staged tree advertises
  const bundle = unzipSync(new Uint8Array(readFileSync(path.join(root, "wikiinajar.xdc"))));
  assert.ok(bundle["docs.json"], "xdc contains docs.json");
  const inBundle = JSON.parse(new TextDecoder().decode(bundle["docs.json"]));
  assert.equal(inBundle.count, staged.count, "bundled docs.json matches staged docs.json");
  assert.ok(html.includes("./docs.json") && html.includes('#/docs'), "app loads docs.json and routes the Docs view");
  assert.ok(seeds()["Documentation"], "fresh jars seed a Documentation guide page");
});

test("deep dive documents the conversion and links every artifact", () => {
  const dive = readFileSync(path.join(root, "wikiinajar-deep-dive.md"), "utf8");
  for (const needle of ["wikiinajar.html", "wikiinajar.xdc", "tools/wikiinajar", "Wiki in a Jar.wiki", "Continued research"]) {
    assert.ok(dive.includes(needle), `deep dive missing: ${needle}`);
  }
});
