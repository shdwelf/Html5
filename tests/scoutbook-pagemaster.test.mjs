import test from "node:test";
import assert from "node:assert/strict";
import { SAMPLE_MODELS, buildVrml } from "../js/scoutbook-pagemaster.js";

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
