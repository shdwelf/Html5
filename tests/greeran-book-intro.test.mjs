import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const html = readFileSync(new URL('../greeran-book.html', import.meta.url), 'utf8');
const script = readFileSync(new URL('../js/greeran-book.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/greeran-book.css', import.meta.url), 'utf8');

function createBook(storageSeen = false) {
  const dom = new JSDOM(html, {
    url: 'https://book.test/greeran-book.html',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  dom.window.matchMedia = () => ({ matches: false });
  if (storageSeen) dom.window.localStorage.setItem('greeran-book-intro-seen-v1', 'seen');
  dom.window.eval(script);
  return dom;
}

test('first visit plays the opening and the skip control closes it accessibly', (t) => {
  const dom = createBook();
  t.after(() => dom.window.close());
  const { document, localStorage } = dom.window;
  const intro = document.getElementById('bookIntro');
  const skip = document.getElementById('introSkip');

  assert.equal(intro.hidden, false);
  assert.ok(document.body.classList.contains('intro-active'));
  assert.equal(document.activeElement, skip);
  assert.equal(skip.textContent, 'Skip to the book');
  skip.click();
  assert.ok(intro.classList.contains('is-closing'));
  assert.equal(localStorage.getItem('greeran-book-intro-seen-v1'), 'seen');
});

test('seen opening can be replayed, and reduced-motion support is present', (t) => {
  const dom = createBook(true);
  t.after(() => dom.window.close());
  const { document } = dom.window;
  const intro = document.getElementById('bookIntro');

  assert.equal(intro.hidden, true);
  document.getElementById('replayIntro').click();
  assert.equal(intro.hidden, false);
  assert.ok(intro.classList.contains('is-playing'));
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /@keyframes\s+intro-flight/);
  assert.match(html, /aria-modal="true"/);
  assert.match(html, /id="introSkip"/);
});
