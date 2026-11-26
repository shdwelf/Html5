import assert from "node:assert/strict";
import { test } from "node:test";
import { PUBLIC_SEARCH_LIMITS, searchPublicCertificates as search } from "../apps/openpgp-workbench/keyring-search.mjs";

const fp4 = "0123456789ABCDEF0123456789ABCDEF01234567";
const fp6 = "FEDCBA9876543210".repeat(4);
const certificate = (name, fingerprint = fp4) => Object.freeze({ fingerprint, userIDs: Object.freeze([name]) });
const names = (results) => results.map(({ entry }) => entry.userIDs[0]);

test("public search is empty-by-default, stable, exact-before-fuzzy and never mutates metadata", () => {
  const entries = Object.freeze([certificate("Bob Example"), certificate("Alice Example <alice@example.invalid>"), certificate("Alcie Exact")]);
  assert.deepEqual(search(entries).map(({ entry }) => entry), entries);
  assert.deepEqual(search(entries, "   ").map(({ entry }) => entry), entries);
  assert.deepEqual(names(search(entries, "alcie")), ["Alcie Exact", "Alice Example <alice@example.invalid>"]);
  assert.deepEqual(search(entries, "alcie").map(({ score, kind }) => ({ score, kind })), [{ score: 0, kind: "text" }, { score: 1, kind: "fuzzy" }]);
  assert.strictEqual(search(entries, "bob")[0].entry, entries[0]);
  assert.equal(entries[1].userIDs[0], "Alice Example <alice@example.invalid>");
  assert.deepEqual(names(search(entries, "example")), entries.slice(0, 2).map((entry) => entry.userIDs[0]));
});

test("all query terms must match name/email text, including bounded typos, case and NFC forms", () => {
  const entries = [certificate("Alice Café <alice@research.invalid>"), certificate("Alice Remote <alice@other.invalid>")];
  assert.deepEqual(names(search(entries, "ALCIE cafe\u0301")), [entries[0].userIDs[0]]);
  assert.deepEqual(names(search(entries, "alice@researhc.invlaid")), [entries[0].userIDs[0]]);
  assert.equal(search(entries, "alcie unrelated").length, 0);
  assert.equal(search(entries, "zz").length, 0, "short terms never fuzzily match an unrelated name");
  assert.equal(search([certificate("Alice")], "a").length, 1);
  assert.equal(search([certificate("Alice")], "ax").length, 0);
  assert.equal(search([certificate("Charlie")], "chxrlxe").length, 1, "long words allow two substitutions");
  assert.equal(search([certificate("Alice")], "xlxcy").length, 0, "short words do not allow three edits");
  assert.equal(search([certificate("🔐 大和")], "大和").length, 1);
  assert.equal(search([certificate("𐐀𐐁𐐂𐐃")], "𐐁𐐀𐐂𐐃").length, 1, "adjacent swaps compare code points, not surrogate halves");
});

test("fingerprints are exact-only display filters, never fuzzy name fallbacks or short-ID authorization", () => {
  const entries = [certificate("Synthetic v4", fp4), certificate("Synthetic v6", fp6)];
  for (const [fingerprint, entry] of [[fp4, entries[0]], [fp6, entries[1]]]) {
    for (const query of [fingerprint, fingerprint.toLowerCase(), fingerprint.match(/.{4}/g).join(" "), fingerprint.slice(0, 8)]) {
      const results = search(entries, query);
      assert.equal(results.length, 1); assert.strictEqual(results[0].entry, entry);
      assert.equal(results[0].kind, "fingerprint"); assert.equal(results[0].score, 0);
    }
    const wrong = (fingerprint[0] === "A" ? "B" : "A") + fingerprint.slice(1);
    assert.equal(search(entries, wrong).length, 0, "one changed hex digit is not a fuzzy match");
    assert.equal(search(entries, fingerprint[1] + fingerprint[0] + fingerprint.slice(2)).length, 0, "adjacent fingerprint swaps are not corrected");
    assert.equal(search([certificate(wrong, fingerprint)], wrong).length, 0, "hex-looking queries never fall back to a matching User ID");
  }
  assert.equal(search(entries, "56789ABD").length, 0);
});

test("punctuation is literal, untrusted UIDs remain data and empty UIDs are searchable by fingerprint", () => {
  const entries = [certificate('<img id="not-markup" onerror="doNotRun()">'), certificate("Alice")];
  assert.equal(search(entries, ".*").length, 0, "not a user-supplied regex");
  assert.equal(search(entries, "<img")[0].entry, entries[0]);
  const empty = { fingerprint: fp4, userIDs: [] };
  assert.equal(search([empty], "anything").length, 0);
  assert.equal(search([empty], fp4)[0].entry, empty);
});

test("query, term, ring and UID bounds fail explicitly rather than doing unbounded work", () => {
  for (const query of ["x".repeat(129), "a b c d e f g h i", {}, null]) assert.throws(() => search([certificate("Alice")], query), /128 search characters/);
  assert.throws(() => search(Array.from({ length: 33 }, () => certificate("Alice")), "alice"), /bounded validated public keyring/);
  assert.throws(() => search([certificate("x".repeat(2049))], "alice"), /bounded public User IDs/);
  assert.throws(() => search([{ fingerprint: fp4, userIDs: Array(33).fill("Alice") }], "alice"), /bounded public User IDs/);
  const long = "x".repeat(PUBLIC_SEARCH_LIMITS.fuzzyWordCharacters + 1);
  assert.equal(search([certificate(long)], long).length, 1, "long words remain exactly searchable");
  assert.equal(search([certificate(long)], "y" + long.slice(1)).length, 0, "long fuzzy comparisons are not attempted");
  const last = "Alice";
  const maximum = Array.from({ length: 32 }, () => ({ fingerprint: fp4, userIDs: Array.from({ length: 32 }, () => "longword ".repeat(220) + last) }));
  assert.equal(search(maximum, "alcie").length, 32, "late UID words are not lost to an excerpt/token-count limit");
});

// Independent unbanded OSA oracle. Exhaustive small-word pairs guard the band
// boundaries, insertion/deletion/substitution and transposition recurrence.
function referenceDistance(a, b) {
  const table = Array.from({ length: a.length + 1 }, () => Array(b.length + 1));
  for (let i = 0; i <= a.length; i++) table[i][0] = i;
  for (let j = 0; j <= b.length; j++) table[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    table[i][j] = Math.min(table[i - 1][j] + 1, table[i][j - 1] + 1, table[i - 1][j - 1] + Number(a[i - 1] !== b[j - 1]));
    if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) table[i][j] = Math.min(table[i][j], table[i - 2][j - 2] + 1);
  }
  return table[a.length][b.length];
}
test("banded fuzzy results agree with an independent full OSA oracle on exhaustive bounded controls", () => {
  const cases = [];
  for (let length = 3; length <= 6; length++) for (let bits = 0; bits < 2 ** length; bits++) cases.push(bits.toString(2).padStart(length, "0").replaceAll("0", "x").replaceAll("1", "y"));
  for (const query of cases) for (const name of cases) {
    const expected = name.includes(query) || referenceDistance(query, name) <= (query.length < 6 ? 1 : 2);
    assert.equal(search([certificate(name)], query).length === 1, expected, `${query} / ${name}`);
  }
});
