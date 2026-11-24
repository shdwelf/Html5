import assert from "node:assert/strict";
import { test } from "node:test";
import { inspectRecoveryKey, recoverPrivateKeyCandidates } from "../apps/openpgp-workbench/recovery-worker-client.mjs";
import { RECOVERY_LIMITS, RecoveryError } from "../apps/openpgp-workbench/recovery.mjs";

// Protocol doubles only, not claimed as actual crypto or browser worker tests.
const armor = "-----BEGIN PGP PRIVATE KEY BLOCK-----\nsynthetic protocol double only\n-----END PGP PRIVATE KEY BLOCK-----";
const fingerprint = "A".repeat(40), candidates = ["synthetic first guess", "synthetic second guess"];
const identity = { fingerprint, version: 4, secretPackets: 2, profile: "v4-25519" };
const result = { status: "matched", fingerprint, secretPackets: 2, index: 1, attempted: 2, total: 2 };
const code = (expected) => (error) => error instanceof RecoveryError && error.code === expected && !error.message.includes(candidates[0]);
function harness(reply) {
  const workers = [];
  class WorkerClass {
    constructor(url, options) { this.url = url; this.options = options; this.terminations = 0; workers.push(this); }
    postMessage(payload) { this.payload = structuredClone(payload); if (reply) queueMicrotask(() => reply(this)); }
    terminate() { this.terminations++; }
    send(data) { this.onmessage?.({ data }); }
  }
  const controls = { WorkerClass, timeoutMs: 1000 };
  return { workers, WorkerClass, controls };
}
function success(worker, status = "matched") {
  worker.send({ type: "progress", attempted: 1, total: 2 });
  worker.send({ type: "progress", attempted: 2, total: 2 });
  worker.send({ type: "result", result: status === "matched" ? result : { status, fingerprint, secretPackets: 2, attempted: 2, total: 2 } });
}
function terminated(worker) {
  assert.equal(worker.terminations, 1); assert.equal(worker.onmessage, null); assert.equal(worker.onerror, null); assert.equal(worker.onmessageerror, null);
}

test("inspection uses a fresh relative local module worker and returns only bounded public metadata", async () => {
  const h = harness((worker) => worker.send({ type: "inspected", identity }));
  assert.deepEqual(await inspectRecoveryKey(armor, h.controls), identity);
  const [worker] = h.workers; terminated(worker);
  assert.ok(worker.url instanceof URL); assert.match(worker.url.pathname, /\/recovery-worker\.mjs$/);
  assert.equal(worker.options.type, "module");
  assert.deepEqual(worker.payload, { operation: "inspect", armoredKey: armor });
});

test("candidate recovery clones bounded inputs, reports only counts/index and terminates for either exact match or bounded no-match", async () => {
  for (const status of ["matched", "not-found"]) {
    const progress = [], h = harness((worker) => success(worker, status));
    const reply = await recoverPrivateKeyCandidates(armor, fingerprint.toLowerCase(), candidates, { ...h.controls, onProgress: (value) => progress.push(value) });
    assert.equal(reply.status, status); assert.equal(reply.total, 2); assert.ok(Object.isFrozen(reply));
    assert.ok(!JSON.stringify(reply).includes(candidates[1]));
    assert.deepEqual(progress, [{ attempted: 1, total: 2 }, { attempted: 2, total: 2 }]);
    assert.deepEqual(h.workers[0].payload, { operation: "recover", armoredKey: armor, expectedFingerprint: fingerprint, candidates });
    assert.deepEqual(candidates, ["synthetic first guess", "synthetic second guess"]); terminated(h.workers[0]);
  }
});

test("pre-aborted, unavailable-worker, invalid input/fingerprint/candidate/time budgets fail without creating work or a main-thread fallback", async () => {
  const h = harness(), controller = new AbortController(); controller.abort();
  await assert.rejects(inspectRecoveryKey(armor, { ...h.controls, signal: controller.signal }), code("ABORTED"));
  await assert.rejects(recoverPrivateKeyCandidates(armor, fingerprint, candidates, { WorkerClass: null }), code("WORKER"));
  for (const timeoutMs of [0, -1, 1.1, NaN, Infinity, RECOVERY_LIMITS.previewTimeoutMs + 1]) await assert.rejects(inspectRecoveryKey(armor, { ...h.controls, timeoutMs }), code("INPUT"));
  await assert.rejects(recoverPrivateKeyCandidates(armor, fingerprint, candidates, { ...h.controls, timeoutMs: RECOVERY_LIMITS.timeoutMs + 1 }), code("INPUT"));
  await assert.rejects(inspectRecoveryKey("public key", h.controls), code("KEY"));
  await assert.rejects(recoverPrivateKeyCandidates(armor, "A".repeat(16), candidates, h.controls), code("FINGERPRINT"));
  await assert.rejects(recoverPrivateKeyCandidates(armor, fingerprint, [], h.controls), code("INPUT"));
  assert.equal(h.workers.length, 0);
});

test("Stop and Clear aborts terminate immediately; stale captured callbacks cannot resolve a canceled job", async () => {
  const h = harness(), controller = new AbortController();
  const pending = recoverPrivateKeyCandidates(armor, fingerprint, candidates, { ...h.controls, signal: controller.signal });
  const [worker] = h.workers, oldHandler = worker.onmessage;
  worker.send({ type: "progress", attempted: 1, total: 2 });
  controller.abort(); terminated(worker);
  oldHandler({ data: { type: "result", result } });
  await assert.rejects(pending, code("ABORTED")); terminated(worker);
});

