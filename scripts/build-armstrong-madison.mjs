#!/usr/bin/env node
/** Hash-gated preservation of the supplied workbench + an original, reproducible offline source review. */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { unzipSync, zipSync } from '../vendor/fflate/index.mjs';
import { makeReceipt } from '../apps/armstrong-madison/analysis.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const AUTHOR = 'apps/armstrong-madison';
const EVIDENCE = 'docs/research/armstrong-madison-1808';
export const INPUT_SHA256 = '9bd424b0c8349f30d6fb9872eab68d4db64281a689a3a5b0e4e0aeb5b80e7d96';
export const EVIDENCE_FILES = Object.freeze([
  'founders-feb20.txt', 'afio-key.json', 'afio-claimed-plaintext.txt', 'audit.json', 'dossier.json',
  'attachment.json', 'github-receipt.json', 'github-comparison.txt', 'github-MIT-LICENSE.txt',
  'gutenberg-receipt.json', 'gutenberg-metadata.yaml', 'gutenberg-jefferson-may2.txt', 'gutenberg-formula-hit.txt',
]);
// ZIP stores timezone-free DOS fields. Pin the wall clock, not an instant
// whose local representation would change on a builder in another timezone.
const ZIP_TIMESTAMP = '2026-11-17T00:00:00';
const STAMP = new Date(2026, 10, 17, 0, 0, 0);
const sha256 = (data) => createHash('sha256').update(data).digest('hex');
const shaBase64 = (data) => createHash('sha256').update(data).digest('base64');
const text = (name) => readFileSync(join(ROOT, name), 'utf8');
const bytes = (name) => readFileSync(join(ROOT, name));
const serial = (value) => JSON.stringify(value).replace(/</gu, '\\u003c').replace(/\u2028/gu, '\\u2028').replace(/\u2029/gu, '\\u2029');
const ownModule = (name) => text(`${AUTHOR}/${name}`).replace(/^export /gmu, '');

export function replaceOnce(source, before, after) {
  if (source.split(before).length !== 2) throw new Error(`Supplied workbench patch anchor drift: ${before.slice(0, 90)}`);
  return source.replace(before, () => after);
}
function replaceSpan(source, start, end, replacement) {
  if (source.split(start).length !== 2 || source.split(end).length !== 2) throw new Error(`Supplied workbench function boundary drift: ${start}`);
  const first = source.indexOf(start), last = source.indexOf(end, first);
  if (last <= first) throw new Error(`Invalid patch boundary order: ${start}`);
  return source.slice(0, first) + replacement + source.slice(last);
}

