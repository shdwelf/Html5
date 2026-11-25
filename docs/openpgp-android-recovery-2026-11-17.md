# Backlog continuation — Android WebView protected-key recovery acceptance

Research-series label: **2026-11-17**, not an upstream release date. Continued
on `arena/74f27a74-html5` from merged PR239/main
`b0e659076fdde4f296cf8b920f2b9b7466530111`. The original recovery workflow and
Android renderer repair are already merged; this is new validation work, not
a duplicate of PR239. This operational evidence is excluded from public
offline manual bundles. No original source or existing backup is deleted.

## Selected documented gap

The [recovery report](openpgp-wordlist-recovery-2026-11-17.md) distinguishes
actual Chromium workers from Android **asset packaging**. The remaining
mobile/runtime acceptance work is advanced with three real public-APK WebView
cases on the existing API-34 emulator. No cryptographic runtime, algorithm
profile, passphrase bound, production Activity, WebView policy, user data,
backup recipient, npm dependency or crypto engine is changed.

`RecoveryWebViewSmokeTest.java` uses the existing foreground/focus-gated
`WebViewTestInput` touchscreen helper for Preview, permission acknowledgement,
Start, reveal, Stop, recovery Clear and global Clear. Synthetic input fields
are populated by test JavaScript, not by claiming to emulate a user's keyboard.
There is no JavaScript-click substitute for the tested action controls, test
assertion bypass, retry, skip or extension of an existing deadline.

## Three mandatory real-WebView cases

1. **Exact v4/v6 recovery and full-fingerprint refusal.** Fresh protected v4
   legacy Ed25519/Curve25519 and standard-AEAD v6 Ed25519/X25519 certificates each
   contain two secret packets. Preview displays the full 40/64-hex fingerprint,
   two hidden candidates and zero attempts. A wrong full fingerprint creates
   no guessing worker. The case-mismatched first candidate must fail; only the
   exact second candidate can unlock and validate all two included packets.
   Inputs clear on Start, the result remains hidden until explicit reveal and
   then hides again. No certificate is imported and no storage is written.
2. **Pre-attempt refusal and bounded no-match.** PUBLIC, unprotected and invalid
   Argon2 metadata inputs cannot start candidate recovery. Any inspection worker
   is real and terminates; the PUBLIC armor may be rejected even before worker
   construction. The malformed Argon2 control performs no Argon2 derivation.
   A valid protected key with only the case-mismatched guess completes exactly
   one attempt, never reports success and retains the bounded-exhaustion warning.
3. **Actual in-flight cancellation.** A fresh iterated-S2K-224 synthetic key and
   256 wrong candidates keep a real worker busy. After at least one reported
   exact attempt and while the worker is live, page JavaScript remains
   responsive. Real Stop, recovery Clear and global Clear independently call
   the native worker's termination method. The worker is no longer live, Start
   and Stop are disabled, no candidate is revealed and a bounded observation
   period admits no late progress or match. Stop is not called an exhausted
   search. No storage/keyring import is permitted.

The fixture source is confined to `src/androidTest/assets/`; all key material
is generated freshly in browser memory. There is no committed armored private
key, synthetic home/passphrase file, download or owner input. The test-only
worker subclass delegates construction, `postMessage` and `terminate` directly
to the **native Worker**. It records public URL/type/operation/count/termination
metadata only, never message bodies, armor, candidate values, dependency errors
or worker results. No reply or crypto operation is mocked. No production test
hook or main-thread recovery fallback is added. CI checks exact fixture bytes
in both test APKs and rejects the fixture in all three normal APK profiles.

The identical fixture also runs against **actual Chromium workers**. Browser
`workercreated`/`workerdestroyed` events must match the observations, every worker
must be destroyed, observed requests stay local, no download occurs and no
uncaught page error is allowed. This checks the harness separately; it does not
substitute for the new actual Android instrumentation phase.

## Completion gate and evidence discipline

The original 14 mandatory Android cases remain unchanged:

| Phase | Required passing actual cases |
| --- | ---: |
| Public local file/save/import/public remembering/v6 export | 6 |
| Network local file/save/import/public remembering/v6 export | 6 |
| **New public protected-key recovery** | **3** |
| Microphone permission and actual capture-track startup | 1 |
| Packaged Headline Harry DOS boot | 1 |

CI now requires **17 passed / 0 failed / 0 skipped / all five exits zero**.
The recovery phase has its own three-minute outer bound; all original phase,
per-test, worker and overall 20-minute device-step bounds stay intact. Missing,
partial, malformed, duplicate, old-four-phase or skipped metadata must fail.
The existing supported software ANGLE renderer, 2-GiB guest, connected-test
Gradle resource bounds, bounded diagnostics and separate public/network APK
artifacts are preserved. Private APK plaintext and test APKs are not uploaded.

