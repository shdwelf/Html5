/** One explicit password-message decrypt request per terminating local worker. */
import { checkedMessageInput, MAX_ENCRYPTED_BYTES, MAX_PASSPHRASE_BYTES, MAX_PLAINTEXT_BYTES, MESSAGE_TIMEOUT_MS } from './text-tools.mjs';
const messages = Object.freeze({
  INPUT: 'Choose one complete armored or binary encrypted OpenPGP message. Keys, signatures, arbitrary text and URLs are not message inputs.',
  LIMIT: 'The encrypted-file, decrypted-payload or key-derivation memory limit was exceeded. Limits: 2 MiB input / 1 MiB output / 64 MiB Argon2.',
  KEY_REQUIRED: 'This message is encrypted only to a public key. A passphrase or public certificate alone cannot decrypt it. Use a trusted client with the matching private key or authorized hardware key; no private-key input is requested here.',
  FAILED: 'Message decryption failed. Check the passphrase and message integrity/profile. No plaintext is released on failure.',
});
export function decryptMessageInput(input, passphrase, { signal, WorkerClass = globalThis.Worker, timeoutMs = MESSAGE_TIMEOUT_MS } = {}) {
  if (typeof passphrase !== 'string' || !passphrase || new TextEncoder().encode(passphrase).length > MAX_PASSPHRASE_BYTES) return Promise.reject(new Error('Enter a non-empty passphrase of at most 4,096 UTF-8 bytes.'));
  if (input && typeof input.arrayBuffer === 'function') {
    if (!Number.isSafeInteger(input.size) || input.size < 1 || input.size > MAX_ENCRYPTED_BYTES) return Promise.reject(new Error('Choose an encrypted file of 1–2,097,152 bytes.'));
  } else {
    try { checkedMessageInput(input); } catch (error) { return Promise.reject(error); }
  }
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > MESSAGE_TIMEOUT_MS) return Promise.reject(new Error('Invalid message-worker deadline.'));
  if (typeof WorkerClass !== 'function') return Promise.reject(new Error('This operation requires a local module worker. Use a current browser over HTTPS; there is no main-thread fallback.'));
  const aborted = () => new DOMException('Message operation canceled. No late result retained.', 'AbortError');
  if (signal?.aborted) return Promise.reject(aborted());
  return new Promise((resolve, reject) => {
    let worker, timer, settled = false;
    const payload = { input, passphrase };
    const abort = () => finish(aborted());
    function finish(error, value) {
      if (settled) return;
      settled = true; clearTimeout(timer); signal?.removeEventListener('abort', abort);
      if (worker) { worker.onmessage = worker.onerror = worker.onmessageerror = null; worker.terminate(); }
      payload.input = null; payload.passphrase = '';
      if (error) reject(error); else resolve(value);
    }
    try {
      worker = new WorkerClass(new URL('./message-worker.mjs', import.meta.url), { type: 'module', name: 'Local passphrase message decryption' });
      worker.onerror = (event) => { event.preventDefault?.(); finish(new Error('The local message worker failed. No result retained.')); };
      worker.onmessageerror = () => finish(new Error('The message worker returned unreadable data.'));
      worker.onmessage = ({ data }) => {
        if (settled) return;
        if (data && Object.keys(data).length === 2 && data.type === 'error' && Object.hasOwn(messages, data.code)) finish(new Error(messages[data.code]));
        else if (data && Object.keys(data).length === 2 && data.type === 'result' && data.bytes instanceof Uint8Array && data.bytes.length <= MAX_PLAINTEXT_BYTES) finish(null, data.bytes);
        else finish(new Error('The message worker returned an invalid response. No plaintext accepted.'));
      };
      signal?.addEventListener('abort', abort, { once: true });
      if (signal?.aborted) { abort(); return; }
      timer = setTimeout(() => finish(new Error('The 30-second message decryption limit was reached. Worker terminated; no result retained.')), timeoutMs);
      worker.postMessage(payload);
      // postMessage clones these inputs synchronously. Do not retain an extra
      // passphrase/file reference for the worker lifetime.
      payload.passphrase = ''; payload.input = null;
    } catch { finish(new Error('The local message worker could not start or receive this input.')); }
  });
}
