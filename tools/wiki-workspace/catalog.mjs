import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { lstatSync, readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';

export const sha256 = value => createHash('sha256').update(value).digest('hex');
export const SOURCE_DATE = '2026-10-15T00:00:00.000Z';
export const MAX_PREVIEW_BYTES = 96 * 1024;

// Some old commits contain relay caches despite .gitignore. Never publish them.
// This is a publication boundary, not a secret scanner: review the report before sharing.
export function exclusionReason(name) {
  const segments = name.replaceAll('\\', '/').split('/');
  if (segments.some(p => /^\.(git|cache|relay[^/]*|arena[^/]*|xfer|ssh|aws|gnupg|wiki-data)$/.test(p))) return 'private metadata or cache';
  if (segments.some(p => ['node_modules', 'dist', 'build', 'coverage', '__pycache__', '.venv'].includes(p))) return 'regenerable output';
  if (segments.some(p => /^(\.env(?:\..*)?|\.netrc|\.npmrc|\.git-credentials|id_rsa|id_ed25519)$/i.test(p))) return 'credential filename';
  if (/\.(haikuvault|pem|key|p12|pfx)$/i.test(name)) return 'private vault or key material';
  if (/^(google_drive|extracted_sg7|sync-outgoing)\//.test(name)) return 'private import/export area';
  return null;
}

export function mimeFor(name) {
  return ({'.md':'text/markdown', '.wiki':'text/plain', '.txt':'text/plain', '.java':'text/plain',
    '.js':'text/javascript', '.mjs':'text/javascript', '.ts':'text/plain', '.tsx':'text/plain',
    '.html':'text/html', '.css':'text/css', '.json':'application/json', '.xml':'application/xml',
    '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.gif':'image/gif',
    '.webp':'image/webp', '.bmp':'image/bmp', '.avif':'image/avif', '.djvu':'image/vnd.djvu',
    '.djv':'image/vnd.djvu', '.wasm':'application/wasm', '.xdc':'application/octet-stream', '.jar':'application/java-archive'}[path.extname(name).toLowerCase()]) || 'application/octet-stream';
}

export function decodeText(bytes) {
  if (bytes.includes(0)) return null;
  try { return new TextDecoder('utf-8', {fatal:true}).decode(bytes); } catch { return null; }
}

export function references(text, source) {
  const remote = new Set(), local = new Set();
  // Only explicit links, imports and source attributes: no fuzzy topic matches presented as facts.
  const patterns = [/!?\[[^\]\n]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g,
    /\b(?:href|src)\s*=\s*["']([^"']+)["']/gi,
    /(?:\bfrom\s*|\bimport\s*\(?\s*)["']([^"']+)["']/g];
  for (const pattern of patterns) for (const match of text.matchAll(pattern)) {
    const target = match[1];
    if (/^https?:\/\//i.test(target)) {
      try { const u = new URL(target); if (!u.username && !u.password) remote.add(u.href); } catch { /* not a URL */ }
    } else if (!/^(?:[a-z]+:|#|\/)/i.test(target)) {
      try {
        const relative = path.posix.normalize(path.posix.join(path.posix.dirname(source), decodeURIComponent(target.split(/[?#]/)[0])));
        if (relative !== '..' && !relative.startsWith('../')) local.add(relative);
      } catch { /* malformed escaping */ }
    }
  }
  for (const match of text.matchAll(/https?:\/\/[^\s<>"'`\]})]+/g)) {
    try { const u = new URL(match[0].replace(/[.,;]+$/, '')); if (!u.username && !u.password) remote.add(u.href); } catch { /* not a URL */ }
  }
  return {remote:[...remote].sort(), local:[...local].sort()};
}

function git(root, args) { return execFileSync('git', ['-C', root, ...args], {encoding:'utf8', maxBuffer:32*1024*1024}).trim(); }
export function trackedFiles(root) {
  return [...new Set(execFileSync('git', ['-C', root, 'ls-files', '--cached', '--others', '--exclude-standard', '-z'],
    {encoding:'utf8', maxBuffer:32*1024*1024}).split('\0').filter(Boolean))].sort();
}

/** One page and an exact-byte, content-addressed blob for each eligible regular file. */
export function collectRepository({id, root, files}, {maxPreviewBytes = MAX_PREVIEW_BYTES} = {}) {
  if (!/^[a-zA-Z0-9_-]{1,60}$/.test(id)) throw new Error('Repository id must contain 1–60 letters, digits, _ or -');
  root = realpathSync(root);
  let commit = null;
  try { commit = git(root, ['rev-parse', 'HEAD']); } catch { if (!files) throw new Error(`Not a Git checkout: ${root}`); }
  const pages = [], excluded = [], blobs = new Map();
  for (const name of files || trackedFiles(root)) {
    if (!name || name.includes('\\') || name.startsWith('/') || name.split('/').some(p => p === '..' || p === '.')) {
      excluded.push({repo:id,path:name,reason:'unsafe path'}); continue;
    }
    const why = exclusionReason(name);
    if (why) { excluded.push({repo:id,path:name,reason:why}); continue; }
    const absolute = path.join(root, name);
    let stat;
    try { stat = lstatSync(absolute); } catch (e) { if (e.code === 'ENOENT') { excluded.push({repo:id,path:name,reason:'deleted from worktree'}); continue; } throw e; }
    if (!stat.isFile() || stat.isSymbolicLink() || !realpathSync(absolute).startsWith(root + path.sep)) {
      excluded.push({repo:id,path:name,reason:'symlink or non-regular file'}); continue;
    }
    const bytes = readFileSync(absolute), hash = sha256(bytes);
    const text = decodeText(bytes);
    // Decode on character boundaries, not Buffer.toString over a truncated UTF-8 sequence.
    let body = text === null ? `Binary file: ${name}\n${bytes.length} bytes\nSHA-256: ${hash}\nDownload the exact bytes from the repository vault.` : text;
    let truncated = false;
    if (Buffer.byteLength(body) > maxPreviewBytes) {
      body = new TextDecoder().decode(Buffer.from(body).subarray(0,maxPreviewBytes));
      body = body.replace(/\uFFFD$/, '') + '\n\n[Preview truncated. The complete, exact file is in the JAR vault.]';
      truncated = true;
    }
    const refs = text === null ? {local:[],remote:[]} : references(text, name);
    pages.push({id:sha256(id+'\0'+name), title:`Repo/${id}/${name.split('/').map(encodeURIComponent).join('/')}`,
      repo:id, path:name, sha256:hash, size:bytes.length, mime:mimeFor(name), text:text!==null, truncated,
      previewSha256:sha256(body), body, links:[], backlinks:[], references:refs.remote, localTargets:refs.local});
    if (!blobs.has(hash)) blobs.set(hash, {absolute, size:bytes.length, mime:mimeFor(name)});
  }
  return {repository:{id,commit,scope:'tracked files plus non-ignored workspace additions; exclusions reported'},pages,excluded,blobs};
}

export function buildCatalog(repos, options) {
  const parts = repos.map(repo => collectRepository(repo, options));
  const pages = parts.flatMap(p => p.pages).sort((a,b) => a.title < b.title ? -1 : a.title > b.title ? 1 : 0);
  const keys = new Map(pages.map(p => [p.repo+'\0'+p.path,p]));
  const bibliography = new Map();
  for (const page of pages) {
    page.unresolved = [];
    for (const target of page.localTargets) {
      const other = keys.get(page.repo+'\0'+target) || keys.get(page.repo+'\0'+target.replace(/\/$/, '')+'/index.html');
      if (other) { page.links.push(other.id); other.backlinks.push(page.id); }
      else page.unresolved.push(target);
    }
    delete page.localTargets;
    for (const url of page.references) {
      if (!bibliography.has(url)) bibliography.set(url, []);
      bibliography.get(url).push(page.id);
    }
  }
  const excluded = parts.flatMap(p => p.excluded);
  const snapshot = sha256(pages.map(p => `${p.repo}\0${p.path}\0${p.sha256}\n`).join(''));
  const catalog = {format:'repository-wiki',version:1,sourceDate:SOURCE_DATE,snapshot,
    repositories:parts.map(p => p.repository),
    pages:pages.map(({body,...p}) => p), excluded,
    bibliography:[...bibliography].sort(([a],[b]) => a < b ? -1 : a > b ? 1 : 0).map(([url,pages]) => ({url,pages,status:'extracted reference; not automatically verified'})),
    totals:{pages:pages.length,bytes:pages.reduce((n,p) => n+p.size,0),excluded:excluded.length,
      unresolved:pages.reduce((n,p) => n+p.unresolved.length,0)}};
  return {catalog,pages,blobs:new Map(parts.flatMap(p => [...p.blobs]))};
}
