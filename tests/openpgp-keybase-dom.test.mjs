import assert from "node:assert/strict";
import { before, test } from "node:test";
import { readFileSync } from "node:fs";
import { webcrypto } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { JSDOM } from "jsdom";
import * as pgp from "openpgp";
import { mountWorkbench } from "../apps/openpgp-workbench/app.js";
import * as keys from "../apps/openpgp-workbench/keyring.mjs";
import { lookupKeybasePublicKeys } from "../apps/openpgp-workbench/keybase.mjs";
import { PUBLIC_STORAGE_KEY } from "../apps/openpgp-workbench/public-storage.mjs";

const html = readFileSync(new URL("../apps/openpgp-workbench/index.html", import.meta.url), "utf8");
let alice, bob, result;
before(async () => {
  [alice, bob] = await Promise.all(["Alice", "Bob"].map((name) => pgp.generateKey({ type: "ecc", curve: "curve25519Legacy", userIDs: [{ name: `Synthetic ${name} Keybase control only` }], config: { v6Keys: false } })));
  result = await lookupKeybasePublicKeys("alice", { fetchImpl: async () => new Response(alice.publicKey) });
});
const deferred = () => { let resolve, reject; const promise = new Promise((done, fail) => { resolve = done; reject = fail; }); return { promise, resolve, reject }; };
async function until(predicate) { for (let i = 0; i < 400; i++) { if (predicate()) return; await delay(5); } assert.fail("Keybase UI condition did not settle"); }
function boot({ lookup, keyTools = {}, userAgent, secure = true } = {}) {
  const dom = new JSDOM(html, { url: "https://example.test/apps/openpgp-workbench/" });
  const { window } = dom;
  Object.defineProperty(window, "isSecureContext", { value: secure });
  Object.defineProperty(window.crypto, "subtle", { value: webcrypto.subtle });
  if (userAgent) Object.defineProperty(window.navigator, "userAgent", { value: userAgent });
  const calls = [], downloads = [], copies = [];
  window.URL.createObjectURL = () => "blob:synthetic-keybase-control"; window.URL.revokeObjectURL = () => undefined;
  window.HTMLAnchorElement.prototype.click = function () { downloads.push(this.download); };
  Object.defineProperty(window.navigator, "clipboard", { value: { writeText: async (text) => copies.push(text) } });
  mountWorkbench({ doc: window.document, view: window, keyTools: { ...keys, ...keyTools }, keybaseLookup: (...args) => { calls.push(args); return lookup ? lookup(...args) : lookupKeybasePublicKeys(args[0], { ...args[1], fetchImpl: async () => new Response(alice.publicKey) }); } });
  const get = (id) => window.document.getElementById(id);
  const submit = (id) => get(id).dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  const change = (id) => get(id).dispatchEvent(new window.Event("change", { bubbles: true }));
  const input = (id, value) => { get(id).value = value; get(id).dispatchEvent(new window.Event("input", { bubbles: true })); };
  const consent = () => { get("keybase-network-ack").checked = true; change("keybase-network-ack"); };
  const search = (username = "alice") => { input("keybase-username", username); consent(); submit("keybase-lookup-form"); };
  const stages = () => [...get("keybase-results").querySelectorAll("button")];
  return { dom, window, get, submit, change, input, consent, search, stages, calls, downloads, copies };
}
async function settled(ui, kind = "success") { await until(() => ui.get("keybase-status").dataset.kind === kind && ui.get("keybase-lookup").getAttribute("aria-busy") === "false"); }
async function importAlice(ui) {
  ui.input("public-key-input", alice.publicKey); ui.submit("keyring-import-form");
  await until(() => ui.get("keyring-status").dataset.kind === "success");
}

