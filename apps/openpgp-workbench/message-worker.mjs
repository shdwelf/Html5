/** No page importmap, keyring, secret key, storage, remote request or file execution. */
import * as openpgp from './vendor/openpgp.min.mjs';
import { createOpenPgpTextTools, MAX_ENCRYPTED_BYTES } from './text-tools.mjs';
const tools = createOpenPgpTextTools(openpgp);
let started = false;
self.onmessage = async ({ data }) => {
  if (started) return;
  started = true;
  try {
    let input = data?.input;
    if (input && typeof input.arrayBuffer === 'function') {
      if (!Number.isSafeInteger(input.size) || input.size < 1 || input.size > MAX_ENCRYPTED_BYTES) throw new RangeError('File bound');
      const buffer = await input.arrayBuffer();
      if (buffer.byteLength !== input.size) throw new RangeError('Incomplete file read');
      input = new Uint8Array(buffer);
    }
    const bytes = await tools.decryptOpenPgpBytes(input, data?.passphrase);
    self.postMessage({ type: 'result', bytes }, [bytes.buffer]);
  } catch (error) {
    // Never include a user filename, input, passphrase or library exception text
    // in a worker response/log. Private-key-only messages get a clear boundary.
    self.postMessage({ type: 'error', code: error?.code === 'PRIVATE_KEY_REQUIRED' ? 'KEY_REQUIRED' : error instanceof RangeError ? 'LIMIT' : error instanceof TypeError ? 'INPUT' : 'FAILED' });
  } finally {
    if (data && typeof data === 'object') { data.input = null; data.passphrase = ''; }
    self.close();
  }
};
