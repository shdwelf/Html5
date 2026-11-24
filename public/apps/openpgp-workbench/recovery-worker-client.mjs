/** One request per local module worker, with strict non-secret replies. */
import { RECOVERY_LIMITS, RecoveryError, checkedRecoveryArmor, checkedRecoveryCandidates, normalizeRecoveryFingerprint } from "./recovery.mjs";
const exactFields = (value, fields) => value && typeof value === "object" && !Array.isArray(value) &&
  Object.keys(value).length === fields.length && fields.every((field) => Object.hasOwn(value, field));
function checkedIdentity(value) {
  if (!exactFields(value, ["fingerprint", "version", "secretPackets", "profile"]) ||
      normalizeRecoveryFingerprint(value.fingerprint) !== value.fingerprint || ![4, 6].includes(value.version) ||
      value.fingerprint.length !== (value.version === 4 ? 40 : 64) ||
      !Number.isInteger(value.secretPackets) || value.secretPackets < 1 || value.secretPackets > RECOVERY_LIMITS.secretPackets ||
      !(value.version === 4 ? ["v4-rsa", "v4-25519"] : ["v6-25519"]).includes(value.profile)) throw new RecoveryError("RESPONSE");
  return Object.freeze({ ...value });
}
function request(payload, { signal, WorkerClass = globalThis.Worker, timeoutMs, onProgress = () => {} } = {}) {
  const maximum = payload.operation === "inspect" ? RECOVERY_LIMITS.previewTimeoutMs : RECOVERY_LIMITS.timeoutMs;
  const limit = timeoutMs ?? maximum;
  if (!Number.isInteger(limit) || limit < 1 || limit > maximum) return Promise.reject(new RecoveryError("INPUT"));
  if (signal?.aborted) return Promise.reject(new RecoveryError("ABORTED"));
  if (typeof WorkerClass !== "function") return Promise.reject(new RecoveryError("WORKER"));
  return new Promise((resolve, reject) => {
    let worker, timer, settled = false, completed = 0;
    const abort = () => finish(new RecoveryError("ABORTED"));
    function finish(error, value) {
      if (settled) return;
      settled = true; clearTimeout(timer); signal?.removeEventListener("abort", abort);
      if (worker) { worker.onmessage = worker.onerror = worker.onmessageerror = null; worker.terminate(); }
      // Drop our references even when the request fails before postMessage.
      payload.armoredKey = ""; payload.candidates?.fill("");
      if (error) reject(error); else resolve(value);
    }
    try {
      worker = new WorkerClass(new URL("./recovery-worker.mjs", import.meta.url), { type: "module", name: "Local private-key passphrase recovery" });
      worker.onerror = (event) => { event.preventDefault?.(); finish(new RecoveryError("WORKER")); };
      worker.onmessageerror = () => finish(new RecoveryError("RESPONSE"));
      worker.onmessage = ({ data }) => {
        if (settled) return;
        try {
          if (exactFields(data, ["type", "code"]) && data.type === "error") { finish(new RecoveryError(data.code)); return; }
          if (payload.operation === "inspect") {
            if (!exactFields(data, ["type", "identity"]) || data.type !== "inspected") throw new RecoveryError("RESPONSE");
            finish(null, checkedIdentity(data.identity)); return;
          }
          const total = payload.candidates.length;
          if (exactFields(data, ["type", "attempted", "total"]) && data.type === "progress" && data.total === total &&
              Number.isInteger(data.attempted) && data.attempted === completed + 1 && data.attempted <= total) {
            completed = data.attempted; onProgress(Object.freeze({ attempted: completed, total })); return;
          }
          if (!exactFields(data, ["type", "result"]) || data.type !== "result") throw new RecoveryError("RESPONSE");
          const result = data.result, matched = result?.status === "matched";
          if (!exactFields(result, ["status", "attempted", "total", "fingerprint", "secretPackets", ...(matched ? ["index"] : [])]) ||
              !["matched", "not-found"].includes(result.status) || result.fingerprint !== payload.expectedFingerprint ||
              !Number.isInteger(result.attempted) || result.attempted < 1 || result.attempted !== completed || result.attempted > total || result.total !== total ||
              !Number.isInteger(result.secretPackets) || result.secretPackets < 1 || result.secretPackets > RECOVERY_LIMITS.secretPackets ||
              (matched ? result.index !== result.attempted - 1 : result.attempted !== total)) throw new RecoveryError("RESPONSE");
          finish(null, Object.freeze({ ...result }));
        } catch { finish(new RecoveryError("RESPONSE")); }
      };
      signal?.addEventListener("abort", abort, { once: true });
      if (signal?.aborted) { abort(); return; }
      timer = setTimeout(() => finish(new RecoveryError("TIMEOUT")), limit);
      worker.postMessage(payload);
    } catch { finish(new RecoveryError("WORKER")); }
  });
}
export async function inspectRecoveryKey(armoredKey, controls) {
  return request({ operation: "inspect", armoredKey: checkedRecoveryArmor(armoredKey) }, controls);
}
export async function recoverPrivateKeyCandidates(armoredKey, expectedFingerprint, candidates, controls) {
  return request({ operation: "recover", armoredKey: checkedRecoveryArmor(armoredKey),
    expectedFingerprint: normalizeRecoveryFingerprint(expectedFingerprint), candidates: checkedRecoveryCandidates(candidates) }, controls);
}
