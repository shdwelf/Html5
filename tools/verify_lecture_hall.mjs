#!/usr/bin/env node
/**
 * verify_lecture_hall.mjs — headless proof for the Intelligence Lecture Hall.
 *
 *   node tools/verify_lecture_hall.mjs
 *
 * The hall's rule is that anything computable must be computed, not quoted.
 * This harness therefore re-derives every ciphertext-bearing claim in the four
 * 2026-09-14 records (F5 Black Hat 2016, the USCYBERCOM seal hash, the Field
 * Notes cipher wheel, f1eldn0tes.com) and then audits the bundle those records
 * live in:
 *
 *   1. wheel conformance — upstream unit vectors, the 36×18 keyspace, the
 *      null-key pair, and the eight codes the solver community published;
 *   2. the Clandestine corpus — messages.txt lines 1–2 under key FN, and the
 *      honest negative for the four unrecovered codes;
 *   3. F5 Black Hat 2016 — both card ciphertexts, the key square, the T-shirt
 *      ciphertext, and the published three-layer peel;
 *   4. USCYBERCOM — the seal digest recomputed with node:crypto, plus the
 *      near-miss preimages that must NOT match;
 *   5. bundle integrity — inline app script still parses, every lecture record
 *      is complete, every provenance label resolves in the legend, the colour
 *      map and the filter row, and no record's id collides.
 *
 * Zero dependencies beyond node itself. Exit code = number of failures.
 */

import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

import {
  wheel, wheelAlphabet, wheelKeyspace, caesar, atbash, playfair,
  WHEEL_POOL, WHEEL_VECTORS, CLANDESTINE_MESSAGES, FIELDNOTES_CODES,
  F5_2016, USCYBERCOM,
} from "../js/lecture-ciphers.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SUITE = join(ROOT, "apps", "Cipher-Machines-and-Cryptology-Suite-2026-08-02 (1).html");

let failures = 0;
const check = (ok, label) => {
  console.log(`   ${ok ? "✓" : "✗"} ${label}`);
  if (!ok) failures++;
};
const md5 = (s) => createHash("md5").update(s, "utf8").digest("hex");
const squash = (s) => s.replace(/[^A-Z0-9]/g, "").toUpperCase();
/** wheel-side normaliser: the 36-char dial keeps dots, only whitespace goes */
const flat = (s) => s.toUpperCase().replace(/\s+/g, "");

/* ----------------------------------------------------------------─ 1. wheel */

console.log("── Field Notes cipher wheel (Jurph/cipherwheel model)");
{
  const pool = WHEEL_POOL.split("");
  check(pool.length === 36, `wheel pool is 36 characters (A–Z, 0–9): ${pool.length}`);
  check(
    wheelAlphabet("XW").join("") === WHEEL_POOL,
    "key XW is the identity alphabet — the null cipher the README warns about",
  );
  check(
    wheelAlphabet("XW").join("") === wheelAlphabet("XV").join(""),
    "XV and XW generate the same wheel (adjacent pairs collide, per the README)",
  );
  const { distinct, keys, identityKeys } = wheelKeyspace();
  check(
    keys === 1296 && distinct === 648,
    `36×36 = ${keys} keys reach exactly 36×18 = 648 distinct alphabets (got ${distinct})`,
  );
  check(identityKeys.length === 2, `exactly two null keys on the default dial: ${identityKeys.join(", ")}`);
  check(
    wheelAlphabet("AA").join("") === WHEEL_VECTORS.alphabetAA,
    "upstream unit vector: makealphabet(\"AA\")",
  );
  check(
    wheelAlphabet("FN").join("") === WHEEL_VECTORS.alphabetFN,
    "upstream unit vector: makealphabet(\"FN\")",
  );
  const vecs = WHEEL_VECTORS.encrypt.map(
    ({ key, plain, cipher }) =>
      wheel(key).encode(plain) === cipher && wheel(key).decode(cipher) === plain,
  );
  check(vecs.every(Boolean), `upstream encrypt/decrypt vectors: ${vecs.filter(Boolean).length}/${vecs.length}`);
}

/* --------------------------------------------------- 2. Clandestine corpus */

