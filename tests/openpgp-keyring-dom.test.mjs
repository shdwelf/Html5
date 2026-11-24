import assert from "node:assert/strict";
import { before, test } from "node:test";
import { readFileSync } from "node:fs";
import { webcrypto } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { JSDOM } from "jsdom";
import { mountWorkbench } from "../apps/openpgp-workbench/app.js";
import * as keys from "../apps/openpgp-workbench/keyring.mjs";
import { PUBLIC_STORAGE_KEY } from "../apps/openpgp-workbench/public-storage.mjs";

const html = readFileSync(new URL("../apps/openpgp-workbench/index.html", import.meta.url), "utf8");
const passphrase = "synthetic UI passphrase only";
let bundle;
before(async () => { bundle = await keys.generateCompatibilityKey({ name: "Synthetic UI control — do not use", passphrase, expiryDays: 30 }); });
const deferred = () => { let resolve; const promise = new Promise((done) => { resolve = done; }); return { promise, resolve }; };
async function until(predicate) {
  for (let i = 0; i < 400; i++) { if (predicate()) return; await delay(5); }
  assert.fail("UI condition did not settle");
}
function boot({ keyTools = {}, textTools, largeKeyGenerator, secure = true, saved, storage, nativeSave } = {}) {
  const dom = new JSDOM(html, { url: "https://example.test/apps/openpgp-workbench/" });
  const { window } = dom;
  Object.defineProperty(window, "isSecureContext", { value: secure });
  Object.defineProperty(window.crypto, "subtle", { value: webcrypto.subtle });
  const blobs = new Map(), downloads = [], clipboard = [];
  window.URL.createObjectURL = (blob) => { const url = `blob:synthetic-${blobs.size}`; blobs.set(url, blob); return url; };
  window.URL.revokeObjectURL = () => undefined;
  window.HTMLAnchorElement.prototype.click = function () { downloads.push({ filename: this.download, blob: blobs.get(this.href) }); };
  Object.defineProperty(window.navigator, "clipboard", { value: { writeText: async (text) => { clipboard.push(text); } } });
  if (saved !== undefined) window.localStorage.setItem(PUBLIC_STORAGE_KEY, saved);
  if (storage) Object.defineProperty(window, "localStorage", { value: storage });
  if (nativeSave) Object.defineProperty(window, "Html5LocalFiles", { value: { version: 1, save: nativeSave } });
  const tools = { ...keys, generateCompatibilityKey: async () => bundle, ...keyTools };
  const api = mountWorkbench({ doc: window.document, view: window, keyTools: tools, ...(textTools ? { textTools } : {}), ...(largeKeyGenerator ? { largeKeyGenerator } : {}) });
  const get = (id) => window.document.getElementById(id);
  const submit = (id) => get(id).dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  const change = (id) => get(id).dispatchEvent(new window.Event("change", { bubbles: true }));
  const input = (id, value) => { get(id).value = value; get(id).dispatchEvent(new window.Event("input", { bubbles: true })); };
  const generate = () => { input("key-name", "Chosen synthetic alias"); input("key-passphrase", passphrase); input("key-confirm", passphrase); submit("keygen-form"); };
  return { dom, window, get, submit, change, input, generate, downloads, clipboard, api };
}

test("no identity, generation, download, import or private DOM output occurs automatically", () => {
  let calls = 0;
  const ui = boot({ keyTools: { generateCompatibilityKey: async () => { calls++; return bundle; } } });
  try {
    assert.equal(calls, 0); assert.equal(ui.downloads.length, 0);
    assert.equal(ui.get("key-name").value, ""); assert.equal(ui.get("key-email").value, "");
    assert.equal(ui.get("generated-public-output").value, ""); assert.equal(ui.get("keyring-output").value, "");
    assert.equal(ui.get("download-private-key").disabled, true); assert.equal(ui.get("download-revocation").disabled, true);
    assert.equal(ui.get("keygen-panel").hidden, true);
    assert.equal(ui.window.document.querySelector('textarea[id*="private"]'), null);
    assert.equal(ui.window.document.querySelector('button[data-copy*="private"]'), null);
  } finally { ui.dom.window.close(); }
});

