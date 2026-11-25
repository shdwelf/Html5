// Educational FHE study aids are deliberately plaintext-only; their name and
// recipe packs must not imply that CyberChef performs encryption/evaluation.
import assert from "node:assert/strict";
import { after, test } from "node:test";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const html = readFileSync(new URL("../public/apps/cyberchef/index.html", import.meta.url), "utf8");
const dom = new JSDOM(html, {
  runScripts: "dangerously",
  url: "https://example.test/apps/cyberchef/",
  pretendToBeVisual: true,
  beforeParse(window) {
    window.alert = () => undefined;
    window.confirm = () => false;
    window.prompt = () => null;
    window.TextEncoder = TextEncoder;
    window.TextDecoder = TextDecoder;
    window.URL.createObjectURL = () => "blob:cyberchef-fhe-kitchen-test";
    window.URL.revokeObjectURL = () => undefined;
  },
});
const w = dom.window;
after(() => w.close());

async function bakeMode(mode, input = "") {
  w.document.getElementById("input").value = input;
  return w.eval(`(async function(){
    recipe=[];
    const op=OPERATIONS.find(o=>o.id==='fheKitchenLab');
    if(!op)throw new Error('missing fheKitchenLab');
    const item={uid:++opIdCounter,op,args:{}};
    op.args.forEach(a=>item.args[a.key]=a.default);
    item.args.mode=${JSON.stringify(mode)};
    recipe.push(item);
    await bake();
    const err=document.getElementById('out-error');
    if(err&&err.style.display!=='none')throw new Error(err.textContent);
    return document.getElementById('output').value;
  })()`);
}

async function rejectsBake(mode, input, message) {
  await assert.rejects(bakeMode(mode, input), new RegExp(message));
}

test("FHE lab is one documented operation with three separate recipe presets", () => {
  const ops = w.eval("OPERATIONS");
  const matches = ops.filter((op) => op.id === "fheKitchenLab");
  assert.equal(matches.length, 1);
  assert.match(matches[0].name, /plaintext only/i);
  assert.match(matches[0].desc, /None encrypts/);

  const packs = JSON.parse(JSON.stringify(w.eval("RECIPE_PACKS")));
  assert.deepEqual(JSON.parse(JSON.stringify(packs["FHE Study — F17 arithmetic oracle (plaintext only)"])), [
    ["fheKitchenLab", { mode: "oracle" }],
  ]);
  assert.deepEqual(JSON.parse(JSON.stringify(packs["FHE Study — UTF-8 byte / F17 pair codec (not encryption)"])), [
    ["fheKitchenLab", { mode: "bytePairs" }],
  ]);
  assert.deepEqual(JSON.parse(JSON.stringify(packs["FHE Study — Lancelot architecture case study"])), [
    ["fheKitchenLab", { mode: "architecture" }],
  ]);
  assert.ok(packs["Full Coverage — Educational"].some(([id]) => id === "fheKitchenLab"));
  assert.equal(Object.entries(packs).filter(([name, entries]) => name.startsWith("FHE Study —") && entries.some(([id]) => id === "fheKitchenLab")).length, 3);
  assert.ok(packs["FHE Study — CKKS architecture profile (manual data only)"].some(([id]) => id === "fheArchitectureLab"));
});

test("F17 oracle reports exact field arithmetic and flags the zero divisor", async () => {
  const report = JSON.parse(await bakeMode("oracle", "# F17 examples\n2,1\n2,0"));
  assert.match(report.scope, /Plaintext reference oracle only/);
  assert.deepEqual(report.field, { name: "F17", modulus: 17, plaintext_range: [0, 16] });
  assert.deepEqual(report.results[0], {
    sequence: 0, x: 2, y: 1,
    sum: 3, difference: 1, product: 2, quotient: 2, divisor_valid: true,
    square: 8,
    intermediates: { raw_product: 2, reduction_index: 2, square_lut_index: 5 },
  });
  assert.deepEqual(report.results[1], {
    sequence: 1, x: 2, y: 0,
    sum: 2, difference: 2, product: 0, quotient: 0, divisor_valid: false,
    square: 9,
    intermediates: { raw_product: 0, reduction_index: 0, square_lut_index: 3 },
  });
  assert.deepEqual(report.circuit.bounds, {
    raw_product_max: 256,
    reduction_index_max: 256,
    square_index_max: 33,
  });
});

