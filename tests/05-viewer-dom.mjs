/**
 * 05 · the real js/viewer.js booted in jsdom: rack rendering, the generalised
 * length switch, the invert invariants, the measured flip sweep, card behaviour
 * and the custom bit length — driven through the actual event handlers.
 *
 * Only the WebGL backend and the canvas rasteriser are stubbed; viewer.js,
 * formal.js, lens-draw.js, bip39.js and wasm/entropy.wasm all run for real.
 *
 * node --import ./tests/stubs/register.mjs tests/05-viewer-dom.mjs
 * (needs jsdom: npm i --no-save jsdom)
 */
import { readFileSync } from "fs";
import { createRequire } from "module";
import { suite, ROOT } from "./lib.mjs";

const require = createRequire(import.meta.url);
let JSDOM;
try {
  ({ JSDOM } = require("jsdom"));
} catch {
  console.log("05 · viewer DOM: SKIPPED (jsdom not installed — npm i --no-save jsdom)");
  process.exit(0);
}

const s = suite("05 · viewer.js in a DOM");
const html = readFileSync(ROOT + "keyspace.html", "utf8");
const dom = new JSDOM(html, { url: "http://localhost:8000/keyspace.html" });
const { window } = dom;

/* canvas rasteriser double */
function ctx2d() {
  const noop = () => {};
  return new Proxy({
    measureText: (t) => ({ width: String(t).length * 5 }),
    createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }),
    putImageData: noop, drawImage: noop,
  }, { get: (t, k) => (k in t ? t[k] : noop), set: () => true });
}
window.HTMLCanvasElement.prototype.getContext = function (kind) { return kind === "2d" ? ctx2d() : null; };

/* the globals viewer.js expects from a browser */
globalThis.window = window;
globalThis.document = window.document;
try { Object.defineProperty(globalThis, "navigator", { value: window.navigator, configurable: true }); } catch { /* read-only on Node 22; viewer.js does not use it */ }
globalThis.matchMedia = () => ({ matches: false, addEventListener() {} });
globalThis.innerWidth = 1280;
globalThis.innerHeight = 900;
globalThis.devicePixelRatio = 2;
globalThis.requestAnimationFrame = () => 0;
globalThis.cancelAnimationFrame = () => {};
globalThis.addEventListener = () => {};
// In a browser visualViewport is a window property (possibly undefined);
// without this line it is an undeclared identifier in Node and throws.
globalThis.visualViewport = undefined;
globalThis.fetch = async (u) => {
  const buf = readFileSync(ROOT + String(u).replace(/^\.\//, ""));
  return { ok: true, arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) };
};

const errors = [];
process.on("unhandledRejection", (e) => errors.push("unhandledRejection: " + (e?.stack || e)));

const $ = (id) => window.document.getElementById(id);
const settle = (ms = 60) => new Promise((r) => setTimeout(r, ms));
const click = (el) => el.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
async function until(fn, ms, label) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { if (fn()) return true; await settle(25); }
  throw new Error("timeout waiting for " + label);
}

console.log("\n[boot] importing js/viewer.js");
await import(new URL("../js/viewer.js", import.meta.url).href);
await until(() => $("status").textContent !== "Loading engine…", 20000, "engine boot");

console.log("\n[1] boot state");
s.ok("status: " + $("status").textContent.slice(0, 40), /Checksum valid/.test($("status").textContent));
s.eq("chips rendered", $("chips").querySelectorAll(".chip").length, 12);
s.ok("wcNote states the layout", /132 bits = 128 ENT \+ 4 CS/.test($("wcNote").textContent), $("wcNote").textContent);
s.eq("rack rows = all lenses", $("lensRack").querySelectorAll("[data-lens]").length, 72);
s.ok("default focus", $("lensName").textContent === "Invert · affine subcube", $("lensName").textContent);
s.eq("3-D forms listed", $("formSel").options.length, 13);
s.eq("tape rows", $("tape").querySelectorAll("tbody tr").length, 12);
s.ok("entropy hex shown", /^[0-9a-f]{32}$/.test($("hex").textContent), $("hex").textContent);

console.log("\n[2] switch to 25 words through the UI");
$("wc").value = "25";
$("wc").dispatchEvent(new window.Event("change", { bubbles: true }));
s.ok("wcNote: " + $("wcNote").textContent.slice(0, 56), /275 bits = 264 ENT \+ 11 CS/.test($("wcNote").textContent) && /generalised/.test($("wcNote").textContent));
click($("gen"));
await until(() => $("chips").querySelectorAll(".chip").length === 25, 20000, "25-word generate");
s.eq("chips after switch", $("chips").querySelectorAll(".chip").length, 25);
s.ok("status flags the generalised rule", /Checksum valid · generalised/.test($("status").textContent), $("status").textContent.slice(0, 56));
s.eq("entropy hex nibbles", $("hex").textContent.length, 66);