test("key generation is explicit; private/revocation exports require acknowledgement and the exact full fingerprint", async () => {
  let calledWith;
  const ui = boot({ keyTools: { generateCompatibilityKey: async (options) => { calledWith = options; return bundle; } } });
  try {
    ui.input("key-passphrase", passphrase); ui.input("key-confirm", "different"); ui.submit("keygen-form");
    assert.match(ui.get("keygen-status").textContent, /do not match/); assert.equal(calledWith, undefined);
    ui.generate(); await until(() => ui.get("keygen-status").dataset.kind === "success");
    assert.equal(calledWith.name, "Chosen synthetic alias"); assert.equal(calledWith.email, "");
    assert.equal(ui.get("key-passphrase").value, ""); assert.equal(ui.get("key-confirm").value, "");
    assert.equal(ui.downloads.length, 0);
    assert.equal(ui.get("download-private-key").disabled, true);
    ui.get("download-public-key").click();
    assert.equal(await ui.downloads[0].blob.text(), bundle.publicKey);
    ui.get("key-backup-ack").checked = true; ui.change("key-backup-ack");
    ui.input("backup-fingerprint", "0".repeat(40)); ui.get("download-private-key").click();
    await until(() => ui.get("keygen-status").dataset.kind === "error");
    assert.equal(ui.downloads.length, 1, "mismatch must not create even a private Blob URL");
    ui.input("backup-fingerprint", keys.formatFingerprint(bundle.fingerprint)); ui.get("download-private-key").click();
    await until(() => ui.downloads.length === 2);
    assert.equal(await ui.downloads[1].blob.text(), bundle.privateKey);
    assert.match(ui.downloads[1].filename, /^[A-F0-9]{40}-SECRET\.asc$/);
    ui.get("download-revocation").click(); await until(() => ui.downloads.length === 3);
    assert.equal(await ui.downloads[2].blob.text(), bundle.revocationCertificate);
    assert.match(ui.get("keygen-status").textContent, /NOT encrypted/);
    const fields = [...ui.window.document.querySelectorAll("input,textarea")].map((node) => node.value).join("\n");
    assert.ok(!fields.includes(bundle.privateKey) && !fields.includes(bundle.revocationCertificate), "generated secrets never become DOM fields");
    ui.get("copy-public-key").click(); await until(() => ui.clipboard.length === 1);
    assert.deepEqual(ui.clipboard, [bundle.publicKey]);
  } finally { ui.dom.window.close(); }
});

test("large-RSA consent is separate, selected sizes reach crypto, and private export stays bound to the generated size rather than a later selection", async () => {
  const requested = [], downloads = [];
  const ui = boot({ keyTools: {
    // Synthetic UI routing only; real 8192/16384 crypto runs in the slow lane.
    generateCompatibilityKey: async (options) => { requested.push(options); return { ...bundle, rsaBits: options.rsaBits }; },
    checkedPrivateDownload: async (...args) => { downloads.push(args); return bundle.privateKey; },
  } });
  try {
    assert.equal(ui.get("key-rsa-bits").value, "3072");
    assert.equal(ui.get("large-rsa-warning").hidden, true);
    ui.input("key-rsa-bits", "8192"); ui.change("key-rsa-bits");
    assert.equal(ui.get("large-rsa-warning").hidden, false);
    ui.generate(); assert.equal(requested.length, 0);
    assert.match(ui.get("keygen-status").textContent, /Acknowledge the large-RSA/);
    ui.get("key-large-ack").checked = true;
    ui.generate(); await until(() => ui.get("keygen-status").dataset.kind === "success");
    assert.equal(requested[0].rsaBits, 8192);
    assert.match(ui.get("generated-expiry").textContent, /RSA-8192/);
    assert.equal(ui.get("download-private-key").disabled, true, "large-generation consent is not export consent");
    ui.input("key-rsa-bits", "16384"); ui.change("key-rsa-bits");
    assert.equal(ui.get("key-large-ack").checked, false, "a different large size requires fresh consent");
    ui.get("key-backup-ack").checked = true; ui.change("key-backup-ack");
    ui.input("backup-fingerprint", bundle.fingerprint); ui.get("download-private-key").click();
    await until(() => downloads.length === 1);
    await until(() => ui.downloads.length === 1 && ui.get("download-private-key").getAttribute("aria-busy") === "false");
    assert.deepEqual(downloads[0][2], { rsaBits: 8192 }, "export validates saved bundle metadata, not the new selector value");
    ui.get("clear-generated").click();
    assert.equal(ui.get("key-rsa-bits").value, "3072"); assert.equal(ui.get("large-rsa-warning").hidden, true);
    assert.equal(ui.get("key-large-ack").checked, false);
  } finally { ui.dom.window.close(); }
});

