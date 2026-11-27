import { LIMITS, hex, inspectMagnet } from './torrent.mjs';
import { SOURCES, CATEGORIES, SEARCH_PROVIDERS, MANAGERS, buildSearchLink, filterSources, filterManagers } from './data.mjs';
import { createJobRunner } from './worker-client.mjs';

const $ = (id) => document.getElementById(id);
const node = (tag, value = '', className = '') => {
  const element = document.createElement(tag); element.textContent = value;
  if (className) element.className = className; return element;
};
const status = (id, message = '', error = false) => { $(id).textContent = message; $(id).classList.toggle('error', error); };
const formatBytes = (value) => {
  if (value === undefined) return 'Not supplied';
  if (!value) return '0 B';
  const unit = Math.min(3, Math.floor(Math.log(value) / Math.log(1024)));
  return `${(value / 1024 ** unit).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${['B', 'KiB', 'MiB', 'GiB'][unit]} (${value.toLocaleString()} bytes)`;
};
function externalLink(label, href) {
  const link = node('a', label); const url = new URL(href);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Refused an unreviewed outbound URL.');
  link.href = url.href; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.referrerPolicy = 'no-referrer'; return link;
}
function renderSources() {
  const list = filterSources($('source-filter').value, $('source-category').value);
  $('directory-count').textContent = `${list.length} / ${SOURCES.length} sources · local filter · research observations, not live checks`;
  $('source-cards').replaceChildren(...list.map((item) => {
    const card = node('article', '', 'source-card');
    const top = node('div', '', 'card-top'); top.append(node('h3', item.name), node('span', CATEGORIES[item.category], 'category'));
    card.append(top, node('p', item.description), node('p', item.caution, 'caution'));
    const detail = node('details'); detail.append(node('summary', 'Evidence & limits'), node('p', item.evidence));
    card.append(detail, externalLink('Visit primary source ↗', item.url)); return card;
  }));
}
function renderManagers() {
  const list = filterManagers($('manager-filter').value);
  $('manager-count').textContent = `${list.length} / ${MANAGERS.length} reviewed products, clients and retired features · not an exhaustive universe`;
  $('manager-cards').replaceChildren(...list.map((item) => {
    const card = node('article', '', 'source-card');
    card.append(node('h3', item.name), node('p', item.category, 'small'), node('p', item.description), node('p', item.caution, 'caution'), externalLink('Review primary documentation ↗', item.url));
    return card;
  }));
}
for (const provider of SEARCH_PROVIDERS) {
  const option = node('option', provider.name); option.value = provider.id; $('search-provider').append(option);
}
$('source-total').textContent = String(SOURCES.length);
$('source-filter').addEventListener('input', renderSources);
$('source-category').addEventListener('change', renderSources);
$('manager-filter').addEventListener('input', renderManagers);
renderSources(); renderManagers();
if (/Html5Library\//u.test(navigator.userAgent)) $('android-note').hidden = false; // Advisory only, never an authority gate.

let preparedSearch = '';
function forgetSearch() {
  preparedSearch = ''; $('search-open').removeAttribute('href'); $('search-url').value = '';
  $('search-destination').textContent = ''; $('search-preview').hidden = true; status('search-status');
}
for (const id of ['search-query', 'search-provider', 'search-consent']) for (const event of ['input', 'change']) $(id).addEventListener(event, forgetSearch);
$('search-form').addEventListener('submit', (event) => {
  event.preventDefault(); forgetSearch();
  try {
    if (!$('search-consent').checked) throw new Error('Consent is required before preparing an outbound query.');
    preparedSearch = buildSearchLink($('search-provider').value, $('search-query').value);
    $('search-url').value = preparedSearch; $('search-open').href = preparedSearch;
    $('search-destination').textContent = `Destination: ${new URL(preparedSearch).origin}. This query has NOT been sent.`;
    $('search-preview').hidden = false; status('search-status', 'Review the URL, then open the selected site. No results are fetched inside this app.');
  } catch (error) { status('search-status', error.message, true); }
});
$('search-open').addEventListener('click', (event) => {
  let valid = false;
  try { valid = $('search-consent').checked && preparedSearch && preparedSearch === buildSearchLink($('search-provider').value, $('search-query').value); } catch { /* Fail closed below. */ }
  if (!valid) { event.preventDefault(); forgetSearch(); status('search-status', 'Prepare a new link after reviewing consent and destination.', true); }
});
async function copyText(value, target, field) {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable.');
    await navigator.clipboard.writeText(value); status(target, 'Copied by request. Clipboard contents are outside this app’s control.');
  } catch {
    field?.focus(); field?.select(); status(target, 'Clipboard access was unavailable. Select the text and copy it yourself; no automatic copy is claimed.', true);
  }
}
$('search-copy').addEventListener('click', () => { if (preparedSearch && $('search-consent').checked) void copyText(preparedSearch, 'search-status', $('search-url')); });