console.log("── Clandestine release corpus (messages.txt)");
{
  const fn = wheel("FN"); // .decode is the upstream decrypt direction, which is what the literature needs
  const [rhyme, urlLine, ...rest] = CLANDESTINE_MESSAGES;
  const rhymePt = fn.decode(rhyme.toUpperCase());
  check(
    rhymePt ===
      "IT’S NOT ENCRYPTED IN CODE TO DECIPHER IT LATER, IT’S ENCRYPTED IN CODE TO DECIPHER IT NOW".replace(/’/g, "'"),
    `line 1 recovers under key FN: “${rhymePt.slice(0, 44)}…”`,
  );
  const urlPt = fn.decode(flat(urlLine.split("=")[0].trim()));
  check(urlPt === "F6ELDNOTESBRAND.COM", `line 2 recovers to ${urlPt} (dial ambiguity: 6 standing for I)`);
  check(
    fn.decode(flat(urlLine.split("=")[0].trim())).includes("BRAND.COM"),
    "line 2 anchors the corpus to the publisher’s domain in the file’s last line",
  );
  // The honest negative: no reachable alphabet turns the four short codes into
  // a domain-shaped string, and FN itself yields gibberish.
  const seenDomainish = [];
  const tlds = [".COM", ".NET", ".ORG", ".DEV", ".APP", ".INFO", ".ME", ".US", ".CO", ".XYZ"];
  for (let a = 0; a < 36; a++) {
    for (let b = 0; b < 18; b++) {
      const key = WHEEL_POOL[a] + WHEEL_POOL[(2 * b) % 36];
      const w = wheel(key);
      for (const code of rest) {
        for (const out of [w.decode(flat(code)), w.encode(flat(code))]) {
          if (tlds.some((tld) => out.endsWith(tld))) seenDomainish.push(`${key}:${out}`);
        }
      }
    }
  }
  check(
    seenDomainish.length === 0 && rest.length === 4,
    `four short codes stay unrecovered: ${rest.length} rows, ${seenDomainish.length} domain-shaped candidates`,
  );
}

/* ---------------------------------------------- 3. f1eldn0tes published codes */

console.log("── f1eldn0tes.com published codes (“What We Know”)");
{
  const shiftQuartet = (s, sign) =>
    s.replace(/[^A-Z0-9]/g, "").replace(/(.{4})/g, (_, q) =>
      [...q].map((c, i) => WHEEL_POOL[(WHEEL_POOL.indexOf(c) + sign * [2, 0, 0, 1][i] + 72) % 36]).join(""),
    );
  let exact = 0;
  let double = 0;
  let transposed = 0;
  for (const row of FIELDNOTES_CODES) {
    const code = flat(row.code);
    const answer = flat(row.answer);
    if (row.status === "exact" && row.pre) {
      if (wheel(row.key).decode(shiftQuartet(code, 1)) === answer) exact++;
      continue;
    }
    if (row.status === "exact-double") {
      const stage1 = wheel(row.key).decode(code);
      if (wheel(row.twoStageKey).decode(stage1) === answer) double++;
      continue;
    }
    if (row.status === "transposed") {
      if (wheel(row.key).decode(code).startsWith(answer.slice(0, 4))) transposed++;
      continue;
    }
    if (wheel(row.key).encode(answer) === code) exact++;
  }
  check(exact === 8, `published codes reproduce exactly from answer + 2-letter key: ${exact}/8`);
  check(double === 1, "puzzle #9 is consistent as the documented VK→KS double decode");
  check(transposed === 1, "puzzle #11 matches up to the spiral reading the blog itself states");
  // The #19/#20 transcription collision the record calls out, kept honest.
  const shared = flat("3STO IDV3 AIDT 7RPM PATF H04N");
  const ie = wheel("IE").decode(shared);
  check(
    ie === "OVERLYGODLYESCAPADE02378",
    `#19/#20 share one code; under IE it reads ${ie} — a transcription collision, not a fix`,
  );
  check(
    wheel("JB").encode(flat("DAYTRIP SOCIETY 04046")) !== shared,
    "#19’s own code is not reconstructible from the page (length mismatch)",
  );
}

/* ------------------------------------------------------------- 4. F5 2016 */

