/* Packaged-origin-only Android export adapter. No fetch or arbitrary file reads. */
(() => {
  "use strict";
  if (window.top !== window || window.Html5LocalFiles) return;
  const MAX_BYTES = 64 * 1024 * 1024;
  const CHUNK_BYTES = 32768;
  const rpcPrompt = window.prompt.bind(window);
  const objectURLs = new Map();
  const originalCreate = URL.createObjectURL.bind(URL);
  const originalRevoke = URL.revokeObjectURL.bind(URL);
  const originalClick = HTMLAnchorElement.prototype.click;
  let busy = false;
  let epoch = 0;

  function rpc(data) {
    let response;
    try { response = JSON.parse(rpcPrompt("html5-local-file-v1", JSON.stringify(data)) || "null"); }
    catch { throw new Error("Android local-save adapter did not reply. No save is confirmed."); }
    if (!response || response.status === "error") throw new Error(response?.message || "Local save failed.");
    return response;
  }

  async function save(blob, name) {
    if (!(blob instanceof Blob) || blob.size > MAX_BYTES) throw new Error("Local saves are limited to 64 MiB per file.");
    if (busy) throw new Error("Another local save is pending. Finish or cancel it first.");
    busy = true;
    const generation = epoch;
    let id;
    try {
      ({ id } = rpc({ op: "begin", name: String(name || "export.bin"), mime: blob.type, size: blob.size }));
      if (typeof id !== "string" || !id) throw new Error("Local save could not start.");
      let sequence = 0;
      for (let offset = 0; offset < blob.size; offset += CHUNK_BYTES) {
        const bytes = new Uint8Array(await blob.slice(offset, offset + CHUNK_BYTES).arrayBuffer());
        if (generation !== epoch) throw new Error("Local save canceled by navigation.");
        let binary = "";
        for (let index = 0; index < bytes.length; index++) binary += String.fromCharCode(bytes[index]);
        const response = rpc({ op: "chunk", id, seq: sequence++, base64: btoa(binary) });
        if (response.status !== "chunk" || response.seq !== sequence) throw new Error("Local save chunk was not acknowledged.");
      }
      const receipt = rpc({ op: "finish", id }); // System picker; returns only after write + read-back.
      if (receipt.status === "canceled") return Object.freeze({ status: "canceled" });
      if (receipt.status !== "saved" || receipt.bytes !== blob.size || !/^[a-f0-9]{64}$/.test(receipt.sha256)) {
        throw new Error("Local save was not read-back verified. Check the destination.");
      }
      return Object.freeze({ status: "saved", bytes: receipt.bytes, sha256: receipt.sha256 });
    } catch (error) {
      if (id && generation === epoch) {
        try { rpc({ op: "cancel", id }); } catch { /* Best-effort temporary-file cleanup. */ }
      }
      throw error;
    } finally { busy = false; }
  }

  // Keep a Blob reference only until its creator revokes the URL. Snapshot it
  // synchronously before legacy apps immediately revoke after anchor.click().
  URL.createObjectURL = function (blob) {
    const url = originalCreate(blob);
    if (blob instanceof Blob) objectURLs.set(url, blob);
    return url;
  };
  URL.revokeObjectURL = function (url) { objectURLs.delete(String(url)); return originalRevoke(url); };

  function notify(message, error = false) {
    let status = document.getElementById("html5-local-save-status");
    if (!status) {
      status = document.createElement("p");
      status.id = "html5-local-save-status";
      status.setAttribute("role", "status");
      Object.assign(status.style, { position: "fixed", bottom: "12px", left: "12px", right: "12px", zIndex: "2147483647", padding: "12px", background: "#152335", color: "white", borderRadius: "8px", font: "14px system-ui" });
      document.body.append(status);
    }
    status.textContent = message;
    status.style.background = error ? "#78252a" : "#152335";
  }

  function intercept(anchor) {
    if (!anchor.hasAttribute("download")) return false;
    const blob = objectURLs.get(anchor.href);
    if (!blob) {
      notify("This export is not an in-page Blob. Open it in a full browser to download; no local save is confirmed.", true);
      return true;
    }
    notify("Choose a destination in Android Files. Save is not confirmed yet.");
    void save(blob, anchor.download).then((receipt) => {
      notify(receipt.status === "saved" ? `Saved ${receipt.bytes.toLocaleString()} bytes; read-back verified. SHA-256: ${receipt.sha256}` : "Save canceled. No completed save is confirmed.");
    }).catch((error) => notify(error.message, true));
    return true;
  }
  HTMLAnchorElement.prototype.click = function () {
    if (!intercept(this)) return originalClick.call(this);
  };
  document.addEventListener("click", (event) => {
    const anchor = event.target.closest?.("a[download]");
    if (anchor && intercept(anchor)) { event.preventDefault(); event.stopImmediatePropagation(); }
  }, true);
  window.addEventListener("pagehide", () => { epoch++; objectURLs.clear(); });
  Object.defineProperty(window, "Html5LocalFiles", { value: Object.freeze({ version: 1, save }), configurable: false, writable: false });
})();