test("above-8192 generation routes only to the dedicated worker, and Clear aborts it without accepting a late result", async () => {
  const pending = deferred(); let signal, calls = 0;
  const ui = boot({
    keyTools: { generateCompatibilityKey: async () => { assert.fail("native path must never be used above 8192 bits"); } },
    largeKeyGenerator: (options, control) => { calls++; signal = control.signal; assert.equal(options.rsaBits, 16384); return pending.promise; },
  });
  try {
    ui.input("key-rsa-bits", "16384"); ui.change("key-rsa-bits");
    ui.get("key-large-ack").checked = true;
    ui.generate(); assert.equal(calls, 1); assert.equal(signal.aborted, false);
    assert.match(ui.get("keygen-status").textContent, /isolated OpenPGP.js/);
    ui.get("clear-generated").click(); assert.equal(signal.aborted, true);
    ui.generate(); assert.equal(calls, 1, "no overlap while cancellation unwinds");
    pending.resolve({ ...bundle, rsaBits: 16384 });
    await until(() => !ui.get("generate-key").disabled);
    assert.equal(ui.get("generated-public-output").value, "");
    assert.equal(ui.get("key-rsa-bits").value, "3072");
    assert.equal(ui.downloads.length, 0);
  } finally { ui.dom.window.close(); }
});

test("clearing a pending generation suppresses its late result without launching another expensive job", async () => {
  const pending = deferred(); let calls = 0;
  const ui = boot({ keyTools: { generateCompatibilityKey: () => { calls++; return pending.promise; } } });
  try {
    ui.generate(); assert.equal(ui.get("generate-key").disabled, true);
    ui.get("clear-generated").click();
    assert.match(ui.get("keygen-status").textContent, /result will be discarded/);
    ui.generate(); assert.equal(calls, 1, "cannot overlap another generation after clear");
    pending.resolve(bundle); await until(() => !ui.get("generate-key").disabled);
    assert.equal(ui.get("generated-public-output").value, "");
    assert.equal(ui.get("download-private-key").disabled, true); assert.equal(ui.downloads.length, 0);
  } finally { ui.dom.window.close(); }
});

test("clearing during private-export validation prevents a late download", async () => {
  const pending = deferred();
  const ui = boot({ keyTools: { checkedPrivateDownload: () => pending.promise } });
  try {
    ui.generate(); await until(() => ui.get("keygen-status").dataset.kind === "success");
    ui.get("key-backup-ack").checked = true; ui.change("key-backup-ack"); ui.input("backup-fingerprint", bundle.fingerprint);
    ui.get("download-private-key").click(); ui.get("clear-generated").click();
    pending.resolve(bundle.privateKey); await delay(10);
    assert.equal(ui.downloads.length, 0); assert.equal(ui.get("download-private-key").disabled, true);
  } finally { ui.dom.window.close(); }
});

test("adding a generated PUBLIC key, export, remove and pagehide reset do not persist or copy private material", async () => {
  const ui = boot();
  try {
    ui.generate(); await until(() => ui.get("keygen-status").dataset.kind === "success");
    ui.get("add-generated-public").click(); await until(() => ui.get("keyring-list").children.length === 1);
    assert.match(ui.get("keyring-output").value, /BEGIN PGP PUBLIC KEY BLOCK/);
    assert.doesNotMatch(ui.get("keyring-output").value, /PRIVATE KEY/);
    ui.get("download-keyring").click(); assert.equal(ui.downloads.length, 1);
    ui.get("copy-keyring").click(); await until(() => ui.clipboard.length === 1);
    assert.match(ui.clipboard[0], /BEGIN PGP PUBLIC KEY BLOCK/);
    ui.get("keyring-list").querySelector("button").click(); assert.equal(ui.get("keyring-list").children.length, 0);
    ui.get("add-generated-public").click(); await until(() => ui.get("keyring-list").children.length === 1);
    ui.window.dispatchEvent(new ui.window.Event("pagehide"));
    assert.equal(ui.get("keyring-list").children.length, 0); assert.equal(ui.get("keyring-output").value, "");
    assert.equal(ui.get("generated-public-output").value, ""); assert.equal(ui.get("download-private-key").disabled, true);
    assert.equal(ui.get("key-name").value, ""); assert.equal(ui.get("backup-fingerprint").value, "");
  } finally { ui.dom.window.close(); }
});

