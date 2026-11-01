import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SAMPLE_MODELS, buildVrml } from "../js/scoutbook-pagemaster.js";

const appMarkup = readFileSync(new URL("../apps/scoutbook-pagemaster.html", import.meta.url), "utf8");

test("the prototype catalog is explicitly unverified and not presented as complete", () => {
  assert.equal(SAMPLE_MODELS.length, 4);
  for (const item of SAMPLE_MODELS) {
    assert.match(item.page, /Not checked/);
    assert.match(item.description, /not|verify/i);
    assert.ok(item.parts.length > 0, `${item.id} should have original demo geometry`);
  }
});

test("each demo exports a parseable-looking VRML 2.0 scene with geometry", () => {
  for (const item of SAMPLE_MODELS) {
    const output = buildVrml(item);
    assert.ok(output.startsWith("#VRML V2.0 utf8\n"), item.id);
    assert.match(output, /WorldInfo \{/);
    assert.match(output, /Shape \{/);
    assert.match(output, /source page not yet verified/i);
    assert.doesNotMatch(output, /NaN|Infinity/);
  }
});

test("VRML title is sanitized before embedding in a string field", () => {
  const output = buildVrml({ name: 'Unsafe "title"\nitem', parts: [] });
  assert.match(output, /title "Unsafe  title  item"/);
  assert.doesNotMatch(output, /title "Unsafe "title"/);
});

test("historical editions are clearly separated from the selected 1990 inventory", () => {
  assert.match(appMarkup, /Earlier handbook editions/);
  assert.match(appMarkup, /Only the selected 1990 tenth edition can verify the requested inventory/);
  assert.match(appMarkup, /gutenberg\.org\/ebooks\/29558/);
  assert.match(appMarkup, /archive\.org\/details\/officialboyscout71967boys/);
  assert.match(appMarkup, /archive\.org\/details\/officialboyscout00hill/);
  assert.match(appMarkup, /not 1990 sources/i);
});
