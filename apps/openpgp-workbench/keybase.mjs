/** The Workbench's only optional remote request: an exact username's PUBLIC file. */
import { MAX_KEYRING_BYTES, parsePublicKeyring } from "./keyring.mjs";

export const KEYBASE_ORIGIN = "https://keybase.io";
export const KEYBASE_TIMEOUT_MS = 15_000;
const messages = Object.freeze({
  USERNAME: "Enter an exact Keybase username: 2–16 ASCII letters/digits, with single underscores only (not first). No email, URL, @ prefix or fuzzy search.",
  UNAVAILABLE: "This browser cannot perform a bounded Keybase lookup. Load a public .asc file manually instead.",
  NETWORK: "Keybase lookup failed. Check connectivity, browser CORS/privacy settings or the Android network profile; you can still load a public .asc file manually. No proxy or automatic retry is used.",
  NOT_FOUND: "No published OpenPGP public-key file was found for that username. This does not prove the account does not exist.",
  RATE_LIMIT: "Keybase rate-limited this lookup. Wait before explicitly trying again, or load a public .asc file manually.",
  RESPONSE: "Keybase returned an unexpected response or redirect. No result was accepted.",
  SIZE: "Keybase's public-key file exceeds the 1 MiB limit. No result was accepted.",
  ENCODING: "Keybase's public-key file is not valid UTF-8 text. No result was accepted.",
  CERTIFICATE: "The entire Keybase file could not be validated as supported PUBLIC certificates. Private, malformed, mixed or unsupported packets are refused; inspect the original in a dedicated OpenPGP client. Nothing was imported.",
  TIMEOUT: "Keybase lookup timed out after at most 15 seconds. No result was accepted; retry only if you choose.",
  ABORTED: "Keybase lookup canceled; its result was discarded.",
});

export class KeybaseLookupError extends Error {
  constructor(code) {
    super(messages[code] ?? messages.RESPONSE);
    this.name = code === "ABORTED" ? "AbortError" : "KeybaseLookupError";
    this.code = code;
  }
}

export function normalizeKeybaseUsername(value) {
  if (typeof value !== "string" || value.length > 64) throw new KeybaseLookupError("USERNAME");
  const username = value.trim().toLowerCase();
  // Matches Keybase's kbun rules: no leading/doubled underscore; trailing is OK.
  if (!/^[a-z0-9][a-z0-9_]{1,15}$/.test(username) || username.includes("__")) throw new KeybaseLookupError("USERNAME");
  return username;
}

function assertActive(signal) {
  if (signal.aborted) throw new KeybaseLookupError("ABORTED");
}
// Also settles for a transport/parser that ignores AbortSignal. Late results
// have no side effects: parsing is read-only, never a live keyring import.
function abortable(task, signal) {
  return new Promise((resolve, reject) => {
    const aborted = () => { signal.removeEventListener("abort", aborted); reject(new KeybaseLookupError("ABORTED")); };
    // Always consume the task's late rejection, even if it aborts synchronously.
    Promise.resolve(task).then(
      (value) => { signal.removeEventListener("abort", aborted); resolve(value); },
      (error) => { signal.removeEventListener("abort", aborted); reject(error); },
    );
    if (signal.aborted) aborted();
    else signal.addEventListener("abort", aborted, { once: true });
  });
}

async function boundedPublicText(response, signal) {
  const length = response.headers.get("content-length");
  if (length && /^\d+$/.test(length) && Number(length) > MAX_KEYRING_BYTES) throw new KeybaseLookupError("SIZE");
  // Never fall back to unbounded response.text()/arrayBuffer(). Content-Length
  // is only a preflight hint; the stream's actual, decoded byte count is bound.
  if (typeof response.body?.getReader !== "function") throw new KeybaseLookupError("UNAVAILABLE");
  const reader = response.body.getReader(), bytes = new Uint8Array(MAX_KEYRING_BYTES);
  let size = 0, complete = false;
  try {
    for (;;) {
      const { done, value } = await abortable(reader.read(), signal);
      assertActive(signal);
      if (done) { complete = true; break; }
      if (!(value instanceof Uint8Array)) throw new KeybaseLookupError("RESPONSE");
      if (size + value.byteLength > MAX_KEYRING_BYTES) throw new KeybaseLookupError("SIZE");
      bytes.set(value, size); size += value.byteLength;
    }
    try { return new TextDecoder("utf-8", { fatal: true }).decode(bytes.subarray(0, size)); }
    catch { throw new KeybaseLookupError("ENCODING"); }
  } finally {
    if (!complete) { try { void reader.cancel().catch(() => {}); } catch { /* already aborted */ } }
    reader.releaseLock();
  }
}

/** No login, API token, identity/proof verification, publishing or persistence. */
export async function lookupKeybasePublicKeys(value, { signal, fetchImpl = globalThis.fetch, timeoutMs = KEYBASE_TIMEOUT_MS } = {}) {
  const username = normalizeKeybaseUsername(value);
  if (signal?.aborted) throw new KeybaseLookupError("ABORTED");
  if (typeof fetchImpl !== "function") throw new KeybaseLookupError("UNAVAILABLE");
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > KEYBASE_TIMEOUT_MS) throw new RangeError("Keybase timeout must be between 1 and 15000 milliseconds.");
  const source = `${KEYBASE_ORIGIN}/${username}/pgp_keys.asc`, controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  let timedOut = false, complete = false, parsing = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  try {
    const response = await abortable(fetchImpl(source, {
      method: "GET", mode: "cors", credentials: "omit", referrerPolicy: "no-referrer",
      cache: "no-store", redirect: "error", headers: { Accept: "application/pgp-keys, text/plain;q=0.9" },
      signal: controller.signal,
    }), controller.signal);
    assertActive(controller.signal);
    if (response.redirected || (response.url && response.url !== source)) throw new KeybaseLookupError("RESPONSE");
    if (response.status === 404) throw new KeybaseLookupError("NOT_FOUND");
    if (response.status === 429) throw new KeybaseLookupError("RATE_LIMIT");
    // Partial responses must not silently hide other keys in a user's file.
    if (response.status !== 200) throw new KeybaseLookupError("RESPONSE");
    const armored = await boundedPublicText(response, controller.signal);
    parsing = true;
    const entries = await abortable(parsePublicKeyring(armored), controller.signal);
    assertActive(controller.signal);
    if (!entries.length) throw new KeybaseLookupError("CERTIFICATE");
    complete = true;
    return Object.freeze({ username, source, entries: Object.freeze(entries) });
  } catch (error) {
    if (timedOut) throw new KeybaseLookupError("TIMEOUT");
    if (controller.signal.aborted) throw new KeybaseLookupError("ABORTED");
    if (error instanceof KeybaseLookupError) throw error;
    throw new KeybaseLookupError(parsing ? "CERTIFICATE" : "NETWORK");
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
    if (!complete) controller.abort();
  }
}