const MANIFEST = `name = "Armstrong–Madison Cipher · Source Review"
source_code_url = "https://github.com/shdwelf/Html5/tree/arena/74f27a74-html5/apps/armstrong-madison"
description = "Original workbench plus primary-source research, honest uncertainty and a reproducible AFIO key audit. Offline; guesses saved or shared only on request."
`;
const BRIDGE = '// A Webxdc host supplies its API here. In a browser, do not simulate chat success or create a fake host.\n';
const BANNER_CSS = `#source-review-banner{font:12px/1.65 system-ui,sans-serif;color:#e4d8bc;background:#182019;border-bottom:1px solid #526049;padding:14px max(12px,calc((100% - 1240px)/2));overflow-wrap:anywhere}#source-review-banner strong{color:#dce8ce}#source-review-banner p{margin:5px 0}#source-review-banner details{margin-top:9px}#source-review-banner summary{cursor:pointer;font-weight:600;min-height:30px}#source-review-banner .workspace-actions{display:flex;flex-wrap:wrap;gap:6px;margin:9px 0}#source-review-banner button{font:11px/1.5 system-ui,sans-serif;border:1px solid #738163;border-radius:4px;padding:7px 10px;color:#e4d8bc;background:#253024;min-height:38px}#source-review-banner button:disabled{opacity:.45;cursor:not-allowed}#source-review-banner input[type=file]{max-width:100%;font:11px system-ui,sans-serif;display:block;margin:6px 0}#source-review-banner input[type=checkbox]{margin-right:6px;accent-color:#bccb9e}#source-review-banner label{display:block;margin:7px 0}#source-review-banner button:focus-visible,#source-review-banner summary:focus-visible,#source-review-banner input:focus-visible{outline:2px solid #e1c47b;outline-offset:3px}#workspace-status{font-size:11px;color:#c6d2ba}#verified-research-frame{background:#f3efe5;min-height:700px}@media(max-width:650px){#source-review-banner{font-size:11px;padding:10px 12px}#verified-research-frame{min-height:630px}}`;
const BANNER = `<aside id="source-review-banner" aria-label="Source review and working-key controls">
<p><strong>Source-checked review added.</strong> The original 18 sections are preserved, not certified as plaintext. “Verified research” separates primary texts, claims and hypotheses. Legacy statistics include a damaged numeric prefix and use a different 203/1203 reading; the new reader discloses both.</p>
<details id="workspace-controls"><summary>Working guesses · explicit local save / import / chat sharing</summary>
<p>Guesses are hypotheses. Nothing is automatically remembered, restored, broadcast or applied from chat. Browser storage is unencrypted; a cloud Files destination may upload an export.</p>
<div class="workspace-actions"><button id="workspace-save" data-workspace-button>Save guesses on this device</button><button id="workspace-load" data-workspace-button>Load saved guesses</button><button id="workspace-forget" data-workspace-button>Forget saved guesses</button><button id="workspace-export" data-workspace-button>Export guesses JSON</button></div>
<label for="workspace-import">Import a working-key JSON file (read only after selection)<input id="workspace-import" type="file" accept="application/json,.json"></label>
<label><input id="workspace-share-consent" type="checkbox">I want to share or load hypothetical labels in this Webxdc chat.</label>
<div class="workspace-actions"><button id="workspace-share" data-workspace-button disabled>Share current guesses</button><button id="workspace-receive" data-workspace-button disabled>Load shared guesses</button></div>
<p id="workspace-status" role="status" aria-live="polite"></p>
</details></aside>`;

