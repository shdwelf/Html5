/**
 * Explicit source-level exclusions for public offline corpora.
 * Personal biography/family/education-history notes, operational archive
 * retrieval notes, and address-review candidates remain in their repository
 * locations but are not copied into the public Wiki or SITE-K XDC.
 */
// These non-Markdown files contain private cloud inventory/references and must
// not be copied by the SITE-K/ADL docs-tree packer. The Wiki corpus contains
// only Markdown, so keep this list separate from its source exclusions.
export const PUBLIC_CORPUS_EXCLUDED_ASSETS = Object.freeze([
  "docs/agent-backlog-2026-10-21.json",
  "docs/drive-inventory-2026-10-04.json",
  // Dependency/recipient release-operations manifest, not offline manual data.
  "docs/research/openpgp-dependency-update-2026-11-17.json",
  "docs/research/openpgp-v6-native-interop-2026-11-17.json",
  "docs/research/openpgp-recovery-engines-2026-11-17.json",
  // Review-only editorial and deployment-capture provenance, not app manuals.
  "docs/research/token-deployment-capture-sources-2026-11-17.json",
  "docs/research/wordpress-waves-small-web-sources-2026-11-17.json",
  "docs/research/android-ssh-apk-sizes-2026-11-17.json",
  "docs/research/putty-sdf-free-shell-sources-2026-11-17.json",
  // Bounded external security/product and ISO-provenance review, not app manuals.
  "docs/research/android-vpn-i2p-kodachi-sources-2026-11-17.json",
  "docs/research/kodachi-iso-provenance-2026-11-17.json",
  "docs/research/kodachi-iso-acquisition-2026-11-17.json",
  "docs/research/kodachi-vpn-iso-inspection-2026-11-17.json",
  // Follow-up APK/source security review and fixed-literal evidence, not manuals.
  "docs/research/zshaolin-apk-investigation-2026-11-17.json",
  "docs/research/kodachi-supplemental-literal-2026-11-17.json",
  "docs/research/password-managers-torrent-sources-2026-11-17.json",
]);

export const PUBLIC_CORPUS_EXCLUDED_SOURCES = Object.freeze([
  "docs/README.md",
  "docs/greeran-book-ideas-backlog.md",
  "docs/greeran-commencement-research-2026-10-16.md",
  "docs/greeran-family-4dwm.md",
  "docs/greeran-family-tree-ebook-and-data-status.md",
  "docs/greeran-name-resources.md",
  "docs/greeran-memoir-intake-2026-11-15.md",
  "docs/scouting-field-trip-research-2026-11-01.md",
  "docs/sgreeran-resume-chronology.md",
  "docs/ucsb-2001-first-quarter-research.md",
  "docs/ucsb-course-readers-2026-10-23.md",
  // Personal-site archive investigation methods/evidence are operational
  // research, not approved content for public offline Wiki/SITE-K manuals.
  "docs/geocities-url-graph-investigation.md",
  // Operational backup and artifact-retrieval notes are not public app content.
  "docs/backlog-execution-round-63-2026-11-05.md",
  "docs/backlog-execution-round-65-2026-11-07.md",
  "docs/backlog-execution-round-66-2026-11-11.md",
  "docs/backlog-execution-round-67-2026-11-11.md",
  "docs/backlog-execution-round-68-2026-11-11.md",
  "docs/backlog-execution-round-69-2026-11-11.md",
  // Round 73 discusses private backups; never copy it into public offline apps.
  "docs/backlog-execution-round-73-2026-11-13.md",
  // Rounds 81–82 contain private handoff/backlog continuation context.
  "docs/backlog-execution-round-81-2026-11-17.md",
  "docs/backlog-execution-round-82-2026-11-15.md",
  // Rounds 83–84 include release operations and private handoff acceptance gates.
  "docs/backlog-execution-round-83-2026-11-17.md",
  "docs/backlog-execution-round-84-2026-11-17.md",
  // Round 85 includes release operations and the private backup recovery gate.
  "docs/backlog-execution-round-85-2026-11-17.md",
  // Round 86 and native-v6 evidence are operational validation/handoff notes.
  "docs/backlog-execution-round-86-2026-11-17.md",
  "docs/openpgp-v6-native-interop-2026-11-17.md",
  // Recovery validation/source-selection notes, not public offline manual data.
  "docs/openpgp-wordlist-recovery-2026-11-17.md",
  "docs/openpgp-android-recovery-2026-11-17.md",
  // Draft-only editorial research and per-deployment capture/identification
  // procedures are not approved additions to public offline manual bundles.
  "docs/token-deployment-capture-2026-11-17.md",
  "docs/waves-paper-practice-2026-11-17.md",
  "docs/wordpress-tiddlywiki-small-web-2026-11-17.md",
  "docs/android-ssh-apk-size-comparison-2026-11-17.md",
  // Android port delivery and public-account investigation are operational
  // research, not approved additions to the offline manual bundles.
  "docs/putty-android-sdf-free-shell-investigation-2026-11-17.md",
  "docs/backlog-execution-round-94-2026-11-17.md",
  // Security/product review and delivery notes stay outside public app manuals.
  "docs/android-vpn-i2p-kodachi-research-2026-11-17.md",
  "docs/password-managers-and-torrent-research-2026-11-17.md",
  "docs/backlog-execution-round-95-2026-11-17.md",
  "docs/kodachi-vpn-iso-inspection-2026-11-17.md",
  "docs/backlog-execution-round-96-2026-11-17.md",
  "docs/zshaolin-apk-and-kodachi-candidate-2026-11-17.md",
  "docs/android-a037u1-rooting-review.md",
  // Encrypted release handoff is operational, not public offline app content.
  "docs/openpgp-recipient-release-review-2026-11-17.md",
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