test("Keybase is collapsed, blank, opt-in and makes no request on mount, tab/summary, typing, consent or fuzzy search", async () => {
  const ui = boot();
  try {
    assert.equal(ui.get("keybase-discovery").open, false);
    assert.equal(ui.get("keybase-username").value, ""); assert.equal(ui.get("keybase-network-ack").checked, false);
    ui.get("keyring-tab").click(); ui.get("keybase-discovery").open = true;
    ui.input("keybase-username", "alice"); ui.input("keyring-search", "alcie");
    ui.submit("keybase-lookup-form"); assert.match(ui.get("keybase-status").textContent, /Acknowledge/); assert.equal(ui.calls.length, 0);
    ui.consent(); await delay(5); assert.equal(ui.calls.length, 0);
    ui.input("keybase-username", "@alice"); ui.submit("keybase-lookup-form");
    assert.match(ui.get("keybase-status").textContent, /exact Keybase username/); assert.equal(ui.calls.length, 0);
    assert.equal(ui.window.localStorage.length, 0); assert.deepEqual(ui.downloads, []); assert.deepEqual(ui.copies, []);
  } finally { ui.dom.window.close(); }
});

test("a valid preview does not import, replace public input, fill an independent fingerprint, persist, copy or download anything", async () => {
  const ui = boot();
  try {
    ui.input("public-key-input", "local input must survive lookup"); ui.input("expected-fingerprint", "0".repeat(40));
    for (const [id, value] of [["plaintext", "synthetic private message"], ["encrypt-passphrase", "synthetic secret passphrase"], ["recovery-private-key", "synthetic private key input"], ["recovery-hint", "synthetic secret hint"]]) ui.input(id, value);
    ui.search("ALICE"); await settled(ui);
    assert.equal(ui.calls.length, 1); assert.equal(ui.calls[0][0], "alice"); assert.deepEqual(Object.keys(ui.calls[0][1]), ["signal"]);
    assert.equal(ui.stages().length, 1); assert.equal(ui.get("keybase-result").hidden, false);
    assert.match(ui.get("keybase-source").textContent, /https:\/\/keybase\.io\/alice\/pgp_keys\.asc/);
    assert.match(ui.get("keybase-source").textContent, /proofs have NOT been verified/);
    assert.equal(ui.get("public-key-input").value, "local input must survive lookup"); assert.equal(ui.get("expected-fingerprint").value, "0".repeat(40));
    assert.equal(ui.get("keyring-list").children.length, 0); assert.equal(ui.get("keyring-output").value, "");
    assert.equal(ui.window.localStorage.length, 0); assert.deepEqual(ui.downloads, []); assert.deepEqual(ui.copies, []);
    assert.doesNotMatch(JSON.stringify(ui.calls), /synthetic private|synthetic secret/);
  } finally { ui.dom.window.close(); }
});

test("staging is distinct from import; mismatched/short fingerprints fail and a matching import still assigns no identity trust", async () => {
  const ui = boot();
  try {
    ui.input("expected-fingerprint", "0".repeat(40)); ui.search(); await settled(ui); ui.stages()[0].click();
    assert.match(ui.get("public-key-input").value, /BEGIN PGP PUBLIC KEY BLOCK/);
    assert.equal(ui.get("expected-fingerprint").value, "0".repeat(40)); assert.equal(ui.get("keyring-list").children.length, 0);
    ui.submit("keyring-import-form"); await until(() => ui.get("keyring-status").dataset.kind === "error");
    assert.match(ui.get("keyring-status").textContent, /Fingerprint mismatch/); assert.equal(ui.get("keyring-list").children.length, 0);
    ui.input("expected-fingerprint", result.entries[0].fingerprint.slice(-16)); ui.submit("keyring-import-form");
    await until(() => ui.get("import-public-keys").getAttribute("aria-busy") === "false");
    assert.match(ui.get("keyring-status").textContent, /full 40-hex/); assert.equal(ui.get("keyring-list").children.length, 0);
    ui.input("expected-fingerprint", result.entries[0].fingerprint); ui.submit("keyring-import-form");
    await until(() => ui.get("keyring-list").children.length === 1);
    assert.match(ui.get("keyring-status").textContent, /no identity or owner trust was assigned/);
    ui.input("keyring-search", "alcie"); assert.equal(ui.get("keyring-list").children.length, 1);
    assert.match(ui.get("keyring-list").textContent, /unverified claims/); assert.equal(ui.calls.length, 1, "fuzzy discovery remains local");
  } finally { ui.dom.window.close(); }
});

