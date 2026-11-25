import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { test } from "node:test";
import { unzipSync } from "../vendor/fflate/index.mjs";

const root = path.resolve(import.meta.dirname, "..");
const appDir = path.join(root, "public", "apps", "headline-harry");
const html = readFileSync(path.join(appDir, "index.html"), "utf8");
const runtimeFiles = [
  "js-dos/emulators.js",
  "js-dos/js-dos.css",
  "js-dos/js-dos.js",
  "js-dos/wdosbox.js",
  "js-dos/wdosbox.wasm",
  "js-dos/wlibzip.js",
  "js-dos/wlibzip.wasm",
  "roms/headline-harry.jsdos",
  "icon.png",
  "manifest.toml",
  "webxdc.js",
];

test("Headline Harry stages a complete, local-only js-dos v8 runtime and game bundle", () => {
  for (const relative of runtimeFiles) {
    assert.ok(existsSync(path.join(appDir, relative)), `${relative} is missing from the offline app`);
  }
  assert.match(html, /<link[^>]+href=["']js-dos\/js-dos\.css["']/i);
  assert.match(html, /<script[^>]+src=["']js-dos\/js-dos\.js["']/i);
  assert.match(html, /url:\s*["']roms\/headline-harry\.jsdos["']/);
  assert.match(html, /pathPrefix:\s*["']js-dos\/["']/);
  assert.match(html, /autoStart:\s*true/);
  assert.doesNotMatch(html, /dosInstance\.run\s*\(/);

  const runtime = readFileSync(path.join(appDir, "js-dos", "js-dos.js"), "utf8");
  assert.match(runtime, /window\.Dos\s*=/, "the local player must define the function used by the Start button");
  assert.doesNotMatch(html, /https?:\/\/(?:v8\.)?js-dos\.com/i, "the page must not fall back to a remote runtime");

  const bundle = unzipSync(new Uint8Array(readFileSync(path.join(appDir, "roms", "headline-harry.jsdos"))));
  const config = bundle[".jsdos/dosbox.conf"];
  assert.ok(config, "the game archive contains its DOSBox startup configuration");
  const dosboxConf = new TextDecoder().decode(config);
  assert.match(dosboxConf, /^MAP\.EXE\s*$/mi, "the configured start path boots the recovered game program");
  assert.doesNotMatch(dosboxConf, /^INTRO\.EXE\s*$/mi, "the known stalled intro must remain bypassed");
});

test("the Start button invokes the js-dos v8 API with auto-start options", () => {
  const inlineScript = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .map(([, attributes, body]) => ({ attributes, body }))
    .find(({ attributes, body }) => !/\bsrc\s*=/.test(attributes) && body.includes("window.Dos(container, opts)"));
  assert.ok(inlineScript, "the page's real boot handler is present");

  const listeners = new Map();
  const queuedTimers = [];
  const status = { textContent: "" };
  const overlay = { style: { display: "flex" } };
  const canvas = {
    attrs: new Set(),
    focusCalls: 0,
    hasAttribute(name) { return this.attrs.has(name); },
    setAttribute(name) { this.attrs.add(name); },
    focus() { this.focusCalls += 1; },
  };
  const container = {
    addEventListener(type, listener) {
      const items = listeners.get(type) ?? [];
      items.push(listener);
      listeners.set(type, items);
    },
    querySelector(selector) { return selector === "canvas" ? canvas : null; },
  };
  const start = {
    textContent: "▶ BOOT THE PRESSROOM",
    addEventListener(type, listener) {
      const items = listeners.get(`start:${type}`) ?? [];
      items.push(listener);
      listeners.set(`start:${type}`, items);
    },
  };
  const elements = { status, overlay, "dosbox-container": container, start };
  const document = { getElementById(id) { return elements[id] ?? null; } };
  let calls = 0;
  let receivedOptions;
  const window = {
    Dos(receivedContainer, options) {
      calls += 1;
      assert.equal(receivedContainer, container);
      receivedOptions = options;
      return { getVersion: () => ["8.4.1"] };
    },
  };

  vm.runInNewContext(inlineScript.body, {
    document,
    window,
    setTimeout(callback) { queuedTimers.push(callback); return 1; },
    console: { error() {} },
  });
  const [startHandler] = listeners.get("start:click") ?? [];
  assert.equal(typeof startHandler, "function", "the start control has a click handler");
  startHandler();

  assert.equal(calls, 1);
  assert.equal(receivedOptions.url, "roms/headline-harry.jsdos");
  assert.equal(receivedOptions.pathPrefix, "js-dos/");
  assert.equal(receivedOptions.autoStart, true);
  assert.equal(receivedOptions.noCloud, true);
  assert.equal(overlay.style.display, "none");
  assert.match(status.textContent, /loading DOSBox/);
  assert.equal(queuedTimers.length, 1);
  queuedTimers[0]();
  assert.equal(canvas.focusCalls, 1);

  receivedOptions.onEvent("ci-ready");
  assert.match(status.textContent, /DOSBox ready/);
  assert.equal(canvas.focusCalls, 2);
  receivedOptions.onEvent("emu-error");
  assert.equal(overlay.style.display, "flex");
  assert.match(start.textContent, /RETRY/);
});