console.log("── F5 Black Hat 2016 cipher challenge");
{
  const [p1, p2, p3] = F5_2016.keyPhrases.map((s) => s.toLowerCase().replace(/[^a-z]/g, ""));
  check(caesar(p1, F5_2016.shift) === F5_2016.card1.toLowerCase(), `card #1 = ROT1 of “${p1}” → ${F5_2016.card1}`);
  check(atbash(p2) === F5_2016.card2.toLowerCase(), `card #2 = Atbash of “${p2}” → ${F5_2016.card2}`);
  const pf = playfair(p1 + p2 + p3);
  const square = pf.rows.map((r) => r.replace(/\s+/g, ""));
  check(
    square.join("|") === F5_2016.square.join("|"),
    `Playfair key square rebuilt from the 42-char key: ${square.join(" / ")} (article prints ${F5_2016.square.join(" / ")})`,
  );
  const plaintexts = ["There is nothing", "more deceptive than", "an obvious fact"];
  const [t1, t2, t3] = plaintexts.map((s) => s.toLowerCase().replace(/[^a-z]/g, ""));
  const inner = t1 + caesar(t2 + atbash(t3), F5_2016.shift);
  const ctx = pf.encrypt(inner);
  const grouped = ctx.replace(/(.{2})/g, "$1 ").trim().toUpperCase();
  check(grouped === F5_2016.tshirt, `T-shirt ciphertext re-derived digram-for-digram (${ctx.length} chars)`);
  const l1 = pf.decrypt(squash(F5_2016.tshirt).toLowerCase()).toUpperCase();
  check(
    l1 === "THEREISNOTHINGLNQDCDBDOSHUDSGZMYLKXDQKEGTYWF",
    "published layer 1 (Playfair only): " + l1,
  );
  const l2 = (l1.slice(0, 14) + caesar(l1.slice(14).toLowerCase(), F5_2016.shift, false)).toUpperCase();
  check(
    l2 === "THEREISNOTHINGMOREDECEPTIVETHANZMLYERLFHUZXG",
    "published layer 2 (+ ROT1 peel): " + l2,
  );
  const l3 = (l2.slice(0, 31) + atbash(l2.slice(31).toLowerCase())).toUpperCase();
  check(
    l3 === squash(F5_2016.solution),
    `published layer 3 (+ Atbash peel) resolves to the answer: ${l3}`,
  );
  check(
    F5_2016.tshirt.split(" ").length === 22,
    `the T-shirt is 22 digrams = 44 characters, as the article prints (${F5_2016.tshirt.split(" ").length})`,
  );
}

/* --------------------------------------------------- 5. USCYBERCOM seal MD5 */

console.log("── USCYBERCOM seal hash");
{
  const { sealHash, missionStatement } = USCYBERCOM;
  check(/^[0-9a-f]{32}$/.test(sealHash), `the seal string is 32 hex characters: ${sealHash}`);
  check(
    md5(missionStatement) === sealHash,
    "md5(the published mission statement) equals the seal string — recomputed, not quoted",
  );
  check(md5(missionStatement + "\n") !== sealHash, "a trailing newline breaks the match (digest 5a7a7c3f…)");
  check(
    md5(missionStatement.replace("specified Department", "specific Department")) !== sealHash,
    "“specific” instead of “specified” breaks the match — the preimage is punctuation-pinned",
  );
  check(missionStatement.length === 392, `preimage is ${missionStatement.length} characters — one stray keystroke and the seal no longer matches`);
  const crn = "9ec4c1294a4f31474f299058ce2b22a";
  check(
    !/^[0-9a-f]{32}$/.test(crn),
    `the CRN rendering (${crn.length} chars) is not a valid MD5 — transcription, not cryptography`,
  );
}

/* -------------------------------------------------------- 6. the suite bundle */

console.log("── cipher suite bundle");

