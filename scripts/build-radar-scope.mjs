#!/usr/bin/env node
// The extensionless imported app is canonical and is staged by Android's
// opt-in network profile. Keep the old .html browser URL source-exact too.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const source = new URL('../apps/ads-b-radar-scope', import.meta.url);
const target = new URL('../apps/radar_scope.html', import.meta.url);
const expected = readFileSync(source);
if (process.argv.includes('--check')) {
  if (!readFileSync(target).equals(expected)) throw new Error('Radar browser alias is stale: node scripts/build-radar-scope.mjs');
  console.log('Radar browser alias matches canonical network app.');
} else {
  writeFileSync(target, expected);
  console.log(`Synced ${fileURLToPath(target)} (${expected.length} bytes).`);
}
