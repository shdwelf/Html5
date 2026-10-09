// File input -> recipe -> save round-trip for the CyberChef kitchen.
//
// The README promises "file input and save". This exercises the real controls:
// a File pushed through #file-input's change handler must reach the recipe as
// raw bytes, and Save Output must hand the browser a blob that is
// byte-identical to the file that went in.
//
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
      window.confirm = () => true;   // "Output looks like Base64 — decode it?"
      window.prompt = () => null;
      window.HTMLCanvasElement.prototype.getContext = () => null;
      // Capture what the Save button hands to the browser instead of downloading.
      window.__saved = [];
      window.URL.createObjectURL = (blob) => { window.__saved.push(blob); return "blob:saved"; };
      window.URL.revokeObjectURL = () => undefined;
      window.HTMLAnchorElement.prototype.click = function () { window.__clicked = (window.__clicked || 0) + 1; };
    },
  });
}

const settle = () => new Promise((r) => setTimeout(r, 80));   // FileReader + bake are async

/** Binary content that is not valid UTF-8, so a text-only path would corrupt it. */
const BYTES = new Uint8Array([0x00, 0x01, 0xfe, 0xff, 0x89, 0x50, 0x4e, 0x47, 0x0a, 0x1a]);

async function loadFile(dom, bytes = BYTES, name = "sample.bin") {
  const { window } = dom;
  const input = window.document.getElementById("file-input");
  const file = new window.File([bytes], name, { type: "application/octet-stream" });
  Object.defineProperty(input, "files", { value: [file], configurable: true });
  input.dispatchEvent(new window.Event("change"));
  await settle();
}

test("the file controls exist and are wired up", () => {
  const dom = boot();
  try {
    const d = dom.window.document;
    for (const id of ["file-input", "btn-load-file", "btn-file-b64", "btn-save-out", "file-chip"]) {
      assert.ok(d.getElementById(id), `#${id} is missing`);
    }
    for (const id of ["btn-load-file", "btn-file-b64", "btn-save-out", "file-chip"]) {
      assert.equal(typeof d.getElementById(id).onclick, "function", `#${id} has no click handler`);
    }
  } finally { dom.window.close(); }
});

test("loading a file captures its bytes and locks the text input", async () => {
  const dom = boot();
  try {
    await loadFile(dom);
    const { window } = dom;
    const d = window.document;
    assert.ok(window.FILE_INPUT, "FILE_INPUT was not populated by the change handler");
    assert.equal(window.FILE_INPUT.name, "sample.bin");
    assert.equal(window.FILE_INPUT.size, BYTES.length);
    assert.equal(window.FILE_INPUT.bin.length, BYTES.length, "raw bytes are held for the recipe");
    assert.equal(d.getElementById("input").readOnly, true, "text input locks while a file is loaded");
    assert.match(d.getElementById("file-chip").textContent, /sample\.bin/, "the chip names the file");
    assert.match(d.getElementById("file-chip").textContent, /10 B/, "the chip shows the size");
    assert.notEqual(d.getElementById("file-chip").style.display, "none", "the chip is visible");
  } finally { dom.window.close(); }
});

test("Base64 of a loaded file matches Node byte for byte", async () => {
  const dom = boot();
  try {
    await loadFile(dom);
    dom.window.document.getElementById("btn-file-b64").click();
    await settle();
    const got = dom.window.document.getElementById("output").value.trim();
    assert.equal(got, Buffer.from(BYTES).toString("base64"));
  } finally { dom.window.close(); }
});

test("Save Output round-trips the file: File -> Base64 -> Save reproduces the original bytes", async () => {
  const dom = boot();
  try {
    await loadFile(dom);
    const d = dom.window.document;
    d.getElementById("btn-file-b64").click();
    await settle();
    d.getElementById("btn-save-out").click();
    await settle();

    const { window } = dom;
    assert.equal(window.__saved.length, 1, "exactly one blob was offered for download");
    const blob = window.__saved[0];
    const back = new Uint8Array(await blob.arrayBuffer());
    assert.ok(Buffer.from(back).equals(Buffer.from(BYTES)),
      `saved bytes differ from the loaded file (${back.length} vs ${BYTES.length} bytes)`);
    assert.equal(window.__clicked, 1, "the download anchor was clicked");
  } finally { dom.window.close(); }
});

test("unloading the file restores free text input", async () => {
  const dom = boot();
  try {
    await loadFile(dom);
    const d = dom.window.document;
    d.getElementById("file-chip").click();
    await settle();
    assert.equal(dom.window.FILE_INPUT, null);
    assert.equal(d.getElementById("input").readOnly, false);
    assert.equal(d.getElementById("input").value, "");
  } finally { dom.window.close(); }
});

test("Save Output with nothing baked reports an error instead of downloading", async () => {
  const dom = boot();
  try {
    const d = dom.window.document;
    d.getElementById("output").value = "";
    d.getElementById("btn-save-out").click();
    await settle();
    assert.match(d.getElementById("out-error").textContent, /Nothing to save/);
    assert.equal(dom.window.__saved.length, 0, "no blob is offered when there is nothing to save");
  } finally { dom.window.close(); }
});
