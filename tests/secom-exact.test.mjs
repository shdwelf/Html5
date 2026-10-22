import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const html = readFileSync(new URL("../public/apps/cyberchef/index.html", import.meta.url), "utf8");

function boot() {
  return new JSDOM(html, {
    runScripts: "dangerously",
    url: "https://example.test/apps/cyberchef/",
    pretendToBeVisual: true,
    beforeParse(window) {
      window.alert = () => undefined;
      window.confirm = () => false;
      window.prompt = () => null;
    },
  });
}

test("SECOM exact uses the same 1..9,0 checkerboard sequence as its inspector", () => {
  const dom = boot();
  try {
    const rows = JSON.parse(dom.window.eval(`JSON.stringify((function () {
      return [
        'THETOWNILOVEDSOWELLA',
        'VKZIVYLRUFBQLXDVAFDX',
      ].map(function (phrase) {
        const inspected = secomSchedule(phrase);
        const exact = sxSchedule(phrase);
        return {
          phrase: phrase,
          inspectedBoard: inspected.checker,
          exactBoard: exact.board,
          firstDigits: inspected.firstDigits,
          secondDigits: inspected.secondDigits,
          seed: inspected.seed,
          block: inspected.block,
          widths: exact.widths,
          keys: exact.keys,
        };
      });
    })())`));

    assert.deepEqual(rows[0], {
      phrase: "THETOWNILOVEDSOWELLA",
      inspectedBoard: "5914267803",
      exactBoard: "5914267803",
      firstDigits: "8219605347",
      secondDigits: "9328704561",
      seed: "7537309808",
      block: "28003978800803265680883581148861839252647912177801",
      widths: [16, 11],
      keys: ["7515788819035320", "03818642820"],
    });

    assert.deepEqual(rows[1], {
      phrase: "VKZIVYLRUFBQLXDVAFDX",
      inspectedBoard: "1045867923",
      exactBoard: "1045867923",
      firstDigits: "7302894561",
      secondDigits: "2769381540",
      seed: "9061175001",
      block: "96728250105390075115829072626301979888931066766724",
      widths: [13, 10],
      keys: ["8079795801053", "3420076272"],
    });
  } finally {
    dom.window.close();
  }
});

test("SECOM exact preserves the published 105-digit control vector", () => {
  const dom = boot();
  try {
    const result = JSON.parse(dom.window.eval(`JSON.stringify((function () {
      const phrase = 'MAKE NEW FRIENDS BUT KEEP THE OLD';
      const plain = 'RV TOMORROW AT 1400PM TO COMPLETE TRANSACTION USE DEADDROP AS USUAL';
      const cipher = '777193862200032042396003829683146080607178016736060606463536069686740369681890014021906662606660863160549';
      return {
        encrypted: sxEncrypt(plain, phrase).digits,
        decrypted: sxDecrypt(cipher, phrase).plain,
        plain: plain,
      };
    })())`));

    assert.equal(result.encrypted,
      "777193862200032042396003829683146080607178016736060606463536069686740369681890014021906662606660863160549");
    assert.ok(result.decrypted.startsWith(result.plain));
  } finally {
    dom.window.close();
  }
});
