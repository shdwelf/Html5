// T9.2: haiku generator/catalog + haiku-vault-v1 seal-open interop tests.
import { test } from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import {
  FIVES, SEVENS, bankProblems, countSyllables, generateHaiku,
  catalogHaikuText, buildCollectionPayload, sealVault, openVault,
} from "../js/haiku-vault.js";

if (!globalThis.crypto) Object.defineProperty(globalThis, "crypto", { value: webcrypto });

test("phrase banks are meter-true under the module's own counter", () => {
  assert.deepEqual(bankProblems(), []);
  assert.ok(FIVES.length >= 8 && SEVENS.length >= 8);
});

test("the counter agrees with Basho's classic (in translation)", () => {
  assert.equal(countSyllables("an old silent pond"), 5);
  assert.equal(countSyllables("a frog jumps into the pond"), 7);
  assert.equal(countSyllables("splash silence again"), 5);
});

test("generated haiku are seeded, deterministic and always 5-7-5", () => {
  assert.deepEqual(generateHaiku(42), generateHaiku(42));
  for (let seed = 0; seed < 40; seed++) {
    const h = generateHaiku(seed);
    assert.deepEqual(h.syllables, [5, 7, 5], `seed ${seed}`);
    assert.equal(h.meter, "5-7-5");
    assert.equal(h.seed, seed);
  }
  assert.notDeepEqual(generateHaiku(1).lines, generateHaiku(2).lines);
});

test("cataloger groups OCR triples and reports leftovers honestly", () => {
  const { entries, leftoverLines } = catalogHaikuText(
    "an old silent pond\na frog jumps into the pond\nsplash silence again\nstray line\n",
    { source: "ocr-test" },
  );
  assert.equal(entries.length, 1);
  assert.equal(entries[0].meter, "5-7-5");
  assert.equal(entries[0].source, "ocr-test");
  assert.deepEqual(leftoverLines, ["stray line"]);
});

test("seal/open reproduces the haiku-vault-v1 spec test vector byte-for-byte", async () => {
  const salt = new Uint8Array(16).fill(0x2a);
  const iv = new Uint8Array(12).fill(0x2a);
  const sealed = await sealVault({ note: "haiku vault format test vector" }, "correct horse battery staple", { salt, iv });
  assert.equal(
    sealed,
    "haiku-vault-v1.ASoqKioqKioqKioqKioqKioqKioqKioqKioqKipaan5ObhVqRoO2mqxtDB8NbHOCxLjpmD/lhc6CsC3VFM4xr28wqKEw2lSxZgX2TYQaYiS4Qat511ciZRvZpw==",
  );
  assert.deepEqual(await openVault(sealed, "correct horse battery staple"), { note: "haiku vault format test vector" });
});

test("a generated collection seals, opens, and refuses tampering", async () => {
  const payload = buildCollectionPayload([generateHaiku(7), generateHaiku(8)], { title: "test grove" });
  const sealed = await sealVault(payload, "grove passphrase");
  const opened = await openVault(sealed, "grove passphrase");
  assert.equal(opened.kind, "haiku-collection");
  assert.equal(opened.count, 2);
  assert.deepEqual(opened.entries[0].lines, payload.entries[0].lines);

  await assert.rejects(openVault(sealed, "wrong passphrase"), /authentication failed/);
  const mid = 40;
  const tampered = sealed.slice(0, mid) + (sealed[mid] === "A" ? "B" : "A") + sealed.slice(mid + 1);
  await assert.rejects(openVault(tampered, "grove passphrase"), /authentication failed/);
  await assert.rejects(openVault("not a vault", "x"), /magic/);
});