function summaryView(container, summary, targetStatus) {
  container.replaceChildren(); container.hidden = false;
  container.append(node('h3', summary.name || 'Unnamed magnet'));
  const dl = node('dl');
  const row = (title, value, className) => { dl.append(node('dt', title), node('dd', value, className)); };
  row('Format', summary.version);
  row('Payload size', formatBytes(summary.total ?? summary.length));
  if (summary.pieceLength !== undefined) {
    row('Pieces', `${summary.pieceCount.toLocaleString()} × up to ${formatBytes(summary.pieceLength)}`);
    row('Private flag', summary.private ? 'PRIVATE — no magnet export' : 'Not marked private');
    row('Independent comparison', summary.expectedMatched ? 'Full supplied hash matches. Its provenance still needs verification.' : 'No expected hash supplied; publisher identity is NOT verified.');
  }
  if (summary.v1) row('v1 · SHA-1 infohash', summary.v1, 'hash');
  if (summary.v2) row('v2 · SHA-256 infohash', summary.v2, 'hash');
  container.append(dl, node('p', summary.warning, 'notice warning'));
  for (const [title, values] of [['Tracker URLs · not contacted', summary.trackers], ['Web seeds · not contacted', summary.webSeeds]]) if (values?.length) {
    const details = node('details'); details.append(node('summary', `${title} (${values.length}) · may contain private passkeys`));
    const ul = node('ul', '', 'endpoint-list'); for (const value of values) ul.append(node('li', value)); details.append(ul); container.append(details);
  }
  if (summary.stripped?.length) container.append(node('p', `Removed parameter types: ${summary.stripped.join(', ')}.`, 'muted small'));
  if (summary.magnet) {
    const label = node('label', 'Minimal magnet · no trackers, web seeds or explicit peers');
    const area = node('textarea'); area.readOnly = true; area.value = summary.magnet; area.rows = 3; area.spellcheck = false;
    label.append(area); const button = node('button', 'Copy minimal magnet'); button.type = 'button';
    button.addEventListener('click', () => void copyText(summary.magnet, targetStatus, area));
    container.append(label, button);
  } else container.append(node('p', 'Private flag preserved. Magnet generation is disabled; use the original/created .torrent with its authorized tracker policy.', 'notice warning'));
  if (summary.files) {
    container.append(node('p', `${summary.files.length} files. Showing the first ${Math.min(200, summary.files.length)}; paths are inert text, never extracted or opened.`, 'muted small'));
    const wrap = node('div', '', 'table-wrap'), table = node('table'), head = node('thead'), tr = node('tr');
    tr.append(node('th', 'Declared path'), node('th', 'Bytes')); head.append(tr); table.append(head);
    const body = node('tbody');
    for (const file of summary.files.slice(0, 200)) { const row = node('tr'); row.append(node('td', `${file.path.join('/')}${file.padding ? ' [padding]' : ''}`), node('td', file.length.toLocaleString())); body.append(row); }
    table.append(body); wrap.append(table); container.append(wrap);
  }
}
function clearMagnet() { $('magnet-result').replaceChildren(); $('magnet-result').hidden = true; status('magnet-status'); }
$('magnet-input').addEventListener('input', clearMagnet);
$('magnet-example').addEventListener('click', () => {
  clearMagnet(); $('magnet-input').value = 'magnet:?xt=urn:btih:0000000000000000000000000000000000000001&dn=Synthetic%20example%20only&tr=https%3A%2F%2Ftracker.example.invalid%2Fannounce';
  status('magnet-status', 'Synthetic example loaded. It is not a real downloadable item; no request was made.');
});
$('magnet-form').addEventListener('submit', (event) => {
  event.preventDefault(); clearMagnet();
  try { summaryView($('magnet-result'), inspectMagnet($('magnet-input').value), 'magnet-status'); status('magnet-status', 'Parsed locally. No metadata was fetched and no magnet handler was launched.'); }
  catch (error) { status('magnet-status', error.message, true); }
});

