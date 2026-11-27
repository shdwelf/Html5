import { LIMITS, TorrentError, inspectTorrent, createTorrent } from './torrent.mjs';

// One job per short-lived worker. The parent terminates this worker on cancel,
// replacement, pagehide or the hard deadline; no fetch/peer/storage authority.
self.onmessage = async ({ data }) => {
  try {
    if (data?.operation === 'inspect') {
      const file = data.file;
      if (!file || file.size < 1 || file.size > LIMITS.metadataBytes) throw new TorrentError('Select a non-empty .torrent of at most 4 MiB.');
      const summary = await inspectTorrent(new Uint8Array(await file.arrayBuffer()), data.expected);
      self.postMessage({ type: 'result', result: { summary } });
    } else if (data?.operation === 'create') {
      const result = await createTorrent(data.files, data.options, (progress) => self.postMessage({ type: 'progress', ...progress }));
      self.postMessage({ type: 'result', result }, [result.bytes.buffer]);
    } else throw new TorrentError('Unsupported local operation.');
  } catch (error) {
    self.postMessage({ type: 'error', message: error instanceof TorrentError ? error.message : 'The local operation failed. No completed result is available.' });
  }
};
