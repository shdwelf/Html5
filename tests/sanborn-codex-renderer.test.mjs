import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import test from 'node:test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const codexPages = [
  'public/apps/sanborn-codex/index.html',
  'apps/sanborn-codex (3).html',
];
const occurrences = (text, pattern) => [...text.matchAll(pattern)].length;

for (const relativePath of codexPages) {
  test(`${relativePath} matches the Sanborn renderer settings`, () => {
    const html = readFileSync(resolve(root, relativePath), 'utf8');

    // R3F defaults to ACES filmic tone mapping; flat=true selects Three.js's
    // NoToneMapping, matching the working vanilla Sanborn renderer. The
    // explicit soft shadow mode matches PCFSoftShadowMap there as well.
    assert.equal(occurrences(html, /shadows:"soft",flat:!0,/g), 2);
    assert.equal(occurrences(html, /shadows:!0,/g), 0);
    assert.match(html, /shadows:"soft",flat:!0,camera:\{position:\[0,8,20\]/);
    assert.match(html, /shadows:"soft",flat:!0,camera:\{position:\[0,6,12\]/);

    // Blueprint-mode cipher screens should retain a blue emissive accent,
    // not the normal-mode dark copper emissive color.
    assert.equal(
      occurrences(html, /l=n\?"#0c4a6e":i\?"#ffb366":t\?"#059669":"#2a1206"/g),
      1,
    );

    // Guard the page's catalog and subject matter while adjusting renderers.
    assert.match(html, /<title>Sanborn Codex · The Encrypted Art of Jim Sanborn<\/title>/);
    assert.match(html, /id:"kryptos",title:"Kryptos"/);
    assert.match(html, /"3D VRML Studio"/);
    assert.match(html, /"Installations Gallery"/);
  });
}
