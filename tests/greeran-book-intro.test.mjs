import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const html = readFileSync(new URL("../greeran-book.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../css/greeran-book.css", import.meta.url), "utf8");
const script = readFileSync(new URL("../js/greeran-book-intro.js", import.meta.url), "utf8");

function boot() {
  const dom = new JSDOM(html, {
    runScripts: "dangerously",
    url: "https://example.test/greeran-book.html",
    pretendToBeVisual: true,
    beforeParse(window) {
      window.matchMedia = () => ({ matches: true });
      window.HTMLElement.prototype.scrollIntoView = () => undefined;
    },
  });
  dom.window.eval(script);
  return dom;
}

test("the Greeran book opening is original, local, skippable, and replayable", () => {
  assert.match(html, /id="bookIntro"[^>]*aria-modal="true"/);
  assert.match(html, /id="skipBookIntro"/);
  assert.match(html, /id="replayBookIntro"[^>]*aria-controls="bookIntro"/);
  assert.match(html, /src="\.\/js\/greeran-book-intro\.js"/);
  assert.match(css, /@keyframes intro-book-flight/);
  assert.match(css, /@keyframes intro-cover-open/);
  assert.match(css, /\.intro-book-cover\s*\{[^}]*backface-visibility:\s*hidden/s,
    "the cover must not show mirrored lettering on its reverse side");
  assert.match(css, /\.intro-book-cover > \*\s*\{[^}]*backface-visibility:\s*hidden/s,
    "cover lettering stays hidden when the cover flips open");
  assert.match(css, /translate3d\(0,0,95px\) scale\(1\)/,
    "the open spread remains centered after the flight");
  assert.match(css, /prefers-reduced-motion: reduce/);
  const dom = new JSDOM(html);
  try {
    assert.equal(dom.window.document.querySelector("#bookIntro img[src^='http']"), null,
      "the intro uses original CSS artwork instead of external images");
  } finally { dom.window.close(); }
});

test("reduced-motion users skip autoplay but can replay and dismiss the opening", async () => {
  const dom = boot();
  const { document } = dom.window;
  try {
    const intro = document.getElementById("bookIntro");
    const header = document.querySelector(".studio-bar");
    assert.equal(intro.hidden, true, "reduced-motion preference suppresses auto-play");

    document.getElementById("replayBookIntro").click();
    assert.equal(intro.hidden, false);
    assert.ok(intro.classList.contains("is-playing"));
    assert.equal(document.body.classList.contains("book-intro-active"), true);
    assert.equal(header.getAttribute("aria-hidden"), "true");

    document.getElementById("skipBookIntro").click();
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.equal(intro.hidden, true);
    assert.equal(document.body.classList.contains("book-intro-active"), false);
    assert.equal(header.hasAttribute("aria-hidden"), false, "page accessibility is restored after dismissal");
  } finally {
    dom.window.close();
  }
});
