# Public-repository privacy audit — Drive references and Wiki bundle (2026-11-04)

## Scope and result

This current-tree audit covered Markdown inputs to Wiki in a Jar, its inline HTML source, and the Java-edition Wiki tiddlers. It focused on user-owned Google Drive links and identifiers, private backup inventories, and identifiable source-derived passages. The source scan found no remaining direct item links or identifier-shaped values in Google/Drive context; the regenerated Wiki bundle was scanned again after the build.

This is not a Git-history scrub. Earlier public commits may still contain material removed from the current tree; see the limitation below.

## Changes made

- Replaced historical Drive synchronization and backup reports with metadata-free public summaries. Removed private item/folder identifiers, direct links, per-file inventories, exact sizes and checksums, restoration instructions, and source-derived passages.
- Replaced user-specific Drive inventory and backup JSON with metadata-free summaries, and removed a source-derived archive listing from the Git index. Local copies remain outside the staged public tree and are ignored.
- Sanitized Wiki source content: replaced the manual “Sample Files and Vault” page, updated the TiddlyWiki workspace seed, and synchronized the Java Wiki pages so stale backup/link pages are no longer shipped.
- Removed private source-document identifiers and metadata from the Changelly report builder; its Markdown report remains a high-level public-safe status note.
- Replaced the user-specific Google Form destination with a non-navigating placeholder.
- Staged removal of user-specific Drive request, override, and fetch-log files and added ignore rules to prevent them from being re-added.
- Added a preflight refusal in the Wiki build for direct Google item links and identifier-shaped values in Drive/document context. It runs before generated outputs are cleared. Regression tests check the app, bundled documentation, and Java Wiki tiddlers.

No Drive connector call, remote request, token, real contact record, badge record, or user credential was used in this audit.

## Verification

- Scanned 315 Wiki source inputs (Markdown, `wikiinajar.html`, and Java-edition `.wiki` pages): no direct Google item links or identifier-shaped values in Google/Drive context.
- `npm run build:wikiinajar` passed and generated 302 documentation pages. The staged `docs.json`, app HTML, and `.xdc` were rescanned: no matching links or identifiers found.
- `node --test tests/wikiinajar.test.mjs` passed (21 tests).
- `npm run test:wiki-workspace` passed (23 Node tests and 2 Vitest tests).
- `node --test tests/changelly-drainer-xena.test.mjs` passed (13 tests).
- `git diff --check` passed.

## Important history limitation

This cleanup changes the current tree only. The GitHub repository is public, and this work does **not** rewrite prior Git history. Earlier commits may still contain now-redacted identifiers or links. Before merging or pushing a public cleanup, the repository owner should decide whether to coordinate a history purge and, where appropriate, revoke or replace exposed sharing links. No history rewrite, remote request, commit, or push was performed here.