Fresh local controls before CI:

- Android policy/completion/save plus all three recovery unit/crypto/DOM suites
  and operational corpus exclusion: **67 passed / 0 failed / 0 skipped**.
- Identical test-APK fixture with real Chromium workers: **3 passed / 0 failed /
  0 skipped**, including both success profiles, refusal/no-match and all three
  cancellation actions, zero page errors/external requests/downloads.
- Separate public-corpus/package, sound, encrypted-upload, token/coin and coin
  DOM regression guards: **78 passed / 0 failed / 0 skipped**. Browser catalog
  (96), sound snapshots (2 apps / 3 snapshots / 9 files) and coin research
  inventory freshness checks passed without regenerating runtime assets.
- Full isolated Vitest: **318 passed / 36 files**, no timeout/production changes.
- Java **grammar parse only**, not compilation; workflow YAML 1.2/unique-key,
  all six embedded Python blocks, unchanged 20-minute device deadline,
  JavaScript/shell/Python syntax and whitespace checks passed. No local
  JDK/Android SDK/adb is available. Full native GnuPG/Go/large-RSA and unrelated
  browser fleets were not freshly rerun by these local commands.

An initial Chromium harness attempt passed two cases but failed its third
case's arbitrary 100-ms native-destruction observation. Native termination is
asynchronous. The harness now awaits actual destruction events with a strict
10-second deadline and still requires every real worker to be destroyed;
no assertion or production behavior is weakened. The fresh three-case rerun
above passed. That failed attempt is not counted as a successful run.

### First actual Android attempt and bounded fixture correction

Head `4aec811`'s [actual Android run](https://github.com/shdwelf/Html5/actions/runs/45583514112)
kept all original **14 cases passing**, but the new recovery phase timed out
(exit124, no complete XML). The runner reported a 120,000-ms cancellation-test
timeout, while guest LMKD reported low-memory/swap pressure. The host still
had 10,687 MiB available and the emulator remained present; this is not a
proven host OOM, exact native-crash diagnosis or successful new recovery gate.

The initial synthetic cancellation key used c=255. The pinned engine's
`GenericS2K.getCount/produceKey` allocates a **62-MiB hash input per derivation**
for that setting, before browser/native copies. The test fixture now explicitly
uses c=224 (**16 MiB**, also the upstream engine default) to bound its mobile
working set. This is a synthetic-fixture resource correction, not an assertion
bypass or a proven root-cause claim. All **256 real wrong guesses**, actual
reported progress, a live native worker, real foreground touches, every Stop /
Clear action, native termination, hidden results and no late progress remain
mandatory. The active worker's `recover` operation and total256 are additional
assertions. Production key/S2K policies, owner inputs, recovery limits, every
original test and every deadline remain unchanged. Phase-only recovery
milestones are retained separately from later audio/game noise.

Only the exact final head's successful Android job and structured per-phase
annotation can establish this new emulator gate. Final CI links/counts and the
merge decision are recorded on the associated pull request, not inferred from
local Chromium or an old head. The previous PR239 14-case pass is historical
and does not certify this new 17-case head.

## Still-open boundaries / next backlog order

This is a bounded synthetic **public APK / API-34 emulator** gate. It does not
certify every Android API/WebView, the network-flavor recovery workflow, a
physical handset, OpenKeychain, PGPony Android/iOS, Kleopatra, an owner key,
author identity or universal protected-key support. Other supported recovery
algorithms, file-picker wordlist ingestion, typo-variant generation, navigation
and timeout/error controls retain their separate unit/Chromium evidence; they
are not silently relabeled as additional Android coverage. Native termination
and dropping references are not guaranteed memory/clipboard/disk erasure.

Existing exact-recipient encrypted backups and PUBLIC originals remain
unchanged. No owner key/passphrase was requested, new cloud upload, encrypted
APK dispatch, owner recovery or public-key substitution was performed. Stable
Android signing/external-export recovery still needs owner-controlled setup;
do not uninstall a prior build to bypass a signing mismatch.

Keep external-client/physical-device acceptance separate. Finish block-anchored
per-deployment USDT/USDC evidence before stETH/wstETH, without runtime promotion
or real-fund transfers. Other ANC source localization/review and manuscript
synchronization still need their existing privacy/approval gates. This test
continuation does not mark those unrelated backlog items complete.
