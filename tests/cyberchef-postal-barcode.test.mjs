import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const html = readFileSync(new URL("../public/apps/cyberchef/index.html", import.meta.url), "utf8");

function boot() {
  return new JSDOM(html, {
    runScripts: "dangerously",
    url: "https://example.test/apps/cyberchef/",
    beforeParse(window) {
      window.alert = () => undefined;
      window.confirm = () => false;
      window.prompt = () => null;
    },
  });
}

async function postal(dom, input, kind, mode = "encode") {
  const operation = dom.window.eval("OPERATIONS.find((entry) => entry.id === 'gcwPostal')");
  assert.ok(operation, "postal barcode recipe is registered");
  return await operation.run(input, { kind, mode });
}

function barsAsBits(daft) {
  return daft.replace(/[|:]/g, (bar) => (bar === "|" ? "1" : "0"));
}

test("POSTNET emits the known 12345 pattern, frame bars, and valid mod-10 check", async () => {
  const dom = boot();
  try {
    const encoded = await postal(dom, "12345", "postnet");
    assert.equal(barsAsBits(encoded.__text), "10001100101001100100101010010101");
    assert.equal(encoded.__text.length, 32, "5-digit ZIP uses 30 data/check bars plus two frame bars");
    assert.match(encoded.__html, /Check:<\/strong> 5/);

    const decoded = await postal(dom, encoded.__text, "postnet", "decode");
    assert.match(decoded.__text, /^12345\s+check 5 \(ok\)$/);

    const badCheck = encoded.__text.slice(0, -6) + ":::|||";
    const invalid = await postal(dom, badCheck, "postnet", "decode");
    assert.match(invalid.__text, /check 1 \(expected 5\)/);
  } finally {
    dom.window.close();
  }
});

test("PLANET inverts POSTNET digit groups but retains the tall start/stop bars", async () => {
  const dom = boot();
  try {
    const postnet = await postal(dom, "12345", "postnet");
    const planet = await postal(dom, "12345", "planet");
    assert.equal(barsAsBits(planet.__text), "11110011010110011011010101101011");
    assert.equal(planet.__text[0], "|");
    assert.equal(planet.__text.at(-1), "|");
    assert.equal(planet.__text.length, postnet.__text.length);

    const decoded = await postal(dom, planet.__text, "planet", "decode");
    assert.match(decoded.__text, /^12345\s+check 5 \(ok\)$/);
  } finally {
    dom.window.close();
  }
});

test("RM4SCC encodes the BX11LT1A checksum vector and validates framed round trips", async () => {
  const dom = boot();
  try {
    const encoded = await postal(dom, "BX11LT1A", "rm4scc");
    assert.match(encoded.__html, /Check:<\/strong> I/);
    assert.equal(encoded.__text.length, 38, "eight payload characters, check character, start and stop");
    assert.equal(encoded.__text[0], "A");
    assert.equal(encoded.__text.at(-1), "F");

    const decoded = await postal(dom, encoded.__text, "rm4scc", "decode");
    assert.equal(decoded.__text, "BX11LT1A check I (ok)");
  } finally {
    dom.window.close();
  }
});

test("PostNL KIX uses four states without start/check and decodes edge states as data", async () => {
  const dom = boot();
  try {
    const input = "1230AA156XHUIS";
    const encoded = await postal(dom, input, "kix");
    assert.equal(encoded.__text.length, input.length * 4, "one four-state group per character, no guards/check");
    assert.match(encoded.__text, /H/, "KIX full-height/full-depth bars use the KIX H state");
    assert.match(encoded.__html, /4-state · no start\/check/);
    assert.doesNotMatch(encoded.__html, /<strong[^>]*>Check:/);
    assert.equal((await postal(dom, encoded.__text, "kix", "decode")).__text, input);

    // KIX has no guard bars: A at the first position and D at the last are
    // ordinary data states here, not an RM4SCC start/stop pair.
    const edge = await postal(dom, "ID", "kix");
    assert.equal(edge.__text[0], "A");
    assert.equal(edge.__text.at(-1), "D");
    assert.equal((await postal(dom, edge.__text, "kix", "decode")).__text, "ID");
  } finally {
    dom.window.close();
  }
});
