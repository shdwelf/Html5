import * as textCrypto from "./crypto.mjs";
import * as keyCrypto from "./keyring.mjs";
import { searchPublicCertificates } from "./keyring-search.mjs";
import { mountKeybaseLookup } from "./keybase-ui.mjs";
import { generateLargeRsaKey } from "./large-rsa.mjs";
import { mountPrivateKeyRecovery } from "./recovery-ui.mjs";
import { readPublicSnapshot, writePublicSnapshot, forgetPublicSnapshot } from "./public-storage.mjs";

/** No globals holding key material; dependencies are injectable for race/UI tests. */
export function mountWorkbench({ doc = globalThis.document, view = globalThis.window, textTools = textCrypto, keyTools = keyCrypto, largeKeyGenerator = generateLargeRsaKey, recoveryTools, keybaseLookup } = {}) {
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
  let publicVariantBusy = false;
  let importController = null;
  let generatedImport = false;
  const textEpochs = { encrypt: 0, decrypt: 0 };
  const objectURLs = new Set();
  let rememberPublic = false;
  let publicSnapshotCurrent = false;
  let fileSaveBusy = false;
  const saveEpochs = { "keygen-status": 0, "keyring-status": 0, "encrypt-status": 0 };

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

  async function download(value, filename, type, status, requestedMessage) {
    if (fileSaveBusy) { setStatus(status, "Another local save is pending. Finish or cancel it first.", "error"); return; }
    const epoch = ++saveEpochs[status];
    const blob = new Blob([value], { type });
    if (view.Html5LocalFiles?.version === 1 && typeof view.Html5LocalFiles.save === "function") {
      fileSaveBusy = true;
      setStatus(status, "Choose a destination in Android Files. Save is not confirmed yet; do not close this page.");
      try {
        const receipt = await view.Html5LocalFiles.save(blob, filename);
        if (epoch !== saveEpochs[status]) return;
        if (receipt.status === "saved" && receipt.bytes === blob.size && /^[a-f0-9]{64}$/.test(receipt.sha256)) {
          setStatus(status, `Saved ${receipt.bytes.toLocaleString()} bytes and read-back verified. SHA-256: ${receipt.sha256}. ${requestedMessage}`, "success");
        } else if (receipt.status === "canceled") {
          setStatus(status, "Save canceled. No completed save is confirmed; the export remains in this tab.");
        } else { throw new Error("No valid read-back receipt was returned. Check the destination."); }
      } catch (error) {
        if (epoch === saveEpochs[status]) setStatus(status, `Save failed: ${friendlyError(error)} Keep this page open and retry.`, "error");
      } finally { fileSaveBusy = false; }
      return;
    }
    if (view.navigator.userAgent?.includes("Html5Library/")) {
      setStatus(status, "Android local-save adapter is unavailable. Nothing was saved. Keep this page open, copy public/ciphertext output if appropriate, and reload/update the app before exporting sensitive backups.", "error");
      return;
    }
    try {
      const url = view.URL.createObjectURL(blob);
      objectURLs.add(url);
      const anchor = doc.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      doc.body.append(anchor);
      anchor.click();
      anchor.remove();
      view.setTimeout(() => { view.URL.revokeObjectURL(url); objectURLs.delete(url); }, 60000);
      setStatus(status, `Browser download requested, not verified saved. Check your Downloads folder. ${requestedMessage}`, "success");
    } catch (error) { setStatus(status, `Download failed: ${friendlyError(error)} Keep this page open and retry.`, "error"); }
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
    if (kind === "encrypt") saveEpochs["encrypt-status"]++;
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
    byId("add-generated-public").disabled = !ready || importing || publicVariantBusy || !supported;
    for (const id of ["download-private-key", "download-revocation"]) byId(id).disabled = !ready || !supported || !byId("key-backup-ack").checked;
  }
  function clearGenerated({ reset = true } = {}) {
    saveEpochs["keygen-status"]++;
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
      setStatus("keygen-status", "Key generated. Nothing downloaded or published. Back up the protected private key AND revocation certificate explicitly; the passphrase cannot be reset and recovery is not guaranteed.", "success");
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
    void download(generated.publicKey, `${generated.fingerprint}-PUBLIC.asc`, "application/pgp-keys", "keygen-status", "Public certificates contain your User ID; review before sharing.");
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
        await download(revocation ? bundle.revocationCertificate : privateArmor, `${bundle.fingerprint}-${revocation ? "REVOCATION" : "SECRET"}.asc`, "application/pgp-keys", "keygen-status", revocation ? "Revocation certificate is NOT encrypted; anyone with it can revoke this key. Keep it offline." : "Keep the protected private .asc and its strong passphrase private and backed up separately.");
      } catch (error) {
        if (epoch === generationEpoch) setStatus("keygen-status", friendlyError(error), "error");
      } finally { button.setAttribute("aria-busy", "false"); generationControls(); }
    });
  }

  function renderRing({ updateExport = true } = {}) {
    const entries = ring.list(), list = byId("keyring-list"), search = byId("keyring-search");
    let matches = [], searchError = false;
    try { matches = searchPublicCertificates(entries, search.value); }
    catch { searchError = true; }
    const active = Boolean(search.value.trim());
    byId("clear-keyring-search").disabled = !search.value.length;
    setStatus("keyring-search-status", searchError ? "Use at most 128 search characters and eight name/email terms. Clear search to show the full keyring."
      : !entries.length ? "Keyring empty. Import a public certificate to search."
        : active ? `${matches.length} of ${entries.length} public certificates shown. ${matches.length ? "Exact text matches rank before typo-tolerant matches." : "No matches; clear search to show all certificates."} Full-keyring exports are unchanged.`
          : `Showing all ${entries.length} public certificates. Search is display-only, not identity verification.`, searchError ? "error" : "info");
    list.replaceChildren();
    for (const { entry, kind } of matches) {
      const item = doc.createElement("li");
      item.className = "keyring-item";
      item.dataset.searchMatch = kind;
      const fingerprint = doc.createElement("code");
      fingerprint.className = "fingerprint";
      fingerprint.textContent = keyTools.formatFingerprint(entry.fingerprint);
      const uid = doc.createElement("p");
      // Treat every User ID as an untrusted claim, not HTML or bidi controls.
      uid.textContent = entry.userIDs.join(" · ").replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, "�") || "No textual User ID";
      const state = doc.createElement("p");
      state.className = "field-hint";
      state.textContent = `${entry.algorithm} · ${entry.selfCertification}. All User IDs are unverified claims. ` +
        (entry.encryptionFingerprint ? `Usable bound encryption key detected: ${keyTools.formatFingerprint(entry.encryptionFingerprint)}.` : "No currently usable bound encryption key detected; signing/authentication keys cannot decrypt messages.");
      const remove = doc.createElement("button");
      remove.type = "button";
      remove.className = "button button-quiet";
      remove.textContent = "Remove certificate";
      remove.addEventListener("click", () => { ring.remove(entry.fingerprint); renderRing(); rememberRing(); setStatus("keyring-status", "Public certificate removed from this tab, not from anyone else's keyring."); });
      const full = doc.createElement("button");
      full.type = "button"; full.className = "button button-quiet"; full.textContent = "Export full PUBLIC .asc";
      full.addEventListener("click", () => { void download(ring.exportCertificate(entry.fingerprint), `public-${entry.fingerprint}.asc`, "application/pgp-keys", "keyring-status", "Full public certificate; no secret key is included."); });
      const reduced = doc.createElement("button");
      reduced.type = "button"; reduced.className = "button button-quiet"; reduced.textContent = "Export one-encryption-subkey PUBLIC .asc";
      reduced.disabled = !entry.encryptionFingerprint;
      reduced.addEventListener("click", async () => {
        const epoch = importEpoch;
        try {
          const variants = await keyTools.publicCertificateVariants(ring.exportCertificate(entry.fingerprint), entry.fingerprint, {
            profile: entry.keyVersion === 6 ? "modern-v6" : "classic-v4", encryptionFingerprint: entry.encryptionFingerprint,
          });
          if (epoch !== importEpoch || !ring.list().some((item) => item.fingerprint === entry.fingerprint)) return;
          await download(variants.reduced, `public-${entry.fingerprint}-one-encryption-subkey.asc`, "application/pgp-keys", "keyring-status", "Troubleshooting subset only, not a revocation or v6-to-v4 conversion. Keep the full certificate; previously encrypted files still require their original secret subkey.");
        } catch (error) { if (epoch === importEpoch) setStatus("keyring-status", friendlyError(error), "error"); }
      });
      item.append(fingerprint, uid);
      if (active) {
        const reason = doc.createElement("p");
        reason.className = "field-hint";
        reason.textContent = kind === "fuzzy" ? "Typo-tolerant name/email match only — verify the full fingerprint independently."
          : kind === "fingerprint" ? "Exact fingerprint text match only — fragments are not identity verification or authorization."
            : "Name/email text match only — User IDs are unverified claims.";
        item.append(reason);
      }
      item.append(state, remove, full, reduced);
      list.append(item);
    }
    byId("keyring-count").textContent = `${entries.length} / ${keyTools.MAX_PUBLIC_KEYS} public certificates`;
    // Filtering never mutates the ring, its export, storage or crypto inputs.
    if (updateExport) {
      byId("keyring-output").value = entries.length ? ring.exportKeys() : "";
      byId("download-keyring").disabled = !entries.length;
      byId("copy-keyring").disabled = !entries.length;
    }
  }
  const filterRing = () => renderRing({ updateExport: false });
  function clearRingSearch() {
    byId("keyring-search").value = "";
    filterRing();
    byId("keyring-search").focus();
  }
  byId("keyring-search").addEventListener("input", filterRing);
  byId("keyring-search").addEventListener("search", filterRing);
  byId("keyring-search").addEventListener("keydown", (event) => {
    if (event.key === "Escape" && byId("keyring-search").value) { event.preventDefault(); clearRingSearch(); }
  });
  byId("clear-keyring-search").addEventListener("click", clearRingSearch);
  function rememberRing() {
    publicSnapshotCurrent = false;
    if (!rememberPublic) return;
    try {
      const saved = writePublicSnapshot(view.localStorage, ring, keyTools.MAX_KEYRING_BYTES);
      publicSnapshotCurrent = saved;
      setStatus("public-storage-status", saved ? "PUBLIC certificates remembered on this device and read-back checked. This is not a backup: browser/app data clearing or uninstall can remove them. Export a .asc copy too." : "No public certificates to remember yet. Future successful imports will be remembered; nothing else is stored.", "success");
    } catch {
      setStatus("public-storage-status", "Could not update the device copy (storage blocked/full). The previous copy may be stale. Export a .asc backup now; no private data was stored.", "error");
    }
  }
  function forgetRememberedRing() {
    rememberPublic = false;
    publicSnapshotCurrent = false;
    byId("remember-public-keyring").checked = false;
    try {
      forgetPublicSnapshot(view.localStorage);
      setStatus("public-storage-status", "Remembering is off. Saved PUBLIC certificates removed from this origin; external backups are unchanged.");
    } catch {
      setStatus("public-storage-status", "Device storage could not be accessed; removal is NOT confirmed. Clear this app/site's storage in system settings if needed.", "error");
    }
  }
  byId("remember-public-keyring").addEventListener("change", () => {
    rememberPublic = byId("remember-public-keyring").checked;
    if (rememberPublic) rememberRing(); else forgetRememberedRing();
  });
  byId("forget-public-keyring").addEventListener("click", forgetRememberedRing);

  // Discovery never receives secret/recovery state, storage or import authority.
  const keybase = mountKeybaseLookup({ doc, view, supported, lookup: keybaseLookup, onStage(armored) {
    fileEpoch++; // A pending file read must not overwrite an explicitly chosen result.
    byId("public-key-file").value = "";
    byId("public-key-input").value = armored;
    // Never copy a remotely discovered fingerprint into independent confirmation.
    setStatus("keyring-status", "Keybase PUBLIC certificate loaded into input only, not imported. The expected fingerprint is unchanged. Obtain/compare it independently, then explicitly Import public keys.");
    byId("public-key-input").focus();
  } });

  function importControls() {
    setBusy(byId("import-public-keys"), importing || publicVariantBusy);
    for (const id of ["export-full-public-input", "export-reduced-public-input"]) byId(id).disabled = !supported || importing || publicVariantBusy;
    generationControls();
    keybase.setImportBusy(importing || publicVariantBusy);
  }
  async function importPublic(armored, expectedFingerprint, fromGenerated = false, restoring = false) {
    if (importing || publicVariantBusy || !supported) return;
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
      if (!restoring) rememberRing();
      else publicSnapshotCurrent = rememberPublic;
      setStatus("keyring-status", restoring ? "Remembered PUBLIC certificates restored after revalidation. No identity or owner trust was restored or assigned; compare full fingerprints independently." : "Public keyring updated in memory. Compare every full fingerprint independently; no identity or owner trust was assigned.", "success");
      if (restoring) setStatus("public-storage-status", "Opt-in PUBLIC device copy restored. Private keys, revocations, messages and passphrases were not restored. Export a .asc backup too.", "success");
      if (fromGenerated && generation === generationEpoch) setStatus("keygen-status", "Public certificate added to the in-memory keyring; private material was not added.", "success");
    } catch (error) {
      if (epoch === importEpoch) {
        setStatus("keyring-status", friendlyError(error), "error");
        if (restoring) setStatus("public-storage-status", "Saved public certificates could not be revalidated. The old copy was not overwritten. Import an external .asc backup or explicitly forget the saved copy.", "error");
      }
      if (fromGenerated && generation === generationEpoch) setStatus("keygen-status", "Public-key add failed or was cleared; inspect the Public keyring tab.", "error");
    } finally {
      importing = false;
      generatedImport = false;
      importController = null;
      importControls();
    }
  }
  async function exportPublicInput(reduced) {
    if (importing || publicVariantBusy || !supported) return;
    const epoch = importEpoch, file = fileEpoch;
    publicVariantBusy = true; importControls();
    setStatus("keyring-status", "Checking one PUBLIC certificate and its encryption binding. The input will not be modified or imported…");
    try {
      // The full expected fingerprint is mandatory for this explicit subset
      // operation, including when the original has unsupported v6 subkeys.
      const expected = keyTools.normalizePublicFingerprint(byId("expected-fingerprint").value);
      const variants = await keyTools.publicCertificateVariants(byId("public-key-input").value, expected, {
        profile: expected.length === 64 ? "modern-v6" : "classic-v4",
      });
      if (epoch !== importEpoch || file !== fileEpoch) return;
      const omitted = variants.removedSubkeyFingerprints.length + variants.unsupportedSubkeys.length;
      await download(reduced ? variants.reduced : variants.full,
        `public-${expected}-${reduced ? "one-encryption-subkey" : "full-original"}.asc`, "application/pgp-keys", "keyring-status",
        reduced ? `Explicit subset omits ${omitted} other subkey blocks, including ${variants.unsupportedSubkeys.length} unsupported algorithms. Keep the original. This is not a revocation, a v6-to-v4 conversion or proof that omitted keys are invalid; old ciphertext still needs its original secret subkey.` : "Original PUBLIC input preserved, including unsupported public algorithm packets. A usable bound encryption key was found in the supported subset; omitted algorithms were not validated. No secret key was exported.");
    } catch (error) {
      if (epoch === importEpoch && file === fileEpoch) setStatus("keyring-status", friendlyError(error), "error");
    } finally { publicVariantBusy = false; importControls(); }
  }
  byId("export-full-public-input").addEventListener("click", () => { void exportPublicInput(false); });
  byId("export-reduced-public-input").addEventListener("click", () => { void exportPublicInput(true); });
  byId("add-generated-public").addEventListener("click", () => { if (generated) void importPublic(generated.publicKey, generated.fingerprint, true); });
  byId("keyring-import-form").addEventListener("submit", (event) => { event.preventDefault(); void importPublic(byId("public-key-input").value, byId("expected-fingerprint").value); });
  byId("public-key-input").addEventListener("input", () => { fileEpoch++; });
  byId("expected-fingerprint").addEventListener("input", () => { fileEpoch++; });
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
  function clearRing({ forgetSaved = true } = {}) {
    saveEpochs["keyring-status"]++;
    if (forgetSaved) forgetRememberedRing();
    keybase.clear();
    importEpoch++; fileEpoch++; importController?.abort(); ring.clear();
    resetForm(byId("keyring-import-form"));
    byId("keyring-search").value = "";
    renderRing();
    setStatus("keyring-status", "Public keyring and import fields cleared. In-progress imports will not repopulate them.");
  }
  byId("clear-keyring").addEventListener("click", () => clearRing());
  byId("download-keyring").addEventListener("click", () => {
    try { void download(ring.exportKeys(), "openpgp-PUBLIC-keyring.asc", "application/pgp-keys", "keyring-status", "Certificates contain unverified User ID claims."); }
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
    void download(value, button.dataset.filename, "application/pgp-encrypted;charset=utf-8", "encrypt-status", "Keep an independent backup of your encrypted research.");
  });
  // Isolated recovery never receives the public ring, download helper or storage.
  const recovery = mountPrivateKeyRecovery({ doc, view, supported, tools: recoveryTools });
  function clearAll({ forgetSaved = true } = {}) {
    recovery.clear();
    clearText("encrypt"); clearText("decrypt"); clearGenerated(); clearRing({ forgetSaved });
    for (const url of objectURLs) view.URL.revokeObjectURL(url);
    objectURLs.clear();
  }
  byId("clear-all").addEventListener("click", () => clearAll());
  view.addEventListener("pagehide", () => clearAll({ forgetSaved: false }));
  view.addEventListener("beforeunload", (event) => {
    if (!generated && !recovery.hasSensitiveState() && !byId("plaintext").value && !byId("encrypted-output").value && !byId("decrypted-output").value && !(ring.list().length && !publicSnapshotCurrent)) return;
    event.preventDefault(); event.returnValue = "";
  });
  if (!supported) byId("capability-warning").hidden = false;
  if (!supported) for (const button of doc.querySelectorAll("[data-crypto-submit]")) button.disabled = true;
  importControls(); renderRing();
  if (supported) {
    try {
      const saved = readPublicSnapshot(view.localStorage, keyTools.MAX_KEYRING_BYTES);
      if (saved !== null) {
        rememberPublic = true;
        byId("remember-public-keyring").checked = true;
        void importPublic(saved, "", false, true);
      }
    } catch {
      setStatus("public-storage-status", "Saved public keyring unavailable or malformed. It was not overwritten. Storage may be blocked; use an external .asc backup or explicitly forget the saved copy.", "error");
    }
  }
  return Object.freeze({ clearAll });
}

if (typeof document !== "undefined" && typeof window !== "undefined") mountWorkbench();