const runner = createJobRunner(); let revision = 0, runningKind = '', created = null, saving = false;
const objectURLs = new Set();
function revokeDownloads() { for (const url of objectURLs) URL.revokeObjectURL(url); objectURLs.clear(); }
function setBusy(kind = '') {
  runningKind = kind;
  $('inspect-cancel').disabled = kind !== 'inspect'; $('create-cancel').disabled = kind !== 'create';
  $('inspect-form').querySelector('[type=submit]').disabled = Boolean(kind);
  $('create-form').querySelector('[type=submit]').disabled = Boolean(kind);
}
function invalidateLocal(message = '') {
  revision++; runner.cancel(); const wasRunning = runningKind; setBusy(); created = null; revokeDownloads();
  for (const kind of ['inspect', 'create']) { $(`${kind}-result`).replaceChildren(); $(`${kind}-result`).hidden = true; status(`${kind}-status`); }
  $('save-torrent').hidden = true; status('save-status'); $('create-progress').hidden = true; $('create-progress').value = 0;
  if (wasRunning && message) status(`${wasRunning}-status`, message);
}
async function runLocal(kind, payload) {
  invalidateLocal(); const mine = revision; setBusy(kind);
  status(`${kind}-status`, kind === 'inspect' ? 'Reading and hashing bounded metadata in a local worker…' : 'Hashing selected files locally. Nothing is uploaded or seeded…');
  if (kind === 'create') { $('create-progress').hidden = false; $('create-progress').max = Math.max(1, payload.files.reduce((sum, file) => sum + file.size, 0)); }
  try {
    const result = await runner.run(kind, payload, { onProgress: (data) => {
      if (mine !== revision || kind !== 'create' || !Number.isSafeInteger(data.processed) || data.processed < 0 || data.processed > LIMITS.createBytes) return;
      $('create-progress').value = data.processed;
    } });
    if (mine !== revision) return;
    summaryView($(`${kind}-result`), result.summary, `${kind}-status`);
    if (kind === 'create') { created = result; $('save-torrent').hidden = false; $('create-progress').value = $('create-progress').max; }
    status(`${kind}-status`, kind === 'inspect' ? 'Metadata inspection complete. Payload bytes were not downloaded or verified.' : 'Real v1 .torrent built. Save it explicitly; a separate client must seed the source files.');
  } catch (error) {
    if (mine !== revision) return;
    status(`${kind}-status`, error.name === 'AbortError' ? 'Local operation canceled; no result retained.' : error.message, error.name !== 'AbortError');
  } finally { if (mine === revision) setBusy(); }
}
$('inspect-form').addEventListener('submit', (event) => {
  event.preventDefault(); const file = $('inspect-file').files[0];
  if (!file || file.size < 1 || file.size > LIMITS.metadataBytes) { invalidateLocal(); status('inspect-status', 'Select a non-empty .torrent of at most 4 MiB.', true); return; }
  const expected = $('expected-hash').value.trim();
  if (expected && !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/iu.test(expected)) { invalidateLocal(); status('inspect-status', 'Expected infohash must be complete: 40 hex characters for v1 or 64 for v2.', true); return; }
  void runLocal('inspect', { file, expected });
});
$('create-form').addEventListener('submit', (event) => {
  event.preventDefault(); const files = [...$('create-files').files];
  if (!$('create-consent').checked || !files.length || files.length > LIMITS.createFiles || files.reduce((n, file) => n + file.size, 0) > LIMITS.createBytes) {
    invalidateLocal(); status('create-status', 'Confirm sharing intent and choose 1–256 files, up to 256 MiB total.', true); return;
  }
  const trackers = $('create-trackers').value.split(/\r?\n/u).map((v) => v.trim()).filter(Boolean);
  void runLocal('create', { files, options: { name: $('create-name').value.trim(), pieceLength: Number($('piece-size').value), trackers, private: $('create-private').checked } });
});
for (const id of ['inspect-file', 'expected-hash', 'create-files', 'create-name', 'piece-size', 'create-trackers', 'create-private', 'create-consent']) {
  for (const event of ['input', 'change']) $(id).addEventListener(event, () => invalidateLocal('Inputs changed. The previous worker was terminated; no stale result retained.'));
}
$('create-files').addEventListener('change', () => {
  const files = [...$('create-files').files]; $('create-selection').textContent = files.length ? `${files.length} files selected · ${formatBytes(files.reduce((n, file) => n + file.size, 0))}. Filenames will appear in the torrent.` : 'No files selected.';
});
for (const kind of ['inspect', 'create']) $(`${kind}-cancel`).addEventListener('click', () => { invalidateLocal(); status(`${kind}-status`, 'Worker terminated. No completed result was retained.'); });
$('save-torrent').addEventListener('click', async () => {
  if (!created || saving) return;
  const snapshot = created, mine = revision; saving = true; $('save-torrent').disabled = true;
  const blob = new Blob([snapshot.bytes], { type: 'application/x-bittorrent' });
  try {
    if (window.Html5LocalFiles?.version === 1 && typeof window.Html5LocalFiles.save === 'function') {
      status('save-status', 'Choose a destination in the system Files picker. A completed save is not yet confirmed.');
      const receipt = await window.Html5LocalFiles.save(blob, snapshot.filename);
      if (mine !== revision) return;
      if (receipt?.status === 'canceled') status('save-status', 'Save canceled. No completed save is confirmed.');
      else if (receipt?.status === 'saved' && receipt.bytes === blob.size && /^[a-f0-9]{64}$/u.test(receipt.sha256 ?? '')) {
        const expected = hex(new Uint8Array(await crypto.subtle.digest('SHA-256', snapshot.bytes)));
        if (mine !== revision) return;
        if (receipt.sha256 !== expected) throw new Error('Native save receipt does not match the created torrent bytes.');
        status('save-status', `Saved ${receipt.bytes.toLocaleString()} bytes with native read-back verification. SHA-256: ${receipt.sha256}`);
      } else throw new Error('No valid completed-save receipt was returned. Check the selected destination.');
    } else {
      const url = URL.createObjectURL(blob); objectURLs.add(url);
      const anchor = node('a'); anchor.href = url; anchor.download = snapshot.filename; document.body.append(anchor); anchor.click(); anchor.remove();
      setTimeout(() => { URL.revokeObjectURL(url); objectURLs.delete(url); }, 5000);
      status('save-status', 'Browser download requested. Check the downloaded file; browser filesystem read-back has not been verified.');
    }
  } catch (error) { if (mine === revision) status('save-status', `Save failed or was not confirmed: ${error.message}`, true); }
  finally { saving = false; $('save-torrent').disabled = false; }
});
for (const button of document.querySelectorAll('[data-panel]')) button.addEventListener('click', () => {
  const id = button.dataset.panel;
  if (runningKind) invalidateLocal('Tool switched. The previous worker was terminated.');
  for (const candidate of document.querySelectorAll('[data-panel]')) { if (candidate === button) candidate.setAttribute('aria-current', 'page'); else candidate.removeAttribute('aria-current'); }
  for (const panel of document.querySelectorAll('.panel')) panel.hidden = panel.id !== `panel-${id}`;
  $(`${id}-heading`).focus({ preventScroll: true });
});
function clearSession(announce = false) {
  const savePending = saving; invalidateLocal(); forgetSearch(); clearMagnet();
  for (const form of document.querySelectorAll('form')) form.reset();
  $('source-filter').value = ''; $('source-category').value = 'all'; $('manager-filter').value = '';
  $('create-selection').textContent = 'No files selected.'; renderSources(); renderManagers();
  if (announce) status('global-status', savePending ? 'Session cleared. A save already handed to the system may still finish; check its destination.' : 'Session cleared. Inputs, consents and derived results were discarded; no history was stored.');
}
$('clear-all').addEventListener('click', () => clearSession(true));
window.addEventListener('pagehide', () => clearSession(false));