test("multiple returned certificates have individual review actions, not automatic first-key selection", async () => {
  const ui = boot({ lookup: (username, options) => lookupKeybasePublicKeys(username, { ...options, fetchImpl: async () => new Response(alice.publicKey + bob.publicKey) }) });
  try {
    ui.search(); await settled(ui); assert.equal(ui.stages().length, 2);
    ui.stages()[1].click();
    assert.equal((await pgp.readKey({ armoredKey: ui.get("public-key-input").value })).getUserIDs()[0], "Synthetic Bob Keybase control only");
    assert.equal(ui.get("expected-fingerprint").value, ""); assert.equal(ui.get("keyring-output").value, "");
    assert.match(ui.get("keybase-status").textContent, /not imported|not.*verified|No identity was verified/);
  } finally { ui.dom.window.close(); }
});

test("a malformed second certificate refuses the entire preview and preserves existing local state", async () => {
  const ui = boot({ lookup: (username, options) => lookupKeybasePublicKeys(username, { ...options, fetchImpl: async () => new Response(alice.publicKey + "\n-----BEGIN PGP PUBLIC KEY BLOCK-----\n") }) });
  try {
    await importAlice(ui); const exported = ui.get("keyring-output").value;
    ui.input("public-key-input", "keep local text"); ui.search(); await settled(ui, "error");
    assert.equal(ui.get("keybase-result").hidden, true); assert.equal(ui.stages().length, 0);
    assert.equal(ui.get("public-key-input").value, "keep local text"); assert.equal(ui.get("keyring-output").value, exported);
  } finally { ui.dom.window.close(); }
});

test("Keybase UIDs render as untrusted text with bidi/control suppression, never HTML or proof badges", async () => {
  const ui = boot({ lookup: async () => ({ ...result, entries: [{ ...result.entries[0], userIDs: ['<img id="keybase-xss" src=x onerror="alert(1)">\u202eclaim'] }] }) });
  try {
    ui.search(); await settled(ui);
    assert.equal(ui.get("keybase-xss"), null); assert.match(ui.get("keybase-results").textContent, /<img/);
    assert.doesNotMatch(ui.get("keybase-results").textContent, /\u202e/); assert.match(ui.get("keybase-results").textContent, /unverified claims/);
    assert.equal(ui.get("keybase-results").querySelector("a,img,script"), null);
  } finally { ui.dom.window.close(); }
});

test("lookup and its Clear never rewrite or forget an opted-in public snapshot or independent inputs", async () => {
  const ui = boot();
  try {
    await importAlice(ui); ui.get("remember-public-keyring").checked = true; ui.change("remember-public-keyring");
    const snapshot = ui.window.localStorage.getItem(PUBLIC_STORAGE_KEY), output = ui.get("keyring-output").value;
    ui.input("expected-fingerprint", result.entries[0].fingerprint); ui.search(); await settled(ui); ui.get("keybase-clear").click();
    assert.equal(ui.window.localStorage.getItem(PUBLIC_STORAGE_KEY), snapshot); assert.equal(ui.get("keyring-output").value, output);
    assert.equal(ui.get("expected-fingerprint").value, result.entries[0].fingerprint);
    assert.equal(ui.get("keybase-username").value, ""); assert.equal(ui.get("keybase-network-ack").checked, false); assert.equal(ui.stages().length, 0);
    assert.doesNotMatch(snapshot, /keybase-username|keybase-network-ack|pgp_keys\.asc/);
  } finally { ui.dom.window.close(); }
});

