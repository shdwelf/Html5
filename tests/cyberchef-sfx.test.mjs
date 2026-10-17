import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const appHtml = readFileSync(new URL("../public/apps/cyberchef/index.html", import.meta.url), "utf8");
const bwipSource = readFileSync(new URL("../public/apps/cyberchef/vendor/bwip-js.min.js", import.meta.url), "utf8");
const zxingSource = readFileSync(new URL("../public/apps/cyberchef/vendor/zxing-library.min.js", import.meta.url), "utf8");
const report = JSON.parse(readFileSync(new URL("../docs/cyberchef-recipe-sync-2026-10-07.json", import.meta.url), "utf8"));
// Four barcode/logic additions, three PR #118 Aztec/CueCat operations, the
// 2026-10-14 field-cipher deep dive (OD message, VIC schedule + message stage,
// Diana table + cipher, Gronsfeld analysis, hexdump/octal byte recipes), the
// OpenPGP and Enigma recipes, and the two War Office manual recipes.
const expectedCount = report.counts.mergedRuntime + 22;

function createDom(html = appHtml) {
  return new JSDOM(html, {
    runScripts: "dangerously",
    url: "https://example.test/apps/cyberchef/",
    pretendToBeVisual: true,
    beforeParse(window) {
      window.alert = () => undefined;
      window.confirm = () => false;
      window.prompt = () => null;
      window.URL.createObjectURL = () => "blob:cyberchef-sfx-test";
      window.URL.revokeObjectURL = () => undefined;
      window.fetch = async (url) => {
        const body = String(url).includes("zxing-library.min.js") ? zxingSource : bwipSource;
        return { ok: true, text: async () => body };
      };
    },
  });
}

test("generated Select All SFX boots the complete recipe registry offline", async () => {
  const source = createDom();
  let packaged;
  try {
    source.window.eval("sfxFillList()");
    source.window.document.getElementById("sfx-all").click();
    const selected = [...source.window.document.querySelectorAll("#sfx-list input:checked")].map((input) => input.value);
    const packs = source.window.eval("RECIPE_PACKS");
    assert.equal(selected.length, Object.keys(packs).length, "Select all checks every installed recipe pack");

    const sfxHtml = await source.window.eval(`sfxSerialize(${JSON.stringify(selected)})`);
    assert.match(sfxHtml, /var SFX_PACKS=\[/, "the standalone HTML carries the selected pack list");
    assert.doesNotMatch(sfxHtml, /^\s*var SFX_PACKS=null;/m, "the standalone is not left in unconfigured state");
    assert.doesNotMatch(sfxHtml, /<script src="\.\/vendor\/bwip-js\.min\.js"><\/script>/,
      "standalone SFX embeds the browser renderer instead of relying on a sidecar file");
    assert.doesNotMatch(sfxHtml, /<script src="\.\/vendor\/zxing-library\.min\.js"><\/script>/,
      "standalone SFX embeds the Aztec reader instead of relying on a sidecar file");
    assert.match(sfxHtml, /bwip-js 4\.7\.0 \(MIT\) inlined for standalone SFX/);
    assert.match(sfxHtml, /ZXing JavaScript 0\.21\.3 \(MIT\) inlined for standalone SFX/);

    // Keep the shipped bootstrap and SFX installation path intact while
    // suppressing the expensive act of executing the complete registry in series.
    const instrumented = sfxHtml.replace("\nsfxInitUi();", "\nwindow.bake=()=>Promise.resolve();\nsfxInitUi();");
    assert.notEqual(instrumented, sfxHtml, "test harness found the real SFX bootstrap call");
    packaged = createDom(instrumented);
    assert.equal(packaged.window.eval("typeof bwipjs.toSVG"), "function", "standalone SFX can still create Aztec SVGs offline");
    assert.equal(packaged.window.eval("typeof ZXing.AztecCodeReader"), "function", "standalone SFX can decode Aztec images offline");

    const operations = packaged.window.eval("OPERATIONS");
    const loaded = packaged.window.eval("recipe");
    const loadedIds = [...loaded].map((entry) => entry.op.id);
    assert.equal(operations.length, expectedCount, "source registry and kitchen header agree");
    assert.equal(loadedIds.length, expectedCount, "SFX startup loads the complete deduplicated recipe set");
    assert.equal(new Set(loadedIds).size, expectedCount, "no operation is duplicated in the SFX recipe");
    assert.deepEqual([...new Set(loadedIds)].sort(), [...operations].map((entry) => entry.id).sort());
    for (const id of ["gcwPostal", "complexityLab", "symbolicLogic", "qrcode", "aztecCode", "aztecDecode", "cuecatDecode", "averyLabels"]) {
      assert.ok(loadedIds.includes(id), `SFX Select All omitted ${id}`);
    }
    assert.match(packaged.window.document.getElementById("sfx-banner").textContent, new RegExp(`${expectedCount} ops loaded`));
    assert.match(appHtml, new RegExp(`HTML5 · ${expectedCount} recipes`));
    assert.match(appHtml, /zenInit\(\);\s*sfxInitUi\(\);\s*renderOpsList\(\);renderRecipe\(\);/);
  } finally {
    packaged?.window.close();
    source.window.close();
  }
});
