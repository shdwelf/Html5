/** UI/race doubles, distinct from real cryptography and Chromium controls. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { webcrypto } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { JSDOM } from "jsdom";
import * as pgp from "openpgp";
import { mountWorkbench } from "../apps/openpgp-workbench/app.js";
import { RECOVERY_LIMITS, RecoveryError } from "../apps/openpgp-workbench/recovery.mjs";
import { PUBLIC_STORAGE_KEY } from "../apps/openpgp-workbench/public-storage.mjs";

const html = readFileSync(new URL("../apps/openpgp-workbench/index.html", import.meta.url), "utf8");
const armor = "-----BEGIN PGP PRIVATE KEY BLOCK-----\nsynthetic UI protocol double only\n-----END PGP PRIVATE KEY BLOCK-----";
const fingerprint = "A".repeat(40), identity = { fingerprint, version: 4, secretPackets: 2, profile: "v4-25519" };
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
async function until(predicate) { for (let i = 0; i < 200; i++) { if (predicate()) return; await delay(5); } assert.fail("recovery UI did not settle"); }
function boot({ tools, secure = true, useRealClient = false } = {}) {
  const dom = new JSDOM(html, { url: "https://example.test/apps/openpgp-workbench/" }), view = dom.window, doc = view.document;
  Object.defineProperty(view, "isSecureContext", { value: secure }); Object.defineProperty(view.crypto, "subtle", { value: webcrypto.subtle });
  const inspectCalls = [], recoveryCalls = [], downloads = [], clipboard = [];
  view.URL.createObjectURL = () => { downloads.push("unexpected download"); return "blob:synthetic"; }; view.URL.revokeObjectURL = () => {};
  view.HTMLAnchorElement.prototype.click = () => {};
  Object.defineProperty(view.navigator, "clipboard", { value: { writeText: async (value) => { clipboard.push(value); } } });
  const recoveryTools = {
    inspectRecoveryKey: async (...args) => { inspectCalls.push(args); return tools?.inspectRecoveryKey ? tools.inspectRecoveryKey(...args) : identity; },
    recoverPrivateKeyCandidates: async (...args) => { recoveryCalls.push([args[0], args[1], [...args[2]], args[3]]); return tools?.recoverPrivateKeyCandidates ? tools.recoverPrivateKeyCandidates(...args) : { status: "matched", index: 1, attempted: 2, total: 2, fingerprint, secretPackets: 2 }; },
  };
  const api = mountWorkbench({ doc, view, ...(!useRealClient ? { recoveryTools } : {}) });
  const get = (id) => doc.getElementById(id), event = (id, type) => get(id).dispatchEvent(new view.Event(type, { bubbles: true, cancelable: true }));
  const input = (id, value) => { get(id).value = value; event(id, "input"); };
  const fill = () => { input("recovery-private-key", armor); input("recovery-wordlist", "cut\ncat\ncat"); input("recovery-hint", "cat"); };
  const preview = async () => { event("recovery-form", "submit"); await until(() => !get("recovery-preview").disabled); };
  const consent = () => { input("recovery-fingerprint", fingerprint); get("recovery-owner-ack").click(); };
  const file = (id, entry) => { Object.defineProperty(get(id), "files", { configurable: true, value: [entry] }); event(id, "change"); };
  return { dom, view, doc, api, get, event, input, fill, preview, consent, file, inspectCalls, recoveryCalls, downloads, clipboard };
}
const close = (ui) => { ui.api.clearAll(); ui.view.close(); };
const fileBytes = (text) => { const bytes = new TextEncoder().encode(text); return { size: bytes.byteLength, arrayBuffer: async () => bytes.buffer.slice(0) }; };

test("initial recovery is empty/default-off, makes no worker request, and never offers a secret download/copy", () => {
  const ui = boot();
  try {
    assert.deepEqual(ui.inspectCalls, []); assert.deepEqual(ui.recoveryCalls, []);
    for (const id of ["recovery-private-key", "recovery-wordlist", "recovery-hint", "recovery-fingerprint", "recovery-match"]) assert.equal(ui.get(id).value, "");
    for (const id of ["recovery-owner-ack", "recovery-variants", "recovery-reveal-preview"]) assert.equal(ui.get(id).checked, false);
    assert.equal(ui.get("recovery-start").disabled, true); assert.equal(ui.get("recovery-stop").disabled, true);
    assert.equal(ui.get("recovery-match").hidden, true);
    assert.equal(ui.doc.querySelector('#recovery-panel [data-copy], #recovery-panel [data-download]'), null);
    assert.equal(ui.view.localStorage.length, 0); assert.equal(ui.downloads.length, 0); assert.equal(ui.clipboard.length, 0);
  } finally { close(ui); }
});

test("preview precedes attempts, values stay hidden until reveal, full fingerprint/permission gate Start and inputs clear on dispatch", async () => {
  const pending = deferred(); let control;
  const ui = boot({ tools: { recoverPrivateKeyCandidates: (_key, _expected, _candidates, controls) => { control = controls; return pending.promise; } } });
  try {
    ui.fill(); await ui.preview();
    assert.equal(ui.inspectCalls.length, 1); assert.equal(ui.recoveryCalls.length, 0);
    assert.match(ui.get("recovery-summary").textContent, /2 candidates.*2 ranked.*1 exact duplicate/);
    assert.equal(ui.get("recovery-candidates").children.length, 2); assert.doesNotMatch(ui.get("recovery-candidates").textContent, /\bcat\b|\bcut\b/);
    assert.equal(ui.get("recovery-start").disabled, true);
    ui.get("recovery-reveal-preview").click(); assert.match(ui.get("recovery-candidates").textContent, /cat.*cut/);
    ui.get("recovery-reveal-preview").click(); assert.doesNotMatch(ui.get("recovery-candidates").textContent, /\bcat\b/);
    ui.get("recovery-owner-ack").click(); ui.input("recovery-fingerprint", "B".repeat(40)); ui.get("recovery-start").click();
    assert.equal(ui.recoveryCalls.length, 0); assert.match(ui.get("recovery-status").textContent, /exact full/);
    ui.input("recovery-fingerprint", fingerprint.toLowerCase()); ui.get("recovery-start").click();
    assert.equal(ui.recoveryCalls.length, 1); assert.deepEqual(ui.recoveryCalls[0].slice(0, 3), [armor, fingerprint, ["cat", "cut"]]);
    for (const id of ["recovery-private-key", "recovery-wordlist", "recovery-hint"]) assert.equal(ui.get(id).value, "");
    assert.equal(ui.get("recovery-candidates").children.length, 0); assert.equal(ui.get("recovery-preview").disabled, true); assert.equal(ui.get("recovery-stop").disabled, false);
    control.onProgress({ attempted: 1, total: 2 }); assert.match(ui.get("recovery-progress-count").textContent, /1 \/ 2/);
    pending.resolve({ status: "matched", index: 1, attempted: 2, total: 2, fingerprint, secretPackets: 2 });
    await until(() => ui.get("recovery-status").dataset.kind === "success");
    assert.equal(ui.get("recovery-match").value, ""); assert.equal(ui.get("recovery-match").hidden, true);
    assert.equal(ui.get("recovery-start").disabled, true, "no automatic retry or reused stale plan");
    ui.get("recovery-reveal-match").click(); assert.equal(ui.get("recovery-match").value, "cut"); assert.equal(ui.get("recovery-match").hidden, false);
    ui.get("recovery-reveal-match").click(); assert.equal(ui.get("recovery-match").value, "");
    assert.equal(ui.view.localStorage.length, 0); assert.equal(ui.get("keyring-list").children.length, 0); assert.deepEqual(ui.downloads, []); assert.deepEqual(ui.clipboard, []);
  } finally { close(ui); }
});

test("a preview never implicitly includes the hint; variants are explicit and untrusted candidates render as text", async () => {
  const ui = boot();
  try {
    ui.input("recovery-private-key", armor); ui.input("recovery-hint", "cat"); await ui.preview();
    assert.equal(ui.inspectCalls.length, 0); assert.equal(ui.get("recovery-status").dataset.kind, "error");
    ui.get("recovery-variants").click(); await ui.preview();
    assert.equal(ui.inspectCalls.length, 1); assert.ok(ui.get("recovery-candidates").children.length > 1);
    ui.get("recovery-clear").click();
    ui.input("recovery-private-key", armor); ui.input("recovery-wordlist", '<img id="candidate-xss" src=x onerror="alert(1)">'); await ui.preview();
    ui.get("recovery-reveal-preview").click();
    assert.equal(ui.get("candidate-xss"), null); assert.match(ui.get("recovery-candidates").textContent, /<img/);
    assert.equal(ui.view.localStorage.length, 0);
  } finally { close(ui); }
});

test("edits/options invalidate the preview; programmatic edits without an input event are rechecked before Start", async () => {
  const ui = boot();
  try {
    ui.fill(); await ui.preview(); ui.input("recovery-hint", "cut");
    assert.equal(ui.get("recovery-start").disabled, true); assert.equal(ui.get("recovery-candidates").children.length, 0);
    await ui.preview(); ui.consent(); ui.get("recovery-wordlist").value = "changed without an event"; ui.get("recovery-start").click();
    assert.match(ui.get("recovery-status").textContent, /no longer match/); assert.equal(ui.recoveryCalls.length, 0);
    ui.fill(); await ui.preview(); ui.get("recovery-variants").click(); assert.equal(ui.get("recovery-start").disabled, true);
  } finally { close(ui); }
});

test("Clear/Stop cancel preview, suppress late success/errors and cannot let an older finally clobber a newer pending preview", async () => {
  const first = deferred(), second = deferred(); let calls = 0;
  const ui = boot({ tools: { inspectRecoveryKey: () => (++calls === 1 ? first.promise : second.promise) } });
  try {
    ui.fill(); ui.event("recovery-form", "submit"); const oldSignal = ui.inspectCalls[0][1].signal;
    ui.get("recovery-stop").click(); assert.equal(oldSignal.aborted, true);
    assert.match(ui.get("recovery-status").textContent, /No candidate attempts/);
    ui.event("recovery-form", "submit");
    first.reject(new Error("synthetic private dependency diagnostic must not appear")); await delay(10);
    assert.equal(ui.get("recovery-preview").disabled, true); assert.equal(ui.get("recovery-stop").disabled, false);
    assert.match(ui.get("recovery-status").textContent, /No passphrases are being tried/);
    second.resolve(identity); await until(() => !ui.get("recovery-preview").disabled);
    assert.match(ui.get("recovery-summary").textContent, /2 candidates/);
    ui.get("recovery-clear").click(); assert.equal(ui.get("recovery-private-key").value, ""); assert.equal(ui.get("recovery-candidates").children.length, 0);
  } finally { close(ui); }
});

test("Stop during attempts keeps only completed counts, aborts worker and discards late progress/matches without a retry", async () => {
  const pending = deferred(); let control;
  const ui = boot({ tools: { recoverPrivateKeyCandidates: (_key, _fp, _candidates, controls) => { control = controls; return pending.promise; } } });
  try {
    ui.fill(); await ui.preview(); ui.consent(); ui.get("recovery-start").click(); control.onProgress({ attempted: 1, total: 2 });
    ui.get("recovery-stop").click(); assert.equal(control.signal.aborted, true);
    assert.match(ui.get("recovery-status").textContent, /Stopped: 1\/2.*not a completed\/exhausted/);
    control.onProgress({ attempted: 2, total: 2 }); pending.resolve({ status: "matched", index: 1, attempted: 2, total: 2, fingerprint, secretPackets: 2 }); await delay(10);
    assert.match(ui.get("recovery-progress-count").textContent, /1 \/ 2/); assert.equal(ui.get("recovery-match").value, ""); assert.equal(ui.get("recovery-reveal-match").hidden, true);
    assert.equal(ui.recoveryCalls.length, 1); assert.equal(ui.get("recovery-start").disabled, true);
  } finally { close(ui); }
});

test("timeout/no-match messages stay distinct, expose no guessed value and never retry automatically", async () => {
  for (const fail of [false, true]) {
    const ui = boot({ tools: { recoverPrivateKeyCandidates: async () => {
      if (fail) throw new RecoveryError("TIMEOUT");
      return { status: "not-found", attempted: 2, total: 2, fingerprint, secretPackets: 2 };
    } } });
    try {
      ui.fill(); await ui.preview(); ui.consent(); ui.get("recovery-start").click(); await until(() => !ui.get("recovery-preview").disabled);
      assert.match(ui.get("recovery-status").textContent, fail ? /time limit.*not an exhausted search/i : /bounded plan is exhausted, not all possible/);
      assert.doesNotMatch(ui.get("recovery-status").textContent, /\bcat\b|\bcut\b/); assert.equal(ui.get("recovery-start").disabled, true);
      assert.equal(ui.recoveryCalls.length, 1); assert.equal(ui.get("recovery-reveal-match").hidden, true);
    } finally { close(ui); }
  }
});

test("file reads are bounded before I/O, reject malformed UTF-8, preserve exact whitespace and cannot undo clear or a newer edit", async () => {
  const ui = boot(); let reads = 0;
  try {
    ui.file("recovery-key-file", { size: RECOVERY_LIMITS.keyBytes + 1, arrayBuffer: () => { reads++; } });
    await until(() => ui.get("recovery-status").dataset.kind === "error"); assert.equal(reads, 0);
    ui.file("recovery-wordlist-file", { size: RECOVERY_LIMITS.wordlistBytes + 1, arrayBuffer: () => { reads++; } }); assert.equal(reads, 0);
    ui.file("recovery-wordlist-file", { size: 1, arrayBuffer: async () => Uint8Array.of(0xff).buffer });
    await until(() => !ui.get("recovery-preview").disabled); assert.equal(ui.get("recovery-wordlist").value, ""); assert.equal(ui.get("recovery-status").dataset.kind, "error");
    const pending = deferred(); ui.file("recovery-wordlist-file", { size: 3, arrayBuffer: () => pending.promise });
    assert.equal(ui.get("recovery-preview").disabled, true); ui.input("recovery-wordlist", "newer exact guess"); pending.resolve(new TextEncoder().encode("old").buffer); await delay(5);
    assert.equal(ui.get("recovery-wordlist").value, "newer exact guess");
    const cleared = deferred(); ui.file("recovery-key-file", { size: 100, arrayBuffer: () => cleared.promise }); ui.get("recovery-clear").click();
    cleared.resolve(new TextEncoder().encode(armor).buffer); await delay(5); assert.equal(ui.get("recovery-private-key").value, "");
    ui.file("recovery-wordlist-file", fileBytes("\ufeff a \r\n b ")); await until(() => !ui.get("recovery-preview").disabled);
    assert.equal(ui.get("recovery-wordlist").value, "\ufeff a \n b ");
    ui.file("recovery-key-file", fileBytes(armor)); await until(() => !ui.get("recovery-preview").disabled);
    assert.equal(ui.get("recovery-private-key").value, armor); assert.equal(ui.inspectCalls.length, 0);
  } finally { close(ui); }
});

test("pagehide/global Clear remove recovery fields, match and pending operations; beforeunload recognizes unsaved recovery input", async () => {
  const pending = deferred();
  const ui = boot({ tools: { recoverPrivateKeyCandidates: () => pending.promise } });
  try {
    const empty = new ui.view.Event("beforeunload", { cancelable: true }); ui.view.dispatchEvent(empty); assert.equal(empty.defaultPrevented, false);
    ui.fill(); const sensitive = new ui.view.Event("beforeunload", { cancelable: true }); ui.view.dispatchEvent(sensitive); assert.equal(sensitive.defaultPrevented, true);
    await ui.preview(); ui.consent(); ui.get("recovery-start").click(); const controls = ui.recoveryCalls[0][3];
    ui.view.dispatchEvent(new ui.view.Event("pagehide")); assert.equal(controls.signal.aborted, true);
    for (const id of ["recovery-private-key", "recovery-wordlist", "recovery-hint", "recovery-fingerprint", "recovery-match"]) assert.equal(ui.get(id).value, "");
    pending.resolve({ status: "matched", index: 1, attempted: 2, total: 2, fingerprint, secretPackets: 2 }); await delay(10);
    assert.equal(ui.get("recovery-reveal-match").hidden, true);
    ui.fill(); await ui.preview(); ui.get("clear-all").click(); assert.equal(ui.get("recovery-candidates").children.length, 0);
    const cleared = new ui.view.Event("beforeunload", { cancelable: true }); ui.view.dispatchEvent(cleared); assert.equal(cleared.defaultPrevented, false);
  } finally { close(ui); }
});

test("recovery success/clear never enters or modifies the opted-in PUBLIC keyring/snapshot, and navigation preserves only that public copy", async () => {
  const ui = boot();
  try {
    const generated = await pgp.generateKey({ type: "ecc", curve: "curve25519Legacy", userIDs: [{ name: "Synthetic independent PUBLIC remembering control" }] });
    ui.input("public-key-input", generated.publicKey); ui.event("keyring-import-form", "submit"); await until(() => ui.get("keyring-list").children.length === 1);
    ui.get("remember-public-keyring").click(); const publicSnapshot = ui.view.localStorage.getItem(PUBLIC_STORAGE_KEY);
    ui.fill(); await ui.preview(); ui.consent(); ui.get("recovery-start").click(); await until(() => ui.get("recovery-status").dataset.kind === "success");
    ui.get("recovery-reveal-match").click(); assert.equal(ui.get("recovery-match").value, "cut");
    ui.get("recovery-clear").click(); assert.equal(ui.get("recovery-match").value, "");
    assert.equal(ui.view.localStorage.getItem(PUBLIC_STORAGE_KEY), publicSnapshot); assert.equal(ui.get("keyring-list").children.length, 1);
    ui.view.dispatchEvent(new ui.view.Event("pagehide")); assert.equal(ui.view.localStorage.getItem(PUBLIC_STORAGE_KEY), publicSnapshot);
    assert.ok(!publicSnapshot.includes(armor) && !publicSnapshot.includes("cut") && !publicSnapshot.includes("cat"));
    assert.deepEqual(ui.downloads, []); assert.deepEqual(ui.clipboard, []);
  } finally { close(ui); }
});

test("insecure contexts remain disabled after Clear and missing module workers fail visibly with no main-thread fallback", async () => {
  const insecure = boot({ secure: false });
  try {
    insecure.fill(); insecure.event("recovery-form", "submit"); assert.equal(insecure.inspectCalls.length, 0);
    insecure.get("recovery-clear").click(); assert.equal(insecure.get("recovery-preview").disabled, true); assert.equal(insecure.get("recovery-start").disabled, true);
  } finally { close(insecure); }
  const absent = boot({ useRealClient: true });
  try {
    absent.fill(); await absent.preview(); assert.equal(absent.get("recovery-status").dataset.kind, "error");
    assert.match(absent.get("recovery-status").textContent, /worker.*unavailable.*no main-thread fallback/i);
    assert.equal(absent.get("recovery-start").disabled, true); assert.equal(absent.view.localStorage.length, 0);
  } finally { close(absent); }
});
