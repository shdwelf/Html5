import assert from "node:assert/strict";
import { browserDeps, serve, withBrowser } from "./lib-browser.mjs";

const deps = await browserDeps();
if (!deps) {
  console.log("SKIP: install puppeteer-core and @sparticuz/chromium for browser checks.");
  process.exit(0);
}
const { server, port } = await serve();
try {
  await withBrowser(deps, async (browser) => {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto(`http://127.0.0.1:${port}/public/apps/cyberchef/index.html`, { waitUntil: "networkidle0" });
    await page.waitForFunction(() => typeof window.bwipjs?.toSVG === "function");

    await page.evaluate(async () => {
      const op = OPERATIONS.find((candidate) => candidate.id === "aztecCode");
      recipe.length = 0;
      const item = { uid: ++opIdCounter, op, args: {} };
      op.args.forEach((arg) => { item.args[arg.key] = arg.default; });
      item.args.txt = "AZTEC 123";
      item.args.ec = "23";
      recipe.push(item);
      await bake();
    });
    let preview = await page.$eval("#preview img", (image) => ({ src: image.src, complete: image.complete }));
    assert.match(preview.src, /^data:image\/svg\+xml;charset=utf-8,/);
    assert.equal(preview.complete, true);

    await page.evaluate(async () => {
      const op = OPERATIONS.find((candidate) => candidate.id === "averyLabels");
      recipe.length = 0;
      const item = { uid: ++opIdCounter, op, args: {} };
      op.args.forEach((arg) => { item.args[arg.key] = arg.default; });
      Object.assign(item.args, {
        tpl: "5392", sym: "aztec", aztecEc: "23", vals: "SITE-K|WIKI-IN-A-JAR", copies: "1", showText: false,
      });
      recipe.push(item);
      await bake();
    });
    preview = await page.$eval("#preview img", (image) => ({ src: image.src, complete: image.complete }));
    assert.match(preview.src, /^data:image\/svg\+xml;charset=utf-8,/);
    assert.equal(preview.complete, true);
    const labelCount = await page.evaluate(() => {
      const svg = decodeURIComponent(document.querySelector("#preview img").src.split(",")[1]);
      return (svg.match(/<svg x=/g) || []).length;
    });
    assert.equal(labelCount, 2, "two printable Aztec symbols are in the Avery 5392 sheet");
    const decodedLabels = await page.evaluate(async () => {
      const source = document.querySelector("#preview img").src;
      const svg = decodeURIComponent(source.slice(source.indexOf(",") + 1));
      const labels = [...svg.matchAll(/<svg x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/g)];
      const image = new Image();
      image.src = source;
      await image.decode();
      const scale = 4;
      const sheet = document.createElement("canvas");
      sheet.width = image.naturalWidth * scale;
      sheet.height = image.naturalHeight * scale;
      const sheetContext = sheet.getContext("2d");
      sheetContext.fillStyle = "#fff";
      sheetContext.fillRect(0, 0, sheet.width, sheet.height);
      sheetContext.drawImage(image, 0, 0, sheet.width, sheet.height);
      const decoded = [];
      for (const match of labels) {
        const x = Number(match[1]) * scale;
        const y = Number(match[2]) * scale;
        const width = Number(match[3]) * scale;
        const height = Number(match[4]) * scale;
        const crop = document.createElement("canvas");
        crop.width = Math.ceil(width);
        crop.height = Math.ceil(height);
        const context = crop.getContext("2d");
        context.fillStyle = "#fff";
        context.fillRect(0, 0, crop.width, crop.height);
        context.drawImage(sheet, Math.floor(x), Math.floor(y), crop.width, crop.height, 0, 0, crop.width, crop.height);
        const bytes = Uint8Array.from(atob(crop.toDataURL("image/png").split(",")[1]), (character) => character.charCodeAt(0));
        let bin = "";
        for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
        window.FILE_INPUT = { name: "avery-aztec-label.png", size: bytes.length, type: "image/png", bin };
        document.getElementById("input").value = "";
        const op = OPERATIONS.find((candidate) => candidate.id === "aztecDecode");
        recipe.length = 0;
        const item = { uid: ++opIdCounter, op, args: {} };
        op.args.forEach((arg) => { item.args[arg.key] = arg.default; });
        item.args.source = "file";
        recipe.push(item);
        await bake();
        const error = document.getElementById("out-error");
        if (error.style.display !== "none") throw new Error(error.textContent);
        decoded.push(document.getElementById("output").value);
      }
      return decoded;
    });
    assert.equal(decodedLabels.length, 2);
    assert.match(decodedLabels[0], /Payload:\nSITE-K/);
    assert.match(decodedLabels[1], /Payload:\nWIKI-IN-A-JAR/);

    await page.evaluate(async () => {
      // The preceding image-decode case loaded a file-backed source. Clear it so
      // this distinct CueCat regression exercises the scanner text, not PNG bytes.
      window.FILE_INPUT = null;
      document.getElementById("input").readOnly = false;
      document.getElementById("input").value = ".C3nZC3nZC3nZE3r0Chr3CNnY.cGf2.ENr7C3n1C3PWD3rYCxzYChnZ.";
      const op = OPERATIONS.find((candidate) => candidate.id === "cuecatDecode");
      recipe.length = 0;
      const item = { uid: ++opIdCounter, op, args: {} };
      op.args.forEach((arg) => { item.args[arg.key] = arg.default; });
      item.args.format = "full";
      recipe.push(item);
      await bake();
    });
    const decoded = await page.$eval("#output", (element) => element.value);
    assert.match(decoded, /Type: IB5/);
    assert.match(decoded, /Code: 978006093471251300/);
    assert.deepEqual(errors, []);
    console.log("PASS: Chromium rendered Aztec, decoded both Avery 5392 image labels with bundled ZXing, and kept CueCat scan decoding distinct.");
    await page.close();
  });
} finally {
  await new Promise((resolve) => server.close(resolve));
}
