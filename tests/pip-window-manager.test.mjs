import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { after, test } from "node:test";
import { unzipSync } from "../vendor/fflate/index.mjs";
import { attachPipWindow, preparePipWindows } from "../js/pip-window-manager.js";

const root = path.resolve(import.meta.dirname, "..");
const publicApps = path.join(root, "public", "apps");
const sharedManagerPath = path.join(publicApps, "_shared", "4dwm-window-manager.js");
const sharedManager = readFileSync(sharedManagerPath, "utf8");
const localManager = readFileSync(path.join(root, "js", "pip-window-manager.js"), "utf8");
const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
Object.defineProperty(globalThis, "window", {
  configurable: true,
  writable: true,
  value: { innerWidth: 320, innerHeight: 220 },
});

after(() => {
  if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow);
  else delete globalThis.window;
});

class FakeClassList {
  values = new Set();
  contains(value) { return this.values.has(value); }
  toggle(value) {
    if (this.values.has(value)) {
      this.values.delete(value);
      return false;
    }
    this.values.add(value);
    return true;
  }
}

class FakeElement {
  constructor({ tagName = "DIV", left = 25, top = 35, width = 180, height = 100 } = {}) {
    this.tagName = tagName;
    this.dataset = {};
    this.style = {};
    this.classList = new FakeClassList();
    this.listeners = new Map();
    this.attributes = new Map();
    this.textContent = "";
    this.bounds = { left, top, width, height };
    this.head = null;
    this.minimizeButton = null;
  }
  addEventListener(type, listener) {
    const handlers = this.listeners.get(type) ?? [];
    handlers.push(listener);
    this.listeners.set(type, handlers);
  }
  listenerCount(type) { return (this.listeners.get(type) ?? []).length; }
  dispatch(type, props = {}) {
    const event = {
      type,
      target: props.target ?? this,
      button: props.button ?? 0,
      pointerId: props.pointerId ?? 1,
      clientX: props.clientX ?? 0,
      clientY: props.clientY ?? 0,
      defaultPrevented: false,
      propagationStopped: false,
      preventDefault() { this.defaultPrevented = true; },
      stopPropagation() { this.propagationStopped = true; },
      ...props,
    };
    for (const listener of [...(this.listeners.get(type) ?? [])]) listener(event);
    return event;
  }
  querySelector(selector) {
    if (selector.includes("[data-min]")) return this.minimizeButton;
    if (selector.includes(".pip-head") || selector.includes(":scope > header")) return this.head;
    return null;
  }
  getBoundingClientRect() { return { ...this.bounds }; }
  setPointerCapture(pointerId) { this.capturedPointer = pointerId; }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  closest(selector) {
    if (this.tagName === "BUTTON" && selector.includes("button")) return this;
    return null;
  }
}

function makeFixture() {
  const pip = new FakeElement();
  const head = new FakeElement({ tagName: "HEADER" });
  const button = new FakeElement({ tagName: "BUTTON" });
  button.dataset.min = "";
  button.textContent = "–";
  pip.head = head;
  pip.minimizeButton = button;
  return { pip, head, button };
}

function openingTags(html) {
  return [...html.matchAll(/<([a-z][\w:-]*)\b([^>]*)>/gi)].map(([, name, attrs]) => ({ name, attrs }));
}

function hasAttribute(attrs, name) {
  return new RegExp(`(?:^|\\s)${name}(?:\\s|=|$)`, "i").test(attrs);
}

