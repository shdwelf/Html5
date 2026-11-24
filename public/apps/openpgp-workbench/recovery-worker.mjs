/** Shipped unchanged as a local module. Workers do not inherit page importmaps. */
import * as openpgp from "./vendor/openpgp.min.mjs";
import { createPrivateKeyRecoveryTools, RecoveryError } from "./recovery.mjs";

// Deliberately NOT the patched large-RSA generation distribution. No network
// search, remote dictionary, logs, keyring, storage or secret response fields.
const tools = createPrivateKeyRecoveryTools(openpgp);
let started = false;
self.onmessage = async ({ data }) => {
  if (started) return;
  started = true;
  try {
    if (data?.operation === "inspect") {
      self.postMessage({ type: "inspected", identity: await tools.inspectProtectedKey(data.armoredKey) });
    } else if (data?.operation === "recover") {
      const result = await tools.recoverProtectedKey(data.armoredKey, data.expectedFingerprint, data.candidates, {
        onProgress: ({ attempted, total }) => self.postMessage({ type: "progress", attempted, total }),
      });
      self.postMessage({ type: "result", result }); // Index/count only; never the matching passphrase or an unlocked key.
    } else { throw new RecoveryError("INPUT"); }
  } catch (error) {
    self.postMessage({ type: "error", code: error instanceof RecoveryError ? error.code : "WORKER" });
  } finally {
    if (data && typeof data === "object") { data.armoredKey = ""; if (Array.isArray(data.candidates)) data.candidates.fill(""); }
    self.close();
  }
};