console.log("\n[3] invert layers");
click($("genB"));
await until(() => /B ·/.test($("statusB").textContent), 20000, "sample B");
s.ok("B validates", /Checksum valid/.test($("statusB").textContent), $("statusB").textContent.slice(0, 44));
s.ok("d(A,B) filled", /^\d+ \/ 264$/.test($("invHam").textContent), $("invHam").textContent);
s.ok("subcube size filled", /^2\^\d+$/.test($("invSub").textContent), $("invSub").textContent);
click($("notA"));
await until(() => $("invHam").textContent === "264 / 264", 20000, "B <- phrase of ¬A");
s.ok("d(A,¬A) = all 264 bits", $("invHam").textContent === "264 / 264", $("invHam").textContent);
s.ok("d(¬A,B) = 0", $("invComp").textContent === "0", $("invComp").textContent);
s.ok("geodesics = 264!", $("invGeo").textContent === "264!", $("invGeo").textContent);
s.ok("note explains the subcube", /subcube S\(A,B\) holds 2\^264/.test($("invertNote").textContent));

console.log("\n[4] the differential lens runs the real 264-bit sweep");
click($("lensRack").querySelector('[data-lens="differential"] [data-act="toggle"]'));
await until(() => /Predict/.test($("lensPredict").textContent), 90000, "flip sweep + panel");
const rows = [...$("lensRows").querySelectorAll("tr")].map((tr) => tr.textContent.replace(/\s+/g, " ").trim());
s.ok("bits probed = 264", rows.some((r) => /bits probed\s*264/.test(r)), rows.find((r) => /bits probed/.test(r)));
s.ok("max change ≤ 2 words", rows.some((r) => /^max\s*[12] words/.test(r)), rows.find((r) => /^max/.test(r)));
s.ok("prediction confirmed against measurement", /Confirmed/.test($("lensPredict").textContent), $("lensPredict").textContent.slice(0, 84));
s.ok("lens canvas visible", $("lensCanvas").hidden === false);

console.log("\n[5] a card hides the canvas rather than faking geometry");
click($("lensRack").querySelector('[data-lens="lambda-typed"] [data-act="focus"]'));
await until(() => $("lensName").textContent === "typed λ-calculus", 5000, "card focus");
s.ok("kind tag = card", $("lensKind").textContent === "card" && $("lensKind").className.includes("card"));
s.ok("canvas hidden", $("lensCanvas").hidden === true);
s.ok("describe says why it is a card", /dependent/.test($("lensDescribe").textContent), $("lensDescribe").textContent.slice(0, 70));
s.ok("explain says there is no geometry to fake", /no keyspace geometry/.test($("lensExplain").textContent));

console.log("\n[6] toggle (dot) and focus (name) are separate intents");
const rowD = $("lensRack").querySelector('[data-lens="differential"]');
s.ok("differential is on but not focused", rowD.className.includes("on") && !rowD.className.includes("focus"), rowD.className);
s.ok("aria-pressed=true while on", rowD.querySelector('[data-act="toggle"]').getAttribute("aria-pressed") === "true");
click($("lensRack").querySelector('[data-lens="umbral"] [data-act="focus"]'));
await until(() => $("lensName").textContent === "umbral calculus", 5000, "focus umbral");
const before = $("lensRack").querySelectorAll(".layer-row.on").length;
click($("lensRack").querySelector('[data-lens="differential"] [data-act="toggle"]'));
await settle(80);
s.ok("dot switches an unfocused layer off", $("lensRack").querySelectorAll(".layer-row.on").length === before - 1, `${before} -> ${$("lensRack").querySelectorAll(".layer-row.on").length}`);
s.ok("focus stayed on umbral", $("lensName").textContent === "umbral calculus");
s.ok("aria-pressed=false after toggle", $("lensRack").querySelector('[data-lens="differential"] [data-act="toggle"]').getAttribute("aria-pressed") === "false");
click($("lensRack").querySelector('[data-lens="boolean"] [data-act="toggle"]'));
await until(() => $("lensName").textContent === "Boolean calculus", 30000, "toggle-on focuses");
s.ok("toggling on also focuses", $("lensName").textContent === "Boolean calculus", $("lensName").textContent);

console.log("\n[7] custom bit length: 56-bit ENT = 6 words");
$("wc").value = "custom";
$("wc").dispatchEvent(new window.Event("change", { bubbles: true }));
s.ok("custom row revealed", $("customRow").hidden === false);
$("customBits").value = "56";
$("customBits").dispatchEvent(new window.Event("input", { bubbles: true }));
s.ok("wcNote: " + $("wcNote").textContent.slice(0, 56), /66 bits = 56 ENT \+ 10 CS/.test($("wcNote").textContent));
click($("gen"));
await until(() => $("chips").querySelectorAll(".chip").length === 6, 20000, "56-bit generate");
s.eq("chips for 56-bit entropy", $("chips").querySelectorAll(".chip").length, 6);
s.ok("status valid", /Checksum valid/.test($("status").textContent), $("status").textContent.slice(0, 46));

console.log("\n[8] no uncaught errors during the run");
s.ok("errors: " + (errors[0] ?? "none"), errors.length === 0, errors.slice(0, 2).join(" | "));

process.exit(s.done() || errors.length ? 1 : 0);
