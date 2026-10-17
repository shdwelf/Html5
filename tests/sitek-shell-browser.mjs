import assert from "node:assert/strict";
import { browserDeps, withBrowser } from "./lib-browser.mjs";

const deps = await browserDeps();
if (!deps) {
  console.log("SKIP: install puppeteer-core and @sparticuz/chromium for browser checks.");
  process.exit(0);
}
const base = process.argv[2] || "http://127.0.0.1:8099/";

await withBrowser(deps, async (browser) => {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.setViewport({ width: 1280, height: 900 });

  await page.goto(`${base}index.html#enso`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.body.dataset.mode === "enso" && document.body.dataset.shellView === "frame");
  await page.waitForFunction(() => document.querySelector("#keyframe")?.getAttribute("src") === "./art-studio.html");
  let frameMetrics = await page.$eval("#keyframe", (frame) => {
    const rect = frame.getBoundingClientRect();
    return { display: getComputedStyle(frame).display, width: rect.width, height: rect.height, src: frame.getAttribute("src") };
  });
  assert.equal(frameMetrics.display, "block");
  assert.ok(frameMetrics.width >= 1279);
  assert.ok(frameMetrics.height >= 899);
  assert.equal(frameMetrics.src, "./art-studio.html");
  let child = await (await page.$("#keyframe")).contentFrame();
  await child.waitForFunction(() => {
    const canvas = document.querySelector("#ensoCanvas");
    return canvas && canvas.width > 100 && canvas.height > 100;
  }, { timeout: 30_000 });
  const ensoPixels = await child.$eval("#ensoCanvas", (canvas) => {
    const data = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
    let lit = 0;
    for (let i = 0; i < data.length; i += 16) if (data[i] + data[i + 1] + data[i + 2] > 45) lit += 1;
    return { width: canvas.width, height: canvas.height, lit };
  });
  assert.ok(ensoPixels.width > 100 && ensoPixels.height > 100 && ensoPixels.lit > 1000,
    "the Enso Forge canvas is actually rendered, not merely present in the iframe");
  await child.click("#studioSample");
  await child.waitForFunction(() => document.querySelector("#studioStatus")?.textContent.includes("VALID MNEMONIC"));
  await child.evaluate(() => window.scrollTo(0, 0));
  await child.click("#mintTab");
  await child.waitForFunction(() => {
    const canvas = document.querySelector("#mintCanvas");
    return canvas && canvas.width > 100 && canvas.height > 100;
  }, { timeout: 15_000 });
  const mintCard = await child.$eval("#mintCanvas", (canvas) => {
    const rect = canvas.getBoundingClientRect();
    const data = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
    let lit = 0;
    for (let i = 0; i < data.length; i += 16) if (data[i] + data[i + 1] + data[i + 2] > 45) lit += 1;
    return { width: canvas.width, height: canvas.height, cssWidth: rect.width, lit };
  });
  assert.ok(mintCard.width > 100 && mintCard.height > 100 && mintCard.cssWidth > 100 && mintCard.lit > 1000,
    "the Art Studio mint-card canvas must have visible dimensions and rendered pixels");

  await page.goto(`${base}index.html#ghidra`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.body.dataset.mode === "ghidra" && document.body.dataset.shellView === "frame");
  await page.waitForFunction(() => document.querySelector("#keyframe")?.getAttribute("src") === "./ghidra-lab.html");
  frameMetrics = await page.$eval("#keyframe", (frame) => ({
    display: getComputedStyle(frame).display,
    src: frame.getAttribute("src"),
  }));
  assert.equal(frameMetrics.display, "block");
  assert.equal(frameMetrics.src, "./ghidra-lab.html");
  child = await (await page.$("#keyframe")).contentFrame();
  await child.waitForFunction(() => document.querySelector("#engineChip")?.textContent.includes("ready"), { timeout: 120_000 });
  assert.match(await child.$eval("#engineLog", (element) => element.textContent), /ready · 11 languages/);

  await page.goto(`${base}index.html#flash`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.body.dataset.mode === "flash" && document.body.dataset.shellView === "frame");
  await page.waitForFunction(() => document.querySelector("#keyframe")?.getAttribute("src") === "./flash-decompiler.html");
  frameMetrics = await page.$eval("#keyframe", (frame) => ({ display: getComputedStyle(frame).display, src: frame.getAttribute("src") }));
  assert.equal(frameMetrics.display, "block");
  assert.equal(frameMetrics.src, "./flash-decompiler.html");

  await page.goto(`${base}index.html#grid`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.body.dataset.mode === "grid");
  const dockHrefs = await page.$$eval(".app-dock a", (links) => links.map((link) => link.getAttribute("href")));
  assert.ok(dockHrefs.includes("./casefiles.html"), "CASEFILES remains a page link, not #undefined");
  assert.ok(dockHrefs.includes("./4dwm-ports.html"), "4DWM directory remains a page link");
  assert.ok(dockHrefs.includes("./apps/cyberchef/"), "CyberChef remains a page link");

  await page.goto(`${base}4dwm-ports.html`, { waitUntil: "domcontentloaded" });
  assert.equal(await page.$eval("h1", (element) => element.textContent), "4DWM PORTS");
  assert.equal(await page.$$eval("nav.ports a.port", (links) => links.length), 12);
  assert.deepEqual(pageErrors, []);
  console.log("PASS: Enso, Ghidra, and Flash iframes are visible; Ghidra WASM reaches ready; dock links stay routable; 4DWM directory opens.");
  await page.close();
});
