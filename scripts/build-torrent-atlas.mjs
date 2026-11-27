#!/usr/bin/env node
/** Ship the exact audited static files, with no CDN, network client or extra permissions. */
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const TORRENT_ATLAS_FILES = Object.freeze(['app.mjs', 'data.mjs', 'icon.svg', 'index.html', 'styles.css', 'torrent.mjs', 'worker-client.mjs', 'worker.mjs']);
export function buildTorrentAtlas({ check = false } = {}) {
  const source = join(root, 'apps/torrent-atlas'), target = join(root, 'public/apps/torrent-atlas');
  if (!check) mkdirSync(target, { recursive: true });
  for (const name of TORRENT_ATLAS_FILES) {
    const input = join(source, name), output = join(target, name);
    if (check) { if (!existsSync(output) || !readFileSync(input).equals(readFileSync(output))) throw new Error(`Stale Torrent Atlas asset: ${name}. Run npm run build:torrent-atlas.`); }
    else copyFileSync(input, output);
  }
  if (readdirSync(target).some((name) => !TORRENT_ATLAS_FILES.includes(name))) throw new Error('Unreviewed extra files in the Torrent Atlas public build.');
  return TORRENT_ATLAS_FILES.length;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(`Torrent Atlas: ${buildTorrentAtlas({ check: process.argv.includes('--check') })} static assets ${process.argv.includes('--check') ? 'verified' : 'built'}.`);
