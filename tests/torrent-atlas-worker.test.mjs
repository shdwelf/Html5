import test from 'node:test';
import assert from 'node:assert/strict';
import { createJobRunner } from '../apps/torrent-atlas/worker-client.mjs';
function boot(deadline = 20) {
  const workers = [], timers = new Map(); let sequence = 0;
  class Worker { constructor(url, options) { this.url = url; this.options = options; workers.push(this); } postMessage(data) { this.input = data; } terminate() { this.terminated = true; } message(data) { this.onmessage({ data }); } }
  return { workers, timers, runner: createJobRunner({ WorkerClass: Worker, deadline, timers: { setTimeout(fn) { timers.set(++sequence, fn); return sequence; }, clearTimeout(id) { timers.delete(id); } } }) };
}
test('worker lifecycle is module-only, one job, terminated and released on success', async () => {
  const { runner, workers, timers } = boot(), task = runner.run('inspect', { file: 'test' });
  assert.equal(runner.busy, true); assert.equal(workers[0].options.type, 'module'); assert.match(workers[0].url.pathname, /worker.mjs$/);
  workers[0].message({ type: 'result', result: { summary: 'ok' } }); assert.deepEqual(await task, { summary: 'ok' });
  assert.equal(runner.busy, false); assert.equal(workers[0].terminated, true); assert.equal(timers.size, 0);
});
test('cancel and replacement suppress late worker results', async () => {
  const { runner, workers } = boot(), first = runner.run('inspect', {}); const rejected = assert.rejects(first, { name: 'AbortError' });
  const next = runner.run('create', {}); await rejected; workers[0].message({ type: 'result', result: 'stale' });
  workers[1].message({ type: 'result', result: 'fresh' }); assert.equal(await next, 'fresh');
  const canceled = runner.run('inspect', {}); const rejection = assert.rejects(canceled, { name: 'AbortError' }); runner.cancel(); await rejection;
  assert.equal(workers[2].terminated, true);
});
test('deadline terminates work; progress does not postpone the hard deadline', async () => {
  const { runner, workers, timers } = boot(), progress = [], pending = runner.run('create', {}, { onProgress: (v) => progress.push(v.processed) });
  workers[0].message({ type: 'progress', processed: 3 }); assert.deepEqual(progress, [3]);
  const rejected = assert.rejects(pending, /deadline/); [...timers.values()][0](); await rejected;
  assert.equal(workers[0].terminated, true); assert.equal(timers.size, 0);
});
for (const behavior of ['error', 'malformed', 'messageerror', 'runtime']) test(`worker ${behavior} failure never returns a result`, async () => {
  const { runner, workers, timers } = boot(), pending = runner.run('inspect', {}), rejected = assert.rejects(pending);
  if (behavior === 'error') workers[0].message({ type: 'error', message: 'bounded failure' });
  if (behavior === 'malformed') workers[0].message({ type: 'wat' });
  if (behavior === 'messageerror') workers[0].onmessageerror();
  if (behavior === 'runtime') workers[0].onerror({ preventDefault() {} });
  await rejected; assert.equal(workers[0].terminated, true); assert.equal(timers.size, 0);
});
test('missing worker fails honestly rather than doing unbounded main-thread work', async () => {
  await assert.rejects(createJobRunner({ WorkerClass: null }).run('inspect', {}), /does not support/);
});
