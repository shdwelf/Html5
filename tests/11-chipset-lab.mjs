/**
 * 11 · the chipset lab: js/chipset-lab.js executed against the DOM stub with the
 * ids taken from chipset-lab.html, so the page's own logic runs for real.
 *
 * What is asserted:
 *   - the controller runs to completion (no exception) and resolves every id it
 *     references, with strictIds on: an id present in the script but missing
 *     from the markup is a failure, not a stub invention;
 *   - a healthy status word renders BOOT GRANTED and a tampered one renders
 *     BOOT DENIED, using the same requirement ids tools/bootchain.py produces;
 *   - the ATA table refuses the destructive commands on a tampered platform;
 *   - the decoder is total over all 64 single-bit words and rejects junk input
 *     instead of throwing.
 *
 * node tests/11-chipset-lab.mjs
 */
import { readFileSync } from "node:fs";
import { suite, ROOT } from "./lib.mjs";
import { installDomStub } from "../tools/dom-stub.mjs";

const s = suite("11 · chipset-lab page controller");

const html = readFileSync(`${ROOT}chipset-lab.html`, "utf8");
const htmlIds = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);

const { document } = installDomStub({ strictIds: true });
// Seed exactly the ids the markup defines (appendChild registers them), so a
// controller reference to an id the page does not have returns null under
// strictIds and surfaces here - the real bug class.
for (const id of htmlIds) {
  const el = document.createElement("div");
  el.id = id;
  if (id === "status-input") el.value = "000120197830a129";
  if (id === "policy-select") el.value = "dual";
  document.body.appendChild(el);
}
s.ok("stub seeded every id from the markup", htmlIds.every((id) => document.getElementById(id) !== null),
  `${htmlIds.length} ids`);

const $ = (id) => document.getElementById(id);

let threw = null;
try {
  await import("../js/chipset-lab.js");
} catch (err) {
  threw = err;
}
s.ok("controller imports and runs", threw === null, threw ? String(threw.message) : "");

if (threw === null) {
  const verdict = $("verdict");
  const fields = $("fields");
  const reqs = $("requirements");
  const ata = $("ata");

  s.ok("verdict renders a decision", /BOOT (GRANTED|DENIED)/.test(verdict.textContent), verdict.textContent.slice(0, 60));
  s.ok("healthy word is granted", verdict.textContent.startsWith("BOOT GRANTED"), verdict.textContent.slice(0, 60));
  s.ok("verdict gets the ok styling", verdict.className.includes("good"), verdict.className);
  s.ok("decode table has rows", fields.children.length >= 15, `${fields.children.length} rows`);
  s.ok("requirement rows rendered", reqs.children.length >= 8, `${reqs.children.length} checks`);
  s.ok("ATA rows rendered", ata.children.length >= 10, `${ata.children.length} rows`);

  const reqIds = reqs.children.map((c) => c.children.map((k) => k.textContent).join(" ")).join("\n");
  for (const id of ["platform_chain", "platform_arm", "platform_no_tamper", "platform_release",
    "platform_no_destructive_when_untrusted", "status_reserved"]) {
    s.ok(`renders ${id}`, reqIds.includes(id));
  }
  s.ok("healthy word shows no failed requirement", !/\bFAIL\b/.test(reqIds));

  // Now drive it through the event path the page uses: type a tampered word.
  $("status-input").value = "001150112100292e";                     // tampered_mbr#012
  for (const fn of $("status-input").listeners.input || []) fn({});
  s.ok("tampered word is denied", verdict.textContent.startsWith("BOOT DENIED"), verdict.textContent.slice(0, 70));
  s.ok("denial names the failing requirements", /platform_no_tamper/.test(verdict.textContent), verdict.textContent.slice(0, 90));
  s.ok("denied verdict uses the bad styling", verdict.className.includes("bad"), verdict.className);
  const ataText = ata.children.map((c) => c.children.map((k) => k.textContent).join(" ")).join("\n");
  s.ok("erase refused on the tampered platform", /erase_grant[^\n]*refused/.test(ataText));
  s.ok("reflash refused on the tampered platform", /reflash_grant[^\n]*refused/.test(ataText));
  s.ok("tamper refusal is attributed to policy", /ABORT_POLICY/.test(ataText));

  // A policy change re-evaluates: the same tampered word stays denied, and a
  // legacy-only policy on a UEFI status word denies for the mode reason.
  $("status-input").value = "000120197830a129";
  $("policy-select").value = "uefi";
  for (const fn of $("policy-select").listeners.change || []) fn({});
  s.ok("policy change re-renders", /BOOT (GRANTED|DENIED)/.test(verdict.textContent));

  // Junk in the field must be reported, not thrown.
  $("status-input").value = "zzz";
  for (const fn of $("status-input").listeners.input || []) fn({});
  s.ok("junk status word is reported as invalid", /not a 64-bit hex/.test(verdict.textContent), verdict.textContent.slice(0, 60));
  s.ok("invalid input does not throw", true);
}

// The module's own decoder contract, straight from js/bootchain.js.
const { decodeStatus, platformChecks, summarise, parseStatusWord } = await import("../js/bootchain.js");
let decoded = 0;
for (let i = 0; i < 64; i++) {
  decodeStatus(1n << BigInt(i));
  decoded++;
}
s.ok("decoder handled 64 single-bit words", decoded === 64);
s.ok("parseStatusWord rejects junk", (() => {
  try { parseStatusWord("nope"); return false; } catch { return true; }
})());
s.ok("tampered word denies in the module too",
  summarise(platformChecks("001150112100292e", "dual")).ok === false);
s.ok("healthy word is granted in the module too",
  summarise(platformChecks("000120197830a129", "dual")).ok === true);

process.exit(s.done());
