/**
 * Explicit source-level exclusions for public offline corpora.
 * Personal biography/family/education-history notes, operational archive
 * retrieval notes, and address-review candidates remain in their repository
 * locations but are not copied into the public Wiki or SITE-K XDC.
 */
export const PUBLIC_CORPUS_EXCLUDED_SOURCES = Object.freeze([
  "docs/README.md",
  "docs/greeran-book-ideas-backlog.md",
  "docs/greeran-commencement-research-2026-10-16.md",
  "docs/greeran-family-4dwm.md",
  "docs/greeran-family-tree-ebook-and-data-status.md",
  "docs/greeran-name-resources.md",
  "docs/scouting-field-trip-research-2026-11-01.md",
  "docs/sgreeran-resume-chronology.md",
  "docs/ucsb-2001-first-quarter-research.md",
  "docs/ucsb-course-readers-2026-10-23.md",
  // Operational backup and artifact-retrieval notes are not public app content.
  "docs/backlog-execution-round-63-2026-11-05.md",
  "docs/backlog-execution-round-65-2026-11-07.md",
  "docs/backlog-execution-round-66-2026-11-11.md",
  "docs/backlog-execution-round-67-2026-11-11.md",
  "docs/backlog-execution-round-68-2026-11-11.md",
  "docs/backlog-execution-round-69-2026-11-11.md",
  "docs/chipwright-restore-status-2026-10-22.md",
  "docs/drive-backup-2026-10-08.md",
  "docs/drive-backup-2026-10-17.md",
  "docs/drive-backup-wiki-2026-10-15.md",
  "docs/drive-repo-sync-2026-10-04.md",
  "docs/goddard-moka-exchange-research-2026-11-01.md",
  // Incoming Drive inventory and offline viewer implementation notes are
  // operational research artifacts, not part of the public bundled manual.
  "docs/google-drive-html5-xdc-integration-research-2026-11-11.md",
  "docs/html5-offline-launcher-v1-implementation-2026-11-05.md",
  "docs/offline-viewer-and-3d-pipeline-investigation-2026-11-11.md",
  "docs/pr-184-artifact-and-drive-retrieval-guide-2026-11-07.md",
  "docs/public-repository-privacy-audit-2026-11-04.md",
  "docs/wideband-nmu-public-evidence-2026-11-07.md",
  "docs/wiki-javacard-validation-2026-10-15.md",
  "docs/wiki-samples-vault-drive-map-2026-10-16.md",
  "docs/zangi-public-source-review-2026-11-04.md",
  "docs/github-wiki/Sneakers-Archive-and-Ghidra.md",
  "docs/github-wiki/Wiki-Samples-and-Vault.md",
  "docs/zlibrary-apk-ghidra-research-2026-10-13.md",
  // Conservative address-shaped candidates from the manual privacy scan.
  "4DWM_GODMODE_CODE_REVIEW.md",
  "docs/cyberchef-mystery-book-source-audit-2026-11-02.md",
]);
