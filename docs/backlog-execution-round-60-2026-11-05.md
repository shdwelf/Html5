# Backlog execution round 60 — 2026-11-05

## Zangi static disassembly follow-up

The user confirmed Zangi as the intended disassembly target. A bounded static
review of three DEX files and selected arm64 native symbols/strings found
Signal Protocol wrapper calls and a separate AES-GCM group-push helper. The
review did not identify a cellular-automata implementation, CA rule, or
independent known-answer vector. Decompiled Java-like output was treated as
navigation only; the group-push call site was checked against raw DEX
references. No APK code was executed and no embedded key value or package copy
was published. See
[`zangi-dex-static-inspection-2026-11-05.md`](zangi-dex-static-inspection-2026-11-05.md).

The absence of CA terms in the reviewed DEX/native search is limited static
evidence, not proof of absence. No decryption or CA recipe was claimed.

## Algorithm-engineering guidance

Recorded a practical specification → independent known-answer vector →
negative/regression tests → duplicate-check → bounded performance-evaluation
workflow, informed by the public Springer entries in the *Encyclopedia of
Algorithms*, second edition. See
[`algorithm-engineering-guidance-2026-11-05.md`](algorithm-engineering-guidance-2026-11-05.md)
for sources and the crypto-specific checklist.

## PGPonyCore and CyberChef/Cookbook audit

Reviewed public PGPonyCore 8.4.0 source at commit `86d23e0`. It is an iOS-only
Swift package with an internal API surface, not a drop-in browser or Android
dependency. Its OpenPGP symmetric writer and broader v4/v5/v6 decrypt paths
were compared with the existing CyberChef operation. CyberChef already has
OpenPGP armor and classic symmetric-decrypt operations and recipe packs; no
duplicate operation or recipe pack was added. A Cookbook Reference card now
records the classic coverage and the unported PGPonyCore gap. `PGPonyPair` is a
separate application-specific pairing protocol, not an OpenPGP cipher recipe.
See
[`pgponycore-cyberchef-source-review-2026-11-05.md`](pgponycore-cyberchef-source-review-2026-11-05.md).

No PGPonyCore browser implementation or standalone app was started. The
Android-consolidation request and the follow-up HTML5 alternative still need a
scope decision: which target should be built and what exact functions should it
expose? The repository inventory found 89 top-level `public/apps` directories
and one Android Gradle project in the searched paths; that does not identify
which apps are intended for consolidation.

## Privacy audit and verification

- Before rebuilding Wiki in a Jar, scanned 329 Markdown/HTML/Java-Wiki inputs
  for direct Google item links and suspicious identifier-shaped values in
  Google/Drive context: zero matches.
- `node tools/wikiinajar/sync-docs.mjs` refreshed the newest nine Java Wiki
  notes; older round-58/59 pages fell outside that nine-note slice.
- `npm run build:wikiinajar` passed: 316 Markdown documents became 316 pages in
  a 12-entry bundle. The exact bundle hash is recorded in the final build output,
  not in this bundled document (to avoid a self-referential hash).
- Page-aware post-build scan covered the app HTML, 12 Java Wiki pages, 316
  staged pages, and 316 pages inside the `.xdc`: zero unsafe matches.
- Targeted OpenPGP/Cookbook/Wiki tests: 39 passed.
- Full `npm test`: 307 Vitest tests passed; 959 Node tests, 948 passed,
  11 skipped, zero failed.
- `npm ci` was needed because `jsdom` was absent. It installed 227 packages and
  reported 7 dependency advisories (1 low, 1 moderate, 3 high, 2 critical); no
  dependency changes or fixes were applied.

## Pull request

PR #182 is the GitHub review vehicle for this follow-up. Its current state is
tracked on GitHub; the test and privacy results above describe the code and
artifacts in this round.
