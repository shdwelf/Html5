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
import { PUBLIC_CORPUS_EXCLUDED_SOURCES } from "../tools/wikiinajar/public-corpus-policy.mjs";
import {
  findPrivateBackupPassageSources,
  findUnsafeCloudReferenceSources,
  hasPrivateBackupPassage,
  hasPrivateCloudReference,
} from "../tools/wikiinajar/privacy-preflight.mjs";
import { unzipSync } from "../vendor/fflate/index.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(path.join(root, "wikiinajar.html"), "utf8");

function markdownSources(directory, prefix = "") {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return markdownSources(absolute, relative);
    return entry.isFile() && entry.name.endsWith(".md") ? [relative] : [];
  });
}

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
const PRIVATE_GOOGLE_ITEM_LINK = /https?:\/\/(?:docs|drive|sheets|forms)\.google\.com\/[^\s)<>"']*(?:\/d\/|\/folders\/|[?&]id=)[A-Za-z0-9_-]{15,64}/i;
const PRIVATE_DROPBOX_LINK = /https?:\/\/(?:www\.)?(?:dropbox\.com|dropboxusercontent\.com)\/[^\s)<>"']+/i;

test("cloud privacy preflight catches short Drive IDs and Dropbox item links", () => {
  const fakeDriveId = "fakeDriveId00000000";
  assert.equal(fakeDriveId.length, 19, "synthetic test ID pins the short folder-ID case");
  assert.equal(hasPrivateCloudReference(`Google Drive folder ID: ${fakeDriveId}`), true);
  assert.equal(hasPrivateCloudReference(`https://drive.google.com/drive/folders/${fakeDriveId}`), true);
  assert.equal(hasPrivateCloudReference("https://www.dropbox.com/s/example/private.zip"), true);
  assert.equal(hasPrivateCloudReference("A public Google Drive help page has no item identifier."), false);
  assert.equal(hasPrivateBackupPassage("private backup stored in a cloud account"), true);
  assert.equal(hasPrivateBackupPassage("Google Drive backup archive"), true);
  assert.equal(hasPrivateBackupPassage("A generic backup plan has no storage destination."), false);
});