test("public import mismatch, clear during import and private paste leave the ring empty", async () => {
  const ui = boot();
  try {
    ui.input("public-key-input", bundle.publicKey); ui.input("expected-fingerprint", "0".repeat(40)); ui.submit("keyring-import-form");
    await until(() => ui.get("keyring-status").dataset.kind === "error");
    assert.equal(ui.get("keyring-list").children.length, 0);
    ui.input("expected-fingerprint", ""); ui.submit("keyring-import-form"); ui.get("clear-keyring").click(); await delay(30);
    assert.equal(ui.get("keyring-list").children.length, 0); assert.equal(ui.get("public-key-input").value, "");
    ui.input("public-key-input", bundle.privateKey); ui.submit("keyring-import-form");
    await until(() => ui.get("keyring-status").dataset.kind === "error");
    assert.equal(ui.get("keyring-list").children.length, 0);
  } finally { ui.dom.window.close(); }
});

test("User IDs render as untrusted text, not markup or directional overrides", async () => {
  let ready = false;
  const ui = boot({ keyTools: { createPublicKeyring: () => ({
    list: () => ready ? [{ fingerprint: bundle.fingerprint, userIDs: ['<img id="uid-xss" src=x onerror="alert(1)">\u202eclaim'], algorithm: "v4 RSA-3072", selfCertification: "test only" }] : [],
    importKeys: async () => { ready = true; }, exportKeys: () => bundle.publicKey, clear: () => { ready = false; }, remove: () => { ready = false; },
  }) } });
  try {
    ui.submit("keyring-import-form"); await until(() => ui.get("keyring-list").children.length === 1);
    assert.equal(ui.get("uid-xss"), null);
    assert.match(ui.get("keyring-list").textContent, /<img/);
    assert.doesNotMatch(ui.get("keyring-list").textContent, /\u202e/);
    assert.match(ui.get("keyring-list").textContent, /unverified claims/);
  } finally { ui.dom.window.close(); }
});

test("symmetric clears and output-only clear cannot be undone by late crypto replies", async () => {
  const encrypt = deferred(), decrypt = deferred();
  const ui = boot({ textTools: { encryptClassicText: () => encrypt.promise, decryptOpenPgpText: () => decrypt.promise } });
  try {
    ui.input("encrypt-passphrase", passphrase); ui.input("encrypt-confirm", passphrase); ui.submit("encrypt-form");
    ui.window.document.querySelector('[data-clear-form="encrypt-form"]').click();
    encrypt.resolve("late ciphertext"); await delay(5); assert.equal(ui.get("encrypted-output").value, "");
    ui.submit("decrypt-form"); ui.window.document.querySelector('[data-clear-output="decrypted-output"]').click();
    decrypt.resolve("late plaintext"); await delay(5); assert.equal(ui.get("decrypted-output").value, "");
  } finally { ui.dom.window.close(); }
});

test("file load is bounded before read and cannot restore input after clear or a newer edit", async () => {
  const ui = boot();
  try {
    const pending = deferred(); let reads = 0;
    Object.defineProperty(ui.get("public-key-file"), "files", { configurable: true, value: [{ size: 10, text: () => pending.promise }] });
    ui.change("public-key-file"); ui.input("public-key-input", "newer edit"); pending.resolve(bundle.publicKey); await delay(5);
    assert.equal(ui.get("public-key-input").value, "newer edit");
    const cleared = deferred();
    Object.defineProperty(ui.get("public-key-file"), "files", { configurable: true, value: [{ size: 10, text: () => cleared.promise }] });
    ui.change("public-key-file"); ui.get("clear-keyring").click(); cleared.resolve(bundle.publicKey); await delay(5);
    assert.equal(ui.get("public-key-input").value, "");
    Object.defineProperty(ui.get("public-key-file"), "files", { configurable: true, value: [{ size: keys.MAX_KEYRING_BYTES + 1, text: () => { reads++; return bundle.publicKey; } }] });
    ui.change("public-key-file"); await until(() => ui.get("keyring-status").dataset.kind === "error");
    assert.equal(reads, 0); assert.equal(ui.get("public-key-input").value, "");
  } finally { ui.dom.window.close(); }
});

