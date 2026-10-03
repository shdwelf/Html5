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
  'docs/convention-venues.md',
  'docs/cyberchef-matrix-deep-dive.md',
  'docs/dss-casefiles-riddle-warrick.md',
  'docs/lecture-hall-research-2026-09-20.md',
  'docs/lecture-hall-research-2026-09-27.md',
  'docs/los-alamos-domain-deep-dive-2026-09-30.md',
];
const EXPECTED_UNIQUE_LITERAL_URLS = 118;

// A Markdown destination can legitimately contain balanced parentheses (for
// example, Wikipedia's `Black_Hat_(conference)`), while the closing parenthesis
// of the Markdown link is not part of the URL. Keep balanced URL parentheses,
// discard an unmatched final delimiter, and stop before Markdown's `]` wrapper.
const URL_PATTERN = /https?:\/\/[^\s<>"'\]]+/g;
const normaliseUrl = (url) => {
  let normalised = url.replace(/[.,;:`]+$/, '');
  while (normalised.endsWith(')') && (normalised.match(/\)/g) ?? []).length > (normalised.match(/\(/g) ?? []).length) {
    normalised = normalised.slice(0, -1);
  }
  return normalised;
};
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
