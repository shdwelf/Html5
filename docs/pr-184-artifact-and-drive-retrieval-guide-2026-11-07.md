# PR #184 Android Offline Launcher APK — Artifact & Drive Backup Guide

**Date:** 2026-11-07  
**Branch:** `arena/33492adf-html5`  
**Reference Pull Request:** [#184 — Add offline Android HTML5 launcher](https://github.com/shdwelf/Html5/pull/184) (merged into `main` at commit `0c20a7b`)  
**Reference Storage Target:** User Google Drive folder titled `PR #184 — Android offline launcher APK retrieval record`

---

## 1. Summary

Pull Request #184 introduces the separate offline Android WebView launcher (`apps/html5-offline-launcher/`) packaging all 89 local HTML entrypoints in `public/apps/` without the `INTERNET` permission.

Because large binary artifacts (such as Android APKs) are excluded from direct Git tracking to keep repository clone sizes manageable, the APK binary was compiled and verified via GitHub Actions CI and retained as a build artifact.

This guide records the artifact provenance, explains the network boundary that prevents direct in-sandbox downloading to cloud storage, and details the manual retrieval and verification procedure.

---

## 2. GitHub Actions CI Runs & Artifact Metadata

Two workflow runs were executed under `.github/workflows/html5-offline-launcher-build.yml` for PR #184:

### Primary / Post-Conflict Resolution Run
- **Run ID:** [42374211665](https://github.com/shdwelf/Html5/actions/runs/42374211665)
- **Commit:** `474aee2` (conflict resolution merge with `main`)
- **Artifact ID:** `13575256030`
- **Artifact Name:** `html5-offline-launcher-debug-apk`
- **Archive Size:** 53,489,582 bytes (~53.5 MB)
- **Artifact SHA-256 Digest:** `22b1286c667ed587f00ec67397558f230b4fe2c609c0d53d7d58ee2e065f702a`
- **Created:** 2026-11-07T12:51:23Z
- **Expires:** 2026-12-07T12:51:20Z (30-day retention)

### Baseline PR Run
- **Run ID:** [42088907988](https://github.com/shdwelf/Html5/actions/runs/42088907988)
- **Commit:** `b7211a4`
- **Artifact Name:** `html5-offline-launcher-debug-apk`
- **Archive Size:** 53,448,870 bytes
- **Artifact SHA-256 Digest:** `2435398be178d3941e9147af447b6ebad353041d00c071d4bfbce85bf281d9d8`
- **Created:** 2026-11-05T18:56:46Z
- **Expires:** 2026-12-05T18:56:43Z

Both artifacts contain the debug-signed binary at internal path:
```text
app/build/outputs/apk/debug/app-debug.apk
```

---

## 3. Network Boundary & Drive Synchronization Notice

The sandbox workspace enforces outbound network restrictions limited exclusively to:
- `github.com`, `api.github.com`, `codeload.github.com`
- `registry.npmjs.org`, `pypi.org`, `files.pythonhosted.org`

When requesting artifact binary downloads via `gh run download` or GitHub REST endpoints, GitHub issues an `HTTP 302 Redirect` to Azure Blob Storage (`productionresultssa9.blob.core.windows.net`), which is unreachable within the sandboxed network perimeter (connection returns `EOF`).

Consequently, the sandbox cannot directly pipe the raw 53 MB binary into Google Drive. Instead, metadata records were updated directly in Google Drive to preserve tracking and verify integrity.

---

## 4. Google Drive Verification & Backup Steps

The destination Google Drive folder has been created and indexed:
- **Folder Name:** `PR #184 — Android offline launcher APK retrieval record`
- **Status Document:** `PR-184-APK-retrieval-status.md` (updated with both run IDs and digests)

### Instructions for Retaining the Binary:
1. Navigate in a browser to [Actions Run 42374211665](https://github.com/shdwelf/Html5/actions/runs/42374211665).
2. Download `html5-offline-launcher-debug-apk.zip` from the **Artifacts** table.
3. Validate the downloaded ZIP against SHA-256:
   `22b1286c667ed587f00ec67397558f230b4fe2c609c0d53d7d58ee2e065f702a`
4. Unpack `app-debug.apk`.
5. Upload `app-debug.apk` directly into the dedicated Drive folder.
