import * as textCrypto from "./crypto.mjs";
import * as keyCrypto from "./keyring.mjs";
import { generateLargeRsaKey } from "./large-rsa.mjs";

/** No globals holding key material; dependencies are injectable for race/UI tests. */
export function mountWorkbench({ doc = globalThis.document, view = globalThis.window, textTools = textCrypto, keyTools = keyCrypto, largeKeyGenerator = generateLargeRsaKey } = {}) {
  const byId = (id) => doc.getElementById(id);
  const supported = view.isSecureContext && Boolean(view.crypto?.subtle) && typeof TextEncoder === "function";
  const ring = keyTools.createPublicKeyring();
  let generated = null; // Protected armor only. Never put private/revocation data in the DOM.
  let generationEpoch = 0;
  let generationBusy = false;
  let generationController = null;
  let importEpoch = 0;
  let fileEpoch = 0;
  let importing = false;
  let importController = null;
  let generatedImport = false;
  const textEpochs = { encrypt: 0, decrypt: 0 };
  const objectURLs = new Set();

  function setStatus(id, message, kind = "info") {
    const status = byId(id);
    status.textContent = message;
    status.dataset.kind = kind;
  }
  function setBusy(button, busy) {
    button.disabled = busy || !supported;
    button.setAttribute("aria-busy", String(busy));
  }
  const friendlyError = (error) => (error instanceof Error ? error.message : String(error)).slice(0, 240) || "The OpenPGP operation could not be completed.";
  const statusFor = (button) => button.dataset.status || (button.dataset.copy === "decrypted-output" ? "decrypt-status" : "encrypt-status");

  function download(value, filename, type) {
    const url = view.URL.createObjectURL(new Blob([value], { type }));
    objectURLs.add(url);
    const anchor = doc.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    doc.body.append(anchor);
    anchor.click();
    anchor.remove();
    view.setTimeout(() => { view.URL.revokeObjectURL(url); objectURLs.delete(url); }, 1000);
  }

  const tabs = [...doc.querySelectorAll("[data-tab]")];
  for (const tab of tabs) {
    tab.addEventListener("click", () => {
      for (const candidate of tabs) {
        const selected = candidate === tab;
        candidate.classList.toggle("is-active", selected);
        candidate.setAttribute("aria-selected", String(selected));
        candidate.tabIndex = selected ? 0 : -1;
      }
      for (const panel of doc.querySelectorAll("[data-panel]")) panel.hidden = panel.id !== tab.dataset.tab;
    });
    tab.addEventListener("keydown", (event) => {
      const index = tabs.indexOf(tab);
      const next = event.key === "ArrowRight" ? (index + 1) % tabs.length
        : event.key === "ArrowLeft" ? (index + tabs.length - 1) % tabs.length
          : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : -1;
      if (next >= 0) { event.preventDefault(); tabs[next].focus(); tabs[next].click(); }
    });
  }
  for (const button of doc.querySelectorAll("[data-toggle-password]")) {
    button.addEventListener("click", () => {
      const input = byId(button.dataset.togglePassword);
      const reveal = input.type === "password";
      input.type = reveal ? "text" : "password";
      button.textContent = reveal ? "Hide" : "Show";
      button.setAttribute("aria-pressed", String(reveal));
    });
  }
  function resetForm(form) {
    form.reset();
    for (const button of form.querySelectorAll("[data-toggle-password]")) {
      byId(button.dataset.togglePassword).type = "password";
      button.textContent = "Show";
      button.setAttribute("aria-pressed", "false");
    }
  }

  for (const kind of ["encrypt", "decrypt"]) {
    byId(`${kind}-form`).addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = event.currentTarget.querySelector('[type="submit"]');
      if (button.disabled || !supported) return;
      const epoch = ++textEpochs[kind];
      const input = byId(kind === "encrypt" ? "plaintext" : "armored-input").value;
      const passphrase = byId(`${kind}-passphrase`).value;
      const output = byId(kind === "encrypt" ? "encrypted-output" : "decrypted-output");
      output.value = "";
      if (kind === "encrypt" && passphrase !== byId("encrypt-confirm").value) {
        setStatus("encrypt-status", "The passphrases do not match. Nothing was encrypted.", "error");
        return;
      }
      setBusy(button, true);
      setStatus(`${kind}-status`, kind === "encrypt" ? "Encrypting locally…" : "Decrypting locally…");
      try {
        const value = kind === "encrypt" ? await textTools.encryptClassicText(input, passphrase) : await textTools.decryptOpenPgpText(input, passphrase);
        if (epoch !== textEpochs[kind]) return;
        output.value = value;
        setStatus(`${kind}-status`, kind === "encrypt" ? "Encrypted. Copy or download the armored message." : "Decrypted. Integrity is not sender authentication; review before using.", "success");
      } catch (error) {
        if (epoch === textEpochs[kind]) setStatus(`${kind}-status`, friendlyError(error), "error");
      } finally { setBusy(button, false); }
    });
  }
  function clearText(kind) {
    textEpochs[kind]++;
    resetForm(byId(`${kind}-form`));
    byId(kind === "encrypt" ? "encrypted-output" : "decrypted-output").value = "";
    setStatus(`${kind}-status`, "Fields cleared. Any in-progress result will be discarded; memory erasure is not guaranteed.");
  }
  for (const button of doc.querySelectorAll("[data-clear-form]")) button.addEventListener("click", () => clearText(button.dataset.clearForm === "encrypt-form" ? "encrypt" : "decrypt"));
  for (const button of doc.querySelectorAll("[data-clear-output]")) button.addEventListener("click", () => {
    textEpochs.decrypt++;
    byId(button.dataset.clearOutput).value = "";
    setStatus("decrypt-status", "Decrypted output cleared; any in-progress result will be discarded.");
  });

  function rsaSizeControls() {
    const large = Number(byId("key-rsa-bits").value) > 4096;
    byId("large-rsa-warning").hidden = !large;
    byId("key-large-ack").checked = false;
  }
  byId("key-rsa-bits").addEventListener("change", rsaSizeControls);
  rsaSizeControls();

  function generationControls() {
    const ready = Boolean(generated);
    for (const id of ["download-public-key", "copy-public-key"]) byId(id).disabled = !ready;
    byId("add-generated-public").disabled = !ready || importing || !supported;
    for (const id of ["download-private-key", "download-revocation"]) byId(id).disabled = !ready || !supported || !byId("key-backup-ack").checked;
  }
  function clearGenerated({ reset = true } = {}) {
    generationEpoch++;
    generationController?.abort();
    generated = null;
    if (generatedImport) { importController?.abort(); importEpoch++; }
    if (reset) { resetForm(byId("keygen-form")); rsaSizeControls(); }
    byId("generated-public-output").value = "";
    byId("generated-fingerprint").textContent = "No key generated in this tab.";
    byId("generated-expiry").textContent = "";
    byId("backup-fingerprint").value = "";
    byId("key-backup-ack").checked = false;
    generationControls();
    setStatus("keygen-status", generationBusy ? "Fields cleared. Any large-RSA worker is terminated; native Web Crypto cannot be stopped, but its result will be discarded." : "Generated material cleared from the page. Browser-memory erasure is not guaranteed.");
  }
  byId("keygen-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (generationBusy || !supported) return;
    const options = {
      name: byId("key-name").value, email: byId("key-email").value,
      rsaBits: Number(byId("key-rsa-bits").value),
      passphrase: byId("key-passphrase").value, expiryDays: Number(byId("key-expiry").value),
    };
    const confirmation = byId("key-confirm").value;
    clearGenerated({ reset: false });
    if (options.passphrase !== confirmation) { setStatus("keygen-status", "The passphrases do not match. No key generated.", "error"); return; }
    if (options.rsaBits > 4096 && !byId("key-large-ack").checked) {
      setStatus("keygen-status", "Acknowledge the large-RSA performance and compatibility warning before generating above 4096 bits.", "error");
      return;
    }
    const epoch = generationEpoch;
    const controller = new AbortController();
    generationController = controller;
    generationBusy = true;
    const button = byId("generate-key");
    setBusy(button, true);
    setStatus("keygen-status", `Generating two random RSA-${options.rsaBits} keys locally and protecting both private packets. ${options.rsaBits > 8192 ? "Using the isolated OpenPGP.js prime-search worker; Clear terminates it. Limit: 20 minutes." : "Large keys can take many minutes; Clear discards the result but cannot stop native Web Crypto."}…`);
    // Values are handed to the crypto operation, never retained in form fields.
    byId("key-passphrase").value = "";
    byId("key-confirm").value = "";
    try {
      const result = await (options.rsaBits > 8192
        ? largeKeyGenerator(options, { signal: controller.signal, WorkerClass: view.Worker })
        : keyTools.generateCompatibilityKey(options));
      if (epoch !== generationEpoch) return;
      generated = result;
      byId("generated-public-output").value = result.publicKey;
      byId("generated-fingerprint").textContent = keyTools.formatFingerprint(result.fingerprint);
      byId("generated-expiry").textContent = `RSA-${result.rsaBits ?? keyTools.RSA_BITS} · created ${result.created.slice(0, 10)} · expires ${result.expires.slice(0, 10)}. Compare this full fingerprint after importing into your other app.`;
      setStatus("keygen-status", "Key generated. Nothing downloaded or published. Back up the protected private key AND revocation certificate explicitly; the passphrase cannot be recovered.", "success");
    } catch (error) {
      if (epoch === generationEpoch) setStatus("keygen-status", friendlyError(error), "error");
    } finally {
      if (generationController === controller) generationController = null;
      generationBusy = false;
      setBusy(button, false);
      generationControls();
    }
  });
  byId("clear-generated").addEventListener("click", () => clearGenerated());
  byId("key-backup-ack").addEventListener("change", generationControls);
  byId("download-public-key").addEventListener("click", () => {
    if (!generated) return;
    download(generated.publicKey, `${generated.fingerprint}-PUBLIC.asc`, "application/pgp-keys");
    setStatus("keygen-status", "Public certificate download requested. It contains your User ID; review before sharing.", "success");
  });
  for (const id of ["download-private-key", "download-revocation"]) {
    byId(id).addEventListener("click", async () => {
      if (!generated || !byId("key-backup-ack").checked || !supported) return;
      const bundle = generated, epoch = generationEpoch;
      const button = byId(id);
      setBusy(button, true);
      try {
        const expected = keyTools.normalizeFingerprint(byId("backup-fingerprint").value);
        if (expected !== bundle.fingerprint) throw new Error("Full fingerprint mismatch. Nothing was downloaded.");
        const privateArmor = await keyTools.checkedPrivateDownload(bundle.privateKey, expected, { rsaBits: bundle.rsaBits });
        if (epoch !== generationEpoch || !byId("key-backup-ack").checked) return;
        const revocation = id === "download-revocation";
        download(revocation ? bundle.revocationCertificate : privateArmor, `${bundle.fingerprint}-${revocation ? "REVOCATION" : "SECRET"}.asc`, "application/pgp-keys");
        setStatus("keygen-status", revocation ? "Revocation certificate download requested. It is NOT encrypted; anyone with it can revoke this key. Keep it offline." : "Protected private-key download requested. Keep the .asc file and its strong passphrase private and backed up separately.", "success");
      } catch (error) {
        if (epoch === generationEpoch) setStatus("keygen-status", friendlyError(error), "error");
      } finally { button.setAttribute("aria-busy", "false"); generationControls(); }
    });
  }

  function renderRing() {
    const entries = ring.list(), list = byId("keyring-list");
    list.replaceChildren();
    for (const entry of entries) {
      const item = doc.createElement("li");
      item.className = "keyring-item";
      const fingerprint = doc.createElement("code");
      fingerprint.className = "fingerprint";
      fingerprint.textContent = keyTools.formatFingerprint(entry.fingerprint);
      const uid = doc.createElement("p");
      // Treat every User ID as an untrusted claim, not HTML or bidi controls.
      uid.textContent = entry.userIDs.join(" · ").replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, "�") || "No textual User ID";
      const state = doc.createElement("p");
      state.className = "field-hint";
      state.textContent = `${entry.algorithm} · ${entry.selfCertification}. All User IDs are unverified claims; subkeys are not audited.`;
      const remove = doc.createElement("button");
      remove.type = "button";
      remove.className = "button button-quiet";
      remove.textContent = "Remove certificate";
      remove.addEventListener("click", () => { ring.remove(entry.fingerprint); renderRing(); setStatus("keyring-status", "Public certificate removed from this tab, not from anyone else's keyring."); });
      item.append(fingerprint, uid, state, remove);
      list.append(item);
    }
    byId("keyring-count").textContent = `${entries.length} / ${keyTools.MAX_PUBLIC_KEYS} public certificates`;
    byId("keyring-output").value = entries.length ? ring.exportKeys() : "";
    byId("download-keyring").disabled = !entries.length;
    byId("copy-keyring").disabled = !entries.length;
  }
  function importControls() {
    setBusy(byId("import-public-keys"), importing);
    generationControls();
  }
  async function importPublic(armored, expectedFingerprint, fromGenerated = false) {
    if (importing || !supported) return;
    importing = true;
    generatedImport = fromGenerated;
    importController = new AbortController();
    const epoch = ++importEpoch, generation = generationEpoch;
    importControls();
    setStatus("keyring-status", "Parsing bounded public certificates locally. No trust or identity is assigned…");
    try {
      await ring.importKeys(armored, { expectedFingerprint, signal: importController.signal });
      if (epoch !== importEpoch) return;
      renderRing();
      setStatus("keyring-status", "Public keyring updated in memory. Compare every full fingerprint independently; no identity or owner trust was assigned.", "success");
      if (fromGenerated && generation === generationEpoch) setStatus("keygen-status", "Public certificate added to the in-memory keyring; private material was not added.", "success");
    } catch (error) {
      if (epoch === importEpoch) setStatus("keyring-status", friendlyError(error), "error");
      if (fromGenerated && generation === generationEpoch) setStatus("keygen-status", "Public-key add failed or was cleared; inspect the Public keyring tab.", "error");
    } finally {
      importing = false;
      generatedImport = false;
      importController = null;
      importControls();
    }
  }
  byId("add-generated-public").addEventListener("click", () => { if (generated) void importPublic(generated.publicKey, generated.fingerprint, true); });
  byId("keyring-import-form").addEventListener("submit", (event) => { event.preventDefault(); void importPublic(byId("public-key-input").value, byId("expected-fingerprint").value); });
  byId("public-key-input").addEventListener("input", () => { fileEpoch++; });
  byId("public-key-file").addEventListener("change", async (event) => {
    const epoch = ++fileEpoch, file = event.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > keyTools.MAX_KEYRING_BYTES) throw new Error("Public keyring file is larger than 1 MiB. Nothing was loaded.");
      const text = await file.text();
      if (epoch !== fileEpoch) return;
      byId("public-key-input").value = text;
      setStatus("keyring-status", "File loaded into the input only. Review the fingerprint and press Import public keys; no automatic import.");
    } catch (error) {
      if (epoch === fileEpoch) { byId("public-key-input").value = ""; setStatus("keyring-status", friendlyError(error), "error"); }
    }
  });
  function clearRing() {
    importEpoch++; fileEpoch++; importController?.abort(); ring.clear();
    resetForm(byId("keyring-import-form"));
    renderRing();
    setStatus("keyring-status", "Public keyring and import fields cleared. In-progress imports will not repopulate them.");
  }
  byId("clear-keyring").addEventListener("click", clearRing);
  byId("download-keyring").addEventListener("click", () => {
    try { download(ring.exportKeys(), "openpgp-PUBLIC-keyring.asc", "application/pgp-keys"); setStatus("keyring-status", "Public-only keyring download requested. Certificates contain unverified User ID claims.", "success"); }
    catch (error) { setStatus("keyring-status", friendlyError(error), "error"); }
  });

  for (const button of doc.querySelectorAll("[data-copy]")) button.addEventListener("click", async () => {
    const target = byId(button.dataset.copy), value = target.value, status = statusFor(button);
    if (!value) { setStatus(status, "There is no output to copy yet.", "error"); return; }
    try { await view.navigator.clipboard.writeText(value); setStatus(status, "Copied to the clipboard by your request. The system clipboard is outside this app's control.", "success"); }
    catch { target.focus(); target.select(); setStatus(status, "Clipboard access blocked. Output selected; copy it manually.", "error"); }
  });
  for (const button of doc.querySelectorAll("[data-download]")) button.addEventListener("click", () => {
    const value = byId(button.dataset.download).value;
    if (!value) { setStatus("encrypt-status", "There is no encrypted message to download yet.", "error"); return; }
    download(value, button.dataset.filename, "application/pgp-encrypted;charset=utf-8");
    setStatus("encrypt-status", "Download requested.", "success");
  });
  function clearAll() {
    clearText("encrypt"); clearText("decrypt"); clearGenerated(); clearRing();
    for (const url of objectURLs) view.URL.revokeObjectURL(url);
    objectURLs.clear();
  }
  byId("clear-all").addEventListener("click", clearAll);
  view.addEventListener("pagehide", clearAll);
  if (!supported) byId("capability-warning").hidden = false;
  for (const button of doc.querySelectorAll("[data-crypto-submit]")) button.disabled = !supported;
  generationControls(); renderRing();
  return Object.freeze({ clearAll });
}

if (typeof document !== "undefined" && typeof window !== "undefined") mountWorkbench();
