/** Explicit, bounded working-key persistence and Webxdc sharing; no operations on startup. */
export function installWorkspace({ validateKey, parseKey, reviewHTML, notices, manifest, report, bridge }) {
  const listeners = new Set();
  let key = validateKey({});
  let pendingShared = null;
  let lastSerial = -1;
  let listenerInstalled = false;
  const storageName = 'armstrong-madison.review.key.v1';
  const legacyName = 'madison1808.key';
  const $ = (id) => document.getElementById(id);
  const status = (message) => { if ($('workspace-status')) $('workspace-status').textContent = message; };
  const read = () => ({ ...key });
  const update = (next) => {
    try {
      key = validateKey(typeof next === 'function' ? next(read()) : next);
      for (const notify of listeners) notify(read());
      status(`${Object.keys(key).length} working labels in memory. Not automatically saved or shared.`);
    } catch (error) {
      status(`Working key unchanged: ${error.message}`);
    }
  };
  async function saveBlob(blob, name) {
    if (window.Html5LocalFiles?.version === 1 && typeof window.Html5LocalFiles.save === 'function') {
      const result = await window.Html5LocalFiles.save(blob, name);
      if (result?.status === 'canceled') return status('Save canceled.');
      if (result?.status !== 'saved' || result.bytes !== blob.size || !/^[0-9a-f]{64}$/u.test(result.sha256 || '')) throw new Error('The native host returned no valid save receipt.');
      const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', await blob.arrayBuffer()))].map((byte) => byte.toString(16).padStart(2, '0')).join('');
      if (hash !== result.sha256) throw new Error('The native save receipt hash does not match the export.');
      return status(`Saved ${name}; native byte count and SHA-256 receipt verified.`);
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = name;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    status(`Download requested: ${name}. Browser/host storage was not independently confirmed.`);
  }
  function portableHTML(includeBridge = false) {
    const clone = document.documentElement.cloneNode(true);
    clone.querySelector('#root')?.replaceChildren();
    clone.querySelector('#workspace-status')?.replaceChildren();
    clone.querySelector('#workspace-share-consent')?.removeAttribute('checked');
    for (const node of clone.querySelectorAll('[data-workspace-button]')) node.removeAttribute('disabled');
    const bridgeScripts = [...clone.querySelectorAll('script[src="./webxdc.js"],script[src="webxdc.js"]')];
    for (const node of bridgeScripts) node.remove();
    // A standalone HTML export has no bridge tag. Re-add it when that HTML is
    // subsequently packed as XDC, before either inline bootstrap can run.
    if (includeBridge) {
      const script = document.createElement('script');
      script.src = './webxdc.js';
      clone.querySelector('head').insertBefore(script, clone.querySelector('head script'));
    }
    return `<!doctype html>\n${clone.outerHTML}`;
  }
  window.ArmstrongReviewHTML = reviewHTML;
  window.ArmstrongWorkspace = Object.freeze({
    read, update,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    portableHTML,
    saveBlob,
    exportMembers() {
      const encode = (text) => new TextEncoder().encode(text);
      return [
        { name: 'index.html', data: encode(portableHTML(true)) },
        { name: 'manifest.toml', data: encode(manifest) },
        { name: 'webxdc.js', data: encode(bridge) },
        { name: 'THIRD_PARTY_NOTICES.txt', data: encode(notices) },
        { name: 'SOURCE-CHECK.md', data: encode(report) },
      ];
    },
  });
  function start() {
    $('workspace-save').addEventListener('click', () => {
      try {
        const text = JSON.stringify(read());
        localStorage.setItem(storageName, text);
        if (localStorage.getItem(storageName) !== text) throw new Error('Stored key read-back differs.');
        status('Guesses saved unencrypted on this device by request. No chat message sent. Browser storage can be cleared or evicted.');
      } catch (error) { status(`Not saved: ${error.message}`); }
    });
    $('workspace-load').addEventListener('click', () => {
      try {
        const text = localStorage.getItem(storageName) || localStorage.getItem(legacyName);
        if (!text) return status('No saved key found for this app.');
        update(parseKey(text));
        status('Saved guesses loaded by request. They remain hypotheses, not verified plaintext.');
      } catch (error) { status(`Saved key not loaded: ${error.message}`); }
    });
    $('workspace-forget').addEventListener('click', () => {
      try {
        localStorage.removeItem(storageName); localStorage.removeItem(legacyName);
        status('This app\'s current and legacy saved-key entries removed. In-memory guesses and chat history are unchanged; secure erasure is not claimed.');
      } catch (error) { status(`Could not remove the saved-key entries: ${error.message}`); }
    });
    $('workspace-export').addEventListener('click', async () => {
      try { await saveBlob(new Blob([JSON.stringify(read(), null, 2) + '\n'], { type: 'application/json' }), 'armstrong-working-hypothesis.json'); }
      catch (error) { status(`Export failed: ${error.message}`); }
    });
    $('workspace-import').addEventListener('change', async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        if (file.size > 384000) throw new Error('The selected JSON file is too large.');
        update(parseKey(await file.text()));
      } catch (error) { status(`Import not applied: ${error.message}`); }
      finally { event.target.value = ''; }
    });
    const shareReady = () => {
      const allowed = $('workspace-share-consent').checked;
      if (!allowed) pendingShared = null;
      $('workspace-share').disabled = !allowed || typeof window.webxdc?.sendUpdate !== 'function';
      $('workspace-receive').disabled = !allowed || typeof window.webxdc?.setUpdateListener !== 'function';
    };
    $('workspace-share-consent').addEventListener('change', shareReady);
    $('workspace-share').addEventListener('click', async () => {
      if (!$('workspace-share-consent').checked) return status('Sharing requires the explicit checkbox.');
      const host = window.webxdc;
      if (typeof host?.sendUpdate !== 'function') return status('No Webxdc chat host is available.');
      try {
        const current = read(); const count = Object.keys(current).length;
        await host.sendUpdate({ payload: { type: 'key', key: current, count, by: typeof host.selfName === 'string' ? host.selfName.slice(0, 80) : '' }, summary: `${count} hypothetical code labels`, info: 'Working hypothesis shared explicitly; not an established decryption.' }, 'Share Armstrong working guesses');
        status('The chat host accepted the explicit share request; remote delivery is not independently verified.');
      } catch (error) { status(`Share failed: ${error.message}`); }
    });
    $('workspace-receive').addEventListener('click', async () => {
      if (!$('workspace-share-consent').checked) return status('Loading chat guesses requires the explicit checkbox.');
      const host = window.webxdc;
      if (typeof host?.setUpdateListener !== 'function') return status('No Webxdc chat host is available.');
      try {
        if (!listenerInstalled) {
          listenerInstalled = true;
          try {
            await host.setUpdateListener((message) => {
              if (!$('workspace-share-consent').checked || message?.payload?.type !== 'key') return;
              const serial = Number.isSafeInteger(message.serial) ? message.serial : 0;
              if (serial < lastSerial) return;
              try { pendingShared = validateKey(message.payload.key); lastSerial = serial; }
              catch { /* Invalid shared maps never replace local guesses. */ }
            }, 0);
          } catch (error) { listenerInstalled = false; throw error; }
        }
        // Later updates only refresh this pending buffer; they never overwrite the user's edits.
        if (!pendingShared) return status('No valid shared key is available yet. Select Load shared guesses again after history arrives.');
        update(pendingShared);
        status('Last available shared guesses loaded by request. Future arrivals do not automatically overwrite your work.');
      } catch (error) { status(`Shared key not loaded: ${error.message}`); }
    });
    shareReady();
    status('Working guesses start in memory only. Save, load, import, export and chat sharing require explicit actions.');
    document.body.dataset.workspaceReady = 'true';
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
}
