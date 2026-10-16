import assert from "node:assert/strict";
import test from "node:test";
import { browserDeps, serve, withBrowser } from "./lib-browser.mjs";

const deps = await browserDeps();

test("Greeran intro opens an unmirrored, centered spread on desktop and mobile", {
  skip: deps ? false : "Puppeteer/Chromium optional browser dependencies are not installed",
}, async () => {
  const { server, port } = await serve();
  try {
    await withBrowser(deps, async (browser) => {
      for (const [width, height] of [[1440, 900], [390, 844]]) {
        const page = await browser.newPage();
        await page.setViewport({ width, height });
        const pageErrors = [];
        page.on("pageerror", (error) => pageErrors.push(error.message));
        await page.goto(`http://127.0.0.1:${port}/greeran-book.html`, { waitUntil: "domcontentloaded" });
        await page.waitForFunction(
          () => document.querySelector("#bookIntro.is-playing:not([hidden])"),
          { timeout: 5_000 },
        );
        const result = await page.evaluate(() => {
          const object = document.querySelector(".intro-book-object");
          const cover = document.querySelector(".intro-book-cover");
          object.getAnimations().forEach((animation) => {
            animation.pause();
            animation.currentTime = 5300;
          });
          cover.getAnimations().forEach((animation) => {
            animation.pause();
            animation.currentTime = 4700;
          });
          const rect = document.querySelector(".intro-book-spread").getBoundingClientRect();
          return {
            introVisible: !document.querySelector("#bookIntro").hidden,
            left: rect.left,
            right: rect.right,
            center: (rect.left + rect.right) / 2,
            width: rect.width,
            coverBackface: getComputedStyle(cover).backfaceVisibility,
          };
        });
        assert.equal(result.introVisible, true);
        assert.equal(result.coverBackface, "hidden");
        assert.ok(result.left >= -1, `${width}px spread begins on-screen at ${result.left}`);
        assert.ok(result.right <= width + 1, `${width}px spread ends on-screen at ${result.right}`);
        assert.ok(Math.abs(result.center - width / 2) <= 3, `${width}px spread center is ${result.center}`);
        assert.deepEqual(pageErrors, []);
        await page.close();
      }
    });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
