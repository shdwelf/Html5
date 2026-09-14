/**
 * 13 · the AVR lab: js/avr-lab.js executed against the DOM stub with the ids
 * taken from avr-lab.html, so the page's own logic runs for real.
 *
 * What is asserted - and why each one is a bug class rather than a formality:
 *   - every id the controller asks for exists in the markup (strictIds on);
 *   - analyse() over the *vendored* Optiboot image reproduces the numbers
 *     tools/ghidra_avr.mjs and tools/verify_avrdis.mjs report, so the page
 *     cannot quietly disagree with the tools;
 *   - the page finds the dead SPM sites in do_spm and shows them as dead, and
 *     does not do that for Micronucleus, where every site is live;
 *   - the listing's symbol table is used to name functions when it is given and
 *     is not required when it is not;
 *   - junk input produces a message rather than an exception, and a truncated
 *     checksum does too.
 *
 * node tests/13-avr-lab.mjs
 */
import { readFileSync } from "node:fs";
import { suite, ROOT } from "./lib.mjs";
import { installDomStub } from "../tools/dom-stub.mjs";

const s = suite("13 · AVR lab page controller");

const html = readFileSync(`${ROOT}avr-lab.html`, "utf8");
const htmlIds = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);

const { document, byId } = installDomStub({ strictIds: true });
for (const id of htmlIds) {
  const el = document.createElement("div");
  el.id = id;
  if (id === "filter-sites") el.value = "all";
  if (id === "sample-select") el.value = "optiboot";
  if (id === "listing-select") el.value = "optiboot";
  document.body.appendChild(el);
}
s.ok("stub seeded every id from the markup", htmlIds.every((id) => document.getElementById(id) !== null),
  `${htmlIds.length} ids`);

const $ = (id) => document.getElementById(id);

// The controller refuses to fetch when there is no window, so importing it here
// wires the page and renders the empty state - the strictIds run.
let threw = null;
try {
  await import("../js/avr-lab.js");
} catch (err) {
  threw = err;
}
s.ok("controller ran to completion under the DOM stub", threw === null, threw ? String(threw.message || threw) : "");
s.ok("empty state is rendered before any image is loaded", $("status").textContent.includes("No image loaded"));

const { analyse } = await import("../js/avr-lab.js");

// ---------------------------------------------------------------- real images
const optibootHex = readFileSync(`${ROOT}samples/avr/optiboot_atmega328.hex`, "utf8");
const optibootLst = readFileSync(`${ROOT}samples/avr/optiboot_atmega328.lst`, "utf8");
const usbHex = readFileSync(`${ROOT}samples/avr/micronucleus_m328p_extclock.hex`, "utf8");

const bare = analyse(optibootHex);
s.ok("image parses to the vendored geometry",
  bare.ok && bare.base === 0x7e00 && bare.bytes === 512 && bare.words === 256 && bare.records === 33,
  bare.ok ? `0x${bare.base.toString(16)}, ${bare.bytes} bytes, ${bare.records} records` : bare.error);
s.ok("reset vector resolves to 0x7e04", bare.reset && bare.reset.target === 0x7e04,
  bare.reset ? `${bare.reset.kind} → 0x${bare.reset.target.toString(16)}` : "none");
s.ok("the walk reaches most of the image but not all of it",
  bare.reachable === 208 && bare.total === 243, `${bare.reachable} of ${bare.total}`);

const opt = analyse(optibootHex, optibootLst);
const optSpm = opt.byMnemonic.get("spm") || [];
const optDead = optSpm.filter((i) => !i.reachable);
s.ok("Optiboot has 6 SPM sites", optSpm.length === 6, `${optSpm.length}`);
s.ok("exactly the two do_spm SPM sites are dead",
  optDead.length === 2 && optDead.every((i) => (i.in || "").startsWith("do_spm")),
  optDead.map((i) => `0x${i.addr.toString(16)}${i.in ? ` <${i.in}>` : ""}`).join(" "));
s.ok("the dead sites are named from the listing's symbol table",
  optDead.every((i) => i.in !== null) && opt.symbols.size === 8, `${opt.symbols.size} symbols`);
s.ok("the reset vector is named `main`", opt.reset && opt.reset.in === "main", String(opt.reset && opt.reset.in));
s.ok("every WDR site is live", (opt.byMnemonic.get("wdr") || []).every((i) => i.reachable));
s.ok("no followed target leaves the image or misses an instruction",
  opt.strayTargets.length === 0, `${opt.strayTargets.length} stray`);

const usb = analyse(usbHex);
const usbSpm = usb.byMnemonic.get("spm") || [];
s.ok("Micronucleus parses to its own geometry", usb.ok && usb.base === 0x7a00 && usb.bytes === 1498,
  usb.ok ? `0x${usb.base.toString(16)}, ${usb.bytes} bytes` : usb.error);
s.ok("every Micronucleus SPM site is live (the dead-site result is not a walk artefact)",
  usbSpm.length === 5 && usbSpm.every((i) => i.reachable), `${usbSpm.length} sites`);
s.ok("a listing is optional", usb.symbols.size === 0 && usb.instructions.every((i) => i.in === null));

// ------------------------------------------------------------------- the page
const { render } = await import("../js/avr-lab.js");
render(opt);
s.ok("the status line reports the dead count", $("status").textContent.includes("dead self-programming site"),
  $("status").textContent);
s.ok("the summary shows the verified image size", $("summary").textContent.includes("512 bytes (256 words)"));
s.ok("the site table shows both dead do_spm sites as dead",
  ($("sites").textContent.match(/dead: no path/g) || []).length === 2,
  `${($("sites").textContent.match(/dead: no path/g) || []).length} dead rows`);
s.ok("the site table names do_spm", $("sites").textContent.includes("do_spm+0x6"));
s.ok("the disassembly renders the whole image by default",
  byId.get("disasm").children.length === opt.instructions.length,
  `${byId.get("disasm").children.length} rows`);

$("filter-sites").value = "sites";
render(opt);
s.ok("filtering to sites shows only SPM/LPM/ELPM/WDR rows",
  byId.get("disasm").children.length === opt.sites.length, `${byId.get("disasm").children.length} of ${opt.sites.length}`);
s.ok("the count line reflects the filter", $("disasm-count").textContent.includes(`of ${opt.instructions.length} shown`),
  $("disasm-count").textContent);

$("filter-sites").value = "dead";
render(opt);
s.ok("filtering to dead shows only unreachable instructions",
  byId.get("disasm").children.length === opt.instructions.filter((i) => !i.reachable).length,
  `${byId.get("disasm").children.length} rows`);
$("filter-sites").value = "all";

// ------------------------------------------------------------------- bad input
const junk = analyse("not a hex file at all");
s.ok("junk input is reported, not thrown", junk.ok === false && /no Intel HEX records/.test(junk.error), junk.error || "");
const badSum = analyse(":100000000C9434000C944F000C944F000C944F00FF");
s.ok("a bad checksum is refused", badSum.ok === false && /Intel HEX errors/.test(badSum.error), badSum.error || "");
const empty = analyse("");
s.ok("empty input is refused", empty.ok === false && /no Intel HEX records/.test(empty.error), String(empty.error));

render(null);
s.ok("rendering null returns to the empty state", $("status").textContent.includes("No image loaded"));
render({ ok: false, error: "boom" });
s.ok("an error report renders its message", $("status").textContent === "boom");

process.exit(s.done());
