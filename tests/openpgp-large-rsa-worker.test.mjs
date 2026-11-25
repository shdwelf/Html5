import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { generateLargeRsaKey, LARGE_RSA_TIMEOUT_MS } from "../apps/openpgp-workbench/large-rsa.mjs";
import { buildLargeRsaWorker, patchLargeRsaDispatch } from "../scripts/openpgp-large-rsa-build.mjs";

const valid = { name: "Synthetic worker control only", rsaBits: 16384, passphrase: "Synthetic passphrase, never reuse", expiryDays: 30 };
function fakeWorkers({ constructionFails = false, postFails = false } = {}) {
  const instances = [];
  class FakeWorker {
    constructor(url, options) {
      if (constructionFails) throw new Error("synthetic launch failure");
      assert.match(url.pathname, /\/large-rsa-worker\.bundle\.mjs$/);
      assert.equal(options.type, "module");
      this.terminated = 0; instances.push(this);
    }
    postMessage(data) { if (postFails) throw new Error("synthetic clone failure"); this.request = data; }
    terminate() { this.terminated++; }
  }
  return { instances, FakeWorker };
}
const cleaned = (worker) => {
  assert.equal(worker.terminated, 1); assert.equal(worker.onmessage, null);
  assert.equal(worker.onerror, null); assert.equal(worker.onmessageerror, null);
};

test("worker-only dispatch patch is a single reviewed condition and the whole build is reproducible with readable corresponding source", async () => {
  const original = readFileSync(new URL("../node_modules/openpgp/dist/openpgp.mjs", import.meta.url), "utf8");
  const patched = patchLargeRsaDispatch(original);
  assert.equal(patched.replace("if (bits <= 8192 && util.getWebCrypto())", "if (util.getWebCrypto())"), original);
  assert.match(patched, /q = randomProbablePrime\(bits - \(bits >> 1\), e, 40\)/);
  assert.match(patched, /p = randomProbablePrime\(bits >> 1, e, 40\)/);
  assert.throws(() => patchLargeRsaDispatch(original + "\n"), /Unreviewed OpenPGP RSA source/);
  assert.throws(() => patchLargeRsaDispatch(original.replace("bits <= 8192", "bits <= 4096") + "//changed"), /Unreviewed OpenPGP RSA source/);
  const built = await buildLargeRsaWorker();
  const shipped = (path) => readFileSync(new URL(`../public/apps/openpgp-workbench/${path}`, import.meta.url), "utf8");
  assert.equal(shipped("large-rsa-worker.bundle.mjs"), built.compact);
  assert.equal(shipped("vendor/openpgp-large-rsa-worker.source.mjs"), built.readable);
  assert.deepEqual(JSON.parse(shipped("vendor/large-rsa-build.json")), built.metadata);
  assert.ok(/bits\w* <= 8192 && util.getWebCrypto\(\)/.test(built.readable), "readable source retains the reviewed native-size dispatch");
  assert.match(built.readable, /getRandomValues\(buf\)/);
  assert.ok(built.readable.includes("LGPL licensed code"), "retain the upstream distribution legal banner");
  assert.ok(built.readable.includes("noble-ciphers - MIT License"));
  assert.equal(shipped("vendor/openpgp.min.mjs"), readFileSync(new URL("../node_modules/openpgp/dist/openpgp.min.mjs", import.meta.url), "utf8"), "normal browser crypto must remain byte-identical upstream");
  const notice = shipped("THIRD_PARTY_NOTICES.md");
  assert.match(notice, /local build is not the unmodified upstream distribution/);
  assert.match(notice, /randomProbablePrime/);
});

