# Backlog execution round 57 — 2026-11-04

## Focus

Continue the active Zangi → EFF → ACE research sequence. Preserve public-source
findings, and turn the temporary ACE Huffman experiment into a reviewable patch
and repeatable tests without importing third-party binaries or private artifacts
into the repository.

## Completed

### Zangi public-source review

Completed the requested order: official site → GitHub → F-Droid → Google Play →
APKPure → APKMonk → Archive.org. The public pages support a carefully bounded
summary of the publisher’s encryption and data-safety claims, but not an
independent security verdict. APKMonk was only available as an indexed cached
result; the F-Droid package URL returned 404; Archive.org’s located XAPK was an
older community upload. Full source register and limitations:
[`zangi-public-source-review-2026-11-04.md`](zangi-public-source-review-2026-11-04.md).

No private package payload, filename, identifier, link, or copied passage was
added to this repository.

### EFF source review

Checked the former Secure Messaging Scorecard page, its historical announcement
and archived PDF, and EFF audit/threat-model guidance. The scorecard is not a
current certification; no current Zangi-specific EFF evaluation, endorsement,
or audit was found. The EFF material is useful as a checklist, not as evidence
that Zangi is safe or compromised. Findings:
[`eff-secure-messaging-source-check-2026-11-04.md`](eff-secure-messaging-source-check-2026-11-04.md).

### ACE Huffman experiment

Saved the stable-sort/two-queue Huffman builder as a patch against
`seb3773/ace-c` commit `6cc986fbecf65137bc4657039fba1eb227e2e446`. Added the
upstream license notice, a 14,150-vector tree round-trip harness, a temporary
build/archive regression script, and a builder microbenchmark script. The
patch’s core tests and five generated ACE archive round trips pass. The measured
builder microbenchmark was 1.64× faster at the median in this sandbox; this is
not an end-to-end result. Details, reproducer commands, and limitations:
[`ace-huffman-two-queue-experiment-2026-11-04.md`](ace-huffman-two-queue-experiment-2026-11-04.md).

The existing `aceHeader` remains a header-only parser. This round inspected
ACE archive headers with `ace d` but did not produce machine-code disassembly of
an original WinACE compression routine. Independent WinACE interoperability is
also unverified.

### ACE `-2` CRC follow-up — 2026-11-07

A deterministic varying-offset fixture reproduced the shared baseline and
Huffman-only `-2` CRC failure; the same input passed under `-z`. Diagnosis showed
an encoder/decoder repeat-distance-history mismatch across blocked-mode switches,
not an error in the CRC algorithm. The separate
[`ace-c-lz77-distance-history.patch`](../patches/ace-c-lz77-distance-history.patch)
and
[`test-ace-c-distance-history-fix.sh`](../scripts/test-ace-c-distance-history-fix.sh)
reproduce the old failure class and verify integrity plus exact extraction for
three patterns after the fix. The exact temporary input from the earlier run was
not saved, so the new fixture is a representative reproducer, not a bit-for-bit
replay. Full scope and test results:
[`ace-delta-history-crc-fix-2026-11-07.md`](ace-delta-history-crc-fix-2026-11-07.md).

## Status and next gates

| Strand | Status | Remaining gate |
| --- | --- | --- |
| Zangi | Public-source review complete | Binary provenance, signature/hash verification, and behavior were not assessed; no package was executed. |
| EFF | Source review complete | None for the requested source check; EFF provides no current Zangi-specific evaluation in the sources located. |
| ACE | Source-level Huffman prototype plus a separately patched blocked-mode distance-history fix; both have repeatable tests | Original executable disassembly, independent WinACE-compatible interoperability, third-party fixtures, and cross-version tests remain open. The exact earlier temporary `-2` fixture was not saved; a representative failure class is reproduced and fixed by the new patch. |

No change was made to the Zangi app, the repository’s ACE parser, or the Wiki in
a Jar application code in this round.
