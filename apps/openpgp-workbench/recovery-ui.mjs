/** Explicit, transient recovery UI; completely separate from the PUBLIC keyring. */
import { buildRecoveryPlan, checkedRecoveryArmor, normalizeRecoveryFingerprint, RECOVERY_LIMITS, RecoveryError } from "./recovery.mjs";
import * as workerTools from "./recovery-worker-client.mjs";

export function mountPrivateKeyRecovery({ doc, view, supported, tools = workerTools }) {
  const get = (id) => doc.getElementById(id), form = get("recovery-form");
  let preview = null, matchingCandidate = "", operation = null, revision = 0;
  const fileEpochs = { "recovery-private-key": 0, "recovery-wordlist": 0 }, pendingFiles = new Map();
  const options = () => ({ wordlist: get("recovery-wordlist").value, hint: get("recovery-hint").value,
    maxDistance: Number(get("recovery-distance").value), variants: get("recovery-variants").checked });
  const status = (message, kind = "info") => { get("recovery-status").textContent = message; get("recovery-status").dataset.kind = kind; };
  const errorText = (error) => new RecoveryError(error instanceof RecoveryError ? error.code : "WORKER").message;
  function controls() {
    get("recovery-preview").disabled = !supported || Boolean(operation) || pendingFiles.size > 0;
    get("recovery-start").disabled = !supported || Boolean(operation) || pendingFiles.size > 0 || !preview || !get("recovery-owner-ack").checked;
    get("recovery-stop").disabled = !operation;
    get("recovery-preview").setAttribute("aria-busy", String(operation?.phase === "preview"));
    get("recovery-start").setAttribute("aria-busy", String(operation?.phase === "recover"));
    for (const node of form.querySelectorAll("[data-recovery-input]")) node.disabled = Boolean(operation);
    get("recovery-reveal-preview").disabled = !preview;
  }
  function hideMatch() {
    matchingCandidate = "";
    get("recovery-match").value = ""; get("recovery-match").hidden = true;
    get("recovery-reveal-match").hidden = true; get("recovery-reveal-match").textContent = "Reveal matching candidate";
    get("recovery-reveal-match").setAttribute("aria-expanded", "false");
  }
  function discardPreview() {
    preview = null; get("recovery-candidates").replaceChildren(); get("recovery-summary").textContent = "No candidate plan previewed.";
    get("recovery-key-identity").textContent = "No protected key inspected.";
    get("recovery-reveal-preview").checked = false;
  }
  function cancel() { const previous = operation; operation = null; previous?.controller.abort(); revision++; }
  function progress(attempted, total) {
    get("recovery-progress").max = total || 1; get("recovery-progress").value = attempted;
    get("recovery-progress-count").textContent = `${attempted} / ${total} completed exact candidate attempts`;
  }
  function invalidate(message = "Inputs changed. Preview a fresh candidate plan before attempting an unlock.") {
    cancel(); discardPreview(); hideMatch(); progress(0, 0); status(message); controls();
  }
  function renderPreview() {
    const list = get("recovery-candidates"); list.replaceChildren();
    if (!preview) return;
    const reveal = get("recovery-reveal-preview").checked;
    for (const candidate of preview.plan.candidates) {
      const item = doc.createElement("li"), value = doc.createElement("bdi"), metadata = doc.createElement("span");
      value.dir = "ltr"; value.className = "recovery-candidate";
      value.textContent = reveal ? candidate.value : `[${Array.from(candidate.value).length} characters hidden]`;
      metadata.textContent = ` · ${preview.options.hint ? `distance ${candidate.distance} · ` : ""}${candidate.source}`;
      item.append(value, metadata); list.append(item); // Guesses are untrusted text, never markup.
    }
  }
  for (const id of ["recovery-private-key", "recovery-wordlist", "recovery-hint", "recovery-distance", "recovery-variants"]) {
    get(id).addEventListener("input", () => {
      if (Object.hasOwn(fileEpochs, id)) { fileEpochs[id]++; pendingFiles.delete(id); }
      invalidate();
    });
    // Some engines emit only change for a select/checkbox. Duplicate invalidation is harmless.
    if (["recovery-distance", "recovery-variants"].includes(id)) get(id).addEventListener("change", () => invalidate());
  }
  for (const id of ["recovery-fingerprint", "recovery-owner-ack"]) {
    const changed = () => {
      if (operation) invalidate("Confirmation changed; the worker was terminated. Preview again before attempting recovery.");
      else controls();
    };
    get(id).addEventListener("input", changed); get(id).addEventListener("change", changed);
  }
  for (const [fileId, target, maximum] of [
    ["recovery-key-file", "recovery-private-key", RECOVERY_LIMITS.keyBytes],
    ["recovery-wordlist-file", "recovery-wordlist", RECOVERY_LIMITS.wordlistBytes],
  ]) get(fileId).addEventListener("change", async (event) => {
    invalidate("Reading the selected local file into the input only; no key inspection or passphrase attempt yet.");
    const token = ++fileEpochs[target], file = event.target.files?.[0];
    if (!file) { controls(); return; }
    pendingFiles.set(target, token); get(target).value = ""; controls();
    try {
      if (!Number.isInteger(file.size) || file.size < 1 || file.size > maximum) throw new RecoveryError(target === "recovery-private-key" ? "KEY" : "INPUT");
      const bytes = await file.arrayBuffer();
      if (fileEpochs[target] !== token) return;
      if (bytes.byteLength > maximum) throw new RecoveryError(target === "recovery-private-key" ? "KEY" : "INPUT");
      // No replacement of malformed UTF-8; BOM/space/case remain candidate data.
      let text;
      try { text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes); }
      catch { throw new RecoveryError(target === "recovery-private-key" ? "KEY" : "INPUT"); }
      if (target === "recovery-private-key") checkedRecoveryArmor(text);
      else buildRecoveryPlan({ wordlist: text });
      get(target).value = text;
      status("Selected file loaded into the input only. Review it and preview the local plan; nothing was uploaded or attempted.");
    } catch (error) {
      if (fileEpochs[target] === token) { get(target).value = ""; status(errorText(error), "error"); }
    } finally {
      if (fileEpochs[target] === token) { pendingFiles.delete(target); get(fileId).value = ""; }
      controls();
    }
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!supported || operation || pendingFiles.size) return;
    invalidate("Preparing a bounded plan and inspecting key protection in a local worker. No passphrases are being tried…");
    let snapshot, current;
    const requestedRevision = revision;
    try {
      const selected = options(), armor = checkedRecoveryArmor(get("recovery-private-key").value), plan = buildRecoveryPlan(selected);
      const controller = new AbortController();
      current = { controller, phase: "preview", revision, attempted: 0, total: plan.total };
      operation = current; controls();
      const identity = await tools.inspectRecoveryKey(armor, { signal: controller.signal, WorkerClass: view.Worker });
      if (operation !== current || revision !== current.revision) return;
      snapshot = { armor, options: selected, plan, identity }; preview = snapshot;
      get("recovery-key-identity").textContent = `${identity.fingerprint} · ${identity.profile} · ${identity.secretPackets} protected secret packets`;
      get("recovery-summary").textContent = `${plan.total} candidates to attempt: ${plan.matchedEntries} ranked wordlist entries + ${plan.includedVariants} hint/typo candidates. ${plan.duplicateEntries} exact duplicate entries removed; ${plan.excludedEntries} unique entries excluded by the hint/distance filter; ${plan.omittedVariants} generated variants omitted by the ${RECOVERY_LIMITS.candidates}-candidate cap. Empty lines are ignored. No attempts yet.`;
      progress(0, plan.total); renderPreview();
      status("Preview ready. Compare the full fingerprint independently and acknowledge permission before Start. Fuzzy scores select guesses, not partial cryptographic matches.", "success");
    } catch (error) {
      if (current ? operation === current && revision === current.revision : revision === requestedRevision && !operation) status(errorText(error), "error");
    } finally {
      // A canceled older preview must never re-enable controls over a new job.
      if (operation === current) operation = null;
      snapshot = null; controls();
    }
  });
  get("recovery-reveal-preview").addEventListener("change", renderPreview);
  get("recovery-start").addEventListener("click", async () => {
    if (!supported || operation || pendingFiles.size || !preview || !get("recovery-owner-ack").checked) return;
    let saved = preview, candidates, current;
    try {
      const expected = normalizeRecoveryFingerprint(get("recovery-fingerprint").value);
      if (expected !== saved.identity.fingerprint) throw new RecoveryError("FINGERPRINT");
      if (checkedRecoveryArmor(get("recovery-private-key").value) !== saved.armor || JSON.stringify(options()) !== JSON.stringify(saved.options)) {
        invalidate("The inputs no longer match the preview. Preview again; no attempts were made."); return;
      }
      candidates = saved.plan.candidates.map((entry) => entry.value);
      current = { controller: new AbortController(), phase: "recover", revision, attempted: 0, total: candidates.length };
      operation = current; preview = null; hideMatch(); get("recovery-reveal-preview").checked = false;
      get("recovery-candidates").replaceChildren();
      // No automatic secret exports or public-keyring import, even on success.
      for (const id of ["recovery-private-key", "recovery-wordlist", "recovery-hint", "recovery-key-file", "recovery-wordlist-file"]) get(id).value = "";
      controls(); status("Trying exact candidates locally, one packet at a time. Inputs have been cleared; Stop terminates the worker. Limit: 256 candidates / 120 seconds.");
      const result = await tools.recoverPrivateKeyCandidates(saved.armor, expected, candidates, {
        signal: current.controller.signal, WorkerClass: view.Worker,
        onProgress: ({ attempted, total }) => {
          if (operation !== current || revision !== current.revision) return;
          current.attempted = attempted; progress(attempted, total);
        },
      });
      if (operation !== current || revision !== current.revision) return;
      if (result.fingerprint !== expected || result.secretPackets !== saved.identity.secretPackets || result.total !== candidates.length ||
          !["matched", "not-found"].includes(result.status) || (result.status === "matched" && typeof candidates[result.index] !== "string")) throw new RecoveryError("RESPONSE");
      progress(result.attempted, result.total);
      if (result.status === "matched") {
        matchingCandidate = candidates[result.index]; get("recovery-reveal-match").hidden = false;
        status(`Exact candidate #${result.index + 1} unlocked and validated all ${result.secretPackets} included secret packets. No key, message or file was exported/decrypted. This does not establish owner identity, certificate validity or client compatibility. Reveal the candidate only in private.`, "success");
      } else {
        status(`No candidate unlocked and validated every included secret packet (${result.attempted}/${result.total} completed). This bounded plan is exhausted, not all possible passphrases. Missing candidates, different per-packet passphrases or damaged key material may be responsible; near matches are not partial unlocks.`);
      }
    } catch (error) {
      if (!current || (operation === current && revision === current.revision)) status(errorText(error), "error");
    } finally {
      candidates?.fill(""); saved = null;
      if (operation === current) operation = null;
      controls();
    }
  });
  get("recovery-stop").addEventListener("click", () => {
    if (!operation) return;
    const { phase, attempted, total } = operation;
    cancel(); discardPreview(); hideMatch(); progress(attempted, total); controls();
    status(phase === "preview" ? "Preview stopped and worker terminated. No candidate attempts were made." :
      `Stopped: ${attempted}/${total} completed attempts were reported. Worker terminated; late results are discarded. This is not a completed/exhausted search.`);
  });
  get("recovery-reveal-match").addEventListener("click", () => {
    if (!matchingCandidate) return;
    const reveal = get("recovery-match").hidden;
    get("recovery-match").value = reveal ? matchingCandidate : ""; get("recovery-match").hidden = !reveal;
    get("recovery-reveal-match").textContent = reveal ? "Hide matching candidate" : "Reveal matching candidate";
    get("recovery-reveal-match").setAttribute("aria-expanded", String(reveal));
  });
  function clear() {
    cancel(); for (const id of Object.keys(fileEpochs)) fileEpochs[id]++;
    pendingFiles.clear(); form.reset(); discardPreview(); hideMatch(); progress(0, 0); controls();
    status("Recovery inputs, preview and match cleared; any worker terminated. Originals on disk are unchanged. Browser/clipboard/disk erasure is not guaranteed.");
  }
  get("recovery-clear").addEventListener("click", clear);
  controls();
  return Object.freeze({ clear, hasSensitiveState: () => Boolean(operation || preview || matchingCandidate || pendingFiles.size ||
    get("recovery-private-key").value || get("recovery-wordlist").value || get("recovery-hint").value) });
}
