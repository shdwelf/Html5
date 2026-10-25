# Backlog execution round 50 — 2026-10-25

**Round:** 50 · **Stream/task:** S9 · wiki-editions refresh (repository wiki artifact family) · **PR:** session branch (`arena/fb732e58-html5`)

## Position check (parallel-session rule)

- Branch cut from main `cdcd73e` (PR #156 merged); rounds 46–49 already on main, 45 reserved by open PR #153 (S6 ARPANET). Next free round = **50**; no open PR touches S9/wiki editions.
- Scope note: this round answers the standing question "did you update `more.wiki.in.a.jar`, TiddlyWiki, and the Wikipedia/Kiwix versions?" — the inputs (`docs.json`, 268 pages) had been rebuilt with rounds 46–49, but the `dist/wiki/` edition family was **not regenerated** in this checkout. It is now, end to end, and the missing step (Kiwix ZIM) is wired into the documented build.

## What was rebuilt (all under `dist/wiki/`, build outputs — not tracked, per repo convention)

| Artifact | Result |
| --- | --- |
| `wiki.in.a.jar` | 295,694,371 B — classic browser wiki landing |
| **`more.wiki.in.a.jar`** | 295,694,379 B — repository library landing |
| **`tiddlywiki.in.a.jar`** | 295,694,374 B — native TiddlyWiki 5.4.1 landing |
| **`tiddlywiki.html` / `tiddlywiki.xdc`** | 58,315,664 B / 12,025,056 B — native single-file wiki + Webxdc |
| `mediawiki.xml` | 152,156,311 B — MediaWiki 0.11 export, **schema validation passed** (`validate-mediawiki.py`, lxml) |
| **`html5-repository.zim`** | 1,770,863 B — **Kiwix ZIM** (269 entries = 268 doc pages + front `index.html`), libzim self-`check()` = true, built from `docs.json` by `make-zim.py` |
| `repository.json`, `tiddlers.json`, `conversion-report.json`, `SHA256SUMS`, `WikiServer.javap.txt`, `wiki-reader-applet.jar` | regenerated with snapshot `d2cf7d9f…` (10,769 pages collected, 424.8 MB source bytes) |

Build environment recovered in-workspace (excluded from git): the split Temurin 21 archive in `.relay/jdk/` was assembled and **SHA-256-verified against `jdk21.sha256`** (`ce79869e…` → `jdk-21.0.12.1+1`), matching `javaTool()`'s auto-detect path; `python3 -m pip install --break-system-packages libzim lxml` provided the ZIM writer and optional validator. `node_modules` was re-synced with `npm ci --ignore-scripts` (tiddlywiki 5.4.1 arrived on main via #156 and was missing locally — first build died with `Cannot find module …/tiddlywiki.js`).

## Repo changes (the fix for "orphan step"）

- `package.json` — new `build:wiki-zim` script → `python3 tools/wiki-workspace/make-zim.py` (the generator itself landed on main with PR #156, commit `3f43a4e`, previously referenced nowhere — no package script, README line, or test).
- `tools/wiki-workspace/README.md` — new **Kiwix ZIM edition** section (libzim install, build order vs `build:wiki-workspace` which recreates `dist/wiki/`, verification one-liner) + `html5-repository.zim` row in the artifact table. The converter previously had **zero references** anywhere in the repo.

## Verification

- `npm run test:wiki-workspace` → node wiki tests + vitest `wiki-vault-interop` **green** (vault interop 2/2).
- `npm run test:wiki-server` → **1/1** with `WIKI_JAR_INTEGRATION=1` (fixture JAR built and served on the recovered JDK).
- `npm run test:wiki-backup` → OK (4 artifacts verified + restored).
- `npm run test:wiki-javacard` → **28/28 checks passed** (no physical cards).
- `python3 tools/wiki-workspace/validate-mediawiki.py dist/wiki/mediawiki.xml` → schema passed.
- ZIM: `entry_count=269`, `article_count=269`, `checksum=True`.
- Full repo suites: node **849 pass / 0 fail / 10 skipped** (859 total) and vitest **307/307** after the John repair.

## Main-red repair found during verification (JtR vector suites)

Full-suite runs exposed a pre-existing red on `origin/main` itself (independent of this branch): `tests/john-md5crypt-sha512crypt-vectors.test.mjs` (shipped with #156) imports `verifyMd5crypt`/`parseMd5crypt` and `verifySha512crypt`/`parseSha512crypt`, but `tools/md5crypt.mjs` and `tools/sha512crypt.mjs` exported only the hash functions — the file crashed at import (0/1). The four helpers were implemented to the test's published JtR-fixture expectations (parse: `$1$`/`$6$` sibling rejection, empty salt, 8-char md5 salt truncation, `rounds=` extraction; verify: recompute-and-compare).

The two suites encode **contradictory return contracts for the same functions** — the round-11 audit round-trips `md5crypt(pw, fullStored) === fullStored` while round 13 asserts `md5crypt(pw, rawSalt) === encodedHashOnly` (same for sha512). Both tests exist identically on main and on #156's branch, so the helpers were never committed there. Resolution: a documented **call-form contract** — full-crypt input returns the full string (round-trip/verification form), raw-salt input returns the encoded hash only — implemented by returning `encoded` when the salt argument does not start with `$1$`/`$6$`. No test was edited; both suites pass together (14/14: 7 vectors + 7 audit).

## Disclosures

- The ZIM/HTML/XDC editions carry previews and the documentation corpus, **not** the complete binary vault (the JARs hold exact bytes); this is stated in the README section just added.
- `make-zim.py` pages are `pre`-wrapped source Markdown — it is an offline reading edition, not a MediaWiki/Kiwix rendering engine.
- `dist/wiki/` stays untracked (0 files in git); artifacts are reproducible via the scripts above. No remote wiki or Kiwix store was modified; nothing was published.
- The historical "More Wiki in a Jar 0.9.9" binary remains unrecovered (unchanged claim from `wiki-workspace-research-2026-10-15.md`).

## Status effect

- S9: unchanged status (partial); wiki-editions refresh appended to `next_actions` as delivered work. Open S9 items (haiku OCR vault catalog, shufflecake/CyberChef recipes, boot-chain note, quine→SSE export, 0.9.9 recovery/CAP/physical-card limits) untouched.
