import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const tool = path.join(root, "tools/crow_letter_count_bounds.py");
const doc = path.join(root, "docs/crow-217-letter-claim-check-2026-10-14.md");
const out = execFileSync("python3", [tool, "217", "300"], { encoding: "utf8" });

test("the digit identity is self-checked against the publisher's worked example", () => {
  assert.match(out, /model self-check on the publisher's worked example: PASS/);
  assert.match(out, /67 symbols, 30 one-digit symbols -> 104 digits \+ 1 null = 105/);
});

test("a 217-letter Crow plaintext is refused by SECOM's own arithmetic", () => {
  assert.match(out, /digits: 600\s+histogram: 2:144\s+3:116\s+8:88\s+5:56\s+7:46\s+6:45\s+4:40\s+1:33\s+0:23\s+9:9/);
  assert.match(out, /600 - pad = a \+ 2\(T - a\), pad <= 4\s+=>\s+T = \(600 \+ a\)\/2, T >= 298/);
  assert.match(out, /claimed plaintext: 217 letters \(at 4.7 letters\/word: 263 symbols, 46 spaces\)/);
  // 263 prose symbols can write at most 526 digits: the claim is 70+ digits short.
  assert.match(out, /digits such a text can occupy : 309-526/);
  assert.match(out, /VERDICT: REJECTED - too few symbols for 600 digits\./);
  assert.match(out, /81 non-letter symbols \(<= 2\.68 letters per word/);
  assert.match(out, /252-324 letters/);
});

test("a low-300s letter count survives the arithmetic but is not evidence", () => {
  assert.match(out, /claimed plaintext: 300 letters/);
  assert.match(out, /one-digit share implied by a = 2T - 600 \+ pad : 42\.7%-44\.0% of the letters/);
  assert.match(out, /VERDICT: arithmetically possible; no evidence value without the 20-letter phrase/);
});

test("the research note records the negative result and the reproduce commands", () => {
  const text = readFileSync(doc, "utf8");
  assert.match(text, /No such claim exists in the record\./);
  assert.match(text, /The Crow's Cryptogram is \*\*unsolved in this repository\*\*/);
  assert.match(text, /600 - pad = a \+ 2 \* \(T - a\)/);
  assert.match(text, /The English-prose window for 600 SECOM digits is 252–324 letters/);
  assert.match(text, /python3 tools\/crow_letter_count_bounds\.py 217 300 324/);
  assert.match(text, /git log --all -S "217 letters"/);
});
