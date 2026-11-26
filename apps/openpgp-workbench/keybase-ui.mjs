/** Optional public discovery only. No secret fields, storage, download or trust access. */
import { lookupKeybasePublicKeys, normalizeKeybaseUsername, KeybaseLookupError } from "./keybase.mjs";

export function mountKeybaseLookup({ doc, view, supported, onStage, lookup = lookupKeybasePublicKeys }) {
  const get = (id) => doc.getElementById(id), form = get("keybase-lookup-form");
  const launcher = /\bHtml5Library\/([^\s]+)/.exec(view.navigator.userAgent ?? "");
  // Advisory UX only: native offline profiles still enforce their own denial
  // and keep NO INTERNET permission. Never probe a service to detect access.
  const offline = Boolean(launcher && !launcher[1].endsWith("-network"));
  const available = supported && !offline;
  let revision = 0, operation = null, importBusy = false;
  const status = (message, kind = "info") => { get("keybase-status").textContent = message; get("keybase-status").dataset.kind = kind; };
  const initialStatus = () => !supported ? "Keybase lookup needs a secure context with Web Crypto. Manual public-key tools are available after opening over HTTPS."
    : offline ? "Keybase lookup is disabled in this offline Android build. Use the separate network build or an HTTPS browser, or load a public .asc file below. Local import still works."
      : "No request made. Keybase lookup is optional; local import and fuzzy keyring search do not contact Keybase.";
  function controls() {
    get("keybase-lookup").disabled = !available || Boolean(operation);
    get("keybase-lookup").setAttribute("aria-busy", String(Boolean(operation)));
    get("keybase-cancel").disabled = !operation;
    get("keybase-username").disabled = !available;
    get("keybase-network-ack").disabled = !available;
    for (const button of get("keybase-results").querySelectorAll("button")) button.disabled = !available || importBusy;
  }
  function discard(message) {
    revision++; const previous = operation; operation = null; previous?.controller.abort();
    get("keybase-results").replaceChildren(); get("keybase-result").hidden = true; get("keybase-source").textContent = "";
    status(message); controls();
  }
  function clear() { form.reset(); discard(initialStatus()); }
  function current(epoch, username) {
    if (epoch !== revision || !get("keybase-network-ack").checked) return false;
    try { return normalizeKeybaseUsername(get("keybase-username").value) === username; } catch { return false; }
  }
  function render(result, epoch) {
    get("keybase-source").textContent = `Source: ${result.source}. Fingerprints below were calculated locally from public certificates. Keybase account ownership and identity proofs have NOT been verified.`;
    for (const entry of result.entries) {
      const item = doc.createElement("li"), fingerprint = doc.createElement("code"), uid = doc.createElement("p"), state = doc.createElement("p"), stage = doc.createElement("button");
      item.className = "keyring-item"; fingerprint.className = "fingerprint";
      fingerprint.textContent = entry.fingerprint.match(/.{4}/g).join(" ");
      uid.textContent = entry.userIDs.join(" · ").replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, "�") || "No textual User ID";
      state.className = "field-hint";
      state.textContent = `${entry.algorithm} · ${entry.selfCertification}. User IDs are unverified claims. ${entry.encryptionFingerprint ? "A currently usable bound encryption key was detected, not the owner's identity." : "No currently usable bound encryption key detected; archival/signing-only data cannot be used as an encryption recipient."}`;
      stage.type = "button"; stage.className = "button button-secondary";
      stage.textContent = "Load this PUBLIC certificate for review";
      stage.addEventListener("click", () => {
        if (!available || importBusy || !current(epoch, result.username)) return;
        // The callback only replaces local public input. It must not fill an
        // independently obtained expected fingerprint or import automatically.
        onStage(entry.armored);
        status("Certificate loaded into the import form only (replacing its public input). Review it and compare an independently obtained full fingerprint, then explicitly Import public keys. No identity was verified.", "success");
      });
      item.append(fingerprint, uid, state, stage); get("keybase-results").append(item);
    }
    get("keybase-result").hidden = false;
  }
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!available || operation) return;
    discard(initialStatus());
    let username;
    try {
      if (!get("keybase-network-ack").checked) { status("Acknowledge the Keybase network disclosure before explicitly looking up a username.", "error"); return; }
      username = normalizeKeybaseUsername(get("keybase-username").value);
    } catch (error) { status(error.message, "error"); return; }
    const epoch = revision, controller = new AbortController(), pending = { controller };
    operation = pending; controls();
    status(`Looking up ${username} on Keybase and validating the entire PUBLIC file locally (1 MiB / 32 certificates, at most 15 seconds)…`);
    try {
      const result = await lookup(username, { signal: controller.signal });
      if (controller.signal.aborted || !current(epoch, username)) return;
      render(result, epoch);
      status(`${result.entries.length} public certificate${result.entries.length === 1 ? "" : "s"} previewed, NOT imported or trusted. Load a chosen certificate for review below; the expected fingerprint is never filled from Keybase.`, "success");
    } catch (error) {
      if (!controller.signal.aborted && current(epoch, username)) status(error instanceof KeybaseLookupError ? error.message : "Keybase lookup or local validation failed. Nothing was loaded or imported; you can use a public .asc file manually.", "error");
    } finally {
      if (operation === pending) { operation = null; controls(); }
    }
  });
  get("keybase-username").addEventListener("input", () => discard("Username changed. Previous lookup/result discarded; submit explicitly for a fresh lookup."));
  get("keybase-network-ack").addEventListener("change", () => discard("Network choice changed. Previous lookup/result discarded; no automatic request."));
  get("keybase-cancel").addEventListener("click", () => discard("Lookup canceled; late results are discarded. A request already sent cannot be recalled from Keybase."));
  get("keybase-clear").addEventListener("click", clear);
  clear();
  return Object.freeze({ clear, setImportBusy(busy) { importBusy = busy; controls(); } });
}