test("app is a single offline file with the webxdc hook", () => {
  assert.match(html, /<script src="\.\/webxdc\.js"><\/script>/);
  assert.doesNotMatch(html, /<(?:script|link)[^>]+(?:src|href)="https?:/i);
  assert.ok(html.includes("npm run build:wikiinajar"), "rebuild command documented in-app");
});

test("seed jar ships the documentation page and its neighbours", () => {
  const pages = seeds();
  for (const title of ["Main Page", "Wiki in a Jar", "Wiki Syntax", "Image Support Demo", "Sample Files and Vault", "SideBar", "SandBox"]) {
    assert.ok(pages[title], `missing seed page: ${title}`);
  }
  const doc = pages["Wiki in a Jar"];
  assert.ok(doc.includes("java -jar wiki.in.a.jar 3003"), "doc page carries the original launch command");
  assert.ok(doc.includes("[[image:diagram.png|Diagram alt text]]"), "doc page documents image syntax");
  assert.ok(doc.includes("[[djvu:reference.djvu|Read the reference]]"), "doc page documents djvu syntax");
  assert.ok(doc.includes("public/docs/image"), "doc page names the Java media folder");
  assert.ok(pages["Main Page"].includes("[[Wiki in a Jar]]"), "Main Page links the documentation page");
  assert.ok(pages["Main Page"].includes("[[Sample Files and Vault]]"), "Main Page links the sample/vault map");
  assert.ok(pages["SideBar"].includes("[[Sample Files and Vault]]"), "sidebar links the sample/vault map");
  assert.ok(pages["Image Support Demo"].includes("[[djvu:djvu-smoke.djvu|"), "demo page embeds the smoke DjVu");
  const sampleMap = pages["Sample Files and Vault"];
  assert.ok(sampleMap.includes("Private Drive links"), "sample map explains that private backup links are omitted");
  assert.ok(sampleMap.includes("authorized local archive"), "sample map directs private recovery to an authorized local archive");
  assert.doesNotMatch(sampleMap, PRIVATE_GOOGLE_ITEM_LINK);
});

test("renderer: headings, emphasis, lists, rules, pre", () => {
  const { renderWiki } = renderer();
  const out = renderWiki("== Title ==\n\n'''bold''' and ''ital''\n\n* one\n* two\n\n----\n\n indented", CTX);
  assert.match(out, /<h2>Title<\/h2>/);
  assert.match(out, /<b>bold<\/b> and <i>ital<\/i>/);
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
  assert.match(renderWiki("''''both''''", CTX), /<i><b>both<\/b><\/i>/, "'''' -> StrongestFilter <i><b>");
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

test("R6: parseVcards survives real-world .vcf (folding, quoted-printable, itemN., escapes)", () => {
  const m = html.match(/function parseVcards\(text\)\{[\s\S]*?\n\}/);
  assert.ok(m, "parseVcards found in app script");
  const parseVcards = new Function(m[0] + "\nreturn parseVcards;")();
  const fixture = [
    "BEGIN:VCARD\r\nVERSION:2.1\r\n",
    "FN;ENCODING=QUOTED-PRINTABLE;CHARSET=UTF-8:J=C3=BCrgen M=C3=BCller\r\n",
    "item1.EMAIL;TYPE=INTERNET:j@example.org\r\n",
    "TEL;TYPE=CELL,VOICE:+1-555-0100\r\n",
    "ORG:Example\\, Inc.\r\n",
    "BDAY:19700102\r\nEND:VCARD\r\n",
    "BEGIN:VCARD\nVERSION:3.0\nFN:Ada Lovelace\n",
    "NOTE:a folded long line that contin\n ues here\n",
    "BDAY:--12-10\nEND:VCARD\n",
  ].join("");
  const cards = parseVcards(fixture);
  assert.equal(cards.length, 2);
  assert.equal(cards[0].fn, "Jürgen Müller", "QP UTF-8 value decoded");
  assert.equal(cards[0].email, "j@example.org", "itemN. group prefix accepted");
  assert.equal(cards[0].tel, "+1-555-0100", ";TYPE params skipped");
  assert.equal(cards[0].org, "Example, Inc.", "escaped comma unescaped");
  assert.equal(cards[0].bday, "19700102");
  assert.equal(cards[1].fn, "Ada Lovelace");
  assert.equal(cards[1].bday, "--12-10", "no-year birthday kept for wikiParseBday");
});

test("R7 conformance corpus: browser vs 0.8 filter chain, divergences pinned", () => {
  const { renderWiki } = renderer();
  // nested lists: marker count = depth (ListFilter)
  const nested = renderWiki("* a\n** b\n* c", CTX);
  assert.match(nested, /<ul>\s*<li>a<\/li>\s*<ul>\s*<li>b<\/li>\s*<\/ul>\s*<li>c<\/li>\s*<\/ul>/);
  // label may itself contain | (WikiLink splits on the FIRST |, like Java)
  assert.match(renderWiki("[[Main Page|a|b]]", CTX), />a\|b<\/a>/);
  // &amp; reversal before dispatch (WikiLink constructor comment):
  // a plainly-typed & displays as &, a literally-typed &amp; as "&amp;"
  assert.match(renderWiki("[[Main Page|Tom & Jerry]]", CTX), />Tom &amp; Jerry<\/a>/);
  assert.match(renderWiki("[[Main Page|Tom &amp; Jerry]]", CTX), />Tom &amp;amp; Jerry<\/a>/);
  // More-wiki 0.9.8 anchor links target the page, anchor preserved
  assert.match(renderWiki("[[Main Page#Top]]", CTX), /href="#\/page\/Main%20Page#Top"/);
  // unbalanced headings: Java strips leading-run length from BOTH ends,
  // so "== H ===" is an h2 "H =" there — and, by backtracking, here too
  assert.match(renderWiki("== H ===", CTX), /<h2>H =<\/h2>/);
  // mirrored case diverges: Java leaves "=== H ==" raw (trailing run is
  // shorter than the leading run); this renderer still finds an h2
  assert.match(renderWiki("=== H ==", CTX), /<h2>= H<\/h2>/);
  // titles Java forbids as filenames are plain storage keys here
  assert.match(renderWiki("[[a/b]]", CTX), /href="#\/page\/a%2Fb"/);
});

test("R4: three-way merge combines disjoint edits, marks real conflicts", () => {
  const m = html.match(/function wikiTextHash[\s\S]*?function wikiMerge3[\s\S]*?\n\}/);
  assert.ok(m, "merge helpers found in app script");
  const { wikiTextHash, wikiMerge3 } = new Function(m[0] + "\nreturn { wikiTextHash, wikiMerge3 };")();
  const base = "one\ntwo\nthree\nfour\nfive";
  // fast paths
  assert.equal(wikiMerge3(base, base, "one\nTWO\nthree\nfour\nfive").body, "one\nTWO\nthree\nfour\nfive");
  assert.equal(wikiMerge3(base, base, base).conflicts, 0);
  // disjoint line edits combine cleanly
  const merged = wikiMerge3(base, "ONE\ntwo\nthree\nfour\nfive", "one\ntwo\nthree\nfour\nFIVE");
  assert.equal(merged.conflicts, 0);
  assert.equal(merged.body, "ONE\ntwo\nthree\nfour\nFIVE");
  // identical edits on both sides are not a conflict
  assert.equal(wikiMerge3(base, "one\ntwo\n3\nfour\nfive", "one\ntwo\n3\nfour\nfive").conflicts, 0);
  // same-line divergent edits produce visible markers, nothing dropped
  const clash = wikiMerge3(base, "one\nyours\nthree\nfour\nfive", "one\ntheirs\nthree\nfour\nfive");
  assert.equal(clash.conflicts, 1);
  assert.match(clash.body, /<<<<<<< yours \(this device\)\nyours\n=======\ntheirs\n>>>>>>> theirs \(from chat\)/);
  // append-append at the same anchor concatenates instead of conflicting
  const appended = wikiMerge3(base, base + "\nfrom A", base + "\nfrom B");
  assert.equal(appended.conflicts, 0);
  assert.match(appended.body, /five\nfrom A\nfrom B$/);
  // hash is stable and content-sensitive (it names sync base revisions)
  assert.equal(wikiTextHash("abc"), wikiTextHash("abc"));
  assert.notEqual(wikiTextHash("abc"), wikiTextHash("abd"));
  // the wire format carries the base hash, the UI surfaces conflicts
  assert.match(html, /baseHash:wikiTextHash\(prev\?prev\.body:""\)/);
  assert.match(html, /wikiMerge3\(base,cur\.body,p\.body\)/);
  assert.match(html, /⚠ sync /);
});

test("R4: two-client sync simulation converges (shipped wikiApplySync)", () => {
  const m = html.match(/function wikiTextHash[\s\S]*?function wikiApplySync[\s\S]*?\n\}/);
  assert.ok(m, "sync helpers found in app script");
  const { wikiTextHash, wikiApplySync } = new Function(m[0] + "\nreturn { wikiTextHash, wikiApplySync };")();
  // sender side mirrors savePage: the update names the revision it edited
  const send = (jar, title, body, updated) => {
    const prev = jar[title];
    jar[title] = { body, updated, history: prev ? [...(prev.history || []), { body: prev.body, updated: prev.updated }].slice(-10) : [] };
    return { type: "page", title, body, updated, baseUpdated: prev ? prev.updated : "", baseHash: wikiTextHash(prev ? prev.body : "") };
  };
  const seedJar = () => ({ Notes: { body: "l1\nl2\nl3", updated: "t0", history: [] } });
  // disjoint concurrent edits converge byte-identically, no conflict
  const A = seedJar(), B = seedJar();
  const uA = send(A, "Notes", "L1\nl2\nl3", "t1");
  const uB = send(B, "Notes", "l1\nl2\nL3", "t1");
  wikiApplySync(A, uB, "t2"); wikiApplySync(B, uA, "t2");
  assert.equal(A.Notes.body, "L1\nl2\nL3");
  assert.equal(B.Notes.body, A.Notes.body);
  assert.ok(!A.Notes.conflict && !B.Notes.conflict);
  // same-line concurrent edits: both devices keep BOTH texts, flagged
  const C = seedJar(), D = seedJar();
  const uC = send(C, "Notes", "l1\nfrom C\nl3", "t1");
  const uD = send(D, "Notes", "l1\nfrom D\nl3", "t1");
  wikiApplySync(C, uD, "t2"); wikiApplySync(D, uC, "t2");
  for (const jar of [C, D]) {
    assert.equal(jar.Notes.conflict, "merge");
    assert.ok(jar.Notes.body.includes("from C") && jar.Notes.body.includes("from D"), "no edit lost");
    assert.ok(jar.Notes.history.some((h) => h.body.includes("l2")), "pre-merge body in history");
  }
  // a delete older than a local edit loses; the page survives, flagged
  const E = seedJar();
  send(E, "Notes", "l1\nedited\nl3", "t5");
  wikiApplySync(E, { type: "delete", title: "Notes", updated: "t4" }, "t6");
  assert.ok(!E.Notes.deleted && E.Notes.conflict === "delete");
  // a newer delete wins but keeps the body recoverable in history
  wikiApplySync(E, { type: "delete", title: "Notes", updated: "t9" }, "t9");
  assert.ok(E.Notes.deleted && E.Notes.history.some((h) => h.body.includes("edited")));
});

test("R8: print stylesheet flattens the jar; seeds are plain .wiki files", () => {
  const print = html.match(/@media print\{([\s\S]*?)\n\}/);
  assert.ok(print, "@media print block present");
  for (const needle of ["header.top", "aside.rail", "nav.tabs", "[hidden]", "background:#fff", "break-after:avoid"]) {
    assert.ok(print[1].includes(needle), "print CSS covers " + needle);
  }
  // the round-trip contract with the Java original is the .wiki file:
  // every seed title must be a legal 0.8 filename (WikiLink forbids
  // \ * / : ? " < > |) and every body plain text
  const pages = seeds();
  for (const [title, body] of Object.entries(pages)) {
    assert.doesNotMatch(title, /[\\\/:*?"<>|]/, "seed title not Java-safe: " + title);
    assert.equal(typeof body, "string");
    assert.ok(!body.includes("\u0000"), "seed body not plain text: " + title);
  }
});

test("CSS Zen Garden: fifty credited styles and a dice roll", () => {
  const m = html.match(/const ZEN_STYLES=\[([\s\S]*?)\n\];/);
  assert.ok(m, "ZEN_STYLES catalogue found");
  const styles = new Function("return [" + m[1] + "]")();
  assert.equal(styles.length, 50, "exactly fifty Zen Garden styles");
  assert.equal(new Set(styles.map((style) => style.id)).size, 50, "style ids are unique");
  assert.deepEqual(styles.slice(0, 3).map((style) => style.id), [221, 220, 219]);
  assert.equal(styles.at(-1).id, 170);
  for (const style of styles) {
    assert.ok(style.title && style.by, "style has title and designer credit");
    for (const field of ["bg", "panel", "ink", "acc", "acc2"]) assert.match(style[field], /^#[0-9a-f]{6}$/i, style.title + " " + field);
    assert.ok(Number.isInteger(style.look) && style.look >= 0 && style.look < 10, "style has a layout/typography look");
  }
  const picker = html.match(/function pickRandomZenStyle\([\s\S]*?\n\}/);
  assert.ok(picker, "random style picker found");
  const pickRandomZenStyle = new Function("ZEN_STYLES", picker[0] + "\nreturn pickRandomZenStyle;")(styles);
  assert.equal(pickRandomZenStyle("221", () => 0), "220", "dice cannot immediately repeat the current style");
  assert.equal(pickRandomZenStyle("", () => 0.999999), "170");
  for (const needle of ["zenStyleSelect", "btnRandomStyle", "zenStyleCredit", "wikiinajar.style.v1", "https://csszengarden.com/", "initZenStyles();", "rollZenStyle"]) {
    assert.ok(html.includes(needle), "style switcher includes " + needle);
  }
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
  assert.ok(wiki.includes("[[Sample Files and Vault]]"), "Java doc page links the sample/vault map");
  const sampleMap = readFileSync(path.join(root, "tools", "wikiinajar", "public", "docs", "wiki", "Sample Files and Vault.wiki"), "utf8");
  assert.ok(sampleMap.includes("Private Drive links"), "classic wiki omits private backup links and inventories");
  assert.ok(sampleMap.includes("authorized local archive"), "classic wiki directs private recovery to an authorized local archive");
  assert.doesNotMatch(sampleMap, PRIVATE_GOOGLE_ITEM_LINK);
  const wikiSourceDir = path.join(root, "tools", "wikiinajar", "public", "docs", "wiki");
  for (const name of readdirSync(wikiSourceDir).filter((file) => file.endsWith(".wiki"))) {
    const source = readFileSync(path.join(wikiSourceDir, name), "utf8");
    assert.doesNotMatch(source, PRIVATE_GOOGLE_ITEM_LINK, `${name} must not contain private Google item links`);
  }
  const build = readFileSync(path.join(root, "tools", "wikiinajar", "build-image-support.sh"), "utf8");
  assert.ok(build.includes('public/docs/wiki/*.wiki'), "Java build ships every wiki page, including the documentation page");
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

test("bundled documentation applies the public-corpus privacy exclusions", () => {
  const eligibleSources = new Set([
    ...readdirSync(root).filter((f) => f.endsWith(".md")),
    ...readdirSync(path.join(root, "docs")).filter((f) => f.endsWith(".md")).map((f) => `docs/${f}`),
  ]);
  const allMarkdownSources = new Set([
    ...readdirSync(root).filter((f) => f.endsWith(".md")),
    ...markdownSources(path.join(root, "docs"), "docs"),
  ]);
  for (const source of PUBLIC_CORPUS_EXCLUDED_SOURCES) {
    assert.ok(allMarkdownSources.has(source), `privacy exclusion must still point at a Markdown source: ${source}`);
  }
  const excludedFromWiki = PUBLIC_CORPUS_EXCLUDED_SOURCES.filter((source) => eligibleSources.has(source)).length;
  const expectedCount = eligibleSources.size - excludedFromWiki;
  const staged = JSON.parse(readFileSync(path.join(root, "public", "apps", "wikiinajar", "docs.json"), "utf8"));
  assert.equal(staged.format, "wikiinajar-docs");
  assert.equal(staged.count, expectedCount, "one page per approved .md file");
  assert.equal(staged.pages.length, staged.count);
  const sources = new Set(staged.pages.map((page) => page.source));
  for (const source of PUBLIC_CORPUS_EXCLUDED_SOURCES) {
    assert.ok(!sources.has(source), `${source} must not be copied into the public Wiki corpus`);
  }
  const bundledDocs = JSON.stringify(staged.pages);
  assert.doesNotMatch(bundledDocs, PRIVATE_GOOGLE_ITEM_LINK, "private Google Drive item links must not be copied into bundled documentation");
  assert.doesNotMatch(bundledDocs, PRIVATE_DROPBOX_LINK, "private Dropbox links must not be copied into bundled documentation");
  const privacyInputs = staged.pages.map((page) => ({ source: page.source, markdown: `${page.title}\n${page.body}` }));
  assert.deepEqual(findUnsafeCloudReferenceSources(privacyInputs), []);
  assert.deepEqual(findPrivateBackupPassageSources(privacyInputs), []);
  for (const page of staged.pages) {
    assert.equal(
      hasPrivateCloudReference(`${page.title}\n${page.body}`),
      false,
      `${page.source} has no contextual Drive ID or private cloud link`,
    );
  }
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
  assert.ok(
    Buffer.from(bundle["docs.json"]).equals(readFileSync(path.join(root, "public", "apps", "wikiinajar", "docs.json"))),
    "the XDC carries the same privacy-filtered corpus as the staged tree",
  );
  assert.ok(html.includes("./docs.json") && html.includes('#/docs'), "app loads docs.json and routes the Docs view");
  assert.doesNotMatch(html, PRIVATE_GOOGLE_ITEM_LINK, "private Google Drive item links must not be embedded in the public app");
  assert.ok(seeds()["Documentation"], "fresh jars seed a Documentation guide page");
});

test("deep dive documents the conversion and links every artifact", () => {
  const dive = readFileSync(path.join(root, "wikiinajar-deep-dive.md"), "utf8");
  for (const needle of ["wikiinajar.html", "wikiinajar.xdc", "tools/wikiinajar", "Wiki in a Jar.wiki", "Continued research"]) {
    assert.ok(dive.includes(needle), `deep dive missing: ${needle}`);
  }
});
