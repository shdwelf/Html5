# Backlog round 94 — PuTTY Android port and public-shell research

17 November 2026 report-series label, **not** a build/acquisition timestamp.
GitHub reports the successful build's start as `2026-11-26T14:31:55Z`;
exact run IDs and source commits below identify the evidence independently of
the retained filename. New user-directed follow-through on the mobile/SSH
strand; **not** a re-closure of an existing normalized backlog row.

## Ordered work

1. **GitHub PuTTY search:** name/Android repository queries, pinned tree/source
   checks, archived mirror/version distinctions and rejection of name-only or
   different-engine “ports.”
2. **Metasearch:** searx.space directory, requested BareSearch/Utilibre instances,
   usable ononoki multi-engine results and direct primary-source follow-through.
   Empty, irrelevant and failed responses remain distinct, not absence proofs.
3. **Android port:** real official PuTTY 0.85 Plink → Android ARM64/x86_64 native
   executables + private PTY bridge + line-oriented Java UI, mandatory server-key
   pin, no saved credentials. This is unofficial, not the PuTTY Windows/GTK GUI
   and not a full VT terminal. Source pins, full licence and exact build pipeline
   are in [`apps/putty-android`](../apps/putty-android/README.md).
4. **SDF validation:** corrected `freeshell.org` / `freewheel.org` mismatch using
   public fetches (SDF homepage versus domain-for-sale landing page). Established
   official `tty.sdf.org` SSH alias, `ssh new@sdf.org` signup, `validate` shell
   documentation pointer, MetaARPA sponsor and qualifying educational routes.
   Basic validation fee, the owner's account status and authenticated current
   SDF host-key fingerprints remain **unestablished**, not guessed.
5. **Other free shells:** source-checked envs.net, tilde.club, freeshell.de,
   tilde.institute, Blinkenshell and tilde.team. Included postcard, vouch/SMS,
   public-key and manual-approval requirements; tilde.team's published disabled
   SSH / compromise notice overrides its still-published signup form.

Full [investigation and comparison](putty-android-sdf-free-shell-investigation-2026-11-17.md)
and [structured source register](research/putty-sdf-free-shell-sources-2026-11-17.json)
are separate from public offline Wiki/SITE-K app corpora by explicit policy.

## Build / validation status

**Actual APK built, tested, fetched and SHA-256 read back.**

- [APK](../research/putty-android/unofficial-putty-0.85-review.apk): **792,988 B**
  (774.402 KiB compressed; not installed footprint).
- SHA-256: `644b8c16d1a1fdf8cf77f336434d310b5075bc10304d7b9a3e91b132a314a9cd`.
- Successful [run 45839948669](https://github.com/shdwelf/Html5/actions/runs/45839948669),
  check **139978662378**, actual measured source commit
  **`cf84be50547cd4507a2bc5b732af9f525b6d92be`**; artifact delivery commit
  **`6429f6c2`**. All recorded job steps succeeded, including official archive
  digest/signature verification, two-ABI build, lint, emulator, APK signature,
  exact packaged-native bytes and alignment checks. App/build source bytes
  were compared with the measured source; later research/policy additions do
  not imply that the APK was rebuilt at a later documentation head.
- **96** Java core controls, **9** Python source-fetch controls and **8** actual
  Android API 35 x86_64 instrumentation controls passed. Runtime controls prove
  packaged Plink 0.85 execution, mismatched-host-key refusal before a password
  prompt, synthetic trusted-key password/PTY login and command response, failed
  exec, child termination/reap, mask defaults and background/recreation clearing.
- Only a disposable loopback SSH server was used. ARM64 was compiled/inspected,
  **not run on owner hardware**. 16 KiB ELF alignment is **not** a 16 KiB-page
  runtime control. See the [receipt](../research/putty-android/build-receipt.json)
  and [signature output](../research/putty-android/apk-signature.txt).
- Review signing certificate SHA-256:
  `a6251b98d1ca1b4020bd530e6fd1cf78f3478c43df3f030e02f76bc0776fb446`.
  APK v2 signature verified by Android build-tools; disposable debug identity,
  not production/PuTTY upstream signing. Installed `debuggable=false`.

Historical failed runs **45838998405 / 45839440268** are retained separately:
the source archive's legitimate root directory initially hit an overly strict
layout guard. The fix did not weaken digest/signature/full-certificate, bounds
or traversal gates and added nine offline Python controls. A bounded redacted
Checks annotation wrapper was added because raw Actions-log CDN retrieval was
blocked; the diagnostic wrapper is not used as proof of test success.

Repository-wide regression and final PR delivery status are recorded in the
completion follow-through below; a successful Android job alone does not certify
unrelated repository code or any SDF membership.

## Backlog and owner gates

The normalized original register remains **31 terminal tasks: 30 done and
T9.3 declined**. No original task/status row is changed by this round. Historic
aggregate stream labels are not treated as reopened task authorizations.

- Zero public shell accounts created, enumerated, logged into, validated or
  recovered; no real user credentials supplied or tested.
- No payment, donation, postcard, IRC/email message, signup submission or
  publication. No script-piped-to-shell enrollment executed.
- Android integration is restricted to a disposable loopback runner SSH server;
  it cannot certify SDF membership, public-provider uptime or owner hardware.
- No physical ARM64 / 16 KiB-page runtime claim, production signing, full VT/SFTP
  implementation or private-key import is implied by the review build.
- OpenPGP fuzzy discovery remains display-only with exact cryptographic identity
  gates; its engine and key-authorization policy are untouched. No archive graph
  rescan, personal guestbook expansion or LoC-inclusion claim is introduced.
- Existing F2 preserve/inspect-only, unauthorized-key, owner-device, financial
  and draft-publication gates remain intact.

## Completion follow-through: repository regression and PR handoff

- Full **`npm test` exited 0** at
  **`7e549caccdbab071d066ba17551a247c0c9491fa`**: **38 Vitest files / 338 tests
  passed**; Node **1,327 tests, 1,308 passed, 19 skipped, zero failed or
  cancelled**. Skipped optional/platform controls are not promoted to passes.
- Focused artifact/corpus/privacy regression: **47/47 passed**. These tests
  overlap the full Node suite; the counts are not added together.
- Matching-head PR review at that commit succeeded:
  [run 45843074346](https://github.com/shdwelf/Html5/actions/runs/45843074346),
  check **139989551528**. It independently verified the exact delivered APK's
  v2 signature/certificate, native bytes, successful measured build and unchanged
  app/build source files, alongside core/source/focused controls. The independent
  OpenPGP Go check also passed, check **139989550927**.
- Delivery PR: **[#249](https://github.com/shdwelf/Html5/pull/249)**. Its live
  metadata is authoritative for the final review head, check results and merge
  state; historical merged PR #248 does not validate these changes. The PR was
  initially a draft while the full repository regression was still running.
- This final follow-through only clarifies report dating and records validation;
  it does not change the measured application, source-fetch/native tooling or
  APK. A matching-head delivered-APK review and independent Go check are required
  before making #249 ready and merging. No replacement debug signer or APK
  rebuild is needed for these documentation-only changes.

The APK is delivered and the public-documentation investigation is complete
within the stated scope. Production signing, full VT/key-import features,
physical-device tests, authenticated SDF host keys and actual owner membership
validation remain separate, **open** gates, not backlog completions.
