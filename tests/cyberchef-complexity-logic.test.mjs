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

async function runOp(dom, id, input, args = {}) {
  const output = await dom.window.eval(`(async function(){
    const op=OPERATIONS.find(entry=>entry.id===${JSON.stringify(id)});
    if(!op)throw new Error('Missing operation: '+${JSON.stringify(id)});
    recipe.length=0;
    document.getElementById('input').value=${JSON.stringify(input)};
    const item={uid:++opIdCounter,op,args:{}};
    op.args.forEach(arg=>item.args[arg.key]=arg.default);
    Object.assign(item.args,${JSON.stringify(args)});
    recipe.push(item);
    await bake();
    const err=document.getElementById('out-error');
    return {text:document.getElementById('output').value,error:err.style.display==='none'?'':err.textContent,preview:document.getElementById('preview').innerHTML};
  })()`);
  if (output.error && output.error.trim()) throw new Error(output.error);
  return output;
}

test("Algorithm Complexity Lab sorts correctly and reports measured plus asymptotic complexity", async () => {
  const dom = boot();
  try {
    const ascending = await runOp(dom, "complexityLab", "5, 1; 3 1 -2", { algorithm: "merge", order: "asc" });
    assert.match(ascending.text, /Bottom-up stable merge sort/);
    assert.match(ascending.text, /best Θ\(n log n\).*worst Θ\(n log n\)/);
    assert.match(ascending.text, /Sorted values:\n-2 1 1 3 5/);
    assert.match(ascending.text, /stable: yes/);

    const descending = await runOp(dom, "complexityLab", "1 3 2 3", { algorithm: "insertion", order: "desc" });
    assert.match(descending.text, /Stable insertion sort/);
    assert.match(descending.text, /best Θ\(n\).*worst Θ\(n²\)/);
    assert.match(descending.text, /Sorted values:\n3 3 2 1/);
  } finally {
    dom.window.close();
  }
});

test("Complexity Lab rejects non-numeric values and bounds the quadratic demonstration", async () => {
  const dom = boot();
  try {
    await assert.rejects(runOp(dom, "complexityLab", "1 2 nope", { algorithm: "merge" }), /Not a finite number: nope/);
    await assert.rejects(runOp(dom, "complexityLab", new Array(5002).fill("1").join(" "), { algorithm: "insertion" }), /limit this demonstration to 5,000/);
  } finally {
    dom.window.close();
  }
});

test("Symbolic Logic builds a bounded truth table without evaluating JavaScript", async () => {
  const dom = boot();
  try {
    const truth = await runOp(dom, "symbolicLogic", "A AND (B OR NOT C)");
    assert.match(truth.text, /Variables: A, B, C · rows: 8 · true rows: 3/);
    assert.match(truth.text, /A B C \| OUT/);
    assert.match(truth.text, /1 0 0 \| 1/);
    assert.match(truth.text, /1 0 1 \| 0/);
    assert.match(truth.text, /1 1 1 \| 1/);

    const implication = await runOp(dom, "symbolicLogic", "A -> B -> C");
    assert.match(implication.text, /true rows: 7/, "implication is parsed right-associatively");
    const constant = await runOp(dom, "symbolicLogic", "TRUE");
    assert.match(constant.text, /Variables: none · rows: 1 · true rows: 1/);
  } finally {
    dom.window.close();
  }
});

test("Symbolic Logic rejects malformed input and limits truth-table growth", async () => {
  const dom = boot();
  try {
    await assert.rejects(runOp(dom, "symbolicLogic", "A AND (B OR"), /Expected a variable, constant, or parenthesized expression/);
    await assert.rejects(runOp(dom, "symbolicLogic", "A B"), /Unexpected token after expression/);
    await assert.rejects(runOp(dom, "symbolicLogic", "A AND B AND C AND D AND E AND F AND G AND H AND I"), /Limit is 8 distinct variables/);
  } finally {
    dom.window.close();
  }
});
