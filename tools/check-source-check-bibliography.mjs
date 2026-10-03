#!/usr/bin/env node
/**
 * Keep docs/source-check-bibliography.md an auditable index rather than a
 * manually maintained selection of references. The source-check notes are
 * deliberately an explicit corpus: other research documents can have their
 * own bibliographies without changing this one by accident.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const BIBLIOGRAPHY = 'docs/source-check-bibliography.md';
const SOURCE_CHECKS = [
  'docs/source-check-2026-09-28.md',
  'docs/source-check-2026-09-29.md',
  'docs/source-check-2026-09-29-vincennes.md',
  'docs/los-alamos-source-check-2026-09-30.md',
  'docs/for-dummies-source-check.md',
  'docs/spectre-press-source-check.md',
  'research/jim-sanborn-source-check.md',
  'public/apps/sanborn-restaurant-4dwm/research-source-check.md',
];
const EXPECTED_UNIQUE_LITERAL_URLS = 60;

// Deliberately conservative: a bibliography is expected to contain ordinary
// HTTP(S) locators only. Trailing prose punctuation is not part of a locator.
const URL_PATTERN = /https?:\/\/[^\s)>\]}|]+/g;
const normaliseUrl = (url) => url.replace(/[.,;:]+$/, '');
const urlsIn = (text) => new Set((text.match(URL_PATTERN) ?? []).map(normaliseUrl));

const fail = (message) => {
  console.error(`source-check bibliography: ${message}`);
  process.exitCode = 1;
};

if (!existsSync(resolve(ROOT, BIBLIOGRAPHY))) {
  fail(`missing ${BIBLIOGRAPHY}`);
  process.exit();
}

const bibliography = readFileSync(resolve(ROOT, BIBLIOGRAPHY), 'utf8');
const bibliographyUrls = urlsIn(bibliography);
const sourceUrls = new Set();

for (const sourceCheck of SOURCE_CHECKS) {
  const absolutePath = resolve(ROOT, sourceCheck);
  if (!existsSync(absolutePath)) {
    fail(`declared corpus member is missing: ${sourceCheck}`);
    continue;
  }
  if (!bibliography.includes(sourceCheck)) {
    fail(`scope list does not name ${sourceCheck}`);
  }
  for (const url of urlsIn(readFileSync(absolutePath, 'utf8'))) sourceUrls.add(url);
}

if (sourceUrls.size !== EXPECTED_UNIQUE_LITERAL_URLS) {
  fail(
    `source corpus has ${sourceUrls.size} unique literal URL(s); expected ${EXPECTED_UNIQUE_LITERAL_URLS}. ` +
      'Update the bibliography and this intentional corpus-count lock together.',
  );
}

const missing = [...sourceUrls].filter((url) => !bibliographyUrls.has(url)).sort();
if (missing.length) {
  fail(`missing ${missing.length} literal source URL(s):\n${missing.map((url) => `  - ${url}`).join('\n')}`);
}

if (!process.exitCode) {
  console.log(
    `source-check bibliography: ${SOURCE_CHECKS.length} notes, ${sourceUrls.size} unique literal URL(s), all indexed.`,
  );
}
