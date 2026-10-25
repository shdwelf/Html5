# Abbottabad / "bin Laden hard drive" release — archival research note

*2026-10-23 · backlog streams S13 / S1 (T13.1, T1.1) · source-checked desk
research over the publicly released material only. Nothing was downloaded;
the CIA's own safety handling is summarised so a future local copy can be
preserved without executing anything.*

## What was actually released, and when

The material seized in the 2 May 2011 Abbottabad raid (5–10 computers,
~12 hard drives, 100+ disks/USB devices; 183 devices in the CIA's later
accounting) reached the public in stages:

| Date | Release | Contents |
| --- | --- | --- |
| May 2012 | Combating Terrorism Center, 17 documents | 175 pp. Arabic / 197 pp. English of internal letters (Sep 2006 – Apr 2011) |
| 20 May 2015 | ODNI "Bin Ladin's Bookshelf" #1 | English-language bookshelf list + declassified documents |
| 1 Mar 2016 | ODNI Bookshelf #2 | Further declassified documents |
| 19 Jan 2017 | ODNI Bookshelf #3 | Further declassified documents; ~700 distilled intelligence-value items total across ODNI tranches |
| **1 Nov 2017** | **CIA bulk release** | **~470,000 files** from the compound devices — 321 GB per CIA-era reporting (some secondary sources say 258 GB), 18,000+ document files, ~79,000 audio/image files, 10,000+ video files, a 228-page handwritten journal |
| 9 Nov 2017 | CIA repost | 3,935 files removed (operating-system and other copyrighted files, files posing a risk to users); Microsoft Office files converted to PDF; **executables converted to a format that no longer runs** |

Withheld throughout: copyright-protected material, material whose release
would damage national security, pornography, **malware**, and blank,
corrupt, or duplicate files. A mirror of the original 1 November posting
(including the later-removed files) was preserved by journalist/archivist
Emma Best on the Internet Archive — the provenance distinction matters:
the CIA repost is the defanged reference copy; the archive.org mirror is
the pre-review one.

## The "Ghidra / encryption" question (T1.1), answered

- **No encryption to speak of in the public material.** Contemporary
  reporting on the first CTC tranche noted the seized files were not
  encrypted; the compound's operational security was an air gap plus human
  couriers, not cryptography. No encrypted containers, TrueCrypt volumes,
  or password-protected archives are catalogued in the CIA/ODNI releases.
- **Ghidra has no target here.** The bulk release is documents, images,
  audio, and video. The executables it once contained were deliberately
  converted to a non-executable format before reposting, and actual
  malware was withheld entirely. There is nothing native to disassemble,
  and attempting to reconstruct runnable binaries from the pre-review
  mirror would defeat the releasing agency's own safety step — out of
  scope for this repository.
- **Forensic character of the corpus.** Analyses (notably RAND's 2021
  *Insights from the Bin Laden Archive*, RRA109-1) treat the 2017 release
  as a document/media archive: mixed drafts, propaganda production files,
  family media, cached web junk, pirated entertainment, and inadvertent
  computer viruses. The research value is documentary, not binary.

## Preservation guidance (if a local copy is ever taken)

1. Prefer the **CIA repost** (cia.gov/library/abbottabad-compound) as the
   reference copy; treat any archive.org mirror as a distinct, pre-review
   artifact with its own hashes.
2. BagIt on ingest with per-file SHA-256 (470k files — script it, verify
   the tagmanifest), exactly as with the drainer bag; record which posting
   (2017-11-01 vs 2017-11-09) the bytes came from.
3. The corpus is hostile-origin media even after defanging: keep it
   inert, never execute recovered binaries, and expect embedded malware
   in the pre-review set — CIA said as much when it pulled the first
   posting.
4. Copyright and sensitivity withholdings mean the public corpus is a
   subset by design; research conclusions should say "in the released
   material", not "on the drives".

## Sources

- CIA, *November 2017 Release of Abbottabad Compound Material* —
  https://www.cia.gov/library/abbottabad-compound/
- CIA, *CIA Releases Nearly 470,000 Additional Files…* (1 Nov 2017) —
  https://www.cia.gov/stories/story/cia-releases-nearly-470000-additional-files-recovered-in-may-2011-raid-on-usama-bin-ladins-compound/
- ODNI, *Bin Ladin's Bookshelf* (2015–2017 tranches) —
  https://www.odni.gov/index.php/features/bin-laden-s-bookshelf
- Ars Technica, *CIA releases 321 gigabytes of Bin Laden's digital library* (Nov 2017)
- BuzzFeed News, *CIA Reposts Bin Laden Documents After Removing 3,935 Files* (9 Nov 2017)
- RAND, *Insights from the Bin Laden Archive* (RRA109-1, 2021) —
  https://www.rand.org/pubs/research_reports/RRA109-1.html
- ZDNet, *Osama bin Laden didn't use encryption: 17 documents released* (May 2012)

Backlog status: T13.1 and the release-history half of T1.1 are closed by
this note; the Ghidra/encryption half of T1.1 is closed as *not applicable*
(no encrypted containers, no runnable binaries in the public release).