function patchedWorkbench(original, workspaceScript) {
  const scripts = [...original.matchAll(/<script type="module" crossorigin>([\s\S]*?)<\/script>/gu)];
  if (scripts.length !== 1) throw new Error('Expected one inline module in the pinned workbench.');
  let script = scripts[0][1];
  const patches = [];
  function one(id, before, after) { script = replaceOnce(script, before, after); patches.push(id); }
  function span(id, start, end, after) { script = replaceSpan(script, start, end, after); patches.push(id); }
  one('review-tab', 'const om=[{id:"letter"', 'const om=[{id:"verified",label:"Verified research"},{id:"letter"');
  one('review-default', 'function Kx(){const[r,h]=X.useState("letter")', 'function Kx(){const[r,h]=X.useState("verified")');
  one('review-sandbox', 'children:[r==="letter"&&', 'children:[r==="verified"&&l.jsx("iframe",{id:"verified-research-frame",title:"Source-checked Armstrong–Madison research",srcDoc:window.ArmstrongReviewHTML,sandbox:"allow-scripts allow-downloads allow-popups allow-popups-to-escape-sandbox",style:{width:"100%",height:"80vh",border:"1px solid #526049",borderRadius:"6px"}}),r==="letter"&&');
  span('working-key-recursion-and-automatic-sharing', 'const Om="madison1808.key";', 'class tt extends', 'function Hx(){const[r,h]=X.useState(()=>window.ArmstrongWorkspace.read());return X.useEffect(()=>window.ArmstrongWorkspace.subscribe(h),[]),[r,window.ArmstrongWorkspace.update]}');
  span('portable-export-no-fetch', 'function Bm(r,h){', 'const Gx=', 'async function Bm(r,h){return await window.ArmstrongWorkspace.saveBlob(r,h)}async function Rm(r=false){return window.ArmstrongWorkspace.portableHTML(r)}async function Fx(){return await Bm(new Blob([await Rm()],{type:"text/html;charset=utf-8"}),"armstrong-cipher-lab.self.html")}');
  span('portable-xdc-includes-review-and-notices', 'async function Xx(){', 'function Qx(){', 'async function Xx(){const r=Yx(window.ArmstrongWorkspace.exportMembers());return await Bm(new Blob([r.buffer.slice(0)],{type:"application/zip"}),"armstrong-madison-cipher.xdc")}');
  one('export-errors-visible', 'try{o==="html"?await Fx():await Xx()}finally{h(null)}', 'try{o==="html"?await Fx():await Xx()}catch(error){document.getElementById("workspace-status").textContent="Export failed: "+error.message}finally{h(null)}');
  span('bridge-load-once', 'function Zx(){', 'Zx().then(', 'function Zx(){return Promise.resolve()}');
  one('damaged-prefix-marked', '"1 1471 1480 22 561 17 1708 11 380 460 17"', '"1 1471 1480 22 561 17 1708 11 380 460 17?"');
  one('working-key-consent-description', 'title:"Working key",subtitle:Ac()?`synced across the chat${Es()?` as “${Es()}”`:""} · also saved in this browser`:"your private reconstruction, kept in this browser"', 'title:"Working key",subtitle:"Hypotheses in memory only; use the explicit save/share controls above"');
  one('working-key-coverage-not-correctness', '"% of groups resolved"', '"% of legacy readings labeled (not verified)"');
  one('working-key-not-decryption', 'title:"Live decryption",subtitle:"numerical groups only; shorthand passages are shown as gaps"', 'title:"Live hypothesis rendering",subtitle:"unverified labels; graphical passages remain gaps"');
  one('legacy-baseline-disclosure', 'Every statistic on this page is recomputed in the browser from that transcription — nothing is hard-coded.', 'Legacy tools use the imported transcription and some fixed comparison baselines. See Verified research for reproducible, edition-specific counts and explicit uncertainties.');
  one('maintained-build-command', 'children:"npm run build"', 'children:"npm run build:armstrong-madison"');
  one('maintained-check-command', 'children:"node scripts/make-xdc.mjs"', 'children:"npm run check:armstrong-madison"');
  one('legacy-count-label', 'label:"code groups",value:j.total', 'label:"legacy readings",value:j.total');
  one('legacy-graphic-label', 'label:"shorthand",value:j.shortRuns+j.shorthandLines', 'label:"legacy graphic markers",value:j.shortRuns+j.shorthandLines');
  one('no-shorthand-certainty', 'passage in graphical symbols (shorthand)', 'graphical passage; system not identified by this review');
  one('no-only-unsolved-letter-assertion', 'An encrypted dispatch from John Armstrong Jr. in Paris to Secretary of State James Madison — the only letter in the Madison papers that two centuries of scholarship has failed to read.', 'An encrypted dispatch from John Armstrong Jr. in Paris to Secretary of State James Madison. No complete, independently verified decipherment is established by this review.');
  one('portable-export-description', 'Self-contained build: no CDN, no runtime package fetch. The WebXDC download is packed in-browser as a root-level index.html + manifest.toml + icon.png archive.', 'Portable HTML and XDC exports include the source review and exclude working guesses. Runtime XDC exports omit the optional icon and separate evidence files; the repository-built XDC retains the artwork and full evidence.');
  one('sharing-description', 'ZIP that opens in Delta Chat and shares the working key between chat members.', 'ZIP that opens offline; working guesses are shared only after explicit consent.');
  let html = original.replace(scripts[0][0], () => `<script src="./webxdc.js"></script>\n<script>${workspaceScript}</script>\n<script type="module">${script}</script>`);
  const csp = "default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data:; frame-src 'self'; connect-src 'none'; worker-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'";
  html = replaceOnce(html, '<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n<meta name="referrer" content="no-referrer">\n<meta http-equiv="Content-Security-Policy" content="${csp}">\n<meta name="description" content="Original Armstrong–Madison workbench plus offline primary-source dossier and reproducible AFIO key audit. Unresolved cipher; explicit saves and chat sharing only.">\n<style>${BANNER_CSS}</style>`);
  html = replaceOnce(html, '<div id="root"></div>', `${BANNER}\n<div id="root"></div>`);
  return { html, patches };
}

export function createArmstrongBuild() {
  const supplied = bytes(`${AUTHOR}/input/armstrong-madison-cipher.xdc`);
  if (sha256(supplied) !== INPUT_SHA256) throw new Error('Supplied XDC identity changed; review the input before modifying patch gates.');
  const input = unzipSync(supplied);
  const attachment = JSON.parse(text(`${EVIDENCE}/attachment.json`));
  const actualNames = Object.keys(input).sort();
  const expectedNames = attachment.entries.map((item) => item.path).sort();
  if (JSON.stringify(actualNames) !== JSON.stringify(expectedNames) || actualNames.length !== 3) throw new Error('Supplied XDC entry inventory changed.');
  for (const entry of attachment.entries) {
    if (input[entry.path].length !== entry.bytes || sha256(input[entry.path]) !== entry.sha256) throw new Error(`Supplied XDC member changed: ${entry.path}`);
  }
  const transcript = text(`${EVIDENCE}/founders-feb20.txt`);
  const afioKey = JSON.parse(text(`${EVIDENCE}/afio-key.json`)).key;
  const claim = text(`${EVIDENCE}/afio-claimed-plaintext.txt`).trim();
  const comparison = text(`${EVIDENCE}/github-comparison.txt`);
  const auditText = JSON.stringify(makeReceipt(transcript, afioKey, claim, comparison), null, 2) + '\n';
  const evidence = new Map(EVIDENCE_FILES.map((name) => [`evidence/${name}`, name === 'audit.json' ? Buffer.from(auditText) : bytes(`${EVIDENCE}/${name}`)]));
  const integrity = [...evidence].map(([path, content]) => ({ path, bytes: content.length, sha256: sha256(content) }));
  const notices = text(`${AUTHOR}/THIRD_PARTY_NOTICES.txt`);
  const model = { dossier: JSON.parse(text(`${EVIDENCE}/dossier.json`)), transcript, afioKey, claim, comparison, integrity, notices, gutenbergExcerpt: text(`${EVIDENCE}/gutenberg-jefferson-may2.txt`) };
  const analysis = ownModule('analysis.mjs');
  const reviewScript = `(() => {\n'use strict';\n${analysis}\n${ownModule('research.mjs')}\nmountResearch(${serial(model)}, { parseEdition, validateKey, parseKey, audit, subsequenceAudit, makeReceipt });\n})();`;
  const reviewStyle = text(`${AUTHOR}/research.css`);
  const reviewCsp = `default-src 'none'; script-src 'sha256-${shaBase64(reviewScript)}'; style-src 'sha256-${shaBase64(reviewStyle)}'; img-src data:; connect-src 'none'; frame-src 'none'; worker-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'`;
  let review = text(`${AUTHOR}/research.template.html`);
  for (const [before, after] of [['__CSP__', reviewCsp], ['__STYLE__', reviewStyle], ['__SCRIPT__', reviewScript]]) review = replaceOnce(review, before, after);
  const report = text('docs/armstrong-madison-cipher-review-2026-11-17.md').replace(/\]\(research\/armstrong-madison-1808\/([\w.-]+)\)/gu, '](evidence/$1)');
  const configuration = { reviewHTML: review, notices, manifest: MANIFEST, report, bridge: BRIDGE };
  const workspaceScript = `(() => {\n'use strict';\n${analysis}\n${ownModule('workspace.mjs')}\ninstallWorkspace({ ...${serial(configuration)}, validateKey, parseKey });\n})();`;
  const { html, patches } = patchedWorkbench(Buffer.from(input['index.html']).toString('utf8'), workspaceScript);
  const files = new Map([
    ['index.html', Buffer.from(html)], ['research.html', Buffer.from(review)], ['icon.png', Buffer.from(input['icon.png'])],
    ['manifest.toml', Buffer.from(MANIFEST)], ['webxdc.js', Buffer.from(BRIDGE)], ['SOURCE-CHECK.md', Buffer.from(report)],
    ['THIRD_PARTY_NOTICES.txt', Buffer.from(notices)], ...evidence,
  ]);
  const zipEntries = Object.fromEntries([...files].sort(([left], [right]) => left.localeCompare(right, 'en')).map(([name, content]) => [name, [new Uint8Array(content), { mtime: STAMP }]]));
  const archive = Buffer.from(zipSync(zipEntries, { level: 9 }));
  const sourceNames = ['scripts/build-armstrong-madison.mjs', `${AUTHOR}/analysis.mjs`, `${AUTHOR}/research.mjs`, `${AUTHOR}/workspace.mjs`, `${AUTHOR}/research.template.html`, `${AUTHOR}/research.css`, `${AUTHOR}/THIRD_PARTY_NOTICES.txt`];
  const receipt = {
    schemaVersion: 1,
    input: { path: `${AUTHOR}/input/armstrong-madison-cipher.xdc`, bytes: supplied.length, sha256: INPUT_SHA256 },
    archive: { path: 'armstrong-madison-cipher.xdc', bytes: archive.length, sha256: sha256(archive), entries: files.size, zipTimestamp: ZIP_TIMESTAMP, zipTimestampNote: 'Fixed DOS ZIP wall clock without timezone; not an acquisition or test timestamp' },
    patches,
    authoredSources: sourceNames.map((path) => ({ path, bytes: bytes(path).length, sha256: sha256(bytes(path)) })),
    publicFiles: [...files].map(([path, content]) => ({ path, bytes: content.length, sha256: sha256(content) })),
    limitations: ['No independent full decryption', 'No primary image bytes or full graphical collation', 'No physical Delta Chat/phone execution', 'Supplied complete workbench/artwork license not provided; no general redistribution clearance claimed'],
  };
  return { files, archive, auditText, receipt };
}