test("keyboard tabs remain accessible and insecure contexts cannot re-enable crypto after clear", () => {
  const ui = boot({ secure: false });
  try {
    assert.equal(ui.get("capability-warning").hidden, false);
    for (const button of ui.window.document.querySelectorAll("[data-crypto-submit]")) assert.equal(button.disabled, true);
    ui.get("encrypt-tab").dispatchEvent(new ui.window.KeyboardEvent("keydown", { key: "End", bubbles: true }));
    assert.equal(ui.get("keyring-tab").getAttribute("aria-selected"), "true"); assert.equal(ui.get("keyring-panel").hidden, false);
    ui.get("clear-all").click();
    for (const button of ui.window.document.querySelectorAll("[data-crypto-submit]")) assert.equal(button.disabled, true);
  } finally { ui.dom.window.close(); }
});

test("PUBLIC remembering is opt-in, survives pagehide/reload, and never stores keys/passphrases/messages/revocations", async () => {
  const ui = boot(); let snapshot;
  try {
    ui.generate(); await until(() => ui.get("keygen-status").dataset.kind === "success");
    ui.get("add-generated-public").click(); await until(() => ui.get("keyring-list").children.length === 1);
    assert.equal(ui.window.localStorage.length, 0, "memory-only is still the default");
    ui.input("plaintext", "private synthetic research text"); ui.input("encrypt-passphrase", passphrase);
    ui.get("remember-public-keyring").checked = true; ui.change("remember-public-keyring");
    snapshot = ui.window.localStorage.getItem(PUBLIC_STORAGE_KEY);
    assert.equal(ui.window.localStorage.length, 1);
    assert.deepEqual(Object.keys(JSON.parse(snapshot)).sort(), ["armored", "version"]);
    assert.equal(JSON.parse(snapshot).armored, ui.get("keyring-output").value);
    for (const secret of [bundle.privateKey, bundle.revocationCertificate, passphrase, "private synthetic research text"]) assert.ok(!snapshot.includes(secret));
    ui.window.dispatchEvent(new ui.window.Event("pagehide"));
    assert.equal(ui.get("keyring-list").children.length, 0);
    assert.equal(ui.window.localStorage.getItem(PUBLIC_STORAGE_KEY), snapshot, "navigation must not erase the opted-in PUBLIC snapshot");
  } finally { ui.dom.window.close(); }
  const restored = boot({ saved: snapshot });
  try {
    await until(() => restored.get("keyring-list").children.length === 1);
    assert.equal(restored.get("remember-public-keyring").checked, true);
    assert.equal(restored.get("generated-public-output").value, "");
    assert.equal(restored.get("key-passphrase").value, "");
    assert.match(restored.get("keyring-status").textContent, /revalidation/);
    restored.get("clear-all").click();
    assert.equal(restored.window.localStorage.getItem(PUBLIC_STORAGE_KEY), null);
    assert.equal(restored.get("remember-public-keyring").checked, false);
  } finally { restored.dom.window.close(); }
});

test("stored private/malformed/oversized certificates never restore or overwrite the saved copy; forgetting is explicit", async () => {
  for (const saved of ["not JSON", JSON.stringify({ version: 1, armored: bundle.privateKey }), JSON.stringify({ version: 1, armored: "x".repeat(keys.MAX_KEYRING_BYTES + 1) })]) {
    const ui = boot({ saved });
    try {
      await until(() => ui.get("public-storage-status").dataset.kind === "error");
      assert.equal(ui.get("keyring-list").children.length, 0);
      assert.equal(ui.get("keyring-output").value, "");
      assert.equal(ui.window.localStorage.getItem(PUBLIC_STORAGE_KEY), saved, "never silently destroy an unreadable saved copy");
      ui.get("forget-public-keyring").click();
      assert.equal(ui.window.localStorage.getItem(PUBLIC_STORAGE_KEY), null);
    } finally { ui.dom.window.close(); }
  }
});

