// @vitest-environment node
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

const source = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');

function worker(keys: string[]) {
  const handlers: Record<string, (event: { waitUntil: (task: Promise<unknown>) => void }) => void> = {};
  const caches = {
    keys: vi.fn(async () => keys),
    delete: vi.fn(async (_key: string) => true),
  };
  const claim = vi.fn(async () => {});
  runInNewContext(source, {
    caches,
    self: {
      addEventListener: (name: string, handler: typeof handlers[string]) => { handlers[name] = handler; },
      clients: { claim },
    },
  });
  return {
    caches,
    claim,
    activate: () => new Promise((resolve, reject) => {
      handlers.activate({ waitUntil: task => { task.then(resolve, reject); } });
    }),
  };
}

describe('SITE-K service worker activation', () => {
  it('deletes only obsolete SITE-K caches, preserving current and unrelated caches', async () => {
    const sw = worker(['sitek-html5-v1', 'sitek-html5-v23', 'sitek-html5-v24', 'book-v1', 'other-app-v2']);
    await sw.activate();
    expect(sw.caches.delete.mock.calls).toEqual([['sitek-html5-v1'], ['sitek-html5-v23']]);
    expect(sw.claim).toHaveBeenCalledOnce();
  });

  it('claims clients without deleting anything on a fresh installation', async () => {
    const sw = worker([]);
    await sw.activate();
    expect(sw.caches.delete).not.toHaveBeenCalled();
    expect(sw.claim).toHaveBeenCalledOnce();
  });

  it('waits for obsolete cache deletion before claiming clients', async () => {
    const sw = worker(['sitek-html5-v23']);
    let finish!: (deleted: boolean) => void;
    sw.caches.delete.mockImplementation(() => new Promise<boolean>(resolve => { finish = resolve; }));
    const activation = sw.activate();
    await Promise.resolve();
    expect(sw.claim).not.toHaveBeenCalled();
    finish(true);
    await activation;
    expect(sw.claim).toHaveBeenCalledOnce();
  });
});