test("F17 oracle covers all 289 field pairs against an independent formula", async () => {
  const input = Array.from({ length: 17 * 17 }, (_, i) => `${Math.floor(i / 17)},${i % 17}`).join("\n");
  const { results } = JSON.parse(await bakeMode("oracle", input));
  assert.equal(results.length, 289);
  for (const [i, row] of results.entries()) {
    const x = Math.floor(i / 17), y = i % 17;
    const product = (x * y) % 17;
    const expected = y === 0 ? 0 : Array.from({ length: 16 }, (_, n) => n + 1)
      .find((n) => (y * n) % 17 === 1) * x % 17;
    assert.equal(row.sequence, i);
    assert.equal(row.sum, (x + y) % 17);
    assert.equal(row.difference, ((x - y) % 17 + 17) % 17);
    assert.equal(row.product, product);
    assert.equal(row.quotient, expected);
    assert.equal(row.divisor_valid, y !== 0);
    assert.equal(row.square, ((product + x + 1) ** 2) % 17);
  }
});

test("F17 oracle rejects malformed, out-of-domain, and oversized streams", async () => {
  await rejectsBake("oracle", "", /at least one F17 input pair/);
  await rejectsBake("oracle", "-1,2", /two non-negative integers/);
  await rejectsBake("oracle", "1;2", /two non-negative integers/);
  await rejectsBake("oracle", "17,0", /x must be an integer in 0\.\.16/);
  await rejectsBake("oracle", "0,17", /y must be an integer in 0\.\.16/);
  await rejectsBake("oracle", Array(290).fill("0,0").join("\n"), /At most 289 input pairs/);
});

test("UTF-8 byte/F17 codec is byte-exact, ordered, bounded, and explicitly not encryption", async () => {
  const report = JSON.parse(await bakeMode("bytePairs", "A€"));
  assert.match(report.scope, /not encryption/);
  assert.equal(report.input_utf8_bytes, 4);
  assert.equal(report.pair_count, 4);
  assert.equal(report.round_trip_exact, true);
  assert.equal(report.preserves_order, true);
  assert.deepEqual(report.pairs[0], { index: 0, byte: 65, pair: [3, 14], reconstructed_byte: 65 });
  assert.deepEqual(report.pairs.slice(1).map(({ byte, pair, reconstructed_byte }) => ({ byte, pair, reconstructed_byte })), [
    { byte: 226, pair: [13, 5], reconstructed_byte: 226 },
    { byte: 130, pair: [7, 11], reconstructed_byte: 130 },
    { byte: 172, pair: [10, 2], reconstructed_byte: 172 },
  ]);
  assert.deepEqual(JSON.parse(await bakeMode("bytePairs", "")).pairs, []);
  await rejectsBake("bytePairs", "x".repeat(4097), /limited to 4096 UTF-8 bytes/);
});

test("Lancelot case card records the explicit trusted-centre boundary and source", async () => {
  const card = JSON.parse(await bakeMode("architecture", "ignored input"));
  assert.equal(card.source.doi, "10.1038/s42256-025-01107-6");
  assert.match(card.source_review_limit, /truncated.*not a full paper/i);
  assert.equal(card.roles.length, 3);
  assert.ok(card.roles.some((role) => /Trusted key-generation centre/.test(role.role) && /decrypt and sort/.test(role.responsibility)));
  assert.ok(card.workflow.some((step) => /decryption and sorting/.test(step)));
  assert.match(card.security_and_scope.join(" "), /does not prevent poisoned inputs/);
  assert.match(card.engineering, /not a general FHE speedup guarantee/);
});

test("unknown study modes fail clearly", async () => {
  await rejectsBake("not-a-mode", "", /Unknown FHE study mode/);
});