test("storage denial/quota failure is visible and leaves validated memory data exportable", async () => {
  const ui = boot({ storage: { getItem: () => null, setItem: () => { throw new Error("quota exceeded"); }, removeItem: () => {} } });
  try {
    ui.generate(); await until(() => ui.get("keygen-status").dataset.kind === "success");
    ui.get("add-generated-public").click(); await until(() => ui.get("keyring-list").children.length === 1);
    ui.get("remember-public-keyring").checked = true; ui.change("remember-public-keyring");
    assert.match(ui.get("public-storage-status").textContent, /storage blocked\/full/);
    assert.equal(ui.get("public-storage-status").dataset.kind, "error");
    assert.equal(ui.get("keyring-list").children.length, 1);
    ui.get("download-keyring").click(); assert.equal(ui.downloads.length, 1);
  } finally { ui.dom.window.close(); }
});

test("Android export waits for the save receipt, reports cancellation/errors honestly and keeps the export available", async () => {
  const pending = deferred(); let saved;
  const ui = boot({ nativeSave: (blob, filename) => { saved = { blob, filename }; return pending.promise; } });
  try {
    ui.generate(); await until(() => ui.get("keygen-status").dataset.kind === "success");
    ui.get("download-public-key").click();
    assert.match(ui.get("keygen-status").textContent, /Save is not confirmed yet/);
    assert.equal(ui.get("keygen-status").dataset.kind, "info");
    assert.equal(ui.downloads.length, 0, "Android does not use an unhandled Blob anchor download");
    assert.equal(await saved.blob.text(), bundle.publicKey);
    pending.resolve({ status: "saved", bytes: saved.blob.size, sha256: "a".repeat(64) });
    await until(() => ui.get("keygen-status").dataset.kind === "success");
    assert.match(ui.get("keygen-status").textContent, /read-back verified/);
  } finally { ui.dom.window.close(); }
  for (const outcome of ["cancel", "error"]) {
    const failed = boot({ nativeSave: async () => { if (outcome === "error") throw new Error("synthetic provider failure"); return { status: "canceled" }; } });
    try {
      failed.generate(); await until(() => failed.get("keygen-status").dataset.kind === "success");
      failed.get("download-public-key").click();
      await until(() => !failed.get("keygen-status").textContent.includes("Choose a destination"));
      assert.match(failed.get("keygen-status").textContent, outcome === "error" ? /Save failed/ : /Save canceled/);
      assert.equal(failed.get("generated-public-output").value, bundle.publicKey);
      assert.equal(failed.get("download-public-key").disabled, false);
    } finally { failed.dom.window.close(); }
  }
});

test("empty PUBLIC opt-in is not a storage failure; unsaved text and failed remembered snapshots still warn on navigation", async () => {
  const empty = boot();
  try {
    empty.get("remember-public-keyring").checked = true; empty.change("remember-public-keyring");
    assert.equal(empty.get("public-storage-status").dataset.kind, "success");
    assert.match(empty.get("public-storage-status").textContent, /Future successful imports/);
    empty.input("plaintext", "unsaved synthetic research input");
    const leaving = new empty.window.Event("beforeunload", { cancelable: true });
    empty.window.dispatchEvent(leaving); assert.equal(leaving.defaultPrevented, true);
  } finally { empty.dom.window.close(); }
  const denied = boot({ storage: { getItem: () => null, setItem: () => { throw new Error("quota"); }, removeItem: () => {} } });
  try {
    denied.get("remember-public-keyring").checked = true; denied.change("remember-public-keyring");
    denied.input("public-key-input", bundle.publicKey); denied.submit("keyring-import-form");
    await until(() => denied.get("keyring-list").children.length === 1);
    assert.equal(denied.get("public-storage-status").dataset.kind, "error");
    const leaving = new denied.window.Event("beforeunload", { cancelable: true });
    denied.window.dispatchEvent(leaving); assert.equal(leaving.defaultPrevented, true, "opt-in is not proof that the current public ring was saved");
  } finally { denied.dom.window.close(); }
});

test("an Android build without its native adapter fails visibly instead of requesting a known-unhandled browser download", async () => {
  const ui = boot();
  try {
    Object.defineProperty(ui.window.navigator, "userAgent", { value: "Synthetic Html5Library/1.1.0-network" });
    ui.generate(); await until(() => ui.get("keygen-status").dataset.kind === "success");
    ui.get("download-public-key").click();
    assert.equal(ui.downloads.length, 0);
    assert.equal(ui.get("keygen-status").dataset.kind, "error");
    assert.match(ui.get("keygen-status").textContent, /Nothing was saved/);
  } finally { ui.dom.window.close(); }
});