test("hard timeouts terminate during a candidate and never turn an incomplete run into an exhausted-list result", async () => {
  const h = harness((worker) => worker.send({ type: "progress", attempted: 1, total: 2 }));
  await assert.rejects(recoverPrivateKeyCandidates(armor, fingerprint, candidates, { ...h.controls, timeoutMs: 15 }), code("TIMEOUT"));
  terminated(h.workers[0]);
  const inspect = harness();
  await assert.rejects(inspectRecoveryKey(armor, { ...inspect.controls, timeoutMs: 10 }), code("TIMEOUT")); terminated(inspect.workers[0]);
});

test("error events, construction/post failures and worker errors expose no dependency input or secret diagnostics", async () => {
  for (const reply of [
    (worker) => worker.onerror({ message: candidates[0], preventDefault() {} }),
    (worker) => worker.onmessageerror({ data: candidates[0] }),
    (worker) => worker.send({ type: "error", code: "ARGON2" }),
    (worker) => worker.send({ type: "error", code: candidates[0] }),
  ]) {
    const h = harness(reply);
    await assert.rejects(inspectRecoveryKey(armor, h.controls), (error) => error instanceof RecoveryError && !error.message.includes(candidates[0]));
    terminated(h.workers[0]);
  }
  class CannotConstruct { constructor() { throw new Error(candidates[0]); } }
  await assert.rejects(inspectRecoveryKey(armor, { WorkerClass: CannotConstruct }), code("WORKER"));
  let terminatedCount = 0;
  class CannotPost { postMessage() { throw new Error(candidates[0]); } terminate() { terminatedCount++; } }
  await assert.rejects(inspectRecoveryKey(armor, { WorkerClass: CannotPost }), code("WORKER")); assert.equal(terminatedCount, 1);
});

test("malformed, out-of-profile and secret-bearing inspect responses fail closed", async () => {
  for (const message of [
    null, {}, { type: "result", result }, { type: "inspected", identity, extra: "private" },
    ...[{ ...identity, privateKey: armor }, { ...identity, fingerprint: "A".repeat(16) }, { ...identity, secretPackets: 0 },
      { ...identity, secretPackets: 17 }, { ...identity, version: 6 }, { ...identity, profile: "v6-25519" },
      { ...identity, fingerprint: fingerprint.toLowerCase() }].map((identity) => ({ type: "inspected", identity })),
  ]) {
    const h = harness((worker) => worker.send(message));
    await assert.rejects(inspectRecoveryKey(armor, h.controls), code("RESPONSE")); terminated(h.workers[0]);
  }
});

test("invalid counters/index/fingerprint, inconsistent no-match and extra secret response fields are discarded", async () => {
  const invalid = [
    null, {}, { type: "progress", attempted: 3, total: 2 }, { type: "progress", attempted: 0, total: 2 },
    { type: "progress", attempted: 1, total: 3 }, { type: "progress", attempted: 1.5, total: 2 },
    ...[{ ...result, privateKey: armor }, { ...result, passphrase: candidates[1] }, { ...result, index: -1 },
      { ...result, index: 0 }, { ...result, attempted: 0 }, { ...result, total: 256 },
      { ...result, fingerprint: "B".repeat(40) }, { ...result, secretPackets: 0 }, { ...result, secretPackets: 17 },
      { status: "not-found", fingerprint, secretPackets: 2, attempted: 1, total: 2 },
    ].map((result) => ({ type: "result", result })),
  ];
  for (const message of invalid) {
    const h = harness((worker) => { worker.send({ type: "progress", attempted: 1, total: 2 }); worker.send(message); });
    await assert.rejects(recoverPrivateKeyCandidates(armor, fingerprint, candidates, h.controls), code("RESPONSE")); terminated(h.workers[0]);
  }
});

test("missing progress, skipped counts and a final result ahead of completed progress cannot claim successful/exhausted work", async () => {
  for (const reply of [
    (worker) => worker.send({ type: "result", result }),
    (worker) => worker.send({ type: "progress", attempted: 2, total: 2 }),
    (worker) => { worker.send({ type: "progress", attempted: 1, total: 2 }); worker.send({ type: "result", result }); },
  ]) {
    const h = harness(reply);
    await assert.rejects(recoverPrivateKeyCandidates(armor, fingerprint, candidates, h.controls), code("RESPONSE")); terminated(h.workers[0]);
  }
});

test("duplicate/out-of-order progress and callback exceptions are bounded failures; abort from progress suppresses later success", async () => {
  const h = harness((worker) => { worker.send({ type: "progress", attempted: 1, total: 2 }); worker.send({ type: "progress", attempted: 1, total: 2 }); });
  await assert.rejects(recoverPrivateKeyCandidates(armor, fingerprint, candidates, h.controls), code("RESPONSE")); terminated(h.workers[0]);
  const badCallback = harness((worker) => success(worker));
  await assert.rejects(recoverPrivateKeyCandidates(armor, fingerprint, candidates, { ...badCallback.controls, onProgress: () => { throw new Error(candidates[0]); } }), code("RESPONSE"));
  terminated(badCallback.workers[0]);
  const abort = new AbortController(), immediate = harness((worker) => success(worker));
  await assert.rejects(recoverPrivateKeyCandidates(armor, fingerprint, candidates, { ...immediate.controls, signal: abort.signal, onProgress: () => abort.abort() }), code("ABORTED"));
  terminated(immediate.workers[0]);
});
