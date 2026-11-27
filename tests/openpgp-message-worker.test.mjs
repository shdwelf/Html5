import assert from 'node:assert/strict';
import { test } from 'node:test';
import { decryptMessageInput } from '../apps/openpgp-workbench/message-worker-client.mjs';
import { MAX_ENCRYPTED_BYTES, MAX_PLAINTEXT_BYTES } from '../apps/openpgp-workbench/text-tools.mjs';
const input = Uint8Array.of(0xc3, 1, 2), passphrase = 'synthetic worker password';
class Worker {
  static instances = [];
  constructor(url, options) { this.url = url; this.options = options; Worker.instances.push(this); }
  postMessage(payload) { this.payload = structuredClone(payload); }
  terminate() { this.terminated = true; }
}
const start = (controls = {}) => { const promise = decryptMessageInput(input, passphrase, { WorkerClass: Worker, ...controls }); return { promise, worker: Worker.instances.at(-1) }; };

test('local module worker receives only the chosen message and passphrase; valid bounded bytes terminate it', async () => {
  const { promise, worker } = start();
  assert.match(worker.url.href, /\/message-worker.mjs$/); assert.equal(worker.options.type, 'module');
  assert.deepEqual(Object.keys(worker.payload).sort(), ['input', 'passphrase']);
  const bytes = Uint8Array.of(0, 255, 1); worker.onmessage({ data: { type: 'result', bytes } });
  assert.equal(await promise, bytes); assert.equal(worker.terminated, true);
});
test('abort, errors, malformed replies and worker deadline terminate without accepting late plaintext', async () => {
  const controller = new AbortController(), job = start({ signal: controller.signal });
  const late = job.worker.onmessage; controller.abort();
  await assert.rejects(job.promise, { name: 'AbortError' }); assert.equal(job.worker.terminated, true);
  late({ data: { type: 'result', bytes: Uint8Array.of(1) } });
  for (const data of [{ type: 'result', bytes: 'not bytes' }, { type: 'result', bytes: new Uint8Array(MAX_PLAINTEXT_BYTES + 1) }, { type: 'result', bytes: input, privateKey: 'never accepted' }, { type: 'error', code: 'UNKNOWN' }]) {
    const { promise, worker } = start(); worker.onmessage({ data }); await assert.rejects(promise, /invalid response/); assert.equal(worker.terminated, true);
  }
  const deadline = start({ timeoutMs: 1 }); await assert.rejects(deadline.promise, /limit was reached/); assert.equal(deadline.worker.terminated, true);
});
test('public-key-only error is clear, but arbitrary library/input text cannot escape worker protocol', async () => {
  const { promise, worker } = start(); worker.onmessage({ data: { type: 'error', code: 'KEY_REQUIRED' } });
  await assert.rejects(promise, /matching private key or authorized hardware key/);
});
test('empty/oversized files or passphrases, unsupported workers and invalid deadlines fail before any worker/file read', async () => {
  let reads = 0; const count = Worker.instances.length;
  for (const size of [0, MAX_ENCRYPTED_BYTES + 1]) await assert.rejects(decryptMessageInput({ size, arrayBuffer() { reads++; } }, passphrase, { WorkerClass: Worker }), /1–2,097,152/);
  assert.equal(reads, 0); assert.equal(Worker.instances.length, count);
  await assert.rejects(decryptMessageInput(input, '', { WorkerClass: Worker }), /passphrase/);
  await assert.rejects(decryptMessageInput(input, passphrase, { WorkerClass: undefined }), /requires a local module worker/);
  await assert.rejects(decryptMessageInput(input, passphrase, { WorkerClass: Worker, timeoutMs: 30001 }), /deadline/);
});
