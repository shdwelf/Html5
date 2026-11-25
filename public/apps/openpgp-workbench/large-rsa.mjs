/** Above Chromium's native 8192-bit ceiling: one isolated, locally built worker. */
import {
  checkedGenerationOptions, checkedPrivateDownload, createPublicKeyring,
  MAX_KEYRING_BYTES, normalizeFingerprint,
} from "./keyring.mjs";

export const LARGE_RSA_TIMEOUT_MS = 20 * 60 * 1000;

export async function generateLargeRsaKey(options, { signal, WorkerClass = globalThis.Worker, timeoutMs = LARGE_RSA_TIMEOUT_MS } = {}) {
  const checked = checkedGenerationOptions(options);
  const expectedSize = checked.rsaBits;
  if (expectedSize <= 8192) throw new Error("The isolated large-RSA worker is only for 12288/16384-bit keys.");
  if (typeof WorkerClass !== "function") throw new Error("This browser cannot run the isolated large-RSA worker. Import a reviewed public certificate instead; no smaller key was substituted.");
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > LARGE_RSA_TIMEOUT_MS) throw new Error("Invalid large-RSA worker resource limit.");
  const abortError = () => Object.assign(new Error("Large-RSA generation cleared; the worker was terminated and its result discarded."), { name: "AbortError" });
  if (signal?.aborted) throw abortError();
  return new Promise((resolve, reject) => {
    let worker, timer, settled = false;
    function finish(error, bundle) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      if (worker) {
        worker.onmessage = worker.onerror = worker.onmessageerror = null;
        worker.terminate();
      }
      if (error) reject(error); else resolve(bundle);
    }
    const abort = () => finish(abortError());
    try {
      worker = new WorkerClass(new URL("./large-rsa-worker.bundle.mjs", import.meta.url), { type: "module", name: "Local large-RSA generation" });
      worker.onerror = (event) => { event.preventDefault?.(); finish(new Error("The isolated large-RSA worker failed. No smaller key was substituted.")); };
      worker.onmessageerror = () => finish(new Error("Invalid large-RSA worker response. Nothing was retained."));
      worker.onmessage = async ({ data }) => {
        if (settled) return;
        worker.onmessage = null; // At most one reply is ever accepted.
        try {
          const bundle = data?.bundle;
          if (!bundle || data.error || bundle.rsaBits !== expectedSize) throw new Error("Invalid large-RSA worker result size.");
          const fingerprint = normalizeFingerprint(bundle.fingerprint);
          for (const field of ["publicKey", "privateKey", "revocationCertificate"]) {
            if (typeof bundle[field] !== "string" || bundle[field].length > MAX_KEYRING_BYTES) throw new Error("Invalid large-RSA worker export.");
          }
          await checkedPrivateDownload(bundle.privateKey, fingerprint, { rsaBits: expectedSize });
          const ring = createPublicKeyring();
          const [entry] = await ring.importKeys(bundle.publicKey, { expectedFingerprint: fingerprint });
          if (entry.algorithm !== `v4 RSA-${expectedSize}` || !entry.selfCertification.startsWith("valid at import time") ||
              !Number.isFinite(Date.parse(bundle.created)) || !Number.isFinite(Date.parse(bundle.expires))) throw new Error("Invalid large-RSA worker public certificate.");
          finish(null, Object.freeze({
            rsaBits: expectedSize, fingerprint, publicKey: bundle.publicKey, privateKey: bundle.privateKey,
            revocationCertificate: bundle.revocationCertificate, created: bundle.created, expires: bundle.expires,
          }));
        } catch { finish(new Error("Large-RSA worker output failed validation. Nothing was retained and no smaller key was substituted.")); }
      };
      signal?.addEventListener("abort", abort, { once: true });
      // Close the small construction/listener race for already canceled work.
      if (signal?.aborted) { abort(); return; }
      timer = setTimeout(() => finish(new Error("Large-RSA generation reached its 20-minute resource limit; the worker was terminated. No key was retained.")), timeoutMs);
      worker.postMessage(checked);
    } catch { finish(new Error("The isolated large-RSA worker could not start. No smaller key was substituted.")); }
  });
}
