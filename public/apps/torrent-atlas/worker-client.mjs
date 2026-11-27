import { LIMITS } from './torrent.mjs';

const canceled = (message) => new DOMException(message, 'AbortError');
/** Small injectable lifecycle boundary, used by both the UI and deterministic tests. */
export function createJobRunner({ WorkerClass = globalThis.Worker, deadline = LIMITS.workerMilliseconds, timers = globalThis } = {}) {
  let current = null;
  function cancel(message = 'Local operation canceled.') {
    const job = current;
    if (!job) return;
    current = null; timers.clearTimeout(job.timer); job.worker.terminate(); job.reject(canceled(message));
  }
  function run(operation, payload, { onProgress = () => {} } = {}) {
    cancel('Replaced by a newer local operation.');
    if (typeof WorkerClass !== 'function') return Promise.reject(new Error('This browser does not support the required local module worker.'));
    return new Promise((resolve, reject) => {
      let worker;
      try { worker = new WorkerClass(new URL('./worker.mjs', import.meta.url), { type: 'module' }); }
      catch { reject(new Error('The local worker could not start. Use a current browser over HTTPS.')); return; }
      const job = { worker, reject, timer: null }; current = job;
      const finish = (error, result) => {
        if (current !== job) return;
        current = null; timers.clearTimeout(job.timer); worker.terminate();
        if (error) reject(error); else resolve(result);
      };
      worker.onmessage = ({ data }) => {
        if (current !== job) return;
        if (data?.type === 'progress') { onProgress(data); return; }
        if (data?.type === 'result') finish(null, data.result);
        else if (data?.type === 'error') finish(new Error(String(data.message).slice(0, 300)));
        else finish(new Error('Unexpected local worker response.'));
      };
      worker.onerror = (event) => { event.preventDefault?.(); finish(new Error('The local worker failed. No result was retained.')); };
      worker.onmessageerror = () => finish(new Error('The local worker result could not be read.'));
      job.timer = timers.setTimeout(() => finish(new Error('The 60-second local operation deadline was reached. Try fewer/smaller files.')), deadline);
      try { worker.postMessage({ ...payload, operation }); }
      catch { finish(new Error('Local inputs could not be transferred to the worker.')); }
    });
  }
  return Object.freeze({ run, cancel, get busy() { return current !== null; } });
}