test("worker preflight refuses native-size, malformed, unbounded and canceled requests before creating any worker", async () => {
  const { instances, FakeWorker } = fakeWorkers();
  const aborted = new AbortController(); aborted.abort();
  for (const rsaBits of [3072, 4096, 6144, 8192, 8193, 16385, "16384", null, NaN]) {
    await assert.rejects(generateLargeRsaKey({ ...valid, rsaBits }, { WorkerClass: FakeWorker }), /only for 12288\/16384|explicit supported RSA size/);
  }
  for (const update of [{ name: "x".repeat(129) }, { email: "not an email" }, { passphrase: "short" }, { expiryDays: 0 }]) {
    await assert.rejects(generateLargeRsaKey({ ...valid, ...update }, { WorkerClass: FakeWorker }));
  }
  for (const timeoutMs of [0, -1, Infinity, LARGE_RSA_TIMEOUT_MS + 1]) {
    await assert.rejects(generateLargeRsaKey(valid, { WorkerClass: FakeWorker, timeoutMs }), /resource limit/);
  }
  await assert.rejects(generateLargeRsaKey(valid, { WorkerClass: null }), /cannot run the isolated/);
  await assert.rejects(generateLargeRsaKey(valid, { WorkerClass: FakeWorker, signal: aborted.signal }), { name: "AbortError" });
  assert.equal(instances.length, 0);
});

test("clear/abort terminates a running worker exactly once, removes handlers and ignores any captured late reply", async () => {
  const { instances, FakeWorker } = fakeWorkers();
  const controller = new AbortController();
  const pending = generateLargeRsaKey(valid, { WorkerClass: FakeWorker, signal: controller.signal, timeoutMs: 2000 });
  const worker = instances[0], lateReply = worker.onmessage;
  assert.deepEqual(worker.request, { ...valid, email: "" });
  const rejected = assert.rejects(pending, { name: "AbortError" });
  controller.abort(); await rejected;
  cleaned(worker);
  await lateReply({ data: { bundle: { rsaBits: 16384 } } });
  cleaned(worker);
});

test("worker resource timeout, startup/clone errors and message errors fail closed without leaving background CPU work", async () => {
  {
    const { instances, FakeWorker } = fakeWorkers();
    await assert.rejects(generateLargeRsaKey(valid, { WorkerClass: FakeWorker, timeoutMs: 10 }), /resource limit/);
    cleaned(instances[0]);
  }
  for (const scenario of [{ constructionFails: true }, { postFails: true }]) {
    const { instances, FakeWorker } = fakeWorkers(scenario);
    await assert.rejects(generateLargeRsaKey(valid, { WorkerClass: FakeWorker }), /could not start/);
    instances.forEach(cleaned);
  }
  for (const eventName of ["onerror", "onmessageerror"]) {
    const { instances, FakeWorker } = fakeWorkers();
    const pending = generateLargeRsaKey(valid, { WorkerClass: FakeWorker });
    const rejected = assert.rejects(pending, /worker failed|Invalid large-RSA worker response/);
    instances[0][eventName]({ preventDefault() {} }); await rejected; cleaned(instances[0]);
  }
});

test("wrong-size, malformed and unprotected worker replies cannot become generated exports or leak dependency input in errors", async () => {
  for (const data of [
    { bundle: { rsaBits: 8192 } },
    { error: "SECRET INPUT MUST NOT APPEAR", bundle: null },
    { bundle: { rsaBits: 16384, fingerprint: "0".repeat(40), publicKey: "bad", privateKey: "bad", revocationCertificate: "bad" } },
    { bundle: { rsaBits: 16384, fingerprint: "0".repeat(40), publicKey: "x".repeat(1_048_577) } },
  ]) {
    const { instances, FakeWorker } = fakeWorkers();
    const pending = generateLargeRsaKey(valid, { WorkerClass: FakeWorker });
    const rejected = assert.rejects(pending, (error) => {
      assert.match(error.message, /failed validation/); assert.doesNotMatch(error.message, /SECRET INPUT/); return true;
    });
    await instances[0].onmessage({ data }); await rejected; cleaned(instances[0]);
  }
  await delay(0); // All listeners/timers removed: no delayed unhandled error.
});
