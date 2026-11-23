/** Build entry, bundled with the pinned worker-only OpenPGP RSA dispatch patch. */
import { checkedRsaBits, generateCompatibilityKey } from "./keyring.mjs";

// One explicit request per dedicated worker. No shared worker, persistence,
// remote imports, logging, unprotected key messages or production fixtures.
let started = false;
self.onmessage = async ({ data }) => {
  if (started) return;
  started = true;
  try {
    const bits = checkedRsaBits(data?.rsaBits);
    if (bits <= 8192) throw new Error("This worker only handles the explicit 12288/16384-bit generation choices.");
    const bundle = await generateCompatibilityKey(data);
    self.postMessage({ bundle }); // Protected armor only; never raw private parameters.
  } catch {
    // No dependency error object, input, passphrase or key bytes in messages/logs.
    self.postMessage({ error: "Large-RSA generation failed in the isolated worker. No smaller key was substituted." });
  } finally { self.close(); }
};