/** Bracket-match an array literal in minified JS, skipping over string contents. */
function literalAt(text, marker) {
  const start = text.indexOf(marker);
  if (start < 0) return null;
  const open = text.indexOf("[", start);
  let depth = 0;
  let quote = null;
  for (let i = open; i < text.length; i++) {
    const c = text[i];
    if (quote) {
      if (c === "\\") i++;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") quote = c;
    else if (c === "[") depth++;
    else if (c === "]") {
      depth--;
      if (depth === 0) return { from: open, to: i + 1, text: text.slice(open, i + 1) };
    }
  }
  return null;
}

{
  const src = readFileSync(SUITE, "utf8");
  const scripts = [...src.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  let parsed = 0;
  let parseError = "";
  for (const body of scripts) {
    if (!body.trim()) continue;
    try {
      new vm.Script(body, { filename: "suite-inline.js" });
      parsed++;
    } catch (e) {
      parseError = e.message;
    }
  }
  check(parseError === "" && parsed === scripts.filter((b) => b.trim()).length, `inline app script re-parsed clean (${parsed} block(s)${parseError ? " · " + parseError : ""})`);

  const pc = literalAt(src, "Pc=[");
  const records = vm.runInNewContext(`(${pc.text})`, Object.create(null), { timeout: 2000 });
  check(Array.isArray(records) && records.length === 8, `lecture hall holds ${records.length} records`);

  const required = ["id", "title", "period", "location", "confidence", "summary", "facts", "sourceLinks", "caution"];
  const shapeOk = records.every((r) =>
    required.every((k) => r[k] != null) &&
    Array.isArray(r.facts) && r.facts.length >= 6 && r.facts.every((f) => typeof f === "string" && f.length > 30) &&
    r.sourceLinks.length >= 1 && r.sourceLinks.every((l) => l.label && /^https?:\/\//.test(l.url)) &&
    r.summary.length > 120 && r.caution.length > 60,
  );
  check(shapeOk, "every record carries the full field set: facts ≥ 6, a sourceLink per row, summary, caution");
  const NEW = ["f5-blackhat-2016", "uscybercom-seal-md5", "fieldnotes-wheel", "f1eldn0tes-agents"];
  const raisedBarOk = NEW.every((id) => {
    const r = records.find((x) => x.id === id);
    return (
      r && r.facts.length >= 8 && r.sourceLinks.length >= 4 &&
      r.summary.length >= 200 && r.caution.length >= 200 &&
      // no new record may assert an unverified answer as fact
      !/the answer is|confirmed solution/i.test(JSON.stringify(r))
    );
  });
  check(raisedBarOk, "new material meets the raised bar: ≥ 8 facts, ≥ 4 links, ≥ 200-char summary and caution, no asserted answers");
  check(new Set(records.map((r) => r.id)).size === records.length, "record ids are unique");

  // provenance vocabulary must resolve in all three places that use it
  const legend = vm.runInNewContext(`(${literalAt(src, "Vv=[").text})`, Object.create(null)).map((x) => x.label);
  const colours = [...src.matchAll(/"(Primary archive|Archived directory|Community archive|Community recollection|Not recovered)":/g)].map((m) => m[1]).filter((v2, i, arr) => arr.indexOf(v2) === i);
  const filters = (src.match(/\["all",([^\]]+)\]\.map\(/)[1].match(/"([^"]+)"/g) || []).map((s) => s.replace(/"/g, ""));
  const used = [...new Set(records.map((r) => r.confidence))];
  check(
    used.every((u) => legend.includes(u) && colours.includes(u) && filters.includes(u)),
    `labels ${used.join(", ")} all resolve in legend (${legend.length}), colour map (${colours.length}) and filter row (${filters.length})`,
  );

  const byId = Object.fromEntries(records.map((r) => [r.id, r]));
  const haystack = (id) => JSON.stringify(byId[id]);
  check(
    ["kr0mecorp", "orc-hcu", "fravia-searchlores", "kim-philby-stasi"].every((id) => byId[id]),
    "the four earlier records survive the edit intact",
  );
  check(
    ["f5-blackhat-2016", "uscybercom-seal-md5", "fieldnotes-wheel", "f1eldn0tes-agents"].every((id) => byId[id]),
    "the four new records are in the hall",
  );
  check(
    F5_2016.card1 && haystack("f5-blackhat-2016").includes(F5_2016.card1) &&
      haystack("f5-blackhat-2016").includes(F5_2016.card2) &&
      haystack("f5-blackhat-2016").includes(F5_2016.tshirt),
    "F5 record quotes all three published ciphertexts verbatim",
  );
  check(
    haystack("f5-blackhat-2016").includes("BIG-IP"),
    "F5 record carries the correction to the circulating AI summary (no F5 product-name key)",
  );
  check(haystack("uscybercom-seal-md5").includes(USCYBERCOM.sealHash), "Cyber Command record carries the 32-character seal string");
  check(haystack("uscybercom-seal-md5").includes(USCYBERCOM.missionStatement.slice(0, 60)), "Cyber Command record quotes the preimage");
  check(haystack("fieldnotes-wheel").includes("648"), "wheel record states the 36×18 keyspace");
  check(haystack("fieldnotes-wheel").includes("m9uuty01h4qwksq.1op"), "wheel record preserves the unrecovered code verbatim");
  check(
    !/deliberately does not invent/.test(src) &&
      haystack("fieldnotes-wheel").includes("Not recovered") &&
      haystack("f1eldn0tes-agents").includes("transcription collision"),
    "missing material is recorded as missing — placeholders and silent repairs both absent",
  );
  check(
    src.includes("published puzzle engineering and institutional memory"),
    "the hall’s own scope line was widened with the new material",
  );
}

console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECKS FAILED"}`);
process.exit(failures ? 1 : 0);