function classTokens(attrs) {
  const match = attrs.match(/\bclass\s*=\s*(["'])(.*?)\1/i);
  return match ? match[2].split(/\s+/) : [];
}

function appIndex(slug) {
  return readFileSync(path.join(publicApps, slug, "index.html"), "utf8");
}

function appText(slug, relativePath) {
  return readFileSync(path.join(publicApps, slug, relativePath), "utf8");
}

function packageFiles(relativePath) {
  const bytes = new Uint8Array(readFileSync(path.join(root, relativePath)));
  return unzipSync(bytes);
}

test("local PIP windows bind one drag/minimize handler and cancel cleanly", () => {
  const { pip, head, button } = makeFixture();
  assert.equal(attachPipWindow(pip), true);
  assert.equal(attachPipWindow(pip), false, "a second setup must be a no-op");
  assert.equal(pip.dataset.fourDwmDragBound, "true");
  assert.equal(head.listenerCount("pointerdown"), 1);
  assert.equal(head.listenerCount("pointermove"), 1);
  assert.equal(head.listenerCount("pointerup"), 1);
  assert.equal(head.listenerCount("pointercancel"), 1);
  assert.equal(head.listenerCount("lostpointercapture"), 1);
  assert.equal(button.listenerCount("click"), 1);
  assert.equal(button.getAttribute("aria-expanded"), "true");

  head.dispatch("pointerdown", { pointerId: 7, clientX: 45, clientY: 55 });
  assert.equal(head.capturedPointer, 7);
  assert.equal(pip.style.right, "auto");
  head.dispatch("pointermove", { pointerId: 8, clientX: 310, clientY: 210 });
  assert.equal(pip.style.left, undefined, "another pointer must not move the panel");
  head.dispatch("pointermove", { pointerId: 7, clientX: 310, clientY: 210 });
  assert.equal(pip.style.left, "260px");
  assert.equal(pip.style.top, "188px");

  head.dispatch("pointercancel", { pointerId: 7 });
  const canceledLeft = pip.style.left;
  head.dispatch("pointermove", { pointerId: 7, clientX: 30, clientY: 40 });
  assert.equal(pip.style.left, canceledLeft, "pointercancel must terminate a drag");

  head.dispatch("pointerdown", { pointerId: 9, clientX: 45, clientY: 55, target: button });
  head.dispatch("pointermove", { pointerId: 9, clientX: 100, clientY: 100 });
  assert.equal(pip.style.left, canceledLeft, "interactive controls must not start a drag");

  button.dispatch("click");
  assert.equal(pip.classList.contains("min"), true);
  assert.equal(button.textContent, "+");
  assert.equal(button.getAttribute("aria-expanded"), "false");
  assert.equal(button.getAttribute("aria-label"), "Restore window");
  button.dispatch("click");
  assert.equal(pip.classList.contains("min"), false);
  assert.equal(button.textContent, "−");
  assert.equal(button.getAttribute("aria-expanded"), "true");
  assert.equal(button.getAttribute("aria-label"), "Minimize window");
});

test("preparePipWindows discovers and idempotently prepares every panel in its root", () => {
  const fixtures = [makeFixture(), makeFixture()];
  const root = { querySelectorAll: (selector) => selector === ".pip" ? fixtures.map(({ pip }) => pip) : [] };
  preparePipWindows(root);
  preparePipWindows(root);
  for (const { pip, head, button } of fixtures) {
    assert.equal(pip.dataset.fourDwmDragBound, "true");
    assert.equal(head.listenerCount("pointerdown"), 1);
    assert.equal(button.listenerCount("click"), 1);
  }
});

test("all deployed 4DWM panels use one packaged local or shared manager", () => {
  const appDirs = readdirSync(publicApps, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== "_shared")
    .map((entry) => entry.name);
  const windowApps = [];

  for (const slug of appDirs) {
    const indexPath = path.join(publicApps, slug, "index.html");
    if (!existsSync(indexPath)) continue;
    const html = readFileSync(indexPath, "utf8");
    const tags = openingTags(html);
    const pips = tags.filter(({ attrs }) => classTokens(attrs).includes("pip"));
    const floating = tags.filter(({ attrs }) => hasAttribute(attrs, "data-4dwm-window"));
    const minimizeButtons = tags.filter(({ name, attrs }) => name.toLowerCase() === "button" && hasAttribute(attrs, "data-min"));
    if (!pips.length && !floating.length) continue;
    windowApps.push(slug);

    if (html.includes("4dwm-window-manager.js")) {
      assert.equal((html.match(/4dwm-window-manager\.js/g) ?? []).length, 1, `${slug}: one shared manager script`);
      assert.match(html, /src=["']\.\/js\/4dwm-window-manager\.js["']/i, `${slug}: local shared-manager URL`);
      assert.equal(appText(slug, "js/4dwm-window-manager.js"), sharedManager, `${slug}: shared copy drifted`);
      assert.equal(minimizeButtons.length, pips.length, `${slug}: each PIP has one collapse control`);
      assert.match(sharedManager, /dataset\.fourDwmDragBound === "true"/);
      assert.match(sharedManager, /pointercancel/);
      assert.match(sharedManager, /lostpointercapture/);
      assert.match(sharedManager, /classList\.toggle\("min"\)/);
      continue;
    }

    if (slug === "socal-subsurface-inlined") {
      assert.match(html, /fourDwmDragBound/, `${slug}: inlined drag guard missing`);
      assert.match(html, /pointercancel/, `${slug}: inlined cancel cleanup missing`);
      assert.equal(minimizeButtons.length, pips.length);
      continue;
    }

    const entryCandidates = [
      "city-subsurface.js",
      "socal-subsurface.js",
      "cheyenne.js",
      "four-corners.js",
      "ingress-intel.js",
    ];
    const entry = entryCandidates.find((name) => existsSync(path.join(publicApps, slug, "js", name)));
    assert.ok(entry, `${slug}: PIP markup has no recognized local manager entry`);
    const source = appText(slug, `js/${entry}`);
    assert.equal((source.match(/from ["']\.\/pip-window-manager\.js["']/g) ?? []).length, 1, `${slug}: one local-manager import`);
    assert.equal((source.match(/preparePipWindows\(\);/g) ?? []).length, 1, `${slug}: one local setup call`);
    assert.equal(appText(slug, "js/pip-window-manager.js"), localManager, `${slug}: local manager copy drifted`);
    assert.equal(minimizeButtons.length, pips.length, `${slug}: each PIP has one collapse control`);
  }

  assert.ok(windowApps.length >= 60, `expected a repository-wide audit, found ${windowApps.length} window apps`);
  assert.ok(windowApps.includes("dalton-race-4dwm"));
  assert.ok(windowApps.includes("sanborn-restaurant-4dwm"));
  assert.ok(windowApps.includes("socal-subsurface-inlined"));
});

test("regenerated 4DWM archives carry their window manager and have valid entry scripts", () => {
  const archives = [
    ["dalton-race-4dwm.xdc", "dalton-race-4dwm"],
    ["esgvrop-4dwm.xdc", "esgvrop-4dwm"],
    ["glendora-high-4dwm.xdc", "glendora-high-4dwm"],
    ["greeran-subsurface.xdc", "greeran-subsurface"],
    ["sanborn-restaurant-4dwm.xdc", "sanborn-restaurant-4dwm"],
    ["lawrence-subsurface.xdc", "lawrence-subsurface"],
    ["Georgia-subsurface.xdc", "Georgia-subsurface"],
    ["socal-subsurface.xdc", "socal-subsurface"],
    ["socal-subsurface-inlined.xdc", "socal-subsurface-inlined"],
    ["cheyenne.xdc", "cheyenne"],
    ["four-corners.xdc", "four-corners"],
    ["ingress-intel.xdc", "ingress-intel"],
  ];

  for (const [archiveName, slug] of archives) {
    const files = packageFiles(archiveName);
    assert.ok(files["index.html"], `${archiveName}: index.html missing`);
    assert.ok(files["manifest.toml"], `${archiveName}: manifest missing`);
    const html = new TextDecoder().decode(files["index.html"]);
    if (slug === "socal-subsurface-inlined") {
      assert.match(html, /fourDwmDragBound/, `${archiveName}: inlined local manager missing`);
      assert.match(html, /pointercancel/, `${archiveName}: inlined cancel cleanup missing`);
    } else {
      assert.ok(files["js/pip-window-manager.js"] || files["js/4dwm-window-manager.js"], `${archiveName}: packaged window manager missing`);
    }
    assert.doesNotMatch(html, /src=["']\.\/["']js\//, `${slug}: malformed relative script URL`);
  }
});