for (const action of ["keybase-clear", "keybase-cancel", "clear-keyring", "clear-all", "pagehide", "username-edit", "consent-withdrawal"]) {
  test(`${action} aborts a pending lookup and cannot be undone by its late success`, async () => {
    const pending = deferred(); let signal;
    const ui = boot({ lookup: (_username, control) => { signal = control.signal; return pending.promise; } });
    try {
      ui.search(); assert.equal(ui.calls.length, 1); assert.equal(signal.aborted, false);
      if (action === "pagehide") ui.window.dispatchEvent(new ui.window.Event("pagehide"));
      else if (action === "username-edit") ui.input("keybase-username", "bob");
      else if (action === "consent-withdrawal") { ui.get("keybase-network-ack").checked = false; ui.change("keybase-network-ack"); }
      else ui.get(action).click();
      assert.equal(signal.aborted, true); const message = ui.get("keybase-status").textContent;
      pending.resolve(result); await delay(10);
      assert.equal(ui.get("keybase-status").textContent, message); assert.equal(ui.get("keybase-result").hidden, true);
      assert.equal(ui.get("public-key-input").value, ""); assert.equal(ui.get("keyring-output").value, ""); assert.equal(ui.stages().length, 0);
    } finally { ui.dom.window.close(); }
  });
}

test("a stale response/finally cannot publish an old result or re-enable a newer pending lookup", async () => {
  const first = deferred(), second = deferred(); let count = 0;
  const ui = boot({ lookup: () => ++count === 1 ? first.promise : second.promise });
  try {
    ui.search(); ui.submit("keybase-lookup-form"); assert.equal(ui.calls.length, 1, "duplicate submit cannot overlap");
    ui.input("keybase-username", "bob"); ui.submit("keybase-lookup-form"); assert.equal(ui.calls.length, 2);
    first.reject(new Error("late untrusted failure")); await delay(10);
    assert.equal(ui.get("keybase-lookup").disabled, true); assert.equal(ui.get("keybase-result").hidden, true);
    second.resolve({ ...result, username: "bob", source: "https://keybase.io/bob/pgp_keys.asc" }); await settled(ui);
    assert.match(ui.get("keybase-source").textContent, /keybase\.io\/bob\//); assert.equal(ui.stages().length, 1);
  } finally { ui.dom.window.close(); }
});

test("staging invalidates an earlier pending file read; import/export busy states disable result actions", async () => {
  const file = deferred(), pendingImport = deferred();
  const realRing = keys.createPublicKeyring();
  const ui = boot({ keyTools: { createPublicKeyring: () => ({ ...realRing, async importKeys(...args) { await pendingImport.promise; return realRing.importKeys(...args); } }) } });
  try {
    ui.search(); await settled(ui);
    Object.defineProperty(ui.get("public-key-file"), "files", { value: [{ size: 10, text: () => file.promise }] }); ui.change("public-key-file");
    ui.stages()[0].click(); const staged = ui.get("public-key-input").value; file.resolve(bob.publicKey); await delay(10);
    assert.equal(ui.get("public-key-input").value, staged);
    ui.submit("keyring-import-form"); assert.equal(ui.stages()[0].disabled, true);
    pendingImport.resolve(); await until(() => !ui.get("import-public-keys").disabled);
    assert.equal(ui.stages()[0].disabled, false); assert.equal(ui.get("keyring-list").children.length, 1);
  } finally { ui.dom.window.close(); }
});

test("offline Android and insecure contexts never enable lookup after Clear, while the network profile remains explicitly opt-in", () => {
  for (const options of [{ userAgent: "Synthetic Html5Library/1.1.0" }, { userAgent: "Synthetic Html5Library/1.1.0-private" }, { secure: false }]) {
    const ui = boot(options);
    try {
      ui.search(); ui.get("keybase-clear").click(); ui.get("clear-all").click();
      assert.equal(ui.get("keybase-lookup").disabled, true); assert.equal(ui.calls.length, 0);
      if (options.userAgent) assert.match(ui.get("keybase-status").textContent, /offline Android build/);
    } finally { ui.dom.window.close(); }
  }
  const network = boot({ userAgent: "Synthetic Html5Library/1.1.0-network" });
  try { assert.equal(network.get("keybase-lookup").disabled, false); assert.equal(network.get("keybase-network-ack").checked, false); assert.equal(network.calls.length, 0); }
  finally { network.dom.window.close(); }
});
