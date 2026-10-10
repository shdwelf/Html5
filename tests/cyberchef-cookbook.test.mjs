// The cookbook documents the CyberChef kitchen's recipes in prose. Nothing
// checked those numbers against the code, so a stale figure could sit there
// indefinitely. These tests boot the kitchen, compute each documented value,
// and fail if the page disagrees.
//
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const cookbookHtml = readFileSync(new URL("../public/apps/cookbook/index.html", import.meta.url), "utf8");
const kitchenHtml = readFileSync(new URL("../public/apps/cyberchef/index.html", import.meta.url), "utf8");

function bootKitchen() {
  return new JSDOM(kitchenHtml, {
    runScripts: "dangerously",
    url: "https://example.test/apps/cyberchef/",
    pretendToBeVisual: true,
    beforeParse(window) {
      window.alert = () => undefined;
      window.confirm = () => false;
      window.prompt = () => null;
      window.HTMLCanvasElement.prototype.getContext = () => null;
    },
  });
}

/** The visible text of one cookbook section, whitespace-collapsed. */
function sectionText(id) {
  const dom = new JSDOM(cookbookHtml);
  const head = dom.window.document.getElementById(id);
  assert.ok(head, `cookbook has no section #${id}`);
  let text = head.textContent;
  for (let el = head.nextElementSibling; el && el.tagName !== "H2"; el = el.nextElementSibling) {
    text += " " + el.textContent;
  }
  dom.window.close();
  return text.replace(/\s+/g, " ").trim();
}

test("the barcode section exists and is well formed", () => {
  const dom = new JSDOM(cookbookHtml);
  const d = dom.window.document;
  try {
    const heads = [...d.querySelectorAll("h2")];
    const ids = heads.map((h) => h.id);
    assert.equal(new Set(ids).size, ids.length, "every h2 id must be unique");
    const s = d.getElementById("barcode-symbologies");
    assert.ok(s, "section #barcode-symbologies is missing");
    assert.equal(s.querySelector(".n").textContent.trim(), "23.");
    assert.ok(d.querySelector(".foot"), "the page still ends with its footer");
    // Named entities must actually resolve, not leak as literal text.
    assert.doesNotMatch(d.body.textContent, /&[a-z]+;/, "an HTML entity did not resolve");
    assert.doesNotMatch(d.body.textContent, /<div|<span|<h3/, "markup leaked into visible text");
  } finally { dom.window.close(); }
});

test("the documented Code 39 module counts match the live encoder", () => {
  const text = sectionText("barcode-symbologies");
  const dom = bootKitchen();
  try {
    // The card gives counts for A, HELLO, 12345, $/+% and THE QUICK BROWN FOX.
    const claimed = { A: 48, HELLO: 112, "12345": 112, "$/+%": 96, "THE QUICK BROWN FOX": 336 };
    for (const [input, want] of Object.entries(claimed)) {
      const got = dom.window.eval(`barCode39(${JSON.stringify(input)}).length`);
      assert.equal(got, want, `Code 39 of ${JSON.stringify(input)} is ${got} modules, card says ${want}`);
      assert.ok(text.includes(String(want)), `the card must state ${want} for ${JSON.stringify(input)}`);
    }
  } finally { dom.window.close(); }
});

test("the documented QR capacities match the live encoder", () => {
  const text = sectionText("barcode-symbologies");
  const dom = bootKitchen();
  try {
    // Derive capacities from the encoder's own picker rather than re-stating the
    // ISO formula here: the byte-mode character count is 8 bits for versions 1-9
    // and 16 bits for 10-40, which is exactly the kind of detail that gets
    // transcribed wrong in prose. qrPickVersion(n) === v means n fits in v.
    const fits = (v, ec = "L") => dom.window.eval(
      `(function(){ for (let n = 4000; n > 0; n--) if (qrPickVersion(n, ${JSON.stringify(ec)}) === ${v}) return n; return -1; })()`);
    assert.equal(fits(10), 271, "version 10 EC L holds 271 bytes — the old ceiling");
    assert.equal(fits(11), 321, "272 bytes already needs version 11");
    assert.equal(fits(40), 2953, "version 40 EC L holds 2953 bytes");
    assert.ok(text.includes("2953 bytes"), "the card must state the v40-L capacity");
    assert.ok(text.includes("271 bytes at level L"), "the card must state the old v10-L ceiling");
    assert.doesNotMatch(text, /272 bytes/, "272 bytes is not the v10-L ceiling");
    // And the encoder really does reach version 40 now.
    assert.equal(dom.window.eval("qrPickVersion(2953, 'L')"), 40);
    assert.equal(dom.window.eval("qrPickVersion(2954, 'L')"), -1);
  } finally { dom.window.close(); }
});

test("the documented registry and pack counts match the live registry", () => {
  const text = sectionText("barcode-symbologies");
  const dom = bootKitchen();
  try {
    const ids = dom.window.eval("OPERATIONS.map(o => o.id)");
    assert.equal(ids.length, 480, "the kitchen's registry size changed — update the cookbook");
    const selectAll = dom.window.eval("applyRecipePacks(Object.keys(RECIPE_PACKS))");
    assert.equal(selectAll, ids.length, "SFX select-all must load the whole registry");
    assert.ok(text.includes("147 of the 480"), "the card must state how many operations were unpacked");
    assert.ok(text.includes("333 recipes"), "the card must state what select-all used to produce");
    assert.ok(text.includes("480 of 480"), "the card must state the fixed coverage");
    assert.ok(ids.includes("averyLabels") && ids.includes("qrcode"), "the documented ops exist");
  } finally { dom.window.close(); }
});

test("every documented barcode op id exists in the kitchen", () => {
  const text = sectionText("barcode-symbologies");
  const dom = bootKitchen();
  try {
    // Op ids appear in the card as <span class="kbd">name</span> headings.
    for (const id of ["code39", "qrcode", "averyLabels"]) {
      assert.ok(text.includes(id), `the card must name the ${id} op`);
      assert.equal(dom.window.eval(`OPERATIONS.some(o => o.id === ${JSON.stringify(id)})`), true,
        `${id} is documented but not implemented`);
    }
  } finally { dom.window.close(); }
});