export function buildArmstrongMadison({ check = false } = {}) {
  const result = createArmstrongBuild();
  const target = join(ROOT, 'public/apps/armstrong-madison');
  const outputs = new Map([
    ...[...result.files].map(([path, content]) => [join(target, path), content]),
    [join(ROOT, 'armstrong-madison-cipher.xdc'), result.archive],
    [join(ROOT, EVIDENCE, 'audit.json'), Buffer.from(result.auditText)],
    [join(ROOT, EVIDENCE, 'build-receipt.json'), Buffer.from(JSON.stringify(result.receipt, null, 2) + '\n')],
  ]);
  if (existsSync(target)) {
    const walk = (directory) => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(join(directory, entry.name)) : [join(directory, entry.name)]);
    for (const path of walk(target)) if (!outputs.has(path)) throw new Error(`Unreviewed extra file in Armstrong public build: ${relative(target, path)}`);
  }
  for (const [path, content] of outputs) {
    if (check) {
      if (!existsSync(path) || !readFileSync(path).equals(content)) throw new Error(`Stale Armstrong–Madison asset: ${relative(ROOT, path)}. Run npm run build:armstrong-madison.`);
    } else { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, content); }
  }
  return result.receipt;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check');
  const result = buildArmstrongMadison({ check });
  console.log(`Armstrong–Madison: ${result.archive.entries} bundled files ${check ? 'verified' : 'built'}; ${result.archive.bytes} bytes; SHA-256 ${result.archive.sha256}`);
}
