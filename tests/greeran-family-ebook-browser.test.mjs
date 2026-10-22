import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { unzipSync } from "fflate";
import { browserDeps, withBrowser } from "./lib-browser.mjs";

function serveXdc() {
  const xdcPath = new URL("../greeran-family-4dwm.xdc", import.meta.url);
  const files = unzipSync(new Uint8Array(readFileSync(xdcPath)));
  const server = createServer((request, response) => {
    const name = decodeURIComponent((request.url ?? "/").split("?")[0]).replace(/^\/+/, "") || "index.html";
    const content = files[name];
    if (!content) {
      response.writeHead(404, { "content-type": "text/plain" }).end("not found");
      return;
    }
    const type = name.endsWith(".html") ? "text/html; charset=utf-8"
      : name.endsWith(".json") ? "application/json"
        : name.endsWith(".png") ? "image/png" : "application/octet-stream";
    response.writeHead(200, { "content-type": type, "cache-control": "no-store" });
    response.end(Buffer.from(content));
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port })));
}

const deps = await browserDeps();

test("Greeran inside-cover eBook and GEDCOM snapshot run from local assets", {
  skip: deps ? false : "Puppeteer/Chromium optional browser dependencies are not installed",
}, async () => {
  const { server, port } = await serveXdc();
  try {
    await withBrowser(deps, async (browser) => {
      const page = await browser.newPage();
      await page.setViewport({ width: 1365, height: 900 });
      const pageErrors = [];
      const requests = [];
      page.on("pageerror", (error) => pageErrors.push(error.message));
      page.on("request", (request) => requests.push(request.url()));

      await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle0" });
      await page.evaluate(() => sw("book"));
      await page.waitForFunction(
        () => document.querySelector("#bible-book")?.options.length === 66,
        { timeout: 15_000 },
      );

      const reader = await page.evaluate(() => ({
        status: document.querySelector("#bible-status").textContent,
        firstVerse: document.querySelector("#bible-text").innerText,
        bookCount: document.querySelector("#bible-book").options.length,
      }));
      assert.match(reader.status, /Loaded offline · 66 books · 1,189 chapters · 31,098 verses/);
      assert.equal(reader.bookCount, 66);
      assert.match(reader.firstVerse, /In the beginning, God created the heavens and the earth/);

      await page.evaluate(() => openBiblePassage("Genesis", 5));
      assert.match(await page.$eval("#bible-text", (element) => element.innerText), /Genesis 5/);
      await page.evaluate(() => {
        document.querySelector("#bible-search").value = "Noah";
        searchBibleText();
      });
      const search = await page.evaluate(() => ({
        status: document.querySelector("#bible-status").textContent,
        count: document.querySelector("#bible-results").children.length,
      }));
      assert.match(search.status, /match/);
      assert.ok(search.count > 0);

      const gedcom = await page.evaluate(() => buildGreeranGedcom());
      assert.match(gedcom, /^0 HEAD\r\n/);
      assert.match(gedcom, /2 VERS 5\.5\.1/);
      assert.equal((gedcom.match(/^0 .* INDI$/gm) ?? []).length, 2_089);
      assert.equal((gedcom.match(/^0 .* FAM$/gm) ?? []).length, 588);
      assert.match(gedcom, /No standalone source GEDCOM was available/);
      assert.ok(gedcom.split(/\r?\n/).every((line) => line.length <= 255));
      assert.doesNotMatch(gedcom, /^\d+ (?:LATI|LONG) /m);
      assert.match(gedcom, /0 TRLR\r\n$/);

      assert.ok(requests.length > 0);
      assert.ok(requests.every((url) => url.startsWith(`http://127.0.0.1:${port}/`)));
      assert.deepEqual(pageErrors, []);
      await page.close();
    });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
