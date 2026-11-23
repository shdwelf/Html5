import assert from "node:assert/strict";
import { before, test } from "node:test";
import { readFileSync } from "node:fs";
import { webcrypto } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { JSDOM } from "jsdom";
import { mountWorkbench } from "../apps/openpgp-workbench/app.js";
import * as keys from "../apps/openpgp-workbench/keyring.mjs";

const html = readFileSync(new URL("../apps/openpgp-workbench/index.html", import.meta.url), "utf8");
const passphrase = "synthetic UI passphrase only";
let bundle;
before(async () => { bundle = await keys.generateCompatibilityKey({ name: "Synthetic UI control — do not use", passphrase, expiryDays: 30 }); });
const deferred = () => { let resolve; const promise = new Promise((done) => { resolve = done; }); return { promise, resolve }; };
async function until(predicate) {
  for (let i = 0; i < 400; i++) { if (predicate()) return; await delay(5); }
  assert.fail("UI condition did not settle");
}
function boot({ keyTools = {}, textTools, secure = true } = {}) {
  const dom = new JSDOM(html, { url: "https://example.test/apps/openpgp-workbench/" });
  const { window } = dom;
  Object.defineProperty(window, "isSecureContext", { value: secure });
  Object.defineProperty(window.crypto, "subtle", { value: webcrypto.subtle });
  const blobs = new Map(), downloads = [], clipboard = [];
  window.URL.createObjectURL = (blob) => { const url = `blob:synthetic-${blobs.size}`; blobs.set(url, blob); return url; };
  window.URL.revokeObjectURL = () => undefined;
  window.HTMLAnchorElement.prototype.click = function () { downloads.push({ filename: this.download, blob: blobs.get(this.href) }); };
  Object.defineProperty(window.navigator, "clipboard", { value: { writeText: async (text) => { clipboard.push(text); } } });
  const tools = { ...keys, generateCompatibilityKey: async () => bundle, ...keyTools };
  const api = mountWorkbench({ doc: window.document, view: window, keyTools: tools, ...(textTools ? { textTools } : {}) });
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
